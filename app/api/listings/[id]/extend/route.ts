import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

/* ------------------------------------------------------------------ */
/*  POST /api/listings/[id]/extend — Prodloužení inzerátu přes Stripe  */
/* ------------------------------------------------------------------ */

const EXTEND_PRICE = 9900; // 99 Kč v haléřích
const EXTEND_DAYS = 30;

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

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { userId: true, status: true, brand: true, model: true, year: true, expiresAt: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Inzerát nenalezen" }, { status: 404 });
    }

    if (listing.userId !== session.user.id) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    if (listing.status !== "ACTIVE" && listing.status !== "EXPIRED") {
      return NextResponse.json(
        { error: "Inzerát nelze prodloužit" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "czk",
            product_data: {
              name: `Prodloužení inzerátu (${EXTEND_DAYS} dní)`,
              description: `${listing.brand} ${listing.model} (${listing.year})`,
            },
            unit_amount: EXTEND_PRICE,
          },
          quantity: 1,
        },
      ],
      metadata: {
        listingId: id,
        promoType: "EXTEND",
        userId: session.user.id,
      },
      success_url: `${process.env.NEXTAUTH_URL}/moje-inzeraty/${id}?extended=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/moje-inzeraty/${id}`,
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("POST /api/listings/[id]/extend error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
