# PLAN: Rozšířit re_enrich.py o metadata (year, mileage, fuel, body_type)

**Datum:** 2026-05-20
**Task:** #25
**Soubory:**
- `/Users/zen/Projects/lead-scout/scripts/re_enrich.py` (171 řádků)
- `/Users/zen/Projects/lead-scout/lead_scout/scrapers/sauto.py` (Sauto `_fetch_detail`)
**Status:** TODO

---

## Analýza problému

### Co re_enrich.py aktuálně dělá

1. **`get_leads_to_enrich` (ř. 29-46):** Dotaz na leady s `vehicle_description IS NULL` — tj. jen leady BEZ popisu
2. **`update_lead` (ř. 49-74):** Aktualizuje POUZE `vehicle_description`, `vehicle_photos`, `vehicle_equipment`
3. **`enrich_bazos` (ř. 106-132):** Volá `_fetch_detail` → dostává 6 hodnot včetně `params` dict → **IGNORUJE `params`** (ř. 115)
4. **`enrich_sauto` (ř. 77-103):** Volá `_fetch_detail` → dostává 7 hodnot → používá jen desc/photos/equipment

### Co chybí

| Zdroj | Metadata v `_fetch_detail` | Využití v re_enrich.py |
|-------|---------------------------|----------------------|
| **Bazoš** | `params` dict s fuel, transmission, power, color + (po fix-v2) year, mileage, body_type | **IGNOROVÁNO** — unpacked ale nepoužito |
| **Sauto** | API vrací structured metadata (year, mileage, fuel...) ale `_fetch_detail` je NEEXTRAHUJE | **NEEXISTUJE** — API data zahozena |

### Dva problémy

1. **Existující leady:** Mají `vehicle_description` ale metadata jsou NULL — potřebujeme backfill
2. **Budoucí re-enrichment:** `re_enrich.py` i při novém spuštění ignoruje metadata

---

## Doporučení: Dva kroky

### Krok A: Standalone `backfill_metadata.py` (rychlý backfill existujících leadů)
- Čte leady které UŽ MAJÍ `vehicle_description` ale NEMAJÍ metadata
- Pro **Bazoš:** Spustí `_extract_params_from_text(description)` lokálně — **ŽÁDNÉ HTTP requesty**
- Pro **Sauto:** Volá API pro strukturovaná data NEBO text extrakce z uloženého popisu
- Aktualizuje DB

### Krok B: Rozšířit `re_enrich.py` (pro budoucí spuštění)
- Rozšířit `update_lead` o metadata parametry
- `enrich_bazos`: Využít `params` dict z `_fetch_detail` (který je aktuálně ignorován)
- `enrich_sauto`: Rozšířit Sauto `_fetch_detail` o metadata extrakci z API
- Přidat `--metadata-only` mód pro leady s description ale bez metadata

---

## Krok A: Nový script `backfill_metadata.py`

**Soubor:** `/Users/zen/Projects/lead-scout/scripts/backfill_metadata.py`

