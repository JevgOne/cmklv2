"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { StepLayout } from "@/components/pwa/vehicles/new/StepLayout";
import { Input, Textarea, Checkbox, Button } from "@/components/ui";

// ============================================
// CZECH CITIES LIST (for datalist autocomplete)
// ============================================

const CZECH_CITIES = [
  "Praha", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc",
  "České Budějovice", "Hradec Králové", "Ústí nad Labem", "Pardubice",
  "Zlín", "Havířov", "Kladno", "Most", "Opava", "Frýdek-Místek",
  "Karviná", "Jihlava", "Teplice", "Děčín", "Karlovy Vary", "Chomutov",
  "Jablonec nad Nisou", "Mladá Boleslav", "Prostějov", "Přerov",
  "Česká Lípa", "Třebíč", "Třinec", "Tábor", "Znojmo", "Kolín",
  "Příbram", "Cheb", "Písek", "Trutnov", "Kroměříž", "Orlová",
  "Vsetín", "Šumperk", "Uherské Hradiště", "Břeclav", "Hodonín",
  "Český Těšín", "Litoměřice", "Nový Jičín", "Klatovy", "Chrudim",
  "Sokolov", "Strakonice",
];

// ============================================
// PRICE FORMATTING
// ============================================

function formatPriceInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function parsePriceInput(formatted: string): number {
  return parseInt(formatted.replace(/\s/g, ""), 10) || 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("cs-CZ").format(value) + " Kč";
}

// ============================================
// TYPES
// ============================================

type DphOption = "with_dph" | "without_dph" | "non_payer";
type VehicleSource = "private" | "dealer" | "import";

// ============================================
// COMPONENT
// ============================================

