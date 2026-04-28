"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Review {
  id: string;
  authorName: string;
  authorCity: string | null;
  text: string;
  rating: number;
  type: string;
  isPublished: boolean;
  isFeatured: boolean;
  source: string | null;
  createdAt: string;
}

const EMPTY_FORM = {
  authorName: "",
  authorCity: "",
  text: "",
  rating: 5,
  type: "GENERAL",
  isPublished: false,
  isFeatured: false,
  source: "manual",
};

const TYPE_LABELS: Record<string, string> = {
  GENERAL: "Obecná",
  SELLER: "Prodejce",
  BUYER: "Kupující",
};

function Stars({ count }: { count: number }) {
  return (
    <span className="text-orange-400">
      {"★".repeat(count)}
      {"☆".repeat(5 - count)}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reviews");
      if (res.ok) setReviews(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  function startAdd() {
    setEditing("new");
    setForm(EMPTY_FORM);
    setError("");
  }

  function startEdit(r: Review) {
    setEditing(r.id);
    setForm({
      authorName: r.authorName,
      authorCity: r.authorCity || "",
      text: r.text,
      rating: r.rating,
      type: r.type,
      isPublished: r.isPublished,
      isFeatured: r.isFeatured,
      source: r.source || "manual",
    });
    setError("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, authorCity: form.authorCity || null, source: form.source || null };
      const url = editing === "new" ? "/api/admin/reviews" : `/api/admin/reviews/${editing}`;
      const method = editing === "new" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Chyba při ukládání");
        return;
      }
      setEditing(null);
      fetchReviews();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, field: "isPublished" | "isFeatured", value: boolean) {
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    fetchReviews();
  }

  async function handleDelete(id: string) {
    if (!confirm("Opravdu smazat tuto recenzi?")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    fetchReviews();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-extrabold text-gray-900">Recenze</h1>
          <p className="text-sm text-gray-500 mt-1">
            {reviews.filter((r) => r.isPublished).length} publikovaných z {reviews.length} celkem
          </p>
        </div>
        <Button variant="primary" onClick={startAdd}>
          + Přidat recenzi
        </Button>
      </div>

      {/* Edit / Add form */}
      {editing && (
        <Card className="p-6 mb-6 border-2 border-orange-200">
          <h2 className="font-bold text-lg text-gray-900 mb-4">
            {editing === "new" ? "Nová recenze" : "Upravit recenzi"}
          </h2>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jméno autora *</label>
              <input
                type="text"
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Jan Novák"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Město</label>
              <input
                type="text"
                value={form.authorCity}
                onChange={(e) => setForm({ ...form, authorCity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Praha"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Text recenze *</label>
              <textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hodnocení</label>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{"★".repeat(n)} ({n})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="GENERAL">Obecná</option>
                <option value="SELLER">Prodejce</option>
                <option value="BUYER">Kupující</option>
              </select>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Publikovat</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Zvýrazněná (homepage)</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Ukládám..." : "Uložit"}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>Zrušit</Button>
          </div>
        </Card>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">⭐</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Žádné recenze</h3>
          <p className="text-sm text-gray-500">Přidejte první recenzi kliknutím na tlačítko výše.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className={`p-4 ${!r.isPublished ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Stars count={r.rating} />
                    <span className="font-bold text-gray-900 text-sm">{r.authorName}</span>
                    {r.authorCity && <span className="text-sm text-gray-500">{r.authorCity}</span>}
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[r.type] || r.type}
                    </span>
                    {r.isFeatured && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Homepage</span>
                    )}
                    {!r.isPublished && (
                      <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Skrytá</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.text}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(r.id, "isPublished", !r.isPublished)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      r.isPublished
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {r.isPublished ? "Publikováno" : "Publikovat"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(r.id, "isFeatured", !r.isFeatured)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      r.isFeatured
                        ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {r.isFeatured ? "Featured" : "Feature"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(r)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    Upravit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Smazat
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
