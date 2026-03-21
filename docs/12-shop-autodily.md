# CARMAKLER SHOP - E-shop s autodíly

## 📋 Přehled

**Doména:** shop.carmakler.cz (nebo carmakler.cz/shop)  
**Typ:** E-shop s autodíly, příslušenstvím a autokosmetikou  
**Hlavní zboží:** Použité díly z vrakovišť, aftermarket díly, autokosmetika  
**Tech Stack:** Next.js 15, sdílená DB, Stripe/GoPay

---

## 🎯 Sortiment

### 1. DÍLY Z VRAKOVIŠŤ (Hlavní byznys)

```
KAROSERIE
├── Dveře (přední, zadní, L/P)
├── Blatníky
├── Kapoty
├── Víka zavazadlového prostoru
├── Nárazníky (přední, zadní)
├── Prahy
├── Zrcátka
├── Střešní okna / panorama
└── Mřížky, lišty, ozdobné prvky

MOTOR A PŘÍSLUŠENSTVÍ
├── Kompletní motory
├── Hlavy válců
├── Turbodmychadla
├── Vstřikovače
├── Čerpadla (palivová, olejová, vody)
├── Alternátory
├── Startéry
├── Kompresory klimatizace
└── Chladiče (vody, oleje, intercooler)

PŘEVODOVKA A POHON
├── Manuální převodovky
├── Automatické převodovky (DSG, AT)
├── Rozvodovky
├── Poloosy / hnací hřídele
├── Spojky
└── Setrvačníky (dvouhmotové)

PODVOZEK A ŘÍZENÍ
├── Nápravy komplet
├── Ramena
├── Tlumiče
├── Pružiny
├── Stabilizátory
├── Řízení (hřeben, čerpadlo)
└── Brzdové třmeny

ELEKTRO
├── Řídící jednotky (ECU, BCM, ...)
├── Přístrojové desky / budíky
├── Světlomety (přední, zadní)
├── Moduly (komfortní, ABS, ESP)
├── Kabely / svazky
└── Senzory

INTERIÉR
├── Sedačky (jednotlivé, sady)
├── Palubní desky
├── Volanty (včetně airbag)
├── Středové konzole
├── Obložení dveří
├── Stropnice
├── Koberečky originální
└── Multimediální jednotky / rádia

SKLA
├── Čelní skla
├── Boční skla
├── Zadní skla
└── Skla do dveří
```

### 2. AFTERMARKET DÍLY (Nové, neoriginál)

```
SERVISNÍ DÍLY
├── Filtry (olejové, vzduchové, kabinové, palivové)
├── Brzdové destičky
├── Brzdové kotouče
├── Rozvodové sady
├── Řemeny (klínové, drážkové)
├── Svíčky
├── Cívky
└── Lambda sondy

PODVOZKOVÉ DÍLY
├── Ramena (OEM kvalita)
├── Silentbloky
├── Čepy, kulové
├── Ložiska kol
├── Manžety
└── Stabilizátory, tyčky

KAROSÁŘSKÉ DÍLY
├── Blatníky (aftermarket)
├── Zrcátka
├── Nárazníky
├── Mřížky
└── Světla (aftermarket)
```

### 3. AUTOKOSMETIKA

```
MYTÍ A ČIŠTĚNÍ
├── Autošampony (Koch Chemie, Sonax, Meguiars)
├── Čističe disků
├── Čističe interiéru
├── Čističe motoru
├── Odstraňovače hmyzu
├── Odstraňovače asfaltu
└── Čističe skel

OCHRANA A LEŠTĚNÍ
├── Vosky (tuhé, tekuté)
├── Sealanty
├── Keramické povlaky (coating)
├── Leštěnky (brusné, finišovací)
├── Quick detailery
└── Ochrana plastů

INTERIÉR
├── Čističe kůže
├── Kondicionéry kůže
├── Impregnace textilu
├── Čističe plastů
├── Osvěžovače vzduchu
└── Čističe klimatizace

PŘÍSLUŠENSTVÍ
├── Mikrovláknové utěrky
├── Aplikátory
├── Mycí rukavice
├── Leštící kotouče
├── Rozprašovače
└── Kbelíky (se separátorem)

ZNAČKY
├── Koch Chemie
├── Sonax
├── Meguiars
├── Soft99
├── Gyeon
├── CarPro
├── Auto Finesse
└── Nanolex
```

