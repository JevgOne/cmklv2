"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import type { ListingFormData } from "./ListingFormWizard";

interface Step1Props {
  data: ListingFormData;
  updateData: (updates: Partial<ListingFormData>) => void;
  onNext: () => void;
}

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

export function Step1Vin({ data, updateData, onNext }: Step1Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const vinValid = VIN_REGEX.test(data.vin);

  const handleDecode = async () => {
    if (!vinValid) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/vin/decode?vin=${encodeURIComponent(data.vin)}`);
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Nepodařilo se dekódovat VIN");
        return;
      }

      updateData({
        vinDecoded: true,
        vinData: result,
        brand: result.brand || data.brand,
        model: result.model || data.model,
        variant: result.variant || data.variant,
        year: result.year ? String(result.year) : data.year,
        fuelType: result.fuelType || data.fuelType,
        transmission: result.transmission || data.transmission,
        enginePower: result.enginePower ? String(result.enginePower) : data.enginePower,
        engineCapacity: result.engineCapacity ? String(result.engineCapacity) : data.engineCapacity,
        bodyType: result.bodyType || data.bodyType,
        drivetrain: result.drivetrain || data.drivetrain,
        doorsCount: result.doorsCount ? String(result.doorsCount) : data.doorsCount,
        seatsCount: result.seatsCount ? String(result.seatsCount) : data.seatsCount,
        equipment: result.equipment || data.equipment,
      });
    } catch {
      setError("Chyba při dekódování VIN. Zkuste to znovu.");
    } finally {
      setLoading(false);
    }
  };

  const handleVinChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);
    updateData({ vin: cleaned, vinDecoded: false, vinData: null });
    setError("");
  };

  return (
    <Card className="p-6 md:p-8">
      <h2 className="text-lg font-bold text-gray-900 mb-2">VIN kód vozidla</h2>
      <p className="text-sm text-gray-500 mb-6">
        Zadejte VIN pro automatické vyplnění údajů. Můžete také přeskočit a vyplnit vše ručně.
      </p>

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input
            label="VIN (17 znaků)"
            placeholder="Např. TMBAG7NE1J0123456"
            value={data.vin}
            onChange={(e) => handleVinChange(e.target.value)}
            error={data.vin.length > 0 && !vinValid ? "VIN musí mít přesně 17 znaků (bez I, O, Q)" : undefined}
          />
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={handleDecode}
          disabled={!vinValid || loading}
          className="mb-0.5"
        >
          {loading ? "Dekóduji..." : "Dekódovat"}
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      {data.vinDecoded && data.vinData && (
        <div className="mt-6 p-4 bg-success-50 rounded-xl">
          <h3 className="text-sm font-bold text-success-600 mb-3">VIN dekódován</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {data.vinData.brand && (
              <div>
                <span className="text-gray-500">Značka:</span>{" "}
                <span className="font-semibold text-gray-900">{data.vinData.brand}</span>
              </div>
            )}
            {data.vinData.model && (
              <div>
                <span className="text-gray-500">Model:</span>{" "}
                <span className="font-semibold text-gray-900">{data.vinData.model}</span>
              </div>
            )}
            {data.vinData.year && (
              <div>
                <span className="text-gray-500">Rok:</span>{" "}
                <span className="font-semibold text-gray-900">{data.vinData.year}</span>
              </div>
            )}
            {data.vinData.fuelType && (
              <div>
                <span className="text-gray-500">Palivo:</span>{" "}
                <span className="font-semibold text-gray-900">{data.vinData.fuelType}</span>
              </div>
            )}
            {data.vinData.transmission && (
              <div>
                <span className="text-gray-500">Převodovka:</span>{" "}
                <span className="font-semibold text-gray-900">{data.vinData.transmission}</span>
              </div>
            )}
            {data.vinData.enginePower && (
              <div>
                <span className="text-gray-500">Výkon:</span>{" "}
                <span className="font-semibold text-gray-900">{data.vinData.enginePower} kW</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={onNext}>
          Přeskočit VIN
        </Button>
        <Button variant="primary" onClick={onNext}>
          Pokračovat &rarr;
        </Button>
      </div>
    </Card>
  );
}
