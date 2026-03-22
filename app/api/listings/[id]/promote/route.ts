import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/listings/[id]/promote — Zvýraznění inzerátu (TOP)       */
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

    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { userId: true, status: true },
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

    // Premium na 7 dní (v MVP zdarma, v produkci přes Stripe)
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + 7);

    const listing = await prisma.listing.update({
      where: { id },
      data: {
        isPremium: true,
        premiumUntil,
      },
    });

    return NextResponse.json({ listing });
  } catch (error) {
    console.error("POST /api/listings/[id]/promote error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