### 4. AUTODOPLŇKY

```
INTERIÉR
├── Potahy sedadel (univerzální)
├── Koberečky (gumové, textilní)
├── Organizéry do kufru
├── Držáky na telefon
├── USB nabíječky
├── Bluetooth FM transmittery
└── Parkovací hodiny

EXTERIÉR
├── Stěrače
├── Střešní nosiče
├── Tažná zařízení (montáž)
├── Deflektory oken
├── Ochranné lišty
└── Emblemy / logo

BEZPEČNOST
├── Startovací kabely
├── Lékárničky
├── Výstražné trojúhelníky
├── Reflexní vesty
├── Hasicí přístroje
└── Nouzové kladivo
```

---

## 🏭 Dodavatelský model

### Vrakoviště - partneři

```
PRIMÁRNÍ ZDROJE:
├── Vrakoviště #1: [Název], [Město]
│   ├── Specializace: VW Group (Škoda, VW, Seat, Audi)
│   ├── Kontakt: [telefon]
│   └── Podmínky: Komise / nákup
│
├── Vrakoviště #2: [Název], [Město]
│   ├── Specializace: BMW, Mercedes, Opel
│   ├── Kontakt: [telefon]
│   └── Podmínky: Nákup
│
├── Vrakoviště #3: [Název], [Město]
│   ├── Specializace: Ford, Peugeot, Renault
│   └── ...
│
└── Online vrakoviště
    ├── vrakoviste.cz
    ├── dily-z-vraku.cz
    └── autonaradie.cz

BUSINESS MODEL:
├── Komise: Díl zůstává na vrakovišti, prodáme → vyplatíme
├── Nákup: Nakoupíme předem, máme na skladě
└── Drop-ship: Objednávka jde přímo z vrakoviště k zákazníkovi
```

### Aftermarket díly - velkoobchody

```
DODAVATELÉ:
├── Auto Kelly
├── Stahlgruber
├── Inter Cars
├── Elit CZ
├── APM Automotive
└── AD Partner

ZNAČKY:
├── Febi Bilstein
├── Lemförder
├── TRW
├── ATE
├── Bosch
├── NGK
├── Denso
├── Mann Filter
├── Mahle
└── SKF
```

### Autokosmetika - distributoři

```
DODAVATELÉ:
├── Koch Chemie CZ (přímý)
├── Sonax CZ (přímý)
├── DetailingShop.cz (velkoobchod)
├── Racoon.cz
└── AutoKosmetika.cz

MARŽE:
├── Autokosmetika: 35-45%
├── Příslušenství: 25-35%
└── Díly z vraků: 40-60%
```

---

## 💰 Cenová politika

### Díly z vrakovišť

```
NACENĚNÍ:
├── Nákupní cena + 50-80% marže
├── Zohlednit stav dílu (1-5 hvězdiček)
├── Zohlednit vzácnost (běžný vs. rare)
└── Porovnat s konkurencí (Sauto, vrakoviště)

PŘÍKLAD - Dveře Škoda Octavia 3:
├── Nákup (vrakoviště): 2 500 Kč
├── Naše cena: 4 500 Kč
├── Marže: 80%
└── Konkurence: 4 000 - 6 000 Kč

STAVY DÍLŮ:
├── ⭐⭐⭐⭐⭐ Výborný - bez poškození, originál lak
├── ⭐⭐⭐⭐ Velmi dobrý - drobné oděrky
├── ⭐⭐⭐ Dobrý - viditelné opotřebení, funkční
├── ⭐⭐ Použitelný - vyžaduje opravu/lakování
└── ⭐ Na díly - pouze jako zdroj náhradních dílů
```

### Aftermarket díly

```
NACENĚNÍ:
├── Doporučená cena výrobce
├── Nebo velkoobchodní + 25-35%
└── Sledovat konkurenci (Auto Kelly, Inter Cars)

CENOVÉ KATEGORIE:
├── Economy - nejlevnější, základní kvalita
├── OEM Quality - odpovídá originálu
└── Premium - nadstandardní kvalita/záruka
```

### Autokosmetika

```
NACENĚNÍ:
├── Doporučená maloobchodní cena
├── Slevy při větších objednávkách
└── Bundle ceny (sady)

AKCE:
├── Sezónní slevy (jaro = mytí, zima = ochrana)
├── Black Friday
├── Věrnostní slevy
└── Bundle sleva (komplet sada = -15%)
```

