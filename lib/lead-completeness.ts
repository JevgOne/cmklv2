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
  // Tier 1 — kritická (60 bodů)
  { key: "vehicleBrand", label: "Značka", points: 8 },
  { key: "vehicleModel", label: "Model", points: 8 },
  { key: "vehicleYear", label: "Rok", points: 8 },
  { key: "vehiclePrice", label: "Cena", points: 10 },
  { key: "phone", label: "Telefon", points: 10 },
  { key: "city", label: "Město", points: 6 },
  { key: "vehiclePhotos", label: "Fotky", points: 10 },
  // Tier 2 — důležitá (25 bodů)
  { key: "vehicleMileage", label: "Nájezd", points: 5 },
  { key: "vehicleFuel", label: "Palivo", points: 4 },
  { key: "vehicleTransmission", label: "Převodovka", points: 4 },
  { key: "vehicleDescription", label: "Popis", points: 4 },
  { key: "vehicleEquipment", label: "Výbava", points: 4 },
  { key: "vehicleBodyType", label: "Karoserie", points: 2 },
  { key: "vehiclePower", label: "Výkon", points: 2 },
  // Tier 3 — historie (10 bodů)
  { key: "vehicleVin", label: "VIN", points: 5 },
  { key: "vehicleServiceBook", label: "Serv. knížka", points: 2 },
  { key: "vehicleFirstOwner", label: "1. majitel", points: 2 },
  { key: "vehicleStkDate", label: "STK", points: 1 },
  // Tier 4 — bonus (5 bodů)
  { key: "vehicleConsumption", label: "Spotřeba", points: 2 },
  { key: "vehicleDrive", label: "Pohon", points: 1 },
  { key: "vehicleCountryOfOrigin", label: "Původ", points: 1 },
  { key: "vehicleCondition", label: "Stav", points: 1 },
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
  if (typeof val === "boolean") return true;
  if (typeof val === "string") return val.trim().length > 0;
  if (typeof val === "number") return val > 0;
  return true;
}

export function gradeFromPercent(percent: number): { grade: string; color: string } {
  if (percent >= 90) return { grade: "A", color: "bg-green-100 text-green-700" };
  if (percent >= 70) return { grade: "B", color: "bg-blue-100 text-blue-700" };
  if (percent >= 50) return { grade: "C", color: "bg-orange-100 text-orange-700" };
  if (percent >= 30) return { grade: "D", color: "bg-red-100 text-red-600" };
  return { grade: "F", color: "bg-red-200 text-red-800" };
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
