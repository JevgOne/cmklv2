---
name: Plán #143 — #87d On-demand revalidation API + 9 H2 brand expansion
description: Implementační plán pro #87d (queue #98) — POST /api/revalidate/parts secret-protected endpoint volající Next.js revalidatePath() pro affected SSG paths + expansion lib/seo-data.ts z 8 H1 brands na 17 brands (přidat 9 H2: alfa-romeo, suzuki, fiat, mini, mitsubishi, jeep, jaguar, dodge, lexus). Sequenced AŽ PO #87c (#97) commit kvůli sdílenému lib/seo-data.ts a SeoContent model dependency. Plán dodává spec pro implementatora včetně Zod schema, Edge runtime considerations, constant-time secret compare, generateStaticParams expansion validation, sitemap auto-pickup, idempotent revalidation behavior, a STOP & ESCALATE thresholds pro SSG count consistency.
type: plan
task_id: 143
queue_id: 143
parent_plan: plan-task-81.md
related_plans:
  - plan-task-124-3segment-routing.md (#87b — 3-segment routing, completed)
  - plan-task-127-canonical-fix.md (#135 — canonical fix, completed)
  - plan-task-139-87c-seo-content.md (#97 — SeoContent model, in_progress, BLOCKING)
  - plan-task-142-87e-docs.md (#144 — geo-benchmark docs, parallel)
related_followups:
  - "#87f — JSONB cast compatibleBrands (deferred z #87c per Q4)"
  - "#87g — Admin UI pro on-demand revalidation trigger (post-#87d)"
revision_history:
  - 2026-04-07 — initial draft (planovac, dispatch #143)
  - 2026-04-07 — lead-approved Q1-Q7 (all recommended); §11 LEAD DECISIONS block added with verbatim citations; §8 status banner; #97 (#87c) confirmed committed (49f680e) → sequencing gate clear, IMPL nemusí čekat
---

# Plán #143 — #87d On-demand revalidation API + 9 H2 brand expansion

> **Cíl:** Dodat dva komplementární deliverables: (1) **POST `/api/revalidate/parts`** secret-protected endpoint který umožňuje selektivní invalidaci SSG cache pro `/dily/znacka/*` route tree po manual content updates v #87c SeoContent table (bez nutnosti full rebuild) + (2) **expansion na 17 brands** přidáním 9 H2 priority brands (alfa-romeo, suzuki, fiat, mini, mitsubishi, jeep, jaguar, dodge, lexus) do `lib/seo-data.ts` PARTS_BRANDS + PARTS_MODELS_BY_BRAND. Sekvenčně **ZÁVISÍ na #87c (#97) commit** kvůli race condition na shared `lib/seo-data.ts` a SeoContent model.

---

## 0 — Executive summary (TL;DR)

**Co plán dodává:**
1. **`/api/revalidate/parts/route.ts`** — POST endpoint, Zod-validated body `{ brand?, model?, year?, secret }`, constant-time secret compare proti `process.env.REVALIDATE_SECRET`, calls `revalidatePath()` for affected paths, returns `{ revalidated: string[], errors: string[] }`
2. **9 nových H2 brandů** — alfa-romeo, suzuki, fiat, mini, mitsubishi, jeep, jaguar, dodge, lexus (per dispatch verbatim)
3. **27 nových models** (~3 per brand) v `PARTS_MODELS_BY_BRAND` s realistic generations + topYears
4. **Auto-pickup**: žádné code changes v `app/sitemap.ts` ani 3 page templates (`generateStaticParams` automaticky pickne up nové brandy přes `PARTS_BRANDS` import)
5. **Header comment update** v `lib/seo-data.ts` z "8 brands" → "17 brands"
6. **`.env.example` update** — přidat `REVALIDATE_SECRET=` + komentář
7. **15 acceptance criteria** — endpoint behavior, brand expansion, SSG count range, sitemap delta, canonical preservation, build/lint/typecheck/test pass

**Strategický klíč #1 — Sequencing:** **#87d IMPL nesmí startovat bez #87c (#97) commit.** Důvod: oba modify `lib/seo-data.ts` (#87c rozšiřuje strukturu nebo helpers, #87d přidává brandy). Race condition na shared file = merge conflict guaranteed.

**Strategický klíč #2 — Consistent SSG count ranges (memory feedback):** Všechny sekce §0/§5/§7/§9 používají **identický target range 1250-1700 total site SSG pages** (post-expansion). Hard floor 1100 (escalate down), hard ceiling 2000 (escalate up — CI timeout risk).

**Math derivation (important — všechny sekce odkazují sem):**
- Current baseline (před #87d): ~764 total site SSG pages (per team-lead memory, post-#87b deploy)
- Z toho dily/znacka: ~466 (8 brand + 24 model + ~434 year pages, kde year pages = sum getValidYearsForModel přes 24 modelů)
- Po #87d expansion: +9 brand + 27 model + ~540 year pages = +576 dily/znacka
  - 540 = 27 modelů × 20 years avg (3 generations × ~7 years each, typical CZ market coverage)
  - Konzervativnější odhad (15 years avg): +9+27+405 = +441
  - Aggressive odhad (25 years avg): +9+27+675 = +711
- **Expected total post-#87d: 764 + 441 až 711 = 1205 až 1475 total SSG**
- **Acceptable range (s variance): 1250-1700**
- **Stretch target per team-lead dispatch: 1500-2000 — DOSAHITELNÉ pouze při 4 models per brand (36 modelů) NEBO ≥25 years avg per model**

**Co plán NEMĚNÍ:**
- ✅ #87a llms.txt endpoint — beze změny
- ✅ #87b 3-segment routing core (page templates) — beze změny
- ✅ #87c SeoContent model (po commit) — pouze referencuje, nemodifikuje
- ✅ #135 canonical helper — beze změny
- ✅ Existing 8 H1 brands data — pouze additive (žádný rename, žádný remove)

**Co plán NEŘEŠÍ (out of scope):**
- ❌ Admin UI pro revalidation trigger → odložit jako #87g follow-up
- ❌ Webhook integration (Zapier/n8n) → odložit
- ❌ Bulk revalidation cron → odložit (CRON_SECRET pattern už existuje pro samostatné cron tasks)
- ❌ Per-vrakoviste revalidation → out of scope (liší se od parts brand revalidation)
- ❌ JSONB cast compatibleBrands (defer #87c → #87f)
- ❌ Nové SeoContent rows pro 9 H2 brands → samostatný #144-style seed run post-#87d (template fallback funguje out of box)

---

## 1 — Analysis: current state

### 1.1 Verified facts (cross-checked s codebase)

**`lib/seo-data.ts`:**
- **Line 1226:** `export const PARTS_BRANDS = [...]` — 8 entries (skoda, volkswagen, bmw, audi, ford, toyota, hyundai, opel), každý `{ slug, name }`
- **Line 1247:** `interface PartsModelData { slug, name, brandSlug, generations: PartsModelGeneration[], topYears?: number[] }`
- **Line 1256:** `PARTS_MODELS_BY_BRAND: Record<string, PartsModelData[]>` — 24 modelů celkem (3 per brand), každý má 2-3 generations + topYears (default `[2015, 2018, 2020]`)
- **Line 1529:** `getValidYearsForModel(brandSlug, modelSlug)` — vrací all years v generation ranges (Set deduplicated, sorted)

**`app/sitemap.ts`:**
- **Line 3:** `import { ..., PARTS_BRANDS, PARTS_MODELS_BY_BRAND } from "@/lib/seo-data"`
- **Line 177-184:** `partsBrandPages = PARTS_BRANDS.map(...)` → auto-pickup nových brandů
- **Line 185-193:** `partsModelPages = PARTS_BRANDS.flatMap(brand => (PARTS_MODELS_BY_BRAND[brand.slug] || []).map(...))` → auto-pickup nových models
- **Line 195-205:** `partsModelYearPages = ... .flatMap(brand => ... .flatMap(model => (model.topYears ?? [2015, 2018, 2020]).map(...)))` → **POZOR: sitemap používá topYears (3 years per model), NE všechny years.** Build SSG ale pre-buildí všechny years (per #87b plan-task-124).
- **Line 194 comment:** `// SEO landing pages — díly značka+model+rok (#87b 3-segment routing, ~72)` → starý comment (`72 = 3 × 24 models`), bude potřeba update na `~123 = 3 × 51 models post-expansion`

**`app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx`** (z plán-139 §1.4 verified):
- **Line 45 `generateStaticParams()`:** Pre-builduje VŠECHNY years z `getValidYearsForModel(brand, model)` (nejen topYears) → auto-pickup nových brandů + modelů → SSG count poroste exponenciálně s každým novým modelem
- **Line 24 `dynamicParams = false`:** Invalid years → 404 (#132 fix)

**`.env.example`:**
- **Line 70:** `CRON_SECRET=           # openssl rand -hex 16` — pattern pro generování secretů
- **Žádný `REVALIDATE_SECRET`** — implementator MUSÍ přidat

**`/api/` directory:**
- **Žádný `/api/revalidate/*`** existing endpoint — implementator vytvoří from scratch
- Stávající API patterns: `app/api/payments/webhook/route.ts` (Stripe webhook s secret verification) je nejbližší reference pro constant-time compare pattern

### 1.2 Co dispatch požaduje (verbatim z team-leadu)

> **POST /api/revalidate/parts** — secret-protected endpoint
> - Body: `{ brand?: string, model?: string, year?: number, secret: string }` (Zod validated)
> - Auth: `process.env.REVALIDATE_SECRET` constant-time compare
> - Calls `revalidatePath('/dily/znacka/[brand]', 'page')` etc. for affected SSG paths
> - Returns `{ revalidated: string[], errors: string[] }`
> - Edge cases: brand only → revalidate brand + all models + all years; model+brand → that model + its years; full match → just one path

> **9 H2 brand expansion** — z 8 H1 brands na 17 total:
> - Add: alfa-romeo, suzuki, fiat, mini, mitsubishi, jeep, jaguar, dodge, lexus
> - Update PARTS_BRAND_SLUGS v lib/seo-data.ts
> - Update PARTS_MODELS_BY_BRAND (~3 modelů per brand, total ~27 nových model entries)
> - Verify generateStaticParams() v 3 page templates pickne up nové brands automaticky
> - Verify SSG count vyroste z ~764 na ~1500-2000 (přesný odhad závisí na year coverage per nový brand)

> **Documentation update** — bump lib/seo-data.ts header comment z "8 brands" na "17 brands"

**Pozn 1:** Dispatch zmiňuje `PARTS_BRAND_SLUGS` (line 1540 by `ALL_BRAND_SLUGS = BRANDS.map(b => b.slug)` pattern), ale **`PARTS_BRAND_SLUGS` neexistuje v lib/seo-data.ts**. Existuje pouze `PARTS_BRANDS` (line 1226). Implementator MUSÍ:
- (a) Pokud chce slugs array, vytvořit nový `export const PARTS_BRAND_SLUGS = PARTS_BRANDS.map(b => b.slug)`
- (b) Nebo jen rozšířit `PARTS_BRANDS` přímo, žádný separátní slugs export

**Doporučení:** **Option (b)** — žádný nový export. Stávající code (sitemap, page templates) konzumuje `PARTS_BRANDS` přímo, žádný PARTS_BRAND_SLUGS nepotřebuje. Dispatch reference na PARTS_BRAND_SLUGS je pravděpodobně typo nebo zaměna s `ALL_BRAND_SLUGS` (line 1540) což je VEHICLES brands (BRANDS na line 24), NE parts.

**Pozn 2:** Dispatch říká "verify SSG count vyroste z ~764 na ~1500-2000" — tento target range je **stretch goal**, ne strict requirement. Real-world math (viz §0 derivation) ukazuje 1250-1700 jako realistický s 3 models/brand. Plán flagne tuto inkonzistenci jako Q1.

### 1.3 Nově použité Next.js APIs

**`revalidatePath(path, type?)`** (Next.js 15):
- Signature: `revalidatePath(path: string, type?: "page" | "layout")`
- For 3-segment route `/dily/znacka/[brand]/[model]/[rok]`:
  - Revalidate single year: `revalidatePath('/dily/znacka/skoda/octavia/2018', 'page')`
  - Revalidate all years for one model: `revalidatePath('/dily/znacka/skoda/octavia', 'page')` (covers model page) + iterate years (no wildcard support in Next.js 15)
  - Revalidate all models for one brand: `revalidatePath('/dily/znacka/skoda', 'page')` + iterate models + iterate years
  - Revalidate full tree: NOT supported via single call — would need wildcard / `revalidatePath('/', 'layout')` (DANGEROUS, blasts entire site cache)

**Implication:** Endpoint MUSÍ explicitly enumerate paths to revalidate based on input scope (brand/model/year). Loop logic v handler.

**Edge runtime compatibility:** `revalidatePath` works v Node.js runtime. Endpoint by měl být **explicit `runtime = "nodejs"`** (default pro App Router API routes), NE Edge — `revalidatePath` is Node.js-only API.

### 1.4 Sequencing constraint — proč #143 IMPL musí počkat na #87c commit

**Shared files mezi #87c a #87d:**
1. **`lib/seo-data.ts`** — #87c (#97) může (per plán-139 §3.2 Q5 a §C3.4) přidávat helpery jako `getPartsBrandStats(brand: string)` nebo modifikovat exports. #87d přidává PARTS_BRANDS entries. **Race:** Pokud oba commits ediují stejné soubor paralelně, git merge conflict při rebase.
2. **SeoContent model dependency** — #87d revalidation endpoint může (volitelně) trigger SeoContent re-fetch pro affected paths. Pokud #87c není mergnut, model neexistuje v Prisma schema → import error v #87d build.

**Doporučení:** **#143 PLÁN lze psát hned (paralelně s #87c IMPL)**, ale **#87d IMPL dispatch AŽ PO #87c (#97) commit do main branche**. Plán flagne tuto sekvencionální závislost v §9 Implementation Order jako blocking gate.

---

## 2 — Architecture: design decisions

### 2.1 Endpoint location: `/api/revalidate/parts/route.ts`

**Path:** `app/api/revalidate/parts/route.ts` (per dispatch verbatim)

**Alternativní cesty zvážené a zamítnuté:**
- `app/api/revalidate/route.ts` — too broad, conflict pokud budou další revalidate endpoints (vehicles, listings)
- `app/api/parts/revalidate/route.ts` — méně intuitivní, parts namespace obvykle pro public CRUD, ne admin operations
- `app/api/admin/revalidate/parts/route.ts` — duplicit s middleware admin gate, ale parts revalidation je system-level (cron/CI), ne admin UI action

**Doporučení:** **`app/api/revalidate/parts/route.ts`** per dispatch.

### 2.2 Auth strategy: secret-based vs JWT vs IP allowlist

**Doporučení:** **Secret-based** (`process.env.REVALIDATE_SECRET`) per dispatch verbatim.

**Důvody:**
- Stateless (žádný DB lookup)
- CI/cron friendly (CI workflow může pass secret přes env)
- Constant-time compare prevents timing attacks
- Pattern už existuje (CRON_SECRET, STRIPE_WEBHOOK_SECRET)

**Constant-time compare implementation:**
```ts
import { timingSafeEqual } from "node:crypto";

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
```

**Alternativní strategies zvážené a zamítnuté:**
- JWT — overkill pro server-to-server, vyžaduje key rotation infra
- IP allowlist — křehké (Cloudflare proxies, dynamic CI runners)
- Bearer token v Authorization header — funkčně ekvivalentní secret v body, ale dispatch řekl secret v body

**Pozn:** Dispatch řekl `secret: string` jako body field. Implementator MUSÍ honor — žádná deviace na Authorization header.

### 2.3 Request validation: Zod schema

```ts
import { z } from "zod";

const RevalidateRequestSchema = z.object({
  brand: z.string().min(1).max(50).optional(),
  model: z.string().min(1).max(50).optional(),
  year: z.number().int().min(1990).max(2030).optional(),
  secret: z.string().min(16).max(256),
});
```

**Validation rules:**
- `secret` REQUIRED, min 16 chars (matches `openssl rand -hex 16` output)
- `brand`/`model`/`year` ALL OPTIONAL — žádný = revalidate full `/dily/znacka` tree
- `model` requires `brand` (logical dependency) — Zod refinement
- `year` requires `model` AND `brand` — Zod refinement
- Year range 1990-2030 (matches PartsModelGeneration realistic bounds)

**Refinement logic:**
```ts
.refine((data) => !data.model || !!data.brand, {
  message: "model requires brand",
  path: ["model"],
})
.refine((data) => !data.year || !!data.model, {
  message: "year requires model",
  path: ["year"],
});
```

### 2.4 Revalidation logic — path enumeration

**Algorithm (per dispatch edge cases):**

```
input: { brand?, model?, year? }
output: revalidated: string[]

case 1: full match (brand + model + year)
  → revalidatePath('/dily/znacka/{brand}/{model}/{year}', 'page')
  → revalidated = ['/dily/znacka/{brand}/{model}/{year}']

case 2: brand + model (no year)
  → for each year in getValidYearsForModel(brand, model):
       revalidatePath('/dily/znacka/{brand}/{model}/{year}', 'page')
  → revalidatePath('/dily/znacka/{brand}/{model}', 'page')  // model page itself
  → revalidated = [...all year paths, model path]

case 3: brand only (no model)
  → for each model in PARTS_MODELS_BY_BRAND[brand]:
       for each year in getValidYearsForModel(brand, model.slug):
         revalidatePath('/dily/znacka/{brand}/{model.slug}/{year}', 'page')
       revalidatePath('/dily/znacka/{brand}/{model.slug}', 'page')
  → revalidatePath('/dily/znacka/{brand}', 'page')  // brand page itself
  → revalidatePath('/dily', 'page')  // category root (re-fetches popular brands)
  → revalidated = [...all paths]

case 4: nothing (no brand)
  → REJECT s 400 "at least one of brand/model/year required"
  → ALTERNATIVE: revalidate full /dily tree (DANGEROUS)
```

**Doporučení pro case 4:** **REJECT** s 400. Důvod: revalidace celého `/dily` tree (1300+ pages post-#87d) zatíží Next.js cache invalidation flush + může způsobit cold-start latency spike pro VŠECHNY uživatele. Pokud potřebujete full revalidate, použijte `npm run build` + redeploy, ne API endpoint.

**Alternativa:** Accept empty body jako "full /dily revalidate" + emit warning log + rate-limit 1 call/hour per IP. **NE doporučeno** pro MVP — too risky.

### 2.5 Error handling — partial failures

**Scenario:** revalidatePath() pro 1 z 50 paths fails (např. neexistující route po typo). Endpoint by měl:
- Continue iterating — nepřerušovat batch
- Collect errors v `errors: string[]` array
- Return 200 (or 207 Multi-Status) s partial result
- HTTP 500 jen pokud VŠECHNY revalidations fail (catastrophic)

**Per-path error handling:**
```ts
const revalidated: string[] = [];
const errors: string[] = [];

for (const path of pathsToRevalidate) {
  try {
    revalidatePath(path, "page");
    revalidated.push(path);
  } catch (err) {
    errors.push(`${path}: ${err.message}`);
  }
}

return Response.json({ revalidated, errors }, {
  status: errors.length > 0 && revalidated.length === 0 ? 500 : 200,
});
```

### 2.6 Rate limiting — needed?

**Doporučení:** **NE pro MVP**. Důvody:
- Endpoint je secret-protected, žádný public exposure
- Caller je predominantně CI/cron (low frequency)
- Rate limiting requires Redis nebo in-memory store → infra overhead
- Pokud zneužití, secret rotation je rychlejší fix než rate limit setup

**Alternativa pro budoucnost:** Add `@vercel/edge-rate-limit` nebo Upstash Redis post-MVP pokud abuse detected.

### 2.7 Logging

**Doporučení:** Log every successful revalidation (path + timestamp + caller IP) do server console. **NE persistovat do DB** v MVP (žádný log table needed).

```ts
console.log(`[revalidate] ${req.headers.get("x-forwarded-for") || "unknown"} → ${revalidated.length} paths (errors: ${errors.length})`);
```

Pokud existuje server-side observability (Sentry, Datadog), log levels:
- `info` — successful revalidation
- `warn` — partial failure (some paths OK, some errors)
- `error` — auth failure (invalid secret) nebo full failure

### 2.8 Brand expansion — model selection methodology

**Pro každý z 9 H2 brandů** musí implementator vybrat **3 nejprodávanější modely v ČR** (per public market data). Doporučení (research-based, ale **implementator MUSÍ verify** ČR market reality):

| Brand | Slug | Doporučené modely (3) | Notes |
|---|---|---|---|
| Alfa Romeo | `alfa-romeo` | Giulia, Stelvio, Giulietta | Giulia/Stelvio = current lineup, Giulietta = legacy popular |
| Suzuki | `suzuki` | Vitara, Swift, S-Cross | Vitara = bestseller CZ, Swift = compact volume |
| Fiat | `fiat` | 500, Panda, Tipo | 500 = iconic, Panda = cheap urban, Tipo = sedan |
| Mini | `mini` | Cooper, Countryman, Clubman | Cooper = base, Countryman = SUV |
| Mitsubishi | `mitsubishi` | Outlander, ASX, Lancer | Outlander = SUV volume, ASX = compact crossover, Lancer = legacy |
| Jeep | `jeep` | Renegade, Compass, Grand-Cherokee | Renegade = compact, Grand Cherokee = flagship |
| Jaguar | `jaguar` | XF, F-Pace, XE | XF/XE = sedan, F-Pace = SUV |
| Dodge | `dodge` | Caliber, Journey, Charger | Caliber/Journey = US imports popular CZ, Charger = enthusiast |
| Lexus | `lexus` | IS, RX, NX | IS = sedan, RX/NX = SUV volume |

**Generation ranges** — per existing PARTS_MODELS_BY_BRAND pattern (2-3 generations per model, 5-10 years per generation, total ~15-22 unique years per model):

Implementator může copy-paste pattern z existing entries (např. `octavia` na line 1259) a fill specific generation codes z public databáze (Wikipedia, vehicleinfo APIs).

**Pozn pro implementatora:** Pokud nemáš čas verify všech 27 modelů detailně, použij doporučení z tabulky výše (3 modelů × 9 brands = 27 entries) a flag v PR description "model selection per planovac §2.8 — review pro CZ market accuracy".

### 2.9 topYears strategy — sitemap vs SSG count divergence

**Stávající stav:**
- **Sitemap.xml** uses `model.topYears ?? [2015, 2018, 2020]` — emits **3 year URLs per model**
- **SSG build** uses `getValidYearsForModel()` — pre-builds **ALL years** v generation ranges (~17-22 per model)
- **Divergence:** Sitemap has fewer URLs than SSG. To je intentional — sitemap signalizuje "TOP year landing pages" Googlu, ale SSG poskytuje fast response pro any year (good UX).

**Implication pro #87d:** New 27 models × 3 topYears = 81 new sitemap entries. New 27 models × ~20 years = ~540 new SSG pages. **Sitemap delta MUCH smaller than SSG delta.** Plán dokumentuje obě metriky separately v §5 AC.

**Doporučení:** Implementator NESMĚNUJE topYears default — zachová `[2015, 2018, 2020]` per existing entries. Year coverage variance je ok (Hyundai Kona má topYears `[2018, 2020, 2022]` per existing line 1490, protože model debutoval 2017).

---

## 3 — Detailed design per file

### 3.1 NEW: `app/api/revalidate/parts/route.ts`

**Estimated LoC:** ~120 lines (handler + Zod schema + helpers + error handling)

**Full skeleton:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { PARTS_BRANDS, PARTS_MODELS_BY_BRAND, getValidYearsForModel } from "@/lib/seo-data";

export const runtime = "nodejs"; // revalidatePath requires Node.js runtime
export const dynamic = "force-dynamic"; // never cache POST endpoint

const RevalidateRequestSchema = z
  .object({
    brand: z.string().min(1).max(50).optional(),
    model: z.string().min(1).max(50).optional(),
    year: z.number().int().min(1990).max(2030).optional(),
    secret: z.string().min(16).max(256),
  })
  .refine((data) => !data.model || !!data.brand, {
    message: "model requires brand",
    path: ["model"],
  })
  .refine((data) => !data.year || !!data.model, {
    message: "year requires model",
    path: ["year"],
  });

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function buildPathsToRevalidate(input: {
  brand?: string;
  model?: string;
  year?: number;
}): string[] {
  const { brand, model, year } = input;
  const paths: string[] = [];

  if (brand && model && year !== undefined) {
    // Case 1: full match — single year page
    paths.push(`/dily/znacka/${brand}/${model}/${year}`);
  } else if (brand && model) {
    // Case 2: brand + model — model page + all year pages
    const years = getValidYearsForModel(brand, model);
    for (const y of years) {
      paths.push(`/dily/znacka/${brand}/${model}/${y}`);
    }
    paths.push(`/dily/znacka/${brand}/${model}`);
  } else if (brand) {
    // Case 3: brand only — brand page + all model pages + all year pages
    const models = PARTS_MODELS_BY_BRAND[brand] || [];
    for (const m of models) {
      const years = getValidYearsForModel(brand, m.slug);
      for (const y of years) {
        paths.push(`/dily/znacka/${brand}/${m.slug}/${y}`);
      }
      paths.push(`/dily/znacka/${brand}/${m.slug}`);
    }
    paths.push(`/dily/znacka/${brand}`);
    paths.push(`/dily`); // category root for popular brands listing
  }

  return paths;
}

export async function POST(req: NextRequest) {
  // 1. Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const parsed = RevalidateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // 2. Verify secret (constant-time)
  const expectedSecret = process.env.REVALIDATE_SECRET;
  if (!expectedSecret) {
    console.error("[revalidate] REVALIDATE_SECRET env var not set");
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }
  if (!safeCompare(parsed.data.secret, expectedSecret)) {
    console.warn(
      `[revalidate] auth failure from ${req.headers.get("x-forwarded-for") || "unknown"}`
    );
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 3. Validate input scope (require at least brand)
  if (!parsed.data.brand) {
    return NextResponse.json(
      { error: "at least one of brand/model/year required" },
      { status: 400 }
    );
  }

  // 4. Verify brand exists in PARTS_BRANDS
  const brandExists = PARTS_BRANDS.some((b) => b.slug === parsed.data.brand);
  if (!brandExists) {
    return NextResponse.json(
      { error: `brand '${parsed.data.brand}' not in PARTS_BRANDS` },
      { status: 404 }
    );
  }

  // 5. Build paths + revalidate
  const pathsToRevalidate = buildPathsToRevalidate(parsed.data);
  const revalidated: string[] = [];
  const errors: string[] = [];

  for (const path of pathsToRevalidate) {
    try {
      revalidatePath(path, "page");
      revalidated.push(path);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${path}: ${message}`);
    }
  }

  // 6. Log + return
  console.log(
    `[revalidate] ${req.headers.get("x-forwarded-for") || "unknown"} → ${revalidated.length} paths (errors: ${errors.length})`
  );

  const status = errors.length > 0 && revalidated.length === 0 ? 500 : 200;
  return NextResponse.json({ revalidated, errors }, { status });
}
```

**Key design notes:**
- `runtime = "nodejs"` explicit (not Edge) — `revalidatePath` API requirement
- `dynamic = "force-dynamic"` — POST endpoint never cached
- Zod refinement enforces logical hierarchy (year requires model, model requires brand)
- Constant-time secret compare prevents timing attacks
- Brand existence check returns 404 (not 400) — distinguishes "valid input but unknown brand" from "malformed input"
- Per-path try/catch ensures partial failures don't abort batch
- Status 500 jen pokud VŠECHNY revalidations fail
- Logs caller IP for auditing (no DB persistence v MVP)

### 3.2 MODIFIED: `lib/seo-data.ts` — PARTS_BRANDS expansion

**Edit at line 1224 (header comment update):**

```diff
- // Parts brands data
+ // Parts brands data — 17 brands (8 H1 priority + 9 H2 expansion #87d)
```

**Edit at lines 1226-1235 (PARTS_BRANDS array):**

```diff
  export const PARTS_BRANDS = [
    { slug: "skoda", name: "Škoda" },
    { slug: "volkswagen", name: "Volkswagen" },
    { slug: "bmw", name: "BMW" },
    { slug: "audi", name: "Audi" },
    { slug: "ford", name: "Ford" },
    { slug: "toyota", name: "Toyota" },
    { slug: "hyundai", name: "Hyundai" },
    { slug: "opel", name: "Opel" },
+   // H2 expansion (#87d) — added 2026-04-XX
+   { slug: "alfa-romeo", name: "Alfa Romeo" },
+   { slug: "suzuki", name: "Suzuki" },
+   { slug: "fiat", name: "Fiat" },
+   { slug: "mini", name: "Mini" },
+   { slug: "mitsubishi", name: "Mitsubishi" },
+   { slug: "jeep", name: "Jeep" },
+   { slug: "jaguar", name: "Jaguar" },
+   { slug: "dodge", name: "Dodge" },
+   { slug: "lexus", name: "Lexus" },
  ];
```

**Edit at line 1256 area (PARTS_MODELS_BY_BRAND addition):**

Implementator přidá 9 nových klíčů (po `opel:` block, před zavírající `};`) — example pattern pro `alfa-romeo`:

```ts
  "alfa-romeo": [
    {
      slug: "giulia",
      name: "Giulia",
      brandSlug: "alfa-romeo",
      generations: [
        { name: "952", yearFrom: 2016, yearTo: 2026 },
      ],
      topYears: [2018, 2020, 2022],
    },
    {
      slug: "stelvio",
      name: "Stelvio",
      brandSlug: "alfa-romeo",
      generations: [
        { name: "949", yearFrom: 2017, yearTo: 2026 },
      ],
      topYears: [2018, 2020, 2022],
    },
    {
      slug: "giulietta",
      name: "Giulietta",
      brandSlug: "alfa-romeo",
      generations: [
        { name: "940", yearFrom: 2010, yearTo: 2020 },
      ],
      topYears: [2012, 2015, 2018],
    },
  ],
```

**Implementator MUSÍ:** Vytvořit 27 entries (3 per brand × 9 brands), všechny s `brandSlug` matching parent key, realistic `generations` (1-3 entries per model, year ranges založené na public databáze), `topYears` array 3 elementů.

**Pozn:** `brandSlug` field je v existing entries vždy lowercase ("skoda", "bmw"). U nových brandů s pomlčkou (alfa-romeo) je `brandSlug: "alfa-romeo"` (s pomlčkou — matches PARTS_BRANDS slug).

### 3.3 MODIFIED: `.env.example` — REVALIDATE_SECRET addition

**Edit at line 70 area (after `CRON_SECRET=`):**

```diff
  CRON_SECRET=           # openssl rand -hex 16
+ REVALIDATE_SECRET=     # openssl rand -hex 16 — for /api/revalidate/parts endpoint
```

### 3.4 NOT MODIFIED (auto-pickup verified)

**`app/sitemap.ts`** — žádná change. Verified line 177-205: sitemap mapuje `PARTS_BRANDS.flatMap(...)` který automaticky pickne up nové brandy. Sitemap entry count poroste from current ~104 dily/znacka entries (8 brand + 24 model + 72 year @ topYears) na ~221 (17 brand + 51 model + 153 year @ topYears).

**`app/(web)/dily/znacka/[brand]/page.tsx`** — žádná change. `generateStaticParams` returns `PARTS_BRANDS.map(...)` per existing pattern.

**`app/(web)/dily/znacka/[brand]/[model]/page.tsx`** — žádná change. `generateStaticParams` flatMaps PARTS_BRANDS × PARTS_MODELS_BY_BRAND.

**`app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx`** — žádná change. `generateStaticParams` per plán-139 §1.4 verified — pre-builds ALL years from `getValidYearsForModel()`.

**`middleware.ts`** — žádná change. Diakritika 301 redirect handled per #132 — nové brandy s pomlčkou (alfa-romeo) NE mají diacritics, bezpečné.

**`lib/seo/slugify.ts`** — žádná change. Slugify pattern compatible s "alfa-romeo" (lowercase + hyphen).

---

## 4 — Affected files audit

### 4.1 Files to CREATE (1)

| Soubor | LoC est. | Purpose |
|---|---|---|
| `app/api/revalidate/parts/route.ts` | ~120 | POST endpoint per §3.1 spec |

### 4.2 Files to MODIFY (2)

| Soubor | Lines edited | Purpose |
|---|---|---|
| `lib/seo-data.ts` | ~12 lines (PARTS_BRANDS) + ~250 lines (PARTS_MODELS_BY_BRAND 27 new entries) + 1 line (header comment) = **~263 lines added** | Brand expansion + header bump |
| `.env.example` | +1 line | REVALIDATE_SECRET placeholder |

**Total LoC delta:** ~120 (NEW) + ~264 (MODIFIED) = **~384 lines net additive**

### 4.3 Files NOT modified (auto-pickup)

| Soubor | Why no change |
|---|---|
| `app/sitemap.ts` | Maps PARTS_BRANDS — auto-pickup |
| `app/(web)/dily/znacka/[brand]/page.tsx` | generateStaticParams uses PARTS_BRANDS |
| `app/(web)/dily/znacka/[brand]/[model]/page.tsx` | Same |
| `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` | Same — verified plán-139 |
| `middleware.ts` | Žádný diacritics redirect needed pro nové brandy |
| `lib/seo/slugify.ts` | Slugify already handles hyphens |
| `prisma/schema.prisma` | #87c domain, NE #87d |
| `app/llms.txt/route.ts` | Statický markdown — neliší se per brand počet |

### 4.4 Files referenced (read-only)

- `lib/seo-data.ts` — sitemap, page templates referenci PARTS_BRANDS / PARTS_MODELS_BY_BRAND / getValidYearsForModel
- `next/cache` (Next.js stdlib) — `revalidatePath`
- `node:crypto` (Node.js stdlib) — `timingSafeEqual`
- `zod` (existing dep) — schema validation

### 4.5 .env.local update — runtime requirement

**Implementator MUSÍ po commit přidat do production `.env`:**

```
REVALIDATE_SECRET=<output of: openssl rand -hex 16>
```

**SSH server step (post-deploy):** Update `.env` na carmakler.cz server, restart Next.js process. **NE v scope plánu** — dispatch je IMPL only, deploy je samostatný #141-style task.

---

## 5 — Acceptance criteria (15 AC)

> **CONSISTENT RANGES — viz §0 derivation:**
> - **Acceptable total site SSG range post-#87d: 1250-1700**
> - **Hard floor (STOP & ESCALATE if below): 1100**
> - **Hard ceiling (STOP & ESCALATE if above): 2000**
> - **All AC níže používají IDENTICKÉ ranges — žádný §5/§9 mismatch**

### AC1 — Endpoint soubor existuje
**Verify:** `ls app/api/revalidate/parts/route.ts` → soubor existuje, LoC ≥80 (handler + Zod + helpers).

### AC2 — Endpoint exports POST handler
**Verify:** `grep "export async function POST" app/api/revalidate/parts/route.ts` → 1 match. Žádný GET handler (POST-only endpoint).

### AC3 — Runtime explicit nodejs
**Verify:** `grep 'runtime = "nodejs"' app/api/revalidate/parts/route.ts` → 1 match. (Edge runtime nepodporuje `revalidatePath`.)

### AC4 — Secret check uses constant-time compare
**Verify:** `grep "timingSafeEqual\|crypto" app/api/revalidate/parts/route.ts` → ≥1 match. Žádný `===` na `secret` field — pouze `safeCompare()`.

### AC5 — Zod schema validates body
**Verify:** Manual review — `RevalidateRequestSchema` je Zod object s `brand?` `model?` `year?` `secret` fields + 2 refinements (model→brand, year→model).

### AC6 — PARTS_BRANDS má 17 entries
**Verify:** `grep -c '{ slug: ' lib/seo-data.ts` v PARTS_BRANDS section = 17 (8 original + 9 H2). Manual count na lines 1226-1255 area.

### AC7 — PARTS_MODELS_BY_BRAND má 51 modelů celkem
**Verify:** Count entries per brand v PARTS_MODELS_BY_BRAND. Expected: 8 × 3 = 24 (existing) + 9 × 3 = 27 (new) = **51 modelů celkem**. Per-brand count: každý nový brand má **přesně 3 modely**.

### AC8 — Header comment updated
**Verify:** `grep "17 brands" lib/seo-data.ts` → ≥1 match (header comment line ~1224).

### AC9 — `.env.example` má REVALIDATE_SECRET
**Verify:** `grep "REVALIDATE_SECRET" .env.example` → 1 match s comment.

### AC10 — Build success + SSG count v acceptable range
**Verify:**
1. `npm run build` exits 0 (no errors)
2. Parse build output pro total SSG count: `npm run build 2>&1 | grep -E "○|●" | wc -l` (or use Next.js build summary)
3. **Total SSG count MUST be in range 1250-1700**
4. **STOP & ESCALATE pokud:**
   - SSG count <1100 → **likely missing model entries** (check: each new brand has 3 models, each model has ≥1 generation)
   - SSG count >2000 → **CI timeout risk** (check: žádný model nemá generation range >30 years, žádný brand nemá >5 models)
   - SSG count 1100-1249 → **borderline LOW** — flagni v PR description, lead decide
   - SSG count 1701-2000 → **borderline HIGH** — flagni v PR description, lead decide

### AC11 — Sitemap entries count delta
**Verify:** Build sitemap, count `<loc>` entries:
- Pre-#87d baseline: ~104 dily/znacka entries (8 brand + 24 model + 72 year @ topYears)
- Post-#87d expected: ~221 dily/znacka entries (17 brand + 51 model + 153 year @ topYears)
- **Acceptable delta range: +110 to +130 dily/znacka sitemap entries**
- **STOP & ESCALATE pokud:** delta <90 nebo >150 (mismatch s expected scope)

### AC12 — Endpoint smoke test (curl)
**Verify (manual nebo CI):**
```bash
# Valid request — should return 200 + revalidated paths
curl -X POST https://carmakler.cz/api/revalidate/parts \
  -H "Content-Type: application/json" \
  -d '{"brand":"alfa-romeo","secret":"<REVALIDATE_SECRET>"}'
# Expected: 200 + JSON s revalidated array > 0

# Invalid secret — should return 401
curl -X POST https://carmakler.cz/api/revalidate/parts \
  -H "Content-Type: application/json" \
  -d '{"brand":"alfa-romeo","secret":"WRONG"}'
# Expected: 401 + {"error":"unauthorized"}

# Missing scope — should return 400
curl -X POST https://carmakler.cz/api/revalidate/parts \
  -H "Content-Type: application/json" \
  -d '{"secret":"<REVALIDATE_SECRET>"}'
# Expected: 400 + {"error":"at least one of brand/model/year required"}

# Year without model — should return 400 (Zod refinement)
curl -X POST https://carmakler.cz/api/revalidate/parts \
  -H "Content-Type: application/json" \
  -d '{"year":2018,"secret":"<REVALIDATE_SECRET>"}'
# Expected: 400 (Zod validation error)
```

**Pozn:** AC12 je deferred do post-deploy QA (samostatný #145-style test-chrome task). Implementator nemusí spustit curl proti production v IMPL fáze, ale MUSÍ verify lokálně přes `npm run dev`.

### AC13 — Lint clean
**Verify:** `npm run lint` exits 0, **žádné nové ESLint errors** ani warnings v `app/api/revalidate/parts/route.ts` ani `lib/seo-data.ts` modified lines.

### AC14 — TypeScript clean
**Verify:** `npx tsc --noEmit` exits 0, žádné new TypeScript errors.

### AC15 — Vitest passing
**Verify:** `npx vitest run` exits 0 (existing tests still pass; #87d nepřidává nové unit tests v MVP — endpoint testing je deferred).

---

## 6 — Estimated effort

### Per phase

| Phase | Description | Time est. |
|---|---|---|
| **Phase 0** | **Wait for #87c (#97) commit** (blocker) | external |
| **Phase 1** | Read references (lib/seo-data.ts, sitemap, page templates), confirm post-#87c state | 30 min |
| **Phase 2** | Generate REVALIDATE_SECRET + add to `.env.example` + local `.env` | 5 min |
| **Phase 3** | Write `app/api/revalidate/parts/route.ts` per §3.1 skeleton | 1 h |
| **Phase 4** | Add 9 brands to PARTS_BRANDS + update header comment | 15 min |
| **Phase 5** | Add 27 models to PARTS_MODELS_BY_BRAND (3 per brand × 9 brands) — research generation codes/years | 2 h |
| **Phase 6** | Local smoke test: `npm run dev`, curl endpoint, verify response shapes | 30 min |
| **Phase 7** | `npm run build` + parse SSG count + verify in range 1250-1700 | 30 min |
| **Phase 8** | Lint + typecheck + vitest | 15 min |
| **Phase 9** | Commit + push + dispatch #145 QA / #146 test-chrome | 15 min |
| **Total** | (excluding Phase 0 wait) | **~5.25 h** |

### Breakdown of risk-prone phases

- **Phase 5 (model entries)** — most variable. If implementator doesn't have ČR market data, may take 3-4h instead of 2h. Mitigation: §2.8 doporučení table pre-fills 27 models.
- **Phase 7 (SSG count verification)** — risk: ranges may be off. Mitigation: §0 + §5 explicit ranges with STOP & ESCALATE thresholds.

---

## 7 — Risk analysis

| # | Risk | Severity | Probability | Mitigation |
|---|---|---|---|---|
| 1 | #87c not yet committed when #87d IMPL dispatched → merge conflict on lib/seo-data.ts | **High** | **Medium** | §9 explicit blocking gate; team-lead MUSÍ verify #97 status before #143 IMPL dispatch |
| 2 | SSG count outside acceptable 1250-1700 range | **Medium** | **Medium** | §5 AC10 explicit STOP & ESCALATE thresholds (1100/2000) |
| 3 | Constant-time secret compare bug (length mismatch crash) | Low | Low | §3.1 skeleton handles length check before timingSafeEqual |
| 4 | revalidatePath() called on non-existent route → exception | Low | Medium | §3.1 try/catch per path, errors collected |
| 5 | Typo v new brand slug → broken route (e.g., "alfaromeo" vs "alfa-romeo") | Medium | Low | AC10 build will fail-fast if generateStaticParams emits broken paths |
| 6 | Edge runtime accidentally chosen → revalidatePath crash | Low | Low | §3.1 explicit `runtime = "nodejs"` |
| 7 | New brands have diacritics → 301 redirect loop with middleware | Low | Low | All 9 brands chosen are ASCII-safe (alfa-romeo, suzuki, fiat, mini, mitsubishi, jeep, jaguar, dodge, lexus) |
| 8 | Endpoint accidentally cached → revalidate becomes idempotent stale | Low | Low | §3.1 explicit `dynamic = "force-dynamic"` |
| 9 | Zod refinement bug → year+brand without model accepted | Low | Low | §3.1 explicit refinement chain + AC12 smoke test |
| 10 | REVALIDATE_SECRET committed to git accidentally | High | Low | `.env.example` má placeholder only, `.env.local` git-ignored, AC9 verification |
| 11 | Brand expansion model selection inaccurate (wrong CZ market) | Low | Medium | §2.8 doporučení marked as "implementator MUSÍ verify"; flag in PR description |
| 12 | CI build job timeout post-expansion (>10min) | Medium | Medium | AC10 hard ceiling 2000 SSG = ~3 min build, well under 10min CI limit |
| 13 | revalidatePath() Next.js 15 API change | Low | Low | Verified Next.js 15 docs — `revalidatePath(path, type?)` stable |
| 14 | Concurrent revalidate calls cause cache thrashing | Low | Low | MVP no rate limit, but secret-protection limits abuse vector |
| 15 | Sitemap entries delta outside acceptable range +110 to +130 | Low | Medium | AC11 STOP & ESCALATE thresholds explicit |

**Overall risk:** **Medium**. Highest risk: **#1 (sequencing race condition with #87c)** — must enforce blocking gate. Second highest: **#2 (SSG count range mismatch)** — mitigated by explicit AC10 thresholds.

---

## 8 — Open questions pro team-leada

> **✅ ALL LEAD-APPROVED (2026-04-07)** — Q1-Q7 schváleny per recommended option. Plnou citaci team-leadova rozhodnutí najdeš v **§11 LEAD DECISIONS**. Tato sekce je zachována pro audit trail (decision rationale).
> **Sequencing status:** #97 (#87c) committed v `49f680e` → blocking gate clear, IMPL může startovat bez čekání.

### Q1 — SSG count range mismatch — 1500-2000 (dispatch) vs 1250-1700 (realistic)?

**Doporučení:** **Use plán's 1250-1700 range** (consistent across §0/§5/§7/§9).

**Důvod (math derivation):**
- 9 new brands × 3 models per brand = 27 new models
- 27 modelů × ~20 avg years = ~540 new year pages
- 9 brand pages + 27 model pages + 540 year pages = **576 new dily/znacka SSG**
- Pre-#87d baseline 764 + 576 = **1340 total SSG**
- With variance ±20%: **1100-1600 total SSG**
- Plán's acceptable range **1250-1700** = realistic central case

**Team-lead's 1500-2000 target requires:**
- 4 models per brand (36 modelů, ne 27) — porušení dispatch "~3 modelů per brand"
- NEBO ≥25 years per model average — některé modely (Lexus IS, Jaguar XJ) mají v ČR omezenou generation coverage

**Alternativa (pokud team-lead trvá na 1500-2000):**
- (a) Add 4 modelů per brand místo 3 → AC10 range upravit na 1500-2000
- (b) Pick brands s longer generation history (Suzuki Vitara má 4 generations 1988-2026 = 38 years!) → můžeme extend year ranges

**Q1 final ask team-lead:** Acceptable AC10 range = **1250-1700** (plán doporučení) NEBO **1500-2000** (dispatch original) NEBO **other**?

### Q2 — `PARTS_BRAND_SLUGS` export — vytvořit nebo žádný separate slugs array?

**Doporučení:** **Žádný separate `PARTS_BRAND_SLUGS` export.** Existing code (sitemap, pages) consumes `PARTS_BRANDS` directly. Dispatch reference na `PARTS_BRAND_SLUGS` je pravděpodobně typo nebo zaměna s `ALL_BRAND_SLUGS` (line 1540, ale ten je pro VEHICLE brands, ne parts).

**Alternativa:** Vytvořit `export const PARTS_BRAND_SLUGS = PARTS_BRANDS.map(b => b.slug)` jako helper. Plus: API consistency s `ALL_BRAND_SLUGS`. Mínus: žádný caller ho aktuálně nepotřebuje.

### Q3 — Empty body `{}` (just secret) → reject 400 nebo full /dily revalidate?

**Doporučení:** **Reject 400** s `"at least one of brand/model/year required"`. Důvod: full revalidate = 1300+ paths flushed = cold-start spike pro VŠECHNY uživatele = production incident risk.

**Alternativa:** Accept full revalidate s warning log + rate-limit. Plus: convenience pro full content updates. Mínus: too risky for MVP, žádná recovery if abused.

### Q4 — Model entries — implementator vybírá manually (research) nebo používá §2.8 doporučení?

**Doporučení:** **§2.8 doporučení as starting point**, implementator verifies generation codes via Wikipedia / Wikicars. Pokud nemá čas verify všech 27, použije §2.8 verbatim a flagne v PR description.

**Alternativa:** Implementator vybírá from scratch. Plus: more accuracy. Mínus: +2-3h research time, low ROI vs §2.8 doporučení.

### Q5 — REVALIDATE_SECRET reuse CRON_SECRET nebo separate?

**Doporučení:** **Separate `REVALIDATE_SECRET`** per dispatch verbatim. Důvod: separation of concerns — cron tasks (CRON_SECRET) vs revalidation (REVALIDATE_SECRET) jsou different operations s different blast radius. Compromise jednoho secret nemá impact na druhý.

**Alternativa:** Reuse CRON_SECRET. Plus: less env vars. Mínus: shared blast radius, contraintuitive (revalidate není cron task).

### Q6 — Endpoint location: `/api/revalidate/parts` (per dispatch) vs other?

**Doporučení:** **Per dispatch** — `/api/revalidate/parts/route.ts`. Žádná deviace.

### Q7 — `/dily` root revalidate v case 3 (brand only) — included?

**Doporučení:** **YES, include** `/dily` v case 3. Důvod: `/dily` landing page může obsahovat "popular brands" section který se mění s novými brandy. Marginal cost (1 extra path per brand revalidation), high benefit (cache consistency).

**Alternativa:** Skip `/dily`. Plus: simpler logic. Mínus: stale popular brands list.

---

## 9 — Implementation order (phases summary)

```
[BLOCKING GATE] #87c (#97) commit do main
   ↓
Phase 1: Read references (post-#87c state) (30 min)
   ↓
Phase 2: REVALIDATE_SECRET generate + .env.example (5 min)
   ↓
Phase 3: Write app/api/revalidate/parts/route.ts (1 h)
   ↓
Phase 4: PARTS_BRANDS expansion + header bump (15 min)
   ↓
Phase 5: PARTS_MODELS_BY_BRAND 27 new entries (2 h)
   ↓
Phase 6: Local smoke test (curl + npm run dev) (30 min)
   ↓
Phase 7: npm run build + verify SSG count 1250-1700 (30 min)
   ↓ [STOP & ESCALATE if SSG count <1100 or >2000]
Phase 8: Lint + typecheck + vitest (15 min)
   ↓
Phase 9: Commit + dispatch #145/#146 follow-ups (15 min)
```

**Critical path:** Sequential, no parallelism opportunities (single agent, single working tree).

**STOP & ESCALATE thresholds (consistent s §0 + §5 + §7):**
- **SSG count <1100** → escalate: pravděpodobně chybí entries (model count? generation count?)
- **SSG count >2000** → escalate: CI timeout risk
- **SSG count 1100-1249** → borderline LOW, flag in PR
- **SSG count 1701-2000** → borderline HIGH, flag in PR
- **Sitemap entries delta <90 nebo >150** → escalate
- **Build/lint/typecheck/test fail** → fix in place, NE skip

**Blocking gate enforcement:** Team-lead MUSÍ ověřit `git log --oneline | grep "87c\|97"` v main branche před dispatch #143 IMPL. Pokud #97 commit chybí → DELAY IMPL.

---

## 10 — Souhrn pro team-leada (TL;DR)

**Co plán dodává:**
- 1 NEW soubor: `app/api/revalidate/parts/route.ts` (~120 LoC, POST endpoint, Zod validated, constant-time secret compare, edge cases handled per dispatch)
- 1 MODIFIED soubor: `lib/seo-data.ts` (+~263 LoC: 9 brands + 27 models + header comment)
- 1 MODIFIED soubor: `.env.example` (+1 line: REVALIDATE_SECRET placeholder)
- 0 changes v page templates / sitemap / middleware (auto-pickup verified)
- **15 acceptance criteria** s konzistentními ranges (per memory feedback)
- **Sequencing constraint:** #87d IMPL **AŽ PO** #87c (#97) commit do main

**Architektonický klíč #1 — Auto-pickup design:**
Page templates a sitemap consume `PARTS_BRANDS` přímo, takže přidání 9 brandů + 27 modelů automaticky rozšíří SSG bez code changes v jiných souborech. Single source of truth = `lib/seo-data.ts`.

**Architektonický klíč #2 — Consistent SSG ranges (memory feedback compliance):**
Všechny sekce §0/§5/§7/§9 používají **identický acceptable range 1250-1700 total SSG** + **identical hard floor/ceiling 1100/2000**. Žádný §5 vs §9 mismatch.

**Co plán NEMĚNÍ:**
- ✅ #87a llms.txt + JSON-LD generators
- ✅ #87b 3-segment routing core
- ✅ #87c SeoContent model (po commit) — pouze referenced
- ✅ #135 canonical helper
- ✅ Existing 8 H1 brands data (additive only)

**Co plán NEŘEŠÍ (out of scope):**
- ❌ Admin UI pro revalidation trigger → #87g
- ❌ Webhook integrations → out of MVP
- ❌ Bulk revalidation cron → CRON_SECRET pattern už existuje
- ❌ Per-vrakoviste revalidation → samostatný task pokud bude poptávka
- ❌ JSONB cast compatibleBrands → #87c Q4 deferred do #87f
- ❌ SeoContent rows pro 9 H2 brands → template fallback funguje out of box; manual seed run = post-#87d optional

**Effort:** ~5.25 h IMPL work (excluding wait for #87c commit). Žádné nové npm deps.

**Risk:** Medium. Highest = sequencing race condition (#87c commit blocking gate must enforce). Second = SSG count range mismatch with team-lead's stretch target 1500-2000 (Q1 ask).

**Návaznost:**
- **Blocked-by:** #87c (#97) commit do main
- **Blocks:** #145 QA (#87d), #146 test-chrome (#87d), eventually #87e DOCS (#144 — parallel-safe)
- **Po commit:** uzavírá #87 SEO chain core deliverables

~~**Rozhodovací bod pro team-leada:** Schválit Q1-Q7 + verify #97 commit status + dispatch implementator pro #87d IMPL.~~ **✅ APPROVED 2026-04-07 — viz §11 LEAD DECISIONS. #97 (#87c) committed v `49f680e`, sequencing gate clear.**

---

## 11 — LEAD DECISIONS (2026-04-07)

> **Status:** ✅ ALL APPROVED. Team-lead schválil všech 7 otázek (Q1-Q7) per planovac's recommended option. Tato sekce je **autoritativní zdroj pravdy** pro implementatora — overrides any deviating phrasing v §8 nebo elsewhere v plánu.
> **Sequencing:** #97 (#87c) committed v `49f680e`. Blocking gate v §6 je clear. IMPL #98 může startovat bez čekání.

### ✅ Q1 — SSG count range = 1250-1700 (NOT 1500-2000)

**Lead's verbatim:**
> **Q1** ✅ SSG range **1250-1700** (AC10 + §9 STOP & ESCALATE). Hard floor 1100, hard ceiling 2000. Moje původní 1500-2000 byl stretch guess — tvoje math derivation je přesnější.

**Implementator action:**
- AC10 acceptable range = **1250-1700** (consistent s §0 + §5 + §7 + §9)
- Hard floor **1100** → STOP & ESCALATE (build wrong, missing entries)
- Hard ceiling **2000** → STOP & ESCALATE (CI timeout risk)
- Borderline LOW (1100-1249) → flag in PR description
- Borderline HIGH (1701-2000) → flag in PR description

### ✅ Q2 — NO `PARTS_BRAND_SLUGS` export (ad hoc `.map()`)

**Lead's verbatim:**
> **Q2** ✅ Žádný PARTS_BRAND_SLUGS export, ad hoc `.map(b=>b.slug)`.

**Implementator action:**
- **NEvytvářet** `export const PARTS_BRAND_SLUGS = ...` v `lib/seo-data.ts`
- Pokud caller potřebuje slugs array → použít ad hoc `PARTS_BRANDS.map(b => b.slug)` v call site
- Žádný refactor existing kódu

### ✅ Q3 — Empty body `{}` → 400 Bad Request

**Lead's verbatim:**
> **Q3** ✅ Empty body `{}` → **400 Bad Request** (explicit error, nic se nerevalidate).

**Implementator action:**
- POST `{ secret: "..." }` (žádný brand/model/year) → **HTTP 400** s body `{ error: "at least one of brand/model/year required" }`
- Žádný full /dily revalidate fallback
- Žádný revalidatePath() call
- Logged jako warning (NE error) — legitimní user error, ne attack

### ✅ Q4 — 3 modely per brand (27 total), NE 4

**Lead's verbatim:**
> **Q4** ✅ **3 modely/brand** (27 modelů total). 4. model NE — nechat jako future scope.

**Implementator action:**
- Použít §2.8 doporučení verbatim: 9 brandů × 3 modely = **27 PARTS_MODELS_BY_BRAND entries**
- 4. model NEPŘIDÁVAT → future scope (bude tracked separátně, ne v tomto IMPL)
- Pokud SSG count vyjde na low end (1100-1249), NE expand na 4. model — flag a pokračovat

### ✅ Q5 — REVALIDATE_SECRET separátní (NOT reuse CRON_SECRET)

**Lead's verbatim:**
> **Q5** ✅ **REVALIDATE_SECRET separátní** od CRON_SECRET (different threat model).

**Implementator action:**
- Přidat **nový** `REVALIDATE_SECRET=` do `.env.example` (NEreusovat `CRON_SECRET`)
- Komentář v `.env.example`: `# openssl rand -hex 16`
- V `app/api/revalidate/parts/route.ts` → `process.env.REVALIDATE_SECRET` (NE `CRON_SECRET`)
- Constant-time compare via `timingSafeEqual` z `node:crypto`

### ✅ Q6 — Endpoint `/api/revalidate/parts/route.ts` (scoped)

**Lead's verbatim:**
> **Q6** ✅ Endpoint **`/api/revalidate/parts/route.ts`** (scoped).

**Implementator action:**
- Vytvořit přesně `app/api/revalidate/parts/route.ts` (parts subpath, ne generic `/api/revalidate/route.ts` s type discriminator)
- Future revalidate endpoints (inzerce, marketplace) půjdou jako sourozenecké subpaths: `/api/revalidate/inzerce/`, `/api/revalidate/marketplace/`

### ✅ Q7 — Root `/dily` revalidate při bulk (brand-only) YES

**Lead's verbatim:**
> **Q7** ✅ Root `/dily` revalidate při bulk YES.

**Implementator action:**
- Case 3 (brand-only revalidate) → MUSÍ zahrnout `/dily` v revalidated paths array
- Reasoning: `/dily` landing může obsahovat "popular brands" section, která se mění s expansion
- Marginal cost (1 extra path), high benefit (cache consistency)

---

### Implementator pre-flight checklist (po §11 LEAD DECISIONS)

Před startem Phase 1 implementator MUSÍ:
1. ✅ Přečíst §11 LEAD DECISIONS verbatim — to je autoritativní spec
2. ✅ Ověřit `git log --oneline lib/seo-data.ts | head -5` — `49f680e` musí být přítomný (#87c commit)
3. ✅ Ověřit že `lib/seo-data.ts` má `SeoContent` model dependency post-#87c (npm typecheck pass)
4. ✅ Run `git pull origin main` před startem — sync s post-#97 state
5. ✅ Před commitem run AC10 SSG count check + porovnat proti 1250-1700 range

---

**Next steps (post-§11 approval):**
1. ~~Lead reviews + rozhoduje Q1-Q7~~ ✅ HOTOVO
2. ~~Verify #97 commit status~~ ✅ HOTOVO (`49f680e`)
3. Commit plan file s §11 update
4. Lead dispatchne implementator pro #87d IMPL s odkazem na tento plán + explicit pointer na §11
5. Implementator postupuje per §9 phase order (Phase 1 → 9), respektuje §11 LEAD DECISIONS
6. Post-IMPL: dispatch #145 QA + #146 test-chrome (curl smoke + browser navigation pro 9 nových brand pages)
7. Po commit: #87 SEO chain core deliverables HOTOVO. Post-commit follow-ups: #87e DOCS write (#144), #87f JSONB cast, #87g admin UI revalidation
