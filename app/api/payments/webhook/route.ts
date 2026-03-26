import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, STRIPE_WEBHOOK_SECRET, createPayoutRecords } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Chybí Stripe podpis" },
        { status: 400 }
      );
    }

    let event;
    try {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Neplatný webhook podpis" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const vehicleId = session.metadata?.vehicleId;

        if (!vehicleId) break;

        // Aktualizovat platbu
        const payment = await prisma.payment.findFirst({
          where: { stripeSessionId: session.id },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "PAID",
              stripePaymentIntent:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : session.payment_intent?.id || null,
              confirmedAt: new Date(),
            },
          });

          // Aktualizovat stav vozidla
          await prisma.vehicle.update({
            where: { id: vehicleId },
            data: { status: "PAID" },
          });

          // Vytvořit SellerPayout a rozdělit provizi
          await createPayoutRecords(payment.id, vehicleId, payment.amount);

          // Notifikace makléři
          const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            select: { brokerId: true, brand: true, model: true },
          });

          if (vehicle?.brokerId) {
            await prisma.notification.create({
              data: {
                userId: vehicle.brokerId,
                type: "COMMISSION",
                title: "Platba přijata",
                body: `Platba za ${vehicle.brand} ${vehicle.model} byla úspěšně přijata kartou. Domluvte předání vozidla.`,
                link: `/makler/vehicles/${vehicleId}`,
              },
            });
          }

          // Email kupujícímu
          const vehicleName = vehicle
            ? `${vehicle.brand} ${vehicle.model}`
            : "vozidlo";
          try {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL || "info@carmakler.cz",
              to: payment.buyerEmail,
              subject: "Potvrzení platby | Carmakler",
              html: `<p>Vaše platba ${payment.amount.toLocaleString("cs-CZ")} Kč za ${vehicleName} byla přijata.</p><p>Děkujeme za nákup přes Carmakler.</p>`,
              text: `Vaše platba ${payment.amount.toLocaleString("cs-CZ")} Kč za ${vehicleName} byla přijata. Děkujeme za nákup přes Carmakler.`,
            });
          } catch (emailErr) {
            console.error("Failed to send payment confirmation email:", emailErr);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const failedPayment = await prisma.payment.findFirst({
          where: { stripePaymentIntent: paymentIntent.id },
        });

        if (failedPayment) {
          await prisma.payment.update({
            where: { id: failedPayment.id },
            data: { status: "FAILED" },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

