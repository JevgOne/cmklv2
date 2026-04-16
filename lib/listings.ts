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
 * Labely pro fuel / transmission / body type
 * Re-export z lib/vehicle-labels.ts (single source of truth, no drift risk)
 */
export {
  fuelLabels,
  transmissionLabels,
  bodyTypeLabels,
} from "./vehicle-labels";

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
