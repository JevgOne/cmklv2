# QA Report — Task #42 (commits d91bf8a + 6792e0e)

**Datum:** 2026-04-13  
**Agent:** TEST-CHROME  
**Commit 2:** `d91bf8a` — checkout + PWA + tracking (per-supplier delivery select)  
**Commit 3:** `6792e0e` — admin orders: expandable SubOrder rows

> Commit 1 (`f85bf99`) pokryt separátním reportem (Task #43). BUG-1 a S1 z #43 ověřeny jako opraveny v aktuálním kódu.

---

## PŘEDCHOZÍ BUGY — STATUS

| Kód | Z reportu #43 | Aktuální stav |
|-----|--------------|---------------|
| BUG-1 | tracking route: in-memory reflection | ✅ OPRAVENO — tracking/route.ts řádky 51-62 nyní fetchují z DB po update |
| S1 | aggregateOrderStatus duplicita | ✅ OPRAVENO — extrahováno do `lib/orders/utils.ts`, oba routes importují odsud |
| GAP-2 | webhook SubOrder finanční pole | ⚠️ neověřeno v těchto commitech — viz Task #47 |

---

## 1. COMMIT d91bf8a — Checkout: per-supplier delivery select

**Soubor:** `app/(web)/dily/objednavka/page.tsx`

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | groupBySupplier() seskupuje items per supplierId | ✅ | |
| 2 | isSingleSupplier = supplierGroups.length <= 1 | ✅ | edge case: 0 nebo 1 supplier |
| 3 | Backward compat: single-supplier → root deliveryMethod | ✅ | |
| 4 | Multi-supplier: per-supplier delivery radio cards | ✅ | |
| 5 | Zásilkovna widget per-supplier při ZASILKOVNA | ✅ | |
| 6 | validateStep1(): chyba pokud delivery nevybrána per supplier | ✅ | |
| 7 | validateStep1(): chyba pokud ZASILKOVNA bez pointu | ✅ | |
| 8 | totalShippingPrice = sum per-supplier | ✅ | |
| 9 | handleSubmit(): deliveries[] pro multi-supplier | ✅ | |
| 10 | Step 3 summary: per-supplier breakdown | ✅ | |
| 11 | Sidebar: per-supplier items + shipping | ✅ | |
| 12 | Error handling na selhání API | ❌ | **BUG-3** — viz níže |

### ❌ BUG-3: Checkout silently redirects to demo confirmation on API error

**Soubor:** `app/(web)/dily/objednavka/page.tsx:206-213`

```typescript
if (res.ok) {
  // ... success path
} else {
  clearCart();  // ← košík se smaže!
  router.push("/dily/objednavka/potvrzeni?id=demo-" + Date.now());
}
// catch block:
} catch {
  clearCart();
  router.push("/dily/objednavka/potvrzeni?id=demo-" + Date.now());
}
```

**Problém:** Pokud POST /api/orders vrátí chybu (stock vyčerpán, validace, server error), kód:
1. Smaže košík uživatele (`clearCart()`)
2. Přesměruje na "potvrzení" se `demo-{timestamp}` ID

Uživatel si myslí, že objednávka proběhla. Ve skutečnosti se nic nevytvořilo. Navíc ztratí obsah košíku.

**Fix:**
```typescript
} else {
  const errData = await res.json().catch(() => ({}));
  setErrors({ submit: errData.error ?? "Objednávku se nepodařilo odeslat." });
  setSubmitting(false);
}
```

**Závažnost:** Střední — uživatel ztrácí košík + dostane falešné potvrzení.

**Checkout: 11/12 ❌ (BUG-3)**

---

## 2. COMMIT 6792e0e — Admin orders: expandable SubOrder rows

**Soubory:** `app/(admin)/admin/orders/page.tsx` + `app/api/admin/orders/route.ts`

### API (/api/admin/orders — GET)

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | subOrders included v response | ✅ | |
| 2 | subOrders.supplier (companyName, firstName, lastName) | ✅ | |
| 3 | subOrders.id, status, deliveryMethod, subtotal, trackingNumber | ✅ | |
| 4 | Auth: ADMIN/BACKOFFICE/MANAGER only | ✅ | |
| 5 | Filtrace status + fulltext search | ✅ | |

### UI (admin/orders/page.tsx)

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | expanded: Set<string> state | ✅ | |
| 2 | Toggle ▶/▼ button per order | ✅ | |
| 3 | hasSubOrders = subOrders.length > 1 | ✅ | jednoznačná: >1 dodavatel |
| 4 | SubOrder detail řádky při isExpanded | ✅ | |
| 5 | SubOrder: supplier name, delivery method, tracking, subtotal badge | ✅ | |
| 6 | Cena objednávky v admin tabulce | ❌ | **BUG-4** — viz níže |

### ❌ BUG-4: order.totalAmount — špatný název pole

**Soubor:** `app/(admin)/admin/orders/page.tsx:29, 224`

```typescript
// Frontend interface:
interface OrderRow {
  ...
  totalAmount: number;  // ← admin page očekává totalAmount
}

// JSX:
{formatPrice(order.totalAmount)}  // ← undefined → "0 Kč" nebo NaN
```

**Prisma schema (Order model):**
```
totalPrice    Int   // ← skutečný název pole
```

**API vrací `totalPrice`** (přímý Prisma výstup, bez transformace). Frontend čte `totalAmount` → vždy `undefined`.

**Výsledek:** Celková cena u VŠECH objednávek v admin panelu zobrazuje "0 Kč".

**Fix:**
```typescript
// V interface OrderRow:
totalPrice: number;  // místo totalAmount

// V JSX (řádek 224):
{formatPrice(order.totalPrice)}
```

**Závažnost:** Střední — vizuální chyba, admin vidí 0 Kč u všech objednávek.

**Admin UI: 5/6 ❌ (BUG-4)**

---

## 3. POZNÁMKY

### ⚠️ PATCH /api/admin/orders — přímý update Order.status

Admin PATCH obchází SubOrder agregaci — nastaví `Order.status` přímo bez synchronizace SubOrders. Pravděpodobně záměrné (admin override), ale může způsobit nesoulad: `Order.status = DELIVERED` zatímco SubOrders jsou stále SHIPPED. Není blocker.

### ⚠️ CartItem.supplierId nullable

`CartItem.supplierId?: string` — pokud undefined, groupBySupplier() použije klíč `"unknown"`. Backend nenajde odpovídající delivery pro `supplierId: "unknown"`. V praxi by to nemělo nastat (všechny parts mají supplierId), ale chybí validace.

---

## CELKOVÉ HODNOCENÍ — Task #42 (všechny 3 commity)

| Commit | Oblast | Stav |
|--------|--------|------|
| f85bf99 | SubOrder Prisma schema + APIs | ❌ BUG-1 (OPRAVENO), GAP-2 (viz #47) |
| d91bf8a | Checkout per-supplier delivery | ❌ BUG-3 (silent error → demo confirmation) |
| 6792e0e | Admin expandable SubOrder rows | ❌ BUG-4 (totalAmount vs totalPrice) |

**Task #42 Celkový Verdict: ❌ FAIL — 2 nové bugy**

| Kód | Závažnost | Soubor | Fix |
|-----|-----------|--------|-----|
| BUG-3 | Střední | `app/(web)/dily/objednavka/page.tsx:206-213` | Zobrazit error místo demo redirect |
| BUG-4 | Střední | `app/(admin)/admin/orders/page.tsx:29,224` | `totalAmount` → `totalPrice` |
