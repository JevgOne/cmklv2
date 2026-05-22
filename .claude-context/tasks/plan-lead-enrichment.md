# Plán: Enrichment leadů — výbava, popis, fotky z detail pages

**Task:** #71
**Status:** READY FOR IMPLEMENTATION
**Priority:** HIGH
**Datum:** 2026-05-20

---

## §1 Kontext a problém

### Současný stav
Scrapery extrahují **minimum dat** z inzerátů:
- Telefon, město, cena, značka, model, rok, titulek, nájezd

**CHYBÍ:** palivo, převodovka, výkon, barva, body type, výbava, popis prodejce, fotky.

### Proč to vadí
Když makléř konvertuje SOUKROMNIK lead → Lead v systému, musí **ručně doplnit** všechna chybějící data. Konverze ScoutLead → Lead mapuje jen:
- `vehicleBrand → brand`, `vehicleModel → model`, `vehicleYear → year`
- `vehiclePrice → expectedPrice`, `city → city`, `phone → phone`

Vehicle model má 30+ polí (fuelType, transmission, enginePower, color, bodyType, equipment, description, photos...) — všechna zůstávají prázdná.

### Cíl
Extrahovat maximum dat z inzerátů, uložit do DB, zobrazit v admin kartě, a při konverzi pre-fillnout Vehicle formulář.

---

## §2 Analýza zdrojů — co je dostupné

### 2.1 AutoScout24 — listing karta (data atributy)

AS24 má bohaté `data-*` atributy na `<article>` elementech. **Aktuálně čteme:**

| Atribut | Použití |
|---------|---------|
| `data-seller-type` | p/d filtr |
| `data-price` | cena |
| `data-first-registration` | rok (MM-YYYY) |
| `data-mileage` | nájezd |
| `data-make` | značka |
| `data-model` | model |

**Potenciálně dostupné ale NEČTEME:**

| Atribut | Data | Priorita |
|---------|------|----------|
| `data-fuel-type` | benzín/diesel/hybrid/elektro | HIGH |
| `data-transmission` | manuál/automat | HIGH |
| `data-body-type` | sedan/SUV/combi... | MEDIUM |
| `data-power` | kW | MEDIUM |
| `data-color` | barva | LOW |
| `data-doors` | počet dveří | LOW |
| `data-engine-size` | objem (cc) | LOW |
| `data-equipment-ids` | výbava | LOW (pokud existuje) |

> **POZN:** Existence těchto atributů musí implementátor ověřit na live stránce.
> AS24 je Next.js — `__NEXT_DATA__` JSON obsahuje strukturovaná data včetně výbavy.

**AS24 NENAVŠTĚVUJE detail pages** — všechna data jsou z listing karty. Detail page by přidal:
- Popis prodejce (text)
- Fotky (gallery URLs)
- Kompletní výbavu (structured list)
- Kontaktní údaje prodejce

### 2.2 Sauto — listing karta + detail page

**Z listing karty:**
- Titulek, rok, nájezd, cena, město
- Info-wrap obsahuje: `"2012, 161 000 km, Benzín, Manuální"` — **palivo a převodovka jsou v textu ale NEČTOU SE**

**Z detail page (Playwright, `_fetch_detail()`):**
- Telefon, jméno prodejce, kategorie prodejce, město
- **Nečte se:** výbava, popis, fotky, výkon, barva, body type

**Dostupné na detail page ale neextrahované:**
- Parametry vozu (palivo, převodovka, výkon, objem, barva, body type)
- Seznam výbavy (structured checklist)
- Popis prodejce (free text)
- Fotogalerie (img URLs)

### 2.3 Bazoš — listing karta + detail page

**Z listing karty:**
- Titulek, cena, město, PSČ

**Z detail page (httpx, `_fetch_detail()`):**
- Telefon, jméno prodejce
- **`div.popisdetail`** — celý popis inzerátu (prohledává se jen pro telefon regex!)

**Dostupné ale neextrahované:**
- Popis prodejce (celý text v `div.popisdetail`)
- Fotky (img tags v detailu)
- Parametry z popisu (nestrukturované — v textu, ne ve formuláři)

> **Bazoš nemá strukturované parametry** (palivo, převodovka atd.) — vše je v textu popisu. Extrakce = regex/NLP.

### 2.4 Sbazar — minimal

Sbazar extrahuje jen telefon z detail page. Minimum dat, nízký objem. Nízká priorita pro enrichment.

---

## §3 Datový model — kam uložit

### Varianta A: Nové sloupce v ScoutLead (DOPORUČENÁ)

Přidat do `ScoutLead` modelu v Prisma + do `leads` tabulky v SQLite:

