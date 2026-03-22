import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StatCard } from "@/components/ui/StatCard";
import { AdminLeadsTable } from "@/components/admin/leads/AdminLeadsTable";

const statusLabels: Record<string, { label: string; variant: "new" | "verified" | "pending" | "top" | "rejected" | "default" }> = {
  NEW: { label: "Novy", variant: "new" },
  ASSIGNED: { label: "Prijaty", variant: "verified" },
  CONTACTED: { label: "Kontaktovano", variant: "pending" },
  MEETING_SCHEDULED: { label: "Schuzka", variant: "top" },
  VEHICLE_ADDED: { label: "Nabrano", variant: "verified" },
  REJECTED: { label: "Odmitnuty", variant: "rejected" },
  EXPIRED: { label: "Expiroval", variant: "default" },
};

export default async function AdminLeadsPage() {
  const session = await getServerSession(authOptions);
  const isManager = session?.user?.role === "MANAGER";

  // Manager vidi jen leady ze sveho regionu
  let whereClause = {};
  if (isManager && session?.user?.id) {
    const managerUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { regionId: true },
    });
    if (managerUser?.regionId) {
      whereClause = { regionId: managerUser.regionId };
    }
  }

  const [totalLeads, assignedLeads, convertedLeads, rejectedLeads, leads] = await Promise.all([
    prisma.lead.count({ where: whereClause }),
    prisma.lead.count({ where: { ...whereClause, status: { in: ["ASSIGNED", "CONTACTED", "MEETING_SCHEDULED"] } } }),
    prisma.lead.count({ where: { ...whereClause, status: "VEHICLE_ADDED" } }),
    prisma.lead.count({ where: { ...whereClause, status: "REJECTED" } }),
    prisma.lead.findMany({
      where: whereClause,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        region: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const conversionRate = totalLeads > 0
    ? ((convertedLeads / totalLeads) * 100).toFixed(1)
    : "0";

  const serializedLeads = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    brand: lead.brand,
    model: lead.model,
    city: lead.city,
    status: lead.status,
    source: lead.source,
    createdAt: lead.createdAt.toISOString(),
    assignedTo: lead.assignedTo
      ? { id: lead.assignedTo.id, name: `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` }
      : null,
    region: lead.region ? { id: lead.region.id, name: lead.region.name } : null,
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900">Leady</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">
            Lead management
          </h1>
        </div>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon="📋"
          iconColor="blue"
          value={totalLeads.toLocaleString("cs-CZ")}
          label="Celkem leadu"
        />
        <StatCard
          icon="👤"
          iconColor="orange"
          value={assignedLeads.toLocaleString("cs-CZ")}
          label="Aktivnich"
        />
        <StatCard
          icon="✅"
          iconColor="green"
          value={`${conversionRate}%`}
          label="Konverze"
        />
        <StatCard
          icon="❌"
          iconColor="red"
          value={rejectedLeads.toLocaleString("cs-CZ")}
          label="Odmitnutych"
        />
      </div>

      {/* Tabulka */}
      <div className="mt-6 sm:mt-8">
        <AdminLeadsTable leads={serializedLeads} statusLabels={statusLabels} />
      </div>
    </div>
  );
}
