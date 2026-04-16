/**
 * Shared role/level/tab labels for public profile pages.
 * Admin pages (app/(admin)/admin/users, app/(admin)/admin/suppliers) keep their
 * own subsets on purpose — they include ADMIN/BACKOFFICE/MANAGER which are not
 * public profile roles.
 */

export const ROLE_LABELS: Record<string, string> = {
  BROKER: "Certifikovaný makléř",
  ADVERTISER: "Inzerent",
  PARTS_SUPPLIER: "Dodavatel dílů",
  WHOLESALE_SUPPLIER: "Velkoobchod",
  PARTNER_VRAKOVISTE: "Vrakoviště",
  BUYER: "Zákazník",
  INVESTOR: "Ověřený investor",
  VERIFIED_DEALER: "Ověřený dealer",
  PARTNER_BAZAR: "Autobazar",
};

export const LEVEL_LABELS: Record<string, string> = {
  JUNIOR: "Nováček",
  BROKER: "Makléř",
  SENIOR: "Senior",
  TOP: "TOP Makléř",
};

export const ROLE_TABS: Record<string, string[]> = {
  BROKER: ["vehicles", "liked"],
  ADVERTISER: ["listings", "liked"],
  PARTS_SUPPLIER: ["parts", "liked"],
  WHOLESALE_SUPPLIER: ["parts", "liked"],
  PARTNER_VRAKOVISTE: ["parts", "liked"],
  BUYER: ["liked"],
  ADMIN: ["vehicles", "listings", "parts", "liked"],
  BACKOFFICE: ["vehicles", "listings", "parts", "liked"],
  MANAGER: ["liked"],
  REGIONAL_DIRECTOR: ["liked"],
  INVESTOR: ["investments", "liked"],
  VERIFIED_DEALER: ["vehicles", "flips", "liked"],
  PARTNER_BAZAR: ["listings", "liked"],
};

export const TAB_LABELS: Record<string, string> = {
  vehicles: "Vozidla",
  listings: "Inzeráty",
  parts: "Díly",
  liked: "Oblíbené",
  investments: "Investice",
  flips: "Flipy",
};

export const DAY_KEYS = ["po", "ut", "st", "ct", "pa", "so", "ne"] as const;

export const DAY_LABELS: Record<string, string> = {
  po: "Pondělí",
  ut: "Úterý",
  st: "Středa",
  ct: "Čtvrtek",
  pa: "Pátek",
  so: "Sobota",
  ne: "Neděle",
};
