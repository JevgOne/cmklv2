import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

/* ------------------------------------------------------------------ */
/*  POST /api/listings/[id]/reserve — Rezervace inzerátu (kauce 5000)  */
/* ------------------------------------------------------------------ */

const RESERVATION_AMOUNT = 500000; // 5000 Kč v haléřích
const RESERVATION_HOURS = 48;

const reserveSchema = z.object({
  buyerName: z.string().min(1, "Jméno je povinné"),
  buyerEmail: z.string().email("Neplatný email"),
  buyerPhone: z.string().min(9, "Telefon je povinný"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = reserveSchema.parse(body);

    // Ověřit, že inzerát existuje, je aktivní a je makléřský/partnerský
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        status: true,
        listingTier: true,
        listingType: true,
        brand: true,
        model: true,
        year: true,
      },
    });

    if (!listing || listing.status !== "ACTIVE") {
      return NextResponse.json({ error: "Inzerát nenalezen nebo není aktivní" }, { status: 404 });
    }

    // Rezervace jen pro makléřské a partnerské inzeráty
    if (listing.listingType === "PRIVATE" && listing.listingTier === "PRIVATE") {
      return NextResponse.json(
        { error: "Rezervace je dostupná pouze pro makléřské a partnerské inzeráty" },
        { status: 400 }
      );
    }

    // Ověřit, že neexistuje aktivní rezervace
    const activeReservation = await prisma.reservation.findFirst({
      where: {
        listingId: id,
        status: { in: ["PENDING", "PAID"] },
      },
    });

    if (activeReservation) {
      return NextResponse.json(
        { error: "Tento inzerát je již rezervován" },
        { status: 409 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESERVATION_HOURS);

    // Vytvořit rezervaci
    const reservation = await prisma.reservation.create({
      data: {
        listingId: id,
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerPhone: data.buyerPhone,
        amount: 5000,
        expiresAt,
      },
    });

    // Vytvořit Stripe Checkout session
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "czk",
            product_data: {
              name: "Rezervace vozidla",
              description: `${listing.brand} ${listing.model} (${listing.year}) — vratná kauce`,
            },
            unit_amount: RESERVATION_AMOUNT,
          },
          quantity: 1,
        },
      ],
      metadata: {
        reservationId: reservation.id,
        listingId: id,
      },
      customer_email: data.buyerEmail,
      success_url: `${process.env.NEXTAUTH_URL}/nabidka/${listing.slug}?reserved=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/nabidka/${listing.slug}`,
    });

    // Uložit Stripe session ID
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({
      reservation,
      checkoutUrl: checkoutSession.url,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/listings/[id]/reserve error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
