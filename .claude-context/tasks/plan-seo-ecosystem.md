# SEO ekosystém + SEO centrum v admin panelu

**Task #4** | Plánovač | 2026-05-24
**Status:** HOTOVO
**Vstupy:** SEO audit (plan-seo-audit.md, 7.8/10), Konkurenční analýza (plan-seo-konkurence.md, 3-5letý náskok)

---

## §1 Executive Summary

Carmakler má **technicky pokročilou SEO infrastrukturu** (20+ JSON-LD generátorů, 25 OG image generátorů, centrální canonical systém, 100+ programatických LP), ale vše je **hardcoded v kódu** — žádné admin UI pro správu SEO. Tento plán navrhuje:

1. **SEO centrum v admin panelu** — centrální dashboard pro řízení metadata, OG, schema, sitemap
2. **Automatická SEO logika** — při přidání nového segmentu/entity se SEO generuje automaticky
3. **Retina OG generátor** — přepracovaný systém generování OG obrázků
4. **Řešení auditních nálezů** — sitemap index, canonical gaps, JSON-LD rozšíření
5. **GEO/AI SEO strategie** — systematický přístup k AI citovatelnosti

**Celkový effort: ~180h (22-23 pracovních dní)**

---

## §2 Současný stav SEO infrastruktury

### 2.1 Inventář SEO komponent

| Komponenta | Soubor(y) | Popis | Spravovatelné z admin? |
|------------|-----------|-------|----------------------|
| JSON-LD generátory (20+) | `lib/seo.ts` (740 řádků) | BreadcrumbList, Vehicle, Product, FAQPage, Article, HowTo, WebPage, Organization, WebSite, Person, JobPosting, LocalBusiness, AutoPartsStore, AggregateOffer, AggregateRating | ❌ Hardcoded |
| OG image generátory (25) | `app/(web)/**/opengraph-image.tsx` | Branded layout s OgLayout, per-type design | ❌ Hardcoded |
| OG image layout | `lib/og-image.tsx` (156 řádků) | OgLayout, getOutfitFonts, getLogoBase64, 1200x630 | ❌ Hardcoded |
| Canonical URLs | `lib/canonical.ts` (77 řádků) | `pageCanonical()` helper, query/hash strip, trailing slash | ❌ Hardcoded |
| SEO data (LP content) | `lib/seo-data.ts` | BrandData, BRANDS, TOP_MODELS, BODY_TYPES, PRICE_RANGES, CITIES, PARTS_* | ❌ Hardcoded |
| Cross-linking | `lib/seo-crosslinks.ts` (69 řádků) | Vehicle↔Parts bridge, SERVICE_CROSS_LINKS | ❌ Hardcoded |
| Sitemap | `app/sitemap.ts` (500 řádků) | Single file, static + dynamic (9 DB queries) | ❌ Hardcoded |
| Robots | `app/robots.ts` (46 řádků) | Disallow rules, AI crawler access | ❌ Hardcoded |
| Metadata (per-page) | 80+ `page.tsx` files | `generateMetadata()` nebo `export const metadata` | ❌ Hardcoded |

### 2.2 Existující DB modely pro SEO

| Model | Tabulka | SEO pole | Použití |
|-------|---------|----------|---------|
| `SeoContent` | `seo_content` | h1, metaTitle, metaDesc, introHtml, sectionsJson, faqJson, aiSnippetText, quickFacts | Programatické LP pro díly (brand/model/year/category) |
| `Article` | `article` | seoTitle, seoDescription | Blog články |

### 2.3 Co chybí

- **Žádné admin UI** pro správu jakýchkoli SEO dat
- **Žádný univerzální SEO model** — SeoContent je jen pro díly LP, Article má jen title+desc
- **Žádný monitoring** — neexistuje přehled SEO health (chybějící meta, broken canonical, schema validation)
- **Žádná automatizace** — přidání nové značky/modelu/města vyžaduje kódový zásah do `lib/seo-data.ts`
- **Žádný bulk edit** — úprava metadata pro 100+ LP vyžaduje editaci kódu
- **Žádný OG preview** — nelze vidět, jak bude OG obrázek vypadat před deployem

---

## §3 SEO centrum v admin panelu

### 3.1 Architektura

```
app/(admin)/admin/seo/
  page.tsx                     → SEO Dashboard (health score, alerts, quick stats)
  metadata/page.tsx            → Správa metadata (title, desc) pro všechny stránky
  metadata/[pageId]/page.tsx   → Detail/edit metadata pro konkrétní stránku
  og-preview/page.tsx          → OG Preview tool (URL → live preview)
  schema/page.tsx              → Schema.org přehled + validace
  sitemap/page.tsx             → Sitemap management (index, sub-sitemaps, exclude)
  landing-pages/page.tsx       → Programatické LP management
  landing-pages/[id]/page.tsx  → Edit LP (content, FAQ, AI snippet)
  crosslinks/page.tsx          → Cross-linking rules management
  redirects/page.tsx           → 301 redirect management
  robots/page.tsx              → Robots.txt editor (visual)
  reports/page.tsx             → SEO reporty (weekly digest, trend)
```

### 3.2 SEO Dashboard (`/admin/seo`)

**Hlavní metriky (cards):**

