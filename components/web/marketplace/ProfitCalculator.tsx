"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatPrice } from "@/lib/utils";

export interface ProfitCalculatorProps {
  initialPurchasePrice?: number;
  initialRepairCost?: number;
  initialSalePrice?: number;
  /** Dohodnutý split — pokud existuje, slider je disabled */
  agreedDealerSharePct?: number | null;
  /** CarMakléř fee v procentech z prodejní ceny */
  carmaklerFeePct?: number;
  readOnly?: boolean;
  className?: string;
}

export function ProfitCalculator({
  initialPurchasePrice = 0,
  initialRepairCost = 0,
  initialSalePrice = 0,
  agreedDealerSharePct = null,
  carmaklerFeePct = 5,
  readOnly = false,
  className,
}: ProfitCalculatorProps) {
  const [purchasePrice, setPurchasePrice] = useState(initialPurchasePrice);
  const [repairCost, setRepairCost] = useState(initialRepairCost);
  const [salePrice, setSalePrice] = useState(initialSalePrice);
  const [dealerPct, setDealerPct] = useState(agreedDealerSharePct ?? 50);

  const isLocked = agreedDealerSharePct !== null && agreedDealerSharePct !== undefined;
  const activeDealerPct = isLocked ? agreedDealerSharePct : dealerPct;
  const investorPct = 100 - activeDealerPct;

  const totalCost = purchasePrice + repairCost;
  const totalProfit = salePrice - totalCost;
  const roi = totalCost > 0 ? ((totalProfit / totalCost) * 100).toFixed(1) : "0";

  // Nový model: CarMakléř fee = % z prodejní ceny, zbytek se dělí dealer/investor
  const carmaklerFee = Math.round(salePrice * (carmaklerFeePct / 100));
  const distributableProfit = Math.max(0, totalProfit - carmaklerFee);
  const dealerShare = Math.round(distributableProfit * (activeDealerPct / 100));
  const investorShare = distributableProfit - dealerShare;

  return (
    <Card className={className}>
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Kalkulace zisku</h3>

        {!readOnly ? (
          <div className="space-y-4 mb-6">
            <Input
              label="Nákupní cena (Kč)"
              type="number"
              value={purchasePrice || ""}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              min={0}
            />
            <Input
              label="Náklady na opravu (Kč)"
              type="number"
              value={repairCost || ""}
              onChange={(e) => setRepairCost(Number(e.target.value))}
              min={0}
            />
            <Input
              label="Odhadovaná prodejní cena (Kč)"
              type="number"
              value={salePrice || ""}
              onChange={(e) => setSalePrice(Number(e.target.value))}
              min={0}
            />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-[11px] font-semibold text-gray-500 uppercase">Nákup</div>
              <div className="text-sm font-bold text-gray-900 mt-1">{formatPrice(purchasePrice)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-[11px] font-semibold text-gray-500 uppercase">Oprava</div>
              <div className="text-sm font-bold text-gray-900 mt-1">{formatPrice(repairCost)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-[11px] font-semibold text-gray-500 uppercase">Prodej</div>
              <div className="text-sm font-bold text-success-500 mt-1">{formatPrice(salePrice)}</div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Celkové náklady</span>
            <span className="font-bold text-gray-900">{formatPrice(totalCost)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Celkový zisk</span>
            <span className={`font-extrabold text-lg ${totalProfit >= 0 ? "text-success-500" : "text-error-500"}`}>
              {formatPrice(totalProfit)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">ROI</span>
            <span className="font-bold text-orange-500">{roi}%</span>
          </div>
        </div>

        {/* Slider — dělení zisku */}
        {totalProfit > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-gray-900">Dělení zisku</h4>
              {isLocked && (
                <span className="text-xs font-semibold text-success-500 bg-success-50 px-2 py-0.5 rounded-full">
                  Dohodnuto
                </span>
              )}
            </div>

            {/* Slider */}
            <div className="mb-4">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={activeDealerPct}
                onChange={(e) => setDealerPct(Number(e.target.value))}
                disabled={isLocked}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Dealer {activeDealerPct}%</span>
                <span>Investor {investorPct}%</span>
              </div>
            </div>

            {/* Profit split breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm text-gray-600">CarMakléř ({carmaklerFeePct}% z ceny)</span>
                </div>
                <span className="font-bold text-gray-900">{formatPrice(carmaklerFee)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-info-500" />
                  <span className="text-sm text-gray-600">Dealer ({activeDealerPct}%)</span>
                </div>
                <span className="font-bold text-gray-900">{formatPrice(dealerShare)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                  <span className="text-sm text-gray-600">Investor ({investorPct}%)</span>
                </div>
                <span className="font-bold text-gray-900">{formatPrice(investorShare)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
