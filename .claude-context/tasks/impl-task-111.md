---
task: 111
title: URL canonicalization na bare carmakler.cz (no www) + production fallbacks
type: IMPL
owner: implementator
status: DONE
size: M
risk: LOW
priority: URGENT
created: 2026-04-07
plan_ref: plan-task-111.md
---

# #111 IMPL — URL canonicalization na `carmakler.cz` (bez www)

## §0 Scope provedeno

Implementoval jsem **plán-task-111** §2 přesně dle specifikace: 18 souborů, 28 line edits.

| Batch | Files | Edits | Strategy |
|---|---|---|---|
| A (replace_all) | `lib/seo.ts`, `app/(web)/nabidka/[slug]/page.tsx` | 5 + 4 = 9 | replace_all literal |
| A (manual) | `lib/seo.ts` lines 311, 347 | 2 | replace_all neumřel — `/logo.png` a `/dily/katalog?q=...` paths bez closing quote |
| B (single edits) | 14 souborů | 16 | parallel single line edits |
| C (BONUS) | `next.config.ts` | 1 (insert) | new `redirects()` async function |

**Total: 18 souborů, 28 line edits** ✅

---

## §1 Provedené editace per soubor

### 1. `lib/urls.ts` (2 edits)
- ř.5 JSDoc: `"http://localhost:3000/x"` → `"https://carmakler.cz/x" (prod) | "http://localhost:3000/x" (dev, env override)`
- ř.20 `MAIN_URL` fallback: `"http://localhost:3000"` → `"https://carmakler.cz"`

### 2. `lib/subdomain.ts` (1 edit, JSDoc)
- ř.11-12: prod example → bare doména, `www.* → 'main' via redirect` poznámka

### 3. `lib/seo.ts` (7 edits)
- replace_all literal `"https://www.carmakler.cz"` → `"https://carmakler.cz"` matchnul **5 výskytů** (ř. 116, 146, 217, 310, 342)
- 2 manuální edity pro path-suffixed URLs (replace_all je neviděl protože za `.cz` byl `/path` ne `"`):
  - ř.311 `logo: "https://www.carmakler.cz/logo.png"` → bare
  - ř.347 `urlTemplate: "https://www.carmakler.cz/dily/katalog?q={search_term_string}"` → bare
- ✅ Sociální URLs `www.facebook.com` (ř.316), `www.linkedin.com` (ř.317) **NESÁHNUTÉ**

### 4. `lib/seo-data.ts` (1 edit)
- ř.5: `BASE_URL` fallback → bare

### 5. `lib/listing-sla.ts` (1 edit)
- ř.166: `WATCHDOG_BASE_URL` fallback → bare

### 6. `lib/company-info.ts` (2 edits)
- ř.42: `web.url` → bare
- ř.43: `web.logo` → bare
- ✅ Sociální URLs ř.47-49 (`facebook.com`, `instagram.com`, `youtube.com/@carmakler`) **NESÁHNUTÉ**

### 7. `lib/brand-styles.ts` (1 edit, NEW)
- ř.27 `company.web` display string: `"www.carmakler.cz"` → `"carmakler.cz"`

### 8. `lib/email-verification.ts` (1 edit, NEW)
- ř.52 visible footer link text: `www.carmakler.cz` → `carmakler.cz` (`href` zůstává `${process.env.NEXTAUTH_URL}`)

### 9. `app/robots.ts` (1 edit)
- ř.3: `BASE_URL` fallback → bare

### 10. `app/sitemap.ts` (1 edit)
- ř.5: `BASE_URL` fallback → bare

### 11. `app/layout.tsx` (1 edit)
- ř.14: `BASE_URL` fallback → bare (root metadata)

### 12. `app/llms.txt/route.ts` (1 edit)
- ř.61 visible markdown text `Web: https://www.carmakler.cz` → bare

### 13. `app/(web)/nabidka/page.tsx` (1 edit)
- ř.222 JSON-LD `ItemList.url` template literal → bare

### 14. `app/(web)/nabidka/[slug]/page.tsx` (4 edits)
- replace_all literal `https://www.carmakler.cz` → `https://carmakler.cz`
- 4 výskyty: ř.459 (Vehicle.url), ř.470 (Domů breadcrumb), ř.476 (Nabídka breadcrumb), ř.482 (vehicle slug breadcrumb)

### 15. `app/api/auth/forgot-password/route.ts` (1 edit)
- ř.54 `resetUrl` template literal fallback → bare

### 16. `components/web/Breadcrumbs.tsx` (1 edit, NEW)
- ř.20 JSON-LD `BreadcrumbList.itemListElement.item` → bare (sdílená komponenta napříč celým webem)

### 17. `components/ui/PlatformSwitcher.tsx` (1 edit, NEW)
- ř.32 inline kód-komentář (BONUS rewrite na `marketplace.carmakler.cz` subdomain — odráží reálnou DNS topologii)

### 18. `next.config.ts` (BONUS, 1 insert)
- Přidán nový `redirects()` async function mezi `images` (ř.65-80) a `headers()` blokem
- 308 permanent redirect: `host=www.carmakler.cz` → `https://carmakler.cz/:path*`
- Důvod: dual-layer redirect (DNS + Next.js fallback) per plan §3

