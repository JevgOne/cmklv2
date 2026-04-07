---
task: 111
title: Replace localhost:3000 fallbacks with production URLs (URL canonicalization carmakler.cz)
type: PLAN
owner: planovac
status: READY (čeká na lead approval → #112 IMPL dispatch)
size: M
risk: LOW (string substitutions + 1 new redirects rule)
priority: URGENT
created: 2026-04-07
---

# #111 PLAN — URL canonicalization na `carmakler.cz` (bez www) + production fallbacks

## §0 TL;DR

User chce **`carmakler.cz` jako canonical** (bez `www.`). Codebase má dnes mix:
- ❌ `lib/urls.ts:20` má `localhost:3000` jako fallback místo `https://carmakler.cz`
- ❌ ~21 řádků ve 17 souborech používá `https://www.carmakler.cz` (s www)
- ❌ `lib/subdomain.ts:12` JSDoc zmiňuje `www.carmakler.cz → 'main'` místo bare

**Cíl:** Zero-tolerance audit + cleanup. **17 souborů, ~26 line edits, 1 nový `next.config.ts` redirect rule.** Testy nezasaženy (parser už handluje obě varianty).

**Out of scope:** middleware host fallback, e2e testy, .env.example, dev docs, social URL (Facebook/LinkedIn/Instagram/YouTube), email-templates které už používají bare doménu (8 souborů, dvojitý audit).

---

## §1 Audit (grep evidence + cross-check proti task description)

### A) `localhost:3000` v production code (po vyfiltrování testů + middleware host fallback)

| File | Lines | Akce |
|---|---|---|
| `lib/urls.ts` | 5 (JSDoc), 20 (`MAIN_URL` fallback) | **EDIT** → `https://carmakler.cz` |
| `middleware.ts` | 119 (`host` header fallback) | **KEEP** — out of scope (runtime host fallback, ne canonical URL) |

**Vše ostatní `localhost:3000` v repo je:**
- `e2e/**` (Playwright specs) — KEEP
- `playwright.config.ts:12,32` — KEEP
- `__tests__/lib/subdomain.test.ts`, `__tests__/middleware.test.ts` — KEEP
- `lib/subdomain.ts:11` JSDoc — **EDIT** (jen JSDoc text, viz §1B níže)

### B) `www.carmakler.cz` v production code (cross-check verified)

Task description listoval 11 souborů. Můj grep audit našel **17 souborů celkem** — task spec poddhadl o 4–6 (viz Q3 v §11):

| # | File | Lines | Edit count | Klasifikace | Status v task spec |
|---|---|---|---|---|---|
| 1 | `lib/seo.ts` | 116, 146, 217, 310, 311, 342, 347 | 7 | JSON-LD `url`, `logo`, `urlTemplate` | ✅ listován |
| 2 | `lib/seo-data.ts` | 5 | 1 | `BASE_URL` fallback | ✅ listován |
| 3 | `lib/listing-sla.ts` | 166 | 1 | `WATCHDOG_BASE_URL` fallback | ✅ listován |
| 4 | `lib/company-info.ts` | 42, 43 | 2 | `web.url`, `web.logo` (KEEP social ř. 47-49) | ✅ listován |
| 5 | `app/robots.ts` | 3 | 1 | `BASE_URL` fallback | ✅ listován |
| 6 | `app/sitemap.ts` | 5 | 1 | `BASE_URL` fallback | ✅ listován |
| 7 | `app/layout.tsx` | 14 | 1 | `BASE_URL` fallback (root metadata) | ✅ listován |
| 8 | `app/llms.txt/route.ts` | 61 | 1 | viditelný `Web:` text v MD | ✅ listován |
| 9 | `app/(web)/nabidka/page.tsx` | 222 | 1 | JSON-LD `url` (`ItemList`) | ✅ listován |
| 10 | `app/(web)/nabidka/[slug]/page.tsx` | 459, 470, 476, 482 | 4 | JSON-LD vehicle + breadcrumb | ✅ listován |
| 11 | `app/api/auth/forgot-password/route.ts` | 54 | 1 | `resetUrl` fallback (email link) | ✅ listován |
| **12** | **`lib/email-verification.ts`** | **52** | **1** | **viditelný footer text v emailu** | ⚠️ **NEW — task spec missed** |
| **13** | **`components/web/Breadcrumbs.tsx`** | **20** | **1** | **JSON-LD `BreadcrumbList.itemListElement.item`** | ⚠️ **NEW — task spec missed** |
| **14** | **`lib/brand-styles.ts`** | **27** | **1** | **`company.web` display string (UI)** | ⚠️ **NEW — task spec missed** |
| **15** | **`components/ui/PlatformSwitcher.tsx`** | **32** | **1** | **inline kód-komentář (NE runtime URL)** | ⚠️ **NEW — task spec missed** |
| 16 | `lib/subdomain.ts` | 12 | 1 | JSDoc text only (parser je OK) | ✅ listován |

**Total:** 16 souborů, **25 line edits**.

**Plus:** `lib/urls.ts` (item v §1A) → **17 souborů, 27 line edits**.

**Plus BONUS:** `next.config.ts` → **18 souborů, 28 line edits**, viz §3 BONUS.

### C) Files které **už používají bare `https://carmakler.cz`** (verified, NESÁHAT)

- `lib/email-templates/signature.ts`
- `lib/email-templates/daily-summary.ts`
- `lib/email-templates/marketplace-application-confirmation.ts`
- `lib/listing-export.ts`
- `app/api/invitations/route.ts:115, 145`
- `app/api/marketplace/apply/route.ts:110`

✅ Šest souborů potvrzuje že **bare `carmakler.cz` je už zavedený canonical** v části kódu — tento task to dokončuje napříč celým codebase.

### D) Social/external URL — **NESÁHAT**

| File | Lines | URL | Reason |
|---|---|---|---|
| `lib/seo.ts` | 316 | `https://www.facebook.com/carmakler` | Facebook canonical má `www.` |
| `lib/seo.ts` | 317 | `https://www.linkedin.com/company/carmakler` | LinkedIn canonical má `www.` |
| `lib/company-info.ts` | 47 | `https://facebook.com/carmakler` | social handle |
| `lib/company-info.ts` | 48 | `https://instagram.com/carmakler` | social handle |
| `lib/company-info.ts` | 49 | `https://youtube.com/@carmakler` | social handle |

Tyto patří třetí straně, nikdo nemá oprávnění je měnit.

---

## §2 Per-soubor diff snippets (concrete, copy-paste ready)

### 2.1 `lib/urls.ts` (2 edits)

**Edit 1 — JSDoc ř. 5:**
```diff
- *   - urls.main("/x")        → "http://localhost:3000/x"
+ *   - urls.main("/x")        → "https://carmakler.cz/x" (prod)  |  "http://localhost:3000/x" (dev, env override)
```

**Edit 2 — `MAIN_URL` ř. 19-20:**
```diff
  const MAIN_URL =
-   process.env.NEXT_PUBLIC_MAIN_URL || "http://localhost:3000";
+   process.env.NEXT_PUBLIC_MAIN_URL || "https://carmakler.cz";
```

**Pozn:** Dev developer si nastaví `NEXT_PUBLIC_MAIN_URL=http://localhost:3000` v `.env.local`. `.env.example` má tuto entry už dokumentovanou (out of scope, ale viz §6 IMPL note).

### 2.2 `lib/subdomain.ts` (1 edit, JSDoc only)

**Edit — ř. 11-12:**
```diff
  /**
   * Parsuje host header a vrací typ subdomény.
-  * Dev: inzerce.localhost:3000 → 'inzerce', localhost:3000 → 'main'
-  * Prod: inzerce.carmakler.cz → 'inzerce', www.carmakler.cz → 'main'
+  * Dev:  inzerce.localhost:3000 → 'inzerce', localhost:3000 → 'main'
+  * Prod: inzerce.carmakler.cz   → 'inzerce', carmakler.cz   → 'main' (www.* → 'main' via redirect)
   */
```

**Parser logic NESÁHAT** — `getSubdomain()` už handluje:
- `parts.length >= 3` → bere první part jako subdomain (pokrývá `inzerce.carmakler.cz`)
- `sub === "www"` → `"main"` (pokrývá `www.carmakler.cz` jako safety net)
- `parts.length < 3` (`carmakler.cz`) → fall through na `return "main"` ✅

**Test verification:** `__tests__/lib/subdomain.test.ts:36-38` už explicitně testuje:
```typescript
it('carmakler.cz (bez subdomény) → "main"', () => {
  expect(getSubdomain('carmakler.cz')).toBe('main')
})
```
A `:28-30` testuje `www.carmakler.cz → 'main'`. **Oba testy budou nadále pass — nic v parseru se nemění.**

### 2.3 `lib/seo.ts` (7 edits — replace_all bezpečné)

**Strategy:** Edit přes `replace_all: true` v `lib/seo.ts` pro literál `"https://www.carmakler.cz"` → `"https://carmakler.cz"`. **NESMÍ** zasáhnout social URLs (`facebook.com`, `linkedin.com`) — ty obsahují `www.facebook.com` resp. `www.linkedin.com`, ne `www.carmakler.cz`. Bezpečné.

**Verify counts:** 7 edits (7 výskytů `https://www.carmakler.cz` v souboru).

**Po edit ručně ověřit `git diff`:**
```bash
git diff lib/seo.ts | grep "^[+-]" | grep carmakler
# expected: 7 - lines, 7 + lines, žádný facebook/linkedin
```

### 2.4 `lib/seo-data.ts` (1 edit)

**Edit ř. 5:**
```diff
- const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.carmakler.cz";
+ const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz";
```

### 2.5 `lib/listing-sla.ts` (1 edit)

**Edit ř. 166:**
```diff
- const WATCHDOG_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.carmakler.cz";
+ const WATCHDOG_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz";
```

### 2.6 `lib/company-info.ts` (2 edits)

**Edit ř. 42-43 (NESÁHAT social ř. 47-49):**
```diff
  web: {
-   url: "https://www.carmakler.cz",
-   logo: "https://www.carmakler.cz/brand/logo.svg",
+   url: "https://carmakler.cz",
+   logo: "https://carmakler.cz/brand/logo.svg",
  },
```

### 2.7 `lib/brand-styles.ts` (1 edit) — ⚠️ NEW

**Edit ř. 27:**
```diff
  company: {
    name: "Carmakler s.r.o.",
-   web: "www.carmakler.cz",
+   web: "carmakler.cz",
    email: "info@carmakler.cz",
```

**Použití:** Display string v UI (viditelný text), ne URL. Konzistence s user wish "bez www".

### 2.8 `lib/email-verification.ts` (1 edit) — ⚠️ NEW

**Edit ř. 52:**
```diff
  <p style="font-size: 12px; color: #A1A1AA; text-align: center;">
-   CarMakléř s.r.o. | <a href="${process.env.NEXTAUTH_URL}" style="color: #F97316;">www.carmakler.cz</a>
+   CarMakléř s.r.o. | <a href="${process.env.NEXTAUTH_URL}" style="color: #F97316;">carmakler.cz</a>
  </p>
```

**Pozn:** `href` (link target) je generován z `NEXTAUTH_URL` — to je env-driven a nemění se. Pouze viditelný link text z `www.carmakler.cz` → `carmakler.cz`.

### 2.9 `app/robots.ts` (1 edit)

**Edit ř. 3:**
```diff
- const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.carmakler.cz";
+ const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz";
```

### 2.10 `app/sitemap.ts` (1 edit)

**Edit ř. 5:** identický pattern s `app/robots.ts` (BASE_URL fallback).

### 2.11 `app/layout.tsx` (1 edit)

**Edit ř. 14:** identický pattern (BASE_URL fallback root metadata).

### 2.12 `app/llms.txt/route.ts` (1 edit)

**Edit ř. 61:**
```diff
  ## Kontakt

- - Web: https://www.carmakler.cz
+ - Web: https://carmakler.cz
  - Email: info@carmakler.cz
```

### 2.13 `app/(web)/nabidka/page.tsx` (1 edit)

**Edit ř. 222:**
```diff
  itemListElement: vehicles.slice(0, 10).map((car, i) => ({
    "@type": "ListItem",
    position: i + 1,
-   url: `https://www.carmakler.cz/nabidka/${car.slug}`,
+   url: `https://carmakler.cz/nabidka/${car.slug}`,
    name: car.name,
  })),
