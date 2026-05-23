"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { WORKFLOW_TYPES } from "@/lib/workflow/types";
import type { WorkflowStatus, WorkflowPriority } from "@/lib/workflow/types";
import { WorkflowStatusBadge } from "@/components/pwa/workflow/WorkflowStatusBadge";
import { WorkflowPriorityBadge } from "@/components/pwa/workflow/WorkflowPriorityBadge";
import { WorkflowTimeline } from "@/components/pwa/workflow/WorkflowTimeline";
import { WorkflowComments } from "@/components/pwa/workflow/WorkflowComments";
import { WorkflowCommentForm } from "@/components/pwa/workflow/WorkflowCommentForm";
import { WorkflowDocuments } from "@/components/pwa/workflow/WorkflowDocuments";
import { WorkflowActions } from "@/components/pwa/workflow/WorkflowActions";
import type { WorkflowRequestDetail } from "@/types/workflow";

interface AdminWorkflowDetailProps {
  request: WorkflowRequestDetail;
  userId: string;
  userRole: string;
  backofficeUsers: { id: string; name: string }[];
}

type Tab = "timeline" | "comments" | "documents";

const priorityLabels: Record<string, string> = {
  LOW: "Nízká",
  NORMAL: "Normální",
  HIGH: "Vysoká",
  URGENT: "Urgentní",
};

function getUserName(user: { firstName: string | null; lastName: string | null } | null): string {
  if (!user) return "Nepřiřazeno";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Neznámý";
}

export function AdminWorkflowDetail({
  request,
  userId,
  userRole,
  backofficeUsers,
}: AdminWorkflowDetailProps) {
  const router = useRouter();
  const [data, setData] = useState(request);
  const [activeTab, setActiveTab] = useState<Tab>("timeline");
  const [assigning, setAssigning] = useState(false);
  const [changingPriority, setChangingPriority] = useState(false);

  const typeConfig = WORKFLOW_TYPES[data.type] || WORKFLOW_TYPES.OTHER;
  const isCreator = data.createdBy.id === userId;

  const handleStatusChange = useCallback(
    async (newStatus: WorkflowStatus, resolution?: string) => {
      const res = await fetch(`/api/workflow/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, resolution }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Chyba");
      }
      const updated = await res.json();
      setData((prev) => ({ ...prev, ...updated }));
    },
    [data.id],
  );

  const handleAssign = useCallback(
    async (assignedToId: string) => {
      setAssigning(true);
      try {
        const res = await fetch(`/api/workflow/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedToId }),
        });
        if (!res.ok) throw new Error("Chyba při přiřazení");
        const updated = await res.json();
        setData((prev) => ({ ...prev, ...updated }));
      } finally {
        setAssigning(false);
      }
    },
    [data.id],
  );

  const handlePriorityChange = useCallback(
    async (priority: WorkflowPriority) => {
      setChangingPriority(true);
      try {
        const res = await fetch(`/api/workflow/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority }),
        });
        if (!res.ok) throw new Error("Chyba při změně priority");
        const updated = await res.json();
        setData((prev) => ({ ...prev, ...updated }));
      } finally {
        setChangingPriority(false);
      }
    },
    [data.id],
  );

  const handleAddComment = useCallback(
    async (content: string, isInternal: boolean) => {
      const res = await fetch(`/api/workflow/${data.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isInternal }),
      });
      if (!res.ok) throw new Error("Chyba při přidávání komentáře");
      const newComment = await res.json();
      setData((prev) => ({
        ...prev,
        comments: [...prev.comments, newComment],
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push("/admin/workflow")}
              className="p-1 -ml-1 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-2xl">{typeConfig.icon}</span>
            <h1 className="text-xl font-bold text-gray-900">{data.title}</h1>
          </div>
          <div className="flex items-center gap-2 ml-9">
            <WorkflowStatusBadge status={data.status} />
            <WorkflowPriorityBadge priority={data.priority} />
            {data.slaBreached && (
              <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                SLA PŘEKROČENO
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Popis</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.description}</p>

            {data.vehicleLabel && (
              <div className="flex items-center gap-2 mt-3 bg-gray-50 rounded-lg p-3 text-sm">
                <span>🚗</span>
                <span className="text-gray-700">{data.vehicleLabel}</span>
              </div>
            )}

            {data.resolution && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-xs font-bold text-green-700 mb-1">Řešení</div>
                <p className="text-sm text-green-800">{data.resolution}</p>
              </div>
            )}
          </div>

          {/* Status actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Akce</h3>
            <WorkflowActions
              currentStatus={data.status}
              userRole={userRole}
              isCreator={isCreator}
              onStatusChange={handleStatusChange}
            />
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors",
                    activeTab === tab.key
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-400 hover:text-gray-600",
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-1 text-xs text-gray-400">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>
            <div className="p-5">
              {activeTab === "timeline" && <WorkflowTimeline steps={data.steps} />}
              {activeTab === "comments" && (
                <div className="space-y-4">
                  <WorkflowComments comments={data.comments} currentUserId={userId} />
                  <WorkflowCommentForm
                    onSubmit={handleAddComment}
                    showInternalToggle
                    placeholder="Napsat komentář nebo interní poznámku..."
                  />
                </div>
              )}
              {activeTab === "documents" && <WorkflowDocuments documents={data.documents} />}
            </div>
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-4">
          {/* Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Informace</h3>

            <div>
              <span className="text-xs text-gray-400">Typ</span>
              <div className="text-sm font-medium text-gray-900 mt-0.5">
                {typeConfig.label}
                {data.category && ` — ${data.category}`}
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-400">Vytvořil</span>
              <div className="text-sm font-medium text-gray-900 mt-0.5">
                {getUserName(data.createdBy)}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(data.createdAt).toLocaleString("cs-CZ")}
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-400">SLA deadline</span>
              <div className={cn("text-sm font-medium mt-0.5", data.slaBreached ? "text-red-500" : "text-gray-900")}>
                {data.dueAt
                  ? new Date(data.dueAt).toLocaleString("cs-CZ")
                  : "—"}
              </div>
            </div>
          </div>

          {/* Assign */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Přiřazení</h3>
            <div className="text-sm text-gray-900 font-medium">
              {getUserName(data.assignedTo)}
            </div>
            <select
              value={data.assignedTo?.id || ""}
              onChange={(e) => handleAssign(e.target.value)}
              disabled={assigning}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white disabled:opacity-50"
            >
              <option value="">Nepřiřazeno</option>
              {backofficeUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Priorita</h3>
            <select
              value={data.priority}
              onChange={(e) => handlePriorityChange(e.target.value as WorkflowPriority)}
              disabled={changingPriority}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white disabled:opacity-50"
            >
              {Object.entries(priorityLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
