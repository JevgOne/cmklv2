import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, generateVariableSymbol, CARMAKLER_BANK } from "@/lib/stripe";
import { createCheckoutSchema } from "@/lib/validators/payment";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { vehicleId, buyerName, buyerEmail, buyerPhone, method } =
      parsed.data;

    // Najít vozidlo
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        broker: { select: { firstName: true, lastName: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno" },
        { status: 404 }
      );
    }

    if (vehicle.status !== "RESERVED") {
      return NextResponse.json(
        { error: "Vozidlo musí být ve stavu RESERVED pro platbu" },
        { status: 400 }
      );
    }

    const amount = vehicle.reservedPrice || vehicle.price;

    if (method === "CARD") {
      // Stripe Checkout Session
      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "czk",
              product_data: {
                name: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
                description: vehicle.variant || undefined,
                images: vehicle.images[0]?.url
                  ? [vehicle.images[0].url]
                  : undefined,
              },
              unit_amount: amount * 100, // Stripe v haléřích
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXTAUTH_URL}/nabidka/${vehicle.slug}/platba/uspech?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/nabidka/${vehicle.slug}/platba?cancelled=true`,
        customer_email: buyerEmail,
        metadata: {
          vehicleId: vehicle.id,
          buyerName,
          buyerPhone: buyerPhone || "",
        },
      });

      // Vytvořit Payment záznam
      await prisma.payment.create({
        data: {
          vehicleId: vehicle.id,
          buyerName,
          buyerEmail,
          buyerPhone,
          amount,
          method: "CARD",
          status: "PROCESSING",
          stripeSessionId: session.id,
        },
      });

      return NextResponse.json({ url: session.url });
    }

    if (method === "BANK_TRANSFER") {
      const variableSymbol = generateVariableSymbol(vehicle.id);

      // Vytvořit Payment záznam pro převod
      const payment = await prisma.payment.create({
        data: {
          vehicleId: vehicle.id,
          buyerName,
          buyerEmail,
          buyerPhone,
          amount,
          method: "BANK_TRANSFER",
          status: "PENDING",
          variableSymbol,
        },
      });

      return NextResponse.json({
        paymentId: payment.id,
        bankDetails: {
          accountNumber: CARMAKLER_BANK.accountNumber,
          iban: CARMAKLER_BANK.iban,
          bic: CARMAKLER_BANK.bic,
          bankName: CARMAKLER_BANK.bankName,
          accountHolder: CARMAKLER_BANK.accountHolder,
          amount,
          variableSymbol,
          message: `Platba za ${vehicle.brand} ${vehicle.model}`,
        },
      });
    }

    if (method === "FINANCING") {
      // Financování — vytvořit záznam a čekat na platbu od leasingové společnosti
      const variableSymbol = generateVariableSymbol(vehicle.id);

      const payment = await prisma.payment.create({
        data: {
          vehicleId: vehicle.id,
          buyerName,
          buyerEmail,
          buyerPhone,
          amount,
          method: "FINANCING",
          status: "PENDING",
          variableSymbol,
        },
      });

      return NextResponse.json({
        paymentId: payment.id,
        message:
          "Platba bude zpracována po schválení financování. Budete kontaktováni.",
      });
    }

    return NextResponse.json(
      { error: "Nepodporovaná platební metoda" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Create checkout error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
