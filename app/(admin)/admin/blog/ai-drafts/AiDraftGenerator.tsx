"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface GeneratedDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  readTime: number;
}

export function AiDraftGenerator({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);
  const [error, setError] = useState("");

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setError("");
    setDraft(null);

    try {
      const res = await fetch("/api/blog/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          categoryName: selectedCategory?.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chyba při generování");
      }

      const data = await res.json();
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznámá chyba");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/blog/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          categoryId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chyba při ukládání");
      }

      const data = await res.json();
      router.push(`/admin/blog/${data.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznámá chyba");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500";

  return (
    <div className="max-w-4xl">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Input form */}
      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Téma článku *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="např. Jak ušetřit při nákupu ojetiny z Německa"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kategorie
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
          >
            {generating ? "Generuji článek..." : "Vygenerovat návrh"}
          </Button>
        </div>
      </Card>

      {/* Generated draft preview */}
      {draft && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Vygenerovaný návrh</h2>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Ukládám..." : "Uložit jako koncept"}
              </Button>
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Zahodit
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">
                Titulek
              </span>
              <p className="font-bold text-lg">{draft.title}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">
                Slug
              </span>
              <p className="text-sm text-gray-500">/blog/{draft.slug}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">
                Excerpt
              </span>
              <p className="text-sm text-gray-600">{draft.excerpt}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">
                Čas čtení
              </span>
              <p className="text-sm text-gray-500">{draft.readTime} min</p>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">
                Obsah
              </span>
              <div
                className="prose prose-sm max-w-none mt-2 p-4 bg-gray-50 rounded-xl"
                dangerouslySetInnerHTML={{ __html: draft.content }}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
