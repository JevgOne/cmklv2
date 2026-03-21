# CARMAKLER - Inzerce & Shop moduly

## 📋 Přehled

Dva dodatečné moduly rozšiřující Carmakler ekosystém:

1. **INZERCE** - Placené balíčky pro zvýraznění inzerátů
2. **SHOP** - E-shop s autodoplňky a příslušenstvím

---

# 📢 MODUL: INZERCE

## Přehled

Systém placených balíčků pro majitele vozidel (prodejce), kteří chtějí zvýšit viditelnost svých inzerátů.

**Cílová skupina:** Soukromí prodejci, malé autobazary bez makléře

---

## 💰 Balíčky inzerce

### BASIC (Zdarma)
```
Cena: 0 Kč
Doba: 60 dní

Funkce:
├── ✓ Základní inzerát
├── ✓ 15 fotek
├── ✓ Popis 2000 znaků
├── ✗ Žádné zvýraznění
├── ✗ Bez statistik
└── ✗ Bez podpory

Pozice: Spodní část výsledků
Viditelnost: Nízká
```

### PRO (2 990 Kč)
```
Cena: 2 990 Kč
Doba: 30 dní

Funkce:
├── ✓ Vše z BASIC
├── ✓ 30 fotek + video
├── ✓ Zvýrazněný inzerát (oranžový rámeček)
├── ✓ Prioritní pozice ve výsledcích
├── ✓ Badge "PRO inzerát"
├── ✓ Statistiky zobrazení
├── ✓ 1× TOPOVÁNÍ zdarma
├── ✓ Email notifikace při zájmu
└── ✓ Chat s kupci

Pozice: Horní polovina výsledků
Viditelnost: Vysoká
```

### ELITE (4 990 Kč)
```
Cena: 4 990 Kč
Doba: 30 dní

Funkce:
├── ✓ Vše z PRO
├── ✓ 50 fotek + 3 videa
├── ✓ TOP pozice (první stránka)
├── ✓ XXL karta (2× větší)
├── ✓ Badge "ELITE" (zlatý)
├── ✓ Rotace na homepage
├── ✓ 3× TOPOVÁNÍ zdarma
├── ✓ Detailní analytika
├── ✓ Prioritní podpora
├── ✓ Sdílení na sociální sítě
└── ✓ Profesionální konzultace (15 min)

Pozice: Vždy nahoře
Viditelnost: Maximální
```

### TURBO (990 Kč / 7 dní)
```
Cena: 990 Kč
Doba: 7 dní

Speciální krátkodobý boost:
├── ✓ TOP pozice na 7 dní
├── ✓ Zvýraznění "AKCE"
├── ✓ Push notifikace sledujícím
└── ✓ Social media boost

Ideální pro: Rychlý prodej, snížení ceny
```

---

## 🔝 Topování (jednorázové)

```
TOPOVÁNÍ - 199 Kč / jednorázově

Efekt:
├── Inzerát vyskočí na TOP pozice
├── Trvání efektu: 24 hodin
├── Badge "Právě topováno"
└── Push sledujícím značky/modelu

Limity:
├── Max 1× za 48 hodin
└── Kumuluje se s balíčkem
```

---

## 📊 Statistiky pro inzerenty

### Basic stats (PRO+)
```
├── Počet zobrazení
├── Počet prokliků na detail
├── Počet uložení do oblíbených
├── Počet dotazů/zpráv
└── Graf vývoje za období
```

### Advanced analytics (ELITE)
```
├── Vše z Basic
├── Demografika návštěvníků
├── Zdroje trafficu
├── Porovnání s konkurencí
├── Doporučení ceny (AI)
├── Heat mapa fotek
└── A/B test titulků
```

---

## 🗃️ Databázový model - Inzerce

