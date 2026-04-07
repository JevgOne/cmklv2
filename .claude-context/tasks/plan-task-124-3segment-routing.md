---
name: Plán #124 — #87b 3-segment routing /dily/[brand]/[model]/[rok]
description: Extract dedicated implementační plán pro #87b z plan-task-81 §C1-D2 + impl-task-87a, s konkrétní routing strukturou, generateStaticParams strategií, JSON-LD a AC pro dispatch developerovi
type: plan
task_id: 124
queue_id: 96
parent_plan: plan-task-81.md (§C1.2-C1.4, C2.1-C2.3, D1.1, D2.1, D2.2)
related_impl: impl-task-87a.md (lib/seo/slugify.ts, lib/seo.ts foundations)
related_tasks:
  - "#87b IMPL (#96) — implementace tohoto plánu"
  - "#87c IMPL (#97) — Prisma SeoContent model + content gen (paralelní/post)"
  - "#87d IMPL (#98) — On-demand revalidation API + 9 H2 expansion (post)"
revision_history:
  - 2026-04-07 — initial extraction (planovac, dispatch #124 #96)
---

# Plán #124 — #87b 3-segment routing /dily/[brand]/[model]/[rok]

> **Cíl plánu:** Konkrétní implementační blueprint pro #87b IMPL (queue #96) — refaktor existující `app/(web)/dily/znacka/[slug]/` na 3-segment routing `[brand]/[model]/[rok]` + nové page templates pro `/model` a `/model/rok`. Plán je extrahován z `plan-task-81.md` §C1-D2 a aktualizován o stav po `impl-task-87a.md` (#91).

---

## 0 — Executive summary (TL;DR)

**Refaktor existujícího routingu:**
- `app/(web)/dily/znacka/[slug]/` → `app/(web)/dily/znacka/[brand]/`
- + nová úroveň `[brand]/[model]/page.tsx`
- + nová úroveň `[brand]/[model]/[rok]/page.tsx`

**Statická generace přes seed (NE DB groupBy):**
- `PARTS_BRANDS` (8 značek, existuje) × `PARTS_MODELS_BY_BRAND` (~30 modelů, **vytvořit v tomto plánu**) × top 3 roky `[2015, 2018, 2020]`
- = **8 brand pages + ~30 model pages + ~90 model+rok pages = ~128 SSG pages**
- Dynamic fallback (`dynamicParams = true`) pro long-tail kombinace

**Render strategy:**
- `dynamic = "force-static"` + `revalidate = 86400` (24h ISR) per všechny 3 templates
- `dynamicParams = true` na model + model/rok (ne na brand — brand seznam je uzavřený)

**Slug strategy:**
- Reuse `lib/seo/slugify.ts` z #87a (`slugify()` + `aliasFor()`)
- Brand slugs jsou už canonical (`skoda`, `volkswagen`, ...) — žádný redirect needed
- Model slugs canonical přes seed (`octavia`, `golf`, ...) + `aliasFor()` 301 redirect na non-canonical input
- Rok = number string, regex validace `/^\d{4}$/` v range 2000-2025

**Out of scope (jiné #87 follow-up tasks):**
- ❌ Prisma `SeoContent` model + content gen → **#87c IMPL** (queue #97)
- ❌ On-demand revalidation API + 9 H2 brand expansion → **#87d IMPL** (queue #98)
- ❌ docs/geo-benchmark.md + monitoring → **#87e DOCS** (queue #99)

**Estimate pro #87b IMPL:** ~10-13 h dev work. Z toho 4h seed data (PARTS_MODELS_BY_BRAND), 3h templates, 2h JSON-LD generators, 2h tests + build verify.

---

## 1 — Background + cíl

### 1.1 Proč #87b potřebujeme

`impl-task-87a.md` (#91) implementoval **SEO MVP slice** — diakritika utility, per-vrakoviště landing, sitemap, llms.txt, JSON-LD foundation. Záměrně **vynechal 3-segment routing** (rename `[slug]` → `[brand]` + nové úrovně), protože scope #91 byl deliberately scoped jako MVP s nejnižším riskem.

`plan-task-81.md` §C1.2-C1.4 (master SEO plán z #79) definuje cílovou URL strukturu Carmakler /dily:

```
/dily/znacka/{brand}                       → brand landing (existuje, rozšířit)
/dily/znacka/{brand}/{model}               → model landing (NOVÉ)
/dily/znacka/{brand}/{model}/{rok}         → model+rok landing (NOVÉ)
```

Bez 3-segment routingu nemůžeme generovat `~128 SEO landing pages` které jsou **business case pro #79 SEO+GEO plán** (předpokládaný traffic boost: long-tail Czech automotive search jako "díly skoda octavia 2018").

### 1.2 Cíl #87b IMPL

**Hlavní deliverable:** Funkční 3-segment routing s pre-built top kombinacemi přes seed data, fallback ISR pro long-tail, full JSON-LD (BreadcrumbList + ItemList + FAQPage placeholder + Organization), korektní canonical URLs, sitemap rozšíření.

**NE deliverable:** Plný content (long-form text), Prisma SeoContent model, AI-generated descriptions — to je #87c.

### 1.3 Scope decision: 3-level vs 4-level

Per `plan-task-81.md` §C1.1 — Carmakler používá **3-level (brand → model → rok)** místo Autodoc 4-level (brand → model → generation → engine), protože:
1. Vrakoviště zadávají díly přes PWA s minimální compatibility data (`compatibleBrands`, `compatibleModels`, `compatibleYearFrom/To`) — engine kód není v MVP datech
2. Engine-level filter zůstane jako **query param** na model stránce (`?motor=2.0-tdi`) — žádné nové stránky

**4. level (engine) je out of scope #87b** a přichází v úvahu jen post-#88 AI Part Scanner (auto-fill engine kód z VIN/štítku).

---

## 2 — Routing struktura — folder layout

### 2.1 Aktuální stav (po #87a)

```
app/(web)/dily/znacka/
└── [slug]/                  ← existuje, 167 řádků page.tsx
    ├── error.tsx
    ├── loading.tsx
    └── page.tsx              ← `params.slug` → najde brand v PARTS_BRANDS, vyrenderuje brand landing
```

**Co page.tsx aktuálně dělá:**
- `generateStaticParams()` → mapuje `PARTS_BRANDS` na `{ slug }` array (8 SSG pages)
- `generateMetadata()` → title `Díly {brand.name} | Náhradní díly — CarMakler`
- Render: breadcrumb, hero, categories grid, SEO content, other brands grid, CTA
- JSON-LD: jen `BreadcrumbList` (z `generateBreadcrumbJsonLd`)

**Co chybí (per plán-81 §C1.3 Template 1):**
- ItemList (top 15 dílů)
- FAQPage
- Organization JSON-LD
- Pricing aggregations (min/max/avg)
- Models grid (4-8 top models s linky → DOPLNÍ #87b)
- Per-brand long-form content (9 H2 sekcí)

→ **Per plán-81 §E1.2 a §E2.1 — brand page rozšíření je #87b scope.** Template 2 (model) + Template 3 (model+rok) jsou nové.

### 2.2 Cílový stav (po #87b)

```
app/(web)/dily/znacka/
└── [brand]/                          ← rename z [slug]/
    ├── error.tsx                     ← existuje, kopíruje
    ├── loading.tsx                   ← existuje, kopíruje
    ├── page.tsx                      ← existuje, MODIFIKOVAT (params.slug → params.brand + rozšíření o ItemList, FAQ, Organization, models grid, pricing)
    └── [model]/
        ├── error.tsx                 ← NOVÉ
        ├── loading.tsx               ← NOVÉ
        ├── page.tsx                  ← NOVÉ — model landing template
        └── [rok]/
            ├── error.tsx             ← NOVÉ
            ├── loading.tsx           ← NOVÉ
            └── page.tsx              ← NOVÉ — model+rok landing template
```

### 2.3 Routing rename: `[slug]` → `[brand]`

Per `plan-task-81.md` §C2.3 (line 213-223), refaktor je **pure mechanical rename**:

1. `git mv app/(web)/dily/znacka/{[slug],[brand]}` (zachová git history)
2. V `page.tsx`:
   - `params: Promise<{ slug: string }>` → `params: Promise<{ brand: string }>`
   - `const { slug } = await params;` → `const { brand } = await params;`
   - `PARTS_BRANDS.find((b) => b.slug === slug)` → `PARTS_BRANDS.find((b) => b.slug === brand)`
   - `PARTS_BRANDS.filter((b) => b.slug !== slug)` (other brands grid) → `b.slug !== brand`
3. **Stávajících 8 brand pages funguje stejně** — slugy se nemění (`skoda`, `volkswagen`, atd.). **Žádný 301 redirect needed** (URLs identical).

**Test po rename:** `npm run build` musí pre-buildnout 8 brand pages stejně jako dřív.

### 2.4 Decision: Variant A (nested folders) vs Variant B (catch-all)

| Variant | Folder | Pros | Cons |
|---|---|---|---|
| **A: Nested folders** ✅ | `[brand]/[model]/[rok]/page.tsx` | Type-safe per-route params, jasná hierarchie, 3 separate templates s vlastním layoutem, separate `loading.tsx` a `error.tsx` per úroveň | Více souborů (3 page.tsx + 3 loading + 3 error = 9) |
| **B: Catch-all** ❌ | `[...slug]/page.tsx` (params.slug = string[]) | Méně souborů (1) | Manuální param parsing, runtime branching, žádný type safety per úroveň, 1 loading state pro všechny úrovně |

**Decision:** **Variant A** — per plán-81 §C2.1 (line 142-158) explicitly navrhuje nested folder layout. Type safety + per-úroveň loading/error je klíčové pro UX.

---

## 3 — Slug generation strategy

### 3.1 Reuse existující utility z #87a

`lib/seo/slugify.ts` (existuje z #87a, 58 řádků):
- `slugify(input)` — `Škoda` → `skoda`, `Citroën` → `citroen`, `Mercedes-Benz` → `mercedes-benz`
- `aliasFor(input)` — vrátí canonical jen pokud se liší (jinak `null`); caller volá `permanentRedirect()`

**Per `impl-task-87a.md` §"Odchylky 3":** `aliasFor()` se v #87a nepoužilo — per-vrakoviste page používá `Partner.slug @unique` (DB-canonical). **Use case `aliasFor()` přijde právě v #87b** — kde `škoda` → 301 → `skoda`.

### 3.2 Brand slug handling

Brand slugs jsou už canonical (z `PARTS_BRANDS` const v `lib/seo-data.ts` line 1226-1235):

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

**Logika v `[brand]/page.tsx`:**

```ts
import { permanentRedirect, notFound } from "next/navigation";
import { aliasFor } from "@/lib/seo/slugify";

const { brand } = await params;

// 1. Detekce alias (např. uživatel zadá `škoda` → redirect na `skoda`)
const canonical = aliasFor(brand);
if (canonical) {
  permanentRedirect(`/dily/znacka/${canonical}`);
}

// 2. Whitelist check
const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
if (!brandData) notFound();
```

**Pozn.:** Pokud uživatel zadá nesmysl (`brand = "xyz"`), `aliasFor("xyz")` vrátí `null` (už je v canonical formě), `find()` vrátí `undefined`, `notFound()` 404. ✅ Correct.

### 3.3 Model slug handling

Model slugs jsou v **seed datech `PARTS_MODELS_BY_BRAND`** (vytvořit v #87b — viz §4 níže). Logika identická s brand:

```ts
const { brand, model } = await params;

const modelCanonical = aliasFor(model);
if (modelCanonical) {
  permanentRedirect(`/dily/znacka/${brand}/${modelCanonical}`);
}

const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
if (!brandData) notFound();

const modelData = (PARTS_MODELS_BY_BRAND[brand] || []).find((m) => m.slug === model);
if (!modelData) notFound(); // Unknown model → 404 (NE alias detekce, jen whitelist)
```

### 3.4 Rok validation

Rok není slug — je to číslo. Validace přes regex + range:

```ts
const { brand, model, rok } = await params;

// Numeric validation
if (!/^\d{4}$/.test(rok)) notFound();
const rokNum = parseInt(rok, 10);
if (rokNum < 2000 || rokNum > new Date().getFullYear()) notFound();

// Brand + model whitelist (jak výše)
// ...
```

**Decision:** Range 2000-current year. 1990-1999 vyloučeny (málo dílů, edge case dle plánu-81). Pre-build se omezí na top 3 roky `[2015, 2018, 2020]` (per plán-81 §D1.1 line 408 + §D3 line 622).

### 3.5 Diakritika test cases

| Input | Canonical | Action |
|---|---|---|
| `skoda` | `skoda` | ✅ Render |
| `škoda` | `skoda` | 301 → `/dily/znacka/skoda` |
| `ŠKODA` | `skoda` | 301 → `/dily/znacka/skoda` |
| `xyz` | `xyz` (no diacritics) | 404 (notFound po find) |
| `mercedes-benz` | `mercedes-benz` | ✅ Render (pokud je v PARTS_BRANDS — currently NEPADNE — Mercedes není v seed) |
| `Mercedes Benz` | `mercedes-benz` | 301 → canonical (404 stejně, pokud nedostupný) |

**Pozn.:** Mercedes-Benz není v současných `PARTS_BRANDS` (8 brands). Pokud business chce přidat — to je out of scope #87b (jen rozšíření seed v `lib/seo-data.ts`).

---

## 4 — Seed data — `PARTS_MODELS_BY_BRAND`

### 4.1 Současný stav lib/seo-data.ts

Per current `lib/seo-data.ts` (1251 řádků) — má `BRANDS` (vehicle inzerce, plné s `description`, `faqItems`, `aiSnippet`, `quickFacts`, `priceRange`), ale **`PARTS_BRANDS`** je jen minimal `{ slug, name }[]` (line 1226-1235).

**Gap:** Žádný `PARTS_MODELS_BY_BRAND` typ ani data.

### 4.2 Cílový shape (per plán-81 §C2.2 + §E1.2)

```ts
// lib/seo-data.ts — přidat

export interface PartsModelGeneration {
  name: string;          // "1. generace (1U)"
  yearFrom: number;
  yearTo: number;
}

export interface PartsModelData {
  slug: string;          // "octavia"
  name: string;          // "Octavia"
  brandSlug: string;     // "skoda"
  generations: PartsModelGeneration[];
  // V #87b stačí stub. FAQ + description přijde v #87c jako SeoContent.
  // Ale top years pro generateStaticParams musíme znát:
  topYears?: number[];   // [2015, 2018, 2020] default
}

export const PARTS_MODELS_BY_BRAND: Record<string, PartsModelData[]> = {
  skoda: [
    { slug: "octavia", name: "Octavia", brandSlug: "skoda", generations: [...], topYears: [2015, 2018, 2020] },
    { slug: "fabia", name: "Fabia", brandSlug: "skoda", generations: [...], topYears: [2015, 2018, 2020] },
    { slug: "superb", name: "Superb", brandSlug: "skoda", generations: [...], topYears: [2015, 2018, 2020] },
    { slug: "kodiaq", name: "Kodiaq", brandSlug: "skoda", generations: [...], topYears: [2018, 2020, 2022] },
  ],
  volkswagen: [
    { slug: "golf", name: "Golf", brandSlug: "volkswagen", generations: [...], topYears: [2015, 2018, 2020] },
    { slug: "passat", name: "Passat", brandSlug: "volkswagen", generations: [...] },
    { slug: "tiguan", name: "Tiguan", brandSlug: "volkswagen", generations: [...] },
    { slug: "polo", name: "Polo", brandSlug: "volkswagen", generations: [...] },
  ],
  // ... 8 brands × 3-5 models = ~30 models
};

// Helper pro rok validation per model
export function getValidYearsForModel(brandSlug: string, modelSlug: string): number[] {
  const model = (PARTS_MODELS_BY_BRAND[brandSlug] || []).find((m) => m.slug === modelSlug);
  if (!model) return [];
  // Vrátí celý rozsah z generations + topYears merge
  const allYears = new Set<number>();
  for (const gen of model.generations) {
    for (let y = gen.yearFrom; y <= gen.yearTo; y++) allYears.add(y);
  }
  return Array.from(allYears).sort();
}
```

### 4.3 Decision: Kolik modelů per brand?

**Plán-81 §C3.1 (line 229)** odhaduje "200 stránek × 2 700 slov = 540 000 slov" pro full content. To je `~50 models × top 3 years × 2 templates (model + model_year)`.

**Pro #87b scope (jen routing + stub data, NE content):**
- 3-5 models per brand × 8 brands = **24-40 models**
- × 3 years per model = **72-120 model+year pages**
- + 8 brand pages = **104-168 SSG pages total**

**Doporučení pro #87b IMPL:** Začít s **3 models per brand** (24 total) → ~96 model+year pages + 8 brand = **128 SSG pages**. Build time impact: ~+20% per plán-81 §D1.3 (estimate 55-65s build time). **Acceptable.**

**Modely pro každou značku** (návrh #87b — developer může upravit dle business priorit):

| Brand | Top 3 modely | Důvod |
|---|---|---|
| `skoda` | octavia, fabia, superb | Top selling, platform spread |
| `volkswagen` | golf, passat, tiguan | Top selling, mix sedan/SUV |
| `bmw` | rada-3, rada-5, x5 | Top selling, exec + SUV |
| `audi` | a4, a6, q5 | Top selling, exec + SUV |
| `ford` | focus, mondeo, kuga | Top selling, hatch + sedan + SUV |
| `toyota` | corolla, yaris, rav4 | Top selling, hatch + small + SUV |
| `hyundai` | i30, tucson, kona | Top selling |
| `opel` | astra, insignia, mokka | Top selling |

**Pozn.:** Slugy musí být ASCII canonical. `BMW Řada 3` → `rada-3`. `Audi A4` → `a4`. Slugy jsou stable identifikátory, ne lidsky čitelné jméno.

---

## 5 — generateStaticParams strategie

### 5.1 Per úroveň

#### 5.1.1 Brand level — `[brand]/page.tsx`

```ts
// Existuje, beze změny:
export function generateStaticParams() {
  return PARTS_BRANDS.map((b) => ({ brand: b.slug }));
}
```

**Output:** 8 SSG pages.

#### 5.1.2 Model level — `[brand]/[model]/page.tsx`

```ts
export function generateStaticParams() {
  return PARTS_BRANDS.flatMap((brand) =>
    (PARTS_MODELS_BY_BRAND[brand.slug] || []).map((model) => ({
      brand: brand.slug,
      model: model.slug,
    }))
  );
}
```

**Output:** ~24 SSG pages (8 brands × 3 models).

#### 5.1.3 Model+rok level — `[brand]/[model]/[rok]/page.tsx`

```ts
export function generateStaticParams() {
  const params: { brand: string; model: string; rok: string }[] = [];
  for (const brand of PARTS_BRANDS) {
    const models = PARTS_MODELS_BY_BRAND[brand.slug] || [];
    for (const model of models) {
      const years = model.topYears || [2015, 2018, 2020];
      for (const year of years) {
        params.push({
          brand: brand.slug,
          model: model.slug,
          rok: String(year),
        });
      }
    }
  }
  return params;
}
```

**Output:** ~72 SSG pages (8 × 3 × 3).

**Total SSG:** 8 + 24 + 72 = **104 pages** přes 3 templates.

### 5.2 Decision: Seed-driven vs DB-driven

Plán-81 §D1.1 (line 397-421) navrhuje DB-driven přes `prisma.part.groupBy({ by: ["compatibleBrands", "compatibleModels"], take: 50 })`. **Toto je problematické**, protože:

1. **`compatibleBrands` a `compatibleModels` jsou JSON string fields** (per `prisma/schema.prisma:923-924`), ne enum/relation. `groupBy` na JSON stringech neagregeuje sémanticky — `["Škoda"]` a `["Škoda", "VW"]` jsou různé groups.
2. **Žádné indexy** na compatibility fields → slow groupBy během build.
3. **Build determinism** — pokud se DB obsah změní mezi dvěma buildy, generateStaticParams produkuje různý set pages → CDN cache invalidation chaos.

**Rozhodnutí pro #87b:** **Seed-driven (deterministic)** přes `PARTS_MODELS_BY_BRAND` const. Build je rychlý, deterministický, žádný DB call během SSG.

**Long-tail** (combinace mimo seed) jsou pokryty `dynamicParams = true` — Next.js vyrenderuje on-demand při prvním requestu.

### 5.3 Build performance

| Aspekt | Estimate | Zdroj |
|---|---|---|
| Stávající build | 312 routes, 44s | plán-81 §D1.3 |
| **#87b: +120 nových routes** | +25% build time → ~55-65s | plán-81 §D1.3 |
| ISR fallback overhead | First hit ~500ms cold, then cached | Next.js docs |
| Build memory | <2 GB (Node default) | Verify v CI |

---

## 6 — Fallback strategy + ISR config

### 6.1 Per úroveň

#### 6.1.1 Brand `[brand]/page.tsx`

```ts
export const dynamic = "force-static";    // Build-time
export const dynamicParams = false;       // ❗ Ne fallback — brand seznam je uzavřený (8)
export const revalidate = 86400;          // 24h ISR
```

**Důvod `dynamicParams = false`:** Brand whitelist je uzavřený. Pokud někdo zavolá `/dily/znacka/xyz`, vrátí 404 přes `notFound()` (ne render fallback) — to je správné chování pro brand level.

#### 6.1.2 Model `[brand]/[model]/page.tsx`

```ts
export const dynamic = "force-static";    // Build-time
export const dynamicParams = true;        // ✅ Fallback pro long-tail (Octavia Combi, atd.)
export const revalidate = 86400;          // 24h ISR
```

**Důvod `dynamicParams = true`:** Model seznam je open-ended (může být víc modelů než seed). Long-tail combination jako `/dily/znacka/skoda/octavia-combi` vyrendruje on-demand pokud `notFound()` neaktivuje (model whitelist na seed → 404 jinak).

#### 6.1.3 Model+rok `[brand]/[model]/[rok]/page.tsx`

```ts
export const dynamic = "force-static";    // Build-time
export const dynamicParams = true;        // ✅ Fallback pro all valid years (2000-current)
export const revalidate = 86400;          // 24h ISR
```

**Důvod:** Pre-build top 3 years per model, fallback ISR pro any other valid year (validated regex + range).

### 6.2 Sumář

| Template | dynamic | dynamicParams | revalidate | SSG count | Fallback |
|---|---|---|---|---:|---|
| `[brand]/page.tsx` | `force-static` | `false` | 86400 | 8 | 404 |
| `[brand]/[model]/page.tsx` | `force-static` | `true` | 86400 | 24 | ISR |
| `[brand]/[model]/[rok]/page.tsx` | `force-static` | `true` | 86400 | 72 | ISR |

---

## 7 — Metadata generování

### 7.1 Title + description formáty (per plán-81 §C1.4)

| URL pattern | Title | Meta description |
|---|---|---|
| `/dily/znacka/{brand}` | `Náhradní díly {Brand} \| Carmakler` | `Použité a nové náhradní díly pro vozy {Brand}. Ověřená vrakoviště, doručení do 5 dnů.` |
| `/dily/znacka/{brand}/{model}` | `Náhradní díly {Brand} {Model} \| Carmakler` | `Originální použité díly pro {Brand} {Model}. Brzdy, motory, karoserie a další.` |
| `/dily/znacka/{brand}/{model}/{rok}` | `Náhradní díly {Brand} {Model} {Rok} \| Carmakler` | `Náhradní díly pro {Brand} {Model} ročník {rok}. Použité originální i nové díly.` |

**Title pravidla:**
- Max 60 chars desktop (verify per route v testech!)
- Klíčové slovo vpředu (`Náhradní díly`)
- Brand jako spojovník po hlavním klíčovém slovu
- Suffix `| Carmakler` vždy
- **Bez dynamic pricing** (`od X Kč`) v #87b — pricing je #87c (potřebuje DB aggregation, mimo scope)

### 7.2 Implementation

```ts
// app/(web)/dily/znacka/[brand]/page.tsx — modifikace generateMetadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand } = await params;
  const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
  if (!brandData) return {};

  const title = `Náhradní díly ${brandData.name} | Carmakler`;
  const description = `Použité a nové náhradní díly pro vozy ${brandData.name}. Ověřená vrakoviště, doručení do 5 dnů.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/dily/znacka/${brand}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/dily/znacka/${brand}`,
      type: "website",
    },
  };
}
```

**Klíčová změna oproti aktuální verzi:**
- Přidat `alternates.canonical` ✅ (chybí v current implementaci)
- Přidat `openGraph.url` ✅ (chybí)
- Title format unifikace

```ts
// app/(web)/dily/znacka/[brand]/[model]/page.tsx — nový soubor
export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}): Promise<Metadata> {
  const { brand, model } = await params;
  const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
  const modelData = (PARTS_MODELS_BY_BRAND[brand] || []).find((m) => m.slug === model);
  if (!brandData || !modelData) return {};

  const title = `Náhradní díly ${brandData.name} ${modelData.name} | Carmakler`;
  const description = `Originální použité díly pro ${brandData.name} ${modelData.name}. Brzdy, motory, karoserie a další.`;
  const url = `${BASE_URL}/dily/znacka/${brand}/${model}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
  };
}
```

```ts
// app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx — nový soubor
export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string; rok: string }>;
}): Promise<Metadata> {
  const { brand, model, rok } = await params;
  const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
  const modelData = (PARTS_MODELS_BY_BRAND[brand] || []).find((m) => m.slug === model);
  if (!brandData || !modelData || !/^\d{4}$/.test(rok)) return {};

  const title = `Náhradní díly ${brandData.name} ${modelData.name} ${rok} | Carmakler`;
  const description = `Náhradní díly pro ${brandData.name} ${modelData.name} ročník ${rok}. Použité originální i nové díly.`;
  const url = `${BASE_URL}/dily/znacka/${brand}/${model}/${rok}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
  };
}
```

---

## 8 — Breadcrumb component strategie

### 8.1 Decision: Generic vs per-segment

**Variant A — Generic `<PartsBreadcrumbs items={[...]} />`** ✅
- Nový komponent v `components/web/dily/PartsBreadcrumbs.tsx`
- Props `items: { name: string; url?: string }[]` (URL `undefined` pro current page)
- Sám rendruje JSON-LD `BreadcrumbList`
- Reusable napříč všemi 3 templates + future routes

**Variant B — Inline JSX per page**
- Stejně jako aktuální `[slug]/page.tsx` (lines 50-64)
- Cons: Duplicate code 3×, no JSON-LD coupling

**Decision:** **Variant A** — extract do shared komponenty per plán-81 §C2.1 line 169 (`PartsBreadcrumbs.tsx — NOVÉ — 5-level breadcrumb`).

### 8.2 Spec

```tsx
// components/web/dily/PartsBreadcrumbs.tsx (NEW, ~70 řádků)
"use client"; // Pro <Link> + accessibility (no — keep server)

import Link from "next/link";
import { generateBreadcrumbJsonLd } from "@/lib/seo";

export interface BreadcrumbItem {
  name: string;
  url?: string; // undefined = current page (no link)
}

export function PartsBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  // Generate JSON-LD: filter out items without URL? No — schema.org BreadcrumbList expects all items including current.
  const jsonLd = generateBreadcrumbJsonLd(items.map((i) => ({ name: i.name, url: i.url || "" })));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
            {items.map((item, idx) => (
              <li key={item.name} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight />}
                {item.url ? (
                  <Link href={item.url} className="hover:text-orange-500 transition-colors no-underline text-gray-500">
                    {item.name}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium">{item.name}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
```

**Použití per template:**

```tsx
// [brand]/page.tsx
<PartsBreadcrumbs items={[
  { name: "Domů", url: "/" },
  { name: "Díly", url: "/dily" },
  { name: `Díly ${brandData.name}` }, // current
]} />

// [brand]/[model]/page.tsx
<PartsBreadcrumbs items={[
  { name: "Domů", url: "/" },
  { name: "Díly", url: "/dily" },
  { name: brandData.name, url: `/dily/znacka/${brand}` },
  { name: modelData.name }, // current
]} />

// [brand]/[model]/[rok]/page.tsx
<PartsBreadcrumbs items={[
  { name: "Domů", url: "/" },
  { name: "Díly", url: "/dily" },
  { name: brandData.name, url: `/dily/znacka/${brand}` },
  { name: modelData.name, url: `/dily/znacka/${brand}/${model}` },
  { name: rok }, // current
]} />
```

---

## 9 — JSON-LD ItemList implementation

### 9.1 Per-page schema matrix (z plán-81 §D2.1)

| Page type | BreadcrumbList | Organization | ItemList | FAQPage |
|---|:---:|:---:|:---:|:---:|
| `[brand]/page.tsx` | ✅ (PartsBreadcrumbs) | ✅ | ✅ (top 15 dílů Brand) | ⚠️ stub (#87c) |
| `[brand]/[model]/page.tsx` | ✅ | ✅ | ✅ (top 15 dílů Model) | ⚠️ stub (#87c) |
| `[brand]/[model]/[rok]/page.tsx` | ✅ | ✅ | ✅ (top 15 dílů Model+Rok) | ⚠️ stub (#87c) |

**Pozn. FAQ:** Plán-81 §D2.3 navrhuje FAQ generation per page (3 universal + brand/model-specific). **Pro #87b:** Render FAQPage **jen pokud `PARTS_MODELS_BY_BRAND[brand][model].faqItems` existuje** (currently žádné v seed). Real FAQ obsah přijde s #87c (Prisma SeoContent + AI gen). #87b vystačí s **3 universal FAQs** hardcoded:

```ts
const UNIVERSAL_FAQS = [
  { question: "Jaká je záruka na použité díly?", answer: "Na použité originální díly poskytujeme záruku 3 měsíce. Refurbished díly mají záruku 12 měsíců." },
  { question: "Jak rychle doručíte díl?", answer: "Standardní doručení do 2-5 pracovních dnů po celé ČR. U rozměrnějších dílů zajistíme přepravní službu." },
  { question: "Mohu díl vrátit, pokud nesedí?", answer: "Ano, máte 14 dnů na vrácení. Doporučujeme vždy ověřit kompatibilitu přes VIN před objednáním." },
];
```

### 9.2 ItemList — top 15 dílů per page

**Data source:** Prisma query na `Part` filtrovaná podle compatibility:

```ts
// lib/seo/partsItemList.ts (NEW helper, ~50 řádků)
import { prisma } from "@/lib/prisma";

export interface PartsItemListData {
  parts: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string | null;
  }[];
}

export async function getTopPartsForBrand(brandName: string): Promise<PartsItemListData> {
  // brandName = "Škoda" (s diakritikou — match na compatibleBrands JSON array)
  const parts = await prisma.part.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { compatibleBrands: { contains: brandName } }, // JSON string contains
        { universalFit: true }, // Univerzální díly
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      images: { select: { url: true }, where: { isPrimary: true }, take: 1 },
    },
    orderBy: { viewCount: "desc" },
    take: 15,
  });

  return {
    parts: parts.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      image: p.images[0]?.url || null,
    })),
  };
}

export async function getTopPartsForBrandModel(brandName: string, modelName: string): Promise<PartsItemListData> {
  const parts = await prisma.part.findMany({
    where: {
      status: "ACTIVE",
      AND: [
        { compatibleBrands: { contains: brandName } },
        { compatibleModels: { contains: modelName } },
      ],
    },
    // ... rest identický
  });
  // ...
}

export async function getTopPartsForBrandModelYear(brandName: string, modelName: string, year: number): Promise<PartsItemListData> {
  const parts = await prisma.part.findMany({
    where: {
      status: "ACTIVE",
      AND: [
        { compatibleBrands: { contains: brandName } },
        { compatibleModels: { contains: modelName } },
        { compatibleYearFrom: { lte: year } },
        { compatibleYearTo: { gte: year } },
      ],
    },
    // ...
  });
  // ...
}
```

**Pozn.:** `contains` na JSON string field je **substring match**, ne pravý JSON parse. Pro `compatibleBrands = '["Škoda","VW"]'` query `{ contains: "Škoda" }` matchne. Není to dokonalé (matchne i `["Škoda Roomster"]`), ale per #87b scope je acceptable. Pravý JSON path query přijde s #87c (PostgreSQL JSONB cast nebo aplikační normalizace).

### 9.3 ItemList JSON-LD generator

Rozšířit `lib/seo.ts` o:

```ts
// lib/seo.ts — přidat
export function generatePartsItemListJsonLd(items: { name: string; url: string; price: number }[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: item.url,
      name: item.name,
    })),
  });
}
```

### 9.4 FAQPage JSON-LD generator

```ts
// lib/seo.ts — přidat
export function generateFaqPageJsonLd(faqs: { question: string; answer: string }[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  });
}
```

### 9.5 Organization reuse z #87a

`lib/seo.ts` má `generateOrganizationJsonLd()` z #87a (per `impl-task-87a.md` line 98). **Reuse, nemodifikovat.**

---

## 10 — Canonical URLs

### 10.1 Pravidla

| Aspekt | Pravidlo |
|---|---|
| **Base URL** | `https://carmakler.cz` (per `lib/seo-data.ts` BASE_URL — verify aktuální hodnota) |
| **Canonical slug case** | Lowercase, ASCII, kebab-case (přes `slugify()`) |
| **Bez subdomény** | `carmakler.cz/dily/znacka/...` (NE `shop.carmakler.cz/dily/znacka/...`) — per #82 plán-task-82 §3.4 + Wolt model (subdomény jsou middleware rewrite, kanonika vždy main domain) |
| **Bez trailing slash** | `/dily/znacka/skoda/octavia` (NE `/dily/znacka/skoda/octavia/`) — Next.js default |
| **Bez query params** | Canonical jen path; query params (filtry) jsou variants ale ne canonical |
| **Alias 301** | `/dily/znacka/škoda` → 301 → `/dily/znacka/skoda` (přes `aliasFor()` + `permanentRedirect()`) |

### 10.2 Implementation per template

```tsx
// V každém template, generateMetadata sets:
return {
  // ...
  alternates: {
    canonical: `${BASE_URL}/dily/znacka/${brand}/${model}/${rok}`,
  },
  // ...
};
```

**Plus** `<link rel="canonical" href="..." />` se vyrenderuje automaticky z `alternates.canonical` v Next.js.

### 10.3 Sitemap update — `app/sitemap.ts`

Per plán-81 §D3 (line 599-668), `app/sitemap.ts` musí být rozšířen o:
- `partsModelPages` (24 entries) — `${BASE_URL}/dily/znacka/${brand}/${model}` weekly priority 0.7
- `partsModelYearPages` (72 entries) — `${BASE_URL}/dily/znacka/${brand}/${model}/${year}` monthly priority 0.6

**Verify:** sitemap už zahrnuje brand pages (per plán-81 §D3 a current `app/sitemap.ts` — needs check). Pokud ne, přidat i `partsBrandPages`.

**Pozn.:** Per `impl-task-87a.md` line 71-73 — `app/sitemap.ts` byl modifikován v #91 jen pro `partnerPages` (vrakoviště). Parts model URLs explicitly NE — to je #87b scope.

---

## 11 — Soubory k vytvoření / modifikaci

### 11.1 Files to create / modify

| Soubor | Akce | LoC est | Důvod |
|---|---|---:|---|
| `app/(web)/dily/znacka/[brand]/page.tsx` | **RENAME** z `[slug]/page.tsx` + modify | ~250 | Rename `slug` → `brand`, přidat ItemList, FAQ, Organization, models grid, canonical |
| `app/(web)/dily/znacka/[brand]/loading.tsx` | RENAME (folder move) | 0 změny | — |
| `app/(web)/dily/znacka/[brand]/error.tsx` | RENAME (folder move) | 0 změny | — |
| `app/(web)/dily/znacka/[brand]/[model]/page.tsx` | **NEW** | ~280 | Model landing template |
| `app/(web)/dily/znacka/[brand]/[model]/loading.tsx` | NEW | ~25 | Spinner state |
| `app/(web)/dily/znacka/[brand]/[model]/error.tsx` | NEW | ~25 | Error boundary |
| `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` | **NEW** | ~280 | Model+rok landing template |
| `app/(web)/dily/znacka/[brand]/[model]/[rok]/loading.tsx` | NEW | ~25 | — |
| `app/(web)/dily/znacka/[brand]/[model]/[rok]/error.tsx` | NEW | ~25 | — |
| `lib/seo-data.ts` | MODIFY | +100 | Přidat `PartsModelGeneration`, `PartsModelData`, `PARTS_MODELS_BY_BRAND` (24 modelů × stub data), `getValidYearsForModel()` helper |
| `lib/seo.ts` | MODIFY | +50 | Přidat `generatePartsItemListJsonLd()`, `generateFaqPageJsonLd()` |
| `lib/seo/partsItemList.ts` | **NEW** | ~120 | 3 helper queries (Brand / Brand+Model / Brand+Model+Year top 15 dílů) |
| `components/web/dily/PartsBreadcrumbs.tsx` | **NEW** | ~70 | Reusable breadcrumb komponenta s JSON-LD |
| `app/sitemap.ts` | MODIFY | +30 | Přidat `partsModelPages` + `partsModelYearPages` bloky |

**Total estimate:** ~1280 LoC napříč 14 souborech (10 NEW + 4 modify), 0 nových npm dependencies.

### 11.2 Soubory NEMODIFIKOVANÉ (důležité!)

- ❌ `prisma/schema.prisma` — žádný nový model (SeoContent je #87c)
- ❌ `lib/seo/slugify.ts` — reuse z #87a
- ❌ `app/(web)/dily/page.tsx` (root) — žádná změna (root je #87d nebo separate)
- ❌ `lib/auth.ts`, `middleware.ts` — žádný auth impact
- ❌ Žádné API routes — `revalidate API` je #87d

---

## 12 — Acceptance criteria pro #87b IMPL

### 12.1 Functional AC

- **AC1** — `app/(web)/dily/znacka/[slug]/` je přejmenováno na `[brand]/`. Git history zachována (`git mv`).
- **AC2** — `[brand]/page.tsx` exports `params.brand`, používá `aliasFor()` pro alias detekci, `notFound()` pro neznámé brand. Stávajících 8 SSG pages se generuje stejně jako dřív.
- **AC3** — `[brand]/[model]/page.tsx` exists, generateStaticParams produkuje ~24 SSG pages (8 brands × 3 models), `dynamicParams = true`.
- **AC4** — `[brand]/[model]/[rok]/page.tsx` exists, generateStaticParams produkuje ~72 SSG pages, regex validation `/^\d{4}$/` + range 2000-current year.
- **AC5** — `lib/seo-data.ts` má `PARTS_MODELS_BY_BRAND` s 8 brands × 3 models = 24 entries minimum, každý s `generations` array.
- **AC6** — `components/web/dily/PartsBreadcrumbs.tsx` je reusable komponenta s `BreadcrumbList` JSON-LD.
- **AC7** — `lib/seo.ts` má 2 nové generators: `generatePartsItemListJsonLd()` + `generateFaqPageJsonLd()`. Reuse `generateOrganizationJsonLd()` z #87a.
- **AC8** — `lib/seo/partsItemList.ts` má 3 query helpers (Brand / Brand+Model / Brand+Model+Year), používají `compatibleBrands.contains()` filtering.
- **AC9** — `app/sitemap.ts` zahrnuje `partsModelPages` + `partsModelYearPages` bloky s correct priority + changeFrequency.
- **AC10** — Každá ze 3 templates renderuje minimum: PartsBreadcrumbs, hero (h1), ItemList, FAQ accordion (3 universal), Organization JSON-LD, canonical link.

### 12.2 Quality AC

- **AC11** — `npx tsc --noEmit` 0 errors po commitu.
- **AC12** — `npm run lint` 0 errors (warnings v baseline acceptable).
- **AC13** — `npm run build` succeeds, build time ≤ 70s (post-#87b je estimate +25% z 44s = ~55s, nech 70s buffer pro CI variability).
- **AC14** — `npm run build` output musí showvat ~104 statických /dily/znacka/* routes (8 brand + 24 model + 72 model+year). Verify v build log.
- **AC15** — Diakritika redirect funguje: pokud devel manuálně testne `curl -I https://carmakler.cz/dily/znacka/škoda` (po deploy) → `301 → /dily/znacka/skoda`. **Browser test** v post-deploy QA.
- **AC16** — JSON-LD validace: alespoň jedna ze 3 templates pre Google Rich Results Test (https://search.google.com/test/rich-results) — pasaž, žádné errors u BreadcrumbList, ItemList, FAQPage, Organization.

### 12.3 Out-of-scope AC (NE testovat v #87b)

- ❌ Long-form content (9 H2 sekcí per template) — #87c/#87d
- ❌ Pricing aggregations (`od X Kč` v title) — #87c
- ❌ DB-driven FAQ z `SeoContent` model — #87c
- ❌ On-demand revalidation API — #87d
- ❌ AI-generated content — #87c

---

## 13 — Sequencing + dependencies

### 13.1 Dependency graph

```
#87a IMPL (#91, DONE)
   ↓ (provides slugify, seo.ts foundations, BASE_URL)
#87b IMPL (#96, this plan #124)  ← BLOCKER pro #87c, #87d, sitemap reach
   ↓
   ├─→ #87c IMPL (#97, Prisma SeoContent + content gen)
   ├─→ #87d IMPL (#98, revalidation API + 9 H2 expansion)
   └─→ #87e DOCS (#99, geo-benchmark)
```

**#87b nezávisí na:**
- ❌ #82 PERF Phase 1-5 (#82d-h) — different scope (route group split, ne SEO routing)
- ❌ #82b TEST-CHROME (#106) — nesouvisí
- ❌ #82c Lighthouse baseline (#107/#123) — paralelní

**#87b paralelně možný s:**
- ✅ #82 Phase 1-5 (different files)
- ✅ #82b/#82c (different concerns)
- ✅ #88 AI Part Scanner

### 13.2 Doporučené sequencing pro #87b IMPL

1. **Krok 1:** Rename folder + update brand page (~2 h)
   - `git mv [slug] [brand]`, find/replace `params.slug` → `params.brand`
   - Build verify (8 SSG pages stejné jako dřív)
2. **Krok 2:** PARTS_MODELS_BY_BRAND seed (~3 h)
   - Vytvořit `PartsModelData` interface
   - Seed 8 × 3 modelů s generations
   - Helper `getValidYearsForModel()`
3. **Krok 3:** Model template (~2 h)
   - `[brand]/[model]/page.tsx` + loading + error
   - generateStaticParams + generateMetadata + render
4. **Krok 4:** Model+rok template (~2 h)
   - `[brand]/[model]/[rok]/page.tsx` + loading + error
   - regex validation + render
5. **Krok 5:** Shared komponenty (~1.5 h)
   - `PartsBreadcrumbs.tsx`
   - Update brand page na použití nového komponenta
6. **Krok 6:** lib/seo.ts JSON-LD generators (~1 h)
   - `generatePartsItemListJsonLd()`
   - `generateFaqPageJsonLd()`
7. **Krok 7:** lib/seo/partsItemList.ts query helpers (~1.5 h)
   - 3 query funkce s Prisma
8. **Krok 8:** sitemap.ts rozšíření (~0.5 h)
9. **Krok 9:** Build + lint + typecheck verification (~0.5 h)
10. **Krok 10:** Commit + dispatch dalších #87 follow-up (#97, #98, #99) (~0.5 h)

**Total estimate:** ~12.5 h dev work (pesimistic ~16 h s debugging).

---

## 14 — Risks + mitigations

| Risk | Pravděpodobnost | Dopad | Mitigace |
|---|:---:|:---:|---|
| `git mv` selže nebo ztratí history | Low | Med | Pre-flight `git status` clean, verify post-rename `git log --follow` |
| Build memory overrun (Node default 1.5GB) | Low | High | Monitor build memory v CI; fallback `NODE_OPTIONS=--max-old-space-size=4096` |
| `compatibleBrands` JSON contains query slow without index | Med | Med | #87b accept (ItemList je 15-row LIMIT, fast); #87c addresses indexes |
| Slug conflict mezi brand a model (e.g. `bmw/bmw`) | Low | Low | `notFound()` v model handler — model whitelist neobsahuje brand slugy |
| Model seed je incomplete (chybí top model) | Med | Low | First baseline → #87c rozšíří. AC1.5 stačí 3 modely per brand pro start |
| Year validation appendix (1990-1999 nedostupné) | Low | Low | Per business decision — pokud zákazník zadá `/dily/znacka/skoda/octavia/1995`, vrátí 404 (validation rejects) |
| Diakritika redirect loop (alias → canonical → alias) | Low | High | `aliasFor()` vrací `null` pokud input už canonical → loop nemůže nastat (verify v unit test) |
| ISR fallback rendering pomalý first hit | Med | Low | Acceptable per Next.js docs (~500ms cold). Po prvním requestu cached 24h |
| FAQPage JSON-LD má jen 3 universal Q → Google může označit jako "thin" | Med | Med | #87c rozšíří per-brand a per-model FAQ. Pro #87b acceptable (3 universal Q je legitimate trust signal) |
| Sitemap > 50 000 URLs | None | High | #87b adds ~96 URLs → total ~5 000 (pod limitem). Sitemap-index až post-#88/#87d |

---

## 15 — Open questions pro team-leada

### Q1 — Kolik modelů per brand v PARTS_MODELS_BY_BRAND seedu?
**Doporučení:** **3 modely per brand** (24 total). Top selling per business intuice. Rozšíření v #87c nebo separate iteration.

**Alternative:** 5 modelů (40 total) — víc SEO landing pages, ale 2x více seed práce + +60% model+year pages (40 × 3 = 120 SSG namísto 72).

### Q2 — Top years per model: hardcoded `[2015, 2018, 2020]` vs per-model variable?
**Doporučení:** Per-model variable (`PartsModelData.topYears: number[]`) s default fallback `[2015, 2018, 2020]`. Rozumné pro novější modely (Kodiaq spuštěn 2017 → topYears `[2018, 2020, 2022]`).

### Q3 — `Mercedes-Benz` (a další chybějící značky) v PARTS_BRANDS — přidat v #87b nebo separate?
**Doporučení:** **Separate** (#87b-extra nebo #79c). Aktuální 8 brands je MVP scope plánu-81. Rozšíření brand seznamu vyžaduje business decision (top selling Mercedes models, Citroën, Peugeot, Renault, ...).

### Q4 — `dynamic = "force-static"` vs `force-dynamic` pro brand level?
**Doporučení:** **`force-static`** pro všechny 3 templates. Per plán-81 §D1 — všechny pre-builtable, ISR 24h. Žádný důvod pro `force-dynamic` (data se mění zřídka, ItemList je take 15 nejprodávanějších = stabilní).

### Q5 — JSON-LD ItemList obsahuje `offers.price` nebo jen `name + url`?
**Doporučení:** **Jen `name + url`** v #87b ItemList (per `lib/seo.ts` `generatePartsItemListJsonLd` design). Plný `offers + price` schema je pro `Product` JSON-LD na detail page (`/dily/[slug]`) — separate concern, již existuje z #87a.

**Důvod:** ItemList podle schema.org je list of items, ne list of products. Pricing precision = ne strategy, je to list referencí.

### Q6 — Model template má vlastní hero copy nebo template-driven?
**Doporučení:** **Template-driven** v #87b — `Náhradní díly {Brand} {Model}` h1 + 1-paragraph stub `Originální použité díly pro {Brand} {Model} od ověřených vrakovišť za výhodné ceny.`. Long-form content (9 H2 sekcí) je #87c (z `SeoContent`).

### Q7 — Models grid (4-8 top models) na brand page je #87b nebo #87d?
**Doporučení:** **#87b** — protože #87b vytváří `PARTS_MODELS_BY_BRAND` seed, tak má smysl rovnou přidat models grid na brand page (pro internal linking SEO boost). Implementation simple: map seedu, render Link tile.

### Q8 — Categories grid (existuje na brand page) zachovat na model + model+rok page?
**Doporučení:** **NE** — categories grid (`PARTS_CATEGORIES`) je smysluplný jen na brand level. Na model/year page je redundantní (uživatel už ví značku+model, hledá konkrétní díl, ne kategorii). Místo toho: **kategorie filter chips** — query param links `/dily/katalog?brand=skoda&model=octavia&kategorie=brzdy`.

---

## 16 — Akční kroky pro team-leada

1. **Schválit/upravit tento plán** — zejména §4 seed scope (Q1), §11 file list, §15 Q1-Q8
2. **Vyřešit Q1-Q8** (zejména Q1 počet modelů, Q3 brand expansion, Q7 models grid scope)
3. **Dispatch #87b IMPL** podle §11 deliverables + §12 AC
   - Owner: Developer
   - blockedBy: schválení tohoto plánu
   - Acceptance: §12 AC1-AC16
4. **Po #87b dokončení** — review build output (~104 SSG pages), verify diakritika redirect manuálně přes curl, JSON-LD via Rich Results Test
5. **Unblock #87c** (Prisma SeoContent + content gen) jakmile #87b mergne — #87c potřebuje routing strukturu hotovou aby mohl injectnout content do template
6. **#87d (revalidation API)** může běžet paralelně s #87c (different files)

---

## 17 — Souhrn pro Evžen review (volitelné)

**Co plán řeší:**
- Refaktor existujícího `[slug]` routingu na 3-segment `[brand]/[model]/[rok]`
- Seed-driven SSG (104 pre-built pages) + ISR fallback
- Reusable PartsBreadcrumbs komponenta
- ItemList + FAQPage + Organization JSON-LD na všech 3 templates
- Diakritika 301 redirect via reuse `aliasFor()` z #87a
- Sitemap rozšíření o 96 nových URLs

**Co plán NEŘEŠÍ (out of scope #87b):**
- Long-form content (9 H2 sekcí) — #87c
- Prisma SeoContent model — #87c
- AI-generated descriptions — #87c
- On-demand revalidation API — #87d
- 9 H2 brand expansion (současná brand page má jen základní layout) — #87d
- Pricing aggregations (`od X Kč`) — #87c
- Per-brand a per-model FAQ database — #87c
- docs/geo-benchmark.md — #87e

**Klíčové open questions:** §15 Q1-Q8 vyžadují team-lead schválení před #87b IMPL dispatch.

**Estimate:** M (medium) — ~12-16 h dev work. Žádný blocker, #87b lze dispatchnout okamžitě po schválení.

**Návaznost:** Tento plán **odblokuje #87c, #87d, #87e**. Bez 3-segment routingu nelze content (#87c) ani revalidation API (#87d) nasadit.

---

## Konec plánu
