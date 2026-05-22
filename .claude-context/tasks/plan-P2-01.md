# Plan P2-01: SubOrder (Split objednavek per dodavatel)

**Priorita:** P2 (TOP 3 z 25 — Business Value 4/5, UX 4/5, Security 1/5 = 9/15)
**Slozitost:** L (5-7 hodin)
**Zavislosti:** P0-08 (PostgreSQL), P0-09 (ReturnRequest — existuje)
**Batch:** 4+

---

## Zduvodneni vyberu

**E-shop s vice dodavateli MUSI mit split objednavek.** Aktualni stav:
- Zakaznik objedna 3 dily od 3 ruznych dodavatelu → 1 objednavka
- Dodavatele vidi vsechny polozky objednavky (vcetne cizich)
- Kazdy dodavatel muze odeslat svou cast nezavisle, ale **tracking je jen na Order urovni**
- Reklamace/vraceni nemaji vazbu na konkretniho dodavatele

**SubOrder = objednavka per dodavatel** umozni:
- Nezavisly fulfillment (ruzne dopravci, ruzne terminy)
- Oddelen tracking per dodavatel
- Oddelen stav (jeden dodavatel odeslal, druhy ceka)
- Spravne rozuctovani trzeb per dodavatel

---

## Analyza aktualniho stavu

### Schema

```prisma
model Order {
  // ... buyerId, status, delivery*, payment*, total, tracking ...
  items   OrderItem[]
  returns ReturnRequest[]
}

model OrderItem {
  // ... orderId, partId, supplierId, quantity, unitPrice, totalPrice, status ...
}
```

**Klicovy nalez:** `OrderItem` JIZ MA `supplierId` a `status` per polozku. Castecny split je pripraveny na datove urovni, ale chybi:
- SubOrder entita (seskupeni polozek per dodavatel)
- Oddelen tracking per SubOrder
- Oddelen payment split per SubOrder
- UI pro dodavatele: "moje objednavky" filtrovaně

### PWA dodavatele

**Soubor:** `app/(pwa-parts)/parts/orders/page.tsx` — dodavatel vidi objednavky kde je jeho supplierId v OrderItem.

**Soubor:** `app/(pwa-parts)/parts/orders/[id]/page.tsx` — detail objednavky — ukazuje VSECHNY polozky orderu, ne jen ty od daneho dodavatele.

### Objednavkovy flow

**Soubor:** `app/api/orders/route.ts` POST — vytvari 1 Order se vsemi items. Nerozděluje per dodavatel.

---

## Kroky implementace

### Krok 1: Novy model SubOrder

**Soubor:** `prisma/schema.prisma`

Pridat za OrderItem model:

```prisma
model SubOrder {
  id         String @id @default(cuid())
  orderId    String
  order      Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  supplierId String
  supplier   User   @relation("SupplierSubOrders", fields: [supplierId], references: [id])

  // SubOrder status (nezavisly na hlavni objednavce)
  status String @default("PENDING") // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED

  // Ceny pro tohoto dodavatele
  subtotal      Int // Suma polozek (bez dopravy)
  shippingPrice Int @default(0)
  totalPrice    Int // subtotal + shipping

  // Tracking
  trackingNumber String?
  carrier        String?  // PPL, Zasilkovna, CeskaP, PERSONAL
  shippedAt      DateTime?
  deliveredAt    DateTime?

  // Poznamka dodavatele
  supplierNote String?

  // Relace
  items   OrderItem[]

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([orderId])
  @@index([supplierId])
  @@index([status])
}
```

### Krok 2: Upravit existujici modely

**Soubor:** `prisma/schema.prisma`

**Order model — pridat relaci:**
```diff
  // Relace
  items   OrderItem[]
+ subOrders SubOrder[]
  returns ReturnRequest[]
```

**OrderItem model — pridat subOrderId:**
```diff
  orderId    String
  order      Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)
+ subOrderId String?
+ subOrder   SubOrder? @relation(fields: [subOrderId], references: [id])
  partId     String
  // ...

+ @@index([subOrderId])
```

**User model — pridat relaci:**
```diff
  // V relacich User modelu pridat:
+ supplierSubOrders SubOrder[] @relation("SupplierSubOrders")
```

**Migrace:**
```bash
npx prisma migrate dev --name add_sub_orders
```

### Krok 3: Upravit POST /api/orders — automaticky split

**Soubor:** `app/api/orders/route.ts`

Po vytvoreni Order a OrderItems pridat split logiku:

