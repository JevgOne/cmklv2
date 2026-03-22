import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/feeds/import/logs — Historie importů                     */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const configId = params.get("configId");
    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(params.get("limit") || "20", 10));

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAdmin = user?.role === "ADMIN" || user?.role === "BACKOFFICE";

    // Filtrovat podle configId nebo uzivatele
    const where: Record<string, unknown> = {};

    if (configId) {
      where.configId = configId;
    }

    // Ne-admini vidi jen logy svych konfiguraci
    if (!isAdmin) {
      where.config = { userId: session.user.id };
    }

    const [logs, total] = await Promise.all([
      prisma.feedImportLog.findMany({
        where,
        include: {
          config: {
            select: { id: true, name: true, format: true, url: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feedImportLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/feeds/import/logs error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
