# TASK-043: Blog/Magazín — Implementační plán

**Stav:** PLAN_READY
**Priorita:** 2
**Datum:** 2026-04-25
**Autor:** Plánovač

---

## §1 Souhrn

Blog/Magazín sekce na `carmakler.cz/blog` s AI-asistovaným workflow, redakčním systémem v admin panelu, a možností pro makléře psát články přes PWA dashboard. 7 kategorií, SEO-optimalizovaná struktura, JSON-LD Article schema.

---

## §2 Analýza codebase — existující vzory

| Vzor | Příklad v codebase | Použijeme pro blog |
|------|--------------------|--------------------|
| Prisma modely | `model Tag`, `model Listing` (schema.prisma) | Article, ArticleCategory, ArticleTag |
| API CRUD pattern | `app/api/listings/[id]/route.ts` — Zod validace, getServerSession, NextResponse | api/blog/* routes |
| Admin page pattern | `app/(admin)/admin/inzerce/page.tsx` → `ListingsPageContent` (client component) | admin/blog pages |
| Web detail pattern | `app/(web)/nabidka/[slug]/page.tsx` — generateMetadata, ISR, prisma query | blog/[slug]/page.tsx |
| SEO — canonical | `lib/canonical.ts` → `pageCanonical("/path")` | Každá blog stránka |
| SEO — sitemap | `app/sitemap.ts` — statické + dynamické stránky z DB | Blog entries do sitemapy |
| Claude API | `app/api/assistant/generate-description/route.ts` — Anthropic SDK, Zod, rate limit | ai-generate, ai-suggest-topics |
| Cloudinary upload | `lib/cloudinary.ts` + `components/ui/ImageUpload.tsx` | Cover image upload |
| Middleware auth | `middleware.ts` — role-based guards pro `/admin/*`, `/makler/*` | Blog admin = ADMIN_ROLES |
| Admin sidebar | `components/admin/AdminSidebar.tsx` — navSections array | Přidat blog sekci |
| PWA dashboard | `app/(pwa)/makler/dashboard/page.tsx` — Server Component, session check | Makléř blog editor |

### Klíčová zjištění:
- **Blog directory neexistuje** — `app/(web)/blog/` je prázdný, tvoříme od nuly
- **Tag model existuje** (`model Tag` v schema.prisma) — ale je M2M s User, NE s articles. Pro blog potřebujeme nový `ArticleTag` M2M
- **Subdomain rewrite** neovlivní blog (běží na main doméně `carmakler.cz/blog`)
- **Schema má 2184 řádků** — nové modely přidáme na konec
- **Admin sidebar** má sekci "OBSAH" s Tagy — přidáme tam Blog

---

## §3 Prisma modely

### 3.1 `ArticleCategory` model
**Soubor:** `prisma/schema.prisma` (append na konec)

```prisma
// ============================================
// BLOG / MAGAZÍN
// ============================================

model ArticleCategory {
  id          String   @id @default(cuid())
  name        String   @unique    // "Novinky z autosvěta"
  slug        String   @unique    // "novinky-z-autsveta"
  description String?             // Popis kategorie pro SEO
  icon        String?             // Emoji/ikona
  order       Int      @default(0) // Řazení v menu

  articles    Article[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
}
```

### 3.2 `Article` model

```prisma
model Article {
  id             String   @id @default(cuid())
  title          String
  slug           String   @unique
  content        String   // Rich text (HTML) — uloženo jako string
  excerpt        String?  // Krátký popis pro listing karty (max ~200 znaků)
  coverImage     String?  // Cloudinary URL

  // Kategorie
  categoryId     String
  category       ArticleCategory @relation(fields: [categoryId], references: [id])

  // Autor
  authorId       String
  author         User     @relation("AuthorArticles", fields: [authorId], references: [id])

  // Status workflow: DRAFT → REVIEW → PUBLISHED → ARCHIVED
  status         String   @default("DRAFT") // DRAFT, REVIEW, PUBLISHED, ARCHIVED
  source         String   @default("MANUAL") // MANUAL, AI_GENERATED, BROKER

  // SEO
  seoTitle       String?  // Pokud null, použije se title
  seoDescription String?  // Pokud null, použije se excerpt

  // Metriky
  readTime       Int      @default(5) // Odhadovaný čas čtení v minutách
  views          Int      @default(0)

  // Publikace
  publishedAt    DateTime?
  featuredUntil  DateTime?  // Pokud set a > now(), článek je featured

  // Relace
  tags           ArticleTag[] @relation("ArticleTags")

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([status])
  @@index([categoryId])
  @@index([authorId])
  @@index([publishedAt])
  @@index([slug])
}
```

### 3.3 `ArticleTag` model (M2M join)

```prisma
model ArticleTag {
  id        String  @id @default(cuid())
  name      String
  slug      String  @unique

  articles  Article[] @relation("ArticleTags")

  createdAt DateTime @default(now())

  @@index([slug])
}
```

### 3.4 User relace — přidat do `model User`

```prisma
// Blog/Magazín relace
articles        Article[]        @relation("AuthorArticles")
```

**Umístění:** Do bloku User relations, za existující `profileBadges` řádek (~řádek 155).

---

## §4 Seed data — Kategorie

**Soubor:** `prisma/seed.ts` (přidat do existujícího seedu)

7 kategorií dle zadání:

| # | name | slug | icon |
|---|------|------|------|
| 1 | Novinky z autosvěta | novinky-z-autosveta | 📰 |
| 2 | Rady a tipy | rady-a-tipy | 💡 |
| 3 | Recenze vozů | recenze-vozu | ⭐ |
| 4 | Tržní analýzy | trzni-analyzy | 📊 |
| 5 | Carmakler novinky | carmakler-novinky | 🚀 |
| 6 | Dovozy aut z Dubaje | dovozy-z-dubaje | 🇦🇪 |
| 7 | Dovozy aut z USA | dovozy-z-usa | 🇺🇸 |

---

## §5 API Routes

### 5.1 `app/api/blog/articles/route.ts` — GET (list) + POST (create)

**GET /api/blog/articles**
- Query params: `?category=slug&page=1&limit=10&status=PUBLISHED&search=text`
- Veřejný endpoint (pro PUBLISHED), auth-gated pro DRAFT/REVIEW/ARCHIVED
- Vrací: `{ articles, total, page, totalPages }`
- Include: author (firstName, lastName, avatar, slug), category (name, slug), tags

**POST /api/blog/articles**
- Auth: ADMIN, BACKOFFICE, BROKER
- Zod validace: title, content, categoryId, excerpt?, coverImage?, seoTitle?, seoDescription?, tags[]
- BROKER → status = "REVIEW" (auto-submit ke schválení)
- ADMIN/BACKOFFICE → status = "DRAFT" (mohou sami publikovat)
- Slug auto-generování z title (slugify + unique check)
- readTime = Math.ceil(content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200)

### 5.2 `app/api/blog/articles/[id]/route.ts` — GET + PUT + DELETE

**GET** — detail článku (public pro PUBLISHED, auth pro ostatní)
**PUT** — editace (ADMIN/BACKOFFICE + autor-BROKER pro vlastní DRAFT/REVIEW)
**DELETE** — smazání (pouze ADMIN)

### 5.3 `app/api/blog/publish/route.ts` — POST

- Auth: ADMIN, BACKOFFICE
- Body: `{ articleId, action: "publish" | "unpublish" | "archive" }`
- publish: status → PUBLISHED, publishedAt = now()
- unpublish: status → DRAFT, publishedAt = null
- archive: status → ARCHIVED

### 5.4 `app/api/blog/ai-generate/route.ts` — POST

- Auth: ADMIN, BACKOFFICE
- Body: `{ topic, categorySlug, keywords?: string[], tone?: string }`
- Claude API (Anthropic SDK, stejný pattern jako `generate-description`)
- System prompt: "Jsi expert na psaní článků o automobilech v češtině..."
- Vrací: `{ title, content, excerpt, seoTitle, seoDescription, suggestedTags }`
- Článek se NEULOŽÍ — vrátí se jako draft data pro editor
- Rate limit: max 10 generací/hodinu per user

### 5.5 `app/api/blog/ai-suggest-topics/route.ts` — POST

- Auth: ADMIN, BACKOFFICE
- Body: `{ categorySlug?, count?: number }`
- Claude API — navrhne 5 témat na základě kategorie
- Vrací: `{ topics: [{ title, description, keywords }] }`
- Rate limit: max 5 návrhů/hodinu per user

---

## §6 Web stránky (veřejné)

### 6.1 `app/(web)/blog/page.tsx` — Seznam článků

**Server Component s ISR** (`revalidate = 300` — 5 min)

Layout:
- Hero sekce s featured článkem (article.featuredUntil > now())
- Grid 3-sloupcový s kartami (cover image, title, excerpt, autor, datum, kategorie badge)
- Sidebar: kategorie (links), populární články (top 5 by views)
- Pagination (cursor-based nebo offset)
- Filtry: kategorie tabs nahoře

**Metadata:**
```ts
export const metadata: Metadata = {
  title: "Blog | CarMakléř — Novinky z autosvěta, rady, recenze",
  description: "Čtěte o novinkách z autosvěta, radách pro koupi ojetiny, recenzích vozů a tržních analýzách. Blog od odborníků CarMakléř.",
  alternates: pageCanonical("/blog"),
};
```

### 6.2 `app/(web)/blog/[slug]/page.tsx` — Detail článku

**Server Component s ISR** (`revalidate = 600`)

Layout:
- Cover image (full width, Cloudinary optimized)
- Title (h1), autor karta (avatar, jméno, bio, link na profil), datum, readTime, kategorie badge
- Content (max-w-prose, Tailwind typography plugin `prose`)
- Share buttons: Facebook, X (Twitter), LinkedIn, Copy Link
- Related articles dole (same category, max 3)
- Tags jako links

**Metadata (generateMetadata):**
```ts
export async function generateMetadata({ params }) {
  const article = await getArticle(slug);
  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    alternates: pageCanonical(`/blog/${slug}`),
    openGraph: { ... },
  };
}
```

**JSON-LD:**
```ts
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: article.title,
  image: article.coverImage,
  datePublished: article.publishedAt,
  dateModified: article.updatedAt,
  author: { "@type": "Person", name: `${author.firstName} ${author.lastName}` },
  publisher: { "@type": "Organization", name: "CarMakléř" },
};
```

### 6.3 `app/(web)/blog/kategorie/[slug]/page.tsx` — Články dle kategorie

**Server Component** — filtrovaný seznam článků pro danou kategorii.
- Stejný layout jako hlavní blog, ale filtrováno
- generateMetadata s názvem kategorie
- Breadcrumb: Blog > {Kategorie}

### 6.4 Pomocné soubory:
- `app/(web)/blog/layout.tsx` — wrapper (může být minimální, sdílí web layout)
- `app/(web)/blog/loading.tsx` — skeleton loader
- `app/(web)/blog/[slug]/loading.tsx` — skeleton loader pro detail

---

## §7 Admin stránky

### 7.1 `app/(admin)/admin/blog/page.tsx` — Správa článků

**Client component:** `components/admin/BlogPageContent.tsx`

- DataTable se seznamem všech článků (title, category, status badge, author, views, date)
- Tabs: Všechny | Drafty | Review | Publikované | Archivované
- Akce: Editovat, Publikovat/Odpublikovat, Archivovat, Smazat
- Search bar
- Filter dle kategorie

### 7.2 `app/(admin)/admin/blog/[id]/edit/page.tsx` — Editor článku

**Client component:** `components/admin/BlogEditorContent.tsx`

- Title input
- Category select (ze seedovaných kategorií)
- WYSIWYG editor pro content (doporučeno: `react-quill-new` nebo `@tiptap/react` — TipTap je lepší volba, moderní, extensible)
- Cover image upload (ImageUpload component — existující)
- Excerpt textarea
- SEO fields: seoTitle, seoDescription (collapsible panel)
- Tags input (multi-select/chip input)
- Status display + action buttons (Uložit draft, Odeslat ke schválení, Publikovat)
- Preview mode (toggle)

### 7.3 `app/(admin)/admin/blog/ai-drafts/page.tsx` — AI generátor

**Client component:** `components/admin/AiDraftsContent.tsx`

- Formulář: Téma (text input), Kategorie (select), Klíčová slova (chip input), Tón (select: profesionální/přátelský/odborný)
- Tlačítko "Vygenerovat" → volá `/api/blog/ai-generate`
- Preview vygenerovaného článku
- Tlačítko "Uložit jako draft" → volá POST `/api/blog/articles`
- Sekce "Navrhni témata" → volá `/api/blog/ai-suggest-topics`
- Seznam navržených témat s tlačítkem "Generovat článek" u každého

### 7.4 Admin Sidebar update

**Soubor:** `components/admin/AdminSidebar.tsx`

Přidat do sekce "OBSAH":
```ts
{ id: "blog", href: "/admin/blog", icon: "📝", label: "Blog" },
{ id: "ai-drafts", href: "/admin/blog/ai-drafts", icon: "🤖", label: "AI Drafty" },
```

---

## §8 PWA — Makléř blog

### 8.1 `app/(pwa)/makler/blog/page.tsx` — Moje články

**Server Component** — seznam článků aktuálního makléře

- Karta: title, status badge, datum, views
- Tlačítko "Napsat článek"
- Filter: Drafty | Ve review | Publikované

### 8.2 `app/(pwa)/makler/blog/new/page.tsx` — Nový článek

**Client component** (simplified editor oproti admin):

- Title input
- Category select
- Zjednodušený editor (Textarea nebo basic rich text)
- Cover image upload
- Excerpt
- Submit → status = "REVIEW" (makléř nemůže sám publikovat)

### 8.3 `app/(pwa)/makler/blog/[id]/edit/page.tsx` — Editace vlastního článku

- Pouze pro statusy DRAFT a REVIEW (PUBLISHED pouze čtení)

---

## §9 Komponenty

### 9.1 Nové sdílené komponenty:

| Komponenta | Cesta | Popis |
|-----------|-------|-------|
| `ArticleCard` | `components/web/ArticleCard.tsx` | Card s cover image, title, excerpt, autor, datum, kategorie badge |
| `ArticleGrid` | `components/web/ArticleGrid.tsx` | Responsive grid (1/2/3 col) ArticleCard |
| `ShareButtons` | `components/web/ShareButtons.tsx` | FB, X, LinkedIn, Copy link (client component) |
| `AuthorCard` | `components/web/AuthorCard.tsx` | Avatar, jméno, bio, link na profil makléře |
| `BlogSidebar` | `components/web/BlogSidebar.tsx` | Kategorie links + populární články |
| `BlogPageContent` | `components/admin/BlogPageContent.tsx` | Admin tabulka článků |
| `BlogEditorContent` | `components/admin/BlogEditorContent.tsx` | WYSIWYG editor |
| `AiDraftsContent` | `components/admin/AiDraftsContent.tsx` | AI generátor UI |
| `RichTextEditor` | `components/ui/RichTextEditor.tsx` | Wrapper nad TipTap (reusable) |

### 9.2 Existující komponenty k reuse:

| Komponenta | Už existuje | Použití |
|-----------|-------------|---------|
| `ImageUpload` | `components/ui/ImageUpload.tsx` | Cover image upload |
| `Badge` | `components/ui/Badge.tsx` | Status badges, kategorie |
| `Card` | `components/ui/Card.tsx` | Wrapper pro karty |
| `Button` | `components/ui/Button.tsx` | CTA, akce |
| `DataTable` | `components/admin/DataTable.tsx` | Admin tabulka |
| `Tabs` | `components/ui/Tabs.tsx` | Filtry |
| `Input` | `components/ui/Input.tsx` | Form fields |
| `Select` | `components/ui/Select.tsx` | Category select |
| `Textarea` | `components/ui/Textarea.tsx` | Excerpt, bio |
| `Pagination` | `components/ui/Pagination.tsx` | Blog listing |

---

## §10 SEO integrace

### 10.1 Sitemap — `app/sitemap.ts`

Přidat sekci (za existující dynamické stránky):

```ts
// Dynamické stránky — blog články
let blogPages: MetadataRoute.Sitemap = [];
try {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });
  blogPages = articles.map((a) => ({
    url: `${BASE_URL}/blog/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
} catch { /* DB nedostupná */ }