```prisma
model ListingPackage {
  id              String   @id @default(cuid())
  
  // Balíček
  type            PackageType
  price           Int
  durationDays    Int
  
  // Vztahy
  vehicleId       String
  vehicle         Vehicle  @relation(fields: [vehicleId], references: [id])
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  // Platnost
  startsAt        DateTime
  expiresAt       DateTime
  isActive        Boolean  @default(true)
  
  // Topování
  topsIncluded    Int      @default(0)
  topsUsed        Int      @default(0)
  
  // Platba
  paymentId       String?
  paymentStatus   PaymentStatus
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum PackageType {
  BASIC
  PRO
  ELITE
  TURBO
}

model ListingTop {
  id              String   @id @default(cuid())
  
  vehicleId       String
  vehicle         Vehicle  @relation(fields: [vehicleId], references: [id])
  
  packageId       String?  // Pokud bylo z balíčku
  package         ListingPackage? @relation(fields: [packageId], references: [id])
  
  price           Int      // 0 pokud z balíčku, jinak 199
  
  activatedAt     DateTime @default(now())
  expiresAt       DateTime // +24h
  
  // Výsledky
  viewsBefore     Int
  viewsAfter      Int?
}

model ListingStats {
  id              String   @id @default(cuid())
  
  vehicleId       String
  vehicle         Vehicle  @relation(fields: [vehicleId], references: [id])
  
  date            DateTime @db.Date
  
  views           Int      @default(0)
  detailViews     Int      @default(0)
  favorites       Int      @default(0)
  messages        Int      @default(0)
  phoneClicks     Int      @default(0)
  
  @@unique([vehicleId, date])
}
```

---

## 🎨 UI komponenty - Inzerce

### Pricing Table
```
┌─────────────────────────────────────────────────────────────┐
│                    VYBERTE BALÍČEK                          │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│   BASIC     │    PRO      │   ELITE     │    TURBO       │
│   Zdarma    │  2 990 Kč   │  4 990 Kč   │   990 Kč       │
│             │  /30 dní    │  /30 dní    │   /7 dní       │
├─────────────┼─────────────┼─────────────┼─────────────────┤
│ 15 fotek    │ 30 fotek    │ 50 fotek    │ Boost stáv.    │
│ Základní    │ + video     │ + 3 videa   │ inzerátu       │
│ pozice      │ Zvýraznění  │ XXL karta   │                │
│             │ 1× TOP      │ 3× TOP      │ TOP 7 dní      │
│             │ Statistiky  │ Homepage    │ Push notif.    │
│             │ Chat        │ Konzultace  │                │
├─────────────┼─────────────┼─────────────┼─────────────────┤
│  [ZVOLIT]   │ [OBLÍBENÝ]  │  [ZVOLIT]   │   [ZVOLIT]     │
│             │   ⭐⭐⭐    │             │                │
└─────────────┴─────────────┴─────────────┴─────────────────┘
```

### Package Badge na kartě
```
┌─────────────────────────────────┐
│ [ELITE ⭐]  BMW 330i xDrive    │  ← Zlatý badge
│ ══════════════════════════════ │  ← Zlatý border
│ [XXL FOTKA]                    │
│                                │
│ 2020 · 45 000 km · Praha       │
│                                │
│         589 000 Kč             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ [PRO]  Škoda Octavia RS        │  ← Oranžový badge
│ ══════════════════════════════ │  ← Oranžový border
│ [FOTKA]                        │
│                                │
│ 2021 · 32 000 km · Brno        │
│                                │
│         485 000 Kč             │
└─────────────────────────────────┘
```

---

# 🛒 MODUL: SHOP

## Přehled

E-shop s autodoplňky, kosmetikou a příslušenstvím integrovaný do Carmakler ekosystému.

**URL:** shop.carmakler.cz nebo carmakler.cz/shop  
**Cílová skupina:** Majitelé aut, kupující na Carmakler

---

## 📦 Kategorie produktů