| Metrika | Zdroj | Popis |
|---------|-------|-------|
| SEO Health Score | Computed | Celkové skóre 0-100 (váha: meta 30%, canonical 20%, schema 20%, sitemap 15%, performance 15%) |
| Stránky bez meta | DB query | Počet indexovatelných stránek bez title/description |
| Stránky bez canonical | DB query | Počet indexovatelných stránek bez canonical URL |
| Schema pokrytí | DB query | % stránek s JSON-LD (cíl: 80%) |
| Sitemap URL count | Computed | Aktuální počet URL v sitemap (+ % z 50K limitu) |
| Broken OG images | Cron check | OG image URL vracející 4xx/5xx |

**Alerty:**
- 🔴 Kritické: Sitemap > 40K URL, stránka bez title, duplikátní canonical
- 🟡 Varování: Description > 160 znaků, chybí JSON-LD na nové stránce
- 🟢 OK: Vše v pořádku

**Quick actions:**
- "Generovat chybějící metadata" → AI bulk generation
- "Validovat všechny schema" → Google Rich Results Test API
- "Přegenerovat sitemap" → On-demand revalidation
- "Export SEO report" → CSV/PDF

### 3.3 Správa metadata (`/admin/seo/metadata`)

**Tabulka všech indexovatelných stránek:**

| Sloupec | Popis |
|---------|-------|
| URL | Cesta stránky (/nabidka, /blog/jak-vybrat-auto...) |
| Title | Current meta title (editable) |
| Description | Current meta description (editable) |
| Canonical | Canonical URL (auto/manual) |
| Schema types | JSON-LD typy přítomné na stránce |
| OG image | Thumbnail preview |
| Status | ✅ OK / ⚠️ Warning / ❌ Error |

**Filtrování:**
- Podle sekce: Nabídka, Díly, Blog, STK, Autoservisy, Služby...
- Podle stavu: Chybí meta, chybí canonical, chybí schema
- Podle typu: Statické, Dynamické (DB entity), Programatické LP

**Inline edit:**
- Title + description editovatelné přímo v tabulce (optimistic update)
- "AI Generate" button — Claude vygeneruje optimální title+desc na základě obsahu stránky

### 3.4 Programatické LP management (`/admin/seo/landing-pages`)

**Rozšíření existujícího `SeoContent` modelu:**

```prisma
model SeoContent {
  id          String   @id @default(cuid())
  
  // Identifikace stránky
  pageType    String   // "VEHICLE_BRAND", "VEHICLE_MODEL", "VEHICLE_CITY", 
                       // "VEHICLE_BODY", "VEHICLE_PRICE", "PARTS_BRAND",
                       // "PARTS_MODEL", "PARTS_MODEL_YEAR", "PARTS_CATEGORY",
                       // "STK_CITY", "AUTOSERVIS_CATEGORY", "CUSTOM"
  slug        String   // URL slug (e.g. "skoda", "praha", "suv")
  parentSlug  String?  // Parent slug for hierarchy (e.g. brand slug for model)
  year        Int?     // Year (for model+year pages)
  
  // SEO metadata
  h1            String
  metaTitle     String
  metaDesc      String
  canonical     String?  // Override canonical (null = auto-generated)
  noIndex       Boolean  @default(false)
  
  // Content
  introHtml     String   // Hero paragraph
  sectionsJson  String   // JSON: [{h2, html}]
  faqJson       String   // JSON: [{question, answer}]
  
  // AI/GEO SEO
  aiSnippetText String   // 2-3 sentence AI-optimized snippet
  quickFacts    String   // JSON: string[]
  
  // OG Image
  ogTitle       String?  // Custom OG title (null = use metaTitle)
  ogDescription String?  // Custom OG description (null = use metaDesc)
  ogImageUrl    String?  // Custom OG image URL (null = auto-generated)
  
  // Cross-links
  crossLinksJson String? // JSON: [{label, href}] — additional cross-links
  
  // Meta
  wordCount   Int
  status      String   @default("DRAFT") // DRAFT, PUBLISHED, ARCHIVED
  generatedBy String   @default("template")
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([pageType, slug, parentSlug, year])
  @@index([pageType])
  @@index([slug])
  @@index([status])
}
```

**Admin UI features:**
- Seznam všech LP s filtry (pageType, status, generatedBy)
- CRUD editor s live preview
- AI content generator: "Vygenerovat obsah pro Hyundai i30 v Brně" → Claude API
- Bulk actions: publish, archive, regenerate AI snippet
- Word count + readability score
- FAQ editor (drag-and-drop reorder)
- Cross-link suggestions (automaticky navržené na základě entity)

---

## §4 Univerzální SEO metadata model

### 4.1 Motivace

Aktuálně jsou metadata hardcoded v `page.tsx` souborech. Pro admin editovatelnost potřebujeme DB model, který ukládá **overrides** — pokud existuje záznam v DB, použije se; jinak se fallbackne na hardcoded metadata.

### 4.2 Model

