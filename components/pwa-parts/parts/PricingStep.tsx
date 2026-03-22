"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import type { PartDetails } from "./DetailsStep";

export interface PricingData {
  price: string;
  vatIncluded: boolean;
  quantity: string;
  deliveryOptions: string[];
}

const deliveryOptions = [
  { value: "PICKUP", label: "Osobní odběr" },
  { value: "ZASILKOVNA", label: "Zásilkovna" },
  { value: "PPL", label: "PPL" },
  { value: "CESKA_POSTA", label: "Česká pošta" },
];

const categoryLabels: Record<string, string> = {
  MOTOR: "Motor",
  TRANSMISSION: "Převodovka",
  BODYWORK: "Karoserie",
  INTERIOR: "Interiér",
  ELECTRO: "Elektro",
  SUSPENSION: "Podvozek",
  BRAKES: "Brzdy",
  EXHAUST: "Výfuk",
  AC: "Klimatizace",
  LIGHTS: "Osvětlení",
  OTHER: "Ostatní",
};

const conditionLabels: Record<string, string> = {
  FUNCTIONAL: "Plně funkční",
  FUNCTIONAL_WITH_DEFECT: "Funkční s vadou",
  FOR_PARTS: "Na díly",
};

export function PricingStep({
  pricing,
  onPricingChange,
  details,
  photos,
  onBack,
  onPublish,
  submitting,
}: {
  pricing: PricingData;
  onPricingChange: (pricing: PricingData) => void;
  details: PartDetails;
  photos: string[];
  onBack: () => void;
  onPublish: () => void;
  submitting: boolean;
}) {
  const [showPreview, setShowPreview] = useState(false);

  const update = (field: keyof PricingData, value: string | boolean | string[]) => {
    onPricingChange({ ...pricing, [field]: value });
  };

  const toggleDelivery = (value: string) => {
    const current = pricing.deliveryOptions;
    if (current.includes(value)) {
      update("deliveryOptions", current.filter((v) => v !== value));
    } else {
      update("deliveryOptions", [...current, value]);
    }
  };

  const isValid =
    pricing.price !== "" &&
    parseInt(pricing.price) > 0 &&
    pricing.deliveryOptions.length > 0;

  return (
    <div className="p-4 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Cena a publikace</h2>
        <p className="text-sm text-gray-500 mt-1">
          Nastavte cenu a způsob doručení
        </p>
      </div>

      <Input
        label="Cena (Kč) *"
        type="number"
        value={pricing.price}
        onChange={(e) => update("price", e.target.value)}
        placeholder="0"
      />

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={pricing.vatIncluded}
            onChange={() => update("vatIncluded", true)}
            className="w-4 h-4 accent-green-500"
          />
          <span className="text-sm text-gray-700">S DPH</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!pricing.vatIncluded}
            onChange={() => update("vatIncluded", false)}
            className="w-4 h-4 accent-green-500"
          />
          <span className="text-sm text-gray-700">Bez DPH</span>
        </label>
      </div>

      <Input
        label="Množství na skladě"
        type="number"
        value={pricing.quantity}
        onChange={(e) => update("quantity", e.target.value)}
        placeholder="1"
      />

      {/* Delivery */}
      <div className="space-y-3">
        <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
          Způsob doručení *
        </label>
        {deliveryOptions.map((opt) => (
          <Checkbox
            key={opt.value}
            label={opt.label}
            checked={pricing.deliveryOptions.includes(opt.value)}
            onChange={() => toggleDelivery(opt.value)}
          />
        ))}
      </div>

      {/* Preview toggle */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="text-green-600 font-semibold text-sm cursor-pointer bg-transparent border-none"
      >
        {showPreview ? "Skrýt náhled" : "Zobrazit náhled"}
      </button>

      {/* Preview card */}
      {showPreview && (
        <Card className="overflow-hidden">
          {photos[0] && (
            <div className="aspect-video bg-gray-100">
              <img
                src={photos[0]}
                alt="Náhled"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default">
                {categoryLabels[details.category] ?? details.category}
              </Badge>
              <Badge variant="verified">
                {conditionLabels[details.condition] ?? details.condition}
              </Badge>
            </div>
            <h4 className="font-bold text-gray-900 mt-2">{details.name || "Název dílu"}</h4>
            {details.compatibility[0]?.brand && (
              <p className="text-xs text-gray-500 mt-1">
                {details.compatibility[0].brand} {details.compatibility[0].model}{" "}
                {details.compatibility[0].yearFrom && `(${details.compatibility[0].yearFrom}`}
                {details.compatibility[0].yearTo && `-${details.compatibility[0].yearTo})`}
              </p>
            )}
            <div className="text-xl font-extrabold text-gray-900 mt-3">
              {pricing.price ? formatPrice(parseInt(pricing.price)) : "0 Kč"}
            </div>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" size="lg" onClick={onBack} className="flex-1">
          Zpět
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1 bg-gradient-to-br from-green-500 to-green-600"
          onClick={onPublish}
          disabled={!isValid || submitting}
        >
          {submitting ? "Publikuji..." : "Publikovat díl"}
        </Button>
      </div>
    </div>
  );
}