---

## 🔍 Vyhledávání dílů

### Podle vozu (hlavní způsob)

```
KROK 1: Výběr vozu
┌─────────────────────────────────────────────────────────────┐
│  NAJÍT DÍLY PRO VÁŠ VŮZ                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Značka:  [Škoda          ▼]                               │
│  Model:   [Octavia        ▼]                               │
│  Rok:     [2018           ▼]                               │
│  Motor:   [2.0 TDI 110kW  ▼]                               │
│                                                             │
│  Nebo zadejte VIN: [TMBXXXXXXXXXXXXXXX    ]                │
│                                                             │
│                    [HLEDAT DÍLY]                            │
└─────────────────────────────────────────────────────────────┘

KROK 2: Výběr kategorie
┌─────────────────────────────────────────────────────────────┐
│  ŠKODA OCTAVIA III 2.0 TDI (2018)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ 🚗      │ │ ⚙️      │ │ 🔧      │ │ 💡      │          │
│  │Karoserie│ │ Motor   │ │Podvozek │ │ Elektro │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ 🪟      │ │ 🛋️      │ │ 🧴      │ │ 🔩      │          │
│  │  Skla   │ │Interiér │ │Kosmetika│ │Servisní │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

KROK 3: Seznam dílů
┌─────────────────────────────────────────────────────────────┐
│  KAROSERIE > DVEŘE                     Nalezeno: 8 dílů    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [FOTO]  Dveře přední levé                          │   │
│  │         Octavia III (5E) 2013-2020                 │   │
│  │         Stav: ⭐⭐⭐⭐ Velmi dobrý                   │   │
│  │         Barva: Bílá (LS9R)                         │   │
│  │         Z vraku: #V2847 (2019, 85k km)             │   │
│  │                                                     │   │
│  │         4 500 Kč              [DO KOŠÍKU]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [FOTO]  Dveře přední levé                          │   │
│  │         Octavia III (5E) 2013-2020                 │   │
│  │         Stav: ⭐⭐⭐ Dobrý                          │   │
│  │         Barva: Černá (LC9X) - odřený               │   │
│  │                                                     │   │
│  │         3 200 Kč              [DO KOŠÍKU]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fulltext vyhledávání

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 [motor 2.0 tdi octavia                    ] [HLEDAT]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Výsledky pro "motor 2.0 tdi octavia":                     │
│                                                             │
│  DÍLY Z VRAKŮ (12)                                         │
│  ├── Motor 2.0 TDI DFGA komplet - 45 000 Kč               │
│  ├── Hlava válců 2.0 TDI - 8 500 Kč                       │
│  ├── Turbodmychadlo 2.0 TDI - 12 000 Kč                   │
│  └── [Zobrazit vše →]                                      │
│                                                             │
│  AFTERMARKET (24)                                          │
│  ├── Olejový filtr 2.0 TDI - 189 Kč                       │
│  ├── Vzduchový filtr 2.0 TDI - 349 Kč                     │
│  └── [Zobrazit vše →]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛒 Nákupní proces

### Product karta (díl z vraku)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Zpět na výsledky                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────┐  DVEŘE PŘEDNÍ LEVÉ                 │
│  │                    │  Škoda Octavia III (5E) 2013-2020  │
│  │    [HLAVNÍ FOTO]   │                                    │
│  │                    │  Kód dílu: 5E4831051              │
│  │                    │  OE číslo: 5E4 831 051             │
│  └────────────────────┘                                    │
│  ┌────┐┌────┐┌────┐┌────┐                                  │
│  │    ││    ││    ││    │  ← Další fotky                   │
│  └────┘└────┘└────┘└────┘                                  │
│                                                             │
│  STAV: ⭐⭐⭐⭐ Velmi dobrý                                  │
│  ├── Bez koroze                                            │
│  ├── Funkční mechanismus                                   │
│  ├── Drobné oděrky na hraně (viz foto #3)                 │
│  └── Originál sklo, lišty, madlo                          │
│                                                             │
│  BARVA: Bílá Candy (kód: LS9R)                            │
│  └── Možnost nalakovat na jinou barvu (+2 500 Kč)         │
│                                                             │
│  PŮVOD:                                                     │
│  ├── Vrak #V2847                                           │
│  ├── Rok výroby: 2019                                      │
│  ├── Najeté km: 85 000                                     │
│  └── Důvod vyřazení: Náraz zezadu (přední část OK)        │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  CENA: 4 500 Kč                                            │
│  DPH: Včetně 21%                                           │
│  Skladem: ✅ Ano (Vrakoviště Praha)                        │
│                                                             │
│  Doprava:                                                   │
│  ├── Osobní odběr: Zdarma (Praha 9)                       │
│  ├── PPL: 299 Kč (pojištěno)                              │
│  └── Vlastní doprava: Domluvou                            │
│                                                             │
│             [  🛒 PŘIDAT DO KOŠÍKU  ]                      │
│                                                             │
│  💬 Máte dotaz? [Napsat prodejci]                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ZÁRUKA                                                     │
│  ├── 14 dní na vrácení                                     │
│  ├── Záruka na funkčnost: 6 měsíců                        │
│  └── Reklamace: Výměna nebo vrácení peněz                 │
├─────────────────────────────────────────────────────────────┤
│  KOMPATIBILITA                                              │
│  ├── ✅ Škoda Octavia III (5E) 2013-2020                   │
│  ├── ✅ Škoda Octavia III Combi (5E) 2013-2020            │
│  └── ⚠️ Octavia IV (NX) - NEHODÍ SE                       │
└─────────────────────────────────────────────────────────────┘
```

