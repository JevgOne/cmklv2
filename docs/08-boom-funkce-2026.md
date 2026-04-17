# Carmakler - 2026 BOOM Funkce

## Přehled

Funkce které odliší Carmakler od klasických bazarů a vytvoří "safe platformu" s vysokou konverzí.

---

## 🔥 A) Funkce zvyšující konverzi (kupující)

### 1. Smart Search (AI)

**Uživatel napíše přirozeně:**
- "SUV automat do 500k"
- "auto pro rodinu na dálky"
- "spolehlivý diesel na 200k km ročně"

**Systém:**
- Parsuje záměr pomocí AI (OpenAI/Claude API)
- Najde matching vozidla
- Doporučí podobné alternativy

```javascript
// POST /api/search/smart
{
  query: "SUV automat do 500k",
  location: "Praha"
}

// Response
{
  intent: {
    bodyType: "SUV",
    transmission: "automatic",
    maxPrice: 500000
  },
  results: [...],
  suggestions: [
    "Zvažte i crossovery - levnější a podobný prostor",
    "V tomto rozpočtu doporučujeme: Tucson, Tiguan, Sportage"
  ]
}
```

**UI:**
```
┌──────────────────────────────────────────────────────────────────┐
│  🔍 Co hledáte?                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ SUV automat do 500k pro rodinu                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  💡 Rozumím: SUV, automat, max 500 000 Kč                       │
│     Našel jsem 47 vozů • Doporučuji: Hyundai Tucson, VW Tiguan  │
└──────────────────────────────────────────────────────────────────┘
```

---

### 2. "Pomoz mi vybrat auto" (30s kvíz)

**Flow:**
```
KROK 1: K čemu auto?
○ Rodina (děti, kočárek)
○ Práce (reprezentace)
○ Město (parkování)
○ Dálky (komfort)
○ Mix všeho

KROK 2: Budget
○ Do 200k
○ 200-400k
○ 400-700k
○ 700k+
○ Nebo měsíční splátka: [____] Kč

KROK 3: Priority (seřaď 1-3)
☐ Nízká spotřeba
☐ Komfort
☐ Výkon
☐ Spolehlivost
☐ Prostor

KROK 4: Něco navíc?
☐ Musí být automat
☐ Nechci diesel
☐ Preferuji české/německé
```

**Výstup:**
```
┌──────────────────────────────────────────────────────────────────┐
│  🎯 TOP 5 AUT PRO VÁS                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Škoda Octavia Combi 2020          Match: 94%                │
│     ✓ Rodina ✓ Dálky ✓ Spolehlivost                            │
│     389 000 Kč • 75 000 km                                      │
│                                                                  │
│  2. VW Passat Variant 2019            Match: 91%                │
│     ✓ Komfort ✓ Dálky ✓ Prostor                                │
│     425 000 Kč • 92 000 km                                      │
│                                                                  │
│  3. ...                                                          │
└──────────────────────────────────────────────────────────────────┘
```

**Datový model:**
```prisma
model CarQuizResult {
  id          String   @id @default(cuid())
  
  sessionId   String
  userId      String?
  
  // Odpovědi
  purpose     String[]
  budget      Json
  priorities  String[]
  preferences Json
  
  // Výsledky
  recommendations Json  // Top 5 vozů s match score
  
  createdAt   DateTime @default(now())
}
```

---

### 3. Porovnání aut se "Score"

**Skóre kategorie:**
```
👨‍👩‍👧‍👦 Family Score    - prostor, bezpečnost, ISOFIX, praktičnost
🛣️ Highway Score    - komfort, spotřeba dálnice, tempomat, hluk
🏙️ City Score       - rozměry, spotřeba město, parkování, výhled
💰 Value Score      - cena vs. výbava, spolehlivost, servisní náklady
⚡ Performance Score - výkon, zrychlení, jízdní vlastnosti
🌱 Eco Score        - emise, spotřeba, alternativní pohony
```

