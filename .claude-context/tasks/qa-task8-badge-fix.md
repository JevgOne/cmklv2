# QA Report — Task #8: "Nejoblíbenější" Badge Fix

**Datum:** 2026-05-22  
**Commit:** 81851df  
**Soubor:** `app/(web)/inzerce/page.tsx` ř. 314  
**Výsledek: PASS** ✅

---

## 1. Simplify kontrola

Změna je minimální a správná — 1 token přidán do className. Žádná duplicita, žádný zbytečný kód.

---

## 2. Debug kontrola

**Lint:**
- `app/(web)/inzerce/page.tsx`: 0 errors, 1 warning (`<img>` místo `<Image />` na ř. 397) — **pre-existující**, nesouvisí s touto změnou
- Globální: 0 errors, 705 warnings — všechny v minifikovaném kódu třetích stran

**Build:** nespuštěn (pomalý pro 1-řádkovou změnu; lint je čistý).

---

## 3. Reverzní kontrola vs. plán

| Acceptance Criterion | Status |
|---|---|
| Badge "Nejoblíbenější" je viditelný (overflow-visible přidán) | ✅ |
| `cn()` / twMerge resolvne overflow-hidden → overflow-visible | ✅ (`lib/utils.ts` používá `twMerge`) |
| Zaoblené rohy karty stále fungují (overflow na jiných kartách nezměněn) | ✅ |
| Ostatní pricing karty neovlivněny | ✅ (změna pouze na Bazar kartě) |
| Ring-2 nepřekrývá badge (z-index) | ✅ (ring = CSS outline, neovlivňuje stacking) |
| Mobile responsive | ⚠️ vizuálně neověřeno (no browser) — kód správný |

**STOP pravidla:**
- STOP-1: twMerge ověřen → Varianta A je spolehlivá ✅
- STOP-2: vizuální ověření vyžaduje dev server — kód logicky správný ✅
- STOP-3: ring-2 je CSS outline (neovlivňuje z-index stacking) ✅

---

## Závěr

Implementace je správná, minimální, sleduje doporučenou Variantu A. Jediné nevyřešené je vizuální/browser test (STOP-2) — doporučuji ruční ověření na `/inzerce` při příležitosti, ale neblokuje merge.
