import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { TrustScore } from "@/components/ui/TrustScore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FavoriteButton } from "@/components/web/FavoriteButton";
import { CompareButton } from "@/components/web/CompareButton";
import { ListingBadge } from "@/components/web/ListingBadge";

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
  /** Původní cena (pro zobrazení "Zlevněno") */
  originalPrice?: number;
  /** Aktuální cena jako číslo */
  priceNum?: number;
  /** STK platnost (ISO string) */
  stkValidUntil?: string;
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
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[calc(100%-60px)]">
            {(car.isPremium || car.badge === "top") && (
              <ListingBadge type="top" />
            )}
            {car.listingType === "BROKER" && (
              <ListingBadge type="broker" />
            )}
            {car.listingType === "DEALER" && (
              <ListingBadge type="partner" />
            )}
            {car.listingType === "PRIVATE" && (
              <ListingBadge type="private" />
            )}
            {!car.listingType && car.badge === "verified" && (
              <ListingBadge type="broker" />
            )}
            {car.originalPrice && car.priceNum && car.originalPrice > car.priceNum && (
              <ListingBadge
                type="discounted"
                discountPercent={Math.round(
                  ((car.originalPrice - car.priceNum) / car.originalPrice) * 100
                )}
              />
            )}
            {car.stkValidUntil && new Date(car.stkValidUntil) > new Date() && (
              <ListingBadge
                type="stk_valid"
                stkDate={`${String(new Date(car.stkValidUntil).getMonth() + 1).padStart(2, "0")}/${new Date(car.stkValidUntil).getFullYear()}`}
              />
            )}
          </div>

          {/* Compare button */}
          <CompareButton
            vehicle={{
              id: car.id,
              name: car.name,
              photo: car.photo,
              slug: car.slug || car.name.toLowerCase().replace(/\s+/g, '-'),
            }}
          />

          {/* Favorite button */}
          <FavoriteButton listingId={car.source === "listing" ? car.id : undefined} />

          {/* Trust Score — only for broker vehicle listings */}
          {(!car.sellerType || car.sellerType === "broker") && !car.listingType && (
            <div className="absolute bottom-3 left-3">
              <TrustScore value={car.trust} />
            </div>
          )}

          {/* Trust Score — only for non-listing broker vehicles */}
          {/* (seller type badges are now in the top-left badge row) */}
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
