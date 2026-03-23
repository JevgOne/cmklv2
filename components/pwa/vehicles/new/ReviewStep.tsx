"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { StepLayout } from "./StepLayout";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { offlineStorage } from "@/lib/offline/storage";
import { formatPrice, formatMileage } from "@/lib/utils";
import type { VehicleDraft } from "@/types/vehicle-draft";

interface ChecklistItem {
  id: string;
  label: string;
  passed: boolean;
  step: number;
  route: string;
}

function buildChecklist(draft: VehicleDraft): ChecklistItem[] {
  const contact = draft.contact ?? {};
  const vin = draft.vin ?? {};
  const details = draft.details ?? {};
  const photos = draft.photos ?? {};
  const pricing = draft.pricing ?? {};

  return [
    {
      id: "vin",
      label: "VIN zadáno",
      passed: !!vin.vin && vin.vin.length === 17,
      step: 3,
      route: "vin",
    },
    {
      id: "brand_model",
      label: "Značka a model",
      passed: !!details.brand && !!details.model,
      step: 5,
      route: "details",
    },
    {
      id: "year_mileage",
      label: "Rok a nájezd",
      passed: !!details.year && !!details.mileage,
      step: 5,
      route: "details",
    },
    {
      id: "fuel_trans",
      label: "Palivo a převodovka",
      passed: !!details.fuelType && !!details.transmission,
      step: 5,
      route: "details",
    },
    {
      id: "equipment",
      label: "Výbava (alespoň 1 položka)",
      passed: !!details.equipment && details.equipment.length > 0,
      step: 5,
      route: "details",
    },
    {
      id: "photos_min",
      label: "Fotky (min. 12 + 3 dokumenty)",
      passed: countPhotosByType(photos) >= 15,
      step: 4,
      route: "photos",
    },
    {
      id: "price",
      label: "Cena nastavena",
      passed: !!pricing.price && pricing.price > 0,
      step: 6,
      route: "pricing",
    },
    {
      id: "city",
      label: "Lokace / město",
      passed: !!pricing.city,
      step: 6,
      route: "pricing",
    },
    {
      id: "description",
      label: "Popis vozidla",
      passed: !!details.description && details.description.length > 20,
      step: 5,
      route: "details",
    },
    {
      id: "seller",
      label: "Kontakt na prodejce",
      passed: !!contact.sellerName && !!contact.sellerPhone,
      step: 1,
      route: "contact",
    },
  ];
}

function countPhotosByType(photos: VehicleDraft["photos"]): number {
  return photos?.photos?.length ?? 0;
}

