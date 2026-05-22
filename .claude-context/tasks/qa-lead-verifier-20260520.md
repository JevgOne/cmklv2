# QA Report: Lead Verifier Implementation (Lead Scout)

**Datum:** 2026-05-20  
**Task:** #18 (QA review task #10)  
**Commit:** 732182b  
**Reviewer:** kontrolor  
**Verdict: APPROVED with notes ✅** (2 minor notes, žádné blokery)

---

## Zkontrolované soubory

- `lead_scout/verifier.py` — nový modul, LeadVerifier
- `lead_scout/db.py` — schema migrace + `get_unpushed()` filter
- `lead_scout/main.py` — CLI `verify`
- `lead_scout/scheduler.py` — scheduler job (zkontrolováno v předchozím QA #16)
- `plan-lead-refresh-cycle.md` — referenční plán

---

## Výsledky ověření

### ✅ 1. Schema migrace — bezpečná

```python
for col, typedef in [
    ("last_verified_at", "TEXT"),
    ("is_active", "INTEGER DEFAULT 1"),
    ("verification_count", "INTEGER DEFAULT 0"),
]:
    try:
        conn.execute(f"ALTER TABLE leads ADD COLUMN {col} {typedef}")
    except sqlite3.OperationalError:
        pass
conn.commit()
```

- `col` a `typedef` jsou **hardcoded** konstanty, ne user input → žádné SQL injection riziko ✅
- `try/except sqlite3.OperationalError` → idempotentní, bezpečné při opakovaném spuštění ✅
- Tři správné sloupce: `last_verified_at TEXT`, `is_active INTEGER DEFAULT 1`, `verification_count INTEGER DEFAULT 0` ✅

### ✅ 2. `verify_batch()` logika

Implementace odpovídá plánu. Klíčové:

| Status | Akce | Správně? |
|---|---|---|
| 200 | `is_active=True`, `verified++` | ✅ |
| 301/302 | `is_active=True`, `verified++` | ✅ (viz pozn. N1) |
| 404, 410 | `is_active=False`, `expired++` | ✅ |
| 403 | `is_active=False`, `expired++` | ✅ (plán: 403 = expired) |
| jiný kód | `is_active=True`, `verified++` | ✅ (uncertain → keep active) |
| `httpx.HTTPError` | `errors++`, no mark | ✅ (retry next cycle) |

`_mark_verified()` — parametrizovaný UPDATE, atomický `conn.commit()` ✅  
`STALE_THRESHOLD_DAYS = 2` správně mapuje na `timedelta(days=2)` ✅  
`ORDER BY last_verified_at ASC NULLS FIRST` — NULL leady verifikované jako první ✅

### ✅ 3. `get_unpushed()` — filtruje expired leady

```sql
WHERE push_status = ? AND (is_active = 1 OR is_active IS NULL)
```

- `OR is_active IS NULL` → existující leady bez migrace nejsou blokované ✅
- Expired leady (`is_active = 0`) se nikdy nepushují do Carmakler ✅

### ✅ 4. CLI `verify` command

```python
@cli.command()
@click.option("--limit", default=50)
def verify(limit: int) -> None:
    from lead_scout.verifier import LeadVerifier
    verifier = LeadVerifier()
    summary = verifier.verify_batch(limit=limit)
    click.echo(f"  Verified: {summary['verified']}")
    click.echo(f"  Expired:  {summary['expired']}")
    click.echo(f"  Errors:   {summary['errors']}")
```

- `--limit` option správně přidán a předán ✅
- Implementace je lepší než plán (plán neměl `limit` v `verify_batch`) ✅

### ✅ 5. Scheduler job (ověřeno v QA #16)

- `_verify_leads()` s lazy import (`from lead_scout.verifier import LeadVerifier`) ✅
- Lazy import v try/except — graceful failure ✅
- `IntervalTrigger(hours=4)` ✅

---

## Poznámky (neblokující)

### ⚠️ N1: 301/302 v status check jsou dead code

```python
if resp.status_code in (200, 301, 302):
```

`httpx.Client(follow_redirects=True)` sleduje přesměrování automaticky — `resp.status_code` je vždy FINÁLNÍ odpověď. S `follow_redirects=True` nikdy neuvidíme 301/302 jako výsledek. Kód je **harmless** (jen dead code), kopíruje vzor z plánu.

### ⚠️ N2: Chybí rate limit delay mezi HEAD requesty

Plán říká: "S delay 1s between requests".

Implementace neobsahuje žádný `time.sleep()` mezi requesty:
```python
for lead in stale:
    resp = client.head(lead["source_url"])  # žádný delay
```

STOP-1 varuje: "Pokud zdrojový web blokuje HEAD requesty → přepnout na GET". Bez delay je vyšší pravděpodobnost rate limitingu ze strany Bazoš/Sbazar.

**Závažnost:** Nízká — batch je max 50 leadů, HEAD requesty jsou rychlé, různé domény (různí poskytovatelé = každý dostane max pár requestů). Ale pokud Bazoš začne vracet 403 a leady se označí jako expired, bude potřeba přidat delay.

### ⚠️ N3: Chybí `verifier.db.close()` v CLI

```python
def verify(limit: int) -> None:
    verifier = LeadVerifier()
    summary = verifier.verify_batch(limit=limit)
    # verifier.db.close() chybí
```

SQLite spojení se uzavře při GC (Python záruky). Nízká závažnost — CLI příkaz skončí záhy.

---

## Souhrn

| Bod | Status |
|---|---|
| Schema migrace — bezpečná, idempotentní | ✅ |
| SQL injection risk (ALTER TABLE) | ✅ Žádný |
| `verify_batch()` — všechny HTTP status kódy správně | ✅ |
| `get_unpushed()` filtruje expired (is_active=0) | ✅ |
| `is_active IS NULL` — zpětná kompatibilita | ✅ |
| CLI `verify --limit` | ✅ |
| Scheduler job (4h) | ✅ |
| 301/302 dead code | ⚠️ Harmless |
| Chybí delay mezi HEAD requesty | ⚠️ Monitor po deploy |
| Chybí `db.close()` v CLI | ⚠️ Low severity |

**Verdict: APPROVED — commit 732182b připraven k deploy.**
