"use client";

import { cn } from "@/lib/utils";

interface LeadPriceVerdictProps {
  verdict: "LOW" | "OK" | "HIGH";
  label: string;
  deviationPercent: number;
  fromCache?: boolean;
  sourceCount?: number;
}

const verdictConfig = {
  LOW: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    badge: "Pod trhem",
    hint: "Dobrá příležitost",
  },
  OK: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
    badge: "V normě",
    hint: "Odpovídá trhu",
  },
  HIGH: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    badge: "Nad trhem",
    hint: "Vyšší cena",
  },
};

export function LeadPriceVerdict({ verdict, label, fromCache, sourceCount }: LeadPriceVerdictProps) {
  const config = verdictConfig[verdict];

  return (
    <div className={cn("rounded-lg border p-3", config.bg, config.border)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-500 uppercase">
          Cenový verdikt
        </span>
        <div className="flex items-center gap-1.5">
          {fromCache && (
            <span className="text-[10px] text-gray-400 px-1.5 py-0.5 rounded bg-gray-100">
              cache
            </span>
          )}
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              config.bg,
              config.text
            )}
          >
            {config.badge}
          </span>
        </div>
      </div>
      <div className={cn("text-sm font-semibold", config.text)}>{label}</div>
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-xs text-gray-500">{config.hint}</span>
        {sourceCount != null && sourceCount > 0 && (
          <span className="text-[10px] text-gray-400">
            {sourceCount} nabídek
          </span>
        )}
      </div>
    </div>
  );
}
