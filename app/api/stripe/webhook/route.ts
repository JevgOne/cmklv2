import type Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { syncAccountToDb } from "@/lib/stripe-connect";
import { sendEmail } from "@/lib/resend";
import { createShipmentForOrder } from "@/lib/shipping/dispatcher";
import type { CreateShipmentResult } from "@/lib/shipping/types";
import {
  orderConfirmationCustomerHtml,
  orderConfirmationCustomerText,
  orderConfirmationCustomerSubject,
  type OrderConfirmationCustomerData,
} from "@/lib/email-templates/order-confirmation-customer";
import {
  orderNotificationSupplierHtml,
  orderNotificationSupplierText,
  orderNotificationSupplierSubject,
  type OrderNotificationSupplierData,
} from "@/lib/email-templates/order-notification-supplier";

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

      case "account.updated": {
        await handleStripeAccountUpdate(event.data.object as Stripe.Account);
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

  // 2) Commission split — snapshot do OrderItem + Stripe Connect transfer.
  //    Errors nesmí shodit webhook (Stripe by retryoval = duplicate emaily).
  try {
    await applyCommissionSplit(orderId);
  } catch (err) {
    console.error(`[webhook] applyCommissionSplit failed for order ${orderId}:`, err);
  }

  // 3) Vytvořit zásilky per SubOrder + odeslat emaily (errors nesmí shodit webhook)
  //    Webhook musí vracet 200, jinak Stripe retryuje donekonečna.
  try {
    const shipments = await createShipmentForOrder(orderId);

    // Žádné zásilky (všechny SubOrders jsou PICKUP)
    if (shipments.length === 0) {
      console.log(`[webhook] Order ${orderId}: all PICKUP, shipments skipped`);
      return;
    }

    // Odeslat emaily s prvním shipmentem (zpětná kompatibilita)
    await sendOrderNotificationEmails(orderId, shipments[0]);
  } catch (err) {
    // Error v shipment nebo email → pouze log, webhook pokračuje normálně
    console.error(`[webhook] Shipment/email pipeline failed for order ${orderId}:`, err);
  }
}

/**
 * Snapshot komise pro každý OrderItem + best-effort Stripe Connect transfer.
 * DB snapshot je zdroj pravdy; transfer je graceful fallback (chybějící
 * stripeAccountId → manuální vyplacení podle snapshotu).
 */
