"use client";

import { Tabs } from "@/components/ui/Tabs";

export function PartFilters({
  activeTab,
  onTabChange,
  counts,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts?: Record<string, number>;
}) {
  const tabs = [
    { value: "all", label: counts ? `Vše (${counts.all ?? 0})` : "Vše" },
    { value: "ACTIVE", label: counts ? `Aktivní (${counts.ACTIVE ?? 0})` : "Aktivní" },
    { value: "INACTIVE", label: counts ? `Neaktivní (${counts.INACTIVE ?? 0})` : "Neaktivní" },
    { value: "SOLD", label: counts ? `Prodané (${counts.SOLD ?? 0})` : "Prodané" },
  ];

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
