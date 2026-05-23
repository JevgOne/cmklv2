"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { StepLayout } from "./StepLayout";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { offlineStorage } from "@/lib/offline/storage";
import { uploadDraftPhotos } from "@/lib/offline/upload-photos";
import { formatPrice, formatMileage } from "@/lib/utils";
import {
  calculateQualityScore,
  getScoreLevel,
  getScoreColor,
  getScoreBgColor,
  getScoreLabel,
  type QualityScoreResult,
} from "@/lib/listing-quality";
import type { VehicleDraft } from "@/types/vehicle-draft";

// ============================================
// Circular Score Indicator
// ============================================

function QualityCircle({ score, size = 120 }: { score: number; size?: number }) {
  const level = getScoreLevel(score);
  const colorClass = getScoreBgColor(level);
  const textColor = getScoreColor(level);
  const label = getScoreLabel(level);

  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  // Map Tailwind classes to stroke colors
  const strokeColor =
    level === "excellent" ? "#22c55e" :
    level === "good" ? "#3b82f6" :
    level === "fair" ? "#f97316" :
    "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={8}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${textColor}`}>{score}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">/ 100</span>
        </div>
      </div>
      <span className={`text-sm font-semibold ${textColor}`}>{label}</span>
    </div>
  );
}

// ============================================
// Score Breakdown Bar
// ============================================

function BreakdownBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">{score}/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// Photo Carousel
// ============================================

