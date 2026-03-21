"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const periods = [
  { value: "6m", label: "6M" },
  { value: "12m", label: "12M" },
  { value: "ytd", label: "YTD" },
];

export function PeriodSelector() {
  const [active, setActive] = useState("12m");

  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => setActive(period.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-all duration-200 text-gray-500 hover:text-gray-900 border-none",
            active === period.value && "bg-white text-gray-900 shadow-sm"
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
