"use client";

import { useEffect, useState } from "react";

interface PriceEntry {
  date: string;
  price: number;
  previousPrice: number | null;
  label: string;
}

interface PriceHistoryData {
  currentPrice: number;
  history: PriceEntry[];
  hasChanges: boolean;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("cs-CZ").format(price);
}

export function PriceHistory({ vehicleId }: { vehicleId: string }) {
  const [data, setData] = useState<PriceHistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vehicles/${vehicleId}/price-history`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.hasChanges) return null;

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Cenová historie
      </h3>

      {/* Price change summary bar */}
      {data.history.length >= 2 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
          {(() => {
            const first = data.history[0];
            const last = data.history[data.history.length - 1];
            const diff = last.price - first.price;
            const isDown = diff < 0;
            return (
              <>
                <span className={`text-lg font-bold ${isDown ? "text-green-600" : "text-red-500"}`}>
                  {isDown ? "\u2193" : "\u2191"} {formatPrice(Math.abs(diff))} Kč
                </span>
                <span className="text-sm text-gray-500">
                  od prvního uvedení
                </span>
              </>
            );
          })()}
        </div>
      )}

      {/* History list */}
      <div className="space-y-3">
        {data.history.map((entry, i) => {
          const date = new Date(entry.date);
          const formattedDate = date.toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });

          const isDecrease =
            entry.previousPrice !== null && entry.price < entry.previousPrice;
          const isIncrease =
            entry.previousPrice !== null && entry.price > entry.previousPrice;

          return (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {entry.label}
                </div>
                <div className="text-xs text-gray-500">{formattedDate}</div>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-bold ${
                    isDecrease
                      ? "text-green-600"
                      : isIncrease
                        ? "text-red-500"
                        : "text-gray-900"
                  }`}
                >
                  {formatPrice(entry.price)} Kč
                </div>
                {entry.previousPrice !== null && (
                  <div className="text-xs text-gray-400 line-through">
                    {formatPrice(entry.previousPrice)} Kč
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
