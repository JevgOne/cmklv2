# QA Report: Bazoš fix v2 — SVG filtr, equipment, metadata

**Soubor:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/bazos.py`
**Kontrolor:** KONTROLOR agent
**Datum:** 2026-05-20
**Schválený plán:** `.claude-context/tasks/plan-bazos-fix-v2.md`

---

## 1. Simplify kontrola

### ✅ `BODY_TYPE_PATTERNS` a `ENGINE_CODE_FUEL` na module level (Řešení C)

Obě konstanty jsou definovány na module level (ř. 38-59), konzistentně s `FUEL_PATTERNS` a `TRANSMISSION_PATTERNS`. Funkce `_extract_params_from_text` je referuje, ne definuje inline. ✅ DRY.

### ✅ `_is_valid_photo_url()` čistá pure function

Bez side effects, testovatelná, jednoznačné názvy konstant (`_ICON_FILENAMES`, `_PHOTO_EXTENSIONS`). ✅

### ℹ️ Strategy 2 photo condition na ř. 602 je 138 znaků

```python
if src and "/img/" in src and "thumb" not in src and "mini" not in src and src not in photos and _is_valid_photo_url(src):
```

Přidáním `_is_valid_photo_url(src)` se řádek prodloužil z ~100 na 138 znaků. Čitelnější by bylo:

```python
if src and "/img/" in src and "thumb" not in src and "mini" not in src \
        and src not in photos and _is_valid_photo_url(src):
```

**Závažnost:** Kosmetická — funkčně OK.

---

## 2. Debug kontrola

### Syntax
```
python3 -m py_compile lead_scout/scrapers/bazos.py → OK
```

### Testy
```
pytest tests/ → 20 passed
```

### Ruff lint — 16 chyb

| Kód | Počet | Poznámka |
|-----|-------|----------|
| E402 | 8 | Pre-existing |
| E501 | 8 | 7 pre-existing, 1 nový (ř. 602 — 138 znaků) |

Žádné nové F401/E741/F811 ani jiné funkční errory.

### ✅ `ScoutLeadPayload` má potřebná pole

```
models.py ř. 89: vehicle_mileage: Optional[int] = None  ✅
models.py ř. 97: vehicle_body_type: Optional[str] = None  ✅
```

### ✅ `_is_valid_photo_url` — edge cases

| URL | Výsledek | Správně? |
|-----|----------|----------|
| `bazos.cz/img/bazos.svg` | False (`filename in _ICON_FILENAMES`) | ✅ |
| `bazos.cz/img/map.svg` | False (`filename.endswith(".svg")`) | ✅ |
| `bazos.cz/img/1t/678/12345.jpg` | True (`/img/\d+` match) | ✅ |
| `bazos.cz/img/facebook.svg` | False | ✅ |
| `bazos.cz/img/3t/abc/999999.png` | True | ✅ |
| `bazos.cz/img/arrow.svg` | False (icon + svg check) | ✅ |
| Extensionless CDN URL | True (fallthrough) | ✅ |

### ⚠️ Mileage regex — potenciální false positive s rokem

Obecný pattern `r'([\d\s.]{4,10})\s*km\b'` matchne i "2019 km". Range check `100 < km < 1_000_000` year 2019 propustí jako mileage. V praxi nízké riziko (kdo napíše "2019 km"?), a první specifičtější pattern má přednost.

**Závažnost:** Nízká — plán tento pattern explicitně schválil.

### ⚠️ Engine code `\bev\b` — false positive risk

Czech "ev." (eventuálně) nebo "ev" v textu by mohlo matchnout → `fuel = "ELECTRIC"`. Je ale gated: `if "fuel" not in params:`, takže aktivuje jen pokud žádný jiný fuel indicator nenalezen. Plán tento pattern schválil.

**Závažnost:** Nízká.

### ✅ Strategy 1.5 — edge cases

| Text | Výsledek |
|------|----------|
| `"ACC, App-Connect, LED matrix, vyhřívaný volant"` | ✅ 4 equipment items |
| `"Prodám auto, je v dobrém stavu, najeto málo"` | ✅ Odmítnuto (verb filter: `je`) |
| `"abc, de"` | ✅ Odmítnuto (< 3 valid parts) |
| Prázdný řádek | ✅ Přeskočen (`if "," not in line`) |

---

## 3. Reverzní kontrola

| # | Požadavek z plánu | Status | Ř. |
|---|-------------------|--------|-----|
| **Fix 1+2: SVG filtr** | | | |
| 1 | `_ICON_FILENAMES` set na module level | ✅ | 62-66 |
| 2 | `_PHOTO_EXTENSIONS` set na module level | ✅ | 68 |
| 3 | `_is_valid_photo_url()` funkce | ✅ | 71-89 |
| 4 | Strategy 1: přidán `_is_valid_photo_url(src)` | ✅ | 592 |
| 5 | Strategy 2: přidán `_is_valid_photo_url(src)` | ✅ | 602 |
| **Fix 3: Equipment Strategy 1.5** | | | |
| 6 | Strategy 1.5 za Strategy 1, před Strategy 2 | ✅ | 177-195 |
| 7 | Guard `if not equipment:` | ✅ | 179 |
| 8 | Verb filter (`je/má/byl/jsou/...`) | ✅ | 189 |
| 9 | Min 3 valid parts + ratio > 0.6 | ✅ | 191 |
| **Fix 4: Metadata extrakce** | | | |
| 10 | `BODY_TYPE_PATTERNS` na module level | ✅ | 38-48 |
| 11 | `ENGINE_CODE_FUEL` na module level | ✅ | 50-59 |
| 12 | Year extrakce v `_extract_params_from_text` | ✅ | 116-128 |
| 13 | Mileage extrakce | ✅ | 130-145 |
| 14 | Body type extrakce (ref. module dict) | ✅ | 147-151 |
| 15 | Engine code → fuel (ref. module dict, gated `if fuel not in params`) | ✅ | 153-158 |
| 16 | `vehicle_year=detail_params.get("year") or year` | ✅ | 493 |
| 17 | `vehicle_mileage=detail_params.get("mileage")` | ✅ | 503 |
| 18 | `vehicle_body_type=detail_params.get("body_type")` | ✅ | 504 |
| 19 | `ScoutLeadPayload.vehicle_mileage` ověřeno | ✅ | models.py:89 |
| 20 | `ScoutLeadPayload.vehicle_body_type` ověřeno | ✅ | models.py:97 |

---

## Shrnutí nálezů

| Závažnost | Počet | Popis |
|-----------|-------|-------|
| ❌ Kritická | 0 | — |
| ⚠️ Střední | 0 | — |
| ⚠️ Nízká | 2 | Mileage false positive s rokem; `\bev\b` fuel edge case (obojí schváleno plánem) |
| ℹ️ Kosmetická | 1 | Ř. 602 příliš dlouhý (138 znaků) |
| 📝 Lint | 16 | E402 ×8 pre-existing, E501 ×8 (7 pre-existing, 1 nový trivial) |

---

**Celkový verdikt: ✅ SCHVÁLENO**

Všechny 4 fixy implementovány správně (20/20 bodů plánu). Žádné kritické ani střední bugy. Oba low-severity nálezy jsou explicitně schváleny plánem.
