"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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

interface FlipDetail {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  vin: string | null;
  status: string;
  purchasePrice: number;
  repairCost: number;
  estimatedSalePrice: number;
  fundedAmount: number;
  repairDescription: string | null;
  photos: string[];
  dealerName: string;
  dealerEmail: string;
  createdAt: string;
  investors: Array<{ name: string; amount: number }>;
  payments: Array<{
    id: string;
    investorName: string;
    amount: number;
    opportunityLabel: string;
    variableSymbol: string;
    createdAt: string;
  }>;
}

export default function AdminFlipDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [flip, setFlip] = useState<FlipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);

  useEffect(() => {
    async function loadFlip() {
      try {
        const res = await fetch(`/api/marketplace/opportunities/${id}`);
        if (res.ok) {
          const data = await res.json();
          const opp = data.opportunity || data;

          // Load investments
          let investors: FlipDetail["investors"] = [];
          let payments: FlipDetail["payments"] = [];
          try {
            const invRes = await fetch(`/api/marketplace/investments?opportunityId=${id}`);
            if (invRes.ok) {
              const invData = await invRes.json();
              const allInv = invData.investments || [];
              investors = allInv
                .filter((i: { paymentStatus: string }) => i.paymentStatus === "CONFIRMED")
                .map((i: { investor: { firstName: string; lastName: string }; amount: number }) => ({
                  name: `${i.investor.firstName} ${i.investor.lastName}`,
                  amount: i.amount,
                }));
              payments = allInv
                .filter((i: { paymentStatus: string }) => i.paymentStatus === "PENDING")
                .map((i: { id: string; investor: { firstName: string; lastName: string }; amount: number; paymentReference: string | null; createdAt: string }) => ({
                  id: i.id,
                  investorName: `${i.investor.firstName} ${i.investor.lastName}`,
                  amount: i.amount,
                  opportunityLabel: `${opp.brand} ${opp.model}`,
                  variableSymbol: i.paymentReference || `MP${i.id.slice(0, 8).toUpperCase()}`,
                  createdAt: i.createdAt?.split("T")[0] || "",
                }));
            }
          } catch {
            // Investments endpoint may not support this filter
          }

          setFlip({
            id: opp.id,
            brand: opp.brand,
            model: opp.model,
            year: opp.year,
            mileage: opp.mileage,
            vin: opp.vin,
            status: opp.status,
            purchasePrice: opp.purchasePrice,
            repairCost: opp.repairCost,
            estimatedSalePrice: opp.estimatedSalePrice,
            fundedAmount: opp.fundedAmount ?? 0,
            repairDescription: opp.repairDescription,
            photos: opp.photos ? JSON.parse(opp.photos) : [],
            dealerName: opp.dealer
              ? `${opp.dealer.firstName} ${opp.dealer.lastName}`
              : "Neznamy",
            dealerEmail: opp.dealer?.email || "",
            createdAt: opp.createdAt?.split("T")[0] || "",
            investors,
            payments,
          });
        }
      } catch {
        // handled by loading state
      } finally {
        setLoading(false);
      }
    }
    loadFlip();
  }, [id]);

  const handleAction = async (action: "approve" | "reject" | "payout") => {
    if (!flip) return;
    setProcessing(true);
    try {
      if (action === "approve" || action === "reject") {
        await fetch(`/api/marketplace/opportunities/${flip.id}/approve`, {
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
        await fetch(`/api/marketplace/opportunities/${flip.id}/payout`, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!flip) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-900">Flip nenalezen</h2>
        <Link href="/admin/marketplace" className="text-orange-500 mt-4 inline-block no-underline">
          Zpet na marketplace
        </Link>
      </div>
    );
  }

  const neededAmount = flip.purchasePrice + flip.repairCost - flip.fundedAmount;
  const statusStep = (["PENDING_APPROVAL", "CANCELLED"].includes(flip.status) ? "APPROVED" : flip.status) as FlipStep;

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
        <span className="text-gray-900">{flip.brand} {flip.model}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-extrabold text-gray-900">
            {flip.brand} {flip.model}
          </h1>
          <p className="text-gray-500 mt-1">
            {flip.year} · {flip.mileage.toLocaleString("cs-CZ")} km
            {flip.vin && <> · VIN: {flip.vin}</>}
          </p>
        </div>
        <Badge variant={flip.status === "PENDING_APPROVAL" ? "pending" : "default"}>
          {flip.status === "PENDING_APPROVAL" ? "Ke schvaleni" : flip.status}
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
          {flip.photos[0] && (
            <Card className="overflow-hidden">
              <img
                src={flip.photos[0]}
                alt={`${flip.brand} ${flip.model}`}
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
                <p className="font-medium text-gray-900">{flip.brand}</p>
              </div>
              <div>
                <span className="text-gray-500">Model</span>
                <p className="font-medium text-gray-900">{flip.model}</p>
              </div>
              <div>
                <span className="text-gray-500">Rok</span>
                <p className="font-medium text-gray-900">{flip.year}</p>
              </div>
              <div>
                <span className="text-gray-500">Najeto</span>
                <p className="font-medium text-gray-900">{flip.mileage.toLocaleString("cs-CZ")} km</p>
              </div>
              {flip.vin && (
                <div>
                  <span className="text-gray-500">VIN</span>
                  <p className="font-medium text-gray-900 font-mono">{flip.vin}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Vytvoreno</span>
                <p className="font-medium text-gray-900">{flip.createdAt}</p>
              </div>
            </div>
          </Card>

          {/* Repair */}
          {flip.repairDescription && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Plan opravy</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{flip.repairDescription}</p>
            </Card>
          )}

          {/* Pending payments */}
          {flip.payments.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Cekajici platby</h2>
              <PaymentConfirmation payments={flip.payments} />
            </div>
          )}

          {/* Investors */}
          {flip.investors.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Investori ({flip.investors.length})
              </h2>
              <div className="space-y-3">
                {flip.investors.map((inv, i) => (
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
            initialPurchasePrice={flip.purchasePrice}
            initialRepairCost={flip.repairCost}
            initialSalePrice={flip.estimatedSalePrice}
            readOnly
          />

          {/* Dealer info */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Realizátor</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Jméno</span>
                <span className="font-medium">{flip.dealerName}</span>
              </div>
              {flip.dealerEmail && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium">{flip.dealerEmail}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Admin actions */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Akce</h3>
            <div className="space-y-3">
              {flip.status === "PENDING_APPROVAL" && (
                <>
                  <Button
                    variant="success"
                    className="w-full"
                    onClick={() => handleAction("approve")}
                    disabled={processing}
                  >
                    Schválit příležitost
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => handleAction("reject")}
                    disabled={processing}
                  >
                    Zamítnout
                  </Button>
                </>
              )}
              {flip.status === "SOLD" && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleAction("payout")}
                  disabled={processing}
                >
                  Spustit výplatu
                </Button>
              )}
              {flip.dealerEmail && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = `mailto:${flip.dealerEmail}`}
                >
                  Kontaktovat realizátora
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
