import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/listings/[id]/stats — Statistiky inzerátu                */
/* ------------------------------------------------------------------ */

export async function GET(
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
      select: {
        id: true,
        userId: true,
        viewCount: true,
        inquiryCount: true,
        isPremium: true,
        premiumUntil: true,
        status: true,
        createdAt: true,
        publishedAt: true,
        _count: { select: { inquiries: true } },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Inzerát nenalezen" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (listing.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    return NextResponse.json({
      views: listing.viewCount,
      inquiries: listing._count.inquiries,
      isPremium: listing.isPremium,
      premiumUntil: listing.premiumUntil,
      status: listing.status,
      createdAt: listing.createdAt,
      publishedAt: listing.publishedAt,
    });
  } catch (error) {
    console.error("GET /api/listings/[id]/stats error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
