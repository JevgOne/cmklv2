"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
    slug: string | null;
  };
}

interface CommentSectionProps {
  vehicleId?: string;
  listingId?: string;
  partId?: string;
  initialCount?: number;
  itemOwnerId?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "právě teď";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
}

export function CommentSection({
  vehicleId,
  listingId,
  partId,
  initialCount = 0,
  itemOwnerId,
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const targetParam = vehicleId
    ? `vehicleId=${vehicleId}`
    : listingId
      ? `listingId=${listingId}`
      : `partId=${partId}`;

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?${targetParam}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [targetParam]);

  useEffect(() => {
    if (expanded) fetchComments();
  }, [expanded, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          listingId,
          partId,
          text: newText.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setTotal((t) => t + 1);
        setNewText("");
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
        setTotal((t) => t - 1);
      }
    } catch {
      // silently fail
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer bg-transparent border-none font-medium"
      >
        {total > 0 ? `Zobrazit komentáře (${total})` : "Přidat komentář"}
      </button>
    );
  }

  return (
    <div className="space-y-3 mt-3 pt-3 border-t border-gray-100">
      {/* Comment list */}
      {loading ? (
        <div className="text-sm text-gray-400">Načítám...</div>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs overflow-hidden">
              {comment.user.avatar ? (
                <img src={comment.user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-500">
                  {comment.user.firstName?.[0]}{comment.user.lastName?.[0]}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                {comment.user.slug ? (
                  <Link
                    href={`/profil/${comment.user.slug}`}
                    className="text-sm font-semibold text-gray-900 no-underline hover:text-orange-500"
                  >
                    {comment.user.firstName} {comment.user.lastName}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-gray-900">
                    {comment.user.firstName} {comment.user.lastName}
                  </span>
                )}
                <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 mt-0.5 break-words">{comment.text}</p>
            </div>
            {session?.user && (
              session.user.id === comment.userId ||
              ["ADMIN", "BACKOFFICE"].includes(session.user.role) ||
              (itemOwnerId && session.user.id === itemOwnerId)
            ) && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="text-xs text-gray-400 hover:text-red-500 cursor-pointer bg-transparent border-none flex-shrink-0 self-start mt-0.5"
                title="Smazat"
              >
                &#10005;
              </button>
            )}
          </div>
        ))
      )}

      {/* New comment form */}
      {session?.user ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Napište komentář..."
            maxLength={500}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
          />
          <button
            type="submit"
            disabled={submitting || !newText.trim()}
            className="text-sm font-semibold text-orange-500 hover:text-orange-600 disabled:text-gray-300 cursor-pointer bg-transparent border-none"
          >
            Odeslat
          </button>
        </form>
      ) : (
        <p className="text-xs text-gray-400">
          <Link href="/prihlaseni" className="text-orange-500 no-underline">Přihlaste se</Link> pro přidání komentáře.
        </p>
      )}

      <button
        onClick={() => setExpanded(false)}
        className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none"
      >
        Skrýt komentáře
      </button>
    </div>
  );
}
