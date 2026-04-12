"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui";

// ============================================
// WORKFLOW DEFINITION (9 fází, 28 kroků)
// ============================================

interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  autoCheckKey?: string;
}

interface WorkflowPhase {
  id: string;
  label: string;
  steps: WorkflowStep[];
}

const WORKFLOW_PHASES: WorkflowPhase[] = [
  {
    id: "prep",
    label: "Příprava",
    steps: [
      { id: "1.1", label: "Kontakt s prodejcem", description: "Telefonát dle callscriptu, domluvit termín", autoCheckKey: "hasContact" },
      { id: "1.2", label: "Základní info o voze", description: "Značka, model, rok, najeto — z inzer��tu", autoCheckKey: "hasBasicInfo" },
      { id: "1.3", label: "Naplánovat schůzku", description: "Datum, čas a místo setkání" },
    ],
  },
  {
    id: "equipment",
    label: "Vybavení",
    steps: [
      { id: "2.1", label: "Měřič tloušťky laku", description: "Funkční, nabitý" },
      { id: "2.2", label: "Baterka", description: "Pro kontrolu podvozku a motoru" },
      { id: "2.3", label: "Utěrka na čištění", description: "Očistit VIN štítek, SPZ" },
      { id: "2.4", label: "Nabitý telefon + paměť", description: "Min. 2 GB volného místa pro fotky" },
    ],
  },
  {
    id: "inspection",
    label: "Osobní prohlídka",
    steps: [
      { id: "3.1", label: "Exteriér — vizuální kontrola", description: "Lak, rzi, promáčkliny, praskliny" },
      { id: "3.2", label: "Měření laku", description: "Na každém dílu, hledat přelakované díly" },
      { id: "3.3", label: "Interiér — stav", description: "Sedadla, palubka, zápach, ovládací prvky" },
      { id: "3.4", label: "Motor — vizuální kontrola", description: "Úniky, koroze, stav řemenů" },
      { id: "3.5", label: "Testovací jízda", description: "Převodovka, brzdy, podvozek, řízení" },
    ],
  },
  {
    id: "photos",
    label: "Fotodokumentace",
    steps: [
      { id: "4.1", label: "Exteriér dle fotomanuálu", description: "13 pozic dle průvodce", autoCheckKey: "hasExteriorPhotos" },
      { id: "4.2", label: "Interiér + motor", description: "4 interiér + 1 motorový prostor", autoCheckKey: "hasInteriorPhotos" },
      { id: "4.3", label: "Důkazní fotky", description: "Tachometr, VIN štítek, klíče s doklady", autoCheckKey: "hasEvidencePhotos" },
      { id: "4.4", label: "Technický průkaz", description: "Obě strany velkého TP" },
      { id: "4.5", label: "Defekty", description: "Detailní fotky nalezených defektů" },
    ],
  },
  {
    id: "data",
    label: "Zadání do systému",
    steps: [
      { id: "5.1", label: "VIN dekódování", description: "Zadat 17místný VIN kód", autoCheckKey: "hasVin" },
      { id: "5.2", label: "Výbava", description: "Vybrat vybavení ze seznamu" },
      { id: "5.3", label: "Popis vozidla", description: "Min. 20 znaků, klíčové info pro kupce", autoCheckKey: "hasDescription" },
      { id: "5.4", label: "STK + emise", description: "Datum platnosti STK a EK" },
      { id: "5.5", label: "Doplňky", description: "Počet klíčů, sezónní pneu, servisní historie" },
    ],
  },
  {
    id: "price",
    label: "Cena a smlouva",
    steps: [
      { id: "6.1", label: "Dohodnout prodejní cenu", description: "Cena s prodejcem", autoCheckKey: "hasPrice" },
      { id: "6.2", label: "Dohodnout provizi", description: "Min. 5% z ceny / 25 000 Kč" },
      { id: "6.3", label: "Podepsat smlouvu", description: "Exkluzivní zprostředkovatelská smlouva (2 kopie)", autoCheckKey: "hasSigned" },
    ],
  },
  {
    id: "verify",
    label: "Ověření",
    steps: [
      { id: "7.1", label: "CEBIA prověrka", description: "Ověření historie vozu" },
    ],
  },
  {
    id: "publish",
    label: "Publikace",
    steps: [
      { id: "8.1", label: "Úprava fotek", description: "Ořez, jas, kontrast (volitelné)" },
      { id: "8.2", label: "Seřadit fotky", description: "Dle fotomanuálu — hlavní fotka první" },
      { id: "8.3", label: "Publikovat inzerát", description: "Odeslat ke schválení", autoCheckKey: "isActive" },
    ],
  },
  {
    id: "backup",
    label: "Záloha",
    steps: [
      { id: "9.1", label: "Záloha fotek", description: "Originální fotky na cloud/disk" },
    ],
  },
];

const TOTAL_STEPS = WORKFLOW_PHASES.reduce((sum, p) => sum + p.steps.length, 0);

// ============================================
// TYPES
// ============================================

interface StepState {
  checked: boolean;
  checkedAt?: string;
  autoChecked?: boolean;
}

