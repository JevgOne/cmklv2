# Plan: Realistická seed data pro celou platformu

**Task:** #36
**Autor:** Plánovač
**Datum:** 2026-04-24

---

## SCHEMA REFERENCE PRO IMPLEMENTÁTORA

### Part (ř. 937-1016 schema.prisma)

```prisma
model Part {
  id          String   @id @default(cuid())
  slug        String   @unique          // URL slug, unikátní
  supplierId  String                    // FK → User
  category    String                    // ENGINE, TRANSMISSION, BRAKES, SUSPENSION, BODY,
                                        // ELECTRICAL, INTERIOR, WHEELS, EXHAUST, COOLING, FUEL, OTHER
  name        String
  description String?
  partNumber  String?                   // Interní číslo dílu
  oemNumber   String?                   // OE číslo výrobce
  manufacturer String?                  // "TRW", "Bosch", "LUK"
  warranty     String?                  // "24 měsíců", "zákonná"
  partType    String   @default("USED") // USED, NEW, AFTERMARKET
  condition   String                    // NEW, USED_GOOD, USED_FAIR, USED_POOR, REFURBISHED
  price       Int                       // CZK, celé číslo
  wholesalePrice Int?
  currency    String   @default("CZK")
  vatIncluded Boolean  @default(true)
  stock       Int      @default(1)
  weight      Float?                    // kg
  dimensions  String?
  compatibleBrands   String?            // JSON array: ["Škoda", "VW"]
  compatibleModels   String?            // JSON array: ["Octavia", "Golf"]
  compatibleYearFrom Int?
  compatibleYearTo   Int?
  universalFit       Boolean @default(false)
  status      String   @default("DRAFT") // DRAFT, ACTIVE, SOLD, INACTIVE
  viewCount   Int      @default(0)
  images      PartImage[]               // relace
}
```

### PartImage (ř. 1019-1030)
```prisma
model PartImage {
  id        String  @id @default(cuid())
  partId    String                      // FK → Part
  url       String                      // URL fotky
  order     Int     @default(0)         // Pořadí
  isPrimary Boolean @default(false)     // Hlavní fotka
}
```

### Listing (ř. 638-751)
```prisma
model Listing {
  id          String  @id @default(cuid())
  slug        String  @unique
  listingType String                    // PRIVATE, DEALER, BROKER
  userId      String                    // FK → User
  vehicleId   String? @unique           // Odkaz na Vehicle (pokud od makléře)
  vin         String?
  brand       String
  model       String
  variant     String?
  year        Int
  mileage     Int
  fuelType    String                    // PETROL, DIESEL, ELECTRIC, HYBRID, PLUGIN_HYBRID, LPG, CNG
  transmission String                   // MANUAL, AUTOMATIC, DSG, CVT
  enginePower  Int?
  engineCapacity Int?
  bodyType    String?                   // SEDAN, HATCHBACK, COMBI, SUV, COUPE, CABRIO, VAN, PICKUP
  color       String?
  doorsCount  Int?
  seatsCount  Int?
  drivetrain  String?                   // FRONT, REAR, 4x4
  condition   String                    // NEW, LIKE_NEW, EXCELLENT, GOOD, FAIR, DAMAGED
  serviceBook Boolean? @default(false)
  stkValidUntil DateTime?
  ownerCount  Int?
  originCountry String?
  price       Int
  priceNegotiable Boolean @default(true)
  vatStatus   String?                   // DEDUCTIBLE, NON_DEDUCTIBLE, MARGIN_SCHEME
  contactName  String
  contactPhone String
  contactEmail String?
  city         String
  district     String?
  description  String?
  equipment    String?                  // JSON array
  highlights   String?                  // JSON array
  status       String  @default("DRAFT") // DRAFT, ACTIVE, INACTIVE, SOLD, EXPIRED
  isPremium    Boolean @default(false)
  listingTier  String  @default("PRIVATE") // PRIVATE, ADVERTISER, PARTNER
  viewCount    Int     @default(0)
  images       ListingImage[]
}
```

### ListingImage (ř. 753-764)
```prisma
model ListingImage {
  id        String  @id @default(cuid())
  listingId String
  url       String
  order     Int     @default(0)
  isPrimary Boolean @default(false)
}
```

