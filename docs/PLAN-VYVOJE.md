# CARMAKLER - Plán vývoje webu + PWA

## 📋 PŘEHLED PROJEKTU

**Název:** Carmakler
**Typ:** Auto portál se zprostředkováním prodeje přes síť makléřů
**Inspirace:** Autorro.sk
**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, PostgreSQL, Prisma, PWA

---

## 🎯 CÍLE PROJEKTU

1. **Web portál** - veřejný web pro kupující a prodávající
2. **PWA aplikace** - mobilní app pro makléře (offline-first)
3. **Admin panel** - BackOffice pro správu systému

---

## 📅 FÁZE VÝVOJE

### FÁZE 0: PŘÍPRAVA (1 týden)
- [ ] Založení projektu (Next.js 15 + TypeScript)
- [ ] Nastavení Tailwind CSS + design systém
- [ ] Konfigurace ESLint, Prettier
- [ ] Nastavení Git repozitáře
- [ ] Databázové schema (Prisma + PostgreSQL)
- [ ] Deployment na Vercel (dev/staging/prod)
- [ ] Konfigurace domény carmakler.cz

### FÁZE 1: MVP WEB (4 týdny)

#### Týden 1-2: Základní infrastruktura + Auth
```
□ Autentizace (NextAuth.js)
  ├── Registrace makléřů
  ├── Login/Logout
  ├── Forgot password
  └── Role systém (ADMIN, BACKOFFICE, MANAGER, BROKER)

□ Databázové modely
  ├── User (makléři, admini)
  ├── Vehicle (vozidla)
  ├── Region (regiony)
  └── VehicleImage (fotky)
```

#### Týden 3: Veřejný web - Homepage + Katalog
```
□ Homepage
  ├── Hero sekce s vyhledáváním
  ├── Trust bar (důvěra)
  ├── Kategorie vozů (Netflix style)
  ├── Jak to funguje
  ├── TOP makléři
  └── CTA sekce

□ Katalog vozů (/vozy)
  ├── Filtry (značka, model, cena, km, palivo...)
  ├── Karty vozů
  ├── Stránkování
  └── Řazení
```

#### Týden 4: Detail vozu + Makléři
```
□ Detail vozu (/vozy/[slug])
  ├── Fotogalerie
  ├── Technické údaje
  ├── Trust Score badge
  ├── Kontaktní formulář
  ├── Profil makléře (mini)
  └── Podobné vozy

□ Seznam makléřů (/makleri)
  ├── Grid makléřů
  ├── Filtry (město)
  └── Profil makléře (/makleri/[slug])
```

### FÁZE 2: PWA PRO MAKLÉŘE (3 týdny)

#### Týden 5: PWA Setup + Dashboard
```
□ PWA konfigurace
  ├── next-pwa nebo Serwist
  ├── manifest.json
  ├── Service Worker
  ├── Offline support
  └── App icons

□ Dashboard makléře
  ├── Přehled (provize, prodeje, aktivní vozy)
  ├── Notifikace
  ├── Rychlé akce
  └── Bottom navigation
```

#### Týden 6: Správa vozů v PWA
```
□ Přidání vozu (4 kroky)
  ├── Krok 1: VIN zadání/scan
  ├── Krok 2: Základní údaje
  ├── Krok 3: Fotky (mobilní focení)
  └── Krok 4: Cena + popis

□ Seznam mých vozů
  ├── Filtry podle statusu
  ├── Editace vozu
  ├── Změna ceny (s důvodem)
  └── Změna statusu
```

#### Týden 7: Provize + Profil
```
□ Provize
  ├── Dashboard provizí
  ├── Historie
  └── Export

□ Profil makléře
  ├── Editace údajů
  ├── Nastavení notifikací
  └── Statistiky
```

### FÁZE 3: ADMIN PANEL (2 týdny)

#### Týden 8: BackOffice základy
```
□ Dashboard
  ├── Statistiky
  ├── Čekající schválení
  └── Aktivita

□ Správa uživatelů
  ├── Seznam makléřů
  ├── Schvalování
  ├── Deaktivace
  └── Přiřazení k manažerovi
```

#### Týden 9: Správa vozů + Provize
```
□ Správa vozů
  ├── Fronta ke schválení
  ├── Checklist kontroly
  ├── Schválení/Zamítnutí
  └── Historie změn

□ Provize
  ├── Přehled provizí
  ├── Generování výplat
  └── Export
```

### FÁZE 4: BOOM FUNKCE (4 týdny)

#### Týden 10: Trust & Live features
```
□ Trust Score
  ├── Výpočet skóre (0-100)
  ├── Badge na detailu
  └── Auto-update při změnách

□ Live viewers
  ├── Real-time počítadlo
  ├── "X lidí prohlíží"
  └── Pusher/Socket.io integrace
```

#### Týden 11: Komunikace
```
□ Rezervace prohlídek
  ├── Kalendář makléře
  ├── Výběr termínu
  ├── SMS ověření
  └── Připomínky

□ Anonymní chat
  ├── Real-time messaging
  ├── Šablony zpráv
  └── Notifikace
```

