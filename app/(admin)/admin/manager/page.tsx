import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export default async function ManagerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "MANAGER") {
    redirect("/");
  }

  const managerId = session.user.id;

  // Statistiky tymu
  const totalBrokers = await prisma.user.count({
    where: { managerId, role: "BROKER", status: "ACTIVE" },
  });

  const activeVehicles = await prisma.vehicle.count({
    where: {
      broker: { managerId },
      status: "ACTIVE",
    },
  });

  const pendingVehicles = await prisma.vehicle.count({
    where: {
      broker: { managerId },
      status: "PENDING",
    },
  });

  // Provize tymu za tento mesic
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const teamCommissions = await prisma.commission.aggregate({
    where: {
      broker: { managerId },
      soldAt: { gte: startOfMonth },
    },
    _sum: { commission: true },
    _count: true,
  });

  const totalCommission = teamCommissions._sum.commission ?? 0;
  const totalSales = teamCommissions._count;

  // TOP makleri podle provizi
  const topBrokers = await prisma.user.findMany({
    where: { managerId, role: "BROKER", status: "ACTIVE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      _count: {
        select: {
          vehicles: { where: { status: "ACTIVE" } },
          commissions: { where: { soldAt: { gte: startOfMonth } } },
        },
      },
      commissions: {
        where: { soldAt: { gte: startOfMonth } },
        select: { commission: true },
      },
    },
    take: 5,
  });

  const topBrokersRanked = topBrokers
    .map((b) => ({
      id: b.id,
      name: `${b.firstName} ${b.lastName}`,
      initials: `${b.firstName[0] || ""}${b.lastName[0] || ""}`,
      avatar: b.avatar,
      activeVehicles: b._count.vehicles,
      sales: b._count.commissions,
      totalCommission: b.commissions.reduce((sum, c) => sum + c.commission, 0),
    }))
    .sort((a, b) => b.totalCommission - a.totalCommission);

  // Cekajici na schvaleni (onboarding makleri)
  const pendingOnboarding = await prisma.user.count({
    where: {
      managerId,
      role: "BROKER",
      status: "ONBOARDING",
      onboardingCompleted: true,
    },
  });

  // Posledni aktivity (nove vozidla od tymu)
  const recentVehicles = await prisma.vehicle.findMany({
    where: { broker: { managerId } },
    include: {
      broker: { select: { firstName: true, lastName: true } },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
            <span>Manazer</span>
            <span>/</span>
            <span className="text-gray-900">Dashboard</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">
            Manazersky dashboard
          </h1>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon="👥"
          iconColor="blue"
          value={totalBrokers.toLocaleString("cs-CZ")}
          label="Aktivnich makleru"
        />
        <StatCard
          icon="💰"
          iconColor="green"
          value={`${(totalCommission / 1000).toFixed(0)}k Kc`}
          label="Provize tento mesic"
        />
        <StatCard
          icon="🚗"
          iconColor="orange"
          value={activeVehicles.toLocaleString("cs-CZ")}
          label="Aktivnich vozidel"
        />
        <StatCard
          icon="📈"
          iconColor="red"
          value={totalSales.toLocaleString("cs-CZ")}
          label="Prodeju tento mesic"
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
        {/* TOP Makleri */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-gray-900">
              TOP makleri
            </h2>
            <Link
              href="/admin/manager/brokers"
              className="text-sm text-orange-500 font-semibold hover:underline"
            >
              Zobrazit vse
            </Link>
          </div>
          {topBrokersRanked.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              Zatim zadne provize.
            </p>
          ) : (
            <div className="space-y-1">
              {topBrokersRanked.map((broker, index) => (
                <Link
                  key={broker.id}
                  href={`/admin/manager/brokers/${broker.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors no-underline"
                >
                  <span className="text-sm font-bold text-gray-400 w-5">
                    {index + 1}.
                  </span>
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {broker.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">
                      {broker.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {broker.activeVehicles} vozidel · {broker.sales} prodeju
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-sm">
                      {broker.totalCommission.toLocaleString("cs-CZ")} Kc
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Prave sloupce */}
        <div className="space-y-4 sm:space-y-6">
          {/* Ceka na schvaleni */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-[18px] font-bold text-gray-900">
                Ceka na schvaleni
              </h2>
              {pendingOnboarding > 0 && (
                <Badge variant="rejected">{pendingOnboarding}</Badge>
              )}
              {pendingVehicles > 0 && (
                <Badge variant="pending">{pendingVehicles} vozidel</Badge>
              )}
            </div>
            <div className="space-y-3">
              {pendingOnboarding > 0 && (
                <Link
                  href="/admin/manager/approvals"
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-xl no-underline hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">👤</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {pendingOnboarding} makleru ceka na aktivaci
                    </span>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>
              )}
              {pendingVehicles > 0 && (
                <Link
                  href="/admin/manager/approvals"
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-xl no-underline hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🚗</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {pendingVehicles} vozidel ceka na schvaleni
                    </span>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>
              )}
              {pendingOnboarding === 0 && pendingVehicles === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">
                  Vse je schvaleno.
                </p>
              )}
            </div>
          </Card>

          {/* Posledni aktivity */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-[18px] font-bold text-gray-900 mb-4">
              Posledni aktivity
            </h2>
            {recentVehicles.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                Zatim zadne aktivity.
              </p>
            ) : (
              <div>
                {recentVehicles.map((vehicle, index) => (
                  <div
                    key={vehicle.id}
                    className={`flex gap-3 py-3 ${
                      index !== recentVehicles.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">
                        <strong className="text-gray-900">
                          {vehicle.broker
                            ? `${vehicle.broker.firstName} ${vehicle.broker.lastName}`
                            : "Neznamy"}
                        </strong>{" "}
                        pridal {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {vehicle.status === "PENDING"
                          ? "Ceka na schvaleni"
                          : vehicle.status === "ACTIVE"
                            ? "Aktivni"
                            : vehicle.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
