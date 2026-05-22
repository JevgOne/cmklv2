# PLÁN: Autoservisy — ověřené recenze a kontrola kvality

**Datum:** 2026-05-20 (rev. 2)
**Priorita:** P2 (koncepční plán, ne implementace)
**Typ:** Produktový koncept / vision document

---

## EXECUTIVE SUMMARY

Carmakler chce rozšířit ekosystém o **autoservisy** zaměřené na **kontrolu kvality** — ověřené recenze a transparentní scoring. NE evidence zakázek (nereálné — servisy to nebudou dělat).

Cíl: Carmakler se stane **důvěryhodným zdrojem recenzí autoservisů**, kde každá recenze je ověřená — zákazník prokazatelně v servisu byl. Žádné fake recenze, žádná competitor sabotáž.

**Klíčový diferenciátor vs Google:** Carmakler recenze vyžadují **důkaz návštěvy** (fotka faktury, GPS check-in, číslo zakázky). Google recenze může napsat kdokoli.

---

## 1. PROBLÉM, KTERÝ ŘEŠÍME

### Současný stav trhu autoservisů v ČR

- **~15 000 autoservisů** v ČR, kvalita extrémně variabilní
- **Google recenze jsou nespolehlivé:**
  - Kdokoli může napsat recenzi bez návštěvy
  - Competitor sabotáž (kupované negativní recenze)
  - Servis kupuje pozitivní recenze (5.0 hvězd = podezřelé)
  - Google smaže legitimní negativní recenze na request servisu
- **Zákazník neví komu věřit:**
  - "Jak poznám kvalitní servis?" → Spoléhá na doporučení známých
  - "Google recenze jsou k ničemu" → 5.0 = kupované, 1.0 = competitor
  - Servis řekne "vyměnili jsme brzdy" — ale opravdu? Zákazník to nepozná
- **Žádná centrální databáze kvality** — každý servis je black box

---

## 2. ŘEŠENÍ: 2 PILÍŘE

### Pilíř 1: Ověřené recenze (důkaz návštěvy)

**Problém:** Jak ověřit, že zákazník v servisu opravdu byl, BEZ toho aby servis musel evidovat zakázky?

#### 4 metody verifikace (zákazník zvolí jednu)

##### Metoda A: Fotka faktury (OCR) — PRIMÁRNÍ

```
Zákazník napíše recenzi
    ↓
Nahraje fotku faktury ze servisu
    ↓
OCR (Tesseract / Claude Vision) extrahuje:
  - Název servisu (match s profilem)
  - Datum (recenze max 30 dní od faktury)
  - Částku (ukáže se jako cenový rozsah, ne přesná cena)
  - IČO servisu (cross-check s profilem)
    ↓
Match ≥ 3/4 → recenze OVĚŘENÁ ✅
Match < 3/4 → manuální review moderátorem
```

**Proč OCR:**
- Každý zákazník dostane fakturu (povinné ze zákona)
- Zákazník ji má v emailu nebo fyzicky
- Nepotřebuje spolupráci servisu
- Faktura prokazuje návštěvu, datum, typ práce, cenu
- Claude Vision API umí česky a zvládá nekvalitní fotky

**GDPR:** Faktura obsahuje osobní údaje zákazníka. Řešení:
- OCR extrahuje POUZE: název servisu, IČO, datum, částku
- Fotka se po OCR zpracování SMAŽE (nebude uložena)
- Zákazník souhlasí s podmínkami při uploadu

**Edge cases:**
- Nečitelná faktura → manuální review moderátorem
- Faktura na jiný servis → zamítnout, upozornit zákazníka
- Faktura starší než 90 dní → upozornění "recenze z delší doby", ale povolit
- Zákazník nemá fakturu → nabídnout alternativní metody

##### Metoda B: Číslo faktury/zakázky (servis potvrdí)

```
Zákazník napíše recenzi + zadá číslo faktury
    ↓
Servis dostane notifikaci:
  "Zákazník Jan N. napsal recenzi.
   Číslo faktury: FA-2026-0847.
   Můžete potvrdit návštěvu?"
    ↓
Servis klikne POTVRDIT → recenze OVĚŘENÁ ✅
Servis klikne ZAMÍTNOUT → recenze čeká na moderaci
Servis nereaguje 7 dní → recenze se zobrazí jako "nepotvrzená"
```

