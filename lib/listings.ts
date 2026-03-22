// ============================================
// Listings — sdílené funkce pro inzertní platformu
// ============================================

/**
 * Generuje URL-friendly slug pro inzerát
 */
export function generateListingSlug(brand: string, model: string, year: number): string {
  const base = `${brand}-${model}-${year}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

/**
 * Formátování ceny do CZK
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("cs-CZ").format(price);
}

/**
 * Labely pro fuel type
 */
export const fuelLabels: Record<string, string> = {
  PETROL: "Benzín",
  DIESEL: "Diesel",
  ELECTRIC: "Elektro",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in Hybrid",
  LPG: "LPG",
  CNG: "CNG",
};

/**
 * Labely pro transmission
 */
export const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuál",
  AUTOMATIC: "Automat",
  DSG: "DSG",
  CVT: "CVT",
};

/**
 * Labely pro body type
 */
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

/**
 * Labely pro listing type
 */
export const listingTypeLabels: Record<string, string> = {
  BROKER: "Ověřeno makléřem",
  DEALER: "Autobazar",
  PRIVATE: "Soukromý prodejce",
};

/**
 * Labely pro condition
 */
export const conditionLabels: Record<string, string> = {
  NEW: "Nové",
  LIKE_NEW: "Jako nové",
  EXCELLENT: "Výborný",
  GOOD: "Dobrý",
  FAIR: "Uspokojivý",
  DAMAGED: "Poškozené",
};
