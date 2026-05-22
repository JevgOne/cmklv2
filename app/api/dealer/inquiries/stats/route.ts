import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const listingFilter = { listing: { userId } };

    const [
      activeListings,
      totalInquiries,
      monthlyInquiries,
      newUnread,
      repliedInquiries,
      viewingsScheduled,
      soldCount,
      topVehiclesRaw,
    ] = await Promise.all([
      prisma.listing.count({ where: { userId, status: "ACTIVE" } }),
      prisma.inquiry.count({ where: listingFilter }),
      prisma.inquiry.count({ where: { ...listingFilter, createdAt: { gte: monthStart } } }),
      prisma.inquiry.count({ where: { ...listingFilter, status: "NEW" } }),
      prisma.inquiry.count({ where: { ...listingFilter, status: { notIn: ["NEW", "READ"] } } }),
      prisma.inquiry.count({ where: { ...listingFilter, status: "VIEWING", viewingDate: { gte: now } } }),
      prisma.inquiry.count({ where: { ...listingFilter, status: "SOLD", updatedAt: { gte: monthStart } } }),
      prisma.inquiry.findMany({
        where: listingFilter,
        select: {
          listing: { select: { brand: true, model: true, year: true } },
        },
      }),
    ]);

    // Calculate response rate
    const responseRate = totalInquiries > 0 ? Math.round((repliedInquiries / totalInquiries) * 100) : 0;

    // Calculate avg response time
    const repliedWithTime = await prisma.inquiry.findMany({
      where: { ...listingFilter, repliedAt: { not: null } },
      select: { createdAt: true, repliedAt: true },
    });

    let avgResponseTime = 0;
    if (repliedWithTime.length > 0) {
      const totalMs = repliedWithTime.reduce((sum, inq) => {
        return sum + (inq.repliedAt!.getTime() - inq.createdAt.getTime());
      }, 0);
      avgResponseTime = Math.round((totalMs / repliedWithTime.length / 3600000) * 10) / 10;
    }

    // Top 5 vehicles by inquiry count
    const vehicleCounts = new Map<string, { brand: string; model: string; year: number; count: number }>();
    for (const inq of topVehiclesRaw) {
      const key = `${inq.listing.brand}-${inq.listing.model}-${inq.listing.year}`;
      const existing = vehicleCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        vehicleCounts.set(key, {
          brand: inq.listing.brand,
          model: inq.listing.model,
          year: inq.listing.year,
          count: 1,
        });
      }
    }
    const topVehicles = [...vehicleCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Funnel
    const viewingCount = await prisma.inquiry.count({
      where: { ...listingFilter, viewingDate: { not: null } },
    });

    return NextResponse.json({
      activeListings,
      totalInquiries,
      monthlyInquiries,
      newUnread,
      repliedCount: repliedInquiries,
      viewingsScheduled,
      soldCount,
      responseRate,
      avgResponseTime,
      topVehicles,
      funnel: {
        total: totalInquiries,
        replied: repliedInquiries,
        viewing: viewingCount,
        sold: soldCount,
      },
    });
  } catch (error) {
    console.error("GET /api/dealer/inquiries/stats error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
