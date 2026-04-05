"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

interface CommissionItem {
  id: string;
  salePrice: number;
  commission: number;
  brokerShare: number | null;
  status: string;
  soldAt: string;
  vehicle: {
    id: string;
    name: string;
    price: number;
  } | null;
}

interface PayoutData {
  id: string;
  period: string;
  totalAmount: number;
  status: string;
  invoiceUrl: string | null;
  invoiceNumber: string | null;
  paidAt: string | null;
  createdAt: string;
  commissions: CommissionItem[];
}

interface BrokerPayoutsContentProps {
  payouts: PayoutData[];
}

const statusConfig: Record<string, { label: string; variant: "pending" | "verified" | "top" | "default" }> = {
  PENDING_INVOICE: { label: "K fakturaci", variant: "pending" },
  INVOICE_UPLOADED: { label: "Faktura nahrána", variant: "default" },
  APPROVED: { label: "Schváleno", variant: "verified" },
  PAID: { label: "Vyplaceno", variant: "top" },
};

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const monthNames = [
    "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
    "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
  ];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

export function BrokerPayoutsContent({ payouts }: BrokerPayoutsContentProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleUploadInvoice = async (payoutId: string, file: File) => {
    setUploadingId(payoutId);
    try {
      // Upload file to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "invoices");
      formData.append("subfolder", payoutId);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Chyba při nahrávání souboru");

      const uploadData = await uploadRes.json();
      const invoiceUrl = uploadData.url;

      // Submit invoice URL
      const res = await fetch(`/api/payouts/broker/${payoutId}/upload-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceUrl,
          invoiceNumber: file.name.replace(/\.[^.]+$/, ""),
        }),
      });

      if (!res.ok) throw new Error("Chyba při odesílání faktury");

      window.location.reload();
    } catch {
      // Error handled silently, reload will show current state
    } finally {
      setUploadingId(null);
    }
  };

  if (payouts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-400 text-sm">Zatím žádné výplaty provizí</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {payouts.map((payout) => {
        const config = statusConfig[payout.status] || { label: payout.status, variant: "default" as const };
        const isExpanded = expandedId === payout.id;

        return (
          <Card key={payout.id} className="overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : payout.id)}
              className="w-full p-4 text-left bg-white border-none cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">{formatPeriod(payout.period)}</h3>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {payout.commissions.length}{" "}
                  {payout.commissions.length === 1
                    ? "provize"
                    : payout.commissions.length < 5
                    ? "provize"
                    : "provizi"}
                </div>
                <div className="text-lg font-extrabold text-gray-900">
                  {formatPrice(payout.totalAmount)}
                </div>
              </div>
              {payout.paidAt && (
                <p className="text-xs text-green-600 mt-1">
                  Vyplaceno {new Date(payout.paidAt).toLocaleDateString("cs-CZ")}
                </p>
              )}
            </button>

            {/* Upload invoice */}
            {(payout.status === "PENDING_INVOICE" || payout.status === "INVOICE_UPLOADED") && (
              <div className="px-4 pb-3">
                <label className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={uploadingId === payout.id}
                  >
                    {uploadingId === payout.id
                      ? "Nahrávám..."
                      : payout.status === "INVOICE_UPLOADED"
                      ? "Nahrát novou fakturu"
                      : "Nahrát fakturu"}
                  </Button>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadInvoice(payout.id, file);
                    }}
                  />
                </label>
                {payout.invoiceNumber && (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Nahraná faktura: {payout.invoiceNumber}
                  </p>
                )}
              </div>
            )}

            {/* Expanded detail */}
            {isExpanded && payout.commissions.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Detaily provizi
                </p>
                <div className="space-y-2">
                  {payout.commissions.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {c.vehicle?.name || "Neznámý vůz"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Prodejní cena: {formatPrice(c.salePrice)} | Provize: {formatPrice(c.commission)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(c.soldAt).toLocaleDateString("cs-CZ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {formatPrice(c.brokerShare ?? Math.round(c.commission / 2))}
                        </p>
                        <p className="text-xs text-gray-400">váš podíl</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
