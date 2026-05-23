import { cn } from "@/lib/utils";
import type { WorkflowStatus } from "@/lib/workflow/types";

const statusConfig: Record<WorkflowStatus, { label: string; bg: string; text: string; dot: string }> = {
  CREATED: { label: "Vytvořeno", bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  ASSIGNED: { label: "Přiřazeno", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  IN_PROGRESS: { label: "Řeší se", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  WAITING_INFO: { label: "Čeká na info", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  WAITING_APPROVAL: { label: "Ke schválení", bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  RESOLVED: { label: "Vyřešeno", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  CLOSED: { label: "Uzavřeno", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  CANCELLED: { label: "Zrušeno", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
};

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  className?: string;
}

export function WorkflowStatusBadge({ status, className }: WorkflowStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.CREATED;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        config.bg,
        config.text,
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
