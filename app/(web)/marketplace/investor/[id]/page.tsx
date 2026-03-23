"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FlipTimeline } from "@/components/web/marketplace/FlipTimeline";
import { ProfitCalculator } from "@/components/web/marketplace/ProfitCalculator";
import { InvestModal } from "@/components/web/marketplace/InvestModal";
import type { FlipStep } from "@/components/web/marketplace/FlipTimeline";
import { formatPrice } from "@/lib/utils";

// Dummy data
const opportunity = {
  id: "1",
  brand: "Skoda",
  model: "Octavia III 1.6 TDI",
  year: 2016,
  mileage: 145000,
  vin: "TMBAG7NE3G0123456",
  condition: "GOOD",
  status: "FUNDING" as FlipStep,
  purchasePrice: 180000,
  repairCost: 45000,
  estimatedSalePrice: 299000,
  fundedAmount: 150000,
  neededAmount: 225000,
  dealerName: "Jan Novak",
  dealerFlips: 12,
  dealerAvgRoi: 22,
  repairDescription: "Výměna rozvodového řemene, nový olejový filtr, oprava laku na předním nárazníku, detailing interiéru.",
  marketAnalysis: "Srovnatelné vozy na trhu se prodávají za 280–320 000 Kč. Naše auto bude v nadprůměrném stavu po opravě.",
  photos: [
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80",
  ],
  createdAt: "2026-02-15",
};

export default function InvestorOpportunityDetailPage() {
  const [investModalOpen, setInvestModalOpen] = useState(false);

  const totalCost = opportunity.purchasePrice + opportunity.repairCost;
  const profit = opportunity.estimatedSalePrice - totalCost;
  const roi = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(0) : "0";
  const fundingProgress = opportunity.neededAmount > 0
    ? Math.round((opportunity.fundedAmount / opportunity.neededAmount) * 100)
    : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-6">
        <Link href="/marketplace" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
          Marketplace
        </Link>
        <span>/</span>
        <Link href="/marketplace/investor" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
          Investor
        </Link>
        <span>/</span>
        <span className="text-gray-900">{opportunity.brand} {opportunity.model}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-extrabold text-gray-900">
            {opportunity.brand} {opportunity.model}
          </h1>
          <p className="text-gray-500 mt-1">
            {opportunity.year} · {opportunity.mileage.toLocaleString("cs-CZ")} km
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-orange-100 text-orange-600 font-extrabold text-lg px-4 py-2 rounded-xl">
            ROI +{roi}%
          </span>
          {opportunity.status === "FUNDING" && (
            <Button variant="primary" size="lg" onClick={() => setInvestModalOpen(true)}>
              Investovat
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Průběh flipu</h2>
        <FlipTimeline currentStep={opportunity.status} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo */}
          <Card className="overflow-hidden">
            {opportunity.photos[0] && (
              <img
                src={opportunity.photos[0]}
                alt={`${opportunity.brand} ${opportunity.model}`}
                className="w-full aspect-video object-cover"
              />
            )}
          </Card>

          {/* Funding progress */}
          {opportunity.status === "FUNDING" && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Stav financování</h2>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Financováno</span>
                <span className="font-bold text-gray-900">
                  {formatPrice(opportunity.fundedAmount)} / {formatPrice(opportunity.neededAmount)}
                </span>
              </div>
              <ProgressBar value={fundingProgress} variant="green" className="h-3" />
              <p className="text-sm text-gray-500 mt-3">
                Zbývá financovat: <strong className="text-gray-900">{formatPrice(opportunity.neededAmount - opportunity.fundedAmount)}</strong>
              </p>
            </Card>
          )}

          {/* Vehicle details */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Informace o vozidle</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Značka</span>
                <p className="font-medium text-gray-900">{opportunity.brand}</p>
              </div>
              <div>
                <span className="text-gray-500">Model</span>
                <p className="font-medium text-gray-900">{opportunity.model}</p>
              </div>
              <div>
                <span className="text-gray-500">Rok</span>
                <p className="font-medium text-gray-900">{opportunity.year}</p>
              </div>
              <div>
                <span className="text-gray-500">Najeto</span>
                <p className="font-medium text-gray-900">{opportunity.mileage.toLocaleString("cs-CZ")} km</p>
              </div>
              <div>
                <span className="text-gray-500">VIN</span>
                <p className="font-medium text-gray-900 font-mono">{opportunity.vin}</p>
              </div>
              <div>
                <span className="text-gray-500">Stav</span>
                <p className="font-medium text-gray-900">{opportunity.condition}</p>
              </div>
            </div>
          </Card>

          {/* Repair plan */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Plán opravy</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{opportunity.repairDescription}</p>
          </Card>

          {/* Market analysis */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Analýza trhu</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{opportunity.marketAnalysis}</p>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profit calculator */}
          <ProfitCalculator
            initialPurchasePrice={opportunity.purchasePrice}
            initialRepairCost={opportunity.repairCost}
            initialSalePrice={opportunity.estimatedSalePrice}
            readOnly
          />

          {/* Dealer info */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Dealer</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="font-bold text-white">{opportunity.dealerName.split(" ").map(n => n[0]).join("")}</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">{opportunity.dealerName}</p>
                <p className="text-xs text-gray-500">Ověřený dealer</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-extrabold text-gray-900">{opportunity.dealerFlips}</div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase">Flipů</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-extrabold text-orange-500">{opportunity.dealerAvgRoi}%</div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase">Prům. ROI</div>
              </div>
            </div>
          </Card>

          {/* CTA */}
          {opportunity.status === "FUNDING" && (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => setInvestModalOpen(true)}
            >
              Investovat do tohoto flipu
            </Button>
          )}
        </div>
      </div>

      {/* Invest Modal */}
      <InvestModal
        open={investModalOpen}
        onClose={() => setInvestModalOpen(false)}
        opportunityId={opportunity.id}
        brand={opportunity.brand}
        model={opportunity.model}
        neededAmount={opportunity.neededAmount}
        fundedAmount={opportunity.fundedAmount}
        estimatedRoi={Number(roi)}
      />
    </div>
  );
}
