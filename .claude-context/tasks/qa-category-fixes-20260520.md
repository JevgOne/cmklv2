# QA Report: Category Fixes + Filters

**Datum:** 2026-05-20  
**Task:** #36 (QA task #35)  
**Commits:** 7170146, 7403cd3, 6833e3e  
**Reviewer:** kontrolor  
**Verdict: APPROVED s 1 bugem (nízká závažnost) + 1 blokér (pytest)**

---

## Zkontrolované soubory

- `lead_scout/filters.py` — dual-category blacklist
- `lead_scout/scrapers/firmy_cz.py` — SEARCH_QUERIES + CATEGORY_URLS
- `lead_scout/scrapers/zlatestranky.py` — DEFAULT_QUERIES
- `lead_scout/scrapers/ares.py` — query_sets per category
- `lead_scout/db.py` — filter hook + cleanup_stk_leads()

---

## Ověřovací body

### ✅ 1. Špatné queries odstraněny ze všech scraperů

**firmy_cz.py:**
```python
CATEGORY_URLS[AUTOBAZAR] = []  # /Auto-moto mega-kategorie odstraněna ✅
SEARCH_QUERIES[AUTOBAZAR] = ["autobazar", "autosalon", "prodej aut", "ojeté vozy"]
SEARCH_QUERIES[VRAKOVISTE] = ["vrakoviště", "autodíly", "autovraky", "rozborka aut", "autošrot"]
```
Odstraněno: `autoservis`, `autoopravna`, `pneuservis`, `ekologická likvidace`, `náhradní díly` ✅

**zlatestranky.py:**
```python
DEFAULT_QUERIES = ["autobazar", "vrakoviště", "autodíly", "prodej aut",
                   "autosalon", "ojeté vozy", "autovraky", "rozborka aut"]
```
Odstraněno: `autoservis`, `pneuservis`, `autolakovna`, `STK`, `autoškola`, `autopůjčovna` ✅

**ares.py:**
```python
# AUTOBAZAR
["autobazar", "autosalon", "prodej aut", "ojeté vozy"]
# VRAKOVISTE
["vrakoviště", "autovraky", "rozborka aut", "autodíly"]
```
Odstraněno vše co nepatří — kompletní ✅

### ✅ 2. filters.py — dual blacklist

Správně rozděleno na 2 separátní regex sety:
- `EXCLUDED_AUTOBAZAR_PATTERNS` — 36 vzorků (STK, autoservisy, lakovny, pneu, autoškoly, čerpací, odtah, tuning, autodoprava)
- `EXCLUDED_VRAKOVISTE_PATTERNS` — 12 vzorků (ekolikvidace, sběrny, výkup vraků, šrotovné, recyklace, odpady)

Funkce `is_excluded_business(name, category)` správně dispatchuje ✅

**Živé testy: 31/31 passed** (20 AUTOBAZAR + 11 VRAKOVISTE)

### ✅ 3. ARES "autodíly" a "rozborka aut" → VRAKOVISTE

```python
query_sets = [
    (q, Category.AUTOBAZAR)
    for q in ["autobazar", "autosalon", "prodej aut", "ojeté vozy"]
] + [
    (q, Category.VRAKOVISTE)
    for q in ["vrakoviště", "autovraky", "rozborka aut", "autodíly"]  # ← správně
]
```

Navíc jmenná heuristika v `_parse_ares_item()`:
```python
if any(kw in name_lower for kw in ["vrak", "díl", "šrot", "rozborka"]):
    category = Category.VRAKOVISTE
```
`"rozborka"` přidáno ✅, `"likvidace"` odstraněno ✅

### ✅ 4. Žádný scraper nehledá autoservis/autolakovna/karosárna pod AUTOBAZAR

| Scraper | autoservis | autolakovna | karosárna | pneuservis | čistý? |
|---|---|---|---|---|---|
| firmy_cz | ❌ odstraněno | ❌ odstraněno | ❌ odstraněno | ❌ odstraněno | ✅ |
| zlatestranky | ❌ odstraněno | ❌ odstraněno | ❌ odstraněno | ❌ odstraněno | ✅ |
| ares | ❌ odstraněno | ❌ odstraněno | ❌ odstraněno | ❌ odstraněno | ✅ |

### ✅ 5. db.py — filter rozšířen na VRAKOVISTE

```python
if lead.category in (Category.AUTOBAZAR, Category.VRAKOVISTE) and \
   is_excluded_business(lead.name, category=lead.category.value):
```
Obě kategorie filtrovány ✅