export function PricingStep() {
  const router = useRouter();
  const { draft, updateSection } = useDraftContext();

  // Local state
  const [priceFormatted, setPriceFormatted] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [dph, setDph] = useState<DphOption>("non_payer");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<VehicleSource>("private");
  const [isGenerating, setIsGenerating] = useState(false);

  // Load from draft
  useEffect(() => {
    if (draft?.pricing) {
      const p = draft.pricing;
      if (p.price) setPriceFormatted(formatPriceInput(String(p.price)));
      if (p.priceNegotiable) setNegotiable(p.priceNegotiable as boolean);
      if (p.vatStatus) setDph(p.vatStatus as DphOption);
      if (p.city) setCity(p.city as string);
      if (p.district) setDistrict(p.district as string);
    }
    if (draft?.details) {
      const d = draft.details;
      if (d.description) setDescription(d.description as string);
      if (d.vehicleSource) setSource(d.vehicleSource as VehicleSource);
    }
  }, [draft?.pricing, draft?.details]);

  const price = useMemo(
    () => parsePriceInput(priceFormatted),
    [priceFormatted]
  );

  const commission = useMemo(
    () => (price > 0 ? Math.max(price * 0.05, 25000) : 0),
    [price]
  );

  const descriptionLength = description.length;
  const isDescriptionValid = descriptionLength >= 50;

  const canContinue =
    price > 0 && city.trim().length > 0 && isDescriptionValid;

  const handlePriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPriceFormatted(formatPriceInput(e.target.value));
    },
    []
  );

  const handleSave = useCallback(() => {
    updateSection("pricing", {
      price,
      priceNegotiable: negotiable,
      vatStatus: dph,
      commission,
      city,
      district,
    });
    updateSection("details", {
      ...(draft?.details ?? {}),
      description,
      vehicleSource: source,
    });
  }, [
    updateSection,
    draft?.details,
    price,
    negotiable,
    dph,
    city,
    district,
    description,
    source,
    commission,
  ]);

  const handleGenerateDescription = useCallback(async () => {
    if (!draft?.details) return;
    const d = draft.details;
    if (!d.brand || !d.model || !d.year || !d.mileage || !d.condition) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/assistant/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: d.brand,
          model: d.model,
          year: d.year,
          mileage: d.mileage,
          condition: d.condition,
          fuelType: d.fuelType,
          transmission: d.transmission,
          enginePower: d.enginePower,
          bodyType: d.bodyType,
          color: d.color,
          equipment: d.equipment ?? [],
          highlights: d.highlights ?? [],
        }),
      });

      if (!res.ok) {
        throw new Error("Chyba při generování popisu");
      }

      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
      }
    } catch (error) {
      console.error("Chyba při generování AI popisu:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [draft?.details]);

  const handleContinue = useCallback(() => {
    handleSave();
    router.push(`/makler/vehicles/new/review?draft=${draft?.id}`);
  }, [handleSave, router, draft?.id]);

  return (
    <StepLayout step={6} title="Cena a lokace">
      <div className="space-y-6">
        {/* Price */}
        <div>
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
              Prodejní cena
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={priceFormatted}
                onChange={handlePriceChange}
                onBlur={handleSave}
                placeholder="0"
                className="w-full px-[18px] py-3.5 text-[15px] font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg transition-all duration-200 hover:bg-gray-100 focus:bg-white focus:border-orange-500 focus:shadow-[0_0_0_4px_var(--orange-100)] focus:outline-none pr-14"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                Kč
              </span>
            </div>
          </div>

          <div className="mt-3">
            <Checkbox
              label="Cena k jednání"
              checked={negotiable}
              onChange={(e) => setNegotiable(e.target.checked)}
            />
          </div>
        </div>

        {/* DPH */}
        <div>
          <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-3">
            DPH
          </label>
          <div className="space-y-2">
            {(
              [
                { value: "with_dph", label: "S DPH" },
                { value: "without_dph", label: "Bez DPH" },
                { value: "non_payer", label: "Neplátce DPH" },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <input
                  type="radio"
                  name="dph"
                  value={option.value}
                  checked={dph === option.value}
                  onChange={() => setDph(option.value)}
                  className="w-5 h-5 accent-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Commission */}
        {price > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Vaše provize:</span>
              <span className="text-lg font-bold text-green-700">
                {formatCurrency(commission)}
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              5 % z prodejní ceny, min. 25 000 Kč
            </p>
          </div>
        )}

        {/* Location */}
        <div className="space-y-3">
          <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block">
            Lokace
          </label>

          <div>
            <input
              type="text"
              list="czech-cities"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onBlur={handleSave}
              placeholder="Město"
              className="w-full px-[18px] py-3.5 text-[15px] font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg transition-all duration-200 hover:bg-gray-100 focus:bg-white focus:border-orange-500 focus:shadow-[0_0_0_4px_var(--orange-100)] focus:outline-none"
            />
            <datalist id="czech-cities">
              {CZECH_CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <Input
            placeholder="Městská část (volitelné)"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            onBlur={handleSave}
          />

          <div>
            <Input
              placeholder="Přesná adresa (volitelné)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={handleSave}
            />
            <p className="text-xs text-gray-400 mt-1">
              Pouze pro interní potřeby, nebude veřejně zobrazena
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <Textarea
            label="Popis inzerátu"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSave}
            placeholder="Např.: Prodám spolehlivé rodinné auto v dobrém stavu. Pravidelně servisováno u autorizovaného servisu. Nové brzdy, rozvody vyměněny při 120 000 km. Nekouřeno, garáž. Druhý majitel, vůz pouze z ČR."
            className="min-h-[150px]"
          />
          <div className="flex items-center justify-between mt-1">
            <span
              className={`text-xs ${
                isDescriptionValid ? "text-green-600" : "text-gray-400"
              }`}
            >
              {descriptionLength} / min. 50 znaků
            </span>
            {!isDescriptionValid && descriptionLength > 0 && (
              <span className="text-xs text-orange-500">
                Ještě {50 - descriptionLength} znaků
              </span>
            )}
          </div>

          <button
            onClick={handleGenerateDescription}
            disabled={isGenerating || !draft?.details?.brand || !draft?.details?.model}
            className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generuji popis...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Vygenerovat popis AI
              </>
            )}
          </button>
        </div>

        {/* Vehicle Source */}
        <div>
          <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-3">
            Zdroj vozu
          </label>
          <div className="space-y-2">
            {(
              [
                { value: "private", label: "Soukromý prodejce" },
                { value: "dealer", label: "Autobazar" },
                { value: "import", label: "Dovoz" },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <input
                  type="radio"
                  name="source"
                  value={option.value}
                  checked={source === option.value}
                  onChange={() => setSource(option.value)}
                  className="w-5 h-5 accent-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Continue */}
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full"
          size="lg"
        >
          Pokračovat
        </Button>
      </div>
    </StepLayout>
  );
}
