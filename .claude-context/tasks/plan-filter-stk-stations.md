# PLÁN: Filtrování STK stanic z kategorie AUTOBAZAR

**Datum:** 2026-05-20
**Priorita:** P1 (data quality)
**Cesta:** `/Users/zen/Projects/lead-scout/lead_scout/`

---

## Problém

STK stanice (Stanice technické kontroly), emisní stanice a další non-autobazar podniky jsou chybně kategorizované jako `AUTOBAZAR`. Např. "STK Bohdalec", "Emisní stanice Praha", "Autoškola XY".

Příčina: Scrapery hledají query "STK" a "autoškola" jako autobazar-related business:
- `firmy_cz.py` řádek 32: `SEARCH_QUERIES[AUTOBAZAR]` obsahuje `"STK"`
- `zlatestranky.py` řádek 23: `DEFAULT_QUERIES` obsahuje `"STK"`, `"autoškola"`, `"autopůjčovna"`
- `ares.py` řádek 37: queries obsahují `"STK"`, `"autoškola"`, `"čerpací stanice"`

## Řešení

### Krok 1: Globální blacklist/filter modul

**Nový soubor:** `lead_scout/filters.py`

```python
"""Lead filtering — reject non-relevant businesses before saving."""

import re

# Business names/types that should NOT be categorized as AUTOBAZAR
EXCLUDED_NAME_PATTERNS = [
    r"\bSTK\b",                     # Stanice technické kontroly
    r"\bstanice technické kontroly\b",
    r"\bemisn[ií]\b",               # Emisní stanice
    r"\bautoškol[ay]?\b",           # Autoškoly
    r"\bautopůjčovn[ay]?\b",       # Autopůjčovny
    r"\bčerpací stanic[ei]\b",     # Čerpací stanice
    r"\btankstelle\b",              # German gas stations
    r"\bfahrschule\b",             # German driving schools
    r"\bmytí\b.*\baut\b",          # Ruční mytí aut
    r"\bautomyčk[ay]?\b",          # Automyčky
]

# Compiled regex for performance
_EXCLUDED_RE = re.compile(
    "|".join(EXCLUDED_NAME_PATTERNS),
    re.IGNORECASE
)


def is_excluded_business(name: str) -> bool:
    """Check if business name matches exclusion patterns.
    
    Returns True if the business should be EXCLUDED (not saved).
    """
    return bool(_EXCLUDED_RE.search(name))
```

### Krok 2: Aplikovat filtr v db.py `save_lead()`

**Soubor:** `lead_scout/db.py`

Přidat filtraci před save pro AUTOBAZAR kategorie:

```python
from lead_scout.filters import is_excluded_business

def save_lead(self, lead: ScoutLeadPayload) -> Optional[int]:
    """Save a lead to the database. Returns row ID or None if filtered/duplicate."""
    if not lead.phone or not lead.phone.strip():
        return None

    # Filter out non-relevant businesses
    if lead.category == Category.AUTOBAZAR and is_excluded_business(lead.name):
        logger.debug("Filtered out non-autobazar: %s", lead.name)
        return None

    if self.is_duplicate(lead):
        return None

    # ... rest of save logic
```

### Krok 3: Odstranit "STK" z search queries

**Soubor:** `lead_scout/scrapers/firmy_cz.py` řádek 32

Odebrat `"STK"` z `SEARCH_QUERIES[Category.AUTOBAZAR]`:

```python
SEARCH_QUERIES = {
    Category.AUTOBAZAR: [
        "autobazar", "autosalon", "prodej aut", "ojeté vozy",
        "autoservis", "autoopravna", "pneuservis",
        # STK ODSTRANĚNO — STK stanice nejsou autobazary
    ],
    ...
}
```

**Soubor:** `lead_scout/scrapers/zlatestranky.py` řádek 21-24

Odebrat `"STK"`, `"autoškola"`, `"autopůjčovna"`:

```python
DEFAULT_QUERIES = [
    "autobazar", "autoservis", "vrakoviště", "autodíly", "prodej aut",
    "autosalon", "ojeté vozy", "autovraky", "rozborka aut", "pneuservis",
    "autolakovna",
    # STK, autoškola, autopůjčovna ODSTRANĚNY — nejsou autobazary
]
```

**Soubor:** `lead_scout/scrapers/ares.py` řádek 32-38

Odebrat `"STK"`, `"autoškola"`, `"čerpací stanice"`:

```python
queries = [query] if query else [
    "autobazar", "autoservis", "vrakoviště", "autodíly",
    "autosalon", "prodej aut", "ojeté vozy", "autovraky",
    "rozborka aut", "autoopravna", "pneuservis", "autolakovna",
    "karosárna", "autokosmetika", "autoelektrika",
    # STK, autoškola, autopůjčovna, čerpací stanice ODSTRANĚNY
]
```

### Krok 4: Vyčistit existující data

Jednorázový SQL příkaz v SQLite:

```sql
DELETE FROM leads 
WHERE category = 'AUTOBAZAR' 
AND (
    name LIKE '%STK%'
    OR name LIKE '%stanice technické kontroly%'
    OR name LIKE '%emisní%'
    OR name LIKE '%autoškol%'
    OR name LIKE '%autopůjčovn%'
    OR name LIKE '%čerpací stanic%'
    OR name LIKE '%automyčk%'
);
```

Přidat CLI příkaz `clean-stk`:

```python
@cli.command()
def clean_stk():
    """Remove STK stations and non-autobazar businesses from database."""
    db = LeadDB()
    # ... execute cleanup SQL
    db.close()
```

---

## Dvojvrstvá obrana

1. **Vrstva 1 (query):** Neposílat query které přinášejí irrelevantní výsledky
2. **Vrstva 2 (filter):** Regex blacklist zachytí i STK stanice nalezené přes jiné queries (např. query "autoservis" může vrátit "Autoservis + STK Bohdalec")

## STOP pravidla

- **STOP-1:** Pokud regex filtr odfiltruje legitimní autobazar (např. "STK a Autoservis Novák s.r.o. — prodej ojetých vozů") → regex je příliš agresivní, upravit

## Testování

1. `python -m lead_scout scrape firmy-cz` → log neobsahuje STK stanice
2. `python -m lead_scout stats` → snížení počtu AUTOBAZAR leadů
3. Manuálně ověřit: žádný legitimní autobazar nebyl odfiltrován
