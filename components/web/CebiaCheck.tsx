"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface CebiaCheckProps {
  vehicleId: string;
  vin?: string;
  /** Zdarma pro makléřská auta */
  isBrokerListing?: boolean;
}

const CEBIA_PRICE = 499;

type CheckStatus = "idle" | "loading" | "done" | "error";

interface CebiaResult {
  stolen: boolean;
  mileageOk: boolean;
  damageHistory: boolean;
  taxiHistory: boolean;
  leasingHistory: boolean;
  originCountry: string | null;
}

export function CebiaCheck({ vehicleId, vin, isBrokerListing }: CebiaCheckProps) {
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [result, setResult] = useState<CebiaResult | null>(null);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    setStatus("loading");
    setError("");

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/cebia`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.checkoutUrl) {
          // Platební přesměrování pro neověřené
          window.location.href = data.checkoutUrl;
          return;
        }
        setResult(data.result || data);
        setStatus("done");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Nepodařilo se prověřit vozidlo.");
        setStatus("error");
      }
    } catch {
      setError("Chyba připojení.");
      setStatus("error");
    }
  };

  if (status === "done" && result) {
    return (
      <Card className="p-5">
        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          Prověrka historie vozidla
        </h4>
        <div className="space-y-2">
          <CheckRow label="Kradené" ok={!result.stolen} />
          <CheckRow label="Stav tachometru" ok={result.mileageOk} />
          <CheckRow label="Havárie" ok={!result.damageHistory} />
          <CheckRow label="Taxi provoz" ok={!result.taxiHistory} />
          <CheckRow label="Leasing" ok={!result.leasingHistory} />
          {result.originCountry && (
            <div className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-gray-600">Země původu</span>
              <span className="font-semibold text-gray-900">{result.originCountry}</span>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">Prověřit historii vozidla</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {isBrokerListing
              ? "Prověrka zdarma u makléřských vozidel"
              : `Jednorázová cena ${CEBIA_PRICE} Kč`}
          </p>
          {vin && !vin.startsWith("PRIV") && (
            <p className="text-xs text-gray-500 mt-0.5">VIN: {vin}</p>
          )}
        </div>
        <Button
          variant={isBrokerListing ? "primary" : "outline"}
          size="sm"
          onClick={handleCheck}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Prověřuji...
            </span>
          ) : isBrokerListing ? (
            "Prověřit zdarma"
          ) : (
            `Prověřit za ${CEBIA_PRICE} Kč`
          )}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </Card>
  );
}

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${ok ? "text-green-600" : "text-red-500"}`}>
        {ok ? "✓ V pořádku" : "⚠ Zjištěn záznam"}
      </span>
    </div>
  );
}
