# Carmakler - Modul 2: Správa vozů & Workflow

## Přehled modulu

Core modul pro správu vozidel - přidávání, editace, schvalovací workflow a change log. Funguje identicky na webu i v PWA.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Databáze:** PostgreSQL + Prisma ORM
- **Upload obrázků:** Cloudinary nebo AWS S3
- **VIN dekodér:** NHTSA API / vlastní služba
- **Validace:** Zod

---

## Datový model

### Vehicle

```prisma
model Vehicle {
  id              String        @id @default(cuid())
  
  // Identifikace - VIN je SVATÝ, po uložení NELZE změnit
  vin             String        @unique
  vinLocked       Boolean       @default(false)
  
  // Základní údaje
  brand           String        // Škoda, VW, BMW...
  model           String        // Octavia, Golf, 320d...
  variant         String?       // RS, GTI, M Sport...
  year            Int           // Rok výroby
  mileage         Int           // Najeto km
  
  // Technické údaje
  fuelType        FuelType
  transmission    Transmission
  drivetrain      Drivetrain?   // FWD, RWD, AWD
  enginePower     Int?          // kW
  engineCapacity  Int?          // ccm
  bodyType        BodyType?
  color           String?
  colorInterior   String?
  
  // Stav a dokumenty
  condition       VehicleCondition
  stkValidUntil   DateTime?     // Platnost STK
  serviceBook     Boolean       @default(false)
  previousOwners  Int?
  countryOrigin   String?       // CZ, DE, SK...
  
  // Cena
  price           Int           // Cena v CZK
  priceNegotiable Boolean       @default(true)
  
  // Výbava (JSON pole)
  equipment       String[]      // ["Klima", "Tempomat", "LED světla"]
  
  // Popis
  description     String?       @db.Text
  
  // Status a workflow
  status          VehicleStatus @default(DRAFT)
  rejectionReason String?
  
  // Přiřazení
  brokerId        String?
  broker          User?         @relation(fields: [brokerId], references: [id])
  
  // Zdroj vozu
  source          VehicleSource @default(PRIVATE)
  sourceNote      String?       // Název autobazaru apod.
  
  // Lokace
  city            String
  address         String?
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  publishedAt     DateTime?
  soldAt          DateTime?
  
  // Vztahy
  images          VehicleImage[]
  changeLog       VehicleChangeLog[]
  brokerHistory   VehicleBrokerHistory[]
}

enum VehicleStatus {
  DRAFT           // Rozpracováno
  PENDING         // Čeká na schválení
  REJECTED        // Zamítnuto - vráceno k opravě
  ACTIVE          // Publikováno
  RESERVED        // Rezervace
  SOLD            // Prodáno
  ARCHIVED        // Archivováno
}

enum FuelType {
  PETROL
  DIESEL
  ELECTRIC
  HYBRID
  PLUGIN_HYBRID
  LPG
  CNG
}

enum Transmission {
  MANUAL
  AUTOMATIC
  DSG
  CVT
}

enum Drivetrain {
  FWD
  RWD
  AWD
}

enum BodyType {
  SEDAN
  HATCHBACK
  COMBI
  SUV
  COUPE
  CABRIO
  VAN
  PICKUP
}

enum VehicleCondition {
  NEW
  LIKE_NEW
  GOOD
  FAIR
  DAMAGED
}

enum VehicleSource {
  PRIVATE         // Soukromý prodejce
  DEALER          // Partnerský autobazar
  PLATFORM        // Z platformy (FÁZE 4)
}
```

### VehicleImage

```prisma
model VehicleImage {
  id          String   @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  
  url         String
  thumbnailUrl String?
  position    Int      @default(0)  // Pořadí
  isPrimary   Boolean  @default(false)
  
  createdAt   DateTime @default(now())
}
```

### VehicleChangeLog

```prisma
model VehicleChangeLog {
  id          String   @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  field       String   // "price", "mileage", "status"...
  oldValue    String?
  newValue    String?
  reason      String?  // Důvod změny (povinný pro některá pole)
  
  flagged     Boolean  @default(false)  // Automatický flag pro podezřelé změny
  flagReason  String?  // "Velká sleva > 10%"
  
  createdAt   DateTime @default(now())
}
```

### VehicleBrokerHistory

