# STK + Autoservisy sekce + scraping architektura

**Task #5** | Plánovač | 2026-05-24
**Status:** HOTOVO
**Vstupy:** SEO audit (plan-seo-audit.md), SEO ekosystém (plan-seo-ecosystem.md), Research STK stanic (research-stk-stations-complete.md)

---

## §1 Executive Summary

Carmakler již má **funkční základ** pro STK a autoservisy — `AutoServis` model (80+ polí), frontend stránky (list, detail, STK city LP), admin tabulku, API routes a recenze. Chybí však **datová plnost** (45 STK z ~400), **scraping pipeline** pro průběžnou aktualizaci, **autoservisový scraping** a **napojení na SEO ekosystém**.

Tento plán navrhuje:
1. **Scraping architektura** — oddělený Node.js scraper na external serveru
2. **Ingest API** — bezpečný endpoint pro příjem dat ze scraperu
3. **Deduplikace + merge logika** — inteligentní sjednocení dat z více zdrojů
4. **Datový model rozšíření** — nová pole pro kvalitní SEO karty
5. **Frontend vylepšení** — moderní kartičky s mapou, hodnocením, službami
6. **SEO napojení** — JSON-LD, OG, sitemap, cross-linking z Task #4
7. **Admin správa** — import, moderace, claiming, analytics

**Celkový effort: ~160h (20 pracovních dní)**

---

## §2 Současný stav

### 2.1 Datový model (`AutoServis`)

Model je **dobře navržený** (80+ polí), pokrývá:

| Oblast | Pole | Status |
|--------|------|--------|
| Identifikace | id, slug, name, ico | ✅ |
| Adresa | address, city, region, zip, latitude, longitude | ✅ |
| Kontakt | phone, email, web | ✅ |
| Kategorie | categories[] | ✅ (9 typů: mechanika, karosarna, pneuservis, elektro, diagnostika, stk-emise, klimatizace, lakovna, tuning) |
| Brand | brands[], certifications[] | ✅ |
| Hodnocení | averageRating, reviewCount, recommendRate | ✅ |
| Typ | tier (AUTORIZOVANY / NEOFICIALNI) | ✅ |
| Pojišťovny | insurancePartner, insuranceNames[] | ✅ |
| STK specifické | stkLines, stkWaitDays, stkOnlineBooking, stkEmissions, stkMotorcycles, stkTrailers, stkHeavy | ✅ |
| MDČR | officialStationId, lastVerifiedAt | ✅ |
| Flags | isVerified, isClaimed, isPublished, isFeatured | ✅ |
| Ownership | ownerId, addedById, source | ✅ |
| Obrázky | images[], logo | ✅ |
| Recenze | reviews → ServisReview[] | ✅ |

### 2.2 Frontend stránky

| Stránka | URL | Stav |
|---------|-----|------|
| STK list | `/stk` | ✅ Mapa + kartičky + FAQ + ceník |
| STK detail | `/stk/{slug}` | ✅ Plný detail s recenzemi |
| STK město | `/stk/mesto/{city}` | ✅ GEO landing page |
| Autoservisy list | `/autoservisy` | ✅ Mapa + filtry + kartičky |
| Autoservis detail | `/autoservisy/{slug}` | ✅ Plný detail s recenzemi |

### 2.3 Co chybí

| Problém | Dopad | Priorita |
|---------|-------|----------|
| Jen 45 STK z ~400 | Nekompletní pokrytí, slabý local SEO | P0 |
| Žádný autoservis scraping | Prázdná kategorie, žádný obsah | P0 |
| Žádná sync pipeline | Data zastarávají, no fresh content | P0 |
| Chybí canonical na `/stk/mesto/{city}` | SEO problém (z auditu) | P1 |
| Chybí JSON-LD na list stránkách | Chybí ItemList schema | P1 |
| Žádné OG images pro LP stránky | Social sharing | P2 |
| Žádná kategorie LP (`/autoservisy/pneuservis`) | Chybí programatické LP | P1 |
| Žádné město LP pro autoservisy | Chybí GEO LP | P1 |
| Cross-linking STK↔servis↔nabídka slabý | Missed linkjuice | P2 |

---

## §3 Scraping architektura

### 3.1 Princip: Oddělený scraper (jako lead scraper)

Carmakler již má pattern pro external data ingest:
- **Scout leads:** External scraper → `POST /api/scout-leads/ingest` (API key auth, rate limit)
- **External leads:** External app → `POST /api/leads/external` (API key auth, deduplikace)

**Stejný princip pro STK/autoservisy:**

```
┌─────────────────────────────────────────────┐
│           EXTERNAL SERVER                    │
│  (VPS, stejný jako lead scraper)             │
│                                              │
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │  STK Scraper     │  │ Servis Scraper   │  │
│  │  (Node.js)       │  │ (Node.js)        │  │
│  │                  │  │                  │  │
│  │  Sources:        │  │  Sources:        │  │
│  │  - stkstanice.cz │  │  - Firmy.cz      │  │
│  │  - pkstk.cz      │  │  - Google Places │  │
│  │  - MDČR open data│  │  - Mapy.cz       │  │
│  │  - kupnisila.cz  │  │  - Živnostenský  │  │
│  │                  │  │    rejstřík       │  │
│  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │             │
│           └──────┬──────────────┘             │
│                  │                            │
│           ┌──────▼──────┐                     │
│           │  Normalizer  │                     │
│           │  (dedupe,    │                     │
│           │   geocode,   │                     │
│           │   validate)  │                     │
│           └──────┬──────┘                     │
└──────────────────┼────────────────────────────┘
                   │ HTTPS POST
                   │ X-API-Key auth
                   ▼
┌──────────────────────────────────────────────┐
│           CARMAKLER API                       │
│                                               │
│  POST /api/autoservisy/ingest                 │
│  ├── API key validation                       │
│  ├── Rate limiting (500/h)                    │
│  ├── Zod schema validation                    │
│  ├── Dedup by officialStationId / IČO / name+city │
│  ├── Merge strategy (scraper vs manual)       │
│  ├── Geocoding (if missing lat/lng)           │
│  ├── Slug generation                          │
│  └── Upsert to PostgreSQL                    │
│                                               │
│  Result: { created: N, updated: M, skipped: K } │
└──────────────────────────────────────────────┘
```