### FlipOpportunity (ř. 1281-1324)
```prisma
model FlipOpportunity {
  id       String @id @default(cuid())
  dealerId String                       // FK → User (VERIFIED_DEALER)
  brand     String
  model     String
  year      Int
  mileage   Int
  vin       String?
  condition String                      // NEW, LIKE_NEW, EXCELLENT, GOOD, FAIR, DAMAGED
  photos    String?                     // JSON array of URLs
  purchasePrice      Int
  repairCost         Int
  estimatedSalePrice Int
  repairDescription String?
  repairPhotos      String?             // JSON array of URLs
  actualSalePrice   Int?
  soldAt            DateTime?
  status    String @default("PENDING_APPROVAL")
  // PENDING_APPROVAL, APPROVED, FUNDING, FUNDED, IN_REPAIR, FOR_SALE, SOLD, PAYOUT_PENDING, COMPLETED, CANCELLED
  fundedAmount Int @default(0)
  adminNotes   String?
  investments  Investment[]
}
```

### Investment (ř. 1326-1348)
```prisma
model Investment {
  id            String @id @default(cuid())
  investorId    String                  // FK → User (INVESTOR)
  opportunityId String                  // FK → FlipOpportunity
  amount        Int
  paymentStatus String @default("PENDING") // PENDING, CONFIRMED, REFUNDED
  paymentReference String?
  returnAmount  Int?                    // Výplata (vklad + podíl na zisku)
  paidOutAt     DateTime?
}
```

### Kategorie dílů (z `lib/validators/parts.ts`):
```ts
const partCategories = [
  "ENGINE",        // Motor
  "TRANSMISSION",  // Převodovka
  "BRAKES",        // Brzdy
  "SUSPENSION",    // Podvozek/Tlumení
  "BODY",          // Karoserie
  "ELECTRICAL",    // Elektrika
  "INTERIOR",      // Interiér
  "WHEELS",        // Kola/Pneumatiky
  "EXHAUST",       // Výfuk
  "COOLING",       // Chlazení
  "FUEL",          // Palivový systém
  "OTHER",         // Ostatní
];
```

### Existující seed users (pro reference ID):
```
supplier1  → "dodavatel@vrakoviste.cz"   (PARTS_SUPPLIER, "Vrakoviště Praha s.r.o.")
supplier2  → "dodavatel2@autodily.cz"    (PARTS_SUPPLIER, "AutoDíly Brno")
wholesale1 → "velkoobchod@carmakler.cz"  (WHOLESALE_SUPPLIER, "Auto Kelly Test s.r.o.")
advertiser1 → "prodejce@email.cz"        (accountType: PRIVATE)
advertiser2 → "autobazar@email.cz"       (accountType: DEALER, "Autobazar Královo Pole")
buyer1     → "kupujici@email.cz"         (BUYER)
dealer1    → "dealer1@carmakler.cz"      (VERIFIED_DEALER, "AutoFlip Praha")
dealer2    → "dealer2@carmakler.cz"      (VERIFIED_DEALER, "Car Investment Brno")
investor1  → "investor1@carmakler.cz"    (INVESTOR, Petr Svoboda)
investor2  → "investor2@carmakler.cz"    (INVESTOR, Jana Králová)
investor3  → "investor3@carmakler.cz"    (INVESTOR, Lukáš Dvořák)
```

### Photo URL formát (CSP-safe):
```
Unsplash: https://images.unsplash.com/photo-{ID}?w={width}&q=80
Placeholder: https://placehold.co/{w}x{h}/{bg}/{fg}?text={text}
```

---

## ANALÝZA STÁVAJÍCÍHO STAVU

**Parts (11 total, 0 images):**
- ENGINE(3), BRAKES(2), SUSPENSION(2), ELECTRICAL(2), BODY(1), INTERIOR(1)
- Chybí: TRANSMISSION, WHEELS, EXHAUST, COOLING, FUEL, OTHER
- ŽÁDNÉ PartImage záznamy
- Všechny status=ACTIVE (chybí INACTIVE/SOLD)

**Listings (5 total, 9 images):**
- 3× PRIVATE, 2× DEALER — chybí BAZAAR
- Všechny ACTIVE/DRAFT — chybí SOLD/EXPIRED

**Marketplace (4 flips, 6 investments):**
- PENDING_APPROVAL, FUNDING, IN_REPAIR, COMPLETED — chybí FOR_SALE
- Fotky jsou placehold.co (nerealistické)

---

## IMPLEMENTAČNÍ PLÁN

### Přístup: Nový samostatný seed script

**Nový soubor:** `prisma/seed-test-data.ts`

Spuštění: `npx tsx prisma/seed-test-data.ts`

