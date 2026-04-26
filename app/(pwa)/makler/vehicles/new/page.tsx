"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { offlineStorage } from "@/lib/offline/storage";
import type { VehicleDraft } from "@/types/vehicle-draft";

const STEP_ROUTES: Record<number, string> = {
  1: "vin",
  2: "contact",
  3: "inspection",
  4: "photos",
  5: "details",
  6: "equipment",
  7: "pricing",
  8: "review",
};

interface StoredDraft {
  id: string;
  title: string;
  status: string;
  currentStep: number;
  updatedAt: number;
}

export default function NewVehiclePage() {
  const router = useRouter();
  const { createDraft } = useDraftContext();
  const [drafts, setDrafts] = useState<StoredDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDeleteDraft = useCallback(async (id: string) => {
    try {
      await offlineStorage.deleteDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // Silent fail
    }
    setConfirmId(null);
  }, []);

  useEffect(() => {
    async function loadDrafts() {
      try {
        const stored = await offlineStorage.getDrafts();
        const mapped: StoredDraft[] = stored.map((d) => {
          const data = d.data as unknown as Omit<VehicleDraft, "id">;
          const brand = data.contact?.prelimBrand || data.details?.brand || "";
          const model = data.contact?.prelimModel || data.details?.model || "";
          return {
            id: d.id,
            title: brand ? `${brand} ${model}`.trim() : "Bez názvu",
            status: (data.status as string) || "draft",
            currentStep: data.currentStep || 1,
            updatedAt: d.updatedAt,
          };
        });
        // Seřadit od nejnovějšího
        mapped.sort((a, b) => b.updatedAt - a.updatedAt);
        setDrafts(mapped);
      } catch {
        setDrafts([]);
      } finally {
        setLoading(false);
      }
    }
    loadDrafts();
  }, []);

  const handleNewVehicle = async () => {
    const id = await createDraft();
    router.push(`/makler/vehicles/new/vin?draft=${id}`);
  };

  const handleContinueDraft = (draft: StoredDraft) => {
    const route = STEP_ROUTES[draft.currentStep] || "contact";
    router.push(`/makler/vehicles/new/${route}?draft=${draft.id}`);
  };

  const handleClose = () => {
    router.push("/makler/dashboard");
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Nabrat auto</h1>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Zavřít"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Obsah */}
      <div className="flex-1 px-4 py-6 space-y-6">
        {/* CTA - nové auto */}
        <button
          onClick={handleNewVehicle}
          className="w-full rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white shadow-orange transition-all duration-200 hover:-translate-y-0.5 hover:shadow-orange-hover text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8"
              >
                <path
                  fillRule="evenodd"
                  d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold">Nabrat nové auto</div>
              <div className="text-sm text-white/80 mt-0.5">
                Vytvořit nový draft a začít od kontaktu
              </div>
            </div>
          </div>
        </button>

        {/* Rozpracované drafty */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : drafts.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
              Rozpracované drafty ({drafts.length})
            </h2>
            {drafts.map((draft) => (
              <Card key={draft.id} className="p-4">
                {confirmId === draft.id ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Opravdu smazat draft?</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setConfirmId(null)}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Ne
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Smazat
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleContinueDraft(draft)}
                      className="min-w-0 flex-1 text-left bg-transparent border-none p-0 cursor-pointer"
                    >
                      <div className="font-semibold text-gray-900 truncate">
                        {draft.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          Krok {draft.currentStep} / 8
                        </span>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(draft.updatedAt)}
                        </span>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <DraftStatusPill status={draft.status} />
                      <button
                        onClick={() => setConfirmId(draft.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        aria-label="Smazat draft"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleContinueDraft(draft)}
                        className="p-1 text-gray-300 bg-transparent border-none cursor-pointer"
                        aria-label="Pokračovat"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DraftStatusPill({ status }: { status: string }) {
  switch (status) {
    case "rejected_by_broker":
      return <StatusPill variant="rejected">Odmítnut</StatusPill>;
    case "pending_sync":
      return <StatusPill variant="pending">Čeká na sync</StatusPill>;
    case "submitted":
      return <StatusPill variant="active">Odeslán</StatusPill>;
    default:
      return <StatusPill variant="draft">Draft</StatusPill>;
  }
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Právě teď";
  if (diffMins < 60) return `Před ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Před ${diffHours} hod`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Před ${diffDays} dny`;

  return new Date(timestamp).toLocaleDateString("cs-CZ");
}