### 3.2 Proč oddělený server?

1. **Nezatěžuje Carmakler produkční server** — scraping je CPU/memory intensive
2. **Izolace rizika** — pokud zdroj zablokuje IP, nedotkne se produkce
3. **Flexibilita** — scraper může používat headless browser (Puppeteer), proxy rotaci
4. **Již existuje infrastruktura** — lead scraper běží na stejném serveru
5. **CRON scheduling** — nezávislý na Next.js cron limitu

### 3.3 Scraper stack

```
External server:
  - Node.js 20+
  - Cheerio (HTML parsing) — pro statické stránky
  - Puppeteer (headless Chrome) — pro JS-rendered stránky
  - Axios (HTTP client)
  - node-cron (scheduling)
  - dotenv (konfigurace)
  
Dependencies:
  - Carmakler API key (SERVIS_INGEST_API_KEY)
  - Google Maps Geocoding API key (pro lat/lng)
  - Optional: Proxy service (pro anti-bot bypass)
```

---

## §4 Datové zdroje

### 4.1 STK stanice

| Zdroj | URL | Data | Kvalita | Legalita |
|-------|-----|------|---------|----------|
| **stkstanice.cz/stk.json** | JSON API | ~400 stanic, kódy, adresy | ✅ Výborná | ✅ Veřejná data MDČR |
| **pkstk.cz** | HTML | 111 členských stanic, kontakty | ✅ Dobrá | ✅ Veřejný rejstřík |
| **kupnisila.cz** | HTML | Agregovaný seznam, kontakty | ⚠️ Střední | ✅ Veřejný |
| **stanice-technicke-kontroly.cz** | HTML | Per-region, telefony | ⚠️ Střední | ✅ Veřejný |
| **MDČR open data** | CSV/JSON | Oficiální registr, kódy stanic | ✅ Výborná | ✅ Open data |

**Strategie:** Primární zdroj = stkstanice.cz JSON + MDČR data. Sekundární = pkstk.cz pro doplnění kontaktů. Třetí = kupnisila.cz pro validaci.

**Deduplikace klíč:** `officialStationId` (kód stanice, e.g. "31.05") — unikátní per stanice.

### 4.2 Autoservisy

| Zdroj | URL | Data | Kvalita | Legalita |
|-------|-----|------|---------|----------|
| **Firmy.cz** (Seznam) | HTML | Název, adresa, telefon, web, kategorie, hodnocení | ✅ Výborná | ⚠️ TOS nutno ověřit |
| **Google Places API** | API | Název, adresa, GPS, hodnocení, reviews, otevírací doba | ✅ Výborná | ✅ API s licencí |
| **Mapy.cz API** | API | Název, adresa, GPS, kategorie | ✅ Dobrá | ⚠️ TOS nutno ověřit |
| **Živnostenský rejstřík** | HTML/API | IČO, obor, adresa | ✅ Výborná | ✅ Veřejný rejstřík |
| **ARES** | API | IČO → firma, adresa, obor | ✅ Výborná | ✅ Veřejný rejstřík |

**Strategie:** 
- **Primární:** Google Places API (Places Search → Place Details) — placené ale nejkvalitnější data (GPS, hodnocení, fotky, otevírací doba)
- **Obohacení:** ARES API (IČO lookup → validace existence firmy)
- **Fallback:** Firmy.cz scraping (pokud Google Places budget omezený)

**Deduplikace klíč:** IČO (pokud dostupné), jinak normalized(name + city).

### 4.3 Právní aspekty

```
DŮLEŽITÉ — Carmakler NIKDY nestahuje data ze Sauto/TipCars/Bazoš/Mobile.de!
(viz memory: feedback_no_competitor_scraping.md)

Pro STK/autoservisy:
✅ MDČR open data — veřejné, volně použitelné
✅ Rejstříky (ARES, Živnostenský) — veřejné
✅ Google Places API — placené API, legální
⚠️ Firmy.cz — veřejná data, ale TOS může omezovat automatický sběr
⚠️ Crawling webů autoservisů — jen veřejné kontaktní info (GDPR ok)

PRAVIDLO: Scraper NIKDY nesbírá osobní údaje (jméno majitele, RČ).
Jen firemní data: název, IČO, adresa, telefon, web, otevírací doba.
```

---

## §5 Ingest API

### 5.1 Endpoint

```
POST /api/autoservisy/ingest
Headers:
  X-API-Key: {SERVIS_INGEST_API_KEY}
  Content-Type: application/json
Body:
  { entries: AutoServisIngestEntry[] }
Response:
  { created: number, updated: number, skipped: number, errors: string[] }
```

### 5.2 Ingest schema