Script bude **additivní** (přidá data, nemaže existující). Použije `prisma.*.upsert` nebo `create` s try/catch pro idempotenci.

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "postgresql://zen@localhost:5432/carmakler";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("heslo123", 12);
  // ... seed logic
}
```

---

### Sekce 1: ESHOP DÍLŮ — 24+ dílů pokrývající všech 12 kategorií

**1a) PartImage pro existujících 11 dílů:**

Najít existující díly přes slug a přidat fotky:
```ts
const existingParts = await prisma.part.findMany({
  where: { images: { none: {} } }, // díly bez fotek
  select: { id: true, slug: true, category: true },
});
for (const part of existingParts) {
  await prisma.partImage.create({
    data: {
      partId: part.id,
      url: getPhotoForCategory(part.category),
      order: 0,
      isPrimary: true,
    },
  });
}
```

**1b) 14 nových dílů (2 per chybějící kategorie + extra BODY + INTERIOR):**

| # | Slug | Kategorie | Název | OEM/PN | Cena | Cond | Brands | Models | Year |
|---|------|-----------|-------|--------|------|------|--------|--------|------|
| 1 | `prevodovka-dsg-dq200` | TRANSMISSION | Převodovka DSG DQ200 7st. | 0AM 300 048 S | 28 000 | USED_GOOD | Škoda, VW | Octavia, Golf | 2013-2020 |
| 2 | `spojkovy-set-luk-repset` | TRANSMISSION | Spojkový set LUK RepSet | 624 3944 09 | 4 890 | NEW | Škoda, VW, Audi | Octavia, Golf, A3 | 2012-2024 |
| 3 | `alu-kolo-r18-superb` | WHEELS | Alu kolo R18 Trinity Superb | 3V0 601 025 G | 3 200 | USED_GOOD | Škoda | Superb | 2015-2023 |
| 4 | `zimni-sada-r16-golf` | WHEELS | Zimní sada 4ks R16 + pneu | — | 8 900 | USED_FAIR | VW | Golf, Touran | 2013-2020 |
| 5 | `katalyzator-1-6-tdi` | EXHAUST | Katalyzátor 1.6 TDI | 04L 131 765 BH | 5 500 | USED_GOOD | Škoda, VW | Octavia, Golf | 2014-2020 |
| 6 | `vyfukove-potrubi-stredni-octavia` | EXHAUST | Výfukové potrubí střední díl | 5E0 253 409 A | 1 800 | USED_FAIR | Škoda | Octavia | 2013-2020 |
| 7 | `chladic-vody-octavia-iii` | COOLING | Chladič vody Octavia III | 5Q0 121 251 ES | 2 400 | USED_GOOD | Škoda, VW | Octavia, Golf | 2013-2020 |
| 8 | `vodni-pumpa-2-0-tdi-ina` | COOLING | Vodní pumpa 2.0 TDI INA | 538 0696 10 | 1 690 | NEW | Škoda, VW, Audi | Octavia, Passat, A4 | 2015-2024 |
| 9 | `palivove-cerpadlo-2-0-tdi` | FUEL | Palivové čerpadlo v nádrži | 5Q0 919 050 AJ | 3 800 | USED_GOOD | Škoda, VW | Octavia, Golf | 2013-2020 |
| 10 | `vstrikovaci-ventil-bosch-tdi` | FUEL | Vstřikovací ventil Bosch CR | 0 445 110 469 | 2 290 | NEW (AFTERMARKET) | VW, Audi | Passat, A4 | 2015-2022 |
| 11 | `autoradio-rcd-330-plus` | OTHER | Autorádio RCD 330 Plus | 6RD 035 187 B | 4 500 | USED_GOOD | VW, Škoda | Golf, Octavia | 2013-2020 |
| 12 | `sada-klicu-ridici-jednotka-octavia` | OTHER | Sada klíčů s řídící jednotkou | — | 6 800 | USED_GOOD | Škoda | Octavia | 2013-2020 |
| 13 | `kapota-predni-octavia-iii` | BODY | Kapota přední Octavia III | 5E0 823 031 A | 3 800 | USED_GOOD | Škoda | Octavia | 2013-2020 |
| 14 | `palubni-deska-golf-vii` | INTERIOR | Palubní deska komplet Golf VII | 5G1 857 003 G | 5 200 | USED_FAIR | VW | Golf | 2013-2020 |

Každý díl bude mít:
- Realistický český popis (2-3 věty: co to je, odkud, stav)
- `supplierId`: střídavě supplier1 / supplier2 (lookup přes email)
- `partType`: "USED" pro použité, "NEW" nebo "AFTERMARKET" pro nové
- `stock`: 1 pro použité, 5-30 pro nové
- `viewCount`: náhodně 10-200
- 1× `PartImage` s URL

**1c) 2 díly s nestandardním statusem:**

```ts
// INACTIVE — deaktivovaný dodavatelem
{ slug: "naraznik-zadni-octavia-neaktivni", category: "BODY", name: "Nárazník zadní Octavia III",
  price: 2800, condition: "USED_FAIR", status: "INACTIVE", stock: 1 }

