# CARMAKLER - Kompletní projektová specifikace

> **Účel dokumentu:** Tento dokument slouží jako vstup pro AI nástroj, který z něj vygeneruje GitHub issues a rozdělí práci pro vývojový tým.

---

## PROJEKT OVERVIEW

**Název:** Carmakler
**Typ:** Auto portál se zprostředkováním prodeje přes síť makléřů
**Tech Stack:** Next.js 14+ (App Router), PostgreSQL, Prisma, Tailwind CSS, PWA
**Inspirace:** https://www.autorro.sk

### Hlavní komponenty
1. **Web portál** (carmakler.cz) - veřejný web pro kupující/prodávající
2. **PWA aplikace** - mobilní app pro makléře
3. **Admin panel** - správa systému, BackOffice
4. **Marketplace** (marketplace.carmakler.cz) - investiční platforma pro vozy z dovozu
5. **Shop** (shop.carmakler.cz) - e-shop s autodoplňky a kosmetikou
6. **Inzerce** - placené balíčky pro zvýraznění inzerátů

---

## HIERARCHIE UŽIVATELŮ

```
ADMIN
├── BACKOFFICE (schvalování inzerátů, operativa)
├── REGIONAL_DIRECTOR (bonus 3% z regionu)
│   └── MANAGER (bonus 5% z týmu, může mít vlastní vozy)
│       └── BROKER/Makléř (50% z provize)
```

---

## PROVIZNÍ MODEL

```
Provize = 5% z prodejní ceny (minimum 25 000 Kč)

Makléř: 50%
Firma: 50%
  ├── Manažer: 5% z firemní části
  ├── Ředitel: 3% z firemní části
  └── Carmakler: zbytek

Bonusy (pojištění, leasing): stejný split 50/50
```

---

# EPIC 1: AUTENTIZACE A SPRÁVA UŽIVATELŮ

## Feature 1.1: Registrace a přihlášení
**Priorita:** P0 (Critical)
**Komponenty:** Web, PWA, API

### Tasks:
- [ ] Vytvořit registrační formulář pro makléře (email, telefon, heslo, jméno, město, specializace)
- [ ] Implementovat login s JWT + refresh token
- [ ] Přidat forgot password flow s email resetem
- [ ] Vytvořit email verifikaci
- [ ] Implementovat rate limiting na login (5 pokusů / 15 min)
- [ ] Přidat 2FA (volitelné, pro admin/backoffice)

### Acceptance Criteria:
- Uživatel se může zaregistrovat a přihlásit
- Hesla jsou hashována (bcrypt/Argon2)
- Access token expiruje za 15 min, refresh za 7 dní

---

## Feature 1.2: Role a oprávnění
**Priorita:** P0 (Critical)
**Komponenty:** API, Database

### Tasks:
- [ ] Vytvořit Prisma model User s rolemi (ADMIN, BACKOFFICE, REGIONAL_DIRECTOR, MANAGER, BROKER)
- [ ] Vytvořit Prisma model Region
- [ ] Implementovat middleware pro kontrolu rolí
- [ ] Vytvořit matici oprávnění (kdo co může)
- [ ] Implementovat hierarchii (makléř → manažer → ředitel)
- [ ] Přidat audit log pro citlivé akce

### Prisma Schema:
```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  phone             String?
  passwordHash      String
  firstName         String
  lastName          String
  avatar            String?
  role              Role      @default(BROKER)
  status            UserStatus @default(PENDING)
  managerId         String?
  manager           User?     @relation("ManagerToBroker", fields: [managerId], references: [id])
  teamMembers       User[]    @relation("ManagerToBroker")
  regionId          String?
  region            Region?   @relation(fields: [regionId], references: [id])
  specializations   String[]
  cities            String[]
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

enum Role {
  ADMIN
  BACKOFFICE
  REGIONAL_DIRECTOR
  MANAGER
  BROKER
}

enum UserStatus {
  PENDING
  ACTIVE
  SUSPENDED
  INACTIVE
}

model Region {
  id          String   @id @default(cuid())
  name        String
  cities      String[]
  users       User[]
}
```

---

## Feature 1.3: Správa makléřů (Admin/BackOffice)
**Priorita:** P0 (Critical)
**Komponenty:** Admin panel

### Tasks:
- [ ] Vytvořit seznam uživatelů s filtry (role, status, region)
- [ ] Implementovat schvalování nových makléřů
- [ ] Přidat možnost deaktivace makléře
- [ ] Vytvořit modal pro přeřazení vozů při deaktivaci makléře
- [ ] Implementovat přiřazení makléře k manažerovi
- [ ] Přidat bulk akce (schválit více, deaktivovat)

