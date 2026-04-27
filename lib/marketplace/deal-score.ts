import { prisma } from "@/lib/prisma";

/**
 * AI Deal Score (1-100) — vážený průměr 4 faktorů:
 * - Margin of Safety (40%): potenciální zisk vs celková investice
 * - Dealer Track Record (30%): historický úspěch dealera
 * - Market Demand (20%): jak rychle se podobná auta prodávají (z vlastních dat)
 * - Data Completeness (10%): VIN, fotky, popis opravy
 *
 * Výpočet z vlastních Prisma dat — ŽÁDNÉ externí AI API.
 */

const WEIGHTS = {
  margin: 0.4,
  dealer: 0.3,
  market: 0.2,
  completeness: 0.1,
} as const;

interface ScoreBreakdown {
  margin: number;
  dealer: number;
  market: number;
  completeness: number;
  total: number;
}

export async function calculateDealScore(opportunityId: string): Promise<ScoreBreakdown> {
  const opportunity = await prisma.flipOpportunity.findUnique({
    where: { id: opportunityId },
    include: {
      dealer: { select: { id: true } },
    },
  });

  if (!opportunity) throw new Error(`Opportunity ${opportunityId} not found`);

  // 1. Margin of Safety (0-100)
  const totalCost = opportunity.purchasePrice + opportunity.repairCost;
  const marginRatio = totalCost > 0
    ? (opportunity.estimatedSalePrice - totalCost) / totalCost
    : 0;
  // 0% margin → 0, 10% → 33, 20% → 55, 30%+ → 75+, 50%+ → 100
  const marginScore = Math.min(100, Math.max(0, Math.round(marginRatio * 200)));

  // 2. Dealer Track Record (0-100)
  const dealerScore = await calculateDealerScore(opportunity.dealer.id);

  // 3. Market Demand (0-100)
  const marketScore = await calculateMarketScore(
    opportunity.brand,
    opportunity.model,
    opportunity.year
  );

  // 4. Data Completeness (0-100)
  const completenessScore = calculateCompleteness(opportunity);

  // Vážený průměr
  const total = Math.round(
    marginScore * WEIGHTS.margin +
    dealerScore * WEIGHTS.dealer +
    marketScore * WEIGHTS.market +
    completenessScore * WEIGHTS.completeness
  );

  const finalScore = Math.min(100, Math.max(1, total));

  // Uložit do DB
  await prisma.flipOpportunity.update({
    where: { id: opportunityId },
    data: {
      dealScore: finalScore,
      dealScoreUpdatedAt: new Date(),
    },
  });

  return {
    margin: marginScore,
    dealer: dealerScore,
    market: marketScore,
    completeness: completenessScore,
    total: finalScore,
  };
}

async function calculateDealerScore(dealerId: string): Promise<number> {
  const dealerFlips = await prisma.flipOpportunity.findMany({
    where: { dealerId, status: "COMPLETED" },
    select: {
      purchasePrice: true,
      repairCost: true,
      actualSalePrice: true,
      createdAt: true,
      soldAt: true,
    },
  });

  if (dealerFlips.length === 0) return 30; // Nový dealer — neutrální

  // Faktor 1: Počet dokončených flipů (max 30 bodů)
  const countScore = Math.min(30, dealerFlips.length * 6);

  // Faktor 2: Průměrný ROI (max 40 bodů)
  const rois = dealerFlips.map((f) => {
    const cost = f.purchasePrice + f.repairCost;
    const sale = f.actualSalePrice ?? 0;
    return cost > 0 ? (sale - cost) / cost : 0;
  });
  const avgRoi = rois.reduce((sum, r) => sum + r, 0) / rois.length;
  // 0% ROI → 0, 15% → 20, 25% → 33, 40%+ → 40
  const roiScore = Math.min(40, Math.max(0, Math.round(avgRoi * 100)));

  // Faktor 3: % ziskových flipů (max 30 bodů)
  const profitableCount = rois.filter((r) => r > 0).length;
  const profitableRatio = profitableCount / dealerFlips.length;
  const profitableScore = Math.round(profitableRatio * 30);

  return Math.min(100, countScore + roiScore + profitableScore);
}

async function calculateMarketScore(
  brand: string,
  model: string,
  year: number
): Promise<number> {
  // Jak rychle se podobná auta prodávají z vlastních dat
  const similarSold = await prisma.flipOpportunity.findMany({
    where: {
      brand,
      status: "COMPLETED",
      soldAt: { not: null },
      year: { gte: year - 3, lte: year + 3 },
    },
    select: { createdAt: true, soldAt: true },
    take: 20,
    orderBy: { soldAt: "desc" },
  });

  if (similarSold.length === 0) {
    // Žádná historická data pro tuto značku — zkusit jen značku
    const brandSold = await prisma.flipOpportunity.count({
      where: { brand, status: "COMPLETED" },
    });
    return brandSold > 0 ? 40 : 50; // Neutrální pokud nemáme data
  }

  // Průměrný čas prodeje (ve dnech)
  const saleDays = similarSold
    .filter((s) => s.soldAt)
    .map((s) => {
      const diff = (s.soldAt!.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return Math.max(1, diff);
    });

  if (saleDays.length === 0) return 50;

  const avgDays = saleDays.reduce((sum, d) => sum + d, 0) / saleDays.length;

  // < 30 dní → 100, 30-60 → 70, 60-90 → 50, 90-120 → 30, 120+ → 10
  if (avgDays <= 30) return 100;
  if (avgDays <= 60) return 70;
  if (avgDays <= 90) return 50;
  if (avgDays <= 120) return 30;
  return 10;
}

function calculateCompleteness(opportunity: {
  vin: string | null;
  photos: string | null;
  repairDescription: string | null;
  repairPhotos: string | null;
}): number {
  let score = 0;

  // VIN zadáno (25 bodů)
  if (opportunity.vin && opportunity.vin.length >= 17) score += 25;

  // Fotky nahrány (25 bodů)
  if (opportunity.photos) {
    try {
      const photos = JSON.parse(opportunity.photos) as string[];
      if (photos.length >= 5) score += 25;
      else if (photos.length >= 1) score += 15;
    } catch { /* noop */ }
  }

  // Popis opravy detailní (25 bodů)
  if (opportunity.repairDescription) {
    if (opportunity.repairDescription.length >= 100) score += 25;
    else if (opportunity.repairDescription.length >= 30) score += 15;
  }

  // Fotky opravy (25 bodů)
  if (opportunity.repairPhotos) {
    try {
      const photos = JSON.parse(opportunity.repairPhotos) as string[];
      if (photos.length >= 3) score += 25;
      else if (photos.length >= 1) score += 15;
    } catch { /* noop */ }
  }

  return score;
}