**UI Porovnání:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  POROVNÁNÍ                                           [+ Přidat auto]    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│              │ Škoda Octavia RS  │ VW Golf GTI      │ Seat Leon FR      │
│  ────────────┼───────────────────┼──────────────────┼───────────────────│
│  Cena        │ 450 000 Kč        │ 420 000 Kč       │ 380 000 Kč        │
│  Rok         │ 2020              │ 2019             │ 2020              │
│  Km          │ 85 000            │ 72 000           │ 65 000            │
│  ────────────┼───────────────────┼──────────────────┼───────────────────│
│              │                   │                  │                   │
│  👨‍👩‍👧‍👦 Family │ ████████░░ 8.2   │ █████░░░░░ 5.4  │ ██████░░░░ 6.1   │
│  🛣️ Highway │ █████████░ 9.1   │ ████████░░ 8.3  │ ████████░░ 8.0   │
│  🏙️ City    │ ██████░░░░ 6.0   │ ████████░░ 7.8  │ ███████░░░ 7.2   │
│  💰 Value   │ ████████░░ 8.5   │ ███████░░░ 7.0  │ █████████░ 8.8   │
│              │                   │                  │                   │
│  ────────────┼───────────────────┼──────────────────┼───────────────────│
│  VERDICT     │ 🏆 Nejlepší na    │ Nejsportovnější  │ Nejlepší hodnota  │
│              │    dálky          │                  │                   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Výpočet skóre:**
```javascript
function calculateScores(vehicle: Vehicle): VehicleScores {
  return {
    family: calculateFamilyScore(vehicle),    // prostor, bezpečnost
    highway: calculateHighwayScore(vehicle),  // komfort, spotřeba
    city: calculateCityScore(vehicle),        // rozměry, manévrovatelnost
    value: calculateValueScore(vehicle),      // cena vs. co dostanete
  };
}

function calculateFamilyScore(v: Vehicle): number {
  let score = 5; // base
  
  if (v.bodyType === 'COMBI' || v.bodyType === 'SUV') score += 2;
  if (v.equipment.includes('ISOFIX')) score += 1;
  if (v.trunkVolume > 500) score += 1;
  if (v.safetyRating >= 5) score += 1;
  // ...
  
  return Math.min(10, score);
}
```

---

### 4. Hlídač aut + Hlídač ceny

**Funkce:**
- Uložit filtr → notifikace když přibyde matching auto
- Sledovat konkrétní auto → notifikace když zlevní
- Podobná auta → "Přibylo podobné auto za lepší cenu"

**Datový model:**
```prisma
model SavedSearch {
  id          String   @id @default(cuid())
  
  userId      String?
  email       String   // Pro nepřihlášené
  
  // Filtr
  filters     Json     // brand, model, priceMax, yearMin...
  
  // Nastavení notifikací
  notifyNew   Boolean  @default(true)
  notifySimilar Boolean @default(false)
  frequency   NotifyFrequency @default(INSTANT)
  
  // Stats
  lastNotified DateTime?
  matchCount  Int      @default(0)
  
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model PriceWatch {
  id          String   @id @default(cuid())
  
  userId      String?
  email       String
  
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  
  // Threshold
  targetPrice Int?     // Notif když klesne pod tuto cenu
  anyChange   Boolean  @default(true)
  
  // Stats
  originalPrice Int
  lastPrice   Int
  lastNotified DateTime?
  
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

enum NotifyFrequency {
  INSTANT
  DAILY
  WEEKLY
}
```

**Notifikace:**
```
📬 Email/Push:

"Nové auto odpovídá vašemu hledání!"
SUV, automat, do 500k, Praha

Škoda Kodiaq 2.0 TDI 2020
459 000 Kč • 78 000 km
[Zobrazit →]

---

"Auto které sledujete zlevnilo!"
Škoda Octavia RS 2020

Původní cena: 480 000 Kč
Nová cena: 450 000 Kč (-6.3%)
[Zobrazit →]
```

---

