"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import type { ListingFormData } from "./ListingFormWizard";
import { useState } from "react";

interface Step2Props {
  data: ListingFormData;
  updateData: (updates: Partial<ListingFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const brands = [
  "Audi", "BMW", "Citroën", "Dacia", "Fiat", "Ford", "Honda", "Hyundai",
  "Kia", "Mazda", "Mercedes-Benz", "Nissan", "Opel", "Peugeot", "Renault",
  "Seat", "Škoda", "Toyota", "Volkswagen", "Volvo", "Jiná",
];

const fuelTypes = [
  { value: "PETROL", label: "Benzín" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Elektro" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "PLUGIN_HYBRID", label: "Plug-in Hybrid" },
  { value: "LPG", label: "LPG" },
  { value: "CNG", label: "CNG" },
];

const transmissions = [
  { value: "MANUAL", label: "Manuální" },
  { value: "AUTOMATIC", label: "Automatická" },
  { value: "DSG", label: "DSG" },
  { value: "CVT", label: "CVT" },
];

const bodyTypes = [
  { value: "SEDAN", label: "Sedan" },
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "COMBI", label: "Kombi" },
  { value: "SUV", label: "SUV" },
  { value: "COUPE", label: "Coupé" },
  { value: "CABRIO", label: "Kabriolet" },
  { value: "VAN", label: "Van / MPV" },
  { value: "PICKUP", label: "Pickup" },
];

const drivetrains = [
  { value: "FRONT", label: "Přední" },
  { value: "REAR", label: "Zadní" },
  { value: "4x4", label: "4x4" },
];

const conditions = [
  { value: "NEW", label: "Nové" },
  { value: "LIKE_NEW", label: "Jako nové" },
  { value: "EXCELLENT", label: "Výborný" },
  { value: "GOOD", label: "Dobrý" },
  { value: "FAIR", label: "Uspokojivý" },
  { value: "DAMAGED", label: "Poškozené" },
];

const colors = [
  "Bílá", "Černá", "Šedá", "Stříbrná", "Modrá", "Červená",
  "Zelená", "Hnědá", "Béžová", "Žlutá", "Oranžová", "Jiná",
];

const years = Array.from({ length: 27 }, (_, i) => ({
  value: String(2026 - i),
  label: String(2026 - i),
}));

export function Step2Details({ data, updateData, onNext, onPrev }: Step2Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isReadonly = data.vinDecoded;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!data.brand) errs.brand = "Vyberte značku";
    if (!data.model.trim()) errs.model = "Vyplňte model";
    if (!data.year) errs.year = "Vyberte rok";
    if (!data.fuelType) errs.fuelType = "Vyberte palivo";
    if (!data.transmission) errs.transmission = "Vyberte převodovku";
    if (!data.mileage) errs.mileage = "Vyplňte nájezd";
    if (!data.condition) errs.condition = "Vyberte stav";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

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

  return (
    <Card className="p-6 md:p-8">
      <h2 className="text-lg font-bold text-gray-900 mb-2">Údaje o voze</h2>
      <p className="text-sm text-gray-500 mb-6">
        {isReadonly
          ? "Údaje byly předvyplněny z VIN. Doplňte zbývající pole."
          : "Vyplňte údaje o vozidle."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Značka"
          placeholder="Vyberte značku"
          options={brands.map((b) => ({ value: b, label: b }))}
          value={data.brand}
          onChange={(e) => update("brand", e.target.value)}
          error={errors.brand}
          disabled={isReadonly && !!data.brand}
        />

        <Input
          label="Model"
          placeholder="Např. Octavia, Fabia..."
          value={data.model}
          onChange={(e) => update("model", e.target.value)}
          error={errors.model}
          readOnly={isReadonly && !!data.model}
        />

        <Input
          label="Varianta"
          placeholder="Např. 1.6 TDI Style"
          value={data.variant}
          onChange={(e) => update("variant", e.target.value)}
          readOnly={isReadonly && !!data.variant}
        />

        <Select
          label="Rok výroby"
          placeholder="Vyberte rok"
          options={years}
          value={data.year}
          onChange={(e) => update("year", e.target.value)}
          error={errors.year}
          disabled={isReadonly && !!data.year}
        />

        <Select
          label="Karoserie"
          placeholder="Typ karoserie"
          options={bodyTypes}
          value={data.bodyType}
          onChange={(e) => update("bodyType", e.target.value)}
          disabled={isReadonly && !!data.bodyType}
        />

        <Select
          label="Palivo"
          placeholder="Typ paliva"
          options={fuelTypes}
          value={data.fuelType}
          onChange={(e) => update("fuelType", e.target.value)}
          error={errors.fuelType}
          disabled={isReadonly && !!data.fuelType}
        />

        <Input
          label="Objem (ccm)"
          placeholder="Např. 1968"
          type="number"
          min={0}
          value={data.engineCapacity}
          onChange={(e) => update("engineCapacity", e.target.value)}
          readOnly={isReadonly && !!data.engineCapacity}
        />

        <Input
          label="Výkon (kW)"
          placeholder="Např. 110"
          type="number"
          min={0}
          value={data.enginePower}
          onChange={(e) => update("enginePower", e.target.value)}
          readOnly={isReadonly && !!data.enginePower}
        />

        <Select
          label="Převodovka"
          placeholder="Typ převodovky"
          options={transmissions}
          value={data.transmission}
          onChange={(e) => update("transmission", e.target.value)}
          error={errors.transmission}
          disabled={isReadonly && !!data.transmission}
        />

        <Select
          label="Pohon"
          placeholder="Typ pohonu"
          options={drivetrains}
          value={data.drivetrain}
          onChange={(e) => update("drivetrain", e.target.value)}
          disabled={isReadonly && !!data.drivetrain}
        />

        <Select
          label="Barva"
          placeholder="Barva vozu"
          options={colors.map((c) => ({ value: c, label: c }))}
          value={data.color}
          onChange={(e) => update("color", e.target.value)}
        />

        <Input
          label="Počet dveří"
          type="number"
          min={2}
          max={5}
          placeholder="Např. 5"
          value={data.doorsCount}
          onChange={(e) => update("doorsCount", e.target.value)}
          readOnly={isReadonly && !!data.doorsCount}
        />

        <Input
          label="Počet sedadel"
          type="number"
          min={2}
          max={9}
          placeholder="Např. 5"
          value={data.seatsCount}
          onChange={(e) => update("seatsCount", e.target.value)}
          readOnly={isReadonly && !!data.seatsCount}
        />

        <Input
          label="Nájezd (km)"
          placeholder="Např. 45000"
          type="number"
          min={0}
          value={data.mileage}
          onChange={(e) => update("mileage", e.target.value)}
          error={errors.mileage}
        />

        <Select
          label="Stav vozidla"
          placeholder="Vyberte stav"
          options={conditions}
          value={data.condition}
          onChange={(e) => update("condition", e.target.value)}
          error={errors.condition}
        />

        <Input
          label="Počet majitelů"
          type="number"
          min={1}
          placeholder="Např. 2"
          value={data.ownerCount}
          onChange={(e) => update("ownerCount", e.target.value)}
        />

        <Input
          label="STK platná do"
          type="date"
          value={data.stkValidUntil}
          onChange={(e) => update("stkValidUntil", e.target.value)}
        />
      </div>

      <div className="mt-4">
        <Checkbox
          label="Servisní knížka"
          checked={data.serviceBook}
          onChange={(e) => update("serviceBook", e.target.checked)}
        />
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={onPrev}>
          &larr; Zpět
        </Button>
        <Button variant="primary" onClick={handleNext}>
          Pokračovat &rarr;
        </Button>
      </div>
    </Card>
  );
}
