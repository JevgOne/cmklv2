import { prisma } from "@/lib/prisma";
export { BADGE_CATALOG } from "@/lib/badge-catalog";

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totalSales: true,
      onboardingCompleted: true,
      createdAt: true,
      profileBadges: { select: { badgeKey: true } },
    },
  });

  if (!user) return [];

  const existingKeys = new Set(user.profileBadges.map((b) => b.badgeKey));
  const newBadges: string[] = [];

  // Sales badges
  if (user.totalSales >= 1 && !existingKeys.has("FIRST_SALE")) newBadges.push("FIRST_SALE");
  if (user.totalSales >= 5 && !existingKeys.has("FIVE_SALES")) newBadges.push("FIVE_SALES");
  if (user.totalSales >= 10 && !existingKeys.has("TEN_SALES")) newBadges.push("TEN_SALES");
  if (user.totalSales >= 50 && !existingKeys.has("FIFTY_SALES")) newBadges.push("FIFTY_SALES");

  // Verified badge
  if (user.onboardingCompleted && !existingKeys.has("VERIFIED")) newBadges.push("VERIFIED");

  // Early adopter — registered before launch (2026-05-01)
  if (!existingKeys.has("EARLY_ADOPTER")) {
    if (user.createdAt < new Date("2026-05-01")) newBadges.push("EARLY_ADOPTER");
  }

  // Popular badge (50+ likes received)
  if (!existingKeys.has("POPULAR")) {
    const totalLikes = await prisma.profileLike.count({
      where: {
        OR: [
          { vehicle: { brokerId: userId } },
          { listing: { userId } },
          { part: { supplierId: userId } },
        ],
      },
    });
    if (totalLikes >= 50) newBadges.push("POPULAR");
  }

  // Community badge (20+ comments written)
  if (!existingKeys.has("COMMUNITY")) {
    const totalComments = await prisma.profileComment.count({
      where: { userId },
    });
    if (totalComments >= 20) newBadges.push("COMMUNITY");
  }

  // Photo Pro — 10+ photos on a single vehicle or part
  if (!existingKeys.has("PHOTO_PRO")) {
    const [vehicleMax, partMax] = await Promise.all([
      prisma.vehicleImage.groupBy({
        by: ["vehicleId"],
        where: { vehicle: { brokerId: userId } },
        _count: true,
        orderBy: { _count: { vehicleId: "desc" } },
        take: 1,
      }),
      prisma.partImage.groupBy({
        by: ["partId"],
        where: { part: { supplierId: userId } },
        _count: true,
        orderBy: { _count: { partId: "desc" } },
        take: 1,
      }),
    ]);
    const maxPhotos = Math.max(
      vehicleMax[0]?._count ?? 0,
      partMax[0]?._count ?? 0,
    );
    if (maxPhotos >= 10) newBadges.push("PHOTO_PRO");
  }

  // Top Rated — average supplier review rating >= 4.5 with min 5 reviews
  if (!existingKeys.has("TOP_RATED")) {
    const reviewAgg = await prisma.supplierReview.aggregate({
      where: { supplierId: userId, isPublic: true },
      _avg: { rating: true },
      _count: true,
    });
    if (reviewAgg._count >= 5 && (reviewAgg._avg.rating ?? 0) >= 4.5) {
      newBadges.push("TOP_RATED");
    }
  }

  // Fast Responder — average inquiry response time < 1 hour
  // Uses Inquiry model repliedAt vs createdAt for the user's listings
  if (!existingKeys.has("FAST_RESPONDER")) {
    const inquiries = await prisma.inquiry.findMany({
      where: {
        listing: { userId },
        repliedAt: { not: null },
      },
      select: { createdAt: true, repliedAt: true },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    if (inquiries.length >= 5) {
      const avgMs = inquiries.reduce((sum, inq) => {
        const diff = new Date(inq.repliedAt!).getTime() - new Date(inq.createdAt).getTime();
        return sum + Math.max(0, diff);
      }, 0) / inquiries.length;
      if (avgMs < 60 * 60 * 1000) newBadges.push("FAST_RESPONDER");
    }
  }

  if (newBadges.length > 0) {
    await prisma.profileBadge.createMany({
      data: newBadges.map((key) => ({ userId, badgeKey: key })),
      skipDuplicates: true,
    });
  }

  // Auto level-up check
  await checkAndUpdateLevel(userId);

  return newBadges;
}

export async function checkAndUpdateLevel(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalRevenue: true, level: true, region: { select: { tier: true } } },
  });

  if (!user) return null;

  // Level is now determined by totalRevenue + region tier (star system)
  const { calculateStarLevel } = await import("./broker-points");
  const regionTier = (user.region?.tier ?? "SMALL") as import("./broker-points").RegionTier;
  const starLevel = calculateStarLevel(user.totalRevenue, regionTier);

  if (starLevel.key !== user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: starLevel.key },
    });
    return starLevel.key;
  }

  return null;
}
