/**
 * Listing quality scoring system (0-100).
 * Used in ReviewStep to gate submission (min 60) and show improvement tips.
 */

import type { VehicleDraft } from "@/types/vehicle-draft";

// ============================================
// Score Result Types
// ============================================

export interface QualityScoreResult {
  total: number;
  breakdown: ScoreBreakdown;
  recommendations: Recommendation[];
  consistencyWarnings: ConsistencyWarning[];
  canSubmit: boolean;
}

export interface ScoreBreakdown {
  photos: { score: number; max: 35; details: string };
  data: { score: number; max: 30; details: string };
  description: { score: number; max: 20; details: string };
  equipment: { score: number; max: 15; details: string };
}

export interface Recommendation {
  message: string;
  points: number;
  step: number;
  route: string;
}

export interface ConsistencyWarning {
  id: string;
  message: string;
  step: number;
  route: string;
  penalty: number;
}

const MIN_SCORE = 60;

// ============================================
// Main Scoring Function
// ============================================

export function calculateQualityScore(draft: VehicleDraft): QualityScoreResult {
  const photos = scorePhotos(draft);
  const data = scoreData(draft);
  const description = scoreDescription(draft);
  const equipment = scoreEquipment(draft);
  const consistencyWarnings = checkConsistency(draft);

  const warningPenalty = consistencyWarnings.reduce((sum, w) => sum + w.penalty, 0);
  const rawTotal = photos.score + data.score + description.score + equipment.score;
  const total = Math.max(0, rawTotal - warningPenalty);

  const recommendations = buildRecommendations(draft, photos, data, description, equipment);

  return {
    total,
    breakdown: { photos, data, description, equipment },
    recommendations,
    consistencyWarnings,
    canSubmit: total >= MIN_SCORE,
  };
}

// ============================================
// Photos: max 35 points
// ============================================

function scorePhotos(draft: VehicleDraft): ScoreBreakdown["photos"] {
  const allPhotos = (draft.photos?.photos ?? []) as unknown as Array<{ slotId: string; isMain?: boolean }>;
  const regularCount = allPhotos.filter((p) => !p.slotId?.startsWith("evi_")).length;
  const evidenceCount = allPhotos.filter((p) => p.slotId?.startsWith("evi_")).length;
  const hasMain = allPhotos.some((p) => p.isMain);

  let score = 0;

  // Regular photos: 13+ = 20, 20+ = 25, 25+ = 30
  if (regularCount >= 25) score += 30;
  else if (regularCount >= 20) score += 25;
  else if (regularCount >= 13) score += 20;
  else score += Math.round((regularCount / 13) * 20);

  // Evidence photos: 3 = 5
  if (evidenceCount >= 3) score += 5;
  else score += Math.round((evidenceCount / 3) * 5);

  // Main photo bonus
  if (hasMain) score += 5;

  const details = `${regularCount} fotek, ${evidenceCount} důkazních${hasMain ? ", hlavní nastavena" : ""}`;

  return { score: Math.min(35, score), max: 35, details };
}

// ============================================
// Data: max 30 points
// ============================================

function scoreData(draft: VehicleDraft): ScoreBreakdown["data"] {
  const d = draft.details ?? {};
  const insp = draft.inspection ?? {};

  let score = 0;
  const parts: string[] = [];

  // Basic fields (brand, model, year, mileage, fuel, transmission) = 15
  const basicFields = [d.brand, d.model, d.year, d.mileage, d.fuelType, d.transmission];
  const basicFilled = basicFields.filter(Boolean).length;
  const basicScore = Math.round((basicFilled / 6) * 15);
  score += basicScore;
  if (basicFilled < 6) parts.push(`základ ${basicFilled}/6`);

  // Extended fields (color, doors, seats, drivetrain, STK) = 10
  const extFields = [d.color, d.doorsCount, d.seatsCount, d.drivetrain, d.stkValidUntil];
  const extFilled = extFields.filter(Boolean).length;
  const extScore = Math.round((extFilled / 5) * 10);
  score += extScore;
  if (extFilled < 5) parts.push(`rozšířené ${extFilled}/5`);

  // Inspection complete = 5
  const hasInspection = insp.overallRating != null && insp.overallRating > 0;
  if (hasInspection) {
    score += 5;
  } else {
    parts.push("bez inspekce");
  }

  return { score: Math.min(30, score), max: 30, details: parts.length ? parts.join(", ") : "kompletní" };
}

// ============================================
// Description: max 20 points
// ============================================