// Blog kategorie (statické)
const blogCategoryPages: MetadataRoute.Sitemap = [
  "novinky-z-autosveta", "rady-a-tipy", "recenze-vozu",
  "trzni-analyzy", "carmakler-novinky", "dovozy-z-dubaje", "dovozy-z-usa"
].map((slug) => ({
  url: `${BASE_URL}/blog/kategorie/${slug}`,
  lastModified: new Date(),
  changeFrequency: "weekly" as const,
  priority: 0.6,
}));
```

A přidat do return array: `...blogPages, ...blogCategoryPages`

### 10.2 Static page — přidat blog do staticPages:

```ts
{
  url: `${BASE_URL}/blog`,
  lastModified: new Date(),
  changeFrequency: "daily",
  priority: 0.8,
},
```

### 10.3 Navbar — přidat link "Blog" do hlavní navigace

**Soubor:** `components/main/Navbar.tsx` — přidat odkaz na `/blog`

---

## §11 Závislosti (npm packages)

| Package | Účel | Poznámka |
|---------|------|----------|
| `@tiptap/react` | WYSIWYG editor | Core editor framework |
| `@tiptap/starter-kit` | Základní extensions (bold, italic, headings, lists...) | Bundle |
| `@tiptap/extension-image` | Vkládání obrázků do editoru | |
| `@tiptap/extension-link` | Hyperlinky | |
| `@tiptap/extension-placeholder` | Placeholder text | |

**Alternativa:** Pokud je TipTap příliš těžký, lze použít `react-quill-new` (jednodušší, menší bundle). Rozhodnutí na implementátorovi.

---

## §12 Implementační kroky — pořadí

### Fáze 1: DB + API (základ)
| # | Krok | Soubory | Závislost |
|---|------|---------|-----------|
| 1 | Přidat Prisma modely | `prisma/schema.prisma` | — |
| 2 | Přidat User relaci `articles` | `prisma/schema.prisma` (model User) | 1 |
| 3 | Spustit `npx prisma migrate dev --name add-blog-models` | — | 1+2 |
| 4 | Seed kategorie | `prisma/seed.ts` | 3 |
| 5 | API: blog/articles CRUD | `app/api/blog/articles/route.ts`, `app/api/blog/articles/[id]/route.ts` | 3 |
| 6 | API: blog/publish | `app/api/blog/publish/route.ts` | 5 |
| 7 | Pomocné lib: `lib/blog.ts` (slugify, readTime calc, article queries) | `lib/blog.ts` | 3 |

### Fáze 2: Veřejný web
| # | Krok | Soubory | Závislost |
|---|------|---------|-----------|
| 8 | ArticleCard + ArticleGrid komponenty | `components/web/ArticleCard.tsx`, `components/web/ArticleGrid.tsx` | 7 |
| 9 | Blog listing page | `app/(web)/blog/page.tsx`, `app/(web)/blog/loading.tsx` | 8 |
| 10 | Blog detail page + JSON-LD | `app/(web)/blog/[slug]/page.tsx`, `app/(web)/blog/[slug]/loading.tsx` | 8 |
| 11 | ShareButtons + AuthorCard | `components/web/ShareButtons.tsx`, `components/web/AuthorCard.tsx` | 10 |
| 12 | Kategorie page | `app/(web)/blog/kategorie/[slug]/page.tsx` | 8 |
| 13 | BlogSidebar (kategorie + populární) | `components/web/BlogSidebar.tsx` | 9 |

### Fáze 3: Admin panel
| # | Krok | Soubory | Závislost |
|---|------|---------|-----------|
| 14 | Install TipTap packages | package.json | — |
| 15 | RichTextEditor component | `components/ui/RichTextEditor.tsx` | 14 |
| 16 | BlogPageContent (admin tabulka) | `components/admin/BlogPageContent.tsx` | 5 |
| 17 | Admin blog list page | `app/(admin)/admin/blog/page.tsx` | 16 |
| 18 | BlogEditorContent (editor) | `components/admin/BlogEditorContent.tsx` | 15 |
| 19 | Admin blog edit page | `app/(admin)/admin/blog/[id]/edit/page.tsx` | 18 |
| 20 | Admin sidebar update | `components/admin/AdminSidebar.tsx` | 17 |

### Fáze 4: AI integrace
| # | Krok | Soubory | Závislost |
|---|------|---------|-----------|
| 21 | API: ai-generate | `app/api/blog/ai-generate/route.ts` | 5 |
| 22 | API: ai-suggest-topics | `app/api/blog/ai-suggest-topics/route.ts` | — |
| 23 | AiDraftsContent component | `components/admin/AiDraftsContent.tsx` | 21+22 |
| 24 | Admin AI drafts page | `app/(admin)/admin/blog/ai-drafts/page.tsx` | 23 |

### Fáze 5: PWA makléř
| # | Krok | Soubory | Závislost |
|---|------|---------|-----------|
| 25 | Makléř blog list page | `app/(pwa)/makler/blog/page.tsx` | 5 |
| 26 | Makléř blog new/edit | `app/(pwa)/makler/blog/new/page.tsx`, `app/(pwa)/makler/blog/[id]/edit/page.tsx` | 15+25 |

### Fáze 6: SEO + finalizace
| # | Krok | Soubory | Závislost |
|---|------|---------|-----------|
| 27 | Sitemap update | `app/sitemap.ts` | 5 |
| 28 | Navbar link "Blog" | `components/main/Navbar.tsx` | 9 |
| 29 | Seed AI drafts pro 7 kategorií | `prisma/seed.ts` (nebo manual via admin) | 21 |

---

## §13 STOP pravidla (eskalace na leada)

- **STOP-1:** Prisma migrate selhání (tsvector drift) → `migrate reset --force` na dev, eskaluj pokud produkce
- **STOP-2:** TipTap bundle size > 200kB gzipped → zvážit react-quill-new alternativu
- **STOP-3:** AI generate vrací nekonzistentní HTML → přidat sanitizaci (DOMPurify server-side)
- **STOP-4:** ImageUpload preset "blog" neexistuje → přidat do `/api/upload/route.ts` nový preset

---

## §14 Acceptance Criteria

1. ✅ `carmakler.cz/blog` zobrazuje grid článků s cover image, title, excerpt, autorem
2. ✅ `carmakler.cz/blog/[slug]` zobrazuje detail článku s JSON-LD Article schema
3. ✅ `carmakler.cz/blog/kategorie/[slug]` filtruje články dle kategorie
4. ✅ Admin panel: CRUD článků, status workflow (Draft→Review→Published→Archived)
5. ✅ Admin panel: WYSIWYG editor s cover image uploadem
6. ✅ Admin panel: AI generátor draftů + AI návrhy témat
7. ✅ Makléř PWA: může napsat článek → jde do review → admin schválí
8. ✅ 7 kategorií seedováno v DB
9. ✅ Sitemap obsahuje blog stránky
10. ✅ Canonical URL na každé blog stránce
11. ✅ Share buttons (FB, X, LinkedIn, Copy link) na detailu článku
12. ✅ Blog link v hlavní navigaci

---

## §15 Odhad rozsahu

- **Nové soubory:** ~25
- **Editované soubory:** ~5 (schema.prisma, seed.ts, sitemap.ts, AdminSidebar.tsx, Navbar.tsx)
- **Nové Prisma modely:** 3 (Article, ArticleCategory, ArticleTag)
- **Nové API routes:** 5
- **Nové npm packages:** ~5 (TipTap ecosystem)

---

## §16 Kompletní seznam souborů

### Nové soubory:
```
# API
app/api/blog/articles/route.ts
app/api/blog/articles/[id]/route.ts
app/api/blog/publish/route.ts
app/api/blog/ai-generate/route.ts
app/api/blog/ai-suggest-topics/route.ts

