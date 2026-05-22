  # EVZEN REVIEW #146 — #87d on-demand revalidation API + 9 H2 brand expansion

**Reviewer:** EVZEN (read-only task controller)
**Datum:** 2026-04-07
**Commit:** `a0ce0d9` — `feat(seo): #87d on-demand revalidation API + 9 brand expansion`
**Plán:** `.claude-context/tasks/plan-task-143-87d-revalidation.md` (1037 LoC)
**QA report:** `.claude-context/tasks/qa-task-145-87d-revalidation.md` (KONTROLOR — ⚠️ PASS with minor)
**Sister review:** `.claude-context/tasks/review-task-146-87d-revalidation.md` (předchozí EVZEN výstup, identický rozsah)

**Read-only:** Žádný source code change. Pouze verifikace.

---

## SOUHRN — Verdict per checklist

| # | Checklist bod (verbatim z dispatch) | Verdict |
|---|---|---|
| 1 | **9 brandů nové** — 9 přesně, ne 8, ne 10 | ✅ PASS |
| 2 | **27 modelů nové** — 3 × 9, přesně 3 per nový brand | ✅ PASS |
| 3 | **Revalidation API existuje** — `app/api/revalidate/parts/route.ts` | ✅ PASS |
| 4 | **API je secured** — `timingSafeEqual` + `REVALIDATE_SECRET` env | ✅ PASS |
| 5 | **Empty body 400** — ne fallback na "revalidate all" | ✅ PASS |
| 6 | **SSG count 1212** vs původní user ask | ✅ PASS (číslo je derivát, ne ask — viz analýza) |
| 7 | **Nic mimo scope** — žádný sitemap/llms/middleware/page edit | ✅ PASS |
| 8 | **`.env.example` má `REVALIDATE_SECRET`** placeholder | ✅ PASS |
| **Lead Decisions Q1-Q7** | All approved verbatim implementováno | ✅ PASS |
| **Žádné deletions** | 1-line "deletion" = jen comment update, žádný brand/model removed | ✅ PASS |
| **Skryté stránky** | Brand pages auto-pickup přes generateStaticParams | ✅ PASS |
| **Verdict** | | ✅ **APPROVED WITH NOTES** |

**Notes:** 1 minor klarifikace dispatch (team-lead H1 verbal recall obsahoval "Mercedes" — actual H1 má **Hyundai**, ne Mercedes; implementace správně použila existing 8 H1 brands). 1 documented MINOR (SSG 1212 borderline LOW) — **lead již explicitly accepted** v commit body, no rework required.

---

## 1. Checklist bod #1 — 9 brandů nové (přesně 9, ne 8, ne 10)

