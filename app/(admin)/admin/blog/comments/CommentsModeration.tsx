"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Comment {
  id: string;
  text: string;
  isHidden: boolean;
  createdAt: string;
  author: { firstName: string; lastName: string; email: string; avatar: string | null };
  article: { title: string; slug: string };
}

export function CommentsModeration({ comments: initial }: { comments: Comment[] }) {
  const [comments, setComments] = useState(initial);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED">("ALL");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = comments.filter((c) => {
    if (filter === "PENDING") return c.isHidden;
    if (filter === "APPROVED") return !c.isHidden;
    return true;
  });

  const pendingCount = comments.filter((c) => c.isHidden).length;

  const handleModerate = async (commentId: string, isHidden: boolean) => {
    setLoading(commentId);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden }),
      });

      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, isHidden } : c))
        );
      }
    } catch {
      // Ignore
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Opravdu smazat komentář?")) return;
    setLoading(commentId);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {
      // Ignore
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["ALL", "PENDING", "APPROVED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "ALL" ? "Všechny" : f === "PENDING" ? `Ke schválení (${pendingCount})` : "Schválené"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-3 font-medium">Autor</th>
              <th className="pb-3 font-medium">Komentář</th>
              <th className="pb-3 font-medium">Článek</th>
              <th className="pb-3 font-medium">Datum</th>
              <th className="pb-3 font-medium">Stav</th>
              <th className="pb-3 font-medium">Akce</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="py-3 pr-3">
                  <div className="font-medium">{c.author.firstName} {c.author.lastName}</div>
                  <div className="text-xs text-gray-400">{c.author.email}</div>
                </td>
                <td className="py-3 pr-3 max-w-xs">
                  <p className="line-clamp-2">{c.text}</p>
                </td>
                <td className="py-3 pr-3">
                  <a
                    href={`/blog/${c.article.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:underline no-underline"
                  >
                    {c.article.title}
                  </a>
                </td>
                <td className="py-3 pr-3 whitespace-nowrap text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString("cs-CZ")}
                </td>
                <td className="py-3 pr-3">
                  <Badge variant={c.isHidden ? "pending" : "verified"}>
                    {c.isHidden ? "Čeká" : "Schváleno"}
                  </Badge>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    {c.isHidden ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleModerate(c.id, false)}
                        disabled={loading === c.id}
                      >
                        Schválit
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleModerate(c.id, true)}
                        disabled={loading === c.id}
                      >
                        Skrýt
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(c.id)}
                      disabled={loading === c.id}
                      className="text-red-500 hover:text-red-700"
                    >
                      Smazat
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-400 text-center py-8">Žádné komentáře k zobrazení.</p>
      )}
    </div>
  );
}