```python
#!/usr/bin/env python3
"""Backfill metadata (year, mileage, fuel, body_type) from existing descriptions.

For Bazoš: pure text extraction (no HTTP requests needed).
For Sauto: API call for structured data, text extraction fallback.

Usage: python3 scripts/backfill_metadata.py [--source SAUTO|BAZOS] [--limit N] [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import logging
import random
import re
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lead_scout.scrapers.bazos import _extract_params_from_text
from lead_scout.scrapers.sauto import SautoScraper
from lead_scout.scrapers.base import USER_AGENTS
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("backfill_metadata")

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "leads.db"


def get_leads_missing_metadata(source: str | None, limit: int) -> list[dict]:
    """Get leads that have description but are missing metadata fields."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    where_parts = [
        "source IN ('SAUTO', 'BAZOS')",
        "vehicle_description IS NOT NULL",
        "vehicle_description != ''",
        # Missing at least one key metadata field
        "("
        "  vehicle_year IS NULL"
        "  OR vehicle_mileage IS NULL"
        "  OR vehicle_fuel IS NULL"
        ")",
    ]
    if source:
        where_parts[0] = f"source = '{source}'"

    query = f"""
        SELECT id, source, source_id, source_url, vehicle_description,
               vehicle_year, vehicle_mileage, vehicle_fuel,
               vehicle_body_type, vehicle_transmission, vehicle_power, vehicle_color
        FROM leads
        WHERE {' AND '.join(where_parts)}
        LIMIT {limit}
    """
    rows = conn.execute(query).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_lead_metadata(lead_id: int, params: dict, dry_run: bool = False) -> None:
    """Update lead with extracted metadata. Only updates NULL fields."""
    # Map param keys to DB column names
    FIELD_MAP = {
        "year": ("vehicle_year", "INTEGER"),
        "mileage": ("vehicle_mileage", "INTEGER"),
        "fuel": ("vehicle_fuel", "TEXT"),
        "transmission": ("vehicle_transmission", "TEXT"),
        "power": ("vehicle_power", "INTEGER"),
        "color": ("vehicle_color", "TEXT"),
        "body_type": ("vehicle_body_type", "TEXT"),
    }

    updates = []
    values = []
    for param_key, (col_name, col_type) in FIELD_MAP.items():
        val = params.get(param_key)
        if val is not None:
            updates.append(f"{col_name} = COALESCE({col_name}, ?)")  # Only update if NULL
            values.append(val)

    if not updates:
        return

    if dry_run:
        logger.info("[DRY RUN] Would update lead #%d: %s", lead_id, params)
        return

    conn = sqlite3.connect(str(DB_PATH))
    values.append(lead_id)
    conn.execute(f"UPDATE leads SET {', '.join(updates)} WHERE id = ?", values)
    conn.commit()
    conn.close()


def backfill_bazos(leads: list[dict], dry_run: bool) -> tuple[int, int]:
    """Backfill Bazoš leads from existing description text. No HTTP needed."""
    updated = 0
    skipped = 0

    for lead in leads:
        desc = lead["vehicle_description"]
        if not desc:
            skipped += 1
            continue

        params = _extract_params_from_text(desc)
        if params:
            update_lead_metadata(lead["id"], params, dry_run)
            updated += 1
            logger.info("Backfill Bazoš #%d: %s", lead["id"], params)
        else:
            skipped += 1

    return updated, skipped


def backfill_sauto(leads: list[dict], dry_run: bool) -> tuple[int, int]:
    """Backfill Sauto leads. Try API for structured data, else text extraction."""
    updated = 0
    skipped = 0
    scraper = SautoScraper()

    for lead in leads:
        params: dict = {}

        # Strategy 1: Sauto API — structured metadata
        source_id = lead.get("source_id")
        if source_id:
            try:
                scraper._rate_limit()
                api_url = f"https://www.sauto.cz/api/v1/items/{source_id}"
                resp = httpx.get(
                    api_url, timeout=10, follow_redirects=True,
                    headers={"User-Agent": random.choice(USER_AGENTS), "Accept": "application/json"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if "result" in data and isinstance(data["result"], dict):
                        data = data["result"]

                    # Extract structured metadata from API
                    # NOTE: Implementor MUST verify actual API field names
                    # by inspecting a real API response first
                    if data.get("manufacture_year") or data.get("year"):
                        params["year"] = data.get("manufacture_year") or data.get("year")
                    if data.get("tachometer") or data.get("mileage"):
                        raw_km = data.get("tachometer") or data.get("mileage")
                        if isinstance(raw_km, (int, float)):
                            params["mileage"] = int(raw_km)
                    if data.get("fuel_type") or data.get("fuel"):
                        fuel_raw = (data.get("fuel_type") or data.get("fuel") or "")
                        if isinstance(fuel_raw, dict):
                            fuel_raw = fuel_raw.get("name", "")
                        params["fuel"] = _normalize_fuel(str(fuel_raw))
                    if data.get("body_type") or data.get("vehicle_body"):
                        bt = data.get("body_type") or data.get("vehicle_body")
                        if isinstance(bt, dict):
                            bt = bt.get("name", "")
                        params["body_type"] = str(bt)
                    if data.get("transmission") or data.get("gearbox"):
                        tr = data.get("transmission") or data.get("gearbox")
                        if isinstance(tr, dict):
                            tr = tr.get("name", "")
                        params["transmission"] = _normalize_transmission(str(tr))
            except Exception as e:
                logger.debug("Sauto API failed for #%d: %s", lead["id"], e)

        # Strategy 2: Text extraction from description (fallback)
        if not params:
            desc = lead["vehicle_description"]
            if desc:
                params = _extract_params_from_text(desc)

        if params:
            update_lead_metadata(lead["id"], params, dry_run)
            updated += 1
            logger.info("Backfill Sauto #%d: %s", lead["id"], params)
        else:
            skipped += 1

    return updated, skipped


def _normalize_fuel(raw: str) -> str:
    """Normalize Sauto API fuel type string to enum."""
    raw_lower = raw.lower()
    if "benzín" in raw_lower or "benzin" in raw_lower or "petrol" in raw_lower:
        return "PETROL"
    if "nafta" in raw_lower or "diesel" in raw_lower:
        return "DIESEL"
    if "hybrid" in raw_lower:
        return "HYBRID"
    if "elektro" in raw_lower or "electric" in raw_lower:
        return "ELECTRIC"
    if "lpg" in raw_lower:
        return "LPG"
    if "cng" in raw_lower:
        return "CNG"
    return raw.upper()


def _normalize_transmission(raw: str) -> str:
    """Normalize Sauto API transmission string to enum."""
    raw_lower = raw.lower()
    if "automat" in raw_lower or "dsg" in raw_lower:
        return "AUTOMATIC"
    if "manuál" in raw_lower or "manual" in raw_lower:
        return "MANUAL"
    return raw.upper()


def main():
    parser = argparse.ArgumentParser(description="Backfill metadata from descriptions")
    parser.add_argument("--source", choices=["SAUTO", "BAZOS"], help="Only backfill specific source")
    parser.add_argument("--limit", type=int, default=1000, help="Max leads to process")
    parser.add_argument("--dry-run", action="store_true", help="Show changes without writing to DB")
    args = parser.parse_args()

    logger.info("DB: %s", DB_PATH)
    leads = get_leads_missing_metadata(args.source, args.limit)
    logger.info("Found %d leads missing metadata", len(leads))

    if not leads:
        logger.info("Nothing to do.")
        return

    bazos_leads = [l for l in leads if l["source"] == "BAZOS"]
    sauto_leads = [l for l in leads if l["source"] == "SAUTO"]

    total_updated = 0
    total_skipped = 0

    if bazos_leads:
        logger.info("--- Bazoš: %d leads (no HTTP needed) ---", len(bazos_leads))
        u, s = backfill_bazos(bazos_leads, args.dry_run)
        total_updated += u
        total_skipped += s

    if sauto_leads:
        logger.info("--- Sauto: %d leads (API calls) ---", len(sauto_leads))
        u, s = backfill_sauto(sauto_leads, args.dry_run)
        total_updated += u
        total_skipped += s

    logger.info("=== DONE: updated=%d, skipped=%d ===", total_updated, total_skipped)


if __name__ == "__main__":
    main()
```