### UI Wireframe - Deaktivace makléře:
```
┌─────────────────────────────────────────────┐
│  ⚠️ DEAKTIVACE MAKLÉŘE                      │
│  Makléř: Jan Novák                          │
│  Aktivní vozy: 8                            │
│                                             │
│  Co s aktivními vozy?                       │
│  ○ Přiřadit všechny jednomu makléři         │
│  ○ Rozdělit mezi více makléřů               │
│  ○ Přesunout do poolu (nepřiřazené)         │
│                                             │
│  [Zrušit]         [Potvrdit deaktivaci]     │
└─────────────────────────────────────────────┘
```

---

# EPIC 2: SPRÁVA VOZIDEL

## Feature 2.1: CRUD vozidel
**Priorita:** P0 (Critical)
**Komponenty:** PWA, Web, API

### Tasks:
- [ ] Vytvořit Prisma model Vehicle se všemi poli
- [ ] Implementovat VIN validaci (17 znaků, formát)
- [ ] Vytvořit VIN dekodér (vlastní DB + NHTSA API fallback)
- [ ] **CRITICAL: VIN je readonly po prvním uložení - nelze změnit!**
- [ ] Implementovat kontrolu duplicity VIN
- [ ] Vytvořit formulář přidání vozu (PWA - 4 kroky)
- [ ] Implementovat upload fotek s kompresí
- [ ] Přidat drag & drop řazení fotek
- [ ] Vytvořit výběr výbavy (checkboxy)

### Prisma Schema:
```prisma
model Vehicle {
  id              String        @id @default(cuid())
  vin             String        @unique
  vinLocked       Boolean       @default(false)
  brand           String
  model           String
  variant         String?
  year            Int
  mileage         Int
  fuelType        FuelType
  transmission    Transmission
  enginePower     Int?
  engineCapacity  Int?
  bodyType        BodyType?
  color           String?
  condition       VehicleCondition
  stkValidUntil   DateTime?
  serviceBook     Boolean       @default(false)
  price           Int
  priceNegotiable Boolean       @default(true)
  equipment       String[]
  description     String?
  status          VehicleStatus @default(DRAFT)
  brokerId        String?
  broker          User?         @relation(fields: [brokerId], references: [id])
  city            String
  district        String?
  latitude        Float?
  longitude       Float?
  viewCount       Int           @default(0)
  images          VehicleImage[]
  changeLog       VehicleChangeLog[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  publishedAt     DateTime?
}

enum VehicleStatus {
  DRAFT
  PENDING
  REJECTED
  ACTIVE
  RESERVED
  SOLD
  ARCHIVED
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
```

### VIN Pravidlo (KRITICKÉ):
```
⚠️ VIN JE SVATÝ - NELZE ZMĚNIT PO ULOŽENÍ!

1. Makléř zadá VIN při vytvoření
2. Systém validuje formát + kontroluje duplicitu
3. Po prvním uložení: vinLocked = true, pole readonly
4. Chce změnit VIN = musí vytvořit NOVÝ inzerát
```

---

## Feature 2.2: Schvalovací workflow
**Priorita:** P0 (Critical)
**Komponenty:** PWA, Admin, API

### Tasks:
- [ ] Implementovat statusy: DRAFT → PENDING → ACTIVE (nebo REJECTED)
- [ ] Vytvořit BackOffice frontu ke schválení
- [ ] Přidat kontrolní checklist (fotky, údaje, cena, VIN)
- [ ] Implementovat zamítnutí s důvodem (předvolby + vlastní)
- [ ] Přidat notifikace makléři (schváleno/zamítnuto)
- [ ] Vytvořit "Odeslat ke schválení" tlačítko v PWA

### Workflow diagram:
```
DRAFT → [Odeslat] → PENDING → [BackOffice] → ACTIVE
                         ↓
                    REJECTED → [Opravit] → PENDING
```

---

## Feature 2.3: Change log a sledování změn
**Priorita:** P1 (High)
**Komponenty:** API, PWA, Admin

### Tasks:
- [ ] Vytvořit Prisma model VehicleChangeLog
- [ ] Implementovat automatické logování všech změn
- [ ] Přidat povinný důvod pro: cena, km, rok, status
- [ ] Implementovat automatické flagy (sleva > 10%, změna km > 5000)
- [ ] Vytvořit BackOffice přehled změn s filtry
- [ ] Přidat modal pro zadání důvodu změny (PWA)

### Prisma Schema:
```prisma
model VehicleChangeLog {
  id          String   @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  field       String
  oldValue    String?
  newValue    String?
  reason      String?
  flagged     Boolean  @default(false)
  flagReason  String?
  createdAt   DateTime @default(now())
}
```

---

## Feature 2.4: Pool nepřiřazených vozů
**Priorita:** P1 (High)
**Komponenty:** Admin, API

