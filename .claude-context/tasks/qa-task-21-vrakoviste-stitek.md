# QA Report — Task #21: ShippingLabelCard + mark shipped flow

**Datum:** 2026-04-06  
**Agent:** KONTROLOR  
**Commit:** `db0d127`  
**Zkontrolováno:** 5 production souborů (1 NEW + 4 EDIT)

---

## 1. SIMPLIFY KONTROLA

### `components/pwa-parts/orders/ShippingLabelCard.tsx` (364 řádků)

- `"use client"` na řádku 1 ✅ (window.confirm + fetch + useState vyžaduje)
- Early return pattern, 5 variant ve správném pořadí ✅
- **Variant 1 PICKUP** (řádek 144): info box, adresa, "Označit jako vyzvednuto" → `PUT DELIVERED` ✅
- **Variant 2 Odesláno** (řádek 188): success box, datum, dopravce, tracking link ✅
- **Variant 3 Štítek není připraven** (řádek 232): amber warning "Čekáme na platbu", disabled button ✅
- **Variant 4 Happy path** (řádek 264): [Stáhnout PDF] + [Označit jako odesláno] ✅
- **Variant 5 DRY-RUN overlay** (řádek 279): banner na variantě 4, `trackingNumber.startsWith("DRY-")` ✅
- `window.confirm` v `putStatus()` helper (řádek 104): `if (!window.confirm(confirmMessage)) return;` ✅
- `PUT /api/orders/${orderId}/status` — **žádný nový endpoint**, reuse existujícího ✅
- Error state: `useState<string | null>(null)` + červený box (řádek 334) ✅
- Submitting state: `useState(false)` + `disabled={submitting}` + text "Ukládá se…" ✅
- Multi-supplier warning (řádek 291): blue info box při `supplierCount > 1` ✅
- ZASILKOVNA → `zasilkovnaPointName` místo ulice (řádek 260-262) ✅
- PDF download jako `<a target="_blank">` → nativní viewer ✅
- WCAG touch targety: `size="lg" w-full` → dostatečná výška CTA buttonů ✅
- `CARRIER_LABELS` mapa + `localizedCarrier()` helper — DRY ✅

### `app/(pwa-parts)/parts/orders/[id]/page.tsx`

- `OrderStatus` union: `"NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED"` — **PACKING odstraněn** ✅
- `mapToApiStatus`: pouze `PENDING → NEW` case, default return status — **PACKING odstraněn** ✅
- `statusConfig`: 5 klíčů, PACKING chybí — **PACKING odstraněn** ✅
- `fetchOrder` extrahována na top-level (řádek 81) — znovu použitelná jako callback ✅
- `supplierCount = new Set(order.items.map((i) => i.supplier.id)).size` ✅
- `ShippingLabelCard` integrována s podmínkou `status !== "NEW" && status !== "CANCELLED"` (řádek 235) ✅
- `onShipped={fetchOrder}` + `onDelivered={fetchOrder}` → server state refresh ✅
- `<OrderActions>` bez `orderId` prop ✅

### `components/pwa-parts/orders/OrderActions.tsx`

- `OrderStatus` union: bez PACKING ✅
- `nextAction` dict: pouze `{ NEW: {...} }` — **1 akce** (confirm NEW → CONFIRMED) ✅
- CONFIRMED info text (řádek 20-25): "Stáhněte si přepravní štítek výše…" ✅
- `orderId` prop odstraněn z interface ✅
- Tracking input odstraněn — tracking řeší backend ✅

### `app/(pwa-parts)/parts/orders/page.tsx`

- Tab "K odeslání" (řádek 10) ✅
- Filter logika (řádek 81-86):
  ```typescript
  o.shippingLabelUrl != null && o.shippedAt == null && o.status !== "CANCELLED"
  ```
  ✅ Správně — filtruje jen objednávky kde štítek je, ale ještě neodeslány
- `getShippingBadge(order)` helper (řádek 45-51): `"label-ready"` | `"shipped"` | `null` ✅
- `fetch("/api/orders?role=supplier")` → backend filtruje `items.some({ supplierId: session.user.id })` ✅
- `PACKING` odstraněn z `mapStatus` (řádek 34-43) ✅