### Klíčové rozhodnutí

| Aspekt | Řešení |
|--------|--------|
| Bazoš backfill | `_extract_params_from_text(description)` lokálně — 0 HTTP requestů |
| Sauto backfill | API call pro structured metadata, text extraction fallback |
| Overwrite ochrana | `COALESCE(col, ?)` — aktualizuje JEN NULL pole |
| Dry run | `--dry-run` flag pro bezpečný test |

---

## Krok B: Rozšířit `re_enrich.py` pro budoucí spuštění

### B1: Rozšířit `update_lead` (ř. 49-74)

**Stávající signatura (ř. 49-50):**
```python
def update_lead(lead_id: int, description: str | None, photos: list[str] | None,
                equipment: list[str] | None) -> None:
```

**Nová signatura:**
```python
def update_lead(lead_id: int, description: str | None, photos: list[str] | None,
                equipment: list[str] | None, metadata: dict | None = None) -> None:
```

**Přidat za ř. 67 (za equipment block):**

```python
    if metadata:
        METADATA_FIELDS = {
            "year": "vehicle_year",
            "mileage": "vehicle_mileage",
            "fuel": "vehicle_fuel",
            "transmission": "vehicle_transmission",
            "power": "vehicle_power",
            "color": "vehicle_color",
            "body_type": "vehicle_body_type",
        }
        for param_key, col_name in METADATA_FIELDS.items():
            val = metadata.get(param_key)
            if val is not None:
                updates.append(f"{col_name} = COALESCE({col_name}, ?)")
                params.append(val)
```

### B2: Rozšířit `enrich_bazos` (ř. 106-132)

**Stávající (ř. 115-120):**
```python
phone, seller_name, desc, photos, equipment, params = scraper._fetch_detail(
    client, lead["source_url"], lead.get("source_id")
)

if desc or photos or equipment:
    update_lead(lead["id"], desc, photos if photos else None, equipment if equipment else None)
```

