"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface FavoriteListing {
  id: string;
  listingId: string;
  listing: {
    id: string;
    slug: string;
    brand: string;
    model: string;
    variant: string | null;
    year: number;
    mileage: number;
    price: number;
    fuelType: string;
    city: string;
    status: string;
    images: { url: string; isPrimary: boolean }[];
  };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(price);
}

interface FavoritesListProps {
  initialFavorites: FavoriteListing[];
}

export function FavoritesList({ initialFavorites }: FavoritesListProps) {
  const [favorites, setFavorites] = useState<FavoriteListing[]>(initialFavorites);

  const removeFavorite = async (favoriteId: string, listingId: string) => {
    try {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    } catch {
      // silently fail
    }
  };

  if (favorites.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">&#9829;</div>
        <h3 className="text-xl font-bold text-gray-900">Zatím nemáte oblíbené vozy</h3>
        <p className="text-gray-500 mt-2">Přidejte si vozy do oblíbených kliknutím na srdíčko v katalogu.</p>
        <Link href="/nabidka" className="inline-block mt-4 text-orange-500 font-semibold no-underline">
          Prohlédnout nabídku &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Oblíbené vozy ({favorites.length})
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((fav) => {
          const listing = fav.listing;
          const primaryImage = listing.images?.find((img) => img.isPrimary) || listing.images?.[0];

          return (
            <Card key={fav.id} hover className="group">
              <Link href={`/nabidka/${listing.slug}`} className="no-underline block">
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                  {primaryImage ? (
                    <img
                      src={primaryImage.url}
                      alt={`${listing.brand} ${listing.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                      &#128247;
                    </div>
                  )}
                  {listing.status !== "ACTIVE" && (
                    <Badge variant="rejected" className="absolute top-2 left-2">
                      Neaktivní
                    </Badge>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-[15px] truncate">
                    {listing.brand} {listing.model} {listing.variant || ""}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {listing.year} &middot; {new Intl.NumberFormat("cs-CZ").format(listing.mileage)} km &middot; {listing.fuelType}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-lg font-extrabold text-gray-900">
                      {formatPrice(listing.price)}
                    </span>
                    <span className="text-xs text-gray-500">{listing.city}</span>
                  </div>
                </div>
              </Link>

              <div className="px-4 pb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFavorite(fav.id, fav.listingId)}
                  className="text-error-500 w-full"
                >
                  Odebrat z oblíbených
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
