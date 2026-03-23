"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    async function loadDrafts() {
      try {
        // Dynamický import - modul může ještě neexistovat (vytváří infra tým)
        const { offlineStorage } = await import("@/lib/offline/storage");
        const stored = await offlineStorage.getDrafts();
        setDrafts(stored.map((d) => ({
          id: d.id,
          title: d.data.brand ? `${d.data.brand} ${d.data.model ?? ""}` : "Bez názvu",
          status: "draft",
          updatedAt: new Date(d.updatedAt).toISOString(),
        })));
      } catch {
        // Offline storage ještě není k dispozici
        setDrafts([]);
      } finally {
        setLoading(false);
      }
    }
    loadDrafts();
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
        <Link
          key={draft.id}
          href={`/makler/vehicles/new?draft=${draft.id}`}
          className="block no-underline"
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 text-sm">
                  {draft.title || "Bez názvu"}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {formatRelativeTime(draft.updatedAt)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill variant="draft">Draft</StatusPill>
                <span className="text-gray-400 text-sm">→</span>
              </div>
            </div>
          </Card>
        </Link>
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
