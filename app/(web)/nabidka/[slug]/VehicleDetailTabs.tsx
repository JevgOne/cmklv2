"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";

interface VehicleDetailTabsProps {
  parameters: { label: string; value: string }[];
  equipment: string[];
  description: string;
  history: { date: string; event: string; detail: string | null }[];
}

const tabItems = [
  { value: "params", label: "Parametry" },
  { value: "equipment", label: "Výbava" },
  { value: "description", label: "Popis" },
  { value: "history", label: "Historie" },
];

export function VehicleDetailTabs({
  parameters,
  equipment,
  description,
  history,
}: VehicleDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("params");

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      {/* Tab buttons */}
      <div className="p-3 sm:p-4 pb-0 overflow-x-auto">
        <Tabs
          tabs={tabItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Tab content */}
      <div className="p-4 sm:p-6">
        {/* ---- Parametry ---- */}
        {activeTab === "params" && (
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-0">
            {parameters.map((param) => (
              <div
                key={param.label}
                className="flex justify-between items-center py-3 border-b border-gray-100"
              >
                <span className="text-sm text-gray-500">{param.label}</span>
                <span className="text-sm font-semibold text-gray-900 text-right">
                  {param.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ---- Výbava ---- */}
        {activeTab === "equipment" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {equipment.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 py-2 text-sm text-gray-700"
              >
                <span className="w-5 h-5 bg-success-50 text-success-500 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  ✓
                </span>
                {item}
              </div>
            ))}
          </div>
        )}

        {/* ---- Popis ---- */}
        {activeTab === "description" && (
          <div className="max-w-3xl">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>
        )}

        {/* ---- Historie ---- */}
        {activeTab === "history" && (
          <div className="relative pl-6">
            {/* Timeline line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200" />

            <div className="flex flex-col gap-6">
              {history.map((entry, i) => (
                <div key={i} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-6 top-1.5 w-[18px] h-[18px] rounded-full bg-white border-2 border-orange-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                  </div>

                  {/* Content */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-1">
                      {entry.date}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {entry.event}
                    </div>
                    {entry.detail && (
                      <div className="text-sm text-gray-500 mt-0.5">
                        {entry.detail}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
