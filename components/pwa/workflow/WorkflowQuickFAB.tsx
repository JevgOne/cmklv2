"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WORKFLOW_TYPES } from "@/lib/workflow/types";
import type { WorkflowType } from "@/lib/workflow/types";

interface WorkflowQuickFABProps {
  vehicleId?: string;
  vehicleLabel?: string;
}

export function WorkflowQuickFAB({ vehicleId, vehicleLabel }: WorkflowQuickFABProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const quickTypes: WorkflowType[] = [
    "FINANCING",
    "INSURANCE",
    "DOCUMENT",
    "SUPPORT",
    "QUESTION",
    "BUG_REPORT",
  ];

  const handleSelect = (type: WorkflowType) => {
    setOpen(false);
    const params = new URLSearchParams({ type });
    if (vehicleId) params.set("vehicleId", vehicleId);
    if (vehicleLabel) params.set("vehicleLabel", vehicleLabel);
    router.push(`/makler/pozadavky/novy?${params.toString()}`);
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Quick menu */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 w-56 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="text-xs font-medium text-gray-400 px-3 py-1.5 uppercase tracking-wide">
            Nový požadavek
          </div>
          {quickTypes.map((type) => {
            const config = WORKFLOW_TYPES[type];
            return (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-orange-50 transition-colors"
              >
                <span className="text-lg">{config.icon}</span>
                <span className="text-sm font-medium text-gray-900">{config.label}</span>
              </button>
            );
          })}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => {
                setOpen(false);
                router.push("/makler/pozadavky/novy");
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">📋</span>
              <span className="text-sm font-medium text-gray-500">Všechny typy...</span>
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center"
        aria-label="Nový požadavek"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-7 h-7 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </>
  );
}
