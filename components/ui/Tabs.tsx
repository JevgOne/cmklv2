"use client";

import { useState, useRef, useCallback } from "react";
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
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleChange = (value: string) => {
    if (!isControlled) setInternalTab(value);
    onTabChange?.(value);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = tabs.findIndex((t) => t.value === currentTab);
      let newIndex = currentIndex;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        newIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        newIndex = tabs.length - 1;
      } else {
        return;
      }
      const newTab = tabs[newIndex];
      handleChange(newTab.value);
      tabRefs.current.get(newTab.value)?.focus();
    },
    [tabs, currentTab]
  );

  return (
    <div
      role="tablist"
      className={cn("flex gap-1 bg-gray-100 p-1 rounded-lg", className)}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.value;
        return (
          <button
            key={tab.value}
            ref={(el) => { if (el) tabRefs.current.set(tab.value, el); }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleChange(tab.value)}
            className={cn(
              "px-5 py-2.5 bg-transparent text-sm font-semibold text-gray-600 rounded-[10px] cursor-pointer transition-all duration-200 hover:text-gray-900 border-none",
              isActive && "bg-white text-gray-900 shadow-sm"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
