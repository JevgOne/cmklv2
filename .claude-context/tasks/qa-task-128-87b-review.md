# QA Task #128 — #87b 3-segment routing `/dily/[brand]/[model]/[rok]`

**Commit:** `1466223`
**Branch:** `main`
**QA agent:** KONTROLOR
**Datum:** 2026-04-07
**Ref plán:** `.claude-context/tasks/plan-task-124-3segment-routing.md`
**Ref impl:** `.claude-context/tasks/impl-task-87b-3segment-routing.md`

---

## SOUHRN

| Oblast | Výsledek | Detail |
|--------|----------|--------|
| **Build** | ✅ PASS | EXIT 0, 402 SSG pages total, 104 nových `/dily/znacka/*` |
| **Lint** | ✅ PASS | 0 errors, 542 warnings (baseline zachován) |
| **Vitest** | ✅ PASS | 141/141 passing |
| **TSC** | ✅ PASS | 0 errors |
| **Q1** (24 modelů) | ✅ PASS | 8 × 3 = 24 ✅ — ověřeno `grep -c "topYears:" seo-data.ts` = 24 |
| **Q2** (3 topYears každý) | ✅ PASS | Všech 24 modelů má 3 topYears; Hyundai Kona: `[2018,2020,2022]` |
| **Q3** (force-static 3 vrstvy) | ✅ PASS | Všechny 3 templates mají `force-static` + `revalidate=86400` |
| **Q4** (ItemList name+url) | ✅ PASS | `generatePartsItemListJsonLd` přijímá jen `{name, url}[]` |
| **Q5** (template stub) | ✅ PASS | Template strings s brand/model/rok proměnnými |
| **Q6** (models grid na brand page) | ✅ PASS | Grid na `[brand]/page.tsx` lines 144–167 |
| **Q7** (kategorie jen na brand level) | ⚠️ MINOR | Model + rok pages mají categories sekci (viz níže) |
| **Q8** (BreadcrumbList) | ✅ PASS | JSON-LD PartsBreadcrumbs + minor poznámka |
| **Verdict** | ⚠️ **PASS with minor findings** | 1 minor finding, neblokující |

---

## Debug sekce

### Build

```
DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm run build
→ EXIT 0
→ 402 SSG pages total
```

Relevantní build output:
```
● /dily/znacka/[brand]              → /skoda, /volkswagen, /bmw  [+5] = 8
● /dily/znacka/[brand]/[model]      → /skoda/octavia, /fabia, /superb [+21] = 24
● /dily/znacka/[brand]/[model]/[rok] → /skoda/octavia/2015, /2018, /2020 [+69] = 72
```

Matematická verifikace AC14:
- 8 brand pages + 24 model pages + 72 rok pages = **104 nových SSG pages** ✅

Poznámka: `Failed to load broker stats: PrismaClientKnownRequestError` — očekávané chování s dummy DB. Partsové Prisma helpers v `lib/seo/partsItemList.ts` jsou wrapper v try/catch → build neselže.

### Lint

```
npx next lint → 0 errors, 542 warnings
```

Baseline 542 zachován. Nový kód nepřidal žádné nové warnings.

### Vitest

```
npx vitest run → 141/141 passed
```

### TSC

```
npx tsc --noEmit → 0 errors
```

---

## Reversal sekce — Q1–Q8

### Q1 — 24 modelů (8 značek × 3 modely)

`PARTS_MODELS_BY_BRAND` v `lib/seo-data.ts`: 8 keys, každý s 3 modely.
```bash
grep -c "topYears:" lib/seo-data.ts → 24  ✅
```
Verifikace `generateStaticParams()` v `[brand]/[model]/page.tsx`:
```typescript
PARTS_BRANDS.flatMap((brand) =>
  (PARTS_MODELS_BY_BRAND[brand.slug] || []).map((model) => ({ brand: brand.slug, model: model.slug }))
)
```
→ 8 × 3 = 24 ✅

### Q2 — 3 topYears na každý model

Všech 24 `topYears:` entries v seo-data.ts mají přesně 3 roky:
- 23× `[2015, 2018, 2020]`
- 1× `[2018, 2020, 2022]` (Hyundai Kona — validní, novější model)

`generateStaticParams()` v `[brand]/[model]/[rok]/page.tsx`:
```typescript
const years = model.topYears ?? [2015, 2018, 2020];
for (const year of years) {
  params.push({ brand: brand.slug, model: model.slug, rok: String(year) });
}
```
→ 24 × 3 = 72 rok pages ✅

### Q3 — `force-static` + `revalidate=86400` na všech 3 templates

| Template | `dynamic` | `dynamicParams` | `revalidate` |
|----------|-----------|-----------------|--------------|
| `[brand]/page.tsx` | `"force-static"` | `false` | `86400` |
| `[brand]/[model]/page.tsx` | `"force-static"` | `true` | `86400` |
| `[brand]/[model]/[rok]/page.tsx` | `"force-static"` | `true` | `86400` |

✅ — `dynamicParams=false` na brand (jen 8 seed značek), `true` na model+rok (ISR fallback pro future combos).

### Q4 — ItemList JSON-LD pouze name + url

`lib/seo.ts` → `generatePartsItemListJsonLd`:
```typescript
export function generatePartsItemListJsonLd(
  listName: string,
  items: { name: string; url: string }[]
): string
```

Volání v `[rok]/page.tsx`:
```typescript
topParts.map((p) => ({
  name: p.name,
  url: `${BASE_URL}/dily/${p.slug}`,
}))
```

