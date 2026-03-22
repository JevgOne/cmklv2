"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface LoanCalculatorProps {
  vehiclePrice: number;
  vehicleName: string;
}

const INTEREST_RATE = 6.9; // roční úrok v %
const MIN_MONTHS = 12;
const MAX_MONTHS = 84;
const MONTH_STEP = 12;

export function LoanCalculator({ vehiclePrice, vehicleName }: LoanCalculatorProps) {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [months, setMonths] = useState(60);

  const downPayment = Math.round(vehiclePrice * (downPaymentPercent / 100));
  const loanAmount = vehiclePrice - downPayment;

  const monthlyPayment = useMemo(() => {
    if (loanAmount <= 0) return 0;
    const monthlyRate = INTEREST_RATE / 100 / 12;
    const payment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(payment);
  }, [loanAmount, months]);

  const totalPayment = monthlyPayment * months;
  const totalInterest = totalPayment - loanAmount;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">
        Kalkulačka splátek
      </h3>
      <p className="text-xs text-gray-500 mb-5">
        Orientační výpočet. Skutečné podmínky závisí na schválení.
      </p>

      {/* Cena vozu */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Cena vozidla</span>
          <span className="font-bold text-gray-900">
            {new Intl.NumberFormat("cs-CZ").format(vehiclePrice)} Kč
          </span>
        </div>
      </div>

      {/* Akontace slider */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-semibold text-gray-700">Akontace</span>
          <span className="font-bold text-gray-900">
            {new Intl.NumberFormat("cs-CZ").format(downPayment)} Kč ({downPaymentPercent} %)
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={80}
          step={5}
          value={downPaymentPercent}
          onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0 %</span>
          <span>80 %</span>
        </div>
      </div>

      {/* Pocet splátok */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-semibold text-gray-700">Počet splátek</span>
          <span className="font-bold text-gray-900">{months} měsíců</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from(
            { length: (MAX_MONTHS - MIN_MONTHS) / MONTH_STEP + 1 },
            (_, i) => MIN_MONTHS + i * MONTH_STEP
          ).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonths(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors ${
                months === m
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Výsledek */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 mb-5">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Měsíční splátka</p>
          <p className="text-3xl font-extrabold text-gray-900">
            {new Intl.NumberFormat("cs-CZ").format(monthlyPayment)}{" "}
            <span className="text-base font-medium text-gray-400">Kč/měs.</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-orange-200/50">
          <div className="text-center">
            <p className="text-xs text-gray-500">Výše úvěru</p>
            <p className="font-bold text-gray-900 text-sm">
              {new Intl.NumberFormat("cs-CZ").format(loanAmount)} Kč
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Přeplatek</p>
            <p className="font-bold text-gray-900 text-sm">
              {new Intl.NumberFormat("cs-CZ").format(totalInterest)} Kč
            </p>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 text-center mt-3">
          Roční úroková sazba: {INTEREST_RATE} % p.a.
        </p>
      </div>

      {/* CTA */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => {
          window.location.href = `/sluzby/financovani?vehicle=${encodeURIComponent(vehicleName)}&price=${vehiclePrice}&down=${downPayment}&months=${months}`;
        }}
      >
        Nezávazná poptávka financování
      </Button>
    </Card>
  );
}