### 5. "Nabídnout cenu" (Offer systém)

**Flow:**
```
Kupující na detailu auta:
[Nabídnout cenu]

     ↓

┌─────────────────────────────────────┐
│  VAŠE NABÍDKA                       │
│                                     │
│  Aktuální cena: 450 000 Kč          │
│                                     │
│  Vaše nabídka:                      │
│  [425 000_________] Kč              │
│                                     │
│  Zpráva pro prodávajícího:          │
│  ┌─────────────────────────────────┐│
│  │ Mám hotovost, přijedu zítra    ││
│  │ do Prahy.                       ││
│  └─────────────────────────────────┘│
│                                     │
│  Vaše jméno: [_____________]        │
│  Telefon: [_____________]           │
│                                     │
│  [Odeslat nabídku]                  │
└─────────────────────────────────────┘

     ↓

Makléř dostane notifikaci v PWA:
"Nová nabídka na Octavia RS: 425 000 Kč"

     ↓

Makléř může:
[✓ Přijmout]  [↩ Protinávrh]  [✗ Odmítnout]
```

**Datový model:**
```prisma
model Offer {
  id          String   @id @default(cuid())
  
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  
  // Nabízející
  buyerName   String
  buyerPhone  String
  buyerEmail  String?
  buyerUserId String?
  
  // Nabídka
  offerPrice  Int
  message     String?
  
  // Status
  status      OfferStatus @default(PENDING)
  
  // Odpověď
  counterPrice Int?      // Protinávrh
  responseMessage String?
  respondedAt DateTime?
  respondedBy String?    // Makléř ID
  
  // Timestamps
  createdAt   DateTime  @default(now())
  expiresAt   DateTime  // Nabídka platí X dní
}

enum OfferStatus {
  PENDING       // Čeká na odpověď
  ACCEPTED      // Přijato
  COUNTERED     // Protinávrh
  REJECTED      // Odmítnuto
  EXPIRED       // Vypršelo
  WITHDRAWN     // Staženo kupujícím
}
```

---

## 🤝 B) Domlouvání prohlídek (core business)

### 6. Rezervace prohlídky (jako v hotelu)

**Flow:**
```
1. Kupující vybere termín z kalendáře
2. Zadá telefon → SMS kód pro ověření
3. Potvrzení emailem + SMS
4. Připomínka den předem
5. Po prohlídce: výzva k recenzi
```

**Kalendář makléře:**
```
┌──────────────────────────────────────────────────────────────────┐
│  REZERVOVAT PROHLÍDKU                                           │
│  Škoda Octavia RS • Jan Novák                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Leden 2026                              < >                    │
│  ┌────┬────┬────┬────┬────┬────┬────┐                          │
│  │ Po │ Út │ St │ Čt │ Pá │ So │ Ne │                          │
│  ├────┼────┼────┼────┼────┼────┼────┤                          │
│  │    │    │ 1  │ 2  │ 3  │ 4  │ 5  │                          │
│  │    │    │    │    │ ░░ │ ░░ │    │                          │
│  ├────┼────┼────┼────┼────┼────┼────┤                          │
│  │ 6  │ 7  │ 8  │ 9  │ 10 │ 11 │ 12 │                          │
│  │    │ ░░ │ ░░ │ ░░ │ ░░ │ ░░ │    │                          │
│  └────┴────┴────┴────┴────┴────┴────┘                          │
│                                                                  │
│  ░░ = volné termíny                                             │
│                                                                  │
│  Čtvrtek 9.1.2026                                               │
│  ○ 10:00   ○ 11:00   ○ 14:00   ● 15:00   ○ 16:00               │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Vaše jméno*: [_________________________]                       │
│  Telefon*:    [_________________________]                       │
│                                                                  │
│  📱 Pošleme vám SMS kód pro ověření                            │
│                                                                  │
│  [Potvrdit termín]                                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Datový model:**
```prisma
model Viewing {
  id              String   @id @default(cuid())
  
  vehicleId       String
  vehicle         Vehicle  @relation(fields: [vehicleId], references: [id])
  
  brokerId        String
  broker          User     @relation(fields: [brokerId], references: [id])
  
  // Zájemce
  visitorName     String
  visitorPhone    String
  visitorEmail    String?
  visitorVerified Boolean  @default(false)
  
  // Termín
  scheduledAt     DateTime
  duration        Int      @default(30) // minut
  
  // Lokace
  location        String?  // Adresa nebo "dle dohody"
  
  // Status
  status          ViewingStatus @default(PENDING)
  
  // Poznámky
  visitorNote     String?
  brokerNote      String?
  
  // Připomínky
  reminderSent    Boolean  @default(false)
  
  // Po prohlídce
  outcome         ViewingOutcome?
  outcomeNote     String?
  
  createdAt       DateTime @default(now())
  confirmedAt     DateTime?
  completedAt     DateTime?
}

