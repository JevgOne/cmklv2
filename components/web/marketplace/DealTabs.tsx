"use client";

import { Badge } from "@/components/ui/Badge";

export type DealTab = "overview" | "finance" | "repair" | "negotiation" | "investors";

interface TabDef {
  key: DealTab;
  label: string;
  badge?: number;
  hidden?: boolean;
}

interface DealTabsProps {
  active: DealTab;
  onChange: (tab: DealTab) => void;
  tabs: TabDef[];
}

export function DealTabs({ active, onChange, tabs }: DealTabsProps) {
  const visibleTabs = tabs.filter((t) => !t.hidden);

  return (
    <div className="border-b border-gray-200 mb-6 -mx-4 px-4 overflow-x-auto">
      <nav className="flex gap-1 min-w-max" role="tablist">
        {visibleTabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.key)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <Badge variant={isActive ? "live" : "pending"}>
                    {tab.badge}
                  </Badge>
                )}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
