"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: { name: string; slug: string; icon: string | null };
  author: { firstName: string; lastName: string };
  views: number;
  publishedAt: string | null;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const statusConfig: Record<
  string,
  { label: string; variant: "new" | "pending" | "verified" | "default" | "rejected" }
> = {
  DRAFT: { label: "Koncept", variant: "default" },
  REVIEW: { label: "Ke schválení", variant: "pending" },
  PUBLISHED: { label: "Publikováno", variant: "verified" },
  ARCHIVED: { label: "Archivováno", variant: "rejected" },
};

export function BlogArticlesTable({
  articles,
}: {
  articles: Article[];
  categories: Category[];
}) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered =
    statusFilter === "ALL"
      ? articles
      : articles.filter((a) => a.status === statusFilter);

  const handlePublish = async (id: string) => {
    if (!confirm("Opravdu publikovat tento článek?")) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/blog/articles/${id}/publish`, {
        method: "POST",
      });
      if (res.ok) window.location.reload();
      else alert("Chyba při publikování");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu smazat tento článek? Tuto akci nelze vrátit.")) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/blog/articles/${id}`, { method: "DELETE" });
      if (res.ok) window.location.reload();
      else alert("Chyba při mazání");
    } finally {
      setLoading(null);
    }
  };

  const handleArchive = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/blog/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (res.ok) window.location.reload();
      else alert("Chyba při archivaci");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {[
          { key: "ALL", label: "Vše" },
          { key: "DRAFT", label: "Koncepty" },
          { key: "REVIEW", label: "Ke schválení" },
          { key: "PUBLISHED", label: "Publikováno" },
          { key: "ARCHIVED", label: "Archiv" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.key
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left p-4 font-semibold text-gray-600">
                  Článek
                </th>
                <th className="text-left p-4 font-semibold text-gray-600">
                  Kategorie
                </th>
                <th className="text-left p-4 font-semibold text-gray-600">
                  Autor
                </th>
                <th className="text-left p-4 font-semibold text-gray-600">
                  Stav
                </th>
                <th className="text-right p-4 font-semibold text-gray-600">
                  Zobrazení
                </th>
                <th className="text-left p-4 font-semibold text-gray-600">
                  Datum
                </th>
                <th className="text-right p-4 font-semibold text-gray-600">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((article) => {
                const config = statusConfig[article.status] || statusConfig.DRAFT;
                return (
                  <tr
                    key={article.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <Link
                        href={`/admin/blog/${article.id}/edit`}
                        className="font-medium text-gray-900 hover:text-orange-500 no-underline"
                      >
                        {article.title}
                      </Link>
                    </td>
                    <td className="p-4 text-gray-500">
                      {article.category.icon} {article.category.name}
                    </td>
                    <td className="p-4 text-gray-500">
                      {article.author.firstName} {article.author.lastName}
                    </td>
                    <td className="p-4">
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </td>
                    <td className="p-4 text-right text-gray-500">
                      {article.views.toLocaleString("cs-CZ")}
                    </td>
                    <td className="p-4 text-gray-500 whitespace-nowrap">
                      {new Date(
                        article.publishedAt || article.createdAt
                      ).toLocaleDateString("cs-CZ")}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/blog/${article.id}/edit`}
                          className="px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 no-underline"
                        >
                          Upravit
                        </Link>
                        {article.status !== "PUBLISHED" && (
                          <button
                            onClick={() => handlePublish(article.id)}
                            disabled={loading === article.id}
                            className="px-3 py-1 text-xs rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                          >
                            Publikovat
                          </button>
                        )}
                        {article.status === "PUBLISHED" && (
                          <button
                            onClick={() => handleArchive(article.id)}
                            disabled={loading === article.id}
                            className="px-3 py-1 text-xs rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50"
                          >
                            Archivovat
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(article.id)}
                          disabled={loading === article.id}
                          className="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
                          Smazat
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    Žádné články k zobrazení.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
