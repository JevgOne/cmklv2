import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/buyer/stats — Statistiky kupujícího                       */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const [favorites, watchdogs, inquiries] = await Promise.all([
      prisma.favorite.count({ where: { userId: session.user.id } }),
      prisma.watchdog.count({ where: { userId: session.user.id, active: true } }),
      prisma.inquiry.count({ where: { senderId: session.user.id } }),
    ]);

    return NextResponse.json({ favorites, watchdogs, inquiries });
  } catch (error) {
    console.error("GET /api/buyer/stats error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
