"use client";

import { useEffect, useState } from "react";
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
  6: "pricing",
  7: "review",
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
              <button
                key={draft.id}
                onClick={() => handleContinueDraft(draft)}
                className="block w-full text-left"
              >
                <Card className="p-4" hover>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 truncate">
                        {draft.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          Krok {draft.currentStep} / 7
                        </span>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(draft.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <DraftStatusPill status={draft.status} />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        className="w-5 h-5 text-gray-300"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </div>
                  </div>
                </Card>
              </button>
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
