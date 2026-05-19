import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StatCard } from "@/components/ui/StatCard";
import { ScoutLeadsTable } from "@/components/admin/scout-leads/ScoutLeadsTable";

export const dynamic = "force-dynamic";

export default async function AdminScoutLeadsPage() {
  const session = await getServerSession(authOptions);

  // RBAC base filter
  const baseWhere: Record<string, unknown> = {};
  if (
    session?.user?.role === "MANAGER" ||
    session?.user?.role === "REGIONAL_DIRECTOR"
  ) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { regionId: true },
    });
    if (user?.regionId) {
      baseWhere.regionId = user.regionId;
    }
  }

  const [total, newCount, qualified, won] = await Promise.all([
    prisma.scoutLead.count({ where: baseWhere }),
    prisma.scoutLead.count({ where: { ...baseWhere, status: "NEW" } }),
    prisma.scoutLead.count({
      where: { ...baseWhere, status: "QUALIFIED" },
    }),
    prisma.scoutLead.count({ where: { ...baseWhere, status: "WON" } }),
  ]);

  const conversionRate =
    total > 0 ? Math.round((won / total) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <span>Admin</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Lead Scout</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Lead Scout
        </h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="📋"
          iconColor="blue"
          value={total.toLocaleString("cs-CZ")}
          label="Celkem leadů"
        />
        <StatCard
          icon="🆕"
          iconColor="orange"
          value={newCount.toLocaleString("cs-CZ")}
          label="Nových"
        />
        <StatCard
          icon="✅"
          iconColor="green"
          value={qualified.toLocaleString("cs-CZ")}
          label="Kvalifikovaných"
        />
        <StatCard
          icon="🎯"
          iconColor="red"
          value={`${conversionRate}%`}
          label="Konverze"
        />
      </div>

      {/* Table */}
      <ScoutLeadsTable />
    </div>
  );
}
