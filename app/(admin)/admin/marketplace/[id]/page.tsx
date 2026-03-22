"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FlipTimeline } from "@/components/web/marketplace/FlipTimeline";
import { ProfitCalculator } from "@/components/web/marketplace/ProfitCalculator";
import { PaymentConfirmation } from "@/components/admin/marketplace/PaymentConfirmation";
import type { FlipStep } from "@/components/web/marketplace/FlipTimeline";
import { formatPrice } from "@/lib/utils";

// Dummy data
const flipDetail = {
  id: "10",
  brand: "Skoda",
  model: "Superb III 2.0 TDI",
  year: 2018,
  mileage: 98000,
  vin: "TMBAG7NE3J0456789",
  status: "PENDING_APPROVAL" as string,
  purchasePrice: 320000,
  repairCost: 55000,
  estimatedSalePrice: 489000,
  fundedAmount: 0,
  neededAmount: 375000,
  dealerName: "Jan Novak",
  dealerEmail: "jan.novak@example.com",
  dealerPhone: "+420 777 123 456",
  repairDescription: "Kompletni servis, vymena brzd, detailing, oprava drobnych vad laku.",
  marketAnalysis: "Superb III 2.0 TDI se prodava v rozmezi 440-520 tis. Nase cena 489 tis je realisticky stred.",
  photos: ["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80"],
  investors: [] as Array<{ name: string; amount: number }>,
  payments: [] as Array<{
    id: string;
    investorName: string;
    amount: number;
    opportunityLabel: string;
    variableSymbol: string;
    createdAt: string;
  }>,
  createdAt: "2026-03-20",
};

export default function AdminFlipDetailPage() {
  const [processing, setProcessing] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);

  const handleAction = async (action: "approve" | "reject" | "payout") => {
    setProcessing(true);
    try {
      if (action === "approve" || action === "reject") {
        await fetch(`/api/marketplace/opportunities/${flipDetail.id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approved: action === "approve",
            rejectionReason: action === "reject" ? "Zamitnuto administratorem" : undefined,
          }),
        });
      } else if (action === "payout") {
        const salePrice = prompt("Zadejte skutecnou prodejni cenu (Kc):");
        if (!salePrice) {
          setProcessing(false);
          return;
        }
        await fetch(`/api/marketplace/opportunities/${flipDetail.id}/payout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actualSalePrice: Number(salePrice) }),
        });
      }
      setActionDone(action);
    } finally {
      setProcessing(false);
    }
  };

  const statusStep = (["PENDING_APPROVAL", "CANCELLED"].includes(flipDetail.status) ? "APPROVED" : flipDetail.status) as FlipStep;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-6">
        <span>Admin</span>
        <span>/</span>
        <Link href="/admin/marketplace" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
          Marketplace
        </Link>
        <span>/</span>
        <span className="text-gray-900">{flipDetail.brand} {flipDetail.model}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-extrabold text-gray-900">
            {flipDetail.brand} {flipDetail.model}
          </h1>
          <p className="text-gray-500 mt-1">
            {flipDetail.year} · {flipDetail.mileage.toLocaleString("cs-CZ")} km · VIN: {flipDetail.vin}
          </p>
        </div>
        <Badge variant={flipDetail.status === "PENDING_APPROVAL" ? "pending" : "default"}>
          {flipDetail.status === "PENDING_APPROVAL" ? "Ke schvaleni" : flipDetail.status}
        </Badge>
      </div>

      {/* Action alert */}
      {actionDone && (
        <Alert variant="success" className="mb-6">
          <span className="text-sm font-medium">
            {actionDone === "approve" && "Prilezitost byla schvalena."}
            {actionDone === "reject" && "Prilezitost byla zamitnuta."}
            {actionDone === "payout" && "Vyplata byla spustena."}
          </span>
        </Alert>
      )}

      {/* Timeline */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Prubeh flipu</h2>
        <FlipTimeline currentStep={statusStep} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo */}
          {flipDetail.photos[0] && (
            <Card className="overflow-hidden">
              <img
                src={flipDetail.photos[0]}
                alt={`${flipDetail.brand} ${flipDetail.model}`}
                className="w-full aspect-video object-cover"
              />
            </Card>
          )}

          {/* Details */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Detaily vozidla</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Znacka</span>
                <p className="font-medium text-gray-900">{flipDetail.brand}</p>
              </div>
              <div>
                <span className="text-gray-500">Model</span>
                <p className="font-medium text-gray-900">{flipDetail.model}</p>
              </div>
              <div>
                <span className="text-gray-500">Rok</span>
                <p className="font-medium text-gray-900">{flipDetail.year}</p>
              </div>
              <div>
                <span className="text-gray-500">Najeto</span>
                <p className="font-medium text-gray-900">{flipDetail.mileage.toLocaleString("cs-CZ")} km</p>
              </div>
              <div>
                <span className="text-gray-500">VIN</span>
                <p className="font-medium text-gray-900 font-mono">{flipDetail.vin}</p>
              </div>
              <div>
                <span className="text-gray-500">Vytvoreno</span>
                <p className="font-medium text-gray-900">{flipDetail.createdAt}</p>
              </div>
            </div>
          </Card>

          {/* Repair */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Plan opravy</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{flipDetail.repairDescription}</p>
          </Card>

          {/* Market analysis */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Analyza trhu</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{flipDetail.marketAnalysis}</p>
          </Card>

          {/* Pending payments */}
          {flipDetail.payments.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Cekajici platby</h2>
              <PaymentConfirmation payments={flipDetail.payments} />
            </div>
          )}

          {/* Investors */}
          {flipDetail.investors.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Investori ({flipDetail.investors.length})
              </h2>
              <div className="space-y-3">
                {flipDetail.investors.map((inv, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">{inv.name}</span>
                    <span className="text-sm font-bold text-gray-900">{formatPrice(inv.amount)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Calculator */}
          <ProfitCalculator
            initialPurchasePrice={flipDetail.purchasePrice}
            initialRepairCost={flipDetail.repairCost}
            initialSalePrice={flipDetail.estimatedSalePrice}
            readOnly
          />

          {/* Dealer info */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Dealer</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Jmeno</span>
                <span className="font-medium">{flipDetail.dealerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{flipDetail.dealerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Telefon</span>
                <span className="font-medium">{flipDetail.dealerPhone}</span>
              </div>
            </div>
          </Card>

          {/* Admin actions */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Akce</h3>
            <div className="space-y-3">
              {flipDetail.status === "PENDING_APPROVAL" && (
                <>
                  <Button
                    variant="success"
                    className="w-full"
                    onClick={() => handleAction("approve")}
                    disabled={processing}
                  >
                    Schvalit prilezitost
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => handleAction("reject")}
                    disabled={processing}
                  >
                    Zamitnout
                  </Button>
                </>
              )}
              {flipDetail.status === "SOLD" && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleAction("payout")}
                  disabled={processing}
                >
                  Spustit vyplatu
                </Button>
              )}
              <Button variant="outline" className="w-full">
                Kontaktovat dealera
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