```typescript
// lib/validators/autoservis-ingest.ts
import { z } from "zod";

const autoServisIngestEntrySchema = z.object({
  // Identifikace (alespoň 1 musí být přítomno)
  officialStationId: z.string().optional(), // STK kód (e.g. "31.05")
  ico: z.string().optional(),              // IČO
  
  // Povinné
  name: z.string().min(2).max(200),
  city: z.string().min(2).max(100),
  
  // Volitelné
  description: z.string().max(5000).optional(),
  address: z.string().max(200).optional(),
  region: z.string().max(100).optional(),
  zip: z.string().max(10).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  web: z.string().url().optional(),
  
  // Kategorie
  categories: z.array(z.string()).optional(),
  brands: z.array(z.string()).optional(),
  tier: z.enum(["AUTORIZOVANY", "NEOFICIALNI"]).optional(),
  
  // STK specifické
  stkLines: z.number().int().optional(),
  stkWaitDays: z.number().int().optional(),
  stkOnlineBooking: z.boolean().optional(),
  stkEmissions: z.boolean().optional(),
  stkMotorcycles: z.boolean().optional(),
  stkTrailers: z.boolean().optional(),
  stkHeavy: z.boolean().optional(),
  
  // Otevírací doba
  openingHours: z.array(z.object({
    day: z.string(),
    hours: z.string(),
  })).optional(),
  
  // Pojišťovny
  insurancePartner: z.boolean().optional(),
  insuranceNames: z.array(z.string()).optional(),
  
  // Obrázky
  images: z.array(z.string().url()).optional(),
  logo: z.string().url().optional(),
  
  // Zdroj
  source: z.string(), // "MDCR", "GOOGLE_PLACES", "FIRMY_CZ", "MANUAL"
  sourceUrl: z.string().url().optional(),
  externalId: z.string().optional(), // Google Place ID, Firmy.cz ID...
});

export const autoServisIngestSchema = z.object({
  entries: z.array(autoServisIngestEntrySchema).min(1).max(500),
});
```

### 5.3 Merge strategie

Při upsert záznamu existuje priorita zdrojů:

```
Priorita (highest → lowest):
1. MANUAL (admin editace) — NIKDY nepřepiš manuální data
2. OWNER (claimed servis — majitel upravil) — NIKDY nepřepiš
3. GOOGLE_PLACES — vysoká kvalita, aktuální
4. MDCR — oficiální STK data
5. FIRMY_CZ — scraper data
6. SEED — initial seed data
```

**Merge pravidla:**

```typescript
// lib/autoservis-merge.ts

interface MergeResult {
  action: "CREATE" | "UPDATE" | "SKIP";
  changes: string[]; // ["phone: 123→456", "address: null→Ulice 1"]
}

function mergeServis(
  existing: AutoServis | null,
  incoming: IngestEntry
): MergeResult {
  // 1. Nový záznam → CREATE
  if (!existing) return { action: "CREATE", changes: [] };
  
  // 2. Manuálně upravený → SKIP (nikdy nepřepiš)
  if (existing.source === "MANUAL" || existing.isClaimed) {
    return { action: "SKIP", changes: [] };
  }
  
  // 3. Merge: update jen NULL nebo nižší-prioritní pole
  const changes: string[] = [];
  const update: Partial<AutoServis> = {};
  
  // Pole, která se VŽDY updatují z vyšší priority zdroje
  const ALWAYS_UPDATE = ["lastVerifiedAt"];
  
  // Pole, která se updatují jen pokud jsou NULL v existing
  const FILL_NULLS = [
    "description", "address", "region", "zip", 
    "latitude", "longitude", "phone", "email", "web",
    "openingHours", "logo"
  ];
  
  // Pole, která se updatují pokud incoming zdroj má vyšší prioritu
  const PRIORITY_UPDATE = ["stkWaitDays", "stkOnlineBooking"];
  
  for (const field of FILL_NULLS) {
    if (!existing[field] && incoming[field]) {
      update[field] = incoming[field];
      changes.push(`${field}: null→${incoming[field]}`);
    }
  }
  
  if (changes.length === 0) return { action: "SKIP", changes: [] };
  return { action: "UPDATE", changes };
}
```

### 5.4 Deduplikace

```typescript
async function findExisting(entry: IngestEntry): Promise<AutoServis | null> {
  // 1. By officialStationId (STK — unique identifier)
  if (entry.officialStationId) {
    return prisma.autoServis.findUnique({
      where: { officialStationId: entry.officialStationId }
    });
  }
  
  // 2. By IČO (unique business identifier)
  if (entry.ico) {
    return prisma.autoServis.findFirst({
      where: { ico: entry.ico }
    });
  }
  
  // 3. By normalized name + city (fuzzy)
  const normalized = normalizeServisName(entry.name);
  return prisma.autoServis.findFirst({
    where: {
      slug: slugify(`${entry.name} ${entry.city}`),
    },
  });
}

function normalizeServisName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/s\.r\.o\.|spol\.\s*s\s*r\.o\.|a\.s\.|s\.p\./gi, "")
    .replace(/autoservis|auto\s*servis|servis/gi, "")
    .trim();
}
```

---

## §6 Scraper implementace

### 6.1 STK scraper

