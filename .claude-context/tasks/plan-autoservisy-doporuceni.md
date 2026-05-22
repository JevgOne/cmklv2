# Plán: Doporučení autoservisů a detailingů pro kupující

**Datum:** 2026-05-20
**Autor:** Plánovač (agent team)
**Task:** #4 — Research: Autoservisy a detailing jako doporučení pro kupující
**Status:** HOTOVO — plán připraven k implementaci

---

## 1. Shrnutí záměru

Uživatel chce rozšířit Carmakler o funkci **doporučení autoservisů a detailingových služeb** pro kupující. Kupující si koupí auto (např. Mercedes v Praze) a Carmakler mu nabídne ověřené servisy v jeho městě, ideálně se specializací na danou značku.

**Byznys motivace:**
- Full-service zážitek — kupující dostane kompletní péči, nejen auto
- Zvýšení retence — kupující se vrátí na platformu i po nákupu
- Budoucí monetizace — premium placement pro servisy (jako Wolt pro restaurace)
- Marketplace synergie — u drahých aut (BMW, Mercedes, Porsche) je servis klíčový

**Citace uživatele:**
> "Mohli bychom udělat to, že bychom přidávali autoservisy jako doporučení... klientovi dali plný servis, když si přes nás koupí auto třeba v Praze a bude to nevím Mercedes, tak mu dáme na výběr."

---

## 2. Datové zdroje

### 2.1 Primární: Firmy.cz (Apify scraper)

**Statistiky:**
- **8 549** firem v kategorii autoservis/auto-moto
- **35+ značkových podkategorií** (BMW, Mercedes, Škoda, Audi, VW, Toyota...)
- Pokrytí celé ČR

**Dostupná data z Apify scraperu:**
| Pole | Příklad |
|------|---------|
| `title` | "Autoservis BMW Praha - Motol" |
| `address` | "Plzeňská 221, 150 00 Praha 5" |
| `latitude`, `longitude` | 50.0681, 14.3539 |
| `description` | "Autorizovaný servis BMW..." |
| `categories` | ["Autoservisy", "BMW servisy"] |
| `rating` | 4.7 |
| `ratingcount` | 128 |
| `phone` | "+420 257 325 111" |
| `emails` | ["info@bmw-motol.cz"] |
| `website` | "https://bmw-motol.cz" |
| `url` | "https://www.firmy.cz/detail/123456" |

**Výhody:** Strukturovaná data, značkové kategorie, rating, CZ-only. Cena: ~$5/1000 výsledků na Apify.

**Apify actor:** `mhamas/firmy-cz-scraper`
- Input: `startUrls` (kategorie URL), `maxRequestsPerCrawl`
- Output: JSON s výše uvedenými poli

### 2.2 Sekundární: Google Places API (New)

**Již implementován** v Lead Scout (`scrapers/google_places.py`).

**Queries pro autoservisy:**
```python
QUERIES = {
    Category.AUTOSERVIS: [
        "autoservis", "autoopravna", "servis aut", "car service",
        "autorizovaný servis", "pneuservis",
    ],
    Category.DETAILING: [
        "detailing", "auto detailing", "leštění laku", "car wash premium",
        "keramický povlak", "PPF fólie",
    ],
}
```

**Výhody:** Aktuální data, Google rating/reviews, mezinárodní pokrytí (DE, AT, SK, PL).
**Nevýhody:** $32/1000 requestů (Places Text Search), limit 20 výsledků/query.

### 2.3 Doplňkové (budoucí)

| Zdroj | Pokrytí | Poznámka |
|-------|---------|----------|
| auto-service.cz | ČR, 1000+ servisů | Katalog, nutný vlastní scraper |
| katalog-autoservisu.cz | ČR, "největší katalog" | Nutný vlastní scraper |
| Detailing registry | ČR | Fragmentovaný trh, manuální sběr |

**Doporučení:** Fáze 1 = Firmy.cz + Google Places. Fáze 2 = doplnit specializované katalogy.

---

## 3. Změny v Lead Scout

### 3.1 Nové kategorie v `models.py`