async function applyCommissionSplit(orderId: string) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: {
      supplier: {
        include: {
          partnerAccount: {
            select: {
              id: true,
              name: true,
              commissionRate: true,
              stripeAccountId: true,
            },
          },
        },
      },
    },
  });

  if (items.length === 0) return;

  // Snapshot updaty jsou nezávislé (každý WHERE by id), takže paralelně.
  // Replay guard: skip pokud už má snapshot — webhook může být doručen vícekrát.
  const stripe = getStripe();
  const splits = items
    .filter((item) => item.commissionRateApplied === null)
    .map((item) => {
      const partner = item.supplier.partnerAccount;
      // Default 15 % pokud supplier nemá partnerAccount (legacy / non-vrakoviště).
      const commissionRate = Number(partner?.commissionRate ?? 15);
      const gross = item.totalPrice;
      const carmaklerFee = Math.round((gross * commissionRate) / 100);
      const supplierPayout = gross - carmaklerFee;
      return { item, partner, commissionRate, carmaklerFee, supplierPayout };
    });

  await Promise.all(
    splits.map(({ item, commissionRate, carmaklerFee, supplierPayout }) =>
      prisma.orderItem.update({
        where: { id: item.id },
        data: {
          commissionRateApplied: commissionRate,
          carmaklerFee,
          supplierPayout,
        },
      })
    )
  );

  // Transfery serializujeme — backpressure proti Stripe rate limitům + jasný
  // log při per-item failures. idempotencyKey chrání před duplicitou při replay.
  for (const { item, partner, commissionRate, supplierPayout } of splits) {
    if (!partner?.stripeAccountId) {
      console.warn(
        `[webhook] Partner ${partner?.id ?? "(unknown)"} bez stripeAccountId — ` +
          `transfer skipped pro OrderItem ${item.id} (manuální vyplacení).`
      );
      continue;
    }

    try {
      await stripe.transfers.create(
        {
          amount: supplierPayout,
          currency: "czk",
          destination: partner.stripeAccountId,
          transfer_group: `order_${orderId}`,
          metadata: {
            orderId,
            orderItemId: item.id,
            partnerId: partner.id,
            commissionRate: String(commissionRate),
          },
        },
        { idempotencyKey: `commission_${orderId}_${item.id}` }
      );
    } catch (err) {
      console.error(
        `[webhook] Stripe transfer failed for OrderItem ${item.id}:`,
        err
      );
    }
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
/*  Reálné šablony z lib/email-templates/ — task #19                   */
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

  // Seskupit položky podle supplierId (potřebujeme pro multi-supplier warning + loop níže)
  const itemsBySupplier = new Map<string, typeof order.items>();
  for (const item of order.items) {
    const existing = itemsBySupplier.get(item.supplierId) ?? [];
    existing.push(item);
    itemsBySupplier.set(item.supplierId, existing);
  }

  // --- (A) Mail zákazníkovi ---------------------------------------------
  const customerData: OrderConfirmationCustomerData = {
    orderNumber: order.orderNumber,
    customerName: order.deliveryName,
    totalPrice: order.totalPrice,
    deliveryMethod: order.deliveryMethod,
    carrier: shipment.carrier,
    trackingNumber: shipment.trackingNumber,
    trackingUrl: shipment.trackingUrl,
    zasilkovnaPointName: order.zasilkovnaPointName,
    deliveryAddress:
      order.deliveryMethod === "ZASILKOVNA"
        ? null
        : {
            name: order.deliveryName,
            street: order.deliveryAddress,
            city: order.deliveryCity,
            zip: order.deliveryZip,
          },
    items: order.items.map((it) => ({
      name: it.part.name,
      quantity: it.quantity,
      price: it.unitPrice,
    })),
    dryRun: shipment.dryRun,
  };

  await sendEmail({
    to: order.deliveryEmail,
    subject: orderConfirmationCustomerSubject(customerData),
    html: orderConfirmationCustomerHtml(customerData),
    text: orderConfirmationCustomerText(customerData),
  });

  // --- (B) Mail(y) vrakovištím — per unikátní supplier ------------------
  for (const [supplierId, supplierItems] of itemsBySupplier) {
    const supplier = supplierItems[0].supplier;
    const recipientEmail = supplier.partnerAccount?.email ?? supplier.email;

    if (!recipientEmail) {
      console.warn(`[email] Supplier ${supplierId} has no email — skipping`);
      continue;
    }

    const fallbackName = `${supplier.firstName ?? ""} ${supplier.lastName ?? ""}`.trim();
    const supplierName =
      supplier.partnerAccount?.name ??
      supplier.companyName ??
      (fallbackName !== "" ? fallbackName : "Dodavatel");

    const supplierData: OrderNotificationSupplierData = {
      orderNumber: order.orderNumber,
      supplierName,
      items: supplierItems.map((it) => ({
        name: it.part.name,
        partNumber: it.part.partNumber,
        quantity: it.quantity,
      })),
      delivery: {
        method: order.deliveryMethod,
        carrier: shipment.carrier,
        trackingNumber: shipment.trackingNumber,
        labelUrl: shipment.labelUrl,
        zasilkovnaPointName: order.zasilkovnaPointName,
        address:
          order.deliveryMethod === "ZASILKOVNA"
            ? null
            : {
                name: order.deliveryName,
                phone: order.deliveryPhone,
                street: order.deliveryAddress,
                city: order.deliveryCity,
                zip: order.deliveryZip,
              },
      },
      hasMultipleSuppliers: itemsBySupplier.size > 1,
      dryRun: shipment.dryRun,
    };

    await sendEmail({
      to: recipientEmail,
      subject: orderNotificationSupplierSubject(supplierData),
      html: orderNotificationSupplierHtml(supplierData),
      text: orderNotificationSupplierText(supplierData),
    });
  }
}

/**
 * Zpracovává Stripe `account.updated` eventy z Connect Express onboardingu.
 * Lookuje partnera podle stripeAccountId a sync-uje state do DB přes sdílený
 * helper. MUSÍ never throw — webhook vrací 200, jinak Stripe retryuje.
 */
async function handleStripeAccountUpdate(account: Stripe.Account) {
  try {
    const partner = await prisma.partner.findFirst({
      where: { stripeAccountId: account.id },
      select: { id: true },
    });

    if (!partner) {
      // Account není v našem systému — smazaný Partner záznam, Stripe test
      // event, nebo account z jiné aplikace. Log + ignore.
      console.warn(
        `[webhook] account.updated for unknown Stripe account ${account.id} — ignoring`,
      );
      return;
    }

    await syncAccountToDb(partner.id, account);
    console.log(
      `[webhook] Synced Stripe account ${account.id} → partner ${partner.id}: ` +
        `detailsSubmitted=${account.details_submitted}, payoutsEnabled=${account.payouts_enabled}`,
    );
  } catch (error) {
    console.error(
      `[webhook] handleStripeAccountUpdate failed for ${account.id}:`,
      error,
    );
  }
}