enum ViewingStatus {
  PENDING         // Čeká na potvrzení
  CONFIRMED       // Potvrzeno
  CANCELLED       // Zrušeno
  COMPLETED       // Proběhlo
  NO_SHOW         // Nedostavil se
}

enum ViewingOutcome {
  INTERESTED      // Má zájem, bude se ozývat
  OFFER_MADE      // Dal nabídku
  NOT_INTERESTED  // Nemá zájem
  PURCHASED       // Koupil
}
```

---

### 7. Anonymní chat (bez sdílení čísel)

**Funkce:**
- Chat přímo na webu
- Čísla se nezobrazují dokud obě strany nechtějí
- Šablony rychlých dotazů
- Historie komunikace

**UI:**
```
┌──────────────────────────────────────────────────────────────────┐
│  💬 ZPRÁVY                                                      │
│  Škoda Octavia RS • Jan Novák                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Rychlé dotazy:                                                  │
│  [Stav pneu?] [Servisní historie?] [Možnost slevy?] [Kdy volno?]│
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│                              17.1. 10:32                        │
│                              ┌──────────────────────────┐       │
│                              │ Dobrý den, jaký je stav  │       │
│                              │ pneumatik?               │       │
│                              └──────────────────────────┘       │
│                                                                  │
│  17.1. 10:45                                                    │
│  ┌──────────────────────────┐                                   │
│  │ Dobrý den, pneu jsou     │                                   │
│  │ zimní Continental,       │                                   │
│  │ 80% dezén. Letní na      │                                   │
│  │ ALU jsou součástí.       │                                   │
│  └──────────────────────────┘                                   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Napište zprávu...                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│  [📎] [Odeslat]                                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Datový model:**
```prisma
model Conversation {
  id              String   @id @default(cuid())
  
  vehicleId       String
  vehicle         Vehicle  @relation(fields: [vehicleId], references: [id])
  
  brokerId        String
  broker          User     @relation(fields: [brokerId], references: [id])
  
  // Zájemce (může být anonymní)
  visitorId       String?
  visitorEmail    String?
  visitorName     String?
  
  // Stav
  status          ConversationStatus @default(ACTIVE)
  
  messages        Message[]
  
  // Stats
  lastMessageAt   DateTime?
  unreadBroker    Int      @default(0)
  unreadVisitor   Int      @default(0)
  
  createdAt       DateTime @default(now())
}

model Message {
  id              String   @id @default(cuid())
  
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  
  senderType      SenderType
  senderId        String?
  
  content         String
  
  isRead          Boolean  @default(false)
  readAt          DateTime?
  
  createdAt       DateTime @default(now())
}

enum SenderType {
  BROKER
  VISITOR
  SYSTEM
}
```

---

### 8. Lokace jen orientačně

**(Už implementováno v modulu 7)**
- Město + městská část veřejně
- Přesná adresa až po potvrzení termínu prohlídky

---

### 9. Check-list pro prohlídku

