# Implementace — Makléřský blog editor v PWA

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Zdroj:** Task #29 — team lead  
**Status:** ČEKÁ NA IMPLEMENTACI

---

## Analýza existujícího stavu

### Co existuje:
- **Article model** — `prisma/schema.prisma:2309` — title, slug, content, excerpt, coverImage, categoryId, authorId, status (DRAFT/REVIEW/PUBLISHED/ARCHIVED), readTime, seoTitle, seoDescription, tags
- **API POST /api/blog/articles** — `app/api/blog/articles/route.ts:66` — BROKER role povolena (řádek 74: `["ADMIN", "BACKOFFICE", "BROKER"].includes(role)`)
- **API PATCH /api/blog/articles/[id]** — existuje pro editaci
- **ArticleEditor** — `app/(admin)/admin/blog/[id]/edit/ArticleEditor.tsx` — admin verze s plnými poli (SEO, slug, HTML editor)
- **ImageUpload** — `components/ui/ImageUpload.tsx` — sdílený upload widget s Cloudinary, preset "cover"
- **ArticleCategory** — model s name, slug, icon
- **ArticleTag + ArticleTagLink** — pro tagy článků

### Co chybí:
- `app/(pwa)/makler/blog/` — celý adresář neexistuje
- Zjednodušený editor pro makléře (bez SEO polí, bez HTML)

---

## FÁZE 1: Nová stránka — seznam článků makléře