```ts
// Seskupit items per supplierId
const itemsBySupplierId = new Map<string, typeof createdItems>();
for (const item of createdItems) {
  const group = itemsBySupplierId.get(item.supplierId) || [];
  group.push(item);
  itemsBySupplierId.set(item.supplierId, group);
}

// Vytvorit SubOrder pro kazdeho dodavatele
const subOrders = [];
for (const [supplierId, items] of itemsBySupplierId) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  // Doprava se distribuuje proporcionalne (nebo rovnomerne)
  const shippingShare = Math.round(shippingPrice / itemsBySupplierId.size);

  const subOrder = await prisma.subOrder.create({
    data: {
      orderId: order.id,
      supplierId,
      subtotal,
      shippingPrice: shippingShare,
      totalPrice: subtotal + shippingShare,
    },
  });

  // Propojit OrderItems na SubOrder
  await prisma.orderItem.updateMany({
    where: {
      orderId: order.id,
      supplierId,
    },
    data: { subOrderId: subOrder.id },
  });

  subOrders.push(subOrder);
}
```

### Krok 4: API pro dodavatele — SubOrder management

**Soubor:** `app/api/supplier/suborders/route.ts` (NOVY)

```ts
// GET — seznam SubOrders pro aktualniho dodavatele
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const subOrders = await prisma.subOrder.findMany({
    where: { supplierId: session.user.id },
    include: {
      order: {
        select: {
          orderNumber: true,
          deliveryName: true,
          deliveryAddress: true,
          deliveryCity: true,
          deliveryZip: true,
          deliveryPhone: true,
          deliveryEmail: true,
          paymentMethod: true,
          paymentStatus: true,
        },
      },
      items: {
        include: {
          part: { select: { name: true, slug: true, images: { take: 1 } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(subOrders);
}
```

**Soubor:** `app/api/supplier/suborders/[id]/route.ts` (NOVY)

```ts
// PUT — aktualizovat stav SubOrder (potvrdit, odeslat, tracking)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const subOrder = await prisma.subOrder.findUnique({
    where: { id },
    select: { supplierId: true, orderId: true },
  });

  if (!subOrder || subOrder.supplierId !== session?.user?.id) {
    return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
  }

  const body = await request.json();
  const { status, trackingNumber, carrier, supplierNote } = body;

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  if (carrier) updateData.carrier = carrier;
  if (supplierNote) updateData.supplierNote = supplierNote;
  if (status === "SHIPPED") updateData.shippedAt = new Date();
  if (status === "DELIVERED") updateData.deliveredAt = new Date();

  const updated = await prisma.subOrder.update({
    where: { id },
    data: updateData,
  });

  // Aktualizovat OrderItem statusy
  if (status) {
    await prisma.orderItem.updateMany({
      where: { subOrderId: id },
      data: { status: status === "SHIPPED" ? "SHIPPED" : status === "CONFIRMED" ? "CONFIRMED" : undefined },
    });
  }

  // Zkontrolovat zda vsechny SubOrders jsou DELIVERED → Order = DELIVERED
  await syncOrderStatus(subOrder.orderId);

  return NextResponse.json(updated);
}

async function syncOrderStatus(orderId: string) {
  const subOrders = await prisma.subOrder.findMany({
    where: { orderId },
    select: { status: true },
  });

  const allDelivered = subOrders.every(s => s.status === "DELIVERED");
  const allShipped = subOrders.every(s => ["SHIPPED", "DELIVERED"].includes(s.status));
  const anyConfirmed = subOrders.some(s => s.status !== "PENDING");

  let orderStatus = "PENDING";
  if (allDelivered) orderStatus = "DELIVERED";
  else if (allShipped) orderStatus = "SHIPPED";
  else if (anyConfirmed) orderStatus = "CONFIRMED";

  await prisma.order.update({
    where: { id: orderId },
    data: { status: orderStatus },
  });
}
```

### Krok 5: Zakaznicke UI — SubOrder zobrazeni

**Soubor:** `app/(web)/shop/moje-objednavky/page.tsx`

Pridat zobrazeni SubOrders v detailu objednavky:

```tsx
{order.subOrders.map((sub) => (
  <div key={sub.id} className="border border-gray-200 rounded-xl p-4 mb-3">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-semibold text-gray-700">
        Dodavatel: {sub.supplier.companyName || `${sub.supplier.firstName} ${sub.supplier.lastName}`}
      </span>
      <Badge variant={getStatusVariant(sub.status)}>
        {getStatusLabel(sub.status)}
      </Badge>
    </div>
    {sub.trackingNumber && (
      <p className="text-sm text-gray-500">
        Tracking: <span className="font-mono">{sub.trackingNumber}</span>
        {sub.carrier && ` (${sub.carrier})`}
      </p>
    )}
    {sub.items.map((item) => (
      <div key={item.id} className="flex items-center gap-3 py-2">
        {/* ... item detail ... */}
      </div>
    ))}
  </div>
))}
```

