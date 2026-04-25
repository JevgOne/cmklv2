"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
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

export function NotificationsList({ notifications: initial }: NotificationsListProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initial);

  if (notifications.length === 0) {
    return null;
  }

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      try {
        await fetch("/api/broker/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [n.id] }),
        });
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
        );
      } catch {
        // silently fail
      }
    }
    if (n.link) {
      router.push(n.link);
    }
  };

  return (
    <div data-tour="notifications" className="space-y-3">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
        Notifikace
      </h3>
      {notifications.map((notification) => (
        <button
          key={notification.id}
          type="button"
          onClick={() => handleClick(notification)}
          className="w-full text-left"
        >
          <Card
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.read ? "border-l-4 border-l-orange-500" : ""}`}
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
        </button>
      ))}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Právě teď";
  if (diffMins < 60) return `Před ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Před ${diffHours} hod`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Před ${diffDays} dny`;

  return date.toLocaleDateString("cs-CZ");
}
