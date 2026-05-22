# PLÁN: Track Autobazar Inventory Size (+/- count)

**Datum:** 2026-05-20
**Priorita:** P2
**Cesta:** `/Users/zen/Projects/lead-scout/` + `/Users/zen/Projects/cmklv2/cmklv2/`

---

## Problém

Nemáme data o velikosti autobazaru — nevíme kolik aut nabízí. Větší autobazar = vyšší priorita pro Carmakler obchodníky. Aktuálně `estimated_size` (SMALL/MEDIUM/LARGE) je hrubý odhad z ARES právní formy (s.r.o. = MEDIUM, a.s. = LARGE), bez reálných dat.

## Koncept

**Inventory tracking = počet inzerátů (aktivních aut) na platformě per dealer.**

Data jsou dostupná z **listing platforem** kde vidíme kolik inzerátů má daný prodejce:
- **TipCars** — dealer name z `advertisement-footer-content`, můžeme countovat kolik karet patří jednomu dealerovi
- **Sauto** — seller_name z detail pages, dealer badge detekce
- **AutoScout24** — seller info z listing karet

Business directory scrapery (Firmy.cz, Zlatéstránky, ARES) tuto informaci **nemají** — nevidí kolik aut dealer nabízí.

---

## Řešení

### Krok 1: DB schema — nové sloupce v SQLite

**Soubor:** `lead_scout/db.py`

Přidat sloupce do safe migration v `_init_db()`:

```python
# Inventory tracking columns
for col, typedef in [
    ("estimated_inventory", "INTEGER"),          # Počet aut (inzerátů)
    ("prev_inventory", "INTEGER"),               # Předchozí count (pro trend)
    ("inventory_updated_at", "TEXT"),             # Kdy naposledy aktualizováno
    ("inventory_source", "TEXT"),                 # Z které platformy (TIPCARS, SAUTO, ...)
]:
    try:
        conn.execute(f"ALTER TABLE leads ADD COLUMN {col} {typedef}")
    except sqlite3.OperationalError:
        pass
```

### Krok 2: Nový modul `inventory.py`

**Nový soubor:** `lead_scout/inventory.py`

```python
"""Inventory tracking — count dealer listings on platforms."""

import logging
from datetime import datetime
from typing import Optional

from lead_scout.db import LeadDB

logger = logging.getLogger(__name__)


class InventoryTracker:
    """Track how many listings each autobazar has on scraping platforms."""

    def __init__(self, db: Optional[LeadDB] = None):
        self.db = db or LeadDB()

    def update_inventory(self, dealer_name: str, listing_count: int, source: str) -> None:
        """Update inventory count for a dealer lead.

        Matches by normalized name + category=AUTOBAZAR.
        Saves prev_inventory for trend tracking.
        """
        conn = self.db._get_conn()
        now = datetime.utcnow().isoformat()
        
        # Find matching AUTOBAZAR lead by name (case-insensitive)
        row = conn.execute(
            """SELECT id, estimated_inventory FROM leads 
               WHERE category = 'AUTOBAZAR' 
               AND LOWER(TRIM(name)) = LOWER(TRIM(?))
               ORDER BY score DESC LIMIT 1""",
            (dealer_name,),
        ).fetchone()

        if row:
            prev = row["estimated_inventory"]
            conn.execute(
                """UPDATE leads 
                   SET estimated_inventory = ?,
                       prev_inventory = ?,
                       inventory_updated_at = ?,
                       inventory_source = ?,
                       updated_at = ?
                   WHERE id = ?""",
                (listing_count, prev, now, source, now, row["id"]),
            )
            conn.commit()

            # Log significant changes
            if prev is not None and prev > 0:
                delta = listing_count - prev
                pct = (delta / prev) * 100
                if abs(pct) > 20:
                    logger.info(
                        "Inventory change: %s — %d → %d (%+d, %+.0f%%)",
                        dealer_name, prev, listing_count, delta, pct,
                    )

    def bulk_update(self, dealer_counts: dict[str, int], source: str) -> int:
        """Update inventory for multiple dealers at once.
        
        Args:
            dealer_counts: {dealer_name: listing_count}
            source: Source platform (e.g. "TIPCARS")
            
        Returns: number of dealers updated.
        """
        updated = 0
        for name, count in dealer_counts.items():
            self.update_inventory(name, count, source)
            updated += 1
        logger.info("Inventory bulk update (%s): %d dealers", source, updated)
        return updated
```

