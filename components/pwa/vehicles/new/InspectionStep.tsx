"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/Checkbox";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StepLayout } from "./StepLayout";
import { StarRating } from "./StarRating";
import { DefectCapture } from "./DefectCapture";
import { offlineStorage } from "@/lib/offline/storage";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { HintBox } from "./HintBox";
import type {
  InspectionData,
  BodyCondition,
  DefectRecord,
} from "@/types/vehicle-draft";

const BODY_CONDITIONS: { value: BodyCondition; label: string; emoji: string }[] = [
  { value: "EXCELLENT", label: "Výborný", emoji: "✨" },
  { value: "GOOD", label: "Dobrý", emoji: "👍" },
  { value: "FAIR", label: "Ucházejí", emoji: "😐" },
  { value: "POOR", label: "Špatný", emoji: "👎" },
];

const DEFAULT_DOCUMENTS: InspectionData["documents"] = {
  technickyPrukaz: false,
  osiVelkyTP: false,
  servisniKnizka: false,
  dokladSTK: false,
  dokladEmise: false,
  nabijeciKabel: false,
  druhaKlice: false,
};

const DEFAULT_EXTERIOR: InspectionData["exterior"] = {
  condition: "GOOD",
  paintDefects: false,
  rustSpots: false,
  dentsScratches: false,
  windshieldDamage: false,
  lightsDamage: false,
  tiresCondition: false,
};

const DEFAULT_INTERIOR: InspectionData["interior"] = {
  condition: "GOOD",
  seatsWorn: false,
  dashboardDamage: false,
  steeringWheelWorn: false,
  acWorking: false,
  electronicsWorking: false,
  smellIssues: false,
};

const DEFAULT_ENGINE: InspectionData["engine"] = {
  startsWell: false,
  noLeaks: false,
  noStrangeNoises: false,
  exhaustOk: false,
  turboOk: false,
  timingBeltReplaced: false,
};

const DEFAULT_TEST_DRIVE: InspectionData["testDrive"] = {
  completed: false,
  gearboxSmooth: false,
  brakesOk: false,
  suspensionOk: false,
  steeringOk: false,
  clutchOk: false,
  noVibrations: false,
};

