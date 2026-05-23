"use client";

import { cn } from "@/lib/utils";
import { WORKFLOW_TYPES, WORKFLOW_STATUSES, WORKFLOW_PRIORITIES } from "@/lib/workflow/types";
import type { WorkflowFiltersState } from "@/types/workflow";

interface WorkflowFiltersProps {
  filters: WorkflowFiltersState;
  onChange: (filters: WorkflowFiltersState) => void;
  showTabs?: boolean;
}

const tabs = [
  { key: "my" as const, label: "Moje" },
  { key: "assigned" as const, label: "Přiřazené mně" },
  { key: "all" as const, label: "Všechny" },
];

const statusLabels: Record<string, string> = {
  CREATED: "Vytvořeno",
  QUEUED: "Ve frontě",
  ASSIGNED: "Přiřazeno",
  IN_PROGRESS: "Řeší se",
  WAITING_INFO: "Čeká na info",
  WAITING_APPROVAL: "Ke schválení",
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

export function WorkflowFilters({ filters, onChange, showTabs = true }: WorkflowFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Tabs */}
      {showTabs && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onChange({ ...filters, tab: tab.key })}
              className={cn(
                "flex-1 text-sm font-medium py-2 rounded-lg transition-all",
                filters.tab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Filter chips — horizontally scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {/* Type filter */}
        <select
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value as WorkflowFiltersState["type"] })}
          className={cn(
            "flex-shrink-0 text-xs font-medium rounded-full border px-3 py-1.5 bg-white appearance-none cursor-pointer",
            filters.type ? "border-orange-300 text-orange-600" : "border-gray-200 text-gray-600",
          )}
        >
          <option value="">Typ</option>
          {Object.entries(WORKFLOW_TYPES).map(([key, config]) => (
            <option key={key} value={key}>
              {config.icon} {config.label}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as WorkflowFiltersState["status"] })}
          className={cn(
            "flex-shrink-0 text-xs font-medium rounded-full border px-3 py-1.5 bg-white appearance-none cursor-pointer",
            filters.status ? "border-orange-300 text-orange-600" : "border-gray-200 text-gray-600",
          )}
        >
          <option value="">Stav</option>
          {WORKFLOW_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s] || s}
            </option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={filters.priority}
          onChange={(e) => onChange({ ...filters, priority: e.target.value as WorkflowFiltersState["priority"] })}
          className={cn(
            "flex-shrink-0 text-xs font-medium rounded-full border px-3 py-1.5 bg-white appearance-none cursor-pointer",
            filters.priority ? "border-orange-300 text-orange-600" : "border-gray-200 text-gray-600",
          )}
        >
          <option value="">Priorita</option>
          {WORKFLOW_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {priorityLabels[p] || p}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {(filters.type || filters.status || filters.priority) && (
          <button
            onClick={() => onChange({ ...filters, type: "", status: "", priority: "" })}
            className="flex-shrink-0 text-xs font-medium rounded-full border border-gray-200 px-3 py-1.5 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
          >
            Zrušit filtry
          </button>
        )}
      </div>
    </div>
  );
}
