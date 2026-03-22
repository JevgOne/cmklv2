import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsRow } from "@/components/pwa/dashboard/StatsRow";
import { AddVehicleCTA } from "@/components/pwa/dashboard/AddVehicleCTA";
import { NewLeadsSection } from "@/components/pwa/dashboard/NewLeadsSection";
import { DraftsList } from "@/components/pwa/dashboard/DraftsList";
import { NotificationsList } from "@/components/pwa/dashboard/NotificationsList";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [commissionAgg, salesCount, activeVehicles, notifications] =
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
    ]);

  const totalCommission = commissionAgg._sum.commission ?? 0;

  return (
    <div className="p-4 space-y-6">
      {/* Pozdrav */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Ahoj, {session.user.firstName}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Prehled tveho mesice
        </p>
      </div>

      {/* Statistiky */}
      <StatsRow
        totalCommission={totalCommission}
        salesCount={salesCount}
        activeVehicles={activeVehicles}
      />

      {/* CTA pridat vozidlo */}
      <AddVehicleCTA />

      {/* Nove leady */}
      <NewLeadsSection />

      {/* Drafty z IndexedDB */}
      <DraftsList />

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
