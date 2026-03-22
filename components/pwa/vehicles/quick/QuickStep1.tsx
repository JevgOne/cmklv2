"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { offlineStorage } from "@/lib/offline/storage";
import { StepLayout } from "@/components/pwa/vehicles/new/StepLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import type { VinDecoderResult } from "@/types/vehicle-draft";

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{0,17}$/;
const VIN_FULL_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

interface DuplicateInfo {
  id: string;
  brand: string;
  model: string;
  status: string;
  broker: string | null;
}

export function QuickStep1() {
  const router = useRouter();
  const { draft, updateSection, saveDraft } = useDraftContext();
  const { isOnline } = useOnlineStatus();

  // VIN state
  const [vin, setVin] = useState(draft?.vin?.vin ?? "");
  const [vinValid, setVinValid] = useState<boolean | null>(null);
  const [duplicateChecking, setDuplicateChecking] = useState(false);
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);
  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [decoded, setDecoded] = useState<VinDecoderResult | null>(
    (draft?.vin?.decodedData as VinDecoderResult | undefined) ?? null
  );
  const [decodeError, setDecodeError] = useState<string | null>(null);

  // Kontakt state
  const [sellerName, setSellerName] = useState(
    (draft?.contact?.sellerName as string) ?? ""
  );
  const [sellerPhone, setSellerPhone] = useState(
    (draft?.contact?.sellerPhone as string) ?? ""
  );

  // Geolokace
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(
    draft?.contact?.latitude && draft?.contact?.longitude
      ? {
          lat: draft.contact.latitude as number,
          lng: draft.contact.longitude as number,
        }
      : null
  );

  const duplicateCheckRef = useRef<AbortController | null>(null);

  // VIN validation
  const handleVinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
        .toUpperCase()
        .replace(/[^A-HJ-NPR-Z0-9]/gi, "");
      if (value.length > 17) return;
      if (!VIN_REGEX.test(value)) return;

      setVin(value);
      setDecodeError(null);

      if (value.length === 17) {
        setVinValid(VIN_FULL_REGEX.test(value));
      } else {
        setVinValid(null);
      }

      setDuplicate(null);
      setDuplicateChecked(false);
      setDecoded(null);
    },
    []
  );

  // Auto-check duplikát
  useEffect(() => {
    if (vin.length !== 17 || !VIN_FULL_REGEX.test(vin) || !isOnline) return;

    if (duplicateCheckRef.current) {
      duplicateCheckRef.current.abort();
    }

    const controller = new AbortController();
    duplicateCheckRef.current = controller;
    setDuplicateChecking(true);

    fetch(`/api/vin/check-duplicate?vin=${vin}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { exists: boolean; vehicle?: DuplicateInfo }) => {
        if (data.exists && data.vehicle) {
          setDuplicate(data.vehicle);
        } else {
          setDuplicate(null);
        }
        setDuplicateChecked(true);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Duplicate check failed:", err);
        }
      })
      .finally(() => {
        setDuplicateChecking(false);
      });

    return () => {
      controller.abort();
    };
  }, [vin, isOnline]);

  // Auto-dekódování VIN po duplikát checku
  useEffect(() => {
    if (!duplicateChecked || duplicate || !VIN_FULL_REGEX.test(vin) || decoded)
      return;

    handleDecode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicateChecked, duplicate, vin]);

  const handleDecode = useCallback(async () => {
    if (!VIN_FULL_REGEX.test(vin)) return;

    setDecoding(true);
    setDecodeError(null);

    if (!isOnline) {
      try {
        const cached = await offlineStorage.getCachedVin(vin);
        if (cached) {
          const cachedData = cached.data as unknown as VinDecoderResult;
          setDecoded(cachedData);
          updateSection("vin", { vin, vinVerified: true, decodedData: cachedData });
        } else {
          updateSection("vin", { vin, vinVerified: false });
        }
      } catch {
        updateSection("vin", { vin, vinVerified: false });
      }
      setDecoding(false);
      return;
    }

    try {
      const res = await fetch(`/api/vin/decode?vin=${vin}`);
      const json = await res.json();

      if (!res.ok) {
        setDecodeError(json.error ?? "Chyba při dekódování VIN");
        updateSection("vin", { vin, vinVerified: false });
        return;
      }

      const result: VinDecoderResult = json.data;
      setDecoded(result);

      try {
        await offlineStorage.cacheVin(
          vin,
          result as unknown as Record<string, unknown>
        );
      } catch {
        // Cache selhala
      }

      updateSection("vin", { vin, vinVerified: true, decodedData: result });
    } catch (err) {
      setDecodeError("Nepodařilo se dekódovat VIN. Zkuste to znovu.");
      console.error("VIN decode error:", err);
    } finally {
      setDecoding(false);
    }
  }, [vin, isOnline, updateSection]);

  // Geolokace
  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setGeoCoords(coords);
        updateSection("contact", {
          ...draft?.contact,
          latitude: coords.lat,
          longitude: coords.lng,
        });
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [draft?.contact, updateSection]);

  // Pokračovat
  const handleNext = useCallback(async () => {
    updateSection("contact", {
      ...draft?.contact,
      sellerName,
      sellerPhone,
      latitude: geoCoords?.lat,
      longitude: geoCoords?.lng,
    });
    updateSection("vin", {
      vin,
      vinVerified: decoded !== null,
      decodedData: decoded ?? undefined,
    });
    await saveDraft();
    router.push(`/makler/vehicles/quick/step2?draft=${draft?.id}`);
  }, [
    updateSection,
    draft?.contact,
    draft?.id,
    sellerName,
    sellerPhone,
    geoCoords,
    vin,
    decoded,
    saveDraft,
    router,
  ]);

  const isVinValid = VIN_FULL_REGEX.test(vin);
  const canProceed =
    isVinValid &&
    !duplicate &&
    sellerName.trim().length > 0 &&
    sellerPhone.trim().length > 0;

  return (
    <StepLayout
      step={1}
      title="VIN + Kontakt"
      totalSteps={3}
      onNext={handleNext}
      nextDisabled={!canProceed}
      nextLabel="Pokracovat"
      showSave
    >
      <div className="space-y-6">
        {/* VIN Input */}
        <div>
          <Input
            label="VIN kód vozidla *"
            value={vin}
            onChange={handleVinChange}
            placeholder="Zadejte 17místný VIN"
            maxLength={17}
            className={
              vinValid === true
                ? "!border-success-500 !bg-success-50/30"
                : vinValid === false
                  ? "!border-error-500 !bg-error-50/30"
                  : ""
            }
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400 font-mono tracking-wider">
              {vin.length} / 17
            </span>
            {vinValid === true && (
              <span className="text-xs text-success-500 font-medium">
                Platný formát
              </span>
            )}
          </div>
        </div>

        {/* Duplikát checking */}
        {duplicateChecking && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
            Kontrola duplicity...
          </div>
        )}

        {/* Duplikát nalezen */}
        {duplicate && (
          <Alert variant="error">
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                Vozidlo s tímto VIN již existuje v systému
              </p>
              <p className="text-sm">
                {duplicate.brand} {duplicate.model} — stav:{" "}
                <span className="font-medium">{duplicate.status}</span>
                {duplicate.broker && <> — makléř: {duplicate.broker}</>}
              </p>
            </div>
          </Alert>
        )}

        {/* Duplikát OK */}
        {duplicateChecked && !duplicate && isVinValid && (
          <div className="flex items-center gap-2 text-sm text-success-500 font-medium">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            VIN je unikátní
          </div>
        )}

        {/* Dekódování */}
        {decoding && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
            Dekóduji VIN...
          </div>
        )}

        {decodeError && (
          <Alert variant="error">
            <span className="text-sm">{decodeError}</span>
          </Alert>
        )}

        {/* Dekódovaná data — kompaktní */}
        {decoded && (
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Dekódováno
              </span>
              <span className="text-xs text-success-500 font-medium">OK</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {decoded.brand} {decoded.model}{" "}
              {decoded.variant ? `(${decoded.variant})` : ""}{" "}
              {decoded.year ? `• ${decoded.year}` : ""}
            </p>
            {(decoded.fuelType || decoded.transmission || decoded.enginePower) && (
              <p className="text-xs text-gray-500 mt-1">
                {decoded.fuelType && formatFuelType(decoded.fuelType)}
                {decoded.transmission &&
                  ` • ${formatTransmission(decoded.transmission)}`}
                {decoded.enginePower && ` • ${decoded.enginePower} kW`}
              </p>
            )}
          </Card>
        )}

        {/* Oddělovač */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
            Kontakt na prodejce
          </h3>

          <div className="space-y-4">
            <Input
              label="Jméno prodejce *"
              placeholder="Jan Novák"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
            />

            <div className="space-y-2">
              <Input
                label="Telefon *"
                type="tel"
                placeholder="+420 xxx xxx xxx"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
              />
              {sellerPhone && (
                <div className="flex gap-2">
                  <a
                    href={`tel:${sellerPhone}`}
                    className="flex-1 text-center py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Zavolat
                  </a>
                  <a
                    href={`sms:${sellerPhone}`}
                    className="flex-1 text-center py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    SMS
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Geolokace */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Poloha
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeolocation}
            disabled={geoLoading}
            className="w-full"
          >
            {geoLoading
              ? "Zjištuji polohu..."
              : geoCoords
                ? "Poloha zaznamenána"
                : "Použít aktuální polohu"}
          </Button>
          {geoCoords && (
            <div className="text-xs text-gray-400 text-center">
              GPS: {geoCoords.lat.toFixed(5)}, {geoCoords.lng.toFixed(5)}
            </div>
          )}
        </div>
      </div>
    </StepLayout>
  );
}

// Helpers
function formatFuelType(value?: string): string | undefined {
  if (!value) return undefined;
  const map: Record<string, string> = {
    PETROL: "Benzín",
    DIESEL: "Diesel",
    ELECTRIC: "Elektro",
    HYBRID: "Hybrid",
    PLUGIN_HYBRID: "Plug-in Hybrid",
    LPG: "LPG",
    CNG: "CNG",
  };
  return map[value] ?? value;
}

function formatTransmission(value?: string): string | undefined {
  if (!value) return undefined;
  const map: Record<string, string> = {
    MANUAL: "Manuální",
    AUTOMATIC: "Automatická",
    DSG: "DSG",
    CVT: "CVT",
  };
  return map[value] ?? value;
}
