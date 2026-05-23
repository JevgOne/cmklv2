"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { WORKFLOW_TYPES } from "@/lib/workflow/types";
import type { WorkflowStatus } from "@/lib/workflow/types";
import { WorkflowStatusBadge } from "./WorkflowStatusBadge";
import { WorkflowPriorityBadge } from "./WorkflowPriorityBadge";
import { WorkflowTimeline } from "./WorkflowTimeline";
import { WorkflowComments } from "./WorkflowComments";
import { WorkflowCommentForm } from "./WorkflowCommentForm";
import { WorkflowDocuments } from "./WorkflowDocuments";
import { WorkflowActions } from "./WorkflowActions";
import { useSSE } from "@/hooks/useSSE";
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
  useSSE({
    "workflow:updated": (event) => {
      const e = event as { requestId?: string };
      if (e.requestId === data.id) router.refresh();
    },
    "workflow:comment": (event) => {
      const e = event as { requestId?: string };
      if (e.requestId === data.id) router.refresh();
    },
  });

  const handleStatusChange = useCallback(
    async (newStatus: WorkflowStatus, resolution?: string, escalationReason?: string) => {
      const res = await fetch(`/api/workflow/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, resolution, escalationReason }),
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

        {data.vehicleContext ? (
          <Link
            href={`/makler/vehicles/${data.vehicleContext.id}`}
            className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 no-underline hover:bg-gray-100 transition-colors"
          >
            {data.vehicleContext.thumbnailUrl ? (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                <Image
                  src={data.vehicleContext.thumbnailUrl}
                  alt={`${data.vehicleContext.brand} ${data.vehicleContext.model}`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                🚗
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900">
                {data.vehicleContext.brand} {data.vehicleContext.model} {data.vehicleContext.year}
              </div>
              <div className="text-xs text-gray-400 font-mono">
                VIN: {data.vehicleContext.vin}
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
            </svg>
          </Link>
        ) : data.vehicleLabel ? (
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 text-sm">
            <span>🚗</span>
            <span className="text-gray-700">{data.vehicleLabel}</span>
          </div>
        ) : null}

        {/* Structured metadata — context info */}
        {data.metadata && Object.keys(data.metadata).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
            <div className="text-xs font-bold text-blue-700 uppercase">Kontext</div>
            {(data.metadata as Record<string, string>).page && (
              <div className="text-sm">
                <span className="text-blue-500 text-xs font-medium">Kde: </span>
                <span className="text-gray-700">{(data.metadata as Record<string, string>).page}</span>
              </div>
            )}
            {((data.metadata as Record<string, string>).device || (data.metadata as Record<string, string>).browser) && (
              <div className="text-sm">
                <span className="text-blue-500 text-xs font-medium">Prostředí: </span>
                <span className="text-gray-700">
                  {[(data.metadata as Record<string, string>).device, (data.metadata as Record<string, string>).browser].filter(Boolean).join(" / ")}
                </span>
              </div>
            )}
            {(data.metadata as Record<string, string>).errorMessage && (
              <div className="text-sm">
                <span className="text-blue-500 text-xs font-medium">Chyba: </span>
                <span className="text-gray-700 font-mono text-xs">{(data.metadata as Record<string, string>).errorMessage}</span>
              </div>
            )}
            {(data.metadata as Record<string, string>).stepsToReproduce && (
              <div className="text-sm">
                <span className="text-blue-500 text-xs font-medium">Reprodukce: </span>
                <p className="text-gray-700 whitespace-pre-wrap mt-0.5">{(data.metadata as Record<string, string>).stepsToReproduce}</p>
              </div>
            )}
          </div>
        )}

        {data.contactContext && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-sm">
              👤
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">{data.contactContext.name}</div>
              <a
                href={`tel:${data.contactContext.phone}`}
                className="text-xs text-orange-500 font-medium no-underline hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {data.contactContext.phone}
              </a>
            </div>
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
        {activeTab === "documents" && (
          <WorkflowDocuments
            documents={data.documents}
            requestId={data.id}
            canUpload
            onDocumentAdded={(doc) => setData((prev) => ({ ...prev, documents: [doc, ...prev.documents] }))}
          />
        )}
      </div>
    </div>
  );
}