**Výhody:**
- Nejpřesnější verifikace
- Servis ví o recenzi a může odpovědět

**Nevýhody:**
- Servis může zamítnout legitimní negativní recenzi → potřeba moderace
- Servis musí být registrovaný a aktivní na platformě

**Ochrana proti zneužití:**
- Servis, který zamítne > 50% recenzí → automatický flag pro moderátora
- Zákazník, jehož recenze servis zamítl, může eskalovat (nahrát fakturu jako důkaz)
- Servis NEMŮŽE smazat ověřenou recenzi — může pouze odpovědět

##### Metoda C: GPS check-in

```
Zákazník otevře Carmakler appku/web v lokaci servisu
    ↓
GPS ověří: poloha zákazníka < 200m od adresy servisu
    ↓
Check-in se uloží s timestampem
    ↓
Do 14 dní může napsat recenzi → OVĚŘENÁ ✅
```

**Výhody:**
- Nulová friction pro zákazníka (1 klik)
- Nepotřebuje fakturu ani spolupráci servisu
- Prokazuje fyzickou přítomnost

**Nevýhody:**
- Zákazník musí mít appku/web BĚHEM návštěvy (ne po)
- GPS spoofing (ale vyžaduje úmysl, low risk)
- Zákazník může být jen kolemjdoucí (ale recenzi stejně napíše jen kdo tam byl)

**Implementace:**
```typescript
// Geolocation API
navigator.geolocation.getCurrentPosition((pos) => {
  const distance = haversine(pos, serviceProvider.coords);
  if (distance < 200) {
    // Save check-in
    await saveCheckIn(userId, serviceProviderId, pos, new Date());
  }
});
```

##### Metoda D: Ověření přes platební transakci

```
Zákazník nahraje screenshot bankovního výpisu
  (řádek s platbou servisu)
    ↓
OCR extrahuje: příjemce, částku, datum
    ↓
Match s profilem servisu → OVĚŘENÁ ✅
```

**Výhody:**
- Velmi silný důkaz (bankovní transakce nelze zfalšovat)
- Funguje i měsíce po návštěvě

**Nevýhody:**
- Hodně citlivá data (bankovní výpis)
- Zákazníci nebudou ochotní sdílet
- Platba hotově → tato metoda nefunguje

**Hodnocení:** Spíše backup metoda pro edge cases, NE primární.

#### Srovnání metod

| Metoda | Spolehlivost | Friction | Potřebuje servis? | MVP? |
|--------|-------------|----------|-------------------|------|
| A: Fotka faktury (OCR) | HIGH | MEDIUM | ❌ Ne | ✅ ANO |
| B: Číslo zakázky | VERY HIGH | LOW | ✅ Ano (potvrdí) | ✅ ANO |
| C: GPS check-in | MEDIUM | VERY LOW | ❌ Ne | ⚠️ Fáze 2 |
| D: Bankovní výpis | VERY HIGH | HIGH | ❌ Ne | ❌ Ne |

**DOPORUČENÍ pro MVP:** Metoda A (fotka faktury) + Metoda B (číslo zakázky). GPS check-in ve fázi 2.

#### Struktura ověřené recenze

Zákazník hodnotí **4 dimenze** (1-5 hvězd):
1. **Kvalita práce** — "Udělali to dobře?"
2. **Komunikace** — "Byli vstřícní, informovali mě?"
3. **Dodržení termínu** — "Hotovo včas?"
4. **Poměr cena/výkon** — "Cena odpovídá kvalitě?"

Plus:
- **Textová recenze** (min. 50 znaků)
- **Typ práce** (výběr z kategorií: brzdy, motor, karoserie, klimatizace, servis, STK, pneu, diagnostika, jiné)
- **Cenový rozsah** (do 2 000 / 2-5 000 / 5-15 000 / 15-50 000 / nad 50 000 Kč)

**Servis může:**
- Odpovědět veřejně na recenzi
- Nahlásit falešnou recenzi (moderace)
- **NEMŮŽE:** smazat recenzi, editovat recenzi, skrýt recenzi

#### Anti-fraud systém

