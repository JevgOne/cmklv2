# CARMAKLER MARKETPLACE - Interní investiční platforma

## 📋 Přehled

**Doména:** marketplace.carmakler.cz  
**Typ:** Interní investiční klub (invite-only, "podpultovka")  
**Účel:** Propojení ověřených obchodníků s investory pro nákup, opravu a prodej vozidel z dovozu

> ⚠️ **DŮLEŽITÉ:** Toto NENÍ veřejná platforma. Žádný marketing, SEO, veřejná registrace. Pouze pro zvané investory a manuálně přidané obchodníky.

---

## 🎯 Business Model

### Jak to funguje

```
OBCHODNÍK (2 ověření partneři)          INVESTOR (invite-only)
       │                                        │
       │  1. Najde auto v zahraničí            │
       │  2. Vytvoří deal s kalkulací          │
       │                                        │
       └──────────► MARKETPLACE ◄──────────────┘
                         │
                         │  3. Investor vybere deal
                         │  4. Investuje částku
                         │
       ┌─────────────────┴─────────────────────┐
       │                                        │
       │  5. Obchodník koupí auto              │
       │  6. Přiveze do ČR                     │
       │  7. Opraví ve svém servisu            │
       │  8. Prodá přes Carmakler.cz           │
       │                                        │
       └──────────► VÝPLATA ◄──────────────────┘
                         │
            Investor dostane: Investice + Zisk
            Obchodník dostane: Jeho podíl
            Carmakler dostane: Provize z prodeje
```

### Naši obchodníci

```
OBCHODNÍK #1: [Jméno/Firma]
├── IČO: XXX XXX XXX
├── Autoservis: [Název], [Město]
├── Specializace: BMW, Audi, Mercedes
├── Track record: XX prodaných vozů
└── Průměrné ROI: ~20%

OBCHODNÍK #2: [Jméno/Firma]
├── IČO: XXX XXX XXX
├── Autoservis: [Název], [Město]
├── Specializace: Škoda, VW, Seat
├── Track record: XX prodaných vozů
└── Průměrné ROI: ~18%
```

---

## 💰 Finanční model

### Příklad dealu

```
AUTO: BMW 330i xDrive (2020, 65 000 km)
OBCHODNÍK: Partner #1
─────────────────────────────────────────

NÁKLADY:
├── Nákupní cena (DE):       280 000 Kč
├── Doprava + přeprava:       18 000 Kč
├── CLO + DPH + registrace:   20 000 Kč
├── Opravy ve servisu:        45 000 Kč
│   └── Rozvody, brzdy, servis
├── STK + emise:               3 000 Kč
├── Detailing + foto:          6 000 Kč
├── Rezerva (5%):             19 000 Kč
├── ─────────────────────────────────────
└── CELKEM K INVESTICI:      391 000 Kč

PRODEJ:
├── Očekávaná cena:          480 000 Kč
├── Minimální cena:          440 000 Kč
├── Provize Carmakler (5%):   24 000 Kč
├── ─────────────────────────────────────
├── ČISTÝ VÝNOS:             456 000 Kč
└── ZISK:                     65 000 Kč

ROZDĚLENÍ ZISKU:
├── Investor:     80%  =  52 000 Kč
└── Obchodník:    20%  =  13 000 Kč

ROI PRO INVESTORA:  ~13.3%
DOBA TRVÁNÍ:        30-60 dní
```

### Provize Carmakler

```
Carmakler bere standardní provizi z prodeje vozidla (5%)
├── Prodej přes Carmakler.cz
├── Makléř může být přiřazen (50/50 split)
└── Počítá se do firemního obratu
```

### Typy investic

```
SOLO INVESTICE
├── 1 investor financuje celý deal
├── Min. investice: 100 000 Kč
├── Plná kontrola, rychlé rozhodování
└── Celý zisk (investorská část)

SDÍLENÁ INVESTICE
├── 2-5 investorů se složí
├── Min. investice/osoba: 50 000 Kč
├── Podíl dle vložené částky
└── Zisk rozdělen proporčně
```

---

## 👥 Uživatelské role