export function ReviewStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft") || "";
  const { draft, updateStatus, saveDraft } = useDraftContext();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const checklist = useMemo(
    () => (draft ? buildChecklist(draft) : []),
    [draft]
  );

  const allPassed = checklist.every((item) => item.passed);
  const passedCount = checklist.filter((item) => item.passed).length;

  const details = draft?.details ?? {};
  const pricing = draft?.pricing ?? {};
  const photos = draft?.photos ?? {};

  const vehicleTitle = [details.brand, details.model, details.variant]
    .filter(Boolean)
    .join(" ");

  const handleBack = () => {
    router.push(`/makler/vehicles/new/pricing?draft=${draftId}`);
  };

  const handleSaveDraft = async () => {
    await saveDraft();
    router.push("/makler/vehicles/new");
  };

  const handleSubmit = async () => {
    if (!draft || !allPassed) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      if (navigator.onLine) {
        // Online: POST to API — transform draft sections to flat schema
        const d = draft.details ?? {};
        const p = draft.pricing ?? {};
        const v = draft.vin ?? {};
        const flatPayload = {
          vin: v.vin ?? "",
          brand: d.brand ?? "",
          model: d.model ?? "",
          variant: d.variant,
          year: d.year ?? 0,
          mileage: d.mileage ?? 0,
          fuelType: d.fuelType ?? "",
          transmission: d.transmission ?? "",
          enginePower: d.enginePower,
          engineCapacity: d.engineCapacity,
          bodyType: d.bodyType,
          color: d.color,
          doorsCount: d.doorsCount,
          seatsCount: d.seatsCount,
          condition: d.condition ?? "",
          stkValidUntil: d.stkValidUntil,
          serviceBook: d.serviceBook,
          price: p.price ?? 0,
          priceNegotiable: p.priceNegotiable,
          equipment: d.equipment,
          description: d.description,
          city: p.city ?? "",
          district: p.district,
          latitude: p.latitude,
          longitude: p.longitude,
        };

        const response = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(flatPayload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            (data as Record<string, string>).error || `Chyba serveru: ${response.status}`
          );
        }

        const result = (await response.json()) as { id: string };
        updateStatus("submitted");
        await saveDraft();

        // Uložit vehicle ID
        await offlineStorage.saveDraft(draft.id, {
          ...draft,
          serverId: result.id,
          status: "submitted",
        } as unknown as Record<string, unknown>);

        router.push(`/makler/vehicles/new/success?draft=${draftId}`);
      } else {
        // Offline: uložit jako pending sync
        updateStatus("pending_sync");
        await saveDraft();
        const od = draft.details ?? {};
        const op = draft.pricing ?? {};
        const ov = draft.vin ?? {};
        await offlineStorage.addPendingAction(
          `submit_${draft.id}`,
          "SUBMIT_VEHICLE",
          {
            vin: ov.vin ?? "",
            brand: od.brand ?? "",
            model: od.model ?? "",
            variant: od.variant,
            year: od.year ?? 0,
            mileage: od.mileage ?? 0,
            fuelType: od.fuelType ?? "",
            transmission: od.transmission ?? "",
            enginePower: od.enginePower,
            engineCapacity: od.engineCapacity,
            bodyType: od.bodyType,
            color: od.color,
            doorsCount: od.doorsCount,
            seatsCount: od.seatsCount,
            condition: od.condition ?? "",
            stkValidUntil: od.stkValidUntil,
            serviceBook: od.serviceBook,
            price: op.price ?? 0,
            priceNegotiable: op.priceNegotiable,
            equipment: od.equipment,
            description: od.description,
            city: op.city ?? "",
            district: op.district,
            latitude: op.latitude,
            longitude: op.longitude,
          }
        );

        router.push(`/makler/vehicles/new/success?draft=${draftId}&offline=1`);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Neznámá chyba při odesílání"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToStep = (route: string) => {
    router.push(`/makler/vehicles/new/${route}?draft=${draftId}`);
  };

  if (!draft) return null;

  return (
    <StepLayout
      step={7}
      title="Kontrola"
      onBack={handleBack}
      showSave
    >
      <div className="space-y-6">
        {/* Náhled inzerátu */}
        <Card className="overflow-hidden">
          {/* Carousel placeholder */}
          <div className="h-48 bg-gray-100 flex items-center justify-center">
            {photos.photos && photos.photos.length > 0 ? (
              <div className="text-center">
                <span className="text-3xl text-gray-400 block">
                  {photos.photos.length}
                </span>
                <span className="text-xs text-gray-400">
                  fotek
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Žádné fotky</span>
            )}
          </div>
          <div className="p-4 space-y-2">
            <h2 className="text-lg font-bold text-gray-900">
              {vehicleTitle || "Bez názvu"}
            </h2>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {details.year && <span>{details.year}</span>}
              {details.mileage && (
                <>
                  <span>|</span>
                  <span>{formatMileage(details.mileage)}</span>
                </>
              )}
              {details.fuelType && (
                <>
                  <span>|</span>
                  <span>{details.fuelType}</span>
                </>
              )}
              {details.transmission && (
                <>
                  <span>|</span>
                  <span>{details.transmission}</span>
                </>
              )}
              {details.enginePower && (
                <>
                  <span>|</span>
                  <span>{details.enginePower} kW</span>
                </>
              )}
            </div>
            {pricing.price ? (
              <div className="text-xl font-bold text-orange-500">
                {formatPrice(pricing.price)}
              </div>
            ) : (
              <div className="text-sm text-gray-400">Cena nenastavena</div>
            )}
            {pricing.city && (
              <div className="text-xs text-gray-400">{pricing.city}</div>
            )}
          </div>
        </Card>

        {/* Checklist kompletnosti */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Kontrola kompletnosti
            </h3>
            <span
              className={`text-sm font-semibold ${
                allPassed ? "text-green-600" : "text-orange-500"
              }`}
            >
              {passedCount} / {checklist.length}
            </span>
          </div>

          <div className="space-y-1.5">
            {checklist.map((item) => (
              <button
                key={item.id}
                onClick={!item.passed ? () => handleGoToStep(item.route) : undefined}
                disabled={item.passed}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  item.passed
                    ? "bg-green-50"
                    : "bg-red-50 hover:bg-red-100 cursor-pointer"
                }`}
              >
                {item.passed ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-green-600 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-red-500 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span
                  className={`text-sm font-medium ${
                    item.passed ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {item.label}
                </span>
                {!item.passed && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-4 h-4 text-red-400 ml-auto"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chybový stav */}
        {submitError && (
          <Alert variant="error">
            <span className="text-sm">{submitError}</span>
          </Alert>
        )}

        {/* Akční tlačítka */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <Button
            variant="primary"
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={!allPassed || submitting}
          >
            {submitting
              ? "Odesílám..."
              : navigator.onLine
                ? "Odeslat ke schválení"
                : "Uložit k odeslání (offline)"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSaveDraft}
          >
            Uložit jako draft
          </Button>
        </div>
      </div>
    </StepLayout>
  );
}
