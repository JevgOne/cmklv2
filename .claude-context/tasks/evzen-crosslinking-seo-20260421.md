# Evžen THE KING — Verdikt: SEO Interlinking

**Datum:** 2026-04-21  
**Kontrolor:** Evžen THE KING  
**Zadání uživatele:** "propojení SEO stránek, zpětné odkazy, anchor texty, strukturované pro Google"

---

## VÝSLEDEK: ✅ SCHVÁLENO — Interlinking splňuje všechny 4 požadavky ze zadání

---

## KONTROLA SHODY SE ZADÁNÍM

### Požadavek 1: "propojení SEO stránek"

| Stránka | Propojení na | Status |
|---|---|---|
| `/nabidka/[brand]` | → `/dily/znacka/[brand]` (bridge) + 3× služby + 8 značek + body types + ceny | ✅ |
| `/nabidka/[brand]/[model]` | → `/dily/znacka/[brand]/[model]` + brand (bridge) + 3× služby + sibling modely | ✅ |
| `/dily/znacka/[brand]` | → `/nabidka/[brand]` (zpětný bridge) | ✅ |
| `/jak-prodat-auto` | → 6 cross-link pills (kolik-stoji, prověrka, financování, nabídka, makléři, pojištění) | ✅ |
| `/kolik-stoji-moje-auto` | → 6 cross-link pills (jak-prodat, prověrka, financování, nabídka, makléři, pojištění) | ✅ |

**Shoda:** Stránky JSOU propojené — žádná z nich není mrtvý konec. ✅

---

### Požadavek 2: "zpětné odkazy"

| Směr A → B | Směr B → A | Obousměrné? |
|---|---|---|
| `/nabidka/[brand]` → `/dily/znacka/[brand]` | `/dily/znacka/[brand]` → `/nabidka/[brand]` | ✅ ANO |
| `/jak-prodat-auto` → `/kolik-stoji-moje-auto` | `/kolik-stoji-moje-auto` → `/jak-prodat-auto` | ✅ ANO |

**Implementace:**
- `getVehicleToPartsBridge()` v `lib/seo-crosslinks.ts` řádky 12-36 — vehicle→parts ✅
- `getPartsToVehicleBridge()` v `lib/seo-crosslinks.ts` řádky 41-61 — parts→vehicle ✅
- Guard: `PARTS_BRANDS.find(b => b.slug === brandSlug)` — vrací `[]` pokud značka nemá díly ✅

**Shoda:** Zpětné odkazy fungují obousměrně. ✅

---

### Požadavek 3: "anchor texty"

| Link | Anchor text | Deskriptivní? |
|---|---|---|
| vehicle → parts brand | "Všechny díly {BrandName}" | ✅ ANO |
| vehicle → parts model | "Díly pro {Brand} {Model}" | ✅ ANO |
| parts → vehicle brand | "Ojeté vozy {BrandName}" | ✅ ANO |
| parts → vehicle model | "Ojetá {Brand} {Model}" | ✅ ANO |
| brand → services | "Prověrka vozidla", "Financování", "Pojištění vozidla" | ✅ ANO |
| jak-prodat → linky | "Jak ohodnotit auto", "Prověrka vozidla", ... | ✅ ANO |

**Žádné generické "klikněte zde" ani "více info"** — všechny anchor texty jsou deskriptivní a obsahují klíčová slova. ✅

**Shoda:** Anchor texty splňují SEO best practices. ✅

---

### Požadavek 4: "strukturované pro Google"

| Stránka | JSON-LD typy |
|---|---|
| Brand landing | `BreadcrumbList` + `FAQPage` + `WebPage` + `ItemList` |
| Model landing | `BreadcrumbList` + `FAQPage` + `WebPage` + `AggregateOffer` |
| jak-prodat-auto | `BreadcrumbList` + `FAQPage` + `Article` + `HowTo` |

- `data-speakable="true"` na AI Answer Box — GEO/AIEO optimalizace ✅
- `speakableCssSelectors: ["[data-speakable]"]` v WebPage JSON-LD ✅

**Shoda:** Strukturovaná data přítomna a správně implementována. ✅

---

## KONTROLA IMPLEMENTAČNÍCH SOUBORŮ

| Soubor | Co jsem ověřil | Verdikt |
|---|---|---|
| `lib/seo-crosslinks.ts` | 2 bridge funkce + 1 konstanta, PARTS_BRANDS guard | ✅ SCHVÁLENO |
| `components/web/VehicleLandingPage.tsx` | `crossLinks` prop + `allCrossLinks` merge se `SERVICE_CROSS_LINKS` | ✅ SCHVÁLENO |
| `components/web/BrandLandingContent.tsx` | `getVehicleToPartsBridge({ brandSlug, brandName })` | ✅ SCHVÁLENO |
| `components/web/ModelLandingContent.tsx` | `getVehicleToPartsBridge({ brandSlug, brandName, modelSlug, modelName })` | ✅ SCHVÁLENO |
| `app/(web)/dily/znacka/[brand]/page.tsx` | `getPartsToVehicleBridge` import + rendering řádek 286 | ✅ SCHVÁLENO |
| `app/(web)/jak-prodat-auto/page.tsx` | 6 cross-link pills + HowTo JSON-LD | ✅ SCHVÁLENO |
| `app/(web)/kolik-stoji-moje-auto/page.tsx` | 6 symetrických cross-link pills | ✅ SCHVÁLENO |

---

## MINOR FINDING (NEBLOKUJÍCÍ)

- **Competitor links v `ModelLandingContent.tsx`** vedou na generické `/nabidka` místo `/nabidka?brand=competitor` — menší missed opportunity pro přesnější interlinking. Převzato z QA reportu, potvrzuji jako neblokující.

---

## CELKOVÝ VERDIKT

| Požadavek uživatele | Splněno? |
|---|---|
| "propojení SEO stránek" | ✅ SCHVÁLENO — 5 skupin stránek propojeno |
| "zpětné odkazy" | ✅ SCHVÁLENO — obousměrné bridge linky |
| "anchor texty" | ✅ SCHVÁLENO — deskriptivní, s klíčovými slovy |
| "strukturované pro Google" | ✅ SCHVÁLENO — JSON-LD na všech stránkách |

**FINÁLNÍ VERDIKT: ✅ SCHVÁLENO**

---

*Evžen THE KING, 2026-04-21*