### OBCHODNÍK (Dealer)
```
Počet: 2 (manuálně přidaní, ověření partneři)

Může:
├── Vytvářet nové dealy
├── Nahrávat fotky a dokumenty
├── Aktualizovat stav dealu
├── Přidávat náklady s doklady
├── Komunikovat s investory
└── Označit deal jako prodaný

Zodpovědnost:
├── Pravdivost kalkulací
├── Kvalita oprav
├── Fotodokumentace průběhu
└── Včasná komunikace
```

### INVESTOR
```
Počet: Omezený (invite-only)

Může:
├── Prohlížet dostupné dealy
├── Investovat do dealů
├── Sledovat své investice
├── Prohlížet historii a výnosy
├── Stáhnout dokumenty (smlouvy, faktury)
└── Komunikovat s obchodníkem

Jak se stát investorem:
├── Pozvánka od admina
├── Základní ověření (email, telefon, účet)
└── Žádná veřejná registrace
```

### ADMIN (Carmakler)
```
Může:
├── Přidávat/upravovat obchodníky
├── Zvát nové investory
├── Schvalovat dealy před publikací
├── Řešit spory
├── Spravovat výplaty
├── Vidět všechny finanční přehledy
└── Exportovat reporty
```

---

## 🚗 Životní cyklus dealu

### Fáze

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  DRAFT  │───▶│ FUNDING │───▶│ BOUGHT  │───▶│ REPAIR  │───▶│ SELLING │───▶│  DONE   │
│   📝    │    │   💰    │    │   🚗    │    │   🔧    │    │   📸    │    │   ✅    │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
 Obchodník      Čeká na       Koupeno,       V servisu      Na prodej     Prodáno,
 vytvoří       investora      v přepravě     obchodníka     na Carmakler  vyplaceno
```

### 1. DRAFT (Návrh)
```
Obchodník:
├── Najde auto (mobile.de, autoscout24)
├── Prověří VIN a historii
├── Vytvoří kalkulaci
├── Nahraje fotky z inzerátu
└── Odešle ke schválení

Povinná pole:
├── Značka, model, rok, km, palivo, převodovka
├── VIN
├── Odkaz na původní inzerát
├── Min. 5 fotek
├── Kompletní kalkulace nákladů
├── Odhadovaná prodejní cena
├── Popis stavu a plánovaných oprav
└── Odhadovaná doba (nákup → prodej)
```

### 2. FUNDING (Hledá se investor)
```
Po schválení adminem:
├── Deal viditelný pro investory
├── Investoři mohou investovat
├── Při 100% financování → automaticky BOUGHT
└── Obchodník může deal zrušit (pokud nenajde investora)

Timeout: Žádný pevný (dohodou)
```

### 3. BOUGHT (Koupeno)
```
Obchodník:
├── Koupí vozidlo
├── Nahraje kupní smlouvu
├── Zajistí přepravu do ČR
├── Update investorům
└── Po dovozu → REPAIR

Dokumenty:
├── Kupní smlouva (sken)
├── Doklad o platbě
├── Fotky při převzetí
└── Přepravní dokumenty
```

### 4. REPAIR (V opravě)
```
Obchodník:
├── Diagnostika
├── Provedení oprav
├── Průběžné fotky
├── Update investorům (min. 1× týdně)
└── Po dokončení → SELLING

Pokud náklady překročí kalkulaci:
├── Do 10%: OK, pokračuje se
├── Nad 10%: Informovat investora, dohodnout postup
```

### 5. SELLING (Na prodej)
```
├── Auto nafoceno profesionálně
├── Publikováno na Carmakler.cz
├── Případně Sauto, TipCars, FB
├── Prohlídky a vyjednávání
├── Pravidelné reporty investorům
└── Po prodeji → DONE

Snížení ceny:
├── Obchodník informuje investora
├── Dohodnou se na nové ceně
└── Update kalkulace
```

### 6. DONE (Dokončeno)
```
├── Auto prodáno
├── Peníze přijaty
├── Výpočet skutečného zisku
├── Výplata investorovi
├── Výplata obchodníkovi
└── Deal uzavřen