```python
class Category(str, Enum):
    SOUKROMNIK = "SOUKROMNIK"
    AUTOBAZAR = "AUTOBAZAR"
    VRAKOVISTE = "VRAKOVISTE"
    AUTOSERVIS = "AUTOSERVIS"       # NOVÉ
    DETAILING = "DETAILING"         # NOVÉ
```

### 3.2 Nový Firmy.cz scraper pro autoservisy

Existující `scrapers/firmy_cz.py` již scrapuje Firmy.cz pro AUTOBAZAR/VRAKOVISTE. Rozšíření:

```python
# Přidat do SEARCH_QUERIES
SEARCH_QUERIES = {
    # ... existující ...
    Category.AUTOSERVIS: [
        "autoservis", "autoopravna", "autoservis BMW", "autoservis Mercedes",
        "autoservis Škoda", "autoservis VW", "pneuservis", "STK",
        "karosárna", "lakovna aut", "autoelektrika", "diagnostika aut",
    ],
    Category.DETAILING: [
        "detailing", "auto detailing", "leštění laku", "keramický povlak",
        "PPF fólie", "tónování skel", "renovace laku",
    ],
}

# Přidat do CATEGORY_URLS  
CATEGORY_URLS = {
    # ... existující ...
    Category.AUTOSERVIS: [
        "/Auto-moto/Autoservisy",
        "/Auto-moto/Pneuservisy",
    ],
    Category.DETAILING: [],
}
```

### 3.3 Rozšíření Google Places scraperu

V `scrapers/google_places.py` přidat AUTOSERVIS/DETAILING do `QUERIES` dict a do kategorie detection:

```python
QUERIES = {
    # ... existující ...
    Category.AUTOSERVIS: ["autoservis", "car service", "autoopravna", "car repair"],
    Category.DETAILING: ["detailing", "car detailing", "auto detailing", "car wash premium"],
}

# V keyword detection přidat:
autoservis_keywords = {"autoservis", "autoopravna", "servis", "car service", "repair"}
detailing_keywords = {"detailing", "leštění", "car wash", "keramický"}
```

### 3.4 Nový Apify-based scraper (volitelné, Fáze 2)

Pro hromadný import z Firmy.cz přes Apify API (actor `mhamas/firmy-cz-scraper`):

```python
class FirmyCzApifyScraper(BaseScraper):
    """Bulk import from Firmy.cz via Apify actor."""
    source = Source.FIRMY_CZ
    
    def scrape(self, query: str, country: Country) -> ScraperResult:
        # 1. Spustit Apify actor s URL kategorie
        # 2. Počkat na výsledky (polling)
        # 3. Namapovat na ScoutLeadPayload
        pass
```

**Config rozšíření:**
```python
class Settings(BaseSettings):
    # ... existující ...
    apify_api_key: Optional[str] = None  # NOVÉ
```

### 3.5 Rozšíření `ScoutLeadPayload`

Přidat pole relevantní pro servisy:

```python
class ScoutLeadPayload(BaseModel):
    # ... existující pole ...
    
    # Service specialization (AUTOSERVIS / DETAILING)
    specializations: Optional[list[str]] = None  # ["BMW", "Mercedes", "Škoda"]
    service_types: Optional[list[str]] = None     # ["mechanika", "karoserie", "elektronika"]
    is_authorized: Optional[bool] = None          # Autorizovaný servis značky
    firmy_cz_categories: Optional[list[str]] = None  # Raw kategorie z Firmy.cz
```

---

## 4. Změny v Carmakler (Prisma + Frontend)

### 4.1 Nový Prisma model `ServiceProvider`