```prisma
// Vehicle extended info
vehicleFuel      String?   // PETROL, DIESEL, HYBRID, ELECTRIC, LPG, CNG
vehicleTransmission String? // MANUAL, AUTOMATIC, DSG, CVT
vehiclePower     Int?      // kW
vehicleEngineCC  Int?      // objem motoru cc
vehicleBodyType  String?   // SEDAN, HATCHBACK, COMBI, SUV, COUPE, CABRIO, VAN, PICKUP
vehicleColor     String?   // barva (free text)
vehicleDoors     Int?      // počet dveří
vehicleEquipment String?   // JSON array ["klima", "tempomat", "4x4", ...]
vehicleDescription String? // popis prodejce (free text, max 5000 chars)
vehiclePhotos    String?   // JSON array of photo URLs ["https://...", ...]
```

**Výhody:**
- Jednoduchý přístup, konzistentní s existujícími `vehicle*` sloupci
- Přímé mapování na Vehicle model při konverzi
- Funguje s existujícím ingest API (jen přidat nová pole do Zod schématu)

**Nevýhody:**
- Více sloupců v jedné tabulce (ale ScoutLead už má 35+ polí)

### Varianta B: rawPayload JSON

Ukládat vše do `rawPayload` JSON pole. Existuje ale není používáno.

**Nevýhody:** Nedá se filtrovat/vyhledávat, nepodporuje typování, musí se parsovat na frontendu.

### Varianta C: Nová tabulka `vehicle_details`

**Nevýhody:** Over-engineering. ScoutLead je staging — nepotřebujeme relační model.

### Rozhodnutí: **Varianta A** — nové sloupce

---

## §4 Implementační plán

### Fáze 1: Datový model (Prisma + SQLite + Ingest API)

**Krok 1a: Prisma schema** (`prisma/schema.prisma`)
```prisma
model ScoutLead {
  // ... existing fields ...
  
  // Vehicle extended info (NEW)
  vehicleFuel         String?
  vehicleTransmission String?
  vehiclePower        Int?
  vehicleEngineCC     Int?
  vehicleBodyType     String?
  vehicleColor        String?
  vehicleDoors        Int?
  vehicleEquipment    String?  // JSON array
  vehicleDescription  String?  @db.Text
  vehiclePhotos       String?  @db.Text  // JSON array of URLs
}
```
+ `npx prisma migrate dev --name add-vehicle-enrichment-fields`

**Krok 1b: SQLite schema** (`lead_scout/db.py`)
Přidat safe migration sloupce:
```python
for col, typedef in [
    ("vehicle_fuel", "TEXT"),
    ("vehicle_transmission", "TEXT"),
    ("vehicle_power", "INTEGER"),
    ("vehicle_engine_cc", "INTEGER"),
    ("vehicle_body_type", "TEXT"),
    ("vehicle_color", "TEXT"),
    ("vehicle_doors", "INTEGER"),
    ("vehicle_equipment", "TEXT"),      # JSON array
    ("vehicle_description", "TEXT"),
    ("vehicle_photos", "TEXT"),         # JSON array of URLs
]:
```
+ Přidat do `INSERT INTO leads (...)` v `save_lead()`

**Krok 1c: Pydantic model** (`lead_scout/models.py`)
```python
class ScoutLeadPayload(BaseModel):
    # ... existing fields ...
    
    # Vehicle extended (NEW)
    vehicle_fuel: Optional[str] = None
    vehicle_transmission: Optional[str] = None
    vehicle_power: Optional[int] = None
    vehicle_engine_cc: Optional[int] = None
    vehicle_body_type: Optional[str] = None
    vehicle_color: Optional[str] = None
    vehicle_doors: Optional[int] = None
    vehicle_equipment: Optional[list[str]] = None
    vehicle_description: Optional[str] = None
    vehicle_photos: Optional[list[str]] = None
```

**Krok 1d: Ingest API** (`app/api/scout-leads/ingest/route.ts`)
Přidat nová pole do Zod schématu `scoutLeadIngestSchema`.

**Krok 1e: Pusher** (`lead_scout/client.py`)
Přidat nové snake_to_camel mapování + JSON serializaci pro equipment/photos.

---

### Fáze 2: Scraper enrichment — AS24

**Soubor:** `lead_scout/scrapers/autoscout24.py`

**2a) Extrakce data atributů z listing karty:**
```python
# V _parse_ad() — přidat po existujících data-* extrakcích:
fuel_raw = ad_el.get("data-fuel-type", "")
transmission_raw = ad_el.get("data-transmission", "")
body_type_raw = ad_el.get("data-body-type", "")
power_raw = ad_el.get("data-power")
color_raw = ad_el.get("data-color", "")
doors_raw = ad_el.get("data-doors")
engine_cc_raw = ad_el.get("data-engine-size")
```

