"use client";

import { useEffect, useState } from "react";
import { SyncButton } from "@/components/pwa/offline/SyncButton";
import { PendingItem } from "@/components/pwa/offline/PendingItem";
import { EmptyState } from "@/components/ui/EmptyState";

interface PendingAction {
  id: string;
  title: string;
  type: string;
  status: "pending" | "syncing" | "done" | "error";
}

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    async function loadPending() {
      try {
        const { offlineStorage } = await import("@/lib/offline/storage");
        const [drafts, actions] = await Promise.all([
          offlineStorage.getDrafts(),
          offlineStorage.getPendingActions(),
        ]);

        const items: PendingAction[] = [
          ...drafts.map((d) => ({
            id: `draft-${d.id}`,
            title: (d.data.brand ? `${d.data.brand} ${d.data.model ?? ""}` : null) as string || "Nový inzerát",
            type: "draft",
            status: "pending" as const,
          })),
          ...actions.map((a) => ({
            id: `action-${a.id}`,
            title: (a.payload.description as string) || "Akce",
            type: "update",
            status: "pending" as const,
          })),
        ];

        setPendingActions(items);
      } catch {
        setPendingActions([]);
      } finally {
        setLoading(false);
      }
    }
    loadPending();
  }, []);

  const handleSync = async () => {
    // Sync bude implementován přes background sync / manuální sync
    // Prozatím označíme vše jako hotové
    setPendingActions((prev) =>
      prev.map((item) => ({ ...item, status: "done" as const }))
    );
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-12 bg-gray-100 rounded-full animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Offline data</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isOnline ? "Jste online" : "Jste offline"} · {pendingActions.length} čekajících
        </p>
      </div>

      <SyncButton
        isOnline={isOnline}
        pendingCount={pendingActions.filter((a) => a.status === "pending").length}
        onSync={handleSync}
      />

      {pendingActions.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Vše synchronizováno"
          description="Nemáte žádná data čekající na synchronizaci."
        />
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            Čekající položky
          </h3>
          {pendingActions.map((action) => (
            <PendingItem
              key={action.id}
              title={action.title}
              type={action.type}
              status={action.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