```prisma
model VehicleBrokerHistory {
  id          String   @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  
  brokerId    String
  broker      User     @relation(fields: [brokerId], references: [id])
  
  assignedAt  DateTime @default(now())
  removedAt   DateTime?
  reason      String?  // Důvod přeřazení
}
```

---

## VIN pravidla

### Klíčová pravidla

```
⚠️ VIN JE SVATÝ - NELZE ZMĚNIT PO ULOŽENÍ

1. Při vytvoření inzerátu:
   - Makléř zadá VIN
   - Systém validuje formát (17 znaků)
   - Systém kontroluje duplicitu
   - Po prvním uložení: vinLocked = true

2. Po uložení:
   - Pole VIN je readonly
   - Žádná role nemůže změnit VIN
   - Chce změnit VIN = musí vytvořit nový inzerát

3. Kontrola duplicity:
   - Před uložením: existuje tento VIN v systému?
   - Pokud ano: "Tento vůz již v systému existuje"
   - Odkaz na existující inzerát
```

### VIN dekodér

```javascript
// Automatické doplnění dat z VIN
async function decodeVin(vin: string) {
  // 1. Validace formátu
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
    throw new Error("Neplatný formát VIN");
  }
  
  // 2. Kontrola duplicity
  const existing = await prisma.vehicle.findUnique({ where: { vin } });
  if (existing) {
    throw new Error("Tento vůz již existuje v systému");
  }
  
  // 3. Dekódování (NHTSA API nebo vlastní)
  const decoded = await vinDecoder.decode(vin);
  
  return {
    brand: decoded.make,
    model: decoded.model,
    year: decoded.year,
    engineCapacity: decoded.engineCC,
    fuelType: mapFuelType(decoded.fuelType),
    bodyType: mapBodyType(decoded.bodyType),
  };
}
```

---

## Statusy a workflow

### Diagram workflow

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  DRAFT  │────▶│ PENDING │────▶│ ACTIVE  │
└─────────┘     └─────────┘     └─────────┘
     │               │               │
     │               │               ▼
     │               │          ┌─────────┐
     │               │          │RESERVED │
     │               │          └─────────┘
     │               │               │
     │               ▼               ▼
     │          ┌─────────┐     ┌─────────┐
     │          │REJECTED │     │  SOLD   │
     │          └─────────┘     └─────────┘
     │               │               │
     │               │               ▼
     │               │          ┌─────────┐
     └───────────────┴─────────▶│ARCHIVED │
                                └─────────┘
```

### Popis statusů

| Status | Vidí makléř | Na webu | Popis |
|--------|-------------|---------|-------|
| DRAFT | ✓ | ✗ | Rozpracovaný inzerát |
| PENDING | ✓ | ✗ | Odesláno ke schválení |
| REJECTED | ✓ | ✗ | Zamítnuto, čeká na opravu |
| ACTIVE | ✓ | ✓ | Publikováno, viditelné |
| RESERVED | ✓ | ✓ (označeno) | Vážný zájemce |
| SOLD | ✓ | ✗ | Prodáno |
| ARCHIVED | ✓ | ✗ | Archivováno |

---

## Pravidla změn a change log

### Co vyžaduje důvod

| Pole | Změna možná | Důvod povinný | Auto-flag |
|------|-------------|---------------|-----------|
| VIN | ❌ NIKDY | - | - |
| Cena | ✓ | ✓ | Sleva > 10% |
| Najeto (km) | ✓ | ✓ | Změna > 5000 km |
| Rok výroby | ✓ | ✓ | Vždy |
| Status | ✓ | ✓ | - |
| Fotky (smazání) | ✓ | ✗ | Smazáno > 3 |
| Fotky (přidání) | ✓ | ✗ | - |
| Popis | ✓ | ✗ | - |
| Výbava | ✓ | ✗ | - |

### Automatické flagy

```javascript
function checkForFlags(field: string, oldValue: any, newValue: any) {
  const flags = [];
  
  // Velká sleva
  if (field === 'price') {
    const discount = ((oldValue - newValue) / oldValue) * 100;
    if (discount > 10) {
      flags.push({
        reason: `Velká sleva: ${discount.toFixed(1)}%`,
        severity: discount > 20 ? 'HIGH' : 'MEDIUM'
      });
    }
  }
  
  // Velká změna km
  if (field === 'mileage') {
    const diff = Math.abs(newValue - oldValue);
    if (diff > 5000) {
      flags.push({
        reason: `Změna km o ${diff.toLocaleString()}`,
        severity: 'MEDIUM'
      });
    }
  }
  
  return flags;
}
```

---

## Schvalovací workflow

### Proces schválení

```
1. Makléř vytvoří inzerát (DRAFT)
   ↓
