"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { WORKFLOW_TYPES } from "@/lib/workflow/types";
import type { WorkflowStatus, WorkflowPriority } from "@/lib/workflow/types";
import { WorkflowTimeline } from "@/components/pwa/workflow/WorkflowTimeline";
import { WorkflowComments } from "@/components/pwa/workflow/WorkflowComments";
import { WorkflowCommentForm } from "@/components/pwa/workflow/WorkflowCommentForm";
import { WorkflowDocuments } from "@/components/pwa/workflow/WorkflowDocuments";
import { getAllowedTransitions } from "@/lib/workflow/state-machine";
import type { WorkflowRequestDetail } from "@/types/workflow";

interface AdminWorkflowDetailProps {
  request: WorkflowRequestDetail;
  userId: string;
  userRole: string;
  assignableUsers: { id: string; name: string }[];
  creatorContact?: { email?: string; phone?: string; role: string };
  watchers?: { id: string; name: string }[];
  relatedRequests?: { id: string; title: string; type: string; status: string; createdAt: string }[];
  responseTimeMs?: number | null;
}

type Tab = "timeline" | "comments" | "documents";

const priorityConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  LOW: { label: "Nízká", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" },
  NORMAL: { label: "Normální", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  HIGH: { label: "Vysoká", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  URGENT: { label: "Urgentní", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  CREATED: { label: "Vytvořeno", color: "text-gray-700", bg: "bg-gray-100", dot: "bg-gray-400" },
  QUEUED: { label: "Ve frontě", color: "text-yellow-700", bg: "bg-yellow-50", dot: "bg-yellow-500" },
  ASSIGNED: { label: "Přiřazeno", color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500" },
  IN_PROGRESS: { label: "Řeší se", color: "text-orange-700", bg: "bg-orange-50", dot: "bg-orange-500" },
  WAITING_INFO: { label: "Čeká na info", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  WAITING_APPROVAL: { label: "Ke schválení", color: "text-purple-700", bg: "bg-purple-50", dot: "bg-purple-500" },
  RESOLVED: { label: "Vyřešeno", color: "text-green-700", bg: "bg-green-50", dot: "bg-green-500" },
  CLOSED: { label: "Uzavřeno", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" },
  CANCELLED: { label: "Zrušeno", color: "text-red-600", bg: "bg-red-50", dot: "bg-red-400" },
};

const transitionButtonStyles: Record<string, string> = {
  IN_PROGRESS: "bg-orange-500 text-white hover:bg-orange-600",
  RESOLVED: "bg-green-500 text-white hover:bg-green-600",
  CLOSED: "bg-gray-700 text-white hover:bg-gray-800",
  CANCELLED: "bg-red-100 text-red-600 hover:bg-red-200",
  WAITING_INFO: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  WAITING_APPROVAL: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  ASSIGNED: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  QUEUED: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
};

function getUserName(user: { firstName: string | null; lastName: string | null } | null): string {
  if (!user) return "Nepřiřazeno";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Neznámý";
}

function getInitials(user: { firstName: string | null; lastName: string | null } | null): string {
  if (!user) return "?";
  return [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrátor",
  MANAGER: "Manažer",
  REGIONAL_DIRECTOR: "Regionální ředitel",
  BROKER: "Makléř",
  ADVERTISER: "Inzerent",
  BUYER: "Kupující",
  INVESTOR: "Investor",
  VERIFIED_DEALER: "Ověřený dealer",
  PARTS_SUPPLIER: "Dodavatel dílů",
};

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSlaRemaining(dueAt: string | null, breached: boolean): { text: string; urgent: boolean } {
  if (!dueAt) return { text: "Bez SLA", urgent: false };
  if (breached) return { text: "SLA překročeno!", urgent: true };
  const now = Date.now();
  const due = new Date(dueAt).getTime();
  const diff = due - now;
  if (diff <= 0) return { text: "SLA překročeno!", urgent: true };
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { text: `${days}d ${hours % 24}h zbývá`, urgent: false };
  }
  if (hours > 0) {
    return { text: `${hours}h ${mins}m zbývá`, urgent: hours < 4 };
  }
  return { text: `${mins}m zbývá`, urgent: true };
}

export function AdminWorkflowDetail({
  request,
  userId,
  userRole,
  assignableUsers,
  creatorContact,
  watchers = [],
  relatedRequests = [],
  responseTimeMs,
}: AdminWorkflowDetailProps) {
  const router = useRouter();
  const [data, setData] = useState(request);
  const [activeTab, setActiveTab] = useState<Tab>("timeline");
  const [assigning, setAssigning] = useState(false);
  const [changingPriority, setChangingPriority] = useState(false);
  const [showResolution, setShowResolution] = useState(false);
  const [resolution, setResolution] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const typeConfig = WORKFLOW_TYPES[data.type] || WORKFLOW_TYPES.OTHER;
  const isCreator = data.createdBy.id === userId;
  const prio = priorityConfig[data.priority] || priorityConfig.NORMAL;
  const status = statusConfig[data.status] || statusConfig.CREATED;
  const sla = getSlaRemaining(data.dueAt, data.slaBreached);
  const allowedTransitions = getAllowedTransitions(data.status as WorkflowStatus, userRole, isCreator);
  const meta = (data.metadata || {}) as Record<string, string>;

  const handleStatusChange = useCallback(
    async (newStatus: WorkflowStatus, res?: string) => {
      setActionLoading(true);
      try {
        const response = await fetch(`/api/workflow/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, resolution: res }),
        });
        if (!response.ok) throw new Error("Chyba");
        const result = await response.json();
        setData((prev) => ({ ...prev, ...result.request }));
        setShowResolution(false);
        setResolution("");
      } finally {
        setActionLoading(false);
      }
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
        if (!res.ok) throw new Error("Chyba");
        const result = await res.json();
        setData((prev) => ({ ...prev, ...result.request }));
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
        if (!res.ok) throw new Error("Chyba");
        const result = await res.json();
        setData((prev) => ({ ...prev, ...result.request }));
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
      if (!res.ok) throw new Error("Chyba");
      const newComment = await res.json();
      setData((prev) => ({
        ...prev,
        comments: [...prev.comments, newComment],
      }));
    },
    [data.id],
  );

  const handleTransition = async (to: WorkflowStatus) => {
    if (to === "RESOLVED" && !showResolution) {
      setShowResolution(true);
      return;
    }
    await handleStatusChange(to, to === "RESOLVED" ? resolution : undefined);
  };

  const tabs: { key: Tab; label: string; count?: number; icon: string }[] = [
    { key: "timeline", label: "Historie", count: data.steps.length, icon: "📝" },
    { key: "comments", label: "Komentáře", count: data.comments.length, icon: "💬" },
    { key: "documents", label: "Dokumenty", count: data.documents.length, icon: "📎" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/admin/workflow")}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Zpět na seznam
        </button>
        <span className="text-xs text-gray-400 font-mono">#{data.id.slice(-8)}</span>
      </div>

      {/* Hero header */}
      <div className={cn("rounded-2xl border p-6 mb-6", prio.border, prio.bg)}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
            {typeConfig.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-2">{data.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold", status.bg, status.color)}>
                <span className={cn("w-2 h-2 rounded-full", status.dot)} />
                {status.label}
              </span>
              <span className={cn("inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold", prio.bg, prio.color, "border", prio.border)}>
                {data.priority === "URGENT" ? "!!!" : data.priority === "HIGH" ? "!!" : data.priority === "LOW" ? "-" : ""}
                {" "}{prio.label}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                sla.urgent ? "bg-red-100 text-red-700 border border-red-200" : "bg-white/60 text-gray-600 border border-gray-200",
              )}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
                {sla.text}
              </span>
              {data.category && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/60 text-gray-600 border border-gray-200">
                  {data.category.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AKCE — separate prominent card */}
      {(allowedTransitions.length > 0 || showResolution) && (
        <div className="bg-white rounded-2xl border-2 border-orange-200 p-5 mb-6">
          <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3">Akce</h3>
          {showResolution ? (
            <div className="space-y-3">
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Jak byl požadavek vyřešen? Popište řešení..."
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-400 focus:ring-2 focus:ring-green-100 focus:outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleTransition("RESOLVED" as WorkflowStatus)}
                  disabled={actionLoading || !resolution.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold disabled:opacity-40 hover:bg-green-600 transition-colors shadow-sm"
                >
                  {actionLoading ? "Ukládám..." : "Potvrdit vyřešení"}
                </button>
                <button
                  onClick={() => { setShowResolution(false); setResolution(""); }}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  Zrušit
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allowedTransitions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleTransition(s)}
                  disabled={actionLoading}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 shadow-sm",
                    transitionButtonStyles[s] || "bg-gray-100 text-gray-700 hover:bg-gray-200",
                  )}
                >
                  {actionLoading ? "..." : statusConfig[s]?.label || s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description + metadata */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Popis</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{data.description}</p>
            </div>

            {/* Vehicle context */}
            {data.vehicleLabel && (
              <div className="mx-6 mb-4 flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-sm">🚗</div>
                <span className="text-sm font-medium text-gray-700">{data.vehicleLabel}</span>
              </div>
            )}

            {/* Structured metadata */}
            {Object.keys(meta).length > 0 && (
              <div className="border-t border-gray-100">
                <div className="p-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Kontext a prostředí</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {meta.page && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm flex-shrink-0">📍</div>
                        <div>
                          <div className="text-[11px] font-bold text-gray-400 uppercase">Kde se to stalo</div>
                          <div className="text-sm text-gray-800 mt-0.5">{meta.page}</div>
                        </div>
                      </div>
                    )}
                    {meta.device && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm flex-shrink-0">📱</div>
                        <div>
                          <div className="text-[11px] font-bold text-gray-400 uppercase">Zařízení</div>
                          <div className="text-sm text-gray-800 mt-0.5">{meta.device}</div>
                        </div>
                      </div>
                    )}
                    {meta.browser && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm flex-shrink-0">🌐</div>
                        <div>
                          <div className="text-[11px] font-bold text-gray-400 uppercase">Prohlížeč / OS</div>
                          <div className="text-sm text-gray-800 mt-0.5">{meta.browser}</div>
                        </div>
                      </div>
                    )}
                    {meta.errorMessage && (
                      <div className="flex items-start gap-3 sm:col-span-2">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-sm flex-shrink-0">⚠️</div>
                        <div>
                          <div className="text-[11px] font-bold text-gray-400 uppercase">Chybová zpráva</div>
                          <div className="text-sm text-red-700 mt-1 font-mono bg-red-50 rounded-lg px-3 py-2 border border-red-100">{meta.errorMessage}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  {meta.stepsToReproduce && (
                    <div className="mt-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-sm flex-shrink-0">📋</div>
                      <div className="flex-1">
                        <div className="text-[11px] font-bold text-gray-400 uppercase">Kroky k reprodukci</div>
                        <div className="text-sm text-gray-800 mt-1 whitespace-pre-wrap bg-gray-50 rounded-lg px-4 py-3 border border-gray-100 leading-relaxed">{meta.stepsToReproduce}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resolution */}
            {data.resolution && (
              <div className="border-t border-gray-100 bg-green-50/50 p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-sm flex-shrink-0">✅</div>
                  <div>
                    <div className="text-[11px] font-bold text-green-600 uppercase">Řešení</div>
                    <p className="text-sm text-green-800 mt-1 leading-relaxed">{data.resolution}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-center border-b-2 transition-all",
                    activeTab === tab.key
                      ? "border-orange-500 text-orange-600 bg-orange-50/30"
                      : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/50",
                  )}
                >
                  <span className="text-xs">{tab.icon}</span>
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(
                      "min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center",
                      activeTab === tab.key ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500",
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="p-6">
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
          {/* Creator + contact */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Vytvořil</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {getInitials(data.createdBy)}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{getUserName(data.createdBy)}</div>
                {creatorContact?.role && (
                  <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {roleLabels[creatorContact.role] || creatorContact.role}
                  </span>
                )}
              </div>
            </div>
            {/* Contact info */}
            {(creatorContact?.phone || creatorContact?.email) && (
              <div className="space-y-1.5 pt-3 border-t border-gray-100">
                {creatorContact.phone && (
                  <a href={`tel:${creatorContact.phone}`} className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 no-underline">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                    </svg>
                    {creatorContact.phone}
                  </a>
                )}
                {creatorContact.email && (
                  <a href={`mailto:${creatorContact.email}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 no-underline truncate">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                    </svg>
                    {creatorContact.email}
                  </a>
                )}
              </div>
            )}
            <div className="text-[11px] text-gray-400 mt-2">{formatDate(data.createdAt)}</div>
          </div>

          {/* Details grid */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Detaily</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">Typ</span>
                <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <span className="text-xs">{typeConfig.icon}</span>
                  {typeConfig.label}
                </span>
              </div>
              {data.category && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Kategorie</span>
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {data.category.replace(/_/g, " ")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">SLA deadline</span>
                <span className={cn("text-sm font-medium", sla.urgent ? "text-red-600" : "text-gray-900")}>
                  {data.dueAt
                    ? new Date(data.dueAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </span>
              </div>
              {responseTimeMs !== undefined && responseTimeMs !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Doba odezvy</span>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    {formatDuration(responseTimeMs)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">Aktualizováno</span>
                <span className="text-xs text-gray-500">
                  {new Date(data.updatedAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Přiřazeno</h3>
            {data.assignedTo && (
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {getInitials(data.assignedTo)}
                </div>
                <span className="text-sm font-medium text-gray-900">{getUserName(data.assignedTo)}</span>
              </div>
            )}
            <select
              value={data.assignedTo?.id || ""}
              onChange={(e) => handleAssign(e.target.value)}
              disabled={assigning}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 bg-gray-50 disabled:opacity-50 focus:border-orange-300 focus:ring-1 focus:ring-orange-200 focus:outline-none transition-colors"
            >
              <option value="">Nepřiřazeno</option>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Priorita</h3>
            <div className="grid grid-cols-2 gap-2">
              {(["LOW", "NORMAL", "HIGH", "URGENT"] as const).map((p) => {
                const pc = priorityConfig[p];
                const isActive = data.priority === p;
                return (
                  <button
                    key={p}
                    onClick={() => !isActive && handlePriorityChange(p)}
                    disabled={changingPriority || isActive}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold transition-all border",
                      isActive
                        ? cn(pc.bg, pc.color, pc.border, "ring-2 ring-offset-1", p === "URGENT" ? "ring-red-300" : p === "HIGH" ? "ring-orange-300" : "ring-blue-200")
                        : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 bg-white",
                      changingPriority && "opacity-50",
                    )}
                  >
                    {pc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Watchers */}
          {watchers.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Sledují ({watchers.length})</h3>
              <div className="flex flex-wrap gap-2">
                {watchers.map((w) => (
                  <span key={w.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-700 border border-gray-200">
                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold">
                      {w.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                    {w.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related requests */}
          {relatedRequests.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Související ({relatedRequests.length})</h3>
              <div className="space-y-2">
                {relatedRequests.map((r) => {
                  const rType = WORKFLOW_TYPES[r.type as keyof typeof WORKFLOW_TYPES] || WORKFLOW_TYPES.OTHER;
                  const rStatus = statusConfig[r.status] || statusConfig.CREATED;
                  return (
                    <button
                      key={r.id}
                      onClick={() => router.push(`/admin/workflow/${r.id}`)}
                      className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-xs">{rType.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">{r.title}</div>
                        <div className="text-[10px] text-gray-400">
                          {new Date(r.createdAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" })}
                        </div>
                      </div>
                      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", rStatus.dot)} title={rStatus.label} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
