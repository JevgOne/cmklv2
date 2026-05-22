# PLÁN: Lead Refresh/Update Cycle (re-scrape každé 2 dny)

**Datum:** 2026-05-20
**Priorita:** P2
**Cesta:** `/Users/zen/Projects/lead-scout/lead_scout/`

---

## Problém

Soukromé inzeráty (SOUKROMNIK) na Bazoš/Sbazar/Sauto mají omezenou životnost — auto se prodá, inzerát zmizí. Aktuálně Lead Scout nemá mechanismus pro ověření zda je inzerát stále aktivní. Výsledek: broker volá soukromníkovi, auto už je prodané.

## Řešení

### Architektura

Nový koncept: **lead freshness tracking**

Každý SOUKROMNIK lead má `last_verified_at` timestamp. Scheduler periodicky prochází leady starší než 2 dny a ověřuje zda `source_url` stále existuje (HTTP 200 = active, 404/410 = expired).

### Krok 1: Schema migrace v SQLite

**Soubor:** `lead_scout/db.py`

Přidat sloupce do `CREATE_TABLE_SQL`:

```sql
ALTER TABLE leads ADD COLUMN last_verified_at TEXT;
ALTER TABLE leads ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE leads ADD COLUMN verification_count INTEGER DEFAULT 0;
```

Implementovat jako safe migration v `_init_db()`:

```python
def _init_db(self) -> None:
    conn = self._get_conn()
    conn.executescript(CREATE_TABLE_SQL)
    
    # Safe migrations — add columns if they don't exist
    for col, typedef in [
        ("last_verified_at", "TEXT"),
        ("is_active", "INTEGER DEFAULT 1"),
        ("verification_count", "INTEGER DEFAULT 0"),
    ]:
        try:
            conn.execute(f"ALTER TABLE leads ADD COLUMN {col} {typedef}")
        except sqlite3.OperationalError:
            pass  # Column already exists
    
    conn.commit()
```

### Krok 2: Verification logic

**Nový soubor:** `lead_scout/verifier.py`

```python
"""Lead verification — check if source URLs are still active."""

import logging
from datetime import datetime, timedelta

import httpx

from lead_scout.db import LeadDB
from lead_scout.models import Category

logger = logging.getLogger(__name__)

STALE_THRESHOLD_DAYS = 2
BATCH_SIZE = 50


class LeadVerifier:
    """Verify that SOUKROMNIK leads are still active by checking source URLs."""

    def __init__(self, db: LeadDB | None = None):
        self.db = db or LeadDB()

    def get_stale_leads(self, limit: int = BATCH_SIZE) -> list[dict]:
        """Get SOUKROMNIK leads that need re-verification."""
        conn = self.db._get_conn()
        threshold = (datetime.utcnow() - timedelta(days=STALE_THRESHOLD_DAYS)).isoformat()
        
        rows = conn.execute(
            """SELECT id, source_url, name, source 
               FROM leads 
               WHERE category = ? 
                 AND is_active = 1 
                 AND source_url IS NOT NULL
                 AND (last_verified_at IS NULL OR last_verified_at < ?)
               ORDER BY last_verified_at ASC NULLS FIRST
               LIMIT ?""",
            (Category.SOUKROMNIK.value, threshold, limit),
        ).fetchall()
        return [dict(row) for row in rows]

    def verify_batch(self) -> dict:
        """Verify a batch of stale leads. Returns {verified, expired, errors}."""
        stale = self.get_stale_leads()
        if not stale:
            logger.info("No stale leads to verify")
            return {"verified": 0, "expired": 0, "errors": 0}

        verified = 0
        expired = 0
        errors = 0
        now = datetime.utcnow().isoformat()

        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            for lead in stale:
                try:
                    resp = client.head(lead["source_url"])
                    
                    if resp.status_code in (200, 301, 302):
                        # Still active
                        self._mark_verified(lead["id"], now, is_active=True)
                        verified += 1
                    elif resp.status_code in (404, 410, 403):
                        # Expired / removed
                        self._mark_verified(lead["id"], now, is_active=False)
                        expired += 1
                        logger.info("Lead #%d expired: %s", lead["id"], lead["name"])
                    else:
                        # Uncertain — mark verified but keep active
                        self._mark_verified(lead["id"], now, is_active=True)
                        verified += 1
                        
                except httpx.HTTPError:
                    errors += 1
                    # Don't mark — will retry next cycle

        summary = {"verified": verified, "expired": expired, "errors": errors}
        logger.info("Verification: %s", summary)
        return summary

    def _mark_verified(self, lead_id: int, now: str, is_active: bool) -> None:
        conn = self.db._get_conn()
        conn.execute(
            """UPDATE leads 
               SET last_verified_at = ?, is_active = ?, 
                   verification_count = verification_count + 1, updated_at = ?
               WHERE id = ?""",
            (now, int(is_active), now, lead_id),
        )
        conn.commit()
```

### Krok 3: Scheduler job

**Soubor:** `lead_scout/scheduler.py`

Přidat verification job:

```python
from lead_scout.verifier import LeadVerifier

def _verify_leads() -> None:
    """Verify stale SOUKROMNIK leads are still active."""
    try:
        verifier = LeadVerifier()
        summary = verifier.verify_batch()
        logger.info("Verify job: %s", summary)
    except Exception as e:
        logger.error("Verify job failed: %s", str(e), exc_info=True)

# In create_scheduler():
# Verify leads every 4 hours
scheduler.add_job(
    _verify_leads,
    IntervalTrigger(hours=4, start_date="2026-01-01 01:00:00"),
    id="verify_leads",
    name="Verify lead freshness",
)
```

### Krok 4: Filtrovat expired leady z push

**Soubor:** `lead_scout/db.py`

Upravit `get_unpushed()` aby vracelo jen aktivní leady:

```python
def get_unpushed(self, limit: int = 100) -> list[dict]:
    """Get leads that haven't been pushed to Carmakler yet (only active)."""
    conn = self._get_conn()
    rows = conn.execute(
        """SELECT * FROM leads 
           WHERE push_status = ? AND (is_active = 1 OR is_active IS NULL)
           ORDER BY score DESC LIMIT ?""",
        (PushStatus.PENDING.value, limit),
    ).fetchall()
    return [dict(row) for row in rows]
```

### Krok 5: CLI příkaz

**Soubor:** `lead_scout/main.py`

```python
@cli.command()
@click.option("--limit", default=50, help="Max leads to verify per run")
def verify(limit):
    """Verify SOUKROMNIK lead freshness (check source URLs)."""
    verifier = LeadVerifier()
    summary = verifier.verify_batch()
    click.echo(f"Verified: {summary['verified']}, Expired: {summary['expired']}, Errors: {summary['errors']}")
```

---

## Proč HEAD requesty

- `HEAD` je 10x rychlejší než `GET` — nestahuji obsah stránky
- Stačí ke zjištění 200 vs 404
- Nižší zátěž na zdroj i cíl

## Rate limiting

- 50 leadů per batch, 4x denně = 200 verifikací/den
- S delay 1s mezi requesty = ~1 minuta per batch
- Bezpečné pro všechny zdroje

## STOP pravidla

- **STOP-1:** Pokud zdrojový web (Bazoš, Sbazar) blokuje HEAD requesty → přepnout na GET
- **STOP-2:** Pokud expired lead má push_status=PUSHED → zvážit notifikaci Carmakler API

## Testování

1. `python -m lead_scout verify` → ověřit output
2. Manuálně smazat inzerát na Bazoš → verify → lead se označí `is_active=0`
3. Ověřit že expired leady se nepushují
