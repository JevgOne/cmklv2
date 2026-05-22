# Deep Dive — G-02: SubOrder model + split objednávky per dodavatel

**Datum:** 2026-04-14
**Gap:** G-02 (P0 — kritický)
**Effort:** XL (3-5 dní)
**Autor:** Planovač

---

## 1. KONTEXT — proč SubOrder

Zákazník může mít v košíku díly od 3 různých dodavatelů — každý s jiným doručením a vlastním fulfillmentem. Aktuálně:
- `Order` má jedno `deliveryMethod`, jeden `trackingNumber`, jeden status
- `OrderItem.supplierId` existuje, ale slouží jen pro commission split
- Supplier PWA vidí celou Order i když dodává jen 1 položku

SubOrder = mezistupeň mezi Order a OrderItem. Skupinuje items per supplier s vlastním doručením.

---

## 2. PRISMA SCHEMA — přidat model SubOrder

### 2a. Nový model `SubOrder`

Přidat do `prisma/schema.prisma` ZA model `Order` (za řádek 1067):

```prisma
model SubOrder {
  id          String  @id @default(cuid())
  orderId     String
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  supplierId  String
  supplier    User    @relation("SupplierSubOrders", fields: [supplierId], references: [id])

  // Status (nezávislý na Order)
  status String @default("PENDING") // PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED

  // Doručení (per dodavatel)
  deliveryMethod      String  // ZASILKOVNA, DPD, PPL, GLS, CESKA_POSTA, PICKUP
  deliveryPrice       Int     @default(0)
  zasilkovnaPointId   String?
  zasilkovnaPointName String?

  // Tracking
  trackingNumber   String?
  trackingCarrier  String?
  trackingUrl      String?
  shippingLabelUrl String?
  shippedAt        DateTime?
  deliveredAt      DateTime?

  // Payout
  commissionRate   Decimal? @db.Decimal(4, 2) // snapshot sazby
  carmaklerFee     Int?
  supplierPayout   Int?

  // Ceny
  subtotal      Int   // suma items v tomto SubOrder
  shippingPrice Int   @default(0)

  // Relace
  items     OrderItem[]
  returns   ReturnRequest[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([orderId])
  @@index([supplierId])
  @@index([status])
}
```

### 2b. Změny na existujícím Order modelu

**PŘIDAT:**
```prisma
  subOrders SubOrder[]
```

**PŘESUNOUT na SubOrder** (ale ZACHOVAT na Order jako read-only aggregáty):
- `deliveryMethod` → ZACHOVAT jako "primární" doručení (nebo smazat — viz rozhodnutí)
- `trackingNumber`, `trackingCarrier`, `trackingUrl`, `shippingLabelUrl` → ZACHOVAT pro zpětnou kompatibilitu
- `shippedAt`, `deliveredAt` → ZACHOVAT

**POZOR — zpětná kompatibilita:** Existující Orders nemají SubOrders. Migration musí vytvořit SubOrders pro existující objednávky (1 SubOrder per Order, kopíruje delivery/tracking data).

### 2c. Změny na OrderItem

**PŘIDAT:**
```prisma
  subOrderId  String?
  subOrder    SubOrder? @relation(fields: [subOrderId], references: [id])
```

**PONECHAT `supplierId`** — stále potřeba pro dotazy kde item nemá SubOrder (starší data).

**PŘESUNOUT `commissionRateApplied`, `carmaklerFee`, `supplierPayout`** → duplikátní na SubOrder i OrderItem. SubOrder má agregát, OrderItem per-item detail. PONECHAT oboje.

### 2d. Změna na ReturnRequest

**PŘIDAT:**
```prisma
  subOrderId  String?
  subOrder    SubOrder? @relation(fields: [subOrderId], references: [id])
```

Zachovat `orderId` pro zpětnou kompatibilitu.

### 2e. Změna na User

Přidat relaci:
```prisma
  supplierSubOrders SubOrder[] @relation("SupplierSubOrders")
```