function PhotoCarousel({ draftId, photos }: { draftId: string; photos: Array<{ slotId: string; imageId: string; thumbnailUrl: string; isMain?: boolean }> }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Use existing thumbnail URLs from state
    const map = new Map<string, string>();
    for (const p of photos) {
      if (p.thumbnailUrl) map.set(p.imageId, p.thumbnailUrl);
    }
    setThumbnails(map);
  }, [photos]);

  if (photos.length === 0) {
    return (
      <div className="h-48 bg-gray-100 flex items-center justify-center">
        <span className="text-sm text-gray-400">Žádné fotky</span>
      </div>
    );
  }

  const mainPhoto = photos.find((p) => p.isMain) ?? photos[0];
  const displayPhotos = [
    mainPhoto,
    ...photos.filter((p) => p !== mainPhoto),
  ];

  const current = displayPhotos[activeIndex];
  const thumbUrl = current ? (thumbnails.get(current.imageId) || current.thumbnailUrl) : undefined;

  return (
    <div className="relative">
      {/* Main image */}
      <div className="h-56 bg-gray-100 relative overflow-hidden">
        {thumbUrl ? (
          <img src={thumbUrl} alt="Foto" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Counter badge */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
          {activeIndex + 1} / {displayPhotos.length}
        </div>

        {/* Nav arrows */}
        {displayPhotos.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((i) => (i - 1 + displayPhotos.length) % displayPhotos.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => setActiveIndex((i) => (i + 1) % displayPhotos.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {displayPhotos.length > 1 && (
        <div className="flex gap-1 p-2 overflow-x-auto bg-gray-50">
          {displayPhotos.slice(0, 8).map((p, i) => {
            const url = thumbnails.get(p.imageId) || p.thumbnailUrl;
            return (
              <button
                key={p.imageId}
                onClick={() => setActiveIndex(i)}
                className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-colors ${
                  i === activeIndex ? "border-orange-500" : "border-transparent"
                }`}
              >
                {url ? (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </button>
            );
          })}
          {displayPhotos.length > 8 && (
            <div className="flex-shrink-0 w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium">
              +{displayPhotos.length - 8}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Section Header with Edit Button
// ============================================

function SectionHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
      <button
        onClick={onEdit}
        className="text-xs text-orange-500 font-medium hover:text-orange-600 flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
        </svg>
        Upravit
      </button>
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function ReviewStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft") || "";
  const { draft, updateStatus, saveDraft } = useDraftContext();
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const qualityResult = useMemo<QualityScoreResult | null>(
    () => (draft ? calculateQualityScore(draft) : null),
    [draft]
  );

  const details = draft?.details ?? {};
  const pricing = draft?.pricing ?? {};
  const contact = draft?.contact ?? {};
  const allPhotos = (draft?.photos?.photos ?? []) as unknown as Array<{ slotId: string; imageId: string; thumbnailUrl: string; isMain?: boolean }>;

  const vehicleTitle = [details.brand, details.model, details.variant]
    .filter(Boolean)
    .join(" ");

  const handleGoToStep = useCallback(
    (route: string) => {
      router.push(`/makler/vehicles/new/${route}?draft=${draftId}`);
    },
    [router, draftId]
  );

  const handleBack = () => {
    router.push(`/makler/vehicles/new/pricing?draft=${draftId}`);
  };

  const handleSaveDraft = async () => {
    await saveDraft();
    router.push("/makler/vehicles/new");
  };

  const handleSubmit = async () => {
    if (!draft || !qualityResult?.canSubmit) return;

    // Prevent duplicate submission
    if (draft.status === "submitted" || draft.status === "pending_sync") {
      setSubmitError("Toto vozidlo již bylo odesláno.");
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    // Mark draft as pending_sync BEFORE POST (survives page refresh)
    updateStatus("pending_sync");
    await saveDraft();

    try {
      if (navigator.onLine) {
        // Online: POST to API — transform draft sections to flat schema
        const d = draft.details ?? {};
        const p = draft.pricing ?? {};
        const v = draft.vin ?? {};
        const c = draft.contact ?? {};
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
          sellerName: c.sellerName,
          sellerPhone: c.sellerPhone,
          sellerEmail: c.sellerEmail,
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

        // Upload photos from IndexedDB to Cloudinary
        const photoRecords = draft.photos?.photos ?? [];
        if (photoRecords.length > 0) {
          setSubmitStatus("Nahrávám fotky...");
          const imageUrls = await uploadDraftPhotos(
            draft.id,
            photoRecords,
            (done, total) => setSubmitStatus(`Nahrávám fotky... (${done}/${total})`)
          );
          if (imageUrls.length > 0) {
            setSubmitStatus("Ukládám fotky k vozidlu...");
            await fetch(`/api/vehicles/${result.id}/images`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ images: imageUrls }),
            });
          }
        }

        // Upload inspection photos (defects + wheels)
        const inspectionImageIds: string[] = [];
        if (draft.inspection?.defects?.length) {
          for (const defect of draft.inspection.defects) {
            if (defect.imageId) inspectionImageIds.push(defect.imageId);
          }
        }
        if (draft.inspection?.wheelPhotos) {
          const wp = draft.inspection.wheelPhotos;
          for (const key of ["LP", "PP", "LZ", "PZ"] as const) {
            if (wp[key]) inspectionImageIds.push(wp[key]);
          }
        }
        if (inspectionImageIds.length > 0) {
          setSubmitStatus("Nahrávám inspekční fotky...");
          const { uploadImagesByIds, replaceLocalIdsWithUrls } = await import("@/lib/offline/upload-photos");
          const inspectionUploaded = await uploadImagesByIds(draft.id, inspectionImageIds);
          if (inspectionUploaded.size > 0 && draft.inspection) {
            const updatedInspection = replaceLocalIdsWithUrls(draft.inspection, inspectionUploaded);
            await fetch(`/api/vehicles/${result.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ inspectionData: JSON.stringify(updatedInspection) }),
            });
          }
        }

        // Transition DRAFT → PENDING
        setSubmitStatus("Odesílám ke schválení...");
        const statusRes = await fetch(`/api/vehicles/${result.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PENDING" }),
        });
        if (!statusRes.ok) {
          console.error("Failed to transition to PENDING:", await statusRes.text());
        }

        updateStatus("submitted");
        await saveDraft();

        await offlineStorage.saveDraft(draft.id, {
          ...draft,
          serverId: result.id,
          status: "submitted",
        } as unknown as Record<string, unknown>);

        // Lead→Vehicle: update lead status to VEHICLE_ADDED
        if (draft.contact?.leadId) {
          try {
            await fetch(`/api/leads/${draft.contact.leadId}/status`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "VEHICLE_ADDED",
                vehicleId: result.id,
              }),
            });
          } catch {
            // Non-critical — vehicle was created successfully
          }
        }

        router.push(`/makler/vehicles/new/success?draft=${draftId}&vehicleId=${result.id}`);
      } else {
        // Offline: queue as pending action
        updateStatus("pending_sync");
        await saveDraft();
        const od = draft.details ?? {};
        const op = draft.pricing ?? {};
        const ov = draft.vin ?? {};
        const oc = draft.contact ?? {};
        await offlineStorage.addPendingAction(
          `submit_${draft.id}`,
          "SUBMIT_VEHICLE",
          {
            _draftId: draft.id,
            _photos: draft.photos?.photos ?? [],
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
            sellerName: oc.sellerName,
            sellerPhone: oc.sellerPhone,
            sellerEmail: oc.sellerEmail,
          }
        );

        router.push(`/makler/vehicles/new/success?draft=${draftId}&offline=1`);
      }
    } catch (err) {
      // Rollback draft status on failure
      updateStatus("draft");
      await saveDraft();
      setSubmitError(
        err instanceof Error ? err.message : "Neznámá chyba při odesílání"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!draft) return null;

  return (
    <StepLayout
      step={8}
      title="Kontrola a odeslání"
      onBack={handleBack}
      showSave
    >
      <div className="space-y-6">
        {/* ======== Quality Score ======== */}
        {qualityResult && (
          <Card className="p-6">
            <div className="flex items-start gap-6">
              <QualityCircle score={qualityResult.total} />
              <div className="flex-1 space-y-2.5 pt-1">
                <BreakdownBar label="Fotky" score={qualityResult.breakdown.photos.score} max={35} color="bg-blue-500" />
                <BreakdownBar label="Data" score={qualityResult.breakdown.data.score} max={30} color="bg-green-500" />
                <BreakdownBar label="Popis" score={qualityResult.breakdown.description.score} max={20} color="bg-purple-500" />
                <BreakdownBar label="Výbava" score={qualityResult.breakdown.equipment.score} max={15} color="bg-orange-500" />
              </div>
            </div>

            {!qualityResult.canSubmit && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <p className="text-sm font-semibold text-red-700">
                  Minimum pro odeslání: 60 bodů (aktuálně {qualityResult.total})
                </p>
              </div>
            )}
          </Card>
        )}

        {/* ======== Listing Preview ======== */}
        <Card className="overflow-hidden">
          <SectionHeader title="Náhled inzerátu" onEdit={() => handleGoToStep("photos")} />

          {/* Photo carousel */}
          <PhotoCarousel draftId={draftId} photos={allPhotos} />

          <div className="p-4 space-y-3">
            {/* Title + Price */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {vehicleTitle || "Bez názvu"}
                </h2>
                {details.year && (
                  <p className="text-sm text-gray-500">{details.year}</p>
                )}
              </div>
              {pricing.price ? (
                <div className="text-xl font-bold text-orange-500 whitespace-nowrap">
                  {formatPrice(pricing.price)}
                </div>
              ) : (
                <span className="text-sm text-gray-400">Cena nenastavena</span>
              )}
            </div>

            {/* Tech params grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {details.mileage != null && (
                <ParamRow label="Nájezd" value={formatMileage(details.mileage)} />
              )}
              {details.fuelType && <ParamRow label="Palivo" value={details.fuelType} />}
              {details.transmission && <ParamRow label="Převodovka" value={details.transmission} />}
              {details.enginePower && <ParamRow label="Výkon" value={`${details.enginePower} kW`} />}
              {details.engineCapacity && <ParamRow label="Objem" value={`${details.engineCapacity} ccm`} />}
              {details.bodyType && <ParamRow label="Karoserie" value={details.bodyType} />}
              {details.color && <ParamRow label="Barva" value={details.color} />}
              {details.drivetrain && <ParamRow label="Pohon" value={details.drivetrain} />}
              {details.doorsCount && <ParamRow label="Dveře" value={`${details.doorsCount}`} />}
              {details.seatsCount && <ParamRow label="Sedadla" value={`${details.seatsCount}`} />}
            </div>

            {/* Location */}
            {pricing.city && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                </svg>
                {pricing.city}{pricing.district ? `, ${pricing.district}` : ""}
              </div>
            )}
          </div>
        </Card>

        {/* ======== Highlights ======== */}
        {details.highlights && details.highlights.length > 0 && (
          <div>
            <SectionHeader title="Highlights" onEdit={() => handleGoToStep("details")} />
            <div className="flex flex-wrap gap-2">
              {details.highlights.map((h, i) => (
                <Badge key={i} variant="success">{h}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* ======== Description ======== */}
        {details.description && (
          <div>
            <SectionHeader title="Popis" onEdit={() => handleGoToStep("details")} />
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line line-clamp-6">
              {details.description}
            </p>
          </div>
        )}

        {/* ======== Equipment ======== */}
        {details.equipment && details.equipment.length > 0 && (
          <div>
            <SectionHeader title="Výbava" onEdit={() => handleGoToStep("equipment")} />
            <div className="flex flex-wrap gap-1.5">
              {details.equipment.map((item, i) => (
                <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ======== Contact ======== */}
        <div>
          <SectionHeader title="Kontakt" onEdit={() => handleGoToStep("contact")} />
          <div className="text-sm text-gray-700 space-y-1">
            {contact.sellerName && <p>{contact.sellerName}</p>}
            {contact.sellerPhone && <p>{contact.sellerPhone}</p>}
            {contact.sellerEmail && <p className="text-gray-500">{contact.sellerEmail}</p>}
          </div>
        </div>

        {/* ======== Consistency Warnings ======== */}
        {qualityResult && qualityResult.consistencyWarnings.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Upozornění na nesrovnalosti
            </h3>
            {qualityResult.consistencyWarnings.map((w) => (
              <button
                key={w.id}
                onClick={() => handleGoToStep(w.route)}
                className="w-full bg-amber-50 border border-amber-200 rounded-lg p-3 text-left hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-amber-800">{w.message}</p>
                    <p className="text-xs text-amber-600 mt-0.5">-{w.penalty} bodů</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-400 ml-auto flex-shrink-0 mt-1">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ======== Recommendations ======== */}
        {qualityResult && qualityResult.recommendations.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Jak získat více bodů
            </h3>
            {qualityResult.recommendations.map((rec, i) => (
              <button
                key={i}
                onClick={() => handleGoToStep(rec.route)}
                className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 text-left hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    +{rec.points}b
                  </span>
                  <span className="text-sm text-blue-800 flex-1">{rec.message}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-400 flex-shrink-0">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ======== Status Alerts ======== */}
        {draft.status === "submitted" && (
          <Alert variant="info">
            <span className="text-sm">
              Toto vozidlo bylo odesláno ke schválení.
              {draft.serverId && (
                <> <a href={`/makler/vehicles/${draft.serverId}`} className="font-medium text-orange-500 underline">Zobrazit detail</a></>
              )}
            </span>
          </Alert>
        )}
        {draft.status === "pending_sync" && (
          <Alert variant="warning">
            <span className="text-sm">Vozidlo čeká na odeslání (offline). Bude odesláno automaticky.</span>
          </Alert>
        )}

        {submitError && (
          <Alert variant="error">
            <span className="text-sm">{submitError}</span>
          </Alert>
        )}

        {/* ======== Action Buttons ======== */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <Button
            variant="primary"
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={!qualityResult?.canSubmit || submitting}
          >
            {submitting
              ? (submitStatus || "Odesílám...")
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

// ============================================
// Helper Components
// ============================================

function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
