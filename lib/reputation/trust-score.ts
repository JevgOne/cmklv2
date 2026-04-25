// Unified Trust Score system — shared across all products

export const TIERS = {
  NEW: 0,
  BRONZE: 25,
  SILVER: 50,
  GOLD: 75,
  PLATINUM: 90,
} as const;

export type Tier = keyof typeof TIERS;

export function getTier(score: number): Tier {
  if (score >= 90) return "PLATINUM";
  if (score >= 75) return "GOLD";
  if (score >= 50) return "SILVER";
  if (score >= 25) return "BRONZE";
  return "NEW";
}

export const TIER_COLORS: Record<Tier, { bg: string; text: string; ring: string }> = {
  NEW: { bg: "bg-gray-100", text: "text-gray-500", ring: "ring-gray-300" },
  BRONZE: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-400" },
  SILVER: { bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-400" },
  GOLD: { bg: "bg-yellow-100", text: "text-yellow-700", ring: "ring-yellow-400" },
  PLATINUM: { bg: "bg-purple-100", text: "text-purple-700", ring: "ring-purple-400" },
};

export const TIER_LABELS: Record<Tier, string> = {
  NEW: "Nový",
  BRONZE: "Bronz",
  SILVER: "Stříbro",
  GOLD: "Zlato",
  PLATINUM: "Platina",
};

// Clamp score to 0-100
export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
