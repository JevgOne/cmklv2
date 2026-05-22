# Plan #81 — SEO + GEO struktura pro /dily (Carmakler eshop)

**Datum:** 2026-04-06
**Agent:** planovac
**Task ID:** #79 (subject: #81)
**Související:** `research-task-81.md`
**Effort odhad:** 5-6 dnů dev (1 dev, ~40h)

---

## Executive summary (pro lead)

Plán implementuje **3-vrstvý SEO+GEO systém** pro `/dily` eshop:

1. **Vrstva A — URL hierarchie a routing.** Nová 3-level struktura `/dily/znacka/{brand}/{model}/{rok?}` (Carmakler nemá engine-level data jako Autodoc, takže 3 levels místo 4). Stávající `/dily/znacka/[slug]` se rozšíří na 3-segment dynamic route, zachová stávajících 8 brand stránek a přidá ~200 model+rok kombinací.

2. **Vrstva B — Content & schema pipeline.** Nový Prisma model `SeoContent` (cache long-form contentu), helper `lib/seo/generatePartsLanding.ts` (one-shot generování 1 500-2 800 slov per kombinace + 5-8 FAQ items), JSON-LD generators `Product`, `Offer`, `FAQPage`, `Organization`, `WebSite`. Content fixed for MVP (statická data v seed) + on-demand revalidace přes `revalidatePath()` po publikaci nového dílu.

3. **Vrstva C — GEO infrastruktura.** Nový endpoint `/llms.txt` jako Next.js route handler, nový `app/sitemap.ts` (rozšíření o brand×model×rok kombinace, sitemap index pokud >50k URLs), helper `lib/seo/aiSnippet.ts` pro Q&A formátování, manual benchmark queries dokumentované v `/docs/geo-benchmark.md`.

**Tech stack:** Next.js 15 ISR (`generateStaticParams` pre-build top 200 kombinací, `dynamicParams: true` pro fallback), webhook revalidation po DB writes, Prisma cached queries pro pricing aggregations.

**Effort:**
- **Fáze 1 (Foundation, 14h):** Prisma model `SeoContent`, lib helpers, JSON-LD generators
- **Fáze 2 (Templates + Content, 16h):** 3-segment dynamic route, page templates s 9 H2 sekcemi, FAQ generator, breadcrumb komponenta
- **Fáze 3 (GEO + Tooling, 10h):** llms.txt, sitemap rozšíření, on-demand revalidation API, dokumentace, monitoring

**Risk:** Content generation pipeline (Claude API) je nákladová položka — odhad pro 200 kombinací × 2 800 slov ≈ 100k tokenů × $15/M = ~$1.5 jednorázově, regenerace 1×/rok. **Žádné code breaking changes.**

---

# ČÁST C — URL STRUKTURA + PAGE TEMPLATES

## C1 — Cílová URL struktura (Carmakler 3-level hierarchie)

```
/dily                                      → root: kategorie + značky overview
/dily/kategorie/{slug}                     → kategorie landing (existuje ✅)
/dily/znacka/{brand}                       → brand landing (existuje ✅, rozšířit content)
/dily/znacka/{brand}/{model}               → model landing (NOVÉ)
/dily/znacka/{brand}/{model}/{rok}         → model+rok landing (NOVÉ, top 50 kombinací)
/dily/{slug}                               → detail dílu (existuje ✅, přidat schema)
/dily/vrakoviste/{slug}                    → store page per dodavatel (NOVÉ, fáze 2)
/dily/blog/{slug}                          → educational content (NOVÉ, fáze 2)
```

### C1.1 Proč 3-level místo Autodoc 4-level

**Autodoc:** `/{brand}/{model}/{generation-code}/{engine-id}` — mají engine-level data od OEM.

**Carmakler:** Vrakoviště zadávají díly přes PWA s minimální compatibility data (`compatibleBrands`, `compatibleModels`, `compatibleYearFrom/To`). Engine-level segmentace **není** v MVP datech dostupná. 

**Řešení:** 3-level (`brand/model/rok`) pokrývá 95% search intentu. Engine-level filter zůstane jako **query param** na model stránce (`?motor=2.0-tdi`) místo URL segmentu — žádné nové stránky pro generování, ale UX zachován.