### 1. AUTOKOSMETIKA
```
├── Mytí a čištění
│   ├── Autošampony
│   ├── Čističe disků
│   ├── Čističe interiéru
│   └── Odstraňovače hmyzu
│
├── Ochrana a leštění
│   ├── Vosky a sealanty
│   ├── Keramické povlaky
│   ├── Leštěnky
│   └── Quick detailery
│
├── Interiér
│   ├── Čističe kůže
│   ├── Impregnace textilu
│   ├── Osvěžovače vzduchu
│   └── Čističe plastů
│
└── Příslušenství
    ├── Mikrovláknové utěrky
    ├── Aplikátory
    ├── Mycí rukavice
    └── Leštící kotouče
```

### 2. AUTODOPLŇKY
```
├── Interiér
│   ├── Potahy sedadel
│   ├── Koberečky
│   ├── Organizéry
│   ├── Držáky na telefon
│   └── USB nabíječky
│
├── Exteriér
│   ├── Stěrače
│   ├── Deflektory
│   ├── Střešní nosiče
│   └── Tažná zařízení
│
└── Bezpečnost
    ├── Parkovací senzory
    ├── Kamery
    ├── Alarmy
    └── GPS trackery
```

### 3. NÁHRADNÍ DÍLY (basic)
```
├── Filtry
│   ├── Olejové
│   ├── Vzduchové
│   ├── Kabinové
│   └── Palivové
│
├── Provozní kapaliny
│   ├── Motorové oleje
│   ├── Brzdové kapaliny
│   ├── Chladicí kapaliny
│   └── Kapaliny do ostřikovačů
│
└── Osvětlení
    ├── Žárovky
    ├── LED sady
    └── Xenonové výbojky
```

### 4. CARMAKLER MERCH
```
├── Oblečení
│   ├── Trička
│   ├── Mikiny
│   └── Čepice
│
├── Doplňky
│   ├── Klíčenky
│   ├── Samolepky
│   └── Hrnky
│
└── Pro makléře
    ├── Vizitky (objednávka)
    ├── Roll-upy
    └── Promo materiály
```

---

## 🎯 Speciální funkce

### Doporučení podle vozu
```
"Máte BMW 330i? Doporučujeme:"
├── Originální BMW vosk - 890 Kč
├── Koberečky 3D - 1 290 Kč
└── LED interiér sada - 590 Kč

Funguje na základě:
├── Vozidla uživatele (z profilu)
├── Prohlíženého inzerátu
└── Historie nákupů
```

### Bundle "Nové auto"
```
Po koupi vozu přes Carmakler:
┌─────────────────────────────────┐
│  🎁 STARTER KIT pro váš nový   │
│     BMW 330i xDrive            │
│                                │
│  ├── Autošampon Koch           │
│  ├── Quick detailer            │
│  ├── 5× mikrovláknová utěrka   │
│  ├── Osvěžovač                 │
│  └── Klíčenka Carmakler        │
│                                │
│  Běžná cena: 1 890 Kč          │
│  VAŠE CENA:  1 290 Kč (-32%)   │
│                                │
│  [PŘIDAT DO KOŠÍKU]            │
└─────────────────────────────────┘
```

### Servisní balíčky
```
"Výměna oleje - DIY kit pro BMW 330i"
├── Olej Castrol Edge 5W-30 5L
├── Originální olejový filtr
├── Těsnící kroužek
├── Návod krok za krokem (video)
└── Likvidace starého oleje info

Cena: 1 890 Kč (úspora vs. servis: ~1 500 Kč)
```

---

## 💰 Obchodní model

### Marže
```
Kategorie          Průměrná marže
─────────────────────────────────
Autokosmetika      35-45%
Autodoplňky        25-35%
Náhradní díly      15-25%
Merch              50-70%
```

### Doprava
```
├── Zásilkovna: 69 Kč (zdarma nad 1 500 Kč)
├── PPL: 99 Kč (zdarma nad 2 000 Kč)
├── Osobní odběr: Zdarma (Praha showroom)
└── Expresní (do 24h): +150 Kč
```

