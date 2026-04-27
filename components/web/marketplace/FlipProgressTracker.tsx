"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

export interface Milestone {
  label: string;
  progressPct: number;
  photos?: string[];
  note?: string;
  date: string;
}

interface FlipProgressTrackerProps {
  opportunityId: string;
  milestones: Milestone[];
  repairProgress: number;
  status: string;
  /** Dealer může přidávat milníky */
  canEdit: boolean;
  onUpdate?: () => void;
  className?: string;
}

const STATUS_STEPS = [
  { key: "FUNDED", label: "Nákup", icon: "🔑" },
  { key: "IN_REPAIR", label: "Oprava", icon: "🔧" },
  { key: "FOR_SALE", label: "Příprava", icon: "📸" },
  { key: "SOLD", label: "Prodej", icon: "🏷️" },
  { key: "COMPLETED", label: "Dokončeno", icon: "🎉" },
];

const STATUS_ORDER = ["PENDING_APPROVAL", "APPROVED", "FUNDING", "FUNDED", "IN_REPAIR", "FOR_SALE", "SOLD", "PAYOUT_PENDING", "COMPLETED"];

function getStepStatus(stepKey: string, currentStatus: string): "done" | "active" | "pending" {
  const stepIdx = STATUS_ORDER.indexOf(stepKey);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  if (currentIdx < 0 || stepIdx < 0) return "pending";
  if (currentIdx > stepIdx) return "done";
  if (currentIdx === stepIdx) return "active";
  return "pending";
}

export function FlipProgressTracker({
  opportunityId,
  milestones,
  repairProgress,
  status,
  canEdit,
  onUpdate,
  className = "",
}: FlipProgressTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [progressPct, setProgressPct] = useState(repairProgress);
  const [note, setNote] = useState("");
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);

  async function handleSubmit() {
    if (!label.trim()) {
      setError("Název milníku je povinný");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/marketplace/opportunities/${opportunityId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          progressPct,
          note: note.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chyba při ukládání");
      }

      setLabel("");
      setNote("");
      setShowForm(false);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznámá chyba");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Průběh flipu</h3>
          {canEdit && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Zrušit" : "Přidat milník"}
            </Button>
          )}
        </div>

        {/* Overall progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-500">Celkový postup opravy</span>
            <span className="font-bold text-gray-900">{repairProgress}%</span>
          </div>
          <ProgressBar value={repairProgress} variant="green" />
        </div>

        {/* Status steps */}
        <div className="flex items-center justify-between mb-6">
          {STATUS_STEPS.map((step, i) => {
            const stepStatus = getStepStatus(step.key, status);
            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      stepStatus === "done"
                        ? "bg-success-100 text-success-600"
                        : stepStatus === "active"
                          ? "bg-orange-100 text-orange-600 ring-2 ring-orange-300"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {stepStatus === "done" ? "✓" : step.icon}
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-1 ${
                      stepStatus === "active" ? "text-orange-600" : stepStatus === "done" ? "text-success-600" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`w-8 sm:w-12 h-0.5 mx-1 ${
                      getStepStatus(STATUS_STEPS[i + 1].key, status) !== "pending"
                        ? "bg-success-300"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-50 text-error-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Add milestone form */}
        {showForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-gray-900">Nový milník</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Název</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="např. Výměna motoru dokončena"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postup opravy: {progressPct}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progressPct}
                onChange={(e) => setProgressPct(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poznámka (volitelné)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={2}
                maxLength={500}
                placeholder="Detaily k tomuto kroku..."
              />
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={loading}>
              {loading ? "Ukládám..." : "Uložit milník"}
            </Button>
          </div>
        )}

        {/* Milestone history */}
        {milestones.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Zatím žádné milníky.
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-4">
              {[...milestones].reverse().map((m, i) => {
                const isExpanded = expandedMilestone === i;
                return (
                  <div key={i} className="relative pl-10">
                    {/* Dot */}
                    <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-orange-500 ring-2 ring-white" />

                    <button
                      onClick={() => setExpandedMilestone(isExpanded ? null : i)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-sm font-semibold text-gray-900">
                            {m.label}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            {m.progressPct}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(m.date).toLocaleDateString("cs-CZ")}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-2">
                        {m.note && (
                          <p className="text-sm text-gray-500 italic">{m.note}</p>
                        )}
                        {m.photos && m.photos.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {m.photos.map((url, pi) => (
                              <a
                                key={pi}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-20 h-20 rounded-lg overflow-hidden bg-gray-100"
                              >
                                <img
                                  src={url}
                                  alt={`${m.label} foto ${pi + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