| Hrozba | Detekce | Akce |
|--------|---------|------|
| Servis píše fake pozitivní recenze | IP analýza, device fingerprint, časové vzory (3 recenze za den ze stejné IP) | Auto-flag → moderace |
| Competitor píše fake negativní recenze | Recenze BEZ verifikace nemají váhu; verifikace vyžaduje fakturu/GPS | Neověřená recenze se nezobrazuje v ratingu |
| Zákazník recykluje fakturu | OCR kontroluje datum + číslo faktury (unikátní per servis) | Duplikát → zamítnout |
| Servis zamítá legitimní negativní recenze (Metoda B) | Tracking zamítnutí rate per servis; > 50% → flag | Moderátor přezkoumá + zákazník může eskalovat (nahrát fakturu) |
| Hromadný útok botů | Rate limiting, CAPTCHA, ověřený email/telefon | Auto-block + manuální review |

---

### Pilíř 2: Service Quality Score (SQS)

Algoritmus hodnotící servis na základě OVĚŘENÝCH recenzí (ne evidence zakázek):

```
SQS = (
    verified_review_avg    * 0.40 +   # Průměr ověřených recenzí (1-5 → normalizováno 0-100)
    review_count_score     * 0.20 +   # Počet recenzí (log škála, max při 50+)
    repeat_customer_rate   * 0.15 +   # % zákazníků co přidali 2+ recenze u stejného servisu
    response_rate          * 0.10 +   # % recenzí na které servis odpověděl
    recency_factor         * 0.10 +   # Čerstvost recenzí (novější = vyšší váha)
    profile_completeness   * 0.05     # Kompletnost profilu (foto, popis, otevírací hodiny)
)
```

#### Výpočet komponent

**verified_review_avg (40%):**
- POUZE ověřené recenze (Metoda A/B/C)
- Průměr z 4 dimenzí (kvalita, komunikace, termín, cena/výkon)
- Minimum 5 ověřených recenzí pro zobrazení SQS
- Pod 5 recenzí → "Nedostatek hodnocení" místo čísla

**review_count_score (20%):**
- Logaritmická škála: 5 recenzí = 40 bodů, 20 = 70, 50+ = 100
- Motivuje sbírat recenze, ale nedominuje score

**repeat_customer_rate (15%):**
- Zákazník, který napsal 2+ recenze u stejného servisu = loajální
- Indikátor reálné spokojenosti (ne jednorázová fake recenze)
- Identifikace přes ověřený email/telefon

**response_rate (10%):**
- Servis, který odpovídá na recenze = aktivní a vstřícný
- Odpověď na negativní recenzi je signál kvality ("bereme zpětnou vazbu vážně")

**recency_factor (10%):**
- Recenze starší 12 měsíců mají sníženou váhu (0.5x)
- Recenze starší 24 měsíců mají minimální váhu (0.2x)
- Motivuje konzistentní kvalitu, ne jednorázový peak

**profile_completeness (5%):**
- Bonus za vyplněný profil: foto, otevírací hodiny, popis, specializace
- Malá váha, ale motivuje servisy k aktivitě

#### Veřejně viditelné metriky

```
┌──────────────────────────────────────────────────┐
│  AUTOSERVIS NOVÁK s.r.o.                         │
│  ⭐ 4.3/5 (47 ověřených recenzí)                 │
│  ✅ Carmakler Verified                            │
│                                                   │
│  📊 Service Quality Score: 82/100                 │
│                                                   │
│  Kvalita práce:    ████████░░ 4.1                 │
│  Komunikace:       █████████░ 4.5                 │
│  Dodržení termínu: ███████░░░ 3.8                 │
│  Cena/výkon:       ████████░░ 4.2                 │
│                                                   │
│  🔄 Opakovaní zákazníci: 34%                      │
│  💬 Odpovídá na recenze: 89%                      │
│  ⏱️ Na platformě od: duben 2026                   │
│                                                   │
│  Specializace: brzdy, motor, diagnostika          │
│  Značky: Škoda, VW, Audi, Seat                    │
│  Cenové rozmezí: střední                           │
│                                                   │
│  📍 Brno-Židenice | ☎ 777 123 456                 │
│  🌐 autoservis-novak.cz                           │
└──────────────────────────────────────────────────┘
```

#### SQS thresholds

| SQS | Badge | Význam |
|-----|-------|--------|
| 0-49 | ❌ Bez badge | Málo recenzí nebo nízké hodnocení |
| 50-69 | 🟡 "Na platformě" | Základní profil, sbírá recenze |
| 70-84 | 🟢 "Doporučený" | Solidní servis, ověřená kvalita |
| 85-100 | ✅ "Carmakler Verified" | Top servis, vysoká důvěra |