### Věrnostní program
```
Carmakler body:
├── 1 Kč = 1 bod
├── 100 bodů = 1 Kč sleva
├── Bonus za nákup vozu: 5 000 bodů
├── Bonus za prodej přes makléře: 2 000 bodů
└── Narozeninový bonus: 500 bodů

VIP statusy:
├── Bronze: 0+ bodů (základní)
├── Silver: 5 000+ bodů (+5% sleva)
├── Gold: 15 000+ bodů (+10% sleva, priority)
└── Platinum: 50 000+ bodů (+15% sleva, exkluzivní)
```

---

## 🗃️ Databázový model - Shop

```prisma
// Produkt
model Product {
  id              String   @id @default(cuid())
  
  // Základní info
  name            String
  slug            String   @unique
  description     String   @db.Text
  shortDesc       String?
  
  // Kategorie
  categoryId      String
  category        ProductCategory @relation(fields: [categoryId], references: [id])
  
  // Ceny
  price           Int      // V haléřích
  comparePrice    Int?     // Původní cena (pro slevu)
  costPrice       Int?     // Nákupní cena
  
  // Sklad
  sku             String   @unique
  barcode         String?
  stockQuantity   Int      @default(0)
  lowStockAlert   Int      @default(5)
  trackInventory  Boolean  @default(true)
  
  // Vlastnosti
  weight          Int?     // V gramech
  dimensions      Json?    // {width, height, depth}
  
  // Kompatibilita s vozy
  compatibleMakes    String[]  // ["BMW", "Audi"]
  compatibleModels   Json?     // Detailnější mapping
  
  // SEO
  metaTitle       String?
  metaDescription String?
  
  // Status
  status          ProductStatus @default(DRAFT)
  featured        Boolean  @default(false)
  
  // Vztahy
  images          ProductImage[]
  variants        ProductVariant[]
  reviews         ProductReview[]
  orderItems      OrderItem[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum ProductStatus {
  DRAFT
  ACTIVE
  OUT_OF_STOCK
  DISCONTINUED
}

model ProductCategory {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  description     String?
  image           String?
  parentId        String?
  parent          ProductCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        ProductCategory[] @relation("CategoryHierarchy")
  products        Product[]
  
  sortOrder       Int      @default(0)
}

model ProductImage {
  id              String   @id @default(cuid())
  productId       String
  product         Product  @relation(fields: [productId], references: [id])
  url             String
  alt             String?
  sortOrder       Int      @default(0)
}

model ProductVariant {
  id              String   @id @default(cuid())
  productId       String
  product         Product  @relation(fields: [productId], references: [id])
  
  name            String   // "500ml", "Červená", atd.
  sku             String   @unique
  price           Int?     // Pokud jiná než base
  stockQuantity   Int      @default(0)
  
  options         Json     // {size: "500ml", color: "red"}
}

// Objednávka
model Order {
  id              String   @id @default(cuid())
  orderNumber     String   @unique
  
  // Zákazník
  userId          String?
  user            User?    @relation(fields: [userId], references: [id])
  email           String
  phone           String?
  
  // Adresy
  shippingAddress Json
  billingAddress  Json?
  
  // Položky
  items           OrderItem[]
  
  // Ceny
  subtotal        Int
  shippingCost    Int
  discount        Int      @default(0)
  total           Int
  
  // Sleva / kupón
  couponCode      String?
  couponDiscount  Int      @default(0)
  loyaltyPoints   Int      @default(0)  // Použité body
  
  // Doprava
  shippingMethod  ShippingMethod
  trackingNumber  String?
  
  // Platba
  paymentMethod   PaymentMethod
  paymentStatus   PaymentStatus
  paidAt          DateTime?
  
  // Status
  status          OrderStatus @default(PENDING)
  
  // Poznámky
  customerNote    String?
  internalNote    String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum ShippingMethod {
  ZASILKOVNA
  PPL
  DPD
  PICKUP
  EXPRESS
}

enum PaymentMethod {
  CARD
  BANK_TRANSFER
  COD  // Dobírka
  GOPAY
  APPLE_PAY
  GOOGLE_PAY
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

model OrderItem {
  id              String   @id @default(cuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id])
  
  productId       String
  product         Product  @relation(fields: [productId], references: [id])
  variantId       String?
  
  name            String   // Snapshot názvu
  sku             String
  price           Int      // Cena v době objednávky
  quantity        Int
  total           Int
}

// Věrnostní program
model LoyaltyAccount {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  
  points          Int      @default(0)
  lifetimePoints  Int      @default(0)
  tier            LoyaltyTier @default(BRONZE)
  
  transactions    LoyaltyTransaction[]
}

enum LoyaltyTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}

model LoyaltyTransaction {
  id              String   @id @default(cuid())
  accountId       String
  account         LoyaltyAccount @relation(fields: [accountId], references: [id])
  
  type            LoyaltyTxType
  points          Int      // + nebo -
  description     String
  orderId         String?
  
  createdAt       DateTime @default(now())
}

enum LoyaltyTxType {
  PURCHASE        // Nákup
  REDEMPTION      // Použití bodů
  BONUS           // Bonus (narozeniny, promo)
  VEHICLE_PURCHASE // Koupě auta
  VEHICLE_SALE    // Prodej přes makléře
  EXPIRATION      // Expirace bodů
  ADJUSTMENT      // Manuální úprava
}

// Recenze produktů
model ProductReview {
  id              String   @id @default(cuid())
  productId       String
  product         Product  @relation(fields: [productId], references: [id])
  
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  rating          Int      // 1-5
  title           String?
  content         String   @db.Text
  
  // Ověření
  verified        Boolean  @default(false)  // Ověřený nákup
  orderId         String?  // Odkaz na objednávku
  
  // Moderace
  status          ReviewStatus @default(PENDING)
  
  // Helpfulness
  helpfulCount    Int      @default(0)
  
  createdAt       DateTime @default(now())
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}
```

