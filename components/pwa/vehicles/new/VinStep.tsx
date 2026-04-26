"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { offlineStorage } from "@/lib/offline/storage";
import { StepLayout } from "./StepLayout";
import { VinScanModal } from "./VinScanModal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { HintBox } from "./HintBox";
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

export function VinStep() {
  const router = useRouter();
  const { draft, updateSection, saveDraft } = useDraftContext();
  const { isOnline } = useOnlineStatus();

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
  const [manualEntryNote, setManualEntryNote] = useState(false);
  const [offlineNote, setOfflineNote] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [autoDecodeQueued, setAutoDecodeQueued] = useState(false);

  const duplicateCheckRef = useRef<AbortController | null>(null);

  // Detekce kamery
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        setHasCamera(devices.some((d) => d.kind === "videoinput"));
      }).catch(() => setHasCamera(false));
    }
  }, []);

  // Validace VIN při psaní
  const handleVinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, "");
      if (value.length > 17) return;

      // Re-filter přes regex (odstraní I, O, Q)
      if (!VIN_REGEX.test(value)) return;

      setVin(value);
      setDecodeError(null);
      setManualEntryNote(false);
      setOfflineNote(false);

      if (value.length === 17) {
        setVinValid(VIN_FULL_REGEX.test(value));
      } else if (value.length > 0) {
        setVinValid(null); // Ještě neúplný
      } else {
        setVinValid(null);
      }

      // Reset duplikát check pokud se změní VIN
      setDuplicate(null);
      setDuplicateChecked(false);
      setDecoded(null);
    },
    []
  );

  // Auto-check duplicity po zadání 17 znaků
  useEffect(() => {
    if (vin.length !== 17 || !VIN_FULL_REGEX.test(vin) || !isOnline) return;

    // Cancel předchozí
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

  // Dekódování VIN
  const handleDecode = useCallback(async () => {
    if (!VIN_FULL_REGEX.test(vin)) return;

    setDecoding(true);
    setDecodeError(null);
    setOfflineNote(false);

    if (!isOnline) {
      // Offline: zkusit IndexedDB cache
      try {
        const cached = await offlineStorage.getCachedVin(vin);
        if (cached) {
          const cachedData = cached.data as unknown as VinDecoderResult;
          setDecoded(cachedData);
          updateSection("vin", {
            vin,
            vinVerified: true,
            decodedData: cachedData,
          });
        } else {
          setOfflineNote(true);
          // Uložit VIN bez dekódování
          updateSection("vin", {
            vin,
            vinVerified: false,
          });
        }
      } catch {
        setOfflineNote(true);
        updateSection("vin", {
          vin,
          vinVerified: false,
        });
      }
      setDecoding(false);
      return;
    }

    try {
      const res = await fetch(`/api/vin/decode?vin=${vin}`);
      const json = await res.json();

      if (!res.ok) {
        // API selhalo — uložit VIN bez dekódování, umožnit manuální zadání
        setManualEntryNote(true);
        updateSection("vin", {
          vin,
          vinVerified: false,
        });
        return;
      }

      const result: VinDecoderResult = json.data;
      const isManual = json.manual === true;

      if (isManual || !result.brand) {
        // API nevrátilo data — manuální zadání v dalším kroku
        setManualEntryNote(true);
        updateSection("vin", {
          vin,
          vinVerified: false,
        });
      } else {
        setDecoded(result);
        setManualEntryNote(false);

        // Cache do IndexedDB
        try {
          await offlineStorage.cacheVin(vin, result as unknown as Record<string, unknown>);
        } catch {
          // Cache selhala, ale dekódování proběhlo
        }

        // Uložit do draftu
        updateSection("vin", {
          vin,
          vinVerified: true,
          decodedData: result,
        });
      }
    } catch (err) {
      // Fetch selhalo — umožnit pokračování s manuálním zadáním
      console.error("VIN decode error:", err);
      setManualEntryNote(true);
      updateSection("vin", {
        vin,
        vinVerified: false,
      });
    } finally {
      setDecoding(false);
    }
  }, [vin, isOnline, updateSection]);

  // Auto-decode po kamerovém skenu (čeká na duplikát check)
  useEffect(() => {
    if (autoDecodeQueued && duplicateChecked && !duplicate && VIN_FULL_REGEX.test(vin)) {
      setAutoDecodeQueued(false);
      handleDecode();
    }
  }, [autoDecodeQueued, duplicateChecked, duplicate, vin, handleDecode]);

  // Pokračovat na další krok
  const handleNext = useCallback(async () => {
    if (!VIN_FULL_REGEX.test(vin)) return;

    updateSection("vin", {
      vin,
      vinVerified: decoded !== null,
      decodedData: decoded ?? undefined,
    });

    await saveDraft();
    router.push(`/makler/vehicles/new/contact?draft=${draft?.id}`);
  }, [vin, decoded, updateSection, saveDraft, router, draft?.id]);

  const isValid = VIN_FULL_REGEX.test(vin);
  const canProceed = isValid && !duplicate;

  return (
    <StepLayout
      step={1}
      title="VIN kód"
      onNext={handleNext}
      nextDisabled={!canProceed}
      showSave
    >
      <div className="space-y-6">
        <HintBox>
          VIN (Vehicle Identification Number) je 17místný kód unikátní pro každé auto.
          Najdete ho na štítku ve dveřním sloupku řidiče nebo na palubní desce.
          Po zadání VIN systém automaticky vyplní značku, model a další údaje.
        </HintBox>

        {/* VIN Input */}
        <div>
          <Input
            label="VIN kód vozidla"
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

        {/* Varování: VIN nelze po uložení změnit */}
        <Alert variant="warning">
          <div className="flex items-start gap-2">
            <span className="text-lg leading-none mt-0.5">&#9888;&#65039;</span>
            <span className="text-sm font-medium">
              VIN nelze po uložení změnit!
            </span>
          </div>
        </Alert>

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
                {duplicate.broker && (
                  <> — makléř: {duplicate.broker}</>
                )}
              </p>
            </div>
          </Alert>
        )}

        {/* Duplikát check OK */}
        {duplicateChecked && !duplicate && isValid && (
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

        {/* Dekódovat tlačítko */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={handleDecode}
            disabled={!isValid || decoding || !!duplicate}
            className="flex-1"
          >
            {decoding ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Dekóduji...
              </span>
            ) : decoded ? (
              "Dekódovat znovu"
            ) : (
              "Dekódovat VIN"
            )}
          </Button>

          {/* Skenovat kamerou (Tesseract.js — offline) */}
          {hasCamera && (
            <Button
              variant="outline"
              onClick={() => setScanModalOpen(true)}
              className="shrink-0"
              title="Skenovat VIN kamerou"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              <span className="text-xs">Skenovat</span>
            </Button>
          )}
        </div>

        {/* VIN Scan Modal */}
        <VinScanModal
          open={scanModalOpen}
          onClose={() => setScanModalOpen(false)}
          onVinScanned={(scannedVin) => {
            setVin(scannedVin);
            setVinValid(true);
            setDuplicate(null);
            setDuplicateChecked(false);
            setDecoded(null);
            setAutoDecodeQueued(true);
            setScanModalOpen(false);
          }}
        />

        {/* Decode error */}
        {decodeError && (
          <Alert variant="error">
            <span className="text-sm">{decodeError}</span>
          </Alert>
        )}

        {/* Manual entry note — APIs nevrátily data */}
        {manualEntryNote && !decoded && (
          <Alert variant="info">
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                VIN se nepodařilo automaticky dekódovat
              </p>
              <p className="text-sm">
                Údaje o vozidle (značka, model, rok atd.) vyplníte ručně v dalším kroku.
                Můžete pokračovat kliknutím na &quot;Pokračovat&quot;.
              </p>
            </div>
          </Alert>
        )}

        {/* Offline note */}
        {offlineNote && (
          <Alert variant="info">
            <span className="text-sm">
              Jste offline. VIN bude dekódován po připojení k internetu.
            </span>
          </Alert>
        )}

        {/* Dekódovaná data */}
        {decoded && (
          <Card className="p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              Dekódovaná data
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <DataField label="Značka" value={decoded.brand} />
              <DataField label="Model" value={decoded.model} />
              <DataField label="Varianta" value={decoded.variant} />
              <DataField label="Rok výroby" value={decoded.year?.toString()} />
              <DataField label="Palivo" value={formatFuelType(decoded.fuelType)} />
              <DataField label="Převodovka" value={formatTransmission(decoded.transmission)} />
              <DataField label="Výkon" value={decoded.enginePower ? `${decoded.enginePower} kW` : undefined} />
              <DataField label="Objem" value={decoded.engineCapacity ? `${decoded.engineCapacity} ccm` : undefined} />
              <DataField label="Karoserie" value={formatBodyType(decoded.bodyType)} />
              <DataField label="Pohon" value={formatDriveType(decoded.drivetrain)} />
              <DataField label="Dveře" value={decoded.doorsCount?.toString()} />
              <DataField label="Míst" value={decoded.seatsCount?.toString()} />
            </div>
          </Card>
        )}

        {/* Nápověda kde najít VIN */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">
            Kde najdete VIN?
          </h3>
          <ul className="space-y-2.5 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold mt-0.5">1.</span>
              <span>
                <strong>Dveřní sloupek řidiče</strong> — štítek na rámu dveří
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold mt-0.5">2.</span>
              <span>
                <strong>Palubní deska</strong> — viditelné přes čelní sklo v levém dolním rohu
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold mt-0.5">3.</span>
              <span>
                <strong>Technický průkaz</strong> — v poli E (číslo karoserie / VIN)
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </StepLayout>
  );
}

// ============================================
// Helpers
// ============================================

function DataField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

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

function formatBodyType(value?: string): string | undefined {
  if (!value) return undefined;
  const map: Record<string, string> = {
    SEDAN: "Sedan",
    HATCHBACK: "Hatchback",
    COMBI: "Kombi",
    SUV: "SUV",
    COUPE: "Coupé",
    CABRIO: "Kabriolet",
    VAN: "Van / MPV",
    PICKUP: "Pickup",
  };
  return map[value] ?? value;
}

function formatDriveType(value?: string): string | undefined {
  if (!value) return undefined;
  const map: Record<string, string> = {
    FRONT: "Přední",
    REAR: "Zadní",
    "4x4": "4x4",
  };
  return map[value] ?? value;
}
