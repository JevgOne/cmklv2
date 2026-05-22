# QA Report: Cenový filtr 250k + Real-time Market Data

**Datum:** 2026-05-20  
**Kontrolor:** kontrolor (Task #4)  
**Scope:** Task #2 (cenový filtr ve scraperech) + Task #3 (real-time tržní data)  
**Závěr: ✅ SCHVÁLENO — 4 kosmetické bugy k opravě**

---

## Build & Lint

```
npm run build  → ✅ ČISTÝ (0 errors, 0 warnings v project kódu)
npm run lint   → ✅ 0 errors (703 warnings — všechny pre-existing v minified vendor files)
tsc --noEmit   → ✅ 0 errors v nových souborech (chyby jen v e2e testech, pre-existing)
```

---

## Task #2: Cenový filtr ≥ 250 000 Kč (lead-scout scrapers)

**Soubory:** `config.py`, `autoscout24.py`, `sauto.py`, `bazos.py`, `sbazar.py`

### AC checklist

| # | Kritérium | Stav | Poznámka |
|---|-----------|------|----------|
| AC-1 | Žádný lead s `vehicle_price < 250_000` CZK | ✅ | `if price is not None and price < MIN_PRICE_CZK: return None` — všechny 4 scrapery |
| AC-2 | Leady s `price is None` projdou filtrem | ✅ | Logika `if price is not None and ...` — None propadne |
| AC-3 | AS24 DE/AT URL obsahuje `&pricefrom=9500` | ✅ | `autoscout24.py:92` — `price_from = MIN_PRICE_EUR if country in (Country.DE, Country.AT)` |
| AC-4 | AS24 CZ URL obsahuje `&pricefrom=250000` | ✅ | `autoscout24.py:92` — `else MIN_PRICE_CZK` |
| AC-5 | Bazoš filtruje PŘED fetch_detail | ✅ | Filtr na `bazos.py:283`, `_fetch_detail()` na řádku 303 |
| AC-6 | Sbazar filtruje PŘED fetch_phone | ✅ | Filtr v `_parse_card:188`, `_fetch_phone` volána v `scrape()` po `_extract_listings()` |
| AC-7 | Bazoš SK: EUR→CZK konverze správná | ✅ | `_parse_price()` + `EUR_TO_CZK_RATE = 25.5`. 8000 EUR = 204 000 CZK < 250 000 → vyfiltrováno |
| AC-8 | Konstanty `MIN_PRICE_CZK` a `MIN_PRICE_EUR` v config.py | ✅ | `config.py:12-13` jako module-level konstanty |

**Hodnocení Task #2: 8/8 AC ✅ SCHVÁLENO**

### Poznámky k implementaci
- Dvouvrstvý filtr (URL-level + post-parse) implementován přesně podle plánu
- Bazoš: filtr před `_fetch_detail` ušetří stovky zbytečných HTTP requestů — správně ✅
- `MIN_PRICE_EUR = 9500` (~242 250 CZK) dává bezpečnostní marži pod 250 000 — správně ✅

---

## Task #3: Real-time Market Data (cmklv2 Next.js)

**Soubory:**  
- `lib/market-analysis.ts` (nový, ~510 řádků)  
- `lib/brand-model-slugs.ts` (nový, ~72 řádků)  
- `app/api/scout-leads/[id]/market-analysis/route.ts` (přepsán)  
- `components/admin/scout-leads/LeadPriceChart.tsx` (aktualizován)  
- `components/admin/scout-leads/LeadPriceVerdict.tsx` (aktualizován)  
- `components/admin/scout-leads/LeadSimilarTable.tsx` (aktualizován)  
- `components/admin/scout-leads/ScoutLeadDetail.tsx` (aktualizován)  

### AC checklist (§9 plánu)

| # | Kritérium | Stav | Poznámka |
|---|-----------|------|----------|
| AC-1 | Endpoint fetchuje reálné ceny z internetu | ✅ | `fetchMarketData()` volá AS24 CZ/DE/AT + Sauto + Mobile.de |
| AC-2 | AS24 fetcher: slug-based URL, data-price, CZ+DE+AT | ✅ | `market-analysis.ts:132-197` |
| AC-3 | Sauto fetcher: JSON API, filtruje na model + year | ✅ | `market-analysis.ts:201-253` |
| AC-4 | Mobile.de fetcher: classification path, FOR_SALE_BY_OWNER | ✅ | `market-analysis.ts:257-307` |
| AC-5 | EUR → CZK konverze (25.5) | ✅ | `EUR_TO_CZK = 25.5` konstantní, aplikována pro DE/AT/Mobile.de |
| AC-6 | Promise.allSettled, partial results OK, timeout 8s | ✅ | `market-analysis.ts:468-478`, AbortController s 8s timeout |
| AC-7 | Cache: Map, TTL 4h, max 500, LRU eviction | ✅ | `market-analysis.ts:77-103` |
| AC-8 | Histogram: 10 bucketů, aktuální lead zvýrazněný | ✅ | `market-analysis.ts:340-356` |
| AC-9 | Verdikt: LOW (<-15%), OK (±15%), HIGH (>+15%) | ✅ | `market-analysis.ts:370-381` |
| AC-10 | Top 5 similar offers s URL | ✅ | `market-analysis.ts:383-390` |
| AC-11 | Fallback chain: internet → partial → DB → "Nedostatek dat" | ✅ | `market-analysis.ts:481-492` + DB fallback `take: 200` |
| AC-12 | Response time <3s (miss), <1ms (hit) | ⚠️ | Nelze ověřit bez live testu — implementace vypadá korektně |
| AC-13 | RBAC: stejná jako GET /api/scout-leads/[id] | ✅ | `ALLOWED_ROLES` identické, broker-only-own-lead check zachován |

**Hodnocení Task #3: 12/13 AC ✅ SCHVÁLENO (AC-12 nelze offline ověřit)**

---

## Nalezené bugy

### B1 — MINOR: Missing diacritics v verdikt labelu
**Soubor:** `lib/market-analysis.ts:380`  
```typescript
// CHYBA:
label = "V normalu";
// SPRÁVNĚ:
label = "V normálu";
```

### B2 — MINOR: Missing háček v ceně (UI zobrazení)
**Soubor:** `components/admin/scout-leads/LeadSimilarTable.tsx:91`  
```typescript
// CHYBA:
? `${item.price.toLocaleString("cs-CZ")} Kc`
// SPRÁVNĚ:
? `${item.price.toLocaleString("cs-CZ")} Kč`
```

### B3 — MINOR: Missing diacritics v nadpisu tabulky
**Soubor:** `components/admin/scout-leads/LeadSimilarTable.tsx:65`  
```tsx
// CHYBA:
Podobne nabidky na trhu
// SPRÁVNĚ:
Podobné nabídky na trhu
```

### B4 — MINOR: Missing diacritics v sourceLabels
**Soubor:** `components/admin/scout-leads/LeadSimilarTable.tsx:33`  
```typescript
// CHYBA:
MANUAL: "Manualni",
// SPRÁVNĚ:
MANUAL: "Manuální",
```

### B5 — MINOR: API error messages bez diakritiky
**Soubor:** `app/api/scout-leads/[id]/market-analysis/route.ts:16,19,44,96`  
```typescript
// CHYBA (4 místa):
{ error: "Neprihlaseny" }        → "Nepřihlášen"
{ error: "Nemate opravneni" }    → "Nemáte oprávnění"
{ error: "Interni chyba serveru" } → "Interní chyba serveru"
```
*Poznámka: API errors jsou viditelné jen v DevTools, ne UI — nízká priorita.*

### B6 — INFO: Cache se neukládá při 0 výsledcích
**Soubor:** `lib/market-analysis.ts:501`  
```typescript
if (allPrices.length > 0) {  // ← obscure vozidla nejsou cachována
    cacheSet(cacheKey, result);
}
```
Pro obscure vozidla (0 výsledků z internetu i DB) se každý request znovu dotazuje všech 5 zdrojů. Není bug — plan toto nespecifikoval. Zvážit caching s kratším TTL (např. 30 min) i pro prázdné výsledky.

---

## Reverzní kontrola proti plánu

### Architektura (§3 plánu)
- ✅ Single endpoint `/api/scout-leads/[id]/market-analysis`
- ✅ Cache-first pattern (hit → return, miss → fetch → cache → return)
- ✅ `fetchWithTimeout` s 8s AbortController
- ✅ AS24 slug-based URL (varianta A dle doporučení v §2.1)
- ✅ Sauto JSON API (§2.2)
- ✅ Mobile.de Search API (§2.3)

### Response format (§8 plánu)
- ✅ `priceDistribution.buckets` — 10 buckets
- ✅ `priceDistribution.stats` — median, mean, min, max, count, percentile
- ✅ `priceDistribution.sources` — autoscout24, sauto, mobile_de
- ✅ `priceVerdict` — verdict, deviationPercent, label
- ✅ `similarOffers` — top 5, s url
- ✅ `meta` — fromCache, fetchedAt, dbFallback

### STOP pravidla (§10 plánu)
- STOP-1 (AS24 403/429): Implementace vrací `[]` na non-ok response — tichý fallback ✅
- STOP-2 (Sauto 403): Stejný pattern ✅
- STOP-3 (Mobile.de auth): Stejný pattern ✅
- STOP-4 (slug 0 výsledků): Fallback chain zachytí → DB → "Nedostatek dat" ✅
- STOP-5 (Cache >100MB): CACHE_MAX_SIZE = 500 + LRU eviction ✅

### Type safety observation
`lib/market-analysis.ts:437` — DB fallback castuje `s.source` jako `PricePoint["source"]` (AUTOSCOUT24|SAUTO|MOBILE_DE). Pokud DB obsahuje BAZOS/SBAZAR/TIPCARS lead, TypeScript akceptuje cast, ale runtime hodnota zůstane "BAZOS" — sources counter správně ukáže 0 pro všechny 3 zdroje. **Neohrožuje funkčnost**, ale typ je technicky nepřesný.

---

## Souhrn

| Feature | AC splněno | Bugy | Hodnocení |
|---------|------------|------|-----------|
| Task #2: Cenový filtr | 8/8 | 0 | ✅ APPROVED |
| Task #3: Market data | 12/13* | 4 kosmetické | ✅ APPROVED |

*AC-12 (response time) nelze ověřit offline.

**Blocker pro merge:** ❌ Žádný — bugy B1-B5 jsou čistě kosmetické (diakritika). B6 je observation.

**Doporučení:** Opravit B1-B5 před deployem (malé fixní změny). B6 zvážit do backlogu.
