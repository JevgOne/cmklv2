# Carmakler - Modul 1: Autentizace & Role

## Přehled modulu

Základní modul pro správu uživatelů, autentizaci a hierarchii rolí. Tento modul je prerekvizitou pro všechny ostatní moduly.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Autentizace:** NextAuth.js nebo Clerk
- **Databáze:** PostgreSQL + Prisma ORM
- **Validace:** Zod
- **UI:** Tailwind CSS + shadcn/ui

---

## Hierarchie rolí

```
ADMIN
  │
  ├── BACKOFFICE
  │
  └── REGIONAL_DIRECTOR
        │
        └── MANAGER
              │
              └── BROKER (Makléř)
```

### Popis rolí

| Role | Kód | Popis |
|------|-----|-------|
| Administrátor | `ADMIN` | Plný přístup, nastavení systému, finance |
| BackOffice | `BACKOFFICE` | Schvalování inzerátů, operativa, podpora |
| Regionální ředitel | `REGIONAL_DIRECTOR` | Správa regionu, týmy manažerů |
| Manažer | `MANAGER` | Vedení týmu 5-6 makléřů, může mít vlastní vozy |
| Makléř | `BROKER` | Správa vozů, prodeje, provize |

---

## Datový model

### User

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  phone             String?
  passwordHash      String
  
  // Profil
  firstName         String
  lastName          String
  avatar            String?
  bio               String?
  
  // Role a hierarchie
  role              Role      @default(BROKER)
  status            UserStatus @default(PENDING)
  
  // Vztahy v hierarchii
  managerId         String?
  manager           User?     @relation("ManagerToBroker", fields: [managerId], references: [id])
  teamMembers       User[]    @relation("ManagerToBroker")
  
  regionId          String?
  region            Region?   @relation(fields: [regionId], references: [id])
  
  // Specializace (pro makléře)
  specializations   String[]  // ["SUV", "Luxury", "Dodávky"]
  cities            String[]  // ["Praha", "Brno"]
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastLoginAt       DateTime?
  
  // Vztahy
  vehicles          Vehicle[]
  reviews           Review[]
  commissions       Commission[]
}

enum Role {
  ADMIN
  BACKOFFICE
  REGIONAL_DIRECTOR
  MANAGER
  BROKER
}

