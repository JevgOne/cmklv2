"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WorkflowCard } from "./WorkflowCard";
import { WorkflowFilters } from "./WorkflowFilters";
import { WorkflowStatsBar } from "./WorkflowStats";
import { useSSE } from "@/hooks/useSSE";
import type { WorkflowRequestSummary, WorkflowStats, WorkflowFiltersState } from "@/types/workflow";

interface WorkflowListProps {
  initialRequests: WorkflowRequestSummary[];
  initialStats: WorkflowStats;
  userId: string;
  userRole: string;
}

export function WorkflowList({ initialRequests, initialStats, userId, userRole }: WorkflowListProps) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [stats] = useState(initialStats);
  const [filters, setFilters] = useState<WorkflowFiltersState>({
    type: "",
    status: "",
    priority: "",
    tab: "my",
  });

  // Real-time: refresh list on workflow events
  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useSSE({
    "workflow:assigned": handleRefresh,
    "workflow:created": handleRefresh,
    "workflow:updated": handleRefresh,
  });

  const filtered = requests.filter((r) => {
    if (filters.type && r.type !== filters.type) return false;
    if (filters.status && r.status !== filters.status) return false;
    if (filters.priority && r.priority !== filters.priority) return false;

    if (filters.tab === "my" && r.createdBy.id !== userId) return false;
    if (filters.tab === "assigned" && r.assignedTo?.id !== userId) return false;

    return true;
  });

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Požadavky</h1>
          <button
            onClick={() => router.push("/makler/pozadavky/novy")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Nový
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Stats */}
        <WorkflowStatsBar stats={stats} />

        {/* Filters */}
        <WorkflowFilters filters={filters} onChange={setFilters} />

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm font-medium text-gray-500">
              {filters.tab === "my"
                ? "Nemáte žádné vlastní požadavky"
                : filters.tab === "assigned"
                  ? "Nemáte přiřazené žádné požadavky"
                  : "Žádné požadavky k zobrazení"}
            </div>
            <button
              onClick={() => router.push("/makler/pozadavky/novy")}
              className="mt-4 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              Vytvořit požadavek
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((request) => (
              <WorkflowCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
