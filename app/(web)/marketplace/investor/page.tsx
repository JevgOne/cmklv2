import type { Metadata } from "next";
import Link from "next/link";
import { InvestorPortfolio } from "@/components/web/marketplace/InvestorPortfolio";
import { OpportunityCard } from "@/components/web/marketplace/OpportunityCard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Investor Dashboard | Marketplace | CarMakléř",
};

async function getOpportunities() {
  try {
    const dbOpps = await prisma.flipOpportunity.findMany({
      where: { status: { not: "CANCELLED" } },
      include: {
        dealer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return dbOpps.map((opp) => {
      const photos = opp.photos ? JSON.parse(opp.photos) as string[] : [];
      const neededAmount = opp.purchasePrice + opp.repairCost;
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
        neededAmount,
        status: opp.status as "FUNDING" | "APPROVED" | "IN_REPAIR" | "FOR_SALE" | "SOLD",
        dealerName: `${opp.dealer.firstName} ${opp.dealer.lastName}`,
      };
    });
  } catch {
    return [];
  }
}

export default async function InvestorDashboardPage() {
  const opportunities = await getOpportunities();

  const portfolio = {
    totalInvested: opportunities.reduce((sum, o) => sum + o.fundedAmount, 0),
    activeInvestments: opportunities.filter(
      (o) => !["SOLD", "COMPLETED", "PENDING_APPROVAL", "CANCELLED"].includes(o.status)
    ).length,
    totalReturns: 0,
    averageRoi: 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-1">
          <Link href="/marketplace" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
            Marketplace
          </Link>
          <span>/</span>
          <span className="text-gray-900">Investor</span>
        </div>
        <h1 className="text-[28px] font-extrabold text-gray-900">
          Investiční přehled
        </h1>
      </div>

      {/* Portfolio Stats */}
      <InvestorPortfolio {...portfolio} />

      {/* Available opportunities */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Dostupné příležitosti</h2>
        {opportunities.filter((o) => o.status === "FUNDING" || o.status === "APPROVED").length === 0 ? (
          <p className="text-gray-400 text-center py-12">Žádné dostupné příležitosti.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {opportunities
              .filter((o) => o.status === "FUNDING" || o.status === "APPROVED")
              .map((opp) => (
                <OpportunityCard key={opp.id} {...opp} />
              ))}
          </div>
        )}
      </div>

      {/* Active investments */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Aktivní investice</h2>
        {opportunities.filter((o) => o.status !== "FUNDING" && o.status !== "APPROVED").length === 0 ? (
          <p className="text-gray-400 text-center py-12">Žádné aktivní investice.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {opportunities
              .filter((o) => o.status !== "FUNDING" && o.status !== "APPROVED")
              .map((opp) => (
                <OpportunityCard key={opp.id} {...opp} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