#### Týden 12: AI & Search
```
□ Smart Search (AI)
  ├── NLP parsing dotazu
  ├── OpenAI/Claude API
  └── Suggestions

□ Hlídač ceny
  ├── Uložené filtry
  ├── Email notifikace
  └── Price drop alerts
```

#### Týden 13: Offer systém + CRM
```
□ Offer systém
  ├── Nabídka ceny
  ├── Protinávrhy
  └── Notifikace

□ CRM pro makléře
  ├── Pipeline (Kanban)
  ├── Leady
  └── Follow-up připomínky
```

### FÁZE 5: INTEGRACE + LAUNCH (2 týdny)

#### Týden 14: Integrace
```
□ VIN dekodér
  ├── Vlastní DB
  └── NHTSA fallback

□ Mapy.cz
  ├── Geocoding
  └── Zobrazení lokace

□ Email (Resend)
  ├── Šablony
  └── Transakční emaily
```

#### Týden 15: Testing + Launch
```
□ Testing
  ├── E2E testy (Playwright)
  ├── Unit testy
  ├── Performance audit
  └── Security audit

□ Launch
  ├── SEO optimalizace
  ├── Analytics (Vercel)
  ├── Error tracking (Sentry)
  └── Go-live!
```

---

## 🏗️ TECHNICKÝ STACK

### Frontend
```
Next.js 15          - App Router, Server Components
TypeScript          - Type safety
Tailwind CSS        - Styling
Framer Motion       - Animace
React Hook Form     - Formuláře
Zod                 - Validace
```

### Backend
```
Next.js API Routes  - API endpoints
Prisma              - ORM
PostgreSQL          - Databáze (Neon/Supabase)
NextAuth.js         - Autentizace
```

### PWA
```
Serwist             - Service Worker
IndexedDB           - Offline storage
Workbox             - Caching strategies
```

### Integrace
```
Pusher              - Real-time (chat, live viewers)
Resend              - Emaily
Cloudinary          - Obrázky
Mapy.cz API         - Mapy
OpenAI/Claude       - AI search
```

### DevOps
```
Vercel              - Hosting
GitHub              - Verzování
Turborepo           - Monorepo (optional)
Sentry              - Error tracking
```

---

## 📁 STRUKTURA PROJEKTU

```
carmakler/
├── app/
│   ├── (web)/                    # Veřejný web
│   │   ├── page.tsx              # Homepage
│   │   ├── vozy/
│   │   │   ├── page.tsx          # Katalog
│   │   │   └── [slug]/page.tsx   # Detail vozu
│   │   ├── makleri/
│   │   │   ├── page.tsx          # Seznam makléřů
│   │   │   └── [slug]/page.tsx   # Profil makléře
│   │   ├── prodat-auto/page.tsx  # Landing pro prodej
│   │   └── jak-to-funguje/page.tsx
│   │
│   ├── (pwa)/                    # PWA pro makléře
│   │   ├── dashboard/page.tsx
│   │   ├── vozy/
│   │   │   ├── page.tsx          # Moje vozy
│   │   │   ├── pridat/page.tsx   # Přidat vůz
│   │   │   └── [id]/page.tsx     # Editace
│   │   ├── provize/page.tsx
│   │   ├── chat/page.tsx
│   │   └── profil/page.tsx
│   │
│   ├── (admin)/                  # Admin panel
│   │   ├── dashboard/page.tsx
│   │   ├── uzivatele/page.tsx
│   │   ├── vozidla/page.tsx
│   │   └── provize/page.tsx
│   │
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── vehicles/
│   │   ├── users/
│   │   ├── commissions/
│   │   └── webhooks/
│   │
│   └── layout.tsx
│
├── components/
│   ├── ui/                       # Základní UI komponenty
│   ├── web/                      # Web komponenty
│   ├── pwa/                      # PWA komponenty
│   └── admin/                    # Admin komponenty
│
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── api/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
│
└── styles/
    └── globals.css
```

---

## 💾 DATABÁZOVÉ SCHEMA (Prisma)

