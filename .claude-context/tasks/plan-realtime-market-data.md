# Plán: Real-time tržní data z internetu pro cenový graf

**Task:** #73
**Status:** READY FOR IMPLEMENTATION
**Priority:** HIGHEST
**Datum:** 2026-05-20
**Navazuje na:** `plan-lead-enrichment.md` (Fáze 3B), supersedes `plan-ai-lead-intelligence-card.md` (Moduly A+B)

---

## §1 Kontext

Makléř otevře lead detail (Fiat Punto 1.2, 1997, 24 200 Kč). Chceme mu ukázat:
- **Cenový histogram** ze stovek reálných nabídek na trhu
- **Verdikt:** "Cena je 12% pod mediánem — dobrá příležitost"
- **Podobné nabídky** s odkazy na originální inzeráty

Naše DB má ~200 SOUKROMNIK leadů → pro většinu značek/modelů "Nedostatek dat". Internet má tisíce.

---

## §2 Zdroje dat (3 portály)

### 2.1 AutoScout24 (CZ + DE + AT)

**URL format — DVĚ varianty:**

**A) Slug-based (jednodušší, ověřená):**
```
https://www.autoscout24.cz/lst/{brand-slug}/{model-slug}?fregfrom={y-2}&fregto={y+2}&custtype=P&sort=price&ustate=N%2CU&atype=C&size=50&page=1
```
Příklad: `/lst/skoda/octavia?fregfrom=2018&fregto=2022&custtype=P`

**B) ID-based (mmvmk0/mmvmd0):**
```
https://www.autoscout24.cz/lst?mmvmk0={brandId}&mmvmd0={modelId}&fregfrom={y-2}&fregto={y+2}&custtype=P&sort=price&ustate=N%2CU&atype=C&size=50&page=1
```
Příklad: `?mmvmk0=9&mmvmd0=1628` (BMW 3er)

**Klíčové parametry:**
| Parametr | Popis | Příklad |
|----------|-------|---------|
| `fregfrom` / `fregto` | rok od/do | `2018` / `2022` |
| `kmto` | max nájezd | `200000` |
| `pricefrom` / `priceto` | cenový rozsah | `50000` / `500000` |
| `custtype=P` | jen soukromí prodejci | `P` |
| `sort=price` | řazení podle ceny | `price` |
| `size=50` | výsledků na stránku | `50` |
| `cy` | země (multi) | `D,A` |

**Parsování dat:** HTML `data-price` atributy na `<article>` elementech.
AS24 scraper to už umí — reuse `_parse_ad()` logiky.

**Doporučení:** Použít **slug-based** URL (varianta A). Nevyžaduje mapování na interní ID kódy. Slug = lowercased brand name.

> **mmvmk0/mmvmd0 kódy:** Nejsou veřejně dokumentované. Neexistuje oficiální mapping. Musely by se reverse-engineerovat z webu — zbytečná práce když slug funguje.

### 2.2 Sauto.cz (CZ only)

**JSON API (zjištěno z výzkumu):**
```
https://www.sauto.cz/api/v1/items/search?manufacturer_model_seo={brand-slug}&category_id=838&condition_seo=ojete&limit=100&offset=0
```

**Parametry:**
| Parametr | Popis | Příklad |
|----------|-------|---------|
| `manufacturer_model_seo` | slug značky | `skoda` |
| `category_id` | kategorie vozidla | `838` (osobní) |
| `condition_seo` | stav | `ojete` |
| `limit` / `offset` | pagination | `100` / `0` |
| `price_from` / `price_max` | cenový rozsah | `10000` / `500000` |

**Parsování dat:** JSON response — `items[].price`, `items[].year`, `items[].mileage`. Nejrychlejší a nejspolehlivější ze všech zdrojů.

**Filtr po stažení:** Model name + year range (API filtruje jen brand, ne model).

### 2.3 Mobile.de (DE only)

**Oficiální Search API (dokumentované!):**
```
https://services.mobile.de/search-api/search?classification=refdata/classes/Car/makes/{BRAND}/models/{MODEL}&firstRegistrationDate.min={y-2}-01&firstRegistrationDate.max={y+2}-12&sellerType=FOR_SALE_BY_OWNER&price.min=1000&page.size=50
```

**Parametry:**
| Parametr | Popis | Příklad |
|----------|-------|---------|
| `classification` | brand/model path | `refdata/classes/Car/makes/SKODA/models/OCTAVIA` |
| `firstRegistrationDate.min/max` | rok od/do | `2018-01` / `2022-12` |
| `sellerType` | typ prodejce | `FOR_SALE_BY_OWNER` |
| `price.min` / `price.max` | cenový rozsah | `1000` / `50000` |
| `page.number` / `page.size` | pagination | `1` / `50` |

