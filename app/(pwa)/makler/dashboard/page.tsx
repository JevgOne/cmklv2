import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsRow } from "@/components/pwa/dashboard/StatsRow";
import { AddVehicleCTA } from "@/components/pwa/dashboard/AddVehicleCTA";
import { NewLeadsSection } from "@/components/pwa/dashboard/NewLeadsSection";
import { DraftsList } from "@/components/pwa/dashboard/DraftsList";
import { NotificationsList } from "@/components/pwa/dashboard/NotificationsList";
import { FollowUpSection } from "@/components/pwa/dashboard/FollowUpSection";
import { LevelBadge } from "@/components/pwa/gamification/LevelBadge";
import { Card } from "@/components/ui/Card";
import { DashboardTourWrapper } from "./DashboardTourWrapper";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const [commissionAgg, salesCount, activeVehicles, notifications, expiringExclusives, userData, leaderboardData] =
    await Promise.all([
      prisma.commission
        .aggregate({
          where: {
            brokerId: userId,
            createdAt: { gte: startOfMonth },
          },
          _sum: { commission: true },
        })
        .catch(() => ({ _sum: { commission: null } })),
      prisma.commission
        .count({
          where: {
            brokerId: userId,
            createdAt: { gte: startOfMonth },
          },
        })
        .catch(() => 0),
      prisma.vehicle.count({
        where: {
          brokerId: userId,
          status: "ACTIVE",
        },
      }),
      prisma.notification
        .findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
        .catch(() => []),
      prisma.vehicle
        .findMany({
          where: {
            brokerId: userId,
            exclusiveUntil: {
              gte: now,
              lte: endOfWeek,
            },
            status: { in: ["ACTIVE", "PENDING"] },
          },
          select: {
            id: true,
            brand: true,
            model: true,
            exclusiveUntil: true,
          },
        })
        .catch(() => []),
      prisma.user
        .findUnique({
          where: { id: userId },
          select: { quickModeEnabled: true, level: true, totalRevenue: true, hasSeenTour: true },
        })
        .catch(() => null),
      prisma.commission
        .groupBy({
          by: ["brokerId"],
          where: { soldAt: { gte: startOfMonth } },
          _sum: { commission: true },
          orderBy: { _sum: { commission: "desc" } },
        })
        .catch(() => []),
    ]);

  const totalCommission = commissionAgg._sum.commission ?? 0;
  const quickModeEnabled = userData?.quickModeEnabled ?? false;
  const userLevel = userData?.level ?? "STAR_1";
  const userRevenue = userData?.totalRevenue ?? 0;
  const hasSeenTour = userData?.hasSeenTour ?? true;
  const leaderboardPosition = leaderboardData.findIndex((c) => c.brokerId === userId) + 1 || null;
  const totalBrokersInLeaderboard = leaderboardData.length;

  return (
    <div className="p-4 space-y-6">
      {/* Tour — only for users who haven't seen it yet */}
      {!hasSeenTour && (
        <DashboardTourWrapper userName={session.user.firstName || "Makleri"} />
      )}

      {/* Pozdrav + Level */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Ahoj, {session.user.firstName}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Prehled tveho mesice
          </p>
        </div>
        <div className="text-right">
          <LevelBadge level={userLevel} size="md" />
          <p className="text-xs text-gray-500 mt-1">
            {new Intl.NumberFormat("cs-CZ").format(userRevenue)} Kc obrat
          </p>
        </div>
      </div>

      {/* Pozice v zebricku */}
      {leaderboardPosition && (
        <Link href="/makler/leaderboard">
          <Card className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {leaderboardPosition}. misto v zebricku
                  </p>
                  <p className="text-xs text-gray-500">
                    z {totalBrokersInLeaderboard} makleru tento mesic
                  </p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        </Link>
      )}

      {/* Statistiky */}
      <StatsRow
        totalCommission={totalCommission}
        salesCount={salesCount}
        activeVehicles={activeVehicles}
      />

      {/* Upozorneni na vyprsi exkluzivit */}
      {expiringExclusives.length > 0 && (
        <Card className="p-4 bg-yellow-50 border border-yellow-200">
          <p className="font-semibold text-gray-900 mb-1">
            {expiringExclusives.length}{" "}
            {expiringExclusives.length === 1
              ? "smlouva vyprsi"
              : expiringExclusives.length < 5
              ? "smlouvy vyprsi"
              : "smluv vyprsi"}{" "}
            tento tyden
          </p>
          <div className="space-y-1">
            {expiringExclusives.map((v) => (
              <Link
                key={v.id}
                href={`/makler/vehicles/${v.id}`}
                className="block text-sm text-orange-600 hover:underline"
              >
                {v.brand} {v.model} — do{" "}
                {v.exclusiveUntil
                  ? new Date(v.exclusiveUntil).toLocaleDateString("cs-CZ")
                  : ""}
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* CTA pridat vozidlo */}
      <AddVehicleCTA quickModeEnabled={quickModeEnabled} />

      {/* Follow-up kontakty */}
      <FollowUpSection />

      {/* Nove leady */}
      <NewLeadsSection />

      {/* Drafty z IndexedDB */}
      <DraftsList />

      {/* Materialy */}
      <Link href="/makler/materials" data-tour="materials-link">
        <Card className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-lg shrink-0">
            📋
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Moje materialy</p>
            <p className="text-xs text-gray-500">Vizitka, email podpis, prezentace</p>
          </div>
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Card>
      </Link>

      {/* Notifikace */}
      <NotificationsList
        notifications={notifications.map((n) => ({
          ...n,
          createdAt:
            n.createdAt instanceof Date
              ? n.createdAt.toISOString()
              : String(n.createdAt),
        }))}
      />
    </div>
  );
}
