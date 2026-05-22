# Plán: Cenový filtr ≥ 250 000 Kč pro SOUKROMNIK scrapery

**Datum:** 2026-05-20
**Status:** READY FOR IMPL
**Projekt:** lead-scout (`/Users/zen/Projects/lead-scout/`)

---

## 1. Kontext a požadavek

Uživatel chce scrapovat pouze inzeráty soukromníků s cenou **≥ 250 000 Kč**. Auta pod touto hranicí nejsou pro Carmakler zajímavá (nízká provize, nízká marže).

---

## 2. Analýza scraperů — kde se parsuje cena

### 2.1 AutoScout24 (`autoscout24.py`)
- **Typ:** httpx (BaseScraper)
- **URL řádek 90:** `f"{base_url}/lst?sort=standard&desc=0&ustate=N%2CU&size=50&page={page}&atype=C&custtype=P"`
- **Cena parsována na řádku 153-164:** `data-price` atribut → konverze EUR×25.5 pro DE/AT, CZK pro CZ
- **Fallback řádek 162-164:** `span[data-testid='price']` → `_parse_price()` (řádek 263)
- **Země:** DE, AT (EUR), CZ (CZK)

### 2.2 Sauto (`sauto.py`)
- **Typ:** Playwright (HeadlessScraper)
- **URL řádek 55:** `f"{BASE_URL}/inzerce/osobni"`, stránkování: `?strana={pg}`
- **Cena parsována na řádku 209-216:** `div.c-item__data` → hledá text s "Kč" → `_parse_price()` (řádek 415)
- **Země:** pouze CZ (CZK)

### 2.3 Bazoš (`bazos.py`)
- **Typ:** httpx (BaseScraper)
- **URL řádek 184:** `f"{base_url}/?hledat={query}&...&crz={offset}"` nebo `f"{base_url}/?crz={offset}"`
- **Cena parsována na řádku 269-272:** `div.inzeratycena` → `_parse_price()` (řádek 405)
- **`_parse_price` konvertuje EUR→CZK** pro SK (řádek 421)
- **Země:** CZ (CZK), SK (EUR → konverze na CZK)

### 2.4 Sbazar (`sbazar.py`)
- **Typ:** Playwright (HeadlessScraper)
- **URL řádek 92-101:** `f"{BASE_URL}/170-osobni-auta"` nebo hledání, stránkování: `?strana={page}`
- **Cena parsována na řádku 164-169:** `b[class*='text-neutral']` → `_parse_price()` (řádek 276)
- **Země:** pouze CZ (CZK)

---

## 3. Strategie filtru

### Dvouvrstvý filtr: URL-level + post-parse safety net

| Scraper | URL-level filtr | Post-parse filtr |
|---------|----------------|-----------------|
| **AutoScout24 DE/AT** | ✅ `&pricefrom=9500` (EUR, 9500×25.5=242 250→bezpečná spodní hranice) | ✅ `price >= 250_000` (po konverzi na CZK) |
| **AutoScout24 CZ** | ✅ `&pricefrom=250000` (CZK) | ✅ `price >= 250_000` |
| **Sauto** | ❌ nelze (nemá URL price param, Playwright) | ✅ `price >= 250_000` |
| **Bazoš CZ** | ❌ nelze (Bazoš nemá URL price filter) | ✅ `price >= 250_000` |
| **Bazoš SK** | ❌ nelze | ✅ `price >= 250_000` (po EUR→CZK konverzi) |
| **Sbazar** | ❌ nelze (Playwright, nemá URL param) | ✅ `price >= 250_000` |

---

## 4. Implementační plán

### Krok 1: Přidat konstantu do `config.py`

**Soubor:** `lead_scout/config.py`

Přidat do `Settings`:
```python
# Minimum price filter for SOUKROMNIK leads (CZK)
min_price_czk: int = 250_000
```

A odvozený EUR limit:
```python
@property
def min_price_eur(self) -> int:
    """Minimum price in EUR (rounded down for safety margin)."""
    return int(self.min_price_czk / 25.5 * 0.95)  # ~9314 → zaokrouhlit na 9500
```

Nebo jednodušeji — jen konstanta `MIN_PRICE_CZK = 250_000` a `MIN_PRICE_EUR = 9500` přímo v config.py.

**Doporučení:** Jednoduchá konstanta v config.py (ne env var — tohle se nemění často):
```python
# Price filter for SOUKROMNIK scrapers
MIN_PRICE_CZK = 250_000
MIN_PRICE_EUR = 9500  # ~250000/25.5, rounded down for safety
```

### Krok 2: AutoScout24 — URL-level filtr + post-parse

**Soubor:** `lead_scout/scrapers/autoscout24.py`

