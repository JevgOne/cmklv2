"use client";

import type { WorkflowStats } from "@/types/workflow";

interface WorkflowStatsProps {
  stats: WorkflowStats;
}

export function WorkflowStatsBar({ stats }: WorkflowStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <StatBox label="Celkem" value={stats.total} />
      <StatBox label="Otevřené" value={stats.open} highlight />
      <StatBox label="Moje" value={stats.myAssigned} />
      <StatBox
        label="SLA!"
        value={stats.slaBreached}
        danger={stats.slaBreached > 0}
      />
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight,
  danger,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
      <div
        className={`text-xl font-bold ${
          danger
            ? "text-red-500"
            : highlight
              ? "text-orange-500"
              : "text-gray-900"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">
        {label}
      </div>
    </div>
  );
}
