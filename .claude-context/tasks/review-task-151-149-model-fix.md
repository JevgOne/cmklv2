  # EVZEN REVIEW #151 — #149 Model Page dynamicParams Fix (commit `e702e93`)

**Reviewer:** EVZEN (read-only task controller)
**Datum:** 2026-04-07
**Commit:** `e702e93` — `fix(seo): #148 model page dynamicParams=false (analogous #132 rok fix)`
**Plán:** `.claude-context/tasks/plan-task-148-model-page-dynamicparams.md` (§10 LEAD DECISIONS Q1-Q5)
**QA:** `.claude-context/tasks/qa-task-150-model-dynamicparams.md` (KONTROLOR ✅ PASS, 0 findings)
**Sister review:** `.claude-context/tasks/review-task-151-149-evzen.md` (předchozí EVZEN výstup, identický rozsah & verdict)

**Read-only:** Žádný source code change.

---

## Verdict

### ✅ **APPROVED** (0 findings, 1 OBSERVATION non-blocking)

---

## SOUHRN — 7-bodový dispatch checklist

| # | Bod | Verdict |
|---|---|---|
| 1 | Core fix `dynamicParams = false` na model page | ✅ page.tsx:23 |
| 2 | Cleanup consistent s Q1 A2a (dead guards + non-null) | ✅ both `if (!x) notFound()` removed, both `find()` má `!` |
| 3 | E2E hard assertion per Q4 (`expect(404)`) | ✅ chrome-test-147-extras.spec.ts:26 |
| 4 | Žádný scope creep — jen 2 files (page + e2e) | ✅ verified `git show --stat` |
| 5 | Pattern consistency s #132 rok page | ✅ identický `dynamicParams=false` + Next.js #63483 reference comment |
| 6 | SSG count unchanged (1212) | ✅ flag flip = behavioral, ne data; commit msg confirms |
| 7 | Žádné deletions mimo schválené dead code | ✅ 7 deletion lines all per Q1+Q2 explicit approval |

---

## 1. Q1-Q5 LEAD DECISIONS verbatim cross-check

| Q | Plán literal | Implementace |
|---|---|---|
| **Q1** | A2a clean cleanup (remove dead guards + non-null assertions) | ✅ `if (!brandData) notFound()` + `if (!modelData) notFound()` smazány; `const brandData = ... find(...)!` + `const modelData = ... find(...)!`; intro comment updated dle plán spec (3-line: middleware + generateStaticParams + segment resolver) |
| **Q2** | Smazat unused `notFound` import | ✅ Diff line 2 removed: `-import { notFound } from "next/navigation";` Lint 0 errors confirms (žádný unused-import warning) |
| **Q3** | Dispatch immediately, žádný blocking gate | ✅ N/A pro review (timing decision) |
| **Q4** | E2E EXTRA-3 hard `expect(404)` v same #149 IMPL scope (NE follow-up) | ✅ `expect(r?.status()).toBe(404)` na line 26, test name `"(post-#149 fix)"`, v same commit `e702e93` |
| **Q5** | NO scope creep pro `/dily/kategorie` audit (NEvytvářet TaskCreate) | ✅ Kategorie page nedotčena, žádný #149b TaskCreate vytvořen |

**5 z 5 čisté.** Doslovnost respektována.

---

## 2. Bod #1 — Core fix `dynamicParams = false`

**Read `app/(web)/dily/znacka/[brand]/[model]/page.tsx:19-24`:**
```typescript
export const dynamic = "force-static";
// dynamicParams=false: Next.js #63483 — notFound() v force-static má caching
// anomálii (cached fallback render místo 404). Pre-buildujeme všech 51 modelů
// (17 brands × 3) → unknown modely dostanou 404 ze segment resolveru.
export const dynamicParams = false;
```

