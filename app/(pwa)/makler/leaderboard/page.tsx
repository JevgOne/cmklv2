import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaderboardTable } from "@/components/pwa/gamification/LeaderboardTable";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
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
      level: broker?.level ?? "STAR_1",
      salesCount: entry._count,
      totalCommission: entry._sum.commission ?? 0,
    };
  });

  const userIndex = monthlyCommissions.findIndex((c) => c.brokerId === userId);
  const userEntry = userIndex >= 0 ? monthlyCommissions[userIndex] : null;
  const totalBrokers = monthlyCommissions.length;

  const monthName = now.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });

  return (
    <div className="p-4 space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Zebricek</h1>
        <p className="text-sm text-gray-500 mt-1">
          TOP 10 makleru — {monthName}
        </p>
      </div>

      <LeaderboardTable
        leaderboard={leaderboard}
        myPosition={userIndex >= 0 ? userIndex + 1 : null}
        mySalesCount={userEntry?._count ?? 0}
        myCommission={userEntry?._sum.commission ?? 0}
        totalBrokers={totalBrokers}
        currentUserId={userId}
      />
    </div>
  );
}
