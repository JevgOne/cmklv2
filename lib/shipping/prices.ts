/**
 * Carmakler flat shipping prices — single source of truth.
 *
 * Carmakler má vlastní smlouvy s dopravci a nabízí zákazníkovi FLAT ceny
 * (ne dynamické z API dopravce). Všechny ceny jsou v Kč včetně DPH.
 *
 * Reálné ceny zadá product owner později, dokud to platí, jsou to
 * přibližné tržní hodnoty (MVP fallback).
 *
 * Import:
 *   - Frontend UI: `getShippingMethods()` nebo `SHIPPING_METHOD_INFO`
 *   - API / backend: `getShippingPrice(method)` nebo `CARMAKLER_SHIPPING_PRICES`
 */

import type { DeliveryMethod } from "./types";

/* ------------------------------------------------------------------ */
/*  Ceník — pouze čísla, typ-safe, pro backend                          */
/* ------------------------------------------------------------------ */

export const CARMAKLER_SHIPPING_PRICES: Record<DeliveryMethod, number> = {
  ZASILKOVNA: 79,
  DPD: 109,
  PPL: 99,
  GLS: 109,
  CESKA_POSTA: 129,
  PICKUP: 0,
};

/**
 * Bezpečný getter s fallbackem na 0 (nemělo by nastat — enum guarded).
 */
export function getShippingPrice(method: DeliveryMethod): number {
  return CARMAKLER_SHIPPING_PRICES[method] ?? 0;
}

/* ------------------------------------------------------------------ */
/*  Display info — pro frontend UI                                      */
/* ------------------------------------------------------------------ */

export interface ShippingMethodInfo {
  method: DeliveryMethod;
  label: string;       // Zobrazované jméno ("Zásilkovna", "Osobní odběr")
  description: string; // Krátký popis pod labelem
  eta: string;         // Odhad doručení ("1–2 prac. dny")
  icon: string;        // Emoji ikona (dočasně; později SVG z /public/shipping/)
  price: number;       // Cena v Kč (kopie z CARMAKLER_SHIPPING_PRICES pro pohodlí)
  order: number;       // Sort order (menší = výše)
}

export const SHIPPING_METHOD_INFO: Record<DeliveryMethod, ShippingMethodInfo> = {
  ZASILKOVNA: {
    method: "ZASILKOVNA",
    label: "Zásilkovna",
    description: "Vyzvednutí na jednom z 8 000+ výdejních míst",
    eta: "1–2 prac. dny",
    icon: "📦",
    price: CARMAKLER_SHIPPING_PRICES.ZASILKOVNA,
    order: 1,
  },
  PPL: {
    method: "PPL",
    label: "PPL",
    description: "Doručení kurýrem na uvedenou adresu",
    eta: "1–2 prac. dny",
    icon: "🚚",
    price: CARMAKLER_SHIPPING_PRICES.PPL,
    order: 2,
  },
  DPD: {
    method: "DPD",
    label: "DPD",
    description: "Doručení kurýrem na uvedenou adresu",
    eta: "1–2 prac. dny",
    icon: "🚚",
    price: CARMAKLER_SHIPPING_PRICES.DPD,
    order: 3,
  },
  GLS: {
    method: "GLS",
    label: "GLS",
    description: "Doručení kurýrem na uvedenou adresu",
    eta: "1–2 prac. dny",
    icon: "🚚",
    price: CARMAKLER_SHIPPING_PRICES.GLS,
    order: 4,
  },
  CESKA_POSTA: {
    method: "CESKA_POSTA",
    label: "Česká pošta",
    description: "Doručení balík do ruky, případně do schránky",
    eta: "2–3 prac. dny",
    icon: "🚚",
    price: CARMAKLER_SHIPPING_PRICES.CESKA_POSTA,
    order: 5,
  },
  PICKUP: {
    method: "PICKUP",
    label: "Osobní odběr",
    description: "Vyzvednutí v sídle CarMakler, Praha — adresa v potvrzovacím emailu",
    eta: "Ihned po potvrzení",
    icon: "🏪",
    price: CARMAKLER_SHIPPING_PRICES.PICKUP,
    order: 6,
  },
};

/**
 * Vrátí všechny dopravní metody v zobrazovacím pořadí.
 */
export function getShippingMethods(): ShippingMethodInfo[] {
  return Object.values(SHIPPING_METHOD_INFO).sort((a, b) => a.order - b.order);
}