Dokumenty:
├── Kupní smlouva (prodej)
├── Finální vyúčtování
├── Potvrzení o výplatě
```

---

## 📊 Investorský dashboard

### Přehled

```
┌─────────────────────────────────────────────────────────────┐
│  Ahoj, [Jméno]!                              marketplace    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MOJE PORTFOLIO                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  250 000 Kč │  │  2 aktivní  │  │  +38 500 Kč │         │
│  │ Investováno │  │    dealy    │  │   Výnosy    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  K VÝPLATĚ: 52 000 Kč  [VYBRAT NA ÚČET]                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  AKTIVNÍ INVESTICE                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  🚗 BMW 330i xDrive 2020                              │ │
│  │  Obchodník: Partner #1                                │ │
│  │  Moje investice: 150 000 Kč (100%)                    │ │
│  │                                                       │ │
│  │  Status: 🔧 V OPRAVĚ                                  │ │
│  │  ████████████░░░░░░░░ 60%                             │ │
│  │                                                       │ │
│  │  Očekávaný zisk: +19 500 Kč (+13%)                   │ │
│  │  Očekávaný prodej: ~15.4.2026                        │ │
│  │                                              [DETAIL] │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  🚗 Škoda Octavia RS 2021                             │ │
│  │  Obchodník: Partner #2                                │ │
│  │  Moje investice: 100 000 Kč (50%)                     │ │
│  │                                                       │ │
│  │  Status: 📸 NA PRODEJ (den 12)                        │ │
│  │  ████████████████░░░░ 80%                             │ │
│  │                                                       │ │
│  │  Očekávaný zisk: +11 000 Kč (+11%)                   │ │
│  │                                              [DETAIL] │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  NOVÉ PŘÍLEŽITOSTI                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │  VW Passat 2019     │  │  Audi A4 2020       │         │
│  │  Partner #1         │  │  Partner #2         │         │
│  │                     │  │                     │         │
│  │  Investice: 320k    │  │  Investice: 410k    │         │
│  │  Oček. zisk: ~15%   │  │  Oček. zisk: ~18%   │         │
│  │                     │  │                     │         │
│  │  [ZOBRAZIT DETAIL]  │  │  [ZOBRAZIT DETAIL]  │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Detail dealu

```
┌─────────────────────────────────────────────────────────────┐
│  ← Zpět                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BMW 330i xDrive M Sport                                    │
│  2020 | 65 000 km | Benzín | Automat | 190 kW              │
│                                                             │
│  Obchodník: Partner #1 - [Jméno]                           │
│  Servis: [Název servisu], [Město]                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FOTOGALERIE                                                │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │     │ │     │ │     │ │     │ │     │                  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  KALKULACE                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Nákupní cena (DE)              280 000 Kč                 │
│  Doprava                         18 000 Kč                 │
│  CLO + registrace                20 000 Kč                 │
│  Opravy (rozpis níže)            45 000 Kč                 │
│  STK + emise                      3 000 Kč                 │
│  Detailing                        6 000 Kč                 │
│  Rezerva 5%                      19 000 Kč                 │
│  ─────────────────────────────────────────                 │
│  INVESTICE CELKEM               391 000 Kč                 │
│                                                             │
│  Očekávaná prodejní cena        480 000 Kč                 │
│  Provize Carmakler (5%)         -24 000 Kč                 │
│  ─────────────────────────────────────────                 │
│  ČISTÝ VÝNOS                    456 000 Kč                 │
│  ZISK                            65 000 Kč                 │
│                                                             │
│  ═══════════════════════════════════════════               │
│  VÁŠ PODÍL (80% ze zisku):       52 000 Kč                │
│  VAŠE ROI:                          ~13%                   │
│  ═══════════════════════════════════════════               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  PLÁNOVANÉ OPRAVY                                           │
├─────────────────────────────────────────────────────────────┤
│  • Rozvody komplet              18 000 Kč                  │
│  • Brzdy přední + zadní         12 000 Kč                  │
│  • Olej + filtry                 8 000 Kč                  │
│  • Drobné lakování               7 000 Kč                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  DOKUMENTY                                                  │
├─────────────────────────────────────────────────────────────┤
│  📄 VIN report                           [STÁHNOUT]        │
│  📄 Původní inzerát                      [ODKAZ]           │
│  📄 Servisní historie                    [STÁHNOUT]        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  TIMELINE                                                   │
├─────────────────────────────────────────────────────────────┤
│  ● 10.3. Deal vytvořen                                     │
│  ● 12.3. Investice potvrzena (vy)                          │
│  ● 15.3. Auto koupeno v DE                                 │
│  ● 18.3. Doručeno do servisu                               │
│  ○ ~5.4. Očekávané dokončení oprav                         │
│  ○ ~20.4. Očekávaný prodej                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  INVESTOVAT                                           │ │
│  │                                                       │ │
│  │  Zbývá k investici: 391 000 Kč                       │ │
│  │                                                       │ │
│  │  Vaše částka: [____________] Kč                      │ │
│  │               Min: 50 000 Kč                         │ │
│  │                                                       │ │
│  │  Váš podíl: 0%                                       │ │
│  │  Váš očekávaný zisk: 0 Kč                           │ │
│  │                                                       │ │
│  │              [INVESTOVAT]                            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Obchodník - rozhraní

### Dashboard obchodníka

```
┌─────────────────────────────────────────────────────────────┐
│  MOJE DEALY                                    [+ NOVÝ DEAL]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AKTIVNÍ (3)                                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ BMW 330i │ 🔧 V opravě │ 150k invested │ [UPRAVIT]    │ │
│  │ Octavia  │ 📸 Prodej   │ 200k invested │ [UPRAVIT]    │ │
│  │ Passat   │ 💰 Funding  │ 0k / 320k     │ [UPRAVIT]    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  DOKONČENÉ (12)                                [ZOBRAZIT]  │
│                                                             │
│  STATISTIKY                                                 │
│  ├── Prodaných vozů: 12                                    │
│  ├── Celkový obrat: 4.2M Kč                                │
│  ├── Průměrné ROI: 16.5%                                   │
│  └── Spokojených investorů: 8                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Formulář nového dealu

