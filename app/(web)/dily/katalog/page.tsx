"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { ProductCard } from "@/components/web/ProductCard";
import { PartRequestForm } from "@/components/web/PartRequestForm";

interface PartImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface PartResult {
  id: string;
  slug: string;
  name: string;
  category: string;
  condition: string;
  partType: string;
  price: number;
  stock: number;
  compatibleBrands: string | null;
  compatibleModels: string | null;
  images: PartImage[];
}

const tabs = [
  { value: "vse", label: "Vše" },
  { value: "ENGINE", label: "Motor" },
  { value: "BODY", label: "Karoserie" },
  { value: "BRAKES", label: "Brzdy" },
  { value: "SUSPENSION", label: "Podvozek" },
  { value: "ELECTRICAL", label: "Elektro" },
  { value: "INTERIOR", label: "Interiér" },
];

const brandOptions = [
  { value: "Škoda", label: "Škoda" },
  { value: "Volkswagen", label: "Volkswagen" },
  { value: "BMW", label: "BMW" },
  { value: "Audi", label: "Audi" },
  { value: "Mercedes-Benz", label: "Mercedes-Benz" },
  { value: "Hyundai", label: "Hyundai" },
  { value: "Toyota", label: "Toyota" },
  { value: "Ford", label: "Ford" },
];

const partTypeOptions = [
  { value: "", label: "Vše" },
  { value: "USED", label: "Použité" },
  { value: "NEW", label: "Nové" },
  { value: "AFTERMARKET", label: "Aftermarket" },
];

const sortOptions = [
  { value: "newest", label: "Nejnovější" },
  { value: "cheapest", label: "Nejlevnější" },
  { value: "expensive", label: "Nejdražší" },
  { value: "popular", label: "Nejoblíbenější" },
];

function conditionToStars(condition: string): number | undefined {
  switch (condition) {
    case "NEW": return undefined;
    case "USED_GOOD": return 4;
    case "USED_FAIR": return 3;
    case "USED_POOR": return 2;
    case "REFURBISHED": return 5;
    default: return undefined;
  }
}

function getPartTypeBadge(partType: string): "used" | "new" | "aftermarket" {
  switch (partType) {
    case "NEW": return "new";
    case "AFTERMARKET": return "aftermarket";
    default: return "used";
  }
}

function DilyKatalogInner() {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get("category") || "vse");
  const [brand, setBrand] = useState("");
  const [partType, setPartType] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [parts, setParts] = useState<PartResult[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();

    if (activeTab !== "vse") params.set("category", activeTab);
    if (brand) params.set("brand", brand);
    if (partType) params.set("partType", partType);
    if (manufacturer) params.set("manufacturer", manufacturer);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (inStock) params.set("inStock", "true");
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "18");

    try {
      const res = await fetch(`/api/parts?${params.toString()}`);
      if (!res.ok) {
        console.error("Parts API error:", res.status);
        setParts([]);
        return;
      }
      const data = await res.json();
      setParts(data.parts ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
    } catch {
      setParts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, brand, partType, manufacturer, minPrice, maxPrice, inStock, sort, page]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Katalog dílů a příslušenství
          </h1>
          <p className="text-gray-500 mt-2">
            <span className="font-bold text-orange-500">{total}</span> produktů
            v nabídce
          </p>
        </div>
      </section>

      {/* Tabs + Filters + Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4 items-end">
            <Select
              label="Značka vozu"
              placeholder="Všechny značky"
              options={brandOptions}
              value={brand}
              onChange={(e) => { setBrand(e.target.value); setPage(1); }}
            />
            <Select
              label="Typ dílu"
              placeholder="Vše"
              options={partTypeOptions}
              value={partType}
              onChange={(e) => { setPartType(e.target.value); setPage(1); }}
            />
            <Input
              label="Výrobce"
              placeholder="TRW, Bosch..."
              value={manufacturer}
              onChange={(e) => { setManufacturer(e.target.value); setPage(1); }}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Cena od"
                placeholder="0"
                type="number"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
              />
              <Input
                label="Cena do"
                placeholder="50 000"
                type="number"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
              />
            </div>
            <Select
              label="Řazení"
              options={sortOptions}
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
            />
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
                Dostupnost
              </span>
              <label className="flex items-center gap-2 cursor-pointer py-3">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
                  className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                />
                <span className="text-[15px] font-medium text-gray-700">
                  Pouze skladem
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : parts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {parts.map((part) => (
              <ProductCard
                key={part.id}
                partId={part.id}
                name={part.name}
                compatibility={
                  part.compatibleBrands
                    ? JSON.parse(part.compatibleBrands).join(", ")
                    : "Univerzální"
                }
                condition={conditionToStars(part.condition)}
                price={part.price}
                badge={getPartTypeBadge(part.partType)}
                slug={part.slug}
                image={part.images[0]?.url}
                stock={part.stock}
                basePath="/dily"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">&#128269;</span>
            <h3 className="text-xl font-bold text-gray-900">
              Žádné díly nenalezeny
            </h3>
            <p className="text-gray-500 mt-2 mb-6">
              Zkuste změnit filtry nebo hledejte v jiné kategorii.
            </p>
            <div className="max-w-2xl mx-auto bg-white rounded-xl p-6 shadow-sm border border-orange-100">
              <h4 className="text-lg font-bold text-gray-900 mb-1">
                Nenašli jste? Poptejte u vrakovišť!
              </h4>
              <p className="text-gray-500 text-sm mb-4">
                Popište jaký díl hledáte a ověřená vrakoviště vám pošlou nabídky.
              </p>
              <PartRequestForm
                prefillQuery={searchParams.get("q") ?? undefined}
              />
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              &larr; Předchozí
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm cursor-pointer transition-colors border-none ${
                    p === page
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="text-gray-500 px-1">...</span>
                <button
                  onClick={() => setPage(totalPages)}
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm cursor-pointer transition-colors border-none ${
                    totalPages === page
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Další &rarr;
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function KatalogFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="h-9 w-80 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mt-2" />
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DilyKatalogPage() {
  return (
    <Suspense fallback={<KatalogFallback />}>
      <DilyKatalogInner />
    </Suspense>
  );
}
