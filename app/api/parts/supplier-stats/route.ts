import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeParts, pendingOrders, revenueAgg] = await Promise.all([
      prisma.part.count({
        where: { supplierId: session.user.id, status: "ACTIVE" },
      }),
      prisma.order.count({
        where: {
          items: { some: { supplierId: session.user.id } },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),
      prisma.orderItem.aggregate({
        where: {
          supplierId: session.user.id,
          createdAt: { gte: monthStart },
          order: { status: { not: "CANCELLED" } },
        },
        _sum: { totalPrice: true },
      }),
    ]);

    return NextResponse.json({
      activeParts,
      pendingOrders,
      revenue: revenueAgg._sum.totalPrice ?? 0,
      rating: 0,
    });
  } catch (error) {
    console.error("GET /api/parts/supplier-stats error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