### Krok 3: TipCars — countovat inzeráty per dealer

**Soubor:** `lead_scout/scrapers/tipcars.py`

TipCars je ideální zdroj — scrape stránku inzerátů, každá karta má dealer name v footeru. Aktuálně `_scrape_listing()` deduplikuje dealery přes `seen_dealers` set, ale **nehradí count**.

Upravit `_scrape_listing()`:

```python
def _scrape_listing(self, client) -> tuple[list[ScoutLeadPayload], dict[str, int]]:
    """Scrape TipCars listing page. Returns (leads, dealer_inventory_counts)."""
    leads = []
    dealer_counts: dict[str, int] = {}  # {dealer_name_lower: count}
    seen_dealers = set()
    
    # Scrape multiple pages for better coverage
    max_pages = 10
    for page_num in range(1, max_pages + 1):
        url = f"{BASE_URL}/hledam/ojete-vozy"
        if page_num > 1:
            url += f"?page={page_num}"
        
        response = self._fetch(client, url)
        if response is None:
            break

        soup = BeautifulSoup(response.text, "lxml")
        cards = soup.select("div.advertisement")
        
        if not cards:
            break

        for card in cards:
            try:
                lead = self._parse_card(card)
                if lead and lead.name:
                    dealer_key = lead.name.lower().strip()
                    
                    # Count ALL listings per dealer
                    dealer_counts[dealer_key] = dealer_counts.get(dealer_key, 0) + 1
                    
                    # But only create one lead per dealer
                    if dealer_key not in seen_dealers:
                        seen_dealers.add(dealer_key)
                        if lead.source_url:
                            phone, address, city = self._fetch_detail(client, lead.source_url)
                            if phone:
                                lead.phone = phone
                            if address:
                                lead.address = address
                            if city:
                                lead.city = city
                        leads.append(lead)
            except Exception as e:
                logger.debug("Failed to parse TipCars card: %s", e)

    logger.info("TipCars: %d unique dealers, %d total listings from %d cards",
                len(leads), sum(dealer_counts.values()), sum(dealer_counts.values()))
    return leads, dealer_counts
```

Upravit `scrape()` aby volal inventory update:

```python
def scrape(self, query: str, country: Country) -> ScraperResult:
    result = ScraperResult(source=self.source, country=country, query=query)
    
    with self._get_client() as client:
        try:
            leads, dealer_counts = self._scrape_listing(client)
            result.leads.extend(leads)
            result.total_found += len(leads)
            
            # Store dealer_counts in result for later inventory update
            result.raw_metadata = {"dealer_counts": dealer_counts}  # Needs ScraperResult extension
        except Exception as e:
            result.errors.append(f"TipCars: {e}")
    
    return result
```

### Krok 4: Sauto — countovat z listing stránek

**Soubor:** `lead_scout/scrapers/sauto.py`

Sauto je headless scraper. Na listing stránkách identifikujeme dealer badge (řádek 186-193). Pro inventory count:

```python
# V _extract_listings() po parsování všech karet:
dealer_counts: dict[str, int] = {}

for lead in page_leads:
    if lead.category == Category.AUTOBAZAR and lead.name:
        key = lead.name.lower().strip()
        dealer_counts[key] = dealer_counts.get(key, 0) + 1
```

### Krok 5: AutoScout24 — countovat per seller

