"use client";

import { useEffect, useState, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

/* ------------------------------------------------------------------ */
/*  Typy                                                               */
/* ------------------------------------------------------------------ */

interface PartData {
  id: string;
  slug: string;
  name: string;
  price: number;
  partType: string; // USED, NEW, AFTERMARKET
  condition: string; // NEW, USED_GOOD, USED_FAIR, USED_POOR, REFURBISHED
  stock: number;
  image: string | null;
}

interface RecommendedPartsProps {
  brand: string;
  model: string;
  year: number;
}

/* ------------------------------------------------------------------ */
/*  Helpery                                                            */
/* ------------------------------------------------------------------ */

const partTypeBadge: Record<string, { label: string; variant: "new" | "default" | "verified" }> = {
  NEW: { label: "Nový", variant: "new" },
  USED: { label: "Použitý", variant: "default" },
  AFTERMARKET: { label: "Aftermarket", variant: "verified" },
};

const conditionLabels: Record<string, string> = {
  NEW: "Nový",
  USED_GOOD: "Dobrý stav",
  USED_FAIR: "Uspokojivé",
  USED_POOR: "Horší stav",
  REFURBISHED: "Repasovaný",
};

function formatCzk(price: number): string {
  return new Intl.NumberFormat("cs-CZ").format(price);
}

/* ------------------------------------------------------------------ */
/*  Komponenta                                                         */
/* ------------------------------------------------------------------ */

export const RecommendedParts = memo(function RecommendedParts({ brand, model, year }: RecommendedPartsProps) {
  const [parts, setParts] = useState<PartData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({
      brand,
      model,
      year: String(year),
      limit: "6",
    });

    fetch(`/api/parts/for-vehicle?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setParts(data.parts || []);
        setTotalCount(data.totalCount || 0);
      })
      .catch(() => {
        setParts([]);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [brand, model, year]);

  // Pokud neni zadny dil nebo stale nacitame a nemame data, nezobrazovat
  if (!loading && parts.length === 0) return null;

  // Skeleton loading
  if (loading) {
    return (
      <div>
        <h2 className="text-[22px] font-extrabold text-gray-900 mb-6">
          Díly pro tento vůz skladem
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-5 bg-gray-100 rounded w-1/3" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const catalogUrl = `/dily/katalog?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&year=${year}`;

  return (
    <div>
      <h2 className="text-[22px] font-extrabold text-gray-900 mb-6">
        Díly pro tento vůz skladem
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {parts.map((part) => {
          const typeCfg = partTypeBadge[part.partType] || partTypeBadge.USED;
          const condLabel = conditionLabels[part.condition] || part.condition;
          const detailHref = `/dily/${part.slug}`;

          return (
            <Link key={part.id} href={detailHref} className="no-underline group">
              <Card hover className="flex flex-col h-full">
                {/* Obrazek */}
                <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {part.image ? (
                    <Image
                      src={part.image}
                      alt={part.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <span className="text-4xl text-gray-300">🔧</span>
                  )}
                  {/* Typ badge */}
                  <span className="absolute top-2 left-2">
                    <Badge variant={typeCfg.variant} className="text-[11px] px-2 py-1">
                      {typeCfg.label}
                    </Badge>
                  </span>
                </div>

                {/* Obsah */}
                <div className="p-3 sm:p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-900 text-[14px] leading-tight line-clamp-2 mb-1">
                    {part.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">{condLabel}</p>

                  {/* Cena */}
                  <div className="mt-auto">
                    <span className="text-lg font-extrabold text-gray-900">
                      {formatCzk(part.price)} Kč
                    </span>
                  </div>

                  {/* Dostupnost */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        part.stock > 0 ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-xs text-gray-500">
                      {part.stock > 0 ? "Skladem" : "Nedostupné"}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* CTA link */}
      {totalCount > parts.length && (
        <div className="mt-6 text-center">
          <Link
            href={catalogUrl}
            className="inline-flex items-center gap-2 text-orange-700 font-semibold hover:text-orange-600 transition-colors"
          >
            Zobrazit všech {totalCount} dílů pro tento vůz
            <svg
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
});
