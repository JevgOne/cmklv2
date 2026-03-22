import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";

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
        if (metadata.promoType) {
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
      // Bundle — 30 inzerátů, prozatím jen logujeme (implementace kreditového systému v další fázi)
      console.log(`Bundle purchased for user, listing: ${listingId}`);
      break;
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