```prisma
model SeoPageMeta {
  id          String   @id @default(cuid())
  
  // Identifikace stránky
  pagePath    String   @unique  // URL path, e.g. "/nabidka", "/blog", "/stk"
  pageType    String             // "STATIC", "DYNAMIC_LIST", "DYNAMIC_DETAIL", "LP"
  section     String             // "vehicles", "parts", "blog", "stk", "services"...
  
  // Metadata overrides (null = use code default)
  title       String?
  description String?
  
  // Canonical override
  canonical   String?
  noIndex     Boolean  @default(false)
  
  // OG overrides
  ogTitle     String?
  ogDescription String?
  ogImageUrl  String?  // Custom OG image (null = auto-generated)
  
  // Schema override
  schemaTypesJson String? // JSON: schema type names present ["BreadcrumbList", "FAQPage"]
  
  // Audit trail
  lastAuditedAt DateTime?
  auditStatus   String?  // "OK", "WARNING", "ERROR"
  auditNotes    String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([section])
  @@index([pageType])
  @@index([auditStatus])
}
```

### 4.3 Metadata resolution flow

```
1. Page renders → generateMetadata() called
2. Check SeoPageMeta for pagePath override
3. If override exists AND field is non-null → use override
4. Else → use hardcoded default (current behavior)
5. Merge: { ...hardcodedDefaults, ...dbOverrides }
```

**Helper function:**

```typescript
// lib/seo-meta.ts
export async function getPageMeta(
  pagePath: string,
  defaults: { title: string; description: string }
): Promise<Metadata> {
  const override = await prisma.seoPageMeta.findUnique({
    where: { pagePath },
  });
  
  return {
    title: override?.title ?? defaults.title,
    description: override?.description ?? defaults.description,
    alternates: pageCanonical(override?.canonical ?? pagePath),
    openGraph: {
      title: override?.ogTitle ?? override?.title ?? defaults.title,
      description: override?.ogDescription ?? override?.description ?? defaults.description,
    },
    ...(override?.noIndex && { robots: { index: false, follow: true } }),
  };
}
```

**Výhoda:** Zero-change deployment. Existující hardcoded metadata fungují beze změny. Admin overrides se aplikují pouze když existují v DB.

---

## §5 Automatická SEO logika

### 5.1 Trigger: Nová entita → automatický SEO setup

| Událost | Automatická akce |
|---------|-----------------|
| Nový Vehicle (status → ACTIVE) | ✅ Metadata z generateMetadata() (existuje). Sitemap auto-included (existuje). JSON-LD auto-generated (existuje). |
| Nový Article (status → PUBLISHED) | ✅ Metadata z seoTitle/seoDescription (existuje). Sitemap auto-included. |
| Nový Part (status → ACTIVE) | ✅ Product JSON-LD auto-generated (existuje). Sitemap auto-included. |
| Nový Partner (AUTOBAZAR, status → AKTIVNI_PARTNER) | ⚠️ Chybí AutoDealer JSON-LD. Sitemap auto-included. |
| Nový AutoServis (isPublished → true) | ✅ LocalBusiness JSON-LD (existuje). Sitemap auto-included. |
| **Nová značka do BRANDS** | ❌ Vyžaduje kódový zásah do seo-data.ts |
| **Nový model do TOP_MODELS** | ❌ Vyžaduje kódový zásah |
| **Nové město do CITIES** | ❌ Vyžaduje kódový zásah |
| **Nová díly kategorie** | ❌ Vyžaduje kódový zásah |

### 5.2 Řešení: Data-driven LP generátor

**Problém:** Přidání nové značky/modelu/města vyžaduje:
1. Editaci `lib/seo-data.ts` (hardcoded array)
2. Vytvoření nového `page.tsx` souboru (u individuálních brand LP)
3. Přidání do sitemap
4. Deploy

**Řešení:** Přesun z hardcoded arrays → DB-driven s fallback na kód.

```typescript
// lib/seo-data-db.ts — DB-first, code-fallback

export async function getBrands(): Promise<BrandData[]> {
  // 1. Načti z DB (SeoContent WHERE pageType = "VEHICLE_BRAND" AND status = "PUBLISHED")
  const dbBrands = await prisma.seoContent.findMany({
    where: { pageType: "VEHICLE_BRAND", status: "PUBLISHED" },
  });
  
  // 2. Merge s hardcoded BRANDS (code = fallback, DB = override)
  const merged = BRANDS.map(codeBrand => {
    const dbBrand = dbBrands.find(db => db.slug === codeBrand.slug);
    if (dbBrand) {
      return {
        ...codeBrand,
        description: dbBrand.introHtml || codeBrand.description,
        faqItems: dbBrand.faqJson ? JSON.parse(dbBrand.faqJson) : codeBrand.faqItems,
        aiSnippet: dbBrand.aiSnippetText || codeBrand.aiSnippet,
        quickFacts: dbBrand.quickFacts ? JSON.parse(dbBrand.quickFacts) : codeBrand.quickFacts,
      };
    }
    return codeBrand;
  });
  
  // 3. Přidej DB-only brands (nové, přidané přes admin)
  const codeSlugs = new Set(BRANDS.map(b => b.slug));
  const dbOnlyBrands = dbBrands
    .filter(db => !codeSlugs.has(db.slug))
    .map(db => dbToSrandData(db));
  
  return [...merged, ...dbOnlyBrands];
}
```

### 5.3 Admin workflow: Přidání nového segmentu

```
Admin klikne "Přidat značku" v /admin/seo/landing-pages
  ↓
Vyplní: slug "hyundai", name "Hyundai"
  ↓
Systém automaticky:
  1. Vytvoří SeoContent (pageType=VEHICLE_BRAND, slug=hyundai)
  2. AI generuje: metaTitle, metaDesc, introHtml, FAQ, aiSnippet, quickFacts
  3. Admin zkontroluje + edituje
  4. Publish → stránka živá na /nabidka/hyundai
  5. Sitemap automaticky zahrne (DB query)
  6. OG image automaticky generován (template-based)
  7. JSON-LD automaticky (WebPage, FAQPage, AggregateOffer, ItemList)
```

