"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";
import { formatPrice } from "@/lib/utils";

export interface InvestModalProps {
  open: boolean;
  onClose: () => void;
  opportunityId: string;
  brand: string;
  model: string;
  neededAmount: number;
  fundedAmount: number;
  estimatedRoi: number;
}

export function InvestModal({
  open,
  onClose,
  opportunityId,
  brand,
  model,
  neededAmount,
  fundedAmount,
  estimatedRoi,
}: InvestModalProps) {
  const [amount, setAmount] = useState<number>(50000);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const remainingAmount = neededAmount - fundedAmount;
  const maxAmount = Math.max(remainingAmount, 0);
  const clampedAmount = Math.min(amount, maxAmount);
  const investorShare = clampedAmount > 0 && neededAmount > 0 ? ((clampedAmount / neededAmount) * 100).toFixed(1) : "0";
  const expectedReturn = Math.round(clampedAmount * (1 + estimatedRoi / 100));
  const expectedProfit = expectedReturn - clampedAmount;

  const variableSymbol = `MP${opportunityId.slice(0, 8).toUpperCase()}`;

  const handleSubmit = async () => {
    if (clampedAmount < 10000 || !agreed) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/marketplace/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId, amount: clampedAmount }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Modal open={open} onClose={onClose} title="Investice odeslana" className="max-w-[480px]">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ✓
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Dekujeme za vasi investici!
          </h3>
          <p className="text-gray-500 mb-6">
            Prosim proved&#39;te platbu na ucet nize. Po overeni platby bude vase investice aktivovana.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Castka</span>
              <span className="font-bold">{formatPrice(clampedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Cislo uctu</span>
              <span className="font-bold">2701234567/0800</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Variabilni symbol</span>
              <span className="font-bold">{variableSymbol}</span>
            </div>
          </div>
          <div className="mt-6">
            <Button variant="primary" onClick={onClose} className="w-full">
              Rozumim
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={`Investovat do ${brand} ${model}`} className="max-w-[480px]">
      <div className="space-y-5">
        {/* Amount input */}
        <Input
          label="Castka investice (Kc)"
          type="number"
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value))}
          min={10000}
          max={maxAmount}
          error={amount < 10000 ? "Minimalni castka je 10 000 Kc" : undefined}
        />

        <Alert variant="info">
          <span className="text-sm">Zbyvajici castka k financovani: <strong>{formatPrice(remainingAmount)}</strong></span>
        </Alert>

        {/* Calculation */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-bold text-gray-900">Predpokladany vynos</h4>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Vase investice</span>
            <span className="font-semibold">{formatPrice(clampedAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Odhadovany ROI</span>
            <span className="font-semibold text-orange-500">{estimatedRoi}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Predpokladany vynos</span>
            <span className="font-bold text-success-500">{formatPrice(expectedProfit)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="text-sm text-gray-500">Celkem vraceno</span>
            <span className="font-extrabold text-gray-900">{formatPrice(expectedReturn)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Vas podil</span>
            <span className="font-semibold">{investorShare}%</span>
          </div>
        </div>

        {/* Agreement */}
        <Checkbox
          label="Souhlasim s podminkami investovani a jsem si vedom/a rizik"
          checked={agreed}
          onChange={() => setAgreed(!agreed)}
        />

        {/* Submit */}
        <Button
          variant="primary"
          className="w-full"
          disabled={clampedAmount < 10000 || !agreed || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Odesilam..." : `Investovat ${formatPrice(clampedAmount)}`}
        </Button>
      </div>
    </Modal>
  );
}