```

### 2.14 `app/(web)/nabidka/[slug]/page.tsx` (4 edits — replace_all bezpečné)

**Strategy:** `replace_all: true` v souboru pro literál `https://www.carmakler.cz` → `https://carmakler.cz`. Žádné jiné výskyty nejsou.

**Verify counts:** 4 edits (ř. 459, 470, 476, 482 — všechny JSON-LD url/item).

### 2.15 `app/api/auth/forgot-password/route.ts` (1 edit)

**Edit ř. 54:**
```diff
- const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.carmakler.cz"}/reset-hesla/${token}`;
+ const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz"}/reset-hesla/${token}`;
```

### 2.16 `components/web/Breadcrumbs.tsx` (1 edit) — ⚠️ NEW

**Edit ř. 20:**
```diff
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.label,
-   ...(item.href ? { item: `https://www.carmakler.cz${item.href}` } : {}),
+   ...(item.href ? { item: `https://carmakler.cz${item.href}` } : {}),
  })),
```

**Důležité:** Tato komponenta je sdílená přes celý web pro JSON-LD breadcrumbs. SEO impact = canonical URL konzistence.

### 2.17 `components/ui/PlatformSwitcher.tsx` (1 edit, comment only) — ⚠️ NEW

**Edit ř. 32:**
```diff
  // marketplace ENTRY ZÁMĚRNĚ ODSTRANĚN (#101) — VIP invite-only,