**Až bude:** AI Part Scanner (#76) scanuje VIN/štítek a může automaticky doplnit engine kód → fáze 2 přidá `/dily/znacka/{brand}/{model}/{rok}/{motor}` jako 4. level.

### C1.2 URL konvence

| Pravidlo | Příklad | Důvod |
|---|---|---|
| Lowercase, kebab-case | `/dily/znacka/skoda/octavia/2015` | SEO standard |
| Diakritika OUT | `skoda` ne `škoda` | Encoding issues, backwards compat |
| Číslice rok jako last segment | `/2015` ne `/rok-2015` | Krátké, jasné |
| Singular slugs | `znacka` ne `znacky`, `kategorie` ne `kategorie-dilu` | Konzistence |
| 3 levels max v hierarchii | brand → model → rok | Ne engine (DB nemá data) |
| Query params pro filtry | `?kategorie=brzdy&cena=do-1000` | Zero new pages |

### C1.3 Page template per URL type

**Template 1: `/dily/znacka/{brand}` (brand landing — existuje, rozšířit)**

| Sekce | Obsah | Word count |
|---|---|---|
| H1 | "Náhradní díly {Brand}" | — |
| Hero | Brand intro + CTA "Hledat díly" | 80 |
| Models grid | 4-8 top models s linky | — |
| Categories grid | 11 kategorií (existuje) | — |
| H2: Top 15 dílů {Brand} | ItemList z DB query top sold | 200 |
| H2: Cenové rozpětí dílů {Brand} | Min/max/avg z PricingAggregate | 250 |
| H2: Použité vs nové díly {Brand} | Educational | 300 |
| H2: Kompatibilní modely | Cross-link na všechny modely brand | 200 |
| H2: FAQ {Brand} | 5-8 Q&A items (FAQPage schema) | 600 |
| H2: Vrakoviště s {Brand} díly | List dodavatelů (top 5) | 200 |
| H2: Související značky | Cross-link na ostatní brands | 100 |
| H2: Jak vybrat náhradní díl | Educational + interní links | 400 |
| H2: O CarMakler | Trust signals + Organization | 200 |
| **CELKEM** | | **~2 530 slov** |

**Template 2: `/dily/znacka/{brand}/{model}` (model landing — NOVÉ)**

| Sekce | Obsah | Word count |
|---|---|---|
| H1 | "Náhradní díly {Brand} {Model}" | — |
| Hero | Model intro + 3 quick stats | 100 |
| Years grid | Roky 2010-2024 jako tile clickable | — |
| H2: Top 15 dílů {Model} | ItemList JSON-LD, pagination link | 250 |
| H2: Cenové trendy {Model} | Min/max/avg per kategorie + chart placeholder | 300 |
| H2: Generace modelu {Model} | "1. gen 2004-2010, 2. gen 2010-2017..." | 350 |
| H2: Nejprodávanější díly {Model} | DB top sold | 200 |
| H2: Kompatibilita s motory {Model} | Engine list + interní filter links | 250 |
| H2: FAQ {Model} | 5-8 Q&A items (FAQPage schema) | 600 |
| H2: Vrakoviště s {Model} díly | List dodavatelů | 150 |
| H2: Související modely {Brand} | Cross-link | 100 |
| H2: Jak poznat originální díl | Educational | 400 |
| **CELKEM** | | **~2 700 slov** |

**Template 3: `/dily/znacka/{brand}/{model}/{rok}` (model+rok landing — NOVÉ, top 50 kombinací)**

| Sekce | Obsah | Word count |
|---|---|---|
| H1 | "Náhradní díly {Brand} {Model} {Rok}" | — |
| Hero | Rok-specific intro + variant info | 100 |
| H2: Dostupné díly {Model} {Rok} | DB items filtered, ItemList JSON-LD | 250 |
| H2: Specifikace {Model} {Rok} | Engines, body styles, generace pro daný rok | 300 |
| H2: Cenové rozpětí {Model} {Rok} | Min/max/avg | 200 |
| H2: Časté výměny dílů {Model} {Rok} | Top kategorie pro daný rok+model | 300 |
| H2: FAQ {Model} {Rok} | 5-8 Q&A items | 600 |
| H2: Vrakoviště nabízející {Model} {Rok} | List | 150 |
| H2: Sourozenci a kompatibilní modely | Cross-link (sdílené platformy MQB, atd.) | 200 |
| H2: Jak ověřit kompatibilitu | Educational | 300 |
| **CELKEM** | | **~2 400 slov** |

### C1.4 Title + Meta description formáty

| URL pattern | Title | Meta description |
|---|---|---|
| `/dily/znacka/{brand}` | `Náhradní díly {Brand} — od {minPrice} Kč | Carmakler` | `Použité a nové náhradní díly pro vozy {Brand}. {dílů} kusů na skladě, {dodavatelů} ověřených vrakovišť. Doručení do 5 dnů.` |
| `/dily/znacka/{brand}/{model}` | `Náhradní díly {Brand} {Model} | Carmakler — od {minPrice} Kč` | `Originální použité díly pro {Brand} {Model}. {dílů} kusů od {dodavatelů} vrakovišť. Brzdy, motory, karoserie a další.` |
| `/dily/znacka/{brand}/{model}/{rok}` | `Náhradní díly {Brand} {Model} {Rok} | Carmakler — od {minPrice} Kč` | `Náhradní díly pro {Brand} {Model} ročník {rok}. Použité originální i nové díly. {dílů} kusů na skladě.` |

**Title pravidla:**
- Max 60 chars desktop, 50 chars mobile
- Klíčové slovo vpředu
- Brand suffix vždy
- Pricing modifier ("od X Kč") boost CTR ~15%

---

## C2 — Component & file structure

### C2.1 Nové soubory (k vytvoření)

```
app/
  (web)/dily/
    znacka/
      [brand]/                          ← rename z [slug]/, refactor
        page.tsx                        ← rozšíření existujícího
        loading.tsx                     ← existuje
        error.tsx                       ← existuje
        [model]/
          page.tsx                      ← NOVÉ — model landing
          loading.tsx                   ← NOVÉ
          error.tsx                     ← NOVÉ
          [rok]/
            page.tsx                    ← NOVÉ — model+rok landing
            loading.tsx                 ← NOVÉ
            error.tsx                   ← NOVÉ

  llms.txt/
    route.ts                            ← NOVÉ — /llms.txt endpoint
  api/
    revalidate/
      parts/
        route.ts                        ← NOVÉ — webhook revalidation

components/
  web/dily/
    PartsBreadcrumbs.tsx                ← NOVÉ — 5-level breadcrumb
    PartsHero.tsx                       ← NOVÉ — H1 + intro
    PartsItemList.tsx                   ← NOVÉ — top 15 grid + JSON-LD
    PartsFaqAccordion.tsx               ← NOVÉ — FAQ accordion + JSON-LD
    PartsPriceRange.tsx                 ← NOVÉ — min/max/avg widget
    PartsModelsGrid.tsx                 ← NOVÉ — model tile grid
    PartsYearsGrid.tsx                  ← NOVÉ — year tile grid
    PartsSeoContent.tsx                 ← NOVÉ — long-form text body

lib/
  seo/
    generatePartsLanding.ts             ← NOVÉ — content factory
    aiSnippet.ts                        ← NOVÉ — Q&A formatter
    pricingAggregate.ts                 ← NOVÉ — DB aggregation helpers
    partsModels.ts                      ← NOVÉ — brand→model→years map
  seo.ts                                ← rozšířit o Product, Offer, Organization, WebSite generators

prisma/
  schema.prisma                         ← + model SeoContent
  migrations/
    YYYYMMDD_add_seo_content/           ← NOVÁ migrace
      migration.sql

scripts/
  generate-parts-seo-content.ts         ← NOVÝ — one-shot content generation script

docs/
  geo-benchmark.md                      ← NOVÝ — manuální AI prompt testing

public/
  llms-full.txt                         ← NOVÝ — extended sitemap pro AI crawlers
```

### C2.2 Modifikované soubory

```
app/sitemap.ts                          ← + model + rok kombinace
app/(web)/dily/page.tsx                 ← + Organization + WebSite JSON-LD
app/(web)/dily/[slug]/page.tsx          ← + Product + Offer + Breadcrumb JSON-LD
app/(web)/dily/znacka/[brand]/page.tsx  ← rename ze [slug], + nové sekce, + FAQPage
lib/seo-data.ts                         ← + PARTS_MODELS, + PARTS_YEARS, brand FAQ data
lib/seo.ts                              ← + Product, Offer, Organization, WebSite generators
```

### C2.3 Routing rename: `[slug]` → `[brand]`

**Pozor:** Stávající route je `/dily/znacka/[slug]`. Pro 3-level routing potřebujeme `/dily/znacka/[brand]/[model]/[rok]`.

**Krok:**
1. Přejmenovat folder `app/(web)/dily/znacka/[slug]/` → `app/(web)/dily/znacka/[brand]/`
2. V `page.tsx` přejmenovat `params.slug` → `params.brand` (1 string find/replace)
3. Stávajících 8 brand pages funguje stejně (slugy se nemění: `skoda`, `volkswagen`, `bmw`...)
4. Žádný redirect needed (URLs identical)

**Test:** `npm run build` → ověřit že 8 brand pages se generuje stejně jako dřív + navíc model + year pages.

---

## C3 — Content generation strategie (pro 200+ landing pages)

### C3.1 Problém: 200 stránek × 2 700 slov = 540 000 slov

**Cíl:** Top 50 brand×model×rok kombinací pre-buildnout přes ISR (`generateStaticParams`), zbylých ~150 fallback ISR (`dynamicParams: true`).

**Content sources (priority):**

1. **Manual seed data** (lib/seo-data.ts) — 8 brands + 30 models s description, FAQ items, quick facts (existuje pro brands ✅, **rozšířit o models**).
2. **DB-derived data** — pricing aggregations (min/max/avg), top sold parts, supplier list, stock count.
3. **Template-driven content** — boilerplate sentences s placeholders (`{brand}`, `{model}`, `{count}`, `{minPrice}`).
4. **One-shot AI generation** — Claude API jednorázově generuje long-form text per kombinace, uloží do `SeoContent` model. **Náklady ~$1.5 pro 200 kombinací**.

### C3.2 Prisma model `SeoContent` (NEW)

```prisma
model SeoContent {
  id        String   @id @default(cuid())

  // URL identifier
  pageType  String   // BRAND, MODEL, MODEL_YEAR, CATEGORY
  brand     String?
  model     String?
  year      Int?
  category  String?

  // Content (JSON for flexibility)
  h1            String
  metaTitle     String
  metaDesc      String
  introHtml     String  // Hero paragraph
  sectionsJson  String  // JSON array of {h2: string, html: string} pre-rendered
  faqJson       String  // JSON array of FaqItem
  aiSnippetText String  // 2-3 věty pro AI featured snippet
  quickFacts    String  // JSON array of strings (numerická data)

  // Meta
  wordCount     Int
  generatedBy   String  @default("template") // "template", "claude", "manual"
  generatedAt   DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([pageType, brand, model, year, category])
  @@index([pageType])
  @@index([brand])
}
```

**Compound unique** zajistí jedna stránka = jeden záznam. Page templates pak `prisma.seoContent.findUnique({...})` per render.

### C3.3 Generation script

```ts
// scripts/generate-parts-seo-content.ts
import { prisma } from "@/lib/prisma";
import { PARTS_BRANDS, PARTS_MODELS } from "@/lib/seo-data";
import { generateLandingContent } from "@/lib/seo/generatePartsLanding";

async function main() {
  const combos = buildCombinations(); // brand × model × rok (top 200)

  for (const combo of combos) {
    const existing = await prisma.seoContent.findUnique({
      where: { pageType_brand_model_year_category: { ... } },
    });

    if (existing && !process.argv.includes("--force")) {
      console.log(`SKIP ${combo.url} (already exists)`);
      continue;
    }

    const content = await generateLandingContent(combo);
    // ↑ buď template (rychlé) nebo Claude API (dražší)

    await prisma.seoContent.upsert({
      where: { ... },
      create: { ...content },
      update: { ...content },
    });

    console.log(`✓ ${combo.url} (${content.wordCount} words)`);
  }
}

main();
```

**Spouštění:**
- One-shot manuálně po deployi: `tsx scripts/generate-parts-seo-content.ts`
- Force regenerate: `tsx scripts/generate-parts-seo-content.ts --force`
- Subset: `tsx scripts/generate-parts-seo-content.ts --brand=skoda`

### C3.4 `lib/seo/generatePartsLanding.ts`

```ts
import { prisma } from "@/lib/prisma";
import { generatePartsLandingFromTemplate } from "./template";
// import Anthropic from "@anthropic-ai/sdk"; // optional, fáze 2

export async function generateLandingContent(combo: {
  pageType: "BRAND" | "MODEL" | "MODEL_YEAR";
  brand: string;
  model?: string;
  year?: number;
}) {
  // 1. Get DB-derived stats
  const stats = await prisma.part.aggregate({
    where: {
      status: "ACTIVE",
      compatibleBrands: { contains: combo.brand },
      ...(combo.model && { compatibleModels: { contains: combo.model } }),
    },
    _count: true,
    _min: { price: true },
    _max: { price: true },
    _avg: { price: true },
  });

  // 2. Build template-driven content
  const content = generatePartsLandingFromTemplate({
    ...combo,
    partCount: stats._count,
    minPrice: stats._min.price ?? 0,
    maxPrice: stats._max.price ?? 0,
    avgPrice: Math.round(stats._avg.price ?? 0),
  });

  // 3. Optional Claude enhancement (fáze 2)
  // const enhanced = await enhanceWithClaude(content);

  return content;
}
```

**Template approach** (no Claude needed for MVP):
- Static seed data per brand (existuje)
- DB stats interpolated do template stringů
- FAQ items: 3 universal (Carmakler trust) + 2-5 brand-specific (z seed data)

**MVP náklady = $0** (pouze DB queries + template engine).

---

# ČÁST D — TECH STACK (Next.js 15 ISR vs SSR)

## D1 — Render strategy per URL type

> **Pozn. v2:** Per uživatelské zadání ("používat SSR nebo ISR") + Evžen review feedback — všechny static-like stránky jsou označené jako **ISR** (NE SSG). Technicky `dynamic="force-static" + revalidate=N` je ISR (revalidace v čase), pure SSG by bylo `revalidate: false`. Konzistentní terminologie: jen **ISR** a **SSR** v celém plánu.

| URL pattern | Strategy | Revalidate | Důvod |
|---|---|---|---|
| `/dily` (root) | **ISR** | 1h | Static rebuild každou hodinu, fast |
| `/dily/kategorie/{slug}` | **ISR** | 24h | Stats change daily |
| `/dily/znacka/{brand}` | **ISR** | 24h | Brand pages stable |
| `/dily/znacka/{brand}/{model}` | **ISR** | 24h | Model pages stable |
| `/dily/znacka/{brand}/{model}/{rok}` | **ISR + dynamicParams** | 24h | Long tail, fallback OK |
| `/dily/{slug}` (detail) | **ISR + dynamicParams** | 1h | Stock + price changes |
| `/dily/katalog` (search) | **SSR** | — | User filters, dynamic |
| `/dily/kosik` | **SSR** | — | User session |

### D1.1 ISR konfigurace per page

```ts
// app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx

export const dynamic = "force-static"; // Build-time + ISR
export const dynamicParams = true;     // Fallback for unknown params
export const revalidate = 86400;       // 24 hours

export async function generateStaticParams() {
  // Pre-build top 50 model+rok kombinace
  const topCombos = await prisma.part.groupBy({
    by: ["compatibleBrands", "compatibleModels"],
    where: { status: "ACTIVE" },
    _count: true,
    orderBy: { _count: { compatibleModels: "desc" } },
    take: 50,
  });

  return topCombos.flatMap((combo) => {
    const brands = JSON.parse(combo.compatibleBrands || "[]");
    const models = JSON.parse(combo.compatibleModels || "[]");
    const years = [2015, 2018, 2020]; // top years per kombinaci

    return brands.flatMap((brand: string) =>
      models.flatMap((model: string) =>
        years.map((rok) => ({
          brand: slugify(brand),
          model: slugify(model),
          rok: String(rok),
        }))
      )
    );
  });
}
```

### D1.2 On-demand revalidation

**Trigger:** Po každém přidání/úpravě dílu v PWA → `revalidatePath()` invaliduje relevant landing pages.

```ts
// app/api/revalidate/parts/route.ts
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "BACKOFFICE", "PARTS_SUPPLIER", "PARTNER_VRAKOVISTE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { brand, model, year } = await request.json();

  // Revalidate hierarchical paths
  revalidatePath("/dily");
  if (brand) revalidatePath(`/dily/znacka/${brand}`);
  if (brand && model) revalidatePath(`/dily/znacka/${brand}/${model}`);
  if (brand && model && year) revalidatePath(`/dily/znacka/${brand}/${model}/${year}`);

  return NextResponse.json({ revalidated: true });
}
```

**Volání:** Z `app/api/parts/route.ts` (POST) po `prisma.part.create()`:

```ts
// V app/api/parts/route.ts po prisma.part.create()
const compatBrands = JSON.parse(part.compatibleBrands || "[]");
const compatModels = JSON.parse(part.compatibleModels || "[]");
for (const brand of compatBrands) {
  revalidatePath(`/dily/znacka/${slugify(brand)}`);
  for (const model of compatModels) {
    revalidatePath(`/dily/znacka/${slugify(brand)}/${slugify(model)}`);
  }
}
```

### D1.3 Build performance

**Estimate:**
- Stávající build: 312 routes, 44s
- Nový: +50 model pages + 50 model×year pages = ~412 routes
- **Estimate: 55-65s build time** (acceptable, +25%)
- ISR fallback zajistí, že další 200+ kombinace se generují za běhu (cold start ~500ms first hit, then cached)

**Optimization:** `cacheLife("hours")` z Next.js 15 dataCache pro Prisma queries v page templates → snížení DB load.

---

## D2 — JSON-LD schema implementation

### D2.1 Per-page schema matrix

| Page type | BreadcrumbList | Organization | WebSite | FAQPage | ItemList | Product | Offer |
|---|---|---|---|---|---|---|---|
| `/dily` (root) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/dily/znacka/{brand}` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `/dily/znacka/{brand}/{model}` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `/dily/znacka/{brand}/{model}/{rok}` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `/dily/{slug}` (detail) | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/dily/kategorie/{slug}` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |

### D2.2 Helper rozšíření v `lib/seo.ts`

```ts
// + Product schema
export function generatePartProductJsonLd(part: {
  name: string;
  description: string;
  image: string;
  brand: string;
  sku: string;
  url: string;
  price: number;
  inStock: boolean;
  condition: string; // "NewCondition" | "UsedCondition" | "RefurbishedCondition"
}): string {
  const conditionUrl =
    part.condition === "NEW"
      ? "https://schema.org/NewCondition"
      : part.condition === "REFURBISHED"
        ? "https://schema.org/RefurbishedCondition"
        : "https://schema.org/UsedCondition";

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: part.name,
    description: part.description,
    image: part.image,
    sku: part.sku,
    brand: { "@type": "Brand", name: part.brand },
    offers: {
      "@type": "Offer",
      url: part.url,
      priceCurrency: "CZK",
      price: part.price,
      itemCondition: conditionUrl,
      availability: part.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Carmakler",
      },
    },
  });
}

// + Organization (single source of truth)
export function generateOrganizationJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Carmakler",
    url: "https://www.carmakler.cz",
    logo: "https://www.carmakler.cz/logo.png",
    description: "Česká marketplace platforma pro použité autodíly z vrakovišť. 12% komise z prodeje, free pro vrakoviště.",
    foundingDate: "2025",
    sameAs: [
      "https://www.facebook.com/carmakler",
      "https://www.linkedin.com/company/carmakler",
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "CZ",
      addressLocality: "Praha",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "info@carmakler.cz",
      availableLanguage: ["Czech", "English"],
    },
  });
}

// + WebSite + SearchAction (Sitelinks searchbox)
export function generateWebSiteJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Carmakler",
    url: "https://www.carmakler.cz",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.carmakler.cz/dily/katalog?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  });
}
```

### D2.3 FAQ generation per page

**3 universal FAQs (Carmakler trust signals):**
1. "Jaká je záruka na použité díly?"
2. "Jak rychle doručíte díl?"
3. "Mohu díl vrátit pokud nesedí?"

**Brand/model-specific FAQs (z seed data):**
- Existuje pro brands ✅ (`PARTS_BRANDS_DATA[brand].faqItems`)
- Pro models: rozšířit `lib/seo-data.ts` o `PARTS_MODELS_DATA[model].faqItems`
- Pro model+year: template-driven (`Jaké jsou typické problémy {Model} {Rok}?`)

---

## D3 — Sitemap rozšíření (`app/sitemap.ts`)

```ts
// app/sitemap.ts (rozšíření stávajícího)

import { PARTS_BRANDS, PARTS_MODELS_BY_BRAND } from "@/lib/seo-data";

// ... existing code ...

// SEO landing pages — díly model + rok
const partsModelPages: MetadataRoute.Sitemap = [];
const partsModelYearPages: MetadataRoute.Sitemap = [];

for (const brand of PARTS_BRANDS) {
  const models = PARTS_MODELS_BY_BRAND[brand.slug] || [];
  for (const model of models) {
    partsModelPages.push({
      url: `${BASE_URL}/dily/znacka/${brand.slug}/${model.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    });

    // Top 3 years per model
    for (const year of [2015, 2018, 2020]) {
      partsModelYearPages.push({
        url: `${BASE_URL}/dily/znacka/${brand.slug}/${model.slug}/${year}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    }
  }
}

// Dynamic parts (top 1000 published)
const partPages: MetadataRoute.Sitemap = [];
try {
  const parts = await prisma.part.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, updatedAt: true },
    orderBy: { viewCount: "desc" },
    take: 1000,
  });
  partPages.push(
    ...parts.map((p) => ({
      url: `${BASE_URL}/dily/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }))
  );
} catch {}