### Tasks:
- [ ] Vytvořit sekci "Nepřiřazené vozy" v admin panelu
- [ ] Implementovat přiřazení vozu makléři
- [ ] Přidat hromadné přiřazení
- [ ] Vytvořit notifikace při novém vozu v poolu
- [ ] Implementovat historii přiřazení (VehicleBrokerHistory)

---

# EPIC 3: PROFIL MAKLÉŘE A RECENZE

## Feature 3.1: Veřejný profil makléře
**Priorita:** P1 (High)
**Komponenty:** Web

### Tasks:
- [ ] Vytvořit URL strukturu: /makler/[slug] (jan-novak-praha)
- [ ] Implementovat generování unikátního slug
- [ ] Vytvořit profil stránku (fotka, bio, specializace, kontakt)
- [ ] Přidat statistiky (prodeje, hodnocení, Ø doba prodeje)
- [ ] Zobrazit aktivní vozy makléře
- [ ] Implementovat SEO meta tagy a JSON-LD
- [ ] Vytvořit seznam makléřů (/makleri) s filtrem podle města

---

## Feature 3.2: Systém recenzí makléřů
**Priorita:** P1 (High)
**Komponenty:** Web, API

### Tasks:
- [ ] Vytvořit Prisma model Review
- [ ] Implementovat formulář recenze (hvězdičky 1-5, detailní hodnocení, text)
- [ ] Přidat ověření recenzenta (email, nebo po prohlídce/koupi)
- [ ] Vytvořit moderaci recenzí (BackOffice schvalování)
- [ ] Implementovat odpověď makléře na recenzi
- [ ] Přidat automatický email s žádostí o recenzi po prodeji
- [ ] Vypočítat a cachovat průměrné hodnocení

### Prisma Schema:
```prisma
model Review {
  id            String       @id @default(cuid())
  brokerId      String
  broker        User         @relation(fields: [brokerId], references: [id])
  vehicleId     String?
  clientName    String
  clientEmail   String
  overallRating Int
  communication Int?
  speed         Int?
  reliability   Int?
  title         String?
  content       String
  brokerReply   String?
  brokerReplyAt DateTime?
  status        ReviewStatus @default(PENDING)
  verifiedPurchase Boolean   @default(false)
  createdAt     DateTime     @default(now())
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}
```

---

## Feature 3.3: Recenze k vozům
**Priorita:** P2 (Medium)
**Komponenty:** Web, API

### Tasks:
- [ ] Vytvořit Prisma model VehicleReview
- [ ] Implementovat recenze u detailu vozu
- [ ] Přidat typ interakce (prohlídka, test drive, koupě)
- [ ] Propojit s ověřenými prohlídkami
- [ ] Zobrazit recenze na detailu vozu

---

# EPIC 4: PROVIZE A FINANCE

## Feature 4.1: Výpočet provizí
**Priorita:** P0 (Critical)
**Komponenty:** API

### Tasks:
- [ ] Vytvořit Prisma modely Sale, Commission, Payout
- [ ] Implementovat výpočet: 5% z ceny, minimum 25 000 Kč
- [ ] Rozdělit provizi: 50% makléř, 50% firma
- [ ] Přidat bonus manažera (5% z firemní části)
- [ ] Přidat bonus ředitele (3% z firemní části)
- [ ] Implementovat snapshot hierarchie při prodeji
- [ ] Přidat bonusy za pojištění/leasing (stejný split)

### Výpočet:
```javascript
function calculateCommission(salePrice) {
  const commission = Math.max(salePrice * 0.05, 25000);
  const brokerShare = commission * 0.5;
  const companyShare = commission * 0.5;
  const managerBonus = companyShare * 0.05;
  const directorBonus = companyShare * 0.03;
  return { commission, brokerShare, companyShare, managerBonus, directorBonus };
}
```

---

## Feature 4.2: Dashboard provizí
**Priorita:** P1 (High)
**Komponenty:** PWA, Admin

### Tasks:
- [ ] Vytvořit dashboard pro makléře (tento měsíc, k výplatě, celkem)
- [ ] Implementovat historii provizí s detaily
- [ ] Vytvořit dashboard pro manažera (tým, můj bonus)
- [ ] Přidat dashboard pro ředitele (region)
- [ ] Vytvořit admin přehled všech provizí
- [ ] Implementovat generování výplat za období
- [ ] Přidat export do Excel/PDF

---

# EPIC 5: WEB FRONTEND (PORTÁL)

## Feature 5.1: Homepage
**Priorita:** P0 (Critical)
**Komponenty:** Web

### Tasks:
- [ ] Vytvořit hero sekci s vyhledáváním
- [ ] Implementovat Netflix-style kategorie (scrollovací řady)
- [ ] Přidat sekce: Nově přidané, Právě zlevněné, Nejlepší hodnota, Rodinné, Do města, Na dálky
- [ ] Vytvořit sekci "Jak to funguje" (3 kroky)
- [ ] Přidat TOP makléře
- [ ] Zobrazit statistiky (počet prodaných, makléřů, hodnocení)
- [ ] Implementovat testimonials

