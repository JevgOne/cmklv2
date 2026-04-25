import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Pristup odepren" }, { status: 403 });
    }

    const userId = session.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Aggregovat provize za tento mesic seskupene podle brokera
    const monthlyCommissions = await prisma.commission.groupBy({
      by: ["brokerId"],
      where: { soldAt: { gte: startOfMonth } },
      _sum: { commission: true },
      _count: true,
      orderBy: { _sum: { commission: "desc" } },
    });

    // Ziskat info o brokerech z TOP 10
    const top10BrokerIds = monthlyCommissions.slice(0, 10).map((c) => c.brokerId);
    const brokers = await prisma.user.findMany({
      where: { id: { in: top10BrokerIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        level: true,
      },
    });

    const brokerMap = new Map(brokers.map((b) => [b.id, b]));

    const leaderboard = monthlyCommissions.slice(0, 10).map((entry, index) => {
      const broker = brokerMap.get(entry.brokerId);
      return {
        rank: index + 1,
        brokerId: entry.brokerId,
        name: broker ? `${broker.firstName} ${broker.lastName}` : "Neznamy",
        avatar: broker?.avatar ?? null,
        level: broker?.level ?? "TIPAR",
        salesCount: entry._count,
        totalCommission: entry._sum.commission ?? 0,
      };
    });

    // Najit pozici aktualniho uzivatele
    const userIndex = monthlyCommissions.findIndex((c) => c.brokerId === userId);
    const userEntry = userIndex >= 0 ? monthlyCommissions[userIndex] : null;

    const totalBrokers = monthlyCommissions.length;

    return NextResponse.json({
      leaderboard,
      myPosition: userIndex >= 0 ? userIndex + 1 : null,
      mySalesCount: userEntry?._count ?? 0,
      myCommission: userEntry?._sum.commission ?? 0,
      totalBrokers,
    });
  } catch (error) {
    console.error("GET /api/broker/leaderboard error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
