import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatPrice, formatMileage } from "@/lib/utils";

interface VehicleCardProps {
  vehicle: {
    id: string;
    brand: string;
    model: string;
    variant: string | null;
    year: number;
    mileage: number;
    price: number;
    status: string;
    fuelType: string;
    transmission: string;
    viewCount: number;
    images: { url: string; isPrimary: boolean }[];
  };
}

const statusMap: Record<string, { variant: "active" | "pending" | "rejected" | "draft" | "sold"; label: string }> = {
  ACTIVE: { variant: "active", label: "Aktivni" },
  PENDING: { variant: "pending", label: "Ke schvaleni" },
  REJECTED: { variant: "rejected", label: "Zamitnuto" },
  DRAFT: { variant: "draft", label: "Draft" },
  SOLD: { variant: "sold", label: "Prodano" },
  RESERVED: { variant: "pending", label: "Rezervovano" },
  ARCHIVED: { variant: "draft", label: "Archivovano" },
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

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const primaryImage = vehicle.images.find((img) => img.isPrimary) || vehicle.images[0];
  const statusInfo = statusMap[vehicle.status] || { variant: "draft" as const, label: vehicle.status };
  const title = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""}`;

  return (
    <Link
      href={`/makler/vehicles/${vehicle.id}`}
      className="block no-underline"
    >
      <Card hover className="flex overflow-hidden">
        {/* Miniatura */}
        <div className="w-28 h-28 flex-shrink-0 bg-gray-100 relative">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={title}
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">
              🚗
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 text-sm truncate">
              {title}
            </h3>
            <StatusPill variant={statusInfo.variant}>
              {statusInfo.label}
            </StatusPill>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{vehicle.year}</span>
            <span>·</span>
            <span>{formatMileage(vehicle.mileage)}</span>
            <span>·</span>
            <span>{fuelLabels[vehicle.fuelType] || vehicle.fuelType}</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-extrabold text-gray-900">
              {formatPrice(vehicle.price)}
            </span>
            {vehicle.status === "ACTIVE" && (
              <span className="text-xs text-gray-400">
                {vehicle.viewCount} zobrazeni
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
