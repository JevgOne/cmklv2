# QA Report — Task #43: SubOrder model (commit f85bf99)

**Datum:** 2026-04-14  
**Agent:** KONTROLOR  
**Commit:** `f85bf99` — `feat: add SubOrder model — schema, APIs, order split per supplier`  
**Soubory:** 8 souborů (494 insertions, 92 deletions)

---

## BUILD CHECK

```
npx tsc --noEmit → 0 errors v app/lib (3 pre-existing v e2e/)
```
**TypeScript: ✅ PASS**

---

## 1. PRISMA SCHEMA — SubOrder model

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | `model SubOrder` s @id cuid | ✅ | |
| 2 | orderId → Order onDelete: Cascade | ✅ | |
| 3 | supplierId → User ("SupplierSubOrders") | ✅ | |
| 4 | status: PENDING/CONFIRMED/SHIPPED/DELIVERED/CANCELLED | ✅ | |
| 5 | deliveryMethod, deliveryPrice, zasilkovnaPointId/Name | ✅ | |
| 6 | trackingNumber, trackingCarrier, trackingUrl, shippingLabelUrl | ✅ | |
| 7 | shippedAt, deliveredAt | ✅ | |
| 8 | commissionRate Decimal(4,2)?, carmaklerFee Int?, supplierPayout Int? | ✅ | pole existují, viz GAP-2 |
| 9 | subtotal Int, shippingPrice Int | ✅ | |
| 10 | items OrderItem[], returns ReturnRequest[] | ✅ | |
| 11 | @@index([orderId, supplierId, status]) | ✅ | |
| 12 | OrderItem.subOrderId String? + relace | ✅ | |
| 13 | ReturnRequest.subOrderId String? + relace | ✅ | |
| 14 | User.supplierSubOrders SubOrder[] relace | ✅ | |

**Schema: 14/14 ✅**

---

## 2. PUT /api/suborders/[id]/status

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | Zod: status enum CONFIRMED/SHIPPED/DELIVERED/CANCELLED | ✅ | PENDING záměrně chybí |
| 2 | Auth: supplier owns OR ADMIN/BACKOFFICE | ✅ | |
| 3 | 404 pokud SubOrder neexistuje | ✅ | |
| 4 | shippedAt auto-set při SHIPPED | ✅ | idempotentní |
| 5 | deliveredAt auto-set při DELIVERED | ✅ | idempotentní |
| 6 | CANCELLED → stock restore (increment) | ✅ | per item ✅ |
| 7 | Order status aggregation po aktualizaci | ✅ | fetchuje ČERSTVÁ data z DB ✅ |
| 8 | aggregateOrderStatus: all CANCELLED → CANCELLED | ✅ | |
| 9 | aggregateOrderStatus: worst (Math.min idx) | ✅ | |

**status route: 9/9 ✅**

---

## 3. PUT /api/suborders/[id]/tracking

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | Zod: trackingNumber (required), trackingCarrier/Url (optional) | ✅ | |
| 2 | Auth: supplier owns OR ADMIN/BACKOFFICE | ✅ | |
| 3 | Auto-set SHIPPED + shippedAt pokud PENDING/CONFIRMED | ✅ | |
| 4 | trackingCarrier fallback na deliveryMethod | ✅ | |
| 5 | Order status aggregation | ❌ | **BUG-1** — viz níže |

### ❌ BUG-1: Špatná agregace Order statusu v tracking route

**Soubor:** `app/api/suborders/[id]/tracking/route.ts:71-78`

```typescript
const allSubOrders = await prisma.subOrder.findMany({
  where: { orderId: subOrder.orderId },
  select: { status: true },   // ← jen status, bez id
});
// Reflect the just-updated status
const updated = allSubOrders.map((so) =>
  so.status === subOrder.status && updateData.status
    ? { status: updateData.status as string }   // ← matchuje podle statusu, ne id
    : so,
);
```

**Problém:** Pokud více SubOrders má stejný status (např. dvě CONFIRMED), reflekce nahradí VŠECHNY z nich, ne jen aktuální.

**Scénář:**
- SubOrder A (id: current): CONFIRMED → tracking přiřazen → SHIPPED
- SubOrder B: CONFIRMED (jiný dodavatel)
- allSubOrders = [{status: "CONFIRMED"}, {status: "CONFIRMED"}]
- updated = [{status: "SHIPPED"}, {status: "SHIPPED"}] ← B nesprávně SHIPPED
- Order.status v DB = "SHIPPED" ← **ŠPATNĚ** (B je stále CONFIRMED)

**Status route** tento problém nemá — fetchuje data z DB **PO** aktualizaci, takže dostane čerstvý stav.

**Fix:** Místo reflection fetchovat data z DB po update (stejně jako status route):
```typescript
await prisma.subOrder.update({ where: { id }, data: updateData });
// Fetch fresh AFTER update
const allSubOrders = await prisma.subOrder.findMany({
  where: { orderId: subOrder.orderId },
  select: { status: true },
});
const orderStatus = aggregateOrderStatus(allSubOrders);
```

**Závažnost:** Střední — Order status v DB špatný při souběžných SubOrders se stejným statusem. Samoopravující se při další změně statusu.

**tracking route: 4/5 ❌**

