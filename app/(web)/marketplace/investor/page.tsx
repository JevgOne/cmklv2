import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { InvestorPortfolio } from "@/components/web/marketplace/InvestorPortfolio";
import { OpportunityCard } from "@/components/web/marketplace/OpportunityCard";
import { prisma } from "@/lib/prisma";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Investor Dashboard | Marketplace",
  alternates: pageCanonical("/marketplace/investor"),
};

function mapOpportunity(opp: {
  id: string;
  brand: string;
  model: string;
  year: number;
  photos: string | null;
  purchasePrice: number;
  repairCost: number;
  estimatedSalePrice: number;
  fundedAmount: number;
  status: string;
  dealer: { firstName: string; lastName: string };
}) {
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
    status: opp.status as "FUNDING" | "APPROVED" | "IN_REPAIR" | "FOR_SALE" | "SOLD",
    dealerName: `${opp.dealer.firstName} ${opp.dealer.lastName}`,
  };
}

export default async function InvestorDashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role && ["ADMIN", "BACKOFFICE"].includes(session.user.role);

  // Available opportunities (FUNDING/APPROVED) — visible to all investors
  let availableOpps: ReturnType<typeof mapOpportunity>[] = [];
  // Opportunities where this investor has invested
  let investedOpps: ReturnType<typeof mapOpportunity>[] = [];

  let portfolio = {
    totalInvested: 0,
    activeInvestments: 0,
    totalReturns: 0,
    averageRoi: 0,
  };

  try {
    const [dbAvailable, myInvestments] = await Promise.all([
      prisma.flipOpportunity.findMany({
        where: { status: { in: ["FUNDING", "APPROVED"] } },
        include: { dealer: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      }),
      userId && !isAdmin
        ? prisma.investment.findMany({
            where: { investorId: userId },
            include: {
              opportunity: {
                include: { dealer: { select: { firstName: true, lastName: true } } },
              },
            },
          })
        : isAdmin
          ? prisma.investment.findMany({
              include: {
                opportunity: {
                  include: { dealer: { select: { firstName: true, lastName: true } } },
                },
              },
            })
          : Promise.resolve([]),
    ]);

    availableOpps = dbAvailable.map(mapOpportunity);

    // Deduplicate invested opportunities
    const investedOppMap = new Map<string, typeof dbAvailable[0]>();
    for (const inv of myInvestments) {
      if (!investedOppMap.has(inv.opportunityId)) {
        investedOppMap.set(inv.opportunityId, inv.opportunity);
      }
    }
    investedOpps = Array.from(investedOppMap.values()).map(mapOpportunity);

    // Portfolio stats from own investments
    const confirmedInvestments = myInvestments.filter((i) => i.paymentStatus === "CONFIRMED");
    const totalInvested = confirmedInvestments.reduce((sum, i) => sum + i.amount, 0);
    const activeInvestments = confirmedInvestments.filter(
      (i) => !["SOLD", "COMPLETED", "CANCELLED"].includes(i.opportunity.status)
    ).length;
    const paidOut = myInvestments.filter((i) => i.paidOutAt !== null);
    const totalReturns = paidOut.reduce((sum, i) => sum + (i.returnAmount || 0), 0);
    const totalOriginal = paidOut.reduce((sum, i) => sum + i.amount, 0);
    const averageRoi = totalOriginal > 0 ? ((totalReturns - totalOriginal) / totalOriginal) * 100 : 0;

    portfolio = {
      totalInvested,
      activeInvestments,
      totalReturns,
      averageRoi: Math.round(averageRoi * 10) / 10,
    };
  } catch {
    // fallback — empty state
  }

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
        {availableOpps.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Žádné dostupné příležitosti.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {availableOpps.map((opp) => (
              <OpportunityCard key={opp.id} {...opp} />
            ))}
          </div>
        )}
      </div>

      {/* Active investments */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Moje investice</h2>
        {investedOpps.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Zatím nemáte žádné investice.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {investedOpps.map((opp) => (
              <OpportunityCard key={opp.id} {...opp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
