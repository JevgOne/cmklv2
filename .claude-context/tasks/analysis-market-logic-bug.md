# Analysis + Plan: Market Analysis Smart Matching

**Datum:** 2026-05-21
**Typ:** Bug analysis + implementation plan
**Status:** PLAN READY
**Závažnost:** CRITICAL — zkresluje cenový verdikt u VŠECH leadů

---

## 1. Pozorované symptomy (Kia Sportage 1.7 CRDI automat, 124k km)

| Pole | Hodnota | Problém? |
|------|---------|----------|
| Medián | 221 850 Kč | ⚠️ Příliš nízký (mix generací) |
| Průměr | 258 738 Kč | ⚠️ Příliš nízký |
| Cenové pásmo | 30k–559k Kč | ❌ Absurdní rozptyl |
| Porovnáno | 85 vozů (AS24: 50, Sauto: 38) | ⚠️ Nefiltrováno |
| Verdikt | 29% NAD trhem | ❌ Mylný |
| Podobné nabídky rok/km | "—" | ❌ Chybí data |
| Podobné ceny | 310–330k (všechny VYŠŠÍ) | ⚠️ Zavádějící výběr |

---

## 2. Root Cause Analysis — 5 bugů

### BUG 1 (CRITICAL): Sauto API field mapping — `year` a `mileage` neexistují

**Soubor:** `lib/market-analysis.ts:254-261`

```typescript
// AKTUÁLNÍ KÓD — špatné názvy polí:
const items: Array<{
  price?: number;
  year?: number;      // ← NEEXISTUJE v Sauto API!
  mileage?: number;   // ← NEEXISTUJE v Sauto API!
  name?: string;
  seo_url?: string;   // ← NEEXISTUJE v search API!
}> = data?.items || data?.results || [];
```

**Skutečná Sauto API odpověď (ověřeno live fetch 2026-05-21):**
```json
{
  "id": 209427339,
  "price": 285000,
  "tachometer": 145000,
  "in_operation_date": "2014-06-01",
  "manufacturing_date": "2013",
  "name": "Kia Sportage 1.7 CRDi",
  "fuel_cb": { "name": "Nafta", "seo_name": "nafta", "value": 2 },
  "gearbox_cb": { "name": "Automatická", "seo_name": "automaticka", "value": 3 },
  "model_cb": { "name": "Sportage", "seo_name": "sportage" },
  "manufacturer_cb": { "name": "Kia", "seo_name": "kia" }
}
```

**Důsledky:**
- `item.year` → `undefined` → year filter NIKDY nezafiltruje Sauto items → mix VŠECH generací
- `item.mileage` → `undefined` → similar offers zobrazí "—" pro km
- `item.seo_url` → `undefined` → URL odkaz na inzerát nefunguje

### BUG 2 (CRITICAL): No smart matching — porovnává VŠECHNY vozy stejného modelu

**Soubor:** `lib/market-analysis.ts:60-65` (route) + celá `fetchMarketData()`

Aktuální matching: jen `brand + model + year ±2` (a to jen u AS24 — viz BUG 1)
Chybí: **palivo, převodovka, nájezd**

Kia Sportage 1.7 CRDi automat 124k km se porovnává s:
- Sportage 1.6 GDi benzín manuál 30k km (nové auto = 450k+)
- Sportage 2.0 CRDi diesel 200k km (ojetina = 150k)
- Sportage 2004 = 30k → stahuje medián dolů

### BUG 3 (HIGH): Sauto API hledá jen podle značky, ne modelu

**Soubor:** `lib/market-analysis.ts:243`

`manufacturer_model_seo=kia` vrátí VŠECHNY Kia modely → `limit=100` → post-filter jen ~20% Sportage.

**Ověřeno:** Sauto API NEPODPORUJE model-level filter (tested: `model_seo`, `model_cb`, `manufacturer_model_seo=kia/sportage` → všechny unsupported/nefunkční).

### BUG 4 (HIGH): Route nepředává fuel/transmission/mileage do fetchMarketData()

**Soubor:** `app/api/scout-leads/[id]/market-analysis/route.ts:24-35`

