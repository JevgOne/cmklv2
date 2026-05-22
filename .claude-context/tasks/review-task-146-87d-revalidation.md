  # EVZEN REVIEW #146 — #87d Revalidation API + 9 Brand Expansion (commit `a0ce0d9`)

**Reviewer:** EVZEN (read-only task controller)
**Datum:** 2026-04-07
**Commit:** `a0ce0d9` — feat(seo): #87d on-demand revalidation API + 9 brand expansion
**Plán:** `.claude-context/tasks/plan-task-143-87d-revalidation.md` (1037 LoC, §11 LEAD DECISIONS Q1-Q7 verbatim)
**QA report:** `.claude-context/tasks/qa-task-145-87d-revalidation.md` (KONTROLOR — ⚠️ PASS with 1 minor)
**Dispatch verbatim:** *"Evžen review #87d revalidation API + 9 brand expansion (commit a0ce0d9) proti doslovnému zadání uživatele. Kontrola: (1) plán §11 LEAD DECISIONS Q1-Q7 verbatim compliance, (2) SSG count 1212 vs original user ask, (3) 9 H2 brandy + 3 modely/brand = 27 modelů (zadání), (4) revalidation API scope /dily/znacka/* only, (5) nic mimo scope."*

---

## SOUHRN

| Dispatch bod | Verdict | Detail |
|---|---|---|
| **(1) §11 Q1-Q7 verbatim compliance** | ✅ PASS | All 7 lead decisions implementovány doslovně |
| **(2) SSG count 1212 vs user ask** | ⚠️ MINOR (procedurálně OK) | 1212 = borderline LOW (range 1100-1249), implementator korektně flagoval v commit message per §9 protokol — NENÍ STOP & ESCALATE |
| **(3) 9 H2 brandy × 3 modely = 27** | ✅ PASS | 17 brands = 8 H1 + 9 H2; 51 models = 24 + 27; každý nový brand má přesně 3 modely |
| **(4) Scope /dily/znacka/* only** | ✅ PASS | `buildPathsToRevalidate()` emituje pouze `/dily/znacka/{brand}[/{model}[/{year}]]` + `/dily` root pri brand-bulk (Q7) |
| **(5) Nic mimo scope** | ✅ PASS | 3 soubory: route.ts (NEW 164), seo-data.ts (+294), .env.example (+3) |
| **6 EVZEN pravidla** | ✅ PASS | Doslovnost / no-assumptions / no soft hacks / defense-in-depth / no-shortcuts / final verdict respect |
| **Verdict** | ✅ **APPROVED** (s 1 documented MINOR — non-blocking, lead decides) | |

---

## 1. §11 LEAD DECISIONS Q1-Q7 verbatim compliance (dispatch bod 1)

Plán §11 (lines 938-1009) je **autoritativní zdroj pravdy** — overrides §8 phrasing. Cross-check vs. commit `a0ce0d9`:

### ✅ Q1 — SSG range 1250-1700 (NOT 1500-2000)

> Plán Q1: *"SSG range 1250-1700 (AC10 + §9 STOP & ESCALATE). Hard floor 1100, hard ceiling 2000."*

**Implementace:** SSG count = **1212** ⚠️ borderline LOW (per §5 line 693: *"SSG count 1100-1249 → borderline LOW — flagni v PR description, lead decide"*).

**Procedurální kontrola:**
- Hard floor 1100 → 1212 nad ✅ (NENÍ STOP & ESCALATE)
- Acceptable range 1250-1700 → 1212 pod ⚠️
- Borderline LOW range 1100-1249 → 1212 v range ✅
- Implementator korektně flagoval v commit message: *"SSG count: 1212 (borderline LOW per plan AC10 range 1100-1249)"* + root cause analýza (avg ~15.3 years/model vs expected ~20+, historical accuracy preserved)

**Per plan §9 protokol** (line 693): borderline LOW = **flag in PR + lead decide**, NIKOLI STOP & ESCALATE. Tj. implementator postupoval správně.

**EVZEN doslovnost check:** Plán má ÚMYSLNĚ konzistentní ranges napříč §0/§5/§7/§9 (memory feedback compliance — viz line 40, 908: *"identical acceptable range 1250-1700 + identical hard floor/ceiling 1100/2000. Žádný §5 vs §9 mismatch."*). Toto NENÍ analogické #134 deviation (kde §5 a §9 měly rozdílné prahy a implementator interpretoval širší range jako pass).

**Závěr Q1:** ✅ **PROCEDURÁLNĚ COMPLIANT.** 1212 je in borderline-LOW pásmu, ne v acceptable, ale plán explicitly tento případ řeší jako "flag + proceed". Lead rozhoduje post-facto.

### ✅ Q2 — NO `PARTS_BRAND_SLUGS` export (ad hoc `.map()`)

> Plán Q2: *"Žádný PARTS_BRAND_SLUGS export, ad hoc `.map(b=>b.slug)`."*

**Implementace:** `lib/seo-data.ts:1226-1245` exportuje pouze `PARTS_BRANDS`, žádný `PARTS_BRAND_SLUGS` export. Verifikace v `route.ts:133`:
```typescript
const brandExists = PARTS_BRANDS.some((b) => b.slug === parsed.data.brand);
```
Ad hoc lookup ✅.

### ✅ Q3 — Empty body `{}` → 400 Bad Request

> Plán Q3: *"Empty body `{}` → 400 Bad Request (explicit error, nic se nerevalidate)."*

**Implementace:** `route.ts:121-130`:
```typescript
if (!parsed.data.brand) {
  console.warn(`[revalidate] empty scope from ${...}`);
  return NextResponse.json(
    { error: "at least one of brand/model/year required" },
    { status: 400 }
  );
}
```
✅ — empty body (jen secret, žádný brand) → 400, žádný full /dily fallback. Explicit error message.

### ✅ Q4 — 3 modely per brand (27 total), NE 4

> Plán Q4: *"3 modely/brand (27 modelů total). 4. model NE — nechat jako future scope."*

**Implementace:** `lib/seo-data.ts` PARTS_MODELS_BY_BRAND — verified per nový brand (read range 1520-1817):

| Brand | Modely | Count |
|---|---|---|
| alfa-romeo | giulia, stelvio, giulietta | 3 ✅ |
| suzuki | vitara, swift, s-cross | 3 ✅ |
| fiat | 500, panda, tipo | 3 ✅ |
| mini | cooper, countryman, clubman | 3 ✅ |
| mitsubishi | outlander, asx, lancer | 3 ✅ |
| jeep | renegade, compass, grand-cherokee | 3 ✅ |
| jaguar | xf, f-pace, xe | 3 ✅ |
| dodge | caliber, journey, charger | 3 ✅ |
| lexus | is, rx, nx | 3 ✅ |
| **Total nových** | | **27** ✅ |

`grep -c "topYears:"` = **51** = 24 existing + 27 new ✅. Žádný brand nemá 4 modely. Future scope respektován.

### ✅ Q5 — REVALIDATE_SECRET separátní (NOT reuse CRON_SECRET)

> Plán Q5: *"REVALIDATE_SECRET separátní od CRON_SECRET (different threat model)."*

**Implementace:** `.env.example:73`:
```
REVALIDATE_SECRET=     # openssl rand -hex 16 — pro on-demand SSG cache invalidation
```
Separátní entry, ne `CRON_SECRET` reuse. Code `route.ts:109` čte `process.env.REVALIDATE_SECRET` (NOT `CRON_SECRET`). ✅

### ✅ Q6 — Endpoint `/api/revalidate/parts/route.ts` (scoped)

> Plán Q6: *"Endpoint `/api/revalidate/parts/route.ts` (scoped)."*

**Implementace:** Soubor existuje na očekávané cestě, scoped pod `parts/`, nikoli generic `/api/revalidate/route.ts`. ✅

### ✅ Q7 — Root `/dily` revalidate při bulk YES

> Plán Q7: *"Root `/dily` revalidate při bulk YES."*

**Implementace:** `route.ts:84` v Case 3 (brand only):
```typescript
paths.push(`/dily/znacka/${brand}`);
// /dily landing může obsahovat "popular brands" — refresh při bulk (lead Q7).
paths.push(`/dily`);
```
Comment doslova odkazuje na lead Q7 ✅. Pouze v case 3 (brand only / bulk), NE v case 1 (full match — single year) ani case 2 (brand+model). Selective application respektuje "při bulk" semantiku.

### Q1-Q7 souhrn

| Q | Plán literal | Code | Verdict |
|---|---|---|---|
| Q1 | SSG 1250-1700 | 1212 (borderline LOW) | ⚠️ flagged per §9, NOT STOP |
| Q2 | No PARTS_BRAND_SLUGS export | Pouze PARTS_BRANDS | ✅ |
| Q3 | Empty body → 400 | Lines 121-130 | ✅ |
| Q4 | 3 modely/brand × 9 = 27 | 51 = 24+27, all 9 brands × 3 | ✅ |
| Q5 | REVALIDATE_SECRET separátní | .env.example:73 | ✅ |
| Q6 | `/api/revalidate/parts/route.ts` | Soubor existuje na cestě | ✅ |
| Q7 | `/dily` root při bulk | route.ts:84 v Case 3 only | ✅ |

**6 z 7 čisté ✅, Q1 procedurálně compliant ⚠️ (lead decides post-facto).**

---

## 2. SSG count 1212 vs original user ask (dispatch bod 2)

### Původní user dispatch
*"verify SSG count vyroste z ~764 na ~1500-2000"*

### Plánovač Q1 reframing (line 943-955)
> *"SSG range 1250-1700 (AC10 + §9 STOP & ESCALATE). Moje původní 1500-2000 byl stretch guess — tvoje math derivation je přesnější."*

Team-lead **EXPLICITLY APPROVED** Q1 — substituce 1500-2000 → 1250-1700 jako autoritativní range. To je dokumentováno v plán §11 jako lead-approved override původního dispatch.

### Skutečnost: 1212 vs realistic range 1250-1700

| Compare base | Hodnota | Vs 1212 |
|---|---|---|
| Pre-#87d baseline | 764 | +59% (+448 abs) ✅ |
| User ask original | 1500-2000 | -19% pod minimum ⚠️ |
| Plan Q1 approved range | 1250-1700 | -3% pod minimum ⚠️ |
| Plan §5 borderline LOW | 1100-1249 | ✅ in range |
| Plan §5 hard floor (STOP) | 1100 | ✅ nad o 112 |
| Plan §5 hard ceiling (STOP) | 2000 | ✅ pod o 788 |

### Root cause (z commit message)
> *"moderní nové modely mají kratší generation ranges (avg ~15.3 years/model vs. expected ~20+). Historical accuracy preserved — extending ranges backwards nebylo v scope."*

EVZEN cross-check: Alfa Giulia 2016-2026 = 11 let, Jeep Renegade 2014-2026 = 13 let, Lexus IS XE20+XE30 = 2005-2026 = 22 let. Math je historicky přesné — H2 brandy jsou novější/nicher, mají kratší histories než H1 mass-market brands.

### EVZEN literal-compliance verdikt pro bod 2

**Implementator NEPORUŠIL plán.** Plán explicitly definuje 4 pásma:
1. <1100 → STOP & ESCALATE
2. 1100-1249 → borderline LOW → **flag + lead decide**
3. 1250-1700 → acceptable
4. 1701-2000 → borderline HIGH → flag + lead decide
5. >2000 → STOP & ESCALATE

1212 padne do pásma #2 → protokol je "flag in PR + lead decide", a implementator doslova flagoval v commit message: *"SSG count: 1212 (borderline LOW per plan AC10 range 1100-1249)"*. **Procedurálně bezvadné.**

**Není analogické #134 deviation:** V #134 plán měl §5 přísnější range a §9 širší, implementator si vybral širší. Zde plán má KONZISTENTNÍ ranges (line 40, 908: *"Žádný §5 vs §9 mismatch"*) a borderline LOW PROTOKOL je explicitně definovaný.

**Lead rozhoduje:** Akceptovat 1212 NEBO požadovat dopočítání (4. model per brand NEBO extended generation ranges historically). Možnosti dopočítání:
- +9 modelů × ~37 SSG entries each = +333 → 1545 (in acceptable)
- Alternativně: extend Lexus IS backward (XE10 1999-2005 = +7 years × 1 SSG = +7), atd. — minor delta, neuveze 1212→1250

**Doporučení EVZENA:** Lead schválit 1212 jako akceptovatelné. Důvody:
1. **Procedurální compliance** — implementator postupoval doslovně per §9 borderline LOW protocol
2. **Historical accuracy** — extending ranges backward by zfalšovalo data (H2 brand modely fakt nejsou starší)
3. **Future scope** — Q4 explicitly nechal 4. model jako future scope; přidávání nyní by bylo deviation
4. **No CI risk** — 1212 << 2000 ceiling, žádný timeout
5. **Revalidation API funguje** — primary deliverable #87d je revalidation endpoint, brand expansion je secondary; SSG count je QA metric, ne business KPI

---

## 3. 9 H2 brandy + 3 modely/brand = 27 modelů (dispatch bod 3)

### Brands (lib/seo-data.ts:1226-1245)

```
8 H1 (existing): skoda, volkswagen, bmw, audi, ford, toyota, hyundai, opel
9 H2 (#87d new): alfa-romeo, suzuki, fiat, mini, mitsubishi, jeep, jaguar, dodge, lexus
                  ^^^^^^^^^^  ^^^^^^^  ^^^^  ^^^^  ^^^^^^^^^^  ^^^^  ^^^^^^  ^^^^^  ^^^^^
                  Italian     JP       IT    UK    JP          US    UK      US     JP
```

**Total:** 17 ✅ (matches plán §2.8 + §11 Q1 dispatch verbatim)

**Header comment** line 1225: `// Parts brands data — 17 brands (8 H1 priority + 9 H2 expansion #87d)` ✅ (AC8)

### Models (lib/seo-data.ts PARTS_MODELS_BY_BRAND)

`grep -c "topYears:" lib/seo-data.ts` = **51** ✅ (24 existing pre-#87d + 27 new)

Per-brand model count verifikováno čtením lines 1520-1817:

| Nový brand | Modely | brandSlug check |
|---|---|---|
| alfa-romeo | giulia, stelvio, giulietta | `brandSlug: "alfa-romeo"` ✅ |
| suzuki | vitara, swift, s-cross | `brandSlug: "suzuki"` ✅ |
| fiat | 500, panda, tipo | `brandSlug: "fiat"` ✅ |
| mini | cooper, countryman, clubman | `brandSlug: "mini"` ✅ |
| mitsubishi | outlander, asx, lancer | `brandSlug: "mitsubishi"` ✅ |
| jeep | renegade, compass, grand-cherokee | `brandSlug: "jeep"` ✅ |
| jaguar | xf, f-pace, xe | `brandSlug: "jaguar"` ✅ |
| dodge | caliber, journey, charger | `brandSlug: "dodge"` ✅ |
| lexus | is, rx, nx | `brandSlug: "lexus"` ✅ |

**Total nových:** 27 = 9 × 3 ✅. Žádný brand nemá 4 (Q4 respekt). Žádný brand nemá 2 (under-spec). Každý nový model má `brandSlug` field matchující parent klíč. Každý nový model má `topYears` field (tj. SSG year-page expansion correctly seeded).

**Strukturní kontrola — generations:** Spot-checked:
- alfa-romeo/giulia: generations array s yearFrom/yearTo (modern brand, single gen)
- jeep/renegade: 2014-2026 (single gen, ~13 years)
- lexus/is: 2 generations XE20 (2005-2013) + XE30 (2013-2026) = ~22 years coverage
- lexus/rx: 3 generations AL10/AL20/AL30 (2009-2026) = ~17 years
- lexus/nx: 2 generations AZ10 (2014-2021) + AZ20 (2021-2026) = ~12 years

Generations array structurally matches `PartsModelGeneration` type (line 1250-1254). `getValidYearsForModel()` (line 1820-1828) bude správně iterovat všechny year ranges.

**Verdikt bod 3:** ✅ EXAKTNÍ MATCH s user dispatch "9 H2 brandy + 3 modely/brand = 27 modelů".

---

## 4. Revalidation API scope `/dily/znacka/*` only (dispatch bod 4)

### `buildPathsToRevalidate()` analýza (route.ts:54-88)

Cases:

**Case 1 — full match (brand + model + year):**
```typescript
paths.push(`/dily/znacka/${brand}/${model}/${year}`);
```
→ 1 path, scope `/dily/znacka/*` ✅

**Case 2 — brand + model:**
```typescript
const years = getValidYearsForModel(brand, model);
for (const y of years) paths.push(`/dily/znacka/${brand}/${model}/${y}`);
paths.push(`/dily/znacka/${brand}/${model}`);
```
→ N year paths + 1 model page, all scope `/dily/znacka/*` ✅

**Case 3 — brand only (bulk):**
```typescript
const models = PARTS_MODELS_BY_BRAND[brand] || [];
for (const m of models) {
  const years = getValidYearsForModel(brand, m.slug);
  for (const y of years) paths.push(`/dily/znacka/${brand}/${m.slug}/${y}`);
  paths.push(`/dily/znacka/${brand}/${m.slug}`);
}
paths.push(`/dily/znacka/${brand}`);
paths.push(`/dily`);  // ← lead Q7 approved
```
→ N×M year paths + N model pages + 1 brand page + `/dily` root.

**EVZEN literal scope check:** Dispatch říká "scope /dily/znacka/* only". Case 3 přidává `/dily` root path, což je MIMO `/dily/znacka/*` strict prefix. **Je to deviation?**

**NE.** Plán §11 Q7 explicitly approves: *"Root `/dily` revalidate při bulk YES."* — toto je lead-schválená rozšíření scope. Comment v code (line 83) doslova: *"// /dily landing může obsahovat 'popular brands' — refresh při bulk (lead Q7)."*

**Reality check:** `/dily` root page může obsahovat "popular brands" widget, který listuje brand karty. Po přidání 9 nových brandů je tento widget stale. Refresh root při bulk-brand revalidate je defense-in-depth — `dispatch říká "scope /dily/znacka/*"`, ale lead Q7 doplnil "+ /dily root při bulk" jako pragmatic exception. Implementator respektoval lead override, ne původní dispatch wording.

**EVZEN verdikt bod 4:** ✅ **PASS s explicit lead Q7 exception.** Žádné jiné cesty mimo `/dily/znacka/*` ani `/dily`. Code NEEMITUJE `/api/*`, `/inzerat/*`, `/marketplace/*`, ani jiné prefixy. Žádný `revalidatePath('/')` (full nuke). Žádný `revalidateTag()` (jiný API). Scope kontrolovaný a literally bound by `PARTS_BRANDS` + `PARTS_MODELS_BY_BRAND`.

**Auth gate:** Endpoint vyžaduje `REVALIDATE_SECRET` s constant-time compare (timingSafeEqual). Bez secretu → 401. Žádný path injection vector — všechny `${brand}` / `${model}` jsou validated proti `PARTS_BRANDS` whitelist (line 132-139: `brandExists` check, returning 404 pokud unknown). User-supplied input → Zod string validation (max 50, min 1) → whitelist check. Žádný `..` traversal možný (Next.js path normalization).

---

## 5. Nic mimo scope (dispatch bod 5)

### Commit `a0ce0d9` — file delta

```
.env.example                      |   3 +
app/api/revalidate/parts/route.ts | 164 +++++++++++++++++++++
lib/seo-data.ts                   | 294 +++++++++++++++++++++++++++++++++++++-
3 files changed, 460 insertions(+), 1 deletion(-)
```

**3 soubory změněné.** EVZEN verifikace každého:

#### `.env.example` (+3 lines)
- Pouze přidán `REVALIDATE_SECRET` line + komentář
- Žádná modifikace existing entries (CRON_SECRET, DATABASE_URL, atd.)
- Q5 compliance — separate entry from CRON_SECRET ✅

#### `app/api/revalidate/parts/route.ts` (+164 lines, NEW file)
- Nový soubor, žádný předchozí stav k overwriteu
- Pouze 1 endpoint — `POST /api/revalidate/parts`
- Žádný `GET`, `PUT`, `DELETE`, `PATCH` handler ✅
- 165 LoC including header comment + imports + helper + handler

#### `lib/seo-data.ts` (+294, -1)
- 9 nových PARTS_BRANDS entries (lines 1235-1245)
- Header comment update (line 1225: "17 brands (8 H1 priority + 9 H2 expansion #87d)")
- 27 nových PARTS_MODELS_BY_BRAND entries (alfa-romeo, suzuki, fiat, mini, mitsubishi, jeep, jaguar, dodge, lexus)
- Žádná modifikace existujících 8 brandů
- Žádná modifikace `BRANDS`, `BODY_TYPES`, `PRICE_RANGES`, `CITIES`, `getValidYearsForModel()` exports
- 1 line deletion = pravděpodobně koncový bracket adjustment při rozšíření array (verified — žádný funkční delete)

#### Co v commit NENÍ (proper deferrals)
- ❌ Žádný `app/sitemap.ts` edit — auto-pickup design respektován ✅
- ❌ Žádný `middleware.ts` edit — security gate je v route.ts samotné ✅
- ❌ Žádný `app/(web)/dily/znacka/[brand]/page.tsx` edit — dynamic params auto-resolves ✅
- ❌ Žádné nové unit tests — per AC15 deferred ✅
- ❌ Žádný `next.config.ts` edit — žádný runtime/cache config change ✅
- ❌ Žádný `package.json` dependency add — žádné nové libraries (zod, node:crypto už existují) ✅
- ❌ Žádný `prisma/schema.prisma` edit — #87d je čistě SSG/cache, žádný DB change ✅

### EVZEN verdikt bod 5

✅ **EXAKTNĚ 3 soubory, 0 mimo scope.** Žádný "soft scope creep" jako u #134. Žádný refactor existing code. Žádný "while-i-was-at-it" cleanup. Implementator držel diff minimalní per plán §3 deliverables.

---

## 6. EVZEN 6 pravidla — code quality assessment

### 1. Doslovnost (literal compliance)
✅ **Q1-Q7 implementovány doslovně.** Plán §11 LEAD DECISIONS = single source of truth. Žádná interpretace, žádné "co lead pravděpodobně myslel". Comment v route.ts:83 explicitně odkazuje "lead Q7", route.ts:121 "lead Q3", route.ts:6 "lead Q5".

### 2. No assumptions (žádné domněnky)
✅ Implementator nepřidal:
- Žádný rate limiting (mimo plán)
- Žádný IP whitelist (mimo plán, jen logging IP při auth fail)
- Žádný metrics/tracing instrumentation (mimo plán)
- Žádný redirect handling pro `revalidatePath()` exceptions (handled per-path try/catch jak plán §3.1 specifikuje)
- Žádný cache busting nad rámec `revalidatePath` API

### 3. No soft hacks (žádné hacky)
✅ Code je clean:
- `timingSafeEqual` z `node:crypto` (NE custom char-by-char compare)
- `revalidatePath` z `next/cache` (NE manual fs.unlink na .next cache directory)
- Zod schema (NE manual `if (typeof body.brand !== 'string')` validation)
- Standard `NextResponse.json()` (NE custom Response constructor)
- Per-path try/catch (NE try/catch wrapping celé pole = silent partial failure mask)

### 4. Defense-in-depth (vícevrstvá obrana)
✅ 7-step request pipeline (route.ts:90-163):
1. JSON parse fail → 400 (ne 500 crash)
2. Zod schema fail → 400 + issues
3. Missing env REVALIDATE_SECRET → 500 + log (ne silent accept)
4. Wrong secret → 401 + log IP (constant-time compare)
5. Missing brand → 400 + log IP (Q3)
6. Unknown brand → 404 (distinguishes "valid input, unknown" od "malformed")
7. Per-path try/catch → partial failures collected, HTTP 500 jen pokud ALL fail

Žádný short-circuit, žádný "if first check passes, skip rest". Každá vrstva zvlášť validuje.

### 5. Resistance to shortcuts (odpor k zkratkám)
✅ Implementator NEPOUŽIL shortcuts:
- ❌ `===` na secret (timing attack vector) → použil `timingSafeEqual`
- ❌ `revalidatePath('/')` full nuke → buildovaný path list scoped
- ❌ Catch-all 200 OK return → real status codes 400/401/404/500/200
- ❌ `if (errors.length > 0) return 500` → `if (errors.length > 0 && revalidated.length === 0)` (nuanced HTTP semantic)
- ❌ `process.env.REVALIDATE_SECRET!` non-null assertion → explicit `if (!expectedSecret)` check + 500

### 6. Final verdict respect (respekt k final verdiktu)
✅ Implementator respektoval lead Q1-Q7 ALL APPROVED. Žádné silent override. Žádný "I think the lead would prefer X". V borderline-LOW situaci (1212) flagoval v commit message + nechal lead rozhodnout (per §9 protocol). Žádný "I'll just add 4th model to fix this" override.

---

## 7. Out-of-scope deferrals — verifikace legitimity

### `lib/sitemap.ts` auto-pickup
QA report §AC11 confirms: `app/sitemap.ts` mapuje `PARTS_BRANDS` a `PARTS_MODELS_BY_BRAND` — žádná ruční editace nutná. +117 sitemap entries delta verified mathematically (9 brand + 27 model + 81 year @ topYears).

### Endpoint smoke test deferred (AC12)
Per plán §5 AC12 pozn. (line 731): *"AC12 je deferred do post-deploy QA (samostatný #145-style test-chrome task). Implementator nemusí spustit curl proti production v IMPL fáze, ale MUSÍ verify lokálně přes `npm run dev`."* — legitimní deferral, post-deploy validation.

### Unit tests deferred (AC15)
Per plán §5 AC15 (line 740): *"#87d nepřidává nové unit tests v MVP — endpoint testing je deferred."* — legitimní MVP scope cut.

### #87f JSONB compatibleBrands deferred
Per plán line 14: *"#87f — JSONB cast compatibleBrands (deferred z #87c per Q4)"* — separate task, ne #87d scope.

### 4. model per brand deferred (Q4)
Per plán Q4: *"4. model NE — nechat jako future scope."* — explicitly approved future scope.

### Žádný neoprávněný deferral

EVZEN nenašel nic, co by mělo být v scope ale bylo deferred bez plán justifikace.

---

## 8. QA report (KONTROLOR #145) cross-check

KONTROLOR verdict: ⚠️ **PASS with 1 minor finding** (SSG count 1212 borderline LOW).

EVZEN cross-check:
- ✅ AC1-AC9 PASS (route.ts existence, runtime, Zod, safeCompare, brands count, models count, header comment, env var)
- ⚠️ AC10 MINOR (SSG 1212 borderline LOW — procedurálně OK per §9)
- ✅ AC11 PASS (+117 sitemap delta v range 110-130)
- ⏳ AC12 DEFERRED (per plán §5 pozn.)
- ✅ AC13-AC15 PASS (lint 0 err, tsc 0 err, vitest 155/155)

EVZEN potvrzuje KONTROLOR analysis. **MF-1 je validní MINOR finding, ale procedurálně compliant** — implementator korektně flagoval v commit message per §9 protokol.

---

## 9. Minor Findings

| # | Severity | Popis | Procedurální status | Doporučení |
|---|---|---|---|---|
| MF-1 | MINOR | SSG count 1212 — pod acceptable range 1250-1700, v borderline LOW pásmu 1100-1249. | ✅ Implementator korektně flagoval v commit message per plán §9 borderline LOW protokol. NENÍ STOP & ESCALATE (hard floor 1100). | Lead schválí 1212 jako akceptovatelné (root cause = historical accuracy, futures scope = 4. model per Q4 deferred). Případně vyžaduje dopočítání +9 modelů (~+330 SSG) → 1545. EVZEN doporučuje **akceptovat 1212**. |

**Žádný MAJOR finding. Žádný BLOCKER.**

---

## 10. Verdict

### ✅ **APPROVED** (s 1 documented MINOR — non-blocking)

**Commit `a0ce0d9` doslovně implementuje plán-task-143 §11 LEAD DECISIONS Q1-Q7.**

**5 dispatch bodů:**
1. ✅ Q1-Q7 verbatim compliance (Q1 borderline LOW procedurálně OK)
2. ⚠️ SSG 1212 vs user ask 1500-2000 — MINOR, procedurálně compliant per §9
3. ✅ 9 H2 brandy × 3 modely = 27 — exaktní match
4. ✅ Scope `/dily/znacka/*` only (+/dily root při bulk per Q7)
5. ✅ Nic mimo scope — exactly 3 files, 0 deviation

**Code quality:** Production-grade. Defense-in-depth 7-step pipeline, constant-time secret compare, per-path try/catch, scoped path emission, Zod validation s 2 refinements. Žádné shortcuts, žádné assumptions, žádné soft hacks.

**Procedurální compliance:** Implementator respektoval lead Q1-Q7 doslovně, flagoval borderline LOW per §9 protokol (NENÍ analogické #134 deviation), držel diff minimální (3 soubory).

**Není blocker:** SSG 1212 je v "flag + lead decide" pásmu, ne v "STOP & ESCALATE". Lead rozhoduje post-facto. EVZEN doporučuje **akceptovat 1212** (historical accuracy, Q4 future scope respect, no CI risk, revalidation API funguje per primary deliverable).

**Lead action required:** Rozhodnout o MF-1 (accept 1212 NEBO request 4. model per brand expansion). EVZEN doporučuje accept.

---

**EVZEN signature:** ✅ APPROVED — 1 documented MINOR (procedurálně compliant), žádný blocker, žádné scope creep, žádný literal-compliance violation.
