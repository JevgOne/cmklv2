import { prisma } from "@/lib/prisma";

export { BADGE_CATALOG, type BadgeContext } from "./badge-defs";

export async function checkAndUnlockBrokerBadges(userId: string): Promise<string[]> {
  const unlocked: string[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { createdAt: true, totalSales: true },
  });

  // VETERAN: 12+ months
  const tenureMonths = (now.getTime() - user.createdAt.getTime()) / (30.44 * 86400000);
  if (tenureMonths >= 12) unlocked.push("VETERAN");

  // Response metrics
  const inquiries = await prisma.vehicleInquiry.findMany({
    where: { vehicle: { brokerId: userId }, createdAt: { gte: thirtyDaysAgo } },
    select: { repliedAt: true, createdAt: true },
  });
  const replied = inquiries.filter((i) => i.repliedAt);

  // RESPONSE_KING: 95%+ response rate (min 5 inquiries)
  if (inquiries.length >= 5 && (replied.length / inquiries.length) >= 0.95) {
    unlocked.push("RESPONSE_KING");
  }

  // FAST_RESPONDER: avg response < 1h
  if (replied.length >= 3) {
    const avgMins = replied.reduce((sum, i) => {
      return sum + (i.repliedAt!.getTime() - i.createdAt.getTime()) / 60000;
    }, 0) / replied.length;
    if (avgMins < 60) unlocked.push("FAST_RESPONDER");
  }

  // TOP_SELLER: 5+ sales in last 30 days
  const recentSales = await prisma.vehicle.count({
    where: { brokerId: userId, status: "SOLD", updatedAt: { gte: thirtyDaysAgo } },
  });
  if (recentSales >= 5) unlocked.push("TOP_SELLER");

  // PHOTO_EXPERT: avg 20+ photos
  const photoStats = await prisma.vehicleImage.groupBy({
    by: ["vehicleId"],
    where: { vehicle: { brokerId: userId } },
    _count: { id: true },
  });
  if (photoStats.length >= 3) {
    const avg = photoStats.reduce((s, p) => s + p._count.id, 0) / photoStats.length;
    if (avg >= 20) unlocked.push("PHOTO_EXPERT");
  }

  // PERFECT_RECORD: 10+ approved without rejection in a row
  const recentVehicles = await prisma.vehicle.findMany({
    where: { brokerId: userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { status: true },
  });
  if (recentVehicles.length >= 10) {
    const allApproved = recentVehicles.every(
      (v) => v.status !== "REJECTED" && v.status !== "DRAFT",
    );
    if (allApproved) unlocked.push("PERFECT_RECORD");
  }

  // Upsert badges
  for (const badge of unlocked) {
    await prisma.autoBadge.upsert({
      where: { userId_badge: { userId, badge } },
      create: { userId, badge, context: "BROKER" },
      update: {},
    });
  }

  return unlocked;
}

export async function getUserBadges(
  userId: string,
  context?: string,
): Promise<{ badge: string; context: string; unlockedAt: Date }[]> {
  return prisma.autoBadge.findMany({
    where: { userId, ...(context ? { context } : {}) },
    orderBy: { unlockedAt: "desc" },
    select: { badge: true, context: true, unlockedAt: true },
  });
}
