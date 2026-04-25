"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  COMMISSION: "Provize",
  VEHICLE: "Vozidlo",
  SYSTEM: "Systém",
  MESSAGE: "Zpráva",
};

export function NotificationsPageContent({ notifications: initial }: { notifications: Notification[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initial);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

  const handleMarkAllRead = async () => {
    if (unreadIds.length === 0) return;
    setMarkingAll(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unreadIds }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch {
      // silently fail
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      try {
        await fetch("/api/admin/notifications", {
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("cs-CZ", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {unreadIds.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? "Označuji..." : `Označit vše jako přečtené (${unreadIds.length})`}
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-gray-500">Zatím nemáte žádná upozornění.</p>
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden divide-y divide-gray-100">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleClick(n)}
              className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                !n.read ? "bg-orange-50/40" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                {!n.read && (
                  <span className="w-2.5 h-2.5 bg-orange-500 rounded-full mt-1 shrink-0" />
                )}
                <div className={!n.read ? "flex-1" : "flex-1 pl-[22px]"}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-900">{n.title}</span>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {typeLabels[n.type] || n.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{n.body}</p>
                  <span className="text-xs text-gray-400 mt-1 block">{formatDate(n.createdAt)}</span>
                </div>
              </div>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
