# QA Report: Task #9 — Scraper Expansion (Fáze B)
**Datum:** 2026-05-20
**Kontrolor:** kontrolor
**Commit:** 6db570f (lead-scout)

---

## VERDIKT: ⚠️ PODMÍNĚNĚ SCHVÁLENO — 1 kritický bug nutno opravit před deployem

---

## 🔴 KRITICKÝ BUG: re_enrich.py — incompatible unpacking

**Soubor:** `scripts/re_enrich.py`, řádek 106

```python
# CURRENT (BROKEN):
phone, seller_name, seller_cat, city, desc, photos, equipment, metadata = \
    scraper._fetch_detail(page, lead["source_url"])
```

`SautoScraper._fetch_detail()` po Task #9 vrací **9** hodnot (přidán `extended: dict` na konci), ale `re_enrich.py` stále unpackuje **8**. Runtime:

```
ValueError: too many values to unpack (expected 8)
```

Každý běh `python3 scripts/re_enrich.py` pro Sauto leady selže.

**Fix:**
```python
phone, seller_name, seller_cat, city, desc, photos, equipment, metadata, extended = \
    scraper._fetch_detail(page, lead["source_url"])

# Volitelně: rozšířit update_lead() o extended pole (vin, stk_date, atd.)
```

Minimální fix je přidat `extended` do unpackingu. Pro plné využití nových dat by `update_lead()` měla dostat i `extended` a ukládat vin, stk_date, first_owner atd.

---

## Detailní audit

### 1. text_extraction.py (NEW — `lead_scout/scrapers/text_extraction.py`)

**10 regex extractorů:**

| Funkce | Co extrahuje | Status |
|--------|-------------|--------|
| `extract_vin` | 17-char VIN (WMI charset, bez I/O/Q) | ✅ |
| `extract_stk_date` | STK datum → ISO "YYYY-MM-01" | ✅ |
| `extract_first_owner` | "1. majitel / první majitel / one owner" | ✅ |
| `extract_crashed` | bouráno/nebouráno mention | ✅ |
| `extract_service_book` | servisní knížka mention | ✅ |
| `extract_consumption` | spotřeba l/100km | ✅ |
| `extract_euro_level` | Euro N → "EURO N" | ✅ |
| `extract_drive` | 4x4/AWD/přední/zadní pohon | ✅ |
| `extract_engine_cc` | ccm/cm³ nebo "X.Y TDI" odhad | ✅ |
| `extract_capacity` | N míst (2-9) | ✅ |

**`extract_extended_params(text)`** — volá všechny extraktory, vrací dict ✅

**EQUIPMENT_CATEGORY_MAP — 9 kategorií:**
safety, assist, security, interior, systems, seats, lights, exterior, drive ✅

**`to_structured_equipment(items)`** — flat `list[str]` → `[{"name": str, "category": str}]` ✅

**`categorize_equipment(name)`** — keyword matching na EQUIPMENT_CATEGORY_MAP, fallback "other" ✅

---

### 2. sauto.py — _fetch_detail()

**Return type změna:** `tuple[..., dict, dict]` — 9 hodnot (přidáno `extended`) ✅ (v sauto.py samotném)

**24 extended API polí:**

| api_extended klíč | Sauto API field | Status |
|-------------------|-----------------|--------|
| vin | data["vin"] | ✅ |
| first_registration | data["in_operation_date"] | ✅ |
| first_owner | data["first_owner"] | ✅ |
| crashed_in_past | data["crashed_in_past"] | ✅ |
| service_book | data["service_book"] | ✅ |
| stk_date | data["stk_date"] | ✅ |
| country_of_origin | data["country_of_origin_cb"]["name"] | ✅ |
| condition | data["condition_cb"]["name"] | ✅ |
| drive | data["drive_cb"]["name"] | ✅ |
| gearbox_levels | data["gearbox_levels_cb"]["name"] | ✅ |
| euro_level | data["euro_level_cb"]["name"] | ✅ |
| consumption | data["average_gas_mileage"] | ✅ |
| capacity | data["capacity"] | ✅ |
| airbags | data["airbags"] | ✅ |
| aircondition | data["aircondition_cb"]["name"] | ✅ |
| color_tone | data["color_tone_cb"]["name"] | ✅ |
| color_type | data["color_type_cb"]["name"] | ✅ |
| model_detail | data["additional_model_name"] | ✅ |
| price_without_vat | data["price_without_vat"] | ✅ |
| vat_deductible | data["price_is_vat_deductible"] | ✅ |
| doors | data["doors"] | ✅ |
| engine_cc | data["engine_volume"] | ✅ |
| videos | data["videos"][]["playlist"] | ✅ |
| district | data["locality"]["district"] | ✅ |

