"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { StepLayout } from "@/components/pwa/vehicles/new/StepLayout";
import { Input, Textarea, Checkbox, Button } from "@/components/ui";
import {
  buildDescriptionTemplate,
  renderDescription,
  buildAiPrompt,
  parseAiResponse,
  type DescriptionTemplate,
} from "@/lib/description-template";

const DEFAULT_HIGHLIGHTS = [
  "Servisní historie", "Garanční prohlídky", "Pravidelný servis",
  "Nekuřácké", "Garážované", "Jeden majitel", "Málo najeto",
  "Nové pneumatiky", "Nové brzdy", "Po velkém servisu",
  "Zachovalý stav", "Bez nehody",
];

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

interface PriceEstimate {
  min: number;
  max: number;
  suggested: number;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  comparablesCount: number;
}

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
  const [source, setSource] = useState<VehicleSource>("private");
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [customHighlight, setCustomHighlight] = useState("");

  // Template-based description
  const [intro, setIntro] = useState("");
  const [outro, setOutro] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const templateInitialized = useRef(false);

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
      if (d.vehicleSource) setSource(d.vehicleSource as VehicleSource);
      if (d.highlights) setHighlights(d.highlights as string[]);
    }
  }, [draft?.pricing, draft?.details]);

  // Load saved intro/outro from draft description (parse back)
  useEffect(() => {
    if (templateInitialized.current) return;
    if (!draft?.details) return;
    const d = draft.details;
    if (d.descriptionIntro) setIntro(d.descriptionIntro as string);
    if (d.descriptionOutro) setOutro(d.descriptionOutro as string);
    templateInitialized.current = true;
  }, [draft?.details]);

  // Build template from current data
  const template: DescriptionTemplate = useMemo(() => {
    const currentHighlights = highlights.length > 0 ? highlights : (draft?.details?.highlights as string[] | undefined) ?? [];
    const updatedDetails = { ...(draft?.details ?? {}), highlights: currentHighlights };
    const built = buildDescriptionTemplate(updatedDetails, draft?.inspection ?? {});
    return { ...built, intro, outro };
  }, [draft?.details, draft?.inspection, highlights, intro, outro]);

  // Rendered description preview
  const renderedDescription = useMemo(
    () => renderDescription(template),
    [template],
  );

  const isDescriptionValid = renderedDescription.length >= 50;

  const price = useMemo(
    () => parsePriceInput(priceFormatted),
    [priceFormatted]
  );

  const commission = useMemo(
    () => (price > 0 ? Math.max(price * 0.05, 25000) : 0),
    [price]
  );

  const canContinue =
    price > 0 && city.trim().length > 0 && isDescriptionValid;

  const handlePriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPriceFormatted(formatPriceInput(e.target.value));
    },
    []
  );

  const toggleHighlight = useCallback((hl: string) => {
    setHighlights((prev) =>
      prev.includes(hl) ? prev.filter((h) => h !== hl) : [...prev, hl]
    );
  }, []);

  const addCustomHighlight = useCallback(() => {
    const trimmed = customHighlight.trim();
    if (!trimmed) return;
    setHighlights((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setCustomHighlight("");
  }, [customHighlight]);

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
      description: renderedDescription,
      descriptionIntro: intro,
      descriptionOutro: outro,
      highlights,
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
    renderedDescription,
    intro,
    outro,
    highlights,
    source,
    commission,
  ]);

  const handleGenerateAi = useCallback(async () => {
    if (!draft?.details) return;
    const d = draft.details;
    if (!d.brand || !d.model || !d.year) return;

    setIsGeneratingAi(true);
    try {
      const { systemPrompt, userPrompt } = buildAiPrompt({
        ...d,
        highlights,
      } as Partial<import("@/types/vehicle-draft").DetailsData>);

      const res = await fetch("/api/assistant/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: d.brand as string,
          model: d.model as string,
          year: d.year as number,
          mileage: (d.mileage as number) || 0,
          condition: (d.condition as string) || "GOOD",
          fuelType: d.fuelType,
          transmission: d.transmission,
          enginePower: d.enginePower,
          bodyType: d.bodyType,
          color: d.color,
          equipment: d.equipment ?? [],
          highlights,
          templateMode: true,
          customSystemPrompt: systemPrompt,
          customUserPrompt: userPrompt,
        }),
      });

      if (!res.ok) throw new Error("Chyba při generování popisu");

      const data = await res.json();
      if (data.description) {
        const parsed = parseAiResponse(data.description);
        setIntro(parsed.intro);
        setOutro(parsed.outro);
      }
    } catch (error) {
      console.error("Chyba při generování AI popisu:", error);
    } finally {
      setIsGeneratingAi(false);
    }
  }, [draft?.details, highlights]);

  const canEstimate = !!(
    draft?.details?.brand &&
    draft?.details?.model &&
    draft?.details?.year &&
    draft?.details?.mileage &&
    draft?.details?.condition
  );

  const handleEstimatePrice = useCallback(async () => {
    if (!draft?.details) return;
    const d = draft.details;
    if (!d.brand || !d.model || !d.year || !d.mileage || !d.condition) return;

    setEstimating(true);
    try {
      const res = await fetch("/api/assistant/price-estimate", {
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
          equipment: d.equipment ?? [],
        }),
      });

      if (!res.ok) throw new Error("Chyba při odhadu ceny");

      const data = await res.json();
      setEstimate(data);
      if (data.suggested) {
        setPriceFormatted(formatPriceInput(String(data.suggested)));
      }
    } catch (err) {
      console.error("AI price estimate error:", err);
    } finally {
      setEstimating(false);
    }
  }, [draft?.details]);

  const handleContinue = useCallback(() => {
    handleSave();
    router.push(`/makler/vehicles/new/review?draft=${draft?.id}`);
  }, [handleSave, router, draft?.id]);

  return (
    <StepLayout step={7} title="Cena a popis">
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

        {/* AI Price Estimate */}
        <div>
          <button
            onClick={handleEstimatePrice}
            disabled={estimating || !canEstimate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {estimating ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Odhaduji cenu...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Odhadnout cenu AI
              </>
            )}
          </button>

          {estimate && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-blue-700">AI cenový odhad</span>
                <ConfidenceBadge level={estimate.confidence} />
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-blue-600">Rozmezí:</span>
                <span className="font-bold text-blue-700">
                  {formatCurrency(estimate.min)} – {formatCurrency(estimate.max)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-600">Doporučená cena:</span>
                <span className="text-lg font-bold text-blue-800">
                  {formatCurrency(estimate.suggested)}
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-2">{estimate.reasoning}</p>
              <p className="text-[10px] text-blue-400 mt-1 italic">
                Orientační odhad — skutečná cena závisí na individuálním stavu vozu.
              </p>
              <button
                type="button"
                onClick={() => setPriceFormatted(formatPriceInput(String(estimate.suggested)))}
                className="mt-2 text-sm text-blue-700 font-medium hover:text-blue-800 bg-transparent border-none cursor-pointer p-0"
              >
                Použít doporučenou cenu
              </button>
            </div>
          )}
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

        {/* Highlights */}
        <div>
          <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-3">
            Hlavní přednosti
          </label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_HIGHLIGHTS.map((hl) => {
              const selected = highlights.includes(hl);
              return (
                <button
                  key={hl}
                  type="button"
                  onClick={() => toggleHighlight(hl)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    selected
                      ? "bg-orange-50 border-orange-300 text-orange-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {selected && (
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {hl}
                </button>
              );
            })}
            {highlights
              .filter((hl) => !DEFAULT_HIGHLIGHTS.includes(hl))
              .map((hl) => (
                <button
                  key={hl}
                  type="button"
                  onClick={() => toggleHighlight(hl)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-orange-50 border border-orange-300 text-orange-700"
                >
                  {hl}
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              value={customHighlight}
              onChange={(e) => setCustomHighlight(e.target.value)}
              placeholder="Vlastní přednost"
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

        {/* Template-based Description */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
              Popis inzerátu
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              {showPreview ? "Upravit" : "Náhled"}
            </button>
          </div>

          {showPreview ? (
            /* Preview mode — rendered description */
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Náhled inzerátu</p>
              <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {renderedDescription || <span className="text-gray-400 italic">Popis se sestaví automaticky z dat vozidla.</span>}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <span className={`text-xs ${isDescriptionValid ? "text-green-600" : "text-gray-400"}`}>
                  {renderedDescription.length} znaků
                </span>
                {isDescriptionValid && (
                  <span className="text-xs text-green-600 font-medium">Připraveno</span>
                )}
              </div>
            </div>
          ) : (
            /* Edit mode — intro + auto sections info + outro */
            <div className="space-y-4">
              {/* AI Generate button */}
              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={isGeneratingAi || !draft?.details?.brand || !draft?.details?.model}
                className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
              >
                {isGeneratingAi ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generuji úvod a závěr...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    Vygenerovat úvod a závěr AI
                  </>
                )}
              </button>

              {/* Intro — editable */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Úvodní odstavec <span className="text-orange-500">(editovatelný)</span>
                </label>
                <Textarea
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  onBlur={handleSave}
                  placeholder="Úvodní text inzerátu — představte vůz a jeho hlavní přednosti. Nebo nechte AI vygenerovat."
                  className="min-h-[80px]"
                />
              </div>

              {/* Auto-filled sections — read-only info */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                  Automaticky doplněné sekce
                </p>
                {template.sections.map((section) => (
                  <div key={section.title}>
                    <p className="text-xs font-bold text-gray-600 mb-1">{section.title}:</p>
                    {section.lines.length > 0 ? (
                      <ul className="text-xs text-gray-500 space-y-0.5">
                        {section.lines.slice(0, 5).map((line, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-gray-300 mt-px">&#x2022;</span>
                            <span>{line}</span>
                          </li>
                        ))}
                        {section.lines.length > 5 && (
                          <li className="text-gray-400 italic">
                            ...a dalších {section.lines.length - 5}
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Žádná data</p>
                    )}
                  </div>
                ))}
                {template.sections.length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    Vyplňte detaily vozidla v předchozích krocích pro automatické doplnění.
                  </p>
                )}
              </div>

              {/* Outro — editable */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Závěrečný odstavec <span className="text-orange-500">(editovatelný)</span>
                </label>
                <Textarea
                  value={outro}
                  onChange={(e) => setOutro(e.target.value)}
                  onBlur={handleSave}
                  placeholder="Závěrečný text — výzva k akci, nabídka prohlídky, kontaktu."
                  className="min-h-[60px]"
                />
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`text-xs ${isDescriptionValid ? "text-green-600" : "text-gray-400"}`}>
                  {renderedDescription.length} / min. 50 znaků
                </span>
                {!isDescriptionValid && renderedDescription.length > 0 && (
                  <span className="text-xs text-orange-500">
                    Doplňte úvod nebo závěr
                  </span>
                )}
              </div>
            </div>
          )}
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

function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const config = {
    high: { label: "Vysoká přesnost", color: "bg-green-100 text-green-700" },
    medium: { label: "Střední přesnost", color: "bg-yellow-100 text-yellow-700" },
    low: { label: "Orientační", color: "bg-gray-100 text-gray-600" },
  };
  const c = config[level];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.color}`}>
      {c.label}
    </span>
  );
}
