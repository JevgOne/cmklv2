# Carmakler - Modul 7: Integrace & Externí systémy

## Přehled modulu

Napojení na externí služby - vaše appka s čísly prodejců, VIN dekodér, pojištění, leasing, export na portály, lokace vozů.

---

## Integrace přehled

```
┌─────────────────────────────────────────────────────────────────┐
│                         CARMAKLER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  VSTUPY                           VÝSTUPY                       │
│  ───────                          ────────                      │
│                                                                 │
│  📱 Vaše appka s čísly  ─────────▶  🌐 Sauto.cz                │
│     prodejců (leady)                📤 Export inzerátů          │
│                                                                 │
│  🔍 VIN dekodér         ─────────▶  🌐 TipCars.com             │
│     (NHTSA / vlastní)               📤 Export inzerátů          │
│                                                                 │
│  🗺️ Mapy.cz API        ─────────▶  💰 Pojišťovny              │
│     (geolokace vozů)                (affiliate)                 │
│                                                                 │
│  📧 Email (Resend)      ─────────▶  🏦 Leasing                 │
│  📱 SMS brána                       (affiliate)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Integrace s vaší appkou (čísla prodejců)

### API Endpoint pro příjem leadů

```javascript
// POST /api/external/leads
// Authorization: Bearer {API_KEY}

interface IncomingLead {
  source: string;           // "app-prodejci"
  sourceId: string;         // ID v původním systému
  
  // Kontakt
  phone: string;            // Povinné
  name?: string;
  email?: string;
  
  // Vůz
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  price?: number;
  
  // Lokace
  city?: string;
  region?: string;
  
