"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab?: string;
  defaultTab?: string;
  onTabChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab: controlledTab, defaultTab, onTabChange, className }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultTab || tabs[0]?.value);
  const isControlled = controlledTab !== undefined;
  const currentTab = isControlled ? controlledTab : internalTab;

  const handleChange = (value: string) => {
    if (!isControlled) setInternalTab(value);
    onTabChange?.(value);
  };

  return (
    <div className={cn("flex gap-1 bg-gray-100 p-1 rounded-lg", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => handleChange(tab.value)}
          className={cn(
            "px-5 py-2.5 bg-transparent text-sm font-semibold text-gray-600 rounded-[10px] cursor-pointer transition-all duration-200 hover:text-gray-900 border-none",
            currentTab === tab.value && "bg-white text-gray-900 shadow-sm"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
