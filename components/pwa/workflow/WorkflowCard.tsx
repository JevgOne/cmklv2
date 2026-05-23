"use client";

import Link from "next/link";
import Image from "next/image";
import { WORKFLOW_TYPES } from "@/lib/workflow/types";
import { WorkflowStatusBadge } from "./WorkflowStatusBadge";
import { WorkflowPriorityBadge } from "./WorkflowPriorityBadge";
import type { WorkflowRequestSummary } from "@/types/workflow";

interface WorkflowCardProps {
  request: WorkflowRequestSummary;
  basePath?: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "admin",
  MANAGER: "manažer",
  REGIONAL_DIRECTOR: "reg. ředitel",
  BROKER: "makléř",
};

function getUserName(user: { firstName: string | null; lastName: string | null } | null): string {
  if (!user) return "Nepřiřazeno";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Neznámý";
}

function formatSlaRemaining(dueAt: string | null, slaBreached: boolean): { text: string; urgent: boolean } | null {
  if (!dueAt) return null;

  const now = Date.now();
  const due = new Date(dueAt).getTime();
  const diffMs = due - now;

  if (slaBreached || diffMs <= 0) {
    const overMs = Math.abs(diffMs);
    const overHours = Math.floor(overMs / 3600000);
    if (overHours > 24) {
      return { text: `Překročeno o ${Math.floor(overHours / 24)}d`, urgent: true };
    }
    return { text: overHours > 0 ? `Překročeno o ${overHours}h` : "Překročeno", urgent: true };
  }

  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);

  if (hours > 24) {
    return { text: `${Math.floor(hours / 24)}d zbývá`, urgent: false };
  }
  if (hours > 0) {
    return { text: `${hours}h ${mins}m zbývá`, urgent: hours <= 2 };
  }
  return { text: `${mins}m zbývá`, urgent: true };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateVin(vin: string): string {
  if (vin.length <= 8) return vin;
  return `${vin.slice(0, 3)}...${vin.slice(-4)}`;
}

export function WorkflowCard({ request, basePath = "/makler/pozadavky" }: WorkflowCardProps) {
  const typeConfig = WORKFLOW_TYPES[request.type] || WORKFLOW_TYPES.OTHER;
  const sla = formatSlaRemaining(request.dueAt, request.slaBreached);
  const vehicle = request.vehicleContext;
  const contact = request.contactContext;

  return (
    <Link
      href={`${basePath}/${request.id}`}
      className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 hover:shadow-sm transition-all no-underline"
    >
      {/* Row 1: Type + title + priority */}
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

      {/* Row 2: Vehicle context */}
      {vehicle && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
          {vehicle.thumbnailUrl ? (
            <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
              <Image
                src={vehicle.thumbnailUrl}
                alt={`${vehicle.brand} ${vehicle.model}`}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center flex-shrink-0 text-sm">
              🚗
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-gray-900 truncate">
              {vehicle.brand} {vehicle.model} {vehicle.year}
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              VIN: {truncateVin(vehicle.vin)}
            </div>
          </div>
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/makler/vehicles/${vehicle.id}`;
            }}
            className="text-[10px] text-orange-500 font-medium flex-shrink-0 hover:underline cursor-pointer"
          >
            Detail →
          </span>
        </div>
      )}

      {/* Row 3: Contact context */}
      {contact && (
        <div className="flex items-center gap-2 mb-2 text-xs">
          <span className="text-gray-400">👤</span>
          <span className="text-gray-700 font-medium">{contact.name}</span>
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `tel:${contact.phone}`;
            }}
            className="text-orange-500 font-medium hover:underline cursor-pointer"
          >
            {contact.phone}
          </span>
        </div>
      )}

      {/* Row 4: Od koho → Pro koho */}
      <div className="flex items-center gap-1 mb-2 text-xs text-gray-500">
        <span className="font-medium text-gray-700">{getUserName(request.createdBy)}</span>
        <span className="text-gray-300">→</span>
        <span className="font-medium text-gray-700">
          {getUserName(request.assignedTo)}
        </span>
        {request.assignedRole && !request.assignedTo && (
          <span className="text-gray-400">
            ({ROLE_LABELS[request.assignedRole] || request.assignedRole})
          </span>
        )}
        {request.assignedTo && request.assignedRole && (
          <span className="text-gray-400">
            ({ROLE_LABELS[request.assignedRole] || request.assignedRole})
          </span>
        )}
      </div>

      {/* Row 5: Status + SLA */}
      <div className="flex items-center justify-between gap-2">
        <WorkflowStatusBadge status={request.status} />
        <div className="flex items-center gap-3 text-xs">
          {sla && (
            <span className={`font-medium ${sla.urgent ? "text-red-500" : "text-gray-400"}`}>
              {sla.text}
            </span>
          )}
        </div>
      </div>

      {/* Row 6: Meta — date + counts */}
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