**Výhoda:** Oficiální API, dokumentované parametry, brand/model jako uppercase text (ne číselné kódy).
**Nevýhoda:** Max 2000 výsledků per query. Response formát musí ověřit implementátor.
**Ceny:** V EUR → konverze na CZK (kurz ~25.5).

---

## §3 Architektura

### 3.1 API Endpoint

**`GET /api/scout-leads/[id]/market-analysis`**

Rozšíření stávajícího endpointu (z plan-ai-lead-intelligence-card.md). Jeden endpoint, dva režimy:

```
Request → Cache hit? → YES → return cached data
                    → NO → fetch AS24 + Sauto + Mobile.de (parallel)
                         → merge prices → compute histogram + verdict
                         → cache result → return
```

### 3.2 Fetcher architecture

```typescript
// lib/market-analysis.ts

interface PricePoint {
  price: number;        // CZK
  year: number | null;
  mileage: number | null;
  source: "AUTOSCOUT24" | "SAUTO" | "MOBILE_DE";
  url: string | null;
  title: string | null;
}

interface MarketAnalysisResult {
  prices: PricePoint[];
  histogram: HistogramBucket[];
  stats: PriceStats;
  verdict: PriceVerdict;
  similarOffers: PricePoint[];  // top 5 closest by price
  sources: { autoscout24: number; sauto: number; mobile_de: number };
  fromCache: boolean;
  fetchedAt: string;
}

async function fetchMarketData(
  brand: string, model: string, year: number
): Promise<MarketAnalysisResult> {
  const cacheKey = `market:${brand}:${model}:${year}`;
  const cached = marketCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { ...cached.data, fromCache: true };
  }

  // Fetch from all sources in parallel
  const [as24CZ, as24DE, as24AT, sauto, mobile] = await Promise.allSettled([
    fetchAS24(brand, model, year, "cz"),
    fetchAS24(brand, model, year, "de"),
    fetchAS24(brand, model, year, "at"),
    fetchSauto(brand, model, year),
    fetchMobileDe(brand, model, year),
  ]);

  // Merge all successful results
  const allPrices = [as24CZ, as24DE, as24AT, sauto, mobile]
    .filter(r => r.status === "fulfilled")
    .flatMap(r => (r as PromiseFulfilledResult<PricePoint[]>).value);

  // Compute analytics
  const result = computeAnalysis(allPrices, year);
  
  // Cache
  marketCache.set(cacheKey, { data: result, timestamp: Date.now() });
  
  return result;
}
```

### 3.3 Brand/Model slug mapping

**Přístup: NEPOTŘEBUJEME číselné kódy.**

| Zdroj | Brand format | Model format | Příklad |
|-------|-------------|-------------|---------|
| AS24 | lowercase slug | lowercase slug | `/lst/skoda/octavia` |
| Sauto | lowercase slug | filtr po stažení | `?manufacturer_model_seo=skoda` |
| Mobile.de | UPPERCASE | UPPERCASE | `makes/SKODA/models/OCTAVIA` |

```typescript
// lib/brand-model-slugs.ts

function brandToAS24Slug(brand: string): string {
  // "Škoda" → "skoda", "Mercedes-Benz" → "mercedes-benz"
  return brand.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function brandToMobileDe(brand: string): string {
  // "Škoda" → "SKODA", "Mercedes-Benz" → "MERCEDES_BENZ"
  return brand.toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

// Model slug — some models need special mapping
const MODEL_OVERRIDES: Record<string, Record<string, string>> = {
  // AS24 uses different model slugs for some models
  "bmw": { "3": "3er-(alle)", "5": "5er-(alle)", "1": "1er-(alle)", "X3": "x3" },
  "mercedes-benz": { "C": "c-klasse", "E": "e-klasse", "A": "a-klasse" },
};

function modelToAS24Slug(brand: string, model: string): string | null {
  const brandSlug = brandToAS24Slug(brand);
  const override = MODEL_OVERRIDES[brandSlug]?.[model];
  if (override) return override;
  // Default: lowercase
  return model.toLowerCase().replace(/\s+/g, "-");
}
```

**Fallback:** Pokud slug nevrátí výsledky → zkusit bez modelu (jen brand + year filtr).

### 3.4 EUR → CZK konverze

AS24 DE/AT a Mobile.de vrací ceny v EUR.

```typescript
const EUR_TO_CZK = 25.5; // hardcoded approx rate

function normalizePriceToCZK(price: number, source: string, country: string): number {
  if (source === "MOBILE_DE" || country === "de" || country === "at") {
    return Math.round(price * EUR_TO_CZK);
  }
  return price; // CZ sources = already CZK
}
```

