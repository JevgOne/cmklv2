import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStarLevelByKey } from "@/lib/broker-points";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const users = await prisma.user.findMany({
    where: { role: "BROKER" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      level: true,
      totalRevenue: true,
      totalSales: true,
      region: { select: { name: true, tier: true } },
    },
    orderBy: { totalRevenue: "desc" },
  });

  // Měsíční obraty a pending payouty
  const [monthlyRevenues, pendingPayouts] = await Promise.all([
    prisma.brokerPointTransaction.groupBy({
      by: ["brokerId"],
      where: { type: "CAR_SALE", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.commission.groupBy({
      by: ["brokerId"],
      where: { status: "PENDING" },
      _sum: { brokerShare: true },
    }),
  ]);

  const monthlyMap = new Map(monthlyRevenues.map((m) => [m.brokerId, m._sum.amount ?? 0]));
  const payoutMap = new Map(pendingPayouts.map((p) => [p.brokerId, p._sum.brokerShare ?? 0]));

  const brokers = users.map((u) => {
    const starLevel = getStarLevelByKey(u.level);
    return {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      level: u.level,
      totalRevenue: u.totalRevenue,
      totalSales: u.totalSales,
      regionName: u.region?.name ?? "—",
      regionTier: u.region?.tier ?? "SMALL",
      commissionRate: starLevel.commissionRate,
      monthlyRevenue: monthlyMap.get(u.id) ?? 0,
      pendingPayout: payoutMap.get(u.id) ?? 0,
    };
  });

  return NextResponse.json({ brokers });
}