# Lib
lib/blog.ts

# Web pages
app/(web)/blog/page.tsx
app/(web)/blog/layout.tsx
app/(web)/blog/loading.tsx
app/(web)/blog/[slug]/page.tsx
app/(web)/blog/[slug]/loading.tsx
app/(web)/blog/kategorie/[slug]/page.tsx

# Admin pages
app/(admin)/admin/blog/page.tsx
app/(admin)/admin/blog/[id]/edit/page.tsx
app/(admin)/admin/blog/ai-drafts/page.tsx

# PWA pages
app/(pwa)/makler/blog/page.tsx
app/(pwa)/makler/blog/new/page.tsx
app/(pwa)/makler/blog/[id]/edit/page.tsx

# Components — web
components/web/ArticleCard.tsx
components/web/ArticleGrid.tsx
components/web/ShareButtons.tsx
components/web/AuthorCard.tsx
components/web/BlogSidebar.tsx

# Components — admin
components/admin/BlogPageContent.tsx
components/admin/BlogEditorContent.tsx
components/admin/AiDraftsContent.tsx

# Components — UI (shared)
components/ui/RichTextEditor.tsx
```

### Editované soubory:
```
prisma/schema.prisma          # +3 modely + User relace
prisma/seed.ts                # +7 kategorií
app/sitemap.ts                # +blog pages
components/admin/AdminSidebar.tsx  # +blog nav items
components/main/Navbar.tsx    # +blog link
```
