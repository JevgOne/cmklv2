# Plan — Task #36: CustomerGarage ("Moje garáž")

**Datum:** 2026-04-14
**Gap:** G-05 (P1)
**Effort:** M (4-8h)

---

## 1. PRISMA SCHEMA

```prisma
model CustomerGarage {
  id        String  @id @default(cuid())
  userId    String
  user      User    @relation("UserGarage", fields: [userId], references: [id], onDelete: Cascade)
  brand     String  // "Skoda"
  model     String  // "Octavia"
  year      Int?    // 2017
  vin       String? // TMBK1234567890123
  nickname  String? // "Moje Octávka"
  isDefault Boolean @default(false)
  createdAt DateTime @default(now())

  @@index([userId])
  @@unique([userId, vin]) // 1 VIN per user
}
```

Přidat na User:
```prisma
  garage CustomerGarage[] @relation("UserGarage")
```

---

## 2. API ROUTES

### POST /api/garage
**Auth:** přihlášený (BUYER nebo jakákoliv role)
**Body:** `{ brand, model, year?, vin?, nickname? }`
**Logika:**
1. Validace — brand + model povinné
2. Pokud VIN → NHTSA/vindecoder dekód → auto-fill brand/model/year
3. Max 5 aut per user
4. Create CustomerGarage

### GET /api/garage
**Auth:** přihlášený
**Response:** `{ cars: CustomerGarage[] }`

### DELETE /api/garage/[id]
**Auth:** přihlášený (owner)

### PUT /api/garage/[id]
**Auth:** přihlášený (owner)
**Body:** `{ isDefault: true }` — nastaví jako výchozí (reset ostatních)

---

## 3. UI

### 3a. Zákaznický účet — sekce "Moje garáž"
Stránka: `app/(web)/muj-ucet/garaz/page.tsx`
- Seznam uložených aut (brand + model + rok + VIN + nickname)
- "Přidat auto" formulář (brand→model→rok kaskádové selecty + VIN input)
- Smazat auto
- Nastavit výchozí

### 3b. Header eshopu — garage selector
V header dílů:
```
🚗 Octavia III 2017 ▼  |  Hledat díly...
```
Dropdown s uloženými auty + "Všechna auta" option. Vybrané auto filtruje celý katalog.

### 3c. Katalog integrace
Pokud je vybrané auto z garáže → automaticky přidat `brand` + `model` + `year` do API filtrů.
Query param: `/dily/katalog?garageCar=xxx` nebo cookie/localStorage.

---

## 4. COMMIT
```
feat: add customer garage (saved vehicles) with catalog auto-filter
```
