# Chrome Browser Test — #130 #87b 3-segment Routing Final Verification
**Datum:** 2026-04-06  
**Tester:** TEST-CHROME agent  
**Task:** #129  
**Commit:** 1466223 — feat(seo): #87b 3-segment routing /dily/[brand]/[model]/[rok]  
**Playwright:** headed Chromium, localhost:3000  

---

## Výsledek: 🟡 AMBER — 10/12 PASS, 2 reálné bugy (P2)

**Core routing funguje. Dvě edge-case validace selhávají a potřebují fix.**

---

## Test výsledky

| Test | Status | Detail |
|------|--------|--------|
| T0: Dev server smoke | ✅ PASS | localhost:3000 → 200, /dily → 200 |
| T1a: Brand page `/dily/znacka/skoda` | ✅ PASS | 200, H1 "Škoda", modely grid (Octavia...) |
| T1b: Model page `/dily/znacka/skoda/octavia` | ✅ PASS | 200, H1 "Škoda Octavia", kategorie jako chips |
| T1c: Rok page `/dily/znacka/skoda/octavia/2018` | ✅ PASS | 200, H1 "Škoda Octavia 2018", canonical obsahuje slug |
| T2: Category chip click | ✅ PASS | Chip → /dily/kategorie/[slug] bez 404 |
| T3: Diakritika redirect `/dily/znacka/škoda` | ❌ FAIL | URL-encoded → `%C5%A1koda`, žádný redirect, 404 |
| T4: Year < 2000 → 404 (`bmw/rada-3/1995`) | ❌ FAIL | HTTP 200 místo 404, renderuje homepage title |
| T5: JSON-LD rok page | ✅ PASS | BreadcrumbList ✅, ItemList ✅, FAQPage ✅, no www. |
| T6: Sitemap | ✅ PASS | `/dily/znacka/skoda/octavia/2018` nalezeno v sitemap.xml |
| T7: Multi-brand (VW Golf / Ford Focus / Hyundai Kona) | ✅ PASS | Všechny 3 stránky 200, H1 správné |
| T8-MF1: Kategorie jsou chips (ne grid tiles) | ✅ PASS | 11 chip links, class `rounded-full`, SVG count = 0 |
| T9: Breadcrumb nav chain | ✅ PASS | Domů→Díly→Škoda→Octavia→2018, click funguje |

---

## Bug #1 — T3: Diakritika redirect nefunguje pro brand page

**URL:** `/dily/znacka/škoda`  
**Očekávání:** 301/308 redirect → `/dily/znacka/skoda`  
**Realita:** Prohlížeč URL-encoduje `š` → `%C5%A1koda`, final URL = `%C5%A1koda`, HTTP 404

**Root cause:**  
Brand page (`app/(web)/dily/znacka/[brand]/page.tsx`) má `dynamicParams = false`. Tato hodnota znamená, že Next.js NIKDY nespustí page funkci pro URL, která není v `generateStaticParams`. `generateStaticParams` vrací pouze canonical slugy (`skoda`, `bmw`, ...) bez diakritiky. Takže `škoda` (URL-decoded z `%C5%A1koda`) → není v static params → Next.js vrátí 404 dříve, než page funkce vůbec proběhne → `aliasFor()` redirect se nikdy nespustí.

**Rok page** (`[rok]/page.tsx`) má `dynamicParams = true` → pro rok page diakritika redirect funguje správně.

**Kód, který NEFUNGUJE v brand page:**
```tsx
// app/(web)/dily/znacka/[brand]/page.tsx
export const dynamicParams = false;  // ← BLOCKER: zabrání spuštění page funkce

// Tato logika EXISTUJE ale nikdy se nespustí pro nekanonické URL:
const canonical = aliasFor(brand);
if (canonical) {
  permanentRedirect(`/dily/znacka/${canonical}`);
}
```

**Fix:** Změnit `dynamicParams = true` na brand page (a model page), nebo přidat diakritika normalizaci do middleware.  
**Priority:** P2 — SEO/UX issue, uživatel s diakritikou v URL dostane 404 místo správné stránky.

---

## Bug #2 — T4: Year < 2000 nevrací 404 (force-static issue)

**URL:** `/dily/znacka/bmw/rada-3/1995`  
**Očekávání:** HTTP 404  
**Realita:** HTTP 200, title = "CarMakléř | Prodej aut přes certifikované makléře" (homepage title)

**Confirmation:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dily/znacka/bmw/rada-3/1995
# → 200
curl -s http://localhost:3000/dily/znacka/bmw/rada-3/1995 | grep -o '<title>[^<]*</title>'
# → <title>CarMakléř | Prodej aut přes certifikované makléře</title>
```

**Root cause:**  
Rok page má `export const dynamic = "force-static"` + `dynamicParams = true`. Pro URL mimo `generateStaticParams` (1995 není v topYears), Next.js spustí page funkci v "force-static" módu. V tomto módu je `notFound()` volání silently swallowed — server vrátí HTTP 200 s prázdným/rootovým layoutem místo 404 stránky.

**Kód, který selže:**
```tsx
// app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx
export const dynamic = "force-static";  // ← PROBLÉM: supprimuje notFound()
export const dynamicParams = true;