**Nový:**
```python
phone, seller_name, desc, photos, equipment, params = scraper._fetch_detail(
    client, lead["source_url"], lead.get("source_id")
)

if desc or photos or equipment or params:
    update_lead(
        lead["id"], desc,
        photos if photos else None,
        equipment if equipment else None,
        metadata=params if params else None,
    )
```

**Změna: 1 řádek → 5 řádků.** Přidáno `or params` do condition + `metadata=params` parametr.

### B3: Rozšířit `enrich_sauto` (ř. 77-103)

Sauto `_fetch_detail` aktuálně NEVRACÍ metadata. Dvě možnosti:

**Možnost 1 (DOPORUČENÁ): Rozšířit Sauto `_fetch_detail` return type**

Sauto API (ř. 286-344 v sauto.py) už stahuje JSON s plnými daty. Stačí přidat extrakci:

**Za ř. 341 v sauto.py (za `api_city` extrakci, PŘED `except`):**
```python
                    # Vehicle metadata from API
                    api_metadata: dict = {}
                    # NOTE: Field names are candidates — verify against real API response
                    for api_key, param_key in [
                        ("manufacture_year", "year"),
                        ("year", "year"),
                        ("tachometer", "mileage"),
                        ("mileage", "mileage"),
                    ]:
                        val = data.get(api_key)
                        if val is not None and isinstance(val, (int, float)) and param_key not in api_metadata:
                            api_metadata[param_key] = int(val)

                    # Fuel type — may be string or dict
                    fuel_raw = data.get("fuel_type") or data.get("fuel")
                    if fuel_raw:
                        if isinstance(fuel_raw, dict):
                            fuel_raw = fuel_raw.get("name", "")
                        fuel_str = str(fuel_raw).lower()
                        if "benzín" in fuel_str or "benzin" in fuel_str:
                            api_metadata["fuel"] = "PETROL"
                        elif "nafta" in fuel_str or "diesel" in fuel_str:
                            api_metadata["fuel"] = "DIESEL"
                        elif "hybrid" in fuel_str:
                            api_metadata["fuel"] = "HYBRID"
                        elif "elektro" in fuel_str or "electric" in fuel_str:
                            api_metadata["fuel"] = "ELECTRIC"

                    # Body type — may be string or dict
                    bt_raw = data.get("body_type") or data.get("vehicle_body")
                    if bt_raw:
                        if isinstance(bt_raw, dict):
                            bt_raw = bt_raw.get("name", "")
                        api_metadata["body_type"] = str(bt_raw)

                    # Transmission
                    tr_raw = data.get("transmission") or data.get("gearbox")
                    if tr_raw:
                        if isinstance(tr_raw, dict):
                            tr_raw = tr_raw.get("name", "")
                        tr_str = str(tr_raw).lower()
                        if "automat" in tr_str or "dsg" in tr_str:
                            api_metadata["transmission"] = "AUTOMATIC"
                        elif "manuál" in tr_str or "manual" in tr_str:
                            api_metadata["transmission"] = "MANUAL"
```

**Změnit return type `_fetch_detail` (ř. 259-262):**

```python
# STÁVAJÍCÍ:
def _fetch_detail(self, page, url: str) -> tuple[
    Optional[str], Optional[str], Optional[Category], Optional[str],
    Optional[str], list[str], list[str],
]:

# NOVÝ:
def _fetch_detail(self, page, url: str) -> tuple[
    Optional[str], Optional[str], Optional[Category], Optional[str],
    Optional[str], list[str], list[str], dict,
]:
```

**Změnit return statement (ř. 438):**
```python
# STÁVAJÍCÍ:
return phone, seller_name, seller_category, city, api_description, api_photos, api_equipment

# NOVÝ:
return phone, seller_name, seller_category, city, api_description, api_photos, api_equipment, api_metadata
```

**POZOR — Callers update:** Všechna místa kde se volá `_fetch_detail` musí unpacking aktualizovat:

1. **`sauto.py` ř. 86-87** (hlavní `scrape` loop):
```python
# STÁVAJÍCÍ:
(phone, seller_name, seller_cat, detail_city,
 description, photos, equipment) = self._fetch_detail(page, lead.source_url)

# NOVÝ:
(phone, seller_name, seller_cat, detail_city,
 description, photos, equipment, metadata) = self._fetch_detail(page, lead.source_url)
```
A přidat za ř. 104:
```python
                                # Metadata from API
                                if metadata:
                                    if metadata.get("fuel") and not lead.vehicle_fuel:
                                        lead.vehicle_fuel = metadata["fuel"]
                                    if metadata.get("transmission") and not lead.vehicle_transmission:
                                        lead.vehicle_transmission = metadata["transmission"]
                                    if metadata.get("body_type") and not lead.vehicle_body_type:
                                        lead.vehicle_body_type = metadata["body_type"]
                                    # year/mileage usually from listing card, API is fallback
                                    if metadata.get("year") and not lead.vehicle_year:
                                        lead.vehicle_year = metadata["year"]
                                    if metadata.get("mileage") and not lead.vehicle_mileage:
                                        lead.vehicle_mileage = metadata["mileage"]
```

