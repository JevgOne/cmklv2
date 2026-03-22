"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const brands = [
  { value: "Škoda", label: "Škoda" },
  { value: "Volkswagen", label: "Volkswagen" },
  { value: "BMW", label: "BMW" },
  { value: "Audi", label: "Audi" },
  { value: "Mercedes-Benz", label: "Mercedes-Benz" },
  { value: "Hyundai", label: "Hyundai" },
  { value: "Toyota", label: "Toyota" },
  { value: "Ford", label: "Ford" },
  { value: "Kia", label: "Kia" },
  { value: "Peugeot", label: "Peugeot" },
  { value: "Renault", label: "Renault" },
  { value: "Opel", label: "Opel" },
];

const modelsByBrand: Record<string, { value: string; label: string }[]> = {
  "Škoda": [
    { value: "Octavia", label: "Octavia" },
    { value: "Superb", label: "Superb" },
    { value: "Fabia", label: "Fabia" },
    { value: "Kodiaq", label: "Kodiaq" },
    { value: "Karoq", label: "Karoq" },
    { value: "Scala", label: "Scala" },
  ],
  "Volkswagen": [
    { value: "Golf", label: "Golf" },
    { value: "Passat", label: "Passat" },
    { value: "Tiguan", label: "Tiguan" },
    { value: "Touran", label: "Touran" },
    { value: "Polo", label: "Polo" },
    { value: "T-Roc", label: "T-Roc" },
  ],
  "BMW": [
    { value: "Řada 3", label: "Řada 3" },
    { value: "Řada 5", label: "Řada 5" },
    { value: "X3", label: "X3" },
    { value: "X5", label: "X5" },
    { value: "Řada 1", label: "Řada 1" },
  ],
  "Audi": [
    { value: "A3", label: "A3" },
    { value: "A4", label: "A4" },
    { value: "A6", label: "A6" },
    { value: "Q5", label: "Q5" },
    { value: "Q7", label: "Q7" },
  ],
  "Mercedes-Benz": [
    { value: "C-Třída", label: "C-Třída" },
    { value: "E-Třída", label: "E-Třída" },
    { value: "GLC", label: "GLC" },
    { value: "A-Třída", label: "A-Třída" },
  ],
  "Hyundai": [
    { value: "i30", label: "i30" },
    { value: "Tucson", label: "Tucson" },
    { value: "Kona", label: "Kona" },
  ],
  "Toyota": [
    { value: "Corolla", label: "Corolla" },
    { value: "RAV4", label: "RAV4" },
    { value: "Yaris", label: "Yaris" },
  ],
  "Ford": [
    { value: "Focus", label: "Focus" },
    { value: "Mondeo", label: "Mondeo" },
    { value: "Kuga", label: "Kuga" },
  ],
  "Kia": [
    { value: "Ceed", label: "Ceed" },
    { value: "Sportage", label: "Sportage" },
    { value: "Niro", label: "Niro" },
  ],
  "Peugeot": [
    { value: "308", label: "308" },
    { value: "3008", label: "3008" },
    { value: "208", label: "208" },
  ],
  "Renault": [
    { value: "Mégane", label: "Mégane" },
    { value: "Clio", label: "Clio" },
    { value: "Captur", label: "Captur" },
  ],
  "Opel": [
    { value: "Astra", label: "Astra" },
    { value: "Corsa", label: "Corsa" },
    { value: "Mokka", label: "Mokka" },
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface PartsSearchProps {
  basePath?: string;
}

export function PartsSearch({ basePath = "/shop" }: PartsSearchProps) {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [mode, setMode] = useState<"selects" | "vin">("selects");
  const [loading, setLoading] = useState(false);
  const [resultCount, setResultCount] = useState<number | null>(null);

  const models = brand ? modelsByBrand[brand] ?? [] : [];

  const handleBrandChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setBrand(e.target.value);
      setModel("");
      setResultCount(null);
    },
    [],
  );

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setResultCount(null);

    const params = new URLSearchParams();
    if (mode === "vin") {
      params.set("vin", vin);
    } else {
      if (brand) params.set("brand", brand);
      if (model) params.set("model", model);
      if (year) params.set("year", year);
    }

    try {
      const endpoint = mode === "vin"
        ? `/api/parts/compatible?${params.toString()}`
        : `/api/parts/compatible?${params.toString()}`;

      const res = await fetch(endpoint);
      const data = await res.json();
      setResultCount(data.total ?? 0);

      // Po krátkém zpoždění přesměrovat na katalog s filtry
      setTimeout(() => {
        if (mode === "vin") {
          router.push(`${basePath}/katalog`);
        } else {
          const katalogParams = new URLSearchParams();
          if (brand) katalogParams.set("brand", brand);
          if (model) katalogParams.set("model", model);
          router.push(`${basePath}/katalog?${katalogParams.toString()}`);
        }
      }, 1500);
    } catch {
      setResultCount(0);
    } finally {
      setLoading(false);
    }
  }, [mode, brand, model, year, vin, router]);

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
            setResultCount(null);
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
            setResultCount(null);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              setResultCount(null);
            }}
            disabled={!brand}
          />
          <Select
            label="Rok (nepovinné)"
            placeholder="Rok výroby"
            options={years}
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setResultCount(null);
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
              setResultCount(null);
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
          disabled={!canSearch || loading}
        >
          {loading ? "Hledám..." : "Hledat díly"}
        </Button>
      </div>

      {/* Search result message */}
      {resultCount !== null && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-green-700 font-semibold">
            Nalezeno <span className="font-extrabold">{resultCount}</span>{" "}
            {resultCount === 1 ? "díl" : resultCount < 5 ? "díly" : "dílů"}
            {mode === "vin"
              ? ` pro VIN ${vin.toUpperCase().slice(0, 17)}`
              : ` pro ${brand} ${model}${year ? ` (${year})` : ""}`}
          </p>
        </div>
      )}
    </Card>
  );
}
