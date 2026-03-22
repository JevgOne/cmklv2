import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/cebia/report/[id] — Výsledek CEBIA reportu                */
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

    const report = await prisma.cebiaReport.findUnique({
      where: { id },
      include: {
        listing: {
          select: { id: true, brand: true, model: true, year: true, vin: true },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report nenalezen" }, { status: 404 });
    }

    // Ověřit oprávnění — objednavatel nebo admin
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (report.orderedById !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("GET /api/cebia/report/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