### `components/pwa-parts/orders/OrderCard.tsx`

- `OrderStatus` union: bez PACKING ✅
- `shippingBadge?: "label-ready" | "shipped" | null` — volitelný prop (řádek 16), default `= null` ✅
- Badge `"label-ready"` → "🏷️ Štítek připraven" (orange pill, řádek 48-51) ✅
- Badge `"shipped"` → "📦 Odesláno" (green pill, řádek 53-57) ✅
- `flex-wrap` na header row → mobile fallback ✅
- `statusConfig`: 5 klíčů bez PACKING ✅

---

## 2. DEBUG KONTROLA

### Kritický guardrail — `PUT /api/orders/[id]/status`

```
grep -rn "sendEmail" app/api/orders/ → 0 matches
```

**✅ CONFIRMED: `sendEmail()` NENÍ voláno na SHIPPED transition.** Endpoint pouze:
- `SHIPPED`: nastaví `shippedAt = new Date()`
- `DELIVERED`: nastaví `deliveredAt + paymentStatus = PAID`
- `CANCELLED`: vrátí stock

Customer email z webhooku task #19 zůstává beze změny — žádná duplicitní notifikace. ✅

### Supplier auth v API

`PUT /api/orders/[id]/status` (řádek 37-40):
```typescript
const isSupplier = existing.items.some((i) => i.supplierId === session.user.id);
if (!isSupplier && !isAdmin) { return 403; }
```
**✅** Supplier může měnit status pouze objednávek, kde má své díly.

### PACKING grep — 4 scope soubory

```
grep PACKING app/(pwa-parts)/parts/orders/[id]/page.tsx → 0 matches
grep PACKING components/pwa-parts/orders/OrderActions.tsx → 0 matches
grep PACKING components/pwa-parts/orders/OrderCard.tsx → 0 matches
grep PACKING app/(pwa-parts)/parts/orders/page.tsx → 0 matches
```

**✅ PACKING odstraněn ze všech 4 požadovaných souborů.**

> **Poznámka (neblokující):** PACKING stále existuje v 3 customer-facing souborech mimo scope task #21:
> - `components/web/OrderTracker.tsx`
> - `app/(web)/shop/objednavky/sledovani/[token]/page.tsx`
> - `app/(web)/dily/moje-objednavky/page.tsx`
> - `app/(web)/shop/moje-objednavky/page.tsx`
>
> Tyto soubory jsou customer-facing trackers — out of scope pro task #21 (pwa-parts). Cleanup těchto souborů je doporučen jako samostatný task.

### Build

```
npm run build
✓ Compiled successfully in 26.1s
✓ Generating static pages (309/309)
```

**✅ BUILD PASSED**

### Lint

```
npm run lint
✖ 548 problems (10 errors, 538 warnings)
```