### Soubor: `app/(pwa)/makler/blog/page.tsx` (NOVÝ)

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function BrokerBlogPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const articles = await prisma.article.findMany({
    where: { authorId: session.user.id },
    include: {
      category: { select: { name: true, icon: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusLabels: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Koncept", color: "bg-gray-100 text-gray-700" },
    REVIEW: { label: "Ke schválení", color: "bg-yellow-100 text-yellow-700" },
    PUBLISHED: { label: "Publikováno", color: "bg-green-100 text-green-700" },
    ARCHIVED: { label: "Archivováno", color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Moje články</h1>
        <Link
          href="/makler/blog/new"
          className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors"
        >
          + Nový článek
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-medium">Zatím nemáte žádné články</p>
          <p className="text-sm mt-1">Napište svůj první článek a sdílejte zkušenosti s ostatními</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const status = statusLabels[article.status] || statusLabels.DRAFT;
            return (
              <Link
                key={article.id}
                href={`/makler/blog/${article.id}/edit`}
                className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {article.title || "Bez názvu"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {article.category?.icon} {article.category?.name} · {new Date(article.createdAt).toLocaleDateString("cs-CZ")}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### Soubor: `app/(pwa)/makler/blog/loading.tsx` (NOVÝ)

```tsx
export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-6" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse mb-3" />
      ))}
    </div>
  );
}
```

---

## FÁZE 2: Zjednodušený editor

### Soubor: `app/(pwa)/makler/blog/[id]/edit/page.tsx` (NOVÝ)

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { BrokerArticleEditor } from "./BrokerArticleEditor";

export default async function BrokerEditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const isNew = id === "new";

  let article = null;
  if (!isNew) {
    article = await prisma.article.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
      },
    });
    if (!article) notFound();
    if (article.authorId !== session.user.id) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-red-600">
          Nemáte oprávnění upravovat tento článek.
        </div>
      );
    }
  }

  const categories = await prisma.articleCategory.findMany({
    orderBy: { name: "asc" },
  });

  const tags = await prisma.articleTag.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        {isNew ? "Nový článek" : "Upravit článek"}
      </h1>
      <BrokerArticleEditor
        article={article ? {
          id: article.id,
          title: article.title,
          content: article.content,
          excerpt: article.excerpt || "",
          coverImage: article.coverImage || "",
          categoryId: article.categoryId,
          status: article.status,
          tagIds: article.tags.map((t) => t.tagId),
        } : null}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
```

### Soubor: `app/(pwa)/makler/blog/[id]/edit/BrokerArticleEditor.tsx` (NOVÝ)

```tsx
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
      // Odhad čtení: ~200 slov/min, průměrné české slovo 5 znaků
      const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
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

      // Po uložení — odeslat ke schválení pokud požadováno
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

      {/* Content — plaintext/markdown, admin converts to HTML on publish */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Obsah článku *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          placeholder="Pište svůj článek zde...&#10;&#10;Tip: Pište přirozeně, redakce článek před publikací zformátuje."
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
```

### Soubor: `app/(pwa)/makler/blog/new/page.tsx` (NOVÝ)

Redirect na editor s id="new":

```tsx
import { redirect } from "next/navigation";

export default function NewArticlePage() {
  redirect("/makler/blog/new/edit");
}
```

### Soubor: `app/(pwa)/makler/blog/[id]/edit/loading.tsx` (NOVÝ)

```tsx
export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="space-y-5">
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
```

---

## FÁZE 3: Úprava API — podpora tagIds při vytváření

### Soubor: `app/api/blog/articles/route.ts` — ÚPRAVA

Na **řádku 7** přidat `tagIds` do createSchema:

```typescript
// Stávající řádek 16:
  readTime: z.number().int().positive().optional(),
// PŘIDAT ZA:
  tagIds: z.array(z.string()).max(5).optional(),
```

Na **řádku 89** rozšířit create:

```typescript
// NAHRADIT řádky 89-97:
    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        categoryId: data.categoryId,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        readTime: data.readTime,
        authorId: session.user.id,
        status: "DRAFT",
        ...(data.tagIds?.length ? {
          tags: {
            create: data.tagIds.map((tagId) => ({ tagId })),
          },
        } : {}),
      },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });
```

### Soubor: `app/api/blog/articles/[id]/route.ts` — ÚPRAVA

V PATCH handleru přidat podporu `tagIds`:

```typescript
// V updateSchema přidat:
  tagIds: z.array(z.string()).max(5).optional(),

// V prisma update přidat (pokud tagIds přítomno):
  if (data.tagIds !== undefined) {
    await prisma.articleTagLink.deleteMany({ where: { articleId: id } });
    if (data.tagIds.length > 0) {
      await prisma.articleTagLink.createMany({
        data: data.tagIds.map((tagId) => ({ articleId: id, tagId })),
      });
    }
  }
```

---

## FÁZE 4: Navigační odkaz v PWA sidebar

### Soubor: Hledat PWA sidebar/navigaci

Najít komponentu, která renderuje PWA makléř navigaci (pravděpodobně v layout nebo sidebar) a přidat odkaz:

```typescript
{ href: "/makler/blog", icon: "📝", label: "Blog" }
```

---

## Soubory k vytvoření (5):

| # | Soubor | Typ |
|---|--------|-----|
| 1 | `app/(pwa)/makler/blog/page.tsx` | Seznam článků makléře |
| 2 | `app/(pwa)/makler/blog/loading.tsx` | Loading skeleton |
| 3 | `app/(pwa)/makler/blog/[id]/edit/page.tsx` | Editor stránka (Server Component) |
| 4 | `app/(pwa)/makler/blog/[id]/edit/BrokerArticleEditor.tsx` | Editor formulář (Client Component) |
| 5 | `app/(pwa)/makler/blog/[id]/edit/loading.tsx` | Editor loading skeleton |

## Soubory k úpravě (2-3):

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `app/api/blog/articles/route.ts` | Přidat `tagIds` do createSchema + create |
| 2 | `app/api/blog/articles/[id]/route.ts` | Přidat `tagIds` do updateSchema + PATCH |
| 3 | PWA navigace/sidebar | Přidat odkaz na /makler/blog |

---

## STOP kritéria

1. `/makler/blog` zobrazí seznam článků aktuálního makléře
2. `/makler/blog/new/edit` otevře prázdný editor
3. Vyplnění title + content + kategorie + save → vytvoří DRAFT článek
4. "Odeslat ke schválení" → změní status na REVIEW
5. Admin v `/admin/blog` vidí článek se statusem REVIEW
6. Cover image upload přes ImageUpload funguje (Cloudinary)
7. Tagy se ukládají a zobrazují správně
8. Makléř nemůže editovat cizí články (403)
9. `npm run build` projde bez chyb

---

*Plán připraven: 2026-04-26*
