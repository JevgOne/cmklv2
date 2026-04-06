"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FlipTimeline } from "@/components/web/marketplace/FlipTimeline";
import { ProfitCalculator } from "@/components/web/marketplace/ProfitCalculator";
import { InvestModal } from "@/components/web/marketplace/InvestModal";
import type { FlipStep } from "@/components/web/marketplace/FlipTimeline";
import { formatPrice } from "@/lib/utils";

interface OpportunityData {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  vin: string | null;
  condition: string;
  status: FlipStep;
  purchasePrice: number;
  repairCost: number;
  estimatedSalePrice: number;
  fundedAmount: number;
  totalNeeded: number;
  repairDescription: string | null;
  photos: string | null;
  dealer: { id: string; firstName: string; lastName: string };
  investments: { investor: { firstName: string; lastName: string }; amount: number }[];
  createdAt: string;
}

export default function InvestorOpportunityDetailPage() {
  const params = useParams();
  const [investModalOpen, setInvestModalOpen] = useState(false);
  const [opportunity, setOpportunity] = useState<OpportunityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOpportunity() {
      try {
        const res = await fetch(`/api/marketplace/opportunities/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setOpportunity(data.opportunity);
        }
      } catch {
        // handled below
      } finally {
        setLoading(false);
      }
    }
    fetchOpportunity();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-900">Příležitost nenalezena</h2>
        <Link href="/marketplace/investor" className="text-orange-500 mt-4 inline-block no-underline">
          Zpět na přehled
        </Link>
      </div>
    );
  }

  const photos = opportunity.photos ? JSON.parse(opportunity.photos) as string[] : [];
  const dealerName = `${opportunity.dealer.firstName} ${opportunity.dealer.lastName}`;
  const neededAmount = opportunity.totalNeeded;
  const totalCost = opportunity.purchasePrice + opportunity.repairCost;
  const profit = opportunity.estimatedSalePrice - totalCost;
  const roi = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(0) : "0";
  const fundingProgress = neededAmount > 0
    ? Math.round((opportunity.fundedAmount / neededAmount) * 100)
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
            {photos[0] && (
              <img
                src={photos[0]}
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
                  {formatPrice(opportunity.fundedAmount)} / {formatPrice(neededAmount)}
                </span>
              </div>
              <ProgressBar value={fundingProgress} variant="green" className="h-3" />
              <p className="text-sm text-gray-500 mt-3">
                Zbývá financovat: <strong className="text-gray-900">{formatPrice(neededAmount - opportunity.fundedAmount)}</strong>
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
              {opportunity.vin && (
                <div>
                  <span className="text-gray-500">VIN</span>
                  <p className="font-medium text-gray-900 font-mono">{opportunity.vin}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Stav</span>
                <p className="font-medium text-gray-900">{opportunity.condition}</p>
              </div>
            </div>
          </Card>

          {/* Repair plan */}
          {opportunity.repairDescription && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Plán opravy</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{opportunity.repairDescription}</p>
            </Card>
          )}
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">Realizátor</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="font-bold text-white">{dealerName.split(" ").map(n => n[0]).join("")}</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">{dealerName}</p>
                <p className="text-xs text-gray-500">Realizátor</p>
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
        neededAmount={neededAmount}
        fundedAmount={opportunity.fundedAmount}
        estimatedRoi={Number(roi)}
      />
    </div>
  );
}
