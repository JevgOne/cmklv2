import type { TecdocArticle } from "./tecdoc";

// ── 8 zón ────────────────────────────────────────────────────

export const DAMAGE_ZONES = [
  "FRONT",
  "REAR",
  "LEFT",
  "RIGHT",
  "ROOF",
  "UNDERBODY",
  "ENGINE_BAY",
  "INTERIOR",
] as const;

export type DamageZone = (typeof DAMAGE_ZONES)[number];

export const ZONE_LABELS: Record<DamageZone, string> = {
  FRONT: "Přední část",
  REAR: "Zadní část",
  LEFT: "Levý bok",
  RIGHT: "Pravý bok",
  ROOF: "Střecha",
  UNDERBODY: "Podvozek",
  ENGINE_BAY: "Motorový prostor",
  INTERIOR: "Interiér",
};

// ── 4 stupně poškození ───────────────────────────────────────

export const DAMAGE_LEVELS = {
  OK: "ok",
  LIGHT: "light",
  HEAVY: "heavy",
  DESTROYED: "destroyed",
} as const;

export type DamageLevel =
  (typeof DAMAGE_LEVELS)[keyof typeof DAMAGE_LEVELS];

export const DAMAGE_LEVEL_LABELS: Record<DamageLevel, string> = {
  ok: "Nepoškozeno",
  light: "Lehké poškození",
  heavy: "Těžké poškození",
  destroyed: "Zničeno",
};

export const DAMAGE_LEVEL_COLORS: Record<DamageLevel, string> = {
  ok: "#22c55e",
  light: "#eab308",
  heavy: "#f97316",
  destroyed: "#ef4444",
};

// ── Mapování zón → TecDoc product groups ────────────────────

export const ZONE_TO_PRODUCT_GROUPS: Record<DamageZone, string> = {
  FRONT: "FRONT",
  REAR: "REAR",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  ROOF: "ROOF",
  UNDERBODY: "UNDERBODY",
  ENGINE_BAY: "ENGINE_BAY",
  INTERIOR: "INTERIOR",
};

// ── Filtrační logika ─────────────────────────────────────────

export function filterPartsByDamage(
  parts: TecdocArticle[],
  damageZones: Record<string, DamageLevel>
): {
  available: TecdocArticle[];
  warning: TecdocArticle[];
  excluded: TecdocArticle[];
} {
  const available: TecdocArticle[] = [];
  const warning: TecdocArticle[] = [];
  const excluded: TecdocArticle[] = [];

  for (const part of parts) {
    const zone = part.productGroup as DamageZone;
    const level = damageZones[zone];

    if (!level || level === "ok" || level === "light") {
      available.push(part);
    } else if (level === "heavy") {
      warning.push(part);
    } else {
      excluded.push(part);
    }
  }

  return { available, warning, excluded };
}

// ── Automatické presety dle typu likvidace ───────────────────

export function getAutoPresets(
  disposalType: string
): Partial<Record<DamageZone, DamageLevel>> {
  switch (disposalType) {
    case "FLOOD":
      return {
        INTERIOR: "heavy",
        ENGINE_BAY: "heavy",
        UNDERBODY: "light",
      };
    case "FIRE":
      return {
        ENGINE_BAY: "destroyed",
        INTERIOR: "heavy",
        ROOF: "heavy",
      };
    case "COMPLETE":
      // Kompletní rozebírání — vše OK
      return Object.fromEntries(
        DAMAGE_ZONES.map((z) => [z, "ok" as DamageLevel])
      ) as Record<DamageZone, DamageLevel>;
    default:
      return {};
  }
}

// ── Default damage zones (vše OK) ───────────────────────────

export function getDefaultDamageZones(): Record<DamageZone, DamageLevel> {
  return Object.fromEntries(
    DAMAGE_ZONES.map((z) => [z, "ok" as DamageLevel])
  ) as Record<DamageZone, DamageLevel>;
}

// ── Bezpečnostní pravidlo: airbagy ──────────────────────────

export function getAirbagsWarning(disposalType: string): boolean {
  return disposalType === "ACCIDENT";
}