### Netflix kategorie:
```
🔥 Nejlepší poměr cena/výkon
👨‍👩‍👧‍👦 Rodinné topy
🏙️ Ideální do města
🛣️ Na dálky
💰 Nejlevnější automaty
🆕 Nově přidané
⬇️ Právě zlevněné
```

---

## Feature 5.2: Katalog vozů
**Priorita:** P0 (Critical)
**Komponenty:** Web

### Tasks:
- [ ] Vytvořit stránku /vozy s filtry
- [ ] Implementovat filtry: značka, model, cena, rok, km, palivo, převodovka, karoserie, lokace
- [ ] Přidat cenový slider
- [ ] Vytvořit karty vozů (fotka, základní info, cena, zobrazení, makléř)
- [ ] Implementovat stránkování nebo infinite scroll
- [ ] Přidat řazení (nejnovější, cena, km, rok)
- [ ] Zobrazit "X lidí si prohlíží" badge

---

## Feature 5.3: Detail vozu
**Priorita:** P0 (Critical)
**Komponenty:** Web

### Tasks:
- [ ] Vytvořit stránku /vozy/[slug]
- [ ] Implementovat fotogalerii s lightboxem
- [ ] Zobrazit všechny technické údaje v tabulce
- [ ] Přidat sekci výbava
- [ ] Zobrazit popis
- [ ] Přidat mapu s přibližnou lokací (město/část, NE přesná adresa!)
- [ ] Zobrazit profil makléře (mini karta)
- [ ] Implementovat kontaktní formulář / CTA tlačítka
- [ ] Přidat "Uložit do oblíbených"
- [ ] Zobrazit podobné vozy
- [ ] Přidat SEO meta tagy a JSON-LD (schema.org/Car)

---

## Feature 5.4: Live viewers a počítadlo zobrazení
**Priorita:** P1 (High)
**Komponenty:** Web, API

### Tasks:
- [ ] Implementovat tracking zobrazení (deduplikace per session/den)
- [ ] Vytvořit real-time počet prohlížejících (Pusher/Socket.io)
- [ ] Zobrazit "🔴 X lidí si právě prohlíží tento vůz"
- [ ] Přidat celkový počet zobrazení na kartu vozu
- [ ] Cachovat v Redis pro performance

---

## Feature 5.5: Trust Score a odznaky důvěry
**Priorita:** P1 (High)
**Komponenty:** Web, API

### Tasks:
- [ ] Vytvořit výpočet Trust Score (0-100)
- [ ] Body za: ověřený prodejce (+15), VIN ověřen (+20), servisní historie (+15), 20+ fotek (+20), kompletní data (+15), rychlá reakce (+10), STK protokol (+5)
- [ ] Zobrazit odznaky na detailu vozu
- [ ] Přidat progress bar "Důvěryhodnost inzerátu"

---

## Feature 5.6: Historie změn inzerátu
**Priorita:** P2 (Medium)
**Komponenty:** Web

### Tasks:
- [ ] Zobrazit timeline změn na detailu vozu
- [ ] Ukázat: datum přidání, změny ceny, aktualizace
- [ ] Zobrazit "Na Carmakler: X dní"

---

# EPIC 6: PWA PRO MAKLÉŘE

## Feature 6.1: PWA setup
**Priorita:** P0 (Critical)
**Komponenty:** PWA

### Tasks:
- [ ] Nakonfigurovat next-pwa nebo Serwist
- [ ] Vytvořit manifest.json
- [ ] Implementovat Service Worker
- [ ] Přidat offline support (IndexedDB pro drafty)
- [ ] Vytvořit install prompt
- [ ] Přidat splash screen a ikony

---

## Feature 6.2: Dashboard makléře
**Priorita:** P0 (Critical)
**Komponenty:** PWA

### Tasks:
- [ ] Vytvořit dashboard s přehledem (provize, prodeje, aktivní vozy)
- [ ] Přidat sekci notifikací
- [ ] Zobrazit rychlé akce
- [ ] Implementovat bottom navigation (Domů, Vozy, Přidat, Provize, Profil)

---

## Feature 6.3: Přidání vozu (mobilní)
**Priorita:** P0 (Critical)
**Komponenty:** PWA

### Tasks:
- [ ] Vytvořit 4-krokový formulář (VIN → Údaje → Fotky → Cena)
- [ ] Implementovat VIN scanner pomocí kamery (OCR)
- [ ] Přidat mobilní focení s přímým uploadem
- [ ] Implementovat offline ukládání draftu
- [ ] Přidat kompres fotek před uploadem
- [ ] Vytvořit "Odeslat ke schválení" s potvrzením

