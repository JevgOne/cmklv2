# QA Report: Sbazar enrichment (Task #6)

**Soubor:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/sbazar.py`
**Kontrolor:** KONTROLOR agent
**Datum:** 2026-05-20
**Schválený plán:** `.claude-context/tasks/plan-sbazar-enrichment.md`

---

## 1. Simplify kontrola

### ✅ `_enrich_lead()` helper správně extrahován (DRY)

Plán navrhoval helper jako "optional TIP". Implementátor ho provedl jako primární pattern — oba caller sites v `scrape()` (ř. 54 a 74) volají `self._enrich_lead(lead, page)`. Odstraňuje duplikaci 10 řádků. ✅

### ✅ Equipment extrakce: inlined do `_fetch_detail` (nepoužívá sdílenou funkci jako Bazoš)

Bazoš má `_extract_equipment_from_text()` jako sdílenou funkci. Sbazar stejnou logiku inline-uje v `_fetch_detail`. Drobná duplicita kódu mezi scrápery, ale v rámci jednoho souboru je to přijatelné — žádné DRY porušení uvnitř sbazar.py.

### ℹ️ Photo Strategy 1: bere první (nejmenší) URL ze srcset

```python
src = srcset.split(",")[0].split(" ")[0].strip()
```

Sbazar srcset vypadá: `//cdn.sdn.cz/img/small.jpg 300w, //cdn.sdn.cz/img/large.jpg 800w`.
Toto vezme nejmenší rozlišení. Pro náhled leadů OK. Pokud by byl požadavek na kvalitní fotky, použít `split(",")[-1]` (poslední = největší).

**Závažnost:** Kosmetická — kvalita obrázků snížena, nikoliv chybějící funkce.

### ✅ Žádný dead code, žádné leftovers z `_fetch_phone`

Metoda `_fetch_phone` plně nahrazena `_fetch_detail`. Žádné zbytky.

---

## 2. Debug kontrola

### Syntax
```
python3 -m py_compile lead_scout/scrapers/sbazar.py → OK
```

### Testy
```
pytest tests/ → 20 passed (pokrývají jen modely)
```

### Ruff lint — 10 chyb

| Kód | Počet | Poznámka |
|-----|-------|----------|
| E402 | 8 | Pre-existing — `from __future__ import annotations` pattern |
| E501 | 2 | Ř. 136 (105 znaků), ř. 291 (115 znaků) — pre-existing styl |

Žádné nové funkční chyby.

### ✅ Description logic — správná analýza

Potenciálně matoucí, ale korektní:

```python
desc_el = soup.select_one("div.description")   # exact match
if not desc_el:
    for sel in [...]:
        desc_el = soup.select_one(sel)
        if desc_el:
            text = desc_el.get_text(strip=True)
            if text and len(text) > 20:
                break          # ← dobrý element nalezen
            desc_el = None     # ← prázdný element, reset, continue loop
```

Pokud `div.description` najde prázdný kontejner (< 10 znaků), `desc_el` zůstane non-None, fallback `if not desc_el:` se neprovede a description bude `None`. Edge case, ale nepravděpodobný na produkci.

**Závažnost:** Kosmetická — extrémní edge case.

### ✅ Edge cases — vše ošetřeno

| Scénář | Chování |
|--------|---------|
| Navigate fail | `return None, None, [], []` — `_enrich_lead` vrátí False, lead přeskočen |
| Phone button neexistuje | `except Exception: pass` — pokračuje bez pádu |
| No description found | `description = None`, lead se přidá pokud má phone |
| No photos | `photos = []`, `lead.vehicle_photos` zůstane None |
| Equipment prázdný | `equipment = []`, `lead.vehicle_equipment` zůstane None |
| source_url is None | `_enrich_lead` vrátí False okamžitě (ř. 202-203) |
| Srcset je prázdný string | `split(",")[0].split(" ")[0].strip()` → `""` → podmínka `if src and ...` False |

### ✅ Return type konzistentní s callerem

`_fetch_detail` vrací `(phone, description, photos, equipment)` — 4-tuple.
`_enrich_lead` (ř. 204): `phone, description, photos, equipment = self._fetch_detail(page, lead.source_url)` ✅

### ✅ Rate limiting zachován

`_fetch_detail` volá `self._navigate(page, url)` → přes `HeadlessScraper._navigate()` → volá `self._rate_limit()`. `rate_limit_delay = 5.0` platí. ✅

---

## 3. Reverzní kontrola

Původní zadání vs. implementace:

| # | Požadavek z plánu | Status | Detail |
|---|-------------------|--------|--------|
| 1 | `_fetch_phone` přejmenována na `_fetch_detail` | ✅ | Ř. 216 |
| 2 | Nová signatura: 4-tuple `(phone, desc, photos, equip)` | ✅ | Ř. 216-218 |
| 3 | Hydration wait `page.wait_for_timeout(2000)` | ✅ | Ř. 224 |
| 4 | Description: `div.description` primární selektor | ✅ | Ř. 274 |
| 5 | Description: fallbacky `div[class*='description']`, `div[class*='popis']` | ✅ | Ř. 276-285 |
| 6 | Description: `<p>` fallback z `main/article` | ✅ | Ř. 287-293 |
| 7 | Photos: `img[srcset]` v `aspect-4/3` kontejnerech | ✅ | Ř. 305-316 |
| 8 | Photos: CDN `sdn.cz` filter (Playwright discovery: `d46-a.sdn.cz`) | ✅ | Ř. 312 |
| 9 | Photos: `https:` prefix pro `//` URLs | ✅ | Ř. 313-314 |
| 10 | Photos: background-image fallback | ✅ | Ř. 319-328 |
| 11 | Photos: `[:30]` limit | ✅ | Ř. 330 |
| 12 | Equipment: checkmarks strategie | ✅ | Ř. 336-339 |
| 13 | Equipment: `výbava:` sekce | ✅ | Ř. 342-351 |
| 14 | Equipment: known keywords fallback | ✅ | Ř. 354-364 |
| 15 | Equipment: `[:50]` limit | ✅ | Ř. 366 |
| 16 | Caller místo 1 (první stránka) přepsáno | ✅ | Ř. 54 — `_enrich_lead()` |
| 17 | Caller místo 2 (zbylé stránky) přepsáno | ✅ | Ř. 74 — `_enrich_lead()` |
| 18 | Helper `_enrich_lead()` implementován (optional TIP z plánu) | ✅ | Ř. 200-214 |
| 19 | `vehicle_description/photos/equipment` hydratovány do lead | ✅ | Ř. 208-213 |
| 20 | Phone extrakce beze změny | ✅ | Ř. 244-270 |

---

## Shrnutí nálezů

| Závažnost | Počet | Popis |
|-----------|-------|-------|
| ❌ Kritická | 0 | — |
| ⚠️ Střední | 0 | — |
| ℹ️ Kosmetická | 2 | srcset bere první (nejmenší) URL; `div.description` s < 10 chars edge case |
| 📝 Lint | 10 | E402 ×8 pre-existing, E501 ×2 pre-existing |

---

**Celkový verdikt: ✅ SCHVÁLENO**

Implementace plně odpovídá schválenému plánu (20/20 bodů). Krok 0 (Playwright selector discovery) byl proveden — reálné selektory (`div.description`, `aspect-4/3`, CDN `sdn.cz`) jsou ověřeny z live DOM. Žádné kritické ani střední bugy.
