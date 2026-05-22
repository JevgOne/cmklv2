# Plan P0-10: Guest checkout — objednavka bez registrace

**Priorita:** P0 (zakaznik musi moci objednat bez uctu)
**Slozitost:** M
**Zavislosti:** P0-08 (PostgreSQL migrace — HOTOVO v Batch 2)
**Batch:** 3

---

## Cil

Umoznit zakaznikum objednat dily bez registrace/prihlaseni. Po objednavce nabidnout dobrovolnou registraci. Poskytnout sledovani objednavky pres unikatni token.

---

## Analyza aktualniho stavu

### Order model — `buyerId` uz je optional

```prisma
model Order {
  buyerId     String?
  buyer       User?   @relation(fields: [buyerId], references: [id])
  deliveryEmail   String  // uz existuje!
  deliveryName    String  // uz existuje!
  deliveryPhone   String  // uz existuje!
  // ...
}
```

**Dobra zprava:** `buyerId` je `String?` (nullable) — objednavka BEZ uzivatele je jiz mozna v DB.

### API route `app/api/orders/route.ts` (radky 21-24)

```ts
const session = await getServerSession(authOptions);
const buyerId = session?.user?.id ?? null;
```

**Uz funguje!** Pokud neni prihlaseny, `buyerId` je `null`. API NEVYZADUJE prihlaseni.

### Checkout stranka `app/(web)/shop/objednavka/page.tsx`

Frontend odesila na `/api/orders` vsechna data (name, phone, email, address, items) — nevyzaduje session.

### Problem: Sledovani objednavky

`app/(web)/shop/moje-objednavky/page.tsx` VYZADUJE prihlaseni (fetch `/api/orders?role=buyer`).
`app/api/orders/[id]/route.ts` VYZADUJE `session?.user?.id` — guest nemuze videt svou objednavku.

### Chybejici pole v Order

- **guestToken** — pro sledovani objednavky bez prihlaseni
- Neexistuje stranka `/shop/objednavky/sledovani/[token]`

---

## Kroky implementace

### Krok 1: Pridat guestToken do Order modelu

**Soubor:** `prisma/schema.prisma` — Order model

```diff
 model Order {
   id          String  @id @default(cuid())
   orderNumber String  @unique
   buyerId     String?
   buyer       User?   @relation(fields: [buyerId], references: [id])
+
+  // Guest checkout
+  guestToken  String?  @unique  // Token pro sledovani objednavky bez prihlaseni
```

**Pridat index:**
```diff
   @@index([buyerId])
   @@index([status])
+  @@index([guestToken])
 }
```

### Krok 2: Vytvorit migraci

```bash
npx prisma migrate dev --name add_guest_token_to_order
```

### Krok 3: Upravit API `app/api/orders/route.ts` — POST

**Zmeny v POST handleru (radky 86-123):**

```diff
+import crypto from "crypto";

 // V POST handleru, pred prisma.$transaction:
+    // Generovat guest token pokud neni prihlaseny
+    const isGuest = !buyerId;
+    const guestToken = isGuest ? crypto.randomBytes(32).toString("hex") : null;

 // V prisma.$transaction, order.create:
       const created = await tx.order.create({
         data: {
           orderNumber: generateOrderNumber(),
           buyerId,
+          guestToken,
           status: "PENDING",
           deliveryName: data.deliveryName,
           // ... zbytek beze zmeny
         },
       });

 // V response:
-    return NextResponse.json({ order }, { status: 201 });
+    return NextResponse.json({
+      order,
+      ...(guestToken && { trackingUrl: `/shop/objednavky/sledovani/${guestToken}` }),
+    }, { status: 201 });
```

### Krok 4: Upravit API `app/api/orders/[id]/route.ts` — GET

Pridat moznost pristupu pres guestToken:

```diff
 export async function GET(
   request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
 ) {
   try {
     const session = await getServerSession(authOptions);
+    const token = request.nextUrl.searchParams.get("token");
     const { id } = await params;

     const order = await prisma.order.findFirst({
       where: { OR: [{ id }, { orderNumber: id }] },
       include: { /* ... */ },
     });

     if (!order) {
       return NextResponse.json({ error: "Objednavka nenalezena" }, { status: 404 });
     }

-    // Pristup: prihlaseny vlastnik
-    if (session?.user?.id !== order.buyerId) {
-      // ... admin check
-    }
+    // Pristup: prihlaseny vlastnik, admin, nebo guest s tokenem
+    const isOwner = session?.user?.id && session.user.id === order.buyerId;
+    const isAdmin = session?.user?.role && ["ADMIN", "BACKOFFICE", "PARTS_SUPPLIER"].includes(session.user.role);
+    const isGuest = token && order.guestToken && token === order.guestToken;
+
+    if (!isOwner && !isAdmin && !isGuest) {
+      return NextResponse.json({ error: "Pristup odepren" }, { status: 403 });
+    }
```