Baseline (po task #28): **549 problems**.  
Nový stav: **548 problems — o 1 méně** (1 pre-existing warning odstraněn task #21).  
Žádné chyby/warningy v dotčených souborech.

**✅ LINT PASSED — 0 nových problémů, 1 zlepšení**

---

## 3. REVERZNÍ KONTROLA PROTI PLÁNU

### 5 schválených odchylek:

| Odchylka | Stav | Poznámka |
|----------|------|----------|
| `fetchOrder` extrahována z useEffect | ✅ | Správné — refetch po mark-shipped je čistší než local state mutation |
| `orderId` prop odstraněn z OrderActions | ✅ | Prop nebyl nikde používán, TypeScript vynucuje správné volání |
| `getShippingBadge` jako plain funkce v list page | ✅ | Jednorázový use — SRP správně bez over-engineering |
| Tab label "K odeslání" | ✅ | Konzistentní s headerem v ShippingLabelCard |
| `"use client"` + `useState` místo Server Actions | ✅ | window.confirm + fetch vyžaduje client context |

### Acceptance criteria:

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 1 | `ShippingLabelCard.tsx` existuje s 5 variantami | ✅ | ShippingLabelCard.tsx:144,188,232,264,279 |
| 2 | Variant 1: PICKUP + "Označit jako vyzvednuto" → DELIVERED | ✅ | řádek 144-185 |
| 3 | Variant 2: shippedAt → success box + tracking link | ✅ | řádek 188-229 |
| 4 | Variant 3: shippingLabelUrl==null → disabled stav | ✅ | řádek 232-257 |
| 5 | Variant 4: [Stáhnout PDF] + [Označit jako odesláno] | ✅ | řádek 264-363 |
| 6 | Variant 5: DRY-RUN overlay na variantě 4 | ✅ | řádek 279-288 |
| 7 | `window.confirm` před mark shipped + mark delivered | ✅ | putStatus():104 |
| 8 | `PUT /api/orders/[id]/status` — žádný nový endpoint | ✅ | řádek 109 |
| 9 | **NESMÍ volat `sendEmail()` na SHIPPED** | ✅ | grep → 0 matches |
| 10 | Error handling — červený box | ✅ | řádek 334 |
| 11 | Submitting state — disabled + "Ukládá se…" | ✅ | disabled={submitting} |
| 12 | Multi-supplier warning při supplierCount > 1 | ✅ | řádek 291-300 |
| 13 | ZASILKOVNA → pointName místo ulice | ✅ | řádek 260-262 |
| 14 | PACKING odstraněn z detail page (3 místa) | ✅ | OrderStatus, mapToApiStatus, statusConfig |
| 15 | PACKING odstraněn z OrderActions | ✅ | OrderStatus, nextAction |
| 16 | PACKING odstraněn z OrderCard | ✅ | OrderStatus, statusConfig |
| 17 | PACKING odstraněn z list page mapStatus | ✅ | řádek 34-43 |
| 18 | OrderActions: pouze NEW → CONFIRMED + cancel | ✅ | nextAction = {NEW: ...} |
| 19 | OrderActions info text po CONFIRMED | ✅ | řádek 20-25 |
| 20 | Tab "K odeslání" v list page | ✅ | tabs[2] |
| 21 | Filter: shippingLabelUrl != null && shippedAt == null | ✅ | řádek 81-86 |
| 22 | Supplier filtr — jen objednávky daného vrakoviště | ✅ | GET /api/orders?role=supplier → supplierId |
| 23 | `shippingBadge` prop volitelný v OrderCard | ✅ | default = null |
| 24 | `fetchOrder` extrahována pro refetch | ✅ | page.tsx:81 |
| 25 | `npm run build` prošel (309/309) | ✅ | viz Debug |
| 26 | Lint — 0 nových problémů | ✅ | 548 (-1 vs baseline) |

**Celkem: 26/26 ✅**

---

## SOUHRN

| Check | Výsledek |
|-------|---------|
| Simplify | ✅ ShippingLabelCard čistá, 5 variant, early return pattern |
| Guardrail sendEmail | ✅ 0 výskytů v api/orders/ — email flow nedotčen |
| PACKING removal | ✅ Odstraněn ze všech 4 pwa-parts souborů |
| Build | ✅ PASSED (309/309) |
| Lint | ✅ 548 (-1 oproti baseline 549) |
| 5 approved odchylek | ✅ Všechny správně implementovány |
| Reverzní kontrola | ✅ 26/26 |

**Celkové hodnocení: ✅ QA #21 PASS**

---

## Doporučení (neblokující)

1. **PACKING cleanup ve web souborech** — 4 customer-facing soubory (`OrderTracker.tsx`, 2× `moje-objednavky/page.tsx`, `sledovani/[token]/page.tsx`) stále obsahují PACKING v type union. Pokud se DB enum PACKING odstraní v migraci, TypeScript to zachytí. Doporučen cleanup task.
2. **Manuální test DRY-RUN flow** — ověřit že dev dispatcher generuje `trackingNumber` s prefixem `DRY-`.
3. **Manuální test PICKUP flow** — ověřit že klik "Označit jako vyzvednuto" nastaví status=DELIVERED a OrderCard zobrazí "Doručeno".
