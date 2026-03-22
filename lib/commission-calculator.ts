/**
 * Kalkulace provize z prodeje vozidla.
 *
 * Pravidla:
 * - Celková provize = 5 % z prodejní ceny, minimálně 25 000 Kč
 * - Makléř dostane 50 % celkové provize
 * - Firma dostane 50 % celkové provize minus manažerský bonus
 * - Manažerský bonus = 2 500 Kč (fixní)
 */

export interface CommissionBreakdown {
  total: number;
  brokerShare: number;
  companyShare: number;
  managerBonus: number;
}

const MIN_COMMISSION = 25_000;
const COMMISSION_RATE = 0.05;
const BROKER_SPLIT = 0.5;
const MANAGER_BONUS = 2_500;

export function calculateCommission(soldPrice: number): CommissionBreakdown {
  const total = Math.max(soldPrice * COMMISSION_RATE, MIN_COMMISSION);
  const brokerShare = total * BROKER_SPLIT;
  const managerBonus = MANAGER_BONUS;
  const companyShare = total * BROKER_SPLIT - managerBonus;

  return {
    total: Math.round(total),
    brokerShare: Math.round(brokerShare),
    companyShare: Math.round(companyShare),
    managerBonus,
  };
}
