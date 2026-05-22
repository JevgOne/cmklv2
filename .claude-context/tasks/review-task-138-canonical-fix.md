# EVZEN REVIEW #138 — #135 Canonical URL Fix (#127)

**Reviewer:** evzen-the-king (READ-ONLY task controller)
**Reviewed commits:** `a5dadb4` (fix) + `542a084` (docs)
**Branch:** `main`
**Date:** 2026-04-07
**Plan ref:** `.claude-context/tasks/plan-task-127-canonical-fix.md`
**Impl ref:** `.claude-context/tasks/impl-task-135-canonical-fix.md`
**QA ref:** `.claude-context/tasks/qa-task-137-canonical-fix.md`
**Predecessor EVZEN review:** `.claude-context/tasks/review-task-134-87b-bugfixes.md` (#134)

---

## VERDICT

### ✅ **APPROVED** (0 findings)

Implementace #135 doslovně řeší globální SEO bug #127 dle Strategy A z plánu.
Helper `lib/canonical.ts` je čistý, testovaný (14/14), správně importovaný v 86
souborech. Root layout `app/layout.tsx` má `alternates.canonical` odstraněn
s explanatory komentářem. AC1-AC23 ✅. Q1-Q5 lead overrides všechny respektovány.
Out-of-scope deferrals (`#127b` subdomain canonical, `BASE_URL` duplikace
v `app/layout.tsx:14`) jsou explicitně dokumentovány v impl + qa reportech a
legitimní.

**Doporučení team-leadovi:** Dispatch test-chrome final verification SEKVENČNĚ
po této review (per task instruction).

---

## 0. Doslovnost — co lead/plánovač skutečně chtěl

Lead-aprovované požadavky z `plan-task-127-canonical-fix.md`:

| # | Lead decision | Implementováno |
|---|---|---|
| Q1 | Apex domain only, `#127b` subdomain canonical defer | ✅ helper imports `BASE_URL` z `lib/seo-data` (apex), JSDoc lines 12-13 explicitně říká "Phase 1 (#127a): apex domain only — `https://carmakler.cz/{path}`. Subdomain canonical handling (shop.carmakler.cz/...) je out of scope, defer to #127b." |
| Q2 | Token/gated pages → `robots: noindex` místo canonical | ✅ 3 soubory s `robots: { index: false, follow: false }` |
| Q3 | Cleanup follow-up `#127a`, NEDĚLAT v rámci #135 | ✅ není v scope, BASE_URL duplikace explicitně deferred |
| Q5 (orig Q4) | Layouts NESMÍ exportovat `alternates.canonical` (root cause) | ✅ root layout cleared; 2 controlled výjimky (kariera/recenze) jasně zdokumentované |
| Q5 bonus | Dynamic SEO routes verify-only smoke test | ✅ všech 5 dynamic generateMetadata routes ověřeno |
| Strategy A | Helper + per-page export pattern | ✅ implemented, není ani Strategy B (relative ./) ani Strategy C (root layout dynamic via headers()) |

**Žádná deviace od plánu nenalezena.**

---

## 1. Bug verification — root cause eliminován?

**Bug #127:** Next.js metadata API shallow-merguje `alternates` z root layoutu
do child stránek. Pokud root layout exportuje `alternates: { canonical: BASE_URL }`,
všechny stránky bez vlastního `alternates.canonical` zdědí homepage URL.

**Fix verifikován ve dvou krocích:**

### 1a. Root layout NESMÍ exportovat canonical

`app/layout.tsx` celý prozkoumán:
- Line 16-68 `export const metadata: Metadata = {...}` — žádný `alternates` field
- Line 17 `metadataBase: new URL(BASE_URL)` — zachován (pro openGraph.images relative URL resolve)
- Line 63-67 explanatory komentář:
  ```
  // POZN: `alternates.canonical` SE NEEXPORTUJE v root layoutu — způsobovalo
  // bug #127 (všechny child stránky dědily homepage URL místo svého). Každá
  // indexovaná stránka MUSÍ exportovat vlastní `alternates: pageCanonical("/path")`
  // přes helper z `lib/canonical.ts`. `metadataBase` zachováme — používá se pro
  // resolve relative URLs v openGraph.images apod.
  ```

Grep `canonical` v `app/layout.tsx` → 2 matches, OBA jen v komentáři lines 63+66.
Žádný actual export. ✅

### 1b. Každá indexovaná stránka MÁ vlastní canonical

Grep `pageCanonical` v `app/` → 87 souborů (86 actual usage + 1 root layout
v komentáři). Spot-checked 7 souborů z různých skupin (web/dynamic/dily/marketplace):

| Soubor | Line | Pattern |
|---|---|---|
| `app/(web)/page.tsx` | 22 | `alternates: pageCanonical("/")` |
| `app/(web)/jak-prodat-auto/page.tsx` | 22 | `alternates: pageCanonical("/jak-prodat-auto")` |
| `app/(web)/marketplace/page.tsx` | 19 | `alternates: pageCanonical("/marketplace")` |
| `app/(web)/nabidka/[slug]/page.tsx` | 53 + 73 | `pageCanonical(\`/nabidka/${slug}\`)` (dvě mutually exclusive branches: vehicle vs listing) |
| `app/(web)/dily/znacka/[brand]/page.tsx` | 61 | `pageCanonical(\`/dily/znacka/${brand}\`)` |
| `app/(web)/dily/znacka/[brand]/[model]/page.tsx` | 69 | `pageCanonical(\`/dily/znacka/${brand}/${model}\`)` |
| `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` | 85 | `pageCanonical(\`/dily/znacka/${brand}/${model}/${rok}\`)` |

**Bug root cause eliminován:** child stránky už nedostávají homepage URL — buď
mají vlastní pageCanonical, nebo robots noindex (gated). ✅

---

## 2. Strategy A literal compliance

Plan §3 Strategy A specifikuje:

| Strategy A požadavek | Implementováno |
|---|---|
| Nový helper `lib/canonical.ts` | ✅ 76 LoC, JSDoc, 4 inline guards |
| Helper exportuje `pageCanonical(path)` | ✅ named export line 50 |
| Returns `{ canonical: string }` (Metadata.alternates shape) | ✅ TypeScript signature line 50 |
| Imports `BASE_URL` from `@/lib/seo-data` (single source of truth) | ✅ line 15 |
| Validates `path` starts with `/`, throws Error | ✅ lines 51-55 |
| Strips query string | ✅ lines 58-59 |
| Strips hash fragment | ✅ lines 62-63 |
| Normalizes trailing slash (preserves root `/`) | ✅ lines 66-68 |
| Root path `/` → bare BASE_URL bez trailing slash | ✅ lines 71-73 |
| Per-page export pattern (NE root layout dynamic) | ✅ 86 souborů export own canonical |
| Strategy B (relative `./`) NOT used | ✅ no relative canonical patterns |
| Strategy C (root layout `headers()`-based) NOT used | ✅ root layout je static, no dynamic canonical |

---

## 3. Helper kvalita (`lib/canonical.ts`)

Read full file. 76 LoC celkem (JSDoc + 4 guards + 1 function).

### Code structure

```typescript
export function pageCanonical(path: string): { canonical: string } {
  if (typeof path !== "string" || !path.startsWith("/")) {
    throw new Error(
      `pageCanonical(): path must be a string starting with "/", got: ${JSON.stringify(path)}`,
    );
  }

  // Strip query string
  const queryIndex = path.indexOf("?");
  let normalized = queryIndex >= 0 ? path.slice(0, queryIndex) : path;

  // Strip hash fragment
  const hashIndex = normalized.indexOf("#");
  if (hashIndex >= 0) normalized = normalized.slice(0, hashIndex);

  // Normalize trailing slash
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  // Root path = bare BASE_URL bez trailing slash
  if (normalized === "/") {
    return { canonical: BASE_URL };
  }

  return { canonical: `${BASE_URL}${normalized}` };
}
```

**Hodnocení:**
- ✅ Žádné regex (rychlejší + jednodušší než alternative)
- ✅ Žádné dependencies kromě `BASE_URL` z `lib/seo-data` (single source of truth)
- ✅ JSDoc s reálnými usage examples (static + dynamic generateMetadata)
- ✅ Defense-in-depth: `typeof !== "string"` + `!startsWith("/")` v jednom guardu
- ✅ Error message obsahuje `JSON.stringify(path)` — debug-friendly při PR review
- ✅ Trailing slash check zachovává root `/` (length > 1 condition)
- ✅ Root path special case na konci (bare URL bez slash)
- ✅ Žádné `// TODO`, žádné `// HACK`, žádné mrtvé větvení

**6 EVZEN pravidla — helper:**
1. **Doslovnost:** Implementuje přesně Strategy A z plánu, nic víc, nic míň. ✅
2. **Žádné domnívání:** Validuje runtime input, nezadávané typy → throw. ✅
3. **Žádné měkké hacks:** Žádné regex obcházení, žádné `?? defaults`, žádné `try/catch` swallow. ✅
4. **Defense-in-depth:** Runtime guard pro JS callers (TypeScript by mohlo prosvitnout `as any`). ✅
5. **Vzpoura proti zkratkám:** Nevolá `metadataBase` shortcut (Next.js native), místo toho explicit absolute URL → fail-loud při copy-paste chybě. ✅
6. **Final verdict respect:** Helper nedělá nic mimo scope (žádný subdomain handling, žádný pre-render side effects). ✅

---

## 4. Test pokrytí (`__tests__/lib/canonical.test.ts`)

Read full file. **14 testů**, všechny passing dle qa report (155/155).

| # | Test | Typ | Verifies AC |
|---|---|---|---|
| 1 | `/` → bare BASE_URL | happy | AC7 |
| 2 | `/dily` → BASE_URL+/dily | happy | AC1 |
| 3 | `/dily/znacka/skoda` (nested) | happy | AC1 |
| 4 | `/dily/znacka/skoda/octavia/2018` (3-segment) | happy | AC18 |
| 5 | `/dily/` → strip trailing slash | edge | AC6 |
| 6 | `/dily?utm_source=foo` → strip query | edge | AC4 |
| 7 | `/dily#section` → strip hash | edge | AC5 |
| 8 | `/dily?foo=bar#anchor` → strip both | edge | AC4+AC5 |
| 9 | `pageCanonical("dily")` → throw | error | AC3 |
| 10 | `pageCanonical("")` → throw | error | AC3 |
| 11 | `pageCanonical("https://...")` → throw | error | AC3 |
| 12 | `pageCanonical(null)` → throw (`@ts-expect-error`) | error | AC3 |
| 13 | `pageCanonical("/dily/značka/škoda")` (real diakritika) | edge | AC1 |
| 14 | Returns `{ canonical: string }` shape | type | AC2 |

**Code review fixes** (per impl report) byly aplikovány:
- ✅ Duplicate root test (původně tested 2x) → odstraněn
- ✅ Misleading "diakritika" test s ASCII path → rewritenut s real `/dily/značka/škoda`

`vi.mock` fixes BASE_URL na `"https://carmakler.cz"` pro deterministické testy
napříč env vars (line 4-6). ✅

**Trace edge case `/dily/?foo=bar#anchor`** (kombinace všech 3 normalizací):
1. `queryIndex = 6` → `normalized = "/dily/"`
2. `hashIndex of "/dily/" = -1` → no change
3. `length 6 > 1 && endsWith("/")` → `normalized = "/dily"`
4. Not root → return `https://carmakler.cz/dily` ✅

Test #8 cover this exact pattern. ✅

---

## 5. AC1-AC23 cross-check (KONTROLOR's table)

KONTROLOR řekl 23/23 ✅. EVZEN cross-check via direct file reads:

| AC | Description | Verified by | Status |
|---|---|---|---|
| AC1 | `pageCanonical(path)` exported | `lib/canonical.ts:50` | ✅ |
| AC2 | Returns `{ canonical: string }` shape | TypeScript signature + test #14 | ✅ |
| AC3 | Throws Error pokud path nezačíná `/` | `lib/canonical.ts:51-55` + tests #9-12 | ✅ |
| AC4 | Strips query string | `lib/canonical.ts:58-59` + tests #6, #8 | ✅ |
| AC5 | Strips hash fragment | `lib/canonical.ts:62-63` + tests #7, #8 | ✅ |
| AC6 | Trailing slash normalizace (preserves root) | `lib/canonical.ts:66-68` + test #5 | ✅ |
| AC7 | Root `/` → bare BASE_URL | `lib/canonical.ts:71-73` + test #1 | ✅ |
| AC8 | Imports BASE_URL z `@/lib/seo-data` | `lib/canonical.ts:15` | ✅ |
| AC9 | Unit tests cover happy + edge + error | 14 tests, vitest 14/14 | ✅ |
| AC10 | `app/layout.tsx` no `alternates.canonical` | `app/layout.tsx:16-68` (žádný alternates field) | ✅ |
| AC11 | `app/layout.tsx` keeps `metadataBase` | `app/layout.tsx:17` | ✅ |
| AC12 | Root layout has explanatory comment | `app/layout.tsx:63-67` | ✅ |
| AC13 | Static indexable pages export own canonical | spot-checked 7 souborů | ✅ |
| AC14 | Dynamic generateMetadata return canonical | spot-checked 5 dynamic routes | ✅ |
| AC15 | Gated pages → `robots: noindex` | 3 soubory verified | ✅ |
| AC16 | Layout-level canonical jen pro client-component-child single-page subtrees | kariera + recenze (Q5 controlled exception) | ✅ |
| AC17 | `dily/znacka/[brand]` má vlastní canonical | line 61 | ✅ |
| AC18 | `dily/znacka/[brand]/[model]` má vlastní canonical | line 69 | ✅ |
| AC19 | `dily/znacka/[brand]/[model]/[rok]` má vlastní canonical | line 85 | ✅ |
| AC20 | Build EXIT 0 | qa report 764/764 pages | ✅ |
| AC21 | Lint 0 errors | qa report 0 errors / 543 warnings (baseline +1 sw.js minified, unrelated) | ✅ |
| AC22 | Canonical unit tests pass | 14/14 | ✅ |
| AC23 | Zero hardcoded `canonical: ${BASE_URL}` v `app/` | grep verified (3 patterns, 0 matches) | ✅ |

---

## 6. AC23 grep verification (EVZEN re-run)

```
Grep #1: alternates:\s*\{[^}]*canonical    → 0 matches in app/  ✅
Grep #2: canonical:\s*`?\$\{?BASE_URL      → 0 matches in app/  ✅
Grep #3: canonical:\s*["`']https://        → 0 matches in app/  ✅
Grep #4: pageCanonical                     → 87 files (86 actual + app/layout.tsx comment)  ✅
```

**Counter verification:**
- 86 souborů s actual `pageCanonical()` call = 84 indexable pages + 2 layout
  výjimky (kariera/recenze)
- +1 = `app/layout.tsx` (jen v komentáři jako instrukce)
- = 87 total grep matches

Žádný hardcoded canonical pattern nezůstal. ✅

---

## 7. 3 gated pages — `robots: noindex`

Lead Q2 explicit: token/gated pages NESMÍ mít canonical, místo toho robots noindex.

| Soubor | Line | Pattern | Komentář |
|---|---|---|---|
| `app/(web)/marketplace/dealer/[id]/page.tsx` | 18 | `robots: { index: false, follow: false }` | "Gated marketplace VIP content — not indexable" |
| `app/(web)/notifikace/[token]/page.tsx` | 12 | `robots: { index: false, follow: false }` | "Token-based private page — not indexable" |
| `app/(web)/nabidka/[slug]/platba/page.tsx` | 11 | `robots: { index: false, follow: false }` | "Transactional/private page — not indexable" |

Všechny 3 soubory mají explanatory komentář vysvětlující, proč žádný canonical
(žádné silent skipping). ✅

---

## 8. 2 layout exceptions (Q5 controlled exception)

Lead Q5 zakázal layout-level canonical, ale schválil výjimku pro client-component-child
single-page subtrees.

### `app/(web)/kariera/layout.tsx`

```typescript
// Canonical exportujeme na layout level (kontrolovaná výjimka pravidla Q5):
// /kariera/page.tsx je client component (`"use client"`) a NEMŮŽE exportovat
// vlastní `metadata`. Single-page subtree → layout-level canonical bez rizika
// inheritance leak-u na child routes (žádné child routes nejsou).
export const metadata: Metadata = {
  title: "Kariéra",
  ...
  alternates: pageCanonical("/kariera"),
};
```

### `app/(web)/recenze/layout.tsx`

Identický pattern (line 4-7 komentář, line 17 `pageCanonical("/recenze")`).

**Q5 výjimka literal compliance:**
- ✅ Komentář explicitně volá rule "Q5" by name
- ✅ Justification uvedena: client component child + single-page subtree (no inheritance leak)
- ✅ Both files use same pattern (consistency)

**Risk assessment:** Pokud by někdo přidal `app/(web)/kariera/[id]/page.tsx`
v budoucnu, child by zdědil canonical `/kariera` (bug-prone). Komentář to varuje:
"Single-page subtree → bez rizika inheritance leak-u (žádné child routes nejsou)."
Tato podmínka musí být udržována. Acceptable risk pro #135 scope. ✅

---

## 9. Out-of-scope deferrals — explicitně dokumentované?

### Deferral #1: `#127b` — Subdomain canonical handling

- **Plan §10 explicitly defers** subdomain canonical (`shop.carmakler.cz/...`,
  `inzerce.carmakler.cz/...`) na separate ticket #127b.
- **Helper JSDoc lines 12-13** explicitly states: "Phase 1 (#127a): apex domain
  only — `https://carmakler.cz/{path}`. Subdomain canonical handling
  (shop.carmakler.cz/...) je out of scope, defer to #127b."
- **Impl report §"Out of scope"** explicitly mentions: "**#127b — Subdomain
  canonical handling**. Phase 1 covers apex domain only."

✅ Legitimní deferral, žádný silent omission.

### Deferral #2: `BASE_URL` duplikace v `app/layout.tsx:14`

- `app/layout.tsx:14` má local `const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz"`
  — pre-existující duplikace vůči `lib/seo-data.ts`.
- **Impl report §"Out of scope"** explicitly mentions: "Pre-existing duplicate
  `BASE_URL` at `app/layout.tsx:14` vs `lib/seo-data.ts` — predates #127,
  separate cleanup ticket."
- **QA report** explicitly verifies konzistenci: "Dvě definice jsou konzistentní
  (`https://carmakler.cz`)."
- **Use case:** Local BASE_URL je použit POUZE pro `metadataBase: new URL(BASE_URL)`
  (line 17) a `openGraph.url: BASE_URL` (line 42) — nesouvisí s canonical logikou
  (helper importuje BASE_URL z `lib/seo-data`).

✅ Legitimní deferral, neovlivňuje canonical fix scope. Plan Q3 explicitně řekl
"Cleanup follow-up #127a, NEDĚLAT v rámci #135."

### Deferral #3: Sequential Prisma queries v `nabidka/[slug]/page.tsx:42-65`

- Impl report mentions sequential Prisma queries (vehicle.findFirst then listing.findFirst).
- Není canonical-related, perf-ticket separate.

✅ Legitimní deferral.

---

## 10. Žádné hacks / workarounds / TODOs

EVZEN grep všech read souborů pro red flags:

| Pattern | Found |
|---|---|
| `TODO` v helperu | 0 |
| `FIXME` v helperu | 0 |
| `HACK` v helperu | 0 |
| `// @ts-ignore` | 0 (jen `@ts-expect-error` v test #12 — legitimate runtime guard test) |
| `try/catch` swallow v helperu | 0 |
| `process.env` shortcuts v helperu | 0 |
| Magic strings | 0 (BASE_URL imported, not hardcoded) |
| Fallback defaults | 0 |

**Žádný měkký hack.** Implementace je rovná, deklarativní, fail-loud při copy-paste
chybách. ✅

---

## 11. 6 EVZEN pravidla — finální assessment

### 1. Doslovnost
Implementace doslovně sleduje plán. Strategy A přesně dle §3. AC1-AC23 všechny
pokryté. Q1-Q5 lead overrides všechny respektovány. Žádná kreativní interpretace.
**✅ PASS**

### 2. Žádné domnívání
Helper validuje runtime input (typeof + startsWith). Test #12 explicitly testuje
non-string input (null) s `@ts-expect-error`. Žádné implicit assumptions o input
shape. Žádné silent fallbacks. **✅ PASS**

### 3. Žádné měkké hacks
Žádné regex obcházení, žádné `?? defaults`, žádné try/catch swallow. Helper je
deklarativní, 4 explicit normalizační kroky. Error messages obsahují `JSON.stringify`
pro debug. **✅ PASS**

### 4. Defense-in-depth
Runtime guard pro JS callers (TypeScript samo by mohlo prosvitnout `as any`).
Test #12 verifies. Brand/model `notFound()` guards v dily/znacka templates
zachovány (post-#132 state preserved). **✅ PASS**

### 5. Vzpoura proti zkratkám
Lead měl možnost použít Next.js native `metadataBase` + relative canonical
(simpler), ale Strategy A z plánu volí explicit absolute URL helper s validation.
Důvod: catch typos jako `pageCanonical("dily")` v PR review. Self-documenting.
Implementator nezvolil zkratku Strategy B (relative) ani Strategy C (root layout
dynamic via headers()). **✅ PASS**

### 6. Final verdict respect
KONTROLOR řekl ✅ PASS s 0 findings. EVZEN cross-check potvrzuje 0 findings.
Žádný odpor proti technické správnosti. **✅ PASS**

---

## 12. Procedural finding (post-#134 reflection)

V #134 jsem flag-nul P2 procedural finding (implementator skipped lead's STOP &
ESCALATE rule pro SSG count out of narrowed range). V #135 jsem hledal podobný
pattern.

**Žádný analogický procedural deviation v #135 nenalezen.**

- Plan §5 lists 23 ACs jasně a konzistentně
- Plan §10 jasně defines out-of-scope deferrals
- Implementator dodržel všech 23 ACs + dokumentoval všechny 3 deferrals
- Žádný "narrowed range" hidden v §9 který by implementator mohl přehlédnout
- Plan-task-127 NEMÁ STOP & ESCALATE rule analogický k plan-task-131 §9

Implementator se v #135 řídil literal AC table — což je správný approach.
Procedural compliance perfect. **✅ NO FINDING**

---

## 13. Carmakler-specific compliance

| Pravidlo | Compliance |
|---|---|
| ✅ "Apex domain only" Phase 1 | Helper hardcodes BASE_URL via `lib/seo-data` apex |
| ✅ "Subdomains defer to #127b" | Explicitly noted in JSDoc + impl report + plan |
| ✅ "Wolt model — žádný scraping konkurence" | Canonical fix neovlivňuje scraping policy (irrelevant scope) |
| ✅ "Marketplace VIP gating" | gated/private pages mají robots noindex (consistent s memory note) |
| ✅ "Route protection audit checklist" | Není route protection change (jen metadata) |
| ✅ "Vrakoviště PWA business model" | Není relevant (canonical = web SEO scope) |

---

## 14. Final disposition

### ✅ APPROVED → dispatch test-chrome final verification

**Důvod approval:**
1. Bug #127 root cause eliminován (root layout no longer exports canonical)
2. 86 souborů exportují vlastní pageCanonical (84 indexable + 2 layout výjimky)
3. 3 gated pages mají robots noindex (Q2 compliance)
4. AC1-AC23 všechny ✅ (KONTROLOR + EVZEN cross-check agreement)
5. Q1-Q5 lead overrides všechny respektovány
6. Out-of-scope deferrals (#127b, BASE_URL duplikace, sequential Prisma)
   všechny explicitně dokumentované a legitimní
7. Žádné hacks / workarounds / TODOs / silent omissions
8. Helper kvalita rock-solid (76 LoC, 14 testů, defensive guards)
9. Build/lint/tsc/vitest všechny clean (qa report)
10. Žádný procedural deviation analogický k #134

**Sequence note (per task instructions):**
> APPROVED → test-chrome final verification (SEKVENČNĚ, ne paralelně)

Lead by měl dispatch-nout test-chrome JEDNOHO final verification taska:
- Crawl 5-10 indexable pages (homepage, jak-prodat-auto, marketplace, dily/znacka,
  nabidka/[slug])
- Verify `<link rel="canonical">` v `<head>` ukazuje na correct per-page URL
  (NE homepage URL)
- Verify gated pages (`marketplace/dealer/[id]`, `notifikace/[token]`) mají
  `<meta name="robots" content="noindex">` a žádný canonical link
- Verify Lighthouse SEO score (canonical bug eliminace by měla zlepšit nebo
  zachovat SEO score)

---

## 15. Memory recommendation

**Žádný nový memory entry potřebný.**

V #134 jsem doporučil 2 memory entries (`feedback_stop_escalate_literal.md` +
`feedback_planovac_consistent_ranges.md`). Tyto entries jsou již saved per
team-lead acknowledgment.

V #135 jsem nenašel pattern hodný memory persistence — implementace je čistý
literal compliance bez deviation. Žádný učící moment pro budoucí konverzace.

---

## Verdict (final)

### ✅ **APPROVED — 0 findings**

Commit `a5dadb4` doslovně řeší globální SEO bug #127 dle Strategy A z plánu.
Cross-check všech 23 ACs proběhl successful. Q1-Q5 lead overrides respektovány.
Out-of-scope deferrals legitimní a dokumentované. Procedural compliance perfect.
Helper kvalita rock-solid. KONTROLOR's verdict (PASS, 0 findings) plně potvrzen.

**Doporučení team-leadovi:**
1. Dispatch test-chrome final verification SEKVENČNĚ (per task instructions)
2. Po passing test-chrome, mark #138 + #135 + #137 + plan-127 jako fully closed
3. Defer ticket `#127b` (subdomain canonical) na separate plan after MVP
4. Defer ticket `#127a-cleanup` (BASE_URL duplikace v `app/layout.tsx:14`)
   na separate cleanup window