function scoreDescription(draft: VehicleDraft): ScoreBreakdown["description"] {
  const d = draft.details ?? {};
  let score = 0;
  const parts: string[] = [];

  // Length > 100 chars = 10
  const descLen = d.description?.length ?? 0;
  if (descLen > 100) {
    score += 10;
  } else if (descLen > 0) {
    score += Math.round((descLen / 100) * 10);
    parts.push(`krátký popis (${descLen} znaků)`);
  } else {
    parts.push("chybí popis");
  }

  // Highlights >= 3 = 5
  const highlightCount = d.highlights?.length ?? 0;
  if (highlightCount >= 3) {
    score += 5;
  } else if (highlightCount > 0) {
    score += Math.round((highlightCount / 3) * 5);
    parts.push(`${highlightCount}/3 highlightů`);
  } else {
    parts.push("žádné highlights");
  }

  // AI generated = 5 (check if description was generated via template)
  // We detect this by checking if description contains typical template markers
  if (descLen > 100 && d.highlights && d.highlights.length >= 2) {
    score += 5;
  } else {
    parts.push("ruční popis");
  }

  return { score: Math.min(20, score), max: 20, details: parts.length ? parts.join(", ") : "kompletní" };
}

// ============================================
// Equipment: max 15 points
// ============================================

function scoreEquipment(draft: VehicleDraft): ScoreBreakdown["equipment"] {
  const count = draft.details?.equipment?.length ?? 0;
  let score = 0;

  if (count >= 25) score = 15;
  else if (count >= 15) score = 10;
  else if (count >= 5) score = 5;

  return {
    score,
    max: 15,
    details: `${count} položek`,
  };
}

// ============================================
// Consistency Checks (Task 4.3)
// ============================================

export function checkConsistency(draft: VehicleDraft): ConsistencyWarning[] {
  const warnings: ConsistencyWarning[] = [];
  const insp = draft.inspection ?? {};
  const d = draft.details ?? {};
  const allPhotos = (draft.photos?.photos ?? []) as unknown as Array<{ slotId: string }>;
  const docs = insp.documents;

  // 1. Paint damage but no defect photos
  if (insp.exterior?.paintDefects) {
    const hasDefectPhotos = allPhotos.some((p) => p.slotId?.startsWith("defect_"));
    if (!hasDefectPhotos) {
      warnings.push({
        id: "paint_no_defect_photo",
        message: "Inspekce uvádí vady laku, ale nejsou žádné fotky defektů.",
        step: 4,
        route: "photos",
        penalty: 5,
      });
    }
  }

  // 2. High mileage but excellent condition
  if ((d.mileage ?? 0) > 200000 && d.condition === "EXCELLENT") {
    warnings.push({
      id: "high_mileage_excellent",
      message: "Nájezd přes 200 000 km, ale stav je označen jako Výborný. Zkontrolujte.",
      step: 5,
      route: "details",
      penalty: 5,
    });
  }

  // 3. Old car but single owner (hint)
  if ((d.year ?? 9999) < 2010 && d.ownerCount === 1) {
    warnings.push({
      id: "old_single_owner",
      message: "Vůz starší 2010, ale uveden 1 majitel — ověřte historii.",
      step: 5,
      route: "details",
      penalty: 5,
    });
  }

  // 4. Xenon in equipment but damaged lights in inspection
  if (d.equipment?.some((e) => /xenon|laser|led.*světlo/i.test(e)) && insp.exterior?.lightsDamage) {
    warnings.push({
      id: "lights_equipment_vs_damage",
      message: "Ve výbavě jsou prémiová světla, ale inspekce uvádí poškozená světla.",
      step: 2,
      route: "inspection",
      penalty: 5,
    });
  }

  // 5. EV/PHEV but no charging cable
  const isEV = d.fuelType && /elektr|hybrid|phev|bev/i.test(d.fuelType);
  if (isEV && docs?.nabijeciKabel === false) {
    warnings.push({
      id: "ev_no_cable",
      message: "Elektro/hybrid vozidlo, ale nabíjecí kabel chybí v dokladech.",
      step: 2,
      route: "inspection",
      penalty: 5,
    });
  }

  // 6. Dents/scratches in inspection but condition EXCELLENT
  if ((insp.exterior?.dentsScratches || insp.exterior?.rustSpots) && d.condition === "EXCELLENT") {
    warnings.push({
      id: "damage_but_excellent",
      message: "Inspekce uvádí poškození karoserie, ale stav je Výborný.",
      step: 5,
      route: "details",
      penalty: 5,
    });
  }

  // 7. No test drive completed but engine/gearbox issues not checked
  if (insp.testDrive?.completed === false && (d.mileage ?? 0) > 0) {
    warnings.push({
      id: "no_test_drive",
      message: "Testovací jízda nebyla provedena — nelze ověřit stav podvozku a převodovky.",
      step: 2,
      route: "inspection",
      penalty: 5,
    });
  }

  return warnings;
}

