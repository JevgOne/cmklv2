"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { WORKFLOW_TYPES, WORKFLOW_STATUSES, WORKFLOW_PRIORITIES } from "@/lib/workflow/types";
import { WorkflowStatusBadge } from "@/components/pwa/workflow/WorkflowStatusBadge";
import { WorkflowPriorityBadge } from "@/components/pwa/workflow/WorkflowPriorityBadge";
import type { WorkflowRequestSummary, WorkflowStats } from "@/types/workflow";
import type { WorkflowType, WorkflowStatus, WorkflowPriority } from "@/lib/workflow/types";

interface AdminWorkflowDashboardProps {
  requests: WorkflowRequestSummary[];
  stats: WorkflowStats;
  assignableUsers: { id: string; name: string }[];
}

const statusLabels: Record<string, string> = {
  CREATED: "Vytvořeno",
  QUEUED: "Ve frontě",
  ASSIGNED: "Přiřazeno",
  IN_PROGRESS: "Řeší se",
  WAITING_INFO: "Čeká na info",
  WAITING_APPROVAL: "Ke schválení",
  ESCALATED: "Eskalováno",
  RESOLVED: "Vyřešeno",
  CLOSED: "Uzavřeno",
  CANCELLED: "Zrušeno",
};

const priorityLabels: Record<string, string> = {
  LOW: "Nízká",
  NORMAL: "Normální",
  HIGH: "Vysoká",
  URGENT: "Urgentní",
};

function getUserName(user: { firstName: string | null; lastName: string | null } | null): string {
  if (!user) return "—";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminWorkflowDashboard({
  requests,
  stats,
  assignableUsers,
}: AdminWorkflowDashboardProps) {
  const [filterType, setFilterType] = useState<WorkflowType | "">("");
  const [filterStatus, setFilterStatus] = useState<WorkflowStatus | "">("");
  const [filterPriority, setFilterPriority] = useState<WorkflowPriority | "">("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [showSlaOnly, setShowSlaOnly] = useState(false);

  const filtered = requests.filter((r) => {
    if (filterType && r.type !== filterType) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterPriority && r.priority !== filterPriority) return false;
    if (filterAssignee && r.assignedTo?.id !== filterAssignee) return false;
    if (showSlaOnly && !r.slaBreached) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Celkem požadavků" value={stats.total} />
        <StatCard label="Otevřené" value={stats.open} variant="orange" />
        <StatCard label="Přiřazené mně" value={stats.myAssigned} variant="blue" />
        <StatCard
          label="SLA překročeno"
          value={stats.slaBreached}
          variant={stats.slaBreached > 0 ? "red" : "default"}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as WorkflowType | "")}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white"
          >
            <option value="">Všechny typy</option>
            {Object.entries(WORKFLOW_TYPES).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as WorkflowStatus | "")}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white"
          >
            <option value="">Všechny stavy</option>
            {WORKFLOW_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as WorkflowPriority | "")}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white"
          >
            <option value="">Všechny priority</option>
            {WORKFLOW_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {priorityLabels[p]}
              </option>
            ))}
          </select>

          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white"
          >
            <option value="">Všichni přiřazení</option>
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showSlaOnly}
              onChange={(e) => setShowSlaOnly(e.target.checked)}
              className="rounded border-gray-300 text-red-500 focus:ring-red-500"
            />
            Jen SLA překročené
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Typ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Název</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Stav</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Priorita</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Vytvořil</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Přiřazeno</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">SLA</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Vytvořeno</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    Žádné požadavky k zobrazení
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const typeConfig = WORKFLOW_TYPES[r.type] || WORKFLOW_TYPES.OTHER;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span title={typeConfig.label}>{typeConfig.icon}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/workflow/${r.id}`}
                          className="font-medium text-gray-900 hover:text-orange-600 no-underline"
                        >
                          {r.title}
                        </Link>
                        {r.vehicleLabel && (
                          <div className="text-xs text-gray-400 mt-0.5">{r.vehicleLabel}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <WorkflowStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <WorkflowPriorityBadge priority={r.priority} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {getUserName(r.createdBy)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {getUserName(r.assignedTo)}
                      </td>
                      <td className="px-4 py-3">
                        {r.slaBreached ? (
                          <span className="text-xs font-bold text-red-500">PŘEKROČENO</span>
                        ) : r.dueAt ? (
                          <span className="text-xs text-gray-400">
                            {formatDate(r.dueAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {formatDate(r.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-400 text-right">
        Zobrazeno {filtered.length} z {requests.length} požadavků
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "orange" | "blue" | "red";
}) {
  const valueColor = {
    default: "text-gray-900",
    orange: "text-orange-500",
    blue: "text-blue-500",
    red: "text-red-500",
  }[variant];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={cn("text-2xl font-bold", valueColor)}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