**2b) Normalizace hodnot:**
```python
FUEL_MAP = {
    "petrol": "PETROL", "gasoline": "PETROL", "benzin": "PETROL", "benzín": "PETROL",
    "diesel": "DIESEL", "nafta": "DIESEL",
    "electric": "ELECTRIC", "elektro": "ELECTRIC",
    "hybrid": "HYBRID",
    "plugin": "PLUGIN_HYBRID", "plug-in": "PLUGIN_HYBRID",
    "lpg": "LPG", "cng": "CNG",
}

TRANSMISSION_MAP = {
    "manual": "MANUAL", "manuální": "MANUAL", "schaltgetriebe": "MANUAL",
    "automatic": "AUTOMATIC", "automatik": "AUTOMATIC", "automatická": "AUTOMATIC",
    "semi-automatic": "AUTOMATIC",
}

BODY_MAP = {
    "sedan": "SEDAN", "limousine": "SEDAN",
    "hatchback": "HATCHBACK",
    "estate": "COMBI", "combi": "COMBI", "kombi": "COMBI", "variant": "COMBI",
    "suv": "SUV", "off-road": "SUV",
    "coupe": "COUPE", "coupé": "COUPE",
    "cabrio": "CABRIO", "cabriolet": "CABRIO", "convertible": "CABRIO",
    "van": "VAN", "minivan": "VAN", "mpv": "VAN",
    "pickup": "PICKUP",
}
```

**2c) NEPOVINNÉ: Detail page fetch pro popis + fotky + výbavu:**
AS24 aktuálně nenavštěvuje detail pages. Přidání by znamenalo:
- +1 HTTP request per lead (s rate limiting 5s)
- Extrakce z `__NEXT_DATA__` JSON nebo HTML
- Výrazně pomalejší scraping

**Doporučení:** V první fázi extrahovat JEN data atributy z listing karty (zero additional requests). Detail page enrichment jako Fáze 3.

---

### Fáze 2: Scraper enrichment — Sauto

**Soubor:** `lead_scout/scrapers/sauto.py`

**2a) Extrakce z listing info-wrap (v `_parse_card()`):**
Info-wrap text: `"2012, 161 000 km, Benzín, Manuální"`
```python
info_el = card_el.select_one("div.c-item__info-wrap")
if info_el:
    info_text = info_el.get_text(separator=", ", strip=True)
    # Year (EXISTUJE)
    # Mileage (EXISTUJE)
    
    # NEW: Fuel
    fuel = None
    for fuel_key, fuel_val in FUEL_MAP.items():
        if fuel_key in info_text.lower():
            fuel = fuel_val
            break
    
    # NEW: Transmission
    transmission = None
    for trans_key, trans_val in TRANSMISSION_MAP.items():
        if trans_key in info_text.lower():
            transmission = trans_val
            break
```

**2b) Extrakce z detail page (v `_fetch_detail()`):**
Sauto už navštěvuje detail page pro telefon. Přidat extrakci:

```python
# Popis
description = None
desc_el = soup.select_one(
    "div[class*='description'], div[class*='popis'], "
    "div.c-detail__text, section[class*='description']"
)
if desc_el:
    description = desc_el.get_text(strip=True)[:5000]

# Fotky
photos = []
for img in soup.select("img[src*='foto'], img[class*='gallery'], img[data-src]"):
    src = img.get("src") or img.get("data-src")
    if src and ("sauto" in src or "szn" in src) and "thumb" not in src:
        photos.append(src)

# Parametry vozu (tabulka)
params = {}
for row in soup.select("tr, div[class*='param'], dl dt, dl dd"):
    # Parse key-value pairs from spec table
    ...

# Výbava (checklist)
equipment = []
for item in soup.select(
    "div[class*='equipment'] li, div[class*='vybava'] li, "
    "ul[class*='features'] li, div[class*='feature']"
):
    text = item.get_text(strip=True)
    if text and len(text) > 1:
        equipment.append(text)
```

**Return tuple rozšířit:**
```python
# PŘED: return phone, seller_name, seller_category
# PO:   return phone, seller_name, seller_category, fuel, transmission, 
#        power, body_type, color, equipment, description, photos
```

> **POZOR na performance:** Sauto už navštěvuje detail page — enrichment přidá jen parsing navíc (žádné extra requesty). Dopad na výkon: minimální.

---

### Fáze 2: Scraper enrichment — Bazoš

**Soubor:** `lead_scout/scrapers/bazos.py`