### Krok 6: Dodavatelska PWA — SubOrders

**Soubor:** `app/(pwa-parts)/parts/orders/page.tsx`

Zmenit z `OrderItem` filtrovani na `SubOrder` listing:

```diff
- // Aktualne: filtruje OrderItems kde supplierId = session.user.id
- const orders = await prisma.order.findMany({
-   where: { items: { some: { supplierId: session.user.id } } },
- });
+ // Nove: primo SubOrders pro dodavatele
+ const subOrders = await prisma.subOrder.findMany({
+   where: { supplierId: session.user.id },
+   include: {
+     order: { select: { orderNumber: true, deliveryName: true, createdAt: true } },
+     items: { include: { part: { select: { name: true, images: { take: 1 } } } } },
+   },
+   orderBy: { createdAt: "desc" },
+ });
```

**Soubor:** `app/(pwa-parts)/parts/orders/[id]/page.tsx`

Zmenit na zobrazeni SubOrder detailu s akcemi (potvrdit, tracking, odeslat).

### Krok 7: Email notifikace per SubOrder

Po zmene statusu SubOrder odeslat email zakaznikovi:

```ts
// V PUT handleru SubOrder:
if (status === "SHIPPED" && trackingNumber) {
  await sendEmail({
    to: order.deliveryEmail,
    subject: `Vaše zásilka byla odeslána — ${order.orderNumber}`,
    html: `
      <p>Dodavatel ${supplier.companyName} odeslal vaši zásilku.</p>
      <p>Tracking číslo: <strong>${trackingNumber}</strong></p>
      ${carrier ? `<p>Dopravce: ${carrier}</p>` : ""}
    `,
  });
}
```

---

## Migrace existujicich dat

Po nasazeni migrace: existujici Orders nemaji SubOrders. Migracni script:

```ts
// prisma/migrations/backfill-suborders.ts
const orders = await prisma.order.findMany({
  include: { items: true },
});

for (const order of orders) {
  const bySupplier = new Map();
  for (const item of order.items) {
    const group = bySupplier.get(item.supplierId) || [];
    group.push(item);
    bySupplier.set(item.supplierId, group);
  }

  for (const [supplierId, items] of bySupplier) {
    const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
    const subOrder = await prisma.subOrder.create({
      data: {
        orderId: order.id,
        supplierId,
        status: order.status,
        subtotal,
        shippingPrice: 0,
        totalPrice: subtotal,
        trackingNumber: order.trackingNumber,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
      },
    });
    await prisma.orderItem.updateMany({
      where: { orderId: order.id, supplierId },
      data: { subOrderId: subOrder.id },
    });
  }
}
```

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena | Narocnost |
|--------|-------|-----------|
| `prisma/schema.prisma` | Novy model SubOrder + relace | S |
| `app/api/orders/route.ts` | Split logika v POST | M |
| `app/api/supplier/suborders/route.ts` | NOVY — GET seznam | S |
| `app/api/supplier/suborders/[id]/route.ts` | NOVY — PUT stav/tracking | M |
| `app/(web)/shop/moje-objednavky/page.tsx` | SubOrder zobrazeni | M |
| `app/(pwa-parts)/parts/orders/page.tsx` | Prepis na SubOrders | M |
| `app/(pwa-parts)/parts/orders/[id]/page.tsx` | SubOrder detail + akce | M |
| Migracni script | Backfill existujicich Orders | S |

---

## Overeni

- [ ] Objednavka se 3 dily od 2 dodavatelu → 2 SubOrders vytvoreny
- [ ] Dodavatel vidi jen SVE SubOrders (ne cele objednavky)
- [ ] Dodavatel muze potvrdit, pridat tracking, oznacit jako odeslane
- [ ] Zakaznik vidi stav per dodavatel (jeden odeslal, druhy ceka)
- [ ] Kdyz vsichni dodavatele odeslali → Order status = SHIPPED
- [ ] Kdyz vsichni dorucili → Order status = DELIVERED
- [ ] Email zakaznikovi pri kazdem odeslani
- [ ] Existujici objednavky migrovany (backfill script)
- [ ] Build prochazi