### Košík

```
┌─────────────────────────────────────────────────────────────┐
│  🛒 KOŠÍK (3 položky)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────┐ Dveře přední levé                                 │
│  │FOTO │ Octavia III, Bílá                                 │
│  └─────┘ 4 500 Kč                          [🗑️ Odebrat]    │
│                                                             │
│  ┌─────┐ Olejový filtr Mann                                │
│  │FOTO │ 2.0 TDI                                           │
│  └─────┘ 189 Kč              [- 1 +]       [🗑️ Odebrat]    │
│                                                             │
│  ┌─────┐ Koch Chemie GSF                                   │
│  │FOTO │ Autošampon 1L                                     │
│  └─────┘ 299 Kč              [- 2 +]       [🗑️ Odebrat]    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Mezisoučet:                              5 276 Kč         │
│  Doprava:                                   299 Kč         │
│  ─────────────────────────────────────────────────         │
│  CELKEM:                                  5 575 Kč         │
│                                                             │
│  Slevový kód: [____________] [POUŽÍT]                      │
│                                                             │
│              [  POKRAČOVAT K POKLADNĚ  ]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Checkout

```
KROK 1/3: DOPRAVA
─────────────────────────────────────────

○ Osobní odběr - Praha 9, Prosek          ZDARMA
  Po-Pá 8:00-17:00

○ Zásilkovna - výběr pobočky              69 Kč
  (pouze pro balíky do 10 kg)

● PPL - doručení na adresu                299 Kč
  Pojištěno, 1-2 pracovní dny

○ Vlastní doprava                         Domluvou
  Pro velké díly (dveře, kapoty, motory)

Poznámka k dopravě: [________________________]

[POKRAČOVAT →]


KROK 2/3: PLATBA
─────────────────────────────────────────

● Platba kartou online                    
  Visa, Mastercard, Apple Pay, Google Pay

○ Bankovní převod                         
  Odeslání po připsání platby

○ Dobírka                                 +49 Kč
  Platba při převzetí

[← ZPĚT]                    [POKRAČOVAT →]


KROK 3/3: SHRNUTÍ
─────────────────────────────────────────

DODACÍ ÚDAJE:
Jan Novák
Ulice 123
110 00 Praha 1
+420 777 123 456
jan.novak@email.cz

OBJEDNÁVKA:
├── Dveře přední levé           4 500 Kč
├── Olejový filtr Mann            189 Kč
├── Koch Chemie GSF 1L (2×)       598 Kč
├── Doprava PPL                   299 Kč
├── ────────────────────────────────────
└── CELKEM:                     5 586 Kč

☑️ Souhlasím s obchodními podmínkami

[← ZPĚT]             [OBJEDNAT A ZAPLATIT]
```

---

## 📦 Fulfillment

### Typy dodání

```
MALÉ BALÍKY (do 10 kg)
├── Zásilkovna: 69 Kč (zdarma nad 2 000 Kč)
├── PPL: 129 Kč (zdarma nad 3 000 Kč)
└── Osobní odběr: Zdarma

