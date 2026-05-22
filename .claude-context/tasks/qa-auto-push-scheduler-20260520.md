# QA Report: Auto-Push After Scrape (Lead Scout)

**Datum:** 2026-05-20  
**Task:** #16 (QA review task #8)  
**Commit:** 1d55813  
**Soubor:** `lead_scout/scheduler.py`  
**Reviewer:** kontrolor  
**Verdict: APPROVED ✅**

---

## Zkontrolované body

### ✅ 1. STOP-1 check — batch push dependency

Plán: "Pokud batch push ještě není implementovaný → NEIMPLEMENTOVAT"

Batch push implementován v commit 34499a8 (task #7), zkontrolován v QA task #13. ✅ Dependency splněna.

### ✅ 2. Auto-push po scrape — `_run_scraper()`

```python
db.close()

# Auto-push after scraping (only if new leads were saved)
if saved > 0:
    _push_leads()
```

- `db.close()` voláno **před** `_push_leads()` — žádný connection conflict ✅
- Podmínka `saved > 0` správná — push se nespustí pokud nebyly uloženy žádné leady ✅
- `_push_leads()` vytvoří vlastní `CarmaklerClient()` → vlastní `LeadDB()` → nové spojení ✅
- Výjimka v `_push_leads()` je interně zachycena (vlastní try/except) ✅

### ✅ 3. Thread-safe lock

```python
_push_lock = threading.Lock()

def _push_leads() -> None:
    if not _push_lock.acquire(blocking=False):
        logger.debug("Push already in progress, skipping")
        return
    try:
        ...
    finally:
        _push_lock.release()
```

Živý test (Python):
- First acquire → `True` ✅
- Second acquire (lock held) → `False` (non-blocking, returns immediately) ✅
- After release → `True` ✅

Lock je module-level (`_push_lock`) — sdílený pro celý proces ✅  
`finally: _push_lock.release()` — lock vždy uvolněn, i na výjimce ✅  
Žádný deadlock možný (non-blocking acquire) ✅

**Scénář: 2 scrapers dokončí paralelně:**
- Scraper A: `_push_leads()` → získá lock, pushuje
- Scraper B: `_push_leads()` → lock obsazen → `logger.debug("skipping")` → return
- Fallback 6h job: zachytí případné PENDING leady které B přeskočil ✅

### ✅ 4. Fallback push — snížen na 6h

```python
# Fallback push every 6 hours (catches any unpushed leads)
scheduler.add_job(
    _push_leads,
    IntervalTrigger(hours=6),
    id="push_leads_fallback",
    name="Push leads fallback (6h)",
)
```

Původní interval byl 1h ("every hour" dle starého komentáře). Snížen na 6h ✅  
Fallback job stále existuje — zachytí leady z přeskočených pushů ✅

### ✅ 5. `_verify_leads()` — bonus přidán

Commit přidal také `_verify_leads()` mimo scope plánu auto-push. Ověřeno:
- `lead_scout/verifier.py` existuje ✅
- `LeadVerifier.verify_batch()` na řádku 43 existuje ✅
- Lazy import uvnitř `try/except` — bezpečný, nepovede k chybě při spuštění ✅
- Scheduler job: `IntervalTrigger(hours=4)` ✅

Přidání `_verify_leads` v tomto commitu je OK — forward-looking stub pro task #10.

---

## Architektura flow (shrnutí)

```
Scraper job → _run_scraper()
    → saved > 0 → _push_leads()
                     → lock.acquire(non-blocking)
                     → IF locked: debug log, return (jiný push běží)
                     → ELSE: CarmaklerClient().push_leads() [batching po 50]
                     → finally: lock.release()

Fallback (6h) → _push_leads() [zachytí nepushnuté]
```

Logika je čistá, bez race conditions, bez deadlocků.

---

## Souhrn

| Bod | Status |
|---|---|
| STOP-1: batch push dependency splněna | ✅ |
| Auto-push volán po `saved > 0` | ✅ |
| `db.close()` před push (žádný conflict) | ✅ |
| Thread-safe lock — non-blocking | ✅ |
| Lock release v `finally` | ✅ |
| Fallback job zachován (6h) | ✅ |
| `_verify_leads()` stub — verifier.py existuje | ✅ |

**Verdict: APPROVED — připraveno k deployment.**
