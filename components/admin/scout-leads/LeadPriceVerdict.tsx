"use client";

import { cn } from "@/lib/utils";

interface LeadPriceVerdictProps {
  verdict: "LOW" | "OK" | "HIGH";
  label: string;
  deviationPercent: number;
}

const verdictConfig = {
  LOW: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    hint: "Dobrá příležitost",
  },
  OK: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
    hint: "Odpovídá trhu",
  },
  HIGH: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    hint: "Vyšší cena",
  },
};

export function LeadPriceVerdict({ verdict, label }: LeadPriceVerdictProps) {
  const config = verdictConfig[verdict];

  return (
    <div className={cn("rounded-lg border p-3", config.bg, config.border)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-500 uppercase">
          Cenový verdikt
        </span>
        <span
          className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full",
            config.bg,
            config.text
          )}
        >
          {verdict}
        </span>
      </div>
      <div className={cn("text-sm font-semibold", config.text)}>{label}</div>
      <div className="text-xs text-gray-500 mt-0.5">{config.hint}</div>
    </div>
  );
}
