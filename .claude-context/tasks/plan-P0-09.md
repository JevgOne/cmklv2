# Plan P0-09: Vraceni a reklamace — Return model + zakladni flow

**Priorita:** P0 (zakonna povinnost pro e-shop)
**Slozitost:** L
**Zavislosti:** P0-08 (PostgreSQL migrace — HOTOVO v Batch 2)
**Batch:** 3

---

## Cil

Implementovat zakonny system vraceni a reklamaci pro e-shop s dily. Cesky zakon vyzaduje:
- **14 dni odstoupeni od smlouvy** (§1829 obcanskeho zakoniku 89/2012 Sb.) — pro online nakupy
- **24 mesicu zaruka** pro nove dily, **12 mesicu** pro pouzite (§2165 OZ)
- **30 dni na vyrizeni reklamace** (§19/3 zakona 634/1992 Sb. o ochrane spotrebitele)

Bez tohoto nelze legalne provozovat e-shop.

---

## Analyza aktualniho stavu

### Order model (prisma/schema.prisma, radky 954-996)

```prisma
model Order {
  id          String  @id @default(cuid())
  orderNumber String  @unique
  buyerId     String?
  buyer       User?   @relation(fields: [buyerId], references: [id])
  status      String  @default("PENDING") // PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
  deliveryName    String
  deliveryPhone   String
  deliveryEmail   String
  deliveryAddress String
  deliveryCity    String
  deliveryZip     String
  paymentMethod String @default("BANK_TRANSFER")
  paymentStatus String @default("PENDING")
  totalPrice    Int
  shippingPrice Int @default(0)
  note String?
  trackingNumber String?
  shippedAt      DateTime?
  deliveredAt    DateTime?
  items OrderItem[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Problem:** ZADNY Return/Reklamace model neexistuje. Order nema relaci na returns.

### OrderItem model (radky 998-1018)

Kazdy OrderItem ma `partId`, `supplierId`, `quantity`, `unitPrice`, `totalPrice`.

### Existujici API routes

- `app/api/orders/route.ts` — POST (vytvoreni) + GET (seznam)
- `app/api/orders/[id]/route.ts` — GET (detail)
- `app/api/orders/[id]/status/route.ts` — PUT (zmena stavu)

**NEEXISTUJE:** Zadny `/api/orders/[id]/returns` endpoint.

### Existujici stranky

- `app/(web)/shop/moje-objednavky/page.tsx` — seznam objednavek (bez moznosti vratit/reklamovat)
- `app/(web)/dily/moje-objednavky/page.tsx` — duplicitni seznam v dily sekci
- `app/(web)/reklamacni-rad/page.tsx` — EXISTUJE (P0-03, Batch 1). Pravni texty. Nove stranky na ni odkazuji.

---

## Kroky implementace

### Krok 1: Pridat Return model do schema.prisma

**Soubor:** `prisma/schema.prisma`

Pridat za model `OrderItem` (po radku 1018):

```prisma
// ============================================
// VRACENI A REKLAMACE
// ============================================

model Return {
  id        String @id @default(cuid())
  orderId   String
  order     Order  @relation(fields: [orderId], references: [id])

  // Typ
  type String // WITHDRAWAL (14-den odstoupeni), WARRANTY (zarucni reklamace)

  // Polozky k vraceni
  items String // JSON array: [{orderItemId, quantity, reason}]

  // Duvod
  reason      String   // Textovy popis duvodu
  defectDesc  String?  // Popis zavady (jen pro WARRANTY)
  photos      String?  // JSON array URL fotek zavady

  // Kontakt
  contactName  String
  contactEmail String
  contactPhone String?

  // Bankovni ucet pro vraceni penez
  bankAccount String?

  // Finance
  requestedAmount Int   // Castka k vraceni
  approvedAmount  Int?  // Schvalena castka
  refundedAt      DateTime?

  // Stav
  status String @default("NEW")
  // NEW, RECEIVED, IN_REVIEW, APPROVED, REFUNDED, PARTIALLY_REFUNDED, REJECTED, CANCELLED

  rejectionReason String?

  // 30-den lhuta na vyrizeni (§19/3 ZOS)
  deadlineAt DateTime?

  // Interni poznamky
  adminNotes String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([orderId])
  @@index([status])
  @@index([type])
  @@index([createdAt])
}
```

### Krok 2: Pridat relaci do Order modelu

**Soubor:** `prisma/schema.prisma` — Order model (radek 988)

```diff
   // Relace
   items OrderItem[]
