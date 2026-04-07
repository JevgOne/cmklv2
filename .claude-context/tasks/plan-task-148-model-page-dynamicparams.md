---
name: Plán #148 — Fix model page dynamicParams (analogous #132)
description: Krátký fix-plan pro P2 bug objevený test-chrome #147 — `/dily/znacka/{brand}/neexistuje` vrací 200 (cached fallback s root layout title) místo 404. Root cause identický s #131/#132 (Next.js #63483 — `notFound()` v `force-static + dynamicParams=true` má caching anomálii). Fix = single-line flip `dynamicParams = true → false` v `app/(web)/dily/znacka/[brand]/[model]/page.tsx`. Bezpečné — generateStaticParams() už pre-builduje všech 51 modelů (17 brands × 3 models post-#98), middleware diakritika regex pokrývá model segment (PRE-routing). Plán dodává 5 AC, edge case audit, rollback plán.
type: plan
task_id: 148
queue_id: 148
parent_plan: plan-task-131-87b-bugs.md
related_plans:
  - plan-task-131-87b-bugs.md (#131 — analogous fix pro brand+rok page, completed v #132)
  - plan-task-143-87d-revalidation.md (#143 — H2 brand expansion, #98 committed)
related_test: "#147 TEST-CHROME (e2e/chrome-test-147-extras.spec.ts EXTRA-3 documents bug)"
revision_history:
  - 2026-04-07 — initial draft (planovac, dispatch #148)
  - 2026-04-07 — lead-approved Q1-Q5 (all recommended); §10 LEAD DECISIONS block added with verbatim citations; §7 status banner added; ready for IMPL dispatch
---

# Plán #148 — Fix model page dynamicParams

> **Cíl:** Opravit P2 bug — `/dily/znacka/{brand}/neexistuje` vrací 200 místo 404. Single-line flip `dynamicParams = true → false` v model page. Identický pattern s #132 fix (rok page). Effort ~30-45 min.

---

## 0 — TL;DR

**Bug (objevený #147 EXTRA-3):**

| URL | Aktuální | Očekávané |
|-----|----------|-----------|
| `/dily/znacka/alfa-romeo/neexistuje` | 200 (root layout title) | 404 |

**Root cause:** `app/(web)/dily/znacka/[brand]/[model]/page.tsx:21` má `dynamicParams = true` + page line 80 `if (!modelData) notFound()`. Next.js issue [#63483](https://github.com/vercel/next.js/issues/63483) — `notFound()` v `dynamic="force-static"` cachuje fallback render místo 404.

**Fix:** 1-line change `true → false`. **Identický pattern jako #131/#132** — brand page (post-#132) i rok page (post-#132) už mají `dynamicParams = false`, model page byla "forgotten sister" protože #131 scope byl definován test-chrome #130 findings (které model unknown subpath netestovaly).

**Effort:** ~30-45 min IMPL. Risk **LOW**. Žádný build break, žádný npm deps, žádná migration.

---

## 1 — Pre-flight verification (planning-time, již provedeno)

### V1 — generateStaticParams pre-builduje všechny 51 modelů

**Verify:** `app/(web)/dily/znacka/[brand]/[model]/page.tsx:24-31`:
```ts
export function generateStaticParams() {
  return PARTS_BRANDS.flatMap((brand) =>
    (PARTS_MODELS_BY_BRAND[brand.slug] || []).map((model) => ({
      brand: brand.slug,
      model: model.slug,
    }))
  );
}
```

**Source data check (`lib/seo-data.ts`):**
- `PARTS_BRANDS` = **17 brandů** (verified post-#98 via grep `^  ([a-z-]+|"[a-z-]+"): \[$` → 17 hits)
- `PARTS_MODELS_BY_BRAND` = **51 model entries** total (verified via grep `^      slug:` → 51 hits)
- 17 × 3 = 51 ✅

**Result:** Po `dynamicParams = false` flip žádný valid model NEZAPADNE — všech 51 combinations je v static manifest. Žádný build break risk pro existing pages.

### V2 — Diakritika 301 redirect je pre-routing v middleware

**Verify:** `middleware.ts:51`:
```ts
const PARTS_BRAND_ROUTE = /^\/dily\/znacka\/([^/]+)(?:\/([^/]+)(?:\/([^/]+))?)?\/?$/;
```

Regex matchuje `/dily/znacka/{brand}[/{model}[/{rok}]]` — model segment je optional ale CAPTUROVANÝ. `getPartsRouteDiakritikaRedirect()` (lines 53-78) volá `aliasFor(brand)` AND `aliasFor(model)`. Pokud najde diakritika alias na kterémkoli segmentu → returnuje canonical path → middleware odpoví 301.

**Middleware execution order:**
1. Site password check
2. Subdomain detection
3. **Diakritika redirect check** (line 159-164) — `if (subdomain === "main" || subdomain === "shop")` → return 301 IMMEDIATELY
4. Subdomain rewrite
5. Auth checks
6. → Next.js segment resolver

→ Diakritika běží PŘED Next.js segment resolverem. **`dynamicParams = false` na model page neblokuje diakritika** — middleware redirect se aplikuje first. ✅

**Test cases (post-fix smoke check, AC8):**
- `/dily/znacka/skoda/octávia` → middleware → 301 → `/dily/znacka/skoda/octavia` (page never reached)
- `/dily/znacka/škoda/octavia` → middleware → 301 → `/dily/znacka/skoda/octavia`
- `/dily/znacka/škoda/octávia` → middleware → 301 → `/dily/znacka/skoda/octavia`

---

## 2 — Impact analysis

### Build time delta

**Expectation:** **Negligible** (<1s). 51 model pages už jsou v `generateStaticParams` output → buildovaly se i před fixem. Flag `dynamicParams = false` ovlivňuje pouze runtime resolution chování (segment resolver vs page function), NE počet pre-buildovaných pages.

**Verification akce (Phase 5):** `npm run build` před a po fix → compare timing v "Generating static pages" line. Expected delta < 5% (AC5 threshold).

### SSG count delta

**Expectation:** **Unchanged** = 1212 total site SSG (per current baseline post-#98).

**Reasoning:** Fix je behavioral flag flip, ne data change. `generateStaticParams()` output nezávisí na `dynamicParams` setting. 51 model pages budou v build manifestu i nadále.

**Verification akce (Phase 5):** Spočítat `/dily/znacka/[brand]/[model]` entries v build log → MUSÍ být 51. Total site SSG count → MUSÍ být 1212 (AC4).

### CI/CD impact

**None.** Žádný impact na lint, typecheck, vitest. ESLint baseline shift risk pouze pokud cleanup smaže `notFound` import (Q1 dependent).

---

## 3 — Edge cases audit

| Edge case | Pre-fix behavior | Post-fix behavior | Status |
|-----------|------------------|-------------------|--------|
| Unknown model under known brand (`/dily/znacka/alfa-romeo/neexistuje`) | ❌ 200 (cached fallback) | ✅ 404 (segment resolver) | **TARGET FIX** |
| Valid known model (`/dily/znacka/skoda/octavia`) | ✅ 200 | ✅ 200 (unchanged) | regression-safe |
| Post-#98 H2 brand model (`/dily/znacka/alfa-romeo/giulia`) | ✅ 200 | ✅ 200 (unchanged) | regression-safe |
| Diakritika v model (`/dily/znacka/skoda/octávia`) | ✅ 301 (middleware) | ✅ 301 (middleware, unaffected) | regression-safe |
| Diakritika v brand (`/dily/znacka/škoda/octavia`) | ✅ 301 (middleware) | ✅ 301 (middleware, unaffected) | regression-safe |
| Both segments diakritika (`/dily/znacka/škoda/octávia`) | ✅ 301 (middleware) | ✅ 301 (middleware, unaffected) | regression-safe |
| Case-sensitive — Next.js routing je case-sensitive default | 404 | 404 (unchanged) | unaffected |
| Year sub-page (`/dily/znacka/skoda/octavia/2018`) | ✅ 200 | ✅ 200 (year page má vlastní `dynamicParams=false` od #132) | regression-safe |
| Unknown brand (`/dily/znacka/neexistuje`) | ✅ 404 (brand page má `dynamicParams=false` od #132) | ✅ 404 (unaffected) | unaffected |

**Conclusion:** Fix má jediný behavioral effect — unknown model returning 404 místo 200. Všechny ostatní paths regression-safe.

---

## 4 — Acceptance criteria (5 AC, per dispatch verbatim)

**AC1 — Unknown model 404:**
```bash
curl -I http://localhost:3000/dily/znacka/alfa-romeo/neexistuje
# MUST be: HTTP/1.1 404 Not Found
```

**AC2 — Valid model unchanged:**
```bash
curl -I http://localhost:3000/dily/znacka/alfa-romeo/giulia
# MUST be: HTTP/1.1 200 OK
```

**AC3 — Brand page unchanged:**
```bash
curl -I http://localhost:3000/dily/znacka/alfa-romeo
# MUST be: HTTP/1.1 200 OK
```

**AC4 — SSG count unchanged = 1212 total site SSG:**
`npm run build` log obsahuje:
- Total prerendered routes count = **1212** (current post-#98 baseline)
- `/dily/znacka/[brand]/[model]` segment = **51 prerendered pages**
- **STOP & ESCALATE** pokud total ≠ 1212 ± variance, NEBO model count ≠ 51

**AC5 — Build time delta < 5%:**
Změřit `npm run build` real time (přes `time npm run build`) PŘED fixem (baseline) a PO fixem. Delta MUSÍ být < 5%. Expected delta = ~0% (žádný change v generateStaticParams output, jen runtime flag flip).

**Bonus AC6 — Diakritika regression-free (ne explicit v dispatch, ale critical):**
```bash
curl -I http://localhost:3000/dily/znacka/skoda/octávia      # 301 → /skoda/octavia
curl -I http://localhost:3000/dily/znacka/škoda/octavia      # 301 → /skoda/octavia
curl -I http://localhost:3000/dily/znacka/škoda/octávia      # 301 → /skoda/octavia
```
Pokud kterýkoli vrátí 404 (ne 301) → IMMEDIATE rollback (middleware regression).

---

## 5 — Rollback plan

**Trigger:** Kterýkoli AC fails post-deploy NEBO diakritika 301 → 404 regression.

**Rollback steps:**
1. `git revert <commit-sha>` — single-line change = trivial single-commit revert
2. `git push origin main`
3. CDN cache purge (optional, manual via `/api/revalidate/parts` z #87d)

**Rollback time:** < 2 min. Žádné migration / state changes / breaking schema.

**Risk of rollback necessity:** Very Low. Strategie je known-good (identický s #132 fix). Verifications V1+V2 už proběhly v plánu.

---

## 6 — Implementation order (phases)

```
Phase 1: Baseline check (3 min)
   - git pull origin main
   - cat -n app/(web)/dily/znacka/\[brand\]/\[model\]/page.tsx | sed -n '20,22p'
   - Verify line 21 = "export const dynamicParams = true;"
   - time npm run build → record baseline build time + total SSG count
   ↓
Phase 2: Edit (2 min)
   - Flip line 21 true → false
   - Add Next.js #63483 reference comment (analogický s rok page)
   - Optional cleanup Q1 — remove dead notFound() guards (lines 75, 80)
   ↓
Phase 3: Local smoke (10 min)
   - npm run dev
   - curl AC1/AC2/AC3 (3 tests)
   - curl AC6 diakritika (3 tests)
   - curl regression year page (1 test) + brand page (1 test)
   ↓ [STOP & ESCALATE if any fail]
Phase 4: Build verification (8 min)
   - time npm run build → record post-fix time + SSG count
   - Verify total SSG = 1212 (AC4)
   - Verify model segment count = 51 (AC4)
   - Calculate build time delta — MUST be < 5% (AC5)
   ↓ [STOP & ESCALATE if SSG ≠ 1212 OR delta > 5%]
Phase 5: Lint + typecheck (3 min)
   - npm run lint
   - npx tsc --noEmit
   ↓
Phase 6: Commit + push (2 min)
   - git add app/(web)/dily/znacka/[brand]/[model]/page.tsx
   - git commit -m "fix(seo): model page dynamicParams=false (Next.js #63483)"
   - git push origin main
   ↓
Phase 7: Dispatch follow-ups (5 min)
   - #149 QA — verify fix proti AC1-6
   - #150 TEST-CHROME — model unknown 404 + diakritika regression retest
```

**Total: ~30-45 min**

---

## 7 — Open questions (krátký seznam — toto je drobný fix)

> **✅ ALL LEAD-APPROVED (2026-04-07)** — Q1-Q5 schváleny per recommended option. Plnou citaci team-leadova rozhodnutí najdeš v **§10 LEAD DECISIONS**. Tato sekce je zachována pro audit trail (decision rationale).

### Q1 — Dead-code cleanup (notFound guards lines 75, 80)?

S `dynamicParams = false` jsou `if (!brandData) notFound()` a `if (!modelData) notFound()` dead code (segment resolver garantuje valid params). **Doporučení: SMAZAT** (consistent s #132 lessons learned, čistší kód). Implementator použije ne-null assertions (`!`) NEBO defensive idiom. Pokud smazáno → také remove unused `notFound` import (line 2).

**Alternativa:** Keep guards as defensive safety net. Plus: zero behavior risk. Mínus: dead code, ESLint může complainovat o unused import.

### Q2 — Update e2e test #147 EXTRA-3 z documentation-only na hard `expect(404)` assertion?

`e2e/chrome-test-147-extras.spec.ts` EXTRA-3 currently jen logs "Finding: expected 404, got 200" bez `expect`. **Doporučení: YES**, post-fix update na `expect(r?.status()).toBe(404)` pro regression prevention. Scope #148 nebo follow-up.

---

## 8 — Affected files

| Soubor | Změna | LoC delta | Risk |
|--------|-------|-----------|------|
| `app/(web)/dily/znacka/[brand]/[model]/page.tsx` | Line 21 flip + comment + Q1 cleanup | +5 / -5 (net 0) | Low |
| `lib/seo-data.ts` | **NO CHANGE** | 0 | None |
| `app/sitemap.ts` | **NO CHANGE** (auto-pickup) | 0 | None |
| `middleware.ts` | **NO CHANGE** (diakritika regex covers model segment) | 0 | None |
| `e2e/chrome-test-147-extras.spec.ts` | Q2 dependent | +1 / -0 (optional) | None |

**Total: 1 file core + 1 optional test update.**

---

## 9 — Souhrn pro team-leada

**Co plán dodává:**
- 1 MODIFIED soubor: `[brand]/[model]/page.tsx` line 21 (`true → false`)
- 0 changes v middleware/sitemap/seo-data
- **5 acceptance criteria** + bonus AC6 diakritika regression check
- **Pre-flight verification done v planning-time** — V1 (51 models in static manifest) + V2 (middleware diakritika pre-routing)
- **Rollback plan** (single-line revert, < 2 min)

**Architektonický klíč #1 — Auto-pickup verified:**
generateStaticParams pattern už pre-builduje 17×3=51 model pages. Flag flip neovlivní build output. AC4 SSG count 1212 unchanged.

**Architektonický klíč #2 — Diakritika regression-free:**
middleware.ts `PARTS_BRAND_ROUTE` regex (line 51) matchuje model segment, redirect běží PRE-routing (line 159-164), tedy `dynamicParams = false` neblokuje diakritika alias resolution.

**Risk:** **LOW.** Highest = SSG count regression (mitigated AC4). Second = build time delta > 5% (mitigated AC5). Třetí = ESLint unused import warning (mitigated Q1 cleanup).

**Effort:** ~30-45 min IMPL. Žádné nové npm deps. Žádná migration.

**Návaznost:**
- **Blocked-by:** žádný (#98 už committed)
- **Blocks:** #149 QA, #150 test-chrome retest

**Rozhodovací bod:** Schválit Q1-Q2 + dispatch implementator pro #148 IMPL.

---

**Lessons learned candidate (memory post-commit):**
*"Při fixing patternA na file X (např. dynamicParams=false fix #132 na brand+rok page), audit sister files for same pattern."* Důvod: #131/#132 missed model page protože scope byl definován test-chrome findings (#130), ne pattern audit napříč všemi 3 templates `/dily/znacka/*`. Test #147 (post-#98 verification) odhalil 5 měsíců po faktu.

---

## 10 — LEAD DECISIONS (2026-04-07)

> **Status:** ✅ ALL APPROVED. Team-lead schválil všech 5 otázek (Q1-Q5) per planovac's recommended option. Tato sekce je **autoritativní zdroj pravdy** pro implementatora — overrides any deviating phrasing v §7 nebo elsewhere v plánu.
> **Sequencing:** Žádný blocking gate. IMPL může startovat immediately po dispatch.

### ✅ Q1 — Strategy A2a (clean) — remove dead notFound() guards + non-null assertions

**Lead's verbatim:**
> **Q1** ✅ **Strategy A2a** — clean cleanup: remove dead `notFound()` guards + non-null assertions. Consistent s #132 lessons learned.

**Implementator action:**
- Smazat `if (!brandData) notFound()` na řádku 75
- Smazat `if (!modelData) notFound()` na řádku 80
- Použít non-null assertions v variable declarations:
  ```ts
  const brandData = PARTS_BRANDS.find((b) => b.slug === brand)!;
  const modelData = PARTS_MODELS_BY_BRAND[brand]!.find((m) => m.slug === model)!;
  ```
- Justification: po `dynamicParams = false` jsou brand+model garantované valid (segment resolver checked před page function spustí). Guards = unreachable dead code.
- Update intro comment (line 73) na:
  ```ts
  // Diakritika 301 redirect handled v middleware.ts (pre-routing).
  // Brand+model validation handled v generateStaticParams + dynamicParams=false:
  // invalid combinations dostanou 404 ze segment resolveru.
  ```

### ✅ Q2 — Smazat unused `notFound` import

**Lead's verbatim:**
> **Q2** ✅ YES — smaž unused `notFound` import.

**Implementator action:**
- Odstranit `notFound` z import statementu na line 2:
  ```ts
  // PŘED:
  import { notFound } from "next/navigation";

  // PO:
  // (smazat celý import — notFound není používán nikde jinde v souboru)
  ```
- Verify ESLint pass (no `unused-vars` warning) v Phase 5

### ✅ Q3 — Dispatch immediately, žádný blocking gate

**Lead's verbatim:**
> **Q3** ✅ YES — dispatch immediately, žádný blocking gate.

**Implementator action:**
- Žádný `git log` wait gate
- Jediný baseline check: `git log --oneline app/(web)/dily/znacka/\[brand\]/\[model\]/page.tsx | head -5` → verify current line 21 = `dynamicParams = true` (sanity check, ne blocking gate)
- IMPL může startovat ihned po dispatch

### ✅ Q4 — Update e2e #147 EXTRA-3 hard assertion

**Lead's verbatim:**
> **Q4** ✅ YES — update e2e hard assertion `expect(404)`.

**Implementator action:**
- Edit `e2e/chrome-test-147-extras.spec.ts` test EXTRA-3
- Současný stav (line ~24-30):
  ```ts
  // ...
  console.log("Finding: expected 404, got", r?.status());
  ```
- Změnit na hard assertion:
  ```ts
  expect(r?.status()).toBe(404);
  ```
- Volitelně přidat `await page.screenshot({ path: "test-results/t148-model-404-fixed.png" });`
- Test je SOUČÁSTÍ #148 IMPL scope (NE samostatný follow-up)

### ✅ Q5 — NO scope creep pro /dily/kategorie audit

**Lead's verbatim:**
> **Q5** ✅ NO scope creep — `/dily/kategorie/[slug]` audit track jako follow-up (ale **NEzakládej nový task**, napíšu si to sám do backlogu).

**Implementator action:**
- **NEpřidávat** žádný change v `/dily/kategorie/[slug]/page.tsx`
- **NEvytvářet** žádný TaskCreate pro #149b kategorie audit
- Team-lead si tracking sám zapíše do backlogu
- IMPL scope je STRIKTNĚ pouze model page

---

### Implementator pre-flight checklist (po §10 LEAD DECISIONS)

Před startem Phase 1 implementator MUSÍ:
1. ✅ Přečíst §10 LEAD DECISIONS verbatim — to je autoritativní spec
2. ✅ Sanity check: `cat -n app/(web)/dily/znacka/\[brand\]/\[model\]/page.tsx | sed -n '20,22p'` → ověřit line 21 = `export const dynamicParams = true;`
3. ✅ `time npm run build` → record baseline build time + total SSG count (1212 expected)
4. ✅ Po fixu re-run `time npm run build` → verify SSG = 1212 unchanged + delta < 5% (AC4 + AC5)
5. ✅ Run `npm run lint && npx tsc --noEmit` před commitem (verify Q2 unused import cleanup)

**Final IMPL scope summary (per §10):**
- 1 file core fix: `app/(web)/dily/znacka/[brand]/[model]/page.tsx`
  - Line 21: `dynamicParams = true → false`
  - Line 73: comment update
  - Line 75: smazat `if (!brandData) notFound();`
  - Line 80: smazat `if (!modelData) notFound();`
  - Variable declarations: ne-null assertions `!`
  - Line 2: smazat `notFound` import
- 1 file test update: `e2e/chrome-test-147-extras.spec.ts` EXTRA-3 hard assertion
- 0 changes v middleware/sitemap/seo-data/kategorie
