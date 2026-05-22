# QA Report — Task #18: Checkout UI 6 dopravců

**Datum:** 2026-04-06  
**Agent:** KONTROLOR  
**Commit:** `a1e0985`  
**Zkontrolováno:** 6 souborů (1 NEW + 5 MOD)

---

## 1. SIMPLIFY KONTROLA

### Pozitiva
- `lib/shipping/prices.ts` jako single source of truth — elegantní rozdělení na backend (`CARMAKLER_SHIPPING_PRICES`) a frontend (`SHIPPING_METHOD_INFO`) export ✅
- `getShippingMethods()` vrací pole seřazené dle `order` — UI pořadí ZASILKOVNA→PPL→DPD→GLS→CESKA_POSTA→PICKUP ✅
- `Record<DeliveryMethod, number>` typ-safe ceník — přidání nového dopravce způsobí compile error pokud chybí cena ✅
- Žádné duplicitní ceníky — `DELIVERY_PRICES` v `orders/route.ts` smazán, `deliveryPrices` v obou page.tsx smazán ✅
- PICKUP: `{m.price === 0 ? "Zdarma" : formatPrice(m.price)}` — správné UX ✅

### Drobnosti (neblokující)
- `dily/objednavka/page.tsx` a `shop/objednavka/page.tsx` jsou identické soubory (~280 řádků každý). Mohlo by být extrahováno do sdíleného komponentu, ale to je pre-existing duplicita mimo scope task #18.
- PPL + DPD + GLS mají stejnou `description` a `icon` — drobnost, plánováno nahradit SVG ikonami.

---

## 2. DEBUG KONTROLA

### Build
```
npm run build
✓ Compiled successfully in 19.0s
✓ Generating static pages (309/309)
```
**✅ BUILD PASSED**

### Lint
```
npm run lint
✖ 550 problems (10 errors, 540 warnings)
```
Baseline (po task #17): 550 problems.  
Nový stav: 550 problems — **0 nových problémů**.

**✅ LINT PASSED — 0 nových errors/warnings v 6 dotčených souborech**

---

## 3. REVERZNÍ KONTROLA

### lib/shipping/prices.ts (NEW)

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 1 | Exportuje `CARMAKLER_SHIPPING_PRICES` (backend map) | ✅ | prices.ts:21 `Record<DeliveryMethod, number>` |
| 2 | Ceny: ZASILKOVNA 79, DPD 109, PPL 99, GLS 109, CESKA_POSTA 129, PICKUP 0 | ✅ | prices.ts:22-28 |
| 3 | Exportuje `SHIPPING_METHOD_INFO` (frontend meta) | ✅ | prices.ts:51 |
| 4 | Exportuje `getShippingPrice(method)` | ✅ | prices.ts:33 |
| 5 | Exportuje `getShippingMethods()` | ✅ | prices.ts:111 |

### lib/validators/parts.ts

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 6 | Zod enum má všech 6 metod | ✅ | validators/parts.ts:74 `z.enum(["ZASILKOVNA","DPD","PPL","GLS","CESKA_POSTA","PICKUP"])` |
| 7 | `refine` pro zasilkovnaPointId zůstalo beze změny | ✅ | validators/parts.ts:79-82 |

### app/api/orders/route.ts

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 8 | Import `getShippingPrice` z `@/lib/shipping/prices` | ✅ | orders/route.ts:9 |
| 9 | Lokální `DELIVERY_PRICES` map smazán | ✅ | grep: žádný výskyt `DELIVERY_PRICES` v codebase |
| 10 | `deliveryPrice = getShippingPrice(data.deliveryMethod)` | ✅ | orders/route.ts:74 |

### components/web/OrderForm.tsx

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 11 | Radio karty místo Select pro 6 metod | ✅ | OrderForm.tsx:117-179 iterace `shippingMethods` |
| 12 | ZasilkovnaWidget embedded uvnitř ZASILKOVNA karty | ✅ | OrderForm.tsx:158-167 |
| 13 | PICKUP info box uvnitř PICKUP karty | ✅ | OrderForm.tsx:170-175 |
| 14 | Orange highlight vybrané karty (#F97316) | ✅ | OrderForm.tsx:123 `border-orange-500 bg-orange-50` |
| 15 | PICKUP zobrazí "Zdarma" | ✅ | OrderForm.tsx:151 `m.price === 0 ? "Zdarma"` |

### app/(web)/shop/objednavka/page.tsx

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 16 | Import `getShippingPrice` | ✅ | page.tsx:9 |
| 17 | Lokální `deliveryPrices` map smazán | ✅ | grep: žádný výskyt `deliveryPrices` |
| 18 | Používá `getShippingPrice()` s cast na `DeliveryMethod` | ✅ | page.tsx:55-57 |

### app/(web)/dily/objednavka/page.tsx

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 19 | Mirror změny jako shop/page.tsx | ✅ | Identická implementace |

### Scope audit

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 20 | `lib/shipping` importy jen v eshopu | ✅ | 5 souborů: shop/objednavka, dily/objednavka, api/orders, stripe/webhook, OrderForm.tsx |
| 21 | 0 výsledků v `app/(web)/marketplace/` | ✅ | grep: no files |
| 22 | 0 výsledků v `app/(web)/inzerce/` | ✅ | grep: no files |
| 23 | 0 výsledků v `app/(pwa)/makler/` | ✅ | grep: no files |
| 24 | 0 výsledků v `app/(admin)/admin/` | ✅ | grep: no files |
| 25 | TypeScript `DeliveryMethod` type = Prisma schema | ✅ | Prisma schema:984 (String s komentářem) + shipping/types.ts = 6 hodnot shodně |
| 26 | Žádné nové ENV proměnné | ✅ | žádné `process.env.*` v prices.ts |
| 27 | Žádná DB migrace | ✅ | Poslední migrace z task #16 |
| 28 | Unused imports odstraněny | ✅ | 0 nových lint warnings v dotčených souborech |

**Celkem: 28/28 ✅**

---

## SOUHRN

| Check | Výsledek |
|-------|---------|
| Simplify | ✅ Čisté, 2 neblokující drobnosti |
| Build | ✅ PASSED (309/309) |
| Lint | ✅ 0 nových problémů (baseline 550) |
| Scope audit | ✅ shipping/prices POUZE eshop |
| Reverzní kontrola | ✅ 28/28 |

**Celkové hodnocení: ✅ QA #18 PASS**
