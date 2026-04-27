import { prisma } from "@/lib/prisma";

/**
 * Dealer Reputation System (1.0–5.0 hvězd)
 *
 * Vážený průměr 4 faktorů z vlastních Prisma dat:
 * - Úspěšnost flipů (30%): % completed vs cancelled
 * - Průměrný ROI pro investory (25%): skutečný výnos
 * - Dodržení časového plánu (25%): rychlost dokončení
 * - Počet flipů (20%): zkušenost = důvěryhodnost
 */

const WEIGHTS = {
  successRate: 0.3,
  investorRoi: 0.25,
  timeliness: 0.25,
  experience: 0.2,
} as const;

export interface DealerRatingBreakdown {
  successRate: number;
  investorRoi: number;
  timeliness: number;
  experience: number;
  total: number;
  flipCount: number;
  completedCount: number;
}

export async function calculateDealerRating(dealerId: string): Promise<DealerRatingBreakdown> {
  const allFlips = await prisma.flipOpportunity.findMany({
    where: {
      dealerId,
      status: { in: ["COMPLETED", "CANCELLED"] },
    },
    select: {
      status: true,
      purchasePrice: true,
      repairCost: true,
      actualSalePrice: true,
      estimatedSalePrice: true,
      createdAt: true,
      soldAt: true,
    },
  });

  const flipCount = allFlips.length;

  if (flipCount === 0) {
    // Nový dealer — neutrální rating 3.0
    return {
      successRate: 3,
      investorRoi: 3,
      timeliness: 3,
      experience: 1,
      total: 2.5,
      flipCount: 0,
      completedCount: 0,
    };
  }

  const completed = allFlips.filter((f) => f.status === "COMPLETED");
  const cancelled = allFlips.filter((f) => f.status === "CANCELLED");
  const completedCount = completed.length;

  // 1. Úspěšnost (1-5): ratio completed / total
  const successRatio = flipCount > 0 ? completedCount / flipCount : 0;
  // 100% = 5.0, 80% = 4.0, 60% = 3.0, 40% = 2.0, 20% = 1.0
  const successRate = Math.max(1, Math.min(5, successRatio * 5));

  // 2. Průměrný ROI pro investory (1-5)
  const rois = completed
    .filter((f) => f.actualSalePrice && f.actualSalePrice > 0)
    .map((f) => {
      const cost = f.purchasePrice + f.repairCost;
      return cost > 0 ? ((f.actualSalePrice! - cost) / cost) * 100 : 0;
    });
  const avgRoi = rois.length > 0 ? rois.reduce((s, r) => s + r, 0) / rois.length : 0;
  // ROI: <0% = 1, 0-10% = 2, 10-20% = 3, 20-30% = 4, 30%+ = 5
  let investorRoi: number;
  if (avgRoi < 0) investorRoi = 1;
  else if (avgRoi < 10) investorRoi = 2;
  else if (avgRoi < 20) investorRoi = 3;
  else if (avgRoi < 30) investorRoi = 4;
  else investorRoi = 5;

  // 3. Dodržení časového plánu (1-5): průměrný počet dní
  const daysList = completed
    .filter((f) => f.soldAt)
    .map((f) => {
      const days = (f.soldAt!.getTime() - f.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return Math.max(1, days);
    });
  const avgDays = daysList.length > 0 ? daysList.reduce((s, d) => s + d, 0) / daysList.length : 90;
  // <30 dní = 5, 30-60 = 4, 60-90 = 3, 90-120 = 2, 120+ = 1
  let timeliness: number;
  if (avgDays <= 30) timeliness = 5;
  else if (avgDays <= 60) timeliness = 4;
  else if (avgDays <= 90) timeliness = 3;
  else if (avgDays <= 120) timeliness = 2;
  else timeliness = 1;

  // 4. Zkušenost (1-5): počet dokončených flipů
  // 1 flip = 1, 2-3 = 2, 4-6 = 3, 7-10 = 4, 11+ = 5
  let experience: number;
  if (completedCount <= 1) experience = 1;
  else if (completedCount <= 3) experience = 2;
  else if (completedCount <= 6) experience = 3;
  else if (completedCount <= 10) experience = 4;
  else experience = 5;

  // Vážený průměr
  const total = Math.round(
    (successRate * WEIGHTS.successRate +
      investorRoi * WEIGHTS.investorRoi +
      timeliness * WEIGHTS.timeliness +
      experience * WEIGHTS.experience) * 10
  ) / 10;

  const finalRating = Math.max(1, Math.min(5, total));

  // Uložit do všech aktivních opportunities tohoto dealera (cached)
  await prisma.flipOpportunity.updateMany({
    where: {
      dealerId,
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    data: { dealerRating: finalRating },
  });

  return {
    successRate: Math.round(successRate * 10) / 10,
    investorRoi: Math.round(investorRoi * 10) / 10,
    timeliness: Math.round(timeliness * 10) / 10,
    experience: Math.round(experience * 10) / 10,
    total: finalRating,
    flipCount,
    completedCount,
  };
}