---

## Feature 6.4: Push notifikace
**Priorita:** P1 (High)
**Komponenty:** PWA, API

### Tasks:
- [ ] Implementovat Web Push API
- [ ] Vytvořit typy notifikací: nový lead, inzerát schválen/zamítnut, nový dotaz, provize schválena
- [ ] Přidat nastavení notifikací v profilu
- [ ] Implementovat click-through na relevantní stránku

---

## Feature 6.5: Správa vozů (mobilní)
**Priorita:** P0 (Critical)
**Komponenty:** PWA

### Tasks:
- [ ] Vytvořit seznam mých vozů s filtry (status)
- [ ] Implementovat editaci vozu
- [ ] Přidat změnu ceny s povinným důvodem
- [ ] Vytvořit změnu statusu (rezervace, prodáno)
- [ ] Zobrazit statistiky vozu (zobrazení, dotazy)

---

# EPIC 7: BOOM FUNKCE 2026

## Feature 7.1: Smart Search (AI)
**Priorita:** P2 (Medium)
**Komponenty:** Web, API

### Tasks:
- [ ] Implementovat AI parsing dotazu (OpenAI/Claude API)
- [ ] Extrahovat intent: typ auta, rozpočet, účel
- [ ] Najít matching vozidla
- [ ] Přidat suggestions "Rozumím: SUV, automat, max 500k"
- [ ] Doporučit alternativy

### Příklad:
```
Input: "SUV automat do 500k pro rodinu"
Output: {
  bodyType: "SUV",
  transmission: "automatic",
  maxPrice: 500000,
  familyScore: "high"
}
```

---

## Feature 7.2: "Pomoz mi vybrat" kvíz
**Priorita:** P2 (Medium)
**Komponenty:** Web

### Tasks:
- [ ] Vytvořit 4-krokový kvíz (účel, budget, priority, preference)
- [ ] Implementovat scoring algoritmus
- [ ] Zobrazit TOP 5 aut s match procentem
- [ ] Uložit výsledky pro personalizaci

---

## Feature 7.3: Porovnání aut se Score
**Priorita:** P2 (Medium)
**Komponenty:** Web

### Tasks:
- [ ] Vytvořit porovnávací tabulku (max 3-4 auta)
- [ ] Implementovat score kategorie: Family, Highway, City, Value
- [ ] Vypočítat score na základě parametrů vozu
- [ ] Zobrazit vizuální progress bary
- [ ] Přidat "Verdict" - které auto vyhrává v čem

---

## Feature 7.4: Hlídač aut + ceny
**Priorita:** P1 (High)
**Komponenty:** Web, API

### Tasks:
- [ ] Vytvořit Prisma model SavedSearch, PriceWatch
- [ ] Implementovat uložení filtru
- [ ] Přidat sledování konkrétního auta
- [ ] Vytvořit email/push notifikace (nové auto, sleva)
- [ ] Přidat nastavení frekvence (ihned, denně, týdně)

---

## Feature 7.5: Offer systém (nabídka ceny)
**Priorita:** P1 (High)
**Komponenty:** Web, PWA, API

### Tasks:
- [ ] Vytvořit Prisma model Offer
- [ ] Implementovat formulář nabídky (cena, zpráva, kontakt)
- [ ] Přidat notifikaci makléři
- [ ] Vytvořit odpověď: přijmout, odmítnout, protinávrh
- [ ] Implementovat expiraci nabídky
- [ ] Zobrazit historii nabídek

---

## Feature 7.6: Rezervace prohlídky
**Priorita:** P1 (High)
**Komponenty:** Web, PWA, API

### Tasks:
- [ ] Vytvořit Prisma model Viewing
- [ ] Implementovat kalendář makléře s dostupností
- [ ] Přidat výběr termínu pro zájemce
- [ ] Implementovat SMS ověření telefonu
- [ ] Přidat email + SMS potvrzení
- [ ] Vytvořit připomínku den předem
- [ ] Přidat status: pending, confirmed, completed, no-show

---

## Feature 7.7: Anonymní chat
**Priorita:** P1 (High)
**Komponenty:** Web, PWA, API

### Tasks:
- [ ] Vytvořit Prisma model Conversation, Message
- [ ] Implementovat real-time chat (Pusher)
- [ ] Přidat šablony rychlých dotazů
- [ ] Skrýt telefonní čísla do potvrzení prohlídky
- [ ] Zobrazit historii konverzací
- [ ] Přidat notifikace na nové zprávy

---

## Feature 7.8: Check-list pro prohlídku
**Priorita:** P2 (Medium)
**Komponenty:** Web