> Přesný kurz se mění — ale pro cenový graf ± 2% nevadí. Hardcoded je OK.

---

## §4 Cache strategie

### In-memory cache (Map)

```typescript
const marketCache = new Map<string, {
  data: MarketAnalysisResult;
  timestamp: number;
}>();

const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hodiny
const CACHE_MAX_SIZE = 500;            // max 500 entries
```

**Proč in-memory, ne Redis:**
- Carmakler běží jako 1 PM2 process na 1 serveru
- Cache se invaliduje při restartu — to je OK (data se fetchnou znovu za 1-3s)
- Redis by byl over-engineering pro ~500 cache entries

**Cache key:** `market:{brand}:{model}:{year}` (case-insensitive, normalized)

**Cache eviction:** LRU — pokud > 500 entries, smazat nejstarší.

**Proč 4h a ne 1h:**
- Ceny na trhu se nemění každou hodinu
- 4h = dostatečně čerstvé pro makléřovo rozhodování
- Méně requestů na AS24/Sauto/Mobile.de = menší riziko rate limitingu

---

## §5 Výkon a timeouty

| Operace | Timeout | Očekávaná doba | Fallback |
|---------|---------|----------------|----------|
| AS24 CZ fetch | 8s | 1-3s | skip |
| AS24 DE fetch | 8s | 1-3s | skip |
| AS24 AT fetch | 8s | 1-3s | skip |
| Sauto fetch | 8s | 0.5-1s (JSON) | skip |
| Mobile.de fetch | 8s | 1-2s | skip |
| **Celkem (parallel)** | **10s** | **1-3s** | DB fallback |
| Cache hit | - | <1ms | - |

```typescript
// Implementace s timeoutem
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 8000);

const response = await fetch(url, {
  headers: { "User-Agent": "Mozilla/5.0 ..." },
  signal: controller.signal,
});
clearTimeout(timeout);
```

**Promise.allSettled** — pokud AS24 DE je pomalý, Sauto a AS24 CZ vrátí data. Výsledek = merge dostupných dat.

---

## §6 Fallback chain

```
1. Internet (AS24 CZ/DE/AT + Sauto + Mobile.de)
   → ≥ 10 cen → histogram z tržních dat ✅
   
2. Internet partial (jen některé zdroje)
   → ≥ 5 cen → histogram z dostupných dat + "Omezená data"
   
3. Naše DB (Prisma query similar leads)
   → ≥ 5 cen → histogram z DB + "Data z naší databáze"
   
4. Žádná data
   → "Nedostatek dat pro cenovou analýzu"
```

DB fallback query (z plan-ai-lead-intelligence-card.md):
```typescript
const dbSimilar = await prisma.scoutLead.findMany({
  where: {
    vehicleBrand: lead.vehicleBrand,
    vehicleModel: lead.vehicleModel,
    vehicleYear: { gte: year - 2, lte: year + 2 },
    vehiclePrice: { not: null, gt: 0 },
    id: { not: lead.id },
  },
  select: { vehiclePrice: true },
});
```

---

## §7 Histogram + Verdikt výpočet

```typescript
function computeAnalysis(prices: PricePoint[], leadPrice: number): MarketAnalysisResult {
  const validPrices = prices.map(p => p.price).filter(p => p > 0).sort((a, b) => a - b);
  
  if (validPrices.length < 5) {
    return { /* empty result, no histogram */ };
  }

  // Histogram — 10 buckets
  const min = validPrices[0];
  const max = validPrices[validPrices.length - 1];
  const bucketSize = Math.ceil((max - min) / 10) || 1;
  
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    min: min + i * bucketSize,
    max: min + (i + 1) * bucketSize,
    count: 0,
    isCurrent: false,
  }));
  
  for (const price of validPrices) {
    const idx = Math.min(Math.floor((price - min) / bucketSize), 9);
    buckets[idx].count++;
  }
  
  // Mark current lead's bucket
  if (leadPrice >= min && leadPrice <= max) {
    const idx = Math.min(Math.floor((leadPrice - min) / bucketSize), 9);
    buckets[idx].isCurrent = true;
  }

  // Stats
  const median = validPrices[Math.floor(validPrices.length / 2)];
  const mean = Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length);
  const deviation = ((leadPrice - median) / median) * 100;

  // Verdikt
  let verdict: "LOW" | "OK" | "HIGH";
  let label: string;
  if (deviation < -15) {
    verdict = "LOW";
    label = `Pod trhem (${Math.round(deviation)}%)`;
  } else if (deviation > 15) {
    verdict = "HIGH";
    label = `Nad trhem (+${Math.round(deviation)}%)`;
  } else {
    verdict = "OK";
    label = "V normálu";
  }

  // Percentil
  const belowCount = validPrices.filter(p => p < leadPrice).length;
  const percentile = Math.round((belowCount / validPrices.length) * 100);

  // Top 5 similar
  const similarOffers = prices
    .filter(p => p.price > 0)
    .sort((a, b) => Math.abs(a.price - leadPrice) - Math.abs(b.price - leadPrice))
    .slice(0, 5);

  return {
    prices,
    histogram: buckets,
    stats: { median, mean, min, max, count: validPrices.length, percentile },
    verdict: { verdict, deviationPercent: Math.round(deviation), label },
    similarOffers,
    sources: {
      autoscout24: prices.filter(p => p.source === "AUTOSCOUT24").length,
      sauto: prices.filter(p => p.source === "SAUTO").length,
      mobile_de: prices.filter(p => p.source === "MOBILE_DE").length,
    },
    fromCache: false,
    fetchedAt: new Date().toISOString(),
  };
}
```

