/**
 * Kalkulace provize z prodeje vozidla.
 *
 * Pravidla:
 * - Celková provize = 5% z prodejní ceny, minimálně 25 000 Kč
 * - Makléřův podíl závisí na kariérní úrovni:
 *   - Tipař: 30%
 *   - Junior: 40%
 *   - Senior: 55%
 *   - Expert: 65%
 * - +5% bonus za TIP (doporučení klienta)
 * - Manažerský bonus = 2 500 Kč (fixní)
 */

import { getCareerLevelByKey, TIP_BONUS_RATE, type CareerLevelKey } from "./broker-points";

export interface CommissionBreakdown {
  total: number;
  brokerShare: number;
  companyShare: number;
  managerBonus: number;
  brokerRate: number;
}

const MIN_COMMISSION = 25_000;
const COMMISSION_RATE = 0.05;
const MANAGER_BONUS = 2_500;

export function calculateCommission(
  soldPrice: number,
  brokerLevel: CareerLevelKey = "TIPAR",
  isTip: boolean = false
): CommissionBreakdown {
  const total = Math.max(soldPrice * COMMISSION_RATE, MIN_COMMISSION);

  const careerLevel = getCareerLevelByKey(brokerLevel);
  const brokerRate = careerLevel.commissionRate + (isTip ? TIP_BONUS_RATE : 0);

  const brokerShare = total * brokerRate;
  const managerBonus = MANAGER_BONUS;
  const companyShare = total - brokerShare - managerBonus;

  return {
    total: Math.round(total),
    brokerShare: Math.round(brokerShare),
    companyShare: Math.round(Math.max(0, companyShare)),
    managerBonus,
    brokerRate,
  };
}
