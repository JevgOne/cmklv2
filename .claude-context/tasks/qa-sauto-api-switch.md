# QA Report: Sauto API switch (Task #4, commit d632c3e)

**Soubor:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/sauto.py`
**Kontrolor:** KONTROLOR agent
**Datum:** 2026-05-20

---

## 1. Simplify kontrola

### ⚠️ Duplicitní extrakce source_id

Regex pro extrakci source_id z URL se vyskytuje **dvakrát identicky**:

- `_parse_card()` — řádky 167–170
- `_fetch_detail()` — řádky 266–271

```python
id_match = re.search(r"/(\d{6,})", url)
if not id_match:
    id_match = re.search(r"/detail/(\d+)", url)
```

`_parse_card()` již vypočítá `lead.source_id` a uloží do payloadu. `_fetch_detail()` ho pak zbytečně znovu extrahuje z URL. Čistší by bylo předat `source_id` jako parametr.

**Závažnost:** Nízká — funkčně OK, ale porušuje DRY.

### ⚠️ Přímé volání `httpx.get()` místo `self._fetch()`

Na řádku 285:
```python
resp = httpx.get(api_url, timeout=10, follow_redirects=True)
```

Base třída `BaseScraper` poskytuje `self._fetch(client, url)` s:
- rotací User-Agent headerů
- rate limitingem (`self._rate_limit()`)
- retry logikou (403/429 backoff)

API volání toto vše obchází. Viz bod 2 níže.

---

## 2. Debug kontrola

### Syntax
```
python3 -m py_compile lead_scout/scrapers/sauto.py → OK
```

### Testy
```
pytest tests/ → 20 passed
```
*(Testy pokrývají pouze modely, ne scrapers — žádný scraper test neexistuje)*

### Ruff lint — 12 chyb

```
ruff check lead_scout/scrapers/sauto.py
```

| Řádek | Kód | Popis |
|-------|-----|-------|
| 1-15 | E402 ×9 | Module level imports not at top (způsobeno `from __future__ import annotations` na řádku 1) |
| 84 | E501 | Line too long (104 > 100) |
| 214 | E741 | Ambiguous variable name `l` v list comprehension |
| 344 | E501 | Line too long (108 > 100) |

**Poznámka:** E402 jsou patrně pre-existing (způsobené `from __future__` modulem). E741 a E501 jsou pre-existing, nikoli nové.

### ❌ KRITICKÁ CHYBA: Rate limiting se neuplatní pro API cestu

`rate_limit_delay = 5.0` je definován, ale **API volání ho zcela ignoruje**:

```python
resp = httpx.get(api_url, timeout=10, follow_redirects=True)
```

`_navigate()` v headless_base.py volá `self._rate_limit()`, ale k němu se dojde **jen pokud API nevrátí telefon** (DOM fallback path). Pokud API funguje (primární path), žádný rate limiting nenastane. Při 50 stránkách × ~30 listingů = 1500 API requestů bez unique delay → high risk of 429/IP ban.

**Závažnost:** Vysoká — může způsobit zablokování IP na Sauto.cz.

### ⚠️ Chybějící User-Agent header v API volání

```python
resp = httpx.get(api_url, timeout=10, follow_redirects=True)
```

Žádný `User-Agent` header — výchozí httpx UA (`python-httpx/x.y.z`) je snadno detekovatelný a blokovaný.

**Závažnost:** Střední — může způsobit 403/blokování.

### ⚠️ Edge case: `None` místo `[]` v API odpovědi

```python
for img in data.get("images", []):   # ← pokud "images": null → iteruje None → TypeError
for eq in data.get("equipment_cb", []):  # stejný problém
```

Pokud API vrátí `{"images": null}` (explicitní null, ne chybějící klíč), `data.get("images", [])` vrátí `None`, nikoli `[]`. Iterace přes `None` vyhodí `TypeError`. Je to zachyceno outer `except Exception`, takže nespadne, ale potichu přeskočí veškerou API enrichment.

**Fix:** `data.get("images") or []` a `data.get("equipment_cb") or []`

**Závažnost:** Střední — silent data loss při neobvyklém API response.

### ✅ Bezpečné edge cases

- `premise = data.get("premise") or {}` — správně ošetřeno
- `locality = data.get("locality") or {}` — správně ošetřeno
- Celý API blok obalen `try/except Exception` — pád API neblokuje DOM fallback

---

## 3. Reverzní kontrola

Původní zadání bod po bodu:

| # | Požadavek | Status | Poznámka |
|---|-----------|--------|----------|
| 1 | Přepnout `_fetch_detail` z DOM na API (GET `/api/v1/items/{id}`) | ✅ | Implementováno |
| 2 | Extrahovat `description` | ✅ | `data.get("description")`, ořez 5000 znaků |
| 3 | Extrahovat `photos` (CDN d19-a.sdn.cz) | ✅ | `images[].url`, `//` → `https:` konverze, max 30 |
| 4 | Extrahovat `equipment` (`equipment_cb[].name`) | ✅ | Deduplikace, max 50 |
| 5 | Extrahovat seller info | ✅ | `premise.name`, `premise.phone`, `premise.type` → Category |
| 6 | Zachovat return formát metody | ✅ | 7-tuple zachován, zpětně kompatibilní |
| 7 | Fallback na DOM scraping pokud API selže | ✅ | DOM path aktivní pokud `not phone` po API |
| 8 | Respektovat `rate_limit_delay` | ❌ | API volání obchází `_rate_limit()` — viz výše |

---

## Shrnutí nálezů

| Závažnost | Počet | Popis |
|-----------|-------|-------|
| ❌ Kritická | 1 | Rate limiting neprobíhá pro API cestu |
| ⚠️ Střední | 2 | Chybějící User-Agent; `None` vs `[]` edge case |
| ℹ️ Nízká | 2 | DRY violation (source_id); přímé httpx místo self._fetch |
| 📝 Info | 12 | Ruff lint (E402 pre-existing, E741/E501 drobnosti) |

---

## Požadované opravy (pro implementátora)

### Oprava 1 — Rate limit pro API (KRITICKÁ)
Před API voláním přidat `self._rate_limit()`:
```python
if source_id:
    try:
        self._rate_limit()  # ← PŘIDAT
        api_url = f"https://www.sauto.cz/api/v1/items/{source_id}"
        resp = httpx.get(api_url, timeout=10, ...)
```

### Oprava 2 — User-Agent header (STŘEDNÍ)
```python
resp = httpx.get(
    api_url,
    timeout=10,
    follow_redirects=True,
    headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"},
)
```

### Oprava 3 — None edge case (STŘEDNÍ)
```python
for img in (data.get("images") or []):
for eq in (data.get("equipment_cb") or []):
```

---

**Celkový verdikt: ❌ NESCHVÁLENO — vyžaduje opravy (min. oprava 1 je blocker)**