`api_extended = {k: v for k, v in api_extended.items() if v is not None}` — None cleanup ✅

**Equipment structured:**
```python
for eq in (data.get("equipment_cb") or []):
    cat = eq.get("equipment_category", "other")
    if isinstance(cat, dict):
        cat = cat.get("name", "other")  # handles nested dict
    api_equipment.append({"name": name, "category": cat})
```
Dedup via `seen_eq_names` set ✅, limit 80 ✅

**scrape() extended mapping:**
Všech 24 extended polí správně přiřazeno do `lead.*` ✅

---

### 3. bazos.py

Import: `from lead_scout.scrapers.text_extraction import extract_extended_params, to_structured_equipment` ✅

`_fetch_detail()` volá:
- `_extract_equipment_from_text(description)` → flat list → `to_structured_equipment()` → structured ✅
- `extract_extended_params(description)` → ext dict ✅

`_parse_ad()` mapuje extended fields do ScoutLeadPayload:
- vehicle_vin, vehicle_stk_date, vehicle_first_owner, vehicle_crashed_in_past,
  vehicle_service_book, vehicle_consumption, vehicle_euro_level, vehicle_drive,
  vehicle_engine_cc, vehicle_capacity ✅ (10 extended polí)

---

### 4. sbazar.py

Import: `from lead_scout.scrapers.text_extraction import extract_extended_params, to_structured_equipment` ✅

`_fetch_detail()` volá:
- vlastní flat extraction → `to_structured_equipment()` → structured ✅
- `extract_extended_params(description)` → ext dict ✅

`_enrich_lead()` mapuje extended fields do ScoutLeadPayload:
- vehicle_vin, vehicle_stk_date, vehicle_first_owner, vehicle_crashed_in_past,
  vehicle_service_book, vehicle_consumption, vehicle_euro_level, vehicle_drive,
  vehicle_engine_cc, vehicle_capacity ✅ (10 extended polí)

---

### 5. completeness.py

**Tier scoring:**

| Tier | Pole | Body |
|------|------|------|
| Tier 1 (mandatory) | brand, model, year, price, phone, city, photos | 60 |
| Tier 2 (important) | mileage, fuel, transmission, description, equipment, body_type, power | 25 |
| Tier 3 (history/condition) | vin, first_owner, crashed, service_book, stk_date, country_origin, first_reg, condition, drive | 10 |
| Tier 4 (tech specs) | color, doors, engine_cc, aircondition, euro_level, consumption, capacity | 5 |
| **Celkem** | | **100** |

`_field_has_value()` — bool True/False oboje počítá jako "filled" ✅ (False = "confirmed not crashed" = info)

**Grade systém:**
```python
if score >= 60: return "COMPLETE"
if score >= 40: return "PARTIAL"
return "INCOMPLETE"
```

**🟡 Odchylka od task plánu:** Task description říká "grade A/B/C/D/F" (5 stupňů), implementace má 3 stupně (COMPLETE/PARTIAL/INCOMPLETE). Plán v2 neurčuje přesné grade labely — implementace je tedy odlišná od textu v task description, ale funkčně konzistentní se schematem (completenessScore jako číslo 0-100).

---

### 6. Cross-check: scraper pole → SQLite sloupce (Task #8)