**V detailu auta sekce:**
```
┌──────────────────────────────────────────────────────────────────┐
│  📋 PRŮVODCE PROHLÍDKOU                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Před prohlídkou zkontrolujte:                                  │
│                                                                  │
│  🔧 MECHANIKA                                                   │
│  ☐ Studený start motoru (ráno)                                 │
│  ☐ Kouř z výfuku (bílý/modrý/černý)                           │
│  ☐ Zvuky motoru na volnoběh                                    │
│  ☐ Převodovka - plynulé řazení                                 │
│                                                                  │
│  🚗 KAROSERIE                                                   │
│  ☐ Spáry mezi díly (stejnoměrné?)                              │
│  ☐ Lak - přechody barev, přelakovávky                         │
│  ☐ Koroze - prahy, podběhy, okraje dveří                      │
│  ☐ Skla - originál? Praskliny?                                 │
│                                                                  │
│  🔌 ELEKTRO                                                     │
│  ☐ Všechna světla funkční                                      │
│  ☐ Klimatizace - chladí?                                       │
│  ☐ Všechny ovladače a displeje                                 │
│                                                                  │
│  📄 DOKUMENTY                                                   │
│  ☐ Velký + malý techničák                                      │
│  ☐ Servisní kniha                                              │
│  ☐ Počet klíčů                                                 │
│                                                                  │
│  💡 TIP: Doporučujeme nezávislou diagnostiku v servisu         │
│          (cca 500-1500 Kč)                                      │
│                                                                  │
│  [📥 Stáhnout jako PDF]                                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## ✅ C) Důvěra (2026 faktor)

### 10. Odznaky důvěry

**Odznaky pro vozidla:**
```
┌─────────────────────────────────────────────────────────────────┐
│  DŮVĚRYHODNOST INZERÁTU                          Score: 92/100 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Ověřený prodávající (telefon + email)                       │
│  ✅ VIN doplněn a ověřen                                        │
│  ✅ Servisní historie nahrána (3 záznamy)                       │
│  ✅ 20+ kvalitních fotek                                        │
│  ✅ Kompletní technické údaje                                   │
│  ✅ Rychlá reakce (Ø 2 hodiny)                                  │
│                                                                 │
│  ⚠️ Chybí: Protokol z STK                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Datový model:**
```prisma
model VehicleTrustScore {
  id              String   @id @default(cuid())
  vehicleId       String   @unique
  vehicle         Vehicle  @relation(fields: [vehicleId], references: [id])
  
  // Jednotlivé body
  verifiedSeller  Boolean  @default(false)  // +15
  vinVerified     Boolean  @default(false)  // +20
  serviceHistory  Boolean  @default(false)  // +15
  photosCount     Int      @default(0)      // +1 za fotku, max +20
  completeData    Boolean  @default(false)  // +15
  fastResponse    Boolean  @default(false)  // +10 (Ø < 4h)
  stkProtocol     Boolean  @default(false)  // +5
  
  // Celkové skóre
  totalScore      Int      @default(0)
  
  updatedAt       DateTime @updatedAt
}
```

**Odznaky pro makléře:**
```
👤 Jan Novák
━━━━━━━━━━━━━━━━━━━━━━
🏆 TOP Makléř 2025
⚡ Rychlá reakce (Ø 1.5h)
✅ 98% spokojených klientů
🚗 150+ prodaných vozů
📍 Praha specialista
```

---

### 11. Ověřené recenze

**Kdo může dát recenzi:**
```
1. Měl potvrzenou prohlídku (Viewing.status = COMPLETED)
2. Dokončil deal přes web (Offer.status = ACCEPTED + Sale)
3. Dostal unikátní review link po prohlídce
```

**Badge u recenze:**
```
⭐⭐⭐⭐⭐  "Perfektní zkušenost!"
Martin K. • ✅ Ověřená prohlídka • 15.1.2026
```

---

### 12. Transparentní historie změn