### 5.4 Dynamic catch-all route pro nové LP

Aktuální stav: Každá brand LP má svůj soubor (`nabidka/skoda/page.tsx`, `nabidka/bmw/page.tsx`...).

**Refaktor:** Vytvořit catch-all dynamic route pro DB-driven LP.

```
app/(web)/nabidka/[...segments]/page.tsx
  → /nabidka/hyundai          → brand LP (z DB)
  → /nabidka/hyundai/i30      → model LP (z DB)
  → /nabidka/praha            → city LP (z DB)
  → /nabidka/suv              → body type LP (z DB)
  → /nabidka/do-300000        → price LP (z DB)
  → /nabidka/{vehicle-slug}   → vehicle detail (existing)
```

**Rozlišení:** Lookup order:
1. Vehicle by slug → detail page
2. SeoContent by pageType + slug → LP page
3. Hardcoded BRANDS/CITIES/BODY_TYPES → existing LP (fallback)
4. → 404

**ISR:** `revalidate: 3600` (1h) pro LP, `revalidate: 600` (10min) pro vehicle detail.

---

## §6 OG generátor — Retina quality

### 6.1 Současný stav

- **25 OG image generátorů** v `opengraph-image.tsx` files
- **OgLayout** v `lib/og-image.tsx` — dark gradient, logo, Outfit font
- **1200x630** standard
- **Problémy:** Některé OG jsou rozmazané na retina displejích (2x), texty občas přetékají

### 6.2 Návrh: Vylepšený OG generátor

**6.2.1 Retina support:**

```typescript
// lib/og-image.tsx — updated
export const OG_SIZE = { width: 1200, height: 630 };
// Note: @vercel/og (ImageResponse) renders at 1x by default.
// For retina: render at 2400x1260, output at 1200x630.
// Alternative: Use higher quality fonts + ensure SVG icons.
```

Next.js `ImageResponse` (od `@vercel/og`) renderuje pomocí Satori, který generuje SVG→PNG. Kvalita závisí na:
- Font quality (TTF, ne WOFF2) — ✅ Carmakler už používá TTF
- Image quality (SVG kde možné) — ⚠️ Logo je PNG
- Text rendering — ✅ Satori renderuje ostře

**Doporučení:**
- Konvertovat logo na SVG pro ostřejší rendering
- Přidat `size: { width: 1200, height: 630 }` explicitně do každého generátoru
- Zajistit, že background images (vehicle photos) jsou minimálně 1200px wide

**6.2.2 Template system — typ-based OG:**

| Typ stránky | OG design | Elementy |
|-------------|-----------|----------|
| Homepage | Brand hero | Logo, tagline, gradient |
| Vehicle detail | Car photo | Foto jako bg (opacity 0.25), název, cena, rok, km |
| Vehicle list / LP | Brand showcase | Brand logo, "X vozidel od Y Kč", top modely |
| Part detail | Product card | Foto dílu, název, cena, stav (NEW/USED) |
| Blog article | Editorial | Cover image bg, headline, author, read time |
| Broker profile | Personal | Avatar, jméno, specialization, rating |
| STK / Autoservis | Local | Mapa pin, název, adresa, hodnocení |
| Service | Info | Icon, název služby, key benefit |
| Legal / Info | Minimal | Logo + title only |

**6.2.3 Admin OG Preview:**

```
/admin/seo/og-preview
  ↓
Input: URL (e.g. /nabidka/skoda)
  ↓
Live preview: Aktuální OG image + metadata
  ↓
Side-by-side: Facebook preview, Twitter preview, LinkedIn preview
  ↓
Edit: Custom OG title/description override → SeoPageMeta
```

### 6.3 Automatické OG pro nové entity

Při vytvoření nové entity se OG image generuje automaticky z template:

```typescript
// Existující pattern (zachovat):
// app/(web)/nabidka/[slug]/opengraph-image.tsx
// → Fetch vehicle data → render OgLayout s car photo

// Nový pattern pro DB-driven LP:
// app/(web)/nabidka/[...segments]/opengraph-image.tsx
// → Fetch SeoContent → render OgLayout s brand/city/bodytype template
```

---

## §7 Řešení nálezů z auditu

### 7.1 P0: Sitemap index

**Aktuální:** Single `app/sitemap.ts` (500 řádků, 9 DB queries, potenciálně 50K+ URL)

**Řešení:** Next.js `generateSitemaps()` API

```typescript
// app/sitemap.ts → app/sitemap/[id]/route.ts
// Nebo lépe: Next.js 15 native sitemap index

// app/sitemap.ts (index)
export async function generateSitemaps() {
  return [
    { id: "static" },
    { id: "vehicles" },
    { id: "listings" },
    { id: "parts" },
    { id: "brokers" },
    { id: "blog" },
    { id: "services" },
    { id: "partners" },
    { id: "landing-pages" },
  ];
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  switch (id) {
    case "static":
      return staticPages(); // 31 URL
    case "vehicles":
      return vehiclePages(); // Dynamic from DB
    case "listings":
      return listingPages(); // Dynamic from DB
    case "parts":
      return partPages(); // Dynamic from DB
    case "brokers":
      return brokerPages(); // Dynamic from DB
    case "blog":
      return blogPages(); // Dynamic from DB
    case "services":
      return servicePages(); // STK + Autoservisy from DB
    case "partners":
      return partnerPages(); // Vrakoviště + Autobazary from DB
    case "landing-pages":
      return landingPages(); // Brand/Model/City/BodyType/Price + Parts LP
    default:
      return [];
  }
}
```

