"use client";

import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "Vsechny" },
  { value: "ACTIVE", label: "Aktivni" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Ke schvaleni" },
  { value: "SOLD", label: "Prodane" },
] as const;

interface VehicleFiltersProps {
  activeFilter: string;
  onFilterChange: (value: string) => void;
}

export function VehicleFilters({ activeFilter, onFilterChange }: VehicleFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border-none cursor-pointer transition-all duration-200 snap-start flex-shrink-0",
            activeFilter === filter.value
              ? "bg-orange-500 text-white shadow-orange"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
