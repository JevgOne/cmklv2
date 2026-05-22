# QA: SEO Interlinking

**Datum:** 2026-04-21  
**Kontrolor:** kontrolor agent  
**Scope:** lib/seo-crosslinks.ts, VehicleLandingPage, BrandLandingContent, ModelLandingContent, dily/znacka, jak-prodat-auto, kolik-stoji-moje-auto

---

## VÝSLEDEK: ✅ APPROVED — Build + lint čisté, interlinking implementován správně

---

## 1. SIMPLIFY KONTROLA

### lib/seo-crosslinks.ts
- Čistý utility modul — 2 bridge funkce + 1 konstanta
- `getVehicleToPartsBridge`: guard `PARTS_BRANDS.find(b => b.slug === brandSlug)` — bezpečné, vrátí `[]` pokud značka nemá díly ✅
- `getPartsToVehicleBridge`: symetrická funkce, model je optional ✅
- `SERVICE_CROSS_LINKS`: statická konstanta, správně sdílená přes import ✅
- Žádné duplicity, žádný zbytečný kód

### VehicleLandingPage.tsx
- Sdílená šablona pro všechny landing pages — správný abstrakční level
- `allCrossLinks = [...(crossLinks || []), ...SERVICE_CROSS_LINKS]` — merge bridge + services ✅
- 7 sekcí: breadcrumbs, hero, AI snippet, children slot, SEO text, FAQ, CTA, cross-links, related links
- Všechny linky přes `<Link>` (next/link) — správně ✅

---

## 2. DEBUG KONTROLA

### npm run build
```
✅ BUILD PASSES
✓ Compiled successfully in 24.7s
```

### npm run lint (všechny soubory)
```
✅ 0 problems (0 errors, 0 warnings)
```
Zkontrolované soubory:
- lib/seo-crosslinks.ts ✅
- components/web/VehicleLandingPage.tsx ✅
- components/web/BrandLandingContent.tsx ✅
- components/web/ModelLandingContent.tsx ✅
- app/(web)/jak-prodat-auto/page.tsx ✅
- app/(web)/kolik-stoji-moje-auto/page.tsx ✅
- app/(web)/dily/znacka/[brand]/page.tsx ✅

---

## 3. REVERZNÍ KONTROLA (Evžen: shoda se zadáním)

Zadání uživatele: *"propojení SEO stránek, zpětné odkazy, anchor texty, strukturované pro Google"*

### Propojení SEO stránek — implementační mapa

| Stránka | Cross-links do | Zpětné linky z |
|---|---|---|
| `/nabidka/[brand]` | `/dily/znacka/[brand]` (bridge), 3× služby, 8× jiné značky, body types, ceny | — |
| `/nabidka/[brand]/[model]` | `/dily/znacka/[brand]/[model]` + brand (bridge), 3× služby, sibling modely, konkurenti | — |
| `/dily/znacka/[brand]` | `/nabidka/[brand]` (parts-to-vehicle bridge) | ← z `/nabidka/[brand]` |
| `/jak-prodat-auto` | `/kolik-stoji-moje-auto`, `/sluzby/proverka`, `/sluzby/financovani`, `/nabidka`, `/makleri`, `/sluzby/pojisteni`, `/chci-prodat` | ← z `/kolik-stoji-moje-auto` (cross-link) |
| `/kolik-stoji-moje-auto` | `/jak-prodat-auto`, `/sluzby/proverka`, `/sluzby/financovani`, `/nabidka`, `/makleri`, `/sluzby/pojisteni`, `/chci-prodat` | ← z `/jak-prodat-auto` (cross-link) |

**Obousměrné propojení (zpětné linky):**
- `/nabidka/[brand]` ↔ `/dily/znacka/[brand]` ✅ (bridge v obou směrech)
- `/jak-prodat-auto` ↔ `/kolik-stoji-moje-auto` ✅

### Anchor texty — kvalita

| Link | Anchor text | Hodnocení |
|---|---|---|
| vehicle → parts brand | "Všechny díly {BrandName}" | ✅ deskriptivní |
| vehicle → parts model | "Díly pro {Brand} {Model}" | ✅ deskriptivní |
| parts → vehicle brand | "Ojeté vozy {BrandName}" | ✅ deskriptivní |
| parts → vehicle model | "Ojetá {Brand} {Model}" | ✅ deskriptivní |
| brand landing → service | "Prověrka vozidla", "Financování", "Pojištění vozidla" | ✅ |
| model → siblings | "{Brand} {Model}" (konkrétní modely) | ✅ |
| jak-prodat-auto → last | "Jak ohodnotit auto", "Prověrka vozidla", ... | ✅ |

