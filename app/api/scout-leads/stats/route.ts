import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const role = session.user.role;
    const ALLOWED = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"];
    if (!ALLOWED.includes(role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    // Build base filter for RBAC
    const baseWhere: Record<string, unknown> = {};
    if (role === "MANAGER" || role === "REGIONAL_DIRECTOR") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { regionId: true },
      });
      if (user?.regionId) {
        baseWhere.regionId = user.regionId;
      }
    }

    const [
      total,
      byCategory,
      byStatus,
      byCountry,
      bySource,
      last30days,
      conversions,
    ] = await Promise.all([
      prisma.scoutLead.count({ where: baseWhere }),
      prisma.scoutLead.groupBy({
        by: ["category"],
        where: baseWhere,
        _count: true,
      }),
      prisma.scoutLead.groupBy({
        by: ["status"],
        where: baseWhere,
        _count: true,
      }),
      prisma.scoutLead.groupBy({
        by: ["country"],
        where: baseWhere,
        _count: true,
      }),
      prisma.scoutLead.groupBy({
        by: ["source"],
        where: baseWhere,
        _count: true,
        orderBy: { _count: { source: "desc" } },
        take: 10,
      }),
      prisma.scoutLead.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.scoutLead.count({
        where: { ...baseWhere, status: "WON" },
      }),
    ]);

    const conversionRate =
      total > 0 ? Math.round((conversions / total) * 100) : 0;

    return NextResponse.json({
      total,
      last30days,
      conversions,
      conversionRate,
      byCategory: Object.fromEntries(
        byCategory.map((r) => [r.category, r._count])
      ),
      byStatus: Object.fromEntries(
        byStatus.map((r) => [r.status, r._count])
      ),
      byCountry: Object.fromEntries(
        byCountry.map((r) => [r.country, r._count])
      ),
      bySource: bySource.map((r) => ({
        source: r.source,
        count: r._count,
      })),
    });
  } catch (error) {
    console.error("GET /api/scout-leads/stats error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
