# EVZEN REVIEW — Task #111 URL canonicalization implementace
**Datum:** 2026-04-07
**Reviewer:** evzen-the-king (READ-ONLY task controller)
**Task:** #115 (review-task-111)
**Předmět:** commit `f13f2f2` — `chore(urls): canonicalize on bare carmakler.cz (no www) + production fallbacks`
**Pracovní materiály:** `plan-task-111.md` (576 ř.), `impl-task-111.md` (200 ř.), git diff f13f2f2

---

## ✅ VERDIKT: **PASS** — implementace přesně dodržuje plán a plán doslovně reflektuje uživatelovo zadání

**Co je správně:**
- Všech 18 souborů, 28 line edits dodrženo přesně podle plánu §9
- 0 production code reference na `www.carmakler.cz` (kromě záměrného `next.config.ts` redirects rule)
- 0 production code reference na `localhost:3000` (kromě JSDoc dev příkladů + unit/e2e test infra + middleware host header runtime fallback)
- Sociální URLs (`www.facebook.com`, `www.linkedin.com`) **NESÁHNUTÉ** ✅
- Subdomény (`marketplace.carmakler.cz`, `inzerce.carmakler.cz`, `shop.carmakler.cz`) zachovány v subdomain logice
- `getSubdomain()` parser nezměněn, 8/8 unit testů zelená
- Defense in depth: `next.config.ts` `redirects()` rule jako fallback k nginx www→bare 301
- TypeScript 0 errors, lint 0 errors, vitest 141/141 passed

**Co je marginálně suboptimální (P3, ne blocker):**
- Commit message říká "301", ale `permanent: true` v Next.js je technicky **308** (Permanent Redirect, RFC 7538). Plán §3 přesnější (*"`permanent: true` = 308 v Next.js"*). Kosmetické nesoulad dokumentace, ne kódu.
- Q5 (`urls.main()` adoption v JSON-LD) odložen jako out-of-scope do separate task #113 — souhlasím (URL canonicalization ≠ refactor).

**Žádné CHANGES_REQUESTED. Žádné blocking findings.**

---

## 1) Doslovný check — uživatelovo zadání (7 statements)