Žádné generické "klikněte zde" anchor texty ✅

### Strukturované pro Google (JSON-LD)

| Stránka | JSON-LD typy |
|---|---|
| Brand landing | `BreadcrumbList` + `FAQPage` + `WebPage` + `ItemList` (brand+models) |
| Model landing | `BreadcrumbList` + `FAQPage` + `WebPage` + `AggregateOffer` |
| jak-prodat-auto | `BreadcrumbList` + `FAQPage` + `Article` + `HowTo` |

- `data-speakable="true"` na AI Answer Box sekci — GEO/AIEO optimalizace ✅
- `speakableCssSelectors: ["[data-speakable]"]` v WebPage JSON-LD ✅
- AggregateOffer obsahuje `lowPrice`, `highPrice`, `offerCount` ✅

---

## 4. DETAILNÍ KONTROLA KOMPONENT

### BrandLandingContent.tsx
- ✅ `getVehicleToPartsBridge({ brandSlug, brandName })` → pouze brand-level bridge
- ✅ `relatedLinks`: 8 jiných značek + 4 body types + 3 price ranges (bohaté propojení)
- ✅ CTA personalizovaný: "Prodat {BrandName} s makléřem"
- ✅ Top models grid jako `children` slot → interní linking na model pages
- ✅ `filterHref`: `/nabidka?brand={Brand}` — link na filtrovaný katalog

### ModelLandingContent.tsx
- ✅ `getVehicleToPartsBridge({ brandSlug, brandName, modelSlug, modelName })` → model+brand bridge (2 linky)
- ✅ `relatedLinks`: link na brand page + sibling modely + konkurenti (competitor linky vedou na `/nabidka` — obecné, přijatelné)
- ⚠️ **Minor**: Competitor links vedou na `/nabidka` (obecné) místo `/nabidka?brand=competitor` — menší missed opportunity. Neblokující.

### dily/znacka/[brand]/page.tsx
- ✅ Importuje `getPartsToVehicleBridge` z `@/lib/seo-crosslinks`
- ✅ Line 286: vykresluje bridge linky (zpětné do vehiclelanding pages)

### jak-prodat-auto/page.tsx
- ✅ 6 cross-link pill buttons + 1 CTA: kolik-stoji-moje-auto, prověrka, financování, nabídka, makléři, pojištění
- ✅ Funkce HowTo JSON-LD s 7 kroky
- ✅ Vzájemný odkaz s `/kolik-stoji-moje-auto` ✅

### kolik-stoji-moje-auto/page.tsx
- ✅ 6 cross-link pill buttons + 1 CTA: jak-prodat-auto, prověrka, financování, nabídka, makléři, pojištění
- ✅ Symetrické s jak-prodat-auto ✅

---

## 5. POZNÁMKA: Chrome test na produkci

**MIMO SCOPE KONTROLORA** — Chrome test na carmakler.cz je úkol pro `test-chrome` agenta. Kontrolor ověřil kód — produkční test vyžaduje živý browser.

---

## ZÁVĚR

| Soubor | Status | Poznámka |
|---|---|---|
| lib/seo-crosslinks.ts | ✅ APPROVED | Clean utility, guard pro PARTS_BRANDS |
| VehicleLandingPage.tsx | ✅ APPROVED | merge crossLinks + SERVICE_CROSS_LINKS |
| BrandLandingContent.tsx | ✅ APPROVED | bridge + rich relatedLinks + JSON-LD |
| ModelLandingContent.tsx | ✅ APPROVED | model bridge + sibling links |
| dily/znacka/[brand] | ✅ APPROVED | zpětný getPartsToVehicleBridge |
| jak-prodat-auto | ✅ APPROVED | 6 cross-links + HowTo + Article JSON-LD |
| kolik-stoji-moje-auto | ✅ APPROVED | 6 cross-links, symetrické |
| Build | ✅ PASS | |
| Lint | ✅ 0 errors/warnings | |

**Evžen shoda se zadáním:** Interlinking splňuje všechny 3 cíle — propojení SEO stránek ✅, obousměrné zpětné odkazy ✅, deskriptivní anchor texty ✅, strukturované JSON-LD pro Google ✅.

**Minor finding (neblokující):** Competitor links v ModelLandingContent vedou na generické `/nabidka` místo `/nabidka?brand=competitor` — lze vyřešit later.
