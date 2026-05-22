"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";

interface ServisItem {
  id: string;
  slug: string;
  name: string;
  city: string;
  categories: string[];
  averageRating: number;
  reviewCount: number;
  recommendRate: number;
  tier: string;
  insurancePartner: boolean;
  insuranceNames: string[];
  isVerified: boolean;
  logo: string | null;
}

interface Option {
  value: string;
  label: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  mechanika: "Mechanické opravy",
  karosarna: "Karosárna",
  pneuservis: "Pneuservis",
  elektro: "Autoelektro",
  diagnostika: "Diagnostika",
  "stk-emise": "STK a emise",
  klimatizace: "Klimatizace",
  lakovna: "Lakování",
  tuning: "Tuning",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-orange-400">
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

interface ServisyListProps {
  initialServisy: ServisItem[];
  totalCount: number;
  cityOptions: Option[];
  categoryOptions: Option[];
}

export function ServisyList({ initialServisy, totalCount, cityOptions, categoryOptions }: ServisyListProps) {
  const [servisy, setServisy] = useState<ServisItem[]>(initialServisy);
  const [total, setTotal] = useState(totalCount);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [tier, setTier] = useState("");
  const [insurance, setInsurance] = useState(false);
  const [loading, setLoading] = useState(false);

  async function applyFilters(overrides: Record<string, string | boolean> = {}) {
    setLoading(true);
    const params = new URLSearchParams();
    const c = (overrides.city as string) ?? city;
    const cat = (overrides.category as string) ?? category;
    const t = (overrides.tier as string) ?? tier;
    const ins = (overrides.insurance as boolean) ?? insurance;

    if (c) params.set("city", c);
    if (cat) params.set("category", cat);
    if (t) params.set("tier", t);
    if (ins) params.set("insurance", "true");

    try {
      const res = await fetch(`/api/autoservisy?${params}`);
      if (res.ok) {
        const data = await res.json();
        setServisy(data.servisy);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Select
          options={cityOptions}
          value={city}
          onChange={(e) => { setCity(e.target.value); applyFilters({ city: e.target.value }); }}
        />
        <Select
          options={categoryOptions}
          value={category}
          onChange={(e) => { setCategory(e.target.value); applyFilters({ category: e.target.value }); }}
        />
        <Select
          options={[
            { value: "", label: "Všechny typy" },
            { value: "AUTORIZOVANY", label: "Autorizované" },
            { value: "NEOFICIALNI", label: "Nezávislé" },
          ]}
          value={tier}
          onChange={(e) => { setTier(e.target.value); applyFilters({ tier: e.target.value }); }}
        />
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={insurance}
            onChange={(e) => { setInsurance(e.target.checked); applyFilters({ insurance: e.target.checked }); }}
            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          Pojišťovny
        </label>
      </div>

      <p className="text-sm text-gray-500 mb-4">{total} servisů</p>

      {/* Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${loading ? "opacity-50" : ""}`}>
        {servisy.map((s) => (
          <Link key={s.id} href={`/autoservisy/${s.slug}`} className="no-underline">
            <Card hover className="p-6 h-full">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {s.tier === "AUTORIZOVANY" && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700">
                        Autorizovaný
                      </span>
                    )}
                    {s.isVerified && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700">
                        Ověřený
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 truncate">{s.name}</h3>
                  <p className="text-sm text-gray-500">{s.city}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1">
                    <Stars rating={s.averageRating} />
                    <span className="font-bold text-gray-900">{s.averageRating > 0 ? s.averageRating.toFixed(1) : "—"}</span>
                  </div>
                  <p className="text-xs text-gray-500">{s.reviewCount} recenzí</p>
                </div>
              </div>

              {/* Categories */}
              {s.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {s.categories.slice(0, 4).map((cat) => (
                    <span key={cat} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                      {CATEGORY_LABELS[cat] || cat}
                    </span>
                  ))}
                  {s.categories.length > 4 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-400">
                      +{s.categories.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Insurance */}
              {s.insurancePartner && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600">
                  <span>Pojišťovny: {s.insuranceNames.slice(0, 3).join(", ")}</span>
                  {s.insuranceNames.length > 3 && <span>+{s.insuranceNames.length - 3}</span>}
                </div>
              )}

              {s.recommendRate > 0 && (
                <p className="text-xs text-green-600 mt-2">{s.recommendRate}% doporučuje</p>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {servisy.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🔧</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Žádné servisy</h3>
          <p className="text-sm text-gray-500">Zkuste upravit filtry.</p>
        </div>
      )}
    </>
  );
}
