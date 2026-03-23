"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

interface PendingPayment {
  id: string;
  investorName: string;
  amount: number;
  opportunityLabel: string;
  variableSymbol: string;
  createdAt: string;
}

export interface PaymentConfirmationProps {
  payments: PendingPayment[];
}

export function PaymentConfirmation({ payments }: PaymentConfirmationProps) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  const handleConfirm = async (paymentId: string, variableSymbol: string) => {
    setConfirming(paymentId);
    try {
      await fetch(`/api/marketplace/investments/${paymentId}/confirm-payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReference: variableSymbol }),
      });
      window.location.reload();
    } finally {
      setConfirming(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!confirm("Opravdu chcete zamítnout tuto platbu?")) return;
    setRejecting(paymentId);
    try {
      await fetch(`/api/marketplace/investments/${paymentId}/confirm-payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejected: true }),
      });
      window.location.reload();
    } finally {
      setRejecting(null);
    }
  };

  if (payments.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">Žádné platby nečekají na ověření.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">
                Investor
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">
                Příležitost
              </th>
              <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">
                Částka
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">
                VS
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">
                Datum
              </th>
              <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">
                Akce
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.investorName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{payment.opportunityLabel}</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">{formatPrice(payment.amount)}</td>
                <td className="px-6 py-4 text-sm font-mono text-gray-600">{payment.variableSymbol}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{payment.createdAt}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleConfirm(payment.id, payment.variableSymbol)}
                      disabled={confirming === payment.id}
                    >
                      {confirming === payment.id ? "..." : "Potvrdit"}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(payment.id)}
                      disabled={rejecting === payment.id}
                    >
                      {rejecting === payment.id ? "..." : "Zamítnout"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
