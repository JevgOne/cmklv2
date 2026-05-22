# QA Report — Task #114/#116: #111 URL canonicalization (commit f13f2f2)

**Datum:** 2026-04-07  
**Agent:** KONTROLOR  
**Commit:** `f13f2f2` — chore(urls): canonicalize on bare carmakler.cz (no www) + production fallbacks

---

## SEKCE 1 — Simplify kontrola

### `lib/seo.ts` — 14 changed lines = 7 × 2

Commit message říká "14 changes" v lib/seo.ts. Konkrétně: 7 řádků smazáno (`-"https://www.carmakler.cz"`) + 7 řádků přidáno (`+"https://carmakler.cz"`) = 14 diff lines. Žádná složitost — čisté string substituce na 7 místech v 5 funkcích (`generateServiceJsonLd`, `generateArticleJsonLd`, `generateWebPageJsonLd`, `generateOrganizationJsonLd` ×2, `generateWebSiteJsonLd` ×2). Žádná nová abstrakce, žádný helper. ✅

### `next.config.ts` — `redirects()` block

```typescript
async redirects() {
  return [
    {
      source: "/:path*",
      has: [{ type: "host", value: "www.carmakler.cz" }],
      destination: "https://carmakler.cz/:path*",
      permanent: true,
    },
  ];
},
```

Standardní Next.js `redirects()` vzor, minimální (1 rule). Host-matching pattern zachycuje všechny www.carmakler.cz requesty → přesměruje na bare doménu. `permanent: true` = HTTP 308. Komentář vysvětluje záměr. ✅ Nejjednodušší možná implementace.

### Celkový simplify verdikt

18 souborů, 28 line edits — všechno jsou přímé string substituce nebo komentáře. Žádná nová abstrakce, žádný helper, žádný refactor. Přesně to co plan §4 specifikoval. ✅

---

## SEKCE 2 — Debug kontrola

### Build
```
npm run build
✓ Compiled successfully
✓ Generating static pages (313/313)
```
**✅ BUILD PASSED**

### Lint
```
npm run lint
✖ 538 problems (0 errors, 538 warnings)
```
**✅ LINT PASSED — 0 errors** (538 warnings = aktuální baseline)

### Vitest — full suite
```
npx vitest run
Test Files: 15 passed (15)
Tests:      141 passed (141)
```
**✅ 141/141 PASS**

### TypeScript
```
npx tsc --noEmit → 0 errors
```
**✅ CLEAN**

### Subdomain + URLs testy (AC6 + AC7)
```
npx vitest run __tests__/lib/subdomain.test.ts __tests__/lib/urls.test.ts
Test Files: 2 passed (2)
Tests:      18 passed (18)
```
**✅ subdomain parser: vše zelené | urls.test.ts: 6/6 zelené**

---

## SEKCE 3 — Reverzní kontrola (plan-task-111.md Acceptance Criteria)

### AC1 — Žádné `localhost:3000` v production code paths

```bash
grep -rn "localhost:3000" app/ lib/ components/
```

**Výsledky (2 matches — oba jsou JSDoc komentáře):**
- `lib/urls.ts:5` — `"http://localhost:3000/x" (dev, env override)` → JSDoc vysvětlivka, povoleno
- `lib/subdomain.ts:11` — `inzerce.localhost:3000 → 'inzerce', localhost:3000 → 'main'` → JSDoc, povoleno

**Žádný runtime production code path s `localhost:3000` fallback.** ✅

Note: `middleware.ts:119` (`const host = request.headers.get("host") || "localhost:3000"`) je zachován per AC5 — viz níže.

### AC2 — Žádné `www.carmakler.cz` v production code

```bash
grep -rn "www\.carmakler" app/ lib/ components/
```

**Výsledek: 0 matches** ✅

Všechna `www.carmakler.cz` v 16 souborech nahrazena `carmakler.cz`.

### AC3 — `next.config.ts` má `redirects()` s `permanent: true` pro www→bare

