import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DealerStatsCards } from "@/components/web/dealer/DealerStatsCards";
import { DealerFunnel } from "@/components/web/dealer/DealerFunnel";
import { TopVehiclesChart } from "@/components/web/dealer/TopVehiclesChart";
import type { Metadata } from "next";


export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Statistiky — Dealer CRM",
  robots: { index: false, follow: false },
};

export default async function StatistikyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const listingFilter = { listing: { userId } };

  const [
    activeListings,
    totalInquiries,
    repliedInquiries,
    soldCount,
    viewingCount,
    repliedWithTime,
    topVehiclesRaw,
  ] = await Promise.all([
    prisma.listing.count({ where: { userId, status: "ACTIVE" } }),
    prisma.inquiry.count({ where: listingFilter }),
    prisma.inquiry.count({ where: { ...listingFilter, status: { notIn: ["NEW", "READ"] } } }),
    prisma.inquiry.count({ where: { ...listingFilter, status: "SOLD", updatedAt: { gte: monthStart } } }),
    prisma.inquiry.count({ where: { ...listingFilter, viewingDate: { not: null } } }),
    prisma.inquiry.findMany({
      where: { ...listingFilter, repliedAt: { not: null } },
      select: { createdAt: true, repliedAt: true },
    }),
    prisma.inquiry.findMany({
      where: listingFilter,
      select: { listing: { select: { brand: true, model: true, year: true } } },
    }),
  ]);

  const responseRate = totalInquiries > 0 ? Math.round((repliedInquiries / totalInquiries) * 100) : 0;

  let avgResponseTime = 0;
  if (repliedWithTime.length > 0) {
    const totalMs = repliedWithTime.reduce((sum, inq) => {
      return sum + (inq.repliedAt!.getTime() - inq.createdAt.getTime());
    }, 0);
    avgResponseTime = Math.round((totalMs / repliedWithTime.length / 3600000) * 10) / 10;
  }

  // Top vehicles
  const vehicleCounts = new Map<string, { brand: string; model: string; year: number; count: number }>();
  for (const inq of topVehiclesRaw) {
    const key = `${inq.listing.brand}-${inq.listing.model}-${inq.listing.year}`;
    const existing = vehicleCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      vehicleCounts.set(key, { brand: inq.listing.brand, model: inq.listing.model, year: inq.listing.year, count: 1 });
    }
  }
  const topVehicles = [...vehicleCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  const funnel = { total: totalInquiries, replied: repliedInquiries, viewing: viewingCount, sold: soldCount };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Statistiky inzerce</h2>

      <DealerStatsCards stats={{ activeListings, totalInquiries, soldCount, responseRate }} />

      {/* Avg response time */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-2">Průměrná doba odpovědi</h3>
        <div className="text-2xl font-bold text-orange-600">
          {avgResponseTime > 0 ? `${avgResponseTime} h` : "—"}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {repliedWithTime.length > 0
            ? `Na základě ${repliedWithTime.length} odpovědí`
            : "Zatím žádné odpovědi"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DealerFunnel funnel={funnel} />
        <TopVehiclesChart vehicles={topVehicles} />
      </div>
    </div>
  );
}
