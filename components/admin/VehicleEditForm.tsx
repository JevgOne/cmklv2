"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface VehicleEditFormProps {
  vehicleId: string;
  initialData: {
    price: number;
    description: string;
    equipment: string;
    condition: string;
  };
  apiUrl?: string;
  redirectUrl?: string;
}

const conditionLabels: Record<string, string> = {
  NEW: "Nové",
  LIKE_NEW: "Jako nové",
  EXCELLENT: "Výborné",
  GOOD: "Dobré",
  FAIR: "Uspokojivé",
  DAMAGED: "Poškozené",
};

export function VehicleEditForm({ vehicleId, initialData, apiUrl, redirectUrl }: VehicleEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [price, setPrice] = useState(initialData.price);
  const [priceReason, setPriceReason] = useState("");
  const [description, setDescription] = useState(initialData.description);
  const [equipment, setEquipment] = useState(initialData.equipment);
  const [condition, setCondition] = useState(initialData.condition);

  const priceChanged = price !== initialData.price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (priceChanged && !priceReason.trim()) {
      setError("Při změně ceny je povinný důvod.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(apiUrl || `/api/manager/vehicles/${vehicleId}`, {
        method: apiUrl ? "PATCH" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price,
          priceReason: priceChanged ? priceReason : undefined,
          description,
          equipment,
          condition,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Chyba při ukládání");
        return;
      }

      router.push(redirectUrl || "/admin/manager/approvals");
      router.refresh();
    } catch {
      setError("Nepodařilo se uložit změny");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
        {/* Cena */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Cena (Kč)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            min={0}
            required
          />
          {priceChanged && (
            <div className="mt-3">
              <label className="block text-sm font-semibold text-warning-500 mb-1.5">
                Důvod změny ceny (povinné)
              </label>
              <input
                type="text"
                value={priceReason}
                onChange={(e) => setPriceReason(e.target.value)}
                className="w-full border border-warning-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                placeholder="Např.: Snížení po dohodě s majitelem"
                required
              />
            </div>
          )}
        </div>

        {/* Popis */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Popis
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Popis vozidla..."
          />
        </div>

        {/* Výbava */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Výbava (JSON)
          </label>
          <textarea
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-xs"
            placeholder='["Klimatizace", "Navigace", "Parkovací kamera"]'
          />
        </div>

        {/* Stav */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Stav
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
          >
            {Object.entries(conditionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Ukládám..." : "Uložit změny"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={saving}
          >
            Zrušit
          </Button>
        </div>
      </form>
    </Card>
  );
}
