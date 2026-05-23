"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WORKFLOW_TYPES } from "@/lib/workflow/types";
import type { WorkflowStatus } from "@/lib/workflow/types";
import { WorkflowStatusBadge } from "./WorkflowStatusBadge";
import { WorkflowPriorityBadge } from "./WorkflowPriorityBadge";
import { WorkflowTimeline } from "./WorkflowTimeline";
import { WorkflowComments } from "./WorkflowComments";
import { WorkflowCommentForm } from "./WorkflowCommentForm";
import { WorkflowDocuments } from "./WorkflowDocuments";
import { WorkflowActions } from "./WorkflowActions";
import { usePusher } from "@/hooks/usePusher";
import type { WorkflowRequestDetail } from "@/types/workflow";

interface WorkflowDetailProps {
  request: WorkflowRequestDetail;
  userId: string;
  userRole: string;
}

type Tab = "timeline" | "comments" | "documents";

function getUserName(user: { firstName: string | null; lastName: string | null } | null): string {
  if (!user) return "Nepřiřazeno";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Neznámý";
}

export function WorkflowDetail({ request, userId, userRole }: WorkflowDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("timeline");
  const [data, setData] = useState(request);
  const [claiming, setClaiming] = useState(false);

  const typeConfig = WORKFLOW_TYPES[data.type] || WORKFLOW_TYPES.OTHER;
  const isCreator = data.createdBy.id === userId;
  const isQueued = data.status === "QUEUED";

  // Real-time: update detail when workflow changes
  usePusher(
    data.id ? `private-workflow-${data.id}` : null,
    "workflow:updated",
    () => router.refresh(),
  );

  usePusher(
    data.id ? `private-workflow-${data.id}` : null,
    "workflow:comment",
    () => router.refresh(),
  );

  const handleStatusChange = useCallback(
    async (newStatus: WorkflowStatus, resolution?: string) => {
      const res = await fetch(`/api/workflow/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, resolution }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Chyba při změně stavu");
      }
      const updated = await res.json();
      setData((prev) => ({ ...prev, ...updated.request }));
    },
    [data.id],
  );

  const handleClaim = useCallback(async () => {
    setClaiming(true);
    try {
      const res = await fetch(`/api/workflow/${data.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: userId }),
      });
      if (!res.ok) throw new Error("Chyba při převzetí");
      router.refresh();
    } catch {
      // silent
    } finally {
      setClaiming(false);
    }
  }, [data.id, userId, router]);

  const handleAddComment = useCallback(
    async (content: string, isInternal: boolean) => {
      const res = await fetch(`/api/workflow/${data.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isInternal }),
      });
      if (!res.ok) throw new Error("Chyba při přidávání komentáře");
      const result = await res.json();
      setData((prev) => ({
        ...prev,
        comments: [...prev.comments, result.comment],
      }));
    },
    [data.id],
  );

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "timeline", label: "Historie", count: data.steps.length },
    { key: "comments", label: "Komentáře", count: data.comments.length },
    { key: "documents", label: "Dokumenty", count: data.documents.length },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push("/makler/pozadavky")}
              className="p-1 -ml-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-lg">{typeConfig.icon}</span>
              <h1 className="text-base font-bold text-gray-900 truncate">
                {data.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <WorkflowStatusBadge status={data.status} />
            <WorkflowPriorityBadge priority={data.priority} />
          </div>
        </div>
      </div>

      {/* Claim banner for QUEUED requests */}
      {isQueued && (
        <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-yellow-800">
              Tento požadavek čeká ve frontě — zatím nebyl nikomu přiřazen.
            </div>
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-40 transition-colors"
            >
              {claiming ? "Přebírám..." : "Převzít"}
            </button>
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="px-4 py-4 border-b border-gray-100 space-y-3">
        <p className="text-sm text-gray-700">{data.description}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-400 text-xs">Vytvořil</span>
            <div className="font-medium text-gray-900">{getUserName(data.createdBy)}</div>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Přiřazeno</span>
            <div className="font-medium text-gray-900">
              {getUserName(data.assignedTo)}
              {data.assignedRole && !data.assignedTo && (
                <span className="text-gray-400 font-normal"> ({data.assignedRole})</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Typ</span>
            <div className="font-medium text-gray-900">
              {typeConfig.label}
              {data.category && ` — ${data.category.toLowerCase()}`}
            </div>
          </div>
          <div>
            <span className="text-gray-400 text-xs">SLA</span>
            <div className={`font-medium ${data.slaBreached ? "text-red-500" : "text-gray-900"}`}>
              {data.dueAt
                ? data.slaBreached
                  ? "Překročeno"
                  : new Date(data.dueAt).toLocaleDateString("cs-CZ", {
                      day: "numeric",
                      month: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                : "—"}
            </div>
          </div>
        </div>

        {data.vehicleLabel && (
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 text-sm">
            <span>🚗</span>
            <span className="text-gray-700">{data.vehicleLabel}</span>
          </div>
        )}

        {data.resolution && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="text-xs font-bold text-green-700 mb-1">Řešení</div>
            <p className="text-sm text-green-800">{data.resolution}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-b border-gray-100">
        <WorkflowActions
          currentStatus={data.status}
          userRole={userRole}
          isCreator={isCreator}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Tabs */}
      <div className="sticky top-[env(safe-area-inset-top)+56px] z-30 bg-white border-b border-gray-100">
        <div className="flex px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 text-xs text-gray-400">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 px-4 py-4">
        {activeTab === "timeline" && <WorkflowTimeline steps={data.steps} />}
        {activeTab === "comments" && (
          <div className="space-y-4">
            <WorkflowComments comments={data.comments} currentUserId={userId} />
            <WorkflowCommentForm
              onSubmit={handleAddComment}
              showInternalToggle={["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"].includes(userRole)}
            />
          </div>
        )}
        {activeTab === "documents" && <WorkflowDocuments documents={data.documents} />}
      </div>
    </div>
  );
}
