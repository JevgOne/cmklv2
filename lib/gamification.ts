import { prisma } from "./prisma";

// ============================================
// ACHIEVEMENTS
// ============================================

export const ACHIEVEMENTS = {
  FIRST_VEHICLE: {
    key: "FIRST_VEHICLE",
    name: "Prvni nabirani",
    description: "Nabral prvni auto",
    icon: "car",
  },
  FIRST_SALE: {
    key: "FIRST_SALE",
    name: "Prvni prodej",
    description: "Prodal prvni auto",
    icon: "party",
  },
  QUICK_SALE: {
    key: "QUICK_SALE",
    name: "Rychly prodej",
    description: "Auto prodano do 7 dni",
    icon: "zap",
  },
  FIVE_SALES: {
    key: "FIVE_SALES",
    name: "Petka",
    description: "5 prodeju za mesic",
    icon: "hand",
  },
  TEN_SALES: {
    key: "TEN_SALES",
    name: "Desitka",
    description: "10 prodeju za mesic",
    icon: "ten",
  },
  MILLIONAIRE: {
    key: "MILLIONAIRE",
    name: "Milionar",
    description: "Celkove provize pres 1M Kc",
    icon: "money",
  },
  PHOTO_PRO: {
    key: "PHOTO_PRO",
    name: "Foto profesional",
    description: "20+ fotek u jednoho auta",
    icon: "camera",
  },
  PERFECTIONIST: {
    key: "PERFECTIONIST",
    name: "Perfekcionista",
    description: "5x schvaleni na prvni pokus",
    icon: "sparkles",
  },
  LOYAL_CLIENT: {
    key: "LOYAL_CLIENT",
    name: "Verny klient",
    description: "Prodejce pres nej prodal 2+ aut",
    icon: "handshake",
  },
} as const;

export type AchievementKey = keyof typeof ACHIEVEMENTS;

// ============================================
// LEVELS
// ============================================

export const LEVELS = [
  { key: "JUNIOR", name: "Junior makler", minSales: 0, maxSales: 4, badge: "bronze" },
  { key: "BROKER", name: "Makler", minSales: 5, maxSales: 19, badge: "silver" },
  { key: "SENIOR", name: "Senior makler", minSales: 20, maxSales: 49, badge: "gold" },
  { key: "TOP", name: "Top makler", minSales: 50, maxSales: Infinity, badge: "diamond" },
] as const;

export type LevelKey = "JUNIOR" | "BROKER" | "SENIOR" | "TOP";

export function calculateLevel(totalSales: number): (typeof LEVELS)[number] {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalSales >= LEVELS[i].minSales) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getLevelByKey(key: string) {
  return LEVELS.find((l) => l.key === key) ?? LEVELS[0];
}

// ============================================
// CHECK AND UNLOCK ACHIEVEMENTS
// ============================================

export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const unlocked: string[] = [];

  const existingAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementKey: true },
  });
  const existingKeys = new Set(existingAchievements.map((a) => a.achievementKey));

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all needed data in parallel
  const [
    totalVehicles,
    totalSales,
    monthlySales,
    totalCommissions,
    vehicleWith20Photos,
    approvedWithoutRejection,
    loyalSellers,
    quickSaleVehicle,
  ] = await Promise.all([
    // FIRST_VEHICLE: nabral prvni auto
    prisma.vehicle.count({ where: { brokerId: userId } }),
    // FIRST_SALE + level calc
    prisma.commission.count({ where: { brokerId: userId } }),
    // FIVE_SALES, TEN_SALES
    prisma.commission.count({
      where: { brokerId: userId, soldAt: { gte: startOfMonth } },
    }),
    // MILLIONAIRE
    prisma.commission.aggregate({
      where: { brokerId: userId },
      _sum: { commission: true },
    }),
    // PHOTO_PRO: 20+ fotek u jednoho auta
    prisma.vehicle.findFirst({
      where: { brokerId: userId },
      include: { _count: { select: { images: true } } },
      orderBy: { images: { _count: "desc" } },
    }),
    // PERFECTIONIST: 5x schvaleni bez vraceni (vehicles approved without rejection)
    prisma.vehicle.count({
      where: {
        brokerId: userId,
        status: { in: ["ACTIVE", "RESERVED", "SOLD"] },
        rejectionReason: null,
      },
    }),
    // LOYAL_CLIENT: prodejce pres nej prodal 2+ aut
    prisma.vehicle.groupBy({
      by: ["sellerContactId"],
      where: {
        brokerId: userId,
        status: "SOLD",
        sellerContactId: { not: null },
      },
      _count: true,
      having: { sellerContactId: { _count: { gte: 2 } } },
    }),
    // QUICK_SALE: auto prodano do 7 dni
    prisma.vehicle.findFirst({
      where: {
        brokerId: userId,
        status: "SOLD",
        soldAt: { not: null },
      },
      select: { createdAt: true, soldAt: true },
    }),
  ]);

  async function tryUnlock(key: AchievementKey) {
    if (existingKeys.has(key)) return;
    await prisma.userAchievement.create({
      data: { userId, achievementKey: key },
    });
    unlocked.push(key);
  }

  // FIRST_VEHICLE
  if (totalVehicles >= 1) await tryUnlock("FIRST_VEHICLE");

  // FIRST_SALE
  if (totalSales >= 1) await tryUnlock("FIRST_SALE");

  // QUICK_SALE
  if (quickSaleVehicle?.soldAt && quickSaleVehicle.createdAt) {
    const diffDays =
      (quickSaleVehicle.soldAt.getTime() - quickSaleVehicle.createdAt.getTime()) /
      (1000 * 60 * 60 * 24);
    if (diffDays <= 7) await tryUnlock("QUICK_SALE");
  }

  // FIVE_SALES
  if (monthlySales >= 5) await tryUnlock("FIVE_SALES");

  // TEN_SALES
  if (monthlySales >= 10) await tryUnlock("TEN_SALES");

  // MILLIONAIRE
  if ((totalCommissions._sum.commission ?? 0) >= 1_000_000) await tryUnlock("MILLIONAIRE");

  // PHOTO_PRO
  if (vehicleWith20Photos && vehicleWith20Photos._count.images >= 20) {
    await tryUnlock("PHOTO_PRO");
  }

  // PERFECTIONIST
  if (approvedWithoutRejection >= 5) await tryUnlock("PERFECTIONIST");

  // LOYAL_CLIENT
  if (loyalSellers.length > 0) await tryUnlock("LOYAL_CLIENT");

  // Update level based on total sales
  const level = calculateLevel(totalSales);
  await prisma.user.update({
    where: { id: userId },
    data: { level: level.key, totalSales },
  });

  return unlocked;
}
