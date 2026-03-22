"use client";

import { Tabs } from "@/components/ui/Tabs";

const tabs = [
  { value: "all", label: "Vše" },
  { value: "ACTIVE", label: "Aktivní" },
  { value: "INACTIVE", label: "Neaktivní" },
  { value: "SOLD", label: "Prodané" },
];

export function PartFilters({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
