# Plan P2-08: Rezervace Unikatnich Dilu (30 min)

**Priorita:** P2 (TOP 4 z 25 — Business Value 4/5, UX 4/5, Security 1/5 = 9/15)
**Slozitost:** M (3-4 hodiny)
**Zavislosti:** P0-08 (PostgreSQL)
**Batch:** 4+

---

## Zduvodneni vyberu

**Pouzite autodily jsou unikaty** — kazdy existuje jen jednou (na rozdil od novych aftermarket dilu). Bez rezervace:
- 2 zakaznici mohou vlozit stejny dil do kosiku a objednat → overselling
- Dodavatel musi rucne resit konflikt a jednomu zrusit objednavku → spatna UX
- Ztrata duvery zakazniku

**Reseni:** 30-minutova automaticka rezervace pri pridani do kosiku. Po 30 min se uvolni. Cron job pro cleanup.

---

## Analyza aktualniho stavu

### Part model

```prisma
model Part {
  // ...
  stock     Int     @default(1)  // Vetsina pouzitech dilu ma stock=1
  partType  String  @default("USED") // USED, NEW, AFTERMARKET
  status    String  @default("DRAFT") // DRAFT, ACTIVE, SOLD, INACTIVE
  // ...
}
```

**Klicove:** `stock` je Int — pouzite dily maji typicky `stock=1`. Aftermarket dily mohou mit `stock > 1`.

### Kosik

**Soubor:** `lib/cart.ts` — localStorage-based kosik. **ZADNA server-side validace dostupnosti pri pridani.**

### Objednavkovy flow

**Soubor:** `app/api/orders/route.ts` POST — validuje dostupnost pri vytvoreni objednavky:
```ts
// Overit dostupnost
for (const item of cartItems) {
  const part = await prisma.part.findUnique({ where: { id: item.id } });
  if (!part || part.status !== "ACTIVE" || part.stock < item.quantity) {
    // ... chyba "Nedostatecna dostupnost"
  }
}
```

**Problem:** Validuje az pri submit objednavky. Mezi "pridat do kosiku" a "objednat" muze nekdo jiny dil objednat.

---

## Kroky implementace

### Krok 1: Rozsirit Part model o rezervacni pole

**Soubor:** `prisma/schema.prisma` (Part model)

```diff
  stock      Int     @default(1)
+ reservedBy    String?  // ID session/user ktery ma dil rezervovany
+ reservedUntil DateTime? // Konec rezervace (30 min od pridani do kosiku)
  weight     Float?
```

**Migrace:**
```bash
npx prisma migrate dev --name add_part_reservation_fields
```

### Krok 2: API pro rezervaci dilu

**Soubor:** `app/api/parts/[id]/reserve/route.ts` (NOVY)