2. Makléř klikne "Odeslat ke schválení"
   - Status → PENDING
   - Notifikace pro BackOffice
   ↓
3. BackOffice kontrola
   - Kvalita fotek
   - Kompletnost údajů
   - Reálnost ceny
   - VIN validace
   ↓
4a. Schváleno
    - Status → ACTIVE
    - publishedAt = now()
    - Notifikace makléři
    
4b. Zamítnuto
    - Status → REJECTED
    - rejectionReason = "důvod"
    - Notifikace makléři
    ↓
5. (Pokud zamítnuto)
   - Makléř opraví
   - Znovu odešle ke schválení
```

### Důvody zamítnutí (předvolby)

```javascript
const rejectionReasons = [
  { id: 'photos_quality', label: 'Nedostatečná kvalita fotek' },
  { id: 'photos_count', label: 'Málo fotek (minimum 5)' },
  { id: 'missing_data', label: 'Chybí technické údaje' },
  { id: 'suspicious_price', label: 'Podezřelá cena' },
  { id: 'vin_mismatch', label: 'Neshoda VIN s údaji' },
  { id: 'stk_invalid', label: 'Neplatná STK' },
  { id: 'other', label: 'Jiné (napište důvod)' },
];
```

---

## API Endpoints

### Vozidla

```
GET    /api/vehicles                    # Seznam vozů (dle role)
GET    /api/vehicles/:id                # Detail vozu
POST   /api/vehicles                    # Vytvoření vozu
PUT    /api/vehicles/:id                # Úprava vozu
DELETE /api/vehicles/:id                # Smazání vozu

POST   /api/vehicles/:id/submit         # Odeslat ke schválení
POST   /api/vehicles/:id/approve        # Schválit (BackOffice)
POST   /api/vehicles/:id/reject         # Zamítnout (BackOffice)
POST   /api/vehicles/:id/reserve        # Rezervovat
POST   /api/vehicles/:id/sell           # Označit jako prodané
POST   /api/vehicles/:id/reassign       # Přeřadit makléři
```

### Obrázky

```
POST   /api/vehicles/:id/images         # Upload obrázků
DELETE /api/vehicles/:id/images/:imgId  # Smazat obrázek
PUT    /api/vehicles/:id/images/reorder # Změnit pořadí
```

### VIN

```
POST   /api/vin/decode                  # Dekódovat VIN
GET    /api/vin/check/:vin              # Kontrola duplicity
```

### Change log

```
GET    /api/vehicles/:id/changelog      # Historie změn vozu
GET    /api/changelog                   # Všechny změny (BackOffice)
GET    /api/changelog/flagged           # Pouze flagované změny
```

---

## Pool nepřiřazených vozů

### Kdy vůz jde do poolu

```
1. Makléř deaktivován → vozy do poolu
2. Vůz přidán z platformy (FÁZE 4)
3. Manuálně odebrán makléři
```

### Správa poolu

```
GET    /api/pool                        # Nepřiřazené vozy
POST   /api/pool/:vehicleId/assign      # Přiřadit makléři
POST   /api/pool/bulk-assign            # Hromadné přiřazení
```

---

## UI Komponenty

### Formulář přidání vozu

```
┌──────────────────────────────────────────────────────────────┐
│  NOVÝ INZERÁT                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  VIN*  [_________________] [Dekódovat]                       │
│        ℹ️ VIN nelze po uložení změnit                        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  ZÁKLADNÍ ÚDAJE (předvyplněno z VIN)                         │
│                                                              │
│  Značka*     [v Škoda      ▾]    Model*    [v Octavia    ▾]  │
│  Varianta    [RS____________]    Rok*      [v 2020      ▾]   │
│  Najeto km*  [85000_________]                                │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  TECHNICKÉ ÚDAJE                                             │
│                                                              │
│  Palivo*     [v Benzín     ▾]    Převodovka* [v DSG      ▾]  │
│  Výkon       [180__________] kW  Objem       [1984_____] ccm │
│  Karoserie   [v Combi      ▾]    Pohon       [v 4x4     ▾]   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  STAV A DOKUMENTY                                            │
│                                                              │
│  Stav*       [v Velmi dobrý▾]    STK do      [📅 12/2025  ]  │
│  Servisní kniha  ☑️              Počet majitelů  [2_____]    │
│  Země původu [v Česko      ▾]                                │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  CENA A LOKACE                                               │
│                                                              │
│  Cena*       [450000_______] Kč  ☑️ Cena k jednání           │
│  Město*      [v Praha      ▾]    Adresa     [Vinohradská 10] │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  FOTOGRAFIE                                      [+ Nahrát]  │
│                                                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                    │
│  │ 📷1 │ │ 📷2 │ │ 📷3 │ │ 📷4 │ │ 📷5 │  ... drag & drop   │
│  │ ⭐  │ │     │ │     │ │     │ │     │                    │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                    │
│  ⭐ = hlavní fotka                                           │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  VÝBAVA                                                      │
│                                                              │
│  ☑️ Klimatizace    ☑️ Tempomat     ☐ Adaptivní tempomat     │
│  ☑️ LED světla     ☐ Matrix LED    ☑️ Vyhřívaná sedadla     │
│  ☐ Panorama        ☑️ Navigace     ☑️ Parkovací senzory     │
│  ☐ Kamera 360°     ☑️ Zadní kamera ☐ Head-up display        │
│  ...                                                         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  POPIS                                                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Prodám krásnou Octavii RS v top stavu...            │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Uložit jako draft]        [Odeslat ke schválení]          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Modal změny ceny (s důvodem)