STŘEDNÍ BALÍKY (10-30 kg)
├── PPL: 199 Kč
├── DPD: 219 Kč
└── Osobní odběr: Zdarma

VELKÉ DÍLY (dveře, kapoty, nárazníky)
├── PPL Freight: 399-599 Kč
├── Vlastní doprava: Cena dle vzdálenosti
└── Osobní odběr: Zdarma

TĚŽKÉ DÍLY (motory, převodovky)
├── Speditér: Individuální kalkulace
├── Paleta: 800-1 500 Kč
└── Osobní odběr: Doporučeno
```

### Sklad a expedice

```
MODEL:
├── Autokosmetika + aftermarket: Vlastní sklad (Praha)
├── Díly z vraků: Drop-ship z vrakoviště
│   └── Nebo převoz do našeho skladu před odesláním
└── Velké díly: Přímo z vrakoviště

EXPEDICE:
├── Objednávky do 14:00 = Odesláno tentýž den
├── Díly z vrakovišť: +1-2 dny na vyzvednutí
└── Velké díly: Domluvou (telefon/email)

BALENÍ:
├── Malé díly: Karton + výplň
├── Křehké (světla, skla): Speciální balení
├── Velké: Fólie + paleta
└── Motory: Dřevěná bedna
```

---

## 🗃️ Databázový model

```prisma
// Produkt
model ShopProduct {
  id              String   @id @default(cuid())
  
  // Typ produktu
  type            ProductType  // USED_PART, AFTERMARKET, COSMETICS, ACCESSORY
  
  // Základní info
  name            String
  slug            String   @unique
  description     String   @db.Text
  shortDesc       String?
  
  // Kategorie
  categoryId      String
  category        ShopCategory @relation(fields: [categoryId], references: [id])
  
  // Ceny
  price           Int      // V haléřích
  comparePrice    Int?     // Přeškrtnutá cena
  costPrice       Int?     // Nákupní cena
  
  // Sklad
  sku             String   @unique
  stockQuantity   Int      @default(0)
  stockLocation   String?  // "sklad" nebo "vrakoviste_1"
  
  // Vlastnosti
  weight          Int?     // Gramy
  dimensions      Json?    // {w, h, d}
  
  // Stav (pro použité díly)
  condition       Int?     // 1-5 hvězdiček
  conditionNote   String?
  
  // Původ (pro díly z vraků)
  wreckedCarId    String?
  wreckedCar      WreckedCar? @relation(fields: [wreckedCarId], references: [id])
  oeNumber        String?  // Originální číslo dílu
  color           String?
  colorCode       String?
  
  // Kompatibilita
  compatibleCars  Json?    // [{brand, model, yearFrom, yearTo, engine}]
  
  // Značka (pro aftermarket/kosmetiku)
  brand           String?
  
  // SEO
  metaTitle       String?
  metaDescription String?
  
  // Status
  status          ProductStatus @default(DRAFT)
  featured        Boolean  @default(false)
  
  // Vztahy
  images          ShopProductImage[]
  orderItems      ShopOrderItem[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum ProductType {
  USED_PART       // Díl z vraku
  AFTERMARKET     // Aftermarket díl
  COSMETICS       // Autokosmetika
  ACCESSORY       // Doplněk
}

enum ProductStatus {
  DRAFT
  ACTIVE
  OUT_OF_STOCK
  RESERVED        // Pro díly z vraků - někdo má v košíku
  SOLD
}

// Vrak (zdroj dílů)
model WreckedCar {
  id              String   @id @default(cuid())
  
  // Auto
  brand           String
  model           String
  year            Int
  vin             String?
  mileage         Int?
  fuelType        String?
  engine          String?
  transmission    String?
  color           String?
  colorCode       String?
  
  // Zdroj
  sourceId        String?  // ID vrakoviště
  sourceName      String?  // Název vrakoviště
  sourceRef       String?  // Reference u vrakoviště
  
  // Důvod vyřazení
  damageType      String?  // front, rear, side, total, mechanical
  damageNote      String?
  
  // Dostupné díly
  parts           ShopProduct[]
  
  createdAt       DateTime @default(now())
}

// Kategorie
model ShopCategory {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  description     String?
  icon            String?
  
  parentId        String?
  parent          ShopCategory?  @relation("CategoryTree", fields: [parentId], references: [id])
  children        ShopCategory[] @relation("CategoryTree")
  
  products        ShopProduct[]
  
  sortOrder       Int      @default(0)
}

// Fotky produktu
model ShopProductImage {
  id              String   @id @default(cuid())
  productId       String
  product         ShopProduct @relation(fields: [productId], references: [id])
  url             String
  alt             String?
  sortOrder       Int      @default(0)
}

// Objednávka
model ShopOrder {
  id              String   @id @default(cuid())
  orderNumber     String   @unique
  
  // Zákazník
  userId          String?
  user            User?    @relation(fields: [userId], references: [id])
  email           String
  phone           String
  
  // Adresy
  shippingName    String
  shippingAddress String
  shippingCity    String
  shippingZip     String
  
  billingName     String?
  billingAddress  String?
  billingIco      String?
  billingDic      String?
  
  // Položky
  items           ShopOrderItem[]
  
  // Ceny
  subtotal        Int
  shippingCost    Int
  discount        Int      @default(0)
  total           Int
  
  // Doprava
  shippingMethod  ShippingMethod
  trackingNumber  String?
  trackingUrl     String?
  
  // Platba
  paymentMethod   PaymentMethod
  paymentStatus   PaymentStatus @default(PENDING)
  paidAt          DateTime?
  
  // Status
  status          OrderStatus @default(PENDING)
  
  // Poznámky
  customerNote    String?
  internalNote    String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum ShippingMethod {
  PICKUP          // Osobní odběr
  ZASILKOVNA
  PPL
  DPD
  PPL_FREIGHT     // Pro velké balíky
  CUSTOM          // Vlastní doprava
}

enum PaymentMethod {
  CARD
  BANK_TRANSFER
  COD             // Dobírka
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum OrderStatus {
  PENDING         // Čeká na platbu
  PAID            // Zaplaceno
  PROCESSING      // Připravuje se
  READY_PICKUP    // Připraveno k odběru
  SHIPPED         // Odesláno
  DELIVERED       // Doručeno
  CANCELLED
  REFUNDED
}

// Položka objednávky
model ShopOrderItem {
  id              String   @id @default(cuid())
  orderId         String
  order           ShopOrder @relation(fields: [orderId], references: [id])
  
  productId       String
  product         ShopProduct @relation(fields: [productId], references: [id])
  
  name            String   // Snapshot
  sku             String
  price           Int
  quantity        Int
  total           Int
}
```

---

## 🛡️ Admin panel

### Dashboard

```
SHOP ADMIN
─────────────────────────────────────────

DNES:
├── Objednávky: 8 (+3 nové)
├── Tržby: 24 680 Kč
├── Položek prodáno: 14
└── Průměrná objednávka: 3 085 Kč

ČEKÁ NA VYŘÍZENÍ:
├── 🟡 Nové objednávky: 3
├── 🔵 Připravit k odběru: 2
└── 🟢 K odeslání: 4

UPOZORNĚNÍ:
├── ⚠️ Nízký stav skladu: 5 produktů
├── ❓ Dotazy zákazníků: 2
└── 🔄 Vrácení zboží: 1
```

### Správa produktů

```
PRODUKTY                               [+ NOVÝ PRODUKT]
─────────────────────────────────────────

Typ: [Vše ▼]  Kategorie: [Vše ▼]  Sklad: [Vše ▼]

┌──────────────────────────────────────────────────────────┐
│ Foto │ Název              │ Typ    │ Cena   │ Sklad │ ● │
├──────────────────────────────────────────────────────────┤
│ [  ] │ Dveře přední L     │ USED   │ 4500   │ 1     │ ● │
│ [  ] │ Motor 2.0 TDI      │ USED   │ 45000  │ 1     │ ● │
│ [  ] │ Filtr olej Mann    │ AFTER  │ 189    │ 24    │ ● │
│ [  ] │ Koch GSF 1L        │ COSM   │ 299    │ 18    │ ● │
└──────────────────────────────────────────────────────────┘
```

### Přidání dílu z vraku

```
NOVÝ PRODUKT - DÍL Z VRAKU
─────────────────────────────────────────

VRAK (ZDROJ):
├── Vyber existující: [Octavia III 2019, #V2847 ▼]
├── Nebo přidej nový: [+ NOVÝ VRAK]

DÍL:
├── Kategorie: [Karoserie > Dveře ▼]
├── Název: [Dveře přední levé           ]
├── OE číslo: [5E4 831 051              ]

STAV:
├── Hodnocení: [⭐⭐⭐⭐ Velmi dobrý ▼]
├── Popis stavu: [Bez koroze, drobné oděrky...]

VZHLED:
├── Barva: [Bílá                        ]
├── Kód barvy: [LS9R                    ]

CENA:
├── Nákupní: [2500] Kč
├── Prodejní: [4500] Kč
├── Marže: 80%

FOTKY:
├── [+ NAHRÁT FOTKY] (min. 3)
└── □ □ □ □

KOMPATIBILITA:
├── [✓] Škoda Octavia III (5E) 2013-2020
├── [✓] Škoda Octavia III Combi 2013-2020
└── [+ Přidat další vůz]

[ULOŽIT DRAFT]  [PUBLIKOVAT]
```

### Objednávky

```
OBJEDNÁVKY                            Dnes: 8 | Tento týden: 47
─────────────────────────────────────────

Status: [Vše ▼]  Doprava: [Vše ▼]

┌──────────────────────────────────────────────────────────┐
│ #      │ Datum │ Zákazník    │ Celkem  │ Status    │    │
├──────────────────────────────────────────────────────────┤
│ #1847  │ Dnes  │ Jan N.      │ 5 586Kč │ 🟡 Nová   │ →  │
│ #1846  │ Dnes  │ Petr K.     │ 890 Kč  │ 🟢 Odesláno│ →  │
│ #1845  │ Včera │ Eva S.      │ 12 400Kč│ 🔵 Připr. │ →  │
└──────────────────────────────────────────────────────────┘

DETAIL OBJEDNÁVKY #1847:
├── Zákazník: Jan Novák, Praha
├── Telefon: +420 777 123 456
├── Doprava: PPL (299 Kč)
├── Platba: Kartou ✅ Zaplaceno
│
├── POLOŽKY:
│   ├── Dveře přední levé (4 500 Kč)
│   │   └── Sklad: Vrakoviště Praha → Vyzvednout
│   ├── Olejový filtr Mann (189 Kč)
│   │   └── Sklad: OK
│   └── Koch Chemie GSF 2× (598 Kč)
│       └── Sklad: OK
│
├── TIMELINE:
│   ├── 10:32 Objednávka vytvořena
│   ├── 10:33 Platba přijata
│   └── ⏳ Čeká na přípravu
│
└── AKCE:
    [PŘIPRAVIT] [TISK ŠTÍTKU] [ODESLAT EMAIL]
```

---

## 📋 Implementační priority

### Fáze 1: MVP (3-4 týdny)
```
├── Základní katalog produktů
├── Vyhledávání podle vozu
├── Detail produktu
├── Košík + checkout
├── Platba kartou (Stripe)
├── Objednávkový systém
├── Email notifikace
└── Admin: produkty, objednávky
```

### Fáze 2: Rozšíření (2-3 týdny)
```
├── Fulltext vyhledávání
├── Filtry (cena, stav, skladem)
├── Správa vraků v adminu
├── Integrace dopravců (štítky)
├── Automatizace skladů
├── Recenze produktů
└── Slevové kódy
```

### Fáze 3: Integrace (1-2 týdny)
```
├── Cross-sell s hlavním webem
│   └── "K vašemu vozu doporučujeme..."
├── Propojení s Marketplace
│   └── Díly z opravovaných vozů
├── Věrnostní program
└── API pro vrakoviště
```

---

## ⚠️ Právní poznámky

```
ZÁRUKY:
├── Díly z vraků: 6 měsíců na funkčnost
├── Aftermarket: Dle výrobce (12-24 měsíců)
├── Kosmetika: 24 měsíců
└── 14 dní na vrácení (e-shop povinnost)

REKLAMACE:
├── Nefunkční díl = Výměna nebo vrácení
├── Nekompatibilní = Vrácení (chyba zákazníka)
├── Poškozeno při přepravě = Reklamace u dopravce
└── Dokumentace: Fotky před odesláním

ODPOVĚDNOST:
├── Za správnost kompatibility ručíme
├── Za stav dílu dle popisu ručíme
├── Za montáž neručíme (doporučujeme servis)
└── Za použití v motorsportu neručíme
```

---

*Dokument verze 1.0 | Březen 2026*
