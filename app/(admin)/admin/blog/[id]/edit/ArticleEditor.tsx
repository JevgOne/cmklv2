"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  categoryId: string;
  seoTitle: string;
  seoDescription: string;
  readTime: number;
  status: string;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ArticleEditor({
  article,
  categories,
}: {
  article: ArticleData | null;
  categories: Category[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(article?.title || "");
  const [slug, setSlug] = useState(article?.slug || "");
  const [content, setContent] = useState(article?.content || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [coverImage, setCoverImage] = useState(article?.coverImage || "");
  const [categoryId, setCategoryId] = useState(article?.categoryId || categories[0]?.id || "");
  const [seoTitle, setSeoTitle] = useState(article?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(article?.seoDescription || "");
  const [readTime, setReadTime] = useState(article?.readTime || 5);
  const [autoSlug, setAutoSlug] = useState(!article);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (autoSlug) {
      setSlug(slugify(value));
    }
  };

  const handleSave = async (status: string = "DRAFT") => {
    setSaving(true);
    setError("");

    try {
      const body = {
        title,
        slug,
        content,
        excerpt: excerpt || undefined,
        coverImage: coverImage || undefined,
        categoryId,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        readTime,
        ...(article ? { status } : {}),
      };

      const url = article
        ? `/api/blog/articles/${article.id}`
        : "/api/blog/articles";
      const method = article ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chyba při ukládání");
      }

      const data = await res.json();
      if (!article) {
        router.push(`/admin/blog/${data.id}/edit`);
      } else {
        router.refresh();
      }
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

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Titulek *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Název článku"
            className={inputClass}
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            URL slug *
          </label>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-400">/blog/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setAutoSlug(false);
              }}
              placeholder="url-slug"
              className={inputClass}
            />
          </div>
        </div>

        {/* Category + Read time */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kategorie *
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Čas čtení (min)
            </label>
            <input
              type="number"
              value={readTime}
              onChange={(e) => setReadTime(parseInt(e.target.value) || 5)}
              min={1}
              max={60}
              className={inputClass}
            />
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Úvodní text (excerpt)
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="Krátký popis článku pro náhled..."
            className={inputClass}
          />
        </div>

        {/* Cover image */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Obrázek (URL)
          </label>
          <input
            type="text"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://res.cloudinary.com/..."
            className={inputClass}
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Obsah (HTML) *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            placeholder="<h2>Nadpis</h2><p>Text článku...</p>"
            className={`${inputClass} font-mono text-xs`}
          />
        </div>

        {/* SEO */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="font-semibold text-gray-700 mb-4">SEO nastavení</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                SEO titulek
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Titulek pro vyhledávače (max 60 znaků)"
                maxLength={70}
                className={inputClass}
              />
              <span className="text-xs text-gray-400 mt-1 block">
                {seoTitle.length}/60
              </span>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                SEO popis
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={2}
                placeholder="Meta description pro vyhledávače (max 155 znaků)"
                maxLength={160}
                className={inputClass}
              />
              <span className="text-xs text-gray-400 mt-1 block">
                {seoDescription.length}/155
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <Button onClick={() => handleSave("DRAFT")} disabled={saving}>
            {saving ? "Ukládám..." : article ? "Uložit" : "Vytvořit koncept"}
          </Button>
          {article && article.status !== "PUBLISHED" && (
            <Button
              variant="outline"
              onClick={() => handleSave("REVIEW")}
              disabled={saving}
            >
              Odeslat ke schválení
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/blog")}
            disabled={saving}
          >
            Zpět
          </Button>
        </div>
      </div>
    </div>
  );
}