enum UserStatus {
  PENDING      // Čeká na schválení
  ACTIVE       // Aktivní
  SUSPENDED    // Pozastaven
  INACTIVE     // Neaktivní/odešel
}
```

### Region

```prisma
model Region {
  id          String   @id @default(cuid())
  name        String   // "Čechy", "Morava", "Praha"
  cities      String[] // Seznam měst v regionu
  
  directorId  String?
  director    User?    @relation("RegionDirector", fields: [directorId], references: [id])
  
  users       User[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Matice oprávnění

| Funkce | ADMIN | BACKOFFICE | REG_DIRECTOR | MANAGER | BROKER |
|--------|-------|------------|--------------|---------|--------|
| Nastavení systému | ✓ | ✗ | ✗ | ✗ | ✗ |
| Správa všech uživatelů | ✓ | ✗ | ✗ | ✗ | ✗ |
| Finance/výplaty - vše | ✓ | Náhled | ✗ | ✗ | ✗ |
| Finance - svůj region | ✓ | Náhled | ✓ | ✗ | ✗ |
| Finance - svůj tým | ✓ | Náhled | ✓ | ✓ | ✗ |
| Finance - svoje | ✓ | ✗ | ✓ | ✓ | ✓ |
| Schvalování inzerátů | ✓ | ✓ | ✗ | ✗ | ✗ |
| Schválení nového makléře | ✓ | ✓ | ✓ | ✗ | ✗ |
| Správa uživatelů - region | ✓ | ✗ | ✓ | ✗ | ✗ |
| Správa uživatelů - tým | ✓ | ✗ | ✓ | ✓ | ✗ |
| Přeřazení vozů - vše | ✓ | ✓ | ✗ | ✗ | ✗ |
| Přeřazení vozů - region | ✓ | ✓ | ✓ | ✗ | ✗ |
| Přeřazení vozů - tým | ✓ | ✓ | ✓ | ✓ | ✗ |
| Statistiky - vše | ✓ | ✓ | ✗ | ✗ | ✗ |
| Statistiky - region | ✓ | ✓ | ✓ | ✗ | ✗ |
| Statistiky - tým | ✓ | ✓ | ✓ | ✓ | ✗ |
| Statistiky - svoje | ✓ | ✗ | ✓ | ✓ | ✓ |
| Vlastní vozy CRUD | ✓ | ✗ | ✗ | ✓ | ✓ |
| Vlastní profil | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## API Endpoints

### Autentizace

```
POST   /api/auth/register          # Registrace nového makléře
POST   /api/auth/login             # Přihlášení
POST   /api/auth/logout            # Odhlášení
POST   /api/auth/forgot-password   # Reset hesla
POST   /api/auth/refresh           # Refresh tokenu
GET    /api/auth/me                # Aktuální uživatel
```

### Správa uživatelů

```
GET    /api/users                  # Seznam uživatelů (dle role)
GET    /api/users/:id              # Detail uživatele
PUT    /api/users/:id              # Úprava uživatele
DELETE /api/users/:id              # Smazání/deaktivace
POST   /api/users/:id/approve      # Schválení makléře
POST   /api/users/:id/suspend      # Pozastavení
POST   /api/users/:id/reassign     # Přeřazení pod jiného manažera
```

### Regiony

```
GET    /api/regions                # Seznam regionů
POST   /api/regions                # Vytvoření regionu (ADMIN)
PUT    /api/regions/:id            # Úprava regionu
GET    /api/regions/:id/users      # Uživatelé v regionu
```

---

## Workflow registrace makléře

```
1. Makléř vyplní registrační formulář
   - Email, telefon, heslo
   - Jméno, příjmení
   - Město/region působnosti
   - Specializace (volitelné)
   
2. Status = PENDING
   - Notifikace pro BackOffice/Admin

3. BackOffice kontrola
   - Ověření údajů
   - Případný telefonát
   
4. Schválení/Zamítnutí
   - Schváleno → Status = ACTIVE, přiřazení k manažerovi
   - Zamítnuto → Email s důvodem

5. Přiřazení do struktury
   - Automaticky dle regionu, nebo
   - Manuálně BackOffice/Manažer
```

---

## Workflow deaktivace makléře

```
1. Admin/BackOffice klikne "Deaktivovat"

2. Systém zjistí počet aktivních vozů

3. Modal s možnostmi:
   a) "Makléř má X aktivních vozů"
   b) Možnosti:
      - Hromadně přiřadit jinému makléři
      - Rozdělit mezi více makléřů
      - Přesunout do poolu (nepřiřazené)

4. Po vyřešení vozů:
   - Status = INACTIVE
   - Profil skryt z webu
   - Statistiky zachovány (historie)
```

---

## UI Komponenty

### Registrační formulář (PWA + Web)

```
┌─────────────────────────────────────┐
│  REGISTRACE MAKLÉŘE                 │
├─────────────────────────────────────┤
│  Email*          [____________]     │
│  Telefon*        [____________]     │
│  Heslo*          [____________]     │
│  Heslo znovu*    [____________]     │
├─────────────────────────────────────┤
│  Jméno*          [____________]     │
│  Příjmení*       [____________]     │
├─────────────────────────────────────┤
│  Město působnosti*                  │
│  [v Praha        ▾]                 │
│                                     │
│  Specializace (volitelné)           │
│  ☐ SUV  ☐ Luxury  ☐ Dodávky        │
│  ☐ Elektro  ☐ Veterány             │
├─────────────────────────────────────┤
│  ☐ Souhlasím s obchodními podmínkami│
│                                     │
│  [    REGISTROVAT    ]              │
└─────────────────────────────────────┘
```

### Admin - Správa uživatelů

```
┌──────────────────────────────────────────────────────────────┐
│  SPRÁVA UŽIVATELŮ                          [+ Nový uživatel] │
├──────────────────────────────────────────────────────────────┤
│  Filtr: [Všechny role ▾] [Všechny statusy ▾] [Hledat___]    │
├──────────────────────────────────────────────────────────────┤
│  ┌────┬──────────────┬──────────┬────────┬────────┬───────┐ │
│  │    │ Jméno        │ Role     │ Region │ Status │ Akce  │ │
│  ├────┼──────────────┼──────────┼────────┼────────┼───────┤ │
│  │ 🟡 │ Jan Novák    │ Makléř   │ Praha  │ Pending│ [···] │ │
│  │ 🟢 │ Petra Malá   │ Makléř   │ Brno   │ Active │ [···] │ │
│  │ 🟢 │ Karel Dvořák │ Manažer  │ Praha  │ Active │ [···] │ │
│  └────┴──────────────┴──────────┴────────┴────────┴───────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Modal - Deaktivace makléře

```
┌─────────────────────────────────────────────┐
│  ⚠️ DEAKTIVACE MAKLÉŘE                      │
├─────────────────────────────────────────────┤
│  Makléř: Jan Novák                          │
│  Aktivní vozy: 8                            │
│                                             │
│  Co s aktivními vozy?                       │
│                                             │
│  ○ Přiřadit všechny jednomu makléři         │
│    [Vyberte makléře ▾]                      │
│                                             │
│  ○ Rozdělit mezi více makléřů               │
│    [Vybrat vozy jednotlivě]                 │
│                                             │
│  ○ Přesunout do poolu (nepřiřazené)         │
│                                             │
├─────────────────────────────────────────────┤
│  [Zrušit]              [Potvrdit deaktivaci]│
└─────────────────────────────────────────────┘
```

---

## Bezpečnostní požadavky

1. **Hesla**
   - Minimum 8 znaků
   - Hash: bcrypt nebo Argon2
   - Rate limiting na login (5 pokusů / 15 min)

2. **Session**
   - JWT s refresh tokenem
   - Access token: 15 min
   - Refresh token: 7 dní
   - Invalidace při změně hesla

3. **Role-based access**
   - Middleware pro kontrolu role
   - API routes chráněné dle matice oprávnění

4. **Audit log**
   - Logovat všechny citlivé akce
   - Kdo, kdy, co změnil

---

## Poznámky pro vývojáře

1. Systém musí být připraven na růst - role REGIONAL_DIRECTOR a hierarchie regionů implementovat od začátku, i když se nebudou hned používat.

2. Manažer i Regionální ředitel mohou mít vlastní vozy - nejsou pouze administrativní role.

3. Přeřazování vozů při deaktivaci makléře je kritická funkce - musí být bulletproof.

4. Všechny změny v hierarchii logovat do audit logu.
