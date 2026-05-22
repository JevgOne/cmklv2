# QA Re-check: Sauto API fixy (Task #14)

**Soubor:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/sauto.py`
**Kontrolor:** KONTROLOR agent
**Datum:** 2026-05-20

---

## Ověření 3 fixů z QA #12

| # | Fix | Status | Řádek |
|---|-----|--------|-------|
| 1 | `self._rate_limit()` před `httpx.get` | ✅ | ř. 287 |
| 2 | User-Agent header + `random.choice(USER_AGENTS)` + `Accept: application/json` | ✅ | ř. 291 |
| 2a | `import random` | ✅ | ř. 10 |
| 2b | `from lead_scout.scrapers.base import USER_AGENTS` | ✅ | ř. 17 |
| 3 | `(data.get("images") or [])` | ✅ | ř. 303 |
| 3b | `(data.get("equipment_cb") or [])` | ✅ | ř. 312 |

## Detail

```python
# Fix 1 — rate limit
self._rate_limit()                    # ✅ ř. 287
api_url = f"https://www.sauto.cz/api/v1/items/{source_id}"
resp = httpx.get(
    api_url, timeout=10, follow_redirects=True,
    headers={"User-Agent": random.choice(USER_AGENTS), "Accept": "application/json"},  # ✅ Fix 2
)

# Fix 3
for img in (data.get("images") or []):      # ✅ ř. 303
for eq in (data.get("equipment_cb") or []):  # ✅ ř. 312
```

---

**Verdikt: ✅ VŠECHNY 3 FIXY APLIKOVÁNY SPRÁVNĚ**