**Timeline u auta:**
```
┌──────────────────────────────────────────────────────────────────┐
│  📅 HISTORIE INZERÁTU                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ○ 17.1.2026 - Cena snížena                                     │
│    480 000 Kč → 450 000 Kč (-6.3%)                              │
│                                                                  │
│  ○ 15.1.2026 - Přidány fotky                                    │
│    +3 fotky interiéru                                           │
│                                                                  │
│  ○ 10.1.2026 - Aktualizace                                      │
│    Doplněna servisní historie                                   │
│                                                                  │
│  ● 5.1.2026 - Inzerát vytvořen                                  │
│    Původní cena: 480 000 Kč                                     │
│                                                                  │
│  Na Carmakler: 12 dní                                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🧑‍💼 D) Funkce pro makléře

### 13. Profil makléře = mini prodejní stránka

**(Rozšíření modulu 3)**

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌──────┐  Jan Novák                                            │
│  │      │  Senior makléř                                         │
│  │ FOTO │                                                        │
│  │      │  🏆 TOP 10 Makléř 2025                                │
│  └──────┘  ⚡ Odpovídá do 1.5 hodiny                            │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  SPECIALIZACE                                                    │
│  [SUV & Crossover] [Premium vozy] [Rodinná auta]                │
│                                                                  │
│  STATISTIKY                                                      │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │    156    │ │   ⭐4.9   │ │   18 dní  │ │   98%     │       │
│  │  prodáno  │ │ hodnocení │ │ Ø prodej  │ │spokojenos │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### 14. CRM Pipeline (jednoduchý)

**Stavy leadů:**
```
NOVÝ → KONTAKTOVÁN → PROHLÍDKA → JEDNÁNÍ → UZAVŘENO / ZTRACENO
```

**PWA obrazovka:**
```
┌──────────────────────────────────────────────────────────────────┐
│  📊 PIPELINE                                          [+ Lead]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NOVÝ (3)        KONTAKT (5)     PROHLÍDKA (2)   JEDNÁNÍ (1)   │
│  ┌─────────┐    ┌─────────┐     ┌─────────┐    ┌─────────┐     │
│  │ BMW X5  │    │ Octavia │     │ Golf    │    │ Passat  │     │
│  │ Martin  │    │ Jana    │     │ Petr    │    │ Karel   │     │
│  │ Praha   │    │ Brno    │     │ 18.1.   │    │ 420k    │     │
│  └─────────┘    └─────────┘     └─────────┘    └─────────┘     │
│  ┌─────────┐    ┌─────────┐                                     │
│  │ Audi Q7 │    │ Tiguan  │                                     │
│  │ Tomáš   │    │ Eva     │                                     │
│  └─────────┘    └─────────┘                                     │
│                                                                  │
│  Drag & drop pro změnu stavu                                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Datový model:**
```prisma
model CrmLead {
  id              String   @id @default(cuid())
  
  brokerId        String
  broker          User     @relation(fields: [brokerId], references: [id])
  
  // Zdroj
  vehicleId       String?
  vehicle         Vehicle? @relation(fields: [vehicleId], references: [id])
  
  // Kontakt
  name            String
  phone           String
  email           String?
  
  // Pipeline
  stage           LeadStage @default(NEW)
  
  // Hodnota
  expectedValue   Int?
  
  // Follow-up
  nextFollowUp    DateTime?
  
  // Poznámky
  notes           CrmNote[]
  
  // Outcome
  outcome         LeadOutcome?
  lostReason      String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum LeadStage {
  NEW
  CONTACTED
  VIEWING_SCHEDULED
  NEGOTIATION
  CLOSED_WON
  CLOSED_LOST
}
```

---

### 15. Automatické přiřazení poptávky

