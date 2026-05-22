# QA Report: Bazoš fix (Task #5, commit ea99c0c)

**Soubor:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/bazos.py`
**Kontrolor:** KONTROLOR agent
**Datum:** 2026-05-20
**Schválený plán:** `.claude-context/tasks/plan-bazos-fix.md`

---

## 1. Simplify kontrola

### ℹ️ `desc_el.get_text()` voláno dvakrát zbytečně

```python
desc_text = desc_el.get_text()           # řádek 430
clean_desc = desc_el.get_text(strip=True) # řádek 431
```

`clean_desc` mohl být `desc_text.strip()` nebo `desc_el.get_text(separator=" ", strip=True)`. Dvě serializace stejného elementu.

**Závažnost:** Kosmetická — výkon zanedbatelný pro jeden element.

### ℹ️ Photo Strategy 2 — přidána navíc nad rámec plánu

Plán specifikoval dvě foto strategie: (1) carousel + lazyload, (2) URL generation. Implementace přidala Strategy 2 "any bazos image" (`img[src*='www.bazos'], img[src*='bazos.cz/img']`) jako mezikrok. Toto je rozumné vylepšení, které zvyšuje pokrytí. Plán ho nevyloučil.

**Závažnost:** Žádná — additivní, nezpůsobuje regresi.

### ✅ Žádný dead code, žádné duplicity v nových částech

Nové funkce `_extract_equipment_from_text()` a logika v `_fetch_detail()` jsou čisté.

---

## 2. Debug kontrola

### Syntax
```
python3 -m py_compile lead_scout/scrapers/bazos.py → OK
```

### Testy
```
pytest tests/ → 20 passed
```

### Ruff lint — 16 chyb

| Skupina | Kód | Počet | Poznámka |
|---------|-----|-------|----------|
| E402 | Module import not at top | 8 | Pre-existing — způsobeno `from __future__ import annotations` na ř. 1 |
| E501 | Line too long | 8 | 6 pre-existing, 2 nové (ř. 349, 392) |

Nové E501:
- **Řádek 349** (129 znaků): `phone, seller_name, ... = self._fetch_detail(client, detail_url, source_id)` — long unpack
- **Řádek 392** (102 znaků): docstring `_fetch_detail` — trivial

**Žádné nové E741, F401, ani jiné funkční chyby.**

### ✅ Edge cases — vše ošetřeno

| Scénář | Chování |
|--------|---------|
| `_fetch` vrátí None | `return None, None, None, [], [], {}` — caller OK |
| `div.popisdetail` chybí | 3 fallback selektory → h1 sibling scan |
| description je prázdný | `equipment = []` (podmínka `if description:`) |
| Carousel je prázdný | Strategy 2 → Strategy 3 |
| `source_id` je None | URL generation přeskočena, `photos = []` |
| `source_id` < 3 znaky | `source_id[-3:]` v Pythonu bezpečné — vrátí celý string |

### ✅ Return type — konzistentní se callerem

`_fetch_detail` vrací 6-tuple: `(phone, seller_name, description, photos, equipment, params)`
`_parse_ad` řádek 349 rozbalí 6 hodnot: ✅ match

### ✅ Rate limiting zachován

`_fetch_detail` používá `self._fetch(client, url)` — přes base class s `_rate_limit()`. `rate_limit_delay = 4.0` se uplatní.

---

## 3. Reverzní kontrola

Původní zadání bod po bodu:

| # | Požadavek z plánu | Status | Poznámka |
|---|-------------------|--------|----------|
| 1 | Fix foto selektorů — carousel + Flickity lazyload (`data-flickity-lazyload`) | ✅ | Ř. 468-477 |
| 2 | Fix foto — `data-src` fallback | ✅ | Ř. 470 |
| 3 | Fix foto — URL generation z source_id (`/img/{n}t/{dir}/{id}.jpg`) | ✅ | Ř. 489-493 |
| 4 | Fix foto — `https:` prefix pro `//` URLs | ✅ | Ř. 475 |
| 5 | Fix foto — skip thumbnails (`thumb`, `mini`) | ✅ | Ř. 476-477 |
| 6 | Fix description — fallback selektory (`div.popis`, `div[class*='popis']`) | ✅ | Ř. 408-415 |
| 7 | Fix description — h1 sibling scan | ✅ | Ř. 418-426 |
| 8 | Nová `_extract_equipment_from_text()` — checkmarks | ✅ | Ř. 75-78 |
| 9 | Nová `_extract_equipment_from_text()` — výbava: sekce | ✅ | Ř. 81-90 |
| 10 | Nová `_extract_equipment_from_text()` — known keywords fallback | ✅ | Ř. 93-105 |
| 11 | Return type change — přidat `list[str]` (equipment) | ✅ | Ř. 388-391 |
| 12 | Caller `_parse_ad` update — unpack 6 hodnot + `source_id` parametr | ✅ | Ř. 349 |
| 13 | `vehicle_equipment` v ScoutLeadPayload | ✅ | Ř. 381 |
| 14 | `_fetch_detail` signatura — přidat `source_id: Optional[str] = None` | ✅ | Ř. 388 |

---

## Shrnutí nálezů

| Závažnost | Počet | Popis |
|-----------|-------|-------|
| ❌ Kritická | 0 | — |
| ⚠️ Střední | 0 | — |
| ℹ️ Kosmetická | 2 | Dvojí get_text(); extra photo strategy nad rámec plánu |
| 📝 Lint | 16 | E402 pre-existing ×8, E501 ×8 (6 pre-existing, 2 nové trivial) |

---

**Celkový verdikt: ✅ SCHVÁLENO**

Implementace plně odpovídá schválenému plánu. Všechny edge cases ošetřeny. Žádné kritické ani střední bugy. Caller interface korektně aktualizován. Rate limiting zachován.
