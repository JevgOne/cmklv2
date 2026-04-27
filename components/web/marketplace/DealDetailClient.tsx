"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { FlipTimeline } from "./FlipTimeline";
import type { FlipStep } from "./FlipTimeline";
import { ProfitCalculator } from "./ProfitCalculator";
import { InvestModal } from "./InvestModal";
import { DealPhotoGallery } from "./DealPhotoGallery";
import { DealAdminPanel } from "./DealAdminPanel";
import { DealScoreBadge } from "./DealScoreBadge";
import { FlipProgressTracker } from "./FlipProgressTracker";
import type { Milestone } from "./FlipProgressTracker";
import { NegotiationPanel } from "./NegotiationPanel";
import { DealTabs } from "./DealTabs";
import type { DealTab } from "./DealTabs";
import { DealerReputationBadge } from "./DealerReputationBadge";
import { NotificationBell } from "./NotificationBell";
import { formatPrice, formatMileage } from "@/lib/utils";

interface Opportunity {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  vin: string;
  condition: string;
  status: string;
  purchasePrice: number;
  repairCost: number;
  estimatedSalePrice: number;
  actualSalePrice: number | null;
  fundedAmount: number;
  totalNeeded: number;
  repairDescription: string | null;
  photos: string[];
  repairPhotos: string[];
  adminNotes: string | null;
  createdAt: string;
  agreedDealerSharePct: number | null;
  agreedInvestorSharePct: number | null;
  carmaklerFeePct: number;
  dealScore: number | null;
  dealerRating: number | null;
  repairProgress: number;
  repairMilestones: Milestone[];
}

interface Dealer {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  avatar: string | null;
  flipCount: number;
}

interface Investment {
  id: string;
  investorName: string;
  amount: number;
  paymentStatus: string;
}

interface Negotiation {
  id: string;
  fromUser: { id: string; firstName: string; lastName: string };
  toUser: { id: string; firstName: string; lastName: string };
  fromRole: string;
  dealerSharePct: number;
  investorSharePct: number;
  message?: string | null;
  status: string;
  round: number;
  createdAt: string;
  respondedAt?: string | null;
}

interface DealDetailClientProps {
  opportunity: Opportunity;
  dealer: Dealer;
  investments: Investment[];
  negotiations: Negotiation[];
  userRole: string;
  userId: string;
  investorAmount: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: "Čeká na schválení",
  APPROVED: "Schváleno",
  FUNDING: "Financování",
  FUNDED: "Financováno",
  IN_REPAIR: "V opravě",
  FOR_SALE: "Na prodej",
  SOLD: "Prodáno",
  PAYOUT_PENDING: "Čeká na výplatu",
  COMPLETED: "Dokončeno",
  CANCELLED: "Zrušeno",
};

const STATUS_VARIANTS: Record<string, "verified" | "top" | "live" | "new" | "pending" | "rejected" | "default"> = {
  PENDING_APPROVAL: "pending",
  APPROVED: "new",
  FUNDING: "live",
  FUNDED: "verified",
  IN_REPAIR: "top",
  FOR_SALE: "live",
  SOLD: "verified",
  COMPLETED: "verified",
  CANCELLED: "rejected",
};