| Pole v ScoutLeadPayload | SQLite (Task #8) | Status |
|-------------------------|------------------|--------|
| vehicle_vin | vehicle_vin TEXT | ✅ |
| vehicle_first_registration | vehicle_first_registration TEXT | ✅ |
| vehicle_first_owner | vehicle_first_owner INTEGER (bool) | ✅ |
| vehicle_crashed_in_past | vehicle_crashed_in_past INTEGER | ✅ |
| vehicle_service_book | vehicle_service_book INTEGER | ✅ |
| vehicle_stk_date | vehicle_stk_date TEXT | ✅ |
| vehicle_country_of_origin | vehicle_country_of_origin TEXT | ✅ |
| vehicle_condition | vehicle_condition TEXT | ✅ |
| vehicle_drive | vehicle_drive TEXT | ✅ |
| vehicle_gearbox_levels | vehicle_gearbox_levels TEXT | ✅ |
| vehicle_euro_level | vehicle_euro_level TEXT | ✅ |
| vehicle_consumption | vehicle_consumption REAL | ✅ |
| vehicle_capacity | vehicle_capacity INTEGER | ✅ |
| vehicle_airbags | vehicle_airbags INTEGER | ✅ |
| vehicle_aircondition | vehicle_aircondition TEXT | ✅ |
| vehicle_color_tone | vehicle_color_tone TEXT | ✅ |
| vehicle_color_type | vehicle_color_type TEXT | ✅ |
| vehicle_model_detail | vehicle_model_detail TEXT | ✅ |
| vehicle_price_without_vat | vehicle_price_without_vat INTEGER | ✅ |
| vehicle_vat_deductible | vehicle_vat_deductible INTEGER (bool) | ✅ |
| vehicle_district | vehicle_district TEXT | ✅ |
| vehicle_videos | vehicle_videos TEXT (JSON) | ✅ |

**Všechna nová pole odpovídají SQLite sloupcům z Task #8** ✅

---

### 7. Python importy a syntax

- text_extraction.py: `import re, json` ✅
- bazos.py: import text_extraction ✅
- sbazar.py: import text_extraction ✅
- sauto.py: `import httpx, random` (pro API call) ✅
- completeness.py: `import json` ✅
- Žádné chybějící importy ✅

---

### 8. Benchmark: VW California — teoretický completeness

California (id 210452900) má kompletní Sauto API data:
- Tier 1: brand✅ model✅ year✅ price✅ phone✅ city✅ photos✅ = **60 pts**
- Tier 2: mileage✅ fuel✅ transmission✅ description✅ equipment✅ body_type✅ power✅ = **25 pts**
- Tier 3: vin✅ first_owner✅ crashed✅ service_book✅ stk_date✅ country✅ first_reg✅ condition✅ drive✅ = **10 pts**
- Tier 4: color✅ doors✅ engine_cc✅ aircondition✅ euro_level✅ consumption✅ capacity✅ = **5 pts**

**= 100 pts → COMPLETE** ✅ (by implementace; grade "A" by plan description)

---

## 🟡 Minor poznámky

1. **completeness.py není integrováno do pipeline** — `calculate_completeness()` není volána nikde (ani v `save_lead()`, ani ve scraperech, ani v `client.py`). `completeness_score` bude vždy 0. Pokud integrace čeká na další task, je to OK. Jinak pipeline neprodukuje completeness scores.

2. **Sbazar duplicitní equipment extraction** — `sbazar._fetch_detail()` re-implementuje vlastní flat equipment extraction (checkmarky, výbava:, keywords) místo reuse `_extract_equipment_from_text` z bazos.py. Funkčně správně (volá `to_structured_equipment`), ale kód je zduplikovaný. Refactor doporučen ale není blocker.

3. **Grade systém** — COMPLETE/PARTIAL/INCOMPLETE vs A/B/C/D/F. Viz výše.

---

## Závěr

Task #9 implementace je z velké části správná. **Jeden kritický bug** musí být opraven před deployem:

**`re_enrich.py:106` — přidat `extended` do unpackingu:**
```python
# Opravit na:
phone, seller_name, seller_cat, city, desc, photos, equipment, metadata, extended = \
    scraper._fetch_detail(page, lead["source_url"])
```

Po opravě: **SCHVÁLENO**.
