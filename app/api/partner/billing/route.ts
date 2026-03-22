import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "PARTNER_VRAKOVISTE") {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
    });
    if (!partner) {
      return NextResponse.json({ error: "Partner nenalezen" }, { status: 404 });
    }

    // Get completed order items for this supplier
    const orderItems = await prisma.orderItem.findMany({
      where: {
        supplierId: session.user.id,
        order: { status: "DELIVERED" },
      },
      include: {
        part: { select: { name: true } },
        order: { select: { id: true, status: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate billing summary
    const totalRevenue = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const carmaklerCommission = Math.round(totalRevenue * 0.15);
    const partnerPayout = totalRevenue - carmaklerCommission;

    return NextResponse.json({
      totalRevenue,
      carmaklerCommission,
      partnerPayout,
      commissionRate: 15,
      items: orderItems,
    });
  } catch (error) {
    console.error("GET /api/partner/billing error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
