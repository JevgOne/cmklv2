import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Lazy Stripe instance — inicializuje se až při prvním volání,
 * aby nedošlo k chybě při buildu bez env proměnných.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Carmakler bankovní údaje pro převody
export const CARMAKLER_BANK = {
  accountNumber: "123456789/0100", // TODO: Nastavit reálný účet
  iban: "CZ6508000000001234567890", // TODO: Nastavit reálný IBAN
  bic: "KOMBCZPP",
  bankName: "Komerční banka",
  accountHolder: "Carmakler s.r.o.",
};

// Provize Carmakler
export const COMMISSION_CONFIG = {
  rate: 0.05, // 5%
  minimumCzk: 25000, // Minimální provize 25 000 Kč
  brokerShareRate: 0.5, // 50% provize jde makléři
  managerBonusCzk: 2500, // Manažerský bonus 2 500 Kč
};

/**
 * Vypočítá provizi a její rozdělení
 */
export function calculateCommission(salePrice: number) {
  const rawCommission = Math.round(salePrice * COMMISSION_CONFIG.rate);
  const commission = Math.max(rawCommission, COMMISSION_CONFIG.minimumCzk);
  const brokerShare = Math.round(commission * COMMISSION_CONFIG.brokerShareRate);
  const managerBonus = COMMISSION_CONFIG.managerBonusCzk;
  const companyShare = commission - brokerShare - managerBonus;

  return {
    commission,
    brokerShare,
    companyShare,
    managerBonus,
    sellerPayout: salePrice - commission,
  };
}

/**
 * Generuje variabilní symbol z ID vozidla (8 čísel)
 */
export function generateVariableSymbol(vehicleId: string): string {
  let hash = 0;
  for (let i = 0; i < vehicleId.length; i++) {
    const char = vehicleId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString().slice(0, 8).padStart(8, "0");
}
