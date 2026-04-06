import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { sendEmail } from "@/lib/resend";
import { createShipmentForOrder } from "@/lib/shipping/dispatcher";
import type { CreateShipmentResult } from "@/lib/shipping/types";

/* ------------------------------------------------------------------ */
/*  POST /api/stripe/webhook — Stripe webhook handler                  */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const stripe = getStripe();
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const metadata = session.metadata;

        if (!metadata) break;

        // Zpracování podle typu
        if (metadata.orderId) {
          await handleOrderPayment(metadata.orderId);
        } else if (metadata.promoType) {
          await handlePromoPayment(metadata);
        } else if (metadata.reservationId) {
          await handleReservationPayment(metadata.reservationId);
        } else if (metadata.cebiaReportId) {
          await handleCebiaPayment(metadata.cebiaReportId);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntent = charge.payment_intent;

        if (typeof paymentIntent === "string") {
          // Najít a aktualizovat rezervaci
          const reservation = await prisma.reservation.findFirst({
            where: { stripeSessionId: paymentIntent },
          });

          if (reservation) {
            await prisma.reservation.update({
              where: { id: reservation.id },
              data: { status: "REFUNDED" },
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Handlers                                                           */
/* ------------------------------------------------------------------ */

async function handlePromoPayment(metadata: Record<string, string>) {
  const { listingId, promoType } = metadata;

  if (!listingId || !promoType) return;

  switch (promoType) {
    case "TOP": {
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + 7);
      await prisma.listing.update({
        where: { id: listingId },
        data: { isPremium: true, premiumUntil },
      });
      break;
    }
    case "EXTEND": {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { expiresAt: true },
      });
      const baseDate = listing?.expiresAt && listing.expiresAt > new Date()
        ? listing.expiresAt
        : new Date();
      const newExpiry = new Date(baseDate);
      newExpiry.setDate(newExpiry.getDate() + 30);
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          expiresAt: newExpiry,
          status: "ACTIVE",
        },
      });
      break;
    }
    case "BUNDLE": {
      const bundleListing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { userId: true },
      });
      if (bundleListing?.userId) {
        await prisma.user.update({
          where: { id: bundleListing.userId },
          data: { listingCredits: { increment: 30 } },
        });
      }
      break;
    }
  }
}

async function handleOrderPayment(orderId: string) {
  // 1) Označit jako zaplaceno (musí se podařit vždy — kritický update)
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: "PAID" },
  });

  // 2) Vytvořit zásilku + odeslat emaily (errors nesmí shodit webhook)
  //    Webhook musí vracet 200, jinak Stripe retryuje donekonečna.
  try {
    const shipment = await createShipmentForOrder(orderId);

    // PICKUP → dispatcher vrátil null, nic neposíláme (zákazník si vyzvedává osobně)
    if (!shipment) {
      console.log(`[webhook] Order ${orderId}: PICKUP, shipment skipped`);
      return;
    }

    // 3) Odeslat placeholder emaily (zákazník + vrakoviště)
    await sendOrderNotificationEmails(orderId, shipment);
  } catch (err) {
    // Error v shipment nebo email → pouze log, webhook pokračuje normálně
    console.error(`[webhook] Shipment/email pipeline failed for order ${orderId}:`, err);
  }
}

async function handleReservationPayment(reservationId: string) {
  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "PAID" },
  });
}

async function handleCebiaPayment(cebiaReportId: string) {
  await prisma.cebiaReport.update({
    where: { id: cebiaReportId },
    data: { status: "PENDING" }, // Bude zpracováno CEBIA API
  });
}

