# EVŽEN-THE-KING: Finální audit shody implementace se zadáním

**Datum:** 2026-05-20
**Task:** #5
**Verdikt:** SCHVÁLENO s poznámkami (design karta = nový požadavek)

---

## Doslovné zadání uživatele

1. "musíme vyhledavat a screprovat inzeraty soukromníku aut které jsou drazší než 250tisíc"
2. "AI si muže brat data všude přece... Ten graf prodeje se muze vzít podle celého internetu ne podle našich dat to je prece jasné"
3. "jenom 10 polí? to me zajima a co ten graf toho prodeje?"
4. (NOVÝ) "a plus tu kartu toho leadu udelej proste líp jo"

---

## A) Cenový filtr >= 250 000 Kč — PASS

| Soubor | Řádek | Implementace |
|--------|-------|-------------|
| `config.py:12` | `MIN_PRICE_CZK = 250_000` | Centrální konstanta — SPRÁVNĚ |
| `config.py:13` | `MIN_PRICE_EUR = 9500` | ~250k/25.5 pro DE/AT — SPRÁVNĚ |
| `autoscout24.py:12` | `from lead_scout.config import MIN_PRICE_CZK, MIN_PRICE_EUR` | Import — OK |
| `autoscout24.py:91` | `pricefrom={price_from}` v URL | Pre-filter v URL pro AS24 — SPRÁVNĚ |
| `autoscout24.py:242` | `if price < MIN_PRICE_CZK: return None` | Post-parse filtr — SPRÁVNĚ |
| `sauto.py:12` | `from lead_scout.config import MIN_PRICE_CZK` | Import — OK |
| `sauto.py:234` | `if price < MIN_PRICE_CZK: return None` | Post-parse filtr — SPRÁVNĚ |
| `bazos.py:12` | `from lead_scout.config import MIN_PRICE_CZK` | Import — OK |
| `bazos.py:283` | `if price < MIN_PRICE_CZK: return None` | Pre-detail filtr (šetří HTTP) — SPRÁVNĚ |
| `sbazar.py:12` | `from lead_scout.config import MIN_PRICE_CZK` | Import — OK |
| `sbazar.py:188` | `if price < MIN_PRICE_CZK: return None` | Post-parse filtr — SPRÁVNĚ |

**Poznámka:** `searches.yaml:64` stále obsahuje `min: 30000` — ale tato hodnota se NEPOUŽÍVÁ v kódu scraperů (importují z `config.py`). Pouze potenciálně matoucí. **Doporučení:** Aktualizovat na 250000 pro konzistenci.

---

## B) Graf z internetových dat — PASS

### lib/market-analysis.ts (507 řádků) — EXISTUJE a je KOMPLETNÍ

| Feature | Stav | Detail |
|---------|------|--------|
| fetchAS24(brand, model, year, country) | OK | Slug-based URL, parsuje `data-price`, CZ+DE+AT, EUR→CZK |
| fetchSauto(brand, model, year) | OK | JSON API, filtruje model+year post-fetch |
| fetchMobileDe(brand, model, year) | OK | Search API, `sellerType=FOR_SALE_BY_OWNER`, EUR→CZK |
| Promise.allSettled | OK | 5 parallel fetches (AS24 CZ/DE/AT + Sauto + Mobile.de) |
| Timeout 8s per zdroj | OK | `FETCH_TIMEOUT = 8000`, AbortController |
| Cache: in-memory Map | OK | TTL 4h, max 500 entries, LRU eviction |
| Histogram 10 bucketů | OK | `computeAnalysis()` — buckets + isCurrent |
| Verdikt LOW/OK/HIGH | OK | ±15% deviation threshold |
| Top 5 similar offers | OK | Sorted by price distance |
| Fallback chain | OK | internet → partial → DB fallback → empty |
| EUR→CZK | OK | `EUR_TO_CZK = 25.5` |

### route.ts — PŘEPSÁNO, VOLÁ fetchMarketData()

- `:5` — `import { fetchMarketData } from "@/lib/market-analysis"`
- `:60-66` — `await fetchMarketData(lead.id, brand, model, year, leadPrice)`
- Response: `priceDistribution` (buckets + stats + **sources**), `priceVerdict`, `similarOffers`, `meta`

### UI komponenty — AKTUALIZOVÁNY

| Komponenta | Stav | Detail |
|------------|------|--------|
| LeadPriceChart.tsx | OK | Přidán `sources` prop, zobrazuje AS24/Sauto/Mobile.de badge breakdown |
| LeadPriceVerdict.tsx | OK | Přidán `fromCache`, `sourceCount` |
| LeadSimilarTable.tsx | OK | Přidán `offers` prop (externí nabídky), external URLs ("Zobrazit"), source badges |
| ScoutLeadDetail.tsx | OK | Předává `sources`, `offers`, `meta` do komponent |
| brand-model-slugs.ts | OK | Importován a používán v market-analysis.ts |

