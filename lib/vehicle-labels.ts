// ============================================
// Vehicle labels — sdílené mapy pro fuel / transmission / body type
// ============================================
// Centrální zdroj pravdy pro lidsky čitelné labely kódů z DB.
// Používá se v /nabidka, /profil, /inzerce, PWA vehicle card atd.
// lib/listings.ts re-exportuje tyto mapy kvůli backward-compat.

/** Palivo — DB kód → CZ label */
export const fuelLabels: Record<string, string> = {
  PETROL: "Benzín",
  DIESEL: "Diesel",
  ELECTRIC: "Elektro",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in Hybrid",
  LPG: "LPG",
  CNG: "CNG",
};

/** Převodovka — DB kód → CZ label */
export const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuál",
  AUTOMATIC: "Automat",
  DSG: "DSG",
  CVT: "CVT",
};

/** Karoserie — DB kód → CZ label */
export const bodyTypeLabels: Record<string, string> = {
  SEDAN: "Sedan",
  HATCHBACK: "Hatchback",
  COMBI: "Combi",
  SUV: "SUV",
  COUPE: "Coupé",
  CABRIO: "Kabriolet",
  VAN: "MPV/Van",
  PICKUP: "Pickup",
};

/** Bezpečný lookup s fallbackem na původní kód (pro unknown hodnoty z DB). */
export function getFuelLabel(code: string | null | undefined): string {
  if (!code) return "";
  return fuelLabels[code] ?? code;
}

export function getTransmissionLabel(code: string | null | undefined): string {
  if (!code) return "";
  return transmissionLabels[code] ?? code;
}

export function getBodyTypeLabel(code: string | null | undefined): string {
  if (!code) return "";
  return bodyTypeLabels[code] ?? code;
}
