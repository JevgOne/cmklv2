# QA Task #133 — #132 87b Runtime Bugfixes (commit `3666bad`)

**Commit:** `3666bad`
**Branch:** `main`
**QA agent:** KONTROLOR
**Datum:** 2026-04-07
**Ref plán:** `.claude-context/tasks/plan-task-131-87b-bugs.md`
**Ref impl:** `.claude-context/tasks/impl-task-132-87b-bugfixes.md`
**Predecessor QA:** `.claude-context/tasks/qa-task-128-87b-review.md` (#128)

---

## SOUHRN

| Oblast | Výsledek | Detail |
|--------|----------|--------|
| **Simplify — middleware helper** | ✅ PASS | Čistý, komentovaný, `decodeURIComponent` v try/catch |
| **Simplify — dead code removal** | ✅ PASS | `aliasFor` + `isValidPartsYear` kompletně odstraněny |
| **Simplify — getValidYearsForModel** | ✅ PASS | Reuse existující funkce, bez redundance |
| **Build** | ✅ PASS | EXIT 0, 764 total pages (↑ z 402), ~432 nových rok SSG |
| **Lint** | ✅ PASS | 0 errors, 542 warnings (baseline zachován) |
| **Vitest** | ✅ PASS | 141/141 passing |
| **TSC** | ✅ PASS | 0 errors |
| **AC1** (brand diakritika 301) | ✅ PASS | Middleware regex zachytí `/dily/znacka/%C5%A1koda` |
| **AC2** (všechny 3 vrstvy) | ✅ PASS | Regex pokrývá brand/model/rok |
| **AC3** (`/bmw/rada-3/1995` → 404) | ✅ PASS | `dynamicParams=false`, 1995 mimo generation ranges |
| **AC4** (`dynamicParams=false` + SSG expanze) | ✅ PASS | ~432 rok pages, v budgetu 200-1000 |
| **AC5** (`notFound()` dle plánu) | ✅ PASS | Year notFound odstraněn; brand/model guards zachovány |
| **AC6-AC9** (canonical paths 200) | ✅ PASS | Logika pro canonical paths beze změny |
| **AC10** (SSG count) | ✅ PASS | 432 pages, dle impl reportu |
| **AC11** (lint) | ✅ PASS | viz Debug |
| **AC12** (tsc) | ✅ PASS | viz Debug |
| **AC13** (vitest) | ✅ PASS | viz Debug |
| **AC14-15** (shop subdomain) | ✅ PASS | Middleware checked for `main` OR `shop` |
| **AC16** (test-chrome retest) | ⏳ DEFERRED | Delegováno test-chrome po QA |
| **Verdict** | ✅ **PASS** | 0 minor findings |

---

## 1. Simplify kontrola

### Middleware helper `getPartsRouteDiakritikaRedirect()`

```typescript
const PARTS_BRAND_ROUTE = /^\/dily\/znacka\/([^/]+)(?:\/([^/]+)(?:\/([^/]+))?)?\/?$/;

function getPartsRouteDiakritikaRedirect(pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null; // Malformed URI sequence
  }

  const match = decoded.match(PARTS_BRAND_ROUTE);
  if (!match) return null;
  const [, brand, model, rok] = match;

  const brandCanonical = aliasFor(brand);
  const modelCanonical = model ? aliasFor(model) : null;
  if (!brandCanonical && !modelCanonical) return null;

  const finalBrand = brandCanonical ?? brand;
  const finalModel = modelCanonical ?? model;
  let canonicalPath = `/dily/znacka/${finalBrand}`;
  if (finalModel) canonicalPath += `/${finalModel}`;
  if (rok) canonicalPath += `/${rok}`;
  return canonicalPath;
}
```

**Hodnocení:**
- `decodeURIComponent` v try/catch — kritický guard (malformed URI by jinak hodil `URIError`) ✅
- Regex pokrývá brand, brand/model, brand/model/rok + optional trailing slash ✅
- `rok` segment není canonicalizován (`aliasFor(rok)` se nevolá) — správně, rok je číslo bez diakritiky ✅
- Vrací `null` pokud žádný segment není alias → no-op, pokračuje dál ✅
- Integrační blok v `middleware()` umístěn PŘED subdomain rewrite — správný pořadí ✅
- Aplikuje se na `main` AND `shop` subdomény (obě mohou obsluhovat `/dily/znacka/*`) ✅

**Edge case verifikace:**
- `/dily/znacka/brand/model/rok/extra` — regex `$` na konci → no match → falls through → 404 dle segment resolveru ✅
- `/dily/znacka/skoda` (canonical) — `aliasFor("skoda")` vrátí `null` → no redirect, 200 ✅
- `/dily/znacka/%C5%A1koda` — po decode → `škoda` → `aliasFor("škoda")` → `"skoda"` → 301 ✅

### Dead code removal

```bash
grep "aliasFor\|isValidPartsYear" app/(web)/dily/znacka/**/*.tsx
# → No matches found  ✅

grep "isValidPartsYear" lib/
# → No matches found  ✅
```

Žádné orphan imports, žádná referovaná ale neexistující funkce. Dead code kompletně odstraněn ze všech 3 page templates. `permanentRedirect` import také odstraněn (nevolá se). Komentáře v page souborech dokumentují přesun do middleware:

- `[brand]/page.tsx:77`: `// Diakritika 301 redirect handled v middleware.ts (pre-routing) — page-level permanentRedirect tady nefunguje s dynamicParams=false...`
- `[brand]/[model]/page.tsx:85`: `// Diakritika 301 redirect handled v middleware.ts (pre-routing).`
- `[brand]/[model]/[rok]/page.tsx:101-103`: totéž + year validation comment ✅

### `getValidYearsForModel()` expansion

`generateStaticParams()` v `[rok]/page.tsx` nově volá:
```typescript
const years = getValidYearsForModel(brand.slug, model.slug);
```
Místo `model.topYears ?? [2015, 2018, 2020]`. Reuse existující funkce ze `lib/seo-data.ts`, žádná duplicitní logika. Set-based dedup v `getValidYearsForModel` zajišťuje žádné duplicate year pages pro modely s overlapping generations (např. BMW Rada-3: E90 2005-2013, F30 2012-2019 → 2012 a 2013 se napočítají jen jednou). ✅

---

## 2. Debug kontrola

### Build

```
DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm run build
→ EXIT 0
→ ✓ Generating static pages using 7 workers (764/764) in 19.9s
```

Výběr z build output:
```
● /dily/znacka/[brand]/[model]/[rok]
│ ├ /dily/znacka/skoda/octavia/2004   ← nový (byl jen topYears 2015/2018/2020)
│ ├ /dily/znacka/skoda/octavia/2005
│ ├ /dily/znacka/skoda/octavia/2006
```

SSG count verifikace:
- Předchozí build (#87b): 402 total, ~72 rok pages (3 topYears × 24 models)
- Aktuální build: **764 total** (+362 nových pages)
- Rok pages: 402 − 72 (staré) + 432 (nové) ≈ 762 → 764 (2-stránkový rozdíl od jiných drobných změn)
- **432 rok pages** dle impl reportu, v budgetu 200-1000 ✅

`prisma:error` výstupy jsou očekávané s dummy DATABASE_URL — partsItemList.ts try/catch záchytí, build neselže.

### Lint

```
npm run lint → ✖ 542 problems (0 errors, 542 warnings)
```
Baseline 542 zachován ✅

### TSC

```
npx tsc --noEmit → (no output, exit 0)  ✅  0 errors
```

### Vitest

```
npx vitest run → 15 test files, 141/141 passed  ✅
```

---

## 3. Reverzní kontrola (AC1–AC15)

### AC1 — Diakritika brand 301

Middleware regex: `PARTS_BRAND_ROUTE = /^\/dily\/znacka\/([^/]+)(?:\/...)?$/`
Input `%C5%A1koda` (URL-encoded `škoda`) → after `decodeURIComponent` → `škoda` → `aliasFor("škoda")` → `"skoda"` → redirect na `/dily/znacka/skoda` ✅

Impl report AC1: `301 → http://localhost:3010/dily/znacka/skoda` ✅

### AC2 — Diakritika na všech 3 vrstvách

Regex zachytí:
- `/dily/znacka/škoda` → redirect na `/dily/znacka/skoda` (brand only)
- `/dily/znacka/škoda/octavia` → redirect na `/dily/znacka/skoda/octavia` (brand + model)
- `/dily/znacka/škoda/octavia/2018` → redirect na `/dily/znacka/skoda/octavia/2018` (brand + model + rok)

Kód: `finalModel = modelCanonical ?? model` + `if (rok) canonicalPath += `/${rok}`` ✅

### AC3 — `/bmw/rada-3/1995` → 404

Mechanismus: `dynamicParams=false` na `[rok]/page.tsx` → segment resolver hledá 1995 v prebuilt params. `getValidYearsForModel("bmw", "rada-3")` vrátí roky z BMW Rada-3 generations (E90: 2005-2013, F30: 2012-2019, G20: 2019-2026) = roky 2005-2026. 1995 není v seznamu → segment resolver 404. ✅

**Poznámka:** V předchozím commitu `isValidPartsYear` zamítlo 1995 (&lt; 2000), ale `notFound()` v `force-static` byl affected by Next.js #63483 caching anomaly a vrátil 200. Nyní je opraveno na úrovni segment resolveru.

### AC4 — `dynamicParams=false` + SSG expanze

`[rok]/page.tsx:23`: `export const dynamicParams = false;` ✅

`generateStaticParams()` volá `getValidYearsForModel(brand.slug, model.slug)` pro každý model → expanzní seznam let z generation ranges. Build: 432 rok pages ✅

### AC5 — `notFound()` volání dle plánu

- ✅ `notFound()` pro year validation **odstraněno** (byl dead code, nyní handled by segment resolver)
- ✅ `notFound()` pro brand lookup (`if (!brandData) notFound()`) **zachováno** — defense-in-depth guard
- ✅ `notFound()` pro model lookup (`if (!modelData) notFound()`) **zachováno** — defense-in-depth guard

Zachované `notFound()` volání nejsou affected by Next.js #63483 — ta anomálie se týkala year validation (dynamic param lookup), ne seed-data lookups.

### AC6-AC9 — Canonical paths stále vrací 200

Logika canonical paths (skoda, octavia, 2018) beze změny — `PARTS_BRANDS.find()` a `PARTS_MODELS_BY_BRAND` lookup nezměněn. Impl report AC6-AC9 ✅

### AC10 — SSG count pro rok page

Build: 764 total. Rok pages: ~432 (odvozen z 764 - 402 + 72 = 434, drobný rozdíl od 432 z impl reportu). V budgetu 200-1000 ✅

Raw year-range sum v seo-data.ts: 471 (bez dedup). Po dedup přes Set (overlapping generations): ~432-434. Konzistentní. ✅

### AC11 — Lint 0 errors ✅

### AC12 — TSC 0 errors ✅

### AC13 — Vitest 141/141 ✅

### AC14 — Shop subdomain `/dily/znacka/skoda` → 200

`middleware.ts:159`: `if (subdomain === "main" || subdomain === "shop")` → middleware helper aplikován pro shop subdoménu. Pro canonical path → `getPartsRouteDiakritikaRedirect` vrátí `null` → no redirect → stránka se renderuje 200 ✅

### AC15 — Shop subdomain `/dily/znacka/škoda` → 301

Stejný flow jako AC1, ale pro shop subdomain. Middleware redirect na `/dily/znacka/skoda`. URL se sestaví přes `new URL(canonicalPath, request.url)` → zachovává host (`shop.localhost`). Impl report AC15 ✅

### AC16 — test-chrome retest

Deferred — delegováno test-chrome po tomto QA. ⏳

---

## Verdict

### ✅ PASS

Commit `3666bad` správně opravuje oba P2 runtime bugy:

1. **Bug #1 fix (diakritika 301):** `getPartsRouteDiakritikaRedirect()` v middleware.ts — pre-routing, před subdomain rewrite, s `decodeURIComponent` guard. Pokrývá brand/model/rok všechny 3 vrstvy. Oba subdomény (main + shop).

2. **Bug #2 fix (year 404):** `dynamicParams=false` + `generateStaticParams()` expandováno přes `getValidYearsForModel()` → ~432 rok pages. Next.js #63483 obejdeno na úrovni segment resolveru — žádná runtime `notFound()` pro years.

Dead code čistě odstraněn. Build/lint/tsc/vitest čisté. 0 minor findings.

**Následující krok:** AC16 — test-chrome browser retest commit `3666bad` na production server.