**Výsledek:** `/sitemap.xml` → sitemap index odkazující na 9 sub-sitemaps.

**Admin UI (`/admin/seo/sitemap`):**
- Přehled sub-sitemaps s počtem URL
- Exclude/include specifické entity
- "Force revalidate" tlačítko
- URL total + % z 50K limitu per sub-sitemap

### 7.2 P1: Chybějící canonical

| Stránka | Fix |
|---------|-----|
| `/blog/kategorie/{slug}` | Přidat `pageCanonical(\`/blog/kategorie/${slug}\`)` do generateMetadata |
| `/stk/mesto/{city}` | Přidat `pageCanonical(\`/stk/mesto/${city}\`)` do generateMetadata |
| `/shop/produkt/{slug}` | Canonical na `/dily/${slug}` (kanonická verze) — **už existuje inline**, ale nepoužívá `pageCanonical()` |

### 7.3 P1: Chybějící JSON-LD

| Stránka | Schema typ | Implementace |
|---------|-----------|-------------|
| `/nabidka` (list) | ItemList + CollectionPage | `generateItemListJsonLd()` s top 10 vehicles |
| `/bazar/{slug}` | AutoDealer / LocalBusiness | Nový generátor `generateAutoDealerJsonLd()` v `lib/seo.ts` |
| `/stk/mesto/{city}` | ItemList + LocalBusiness[] | `generateItemListJsonLd()` + per-station LocalBusiness |
| `/blog` (list) | Blog + ItemList | `generateItemListJsonLd()` s posledních 10 článků |
| `/makleri` (list) | ItemList | `generateItemListJsonLd()` s aktivními makléři |
| `/dily` (katalog root) | ItemList | `generateItemListJsonLd()` s top kategoriemi |

### 7.4 P1: Filter URL handling

**Problém:** `/nabidka?brand=skoda&fuelType=DIESEL` generuje neomezený počet indexovatelných URL.

**Řešení:**

```typescript
// V generateMetadata() pro /nabidka/page.tsx:
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Object.keys(params).length > 0;
  
  return {
    title: hasFilters 
      ? `Filtrovaná nabídka vozidel | CarMakléř`
      : `Nabídka prověřených ojetých vozidel | CarMakléř`,
    // Canonical vždy na base URL (bez query params)
    alternates: pageCanonical("/nabidka"),
    // Filtrované stránky = noindex
    ...(hasFilters && { robots: { index: false, follow: true } }),
  };
}
```

### 7.5 P2: Sitemap lastModified fix

**Problém:** Statické stránky mají `lastModified: new Date()` → vždy aktuální timestamp.

**Řešení:** Hardcoded dates pro statické stránky, nebo git last-commit date.

```typescript
// Pro statické stránky:
const STATIC_LAST_MODIFIED = new Date("2026-05-01"); // Update při content change

// Pro dynamické stránky:
lastModified: entity.updatedAt // ✅ Už funguje správně
```

### 7.6 P2: Robots.txt doplnění

```typescript
disallow: [
  // Existing...
  "/moje-inzeraty/",     // ← přidat (user-specific)
  "/shop/moje-objednavky/", // ← přidat
  "/dily/moje-objednavky/", // ← přidat
  "/hledat",              // ← přidat (search results, already noindex)
],
```

---

## §8 Cross-linking systém

### 8.1 Rozšíření stávajícího systému

Aktuální `lib/seo-crosslinks.ts` má jen 2 bridge funkce (Vehicle↔Parts) + statické SERVICE_CROSS_LINKS.

**Nové bridge funkce:**

```typescript
// lib/seo-crosslinks.ts — rozšíření

/** Vehicle → STK stanice v regionu */
export function getVehicleToStkBridge(city?: string): CrossLink[] {
  if (!city) return [];
  return [
    { label: `STK stanice v ${city}`, href: `/stk/mesto/${citySlug(city)}` },
  ];
}

/** Vehicle → Autoservisy v regionu */
export function getVehicleToServisBridge(city?: string): CrossLink[] {
  if (!city) return [];
  return [
    { label: `Autoservisy v ${city}`, href: `/autoservisy?mesto=${citySlug(city)}` },
  ];
}

/** Autoservis → Nabídka aut v regionu */
export function getServisToVehicleBridge(city?: string): CrossLink[] {
  if (!city) return [];
  return [
    { label: `Ojetá auta v ${city}`, href: `/nabidka/${citySlug(city)}` },
  ];
}

/** Blog → Relevantní brand LP */
export function getBlogToBrandBridge(brands: string[]): CrossLink[] {
  return brands
    .filter(brand => BRANDS.some(b => b.name === brand))
    .map(brand => ({
      label: `Ojeté ${brand}`,
      href: `/nabidka/${brandSlug(brand)}`,
    }));
}

/** STK → Autoservisy ve stejném městě */
export function getStkToServisBridge(city?: string): CrossLink[] {
  if (!city) return [];
  return [
    { label: `Autoservisy v ${city}`, href: `/autoservisy?mesto=${citySlug(city)}` },
  ];
}
```