```prisma
model ServiceProvider {
  id              String   @id @default(cuid())
  name            String
  type            String   // AUTOSERVIS | DETAILING | PNEUSERVIS | STK | KAROSARNA
  
  // Kontakt
  phone           String?
  email           String?
  web             String?
  contactPerson   String?
  
  // Adresa
  address         String?
  city            String?
  region          String?
  zip             String?
  latitude        Float?
  longitude       Float?
  
  // Byznys info
  ico             String?  @unique
  description     String?
  logo            String?
  openingHours    String?  // JSON
  
  // Hodnocení
  googleRating      Float?
  googleReviewCount Int?
  carmaklerRating   Float?  // Vlastní rating od kupujících
  carmaklerReviewCount Int @default(0)
  
  // Značková specializace
  brands          String[] @default([])  // ["BMW", "Mercedes", "Audi"]
  serviceTypes    String[] @default([])  // ["mechanika", "karoserie", "elektronika", "detailing"]
  isAuthorized    Boolean  @default(false) // Autorizovaný servis
  
  // Zdroj dat
  source          String?  // FIRMY_CZ | GOOGLE_PLACES | MANUAL
  sourceId        String?
  sourceUrl       String?
  
  // Stav
  status          String   @default("ACTIVE")  // ACTIVE | INACTIVE | PENDING_REVIEW
  verified        Boolean  @default(false)     // Ověřeno Carmakler týmem
  featured        Boolean  @default(false)     // Premium placement (budoucí monetizace)
  slug            String   @unique
  
  // Statistiky
  viewCount       Int      @default(0)
  clickCount      Int      @default(0)  // Klik na web/telefon
  
  // Carmakler reviews
  reviews         ServiceReview[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([city])
  @@index([type])
  @@index([status])
  @@index([verified])
  @@index([featured])
  @@index([googleRating])
}

model ServiceReview {
  id                String          @id @default(cuid())
  serviceProviderId String
  serviceProvider   ServiceProvider @relation(fields: [serviceProviderId], references: [id], onDelete: Cascade)
  userId            String
  user              User            @relation(fields: [userId], references: [id])
  rating            Int             // 1-5
  text              String?
  vehicleBrand      String?         // Jaké auto servírovali
  vehicleModel      String?
  createdAt         DateTime        @default(now())
  
  @@unique([serviceProviderId, userId])
  @@index([serviceProviderId])
  @@index([rating])
}
```

**Proč NE rozšířit existující `Partner` model:**
- Partner model je pro byznys partnery (autobazary, vrakoviště) s akvizičním pipeline (NEOSLOVENY → AKTIVNÍ)
- ServiceProvider jsou **pasivně importovaná data** — žádný akvizicní flow
- Oddělení concerns: Partner = obchodní vztah, ServiceProvider = doporučení pro kupující
- Budoucí monetizace ServiceProvider (premium listing) je jiný byznys model než Partner (provize)

### 4.2 API Route: Import z Lead Scout

```
POST /api/service-providers/import
```
Přijme ScoutLead data s `category: AUTOSERVIS | DETAILING` a upsertne do `ServiceProvider`. Autentizace přes `scout_leads_api_key` (stejný pattern jako existující lead import).

### 4.3 API Route: Vyhledávání servisů

```
GET /api/service-providers?city=Praha&brand=BMW&type=AUTOSERVIS&limit=10
```

**Logika filtrování:**
1. **Město** (povinné) — `WHERE city = :city`
2. **Značka** (volitelné) — `WHERE :brand = ANY(brands)` + fallback na město-only pokud žádný match
3. **Typ** (volitelné) — `WHERE type = :type` (AUTOSERVIS vs DETAILING)
4. **Řazení:** `verified DESC, featured DESC, googleRating DESC, carmaklerReviewCount DESC`

### 4.4 Frontend: Komponenta `RecommendedServices`

**Umístění zobrazení:**
1. **Stránka nabídky vozidla** (`app/(web)/nabidka/[slug]/page.tsx`) — pod detailem auta, sekce "Doporučené servisy ve vašem městě"
2. **Post-purchase stránka** (budoucí) — po zakoupení auta
3. **Samostatná stránka** (`app/(web)/servisy/page.tsx`) — katalog servisů s filtry

**Komponenta pattern — jako existující `RecommendedParts.tsx`:**

```tsx
// components/web/RecommendedServices.tsx
interface RecommendedServicesProps {
  brand: string;     // Značka auta z nabídky
  city: string;      // Město z lokace auta/prodejce
  type?: "AUTOSERVIS" | "DETAILING" | "ALL";
}
```