### 2f. Migrace

```bash
npx prisma migrate dev --name add-suborder-model
```

**POZOR:** Tsvector drift → pokud `migrate dev` selže, použít `db push` a vytvořit migraci ručně. STOP & ESCALATE ritual pokud selže.

**Data migrace (SQL):** Pro existující Orders vytvořit 1 SubOrder per unikátní supplierId:

```sql
-- Naplnit SubOrders z existujících Orders
INSERT INTO "SubOrder" (id, "orderId", "supplierId", status, "deliveryMethod", "deliveryPrice",
  "zasilkovnaPointId", "zasilkovnaPointName", "trackingNumber", "trackingCarrier",
  "trackingUrl", "shippingLabelUrl", "shippedAt", "deliveredAt", subtotal, "shippingPrice",
  "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  o.id,
  oi."supplierId",
  o.status,
  o."deliveryMethod",
  o."shippingPrice",
  o."zasilkovnaPointId",
  o."zasilkovnaPointName",
  o."trackingNumber",
  o."trackingCarrier",
  o."trackingUrl",
  o."shippingLabelUrl",
  o."shippedAt",
  o."deliveredAt",
  SUM(oi."totalPrice"),
  o."shippingPrice",
  o."createdAt",
  NOW()
FROM "Order" o
JOIN "OrderItem" oi ON oi."orderId" = o.id
GROUP BY o.id, oi."supplierId";

-- Propojit OrderItems s vytvořenými SubOrders
UPDATE "OrderItem" oi
SET "subOrderId" = so.id
FROM "SubOrder" so
WHERE so."orderId" = oi."orderId" AND so."supplierId" = oi."supplierId";
```

---

## 3. API ROUTES

### 3a. PUT /api/suborders/[id]/status (NOVÝ)

**Soubor:** `app/api/suborders/[id]/status/route.ts`

```
Auth: session (supplier items v SubOrder NEBO ADMIN/BACKOFFICE)
Body: { status: "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED" }
```

**Logika:**
1. Načíst SubOrder s items
2. Ověřit oprávnění (supplier = `subOrder.supplierId === session.user.id` || admin)
3. Validovat status přechod (PENDING→CONFIRMED→SHIPPED→DELIVERED, CANCELLED z libovolného)
4. Update SubOrder status
5. Pokud SHIPPED → nastavit `shippedAt`
6. Pokud DELIVERED → nastavit `deliveredAt`
7. Pokud CANCELLED → vrátit stock (increment Part.stock pro každý item)
8. **AGREGOVAT Order.status** = nejhorší stav SubOrders:
   - Pokud JAKÝKOLIV SubOrder = PENDING → Order.status = PENDING
   - Pokud JAKÝKOLIV SubOrder = CONFIRMED → Order.status = CONFIRMED
   - Pokud VŠECHNY = SHIPPED nebo lepší → Order.status = SHIPPED
   - Pokud VŠECHNY = DELIVERED → Order.status = DELIVERED
   - Pokud VŠECHNY = CANCELLED → Order.status = CANCELLED

**Priorita stavů** (od nejhoršího):
```
PENDING < CONFIRMED < SHIPPED < DELIVERED
CANCELLED = speciální (neblokuje ostatní)
```

**Agregační funkce:**
```typescript
function aggregateOrderStatus(subOrders: { status: string }[]): string {
  const active = subOrders.filter(s => s.status !== "CANCELLED");
  if (active.length === 0) return "CANCELLED";
  const priority = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];
  const worst = Math.min(...active.map(s => priority.indexOf(s.status)));
  return priority[worst] || "PENDING";
}
```

### 3b. PUT /api/suborders/[id]/tracking (NOVÝ)

**Soubor:** `app/api/suborders/[id]/tracking/route.ts`

```
Auth: supplier SubOrder NEBO ADMIN
Body: { trackingNumber: string, trackingCarrier?: string, trackingUrl?: string }
```