```
┌─────────────────────────────────────────────┐
│  ZMĚNA CENY                                 │
├─────────────────────────────────────────────┤
│                                             │
│  Původní cena:    450 000 Kč                │
│  Nová cena:       [420000_________] Kč      │
│                                             │
│  Změna:           -30 000 Kč (-6.7%)        │
│                                             │
│  Důvod změny*                               │
│  ┌─────────────────────────────────────┐   │
│  │ Zákazník smlouval, domluvili jsme   │   │
│  │ slevu za rychlý odběr               │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│  [Zrušit]                [Uložit změnu]     │
└─────────────────────────────────────────────┘
```

### BackOffice - Fronta ke schválení

```
┌──────────────────────────────────────────────────────────────────┐
│  KE SCHVÁLENÍ (12)                                    [Filtr ▾]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🚗 Škoda Octavia RS 2020                    čeká 2h 15min │ │
│  │    Jan Novák • Praha • 450 000 Kč                         │ │
│  │    Fotek: 12 ✓  VIN: ✓  STK: 12/2025 ✓                   │ │
│  │                                                            │ │
│  │    [Náhled]     [✓ Schválit]     [✗ Zamítnout]           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🚗 VW Golf GTI 2019                         čeká 45min    │ │
│  │    Petra Malá • Brno • 380 000 Kč                         │ │
│  │    Fotek: 4 ⚠️  VIN: ✓  STK: 03/2024 ⚠️                   │ │
│  │                                                            │ │
│  │    [Náhled]     [✓ Schválit]     [✗ Zamítnout]           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### BackOffice - Change log

```
┌──────────────────────────────────────────────────────────────────────────┐
│  CHANGE LOG                              [Jen flagované] [Dnes ▾]        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🚩 17.1. 14:32 • Jan Novák                                              │
│     Škoda Octavia RS • Cena: 450 000 → 380 000 Kč (-15.6%)              │
│     Důvod: "Zákazník dal nabídku, musíme reagovat na konkurenci"         │
│     [Zobrazit vůz]                                                       │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  17.1. 12:15 • Petra Malá                                               │
│     VW Golf • Přidány 3 fotky                                           │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  17.1. 10:44 • Jan Novák                                                │
│     BMW 320d • Status: Aktivní → Rezervace                              │
│     Důvod: "Vážný zájemce, schůzka v pátek"                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Poznámky pro vývojáře

1. **VIN je kritický** - dvojitá validace na frontendu i backendu, po uložení zamknout navždy.

2. **Change log zapisovat atomicky** - v jedné transakci s update vozu.

3. **Fotky optimalizovat** - thumbnail pro seznamy, komprese, max 10-15 fotek.

4. **Offline podpora (PWA)** - drafty ukládat lokálně, sync při připojení.

5. **Fulltext search** - připravit na vyhledávání přes brand, model, popis.