**2a) Extrakce popisu z detail page (v `_fetch_detail()`):**
```python
# Popis — EXISTUJE jako div.popisdetail, jen se prohledává pro telefon
description = None
desc_el = soup.select_one("div.popisdetail")
if desc_el:
    description = desc_el.get_text(strip=True)[:5000]
```

**2b) Extrakce fotek:**
```python
photos = []
for img in soup.select("img[src*='img.bazos']"):
    src = img.get("src", "")
    if src and "thumb" not in src and "mini" not in src:
        photos.append(src)
```

**2c) Regex extrakce parametrů z popisu:**
Bazoš nemá strukturované parametry — vše je v textu popisu. Použít regex:
```python
def _extract_params_from_text(text: str) -> dict:
    params = {}
    
    # Palivo
    fuel_patterns = {
        r"\b(benzín|benzin)\b": "PETROL",
        r"\b(nafta|diesel)\b": "DIESEL",
        r"\b(hybrid)\b": "HYBRID",
        r"\b(elektro|electric)\b": "ELECTRIC",
        r"\b(lpg)\b": "LPG",
        r"\b(cng)\b": "CNG",
    }
    for pat, val in fuel_patterns.items():
        if re.search(pat, text, re.IGNORECASE):
            params["fuel"] = val
            break
    
    # Převodovka
    if re.search(r"\b(automat|automatická|dsg|cvt)\b", text, re.IGNORECASE):
        params["transmission"] = "AUTOMATIC"
    elif re.search(r"\b(manuál|manuální)\b", text, re.IGNORECASE):
        params["transmission"] = "MANUAL"
    
    # Výkon
    power_match = re.search(r"(\d{2,3})\s*kw", text, re.IGNORECASE)
    if power_match:
        params["power"] = int(power_match.group(1))
    
    # Barva
    colors = ["bílá", "černá", "šedá", "stříbrná", "modrá", "červená", 
              "zelená", "hnědá", "béžová", "žlutá", "oranžová"]
    for color in colors:
        if color in text.lower():
            params["color"] = color.capitalize()
            break
    
    return params
```

> **Kvalita dat z Bazoše:** Nižší než AS24/Sauto — závisí na tom co prodejce napíše. Ale popis + fotky jsou cenné pro makléře.

---

### Fáze 3 (BUDOUCÍ): AS24 detail page enrichment

Pokud data atributy na listing kartě nestačí, přidat detail page fetch:

**Varianta A: `__NEXT_DATA__` JSON parsing (DOPORUČENÁ)**
- AS24 je Next.js — `<script id="__NEXT_DATA__">` obsahuje strukturovaný JSON
- `sellerType`, equipment list, full specs, photo URLs — vše v jednom JSON
- Spolehlivější než HTML selektory (JSON se nemění při redesignu)
- Jeden HTTP request per listing

**Varianta B: HTML parsing detail page**
- Méně spolehlivé (class names se mění)
- Ale jednodušší implementace

**Dopad na výkon:** +1 request per listing × 5s rate limit = výrazné zpomalení. Řešení:
- Enrichment jen pro high-score leady (score > 50)
- Nebo async enrichment job (scrape listing cards → save basic → enrich top N later)

---

### Fáze 3B (PRIORITA): Real-time tržní cenová analýza z internetu

> **KLÍČOVÁ ZMĚNA:** Uživatel říká: "AI si muže brat data všude, graf prodeje se muže vzít podle celého internetu ne podle našich dat." Naše DB má ~200 SOUKROMNIK leadů — skoro vždy "Nedostatek dat". Internet má TISÍCE nabídek pro každý model.

**Koncept:**
1. Makléř otevře lead detail (Škoda Octavia 2.0 TDI 2020, 350 000 Kč)
2. Klikne "Analyzovat trh" nebo se data automaticky fetchnou
3. Backend real-time fetchne ceny z AS24 + Sauto za podobná auta
4. Vrátí histogram, medián, percentil, verdikt
5. Frontend zobrazí graf + "Trh říká 380-420k, tvůj lead má 350k = dobrá cena"

#### 3B.1: API endpoint `GET /api/scout-leads/[id]/market-analysis`

**Request:** žádné query params (bere brand/model/year z leadu)

**Backend flow:**
```typescript
async function fetchMarketPrices(brand: string, model: string, year: number) {
  const sources = await Promise.allSettled([
    fetchAS24Prices(brand, model, year),
    fetchSautoPrices(brand, model, year),
  ]);
  
  // Merge all prices from all sources
  const allPrices = sources
    .filter(s => s.status === "fulfilled")
    .flatMap(s => s.value);
  
  return allPrices; // [{price, year, mileage, source, url}, ...]
}
```

#### 3B.2: AS24 price fetcher (server-side)

