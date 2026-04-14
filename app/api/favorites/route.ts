import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/favorites — Přidat/odebrat oblíbený inzerát (toggle)    */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const { listingId, partId } = await request.json();
    if (!listingId && !partId) {
      return NextResponse.json({ error: "listingId nebo partId je povinné" }, { status: 400 });
    }

    // Toggle: pokud existuje → smazat, jinak → přidat
    const whereUnique = listingId
      ? { userId_listingId: { userId: session.user.id, listingId } }
      : { userId_partId: { userId: session.user.id, partId: partId! } };

    const existing = await prisma.favorite.findUnique({ where: whereUnique });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    await prisma.favorite.create({
      data: {
        userId: session.user.id,
        ...(listingId ? { listingId } : { partId }),
      },
    });

    return NextResponse.json({ favorited: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/favorites error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/favorites — Seznam oblíbených inzerátů                   */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        listing: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
        part: {
          select: {
            id: true, name: true, slug: true, price: true, stock: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("GET /api/favorites error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
