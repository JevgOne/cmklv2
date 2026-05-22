# Plan — Task #35: PartRequest/poptávka flow

**Datum:** 2026-04-14
**Gap:** G-04 (P1)
**Effort:** L (2-3 dny)

---

## 1. PRISMA SCHEMA

### PartRequest
```prisma
model PartRequest {
  id           String   @id @default(cuid())
  description  String   // "Přední nárazník"
  vehicleBrand String?
  vehicleModel String?
  vehicleYear  Int?
  vin          String?
  buyerEmail   String
  buyerPhone   String?
  buyerName    String?
  buyerId      String?  // pokud přihlášený
  buyer        User?    @relation("BuyerPartRequests", fields: [buyerId], references: [id])

  status    String   @default("OPEN") // OPEN, OFFERS_RECEIVED, ORDERED, CLOSED, EXPIRED
  expiresAt DateTime // now() + 14 dní

  offers PartRequestOffer[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([expiresAt])
}

model PartRequestOffer {
  id          String @id @default(cuid())
  requestId   String
  request     PartRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  supplierId  String
  supplier    User @relation("SupplierPartRequestOffers", fields: [supplierId], references: [id])
  partName    String
  price       Int
  condition   String   // FUNCTIONAL, WITH_DEFECT
  description String?
  imageUrl    String?
  status      String @default("OFFERED") // OFFERED, ACCEPTED, REJECTED
  createdAt   DateTime @default(now())

  @@index([requestId])
  @@index([supplierId])
}
```

Přidat na User:
```prisma
  partRequests       PartRequest[]      @relation("BuyerPartRequests")
  partRequestOffers  PartRequestOffer[] @relation("SupplierPartRequestOffers")
```

---

## 2. API ROUTES

### POST /api/part-requests
**Auth:** volitelné (guest + přihlášený)
**Body:** `{ description, vehicleBrand?, vehicleModel?, vehicleYear?, vin?, buyerEmail, buyerPhone?, buyerName? }`
**Logika:**
1. Validace (Zod)
2. Create PartRequest s `expiresAt: +14 dní`
3. Rozeslat email všem ACTIVE dodavatelům (`sendEmail` z `lib/resend.ts`)
4. Return `{ request }`

### GET /api/part-requests
**Auth:** PARTS_SUPPLIER / WHOLESALE_SUPPLIER / PARTNER_VRAKOVISTE / ADMIN
**Query:** `?status=OPEN&page=1`
**Logika:** Vrátit OPEN poptávky (supplier vidí jen nezexpirované)

### POST /api/part-requests/[id]/offer
**Auth:** PARTS_SUPPLIER / WHOLESALE_SUPPLIER / PARTNER_VRAKOVISTE
**Body:** `{ partName, price, condition, description?, imageUrl? }`
**Logika:**
1. Ověřit že request.status === "OPEN" nebo "OFFERS_RECEIVED"
2. Create PartRequestOffer
3. Update request status → "OFFERS_RECEIVED" pokud první nabídka
4. Odeslat email zákazníkovi s nabídkou

### Cron — expirace poptávek
Přidat do existujícího cron nebo nový `app/api/cron/part-request-expiry/route.ts`:
```typescript
await prisma.partRequest.updateMany({
  where: { status: { in: ["OPEN", "OFFERS_RECEIVED"] }, expiresAt: { lt: now } },
  data: { status: "EXPIRED" },
});
```

---

## 3. UI

### 3a. "Nenašli jste?" CTA
Na stránce výsledků (`/dily/katalog`) pokud 0 výsledků:
```tsx
{parts.length === 0 && (
  <Card className="p-6 text-center">
    <h3>Nenašli jste co hledáte?</h3>
    <p>Poptejte díl u našich vrakovišť — odpovídají do 24h</p>
    <Button onClick={() => setShowRequestForm(true)}>Poptejte díl</Button>
  </Card>
)}
```

### 3b. Poptávkový formulář
Modal nebo inline Card s poli: co hledáte, pro jaký vůz (brand/model/rok nebo VIN), email, telefon.

### 3c. Supplier PWA — poptávky tab
V `app/(pwa-parts)/parts/` přidat stránku `/parts/requests`:
- Seznam OPEN poptávek
- Tlačítko "Nabídnout díl" → formulář (název, cena, stav, foto, popis)

---

## 4. COMMIT
```
feat: add part request system (burza dílů) with supplier offers
```