**Logika:**
1. Update SubOrder: trackingNumber, trackingCarrier, trackingUrl
2. Automaticky nastavit status = SHIPPED + shippedAt pokud ještě není SHIPPED
3. Agregovat Order.status (viz 3a)

### 3c. Refactor POST /api/orders (EXISTUJÍCÍ)

**Soubor:** `app/api/orders/route.ts` — KLÍČOVÝ REFACTOR

**Aktuální flow (řádky 60-136):**
1. Spočítá items + totalPrice
2. Jeden deliveryMethod + shippingPrice
3. Vytvoří 1 Order s items

**Nový flow:**
1. Seskupí items per supplierId
2. Pro KAŽDÉHO dodavatele → zákazník vybral deliveryMethod (nový input!)
3. Spočítá shippingPrice per SubOrder
4. Vytvoří Order → SubOrders → OrderItems v transakci

**Změna createOrderSchema** (`lib/validators/parts.ts`):

```typescript
export const createOrderSchema = z.object({
  items: z.array(z.object({
    partId: z.string().min(1),
    quantity: z.number().int().min(1),
  })).min(1),

  // Osobní údaje (zůstávají na Order)
  deliveryName: z.string().min(1),
  deliveryPhone: z.string().min(9),
  deliveryEmail: z.string().email(),
  deliveryAddress: z.string().min(1),
  deliveryCity: z.string().min(1),
  deliveryZip: z.string().min(3),

  // Platba (jedna za celou objednávku)
  paymentMethod: z.enum(["BANK_TRANSFER", "COD", "CARD"]),
  note: z.string().optional(),

  // Doručení PER DODAVATEL (nové!)
  deliveries: z.array(z.object({
    supplierId: z.string().min(1),
    deliveryMethod: z.enum(["ZASILKOVNA", "DPD", "PPL", "GLS", "CESKA_POSTA", "PICKUP"]),
    zasilkovnaPointId: z.string().optional(),
    zasilkovnaPointName: z.string().optional(),
  })).min(1),
});
```

**ZPĚTNÁ KOMPATIBILITA:** Pokud přijde starý formát (s `deliveryMethod` na root úrovni, bez `deliveries`), automaticky vytvořit 1 delivery pro všechny suppliers:

```typescript
// Fallback pro starý formát
if (!data.deliveries && data.deliveryMethod) {
  const uniqueSupplierIds = [...new Set(parts.map(p => p.supplierId))];
  data.deliveries = uniqueSupplierIds.map(sid => ({
    supplierId: sid,
    deliveryMethod: data.deliveryMethod,
    zasilkovnaPointId: data.zasilkovnaPointId,
    zasilkovnaPointName: data.zasilkovnaPointName,
  }));
}
```

**Nový create flow uvnitř $transaction:**

```typescript
const created = await tx.order.create({
  data: {
    orderNumber: generateOrderNumber(),
    buyerId,
    guestToken,
    status: "PENDING",
    deliveryName: data.deliveryName,
    // ... osobní údaje
    deliveryMethod: data.deliveries[0].deliveryMethod, // primary pro zpětnou komp.
    paymentMethod: data.paymentMethod,
    paymentStatus: "PENDING",
    totalPrice, // celkový vč. shipping
    shippingPrice: totalShippingPrice,
    note: data.note ?? null,
    subOrders: {
      create: supplierGroups.map(group => ({
        supplierId: group.supplierId,
        status: "PENDING",
        deliveryMethod: group.delivery.deliveryMethod,
        deliveryPrice: getShippingPrice(group.delivery.deliveryMethod),
        zasilkovnaPointId: group.delivery.zasilkovnaPointId ?? null,
        zasilkovnaPointName: group.delivery.zasilkovnaPointName ?? null,
        subtotal: group.subtotal,
        shippingPrice: getShippingPrice(group.delivery.deliveryMethod),
        items: {
          create: group.items.map(item => ({
            orderId: ???, // problém — nested create
            partId: item.partId,
            supplierId: group.supplierId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      })),
    },
  },
});
```

