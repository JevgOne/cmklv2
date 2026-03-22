"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";

interface HandoverChecklistProps {
  vehicleId: string;
  vehicleName: string;
  reservedPrice: number | null;
  originalPrice: number;
}

interface ChecklistItem {
  key: string;
  label: string;
  checked: boolean;
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { key: "sellerPresent", label: "Prodavajici je pritomen", checked: false },
  { key: "buyerPresent", label: "Kupujici je pritomen", checked: false },
  { key: "largeTp", label: "Velky techicky prukaz predan", checked: false },
  { key: "smallTp", label: "Maly technicky prukaz predan", checked: false },
  { key: "keys", label: "Klice predany", checked: false },
  { key: "serviceBook", label: "Servisni knizka predana", checked: false },
  { key: "conditionOk", label: "Stav vozidla odpovida popisu", checked: false },
  { key: "paymentDone", label: "Platba provedena", checked: false },
];

const PAYMENT_METHODS = [
  { value: "CASH", label: "Hotovost" },
  { value: "BANK_TRANSFER", label: "Bankovni prevod" },
  { value: "FINANCING", label: "Financovani / uver" },
];

export function HandoverChecklist({ vehicleId, vehicleName, reservedPrice, originalPrice }: HandoverChecklistProps) {
  const router = useRouter();

  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [keysCount, setKeysCount] = useState("2");
  const [actualPrice, setActualPrice] = useState(
    String(reservedPrice || originalPrice)
  );
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [commissionAmount, setCommissionAmount] = useState<number | null>(null);

  const toggleItem = (key: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const allChecked = checklist.every((item) => item.checked);
  const checkedCount = checklist.filter((item) => item.checked).length;

  const handleSubmit = async () => {
    if (!allChecked) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/handover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklist: Object.fromEntries(
            checklist.map((item) => [item.key, item.checked])
          ),
          keysCount: parseInt(keysCount),
          actualSalePrice: parseInt(actualPrice),
          paymentMethod,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodarilo se potvrdit predani");
      }

      const data = await res.json();
      setCommissionAmount(data.commission || null);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodarilo se potvrdit");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-green-600">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
          Predani dokonceno!
        </h2>
        <p className="text-gray-500 mb-2">
          Vozidlo {vehicleName} bylo uspesne predano.
        </p>

        {commissionAmount && (
          <Card className="p-4 mt-4 w-full max-w-sm bg-orange-50 border border-orange-200">
            <p className="text-sm text-gray-600">Vase provize</p>
            <p className="text-3xl font-extrabold text-orange-600 mt-1">
              {formatPrice(commissionAmount)}
            </p>
          </Card>
        )}

        <div className="flex flex-col gap-3 w-full max-w-sm mt-8">
          <Button
            variant="primary"
            onClick={() => router.push("/makler/dashboard")}
          >
            Zpet na dashboard
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push("/makler/commissions")}
          >
            Zobrazit provize
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${(checkedCount / checklist.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-gray-600">
          {checkedCount}/{checklist.length}
        </span>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {checklist.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => toggleItem(item.key)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              item.checked
                ? "bg-green-50 border-green-300"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                item.checked
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300"
              }`}
            >
              {item.checked && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span
              className={`text-sm font-medium ${
                item.checked ? "text-green-700" : "text-gray-700"
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Pocet klicu */}
      <Input
        label="Pocet klicu"
        type="number"
        min="1"
        max="5"
        value={keysCount}
        onChange={(e) => setKeysCount(e.target.value)}
      />

      {/* Skutecna prodejni cena */}
      <div>
        <Input
          label="Skutecna prodejni cena (Kc)"
          type="number"
          value={actualPrice}
          onChange={(e) => setActualPrice(e.target.value)}
          required
        />
        {actualPrice && (
          <p className="text-xs text-gray-500 mt-1">
            {formatPrice(parseInt(actualPrice) || 0)}
            {reservedPrice && parseInt(actualPrice) !== reservedPrice && (
              <span className="text-orange-500 ml-2">
                (dohodnuto: {formatPrice(reservedPrice)})
              </span>
            )}
          </p>
        )}
      </div>

      {/* Zpusob platby */}
      <Select
        label="Zpusob platby"
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        options={PAYMENT_METHODS}
      />

      {/* Link na predavaci protokol */}
      <Card className="p-4 bg-gray-50">
        <p className="text-sm text-gray-600">
          Predavaci protokol bude vygenerovan automaticky po potvrzeni predani.
        </p>
      </Card>

      {/* Submit */}
      <Button
        variant="success"
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        disabled={!allChecked || submitting || !actualPrice}
      >
        {submitting ? "Potvrzuji..." : "Potvrdit predani vozidla"}
      </Button>

      {!allChecked && (
        <p className="text-xs text-center text-gray-400">
          Pro potvrzeni predani je nutne odskrtnout vsechny body
        </p>
      )}
    </div>
  );
}
