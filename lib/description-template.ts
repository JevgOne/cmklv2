// ============================================
// Template-based vehicle description generator
// AI generates ONLY intro + outro; everything else is auto-filled from data.
// ============================================

import type { DetailsData, InspectionData } from "@/types/vehicle-draft";

// Label maps for human-readable values
const FUEL_LABELS: Record<string, string> = {
  PETROL: "benzín", DIESEL: "diesel", HYBRID: "hybrid",
  PLUGIN_HYBRID: "plug-in hybrid", ELECTRIC: "elektro", CNG: "CNG", LPG: "LPG",
};

const TRANSMISSION_LABELS: Record<string, string> = {
  MANUAL: "manuální", AUTOMATIC: "automatická", DSG: "DSG", CVT: "CVT",
};

const DRIVE_LABELS: Record<string, string> = {
  FRONT: "přední", REAR: "zadní", "4x4": "4x4",
};

const BODY_LABELS: Record<string, string> = {
  SEDAN: "sedan", HATCHBACK: "hatchback", COMBI: "kombi", SUV: "SUV",
  COUPE: "coupé", CABRIO: "kabriolet", VAN: "van / MPV", PICKUP: "pickup",
};

const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: "výborný", GOOD: "dobrý", FAIR: "horší", POOR: "špatný",
};

const ODOMETER_LABELS: Record<string, string> = {
  original: "originál", unverifiable: "nelze ověřit", tampered: "stočeno",
};

const SERVICE_LABELS: Record<string, string> = {
  complete: "kompletní", partial: "částečná", missing: "chybí",
};

function label(map: Record<string, string>, key: string | undefined): string | undefined {
  if (!key) return undefined;
  return map[key] ?? key;
}

function formatMileage(km: number): string {
  return new Intl.NumberFormat("cs-CZ").format(km) + " km";
}

function formatPower(kw: number): string {
  const hp = Math.round(kw * 1.36);
  return `${kw} kW (${hp} k)`;
}

function formatCapacity(cc: number): string {
  return (cc / 1000).toFixed(1).replace(".", ",") + " l";
}

// ============================================
// Section builders
// ============================================

export interface TemplateSection {
  title: string;
  lines: string[];
  editable: boolean;
}

function buildTechParams(d: Partial<DetailsData>): TemplateSection {
  const lines: string[] = [];
  if (d.brand && d.model) lines.push(`Vozidlo: ${d.brand} ${d.model}${d.variant ? ` ${d.variant}` : ""}`);
  if (d.year) lines.push(`Rok výroby: ${d.year}`);
  if (d.mileage) lines.push(`Nájezd: ${formatMileage(d.mileage)}`);
  if (d.fuelType) lines.push(`Palivo: ${label(FUEL_LABELS, d.fuelType)}`);
  if (d.transmission) lines.push(`Převodovka: ${label(TRANSMISSION_LABELS, d.transmission)}`);
  if (d.enginePower) lines.push(`Výkon: ${formatPower(d.enginePower)}`);
  if (d.engineCapacity) lines.push(`Objem: ${formatCapacity(d.engineCapacity)}`);
  if (d.bodyType) lines.push(`Karoserie: ${label(BODY_LABELS, d.bodyType)}`);
  if (d.drivetrain) lines.push(`Pohon: ${label(DRIVE_LABELS, d.drivetrain)}`);
  if (d.color) lines.push(`Barva: ${d.color}`);
  if (d.doorsCount) lines.push(`Počet dveří: ${d.doorsCount}`);
  if (d.seatsCount) lines.push(`Počet sedadel: ${d.seatsCount}`);
  return { title: "TECHNICKÉ PARAMETRY", lines, editable: false };
}

function buildVehicleState(d: Partial<DetailsData>, insp?: Partial<InspectionData>): TemplateSection {
  const lines: string[] = [];
  if (d.condition) lines.push(`Celkový stav: ${label(CONDITION_LABELS, d.condition)}`);
  if (d.odometerStatus) lines.push(`Tachometr: ${label(ODOMETER_LABELS, d.odometerStatus)}`);
  if (d.serviceBook) {
    lines.push(`Servisní knížka: ${d.serviceBookStatus ? label(SERVICE_LABELS, d.serviceBookStatus) : "ano"}`);
  }
  if (d.stkValidUntil) lines.push(`STK do: ${d.stkValidUntil}`);
  if (d.ownerCount) lines.push(`Počet majitelů: ${d.ownerCount}`);
  if (d.originCountry) lines.push(`Země původu: ${d.originCountry}`);

  // Inspection extras
  if (insp?.keyCount) lines.push(`Počet klíčů: ${insp.keyCount}`);
  if (insp?.tires) {
    const t = insp.tires;
    const typeLabel = t.type === "SUMMER" ? "letní" : t.type === "WINTER" ? "zimní" : "celoroční";
    let tireLine = `Pneumatiky: ${typeLabel}`;
    if (t.brand) tireLine += ` (${t.brand})`;
    if (t.treadDepth != null) tireLine += `, hloubka dezénu ${t.treadDepth} mm`;
    lines.push(tireLine);
    if (t.secondSet) {
      const secType = t.secondSetType === "SUMMER" ? "letní" : t.secondSetType === "WINTER" ? "zimní" : "celoroční";
      lines.push(`Druhá sada: ${secType}`);
    }
  }

  return { title: "STAV VOZIDLA", lines, editable: false };
}

