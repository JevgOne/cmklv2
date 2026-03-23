"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

const INSTALLMENT_OPTIONS = [12, 24, 36, 48, 60, 72];
const DEFAULT_RATE = 5.9; // %

export function FinancingCalculator() {
  const [price, setPrice] = useState<number>(500000);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [months, setMonths] = useState<number>(60);
  const [rate, setRate] = useState<number>(DEFAULT_RATE);

  const result = useMemo(() => {
    const downPayment = Math.round(price * (downPaymentPct / 100));
    const loanAmount = price - downPayment;

    if (loanAmount <= 0 || months <= 0 || rate <= 0) {
      return {
        downPayment,
        loanAmount: 0,
        monthlyPayment: 0,
        totalPaid: downPayment,
        overpayment: 0,
      };
    }

    const monthlyRate = rate / 100 / 12;
    const monthlyPayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

    const totalPaid = downPayment + monthlyPayment * months;
    const overpayment = totalPaid - price;

    return {
      downPayment,
      loanAmount,
      monthlyPayment: Math.round(monthlyPayment),
      totalPaid: Math.round(totalPaid),
      overpayment: Math.round(overpayment),
    };
  }, [price, downPaymentPct, months, rate]);

  return (
    <div className="space-y-6">
      {/* Vstupy */}
      <Card className="p-4 space-y-5">
        {/* Cena vozu */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Cena vozu
          </label>
          <div className="relative">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              min={0}
              step={10000}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              Kč
            </span>
          </div>
        </div>

        {/* Akontace */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-bold text-gray-900">Akontace</label>
            <span className="text-sm font-bold text-orange-500">
              {downPaymentPct}% ({formatPrice(Math.round(price * (downPaymentPct / 100)))})
            </span>
          </div>
          <input
            type="range"
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(Number(e.target.value))}
            min={0}
            max={50}
            step={5}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>50%</span>
          </div>
        </div>

        {/* Počet splátek */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Počet splátek
          </label>
          <div className="grid grid-cols-3 gap-2">
            {INSTALLMENT_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`py-2 rounded-xl text-sm font-bold transition-all ${
                  months === m
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {m} měs.
              </button>
            ))}
          </div>
        </div>

        {/* Úroková sazba */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Úroková sazba (% p.a.)
          </label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            min={0}
            max={30}
            step={0.1}
          />
        </div>
      </Card>

      {/* Výsledky */}
      <Card className="p-4 space-y-4">
        <h3 className="font-extrabold text-gray-900">Výpočet</h3>

        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <p className="text-xs text-orange-600 font-medium mb-1">
            Měsíční splátka
          </p>
          <p className="text-3xl font-extrabold text-orange-600">
            {formatPrice(result.monthlyPayment)}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Akontace</span>
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(result.downPayment)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Výše úvěru</span>
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(result.loanAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Celkem zaplaceno</span>
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(result.totalPaid)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-500">Přeplatek</span>
            <span className="text-sm font-bold text-red-500">
              +{formatPrice(result.overpayment)}
            </span>
          </div>
        </div>
      </Card>

      {/* CTA */}
      <Button variant="primary" className="w-full" disabled>
        Poslat nabídku kupujícímu
      </Button>
      <p className="text-xs text-gray-400 text-center">
        Integrace s emailovým systémem připravujeme
      </p>
    </div>
  );
}