**UI návrh:**
- Horizontální scroll karet (mobile) / grid 3 sloupce (desktop)
- Každá karta: název, logo/placeholder, Google rating (hvězdičky), město, specializace badges, CTA "Zobrazit" / "Zavolat"
- Badge "Ověřeno Carmakler" pro verified servisy
- Badge "Doporučeno" pro featured (budoucí premium)

### 4.5 Stránka katalogu servisů

```
app/(web)/servisy/page.tsx              → Katalog servisů (SEO landing)
app/(web)/servisy/[slug]/page.tsx       → Detail servisu
app/(web)/servisy/[mesto]/page.tsx      → Servisy ve městě (SEO)
app/(web)/servisy/[znacka]/page.tsx     → Servisy pro značku (SEO)
```

**SEO potenciál:**
- "autoservis BMW Praha" — 1 200 hledání/měsíc
- "autoservis Mercedes Brno" — 400 hledání/měsíc
- "detailing Praha" — 2 400 hledání/měsíc
- Desítky long-tail kombinací město × značka

**JSON-LD:** `LocalBusiness` + `AutomotiveBusiness` subtype (již implementováno v `lib/seo.ts`).

---

## 5. Filtrování podle města + značky auta

### 5.1 Zdroje informací pro filtr

| Kontext | Město | Značka |
|---------|-------|--------|
| Nabídka vozidla | `vehicle.city` nebo `vehicle.user.city` nebo `partner.city` | `vehicle.brand` |
| Post-purchase | Z objednávky — buyer adresa | Z objednávky — vehicle.brand |
| Katalog servisů | User input (select/autocomplete) | User input (select) |

### 5.2 Algoritmus doporučení

```
1. Exact match: city=Praha AND brand IN brands → seřadit dle rating
2. Fallback město: city=Praha (bez brand filtru) → pokud < 3 výsledky
3. Fallback region: region=Středočeský → pokud město nemá žádné servisy
4. Radius fallback: lat/lng + 30km radius → pro malá města
```

### 5.3 Mapování značek z Firmy.cz

Firmy.cz má brand-specific podkategorie:
- `/Auto-moto/Autoservisy/BMW-servisy`
- `/Auto-moto/Autoservisy/Mercedes-servisy`
- `/Auto-moto/Autoservisy/Škoda-servisy`
- atd.

Při importu: parsovat kategorii → naplnit `brands[]` array na ServiceProvider.

---

## 6. Business model

### Fáze 1 (MVP) — Zdarma pro všechny

- Importovat servisy z Firmy.cz + Google Places
- Zobrazit jako doporučení na nabídce vozidla
- **Zero cost for servisy** — jako Wolt model: přines uživatele, pak monetizuj
- KPI: počet zobrazení, CTR na web/telefon servisu

### Fáze 2 — Premium listings

- Servis se může sám registrovat a claimnout svůj profil
- Ověřené servisy: badge "Ověřeno Carmakler"
- Premium placement: featured pozice nahoře za měsíční poplatek
- **Cenový model:** 499–1999 Kč/měsíc dle města (Praha dražší)
- Claim flow: servis → registrace → ověření IČO → claim profilu → premium upgrade

### Fáze 3 — Provize z objednávek

- Online booking přes Carmakler (servis slot reservation)
- Provize z každé objednávky (5–10%)
- Wolt model plný: free tool → marketplace liquidity → provize
- CRM pro servisy (dashboard, statistiky, reviews)

### Revenue projekce

| Fáze | Časový horizont | Revenue model |
|------|----------------|---------------|
| 1 | MVP (teď) | Zdarma — value-add pro kupující |
| 2 | +3 měsíce | Premium listings 499–1999 Kč/měs |
| 3 | +6 měsíců | Provize 5–10% z bookingů |

---

## 7. Implementační plán

### Fáze 1: Data pipeline (Lead Scout)

