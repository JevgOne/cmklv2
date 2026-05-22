"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { StepLayout } from "./StepLayout";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { DetailsData, SmartLookupResult, DataSource } from "@/types/vehicle-draft";

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

// Smart lookup field keys that map to details form fields
type SmartFieldKey = keyof NonNullable<SmartLookupResult["fields"]>;

const SOURCE_LABELS: Record<DataSource, string> = {
  db: "Z naší DB",
  cebia: "CEBIA",
  vincario: "VIN dekodér",
  nhtsa: "NHTSA",
};

// ============================================
// Component
// ============================================

export function DetailsStep() {
  const router = useRouter();
  const { draft, updateSection, saveDraft } = useDraftContext();

  // Smart lookup result from VinStep
  const smartResult = (draft?.vin as Record<string, unknown>)?.smartLookupResult as SmartLookupResult | undefined;
  const fields = smartResult?.fields;

  // Helper to get smart field value
  const getSmartValue = useCallback((key: SmartFieldKey) => {
    const f = fields?.[key];
    return f ? f.value : undefined;
  }, [fields]);

  const getSmartConfidence = useCallback((key: SmartFieldKey) => {
    return fields?.[key]?.confidence;
  }, [fields]);

  const getSmartSource = useCallback((key: SmartFieldKey) => {
    return fields?.[key]?.source;
  }, [fields]);

  // Formulářová data — smart lookup values take priority as initial values
  const [form, setForm] = useState<Partial<DetailsData>>(() => ({
    brand: draft?.details?.brand ?? (getSmartValue("brand") as string) ?? "",
    model: draft?.details?.model ?? (getSmartValue("model") as string) ?? "",
    variant: draft?.details?.variant ?? (getSmartValue("variant") as string) ?? "",
    year: draft?.details?.year ?? (getSmartValue("year") as number) ?? new Date().getFullYear(),
    bodyType: draft?.details?.bodyType ?? (getSmartValue("bodyType") as string) ?? "",
    fuelType: draft?.details?.fuelType ?? (getSmartValue("fuelType") as string) ?? "",
    engineCapacity: draft?.details?.engineCapacity ?? (getSmartValue("engineCapacity") as number),
    enginePower: draft?.details?.enginePower ?? (getSmartValue("enginePower") as number),
    transmission: draft?.details?.transmission ?? (getSmartValue("transmission") as string) ?? "",
    drivetrain: draft?.details?.drivetrain ?? (getSmartValue("drivetrain") as string) ?? "",
    color: draft?.details?.color ?? (getSmartValue("color") as string) ?? "",
    doorsCount: draft?.details?.doorsCount ?? (getSmartValue("doorsCount") as number),
    seatsCount: draft?.details?.seatsCount ?? (getSmartValue("seatsCount") as number),
    mileage: draft?.details?.mileage ?? (getSmartValue("mileage") as number) ?? 0,
    odometerStatus: draft?.details?.odometerStatus ?? "original",
    condition: draft?.details?.condition ?? (getSmartValue("condition") as string) ?? "",
    ownerCount: draft?.details?.ownerCount ?? (getSmartValue("ownerCount") as number) ?? 1,
    stkValidUntil: draft?.details?.stkValidUntil ?? "",
    serviceBook: draft?.details?.serviceBook !== undefined ? draft.details.serviceBook : true,
    serviceBookStatus: draft?.details?.serviceBookStatus ?? "complete",
    originCountry: draft?.details?.originCountry ?? "CZ",
  }));

  // Track which fields user has manually overridden / confirmed
  const [overrides, setOverrides] = useState<Set<string>>(new Set());

  // Field state helper: "locked" | "prefilled" | "missing"
  const fieldState = useCallback((key: SmartFieldKey): "locked" | "prefilled" | "missing" => {
    const confidence = getSmartConfidence(key);
    if (!confidence) return "missing";
    if (overrides.has(key)) return "locked"; // User confirmed
    if (confidence === "high") return "locked";
    return "prefilled";
  }, [getSmartConfidence, overrides]);

  // Confirm a prefilled field
  const confirmField = useCallback((key: string) => {
    setOverrides((prev) => new Set(prev).add(key));
  }, []);

  // Confirm all prefilled fields
  const confirmAll = useCallback(() => {
    const prefilled = Object.keys(fields ?? {}).filter(
      (key) => getSmartConfidence(key as SmartFieldKey) === "medium"
    );
    setOverrides((prev) => {
      const next = new Set(prev);
      prefilled.forEach((k) => next.add(k));
      return next;
    });
  }, [fields, getSmartConfidence]);

  // Count of prefilled fields needing confirmation
  const prefilledCount = useMemo(() => {
    if (!fields) return 0;
    return Object.keys(fields).filter(
      (key) =>
        getSmartConfidence(key as SmartFieldKey) === "medium" &&
        !overrides.has(key)
    ).length;
  }, [fields, getSmartConfidence, overrides]);

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

  // Pokračovat
  const handleNext = useCallback(async () => {
    updateSection("details", { ...form });
    await saveDraft();
    router.push(`/makler/vehicles/new/equipment?draft=${draft?.id}`);
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

  // Render a smart-aware field
  const renderField = (
    key: SmartFieldKey,
    label: string,
    renderInput: () => React.ReactNode,
    displayValue?: string
  ) => {
    const state = fieldState(key);
    const source = getSmartSource(key);

    if (state === "locked" && displayValue) {
      return (
        <LockedField
          label={label}
          value={displayValue}
          source={source}
          onUnlock={() => {
            setOverrides((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
          }}
        />
      );
    }

    if (state === "prefilled") {
      return (
        <PrefilledField
          label={label}
          source={source}
          onConfirm={() => confirmField(key)}
        >
          {renderInput()}
        </PrefilledField>
      );
    }

    // Missing — render with highlight
    return (
      <MissingField label={label} hasValue={!!form[key as keyof typeof form]}>
        {renderInput()}
      </MissingField>
    );
  };

  return (
    <StepLayout
      step={5}
      title="Údaje vozidla"
      onNext={handleNext}
      nextDisabled={!isValid}
      showSave
    >
      <div className="space-y-8">
        {/* Confirm all banner */}
        {prefilledCount > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3">
            <span className="text-sm text-blue-700">
              {prefilledCount} {prefilledCount === 1 ? "pole čeká" : "polí čeká"} na potvrzení
            </span>
            <Button variant="primary" size="sm" onClick={confirmAll}>
              Potvrdit vše
            </Button>
          </div>
        )}

        {/* SEKCE: Základní údaje */}
        <section>
          <SectionHeader title="Základní údaje" />
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {renderField("brand", "Značka",
                () => (
                  <Select
                    label="Značka *"
                    value={form.brand}
                    onChange={(e) => updateField("brand", e.target.value)}
                    options={BRAND_OPTIONS}
                    placeholder="Vyberte značku"
                  />
                ),
                form.brand
              )}
              {renderField("model", "Model",
                () => (
                  <Input
                    label="Model *"
                    value={form.model}
                    onChange={(e) => updateField("model", e.target.value)}
                    placeholder="Např. Octavia"
                  />
                ),
                form.model
              )}
              {renderField("year", "Rok výroby",
                () => (
                  <Input
                    label="Rok výroby *"
                    type="number"
                    value={form.year ?? ""}
                    onChange={(e) => updateField("year", parseInt(e.target.value, 10) || 0)}
                    min={1900}
                    max={currentYear + 1}
                  />
                ),
                form.year?.toString()
              )}
              {renderField("bodyType", "Karoserie",
                () => (
                  <Select
                    label="Karoserie"
                    value={form.bodyType}
                    onChange={(e) => updateField("bodyType", e.target.value)}
                    options={BODY_OPTIONS}
                    placeholder="Typ karoserie"
                  />
                ),
                BODY_OPTIONS.find((b) => b.value === form.bodyType)?.label ?? form.bodyType
              )}
            </div>
          </div>
        </section>

        {/* SEKCE: Technické údaje */}
        <section>
          <SectionHeader title="Technické údaje" />
          <div className="space-y-4 mt-4">
            {renderField("fuelType", "Palivo",
              () => (
                <Select
                  label="Palivo *"
                  value={form.fuelType}
                  onChange={(e) => updateField("fuelType", e.target.value)}
                  options={FUEL_OPTIONS}
                  placeholder="Typ paliva"
                />
              ),
              FUEL_OPTIONS.find((f) => f.value === form.fuelType)?.label ?? form.fuelType
            )}

            <div className="grid grid-cols-2 gap-4">
              {renderField("engineCapacity", "Objem motoru",
                () => (
                  <Input
                    label="Objem motoru (ccm)"
                    type="number"
                    value={form.engineCapacity ?? ""}
                    onChange={(e) => updateField("engineCapacity", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    placeholder="Např. 1968"
                    min={0}
                  />
                ),
                form.engineCapacity ? `${form.engineCapacity} ccm` : undefined
              )}
              <div>
                {renderField("enginePower", "Výkon",
                  () => (
                    <Input
                      label="Výkon (kW)"
                      type="number"
                      value={form.enginePower ?? ""}
                      onChange={(e) => updateField("enginePower", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      placeholder="Např. 110"
                      min={0}
                    />
                  ),
                  form.enginePower ? `${form.enginePower} kW` : undefined
                )}
                {powerPS && (
                  <span className="text-xs text-gray-400 mt-1 block">
                    = {powerPS} PS
                  </span>
                )}
              </div>
            </div>

            {renderField("transmission", "Převodovka",
              () => (
                <Select
                  label="Převodovka *"
                  value={form.transmission}
                  onChange={(e) => updateField("transmission", e.target.value)}
                  options={TRANSMISSION_OPTIONS}
                  placeholder="Typ převodovky"
                />
              ),
              TRANSMISSION_OPTIONS.find((t) => t.value === form.transmission)?.label ?? form.transmission
            )}

            {renderField("drivetrain", "Pohon",
              () => (
                <Select
                  label="Pohon *"
                  value={form.drivetrain}
                  onChange={(e) => updateField("drivetrain", e.target.value)}
                  options={DRIVE_OPTIONS}
                  placeholder="Typ pohonu"
                />
              ),
              DRIVE_OPTIONS.find((d) => d.value === form.drivetrain)?.label ?? form.drivetrain
            )}

            {renderField("color", "Barva",
              () => (
                <Input
                  label="Barva"
                  value={form.color ?? ""}
                  onChange={(e) => updateField("color", e.target.value)}
                  placeholder="Např. Černá metalíza"
                />
              ),
              form.color || undefined
            )}

            <div className="grid grid-cols-2 gap-4">
              {renderField("doorsCount", "Počet dveří",
                () => (
                  <Input
                    label="Počet dveří"
                    type="number"
                    value={form.doorsCount ?? ""}
                    onChange={(e) => updateField("doorsCount", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    min={2}
                    max={6}
                  />
                ),
                form.doorsCount?.toString()
              )}
              {renderField("seatsCount", "Počet sedadel",
                () => (
                  <Input
                    label="Počet sedadel"
                    type="number"
                    value={form.seatsCount ?? ""}
                    onChange={(e) => updateField("seatsCount", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    min={1}
                    max={9}
                  />
                ),
                form.seatsCount?.toString()
              )}
            </div>
          </div>
        </section>

        {/* SEKCE: Stav vozu — always editable (not from VIN decode) */}
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
                    type="button"
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
                  e.target.value ? Math.min(10, Math.max(1, parseInt(e.target.value, 10))) : 1
                )
              }
              min={1}
              max={10}
            />

            {/* STK platná do */}
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
                  options={stkYears.map((y) => ({ value: String(y), label: String(y) }))}
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
                    type="button"
                    onClick={() => updateField("serviceBookStatus", opt.value)}
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
      </div>
    </StepLayout>
  );
}

// ============================================
// Sub-components
// ============================================

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-base font-bold text-gray-900">{title}</h2>
  );
}

function LockedField({
  label,
  value,
  source,
  onUnlock,
}: {
  label: string;
  value: string;
  source?: DataSource;
  onUnlock: () => void;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {source && (
            <span className="text-[9px] font-medium text-gray-400">
              {SOURCE_LABELS[source]}
            </span>
          )}
          <button
            type="button"
            onClick={onUnlock}
            className="text-gray-300 hover:text-gray-500 transition-colors"
            title="Upravit"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </button>
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-900 mt-0.5 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        {value || "—"}
      </p>
    </div>
  );
}

function PrefilledField({
  label,
  source,
  onConfirm,
  children,
}: {
  label: string;
  source?: DataSource;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-lg border-2 border-blue-200 bg-blue-50/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-blue-600 uppercase">Zkontrolujte</span>
          {source && (
            <span className="text-[9px] font-medium text-blue-400">
              ({SOURCE_LABELS[source]})
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onConfirm}
          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Potvrdit
        </button>
      </div>
      {children}
    </div>
  );
}

function MissingField({
  label,
  hasValue,
  children,
}: {
  label: string;
  hasValue: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={!hasValue ? "rounded-lg border-2 border-dashed border-orange-200 bg-orange-50/20 p-3" : ""}>
      {!hasValue && (
        <span className="text-[10px] font-bold text-orange-500 uppercase block mb-1">
          Doplňte
        </span>
      )}
      {children}
    </div>
  );
}
