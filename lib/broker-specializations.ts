/**
 * Shared catalog — typy vozidel + služby napříč Carmakler ekosystémem.
 * Single source of truth pro:
 * - /muj-ucet/profil (editor)
 * - /profil/[slug] (veřejný profil)
 * - components/pwa/onboarding/ProfileForm.tsx (onboarding makléře)
 *
 * DB model:
 * - User.specializations (String? — JSON array) drží typy vozidel (historicky)
 * - User.services (Json?) drží služby (historicky)
 *
 * Tento catalog sjednocuje options. Pro případ, že by někdy přišla mix-hodnota
 * (služba zapsaná v specializations nebo obráceně), použij `categorizeSpecialization`.
 */

export const BROKER_SPECIALIZATIONS = {
  vehicleTypes: [
    "Osobní",
    "SUV",
    "Dodávky",
    "Nákladní",
    "Motocykly",
    "Elektromobily",
    "Luxusní vozy",
    "Veterány",
  ],
  services: [
    // Makléřská síť
    "Výkup vozů",
    "Prodej vozů",
    "Zprostředkování prodeje",
    // Finance
    "Financování vozu",
    "Leasing",
    "Pojištění vozu",
    // Inzerce & Marketplace
    "Inzerce vozu",
    "Marketplace VIP (investice)",
    // Díly
    "Prodej náhradních dílů",
    "Dovoz dílů",
    // Doplňkové služby
    "Dovoz ze zahraničí",
    "Přepis vozu",
    "Prověření auta / VIN (CEBIA)",
    "Přeprava vozu",
    "STK / emise",
    "Servis",
  ],
} as const;

/** Podskupiny služeb pro UI (subheadery v editoru). */
export const SERVICE_GROUPS: Record<string, readonly string[]> = {
  "Prodej & výkup": [
    "Výkup vozů",
    "Prodej vozů",
    "Zprostředkování prodeje",
  ],
  "Finance": [
    "Financování vozu",
    "Leasing",
    "Pojištění vozu",
  ],
  "Inzerce & investice": [
    "Inzerce vozu",
    "Marketplace VIP (investice)",
  ],
  "Díly": [
    "Prodej náhradních dílů",
    "Dovoz dílů",
  ],
  "Doplňkové služby": [
    "Dovoz ze zahraničí",
    "Přepis vozu",
    "Prověření auta / VIN (CEBIA)",
    "Přeprava vozu",
    "STK / emise",
    "Servis",
  ],
};

/**
 * Kategorizuje string do "type" (typ vozidla) / "service" (služba) / "unknown".
 * Case-insensitive match proti kanonickému catalogu.
 *
 * Používá se pro backward compat — staré hodnoty z DB mohou používat jiný
 * casing nebo být zapsané do "špatného" pole. Unknown hodnoty UI vrstva
 * obvykle schová pod fallback (typy vozidel) nebo do sekce "Ostatní".
 */
export function categorizeSpecialization(
  spec: string,
): "type" | "service" | "unknown" {
  const lower = spec.trim().toLowerCase();
  if (!lower) return "unknown";
  if (
    BROKER_SPECIALIZATIONS.vehicleTypes.some(
      (v) => v.toLowerCase() === lower,
    )
  ) {
    return "type";
  }
  if (
    BROKER_SPECIALIZATIONS.services.some((s) => s.toLowerCase() === lower)
  ) {
    return "service";
  }
  return "unknown";
}

export type VehicleType = (typeof BROKER_SPECIALIZATIONS.vehicleTypes)[number];
export type Service = (typeof BROKER_SPECIALIZATIONS.services)[number];
