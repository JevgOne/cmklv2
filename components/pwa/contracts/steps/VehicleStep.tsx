"use client";

import { useState, useEffect } from "react";
import { formatPrice, formatMileage } from "@/lib/utils";

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  variant: string | null;
  year: number;
  mileage: number;
  vin: string;
  price: number;
  condition: string;
  fuelType: string;
  transmission: string;
  enginePower: number | null;
  color: string | null;
  sellerName: string | null;
  sellerPhone: string | null;
  sellerEmail: string | null;
  commission: number | null;
}

interface VehicleStepProps {
  brokerId: string;
  selectedVehicleId: string | null;
  onSelect: (vehicle: VehicleData) => void;
}

export function VehicleStep({
  brokerId,
  selectedVehicleId,
  onSelect,
}: VehicleStepProps) {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const res = await fetch(
          `/api/vehicles?brokerId=${brokerId}&status=all&limit=100`
        );
        if (!res.ok) throw new Error("Chyba při načítání vozidel");
        const data = await res.json();
        setVehicles(
          data.vehicles.map(
            (v: Record<string, unknown>) => ({
              id: v.id,
              brand: v.brand,
              model: v.model,
              variant: v.variant,
              year: v.year,
              mileage: v.mileage,
              vin: v.vin,
              price: v.price,
              condition: v.condition,
              fuelType: v.fuelType,
              transmission: v.transmission,
              enginePower: v.enginePower,
              color: v.color,
              sellerName: v.sellerName,
              sellerPhone: v.sellerPhone,
              sellerEmail: v.sellerEmail,
              commission: v.commission,
            })
          )
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Chyba při načítání"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchVehicles();
  }, [brokerId]);

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 bg-gray-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="p-6 text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          🚗
        </div>
        <h3 className="font-bold text-gray-900 mb-2">
          Žádná vozidla
        </h3>
        <p className="text-sm text-gray-500">
          Nejprve přidejte vozidlo do systému.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3">
      <p className="text-gray-500 text-sm mb-4">
        Vyberte vozidlo, ke kterému se smlouva vztahuje.
      </p>

      {vehicles.map((v) => (
        <button
          key={v.id}
          onClick={() => onSelect(v)}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
            selectedVehicleId === v.id
              ? "border-orange-500 bg-orange-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-5 h-5 text-gray-500"
              >
                <path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-gray-900 text-sm truncate">
                  {v.brand} {v.model} {v.variant || ""}
                </h3>
                <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                  {formatPrice(v.price)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">
                  {v.year} / {formatMileage(v.mileage)}
                </span>
                <span className="text-xs text-gray-400">
                  VIN: {v.vin.slice(-6)}
                </span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