Podmínky pro **"Carmakler Verified":**
- SQS ≥ 85
- Min. 20 ověřených recenzí
- Min. 6 měsíců na platformě
- Response rate ≥ 70%
- Žádné neřešené stížnosti

---

## 3. KATALOG SERVISŮ

### Seed data z Lead Scout

Rozšířit Lead Scout o kategorii AUTOSERVIS (separátní od AUTOBAZAR/VRAKOVISTE):

```python
# Nová kategorie v models.py (Lead Scout)
class Category(str, Enum):
    SOUKROMNIK = "SOUKROMNIK"
    AUTOBAZAR = "AUTOBAZAR"
    VRAKOVISTE = "VRAKOVISTE"
    AUTOSERVIS = "AUTOSERVIS"  # NEW
```

**Zdroje dat:**
- **Firmy.cz** — queries: "autoservis", "autoopravna", "autoelektrika", "autolakovna", "pneuservis", "autoklempíř"
- **Google Places** — category "car_repair", "car_dealer" (filtrovat jen servisy)
- **Zlatéstránky.cz** — queries: "autoservis", "autoopravna"
- **ARES** — NACE kódy: 45.20 (údržba a opravy motorových vozidel)

**POZOR:** AUTOSERVIS queries se NESMÍ míchat s AUTOBAZAR queries. Separátní kategorie, separátní queries, separátní pipeline (viz `audit-autobazar-categories.md`).

**Odhadovaný počet:** ~5 000-8 000 servisů z CZ zdrojů.

### Profil servisu

Z Lead Scout dat se automaticky vytvoří základní profil:
- Název, adresa, město, PSČ, GPS souřadnice
- Telefon, web, email (pokud dostupné)
- Google rating (jako reference, NE jako Carmakler rating)
- IČO (z ARES)
- Kategorie/specializace (z NACE kódů nebo název heuristiky)

Servis si pak může profil **claimnout** (prokázat vlastnictví):
1. Zaregistruje se na Carmakler
2. Ověří IČO nebo email na doméně webu servisu
3. Doplní profil: otevírací hodiny, fotky provozovny, popis, specializace

### Stránky

| Route | Účel | SEO |
|-------|------|-----|
| `/servisy` | Katalog servisů s mapou, filtry, vyhledáváním | ✅ Landing |
| `/servisy/[slug]` | Detail servisu — profil, ověřené recenze, SQS | ✅ Detaily |
| `/servisy/[mesto]` | SEO landing: "autoservisy v Brně" | ✅ SEO |
| `/servisy/[mesto]/[specializace]` | SEO landing: "autoklempíř Brno" | ✅ SEO |
| `/servisy/recenze` | Formulář pro přidání recenze (s verifikací) | — |
| `/servisy/registrace` | Claim profilu servisu | — |
| `(admin)/admin/servisy` | Admin správa servisů + moderace recenzí | — |

---

## 4. BUSINESS MODEL

### Fáze 1: Free katalog + recenze (měsíce 1-6)

**Cena pro servis: ZDARMA**

- Katalog s ~5 000 profily (seed z Lead Scout)
- Zákazníci píšou ověřené recenze
- Servis si může claimnout profil (zdarma)
- SQS scoring se počítá automaticky

**Cíl:** Získat **50+ ověřených recenzí** a **100+ claimnutých profilů**. Kritická masa pro hodnotu.

**Monetizace:** Žádná. Investice do ekosystému a SEO traffic.

### Fáze 2: Premium listing (měsíce 6-12)

**Premium servis: 990 Kč/měsíc**

- Prioritní zobrazení ve výsledcích (nad neplacené)
- "Doporučený servis" badge (nezávisle na SQS — je to placená pozice)
- Rozšířený profil: video, certifikace, tým, galérie
- Analytika: kolik lidí vidělo profil, kolik kliklo na telefon/web
- Notifikace o nových recenzích + rychlá odpověď

**Free tier zůstává:** Základní profil + recenze + SQS

### Fáze 3: Rezervace a provize (měsíce 12+)

**Provize z rezervací: 5% z ceny práce** (max 500 Kč)

- Zákazník si zarezervuje termín přes Carmakler
- Carmakler zprostředkuje (Wolt model)
- Servis platí provizi jen z přivedených zákazníků
- Zákazník neplatí nic navíc
- Po dokončení práce zákazník automaticky dostane push na recenzi

