# Plan — Task #40: Wishlist/oblíbené + notify-stock API

**Datum:** 2026-04-14
**Gap:** G-07 + G-19 (P2)
**Effort:** M (4-8h)

---

## 1. WISHLIST — rozšíření Favorite modelu

Existující `Favorite` model (řádek 776) má jen `listingId`. Rozšířit:

```prisma
model Favorite {
  id        String  @id @default(cuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  listingId String?
  listing   Listing? @relation(fields: [listingId], references: [id])
  partId    String?          // NOVÉ
  part      Part?   @relation(fields: [partId], references: [id])  // NOVÉ
  createdAt DateTime @default(now())

  @@unique([userId, listingId])
  @@unique([userId, partId])   // NOVÉ
  @@index([userId])
}
```

### API refactor
`app/api/favorites/route.ts` — přidat `partId` support:
- POST body: `{ listingId?: string, partId?: string }` (jeden z nich)
- GET response: include `part` relation pokud partId

### UI
`components/web/FavoriteButton.tsx` — přidat `partId` prop (vedle stávajícího `listingId`).
Použít na ProductCard a part detail page.

---

## 2. NOTIFY-STOCK — "Opět skladem"

### Prisma model
```prisma
model StockNotification {
  id        String   @id @default(cuid())
  partId    String
  part      Part     @relation("StockNotifications", fields: [partId], references: [id])
  email     String   // může být nepřihlášený
  userId    String?
  user      User?    @relation("UserStockNotifications", fields: [userId], references: [id])
  notified  Boolean  @default(false)
  createdAt DateTime @default(now())

  @@unique([partId, email])
  @@index([partId, notified])
}
```

### POST /api/parts/[id]/notify-stock
**Auth:** volitelné (guest jen email, přihlášený auto-fill)
**Body:** `{ email }` (nebo auto z session)
**Logika:**
1. Ověřit part.stock === 0
2. Upsert StockNotification

### Cron — kontrola a rozesílání
V `app/api/cron/stock-alerts/route.ts` (existující) PŘIDAT sekci:
```typescript
// Customer "opět skladem" notifikace
const restocked = await prisma.stockNotification.findMany({
  where: {
    notified: false,
    part: { stock: { gt: 0 }, status: "ACTIVE" },
  },
  include: { part: { select: { name: true, slug: true, price: true } } },
});

for (const notif of restocked) {
  await sendEmail({
    to: notif.email,
    subject: `${notif.part.name} je opět skladem!`,
    html: `<p>Díl <strong>${notif.part.name}</strong> je opět dostupný za ${notif.part.price} Kč.</p>
           <a href="${baseUrl}/dily/${notif.part.slug}">Zobrazit díl →</a>`,
  });
  await prisma.stockNotification.update({
    where: { id: notif.id },
    data: { notified: true },
  });
}
```

### UI
Na detailu dílu pokud stock === 0:
```tsx
<Card className="bg-yellow-50 p-4">
  <p>Tento díl je momentálně vyprodán.</p>
  <input type="email" placeholder="Váš email" />
  <Button>Upozornit mě</Button>
</Card>
```

---

## 3. COMMIT
```
feat: add part wishlist + back-in-stock email notifications
```
