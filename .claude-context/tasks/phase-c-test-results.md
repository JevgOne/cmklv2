# Phase C: Scraper Test Results (2026-05-21)

## VW California Benchmark (Sauto ID 210452900)

**Expected:** 33 photos, 72+ equipment, VIN WV2ZZZ7ZZNH037747, Grade A

| Field | Value | Status |
|-------|-------|--------|
| Photos | 33 | PASS |
| Equipment | 73 (structured [{name, category}]) | PASS |
| VIN | WV2ZZZ7ZZNH037747 | PASS |
| Description | 1000 chars | PASS |
| Brand/Model | Volkswagen California | PASS |
| Price | 1,450,000 CZK | PASS |
| Mileage | 106,489 km | PASS |
| Completeness | 92/100 (Grade A) | PASS |

### Extended fields extracted:
- first_registration: 2021-12-01
- first_owner: True
- crashed_in_past: False
- service_book: True
- stk_date: 2026-12-01
- country_of_origin: Česká republika
- condition: Ojeté
- drive: 4x4
- gearbox_levels: 7 stupňová
- euro_level: EURO 6
- consumption: 8.5
- capacity: 5
- airbags: 4
- aircondition: Dvouzónová automatická
- color_tone: Tmavá
- color_type: Metalíza
- model_detail: T 6.1 Beach, 4Mot. 150kW
- price_without_vat: 1,198,347
- vat_deductible: True
- doors: 4
- engine_cc: 1968
- videos: 1 video
- district: Praha-západ

---

## Additional Sauto Listings

| Listing | Photos | Equip | VIN | Score | Grade |
|---------|--------|-------|-----|-------|-------|
| Ford Ranger 3.2 TDCi Wildtrak (210452852) | 23 | 60 | 6FPPXXMJ2PGB44783 | 84 | B |
| Škoda Octavia 2.0 TDI DSG (210452858) | 50 | 51 | TMBAJ7NE4K0XXXXXX | 90 | A |
| Porsche Panamera 4S E-Hybrid (210452861) | 24 | 56 | WP0ZZZ3CZFEXXXXXX | 84 | B |

**Notes:**
- Ford Ranger: B grade — missing some history fields (first_owner, crashed_in_past, service_book)
- Škoda Octavia: A grade — very complete, 50 photos
- Porsche Panamera: B grade — no description from API, otherwise complete

---

## Bazoš Listings

| Listing | Photos | Equip | Score | Grade |
|---------|--------|-------|-------|-------|
| Fiat Ducato L4H3 (bazos.sk/191619389) | 20 | 18 | 62 | C |
| Fiat 500x Sport (bazos.sk/191634570) | 18 | 14 | 59 | C |

**Notes:**
- Bazoš C grade is expected — text-only source, no API, no VIN/history fields
- Equipment correctly structured via text_extraction.py categorization
- Text mining extracts: fuel, transmission, power, color, year, mileage, engine_cc

---

## Sbazar

No active listings in DB (0 leads). Could not test live.

---

## Data Pipeline Verification

| Component | Status |
|-----------|--------|
| SNAKE_TO_CAMEL mappings (23 fields) | OK |
| Boolean conversion (INT→bool) | OK |
| JSON deserialization (photos, equipment, videos) | OK |
| Payload structure matches Zod schema | OK |
| Equipment backward-compatible (string + {name,category}) | OK |

---

## Fixes Applied During Testing

1. **Photo cap** — sauto.py [:30]→[:100], bazos.py [:30]→[:100], sbazar.py [:30]→[:100]
2. **Equipment cap** — sauto.py [:80]→[:200]
3. **Brand/model/price from API** — sauto.py _fetch_detail now extracts manufacturer_cb, model_cb, price

---

## Summary

- **Sauto:** Excellent data quality. Benchmark hits Grade A (92/100). All extended fields populated from API.
- **Bazoš:** Decent for text-only source. Grade C (59-62). Missing VIN/history fields expected.
- **Sbazar:** Not testable (no data). Architecture same as Bazoš (text mining).
- **Overall:** Pipeline is production-ready for Sauto. Bazoš acceptable for text source.
