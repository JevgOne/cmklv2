# IMPL #132 — Fix #87b runtime bugs (Strategy A)

**Task:** TASK-132
**Branch:** main
**Commit:** `3666bad`
**Plan:** `.claude-context/tasks/plan-task-131-87b-bugs.md` (Strategy A)
**Origin bug report:** `.claude-context/tasks/chrome-test-task-130-87b.md`
**Status:** ✅ Done — pushed to origin/main 2026-04-07

---

## Executive summary

Fixes 2 P2 runtime bugs that test-chrome #130 found in the previously-shipped #87b 3-segment routing implementation:

1. **Bug #1 — Diakritika 404:** `/dily/znacka/škoda` returned 404 instead of 301 → `/dily/znacka/skoda`. The page-level `permanentRedirect()` block was unreachable because `dynamicParams=false` swallows non-prebuilt slugs at the segment resolver before the page function runs.
2. **Bug #2 — Year 200:** `/dily/znacka/bmw/rada-3/1995` returned 200 with the homepage title instead of 404. Next.js issue #63483: `notFound()` inside `force-static` has a caching anomaly that renders a cached fallback instead of emitting 404, so the runtime year validation was effectively dead code.

Strategy A (lead-approved) moves diakritika 301 redirect into `middleware.ts` (pre-routing) and pre-builds all valid years via `dynamicParams=false` so invalid years get a real 404 from the segment resolver.

---

## Lead overrides applied

