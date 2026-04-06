"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatPrice } from "@/lib/utils";

export interface ProfitCalculatorProps {
  initialPurchasePrice?: number;
  initialRepairCost?: number;
  initialSalePrice?: number;
  readOnly?: boolean;
  className?: string;
}

export function ProfitCalculator({
  initialPurchasePrice = 0,
  initialRepairCost = 0,
  initialSalePrice = 0,
  readOnly = false,
  className,
}: ProfitCalculatorProps) {
  const [purchasePrice, setPurchasePrice] = useState(initialPurchasePrice);
  const [repairCost, setRepairCost] = useState(initialRepairCost);
  const [salePrice, setSalePrice] = useState(initialSalePrice);

  const totalCost = purchasePrice + repairCost;
  const totalProfit = salePrice - totalCost;
  const roi = totalCost > 0 ? ((totalProfit / totalCost) * 100).toFixed(1) : "0";
  const investorShare = Math.round(totalProfit * 0.4);
  const dealerShare = Math.round(totalProfit * 0.4);
  const platformShare = Math.round(totalProfit * 0.2);

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

        {/* Profit split */}
        {totalProfit > 0 && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-3">Rozdělení zisku</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                  <span className="text-sm text-gray-600">Investor (40%)</span>
                </div>
                <span className="font-bold text-gray-900">{formatPrice(investorShare)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-info-500" />
                  <span className="text-sm text-gray-600">Realizátor (40%)</span>
                </div>
                <span className="font-bold text-gray-900">{formatPrice(dealerShare)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm text-gray-600">CarMakléř (20%)</span>
                </div>
                <span className="font-bold text-gray-900">{formatPrice(platformShare)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
