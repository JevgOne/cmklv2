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
}

export function VehicleComments({ vehicleId, initialComments }: VehicleCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        const { comment } = await res.json();
        setComments((prev) => [...prev, comment]);
        setContent("");
      }
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  const initials = (firstName: string, lastName: string) =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const isAdminRole = (role: string) =>
    ["ADMIN", "BACKOFFICE", "MANAGER"].includes(role);

  if (comments.length === 0 && !content) {
    return null; // Nezobrazovat prázdnou sekci
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-base font-bold text-gray-900 mb-3">
        Zprávy od admina
      </h3>

      {comments.length === 0 && (
        <p className="text-sm text-gray-400 mb-3">Zatím žádné zprávy.</p>
      )}

      <div className="space-y-2.5 mb-4">
        {comments.map((c) => (
          <div
            key={c.id}
            className={`p-3 rounded-xl text-sm ${
              isAdminRole(c.user.role)
                ? "bg-blue-50 border border-blue-100"
                : "bg-gray-50 border border-gray-100"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {c.user.avatar ? (
                <img
                  src={c.user.avatar}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold flex items-center justify-center">
                  {initials(c.user.firstName, c.user.lastName)}
                </div>
              )}
              <span className="font-semibold text-gray-900 text-xs">
                {c.user.firstName} {c.user.lastName}
              </span>
              <span className="text-[10px] text-gray-400 ml-auto">
                {new Date(c.createdAt).toLocaleString("cs-CZ", {
                  day: "numeric",
                  month: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-gray-700 whitespace-pre-line">{c.content}</p>
          </div>
        ))}
      </div>

      {/* Formulář pro odpověď */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Odpovědět..."
          maxLength={2000}
          className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 min-h-[44px]"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!content.trim() || sending}
          className="min-h-[44px]"
        >
          {sending ? "..." : "Odeslat"}
        </Button>
      </form>
    </div>
  );
}