```prisma
// Základní modely pro MVP

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  phone         String?
  passwordHash  String
  firstName     String
  lastName      String
  avatar        String?
  role          Role      @default(BROKER)
  status        UserStatus @default(PENDING)
  
  // Hierarchie
  managerId     String?
  manager       User?     @relation("ManagerToBroker", fields: [managerId], references: [id])
  teamMembers   User[]    @relation("ManagerToBroker")
  
  // Region
  regionId      String?
  region        Region?   @relation(fields: [regionId], references: [id])
  
  // Specializace
  specializations String[]
  cities          String[]
  bio             String?
  
  // Vozidla
  vehicles      Vehicle[]
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
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

model Vehicle {
  id              String        @id @default(cuid())
  
  // VIN (READONLY po uložení!)
  vin             String        @unique
  vinLocked       Boolean       @default(false)
  
  // Základní info
  brand           String
  model           String
  variant         String?
  year            Int
  mileage         Int
  
  // Motor
  fuelType        FuelType
  transmission    Transmission
  enginePower     Int?
  engineCapacity  Int?
  
  // Karoserie
  bodyType        BodyType?
  color           String?
  doorsCount      Int?
  seatsCount      Int?
  
  // Stav
  condition       VehicleCondition
  stkValidUntil   DateTime?
  serviceBook     Boolean       @default(false)
  
  // Cena
  price           Int
  priceNegotiable Boolean       @default(true)
  
  // Popis
  equipment       String[]
  description     String?
  
  // Status
  status          VehicleStatus @default(DRAFT)
  
  // Makléř
  brokerId        String?
  broker          User?         @relation(fields: [brokerId], references: [id])
  
  // Lokace
  city            String
  district        String?
  latitude        Float?
  longitude       Float?
  
  // Trust Score
  trustScore      Int           @default(0)
  
  // Stats
  viewCount       Int           @default(0)
  
  // Relace
  images          VehicleImage[]
  changeLog       VehicleChangeLog[]
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  publishedAt     DateTime?

  @@index([brand, model])
  @@index([status])
  @@index([brokerId])
}

model VehicleImage {
  id          String   @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  url         String
  order       Int      @default(0)
  isPrimary   Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model VehicleChangeLog {
  id          String   @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  userId      String
  field       String
  oldValue    String?
  newValue    String?
  reason      String?
  flagged     Boolean  @default(false)
  flagReason  String?
  createdAt   DateTime @default(now())
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

enum VehicleCondition {
  NEW
  LIKE_NEW
  EXCELLENT
  GOOD
  FAIR
  DAMAGED
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
```

---

## 🎨 DESIGN SYSTÉM

### Barvy
```css
/* Primary - Orange */
--orange-500: #F97316;
--orange-600: #EA580C;

/* Neutrals */
--gray-50: #FAFAFA;
--gray-100: #F4F4F5;
--gray-500: #71717A;
--gray-900: #18181B;

/* Semantic */
--green-500: #22C55E;  /* Success, Verified */
--red-500: #EF4444;    /* Error, Live dot */
--blue-500: #3B82F6;   /* Info */
```

### Typografie
```css
/* Font */
font-family: 'Outfit', sans-serif;

/* Sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 36px;
--text-5xl: 48px;
```

### Komponenty
- Buttons (Primary, Secondary, Ghost, Outline)
- Cards (Vehicle, Broker, Trust)
- Badges (Verified, TOP, Live)
- Forms (Input, Select, Textarea)
- Navigation (Navbar, Bottom nav, Tabs)

---

## 📱 PWA FEATURES

### Offline Support
- Drafty vozů uložené lokálně (IndexedDB)
- Cached images
- Offline-first architektura

### Push Notifications
- Nový lead
- Inzerát schválen/zamítnut
- Nový dotaz v chatu
- Provize schválena

### Mobile Features
- Kamera pro focení vozů
- VIN scanner (OCR)
- Geolokace pro lokaci vozu
- Share API

---

## 🚀 DEPLOYMENT

### Environments
```
DEV:     carmakler-dev.vercel.app
STAGING: carmakler-staging.vercel.app
PROD:    carmakler.cz
```

### CI/CD
```
GitHub Actions:
├── Lint + Type check
├── Unit tests
├── E2E tests (Playwright)
├── Build
└── Deploy to Vercel
```

---

## 📊 METRIKY ÚSPĚCHU

### Launch (Týden 1-2)
- [ ] 50+ registrovaných makléřů
- [ ] 100+ inzerátů
- [ ] 1000+ návštěv

### Měsíc 1
- [ ] 200+ aktivních makléřů
- [ ] 500+ inzerátů
- [ ] 10 000+ návštěv
- [ ] 10+ uzavřených obchodů

### Měsíc 3
- [ ] 500+ makléřů
- [ ] 2000+ inzerátů
- [ ] 50 000+ návštěv/měsíc
- [ ] 100+ uzavřených obchodů

---

## ⚠️ RIZIKA A MITIGACE

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Nedostatek makléřů | Střední | Vysoký | Recruitment kampaň, incentives |
| Technické problémy | Nízká | Střední | Testing, monitoring, rollback |
| Konkurence | Střední | Střední | Diferenciace (BOOM funkce) |
| Nízká adopce PWA | Střední | Nízký | Onboarding, training |

---

## 📞 KONTAKTY A ROLE

| Role | Zodpovědnost |
|------|--------------|
| Product Owner | Prioritizace, requirements |
| Developer | Frontend + Backend |
| Designer | UI/UX (pokud externě) |
| QA | Testování |

---

## ✅ CHECKLIST PRO START

- [ ] Schválení plánu
- [ ] Založení GitHub repo
- [ ] Nastavení Vercel projektu
- [ ] Databáze (Neon/Supabase)
- [ ] Design systém ready
- [ ] Prisma schema ready
- [ ] První commit

---

**Odhadovaná doba vývoje:** 15 týdnů (cca 4 měsíce)
**Start:** [DOPLNIT DATUM]
**Plánovaný launch:** [DOPLNIT DATUM]
