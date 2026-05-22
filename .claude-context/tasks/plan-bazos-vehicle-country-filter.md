# PLÁN: Audit Bazoš scraper — SK/CZ detekce + filtr nákladních vozidel

**Datum:** 2026-05-20
**Priorita:** P0 (špatná data v produkci)
**Cesta:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/bazos.py`

---

## EXECUTIVE SUMMARY

Bazoš scraper má **3 zásadní bugy**:

1. **Country hardcoded CZ** — `_parse_ad()` řádek 148: `country=Country.CZ` je hardcoded. I leady z `auto.bazos.sk` mají country=CZ.
2. **Žádný filtr typu vozidla** — scraper stahuje VŠECHNY inzeráty z `auto.bazos.cz/` včetně nákladních aut, přívěsů, strojů, čtyřkolek. Carmakler řeší osobní auta.
3. **Cena bez konverze měny** — `_parse_price()` vrací holé číslo. Na .sk je cena v EUR, ale systém ji ukládá jako CZK. Lead "17 900 EUR" se zobrazí jako "17 900 Kč" (reálně ~450 000 Kč).

---

## BUG 1: Country hardcoded CZ

### Příčina

`bazos.py:148`:
```python
return ScoutLeadPayload(
    category=Category.SOUKROMNIK,
    country=Country.CZ,     # ← HARDCODED! Mělo by být country parametr
    ...
)
```

Metoda `scrape()` přijímá `country` parametr a správně vybírá URL doménu:
```python
base = AUTO_URL if country == Country.CZ else "https://auto.bazos.sk"
```

Ale `_parse_ad()` nedostává `country` parametr a hardcoduje CZ.

### Fix

Předat `country` přes celý call chain:

```python
def scrape(self, query: str, country: Country) -> ScraperResult:
    ...
    leads = self._scrape_listing_page(client, base, query, offset, country)
    ...

def _scrape_listing_page(self, client, base_url: str, query: str, offset: int, country: Country) -> list[ScoutLeadPayload]:
    ...
    lead = self._parse_ad(client, ad, base_url, country)
    ...

def _parse_ad(self, client, ad_el, base_url: str, country: Country) -> Optional[ScoutLeadPayload]:
    ...
    return ScoutLeadPayload(
        category=Category.SOUKROMNIK,
        country=country,          # ← FIX: použít parametr
        ...
    )
```

**Alternativa (jednodušší):** Detekovat country z `base_url`:
```python
country = Country.SK if "bazos.sk" in base_url else Country.CZ
```

---

## BUG 2: Žádný filtr typu vozidla

### Příčina

Scraper stahuje `auto.bazos.cz/?crz={offset}` — což je **celá sekce "auto"** na Bazoši, zahrnující:

- Osobní automobily ✅ (to co chceme)
- Nákladní a užitková vozidla ❌
- Přívěsy a návěsy ❌
- Motorky ❌
- Čtyřkolky ❌
- Zemědělské a stavební stroje ❌
- Dodávky ❌
- Autobusy ❌
- Obytné vozy ❌ (na hraně, ale ne priorita)

### Fix — Varianta A: URL filtr (PREFEROVÁNO)

Bazoš.cz má sekce s URL paths. Omezit scraper na osobní auta:

```python
# Místo:
AUTO_URL = "https://auto.bazos.cz"

