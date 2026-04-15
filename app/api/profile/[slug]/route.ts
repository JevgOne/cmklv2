import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

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
        profileBadges: {
          select: { badgeKey: true, awardedAt: true },
          orderBy: { awardedAt: "desc" },
        },
        achievements: {
          select: { achievementKey: true, unlockedAt: true },
          orderBy: { unlockedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Profil nenalezen" }, { status: 404 });
    }

    // Increment profileViews (only if viewer !== owner)
    if (!session?.user?.id || session.user.id !== user.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { profileViews: { increment: 1 } },
      });
    }

    // Stats — real data from DB
    const [vehicleCount, listingCount, partCount, totalLikes] = await Promise.all([
      prisma.vehicle.count({ where: { brokerId: user.id, status: "ACTIVE" } }),
      prisma.listing.count({ where: { userId: user.id, status: "ACTIVE" } }),
      prisma.part.count({ where: { supplierId: user.id, status: "ACTIVE" } }),
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

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        city: user.city,
        slug: user.slug,
        role: user.role,
        level: user.level,
        totalSales: user.totalSales,
        profileViews: user.profileViews,
        favoriteBrands: user.favoriteBrands,
        phone: user.showPhone ? user.phone : null,
        email: user.showEmail ? user.email : null,
        createdAt: user.createdAt,
      },
      stats: {
        vehicles: vehicleCount,
        listings: listingCount,
        parts: partCount,
        totalLikes,
        totalSales: user.totalSales,
      },
      badges: user.profileBadges,
      achievements: user.achievements,
    });
  } catch (error) {
    console.error("GET /api/profile/[slug] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
