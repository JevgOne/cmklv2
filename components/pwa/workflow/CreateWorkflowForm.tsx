"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { WORKFLOW_TYPES, WORKFLOW_PRIORITIES } from "@/lib/workflow/types";
import type { WorkflowType, WorkflowPriority } from "@/lib/workflow/types";

interface CreateWorkflowFormProps {
  prefilledType?: WorkflowType;
  prefilledVehicleId?: string;
  prefilledVehicleLabel?: string;
}

const priorityLabels: Record<string, string> = {
  LOW: "Nízká",
  NORMAL: "Normální",
  HIGH: "Vysoká",
  URGENT: "Urgentní",
};

export function CreateWorkflowForm({
  prefilledType,
  prefilledVehicleId,
  prefilledVehicleLabel,
}: CreateWorkflowFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(prefilledType ? 2 : 1);
  const [type, setType] = useState<WorkflowType | "">(prefilledType || "");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<WorkflowPriority>("NORMAL");
  const [vehicleId] = useState(prefilledVehicleId || "");
  const [page, setPage] = useState("");
  const [device, setDevice] = useState("");
  const [browser, setBrowser] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedType = type ? WORKFLOW_TYPES[type] : null;

  const handleSubmit = async () => {
    if (!type || !title.trim() || !description.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      // Build metadata from context fields
      const metadata: Record<string, string> = {};
      if (page.trim()) metadata.page = page.trim();
      if (device.trim()) metadata.device = device.trim();
      if (browser.trim()) metadata.browser = browser.trim();
      if (stepsToReproduce.trim()) metadata.stepsToReproduce = stepsToReproduce.trim();
      if (errorMessage.trim()) metadata.errorMessage = errorMessage.trim();

      const res = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          category: category || null,
          title: title.trim(),
          description: description.trim(),
          priority,
          vehicleId: vehicleId || null,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Chyba při vytváření požadavku");
      }

      const data = await res.json();
      router.push(`/makler/pozadavky/${data.request?.id || data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neočekávaná chyba");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Select type */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900">Vyberte typ požadavku</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(WORKFLOW_TYPES).map(([key, config]) => (
              <button
                key={key}
                onClick={() => {
                  setType(key as WorkflowType);
                  setStep(2);
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                  type === key
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-100 bg-white hover:border-orange-200",
                )}
              >
                <span className="text-2xl">{config.icon}</span>
                <span className="text-sm font-medium text-gray-900">{config.label}</span>
                <span className="text-[10px] text-gray-400">SLA: {config.slaHours}h</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Fill details */}
      {step === 2 && selectedType && (
        <div className="space-y-4">
          {/* Back to type selection */}
          {!prefilledType && (
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
              </svg>
              Zpět na výběr typu
            </button>
          )}

          {/* Selected type header */}
          <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-3">
            <span className="text-2xl">{selectedType.icon}</span>
            <div>
              <div className="font-semibold text-gray-900">{selectedType.label}</div>
              <div className="text-xs text-gray-500">SLA: {selectedType.slaHours} hodin</div>
            </div>
          </div>

          {/* Category */}
          {selectedType.categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorie
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedType.categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(category === cat ? "" : cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      category === cat
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-gray-200 text-gray-600 hover:border-orange-200",
                    )}
                  >
                    {cat.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vehicle context */}
          {prefilledVehicleLabel && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
              <span className="text-gray-400">🚗</span>
              <span className="text-sm text-gray-700">{prefilledVehicleLabel}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Název požadavku *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Stručný popis problému nebo potřeby"
              maxLength={200}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-300 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Popis *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailní popis — co je potřeba vyřídit, kontext, termín..."
              rows={4}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-300 focus:outline-none"
            />
          </div>

          {/* Context fields — kde se to stalo, zařízení atd. */}
          <div className="space-y-3 bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700">Kontext</h3>

            {/* Page / URL — for all types */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Kde se to stalo (stránka/sekce)
              </label>
              <input
                type="text"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                placeholder="Např. Dashboard, Detail vozu, Nahrávání fotek..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-300 focus:outline-none"
              />
            </div>

            {/* Bug-specific fields */}
            {(type === "BUG_REPORT" || type === "SUPPORT") && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Zařízení
                    </label>
                    <input
                      type="text"
                      value={device}
                      onChange={(e) => setDevice(e.target.value)}
                      placeholder="iPhone 14, notebook..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Prohlížeč / OS
                    </label>
                    <input
                      type="text"
                      value={browser}
                      onChange={(e) => setBrowser(e.target.value)}
                      placeholder="Safari, Chrome, iOS 18..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Chybová zpráva (pokud existuje)
                  </label>
                  <input
                    type="text"
                    value={errorMessage}
                    onChange={(e) => setErrorMessage(e.target.value)}
                    placeholder="Přesný text chybové zprávy..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-300 focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Steps to reproduce — for bugs */}
            {type === "BUG_REPORT" && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Kroky k reprodukci
                </label>
                <textarea
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  placeholder={"1. Otevřel jsem...\n2. Klikl na...\n3. Stalo se..."}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-300 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priorita
            </label>
            <div className="flex gap-2">
              {WORKFLOW_PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors",
                    priority === p
                      ? p === "URGENT"
                        ? "border-red-500 bg-red-50 text-red-600"
                        : p === "HIGH"
                          ? "border-orange-500 bg-orange-50 text-orange-600"
                          : "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-gray-200 text-gray-500 hover:border-gray-300",
                  )}
                >
                  {priorityLabels[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !type || !title.trim() || description.trim().length < 10}
            className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
          >
            {submitting ? "Odesílám..." : "Vytvořit požadavek"}
          </button>
        </div>
      )}
    </div>
  );
}