**2a) URL-level (řádek 90):**
```python
# PŘED:
url = f"{base_url}/lst?sort=standard&desc=0&ustate=N%2CU&size=50&page={page}&atype=C&custtype=P"

# PO:
from lead_scout.config import MIN_PRICE_CZK, MIN_PRICE_EUR
price_from = MIN_PRICE_EUR if country in (Country.DE, Country.AT) else MIN_PRICE_CZK
url = f"{base_url}/lst?sort=standard&desc=0&ustate=N%2CU&size=50&page={page}&atype=C&custtype=P&pricefrom={price_from}"
```

**2b) Post-parse safety net (v `_parse_ad`, před return na řádku 239):**
```python
# Po parsování price (řádek ~165), před vytvořením ScoutLeadPayload:
if price is not None and price < MIN_PRICE_CZK:
    return None
```

**Poznámka:** Pokud `price is None` (nepodařilo se parsovat), lead PROPUSTÍME — raději false positive než ztracený drahý lead.

### Krok 3: Sauto — post-parse filtr

**Soubor:** `lead_scout/scrapers/sauto.py`

**V `_parse_card` (řádek 137), před return na řádku 232:**
```python
from lead_scout.config import MIN_PRICE_CZK

# Před vytvořením ScoutLeadPayload:
if price is not None and price < MIN_PRICE_CZK:
    return None
```

### Krok 4: Bazoš — post-parse filtr

**Soubor:** `lead_scout/scrapers/bazos.py`

**V `_parse_ad` (řádek 244), po parsování ceny (řádek 272) a PŘED fetch detail page (řádek 297):**
```python
from lead_scout.config import MIN_PRICE_CZK

# DŮLEŽITÉ: filtrovat PŘED fetch_detail aby se ušetřily HTTP requesty!
if price is not None and price < MIN_PRICE_CZK:
    return None
```

**Umístění je kritické** — filtr musí být PŘED `self._fetch_detail()` na řádku 297, protože jinak se zbytečně fetchuje detail page pro levné inzeráty. Ušetří to stovky HTTP requestů.

### Krok 5: Sbazar — post-parse filtr

**Soubor:** `lead_scout/scrapers/sbazar.py`

**V `_parse_card` (řádek 129), před return na řádku 186:**
```python
from lead_scout.config import MIN_PRICE_CZK

if price is not None and price < MIN_PRICE_CZK:
    return None
```

**Navíc** — Sbazar také fetchuje detail page pro telefon v `scrape()` (řádek 52-58, 74-80). Filtr v `_parse_card` zabrání zbytečnému fetchování detailu.

---

## 5. Acceptance Criteria

| # | Kritérium | Ověření |
|---|-----------|---------|
| AC-1 | Žádný lead s `vehicle_price < 250_000` CZK se nedostane do výsledků | Grep výstupu logů / DB query |
| AC-2 | Leady s `vehicle_price is None` (neparsovaná cena) PROJDOU filtrem | Kontrola logiky `if price is not None and price < MIN_PRICE_CZK` |
| AC-3 | AS24 DE/AT URL obsahuje `&pricefrom=9500` | Kontrola URL v logu |
| AC-4 | AS24 CZ URL obsahuje `&pricefrom=250000` | Kontrola URL v logu |
| AC-5 | Bazoš filtruje cenu PŘED fetch_detail (performance) | Code review — filtr je před řádkem 297 |
| AC-6 | Sbazar filtruje cenu PŘED fetch_phone (performance) | Filtr v `_parse_card` → detail se nefetchuje |
| AC-7 | Bazoš SK: EUR cena konvertovaná na CZK je filtrována správně | Test: 8000 EUR = 204000 CZK < 250000 → vyfiltrováno |
| AC-8 | Konstanta `MIN_PRICE_CZK` a `MIN_PRICE_EUR` v config.py | Code review |

---

## 6. STOP pravidla

| ID | Podmínka | Akce |
|----|----------|------|
| STOP-1 | AutoScout24 `pricefrom` parametr nefunguje (vrací i levné inzeráty) | Odebrat URL param, spoléhat jen na post-parse filtr |
| STOP-2 | Cena `None` u >50% leadů po filtraci | Eskalovat — problém s price parsingem, ne s filtrem |
| STOP-3 | Test run vrací 0 leadů | Ověřit že filtr není příliš agresivní, zkontrolovat cenový parsing |

---

## 7. Odhad změn

| Soubor | Typ změny | Řádky |
|--------|-----------|-------|
| `config.py` | Přidat 2 konstanty | +3 |
| `autoscout24.py` | URL param + post-parse filtr | ~+8 |
| `sauto.py` | Post-parse filtr | ~+4 |
| `bazos.py` | Post-parse filtr (před fetch_detail!) | ~+4 |
| `sbazar.py` | Post-parse filtr | ~+4 |
| **Celkem** | | **~23 řádků** |

---

## 8. Pořadí implementace

1. `config.py` — konstanty (ostatní soubory na nich závisí)
2. `autoscout24.py` — URL + post-parse (nejvíc změn)
3. `bazos.py` — post-parse PŘED fetch_detail (biggest performance win)
4. `sauto.py` — post-parse
5. `sbazar.py` — post-parse
