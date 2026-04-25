import { prisma } from "@/lib/prisma";

// Badge definitions per context
export const BADGE_CATALOG = {
  BROKER: [
    { badge: "FAST_RESPONDER", emoji: "⚡", label: "Rychlá odpověď", desc: "Průměrná odpověď do 1 hodiny" },
    { badge: "TOP_SELLER", emoji: "🏆", label: "Top prodejce", desc: "5+ prodejů za měsíc" },
    { badge: "PHOTO_EXPERT", emoji: "📸", label: "Foto expert", desc: "Průměrně 20+ fotek na vozidlo" },
    { badge: "VETERAN", emoji: "🏅", label: "Veterán", desc: "12+ měsíců na platformě" },
    { badge: "PERFECT_RECORD", emoji: "✨", label: "Bezchybný", desc: "10+ schválení bez zamítnutí" },
    { badge: "RESPONSE_KING", emoji: "💬", label: "Komunikátor", desc: "95%+ odpovědnost" },
  ],
  SUPPLIER: [
    { badge: "ZERO_DEFECT", emoji: "✅", label: "Bez reklamací", desc: "0 reklamací za 90 dní" },
    { badge: "EXPRESS_SHIPPER", emoji: "🚀", label: "Express", desc: "Odeslání do 24h" },
    { badge: "TOP_RATED", emoji: "⭐", label: "Nejlépe hodnocený", desc: "Hodnocení 4.5+" },
    { badge: "BIG_CATALOG", emoji: "📦", label: "Velký sklad", desc: "200+ aktivních dílů" },
    { badge: "RELIABLE", emoji: "🏅", label: "Spolehlivý", desc: "50+ dokončených objednávek" },
  ],
  DEALER: [
    { badge: "PROVEN_DEALER", emoji: "🏆", label: "Ověřený dealer", desc: "5+ dokončených dealů" },
    { badge: "HIGH_ROI", emoji: "📈", label: "Vysoké ROI", desc: "Průměrné ROI 20%+" },
    { badge: "ACCURATE_ESTIMATOR", emoji: "🎯", label: "Přesný odhad", desc: "90%+ přesnost odhadů" },
    { badge: "FAST_FLIPPER", emoji: "⚡", label: "Rychlý flip", desc: "Uzavření do 60 dní" },
  ],
  INVESTOR: [
    { badge: "ACTIVE_INVESTOR", emoji: "💰", label: "Aktivní investor", desc: "5+ investic" },
    { badge: "BIG_PORTFOLIO", emoji: "🏦", label: "Velké portfolio", desc: "Investice 2M+ Kč" },
    { badge: "RELIABLE_PAYER", emoji: "✅", label: "Spolehlivý plátce", desc: "100% potvrzených plateb" },
  ],
  SELLER: [
    { badge: "QUICK_RESPONDER", emoji: "⚡", label: "Rychlá odpověď", desc: "Odpověď do 2h" },
    { badge: "EXPERIENCED_SELLER", emoji: "🏅", label: "Zkušený prodejce", desc: "5+ prodaných inzerátů" },
    { badge: "CLEAN_RECORD", emoji: "✅", label: "Čistý záznam", desc: "0 nahlášených inzerátů" },
    { badge: "PHOTO_PRO", emoji: "📸", label: "Foto profík", desc: "15+ fotek na inzerát" },
  ],
} as const;

export type BadgeContext = keyof typeof BADGE_CATALOG;

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
