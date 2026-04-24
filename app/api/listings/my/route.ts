import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/listings/my — Inzeráty přihlášeného uživatele             */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const [listings, user] = await Promise.all([
      prisma.listing.findMany({
        where: { userId: session.user.id },
        include: {
          images: { orderBy: { order: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { accountType: true, listingCredits: true },
      }),
    ]);

    const accountType = user?.accountType || "PRIVATE";
    const baseLimits: Record<string, number | null> = {
      PRIVATE: 1,
      BAZAAR: 10,
      DEALER: null,
    };
    const base = baseLimits[accountType] ?? 1;
    const maxListings = base === null ? null : base + (user?.listingCredits ?? 0);

    return NextResponse.json({ listings, accountType, maxListings });
  } catch (error) {
    console.error("GET /api/listings/my error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