/* ------------------------------------------------------------------ */
/*  sendOrderNotificationEmails — (A) zákazník + (B) vrakoviště        */
/*  Placeholder HTML — reálné templates dodá task #19                  */
/* ------------------------------------------------------------------ */
async function sendOrderNotificationEmails(
  orderId: string,
  shipment: CreateShipmentResult,
) {
  // Načíst order + items + supplier + partnerAccount (pro adresu vrakoviště)
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          part: { select: { name: true, partNumber: true } },
          supplier: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              companyName: true,
              partnerAccount: {
                select: { name: true, address: true, city: true, zip: true, email: true },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    console.error(`[email] Order ${orderId} not found when building notifications`);
    return;
  }

  const dryRunPrefix = shipment.dryRun ? "[DRY-RUN] " : "";

  // --- (A) Mail zákazníkovi ---------------------------------------------
  await sendEmail({
    to: order.deliveryEmail,
    subject: `${dryRunPrefix}Objednávka ${order.orderNumber} byla odeslána`,
    html: buildCustomerEmailHtml(order, shipment),
  });

  // --- (B) Mail(y) vrakovištím — per unikátní supplier ------------------
  // Seskupit položky podle supplierId
  const itemsBySupplier = new Map<string, typeof order.items>();
  for (const item of order.items) {
    const existing = itemsBySupplier.get(item.supplierId) ?? [];
    existing.push(item);
    itemsBySupplier.set(item.supplierId, existing);
  }

  for (const [supplierId, supplierItems] of itemsBySupplier) {
    const supplier = supplierItems[0].supplier;
    const recipientEmail = supplier.partnerAccount?.email ?? supplier.email;

    if (!recipientEmail) {
      console.warn(`[email] Supplier ${supplierId} has no email — skipping`);
      continue;
    }

    await sendEmail({
      to: recipientEmail,
      subject: `${dryRunPrefix}Nová objednávka k odeslání: ${order.orderNumber}`,
      html: buildSupplierEmailHtml(order, supplierItems, shipment, itemsBySupplier.size > 1),
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Placeholder HTML templaty — nahradí plnohodnotné v tasku #19       */
/* ------------------------------------------------------------------ */

function buildCustomerEmailHtml(
  order: { orderNumber: string; deliveryName: string; totalPrice: number },
  shipment: CreateShipmentResult,
): string {
  const priceCzk = order.totalPrice.toLocaleString("cs-CZ");
  const dryRunBanner = shipment.dryRun
    ? `<div style="background:#fff3cd;border:1px solid #ffeaa7;padding:12px;margin-bottom:16px;border-radius:4px;">
         <strong>DRY-RUN režim</strong> — tato zásilka nebyla skutečně vytvořena u dopravce.
         Pro produkční odeslání musí být nastaveny API klíče dopravců.
       </div>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      ${dryRunBanner}
      <h1 style="color:#F97316;">Děkujeme za objednávku!</h1>
      <p>Dobrý den ${order.deliveryName},</p>
      <p>Vaše objednávka <strong>${order.orderNumber}</strong> byla zaplacena a odeslána přes
      <strong>${shipment.carrier}</strong>.</p>

      <table style="border-collapse:collapse;width:100%;margin:16px 0;">
        <tr>
          <td style="padding:8px;border:1px solid #eee;"><strong>Číslo objednávky</strong></td>
          <td style="padding:8px;border:1px solid #eee;">${order.orderNumber}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #eee;"><strong>Celková cena</strong></td>
          <td style="padding:8px;border:1px solid #eee;">${priceCzk} Kč</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #eee;"><strong>Dopravce</strong></td>
          <td style="padding:8px;border:1px solid #eee;">${shipment.carrier}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #eee;"><strong>Tracking číslo</strong></td>
          <td style="padding:8px;border:1px solid #eee;"><code>${shipment.trackingNumber}</code></td>
        </tr>
      </table>

      <p style="margin:24px 0;">
        <a href="${shipment.trackingUrl}"
           style="background:#F97316;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">
           Sledovat zásilku
        </a>
      </p>

      <p style="color:#666;font-size:13px;margin-top:32px;">
        Tento email je automatický. Děkujeme, že nakupujete u CarMakleru.<br>
        V případě dotazů pište na <a href="mailto:info@carmakler.cz">info@carmakler.cz</a>.
      </p>
    </div>
  `;
}

function buildSupplierEmailHtml(
  order: {
    orderNumber: string;
    deliveryName: string;
    deliveryPhone: string;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryZip: string;
    deliveryMethod: string;
    zasilkovnaPointName: string | null;
  },
  items: Array<{
    quantity: number;
    part: { name: string; partNumber: string | null };
  }>,
  shipment: CreateShipmentResult,
  hasMultipleSuppliers: boolean,
): string {
  const dryRunBanner = shipment.dryRun
    ? `<div style="background:#fff3cd;border:1px solid #ffeaa7;padding:12px;margin-bottom:16px;border-radius:4px;">
         <strong>DRY-RUN režim</strong> — toto je jen test, štítek není skutečný.
       </div>`
    : "";

  const multiSupplierWarning = hasMultipleSuppliers
    ? `<div style="background:#fef2f2;border:1px solid #fecaca;padding:12px;margin:16px 0;border-radius:4px;">
         <strong>Pozor:</strong> Tato objednávka obsahuje položky od více dodavatelů.
         Kontaktujte prosím BackOffice CarMakler pro koordinaci balení a odeslání.
       </div>`
    : "";

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border:1px solid #eee;">${item.part.name}</td>
          <td style="padding:8px;border:1px solid #eee;">${item.part.partNumber ?? "—"}</td>
          <td style="padding:8px;border:1px solid #eee;text-align:right;">${item.quantity}×</td>
        </tr>`,
    )
    .join("");

  const deliveryInfo =
    order.deliveryMethod === "ZASILKOVNA" && order.zasilkovnaPointName
      ? `<p><strong>Výdejní místo Zásilkovny:</strong> ${order.zasilkovnaPointName}</p>`
      : `<p><strong>Doručovací adresa:</strong><br>
         ${order.deliveryName}<br>
         ${order.deliveryAddress}<br>
         ${order.deliveryZip} ${order.deliveryCity}<br>
         Tel: ${order.deliveryPhone}</p>`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      ${dryRunBanner}
      <h1 style="color:#F97316;">Nová objednávka k odeslání</h1>
      <p>Objednávka <strong>${order.orderNumber}</strong> byla zaplacena. Prosíme, zabalte níže uvedené
      položky a vytiskněte přepravní štítek.</p>

      ${multiSupplierWarning}

      <h2 style="font-size:16px;margin-top:24px;">Položky k odeslání</h2>
      <table style="border-collapse:collapse;width:100%;margin:8px 0;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:8px;border:1px solid #eee;text-align:left;">Díl</th>
            <th style="padding:8px;border:1px solid #eee;text-align:left;">Part Number</th>
            <th style="padding:8px;border:1px solid #eee;text-align:right;">Ks</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <h2 style="font-size:16px;margin-top:24px;">Doručení</h2>
      ${deliveryInfo}
      <p><strong>Dopravce:</strong> ${shipment.carrier}</p>
      <p><strong>Tracking:</strong> <code>${shipment.trackingNumber}</code></p>

      <p style="margin:24px 0;">
        <a href="${shipment.labelUrl}"
           style="background:#F97316;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">
           Stáhnout PDF štítek
        </a>
      </p>

      <p style="color:#666;font-size:13px;margin-top:32px;">
        Po zabalení nalepte štítek a předejte zásilku dopravci.<br>
        V případě problémů kontaktujte <a href="mailto:info@carmakler.cz">info@carmakler.cz</a>.
      </p>
    </div>
  `;
}
