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
import type { SmartLookupResult, DataSource } from "@/types/vehicle-draft";

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{0,17}$/;
const VIN_FULL_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

interface DuplicateInfo {
  id: string;
  brand: string;
  model: string;
  status: string;
  broker: string | null;
}

interface DuplicateResponse {
  exists: boolean;
  canReuse?: boolean;
  isBlocking?: boolean;
  vehicle?: DuplicateInfo;
  archiveData?: Record<string, unknown>;
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
  const [lookingUp, setLookingUp] = useState(false);
  const [smartResult, setSmartResult] = useState<SmartLookupResult | null>(
    ((draft?.vin as Record<string, unknown>)?.smartLookupResult as SmartLookupResult | undefined) ?? null
  );
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [manualEntryNote, setManualEntryNote] = useState(false);
  const [offlineNote, setOfflineNote] = useState(false);
  const [canReuse, setCanReuse] = useState(false);
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
      setLookupError(null);
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
      setSmartResult(null);
      setCanReuse(false);
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
      .then((data: DuplicateResponse) => {
        if (data.exists && data.vehicle) {
          // ARCHIVED = can reuse, not a blocker
          if (data.canReuse) {
            setDuplicate(null);
            setCanReuse(true);
          } else {
            setDuplicate(data.vehicle);
            setCanReuse(false);
          }
        } else {
          setDuplicate(null);
          setCanReuse(false);
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

  // Smart VIN Lookup — pipeline: DB → CEBIA → Vincario → NHTSA
  const handleSmartLookup = useCallback(async () => {
    if (!VIN_FULL_REGEX.test(vin)) return;

    setLookingUp(true);
    setLookupError(null);
    setOfflineNote(false);

    if (!isOnline) {
      // Offline: zkusit IndexedDB cache
      try {
        const cached = await offlineStorage.getCachedVin(vin);
        if (cached) {
          const cachedData = cached.data as unknown as SmartLookupResult;
          setSmartResult(cachedData);
          updateSection("vin", {
            vin,
            vinVerified: true,
            decodedData: flattenSmartLookup(cachedData),
            smartLookupResult: cachedData,
          } as Record<string, unknown>);
        } else {
          setOfflineNote(true);
          updateSection("vin", { vin, vinVerified: false });
        }
      } catch {
        setOfflineNote(true);
        updateSection("vin", { vin, vinVerified: false });
      }
      setLookingUp(false);
      return;
    }

    try {
      const res = await fetch(`/api/vin/smart-lookup?vin=${vin}`);
      const json = await res.json();

      const result: SmartLookupResult & { manual?: boolean } = json;

      if (result.manual || !result.fields?.brand) {
        setManualEntryNote(true);
        updateSection("vin", { vin, vinVerified: false });
      } else {
        setSmartResult(result);
        setManualEntryNote(false);

        // Cache do IndexedDB
        try {
          await offlineStorage.cacheVin(vin, result as unknown as Record<string, unknown>);
        } catch {
          // Cache selhala, ale lookup proběhl
        }

        // Save to draft — both smart lookup result and flattened decoded data for backward compat
        updateSection("vin", {
          vin,
          vinVerified: true,
          decodedData: flattenSmartLookup(result),
          smartLookupResult: result,
        } as Record<string, unknown>);
      }
    } catch (err) {
      console.error("VIN smart lookup error:", err);
      setManualEntryNote(true);
      updateSection("vin", { vin, vinVerified: false });
    } finally {
      setLookingUp(false);
    }
  }, [vin, isOnline, updateSection]);

  // Auto-decode po kamerovém skenu (čeká na duplikát check)
  useEffect(() => {
    if (autoDecodeQueued && duplicateChecked && !duplicate && VIN_FULL_REGEX.test(vin)) {
      setAutoDecodeQueued(false);
      handleSmartLookup();
    }
  }, [autoDecodeQueued, duplicateChecked, duplicate, vin, handleSmartLookup]);

  // Pokračovat na další krok
  const handleNext = useCallback(async () => {
    if (!VIN_FULL_REGEX.test(vin)) return;

    updateSection("vin", {
      vin,
      vinVerified: smartResult !== null,
      decodedData: smartResult ? flattenSmartLookup(smartResult) : undefined,
      smartLookupResult: smartResult ?? undefined,
    } as Record<string, unknown>);

    await saveDraft();
    router.push(`/makler/vehicles/new/contact?draft=${draft?.id}`);
  }, [vin, smartResult, updateSection, saveDraft, router, draft?.id]);

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

        {/* Reuse archived data info */}
        {canReuse && !smartResult && (
          <Alert variant="info">
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Toto VIN jsme již zpracovali
              </p>
              <p className="text-sm">
                V systému máme historická data k tomuto vozidlu. Po dekódování budou automaticky použita.
              </p>
            </div>
          </Alert>
        )}

        {/* Dekódovat tlačítko */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={handleSmartLookup}
            disabled={!isValid || lookingUp || !!duplicate}
            className="flex-1"
          >
            {lookingUp ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Načítám data...
              </span>
            ) : smartResult ? (
              "Načíst znovu"
            ) : (
              "Načíst data z VIN"
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
            setSmartResult(null);
            setCanReuse(false);
            setAutoDecodeQueued(true);
            setScanModalOpen(false);
          }}
        />

        {/* Lookup error */}
        {lookupError && (
          <Alert variant="error">
            <span className="text-sm">{lookupError}</span>
          </Alert>
        )}

        {/* Manual entry note — APIs nevrátily data */}
        {manualEntryNote && !smartResult && (
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

        {/* CEBIA warnings */}
        {smartResult?.cebiaReport?.status === "WARNING" && (
          <Alert variant="error">
            <div className="space-y-2">
              <p className="font-semibold text-sm">
                CEBIA — upozornění k historii vozidla
              </p>
              {smartResult.cebiaReport.stolen && (
                <p className="text-sm text-red-700 font-medium">
                  Vozidlo je hlášeno jako odcizené!
                </p>
              )}
              {smartResult.cebiaReport.mileageOk === false && (
                <p className="text-sm text-red-700">
                  Nesrovnalost v historii nájezdu kilometrů
                </p>
              )}
              {smartResult.cebiaReport.damageFree === false && (
                <p className="text-sm text-amber-700">
                  Záznam o škodné události
                </p>
              )}
              {smartResult.cebiaReport.financingFree === false && (
                <p className="text-sm text-amber-700">
                  Vozidlo je zatíženo financováním
                </p>
              )}
            </div>
          </Alert>
        )}

        {/* CEBIA OK badge */}
        {smartResult?.cebiaReport && smartResult.cebiaReport.status === "OK" && (
          <div className="flex items-center gap-2 text-sm text-success-500 font-medium">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            CEBIA — historie vozidla v pořádku
          </div>
        )}

        {/* Smart lookup result — with source badges */}
        {smartResult && Object.keys(smartResult.fields).length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Nalezena data
              </h3>
              <div className="flex gap-1.5">
                {smartResult.sources.map((src) => (
                  <SourceBadge key={src} source={src} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SmartField label="Značka" field={smartResult.fields.brand} />
              <SmartField label="Model" field={smartResult.fields.model} />
              <SmartField label="Varianta" field={smartResult.fields.variant} />
              <SmartField label="Rok výroby" field={smartResult.fields.year} format={(v) => String(v)} />
              <SmartField label="Palivo" field={smartResult.fields.fuelType} format={formatFuelType} />
              <SmartField label="Převodovka" field={smartResult.fields.transmission} format={formatTransmission} />
              <SmartField label="Výkon" field={smartResult.fields.enginePower} format={(v) => `${v} kW`} />
              <SmartField label="Objem" field={smartResult.fields.engineCapacity} format={(v) => `${v} ccm`} />
              <SmartField label="Karoserie" field={smartResult.fields.bodyType} format={formatBodyType} />
              <SmartField label="Pohon" field={smartResult.fields.drivetrain} format={formatDriveType} />
              <SmartField label="Dvere" field={smartResult.fields.doorsCount} format={(v) => String(v)} />
              <SmartField label="Míst" field={smartResult.fields.seatsCount} format={(v) => String(v)} />
              <SmartField label="Najeto" field={smartResult.fields.mileage} format={(v) => `${Number(v).toLocaleString("cs-CZ")} km`} />
              <SmartField label="Stav" field={smartResult.fields.condition} format={formatCondition} />
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

/** Flatten SmartLookupResult to VinDecoderResult shape for backward compat */
function flattenSmartLookup(result: SmartLookupResult): Record<string, unknown> {
  const f = result.fields;
  return {
    vin: "",
    brand: f.brand?.value,
    model: f.model?.value,
    variant: f.variant?.value,
    year: f.year?.value,
    fuelType: f.fuelType?.value,
    transmission: f.transmission?.value,
    enginePower: f.enginePower?.value,
    engineCapacity: f.engineCapacity?.value,
    bodyType: f.bodyType?.value,
    drivetrain: f.drivetrain?.value,
    color: f.color?.value,
    doorsCount: f.doorsCount?.value,
    seatsCount: f.seatsCount?.value,
  };
}

/** Source badge component */
function SourceBadge({ source }: { source: DataSource }) {
  const labels: Record<DataSource, string> = {
    db: "Naše DB",
    cebia: "CEBIA",
    vincario: "VIN dekoder",
    nhtsa: "NHTSA",
  };
  const colors: Record<DataSource, string> = {
    db: "bg-blue-100 text-blue-700",
    cebia: "bg-green-100 text-green-700",
    vincario: "bg-purple-100 text-purple-700",
    nhtsa: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colors[source]}`}>
      {labels[source]}
    </span>
  );
}

/** Per-field source dot indicator */
function FieldSourceDot({ source }: { source: DataSource }) {
  const colors: Record<DataSource, string> = {
    db: "bg-blue-500",
    cebia: "bg-green-500",
    vincario: "bg-purple-500",
    nhtsa: "bg-gray-400",
  };
  const labels: Record<DataSource, string> = {
    db: "DB",
    cebia: "CEBIA",
    vincario: "VIN",
    nhtsa: "NHTSA",
  };
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-gray-400">
      <span className={`w-1.5 h-1.5 rounded-full ${colors[source]}`} />
      {labels[source]}
    </span>
  );
}

/** Smart field with source indicator */
function SmartField<T>({
  label,
  field,
  format,
}: {
  label: string;
  field?: { value: T; source: DataSource };
  format?: (v: T) => string;
}) {
  if (!field) return null;
  const displayValue = format ? format(field.value) : String(field.value);
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
        <FieldSourceDot source={field.source} />
      </div>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">{displayValue}</p>
    </div>
  );
}

function formatFuelType(value: string): string {
  const map: Record<string, string> = {
    PETROL: "Benzin",
    DIESEL: "Diesel",
    ELECTRIC: "Elektro",
    HYBRID: "Hybrid",
    PLUGIN_HYBRID: "Plug-in Hybrid",
    LPG: "LPG",
    CNG: "CNG",
  };
  return map[value] ?? value;
}

function formatTransmission(value: string): string {
  const map: Record<string, string> = {
    MANUAL: "Manuální",
    AUTOMATIC: "Automatická",
    DSG: "DSG",
    CVT: "CVT",
  };
  return map[value] ?? value;
}

function formatBodyType(value: string): string {
  const map: Record<string, string> = {
    SEDAN: "Sedan",
    HATCHBACK: "Hatchback",
    COMBI: "Kombi",
    SUV: "SUV",
    COUPE: "Coupe",
    CABRIO: "Kabriolet",
    VAN: "Van / MPV",
    PICKUP: "Pickup",
  };
  return map[value] ?? value;
}

function formatDriveType(value: string): string {
  const map: Record<string, string> = {
    FRONT: "Přední",
    REAR: "Zadní",
    "4x4": "4x4",
  };
  return map[value] ?? value;
}

function formatCondition(value: string): string {
  const map: Record<string, string> = {
    NEW: "Nové",
    LIKE_NEW: "Jako nové",
    EXCELLENT: "Výborné",
    GOOD: "Dobré",
    FAIR: "Uspokojivé",
    DAMAGED: "Poškozené",
  };
  return map[value] ?? value;
}
