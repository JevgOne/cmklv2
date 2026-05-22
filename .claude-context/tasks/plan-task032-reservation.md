# Plan — Task #32: Rezervace unikátních dílů (30min timeout)

**Datum:** 2026-04-14
**Gap:** G-03 (P0)
**Effort:** M (4-8h)

---

## 1. PROBLÉM

Použité díly jsou unikáty (stock=1). Bez rezervace 2 zákazníci zahájí checkout současně → oba dostanou potvrzení → race condition. Aktuálně `POST /api/orders` jen ověří stock v transakci, ale nerezeruje díl při zahájení checkoutu.

---

## 2. PRISMA SCHEMA

### 2a. Nový model `PartReservation`

Přidat do `prisma/schema.prisma`:

```prisma
model PartReservation {
  id        String   @id @default(cuid())
  partId    String
  part      Part     @relation(fields: [partId], references: [id])
  sessionId String   // cookie/token identifikující checkout session
  quantity  Int      @default(1)
  expiresAt DateTime // now() + 30 min
  orderId   String?  // vyplní se po úspěšném objednání
  createdAt DateTime @default(now())

  @@unique([partId, sessionId])
  @@index([expiresAt])
  @@index([partId])
}
```

### 2b. Relace na Part

Přidat do Part modelu:
```prisma
  reservations PartReservation[]
```

### 2c. Part.status — BEZ ZMĚNY

Part.status zůstává DRAFT/ACTIVE/SOLD/INACTIVE. Nepoužíváme "RESERVED" status na Part — reservation je separátní tabulka. Důvod: Part může mít stock=5, z toho 2 rezervované → Part zůstává ACTIVE.

---

## 3. NOVÉ API ROUTES

### 3a. POST /api/parts/reserve (NOVÝ)

**Soubor:** `app/api/parts/reserve/route.ts`

```
Auth: nepotřeba (guest checkout support)
Body: { partId: string, quantity: number, sessionId: string }
Response: { reservation: PartReservation } | { error: "Díl je dočasně rezervován" }
```

**Logika:**
```typescript
export async function POST(request: NextRequest) {
  const { partId, quantity = 1, sessionId } = await request.json();

  // Validace
  if (!partId || !sessionId) return error 400;

  const result = await prisma.$transaction(async (tx) => {
    const part = await tx.part.findUnique({
      where: { id: partId, status: "ACTIVE" },
      select: { id: true, stock: true, name: true },
    });
    if (!part) throw new Error("PART_NOT_FOUND");

    // Spočítat aktuálně rezervované kusy (neexpirované)
    const now = new Date();
    const activeReservations = await tx.partReservation.aggregate({
      where: {
        partId,
        expiresAt: { gt: now },
        orderId: null, // jen nezaplacené
        sessionId: { not: sessionId }, // nepočítat svoji vlastní
      },
      _sum: { quantity: true },
    });

    const reservedQty = activeReservations._sum.quantity ?? 0;
    const availableQty = part.stock - reservedQty;

    if (availableQty < quantity) {
      throw new Error("PART_RESERVED");
    }

    // Upsert rezervace (pokud už má session rezervaci, prodlužit)
    return tx.partReservation.upsert({
      where: { partId_sessionId: { partId, sessionId } },
      create: {
        partId,
        sessionId,
        quantity,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // +30 min
      },
      update: {
        quantity,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // refresh
      },
    });
  });

  return NextResponse.json({ reservation: result });
}
```

**Error handling:**
- `PART_NOT_FOUND` → 404
- `PART_RESERVED` → 409 Conflict `{ error: "Díl je dočasně rezervován jiným zákazníkem. Zkuste to za chvíli." }`

### 3b. DELETE /api/parts/reserve (NOVÝ)

Zrušení rezervace (zákazník opustí checkout):
```
Body: { partId: string, sessionId: string }
```

### 3c. Refactor POST /api/orders

**Soubor:** `app/api/orders/route.ts`

V `$transaction` bloku po vytvoření Order:
1. Najít aktivní PartReservation pro items
2. Propojit `orderId` na rezervaci (zamezí expiraci cronem)
3. Pokud reservation neexistuje → vytvořit inline (fallback pro přímé objednávky bez checkoutu)