# Použít specifičtější URL pro osobní auta:
# Bazoš nemá přímý path pro "pouze osobní", ale search lze omezit
# přes kategorii v URL. Ověřit reálnou URL strukturu.
```

**POZOR:** Bazoš.cz URL struktura se může lišit. Implementátor MUSÍ ověřit aktuální URL strukturu na webu. Některé varianty:
- `auto.bazos.cz/osobni/` — pokud existuje
- `auto.bazos.cz/?hledat=&ruession=osobni&...` — přes search parametry

### Fix — Varianta B: Keyword filtr na title (SPOLEHLIVĚJŠÍ)

Filtrovat v `_parse_ad()` na základě listing title. Nákladní/užitková vozidla mají v titulku charakteristické klíčová slova:

```python
# Klíčová slova indikující NE-osobní vozidlo
NON_PERSONAL_KEYWORDS = [
    # Nákladní
    r"\bnákladní\b",
    r"\bkamion\b",
    r"\btahač\b",
    r"\bpřívěs\b",
    r"\bnávěs\b",
    r"\bskříň\b",              # Skříňové nástavby
    r"\bvalník\b",
    r"\bnosič kontejnerů\b",
    r"\bhákový\b",              # Hákový nakladač
    r"\bhydraulická ruka\b",
    r"\bjeřáb\b",
    r"\bcisterna\b",
    r"\bmíchačka\b",            # Autodomíchávač

    # Užitková (velká)
    r"\bdodávka\b",             # Na hraně — malé dodávky mohou být relevantní
    r"\btransporter\b",
    r"\bsprinter\b",            # Mercedes Sprinter (dodávka)

    # Stroje / zemědělství
    r"\btraktor\b",
    r"\bnakladač\b",
    r"\bbagr\b",
    r"\bbuldozer\b",
    r"\bkombajn\b",
    r"\bvysokzdviž\b",
    r"\bvzv\b",                 # Vysokozdvižný vozík

    # Motorky / čtyřkolky
    r"\bmotork[ay]\b",
    r"\bskútr\b",
    r"\bčtyřkolk[ay]\b",
    r"\batv\b",
    r"\benduro\b",
    r"\bchopper\b",

    # Autobusy
    r"\bautobus\b",
    r"\bminibus\b",

    # Přívěsy
    r"\bvozík\b",               # Přívěsný vozík
    r"\bkaravan\b",

    # Speciální
    r"\bstavební\b.*\bstroj\b",
    r"\bzemědělsk\b",
    r"\blesní\b.*\bstroj\b",
]

_NON_PERSONAL_RE = re.compile("|".join(NON_PERSONAL_KEYWORDS), re.IGNORECASE)

def _is_personal_vehicle(title: str) -> bool:
    """Check if listing title indicates a personal vehicle (not truck/machinery)."""
    return not bool(_NON_PERSONAL_RE.search(title))
```

Aplikovat v `_parse_ad()`:
```python
def _parse_ad(self, client, ad_el, base_url: str, country: Country) -> Optional[ScoutLeadPayload]:
    ...
    title = title_el.get_text(strip=True)
    ...
    # Filter out non-personal vehicles
    if not self._is_personal_vehicle(title):
        logger.debug("Filtered non-personal vehicle: %s", title)
        return None
    ...
```

### Fix — Varianta C: Kombinace A + B

Použít URL filtr pro primární omezení + keyword filtr jako záchrannou síť. **DOPORUČENO.**

### Pozn. k "dodávka"

Malé dodávky (VW Caddy, Citroën Berlingo) mohou být relevantní pro Carmakler. Ale velké dodávky (Mercedes Sprinter, Iveco Daily) ne. Pattern `\bdodávka\b` je na hraně. Zvážit:
- Nefiltrovat dodávky vůbec (nechat projít)
- NEBO filtrovat jen specificky velké: `\bsprinter\b`, `\biveco\b.*\bdaily\b`

**Doporučení:** Nefiltrovat dodávky — lepší mít false positive než miss relevantní lead.

---

## BUG 3: Cena bez konverze měny

### Příčina

`_parse_price()` řádek 216-222:
```python
@staticmethod
def _parse_price(text: str) -> Optional[int]:
    cleaned = re.sub(r"[^\d\s]", "", text).strip()
    cleaned = cleaned.replace(" ", "")
    return int(cleaned) if cleaned else None
```

Prostě vezme číslo. Na Bazoš.sk je cena v EUR (např. "17 900 €") ale uloží se jako `vehicle_price=17900` — systém pak zobrazí jako 17 900 Kč místo ~450 000 Kč.

### Fix

Konverze v `_parse_ad()` na základě country:

```python
price = self._parse_price(price_text)

# EUR → CZK conversion for SK listings
if price and country == Country.SK:
    price = int(price * 25.5)  # Approximate EUR→CZK rate
```

**Pozn:** Hardcoded kurz 25.5 je dostatečný pro odhad. Přesný kurz není nutný — jde o cenotvorbu na bazarovém trhu, ne účetnictví. AutoScout24 scraper (`autoscout24.py:193`) používá stejný přístup.

### Alternativa: Detekce měny z textu

```python
@staticmethod
def _parse_price_with_currency(text: str, country: Country) -> Optional[int]:
    """Parse price and convert to CZK if EUR."""
    if not text:
        return None
    
    is_eur = "€" in text or "eur" in text.lower()
    cleaned = re.sub(r"[^\d\s]", "", text).strip().replace(" ", "")
    
    try:
        amount = int(cleaned) if cleaned else None
    except ValueError:
        return None
    
    if amount and (is_eur or country == Country.SK):
        return int(amount * 25.5)
    return amount
