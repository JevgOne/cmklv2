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

interface Props {
  initialData: FlipDetail;
}

export function AdminFlipDetailContent({ initialData }: Props) {
  const [flip] = useState<FlipDetail>(initialData);
  const [processing, setProcessing] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);

  const handleAction = async (action: "approve" | "reject" | "payout") => {
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
        if (!salePrice) { setProcessing(false); return; }
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

  const statusStep = (["PENDING_APPROVAL", "CANCELLED"].includes(flip.status) ? "APPROVED" : flip.status) as FlipStep;

  return (
    <div>
      <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-6">
        <span>Admin</span>
        <span>/</span>
        <Link href="/admin/marketplace" className="hover:text-orange-500 transition-colors no-underline text-gray-500">Marketplace</Link>
        <span>/</span>
        <span className="text-gray-900">{flip.brand} {flip.model}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-extrabold text-gray-900">{flip.brand} {flip.model}</h1>
          <p className="text-gray-500 mt-1">
            {flip.year} · {flip.mileage.toLocaleString("cs-CZ")} km
            {flip.vin && <> · VIN: {flip.vin}</>}
          </p>
        </div>
        <Badge variant={flip.status === "PENDING_APPROVAL" ? "pending" : "default"}>
          {flip.status === "PENDING_APPROVAL" ? "Ke schvaleni" : flip.status}
        </Badge>
      </div>

      {actionDone && (
        <Alert variant="success" className="mb-6">
          <span className="text-sm font-medium">
            {actionDone === "approve" && "Prilezitost byla schvalena."}
            {actionDone === "reject" && "Prilezitost byla zamitnuta."}
            {actionDone === "payout" && "Vyplata byla spustena."}
          </span>
        </Alert>
      )}

      <Card className="p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Prubeh flipu</h2>
        <FlipTimeline currentStep={statusStep} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {flip.photos[0] && (
            <Card className="overflow-hidden">
              <img src={flip.photos[0]} alt={`${flip.brand} ${flip.model}`} className="w-full aspect-video object-cover" />
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Detaily vozidla</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-500">Znacka</span><p className="font-medium text-gray-900">{flip.brand}</p></div>
              <div><span className="text-gray-500">Model</span><p className="font-medium text-gray-900">{flip.model}</p></div>
              <div><span className="text-gray-500">Rok</span><p className="font-medium text-gray-900">{flip.year}</p></div>
              <div><span className="text-gray-500">Najeto</span><p className="font-medium text-gray-900">{flip.mileage.toLocaleString("cs-CZ")} km</p></div>
              {flip.vin && <div><span className="text-gray-500">VIN</span><p className="font-medium text-gray-900 font-mono">{flip.vin}</p></div>}
              <div><span className="text-gray-500">Vytvoreno</span><p className="font-medium text-gray-900">{flip.createdAt}</p></div>
            </div>
          </Card>

          {flip.repairDescription && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Plan opravy</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{flip.repairDescription}</p>
            </Card>
          )}

          {flip.payments.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Cekajici platby</h2>
              <PaymentConfirmation payments={flip.payments} />
            </div>
          )}

          {flip.investors.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Investori ({flip.investors.length})</h2>
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

        <div className="space-y-6">
          <ProfitCalculator initialPurchasePrice={flip.purchasePrice} initialRepairCost={flip.repairCost} initialSalePrice={flip.estimatedSalePrice} readOnly />

          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Realizátor</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Jméno</span><span className="font-medium">{flip.dealerName}</span></div>
              {flip.dealerEmail && <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{flip.dealerEmail}</span></div>}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Akce</h3>
            <div className="space-y-3">
              {flip.status === "PENDING_APPROVAL" && (
                <>
                  <Button variant="success" className="w-full" onClick={() => handleAction("approve")} disabled={processing}>Schválit příležitost</Button>
                  <Button variant="danger" className="w-full" onClick={() => handleAction("reject")} disabled={processing}>Zamítnout</Button>
                </>
              )}
              {flip.status === "SOLD" && (
                <Button variant="primary" className="w-full" onClick={() => handleAction("payout")} disabled={processing}>Spustit výplatu</Button>
              )}
              {flip.dealerEmail && (
                <Button variant="outline" className="w-full" onClick={() => window.location.href = `mailto:${flip.dealerEmail}`}>Kontaktovat realizátora</Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