```typescript
// scraper/src/stk-scraper.ts (na external serveru)

interface StkScraperConfig {
  apiUrl: string;       // https://carmakler.cz/api/autoservisy/ingest
  apiKey: string;       // SERVIS_INGEST_API_KEY
  batchSize: number;    // 50 per request
  delayMs: number;      // 2000ms between source requests
}

class StkScraper {
  // Fáze 1: stkstanice.cz JSON
  async scrapeStksJsonApi(): Promise<IngestEntry[]> {
    const resp = await axios.get("https://stkstanice.cz/stk.json");
    return resp.data.map(station => ({
      officialStationId: station.kod,
      name: station.nazev,
      address: station.ulice,
      city: station.mesto,
      zip: station.psc,
      phone: station.telefon,
      categories: ["stk-emise"],
      stkEmissions: true,
      source: "MDCR",
    }));
  }
  
  // Fáze 2: pkstk.cz (HTML parsing)
  async scrapePkstk(): Promise<Partial<IngestEntry>[]> {
    // Cheerio parse → member list → enrich existing entries
  }
  
  // Fáze 3: Geocoding (Google Maps API)
  async geocodeEntries(entries: IngestEntry[]): Promise<IngestEntry[]> {
    for (const entry of entries) {
      if (entry.latitude && entry.longitude) continue;
      const geo = await geocode(`${entry.address}, ${entry.city}, CZ`);
      entry.latitude = geo.lat;
      entry.longitude = geo.lng;
      await sleep(100); // Rate limit Google API
    }
    return entries;
  }
  
  // Orchestrace
  async run() {
    const entries = await this.scrapeStksJsonApi();
    const enriched = await this.enrichFromPkstk(entries);
    const geocoded = await this.geocodeEntries(enriched);
    await this.ingest(geocoded); // POST to Carmakler API
  }
}
```

### 6.2 Autoservis scraper

```typescript
// scraper/src/servis-scraper.ts

class ServisScraper {
  // Google Places API
  async scrapeGooglePlaces(region: string): Promise<IngestEntry[]> {
    const results = [];
    
    // Search queries per category
    const queries = [
      "autoservis",
      "pneuservis", 
      "autoelektro",
      "karosárna",
      "autolakovna",
      "autodiagnostika",
      "klimatizace auto",
    ];
    
    for (const query of queries) {
      const places = await this.searchPlaces(`${query} ${region}`);
      for (const place of places) {
        const detail = await this.getPlaceDetail(place.place_id);
        results.push(this.mapToIngestEntry(detail, query));
        await sleep(200); // Rate limit
      }
    }
    
    return this.deduplicateLocal(results);
  }
  
  private mapToIngestEntry(place: PlaceDetail, query: string): IngestEntry {
    return {
      name: place.name,
      address: place.formatted_address,
      city: place.address_components.find(c => c.types.includes("locality"))?.long_name || "",
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      phone: place.international_phone_number,
      web: place.website,
      openingHours: place.opening_hours?.weekday_text?.map((text, i) => ({
        day: ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"][i],
        hours: text.split(": ")[1] || "Zavřeno",
      })),
      categories: this.inferCategories(query, place.types),
      source: "GOOGLE_PLACES",
      externalId: place.place_id,
    };
  }
  
  private inferCategories(query: string, types: string[]): string[] {
    const map: Record<string, string> = {
      "autoservis": "mechanika",
      "pneuservis": "pneuservis",
      "autoelektro": "elektro",
      "karosárna": "karosarna",
      "autolakovna": "lakovna",
      "autodiagnostika": "diagnostika",
      "klimatizace auto": "klimatizace",
    };
    return [map[query] || "mechanika"];
  }
}
```

### 6.3 ARES enrichment

```typescript
// scraper/src/ares-enricher.ts

class AresEnricher {
  async enrichWithIco(entry: IngestEntry): Promise<IngestEntry> {
    if (entry.ico) return entry; // Už má IČO
    
    // Hledání v ARES podle názvu a města
    const results = await this.searchAres(entry.name, entry.city);
    if (results.length === 1) {
      // Jednoznačný match
      entry.ico = results[0].ico;
      if (!entry.address) entry.address = results[0].address;
    }
    
    return entry;
  }
  
  private async searchAres(name: string, city: string) {
    const url = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat`;
    const resp = await axios.get(url, {
      params: { obchodniJmeno: name, sidlo: city },
    });
    return resp.data.ekonomickeSubjekty || [];
  }
}
```

### 6.4 CRON scheduling

```typescript
// scraper/src/scheduler.ts

// STK: 1x týdně (data se mění minimálně)
cron.schedule("0 3 * * 1", () => stkScraper.run()); // Po 3:00

// Autoservisy: 1x měsíčně (nové servisy, zavřené servisy)
cron.schedule("0 4 1 * *", () => servisScraper.run()); // 1. den v měsíci 4:00

// ARES enrichment: 1x měsíčně (doplnění IČO)
cron.schedule("0 5 15 * *", () => aresEnricher.run()); // 15. den 5:00

