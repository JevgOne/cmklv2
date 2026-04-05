"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import type { ListingFormData } from "./ListingFormWizard";

interface Step5Props {
  data: ListingFormData;
  updateData: (updates: Partial<ListingFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const cities = [
  "Praha", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc",
  "České Budějovice", "Hradec Králové", "Pardubice", "Zlín",
  "Karlovy Vary", "Jihlava", "Ústí nad Labem", "Jiné",
];

const vatOptions = [
  { value: "", label: "Neuvedeno" },
  { value: "DEDUCTIBLE", label: "DPH odečitatelná" },
  { value: "NON_DEDUCTIBLE", label: "DPH neodečitatelná" },
  { value: "MARGIN_SCHEME", label: "Zvláštní režim DPH" },
];

export function Step5PriceContact({ data, updateData, onNext, onPrev }: Step5Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof ListingFormData, value: string | boolean) => {
    updateData({ [key]: value });
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const formatPrice = (value: string): string => {
    const num = value.replace(/\D/g, "");
    return num;
  };

  const displayPrice = data.price
    ? new Intl.NumberFormat("cs-CZ").format(Number(data.price))
    : "";

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!data.price && !data.priceNegotiable) errs.price = "Vyplňte cenu";
    if (!data.city) errs.city = "Vyberte město";
    if (data.description && data.description.length < 50) {
      errs.description = `Popis musí mít alespoň 50 znaků (${data.description.length}/50)`;
    }
    if (!data.contactName.trim()) errs.contactName = "Vyplňte jméno";
    if (!data.contactPhone.trim()) errs.contactPhone = "Vyplňte telefon";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <Card className="p-6 md:p-8">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Cena a kontakt</h2>

      {/* Price section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Cena</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Cena (Kč)"
              placeholder="Např. 350 000"
              value={data.price}
              onChange={(e) => update("price", formatPrice(e.target.value))}
              error={errors.price}
            />
            {displayPrice && (
              <span className="text-xs text-gray-500 mt-1 block">
                {displayPrice} Kč
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3 justify-center">
            <Checkbox
              label="Cena k jednání"
              checked={data.priceNegotiable}
              onChange={(e) => update("priceNegotiable", e.target.checked)}
            />
          </div>
        </div>

        <Select
          label="DPH"
          options={vatOptions}
          value={data.vatStatus}
          onChange={(e) => update("vatStatus", e.target.value)}
        />
      </div>

      {/* Location */}
      <div className="mt-6 border-t border-gray-200 pt-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Lokace</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Město"
            placeholder="Vyberte město"
            options={cities.map((c) => ({ value: c, label: c }))}
            value={data.city}
            onChange={(e) => update("city", e.target.value)}
            error={errors.city}
          />
          <Input
            label="Městská část"
            placeholder="Např. Praha 5"
            value={data.district}
            onChange={(e) => update("district", e.target.value)}
          />
        </div>
      </div>

      {/* Description */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <Textarea
          label="Popis inzerátu"
          placeholder="Popište stav vozidla, historii, důvod prodeje... (min. 50 znaků)"
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
          error={errors.description}
        />
        <span className="text-xs text-gray-400 mt-1 block">
          {data.description.length} / 50 min. znaků
        </span>
      </div>

      {/* Contact */}
      <div className="mt-6 border-t border-gray-200 pt-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Kontaktní údaje</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Jméno"
            placeholder="Vaše jméno"
            value={data.contactName}
            onChange={(e) => update("contactName", e.target.value)}
            error={errors.contactName}
          />
          <Input
            label="Telefon"
            type="tel"
            placeholder="+420 xxx xxx xxx"
            value={data.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
            error={errors.contactPhone}
          />
          <Input
            label="Email"
            type="email"
            placeholder="vas@email.cz"
            value={data.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            className="sm:col-span-2"
          />
        </div>
      </div>

      {/* Broker help */}
      <div className="mt-6 p-4 bg-orange-50 rounded-xl">
        <Checkbox
          label="Chci pomoc od makléře Carmakler"
          checked={data.wantsBrokerHelp}
          onChange={(e) => update("wantsBrokerHelp", e.target.checked)}
        />
        <p className="text-xs text-gray-500 mt-2 ml-8">
          Certifikovaný makléř vám pomůže s prodejem vozu. Bez závazku, pouze provize z úspěšného prodeje.
        </p>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={onPrev}>
          &larr; Zpět
        </Button>
        <Button variant="primary" onClick={handleNext}>
          Pokračovat na náhled &rarr;
        </Button>
      </div>
    </Card>
  );
}