✅ Flag flipped `true → false`.
✅ Comment obsahuje Next.js #63483 reference + root cause vysvětlení + SSG count math.
✅ Identický pattern s rok page (#132 sister fix).

---

## 3. Bod #2 — Q1 A2a cleanup

**Diff verification (`git show e702e93 -- '...page.tsx'`):**

```diff
@@ -71,13 +73,12 @@ export default async function PartsBrandModelPage({
   const { brand, model } = await params;
 
   // Diakritika 301 redirect handled v middleware.ts (pre-routing).
-  const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
-  if (!brandData) notFound();
-
+  // Model validation handled v generateStaticParams + dynamicParams=false:
+  // unknown modely dostanou 404 ze segment resolveru → find() je guaranteed hit.
+  const brandData = PARTS_BRANDS.find((b) => b.slug === brand)!;
   const modelData = (PARTS_MODELS_BY_BRAND[brand] || []).find(
     (m) => m.slug === model
-  );
-  if (!modelData) notFound();
+  )!;
```

✅ 2 dead guards smazány, 2 non-null `!` přidány, comment updated dle Q1 spec.

**generateMetadata guard preserved (page.tsx:45):**
```typescript
if (!brandData || !modelData) return {};
```
**Záměrně zachován** — Q1 specifikoval cleanup pouze pro **page function**, ne metadata function. KONTROLOR §1 line 73-76 explicitly potvrzuje. Toto je belt-and-suspenders defense (Layer 3) — technicky dead code post-fix, ale konzervativní fallback. EVZEN potvrzuje že implementator NEPŘEKROČIL Q1 scope. ✅

---

## 4. Bod #3 — Q4 e2e hard assertion

**Read `e2e/chrome-test-147-extras.spec.ts:20-27`:**
```typescript
test("EXTRA-3: /dily/znacka/alfa-romeo/neexistuje → 404 (post-#149 fix)", async ({ page }) => {
  const r = await page.goto(`${BASE}/dily/znacka/alfa-romeo/neexistuje`, { waitUntil: "load" });
  const title = await page.title();
  const h1 = await page.locator("h1").first().textContent().catch(() => null);
  console.log("/dily/znacka/alfa-romeo/neexistuje HTTP:", r?.status(), "title:", title, "H1:", h1);
  await page.screenshot({ path: "test-results/t147-model-404-check.png" });
  expect(r?.status()).toBe(404);  // ← hard assertion ✅
});
```

✅ `expect(r?.status()).toBe(404)` present.
✅ Test name updated `"(post-#149 fix)"` — fix association documented.
✅ V same commit `e702e93` (NE separate follow-up).
✅ Konzistentní s EXTRA-1 (API 405) + EXTRA-2 (brand 404) — všechny tři tests mají hard assertions.

---

## 5. Bod #4 — Scope: exactly 2 files

**Verified `git show --stat e702e93`:**
```
app/(web)/dily/znacka/[brand]/[model]/page.tsx | 15 +++++++-------
e2e/chrome-test-147-extras.spec.ts             | 27 ++++++++++++++++++++++++++
2 files changed, 35 insertions(+), 7 deletions(-)
```

**Žádný edit v:**
- `app/(web)/dily/znacka/[brand]/page.tsx` (brand page — vlastní `dynamicParams=false` od #132)
- `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` (rok page — vlastní `dynamicParams=false` od #132)
- `app/(web)/dily/kategorie/[slug]/page.tsx` (Q5 explicit no scope creep ✅)
- `lib/seo-data.ts` / `app/sitemap.ts` / `middleware.ts` / `next.config.ts` / `package.json`

✅ Striktně 2 files, žádný unauthorized scope creep.

---

## 6. Bod #5 — Pattern consistency s #132

**Read `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx:21-25`:**
```typescript
export const dynamic = "force-static";
// dynamicParams=false: Next.js #63483 — notFound() v force-static má caching
// anomálii (cached fallback render místo 404). Pre-buildujeme všechny valid
// years z generation ranges → invalid years dostanou 404 ze segment resolveru.
export const dynamicParams = false;
```

**Model page (#149) lines 19-23:**
```typescript
export const dynamic = "force-static";
// dynamicParams=false: Next.js #63483 — notFound() v force-static má caching
// anomálii (cached fallback render místo 404). Pre-buildujeme všech 51 modelů
// (17 brands × 3) → unknown modely dostanou 404 ze segment resolveru.
export const dynamicParams = false;
```

**Identický flag, identický Next.js #63483 reference, paralelní comment structure** — pouze adapted pro model context (51 modelů místo "valid years from generation ranges"). ✅

---

## 7. Bod #6 — SSG count 1212 unchanged

**Math derivation:**
- `generateStaticParams()` source identical (page.tsx:26-33, 17 brands × 3 models = 51 entries)
- Flag flip `dynamicParams=true→false` = behavioral change, NE data change
- 51 model pages dále pre-buildovány
- Total site SSG: 1212 (post-#87d baseline) - 0 + 0 = 1212 ✅

**Commit message confirms verbatim:** *"SSG count: 1212 (unchanged, 51 model segments via generateStaticParams)."*

KONTROLOR §3 line 124-137 nezopustila build re-run (mathematical certainty + commit msg). EVZEN akceptuje.

---

## 8. Bod #7 — Žádné deletions mimo schválené

**Deletion audit (verified `git show e702e93 | grep '^-[^-]'`):**

| Deletion | Plán schválení |
|---|---|
| `import { notFound } from "next/navigation"` | ✅ Q2 explicit |
| `export const dynamicParams = true;` | ✅ AC core (replaced s `false`) |
| Old single-line intro comment | ✅ Q1 (replaced s 3-line spec) |
| `const brandData = PARTS_BRANDS.find(...);` | ✅ Q1 (replaced s `!` non-null version) |
| `if (!brandData) notFound();` | ✅ Q1 explicit |
| `const modelData = ... find(...);` | ✅ Q1 (replaced s `!` non-null version) |
| `if (!modelData) notFound();` | ✅ Q1 explicit |

**Total: 7 deletion lines, all explicitly schválené v Q1+Q2.** Žádný "while-i-was-at-it" deletion. Žádný removal of legitimate model/brand entries. ✅

---

## 9. Žádné skryté stránky

**Pre-fix vs post-fix accessibility:**

| Page | Pre-fix | Post-fix |
|---|---|---|
| `/dily/znacka/skoda/octavia` (valid H1) | ✅ 200 | ✅ 200 (unchanged) |
| `/dily/znacka/alfa-romeo/giulia` (valid H2) | ✅ 200 | ✅ 200 (unchanged) |
| `/dily/znacka/alfa-romeo/neexistuje` (invalid) | ❌ 200 (BUG cached fallback) | ✅ 404 (fixed) |

**51 model pages dále accessible** přes `generateStaticParams()` + sitemap auto-pickup. Žádný H1/H2 model page zmizel. Nová 404 odpovídá pro UNKNOWN modely = correct SEO behavior (proper dead URL signal, ne cached false-positive). ✅

---

## 10. EVZEN 6 pravidla

| Pravidlo | Status |
|---|---|
| **Doslovnost** | ✅ Q1-Q5 verbatim implementováno, code comments match plán Q1 spec |
| **No assumptions** | ✅ Žádný cleanup rok/kategorie page (Q5 spirit), žádný unrelated refactor |
| **No soft hacks** | ✅ Non-null `!` (NE `as any`, NE manual checks), straight flag flip |
| **Defense-in-depth** | ✅ 4 layers: middleware → segment resolver → dynamicParams=false → generateMetadata fallback (preserved) |
| **Resistance to shortcuts** | ✅ Žádný `// @ts-ignore`, žádný `try/catch` trick, žádný skip Q4 e2e |
| **Final verdict respect** | ✅ Q5 strikt no-scope-creep — kategorie untouched + žádný TaskCreate |

---

## 11. Lint / TSC / SSG (per QA report cross-check)

| Tool | Result |
|---|---|
| `npm run lint` | ✅ 0 errors, 543 warnings (baseline preserved) |
| `npx tsc --noEmit` | ✅ 0 errors (non-null `!` type-safe) |
| SSG count | ✅ 1212 (logical certainty + commit msg) |

---

## 12. SHA poznámka — `git reset --soft HEAD~1` workflow

Per team-lead context: implementator provedl `git reset --soft HEAD~1` po původním commitu `3ca01e4` aby přidal e2e hardening + verbatim message → nový hash `e702e93`.

**EVZEN posouzení:**
- ✅ **Legitimate workflow** — `reset --soft` zachová staged changes, umožní recommit s additional files (e2e Q4) + better message
- ✅ **Pre-push, pre-deploy** — žádný shared-state issue, žádný force-push do remote main
- ✅ **HEAD = `e702e93`** verified `git log --oneline -5` (e702e93 → abd181e → a0ce0d9 → ...)
- ✅ **`3ca01e4` orphaned** — git objekt existuje (`git cat-file -t 3ca01e4` = commit) ale není v history
- ✅ **Lead acknowledged** + saved memory rule per dispatch — NENÍ blocker

**EVZEN poznámka pro KONTROLOR §11:** QA report napsal "implementator amended commit (`git commit --amend`)". Skutečnost je jemnější — `reset --soft + recommit` ne `commit --amend`. Funkční rozdíl ≈ 0 (oba způsoby vytvoří new SHA s rozšířenou content). Žádný impact na verdict.

---

## 13. Observation (non-blocking)

**OBS-1 — Internal consistency hint:** Rok page (#132 sister fix) STÁLE má pre-existing defensive guards `if (!brandData) notFound()` + `if (!modelData) notFound()` na řádcích 95-100, zatímco model page (#149) je má removed per Q1 A2a strategy.

**NENÍ to #149 issue:**
- Q1 explicitly approved A2a pouze pro **model page** scope
- Implementator správně NEPROVEDL pre-emptive rok page cleanup (Q5 spirit no-scope-creep respect)
- Pokud lead jednou chce internal consistency cleanup pro rok page, byl by to separátní future task #149c
- Plán Q1 wording "consistent s #132 lessons learned" je internally consistent — odkazuje na lesson o A2a clean approach, NE na rok page state

**Žádná akce required.** Toto je pure observation pro lead's mental model, ne finding.

---

## 14. Verdict — final

### ✅ **APPROVED**

**Commit `e702e93` doslovně implementuje plan-task-148 §10 LEAD DECISIONS Q1-Q5 a věrně dodává #149 model page dynamicParams fix per dispatch scope.**

- ✅ Core fix: `dynamicParams = false` + Next.js #63483 comment
- ✅ Q1 A2a cleanup: 2 dead guards removed, 2 non-null `!` added
- ✅ Q2: unused `notFound` import smazán
- ✅ Q4: e2e EXTRA-3 hard `expect(404)` v same commit
- ✅ Q5: žádný scope creep — kategorie untouched, žádný #149b TaskCreate
- ✅ Pattern match #132 sister fix
- ✅ SSG 1212 unchanged
- ✅ 7 deletions all explicitly schválené v Q1+Q2
- ✅ 51 model pages dále accessible (žádné skryté stránky)
- ✅ KONTROLOR (#150 QA) 0 findings cross-validated
- ✅ Lint 0 errors / TSC 0 errors / baseline 543 warnings preserved

**1 OBSERVATION non-blocking:** Rok page (#132) má pre-existing defensive guards — NENÍ #149 issue, Q1 scope-limited na model page. Pokud chce lead future internal consistency cleanup, byl by to separátní task. Žádná akce required.

**Žádný blocker. Žádný mismatch. Žádný unauthorized scope creep. Žádné silent deletions.**

---

**EVZEN signature:** ✅ APPROVED — 0 findings, 1 observation (non-blocking). Identický verdict s sister review `review-task-151-149-evzen.md`.
