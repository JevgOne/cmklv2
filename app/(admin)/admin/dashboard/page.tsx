import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PeriodSelector } from "@/components/admin/PeriodSelector";
import { ApprovalActions } from "@/components/admin/ApprovalActions";
import { ExportButton } from "./ExportButton";
import { prisma } from "@/lib/prisma";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "právě teď";
  if (diffMin < 60) return `před ${diffMin} min`;
  if (diffHour < 24) return `před ${diffHour} hod`;
  return `před ${diffDay} dny`;
}

// Admin pages call Prisma at top of server component — force dynamic
// rendering aby Next.js neskoušel prerender v build time bez DB.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalVehicles, totalBrokers, pendingApprovals, monthlyCommissions] =
    await Promise.all([
      prisma.vehicle.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "BROKER", status: "ACTIVE" } }),
      prisma.vehicle.count({ where: { status: "PENDING" } }),
      prisma.commission.aggregate({
        where: { soldAt: { gte: startOfMonth } },
        _sum: { commission: true },
      }),
    ]);

  const totalCommission = monthlyCommissions._sum.commission ?? 0;
  const commissionLabel =
    totalCommission > 0
      ? `${(totalCommission / 1000).toFixed(0)}k Kč`
      : "0 Kč";

  // Real activity feed from recent vehicles
  const recentActivity = await prisma.vehicle.findMany({
    include: {
      broker: { select: { firstName: true, lastName: true } },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const recentVehicles = await prisma.vehicle.findMany({
    where: { status: "PENDING" },
    include: {
      broker: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      images: { where: { isPrimary: true }, take: 1 },
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
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900">Dashboard</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">
            Dashboard
          </h1>
        </div>
        <ExportButton />
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8">
        <StatCard
          icon="🚗"
          iconColor="orange"
          value={totalVehicles.toLocaleString("cs-CZ")}
          label="Aktivních vozidel"
        />
        <StatCard
          icon="💰"
          iconColor="green"
          value={commissionLabel}
          label="Provize tento měsíc"
        />
        <StatCard
          icon="👥"
          iconColor="blue"
          value={totalBrokers.toLocaleString("cs-CZ")}
          label="Aktivních makléřů"
        />
        <StatCard
          icon="⏳"
          iconColor="red"
          value={pendingApprovals.toLocaleString("cs-CZ")}
          label="Čeká na schválení"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
        {/* Sales Chart */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-[18px] font-bold text-gray-900">
              Prodeje za posledních 12 měsíců
            </h2>
            <PeriodSelector />
          </div>
          <div className="h-[300px] bg-gray-50 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-lg">📊 Graf prodejů</span>
          </div>
        </Card>

        {/* Commission Chart */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-[18px] font-bold text-gray-900">
              Provize podle regionů
            </h2>
            <PeriodSelector />
          </div>
          <div className="h-[300px] bg-gray-50 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-lg">📊 Graf provizí</span>
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
        {/* Activity Feed */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-[18px] font-bold text-gray-900 mb-6">
            Poslední aktivita
          </h2>
          <div>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                Zatím žádná aktivita.
              </p>
            ) : (
              recentActivity.map((vehicle, index) => {
                const brokerLabel = vehicle.broker
                  ? `${vehicle.broker.firstName} ${vehicle.broker.lastName}`
                  : "Neznámý";
                const statusText =
                  vehicle.status === "PENDING"
                    ? "přidal ke schválení"
                    : vehicle.status === "ACTIVE"
                      ? "přidal"
                      : vehicle.status === "SOLD"
                        ? "prodal"
                        : "aktualizoval";

                return (
                  <div
                    key={vehicle.id}
                    className={`flex gap-3 py-4 ${
                      index !== recentActivity.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">
                        <strong className="text-gray-900">{brokerLabel}</strong>{" "}
                        {statusText} {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(vehicle.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Pending Approvals */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-[18px] font-bold text-gray-900">
              Čekající schválení
            </h2>
            <Badge variant="rejected">{pendingApprovals}</Badge>
          </div>
          <div className="space-y-2">
            {recentVehicles.length === 0 && (
              <p className="text-sm text-gray-400 py-8 text-center">
                Žádná vozidla nečekají na schválení.
              </p>
            )}
            {recentVehicles.map((vehicle) => {
              const brokerName = vehicle.broker
                ? `${vehicle.broker.firstName} ${vehicle.broker.lastName}`
                : vehicle.contactName || "Soukromý";
              const brokerInitials = vehicle.broker
                ? `${vehicle.broker.firstName[0] || ""}${vehicle.broker.lastName[0] || ""}`
                : (vehicle.contactName || "S")[0] || "S";

              return (
                <div
                  key={vehicle.id}
                  className="flex gap-4 p-4 border-2 border-transparent rounded-xl hover:border-orange-200 transition-colors"
                >
                  {/* Vehicle Thumbnail */}
                  <div className="hidden sm:flex w-[120px] h-[90px] bg-gray-100 rounded-lg items-center justify-center flex-shrink-0 overflow-hidden">
                    {vehicle.images[0]?.url ? (
                      <img
                        src={vehicle.images[0].url}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl text-gray-300">🚗</span>
                    )}
                  </div>

                  {/* Vehicle Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {vehicle.year} · {vehicle.mileage.toLocaleString("cs-CZ")} km · {vehicle.fuelType}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-md flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">
                          {brokerInitials}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {brokerName}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <ApprovalActions vehicleId={vehicle.id} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