**Logika:**
```javascript
async function assignLead(lead: IncomingLead) {
  // 1. Najít makléře v regionu
  const brokersInRegion = await getBrokersInRegion(lead.city);
  
  // 2. Filtrovat podle specializace (pokud známe typ auta)
  let candidates = brokersInRegion;
  if (lead.brand && isPremiumBrand(lead.brand)) {
    candidates = candidates.filter(b => b.specializations.includes('premium'));
  }
  
  // 3. Seřadit podle výkonu
  candidates.sort((a, b) => {
    // Score = responseTime + conversionRate + currentLoad
    return calculateBrokerScore(b) - calculateBrokerScore(a);
  });
  
  // 4. Přiřadit nejlepšímu volnému
  const selectedBroker = candidates.find(b => b.currentLeads < b.maxLeads);
  
  // 5. Nebo rotace (round-robin)
  // const selectedBroker = getNextBrokerInRotation(candidates);
  
  return selectedBroker;
}
```

---

## 💰 E) Monetizace

### 16. Balíčky pro prodávající

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  VYBERTE BALÍČEK                                                        │
│                                                                         │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐     │
│  │      BASIC        │ │       PRO         │ │      ELITE        │     │
│  │                   │ │    ⭐ Oblíbený    │ │                   │     │
│  │    ZDARMA         │ │    2 990 Kč       │ │    4 990 Kč       │     │
│  │                   │ │                   │ │                   │     │
│  │ ✓ Vystavení       │ │ ✓ Vše z Basic     │ │ ✓ Vše z Pro       │     │
│  │ ✓ 10 fotek        │ │ ✓ 30 fotek        │ │ ✓ Neomezené fotky │     │
│  │ ✓ Základní podpora│ │ ✓ Topování 7 dní  │ │ ✓ Topování 30 dní │     │
│  │                   │ │ ✓ Zvýraznění      │ │ ✓ Premium pozice  │     │
│  │                   │ │ ✓ Kontrola VIN    │ │ ✓ Osobní makléř   │     │
│  │                   │ │ ✓ Ověření fotek   │ │ ✓ Smlouvy + přepis│     │
│  │                   │ │                   │ │ ✓ Profi fotky     │     │
│  │                   │ │                   │ │                   │     │
│  │    [Vybrat]       │ │    [Vybrat]       │ │    [Vybrat]       │     │
│  └───────────────────┘ └───────────────────┘ └───────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 17. "Prodat bez starostí" Landing

**Hlavní lead magnet na homepage:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                    PRODEJTE AUTO BEZ STAROSTÍ                           │
│                                                                          │
│          Náš makléř zařídí vše - od fotek po přepis                     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │   SPZ nebo VIN      [3A2 1234____________]                        │ │
│  │                                                                    │ │
│  │   Rok výroby        [2020_________________]                       │ │
│  │                                                                    │ │
│  │   Najeto km         [85000________________]                       │ │
│  │                                                                    │ │
│  │   Město             [Praha________________]                       │ │
│  │                                                                    │ │
│  │   Váš telefon       [+420________________]                        │ │
│  │                                                                    │ │
│  │   [        CHCI PRODAT AUTO        ]                              │ │
│  │                                                                    │ │
│  │   📞 Makléř vás kontaktuje do 24 hodin                           │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ✓ Zdarma ocenění   ✓ Bez závazků   ✓ Profi fotky   ✓ Vše online      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 18. Rezervační záloha

**Volitelná funkce:**
```
"Chcete mít jistotu, že auto počká na vás?"

Složte rezervační zálohu 5 000 Kč a:
✓ Auto bude staženo z nabídky na 48h
✓ Máte přednost před ostatními zájemci
✓ Záloha se odečte z kupní ceny
✓ Pokud nekoupíte, záloha propadá

[Rezervovat s platbou 5 000 Kč]
```

---

## 🧠 F) 2026 Vibe - Homepage sekce