---

## C) Enrichment >= 10 polí — PASS (16 polí)

ScoutLeadDetail.tsx zobrazuje pro SOUKROMNIK:
1. listingTitle, 2. vehicleBrand, 3. vehicleModel, 4. vehicleYear, 5. vehiclePrice,
6. vehicleMileage, 7. vehicleFuel, 8. vehicleTransmission, 9. vehiclePower,
10. vehicleEngineCC, 11. vehicleBodyType, 12. vehicleColor, 13. vehicleDoors,
14. vehicleEquipment (tag list), 15. vehicleDescription (collapsible), 16. vehiclePhotos (gallery)

---

## D) Design karta — NOVÝ POŽADAVEK: konkrétní návrhy na zlepšení

Uživatel řekl: "a plus tu kartu toho leadu udelej proste líp jo"

### Kritické problémy (P0):

1. **Žádná hero sekce** — Stránka skočí rovnou do Data Completeness progress baru. Chybí vizuální dominanta: velká fotka auta + značka/model/cena/score. Makléř musí scrolvat aby viděl co je to za auto.

2. **Fotky jsou pohřbené** — `VehiclePhotosCard` je až za Vehicle card + Description + Equipment. Makléř chce VIDĚT auto PRVNÍ. Fotky by měly být nahoře, ideálně jako hero gallery.

3. **Price Verdict schovaný v sidebaru** — Nejdůležitější info (LOW/OK/HIGH + "Pod trhem -12%") je zastrčený v malém boxíku uvnitř Status karty v pravém sloupci. Měl by být VELKÝ a VIDITELNÝ hned vedle ceny.

4. **Similar Offers na dně stránky** — Srovnání s trhem (nejcennější intel pro makléře) je až dole v levém sloupci, pod všemi kartami.

### Významné problémy (P1):

5. **Monotónní karty** — Všechny sekce vypadají identicky: bílý Card s šedým UPPERCASE headerem. Žádná vizuální hierarchie — nelze rozlišit co je důležité a co ne.

6. **Kontakt není CTA** — Telefon/email jsou ve standardním `<dl>` grid. Pro makléře je volání prodejci HLAVNÍ akce. Telefon by měl být velký, klikací, s call-to-action stylem.

7. **Score jako tiny text** — "Score: 85" je malý šedý text vedle status badge. Score je klíčový pro prioritizaci leadů — měl by být vizuálně výrazný (velký kruh/gauge, barva podle hodnoty).

8. **Žádný loading state pro market data** — Market analysis se loaduje async, ale UI neukazuje nic (skeleton, spinner) dokud data nedorazí.

9. **"Převzít lead" tlačítko ztracené** — Primary CTA je zastrčený v "Akce" kartě v sidebaru. Měl by být sticky top bar nebo prominent floating button.

### Drobnosti (P2):

10. **Photo thumbnails příliš malé** — `h-24` (96px) — sotva viditelné
11. **"Kc" bez háčku** — `LeadSimilarTable.tsx:91` má `Kc` místo `Kč`
12. **Diacritika chybí v route.ts** — "Neprihlaseny", "Nemate opravneni", "Interni chyba" — bez diakritiky
13. **Dva oddělené equipment sekce** — AI-parsed tags + scraped equipment vedle sebe matou

### Doporučená struktura stránky:

```
┌─────────────────────────────────────────────────────┐
│ HERO: Foto gallery (velká) + Brand Model Year       │
│ Cena: 450 000 Kč  │  Score: 85  │  ▼ POD TRHEM -12% │
│ [📞 Zavolat] [✉ Email] [← Zpět]                     │
├──────────────────────────┬──────────────────────────┤
│ LEFT (2/3)               │ RIGHT (1/3)              │
│                          │                          │
│ Cenová distribuce (graf) │ Stav + Quick Actions     │
│ Podobné nabídky na trhu  │ Přiřazení                │
│ Vozidlo (detaily)        │ Poznámky                 │
│ Výbava                   │ Přidat aktivitu          │
│ Popis prodejce           │ Historie aktivit         │
│ Data Completeness        │                          │
│ Zdroj + Raw payload      │                          │
└──────────────────────────┴──────────────────────────┘
```

---

## Shrnutí

| Požadavek | Stav | Poznámka |
|-----------|------|----------|
| Cenový filtr >= 250k CZK | PASS | Všechny 4 scrapery + config.py |
| Graf z internetu | PASS | AS24+Sauto+Mobile.de, cache 4h, fallback chain |
| Enrichment >= 10 polí | PASS | 16 polí |
| Design karta (NOVÝ) | NEIMPLEMENTOVÁNO | 9 konkrétních návrhů výše |

**Evžen-the-King verdikt: Body 1-3 SCHVÁLENY. Bod 4 (design) vyžaduje novou implementaci — předávám designerovi.**
