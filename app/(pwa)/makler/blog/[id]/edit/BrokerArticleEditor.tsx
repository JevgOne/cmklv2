"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface ArticleData {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  categoryId: string;
  status: string;
  tagIds: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function BrokerArticleEditor({
  article,
  categories,
  tags,
}: {
  article: ArticleData | null;
  categories: Category[];
  tags: Tag[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState(article?.title || "");
  const [content, setContent] = useState(article?.content || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [coverImage, setCoverImage] = useState(article?.coverImage || "");
  const [categoryId, setCategoryId] = useState(article?.categoryId || categories[0]?.id || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(article?.tagIds || []);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : prev.length < 5
          ? [...prev, tagId]
          : prev
    );
  };

  const handleSave = async (sendToReview: boolean = false) => {
    if (!title.trim()) {
      setError("Zadejte titulek článku");
      return;
    }
    if (!content.trim()) {
      setError("Napište obsah článku");
      return;
    }
    if (!categoryId) {
      setError("Vyberte kategorii");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const slug = slugify(title);
      const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(1, Math.round(wordCount / 200));

      const body = {
        title,
        slug,
        content,
        excerpt: excerpt || undefined,
        coverImage: coverImage || undefined,
        categoryId,
        readTime,
        tagIds: selectedTags,
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

      if (sendToReview && data.id) {
        await fetch(`/api/blog/articles/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "REVIEW" }),
        });
        setSuccess("Článek odeslán ke schválení!");
        setTimeout(() => router.push("/makler/blog"), 1500);
        return;
      }

      if (!article) {
        router.push(`/makler/blog/${data.id}/edit`);
      } else {
        setSuccess("Uloženo!");
        setTimeout(() => setSuccess(""), 2000);
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

  const isPublished = article?.status === "PUBLISHED";
  const isReview = article?.status === "REVIEW";

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">{success}</div>
      )}

      {isReview && (
        <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-xl text-sm">
          Článek čeká na schválení redakcí. Po schválení bude publikován.
        </div>
      )}
      {isPublished && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">
          Článek je publikován na webu.
        </div>
      )}

      {/* Cover Image */}
      <ImageUpload
        value={coverImage || null}
        onChange={(url) => setCoverImage(url || "")}
        preset="cover"
        shape="rect"
        aspectRatio="16/9"
        label="Titulní obrázek"
        hint="Doporučený rozměr: 1200×675 px"
      />

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Titulek *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Název článku"
          maxLength={200}
          className={inputClass}
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Kategorie *</label>
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

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Krátký popis</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          placeholder="1-2 věty, co čtenář najde v článku..."
          maxLength={500}
          className={inputClass}
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Obsah článku *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          placeholder={"Pište svůj článek zde...\n\nTip: Pište přirozeně, redakce článek před publikací zformátuje."}
          className={`${inputClass} leading-relaxed`}
        />
        <p className="text-xs text-gray-400 mt-1">
          {content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length} slov · ~{Math.max(1, Math.round(content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length / 200))} min čtení
        </p>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tagy (max 5)
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selected
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="px-5 py-2.5 bg-gray-200 text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          {saving ? "Ukládám..." : "Uložit koncept"}
        </button>
        {!isPublished && !isReview && (
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            Odeslat ke schválení
          </button>
        )}
        <button
          onClick={() => router.push("/makler/blog")}
          disabled={saving}
          className="px-5 py-2.5 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
        >
          Zpět
        </button>
      </div>
    </div>
  );
}