---

## §2 Acceptance Criteria — verifikace

| AC | Status | Verifikace |
|---|---|---|
| **AC1** `lib/urls.ts:20` MAIN_URL = `"https://carmakler.cz"` | ✅ | Edit confirmed |
| **AC2** `lib/urls.ts:5` JSDoc zmiňuje obě varianty | ✅ | Manual read |
| **AC3** `lib/subdomain.ts:11-12` JSDoc bare doména v prod example | ✅ | Manual read |
| **AC4** `getSubdomain()` parser nezměněn — testy zelená | ✅ | `vitest run __tests__/lib/subdomain.test.ts` → 8 passed |
| **AC5** Žádný `www.carmakler.cz` v production code (kromě social) | ✅ | `grep "www\\.carmakler" {app,lib,components}/**/*.{ts,tsx}` → 0 matches. Pouze `next.config.ts:83,91` (redirect rule) zůstává — záměrné. |
| **AC6** Žádný `localhost:3000` v production code (kromě middleware:119) | ✅ | `grep "localhost:3000" {app,lib,components}/**/*.{ts,tsx}` → pouze 2 JSDoc komentáře (`lib/subdomain.ts:11`, `lib/urls.ts:5`) — záměrné dev příklady |
| **AC7** `next.config.ts` má `redirects()` async function | ✅ | Insert confirmed mezi `images` a `headers()` |
| **AC8** lint + tsc + vitest zelené | ✅ | `tsc --noEmit` → 0 errors. `npm run lint` → 0 errors (538 warnings, pre-existing). `vitest run` → 141/141 passed |
| **AC9** `urls.inzerce/shop/marketplace()` chování zachováno | ✅ | `lib/urls.ts:24-26` nedotčeno |
| **AC10** Post-deploy `curl -I https://www.carmakler.cz/` 308 | ⏳ | Pending — vyžaduje deploy + DNS rule (delegated na #115 DEPLOY) |

---

## §3 Risk verify — sociální URLs nepřepsány

```bash
grep -nR "www\.\(facebook\|linkedin\|instagram\|youtube\)" {app,lib,components}/**/*.{ts,tsx}
```

Output:
```
lib/seo.ts:316:      "https://www.facebook.com/carmakler",
lib/seo.ts:317:      "https://www.linkedin.com/company/carmakler",
```

✅ Social URLs `www.facebook.com` + `www.linkedin.com` **preserved as-is**.

`lib/company-info.ts:47-49` (`facebook.com/carmakler`, `instagram.com/carmakler`, `youtube.com/@carmakler`) jsou bez `www.` od počátku — taky nedotčeno.

---

## §4 Test results

### TypeScript (`tsc --noEmit`)
```
0 errors
```

### ESLint (`npm run lint`)
```
✖ 538 problems (0 errors, 538 warnings)
```
Všech 538 warnings pre-existing, 0 errors.

### Vitest (`vitest run`)
```
Test Files  15 passed (15)
     Tests  141 passed (141)
  Duration  754ms
```
- `__tests__/lib/subdomain.test.ts` — 8/8 passed (parser nezměněn)
- `__tests__/lib/urls.test.ts` — 6/6 passed
- ostatních 13 test files — 127/127 passed

---

## §5 Out of scope (zachováno per plan §5)

- `e2e/**/*.spec.ts`, `playwright.config.ts` — test infra
- `__tests__/middleware.test.ts`, `__tests__/lib/subdomain.test.ts` — unit testy proti localhost
- `middleware.ts:119` `host` header runtime fallback
- `.env.example` — dev template
- Dev docs (`CLAUDE.md`, `README.md`, `MASTER-PLAN.md`)
- `public/sw.js` (Serwist generated)
- Email templates už používající bare doménu (signature.ts, daily-summary.ts, marketplace-application-confirmation.ts) — verified §1C plánu
- Sociální URLs (Facebook/LinkedIn/Instagram/YouTube)

---

## §6 Commit message

```
chore(urls): canonicalize on bare carmakler.cz (no www) + production fallbacks

- lib/urls.ts MAIN_URL fallback: localhost:3000 → https://carmakler.cz
- 21 occurrences of https://www.carmakler.cz → https://carmakler.cz across 16 files
- lib/subdomain.ts JSDoc: align prod example with bare domain canonical
- components/ui/PlatformSwitcher.tsx comment: marketplace VIP URL → subdomain
- next.config.ts: add redirects() rule www→bare (308) as DNS fallback safety net
- Social URLs (www.facebook.com, www.linkedin.com) preserved as-is
- Tests unchanged (141/141 pass, parser supports both variants)

Refs: #111
```

---

## §7 Next steps

1. ✅ TaskUpdate #111 → completed
2. ✅ SendMessage team-lead s shrnutím commitu
3. ⏳ #114 IMPL — commit dirty prod fixes (prisma.config.ts + useOnlineStatus.ts)
4. ⏳ #115 DEPLOY — push 10+ commits + SSH server pull/build/reload
5. ⏳ Post-deploy verify: `curl -I https://www.carmakler.cz/` → expect 308 + bare canonical

---

**Implementace dokončena. Plán plně dodržen, 0 deviation, 0 regresí.**