2. **`re_enrich.py` ř. 88** (`enrich_sauto`):
```python
# STÁVAJÍCÍ:
phone, seller_name, seller_cat, city, desc, photos, equipment = scraper._fetch_detail(page, lead["source_url"])

# NOVÝ:
phone, seller_name, seller_cat, city, desc, photos, equipment, metadata = scraper._fetch_detail(page, lead["source_url"])
```
A ř. 91:
```python
# STÁVAJÍCÍ:
update_lead(lead["id"], desc, photos if photos else None, equipment if equipment else None)

# NOVÝ:
update_lead(lead["id"], desc, photos if photos else None, equipment if equipment else None, metadata=metadata if metadata else None)
```

**Možnost 2 (JEDNODUŠŠÍ): Text extrakce v re_enrich.py** — bez změny Sauto `_fetch_detail`:
```python
# V enrich_sauto, za update_lead:
if desc:
    from lead_scout.scrapers.bazos import _extract_params_from_text
    params = _extract_params_from_text(desc)
    if params:
        update_lead_metadata(lead["id"], params)
```
Méně přesné ale 0 změn v sauto.py.

### B4: Přidat `--metadata-only` mód (volitelný)

**Nový query v `get_leads_to_enrich` (ř. 29-46):**

Přidat parametr `metadata_only: bool = False`:
```python
def get_leads_to_enrich(source: str | None, limit: int, metadata_only: bool = False) -> list[dict]:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    if metadata_only:
        # Leads that have description but are missing metadata
        where_parts = [
            "source IN ('SAUTO', 'BAZOS')",
            "vehicle_description IS NOT NULL AND vehicle_description != ''",
            "(vehicle_year IS NULL OR vehicle_mileage IS NULL OR vehicle_fuel IS NULL)",
        ]
    else:
        where_parts = [
            "source IN ('SAUTO', 'BAZOS')",
            "source_url IS NOT NULL AND source_url != ''",
            "(vehicle_description IS NULL OR vehicle_description = '')",
        ]

    if source:
        where_parts[0] = f"source = '{source}'"

    cols = "id, source, source_id, source_url"
    if metadata_only:
        cols += ", vehicle_description"

    query = f"SELECT {cols} FROM leads WHERE {' AND '.join(where_parts)} LIMIT {limit}"
    rows = conn.execute(query).fetchall()
    conn.close()
    return [dict(r) for r in rows]
```

V `main()` přidat argument:
```python
parser.add_argument("--metadata-only", action="store_true", help="Only backfill metadata for leads that already have description")
```

---

## Souhrnná tabulka změn

| Soubor | Řádky | Akce | Detail |
|--------|-------|------|--------|
| `scripts/backfill_metadata.py` | NOVÝ | ➕ VYTVOŘIT | Standalone backfill script (~160 řádků) |
| `scripts/re_enrich.py` ř. 49-50 | Signatura | 🔧 FIX | Přidat `metadata: dict | None = None` parametr |
| `scripts/re_enrich.py` za ř. 67 | Za equipment | ➕ PŘIDAT | Metadata fields do UPDATE (~10 řádků) |
| `scripts/re_enrich.py` ř. 115-120 | enrich_bazos | 🔧 FIX | Přidat `metadata=params` do `update_lead` call |
| `scripts/re_enrich.py` ř. 88-91 | enrich_sauto | 🔧 FIX | Unpack metadata, předat do `update_lead` |
| `scripts/re_enrich.py` ř. 29-46 | get_leads | ➕ PŘIDAT | `--metadata-only` mód (volitelný) |
| `scrapers/sauto.py` ř. 259-262 | return type | 🔧 FIX | Přidat `dict` do tuple |
| `scrapers/sauto.py` za ř. 341 | API extrakce | ➕ PŘIDAT | Metadata extrakce z API response (~30 řádků) |
| `scrapers/sauto.py` ř. 438 | return | 🔧 FIX | Přidat `api_metadata` do return |
| `scrapers/sauto.py` ř. 86-87 | caller | 🔧 FIX | Unpack 8. hodnotu (metadata) |
| `scrapers/sauto.py` za ř. 104 | caller | ➕ PŘIDAT | Wire metadata do lead objektu (~10 řádků) |