interface WorkflowChecklistData {
  steps: Record<string, StepState>;
  lastUpdated: string;
}

interface AutoCheckMap {
  [key: string]: boolean;
}

interface WorkflowChecklistProps {
  vehicleId: string;
  autoChecks?: AutoCheckMap;
}

// ============================================
// COMPONENT
// ============================================

export function WorkflowChecklist({ vehicleId, autoChecks = {} }: WorkflowChecklistProps) {
  const [data, setData] = useState<WorkflowChecklistData>({
    steps: {},
    lastUpdated: new Date().toISOString(),
  });
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch on mount
  useEffect(() => {
    fetch(`/api/vehicles/${vehicleId}/workflow`)
      .then((r) => r.json())
      .then((d) => {
        if (d.steps) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vehicleId]);

  // Check if step is done (manual or auto)
  const isStepDone = useCallback(
    (step: WorkflowStep): boolean => {
      if (step.autoCheckKey && autoChecks[step.autoCheckKey]) return true;
      return data.steps[step.id]?.checked ?? false;
    },
    [data.steps, autoChecks]
  );

  const isAutoChecked = useCallback(
    (step: WorkflowStep): boolean => {
      return !!(step.autoCheckKey && autoChecks[step.autoCheckKey]);
    },
    [autoChecks]
  );

  // Toggle manual step
  const toggleStep = useCallback(
    (step: WorkflowStep) => {
      if (isAutoChecked(step)) return; // auto-checked nelze togglit

      const current = data.steps[step.id];
      const newChecked = !current?.checked;

      const updated: WorkflowChecklistData = {
        ...data,
        steps: {
          ...data.steps,
          [step.id]: {
            checked: newChecked,
            checkedAt: newChecked ? new Date().toISOString() : undefined,
          },
        },
        lastUpdated: new Date().toISOString(),
      };

      setData(updated);

      // Save debounced
      setSaving(true);
      fetch(`/api/vehicles/${vehicleId}/workflow`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })
        .catch(() => {})
        .finally(() => setSaving(false));
    },
    [data, vehicleId, isAutoChecked]
  );

  // Stats
  const { completedCount, nextStep, phaseStats } = useMemo(() => {
    let completed = 0;
    let next: { step: WorkflowStep; phase: WorkflowPhase } | null = null;
    const stats: Record<string, { done: number; total: number }> = {};

    for (const phase of WORKFLOW_PHASES) {
      let phaseDone = 0;
      for (const step of phase.steps) {
        const done = (step.autoCheckKey && autoChecks[step.autoCheckKey]) || data.steps[step.id]?.checked;
        if (done) {
          completed++;
          phaseDone++;
        } else if (!next) {
          next = { step, phase };
        }
      }
      stats[phase.id] = { done: phaseDone, total: phase.steps.length };
    }

    return { completedCount: completed, nextStep: next, phaseStats: stats };
  }, [data.steps, autoChecks]);

  const progressPercent = Math.round((completedCount / TOTAL_STEPS) * 100);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + Progress */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Postup práce</h3>
          <span className="text-sm text-gray-500">
            {completedCount}/{TOTAL_STEPS}
            {saving && <span className="ml-2 text-orange-500">...</span>}
          </span>
        </div>
        <ProgressBar
          value={progressPercent}
          variant={progressPercent === 100 ? "green" : "default"}
        />

        {/* Další doporučený krok */}
        {nextStep && (
          <button
            onClick={() => setExpandedPhase(nextStep.phase.id)}
            className="w-full text-left bg-orange-50 border border-orange-200 rounded-xl p-3"
          >
            <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">
              Další krok
            </p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">
              {nextStep.step.label}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {nextStep.step.description}
            </p>
          </button>
        )}
      </Card>

      {/* Phases accordion */}
      {WORKFLOW_PHASES.map((phase) => {
        const stats = phaseStats[phase.id];
        const isExpanded = expandedPhase === phase.id;
        const isComplete = stats.done === stats.total;

        return (
          <Card key={phase.id} className="overflow-hidden">
            {/* Phase header */}
            <button
              onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isComplete
                      ? "bg-green-100 text-green-700"
                      : stats.done > 0
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {isComplete ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span>{stats.done}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{phase.label}</p>
                  <p className="text-xs text-gray-500">
                    {stats.done}/{stats.total}
                  </p>
                </div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Steps */}
            {isExpanded && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {phase.steps.map((step) => {
                  const done = isStepDone(step);
                  const auto = isAutoChecked(step);

                  return (
                    <button
                      key={step.id}
                      onClick={() => toggleStep(step)}
                      disabled={auto}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${
                        auto ? "cursor-default" : "cursor-pointer hover:bg-gray-50"
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 ${
                          done
                            ? auto
                              ? "bg-blue-500 border-blue-500"
                              : "bg-green-500 border-green-500"
                            : "border-gray-300"
                        }`}
                      >
                        {done && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            done ? "text-gray-400 line-through" : "text-gray-900"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {step.description}
                        </p>
                        {auto && done && (
                          <p className="text-[10px] text-blue-500 mt-0.5 font-medium">
                            Ověřeno systémem
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
