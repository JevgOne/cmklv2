# Carmakler - Modul 4: Provize & Finance

## Přehled modulu

Provizní systém pro makléře včetně bonusů pro manažery a regionální ředitele.

---

## Provizní model

### Základní pravidla

```
PROVIZE = 5% z prodejní ceny (minimum 25 000 Kč)

Split:
├── Makléř: 50%
└── Firma: 50%
    ├── Manažer: 5% (z firemních 50%)
    ├── Ředitel: 3% (z firemních 50%)
    └── Carmakler: zbytek
```

### Příklad výpočtu

```
Prodej vozu za 600 000 Kč
─────────────────────────

Provize 5% = 30 000 Kč

Makléř (50%):     15 000 Kč
Firma (50%):      15 000 Kč
  └── Manažer (5%):   750 Kč
  └── Ředitel (3%):   450 Kč
  └── Carmakler:   13 800 Kč

+ Bonus pojištění: 3 000 Kč
  └── Makléř (50%):  1 500 Kč
  └── Firma (50%):   1 500 Kč
```

---

## Datový model

### Sale (Prodej)

```prisma
model Sale {
  id              String      @id @default(cuid())
  
  vehicleId       String      @unique
  vehicle         Vehicle     @relation(fields: [vehicleId], references: [id])
  
  brokerId        String
  broker          User        @relation("BrokerSales", fields: [brokerId], references: [id])
  
  managerId       String?     // Snapshot hierarchie v době prodeje
  directorId      String?
  
  salePrice       Int
  saleDate        DateTime
  
  buyerName       String
  buyerEmail      String?
  buyerPhone      String?
  
  status          SaleStatus  @default(PENDING)
  
  hasInsurance    Boolean     @default(false)
  hasLeasing      Boolean     @default(false)
  
  commissions     Commission[]
  
  createdAt       DateTime    @default(now())
  approvedAt      DateTime?
  paidAt          DateTime?
}

enum SaleStatus {
  PENDING
  APPROVED
  PAID
  CANCELLED
}
```

### Commission (Provize)

```prisma
model Commission {
  id              String          @id @default(cuid())
  
  saleId          String
  sale            Sale            @relation(fields: [saleId], references: [id])
  
  userId          String
  user            User            @relation(fields: [userId], references: [id])
  
  type            CommissionType
  recipientRole   Role
  
  baseAmount      Int
  percentage      Float
  amount          Int
  
  status          CommissionStatus @default(PENDING)
  
  payoutId        String?
  payout          Payout?
  
  createdAt       DateTime        @default(now())
  paidAt          DateTime?
}

enum CommissionType {
  SALE
  INSURANCE
  LEASING
  MANAGER_BONUS
  DIRECTOR_BONUS
}

enum CommissionStatus {
  PENDING
  APPROVED
  PAID
  CANCELLED
}
```

### Payout (Výplata)

```prisma
model Payout {
  id              String        @id @default(cuid())
  
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  
  periodStart     DateTime
  periodEnd       DateTime
  totalAmount     Int
  
  status          PayoutStatus  @default(DRAFT)
  
  commissions     Commission[]
  
  createdAt       DateTime      @default(now())
  paidAt          DateTime?
}

enum PayoutStatus {
  DRAFT
  PENDING
  APPROVED
  PAID
}
```

---

## Výpočet provizí

```javascript
async function calculateCommissions(sale: Sale) {
  const settings = await getCommissionSettings();
  const commissions = [];
  
  // Základní provize
  const baseCommission = Math.max(
    sale.salePrice * 0.05,
    25000
  );
  
  // Makléř 50%
  const brokerAmount = baseCommission * 0.5;
  commissions.push({
    userId: sale.brokerId,
    type: 'SALE',
    amount: brokerAmount
  });
  
  // Firma 50%
  const companyAmount = baseCommission * 0.5;
  
  // Manažer 5% z firemní části
  if (sale.managerId) {
    commissions.push({
      userId: sale.managerId,
      type: 'MANAGER_BONUS',
      amount: companyAmount * 0.05
    });
  }
  
  // Ředitel 3% z firemní části
  if (sale.directorId) {
    commissions.push({
      userId: sale.directorId,
      type: 'DIRECTOR_BONUS',
      amount: companyAmount * 0.03
    });
  }
  
  return commissions;
}
```

---

## API Endpoints

```
GET    /api/sales                    # Seznam prodejů
POST   /api/sales                    # Nový prodej
POST   /api/sales/:id/approve        # Schválit

GET    /api/commissions              # Seznam provizí
GET    /api/commissions/my           # Moje provize

GET    /api/payouts                  # Seznam výplat
POST   /api/payouts/generate         # Vygenerovat za období
POST   /api/payouts/:id/approve      # Schválit
```

---

## UI - Makléř Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│  MOJE PROVIZE                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │   TENTO MĚSÍC  │  │   K VÝPLATĚ    │  │   CELKEM 2026  │     │
│  │   45 500 Kč    │  │   32 000 Kč    │  │  285 000 Kč    │     │
│  │   3 prodeje    │  │   čeká schvál. │  │   18 prodejů   │     │
│  └────────────────┘  └────────────────┘  └────────────────┘     │
│                                                                  │
│  HISTORIE                                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 15.1. • Škoda Octavia • 450 000 Kč                        │ │
│  │ Provize: 12 500 Kč + Pojištění: 1 500 Kč  ✅ Schváleno    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## UI - Manažer Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│  MŮJ TÝM - LEDEN 2026                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │   TÝM CELKEM   │  │   MŮJ BONUS    │  │   AKTIVNÍ VOZY │     │
│  │  185 000 Kč    │  │    9 250 Kč    │  │      24        │     │
│  │   12 prodejů   │  │   (5% z týmu)  │  │                │     │
│  └────────────────┘  └────────────────┘  └────────────────┘     │
│                                                                  │
│  MAKLÉŘI V TÝMU                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Jan Novák       5 prodejů    67 000 Kč    36% týmu        │ │
│  │ Petra Malá      4 prodeje    52 000 Kč    28% týmu        │ │
│  │ Tomáš Horák     3 prodeje    66 000 Kč    36% týmu        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## UI - Admin Schválení prodeje

```
┌──────────────────────────────────────────────────────────────────┐
│  PRODEJE KE SCHVÁLENÍ                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Škoda Octavia RS • Jan Novák • 15.1.2026                  │ │
│  │                                                            │ │
│  │ Prodejní cena:     450 000 Kč                             │ │
│  │ Provize (5%):       25 000 Kč (min.)                      │ │
│  │                                                            │ │
│  │ Rozdělení:                                                │ │
│  │ • Makléř (50%):        12 500 Kč                         │ │
│  │ • Manažer (5%):           625 Kč                         │ │
│  │ • Ředitel (3%):           375 Kč                         │ │
│  │ • Carmakler:           11 500 Kč                         │ │
│  │                                                            │ │
│  │ ☑️ Pojištění (+1 500 Kč)                                  │ │
│  │                                                            │ │
│  │ [✓ Schválit]     [✗ Zamítnout]                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Poznámky

1. **Snapshot hierarchie** - při prodeji uložit aktuálního manažera a ředitele.

2. **Minimum 25 000 Kč** - platí vždy, i pro levné vozy.

3. **Bonusy** - pojištění a leasing mají stejný split 50/50.

4. **Výplaty** - generovat měsíčně, export pro účetnictví.
