"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { CompatibilitySelector, type CompatibilityEntry } from "./CompatibilitySelector";

export interface PartDetails {
  name: string;
  category: string;
  condition: string;
  conditionNote: string;
  description: string;
  oemNumber: string;
  sourceVin: string;
  compatibility: CompatibilityEntry[];
}

const categoryOptions = [
  { value: "MOTOR", label: "Motor" },
  { value: "TRANSMISSION", label: "Převodovka" },
  { value: "BODYWORK", label: "Karoserie" },
  { value: "INTERIOR", label: "Interiér" },
  { value: "ELECTRO", label: "Elektro" },
  { value: "SUSPENSION", label: "Podvozek" },
  { value: "BRAKES", label: "Brzdy" },
  { value: "EXHAUST", label: "Výfuk" },
  { value: "AC", label: "Klimatizace" },
  { value: "LIGHTS", label: "Osvětlení" },
  { value: "OTHER", label: "Ostatní" },
];

const conditionOptions = [
  { value: "FUNCTIONAL", label: "Plně funkční" },
  { value: "FUNCTIONAL_WITH_DEFECT", label: "Funkční s vadou" },
  { value: "FOR_PARTS", label: "Na díly (nefunkční)" },
];

const commonParts = [
  "Přední nárazník",
  "Zadní nárazník",
  "Přední dveře levé",
  "Přední dveře pravé",
  "Zadní dveře levé",
  "Zadní dveře pravé",
  "Blatník přední levý",
  "Blatník přední pravý",
  "Kapota",
  "Víko kufru",
  "Světlomet přední levý",
  "Světlomet přední pravý",
  "Zpětné zrcátko levé",
  "Zpětné zrcátko pravé",
  "Alternátor",
  "Startér",
  "Turbodmychadlo",
  "Převodovka",
  "Motor komplet",
  "Sedačka řidiče",
  "Sedačka spolujezdce",
];

export function DetailsStep({
  details,
  onDetailsChange,
  onNext,
  onBack,
}: {
  details: PartDetails;
  onDetailsChange: (details: PartDetails) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const update = (field: keyof PartDetails, value: string | CompatibilityEntry[]) => {
    onDetailsChange({ ...details, [field]: value });
  };

  const isValid =
    details.name.trim() !== "" &&
    details.category !== "" &&
    details.condition !== "" &&
    details.compatibility.length > 0 &&
    details.compatibility[0].brand !== "";

  return (
    <div className="p-4 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Údaje o dílu</h2>
        <p className="text-sm text-gray-500 mt-1">
          Vyplňte co nejvíce informací
        </p>
      </div>

      {/* Name with suggestions */}
      <div>
        <Input
          label="Název dílu *"
          value={details.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="např. Přední nárazník"
          list="part-names"
        />
        <datalist id="part-names">
          {commonParts.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>

      <Select
        label="Kategorie *"
        value={details.category}
        onChange={(e) => update("category", e.target.value)}
        options={categoryOptions}
        placeholder="Vyberte kategorii"
      />

      <Select
        label="Stav *"
        value={details.condition}
        onChange={(e) => update("condition", e.target.value)}
        options={conditionOptions}
        placeholder="Vyberte stav dílu"
      />

      {details.condition === "FUNCTIONAL_WITH_DEFECT" && (
        <Textarea
          label="Popis vady *"
          value={details.conditionNote}
          onChange={(e) => update("conditionNote", e.target.value)}
          placeholder="Popište vadu dílu..."
          className="min-h-[80px]"
        />
      )}

      {/* Compatibility */}
      <CompatibilitySelector
        entries={details.compatibility}
        onChange={(entries) => update("compatibility", entries)}
      />

      <Input
        label="VIN zdrojového vozu (nepovinné)"
        value={details.sourceVin}
        onChange={(e) => update("sourceVin", e.target.value)}
        placeholder="17-ti místný VIN kód"
        maxLength={17}
      />

      <Textarea
        label="Popis"
        value={details.description}
        onChange={(e) => update("description", e.target.value)}
        placeholder="Demontováno z vozu s 85 000 km, bez poškození..."
        className="min-h-[80px]"
      />

      <Input
        label="OEM číslo dílu (nepovinné)"
        value={details.oemNumber}
        onChange={(e) => update("oemNumber", e.target.value)}
        placeholder="např. 5E4 831 051"
      />

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" size="lg" onClick={onBack} className="flex-1">
          Zpět
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1 bg-gradient-to-br from-green-500 to-green-600"
          onClick={onNext}
          disabled={!isValid}
        >
          Pokračovat
        </Button>
      </div>
    </div>
  );
}