AS24 URL format pro brand/model search:
```
https://www.autoscout24.cz/lst/{brand-slug}/{model-slug}?fregfrom={year-2}&fregto={year+2}&custtype=P&sort=price&ustate=N%2CU&atype=C&size=50&page=1
```

**URL parametry (ověřeno z výzkumu):**
- `fregfrom` / `fregto` — rok od/do
- `kmto` — max nájezd
- `pricefrom` / `priceto` — cenový rozsah
- `custtype=P` — jen soukromí prodejci
- `sort=price` — řazení podle ceny
- `size=50` — 50 výsledků na stránku

**Brand/model slug mapping:**
```typescript
const BRAND_SLUGS: Record<string, string> = {
  "Škoda": "skoda", "Volkswagen": "volkswagen", "BMW": "bmw",
  "Audi": "audi", "Mercedes-Benz": "mercedes-benz", "Toyota": "toyota",
  "Hyundai": "hyundai", "Kia": "kia", "Ford": "ford",
  "Peugeot": "peugeot", "Renault": "renault", "Opel": "opel",
  "Volvo": "volvo", "Mazda": "mazda", "Honda": "honda",
  "Seat": "seat", "Fiat": "fiat", "Dacia": "dacia",
  // ... další značky
};

const MODEL_SLUGS: Record<string, Record<string, string>> = {
  "skoda": { "Octavia": "octavia", "Fabia": "fabia", "Superb": "superb", "Kodiaq": "kodiaq", "Kamiq": "kamiq", "Scala": "scala", "Karoq": "karoq", "Enyaq": "enyaq" },
  "volkswagen": { "Golf": "golf", "Passat": "passat", "Tiguan": "tiguan", "Polo": "polo", "T-Roc": "t-roc", "Touareg": "touareg", "ID.4": "id.4", "ID.3": "id.3" },
  "bmw": { "3": "3er-(alle)", "5": "5er-(alle)", "X3": "x3", "X5": "x5", "1": "1er-(alle)" },
  // ... další modely
};
```

> **POZN:** Slug mapping nemusí být kompletní — pokud model nemá slug, fallback na generický search `?make={brand}&model={model}`.

**Implementace fetcheru (Next.js API route, server-side):**
```typescript
import { BaseScraper } from "./base"; // httpx-like fetch s rate limiting

async function fetchAS24Prices(brand: string, model: string, year: number): Promise<PricePoint[]> {
  const brandSlug = BRAND_SLUGS[brand];
  const modelSlug = MODEL_SLUGS[brandSlug]?.[model];
  
  if (!brandSlug) return [];
  
  const base = "https://www.autoscout24.cz";
  const path = modelSlug ? `/lst/${brandSlug}/${modelSlug}` : `/lst/${brandSlug}`;
  const url = `${base}${path}?fregfrom=${year - 2}&fregto=${year + 2}&custtype=P&sort=price&ustate=N%2CU&atype=C&size=50&page=1`;
  
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 ..." },
    signal: AbortSignal.timeout(10000), // 10s timeout
  });
  
  if (!response.ok) return [];
  
  const html = await response.text();
  // Parse data-price attributes from article elements
  const prices = parseAS24Prices(html);
  return prices;
}

function parseAS24Prices(html: string): PricePoint[] {
  // Use cheerio (server-side DOM parser) or regex
  // Extract from <article data-price="..." data-mileage="..." data-first-registration="...">
  const priceRegex = /data-price="(\d+)"/g;
  const prices: PricePoint[] = [];
  let match;
  while ((match = priceRegex.exec(html)) !== null) {
    prices.push({ price: parseInt(match[1]), source: "AUTOSCOUT24" });
  }
  return prices;
}
```

#### 3B.3: Sauto price fetcher (server-side)

Sauto.cz má **JSON API** (zjištěno z výzkumu):
```
https://www.sauto.cz/api/v1/items/search?manufacturer_model_seo={brand}&category_id=838&condition_seo=ojete&limit=100&offset=0
```

**Parametry:**
- `manufacturer_model_seo` — slug značky (e.g. "skoda")
- `category_id=838` — osobní auta
- `condition_seo=ojete` — ojetá
- `limit` / `offset` — pagination
- `price_from` / `price_max` — cenový rozsah

**Výhoda:** JSON response = snadné parsování, žádný HTML scraping. Rychlejší a spolehlivější.