Žádná cena, žádný SKU v JSON-LD struktuře ✅

### Q5 — Template-driven SEO stub (žádný hardcoded obsah)

`[rok]/page.tsx` hero section:
```tsx
<h1>Náhradní díly {brandData.name} {modelData.name} {rok}</h1>
<p>Hledáte konkrétní díly pro {brandData.name} {modelData.name} z roku {rok}?...</p>
```
Vše přes `brandData.name`, `modelData.name`, `rok` proměnné ✅

### Q6 — Models grid na brand page

`[brand]/page.tsx` lines 144–167:
```tsx
{models.length > 0 && (
  <section ...>
    <h2>Top modely {brandData.name}</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {models.map((model) => (
        <Link href={`/dily/znacka/${brand}/${model.slug}`} ...>
          {brandData.name} {model.name}
        </Link>
      ))}
    </div>
  </section>
)}
```
✅ — Grid na brand page správně odkazuje na `/dily/znacka/${brand}/${model.slug}`.

### Q7 — Kategorie jen na brand level ⚠️ MINOR

**Plán Q8 (plan-task-124, §Q8):** *"Kategorie filter chips — POUZE na brand page; model/rok pages odkazují category přes query params (`/dily?brand=skoda&cat=brzdy`)"*

**Implementace:**
- `[brand]/page.tsx` — ✅ má categories grid (správně)
- `[brand]/[model]/page.tsx` — ⚠️ má categories sekci linkující na `/dily/kategorie/${cat.slug}`
- `[brand]/[model]/[rok]/page.tsx` — ⚠️ má categories sekci linkující na `/dily/kategorie/${cat.slug}`

**Navíc:** Plán specifikoval query-param formát (`/dily?brand=skoda&cat=brzdy`), ale implementace používá path-based linking (`/dily/kategorie/${cat.slug}`) — konzistentní s existující kategorní strukturou.

**Hodnocení:** MINOR, neblokující. Přidané kategorie na model/rok pages jsou UX vylepšení (snazší navigace), path-based linking je konzistentnější s existujícím routing. Deviace od plan spec, ale nepoškozuje SEO ani funkcionalitu.

### Q8 — BreadcrumbList JSON-LD

`PartsBreadcrumbs` komponenta (`components/web/dily/PartsBreadcrumbs.tsx`):
- Generuje `BreadcrumbList` JSON-LD přes `generateBreadcrumbJsonLd`
- Přijímá `items: BreadcrumbItem[]` kde `href?: string`
- Poslední item bez `href` = current page

**Minor poznámka:** JSON-LD položka pro current page (bez href) dostane `item: ""` (prázdný string). Dle Google spec je `item` property u poslední breadcrumb volitelná — prázdný string je akceptovatelný, ale technicky čistší by bylo vynechat property úplně. Neblokující.

Breadcrumbs v `[rok]/page.tsx`:
```tsx
<PartsBreadcrumbs items={[
  { name: "Domů", href: "/" },
  { name: "Díly", href: "/dily" },
  { name: brandData.name, href: `/dily/znacka/${brand}` },
  { name: modelData.name, href: `/dily/znacka/${brand}/${model}` },
  { name: rok },  // ← current page, no href
]} />
```
✅ — 5 úrovní, správná hierarchie pro rok page.

---

## Diakritika canonicalization (AC5)

`[rok]/page.tsx`:
```typescript
const brandCanonical = aliasFor(brand);
const modelCanonical = aliasFor(model);
if (brandCanonical || modelCanonical) {
  permanentRedirect(`/dily/znacka/${brandCanonical ?? brand}/${modelCanonical ?? model}/${rok}`);
}
```
Logika: `aliasFor()` vrací `null` pro kanonické slugy, non-null pro aliasy → redirect jen pokud aspoň jeden z nich je non-canonical ✅

BMW Rada-3 1995 scénář:
1. `isValidPartsYear("1995")` → `1995 < 2000` → returns `false` → `notFound()` ✅

---

## Sitemap verifikace (AC12)

`app/sitemap.ts` — 2 nové sekce:
```typescript
const partsModelPages = PARTS_BRANDS.flatMap(...)   // 24 entries
const partsModelYearPages = PARTS_BRANDS.flatMap(...) // 72 entries
```
→ +96 nových URL ✅

---

## Minor Findings (neblokující)

| # | Severity | Popis | Doporučení |
|---|----------|-------|------------|
| MF-1 | MINOR | Kategorie sekce na model + rok pages (plán Q8 specifikoval jen brand level) | Ponechat (UX pozitivum), nebo vytvořit follow-up task #87c+ |
| MF-2 | MINOR | BreadcrumbList current page `item: ""` (prázdný string místo vynechání property) | Neblokující, lze opravit v #87c |

---

## Verdict

### ⚠️ PASS with minor findings

Commit `1466223` implementuje 3-segment routing správně. 104 nových SSG pages ověřeno. Build, lint, TSC a Vitest prochází čistě. Diakritika 301 canonicalization, year validace, JSON-LD a ISR konfigurace odpovídají plánu. 2 minor findings (MF-1, MF-2) jsou neblokující.

**Post-deploy QA (nezávislé):**
- AC15: Manual diakritika curl test (`/dily/znacka/škoda/octávia/2018` → 301)
- AC16: Google Rich Results Test (BreadcrumbList + ItemList + FAQPage)
