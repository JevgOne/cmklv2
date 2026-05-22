# Plan: Fix Market Analysis — Smart Matching

**Task:** #17
**Status:** PLAN READY
**Datum:** 2026-05-21
**Typ:** Bugfix + Enhancement
**Závažnost:** CRITICAL

---

## 1. Shrnutí problému

Market analysis porovnává lead se VŠEMI vozy stejného modelu bez ohledu na palivo, převodovku, nájezd. Sauto fetcher má navíc rozbitý field mapping (čte `year`/`mileage` místo `in_operation_date`/`tachometer`). Výsledek: nesmyslné cenové pásmo, chybný verdikt.

**Pravidla smart matchingu:**
- **Rok:** ±1 rok (strict)
- **Palivo:** PŘESNÁ shoda
- **Převodovka:** PŘESNÁ shoda
- **Nájezd:** ±40k km rozsah

---

## 2. Soubory k úpravě

| Soubor | Řádky k úpravě | Typ |
|--------|----------------|-----|
| `lib/market-analysis.ts` | Většina souboru (556 řádků) | UPDATE |
| `app/api/scout-leads/[id]/market-analysis/route.ts` | Řádky 24-66 | UPDATE |

---

## 3. Implementační kroky

### Krok 1: Nový interface `MatchOptions` (market-analysis.ts, po řádku 58)

Přidat nový interface za `MarketAnalysisResult`:

```typescript
/** Smart matching filters — passed from lead's own data */
export interface MatchOptions {
  fuel?: string | null;         // "DIESEL" | "PETROL" | "HYBRID" | "ELECTRIC" | "LPG" | "CNG"
  transmission?: string | null; // "AUTOMATIC" | "MANUAL"
  mileage?: number | null;      // km
}
```

Přidat mapping konstanty za `USER_AGENT` (po řádku 67):

```typescript
// --- Fuel / Gearbox mapping for external APIs ---

const FUEL_TO_AS24: Record<string, string> = {
  DIESEL: "D", PETROL: "B", HYBRID: "2", ELECTRIC: "E", LPG: "L", CNG: "C",
};

const FUEL_TO_SAUTO: Record<string, string> = {
  DIESEL: "nafta", PETROL: "benzin", HYBRID: "hybrid",
  ELECTRIC: "elektro", LPG: "lpg", CNG: "cng",
};

const GEAR_TO_AS24: Record<string, string> = { AUTOMATIC: "A", MANUAL: "M" };
const GEAR_TO_SAUTO: Record<string, string> = { AUTOMATIC: "automaticka", MANUAL: "manualni" };

const MILEAGE_RANGE = 40_000; // ±40k km
```

---

### Krok 2: Route — přidat fuel/transmission do select + pass options (route.ts)

**Soubor:** `app/api/scout-leads/[id]/market-analysis/route.ts`

**Řádky 24-35** — rozšířit Prisma select:

```typescript
// PŘED (řádek 27-34):
select: {
  id: true,
  category: true,
  vehicleBrand: true,
  vehicleModel: true,
  vehicleYear: true,
  vehiclePrice: true,
  vehicleMileage: true,
  assignedToId: true,
},

// PO:
select: {
  id: true,
  category: true,
  vehicleBrand: true,
  vehicleModel: true,
  vehicleYear: true,
  vehiclePrice: true,
  vehicleMileage: true,
  vehicleFuel: true,          // ← NEW
  vehicleTransmission: true,   // ← NEW
  assignedToId: true,
},
```

**Řádky 60-66** — předat options:

```typescript
// PŘED (řádek 60-66):
const result = await fetchMarketData(
  lead.id,
  lead.vehicleBrand,
  lead.vehicleModel,
  year,
  leadPrice
);

// PO:
const result = await fetchMarketData(
  lead.id,
  lead.vehicleBrand,
  lead.vehicleModel,
  year,
  leadPrice,
  {
    fuel: lead.vehicleFuel,
    transmission: lead.vehicleTransmission,
    mileage: lead.vehicleMileage,
  }
);
```

---

### Krok 3: fetchAS24() — přidat filtry (market-analysis.ts řádky 134-233)

**Řádky 134-138** — nová signatura:

```typescript
// PŘED:
async function fetchAS24(
  brand: string,
  model: string,
  year: number
): Promise<PricePoint[]> {

// PO:
async function fetchAS24(
  brand: string,
  model: string,
  year: number,
  options: MatchOptions = {}
): Promise<PricePoint[]> {
```

**Řádky 143-145** — přepsat URL construction:

```typescript
// PŘED (řádky 143-145):
const yearSpread = year < 2010 ? 5 : 2;
const url = `https://${domain}/lst/${brandSlug}/${modelSlug}?fregfrom=${year - yearSpread}&fregto=${year + yearSpread}&custtype=P&sort=price&ustate=N%2CU&atype=C&size=50&page=1`;

// PO:
const url = new URL(`https://${domain}/lst/${brandSlug}/${modelSlug}`);
url.searchParams.set("fregfrom", String(year - 1));
url.searchParams.set("fregto", String(year + 1));
url.searchParams.set("sort", "price");
url.searchParams.set("size", "50");
url.searchParams.set("page", "1");
url.searchParams.set("ustate", "N,U");
url.searchParams.set("atype", "C");

if (options.fuel) {
  const f = FUEL_TO_AS24[options.fuel];
  if (f) url.searchParams.set("fuel", f);
}
if (options.transmission) {
  const g = GEAR_TO_AS24[options.transmission];
  if (g) url.searchParams.set("gear", g);
}
if (options.mileage) {
  url.searchParams.set("kmfrom", String(Math.max(0, options.mileage - MILEAGE_RANGE)));
  url.searchParams.set("kmto", String(options.mileage + MILEAGE_RANGE));
}
```

**Řádek 147** — update fetch call:

```typescript
// PŘED:
const response = await fetchWithTimeout(url);
// PO:
const response = await fetchWithTimeout(url.toString());
```

---

### Krok 4: fetchSauto() — kompletní rewrite (market-analysis.ts řádky 237-290)

Nahradit celou funkci `fetchSauto()` (řádky 237-290):

```typescript
async function fetchSauto(
  brand: string,
  model: string,
  year: number,
  options: MatchOptions = {}
): Promise<PricePoint[]> {
  const brandSlug = brandToAS24Slug(brand);

  // Build URL with supported Sauto API filters
  // Ověřeno 2026-05-21: fuel_seo, gearbox_seo, tachometer_from/to fungují
  // Nefunguje: model filter, year filter → post-filter
  const url = new URL("https://www.sauto.cz/api/v1/items/search");
  url.searchParams.set("manufacturer_model_seo", brandSlug);
  url.searchParams.set("category_id", "838");
  url.searchParams.set("condition_seo", "ojete");
  url.searchParams.set("limit", "100");
  url.searchParams.set("offset", "0");

  if (options.fuel) {
    const f = FUEL_TO_SAUTO[options.fuel];
    if (f) url.searchParams.set("fuel_seo", f);
  }
  if (options.transmission) {
    const g = GEAR_TO_SAUTO[options.transmission];
    if (g) url.searchParams.set("gearbox_seo", g);
  }
  if (options.mileage) {
    url.searchParams.set("tachometer_from", String(Math.max(0, options.mileage - MILEAGE_RANGE)));
    url.searchParams.set("tachometer_to", String(options.mileage + MILEAGE_RANGE));
  }

  const response = await fetchWithTimeout(url.toString(), {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!response.ok) return [];

  const data = await response.json();
  const items: Array<{
    id?: number;
    price?: number;
    tachometer?: number;
    in_operation_date?: string;
    manufacturing_date?: string;
    name?: string;
    model_cb?: { name?: string; seo_name?: string };
  }> = data?.items || data?.results || [];

  const prices: PricePoint[] = [];
  const modelLower = model.toLowerCase();

  for (const item of items) {
    // Post-filter by model (API doesn't support model filter)
    const itemName = (item.name || "").toLowerCase();
    const itemModel = (item.model_cb?.name || "").toLowerCase();
    if (modelLower && !itemName.includes(modelLower) && !itemModel.includes(modelLower)) continue;

    // Parse year from in_operation_date ("2014-06-01") or manufacturing_date ("2013")
    const dateStr = item.in_operation_date || item.manufacturing_date || "";
    const yearMatch = dateStr.match(/(19[89]\d|20[0-3]\d)/);
    const itemYear = yearMatch ? parseInt(yearMatch[1], 10) : null;

    // Post-filter by year ±1 (API doesn't support year filter)
    if (itemYear && (itemYear < year - 1 || itemYear > year + 1)) continue;

    const price = item.price;
    if (!price || price <= 0) continue;

    prices.push({
      price,
      year: itemYear,
      mileage: item.tachometer || null,
      source: "SAUTO",
      url: item.id ? `https://www.sauto.cz/osobni/detail/${item.id}` : null,
      title: item.name || null,
    });
  }

  return prices;
}
```

**Kritické opravy v tomto kroku:**
1. `item.year` → parsováno z `item.in_operation_date` / `item.manufacturing_date`
2. `item.mileage` → `item.tachometer`
3. `item.seo_url` → `item.id` (URL se skládá jako `/osobni/detail/{id}`)
4. Year spread `±2-5` → `±1`
5. API filtry: `fuel_seo`, `gearbox_seo`, `tachometer_from/to`
6. Model post-filter: doplněn `item.model_cb?.name` jako alternativa k `item.name`

---

### Krok 5: fetchMobileDe() — přidat filtry (market-analysis.ts řádky 294-345)

**Řádky 294-298** — nová signatura:

```typescript
// PŘED:
async function fetchMobileDe(
  brand: string,
  model: string,
  year: number
): Promise<PricePoint[]> {

// PO:
async function fetchMobileDe(
  brand: string,
  model: string,
  year: number,
  options: MatchOptions = {}
): Promise<PricePoint[]> {
```

**Řádky 302-303** — přepsat URL construction:

```typescript
// PŘED (řádky 302-303):
const mobileYearSpread = year < 2010 ? 5 : 2;
const url = `https://services.mobile.de/search-api/search?classification=refdata/classes/Car/makes/${brandUpper}/models/${modelUpper}&firstRegistrationDate.min=${year - mobileYearSpread}-01&firstRegistrationDate.max=${year + mobileYearSpread}-12&sellerType=FOR_SALE_BY_OWNER&price.min=1000&page.size=50`;

// PO:
const url = new URL("https://services.mobile.de/search-api/search");
url.searchParams.set("classification", `refdata/classes/Car/makes/${brandUpper}/models/${modelUpper}`);
url.searchParams.set("firstRegistrationDate.min", `${year - 1}-01`);
url.searchParams.set("firstRegistrationDate.max", `${year + 1}-12`);
url.searchParams.set("sellerType", "FOR_SALE_BY_OWNER");
url.searchParams.set("price.min", "1000");
url.searchParams.set("page.size", "50");

if (options.fuel) {
  // Mobile.de fuel values: DIESEL, PETROL, HYBRID, ELECTRIC, LPG, CNG (same as our enum)
  url.searchParams.set("fuel", options.fuel);
}
if (options.transmission) {
  // Mobile.de: AUTOMATIC, MANUAL_GEAR (not "MANUAL")
  const gearMap: Record<string, string> = { AUTOMATIC: "AUTOMATIC", MANUAL: "MANUAL_GEAR" };
  const g = gearMap[options.transmission];
  if (g) url.searchParams.set("transmission", g);
}
if (options.mileage) {
  url.searchParams.set("mileage.min", String(Math.max(0, options.mileage - MILEAGE_RANGE)));
  url.searchParams.set("mileage.max", String(options.mileage + MILEAGE_RANGE));
}
```

**Řádek 305** — update fetch call:

```typescript
// PŘED:
const response = await fetchWithTimeout(url, {
// PO:
const response = await fetchWithTimeout(url.toString(), {
```

**STOP-2 poznámka:** Mobile.de `transmission` param může být `MANUAL_GEAR` místo `MANUAL`. Pokud API vrací 0 výsledků s `MANUAL_GEAR`, zkusit `MANUAL`. Implementátor ověří v runtime.

---

### Krok 6: fetchDBFallback() — smart matching (market-analysis.ts řádky 460-493)

**Řádky 460-464** — nová signatura:

```typescript
// PŘED:
async function fetchDBFallback(
  leadId: string,
  brand: string,
  model: string,
  year: number
): Promise<PricePoint[]> {

// PO:
async function fetchDBFallback(
  leadId: string,
  brand: string,
  model: string,
  year: number,
  options: MatchOptions = {}
): Promise<PricePoint[]> {
```

**Řádky 466-473** — rozšířit where clause:

```typescript
// PŘED (řádky 466-473):
const dbSimilar = await prisma.scoutLead.findMany({
  where: {
    vehicleBrand: brand,
    vehicleModel: model,
    vehicleYear: { gte: year - (year < 2010 ? 5 : 2), lte: year + (year < 2010 ? 5 : 2) },
    vehiclePrice: { not: null, gt: 0 },
    id: { not: leadId },
  },
  // ...

// PO:
const where: Record<string, unknown> = {
  vehicleBrand: brand,
  vehicleModel: model,
  vehicleYear: { gte: year - 1, lte: year + 1 },
  vehiclePrice: { not: null, gt: 0 },
  id: { not: leadId },
};
if (options.fuel) where.vehicleFuel = options.fuel;
if (options.transmission) where.vehicleTransmission = options.transmission;
if (options.mileage) {
  where.vehicleMileage = {
    gte: Math.max(0, options.mileage - MILEAGE_RANGE),
    lte: options.mileage + MILEAGE_RANGE,
  };
}
const dbSimilar = await prisma.scoutLead.findMany({
  where,
  // ...rest unchanged
```

---

### Krok 7: computeAnalysis() — balanced similar offers (market-analysis.ts řádky 432-442)

**Řádky 432-442** — přepsat výběr similar offers:

```typescript
// PŘED (řádky 432-442):
// Top 5 similar offers (closest by price, from filtered set)
const filteredPrices = prices.filter(
  (p) => p.price >= lowerBound && p.price <= upperBound
);
const similarOffers = (filteredPrices.length >= 3 ? filteredPrices : prices)
  .filter((p) => p.price > 0)
  .sort(
    (a, b) =>
      Math.abs(a.price - leadPrice) - Math.abs(b.price - leadPrice)
  )
  .slice(0, 5);

// PO:
// Top 5 similar offers — balanced: mix of cheaper and more expensive
const filteredPrices = prices.filter(
  (p) => p.price >= lowerBound && p.price <= upperBound
);
const pool = (filteredPrices.length >= 3 ? filteredPrices : prices)
  .filter((p) => p.price > 0)
  .sort((a, b) => a.price - b.price);

const below = pool.filter((p) => p.price < leadPrice);
const above = pool.filter((p) => p.price >= leadPrice);

let similarOffers: PricePoint[];
if (below.length >= 2 && above.length >= 3) {
  // Standard: 2 cheaper + 3 at/above
  similarOffers = [...below.slice(-2), ...above.slice(0, 3)];
} else if (below.length >= 3 && above.length >= 2) {
  // More cheap offers available: 3 cheaper + 2 above
  similarOffers = [...below.slice(-3), ...above.slice(0, 2)];
} else {
  // Fallback: closest by price
  similarOffers = [...pool]
    .sort((a, b) => Math.abs(a.price - leadPrice) - Math.abs(b.price - leadPrice))
    .slice(0, 5);
}
```

---

### Krok 8: fetchMarketData() — pass options + fallback cascade (market-analysis.ts řádky 497-555)

**Řádky 497-503** — nová signatura:

```typescript
// PŘED:
export async function fetchMarketData(
  leadId: string,
  brand: string,
  model: string,
  year: number,
  leadPrice: number
): Promise<MarketAnalysisResult> {

// PO:
export async function fetchMarketData(
  leadId: string,
  brand: string,
  model: string,
  year: number,
  leadPrice: number,
  options: MatchOptions = {}
): Promise<MarketAnalysisResult> {
```

**Řádek 504** — cache key zahrnuje fuel+transmission:

```typescript
// PŘED:
const cacheKey = `market:${brand.toLowerCase()}:${model.toLowerCase()}:${year}`;

// PO:
const fuel = options.fuel?.toLowerCase() || "any";
const trans = options.transmission?.toLowerCase() || "any";
const cacheKey = `market:${brand.toLowerCase()}:${model.toLowerCase()}:${year}:${fuel}:${trans}`;
```

**Řádky 521-524** — pass options to fetchers:

```typescript
// PŘED:
const [as24, sauto, mobile] = await Promise.allSettled([
  fetchAS24(brand, model, year),
  fetchSauto(brand, model, year),
  fetchMobileDe(brand, model, year),
]);

// PO:
const [as24, sauto, mobile] = await Promise.allSettled([
  fetchAS24(brand, model, year, options),
  fetchSauto(brand, model, year, options),
  fetchMobileDe(brand, model, year, options),
]);
```

**Řádek 534** — pass options to DB fallback:

```typescript
// PŘED:
const dbPrices = await fetchDBFallback(leadId, brand, model, year);

// PO:
const dbPrices = await fetchDBFallback(leadId, brand, model, year, options);
```

**Po řádku 539 — přidat fallback cascade** (pokud strict matching vrátí málo):

```typescript
// Fallback cascade: progressively relax filters if too few results
if (allPrices.length < 5 && (options.fuel || options.transmission || options.mileage)) {
  // Level 2: Drop mileage filter, keep fuel + transmission + year ±1
  if (options.mileage) {
    const relaxed = { fuel: options.fuel, transmission: options.transmission };
    const [as24R, sautoR, mobileR] = await Promise.allSettled([
      fetchAS24(brand, model, year, relaxed),
      fetchSauto(brand, model, year, relaxed),
      fetchMobileDe(brand, model, year, relaxed),
    ]);
    const relaxedPrices = [as24R, sautoR, mobileR]
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as PromiseFulfilledResult<PricePoint[]>).value);

    // Merge without duplicates (by URL)
    const existingUrls = new Set(allPrices.map((p) => p.url).filter(Boolean));
    for (const p of relaxedPrices) {
      if (!p.url || !existingUrls.has(p.url)) {
        allPrices.push(p);
        if (p.url) existingUrls.add(p.url);
      }
    }
  }
}

if (allPrices.length < 5 && (options.fuel || options.transmission)) {
  // Level 3: Drop mileage + transmission, keep fuel + year ±2
  const relaxed2 = { fuel: options.fuel };
  const [as24R2, sautoR2, mobileR2] = await Promise.allSettled([
    fetchAS24(brand, model, year, relaxed2),
    fetchSauto(brand, model, year, relaxed2),
    fetchMobileDe(brand, model, year, relaxed2),
  ]);
  const relaxedPrices2 = [as24R2, sautoR2, mobileR2]
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => (r as PromiseFulfilledResult<PricePoint[]>).value);

  const existingUrls2 = new Set(allPrices.map((p) => p.url).filter(Boolean));
  for (const p of relaxedPrices2) {
    if (!p.url || !existingUrls2.has(p.url)) {
      allPrices.push(p);
      if (p.url) existingUrls2.add(p.url);
    }
  }
}
```

**POZOR:** Fallback dělá extra API cally → zpomalí response. Max 2 retry úrovně. Pokud response time je problém, přidat do meta `matchLevel: "strict" | "relaxed_km" | "relaxed_trans"` aby UI mohlo informovat.

---

### Krok 9: Meta info — matchLevel v response (market-analysis.ts + route.ts)

Rozšířit `MarketAnalysisResult` interface (řádek 48-58):

```typescript
export interface MarketAnalysisResult {
  // ...existing fields...
  matchLevel: "strict" | "relaxed_km" | "relaxed_trans" | "broad"; // ← NEW
}
```

V `fetchMarketData()` po fallback cascade, nastavit matchLevel:

```typescript
let matchLevel: MarketAnalysisResult["matchLevel"] = "strict";
// Set after first fetch:
if (allPrices.length < 5 && /* used level 2 */) matchLevel = "relaxed_km";
if (allPrices.length < 5 && /* used level 3 */) matchLevel = "relaxed_trans";
if (allPrices.length < 5 && /* DB only */) matchLevel = "broad";
```

V `route.ts` response přidat:

```typescript
meta: {
  fromCache: result.fromCache,
  fetchedAt: result.fetchedAt,
  dbFallback: result.dbFallback,
  matchLevel: result.matchLevel,  // ← NEW
},
```

---

## 4. Kompletní diff — řádek po řádku

| Oblast | Řádky PŘED | Co se mění |
|--------|-----------|------------|
| `MatchOptions` interface | (nové, za ř. 58) | +10 řádků |
| Mapping konstanty | (nové, za ř. 67) | +15 řádků |
| `fetchAS24()` signatura | 134-138 | +1 param |
| `fetchAS24()` URL | 143-145 | REWRITE → URL object + filtry (+15 ř.) |
| `fetchAS24()` fetch | 147 | `.toString()` |
| `fetchSauto()` | 237-290 | **KOMPLETNÍ REWRITE** (~80 ř.) |
| `fetchMobileDe()` signatura | 294-298 | +1 param |
| `fetchMobileDe()` URL | 302-303 | REWRITE → URL object + filtry (+12 ř.) |
| `fetchMobileDe()` fetch | 305 | `.toString()` |
| `computeAnalysis()` similar | 432-442 | REWRITE → balanced selection (+15 ř.) |
| `fetchDBFallback()` signatura | 460-464 | +1 param |
| `fetchDBFallback()` where | 466-473 | +8 řádků (fuel/trans/km) |
| `fetchMarketData()` signatura | 497-503 | +1 param |
| `fetchMarketData()` cache key | 504 | +fuel+trans |
| `fetchMarketData()` fetcher calls | 521-524 | pass `options` |
| `fetchMarketData()` DB fallback | 534 | pass `options` |
| `fetchMarketData()` fallback cascade | (nové, za ř. 539) | +30 řádků |
| Route select | route.ts:27-34 | +2 pole |
| Route fetch call | route.ts:60-66 | +options param |

**Celkem:** ~180 řádků změn/přidání, 2 soubory.

---

## 5. Field mapping reference — kompletní

### Sauto API → PricePoint mapping (aktuální vs. opravený)

| Sauto API field | Aktuální kód čte | Opraveno na |
|----------------|-------------------|-------------|
| `tachometer` (number) | `item.mileage` ❌ | `item.tachometer` ✅ |
| `in_operation_date` (string) | `item.year` ❌ | parsovaný rok z `item.in_operation_date` ✅ |
| `manufacturing_date` (string) | — | fallback pro rok ✅ |
| `id` (number) | — | URL: `/osobni/detail/${item.id}` ✅ |
| `model_cb.name` (string) | — | doplňkový model post-filter ✅ |
| `seo_url` | `item.seo_url` ❌ (neexistuje) | odstraněno |

### Sauto API filtry (ověřené 2026-05-21)

| Filtr | Param | Hodnota | Status |
|-------|-------|---------|--------|
| Palivo | `fuel_seo` | `nafta`, `benzin`, `hybrid`, `elektro`, `lpg`, `cng` | ✅ |
| Převodovka | `gearbox_seo` | `automaticka`, `manualni` | ✅ |
| Nájezd od | `tachometer_from` | number (km) | ✅ |
| Nájezd do | `tachometer_to` | number (km) | ✅ |
| Model | `model_seo` | — | ❌ unsupported |
| Rok od | `in_operation_from` | — | ❌ unsupported |
| Rok do | `in_operation_to` | — | ❌ unsupported |

### AS24 URL filtry

| Filtr | Param | Hodnota |
|-------|-------|---------|
| Rok od | `fregfrom` | year - 1 |
| Rok do | `fregto` | year + 1 |
| Palivo | `fuel` | `D`, `B`, `2`, `E`, `L`, `C` |
| Převodovka | `gear` | `A`, `M` |
| Nájezd od | `kmfrom` | mileage - 40000 |
| Nájezd do | `kmto` | mileage + 40000 |

### Mobile.de URL filtry

| Filtr | Param | Hodnota |
|-------|-------|---------|
| Rok | `firstRegistrationDate.min/max` | `{year-1}-01` / `{year+1}-12` |
| Palivo | `fuel` | `DIESEL`, `PETROL`, `HYBRID`, `ELECTRIC` |
| Převodovka | `transmission` | `AUTOMATIC`, `MANUAL_GEAR` |
| Nájezd | `mileage.min/max` | mileage ± 40000 |

---

## 6. STOP pravidla

- **STOP-1:** AS24 `fuel=D` nebo `gear=A` vrací 0 výsledků → ověřit v browseru. Pokud param nefunguje, post-filtrovat z `__NEXT_DATA__` (vehicle.fuel, vehicle.transmission). AS24 listing data MÁ tyto pole (viz type na řádku 159-170).
- **STOP-2:** Mobile.de `transmission=MANUAL_GEAR` nefunguje → zkusit `MANUAL`. Pokud nic, odebrat filter.
- **STOP-3:** Sauto `tachometer_from/to` vrací HTTP 422 → odebrat z URL, přejít na post-filter.
- **STOP-4:** Fallback cascade dělá max 6 extra API callů (3 zdroje × 2 úrovně). Pokud response time > 15s → omezit na 1 úroveň fallbacku nebo paralelizovat s prvním fetchem.
- **STOP-5:** Pokud lead nemá `vehicleFuel` (NULL) → NEPŘEDÁVAT do API (jinak filtrujeme na nic). `MatchOptions` pole s hodnotou `null` musí být ignorovány, NE předány jako API param.
- **STOP-6:** Year ±1 u `fetchSauto()` post-filtru: pokud `itemYear` je `null` (inzerát nemá datum) → PUSTIT ho dál (nezahazovat). Jen filtrovat ty s konkrétním rokem mimo range. Aktuální kód: `if (itemYear && ...)` — toto je správně, `null` projde.

---

## 7. Testovací scénáře

### Scénář 1: Kia Sportage 1.7 CRDi automat 2017, 124k km
- **Očekávání:** 15-30 nabídek, pásmo 200-400k, verdikt OK
- **Filtry:** fuel=DIESEL, trans=AUTOMATIC, km=84k-164k, year=2016-2018

### Scénář 2: Škoda Octavia 2.0 TDI manuál 2019, 90k km
- **Očekávání:** 20-50 nabídek (populární auto), pásmo 300-550k
- **Filtry:** fuel=DIESEL, trans=MANUAL, km=50k-130k, year=2018-2020

### Scénář 3: BMW 320d automat 2015, 180k km
- **Očekávání:** 10-20 nabídek, verdikt přesný
- **Filtry:** fuel=DIESEL, trans=AUTOMATIC, km=140k-220k, year=2014-2016

### Scénář 4: Lead BEZ fuel/transmission (NULL)
- **Očekávání:** Broad match (jako dnes minus bug fixes), bez fuel/gear filtrů
- **Filtry:** jen year ±1 + mileage ±40k

### Scénář 5: Vzácné auto (< 5 výsledků strict)
- **Očekávání:** Fallback cascade → relaxed → stále přesný verdikt
- **Match level:** `relaxed_km` nebo `relaxed_trans`

---

## 8. Acceptance Criteria

- [ ] Sauto items mají správný rok (z `in_operation_date` / `manufacturing_date`) — ne "—"
- [ ] Sauto items mají správný nájezd (z `tachometer`) — ne "—"
- [ ] Sauto items mají funkční URL (z `id` → `/osobni/detail/{id}`)
- [ ] AS24 URL obsahuje `fuel`, `gear`, `kmfrom`, `kmto` params (pokud lead má data)
- [ ] Sauto URL obsahuje `fuel_seo`, `gearbox_seo`, `tachometer_from/to`
- [ ] Rok: ±1 u VŠECH zdrojů (ne ±2, ne ±5)
- [ ] Palivo: PŘESNÁ shoda (ne-null lead.vehicleFuel → exact filter)
- [ ] Převodovka: PŘESNÁ shoda
- [ ] Nájezd: ±40k km range
- [ ] Cenové pásmo pro Kia Sportage 1.7 CRDi 2017 124k = ~200k–400k (ne 30k–559k)
- [ ] Verdikt pro správně oceněný vůz = "OK" (ne "29% nad trhem")
- [ ] Similar offers obsahují mix levnějších i dražších (ne jen jednu stranu)
- [ ] Similar offers zobrazují rok a km (ne "—")
- [ ] Pokud lead nemá fuel/transmission (NULL) → filtry se přeskočí (graceful)
- [ ] Fallback cascade: < 5 výsledků → rozvolnit filtry (drop km → drop trans)
- [ ] Cache key zahrnuje fuel+transmission (jiný cache per fuel/trans combo)
- [ ] DB fallback respektuje smart matching (fuel, trans, mileage range v WHERE)
- [ ] Response meta zahrnuje `matchLevel`