```typescript
{
  source: "/:path*",
  has: [{ type: "host", value: "www.carmakler.cz" }],
  destination: "https://carmakler.cz/:path*",
  permanent: true,   // HTTP 308 Permanent Redirect
}
```

✅ Přítomno. Host-based matching, `permanent: true`, wildcard path propagation (`/:path*`).

### AC4 — Sociální URLs (`www.facebook.com`, `www.linkedin.com`) NESÁHNUTÉ

```
lib/seo.ts:316  → "https://www.facebook.com/carmakler"   ✅ zachováno
lib/seo.ts:317  → "https://www.linkedin.com/company/carmakler"  ✅ zachováno
```

Grep `www\.carmakler` → 0 matches, ale `www\.facebook` a `www\.linkedin` stále přítomny. ✅

### AC5 — `middleware.ts:119` host fallback NESÁHNUTÉ

```typescript
const host = request.headers.get("host") || "localhost:3000";
```

✅ Beze změny. Tento runtime fallback je out of scope dle plan §1A (runtime host handling, ne canonical URL produkce).

### AC6 — Subdomain parser test zelený

```
npx vitest run __tests__/lib/subdomain.test.ts
Tests: 12/12 passed (vč. carmakler.cz→main a www.carmakler.cz→main cases)
```
**✅ Vše zelené — parser logic nebyla dotčena**

### AC7 — urls.test.ts 6/6 zelený

```
npx vitest run __tests__/lib/urls.test.ts
Tests: 6/6 passed
```
**✅ Vše zelené**

---

## Detailní verifikace lib/seo.ts (7 edits)

| # | Funkce | Field | Old | New |
|---|--------|-------|-----|-----|
| 1 | `generateServiceJsonLd` | `provider.url` | `www.carmakler.cz` | `carmakler.cz` ✅ |
| 2 | `generateArticleJsonLd` | `publisher.url` | `www.carmakler.cz` | `carmakler.cz` ✅ |
| 3 | `generateWebPageJsonLd` | `publisher.url` | `www.carmakler.cz` | `carmakler.cz` ✅ |
| 4 | `generateOrganizationJsonLd` | `url` | `www.carmakler.cz` | `carmakler.cz` ✅ |
| 5 | `generateOrganizationJsonLd` | `logo` | `www.carmakler.cz/logo.png` | `carmakler.cz/logo.png` ✅ |
| 6 | `generateWebSiteJsonLd` | `url` | `www.carmakler.cz` | `carmakler.cz` ✅ |
| 7 | `generateWebSiteJsonLd` | `potentialAction.target.urlTemplate` | `www.carmakler.cz/dily/...` | `carmakler.cz/dily/...` ✅ |

**Social URLs v `generateOrganizationJsonLd` zachovány:** `www.facebook.com/carmakler` + `www.linkedin.com/company/carmakler` ✅

---

## SOUHRN

| Sekce | Výsledek |
|-------|---------|
| Simplify | ✅ Čisté string substituce, no abstrakce, next.config.ts redirect minimální |
| Build | ✅ 313/313 |
| Lint | ✅ 0 errors (538 warnings = baseline) |
| Vitest | ✅ 141/141 |
| TypeScript | ✅ 0 errors |
| AC1 — žádný localhost:3000 runtime | ✅ Jen JSDoc komentáře |
| AC2 — žádný www.carmakler.cz | ✅ 0 matches v production code |
| AC3 — redirects() permanent www→bare | ✅ `permanent: true`, host-based matching |
| AC4 — social URLs zachovány | ✅ facebook.com + linkedin.com beze změny |
| AC5 — middleware:119 zachován | ✅ Nedotčen |
| AC6 — subdomain test zelený | ✅ 12/12 |
| AC7 — urls.test.ts zelený | ✅ 6/6 |

---

## VERDICT: **PASS** ✅

Commit `f13f2f2` je správně implementován. 21 výskytů `www.carmakler.cz` nahrazeno v 16 souborech, `lib/urls.ts` MAIN_URL fallback aktualizován, `next.config.ts` redirect rule přidán. Všechny acceptance criteria splněny.

**Žádné blockers. Žádné minor findings.**
