import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
    });
    if (!partner) {
      return NextResponse.json({ error: "Partner nenalezen" }, { status: 404 });
    }

    if (session.user.role === "PARTNER_BAZAR") {
      const [totalVehicles, activeVehicles, soldVehicles, totalLeads, totalViews] =
        await Promise.all([
          prisma.vehicle.count({ where: { brokerId: session.user.id } }),
          prisma.vehicle.count({ where: { brokerId: session.user.id, status: "ACTIVE" } }),
          prisma.vehicle.count({ where: { brokerId: session.user.id, status: "SOLD" } }),
          prisma.partnerLead.count({ where: { partnerId: partner.id } }),
          prisma.vehicle.aggregate({
            where: { brokerId: session.user.id },
            _sum: { viewCount: true },
          }),
        ]);

      const conversionRate =
        totalViews._sum.viewCount && totalViews._sum.viewCount > 0
          ? ((totalLeads / totalViews._sum.viewCount) * 100).toFixed(1)
          : "0";

      return NextResponse.json({
        type: "AUTOBAZAR",
        funnel: {
          views: totalViews._sum.viewCount || 0,
          leads: totalLeads,
          sold: soldVehicles,
        },
        conversionRate,
        totalVehicles,
        activeVehicles,
      });
    } else {
      const [totalParts, activeParts, totalOrders] = await Promise.all([
        prisma.part.count({ where: { supplierId: session.user.id } }),
        prisma.part.count({ where: { supplierId: session.user.id, status: "ACTIVE" } }),
        prisma.orderItem.count({ where: { supplierId: session.user.id } }),
      ]);

      return NextResponse.json({
        type: "VRAKOVISTE",
        totalParts,
        activeParts,
        totalOrders,
      });
    }
  } catch (error) {
    console.error("GET /api/partner/stats error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