### Tasks:
- [ ] Vytvořit sekci na detailu vozu
- [ ] Přidat interaktivní checklist (mechanika, karoserie, elektro, dokumenty)
- [ ] Implementovat PDF export checklistu
- [ ] Přidat tipy a doporučení

---

## Feature 7.9: CRM Pipeline pro makléře
**Priorita:** P2 (Medium)
**Komponenty:** PWA

### Tasks:
- [ ] Vytvořit Prisma model CrmLead, CrmNote
- [ ] Implementovat Kanban board (Nový → Kontakt → Prohlídka → Jednání → Uzavřeno)
- [ ] Přidat drag & drop změnu stavu
- [ ] Vytvořit poznámky a follow-up připomínky
- [ ] Implementovat notifikace na follow-up

---

## Feature 7.10: Personalizace homepage
**Priorita:** P3 (Low)
**Komponenty:** Web, API

### Tasks:
- [ ] Trackovat chování uživatele (prohlížené vozy, značky, ceny)
- [ ] Vytvořit sekci "Doporučeno pro vás"
- [ ] Přidat "Nedávno prohlížené"
- [ ] Implementovat "Podobné tomu co jste prohlíželi"

---

# EPIC 8: INTEGRACE

## Feature 8.1: Integrace s externí appkou (leady)
**Priorita:** P1 (High)
**Komponenty:** API

### Tasks:
- [ ] Vytvořit API endpoint POST /api/external/leads
- [ ] Implementovat autentizaci API klíčem
- [ ] Přidat validaci a deduplikaci leadů
- [ ] Vytvořit automatické přiřazení podle regionu
- [ ] Přidat notifikace makléřům

---

## Feature 8.2: VIN dekodér
**Priorita:** P1 (High)
**Komponenty:** API

### Tasks:
- [ ] Vytvořit vlastní WMI databázi (značka podle prvních 3 znaků)
- [ ] Implementovat NHTSA API jako fallback
- [ ] Přidat cachování výsledků
- [ ] Vytvořit endpoint POST /api/vin/decode

---

## Feature 8.3: Mapy.cz integrace
**Priorita:** P1 (High)
**Komponenty:** Web

### Tasks:
- [ ] Implementovat Mapy.cz API
- [ ] Přidat geocoding (adresa → souřadnice)
- [ ] Zobrazit přibližnou lokaci vozu (NE přesnou adresu!)
- [ ] Přidat privacy offset pro ochranu adresy

---

## Feature 8.4: Export na inzertní portály
**Priorita:** P2 (Medium)
**Komponenty:** API

### Tasks:
- [ ] Vytvořit XML feed generator (Sauto.cz formát)
- [ ] Implementovat CRON job pro generování
- [ ] Přidat admin nastavení exportu
- [ ] Podpora pro: Sauto.cz, TipCars.com, AutoESA.cz

---

## Feature 8.5: Email služba
**Priorita:** P0 (Critical)
**Komponenty:** API

### Tasks:
- [ ] Nakonfigurovat Resend nebo SendGrid
- [ ] Vytvořit email šablony (React Email)
- [ ] Implementovat: welcome, vehicle approved/rejected, review request, commission paid
- [ ] Přidat tracking otevření

---

# EPIC 9: MONETIZACE

## Feature 9.1: Balíčky pro prodávající
**Priorita:** P2 (Medium)
**Komponenty:** Web, API

### Tasks:
- [ ] Vytvořit 3 balíčky: Basic (zdarma), Pro (2990 Kč), Elite (4990 Kč)
- [ ] Implementovat platební bránu (Stripe/GoPay)
- [ ] Přidat topování a zvýraznění inzerátů
- [ ] Vytvořit premium pozici v seznamu

---

## Feature 9.2: "Prodat bez starostí" landing page
**Priorita:** P1 (High)
**Komponenty:** Web

### Tasks:
- [ ] Vytvořit landing page /prodat-auto
- [ ] Implementovat jednoduchý formulář (SPZ/VIN, rok, km, město, telefon)
- [ ] Přidat lead do systému
- [ ] Automaticky přiřadit makléři
- [ ] Zobrazit potvrzení "Ozveme se do 24h"

---

## Feature 9.3: Rezervační záloha
**Priorita:** P3 (Low)
**Komponenty:** Web, API

### Tasks:
- [ ] Implementovat platbu zálohy 5000 Kč
- [ ] Stáhnout auto z nabídky na 48h
- [ ] Přidat refund logiku
- [ ] Vytvořit admin přehled záloh

---

# TECHNICKÉ POŽADAVKY

## Databáze
- PostgreSQL 15+
- Prisma ORM
- Redis pro cache a real-time

## Hosting
- Vercel (Web + API)
- Cloudinary nebo AWS S3 (obrázky)
- Pusher nebo vlastní Socket.io (real-time)

## Monitoring
- Vercel Analytics
- Sentry pro error tracking
- LogRocket (volitelné)

