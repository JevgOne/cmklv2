"use client";

import { calculateLevelProgress } from "@/lib/gamification-levels";
import { LEVEL_LABELS } from "@/lib/role-labels";

export interface LevelProgressBarProps {
  level: string;
  totalSales: number;
  size?: "sm" | "md";
}

export function LevelProgressBar({ level, totalSales, size = "sm" }: LevelProgressBarProps) {
  const progress = calculateLevelProgress(totalSales);

  // TOP level = no progress bar, just badge
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
        {progress.percentage}% do {nextLabel}
        {!isSm && ` \u00B7 ${progress.salesNeeded} ${progress.salesNeeded === 1 ? "prodej" : progress.salesNeeded < 5 ? "prodeje" : "prodej\u016F"}`}
      </p>
    </div>
  );
}
