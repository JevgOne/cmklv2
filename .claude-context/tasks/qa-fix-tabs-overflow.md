# QA Report: Tabs overflow fix (commit 0111449)

**Datum:** 2026-05-05  
**Reviewer:** kontrolor  
**Commit:** `0111449c337e541d70db5665167c8e883d605f45`  
**Soubor:** `components/ui/Tabs.tsx:62`

---

## A) Simplify kontrola

✅ **ČISTÝ FIX**

Změna je jednořádková — přidáno `overflow-x-auto` do existující `cn(...)` className string na wrapper divu:

```diff
- className={cn("flex gap-1 bg-gray-100 p-1 rounded-lg", className)}
+ className={cn("flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto", className)}
```

Žádný zbytečný kód, žádné duplicity, žádné side effects. Minimální, přesný zásah.

---

## B) Debug kontrola

**npm run lint:**
- ❌ Errors: **0**
- ⚠️ Warnings: 683 — **VŠECHNY jsou v minifikovaných externích souborech** (line prefix `2:` = bundled deps, ne projektový kód). Tabs.tsx nevykazuje žádný nový warning.

**npm run build:**
- ✅ Build prošel bez chyb (0 TS errors, 0 build errors)
- Výstup obsahuje `/admin/*` routes — Tabs komponenta je zahrnuta ve výstupu

---

## C) Reverzní kontrola

**Původní bug:** Horizontální overflow na 375px (mobile) na admin stránkách se 4+ taby  
**Reported screens:** admin/vehicles, admin/brokers, admin/payments, admin/orders, admin/returns

| Požadavek | Status | Poznámka |
|-----------|--------|----------|
| Fix overflow na 375px s 4+ taby | ✅ | `overflow-x-auto` přidán na wrapper |
| Scrollbar se zobrazí jen při přetečení | ✅ | `auto` = scrollbar jen když nutný |
| Existující layout bez přetečení funguje stejně | ✅ | `auto` neovlivní short tab lists |
| Keyboard navigace (ArrowLeft/Right/Home/End) | ✅ | Nedotčena, kód nezměněn |
| Controlled/uncontrolled mód | ✅ | Nedotčen |
| className prop override | ✅ | `overflow-x-auto` je před `className`, caller může přepsat |

**CSS analýza:**  
`flex` + `overflow-x-auto` funguje správně — `flex-wrap` je defaultně `nowrap`, takže taby zůstanou na jednom řádku a wrapper scrolluje horizontálně. Tlačítka mají `min-width: auto` (flex default), takže se neschrinkují pod content width.

---

## Výsledek

✅ **SCHVÁLENO — fix je správný, čistý a přesně cílí na reportovaný bug.**

Žádné doplňkové opravy nejsou potřeba.

---

## D) TEST-CHROME verifikace — Playwright headed Chromium @ 375px

**Datum:** 2026-05-05  
**Agent:** test-chrome  
**Spec:** `e2e/chrome-test-NEW-006-tabs-fix-verify.spec.ts`

### Výsledky testů

| Stránka | scrollWidth | clientWidth | Overflow | Status |
|---------|-------------|-------------|---------|--------|
| /admin/vehicles | 375 | 375 | false | ✅ PASS |
| /admin/brokers | 375 | 375 | false | ✅ PASS |
| /admin/payments | 375 | 375 | false | ✅ PASS |
| /admin/orders | 375 | 375 | false | ✅ PASS |
| /admin/returns | 375 | 375 | false | ✅ PASS |

**5/5 PASS — P1 BUG OPRAVENO** ✅

### Dodatečný nález: Root cause byl v AdminLayout.tsx

Diagnostika odhalila, že `overflow-x-auto` v `Tabs.tsx` samotné NESTAČILO. Root cause page-level overflow byl v `AdminLayout.tsx`:

```tsx
// PŘED (bug):
<div className="flex-1 lg:ml-[280px] bg-gray-100 min-h-screen">

// PO (fix):
<div className="flex-1 min-w-0 lg:ml-[280px] bg-gray-100 min-h-screen">
```

**Proč:** Flex item (`flex-1`) bez `min-width: 0` expanduje na svůj min-content size (526px+ kvůli tab labels). `min-w-0` zabrání expandování a `overflow-x-auto` na Tabs poté skutečně funguje.

**CSS evidence:**
- Bez `min-w-0`: `div.flex-1` má computed width 525.69px @ 375px viewport → page overflow
- S `min-w-0`: `div.flex-1` má computed width 375px @ 375px viewport → scrollWidth=375 ✓