```typescript
// Aktuální select — CHYBÍ fuel, transmission, mileage
select: {
  id: true,
  vehicleBrand: true,
  vehicleModel: true,
  vehicleYear: true,
  vehiclePrice: true,
  vehicleMileage: true,    // ← fetchuje se ale NEPŘEDÁVÁ do fetchMarketData()
  // CHYBÍ: vehicleFuel, vehicleTransmission
},
```

Signatura `fetchMarketData(leadId, brand, model, year, leadPrice)` nepřijímá fuel/transmission/mileage.

### BUG 5 (MEDIUM): Výběr similar offers je zavádějící

Sort by `Math.abs(price - leadPrice)` → může vybrat 5 nabídek VŠECHNY dražší.

---

## 3. Sauto API — ověřené filtry (live testing 2026-05-21)

| Parametr | Příklad | Status |
|----------|---------|--------|
| `manufacturer_model_seo` | `=kia` | ✅ Funguje (jen brand) |
| `fuel_seo` | `=nafta` | ✅ **Funguje** |
| `gearbox_seo` | `=automaticka` | ✅ **Funguje** |
| `tachometer_from` / `tachometer_to` | `=80000` / `=170000` | ✅ **Funguje** |
| `model_seo` | `=sportage` | ❌ `unsupported_filters` |
| `model_cb` | `=sportage` | ❌ `unsupported_filters` |
| `manufacturer_model_seo` | `=kia/sportage` | ❌ Vrací random výsledky |
| `in_operation_from` / `in_operation_to` | `=2015` / `=2018` | ❌ `unsupported_filters` |
| `year_from` / `year_to` | | ❌ `unsupported_filters` |
| `age_from` / `age_to` | | ❌ `unsupported_filters` |

**Závěr Sauto:** Rok NELZE filtrovat přes API → musí se post-filtrovat z `in_operation_date`. Ale fuel, gearbox a tachometer range JDOU filtrovat → výrazně lepší vzorek.

### AS24 — známé URL filtry (z kódu + dokumentace)

| Parametr | Příklad | Status |
|----------|---------|--------|
| `fregfrom` / `fregto` | `=2016` / `=2018` | ✅ Rok |
| `kmfrom` / `kmto` | `=80000` / `=170000` | ✅ Nájezd range |
| `fuel` | `=D` (diesel), `=B` (benzín) | ✅ Palivo |
| `gear` | `=A` (automat), `=M` (manuál) | ✅ Převodovka |

---

## 4. Fuel/Gearbox mapping — hodnoty pro API

### Sauto `fuel_seo` (z fuel_cb.seo_name):
| ScoutLead.vehicleFuel | Sauto fuel_seo |
|----------------------|----------------|
| DIESEL | `nafta` |
| PETROL | `benzin` |
| HYBRID | `hybrid` |
| ELECTRIC | `elektro` |
| LPG | `lpg` |
| CNG | `cng` |

### Sauto `gearbox_seo` (z gearbox_cb.seo_name):
| ScoutLead.vehicleTransmission | Sauto gearbox_seo |
|------------------------------|-------------------|
| AUTOMATIC | `automaticka` |
| MANUAL | `manualni` |

### AS24 `fuel`:
| ScoutLead.vehicleFuel | AS24 fuel |
|----------------------|-----------|
| DIESEL | `D` |
| PETROL | `B` |
| HYBRID | `2` (hybrid) |
| ELECTRIC | `E` |
| LPG | `L` |
| CNG | `C` |

### AS24 `gear`:
| ScoutLead.vehicleTransmission | AS24 gear |
|------------------------------|-----------|
| AUTOMATIC | `A` |
| MANUAL | `M` |

---

## 5. Implementační plán — Smart Matching

### Pravidla matchingu (od uživatele):
- **Rok:** ±1 rok (PŘÍSNĚ)
- **Palivo:** PŘESNÁ shoda (diesel = diesel)
- **Převodovka:** PŘESNÁ shoda (automat = automat)
- **Nájezd:** ±40k km rozsah
- Model: přesná shoda (post-filter kde API nepodporuje)