```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RESERVATION_MINUTES = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // Pro neprihlasene pouzit sessionId z cookie/body
    const body = await request.json().catch(() => ({}));
    const reserverId = session?.user?.id || body.sessionId;

    if (!reserverId) {
      return NextResponse.json(
        { error: "Chybí identifikace session" },
        { status: 400 }
      );
    }

    // Atomicka operace — rezervuj jen pokud neni jiz rezervovano nekym jinym
    const now = new Date();
    const reservedUntil = new Date(now.getTime() + RESERVATION_MINUTES * 60 * 1000);

    // Prisma transaction pro atomicitu
    const part = await prisma.$transaction(async (tx) => {
      const current = await tx.part.findUnique({
        where: { id },
        select: {
          id: true,
          stock: true,
          status: true,
          partType: true,
          reservedBy: true,
          reservedUntil: true,
        },
      });

      if (!current || current.status !== "ACTIVE") {
        throw new Error("PART_NOT_AVAILABLE");
      }

      // Aftermarket/nove dily s vysokym stock nemusi byt rezervovany
      if (current.partType !== "USED" && current.stock > 5) {
        return current; // Neni treba rezervovat
      }

      if (current.stock < 1) {
        throw new Error("OUT_OF_STOCK");
      }

      // Kontrola existujici rezervace
      if (current.reservedBy && current.reservedBy !== reserverId) {
        if (current.reservedUntil && current.reservedUntil > now) {
          throw new Error("ALREADY_RESERVED");
        }
        // Rezervace expirovala — muze byt prebihnuta
      }

      // Nastavit rezervaci
      return tx.part.update({
        where: { id },
        data: { reservedBy: reserverId, reservedUntil },
      });
    });

    return NextResponse.json({
      reserved: true,
      reservedUntil: reservedUntil.toISOString(),
      expiresInMinutes: RESERVATION_MINUTES,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Interní chyba";

    if (message === "PART_NOT_AVAILABLE") {
      return NextResponse.json(
        { error: "Díl není dostupný" },
        { status: 404 }
      );
    }
    if (message === "OUT_OF_STOCK") {
      return NextResponse.json(
        { error: "Díl je vyprodaný" },
        { status: 409 }
      );
    }
    if (message === "ALREADY_RESERVED") {
      return NextResponse.json(
        { error: "Díl je rezervován jiným zákazníkem. Zkuste to za chvíli." },
        { status: 409 }
      );
    }

    console.error("Reserve part error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

// DELETE — zrusit rezervaci (odebrání z košíku)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const body = await request.json().catch(() => ({}));
  const reserverId = session?.user?.id || body.sessionId;

  if (!reserverId) {
    return NextResponse.json({ error: "Chybí identifikace" }, { status: 400 });
  }

  await prisma.part.updateMany({
    where: { id, reservedBy: reserverId },
    data: { reservedBy: null, reservedUntil: null },
  });

  return NextResponse.json({ released: true });
}
```

### Krok 3: Cron job pro uvolneni expirovanych rezervaci

**Soubor:** `app/api/cron/release-reservations/route.ts` (NOVY)

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Spousten kazdych 5 minut pres Vercel Cron / GitHub Actions
export async function GET(request: NextRequest) {
  // Overeni cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Uvolnit vsechny expirovane rezervace
  const result = await prisma.part.updateMany({
    where: {
      reservedBy: { not: null },
      reservedUntil: { lt: now },
    },
    data: {
      reservedBy: null,
      reservedUntil: null,
    },
  });

  return NextResponse.json({
    released: result.count,
    timestamp: now.toISOString(),
  });
}
```

**Vercel cron konfigurace — pridat do `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/release-reservations",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Krok 4: Upravit kosik — volat reserve API

**Soubor:** `lib/cart.ts`

Pridat server-side rezervaci pri pridani USED dilu do kosiku:

```ts
export async function addToCart(part: CartItem) {
  // Pokud je dil pouzity (unikat), rezervovat na serveru
  if (part.partType === "USED") {
    const sessionId = getOrCreateSessionId(); // localStorage session ID
    const res = await fetch(`/api/parts/${part.id}/reserve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Rezervace se nezdařila");
    }

    const { reservedUntil } = await res.json();
    part.reservedUntil = reservedUntil;
  }

  // Pridat do localStorage kosiku (existujici logika)
  const cart = getCart();
  cart.push(part);
  saveCart(cart);
}

export async function removeFromCart(partId: string) {
  const cart = getCart();
  const item = cart.find(i => i.id === partId);

  // Uvolnit rezervaci na serveru
  if (item?.partType === "USED") {
    const sessionId = getOrCreateSessionId();
    await fetch(`/api/parts/${partId}/reserve`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {}); // Silent fail — cron uvolni
  }

  const newCart = cart.filter(i => i.id !== partId);
  saveCart(newCart);
}

function getOrCreateSessionId(): string {
  let id = localStorage.getItem("cart_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("cart_session_id", id);
  }
  return id;
}
```

### Krok 5: UI indikace rezervace

**Soubor:** `app/(web)/dily/kosik/page.tsx`

Zobrazit casovac u rezervovanych dilu:

```tsx
{item.reservedUntil && (
  <ReservationTimer expiresAt={item.reservedUntil} onExpired={() => removeItem(item.id)} />
)}
```

**Novy komponent:** `components/shop/ReservationTimer.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";

