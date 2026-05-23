"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePusher } from "@/hooks/usePusher";

interface WorkflowBadgeProps {
  userId: string;
  userRole: string;
}

export function WorkflowBadge({ userId, userRole }: WorkflowBadgeProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/workflow/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) {
          setCount(data.stats.assignedToMe + data.stats.queuedForRole);
        }
      })
      .catch(() => {});
  }, []);

  // Real-time: increment on new assignment
  usePusher(
    userId ? `private-user-${userId}` : null,
    "workflow:assigned",
    () => setCount((c) => c + 1),
  );

  // Real-time: new items in role queue
  usePusher(
    userRole ? `private-role-${userRole}` : null,
    "workflow:created",
    () => setCount((c) => c + 1),
  );

  return (
    <Link
      href="/makler/pozadavky"
      className="relative p-1 text-gray-600"
      aria-label="Požadavky"
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
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
