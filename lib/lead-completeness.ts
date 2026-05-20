/**
 * Calculate data completeness score for a ScoutLead.
 * 10-point system, separate logic for SOUKROMNIK vs AUTOBAZAR/VRAKOVISTE.
 */

interface CompletenessField {
  key: string;
  label: string;
  points: number;
  present: boolean;
}

interface CompletenessResult {
  score: number;
  max: number;
  percent: number;
  fields: CompletenessField[];
}

type LeadData = Record<string, unknown>;

const SOUKROMNIK_FIELDS: Array<{ key: string; label: string; points: number }> = [
  { key: "phone", label: "Telefon", points: 2 },
  { key: "city", label: "Město", points: 1 },
  { key: "vehicleBrand", label: "Značka", points: 1 },
  { key: "vehicleModel", label: "Model", points: 1 },
  { key: "vehicleYear", label: "Rok", points: 1 },
  { key: "vehiclePrice", label: "Cena", points: 2 },
  { key: "vehicleMileage", label: "Nájezd", points: 1 },
  { key: "listingTitle", label: "Titulek", points: 1 },
];

const BUSINESS_FIELDS: Array<{ key: string; label: string; points: number }> = [
  { key: "phone", label: "Telefon", points: 2 },
  { key: "email", label: "Email", points: 1 },
  { key: "web", label: "Web", points: 1 },
  { key: "city", label: "Město", points: 1 },
  { key: "address", label: "Adresa", points: 1 },
  { key: "ico", label: "IČO", points: 1 },
  { key: "googleRating", label: "Google rating", points: 1 },
  { key: "estimatedSize", label: "Velikost", points: 1 },
  { key: "estimatedInventory", label: "Počet aut", points: 1 },
];

function hasValue(val: unknown): boolean {
  if (val == null) return false;
  if (typeof val === "string") return val.trim().length > 0;
  if (typeof val === "number") return val > 0;
  return true;
}

export function calculateCompleteness(lead: LeadData, category: string): CompletenessResult {
  const fieldDefs = category === "SOUKROMNIK" ? SOUKROMNIK_FIELDS : BUSINESS_FIELDS;
  const max = fieldDefs.reduce((sum, f) => sum + f.points, 0);

  const fields: CompletenessField[] = fieldDefs.map((f) => ({
    key: f.key,
    label: f.label,
    points: f.points,
    present: hasValue(lead[f.key]),
  }));

  const score = fields
    .filter((f) => f.present)
    .reduce((sum, f) => sum + f.points, 0);

  return {
    score,
    max,
    percent: max > 0 ? Math.round((score / max) * 100) : 0,
    fields,
  };
}