---

### Krok 1: Route — předat fuel/transmission/mileage [IMPL]

**Soubor:** `app/api/scout-leads/[id]/market-analysis/route.ts`

```typescript
// Rozšířit select
select: {
  id: true, category: true,
  vehicleBrand: true, vehicleModel: true, vehicleYear: true,
  vehiclePrice: true, vehicleMileage: true,
  vehicleFuel: true,          // ← NEW
  vehicleTransmission: true,   // ← NEW
  assignedToId: true,
},

// Předat do fetchMarketData
const result = await fetchMarketData(
  lead.id,
  lead.vehicleBrand,
  lead.vehicleModel,
  year,
  leadPrice,
  {                            // ← NEW options object
    fuel: lead.vehicleFuel,
    transmission: lead.vehicleTransmission,
    mileage: lead.vehicleMileage,
  }
);
```

---

### Krok 2: fetchMarketData() — rozšířit signaturu [IMPL]

**Soubor:** `lib/market-analysis.ts`

```typescript
interface MarketMatchOptions {
  fuel?: string | null;         // "DIESEL", "PETROL", ...
  transmission?: string | null; // "AUTOMATIC", "MANUAL"
  mileage?: number | null;      // km
}

export async function fetchMarketData(
  leadId: string,
  brand: string,
  model: string,
  year: number,
  leadPrice: number,
  options: MarketMatchOptions = {}    // ← NEW
): Promise<MarketAnalysisResult> {
  // Cache key includes fuel+transmission for precision
  const fuelKey = options.fuel?.toLowerCase() || "any";
  const transKey = options.transmission?.toLowerCase() || "any";
  const cacheKey = `market:${brand.toLowerCase()}:${model.toLowerCase()}:${year}:${fuelKey}:${transKey}`;
  
  // Pass options to fetchers
  const [as24, sauto, mobile] = await Promise.allSettled([
    fetchAS24(brand, model, year, options),
    fetchSauto(brand, model, year, options),
    fetchMobileDe(brand, model, year, options),
  ]);
  // ...rest unchanged
}
```

---

### Krok 3: fetchAS24() — přidat fuel/gear/km filtry [IMPL]

**Soubor:** `lib/market-analysis.ts`, funkce `fetchAS24()`

