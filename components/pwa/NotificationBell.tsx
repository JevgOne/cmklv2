"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  showAllHref?: string;
}

export function NotificationBell({ showAllHref = "/makler/dashboard" }: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/broker/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Click outside → close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await fetch("/api/broker/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [notification.id] }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // silently fail
      }
    }
    setOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "právě teď";
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    return `${days} d`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-1 text-gray-600 bg-transparent border-none cursor-pointer"
        aria-label="Notifikace"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[320px] bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-bold text-sm text-gray-900">Upozornění</span>
            {unreadCount > 0 && (
              <span className="text-xs text-gray-500">{unreadCount} nepřečtených</span>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Žádná upozornění
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer bg-transparent border-none ${
                    !n.read ? "bg-orange-50/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 shrink-0" />
                    )}
                    <div className={!n.read ? "" : "pl-4"}>
                      <div className="text-sm font-medium text-gray-900">{n.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(showAllHref);
              }}
              className="w-full text-center text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors cursor-pointer bg-transparent border-none py-1"
            >
              Zobrazit vše
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