// Geocoding backfill: daily (nové záznamy bez GPS)
cron.schedule("0 6 * * *", () => geocoder.backfill()); // Denně 6:00
```

---

## §7 Datový model — rozšíření

### 7.1 Nová pole pro AutoServis

```prisma
model AutoServis {
  // ... existing fields ...
  
  // === NOVÁ POLE ===
  
  // Pricing (pro SEO + uživatelský rozhodovací proces)
  priceRange      String?  // "$$" (1-4 dolar signs)
  priceNote       String?  // "Od 2 000 Kč za běžný servis"
  
  // Google Places data
  googlePlaceId   String?  @unique
  googleRating    Float?
  googleReviewCount Int?
  
  // Služby (detailnější než categories)
  services        String[] // ["Výměna oleje", "Brzdové destičky", "Geometrie", ...]
  specializations String[] // ["Hybridní vozy", "Elektromobily", "Americká auta", ...]
  
  // Dostupnost
  acceptsWalkIn   Boolean  @default(false)
  hasParking      Boolean  @default(false)
  hasCourtesyCar  Boolean  @default(false)
  acceptsCards    Boolean  @default(true)
  
  // SEO (napojení na SEO ekosystém z Task #4)
  seoContentId    String?  // FK na SeoContent pro custom LP content
  
  // Import metadata
  sourceUrl       String?  // URL odkud byly data získány
  externalId      String?  // Google Place ID, Firmy.cz ID...
  importedAt      DateTime?
  lastScrapedAt   DateTime?
  dataQuality     Int      @default(0) // 0-100 completeness score
  
  // Geocoding
  geocodeSource   String?  // "GOOGLE", "MANUAL", "ADDRESS_PARSE"
  geocodeAccuracy String?  // "ROOFTOP", "RANGE_INTERPOLATED", "APPROXIMATE"
  
  @@index([googlePlaceId])
  @@index([dataQuality])
  @@index([source])
}
```

### 7.2 Nový model: ServisImportLog

```prisma
model ServisImportLog {
  id          String   @id @default(cuid())
  source      String   // "MDCR", "GOOGLE_PLACES", "FIRMY_CZ", "MANUAL"
  status      String   // "SUCCESS", "PARTIAL", "FAILED"
  entriesTotal Int
  created     Int
  updated     Int
  skipped     Int
  errors      String[] // Error messages
  duration    Int      // Execution time in ms
  metadata    String?  // JSON: { region: "Praha", query: "autoservis" }
  createdAt   DateTime @default(now())
  
  @@index([source])
  @@index([createdAt])
}
```

### 7.3 Data quality score

```typescript
function calculateDataQuality(servis: AutoServis): number {
  let score = 0;
  const weights = {
    name: 10,        // always present
    address: 10,
    city: 10,        // always present  
    zip: 5,
    phone: 10,
    email: 5,
    web: 5,
    latitude: 10,
    longitude: 10,
    openingHours: 5,
    description: 10,
    categories: 5,   // at least 1
    images: 5,
    logo: 5,
    ico: 5,
  };
  
  if (servis.name) score += weights.name;
  if (servis.address) score += weights.address;
  if (servis.city) score += weights.city;
  // ... etc
  
  return score; // 0-100
}
```

---

## §8 Frontend kartičky

### 8.1 Servis Card component

```
┌─────────────────────────────────────────────────┐
│ ┌────┐                                          │
│ │LOGO│  AutoServis Novák s.r.o.     ★★★★☆ 4.2  │
│ └────┘  Autorizovaný servis Škoda  (47 recenzí) │
│                                                  │
│  📍 Vinohradská 123, Praha 3, 130 00            │
│  📞 +420 222 333 444  🌐 autoservis-novak.cz    │
│  🕐 Po-Pá 7:30-17:00                            │
│                                                  │
│  ┌─────────┐ ┌──────────┐ ┌────────────┐        │
│  │Mechanika│ │Diagnostika│ │Klimatizace │        │
│  └─────────┘ └──────────┘ └────────────┘        │
│                                                  │
│  🏢 Škoda · Volkswagen · Seat · Audi             │
│  🛡️ Pojišťovny: Allianz, ČPP                     │
│                                                  │
│  [📞 Zavolat]  [🗺️ Navigovat]  [⭐ Detail]       │
└─────────────────────────────────────────────────┘
```

### 8.2 STK Card component

```
┌─────────────────────────────────────────────────┐
│  STK                    ★★★★★ 4.8 (23 recenzí) │
│  STK Praha 10 — Průběžná                        │
│  Kód: 31.05  ✓ Ověřená CarMakléřem              │
│                                                  │
│  📍 Průběžná 2397/76, Praha 10, 100 31          │
│  📞 +420 274 774 867                             │
│  🕐 Po-Pá 7:00-15:30                            │
│                                                  │
│  ┌──────────────┐ ┌───────────┐ ┌──────────┐    │
│  │🚗 Osobní     │ │🏍️ Moto    │ │🚚 Návěsy │    │
│  └──────────────┘ └───────────┘ └──────────┘    │
│                                                  │
│  ⏱ Čekací doba: ~5 dní  |  📐 3 linky           │
│  🌐 Online rezervace: Ano                        │
│                                                  │
│  [📞 Zavolat]  [🗺️ Navigovat]  [⭐ Detail]       │
└─────────────────────────────────────────────────┘
```

### 8.3 Map integration

Zachovat existující `MapListView` komponentu (Leaflet) — funguje dobře.

Rozšířit o:
- **Cluster markers** — při > 50 pinů na mapě
- **Category filter** na mapě (jen pneuservisy, jen STK...)
- **Radius search** — "Servisy do 10 km od mé polohy"
- **Driving directions** link (Google Maps / Mapy.cz)

---

## §9 Programatické LP

### 9.1 Autoservis kategorie LP

**Nové stránky:**

| URL | Popis | Priorita |
|-----|-------|----------|
| `/autoservisy/mechanika` | Mechanické opravy | P1 |
| `/autoservisy/pneuservis` | Pneuservisy | P1 |
| `/autoservisy/karosarna` | Karosářské práce | P1 |
| `/autoservisy/diagnostika` | Autodiagnostika | P2 |
| `/autoservisy/elektro` | Autoelektro | P2 |
| `/autoservisy/klimatizace` | Klimatizace | P2 |
| `/autoservisy/lakovna` | Autolakovna | P2 |

**Implementace:**

```
app/(web)/autoservisy/[category]/page.tsx
  → Filtruje autoservisy by category
  → SEO: "Pneuservisy v ČR — ověřené recenze | CarMakléř"
  → JSON-LD: ItemList + WebPage
  → Cross-link: related categories + city variants
