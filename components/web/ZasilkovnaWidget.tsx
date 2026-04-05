"use client";

import { useCallback } from "react";
import Script from "next/script";

// Packeta Widget API (v6)
declare global {
  interface Window {
    Packeta?: {
      Widget: {
        pick: (
          apiKey: string,
          callback: (point: PacketaPoint | null) => void,
          options?: Record<string, unknown>
        ) => void;
      };
    };
  }
}

interface PacketaPoint {
  id: number;
  name: string;
  zip: string;
  city: string;
  street: string;
  openingHours: string;
  photo?: string;
}

interface ZasilkovnaWidgetProps {
  onSelect: (point: { id: string; name: string; address: string }) => void;
  selectedPoint?: { id: string; name: string; address: string } | null;
}

export function ZasilkovnaWidget({ onSelect, selectedPoint }: ZasilkovnaWidgetProps) {
  const apiKey = process.env.NEXT_PUBLIC_ZASILKOVNA_API_KEY;

  const openPicker = useCallback(() => {
    if (!window.Packeta || !apiKey) return;

    window.Packeta.Widget.pick(
      apiKey,
      (point) => {
        if (point) {
          onSelect({
            id: String(point.id),
            name: point.name,
            address: `${point.street}, ${point.zip} ${point.city}`,
          });
        }
      },
      {
        country: "cz",
        language: "cs",
        appIdentity: "carmakler-eshop",
      }
    );
  }, [apiKey, onSelect]);

  return (
    <>
      <Script
        src="https://widget.packeta.com/v6/www/js/library.js"
        strategy="lazyOnload"
      />

      {selectedPoint ? (
        <div className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-start justify-between">
          <div>
            <p className="font-semibold text-sm text-gray-900">{selectedPoint.name}</p>
            <p className="text-sm text-gray-600">{selectedPoint.address}</p>
          </div>
          <button
            type="button"
            onClick={openPicker}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Změnit
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 hover:bg-orange-50 transition-colors"
        >
          <span className="text-orange-600 font-semibold">Vybrat výdejní místo</span>
          <span className="block text-sm text-gray-500 mt-1">
            8 000+ míst po celé ČR
          </span>
        </button>
      )}
    </>
  );
}
