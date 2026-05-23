import { cn } from "@/lib/utils";
import type { WorkflowPriority } from "@/lib/workflow/types";

const priorityConfig: Record<WorkflowPriority, { label: string; bg: string; text: string; icon: string }> = {
  LOW: { label: "Nízká", bg: "bg-gray-100", text: "text-gray-600", icon: "↓" },
  NORMAL: { label: "Normální", bg: "bg-blue-50", text: "text-blue-600", icon: "→" },
  HIGH: { label: "Vysoká", bg: "bg-orange-50", text: "text-orange-600", icon: "↑" },
  URGENT: { label: "Urgentní", bg: "bg-red-50", text: "text-red-600", icon: "⚡" },
};

interface WorkflowPriorityBadgeProps {
  priority: WorkflowPriority;
  className?: string;
}

export function WorkflowPriorityBadge({ priority, className }: WorkflowPriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.NORMAL;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
        config.bg,
        config.text,
        className,
      )}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
