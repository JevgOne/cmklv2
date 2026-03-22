import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

/* ------------------------------------------------------------------ */
/*  Cenové balíčky pro zvýraznění                                      */
/* ------------------------------------------------------------------ */

const PROMO_PRICES = {
  TOP: { amount: 19900, days: 7, label: "TOP inzerát (7 dní)" },
  EXTEND: { amount: 9900, days: 30, label: "Prodloužení (30 dní)" },
  BUNDLE: { amount: 199000, count: 30, label: "Balíček 30 inzerátů" },
} as const;

type PromoType = keyof typeof PROMO_PRICES;

/* ------------------------------------------------------------------ */
/*  Zod schema                                                         */
/* ------------------------------------------------------------------ */

const promoteSchema = z.object({
  type: z.enum(["TOP", "EXTEND", "BUNDLE"]).default("TOP"),
  paymentMethod: z.enum(["stripe"]).default("stripe"),
});

/* ------------------------------------------------------------------ */
/*  POST /api/listings/[id]/promote — Zvýraznění inzerátu přes Stripe  */
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
    const body = await request.json();
    const data = promoteSchema.parse(body);

    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { userId: true, status: true, brand: true, model: true, year: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Inzerát nenalezen" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    if (existing.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Pouze aktivní inzeráty lze zvýraznit" },
        { status: 400 }
      );
    }

    const promoConfig = PROMO_PRICES[data.type as PromoType];

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
              name: promoConfig.label,
              description: `${existing.brand} ${existing.model} (${existing.year})`,
            },
            unit_amount: promoConfig.amount, // v haléřích
          },
          quantity: 1,
        },
      ],
      metadata: {
        listingId: id,
        promoType: data.type,
        userId: session.user.id,
      },
      success_url: `${process.env.NEXTAUTH_URL}/moje-inzeraty/${id}?promoted=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/moje-inzeraty/${id}`,
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/listings/[id]/promote error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
