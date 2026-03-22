"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface QuickFilter {
  id: string;
  label: string;
  icon: string;
  params: Record<string, string>;
}

const quickFilters: QuickFilter[] = [
  {
    id: "suv-500k",
    label: "SUV do 500k",
    icon: "🚙",
    params: { bodyType: "SUV", maxPrice: "500000" },
  },
  {
    id: "elektro",
    label: "Elektro",
    icon: "⚡",
    params: { fuelType: "ELECTRIC" },
  },
  {
    id: "rodina",
    label: "Pro rodinu",
    icon: "👨‍👩‍👧‍👦",
    params: { bodyType: "COMBI", maxPrice: "600000" },
  },
  {
    id: "do-200k",
    label: "Do 200 000 Kč",
    icon: "💰",
    params: { maxPrice: "200000" },
  },
  {
    id: "automat",
    label: "Automat",
    icon: "🅰️",
    params: { transmission: "AUTOMATIC" },
  },
  {
    id: "diesel",
    label: "Diesel",
    icon: "⛽",
    params: { fuelType: "DIESEL" },
  },
  {
    id: "overeno",
    label: "Ověřeno makléřem",
    icon: "✓",
    params: { sellerType: "broker" },
  },
  {
    id: "sedan",
    label: "Sedan",
    icon: "🚗",
    params: { bodyType: "SEDAN" },
  },
  {
    id: "hybrid",
    label: "Hybrid",
    icon: "🔋",
    params: { fuelType: "HYBRID" },
  },
  {
    id: "do-100k-km",
    label: "Do 100 000 km",
    icon: "🛣️",
    params: { maxMileage: "100000" },
  },
];

export function QuickFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isActive = (filter: QuickFilter): boolean => {
    return Object.entries(filter.params).every(
      ([key, value]) => searchParams.get(key) === value
    );
  };

  const handleClick = (filter: QuickFilter) => {
    const params = new URLSearchParams(searchParams.toString());

    if (isActive(filter)) {
      // Deactivate: remove filter params
      Object.keys(filter.params).forEach((key) => params.delete(key));
    } else {
      // Activate: set filter params
      Object.entries(filter.params).forEach(([key, value]) =>
        params.set(key, value)
      );
    }

    // Reset pagination
    params.delete("page");

    router.push(`/nabidka?${params.toString()}`);
  };

  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {quickFilters.map((filter) => {
          const active = isActive(filter);
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => handleClick(filter)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap border-none cursor-pointer transition-all duration-200 shrink-0",
                active
                  ? "bg-orange-500 text-white shadow-sm hover:bg-orange-600"
                  : "bg-white text-gray-700 shadow-sm ring-1 ring-gray-200 hover:ring-gray-300 hover:bg-gray-50"
              )}
            >
              <span className="text-sm">{filter.icon}</span>
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
