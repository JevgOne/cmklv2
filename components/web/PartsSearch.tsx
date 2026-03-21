"use client";

import { useState, useCallback } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

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
    { value: "scala", label: "Scala" },
  ],
  vw: [
    { value: "golf", label: "Golf" },
    { value: "passat", label: "Passat" },
    { value: "tiguan", label: "Tiguan" },
    { value: "touran", label: "Touran" },
    { value: "polo", label: "Polo" },
    { value: "t-roc", label: "T-Roc" },
  ],
  bmw: [
    { value: "3-series", label: "Řada 3" },
    { value: "5-series", label: "Řada 5" },
    { value: "x3", label: "X3" },
    { value: "x5", label: "X5" },
    { value: "1-series", label: "Řada 1" },
  ],
  audi: [
    { value: "a3", label: "A3" },
    { value: "a4", label: "A4" },
    { value: "a6", label: "A6" },
    { value: "q5", label: "Q5" },
    { value: "q7", label: "Q7" },
  ],
  mercedes: [
    { value: "c-class", label: "C-Třída" },
    { value: "e-class", label: "E-Třída" },
    { value: "glc", label: "GLC" },
    { value: "a-class", label: "A-Třída" },
  ],
  hyundai: [
    { value: "i30", label: "i30" },
    { value: "tucson", label: "Tucson" },
    { value: "kona", label: "Kona" },
  ],
  toyota: [
    { value: "corolla", label: "Corolla" },
    { value: "rav4", label: "RAV4" },
    { value: "yaris", label: "Yaris" },
  ],
  ford: [
    { value: "focus", label: "Focus" },
    { value: "mondeo", label: "Mondeo" },
    { value: "kuga", label: "Kuga" },
  ],
  kia: [
    { value: "ceed", label: "Ceed" },
    { value: "sportage", label: "Sportage" },
    { value: "niro", label: "Niro" },
  ],
  peugeot: [
    { value: "308", label: "308" },
    { value: "3008", label: "3008" },
    { value: "208", label: "208" },
  ],
  renault: [
    { value: "megane", label: "Mégane" },
    { value: "clio", label: "Clio" },
    { value: "captur", label: "Captur" },
  ],
  opel: [
    { value: "astra", label: "Astra" },
    { value: "corsa", label: "Corsa" },
    { value: "mokka", label: "Mokka" },
  ],
};

function generateYears() {
  const years: { value: string; label: string }[] = [];
  for (let y = 2025; y >= 2000; y--) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

const years = generateYears();

const engines = [
  { value: "1.0-tsi", label: "1.0 TSI" },
  { value: "1.4-tsi", label: "1.4 TSI" },
  { value: "1.5-tsi", label: "1.5 TSI" },
  { value: "2.0-tsi", label: "2.0 TSI" },
  { value: "1.6-tdi", label: "1.6 TDI" },
  { value: "2.0-tdi", label: "2.0 TDI" },
  { value: "2.0-tfsi", label: "2.0 TFSI" },
  { value: "3.0-tdi", label: "3.0 TDI" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PartsSearch() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [vin, setVin] = useState("");
  const [searched, setSearched] = useState(false);
  const [mode, setMode] = useState<"selects" | "vin">("selects");

  const models = brand ? modelsByBrand[brand] ?? [] : [];

  const brandLabel = brands.find((b) => b.value === brand)?.label ?? "";
  const modelLabel = models.find((m) => m.value === model)?.label ?? "";

  const handleBrandChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setBrand(e.target.value);
      setModel("");
      setEngine("");
      setSearched(false);
    },
    [],
  );

  const handleSearch = useCallback(() => {
    setSearched(true);
  }, []);

  const canSearch =
    mode === "vin" ? vin.length >= 10 : brand !== "" && model !== "";

  return (
    <Card className="p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-6">
        Najděte díly pro váš vůz
      </h2>

      {/* Mode switch */}
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("selects");
            setSearched(false);
          }}
          className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-colors border-none ${
            mode === "selects"
              ? "bg-orange-100 text-orange-600"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          Výběr vozu
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("vin");
            setSearched(false);
          }}
          className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-colors border-none ${
            mode === "vin"
              ? "bg-orange-100 text-orange-600"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          Zadejte VIN
        </button>
      </div>

      {mode === "selects" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Značka"
            placeholder="Vyberte značku"
            options={brands}
            value={brand}
            onChange={handleBrandChange}
          />
          <Select
            label="Model"
            placeholder="Vyberte model"
            options={models}
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setSearched(false);
            }}
            disabled={!brand}
          />
          <Select
            label="Rok"
            placeholder="Rok výroby"
            options={years}
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setSearched(false);
            }}
          />
          <Select
            label="Motor (nepovinné)"
            placeholder="Vyberte motor"
            options={engines}
            value={engine}
            onChange={(e) => {
              setEngine(e.target.value);
              setSearched(false);
            }}
          />
        </div>
      ) : (
        <div className="max-w-lg">
          <Input
            label="VIN kód"
            placeholder="Zadejte 17-ti místný VIN kód"
            value={vin}
            onChange={(e) => {
              setVin(e.target.value);
              setSearched(false);
            }}
            maxLength={17}
          />
          <p className="text-xs text-gray-400 mt-2">
            VIN najdete v technickém průkazu nebo na štítku ve dveřích řidiče
          </p>
        </div>
      )}

      <div className="mt-6">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSearch}
          disabled={!canSearch}
        >
          Hledat díly
        </Button>
      </div>

      {/* Search result message */}
      {searched && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-green-700 font-semibold">
            {mode === "vin" ? (
              <>
                Nalezeno <span className="font-extrabold">47</span> dílů pro
                VIN {vin.toUpperCase().slice(0, 17)}
              </>
            ) : (
              <>
                Nalezeno <span className="font-extrabold">47</span> dílů pro{" "}
                {brandLabel} {modelLabel}
                {year ? ` (${year})` : ""}
              </>
            )}
          </p>
        </div>
      )}
    </Card>
  );
}
