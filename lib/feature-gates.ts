/**
 * Feature gate system for progressive broker access.
 * Client-safe — no DB or server imports.
 * Based on existing star level system from gamification-levels.ts
 */

import type { StarLevelKey } from "./gamification-levels";
import { calculateStarProgress } from "./gamification-levels";

// ============================================
// FEATURE DEFINITIONS
// ============================================

export type Feature =
  | "QUICK_VEHICLE_MODE"
  | "MANUAL_LEAD_CREATE"
  | "LEADERBOARD"
  | "FINANCING_CALCULATOR"
  | "LEAD_ANALYTICS"
  | "AI_ASSISTANT"
  | "ADVANCED_STATS"
  | "EMAIL_TEMPLATES"
  | "MATERIALS"
  | "PRIORITY_LEADS"
  | "CONTRACTS"
  | "ESCALATIONS"
  | "PRICE_REDUCTIONS"
  | "EXCLUSIVE_CONTRACTS"
  | "TEAM_MENTORING"
  | "FEATURED_PROFILE"
  | "PRIORITY_ALL_LEADS";

export const FEATURE_MIN_LEVEL: Record<Feature, StarLevelKey> = {
  QUICK_VEHICLE_MODE: "STAR_2",
  MANUAL_LEAD_CREATE: "STAR_2",
  LEADERBOARD: "STAR_2",
  FINANCING_CALCULATOR: "STAR_2",
  LEAD_ANALYTICS: "STAR_2",
  AI_ASSISTANT: "STAR_3",
  ADVANCED_STATS: "STAR_3",
  EMAIL_TEMPLATES: "STAR_3",
  MATERIALS: "STAR_3",
  PRIORITY_LEADS: "STAR_3",
  CONTRACTS: "STAR_3",
  ESCALATIONS: "STAR_4",
  PRICE_REDUCTIONS: "STAR_4",
  EXCLUSIVE_CONTRACTS: "STAR_4",
  TEAM_MENTORING: "STAR_5",
  FEATURED_PROFILE: "STAR_5",
  PRIORITY_ALL_LEADS: "STAR_5",
};

export const FEATURE_INFO: Record<Feature, { name: string; description: string }> = {
  QUICK_VEHICLE_MODE: { name: "Rychlé nabírání", description: "Přidejte vozidlo ve 3 krocích místo 7" },
  MANUAL_LEAD_CREATE: { name: "Vlastní leady", description: "Vytvářejte si vlastní kontakty na prodejce" },
  LEADERBOARD: { name: "Žebříček", description: "Sledujte svou pozici mezi ostatními makléři" },
  FINANCING_CALCULATOR: { name: "Kalkulačka financování", description: "Spočítejte splátky pro klienty" },
  LEAD_ANALYTICS: { name: "Analýza leadů", description: "Detailní statistiky vašich kontaktů" },
  AI_ASSISTANT: { name: "AI asistent", description: "Umělá inteligence vám pomůže s texty a radami" },
  ADVANCED_STATS: { name: "Pokročilé statistiky", description: "Detailní přehled výkonnosti a trendů" },
  EMAIL_TEMPLATES: { name: "Email šablony", description: "Profesionální prezentace aut emailem" },
  MATERIALS: { name: "Materiály", description: "Vizitka, email podpis a prezentace prodeje" },
  PRIORITY_LEADS: { name: "Prioritní leady", description: "Dostávejte leady s vyšší prioritou" },
  CONTRACTS: { name: "Správa smluv", description: "Přehled a správa všech smluv" },
  ESCALATIONS: { name: "Eskalace", description: "Eskalujte problémy přímo na vedení" },
  PRICE_REDUCTIONS: { name: "Návrhy snížení ceny", description: "Navrhněte klientovi snížení ceny" },
  EXCLUSIVE_CONTRACTS: { name: "Exkluzivní smlouvy", description: "Uzavírejte exkluzivní smlouvy" },
  TEAM_MENTORING: { name: "Mentoring", description: "Sledujte statistiky juniorních kolegů" },
  FEATURED_PROFILE: { name: "Profil na homepage", description: "Váš profil na hlavní stránce webu" },
  PRIORITY_ALL_LEADS: { name: "Priority routing", description: "Všechny nové leady jdou nejdřív k vám" },
};

export const TIER_INFO: Record<StarLevelKey, { displayName: string; color: string }> = {
  STAR_1: { displayName: "Nováček", color: "gray" },
  STAR_2: { displayName: "Pokročilý", color: "blue" },
  STAR_3: { displayName: "Expert", color: "orange" },
  STAR_4: { displayName: "Senior", color: "purple" },
  STAR_5: { displayName: "Šampion", color: "gold" },
};

// ============================================
// INTERNAL HELPERS
// ============================================

const BYPASS_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"];

const LEVEL_ORDER: Record<StarLevelKey, number> = {
  STAR_1: 1,
  STAR_2: 2,
  STAR_3: 3,
  STAR_4: 4,
  STAR_5: 5,
};

// ============================================
// CORE ACCESS CHECK
// ============================================

export function canAccess(userLevel: string, feature: Feature): boolean {
  const requiredLevel = FEATURE_MIN_LEVEL[feature];
  const userOrder = LEVEL_ORDER[userLevel as StarLevelKey] ?? 1;
  const requiredOrder = LEVEL_ORDER[requiredLevel];
  return userOrder >= requiredOrder;
}

export function getUnlockLevel(feature: Feature): StarLevelKey {
  return FEATURE_MIN_LEVEL[feature];
}

export function getLockedFeatures(userLevel: string): Feature[] {
  return (Object.keys(FEATURE_MIN_LEVEL) as Feature[]).filter(
    (f) => !canAccess(userLevel, f)
  );
}

// ============================================
// LIMITS
// ============================================

const VEHICLE_LIMITS: Record<StarLevelKey, number | null> = {
  STAR_1: 5,
  STAR_2: 15,
  STAR_3: 30,
  STAR_4: null,
  STAR_5: null,
};

const LEAD_LIMITS: Record<StarLevelKey, number | null> = {
  STAR_1: 5,
  STAR_2: 15,
  STAR_3: 30,
  STAR_4: null,
  STAR_5: null,
};

export function getVehicleLimit(userLevel: string): number | null {
  return VEHICLE_LIMITS[userLevel as StarLevelKey] ?? 5;
}

export function getLeadLimit(userLevel: string): number | null {
  return LEAD_LIMITS[userLevel as StarLevelKey] ?? 5;
}

// ============================================
// NEXT LEVEL INFO
// ============================================

export function getNextLevelInfo(
  userLevel: string,
  totalRevenue: number,
  regionTier: string
): {
  nextLevelName: string;
  nextLevelKey: StarLevelKey;
  revenueNeeded: number;
  percentage: number;
} | null {
  const progress = calculateStarProgress(totalRevenue, regionTier);
  if (!progress.nextLevel) return null;

  const nextKey = progress.nextLevel.key as StarLevelKey;
  return {
    nextLevelName: TIER_INFO[nextKey]?.displayName ?? progress.nextLevel.name,
    nextLevelKey: nextKey,
    revenueNeeded: progress.revenueNeeded,
    percentage: progress.percentage,
  };
}

// ============================================
// SESSION-BASED ACCESS CHECK (for API routes)
// ============================================

export function checkFeatureAccess(
  session: { user?: { role?: string; level?: string } } | null,
  feature: Feature
): boolean {
  if (!session?.user) return false;
  if (BYPASS_ROLES.includes(session.user.role ?? "")) return true;
  return canAccess(session.user.level ?? "STAR_1", feature);
}
