# PLÁN: Fix Lead Push Batching (50 leadů per request)

**Datum:** 2026-05-20
**Priorita:** P0 (blokuje data flow)
**Cesta:** `/Users/zen/Projects/lead-scout/lead_scout/client.py`

---

## Problém

`CarmaklerClient.push_leads()` iteruje přes leady a posílá **1 lead per HTTP request** (řádek 53-61 v client.py). API endpoint `/api/scout-leads/ingest` má rate limit **500 req/hod**, takže po ~390 leadech (s overheadem) dojde k 429 errors.

API ale přijímá `{ leads: [...] }` array s limitem **max 100 leadů** per request (viz `scoutLeadIngestSchema` v `lib/validators/scout-lead.ts:81`).

Navíc existuje ~100 leadů ve stavu `ERROR` z předchozích failed pushů, které se znovu nepokouší odeslat (jsou vyfiltrované `WHERE push_status = 'PENDING'`).

## Řešení

### Krok 1: Batch push v client.py

**Soubor:** `lead_scout/client.py`

Upravit metodu `push_leads()`:

```python
def push_leads(self, batch_size: int = 50) -> dict:
    """Push unpushed leads to Carmakler API in batches of batch_size.

    Returns summary: {pushed, duplicates, errors, total}.
    """
    pushed = 0
    duplicates = 0
    errors = 0
    total = 0

    with httpx.Client(timeout=30.0, headers=self._get_headers()) as client:
        while True:
            unpushed = self.db.get_unpushed(limit=batch_size)
            if not unpushed:
                break

            total += len(unpushed)
            payloads = [self._row_to_payload(row) for row in unpushed]
            lead_ids = [row["id"] for row in unpushed]

            try:
                response = client.post(
                    f"{self.base_url}/api/scout-leads/ingest",
                    json={"leads": payloads},
                )

                if response.status_code == 201:
                    # Parse per-lead results from API response
                    result = response.json()
                    for i, detail in enumerate(result.get("details", [])):
                        lid = lead_ids[i]
                        if detail["status"] == "created":
                            self.db.mark_pushed(lid, PushStatus.PUSHED)
                            pushed += 1
                        elif detail["status"] == "duplicate":
                            self.db.mark_pushed(lid, PushStatus.DUPLICATE)
                            duplicates += 1
                        else:
                            self.db.mark_pushed(lid, PushStatus.ERROR)
                            errors += 1
                elif response.status_code == 429:
                    logger.warning("Rate limited, stopping push. Pushed so far: %d", pushed)
                    break
                elif response.status_code == 400:
                    # Validation error — mark all as ERROR
                    for lid in lead_ids:
                        self.db.mark_pushed(lid, PushStatus.ERROR)
                    errors += len(lead_ids)
                    logger.warning("Batch validation error: %s", response.text[:300])
                else:
                    errors += len(lead_ids)
                    logger.warning("Unexpected status %d: %s", response.status_code, response.text[:300])

            except httpx.HTTPError as e:
                errors += len(lead_ids)
                logger.error("HTTP error pushing batch: %s", str(e))

    summary = {"pushed": pushed, "duplicates": duplicates, "errors": errors, "total": total}
    logger.info("Push complete: %d pushed, %d dup, %d err / %d total", pushed, duplicates, errors, total)
    return summary
```

**Klíčové změny:**
1. `batch_size` default 50 (ne 100 — menší bezpečnější dávky)
2. **While loop** místo single fetch — zpracuje VŠECHNY pending leady, ne jen prvních N
3. Parsuje **per-lead** výsledky z API response (`details` array)
4. Při 429 se zastaví gracefully (nepokračuje)
5. Timeout zvýšit na 60s (batch trvá déle)

### Krok 2: Přidat metodu pro reset ERROR leadů

**Soubor:** `lead_scout/db.py`

Přidat novou metodu:

```python
def reset_error_leads(self) -> int:
    """Reset ERROR leads back to PENDING for retry."""
    conn = self._get_conn()
    cursor = conn.execute(
        "UPDATE leads SET push_status = ?, updated_at = ? WHERE push_status = ?",
        (PushStatus.PENDING.value, datetime.utcnow().isoformat(), PushStatus.ERROR.value),
    )
    conn.commit()
    count = cursor.rowcount
    logger.info("Reset %d ERROR leads to PENDING", count)
    return count
```

### Krok 3: CLI příkaz pro reset

**Soubor:** `lead_scout/main.py`

Přidat CLI subcommand `reset-errors`:

```python
@cli.command()
def reset_errors():
    """Reset ERROR leads back to PENDING for retry."""
    db = LeadDB()
    count = db.reset_error_leads()
    click.echo(f"Reset {count} ERROR leads to PENDING.")
    db.close()
```

### Krok 4: Opravit `_row_to_payload` — camelCase konverze

Aktuální `_row_to_payload` posílá snake_case klíče (`source_id`, `contact_person` atd.), ale Carmakler API validátor (`scoutLeadPayloadSchema`) očekává camelCase (`sourceId`, `contactPerson`).

Přidat mapping:

```python
SNAKE_TO_CAMEL = {
    "source_id": "sourceId",
    "source_url": "sourceUrl",
    "contact_person": "contactPerson",
    "estimated_size": "estimatedSize",
    "google_rating": "googleRating",
    "google_review_count": "googleReviewCount",
    "vehicle_brand": "vehicleBrand",
    "vehicle_model": "vehicleModel",
    "vehicle_year": "vehicleYear",
    "vehicle_price": "vehiclePrice",
    "vehicle_mileage": "vehicleMileage",
    "listing_title": "listingTitle",
}

@staticmethod
def _row_to_payload(row: dict) -> dict:
    """Convert a SQLite row dict to API payload dict (camelCase keys)."""
    exclude_keys = {
        "id", "push_status", "pushed_at", "created_at", "updated_at", "raw_payload"
    }
    result = {}
    for k, v in row.items():
        if k in exclude_keys or v is None:
            continue
        key = CarmaklerClient.SNAKE_TO_CAMEL.get(k, k)
        result[key] = v
    return result
```

---

## Matematika rate limitu

- 500 req/hod limit
- Batch size 50 → potřeba 1 request per 50 leadů
- 2000 leadů = 40 requestů (vs. 2000 requestů bez batching)
- Bezpečně pod limitem

## STOP pravidla

- **STOP-1:** Pokud API vrací jiný response formát než `{ accepted, duplicates, errors, details }` → ověřit reálnou odpověď
- **STOP-2:** Pokud `_row_to_payload` posílá klíče které API nečeká → test s 1 batchem nejdřív

## Testování

1. `python -m lead_scout reset-errors` → ověřit reset ERROR leadů
2. `python -m lead_scout push --batch-size 5` → test s malým batchem
3. Zkontrolovat Carmakler admin panel → leady se objeví
4. Log: žádné 429 errors