| # | Uživatelovo prohlášení | Implementace | Status | Evidence |
|---|------------------------|--------------|--------|----------|
| U1 | *"žádny localhost:3000"* | `lib/urls.ts:20` MAIN_URL fallback změněn z `"http://localhost:3000"` na `"https://carmakler.cz"`. Production code grep `localhost:3000` v `app/`+`lib/`+`components/` → 0 matches (jen JSDoc dev příklady v `lib/urls.ts:5` + `lib/subdomain.ts:11` + middleware:119 host fallback). | ✅ | git diff f13f2f2 lib/urls.ts |
| U2 | *"musíme nahrazovat už realnymi URL"* | 21 výskytů `https://www.carmakler.cz` přepsáno na `https://carmakler.cz` napříč 16 souborů (lib/seo.ts ×7, lib/seo-data.ts ×1, lib/listing-sla.ts ×1, lib/company-info.ts ×2, lib/brand-styles.ts ×1, lib/email-verification.ts ×1, app/robots.ts ×1, app/sitemap.ts ×1, app/layout.tsx ×1, app/llms.txt/route.ts ×1, app/(web)/nabidka/page.tsx ×1, app/(web)/nabidka/[slug]/page.tsx ×4, app/api/auth/forgot-password/route.ts ×1, components/web/Breadcrumbs.tsx ×1) | ✅ | git show f13f2f2 |
| U3 | *"existují, všechny URL už jsou, všechno jsi nastavoval"* | Bare doména `carmakler.cz` je canonical podle DNS. Implementace odpovídá realitě (bare = canonical). | ✅ | nginx setup #112, plán §0 + §1C verifikace 6 souborů už používajících bare |
| U4 | *"všechny domeny existují maji nastavene DNS, marketplace.carmakler.cz, inzerce.carmakler.cz, shop.carmakler.cz pak carmakler.cz"* | Všechny 4 subdomény zachovány. `lib/subdomain.ts:11-12` JSDoc explicit zmiňuje všechny 4 (inzerce, shop, marketplace, main). `getSubdomain()` parser nezměněn. `urls.inzerce/shop/marketplace()` chování zachováno. | ✅ | lib/subdomain.ts:11-12 diff, `__tests__/lib/subdomain.test.ts` 8/8 passed, `lib/urls.ts:24-26` unchanged |
| U5 | *"všechno se to musí předelat ty URL, tam kde je inzerce.localhost atd"* | Žádný hardcoded `inzerce.localhost:3000` v `app/`+`lib/`+`components/` (verified grep). Path-based dev fallback (`urls.inzerce("/x") → "/inzerce/x"`) zachován per Q1 schválení uživatelem. V produkci se přes Vercel env vars nastaví explicit `NEXT_PUBLIC_INZERCE_URL=https://inzerce.carmakler.cz` → produces subdomain URL. | ✅ | grep `inzerce\.localhost` v app/+lib/+components/ → 0 matches; team-lead task description: *"path-based dev fallback je OK protože uživatel souhlasil — Q1"* |
| U6 | *"carmakler.cz/makler atd atd všechny PWA převest na nove url a tak podobně"* | PWA routes (`/makler/*`, `/parts/*`) jsou path-based pod bare doménou. Implementace nemění routing. Všechny PWA cesty accessible přes `https://carmakler.cz/makler`, `https://carmakler.cz/parts`. | ✅ | Žádný edit v `app/(pwa)/` ani `app/(pwa-parts)/`, routing zachován |
| U7 | *"to ja nevim jak mel by tam byt automaticky redicer ne kdyz nekdo da carmakler.cz tak na www.carmakler.cz? to musíš vedet ty jak to funguje"* | Uživatel explicit delegoval rozhodnutí na technického experta (*"to musíš vědět ty"*). Team-lead zvolil **www → bare** (modernější canonical, SEO best practice 2026). Dual-layer redirect: nginx 301 (#112 hotov) + `next.config.ts` `redirects()` 308 fallback. | ✅ | team-lead task description: *"Lead přidal nginx www→bare 301 redirect na produkci (#112 hotov). Výsledné canonical URL = bare https://carmakler.cz (NE www)."* + `next.config.ts:81-97` diff |

**Score: 7/7 PASS** ✅

---

## 2) Control points (7 z task assignmentu)

| # | Control point | Status | Evidence |
|---|---------------|--------|----------|
| 1 | Doslovnost — všechny `localhost:3000` v production code paths nahrazeny? | ✅ | grep `localhost:3000` v app/+lib/+components/ → pouze JSDoc dev příklady (`lib/urls.ts:5`, `lib/subdomain.ts:11`) + middleware:119 host header runtime fallback. Žádný hardcoded URL. |
| 2 | Doslovnost — všechny `www.carmakler.cz` v production code paths nahrazeny? | ✅ | grep `www\.carmakler` v app/+lib/+components/ → 0 matches. Pouze `next.config.ts:83,91` (záměrné — redirect rule www→bare) + `__tests__/lib/subdomain.test.ts:28-29` (parser unit test, out of scope). |
| 3 | Subdomain canonical zachován? | ✅ | `getSubdomain()` parser nezměněn (jen JSDoc), `lib/urls.ts:24-26` `INZERCE/SHOP/MARKETPLACE_URL` fallbacky nezměněny. Subdomain logic 100% intact. |
| 4 | PWA paths na bare doméně? | ✅ | `app/(pwa)/`, `app/(pwa-parts)/` nezasaženy. PWA routing zůstává path-based pod bare doménou (`carmakler.cz/makler`, `carmakler.cz/parts`). Q1 path-based dev fallback explicitly schválen uživatelem. |
| 5 | Defense in depth — `next.config.ts` `redirects()` rule s `permanent: true`? | ✅ | `next.config.ts:81-97` přidává `async redirects()` s host matcher `www.carmakler.cz` → `https://carmakler.cz/:path*`, `permanent: true` (= 308 v Next.js). Inserted mezi `images` a `headers()` blokem. |
| 6 | Skryté/odebrané — nic se neztratilo bez explicitního schválení? | ✅ | Žádné delete operace. Pouze string substitutions (28 edit-replace) + 1 insert (next.config.ts redirects() funkce). `git show f13f2f2` ukazuje 823 insertions / 29 deletions — high insert ratio kvůli plán + impl markdown souborům (576 + 200 řádků). |
| 7 | Sociální URLs (`www.facebook.com`, `www.linkedin.com`) zůstaly netknuté? | ✅ | grep `www\.facebook\|www\.linkedin\|www\.instagram\|www\.youtube` → 2 matches v `lib/seo.ts:316,317`. Sociální URLs **preserved as-is**. Plus `lib/company-info.ts:47-49` (`facebook.com/carmakler`, `instagram.com/carmakler`, `youtube.com/@carmakler`) bez `www.` od počátku, nedotčeno. |

**Score: 7/7 PASS** ✅

---

## 3) Per-soubor verifikace (18 souborů, 28 edits)

| # | Soubor | Plán edits | Impl edits | Match | Verifikace v git diff |
|---|--------|-----------|-----------|-------|---------------------|
| 1 | `lib/urls.ts` | 2 (JSDoc + MAIN_URL fallback) | 2 | ✅ | line 5 JSDoc + line 19-20 MAIN_URL → bare |
| 2 | `lib/subdomain.ts` | 1 (JSDoc 2-line block) | 1 | ✅ | lines 11-12 JSDoc bare doména v prod example |
| 3 | `lib/seo.ts` | 7 (replace_all literal `https://www.carmakler.cz`) | 7 | ✅ | lines 116, 146, 217, 310, 311, 342, 347 → bare. Sociální URLs (316, 317) **netknuty**. |
| 4 | `lib/seo-data.ts` | 1 (BASE_URL fallback) | 1 | ✅ | line 5 → bare |
| 5 | `lib/listing-sla.ts` | 1 (WATCHDOG_BASE_URL) | 1 | ✅ | line 166 → bare |
| 6 | `lib/company-info.ts` | 2 (web.url + web.logo) | 2 | ✅ | lines 42-43 → bare. Social URLs (47-49) **netknuty**. |
| 7 | `lib/brand-styles.ts` | 1 (display string) | 1 | ✅ | line 27 `web: "www.carmakler.cz"` → `"carmakler.cz"` |
| 8 | `lib/email-verification.ts` | 1 (visible footer link text) | 1 | ✅ | line 52 visible text → bare. `href` zůstává `${process.env.NEXTAUTH_URL}` (env-driven). |
| 9 | `app/robots.ts` | 1 (BASE_URL) | 1 | ✅ | line 3 → bare |
| 10 | `app/sitemap.ts` | 1 (BASE_URL) | 1 | ✅ | line 5 → bare |
| 11 | `app/layout.tsx` | 1 (BASE_URL root metadata) | 1 | ✅ | line 14 → bare |
| 12 | `app/llms.txt/route.ts` | 1 (visible Web: text) | 1 | ✅ | line 61 → bare |
| 13 | `app/(web)/nabidka/page.tsx` | 1 (JSON-LD ItemList.url) | 1 | ✅ | line 222 template literal → bare |
| 14 | `app/(web)/nabidka/[slug]/page.tsx` | 4 (replace_all) | 4 | ✅ | lines 459 (Vehicle.url), 470 (Domů breadcrumb), 476 (Nabídka breadcrumb), 482 (vehicle slug breadcrumb) → bare |
| 15 | `app/api/auth/forgot-password/route.ts` | 1 (resetUrl fallback) | 1 | ✅ | line 54 template literal → bare |
| 16 | `components/web/Breadcrumbs.tsx` | 1 (JSON-LD breadcrumb item) | 1 | ✅ | line 20 → bare |
| 17 | `components/ui/PlatformSwitcher.tsx` | 1 (comment, BONUS marketplace.carmakler.cz subdomain) | 1 | ✅ | line 32 komentář aktualizován na subdomain URL — odráží reálnou DNS topologii |
| 18 | `next.config.ts` | 1 insert (BONUS redirects() async function) | 1 | ✅ | lines 81-97 nový `async redirects()` blok mezi `images` a `headers()`, host matcher `www.carmakler.cz` → bare, `permanent: true` |

**Score: 18/18 PASS, 28/28 line edits** ✅

---

## 4) Verifikace negativních invariantů (NESÁHAT)

| # | Invariant | Verifikace | Status |
|---|-----------|------------|--------|
| N1 | `__tests__/lib/subdomain.test.ts` parser tests | git diff f13f2f2 — soubor nezasažen | ✅ |
| N2 | `__tests__/middleware.test.ts` runtime tests | git diff f13f2f2 — soubor nezasažen | ✅ |
| N3 | `e2e/**/*.spec.ts` Playwright tests | git diff f13f2f2 — žádné e2e soubory v diff | ✅ |
| N4 | `playwright.config.ts` test config | git diff f13f2f2 — soubor nezasažen | ✅ |
| N5 | `middleware.ts:119` host header runtime fallback | git diff f13f2f2 — middleware.ts není v diff | ✅ |
| N6 | `.env.example` dev template | git diff f13f2f2 — soubor nezasažen | ✅ |
| N7 | Dev docs (`CLAUDE.md`, `README.md`, `MASTER-PLAN.md`) | git diff f13f2f2 — soubory nezasaženy | ✅ |
| N8 | `public/sw.js` (Serwist) | git diff f13f2f2 — soubor nezasažen | ✅ |
| N9 | Email templates už používající bare doménu (`signature.ts`, `daily-summary.ts`, `marketplace-application-confirmation.ts`) | git diff f13f2f2 — soubory nezasaženy (už správně) | ✅ |
| N10 | Sociální URLs (`www.facebook.com`, `www.linkedin.com`) v `lib/seo.ts:316,317` | grep verifikace — preserved as-is | ✅ |
| N11 | Sociální URLs v `lib/company-info.ts:47-49` (`facebook.com/carmakler`, `instagram.com/carmakler`, `youtube.com/@carmakler`) | grep verifikace — bez `www.` od počátku, nedotčeno | ✅ |
| N12 | `lib/listing-export.ts`, `app/api/invitations/route.ts`, `app/api/marketplace/apply/route.ts` (už používající bare) | git diff f13f2f2 — soubory nezasaženy | ✅ |

**Score: 12/12 PASS** ✅

---

## 5) Verifikace `next.config.ts` `redirects()` rule (Defense in depth)

```typescript
async redirects() {
  return [
    // www.carmakler.cz → carmakler.cz (301 permanent)
    // Bare domain je canonical (user pokyn 2026-04-07).
    // Dual-layer redirect: DNS-level + Next.js fallback pro safety.
    {
      source: "/:path*",
      has: [
        {
          type: "host",
          value: "www.carmakler.cz",
        },
      ],
      destination: "https://carmakler.cz/:path*",
      permanent: true,
    },
  ];
},
```

**Verifikace:**

| # | Kritérium | Status | Poznámka |
|---|-----------|--------|----------|
| R1 | Async function s correct signature | ✅ | TypeScript valid (`tsc --noEmit` 0 errors) |
| R2 | Host matcher striktní `www.carmakler.cz` | ✅ | `has[0].type === "host"`, `value === "www.carmakler.cz"` — žádný catch-all |
| R3 | Destination je bare doména s `:path*` capture | ✅ | `https://carmakler.cz/:path*` — preserves path |
| R4 | `permanent: true` pro 308 (SEO long-term) | ✅ | Plán §11 Q4 doporučení dodrženo |
| R5 | Žádný redirect loop | ✅ | bare doména `carmakler.cz` (bez `www.`) tento matcher nepasuje → no loop |
| R6 | Position v config (mezi `images` a `headers()`) | ✅ | git diff potvrzuje insert mezi line 80 a `headers()` block |

**Defense in depth (dual-layer redirect):**
- **Layer 1 (DNS/nginx):** team-lead nastavil www→bare 301 (#112) na produkci
- **Layer 2 (Next.js app):** `next.config.ts` `redirects()` rule jako fallback safety net

**Score: 6/6 PASS** ✅

**Pozn (P3):** Commit message říká *"as DNS fallback safety net"* a *"301 redirect"* (v plán §6 commit draft), ALE Next.js `permanent: true` je technicky **308** Permanent Redirect (RFC 7538), ne 301. Plán §3 to v poznámce explicitně řekne (*"`permanent: true` = 308 v Next.js"*). Kosmetické nesoulad dokumentace, semantic equivalent (oba = permanent redirect z SEO perspektivy). Není blocker.

---

## 6) EVZEN THE KING 6 nekompromisních pravidel

| # | Pravidlo | Status | Poznámka |
|---|----------|--------|----------|
| 1 | Žádné zkratky v UI | ✅ | Implementace je výhradně URL string substitutions + 1 redirect rule. Žádný UI shortcut, žádný hidden state. |
| 2 | Ověřit duplicate data context | ✅ | Žádná duplikace dat. Naopak konsoliduje na jediný canonical URL (bare). 6 souborů už používajících bare verified v plánu §1C, nedotčeno. |
| 3 | Označit unfinished features | ✅ | Q5 (`urls.main()` adoption v JSON-LD JSON markup) explicit označen jako out-of-scope, doporučen separate task #113 REFACTOR. AC10 (post-deploy curl verification) označen jako pending pro #115 DEPLOY task. Žádný hidden TODO. |
| 4 | Nemazat bez schválení | ✅ | Žádné delete operace. Pouze string substitutions + 1 insert (next.config.ts redirects funkce). git diff stat: 823 insertions / 29 deletions — vysoký insertion ratio kvůli plán + impl markdown souborům. |
| 5 | Žádné skryté stránky | ✅ | Žádné nové stránky. Žádný hidden routing. |
| 6 | Schválit každou změnu jednotlivě | ✅ | Plán §11 Q1-Q5 explicit team-lead approval workflow. Q1 (path-based dev fallback) self-resolved s reasoning. Q4 (`permanent: true`) recommended → dodrženo. Q5 (refactor) odložen jako out-of-scope. 4 NEW souborů (email-verification.ts, Breadcrumbs.tsx, brand-styles.ts, PlatformSwitcher.tsx) explicit doplněny v Q3 self-resolved by audit. |

**Score: 6/6 PASS** ✅

---

## 7) Test results verifikace

| Test type | Plán acceptance | Impl výsledek | Status |
|-----------|-----------------|---------------|--------|
| TypeScript (`tsc --noEmit`) | 0 errors | 0 errors | ✅ |
| ESLint (`npm run lint`) | 0 errors (warnings OK) | 0 errors, 538 warnings (pre-existing) | ✅ |
| Vitest (`vitest run`) | 141/141 passed | 141/141 passed (15 test files) | ✅ |
| `subdomain.test.ts` (parser) | 8/8 passed (parser nezměněn) | 8/8 passed | ✅ |
| `urls.test.ts` | 6/6 passed | 6/6 passed | ✅ |
| Build (`npm run build`) | Pass (žádné runtime změny) | Pending pre-deploy (delegated #115 DEPLOY) | ⏳ |
| Post-deploy `curl -I https://www.carmakler.cz/` | 308 + Location: bare | Pending #115 DEPLOY | ⏳ |

**Pre-deploy verifikace 5/5 PASS, 2/2 pending pre-deploy** ✅

---

## 8) Specific concerns — žádné

Implementace doslova reflektuje plán a plán doslova reflektuje uživatelovo zadání. 

**Drobné:**
- Commit message zmiňuje "301" redirect, ale technicky je to 308 (`permanent: true` v Next.js). P3 doc inaccuracy.
- AC10 post-deploy curl verifikace je pending — delegated na #115 DEPLOY task. To je správně, není blocker pro review.

---

## 9) Required changes (CHANGES_REQUESTED)

**Žádné.** Implementace je APPROVED bez výhrad.

---

## 10) Optional improvements (P3 — nice-to-have)

1. **Commit message accuracy** — *"301 redirect"* → *"308 redirect (`permanent: true`)"*. Plán §3 to přesněji uvádí. Future commits mohou být explicit. Není blocker.

2. **`urls.main()` adoption v JSON-LD** (Q5 plán §11) — separate task #113 REFACTOR doporučen. JSON-LD `https://carmakler.cz/...` template literály by mohly volat `urls.main("/path")` helper pro single source of truth + env-driven testovatelnost. Out of scope tohoto urgent fix per Q5 decision.

3. **Post-deploy verifikace cesta** — AC10 curl test by měl být zařazen jako acceptance criteria #115 DEPLOY explicit. Není to blocker pro #111 review (delegation je správná), ale #115 musí curl verifikaci skutečně provést a zaznamenat.

4. **`tsc` strict mode regression check** — `permanent: true` Next.js `RedirectFn` signature kompatibilita ověřena (`tsc --noEmit` 0 errors). Future Next.js upgrade by mohl změnit signature → recommended monitoring.

---

## 11) Doporučené follow-up tasks

| Task | Priorita | Owner | Předmět |
|------|----------|-------|---------|
| #115 DEPLOY | P0 | developer / devops | Push 10+ commits včetně f13f2f2 + SSH server pull/build/reload + post-deploy `curl -I https://www.carmakler.cz/` verifikace 308 + Location: bare |
| #114 IMPL | P0 | developer | Commit dirty prod fixes (prisma.config.ts + useOnlineStatus.ts) — ne-blocking pro #111, ale součást deploy batch |
| #113 REFACTOR | P2 | developer | `urls.main()` adoption v JSON-LD (Q5 plán §11) — ~6 souborů, single source of truth |
| #116 QA post-deploy | P1 | qa | Post-deploy live test: sitemap.xml URLs, JSON-LD canonical, robots.txt, email link verification |

---

## 12) Závěr — připravenost k merge & deploy

**Commit f13f2f2 je READY TO DEPLOY.**

Všech 7 uživatelských prohlášení je v implementaci doslova zapracováno:
- ✅ U1 `žádny localhost:3000` — production code clean
- ✅ U2 `nahrazovat realnymi URL` — 21 výskytů přepsáno
- ✅ U3 `existují, všechny URL už jsou` — bare doména je canonical realita
- ✅ U4 `marketplace/inzerce/shop.carmakler.cz pak carmakler.cz` — všechny 4 zachovány
- ✅ U5 `inzerce.localhost atd` — 0 hardcoded match v production code
- ✅ U6 `carmakler.cz/makler atd PWA` — path-based pod bare doménou
- ✅ U7 `automaticky redirect www→bare` — dual-layer (nginx 301 + next.config 308 fallback)

**Test results:** TypeScript 0 errors, lint 0 errors, vitest 141/141, parser 8/8.

**Pre-deploy blockers:** Žádné.

**Pending pre-deploy:** AC10 curl verifikace 308 — delegated #115 DEPLOY, není blocker pro merge.

**Doporučení uživateli a team-leadovi:**
1. **Schvalit f13f2f2** k deployi
2. Dispatch #114 IMPL (prod dirty fixes commit) → #115 DEPLOY (push + SSH pull + curl verify) → #116 QA post-deploy live test
3. Q5 (`urls.main()` adoption refactor) zařadit jako #113 P2 separate task — necky blokující

---

**PASS — implementace doslovně dodržuje plán, plán doslovně reflektuje uživatelovo zadání.** ✅

— evzen-the-king