```typescript
async function fetchAS24(
  brand: string, model: string, year: number, 
  options: MarketMatchOptions = {}
): Promise<PricePoint[]> {
  // ...existing brand/model slug logic...
  
  // Year: ±1 (strict)
  const url = new URL(`https://${domain}/lst/${brandSlug}/${modelSlug}`);
  url.searchParams.set("fregfrom", String(year - 1));
  url.searchParams.set("fregto", String(year + 1));
  url.searchParams.set("sort", "price");
  url.searchParams.set("size", "50");
  url.searchParams.set("page", "1");
  url.searchParams.set("ustate", "N,U");
  url.searchParams.set("atype", "C");
  
  // Fuel — exact match
  if (options.fuel) {
    const fuelMap: Record<string, string> = {
      DIESEL: "D", PETROL: "B", HYBRID: "2", ELECTRIC: "E", LPG: "L", CNG: "C"
    };
    const f = fuelMap[options.fuel];
    if (f) url.searchParams.set("fuel", f);
  }
  
  // Transmission — exact match
  if (options.transmission) {
    const gearMap: Record<string, string> = { AUTOMATIC: "A", MANUAL: "M" };
    const g = gearMap[options.transmission];
    if (g) url.searchParams.set("gear", g);
  }
  
  // Mileage — ±40k range
  if (options.mileage) {
    url.searchParams.set("kmfrom", String(Math.max(0, options.mileage - 40000)));
    url.searchParams.set("kmto", String(options.mileage + 40000));
  }
  
  const response = await fetchWithTimeout(url.toString());
  // ...rest unchanged
}
```

**POZOR:** Year spread se mění z `year < 2010 ? 5 : 2` na **±1 vždy**.

---

### Krok 4: fetchSauto() — kompletní rewrite [IMPL]

**Soubor:** `lib/market-analysis.ts`, funkce `fetchSauto()`

```typescript
async function fetchSauto(
  brand: string, model: string, year: number,
  options: MarketMatchOptions = {}
): Promise<PricePoint[]> {
  const brandSlug = brandToAS24Slug(brand);
  
  // Build URL with SUPPORTED Sauto API filters
  const url = new URL("https://www.sauto.cz/api/v1/items/search");
  url.searchParams.set("manufacturer_model_seo", brandSlug);
  url.searchParams.set("category_id", "838");
  url.searchParams.set("condition_seo", "ojete");
  url.searchParams.set("limit", "100");
  url.searchParams.set("offset", "0");
  
  // Fuel — exact match (API supported)
  if (options.fuel) {
    const fuelMap: Record<string, string> = {
      DIESEL: "nafta", PETROL: "benzin", HYBRID: "hybrid",
      ELECTRIC: "elektro", LPG: "lpg", CNG: "cng"
    };
    const f = fuelMap[options.fuel];
    if (f) url.searchParams.set("fuel_seo", f);
  }
  
  // Transmission — exact match (API supported)
  if (options.transmission) {
    const gearMap: Record<string, string> = { AUTOMATIC: "automaticka", MANUAL: "manualni" };
    const g = gearMap[options.transmission];
    if (g) url.searchParams.set("gearbox_seo", g);
  }
  
  // Mileage — ±40k range (API supported)
  if (options.mileage) {
    url.searchParams.set("tachometer_from", String(Math.max(0, options.mileage - 40000)));
    url.searchParams.set("tachometer_to", String(options.mileage + 40000));
  }
  
  const response = await fetchWithTimeout(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!response.ok) return [];

  const data = await response.json();
  const items: Array<{
    id?: number;
    price?: number;
    tachometer?: number;              // ← FIXED (was "mileage")
    in_operation_date?: string;       // ← FIXED (was "year")
    manufacturing_date?: string;
    name?: string;
    model_cb?: { name?: string; seo_name?: string };
    fuel_cb?: { name?: string; seo_name?: string };
    gearbox_cb?: { name?: string; seo_name?: string };
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
      mileage: item.tachometer || null,    // ← FIXED
      source: "SAUTO",
      url: item.id ? `https://www.sauto.cz/osobni/detail/${item.id}` : null,  // ← FIXED
      title: item.name || null,
    });
  }
  
  return prices;
}
```

---

### Krok 5: fetchMobileDe() — přidat fuel/gear/km [IMPL]

**Soubor:** `lib/market-analysis.ts`, funkce `fetchMobileDe()`

```typescript
async function fetchMobileDe(
  brand: string, model: string, year: number,
  options: MarketMatchOptions = {}
): Promise<PricePoint[]> {
  // ...existing logic...
  
  // Year: ±1
  const url = new URL(`https://services.mobile.de/search-api/search`);
  url.searchParams.set("classification", `refdata/classes/Car/makes/${brandUpper}/models/${modelUpper}`);
  url.searchParams.set("firstRegistrationDate.min", `${year - 1}-01`);
  url.searchParams.set("firstRegistrationDate.max", `${year + 1}-12`);
  url.searchParams.set("price.min", "1000");
  url.searchParams.set("page.size", "50");
  
  // Fuel
  if (options.fuel) {
    const fuelMap: Record<string, string> = {
      DIESEL: "DIESEL", PETROL: "PETROL", HYBRID: "HYBRID",
      ELECTRIC: "ELECTRIC", LPG: "LPG", CNG: "CNG"
    };
    const f = fuelMap[options.fuel];
    if (f) url.searchParams.set("fuel", f);
  }
  
  // Transmission
  if (options.transmission) {
    const gearMap: Record<string, string> = { AUTOMATIC: "AUTOMATIC", MANUAL: "MANUAL" };
    const g = gearMap[options.transmission];
    if (g) url.searchParams.set("transmission", g);
  }
  
  // Mileage ±40k
  if (options.mileage) {
    url.searchParams.set("mileage.min", String(Math.max(0, options.mileage - 40000)));
    url.searchParams.set("mileage.max", String(options.mileage + 40000));
  }
  // ...rest unchanged
}
```

---

### Krok 6: fetchDBFallback() — smart matching i pro DB [IMPL]

**Soubor:** `lib/market-analysis.ts`, funkce `fetchDBFallback()`

```typescript
async function fetchDBFallback(
  leadId: string, brand: string, model: string, year: number,
  options: MarketMatchOptions = {}
): Promise<PricePoint[]> {
  const where: any = {
    vehicleBrand: brand,
    vehicleModel: model,
    vehicleYear: { gte: year - 1, lte: year + 1 },
    vehiclePrice: { not: null, gt: 0 },
    id: { not: leadId },
  };
  
  // Exact fuel match
  if (options.fuel) where.vehicleFuel = options.fuel;
  
  // Exact transmission match  
  if (options.transmission) where.vehicleTransmission = options.transmission;
  
  // Mileage ±40k
  if (options.mileage) {
    where.vehicleMileage = {
      gte: Math.max(0, options.mileage - 40000),
      lte: options.mileage + 40000,
    };
  }
  
  const dbSimilar = await prisma.scoutLead.findMany({
    where,
    select: {
      vehiclePrice: true, vehicleYear: true, vehicleMileage: true,
      sourceUrl: true, listingTitle: true, source: true,
    },
    take: 200,
  });
  // ...rest unchanged
}
```

---

### Krok 7: computeAnalysis() — lepší similar offers výběr [IMPL]

**Soubor:** `lib/market-analysis.ts`, funkce `computeAnalysis()`

```typescript
// PŘED: Sort by absolute price distance → all on one side
// PO: Balanced selection — 2 below + 3 above (or vice versa)

