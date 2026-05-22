# QA Report — Task #21: STK stanice

**Datum:** 2026-05-22  
**Commit:** 5582754  
**Výsledek: FAIL ❌ — BLOCKER: migrace chybí (stejně jako #18, Task #24 řeší)**

---

## 1. KRITICKÝ PROBLÉM — Migrace nevytvořena

Plán vyžaduje: `npx prisma migrate dev --name add-stk-fields`.  
Poslední migrace v projektu: `20260520210000` (2026-05-20).  
Commit 5582754 přidává 10 polí do schema.prisma (7 AutoServis + 3 ServisReview) ale **žádný migration soubor**.

**Poznámka:** Task #24 je `in_progress` a řeší migraci pro #18 + #21 dohromady — `prisma migrate dev` vytvoří jednu migraci pro všechny pending schema changes.

---

## 2. Simplify kontrola

### ⚠️ `isStk` proměnná je vždy true (dead code)

```typescript
// app/(web)/stk/[slug]/page.tsx
if (!servis || !servis.isPublished || !servis.categories.includes("stk-emise")) notFound();

const isStk = servis.categories.includes("stk-emise"); // vždy true po notFound() guard
```

Proměnná `isStk` se používá jako podmínka pro `<StkInfoCard>` — ale je vždy `true`. Kód funguje správně, jen zbytečná proměnná.

### ⚠️ `/stk/page.tsx` — serialized bez STK polí

Objekt předávaný do `ServisyList` neobsahuje `stkWaitDays`, `stkLines` atd. Hlavní seznam STK stanic proto neukazuje čekací dobu. `/stk/mesto/[city]/page.tsx` má vlastní card rendering se `stkWaitDays` — **nekonzistentní UX**.

---

## 3. Debug kontrola

**Lint:** 0 errors, 0 warnings na všech 7 souborech ✅

---

## 4. Reverzní kontrola vs. plán

### Prisma schema

| Pole | Status |
|---|---|
| AutoServis: stkLines Int? | ✅ |
| AutoServis: stkWaitDays Int? | ✅ |
| AutoServis: stkOnlineBooking Boolean @default(false) | ✅ |
| AutoServis: stkEmissions Boolean @default(true) | ✅ |
| AutoServis: stkMotorcycles Boolean @default(false) | ✅ |
| AutoServis: stkTrailers Boolean @default(false) | ✅ |
| AutoServis: stkHeavy Boolean @default(false) | ✅ |
| ServisReview: ratingWaitTime Int? | ✅ |
| ServisReview: ratingFairness Int? | ✅ |
| ServisReview: passedInspection Boolean? | ✅ |
| **Migrace** | ❌ CHYBÍ (Task #24 řeší) |

### lib/stk-pricing.ts — ceník dle vyhlášky

Matematická verifikace všech 13 kategorií:

| Kategorie | STK | Emise | Total | Správně |
|---|---|---|---|---|
| L | 400 | 200 | 600 | ✅ |
| M1 | 800 | 400 | 1200 | ✅ |
| M1G | 800 | 400 | 1200 | ✅ |
| M2 | 1000 | 500 | 1500 | ✅ |
| M3 | 1400 | 700 | 2100 | ✅ |
| N1 | 800 | 400 | 1200 | ✅ |
| N2 | 1000 | 500 | 1500 | ✅ |
| N3 | 1400 | 700 | 2100 | ✅ |
| O1 | 400 | — | 400 | ✅ |
| O2 | 500 | — | 500 | ✅ |
| O3 | 700 | — | 700 | ✅ |
| O4 | 900 | — | 900 | ✅ |
| T | 500 | 300 | 800 | ✅ |

Všechny hodnoty shodné s plánem, všechny součty správné ✅

### Komponenty

| Komponenta | Status | Poznámka |
|---|---|---|
| StkPriceCalc — select → okamžitý výsledek | ✅ | 6 quick options, fallback na M1 |
| StkPriceCalc — emise podmíněně null | ✅ | |
| StkPriceCalc — disclaimer vyhláška | ✅ | |
| StkPriceTable — 13 řádků, M1 zvýrazněn | ✅ | |
| StkInfoCard — linky, čekání, capabilities | ✅ | |
| StkInfoCard — STOP-5: "dle recenzí" | ✅ | |
| **StkReviewExtras.tsx** | ❌ NEVYTVOŘENA | DB pole existují, UI chybí |

### Stránky

| Stránka | Status | Poznámka |
|---|---|---|
| /stk — seznam filtrovaný na stk-emise | ✅ | |
| /stk — sidebar s StkPriceCalc + StkPriceTable | ✅ | |
| /stk/[slug] — notFound() pokud ne stk-emise | ✅ | STOP-3 enforcement |
| /stk/[slug] — JSON-LD AutoRepair + additionalType:"STK" | ✅ | |
| /stk/[slug] — StkInfoCard + StkPriceCalc v sidebaru | ✅ | |
| /stk/[slug] — metadata se stkWaitDays | ✅ | |
| /stk/mesto/[city] — decodeURIComponent | ✅ | |
| /stk/mesto/[city] — insensitive city match | ✅ | |
| /stk/mesto/[city] — česká pluralizace | ✅ | "stanice/stanic" |
| /stk/opengraph-image — používá options | ✅ | ne { ...size } |
| loading.tsx + not-found.tsx | ✅ | |

### STOP pravidla

| STOP | Status | Poznámka |
|---|---|---|
| STOP-1: závisí na Task #18 (autoservisy) | ✅ | Stejný model/DB |
| STOP-2: žádný nový model, rozšiřuje AutoServis | ✅ | |
| STOP-3: slug "stk-{name}-{city}" pattern | ⚠️ | Slug dědí z POST /api/autoservisy = "name-city" bez "stk-" prefixu (minor) |
| STOP-4: sdílí ServisReviewSection + ServisyList | ✅ | |
| STOP-5: čekací doby "dle recenzí" | ✅ | |

### Chybějící z plánu

| Položka | Status |
|---|---|
| StkReviewExtras.tsx | ❌ Nevytvořena |
| Cross-linking z /nabidka/[slug] | ❌ (Krok 5, nižší priorita) |
| Footer + homepage link | ❌ (Krok 5, nižší priorita) |

---

## Acceptance Criteria

| Kritérium | Status |
|---|---|
| STK pole přidána do AutoServis | ✅ |
| **Migrace** | ❌ (Task #24 řeší) |
| /stk zobrazuje jen stk-emise servisy | ✅ |
| /stk/[slug] detail s extra info | ✅ |
| /stk/mesto/[city] SEO landing | ✅ |
| Recenze STK s extra poli | ⚠️ DB pole OK, UI (StkReviewExtras) chybí |
| JSON-LD na detailu | ✅ |
| OG obrázek | ✅ |
| npm run build | ⚠️ (závisí na migraci) |

---

## Závěr

Implementace kvalitní — ceník matematicky přesný, stránky funkční, OG+JSON-LD správně. Blockerem je chybějící migrace (Task #24 in-progress). Minor: `StkReviewExtras.tsx` nevytvořen (DB pole ztracena pro UI), `isStk` dead variable, STK wait days nezobrazeny v hlavním seznamu.