| # | Úkol | Odhad |
|---|------|-------|
| 1.1 | Přidat `AUTOSERVIS`, `DETAILING` do `Category` enum | S |
| 1.2 | Rozšířit `ScoutLeadPayload` o service-specific pole | S |
| 1.3 | Přidat AUTOSERVIS queries do `firmy_cz.py` scraper | M |
| 1.4 | Přidat AUTOSERVIS/DETAILING queries do `google_places.py` | S |
| 1.5 | Test scraping — ověřit kvalitu dat | M |
| 1.6 | První scrape run — naplnit staging DB | S |

### Fáze 2: Carmakler backend

| # | Úkol | Odhad |
|---|------|-------|
| 2.1 | Prisma: ServiceProvider + ServiceReview modely | M |
| 2.2 | Migrace: `npx prisma migrate dev` | S |
| 2.3 | API: `POST /api/service-providers/import` | M |
| 2.4 | API: `GET /api/service-providers` (search + filter) | M |
| 2.5 | Push pipeline: Lead Scout → Carmakler API | S |

### Fáze 3: Carmakler frontend

| # | Úkol | Odhad |
|---|------|-------|
| 3.1 | `RecommendedServices.tsx` komponenta | L |
| 3.2 | Integrace do `/nabidka/[slug]` stránky | M |
| 3.3 | `/servisy` katalog stránka (SSR + filtry) | L |
| 3.4 | `/servisy/[slug]` detail stránka | M |
| 3.5 | SEO: JSON-LD, sitemap, meta tagy | M |
| 3.6 | Loading/error states | S |

### Fáze 4: Admin + budoucí

| # | Úkol | Odhad |
|---|------|-------|
| 4.1 | Admin: správa servisů (CRUD, approve, feature) | L |
| 4.2 | Claim flow pro servisy (registrace + ověření) | XL |
| 4.3 | Premium listings + Stripe billing | XL |

**Velikosti: S = pár hodin, M = půlden, L = den, XL = 2+ dny**

---

## 8. Rizika a mitigace

| Riziko | Dopad | Mitigace |
|--------|-------|----------|
| Firmy.cz data stárnou | Neaktuální kontakty | Periodický re-scrape (měsíčně) + Google Places pro aktuální rating |
| Málo servisů v malých městech | Prázdná sekce "doporučení" | Radius fallback (30km), skrýt sekci pokud < 1 výsledek |
| Duplicity mezi zdroji | Stejný servis z Firmy.cz i Google | Dedup přes IČO + fuzzy name match + adresa |
| Legal — scraping Firmy.cz | Možné porušení ToS | Apify actor = 3rd party, data jsou veřejná, přidat attribution |
| Google Places API cost | $32/1000 req | Rate limit, caching, Firmy.cz jako primární zdroj |

---

## 9. Soulad s existující architekturou

| Aspekt | Existující pattern | Nový feature |
|--------|-------------------|--------------|
| Model | `Partner` (AUTOBAZAR/VRAKOVISTE) | `ServiceProvider` (AUTOSERVIS/DETAILING) — oddělený model |
| Doporučení UI | `RecommendedParts.tsx` (díly dle brand/model) | `RecommendedServices.tsx` (servisy dle brand/city) — stejný pattern |
| Data import | `ScoutLead` → API → upsert | Stejný pipeline, nové kategorie |
| SEO | Existující JSON-LD generators | `AutomotiveBusiness` subtype již v `lib/seo.ts` |
| Sitemap | Dynamický, Prisma-based | Přidat `/servisy/[slug]` stránky |
| Partner model | Akvizice pipeline (NEOSLOVENY→AKTIVNÍ) | NE — ServiceProvider je pasivní import, žádný sales funnel |

---

## 10. Doporučení pro team-lead

1. **Start s Fází 1+2** — Lead Scout rozšíření + Carmakler backend. Trvání: 2-3 dny implementace.
2. **Fáze 3 paralelně** — Frontend může začít s mock daty, pak napojit na API.
3. **MVP scope:** Jen `RecommendedServices` na nabídce vozidla + jednoduchý katalog. Bez claim flow, bez premium.
4. **Data-first:** Nejdřív naplnit DB (1000+ servisů z Firmy.cz), pak teprve stavět UI.
5. **NEROZŠIŘOVAT Partner model** — ServiceProvider je jiný byznys concern, oddělený model je čistší.
