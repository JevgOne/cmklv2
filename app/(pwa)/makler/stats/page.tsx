import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { LevelBadge } from "@/components/pwa/gamification/LevelBadge";
import { AchievementCard } from "@/components/pwa/gamification/AchievementCard";
import { ACHIEVEMENTS, checkAndUnlockAchievements, getLevelByKey } from "@/lib/gamification";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export default async function StatsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Check achievements
  await checkAndUnlockAchievements(userId);

  const [
    user,
    totalVehicles,
    soldVehicles,
    userCommissions,
    allSoldVehicles,
    userAchievements,
    monthlyCommissions,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { level: true, totalSales: true },
    }),
    prisma.vehicle.count({ where: { brokerId: userId } }),
    prisma.vehicle.count({ where: { brokerId: userId, status: "SOLD" } }),
    prisma.commission.aggregate({
      where: { brokerId: userId },
      _sum: { commission: true },
      _avg: { commission: true },
      _count: true,
    }),
    prisma.vehicle.findMany({
      where: { brokerId: userId, status: "SOLD", soldAt: { not: null } },
      select: { createdAt: true, soldAt: true, brand: true, soldPrice: true, price: true },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementKey: true, unlockedAt: true },
    }),
    prisma.commission.aggregate({
      where: { brokerId: userId, soldAt: { gte: startOfMonth } },
      _sum: { commission: true },
      _count: true,
    }),
  ]);

  const level = getLevelByKey(user?.level ?? "JUNIOR");
  const conversionRate = totalVehicles > 0 ? Math.round((soldVehicles / totalVehicles) * 100) : 0;

  const saleDurations = allSoldVehicles
    .filter((v) => v.soldAt)
    .map((v) => (v.soldAt!.getTime() - v.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const avgSaleDays =
    saleDurations.length > 0
      ? Math.round(saleDurations.reduce((a, b) => a + b, 0) / saleDurations.length)
      : 0;

  // Top znacky
  const brandCounts: Record<string, number> = {};
  allSoldVehicles.forEach((v) => {
    brandCounts[v.brand] = (brandCounts[v.brand] ?? 0) + 1;
  });
  const topBrands = Object.entries(brandCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Cenove segmenty
  const segments = { "do 300k": 0, "300k-600k": 0, "600k-1M": 0, "nad 1M": 0 };
  allSoldVehicles.forEach((v) => {
    const p = v.soldPrice ?? v.price;
    if (p < 300_000) segments["do 300k"]++;
    else if (p < 600_000) segments["300k-600k"]++;
    else if (p < 1_000_000) segments["600k-1M"]++;
    else segments["nad 1M"]++;
  });

  // Mesicni prodeje (poslednich 6 mesicu) - placeholder data pro grafy
  const monthlyStats = [];
  for (let i = 5; i >= 0; i--) {
    const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const me = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const sales = await prisma.commission.aggregate({
      where: { brokerId: userId, soldAt: { gte: ms, lt: me } },
      _sum: { commission: true },
      _count: true,
    });
    monthlyStats.push({
      label: ms.toLocaleDateString("cs-CZ", { month: "short" }),
      sales: sales._count,
      commission: sales._sum.commission ?? 0,
    });
  }

  const maxSales = Math.max(...monthlyStats.map((m) => m.sales), 1);
  const maxCommission = Math.max(...monthlyStats.map((m) => m.commission), 1);

  const unlockedMap = new Map(
    userAchievements.map((a) => [a.achievementKey, a.unlockedAt])
  );

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Statistiky</h1>
          <p className="text-sm text-gray-500 mt-1">Vas vykon a achievementy</p>
        </div>
        <LevelBadge level={user?.level ?? "JUNIOR"} size="lg" />
      </div>

      {/* Prehled */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Nabrana auta</p>
          <p className="text-2xl font-extrabold text-gray-900">{totalVehicles}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Prodana auta</p>
          <p className="text-2xl font-extrabold text-gray-900">{soldVehicles}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Konverzni pomer</p>
          <p className="text-2xl font-extrabold text-orange-500">{conversionRate}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Prum. doba prodeje</p>
          <p className="text-2xl font-extrabold text-gray-900">{avgSaleDays} dni</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Prum. provize</p>
          <p className="text-lg font-extrabold text-gray-900">
            {formatPrice(Math.round(userCommissions._avg.commission ?? 0))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Celkove provize</p>
          <p className="text-lg font-extrabold text-orange-500">
            {formatPrice(userCommissions._sum.commission ?? 0)}
          </p>
        </Card>
      </div>

      {/* Tento mesic */}
      <Card className="p-4 bg-orange-50 border border-orange-200">
        <h3 className="font-bold text-orange-800 mb-2">Tento mesic</h3>
        <div className="flex justify-between">
          <div>
            <p className="text-2xl font-extrabold text-orange-600">
              {monthlyCommissions._count}
            </p>
            <p className="text-xs text-orange-500">prodeju</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-orange-600">
              {formatPrice(monthlyCommissions._sum.commission ?? 0)}
            </p>
            <p className="text-xs text-orange-500">provize</p>
          </div>
        </div>
      </Card>

      {/* Prodeje po mesicich - bar chart placeholder */}
      <Card className="p-4">
        <h3 className="font-bold text-gray-900 mb-4">Prodeje po mesicich</h3>
        <div className="flex items-end gap-2 h-32">
          {monthlyStats.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-500 font-bold">
                {m.sales}
              </span>
              <div
                className="w-full bg-orange-500 rounded-t-md transition-all"
                style={{
                  height: `${Math.max((m.sales / maxSales) * 100, 4)}%`,
                }}
              />
              <span className="text-[10px] text-gray-400">{m.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Provize po mesicich - line chart placeholder */}
      <Card className="p-4">
        <h3 className="font-bold text-gray-900 mb-4">Provize po mesicich</h3>
        <div className="flex items-end gap-2 h-32">
          {monthlyStats.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-500 font-bold">
                {m.commission > 0 ? `${Math.round(m.commission / 1000)}k` : "0"}
              </span>
              <div
                className="w-full bg-blue-500 rounded-t-md transition-all"
                style={{
                  height: `${Math.max((m.commission / maxCommission) * 100, 4)}%`,
                }}
              />
              <span className="text-[10px] text-gray-400">{m.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top znacky */}
      {topBrands.length > 0 && (
        <Card className="p-4">
          <h3 className="font-bold text-gray-900 mb-3">Nejuspesnejsi znacky</h3>
          <div className="space-y-2">
            {topBrands.map(([brand, count]) => (
              <div key={brand} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-gray-900">{brand}</span>
                    <span className="text-xs text-gray-500">{count}x</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{
                        width: `${(count / (topBrands[0]?.[1] ?? 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cenove segmenty */}
      <Card className="p-4">
        <h3 className="font-bold text-gray-900 mb-3">Cenove segmenty</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(segments).map(([segment, count]) => (
            <div key={segment} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-extrabold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500">{segment}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Achievementy */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-gray-900">Achievementy</h3>
          <span className="text-xs text-gray-500">
            {userAchievements.length}/{Object.keys(ACHIEVEMENTS).length}
          </span>
        </div>
        <div className="space-y-2">
          {Object.values(ACHIEVEMENTS).map((achievement) => (
            <AchievementCard
              key={achievement.key}
              name={achievement.name}
              description={achievement.description}
              icon={achievement.icon}
              unlocked={unlockedMap.has(achievement.key)}
              unlockedAt={unlockedMap.get(achievement.key)?.toISOString() ?? null}
            />
          ))}
        </div>
      </div>

      {/* Uroven - progress */}
      <Card className="p-4">
        <h3 className="font-bold text-gray-900 mb-2">Uroven</h3>
        <LevelBadge level={user?.level ?? "JUNIOR"} size="lg" className="mb-3" />
        <p className="text-sm text-gray-500 mb-2">
          {user?.totalSales ?? 0} prodeju celkem
        </p>
        {level.key !== "TOP" && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{level.minSales} prodeju</span>
              <span>{level.maxSales === Infinity ? "50+" : level.maxSales} prodeju</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    (((user?.totalSales ?? 0) - level.minSales) /
                      ((level.maxSales === Infinity ? 50 : level.maxSales) - level.minSales)) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/makler/leaderboard">
          <Card hover className="p-4 text-center">
            <p className="text-2xl mb-1">🏆</p>
            <p className="text-sm font-bold text-gray-900">Zebricek</p>
          </Card>
        </Link>
        <Link href="/makler/financing-calculator">
          <Card hover className="p-4 text-center">
            <p className="text-2xl mb-1">🧮</p>
            <p className="text-sm font-bold text-gray-900">Kalkulacka</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
