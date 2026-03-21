import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { TrustScore } from "@/components/ui/TrustScore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface VehicleData {
  id: string;
  name: string;
  year: number;
  km: string;
  fuel: string;
  transmission: string;
  city: string;
  hp: string;
  price: string;
  trust: number;
  badge: "verified" | "top" | "default";
  photo: string;
  slug?: string;
  sellerType?: "broker" | "private";
  brokerName?: string;
}

export interface VehicleCardProps {
  car: VehicleData;
  className?: string;
}

export function VehicleCard({ car, className }: VehicleCardProps) {
  const href = `/nabidka/${car.slug || car.name.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <Link href={href} className="no-underline block">
      <Card hover className={`group ${className ?? ""}`}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={car.photo}
            alt={car.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {car.badge === "verified" && (
              <Badge variant="verified">✓ Ověřeno</Badge>
            )}
            {car.badge === "top" && (
              <Badge variant="top">⭐ TOP</Badge>
            )}
          </div>

          {/* Favorite button (visual only) */}
          <div
            className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer hover:bg-white"
            aria-label="Přidat do oblíbených"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </div>

          {/* Trust Score — only for broker listings */}
          {(!car.sellerType || car.sellerType === "broker") && (
            <div className="absolute bottom-3 left-3">
              <TrustScore value={car.trust} />
            </div>
          )}

          {/* Private seller badge on image */}
          {car.sellerType === "private" && (
            <div className="absolute bottom-3 left-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-500/80 backdrop-blur-sm rounded-lg text-[12px] font-medium text-white">
                Soukromý prodejce
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-[17px] font-bold text-gray-900 truncate">
            {car.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {car.year} · {car.km} · {car.fuel} · {car.transmission}
          </p>

          {/* Feature tags */}
          <div className="flex gap-2 flex-wrap mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-[10px] text-[13px] font-medium text-gray-600">
              📍 {car.city}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-[10px] text-[13px] font-medium text-gray-600">
              ⚡ {car.hp}
            </span>
          </div>

          {/* Broker name */}
          {(!car.sellerType || car.sellerType === "broker") && car.brokerName && (
            <p className="text-xs text-gray-400 mt-2">
              Makléř: {car.brokerName}
            </p>
          )}

          {/* Price + CTA */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
            <div className="text-[22px] font-extrabold text-gray-900">
              {car.price}{" "}
              <span className="text-sm font-medium text-gray-400">Kč</span>
            </div>
            <Button variant="secondary" size="sm">
              Detail &rarr;
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