---

## 🎨 UI komponenty - Shop

### Product Card
```
┌─────────────────────────────────┐
│        [PRODUKT FOTO]           │
│                                 │
│  -25%                  ❤️       │
└─────────────────────────────────┘
│ Koch Chemie GSF                 │
│ Autošampon 1L                   │
│                                 │
│ ⭐⭐⭐⭐⭐ (127)                │
│                                 │
│ ██░░ 299 Kč  ̶3̶9̶9̶ ̶K̶č̶            │
│                                 │
│ [🛒 DO KOŠÍKU]                  │
└─────────────────────────────────┘
```

### Cart Sidebar
```
┌─────────────────────────────────┐
│  🛒 KOŠÍK (3)              [✕] │
├─────────────────────────────────┤
│  ┌─────┐                       │
│  │ IMG │ Koch GSF 1L           │
│  └─────┘ 299 Kč    [- 1 +] [🗑]│
│  ┌─────┐                       │
│  │ IMG │ Mikrovlákno 5ks       │
│  └─────┘ 199 Kč    [- 2 +] [🗑]│
│  ┌─────┐                       │
│  │ IMG │ Quick Detailer        │
│  └─────┘ 349 Kč    [- 1 +] [🗑]│
├─────────────────────────────────┤
│  Mezisoučet:          847 Kč   │
│  Doprava:              69 Kč   │
│  ───────────────────────────   │
│  CELKEM:              916 Kč   │
│                                │
│  💡 Přidejte 584 Kč pro        │
│     dopravu ZDARMA             │
│                                │
│  [    K POKLADNĚ    ]          │
└─────────────────────────────────┘
```

### Checkout Flow
```
KROK 1: Doprava
├── ○ Zásilkovna (69 Kč) - Výběr pobočky
├── ○ PPL (99 Kč) - Doručení na adresu
├── ○ Osobní odběr (Zdarma) - Praha
└── ○ Express 24h (+150 Kč)

KROK 2: Platba
├── ○ Kartou online
├── ○ Apple Pay / Google Pay
├── ○ Bankovní převod
└── ○ Dobírka (+39 Kč)

KROK 3: Shrnutí
├── Produkty
├── Doprava
├── Sleva / Body
└── [OBJEDNAT A ZAPLATIT]
```

