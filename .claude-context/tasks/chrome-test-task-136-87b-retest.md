# Chrome Browser Test — #136 #87b Bugfix Retest (AC16)
**Datum:** 2026-04-07  
**Tester:** TEST-CHROME agent  
**Task:** #136  
**Commit:** 3666bad — fix(seo): #87b runtime bugs — diakritika middleware + year 404 (Strategy A)  
**Target:** localhost:3010 (production build)  

---

## ⚠️ Pre-run note — syntax error v jak-prodat-auto/page.tsx

Před buildem byl nalezen syntax error bránící `npm run build`:

```
Error: Expected ',', got '{'
app/(web)/jak-prodat-auto/page.tsx:4:1
```

Dva import statementy byly interleaved:
```ts
// CHYBNÝ kód:
import {
import { pageCanonical } from "@/lib/canonical";
  generateBreadcrumbJsonLd, ...
```

Byl opraven před spuštěním production buildu. Toto je **oddělený bug** od #132 — nutné commitovat fix.

---

## Výsledek: 🟡 AMBER — 15/16 PASS, 1 FAIL (edge case)

**Oba P2 bugy z #130 jsou opraveny. 1 edge-case FAIL (TC7) — framework limitation, ne code bug.**

---

## 16 Test Cases — Výsledky

### BUG 1 — Diakritika 301 (8 cases)

| TC | URL | Očekávání | Výsledek | Status |
|----|-----|-----------|----------|--------|
| TC1 | `/dily/znacka/%C5%A1koda` | 301 → `/dily/znacka/skoda` | `HTTP 301 → location: /dily/znacka/skoda` | ✅ PASS |
| TC2 | `/dily/znacka/%C5%A1koda/oct%C3%A1via` | 301 → `/dily/znacka/skoda/octavia` | `HTTP 301 → location: /dily/znacka/skoda/octavia` | ✅ PASS |
| TC3 | `/dily/znacka/%C5%A1koda/oct%C3%A1via/2018` | 301 → `/dily/znacka/skoda/octavia/2018` | `HTTP 301 → location: /dily/znacka/skoda/octavia/2018` | ✅ PASS |
| TC4 | `/dily/znacka/skoda` (canonical) | 200, žádný redirect | `HTTP 200 OK` | ✅ PASS |
| TC5 | Chrome: `%C5%A1koda` | Final URL = `/dily/znacka/skoda`, H1 = Škoda | Final URL: `localhost:3010/dily/znacka/skoda`, H1: "Náhradní díly Škoda" | ✅ PASS |
| TC6 | `/dily/znacka/bmw/rada-3` | 200 | `HTTP 200 OK` | ✅ PASS |
| TC7 | `%E0%A4%A` (malformed URI) | Middleware nesmí crashnout | `HTTP 500` | ❌ FAIL |
| TC8 | `/dily/ko%C5%A1` (non-parts) | 200 (general routing) | `HTTP 200 OK` | ✅ PASS |

**TC7 detail:** `%E0%A4%A` je strukturálně neplatný URL (neúplný percent-encoding — `%A` nemá 2 hex cifry). Middleware má try/catch pro `decodeURIComponent`, ale Next.js framework selže dříve při `new URL(request.url)` — nelze zachytit na úrovni middleware kódu. Framework limitation.

**Porovnání s `%E0%A4%AB` (validní 3-byte UTF-8):** → HTTP 404 (správně, bez crashe).

### BUG 2 — Neplatné roky 404 (4 cases)

| TC | URL | Očekávání | Výsledek | Status |
|----|-----|-----------|----------|--------|
| TC9 | `/dily/znacka/bmw/rada-3/1995` | 404 | `HTTP 404` | ✅ PASS |
| TC10 | `/dily/znacka/skoda/octavia/1990` | 404 | `HTTP 404` | ✅ PASS |
| TC11 | `/dily/znacka/bmw/rada-3/2015` | 200 | `HTTP 200 OK` | ✅ PASS |
| TC12 | `/dily/znacka/skoda/octavia/2016` (mimo topYears) | 200 | `HTTP 200 OK` | ✅ PASS |