### Krok 5: Vytvorit guest tracking API

**Soubor:** `app/api/orders/track/[token]/route.ts` (NOVY)

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/orders/track/[token] — Sledovani objednavky pres guest token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 32) {
      return NextResponse.json({ error: "Neplatny token" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { guestToken: token },
      include: {
        items: {
          include: {
            part: {
              select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Objednavka nenalezena" }, { status: 404 });
    }

    // Vracet jen bezpecna data (ne interni poznamky, supplier info)
    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalPrice: order.totalPrice,
        shippingPrice: order.shippingPrice,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        trackingNumber: order.trackingNumber,
        deliveryName: order.deliveryName,
        createdAt: order.createdAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        items: order.items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          part: i.part,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/orders/track/[token] error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
```

### Krok 6: Vytvorit stranku pro sledovani

**Soubor:** `app/(web)/shop/objednavky/sledovani/[token]/page.tsx` (NOVY)

```tsx
"use client";

import { useState, useEffect, use } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OrderTracker } from "@/components/web/OrderTracker";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

// ... OrderTracker status mapping (shodne s moje-objednavky)

export default function SledovaniPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/track/${token}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        } else {
          setError("Objednavka nenalezena nebo neplatny odkaz");
        }
      } catch {
        setError("Chyba pri nacitani");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [token]);

  // ... render: OrderTracker, order detail, items list
  // + CTA "Registrujte se pro snadnejsi sledovani" (Link na /registrace)
}
```

### Krok 7: Upravit checkout potvrzeni

**Soubor:** `app/(web)/shop/objednavka/potvrzeni/page.tsx`

Po uspesne objednavce zobrazit:
- Cislo objednavky
- Pokud guest: odkaz na sledovaci stranku + upozorneni "Ulozte si tento odkaz"
- CTA: "Registrujte se" (dobrovolna registrace)

**Zmena v `app/(web)/shop/objednavka/page.tsx` (radky 86-123):**

Po uspesnem POST, prochazit response a pokud obsahuje `trackingUrl`, pridat do URL parametru:
```diff
       if (res.ok) {
         const data = await res.json();
         clearCart();
-        router.push(`/shop/objednavka/potvrzeni?id=${data.order?.orderNumber ?? data.order?.id ?? "demo"}`);
+        const trackingParam = data.trackingUrl ? `&tracking=${encodeURIComponent(data.trackingUrl)}` : "";
+        router.push(`/shop/objednavka/potvrzeni?id=${data.order?.orderNumber ?? data.order?.id ?? "demo"}${trackingParam}`);
       }
```

### Krok 8: Shodne zmeny pro dily checkout

`app/(web)/dily/objednavka/page.tsx` — shodne zmeny jako krok 7.

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `prisma/schema.prisma` | Pridat `guestToken String? @unique` do Order |
| `app/api/orders/route.ts` | POST: generovat guestToken pro guest, vracet trackingUrl |
| `app/api/orders/[id]/route.ts` | GET: pridat pristup pres guestToken query param |
| `app/api/orders/track/[token]/route.ts` | NOVY — guest tracking endpoint |
| `app/(web)/shop/objednavky/sledovani/[token]/page.tsx` | NOVY — sledovaci stranka |
| `app/(web)/shop/objednavka/page.tsx` | Predavat trackingUrl do potvrzeni |
| `app/(web)/shop/objednavka/potvrzeni/page.tsx` | Zobrazit tracking odkaz + CTA registrace |
| `app/(web)/dily/objednavka/page.tsx` | Shodne zmeny jako shop |

## Overeni

- [ ] Guest (neprihlaseny) muze vytvorit objednavku — POST `/api/orders` vraci `trackingUrl`
- [ ] Prihlaseny uzivatel — `guestToken` je null, `buyerId` je nastaveny
- [ ] Guest tracking stranka funguje s platnym tokenem
- [ ] Guest tracking stranka vraci 404 s neplatnym tokenem
- [ ] Potvrzovaci stranka zobrazuje tracking odkaz pro guest
- [ ] Potvrzovaci stranka nabizi dobrovolnou registraci
- [ ] Existujici prihlaseny checkout funguje beze zmeny
- [ ] Migrace projde
- [ ] Build prochazi
