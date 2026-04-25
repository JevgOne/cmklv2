/**
 * Kalkulace provize z prodeje vozidla.
 *
 * Pravidla:
 * - Celková provize = 5% z prodejní ceny, minimálně 25 000 Kč
 * - Makléřův podíl závisí na kariérní úrovni (hvězdičky):
 *   - ⭐     30%
 *   - ⭐⭐    40%
 *   - ⭐⭐⭐   50%
 *   - ⭐⭐⭐⭐  55%
 *   - ⭐⭐⭐⭐⭐ 60%
 * - Manažerský bonus = 2 500 Kč (fixní)
 */

import { getStarLevelByKey, type StarLevelKey } from "./broker-points";

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
  brokerLevel: StarLevelKey = "STAR_1"
): CommissionBreakdown {
  const total = Math.max(soldPrice * COMMISSION_RATE, MIN_COMMISSION);

  const starLevel = getStarLevelByKey(brokerLevel);
  const brokerRate = starLevel.commissionRate;

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
