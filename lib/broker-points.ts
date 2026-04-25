import { prisma } from "./prisma";

// ============================================
// KARIÉRNÍ ÚROVNĚ
// ============================================

export const CAREER_LEVELS = [
  { key: "TIPAR", name: "Tipař", minPoints: 0, commissionRate: 0.30 },
  { key: "JUNIOR", name: "Junior", minPoints: 300, commissionRate: 0.40 },
  { key: "SENIOR", name: "Senior", minPoints: 500, commissionRate: 0.55 },
  { key: "EXPERT", name: "Expert", minPoints: 650, commissionRate: 0.65 },
] as const;

export type CareerLevelKey = "TIPAR" | "JUNIOR" | "SENIOR" | "EXPERT";

export const TIP_BONUS_RATE = 0.05; // +5% za doporučení klienta

// ============================================
// VÝPOČET BODŮ
// ============================================

/** Auto prodej: 1 000 Kč provize pro firmu = 1 bod */
export function calculateCarSalePoints(companyCommission: number): number {
  return companyCommission / 1000;
}

/** Úvěr: fixně 20 bodů (počítá se od 20k Kč) */
export function calculateLoanPoints(loanAmount: number): number {
  if (loanAmount < 20_000) return 0;
  return 20;
}

/** POV/HAV: 10 000 Kč co zaplatí klient = 1.4 bodu */
export function calculateInsurancePoints(clientPayment: number): number {
  return (clientPayment / 10_000) * 1.4;
}

// ============================================
// LEVEL Z BODŮ
// ============================================

export function calculateCareerLevel(totalPoints: number): (typeof CAREER_LEVELS)[number] {
  for (let i = CAREER_LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= CAREER_LEVELS[i].minPoints) {
      return CAREER_LEVELS[i];
    }
  }
  return CAREER_LEVELS[0];
}

export function getCareerLevelByKey(key: string): (typeof CAREER_LEVELS)[number] {
  return CAREER_LEVELS.find((l) => l.key === key) ?? CAREER_LEVELS[0];
}

// ============================================
// BROKER COMMISSION RATE
// ============================================

/** Vrátí % provize pro makléře na základě jeho úrovně + TIP bonus */
export function getBrokerCommissionRate(level: CareerLevelKey, isTip: boolean = false): number {
  const careerLevel = getCareerLevelByKey(level);
  return careerLevel.commissionRate + (isTip ? TIP_BONUS_RATE : 0);
}

// ============================================
// PŘIDAT BODY
// ============================================

export async function addBrokerPoints(params: {
  brokerId: string;
  type: "CAR_SALE" | "LOAN" | "INSURANCE" | "TIP_BONUS" | "MANUAL_ADJUSTMENT";
  points: number;
  vehicleId?: string;
  commissionId?: string;
  description?: string;
  sourceAmount?: number;
}): Promise<{ newTotalPoints: number; newLevel: CareerLevelKey; levelChanged: boolean }> {
  const { brokerId, type, points, vehicleId, commissionId, description, sourceAmount } = params;

  const result = await prisma.$transaction(async (tx) => {
    await tx.brokerPointTransaction.create({
      data: {
        brokerId,
        type,
        points,
        vehicleId: vehicleId ?? null,
        commissionId: commissionId ?? null,
        description: description ?? null,
        sourceAmount: sourceAmount ?? null,
      },
    });

    const agg = await tx.brokerPointTransaction.aggregate({
      where: { brokerId },
      _sum: { points: true },
    });

    const newTotalPoints = agg._sum.points ?? 0;
    const newLevel = calculateCareerLevel(newTotalPoints);

    const user = await tx.user.findUnique({
      where: { id: brokerId },
      select: { level: true },
    });

    const levelChanged = user?.level !== newLevel.key;

    await tx.user.update({
      where: { id: brokerId },
      data: {
        totalPoints: newTotalPoints,
        level: newLevel.key,
      },
    });

    return { newTotalPoints, newLevel: newLevel.key as CareerLevelKey, levelChanged };
  });

  return result;
}

// ============================================
// PROGRESS K DALŠÍ ÚROVNI
// ============================================

export interface CareerProgress {
  currentLevel: (typeof CAREER_LEVELS)[number];
  nextLevel: (typeof CAREER_LEVELS)[number] | null;
  percentage: number;
  currentPoints: number;
  pointsNeeded: number;
}

export function calculateCareerProgress(totalPoints: number): CareerProgress {
  const currentLevel = calculateCareerLevel(totalPoints);
  const currentIdx = CAREER_LEVELS.findIndex((l) => l.key === currentLevel.key);
  const nextLevel = currentIdx < CAREER_LEVELS.length - 1 ? CAREER_LEVELS[currentIdx + 1] : null;

  if (!nextLevel) {
    return { currentLevel, nextLevel: null, percentage: 100, currentPoints: totalPoints, pointsNeeded: 0 };
  }

  const rangeSize = nextLevel.minPoints - currentLevel.minPoints;
  const progress = totalPoints - currentLevel.minPoints;
  const percentage = Math.min(100, Math.round((progress / rangeSize) * 100));
  const pointsNeeded = Math.max(0, nextLevel.minPoints - totalPoints);

  return { currentLevel, nextLevel, percentage, currentPoints: totalPoints, pointsNeeded };
}
