# Plan — Task #39: SupplierReview (hodnocení dodavatelů)

**Datum:** 2026-04-14
**Gap:** G-06 (P1)
**Effort:** M (4-8h)

---

## 1. PRISMA SCHEMA

```prisma
model SupplierReview {
  id         String   @id @default(cuid())
  supplierId String
  supplier   User     @relation("SupplierReviews", fields: [supplierId], references: [id])
  buyerId    String
  buyer      User     @relation("BuyerReviews", fields: [buyerId], references: [id])
  orderId    String   // ověření nákupu
  order      Order    @relation(fields: [orderId], references: [id])
  rating     Int      // 1-5
  text       String?
  isPublic   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([buyerId, orderId]) // 1 review per order per buyer
  @@index([supplierId])
}
```

Přidat na User:
```prisma
  supplierReviews SupplierReview[] @relation("SupplierReviews")
  buyerReviews    SupplierReview[] @relation("BuyerReviews")
```

---

## 2. API

### POST /api/suppliers/[id]/review
**Auth:** přihlášený BUYER
**Body:** `{ orderId, rating: 1-5, text? }`
**Validace:**
1. Ověřit že order.buyerId === session.user.id
2. Ověřit že order.status === "DELIVERED"
3. Ověřit že order obsahuje items od tohoto supplierId
4. Ověřit duplicitu (buyerId + orderId unique)

### GET /api/suppliers/[id]/reviews
**Auth:** public
**Response:** `{ reviews, averageRating, totalCount }`

---

## 3. UI

### Detail dílu — dodavatel rating
```
Dodavatel: Vrakoviště Brno ⭐ 4.3 (12 hodnocení)
```

### Stránka vrakoviště — reviews sekce
Na `/dily/vrakoviste/[slug]` — seznam recenzí s hvězdičkami.

### Post-purchase email trigger
Po DELIVERED → email zákazníkovi: "Ohodnoťte svůj nákup" s linkem.

---

## 4. COMMIT
```
feat: add supplier review system (post-purchase 1-5 stars)
```