---

## §8 Response format

```typescript
// GET /api/scout-leads/[id]/market-analysis

interface MarketAnalysisResponse {
  priceDistribution: {
    buckets: Array<{
      min: number;
      max: number;
      count: number;
      isCurrent: boolean;
    }>;
    stats: {
      median: number;
      mean: number;
      min: number;
      max: number;
      count: number;
      percentile: number;
    };
    sources: {
      autoscout24: number;
      sauto: number;
      mobile_de: number;
    };
  } | null;

  priceVerdict: {
    verdict: "LOW" | "OK" | "HIGH";
    deviationPercent: number;
    label: string;
  } | null;

  similarOffers: Array<{
    price: number;
    year: number | null;
    mileage: number | null;
    source: string;
    url: string | null;
    title: string | null;
  }>;

  meta: {
    fromCache: boolean;
    fetchedAt: string;
    dbFallback: boolean;
  };
}
```

---

## §9 Acceptance Criteria

- [ ] Endpoint `GET /api/scout-leads/[id]/market-analysis` fetchuje reálné ceny z internetu
- [ ] AS24 fetcher: slug-based URL, parsuje `data-price` z HTML, CZ + DE + AT
- [ ] Sauto fetcher: JSON API, filtruje po stažení na model + year range
- [ ] Mobile.de fetcher: Search API, `classification` path, `sellerType=FOR_SALE_BY_OWNER`
- [ ] EUR → CZK konverze pro DE/AT/Mobile.de zdroje
- [ ] Promise.allSettled — partial results OK, timeout 8s per zdroj
- [ ] Cache: in-memory Map, TTL 4h, max 500 entries, LRU eviction
- [ ] Histogram: 10 bucketů, aktuální lead zvýrazněný
- [ ] Verdikt: LOW (< −15%), OK (± 15%), HIGH (> +15%)
- [ ] Top 5 similar offers s URL na originální inzerát
- [ ] Fallback chain: internet → partial → DB → "Nedostatek dat"
- [ ] Response time: < 3s (cache miss), < 1ms (cache hit)
- [ ] RBAC: stejná jako GET /api/scout-leads/[id]

---

## §10 STOP pravidla

- **STOP-1:** AS24 vrací 403/429 → přidat User-Agent rotation, snížit na 1 stránku, nebo vypnout AS24
- **STOP-2:** Sauto JSON API neexistuje / vrací 403 → fallback na HTML scraping nebo vypnout Sauto
- **STOP-3:** Mobile.de Search API vyžaduje auth/API key → vypnout Mobile.de, spoléhat na AS24 + Sauto
- **STOP-4:** Brand/model slug mapping selže (0 výsledků) → zkusit bez modelu (jen brand + year)
- **STOP-5:** Cache roste > 100MB RAM → snížit MAX_SIZE na 200

---

## §11 Soubory k vytvoření/úpravě

| Soubor | Typ | Řádky |
|--------|-----|-------|
| `app/api/scout-leads/[id]/market-analysis/route.ts` | NOVÝ | ~80 |
| `lib/market-analysis.ts` | NOVÝ | ~250 (fetchers + compute + cache) |
| `lib/brand-model-slugs.ts` | NOVÝ | ~60 (slug mapping + overrides) |
| `components/admin/scout-leads/LeadPriceChart.tsx` | NOVÝ | ~80 (Recharts BarChart) |
| `components/admin/scout-leads/LeadPriceVerdict.tsx` | NOVÝ | ~40 (badge + stats) |
| `components/admin/scout-leads/LeadSimilarOffers.tsx` | NOVÝ | ~60 (tabulka) |
| `components/admin/scout-leads/ScoutLeadDetail.tsx` | ÚPRAVA | +30 (import + layout) |

**Celkový rozsah:** ~600 řádků nového kódu.
