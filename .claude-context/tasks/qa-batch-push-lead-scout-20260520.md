# QA Report: Batch Push Implementation (Lead Scout)

**Datum:** 2026-05-20  
**Task:** #13 (QA review task #7)  
**Commit:** 34499a8  
**Reviewer:** kontrolor  
**Verdict: APPROVED ✅** (2 minor notes)

---

## Zkontrolované soubory

- `lead_scout/client.py` — `push_leads()`, `_row_to_payload()`, `SNAKE_TO_CAMEL`
- `lead_scout/db.py` — `reset_error_leads()`
- `lead_scout/main.py` — CLI `reset-errors`
- `lib/validators/scout-lead.ts` — API schema (reference)
- `lib/scout-lead-management.ts` — API response format (reference)

---

## Výsledky ověření

### ✅ 1. Batch logika (while loop)

Metoda `push_leads()` správně:
- Fetches `batch_size=50` PENDING leadů per iteraci (`get_unpushed(limit=50)`)
- While loop zpracuje **všechny** PENDING leady (ne jen první batch)
- Při prázdném výsledku čistě breakuje
- `total` counter správně akumuluje přes iterace

### ✅ 2. camelCase mapping — kompletní

Porovnání `SNAKE_TO_CAMEL` (12 klíčů) vs. `scoutLeadPayloadSchema`:

| Python (snake) | API (camelCase) | Mapped? |
|---|---|---|
| `source_id` | `sourceId` | ✅ |
| `source_url` | `sourceUrl` | ✅ |
| `contact_person` | `contactPerson` | ✅ |
| `estimated_size` | `estimatedSize` | ✅ |
| `google_rating` | `googleRating` | ✅ |
| `google_review_count` | `googleReviewCount` | ✅ |
| `vehicle_brand` | `vehicleBrand` | ✅ |
| `vehicle_model` | `vehicleModel` | ✅ |
| `vehicle_year` | `vehicleYear` | ✅ |
| `vehicle_price` | `vehiclePrice` | ✅ |
| `vehicle_mileage` | `vehicleMileage` | ✅ |
| `listing_title` | `listingTitle` | ✅ |

Jednoslovné klíče (`name`, `phone`, `email`, `city`, `region`, `zip`, `ico`, `score`, atd.) nepotřebují konverzi — správně procházejí beze změny.

`raw_payload` je v `exclude_keys` — záměrně se neposílá (velký blob). ✅

### ✅ 3. 429 handling

```python
elif response.status_code == 429:
    logger.warning("Rate limited, stopping push. Pushed so far: %d", pushed)
    break
```

- Gracefully stopuje loop ✅
- Loguje kolik bylo pushnutých ✅
- Neodesílá znovu (žádný retry storm) ✅
- Nesprocessované PENDING leady zůstanou pro příští run ✅

### ✅ 4. SQL bezpečnost `reset_error_leads()`

```python
cursor = conn.execute(
    "UPDATE leads SET push_status = ?, updated_at = ? WHERE push_status = ?",
    (PushStatus.PENDING.value, datetime.utcnow().isoformat(), PushStatus.ERROR.value),
)
```

- Parametrizovaný dotaz — SQL injection není možný ✅
- WHERE správně filtruje pouze ERROR leady ✅
- `cursor.rowcount` vrací přesný počet ✅
- `conn.commit()` voláno ✅

### ✅ 5. CLI `reset-errors`

```python
@cli.command("reset-errors")
def reset_errors() -> None:
    db = LeadDB()
    count = db.reset_error_leads()
    db.close()
    click.echo(f"Reset {count} ERROR leads to PENDING.")
```

- Správně registrovaný jako `reset-errors` subcommand ✅
- Voláno `db.close()` ✅
- Timeout zvýšen na 60.0s ✅

---

## Drobné poznámky (neblokují)

### ⚠️ N1: `details` length mismatch guard chybí

```python
for i, detail in enumerate(result.get("details", [])):
    lid = lead_ids[i]  # IndexError pokud details > lead_ids
```

Pokud API vrátí jiný počet `details` než bylo odesláno leadů:
- `details < lead_ids`: zbývající leady zůstanou PENDING → budou fetchnuty znovu → potenciálně nekonečné opakování
- `details > lead_ids`: `IndexError`

**API garantuje rovnost** (viz `ingestScoutLeads()` v `scout-lead-management.ts`), takže v praxi se to nestane. Avšak robustnější by bylo:
```python
for i, detail in enumerate(result.get("details", [])):
    if i >= len(lead_ids):
        break
    lid = lead_ids[i]
```

### ⚠️ N2: 5xx chyby neabortují loop

Na 500/503/504 se batch označí jako ERROR a loop pokračuje dalším batchem. Pokud je server down, všechny leady se zbytečně označí jako ERROR (místo PENDING). Mitigace: `reset-errors` CLI to řeší retroaktivně. Akceptovatelné pro MVP.

---

## Závěr

Implementace **odpovídá plánu** ve všech 4 kritických bodech. STOP pravidla (STOP-1: API response formát, STOP-2: camelCase test) jsou respektována. Kód je čistý, logování dostatečné.

**Výsledek: APPROVED — připraveno k merge/deploy.** Minor notes jsou neblokující a mohou být adresovány v budoucím tasku pokud bude potřeba.
