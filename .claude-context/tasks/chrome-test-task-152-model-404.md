# Chrome Browser Test — #152 #149 Model Page 404 Retest
**Datum:** 2026-04-07  
**Tester:** TEST-CHROME agent  
**Task:** #152  
**Commit:** e702e93 — fix(seo): #148 model page dynamicParams=false (analogous #132 rok fix)  
**Target:** localhost:3000 (dev server, fresh restart)  

---

## Výsledek: 🟢 GREEN — 4/4 PASS

**Bug z #147 je plně opraven. Model page 404 funguje.**

---

## Test výsledky

| TC | URL | Očekávání | Výsledek | Status |
|----|-----|-----------|----------|--------|
| T1 | `/dily/znacka/alfa-romeo/neexistuje` | 404 | **404** "Stránka nenalezena \| CarMakléř" | ✅ PASS |
| T2 | `/dily/znacka/skoda/neexistuje-model` | 404 | **404** | ✅ PASS |
| T3 | 3 valid model pages (alfa-romeo/giulia, skoda/octavia, bmw/rada-3) | 200 | **200** + správné H1 | ✅ PASS |
| T4 | `/dily/znacka/alfa-romeo/giulia/2018` (rok page) | 200 + chips | **200**, H1 "Náhradní díly Alfa Romeo Giulia 2018", 11 chips | ✅ PASS |

---

## Podrobnosti

### T1 — Fix verification (hlavní bug z #147)
```
URL: /dily/znacka/alfa-romeo/neexistuje
HTTP: 404
title: Stránka nenalezena | CarMakléř
H1: Stránka nenalezena
```
Před fixem: HTTP 200 (force-static swallowed notFound). Po fixu: HTTP 404 ✅

### T3 — Regression: valid model pages
```
alfa-romeo/giulia: status=200, H1="Náhradní díly Alfa Romeo Giulia" ✅
skoda/octavia: status=200, H1="Náhradní díly Škoda Octavia" ✅
bmw/rada-3: status=200, H1="Náhradní díly BMW Řada 3" ✅
```
`dynamicParams = false` nepoškodil validní model pages — jsou stále v generateStaticParams.

### T4 — Rok page regression
```
alfa-romeo/giulia/2018: status=200, chips=11, H1 správné ✅
```

---

## Poznámka — dev cache

První run testu (před restartem dev serveru) selhal T1 — dev server měl starou `dynamicParams = true` hodnotu v module cache (hot-reload nestačil pro route config změny). Po `pkill -f "next dev"` + restart: 4/4 PASS.

**Doporučení pro budoucí route config změny:** Po změně `dynamicParams`/`dynamic` restartovat dev server (ne jen hot-reload).

---

## Celkové skóre

| Test | Pass | Fail |
|------|------|------|
| T1: alfa-romeo/neexistuje → 404 | 1 | 0 |
| T2: skoda/neexistuje-model → 404 | 1 | 0 |
| T3: valid model pages → 200 | 1 | 0 |
| T4: rok page regression | 1 | 0 |
| **CELKEM** | **4** | **0** |

---

## Verdict: 🟢 GREEN

**#149 fix je funkční. Model page `dynamicParams = false` správně vrací 404 pro neznámé modely a 200 pro validní modely.**