```

### 9.2 Autoservis město LP

**Nové stránky:**

| URL | Popis |
|-----|-------|
| `/autoservisy/mesto/praha` | Autoservisy v Praze |
| `/autoservisy/mesto/brno` | Autoservisy v Brně |
| `/autoservisy/mesto/ostrava` | Autoservisy v Ostravě |
| ... (auto-generated z DB distinct cities) | |

**Implementace:**

```
app/(web)/autoservisy/mesto/[city]/page.tsx
  → Filtruje by city (case-insensitive)
  → Mapa + list
  → SEO: "Autoservisy Praha — 47 servisů s recenzemi | CarMakléř"
  → JSON-LD: ItemList + LocalBusiness[] (top 5)
  → Cross-link: nabídka aut v městě, STK ve městě
```

### 9.3 Kombinované LP

| URL | Popis | Priorita |
|-----|-------|----------|
| `/autoservisy/pneuservis/praha` | Pneuservisy v Praze | P2 |
| `/autoservisy/skoda/praha` | Autoservisy Škoda v Praze | P3 |
| `/stk/kraj/stredocesky` | STK Středočeský kraj | P2 |

Tyto LP generovat **pouze pokud mají ≥3 výsledky** (zabránit thin content).

### 9.4 Route structure

```
app/(web)/autoservisy/
  page.tsx                              → List (existuje)
  [slug]/page.tsx                       → Detail (existuje)
  mesto/[city]/page.tsx                  → GEO LP (nové)
  [category]/page.tsx                   → Category LP (nové)
  [category]/[city]/page.tsx            → Combined LP (nové, P2)

app/(web)/stk/
  page.tsx                              → List (existuje)
  [slug]/page.tsx                       → Detail (existuje)
  mesto/[city]/page.tsx                  → GEO LP (existuje)
  kraj/[region]/page.tsx                → Region LP (nové, P2)
```

**Disambiguace `[slug]` vs `[category]`:**
- Known categories: mechanika, pneuservis, karosarna, elektro, diagnostika, klimatizace, lakovna, tuning
- If segment matches category → category LP
- Else → detail page (slug lookup)

---

## §10 SEO napojení (Task #4)

### 10.1 JSON-LD

| Stránka | Aktuální | Doporučené |
|---------|----------|-----------|
| `/stk` (list) | FAQPage | + ItemList, WebPage |
| `/stk/{slug}` | AutoRepair, BreadcrumbList | ✅ OK (přidat geo: GeoCoordinates) |
| `/stk/mesto/{city}` | Žádné | ItemList + LocalBusiness[] (top 5) |
| `/autoservisy` (list) | FAQPage, BreadcrumbList | + ItemList |
| `/autoservisy/{slug}` | AutoRepair, BreadcrumbList | ✅ OK (přidat geo, services[]) |
| `/autoservisy/mesto/{city}` | — (nové) | ItemList + LocalBusiness[] |
| `/autoservisy/{category}` | — (nové) | ItemList + WebPage |

**Nový generátor:**

```typescript
// lib/seo.ts — nový