### 19. Kategorie pro scrollování (Netflix efekt)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  🔥 NEJLEPŠÍ POMĚR CENA/VÝKON                     [Zobrazit všechny →]  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ →         │
│  │         │ │         │ │         │ │         │ │         │            │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                                          │
│  👨‍👩‍👧‍👦 RODINNÉ TOPY                                  [Zobrazit všechny →]  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ →         │
│  │         │ │         │ │         │ │         │ │         │            │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                                          │
│  🏙️ IDEÁLNÍ DO MĚSTA                               [Zobrazit všechny →]  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ →         │
│                                                                          │
│  🛣️ NA DÁLKY                                        [Zobrazit všechny →]  │
│                                                                          │
│  💰 NEJLEVNĚJŠÍ AUTOMATY                           [Zobrazit všechny →]  │
│                                                                          │
│  🆕 NOVĚ PŘIDANÉ                                    [Zobrazit všechny →]  │
│                                                                          │
│  ⬇️ PRÁVĚ ZLEVNĚNÉ                                  [Zobrazit všechny →]  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Logika kategorií:**
```javascript
const homepageCategories = {
  'best-value': {
    title: '🔥 Nejlepší poměr cena/výkon',
    filter: (v) => v.valueScore >= 8.5,
    sort: 'valueScore DESC'
  },
  'family': {
    title: '👨‍👩‍👧‍👦 Rodinné topy',
    filter: (v) => v.familyScore >= 8.0,
    sort: 'familyScore DESC'
  },
  'city': {
    title: '🏙️ Ideální do města',
    filter: (v) => v.cityScore >= 8.0 && v.price <= 400000,
    sort: 'cityScore DESC'
  },
  'highway': {
    title: '🛣️ Na dálky',
    filter: (v) => v.highwayScore >= 8.5,
    sort: 'highwayScore DESC'
  },
  'cheapest-auto': {
    title: '💰 Nejlevnější automaty',
    filter: (v) => v.transmission === 'AUTOMATIC',
    sort: 'price ASC',
    limit: 10
  },
  'new': {
    title: '🆕 Nově přidané',
    sort: 'publishedAt DESC',
    limit: 10
  },
  'price-drop': {
    title: '⬇️ Právě zlevněné',
    filter: (v) => v.priceDropPercent > 0,
    sort: 'priceDroppedAt DESC',
    limit: 10
  }
};
```

---

### 20. Personalizace homepage

**Sledování chování:**
```prisma
model UserBehavior {
  id          String   @id @default(cuid())
  
  userId      String?
  sessionId   String
  
  // Co prohlížel
  viewedVehicles Json   // [{id, brand, model, bodyType, price}]
  viewedBrands   String[]
  viewedBodyTypes String[]
  priceRange     Json    // {min, max, avg}
  
  // Interakce
  savedVehicles  String[]
  searchQueries  String[]
  
  updatedAt   DateTime @updatedAt
}
```

**Personalizované sekce:**
```
┌──────────────────────────────────────────────────────────────────┐
│  👤 DOPORUČENO PRO VÁS                                          │
│  Na základě vašeho prohlížení                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Podobné │ │ tomu co │ │ jste    │ │prohlížel│               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                  │
│  🕐 NEDÁVNO PROHLÍŽENÉ                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                           │
│  │ Octavia │ │ Golf    │ │ Passat  │                           │
│  └─────────┘ └─────────┘ └─────────┘                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 💣 BOOM SET - Priority implementace

### Fáze 1 (MVP+)
1. ✅ Rezervace prohlídky + SMS ověření
2. ✅ Anonymní chat
3. ✅ Odznaky důvěry + Trust Score
4. ✅ Historie změn inzerátu

### Fáze 2 (Engagement)
5. ✅ Offer systém (nabídka ceny)
6. ✅ Hlídač aut + ceny
7. ✅ Ověřené recenze
8. ✅ Netflix sekce na homepage

### Fáze 3 (AI & Personalizace)
9. ✅ Smart search (AI)
10. ✅ "Pomoz mi vybrat" kvíz
11. ✅ Porovnání se Score
12. ✅ Personalizace homepage

### Fáze 4 (Monetizace)
13. ✅ Balíčky pro prodávající
14. ✅ "Prodat bez starostí" landing
15. ✅ Rezervační záloha
16. ✅ CRM pipeline pro makléře
