/**
 * Client-safe level definitions and progress calculation.
 * Separated from gamification.ts to avoid importing prisma in client bundles.
 */

export const LEVELS = [
  { key: "JUNIOR", name: "Junior makler", minSales: 0, maxSales: 4, badge: "bronze" },
  { key: "BROKER", name: "Makler", minSales: 5, maxSales: 19, badge: "silver" },
  { key: "SENIOR", name: "Senior makler", minSales: 20, maxSales: 49, badge: "gold" },
  { key: "TOP", name: "Top makler", minSales: 50, maxSales: Infinity, badge: "diamond" },
] as const;

export type LevelKey = "JUNIOR" | "BROKER" | "SENIOR" | "TOP";

export function calculateLevel(totalSales: number): (typeof LEVELS)[number] {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalSales >= LEVELS[i].minSales) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getLevelByKey(key: string) {
  return LEVELS.find((l) => l.key === key) ?? LEVELS[0];
}

// ============================================
// LEVEL PROGRESS
// ============================================

export interface LevelProgress {
  currentLevel: (typeof LEVELS)[number];
  nextLevel: (typeof LEVELS)[number] | null;
  percentage: number;
  currentSales: number;
  salesNeeded: number;
}

export function calculateLevelProgress(totalSales: number): LevelProgress {
  const currentLevel = calculateLevel(totalSales);
  const currentIdx = LEVELS.findIndex((l) => l.key === currentLevel.key);
  const nextLevel = currentIdx < LEVELS.length - 1 ? LEVELS[currentIdx + 1] : null;

  if (!nextLevel) {
    return { currentLevel, nextLevel: null, percentage: 100, currentSales: totalSales, salesNeeded: 0 };
  }

  const rangeSize = nextLevel.minSales - currentLevel.minSales;
  const progress = totalSales - currentLevel.minSales;
  const percentage = Math.min(100, Math.round((progress / rangeSize) * 100));
  const salesNeeded = nextLevel.minSales - totalSales;

  return { currentLevel, nextLevel, percentage, currentSales: totalSales, salesNeeded };
}
