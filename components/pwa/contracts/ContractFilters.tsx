"use client";

import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "Všechny" },
  { value: "DRAFT", label: "Koncepty" },
  { value: "SIGNED", label: "Podepsané" },
  { value: "SENT", label: "Odeslané" },
] as const;

interface ContractFiltersProps {
  activeFilter: string;
  onFilterChange: (value: string) => void;
  counts: Record<string, number>;
}

export function ContractFilters({ activeFilter, onFilterChange, counts }: ContractFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
      {FILTERS.map((filter) => {
        const count = filter.value === "all" ? counts.total : (counts[filter.value] ?? 0);
        return (
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
            {count > 0 && (
              <span className={cn(
                "ml-1.5 text-xs",
                activeFilter === filter.value ? "text-white/80" : "text-gray-400"
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