const sorted = (filteredPrices.length >= 3 ? filteredPrices : prices)
  .filter((p) => p.price > 0)
  .sort((a, b) => a.price - b.price);

const belowLead = sorted.filter(p => p.price < leadPrice);
const aboveLead = sorted.filter(p => p.price >= leadPrice);

let similarOffers: PricePoint[];
if (belowLead.length >= 2 && aboveLead.length >= 3) {
  similarOffers = [...belowLead.slice(-2), ...aboveLead.slice(0, 3)];
} else if (belowLead.length >= 3 && aboveLead.length >= 2) {
  similarOffers = [...belowLead.slice(-3), ...aboveLead.slice(0, 2)];
} else {
  // Fallback: closest by price (original logic)
  similarOffers = sorted
    .sort((a, b) => Math.abs(a.price - leadPrice) - Math.abs(b.price - leadPrice))
    .slice(0, 5);
}
```

---

### Krok 8: Fallback — pokud smart match vrátí málo výsledků [IMPL]

Pokud strict matching (±1 rok, exact fuel, exact transmission, ±40k km) vrátí < 5 výsledků, postupně rozvolnit:

```typescript
// In fetchMarketData() after initial fetch:
if (allPrices.length < 5) {
  // Retry without mileage filter (keep fuel + transmission + year)
  const [as24R, sautoR, mobileR] = await Promise.allSettled([
    fetchAS24(brand, model, year, { ...options, mileage: null }),
    fetchSauto(brand, model, year, { ...options, mileage: null }),
    fetchMobileDe(brand, model, year, { ...options, mileage: null }),
  ]);
  // Merge, deduplicate by URL
}

