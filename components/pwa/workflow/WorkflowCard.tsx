"use client";

import Link from "next/link";
import { WORKFLOW_TYPES } from "@/lib/workflow/types";
import { WorkflowStatusBadge } from "./WorkflowStatusBadge";
import { WorkflowPriorityBadge } from "./WorkflowPriorityBadge";
import type { WorkflowRequestSummary } from "@/types/workflow";

interface WorkflowCardProps {
  request: WorkflowRequestSummary;
  basePath?: string;
}

function getUserName(user: { firstName: string | null; lastName: string | null } | null): string {
  if (!user) return "Nepřiřazeno";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Neznámý";
}

function formatSlaRemaining(dueAt: string | null, slaBreached: boolean): string | null {
  if (!dueAt) return null;
  if (slaBreached) return "SLA překročeno";

  const now = Date.now();
  const due = new Date(dueAt).getTime();
  const diffMs = due - now;

  if (diffMs <= 0) return "SLA překročeno";

  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d zbývá`;
  }
  if (hours > 0) return `${hours}h ${mins}m zbývá`;
  return `${mins}m zbývá`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WorkflowCard({ request, basePath = "/makler/pozadavky" }: WorkflowCardProps) {
  const typeConfig = WORKFLOW_TYPES[request.type] || WORKFLOW_TYPES.OTHER;
  const slaText = formatSlaRemaining(request.dueAt, request.slaBreached);

  return (
    <Link
      href={`${basePath}/${request.id}`}
      className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 hover:shadow-sm transition-all no-underline"
    >
      {/* Header: type + category */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{typeConfig.icon}</span>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">
              {request.title}
            </div>
            <div className="text-xs text-gray-400">
              {typeConfig.label}
              {request.category && ` — ${request.category.toLowerCase()}`}
            </div>
          </div>
        </div>
        <WorkflowPriorityBadge priority={request.priority} />
      </div>

      {/* Vehicle context */}
      {request.vehicleLabel && (
        <div className="text-xs text-gray-500 mb-2 truncate">
          {request.vehicleLabel}
        </div>
      )}

      {/* Footer: status + assignee + SLA */}
      <div className="flex items-center justify-between gap-2 mt-3">
        <WorkflowStatusBadge status={request.status} />
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{getUserName(request.assignedTo)}</span>
          {slaText && (
            <span className={request.slaBreached ? "text-red-500 font-semibold" : "text-gray-400"}>
              {slaText}
            </span>
          )}
        </div>
      </div>

      {/* Meta: date + counts */}
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-300">
        <span>{formatDate(request.createdAt)}</span>
        {request._count && request._count.comments > 0 && (
          <span className="flex items-center gap-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M1 8.74c0 .983.713 1.825 1.69 1.943.764.092 1.534.164 2.31.216v2.351a.75.75 0 0 0 1.28.53l2.51-2.51c.182-.181.427-.29.685-.313A23 23 0 0 0 13.31 10.7c.976-.118 1.69-.96 1.69-1.942V4.259c0-.982-.714-1.824-1.69-1.942a23.5 23.5 0 0 0-3.31-.217 23.5 23.5 0 0 0-3.31.217C5.714 2.435 5 3.277 5 4.26v.5" />
            </svg>
            {request._count.comments}
          </span>
        )}
        {request._count && request._count.documents > 0 && (
          <span className="flex items-center gap-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M4 2a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6.621a1.5 1.5 0 0 0-.44-1.06L9.94 2.439A1.5 1.5 0 0 0 8.878 2H4Z" clipRule="evenodd" />
            </svg>
            {request._count.documents}
          </span>
        )}
      </div>
    </Link>
  );
}