### 8.2 Admin cross-link management (`/admin/seo/crosslinks`)

**Pravidla cross-linkingu:**

| From | To | Podmínka | Status |
|------|----|----------|--------|
| Vehicle detail | Parts (brand) | Brand match | ✅ Existuje |
| Parts detail | Vehicle (brand) | Brand match | ✅ Existuje |
| Vehicle detail | Services | Vždy | ✅ Existuje |
| Vehicle detail | STK (city) | City match | ❌ Nové |
| Vehicle detail | Autoservis (city) | City match | ❌ Nové |
| Autoservis detail | Nabídka (city) | City match | ❌ Nové |
| STK detail | Autoservisy (city) | City match | ❌ Nové |
| Blog article | Brand LP | Brand mention | ❌ Nové |
| Blog article | Related articles | Tag match | ❌ Nové |
| Brand LP | Model LPs | Parent-child | ⚠️ Částečné |
| Brand LP | Parts brand LP | Brand match | ❌ Nové |

**Admin UI:** Tabulka pravidel (from pattern, to pattern, condition, enabled/disabled). Admin může zapnout/vypnout individuální pravidla.

---

## §9 GEO/AI SEO strategie

### 9.1 Současný stav (pokročilý)

Carmakler již implementuje:
- ✅ `aiSnippet` — 2-3 sentence AI-optimized snippet per brand
- ✅ `quickFacts` — konkrétní čísla pro AI citovatelnost
- ✅ `speakable` CSS selectors v WebPage JSON-LD
- ✅ `about` + `mentions` entity linking
- ✅ AI crawlers explicitně povoleny v robots.txt
- ✅ Geo meta tags (geo.region, geo.placename, geo.position, ICBM)

### 9.2 Rozšíření strategie

**9.2.1 Entity SEO — Organization enrichment:**

```typescript
// lib/seo.ts — rozšířit generateOrganizationJsonLd()
{
  "@type": "Organization",
  // ...existing...
  "sameAs": [
    "https://www.facebook.com/carmakler",
    "https://www.linkedin.com/company/carmakler",
    "https://www.instagram.com/carmakler",  // ← přidat
    "https://www.youtube.com/@carmakler",   // ← přidat
    // Wikipedia/Wikidata — až bude existovat
  ],
  "knowsAbout": [
    "ojetá vozidla", "prodej aut", "autodíly", 
    "technická kontrola", "autoservisy",
    "financování vozidel", "pojištění aut"
  ],
  "areaServed": {
    "@type": "Country",
    "name": "Česká republika"
  }
}
```

**9.2.2 AI-citovatelný obsah na všech LP:**

Rozšířit vzor `aiSnippet` + `quickFacts` z brand LP na:
- City LP (`/nabidka/praha`) — "V Praze je k dispozici X ojetých aut, průměrná cena..."
- Body type LP (`/nabidka/suv`) — "SUV tvoří X% českého trhu ojetin, nejprodávanější..."
- Parts category LP (`/dily/kategorie/motor`) — "Motor je nejdražší díl automobilu..."
- STK city LP (`/stk/mesto/praha`) — "V Praze je X STK stanic, průměrná čekací doba..."

**9.2.3 Speakable audit:**

Ověřit, že CSS selektory v `speakable` odpovídají reálným DOM elementům. Automatizovat:

```typescript
// lib/seo.ts — dynamické speakable selektory
speakableCssSelectors: [
  `[data-speakable="main"]`,    // Standardizovaný data atribut
  `[data-speakable="snippet"]`, // AI snippet
  `[data-speakable="facts"]`,   // Quick facts
],
```

Přidat `data-speakable` atributy do příslušných komponent.

**9.2.4 AI SEO monitoring:**

Admin dashboard sekce:
- AI Overview mentions tracking (manuální, zatím žádné API)
- AI crawler access logs (z server logů)
- AI-citable content coverage (% stránek s aiSnippet)
- Citation format quality score

### 9.3 Structured Data rozšíření pro AI

| Schema typ | Účel | Priorita |
|------------|------|----------|
| `sameAs` na Organization | Entity disambiguation pro Knowledge Graph | P1 |
| `knowsAbout` na Organization | Topical authority signál | P2 |
| `mainEntity` na LP WebPage | Explicitní entity linking (Brand → LP) | P2 |
| `isPartOf` na article/LP | Hierarchické propojení (model LP → brand LP) | P3 |
| `hasPart` na brand LP | Explicitní child listing (brand → models) | P3 |

---

## §10 301 Redirect management

### 10.1 Motivace

Aktuálně existuje jen diakritika redirect v middleware (`škoda` → `skoda`). Žádný systém pro:
- Přesměrování smazaných/archivovaných stránek
- URL migration (např. přejmenování `/shop` → `/dily-eshop`)
- Partner URL changes
- Vanity URLs

### 10.2 Model

