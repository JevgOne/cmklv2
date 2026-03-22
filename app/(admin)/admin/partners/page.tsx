import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StatCard } from "@/components/ui/StatCard";
import { PartnersTable } from "@/components/admin/partners/PartnersTable";

export default async function AdminPartnersPage() {
  const session = await getServerSession(authOptions);
  const isManager = session?.user?.role === "MANAGER";

  const managerFilter = isManager ? { managerId: session?.user?.id } : {};

  const [total, active, inProgress, unassigned] = await Promise.all([
    prisma.partner.count({ where: managerFilter }),
    prisma.partner.count({
      where: { ...managerFilter, status: "AKTIVNI_PARTNER" },
    }),
    prisma.partner.count({
      where: {
        ...managerFilter,
        status: { in: ["PRIRAZENY", "OSLOVEN", "JEDNAME"] },
      },
    }),
    prisma.partner.count({
      where: { ...managerFilter, managerId: null, status: "NEOSLOVENY" },
    }),
  ]);

  // Funnel data
  const [fNeosloveny, fPrirazeny, fOsloven, fJedname, fAktivni] =
    await Promise.all([
      prisma.partner.count({ where: { ...managerFilter, status: "NEOSLOVENY" } }),
      prisma.partner.count({ where: { ...managerFilter, status: "PRIRAZENY" } }),
      prisma.partner.count({ where: { ...managerFilter, status: "OSLOVEN" } }),
      prisma.partner.count({ where: { ...managerFilter, status: "JEDNAME" } }),
      prisma.partner.count({ where: { ...managerFilter, status: "AKTIVNI_PARTNER" } }),
    ]);

  const funnelSteps = [
    { label: "Neosloveno", count: fNeosloveny, color: "bg-gray-400" },
    { label: "Prirazeno", count: fPrirazeny, color: "bg-blue-400" },
    { label: "Osloveno", count: fOsloven, color: "bg-yellow-400" },
    { label: "Jedname", count: fJedname, color: "bg-orange-400" },
    { label: "Partner", count: fAktivni, color: "bg-green-500" },
  ];

  const maxFunnel = Math.max(...funnelSteps.map((s) => s.count), 1);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Partneri</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            CRM Partneru
          </h1>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="🏢"
          iconColor="blue"
          value={String(total)}
          label="Celkem partneru"
        />
        <StatCard
          icon="✅"
          iconColor="green"
          value={String(active)}
          label="Aktivnich"
        />
        <StatCard
          icon="🔄"
          iconColor="orange"
          value={String(inProgress)}
          label="Rozpracovanych"
        />
        <StatCard
          icon="⚠️"
          iconColor="red"
          value={String(unassigned)}
          label="Neprirazenyh"
        />
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-4">
          Akvizicni funnel
        </h3>
        <div className="flex items-end gap-3 h-24">
          {funnelSteps.map((step) => (
            <div key={step.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-gray-900">{step.count}</span>
              <div
                className={`w-full rounded-t-lg ${step.color} transition-all`}
                style={{
                  height: `${Math.max((step.count / maxFunnel) * 80, 4)}px`,
                }}
              />
              <span className="text-[10px] text-gray-500 text-center leading-tight">
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Partners table */}
      <PartnersTable />
    </div>
  );
}