---

## Pořadí implementace

1. **PRVNÍ: `backfill_metadata.py`** — rychlý win, backfillne existující leady. Bazoš nepotřebuje HTTP. Spustit s `--dry-run` nejdřív.
2. **DRUHÝ: Rozšířit `update_lead` v `re_enrich.py`** — přidá metadata parametr
3. **TŘETÍ: Wire Bazoš params** — 1 řádek v `enrich_bazos`
4. **ČTVRTÝ: Sauto API metadata** — rozšířit `_fetch_detail` + callers

**DŮLEŽITÉ:** Krok 4 mění Sauto `_fetch_detail` return type → musí se aktualizovat VŠICHNI callers (sauto.py ř. 86 + re_enrich.py ř. 88). Jinak runtime crash.

---

## Závislost na plan-bazos-fix-v2

`backfill_metadata.py` importuje `_extract_params_from_text` z `bazos.py`. Pokud fix-v2 JEŠTĚ NENÍ implementován, extrakce bude mít jen fuel/transmission/power/color (bez year/mileage/body_type).

**Doporučení:** Implementovat plan-bazos-fix-v2 (task #19) PŘED spuštěním `backfill_metadata.py`.

---

## Sauto API field discovery

**KRITICKÉ:** Implementátor MUSÍ ověřit reálné API field names. V plánu jsou kandidáti:
- `manufacture_year` / `year` → rok výroby
- `tachometer` / `mileage` → km
- `fuel_type` / `fuel` → palivo (může být dict s `name`)
- `body_type` / `vehicle_body` → karoserie
- `transmission` / `gearbox` → převodovka

**Jak ověřit:**
```python
import httpx, json
resp = httpx.get("https://www.sauto.cz/api/v1/items/210458669", follow_redirects=True)
data = resp.json()
if "result" in data:
    data = data["result"]
print(json.dumps(data, indent=2, ensure_ascii=False))
# Hledat klíče obsahující: year, mileage, km, fuel, body, transmission, gearbox
```

---

## Error handling

| Scénář | Chování |
|--------|---------|
| Description je None | Skip lead, nedá se extrahovat |
| `_extract_params_from_text` vrátí prázdný dict | Skip, nic k aktualizaci |
| Sauto API 404 | Fallback na text extraction z uloženého popisu |
| API field name neexistuje | `data.get()` vrátí None → skip |
| `COALESCE` v SQL | Nepřepisuje existující data — jen plní NULL |
| Neznámý fuel type z API | `_normalize_fuel` vrátí raw.upper() |

---

## Deploy

1. `scp scripts/backfill_metadata.py server:~/lead-scout/scripts/`
2. Na serveru: `cd ~/lead-scout && python3 scripts/backfill_metadata.py --dry-run` (ověřit)
3. `python3 scripts/backfill_metadata.py` (reálný run)
4. Po rozšíření re_enrich.py: `scp scripts/re_enrich.py server:~/lead-scout/scripts/`

---

## Acceptance Criteria

- [ ] `backfill_metadata.py` běží bez chyb s `--dry-run`
- [ ] Bazoš leady: vehicle_year, vehicle_mileage, vehicle_fuel se plní z description textu
- [ ] Sauto leady: metadata z API (preferenčně) nebo text extraction (fallback)
- [ ] `COALESCE` ochrana: existující non-NULL hodnoty se nepřepisují
- [ ] `re_enrich.py` `update_lead` přijímá `metadata` dict
- [ ] `enrich_bazos` předává `params` do `update_lead`
- [ ] `enrich_sauto` extrahuje a předává metadata z API
- [ ] Sauto `_fetch_detail` return type change nerozbije existující callers

---

## Odhad rozsahu

| Část | Nový kód | Upravený kód |
|------|----------|--------------|
| `backfill_metadata.py` | ~160 řádků | 0 |
| `re_enrich.py` rozšíření | ~15 řádků | ~10 řádků |
| `sauto.py` metadata | ~40 řádků | ~5 řádků |
| **Celkem** | **~215 řádků** | **~15 řádků** |

**Riziko:** NÍZKÉ pro backfill (read-only + COALESCE), STŘEDNÍ pro Sauto return type change (callers)
