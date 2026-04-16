import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pageCanonical } from "@/lib/canonical";
import { BASE_URL } from "@/lib/seo-data";
import { ProfileClient, type ProfileData } from "./ProfileClient";

export const revalidate = 300;

const ROLE_LABELS: Record<string, string> = {
  BROKER: "Certifikovaný makléř",
  ADVERTISER: "Inzerent",
  PARTS_SUPPLIER: "Dodavatel dílů",
  WHOLESALE_SUPPLIER: "Velkoobchod",
  PARTNER_VRAKOVISTE: "Vrakoviště",
  BUYER: "Zákazník",
  INVESTOR: "Ověřený investor",
  VERIFIED_DEALER: "Ověřený dealer",
  PARTNER_BAZAR: "Autobazar",
};

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
        profileBadges: {
          select: { badgeKey: true, awardedAt: true },
          orderBy: { awardedAt: "desc" },
        },
        tags: {
          select: { slug: true, label: true },
          orderBy: { label: "asc" },
        },
      },
    });

    if (!user) return null;

    const [vehicleCount, listingCount, partCount, totalLikes] =
      await Promise.all([
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
      ]);

    let roleStats: Record<string, number> = {};

    if (user.role === "VERIFIED_DEALER") {
      const completedFlips = await prisma.flipOpportunity.count({
        where: { dealerId: user.id, status: "COMPLETED" },
      });
      const flips = await prisma.flipOpportunity.findMany({
        where: {
          dealerId: user.id,
          status: "COMPLETED",
          actualSalePrice: { not: null },
        },
        select: {
          purchasePrice: true,
          repairCost: true,
          actualSalePrice: true,
        },
      });
      const avgROI =
        flips.length > 0
          ? flips.reduce((sum, f) => {
              const cost = f.purchasePrice + f.repairCost;
              return (
                sum +
                (cost > 0 ? ((f.actualSalePrice! - cost) / cost) * 100 : 0)
              );
            }, 0) / flips.length
          : 0;
      roleStats = { completedFlips, avgROI: Math.round(avgROI * 10) / 10 };
    }

    if (user.role === "INVESTOR") {
      const investments = await prisma.investment.findMany({
        where: { investorId: user.id },
        select: { amount: true, returnAmount: true, paymentStatus: true },
      });
      const totalInvested = investments
        .filter((i) => i.paymentStatus === "CONFIRMED")
        .reduce((sum, i) => sum + i.amount, 0);
      const completedDeals = investments.filter(
        (i) => i.returnAmount !== null,
      ).length;
      const totalReturn = investments.reduce(
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
        totalSales: user.totalSales,
      },
      roleStats,
      badges: user.profileBadges.map((b) => ({
        badgeKey: b.badgeKey,
        awardedAt: b.awardedAt.toISOString(),
      })),
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
    title: `${fullName} — ${roleLabel} CarMakléř`,
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
  const sameAs = user.socialLinks
    ? Object.values(user.socialLinks).filter(
        (v): v is string => typeof v === "string" && v.length > 0,
      )
    : [];

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: fullName,
    url: `${BASE_URL}/profil/${slug}`,
    jobTitle: roleLabel,
    worksFor: { "@type": "Organization", name: "CarMakléř" },
  };
  if (user.city) {
    jsonLd.address = {
      "@type": "PostalAddress",
      addressLocality: user.city,
      addressCountry: "CZ",
    };
  }
  if (user.avatar) jsonLd.image = user.avatar;
  if (sameAs.length > 0) jsonLd.sameAs = sameAs;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProfileClient initialData={data} slug={slug} />
    </>
  );
}
