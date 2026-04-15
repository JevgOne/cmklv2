import { prisma } from "@/lib/prisma";

export const BADGE_CATALOG: Record<string, { name: string; icon: string; description: string }> = {
  FIRST_SALE:     { name: "První prodej",           icon: "🎯", description: "Uskutečnil(a) první prodej" },
  FIVE_SALES:     { name: "5 prodejů",              icon: "⭐", description: "5 úspěšných prodejů" },
  TEN_SALES:      { name: "10 prodejů",             icon: "🏅", description: "10 úspěšných prodejů" },
  FIFTY_SALES:    { name: "50 prodejů",             icon: "🏆", description: "50 úspěšných prodejů" },
  PHOTO_PRO:      { name: "Foto profesionál",       icon: "📸", description: "10+ fotek na jedné položce" },
  FAST_RESPONDER: { name: "Rychlá reakce",          icon: "⚡", description: "Odpovídá do 1 hodiny" },
  TOP_RATED:      { name: "Nejlépe hodnocený",      icon: "🌟", description: "Hodnocení 4.5+ (min 5 recenzí)" },
  VERIFIED:       { name: "Ověřený",                icon: "✅", description: "Dokončený onboarding" },
  POPULAR:        { name: "Populární",              icon: "🔥", description: "50+ lajků celkem" },
  COMMUNITY:      { name: "Aktivní komunita",       icon: "💬", description: "20+ napsaných komentářů" },
  EARLY_ADOPTER:  { name: "Průkopník",              icon: "🌱", description: "Mezi prvními uživateli" },
};

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totalSales: true,
      onboardingCompleted: true,
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

  if (newBadges.length > 0) {
    await prisma.profileBadge.createMany({
      data: newBadges.map((key) => ({ userId, badgeKey: key })),
      skipDuplicates: true,
    });
  }

  return newBadges;
}
