# FIX PLAN: Sauto API — QA nálezy (rate limiting, UA, None)

**Datum:** 2026-05-20
**Task:** #13
**Soubor:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/sauto.py`
**Status:** HOTOVO

---

## 3 problémy, 4 místa k úpravě

### Fix 1+2 (combined): Rate limiting + User-Agent

**Ř. 5 — přidat `import random`:**
```python
# STÁVAJÍCÍ:
import logging
import re

# NOVÝ:
import logging
import random
import re
```

**Ř. 14 (za `from lead_scout.scrapers.headless_base import HeadlessScraper`) — přidat import:**
```python
from lead_scout.scrapers.base import USER_AGENTS
```
(USER_AGENTS je definován v `base.py:17`, není class attr, je module-level list)

**Ř. 284-285 — přidat rate_limit + headers:**
```python
# STÁVAJÍCÍ:
api_url = f"https://www.sauto.cz/api/v1/items/{source_id}"
resp = httpx.get(api_url, timeout=10, follow_redirects=True)

# NOVÝ:
api_url = f"https://www.sauto.cz/api/v1/items/{source_id}"
self._rate_limit()
resp = httpx.get(
    api_url,
    timeout=10,
    follow_redirects=True,
    headers={
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "application/json",
    },
)
```

### Fix 3: None edge case

**Ř. 296:**
```python
# STÁVAJÍCÍ:
for img in data.get("images", []):
# NOVÝ:
for img in (data.get("images") or []):
```

**Ř. 305:**
```python
# STÁVAJÍCÍ:
for eq in data.get("equipment_cb", []):
# NOVÝ:
for eq in (data.get("equipment_cb") or []):
```

---

## Shrnutí

| # | Řádek | Změna | Severity |
|---|-------|-------|----------|
| 1 | 5 | `import random` | podpora Fix 1+2 |
| 2 | ~14 | `from ...base import USER_AGENTS` | podpora Fix 1+2 |
| 3 | 284-285 | `self._rate_limit()` + `headers={...}` | KRITICKÁ + STŘEDNÍ |
| 4 | 296 | `(data.get("images") or [])` | STŘEDNÍ |
| 5 | 305 | `(data.get("equipment_cb") or [])` | STŘEDNÍ |
