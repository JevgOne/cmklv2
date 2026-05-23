"use client";

import { useRouter } from "next/navigation";
import { WORKFLOW_TYPES } from "@/lib/workflow/types";
import type { WorkflowType } from "@/lib/workflow/types";

interface VehicleWorkflowButtonsProps {
  vehicleId: string;
  vehicleLabel: string;
}

const quickActions: { type: WorkflowType; short: string }[] = [
  { type: "FINANCING", short: "Financování" },
  { type: "INSURANCE", short: "Pojištění" },
  { type: "DOCUMENT", short: "Dokumenty" },
  { type: "SUPPORT", short: "Podpora" },
];

export function VehicleWorkflowButtons({ vehicleId, vehicleLabel }: VehicleWorkflowButtonsProps) {
  const router = useRouter();

  const handleClick = (type: WorkflowType) => {
    const params = new URLSearchParams({
      type,
      vehicleId,
      vehicleLabel,
    });
    router.push(`/makler/pozadavky/novy?${params.toString()}`);
  };

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-2 text-sm">Požadavky</h3>
      <div className="grid grid-cols-2 gap-2">
        {quickActions.map(({ type, short }) => {
          const config = WORKFLOW_TYPES[type];
          return (
            <button
              key={type}
              onClick={() => handleClick(type)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/50 transition-all text-left"
            >
              <span className="text-base">{config.icon}</span>
              <span className="text-xs font-medium text-gray-700">{short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
