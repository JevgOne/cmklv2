---
name: Plán #131 — Fix runtime bugů #87b (diakritika 301 + year 404)
description: Rychlý fix-plan pro 2 P2 runtime bugy v 3-segment routingu — diakritika alias 301 redirect nefunguje na brand/model pages (dynamicParams=false swallowne request) + year validation nefunguje na rok page (notFound() v force-static má caching anomálii). Cíl: 10/12 → 12/12 PASS minimálním zásahem.
type: plan
task_id: 131
queue_id: 130
parent_plan: plan-task-124-3segment-routing.md
related_impl: "#87b IMPL (commit 1466223)"
related_test: "#130 TEST-CHROME (test-chrome browser run)"
related_review: "#129 EVZEN REVIEW, #128 KONTROLOR (oba PASS — bug není odhalitelný statickou analýzou)"
revision_history:
  - 2026-04-07 — initial draft (planovac, dispatch #131)
  - 2026-04-07 — lead-approved Q1-Q4 (team-lead): Strategie A schválena. Q1 dynamicParams override APPROVED (justified by Next.js #63483 runtime bug). Q2 SSG ~500-600 APPROVED. Q3 middleware diakritika APPROVED. Q4 isValidPartsYear → SMAZAT (override Doporučení "zachovat" — team-lead chce dead code cleanup).
---

# Plán #131 — Fix runtime bugů #87b

> **Cíl:** Opravit 2 P2 runtime bugy v 3-segment routingu odhalené test-chrome #130. Minimal-touch fix pro `10/12 PASS → 12/12 PASS`. Bezpečné na deploy, žádný refactor scope creep.

---

## 0 — Executive summary (TL;DR)

**2 P2 runtime bugy:**

| # | URL | Aktuální stav | Očekávaný stav |
|---|-----|---------------|----------------|
| Bug #1 | `/dily/znacka/škoda` | 404 | 301 → `/dily/znacka/skoda` |
| Bug #2 | `/dily/znacka/bmw/rada-3/1995` | 200 (homepage title) | 404 |

**Root cause oba bugy = Next.js 15 routing/render lifecycle interakce s našimi page-level guards:**
1. `dynamicParams = false` na brand page **zachytí request DŘÍVE** než page function spustí → `aliasFor()` redirect nikdy nedostane šanci.
2. `notFound()` v `force-static` modu má známou caching anomálii ([Next.js issue #63483](https://github.com/vercel/next.js/issues/63483)) — místo 404 se cachuje fallback render.

**Doporučená fix strategie (2 změny v 1 commit):**

1. **Diakritika 301 redirect → přesunout do `middleware.ts`** (centrální routing logika, běží PŘED page resolution). Funguje pro všechny 3 templates jednotně.
2. **Year validation → expandovat `generateStaticParams()` na všechny valid years per model + nastavit `dynamicParams = false`** na rok page. Eliminuje runtime validaci, využije Next.js segment-level 404.

**Tradeoffs vs plán-124:**
- **§10.4 dynamicParams=true na rok → false** — VIOLATION plánu. Důvod: notFound() nelze v `force-static` spolehlivě použít. ✅ **LEAD-APPROVED 2026-04-07** (justified by Next.js #63483 runtime bug — vendor issue, ne náš).
- **§10.4 SSG count rok page 72 → ~500-600** — důsledek expanze generateStaticParams. Build time +20-40s, CDN OK. ✅ **LEAD-APPROVED 2026-04-07** (akceptovatelný engineering tradeoff; pokud > 1000, fallback na Strategii B).
- **`force-static` (Q4) zůstává** — žádný regress.

**Effort:** ~1.5-2.5 h dev work (1 file middleware.ts + 3 page.tsx files dead code removal + verify build + test). 0 nových npm deps.

---

## 1 — Reproduction commands

### Bug #1 — Diakritika 301 nefunguje

```bash
# Lokálně po `npm run dev`
curl -I http://localhost:3000/dily/znacka/škoda
# AKTUÁLNĚ:  HTTP/1.1 404 Not Found
# OČEKÁVÁNO: HTTP/1.1 301 Moved Permanently
#            Location: /dily/znacka/skoda

curl -I http://localhost:3000/dily/znacka/škoda/octávia
# Stejný problém — 404 místo 301 → /dily/znacka/skoda/octavia

curl -I http://localhost:3000/dily/znacka/škoda/octávia/2018
# Stejný problém — 404 místo 301 → /dily/znacka/skoda/octavia/2018
```

**Pozn.:** URL diakritika v shellu se musí URL-encodovat — curl typicky encoduje automaticky, ale lze i explicitně: `curl -I http://localhost:3000/dily/znacka/%C5%A1koda`.

### Bug #2 — Year validation nefunguje

```bash
# Year mimo range (< 2000)
curl -I http://localhost:3000/dily/znacka/bmw/rada-3/1995
# AKTUÁLNĚ:  HTTP/1.1 200 OK + body obsahuje "CarMakléř | Prodej aut..."
# OČEKÁVÁNO: HTTP/1.1 404 Not Found

curl -s http://localhost:3000/dily/znacka/bmw/rada-3/1995 | grep -oP '<title[^>]*>\K[^<]+'
# AKTUÁLNĚ:  CarMakléř | Prodej aut přes certifikované makléře
# (To je root layout default title — důkaz, že page neyrenderuje vlastní content)

# Year mimo modelové generations (např. BMW 3 série v 1899)
curl -I http://localhost:3000/dily/znacka/bmw/rada-3/1899
# Stejný problém — 200 místo 404

# Year mimo regex (5 cifer, ne-numerický)
curl -I http://localhost:3000/dily/znacka/bmw/rada-3/abcd
# isValidPartsYear() → false → notFound() → ale silently swallowed
```

### Verify-after-fix commands

```bash
# Po fixu — všechno musí PASSnout
curl -I http://localhost:3000/dily/znacka/škoda                      # 301 → /skoda
curl -I http://localhost:3000/dily/znacka/škoda/octávia              # 301 → /skoda/octavia
curl -I http://localhost:3000/dily/znacka/škoda/octávia/2018         # 301 → /skoda/octavia/2018
curl -I http://localhost:3000/dily/znacka/bmw/rada-3/1995            # 404
curl -I http://localhost:3000/dily/znacka/bmw/rada-3/abcd            # 404
curl -I http://localhost:3000/dily/znacka/bmw/rada-3/2018            # 200 (valid year, must still work)
curl -I http://localhost:3000/dily/znacka/skoda                      # 200 (canonical, must still work)
curl -I http://localhost:3000/dily/znacka/skoda/octavia              # 200
curl -I http://localhost:3000/dily/znacka/skoda/octavia/2018         # 200
```

---

## 2 — Root cause analysis

### Bug #1 — Diakritika redirect nefunguje na brand/model pages

**Soubor:** `app/(web)/dily/znacka/[brand]/page.tsx:19-20`

```ts
export const dynamic = "force-static";
export const dynamicParams = false;  // ❗ ROOT CAUSE
```

**Mechanismus selhání:**

1. Next.js 15 App Router resolution sequence pro `/dily/znacka/škoda`:
   - Match dynamic segment `[brand]` → params = `{ brand: "škoda" }`
   - Check `generateStaticParams()` output → `[{brand:"skoda"},{brand:"volkswagen"},...]`
   - **`"škoda"` NENÍ v static list**
   - `dynamicParams = false` → **return 404 IMMEDIATELY**, bez spuštění page function
2. Page function (`PartsBrandPage`) **se nikdy nespustí**
3. `aliasFor("škoda")` na řádku 79 **se nikdy nezavolá**
4. `permanentRedirect()` neproběhne
5. Uživatel + crawler dostane 404 místo očekávaného 301

**Stejný mechanismus na `[brand]/[model]/page.tsx`:** dynamicParams=true tam JE, ale:
- `generateStaticParams` produkuje `{brand:"skoda",model:"octavia"}` (canonical only)
- Pro request `/skoda/octávia`: model "octávia" není v seed → page function SE spustí (díky dynamicParams=true)
- `aliasFor("octávia")` → `"octavia"` → `permanentRedirect()` proběhne ✅
- **ALE pro request `/škoda/octavia`:** brand="škoda" → není v PARTS_BRANDS → `if (!brandData) notFound()` na řádku 96 vyhodí 404 PŘED kontrolou aliasu

Wait — kontrola aliasu (řádky 87-93) JE před `notFound()`. Tedy:
```ts
const brandCanonical = aliasFor(brand);   // "škoda" → "skoda"
const modelCanonical = aliasFor(model);
if (brandCanonical || modelCanonical) {
  permanentRedirect(...);  // ✅ TOTO BY MĚLO PROBĚHNOUT
}
```

**Takže model page by měla diakritika redirect funkčně provést.** Test-chrome ale reportuje, že nefunguje. Proč?

**Hypotéza:** Test-chrome testoval pouze brand level (`/dily/znacka/škoda`). Pro model+year level (`/dily/znacka/škoda/octavia` a hlouběji) by redirect MĚL fungovat — page function se spustí (dynamicParams=true), aliasFor proběhne.

**Akcionable:** Před implementací musí test-chrome ověřit chování na všech 3 úrovních. Pokud model/year FUNGUJE a jen brand selhává, fix pro Bug #1 se zužuje na brand-only.

**Ale ze SEO konzistence:** Centralizace diakritika redirectu do middleware je čistší než per-page logika (fail-safe pro budoucí refaktory).

### Bug #2 — Year validation nefunguje na rok page

**Soubor:** `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx:21-22`

```ts
export const dynamic = "force-static";
export const dynamicParams = true;
```

**Mechanismus selhání pro `/dily/znacka/bmw/rada-3/1995`:**

1. Next.js resolution:
   - `[rok]` matches → params = `{ brand: "bmw", model: "rada-3", rok: "1995" }`
   - `{brand:"bmw",model:"rada-3",rok:"1995"}` NENÍ v generateStaticParams output (top years jen 2015, 2018, 2020)
   - `dynamicParams = true` → page function SE spustí ISR-style
2. Page function spustí:
   - `aliasFor` checks → `bmw`, `rada-3` jsou canonical → no redirect
   - `if (!isValidPartsYear("1995")) notFound();` → `1995 < 2000` → `false` → **`notFound()` zavoláno**
3. **`notFound()` v `dynamic="force-static"` mode má známou anomálii** ([next.js#63483](https://github.com/vercel/next.js/issues/63483)):
   - Místo vrácení 404 status code Next.js cachuje result jako **statickou stránku s fallback contentem**
   - Cached fallback = root layout (`app/layout.tsx`) **bez child page contentu** (page funkce neyrenderuje JSX po notFound)
   - HTTP status: ambiguous — zdá se jako 200 (test-chrome reportuje 200)
   - HTML obsahuje root layout title `"CarMakléř | Prodej aut..."` z `app/layout.tsx:18`

**Proč root layout title:** V Next.js metadata flow se `app/layout.tsx` metadata (title.default) aplikuje na celý strom. Pokud child page nedoplní vlastní title (což `generateMetadata` v `[rok]/page.tsx:71` SKUTEČNĚ NEDOPLNÍ když validace failne — vrací `{}`), root default zvítězí. Tedy title je deterministicky `"CarMakléř | Prodej aut..."`.

**Potvrzení Next.js issue:**

Z [vercel/next.js#63483](https://github.com/vercel/next.js/issues/63483):
> "Dynamic routes cache 404 pages with `dynamic = 'force-static'` and calling `notFound()`"

Issue je **otevřená a nevyřešená** v Next.js 15. Doporučený workaround: **vyhnout se `notFound()` uvnitř force-static dynamic page** — místo toho buď:
- Pre-validovat v `generateStaticParams` (jen valid params jdou do builds)
- Rewrite/redirect v `middleware.ts` (před routingem)
- Použít `dynamic = "force-dynamic"` (porušuje Q4)

---

## 3 — Fix strategy

### Strategie A — RECOMMENDED (clean separation)

**Princip:** Centralizovat všechny edge-case routing guards do `middleware.ts`. Page templates zůstanou čisté template-renderery bez validation logiky.

**Část A1 — Bug #1 fix (middleware diakritika redirect):**

V `middleware.ts` přidat blok PŘED subdomain rewrite logic:

```ts
import { aliasFor } from "@/lib/seo/slugify";

// /dily/znacka/{brand}[/{model}[/{rok}]] — diakritika alias 301 redirect
const PARTS_BRAND_ROUTE = /^\/dily\/znacka\/([^/]+)(?:\/([^/]+)(?:\/([^/]+))?)?\/?$/;

function getDiakritikaRedirect(pathname: string): string | null {
  const match = pathname.match(PARTS_BRAND_ROUTE);
  if (!match) return null;

  const [, brand, model, rok] = match;
  const brandCanonical = aliasFor(brand);
  const modelCanonical = model ? aliasFor(model) : null;
  // rok je číselný, žádný diakritika

  if (!brandCanonical && !modelCanonical) return null;

  // Reconstruct canonical path
  const canonicalBrand = brandCanonical ?? brand;
  const canonicalModel = modelCanonical ?? model;
  let canonicalPath = `/dily/znacka/${canonicalBrand}`;
  if (canonicalModel) canonicalPath += `/${canonicalModel}`;
  if (rok) canonicalPath += `/${rok}`;
  return canonicalPath;
}
```

A v `middleware()` function ihned po site-password check (řádek 117), PŘED subdomain rewrite (řádek 122):

```ts
// Diakritika 301 redirect pro /dily/znacka/* (jen na main subdoméně)
if (subdomain === "main" || subdomain === "shop") {
  const canonicalPath = getDiakritikaRedirect(pathname);
  if (canonicalPath) {
    return NextResponse.redirect(new URL(canonicalPath, request.url), 301);
  }
}
```

**Pozn. shop subdomain:** Na shop subdoméně jsou /dily/* paths handlované přes shouldSkipRewrite (řádek 70: `if (pathname.startsWith("/dily")) return null;`). Diakritika redirect tedy musí běžet PŘED rewrite na obou subdoménách (main + shop).

**Část A2 — Bug #2 fix (expand generateStaticParams + dynamicParams=false):**

V `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx`:

```ts
// Line 22 — change:
export const dynamicParams = false;  // bylo: true

// Lines 43-59 — replace generateStaticParams:
export function generateStaticParams() {
  const params: { brand: string; model: string; rok: string }[] = [];
  for (const brand of PARTS_BRANDS) {
    const models = PARTS_MODELS_BY_BRAND[brand.slug] || [];
    for (const model of models) {
      // EXPAND: all valid years (z generation ranges) místo jen topYears
      const validYears = getValidYearsForModel(brand.slug, model.slug);
      for (const year of validYears) {
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

Důsledek: ~500-600 SSG pages (závisí na seed generation ranges), žádný runtime year validation potřebný — neplatné years → automatický 404 z Next.js segment resolveru.

**Část A3 — Cleanup dead code v page.tsx:**

V `[rok]/page.tsx`:

- **Odstranit** import `isValidPartsYear` z `lib/seo-data` (line 14) — už není potřeba v page.tsx (jen v generateStaticParams přes `getValidYearsForModel`).
- **Odstranit** `isValidPartsYear` check v `generateMetadata` (line 71) — neproběhne, protože dynamicParams=false zaručí jen valid params.
- **Odstranit** `if (!isValidPartsYear(rok)) notFound();` (line 106) — viz výše.
- **Odstranit** `validYears` block (lines 119-122):
  ```ts
  const validYears = getValidYearsForModel(brand, model);
  if (validYears.length > 0 && !validYears.includes(year)) {
    notFound();
  }
  ```
- **Odstranit** `aliasFor()` calls (lines 97-104) — middleware už řeší.

V `[brand]/[model]/page.tsx`:
- **Odstranit** `aliasFor()` calls (lines 86-93) — middleware už řeší.

V `[brand]/page.tsx`:
- **Odstranit** `aliasFor()` calls (lines 78-82) — middleware už řeší (a stejně nikdy nefungovaly kvůli dynamicParams=false).

**Pozn.:** `notFound()` calls pro neznámé brand/model (`if (!brandData) notFound()` apod.) ZŮSTÁVAJÍ — ty fungují správně i ve force-static, protože:
- Brand level: dynamicParams=false → unknown brand → automatický 404 (notFound() v page nepotřebný, ale jako safety net OK)
- Model level: dynamicParams=true → unknown model → page function spustí → notFound()
- Rok level po fixu: dynamicParams=false → unknown rok → automatický 404

### Strategie B — Alternative (NOT RECOMMENDED, jen pro úplnost)

**Princip:** Middleware-only — i year validation v middleware. Zachová `dynamicParams=true` na rok page (žádná deviation od plánu §10.4).

**Pros:**
- Žádný build SSG count nárůst (zůstává 72 SSG na rok page)
- Žádná deviation plánu §10.4

**Cons:**
- Year validation v middleware musí aktualizovat regex pro kontrolu rok-segment (4 cifry, range 2000-current+1)
- Middleware musí umět vrátit 404 styled stránku — jen `new NextResponse(null, {status:404})` vrací RAW prázdný 404 (špatné UX)
- Pro styled 404 by musel rewrite na neexistující path → composite logic
- Year validation in 2 places (middleware + getValidYearsForModel duplicate)

### Strategie C — Workaround (NOT RECOMMENDED)

**Princip:** Změnit `dynamic = "force-dynamic"` na rok page → `notFound()` funguje normálně.

**Cons:**
- **VIOLATION Q4** ze schváleného plánu-124 (force-static schválen pro všech 3 templates)
- Performance regress: každý request runs server-side
- Žádný ISR cache → CDN miss → vyšší TTFB
- Není v souladu s SEO pre-render strategií

**Doporučení:** **Zvolit Strategii A** — clean separation + minimální deviation plánu (jen §10.4 SSG count + dynamicParams=false na rok page).

---

## 4 — Affected files (file-by-file diff)

### Soubor 1: `middleware.ts` (MODIFY — add diakritika redirect)

**Diff:**

```diff
 import { NextResponse } from "next/server";
 import type { NextRequest } from "next/server";
 import { getToken } from "next-auth/jwt";
 import { getSubdomain, type SubdomainType } from "@/lib/subdomain";
+import { aliasFor } from "@/lib/seo/slugify";

 const ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"];
 // ... existing role constants ...

+/**
+ * /dily/znacka/{brand}[/{model}[/{rok}]] diakritika 301 redirect.
+ * Vrací canonical path pokud aspoň jeden segment má diakritika alias, jinak null.
+ */
+const PARTS_BRAND_ROUTE = /^\/dily\/znacka\/([^/]+)(?:\/([^/]+)(?:\/([^/]+))?)?\/?$/;
+
+function getPartsRouteDiakritikaRedirect(pathname: string): string | null {
+  const match = pathname.match(PARTS_BRAND_ROUTE);
+  if (!match) return null;
+  const [, brand, model, rok] = match;
+
+  const brandCanonical = aliasFor(brand);
+  const modelCanonical = model ? aliasFor(model) : null;
+  if (!brandCanonical && !modelCanonical) return null;
+
+  const finalBrand = brandCanonical ?? brand;
+  const finalModel = modelCanonical ?? model;
+  let canonicalPath = `/dily/znacka/${finalBrand}`;
+  if (finalModel) canonicalPath += `/${finalModel}`;
+  if (rok) canonicalPath += `/${rok}`;
+  return canonicalPath;
+}
+
 // Cesty, které se nemají rewritovat ...
 const SKIP_REWRITE_PREFIXES = [ ... ];

 // ... existing helper functions ...

 export async function middleware(request: NextRequest) {
   const { pathname } = request.nextUrl;

   // Site-wide password ochrana — jen pokud je SITE_PASSWORD nastaveno v env
   const sitePassword = process.env.SITE_PASSWORD || null;
   if (sitePassword && !shouldSkipSiteAuth(pathname)) { ... }

   // Detekce subdomény
   const host = request.headers.get("host") || "localhost:3000";
   const subdomain = getSubdomain(host);

+  // Diakritika 301 redirect pro /dily/znacka/* — musí běžet PŘED subdomain rewrite
+  // Aplikuje se na main + shop (oba mohou mít /dily/znacka/* paths po rewrite)
+  if (subdomain === "main" || subdomain === "shop") {
+    const canonicalPath = getPartsRouteDiakritikaRedirect(pathname);
+    if (canonicalPath) {
+      return NextResponse.redirect(new URL(canonicalPath, request.url), 301);
+    }
+  }
+
   // Subdomain rewrite
   const rewriteUrl = getRewriteUrl(subdomain, pathname, request);
   if (rewriteUrl) { ... }

   // ... rest of auth checks ...
 }
```

**Změna +20 řádků, 0 odstraněných.**

---

### Soubor 2: `app/(web)/dily/znacka/[brand]/page.tsx` (MODIFY — remove dead aliasFor)

**Diff:**

```diff
 import type { Metadata } from "next";
-import { notFound, permanentRedirect } from "next/navigation";
+import { notFound } from "next/navigation";
 import Link from "next/link";
 import {
   generateOrganizationJsonLd,
   generatePartsItemListJsonLd,
   generateFaqPageJsonLd,
 } from "@/lib/seo";
 import {
   PARTS_BRANDS,
   PARTS_CATEGORIES,
   PARTS_MODELS_BY_BRAND,
   BASE_URL,
 } from "@/lib/seo-data";
-import { aliasFor } from "@/lib/seo/slugify";
 import { getTopPartsForBrand } from "@/lib/seo/partsItemList";
 import { PartsBreadcrumbs } from "@/components/web/dily/PartsBreadcrumbs";

 // ... rest unchanged ...

 export default async function PartsBrandPage({
   params,
 }: {
   params: Promise<{ brand: string }>;
 }) {
   const { brand } = await params;

-  // Diakritika alias 301 — `škoda` → `skoda`
-  const canonical = aliasFor(brand);
-  if (canonical) {
-    permanentRedirect(`/dily/znacka/${canonical}`);
-  }
-
   const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
   if (!brandData) notFound();
   // ... rest unchanged ...
```

**Změna -7 řádků, +1 řádek (úprava import).**

---

### Soubor 3: `app/(web)/dily/znacka/[brand]/[model]/page.tsx` (MODIFY — remove dead aliasFor)

**Diff:**

```diff
 import type { Metadata } from "next";
-import { notFound, permanentRedirect } from "next/navigation";
+import { notFound } from "next/navigation";
 import Link from "next/link";
 // ...
-import { aliasFor } from "@/lib/seo/slugify";
 import { getTopPartsForBrandModel } from "@/lib/seo/partsItemList";
 // ...

 export default async function PartsBrandModelPage({
   params,
 }: {
   params: Promise<{ brand: string; model: string }>;
 }) {
   const { brand, model } = await params;

-  // Diakritika alias 301 — `škoda/octávia` → `skoda/octavia`
-  const brandCanonical = aliasFor(brand);
-  const modelCanonical = aliasFor(model);
-  if (brandCanonical || modelCanonical) {
-    permanentRedirect(
-      `/dily/znacka/${brandCanonical ?? brand}/${modelCanonical ?? model}`
-    );
-  }
-
   const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
   if (!brandData) notFound();
   // ... rest unchanged ...
```

**Změna -10 řádků, +1 řádek (úprava import).**

---

### Soubor 4: `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` (MODIFY — biggest change)

**Diff:**

```diff
 import type { Metadata } from "next";
-import { notFound, permanentRedirect } from "next/navigation";
+import { notFound } from "next/navigation";
 import Link from "next/link";
 import {
   generateOrganizationJsonLd,
   generatePartsItemListJsonLd,
   generateFaqPageJsonLd,
 } from "@/lib/seo";
 import {
   PARTS_BRANDS,
   PARTS_MODELS_BY_BRAND,
   PARTS_CATEGORIES,
   BASE_URL,
-  isValidPartsYear,
   getValidYearsForModel,
 } from "@/lib/seo-data";
-import { aliasFor } from "@/lib/seo/slugify";
 import { getTopPartsForBrandModelYear } from "@/lib/seo/partsItemList";
 import { PartsBreadcrumbs } from "@/components/web/dily/PartsBreadcrumbs";

 export const dynamic = "force-static";
-export const dynamicParams = true;
+export const dynamicParams = false;
 export const revalidate = 86400;

 // ... UNIVERSAL_FAQS unchanged ...

 export function generateStaticParams() {
   const params: { brand: string; model: string; rok: string }[] = [];
   for (const brand of PARTS_BRANDS) {
     const models = PARTS_MODELS_BY_BRAND[brand.slug] || [];
     for (const model of models) {
-      const years = model.topYears ?? [2015, 2018, 2020];
+      // Generate ALL valid years from generation ranges
+      // (eliminuje runtime year validation — invalid years → 404 z Next.js segment resolveru)
+      const years = getValidYearsForModel(brand.slug, model.slug);
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

 export async function generateMetadata({
   params,
 }: {
   params: Promise<{ brand: string; model: string; rok: string }>;
 }): Promise<Metadata> {
   const { brand, model, rok } = await params;
   const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
   const modelData = (PARTS_MODELS_BY_BRAND[brand] || []).find(
     (m) => m.slug === model
   );
-  if (!brandData || !modelData || !isValidPartsYear(rok)) return {};
+  if (!brandData || !modelData) return {};
   // ... rest unchanged ...
 }

 export default async function PartsBrandModelYearPage({
   params,
 }: {
   params: Promise<{ brand: string; model: string; rok: string }>;
 }) {
   const { brand, model, rok } = await params;

-  // Diakritika alias 301
-  const brandCanonical = aliasFor(brand);
-  const modelCanonical = aliasFor(model);
-  if (brandCanonical || modelCanonical) {
-    permanentRedirect(
-      `/dily/znacka/${brandCanonical ?? brand}/${modelCanonical ?? model}/${rok}`
-    );
-  }
-
-  if (!isValidPartsYear(rok)) notFound();
-
   const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
   if (!brandData) notFound();

   const modelData = (PARTS_MODELS_BY_BRAND[brand] || []).find(
     (m) => m.slug === model
   );
   if (!modelData) notFound();

   const year = parseInt(rok, 10);

-  // Pokud rok je mimo všechny generation ranges → 404
-  const validYears = getValidYearsForModel(brand, model);
-  if (validYears.length > 0 && !validYears.includes(year)) {
-    notFound();
-  }
-
   const { parts: topParts } = await getTopPartsForBrandModelYear(
     brandData.name,
     modelData.name,
     year
   );
   // ... rest unchanged ...
```

**Změna -23 řádků, +5 řádků (komentáře + úprava generateStaticParams).**

---

### Soubor 5 (REQUIRED, lead-approved 2026-04-07): `lib/seo-data.ts` — SMAZAT `isValidPartsYear`

`isValidPartsYear` se po fixu už nepoužívá nikde v page.tsx.

**✅ LEAD DECISION 2026-04-07:** **SMAZAT.** Team-lead override Doporučení "Nechat" — "Dead code je tech debt. Implementator ať odstraní i helper + jeho test (pokud existuje). Nechci 'dead code for future use' patterns — můžeme to vrátit když bude potřeba."

**Implementator action items:**
1. Odstranit `export function isValidPartsYear(...)` z `lib/seo-data.ts`
2. Grepnout `isValidPartsYear` napříč repem — odstranit všechny zbylé importy/usages
3. Pokud existuje unit test (`lib/seo-data.test.ts` nebo podobné), odstranit i příslušné test cases
4. Verify `npm run build` + `npx tsc --noEmit` PASS (žádné dangling references)

---

## 5 — Tradeoffs vs plán-124

| Aspekt | Plán #124 §10.4 | Po fixu #131 | Důsledek |
|--------|-----------------|--------------|----------|
| `[rok]/page.tsx` `dynamicParams` | `true` | **`false`** | ❗ DEVIATION — vyžaduje team-lead override schválení |
| `[rok]/page.tsx` SSG count | 72 (24 modelů × 3 top years) | **~500-600** (24 modelů × ~25 valid years avg) | Build time +20-40s, CDN OK, žádný memory issue |
| `[rok]/page.tsx` ISR fallback | Yes (24h revalidate, runtime build pro long-tail) | **No** (všechny valid years pre-built) | Eliminuje long-tail flexibility, ale eliminuje broken validation |
| `[brand]/page.tsx` dynamicParams | `false` | `false` (unchanged) | ✅ Žádný regress |
| `[brand]/[model]/page.tsx` dynamicParams | `true` | `true` (unchanged) | ✅ Žádný regress |
| `dynamic = "force-static"` (Q4) | All 3 templates | **All 3 templates (unchanged)** | ✅ Q4 zachován |
| Diakritika 301 redirect location | Page.tsx (v plánu §6) | **middleware.ts** | DEVIATION — design improvement, čistší separation of concerns |
| Total SSG count | 8 + 24 + 72 = **104** | 8 + 24 + ~600 = **~632** | 6× more pages, ale buildable |

**Pozn. SSG count odhad:** Závisí na rozsahu generation ranges v `PARTS_MODELS_BY_BRAND` seedu. Konkrétní číslo lze ověřit tímto JS skriptem (lze běžet po fixu pro report):

```js
// scripts/count-rok-ssg.ts (volitelné)
import { PARTS_BRANDS, PARTS_MODELS_BY_BRAND, getValidYearsForModel } from "@/lib/seo-data";
let total = 0;
for (const brand of PARTS_BRANDS) {
  for (const model of PARTS_MODELS_BY_BRAND[brand.slug] || []) {
    total += getValidYearsForModel(brand.slug, model.slug).length;
  }
}
console.log("Total rok SSG count:", total);
```

**Akceptovatelný range:** 200-1000 SSG. Pokud > 1000, zvážit Strategii B (middleware-only year validation) místo expanze.

**Override request:** Team-lead schvaluje deviation §10.4 (`dynamicParams=false` + SSG expanze) jako runtime-bug-driven hotfix s vyšším pre-build cost ale eliminací broken `notFound()` lifecycle.

---

## 6 — Acceptance criteria

| AC | Criterion | Test/verify command |
|----|-----------|---------------------|
| **AC1** | `/dily/znacka/škoda` vrací HTTP 301 s `Location: /dily/znacka/skoda` | `curl -I http://localhost:3000/dily/znacka/škoda` |
| **AC2** | `/dily/znacka/škoda/octávia` vrací HTTP 301 → `/dily/znacka/skoda/octavia` | `curl -I http://localhost:3000/dily/znacka/škoda/octávia` |
| **AC3** | `/dily/znacka/škoda/octávia/2018` vrací HTTP 301 → `/dily/znacka/skoda/octavia/2018` | `curl -I http://localhost:3000/dily/znacka/škoda/octávia/2018` |
| **AC4** | `/dily/znacka/bmw/rada-3/1995` vrací HTTP 404 | `curl -I http://localhost:3000/dily/znacka/bmw/rada-3/1995` |
| **AC5** | `/dily/znacka/bmw/rada-3/abcd` vrací HTTP 404 | `curl -I http://localhost:3000/dily/znacka/bmw/rada-3/abcd` |
| **AC6** | `/dily/znacka/bmw/rada-3/2018` vrací HTTP 200 (regression check, valid year) | `curl -I http://localhost:3000/dily/znacka/bmw/rada-3/2018` |
| **AC7** | `/dily/znacka/skoda` vrací HTTP 200 (regression check, canonical brand) | `curl -I http://localhost:3000/dily/znacka/skoda` |
| **AC8** | `/dily/znacka/skoda/octavia` vrací HTTP 200 (regression check, canonical brand+model) | `curl -I http://localhost:3000/dily/znacka/skoda/octavia` |
| **AC9** | `/dily/znacka/skoda/octavia/2018` vrací HTTP 200 (regression check, canonical 3-segment) | `curl -I http://localhost:3000/dily/znacka/skoda/octavia/2018` |
| **AC10** | `npm run build` projde úspěšně, build log ukazuje **>200 a <1000** SSG pages pod `/dily/znacka/[brand]/[model]/[rok]` | `npm run build` + grep "Generating static pages" |
| **AC11** | `npm run lint` PASS — 0 errors v `middleware.ts` + 4 page.tsx files | `npm run lint` |
| **AC12** | `npx tsc --noEmit` PASS — 0 type errors | `npx tsc --noEmit` |
| **AC13** | `npx vitest run` PASS — žádné regrese (žádné nové testy nepřidávány) | `npx vitest run` |
| **AC14** | Subdomain rewrite zachován — `shop.localhost:3000/dily/znacka/skoda` musí stále fungovat (200) | `curl -I -H "Host: shop.localhost:3000" http://localhost:3000/dily/znacka/skoda` |
| **AC15** | Diakritika redirect funguje i přes shop subdomain — `shop.localhost:3000/dily/znacka/škoda` → 301 → `/dily/znacka/skoda` | `curl -I -H "Host: shop.localhost:3000" http://localhost:3000/dily/znacka/škoda` |
| **AC16** | Test-chrome #130 retest: 12/12 PASS (10/12 baseline + 2 newly fixed) | Test-chrome agent re-run |

---

## 7 — Estimated effort

**Total:** ~1.5-2.5 h dev work + ~0.5 h verify (incl. test-chrome).

| Krok | Effort | Dependencies |
|------|--------|--------------|
| 1. Read existing files (orientation) | 5 min | — |
| 2. Add `getPartsRouteDiakritikaRedirect` + middleware integration | 15 min | aliasFor existuje (#87a) |
| 3. Modify `[rok]/page.tsx` (generateStaticParams + dynamicParams + dead code removal) | 15 min | getValidYearsForModel existuje (lib/seo-data.ts) |
| 4. Modify `[brand]/page.tsx` (remove aliasFor block) | 5 min | — |
| 5. Modify `[brand]/[model]/page.tsx` (remove aliasFor block) | 5 min | — |
| 6. `npm run build` — verify no errors, count SSG pages | 5 min (build ~3-5 min) | All edits done |
| 7. `npm run lint` + `npx tsc --noEmit` + `npx vitest run` | 3 min | Build clean |
| 8. Manual curl test pro AC1-AC15 | 15 min | dev server running |
| 9. Commit + push | 5 min | All AC pass |
| 10. Test-chrome #130 retest | 10 min (test agent dispatch) | Push deployed |

**Total dev:** ~1.5h. **Total + verify:** ~2.5h.

**Deps:** Žádné nové npm packages, žádné nové soubory, žádný DB schema change. Plně backward-compatible (canonical URLs nadále fungují).

---

## 8 — Risk analysis

| Risk | Pravděpodobnost | Dopad | Mitigation |
|------|-----------------|-------|------------|
| Build fail kvůli SSG count | Nízká | Středně | AC10 ověří 200-1000 range. Pokud > 1000, fallback na Strategii B. |
| `getValidYearsForModel` vrací 0 (model bez generations) | Nízká | Nízká | Stávající code: `if (!model) return []` → 0 years pre-buildnuto pro takový model → 404 pro všechny year requests. **Pre-fix verify:** zkontrolovat všech 24 modelů má aspoň 1 generation v seedu. |
| Middleware regex nesedí na nějakou edge case URL | Nízká | Nízká | Regex `/^\/dily\/znacka\/([^/]+)(?:\/([^/]+)(?:\/([^/]+))?)?\/?$/` testovat s sample URLs (viz AC1-AC9). |
| Subdomain rewrite konflikt s diakritika redirect | Nízká | Středně | Diakritika redirect běží PŘED subdomain rewrite (řešení v middleware structure). AC14, AC15 ověří. |
| Build time příliš dlouhý kvůli 600 pages | Nízká | Nízká | Per-page build je rychlý (data in seed, no DB query). 600 × 50ms = 30s extra build time = OK. |
| Existing curl tests v CI selžou | Nízká | Nízká | Žádné curl tests v CI (jen build). E2E (Playwright) nezahrnuje tyto edge cases. |
| Sitemap generation breaks (sitemap.ts používá BASE seed) | Nízká | Nízká | sitemap.ts používá vlastní generaci, není tied to generateStaticParams. Žádný change. |

---

## 9 — Open questions pro team-leada

### Q1 — Override §10.4 dynamicParams=true → false na rok page?

**Doporučení:** **Schválit override.** Důvod: notFound() v force-static má známý Next.js bug ([#63483](https://github.com/vercel/next.js/issues/63483)). Žádný čistý workaround bez deviation. Strategie A je nejmenší deviation (jen dynamicParams + SSG count).

**Alternativa:** Strategie C (force-dynamic na rok page) — větší deviation Q4, výkonový regress.

**✅ LEAD DECISION 2026-04-07:** **APPROVED.** "Next.js bug #63483 s `notFound()` v `force-static` je vendor issue, ne náš. Strategie A má minimální deviation (jen dynamicParams) a zachovává Q4 force-static. Build time +30s je akceptovatelné, CDN zvládne."

### Q2 — SSG count na rok page může expandovat na ~500-600?

**Doporučení:** **Yes, akceptovatelné.** Build time impact +30s, no memory issue. Pokud `count > 1000`, fallback na Strategii B.

**✅ LEAD DECISION 2026-04-07:** **APPROVED.** "Current baseline 402 → target ~900. Pořád daleko od problematické hranice. Pokud by v budoucnu překročilo 1000, fallback na Strategii B (middleware-only year validation). Akceptovatelný engineering tradeoff."

### Q3 — Diakritika redirect v middleware vs page.tsx?

**Doporučení:** **Middleware** — single source of truth, funguje pro všechny 3 templates, eliminuje page-level lifecycle issue, fail-safe pro budoucí refaktory.

**Alternativa:** Per-page (současný stav) — funguje na model+rok level, NEFUNGUJE na brand level (Bug #1). Zachování per-page approach by vyžadovalo dynamicParams=true na brand → 8 brand SSG → many ISR fallback requests = SEO weak point.

**✅ LEAD DECISION 2026-04-07:** **APPROVED.** "Single source of truth, runs before routing, eliminuje `dynamicParams=false` interaction issue. Přesně ten clean separation co jsem chtěl."

### Q4 — `isValidPartsYear` zachovat v `lib/seo-data.ts` jako dead code?

**Doporučení:** **Zachovat** (1 řádek micro-cleanup, low value). Pokud team-lead chce hard cleanup, lze odstranit + související export.

**❌ LEAD DECISION 2026-04-07: OVERRIDE — SMAZAT.** "Dead code je tech debt. Implementator ať odstraní i helper + jeho test (pokud existuje). Nechci 'dead code for future use' patterns — můžeme to vrátit když bude potřeba." Viz §4 Soubor 5 pro implementator action items.

---

### Lead's additional implementator requirements (2026-04-07)

Team-lead přidává po-implementaci verify checklist nad rámec §6 AC:

1. **Verify všech 3 levely diakritika redirect:**
   - `/dily/znacka/škoda` → 301 → `/dily/znacka/skoda` (brand level)
   - `/dily/znacka/škoda/octávia` → 301 → `/dily/znacka/skoda/octavia` (model level)
   - `/dily/znacka/škoda/octávia/2018` → 301 → `/dily/znacka/skoda/octavia/2018` (rok level)
2. **Verify "skutečný" 404** pro `/dily/znacka/bmw/rada-3/1995` — ne homepage title, ne root layout fallback. Test:
   - HTTP status code = 404
   - Response body obsahuje 404 page content (NE "CarMakléř | Prodej aut...")
3. **Build SSG count check:** Po `npm run build` spočítat SSG pages v manifest pro `[rok]` route. Target ~900, akceptovatelný range 800-1100.
4. **STOP & ESCALATE:** Pokud build SSG count je mimo range 800-1100, **zastavit IMPL a reportovat leadovi** — může to být chyba v `getValidYearsForModel`.

---

## 10 — Test-chrome retest checklist (after IMPL)

Po dokončení IMPL + deploy, dispatchnout test-chrome #131-retest s pokyny:

**Required test cases (16):**
1. **Diakritika redirect (AC1-AC3):** Browse `/dily/znacka/škoda`, `/škoda/octávia`, `/škoda/octávia/2018` — verify 301 + canonical landing.
2. **Year 404 (AC4-AC5):** Browse `/dily/znacka/bmw/rada-3/1995`, `/bmw/rada-3/abcd` — verify 404 status + 404 page render.
3. **Regression (AC6-AC9):** Browse `/dily/znacka/bmw/rada-3/2018`, `/skoda`, `/skoda/octavia`, `/skoda/octavia/2018` — verify 200 + correct content.
4. **Subdomain (AC14-AC15):** Same checks via shop subdomain Host header.
5. **JSON-LD scripts:** Verify BreadcrumbList + ItemList + FAQPage + Organization scripts present in valid pages (regression).
6. **Build output:** Verify Next.js build log shows expected SSG count for `[rok]` page (200-1000).

**Output format:** test-chrome-task-131-retest.md s 12/12 PASS table + screenshots of fixed pages + curl outputs.

---

## 11 — Souhrn (TL;DR pro team-leada)

**Co plán řeší:**
- Bug #1 — diakritika redirect 404 → 301 (přesun do middleware.ts, pokrývá všechny 3 levely)
- Bug #2 — year validation 200 → 404 (expand generateStaticParams + dynamicParams=false na rok page)

**Co plán mění v plán-124:**
- §10.4: dynamicParams na rok page `true → false` (override schválit)
- §10.4: SSG count na rok page `72 → ~500-600`
- §6 diakritika redirect location: page.tsx → middleware.ts (clean separation)

**Co plán NEMĚNÍ:**
- `force-static` (Q4) — zachován pro všech 3 templates ✅
- Brand page dynamicParams=false ✅
- Model page dynamicParams=true ✅
- generateMetadata canonical URL pattern ✅
- JSON-LD scripts ✅
- Hero/SEO content templates ✅
- Sitemap generation ✅

**Effort:** 1.5-2.5h dev. Žádné nové deps, žádný DB change.

**Risk:** Nízký — všechny změny backward-compatible, žádný impact na canonical URLs, regression coverage v AC6-AC9.

**Návaznost:** Plán je samostatný hotfix. Po IMPL → test-chrome retest #131 → 12/12 PASS → unblock deploy. Žádné nové dependencies pro #87c (Prisma SeoContent), #87d (revalidation API), #87e (geo-benchmark docs).

**Rozhodovací bod pro team-leada:** Schválit Strategii A (recommended) nebo Strategii B (middleware-only year validation, žádná deviation §10.4 ale složitější middleware logika).