export function DealDetailClient({
  opportunity: opp,
  dealer,
  investments,
  negotiations,
  userRole,
  userId,
  investorAmount,
}: DealDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DealTab>("overview");
  const [investModalOpen, setInvestModalOpen] = useState(false);

  const isAdmin = userRole === "ADMIN" || userRole === "BACKOFFICE";
  const isDealer = userRole === "VERIFIED_DEALER";
  const isInvestor = userRole === "INVESTOR";
  const isOwnDeal = isDealer && dealer.id === userId;

  const totalCost = opp.purchasePrice + opp.repairCost;
  const profit = opp.estimatedSalePrice - totalCost;
  const roi = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(1) : "0";
  const fundingProgress =
    opp.totalNeeded > 0
      ? Math.min(100, Math.round((opp.fundedAmount / opp.totalNeeded) * 100))
      : 0;

  const canInvest = isInvestor && opp.status === "FUNDING";
  const canUploadRepair =
    isOwnDeal && ["IN_REPAIR", "FOR_SALE"].includes(opp.status);
  const canMarkForSale = isOwnDeal && opp.status === "IN_REPAIR";

  const pendingNegotiations = negotiations.filter(
    (n) => n.status === "PENDING" && n.toUser.id === userId
  ).length;

  const showRepairTab = ["FUNDED", "IN_REPAIR", "FOR_SALE", "SOLD", "PAYOUT_PENDING", "COMPLETED"].includes(opp.status);
  const showNegotiationTab = isDealer || isInvestor || isAdmin;
  const showInvestorsTab = isAdmin || isOwnDeal;

  const tabs = [
    { key: "overview" as DealTab, label: "Přehled" },
    { key: "finance" as DealTab, label: "Finance" },
    { key: "repair" as DealTab, label: "Oprava", badge: opp.repairProgress > 0 && opp.repairProgress < 100 ? opp.repairProgress : undefined, hidden: !showRepairTab },
    { key: "negotiation" as DealTab, label: "Vyjednávání", badge: pendingNegotiations, hidden: !showNegotiationTab },
    { key: "investors" as DealTab, label: "Investoři", badge: investments.length || undefined, hidden: !showInvestorsTab },
  ];

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/marketplace/opportunities/${opp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error("DealDetailClient: status update failed:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "CarMarketplace", href: "/marketplace" },
          { label: "Deals" },
          { label: `${opp.brand} ${opp.model}` },
        ]}
      />

      {/* Header */}
      <div className="mt-6 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            {opp.brand} {opp.model}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span>{opp.year}</span>
            <span>·</span>
            <span>{formatMileage(opp.mileage)}</span>
            {opp.condition && (
              <>
                <span>·</span>
                <span>Stav: {opp.condition}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <DealScoreBadge score={opp.dealScore} />
          {profit > 0 && (
            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-bold">
              ROI +{roi}%
            </span>
          )}
          <Badge variant={STATUS_VARIANTS[opp.status] ?? "default"}>
            {STATUS_LABELS[opp.status] ?? opp.status}
          </Badge>
        </div>
      </div>

      {/* Timeline */}
      {opp.status !== "PENDING_APPROVAL" && opp.status !== "CANCELLED" && (
        <div className="mb-6">
          <FlipTimeline currentStep={opp.status as FlipStep} />
        </div>
      )}

      {/* Tabs */}
      <DealTabs active={activeTab} onChange={setActiveTab} tabs={tabs} />

      {/* Tab content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* === TAB: PŘEHLED === */}
          {activeTab === "overview" && (
            <>
              <DealPhotoGallery
                photos={opp.photos}
                repairPhotos={opp.repairPhotos}
                canUpload={canUploadRepair}
                opportunityId={opp.id}
              />

              <Card className="p-5">
                <h3 className="font-bold text-gray-900 mb-4">Informace o vozidle</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <InfoItem label="Značka" value={opp.brand} />
                  <InfoItem label="Model" value={opp.model} />
                  <InfoItem label="Rok" value={String(opp.year)} />
                  <InfoItem label="Najeto" value={formatMileage(opp.mileage)} />
                  {opp.vin && <InfoItem label="VIN" value={opp.vin} />}
                  {opp.condition && <InfoItem label="Stav" value={opp.condition} />}
                </div>
              </Card>

              {opp.repairDescription && (
                <Card className="p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Plán opravy</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{opp.repairDescription}</p>
                </Card>
              )}

              {/* Dealer action: mark for sale */}
              {canMarkForSale && (
                <Card className="p-5 border-orange-200 bg-orange-50">
                  <h3 className="font-bold text-gray-900 mb-2">Akce realizátora</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Oprava dokončena? Označte vůz jako připravený k prodeji.
                  </p>
                  <button
                    onClick={() => handleStatusUpdate("FOR_SALE")}
                    className="px-5 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors text-sm"
                  >
                    Označit jako Na prodej
                  </button>
                </Card>
              )}

              {/* Admin panel */}
              {isAdmin && (
                <DealAdminPanel
                  opportunityId={opp.id}
                  currentStatus={opp.status}
                  adminNotes={opp.adminNotes}
                  actualSalePrice={opp.actualSalePrice}
                />
              )}
            </>
          )}

          {/* === TAB: FINANCE === */}
          {activeTab === "finance" && (
            <>
              {/* Funding progress */}
              {["FUNDING", "APPROVED"].includes(opp.status) && (
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Stav financování</h3>
                    <span className="text-sm font-semibold text-gray-500">{fundingProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${fundingProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>{formatPrice(opp.fundedAmount)}</span>
                    <span>{formatPrice(opp.totalNeeded)}</span>
                  </div>
                  {opp.totalNeeded > opp.fundedAmount && (
                    <p className="text-xs text-gray-400 mt-1">
                      Zbývá: {formatPrice(opp.totalNeeded - opp.fundedAmount)}
                    </p>
                  )}
                </Card>
              )}

              {/* Investor's own investment */}
              {isInvestor && investorAmount > 0 && (
                <Card className="p-5 border-blue-200 bg-blue-50">
                  <h3 className="font-bold text-blue-900 mb-3">Vaše investice</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-blue-600 block">Investováno</span>
                      <span className="text-lg font-bold text-blue-900">{formatPrice(investorAmount)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-blue-600 block">Váš podíl</span>
                      <span className="text-lg font-bold text-blue-900">
                        {opp.totalNeeded > 0 ? ((investorAmount / opp.totalNeeded) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    {profit > 0 && (() => {
                      const carmaklerFee = Math.round(opp.estimatedSalePrice * ((opp.carmaklerFeePct ?? 5) / 100));
                      const distributable = Math.max(0, profit - carmaklerFee);
                      const investorPct = (opp.agreedInvestorSharePct ?? 50) / 100;
                      const estimatedReturn = Math.round(distributable * investorPct * (investorAmount / opp.totalNeeded));
                      return (
                        <>
                          <div>
                            <span className="text-xs text-blue-600 block">Odhadovaný výnos</span>
                            <span className="text-lg font-bold text-green-700">+{formatPrice(estimatedReturn)}</span>
                          </div>
                          <div>
                            <span className="text-xs text-blue-600 block">Celkem vráceno</span>
                            <span className="text-lg font-bold text-blue-900">{formatPrice(investorAmount + estimatedReturn)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </Card>
              )}

              {/* Actual vs estimated */}
              {opp.actualSalePrice && opp.actualSalePrice > 0 && (
                <Card className="p-5">
                  <h4 className="font-bold text-gray-900 mb-3">Skutečný výsledek</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Odhad prodeje</span>
                      <span>{formatPrice(opp.estimatedSalePrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Skutečný prodej</span>
                      <span className={`font-semibold ${opp.actualSalePrice >= opp.estimatedSalePrice ? "text-green-600" : "text-red-600"}`}>
                        {formatPrice(opp.actualSalePrice)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-gray-500">Rozdíl</span>
                      <span className={`font-bold ${opp.actualSalePrice >= opp.estimatedSalePrice ? "text-green-600" : "text-red-600"}`}>
                        {opp.actualSalePrice >= opp.estimatedSalePrice ? "+" : ""}
                        {formatPrice(opp.actualSalePrice - opp.estimatedSalePrice)}
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Invest CTA inline */}
              {canInvest && (
                <button
                  onClick={() => setInvestModalOpen(true)}
                  className="w-full px-5 py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                >
                  Investovat do tohoto flipu
                </button>
              )}
            </>
          )}

          {/* === TAB: OPRAVA === */}
          {activeTab === "repair" && showRepairTab && (
            <>
              <FlipProgressTracker
                opportunityId={opp.id}
                milestones={opp.repairMilestones}
                repairProgress={opp.repairProgress}
                status={opp.status}
                canEdit={isOwnDeal || isAdmin}
                onUpdate={() => router.refresh()}
              />

              {opp.repairPhotos.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Fotky z opravy</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {opp.repairPhotos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img src={url} alt={`Oprava ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {/* === TAB: VYJEDNÁVÁNÍ === */}
          {activeTab === "negotiation" && showNegotiationTab && (
            <NegotiationPanel
              opportunityId={opp.id}
              negotiations={negotiations}
              currentUserId={userId}
              currentUserRole={userRole}
              onUpdate={() => router.refresh()}
            />
          )}

          {/* === TAB: INVESTOŘI === */}
          {activeTab === "investors" && showInvestorsTab && (
            <Card className="p-5">
              <h3 className="font-bold text-gray-900 mb-4">
                Investoři ({investments.length})
              </h3>
              {investments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Zatím žádní investoři.</p>
              ) : (
                <div className="space-y-3">
                  {investments.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                          {inv.investorName.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{inv.investorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{formatPrice(inv.amount)}</span>
                        <PaymentBadge status={inv.paymentStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right column (1/3) — sticky sidebar */}
        <div className="space-y-6">
          {/* Profit calculator — always visible */}
          <ProfitCalculator
            initialPurchasePrice={opp.purchasePrice}
            initialRepairCost={opp.repairCost}
            initialSalePrice={opp.estimatedSalePrice}
            agreedDealerSharePct={opp.agreedDealerSharePct}
            carmaklerFeePct={opp.carmaklerFeePct}
            readOnly
          />

          {/* Dealer info */}
          <Card className="p-5">
            <h4 className="font-bold text-gray-900 mb-3">Realizátor</h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-400">
                {dealer.avatar ? (
                  <img src={dealer.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  `${dealer.firstName[0]}${dealer.lastName[0]}`
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {dealer.firstName} {dealer.lastName}
                </div>
                {dealer.companyName && (
                  <div className="text-xs text-gray-500">{dealer.companyName}</div>
                )}
              </div>
            </div>
            {opp.dealerRating != null && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <DealerReputationBadge rating={opp.dealerRating} flipCount={dealer.flipCount} />
              </div>
            )}
          </Card>

          {/* Invest CTA */}
          {canInvest && (
            <button
              onClick={() => setInvestModalOpen(true)}
              className="w-full px-5 py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
            >
              Investovat do tohoto flipu
            </button>
          )}
        </div>
      </div>

      {/* Invest modal */}
      {canInvest && (
        <InvestModal
          open={investModalOpen}
          onClose={() => {
            setInvestModalOpen(false);
            router.refresh();
          }}
          opportunityId={opp.id}
          brand={opp.brand}
          model={opp.model}
          neededAmount={opp.totalNeeded}
          fundedAmount={opp.fundedAmount}
          estimatedRoi={Number(roi)}
        />
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-400 block">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Čeká", color: "bg-yellow-100 text-yellow-700" },
    CONFIRMED: { label: "Potvrzeno", color: "bg-green-100 text-green-700" },
    REFUNDED: { label: "Vráceno", color: "bg-gray-100 text-gray-600" },
  };
  const c = config[status] ?? { label: status, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.color}`}>
      {c.label}
    </span>
  );
}
