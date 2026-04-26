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
  author: CommentAuthor;
}

interface ArticleCommentsProps {
  articleId: string;
  initialComments: Comment[];
  total: number;
  isLoggedIn: boolean;
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
}: ArticleCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [total, setTotal] = useState(initialTotal);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.length < 5) return;

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/blog/articles/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (res.ok) {
        setText("");
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

      {/* Comment form */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Napište komentář..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300"
            rows={3}
            maxLength={1000}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{text.length}/1000</span>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || text.length < 5}
            >
              {submitting ? "Odesílám..." : "Odeslat komentář"}
            </Button>
          </div>
          {message && (
            <p className="text-sm text-orange-600 mt-2">{message}</p>
          )}
        </form>
      ) : (
        <div className="bg-gray-50 rounded-xl p-6 text-center mb-8">
          <p className="text-gray-500 text-sm">
            Pro komentování se{" "}
            <a href="/prihlaseni" className="text-orange-500 font-medium hover:underline">
              přihlaste
            </a>
            .
          </p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            {comment.author.avatar ? (
              <Image
                src={comment.author.avatar}
                alt=""
                width={36}
                height={36}
                className="rounded-full shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0">
                {comment.author.firstName[0]}
                {comment.author.lastName[0]}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {comment.author.firstName} {comment.author.lastName}
                </span>
                <span className="text-xs text-gray-400">
                  {timeAgo(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
            </div>
          </div>
        ))}
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
