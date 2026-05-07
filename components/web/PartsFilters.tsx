"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";

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

const conditionOptions = [
  { value: "", label: "Vše" },
  { value: "NEW", label: "Nové" },
  { value: "USED_GOOD", label: "Použité — velmi dobrý" },
  { value: "USED_FAIR", label: "Použité — dobrý" },
  { value: "REFURBISHED", label: "Repasované" },
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

interface PartsFiltersProps {
  variant: "shop" | "dily";
  resultCount: number;
}

export function PartsFilters({ variant }: PartsFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      const basePath = variant === "dily" ? "/dily/katalog" : "/shop/katalog";
      router.push(`${basePath}?${params.toString()}`);
    },
    [searchParams, router, variant]
  );

  const activeTab = searchParams.get("category") || "vse";

  return (
    <>
      {/* Category tabs */}
      <div className="mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(val) => updateParam("category", val === "vse" ? "" : val)}
        />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm mb-6 sm:mb-8">
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-end",
          variant === "dily" ? "lg:grid-cols-7" : "lg:grid-cols-5"
        )}>
          <Select
            label="Značka vozu"
            placeholder="Všechny značky"
            options={brandOptions}
            value={searchParams.get("brand") || ""}
            onChange={(e) => updateParam("brand", e.target.value)}
          />

          {variant === "shop" && (
            <Select
              label="Stav"
              placeholder="Vše"
              options={conditionOptions}
              value={searchParams.get("condition") || ""}
              onChange={(e) => updateParam("condition", e.target.value)}
            />
          )}

          {variant === "dily" && (
            <>
              <Select
                label="Typ dílu"
                placeholder="Vše"
                options={partTypeOptions}
                value={searchParams.get("partType") || ""}
                onChange={(e) => updateParam("partType", e.target.value)}
              />
              <Input
                label="Výrobce"
                placeholder="TRW, Bosch..."
                value={searchParams.get("manufacturer") || ""}
                onChange={(e) => updateParam("manufacturer", e.target.value)}
              />
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Cena od"
              placeholder="0"
              type="number"
              value={searchParams.get("minPrice") || ""}
              onChange={(e) => updateParam("minPrice", e.target.value)}
            />
            <Input
              label="Cena do"
              placeholder="50 000"
              type="number"
              value={searchParams.get("maxPrice") || ""}
              onChange={(e) => updateParam("maxPrice", e.target.value)}
            />
          </div>

          <Select
            label="Řazení"
            options={sortOptions}
            value={searchParams.get("sort") || "newest"}
            onChange={(e) => updateParam("sort", e.target.value)}
          />

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
              Dostupnost
            </span>
            <label className="flex items-center gap-2 cursor-pointer py-3">
              <input
                type="checkbox"
                checked={searchParams.get("inStock") === "true"}
                onChange={(e) => updateParam("inStock", e.target.checked ? "true" : "")}
                className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
              />
              <span className="text-[15px] font-medium text-gray-700">
                Pouze skladem
              </span>
            </label>
          </div>
        </div>
      </div>
    </>
  );
}