## SEO
- Next.js Metadata API
- JSON-LD strukturovaná data
- Sitemap generátor
- robots.txt

---

# PRIORITIZACE

## P0 - Critical (MVP)
- Epic 1: Autentizace
- Epic 2: Správa vozidel (základní)
- Epic 4: Provize (základní)
- Epic 5: Web (homepage, katalog, detail)
- Epic 6: PWA (základní)
- Feature 8.5: Email

## P1 - High (v1.1)
- Epic 3: Profily a recenze
- Feature 5.4: Live viewers
- Feature 5.5: Trust Score
- Feature 7.4-7.7: Hlídač, Offer, Prohlídky, Chat
- Epic 8: Integrace

## P2 - Medium (v1.2)
- Feature 7.1-7.3: AI search, Kvíz, Porovnání
- Feature 7.8-7.9: Checklist, CRM
- Epic 9: Monetizace
- Epic 10: Inzerce (balíčky)
- Epic 11: Shop (e-commerce)

## P3 - Low (v2.0)
- Feature 7.10: Personalizace
- Feature 9.3: Zálohy
- Epic 12: Marketplace (investiční platforma)

---

# EPIC 10: INZERCE - Placené balíčky

## Feature 10.1: Inzerční balíčky
**Priorita:** P2 (Medium)
**Komponenty:** Web, API, Admin

### Balíčky:
- **BASIC** (Zdarma, 60 dní) - 15 fotek, základní pozice
- **PRO** (2 990 Kč, 30 dní) - 30 fotek, video, zvýraznění, 1× TOP, statistiky
- **ELITE** (4 990 Kč, 30 dní) - 50 fotek, XXL karta, homepage rotace, 3× TOP, konzultace
- **TURBO** (990 Kč, 7 dní) - Krátkodobý boost, TOP pozice

### Tasks:
- [ ] Vytvořit Prisma model ListingPackage
- [ ] Implementovat nákup balíčku (checkout flow)
- [ ] Vytvořit badge systém na kartách (PRO/ELITE)
- [ ] Implementovat řazení podle balíčku
- [ ] Přidat statistiky zobrazení pro PRO+
- [ ] Vytvořit admin přehled prodaných balíčků

---

## Feature 10.2: Topování
**Priorita:** P2 (Medium)

### Tasks:
- [ ] Vytvořit model ListingTop (24h platnost)
- [ ] Implementovat jednorázový nákup (199 Kč)
- [ ] Přidat topování z balíčku (PRO = 1×, ELITE = 3×)
- [ ] Vytvořit "Právě topováno" badge
- [ ] Implementovat limit 1× za 48h

---

## Feature 10.3: Statistiky inzerátů
**Priorita:** P2 (Medium)

### Tasks:
- [ ] Vytvořit model ListingStats (denní agregace)
- [ ] Trackovat: views, detail views, favorites, messages, phone clicks
- [ ] Vytvořit dashboard pro inzerenty (PRO+)
- [ ] Přidat grafy vývoje
- [ ] ELITE: Advanced analytics (zdroje, demografie)

---

# EPIC 11: SHOP - E-commerce

## Feature 11.1: Katalog produktů
**Priorita:** P2 (Medium)
**Komponenty:** Web, API, Admin

### Kategorie:
- Autokosmetika (šampony, vosky, detailery)
- Autodoplňky (koberečky, držáky, nabíječky)
- Náhradní díly (filtry, oleje, žárovky)
- Carmakler Merch (trička, klíčenky)

### Tasks:
- [ ] Vytvořit Prisma modely: Product, ProductCategory, ProductVariant, ProductImage
- [ ] Implementovat katalog s filtrováním a řazením
- [ ] Vytvořit detail produktu
- [ ] Přidat varianty (velikost, barva)
- [ ] Implementovat kompatibilitu s vozy (doporučení podle modelu)
- [ ] Vytvořit admin pro správu produktů

---

## Feature 11.2: Košík a checkout
**Priorita:** P2 (Medium)

### Tasks:
- [ ] Vytvořit košík (localStorage + sync s DB pro přihlášené)
- [ ] Implementovat checkout flow (doprava → platba → shrnutí)
- [ ] Přidat dopravce: Zásilkovna, PPL, osobní odběr
- [ ] Integrovat platební bránu (Stripe/GoPay)
- [ ] Vytvořit potvrzovací emaily
- [ ] Implementovat objednávkový tracking

---

## Feature 11.3: Objednávky
**Priorita:** P2 (Medium)

### Tasks:
- [ ] Vytvořit Prisma modely: Order, OrderItem
- [ ] Implementovat statusy: PENDING → CONFIRMED → SHIPPED → DELIVERED
- [ ] Vytvořit admin order management
- [ ] Přidat tisk štítků (Zásilkovna API)
- [ ] Implementovat refund flow
- [ ] Vytvořit zákaznický přehled objednávek