```typescript
async function fetchSautoPrices(brand: string, model: string, year: number): Promise<PricePoint[]> {
  const brandSlug = brand.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const url = `https://www.sauto.cz/api/v1/items/search?manufacturer_model_seo=${brandSlug}&category_id=838&condition_seo=ojete&limit=100&offset=0`;
  
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 ..." },
    signal: AbortSignal.timeout(10000),
  });
  
  if (!response.ok) return [];
  
  const data = await response.json();
  // Filter by model name + year range, extract prices
  return data.items
    .filter((item: any) => {
      const itemYear = item.year || item.first_registration_year;
      const itemModel = (item.model_name || "").toLowerCase();
      return itemModel.includes(model.toLowerCase()) && 
             itemYear >= year - 2 && itemYear <= year + 2;
    })
    .map((item: any) => ({
      price: item.price,
      year: item.year,
      mileage: item.mileage,
      source: "SAUTO",
      url: item.url,
    }));
}
```

#### 3B.4: Response format

```typescript
interface MarketAnalysisResponse {
  // Cenová distribuce z internetu
  priceDistribution: {
    buckets: Array<{
      min: number;
      max: number;
      count: number;
      isCurrent: boolean; // bucket kde je aktuální lead
    }>;
    stats: {
      median: number;
      mean: number;
      min: number;
      max: number;
      count: number;          // celkem nalezených nabídek na trhu
      percentile: number;     // percentil aktuální ceny (0-100)
    };
    sources: {
      autoscout24: number;    // kolik cen z AS24
      sauto: number;          // kolik cen z Sauto
    };
  } | null;

  // Cenový verdikt
  priceVerdict: {
    verdict: "LOW" | "OK" | "HIGH";
    deviationPercent: number;
    label: string;            // "Pod trhem (−12%)" / "V normálu" / "Nad trhem (+8%)"
  } | null;

  // Podobné nabídky z internetu (top 5 nejbližší cenou)
  similarOffers: Array<{
    price: number;
    year: number | null;
    mileage: number | null;
    source: string;
    url: string | null;
    title: string | null;
  }>;

  // Fallback z naší DB (pokud internet selže)
  dbFallback: boolean;        // true = data z naší DB, false = z internetu
}
```

#### 3B.5: Caching a rate limiting

**Problém:** Nechceme fetchovat AS24/Sauto při KAŽDÉM otevření leadu.

**Řešení: Cache s TTL**
```typescript
// In-memory cache (nebo Redis pokud je k dispozici)
const marketCache = new Map<string, { data: MarketAnalysisResponse; timestamp: number }>();
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hodiny

function getCacheKey(brand: string, model: string, year: number): string {
  return `${brand}:${model}:${year}`;
}
```

- Cache key: `{brand}:{model}:{year}` — stejné auto = stejná cache
- TTL: **4 hodiny** (ceny se nemění minutu po minutě)
- Při cache miss: fetch AS24 + Sauto paralelně (Promise.allSettled)
- Při cache hit: okamžitá odpověď
- Fallback: pokud oba zdroje selžou → query naší DB (stávající logika z plan-ai-lead-intelligence-card.md)

#### 3B.6: Error handling a fallback

```
Internet OK (AS24 + Sauto) → histogram z tržních dat
    ↓ fail
Internet partial (jen AS24 NEBO Sauto) → histogram z jednoho zdroje
    ↓ fail
Naše DB (200+ SOUKROMNIK leadů) → histogram z DB dat (stávající logika)
    ↓ < 5 similar
