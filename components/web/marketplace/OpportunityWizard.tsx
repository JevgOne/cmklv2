"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const wizardSteps = [
  { number: 1, label: "Auto" },
  { number: 2, label: "Oprava" },
  { number: 3, label: "Prodej" },
  { number: 4, label: "Shrnutí" },
];

interface FormData {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  vin: string;
  condition: string;
  photos: string[];
  purchasePrice: number;
  repairDescription: string;
  repairCost: number;
  repairPhotos: string[];
  estimatedSalePrice: number;
}

const initialFormData: FormData = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  mileage: 0,
  vin: "",
  condition: "GOOD",
  photos: [],
  purchasePrice: 0,
  repairDescription: "",
  repairCost: 0,
  repairPhotos: [],
  estimatedSalePrice: 0,
};

export function OpportunityWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return form.brand.length > 0 && form.model.length > 0 && form.year > 1900 && form.mileage >= 0 && form.purchasePrice > 0;
      case 2:
        return form.repairCost >= 0;
      case 3:
        return form.estimatedSalePrice > 0;
      default:
        return true;
    }
  };

  const totalCost = form.purchasePrice + form.repairCost;
  const profit = form.estimatedSalePrice - totalCost;
  const roi = totalCost > 0
    ? ((profit / totalCost) * 100).toFixed(1)
    : "0";

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: form.brand,
          model: form.model,
          year: form.year,
          mileage: form.mileage,
          vin: form.vin || undefined,
          condition: form.condition,
          purchasePrice: form.purchasePrice,
          repairDescription: form.repairDescription,
          repairCost: form.repairCost,
          repairPhotos: form.repairPhotos.length > 0 ? form.repairPhotos : undefined,
          estimatedSalePrice: form.estimatedSalePrice,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chyba při odesílání");
      }
      router.push("/marketplace/dealer");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neočekávaná chyba");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {wizardSteps.map((s, i) => (
          <div key={s.number} className="flex items-center flex-1 last:flex-initial">
            <button
              type="button"
              onClick={() => s.number < step && setStep(s.number)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-none cursor-pointer transition-all",
                step === s.number && "bg-orange-500 text-white shadow-orange",
                step > s.number && "bg-success-500 text-white",
                step < s.number && "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
              disabled={step < s.number}
            >
              {step > s.number ? "✓" : s.number}
            </button>
            {i < wizardSteps.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-2", i < step - 1 ? "bg-success-500" : "bg-gray-200")} />
            )}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {/* Step 1: Auto */}
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="text-xl font-bold text-gray-900">Informace o vozidle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Značka"
                value={form.brand}
                onChange={(e) => updateForm({ brand: e.target.value })}
                placeholder="např. Škoda"
              />
              <Input
                label="Model"
                value={form.model}
                onChange={(e) => updateForm({ model: e.target.value })}
                placeholder="např. Octavia"
              />
              <Input
                label="Rok výroby"
                type="number"
                value={form.year || ""}
                onChange={(e) => updateForm({ year: Number(e.target.value) })}
                min={1990}
                max={new Date().getFullYear() + 1}
              />
              <Input
                label="Najeto (km)"
                type="number"
                value={form.mileage || ""}
                onChange={(e) => updateForm({ mileage: Number(e.target.value) })}
                min={0}
              />
            </div>
            <Input
              label="VIN"
              value={form.vin}
              onChange={(e) => updateForm({ vin: e.target.value })}
              placeholder="17 znaků"
              maxLength={17}
            />
            <Select
              label="Stav vozidla"
              value={form.condition}
              onChange={(e) => updateForm({ condition: e.target.value })}
              options={[
                { value: "EXCELLENT", label: "Výborný" },
                { value: "GOOD", label: "Dobrý" },
                { value: "FAIR", label: "Průměrný" },
                { value: "DAMAGED", label: "Poškozený (na opravu)" },
              ]}
            />
            <Input
              label="Nákupní cena (Kč)"
              type="number"
              value={form.purchasePrice || ""}
              onChange={(e) => updateForm({ purchasePrice: Number(e.target.value) })}
              min={1}
            />
            <div>
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                Fotky vozidla
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <span className="text-3xl block mb-2">📸</span>
                <p className="text-sm text-gray-500">Přetáhněte fotky sem nebo klikněte pro výběr</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, max 10 MB na fotku</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Oprava */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-xl font-bold text-gray-900">Plán opravy</h3>
            <Textarea
              label="Popis plánovaných prací"
              value={form.repairDescription}
              onChange={(e) => updateForm({ repairDescription: e.target.value })}
              placeholder="Popište, co je potřeba opravit, vyměnit, upravit..."
              rows={5}
            />
            <Input
              label="Odhadované náklady na opravu (Kč)"
              type="number"
              value={form.repairCost || ""}
              onChange={(e) => updateForm({ repairCost: Number(e.target.value) })}
              min={0}
            />
            <div>
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                Fotky současného stavu
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <span className="text-3xl block mb-2">📸</span>
                <p className="text-sm text-gray-500">Fotky problematických míst, vad, poškození</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Prodejni odhad */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-xl font-bold text-gray-900">Prodejní odhad</h3>
            <Input
              label="Odhadovaná prodejní cena (Kč)"
              type="number"
              value={form.estimatedSalePrice || ""}
              onChange={(e) => updateForm({ estimatedSalePrice: Number(e.target.value) })}
              min={0}
            />
            <Alert variant="info">
              <span className="text-sm">
                Tip: Zkontrolujte aktuální ceny podobných vozidel na Sauto.cz, Bazošu a TipCars.cz pro realistický odhad.
              </span>
            </Alert>
          </div>
        )}

        {/* Step 4: Shrnuti */}
        {step === 4 && (
          <div className="space-y-5">
            <h3 className="text-xl font-bold text-gray-900">Shrnutí příležitosti</h3>

            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <h4 className="font-bold text-gray-900">Vozidlo</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Značka a model</span>
                <span className="font-medium">{form.brand} {form.model}</span>
                <span className="text-gray-500">Rok</span>
                <span className="font-medium">{form.year}</span>
                <span className="text-gray-500">Najeto</span>
                <span className="font-medium">{form.mileage.toLocaleString("cs-CZ")} km</span>
                <span className="text-gray-500">VIN</span>
                <span className="font-medium font-mono">{form.vin || "—"}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <h4 className="font-bold text-gray-900">Oprava</h4>
              <p className="text-sm text-gray-600">{form.repairDescription || "—"}</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Náklady</span>
                <span className="font-bold">{formatPrice(form.repairCost)}</span>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-5 space-y-3">
              <h4 className="font-bold text-gray-900">Kalkulace</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nákupní cena</span>
                  <span className="font-bold">{formatPrice(form.purchasePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Náklady na opravu</span>
                  <span className="font-bold">{formatPrice(form.repairCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Odhadovaný prodej</span>
                  <span className="font-bold">{formatPrice(form.estimatedSalePrice)}</span>
                </div>
                <div className="flex justify-between border-t border-orange-200 pt-2">
                  <span className="text-gray-600">Odhadovaný zisk</span>
                  <span className={`font-extrabold ${profit >= 0 ? "text-success-500" : "text-error-500"}`}>
                    {formatPrice(profit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ROI</span>
                  <span className="font-bold text-orange-500">{roi}%</span>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="error">
                <span className="text-sm">{error}</span>
              </Alert>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Zpět
            </Button>
          ) : (
            <div />
          )}
          {step < 4 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Pokračovat
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting || !form.brand || !form.model || !form.purchasePrice || !form.estimatedSalePrice}
            >
              {submitting ? "Odesílám..." : "Odeslat příležitost"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