  description?: string;
  createdAt: string;
}
```

### Datový model Lead

```prisma
model Lead {
  id              String      @id @default(cuid())
  
  source          LeadSource
  externalId      String?
  
  phone           String
  name            String?
  email           String?
  
  brand           String?
  model           String?
  year            Int?
  mileage         Int?
  expectedPrice   Int?
  
  city            String?
  regionId        String?
  region          Region?     @relation(fields: [regionId], references: [id])
  
  assignedToId    String?
  assignedTo      User?       @relation(fields: [assignedToId], references: [id])
  assignedAt      DateTime?
  
  status          LeadStatus  @default(NEW)
  
  vehicleId       String?
  vehicle         Vehicle?    @relation(fields: [vehicleId], references: [id])
  
  notes           LeadNote[]
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

enum LeadSource {
  APP_PRODEJCI
  WEBSITE
  PHONE
  PARTNER
  OTHER
}

enum LeadStatus {
  NEW
  ASSIGNED
  CONTACTED
  IN_PROGRESS
  CONVERTED
  LOST
  INVALID
}
```

---

## 2. Lokace vozu - detailní specifikace

### Datový model (rozšíření Vehicle)

```prisma
model Vehicle {
  // ... existující pole
  
  // Lokace
  city            String          // Město (povinné)
  district        String?         // Městská část (Praha 4)
  address         String?         // Ulice (pouze interní)
  zipCode         String?
  
  // Souřadnice (pro mapu)
  latitude        Float?
  longitude       Float?
  locationPrecision LocationPrecision @default(CITY)
  
  // Místo prohlídky
  viewingLocation ViewingLocationType @default(BROKER_LOCATION)
  viewingNote     String?
  
  // Partnerské místo
  partnerLocationId String?
  partnerLocation   PartnerLocation? @relation(fields: [partnerLocationId], references: [id])
}

enum LocationPrecision {
  EXACT           // Přesná (nezobrazovat veřejně!)
  DISTRICT        // Městská část
  CITY            // Pouze město
}

enum ViewingLocationType {
  BROKER_LOCATION // U makléře
  PARTNER_DEALER  // V partnerském bazaru
  SELLER_LOCATION // U prodávajícího
  FLEXIBLE        // Dle dohody
}

model PartnerLocation {
  id          String   @id @default(cuid())
  
  name        String          // "Autobazar TopCar"
  type        String          // "autobazar", "servis"
  
  address     String
  city        String
  zipCode     String
  
  latitude    Float
  longitude   Float
  
  phone       String?
  email       String?
  openingHours Json?
  
  isActive    Boolean  @default(true)
  vehicles    Vehicle[]
  
  createdAt   DateTime @default(now())
}
```

### Pravidla zobrazení lokace

```
VEŘEJNĚ VIDITELNÉ (web, seznam vozů):
─────────────────────────────────────
✓ Město: "Praha"
✓ Městská část: "Praha 4 - Nusle"
✓ Partnerské místo: "Autobazar TopCar"
✗ Přesná adresa: NIKDY

MAPA:
─────
✓ Přibližná lokace (střed městské části)
✓ Radius/kruh místo špendlíku
✗ Přesná poloha

PO KONTAKTU S MAKLÉŘEM:
───────────────────────
✓ Přesná adresa pro prohlídku
✓ Navigace
```

### Mapy.cz API

```javascript
const MAPY_API_KEY = process.env.MAPY_CZ_API_KEY;

// Geocoding - adresa na souřadnice
async function geocodeAddress(address: string): Promise<Coordinates> {
  const response = await fetch(
    `https://api.mapy.cz/v1/geocode?query=${encodeURIComponent(address)}&apikey=${MAPY_API_KEY}`
  );
  const data = await response.json();
  
  return {
    lat: data.items[0].position.lat,
    lng: data.items[0].position.lon,
  };
}

// Přidání náhodného offsetu pro ochranu soukromí
function addPrivacyOffset(lat: number, lng: number, precision: string) {
  const offsetKm = precision === 'CITY' ? 2 : 0.5;
  const offsetLat = (Math.random() - 0.5) * (offsetKm / 111);
  const offsetLng = (Math.random() - 0.5) * (offsetKm / 85);
  
  return { lat: lat + offsetLat, lng: lng + offsetLng };
}
```

### UI - Detail vozu (lokace)

```
┌──────────────────────────────────────────────────────────────────┐
│  📍 KDE NAJDETE TENTO VŮZ                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │                    [MAPA - Mapy.cz]                        │ │
│  │                                                            │ │
│  │                    ╭─────────────╮                         │ │
│  │                    │   přibližná │                         │ │
│  │                    │    lokace   │                         │ │
│  │                    ╰─────────────╯                         │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📍 Praha 4 - Nusle                                             │
│  🏢 Autobazar TopCar (partnerské místo)                         │
│                                                                  │
│  ℹ️ Přesná adresa bude sdělena po domluvě s makléřem            │
│                                                                  │
│  [📍 Navigovat]    [📞 Domluvit prohlídku]                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. VIN Dekodér

### Implementace

```javascript
// Vlastní WMI databáze pro EU vozidla
const wmiDatabase = {
  'TMB': { brand: 'Škoda', country: 'CZ' },
  'WVW': { brand: 'Volkswagen', country: 'DE' },
  'WBA': { brand: 'BMW', country: 'DE' },
  'WDD': { brand: 'Mercedes-Benz', country: 'DE' },
  'WAU': { brand: 'Audi', country: 'DE' },
};

async function decodeVin(vin: string) {
  // 1. Validace
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
    throw new Error('Neplatný formát VIN');
  }
  
  // 2. Kontrola duplicity
  const existing = await prisma.vehicle.findUnique({ where: { vin } });
  if (existing) throw new Error('Vůz již existuje v systému');
  
  // 3. Dekódování
  const wmi = vin.substring(0, 3);
  return {
    ...wmiDatabase[wmi],
    year: decodeYear(vin[9]),
    vin,
  };
}
```

---

## 4. Export na inzertní portály

### XML Feed (Sauto.cz kompatibilní)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<vehicles>
  <vehicle>
    <id>car-123</id>
    <vin>TMBAJ7NE5L0123456</vin>
    <brand>Škoda</brand>
    <model>Octavia</model>
    <year>2020</year>
    <mileage>85000</mileage>
    <price>450000</price>
    
    <location>
      <city>Praha</city>
      <district>Praha 4</district>
    </location>
    
    <seller>
      <name>Jan Novák - Carmakler</name>
      <phone>+420777123456</phone>
    </seller>
    
    <images>
      <image>https://carmakler.cz/img/1.jpg</image>
    </images>
    
    <url>https://carmakler.cz/vozy/car-123</url>
  </vehicle>
</vehicles>
```

### Podporované portály

| Portál | Formát | Frekvence |
|--------|--------|-----------|
| Sauto.cz | XML | 1h |
| TipCars.com | XML | 1h |
| AutoESA.cz | XML | 6h |

---

## 5. Pojištění & Leasing (Affiliate)

```prisma
model AffiliatePartner {
  id              String   @id @default(cuid())
  type            PartnerType     // INSURANCE, LEASING
  name            String
  commissionRate  Float?
  isActive        Boolean  @default(true)
}

model AffiliateReferral {
  id              String   @id @default(cuid())
  partnerId       String
  saleId          String
  status          ReferralStatus @default(PENDING)
  expectedCommission Int?
}
```

---

## 6. Email & SMS

### Email (Resend)

```javascript
import { Resend } from 'resend';

const templates = {
  'broker-welcome': 'Vítejte v Carmakler!',
  'vehicle-approved': 'Váš inzerát byl schválen',
  'review-request': 'Jak jste spokojeni?',
  'commission-paid': 'Provize vyplacena',
};
```

### SMS (kritické notifikace)

- Nový lead
- Potvrzení schůzky
- Urgentní změny

---

## 7. API klíče

```prisma
model ApiKey {
  id          String   @id @default(cuid())
  name        String
  key         String   @unique
  permissions String[]
  rateLimit   Int      @default(1000)
  isActive    Boolean  @default(true)
  lastUsedAt  DateTime?
}
```

---

## Poznámky pro vývojáře

1. **Lokace vozů** - NIKDY nezobrazovat přesnou adresu veřejně, chránit soukromí.

2. **Vaše appka** - první integrace, domluvit formát dat.

3. **Mapy.cz** - lepší pokrytí ČR než Google, levnější.

4. **VIN** - začít s vlastní DB, placené služby později.

5. **Export feedů** - generovat CRON joby, cachovat.