export function InspectionStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft") || "";
  const { draft, updateSection, updateStep, updateStatus, saveDraft } = useDraftContext();

  const inspection = (draft?.inspection ?? {}) as Partial<InspectionData>;
  const documents = inspection.documents ?? { ...DEFAULT_DOCUMENTS };
  const exterior = inspection.exterior ?? { ...DEFAULT_EXTERIOR };
  const interior = inspection.interior ?? { ...DEFAULT_INTERIOR };
  const engine = inspection.engine ?? { ...DEFAULT_ENGINE };
  const testDrive = inspection.testDrive ?? { ...DEFAULT_TEST_DRIVE };
  const defects = inspection.defects ?? [];

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const wheelPhotos = (inspection.wheelPhotos ?? { LP: null, PP: null, LZ: null, PZ: null }) as Record<string, string | null>;
  const wheelInputRef = useRef<HTMLInputElement>(null);
  const [activeWheelSlot, setActiveWheelSlot] = useState<string | null>(null);

  const update = useCallback(
    (data: Partial<InspectionData>) => {
      updateSection("inspection", { ...inspection, ...data });
    },
    [inspection, updateSection]
  );

  const handleNext = () => {
    updateStep(4);
    router.push(`/makler/vehicles/new/photos?draft=${draftId}`);
  };

  const handleBack = () => {
    router.push(`/makler/vehicles/new/contact?draft=${draftId}`);
  };

  const handleReject = async () => {
    updateStatus("rejected_by_broker");
    update({ notes: `Odmítnut: ${rejectReason}` });
    await saveDraft();
    router.push("/makler/vehicles/new");
  };

  const handleWheelCapture = (slot: string) => {
    setActiveWheelSlot(slot);
    wheelInputRef.current?.click();
  };

  const handleWheelPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeWheelSlot) return;
    const imageId = `wheel_${activeWheelSlot}_${Date.now()}`;
    await offlineStorage.saveImage(imageId, draftId, file);
    update({ wheelPhotos: { ...wheelPhotos, [activeWheelSlot]: imageId } as InspectionData["wheelPhotos"] });
    setActiveWheelSlot(null);
    e.target.value = "";
  };

  return (
    <StepLayout
      step={3}
      title="Prohlídka"
      onNext={handleNext}
      onBack={handleBack}
    >
      <div className="space-y-8">
        <HintBox>
          Důkladná prohlídka je klíčová pro správné ocenění vozu.
          Zaškrtněte stav dokumentů, exteriéru, interiéru a motoru.
          Foťte všechny nalezené závady — čím více fotek, tím lépe.
        </HintBox>

        {/* Dokumenty */}
        <Section title="Dokumenty">
          <div className="space-y-3">
            <Checkbox
              label="Technický průkaz (malý TP)"
              checked={documents.technickyPrukaz}
              onChange={(e) =>
                update({
                  documents: { ...documents, technickyPrukaz: e.target.checked },
                })
              }
            />
            <Checkbox
              label="Osvědčení / velký TP"
              checked={documents.osiVelkyTP}
              onChange={(e) =>
                update({
                  documents: { ...documents, osiVelkyTP: e.target.checked },
                })
              }
            />
            <Checkbox
              label="Servisní knížka"
              checked={documents.servisniKnizka}
              onChange={(e) =>
                update({
                  documents: { ...documents, servisniKnizka: e.target.checked },
                })
              }
            />
            <Checkbox
              label="Doklad o STK"
              checked={documents.dokladSTK}
              onChange={(e) =>
                update({
                  documents: { ...documents, dokladSTK: e.target.checked },
                })
              }
            />
            <Checkbox
              label="Doklad o emisích"
              checked={documents.dokladEmise}
              onChange={(e) =>
                update({
                  documents: { ...documents, dokladEmise: e.target.checked },
                })
              }
            />
            <Checkbox
              label="Nabíjecí kabel (EV/PHEV)"
              checked={documents.nabijeciKabel}
              onChange={(e) =>
                update({
                  documents: { ...documents, nabijeciKabel: e.target.checked },
                })
              }
            />
            <Checkbox
              label="Druhé klíče"
              checked={documents.druhaKlice}
              onChange={(e) =>
                update({
                  documents: { ...documents, druhaKlice: e.target.checked },
                })
              }
            />
          </div>
        </Section>

        {/* Exteriér */}
        <Section title="Exteriér">
          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                Celkový stav
              </label>
              <div className="flex gap-2">
                {BODY_CONDITIONS.map((bc) => (
                  <button
                    key={bc.value}
                    type="button"
                    onClick={() =>
                      update({
                        exterior: { ...exterior, condition: bc.value },
                      })
                    }
                    className={`flex-1 py-3 rounded-xl text-center transition-all ${
                      exterior.condition === bc.value
                        ? "bg-orange-50 ring-2 ring-orange-500"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-2xl block">{bc.emoji}</span>
                    <span className="text-xs font-medium text-gray-600 mt-1 block">
                      {bc.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Checkbox
                label="Vady laku"
                checked={exterior.paintDefects}
                onChange={(e) =>
                  update({
                    exterior: { ...exterior, paintDefects: e.target.checked },
                  })
                }
              />
              <Checkbox
                label="Rezivé skvrny"
                checked={exterior.rustSpots}
                onChange={(e) =>
                  update({
                    exterior: { ...exterior, rustSpots: e.target.checked },
                  })
                }
              />
              <Checkbox
                label="Promáčkliny / škrábance"
                checked={exterior.dentsScratches}
                onChange={(e) =>
                  update({
                    exterior: {
                      ...exterior,
                      dentsScratches: e.target.checked,
                    },
                  })
                }
              />
              <Checkbox
                label="Poškozené čelní sklo"
                checked={exterior.windshieldDamage}
                onChange={(e) =>
                  update({
                    exterior: {
                      ...exterior,
                      windshieldDamage: e.target.checked,
                    },
                  })
                }
              />
              <Checkbox
                label="Poškozená světla"
                checked={exterior.lightsDamage}
                onChange={(e) =>
                  update({
                    exterior: { ...exterior, lightsDamage: e.target.checked },
                  })
                }
              />
              <Checkbox
                label="Špatný stav pneumatik"
                checked={exterior.tiresCondition}
                onChange={(e) =>
                  update({
                    exterior: {
                      ...exterior,
                      tiresCondition: e.target.checked,
                    },
                  })
                }
              />
            </div>
          </div>
        </Section>

        {/* Fotky kol */}
        <Section title="Fotky kol">
          <p className="text-xs text-gray-500 mb-3">
            Vyfoťte všechna 4 kola — stav pneumatik, disků a brzdových kotoučů.
          </p>
          <input
            ref={wheelInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleWheelPhotoChange}
            className="hidden"
          />
          <div className="grid grid-cols-2 gap-3">
            {[
              { slot: "LP", label: "Levé přední" },
              { slot: "PP", label: "Pravé přední" },
              { slot: "LZ", label: "Levé zadní" },
              { slot: "PZ", label: "Pravé zadní" },
            ].map(({ slot, label }) => (
              <button
                key={slot}
                type="button"
                onClick={() => handleWheelCapture(slot)}
                className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed transition-all ${
                  wheelPhotos[slot]
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50"
                }`}
              >
                {wheelPhotos[slot] ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-green-500">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-400">
                    <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
                    <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3H4.5a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-xs font-medium text-gray-600">{label}</span>
                <span className="text-[10px] text-gray-400">{slot}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Interiér */}
        <Section title="Interiér">
          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                Celkový stav
              </label>
              <div className="flex gap-2">
                {BODY_CONDITIONS.map((bc) => (
                  <button
                    key={bc.value}
                    type="button"
                    onClick={() =>
                      update({
                        interior: { ...interior, condition: bc.value },
                      })
                    }
                    className={`flex-1 py-3 rounded-xl text-center transition-all ${
                      interior.condition === bc.value
                        ? "bg-orange-50 ring-2 ring-orange-500"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-2xl block">{bc.emoji}</span>
                    <span className="text-xs font-medium text-gray-600 mt-1 block">
                      {bc.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Checkbox
                label="Opotřebená sedadla"
                checked={interior.seatsWorn}
                onChange={(e) =>
                  update({
                    interior: { ...interior, seatsWorn: e.target.checked },
                  })
                }
              />
              <Checkbox
                label="Poškozený palubní panel"
                checked={interior.dashboardDamage}
                onChange={(e) =>
                  update({
                    interior: {
                      ...interior,
                      dashboardDamage: e.target.checked,
                    },
                  })
                }
              />
              <Checkbox
                label="Opotřebený volant"
                checked={interior.steeringWheelWorn}
                onChange={(e) =>
                  update({
                    interior: {
                      ...interior,
                      steeringWheelWorn: e.target.checked,
                    },
                  })
                }
              />
              <Checkbox
                label="Klimatizace funkční"
                checked={interior.acWorking}
                onChange={(e) =>
                  update({
                    interior: { ...interior, acWorking: e.target.checked },
                  })
                }
              />
              <Checkbox
                label="Elektronika funkční"
                checked={interior.electronicsWorking}
                onChange={(e) =>
                  update({
                    interior: {
                      ...interior,
                      electronicsWorking: e.target.checked,
                    },
                  })
                }
              />
              <Checkbox
                label="Zápach v interiéru"
                checked={interior.smellIssues}
                onChange={(e) =>
                  update({
                    interior: { ...interior, smellIssues: e.target.checked },
                  })
                }
              />
            </div>
          </div>
        </Section>

        {/* Motor */}
        <Section title="Motor">
          <div className="space-y-3">
            <Checkbox
              label="Dobře startuje"
              checked={engine.startsWell}
              onChange={(e) =>
                update({
                  engine: { ...engine, startsWell: e.target.checked },
                })
              }
            />
            <Checkbox
              label="Bez úniků kapalin"
              checked={engine.noLeaks}
              onChange={(e) =>
                update({
                  engine: { ...engine, noLeaks: e.target.checked },
                })
              }
            />
            <Checkbox
              label="Bez podezřelých zvuků"
              checked={engine.noStrangeNoises}
              onChange={(e) =>
                update({
                  engine: { ...engine, noStrangeNoises: e.target.checked },
                })
              }
            />
            <Checkbox
              label="Výfuk v pořádku"
              checked={engine.exhaustOk}
              onChange={(e) =>
                update({
                  engine: { ...engine, exhaustOk: e.target.checked },
                })
              }
            />
            <Checkbox
              label="Turbo v pořádku"
              checked={engine.turboOk}
              onChange={(e) =>
                update({
                  engine: { ...engine, turboOk: e.target.checked },
                })
              }
            />
            <Checkbox
              label="Rozvodový řemen vyměněn"
              checked={engine.timingBeltReplaced}
              onChange={(e) =>
                update({
                  engine: { ...engine, timingBeltReplaced: e.target.checked },
                })
              }
            />
          </div>
        </Section>

        {/* Testovací jízda */}
        <Section title="Testovací jízda">
          <div className="space-y-3">
            <Checkbox
              label="Testovací jízda provedena"
              checked={testDrive.completed}
              onChange={(e) =>
                update({
                  testDrive: { ...testDrive, completed: e.target.checked },
                })
              }
            />
            {testDrive.completed && (
              <>
                <Checkbox
                  label="Převodovka plynulá"
                  checked={testDrive.gearboxSmooth}
                  onChange={(e) =>
                    update({
                      testDrive: {
                        ...testDrive,
                        gearboxSmooth: e.target.checked,
                      },
                    })
                  }
                />
                <Checkbox
                  label="Brzdy v pořádku"
                  checked={testDrive.brakesOk}
                  onChange={(e) =>
                    update({
                      testDrive: { ...testDrive, brakesOk: e.target.checked },
                    })
                  }
                />
                <Checkbox
                  label="Podvozek v pořádku"
                  checked={testDrive.suspensionOk}
                  onChange={(e) =>
                    update({
                      testDrive: {
                        ...testDrive,
                        suspensionOk: e.target.checked,
                      },
                    })
                  }
                />
                <Checkbox
                  label="Řízení v pořádku"
                  checked={testDrive.steeringOk}
                  onChange={(e) =>
                    update({
                      testDrive: {
                        ...testDrive,
                        steeringOk: e.target.checked,
                      },
                    })
                  }
                />
                <Checkbox
                  label="Spojka v pořádku"
                  checked={testDrive.clutchOk}
                  onChange={(e) =>
                    update({
                      testDrive: { ...testDrive, clutchOk: e.target.checked },
                    })
                  }
                />
                <Checkbox
                  label="Bez vibrací"
                  checked={testDrive.noVibrations}
                  onChange={(e) =>
                    update({
                      testDrive: {
                        ...testDrive,
                        noVibrations: e.target.checked,
                      },
                    })
                  }
                />
              </>
            )}
          </div>
        </Section>

        {/* Závady */}
        <DefectCapture
          draftId={draftId}
          defects={defects}
          onChange={(newDefects: DefectRecord[]) => update({ defects: newDefects })}
        />

        {/* Celkový dojem */}
        <Section title="Celkový dojem">
          <div className="flex items-center gap-4">
            <StarRating
              value={inspection.overallRating || 0}
              onChange={(v) => update({ overallRating: v })}
              size="lg"
            />
            <span className="text-sm text-gray-500">
              {inspection.overallRating
                ? `${inspection.overallRating} / 5`
                : "Ohodnoťte"}
            </span>
          </div>
        </Section>

        {/* Poznámky */}
        <Textarea
          label="Poznámky z prohlídky"
          placeholder="Další postřehy, detaily..."
          value={inspection.notes || ""}
          onChange={(e) => update({ notes: e.target.value })}
        />

        {/* Odmítnout vozidlo */}
        <div className="pt-4 border-t border-gray-100">
          <Button
            variant="danger"
            className="w-full"
            onClick={() => setRejectOpen(true)}
          >
            Odmítnout vozidlo
          </Button>
        </div>
      </div>

      {/* Modal - odmítnutí */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Odmítnout vozidlo"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Zrušit
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              Odmítnout
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Uveďte důvod odmítnutí. Draft bude uložen se statusem
            &quot;Odmítnut makléřem&quot;.
          </p>
          <Textarea
            label="Důvod odmítnutí"
            placeholder="Např.: Vůz má stočenou tachometr, prodejce nespolupracuje..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>
    </StepLayout>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  );
}
