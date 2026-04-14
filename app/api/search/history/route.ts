import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MAX_HISTORY = 10;

const logSchema = z.object({
  query: z.string().min(1).max(200),
  type: z.enum(["PARTS", "VEHICLES"]).default("PARTS"),
  resultCount: z.number().int().optional(),
});

/* ------------------------------------------------------------------ */
/*  POST /api/search/history — Uložit vyhledávání                     */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const body = await request.json();
    const data = logSchema.parse(body);

    // Smazat existující stejný dotaz (deduplikace)
    await prisma.searchQuery.deleteMany({
      where: { userId: session.user.id, query: data.query },
    });

    // Vytvořit nový záznam
    await prisma.searchQuery.create({
      data: {
        userId: session.user.id,
        query: data.query,
        type: data.type,
        resultCount: data.resultCount ?? null,
      },
    });

    // Ponechat max 10 — smazat nejstarší
    const all = await prisma.searchQuery.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (all.length > MAX_HISTORY) {
      const toDelete = all.slice(MAX_HISTORY).map((q) => q.id);
      await prisma.searchQuery.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data" }, { status: 400 });
    }
    console.error("POST /api/search/history error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/search/history — Posledních 10 vyhledávání                */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const queries = await prisma.searchQuery.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: MAX_HISTORY,
      select: { query: true, type: true, createdAt: true },
    });

    return NextResponse.json({ queries });
  } catch (error) {
    console.error("GET /api/search/history error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