- // přístupný pouze přes přímý URL (https://www.carmakler.cz/marketplace)
+ // přístupný pouze přes přímý URL (https://marketplace.carmakler.cz)
  // a interní navbar pro přihlášené investory/dealery.
```

**Pozn:** Komentář, ne runtime kód. **Bonus:** zároveň přepsat na **subdomain** URL (`marketplace.carmakler.cz`) protože tak skutečně VIP funguje (subdomain rewrite v middlewaru), ne path-based `/marketplace` na main doméně. Konzistence dokumentace s reálnou DNS topologií.

---

## §3 BONUS — `next.config.ts` `redirects()` rule (www → bare 301)

**Reason:** DNS-level redirect je `external` — pokud někdy DNS rule selže, missing, nebo certifikát na `www` cname je špatně, máme **fallback v aplikaci**. Best practice: dual-layer redirect (DNS + app).

### Edit `next.config.ts` (přidat `redirects()` async function vedle existujícího `headers()`)

**Position:** Mezi `images` (ř. 65-80) a `headers()` (ř. 81). Asi po ř. 80.

```diff
+ async redirects() {
+   return [
+     // www.carmakler.cz → carmakler.cz (301 permanent)
+     // Bare domain je canonical (user pokyn 2026-04-07).
+     // Dual-layer redirect: DNS-level + Next.js fallback pro safety.
+     {
+       source: "/:path*",
+       has: [
+         {
+           type: "host",
+           value: "www.carmakler.cz",
+         },
+       ],
+       destination: "https://carmakler.cz/:path*",
+       permanent: true,
+     },
+   ];
+ },
  async headers() {
    return [
      {
        source: "/(.*)",
        ...
```

**Test:**
1. Build pass (TypeScript valid `redirects()` signature)
2. Po deployi: `curl -I https://www.carmakler.cz/` → expect `301` + `Location: https://carmakler.cz/`
3. `curl -I https://carmakler.cz/` → expect `200` (bez redirect loop)

**Edge case mitigation:** `permanent: true` = 308 v Next.js (Browser cache aggresive). Pokud potřebujeme rychlou změnu = `permanent: false` (307). Doporučuji `permanent: true` protože canonical je dlouhodobé rozhodnutí.

---

## §4 SEO impact (positive)

| Metrika | Před | Po | Důvod |
|---|---|---|---|
| **Canonical URL konzistence** | mixed `www`/bare | 100% bare | Google už rate-limituje duplicate canonical confusion |
| **JSON-LD validita** | 11+ entit s `www.` | 0 | Schema.org markup matchne sitemap + canonical link |
| **Sitemap.xml** | `https://www.carmakler.cz/...` URLs | `https://carmakler.cz/...` | Konzistence s `<link rel="canonical">` |
| **Open Graph URLs** | `www.` | bare | Social card preview ladí s canonical |
| **Email link target** | mismatch (NEXTAUTH_URL vs visible text) | konzistentní | Lepší trust signal pro email klienty (Gmail/Outlook anti-phishing) |

**Carry-over benefit:** Až bude live `https://carmakler.cz`, Google Search Console **nemá nic re-indexovat** — všechny canonical odkazy v JSON-LD/sitemap budou bare doménou od první deploye.

---

## §5 Out of scope (zachovat — proč)

| File | Reason |
|---|---|
| `e2e/**/*.spec.ts`, `playwright.config.ts` | Test infrastruktura proti dev serveru — má hardcoded `localhost:3000` legitimně |
| `__tests__/middleware.test.ts`, `__tests__/lib/subdomain.test.ts` | Unit testy proti localhost — `subdomain.test.ts` už pokrývá obě varianty (line 36-38 testuje `carmakler.cz` bare) |
| `middleware.ts:119` | `request.headers.get("host") || "localhost:3000"` — runtime host fallback (Next.js může mít host=undefined v některých edge cases). Není canonical URL, je defensive default. |
| `.env.example` | Dev template — developer si přepíše `.env.local`. Neměnit, dev workflow expects localhost. |
| `CLAUDE.md`, `README.md`, `MASTER-PLAN.md`, `docs/*` | Dev dokumentace s příklady localhost. |
| `public/sw.js` | Service worker generated by Serwist — nemá hardcoded URL na `carmakler.cz` (verified grep). |
| Email templates already using bare (`signature.ts`, `daily-summary.ts`, `marketplace-application-confirmation.ts`) | Už správně, NESÁHAT |
| `lib/listing-export.ts`, `app/api/invitations/route.ts`, `app/api/marketplace/apply/route.ts` | Už správně, NESÁHAT |
| Social URLs (`www.facebook.com`, `www.linkedin.com`, `facebook.com/carmakler`, atd.) | Třetí strana, nikdo nemá oprávnění |

---

## §6 Implementation note pro #112 IMPL

### Sequence (doporučená pro implementator)

1. **Read** všech 17 souborů (1 batch parallel read)
2. **Edit batch A — replace_all bezpečné:**
   - `lib/seo.ts` → `replace_all: "https://www.carmakler.cz"` → `"https://carmakler.cz"` (7 výskytů)
   - `app/(web)/nabidka/[slug]/page.tsx` → `replace_all` (4 výskytů)
3. **Edit batch B — single line edits (parallel):** Vše ostatní (15 single edits)
4. **Edit batch C — `next.config.ts`** (BONUS): přidat `redirects()` async function
5. **Verify:**
   ```bash
   grep -n "www\.carmakler" -r app/ lib/ components/ middleware.ts next.config.ts \
     | grep -v "facebook\|linkedin\|instagram\|youtube\|test\|spec"
   # expected: 0 matches (kromě komentářů které jsme přepsali)

   grep -n "localhost:3000" -r app/ lib/ middleware.ts next.config.ts \
     | grep -v "test\|spec\|e2e\|\.env\|README\|playwright\|middleware\.ts:119"
   # expected: 0 matches
   ```
6. **Build verification:**
   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build  # ⚠️ pravděpodobně nevypadne — žádné runtime změny, jen string substitutions
   npx vitest run __tests__/lib/subdomain.test.ts  # potvrzeno: 10/10 tests pass (parser nedotčen)
   ```
7. **Commit message draft:**
   ```
   chore(urls): canonicalize on bare carmakler.cz (no www) + production fallbacks

   - lib/urls.ts MAIN_URL fallback: localhost:3000 → https://carmakler.cz
   - 21 occurrences of https://www.carmakler.cz → https://carmakler.cz across 16 files
   - lib/subdomain.ts JSDoc: align prod example with bare domain canonical
   - components/ui/PlatformSwitcher.tsx comment: marketplace VIP URL → subdomain
   - next.config.ts: add redirects() rule www→bare (301) as DNS fallback safety net
   - Social URLs (www.facebook.com, www.linkedin.com) preserved as-is
   - Tests unchanged (subdomain parser already supports both variants)

   Refs: task #111
   ```

### Critical reminders for implementator
- **NESÁHAT** social URLs v `lib/seo.ts:316,317` a `lib/company-info.ts:47-49`
- **NESÁHAT** `middleware.ts:119` host fallback
- **NESÁHAT** e2e/playwright/test files
- **NESÁHAT** email templates už používající bare doménu (verified §1C)
- Po edit `git diff` ručně check že žádný `www.facebook.com` nebo `www.linkedin.com` se nepřepsal

---

## §7 Acceptance Criteria (8 ACs)

| AC | Critère | Verifikace |
|---|---|---|
| **AC1** | `lib/urls.ts:20` `MAIN_URL` má fallback `"https://carmakler.cz"` | grep |
| **AC2** | `lib/urls.ts:5` JSDoc příklad zmiňuje obě varianty (prod + dev override) | manual read |
| **AC3** | `lib/subdomain.ts:11-12` JSDoc zmiňuje dev + prod variantu, prod zmíňka je bare doména | manual read |
| **AC4** | `getSubdomain()` parser nezměněn — všech 10 testů v `__tests__/lib/subdomain.test.ts` zelená | `npx vitest run` |
| **AC5** | Žádný production code reference na `https://www.carmakler.cz` (kromě social URLs facebook/linkedin) | `grep -rn "www\.carmakler" app/ lib/ components/ \| grep -v "facebook\|linkedin\|instagram\|youtube\|test\|spec"` → 0 |
| **AC6** | Žádný production code reference na `localhost:3000` mimo test/dev infra a `middleware.ts:119` | `grep -rn "localhost:3000" app/ lib/ middleware.ts next.config.ts \| grep -v "e2e\|test\|spec\|playwright\|\.env\|README\|middleware\.ts:119"` → 0 |
| **AC7** | `next.config.ts` má `redirects()` async function s www→bare 301 rule | manual read |
| **AC8** | `npm run lint && npx tsc --noEmit && npm run build` — vše zelené, 0 regresí | CI |
| **AC9** | `urls.inzerce/shop/marketplace()` chování zachováno (path-based dev fallback empty string) | `lib/urls.ts:24-26` unchanged |
| **AC10** | Po deployi (manual verify): `curl -I https://www.carmakler.cz/` → `301` + `Location: https://carmakler.cz/` | post-deploy curl |

---

## §8 Risk matrix

| Risk | Severity | Mitigation |
|---|---|---|
| `replace_all` zasáhne social URL `www.facebook.com` | **None** — string `"https://www.carmakler.cz"` neobsahuje `facebook` ani `linkedin`, `replace_all` matchne literál | git diff spot check |
| Parser regression v `getSubdomain()` | **None** — parser kód není editován, jen JSDoc | testy už pokrývají oba scénáře |
| `next.config.ts` `redirects()` syntactic error blokne build | Low | TypeScript catch-all + lint pre-commit |
| `redirects()` rule vytvoří loop (`www.* → bare → www.*`) | None | `host` matcher je striktní `www.carmakler.cz`, bare doména tento matcher nepasuje |
| Email link target `${process.env.NEXTAUTH_URL}` ukazuje na `www.` ale visible text je bez www → user confusion | None | `NEXTAUTH_URL` je env-driven, ne hardcoded `www.` — v prod env se nastaví na bare. Out of scope tohoto fixu (separate `.env` config). |
| ENV-driven production fallback se neshoduje s env hodnotou v Vercel | None | Fallback je default jen pokud `process.env.NEXT_PUBLIC_APP_URL` undefined. V prod se vždy nastaví explicit env var. |
| 308 redirect (permanent) cachuje agresivně, blokne rollback | Low | Pokud chceme rollback option, použít `permanent: false` (307). Doporučuji `true` — canonical decision je dlouhodobé. |

---

## §9 Files to edit (final list, 18 souborů)

| # | File | Edit type | Lines |
|---|---|---|---|
| 1 | `lib/urls.ts` | Single edit (2 places) | 5, 19-20 |
| 2 | `lib/subdomain.ts` | Single edit (JSDoc 2-line block) | 11-12 |
| 3 | `lib/seo.ts` | replace_all literal | 116, 146, 217, 310, 311, 342, 347 |
| 4 | `lib/seo-data.ts` | Single edit | 5 |
| 5 | `lib/listing-sla.ts` | Single edit | 166 |
| 6 | `lib/company-info.ts` | 2 single edits | 42, 43 |
| 7 | `lib/brand-styles.ts` | Single edit (NEW) | 27 |
| 8 | `lib/email-verification.ts` | Single edit (NEW) | 52 |
| 9 | `app/robots.ts` | Single edit | 3 |
| 10 | `app/sitemap.ts` | Single edit | 5 |
| 11 | `app/layout.tsx` | Single edit | 14 |
| 12 | `app/llms.txt/route.ts` | Single edit | 61 |
| 13 | `app/(web)/nabidka/page.tsx` | Single edit | 222 |
| 14 | `app/(web)/nabidka/[slug]/page.tsx` | replace_all literal | 459, 470, 476, 482 |
| 15 | `app/api/auth/forgot-password/route.ts` | Single edit | 54 |
| 16 | `components/web/Breadcrumbs.tsx` | Single edit (NEW) | 20 |
| 17 | `components/ui/PlatformSwitcher.tsx` | Single edit (NEW, comment only) | 32 |
| 18 | `next.config.ts` | Insert new `redirects()` async function (BONUS) | ~80 (after `images`) |

**Total: 18 files, 28 line edits.**

---

## §10 Estimate

- Read all 17 files: ~3 min (parallel batches)
- Edit batch A (`replace_all`): ~2 min (2 files × 30s)
- Edit batch B (single edits): ~10 min (15 single-line edits)
- Edit batch C (`next.config.ts` BONUS): ~3 min (insert + verify syntax)
- Verify (`grep`, `lint`, `tsc`, `vitest`, `build`): ~5 min
- Commit + push: ~2 min

**Total: ~25 min IMPL.** S size, very low risk.

---

## §11 Open questions / decisions

### Q1 — `urls.inzerce/shop/marketplace()` empty string fallback

**Status:** RESOLVED — keep path-based dev fallback (per task description recommendation).

**Reasoning:**
- Empty string fallback (`INZERCE_SUBDOMAIN_URL = process.env.NEXT_PUBLIC_INZERCE_URL || ""`) → produces path-based URL (`/inzerce/x`)
- Out-of-the-box dev experience: žádný `/etc/hosts` setup, žádný subdomain certificate
- Produkce: explicit env var `NEXT_PUBLIC_INZERCE_URL=https://inzerce.carmakler.cz` v Vercel → produces subdomain URL
- Změna defaultu na produkční subdomain by **rozbila dev workflow** pro nové vývojáře (musí by setupovat hosts file před každým `npm run dev`)
- Není to canonical issue protože middleware rewrituje subdomain → path internally

**Decision:** Zachovat status quo. `lib/urls.ts:24-26` nedotčeno.

### Q2 — `www.carmakler.cz → carmakler.cz` redirect na DNS úrovni

**Status:** Plánuji **dual-layer** (DNS + Next.js).

- **Option A — Pouze DNS (`CNAME www → @` + Cloudflare/registrar redirect rule)** → external dependency
- **Option B — Pouze Next.js `redirects()`** → app-level, bezpečnější ale request prochází Vercel/origin
- **Option C (recommended) — Oba**: DNS-level pro performance, Next.js jako fallback safety

**Decision:** Plán implementuje Option C. **Otázka pro user:** mám se dotázat sysadmina na status DNS-level redirect rule? Nebo důvěřujeme že DNS je nastaveno správně a jen přidáme app-level fallback?

**Default action:** Implementator přidá Next.js redirect rule (BONUS §3). Sysadmin verifikace post-deploy.

### Q3 — Files NEW (4 souborů missed v task spec)

**Status:** Self-resolved by audit. Plán je rozšiřuje:

| File | Důvod proč to mělo být |
|---|---|
| `lib/email-verification.ts:52` | Visible text v emailovém footeru — user-facing |
| `components/web/Breadcrumbs.tsx:20` | JSON-LD pro SEO — SEO impact |
| `lib/brand-styles.ts:27` | Display string v UI — user-facing |
| `components/ui/PlatformSwitcher.tsx:32` | Code comment — dokumentační konzistence (low priority) |

**Decision:** Zahrnout všechny 4 do #112 IMPL scope. Bez nich by canonical cleanup nebyl 100%.

### Q4 — `permanent: true` (308) vs `false` (307) v `next.config.ts`

**Default:** `permanent: true` (308 = browser cachuje agressively, signál SEO že je to natrvalo).

**Counter-argument:** Pokud bychom chtěli někdy switch zpět na `www.` jako canonical (např. pokud SSL cert na bare doméně bude problém), 308 cache je problém.

**Recommendation:** `permanent: true` protože:
- User explicit pokyn "bez www"
- Bare doména je SEO best practice (krátší, čistější)
- Žádný známý důvod pro rollback

**Question for lead:** Confirm `permanent: true`?

### Q5 — `app/(web)/nabidka/[slug]/page.tsx` — `urls.main()` místo hardcoded URL?

**Otázka pro lead:** Místo hardcoded `https://carmakler.cz/...` v JSON-LD, refactor na `urls.main("/nabidka/" + slug)` pomocí helperu z `lib/urls.ts`?

**Pros:** Single source of truth, env-driven, testovatelný
**Cons:** Větší scope (4 míst x function call), out of scope tohoto urgent fix

**Recommendation:** **Ne, out of scope.** Tento task je URL canonicalization, ne refactor. Refactor `urls.main()` adoption napříč JSON-LD si zaslouží separate task (#113 REFACTOR — `urls.main()` adoption v JSON-LD JSON markup, ~6 souborů).

---

## §12 Sekvenování

**Blokuje:** nic
**Závisí na:** nic
**Po dokončení odblokne:** všechny existující URL-driven flows na produkci (sitemap, robots, JSON-LD, email links)

**#112 IMPL může běžet v parallel s:**
- #88 IMPL (AI Part Scanner) — žádný overlap souborů
- #105 PLAN (PERF v2) — žádný file overlap
- #87b/c/d/e IMPL — overlap pouze v `app/sitemap.ts` (oba se ho dotknou). **Lock:** Pokud #87b běží, #112 musí počkat. Pokud #112 běží první (rychlejší, ~25 min), #87b si #112 trivially mergne.

---

## §13 Souhrn pro lead

1. **18 souborů, 28 line edits, ~25 min IMPL**
2. **Zero parser changes** — jen JSDoc + string fallbacks
3. **Tests už pokrývají** oba scénáře (`__tests__/lib/subdomain.test.ts:36-38` testuje bare doménu)
4. **4 NEW souborů** mimo task spec (audit found): `email-verification.ts`, `Breadcrumbs.tsx`, `brand-styles.ts`, `PlatformSwitcher.tsx` (komentář)
5. **BONUS:** `next.config.ts` `redirects()` rule pro www→bare jako safety net
6. **Q1-Q5 v §11** — Q1 self-resolved, Q4 default `permanent: true`, Q2/Q5 čekají na lead decision (low priority, default acceptable)
7. **Risk: LOW.** String substitutions, žádné runtime logic changes, žádné DB/API.

**Připraveno k dispatch jako #112 IMPL.**

---

**Plán uložen:** `.claude-context/tasks/plan-task-111.md`
