import { Card } from "@/components/ui/Card";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsListProps {
  notifications: Notification[];
}

const typeIcons: Record<string, string> = {
  VEHICLE_APPROVED: "✅",
  VEHICLE_REJECTED: "❌",
  COMMISSION_PAID: "💰",
  NEW_INQUIRY: "💬",
  SYSTEM: "🔔",
};

export function NotificationsList({ notifications }: NotificationsListProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
        Notifikace
      </h3>
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`p-4 ${!notification.read ? "border-l-4 border-l-orange-500" : ""}`}
        >
          <div className="flex gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
              {typeIcons[notification.type] || "🔔"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm">
                {notification.title}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 truncate">
                {notification.body}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {formatRelativeTime(notification.createdAt)}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Prave ted";
  if (diffMins < 60) return `Pred ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Pred ${diffHours} hod`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Pred ${diffDays} dny`;

  return date.toLocaleDateString("cs-CZ");
}