| # | Override | Plan said | Lead said | Applied |
|---|---|---|---|---|
| Q1 | `[rok]` page `dynamicParams` | leave `true` (§10.4) | switch to `false` (Next.js #63483) | ✅ |
| Q2 | SSG expansion | budget concerns | accept ~500-600 expansion | ✅ (actual = 432) |
| Q3 | Diakritika handling location | page-level permanentRedirect | middleware.ts (pre-routing) | ✅ |
| Q4 | `isValidPartsYear` helper | keep for defense-in-depth | DELETE as dead code | ✅ |

---

## Files changed

| File | Change |
|---|---|
| `middleware.ts` | + `aliasFor` import; + `PARTS_BRAND_ROUTE` regex; + `getPartsRouteDiakritikaRedirect()` helper with `decodeURIComponent` guard; + integration block before subdomain rewrite (`main` + `shop` subdomains) |
| `app/(web)/dily/znacka/[brand]/page.tsx` | − dead `aliasFor` import + page-level redirect block; replaced with comment pointing to middleware |
| `app/(web)/dily/znacka/[brand]/[model]/page.tsx` | − dead `aliasFor` import + page-level redirect block; replaced with comment |
| `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` | `dynamicParams: true → false`; `generateStaticParams` expands across all valid years via `getValidYearsForModel()`; − `isValidPartsYear` runtime check (no longer needed); − dead `aliasFor` block |
| `lib/seo-data.ts` | − `isValidPartsYear()` (Q4 dead-code removal) |

5 files changed, 63 insertions(+), 50 deletions(-)

---

## Critical implementation note: URL-encoded pathname

`request.nextUrl.pathname` in Next.js middleware returns the path **URL-encoded** (e.g. `%C5%A1koda` for `škoda`). The first iteration of `getPartsRouteDiakritikaRedirect()` matched the encoded string directly, then passed `%C5%A1koda` into `aliasFor()` → `slugify()`. But `slugify()` strips `%` chars via `/[^a-z0-9\s-]/g`, so the canonical came out as `c5a1koda` instead of `skoda`. The first curl test caught this immediately.

Fix:

```ts
let decoded: string;
try {
  decoded = decodeURIComponent(pathname);
} catch {
  return null; // Malformed URI sequence
}
const match = decoded.match(PARTS_BRAND_ROUTE);
```

The `try/catch` guards against malformed encoding (which would otherwise throw `URIError` and bubble out of middleware).

## Critical implementation note: dev vs production routing

Next.js dev mode (`next dev`) **lazy-evaluates** `dynamicParams=false` and does not strictly enforce 404 for non-prebuilt slugs — it falls through to the page function, which then runs `notFound()`. Local AC4 verification (`/dily/znacka/bmw/rada-3/1995 → 404`) only passed against `next start` (production server), not `next dev`. After fixing the decode bug, I rebuilt + restarted the production server on port 3010 and re-ran all curl ACs against that.

---

## Quality gates

| Gate | Result |
|---|---|
| `npm run lint` | 0 errors / 542 warnings (baseline preserved) ✅ |
| `tsc --noEmit` | 0 errors ✅ |
| `vitest run` | 141/141 passing ✅ |
| `npm run build` | EXIT 0 with dummy DATABASE_URL ✅ |
| Total SEO routes built | 8 brand + 24 model + 432 rok = 464 ✅ |

SSG count grew from ~72 (only `topYears`) to 432 (all `getValidYearsForModel()` results), well within the lead-approved budget (200-1000).

---

## AC verification table

Verified locally against `next start -p 3010` (production server) after `npm run build`. Curl format: `curl -sI -o /dev/null -w "%{http_code} %{redirect_url}" http://localhost:3010/...`.

| AC | Test | Expected | Actual | Pass |
|----|---|---|---|---|
| AC1 | `/dily/znacka/škoda` | 301 → `/dily/znacka/skoda` | 301 → `http://localhost:3010/dily/znacka/skoda` | ✅ |
| AC2 | `/dily/znacka/škoda/octavia` | 301 → `/dily/znacka/skoda/octavia` | 301 → `http://localhost:3010/dily/znacka/skoda/octavia` | ✅ |
| AC3 | `/dily/znacka/škoda/octavia/2018` | 301 → `/dily/znacka/skoda/octavia/2018` | 301 → `http://localhost:3010/dily/znacka/skoda/octavia/2018` | ✅ |
| AC4 | `/dily/znacka/bmw/rada-3/1995` | 404 | 404 | ✅ |
| AC5 | `/dily/znacka/bmw/rada-3/abcd` | 404 | 404 | ✅ |
| AC6 | `/dily/znacka/bmw/rada-3/2018` (valid) | 200 | 200 | ✅ |
| AC7 | `/dily/znacka/skoda` (canonical) | 200 | 200 | ✅ |
| AC8 | `/dily/znacka/skoda/octavia` (canonical) | 200 | 200 | ✅ |
| AC9 | `/dily/znacka/skoda/octavia/2018` (canonical) | 200 | 200 | ✅ |
| AC10 | SSG count for `[rok]` page | 200-1000 | 432 | ✅ |
| AC11 | `npm run lint` | 0 errors | 0 errors / 542 warnings (baseline) | ✅ |
| AC12 | `tsc --noEmit` | 0 errors | 0 errors | ✅ |
| AC13 | `vitest run` | all green | 141/141 | ✅ |
| AC14 | shop subdomain `/dily/znacka/skoda` | 200 | 200 | ✅ |
| AC15 | shop subdomain `/dily/znacka/škoda` | 301 → canonical | 301 → `http://shop.localhost:3010/dily/znacka/skoda` | ✅ |
| Bonus | 404 page title | "Stránka nenalezena \| CarMakléř" | rendered correct title (not homepage) | ✅ |
| AC16 | test-chrome retest of #130 bugs | post-deploy QA | **deferred to QA** | ⏳ |

15/16 ACs locally verified. AC16 (test-chrome retest) is post-deploy QA work, not implementator's responsibility.

---

## Risks / follow-ups

- **Build time impact:** SSG grew 6× (~72 → 432). On the current dataset this added <2s to total build, so well below the 5-min CI budget. Worth re-checking once `getValidYearsForModel()` is fed real generation data for all 24 models (currently fixture-driven).
- **Middleware regex coverage:** `PARTS_BRAND_ROUTE` only matches `/dily/znacka/{brand}[/{model}[/{rok}]]/?`. It does **not** match category routes (`/dily/kategorie/*`). If we add diakritika aliases for categories later, the regex needs an OR branch.
- **Decode try/catch:** silently returns `null` on malformed encoding, letting the request fall through to the page (which then 404s via segment resolver). That's the right call — we don't want middleware to throw — but worth a unit test if we ever add more middleware regex routes.
- **Plan §10.4 deviation logged:** Q1 override against plan-124 is documented in commit message + this report so future readers see the rationale (Next.js #63483).

---

## Test commands (reproducible)

```bash
# Build production
DATABASE_URL="postgresql://dummy" npm run build

# Start production server
DATABASE_URL="postgresql://dummy" npx next start -p 3010 &

# AC1-3: diakritika 301
curl -sI "http://localhost:3010/dily/znacka/%C5%A1koda" | head -3
curl -sI "http://localhost:3010/dily/znacka/%C5%A1koda/octavia" | head -3
curl -sI "http://localhost:3010/dily/znacka/%C5%A1koda/octavia/2018" | head -3

# AC4-6: year validation
curl -sI -o /dev/null -w "%{http_code}\n" "http://localhost:3010/dily/znacka/bmw/rada-3/1995"  # 404
curl -sI -o /dev/null -w "%{http_code}\n" "http://localhost:3010/dily/znacka/bmw/rada-3/abcd"  # 404
curl -sI -o /dev/null -w "%{http_code}\n" "http://localhost:3010/dily/znacka/bmw/rada-3/2018"  # 200

# AC14-15: shop subdomain
curl -sI -H "Host: shop.localhost" "http://localhost:3010/dily/znacka/skoda" | head -3
curl -sI -H "Host: shop.localhost" "http://localhost:3010/dily/znacka/%C5%A1koda" | head -3

# Quality gates
npm run lint
npx tsc --noEmit
npx vitest run
```

---

## Memory / context

- Plan: `.claude-context/tasks/plan-task-131-87b-bugs.md`
- Origin bug report: `.claude-context/tasks/chrome-test-task-130-87b.md`
- Original #87b implementation: `.claude-context/tasks/impl-task-87b-3segment-routing.md`
- Predecessor commit: `1466223` (original #87b)
- This commit: `3666bad`
