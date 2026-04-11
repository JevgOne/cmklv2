"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { DeletePartDialog } from "@/components/pwa-parts/parts/DeletePartDialog";

interface PartImage {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

interface PartDetail {
  id: string;
  name: string;
  slug: string;
  category: string;
  condition: string;
  partType: string;
  price: number;
  vatIncluded: boolean;
  stock: number;
  status: string;
  description: string | null;
  oemNumber: string | null;
  manufacturer: string | null;
  warranty: string | null;
  compatibleBrands: string | null;
  compatibleModels: string | null;
  compatibleYearFrom: number | null;
  compatibleYearTo: number | null;
  viewCount: number;
  images: PartImage[];
  supplierId: string;
  supplier: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
  };
}

const statusConfig: Record<string, { label: string; variant: "verified" | "default" | "pending" | "new" }> = {
  ACTIVE: { label: "Aktivní", variant: "verified" },
  INACTIVE: { label: "Neaktivní", variant: "default" },
  SOLD: { label: "Prodáno", variant: "pending" },
  RESERVED: { label: "Rezervováno", variant: "new" },
  DRAFT: { label: "Koncept", variant: "default" },
};

const categoryLabels: Record<string, string> = {
  ENGINE: "Motor", TRANSMISSION: "Převodovka", BODY: "Karosérie",
  INTERIOR: "Interiér", ELECTRICAL: "Elektro", SUSPENSION: "Podvozek",
  BRAKES: "Brzdy", EXHAUST: "Výfuk", COOLING: "Klimatizace",
  WHEELS: "Kola", FUEL: "Palivo", OTHER: "Ostatní",
};

const conditionLabels: Record<string, string> = {
  NEW: "Nový", USED_GOOD: "Plně funkční", USED_FAIR: "Funkční s vadou",
  USED_POOR: "Na díly", REFURBISHED: "Repasovaný",
};

export default function PartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [part, setPart] = useState<PartDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchPart = useCallback(async () => {
    try {
      const res = await fetch(`/api/parts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPart(data.part);
      }
    } catch {
      // handled by empty state
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPart();
  }, [fetchPart]);

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <div className="aspect-video bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
        <div className="h-8 bg-gray-100 rounded animate-pulse w-1/3" />
      </div>
    );
  }

  if (!part) {
    return (
      <div className="px-4 py-16 max-w-lg mx-auto text-center">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-lg font-bold text-gray-900">Díl nenalezen</h2>
        <p className="text-sm text-gray-500 mt-1">Díl byl odstraněn nebo neexistuje.</p>
        <Link href="/parts/my" className="no-underline">
          <Button variant="primary" size="sm" className="mt-4">
            Zpět na moje díly
          </Button>
        </Link>
      </div>
    );
  }

  const images = part.images;
  const cfg = statusConfig[part.status] ?? statusConfig.DRAFT;

  const brands = part.compatibleBrands ? JSON.parse(part.compatibleBrands) as string[] : [];
  const models = part.compatibleModels ? JSON.parse(part.compatibleModels) as string[] : [];

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Image carousel */}
      <div className="relative aspect-video bg-gray-100">
        {images.length > 0 ? (
          <>
            <Image
              src={images[imageIndex]?.url}
              alt={part.name}
              fill
              className="object-cover"
              sizes="(max-width: 512px) 100vw, 512px"
            />
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={`w-2 h-2 rounded-full border-none cursor-pointer transition-colors ${
                      i === imageIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl text-gray-300">🔧</span>
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Status + category badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          <Badge variant="default">{categoryLabels[part.category] ?? part.category}</Badge>
          <Badge variant="default">{conditionLabels[part.condition] ?? part.condition}</Badge>
          {part.partType && part.partType !== "USED" && (
            <Badge variant="new">{part.partType === "NEW" ? "Nový" : "Aftermarket"}</Badge>
          )}
        </div>

        {/* Name + price */}
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">{part.name}</h1>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-gray-900">{formatPrice(part.price)}</span>
            <span className="text-sm text-gray-500">{part.vatIncluded ? "s DPH" : "bez DPH"}</span>
          </div>
        </div>

        {/* Description */}
        {part.description && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">Popis</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{part.description}</p>
          </div>
        )}

        {/* Manufacturer + Warranty */}
        {(part.manufacturer || part.warranty) && (
          <div className="p-4 bg-gray-50 rounded-xl space-y-2">
            {part.manufacturer && (
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-600">Výrobce</span>
                <span className="text-gray-900">{part.manufacturer}</span>
              </div>
            )}
            {part.warranty && (
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-600">Záruka</span>
                <span className="text-gray-900">{part.warranty}</span>
              </div>
            )}
          </div>
        )}

        {/* Details grid */}
        <div className="p-4 bg-gray-50 rounded-xl space-y-2">
          {part.oemNumber && (
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-600">OEM číslo</span>
              <span className="text-gray-900">{part.oemNumber}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-600">Sklad</span>
            <span className="text-gray-900">{part.stock} ks</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-600">Zobrazení</span>
            <span className="text-gray-900">{part.viewCount}</span>
          </div>
        </div>

        {/* Compatibility */}
        {brands.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Kompatibilita</h3>
            <div className="space-y-1">
              {brands.map((brand, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="font-medium">{brand}</span>
                  {models[i] && <span className="text-gray-500">{models[i]}</span>}
                  {part.compatibleYearFrom && (
                    <span className="text-gray-400">
                      ({part.compatibleYearFrom}{part.compatibleYearTo ? `-${part.compatibleYearTo}` : ""})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Link href="/parts/my" className="flex-1 no-underline">
            <Button variant="outline" size="lg" className="w-full">
              Zpět
            </Button>
          </Link>
          <Link href={`/parts/${part.id}/edit`} className="flex-1 no-underline">
            <Button variant="primary" size="lg" className="w-full bg-gradient-to-br from-green-500 to-green-600">
              Upravit
            </Button>
          </Link>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="w-full text-red-500 border-red-200 hover:bg-red-50"
          onClick={() => setDeleteOpen(true)}
        >
          Smazat díl
        </Button>
      </div>

      <DeletePartDialog
        partId={part.id}
        partName={part.name}
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => router.push("/parts/my")}
      />
    </div>
  );
}
