import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { FlipManagement } from "@/components/admin/marketplace/FlipManagement";
import { PaymentConfirmation } from "@/components/admin/marketplace/PaymentConfirmation";

// Admin pages call Prisma at top of server component — force dynamic
// rendering aby Next.js neskoušel prerender v build time bez DB.
export const dynamic = "force-dynamic";

export default async function AdminMarketplacePage() {
  // Real stats from DB
  const [totalFlips, activeFlips, pendingApprovalCount, pendingInvestments, allFlipsRaw, newApplicationsCount] =
    await Promise.all([
      prisma.flipOpportunity.count(),
      prisma.flipOpportunity.count({
        where: {
          status: {
            in: ["APPROVED", "FUNDING", "FUNDED", "IN_REPAIR", "FOR_SALE"],
          },
        },
      }),
      prisma.flipOpportunity.count({
        where: { status: "PENDING_APPROVAL" },
      }),
      prisma.investment.findMany({
        where: { paymentStatus: "PENDING" },
        include: {
          investor: { select: { firstName: true, lastName: true } },
          opportunity: { select: { brand: true, model: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.flipOpportunity.findMany({
        include: {
          dealer: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.marketplaceApplication.count({ where: { status: "NEW" } }),
    ]);

  // Compute total volume
  const volumeAgg = await prisma.flipOpportunity.aggregate({
    _sum: { purchasePrice: true, repairCost: true },
  });
  const totalVolume =
    (volumeAgg._sum.purchasePrice ?? 0) + (volumeAgg._sum.repairCost ?? 0);

  // Map pending payments for PaymentConfirmation
  const pendingPayments = pendingInvestments.map((inv) => ({
    id: inv.id,
    investorName: `${inv.investor.firstName} ${inv.investor.lastName}`,
    amount: inv.amount,
    opportunityLabel: `${inv.opportunity.brand} ${inv.opportunity.model}`,
    variableSymbol: inv.paymentReference || `MP${inv.id.slice(0, 8).toUpperCase()}`,
    createdAt: inv.createdAt.toISOString().split("T")[0],
  }));

  // Map flips
  const mapFlip = (f: typeof allFlipsRaw[number]) => ({
    id: f.id,
    brand: f.brand,
    model: f.model,
    year: f.year,
    status: f.status,
    purchasePrice: f.purchasePrice,
    repairCost: f.repairCost,
    estimatedSalePrice: f.estimatedSalePrice,
    dealerName: `${f.dealer.firstName} ${f.dealer.lastName}`,
    createdAt: f.createdAt.toISOString().split("T")[0],
  });

  const pendingFlips = allFlipsRaw
    .filter((f) => f.status === "PENDING_APPROVAL")
    .map(mapFlip);

  const allFlips = allFlipsRaw.map(mapFlip);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <span>Admin</span>
          <span>/</span>
          <span className="text-gray-900">Marketplace</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-extrabold text-gray-900">
            Marketplace
          </h1>
          <Link
            href="/marketplace"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-500 hover:text-orange-600 no-underline transition-colors"
          >
            Otevřít web
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Applications link */}
      <Link
        href="/admin/marketplace/applications"
        className="flex items-center gap-3 mb-6 px-5 py-4 bg-orange-50 border border-orange-200 rounded-2xl no-underline hover:bg-orange-100 transition-colors"
      >
        <span className="text-lg">📋</span>
        <span className="text-sm font-bold text-gray-900">Žádosti o přístup</span>
        {newApplicationsCount > 0 && (
          <Badge variant="rejected">{newApplicationsCount} nových</Badge>
        )}
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon="🔄"
          iconColor="orange"
          value={totalFlips.toString()}
          label="Celkem flipu"
        />
        <StatCard
          icon="⚡"
          iconColor="blue"
          value={activeFlips.toString()}
          label="Aktivnich"
        />
        <StatCard
          icon="⏳"
          iconColor="red"
          value={pendingApprovalCount.toString()}
          label="Ke schvaleni"
        />
        <StatCard
          icon="💰"
          iconColor="green"
          value={totalVolume > 0 ? `${(totalVolume / 1000000).toFixed(1)}M` : "0"}
          label="Celkovy objem"
        />
      </div>

      {/* Pending Payments */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Cekajici platby
          </h2>
          <Badge variant="rejected">{pendingPayments.length}</Badge>
        </div>
        <PaymentConfirmation payments={pendingPayments} />
      </div>

      {/* Pending Approvals */}
      {pendingFlips.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Ke schvaleni
            </h2>
            <Badge variant="pending">{pendingFlips.length}</Badge>
          </div>
          <FlipManagement flips={pendingFlips} />
        </div>
      )}

      {/* All Flips */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Vsechny flipy
        </h2>
        {allFlips.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
            Zatim zadne flipy v systemu.
          </div>
        ) : (
          <FlipManagement flips={allFlips} />
        )}
      </div>
    </div>
  );
}
