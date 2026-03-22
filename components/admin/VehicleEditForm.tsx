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
}

const conditionLabels: Record<string, string> = {
  NEW: "Nove",
  LIKE_NEW: "Jako nove",
  EXCELLENT: "Vyborne",
  GOOD: "Dobre",
  FAIR: "Uspokojive",
  DAMAGED: "Poskozene",
};

export function VehicleEditForm({ vehicleId, initialData }: VehicleEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [price, setPrice] = useState(initialData.price);
  const [priceReason, setPriceReason] = useState("");
  const [description, setDescription] = useState(initialData.description);
  const [equipment, setEquipment] = useState(initialData.equipment);
  const [condition, setCondition] = useState(initialData.condition);

  const priceChanged = price !== initialData.price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (priceChanged && !priceReason.trim()) {
      alert("Pri zmene ceny je povinny duvod.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/manager/vehicles/${vehicleId}`, {
        method: "PUT",
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
        alert(data.error || "Chyba pri ukladani");
        return;
      }

      router.push("/admin/manager/approvals");
      router.refresh();
    } catch {
      alert("Nepodarilo se ulozit zmeny");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cena */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Cena (Kc)
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
                Duvod zmeny ceny (povinne)
              </label>
              <input
                type="text"
                value={priceReason}
                onChange={(e) => setPriceReason(e.target.value)}
                className="w-full border border-warning-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                placeholder="Napr.: Snizeni po dohode s majitelem"
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
            Vybava (JSON)
          </label>
          <textarea
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-xs"
            placeholder='["Klimatizace", "Navigace", "Parkovaci kamera"]'
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
            {saving ? "Ukladam..." : "Ulozit zmeny"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={saving}
          >
            Zrusit
          </Button>
        </div>
      </form>
    </Card>
  );
}
