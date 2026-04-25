import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { LevelBadge } from "@/components/pwa/gamification/LevelBadge";
import { AchievementCard } from "@/components/pwa/gamification/AchievementCard";
import { ACHIEVEMENTS, checkAndUnlockAchievements, getStarLevelByKey } from "@/lib/gamification";
import { calculateStarProgress, REGION_THRESHOLDS, STAR_LEVELS } from "@/lib/gamification-levels";
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
    // Průměry všech brokerů
    allBrokersVehiclesTotal,
    allBrokersSoldTotal,
    allBrokersCommissions,
    allBrokersSoldVehicles,
    recentTransactions,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { level: true, totalSales: true, totalRevenue: true, region: { select: { tier: true } } },
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
    // Celkový počet vozidel všech brokerů
    prisma.vehicle.count({ where: { brokerId: { not: null } } }),
    // Celkový počet prodaných vozidel všech brokerů
    prisma.vehicle.count({ where: { brokerId: { not: null }, status: "SOLD" } }),
    // Průměrná provize všech brokerů
    prisma.commission.aggregate({
      _avg: { commission: true },
    }),
    // Všechna prodaná vozidla všech brokerů (pro průměrnou dobu prodeje)
    prisma.vehicle.findMany({
      where: { brokerId: { not: null }, status: "SOLD", soldAt: { not: null } },
      select: { createdAt: true, soldAt: true },
    }),
    // Poslední obratové transakce
    prisma.brokerPointTransaction.findMany({
      where: { brokerId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, type: true, amount: true, description: true, createdAt: true },
    }),
  ]);

  const regionTier = (user?.region?.tier as string) ?? "SMALL";
  const level = getStarLevelByKey(user?.level ?? "STAR_1");
  const totalRevenue = user?.totalRevenue ?? 0;
  const starProgress = calculateStarProgress(totalRevenue, regionTier);
  const conversionRate = totalVehicles > 0 ? Math.round((soldVehicles / totalVehicles) * 100) : 0;

  // Průměry všech brokerů
  const avgConversionRate =
    allBrokersVehiclesTotal > 0
      ? Math.round((allBrokersSoldTotal / allBrokersVehiclesTotal) * 100)
      : 0;

  const allSaleDurations = allBrokersSoldVehicles
    .filter((v) => v.soldAt)
    .map((v) => (v.soldAt!.getTime() - v.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const avgAllSaleDays =
    allSaleDurations.length > 0
      ? Math.round(allSaleDurations.reduce((a, b) => a + b, 0) / allSaleDurations.length)
      : 0;

  const avgAllCommission = Math.round(allBrokersCommissions._avg.commission ?? 0);

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

  // Cenové segmenty
  const segments = { "do 300k": 0, "300k-600k": 0, "600k-1M": 0, "nad 1M": 0 };
  allSoldVehicles.forEach((v) => {
    const p = v.soldPrice ?? v.price;
    if (p < 300_000) segments["do 300k"]++;
    else if (p < 600_000) segments["300k-600k"]++;
    else if (p < 1_000_000) segments["600k-1M"]++;
    else segments["nad 1M"]++;
  });

  // Mesicni prodeje (poslednich 6 mesicu) - placeholder data pro grafy
  const monthRanges = Array.from({ length: 6 }, (_, idx) => {
    const i = 5 - idx;
    const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const me = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    return { ms, me, label: ms.toLocaleDateString("cs-CZ", { month: "short" }) };
  });

  const monthlyAggregates = await Promise.all(
    monthRanges.map(({ ms, me }) =>
      prisma.commission.aggregate({
        where: { brokerId: userId, soldAt: { gte: ms, lt: me } },
        _sum: { commission: true },
        _count: true,
      })
    )
  );

  const monthlyStats = monthRanges.map((range, idx) => ({
    label: range.label,
    sales: monthlyAggregates[idx]._count,
    commission: monthlyAggregates[idx]._sum.commission ?? 0,
  }));

  const maxSales = Math.max(...monthlyStats.map((m) => m.sales), 1);
  const maxCommission = Math.max(...monthlyStats.map((m) => m.commission), 1);

  const unlockedMap = new Map(
    userAchievements.map((a) => [a.achievementKey, a.unlockedAt])
  );

  // Regionální prahy pro zobrazení
  const thresholds = REGION_THRESHOLDS[regionTier] ?? REGION_THRESHOLDS.SMALL;

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Statistiky</h1>
          <p className="text-sm text-gray-500 mt-1">Váš výkon a achievementy</p>
        </div>
        <LevelBadge level={user?.level ?? "STAR_1"} size="lg" />
      </div>

      {/* Prehled */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Nabraná auta</p>
          <p className="text-2xl font-extrabold text-gray-900">{totalVehicles}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Prodaná auta</p>
          <p className="text-2xl font-extrabold text-gray-900">{soldVehicles}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Konverzní poměr</p>
          <p className="text-2xl font-extrabold text-orange-500">{conversionRate}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Prům. doba prodeje</p>
          <p className="text-2xl font-extrabold text-gray-900">{avgSaleDays} dní</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Prům. provize</p>
          <p className="text-lg font-extrabold text-gray-900">
            {formatPrice(Math.round(userCommissions._avg.commission ?? 0))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Celkové provize</p>
          <p className="text-lg font-extrabold text-orange-500">
            {formatPrice(userCommissions._sum.commission ?? 0)}
          </p>
        </Card>
      </div>

      {/* Tento měsíc */}
      <Card className="p-4 bg-orange-50 border border-orange-200">
        <h3 className="font-bold text-orange-800 mb-2">Tento měsíc</h3>
        <div className="flex justify-between">
          <div>
            <p className="text-2xl font-extrabold text-orange-600">
              {monthlyCommissions._count}
            </p>
            <p className="text-xs text-orange-500">prodejů</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-orange-600">
              {formatPrice(monthlyCommissions._sum.commission ?? 0)}
            </p>
            <p className="text-xs text-orange-500">provize</p>
          </div>
        </div>
      </Card>

      {/* Porovnání s průměrem */}
      <div>
        <h3 className="font-extrabold text-gray-900 mb-3">Porovnání s průměrem</h3>
        <div className="grid grid-cols-1 gap-3">
          {/* Průměrná doba prodeje */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Průměrná doba prodeje</p>
                <p className="text-lg font-extrabold text-gray-900">{avgSaleDays} dní</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Průměr</p>
                <p className="text-lg font-bold text-gray-400">{avgAllSaleDays} dní</p>
              </div>
            </div>
            <div className="mt-2">
              {avgSaleDays > 0 && avgAllSaleDays > 0 ? (
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    avgSaleDays <= avgAllSaleDays
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {avgSaleDays <= avgAllSaleDays
                    ? `O ${avgAllSaleDays - avgSaleDays} dní rychleji`
                    : `O ${avgSaleDays - avgAllSaleDays} dní pomaleji`}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Nedostatek dat</span>
              )}
            </div>
          </Card>

          {/* Konverzní poměr */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Konverzní poměr</p>
                <p className="text-lg font-extrabold text-orange-500">{conversionRate}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Průměr</p>
                <p className="text-lg font-bold text-gray-400">{avgConversionRate}%</p>
              </div>
            </div>
            <div className="mt-2">
              {totalVehicles > 0 && allBrokersVehiclesTotal > 0 ? (
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    conversionRate >= avgConversionRate
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {conversionRate >= avgConversionRate
                    ? `O ${conversionRate - avgConversionRate}% lepší`
                    : `O ${avgConversionRate - conversionRate}% horší`}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Nedostatek dat</span>
              )}
            </div>
          </Card>

          {/* Průměrná provize */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Průměrná provize</p>
                <p className="text-lg font-extrabold text-gray-900">
                  {formatPrice(Math.round(userCommissions._avg.commission ?? 0))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Průměr</p>
                <p className="text-lg font-bold text-gray-400">
                  {formatPrice(avgAllCommission)}
                </p>
              </div>
            </div>
            <div className="mt-2">
              {(userCommissions._avg.commission ?? 0) > 0 && avgAllCommission > 0 ? (
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    (userCommissions._avg.commission ?? 0) >= avgAllCommission
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {(userCommissions._avg.commission ?? 0) >= avgAllCommission
                    ? "Nad průměrem"
                    : "Pod průměrem"}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Nedostatek dat</span>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Prodeje po měsících - bar chart placeholder */}
      <Card className="p-4">
        <h3 className="font-bold text-gray-900 mb-4">Prodeje po měsících</h3>
        <div className="flex items-end gap-2 h-32">
          {monthlyStats.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[11px] text-gray-500 font-bold">
                {m.sales}
              </span>
              <div
                className="w-full bg-orange-500 rounded-t-md transition-all"
                style={{
                  height: `${Math.max((m.sales / maxSales) * 100, 4)}%`,
                }}
              />
              <span className="text-[11px] text-gray-400">{m.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Provize po měsících - line chart placeholder */}
      <Card className="p-4">
        <h3 className="font-bold text-gray-900 mb-4">Provize po měsících</h3>
        <div className="flex items-end gap-2 h-32">
          {monthlyStats.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[11px] text-gray-500 font-bold">
                {m.commission > 0 ? `${Math.round(m.commission / 1000)}k` : "0"}
              </span>
              <div
                className="w-full bg-blue-500 rounded-t-md transition-all"
                style={{
                  height: `${Math.max((m.commission / maxCommission) * 100, 4)}%`,
                }}
              />
              <span className="text-[11px] text-gray-400">{m.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top znacky */}
      {topBrands.length > 0 && (
        <Card className="p-4">
          <h3 className="font-bold text-gray-900 mb-3">Nejúspěšnější značky</h3>
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

      {/* Cenové segmenty */}
      <Card className="p-4">
        <h3 className="font-bold text-gray-900 mb-3">Cenové segmenty</h3>
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

      {/* Úroveň + prahy pro region */}
      <Card className="p-4">
        <h3 className="font-bold text-gray-900 mb-2">Úroveň</h3>
        <LevelBadge level={user?.level ?? "STAR_1"} size="lg" className="mb-3" />
        <p className="text-sm text-gray-500 mb-2">
          Celkový obrat: {formatPrice(totalRevenue)}
        </p>
        <p className="text-xs text-gray-400 mb-3">
          Provize: {Math.round(level.commissionRate * 100)}%
        </p>
        {starProgress.nextLevel && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{formatPrice(thresholds[starProgress.currentLevel.key as keyof typeof thresholds])}</span>
              <span>{formatPrice(thresholds[starProgress.nextLevel.key as keyof typeof thresholds])}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all"
                style={{ width: `${starProgress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Chybí {formatPrice(starProgress.revenueNeeded)} do {starProgress.nextLevel.name}
            </p>
          </div>
        )}
      </Card>

      {/* Prahy pro váš region */}
      <Card className="p-4">
        <h3 className="font-bold text-gray-900 mb-3">Prahy pro váš region</h3>
        <p className="text-xs text-gray-500 mb-3">Region: {regionTier}</p>
        <div className="space-y-2">
          {STAR_LEVELS.map((sl) => {
            const threshold = thresholds[sl.key as keyof typeof thresholds];
            const isCurrent = sl.key === (user?.level ?? "STAR_1");
            const isAchieved = totalRevenue >= threshold;
            return (
              <div
                key={sl.key}
                className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                  isCurrent
                    ? "bg-orange-50 border border-orange-200"
                    : isAchieved
                    ? "bg-green-50"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{"⭐".repeat(sl.stars)}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {Math.round(sl.commissionRate * 100)}%
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatPrice(threshold)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Historie obratu */}
      {recentTransactions.length > 0 && (
        <Card className="p-4">
          <h3 className="font-bold text-gray-900 mb-3">Poslední obrat</h3>
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{tx.description ?? tx.type}</p>
                  <p className="text-xs text-gray-500">
                    {tx.type === "CAR_SALE" ? "Prodej auta" : tx.type}
                    {" \u00B7 "}
                    {new Date(tx.createdAt).toLocaleDateString("cs-CZ")}
                  </p>
                </div>
                <span className="text-sm font-bold text-orange-500">+{formatPrice(tx.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/makler/leaderboard">
          <Card hover className="p-4 text-center">
            <p className="text-2xl mb-1">🏆</p>
            <p className="text-sm font-bold text-gray-900">Žebříček</p>
          </Card>
        </Link>
        <Link href="/makler/financing-calculator">
          <Card hover className="p-4 text-center">
            <p className="text-2xl mb-1">🧮</p>
            <p className="text-sm font-bold text-gray-900">Kalkulačka</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