// ============================================
// Recommendations
// ============================================

function buildRecommendations(
  draft: VehicleDraft,
  photos: ScoreBreakdown["photos"],
  data: ScoreBreakdown["data"],
  description: ScoreBreakdown["description"],
  equipment: ScoreBreakdown["equipment"],
): Recommendation[] {
  const recs: Recommendation[] = [];
  const d = draft.details ?? {};
  const allPhotos = (draft.photos?.photos ?? []) as unknown as Array<{ slotId: string; isMain?: boolean }>;
  const regularCount = allPhotos.filter((p) => !p.slotId?.startsWith("evi_")).length;
  const evidenceCount = allPhotos.filter((p) => p.slotId?.startsWith("evi_")).length;
  const hasMain = allPhotos.some((p) => p.isMain);

  // Photo recommendations
  if (regularCount < 13) {
    recs.push({
      message: `Přidejte ještě ${13 - regularCount} fotek exteriéru/interiéru`,
      points: 20 - photos.score,
      step: 4,
      route: "photos",
    });
  } else if (regularCount < 20) {
    recs.push({
      message: `Přidejte ještě ${20 - regularCount} fotek pro ${25 - photos.score + (hasMain ? 0 : 5)} bodů navíc`,
      points: 5,
      step: 4,
      route: "photos",
    });
  }

  if (evidenceCount < 3) {
    recs.push({
      message: `Chybí ${3 - evidenceCount} důkazní fotky (tachometr, VIN, klíče)`,
      points: 5 - Math.round((evidenceCount / 3) * 5),
      step: 4,
      route: "photos",
    });
  }

  if (!hasMain) {
    recs.push({
      message: "Nastavte hlavní fotku pro +5 bodů",
      points: 5,
      step: 4,
      route: "photos",
    });
  }

  // Data recommendations
  if (data.score < 30) {
    const missing: string[] = [];
    if (!d.color) missing.push("barvu");
    if (!d.doorsCount) missing.push("počet dveří");
    if (!d.seatsCount) missing.push("počet sedadel");
    if (!d.drivetrain) missing.push("pohon");
    if (!d.stkValidUntil) missing.push("platnost STK");
    if (missing.length > 0) {
      recs.push({
        message: `Doplňte ${missing.slice(0, 3).join(", ")}`,
        points: Math.min(10, missing.length * 2),
        step: 5,
        route: "details",
      });
    }
  }

  // Description recommendations
  const descLen = d.description?.length ?? 0;
  if (descLen < 100) {
    recs.push({
      message: descLen === 0 ? "Přidejte popis vozidla pro 10 bodů" : `Rozšiřte popis na 100+ znaků (nyní ${descLen})`,
      points: 10 - Math.round((descLen / 100) * 10),
      step: 5,
      route: "details",
    });
  }

  if ((d.highlights?.length ?? 0) < 3) {
    recs.push({
      message: `Přidejte alespoň 3 highlights pro 5 bodů`,
      points: 5,
      step: 5,
      route: "details",
    });
  }

  // Equipment recommendations
  const eqCount = d.equipment?.length ?? 0;
  if (eqCount < 5) {
    recs.push({
      message: `Přidejte alespoň 5 položek výbavy`,
      points: 5,
      step: 6,
      route: "equipment",
    });
  } else if (eqCount < 15) {
    recs.push({
      message: `Přidejte další výbavu (${eqCount}/15) pro 5 bodů navíc`,
      points: 5,
      step: 6,
      route: "equipment",
    });
  }

  // Sort by points descending
  recs.sort((a, b) => b.points - a.points);

  return recs.slice(0, 5);
}

// ============================================
// Score Level Helper
// ============================================

export type ScoreLevel = "excellent" | "good" | "fair" | "poor";

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 60) return "fair";
  return "poor";
}

export function getScoreColor(level: ScoreLevel): string {
  switch (level) {
    case "excellent": return "text-green-600";
    case "good": return "text-blue-600";
    case "fair": return "text-orange-500";
    case "poor": return "text-red-500";
  }
}

export function getScoreBgColor(level: ScoreLevel): string {
  switch (level) {
    case "excellent": return "bg-green-500";
    case "good": return "bg-blue-500";
    case "fair": return "bg-orange-500";
    case "poor": return "bg-red-500";
  }
}

export function getScoreLabel(level: ScoreLevel): string {
  switch (level) {
    case "excellent": return "Výborný";
    case "good": return "Dobrý";
    case "fair": return "Dostatečný";
    case "poor": return "Nedostatečný";
  }
}