---

## 📱 Admin panel - Shop

### Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│  SHOP DASHBOARD                              Dnes | Týden   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  45 890 Kč  │ │     23      │ │    4.8 ⭐   │           │
│  │  Tržby      │ │  Objednávek │ │  Hodnocení  │           │
│  │  ↑ 12%      │ │  ↑ 8%       │ │             │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  NOVÉ OBJEDNÁVKY (5)                         [ZOBRAZIT VŠE]│
│  ├── #1234 | Jan N. | 1 290 Kč | Zásilkovna | ⏳ Pending   │
│  ├── #1233 | Eva K. | 590 Kč | PPL | ⏳ Pending            │
│  └── ...                                                    │
│                                                             │
│  LOW STOCK ALERT (3)                                       │
│  ├── Koch GSF 1L - Zbývá 4 ks                              │
│  ├── Mikrovlákno Premium - Zbývá 2 ks                      │
│  └── Vosk Soft99 - Zbývá 1 ks                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Order Management
```
FILTRY: Status | Doprava | Platba | Datum

TABULKA:
│ # | Datum | Zákazník | Položky | Celkem | Doprava | Status | Akce │
├───┼───────┼──────────┼─────────┼────────┼─────────┼────────┼──────┤
│1234│ Dnes │ Jan N.  │ 3       │ 1290Kč │ Zásil.  │⏳Nová  │ [→]  │
│1233│ Dnes │ Eva K.  │ 1       │ 590Kč  │ PPL     │✓Odeslán│ [→]  │

DETAIL OBJEDNÁVKY:
├── Info zákazníka
├── Doručovací adresa
├── Položky s fotkami
├── Časová osa (vytvořeno → zaplaceno → odesláno → doručeno)
├── Tracking info
└── Akce: [Tisk štítku] [Odeslat] [Storno] [Refund]
```

### Product Management
```
SEZNAM PRODUKTŮ:
├── Foto | Název | SKU | Cena | Sklad | Status | Akce

NOVÝ PRODUKT:
├── Základní info (název, popis, cena)
├── Média (fotky, pořadí)
├── Varianty (velikost, barva)
├── Sklad (množství, SKU)
├── Kompatibilita (značky, modely vozů)
├── SEO (title, description, URL)
└── [ULOŽIT DRAFT] [PUBLIKOVAT]
```

---

## 🔗 Integrace s Carmakler

### Cross-sell na detailu vozu
```
Na stránce vozidla BMW 330i:

"Doporučené produkty pro tento vůz"
├── Originální koberečky BMW - 1 890 Kč
├── Sada na leštění laku - 790 Kč
└── LED interiér komplet - 590 Kč
```

### Post-purchase email
```
Po koupi vozu přes Carmakler:

Subject: "Gratulujeme k novému BMW! 🎉 Speciální nabídka"

├── Personalizovaný bundle pro model
├── Sleva 20% na první nákup
└── Bonus 500 věrnostních bodů
```

### Makléř referral
```
Makléř může doporučit produkty:
├── Odkaz se sledováním
├── 5% provize z nákupu
└── Integrováno do PWA makléře
```

---

## 📋 Implementační priority

### Fáze 1: MVP Shop (2 týdny)
```
├── Základní katalog produktů
├── Kategorie a filtrování
├── Košík a checkout
├── Platební brána (Stripe/GoPay)
├── Objednávkový systém
└── Email notifikace
```

### Fáze 2: Inzerce (1-2 týdny)
```
├── Balíčky (Basic, Pro, Elite, Turbo)
├── Topování
├── Platba za balíčky
├── Badge systém
└── Základní statistiky
```

### Fáze 3: Rozšíření (2 týdny)
```
├── Věrnostní program
├── Recenze produktů
├── Cross-sell integrace
├── Advanced analytics (inzerce)
├── Doporučení podle vozu
└── Bundle systém
```

---

*Dokument verze 1.0 | Březen 2026*
