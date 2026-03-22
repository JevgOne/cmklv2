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

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    if (session.user.role === "PARTNER_BAZAR") {
      // Autobazar dashboard
      const [totalVehicles, activeVehicles, leadsThisMonth, soldVehicles] =
        await Promise.all([
          prisma.vehicle.count({
            where: { brokerId: session.user.id },
          }),
          prisma.vehicle.count({
            where: { brokerId: session.user.id, status: "ACTIVE" },
          }),
          prisma.partnerLead.count({
            where: { partnerId: partner.id, createdAt: { gte: monthStart } },
          }),
          prisma.vehicle.count({
            where: { brokerId: session.user.id, status: "SOLD" },
          }),
        ]);

      const recentLeads = await prisma.partnerLead.findMany({
        where: { partnerId: partner.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      return NextResponse.json({
        type: "AUTOBAZAR",
        stats: {
          totalVehicles,
          activeVehicles,
          leadsThisMonth,
          soldVehicles,
        },
        recentLeads,
      });
    } else {
      // Vrakoviste dashboard
      const [totalParts, activeParts, ordersThisMonth] = await Promise.all([
        prisma.part.count({
          where: { supplierId: session.user.id },
        }),
        prisma.part.count({
          where: { supplierId: session.user.id, status: "ACTIVE" },
        }),
        prisma.orderItem.count({
          where: {
            supplierId: session.user.id,
            createdAt: { gte: monthStart },
          },
        }),
      ]);

      return NextResponse.json({
        type: "VRAKOVISTE",
        stats: {
          totalParts,
          activeParts,
          ordersThisMonth,
        },
      });
    }
  } catch (error) {
    console.error("GET /api/partner/dashboard error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
