import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortfolioDashboard } from "@/components/web/marketplace/PortfolioDashboard";
import { OpportunityCard } from "@/components/web/marketplace/OpportunityCard";
import { NotificationBell } from "@/components/web/marketplace/NotificationBell";
import { prisma } from "@/lib/prisma";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Investor Dashboard | CarMarketplace",
  alternates: pageCanonical("/marketplace/investor"),
};

export const dynamic = "force-dynamic";

export default async function InvestorDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/prihlaseni?callbackUrl=/marketplace/investor");
  }

  const userId = session.user.id;
  const role = session.user.role;
  const isAdmin = role === "ADMIN" || role === "BACKOFFICE";

  if (role !== "INVESTOR" && !isAdmin) {
    redirect("/marketplace?reason=not_authorized");
  }

  // Fetch all data in parallel
  const [availableOpps, myInvestments] = await Promise.all([
    prisma.flipOpportunity.findMany({
      where: { status: { in: ["FUNDING", "APPROVED"] } },
      include: {
        dealer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.investment.findMany({
      where: isAdmin ? {} : { investorId: userId },
      include: {
        opportunity: {
          include: {
            dealer: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Portfolio calculations
  const confirmed = myInvestments.filter((i) => i.paymentStatus === "CONFIRMED");

  const totalInvested = confirmed.reduce((sum, i) => sum + i.amount, 0);

  // Active investments (not completed/cancelled)
  const activeStatuses = ["FUNDING", "FUNDED", "IN_REPAIR", "FOR_SALE", "SOLD", "PAYOUT_PENDING"];
  const activeInvMap = new Map<string, typeof confirmed[0][]>();
  for (const inv of confirmed) {
    if (activeStatuses.includes(inv.opportunity.status)) {
      const list = activeInvMap.get(inv.opportunityId) || [];
      list.push(inv);
      activeInvMap.set(inv.opportunityId, list);
    }
  }

  const activeInvestments = Array.from(activeInvMap.entries()).map(([oppId, invs]) => {
    const opp = invs[0].opportunity;
    const investedAmount = invs.reduce((s, i) => s + i.amount, 0);
    const totalNeeded = opp.purchasePrice + opp.repairCost;
    const profit = opp.estimatedSalePrice - totalNeeded;
    const carmaklerFee = Math.round(opp.estimatedSalePrice * ((opp.carmaklerFeePct ?? 5) / 100));
    const distributable = Math.max(0, profit - carmaklerFee);
    const investorPct = (opp.agreedInvestorSharePct ?? 50) / 100;
    const expectedProfit = totalNeeded > 0
      ? Math.round(distributable * investorPct * (investedAmount / totalNeeded))
      : 0;

    return {
      id: invs[0].id,
      opportunityId: oppId,
      brand: opp.brand,
      model: opp.model,
      year: opp.year,
      status: opp.status,
      investedAmount,
      expectedProfit,
      repairProgress: opp.repairProgress,
      dealScore: opp.dealScore,
      dealerName: `${opp.dealer.firstName} ${opp.dealer.lastName}`,
      fundingProgress: totalNeeded > 0 ? Math.min(100, Math.round((opp.fundedAmount / totalNeeded) * 100)) : 100,
    };
  });

  // Portfolio value = active invested + expected profits
  const activeValue = activeInvestments.reduce(
    (sum, inv) => sum + inv.investedAmount + Math.max(0, inv.expectedProfit),
    0
  );

  // Completed deals
  const paidOut = myInvestments.filter((i) => i.paidOutAt !== null && i.returnAmount !== null);
  const completedMap = new Map<string, typeof paidOut[0][]>();
  for (const inv of paidOut) {
    const list = completedMap.get(inv.opportunityId) || [];
    list.push(inv);
    completedMap.set(inv.opportunityId, list);
  }

  const completedDeals = Array.from(completedMap.entries()).map(([oppId, invs]) => {
    const opp = invs[0].opportunity;
    const investedAmount = invs.reduce((s, i) => s + i.amount, 0);
    const returnAmount = invs.reduce((s, i) => s + (i.returnAmount || 0), 0);
    const roi = investedAmount > 0
      ? Math.round(((returnAmount - investedAmount) / investedAmount) * 1000) / 10
      : 0;
    return {
      opportunityId: oppId,
      brand: opp.brand,
      model: opp.model,
      investedAmount,
      returnAmount,
      roi,
      completedAt: invs[0].paidOutAt!.toISOString(),
    };
  });

  const realizedProfit = completedDeals.reduce(
    (sum, d) => sum + Math.max(0, d.returnAmount - d.investedAmount),
    0
  );
  const totalOriginal = completedDeals.reduce((sum, d) => sum + d.investedAmount, 0);
  const averageRoi = totalOriginal > 0
    ? Math.round(((realizedProfit) / totalOriginal) * 1000) / 10
    : 0;

  const portfolioValue = activeValue + realizedProfit;

  // Monthly timeline (last 6 months) — simplified: cumulative invested per month
  const now = new Date();
  const monthlyTimeline = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const monthLabel = d.toLocaleDateString("cs-CZ", { month: "short" });

    const investedByMonth = confirmed
      .filter((inv) => inv.createdAt <= monthEnd)
      .reduce((sum, inv) => sum + inv.amount, 0);

    const returnsByMonth = paidOut
      .filter((inv) => inv.paidOutAt && inv.paidOutAt <= monthEnd)
      .reduce((sum, inv) => sum + (inv.returnAmount || 0) - inv.amount, 0);

    return {
      month: monthLabel,
      value: investedByMonth + Math.max(0, returnsByMonth),
    };
  });

  // Map available opportunities for OpportunityCard
  const availableCards = availableOpps.map((opp) => {
    const photos = opp.photos ? (JSON.parse(opp.photos) as string[]) : [];
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
      status: opp.status as "FUNDING" | "APPROVED",
      dealerName: `${opp.dealer.firstName} ${opp.dealer.lastName}`,
      dealScore: opp.dealScore,
      dealerRating: opp.dealerRating ?? null,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-1">
          <Link href="/marketplace" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
            CarMarketplace
          </Link>
          <span>/</span>
          <span className="text-gray-900">Portfolio</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-extrabold text-gray-900">
            Investiční portfolio
          </h1>
          <NotificationBell />
        </div>
      </div>

      {/* Portfolio Dashboard */}
      <PortfolioDashboard
        totalInvested={totalInvested}
        portfolioValue={portfolioValue}
        realizedProfit={realizedProfit}
        averageRoi={averageRoi}
        activeInvestments={activeInvestments}
        completedDeals={completedDeals}
        monthlyTimeline={monthlyTimeline}
      />

      {/* Available opportunities */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Dostupné příležitosti</h2>
        {availableCards.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Žádné dostupné příležitosti.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {availableCards.map((opp) => (
              <OpportunityCard key={opp.id} {...opp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
