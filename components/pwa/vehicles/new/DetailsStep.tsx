"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { StepLayout } from "./StepLayout";
import { EquipmentSelector } from "./EquipmentSelector";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { DetailsData, VinDecoderResult } from "@/types/vehicle-draft";

// ============================================
// Options
// ============================================

const FUEL_OPTIONS = [
  { value: "PETROL", label: "Benzín" },
  { value: "DIESEL", label: "Diesel" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "PLUGIN_HYBRID", label: "Plug-in Hybrid" },
  { value: "ELECTRIC", label: "Elektro" },
  { value: "CNG", label: "CNG" },
  { value: "LPG", label: "LPG" },
];

const TRANSMISSION_OPTIONS = [
  { value: "MANUAL", label: "Manuální" },
  { value: "AUTOMATIC", label: "Automatická" },
  { value: "DSG", label: "DSG" },
  { value: "CVT", label: "CVT" },
];

const DRIVE_OPTIONS = [
  { value: "FRONT", label: "Přední" },
  { value: "REAR", label: "Zadní" },
  { value: "4x4", label: "4x4" },
];

const BODY_OPTIONS = [
  { value: "SEDAN", label: "Sedan" },
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "COMBI", label: "Kombi" },
  { value: "SUV", label: "SUV" },
  { value: "COUPE", label: "Coupé" },
  { value: "CABRIO", label: "Kabriolet" },
  { value: "VAN", label: "Van / MPV" },
  { value: "PICKUP", label: "Pickup" },
];

const CONDITION_OPTIONS = [
  { value: "EXCELLENT", label: "Výborný" },
  { value: "GOOD", label: "Dobrý" },
  { value: "FAIR", label: "Horší" },
  { value: "POOR", label: "Špatný" },
];

const ODOMETER_OPTIONS = [
  { value: "original", label: "Originál" },
  { value: "unverifiable", label: "Nelze ověřit" },
  { value: "tampered", label: "Stočeno" },
];

const SERVICE_BOOK_OPTIONS = [
  { value: "complete", label: "Kompletní" },
  { value: "partial", label: "Částečná" },
  { value: "missing", label: "Chybí" },
];

const COUNTRY_OPTIONS = [
  { value: "CZ", label: "Česká republika" },
  { value: "SK", label: "Slovensko" },
  { value: "DE", label: "Německo" },
  { value: "AT", label: "Rakousko" },
  { value: "PL", label: "Polsko" },
  { value: "IT", label: "Itálie" },
  { value: "FR", label: "Francie" },
  { value: "NL", label: "Nizozemsko" },
  { value: "BE", label: "Belgie" },
  { value: "US", label: "USA" },
  { value: "OTHER", label: "Jiný" },
];

const BRAND_OPTIONS = [
  "Audi", "BMW", "Citroën", "Dacia", "Fiat", "Ford", "Honda", "Hyundai",
  "Jaguar", "Jeep", "Kia", "Land Rover", "Lexus", "Mazda", "Mercedes-Benz",
  "Mini", "Mitsubishi", "Nissan", "Opel", "Peugeot", "Porsche", "Renault",
  "Seat", "Škoda", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo",
].map((b) => ({ value: b, label: b }));

const DEFAULT_HIGHLIGHTS = [
  "Servisní historie", "Garanční prohlídky", "Pravidelný servis",
  "Nekuřácké", "Garážované", "Jeden majitel", "Málo najeto",
  "Nové pneumatiky", "Nové brzdy", "Po velkém servisu",
  "Zachovalý stav", "Bez nehody",
];

// ============================================
// Component
// ============================================