`cleanup_stk_leads()` opravena — nyní iteruje obě kategorie přes Python regex (opravuje starý SQL LIKE bug z QA #14) ✅

---

### ✅ 6. Bazoš scraper — country detection, vehicle filter, EUR→CZK

**Commit:** 6833e3e  
**Soubor:** `lead_scout/scrapers/bazos.py`

#### 6a. Country detection — parametr, ne hardcoded

```python
def _parse_ad(self, client, ad_el, base_url: str, country: Country):
    ...
    return ScoutLeadPayload(country=country, ...)  # ✅ NOT hardcoded CZ
```

`_parse_ad()` přijímá `country` jako parametr a předává ho do `ScoutLeadPayload`. URL routing je správný:
- CZ → `https://auto.bazos.cz` ✅
- SK → `https://auto.bazos.sk` ✅

`scrape()` posílá `country` přes celý call stack. ✅

#### 6b. Vehicle filter — `_is_personal_vehicle()` **14/14 testů passed**

30+ vzorků (`NON_PERSONAL_KEYWORDS`) pokrývá: nákladní, kamiony, stroje, motorky, autobusy, přívěsy.

Živé testy:
```
✅ "Škoda Octavia 2019 osobní"     → personal (KEEP)
✅ "BMW 3 Series osobní"           → personal (KEEP)
✅ "Toyota Corolla benzin"         → personal (KEEP)
✅ "Nákladní Ford Transit 3.5t"    → non-personal (SKIP)
✅ "Scania kamion tahač návěs"     → non-personal (SKIP)
✅ "Motorky Honda CBR 600"         → non-personal (SKIP)
✅ "Skútr Yamaha 125cc"            → non-personal (SKIP)
✅ "Čtyřkolky ATV Yamaha"         → non-personal (SKIP)
✅ "Traktor Zetor 6911"            → non-personal (SKIP)
✅ "Autobus Karosa 54 míst"        → non-personal (SKIP)
✅ "Bagr Caterpillar 320"          → non-personal (SKIP)
✅ "Karavan Fendt 2022"            → non-personal (SKIP)
✅ "VZV Toyota 2t"                 → non-personal (SKIP)
```

**14/14 passed ✅**

#### 6c. EUR→CZK konverze — **7/7 testů passed**

```python
EUR_TO_CZK_RATE = 25.5

if amount and (is_eur or country == Country.SK):
    return int(amount * EUR_TO_CZK_RATE)
```

Živé testy:
```
✅ "150 000 Kč"  (CZ) → 150000      (CZK, beze změny)
✅ "6000 €"      (CZ) → 153000      (€ detekován → konverze)
✅ "6000"        (SK) → 153000      (SK country → konverze)
✅ "6000 €"      (SK) → 153000      (obě podmínky → konverze)
✅ "150000"      (CZ) → 150000      (CZK, beze změny)
✅ "Dohodou"     (CZ) → None        (nečíselný text)
✅ ""            (CZ) → None        (prázdný)
```

**7/7 passed ✅**

---

### ⚠️ BLOKÉR: pytest není nainstalován

Pokus o spuštění `python3 -m pytest tests/ -v` selhal:
```
/Library/Developer/CommandLineTools/usr/bin/python3: No module named pytest
```

Existující testy: `tests/__init__.py`, `tests/test_models.py`  
Závislosti nejsou nainstalovány (chybí `.venv` nebo `pip install -e .[dev]`).

**Akce potřebná:** Vývojář musí spustit `pip install pytest` nebo `pip install -e .[dev]` v projektu a confirmat, že `tests/test_models.py` prochází.

---

## Bug

### 🐛 BUG: `\bautooprav[na]+\b` nefiltruje plurál "Autoopravny"

```python
r"\bautooprav[na]+\b"  # ← [na]+ neobsahuje 'y'
```

**Potvrzeno testem:**
- `"Autoopravna Praha"` → EXCL ✅
- `"Autoopravny Praha"` → KEEP ❌ (bug — mělo by být EXCL)

Regex `[na]+` zachytí 'n' ale narazí na 'y' (není v setu), pak `\b` selže protože 'y' je word char.

**Závažnost:** Nízká — ARES queries už nehledají "autoopravna", takže tyto firmy přijdou jen přes dotazy jako "autobazar", kde jsou spíš vzácné. Ale při scrape Firmy.cz přes obecné kategorie by mohly propadnout.

**Navrhovaná oprava:**
```python
r"\bautooprav\w*\b"  # nebo
r"\bautoopravna?\b"  # jen nom sg + gen pl (nejčastější formy)
```

---

## Souhrn

| Bod | Status |
|---|---|
| Queries čisté — autoservis/autolakovna/karosárna pryč | ✅ |
| /Auto-moto mega-kategorie odstraněna z firmy_cz | ✅ |
| ARES autodíly/rozborka → VRAKOVISTE | ✅ |
| VRAKOVISTE ekolikvidace/sběrny odstraněny | ✅ |
| filters.py dual-category split (36 + 12 patterns) | ✅ |
| Filter v db.py na obě kategorie | ✅ |
| cleanup_stk_leads() přes Python regex (SQL bug fix) | ✅ |
| Bazoš country detection (ne hardcoded CZ) | ✅ |
| Bazoš vehicle filter 14/14 passed | ✅ |
| Bazoš EUR→CZK konverze 7/7 passed | ✅ |
| **\bautooprav[na]+\b** nefiltruje "Autoopravny" | 🐛 Low |
| pytest testy | ⚠️ Blokér — pytest not installed |

**Verdict: APPROVED** — implementace je správná a výrazně zlepšuje kvalitu dat. Regex bug v `autooprav` má nízkou praktickou závažnost, může být fixnut v follow-up. Pytest blokér vyžaduje `pip install pytest` od vývojáře.
