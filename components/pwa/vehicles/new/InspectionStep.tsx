"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/Checkbox";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StepLayout } from "./StepLayout";
import { StarRating } from "./StarRating";
import { DefectCapture } from "./DefectCapture";
import { useDraftContext } from "@/lib/hooks/useDraft";
import type {
  InspectionData,
  BodyCondition,
  DefectRecord,
} from "@/types/vehicle-draft";

const BODY_CONDITIONS: { value: BodyCondition; label: string; emoji: string }[] = [
  { value: "EXCELLENT", label: "Výborný", emoji: "\u2728" },
  { value: "GOOD", label: "Dobrý", emoji: "\uD83D\uDC4D" },
  { value: "FAIR", label: "Ucházejí", emoji: "\uD83D\uDE10" },
  { value: "POOR", label: "Špatný", emoji: "\uD83D\uDC4E" },
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

  const update = useCallback(
    (data: Partial<InspectionData>) => {
      updateSection("inspection", { ...inspection, ...data });
    },
    [inspection, updateSection]
  );

  const handleNext = () => {
    updateStep(3);
    router.push(`/makler/vehicles/new/vin?draft=${draftId}`);
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

  return (
    <StepLayout
      step={2}
      title="Prohlídka"
      onNext={handleNext}
      onBack={handleBack}
    >
      <div className="space-y-8">
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
