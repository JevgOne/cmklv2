"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface CompatibilityEntry {
  brand: string;
  model: string;
  yearFrom: string;
  yearTo: string;
}

const brands = [
  { value: "skoda", label: "Škoda" },
  { value: "vw", label: "Volkswagen" },
  { value: "bmw", label: "BMW" },
  { value: "audi", label: "Audi" },
  { value: "mercedes", label: "Mercedes-Benz" },
  { value: "hyundai", label: "Hyundai" },
  { value: "toyota", label: "Toyota" },
  { value: "ford", label: "Ford" },
  { value: "kia", label: "Kia" },
  { value: "peugeot", label: "Peugeot" },
  { value: "renault", label: "Renault" },
  { value: "opel", label: "Opel" },
];

const modelsByBrand: Record<string, { value: string; label: string }[]> = {
  skoda: [
    { value: "octavia", label: "Octavia" },
    { value: "superb", label: "Superb" },
    { value: "fabia", label: "Fabia" },
    { value: "kodiaq", label: "Kodiaq" },
    { value: "karoq", label: "Karoq" },
  ],
  vw: [
    { value: "golf", label: "Golf" },
    { value: "passat", label: "Passat" },
    { value: "tiguan", label: "Tiguan" },
    { value: "polo", label: "Polo" },
  ],
  bmw: [
    { value: "3-series", label: "Řada 3" },
    { value: "5-series", label: "Řada 5" },
    { value: "x3", label: "X3" },
    { value: "x5", label: "X5" },
  ],
  audi: [
    { value: "a3", label: "A3" },
    { value: "a4", label: "A4" },
    { value: "a6", label: "A6" },
    { value: "q5", label: "Q5" },
  ],
  mercedes: [
    { value: "c-class", label: "C-Třída" },
    { value: "e-class", label: "E-Třída" },
  ],
  hyundai: [
    { value: "i30", label: "i30" },
    { value: "tucson", label: "Tucson" },
  ],
  toyota: [
    { value: "corolla", label: "Corolla" },
    { value: "rav4", label: "RAV4" },
  ],
  ford: [
    { value: "focus", label: "Focus" },
    { value: "mondeo", label: "Mondeo" },
  ],
  kia: [
    { value: "ceed", label: "Ceed" },
    { value: "sportage", label: "Sportage" },
  ],
  peugeot: [
    { value: "308", label: "308" },
    { value: "3008", label: "3008" },
  ],
  renault: [
    { value: "megane", label: "Mégane" },
    { value: "clio", label: "Clio" },
  ],
  opel: [
    { value: "astra", label: "Astra" },
    { value: "corsa", label: "Corsa" },
  ],
};

export function CompatibilitySelector({
  entries,
  onChange,
}: {
  entries: CompatibilityEntry[];
  onChange: (entries: CompatibilityEntry[]) => void;
}) {
  const addEntry = () => {
    onChange([...entries, { brand: "", model: "", yearFrom: "", yearTo: "" }]);
  };

  const updateEntry = (index: number, field: keyof CompatibilityEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "brand") {
      updated[index].model = "";
    }
    onChange(updated);
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
        Kompatibilita *
      </label>

      {entries.map((entry, i) => {
        const models = entry.brand ? modelsByBrand[entry.brand] ?? [] : [];
        return (
          <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                Vůz {i + 1}
              </span>
              {entries.length > 1 && (
                <button
                  onClick={() => removeEntry(i)}
                  className="text-xs text-red-500 font-medium cursor-pointer bg-transparent border-none"
                >
                  Odebrat
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                placeholder="Značka"
                options={brands}
                value={entry.brand}
                onChange={(e) => updateEntry(i, "brand", e.target.value)}
              />
              <Select
                placeholder="Model"
                options={models}
                value={entry.model}
                onChange={(e) => updateEntry(i, "model", e.target.value)}
                disabled={!entry.brand}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Rok od"
                type="number"
                value={entry.yearFrom}
                onChange={(e) => updateEntry(i, "yearFrom", e.target.value)}
              />
              <Input
                placeholder="Rok do"
                type="number"
                value={entry.yearTo}
                onChange={(e) => updateEntry(i, "yearTo", e.target.value)}
              />
            </div>
          </div>
        );
      })}

      <Button
        variant="ghost"
        size="sm"
        onClick={addEntry}
        className="text-green-600"
      >
        + Přidat další vůz
      </Button>
    </div>
  );
}
