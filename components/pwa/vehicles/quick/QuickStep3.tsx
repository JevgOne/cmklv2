"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { uploadDraftPhotos } from "@/lib/offline/upload-photos";
import { StepLayout } from "@/components/pwa/vehicles/new/StepLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { VinDecoderResult } from "@/types/vehicle-draft";

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
// CONDITION OPTIONS
// ============================================

const CONDITIONS = [
  { value: "NEW", label: "Nové" },
  { value: "LIKE_NEW", label: "Jako nové" },
  { value: "EXCELLENT", label: "Výborný" },
  { value: "GOOD", label: "Dobrý" },
  { value: "FAIR", label: "Přijatelný" },
  { value: "DAMAGED", label: "Poškozené" },
] as const;

// ============================================
// COMPONENT
// ============================================

export function QuickStep3() {
  const router = useRouter();
  const { draft, updateSection, saveDraft } = useDraftContext();
  const { isOnline } = useOnlineStatus();

  const decoded = draft?.vin?.decodedData as VinDecoderResult | undefined;

  const [mileage, setMileage] = useState(
    draft?.details?.mileage ? String(draft.details.mileage) : ""
  );
  const [priceFormatted, setPriceFormatted] = useState(
    draft?.pricing?.price
      ? formatPriceInput(String(draft.pricing.price))
      : ""
  );
  const [condition, setCondition] = useState(
    (draft?.details?.condition as string) ?? ""
  );
  const [description, setDescription] = useState(
    (draft?.details?.description as string) ?? ""
  );
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const price = useMemo(
    () => parsePriceInput(priceFormatted),
    [priceFormatted]
  );

  const commission = useMemo(
    () => (price > 0 ? Math.max(price * 0.05, 25000) : 0),
    [price]
  );

  const mileageNum = parseInt(mileage.replace(/\s/g, ""), 10) || 0;

  const canSubmit =
    mileageNum > 0 && price > 0 && condition.length > 0 && !submitting;

  const handlePriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPriceFormatted(formatPriceInput(e.target.value));
    },
    []
  );

  const handleMileageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "");
      setMileage(digits);
    },
    []
  );

  // Generate AI description
  const handleGenerateDescription = useCallback(async () => {
    if (generatingDesc) return;
    const brand = decoded?.brand ?? (draft?.details?.brand as string) ?? "";
    const model = decoded?.model ?? (draft?.details?.model as string) ?? "";
    if (!brand || !model) return;

    setGeneratingDesc(true);
    try {
      const res = await fetch("/api/assistant/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          model,
          year: decoded?.year ?? (draft?.details?.year as number) ?? new Date().getFullYear(),
          mileage: mileageNum || 0,
          condition: condition || "GOOD",
          fuelType: decoded?.fuelType,
          transmission: decoded?.transmission,
          enginePower: decoded?.enginePower,
          bodyType: decoded?.bodyType,
          equipment: [],
          highlights: [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.description) setDescription(data.description);
      }
    } catch {
      // Silently fail
    } finally {
      setGeneratingDesc(false);
    }
  }, [generatingDesc, decoded, draft?.details, mileageNum, condition]);

  // Odeslat rychlý draft
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !draft) return;

    setSubmitting(true);
    setSubmitError(null);

    // Uložit data do draftu
    updateSection("details", {
      ...draft.details,
      mileage: mileageNum,
      condition,
      brand: decoded?.brand ?? (draft.details?.brand as string) ?? "",
      model: decoded?.model ?? (draft.details?.model as string) ?? "",
      variant: decoded?.variant,
      year: decoded?.year ?? (draft.details?.year as number) ?? new Date().getFullYear(),
      fuelType: decoded?.fuelType,
      transmission: decoded?.transmission,
      enginePower: decoded?.enginePower,
      engineCapacity: decoded?.engineCapacity,
      bodyType: decoded?.bodyType,
      doorsCount: decoded?.doorsCount,
      seatsCount: decoded?.seatsCount,
      description: description || undefined,
    });

    updateSection("pricing", {
      price,
      priceNegotiable: true,
      commission: Math.round(commission),
    });

    await saveDraft();

    if (!isOnline) {
      // Offline: uložit draft jako pending_sync
      setSubmitError(
        "Jste offline. Draft byl uložen a bude odeslán po připojení."
      );
      setSubmitting(false);
      return;
    }

    try {
      // Sestavit payload pro API
      const vin = draft.vin?.vin as string;
      const contact = draft.contact ?? {};

      // Upload photos from IndexedDB to Cloudinary
      const draftPhotos = draft.photos?.photos ?? [];
      const imageUrls = await uploadDraftPhotos(draft.id, draftPhotos);

      const payload = {
        vin,
        sellerName: (contact.sellerName as string) ?? "",
        sellerPhone: (contact.sellerPhone as string) ?? "",
        latitude: contact.latitude as number | undefined,
        longitude: contact.longitude as number | undefined,
        brand: decoded?.brand ?? (draft.details?.brand as string) ?? "Neznámá",
        model: decoded?.model ?? (draft.details?.model as string) ?? "Neznámý",
        variant: decoded?.variant,
        year:
          decoded?.year ??
          (draft.details?.year as number) ??
          new Date().getFullYear(),
        fuelType: decoded?.fuelType,
        transmission: decoded?.transmission,
        enginePower: decoded?.enginePower,
        engineCapacity: decoded?.engineCapacity,
        bodyType: decoded?.bodyType,
        doorsCount: decoded?.doorsCount,
        seatsCount: decoded?.seatsCount,
        images: imageUrls,
        mileage: mileageNum,
        price,
        condition,
        description: description || undefined,
      };

      const res = await fetch("/api/vehicles/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error ?? "Chyba při odesílání");
        setSubmitting(false);
        return;
      }

      const data = await res.json();

      // Smazat lokální draft
      if (draft.id) {
        const { deleteDraft } = await import("@/lib/hooks/useDraft").then(() => ({
          deleteDraft: async () => {
            const { offlineStorage } = await import("@/lib/offline/storage");
            await offlineStorage.deleteDraft(draft.id);
          },
        }));
        await deleteDraft();
      }

      // Redirect na success
      router.push(
        `/makler/vehicles/quick/success?vehicleId=${data.vehicle.id}`
      );
    } catch (err) {
      console.error("Quick submit error:", err);
      setSubmitError("Nepodařilo se odeslat. Zkuste to znovu.");
      setSubmitting(false);
    }
  }, [
    canSubmit,
    draft,
    updateSection,
    mileageNum,
    condition,
    decoded,
    price,
    commission,
    description,
    saveDraft,
    isOnline,
    router,
  ]);

  return (
    <StepLayout
      step={3}
      title="Cena a odeslání"
      totalSteps={3}
      showSave
    >
      <div className="space-y-6">
        {/* Dekódované auto — shrnuti */}
        {decoded && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-bold text-gray-900">
              {decoded.brand} {decoded.model}{" "}
              {decoded.variant ? `(${decoded.variant})` : ""}{" "}
              {decoded.year ? `• ${decoded.year}` : ""}
            </p>
          </div>
        )}

        {/* Najeto km */}
        <div>
          <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
            Najeto km *
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={mileage}
              onChange={handleMileageChange}
              placeholder="0"
              className="w-full px-[18px] py-3.5 text-[15px] font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg transition-all duration-200 hover:bg-gray-100 focus:bg-white focus:border-orange-500 focus:shadow-[0_0_0_4px_var(--orange-100)] focus:outline-none pr-14"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              km
            </span>
          </div>
        </div>

        {/* Prodejní cena */}
        <div>
          <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
            Prodejní cena *
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={priceFormatted}
              onChange={handlePriceChange}
              placeholder="0"
              className="w-full px-[18px] py-3.5 text-[15px] font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg transition-all duration-200 hover:bg-gray-100 focus:bg-white focus:border-orange-500 focus:shadow-[0_0_0_4px_var(--orange-100)] focus:outline-none pr-14"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              Kč
            </span>
          </div>
        </div>

        {/* Provize */}
        {price > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Vaše provize:</span>
              <span className="text-lg font-bold text-green-700">
                {formatCurrency(Math.round(commission))}
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              5 % z prodejní ceny, min. 25 000 Kč
            </p>
          </div>
        )}

        {/* Stav vozidla */}
        <div>
          <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-3">
            Stav vozidla *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => setCondition(c.value)}
                className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  condition === c.value
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Popis vozidla (volitelný) */}
        <div>
          <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
            Popis vozidla
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Volitelný popis vozidla..."
            rows={4}
            className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-300 focus:bg-white resize-none transition-colors"
          />
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={generatingDesc || !decoded?.brand}
            className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            {generatingDesc ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generuji popis...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5z" clipRule="evenodd" />
                </svg>
                Vygenerovat popis AI
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {submitError && (
          <Alert variant="error">
            <span className="text-sm">{submitError}</span>
          </Alert>
        )}

        {/* Info o dalším kroku */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm text-orange-800 font-medium">
            Po odeslání budete mít 48 hodin na doplnění zbývajících údajů
            (prohlídka, výbava, lokace, smlouva, další fotky).
          </p>
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full"
          size="lg"
          variant="primary"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Odesílám...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>&#9889;</span>
              Odeslat rychlý draft
            </span>
          )}
        </Button>
      </div>
    </StepLayout>
  );
}