export function generateAutoRepairJsonLd(servis: {
  name: string;
  address?: string;
  city: string;
  region?: string;
  zip?: string;
  phone?: string;
  email?: string;
  web?: string;
  latitude?: number;
  longitude?: number;
  categories?: string[];
  openingHours?: string;
  averageRating?: number;
  reviewCount?: number;
  priceRange?: string;
}): string {
  // Centralizovaný generátor místo inline JSON v page.tsx
  // Reusable pro STK detail, servis detail, LP stránky
}
```

### 10.2 Canonical URLs

| Stránka | Aktuální | Fix |
|---------|----------|-----|
| `/stk/mesto/{city}` | ❌ Chybí | `pageCanonical(\`/stk/mesto/${city}\`)` |
| `/autoservisy/mesto/{city}` | — (nové) | `pageCanonical(\`/autoservisy/mesto/${city}\`)` |
| `/autoservisy/{category}` | — (nové) | `pageCanonical(\`/autoservisy/${category}\`)` |

### 10.3 OG images

Existují: `/stk/opengraph-image.tsx`, `/autoservisy/opengraph-image.tsx`
Existují: `/stk/[slug]/opengraph-image.tsx`, `/autoservisy/[slug]/opengraph-image.tsx`

**Nové:**
- `/stk/mesto/[city]/opengraph-image.tsx` — "STK stanice Praha — 30 stanic"
- `/autoservisy/mesto/[city]/opengraph-image.tsx` — "Autoservisy Brno — 47 servisů"
- `/autoservisy/[category]/opengraph-image.tsx` — "Pneuservisy v ČR"

### 10.4 Sitemap

V sitemap indexu (z Task #4, sub-sitemap `sitemap-services.xml`):

```typescript
// app/sitemap.ts — services sub-sitemap

async function servicePages(): Promise<MetadataRoute.Sitemap> {
  const servisy = await prisma.autoServis.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true, categories: true, city: true },
  });
  
  // Detail pages
  const detailPages = servisy.map(s => ({
    url: `${BASE_URL}/${s.categories.includes("stk-emise") ? "stk" : "autoservisy"}/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
  
  // City LP pages (distinct cities with >= 2 servisy)
  const cityGroups = groupBy(servisy, "city");
  const cityPages = Object.entries(cityGroups)
    .filter(([, items]) => items.length >= 2)
    .flatMap(([city, items]) => {
      const pages = [];
      const citySlug = slugify(city);
      
      // STK city pages
      if (items.some(i => i.categories.includes("stk-emise"))) {
        pages.push({
          url: `${BASE_URL}/stk/mesto/${citySlug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        });
      }
      
      // Autoservis city pages
      pages.push({
        url: `${BASE_URL}/autoservisy/mesto/${citySlug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      });
      
      return pages;
    });
  
  // Category LP pages
  const categoryPages = SERVIS_CATEGORIES.map(cat => ({
    url: `${BASE_URL}/autoservisy/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));
  
  return [...detailPages, ...cityPages, ...categoryPages];
}
```

### 10.5 Cross-linking

Rozšířit `lib/seo-crosslinks.ts` o:

```typescript
/** STK → Autoservisy ve stejném městě */
export function getStkToServisBridge(city: string): CrossLink[] {
  return [
    { label: `Autoservisy v ${city}`, href: `/autoservisy/mesto/${slugify(city)}` },
  ];
}

/** Autoservis → Nabídka aut + STK ve městě */
export function getServisToOtherBridge(city: string): CrossLink[] {
  return [
    { label: `Ojetá auta v ${city}`, href: `/nabidka/${slugify(city)}` },
    { label: `STK stanice v ${city}`, href: `/stk/mesto/${slugify(city)}` },
  ];
}

/** Vehicle detail → STK + servis ve městě */
export function getVehicleToServiceBridge(city?: string): CrossLink[] {
  if (!city) return [];
  const cs = slugify(city);
  return [
    { label: `STK v ${city}`, href: `/stk/mesto/${cs}` },
    { label: `Autoservisy v ${city}`, href: `/autoservisy/mesto/${cs}` },
  ];
}
```

---

## §11 Admin správa

### 11.1 Rozšíření stávající admin stránky

Aktuální `/admin/autoservisy` má jen `AdminServisyTable`. Rozšířit o:

```
app/(admin)/admin/autoservisy/
  page.tsx                    → Dashboard + tabulka (rozšířit)
  [id]/page.tsx               → Detail + edit (nové)
  import/page.tsx             → Import management (nové)
  reviews/page.tsx            → Review moderace (nové)
  claims/page.tsx             → Claim requests (nové)
```

### 11.2 Dashboard metriky

| Metrika | Popis |
|---------|-------|
| Celkem servisů | Total published |
| STK stanic | Where categories includes "stk-emise" |
| Autoservisů | Where categories not includes "stk-emise" |
| Průměrný data quality | Avg(dataQuality) |
| Pending reviews | Reviews where isPublished=false |
| Unclaimed servisy | Where isClaimed=false AND source != "MANUAL" |
| Bez GPS | Where latitude IS NULL |
| Poslední import | Last ServisImportLog |

### 11.3 Servis detail/edit

- Všechna pole z AutoServis modelu
- Mapa s pin (editovatelná poloha — drag & drop)
- Obrázky management (upload, reorder, delete)
- Reviews list + moderace (approve/reject)
- Import history (ze ServisImportLog)
- SEO preview (title, desc, OG, JSON-LD)
- "Ověřit data" button → check against ARES + Google Places

### 11.4 Import management

- Tabulka importů (ServisImportLog)
- "Spustit import" tlačítko (trigger manual scraper run)
- Import statistiky: created/updated/skipped per run
- Error log viewer
- Source quality comparison (Google vs MDČR vs Firmy)

### 11.5 Claiming flow

```
1. Majitel servisu najde svůj servis na Carmakler
2. Klikne "Jste majitel? Přihlaste se k profilu"
3. Registrace/login → vyplní IČO
4. Systém ověří IČO v ARES
5. Admin schválí claim request
6. Majitel může editovat: popis, obrázky, služby, otevírací dobu
7. Scraper NIKDY nepřepisuje claimed data (merge pravidlo)
```

**Model:**

```prisma
model ServisClaimRequest {
  id          String   @id @default(cuid())
  servisId    String
  servis      AutoServis @relation(fields: [servisId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  ico         String
  status      String   @default("PENDING") // PENDING, APPROVED, REJECTED
  adminNote   String?
  verifiedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([servisId])
  @@index([userId])
  @@index([status])
}
```

---

## §12 Implementační plán

### Fáze 1: Data plnost (Týden 1-3) — ~50h

| # | Úkol | Effort | Popis |
|---|------|--------|-------|
| 1 | AutoServis model rozšíření | 3h | Nová pole (viz §7), migrace |
| 2 | ServisImportLog model | 2h | Prisma model + migrace |
| 3 | Ingest API endpoint | 6h | `/api/autoservisy/ingest`, Zod schema, auth, rate limit |
| 4 | Merge logika | 4h | `lib/autoservis-merge.ts` — deduplikace, priority merge |
| 5 | STK scraper | 8h | stkstanice.cz JSON + pkstk.cz enrichment |
| 6 | Geocoding pipeline | 4h | Google Maps Geocoding API integration |
| 7 | Seed 400 STK stanic | 6h | Bulk import z research dat + geocoding |
| 8 | Data quality scoring | 2h | `calculateDataQuality()` + backfill |
| 9 | Canonical fix `/stk/mesto/{city}` | 1h | Přidat `pageCanonical()` |
| 10 | Autoservis scraper (Google Places) | 10h | Places API search + detail + mapping |
| 11 | ARES enrichment | 4h | IČO lookup + validation |

**Výstup:** ~400 STK + ~500 autoservisů v DB, geocoded, deduplicated.

### Fáze 2: Frontend + SEO (Týden 4-5) — ~40h

| # | Úkol | Effort | Popis |
|---|------|--------|-------|
| 12 | Servis card redesign | 4h | Moderní kartička (viz §8) |
| 13 | STK card redesign | 3h | STK-specifická kartička |
| 14 | Autoservis město LP | 6h | `/autoservisy/mesto/[city]` stránka |
| 15 | Autoservis kategorie LP | 6h | `/autoservisy/[category]` stránka |
| 16 | JSON-LD centralizace | 4h | `generateAutoRepairJsonLd()` + rozšířit na list stránky |
| 17 | OG images pro nové LP | 3h | City + category OG generátory |
| 18 | Cross-linking rozšíření | 3h | STK↔servis↔nabídka bridge funkce |
| 19 | Sitemap services sub-sitemap | 3h | Detail + city + category pages |
| 20 | Map cluster markers | 4h | Leaflet MarkerCluster pro 400+ pins |
| 21 | Radius search | 4h | Geolocation API → "Servisy do X km" |

**Výstup:** Kompletní frontend s moderními kartičkami, mapou, GEO LP, full SEO.

### Fáze 3: Admin + claiming (Týden 6-7) — ~40h

| # | Úkol | Effort | Popis |
|---|------|--------|-------|
| 22 | Admin servis detail/edit | 10h | Full CRUD, mapa, obrázky |
| 23 | Admin dashboard metriky | 4h | Stats cards, charts |
| 24 | Import management UI | 6h | Import log, manual trigger, errors |
| 25 | Review moderace UI | 4h | Approve/reject reviews per servis |
| 26 | ServisClaimRequest model | 2h | Prisma + migrace |
| 27 | Claiming flow (frontend) | 6h | Public claim button + form + ARES check |
| 28 | Claiming flow (admin) | 4h | Admin approve/reject claims |
| 29 | Owner edit portal | 4h | Claimed owners can edit their profile |

**Výstup:** Kompletní admin správa + claiming systém.

### Fáze 4: Automatizace (Týden 8) — ~30h

| # | Úkol | Effort | Popis |
|---|------|--------|-------|
| 30 | CRON scheduler na external serveru | 4h | Weekly STK, monthly servisy |
| 31 | Stale data detection | 4h | Servisy not updated > 6 months → flag |
| 32 | Auto-unpublish closed businesses | 3h | ARES check → firma neexistuje → unpublish |
| 33 | AI description generator | 6h | Claude → popis servisu z dostupných dat |
| 34 | Notifications for claimed owners | 3h | Nová recenze → email notifikace |
| 35 | Combined LP (category+city) | 6h | `/autoservisy/pneuservis/praha` |
| 36 | STK region LP | 4h | `/stk/kraj/[region]` |

**Výstup:** Plně automatizovaný pipeline s průběžnou aktualizací.

---

## §13 STOP pravidla pro implementátora

```
STOP-1: Nikdy nestahuj data ze Sauto/TipCars/Bazoš/Mobile.de!
        Jen veřejné rejstříky (MDČR, ARES) a licencovaná API (Google Places).
STOP-2: Nikdy nepřepisuj data claimed/manuálně upravených servisů scraped daty.
        Merge priorita: MANUAL > OWNER > GOOGLE_PLACES > MDCR > SCRAPER.
STOP-3: Nikdy neukládej osobní údaje (jméno majitele, RČ) — jen firemní data.
STOP-4: Nikdy nepublikuj servis bez name + city — minimální data quality check.
STOP-5: Nikdy negeneruj LP pro město/kategorii s méně než 3 výsledky (thin content).
STOP-6: Nikdy nevolej Google Places API bez rate limiting (200ms delay).
STOP-7: Nikdy nesmazej existující servis — jen unpublish (isPublished=false).
STOP-8: STK stránky VŽDY filtruj by categories.includes("stk-emise").
        Nepoužívej odlišný model pro STK — je to AutoServis s kategorií.
STOP-9: Scraper MUSÍ logovat každý import do ServisImportLog — no silent failures.
STOP-10: Ingest API MUSÍ mít API key auth + rate limit (max 500 entries/request).
```

---

## §14 Závěr

Tento plán rozšiřuje existující solidní základ STK/autoservisů o:

1. **400 STK stanic** (z 45) + **500+ autoservisů** (z ~0) = masivní obsahový nárůst
2. **Automatický scraping pipeline** — weekly STK, monthly servisy
3. **Inteligentní merge** — nikdy nepřepisuje manuální data
4. **GEO LP** — město + kategorie + kombinované stránky
5. **Full SEO** — JSON-LD, canonical, OG, sitemap, cross-linking
6. **Claiming** — majitelé spravují své profily

**Effort:** ~160h (4 fáze, 8 týdnů)
**Kritická cesta:** Fáze 1 (data) → Fáze 2 (frontend) → Fáze 3 (admin) → Fáze 4 (automatizace)
**ROI:** Local SEO dominance — žádný CZ competitor nemá 400 STK + 500 servisů s recenzemi a structured data.
