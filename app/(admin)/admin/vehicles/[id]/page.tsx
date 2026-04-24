import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { TrustScore } from "@/components/ui/TrustScore";

const conditionLabels: Record<string, string> = {
  NEW: "Nové",
  LIKE_NEW: "Jako nové",
  EXCELLENT: "Výborné",
  GOOD: "Dobré",
  FAIR: "Uspokojivé",
  DAMAGED: "Poškozené",
};

const fuelLabels: Record<string, string> = {
  PETROL: "Benzín",
  DIESEL: "Diesel",
  ELECTRIC: "Elektro",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in hybrid",
  LPG: "LPG",
  CNG: "CNG",
};

const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuální",
  AUTOMATIC: "Automatická",
  DSG: "DSG",
  CVT: "CVT",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Koncept",
  DRAFT_QUICK: "Rychlý koncept",
  PENDING: "Čekající",
  REJECTED: "Zamítnuté",
  ACTIVE: "Aktivní",
  RESERVED: "Rezervováno",
  PAID: "Zaplaceno",
  SOLD: "Prodáno",
  ARCHIVED: "Archivováno",
};

export default async function AdminVehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "BACKOFFICE", "MANAGER"].includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      broker: {
        select: { firstName: true, lastName: true, email: true, phone: true },
      },
      images: { orderBy: { order: "asc" } },
    },
  });

  if (!vehicle) {
    notFound();
  }

  const statusVariantMap: Record<string, "active" | "pending" | "rejected" | "draft" | "sold"> = {
    DRAFT: "draft",
    DRAFT_QUICK: "draft",
    PENDING: "pending",
    REJECTED: "rejected",
    ACTIVE: "active",
    RESERVED: "pending",
    PAID: "active",
    SOLD: "sold",
    ARCHIVED: "draft",
  };
  const statusVariant = statusVariantMap[vehicle.status] || "draft";

  return (
    <div className="space-y-6">
      {/* Breadcrumb + actions */}
      <div>
        <p className="text-sm text-gray-500 mb-1">
          <Link href="/admin/vehicles" className="hover:text-gray-700">
            Admin / Vozidla
          </Link>{" "}
          / Detail
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {vehicle.brand} {vehicle.model} {vehicle.variant || ""}
          </h1>
          <div className="flex items-center gap-3">
            <Link href={`/admin/vehicles/${vehicle.id}/edit`}>
              <Button variant="primary" size="sm">
                ✏️ Upravit
              </Button>
            </Link>
            <Link href="/admin/vehicles">
              <Button variant="outline" size="sm">
                ← Zpět
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Status + Trust Score */}
      <div className="flex items-center gap-4">
        <StatusPill variant={statusVariant}>
          {statusLabels[vehicle.status] || vehicle.status}
        </StatusPill>
        <TrustScore value={vehicle.trustScore} />
        {vehicle.rejectionReason && (
          <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
            Důvod zamítnutí: {vehicle.rejectionReason}
          </span>
        )}
      </div>

      {/* Photos */}
      {vehicle.images.length > 0 && (
        <Card className="p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Fotografie ({vehicle.images.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {vehicle.images.map((img) => (
              <div key={img.id} className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                <img src={img.url} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Základní info */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Základní informace</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">VIN</dt>
              <dd className="font-mono font-medium">{vehicle.vin}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Rok výroby</dt>
              <dd className="font-medium">{vehicle.year}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Nájezd</dt>
              <dd className="font-medium">{vehicle.mileage.toLocaleString("cs-CZ")} km</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Palivo</dt>
              <dd className="font-medium">{fuelLabels[vehicle.fuelType] || vehicle.fuelType}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Převodovka</dt>
              <dd className="font-medium">{transmissionLabels[vehicle.transmission] || vehicle.transmission}</dd>
            </div>
            {vehicle.enginePower && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Výkon</dt>
                <dd className="font-medium">{vehicle.enginePower} kW</dd>
              </div>
            )}
            {vehicle.bodyType && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Karoserie</dt>
                <dd className="font-medium">{vehicle.bodyType}</dd>
              </div>
            )}
            {vehicle.color && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Barva</dt>
                <dd className="font-medium">{vehicle.color}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Stav</dt>
              <dd className="font-medium">{conditionLabels[vehicle.condition] || vehicle.condition}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Lokace</dt>
              <dd className="font-medium">{vehicle.city}{vehicle.district ? `, ${vehicle.district}` : ""}</dd>
            </div>
          </dl>
        </Card>

        {/* Cena + makléř */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Cena a makléř</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Cena</dt>
              <dd className="text-xl font-bold text-orange-500">{vehicle.price.toLocaleString("cs-CZ")} Kč</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Cena jednací</dt>
              <dd className="font-medium">{vehicle.priceNegotiable ? "Ano" : "Ne"}</dd>
            </div>
            {vehicle.commission && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Provize</dt>
                <dd className="font-medium">{vehicle.commission.toLocaleString("cs-CZ")} Kč</dd>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 mt-3">
              <dt className="text-gray-500 mb-2">Makléř</dt>
              <dd className="font-medium">
                {vehicle.broker
                  ? `${vehicle.broker.firstName} ${vehicle.broker.lastName}`
                  : vehicle.contactName || "Soukromý prodejce"}
              </dd>
              {vehicle.broker?.email && (
                <dd className="text-gray-500 text-xs mt-1">{vehicle.broker.email}</dd>
              )}
              {vehicle.broker?.phone && (
                <dd className="text-gray-500 text-xs">{vehicle.broker.phone}</dd>
              )}
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Zobrazení</dt>
              <dd className="font-medium">{vehicle.viewCount}×</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Vytvořeno</dt>
              <dd className="font-medium">{vehicle.createdAt.toLocaleDateString("cs-CZ")}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Popis */}
      {vehicle.description && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Popis</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line">{vehicle.description}</p>
        </Card>
      )}
    </div>
  );
}