---

## 4. POST /api/orders — refactor se SubOrders

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | Backward compat: root deliveryMethod → synthetic deliveries[] | ✅ | |
| 2 | Zod refine: deliveryMethod XOR deliveries required | ✅ | |
| 3 | Seskupení items per supplierId | ✅ | Map<supplierId, SupplierGroup> |
| 4 | Order.create bez nested items | ✅ | |
| 5 | SubOrder.create per supplier group | ✅ | |
| 6 | OrderItem.createMany s subOrderId | ✅ | |
| 7 | Double-check stock inside transaction | ✅ | race condition guard |
| 8 | Stock decrement inside transaction | ✅ | |
| 9 | Order.deliveryMethod = supplierGroups[0] (zpětná komp.) | ✅ | |
| 10 | Stripe metadata: orderId | ✅ | |
| 11 | Guest token zachován | ✅ | |

**POST /api/orders: 11/11 ✅**

---

## 5. ZPĚTNÁ KOMPATIBILITA

| # | Požadavek | Stav |
|---|-----------|------|
| 1 | Starý formát (root deliveryMethod) stále funguje | ✅ |
| 2 | Nový formát (deliveries[]) per dodavatel | ✅ |
| 3 | GET /api/orders?role=buyer → Orders s subOrders included | ✅ |
| 4 | GET /api/orders?role=supplier → SubOrders (ne celé Orders) | ✅ |

**Zpětná kompatibilita: 4/4 ✅**

---

## 6. DISPATCHER REFACTOR

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | `createShipmentForSubOrder(subOrderId)` nová funkce | ✅ | |
| 2 | Idempotence: pokud už trackingNumber → cached return | ✅ | |
| 3 | PICKUP skip | ✅ | |
| 4 | calculateShipmentWeight z SubOrder.items | ✅ | |
| 5 | COD amount = SubOrder.subtotal (ne celý order) | ✅ | správně |
| 6 | Uložení do SubOrder (ne Order) | ✅ | |
| 7 | `createShipmentForOrder(orderId)` → wrapper přes SubOrders | ✅ | |
| 8 | Filter: trackingNumber: null, NOT PICKUP | ✅ | |
| 9 | Zpětně kompatibilní export createShipmentForOrder | ✅ | |

**Dispatcher: 9/9 ✅**

---

## 7. STRIPE WEBHOOK — payout per SubOrder

### ❌ GAP-2: Webhook stále operuje na OrderItem úrovni, ne SubOrder

**Soubor:** `app/api/stripe/webhook/route.ts`

Webhook vypočítává commissionRate/carmaklerFee/supplierPayout **per OrderItem** a ukládá do `OrderItem` tabulky. SubOrder model má pole `commissionRate`, `carmaklerFee`, `supplierPayout` (nullable Decimal/Int), ale **žádný kód je nepopuluje**.

```typescript
// Webhook — stávající chování:
splits.map((...) =>
  prisma.orderItem.update({ where: { id: item.id }, data: { carmaklerFee, supplierPayout } })
)
// SubOrder.carmaklerFee a SubOrder.supplierPayout zůstávají null
```

**Požadavek spec:** "Stripe webhook payout per SubOrder" — znamená agregovat payout na úrovni SubOrder a provést jeden Stripe transfer na dodavatele (ne per-item).

**Dopad:** SubOrder finanční pole nikdy neobsahují data → nelze reportovat payout per SubOrder.  
**Závažnost:** Střední — funkčnost plateb zachována (per-item transfers fungují), ale SubOrder finanční model je neúplný.

---

## SIMPLIFY

### ⚠️ S1 — `aggregateOrderStatus()` duplicitní

Identická funkce v obou endpoint souborech:
- `app/api/suborders/[id]/status/route.ts:13-23`
- `app/api/suborders/[id]/tracking/route.ts:13-25`

**Fix:** Extrahovat do `lib/shipping/suborder-utils.ts` nebo `lib/orders/utils.ts`.  
**Effort:** ~5 min.

---

## CELKOVÉ HODNOCENÍ

| Oblast | Stav |
|--------|------|
| TypeScript / Build | ✅ PASS |
| Prisma schema | ✅ 14/14 |
| POST /api/orders refactor | ✅ 11/11 |
| PUT status route | ✅ 9/9 |
| PUT tracking route | ❌ BUG-1 (Order status aggregation chybná) |
| Zpětná kompatibilita | ✅ 4/4 |
| Dispatcher refactor | ✅ 9/9 |
| Stripe webhook SubOrder payout | ❌ GAP-2 (SubOrder finanční pole nepopulována) |
| aggregateOrderStatus duplicita | ⚠️ S1 |

**Task #43 Verdict: ❌ FAIL — 1 bug + 1 gap**

| Kód | Závažnost | Popis | Fix |
|-----|-----------|-------|-----|
| BUG-1 | Střední | tracking route: aggregace nahrazuje všechny SubOrders se stejným statusem | Fetch z DB po update (5 řádků) |
| GAP-2 | Střední | SubOrder finanční pole nikdy nepopulována z webhookem | Agregovat payout per SubOrder v webhookem |
| S1 | Nízká | `aggregateOrderStatus()` duplicitní | Extrahovat do shared utility |
