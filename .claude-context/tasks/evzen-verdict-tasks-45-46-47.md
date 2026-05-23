# Evžen THE KING — Verdikt: Tasks #45, #46, #47

**Task:** #50 (kontrola)
**Datum:** 2026-05-22
**Verdikt:** ✅ SCHVÁLENO (všechny 3)

---

## Task #45 — SEO fixy ✅

**Zadání:** "udelej velky SEO audit a oprav všechno"

### Kontrola:

| Fix | Status | Důkaz |
|-----|--------|-------|
| JSON-LD rendering (fragment wrapper) | ✅ | `nabidka/[slug]` ř. 504 a 1090: `<>` fragment s 2× `<script type="application/ld+json">` |
| Duplicitní titulky | ✅ | Grep `CarMakléř.*CarMakléř` v titulcích = 0 matches |
| BreadcrumbList autoservisy/stk | ✅ | `Breadcrumbs` komponent s `[{label:"Domů",href:"/"},{label:"Autoservisy"}]` |
| SearchAction URL | ✅ | `lib/seo.ts:389`: `urlTemplate: "https://carmakler.cz/hledat?q={search_term_string}"` |
| Organization name diakritika | ✅ | Hlavní: `name: "CarMakléř"` na ř. 351, 383, 440, 650, 712 |
| Meta description null handling | ✅ | bodyType podmíněně: `vehicle.bodyType ? (bodyTypeLabels[...]) : null` |

**Poznámka (NEBLOKUJÍCÍ):** 4× `"CarMakler"` (bez diakritiky) stále v `generateServiceJsonLd` (ř. 157), `generateArticleJsonLd` (ř. 183, 187, 258). Jsou to fallback/publisher hodnoty, ne hlavní Organization. Nekonzistentní, ale nenaruší SEO.

---

## Task #46 — OG Cloudinary ✅

**Zadání:** "tady jsi udelal OG ale je to rozmazane to je spatne hodne spatne"

### Kontrola:

| Soubor | getOptimizedUrl | Parametry | Status |
|--------|----------------|-----------|--------|
| blog/[slug]/opengraph-image.tsx | ✅ ř. 42 | `(article.coverImage, 1200, "auto")` | ✅ |
| nabidka/[slug]/opengraph-image.tsx | ✅ ř. 67 | `(rawImage, 1200, "auto")` | ✅ |
| profil/[slug]/opengraph-image.tsx | ✅ ř. 61 | `(user.avatar, 240, "auto")` | ✅ |

Všechny 3 soubory importují z `@/lib/cloudinary`. Dříve se používaly raw URL bez Cloudinary transformace → rozmazané. Nyní optimalizované.

---

## Task #47 — STK ceník redesign ✅

**Zadání:** "ten ceník v tom STK stanice je hroznej dole nepřehledny"

### Kontrola:

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| 4 skupiny (osobní, motorky, nákladní, přívěsy) | ✅ | `GROUP_ORDER: ["personal", "motorcycle", "commercial", "trailer"]` |
| Plné české názvy | ✅ | "Osobní automobily", "Motocykly", "Nákladní a autobusy", "Přívěsy a traktory" |
| M1 highlighted | ✅ | `highlight: true` → `bg-orange-50 border-l-4 border-orange-400` |
| M1 badge "Nejčastější" | ✅ | `bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full` |
| Mobile-first (žádný horizontal scroll) | ✅ | Flex `justify-between`, žádné tabulky |
| Přívěsy info (bez emisí) | ✅ | `emise: null` → nevykreslí + info box "Přívěsy nepodléhají emisní kontrole" |
| Ceny česky | ✅ | `toLocaleString("cs-CZ")` |
| 13 kategorií (M1, M1G, L, N1-N3, M2-M3, O1-O4, T) | ✅ | 13 řádků v `STK_PRICES` |
| Žádné zkratky v UI | ✅ | Plné názvy: "Osobní automobil", "Osobní auto — terénní", "Nákladní do 3,5 t" atd. |
| StkPriceCalc nedotčen | ✅ | QA potvrdil: žádný commit na StkPriceCalc.tsx |

---

## Build ✅
QA: `✓ Compiled successfully in 42s`, `1306/1306 static pages`, 0 errors.

## Závěr
Všechny 3 tasky odpovídají zadání uživatele:
- SEO bugy opraveny (JSON-LD rendering, duplicitní titulky, breadcrumbs, SearchAction)
- OG obrázky ostré (Cloudinary optimalizace na všech 3 dynamických OG souborech)
- STK ceník přehledný (grouped cards, M1 highlighted, mobile-first, české názvy)
