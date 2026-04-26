import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ManagerBrokersContent } from "@/components/admin/ManagerBrokersContent";

// Admin pages call Prisma at top of server component — force dynamic
// rendering aby Next.js neskoušel prerender v build time bez DB.
export const dynamic = "force-dynamic";

export default async function ManagerBrokersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !["MANAGER", "REGIONAL_DIRECTOR", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const managerId = session.user.role === "ADMIN" ? undefined : session.user.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const brokers = await prisma.user.findMany({
    where: { managerId, role: "BROKER" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      status: true,
      cities: true,
      createdAt: true,
      _count: {
        select: {
          vehicles: { where: { status: "ACTIVE" } },
        },
      },
      commissions: {
        where: { soldAt: { gte: startOfMonth } },
        select: { commission: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const brokersData = brokers.map((b) => ({
    id: b.id,
    name: `${b.firstName} ${b.lastName}`,
    initials: `${b.firstName[0] || ""}${b.lastName[0] || ""}`,
    email: b.email,
    phone: b.phone || "",
    avatar: b.avatar,
    status: b.status,
    activeVehicles: b._count.vehicles,
    sales: b.commissions.length,
    totalCommission: b.commissions.reduce((sum, c) => sum + c.commission, 0),
    region: b.cities ? (JSON.parse(b.cities) as string[])[0] || "—" : "—",
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <span>Manazer</span>
          <span>/</span>
          <span className="text-gray-900">Moji makleri</span>
        </div>
        <h1 className="text-[28px] font-extrabold text-gray-900">
          Moji makleri
        </h1>
      </div>

      <ManagerBrokersContent brokers={brokersData} />
    </div>
  );
}