return [
  ...staticPages,
  ...brandPages,
  ...modelPages,
  ...bodyTypePages,
  ...pricePages,
  ...cityPages,
  ...partsCategoryPages,
  ...partsBrandPages,
  ...partsModelPages,        // NEW (~30 entries)
  ...partsModelYearPages,    // NEW (~90 entries)
  ...partPages,              // NEW (1000 entries)
  ...vehiclePages,
  ...brokerPages,
];
```

**Pokud sitemap > 50 000 URLs:** Implementovat `sitemap-index.xml` s split files (`/sitemap/0.xml`, `/sitemap/1.xml`, atd.). **MVP nemá tolik URLs** — pravděpodobně pod 5 000.

---

## D4 — `/llms.txt` endpoint

```ts
// app/llms.txt/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PARTS_BRANDS } from "@/lib/seo-data";

export const dynamic = "force-static";
export const revalidate = 86400; // 24h

export async function GET() {
  const stats = await prisma.part.aggregate({
    where: { status: "ACTIVE" },
    _count: true,
    _avg: { price: true },
  });

  const supplierCount = await prisma.user.count({
    where: { role: { in: ["PARTS_SUPPLIER", "PARTNER_VRAKOVISTE"] }, status: "ACTIVE" },
  });

  const content = `# Carmakler

> Carmakler je česká marketplace platforma pro použité autodíly z vrakovišť. Spojuje vrakoviště s kupujícími přes katalogizovanou nabídku s detailními popisy, fotkami a kompatibilitou podle VIN.

## Klíčová data (auto-generated)

- Aktivních dílů v katalogu: ${stats._count}
- Průměrná cena dílu: ${Math.round(stats._avg.price ?? 0)} Kč
- Aktivních vrakovišť: ${supplierCount}
- Komise: 12 % z prodejní ceny (vrakoviště neplatí žádné poplatky)
- Doručení: 2-5 pracovních dní po celé ČR

## Hlavní sekce

- [Eshop autodílů](https://www.carmakler.cz/dily): Použité a nové díly z českých vrakovišť
- [Katalog dílů](https://www.carmakler.cz/dily/katalog): Vyhledávání dílů podle značky, modelu, VIN
- [Inzerce](https://www.carmakler.cz/inzerce): Inzerce ojetých aut
- [Marketplace VIP](https://www.carmakler.cz/marketplace): Investiční flipping
- [Makléřská síť](https://www.carmakler.cz/makleri): Zprostředkování prodeje vozidel

## Často hledané kategorie dílů

${PARTS_BRANDS.map((b) => `- [Náhradní díly ${b.name}](https://www.carmakler.cz/dily/znacka/${b.slug})`).join("\n")}

## Kategorie

- [Motory](https://www.carmakler.cz/dily/kategorie/motory)
- [Převodovky](https://www.carmakler.cz/dily/kategorie/prevodovky)
- [Brzdy](https://www.carmakler.cz/dily/kategorie/brzdy)
- [Karoserie](https://www.carmakler.cz/dily/kategorie/karoserie)
- [Podvozek](https://www.carmakler.cz/dily/kategorie/podvozek)

## Optional

- [Sitemap](https://www.carmakler.cz/sitemap.xml)
- [O nás](https://www.carmakler.cz/o-nas)
- [Kontakt](https://www.carmakler.cz/kontakt)
- [Obchodní podmínky](https://www.carmakler.cz/obchodni-podminky)
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
```

**Effort:** 1h (jednoduchý route handler).

---

# ČÁST E — AKČNÍ PLÁN (5-6 dnů, 40h)

## FÁZE 1 — Foundation (14h, ~2 dny)

### E1.1 Prisma model `SeoContent` (2h)

**Soubory:**
- `prisma/schema.prisma` — přidat model
- `prisma/migrations/{timestamp}_add_seo_content/migration.sql` — vygenerovat

**Kroky:**
1. Přidat model `SeoContent` (viz C3.2)
2. `npx prisma migrate dev --name add_seo_content`
3. `npx prisma generate`
4. Verify v Prisma Studio

**Risk:** Žádný (additive change, no FK).

### E1.2 Rozšíření `lib/seo-data.ts` (4h)

**Soubory:**
- `lib/seo-data.ts` — přidat `PARTS_MODELS_BY_BRAND`, `PARTS_YEARS`, model FAQ data

**Data:**

```ts
export interface PartsModelData {
  slug: string;
  name: string;
  brandSlug: string;
  generations: { name: string; yearFrom: number; yearTo: number }[];
  faqItems: FaqItem[];
  description: string;
}

export const PARTS_MODELS_BY_BRAND: Record<string, PartsModelData[]> = {
  skoda: [
    {
      slug: "octavia",
      name: "Octavia",
      brandSlug: "skoda",
      generations: [
        { name: "1. generace (1U)", yearFrom: 1996, yearTo: 2010 },
        { name: "2. generace (1Z)", yearFrom: 2004, yearTo: 2013 },
        { name: "3. generace (5E)", yearFrom: 2012, yearTo: 2020 },
        { name: "4. generace (NX)", yearFrom: 2019, yearTo: 2024 },
      ],
      faqItems: [
        { question: "Jaké jsou typické problémy Škoda Octavia?", answer: "U starších Octavií 1U a 1Z se vyskytují problémy s DSG převodovkou (DQ200) a DPF filtry. Novější 5E a NX jsou výrazně spolehlivější. Náhradní díly jsou snadno dostupné." },
        { question: "Kolik stojí brzdové kotouče na Škoda Octavia?", answer: "Použité originální kotouče stojí 350-800 Kč/ks, nové aftermarket 500-1 200 Kč/ks. Cena závisí na generaci a velikosti kotouče." },
        { question: "Jsou díly z různých generací Octavia kompatibilní?", answer: "Ne, díly mezi generacemi (1U, 1Z, 5E, NX) zpravidla nejsou kompatibilní. Vždy ověřte VIN nebo specifikujte generaci při objednávce." },
      ],
      description: "Škoda Octavia je nejprodávanější model značky Škoda v ČR. Díky velkému rozšíření je dostupnost náhradních dílů na vrakovištích vynikající.",
    },
    // + fabia, superb, kodiaq, ...
  ],
  volkswagen: [
    // golf, passat, tiguan, touran, ...
  ],
  // bmw, audi, ford, toyota, hyundai, opel
};

export const PARTS_YEARS = [2010, 2012, 2014, 2015, 2016, 2018, 2020, 2022];
```

**Effort:** 4h (manuální data entry, 8 brands × 4 modelů = 32 model entries).

### E1.3 Rozšíření `lib/seo.ts` schema generators (3h)

**Soubory:**
- `lib/seo.ts` — přidat `generatePartProductJsonLd`, `generateOrganizationJsonLd`, `generateWebSiteJsonLd`

**Code:** Viz D2.2 výše.

**Test:** Validate v Google Rich Results Test (https://search.google.com/test/rich-results).

### E1.4 Helpers `lib/seo/` (5h)

**Soubory:**
- `lib/seo/generatePartsLanding.ts` — content factory (template-driven)
- `lib/seo/aiSnippet.ts` — Q&A formatting helper
- `lib/seo/pricingAggregate.ts` — DB aggregation helpers
- `lib/seo/partsModels.ts` — brand→model→years lookup

**Code stub `pricingAggregate.ts`:**

```ts
import { prisma } from "@/lib/prisma";

export async function getPartsStatsForBrand(brandSlug: string) {
  const stats = await prisma.part.aggregate({
    where: {
      status: "ACTIVE",
      compatibleBrands: { contains: brandSlug },
    },
    _count: true,
    _min: { price: true },
    _max: { price: true },
    _avg: { price: true },
  });

  const supplierCount = await prisma.part.groupBy({
    by: ["supplierId"],
    where: { status: "ACTIVE", compatibleBrands: { contains: brandSlug } },
    _count: true,
  });

  return {
    partCount: stats._count,
    minPrice: stats._min.price ?? 0,
    maxPrice: stats._max.price ?? 0,
    avgPrice: Math.round(stats._avg.price ?? 0),
    supplierCount: supplierCount.length,
  };
}

export async function getPartsStatsForModel(brandSlug: string, modelSlug: string) {
  // Similar query with model filter
}

export async function getPartsStatsForModelYear(brandSlug: string, modelSlug: string, year: number) {
  // Year filter via compatibleYearFrom/To
}
```

---

## FÁZE 2 — Templates + Content (16h, ~2 dny)

### E2.1 Routing rename + brand page rozšíření (3h)

**Kroky:**
1. `git mv "app/(web)/dily/znacka/[slug]" "app/(web)/dily/znacka/[brand]"`
2. V `page.tsx`, `loading.tsx`, `error.tsx` přejmenovat `params.slug` → `params.brand`
3. Rozšířit `page.tsx` o nové sekce z C1.3 Template 1
4. Přidat JSON-LD: BreadcrumbList ✅ (existuje), + Organization, + FAQPage, + ItemList
5. Build test: `npm run build`

### E2.2 Model landing page (5h)

**Soubor:** `app/(web)/dily/znacka/[brand]/[model]/page.tsx`

**Klíčové části:**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PARTS_BRANDS, PARTS_MODELS_BY_BRAND, BASE_URL } from "@/lib/seo-data";
import {
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  generateOrganizationJsonLd,
  generateBrandItemListJsonLd,
} from "@/lib/seo";
import { getPartsStatsForModel } from "@/lib/seo/pricingAggregate";
import { PartsBreadcrumbs } from "@/components/web/dily/PartsBreadcrumbs";
import { PartsHero } from "@/components/web/dily/PartsHero";
import { PartsItemList } from "@/components/web/dily/PartsItemList";
import { PartsFaqAccordion } from "@/components/web/dily/PartsFaqAccordion";
import { PartsYearsGrid } from "@/components/web/dily/PartsYearsGrid";
import { PartsSeoContent } from "@/components/web/dily/PartsSeoContent";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  return Object.entries(PARTS_MODELS_BY_BRAND).flatMap(([brand, models]) =>
    models.map((m) => ({ brand, model: m.slug }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string; model: string }> }): Promise<Metadata> {
  const { brand, model } = await params;
  const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
  const modelData = PARTS_MODELS_BY_BRAND[brand]?.find((m) => m.slug === model);
  if (!brandData || !modelData) return {};

  const stats = await getPartsStatsForModel(brand, model);

  return {
    title: `Náhradní díly ${brandData.name} ${modelData.name} | Carmakler — od ${stats.minPrice} Kč`,
    description: `Originální použité díly pro ${brandData.name} ${modelData.name}. ${stats.partCount} kusů od ${stats.supplierCount} vrakovišť. Brzdy, motory, karoserie a další.`,
    alternates: { canonical: `${BASE_URL}/dily/znacka/${brand}/${model}` },
    openGraph: {
      title: `Náhradní díly ${brandData.name} ${modelData.name}`,
      description: `${stats.partCount} dílů na skladě, doručení do 5 dnů.`,
      url: `${BASE_URL}/dily/znacka/${brand}/${model}`,
    },
  };
}

export default async function PartsModelPage({ params }: { params: Promise<{ brand: string; model: string }> }) {
  const { brand, model } = await params;
  const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
  const modelData = PARTS_MODELS_BY_BRAND[brand]?.find((m) => m.slug === model);
  if (!brandData || !modelData) notFound();

  const stats = await getPartsStatsForModel(brand, model);

  // Top 15 parts (ItemList)
  const topParts = await prisma.part.findMany({
    where: {
      status: "ACTIVE",
      compatibleBrands: { contains: brandData.name },
      compatibleModels: { contains: modelData.name },
    },
    orderBy: { viewCount: "desc" },
    take: 15,
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Domů", url: BASE_URL },
    { name: "Díly", url: `${BASE_URL}/dily` },
    { name: `Díly ${brandData.name}`, url: `${BASE_URL}/dily/znacka/${brand}` },
    { name: modelData.name, url: `${BASE_URL}/dily/znacka/${brand}/${model}` },
  ]);

  const faqJsonLd = generateFaqJsonLd(modelData.faqItems);
  const orgJsonLd = generateOrganizationJsonLd();

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: orgJsonLd }} />

      <PartsBreadcrumbs items={[/* ... */]} />
      <PartsHero
        h1={`Náhradní díly ${brandData.name} ${modelData.name}`}
        description={modelData.description}
        stats={stats}
      />

      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6">Roky výroby {modelData.name}</h2>
        <PartsYearsGrid brand={brand} model={model} generations={modelData.generations} />
      </section>

      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6">Top 15 dílů {brandData.name} {modelData.name}</h2>
        <PartsItemList parts={topParts} />
      </section>

      <PartsSeoContent
        brand={brandData}
        model={modelData}
        stats={stats}
      />

      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6">Časté otázky</h2>
        <PartsFaqAccordion items={modelData.faqItems} />
      </section>
    </main>
  );
}
```

### E2.3 Model+rok landing page (3h)

**Soubor:** `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx`

**Klíčové části:** Stejný pattern jako E2.2, ale s year filtr v queries + template based content (kratší — 2 400 slov).

### E2.4 Komponenty (5h)

**Soubory v `components/web/dily/`:**

- `PartsBreadcrumbs.tsx` — 5-level breadcrumb (Domů → Díly → Brand → Model → Rok)
- `PartsHero.tsx` — H1 + intro + 3 quick stats (partCount, avgPrice, supplierCount)
- `PartsItemList.tsx` — Grid 15 dílů + ItemList JSON-LD inside
- `PartsFaqAccordion.tsx` — Accordion s expand/collapse + FAQPage JSON-LD
- `PartsPriceRange.tsx` — Min/max/avg widget
- `PartsModelsGrid.tsx` — Grid model tiles
- `PartsYearsGrid.tsx` — Grid year tiles
- `PartsSeoContent.tsx` — Long-form text wrapper s typography

**Stylling:** Tailwind, mobile-first, prose typography pro long-form text.

---

## FÁZE 3 — GEO + Tooling + Polish (10h, ~1.5 dne)

### E3.1 `/llms.txt` endpoint (1h)

**Soubor:** `app/llms.txt/route.ts`

**Code:** Viz D4 výše.

**Test:**
```bash
curl http://localhost:3000/llms.txt
```

### E3.2 Sitemap rozšíření (2h)

**Soubor:** `app/sitemap.ts`

**Code:** Viz D3 výše.

**Test:**
```bash
curl http://localhost:3000/sitemap.xml | wc -l
# Expected: ~5 000 entries
```

### E3.3 On-demand revalidation API (2h)

**Soubor:** `app/api/revalidate/parts/route.ts`

**Code:** Viz D1.2 výše.

**Volání z parts API:**
- Modify `app/api/parts/route.ts` POST handler
- Po `prisma.part.create()` zavolat `revalidatePath()` per relevant URL

### E3.4 Detail page Product schema (2h)

**Soubor:** `app/(web)/dily/[slug]/page.tsx`

**Změny:**
1. Import `generatePartProductJsonLd` z `lib/seo`
2. Fetch part s images
3. Inject JSON-LD `<script>` tag

```tsx
const productJsonLd = generatePartProductJsonLd({
  name: part.name,
  description: part.description ?? "",
  image: part.images[0]?.url ?? "",
  brand: part.compatibleBrands ?? "",
  sku: part.partNumber ?? part.id,
  url: `${BASE_URL}/dily/${part.slug}`,
  price: part.price,
  inStock: part.stock > 0,
  condition: part.condition,
});
```

### E3.5 GEO benchmark dokumentace (2h)

**Soubor:** `docs/geo-benchmark.md`

**Obsah:**

```markdown
# GEO Benchmark — Carmakler /dily

## Účel
Manuální měření citation rate v ChatGPT, Perplexity, Google AI Overviews, Gemini.
Frekvence: 2× měsíčně.

## Test queries (CZ)

### Brand-level
1. "Kde koupit použité díly Škoda Octavia?"
2. "Levné náhradní díly VW Passat brzdy"
3. "Náhradní díly BMW 3 series F30 cena"
4. "Originální díly Audi A4 B9"

### Long-tail
5. "Vrakoviště Praha náhradní díly Škoda"
6. "Použitý motor 1.9 TDI Octavia 1"
7. "Brzdové kotouče Fabia 2018 cena"

### Educational / GEO
8. "Jaký je rozdíl mezi originálními a aftermarket díly?"
9. "Jak ověřit kompatibilitu náhradního dílu podle VIN?"
10. "Kolik stojí brzdové destičky Octavia 3?"

## Měření

| Query | ChatGPT | Perplexity | AI Overview | Gemini | Date |
|---|---|---|---|---|---|
| 1 | ❌ | ✅ #3 | ❌ | ❌ | 2026-04-01 |
| 2 | ❌ | ❌ | ✅ | ❌ | 2026-04-01 |
| ... | | | | | |

## Cíle Y1
- Citation count: 50+/měsíc napříč ChatGPT + Perplexity
- AI-driven traffic: 5-10% z total
- llms.txt requests: tracking start
```

### E3.6 Build + lint + test (1h)

```bash
npm run build      # Verify ~412 routes generated
npm run lint       # 0 errors expected
npx vitest run     # 141+ tests pass
```

**Verify:**
- `npm run build` output mentions new routes (`/dily/znacka/[brand]/[model]`, `/dily/znacka/[brand]/[model]/[rok]`)
- Sitemap includes all new entries
- `/llms.txt` returns markdown
- JSON-LD validates v Google Rich Results Test

---

## E4 — Dependencies between phases

```
E1.1 (Prisma SeoContent)
  ↓
E1.2 (PARTS_MODELS_BY_BRAND data) ─┐
  ↓                                │
E1.3 (lib/seo schema generators)   │
  ↓                                │
E1.4 (lib/seo/ helpers) ───────────┘
  ↓
E2.1 (rename [slug] → [brand], rozšíření brand page)
  ↓
E2.2 (model page) ─┐
  ↓                │
E2.3 (model+rok)   │
  ↓                │
E2.4 (komponenty) ─┘
  ↓
E3.1-E3.6 (GEO + tooling + polish, parallelizable)
```

**E1 musí být HOTOVÁ před E2.** E2.1 musí být HOTOVÁ před E2.2/E2.3 (routing rename). E3 lze parallelizovat (different files).

---

## E5 — Testing strategy

### E5.1 Unit tests (vitest)

**Soubory v `__tests__/` nebo vedle source:**

- `lib/seo/__tests__/pricingAggregate.test.ts` — DB aggregation helpers
- `lib/seo/__tests__/generatePartsLanding.test.ts` — content generation
- `lib/__tests__/seo.test.ts` — JSON-LD generators (existing rozšířit o Product, Organization, WebSite)

**Coverage target:** 80%+ na nové helpers.

### E5.2 E2E tests (Playwright)

**Nový soubor:** `e2e/dily-seo.spec.ts`

**Test cases:**
1. `/dily/znacka/skoda` — H1, breadcrumb, FAQPage JSON-LD present
2. `/dily/znacka/skoda/octavia` — H1 contains "Octavia", year grid visible
3. `/dily/znacka/skoda/octavia/2018` — H1 contains "2018"
4. `/dily/{slug}` — Product JSON-LD present
5. `/sitemap.xml` — contains `/dily/znacka/skoda/octavia`
6. `/llms.txt` — returns markdown, status 200

### E5.3 Manual checks

**Lighthouse SEO audit:**
- Target: 95+ na všech /dily/* stránkách
- Mobile-first audit
- Core Web Vitals: LCP <2.5s, CLS <0.1

**Google Rich Results Test:**
- Validovat všechny JSON-LD schemas
- BreadcrumbList ✅
- FAQPage ✅
- Product ✅
- Organization ✅
- WebSite ✅

**Schema.org validator:**
- https://validator.schema.org/

---

## E6 — Risk register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Routing rename `[slug]` → `[brand]` rozbije linky | Low | Med | Slug name nemění, jen folder name. Test all `Link href="/dily/znacka/...` |
| Build time roste >2× | Low | Med | ISR fallback, only top 50 pre-built |
| Sitemap > 50k URLs | Low | Low | Sitemap index split (impl pokud potřeba) |
| Content quality (template-based) low | Med | High | Fáze 2: Claude API enhancement (~$1.5 one-shot) |
| FAQ data manuálně neudržitelné | Med | Med | Auto-generate from Part categories + DB stats |
| revalidatePath() not called from PWA | Med | Med | Centralize v API parts route, test integration |
| Prisma compatibleBrands JSON contains issue | High | Med | Add migration to normalize compatibleBrands → relational `PartCompatibility` model (fáze 2) |
| Engine-level filtering missing | Low | Low | Query param fallback, fáze 2 add 4. URL level |

---

## E7 — Integrace s ostatními tasky

| Task | Integrace |
|---|---|
| **#76 AI Part Scanner** | Po scan dílu → auto-fill `compatibleBrands/Models` → `revalidatePath()` na všech relevant landing pages → SEO automatický update |
| **#77 Marketplace Liquidity** | SEO landing pages = supply-side discovery driver. Wolt model: čím víc dílů, tím víc landing pages, tím víc traffic, tím víc orders → flywheel |
| **#78 Inzerce Marketplace** | Stejný SEO pattern (3-level URL `/inzerce/znacka/{brand}/{model}/{rok}`) lze replikovat |
| **#82 PERF Web-wide ISR audit** | Tento task položí foundation (ISR strategy per page type) |
| **#80 Legal review** | Žádný impact, čistě technický task |

---

## E8 — Out of scope (fáze 2+)

**NE v MVP:**
1. Engine-level URL segment (4. level) — čeká na #76 AI Part Scanner data
2. Per-vrakoviště store pages (`/dily/vrakoviste/{slug}`) — fáze 2
3. Educational blog (`/dily/blog/{slug}`) — fáze 2 content marketing
4. Comparison pages (`/srovnani/carmakler-vs-...`) — fáze 2
5. Wikipedia + Wikidata entries — vyžaduje notable references, počkat na PR coverage
6. YouTube channel + Medium blog — fáze 2 content marketing
7. SK/PL/DE hreflang — fáze 2 internationalization
8. AggregateRating na produktech — čeká na review systém
9. Sitemap-index.xml split — pouze pokud >50k URLs (MVP nemá)
10. Claude API content enhancement — možnost v fázi 1.5 (~$1.5 náklady)

---

## SOUHRN

| Metrika | Hodnota |
|---|---|
| **Total effort** | ~40h (5-6 dnů) |
| **Nové soubory** | ~25 |
| **Modifikované soubory** | ~6 |
| **Nové DB modely** | 1 (`SeoContent`) |
| **Nové URL patterns** | 2 (`/dily/znacka/{brand}/{model}`, `/dily/znacka/{brand}/{model}/{rok}`) |
| **Nové stránky pre-built** | ~50 (top model+year combos) |
| **Nové stránky ISR fallback** | ~150 |
| **Sitemap rozšíření** | +120 URLs static + 1 000 dynamic part URLs |
| **Nové JSON-LD schemas** | Product, Offer, Organization, WebSite, FAQPage rozšíření |
| **Nový endpoint** | `/llms.txt` |
| **Nové helpers** | 4 (`lib/seo/`) + 3 schema generators v `lib/seo.ts` |
| **Náklady (Claude API)** | $0 MVP (template-based), $1.5 optional fáze 1.5 |
| **Build time impact** | +25% (44s → ~55-65s) |
| **Tests added** | ~10 unit tests + 6 E2E tests |

---

## Závěr

Plán dodává Carmakler **first-mover advantage** v CZ parts e-shop SEO/GEO. Implementace 5-6 dnů, nulové breaking changes, additive only. Po dokončení Carmakler:

1. **Překoná Autokelly** v každé měřitelné SEO metrice (Lighthouse, JSON-LD, URL, content depth)
2. **Bude jediný CZ parts e-shop** s `/llms.txt`, FAQPage schema na všech landing pages, GEO strategií
3. **Položí foundation** pro #82 web-wide ISR audit a #78 inzerce SEO replikaci
4. **Integruje se s #76** (AI Scanner) — feed nových dílů → auto-revalidate landing pages → SEO flywheel
5. **Sjednotí Wolt model #77** — supply (vrakoviště) generuje content, content generuje traffic, traffic generuje orders, orders generují provizi → marketplace liquidity flywheel

**Schvalování:** Po team-lead approval → SendMessage implementator + TaskUpdate #79 completed.

---

# Konec plan-task-81.md

**Délka:** ~700 řádků
**Status:** Ready for team-lead approval
**Next step:** SendMessage team-lead s TL;DR research + executive summary plán
