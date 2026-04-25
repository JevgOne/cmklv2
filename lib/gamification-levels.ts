/**
 * Client-safe career level definitions and progress calculation.
 * Based on points system (not sales count).
 */

export const LEVELS = [
  { key: "TIPAR", name: "Tipař", minPoints: 0, badge: "bronze", commissionRate: 0.30 },
  { key: "JUNIOR", name: "Junior", minPoints: 300, badge: "silver", commissionRate: 0.40 },
  { key: "SENIOR", name: "Senior", minPoints: 500, badge: "gold", commissionRate: 0.55 },
  { key: "EXPERT", name: "Expert", minPoints: 650, badge: "diamond", commissionRate: 0.65 },
] as const;

export type LevelKey = "TIPAR" | "JUNIOR" | "SENIOR" | "EXPERT";

export function calculateLevel(totalPoints: number): (typeof LEVELS)[number] {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVELS[i].minPoints) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getLevelByKey(key: string) {
  return LEVELS.find((l) => l.key === key) ?? LEVELS[0];
}

// ============================================
// LEVEL PROGRESS (bodový systém)
// ============================================

export interface LevelProgress {
  currentLevel: (typeof LEVELS)[number];
  nextLevel: (typeof LEVELS)[number] | null;
  percentage: number;
  currentPoints: number;
  pointsNeeded: number;
}

export function calculateLevelProgress(totalPoints: number): LevelProgress {
  const currentLevel = calculateLevel(totalPoints);
  const currentIdx = LEVELS.findIndex((l) => l.key === currentLevel.key);
  const nextLevel = currentIdx < LEVELS.length - 1 ? LEVELS[currentIdx + 1] : null;

  if (!nextLevel) {
    return { currentLevel, nextLevel: null, percentage: 100, currentPoints: totalPoints, pointsNeeded: 0 };
  }

  const rangeSize = nextLevel.minPoints - currentLevel.minPoints;
  const progress = totalPoints - currentLevel.minPoints;
  const percentage = Math.min(100, Math.round((progress / rangeSize) * 100));
  const pointsNeeded = Math.max(0, nextLevel.minPoints - totalPoints);

  return { currentLevel, nextLevel, percentage, currentPoints: totalPoints, pointsNeeded };
}