---

## Feature 11.4: Věrnostní program
**Priorita:** P3 (Low)

### Tasks:
- [ ] Vytvořit model LoyaltyAccount, LoyaltyTransaction
- [ ] Implementovat sbírání bodů (1 Kč = 1 bod)
- [ ] Přidat bonus za nákup/prodej vozu
- [ ] Vytvořit tier systém (Bronze → Silver → Gold → Platinum)
- [ ] Implementovat uplatnění bodů při checkout

---

# EPIC 12: MARKETPLACE - Investiční platforma

## Feature 12.1: Investorský portál
**Priorita:** P3 (Low)
**Doména:** marketplace.carmakler.cz
**Komponenty:** Standalone Next.js app, shared DB

### Popis:
Platforma pro investice do vozidel z dovozu. Investoři se skládají na nákup a opravu vozu, po prodeji se dělí o zisk.

### Investiční model:
```
Celková investice = Nákup + Dovoz + Opravy + Režie
Očekávaný zisk = 15-25% (dle rizikové třídy)
Rozdělení: Investoři 80% | Carmakler 20%
```

### Tasks:
- [ ] Vytvořit samostatnou Next.js app (sdílená DB)
- [ ] Implementovat registraci investora + KYC
- [ ] Vytvořit investor dashboard (portfolio, statistiky)
- [ ] Přidat investiční preference (riziko, min/max částka)

---

## Feature 12.2: Deal management
**Priorita:** P3 (Low)

### Fáze dealu:
```
SCOUTING → REVIEW → FUNDING → PURCHASING → REPAIR → SALE → PAYOUT
```

### Rizikové třídy:
- 🟢 A (Low Risk): ROI 10-15%, populární modely
- 🟡 B (Medium Risk): ROI 15-25%, střední opravy
- 🔴 C (High Risk): ROI 25-40%, velké opravy
- ⚫ S (Special): Youngtimery, sběratelské kusy

### Tasks:
- [ ] Vytvořit Prisma model MarketplaceDeal
- [ ] Implementovat deal kartu (kalkulace, fotky, VIN, dokumenty)
- [ ] Vytvořit funding progress bar
- [ ] Přidat investiční kalkulačku (ROI scénáře)
- [ ] Implementovat timeline aktivit
- [ ] Vytvořit deal chat (investor ↔ scout)

---

## Feature 12.3: Investice a výplaty
**Priorita:** P3 (Low)

### Typy investic:
- **Solo** - 1 investor, 100% podíl, min. 100k
- **Syndikát** - 2-5 investorů, min. 50k/osoba
- **Mikro** - crowdfunding, min. 10k, max 20 investorů

### Tasks:
- [ ] Vytvořit model Investment
- [ ] Implementovat investiční flow (výběr částky → potvrzení → platba)
- [ ] Přidat automatický výpočet podílů
- [ ] Implementovat hlasování (překročení rozpočtu, snížení ceny)
- [ ] Vytvořit payout systém (po prodeji)
- [ ] Generovat investiční smlouvy (PDF)
- [ ] Přidat daňové podklady pro investory

---

## Feature 12.4: Admin Marketplace
**Priorita:** P3 (Low)

### Role:
- **Scout** - vytváří dealy, hledá auta
- **Deal Manager** - schvaluje, nastavuje riziko
- **Admin** - finanční přehledy, výplaty

### Tasks:
- [ ] Vytvořit scout rozhraní pro tvorbu dealů
- [ ] Implementovat approval workflow (pending → approved/rejected)
- [ ] Přidat správu investorů a KYC
- [ ] Vytvořit finanční reporty (měsíční, roční)
- [ ] Implementovat hromadné výplaty

---

# JAK POUŽÍT TENTO DOKUMENT

## Pro AI (Claude, Cursor, GPT):
```
Přečti tento dokument a vytvoř GitHub issues pro projekt Carmakler.

Pro každou Feature vytvoř:
1. Epic issue (label: epic)
2. Feature issue (label: feature, propojit s epic)
3. Task issues pro každý task (label: task, propojit s feature)

Přidej labels podle priority: P0-critical, P1-high, P2-medium, P3-low
Přidej labels podle komponenty: web, pwa, api, admin, database

Vytvoř milestones:
- MVP (P0 features)
- v1.1 (P1 features)
- v1.2 (P2 features)
- v2.0 (P3 features)
```

## Pro vývojáře:
1. Začni s P0 features
2. Každý task má jasné acceptance criteria
3. Prisma schémata jsou připravena ke kopírování
4. UI wireframy ukazují očekávaný výstup

---

**Dokument vytvořen:** Leden 2026
**Verze:** 1.0
**Autor:** Jevg + Claude AI
