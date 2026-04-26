import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pageCanonical } from "@/lib/canonical";
import { BASE_URL } from "@/lib/seo-data";
import { generatePersonJsonLd } from "@/lib/seo";
import { ROLE_LABELS } from "@/lib/role-labels";
import { getSkillTagCounts } from "@/lib/reputation/skill-tags";
import { ProfileClient, type ProfileData } from "./ProfileClient";

export const revalidate = 300;

const getProfileData = cache(
  async (slug: string): Promise<ProfileData | null> => {
    const user = await prisma.user.findFirst({
      where: { slug, status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        city: true,
        slug: true,
        role: true,
        level: true,
        totalSales: true,
        totalRevenue: true,
        region: { select: { tier: true } },
        profileViews: true,
        favoriteBrands: true,
        showPhone: true,
        showEmail: true,
        phone: true,
        email: true,
        createdAt: true,
        yearsExperience: true,
        website: true,
        motto: true,
        socialLinks: true,
        services: true,
        languageSkills: true,
        specializations: true,
        warehouseAddress: true,
        openingHours: true,
        tags: {
          select: { slug: true, label: true },
          orderBy: { label: "asc" },
        },
      },
    });

    if (!user) return null;

    const isDealer = user.role === "VERIFIED_DEALER";
    const isInvestor = user.role === "INVESTOR";

    const [
      vehicleCount,
      listingCount,
      partCount,
      totalLikes,
      vehicleSoldCount,
      listingSoldCount,
      dealerFlips,
      investorInvestments,
    ] = await Promise.all([
      prisma.vehicle.count({
        where: { brokerId: user.id, status: "ACTIVE" },
      }),
      prisma.listing.count({
        where: { userId: user.id, status: "ACTIVE" },
      }),
      prisma.part.count({
        where: { supplierId: user.id, status: "ACTIVE" },
      }),
      prisma.profileLike.count({
        where: {
          OR: [
            { vehicle: { brokerId: user.id } },
            { listing: { userId: user.id } },
            { part: { supplierId: user.id } },
          ],
        },
      }),
      prisma.vehicle.count({
        where: { brokerId: user.id, status: "SOLD" },
      }),
      prisma.listing.count({
        where: { userId: user.id, status: "SOLD" },
      }),
      isDealer
        ? prisma.flipOpportunity.findMany({
            where: { dealerId: user.id, status: "COMPLETED" },
            select: {
              purchasePrice: true,
              repairCost: true,
              actualSalePrice: true,
            },
          })
        : Promise.resolve([]),
      isInvestor
        ? prisma.investment.findMany({
            where: { investorId: user.id },
            select: { amount: true, returnAmount: true, paymentStatus: true },
          })
        : Promise.resolve([]),
    ]);

    // Reputation data
    const contextMap: Record<string, string> = {
      BROKER: "BROKER", MANAGER: "BROKER", REGIONAL_DIRECTOR: "BROKER",
      PARTS_SUPPLIER: "SUPPLIER", VERIFIED_DEALER: "DEALER",
      INVESTOR: "INVESTOR", ADVERTISER: "SELLER",
    };
    const reputationContext = contextMap[user.role] ?? "BROKER";

    const [trustScore, autoBadges, skillTags] = await Promise.all([
      prisma.trustScore.findUnique({ where: { userId: user.id } }),
      prisma.autoBadge.findMany({
        where: { userId: user.id },
        orderBy: { unlockedAt: "desc" },
        select: { badge: true, context: true, unlockedAt: true },
      }),
      getSkillTagCounts(user.id, reputationContext),
    ]);

    // Authoritative sold count z DB (real-time), fallback na user.totalSales
    // pokud oba dotazy 0 a gamifikace držela hodnotu.
    const authoritativeSold = vehicleSoldCount + listingSoldCount;
    const soldCount =
      authoritativeSold > 0 ? authoritativeSold : user.totalSales;

    let roleStats: Record<string, number> = {};

    if (isDealer) {
      const completedFlips = dealerFlips.length;
      const flipsWithSale = dealerFlips.filter((f) => f.actualSalePrice !== null);
      const avgROI =
        flipsWithSale.length > 0
          ? flipsWithSale.reduce((sum, f) => {
              const cost = f.purchasePrice + f.repairCost;
              return (
                sum +
                (cost > 0 ? ((f.actualSalePrice! - cost) / cost) * 100 : 0)
              );
            }, 0) / flipsWithSale.length
          : 0;
      roleStats = { completedFlips, avgROI: Math.round(avgROI * 10) / 10 };
    }

    if (isInvestor) {
      const totalInvested = investorInvestments
        .filter((i) => i.paymentStatus === "CONFIRMED")
        .reduce((sum, i) => sum + i.amount, 0);
      const completedDeals = investorInvestments.filter(
        (i) => i.returnAmount !== null,
      ).length;
      const totalReturn = investorInvestments.reduce(
        (sum, i) => sum + (i.returnAmount ?? 0),
        0,
      );
      roleStats = { totalInvested, completedDeals, totalReturn };
    }

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        city: user.city,
        slug: user.slug ?? slug,
        role: user.role,
        level: user.level,
        totalSales: user.totalSales,
        totalRevenue: user.totalRevenue,
        regionTier: (user.region?.tier as string) ?? "SMALL",
        profileViews: user.profileViews,
        favoriteBrands: user.favoriteBrands,
        phone: user.showPhone ? user.phone : null,
        email: user.showEmail ? user.email : null,
        createdAt: user.createdAt.toISOString(),
        yearsExperience: user.yearsExperience,
        website: user.website,
        motto: user.motto,
        socialLinks: user.socialLinks as ProfileData["user"]["socialLinks"],
        services: user.services as string[] | null,
        languageSkills: user.languageSkills as string[] | null,
        specializations: user.specializations,
        warehouseAddress: user.warehouseAddress,
        openingHours: user.openingHours as Record<string, string> | null,
        tags: user.tags,
      },
      stats: {
        vehicles: vehicleCount,
        listings: listingCount,
        parts: partCount,
        totalLikes,
        totalSales: soldCount,
      },
      roleStats,
      reputation: trustScore
        ? {
            score: trustScore.score,
            tier: trustScore.tier,
            avgResponseMinutes: trustScore.avgResponseMinutes,
            responseRate: trustScore.responseRate,
            lastActiveAt: trustScore.lastActiveAt?.toISOString() ?? null,
            badges: autoBadges.map((b) => ({
              badge: b.badge,
              context: b.context,
              unlockedAt: b.unlockedAt.toISOString(),
            })),
            skillTags,
            context: reputationContext,
          }
        : {
            score: 0,
            tier: "NEW",
            avgResponseMinutes: null,
            responseRate: null,
            lastActiveAt: null,
            badges: autoBadges.map((b) => ({
              badge: b.badge,
              context: b.context,
              unlockedAt: b.unlockedAt.toISOString(),
            })),
            skillTags,
            context: reputationContext,
          },
    };
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProfileData(slug);

  if (!data) {
    return {
      title: "Profil nenalezen — CarMakléř",
      alternates: pageCanonical(`/profil/${slug}`),
      robots: { index: false, follow: false },
    };
  }

  const { user } = data;
  const roleLabel = ROLE_LABELS[user.role] ?? "Profil";
  const fullName = `${user.firstName} ${user.lastName}`;
  const description =
    user.bio?.slice(0, 155) ||
    `Profil ${roleLabel.toLowerCase()} ${fullName}${user.city ? " z " + user.city : ""}. Aktivní vozidla, recenze a kontakt.`;

  return {
    title: `${fullName} — ${roleLabel}`,
    description,
    alternates: pageCanonical(`/profil/${slug}`),
    openGraph: {
      title: `${fullName} — CarMakléř`,
      description,
      url: `${BASE_URL}/profil/${slug}`,
      images: user.avatar ? [{ url: user.avatar }] : undefined,
      type: "profile",
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getProfileData(slug);

  if (!data) notFound();

  const { user } = data;
  const fullName = `${user.firstName} ${user.lastName}`;
  const roleLabel = ROLE_LABELS[user.role] ?? "Profil";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generatePersonJsonLd({
            name: fullName,
            url: `${BASE_URL}/profil/${slug}`,
            image: user.avatar || undefined,
            jobTitle: roleLabel,
            address: user.city || undefined,
          }),
        }}
      />
      <ProfileClient initialData={data} slug={slug} />
    </>
  );
}
