"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { KTypeResult } from "@/lib/tecdoc";

export interface VehicleData {
  vin: string;
  kTypeId: number | null;
  brand: string;
  model: string;
  year: number | null;
  variant: string | null;
  engine: string | null;
  fuel: string | null;
  transmission: string | null;
}

interface DonorVehicleStepProps {
  vehicleData: VehicleData | null;
  onVehicleConfirmed: (data: VehicleData) => void;
  onBack: () => void;
}

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

export function DonorVehicleStep({
  vehicleData,
  onVehicleConfirmed,
  onBack,
}: DonorVehicleStepProps) {
  const [vin, setVin] = useState(vehicleData?.vin ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KTypeResult | null>(null);
  const [error, setError] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({
    brand: vehicleData?.brand ?? "",
    model: vehicleData?.model ?? "",
    year: vehicleData?.year?.toString() ?? "",
  });

  const handleLookup = async () => {
    if (!VIN_REGEX.test(vin)) {
      setError("VIN musí mít přesně 17 znaků (bez I, O, Q)");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/tecdoc/vin-to-ktype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: vin.toUpperCase() }),
      });

      if (!res.ok) {
        setError("Nepodařilo se načíst VIN");
        return;
      }

      const data = await res.json();
      if (data.vehicle) {
        setResult(data.vehicle);
      } else {
        setError("VIN nebyl rozpoznán. Zkuste zadat údaje ručně.");
        setShowManual(true);
      }
    } catch {
      setError("Chyba spojení. Zkuste to znovu.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVin = () => {
    if (!result) return;
    onVehicleConfirmed({
      vin: vin.toUpperCase(),
      kTypeId: result.kTypeId,
      brand: result.brand,
      model: result.model,
      year: result.year,
      variant: result.variant,
      engine: result.engine,
      fuel: result.fuel,
      transmission: result.transmission,
    });
  };

  const handleManualSubmit = () => {
    if (!manual.brand || !manual.model) {
      setError("Značka a model jsou povinné");
      return;
    }
    onVehicleConfirmed({
      vin: vin.toUpperCase() || "MANUAL",
      kTypeId: null,
      brand: manual.brand,
      model: manual.model,
      year: manual.year ? parseInt(manual.year) : null,
      variant: null,
      engine: null,
      fuel: null,
      transmission: null,
    });
  };

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Zdrojové vozidlo</h2>
        <span className="text-sm text-gray-500">Krok 1 / 8</span>
      </div>

      {/* VIN input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VIN kód
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={vin}
              onChange={(e) => {
                setVin(e.target.value.toUpperCase());
                setError("");
                setResult(null);
              }}
              placeholder="TMBAG7NE2L0123456"
              maxLength={17}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono uppercase tracking-wider focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleLookup}
              disabled={loading || vin.length < 17}
            >
              {loading ? "..." : "Načíst"}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            VIN najdete v technickém průkazu nebo na štítku u předních dveří
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* VIN result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 text-green-600"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-bold text-green-800">Rozpoznáno</span>
            </div>
            <div className="text-gray-900">
              <div className="text-lg font-bold">
                {result.brand} {result.model}
                {result.year && ` (${result.year})`}
              </div>
              {result.variant && (
                <div className="text-sm text-gray-600 mt-0.5">
                  {result.variant}
                </div>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-2">
                {result.engine && <span>Motor: {result.engine}</span>}
                {result.fuel && <span>Palivo: {result.fuel}</span>}
                {result.transmission && <span>Převod: {result.transmission}</span>}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="primary" size="sm" onClick={handleConfirmVin}>
                Ano, souhlasí
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResult(null);
                  setVin("");
                }}
              >
                Zadat jiný VIN
              </Button>
            </div>
          </div>
        )}

        {/* Divider */}
        {!result && (
          <>
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm text-gray-500">
                  nebo
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowManual(true)}
              className="w-full text-center text-sm text-orange-600 font-medium hover:text-orange-700"
            >
              Zadat ručně (bez VIN)
            </button>
          </>
        )}

        {/* Manual entry */}
        {showManual && !result && (
          <div className="space-y-3 border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700">Ruční zadání</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Značka *
              </label>
              <input
                type="text"
                value={manual.brand}
                onChange={(e) =>
                  setManual({ ...manual, brand: e.target.value })
                }
                placeholder="Škoda"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Model *
              </label>
              <input
                type="text"
                value={manual.model}
                onChange={(e) =>
                  setManual({ ...manual, model: e.target.value })
                }
                placeholder="Octavia III"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Rok výroby
              </label>
              <input
                type="number"
                value={manual.year}
                onChange={(e) =>
                  setManual({ ...manual, year: e.target.value })
                }
                placeholder="2019"
                min={1900}
                max={2100}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualSubmit}
              className="w-full"
            >
              Pokračovat
            </Button>
          </div>
        )}
      </div>

      {/* Back */}
      <div className="mt-8">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Zpět na výběr
        </button>
      </div>
    </div>
  );
}
