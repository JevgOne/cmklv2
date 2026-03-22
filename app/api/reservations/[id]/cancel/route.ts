import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

/* ------------------------------------------------------------------ */
/*  POST /api/reservations/[id]/cancel — Zrušení rezervace + refund    */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Uživatel nenalezen" }, { status: 404 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { listing: { select: { userId: true } } },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Rezervace nenalezena" }, { status: 404 });
    }

    // Ověřit oprávnění — kupující, vlastník inzerátu, nebo admin
    const isAdmin = user.role === "ADMIN" || user.role === "BACKOFFICE";
    const isBuyer = reservation.buyerEmail === user.email;
    const isOwner = reservation.listing.userId === session.user.id;

    if (!isBuyer && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    if (reservation.status !== "PAID" && reservation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Tuto rezervaci nelze zrušit" },
        { status: 400 }
      );
    }

    // Refund přes Stripe pokud bylo zaplaceno
    if (reservation.status === "PAID" && reservation.stripeSessionId) {
      try {
        const stripe = getStripe();
        const checkoutSession = await stripe.checkout.sessions.retrieve(
          reservation.stripeSessionId
        );

        if (checkoutSession.payment_intent && typeof checkoutSession.payment_intent === "string") {
          await stripe.refunds.create({
            payment_intent: checkoutSession.payment_intent,
          });
        }
      } catch (refundError) {
        console.error("Stripe refund error:", refundError);
        // Pokračovat — označit jako CANCELLED i pokud refund selže
      }
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: reservation.status === "PAID" ? "REFUNDED" : "CANCELLED",
      },
    });

    return NextResponse.json({ reservation: updated });
  } catch (error) {
    console.error("POST /api/reservations/[id]/cancel error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
