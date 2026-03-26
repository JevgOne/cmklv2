"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";

interface PriceHistoryEntry {
  date: string;
  price: number;
  previousPrice: number | null;
  label: string;
}

interface PriceHistoryData {
  vehicleId: string;
  currentPrice: number;
  history: PriceHistoryEntry[];
  hasChanges: boolean;
}

interface VehiclePriceHistoryProps {
  vehicleId: string;
}

export function VehiclePriceHistory({ vehicleId }: VehiclePriceHistoryProps) {
  const [data, setData] = useState<PriceHistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPriceHistory() {
      try {
        const res = await fetch(`/api/vehicles/${vehicleId}/price-history`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchPriceHistory();
  }, [vehicleId]);

  if (loading || !data || !data.hasChanges) return null;

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">Cenová historie</h3>
      <Card className="p-4">
        <div className="space-y-3">
          {data.history.map((entry, index) => {
            const change =
              entry.previousPrice !== null
                ? entry.price - entry.previousPrice
                : null;
            const isDecrease = change !== null && change < 0;
            const isIncrease = change !== null && change > 0;

            return (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <p className="text-gray-700 font-medium">{entry.label}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.date).toLocaleDateString("cs-CZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatPrice(entry.price)}
                  </p>
                  {change !== null && (
                    <p
                      className={`text-xs font-medium ${
                        isDecrease
                          ? "text-red-600"
                          : isIncrease
                            ? "text-green-600"
                            : "text-gray-400"
                      }`}
                    >
                      {isIncrease ? "+" : ""}
                      {formatPrice(change)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