```prisma
model SeoRedirect {
  id         String   @id @default(cuid())
  fromPath   String   @unique  // Source path (e.g. "/stary-url")
  toPath     String            // Destination path (e.g. "/novy-url")
  statusCode Int      @default(301) // 301 (permanent) nebo 302 (temporary)
  reason     String?           // "Rebranding", "URL cleanup", "Entity deleted"
  hits       Int      @default(0) // Counter pro analytics
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([fromPath])
  @@index([isActive])
}
```

### 10.3 Middleware integration

```typescript
// middleware.ts — přidat na začátek (před auth check)
const redirect = await getRedirect(pathname); // Redis-cached DB lookup
if (redirect) {
  return NextResponse.redirect(
    new URL(redirect.toPath, request.url),
    redirect.statusCode
  );
}
```

**Cache:** Redis cache s 1h TTL. Invalidace při CRUD v admin.

### 10.4 Admin UI (`/admin/seo/redirects`)

- Tabulka: fromPath → toPath, status code, hits, active
- Import CSV (bulk redirect migration)
- Chain detection: A → B → C varování (max 1 hop)
- Broken redirect detection: toPath returns 404

---

## §11 SEO reporty

### 11.1 Weekly SEO digest (CRON)

```
Každé pondělí 8:00:
  1. Spočítej SEO Health Score
  2. Porovnej s minulým týdnem (↑↓)
  3. Identifikuj nové problémy
  4. Email → ADMIN s reportem
```

**Report obsah:**
- SEO Health Score: 78/100 (↑3 od minulého týdne)
- Nové stránky bez meta: 2
- Nové 404 chyby: 0
- Sitemap URL count: 12,450 (25% z limitu)
- Top 5 nejnavštěvovanějších LP (z Plausible)
- Doporučení: "Přidejte canonical na 3 nové blog kategorie"

### 11.2 Admin report page (`/admin/seo/reports`)

- SEO score trend (line chart, 12 týdnů)
- Coverage heatmap: meta / canonical / schema / OG per sekce
- Sitemap growth trend
- LP performance (views, CTR pokud dostupné)

---

## §12 Implementační plán

### Fáze 1: Základ (Týden 1-2) — ~40h

| # | Úkol | Effort | Popis |
|---|------|--------|-------|
| 1 | Sitemap index | 6h | Refaktor `app/sitemap.ts` → `generateSitemaps()` + 9 sub-sitemaps |
| 2 | Chybějící canonical (P1) | 2h | `/blog/kategorie/[slug]`, `/stk/mesto/[city]` |
| 3 | Filter URL noindex | 2h | `/nabidka?...` → noindex + canonical na base |
| 4 | Robots.txt doplnění | 1h | Přidat chybějící disallow rules |
| 5 | SeoPageMeta model | 3h | Prisma model + migration + `getPageMeta()` helper |
| 6 | Chybějící JSON-LD (P1) | 8h | 6 nových schema na list/detail stránkách |
| 7 | lastModified fix | 2h | Statické stránky → hardcoded date |
| 8 | Organization enrichment | 2h | sameAs, knowsAbout, areaServed |
| 9 | Cross-link bridge funkce | 4h | 5 nových bridge functions + UI integration |
| 10 | OG image → SVG logo | 2h | Konverze logo PNG → SVG pro ostřejší OG |
| 11 | Nabídka title fix | 1h | Generický "Nabídka vozidel" → keyword-rich |

**Výstup Fáze 1:** Audit skóre 7.8 → 8.5/10. Všechny P0 a P1 nálezy vyřešeny.

### Fáze 2: SEO centrum MVP (Týden 3-5) — ~60h

| # | Úkol | Effort | Popis |
|---|------|--------|-------|
| 12 | Admin SEO dashboard | 12h | Health score, alerts, quick stats, cards |
| 13 | Metadata tabulka + inline edit | 10h | Seznam stránek, filtry, edit title/desc |
| 14 | OG preview tool | 6h | URL input → live OG + social previews |
| 15 | Schema validation view | 4h | Seznam stránek se schema typy, warnings |
| 16 | Sitemap management UI | 4h | Sub-sitemap přehled, URL counts, exclude |
| 17 | SeoRedirect model + middleware | 6h | DB model, middleware hook, Redis cache |
| 18 | Redirect management UI | 4h | CRUD + CSV import + chain detection |
| 19 | Robots editor (visual) | 3h | Checkbox-based rule editor |
| 20 | AI metadata generator | 8h | Claude API → bulk generate title/desc for pages |
| 21 | SEO cron + weekly digest | 3h | Health score computation + email report |

**Výstup Fáze 2:** Plně funkční SEO centrum v admin panelu.

### Fáze 3: LP automatizace (Týden 6-8) — ~50h

| # | Úkol | Effort | Popis |
|---|------|--------|-------|
| 22 | SeoContent model rozšíření | 4h | Nové pageTypes, OG fields, cross-links, status |
| 23 | LP management UI | 12h | CRUD, AI content gen, FAQ editor, live preview |
| 24 | DB-driven LP resolution | 8h | `getBrands()` DB-first, code-fallback |
| 25 | Dynamic catch-all route | 6h | `[...segments]/page.tsx` pro DB-driven LP |
| 26 | Auto OG for new LP | 4h | Template-based OG generator pro DB LP |
| 27 | AI content generator integration | 8h | Claude API → full LP content (intro, sections, FAQ, snippet) |
| 28 | LP sitemap auto-inclusion | 3h | DB-driven LP automaticky v sitemap-landing.xml |
| 29 | Cross-link admin UI | 5h | Rule management, enable/disable, preview |