**Bonusový revenue:**
- Propojení s eshopem autodílů — servis objedná díly přes Carmakler
- Cross-sell pojištění (prodloužená záruka na opravu)

### Revenue projekce (konzervativní)

| Metrika | Rok 1 | Rok 2 | Rok 3 |
|---------|-------|-------|-------|
| Profilů v katalogu | 5 000 | 7 000 | 10 000 |
| Claimnutých profilů | 100 | 500 | 2 000 |
| Ověřených recenzí | 50 | 1 000 | 5 000 |
| Premium servisů | 0 | 100 | 400 |
| Premium MRR | 0 Kč | 99 000 Kč | 396 000 Kč |
| Rezervací/měsíc | 0 | 200 | 1 500 |
| Provize/měsíc | 0 Kč | 50 000 Kč | 375 000 Kč |

---

## 5. PROPOJENÍ S EKOSYSTÉMEM CARMAKLER

### 5.1 Makléřská síť → Autoservis

```
Makléř naběhne auto → diagnostika odhalí problémy
    ↓
Carmakler doporučí ověřený servis (SQS ≥ 70) v okolí
    ↓
Servis opraví → makléř ověří opravu
    ↓
V inzerátu: "Opraveno v Carmakler Verified servisu (SQS 87)"
    ↓
WIN: Vyšší prodejní cena, důvěra kupujícího
```

### 5.2 Eshop autodílů → Autoservis

```
Zákazník hledá díl na Carmakler eshopu
    ↓
CTA: "Nemáte svého mechanika? Najděte ověřený servis"
    ↓
Odkaz na katalog servisů filtrovaný dle lokace + specializace
```

### 5.3 Inzerce → Autoservis

```
Inzerent podá inzerát
    ↓
Tip: "Auto potřebuje servis? Opravené auto se prodá rychleji a dráž"
    ↓
Odkaz na ověřený servis v okolí
```

### 5.4 Po prodeji → Autoservis

```
Kupující koupí auto přes Carmakler
    ↓
Automatický email: "Gratulujeme k novému autu!
  Doporučujeme první servis u ověřeného servisu:"
    ↓
Seznam top servisů v okolí kupujícího (dle PSČ/města)
```

---

## 6. TECHNICKÝ NÁVRH (high-level)

### Nové Prisma modely

```prisma
model ServiceProvider {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  ico             String?  @unique
  
  // Kontakt
  phone           String?
  email           String?
  web             String?
  
  // Adresa
  address         String?
  city            String?
  zip             String?
  lat             Float?
  lng             Float?
  regionId        String?
  
  // Profil
  description     String?
  logo            String?           // Cloudinary URL
  photos          String[]          // Fotky provozovny
  openingHours    Json?             // {mon: "8:00-17:00", ...}
  specializations String[]          // ["brzdy", "motor", "karoserie"]
  brands          String[]          // ["skoda", "vw", "audi"]
  
  // Scoring (computed, updated async)
  sqs             Float    @default(0)
  reviewCount     Int      @default(0)
  avgRating       Float    @default(0)
  repeatRate      Float    @default(0)
  responseRate    Float    @default(0)
  
  // External data (seed)
  googleRating    Float?
  googleReviewCount Int?
  
  // Status
  claimed         Boolean  @default(false)  // Servis si claimnul profil
  claimedById     String?                   // User ID kdo claimnul
  premium         Boolean  @default(false)
  status          ServiceProviderStatus @default(ACTIVE)
  
  // Relations
  reviews         ServiceReview[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ServiceReview {
  id                  String   @id @default(cuid())
  serviceProviderId   String
  serviceProvider     ServiceProvider @relation(...)
  authorId            String
  author              User     @relation(...)
  
  // Hodnocení (4 dimenze)
  qualityRating       Int      // 1-5: Kvalita práce
  communicationRating Int      // 1-5: Komunikace
  timelinessRating    Int      // 1-5: Dodržení termínu
  valueRating         Int      // 1-5: Cena/výkon
  overallRating       Float    // Computed average
  
  // Obsah
  text                String   // Min 50 znaků
  workType            String   // brzdy, motor, karoserie, ...
  priceRange          String   // do-2000, 2000-5000, 5000-15000, ...
  
  // Verifikace
  verificationMethod  VerificationMethod  // INVOICE_PHOTO, ORDER_NUMBER, GPS_CHECKIN
  verificationStatus  VerificationStatus  @default(PENDING)
  verificationData    Json?    // OCR result, GPS coords, order number
  
  // Odpověď servisu
  providerResponse    String?
  providerRespondedAt DateTime?
  
  // Moderace
  reportedCount       Int      @default(0)
  moderatorNote       String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model ServiceCheckIn {
  id                  String   @id @default(cuid())
  userId              String
  serviceProviderId   String
  lat                 Float
  lng                 Float
  distance            Float    // Vzdálenost od servisu v metrech
  usedForReview       Boolean  @default(false)
  
  createdAt           DateTime @default(now())
  expiresAt           DateTime // +14 dní
}

enum ServiceProviderStatus {
  PENDING     // Seed data, neověřený
  ACTIVE      // Viditelný v katalogu
  SUSPENDED   // Pozastavený (stížnosti)
  REMOVED     // Odstraněný
}

enum VerificationMethod {
  INVOICE_PHOTO   // Fotka faktury + OCR
  ORDER_NUMBER    // Číslo zakázky, servis potvrdil
  GPS_CHECKIN     // GPS check-in u servisu
  BANK_STATEMENT  // Screenshot bankovního výpisu (budoucnost)
  MANUAL          // Ručně ověřeno moderátorem
}

enum VerificationStatus {
  PENDING     // Čeká na ověření
  VERIFIED    // Ověřeno (automaticky nebo manuálně)
  REJECTED    // Zamítnuto
  DISPUTED    // Servis zpochybnil, čeká na moderaci
}
```

