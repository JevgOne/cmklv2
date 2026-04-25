"use client";

import { calculateStarProgress, REGION_THRESHOLDS } from "@/lib/gamification-levels";
import { LEVEL_LABELS } from "@/lib/role-labels";
import { formatPrice } from "@/lib/utils";

export interface LevelProgressBarProps {
  level: string;
  totalRevenue: number;
  regionTier?: string;
  size?: "sm" | "md";
}

export function LevelProgressBar({ level, totalRevenue, regionTier = "SMALL", size = "sm" }: LevelProgressBarProps) {
  const progress = calculateStarProgress(totalRevenue, regionTier);

  // Max level = no progress bar
  if (!progress.nextLevel) {
    return null;
  }

  const nextLabel = LEVEL_LABELS[progress.nextLevel.key] || progress.nextLevel.name;
  const isSm = size === "sm";

  return (
    <div className={isSm ? "mt-1.5" : "mt-2 w-full"}>
      <div className={`bg-gray-200 rounded-full overflow-hidden ${isSm ? "h-1.5" : "h-2"}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-[width] duration-300 ease-in-out"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <p className={`text-gray-500 mt-1 ${isSm ? "text-[10px]" : "text-xs"}`}>
        {formatPrice(totalRevenue)} / {formatPrice(
          (REGION_THRESHOLDS[regionTier] ?? REGION_THRESHOLDS.SMALL)[progress.nextLevel.key as keyof typeof REGION_THRESHOLDS.SMALL]
        )}{" "}
        do {nextLabel}
        {!isSm && ` · chybí ${formatPrice(progress.revenueNeeded)}`}
      </p>
    </div>
  );
}