+  returns Return[]
```

### Krok 3: Vytvorit migraci

```bash
npx prisma migrate dev --name add_return_model
```

### Krok 4: Vytvorit Zod validator

**Soubor:** `lib/validators/return.ts` (NOVY)

```ts
import { z } from "zod";

export const createReturnSchema = z.object({
  type: z.enum(["WITHDRAWAL", "WARRANTY"]),
  items: z.array(z.object({
    orderItemId: z.string().min(1),
    quantity: z.number().int().min(1),
    reason: z.string().optional(),
  })).min(1, "Vyberte alespon jednu polozku"),
  reason: z.string().min(10, "Popiste duvod (min. 10 znaku)"),
  defectDesc: z.string().optional(),
  contactName: z.string().min(1, "Jmeno je povinne"),
  contactEmail: z.string().email("Neplatny email"),
  contactPhone: z.string().optional(),
  bankAccount: z.string().optional(),
});

export type CreateReturnInput = z.infer<typeof createReturnSchema>;
```

### Krok 5: Vytvorit API route pro zakazniky

**Soubor:** `app/api/orders/[id]/returns/route.ts` (NOVY)

**POST** — Vytvoreni zadosti o vraceni/reklamaci:
- Nacte objednavku, overi pristup (vlastnik nebo admin)
- Overi stav DELIVERED
- Pro WITHDRAWAL: overi 14-denni lhutu od `deliveredAt`
- Overi ze polozky patri k objednavce
- Spocita `requestedAmount` z cen polozek
- Nastavi `deadlineAt` = now + 30 dni
- Vytvori Return record

**GET** — Seznam vraceni/reklamaci pro objednavku:
- Overi pristup (vlastnik nebo ADMIN/BACKOFFICE)
- Vrati vsechny returns pro danou objednavku

Kompletni kod:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReturnSchema } from "@/lib/validators/return";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: orderId } = await params;

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Objednavka nenalezena" }, { status: 404 });
    }

    // Pristup: prihlaseny vlastnik, admin, nebo guest (overeni emailem v budoucnu)
    if (order.buyerId && session?.user?.id !== order.buyerId) {
      if (!session?.user?.role || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
        return NextResponse.json({ error: "Pristup odepren" }, { status: 403 });
      }
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Vraceni/reklamaci lze podat pouze u dorucene objednavky" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = createReturnSchema.parse(body);

    // 14-den lhuta pro WITHDRAWAL
    if (data.type === "WITHDRAWAL" && order.deliveredAt) {
      const daysSince = Math.floor(
        (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince > 14) {
        return NextResponse.json(
          { error: "Lhuta 14 dni pro odstoupeni od smlouvy jiz uplynula" },
          { status: 400 }
        );
      }
    }

    // Overit polozky
    const orderItemIds = new Set(order.items.map((i) => i.id));
    for (const item of data.items) {
      if (!orderItemIds.has(item.orderItemId)) {
        return NextResponse.json(
          { error: `Polozka ${item.orderItemId} nepatri k teto objednavce` },
          { status: 400 }
        );
      }
    }

    // Spocitat castku
    let requestedAmount = 0;
    for (const item of data.items) {
      const orderItem = order.items.find((i) => i.id === item.orderItemId)!;
      requestedAmount += orderItem.unitPrice * item.quantity;
    }

    const deadlineAt = new Date();
    deadlineAt.setDate(deadlineAt.getDate() + 30);

    const returnRecord = await prisma.return.create({
      data: {
        orderId: order.id,
        type: data.type,
        items: JSON.stringify(data.items),
        reason: data.reason,
        defectDesc: data.defectDesc ?? null,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone ?? null,
        bankAccount: data.bankAccount ?? null,
        requestedAmount,
        status: "NEW",
        deadlineAt,
      },
    });

    return NextResponse.json({ return: returnRecord }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders/[id]/returns error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: orderId } = await params;

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
    });

    if (!order) {
      return NextResponse.json({ error: "Objednavka nenalezena" }, { status: 404 });
    }

    if (order.buyerId && session?.user?.id !== order.buyerId) {
      if (!session?.user?.role || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
        return NextResponse.json({ error: "Pristup odepren" }, { status: 403 });
      }
    }

    const returns = await prisma.return.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ returns });
  } catch (error) {
    console.error("GET /api/orders/[id]/returns error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
```