**POZOR:** Prisma nested creates s cirkulární referencí (OrderItem.orderId + OrderItem.subOrderId) — bude potřeba vytvořit Order → pak SubOrders → pak OrderItems v sekvenci uvnitř transakce místo jednoho nested create.

**Doporučený pattern:**
```typescript
const created = await tx.order.create({ data: { ...orderData } });

for (const group of supplierGroups) {
  const subOrder = await tx.subOrder.create({
    data: {
      orderId: created.id,
      supplierId: group.supplierId,
      ...group.deliveryData,
    },
  });

  await tx.orderItem.createMany({
    data: group.items.map(item => ({
      orderId: created.id,
      subOrderId: subOrder.id,
      supplierId: group.supplierId,
      ...item,
    })),
  });
}
```

### 3d. Refactor GET /api/orders (EXISTUJÍCÍ)

**Dodavatel** by měl vidět jen SubOrders kde je supplier, ne celé Orders:

```typescript
if (role === "supplier") {
  // Nový: vrátit SubOrders ne Orders
  const subOrders = await prisma.subOrder.findMany({
    where: { supplierId: session.user.id },
    include: {
      order: { select: { orderNumber: true, deliveryName: true, deliveryEmail: true, deliveryPhone: true, deliveryAddress: true, deliveryCity: true, deliveryZip: true, paymentMethod: true, paymentStatus: true } },
      items: { include: { part: { select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } } } },
    },
    orderBy: { createdAt: "desc" },
    skip, take: limit,
  });
}
```

### 3e. Refactor createShipmentForOrder (EXISTUJÍCÍ)

**Soubor:** `lib/shipping/dispatcher.ts`

Přejmenovat na `createShipmentForSubOrder(subOrderId: string)`:
- Načte SubOrder (ne Order)
- Tracking data ukládá na SubOrder (ne Order)
- Weight počítá z SubOrder.items

Zachovat staré `createShipmentForOrder` jako wrapper:
```typescript
export async function createShipmentForOrder(orderId: string) {
  const subOrders = await prisma.subOrder.findMany({
    where: { orderId, trackingNumber: null, deliveryMethod: { not: "PICKUP" } },
  });
  const results = [];
  for (const so of subOrders) {
    const result = await createShipmentForSubOrder(so.id);
    if (result) results.push(result);
  }
  return results;
}
```

### 3f. Refactor applyCommissionSplit (EXISTUJÍCÍ)

**Soubor:** `app/api/stripe/webhook/route.ts`

Aktualizovat pro SubOrder-level payout:
- Seskupit items per SubOrder
- Commission snapshot na SubOrder (agregát) + OrderItem (per-item)
- Transfer per SubOrder (ne per OrderItem)

---

## 4. CHECKOUT UI REFACTOR

### 4a. Checkout stránka (`app/(web)/dily/objednavka/page.tsx`)

**Aktuální:** 1 delivery select pro celou objednávku

**Nový Step 1 — Doručení per dodavatel:**

1. Seskupí items v košíku per supplierId
2. Pro KAŽDÉHO dodavatele zobrazí:
   - Název dodavatele / "Carmakler Shop"
   - Seznam jeho položek
   - Delivery method select (ZASILKOVNA/DPD/PPL/GLS/ČP/PICKUP)
   - Zásilkovna widget pokud ZASILKOVNA vybrána
   - Cena dopravy
3. Celková cena = sum subtotals + sum shipping per supplier + COD fee

**Potřebné info z API:** Checkout musí znát supplierId pro každý part. Buď:
- a) Rozšířit CartItem o `supplierId` (uložit do localStorage při addToCart)
- b) Fetch suppliers při checkout startu

**Doporučení:** (a) — přidat `supplierId` a `supplierName` do CartItem v `lib/cart.ts`:

```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  supplierId: string;   // NOVÉ
  supplierName: string;  // NOVÉ
}
```

### 4b. AddToCartButton

Musí předat `supplierId` a `supplierName` do cart. Part detail page má tato data.

### 4c. Sidebar summary

Zobrazit breakdown per dodavatel:
```
-- Vrakoviště Brno (PICKUP) --
  Přední nárazník x1     3 200 Kč
  Doprava: Zdarma

-- Carmakler Shop (Zásilkovna) --
  Brzdový kotouč x1      1 890 Kč
  Doprava: 79 Kč

---
Mezisoučet:    5 090 Kč
Doprava celkem:   79 Kč
Celkem:        5 169 Kč
```

---

## 5. SUPPLIER PWA REFACTOR

### 5a. Orders list (`app/(pwa-parts)/parts/orders/page.tsx`)

Změnit na SubOrders list — supplier vidí jen své SubOrders.

### 5b. Order detail (`app/(pwa-parts)/parts/orders/[id]/page.tsx`)

Změnit na SubOrder detail — supplier mění status jen svého SubOrder.

### 5c. ShippingLabelCard

Tracking info z SubOrder místo Order.

---

## 6. GUEST TRACKING REFACTOR

**Soubor:** `app/(web)/shop/objednavky/sledovani/[token]/page.tsx`

Zobrazit SubOrders jako karty:
```
Objednávka #OBJ-260414-X7K9D

[ SubOrder 1: Vrakoviště Brno ]
  Status: ✅ Doručeno
  Doprava: Osobní odběr
  Položky: Přední nárazník x1

[ SubOrder 2: Carmakler Shop ]
  Status: 🚚 Odesláno
  Tracking: CZ123456789
  Doprava: Zásilkovna — Brno, Joštova 4
  Položky: Brzdový kotouč x1
```

---

## 7. ADMIN REFACTOR

### 7a. Admin orders page

Zobrazit SubOrders nested pod Orders. Možnost filtrovat per supplier.

### 7b. Admin returns

ReturnRequest.subOrderId — odkaz na SubOrder místo celé Order.

---

## 8. POŘADÍ IMPLEMENTACE

1. **Prisma schema** — přidat SubOrder model + relace + migrace + data migrace
2. **API POST /api/orders refactor** — vytvářet SubOrders v transakci + zpětná kompatibilita
3. **API SubOrder status + tracking** — nové endpointy
4. **Dispatcher refactor** — createShipmentForSubOrder
5. **Checkout UI** — delivery per supplier + CartItem rozšíření
6. **Supplier PWA** — SubOrder-based views
7. **Guest tracking** — SubOrder karty
8. **Admin** — nested SubOrders view
9. **Commission split** — SubOrder-level agregace

---

## 9. RIZIKA A OPATŘENÍ

| Riziko | Opatření |
|--------|----------|
| Tsvector drift při migrate | `db push` + manuální migrace |
| Zpětná kompatibilita starých Orders | Data migrace SQL vytvoří 1 SubOrder per Order |
| Prisma nested create s cirkulární ref | Sekvenční create v transakci |
| Checkout UX komplexita (per-supplier delivery) | Pokud jen 1 supplier → flat UI jako dnes |
| Stripe Checkout line_items | Shipping per SubOrder jako separate line items |
| CartItem localStorage schema change | Migrace: starý CartItem bez supplierId → fetch při checkout |

---

## 10. STOP & ESCALATE THRESHOLDS

- **STOP-1:** Prisma migrate selže a `db push` taky → eskalovat
- **STOP-2:** Circular reference v Prisma schema (SubOrder↔OrderItem↔Order) → zkusit sekvenční create, pokud i to selže → eskalovat
- **STOP-3:** Stripe Checkout neumí multiple shipping rates → zvážit 1 agregovaný shipping line item
- **STOP-4:** Jakýkoliv commit > 500 řádků změn → rozdělit na 2-3 commity (schema → API → UI)