**Výstup Fáze 3:** Nové LP přidatelné čistě z admin panelu bez kódu.

### Fáze 4: Pokročilé (Týden 9-10) — ~30h

| # | Úkol | Effort | Popis |
|---|------|--------|-------|
| 30 | SEO report page | 8h | Score trend, coverage heatmap, growth |
| 31 | AI SEO monitoring | 6h | AI-citable coverage, speakable audit |
| 32 | Speakable data attributes | 3h | `data-speakable` na komponentách |
| 33 | AI snippet na všech LP typech | 6h | City, body type, parts category, STK city |
| 34 | Image sitemap extension | 4h | Vehicle + parts photos v sitemap |
| 35 | Bulk metadata operations | 3h | Select multiple → regenerate / archive / publish |

**Výstup Fáze 4:** Kompletní SEO ekosystém, AI-ready.

---

## §13 STOP pravidla pro implementátora

```
STOP-1: Nikdy nemazej existující hardcoded SEO data (BRANDS, CITIES...) 
        — DB je override, kód je fallback. Oba musí fungovat.
STOP-2: Nikdy negeneruj metadata bez pageCanonical() — vždy explicit canonical.
STOP-3: Nikdy nepřidej stránku do sitemap bez ověření, že existuje a vrací 200.
STOP-4: Nikdy neuveřejňuj LP (SeoContent status=PUBLISHED) bez metaTitle a metaDesc.
STOP-5: Nikdy nepoužívej `lastModified: new Date()` na statických stránkách.
STOP-6: Nikdy nepovoluj indexování stránek s query parametry (filtrované URL → noindex).
STOP-7: Nikdy neduplikuj JSON-LD generátory — vždy použij existující z lib/seo.ts.
STOP-8: OG images musí být vždy 1200x630px. Nikdy jiný rozměr.
STOP-9: Cross-links musí být obousměrné (A→B implikuje B→A).
STOP-10: AI-generovaný SEO content musí projít admin review před publish.
```

---

## §14 Datový tok — celkový přehled

```
                    ┌──────────────────────────────────────┐
                    │         Admin SEO centrum            │
                    │  ┌──────────┐ ┌──────────────────┐   │
                    │  │Dashboard │ │ Metadata editor   │   │
                    │  │(health)  │ │ (title/desc/OG)   │   │
                    │  └──────────┘ └──────────────────┘   │
                    │  ┌──────────┐ ┌──────────────────┐   │
                    │  │LP mgmt   │ │ OG preview        │   │
                    │  │(content) │ │ (social cards)    │   │
                    │  └──────────┘ └──────────────────┘   │
                    │  ┌──────────┐ ┌──────────────────┐   │
                    │  │Redirects │ │ Cross-links       │   │
                    │  │(301s)    │ │ (bridge rules)    │   │
                    │  └──────────┘ └──────────────────┘   │
                    └──────────────┬───────────────────────┘
                                  │ CRUD
                    ┌─────────────▼───────────────────────┐
                    │           PostgreSQL                  │
                    │  SeoPageMeta · SeoContent · SeoRedirect │
                    └─────────────┬───────────────────────┘
                                  │ Query
                    ┌─────────────▼───────────────────────┐
                    │        Runtime SEO Layer             │
                    │  ┌─────────────┐  ┌───────────────┐ │
                    │  │getPageMeta()│  │getBrands()    │ │
                    │  │(DB→fallback)│  │(DB→code merge)│ │
                    │  └─────────────┘  └───────────────┘ │
                    │  ┌─────────────┐  ┌───────────────┐ │
                    │  │lib/seo.ts   │  │lib/canonical  │ │
                    │  │(JSON-LD gen)│  │(pageCanonical)│ │
                    │  └─────────────┘  └───────────────┘ │
                    │  ┌─────────────┐  ┌───────────────┐ │
                    │  │sitemap.ts   │  │robots.ts      │ │
                    │  │(index+subs) │  │(rules)        │ │
                    │  └─────────────┘  └───────────────┘ │
                    └─────────────┬───────────────────────┘
                                  │ Render
                    ┌─────────────▼───────────────────────┐
                    │         Next.js Pages                 │
                    │  generateMetadata() + JSON-LD script  │
                    │  opengraph-image.tsx (OgLayout)        │
                    │  Cross-link components                 │
                    └─────────────────────────────────────┘
```

---

## §15 Závěr

Tento plán transformuje Carmakler SEO z **hardcoded-in-code** na **admin-managed ekosystém** při zachování existující infrastruktury jako fallback. Klíčové principy:

1. **DB override, code fallback** — zero-risk deployment, postupná migrace
2. **AI-first content** — Claude generuje SEO content, admin schvaluje
3. **Automatizace** — nová entita = automatické metadata + sitemap + JSON-LD + OG
4. **Monitoring** — SEO health score, weekly digests, coverage tracking

**Effort:** ~180h (4 fáze po 2-3 týdnech)
**Závislosti:** Žádné blokující — Fáze 1 může začít okamžitě
**Rizika:** Fáze 3 (catch-all route) vyžaduje pečlivé testování — potenciální conflict se stávajícími individuálními LP stránkami

Po implementaci: SEO skóre **7.8 → 9.0/10**, plná admin kontrola, zero-code LP creation.