### Krok 6: Vytvorit admin API

**Soubor:** `app/api/admin/returns/[id]/route.ts` (NOVY)

PUT endpoint pro zmenu stavu reklamace (ADMIN/BACKOFFICE only). Podpora zmeny `status`, `rejectionReason`, `approvedAmount`, `adminNotes`. Pri stavu REFUNDED/PARTIALLY_REFUNDED automaticky nastavi `refundedAt`.

### Krok 7: Vytvorit zakaznicke stranky

**Soubor A:** `app/(web)/shop/moje-objednavky/[id]/vraceni/page.tsx` (NOVY)

Formular "use client" pro 14-denni odstoupeni:
- Fetch objednavky z `/api/orders/[id]`
- Vyber polozek (checkbox list z `order.items`)
- Duvod vraceni (textarea)
- Kontaktni udaje (predvyplnene z objednavky: `deliveryName`, `deliveryEmail`)
- IBAN pro vraceni penez
- Submit na `POST /api/orders/[id]/returns` s `type: "WITHDRAWAL"`
- Klientska validace 14-denni lhuty
- Odkaz na `/reklamacni-rad`
- Design: Card pro polozky, Button primary pro odeslani

**Soubor B:** `app/(web)/shop/moje-objednavky/[id]/reklamace/page.tsx` (NOVY)

Formular "use client" pro zarucni reklamaci:
- Stejny zaklad jako vraceni
- Navic: popis zavady (povinny), upload fotek zavady (pres `/api/upload` preset `damages`)
- Preferovany zpusob vyrizeni: radio (oprava / vymena / vraceni penez)
- Submit s `type: "WARRANTY"`
- Info o 30-denni lhute na vyrizeni

### Krok 8: Pridat tlacitka do existujicich stranek

**Soubor:** `app/(web)/shop/moje-objednavky/page.tsx`

U kazde objednavky se stavem DELIVERED pridat Link tlacitka "Chci vratit" a "Reklamovat":
```tsx
{order.status === "DELIVERED" && (
  <div className="flex gap-2 mt-3">
    <Link href={`/shop/moje-objednavky/${order.id}/vraceni`}>
      <Button variant="outline" size="sm">Chci vratit</Button>
    </Link>
    <Link href={`/shop/moje-objednavky/${order.id}/reklamace`}>
      <Button variant="outline" size="sm">Reklamovat</Button>
    </Link>
  </div>
)}
```

**Soubor:** `app/(web)/dily/moje-objednavky/page.tsx` — shodna zmena.

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `prisma/schema.prisma` | Pridat model Return + relaci `returns Return[]` do Order |
| `lib/validators/return.ts` | NOVY — Zod schema |
| `app/api/orders/[id]/returns/route.ts` | NOVY — POST + GET |
| `app/api/admin/returns/[id]/route.ts` | NOVY — PUT (admin) |
| `app/(web)/shop/moje-objednavky/[id]/vraceni/page.tsx` | NOVY — formular vraceni |
| `app/(web)/shop/moje-objednavky/[id]/reklamace/page.tsx` | NOVY — formular reklamace |
| `app/(web)/shop/moje-objednavky/page.tsx` | Pridat tlacitka u DELIVERED objednavek |
| `app/(web)/dily/moje-objednavky/page.tsx` | Pridat tlacitka u DELIVERED objednavek |

## Overeni

- [ ] Model `Return` existuje v schema, migrace projde
- [ ] POST vytvoreni WITHDRAWAL funguje, 14-den lhuta se enforcuje
- [ ] POST vytvoreni WARRANTY funguje
- [ ] Objednavka musi byt DELIVERED
- [ ] Deadline 30 dni se nastavi automaticky
- [ ] Admin PUT meni stav, pri REFUNDED nastavi refundedAt
- [ ] Stranky vraceni a reklamace se renderuji
- [ ] Tlacitka na moje-objednavky se zobrazi jen u DELIVERED
- [ ] Odkaz na /reklamacni-rad pritomen
- [ ] Build prochazi