// Tato validace existuje ale notFound() nefunguje v force-static módu:
if (!isValidPartsYear(rok)) notFound();  // ← 1995 → false → notFound() → ale vrátí 200!
```

**Fix:** Buď:
1. Odebrat `force-static` z rok page (přepnout na ISR s revalidate), nebo
2. Přidat rok validaci do middleware, nebo  
3. Přidat rok do URL pattern v `generateStaticParams` a ponechat `dynamicParams = false` (ale pak není fallback pro neznámé roky)

**Priority:** P2 — Špatné roky vrací HTTP 200 s homepage contentem — matoucí pro uživatele i crawlery.

---

## T1c — Canonical bug (globální issue, ne #87b)

Rok page má vlastní canonical (feature funguje):
```
canonical: http://localhost:3000/dily/znacka/skoda/octavia/2018  ✅
```

Toto je správně. Rok page implementuje `alternates: { canonical: url }` v `generateMetadata` (na rozdíl od ostatních stránek, které mají global canonical = root).

---

## T5 — JSON-LD detail

```
JSON-LD script count: 4
BreadcrumbList: ✅ true
ItemList: ✅ true  
FAQPage: ✅ true (globální UNIVERSAL_FAQS)
www. v JSON-LD: ✅ false (0 výskytů)
```

Všechny 3 typy JSON-LD jsou přítomny. ✅

---

## T8-MF1 — Kategorie chips detail

```
Category chip links (/dily/kategorie/): 11
First chip class: "inline-flex items-center py-2 px-4 bg-gray-100 text-gray-700 
                   rounded-full text-sm font-medium hover:bg-orange-50 
                   hover:text-orange-600 transition-colors no-underline"
Looks like chip (rounded/px/py/text-sm): ✅ true
SVG icons inside chip: 0
MF-1 OK: Category links are text-only chips ✅
```

MF-1 specifikace splněna. ✅

---

## T9 — Breadcrumb chain

Breadcrumb links na `/dily/znacka/skoda/octavia/2018`:
```
Domů → /
Díly → /dily
Škoda → /dily/znacka/skoda
Octavia → /dily/znacka/skoda/octavia
(2018 = current page)
```
Click na "Octavia" breadcrumb → naviguje na `/dily/znacka/skoda/octavia` ✅  
Click na "Díly" breadcrumb → naviguje na `/dily` ✅

---

## Celkové skóre

| Scenario | Pass | Fail | Note |
|----------|------|------|------|
| T0 — Server smoke | 1 | 0 | |
| T1 — Brand/Model/Rok pages | 3 | 0 | |
| T2 — Category chip navigation | 1 | 0 | |
| T3 — Diakritika redirect | 0 | 1 | **BUG** `dynamicParams = false` |
| T4 — Year validation 404 | 0 | 1 | **BUG** `force-static` suppresses notFound() |
| T5 — JSON-LD | 1 | 0 | |
| T6 — Sitemap | 1 | 0 | |
| T7 — Multi-brand | 1 | 0 | |
| T8-MF1 — Chips not grid | 1 | 0 | |
| T9 — Breadcrumb nav | 1 | 0 | |
| **CELKEM** | **10** | **2** | |

---

## Verdict: 🟡 AMBER — BLOCKER před production shipem

**Core 3-segment routing funguje (10/12 testů):**
- ✅ /dily/znacka/[brand] — brand page 200, modely grid
- ✅ /dily/znacka/[brand]/[model] — model page 200, chips kategorie (MF-1 ✅)
- ✅ /dily/znacka/[brand]/[model]/[rok] — rok page 200, canonical URL ✅
- ✅ JSON-LD: BreadcrumbList + ItemList + FAQPage
- ✅ Sitemap má 3-segment URLs
- ✅ Multi-brand: VW Golf, Ford Focus, Hyundai Kona

**2 P2 bugy potřebují fix před deploy:**

| # | Bug | Soubor | Fix |
|---|-----|--------|-----|
| 1 | Diakritika redirect nefunguje pro brand page (dynamicParams=false) | `[brand]/page.tsx` + `[brand]/[model]/page.tsx` | Změnit na `dynamicParams = true` |
| 2 | Year < 2000 vrací 200 místo 404 (force-static suppresses notFound) | `[brand]/[model]/[rok]/page.tsx` | Odebrat `force-static` nebo přidat middleware validaci |

**Doporučení:** Fix obou bugů → retest T3 + T4 → pak PASS pro deploy.
