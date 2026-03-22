import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, STRIPE_WEBHOOK_SECRET, calculateCommission } from "@/lib/stripe";

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

async function createPayoutRecords(
  paymentId: string,
  vehicleId: string,
  amount: number
) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      broker: { select: { id: true, managerId: true } },
      contracts: {
        where: { type: "BROKERAGE" },
        select: { sellerName: true, sellerBankAccount: true },
        take: 1,
      },
    },
  });

  if (!vehicle) return;

  const { commission, brokerShare, companyShare, managerBonus, sellerPayout } =
    calculateCommission(amount);

  // Aktualizovat / vytvořit Commission záznam
  const existingCommission = await prisma.commission.findFirst({
    where: { vehicleId, brokerId: vehicle.brokerId || "" },
  });

  if (existingCommission) {
    await prisma.commission.update({
      where: { id: existingCommission.id },
      data: {
        salePrice: amount,
        commission,
        brokerShare,
        companyShare,
        managerBonus,
        status: "APPROVED",
      },
    });
  } else if (vehicle.brokerId) {
    await prisma.commission.create({
      data: {
        brokerId: vehicle.brokerId,
        vehicleId,
        salePrice: amount,
        commission,
        rate: commission / amount,
        brokerShare,
        companyShare,
        managerBonus,
        status: "APPROVED",
        soldAt: new Date(),
      },
    });
  }

  // Vytvořit SellerPayout
  const contract = vehicle.contracts[0];
  await prisma.sellerPayout.create({
    data: {
      vehicleId,
      paymentId,
      sellerName: contract?.sellerName || vehicle.sellerName || "Neznámý",
      sellerBankAccount: contract?.sellerBankAccount || "",
      amount: sellerPayout,
      commissionAmount: commission,
      status: "PENDING",
    },
  });
}
