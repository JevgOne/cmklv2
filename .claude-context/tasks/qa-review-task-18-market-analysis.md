# QA Report: Task #18 — Market Analysis Smart Matching Fix
**Datum:** 2026-05-21
**Kontrolor:** kontrolor
**Commit:** 3992015 (Carmakler)
**Soubory:** `lib/market-analysis.ts`, `app/api/scout-leads/[id]/market-analysis/route.ts`

---

## VERDIKT: ✅ SCHVÁLENO

---

## Checklist dle zadání

### 1. Field mappings — Sauto API response

| Pole | Předchozí (broken) | Opraveno na | Status |
|------|--------------------|-------------|--------|
| Nájezd | ? | `item.tachometer` | ✅ |
| Rok uvedení | ? | `item.in_operation_date \|\| item.manufacturing_date` | ✅ |
| Model post-filter | ? | `item.model_cb?.name` + `item.name` | ✅ |
| URL | `seo_url` (broken) | `` `https://www.sauto.cz/osobni/detail/${item.id}` `` | ✅ |
| Cena | `item.price` | `item.price` (nezměněno) | ✅ |

TypeScript interface pro Sauto item (řádky 323–333) správně odráží všechna nová pole.

---

### 2. API URL parametry

**AutoScout24:**

| Filtr | Parametr | Příklady hodnot | Status |
|-------|----------|-----------------|--------|
| Rok | `fregfrom` / `fregto` | ±spread | ✅ |
| Palivo | `fuel` | D/B/2/E/L/C | ✅ |
| Převodovka | `gear` | A/M | ✅ |
| Nájezd | `kmfrom` / `kmto` | ±40k | ✅ |

**Sauto:**

| Filtr | Parametr | Příklady hodnot | Status |
|-------|----------|-----------------|--------|
| Palivo | `fuel_seo` | nafta/benzin/hybrid/elektro/lpg/cng | ✅ |
| Převodovka | `gearbox_seo` | automaticka/manualni | ✅ |
| Nájezd | `tachometer_from` / `tachometer_to` | ±40k | ✅ |
| Rok | post-filter (API nepodporuje) | ✅ |

Rok filtrace u Sauto probíhá správně post-fetch (řádky 349–351), API ho nepodporuje — logické řešení.

**Mobile.de:**

| Filtr | Parametr | Příklady hodnot | Status |
|-------|----------|-----------------|--------|
| Rok | `firstRegistrationDate.min` / `.max` | YYYY-01 / YYYY-12 | ✅ |
| Palivo | `fuel` | DIESEL/PETROL/HYBRID/ELECTRIC/LPG/CNG | ✅ |
| Převodovka | `transmission` | AUTOMATIC/MANUAL | ✅ |
| Nájezd | `mileage.min` / `mileage.max` | ±40k | ✅ |

---

### 3. Fallback cascade (5 úrovní)

```
1. strict    — ±1 rok, exact palivo, exact převodovka, ±40k km
2. no-mileage — ±1 rok, exact palivo, exact převodovka
3. year±2    — ±2 roky, exact palivo, exact převodovka
4. fuel-only  — ±2 roky, exact palivo
5. broad     — ±2 roky, bez filtrů
```

✅ 5 úrovní implementováno (řádky 661–667)
✅ Break na `allPrices.length >= 5` — šetří fetch requesty
✅ URL deduplication přes `seenUrls: Set<string>` — zamezí duplicitám při opakovaných fetch při cascade
✅ `matchLevel` tracking — ukazuje na které úrovni se našel dostatek výsledků

---

### 4. Balanced similar offers

```typescript
// 2 below + 3 above
if (belowLead.length >= 2 && aboveLead.length >= 3)
  similarOffers = [...belowLead.slice(-2), ...aboveLead.slice(0, 3)];

// 3 below + 2 above
else if (belowLead.length >= 3 && aboveLead.length >= 2)
  similarOffers = [...belowLead.slice(-3), ...aboveLead.slice(0, 2)];

// fallback: 5 nejbližší cenou
else
  similarOffers = sortedOffers.sort(|a.price - leadPrice|).slice(0, 5);
```

✅ Všechny 3 větve implementovány (řádky 552–561)
✅ `belowLead.slice(-2)` = 2 nejdražší pod cenou leadu — správně (ne nejlevnější)
✅ `aboveLead.slice(0, 3)` = 3 nejlevnější nad cenou leadu — správně

---

### 5. DB fallback

```typescript
if (allPrices.length < 10) {
  const dbPrices = await fetchDBFallback(leadId, brand, model, year, options);
  if (dbPrices.length > 0) {
    dbFallback = allPrices.length === 0;  // true pouze při čistém DB fallback
    allPrices.push(...dbPrices);
  }
}
```

✅ Spouští se při <10 výsledcích
✅ `dbFallback = true` pouze když `allPrices.length === 0` (žádná live data) — správná sémantika
✅ `fetchDBFallback` obsahuje filtry palivo/převodovka/nájezd (řádky 594–601)
✅ Prisma query excluduje samotný lead (`id: { not: leadId }`)
✅ `take: 200` — dostatečný limit

---

### 6. Route.ts — předávání nových polí

```typescript
// select — přidána nová pole
vehicleMileage: true,   // řádek 33
vehicleFuel: true,      // řádek 34 — NOVÉ
vehicleTransmission: true, // řádek 35 — NOVÉ
```

```typescript
// fetchMarketData volání
{
  fuel: lead.vehicleFuel,         // NOVÉ
  transmission: lead.vehicleTransmission,  // NOVÉ
  mileage: lead.vehicleMileage,
}
```

✅ Obě nová pole přidána do `select` i do `options`

---

### 7. Response meta — matchLevel

```typescript
meta: {
  fromCache: result.fromCache,
  fetchedAt: result.fetchedAt,
  dbFallback: result.dbFallback,
  matchLevel: result.matchLevel,  // NOVÉ
}
```

✅ `matchLevel` přidáno do response (řádek 98)
✅ `MarketAnalysisResult` interface obsahuje `matchLevel?: string` (řádek 58)
✅ Cache při HIT správně předává `matchLevel` (řádek 651)

---

## Drobné poznámky (non-blocking)

1. **Sauto `manufacturer_model_seo` param** — nastavuje se jen brand slug (např. `"volkswagen"`). API Sauto nepodporuje model filter, model se filtruje post-fetch — správné, ale parametr `manufacturer_model_seo` (vs `manufacturer_seo`) mohl by vyžadovat kombinovaný slug `brand-model`. Funguje v praxi (stávající chování), ale pokud dojde k prázdným výsledkům ze Sauto, doporučuji ověřit správné jméno parametru v Sauto API docs.

2. **AS24 `__NEXT_DATA__` regex** — `/{.+?}/` bez `s` (dotall) flagu nemusí parsovat víceřádkový JSON. Pre-existing issue, tento commit nemění. Pokud AS24 vrátí 0 výsledků, může být příčina zde.

3. **Cache key neobsahuje mileage** — záměrné (vyhnutí se explozi klíčů), ale stejná cache se sdílí pro leady se stejnou značkou/modelem/rokem/palivem/převodovkou bez ohledu na nájezd. Akceptovatelný trade-off.

---

## Závěr

Task #17 implementace je kompletní a správná. Všech 7 požadovaných bodů ověřeno:
field mappings ✅, API params ✅, 5-level fallback ✅, balanced offers ✅, DB fallback ✅, matchLevel ✅, route fields ✅.