### API routes

```
POST /api/service-reviews              — Přidat recenzi
POST /api/service-reviews/verify       — Nahrát důkaz (faktura, GPS)
POST /api/service-reviews/[id]/respond — Odpověď servisu
POST /api/service-reviews/[id]/report  — Nahlásit recenzi
POST /api/service-checkin              — GPS check-in
POST /api/service-providers/claim      — Claim profilu servisu
GET  /api/service-providers/search     — Vyhledávání servisů
```

### OCR pipeline (Metoda A)

```
Zákazník nahraje fotku faktury
    ↓
Upload do Cloudinary (temporary, 24h TTL)
    ↓
Claude Vision API:
  Prompt: "Extract from this Czech invoice:
    1. Business name
    2. ICO (if visible)
    3. Date (format YYYY-MM-DD)
    4. Total amount (number only)
    Return JSON: {name, ico, date, amount}"
    ↓
Match extrahovaných dat s profilem servisu:
  - name similarity > 0.7 (Levenshtein)
  - ico exact match (pokud oba existují)
  - date within 90 days
    ↓
Score ≥ 3 match → auto-verify
Score 2 → pending (moderátor)
Score ≤ 1 → reject + notify zákazníka
    ↓
Smazat fotku z Cloudinary (GDPR)
```

---

## 7. GO-TO-MARKET STRATEGIE

### Krok 1: Seed katalog (automaticky)

- Lead Scout scrapne ~5 000 autoservisů (Firmy.cz + Google Places + ARES)
- Automaticky vytvoří profily v ServiceProvider
- Stránky `/servisy` a `/servisy/[slug]` live s basic daty
- Google rating zobrazit jako reference ("Google hodnocení: 4.2★")

### Krok 2: SEO landing pages

- `/servisy/praha` → "Autoservisy v Praze — hodnocení a recenze"
- `/servisy/brno` → "Autoservisy v Brně — hodnocení a recenze"
- 14 krajských měst + 20 dalších = 34 SEO landing pages
- Long-tail: `/servisy/praha/brzdy` → "Výměna brzd Praha"

### Krok 3: První recenze (makléřská síť)

- Makléři Carmakler znají servisy, se kterými spolupracují
- Každý makléř napíše 2-3 ověřené recenze → 30-50 seed recenzí
- Makléři požádají zákazníky (kupující) o recenzi po servisu

### Krok 4: Viralita přes recenze

```
Zákazník napíše ověřenou recenzi
    ↓
Email servisu: "Máte novou ověřenou recenzi na Carmakler!"
    ↓
Servis claimne profil aby mohl odpovědět
    ↓
Servis sdílí profil na sociálních sítích
    ↓
Další zákazníci přijdou + napíšou recenze
    ↓
Organický růst
```

---

## 8. KONKURENČNÍ VÝHODA