**Bug #2 je plně opraven.** Year validation funguje správně v production build.

### Regrese — #130 funguje (4 cases)

| TC | URL | Výsledek | Status |
|----|-----|----------|--------|
| TC13 | Chrome: `/dily/znacka/skoda` | 200, H1: "Náhradní díly Škoda" | ✅ PASS |
| TC14 | Chrome: `/dily/znacka/skoda/octavia` | 200, H1: "Náhradní díly Škoda Octavia" | ✅ PASS |
| TC15 | Chrome: `/dily/znacka/skoda/octavia/2018` | 200, H1: "Náhradní díly Škoda Octavia 2018", 11 chips | ✅ PASS |
| TC16 | DevTools Network — žádné 5xx | 0 HTTP 5xx errors | ✅ PASS |

---

## TC5 Detail (Chrome browser)

```
TC5 final URL: http://localhost:3010/dily/znacka/skoda
TC5 status: 200
TC5 title: Náhradní díly Škoda | Carmakler | CarMakléř
TC5 H1: Náhradní díly Škoda
TC5 redirects: [{"status":301,"url":"http://localhost:3010/dily/znacka/%C5%A1koda"}]
```

Prohlížeč sledoval 301, přistál na kanonické URL, stránka se správně vyrendila. ✅

---

## TC7 Analýza — framework limitation

**URL:** `http://localhost:3010/dily/znacka/%E0%A4%A`

Middleware kód má try/catch na správném místě:
```ts
try {
  decoded = decodeURIComponent(pathname);
} catch {
  return null; // Malformed URI sequence ← TOTO SE VOLÁ ALE JE POZDĚ
}
```

**Problém:** Next.js zavolá `new URL(request.url)` při vytváření `NextRequest` objektu. `%A` (neúplný percent-encoding) způsobí `TypeError: Invalid URL` v URL parseru — **dříve** než middleware funkce začne běžet.

**Kontrast:**
- `%E0%A4%AB` (validní sequence) → URL parser OK → middleware → 404 ✅
- `%E0%A4%A` (neúplná sequence) → URL parser FAIL → 500 ❌

**Závěr:** Tento případ nelze opravit v middleware kódu bez patchování Next.js frameworku (nebo custom HTTP serveru). Middleware try/catch chrání před validními diakritikou, ale ne před fundamentálně neplatnými URL.

**Reálný dopad:** Minimální — prohlížeče nikdy negenerují `%A` (neúplný hex). Pouze craft HTTP klienty mohou odeslat takový URL. P3 low priority.

---

## Celkové skóre

| Kategorie | Pass | Fail | Note |
|-----------|------|------|------|
| BUG 1 — Diakritika 301 | 7 | 1 | TC7: framework limitation |
| BUG 2 — Year 404 | 4 | 0 | Plně opraveno ✅ |
| Regression | 4 | 0 | Brand/model/rok pages OK ✅ |
| **CELKEM** | **15** | **1** | |

---

## Verdict: 🟡 AMBER (prakticky GREEN)

**Oba P2 bugy z #130 jsou plně opraveny:**
- ✅ Bug #1: Diakritika redirect funguje — TC1-TC5 všechny PASS, 301 správně
- ✅ Bug #2: Year < 2000 → 404 — TC9-TC10 PASS, TC11-TC12 správně 200

**TC7 (malformed URI `%E0%A4%A` → 500)** je framework limitation, ne code bug:
- Kód má try/catch — ale Next.js URL parser selže před middleware
- Nelze opravit bez custom HTTP serveru
- Reálný dopad: 0 (žádný prohlížeč nevygeneruje neúplný percent-encoding)
- Doporučení: P3 nízká priorita — přidat nginx level URL validation pokud potřeba

**Bonus finding:** Syntax error v `app/(web)/jak-prodat-auto/page.tsx` (duplicate import) blokoval production build — opraveno před tímto testem, potřebuje commit.

---

## Build note

```bash
# Fix v jak-prodat-auto/page.tsx před buildem:
# Opraveno: interleaved import { a import { pageCanonical }
# Po opravě: npm run build OK, next start -p 3010 OK
```