**Soubor:** `lead_scout/scrapers/autoscout24.py`

Podobný pattern — seller info je na kartě (řádek 141-153). Countovat per seller_name kde kategorie = AUTOBAZAR.

### Krok 6: Volat inventory update v scheduler

**Soubor:** `lead_scout/scheduler.py`

Upravit `_run_scraper()` — po save leadů zavolat inventory update:

```python
def _run_scraper(source_name: str, query: str = "", country: str = "CZ") -> None:
    # ... existing scrape + save logic ...
    
    # Inventory update (only for platforms that provide dealer counts)
    if hasattr(result, 'raw_metadata') and result.raw_metadata:
        dealer_counts = result.raw_metadata.get("dealer_counts")
        if dealer_counts:
            from lead_scout.inventory import InventoryTracker
            tracker = InventoryTracker(db)
            tracker.bulk_update(dealer_counts, source_name)
```

**Alternativa (jednodušší):** Místo přes ScraperResult metadata, volat inventory update přímo v `_run_scraper()` po save:

```python
# After saving leads, count by dealer name for AUTOBAZAR
if source_name in ("TIPCARS", "SAUTO", "AUTOSCOUT24"):
    from lead_scout.inventory import InventoryTracker
    from collections import Counter
    
    dealer_counts = Counter()
    for lead in result.leads:
        if lead.category == Category.AUTOBAZAR and lead.name:
            dealer_counts[lead.name.lower().strip()] += 1
    
    if dealer_counts:
        tracker = InventoryTracker(db)
        tracker.bulk_update(dict(dealer_counts), source_name)
```

**→ Preferuji tuto alternativu — žádné změny v ScraperResult modelu, žádné změny ve scraperech. Čistě v scheduler.**

### Krok 7: Scoring boost pro inventory

**Soubor:** `lead_scout/scoring.py`

Přidat inventory bonus do `score_business_lead()`:

```python
def score_business_lead(lead: ScoutLeadPayload) -> int:
    score = 0
    
    # ... existing scoring ...
    
    # Inventory size bonus (if available from DB)
    # Note: This requires passing inventory data to scoring
    # OR scoring reads from DB — see discussion below
    
    return max(0, min(100, score))
```

**Problem:** `apply_score()` pracuje s `ScoutLeadPayload` (Pydantic model) který nemá `estimated_inventory`. Scoring se děje PŘED save do DB, ale inventory data jsou v DB.

**Řešení:** Přidat post-save scoring update. Po inventory update přepočítat score:

```python
# V InventoryTracker.update_inventory():
# After updating inventory, recalculate score with inventory bonus
def _recalculate_score_with_inventory(self, lead_id: int, inventory: int) -> None:
    conn = self.db._get_conn()
    row = conn.execute("SELECT score FROM leads WHERE id = ?", (lead_id,)).fetchone()
    if row:
        base_score = row["score"]
        # Inventory bonus: +5 for 5-20 cars, +10 for 20-50, +15 for 50+
        if inventory >= 50:
            bonus = 15
        elif inventory >= 20:
            bonus = 10
        elif inventory >= 5:
            bonus = 5
        else:
            bonus = 0
        
        new_score = min(100, base_score + bonus)
        conn.execute(
            "UPDATE leads SET score = ?, updated_at = ? WHERE id = ?",
            (new_score, datetime.utcnow().isoformat(), lead_id),
        )
        conn.commit()
```

### Krok 8: Carmakler API — přidat `estimatedInventory` field

**Potřeba OBOU stran:**

**A) Prisma schema** (`prisma/schema.prisma`) — přidat na ScoutLead model:

```prisma
// Business info (AUTOBAZAR / VRAKOVISTE only)
estimatedInventory   Int?     // Estimated number of active listings
inventoryTrend       String?  // UP | DOWN | STABLE | null
```

**B) Zod validátor** (`lib/validators/scout-lead.ts`) — přidat do payloadu:

```typescript
estimatedInventory: z.number().int().min(0).optional().nullable(),
inventoryTrend: z.enum(["UP", "DOWN", "STABLE"]).optional().nullable(),
```

**C) Ingest logic** (`lib/scout-lead-management.ts`) — přidat do `prisma.scoutLead.create()` data.

**D) Lead Scout client** (`lead_scout/client.py`) — přidat do `SNAKE_TO_CAMEL` mapping:

```python
"estimated_inventory": "estimatedInventory",
"inventory_source": None,  # Don't send to API
"inventory_updated_at": None,  # Don't send to API
"prev_inventory": None,  # Don't send to API
```

A upravit `_row_to_payload` aby vynechal klíče s `None` value mapping.

### Krok 9: Trend tracking

Trend se počítá automaticky z `prev_inventory` vs `estimated_inventory`:

```python
def _calculate_trend(prev: int | None, current: int) -> str | None:
    if prev is None or prev == 0:
        return None
    delta_pct = ((current - prev) / prev) * 100
    if delta_pct > 10:
        return "UP"
    elif delta_pct < -10:
        return "DOWN"
    else:
        return "STABLE"
```

---

## Datové zdroje per scraper

| Scraper | Inventory data? | Jak | Přesnost |
|---------|-----------------|-----|----------|
| TipCars | ✅ ANO | Count karet per dealer na listing stránkách | Střední (vidíme jen 1-10 stránek) |
| Sauto | ✅ ANO | Count per seller z listing karet | Střední |
| AutoScout24 | ✅ ANO | Count per seller z listing karet | Střední |
| Firmy.cz | ❌ NE | Business directory — nemá info o autech | N/A |
| Zlatéstránky | ❌ NE | Telefonní seznam | N/A |
| ARES | ❌ NE | Obchodní rejstřík | N/A |
| Bazoš | ❌ NE | SOUKROMNIK only (1 auto = 1 prodejce) | N/A |
| Sbazar | ❌ NE | SOUKROMNIK only | N/A |

**Pozn:** Přesnost je "střední" protože vidíme jen výsledky z 1-15 stránek scrape. Dealer s 500 auty může mít na prvních 10 stránkách jen 20 viditelných. Ale pro relativní porovnání (dealer A má 3x víc listingů než dealer B) je to dostatečné.

## Implementační pořadí

1. **DB sloupce** (db.py) — žádné breaking changes
2. **inventory.py** — nový modul, nulové závislosti
3. **Scheduler integrace** — alternativa v `_run_scraper()`, 5 řádků kódu
4. **Scoring boost** — post-save recalculation
5. **Carmakler API** (Prisma + Zod + ingest) — schema migrace
6. **Client push** — camelCase mapping

Kroky 1-4 jsou čistě v Lead Scout, 5-6 vyžadují změny v Carmakler.

## STOP pravidla

- **STOP-1:** Pokud dealer name matching nefunguje (různé varianty jmen na různých platformách — "AAA Auto" vs "AAA Auto a.s." vs "AAAAuto") → přidat fuzzy matching nebo normalizaci
- **STOP-2:** Pokud TipCars listing stránka vrací málo karet (< 20) → zvýšit `max_pages`, ale dát pozor na rate limiting
- **STOP-3:** Pokud Carmakler Prisma migrace koliduje s existujícími daty → split migrace

## Testování

1. `python -m lead_scout scrape tipcars` → log zobrazuje "X unique dealers, Y total listings"
2. `sqlite3 data/leads.db "SELECT name, estimated_inventory, inventory_source FROM leads WHERE estimated_inventory IS NOT NULL ORDER BY estimated_inventory DESC LIMIT 10"` → ověřit top dealery
3. Po druhém scrape runu: ověřit `prev_inventory` a trend
4. Carmakler admin → ScoutLead detail zobrazuje inventory count