```typescript
// Po vytvoření order + snížení stock:
for (const item of data.items) {
  // Označit rezervace jako vyřízené
  await tx.partReservation.updateMany({
    where: {
      partId: item.partId,
      orderId: null,
      // sessionId match pokud poslaný
    },
    data: { orderId: created.id },
  });
}
```

---

## 4. CRON — expirace rezervací

**Soubor:** `app/api/cron/reservation-part-expiry/route.ts` (NOVÝ)

**Pozor:** Existující `reservation-expiry` je pro VOZY (48h vehicle reservation). Toto je NOVÝ cron pro díly (30min).

```typescript
export async function GET(request: NextRequest) {
  // CRON_SECRET auth (standardní pattern)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Smazat expirované rezervace bez orderId
  const deleted = await prisma.partReservation.deleteMany({
    where: {
      expiresAt: { lt: now },
      orderId: null,
    },
  });

  return NextResponse.json({
    success: true,
    expired: deleted.count,
  });
}
```

**Vercel Cron konfigurace** (v `vercel.json` nebo cron config):
```json
{ "path": "/api/cron/reservation-part-expiry", "schedule": "*/5 * * * *" }
```
Každých 5 minut — dostatečná přesnost pro 30min timeout.

---

## 5. CHECKOUT UI INTEGRACE

### 5a. Session ID generování

V `app/(web)/dily/objednavka/page.tsx`:
```typescript
const [sessionId] = useState(() =>
  typeof window !== 'undefined'
    ? sessionStorage.getItem('checkout_session') || (() => {
        const id = crypto.randomUUID();
        sessionStorage.setItem('checkout_session', id);
        return id;
      })()
    : ''
);
```

### 5b. Rezervace při vstupu do checkoutu

Na mount (useEffect):
```typescript
useEffect(() => {
  // Rezervovat všechny unikátní díly v košíku
  const reserveItems = async () => {
    for (const item of items) {
      try {
        await fetch('/api/parts/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partId: item.id,
            quantity: item.quantity,
            sessionId,
          }),
        });
      } catch {
        // Pokud rezervace selže → upozornit (409 = "dočasně rezervován")
      }
    }
  };
  if (items.length > 0 && sessionId) reserveItems();
}, [items, sessionId]);
```

### 5c. Uvolnění při odchodu

```typescript
useEffect(() => {
  return () => {
    // Cleanup — uvolnit rezervace pokud zákazník odejde
    for (const item of items) {
      navigator.sendBeacon('/api/parts/reserve-release', JSON.stringify({
        partId: item.id, sessionId,
      }));
    }
  };
}, []);
```

### 5d. UI feedback

Na detailu dílu + v katalogu:
```typescript
// Pokud part.availableStock <= 0 ale part.stock > 0 → "Dočasně rezervován"
// Nový prop na ProductCard: reserved?: boolean
```

API `/api/parts` a `/api/parts/[slug]` musí vracet `availableStock` (stock minus aktivní rezervace):
```typescript
const reservedQty = await prisma.partReservation.aggregate({
  where: { partId: part.id, expiresAt: { gt: new Date() }, orderId: null },
  _sum: { quantity: true },
});
part.availableStock = part.stock - (reservedQty._sum.quantity ?? 0);
```

---

## 6. TIMER UI

Na checkout stránce zobrazit odpočet:
```
Vaše rezervace vyprší za: 24:37
```
- Countdown z `reservation.expiresAt`
- Při dosažení 5 min → žlutý warning
- Při dosažení 0 → redirect zpět do košíku s hláškou "Rezervace vypršela"

---

## 7. POŘADÍ IMPLEMENTACE

1. Prisma schema — PartReservation model + migrace
2. POST /api/parts/reserve — core rezervační logika
3. Cron endpoint — reservation-part-expiry
4. Refactor POST /api/orders — propojení s rezervacemi
5. Checkout UI — sessionId + reserve on mount + timer
6. Catalog/detail UI — availableStock badge

---

## 8. STOP & ESCALATE

- **STOP-1:** Prisma migrate selže → db push + manuální migrace
- **STOP-2:** Race condition i po transakci (serializable isolation) → zvážit SELECT FOR UPDATE
- **STOP-3:** sendBeacon reliability → fallback na cron cleanup (primární mechanismus)

---

## 9. COMMIT

```
feat: add 30-min part reservation system for checkout

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
