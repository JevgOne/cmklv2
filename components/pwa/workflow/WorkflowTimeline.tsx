"use client";

import { cn } from "@/lib/utils";
import type { WorkflowStep } from "@/types/workflow";

const actionConfig: Record<string, { icon: string; color: string }> = {
  CREATED: { icon: "🟢", color: "bg-green-500" },
  ASSIGNED: { icon: "🔵", color: "bg-blue-500" },
  STATUS_CHANGED: { icon: "🟡", color: "bg-amber-500" },
  PRIORITY_CHANGED: { icon: "🟠", color: "bg-orange-500" },
  COMMENTED: { icon: "💬", color: "bg-gray-400" },
  DOCUMENT_ADDED: { icon: "📎", color: "bg-purple-500" },
  REASSIGNED: { icon: "🔄", color: "bg-blue-400" },
  ESCALATED: { icon: "🔴", color: "bg-red-500" },
  RESOLVED: { icon: "✅", color: "bg-green-600" },
  CLOSED: { icon: "🏁", color: "bg-gray-500" },
  REOPENED: { icon: "🔓", color: "bg-yellow-500" },
};

const actionLabels: Record<string, string> = {
  CREATED: "Vytvořeno",
  ASSIGNED: "Přiřazeno",
  STATUS_CHANGED: "Změna stavu",
  PRIORITY_CHANGED: "Změna priority",
  COMMENTED: "Komentář",
  DOCUMENT_ADDED: "Dokument přidán",
  REASSIGNED: "Přeřazeno",
  ESCALATED: "Eskalováno",
  RESOLVED: "Vyřešeno",
  CLOSED: "Uzavřeno",
  REOPENED: "Znovu otevřeno",
};

interface WorkflowTimelineProps {
  steps: WorkflowStep[];
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUserName(user: WorkflowStep["performedBy"]): string {
  if (!user) return "Systém";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Neznámý";
}

export function WorkflowTimeline({ steps }: WorkflowTimelineProps) {
  if (steps.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Žádná historie
      </div>
    );
  }

  return (
    <div className="relative">
      {steps.map((step, index) => {
        const config = actionConfig[step.action] || { icon: "⚪", color: "bg-gray-300" };
        const isLast = index === steps.length - 1;
        const label = actionLabels[step.action] || step.action;

        return (
          <div key={step.id} className="relative flex gap-3 pb-4">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200" />
            )}

            {/* Icon */}
            <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm">
              {config.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {label}
                  {step.fromStatus && step.toStatus && (
                    <span className="text-gray-400 font-normal">
                      {" "}
                      {step.fromStatus} → {step.toStatus}
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDateTime(step.createdAt)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {getUserName(step.performedBy)}
              </div>
              {step.note && (
                <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-2">
                  {step.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