```
NOVÝ DEAL
─────────────────────────────────────────

ZÁKLADNÍ INFO
├── Značka: [BMW        ▼]
├── Model:  [330i xDrive  ]
├── Rok:    [2020]
├── KM:     [65000      ]
├── Palivo: [Benzín     ▼]
├── Převod: [Automat    ▼]
├── Výkon:  [190] kW

PŮVOD
├── Země:   [Německo    ▼]
├── VIN:    [WBAXXXXXXX   ]
├── Odkaz:  [https://mobile.de/...]

FOTKY
├── [+ NAHRÁT FOTKY] (min. 5)
└── Náhled: □ □ □ □ □

KALKULACE
├── Nákupní cena:    [280000] Kč
├── Doprava:         [18000 ] Kč
├── CLO + registrace:[20000 ] Kč
├── Opravy:          [45000 ] Kč
├── STK + emise:     [3000  ] Kč
├── Detailing:       [6000  ] Kč
├── Rezerva (auto):  [19000 ] Kč
├── ─────────────────────────────
└── CELKEM:          391 000 Kč

PLÁNOVANÉ OPRAVY (rozpis)
├── [Rozvody komplet        ] [18000] Kč
├── [Brzdy přední + zadní   ] [12000] Kč
├── [+ Přidat položku]
└── Celkem opravy: 45 000 Kč

PRODEJ
├── Očekávaná cena: [480000] Kč
├── Min. cena:      [440000] Kč
├── Oček. doba:     [45    ] dní

POPIS
└── [Textarea - stav vozu, poznámky...]

[ULOŽIT DRAFT]  [ODESLAT KE SCHVÁLENÍ]
```

---

## 🛡️ Admin panel

### Dashboard

```
MARKETPLACE ADMIN
─────────────────────────────────────────

PŘEHLED
├── Aktivní dealy: 5
├── Čeká na schválení: 1
├── Investováno celkem: 1.2M Kč
├── Aktivní investoři: 6
└── Tento měsíc prodáno: 2 vozy

KE SCHVÁLENÍ (1)
┌────────────────────────────────────────┐
│ VW Passat 2019 | Partner #1            │
│ Investice: 320k | ROI: ~15%            │
│ [ZOBRAZIT] [SCHVÁLIT] [ZAMÍTNOUT]      │
└────────────────────────────────────────┘

OBCHODNÍCI
├── Partner #1: 3 aktivní dealy, 8 dokončených
└── Partner #2: 2 aktivní dealy, 4 dokončených

INVESTOŘI (6)
├── [Spravovat investory]
└── [Pozvat nového investora]
```

### Správa obchodníků

