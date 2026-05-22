# IMPL Task #96 / #87b — 3-segment routing `/dily/[brand]/[model]/[rok]`

**Status:** ✅ DONE
**Commit:** `1466223`
**Branch:** `main` (pushed to origin)
**Plan ref:** `.claude-context/tasks/plan-task-124-3segment-routing.md` (1072 ř.)

---

## Co bylo zhotoveno

3-úrovňová SSG landing struktura pro náhradní díly s seed-driven generování (žádné DB volání během buildu) + ISR fallback pro urls mimo seed. Reuse `aliasFor()` foundation z #87a pro 301 diakritika canonicalization (`škoda` → `skoda`).

**104 nových SSG pages** ve 3 vrstvách:
- 8× `/dily/znacka/[brand]` (Skoda, VW, BMW, Audi, Ford, Toyota, Hyundai, Opel)
- 24× `/dily/znacka/[brand]/[model]` (3 modely × 8 značek)
- 72× `/dily/znacka/[brand]/[model]/[rok]` (3 top years × 24 modelů)

Build EXIT 0 s dummy i real `DATABASE_URL`. Žádné nové npm závislosti.

---

## Soubory

### NEW (10)

| Soubor | LoC | Účel |
|---|---|---|
| `app/(web)/dily/znacka/[brand]/[model]/page.tsx` | 335 | Model template, 24 SSG, dynamicParams=true |
| `app/(web)/dily/znacka/[brand]/[model]/loading.tsx` | 19 | Skeleton |
| `app/(web)/dily/znacka/[brand]/[model]/error.tsx` | 38 | Error boundary (client) |
| `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` | 324 | Year template, 72 SSG, dynamicParams=true |
| `app/(web)/dily/znacka/[brand]/[model]/[rok]/loading.tsx` | 19 | Skeleton |
| `app/(web)/dily/znacka/[brand]/[model]/[rok]/error.tsx` | 38 | Error boundary (client) |
| `components/web/dily/PartsBreadcrumbs.tsx` | 73 | Reusable breadcrumb nav + JSON-LD |
| `lib/seo/partsItemList.ts` | 157 | 3 Prisma helpers (try/catch, dummy DB safe) |

### MODIFIED (4)

| Soubor | Δ | Účel |
|---|---|---|
| `app/(web)/dily/znacka/[brand]/page.tsx` | rewrite (was `[slug]/page.tsx`) | Přidán Models grid, ItemList, Organization JSON-LD, alternates.canonical, openGraph.url, alias 301 |
| `lib/seo-data.ts` | +310 | `PARTS_MODELS_BY_BRAND` seed (8 × 3 = 24 modely), interfaces, `getValidYearsForModel()`, `isValidPartsYear()` |
| `lib/seo.ts` | +42 | `generatePartsItemListJsonLd()`, `generateFaqPageJsonLd()` |
| `app/sitemap.ts` | +27 / −3 | Přidán `partsModelPages` (24) + `partsModelYearPages` (72) |

### RENAMED (git mv, history preserved)

- `app/(web)/dily/znacka/[slug]/error.tsx` → `[brand]/error.tsx`
- `app/(web)/dily/znacka/[slug]/loading.tsx` → `[brand]/loading.tsx`
- `app/(web)/dily/znacka/[slug]/page.tsx` → `[brand]/page.tsx` (poté přepsán)

**Total:** 15 files, +1693 / −167 LoC

---

## Klíčová rozhodnutí

### 1. Variant A nested folders (NE catch-all)
Použity vnořené `[brand]/[model]/[rok]` namísto `[...slug]`. Důvod: explicitní typování `params`, jasné loading/error boundaries per úroveň, lepší error messages při validaci.

### 2. Seed-driven SSG (NE DB-driven)
`generateStaticParams()` čte z `PARTS_MODELS_BY_BRAND` konstanty v `lib/seo-data.ts`. Žádný Prisma call během buildu → CI s dummy DATABASE_URL projde. ISR `dynamicParams=true` na model + model+rok zachytí jakýkoli legitimní URL mimo seed (ověřeno přes `aliasFor()` + `isValidPartsYear()` + range check).

### 3. ISR config per úroveň
```ts
// brand
export const dynamic = "force-static";
export const dynamicParams = false;  // jen 8 značek ze seedu
export const revalidate = 86400;     // 24h

// model
export const dynamicParams = true;   // future modely bez rebuildu

// model+rok
export const dynamicParams = true;   // future ročníky 2000..currentYear+1
```