| | Google Maps | Firmy.cz | Carmakler |
|---|---|---|---|
| Recenze ověřené | ❌ Kdokoli | ❌ Kdokoli | ✅ Důkaz návštěvy (faktura/GPS) |
| Anti-fraud | ⚠️ Základní | ❌ | ✅ OCR + moderace + zamítnutí tracking |
| Scoring | ⚠️ Jen hvězdy | ⚠️ Jen hvězdy | ✅ 4-dimenzionální SQS |
| Odpověď servisu | ✅ Ano | ❌ | ✅ Ano + tracking |
| Propojení s prodejem aut | ❌ | ❌ | ✅ Makléři + inzerce + eshop |
| SEO landing pages | ❌ | ⚠️ Částečně | ✅ Město + specializace |

---

## 9. RIZIKA A MITIGACE

| Riziko | Dopad | Pravděp. | Mitigace |
|--------|-------|----------|----------|
| Zákazníci nebudou nahrávat faktury | HIGH | MEDIUM | GPS check-in jako nízko-friction alternativa; push notifikace po návštěvě |
| Servisy nebudou claimovat profily | MEDIUM | LOW | Profily existují i bez claimu; servis se dozví přes recenze |
| OCR nespolehlivý na českých fakturách | MEDIUM | LOW | Claude Vision je dobrý na CZ; fallback na manuální review |
| Servisy budou zamítat legitimní negativní recenze | HIGH | MEDIUM | Zamítnutí rate tracking; eskalace přes fotku faktury; moderátor |
| Nedostatek recenzí → SQS nemá smysl | HIGH | MEDIUM | Min. 5 recenzí pro SQS; do té doby zobrazit jen Google rating jako referenci |
| GDPR problém s fakturami | MEDIUM | LOW | OCR only (extrakce dat), fotka se smaže; explicitní souhlas zákazníka |

---

## 10. FÁZOVÁNÍ IMPLEMENTACE

### Fáze 1: Katalog (MVP — 2-3 týdny)
- Prisma model ServiceProvider
- Lead Scout: AUTOSERVIS kategorie + scraping pipeline
- Seed ~5 000 servisů
- `/servisy` — katalog s mapou, filtry (město, specializace)
- `/servisy/[slug]` — detail profilu (basic data + Google rating)
- `/servisy/[mesto]` — SEO landing pages (14 krajských měst)
- Admin: správa servisů

### Fáze 2: Ověřené recenze (3-4 týdny)
- Prisma model ServiceReview
- Recenzní formulář s verifikací (Metoda A: fotka faktury + Metoda B: číslo zakázky)
- OCR pipeline (Claude Vision API)
- SQS výpočet + badges
- Claim profilu servisu (registrace + IČO verifikace)
- Odpovědi servisu na recenze
- Moderace dashboard v admin

### Fáze 3: GPS + Premium (2-3 týdny)
- GPS check-in (Metoda C)
- ServiceCheckIn model
- Premium tier (990 Kč/měsíc, Stripe)
- Analytika pro servisy (views, clicks, conversions)
- Push notifikace pro recenze

### Fáze 4: Rezervace (2-3 týdny)
- Rezervační systém
- Provizní model (5% z ceny práce, max 500 Kč)
- Post-servis push na recenzi
- Propojení s makléřským workflow + eshopem

---

## STOP PRAVIDLA

- **STOP-1:** Pokud po 3 měsících < 20 ověřených recenzí → přehodnotit verifikační flow (příliš velká friction?)
- **STOP-2:** Pokud OCR success rate < 60% → zvážit alternativu (manuální review, jiná metoda)
- **STOP-3:** Pokud > 40% recenzí je zamítnuto servisy (Metoda B) → posílit moderaci + default na Metodu A
- **STOP-4:** Pokud revenue < 30 000 Kč/měsíc po 18 měsících → zvážit pivot nebo ukončení

---

## ZÁVĚR

Autoservisy v Carmakler ekosystému staví na jedné myšlence: **recenze, které nelze zfalšovat**. Oproti Google recenzím (kdokoli napíše cokoli) Carmakler vyžaduje důkaz návštěvy — fotku faktury nebo GPS check-in. To je jednoduchý koncept, který zákazníci pochopí a servisy budou respektovat.

Klíč k úspěchu: **nízká friction pro zákazníka** (fotka faktury telefonem = 10 sekund) + **hodnota pro servis** (ověřené recenze = důvěra = více zákazníků).
