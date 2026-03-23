import { Card } from "@/components/ui/Card";

type PendingStatus = "pending" | "syncing" | "done" | "error";

interface PendingItemProps {
  title: string;
  type: string;
  status: PendingStatus;
}

const statusConfig: Record<PendingStatus, { icon: string; label: string; color: string }> = {
  pending: { icon: "⏳", label: "Čeká na sync", color: "text-warning-500" },
  syncing: { icon: "🔄", label: "Synchronizuji", color: "text-info-500" },
  done: { icon: "✅", label: "Hotovo", color: "text-success-500" },
  error: { icon: "❌", label: "Chyba", color: "text-error-500" },
};

const typeIcons: Record<string, string> = {
  draft: "🚗",
  image: "🖼️",
  update: "✏️",
};

export function PendingItem({ title, type, status }: PendingItemProps) {
  const config = statusConfig[status];

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
          {typeIcons[type] || "📄"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm truncate">
            {title}
          </div>
          <div className={`text-xs font-medium ${config.color} mt-0.5`}>
            {config.icon} {config.label}
          </div>
        </div>
      </div>
    </Card>
  );
}
