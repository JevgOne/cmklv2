import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DealerStats } from "@/components/web/marketplace/DealerStats";
import { OpportunityCard } from "@/components/web/marketplace/OpportunityCard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Dealer Dashboard | Marketplace | CarMakléř",
};

async function getDealerData() {
  try {
    const dbOpps = await prisma.flipOpportunity.findMany({
      where: { status: { not: "CANCELLED" } },
      include: {
        dealer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const opportunities = dbOpps.map((opp) => {
      const photos = opp.photos ? JSON.parse(opp.photos) as string[] : [];
      return {
        id: opp.id,
        brand: opp.brand,
        model: opp.model,
        year: opp.year,
        photoUrl: photos[0] || "",
        purchasePrice: opp.purchasePrice,
        repairCost: opp.repairCost,
        estimatedSalePrice: opp.estimatedSalePrice,
        fundedAmount: opp.fundedAmount,
        neededAmount: opp.purchasePrice + opp.repairCost,
        status: opp.status as "FUNDING" | "APPROVED" | "IN_REPAIR" | "FOR_SALE" | "SOLD" | "PENDING_APPROVAL",
        dealerName: `${opp.dealer.firstName} ${opp.dealer.lastName}`,
      };
    });

    const totalFlips = opportunities.length;
    const activeFlips = opportunities.filter(
      (o) => !["SOLD", "COMPLETED", "CANCELLED"].includes(o.status)
    ).length;
    const soldFlips = opportunities.filter((o) => o.status === "SOLD").length;

    return {
      stats: { totalFlips, activeFlips, soldFlips, averageRoi: 0 },
      opportunities,
    };
  } catch {
    return {
      stats: { totalFlips: 0, activeFlips: 0, soldFlips: 0, averageRoi: 0 },
      opportunities: [],
    };
  }
}

export default async function DealerDashboardPage() {
  const { stats, opportunities } = await getDealerData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-1">
            <Link href="/marketplace" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
              Marketplace
            </Link>
            <span>/</span>
            <span className="text-gray-900">Dealer</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">
            Moje příležitosti
          </h1>
        </div>
        <Link href="/marketplace/dealer/nova" className="no-underline">
          <Button variant="primary">
            + Nová příležitost
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <DealerStats {...stats} />

      {/* Opportunities Grid */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Aktivní flipy</h2>
        {opportunities.length === 0 ? (
          <p className="text-gray-400 text-center py-12">Žádné příležitosti.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                {...opp}
                linkPrefix="/marketplace/dealer"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