```
OBCHODNÍCI
─────────────────────────────────────────

┌────────────────────────────────────────────────────────────┐
│ PARTNER #1                                                 │
│ [Jméno Příjmení]                                          │
│ IČO: 123 45 678                                           │
│ Servis: AutoServis Praha, Praha 9                         │
│                                                           │
│ Email: partner1@email.cz                                  │
│ Telefon: +420 777 123 456                                 │
│                                                           │
│ Statistiky:                                               │
│ ├── Aktivní dealy: 3                                      │
│ ├── Dokončené: 8                                          │
│ ├── Celkový obrat: 2.8M Kč                                │
│ └── Průměrné ROI: 17.2%                                   │
│                                                           │
│ [UPRAVIT] [DEAKTIVOVAT]                                   │
└────────────────────────────────────────────────────────────┘

[+ PŘIDAT OBCHODNÍKA]
```

### Správa investorů

```
INVESTOŘI
─────────────────────────────────────────

┌──────────────────────────────────────────────────────────┐
│ Jméno          │ Investováno │ Aktivní │ Výnosy │ Akce  │
├──────────────────────────────────────────────────────────┤
│ Jan Novák      │ 350 000 Kč  │ 2       │ +52k   │ [→]   │
│ Petr Svoboda   │ 200 000 Kč  │ 1       │ +18k   │ [→]   │
│ Marie Králová  │ 150 000 Kč  │ 1       │ +0     │ [→]   │
└──────────────────────────────────────────────────────────┘

[+ POZVAT INVESTORA]

Dialog: POZVAT INVESTORA
├── Email: [________________]
├── Jméno: [________________]
├── Poznámka: [______________]
└── [ODESLAT POZVÁNKU]
```

---

## 🗃️ Databázový model