if (allPrices.length < 5) {
  // Retry with year ±2 (keep fuel + transmission)
  const [as24R2, sautoR2, mobileR2] = await Promise.allSettled([
    fetchAS24(brand, model, year + 1, { fuel: options.fuel, transmission: options.transmission }),
    // etc.
  ]);
}
```

**Pořadí rozvolňování:**
1. Strict: ±1 rok, exact fuel, exact trans, ±40k km
2. Drop km: ±1 rok, exact fuel, exact trans
3. Widen year: ±2 roky, exact fuel, exact trans
4. Drop trans: ±2 roky, exact fuel
5. Last resort: ±2 roky (no other filters) + DB fallback

**POZOR:** Verdikt musí uvádět jaká úroveň matchingu byla použita (meta info).

---

## 6. Soubory k úpravě

| Soubor | Typ změny | Řádky |
|--------|-----------|-------|
| `app/api/scout-leads/[id]/market-analysis/route.ts` | UPDATE (select + pass options) | ~10 |
| `lib/market-analysis.ts` → `fetchMarketData()` | UPDATE (signature + cache key + fallback) | ~30 |
| `lib/market-analysis.ts` → `fetchAS24()` | UPDATE (fuel/gear/km URL params) | ~20 |
| `lib/market-analysis.ts` → `fetchSauto()` | **REWRITE** (field mapping + API filters) | ~50 |
| `lib/market-analysis.ts` → `fetchMobileDe()` | UPDATE (fuel/gear/km params) | ~15 |
| `lib/market-analysis.ts` → `fetchDBFallback()` | UPDATE (smart where clause) | ~15 |
| `lib/market-analysis.ts` → `computeAnalysis()` | UPDATE (balanced similar offers) | ~15 |

**Celkem:** ~155 řádků změn, 2 soubory.

---

## 7. Dopad na ostatní zdroje

| Zdroj | Aktuální filtry | Nové filtry | Field mapping |
|-------|----------------|-------------|---------------|
| AutoScout24 | year ±2 | year ±1, fuel, gear, km ±40k | ✅ OK |
| Sauto | ŽÁDNÉ (broken) | fuel_seo, gearbox_seo, tachometer ±40k + post-filter year ±1 | ❌→✅ FIX |
| Mobile.de | year ±2 | year ±1, fuel, transmission, mileage ±40k | ⚠️ Ověřit params |
| DB fallback | brand+model+year ±2 | +fuel, +transmission, +mileage ±40k | ✅ Prisma where |

---

## 8. STOP pravidla

- **STOP-1:** AS24 `fuel=D` / `gear=A` params nefungují → ověřit na reálné stránce. Pokud ne, post-filtrovat z `__NEXT_DATA__` listingů (vehicle.fuel, vehicle.transmission)
- **STOP-2:** Mobile.de API params pro fuel/transmission mají jiný formát → ověřit nebo fallback na post-filter
- **STOP-3:** Sauto API `tachometer_from/to` nefunguje (ačkoli testing ukázal že ANO) → pokud 422 error, odebrat a post-filtrovat
- **STOP-4:** Fallback loop (krok 8) dělá max 3 extra API cally → pokud zpomaluje response, limitovat na 1 retry
- **STOP-5:** Pokud lead nemá `vehicleFuel` ani `vehicleTransmission` (NULL) → přeskočit tyto filtry, fungovat jako dnes (broad match)

---

## 9. Acceptance Criteria

- [ ] Sauto items mají správný `year` (z `in_operation_date` / `manufacturing_date`)
- [ ] Sauto items mají správný `mileage` (z `tachometer`)
- [ ] Sauto items mají funkční URL odkaz (z `id`)
- [ ] AS24 filtruje podle fuel, gear, km range
- [ ] Sauto filtruje přes API: fuel_seo, gearbox_seo, tachometer range
- [ ] Rok: ±1 u VŠECH zdrojů (ne ±2 nebo ±5)
- [ ] Palivo: PŘESNÁ shoda (diesel = diesel)
- [ ] Převodovka: PŘESNÁ shoda (automat = automat)
- [ ] Nájezd: ±40k km range
- [ ] Cenové pásmo pro Kia Sportage 1.7 CRDi 2014 124k = realistické (~200k–400k)
- [ ] Verdikt = OK nebo LOW (ne "29% nad trhem")
- [ ] Similar offers zobrazují rok a km (ne "—")
- [ ] Similar offers obsahují mix levnějších i dražších
- [ ] Pokud lead nemá fuel/transmission → broad match (graceful degradation)
- [ ] Fallback: pokud strict match < 5 výsledků → postupně rozvolňovat filtry
- [ ] DB fallback respektuje smart matching pravidla
- [ ] Response meta informuje jaká úroveň matchingu byla použita