function buildEquipment(equipment: string[]): TemplateSection {
  // Show top 10 items, note if more
  const top = equipment.slice(0, 10);
  const lines = top.map((e) => e);
  if (equipment.length > 10) {
    lines.push(`...a dalších ${equipment.length - 10} položek výbavy`);
  }
  return { title: "VÝBAVA", lines, editable: false };
}

function buildHighlights(highlights: string[]): TemplateSection {
  return {
    title: "HLAVNÍ PŘEDNOSTI",
    lines: highlights.map((h) => h),
    editable: false,
  };
}

// ============================================
// Full template
// ============================================

export interface DescriptionTemplate {
  intro: string;
  sections: TemplateSection[];
  outro: string;
}

export function buildDescriptionTemplate(
  details: Partial<DetailsData>,
  inspection?: Partial<InspectionData>,
): DescriptionTemplate {
  const sections: TemplateSection[] = [];

  const techParams = buildTechParams(details);
  if (techParams.lines.length > 0) sections.push(techParams);

  const state = buildVehicleState(details, inspection);
  if (state.lines.length > 0) sections.push(state);

  const equipment = details.equipment ?? [];
  if (equipment.length > 0) sections.push(buildEquipment(equipment));

  const highlights = details.highlights ?? [];
  if (highlights.length > 0) sections.push(buildHighlights(highlights));

  return { intro: "", sections, outro: "" };
}

// ============================================
// Render template to final text
// ============================================

export function renderDescription(template: DescriptionTemplate): string {
  const parts: string[] = [];

  if (template.intro.trim()) {
    parts.push(template.intro.trim());
  }

  for (const section of template.sections) {
    if (section.lines.length === 0) continue;
    const header = section.title;
    // Equipment and highlights use bullet points
    if (section.title === "VÝBAVA" || section.title === "HLAVNÍ PŘEDNOSTI") {
      parts.push(`${header}:\n${section.lines.map((l) => `• ${l}`).join("\n")}`);
    } else {
      // Tech params and state use "key: value" lines
      parts.push(`${header}:\n${section.lines.map((l) => `• ${l}`).join("\n")}`);
    }
  }

  if (template.outro.trim()) {
    parts.push(template.outro.trim());
  }

  return parts.join("\n\n");
}

// ============================================
// AI prompt builder — only asks for intro + outro
// ============================================

export function buildAiPrompt(details: Partial<DetailsData>): {
  systemPrompt: string;
  userPrompt: string;
} {
  const systemPrompt = `Jsi expert na psaní inzerátů ojetých aut v češtině. Tvým úkolem je napsat POUZE dvě krátké části:

1. ÚVODNÍ ODSTAVEC (2-3 věty): Představ vůz, vyzdvihni jeho hlavní přednosti, napiš lákavě ale důvěryhodně.
2. ZÁVĚREČNÝ ODSTAVEC (1-2 věty): Výzva k akci — nabídka prohlídky, kontaktu, možnost financování.

PRAVIDLA:
- Piš česky, profesionálně ale přátelsky
- Nepoužívej superlativy bez podkladu
- Nepoužívej emoji
- Nepiš nadpisy ani odrážky
- Odpověz PŘESNĚ ve formátu:
INTRO: [tvůj úvodní text]
OUTRO: [tvůj závěrečný text]`;

  const highlights = details.highlights ?? [];
  const userPrompt = `Napiš úvod a závěr inzerátu pro:
${details.brand ?? ""} ${details.model ?? ""}${details.variant ? ` ${details.variant}` : ""}, ${details.year ?? ""}
Nájezd: ${details.mileage ? formatMileage(details.mileage) : "neuvedeno"}
Palivo: ${label(FUEL_LABELS, details.fuelType) ?? "neuvedeno"}
Převodovka: ${label(TRANSMISSION_LABELS, details.transmission) ?? "neuvedeno"}
Stav: ${label(CONDITION_LABELS, details.condition) ?? "neuvedeno"}
${highlights.length > 0 ? `Přednosti: ${highlights.join(", ")}` : ""}`;

  return { systemPrompt, userPrompt };
}

// ============================================
// Parse AI response into intro + outro
// ============================================

export function parseAiResponse(text: string): { intro: string; outro: string } {
  const introMatch = text.match(/INTRO:\s*([\s\S]*?)(?=OUTRO:|$)/i);
  const outroMatch = text.match(/OUTRO:\s*([\s\S]*?)$/i);

  return {
    intro: introMatch?.[1]?.trim() ?? text.trim(),
    outro: outroMatch?.[1]?.trim() ?? "",
  };
}
