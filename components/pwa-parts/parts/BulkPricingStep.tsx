"use client";

import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import type { SelectedPart } from "./PartsFilterStep";

export interface PricedPart extends SelectedPart {
  price: number;
  priceByAgreement: boolean;
  photo?: string;
}

interface BulkPricingStepProps {
  parts: PricedPart[];
  onPartsChange: (parts: PricedPart[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BulkPricingStep({
  parts,
  onPartsChange,
  onNext,
  onBack,
}: BulkPricingStepProps) {
  const updatePart = (index: number, updates: Partial<PricedPart>) => {
    onPartsChange(
      parts.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  };

  const applyBulkAdjust = (factor: number) => {
    onPartsChange(
      parts.map((p) => ({
        ...p,
        price: p.priceByAgreement
          ? p.price
          : Math.round((p.price * factor) / 100) * 100,
      }))
    );
  };

  const roundAll = () => {
    onPartsChange(
      parts.map((p) => ({
        ...p,
        price: Math.round(p.price / 100) * 100,
      }))
    );
  };

  const totalValue = parts.reduce(
    (sum, p) => sum + (p.priceByAgreement ? 0 : p.price),
    0
  );

  const allPriced = parts.every((p) => p.priceByAgreement || p.price > 0);

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Nastavte ceny</h2>
        <span className="text-sm text-gray-500">Krok 6 / 8</span>
      </div>

      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-gray-500">{parts.length} dílů</span>
        <span className="font-bold text-gray-900">
          Celkem: {formatPrice(totalValue)}
        </span>
      </div>

      {/* Bulk actions */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => applyBulkAdjust(1.2)}
          className="text-xs px-2.5 py-1 rounded-full border border-gray-300 hover:bg-gray-50"
        >
          Vše +20%
        </button>
        <button
          onClick={() => applyBulkAdjust(0.8)}
          className="text-xs px-2.5 py-1 rounded-full border border-gray-300 hover:bg-gray-50"
        >
          Vše -20%
        </button>
        <button
          onClick={roundAll}
          className="text-xs px-2.5 py-1 rounded-full border border-gray-300 hover:bg-gray-50"
        >
          Zaokrouhlit na 100
        </button>
      </div>

      {/* Parts list */}
      <div className="space-y-3">
        {parts.map((part, i) => (
          <div
            key={part.articleId}
            className="border border-gray-200 rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                {part.name}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">
                {part.grade}
              </span>
            </div>

            <div className="text-xs text-gray-500">
              Doporučená: {formatPrice(part.suggestedPrice[part.grade])}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="number"
                  value={part.priceByAgreement ? "" : part.price || ""}
                  onChange={(e) =>
                    updatePart(i, { price: parseInt(e.target.value) || 0 })
                  }
                  disabled={part.priceByAgreement}
                  placeholder={
                    part.priceByAgreement
                      ? "Dohodou"
                      : part.suggestedPrice[part.grade].toString()
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
                <span className="text-xs text-gray-500 flex-shrink-0">Kč</span>
              </div>
              <label className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={part.priceByAgreement}
                  onChange={(e) =>
                    updatePart(i, { priceByAgreement: e.target.checked })
                  }
                  className="w-3.5 h-3.5 rounded border-gray-300 text-orange-500"
                />
                Dohodou
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Zpět
        </button>
        <Button
          variant="primary"
          size="sm"
          disabled={!allPriced}
          onClick={onNext}
        >
          Pokračovat
        </Button>
      </div>
    </div>
  );
}