export function ReservationTimer({ expiresAt, onExpired }: {
  expiresAt: string;
  onExpired: () => void;
}) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        clearInterval(interval);
        onExpired();
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  return (
    <span className="text-xs text-warning-500 font-medium">
      Rezervovano {remaining}
    </span>
  );
}
```

### Krok 6: Upravit objednavkovy flow — validace rezervace

**Soubor:** `app/api/orders/route.ts` POST

Pridat kontrolu ze dil je rezervovany TIMTO zakaznikem:

```diff
  // Overit dostupnost
  for (const item of cartItems) {
    const part = await prisma.part.findUnique({ where: { id: item.id } });
    if (!part || part.status !== "ACTIVE" || part.stock < item.quantity) {
      // ... chyba
    }
+   // Overit rezervaci pro USED dily
+   if (part.partType === "USED" && part.reservedBy) {
+     const reserverId = session?.user?.id || body.sessionId;
+     if (part.reservedBy !== reserverId) {
+       return NextResponse.json(
+         { error: `Díl "${part.name}" je rezervován jiným zákazníkem` },
+         { status: 409 }
+       );
+     }
+   }
  }
```

Po uspesnem vytvoreni objednavky — uvolnit rezervaci a snizit stock:

```diff
+ // Uvolnit rezervace a snizit stock
+ for (const item of cartItems) {
+   await prisma.part.update({
+     where: { id: item.id },
+     data: {
+       stock: { decrement: item.quantity },
+       reservedBy: null,
+       reservedUntil: null,
+       status: part.stock - item.quantity <= 0 ? "SOLD" : undefined,
+     },
+   });
+ }
```

### Krok 7: Detail dilu — zobrazeni stavu

**Soubor:** `app/(web)/dily/[slug]/page.tsx`

```tsx
{part.partType === "USED" && part.reservedBy && part.reservedUntil > new Date() && (
  <div className="bg-warning-50 border border-warning-500/20 rounded-lg p-3 text-sm text-gray-700">
    Tento díl je momentálně v košíku jiného zákazníka.
    Bude dostupný za {minutesRemaining} minut.
  </div>
)}
```

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena | Narocnost |
|--------|-------|-----------|
| `prisma/schema.prisma` | Part: reservedBy, reservedUntil | XS |
| `app/api/parts/[id]/reserve/route.ts` | NOVY — POST/DELETE rezervace | M |
| `app/api/cron/release-reservations/route.ts` | NOVY — cron cleanup | S |
| `lib/cart.ts` | Pridat server-side reserve/release | M |
| `components/shop/ReservationTimer.tsx` | NOVY — casovac | S |
| `app/(web)/dily/kosik/page.tsx` | Casovac u polozek | S |
| `app/(web)/dily/[slug]/page.tsx` | "Rezervovano jinym" info | XS |
| `app/api/orders/route.ts` | Validace rezervace + stock decrement | S |
| `vercel.json` | Cron schedule | XS |

---

## Overeni

- [ ] USED dil (stock=1): pridani do kosiku → POST /api/parts/.../reserve → reservedBy nastaveno
- [ ] Jiny zakaznik zkusi pridat stejny dil → 409 "Díl je rezervován"
- [ ] Po 30 min: cron uvolni → dil opet dostupny
- [ ] Odebrani z kosiku → DELETE reserve → dil uvolnen okamzite
- [ ] Objednavka: validuje ze dil je rezervovany timto zakaznikem
- [ ] Objednavka: po vytvoreni stock se snizi, rezervace uvolnena
- [ ] NEW/AFTERMARKET dily s stock > 5: bez rezervace (preskoceno)
- [ ] Casovac v kosiku: pocitadlo, po expiraci odebrani z kosiku
- [ ] Build prochazi
