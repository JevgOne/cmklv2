"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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

interface NotificationsInboxProps {
  initialNotifications: Notification[];
  initialUnreadCount: number;
  initialNextCursor?: string;
  initialHasMore: boolean;
}

export function NotificationsInbox({
  initialNotifications,
  initialUnreadCount,
  initialNextCursor,
  initialHasMore,
}: NotificationsInboxProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        take: "20",
        cursor: nextCursor,
        ...(filter === "unread" && { unreadOnly: "true" }),
      });
      const res = await fetch(`/api/broker/notifications?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications((prev) => [...prev, ...data.notifications]);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, filter]);

  const refetch = useCallback(async () => {
    const params = new URLSearchParams({
      take: "20",
      ...(filter === "unread" && { unreadOnly: "true" }),
    });
    const res = await fetch(`/api/broker/notifications?${params}`);
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    }
  }, [filter]);

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
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // silently fail
      }
    }
    if (n.link) router.push(n.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/broker/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  const handleFilterChange = async (newFilter: "all" | "unread") => {
    setFilter(newFilter);
    const params = new URLSearchParams({
      take: "20",
      ...(newFilter === "unread" && { unreadOnly: "true" }),
    });
    const res = await fetch(`/api/broker/notifications?${params}`);
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Nyní";
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} d`;
    return new Date(dateStr).toLocaleDateString("cs-CZ");
  };

  const typeIcon: Record<string, string> = {
    VEHICLE: "🚗",
    MESSAGE: "💬",
    COMMISSION: "💰",
    SYSTEM: "🔔",
  };

  return (
    <div>
      {/* Filtry + akce */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => handleFilterChange("all")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer border-none ${
              filter === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900 bg-transparent"
            }`}
          >
            Vše
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("unread")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer border-none ${
              filter === "unread"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900 bg-transparent"
            }`}
          >
            Nepřečtené {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Označit vše jako přečtené
          </Button>
        )}
      </div>

      {/* Notifikace */}
      {notifications.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-sm">
            {filter === "unread" ? "Žádné nepřečtené notifikace" : "Zatím žádné notifikace"}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleClick(n)}
              className={`w-full text-left px-4 py-3.5 rounded-xl transition-colors cursor-pointer border-none ${
                !n.read
                  ? "bg-orange-50/70 hover:bg-orange-50"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5 shrink-0">
                  {typeIcon[n.type] || "🔔"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {n.title}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                    {n.body}
                  </p>
                  <span className="text-xs text-gray-400 mt-1 block">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Načítám..." : "Načíst starší"}
          </Button>
        </div>
      )}
    </div>
  );
}
