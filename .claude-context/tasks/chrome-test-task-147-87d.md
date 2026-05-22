# Chrome Browser Test — #147 #87d Final Verification
**Datum:** 2026-04-07  
**Tester:** TEST-CHROME agent  
**Task:** #147  
**Commit:** a0ce0d9 — feat(seo): #87d on-demand revalidation API + 9 brand expansion  
**Target:** localhost:3000 (dev server)  

---

## Výsledek: 🟢 GREEN — ALL PASS

**Všechny testy prošly. 9 nových brand pages OK, model/year OK, API endpoint OK.**

---

## Test 1 — 9 nových brand pages (HTTP + H1 + content)

| Brand | HTTP | H1 | Content |
|-------|------|----|---------|
| alfa-romeo | ✅ 200 | "Náhradní díly Alfa Romeo" | ✅ |
| suzuki | ✅ 200 | "Náhradní díly Suzuki" | ✅ |
| fiat | ✅ 200 | "Náhradní díly Fiat" | ✅ |
| mini | ✅ 200 | "Náhradní díly Mini" | ✅ |
| mitsubishi | ✅ 200 | "Náhradní díly Mitsubishi" | ✅ |
| jeep | ✅ 200 | "Náhradní díly Jeep" | ✅ |
| jaguar | ✅ 200 | "Náhradní díly Jaguar" | ✅ |
| dodge | ✅ 200 | "Náhradní díly Dodge" | ✅ |
| lexus | ✅ 200 | "Náhradní díly Lexus" | ✅ |

**9/9 brand pages ✅**

---

## Test 2 — Model page: `/dily/znacka/alfa-romeo/giulia`

| Check | Výsledek |
|-------|----------|
| HTTP status | ✅ 200 |
| H1 | "Náhradní díly Alfa Romeo Giulia" |
| Has Giulia content | ✅ true |

---

## Test 3 — Year page: `/dily/znacka/alfa-romeo/giulia/2018`

| Check | Výsledek |
|-------|----------|
| HTTP status | ✅ 200 |
| H1 | "Náhradní díly Alfa Romeo Giulia 2018" |
| Category chips (`/dily/kategorie/`) | ✅ 11 |
| JSON-LD BreadcrumbList | ✅ true |
| JSON-LD ItemList | ✅ true |

---

## Test 4 — API: POST /api/revalidate/parts

Dev server spuštěn s `REVALIDATE_SECRET=test-secret-for-chrome-verify-147` pro validní auth test.

| Test | Request | Očekávání | Výsledek |
|------|---------|-----------|----------|
| TC-A: No auth (wrong secret) | `{"secret":"wrong-secret-value-here-123","brand":"skoda"}` | 401 | ✅ **401** `{"error":"unauthorized"}` |
| TC-B: Empty body | `{}` | 400 | ✅ **400** `{"error":"validation failed","issues":[...]}` |
| TC-C: Valid body | `{"secret":"<correct>","brand":"skoda"}` | 200 | ✅ **200** `{"revalidated":[...],"errors":[]}` |

**TC-C výsledek:** 64 paths revalidated pro `skoda` brand (octavia × 23 years + model page, fabia × 18 years + model page, superb × 15 years + model page, brand page, /dily root). ✅

### API design note — TC-B
Zod schema vyžaduje `secret` jako required field (min 16 chars). Prázdné tělo `{}` failuje Zod validation → 400 (dříve než auth check). Toto je zamýšlené chování (neopouštíme informaci o authorizaci pro nevalidní requesty).

---

## Celkové skóre

| Test | Pass | Fail |
|------|------|------|
| 9 brand pages (HTTP 200 + H1 + content) | 9 | 0 |
| Model page alfa-romeo/giulia | 1 | 0 |
| Year page alfa-romeo/giulia/2018 | 1 | 0 |
| API: no-auth → 401 | 1 | 0 |
| API: empty body → 400 | 1 | 0 |
| API: valid body → 200 | 1 | 0 |
| **CELKEM** | **14** | **0** |

---

## Test 5 — Dodatečné testy (ze second pass)

### API 405 (GET method)
```bash
curl -X GET http://localhost:3000/api/revalidate/parts → 405 ✅
```
Next.js správně vrátí 405 pro GET na POST-only endpoint.

### Negative 404 tests

| URL | Očekávání | Výsledek |
|-----|-----------|----------|
| `/dily/znacka/neexistuje` | 404 | ✅ **404** "Stránka nenalezena \| CarMakléř" |
| `/dily/znacka/alfa-romeo/neexistuje` | 404 | ❌ **200** H1: "Stránka nenalezena" (wrong HTTP status) |

**FINDING — Model page `dynamicParams = true` + `force-static` bug:**

`app/(web)/dily/znacka/[brand]/[model]/page.tsx` má:
```ts
export const dynamic = "force-static";
export const dynamicParams = true;  // ← PROBLEM
```

Stejný pattern jako Bug #2 z #130 (rok page) — `notFound()` je v `force-static` módu swallowed, Next.js vrátí HTTP 200 s prázdným root layoutem místo 404. Stránka vizuálně zobrazuje "Stránka nenalezena" ale HTTP status je 200.

**Fix:** `dynamicParams = false` na model page (stejně jako rok page fix v #132).
**Priority:** P2 (stejná kategorie jako #130 Bug #2).

---

## Verdict: 🟡 AMBER — #87d core features OK, 1 P2 finding

- ✅ 9 nových H2 brand pages (alfa-romeo, suzuki, fiat, mini, mitsubishi, jeep, jaguar, dodge, lexus) — všechny 200, správné H1
- ✅ Model page (alfa-romeo/giulia) — 200, H1 správné
- ✅ Year page (alfa-romeo/giulia/2018) — 200, H1, 11 chips, JSON-LD BreadcrumbList + ItemList
- ✅ Revalidation API — 401/400/200 chování správné, bulk revalidation funguje (64 paths pro skoda brand)
- ✅ GET /api/revalidate/parts → 405 (curl ✅)
- ✅ /dily/znacka/neexistuje → 404
- ❌ /dily/znacka/alfa-romeo/neexistuje → **200 místo 404** — P2 bug: `force-static + dynamicParams=true` na model page swallows `notFound()`
