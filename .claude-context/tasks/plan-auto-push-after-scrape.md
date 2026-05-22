# PLÁN: Auto-push leadů po každém scraping runu

**Datum:** 2026-05-20
**Priorita:** P1
**Cesta:** `/Users/zen/Projects/lead-scout/lead_scout/scheduler.py`
**Závisí na:** plan-lead-push-batching.md (batch push musí být hotový)

---

## Problém

Aktuálně se leady pushují do Carmakler pouze každé 2 hodiny (standalone cron job, řádek 169-175 v scheduler.py). Uživatel chce aby se pushly **ihned po každém scraping runu** — kratší latence, čerstvější data.

## Řešení

### Krok 1: Přidat push po scrape do `_run_scraper()`

**Soubor:** `lead_scout/scheduler.py`

Upravit funkci `_run_scraper()` — po úspěšném scrapování zavolat push:

```python
def _run_scraper(source_name: str, query: str = "", country: str = "CZ") -> None:
    """Run a single scraper, save results, and push to Carmakler."""
    from lead_scout.scrapers import get_scraper

    source = Source(source_name)
    country_enum = Country(country)

    logger.info("Scheduled run: %s (query=%s, country=%s)", source_name, query, country)

    try:
        scraper = get_scraper(source)
        if scraper is None:
            logger.warning("No scraper registered for %s", source_name)
            return

        result = scraper.scrape(query=query, country=country_enum)
        db = LeadDB()

        saved = 0
        for lead in result.leads:
            lead = apply_score(lead)
            if db.save_lead(lead) is not None:
                saved += 1

        logger.info(
            "Scheduled %s complete: %d found, %d saved (after dedup)",
            source_name,
            result.total_found,
            saved,
        )
        db.close()

        # Auto-push after scraping (only if new leads were saved)
        if saved > 0:
            _push_leads()

    except Exception as e:
        logger.error("Scheduled %s failed: %s", source_name, str(e), exc_info=True)
```

### Krok 2: Ponechat standalone push job jako fallback

**NEODSTRAŇOVAT** existující `_push_leads` cron job (řádek 169-175). Ponechat jako fallback/catch-all pro leady které se z nějakého důvodu nepushly (error, restart). Ale snížit frekvenci z 2h na 6h:

```python
# Fallback push every 6 hours (catches any unpushed leads)
scheduler.add_job(
    _push_leads,
    IntervalTrigger(hours=6),
    id="push_leads_fallback",
    name="Push leads fallback (6h)",
)
```

### Krok 3: Thread safety

`_push_leads()` by se mohla volat z více scraper jobů paralelně. Přidat jednoduchý lock:

```python
import threading

_push_lock = threading.Lock()

def _push_leads() -> None:
    """Push unpushed leads to Carmakler (thread-safe)."""
    if not _push_lock.acquire(blocking=False):
        logger.debug("Push already in progress, skipping")
        return
    try:
        client = CarmaklerClient()
        summary = client.push_leads()
        logger.info("Push job: %s", summary)
    except Exception as e:
        logger.error("Push job failed: %s", str(e), exc_info=True)
    finally:
        _push_lock.release()
```

---

## Dopady

- **Latence:** Leady se dostanou do Carmakler během sekund po scrapení (vs. max 2h předtím)
- **Rate limit:** S batch push (50/req) bezpečné — i kdyby 5 scraperů běželo paralelně, stále jen 5 HTTP requestů
- **Lock:** Zabrání race condition, ne deadlocku — non-blocking acquire

## STOP pravidla

- **STOP-1:** Pokud batch push ještě není implementovaný → NEIMPLEMENTOVAT auto-push (jinak 1-per-request → rate limit hit)

## Testování

1. Spustit manuálně `python -m lead_scout scrape bazos` → ověřit log "Push job: {pushed: N}"
2. Ověřit že fallback job stále funguje
3. Ověřit že paralelní scrapery nehavarují na push locku