// SOLD — prodaný
{ slug: "turbo-1-9-tdi-prodano", category: "ENGINE", name: "Turbodmychadlo 1.9 TDI ALH",
  price: 8500, condition: "USED_GOOD", status: "SOLD", stock: 0 }
```

---

### Sekce 2: INZERCE — 4 nové inzeráty

**2a) Nový BAZAAR uživatel:**
```ts
const bazaarUser = await prisma.user.upsert({
  where: { email: "bazaar@email.cz" },
  update: {},
  create: {
    email: "bazaar@email.cz",
    firstName: "Martin",
    lastName: "Bazarový",
    passwordHash,
    role: "BROKER",
    accountType: "BAZAAR",
    companyName: "Auto Martin Bazaar",
    ico: "55667788",
    icoVerified: true,
    status: "ACTIVE",
  },
});
```

**2b) Inzeráty:**

| # | Slug | Type | User | Brand/Model | Year | km | Fuel | Trans | Body | Cena | Status | Highlights |
|---|------|------|------|-------------|------|----|------|-------|------|------|--------|------------|
| 1 | `hyundai-tucson-2020-bazaar` | DEALER | bazaarUser | Hyundai Tucson | 2020 | 58k | PETROL | AUTOMATIC | SUV | 520 000 | ACTIVE | 1.6 T-GDI, záruka |
| 2 | `toyota-corolla-hybrid-2021` | DEALER | bazaarUser | Toyota Corolla | 2021 | 34k | HYBRID | CVT | SEDAN | 435 000 | ACTIVE | Hybrid, servisní knížka |
| 3 | `vw-polo-2018-prodano` | PRIVATE | advertiser1 | VW Polo | 2018 | 92k | PETROL | MANUAL | HATCHBACK | 195 000 | SOLD | Prodáno přes CarMakléř |
| 4 | `citroen-c4-2019-expirovan` | PRIVATE | advertiser1 | Citroën C4 | 2019 | 67k | DIESEL | AUTOMATIC | HATCHBACK | 289 000 | EXPIRED | expiresAt v minulosti |

Každý s:
- Realistickým popisem (CZ, 2-3 věty jako by psal inzerent)
- Equipment JSON array (6-10 položek)
- Highlights JSON array (3 položky)
- 2× ListingImage (Unsplash URLs)
- Kontaktní údaje konzistentní s userem

---

### Sekce 3: MARKETPLACE — 1 nový flip + vylepšení fotek

**3a) FOR_SALE flip:**

```ts
{
  dealerId: dealer1.id, // lookup přes email
  brand: "Škoda",
  model: "Superb",
  year: 2017,
  mileage: 110000,
  vin: "3V3AE31P5HM012345",
  condition: "GOOD",
  photos: JSON.stringify([...2 Unsplash URLs...]),
  purchasePrice: 280000,
  repairCost: 55000,
  estimatedSalePrice: 430000,
  repairDescription: "Kompletní rozvodový set, nové přední brzdy, lakování 2 dílů, kompletní detailing interiéru + motorového prostoru",
  repairPhotos: JSON.stringify([...1-2 Unsplash URLs...]),
  status: "FOR_SALE",
  fundedAmount: 335000,
}
```

S 2 investicemi (investor1: 200k CONFIRMED, investor3: 135k CONFIRMED).

**3b) Nahradit placehold.co v existujících flips:**

```ts
// Update existujících flip photos na Unsplash
await prisma.flipOpportunity.updateMany({
  where: { photos: { contains: "placehold.co" } },
  data: {
    photos: JSON.stringify([
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80",
    ]),
  },
});
```

Pozor: `updateMany` nastaví STEJNÉ fotky na všechny — lepší je update per-flip s unikátními fotkami.

---

## SOUBORY K EDITACI/VYTVOŘIT

| # | Soubor | Akce | Popis |
|---|--------|------|-------|
| 1 | `prisma/seed-test-data.ts` | **CREATE** | Nový additivní seed script (~400 řádků) |

**Spuštění:** `npx tsx prisma/seed-test-data.ts`

---

## SOUHRNNÁ TABULKA — CO SE PŘIDÁ

| Oblast | Stávající | Nové | Celkem |
|--------|-----------|------|--------|
| Parts | 11 | +16 | 27 |
| PartImages | 0 | +27 | 27 |
| Users | 20+ | +1 (BAZAAR) | 21+ |
| Listings | 5 | +4 | 9 |
| ListingImages | 9 | +8 | 17 |
| FlipOpportunities | 4 | +1 | 5 |
| Investments | 6 | +2 | 8 |

---

## ACCEPTANCE CRITERIA

### Eshop dílů:
- [ ] Každá z 12 kategorií má min. 2 díly
- [ ] Každý díl má min. 1 PartImage s funkční URL
- [ ] Mix condition: NEW, USED_GOOD, USED_FAIR
- [ ] Mix partType: USED, NEW, AFTERMARKET
- [ ] Min. 1 díl INACTIVE, 1 díl SOLD
- [ ] Realistické české popisy, OEM čísla, ceny
- [ ] compatibleBrands/Models vyplněné jako JSON arrays

### Inzerce:
- [ ] Min. 1 listing od BAZAAR accountType uživatele
- [ ] Min. 1 listing se status SOLD
- [ ] Min. 1 listing se status EXPIRED (expiresAt v minulosti)
- [ ] ListingImages pro všechny nové listings
- [ ] Mix listingType: PRIVATE + DEALER + BAZAAR (via DEALER type s BAZAAR user)

### Marketplace:
- [ ] FOR_SALE status flip existuje s repairPhotos
- [ ] Investice pro FOR_SALE flip
- [ ] placehold.co URLs nahrazené za Unsplash v existujících flips

### Obecné:
- [ ] `npx tsx prisma/seed-test-data.ts` proběhne bez chyb
- [ ] Script je idempotentní (opakované spuštění nezduplikuje data)
- [ ] Žádné duplicitní slugy (použít upsert nebo where-check)
- [ ] TypeScript compile OK
- [ ] Fotky se zobrazují v UI (CSP-safe URLs)

## STOP PRAVIDLA

- **STOP-1:** Pokud Unsplash URL vrací 404 → použít `placehold.co/600x400/e5e7eb/6b7280?text=Nazev+Dilu` jako fallback
- **STOP-2:** Pokud seed selže na unique constraint → přidat try/catch nebo upsert pattern

## POZNÁMKY PRO IMPLEMENTÁTORA

1. **Lookup existujících users:** Script musí najít existující suppliéry/dealery/investory přes `prisma.user.findUnique({ where: { email: "..." } })`. Nepoužívat hardcoded ID.

2. **Unsplash fotky:** Formát `https://images.unsplash.com/photo-{ID}?w=600&q=80`. Najít fotky odpovídající dílům. Pro auto exteriéry existuje mnoho fotek — vyhledej na unsplash.com "car parts", "car engine", "brake disc" atd.

3. **Ceny dílů — realismus:**
   - Použité dveře: 3-6k
   - Použitý motor: 30-60k
   - Použité turbo: 8-15k
   - Nové brzdové destičky (aftermarket): 500-1500
   - Nový tlumič (aftermarket): 1500-3000
   - Použitá převodovka: 15-35k
   - Nové olejové filtry: 100-300

4. **OEM formáty:**
   - VW Group: `XXX XXX XXX X` (např. `5E0 823 031 A`)
   - BMW: `XX XX X XXX XXX` (např. `63 11 7 419 630`)
   - Aftermarket: `BRAND-NUMBER` (např. `GDB1955`, `HU 7020 z`)

5. **Listing popisy — tone of voice:**
   - Soukromý: "Prodám XY, 1. majitel, garáž, nekuřácké. Servisní knížka, vše v pořádku. Možnost financování."
   - Bazaar: "Nabízíme XY ve výborném stavu. Vůz prošel kompletní kontrolou v našem servisu. Možnost protiúčtu."
   - Dealer: Formálnější, s DPH info

## ODHAD

- **Složitost:** Střední (1 nový soubor, ~400 řádků)
- **Risk:** Minimální — development-only data, žádný produkční impact
