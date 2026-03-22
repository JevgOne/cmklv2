import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { TrustScore } from "@/components/ui/TrustScore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FavoriteButton } from "@/components/web/FavoriteButton";

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
  sellerType?: "broker" | "private" | "dealer" | "listing";
  brokerName?: string;
  listingType?: "BROKER" | "DEALER" | "PRIVATE";
  isPremium?: boolean;
  source?: "vehicle" | "listing";
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
            {car.isPremium && car.badge !== "top" && (
              <Badge variant="top">⭐ TOP</Badge>
            )}
            {car.listingType === "DEALER" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/90 backdrop-blur-sm rounded-lg text-[11px] font-semibold text-white">
                Autobazar
              </span>
            )}
          </div>

          {/* Favorite button (visual only) */}
          <FavoriteButton />

          {/* Trust Score — only for broker vehicle listings */}
          {(!car.sellerType || car.sellerType === "broker") && !car.listingType && (
            <div className="absolute bottom-3 left-3">
              <TrustScore value={car.trust} />
            </div>
          )}

          {/* Seller type badge on image */}
          {(car.sellerType === "private" || car.listingType === "PRIVATE") && (
            <div className="absolute bottom-3 left-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-500/80 backdrop-blur-sm rounded-lg text-[12px] font-medium text-white">
                Soukromý prodejce
              </span>
            </div>
          )}
          {car.listingType === "BROKER" && (
            <div className="absolute bottom-3 left-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-500/90 backdrop-blur-sm rounded-lg text-[12px] font-semibold text-white">
                ✓ Ověřeno makléřem
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