```

**DOPORUČENÍ:** Použít obě heuristiky (country + symbol "€"/"EUR") — pokud je country=SK NEBO text obsahuje €/EUR → konverze.

---

## KOMPLETNÍ DIFF SUMMARY

### bazos.py — ZMĚNY

| Řádek | Aktuálně | Nově |
|-------|----------|------|
| 34 | OK — správně rozlišuje URL | OK |
| 40 | `leads = self._scrape_listing_page(client, base, query, offset)` | Přidat `country` parametr |
| 53 | `def _scrape_listing_page(self, client, base_url, query, offset)` | Přidat `country: Country` |
| 78 | `lead = self._parse_ad(client, ad, base_url)` | Přidat `country` |
| 87 | `def _parse_ad(self, client, ad_el, base_url)` | Přidat `country: Country` |
| 109 | `price = self._parse_price(price_text)` | + EUR konverze pro SK |
| 146-148 | `country=Country.CZ` hardcoded | `country=country` |
| Nové | — | `_is_personal_vehicle()` filtr |
| Nové | — | `NON_PERSONAL_KEYWORDS` seznam |

### scheduler.py — BEZ ZMĚN

Scheduler už správně volá `_run_scraper("BAZOS", query, "CZ")` a `_run_scraper("BAZOS", "", "SK")`. Country parametr se předá do `scraper.scrape(country=country_enum)`. Problém je jen uvnitř scraperu.

---

## TESTOVÁNÍ

1. **Country fix:**
   ```bash
   python -m lead_scout scrape bazos --country SK --limit 5
   ```
   Ověřit: leady mají `country=SK`, ne CZ.

2. **Vehicle type filtr:**
   ```bash
   python -m lead_scout scrape bazos --limit 20
   ```
   Ověřit log: "Filtered non-personal vehicle: Hydraulická ruka..." se zobrazí.
   Ověřit: žádný kamion/tahač/přívěs v saved leadech.

3. **Price konverze:**
   ```bash
   python -m lead_scout scrape bazos --country SK --limit 5
   ```
   Ověřit: cena 17 900 EUR → uloženo jako ~456 000 (ne 17 900).

4. **Regression:**
   ```bash
   python -m lead_scout scrape bazos --country CZ --limit 10
   ```
   Ověřit: CZ leady stále fungují normálně, ceny v CZK bez konverze.

## STOP pravidla

- **STOP-1:** Pokud Bazoš.cz URL struktura nemá path pro "osobní auta" → spoléhat na keyword filtr (Varianta B)
- **STOP-2:** Pokud keyword filtr odfiltruje legitimní osobní auto (false positive) → pattern je příliš agresivní, upravit
- **STOP-3:** Pokud EUR kurz se výrazně změní (> 28 CZK/EUR) → zvážit dynamic rate z API (ale pro MVP hardcoded stačí)

## SQL CLEANUP

Vyčistit existující špatné leady v DB:

```sql
-- Opravit country pro SK leady (detekce přes source_url)
UPDATE leads 
SET country = 'SK', updated_at = datetime('now')
WHERE source = 'BAZOS' 
  AND source_url LIKE '%bazos.sk%' 
  AND country = 'CZ';

-- Smazat nákladní vozidla (best-effort keyword match)
DELETE FROM leads 
WHERE source = 'BAZOS' 
  AND category = 'SOUKROMNIK'
  AND (
    listing_title LIKE '%nákladní%'
    OR listing_title LIKE '%kamion%'
    OR listing_title LIKE '%tahač%'
    OR listing_title LIKE '%přívěs%'
    OR listing_title LIKE '%návěs%'
    OR listing_title LIKE '%traktor%'
    OR listing_title LIKE '%bagr%'
    OR listing_title LIKE '%nakladač%'
    OR listing_title LIKE '%autobus%'
    OR listing_title LIKE '%hydraulická ruka%'
    OR listing_title LIKE '%hákový%'
    OR listing_title LIKE '%cisterna%'
    OR listing_title LIKE '%vysokozdviž%'
    OR listing_title LIKE '%motorka%'
    OR listing_title LIKE '%čtyřkolka%'
    OR listing_title LIKE '%skútr%'
  );

-- Přepočítat ceny SK leadů (EUR → CZK)
UPDATE leads 
SET vehicle_price = CAST(vehicle_price * 25.5 AS INTEGER),
    updated_at = datetime('now')
WHERE source = 'BAZOS' 
  AND country = 'SK' 
  AND vehicle_price IS NOT NULL
  AND vehicle_price < 100000;  -- Safety: jen leady kde cena vypadá jako EUR (< 100k)
```