export function DetailsStep() {
  const router = useRouter();
  const { draft, updateSection, saveDraft } = useDraftContext();

  // VIN decoded data
  const vinDecoded = draft?.vin?.decodedData as VinDecoderResult | undefined;
  const hasVinData = !!vinDecoded?.brand;

  // Formulářová data inicializovaná z draftu / VIN
  const [form, setForm] = useState<Partial<DetailsData>>(() => ({
    brand: draft?.details?.brand ?? vinDecoded?.brand ?? "",
    model: draft?.details?.model ?? vinDecoded?.model ?? "",
    variant: draft?.details?.variant ?? vinDecoded?.variant ?? "",
    year: draft?.details?.year ?? vinDecoded?.year ?? new Date().getFullYear(),
    bodyType: draft?.details?.bodyType ?? vinDecoded?.bodyType ?? "",
    fuelType: draft?.details?.fuelType ?? vinDecoded?.fuelType ?? "",
    engineCapacity: draft?.details?.engineCapacity ?? vinDecoded?.engineCapacity,
    enginePower: draft?.details?.enginePower ?? vinDecoded?.enginePower,
    transmission: draft?.details?.transmission ?? vinDecoded?.transmission ?? "",
    drivetrain: draft?.details?.drivetrain ?? vinDecoded?.drivetrain ?? "",
    color: draft?.details?.color ?? "",
    doorsCount: draft?.details?.doorsCount ?? vinDecoded?.doorsCount,
    seatsCount: draft?.details?.seatsCount ?? vinDecoded?.seatsCount,
    mileage: draft?.details?.mileage ?? 0,
    odometerStatus: draft?.details?.odometerStatus ?? "original",
    condition: draft?.details?.condition ?? "",
    ownerCount: draft?.details?.ownerCount ?? 1,
    stkValidUntil: draft?.details?.stkValidUntil ?? "",
    serviceBook: draft?.details?.serviceBook !== undefined ? draft.details.serviceBook : true,
    serviceBookStatus: draft?.details?.serviceBookStatus ?? "complete",
    originCountry: draft?.details?.originCountry ?? "CZ",
    equipment: draft?.details?.equipment ?? vinDecoded?.equipment ?? [],
    highlights: draft?.details?.highlights ?? [],
    description: draft?.details?.description ?? "",
  }));

  // Custom highlight input
  const [customHighlight, setCustomHighlight] = useState("");

  // AI description generation
  const [generatingDescription, setGeneratingDescription] = useState(false);

  // Computed PS from kW
  const powerPS = useMemo(() => {
    if (!form.enginePower) return "";
    return Math.round(form.enginePower * 1.36).toString();
  }, [form.enginePower]);

  // Formátovaný nájezd
  const formattedMileage = useMemo(() => {
    if (!form.mileage) return "";
    return new Intl.NumberFormat("cs-CZ").format(form.mileage);
  }, [form.mileage]);

  // Update helper
  const updateField = useCallback(<K extends keyof DetailsData>(
    key: K,
    value: DetailsData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Handle mileage (strip formatting)
  const handleMileageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\s/g, "").replace(/[^0-9]/g, "");
      const num = raw ? parseInt(raw, 10) : 0;
      updateField("mileage", num);
    },
    [updateField]
  );

  // Handle highlight toggle
  const toggleHighlight = useCallback(
    (hl: string) => {
      const current = form.highlights ?? [];
      const next = current.includes(hl)
        ? current.filter((h) => h !== hl)
        : [...current, hl];
      updateField("highlights", next);
    },
    [form.highlights, updateField]
  );

  // Add custom highlight
  const addCustomHighlight = useCallback(() => {
    const trimmed = customHighlight.trim();
    if (!trimmed) return;
    const current = form.highlights ?? [];
    if (!current.includes(trimmed)) {
      updateField("highlights", [...current, trimmed]);
    }
    setCustomHighlight("");
  }, [customHighlight, form.highlights, updateField]);

  // Generate AI description
  const handleGenerateDescription = useCallback(async () => {
    if (generatingDescription) return;
    setGeneratingDescription(true);
    try {
      const res = await fetch("/api/assistant/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: form.brand,
          model: form.model,
          variant: form.variant,
          year: form.year,
          mileage: form.mileage,
          fuelType: form.fuelType,
          transmission: form.transmission,
          enginePower: form.enginePower,
          bodyType: form.bodyType,
          condition: form.condition,
          color: form.color,
          equipment: form.equipment,
          highlights: form.highlights,
        }),
      });
      if (!res.ok) throw new Error("Chyba při generování");
      const data = (await res.json()) as { description: string };
      updateField("description", data.description);
    } catch {
      // Silently fail — user can write manually
    } finally {
      setGeneratingDescription(false);
    }
  }, [generatingDescription, form, updateField]);

  // Pokračovat
  const handleNext = useCallback(async () => {
    const detailsData: Partial<DetailsData> = {
      ...form,
    };
    updateSection("details", detailsData);
    await saveDraft();
    router.push(`/makler/vehicles/new/pricing?draft=${draft?.id}`);
  }, [form, updateSection, saveDraft, router, draft?.id]);

  // Validace
  const isValid =
    !!form.brand &&
    !!form.model &&
    !!form.year &&
    !!form.fuelType &&
    !!form.transmission &&
    !!form.drivetrain &&
    form.mileage !== undefined &&
    form.mileage > 0 &&
    !!form.condition;

  // STK měsíce/roky pro picker
  const currentYear = new Date().getFullYear();
  const stkYears = Array.from({ length: 6 }, (_, i) => currentYear + i);
  const stkMonths = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: new Date(2024, i).toLocaleString("cs-CZ", { month: "long" }),
  }));

  const stkMonth = form.stkValidUntil?.split("-")[1] ?? "";
  const stkYear = form.stkValidUntil?.split("-")[0] ?? "";

  return (
    <StepLayout
      step={5}
      title="Údaje a výbava"
      onNext={handleNext}
      nextDisabled={!isValid}
      showSave
    >
      <div className="space-y-8">
        {/* =========================================== */}
        {/* SEKCE: Základní údaje z VIN */}
        {/* =========================================== */}
        <section>
          <SectionHeader title="Základní údaje" locked={hasVinData} />

          <div className="space-y-4 mt-4">
            {hasVinData ? (
              // Readonly pole z VIN
              <div className="grid grid-cols-2 gap-4">
                <LockedField label="Značka" value={vinDecoded?.brand ?? ""} />
                <LockedField label="Model" value={vinDecoded?.model ?? ""} />
                <LockedField
                  label="Rok výroby"
                  value={vinDecoded?.year?.toString() ?? ""}
                />
                <LockedField
                  label="Karoserie"
                  value={
                    BODY_OPTIONS.find((b) => b.value === vinDecoded?.bodyType)
                      ?.label ?? vinDecoded?.bodyType ?? ""
                  }
                />
              </div>
            ) : (
              // Editovatelné pole
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Značka *"
                  value={form.brand}
                  onChange={(e) => updateField("brand", e.target.value)}
                  options={BRAND_OPTIONS}
                  placeholder="Vyberte značku"
                />
                <Input
                  label="Model *"
                  value={form.model}
                  onChange={(e) => updateField("model", e.target.value)}
                  placeholder="Např. Octavia"
                />
                <Input
                  label="Rok výroby *"
                  type="number"
                  value={form.year ?? ""}
                  onChange={(e) =>
                    updateField("year", parseInt(e.target.value, 10) || 0)
                  }
                  min={1900}
                  max={currentYear + 1}
                />
                <Select
                  label="Karoserie"
                  value={form.bodyType}
                  onChange={(e) => updateField("bodyType", e.target.value)}
                  options={BODY_OPTIONS}
                  placeholder="Typ karoserie"
                />
              </div>
            )}
          </div>
        </section>

        {/* =========================================== */}
        {/* SEKCE: Technické údaje */}
        {/* =========================================== */}
        <section>
          <SectionHeader title="Technické údaje" />

          <div className="space-y-4 mt-4">
            <Select
              label="Palivo *"
              value={form.fuelType}
              onChange={(e) => updateField("fuelType", e.target.value)}
              options={FUEL_OPTIONS}
              placeholder="Typ paliva"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Objem motoru (ccm)"
                type="number"
                value={form.engineCapacity ?? ""}
                onChange={(e) =>
                  updateField(
                    "engineCapacity",
                    e.target.value ? parseInt(e.target.value, 10) : undefined
                  )
                }
                placeholder="Např. 1968"
                min={0}
              />
              <div>
                <Input
                  label="Výkon (kW) *"
                  type="number"
                  value={form.enginePower ?? ""}
                  onChange={(e) =>
                    updateField(
                      "enginePower",
                      e.target.value ? parseInt(e.target.value, 10) : undefined
                    )
                  }
                  placeholder="Např. 110"
                  min={0}
                />
                {powerPS && (
                  <span className="text-xs text-gray-400 mt-1 block">
                    = {powerPS} PS
                  </span>
                )}
              </div>
            </div>

            <Select
              label="Převodovka *"
              value={form.transmission}
              onChange={(e) => updateField("transmission", e.target.value)}
              options={TRANSMISSION_OPTIONS}
              placeholder="Typ převodovky"
            />

            <Select
              label="Pohon *"
              value={form.drivetrain}
              onChange={(e) => updateField("drivetrain", e.target.value)}
              options={DRIVE_OPTIONS}
              placeholder="Typ pohonu"
            />

            <Input
              label="Barva"
              value={form.color ?? ""}
              onChange={(e) => updateField("color", e.target.value)}
              placeholder="Např. Černá metalíza"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Počet dveří"
                type="number"
                value={form.doorsCount ?? ""}
                onChange={(e) =>
                  updateField(
                    "doorsCount",
                    e.target.value ? parseInt(e.target.value, 10) : undefined
                  )
                }
                min={2}
                max={6}
              />
              <Input
                label="Počet sedadel"
                type="number"
                value={form.seatsCount ?? ""}
                onChange={(e) =>
                  updateField(
                    "seatsCount",
                    e.target.value ? parseInt(e.target.value, 10) : undefined
                  )
                }
                min={1}
                max={9}
              />
            </div>
          </div>
        </section>

        {/* =========================================== */}
        {/* SEKCE: Stav vozu */}
        {/* =========================================== */}
        <section>
          <SectionHeader title="Stav vozu" />

          <div className="space-y-4 mt-4">
            <Input
              label="Najeto (km) *"
              value={formattedMileage}
              onChange={handleMileageChange}
              placeholder="Např. 120 000"
              inputMode="numeric"
            />

            <div>
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                Stav tachometru
              </label>
              <div className="flex gap-2">
                {ODOMETER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateField("odometerStatus", opt.value)}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                      form.odometerStatus === opt.value
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Select
              label="Stav vozidla *"
              value={form.condition}
              onChange={(e) => updateField("condition", e.target.value)}
              options={CONDITION_OPTIONS}
              placeholder="Hodnocení stavu"
            />

            <Input
              label="Počet majitelů"
              type="number"
              value={form.ownerCount ?? ""}
              onChange={(e) =>
                updateField(
                  "ownerCount",
                  e.target.value
                    ? Math.min(10, Math.max(1, parseInt(e.target.value, 10)))
                    : 1
                )
              }
              min={1}
              max={10}
            />

            {/* STK platná do — month/year picker */}
            <div>
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                STK platná do
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={stkMonth}
                  onChange={(e) => {
                    const y = stkYear || String(currentYear);
                    updateField("stkValidUntil", `${y}-${e.target.value}`);
                  }}
                  options={stkMonths}
                  placeholder="Měsíc"
                />
                <Select
                  value={stkYear}
                  onChange={(e) => {
                    const m = stkMonth || "01";
                    updateField("stkValidUntil", `${e.target.value}-${m}`);
                  }}
                  options={stkYears.map((y) => ({
                    value: String(y),
                    label: String(y),
                  }))}
                  placeholder="Rok"
                />
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                Servisní knížka
              </label>
              <div className="flex gap-2">
                {SERVICE_BOOK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      updateField("serviceBookStatus", opt.value)
                    }
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                      form.serviceBookStatus === opt.value
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Select
              label="Země původu"
              value={form.originCountry}
              onChange={(e) => updateField("originCountry", e.target.value)}
              options={COUNTRY_OPTIONS}
            />
          </div>
        </section>

        {/* =========================================== */}
        {/* SEKCE: Výbava */}
        {/* =========================================== */}
        <section>
          <SectionHeader title="Výbava" />

          <div className="mt-4">
            <EquipmentSelector
              selectedEquipment={form.equipment ?? []}
              vinEquipment={vinDecoded?.equipment}
              onChange={(eq) => updateField("equipment", eq)}
            />
          </div>
        </section>

        {/* =========================================== */}
        {/* SEKCE: Hlavní přednosti */}
        {/* =========================================== */}
        <section>
          <SectionHeader title="Hlavní přednosti" />

          <div className="mt-4 space-y-3">
            {/* Chips */}
            <div className="flex flex-wrap gap-2">
              {DEFAULT_HIGHLIGHTS.map((hl) => {
                const selected = form.highlights?.includes(hl);
                return (
                  <button
                    key={hl}
                    onClick={() => toggleHighlight(hl)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      selected
                        ? "bg-orange-50 border-orange-300 text-orange-700"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {selected && (
                      <svg
                        className="w-4 h-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {hl}
                  </button>
                );
              })}

              {/* Custom highlights */}
              {form.highlights
                ?.filter((hl) => !DEFAULT_HIGHLIGHTS.includes(hl))
                .map((hl) => (
                  <Badge key={hl} variant="verified" className="cursor-pointer" >
                    <button onClick={() => toggleHighlight(hl)} className="flex items-center gap-1">
                      {hl}
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </Badge>
                ))}
            </div>

            {/* Přidat vlastní přednost */}
            <div className="flex gap-2">
              <Input
                value={customHighlight}
                onChange={(e) => setCustomHighlight(e.target.value)}
                placeholder="Přidat vlastní přednost"
                className="!py-2 !text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomHighlight();
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addCustomHighlight}
                disabled={!customHighlight.trim()}
              >
                Přidat
              </Button>
            </div>
          </div>
        </section>

        {/* =========================================== */}
        {/* SEKCE: Popis vozidla */}
        {/* =========================================== */}
        <section>
          <SectionHeader title="Popis vozidla" />

          <div className="mt-4 space-y-3">
            <textarea
              value={form.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Napište popis vozidla pro inzerát..."
              rows={6}
              className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-300 focus:bg-white resize-none transition-colors"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateDescription}
              disabled={generatingDescription || !form.brand || !form.model}
              className="w-full"
            >
              {generatingDescription ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generuji popis...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z" clipRule="evenodd" />
                  </svg>
                  Vygenerovat popis AI
                </span>
              )}
            </Button>
          </div>
        </section>
      </div>
    </StepLayout>
  );
}

// ============================================
// Sub-components
// ============================================

function SectionHeader({
  title,
  locked = false,
}: {
  title: string;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {locked && (
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
              clipRule="evenodd"
            />
          </svg>
          Z VIN
        </span>
      )}
    </div>
  );
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block">
        {label}
      </span>
      <p className="text-sm font-semibold text-gray-900 mt-0.5 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
            clipRule="evenodd"
          />
        </svg>
        {value || "—"}
      </p>
    </div>
  );
}