"Nedostatek dat pro analýzu"
```

#### 3B.7: Výkonnost

| Zdroj | Metoda | Timeout | Očekávaná doba |
|-------|--------|---------|----------------|
| AS24 | HTTP GET + HTML parse | 10s | 1-3s |
| Sauto | HTTP GET + JSON parse | 10s | 0.5-1s |
| **Celkem** | Promise.allSettled (parallel) | 10s | 1-3s |
| Cache hit | In-memory lookup | - | <1ms |

Makléř čeká max 3s na první load. Při opakovaném otevření < 1ms.

#### 3B.8: UI integrace

Při otevření lead detail:
1. Fetch `/api/scout-leads/{id}/market-analysis`
2. Během loading: skeleton/spinner v grafové sekci
3. Po load: Recharts BarChart + verdikt badge + similar offers tabulka
4. Badge v pravém sloupci: "Pod trhem −12%" (zelený) / "Nad trhem +8%" (oranžový)
5. Zdroj dat indikátor: "Data z 127 nabídek na AS24 + Sauto" nebo "Data z naší DB (5 nabídek)"

---

### Fáze 4: Admin UI — zobrazení enriched dat

**Soubor:** `components/admin/scout-leads/ScoutLeadDetail.tsx`

**4a) Vehicle Info karta rozšířit:**
```
Vozidlo
├── Značka + Model: Škoda Octavia
├── Rok: 2020
├── Cena: 385 000 Kč
├── Nájezd: 92 000 km
├── Palivo: Diesel          ← NEW
├── Převodovka: Automatická  ← NEW
├── Výkon: 110 kW           ← NEW
├── Karoserie: Combi         ← NEW
├── Barva: Šedá              ← NEW
└── Dveře: 5                 ← NEW
```

**4b) Nová sekce: Výbava (chips/tagy)**
```
Výbava
🔧 Klimatizace | Tempomat | Navigace | Parkovací senzory | Tažné zařízení | LED | Vyhřívaná sedadla
```

**4c) Nová sekce: Popis prodejce**
```
Popis prodejce
"Prodám Škodu Octavia Combi 2.0 TDI, 1. majitel, servisní knížka, nebourané..."
```
Collapsible, max 500 chars zobrazených, expand pro celý text.

**4d) Nová sekce: Fotogalerie**
```
Fotky (8)
[thumb1] [thumb2] [thumb3] [thumb4] [+4 more]
```
Grid 4 thumbnailů, klik → lightbox/fullscreen. Lazy load.

---

### Fáze 5: Konverze — pre-fill Vehicle dat

**Soubor:** `lib/scout-lead-management.ts` → `convertToLead()`

Aktuálně mapuje jen: brand, model, year, price, city, phone.

**Rozšířit mapování:**
```typescript
// NOVÉ pole při konverzi ScoutLead → Lead
const leadData = {
  // ... existing ...
  fuelType: lead.vehicleFuel,             // → Vehicle.fuelType
  transmission: lead.vehicleTransmission,  // → Vehicle.transmission
  enginePower: lead.vehiclePower,          // → Vehicle.enginePower
  engineCapacity: lead.vehicleEngineCC,    // → Vehicle.engineCapacity
  bodyType: lead.vehicleBodyType,          // → Vehicle.bodyType
  color: lead.vehicleColor,               // → Vehicle.color
  doorsCount: lead.vehicleDoors,           // → Vehicle.doorsCount
  equipment: lead.vehicleEquipment,        // → Vehicle.equipment (JSON)
  description: lead.vehicleDescription,    // → Vehicle.description
  // photos → handled separately (need to upload to Cloudinary)
};
```

**Fotky:** Při konverzi stáhnout fotky z source URLs → nahrát na Cloudinary → vytvořit VehicleImage záznamy. Async job (ne v request handleru).

---

## §5 Prioritizace — co implementovat jako první

| Pořadí | Co | Kde | Effort | Hodnota |
|--------|----|-----|--------|---------|
| **0** | **Real-time tržní cenová analýza (Fáze 3B)** | **Carmakler API** | **~150 řádků** | **HIGHEST** |
| 1 | Datový model — nové vehicle extended pole (Fáze 1) | Lead Scout + Carmakler | ~100 řádků | HIGH (prereq) |
| 2 | Palivo + převodovka z listing karty | AS24 | 10 řádků | HIGH |
| 3 | Palivo + převodovka z info-wrap | Sauto | 15 řádků | HIGH |
| 4 | Popis z detail page | Bazoš | 5 řádků | HIGH |
| 5 | Popis z detail page | Sauto | 10 řádků | HIGH |
| 6 | Fotky z detail page | Bazoš | 10 řádků | MEDIUM |
| 7 | Fotky z detail page | Sauto | 10 řádků | MEDIUM |
| 8 | Body type, výkon, barva z listing | AS24 | 10 řádků | MEDIUM |
| 9 | Výbava z detail page | Sauto | 15 řádků | MEDIUM |
| 10 | Regex parametry z popisu | Bazoš | 30 řádků | LOW |
| 11 | AS24 detail page enrichment | AS24 | 50 řádků | HIGH |

**Položky 2-9 = ZERO additional HTTP requests** — parsují data z pages které už scrapery navštěvují.
**Položka 0 = HLAVNÍ HODNOTA** — real-time internet data, ne naše DB.

---

## §6 Acceptance Criteria

### Real-time tržní analýza (PRIORITA)
- [ ] API endpoint `GET /api/scout-leads/[id]/market-analysis` existuje
- [ ] Fetchuje ceny z AS24 (HTML parse) a Sauto (JSON API) paralelně
- [ ] Cache s TTL 4h (key = brand:model:year)
- [ ] Vrací histogram (8-12 bucketů), medián, percentil, verdikt (LOW/OK/HIGH)
- [ ] Vrací top 5 similar offers s URL
- [ ] Fallback na DB data pokud internet selže
- [ ] Timeout 10s per zdroj, celkem max 10s (parallel)
- [ ] Frontend: Recharts BarChart + verdikt badge + similar offers tabulka
- [ ] Zdroj dat indikátor ("127 nabídek z AS24 + Sauto" vs "5 nabídek z naší DB")

### Datový model
- [ ] ScoutLead Prisma model má 10 nových vehicle extended polí
- [ ] SQLite leads tabulka má odpovídající sloupce (safe migration)
- [ ] ScoutLeadPayload Pydantic model má nová pole
- [ ] Ingest API přijímá nová pole (Zod schema updated)
- [ ] Pusher odesílá nová pole do Carmakler

### Scrapery
- [ ] AS24 extrahuje palivo, převodovku (z data atributů, pokud existují)
- [ ] Sauto extrahuje palivo, převodovku z info-wrap textu
- [ ] Sauto extrahuje popis, fotky, výbavu z detail page
- [ ] Bazoš extrahuje popis, fotky z detail page
- [ ] Žádný scraper nedělá extra HTTP requesty (jen parsuje existující stránky)

### Admin UI
- [ ] Vehicle Info sekce zobrazuje palivo, převodovku, výkon, karoserii, barvu
- [ ] Výbava se zobrazuje jako chip/tag list
- [ ] Popis prodejce se zobrazuje (collapsible)
- [ ] Fotogalerie se zobrazuje (thumbnails + lightbox)

### Konverze
- [ ] convertToLead() pre-filluje nová pole do Lead/Vehicle

---

## §7 STOP pravidla

- **STOP-1:** AS24 `data-fuel-type` atribut neexistuje → extrahovat z title/subtitle textu místo data atributu
- **STOP-2:** Sauto info-wrap formát se změnil → upravit regex, ale NEpřidávat extra requesty
- **STOP-3:** Fotky z Bazoše/Sauto mají watermark/thumbnail URL → ukládat full-size URL, ne thumbnail
- **STOP-4:** vehicleDescription > 5000 znaků → oříznout, přidat "..." (DB limit)
- **STOP-5:** Extrakce parametrů z Bazoš popisu má < 30% úspěšnost → přeskočit, nechat jen raw popis
- **STOP-6:** AS24 vrací 403/429 při market-analysis fetch → přidat User-Agent rotation, snížit frekvenci, nebo vypnout AS24 zdroj pro analýzu
- **STOP-7:** Sauto JSON API endpoint se změnil/neexistuje → fallback na HTML scraping nebo vypnout Sauto zdroj
- **STOP-8:** Brand/model slug mapping pokrývá < 50% leadů → přidat fallback na generický search (`?make=` parametr místo slug path)

---

## §8 Soubory k úpravě

### Lead Scout (Python)
| Soubor | Změna | Řádky |
|--------|-------|-------|
| `lead_scout/models.py` | +10 nových polí v ScoutLeadPayload | +15 |
| `lead_scout/db.py` | +10 sloupců v SQLite, update save_lead() | +30 |
| `lead_scout/client.py` | +10 snake_to_camel mappings | +15 |
| `lead_scout/scrapers/autoscout24.py` | data atributy enrichment | +30 |
| `lead_scout/scrapers/sauto.py` | info-wrap parsing + detail enrichment | +50 |
| `lead_scout/scrapers/bazos.py` | popis + fotky z detail page | +30 |
| `lead_scout/scoring.py` | bonus body pro enriched data | +10 |

### Carmakler (Next.js)
| Soubor | Změna | Řádky |
|--------|-------|-------|
| `prisma/schema.prisma` | +10 polí v ScoutLead | +12 |
| `lib/validators/scout-lead.ts` | +10 polí v Zod schema | +15 |
| `app/api/scout-leads/ingest/route.ts` | přijmout nová pole | +5 |
| `app/api/scout-leads/[id]/market-analysis/route.ts` | **NOVÝ — real-time tržní analýza** | +150 |
| `lib/market-analysis.ts` | **NOVÝ — AS24 + Sauto price fetchers, cache, aggregation** | +200 |
| `lib/brand-model-slugs.ts` | **NOVÝ — slug mapping pro AS24/Sauto URL construction** | +80 |
| `components/admin/scout-leads/ScoutLeadDetail.tsx` | rozšířit Vehicle Info + nové sekce | +120 |
| `components/admin/scout-leads/LeadPriceChart.tsx` | **NOVÝ — Recharts histogram** | +80 |
| `components/admin/scout-leads/LeadPriceVerdict.tsx` | **NOVÝ — cenový verdikt badge** | +40 |
| `components/admin/scout-leads/LeadSimilarOffers.tsx` | **NOVÝ — tabulka similar offers** | +60 |
| `lib/scout-lead-management.ts` | convertToLead() pre-fill | +15 |

**Celkový rozsah:** ~930 řádků nového kódu. Hlavní investice = real-time market analysis (~430 řádků).
