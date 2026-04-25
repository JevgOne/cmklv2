/**
 * Client-safe star level definitions and progress calculation.
 * Based on cumulative revenue per region (not points).
 */

import type { RegionTier } from "./broker-points";

export const STAR_LEVELS = [
  { key: "STAR_1" as const, stars: 1, name: "⭐ Makléř", commissionRate: 0.30 },
  { key: "STAR_2" as const, stars: 2, name: "⭐⭐ Makléř", commissionRate: 0.40 },
  { key: "STAR_3" as const, stars: 3, name: "⭐⭐⭐ Makléř", commissionRate: 0.50 },
  { key: "STAR_4" as const, stars: 4, name: "⭐⭐⭐⭐ Makléř", commissionRate: 0.55 },
  { key: "STAR_5" as const, stars: 5, name: "⭐⭐⭐⭐⭐ Makléř", commissionRate: 0.60 },
] as const;

export type StarLevelKey = "STAR_1" | "STAR_2" | "STAR_3" | "STAR_4" | "STAR_5";

export const REGION_THRESHOLDS: Record<string, Record<StarLevelKey, number>> = {
  PRAHA: {
    STAR_1: 0,
    STAR_2: 1_500_000,
    STAR_3: 2_500_000,
    STAR_4: 4_000_000,
    STAR_5: 6_000_000,
  },
  BRNO: {
    STAR_1: 0,
    STAR_2: 1_200_000,
    STAR_3: 2_000_000,
    STAR_4: 3_000_000,
    STAR_5: 4_500_000,
  },
  OSTRAVA_PLZEN: {
    STAR_1: 0,
    STAR_2: 1_000_000,
    STAR_3: 1_500_000,
    STAR_4: 2_500_000,
    STAR_5: 3_500_000,
  },
  SMALL: {
    STAR_1: 0,
    STAR_2: 750_000,
    STAR_3: 1_200_000,
    STAR_4: 2_000_000,
    STAR_5: 3_000_000,
  },
};

export function calculateStarLevel(totalRevenue: number, regionTier: string = "SMALL"): (typeof STAR_LEVELS)[number] {
  const thresholds = REGION_THRESHOLDS[regionTier] ?? REGION_THRESHOLDS.SMALL;
  for (let i = STAR_LEVELS.length - 1; i >= 0; i--) {
    if (totalRevenue >= thresholds[STAR_LEVELS[i].key]) {
      return STAR_LEVELS[i];
    }
  }
  return STAR_LEVELS[0];
}

export function getStarLevelByKey(key: string) {
  return STAR_LEVELS.find((l) => l.key === key) ?? STAR_LEVELS[0];
}

// ============================================
// STAR PROGRESS (obratový systém dle regionu)
// ============================================

export interface StarProgress {
  currentLevel: (typeof STAR_LEVELS)[number];
  nextLevel: (typeof STAR_LEVELS)[number] | null;
  percentage: number;
  totalRevenue: number;
  revenueNeeded: number;
}

export function calculateStarProgress(totalRevenue: number, regionTier: string = "SMALL"): StarProgress {
  const currentLevel = calculateStarLevel(totalRevenue, regionTier);
  const thresholds = REGION_THRESHOLDS[regionTier] ?? REGION_THRESHOLDS.SMALL;
  const currentIdx = STAR_LEVELS.findIndex((l) => l.key === currentLevel.key);
  const nextLevel = currentIdx < STAR_LEVELS.length - 1 ? STAR_LEVELS[currentIdx + 1] : null;

  if (!nextLevel) {
    return { currentLevel, nextLevel: null, percentage: 100, totalRevenue, revenueNeeded: 0 };
  }

  const currentThreshold = thresholds[currentLevel.key];
  const nextThreshold = thresholds[nextLevel.key];
  const range = nextThreshold - currentThreshold;
  const progress = totalRevenue - currentThreshold;
  const percentage = Math.min(100, Math.round((progress / range) * 100));
  const revenueNeeded = Math.max(0, nextThreshold - totalRevenue);

  return { currentLevel, nextLevel, percentage, totalRevenue, revenueNeeded };
}