**Read:** `lib/seo-data.ts:1226-1245` (PARTS_BRANDS array post-#87d)

```
8 H1 (existing, untouched):
  skoda, volkswagen, bmw, audi, ford, toyota, hyundai, opel

9 H2 (#87d added):
  alfa-romeo, suzuki, fiat, mini, mitsubishi, jeep, jaguar, dodge, lexus
```

**Total:** 17 brands (8 + 9). Spočítáno: 9 nové entries, ne 8, ne 10. ✅

**Source-of-truth verifikace:**
- Plán §11 Q1 dispatch: *"9 H2 expansion brandů schváleno"*
- Plán §2.8 dispatch dispatch table: 9 brands listed verbatim
- Code: 9 nové entries v `PARTS_BRANDS` array (lines 1235-1245)
- Header comment line 1225: `// Parts brands data — 17 brands (8 H1 priority + 9 H2 expansion #87d)`

**Diakritika check:** Všech 9 H2 brand slugs jsou ASCII-safe (alfa-romeo, suzuki, fiat, mini, mitsubishi, jeep, jaguar, dodge, lexus) — **žádný diakritika redirect risk** (per plán §7 risk #7).

### NOTE — team-lead H1 verbal recall klarifikace

Team-lead dispatch verbatim uvádí: *"H1: BMW, Mercedes, Audi, Škoda, VW, Ford, Toyota, Opel"*

**Skutečnost:** Pre-#87d PARTS_BRANDS pre-existing 8 entries verified read of `git show a0ce0d9~1:lib/seo-data.ts`:
```
{ slug: "skoda", name: "Škoda" },
{ slug: "volkswagen", name: "Volkswagen" },
{ slug: "bmw", name: "BMW" },
{ slug: "audi", name: "Audi" },
{ slug: "ford", name: "Ford" },
{ slug: "toyota", name: "Toyota" },
{ slug: "hyundai", name: "Hyundai" },     ← ne Mercedes
{ slug: "opel", name: "Opel" },
```

**Mercedes NENÍ v H1.** H1 obsahuje **Hyundai**.

**Dopad na review:** ŽÁDNÝ. Implementator korektně extended **existing** 8 H1 brands o 9 H2 (per plán §2.8 + §11 = autoritativní zdroj pravdy). Plán nemluví o "Mercedes" anywhere. Pokud team-lead by chtěl Mercedes přidat, byl by to separátní task #87X (rozšíření H1 z 8 → 9), ne součást #87d. Implementator se držel plánu doslovně.

Toto je verbal-recall ambiguity v dispatch text, ne implementation issue. **Verdikt nezměněn.**

---

## 2. Checklist bod #2 — 27 modelů nové (3 × 9, přesně 3 per nový brand)

**Read:** `lib/seo-data.ts:1520-1817` (PARTS_MODELS_BY_BRAND H2 entries)

| Brand | Modely | Count |
|---|---|---|
| alfa-romeo | giulia, stelvio, giulietta | **3** ✅ |
| suzuki | vitara, swift, s-cross | **3** ✅ |
| fiat | 500, panda, tipo | **3** ✅ |
| mini | cooper, countryman, clubman | **3** ✅ |
| mitsubishi | outlander, asx, lancer | **3** ✅ |
| jeep | renegade, compass, grand-cherokee | **3** ✅ |
| jaguar | xf, f-pace, xe | **3** ✅ |
| dodge | caliber, journey, charger | **3** ✅ |
| lexus | is, rx, nx | **3** ✅ |
| **Total nových** | | **27** ✅ |

**Quantitative verification:** `grep -c "topYears:" lib/seo-data.ts` = **51** = 24 existing (8 H1 × 3) + 27 nových (9 H2 × 3). Math zkontrolovaná.

**Per-brand verification:** Žádný brand nemá 4 modely (Q4 future-scope respect). Žádný brand nemá 2 (under-spec). Distribuce 3-3-3-3-3-3-3-3-3 = exact match.

**Strukturní integrita:**
- Každý nový model má `slug` field
- Každý nový model má `name` field
- Každý nový model má `brandSlug` field matchující parent klíč (verified pro lexus: `brandSlug: "lexus"` line 1799, 1810)
- Každý nový model má `generations` array s minimálně 1 entry
- Každý nový model má `topYears: [year, year, year]` (3 years per model)

**Žádný typo v slugs:** spot-checked alfa-romeo brandSlug field vs parent key — match. Plán §7 risk #5 (brand slug typo, e.g., "alfaromeo" vs "alfa-romeo") **MITIGATED** — žádný typo.

---

## 3. Checklist bod #3 — Revalidation API existuje (`app/api/revalidate/parts/route.ts`)

**Read:** `app/api/revalidate/parts/route.ts` — 165 LoC, NEW file (+164 insertions per commit stat).

**Cesta verifikována:**
- ✅ V `app/api/` (Next.js App Router API)
- ✅ Pod `revalidate/` namespace
- ✅ Scoped `parts/` (NE `/api/revalidate/route.ts` generic)
- ✅ Per Q6 verbatim: *"Endpoint `/api/revalidate/parts/route.ts` (scoped)"*

**Handler exports:**
- ✅ `export async function POST(req: NextRequest)` (line 90)
- ✅ Žádný `GET` / `PUT` / `DELETE` / `PATCH` export
- ✅ `export const runtime = "nodejs"` (line 27 — `revalidatePath` API requires Node.js, ne Edge)
- ✅ `export const dynamic = "force-dynamic"` (line 29 — POST endpoint, nikdy cachovat response)

**Imports:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";          // primary API
import { z } from "zod";                              // schema validation
import { timingSafeEqual } from "node:crypto";        // constant-time compare
import { PARTS_BRANDS, PARTS_MODELS_BY_BRAND, getValidYearsForModel } from "@/lib/seo-data";
```
Žádná external lib mimo standardní Next.js + Zod + node:crypto. Žádný `fs.unlink`, žádný custom cache nuke. ✅

---

## 4. Checklist bod #4 — API secured (`timingSafeEqual` + `REVALIDATE_SECRET`)

### `safeCompare()` implementace (route.ts:47-52)

```typescript
function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
```

**Analýza:**
- ✅ Imports `timingSafeEqual` from `node:crypto` (line 19) — standard secure compare
- ✅ Length check **before** `timingSafeEqual` (REQUIRED: API throws if buffers different lengths)
- ✅ Žádný `===` na secret string (timing attack vector eliminated)
- ✅ Žádný char-by-char loop (timing attack vector eliminated)
- ⚠️ Length check je minor timing side channel pro **délku** secretu — acceptable per industry standard (sama existence/délka secret není sensitive)

### Secret retrieval + verification (route.ts:108-119)

```typescript
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
```

**Defense layers:**
1. ✅ Env var **must exist** — pokud chybí → 500 + log (NE silent accept default)
2. ✅ Secret z env (NE hardcoded)
3. ✅ Constant-time compare (NE `===`)
4. ✅ Auth fail logs caller IP (forensics trail)
5. ✅ Žádný `process.env.REVALIDATE_SECRET!` non-null assertion (TS unsafe shortcut)

**Per Q5 verbatim:** *"REVALIDATE_SECRET separátní od CRON_SECRET (different threat model)."* — code reads `REVALIDATE_SECRET` (NE `CRON_SECRET`) ✅

---

## 5. Checklist bod #5 — Empty body → 400 (ne fallback)

### Q3 implementace (route.ts:121-130)

```typescript
// 4. Require at least brand (lead Q3 — empty body → 400, žádný full /dily fallback)
if (!parsed.data.brand) {
  console.warn(
    `[revalidate] empty scope from ${req.headers.get("x-forwarded-for") || "unknown"}`
  );
  return NextResponse.json(
    { error: "at least one of brand/model/year required" },
    { status: 400 }
  );
}
```

**Verifikace:**
- ✅ Comment doslova odkazuje "lead Q3"
- ✅ Empty body (jen `{ secret: "..." }`) → `parsed.data.brand` undefined → 400
- ✅ Explicit error message: `"at least one of brand/model/year required"`
- ✅ **ŽÁDNÝ fallback** na `revalidatePath('/')` nebo `revalidatePath('/dily')` na empty
- ✅ IP loggován (forensics) — recurring empty-body requests by mohly indikovat probing
- ✅ Year alone (bez brand+model) → also 400 (Zod refinement line 38-45 enforces year→model→brand chain)

**Cross-check Zod refinements (route.ts:38-45):**
```typescript
.refine((data) => !data.model || !!data.brand, { message: "model requires brand" })
.refine((data) => !data.year || !!data.model, { message: "year requires model" });
```
✅ Logical hierarchy enforced: year requires model, model requires brand. Tj. `{ year: 2018 }` alone → Zod fail → 400 (line 100-106). Plus brand required check (line 121-130) jako secondary safeguard.

**Defense-in-depth:** Empty body is rejected at TWO layers:
1. Layer 1: Zod refinements (line 38-45) reject `{ year: X }` or `{ model: X }` without parent
2. Layer 2: Explicit `if (!parsed.data.brand)` (line 122) catches `{ secret: "..." }` (žádný field)

---

## 6. Checklist bod #6 — SSG count 1212 vs původní user ask

**Team-lead's vlastní framing v dispatch:**
> *"SSG count 1212 — v borderline LOW pásmu. Lead (já) explicitly accepted with rationale v commit body. Tvoje otázka: odpovídá to původnímu zadání od uživatele? Původní ask nezmiňoval číselný SSG target — jen '9 H2 brand expansion'. Číslo 1212 je derivát toho, ne ask."*

### EVZEN literal-compliance analýza

**Co byl user ask (verbatim):**
- "9 H2 brand expansion" → ✅ DELIVERED (9 brands × 3 models = 27 models, verified bod #1 + #2)
- "On-demand revalidation API" → ✅ DELIVERED (route.ts existuje, secured)
- "3 modely per nový brand" → ✅ DELIVERED (Q4)

**Co user ask NEZAHRNOVAL:**
- ❌ Konkrétní SSG count target (žádné "1500 nebo 2000" v původním asku)
- ❌ Specifický CI build time target

**SSG count = derivát:**
SSG count je *vedlejší metric* vyplývající z model count × generation years × topYears. Plán **dispatch** (před lead decisions) zmínil "verify SSG count vyroste z ~764 na ~1500-2000" jako ESTIMATE/STRETCH GOAL, ne hard requirement. Plán Q1 (line 943-955) tento estimate REKLASIFIKOVAL na 1250-1700 jako "realistic" + lead approved. Q1 verbatim:

> *"SSG range 1250-1700 (AC10 + §9 STOP & ESCALATE). Moje původní 1500-2000 byl stretch guess — tvoje math derivation je přesnější."*

**1212 = realita:**
- Hard floor: 1100 (STOP & ESCALATE pod) → 1212 > 1100 ✅
- Hard ceiling: 2000 (STOP & ESCALATE nad) → 1212 << 2000 ✅
- Borderline LOW pásmo: 1100-1249 → 1212 in range
- Acceptable range: 1250-1700 → 1212 -38 pod (3% gap)
- Plán §9 line 693 protokol pro borderline LOW: *"flagni v PR description, lead decide"* ← implementator přesně toto udělal
- Commit message: *"SSG count: 1212 (borderline LOW per plan AC10 range 1100-1249)"* + root cause analýza

### Lead acceptance status

Team-lead **EXPLICITLY ACCEPTED** v dispatch: *"Lead (já) explicitly accepted with rationale v commit body."*

**EVZEN role:** Verifikovat, že implementace **odpovídá doslovnému user asku**. User ask = "9 H2 brand expansion" + "revalidation API" + "3 modely/brand". ✅ ALL DELIVERED.

SSG count je derivát dat (modely × generation years), ne primární deliverable. Implementator držel:
1. Primary deliverable (revalidation API) ✅
2. Secondary deliverable (9 brand expansion) ✅
3. Q4 constraint (3 modely/brand, NE 4) ✅
4. Historical accuracy (NE backwards-extending generation ranges to game SSG count) ✅

**Verdict bod #6:** ✅ **PASS.** 1212 je legitimní výsledek věrné implementace user asku, NE deviation. Lead-accepted. EVZEN bod uzavírá.

---

## 7. Checklist bod #7 — Nic mimo scope

**Commit `a0ce0d9` file delta (verified `git show --stat`):**

```
.env.example                      |   3 +
app/api/revalidate/parts/route.ts | 164 +++++++++++++++++++++ (NEW)
lib/seo-data.ts                   | 294 +++++++++++++++++++++++++++++++++++++-
3 files changed, 460 insertions(+), 1 deletion(-)
```

**Exactly 3 soubory.** Žádný 4. soubor.

### Files NOT touched (auto-pickup confirmed)

| Soubor | Status | Důvod |
|---|---|---|
| `app/sitemap.ts` | ❌ NOT touched | Auto-pickup imports `PARTS_BRANDS` + `PARTS_MODELS_BY_BRAND` (per plán §2.8). +117 sitemap entries delta = automatic |
| `app/robots.ts` | ❌ NOT touched | Žádný brand-specific robots rule, žádný change needed |
| `public/llms.txt` | ❌ NOT touched | LLM ingestion = static, žádný brand expansion needed (per plán §2.8) |
| `middleware.ts` | ❌ NOT touched | Diakritika redirect = generic, ASCII-safe brands ne potřebují edit |
| `app/(web)/dily/znacka/[brand]/page.tsx` | ❌ NOT touched | Dynamic params auto-resolves přes `generateStaticParams` (uses PARTS_BRANDS) |
| `app/(web)/dily/znacka/[brand]/[model]/page.tsx` | ❌ NOT touched | Same — auto-resolves přes PARTS_MODELS_BY_BRAND |
| `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` | ❌ NOT touched | Same — auto-resolves přes getValidYearsForModel |
| `next.config.ts` | ❌ NOT touched | Žádný cache/runtime config change |
| `package.json` | ❌ NOT touched | Žádná new dependency (zod, node:crypto already exist) |
| `prisma/schema.prisma` | ❌ NOT touched | #87d je čistě SSG/cache, žádný DB schema change |
| Existing tests | ❌ NOT touched | Per AC15 — endpoint testing deferred, no regression tests need update |

### Files touched — scope verification

**1. `.env.example` (+3 lines):**
- Pouze přidán `REVALIDATE_SECRET` line + komentář
- Žádná modifikace `CRON_SECRET`, `DATABASE_URL`, atd.
- ✅ Q5 compliance (separate from CRON_SECRET)

**2. `app/api/revalidate/parts/route.ts` (+164 lines, NEW):**
- Nový soubor, žádný předchozí stav k overwriteu
- Pouze 1 endpoint, pouze POST handler

**3. `lib/seo-data.ts` (+294 lines, -1 line):**
- 1-line "deletion" verified (`git show a0ce0d9 -- lib/seo-data.ts | grep '^-'`):
  ```
  -// Parts brands data
  ```
  Toto je old header comment. Replaced (line 1225) s:
  ```
  +// Parts brands data — 17 brands (8 H1 priority + 9 H2 expansion #87d)
  ```
- ✅ **NENÍ to brand/model deletion.** Pouze comment update (per AC8 — header comment update mandatory).
- 9 nové PARTS_BRANDS entries (lines 1235-1245)
- 27 nové PARTS_MODELS_BY_BRAND entries (rozsah 1520-1817)
- Žádná modifikace existujících 8 H1 brandů
- Žádná modifikace existujících 24 H1 modelů
- Žádná modifikace `BRANDS`, `BODY_TYPES`, `PRICE_RANGES`, `CITIES`, `getValidYearsForModel()` exports
- Žádná modifikace existujících type definitions (`PartsModelGeneration`, `PartsModelData`)

**Verdict bod #7:** ✅ **PASS.** 0 mimo scope. Žádný "while-i-was-at-it" cleanup. Žádný refactor. Diff minimální per plán §3 deliverables.

---

## 8. Checklist bod #8 — `.env.example` má `REVALIDATE_SECRET` placeholder

**Read:** `.env.example:73`

```
REVALIDATE_SECRET=     # openssl rand -hex 16 — pro on-demand SSG cache invalidation
```

**Verifikace:**
- ✅ Klíč `REVALIDATE_SECRET` přítomen
- ✅ Placeholder hodnota prázdná (NE skutečný secret committed)
- ✅ Komentář specifikuje generation method (`openssl rand -hex 16`)
- ✅ Komentář vysvětluje účel (`pro on-demand SSG cache invalidation`)
- ✅ Separátní řádek od `CRON_SECRET` (line 70 — verified)
- ✅ Q5 compliance (different threat model, separate secrets)

**Security check:** Žádný skutečný secret v `.env.example`. `.env.local` je git-ignored (`.gitignore`), runtime secret se generuje per-environment. Plán §7 risk #10 (REVALIDATE_SECRET committed accidentally) **MITIGATED**.

---

## 9. Lead Decisions Q1-Q7 verbatim cross-check

| Q | Plán literal | Code implementace | ✓ |
|---|---|---|---|
| Q1 | SSG range 1250-1700 (NOT 1500-2000) | 1212 = borderline LOW (1100-1249), korektně flagged v commit msg per §9 | ✅ procedurálně compliant, lead-accepted |
| Q2 | No `PARTS_BRAND_SLUGS` export, ad hoc `.map()` | Pouze `PARTS_BRANDS` exported, `route.ts:133` používá `.some()` lookup | ✅ |
| Q3 | Empty body → 400 Bad Request | `route.ts:121-130` explicit 400 + IP log | ✅ |
| Q4 | 3 modely/brand × 9 = 27 modelů | 51 = 24 existing + 27 nových (3×9), žádný brand 4 modely | ✅ |
| Q5 | `REVALIDATE_SECRET` separátní od `CRON_SECRET` | `.env.example:73` separate entry, `route.ts:109` reads `REVALIDATE_SECRET` | ✅ |
| Q6 | `/api/revalidate/parts/route.ts` (scoped) | Soubor existuje na očekávané cestě | ✅ |
| Q7 | `/dily` root revalidate při bulk YES | `route.ts:84` v Case 3 only, comment explicitně odkazuje "lead Q7" | ✅ |

**Code comment cross-references:**
- `route.ts:6` (header): *"different threat model, lead Q5"* + *"empty body → 400 Bad Request (lead Q3)"* + *"+ /dily root (lead Q7)"*
- `route.ts:83`: *"// /dily landing může obsahovat 'popular brands' — refresh při bulk (lead Q7)."*
- `route.ts:121`: *"// 4. Require at least brand (lead Q3 — empty body → 400, žádný full /dily fallback)"*

Implementator EXPLICITLY referenced lead decisions v code comments. To je transparent traceability — žádná interpretace, žádný deniability gap.

---

## 10. Skryté stránky check (per EVZEN pravidla)

**Plán §2.8 + #87b runtime confirms:**
- `app/(web)/dily/znacka/[brand]/page.tsx` → `generateStaticParams()` returns `PARTS_BRANDS.map(b => ({ brand: b.slug }))`
- `app/(web)/dily/znacka/[brand]/[model]/page.tsx` → `generateStaticParams()` flattens `PARTS_MODELS_BY_BRAND`
- `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` → uses `topYears` field

**Ergo:** Po přidání 9 brandů + 27 modelů, sitemap auto-pickup vede k:
- 9 nových brand pages (dostupné z `/dily/znacka/alfa-romeo`, atd.)
- 27 nových model pages (dostupné z `/dily/znacka/alfa-romeo/giulia`, atd.)
- 81 nových year pages (27 × 3 topYears)

**Žádný brand/model ne-skrytý** — všechny dostupné přes Next.js SSG + sitemap.xml + auto-link discovery. ✅

**QA report §AC11 confirms:** *"Sitemap delta +117 entries (v range 110-130)"* ✅

---

## 11. Žádné deletions verification

**Per EVZEN pravidla:** *"Nic se nemaže bez schválení — ověř že žádný existing brand/model nezmizel."*

**Verifikace:**
```bash
git show a0ce0d9 -- lib/seo-data.ts | grep -cE '^-[^-]'
→ 1
```

**1 deletion line:**
```
-// Parts brands data
```

**Tato deletion je:**
- ❌ NE brand removal
- ❌ NE model removal
- ❌ NE function removal
- ❌ NE export removal
- ✅ Pouze comment text update (replaced same line s "17 brands" verzí)

**Cross-check pre-#87d state:**
```typescript
// Pre-#87d (verified `git show a0ce0d9~1:lib/seo-data.ts`):
// Parts brands data
export const PARTS_BRANDS = [
  { slug: "skoda", name: "Škoda" },
  { slug: "volkswagen", name: "Volkswagen" },
  { slug: "bmw", name: "BMW" },
  { slug: "audi", name: "Audi" },
  { slug: "ford", name: "Ford" },
  { slug: "toyota", name: "Toyota" },
  { slug: "hyundai", name: "Hyundai" },
  { slug: "opel", name: "Opel" },
];
```

**Post-#87d state (verified `lib/seo-data.ts:1226-1245`):** Same 8 H1 brands, plus 9 H2 brands. Žádný H1 brand removed. Žádný H1 brand renamed. Žádný H1 brand reordered.

**Existujících 24 modelů:** Verified read of `lib/seo-data.ts:1266-1519` shows skoda/volkswagen/bmw/audi/ford/toyota/hyundai/opel models pre-#87d untouched (8 brands × 3 models = 24).

**Verdict:** ✅ ŽÁDNÉ deletions. Pouze 1 comment update. Žádný existing brand/model nezmizel.

---

## 12. EVZEN 6 pravidla — code quality assessment

### 1. Doslovnost (literal compliance)
✅ Q1-Q7 implementováno doslovně. Code comments EXPLICITLY odkazují "lead Q3", "lead Q5", "lead Q7" — žádná interpretace, žádná deniability. Plán §11 = single source of truth respected.

### 2. No assumptions (žádné domněnky)
✅ Implementator nepřidal:
- Žádný rate limiting (mimo plán)
- Žádný IP whitelist (mimo plán; pouze logging at auth fail = forensics)
- Žádný metrics/tracing instrumentation (mimo plán)
- Žádný redirect handling pro `revalidatePath()` exceptions (handled per-path try/catch dle §3.1)
- Žádné cache busting nad rámec `revalidatePath` API
- Žádné Mercedes brand (verbal recall ambiguity dispatch — implementator se držel plánu, ne verbal slip)

### 3. No soft hacks (žádné hacky)
✅ Code je clean:
- `timingSafeEqual` z `node:crypto` (NE custom char compare)
- `revalidatePath` z `next/cache` (NE manual `fs.unlink` na `.next` cache directory)
- Zod schema (NE manual `if (typeof body.brand !== 'string')` validation)
- Standard `NextResponse.json()` (NE custom Response constructor)
- Per-path try/catch (NE try/catch wrapping celé pole = silent partial failure mask)
- Length check before `timingSafeEqual` (NE `try { timingSafeEqual } catch`)

### 4. Defense-in-depth (vícevrstvá obrana)
✅ 7-step request pipeline (route.ts:90-163):
1. JSON parse fail → 400 (ne 500 crash)
2. Zod schema fail → 400 + issues array
3. Missing env REVALIDATE_SECRET → 500 + console.error (ne silent accept)
4. Wrong secret → 401 + IP log (constant-time compare)
5. Missing brand → 400 + IP log (Q3)
6. Unknown brand → 404 (distinguishes "valid input, unknown" od "malformed")
7. Per-path try/catch → partial failures collected, HTTP 500 jen pokud ALL fail

Žádný short-circuit. Žádný layer skip. Každá vrstva validuje nezávisle.

### 5. Resistance to shortcuts (odpor k zkratkám)
✅ Implementator NEPOUŽIL shortcuts:
- ❌ `===` na secret (timing attack vector) → použil `timingSafeEqual`
- ❌ `revalidatePath('/')` full nuke → buildovaný path list scoped
- ❌ Catch-all 200 OK return → real status codes 400/401/404/500/200
- ❌ `if (errors.length > 0) return 500` → `if (errors.length > 0 && revalidated.length === 0)` (nuanced HTTP semantic)
- ❌ `process.env.REVALIDATE_SECRET!` non-null assertion → explicit `if (!expectedSecret)` check + 500

### 6. Final verdict respect (respekt k final verdiktu)
✅ Implementator respektoval lead Q1-Q7 ALL APPROVED. Žádný silent override. Žádný "I think the lead would prefer X". V borderline-LOW situaci (1212) flagoval v commit message + nechal lead rozhodnout per §9 protocol. Žádný "I'll just add 4th model to fix this" override. Lead-accepted post-facto.

---

## 13. Sister review identity check

**Existuje předchozí EVZEN review file:** `.claude-context/tasks/review-task-146-87d-revalidation.md`

Toto je předchozí EVZEN výstup pro stejný task #146. Tento aktuální file (`review-task-146-87d-evzen.md`) je **explicitně requested team-leadem** ve znovu-dispatched task. Oba files obsahují identický rozsah verifikace, identický verdict (✅ APPROVED). Tento file je strukturovaný **explicitně dle 8-bodového checklistu** z aktuálního dispatch (oproti původnímu strukturovanému dle 5-bodového dispatch).

**No deviation between sister reviews.** Identický verdict, identické nálezy, identický recommend.

---

## 14. Verdict

### ✅ **APPROVED WITH NOTES**

**Commit `a0ce0d9` doslovně implementuje plán-task-143 §11 LEAD DECISIONS Q1-Q7 a věrně doručuje user ask "9 H2 brand expansion + on-demand revalidation API + 3 modely/brand".**

**8 checklist bodů:**
1. ✅ 9 brandů nové (přesně 9) — alfa-romeo, suzuki, fiat, mini, mitsubishi, jeep, jaguar, dodge, lexus
2. ✅ 27 modelů nové (3 × 9, přesně 3 per nový brand)
3. ✅ Revalidation API existuje na `/api/revalidate/parts/route.ts`
4. ✅ API secured (`timingSafeEqual` + `REVALIDATE_SECRET` env, defense-in-depth)
5. ✅ Empty body → 400 (Q3, žádný fallback, Zod refinements jako secondary safeguard)
6. ✅ SSG count 1212 — derivát ne ask, lead-accepted (per dispatch verbatim)
7. ✅ Nic mimo scope (3 soubory, žádný sitemap/llms/middleware/page edit)
8. ✅ `.env.example` má REVALIDATE_SECRET placeholder s komentářem

**Lead Decisions Q1-Q7:** All implementováno doslovně, code comments cross-reference lead decisions explicitly.

**Žádné deletions:** 1-line "deletion" je pouze comment update, žádný brand/model removed. Existujících 8 H1 brandů + 24 H1 modelů untouched.

**Žádné skryté stránky:** 9 brand pages + 27 model pages + 81 year pages všechny dostupné přes auto-pickup `generateStaticParams()`.

**Code quality:** Production-grade. Defense-in-depth 7-step pipeline, constant-time secret compare, per-path try/catch, scoped path emission, Zod validation s 2 refinements. Žádné shortcuts, žádné assumptions, žádné soft hacks.

**Notes:**

1. **Dispatch H1 verbal recall ambiguity:** Team-lead's dispatch text uvedl H1 jako "BMW, Mercedes, Audi, Škoda, VW, Ford, Toyota, Opel". Skutečný pre-#87d PARTS_BRANDS obsahuje **Hyundai**, ne Mercedes. Implementator se správně držel plánu §2.8 (autoritativní), ne verbal slip v dispatch. Žádná akce required — pokud team-lead chce Mercedes přidat, byl by to separátní task #87X (rozšíření H1 z 8 → 9 brands), ne součást #87d.

2. **MF-1 (SSG 1212 borderline LOW):** Lead-accepted v commit body per dispatch. Procedurálně compliant per plán §9 ("flag in PR + lead decide" pásmo, NIKOLI STOP & ESCALATE). Číslo je derivát historicky přesných generation ranges, ne user ask. Žádný rework required.

**No blocker. No mismatch. No unauthorized scope creep. No silent deletions.**

---

**EVZEN signature:** ✅ APPROVED WITH NOTES — implementace věrně doručuje doslovný user ask, lead decisions Q1-Q7 doslovně implementovány, žádný blocker, žádné rework potřebné.
