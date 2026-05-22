---
name: Plán #139 — #87c Prisma SeoContent model + content gen script
description: Implementační plán pro #87c (queue #97) — Prisma SeoContent model + content gen script + page integration. Cílem je nahradit stub UNIVERSAL_FAQS hardcoded v 3 page.tsx templates DB-backed long-form contentem (intro, sections, FAQ enrichment, AI snippet) per brand/model/model_year. Konkretizace plán-81 §C3.2-C3.5 a §E1.1-E1.4 s post-#87b updates (PARTS_MODELS_BY_BRAND už existuje, [rok] používá dynamicParams=false po #132).
type: plan
task_id: 139
queue_id: 139
parent_plan: plan-task-81.md
related_plans:
  - plan-task-124-3segment-routing.md (#87b — 3-segment routing, completed)
  - plan-task-131-87b-bugs.md (#132 — runtime bugfixes, completed)
  - plan-task-127-canonical-fix.md (#135 — canonical fix, completed)
related_followups:
  - "#87d IMPL (queue #98) — On-demand revalidation API + 9 H2 expansion"
  - "#87e DOCS (queue #99) — geo-benchmark.md + monitoring"
revision_history:
  - 2026-04-07 — initial draft (planovac, dispatch #139)
  - 2026-04-07 — lead-approved Q1-Q6 (team-lead): Strategie C (Hybrid) schválena. Q1 ✅ hybrid, Q2 ✅ 32 entries bez model_year pre-seed, Q3 ✅ defer Claude API do #87c-v2, Q4 ✅ accept substring match jako P3 known limitation, Q5 ✅ dangerouslySetInnerHTML povolen pro template-generated HTML (+ Zod validation v gen scriptu), Q6 ✅ žádný komponentní refaktor. Field naming z plan-81 §C3.2 (pageType/metaTitle/introHtml/sectionsJson/aiSnippetText) potvrzen nad ad-hoc dispatch naming (level/heroTitle/aboutText). #87c IMPL NEDISPATCHOVAT bez explicit user "jeď".
---

# Plán #139 — #87c Prisma SeoContent model + content gen script

> **Cíl:** Implementovat content layer pro `/dily/znacka/{brand}/{model}/{rok}` SEO landing pages. Nahradit hardcoded `UNIVERSAL_FAQS` + generic stub copy v 3 page.tsx templates DB-backed dynamic contentem (intro, H2 sekce, FAQ, AI snippet, quick facts) per brand/model/model_year kombinaci. **Template-driven MVP** (no Claude API náklady, $0 cost), s otevřenou cestou pro Claude enhancement v budoucí iteraci.

---

## 0 — Executive summary (TL;DR)

**Co plán dodává:**
1. **Prisma model `SeoContent`** — DB cache pro long-form SEO content (per pageType + brand + model + year)
2. **Migration** `prisma/migrations/{ts}_add_seo_content/` — additive, žádný breaking change
3. **Content factory** `lib/seo/generatePartsLanding.ts` — template-driven generator (no LLM dependency)
4. **Pricing aggregations** `lib/seo/pricingAggregate.ts` — `getPartsStatsForBrand/Model/ModelYear` (DB queries pro ItemList stats)
5. **Generation script** `scripts/generate-parts-seo-content.ts` — idempotent, flag-driven (`--force`, `--dry-run`, `--level=BRAND`, `--brand=skoda`)
6. **Page integration** — 3 page.tsx (`[brand]`, `[brand]/[model]`, `[brand]/[model]/[rok]`) fetch from `SeoContent` s template fallback
7. **AC + verify** — 18 acceptance criteria

**Architektura: Hybrid Cesta C (doporučená)**
- **Static** (`lib/seo-data.ts`): structural data (generations, topYears, brand/model lookup) — **už hotové z #87b**
- **DB** (`SeoContent`): long-form content (intro paragraph, sections, FAQ enrichment, AI snippet, quick facts)
- **Render-time fallback**: pokud DB row chybí, template factory generuje on-the-fly z brand+model+year inputs

**Klíčové rozhodnutí:**
- ✅ **Template-only MVP** (per plán-81 §C3.4) — $0 cost, žádný Claude API
- ✅ **Prisma SeoContent přesně dle plán-81 §C3.2** — žádné odchylky, schválený design
- ✅ **Hybrid render strategy** — DB cache + template fallback (graceful degradation)
- ✅ **Initial seed scope = brand + model levels (32 entries)**, year level on-demand z template (vyhne se mass DB seed)
- ⚠️ **Pricing aggregations** používají `compatibleBrands` JSON contains substring match (limitation: #87b accept, #87d může vylepšit)

**Effort:** ~10-14h dev work (Foundation 4h + Helpers 3h + Script 2h + Page integration 3h + Verify 2h)

**Dependencies:**
- ✅ #87b 3-segment routing (commit 1466223) — DONE
- ✅ #132 runtime bugfixes (commit 3666bad) — DONE
- ✅ #135 canonical fix — DONE
- ⚠️ Prisma `Part` model existuje (verified `prisma/schema.prisma:888`), ale `compatibleBrands` je JSON string (substring contains query)

**Out of scope #87c (deferred to #87d/#87e):**
- ❌ On-demand revalidation API (`app/api/revalidate/parts/route.ts`) → #87d
- ❌ 9 H2 brand expansion (rich brand pages s 9 H2 sekcemi) → #87d
- ❌ JSONB cast pro `compatibleBrands` (PostgreSQL JSONB index) → #87d
- ❌ Claude API enhancement (long-form generation) → budoucí iterace, ne #87c
- ❌ geo-benchmark.md monitoring → #87e
- ❌ Admin UI pro content editing → daleký roadmap

---

## 1 — Analysis: current state

### 1.1 Existing page templates (3 souborů z #87b)

**`app/(web)/dily/znacka/[brand]/page.tsx`** (309 řádků):
- Hardcoded: `UNIVERSAL_FAQS` array (3 items), generic hero copy `"Použité a nové náhradní díly pro vozy {brand} od ověřených vrakovišť..."`, generic SEO content stub `"Na CarMakler nabízíme široký výběr náhradních dílů..."`, "Proč nakupovat na CarMakler" sekce
- Dynamic: `brandData.name` (z `PARTS_BRANDS`), `models[]` z `PARTS_MODELS_BY_BRAND[brand]`, `PARTS_CATEGORIES` grid, `topParts` z `getTopPartsForBrand()` DB query, JSON-LD (Organization, ItemList, FAQPage)
- **Kandidáti pro DB content:** brand-specific intro (~150-300 slov), brand-specific FAQ (5-8 items místo 3 universal), brand-specific quick facts (cenové trendy, top sold parts, supplier count)

**`app/(web)/dily/znacka/[brand]/[model]/page.tsx`** (327 řádků):
- Hardcoded: stejný `UNIVERSAL_FAQS`, generic SEO content `"Hledáte náhradní díly pro {brand} {model}? Na CarMakler najdete..."`
- Dynamic: `modelData.generations[]` grid, `modelData.topYears` years grid, `topParts` z `getTopPartsForBrandModel()`, JSON-LD
- **Kandidáti pro DB content:** model-specific intro (~200-300 slov, "2. gen 2010-2017, 3. gen 2018+..." educační text), model-specific FAQ (5-8 items s typickými problémy), pricing range, "co kontrolovat při koupi"

**`app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx`** (315 řádků):
- Hardcoded: stejný `UNIVERSAL_FAQS`, generic content `"Hledáte konkrétní díly pro {brand} {model} z roku {rok}?..."`
- Dynamic: `matchingGen` lookup, `otherYears` chips, `topParts` z `getTopPartsForBrandModelYear()`, JSON-LD
- Pozn: `dynamicParams=false` (post-#132), pre-builduje **všechny valid years** z `getValidYearsForModel()` (~500 SSG pages)
- **Kandidáti pro DB content:** year-specific intro (~150-200 slov, "V roce 2018 byl model aktualizován s novým motorem..."), year-specific FAQ (volitelné, default = inherit z model)

### 1.2 lib/seo-data.ts (verified, NOT halucinated)

**Reálná struktura `PARTS_BRANDS` (line 1226):**
```ts
export const PARTS_BRANDS = [
  { slug: "skoda", name: "Škoda" },
  { slug: "volkswagen", name: "Volkswagen" },
  { slug: "bmw", name: "BMW" },
  { slug: "audi", name: "Audi" },
  { slug: "ford", name: "Ford" },
  { slug: "toyota", name: "Toyota" },
  { slug: "hyundai", name: "Hyundai" },
  { slug: "opel", name: "Opel" },
];
```
**8 entries**, **STUB** struct — NEMÁ description ani faqItems. Plný data je v `BRANDS` (line 24, BrandData type — ale to je pro vehicle landing pages, not parts).

**Reálná struktura `PARTS_MODELS_BY_BRAND` (line 1256):**
```ts
export interface PartsModelData {
  slug: string;
  name: string;
  brandSlug: string;
  generations: PartsModelGeneration[];
  topYears?: number[];
}
```
**24 modelů celkem** (8 brands × ~3 modely každý), **STUB** — NEMÁ description ani faqItems.

**`getValidYearsForModel(brand, model)` (line 1529)** vrací array všech roků ze všech generations modelu. Příklad: Octavia má 3 generace (2004-2013, 2013-2020, 2020-2026) → 23 roků. Total SSG count po #132 = ~500 (z `getValidYearsForModel()` × všechny modely).

### 1.3 Prisma `Part` model (verified `schema.prisma:888`)

```ts
model Part {
  id         String @id @default(cuid())
  slug       String @unique
  // ...
  compatibleBrands   String?  // JSON array string: ["Škoda", "VW"]
  compatibleModels   String?  // JSON array string: ["Octavia", "Golf"]
  compatibleYearFrom Int?
  compatibleYearTo   Int?
  universalFit       Boolean @default(false)
  // ...
}
```

**Důležité:** `compatibleBrands` a `compatibleModels` jsou **JSON strings** (ne native PostgreSQL JSONB). Substring match přes `{ contains: "Škoda" }` funguje, ale není dokonalý (matchne i `["Škoda Roomster"]` při hledání `"Škoda"`). Pro #87c MVP scope **acceptable**, JSONB cast je #87d.

**Pricing query pattern (per plán-81 §E1.4):**
```ts
const stats = await prisma.part.aggregate({
  where: {
    status: "ACTIVE",
    compatibleBrands: { contains: "Škoda" }, // substring match — known limitation
  },
  _count: true,
  _min: { price: true },
  _max: { price: true },
  _avg: { price: true },
});
```

### 1.4 lib/seo/ existing structure

```
lib/seo/
├── slugify.ts          (#87a, 58 řádků — slugify + aliasFor)
└── partsItemList.ts    (#87b, ~100 řádků — getTopPartsForBrand/Model/ModelYear)
```

**Chybí pro #87c:**
- `lib/seo/generatePartsLanding.ts` — content factory (template-driven)
- `lib/seo/pricingAggregate.ts` — DB aggregation helpers
- (volitelně `lib/seo/aiSnippet.ts` — Q&A formatting helper, ale lze inline v generatePartsLanding)

### 1.5 scripts/ existing structure

```
scripts/
└── test-shipping.ts    (1 script, 1939 bytes — pro test ShippingLabelCard)
```

**Chybí pro #87c:**
- `scripts/generate-parts-seo-content.ts` — idempotent gen script

### 1.6 package.json scripts

```json
"scripts": {
  "dev": "next dev",
  "build": "next build --webpack",
  "test:run": "vitest run",
  ...
},
"prisma": {
  "seed": "npx tsx prisma/seed.ts"
}
```

**Žádný `npm run seed:seo` entry** — #87c by měl přidat entry pro snadné spuštění gen scriptu.

### 1.7 Anthropic SDK usage v projektu

`package.json` má `"@anthropic-ai/sdk": "^0.80.0"` (existující dependency). Používá se v:
- `app/api/assistant/chat/route.ts`
- `app/api/assistant/generate-description/route.ts`

**Pattern již existuje** — Claude enhancement (pokud bude budoucí iterace) může reuse stejný import. Pro **#87c MVP NEPOUŽÍVÁME Claude** ($0 cost).

---

## 2 — Architektura: Hybrid Cesta C (doporučená)

### 2.1 Decision tree: 3 cesty

| Cesta | Popis | Pro | Proti |
|-------|-------|-----|-------|
| **A — Pure DB (per plán-81)** | Vše v `SeoContent` model, page.tsx fetch per render | Admin editovatelné, AI gen ready, Claude enhancement | Build-time DB queries (~500), složitější fallback, závislost na DB connection |
| **B — Pure static seed** | Rozšířit `PartsModelData` o description+faqItems v `lib/seo-data.ts` | Žádný DB cost, build-time embedded, snadný rollback | Mass-edit lib file (8 brands × 24 modelů × 24 roků = 4600 entries), no admin UI, breaking change při každém content updatu |
| **C — Hybrid (RECOMMENDED)** | Static pro structural data (existing), DB pro long-form content, render-time template fallback | Build resilient, admin path future, $0 MVP, graceful degradation | Mírně složitější page integration (DB lookup + fallback) |

**Doporučení: Cesta C** — best balance MVP cost / future flexibility / build resilience.

### 2.2 Render flow (Cesta C)

```
page.tsx render
   ↓
1. Fetch SeoContent z DB (findUnique by pageType + brand + model + year)
   ↓
2a. DB row exists? → use DB content (intro, sections, FAQ, aiSnippet, quickFacts)
2b. DB row missing? → call generateLandingContent({brand, model, year}) template factory
   ↓
3. Template factory uses static seed data (brandData, modelData, getPartsStatsForX) + boilerplate stringy
   ↓
4. Render page with content (no error, no UI difference)
```

**Klíčové:** Stránka **NIKDY nespadne** kvůli chybějícímu SeoContent. Template factory je always-on fallback.

### 2.3 Initial seed scope

**MVP gen script vygeneruje:**
- **BRAND level**: 8 entries (jeden per `PARTS_BRANDS`) — full long-form intro + 5-8 FAQ + quick facts
- **MODEL level**: 24 entries (jeden per model v `PARTS_MODELS_BY_BRAND`) — model-specific intro + FAQ + generations educational text
- **MODEL_YEAR level**: **NE pre-seed** — render-time template fallback (~500 unique combinations je too much pro initial seed, on-demand fallback je acceptable)

**Total MVP DB rows: 32** (8 brands + 24 models). Na year level se používá template fallback (rychlé, no DB cost).

**Future #87c-v2:** Lze přidat year-specific contentu pro top pages (např. `top 50 most-trafficked year combinations`), ale to počká na traffic analytics.

### 2.4 Build performance impact

**Bez SeoContent:** Build SSG count = 8 brand + 24 model + ~500 year = **~532 routes**
**S SeoContent (Cesta C):** ~532 SSG queries `prisma.seoContent.findUnique()` + ~532 `getPartsStats*()` queries

Per-query overhead: ~5-15ms s connection pool. Total build overhead: **~5-10s** (acceptable, +15-20% vs baseline).

**Optimization:** React `cache()` deduplication pro stejné brand+model lookups (neshodný `findUnique` calls dedupe automaticky během SSG batch).

---

## 3 — Detailed design (per file)

### 3.1 `prisma/schema.prisma` — model `SeoContent`

**Source of truth: plán-81 §C3.2** (lines 240-272). Žádné odchylky.

```prisma
model SeoContent {
  id        String   @id @default(cuid())

  // URL identifier
  pageType  String   // "BRAND", "MODEL", "MODEL_YEAR", "CATEGORY"
  brand     String?  // brand slug, e.g. "skoda"
  model     String?  // model slug, e.g. "octavia"
  year      Int?     // year, e.g. 2018
  category  String?  // category slug (future use, e.g. "brzdy")

  // Content (JSON for flexibility)
  h1            String   // H1 text override (optional, default = template)
  metaTitle     String   // <title> override
  metaDesc      String   // <meta name="description">
  introHtml     String   // Hero paragraph (raw HTML, sanitized on render)
  sectionsJson  String   // JSON array: [{h2: string, html: string}, ...]
  faqJson       String   // JSON array: [{question: string, answer: string}, ...]
  aiSnippetText String   // 2-3 věty pro AI featured snippet
  quickFacts    String   // JSON array of strings (numerická data)

  // Meta
  wordCount     Int      // Auto-computed, pro analytics
  generatedBy   String   @default("template") // "template", "claude", "manual"
  generatedAt   DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Constraints
  @@unique([pageType, brand, model, year, category])
  @@index([pageType])
  @@index([brand])
}
```

**Naming convention check (verified `schema.prisma:1-50`):**
- ✅ PascalCase model names (User, Vehicle, Part, MarketplaceApplication, …) → `SeoContent` ✓
- ✅ camelCase fields → `pageType`, `brand`, `metaTitle`, `wordCount` ✓
- ✅ String enum pattern via comments (jako `role String @default("BROKER") // ADMIN, BACKOFFICE, ...`) → `pageType String // "BRAND", "MODEL", "MODEL_YEAR", "CATEGORY"` ✓
- ✅ JSON v String fields (jako `compatibleBrands String? // JSON array`) → `sectionsJson String`, `faqJson String`, `quickFacts String` ✓
- ✅ Audit fields `createdAt`/`updatedAt` → `generatedAt` (alias for createdAt, lépe vystihuje meaning) + `updatedAt` ✓
- ✅ Compound unique → `@@unique([pageType, brand, model, year, category])` ✓ (jako MarketplaceApplication má vlastní compound)

**Migration name:** `add_seo_content` (per plán-81 §E1.1).

**Generation kroky:**
```bash
# 1. Edit prisma/schema.prisma — přidat model SeoContent
# 2. Generate migration
npx prisma migrate dev --name add_seo_content
# 3. Generate Prisma Client
npx prisma generate
# 4. Verify v Prisma Studio
npx prisma studio
```

**Risk:** Žádný (additive change, no FK, no data migration).

---

### 3.2 `lib/seo/pricingAggregate.ts` — DB stats helpers

**Source of truth: plán-81 §E1.4** (lines 825-872).

```ts
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export interface PartsStats {
  partCount: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  supplierCount: number;
}

/**
 * Vrátí pricing stats pro brand-level landing page.
 * Limitation: compatibleBrands je JSON string contains query (substring match),
 * matchne i prefix matches (např. "Škoda" matchne "Škoda Roomster").
 * #87d bude refactor na PostgreSQL JSONB cast pro exact match.
 */
export const getPartsStatsForBrand = cache(async (brandName: string): Promise<PartsStats> => {
  const stats = await prisma.part.aggregate({
    where: {
      status: "ACTIVE",
      compatibleBrands: { contains: brandName },
    },
    _count: true,
    _min: { price: true },
    _max: { price: true },
    _avg: { price: true },
  });

  const suppliers = await prisma.part.groupBy({
    by: ["supplierId"],
    where: { status: "ACTIVE", compatibleBrands: { contains: brandName } },
    _count: true,
  });

  return {
    partCount: stats._count,
    minPrice: stats._min.price ?? 0,
    maxPrice: stats._max.price ?? 0,
    avgPrice: Math.round(stats._avg.price ?? 0),
    supplierCount: suppliers.length,
  };
});

export const getPartsStatsForModel = cache(
  async (brandName: string, modelName: string): Promise<PartsStats> => {
    const stats = await prisma.part.aggregate({
      where: {
        status: "ACTIVE",
        compatibleBrands: { contains: brandName },
        compatibleModels: { contains: modelName },
      },
      _count: true,
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true },
    });

    const suppliers = await prisma.part.groupBy({
      by: ["supplierId"],
      where: {
        status: "ACTIVE",
        compatibleBrands: { contains: brandName },
        compatibleModels: { contains: modelName },
      },
      _count: true,
    });

    return {
      partCount: stats._count,
      minPrice: stats._min.price ?? 0,
      maxPrice: stats._max.price ?? 0,
      avgPrice: Math.round(stats._avg.price ?? 0),
      supplierCount: suppliers.length,
    };
  }
);

export const getPartsStatsForModelYear = cache(
  async (brandName: string, modelName: string, year: number): Promise<PartsStats> => {
    const stats = await prisma.part.aggregate({
      where: {
        status: "ACTIVE",
        compatibleBrands: { contains: brandName },
        compatibleModels: { contains: modelName },
        compatibleYearFrom: { lte: year },
        compatibleYearTo: { gte: year },
      },
      _count: true,
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true },
    });

    const suppliers = await prisma.part.groupBy({
      by: ["supplierId"],
      where: {
        status: "ACTIVE",
        compatibleBrands: { contains: brandName },
        compatibleModels: { contains: modelName },
        compatibleYearFrom: { lte: year },
        compatibleYearTo: { gte: year },
      },
      _count: true,
    });

    return {
      partCount: stats._count,
      minPrice: stats._min.price ?? 0,
      maxPrice: stats._max.price ?? 0,
      avgPrice: Math.round(stats._avg.price ?? 0),
      supplierCount: suppliers.length,
    };
  }
);
```

**React `cache()`:** Deduplicates calls within same render cycle. Při buildu pro `[brand]/[model]/[2015]` a `[brand]/[model]/[2018]` se model-level lookup zavolá jen jednou.

**Risk:** Při prázdné DB (žádné Parts) `_min/_max/_avg` vrátí `null` → fallback na 0. Page se nerozbije, jen pricing range bude `0 - 0 Kč` (skryjeme v UI pokud `partCount === 0`).

---

### 3.3 `lib/seo/generatePartsLanding.ts` — content factory (template-driven)

**Source of truth: plán-81 §C3.4** (lines 319-366) + úprava pro hybrid cestu C.

```ts
import type { PartsStats } from "./pricingAggregate";
import { PARTS_BRANDS, PARTS_MODELS_BY_BRAND, type PartsModelData } from "@/lib/seo-data";
import type { FaqItem } from "@/lib/seo";

export interface SeoContentDraft {
  pageType: "BRAND" | "MODEL" | "MODEL_YEAR";
  brand: string;
  model?: string;
  year?: number;
  h1: string;
  metaTitle: string;
  metaDesc: string;
  introHtml: string;
  sectionsJson: string; // JSON.stringify({h2, html}[])
  faqJson: string;       // JSON.stringify(FaqItem[])
  aiSnippetText: string;
  quickFacts: string;    // JSON.stringify(string[])
  wordCount: number;
  generatedBy: "template";
}

const UNIVERSAL_FAQS: FaqItem[] = [
  { question: "Jaká je záruka na použité díly?", answer: "Na použité originální díly poskytujeme záruku 3 měsíce. Repasované díly mají záruku 12 měsíců." },
  { question: "Jak rychle doručíte díl?", answer: "Standardní doručení do 2-5 pracovních dnů po celé ČR. U rozměrnějších dílů zajistíme přepravní službu." },
  { question: "Mohu díl vrátit, pokud nesedí?", answer: "Ano, máte 14 dnů na vrácení. Doporučujeme vždy ověřit kompatibilitu přes VIN před objednáním." },
];

/**
 * Generate template-driven SEO content for parts landing page.
 * No LLM dependency — pure template + DB stats interpolation.
 */
export function generatePartsLandingContent(input: {
  pageType: "BRAND" | "MODEL" | "MODEL_YEAR";
  brandSlug: string;
  modelSlug?: string;
  year?: number;
  stats: PartsStats;
}): SeoContentDraft {
  const brandData = PARTS_BRANDS.find((b) => b.slug === input.brandSlug);
  if (!brandData) throw new Error(`Brand ${input.brandSlug} not found`);

  const modelData = input.modelSlug
    ? (PARTS_MODELS_BY_BRAND[input.brandSlug] || []).find((m) => m.slug === input.modelSlug)
    : undefined;

  switch (input.pageType) {
    case "BRAND":
      return generateBrandContent(brandData, input.stats);
    case "MODEL":
      if (!modelData) throw new Error(`Model ${input.modelSlug} not found`);
      return generateModelContent(brandData, modelData, input.stats);
    case "MODEL_YEAR":
      if (!modelData || !input.year) throw new Error("Missing model or year");
      return generateModelYearContent(brandData, modelData, input.year, input.stats);
  }
}

function generateBrandContent(
  brand: { slug: string; name: string },
  stats: PartsStats
): SeoContentDraft {
  const h1 = `Náhradní díly ${brand.name}`;
  const intro = stats.partCount > 0
    ? `Hledáte náhradní díly pro ${brand.name}? Na CarMakler najdete ${stats.partCount} dílů od ${stats.supplierCount} ověřených vrakovišť za ceny od ${stats.minPrice.toLocaleString("cs-CZ")} Kč. Originální použité díly z dárcovských vozů i nové aftermarket alternativy. Všechny díly jsou katalogizovány podle VIN kódu pro maximální kompatibilitu s vaším vozem ${brand.name}.`
    : `Hledáte náhradní díly pro ${brand.name}? Na CarMakler nabízíme originální použité díly z ověřených vrakovišť i nové aftermarket alternativy. Všechny díly jsou katalogizovány podle VIN kódu pro maximální kompatibilitu.`;

  const sections = [
    {
      h2: `Proč nakupovat díly ${brand.name} na CarMakler?`,
      html: `<p>Všichni naši dodavatelé dílů procházejí verifikací. Díly jsou detailně popsány a vyfoceny. Na použité díly poskytujeme záruku funkčnosti. Objednávky doručujeme po celé ČR do 2-5 pracovních dní.</p>`,
    },
    {
      h2: `Cenové rozpětí dílů ${brand.name}`,
      html: stats.partCount > 0
        ? `<p>Aktuální cenové rozpětí dílů ${brand.name} na CarMakler: od <strong>${stats.minPrice.toLocaleString("cs-CZ")} Kč</strong> do <strong>${stats.maxPrice.toLocaleString("cs-CZ")} Kč</strong>. Průměrná cena: <strong>${stats.avgPrice.toLocaleString("cs-CZ")} Kč</strong>. Ceny závisí na typu dílu, generaci modelu a stavu.</p>`
        : `<p>Cenové rozpětí dílů ${brand.name} se průběžně aktualizuje podle dostupnosti na vrakovištích.</p>`,
    },
  ];

  const faq: FaqItem[] = [
    ...UNIVERSAL_FAQS,
    {
      question: `Jsou náhradní díly ${brand.name} kompatibilní s mým vozem?`,
      answer: `Ano, všechny díly jsou katalogizovány podle VIN kódu, generace modelu a roku výroby. Před objednáním vždy ověřte kompatibilitu zadáním VIN nebo specifikací vozu. V případě nejistoty kontaktujte našeho operátora.`,
    },
    {
      question: `Jaké modely ${brand.name} podporujete?`,
      answer: `Na CarMakler najdete díly pro všechny aktuální i starší modely ${brand.name}. Nabídka se denně aktualizuje podle dostupnosti na vrakovištích.`,
    },
  ];

  const aiSnippet = stats.partCount > 0
    ? `Náhradní díly ${brand.name} na CarMakler — ${stats.partCount} dílů od ${stats.supplierCount} vrakovišť, ceny od ${stats.minPrice.toLocaleString("cs-CZ")} Kč. Použité originální i nové aftermarket. Doručení do 5 dnů, záruka 3 měsíce.`
    : `Náhradní díly ${brand.name} na CarMakler — použité originální i nové aftermarket díly od ověřených vrakovišť. Doručení do 5 dnů, záruka 3 měsíce.`;

  const quickFacts = stats.partCount > 0
    ? [
        `${stats.partCount} dílů ${brand.name} na skladě`,
        `${stats.supplierCount} ověřených dodavatelů`,
        `Cenové rozpětí: ${stats.minPrice.toLocaleString("cs-CZ")} – ${stats.maxPrice.toLocaleString("cs-CZ")} Kč`,
        `Průměrná cena: ${stats.avgPrice.toLocaleString("cs-CZ")} Kč`,
        `Záruka 3 měsíce na použité, 12 měsíců na repasované`,
        `Doručení do 2-5 pracovních dnů`,
      ]
    : [
        `Náhradní díly ${brand.name} z ověřených vrakovišť`,
        `Záruka 3 měsíce na použité, 12 měsíců na repasované`,
        `Doručení do 2-5 pracovních dnů`,
        `14 dnů na vrácení`,
      ];

  const wordCount = (intro + sections.map((s) => s.html).join(" ") + faq.map((f) => f.answer).join(" ")).split(/\s+/).length;

  return {
    pageType: "BRAND",
    brand: brand.slug,
    h1,
    metaTitle: `Náhradní díly ${brand.name} | Carmakler`,
    metaDesc: intro.slice(0, 160),
    introHtml: `<p>${intro}</p>`,
    sectionsJson: JSON.stringify(sections),
    faqJson: JSON.stringify(faq),
    aiSnippetText: aiSnippet,
    quickFacts: JSON.stringify(quickFacts),
    wordCount,
    generatedBy: "template",
  };
}

function generateModelContent(
  brand: { slug: string; name: string },
  model: PartsModelData,
  stats: PartsStats
): SeoContentDraft {
  // Similar pattern, model-specific copy
  // Includes generations education ("3. gen 2013-2020 přinesla nový motor 1.5 TSI...")
  // ... (~150 řádků implementace per stejný pattern jako generateBrandContent)
  // FAQ enriched with model-specific Q&As
  // Quick facts include generations + topYears
  // ... DETAIL CODE OUT — implementator postaví podle vzoru
  return {} as SeoContentDraft; // PLACEHOLDER
}

function generateModelYearContent(
  brand: { slug: string; name: string },
  model: PartsModelData,
  year: number,
  stats: PartsStats
): SeoContentDraft {
  // Similar pattern, year-specific copy
  // matchingGen lookup pro generation context
  // Year-specific intro ("V roce 2018 byl model {Model} aktualizován...")
  // Universal FAQs + 1-2 year-specific Q&As
  // ... (~120 řádků implementace)
  return {} as SeoContentDraft; // PLACEHOLDER
}
```

**Pozn pro implementator:** Brand-level je zde rozepsán plně jako template. Model-level a year-level se postaví dle stejného vzoru — implementator si rozpracuje details podle template stylu.

**Word count target per úroveň:**
- BRAND: 150-300 slov intro + 2 sekce + 5 FAQ = ~600-800 slov total
- MODEL: 200-350 slov intro + 3 sekce + 6 FAQ = ~800-1000 slov total
- MODEL_YEAR: 100-200 slov intro + 2 sekce + 4 FAQ = ~400-600 slov total

**Total brand+model+year content cost: $0** (template-only, no LLM).

---

### 3.4 `scripts/generate-parts-seo-content.ts` — gen script

```ts
#!/usr/bin/env tsx
/**
 * Generate SEO content for /dily/znacka/* landing pages.
 *
 * Usage:
 *   npx tsx scripts/generate-parts-seo-content.ts                # generate all (brand + model)
 *   npx tsx scripts/generate-parts-seo-content.ts --dry-run     # print, don't write
 *   npx tsx scripts/generate-parts-seo-content.ts --force       # overwrite existing rows
 *   npx tsx scripts/generate-parts-seo-content.ts --level=BRAND # only brands
 *   npx tsx scripts/generate-parts-seo-content.ts --brand=skoda # only skoda + its models
 *
 * Idempotent: re-run skips existing rows unless --force.
 */

import { prisma } from "@/lib/prisma";
import { PARTS_BRANDS, PARTS_MODELS_BY_BRAND } from "@/lib/seo-data";
import { generatePartsLandingContent } from "@/lib/seo/generatePartsLanding";
import {
  getPartsStatsForBrand,
  getPartsStatsForModel,
} from "@/lib/seo/pricingAggregate";

interface CliArgs {
  dryRun: boolean;
  force: boolean;
  level?: "BRAND" | "MODEL" | "MODEL_YEAR";
  brand?: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
    level: args.find((a) => a.startsWith("--level="))?.split("=")[1] as CliArgs["level"],
    brand: args.find((a) => a.startsWith("--brand="))?.split("=")[1],
  };
}

async function generateBrandLevel(args: CliArgs): Promise<{ generated: number; skipped: number }> {
  let generated = 0;
  let skipped = 0;
  const brands = args.brand ? PARTS_BRANDS.filter((b) => b.slug === args.brand) : PARTS_BRANDS;

  for (const brand of brands) {
    const existing = await prisma.seoContent.findUnique({
      where: {
        pageType_brand_model_year_category: {
          pageType: "BRAND",
          brand: brand.slug,
          model: null,
          year: null,
          category: null,
        },
      },
    });

    if (existing && !args.force) {
      console.log(`SKIP BRAND ${brand.slug} (exists)`);
      skipped++;
      continue;
    }

    const stats = await getPartsStatsForBrand(brand.name);
    const draft = generatePartsLandingContent({
      pageType: "BRAND",
      brandSlug: brand.slug,
      stats,
    });

    if (args.dryRun) {
      console.log(`DRY-RUN BRAND ${brand.slug} (${draft.wordCount} words)`);
    } else {
      await prisma.seoContent.upsert({
        where: {
          pageType_brand_model_year_category: {
            pageType: "BRAND",
            brand: brand.slug,
            model: null,
            year: null,
            category: null,
          },
        },
        create: { ...draftToDbInput(draft) },
        update: { ...draftToDbInput(draft) },
      });
      console.log(`✓ BRAND ${brand.slug} (${draft.wordCount} words)`);
    }
    generated++;
  }

  return { generated, skipped };
}

async function generateModelLevel(args: CliArgs): Promise<{ generated: number; skipped: number }> {
  // Similar pattern: iterate PARTS_MODELS_BY_BRAND, filter by args.brand if set
  // For each (brand, model): check exists, getPartsStatsForModel, generate, upsert
  return { generated: 0, skipped: 0 }; // PLACEHOLDER
}

function draftToDbInput(draft: ReturnType<typeof generatePartsLandingContent>) {
  return {
    pageType: draft.pageType,
    brand: draft.brand,
    model: draft.model ?? null,
    year: draft.year ?? null,
    category: null,
    h1: draft.h1,
    metaTitle: draft.metaTitle,
    metaDesc: draft.metaDesc,
    introHtml: draft.introHtml,
    sectionsJson: draft.sectionsJson,
    faqJson: draft.faqJson,
    aiSnippetText: draft.aiSnippetText,
    quickFacts: draft.quickFacts,
    wordCount: draft.wordCount,
    generatedBy: draft.generatedBy,
  };
}

async function main() {
  const args = parseArgs();
  console.log(`generate-parts-seo-content.ts (dry-run=${args.dryRun}, force=${args.force}, level=${args.level || "ALL"}, brand=${args.brand || "ALL"})`);

  let total = { generated: 0, skipped: 0 };

  if (!args.level || args.level === "BRAND") {
    const r = await generateBrandLevel(args);
    total.generated += r.generated;
    total.skipped += r.skipped;
  }

  if (!args.level || args.level === "MODEL") {
    const r = await generateModelLevel(args);
    total.generated += r.generated;
    total.skipped += r.skipped;
  }

  // MVP: NO MODEL_YEAR pre-seed (template fallback handles it)

  console.log(`\nDone: generated=${total.generated}, skipped=${total.skipped}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

**`package.json` script entry:**
```json
"scripts": {
  ...,
  "seed:seo": "tsx scripts/generate-parts-seo-content.ts"
}
```

**Spuštění (po deploy):**
```bash
# Initial seed
npm run seed:seo

# Force regenerate skoda
npm run seed:seo -- --brand=skoda --force

# Dry run all
npm run seed:seo -- --dry-run
```

---

### 3.5 Page integration — 3 page.tsx úpravy

**Pattern (společný pro všechny 3 templates):**

```ts
// app/(web)/dily/znacka/[brand]/page.tsx (modified)
import { prisma } from "@/lib/prisma";
import { generatePartsLandingContent } from "@/lib/seo/generatePartsLanding";
import { getPartsStatsForBrand } from "@/lib/seo/pricingAggregate";

// ... existing imports

async function getSeoContentForBrand(brandSlug: string, brandName: string) {
  // 1. Try DB
  const existing = await prisma.seoContent.findUnique({
    where: {
      pageType_brand_model_year_category: {
        pageType: "BRAND",
        brand: brandSlug,
        model: null,
        year: null,
        category: null,
      },
    },
  });

  if (existing) {
    return {
      h1: existing.h1,
      metaTitle: existing.metaTitle,
      metaDesc: existing.metaDesc,
      intro: existing.introHtml,
      sections: JSON.parse(existing.sectionsJson) as { h2: string; html: string }[],
      faq: JSON.parse(existing.faqJson) as FaqItem[],
      aiSnippet: existing.aiSnippetText,
      quickFacts: JSON.parse(existing.quickFacts) as string[],
      source: "db" as const,
    };
  }

  // 2. Fallback: template factory
  const stats = await getPartsStatsForBrand(brandName);
  const draft = generatePartsLandingContent({
    pageType: "BRAND",
    brandSlug,
    stats,
  });
  return {
    h1: draft.h1,
    metaTitle: draft.metaTitle,
    metaDesc: draft.metaDesc,
    intro: draft.introHtml,
    sections: JSON.parse(draft.sectionsJson),
    faq: JSON.parse(draft.faqJson),
    aiSnippet: draft.aiSnippetText,
    quickFacts: JSON.parse(draft.quickFacts),
    source: "template" as const,
  };
}

export async function generateMetadata({ params }) {
  const { brand } = await params;
  const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
  if (!brandData) return {};
  const seo = await getSeoContentForBrand(brand, brandData.name);
  return {
    title: seo.metaTitle,
    description: seo.metaDesc,
    alternates: pageCanonical(`/dily/znacka/${brand}`), // existing helper from #135
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDesc,
      url: `${BASE_URL}/dily/znacka/${brand}`,
      type: "website",
    },
  };
}

export default async function PartsBrandPage({ params }) {
  const { brand } = await params;
  const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
  if (!brandData) notFound();

  const seo = await getSeoContentForBrand(brand, brandData.name);
  const models = PARTS_MODELS_BY_BRAND[brand] || [];
  const { parts: topParts } = await getTopPartsForBrand(brandData.name);

  // ... JSON-LD generators (use seo.faq instead of UNIVERSAL_FAQS)
  // ... render seo.intro, seo.sections, seo.faq, seo.quickFacts
}
```

**Klíčové změny v page.tsx:**
1. Replace hardcoded `UNIVERSAL_FAQS` → `seo.faq` (DB or template)
2. Replace generic SEO content stub → `seo.sections.map((s) => <section><h2>{s.h2}</h2><div dangerouslySetInnerHTML={{__html: s.html}}/></section>)`
3. Replace generic hero → `<div dangerouslySetInnerHTML={{__html: seo.intro}}/>`
4. Add quick facts panel: `<ul>{seo.quickFacts.map((f) => <li>{f}</li>)}</ul>`
5. JSON-LD FAQPage uses `seo.faq` (already-mapped from DB or template)
6. metadata uses `seo.metaTitle`, `seo.metaDesc`

**Pozor:** `dangerouslySetInnerHTML` vyžaduje **sanitization** — content je generován template factory v naší codebase (no user input), takže riziko XSS = 0. Pokud někdy přidáme user-editable content přes admin panel, sanitize přes `isomorphic-dompurify` (už v deps).

---

## 4 — Affected files (audit)

### 4.1 NEW files (5)

| # | Soubor | Účel | LoC est |
|---|--------|------|---------|
| 1 | `prisma/migrations/{ts}_add_seo_content/migration.sql` | Auto-generated DDL | ~20 |
| 2 | `lib/seo/pricingAggregate.ts` | DB stats helpers | ~150 |
| 3 | `lib/seo/generatePartsLanding.ts` | Template-driven content factory | ~400 |
| 4 | `scripts/generate-parts-seo-content.ts` | Idempotent gen script | ~200 |
| 5 | `lib/seo/seoContent.ts` (volitelně) | DB fetch + fallback wrapper | ~80 |

**Total new code: ~850 LoC**

### 4.2 MODIFIED files (5)

| # | Soubor | Změny | Lines edited |
|---|--------|-------|--------------|
| 1 | `prisma/schema.prisma` | + `model SeoContent { ... }` | +30 |
| 2 | `package.json` | + `"seed:seo": "tsx ..."` | +1 |
| 3 | `app/(web)/dily/znacka/[brand]/page.tsx` | DB content fetch + render | ~50 line edits |
| 4 | `app/(web)/dily/znacka/[brand]/[model]/page.tsx` | DB content fetch + render | ~60 line edits |
| 5 | `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` | DB content fetch + render | ~55 line edits |

**Total edits: ~196 lines**

### 4.3 NOT modified (důležité!)

- ❌ `lib/seo-data.ts` — žádné nové fieldy v PartsModelData (zachováme stub structure, content je v DB)
- ❌ `lib/seo.ts` — žádné nové JSON-LD generators (FAQPage existuje, jen receiver změní z `UNIVERSAL_FAQS` na `seo.faq`)
- ❌ `app/(web)/dily/page.tsx` (root) — root page je samostatný #87d
- ❌ `app/(web)/dily/kategorie/*` — category pages out of scope #87c (CATEGORY pageType je future)
- ❌ `prisma/seed.ts` — žádný change (gen script je samostatný, runs after deploy)
- ❌ `app/api/revalidate/*` — on-demand revalidation je #87d
- ❌ `lib/prisma.ts` — singleton existuje, žádný change

---

## 5 — Acceptance criteria

| AC | Criterion | Test/verify |
|----|-----------|-------------|
| **AC1** | `prisma/schema.prisma` obsahuje `model SeoContent` s field set per §3.1 | `grep "model SeoContent" prisma/schema.prisma` |
| **AC2** | `npx prisma migrate dev --name add_seo_content` projde úspěšně | exit code 0, migration soubor created |
| **AC3** | `npx prisma generate` projde, `prisma.seoContent` je dostupný v Prisma Client | `grep "seoContent" node_modules/.prisma/client/index.d.ts` |
| **AC4** | `lib/seo/pricingAggregate.ts` exportuje `getPartsStatsForBrand`, `getPartsStatsForModel`, `getPartsStatsForModelYear` všechny obalené `cache()` | manual code review |
| **AC5** | `lib/seo/generatePartsLanding.ts` exportuje `generatePartsLandingContent({ pageType, brandSlug, modelSlug?, year?, stats })` se 3 mode (BRAND/MODEL/MODEL_YEAR) | `npx tsx -e "import {generatePartsLandingContent} from './lib/seo/generatePartsLanding.ts'; console.log(generatePartsLandingContent({pageType:'BRAND', brandSlug:'skoda', stats:{partCount:0,minPrice:0,maxPrice:0,avgPrice:0,supplierCount:0}}))"` |
| **AC6** | `scripts/generate-parts-seo-content.ts` lze spustit, podporuje `--dry-run`, `--force`, `--level=BRAND`, `--brand=skoda` flagy | `npm run seed:seo -- --dry-run` |
| **AC7** | `npm run seed:seo -- --dry-run` v prázdné DB vypíše 32 entries (8 brands + 24 models), 0 errors | stdout obsahuje "DRY-RUN BRAND skoda", ..., "DRY-RUN MODEL skoda octavia", ..., "Done: generated=32, skipped=0" |
| **AC8** | `npm run seed:seo` v prázdné DB skutečně vytvoří 32 SeoContent rows | `npx prisma studio` ukazuje 32 rows v SeoContent tabulce |
| **AC9** | Re-run `npm run seed:seo` (bez `--force`) skipne všech 32 (idempotence) | stdout: "Done: generated=0, skipped=32" |
| **AC10** | `npm run seed:seo -- --brand=skoda --force` přepíše Skoda brand + Skoda models (4 rows) | stdout: "Done: generated=4, skipped=0" |
| **AC11** | `app/(web)/dily/znacka/skoda/page.tsx` po build načte SeoContent z DB (verify v build log: žádný "fallback to template" warning pro existing brand) | `npm run build` + grep stdout |
| **AC12** | `app/(web)/dily/znacka/skoda/page.tsx` při prázdné `SeoContent` DB tabulce nespadne, použije template fallback | DELETE z DB → curl `/dily/znacka/skoda` → HTTP 200, content rendered |
| **AC13** | Stránka `/dily/znacka/skoda` má v `<head>` `<title>` z `seo.metaTitle` (DB nebo template), ne starý hardcoded title | `curl -s http://localhost:3000/dily/znacka/skoda | grep '<title>'` |
| **AC14** | Stránka `/dily/znacka/skoda` má FAQPage JSON-LD s **5 FAQ items** (3 universal + 2 brand-specific z template/DB) místo 3 | `curl -s http://localhost:3000/dily/znacka/skoda | grep -A 200 'FAQPage' | grep -c '"Question"'` → 5 |
| **AC15** | `npm run build` projde úspěšně, build log ukazuje **stejný SSG count jako baseline** (~532 routes pod `/dily/znacka/`) | `npm run build` + grep "Generating static pages" |
| **AC16** | `npm run lint` PASS — 0 errors v 5 nových + 5 modified files | `npm run lint` |
| **AC17** | `npm run typecheck` (`npx tsc --noEmit`) PASS — 0 type errors | `npm run typecheck` |
| **AC18** | `npm run test:run` (vitest) PASS — žádné regrese (pokud existují existing seo testy) | `npm run test:run` |

---

## 6 — Estimated effort

**Total:** ~10-14 h dev work + ~2 h verify + retest.

| Phase | Krok | Effort | Dependencies |
|-------|------|--------|--------------|
| **Phase 1: Foundation (3h)** | | | |
| 1.1 | Edit `prisma/schema.prisma` — add SeoContent model | 30 min | — |
| 1.2 | `npx prisma migrate dev --name add_seo_content` | 15 min | 1.1 |
| 1.3 | `npx prisma generate` + verify Prisma Studio | 15 min | 1.2 |
| 1.4 | Build `lib/seo/pricingAggregate.ts` (3 helper functions) | 1.5 h | Part model verified |
| 1.5 | Smoke test pricingAggregate via tsx CLI | 30 min | 1.4 |
| **Phase 2: Content factory (3h)** | | | |
| 2.1 | Build `lib/seo/generatePartsLanding.ts` BRAND mode | 1 h | 1.5 |
| 2.2 | Build `lib/seo/generatePartsLanding.ts` MODEL mode | 1 h | 2.1 |
| 2.3 | Build `lib/seo/generatePartsLanding.ts` MODEL_YEAR mode | 30 min | 2.2 |
| 2.4 | Smoke test generatePartsLandingContent | 30 min | 2.3 |
| **Phase 3: Generation script (2h)** | | | |
| 3.1 | Build `scripts/generate-parts-seo-content.ts` (BRAND + MODEL levels) | 1.5 h | 2.4 |
| 3.2 | `package.json` script entry + smoke `npm run seed:seo -- --dry-run` | 15 min | 3.1 |
| 3.3 | Verify idempotence + flag tests | 15 min | 3.2 |
| **Phase 4: Page integration (3h)** | | | |
| 4.1 | Modify `[brand]/page.tsx` — DB fetch + fallback + render | 1 h | 3.3 |
| 4.2 | Modify `[brand]/[model]/page.tsx` — same pattern | 1 h | 4.1 |
| 4.3 | Modify `[brand]/[model]/[rok]/page.tsx` — same pattern | 1 h | 4.2 |
| **Phase 5: Verify (2h)** | | | |
| 5.1 | `npm run build` — verify SSG count + no errors | 15 min | 4.3 |
| 5.2 | `npm run lint && npm run typecheck && npm run test:run` | 15 min | 5.1 |
| 5.3 | Curl test AC11-AC14 (manual) | 30 min | 5.2 |
| 5.4 | Run gen script: `npm run seed:seo` (live DB), verify AC8-AC10 | 30 min | 5.3 |
| 5.5 | Final build with populated SeoContent + verify AC11 | 30 min | 5.4 |
| **Phase 6: Commit (1h)** | | | |
| 6.1 | Commit + push | 30 min | 5.5 |
| 6.2 | Test-chrome dispatch (#140 retest scope: brand/model/year pages) | 30 min | 6.1 |

**Total dev:** ~11 h.
**Total + verify + commit:** ~14 h.

**Deps:** `@prisma/client` ✓, `tsx` ✓ (used in `prisma/seed.ts`), `react` `cache()` ✓, **žádné nové npm packages**.

---

## 7 — Risk analysis

| Risk | Pravděpodobnost | Dopad | Mitigation |
|------|-----------------|-------|------------|
| Migration drift na production DB | Low | High | Standard `npx prisma migrate deploy` v CD pipeline; #45a fix existoval pro searchVector indexes — verify clean migrate locally first |
| `compatibleBrands` substring match nepřesný | Med | Low | Known limitation, doc v `pricingAggregate.ts` JSDoc, #87d JSONB cast follow-up |
| Build performance regrese > 30s | Low | Med | React `cache()` deduplikace; pricing queries jsou rychlé (~5-15ms); pokud problém, dispatch monitoring task |
| Page render fail při empty stats (partCount=0) | Med | Low | Template factory má `partCount > 0` ternary fallback ve všech stringozech; UI hide pricing panel pokud `partCount === 0` |
| `dangerouslySetInnerHTML` XSS | Low | High | Content je server-side template factory output (no user input); pokud admin panel přibude → sanitize přes `isomorphic-dompurify` |
| Long-form content parser fail (JSON.parse na malformed sectionsJson) | Low | Med | Generation script vždy `JSON.stringify(...)` strukturovaný objekt; defensive `try/catch` v page.tsx s fallback `{ sections: [] }` |
| `seoContent` Prisma type missing po `prisma generate` | Low | High | Verify v AC3 grep `seoContent` v generated types; če chybí, re-run `npx prisma generate` (Prisma 7 občas vyžaduje druhý pass) |
| MODEL_YEAR ~500 SSG queries během build pomalu | Low | Med | MODEL_YEAR NEMÁ DB row (per §2.3), jen template factory call → no DB hit per year page (jen `getPartsStatsForModelYear` query) |
| Initial SeoContent JSON validation chyby (faqJson invalid JSON) | Low | Low | Generation script vždy generuje validní JSON; defensive parse v page.tsx |
| #87b runtime bugfixy (#132) konflikt s page.tsx edits | None | None | #132 commit 3666bad merged a verified test-chrome #136 PASS |

---

## 8 — Open questions pro team-leada

> **STATUS: ✅ ALL LEAD-APPROVED (2026-04-07)** — team-lead schválil všechna doporučení v přímé message ("Plán #139 viděn, díky. ... Schvaluji všechna doporučení"). Plus potvrzeno field naming z plan-81 §C3.2 nad ad-hoc dispatch naming. #87c IMPL (#97) NEDISPATCHOVAT bez explicit user "jeď" — user status: "naštvaný že celý den nic neuděláno", právě deployli #87b + #127 fix LIVE, standby mode.

### Q1 — Cesta architektury: A (DB), B (static), C (hybrid)?

**Doporučení:** **Cesta C — Hybrid.** Static `lib/seo-data.ts` zachová structural data (PARTS_MODELS_BY_BRAND, generations, topYears — už existuje z #87b), DB `SeoContent` pro long-form content. Render-time template fallback eliminuje DB-down riziko + umožňuje on-demand year-level content bez pre-seed.

**Alternativa A:** Pure DB. Plus admin UI ready, ale 500 build queries + závislost na DB connection při buildu.

**Alternativa B:** Pure static. Plus zero DB ops, ale mass-edit 4600 entries v lib file = unmaintainable.

**✅ LEAD DECISION (2026-04-07):** Cesta C (Hybrid) APPROVED. Team-lead verbatim: *"Q1: Strategie C (Hybrid) ✅ — static seo-data + DB SeoContent + render-time template fallback. Build resilient = priorita."*

### Q2 — Initial seed scope: jen brand+model (32) nebo i model_year (~500)?

**Doporučení:** **Brand+model only (32)**. Year level použít template factory fallback. Důvod: 500 row pre-seed = 500 unique long-form content entries, vyšší údržbová zátěž bez měřitelného SEO benefitu (year pages mají low traffic per page). Lze pre-seedovat top 50 year combinations v #87c-v2 po analytics.

**Alternativa:** Pre-seed všech ~500 year combinations. **Náklady:** ~5 min gen script run, ~2 MB DB rows, ale ROI nejistý.

**✅ LEAD DECISION (2026-04-07):** 32 entries (8B+24M) APPROVED, žádný model_year pre-seed. Team-lead verbatim: *"Q2: 32 entries (8B+24M) ✅ — žádný pre-seed model_year, template factory to pokrývá at render time. Souhlasím s tvojí logikou (~500 kombinací × manuální seed = waste, fallback je deterministic)."*

### Q3 — Claude API enhancement — v #87c nebo defer na #87c-v2?

**Doporučení:** **Defer na #87c-v2.** MVP $0 cost s template factory. Claude enhancement (long-form natural-language paragraphs, varied wording per brand) může přijít po měření jak template content performuje v Search Console (4-8 týdnů post-deploy).

**Alternativa:** Include Claude v #87c. **Náklady:** ~$1.5 pro 32 entries (per plán-81 §C3.1), +2-3h implementační čas, ale nejistý ROI bez baseline metrics.

**✅ LEAD DECISION (2026-04-07):** Defer Claude API do #87c-v2 APPROVED. Template-only MVP. Team-lead verbatim: *"Q3: Defer Claude API do #87c-v2 ✅ — $0 MVP, žádný API call v #87c. Template-only."*

### Q4 — `compatibleBrands` substring match — accept v #87c nebo #87d JSONB cast?

**Doporučení:** **Accept v #87c**, defer JSONB refactor na #87d. Substring match má **known false positive** (`"Škoda"` matchne `"Škoda Roomster"`), ale pro cenové aggregations je impact malý (Roomster je sub-brand Škoda, takže pricing je stále reasonable).

**Alternativa:** Migrate `compatibleBrands` z `String?` na `String[]` (PostgreSQL native array) v #87c. **Náklady:** +2-3h, breaking schema change, vyžaduje data migration script.

**✅ LEAD DECISION (2026-04-07):** Accept v #87c (P3 known limitation), JSONB refactor defer do #87d. Team-lead verbatim: *"Q4: JSONB cast compatibleBrands defer do #87d ✅ — substring false positives jako 'Škoda Roomster' vs 'Škoda' je akceptovaná known limitation pro #87c. Dokumentuj v plánu jako P3."* → implementator MUSÍ přidat komentář v `lib/seo/pricingAggregate.ts` flagující tuto limitation jako **P3 known limitation** s odkazem na #87d follow-up.

### Q5 — `dangerouslySetInnerHTML` v page.tsx — povoleno nebo render přes JSX?

**Doporučení:** **Povoleno** pro `seo.intro` (HTML p tag wrapper) a `seo.sections.html` (rich content), protože content je čistě server-side generovaný v naší codebase (no user input → no XSS risk). FAQ rendering zůstane JSX (structured `<details>` element).

**Alternativa:** Server-side parse HTML → React elements (např. `react-html-parser`). **Náklady:** +new dep, +CPU overhead na build, no security benefit pro server-only generated content.

**✅ LEAD DECISION (2026-04-07):** `dangerouslySetInnerHTML` APPROVED pro template-generated `introHtml`. Team-lead verbatim: *"Q5: dangerouslySetInnerHTML pro introHtml ✅ ANO — template-generated obsah je trusted source (žádný user input), žádný XSS surface. Generovaný HTML projde Zod validací v gen scriptu."* → **ADDITIONAL REQUIREMENT pro implementatora:** gen script `scripts/generate-parts-seo-content.ts` MUSÍ přidat Zod schema validation na generated HTML output před DB upsert (whitelist allowed tags: `<p>`, `<h2>`, `<h3>`, `<ul>`, `<li>`, `<strong>`, `<em>`, `<a>`). Validation failure → script exit non-zero.

### Q6 — Component refactor — extrahovat common SEO sections do `<PartsSeoContent>` shared component?

**Doporučení:** **NE v #87c** — keep page.tsx self-contained. Refactor na shared component je optimalizace pro #87d (kde se přidává 9 H2 brand expansion → tam dává smysl shared layout).

**Alternativa:** Vytvořit `components/web/dily/PartsSeoContent.tsx` v #87c. **Náklady:** +1h refactor, ale 3 templates jsou stále 3 separate page.tsx — DRY win nepřevažuje nad scope-keeping.

**✅ LEAD DECISION (2026-04-07):** Žádný komponentní refaktor v #87c APPROVED. Team-lead verbatim: *"Q6: Žádný komponentní refaktor v #87c ✅ — page templates zůstávají s inline JSX, jen volají getSeoContentForBrand(). Refaktor je separate task pokud někdy bude potřeba."*

### Q7 (emergent) — Field naming: plan-81 §C3.2 vs dispatch ad-hoc?

**✅ LEAD DECISION (2026-04-07):** Plan-81 §C3.2 field naming APPROVED (`pageType`, `metaTitle`, `introHtml`, `sectionsJson`, `aiSnippetText`, `quickFacts`, `wordCount`, `generatedBy`, `generatedAt`), **NE** dispatch ad-hoc naming (`level`, `heroTitle`, `aboutText`, `relatedCopy`, `metaDescription`). Team-lead verbatim: *"Field naming z plan-81 §C3.2 ✅ — souhlasím, použij pageType, metaTitle, introHtml, sectionsJson, aiSnippetText. Konzistence s evžen-the-king spec'em má přednost před mým ad-hoc namingem v dispatchi."*

### §8a — Lead's additional implementator requirements (derived from Q4+Q5)

Implementator MUSÍ při #87c IMPL dispatch:

1. **P3 known limitation komentář** v `lib/seo/pricingAggregate.ts` — dokumentovat substring false positive risk s explicit TODO(#87d) pro JSONB cast refactor
2. **Zod HTML schema** v `scripts/generate-parts-seo-content.ts` — whitelist allowed tags, fail script on invalid HTML output (před DB upsert)
3. **Gen script `--validate-only` flag** (derived from Zod schema) — umožní QA před skutečným seed runem
4. **#87c IMPL NEDISPATCHOVAT bez explicit user "jeď"** — team-lead: *"User je naštvaný že 'celý den nic neudělaný' — právě jsme deployli #87b + #127 fix LIVE na carmakler.cz, takže status je 'deploy hotov, čekáme co dál'."*

---

## 9 — Implementation order (phases summary)

```
Phase 1: Foundation (3h)
   ↓
Phase 2: Content factory (3h)
   ↓
Phase 3: Generation script (2h)
   ↓
Phase 4: Page integration (3h)
   ↓
Phase 5: Verify (2h)
   ↓
Phase 6: Commit + test-chrome dispatch (1h)
```

**Critical path:** Phase 1 → 2 → 3 → 4 sequentially. Phase 5 verify lze paralelizovat (lint + typecheck + test:run + curl tests).

**No parallelism opportunities** mezi phases (každá závisí na předchozí).

---

## 10 — Souhrn pro team-leada (TL;DR)

**Co plán dodává:**
- Prisma `SeoContent` model + migration (additive, no breaking)
- Content factory `generatePartsLanding.ts` (template-driven, $0 MVP cost)
- Pricing aggregations `pricingAggregate.ts` (Part model substring queries)
- Generation script `scripts/generate-parts-seo-content.ts` (idempotent, flag-driven)
- 3 page.tsx integration (DB fetch + template fallback)
- 18 acceptance criteria

**Architektonický klíč:** Hybrid Cesta C — DB pro long-form content, static pro structural data, render-time template fallback. Build resilient, $0 MVP cost, future Claude enhancement ready.

**Co plán NEMĚNÍ:**
- ✅ #87b 3-segment routing — beze změny
- ✅ #132 dynamicParams=false na rok page — beze změny
- ✅ #135 canonical helper — page.tsx pattern stejný (jen content fetch nový)
- ✅ `lib/seo-data.ts` PartsModelData — stub structure zachován
- ✅ JSON-LD generators v `lib/seo.ts` — beze změny

**Co plán NEŘEŠÍ (out of scope):**
- ❌ On-demand revalidation API → #87d
- ❌ 9 H2 brand expansion → #87d
- ❌ Claude API enhancement → #87c-v2 nebo budoucí
- ❌ JSONB refactor `compatibleBrands` → #87d
- ❌ Admin UI pro content editing → daleký roadmap
- ❌ CATEGORY pageType (`/dily/kategorie/*` content) → samostatný #87f

**Effort:** ~10-14 h dev work + 2 h verify. Žádné nové npm deps, žádné breaking schema changes.

**Risk:** Nízký. Všechny změny additive, template fallback eliminuje DB-down riziko, build perf overhead ~5-10s acceptable.

**Návaznost:**
- **Unblock #87d** (on-demand revalidation API + 9 H2 brand expansion) — #87d může dispatchnout paralelně s #87c IMPL pokud #87c-1.4 (pricingAggregate) je hotový, jinak post-#87c
- **Unblock #87e** (geo-benchmark.md + monitoring) — paralelní s #87c (#87e jen docs)
- **#88 IMPL** (AI Part Scanner) je nezávislý

**Rozhodovací bod pro team-leada:** ~~Schválit Strategii C (Hybrid) + Q1-Q6 rozhodnutí.~~ **✅ APPROVED 2026-04-07** — viz §8 audit trail. #87c IMPL dispatch čeká na explicit user "jeď".

---

**Next steps:**
1. ~~Lead reviews + rozhoduje Q1-Q6~~ ✅ DONE (2026-04-07)
2. **Čekáme na user "jeď"** — team-lead NEDISPATCHUJE #87c IMPL bez explicit user green-lightu (user status: "naštvaný že celý den nic neuděláno", právě deployli #87b + #127 fix LIVE)
3. Po user green-light: TaskUpdate #97 (#87c IMPL) → unblock + dispatch implementatorovi s odkazem na tento plán
4. Post #87c IMPL: kontrolor + evžen review + test-chrome
5. Po commit: dispatch #87d IMPL (revalidation API) a/nebo #87e DOCS (geo-benchmark)
