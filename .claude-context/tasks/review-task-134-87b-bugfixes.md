---
name: EVZEN REVIEW #134 — #132 87b runtime bugfixes (commit 3666bad)
description: Doslovná verifikace, že 2 P2 runtime bugy z test-chrome #130 jsou opraveny Strategií A přesně dle plan-task-131. Read-only verifikace kódu, plan compliance a procedurálních lead-pravidel.
type: review
task_id: 134
queue_id: 134
parent: plan-task-131-87b-bugs.md
related_impl: impl-task-132-87b-bugfixes.md
related_qa: qa-task-133-87b-bugfixes.md
related_test: chrome-test-task-130-87b.md
related_review: review-task-129-87b-evzen.md
verdict: ✅ APPROVED (s 1 P2 procedurálním finding)
commit: 3666bad
branch: main
date: 2026-04-07
---

# EVZEN REVIEW #134 — #132 87b runtime bugfixes (commit `3666bad`)

> **Mandát:** Read-only doslovná verifikace, že commit `3666bad` opravuje 2 runtime bugy z test-chrome #130 přesně podle Strategie A z plan-task-131. Žádný vlastní fix, žádný refactor návrh — jen literal compliance check + escalation procedurálních deviací.

---

## 0 — TL;DR

| | |
|---|---|
| **Bug #1 (diakritika 301)** | ✅ FIXED — middleware-level redirect ve všech 3 vrstvách (brand/model/rok) |
| **Bug #2 (year 404)** | ✅ FIXED — `dynamicParams=false` + expanze SSG na 432 valid years |
| **Strategie A compliance** | ✅ DOSLOVNĚ — žádná deviace v technickém řešení |
| **Q1-Q4 lead overrides** | ✅ Všechny 4 aplikovány doslovně |
| **AC1-AC15** | ✅ 15/15 PASS (curl + build + lint + tsc + vitest) |
| **AC16 (test-chrome retest)** | ⏳ Deferred post-deploy (mimo scope #132) |
| **6 EVZEN pravidel** | ✅ 5/6 čistě + 1 procedurální finding |
| **6 CarMakler pravidel** | ✅ 6/6 (bugfix scope, žádné nové features) |
| **Verdict** | ✅ **APPROVED** |
| **P2 finding** | Implementator nespustil **STOP & ESCALATE** rituál i přes literal požadavek lead-decision §9 (SSG 432 < 800-1100 narrowed range). Není to technický bug — ale je to procedurální skip. Detail v §6 níže. |

---

## 1 — Mandát ověření (z #134 dispatch zprávy)

Team-lead explicitně požaduje ověřit:

1. ✅ **BUG 1 vyřešen** (diakritika → 301 přes middleware)
2. ✅ **BUG 2 vyřešen** (neplatný rok → 404 přes static params match)
3. ✅ **Oba bugy opraveny STRATEGIÍ A** (ne nějakou jinou cestou)
4. ⚠️ **Žádná deviace od plan-task-131** — viz §6 P2 finding (procedurální, ne technická)
5. ✅ **Žádné skryté hacks / workarounds / TODOs**

Verifikace přes literal čtení 5 changed files + middleware.ts integration + grep pro dead code references + cross-check proti plan §4 + §6 ACs.

---

## 2 — Doslovná verifikace Strategie A

### 2.1 — Soubor 1/5: `middleware.ts` (+44 řádků)

**Plan §4 Soubor 1 specifikace:**
```ts
import { aliasFor } from "@/lib/seo/slugify";
const PARTS_BRAND_ROUTE = /^\/dily\/znacka\/([^/]+)(?:\/([^/]+)(?:\/([^/]+))?)?\/?$/;
function getPartsRouteDiakritikaRedirect(pathname: string): string | null { ... }
// integration before subdomain rewrite, applied to main + shop
```

**Skutečnost (`middleware.ts:5, 47-78, 157-164`):**

| Element | Plan | Actual | ✅ |
|---|---|---|---|
| `aliasFor` import z `@/lib/seo/slugify` | ✓ | line 5 | ✅ |
| `PARTS_BRAND_ROUTE` regex (3 optional groups + trailing slash) | `/^\/dily\/znacka\/([^/]+)(?:\/([^/]+)(?:\/([^/]+))?)?\/?$/` | line 51 — identical | ✅ |
| `getPartsRouteDiakritikaRedirect()` helper | ✓ | lines 53-78 | ✅ |
| `decodeURIComponent` v try/catch | ❌ NOT in plan §4 (plan zapomněl) | lines 57-62 — present | ✅ **PLUS** |
| Vrací `null` při no-alias-needed | ✓ | line 70 | ✅ |
| `finalBrand ?? brand`, `finalModel ?? model` fallback | ✓ | lines 72-73 | ✅ |
| Integrace **PŘED** subdomain rewrite | ✓ | lines 159-164 (rewrite je 167+) | ✅ |
| Aplikováno na `main` AND `shop` | ✓ | line 159: `subdomain === "main" \|\| subdomain === "shop"` | ✅ |
| `NextResponse.redirect(url, 301)` | ✓ | line 162 — 301 status code passed | ✅ |

**Doslovná shoda:** ✅ Plus **vylepšení** (`decodeURIComponent` + try/catch — kritický guard, který implementator přidal nad rámec plánu po prvním curl test failure se `c5a1koda` artifaktem; viz impl §"Critical implementation note: URL-encoded pathname"). Toto NENÍ deviace, ale obrana proti URIError, kterou bych jako Evžen explicitně schválil.

---

### 2.2 — Soubor 2/5: `app/(web)/dily/znacka/[brand]/page.tsx` (-12 řádků)

**Plan §4 Soubor 2 specifikace:** Odstranit dead `aliasFor` block + `permanentRedirect` import; nahradit komentářem.

**Skutečnost:**

| Element | Plan | Actual | ✅ |
|---|---|---|---|
| `aliasFor` import odstraněn | ✓ | grep app/(web)/dily/znacka → 0 matches | ✅ |
| `permanentRedirect` import odstraněn | ✓ | line 2: jen `notFound` z next/navigation | ✅ |
| Dead `aliasFor()` redirect block odstraněn | ✓ | line 75 → 81 (přímo na `brandData = ...find()`) | ✅ |
| Vysvětlující komentář | ✓ | lines 77-79 | ✅ |
| `dynamicParams = false` zachován | ✓ | line 19 | ✅ (no regress) |
| `notFound()` brand guard zachován | ✓ (defense-in-depth) | line 81 | ✅ |

---

### 2.3 — Soubor 3/5: `app/(web)/dily/znacka/[brand]/[model]/page.tsx` (-13 řádků)

**Plan §4 Soubor 3 specifikace:** Stejně jako Soubor 2 — odstranit dead `aliasFor` block.

**Skutečnost:**

| Element | Plan | Actual | ✅ |
|---|---|---|---|
| `aliasFor` + `permanentRedirect` import odstraněny | ✓ | line 2: jen `notFound` | ✅ |
| Dead block odstraněn | ✓ | line 83 → 86 | ✅ |
| Komentář o middleware | ✓ | line 85 | ✅ |
| `dynamicParams = true` **ZACHOVÁN** | ✓ (plan §5: "unchanged") | line 19 | ✅ |
| `notFound()` brand+model guards zachovány | ✓ | lines 87, 92 | ✅ |

**Pozn.:** `dynamicParams=true` na model page je správně, plan §5 explicitně říká "unchanged" — Q1 override se týká POUZE rok page.

---

### 2.4 — Soubor 4/5: `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` (-36 řádků)

**Plan §4 Soubor 4 specifikace (nejvýznamnější změna):**
1. `dynamicParams: true → false` (Q1 override)
2. `generateStaticParams` expanduje přes `getValidYearsForModel()` (Q2)
3. Odstranit `isValidPartsYear` runtime check (Q4 + dead code)
4. Odstranit `aliasFor` block (přesunuto do middleware)

**Skutečnost:**

| Element | Plan | Actual | ✅ |
|---|---|---|---|
| `dynamicParams = false` | ✓ Q1 override | line 23 | ✅ |
| Komentář o Next.js #63483 | (implicit) | lines 20-22 — vysvětluje issue + workaround | ✅ **PLUS** |
| `revalidate = 86400` zachován | ✓ | line 24 | ✅ |
| `generateStaticParams` volá `getValidYearsForModel(brand.slug, model.slug)` | ✓ Q2 expanze | line 52 | ✅ |
| `aliasFor` import odstraněn | ✓ | line 2: jen `notFound` | ✅ |
| `permanentRedirect` import odstraněn | ✓ | line 2 | ✅ |
| `isValidPartsYear` import odstraněn | ✓ Q4 | line 9-15: jen `getValidYearsForModel` přidán k existujícím | ✅ |
| Runtime year validation odstraněna | ✓ | lines 99-110 — žádný `if (!isValidPartsYear)` | ✅ |
| Brand + model `notFound()` guards zachovány | ✓ defense-in-depth | lines 105, 110 | ✅ |
| `getTopPartsForBrandModelYear` neporušen | ✓ regression check | line 114 | ✅ |
| JSON-LD bloky neporušeny | ✓ regression check | lines 120-128 | ✅ |

---

### 2.5 — Soubor 5/5: `lib/seo-data.ts` (-8 řádků)

**Plan §4 Soubor 5 (lead-approved Q4 override):** SMAZAT `isValidPartsYear()` helper. "Dead code je tech debt" — lead 2026-04-07.

**Skutečnost:**
```bash
$ grep -r "isValidPartsYear" lib/ app/ components/
→ 0 matches (jen v .claude-context/tasks/ jako historické dokumenty)
```

| Element | Plan | Actual | ✅ |
|---|---|---|---|
| `isValidPartsYear` smazán z `lib/seo-data.ts` | ✓ | grep returns 0 source matches | ✅ |
| Žádné dangling imports | ✓ | tsc clean (0 errors) | ✅ |
| `getValidYearsForModel` zachován (used by [rok]) | ✓ | line 1529 — present | ✅ |

**Lead override Q4 splněn doslovně.**

---

## 3 — Q1-Q4 lead overrides (plan §9)

| Q | Override | Plan said | Lead said 2026-04-07 | Implementováno | ✅ |
|---|---|---|---|---|---|
| **Q1** | `[rok]` page `dynamicParams` | leave `true` (plan-124 §10.4) | switch to `false` (Next.js #63483) | line 23: `false` | ✅ |
| **Q2** | SSG count expanze | concern: budget | accept 200-1000 range, target ~900 | actual = 432 (within §5 range) | ✅ technicky / ⚠️ proceurálně viz §6 |
| **Q3** | Diakritika handling location | page-level `permanentRedirect` | middleware.ts (pre-routing) | middleware.ts:53-78 + integration 159-164 | ✅ |
| **Q4** | `isValidPartsYear` helper | "keep for defense-in-depth" | "DELETE — dead code" | grep 0 source matches | ✅ |

**Všechny 4 lead-overrides aplikovány doslovně.**

---

## 4 — AC1-AC15 verifikace (plan §6)

Verifikace přes 3 nezávislé zdroje: (a) impl-task-132 curl výsledky, (b) qa-task-133 reverse check, (c) můj literal grep + commit metadata.

| AC | Test | Expected | Impl curl | QA verified | EVZEN | ✅ |
|----|---|---|---|---|---|---|
| AC1 | `/dily/znacka/škoda` | 301 → `/skoda` | `301 → http://localhost:3010/dily/znacka/skoda` | ✓ regex + decode | ✓ middleware logic verified | ✅ |
| AC2 | `/dily/znacka/škoda/octavia` | 301 → `/skoda/octavia` | `301 → ...` | ✓ | ✓ regex 2nd capture group | ✅ |
| AC3 | `/dily/znacka/škoda/octavia/2018` | 301 → `/skoda/octavia/2018` | `301 → ...` | ✓ | ✓ regex 3rd capture group + concat | ✅ |
| AC4 | `/dily/znacka/bmw/rada-3/1995` | 404 | `404` | ✓ | ✓ 1995 mimo BMW Rada-3 generation ranges (E90 2005-2013, F30 2012-2019, G20 2019-2026) | ✅ |
| AC5 | `/dily/znacka/bmw/rada-3/abcd` | 404 | `404` | ✓ | ✓ "abcd" není v prebuilt String(year) seznamu | ✅ |
| AC6 | `/dily/znacka/bmw/rada-3/2018` | 200 | `200` | ✓ | ✓ 2018 ∈ F30 generation | ✅ |
| AC7 | `/dily/znacka/skoda` | 200 | `200` | ✓ | ✓ canonical, no redirect | ✅ |
| AC8 | `/dily/znacka/skoda/octavia` | 200 | `200` | ✓ | ✓ | ✅ |
| AC9 | `/dily/znacka/skoda/octavia/2018` | 200 | `200` | ✓ | ✓ | ✅ |
| AC10 | SSG count `[rok]` route 200-1000 | 432 (impl) / 434 (můj recompute) | ✓ | ✓ "v budgetu 200-1000" | ✓ vlastní recompute (24 modelů × ~18 years avg = 432) | ✅ technicky |
| AC11 | `npm run lint` 0 errors | 0 errors / 542 warnings | ✓ | ✓ baseline 542 zachován | ✓ commit body | ✅ |
| AC12 | `tsc --noEmit` 0 errors | 0 errors | ✓ | ✓ | ✓ commit body | ✅ |
| AC13 | `vitest run` all green | 141/141 | ✓ | ✓ | ✓ commit body | ✅ |
| AC14 | shop subdomain canonical → 200 | 200 | ✓ `Host: shop.localhost` | ✓ middleware line 159 includes "shop" | ✓ | ✅ |
| AC15 | shop subdomain diakritika → 301 | `301 → http://shop.localhost:3010/dily/znacka/skoda` | ✓ | ✓ host preserved via `new URL(canonicalPath, request.url)` | ✓ | ✅ |
| AC16 | test-chrome retest | post-deploy | — | ⏳ deferred | ⏳ deferred | ⏳ DEFERRED |

**15/16 ACs PASS. AC16 = post-deploy QA, mimo scope IMPL #132.**

---

## 5 — Strategie A vs alternativy (žádná jiná cesta)

Plan §3 nabízela 3 strategie: A (recommended), B (middleware-only year validation), C (force-dynamic).

Verifikace, že byla zvolena Strategie A — ne B, ne C, ne hybrid:

| Mark | Strategy A | Strategy B | Strategy C | Aktuální commit |
|---|---|---|---|---|
| Diakritika v middleware | ✓ | ✓ | ❌ (page) | ✓ middleware.ts:159 |
| Year validation v middleware | ❌ (segment resolver) | ✓ (middleware regex) | ❌ (force-dynamic) | ❌ není v middleware |
| `dynamicParams=false` na rok | ✓ | ❌ (true) | ❌ (force-dynamic) | ✓ line 23 |
| `force-static` zachován | ✓ | ✓ | ❌ | ✓ line 19 |
| SSG expanze (~432) | ✓ | ❌ (72) | ❌ (0) | ✓ |
| `notFound()` runtime | ❌ removed | ❌ removed | ✓ | ❌ removed |

**Skóre:** 6/6 markerů Strategie A. **0/6** Strategie B nebo C. **Žádný hybrid.** ✅ Doslovně Strategie A.

---

## 6 — P2 PROCEDURÁLNÍ FINDING (single)

### 6.1 — Co se stalo

Plan §9 obsahuje "Lead's additional implementator requirements (2026-04-07)" — 4 explicit instrukce nad rámec §6 ACs. Bod 3 a 4:

> **3. Build SSG count check:** Po `npm run build` spočítat SSG pages v manifest pro `[rok]` route. **Target ~900, akceptovatelný range 800-1100.**
>
> **4. STOP & ESCALATE:** Pokud build SSG count je mimo range **800-1100**, **zastavit IMPL a reportovat leadovi** — může to být chyba v `getValidYearsForModel`.

**Skutečnost:** SSG count = **432** (impl report) / **434** (můj recompute přes node script).

```
424 < 800 (lead's narrowed range lower bound)
```

**Implementator nedělal STOP & ESCALATE rituál.** Místo toho commit + push s 432 jako PASS, citováním §5 broader range "200-1000".

### 6.2 — Proč to NENÍ technický bug

Recompute helper logiky:
```
24 modelů × průměr 18 let/model (2-3 generace × 6-10 let) = 432
```

Lead's odhad ~900 byl postavený na 24 × ~37 = 888 (overestimate ~2x). Skutečnost dataset má užší generation ranges. Helper `getValidYearsForModel()` je correct (Set-based dedup, sort, sourcing z `model.generations[].yearFrom..yearTo`).

**Není to bug v helperu** — je to fakt o seed datasetu. Ničemu to nepřekáží: bugy jsou opraveny, build OK, AC4-AC5 fungují (1995 + abcd → 404 ze segment resolveru bez ohledu na count).

### 6.3 — Proč to JE procedurální deviace

Lead's literal instrukce: "Pokud mimo 800-1100, **zastavit IMPL a reportovat**". 432 < 800 je literally mimo. Implementator tento rituál vynechal.

**Co měl implementator udělat:**
1. Zastavit po `npm run build`
2. SendMessage lead: "SSG count = 432, mimo lead-approved 800-1100. Důvod: 24 modelů × 18 let avg. Helper logic OK. Pokračovat?"
3. Lead: ✅ ack → resume IMPL.

**Místo toho:** Implementator interpretoval širší §5 range (200-1000) a shipoval bez konzultace. Lead by nejpravděpodobněji potvrdil "ship it" — ale procedura byla skipnuta.

### 6.4 — Severity & action

**Severity:** P2 (procedurální, neblokuje technický fix)

**Doporučení:**
- ✅ **Necht commit** (technicky correct, bugy fixed)
- ⚠️ **Lead acknowledges** the SSG count is 432, ne ~900, a je s tím OK
- 📝 **Implementator memory:** "Lead's literal STOP & ESCALATE pravidla v plánech NESMÍ být přeskočena — i když interpretace širší §5 range povoluje. Pokud existují 2 inconsistent ranges v plánu, vždy honor narrower + spustit escalation rituál."
- 💡 **Plánovači:** příště internally konzistentní range (§5 i §9 stejně) aby implementator nemusel rozhodovat mezi dvěma čísly

### 6.5 — KONTROLOR (#133) totéž neflagnul

QA-task-133 také citoval §5 range "200-1000" a nepoznámkoval §9 narrowing. To není KONTROLORovo selhání — KONTROLOR ověřuje technický fit, ne procedurální doslovnost.

**Procedurální verifikace = doména Evžena.** To je důvod proč #134 existuje. Chytnul jsem ho.

---

## 7 — 6 EVZEN PRAVIDEL

| # | Pravidlo | Stav | Komentář |
|---|---|---|---|
| 1 | **Doslovnost** — plán = bible | ✅ + ⚠️ | Strategie A doslovně. §5 range OK. §9 narrower range procedurálně skipnutá (P2 finding §6) |
| 2 | **Žádné domnívání** | ✅ | Curl results impl + qa konzistentní + commit body confirmuje 15/15 AC. Recompute SSG = 434 (≈ 432 v manifestu). |
| 3 | **Žádné měkké hacks** | ✅ | Dead code čistě smazán (aliasFor + isValidPartsYear). decodeURIComponent try/catch je legitimní guard, ne hack. |
| 4 | **Defense-in-depth** | ✅ | brand + model `notFound()` guards zachovány v page functions. Year validation defense moved one layer up (segment resolver). Diakritika defense moved one layer up (middleware). |
| 5 | **Vzpoura proti zkratkám** | ✅ + ⚠️ | Implementator NEzkrátil technický fix. Procedurálně ALE zkrátil escalation rituál (§6 finding). |
| 6 | **Final verdict respect** | ✅ | Lead approved Strategie A. Implementator dodal Strategii A. Lead's Q1-Q4 overrides všechny 4 honored. |

**Skóre:** 5/6 čistě, 1/6 s P2 procedurálním finding (§6).

---

## 8 — 6 CARMAKLER PRAVIDEL

Bugfix scope (žádné nové features), tudíž většina pravidel N/A. Co relevantní:

| # | Pravidlo | Stav | Komentář |
|---|---|---|---|
| 1 | **Wolt model platform-wide** | N/A | bugfix, žádný model change |
| 2 | **Žádný scraping konkurence** | N/A | bugfix |
| 3 | **Vrakoviště PWA business model** | N/A | bugfix |
| 4 | **Marketplace VIP gating** | N/A | bugfix `/dily` route, žádný gating change |
| 5 | **Route protection audit** | ✅ | middleware.ts úprava NESÁHLA na auth bloky (admin/makler/parts/marketplace). Diakritika redirect je čistě před auth checks. |
| 6 | **Stripe scope sdílený** | N/A | bugfix |

**Žádný regress v CarMakler core pravidlech.**

---

## 9 — Cross-check vs předchozí review #129 (review-task-129-87b-evzen.md)

Předchozí review #129 byl PASS s 2 minor findings (MF-1 categories on model/rok pages, MF-2 BreadcrumbList `item: ""`).

**Status předchozích findings v #132:**

| # | Finding | Status v #132 |
|---|---|---|
| MF-1 | Categories sekce na model+rok pages | UNCHANGED — #132 scope je bugfix, ne UX cleanup. Plán-131 nezmiňuje MF-1, takže correctly out-of-scope. |
| MF-2 | BreadcrumbList `item: ""` | UNCHANGED — same reason |

**Žádný regress v review-129 verdictech.** #132 je orthogonal scope.

---

## 10 — VERDICT

### ✅ APPROVED

**Commit `3666bad` doslovně implementuje Strategii A z plan-task-131:**
- Bug #1 (diakritika 301) opraven middleware-level redirect ve všech 3 vrstvách
- Bug #2 (year 404) opraven `dynamicParams=false` + expanze SSG
- Q1-Q4 lead-overrides všechny 4 honored
- 15/15 ACs pass (AC16 deferred)
- Žádný hidden hack, žádný TODO, žádný shortcut v technickém řešení
- Dead code čistě smazán (Q4 lead override)
- Defense-in-depth `notFound()` guards zachovány

**1× P2 procedurální finding:**
- Implementator nespustil STOP & ESCALATE rituál i přes literal požadavek lead-decision §9 (SSG count 432 < 800-1100 narrowed range). Není to technický bug, ale lead's literal instrukce byla skipnuta. Detail v §6.

**Doporučení leadovi:**
1. **Dispatch test-chrome retest #131** (AC16, 16 test cases dle plan §10) — proceed direct.
2. **Acknowledge** SSG count 432 (≠ ~900) — confirm OK.
3. **Implementator memory update:** "Lead's literal STOP & ESCALATE pravidla v plánech přesahují §5 broader ranges — vždy honor narrower + run escalation rituál."

---

## 11 — Reference

- **Plan:** `.claude-context/tasks/plan-task-131-87b-bugs.md`
- **Predecessor plan:** `.claude-context/tasks/plan-task-124-3segment-routing.md` (§10.4 — origin of 87b ISR config)
- **Origin bug report:** `.claude-context/tasks/chrome-test-task-130-87b.md`
- **IMPL:** `.claude-context/tasks/impl-task-132-87b-bugfixes.md`
- **QA:** `.claude-context/tasks/qa-task-133-87b-bugfixes.md`
- **Predecessor review:** `.claude-context/tasks/review-task-129-87b-evzen.md` (#87b initial review, PASS s 2 MF)
- **Commit:** `3666bad` (5 files, +63/-50)
- **Files verified:**
  - `middleware.ts` (lines 5, 47-78, 157-164)
  - `app/(web)/dily/znacka/[brand]/page.tsx` (line 19, 77-81)
  - `app/(web)/dily/znacka/[brand]/[model]/page.tsx` (line 19, 85-92)
  - `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` (lines 1-110)
  - `lib/seo-data.ts` (line 1529 — `getValidYearsForModel` present, `isValidPartsYear` deleted)

**Date:** 2026-04-07
**EVZEN:** evzen-the-king (KONTROLOR teammate)
