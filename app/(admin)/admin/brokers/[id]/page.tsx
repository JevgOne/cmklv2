import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusPill } from "@/components/ui/StatusPill";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"];

const statusInfo: Record<string, { label: string; variant: "verified" | "pending" | "rejected" }> = {
  ACTIVE: { label: "Aktivní", variant: "verified" },
  PENDING: { label: "Čekající", variant: "pending" },
  ONBOARDING: { label: "Onboarding", variant: "pending" },
  SUSPENDED: { label: "Pozastaven", variant: "rejected" },
  INACTIVE: { label: "Neaktivní", variant: "rejected" },
};

const vehicleStatusMap: Record<string, { label: string; variant: "active" | "pending" | "rejected" }> = {
  DRAFT: { label: "Koncept", variant: "pending" },
  PENDING: { label: "Čekající", variant: "pending" },
  ACTIVE: { label: "Aktivní", variant: "active" },
  RESERVED: { label: "Rezervováno", variant: "pending" },
  SOLD: { label: "Prodáno", variant: "active" },
  PAID: { label: "Zaplaceno", variant: "active" },
  REJECTED: { label: "Zamítnuto", variant: "rejected" },
  ARCHIVED: { label: "Archivováno", variant: "rejected" },
};

export default async function AdminBrokerDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  // Manager vidí jen své makléře
  const managerFilter = session.user.role === "MANAGER" ? { managerId: session.user.id } : {};

  const broker = await prisma.user.findFirst({
    where: { id, role: "BROKER", ...managerFilter },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      status: true,
      bio: true,
      specializations: true,
      cities: true,
      ico: true,
      bankAccount: true,
      slug: true,
      level: true,
      totalSales: true,
      totalRevenue: true,
      createdAt: true,
      manager: {
        select: { firstName: true, lastName: true },
      },
      _count: {
        select: {
          vehicles: true,
          commissions: true,
        },
      },
    },
  });

  if (!broker) {
    notFound();
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { brokerId: id },
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      price: true,
      status: true,
      mileage: true,
      createdAt: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const commissions = await prisma.commission.findMany({
    where: { brokerId: id },
    select: {
      id: true,
      salePrice: true,
      commission: true,
      rate: true,
      status: true,
      soldAt: true,
      vehicle: {
        select: { brand: true, model: true },
      },
    },
    orderBy: { soldAt: "desc" },
    take: 20,
  });

  const brokerStatus = statusInfo[broker.status] || { label: broker.status, variant: "pending" as const };
  const specializations = broker.specializations ? JSON.parse(broker.specializations) as string[] : [];
  const cities = broker.cities ? JSON.parse(broker.cities) as string[] : [];

  const totalCommissionAmount = commissions.reduce((sum, c) => sum + c.commission, 0);
  const paidCommissions = commissions.filter((c) => c.status === "PAID");
  const paidTotal = paidCommissions.reduce((sum, c) => sum + c.commission, 0);
  const canEdit = ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"].includes(session.user.role);

  return (
    <div className="space-y-6">
      {/* Breadcrumb + actions */}
      <div>
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <span>Admin</span>
          <span>/</span>
          <Link href="/admin/brokers" className="hover:text-gray-700">
            Makléři
          </Link>
          <span>/</span>
          <span className="text-gray-900">
            {broker.firstName} {broker.lastName}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {broker.firstName} {broker.lastName}
          </h1>
          <div className="flex items-center gap-3">
            {canEdit && (
              <Link href={`/admin/brokers/${broker.id}/edit`}>
                <Button variant="primary" size="sm">
                  ✏️ Upravit
                </Button>
              </Link>
            )}
            <Link href="/admin/brokers">
              <Button variant="outline" size="sm">
                ← Zpět
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Profile header card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {broker.avatar ? (
            <Image
              src={broker.avatar}
              alt={`${broker.firstName} ${broker.lastName}`}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {broker.firstName[0] || ""}
              {broker.lastName[0] || ""}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-extrabold text-gray-900">
                {broker.firstName} {broker.lastName}
              </h2>
              <Badge variant={brokerStatus.variant}>{brokerStatus.label}</Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
              <span>{broker.email}</span>
              {broker.phone && <span>{broker.phone}</span>}
              {broker.ico && <span>IČ: {broker.ico}</span>}
            </div>
            {broker.manager && (
              <div className="text-sm text-gray-500 mt-1">
                Manažer: {broker.manager.firstName} {broker.manager.lastName}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {cities.map((city: string) => (
                <span
                  key={city}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
                >
                  {city}
                </span>
              ))}
              {specializations.map((spec: string) => (
                <span
                  key={spec}
                  className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-md"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 text-center">
          <div className="text-3xl font-extrabold text-gray-900 mb-1">
            {broker._count.vehicles}
          </div>
          <div className="text-sm text-gray-500">Celkem vozidel</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-extrabold text-gray-900 mb-1">
            {broker._count.commissions}
          </div>
          <div className="text-sm text-gray-500">Celkem prodejů</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-extrabold text-gray-900 mb-1">
            {totalCommissionAmount.toLocaleString("cs-CZ")} Kč
          </div>
          <div className="text-sm text-gray-500">Celkem provize</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-extrabold text-gray-900 mb-1">
            {paidTotal.toLocaleString("cs-CZ")} Kč
          </div>
          <div className="text-sm text-gray-500">Vyplaceno</div>
        </Card>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Kontaktní údaje</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">{broker.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Telefon</dt>
              <dd className="font-medium text-gray-900">{broker.phone || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">IČO</dt>
              <dd className="font-medium text-gray-900">{broker.ico || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Bankovní účet</dt>
              <dd className="font-medium text-gray-900">{broker.bankAccount || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Slug</dt>
              <dd className="font-medium text-gray-900 font-mono">{broker.slug || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Level</dt>
              <dd className="font-medium text-gray-900">{broker.level}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Registrován</dt>
              <dd className="font-medium text-gray-900">
                {broker.createdAt.toLocaleDateString("cs-CZ")}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">O makléřovi</h3>
          <p className="text-sm text-gray-700">
            {broker.bio || "Žádné bio."}
          </p>
        </Card>
      </div>

      {/* Vehicles */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Vozidla ({vehicles.length})
        </h3>
        {vehicles.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Makléř nemá žádná vozidla.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 font-medium">Vozidlo</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Rok</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Nájezd</th>
                  <th className="pb-3 font-medium">Cena</th>
                  <th className="pb-3 font-medium">Stav</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map((v) => {
                  const vs = vehicleStatusMap[v.status] || { label: v.status, variant: "pending" as const };
                  return (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <Link
                          href={`/admin/vehicles/${v.id}`}
                          className="flex items-center gap-3 hover:text-orange-500"
                        >
                          <div className="w-14 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                            {v.images[0]?.url ? (
                              <img
                                src={v.images[0].url}
                                alt={`${v.brand} ${v.model}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-lg text-gray-300">🚗</span>
                            )}
                          </div>
                          <span className="font-semibold text-gray-900">
                            {v.brand} {v.model}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 hidden sm:table-cell text-gray-600">{v.year}</td>
                      <td className="py-3 hidden md:table-cell text-gray-600">
                        {v.mileage.toLocaleString("cs-CZ")} km
                      </td>
                      <td className="py-3 font-semibold text-gray-900">
                        {v.price.toLocaleString("cs-CZ")} Kč
                      </td>
                      <td className="py-3">
                        <StatusPill variant={vs.variant}>{vs.label}</StatusPill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Commissions */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Provize ({commissions.length})
        </h3>
        {commissions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Zatím žádné provize.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 font-medium">Vozidlo</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Prodejní cena</th>
                  <th className="pb-3 font-medium">Provize</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Stav</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 font-semibold text-gray-900">
                      {c.vehicle.brand} {c.vehicle.model}
                    </td>
                    <td className="py-3 hidden sm:table-cell text-gray-600">
                      {c.salePrice.toLocaleString("cs-CZ")} Kč
                    </td>
                    <td className="py-3 font-semibold text-gray-900">
                      {c.commission.toLocaleString("cs-CZ")} Kč
                      <span className="text-gray-400 font-normal ml-1">
                        ({(c.rate * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="py-3 hidden md:table-cell">
                      <StatusPill
                        variant={
                          c.status === "PAID" || c.status === "APPROVED"
                            ? "active"
                            : c.status === "CANCELLED"
                              ? "rejected"
                              : "pending"
                        }
                      >
                        {c.status === "PENDING"
                          ? "Čekající"
                          : c.status === "APPROVED"
                            ? "Schváleno"
                            : c.status === "PAID"
                              ? "Vyplaceno"
                              : "Zrušeno"}
                      </StatusPill>
                    </td>
                    <td className="py-3 hidden md:table-cell text-gray-500">
                      {c.soldAt.toLocaleDateString("cs-CZ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
