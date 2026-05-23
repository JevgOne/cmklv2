"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    role: string;
    avatar: string | null;
  };
}

interface VehicleCommentsProps {
  vehicleId: string;
  initialComments: Comment[];
  currentUserRole: string;
}

export function VehicleComments({
  vehicleId,
  initialComments,
  currentUserRole,
}: VehicleCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const canSetInternal = ["ADMIN", "BACKOFFICE", "MANAGER"].includes(currentUserRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), isInternal }),
      });
      if (res.ok) {
        const { comment } = await res.json();
        setComments((prev) => [...prev, comment]);
        setContent("");
        setIsInternal(false);
      }
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  const initials = (firstName: string, lastName: string) =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const roleLabel: Record<string, string> = {
    ADMIN: "Admin",
    BACKOFFICE: "BackOffice",
    MANAGER: "Manažer",
    BROKER: "Makléř",
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Komentáře</h2>

      {comments.length === 0 && (
        <p className="text-sm text-gray-400 mb-4">Zatím žádné komentáře.</p>
      )}

      <div className="space-y-3 mb-6">
        {comments.map((c) => (
          <div
            key={c.id}
            className={`p-3 rounded-xl text-sm ${
              c.isInternal
                ? "bg-amber-50 border border-amber-200"
                : "bg-gray-50 border border-gray-100"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {c.user.avatar ? (
                <img
                  src={c.user.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center">
                  {initials(c.user.firstName, c.user.lastName)}
                </div>
              )}
              <span className="font-semibold text-gray-900">
                {c.user.firstName} {c.user.lastName}
              </span>
              <span className="text-xs text-gray-400">
                {roleLabel[c.user.role] || c.user.role}
              </span>
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(c.createdAt).toLocaleString("cs-CZ", {
                  day: "numeric",
                  month: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {c.isInternal && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                  Interní
                </span>
              )}
            </div>
            <p className="text-gray-700 whitespace-pre-line">{c.content}</p>
          </div>
        ))}
      </div>

      {/* Formulář */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Napište komentář..."
          rows={3}
          maxLength={2000}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
        />
        <div className="flex items-center justify-between">
          {canSetInternal && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              Interní poznámka
            </label>
          )}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!content.trim() || sending}
          >
            {sending ? "Odesílám..." : "Odeslat"}
          </Button>
        </div>
      </form>
    </div>
  );
}
