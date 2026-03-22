import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatMileage } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReserveButton } from "@/components/pwa/vehicles/ReserveButton";
import { DamageReportButton } from "@/components/pwa/vehicles/DamageReportButton";

const statusMap: Record<string, { variant: "verified" | "top" | "pending" | "rejected" | "default"; label: string }> = {
  ACTIVE: { variant: "verified", label: "Aktivni" },
  PENDING: { variant: "pending", label: "Ke schvaleni" },
  REJECTED: { variant: "rejected", label: "Zamitnuto" },
  DRAFT: { variant: "default", label: "Draft" },
  SOLD: { variant: "top", label: "Prodano" },
  RESERVED: { variant: "pending", label: "Rezervovano" },
  ARCHIVED: { variant: "default", label: "Archivovano" },
};

const fuelLabels: Record<string, string> = {
  PETROL: "Benzin",
  DIESEL: "Diesel",
  ELECTRIC: "Elektro",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in hybrid",
  LPG: "LPG",
  CNG: "CNG",
};

const transmissionLabels: Record<string, string> = {
  MANUAL: "Manual",
  AUTOMATIC: "Automat",
  DSG: "DSG",
  CVT: "CVT",
};

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      inquiries: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      damageReports: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });

  if (!vehicle || vehicle.brokerId !== session.user.id) {
    notFound();
  }

  const statusInfo = statusMap[vehicle.status] || { variant: "default" as const, label: vehicle.status };
  const title = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""}`;
  const primaryImage = vehicle.images.find((img) => img.isPrimary) || vehicle.images[0];
  const newInquiries = vehicle.inquiries.filter((i) => i.status === "NEW").length;

  return (
    <div className="pb-24">
      {/* Header image */}
      <div className="relative w-full h-56 bg-gray-100">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">
            🚗
          </div>
        )}
        <Link
          href="/makler/vehicles"
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </Link>
        <div className="absolute top-4 right-4">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {vehicle.year} · {formatMileage(vehicle.mileage)} · {fuelLabels[vehicle.fuelType] || vehicle.fuelType} · {transmissionLabels[vehicle.transmission] || vehicle.transmission}
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            {formatPrice(vehicle.price)}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{vehicle.viewCount}</p>
            <p className="text-xs text-gray-500">Zobrazeni</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{vehicle.inquiries.length}</p>
            <p className="text-xs text-gray-500">Dotazy</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{vehicle.damageReports.length}</p>
            <p className="text-xs text-gray-500">Poskozeni</p>
          </Card>
        </div>

        {/* Dotazy */}
        {newInquiries > 0 && (
          <Link href={`/makler/messages/${vehicle.id}`} className="block no-underline">
            <Card className="p-4 flex items-center justify-between bg-orange-50 border border-orange-200">
              <div>
                <p className="font-semibold text-gray-900">
                  {newInquiries} {newInquiries === 1 ? "novy dotaz" : newInquiries < 5 ? "nove dotazy" : "novych dotazu"}
                </p>
                <p className="text-sm text-gray-500">Kliknutim zobrazite</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-orange-500">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </Card>
          </Link>
        )}

        {/* Akce */}
        <div className="space-y-3">
          {vehicle.status === "ACTIVE" && (
            <ReserveButton vehicleId={vehicle.id} vehicleName={title} />
          )}

          {vehicle.status === "RESERVED" && (
            <Link href={`/makler/vehicles/${vehicle.id}/handover`} className="block no-underline">
              <Button variant="success" size="lg" className="w-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                Predavaci checklist
              </Button>
            </Link>
          )}

          <DamageReportButton vehicleId={vehicle.id} />

          <Link href={`/makler/vehicles/${vehicle.id}/edit`} className="block no-underline">
            <Button variant="outline" size="default" className="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
              </svg>
              Upravit vozidlo
            </Button>
          </Link>

          <Link href={`/makler/messages/${vehicle.id}`} className="block no-underline">
            <Button variant="ghost" size="default" className="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 01-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 01-1.33 0l-1.713-3.293a.783.783 0 00-.642-.413 41.108 41.108 0 01-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902z" clipRule="evenodd" />
              </svg>
              Vsechny dotazy
            </Button>
          </Link>
        </div>

        {/* Rezervace info */}
        {vehicle.status === "RESERVED" && vehicle.reservedFor && (
          <Card className="p-4 bg-yellow-50 border border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-2">Rezervace</h3>
            <p className="text-sm text-gray-600">
              Rezervovano pro: <span className="font-medium">{vehicle.reservedFor}</span>
            </p>
            {vehicle.reservedPrice && (
              <p className="text-sm text-gray-600">
                Dohodnuta cena: <span className="font-medium">{formatPrice(vehicle.reservedPrice)}</span>
              </p>
            )}
            {vehicle.reservedAt && (
              <p className="text-sm text-gray-400 mt-1">
                {new Date(vehicle.reservedAt).toLocaleDateString("cs-CZ")}
              </p>
            )}
          </Card>
        )}

        {/* Poškození */}
        {vehicle.damageReports.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Nahlasena poskozeni</h3>
            <div className="space-y-2">
              {vehicle.damageReports.map((report) => (
                <Card key={report.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{report.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {report.severity === "COSMETIC" ? "Kosmeticke" : report.severity === "FUNCTIONAL" ? "Funkcni" : "Vazne"}
                        {" · "}
                        {new Date(report.createdAt).toLocaleDateString("cs-CZ")}
                      </p>
                    </div>
                    {report.repaired ? (
                      <Badge variant="verified">Opraveno</Badge>
                    ) : (
                      <Badge variant="rejected">Neopraveno</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