```prisma
// Obchodník (manuálně přidaný)
model MarketplaceDealer {
  id              String   @id @default(cuid())
  
  // Základní info
  name            String
  companyName     String?
  ico             String?
  
  // Kontakt
  email           String   @unique
  phone           String?
  
  // Servis
  workshopName    String
  workshopAddress String
  workshopCity    String
  
  // Účet
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  
  // Status
  isActive        Boolean  @default(true)
  
  // Vztahy
  deals           MarketplaceDeal[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Investor (invite-only)
model MarketplaceInvestor {
  id              String   @id @default(cuid())
  
  // Základní info
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  
  // Bankovní účet pro výplaty
  bankAccount     String?
  bankName        String?
  
  // Statistiky (cached)
  totalInvested   Int      @default(0)
  totalProfit     Int      @default(0)
  dealsCount      Int      @default(0)
  
  // Status
  isActive        Boolean  @default(true)
  invitedBy       String?  // Admin ID
  invitedAt       DateTime @default(now())
  
  // Vztahy
  investments     MarketplaceInvestment[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Deal
model MarketplaceDeal {
  id              String   @id @default(cuid())
  
  // Auto
  brand           String
  model           String
  year            Int
  mileage         Int
  fuelType        String
  transmission    String
  power           Int?
  vin             String
  
  // Původ
  sourceCountry   String
  sourceUrl       String?
  
  // Kalkulace - náklady
  purchasePrice   Int
  transportCost   Int
  customsCost     Int
  repairCost      Int
  repairDetails   Json     // [{name, cost}]
  stkCost         Int
  detailingCost   Int
  reserveFund     Int
  totalInvestment Int      // Computed
  
  // Kalkulace - prodej
  expectedPrice   Int
  minPrice        Int
  carmaklerFee    Int      // 5% provize
  expectedProfit  Int      // Computed
  expectedROI     Float    // Computed
  
  // Skutečné hodnoty (po prodeji)
  actualPrice     Int?
  actualProfit    Int?
  actualROI       Float?
  
  // Status
  status          MarketplaceDealStatus @default(DRAFT)
  
  // Časové odhady
  estimatedDays   Int      // Celková doba
  
  // Obchodník
  dealerId        String
  dealer          MarketplaceDealer @relation(fields: [dealerId], references: [id])
  
  // Schválení
  approvedAt      DateTime?
  approvedBy      String?
  rejectedReason  String?
  
  // Prodej
  soldAt          DateTime?
  carmaklerVehicleId String?  // Odkaz na inzerát na Carmakler.cz
  
  // Vztahy
  images          MarketplaceDealImage[]
  documents       MarketplaceDealDocument[]
  investments     MarketplaceInvestment[]
  updates         MarketplaceDealUpdate[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum MarketplaceDealStatus {
  DRAFT           // Rozpracovaný
  PENDING         // Čeká na schválení
  FUNDING         // Hledá investora
  FUNDED          // Plně financován
  BOUGHT          // Koupeno, v přepravě
  REPAIR          // V servisu
  SELLING         // Na prodej
  SOLD            // Prodáno, čeká výplata
  COMPLETED       // Dokončeno, vyplaceno
  CANCELLED       // Zrušeno
}

// Investice
model MarketplaceInvestment {
  id              String   @id @default(cuid())
  
  dealId          String
  deal            MarketplaceDeal @relation(fields: [dealId], references: [id])
  
  investorId      String
  investor        MarketplaceInvestor @relation(fields: [investorId], references: [id])
  
  // Částka
  amount          Int
  sharePercent    Float    // Podíl v %
  
  // Zisk
  expectedProfit  Int
  actualProfit    Int?
  
  // Výplata
  payoutAmount    Int?
  payoutDate      DateTime?
  payoutStatus    PayoutStatus @default(PENDING)
  
  createdAt       DateTime @default(now())
  
  @@unique([dealId, investorId])
}

enum PayoutStatus {
  PENDING         // Čeká na prodej
  READY           // Připraveno k výplatě
  PAID            // Vyplaceno
}

// Fotky dealu
model MarketplaceDealImage {
  id              String   @id @default(cuid())
  dealId          String
  deal            MarketplaceDeal @relation(fields: [dealId], references: [id])
  url             String
  caption         String?
  phase           String?  // source, bought, repair, selling
  sortOrder       Int      @default(0)
  createdAt       DateTime @default(now())
}

// Dokumenty dealu
model MarketplaceDealDocument {
  id              String   @id @default(cuid())
  dealId          String
  deal            MarketplaceDeal @relation(fields: [dealId], references: [id])
  type            String   // vin_report, purchase_contract, invoice, etc.
  name            String
  url             String
  createdAt       DateTime @default(now())
}

// Update/activity log
model MarketplaceDealUpdate {
  id              String   @id @default(cuid())
  dealId          String
  deal            MarketplaceDeal @relation(fields: [dealId], references: [id])
  
  type            String   // status_change, photo_added, note, etc.
  title           String
  content         String?
  
  authorId        String
  
  createdAt       DateTime @default(now())
}
```

---

## 📧 Notifikace

### Email notifikace

```
INVESTOR:
├── Pozvánka na platformu
├── Nový deal k dispozici
├── Investice potvrzena
├── Update stavu dealu (nákup, oprava, prodej)
├── Deal prodán - přehled zisku
└── Výplata odeslána

OBCHODNÍK:
├── Deal schválen / zamítnut
├── Nový investor (deal plně financován)
└── Připomenutí: update pro investory

ADMIN:
├── Nový deal ke schválení
├── Deal prodán - provize
└── Výplata ke zpracování
```

---

## 📋 Implementační poznámky

### Tech stack
```
├── Next.js 15 (App Router)
├── Sdílená DB s hlavním Carmakler
├── Samostatná subdoména: marketplace.carmakler.cz
├── Auth: Rozšíření stávajícího (nové role)
└── Storage: Cloudinary (fotky), S3 (dokumenty)
```

### Priorita
```
P3 (Low) - v2.0

Důvod: "Podpultovka", není kritické pro launch
Můžeme začít s jednoduchým Excel/Notion workflow
a platformu dostavět později.
```

### MVP scope
```
├── 2 obchodníci (hardcoded)
├── Invite-only investoři (max 10)
├── Základní deal CRUD
├── Jednoduchý investor dashboard
├── Email notifikace
├── Manuální výplaty
└── Admin: schvalování, přehled
```

### Co NENÍ v MVP
```
├── Automatické výplaty
├── Generování smluv
├── Chat obchodník ↔ investor
├── Veřejná registrace
└── Rating obchodníků
```

---

*Dokument verze 2.0 | Březen 2026*
*Přepracováno na interní "podpultový" model*
