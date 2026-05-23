"use client";

import { cn } from "@/lib/utils";
import type { WorkflowComment } from "@/types/workflow";

interface WorkflowCommentsProps {
  comments: WorkflowComment[];
  currentUserId?: string;
}

function getUserName(user: WorkflowComment["author"]): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Neznámý";
}

function getInitials(user: WorkflowComment["author"]): string {
  const f = user.firstName?.[0] || "";
  const l = user.lastName?.[0] || "";
  return (f + l).toUpperCase() || "?";
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WorkflowComments({ comments, currentUserId }: WorkflowCommentsProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Zatím žádné komentáře
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => {
        const isMine = currentUserId === comment.author.id;
        return (
          <div
            key={comment.id}
            className={cn(
              "rounded-xl px-4 py-3",
              comment.isInternal
                ? "bg-amber-50 border border-amber-200"
                : "bg-gray-50",
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {getInitials(comment.author)}
              </div>
              <span className="text-sm font-medium text-gray-900">
                {getUserName(comment.author)}
                {isMine && <span className="text-gray-400 font-normal"> (vy)</span>}
              </span>
              {comment.isInternal && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                  INTERNÍ
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {formatTime(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap pl-8">
              {comment.content}
            </p>
          </div>
        );
      })}
    </div>
  );
}
