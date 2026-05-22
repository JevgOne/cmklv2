"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { STK_PRICES } from "@/lib/stk-pricing";

const QUICK_OPTIONS = [
  { value: "M1", label: "Osobní automobil" },
  { value: "L", label: "Motocykl" },
  { value: "N1", label: "Nákladní do 3,5 t" },
  { value: "O2", label: "Přívěs" },
  { value: "M2", label: "Autobus" },
  { value: "T", label: "Traktor" },
];

function formatPrice(n: number): string {
  return n.toLocaleString("cs-CZ");
}

export function StkPriceCalc() {
  const [selected, setSelected] = useState("M1");

  const row = STK_PRICES.find((p) => p.category === selected) ?? STK_PRICES[1];

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
        Kolik zaplatím za STK?
      </h3>

      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg focus:border-orange-500 focus:bg-white transition cursor-pointer mb-4"
      >
        {QUICK_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <div className="bg-orange-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">STK prohlídka</span>
          <span className="font-bold text-gray-900">{formatPrice(row.stk)} Kč</span>
        </div>
        {row.emise !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Měření emisí</span>
            <span className="font-bold text-gray-900">{formatPrice(row.emise)} Kč</span>
          </div>
        )}
        <div className="border-t border-orange-200 pt-2">
          <div className="flex justify-between">
            <span className="text-sm font-semibold text-gray-700">Celkem</span>
            <span className="font-extrabold text-lg text-orange-600">{formatPrice(row.total)} Kč</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Ceny jsou regulované státem (vyhláška č. 302/2001 Sb.)
      </p>
    </Card>
  );
}
