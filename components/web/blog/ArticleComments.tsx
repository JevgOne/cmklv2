"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface CommentAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

interface Comment {
  id: string;
  text: string;
  isHidden: boolean;
  createdAt: string;
  author: CommentAuthor | null;
  authorName: string | null;
}

interface ArticleCommentsProps {
  articleId: string;
  initialComments: Comment[];
  total: number;
  isLoggedIn: boolean;
  userName?: string;
  userEmail?: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "právě teď";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("cs-CZ");
}

export function ArticleComments({
  articleId,
  initialComments,
  total: initialTotal,
  isLoggedIn,
  userName,
  userEmail,
}: ArticleCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [total, setTotal] = useState(initialTotal);
  const [text, setText] = useState("");
  const [authorName, setGuestName] = useState("");
  const [authorEmail, setGuestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.length < 5) return;
    if (!isLoggedIn && (!authorName.trim() || !authorEmail.trim())) return;

    setSubmitting(true);
    setMessage("");

    try {
      const payload: Record<string, string> = { text };
      if (!isLoggedIn) {
        payload.authorName = authorName.trim();
        payload.authorEmail = authorEmail.trim();
      }
      // Honeypot field
      const form = e.target as HTMLFormElement;
      const honeypot = (form.elements.namedItem("website") as HTMLInputElement)?.value;
      if (honeypot) payload.website = honeypot;

      const res = await fetch(`/api/blog/articles/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setText("");
        if (!isLoggedIn) {
          setGuestName("");
          setGuestEmail("");
        }
        setMessage(data.message || "Komentář odeslán ke schválení.");
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(data.error || "Nepodařilo se odeslat komentář.");
      }
    } catch {
      setMessage("Chyba sítě. Zkuste to znovu.");
    } finally {
      setSubmitting(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/blog/articles/${articleId}/comments?page=${page + 1}`
      );
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, ...data.comments]);
        setTotal(data.total);
        setPage((p) => p + 1);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="mt-8 mb-12">
      <h2 className="text-xl font-bold mb-6">
        Komentáře {total > 0 && <span className="text-gray-400 font-normal">({total})</span>}
      </h2>

      {/* Comment form — available for everyone */}
      <form onSubmit={handleSubmit} className="mb-8">
        {!isLoggedIn && (
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Vaše jméno *"
              required
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300"
              maxLength={100}
            />
            <input
              type="email"
              value={authorEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="Váš email *"
              required
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300"
              maxLength={200}
            />
          </div>
        )}
        {/* Honeypot — hidden from humans, visible to bots */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isLoggedIn && userName ? `${userName}, napište komentář...` : "Napište komentář..."}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300"
          rows={3}
          maxLength={1000}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{text.length}/1000</span>
            {!isLoggedIn && (
              <span className="text-xs text-gray-400">Email nebude zveřejněn</span>
            )}
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={submitting || text.length < 5 || (!isLoggedIn && (!authorName.trim() || !authorEmail.trim()))}
          >
            {submitting ? "Odesílám..." : "Odeslat komentář"}
          </Button>
        </div>
        {message && (
          <p className="text-sm text-orange-600 mt-2">{message}</p>
        )}
      </form>

      {/* Comments list */}
      <div className="space-y-6">
        {comments.map((comment) => {
          const displayName = comment.author
            ? `${comment.author.firstName} ${comment.author.lastName}`
            : comment.authorName || "Anonymní";
          const initials = comment.author
            ? `${comment.author.firstName[0] || ""}${comment.author.lastName[0] || ""}`
            : (comment.authorName || "A")[0]?.toUpperCase() || "A";

          return (
            <div key={comment.id} className="flex gap-3">
              {comment.author?.avatar ? (
                <Image
                  src={comment.author.avatar}
                  alt=""
                  width={36}
                  height={36}
                  className="rounded-full shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{displayName}</span>
                  <span className="text-xs text-gray-400">
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {comments.length < total && (
        <div className="text-center mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Načítám..." : `Načíst další komentáře (${total - comments.length})`}
          </Button>
        </div>
      )}

      {comments.length === 0 && total === 0 && (
        <p className="text-gray-400 text-sm text-center py-4">
          Zatím žádné komentáře. Buďte první!
        </p>
      )}
    </section>
  );
}