### 4. Diakritika canonicalization přes `aliasFor()` z #87a
Každý template volá `aliasFor(brand)` + `aliasFor(model)` na začátku. Pokud non-canonical → `permanentRedirect()` (301). Příklad: `/dily/znacka/škoda/octávia/2018` → `/dily/znacka/skoda/octavia/2018`.

### 5. Year validace 3-step
1. Regex `/^\d{4}$/` + range 2000..currentYear+1 (`isValidPartsYear()`)
2. Match against `getValidYearsForModel()` — expanded z model.generations[].yearFrom..yearTo
3. Pokud rok mimo všechny generace → `notFound()`

Vrací 404 pro nesmyslné kombinace (např. `/bmw/rada-3/1995` — generace začíná 2005).

### 6. Prisma helpers wrapped v try/catch
`getTopPartsForBrand()` + 2 sourozenci v `lib/seo/partsItemList.ts` vrací `{ parts: [] }` pokud Prisma fails. Důvod: dummy DATABASE_URL build během CI nesmí selhat. Ekvivalent vzoru z `app/sitemap.ts`.

---

## Acceptance Criteria — verifikace

| AC | Popis | Stav |
|---|---|---|
| AC1 | Nested route folders existují (3 vrstvy) | ✅ |
| AC2 | `generateStaticParams()` vrací správný počet (8 / 24 / 72) | ✅ build manifest |
| AC3 | `force-static` + `revalidate=86400` na všech 3 templates | ✅ |
| AC4 | `dynamicParams` per úroveň (false/true/true) | ✅ |
| AC5 | `aliasFor()` 301 redirect pro diakritika | ✅ kód, AC15 manual |
| AC6 | `isValidPartsYear()` regex + range check | ✅ |
| AC7 | `getValidYearsForModel()` generation match | ✅ → 404 |
| AC8 | BreadcrumbList + ItemList + FAQPage + Organization JSON-LD | ✅ |
| AC9 | `generateMetadata`: title/description/canonical/openGraph | ✅ |
| AC10 | `PartsBreadcrumbs` reusable component | ✅ shared 3 templates |
| AC11 | Prisma helpers safe pro dummy DATABASE_URL | ✅ try/catch |
| AC12 | Sitemap obsahuje +96 nových URL (24 + 72) | ✅ |
| AC13 | tsc 0 errors, lint 0 errors (warnings preserved baseline) | ✅ |
| AC14 | Build EXIT 0 + 104 nových SSG pages | ✅ 402 total SSG |
| AC15 | Manual diakritika curl test | 🟡 post-deploy QA |
| AC16 | Google Rich Results Test (BreadcrumbList + ItemList + FAQPage) | 🟡 post-deploy QA |

---

## Quality gates

```bash
# Pre-commit gates (all PASS):
npx tsc --noEmit              → 0 errors
npx next lint                 → 0 errors / 542 warnings (baseline preserved)
DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm run build
                              → EXIT 0, 402 SSG pages total
DATABASE_URL=<real> npm run build → EXIT 0
npx vitest run                → 141/141 passing
```

Build counts (verified via Next.js build manifest output):
- `/dily/znacka/[brand]` → `[+5 more paths]` = 8 SSG ✅
- `/dily/znacka/[brand]/[model]` → `[+21 more paths]` = 24 SSG ✅
- `/dily/znacka/[brand]/[model]/[rok]` → `[+69 more paths]` = 72 SSG ✅

---

## Out of scope (→ #87c follow-up)

- Long-form content (1000+ slov per landing)
- `SeoContent` Prisma model pro CMS-managed copy
- Pricing aggregations (avg/min/max cena per brand/model/rok)
- AI-generated FAQ z Anthropic API
- On-demand revalidation API (`POST /api/revalidate`)
- Sitemap XML chunking (>50k URLs)

---

## Reference

- Plan: `.claude-context/tasks/plan-task-124-3segment-routing.md`
- Predecessor: #87a (diakritika foundation, `aliasFor()`, brand+kategorie templates) — commit `f09773c` and earlier
- CI unblocker: #126 admin force-dynamic — commit `f2d80bf`
- Commit: `1466223` (15 files, +1693 / −167)
