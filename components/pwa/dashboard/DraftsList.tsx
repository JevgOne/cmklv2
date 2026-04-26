"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";

interface Draft {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
}

export function DraftsList() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    async function loadDrafts() {
      try {
        const { offlineStorage } = await import("@/lib/offline/storage");
        const stored = await offlineStorage.getDrafts();
        setDrafts(stored.map((d) => ({
          id: d.id,
          title: d.data.brand ? `${d.data.brand} ${d.data.model ?? ""}` : "Bez názvu",
          status: "draft",
          updatedAt: new Date(d.updatedAt).toISOString(),
        })));
      } catch {
        setDrafts([]);
      } finally {
        setLoading(false);
      }
    }
    loadDrafts();
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const { offlineStorage } = await import("@/lib/offline/storage");
      await offlineStorage.deleteDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // Silent fail — draft may already be gone
    }
    setConfirmId(null);
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (drafts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
        Rozpracované drafty
      </h3>
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
                  onClick={() => handleDelete(draft.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Smazat
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Link
                href={`/makler/vehicles/new?draft=${draft.id}`}
                className="flex-1 min-w-0 no-underline"
              >
                <div className="font-semibold text-gray-900 text-sm">
                  {draft.title || "Bez názvu"}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {formatRelativeTime(draft.updatedAt)}
                </div>
              </Link>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <StatusPill variant="draft">Draft</StatusPill>
                <button
                  onClick={(e) => { e.preventDefault(); setConfirmId(draft.id); }}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  aria-label="Smazat draft"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                  </svg>
                </button>
                <Link href={`/makler/vehicles/new?draft=${draft.id}`} className="no-underline">
                  <span className="text-gray-400 text-sm">→</span>
                </Link>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Právě teď";
  if (diffMins < 60) return `Před ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Před ${diffHours} hod`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Před ${diffDays} dny`;

  return date.toLocaleDateString("cs-CZ");
}
