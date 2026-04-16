"use client";

import { useMemo, useState } from "react";
import { BrokerCard, type BrokerCardBroker } from "@/components/web/BrokerCard";
import { cn } from "@/lib/utils";

type SortKey = "sales" | "level" | "newest";

export interface BrokerGridExtra extends BrokerCardBroker {
  createdAt: string; // ISO — pro "Nejnovější" sort
}

export interface BrokerGridProps {
  brokers: BrokerGridExtra[];
  initialLimit?: number;
}

const LEVEL_RANK: Record<string, number> = {
  TOP: 4,
  SENIOR: 3,
  BROKER: 2,
  JUNIOR: 1,
};

export function BrokerGrid({ brokers, initialLimit = 12 }: BrokerGridProps) {
  const [sort, setSort] = useState<SortKey>("sales");
  const [limit, setLimit] = useState(initialLimit);

  const sorted = useMemo(() => {
    const arr = [...brokers];
    switch (sort) {
      case "level":
        arr.sort(
          (a, b) => (LEVEL_RANK[b.level] ?? 0) - (LEVEL_RANK[a.level] ?? 0)
        );
        break;
      case "newest":
        arr.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "sales":
      default:
        arr.sort((a, b) => b.totalSales - a.totalSales);
        break;
    }
    return arr;
  }, [brokers, sort]);

  const visible = sorted.slice(0, limit);
  const canShowMore = limit < sorted.length;

  const sortButton = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => setSort(key)}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-semibold transition-colors border",
        sort === key
          ? "bg-orange-500 text-white border-orange-500"
          : "bg-white text-gray-700 border-gray-200 hover:border-orange-300"
      )}
      aria-pressed={sort === key}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Řazení makléřů">
        {sortButton("sales", "Podle prodejů")}
        {sortButton("level", "Úroveň")}
        {sortButton("newest", "Nejnovější")}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {visible.map((broker, idx) => (
          <BrokerCard
            key={broker.slug}
            broker={broker}
            featured={idx === 0}
          />
        ))}
      </div>

      {canShowMore && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setLimit(sorted.length)}
            className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-900 font-semibold px-6 py-3 rounded-full border border-gray-200 hover:border-orange-300 transition-colors"
          >
            Zobrazit více ({limit} z {sorted.length})
          </button>
        </div>
      )}
    </div>
  );
}
