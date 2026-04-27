"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DealScoreBadge } from "./DealScoreBadge";
import { formatPrice } from "@/lib/utils";

interface ActiveInvestment {
  id: string;
  opportunityId: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  investedAmount: number;
  expectedProfit: number;
  repairProgress: number;
  dealScore: number | null;
  dealerName: string;
  fundingProgress: number;
}

interface CompletedDeal {
  opportunityId: string;
  brand: string;
  model: string;
  investedAmount: number;
  returnAmount: number;
  roi: number;
  completedAt: string;
}

interface PortfolioMonth {
  month: string;
  value: number;
}

export interface PortfolioDashboardProps {
  totalInvested: number;
  portfolioValue: number;
  realizedProfit: number;
  averageRoi: number;
  activeInvestments: ActiveInvestment[];
  completedDeals: CompletedDeal[];
  monthlyTimeline: PortfolioMonth[];
}

const STATUS_LABELS: Record<string, string> = {
  FUNDING: "Financování",
  FUNDED: "Financováno",
  IN_REPAIR: "V opravě",
  FOR_SALE: "Na prodej",
  SOLD: "Prodáno",
  PAYOUT_PENDING: "Čeká výplatu",
};

const STATUS_COLORS: Record<string, string> = {
  FUNDING: "bg-blue-100 text-blue-700",
  FUNDED: "bg-green-100 text-green-700",
  IN_REPAIR: "bg-orange-100 text-orange-700",
  FOR_SALE: "bg-purple-100 text-purple-700",
  SOLD: "bg-green-100 text-green-700",
  PAYOUT_PENDING: "bg-yellow-100 text-yellow-700",
};

type Tab = "active" | "completed";

export function PortfolioDashboard({
  totalInvested,
  portfolioValue,
  realizedProfit,
  averageRoi,
  activeInvestments,
  completedDeals,
  monthlyTimeline,
}: PortfolioDashboardProps) {
  const [tab, setTab] = useState<Tab>("active");

  // Simple CSS-only bar chart for timeline
  const maxValue = Math.max(...monthlyTimeline.map((m) => m.value), 1);

  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon="💰"
          iconColor="orange"
          value={formatPrice(totalInvested)}
          label="Celkem investováno"
        />
        <StatCard
          icon="📊"
          iconColor="blue"
          value={formatPrice(portfolioValue)}
          label="Hodnota portfolia"
        />
        <StatCard
          icon="📈"
          iconColor="green"
          value={formatPrice(realizedProfit)}
          label="Realizovaný zisk"
        />
        <StatCard
          icon="🎯"
          iconColor="orange"
          value={`${averageRoi}%`}
          label="Průměrný ROI"
        />
      </div>

      {/* Portfolio Timeline Chart */}
      {monthlyTimeline.length > 1 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Vývoj portfolia</h3>
          <div className="flex items-end gap-1 h-32">
            {monthlyTimeline.map((m) => {
              const height = maxValue > 0 ? (m.value / maxValue) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-orange-400 rounded-t-sm min-h-[2px] transition-all"
                    style={{ height: `${height}%` }}
                    title={`${m.month}: ${formatPrice(m.value)}`}
                  />
                  <span className="text-[9px] text-gray-400 truncate w-full text-center">
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div>
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => setTab("active")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === "active"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Aktivní investice ({activeInvestments.length})
          </button>
          <button
            onClick={() => setTab("completed")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === "completed"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Historie ({completedDeals.length})
          </button>
        </div>

        {/* Active Investments */}
        {tab === "active" && (
          <div className="space-y-3">
            {activeInvestments.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-gray-400">Žádné aktivní investice.</p>
                <Link
                  href="/marketplace/investor"
                  className="text-orange-500 hover:underline text-sm font-semibold mt-2 inline-block no-underline"
                >
                  Prozkoumat příležitosti
                </Link>
              </Card>
            ) : (
              activeInvestments.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/marketplace/deals/${inv.opportunityId}`}
                  className="block no-underline"
                >
                  <Card hover className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-bold text-gray-900 truncate">
                            {inv.brand} {inv.model}
                          </h4>
                          <span className="text-xs text-gray-400">{inv.year}</span>
                          <DealScoreBadge score={inv.dealScore} size="sm" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-600"}`}>
                            {STATUS_LABELS[inv.status] || inv.status}
                          </span>
                          <span>{inv.dealerName}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-gray-900">
                          {formatPrice(inv.investedAmount)}
                        </div>
                        {inv.expectedProfit > 0 && (
                          <div className="text-xs font-semibold text-success-500">
                            +{formatPrice(inv.expectedProfit)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bars */}
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>Financování</span>
                          <span>{inv.fundingProgress}%</span>
                        </div>
                        <ProgressBar value={inv.fundingProgress} variant="blue" />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>Oprava</span>
                          <span>{inv.repairProgress}%</span>
                        </div>
                        <ProgressBar value={inv.repairProgress} variant="green" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Completed Deals */}
        {tab === "completed" && (
          <div className="space-y-3">
            {completedDeals.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-gray-400">Zatím žádné dokončené flipy.</p>
              </Card>
            ) : (
              completedDeals.map((deal) => (
                <Link
                  key={deal.opportunityId}
                  href={`/marketplace/deals/${deal.opportunityId}`}
                  className="block no-underline"
                >
                  <Card hover className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">
                          {deal.brand} {deal.model}
                        </h4>
                        <span className="text-xs text-gray-400">
                          {new Date(deal.completedAt).toLocaleDateString("cs-CZ")}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {formatPrice(deal.investedAmount)} →{" "}
                          <span className="font-bold text-gray-900">
                            {formatPrice(deal.returnAmount)}
                          </span>
                        </div>
                        <Badge variant={deal.roi > 0 ? "success" : "rejected"}>
                          {deal.roi > 0 ? "+" : ""}{deal.roi}% ROI
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
