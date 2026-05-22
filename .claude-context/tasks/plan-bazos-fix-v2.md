# PLAN: Bazoš scraper v2 — SVG filtr, equipment parsing, metadata

**Datum:** 2026-05-20
**Task:** #19
**Soubor:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/bazos.py` (559 řádků)
**Status:** TODO
**Blokuje:** LEAD-ENRICH-3 (quality)

---

## 4 bugy nalezené test-chrome na produkci

| # | Severity | Bug | Root Cause |
|---|----------|-----|------------|
| 1 | KRITICKÁ | Fotky obsahují SVG ikony (bazos.svg, map.svg, user.svg, facebook.svg, spam.svg) | `/img/` filtr propouští SVG ikony — bazos má ikony v `/img/` adresáři |
| 2 | KRITICKÁ | Hero foto = Bazoš logo (první fotka je SVG) | Důsledek bugu #1 — SVG je na indexu 0, Carmakler frontend bere `photos[0]` jako hero |
| 3 | IMPORTANT | vehicleEquipment = NULL u inzerátů s čárkovým seznamem (ACC, App-Connect, LED matrix...) | `_extract_equipment_from_text` nemá strategii pro comma-separated list BEZ explicitního "výbava:" headeru |
| 4 | MISSING | vehicleYear, vehicleMileage, vehicleFuel, vehicleBodyType = NULL | `_extract_params_from_text` neextrahuje year/mileage/bodyType; year je jen z titulku |

---

## Fix 1+2 (combined): SVG/icon filtr ve foto extrakci

### Problém

Řádky 467-495 — všechny 3 photo strategie propouští SVG soubory a site ikony:
- Strategy 1 (ř. 468-477): `div.carousel img` — carousel by neměl obsahovat SVG, ale filtr `/img/ in src` je příliš volný
- Strategy 2 (ř. 480-486): `img[src*='bazos.cz/img']` — **hlavní viník** — matchne i `bazos.cz/img/bazos.svg`
- Strategy 3 (ř. 489-493): URL generation — OK, generuje `.jpg`

### Řešení

**A) Přidat helper konstanty (za ř. 37, před `_extract_params_from_text`):**

```python
# Known Bazoš site icons that leak through /img/ filter
_ICON_FILENAMES = {
    "bazos.svg", "map.svg", "user.svg", "facebook.svg", "spam.svg",
    "logo.svg", "logo.png", "favicon.ico", "bazos.png",
    "arrow.svg", "search.svg", "close.svg", "menu.svg",
}

# Valid photo extensions (exclude SVG, ICO, GIF icons)
_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
```

**B) Přidat helper funkci (za konstanty):**

```python
def _is_valid_photo_url(src: str) -> bool:
    """Check if URL is a real listing photo, not a site icon/SVG."""
    # Reject known icon filenames
    filename = src.rsplit("/", 1)[-1].lower()
    if filename in _ICON_FILENAMES:
        return False
    # Reject SVG files (always icons on Bazoš)
    if filename.endswith(".svg"):
        return False
    # Reject favicon
    if "favicon" in filename:
        return False
    # Must have photo extension OR be extensionless (CDN URLs)
    # Strip query params for extension check
    clean = filename.split("?")[0]
    if "." in clean:
        ext = "." + clean.rsplit(".", 1)[-1]
        if ext not in _PHOTO_EXTENSIONS:
            return False
    # URL path must look like listing photo, not site asset
    # Bazoš listing photos: /img/{n}t/{dir}/{id}.jpg or /img/{n}/{dir}/{id}.jpg
    # Bazoš site assets: /img/bazos.svg, /img/map.svg (no numeric subdirectory)
    if re.search(r'/img/\d+', src):
        return True  # Has numeric subdir → listing photo
    if re.search(r'/img/[a-zA-Z]', src):
        return False  # Starts with letter after /img/ → site asset
    return True  # Other patterns, let through
```

**C) Upravit Strategy 1 (ř. 467-477):**

```python
# STÁVAJÍCÍ (ř. 473):
if src and "/img/" in src and src not in photos:

# NOVÝ:
if src and "/img/" in src and src not in photos and _is_valid_photo_url(src):
```

**D) Upravit Strategy 2 (ř. 480-486):**

```python
# STÁVAJÍCÍ (ř. 483):
if src and "/img/" in src and "thumb" not in src and "mini" not in src and src not in photos:

# NOVÝ:
if src and "/img/" in src and "thumb" not in src and "mini" not in src and src not in photos and _is_valid_photo_url(src):
```

### Souhrnná tabulka Fix 1+2

| Řádek | Akce | Detail |
|-------|------|--------|
| Za ř. 37 | ➕ PŘIDAT | `_ICON_FILENAMES` set + `_PHOTO_EXTENSIONS` set (~8 řádků) |
| Za konstanty | ➕ PŘIDAT | `_is_valid_photo_url()` funkce (~20 řádků) |
| ~473 | 🔧 FIX | Přidat `and _is_valid_photo_url(src)` do condition |
| ~483 | 🔧 FIX | Přidat `and _is_valid_photo_url(src)` do condition |

---

## Fix 3: Equipment parsing — comma-separated list bez headeru

### Problém

Řádky 66-107 — `_extract_equipment_from_text` má 3 strategie:
1. Checkmark items (`✅`, `☑`, `✓`, `►`, `•`) — OK
2. "výbava:" header + comma-separated — OK ale POUZE když text obsahuje slovo "výbava"
3. Known keywords fallback — najde jen generické české termíny

**Chybí:** Strategie pro comma-separated seznam BEZ headeru. Typický Bazoš formát:

```
ACC, App-Connect, LED matrix, vyhřívaný volant, digitální kokpit, 
panoramatická střecha, kamera, navigace...
```

Toto jsou typicky řádky/odstavce kde:
- Většina položek má 2-30 znaků
- Odděleny čárkou
- Žádný explicitní "výbava:" prefix
- Často na konci popisu

### Řešení

**Přidat Strategy 1.5 (za Strategy 1, před Strategy 2, ř. 79-80):**

```python
    # Strategy 1.5: Comma-separated list without header
    # Detect lines that look like equipment lists: 3+ short comma-separated items
    if not equipment:
        for line in text.split("\n"):
            line = line.strip()
            if "," not in line:
                continue
            parts = [p.strip() for p in line.split(",")]
            # Must have 3+ items, each 2-40 chars, no sentences (no verbs/periods)
            valid_parts = [
                p for p in parts
                if 2 < len(p) < 40
                and not p.endswith(".")
                and not re.search(r'\b(je|má|byl|jsou|není|bylo|bude|mám|bylo)\b', p, re.IGNORECASE)
            ]
            if len(valid_parts) >= 3 and len(valid_parts) / max(len(parts), 1) > 0.6:
                for item in valid_parts:
                    item = item.strip().rstrip(',.')
                    if item and item not in equipment:
                        equipment.append(item)
```

**POZOR:** Tato strategie musí být PŘED Strategy 2 (výbava header), protože je méně specifická. Ale musí být PO Strategy 1 (checkmarks), protože checkmarks jsou jednoznačnější.

**Řádové umístění:**

```python
def _extract_equipment_from_text(text: str) -> list[str]:
    equipment: list[str] = []

    # Strategy 1: Checkmark items (✅) — ř. 74-78 — BEZE ZMĚNY

    # Strategy 1.5: Comma-separated list without header — NOVÉ (~15 řádků)
    if not equipment:
        ...

    # Strategy 2: "výbava:" header — ř. 80-90 — BEZE ZMĚNY

    # Strategy 3: Known keywords — ř. 92-105 — BEZE ZMĚNY

    return equipment[:50]
```

### Souhrnná tabulka Fix 3

| Řádek | Akce | Detail |
|-------|------|--------|
| Za ř. 78 | ➕ PŘIDAT | Strategy 1.5: comma-separated detection (~15 řádků) |

---

## Fix 4: Metadata extrakce — year, mileage, body type, engine codes

### Problém

**`_extract_params_from_text` (ř. 39-63)** extrahuje jen: fuel, transmission, power, color.

**Chybí:**
- `year` — prodejci píšou "Vyrobeno 3/2023", "rok výroby 2019", "rv. 2020"
- `mileage` — "najeto 157 618 km", "tach. 95000 km", "km: 120.000"
- `body_type` — "sedan", "kombi", "hatchback", "SUV", "kupé"
- Engine code → fuel mapping: "TDI" → DIESEL, "TSI/TFSI" → PETROL, "e-tron" → ELECTRIC

### Řešení A: Rozšířit `_extract_params_from_text` (ř. 39-63)

**Přidat za color extrakci (za ř. 61), PŘED `return params`:**

```python
    # Year — "rok výroby 2019", "rv. 2020", "vyrobeno 3/2023", standalone 4-digit year
    year_patterns = [
        r'(?:rok\s*výroby|rv\.?|vyrobeno|rok)\s*:?\s*(?:\d{1,2}[/.])?(\d{4})',
        r'\b(20[0-2]\d)\b',  # 2000-2029 as standalone
        r'\b(19[9]\d)\b',    # 1990-1999 as standalone
    ]
    for pat in year_patterns:
        m = re.search(pat, text_lower)
        if m:
            y = int(m.group(1))
            if 1990 <= y <= 2026:
                params["year"] = y
                break

    # Mileage — "najeto 157 618 km", "tach. 95000 km", "km: 120.000", "120000km"
    mileage_patterns = [
        r'(?:najeto|tachometr|tach\.?|stav\s*(?:tachometru|km)|kilometry|km)\s*:?\s*([\d\s.]+)\s*km',
        r'([\d\s.]{4,10})\s*km\b',
    ]
    for pat in mileage_patterns:
        m = re.search(pat, text_lower)
        if m:
            raw = m.group(1).replace(" ", "").replace(".", "")
            try:
                km = int(raw)
                if 100 < km < 1_000_000:  # reasonable mileage range
                    params["mileage"] = km
                    break
            except ValueError:
                pass

    # Body type
    BODY_TYPE_PATTERNS = {
        r"\b(sedan)\b": "SEDAN",
        r"\b(kombi|combi|estate|variant|touring)\b": "COMBI",
        r"\b(hatchback|hatch)\b": "HATCHBACK",
        r"\b(suv|crossover)\b": "SUV",
        r"\b(kupé|coupe|coupé)\b": "COUPE",
        r"\b(kabriolet|cabrio|cabriolet|roadster|spider)\b": "CABRIOLET",
        r"\b(mpv|van|minivan|touran|sharan)\b": "MPV",
        r"\b(liftback|sportback)\b": "LIFTBACK",
        r"\b(pick\s*-?\s*up|pickup)\b": "PICKUP",
    }
    for pat, val in BODY_TYPE_PATTERNS.items():
        if re.search(pat, text_lower):
            params["body_type"] = val
            break

    # Engine code → fuel (more specific than generic fuel patterns)
    if "fuel" not in params:
        ENGINE_CODE_FUEL = {
            r"\btdi\b": "DIESEL",
            r"\bhdi\b": "DIESEL",
            r"\bcdti\b": "DIESEL",
            r"\bcrdi\b": "DIESEL",
            r"\bjtd\b": "DIESEL",
            r"\bdci\b": "DIESEL",
            r"\bbluehdi\b": "DIESEL",
            r"\btsi\b": "PETROL",
            r"\btfsi\b": "PETROL",
            r"\bgti\b": "PETROL",
            r"\bmpi\b": "PETROL",
            r"\bfsi\b": "PETROL",
            r"\becoboost\b": "PETROL",
            r"\bskyactiv-g\b": "PETROL",
            r"\bskyactiv-d\b": "DIESEL",
            r"\be-tron\b": "ELECTRIC",
            r"\bev\b": "ELECTRIC",
            r"\bbev\b": "ELECTRIC",
            r"\bphev\b": "HYBRID",
            r"\bmhev\b": "HYBRID",
        }
        for pat, val in ENGINE_CODE_FUEL.items():
            if re.search(pat, text_lower):
                params["fuel"] = val
                break
```

### Řešení B: Wire nové params v `_parse_ad` (ř. 364-386)

Aktuálně `vehicle_year` (ř. 376) bere hodnotu POUZE z `_parse_vehicle_from_title` (ř. 332). Popis má lepší data (explicitní "rok výroby 2019") než titulek (heuristický regex na 4-digit number).

**Stávající (ř. 376):**
```python
vehicle_year=year,
```

**Nový:**
```python
vehicle_year=detail_params.get("year") or year,
```

**Stávající (ř. 382-385):**
```python
vehicle_fuel=detail_params.get("fuel"),
vehicle_transmission=detail_params.get("transmission"),
vehicle_power=detail_params.get("power"),
vehicle_color=detail_params.get("color"),
```

**Nový (přidat mileage + body_type):**
```python
vehicle_fuel=detail_params.get("fuel"),
vehicle_transmission=detail_params.get("transmission"),
vehicle_power=detail_params.get("power"),
vehicle_color=detail_params.get("color"),
vehicle_mileage=detail_params.get("mileage"),
vehicle_body_type=detail_params.get("body_type"),
```

**POZOR:** Ověřit, že `ScoutLeadPayload` má pole `vehicle_mileage` a `vehicle_body_type`. Pokud ne → přidat do `models.py`.

### Řešení C: BODY_TYPE_PATTERNS jako module-level konstanta

Přesunout `BODY_TYPE_PATTERNS` a `ENGINE_CODE_FUEL` na module level (za `CZ_COLORS`, ř. 37) — konzistentně s `FUEL_PATTERNS` a `TRANSMISSION_PATTERNS` které jsou už na module level.

```python
BODY_TYPE_PATTERNS = {
    r"\b(sedan)\b": "SEDAN",
    r"\b(kombi|combi|estate|variant|touring)\b": "COMBI",
    ...
}

ENGINE_CODE_FUEL = {
    r"\btdi\b": "DIESEL",
    ...
}
```

### Souhrnná tabulka Fix 4

| Řádek | Akce | Detail |
|-------|------|--------|
| Za ř. 36 | ➕ PŘIDAT | `BODY_TYPE_PATTERNS` dict (~10 řádků) |
| Za ř. 36 | ➕ PŘIDAT | `ENGINE_CODE_FUEL` dict (~20 řádků) |
| 61 (za color) | ➕ PŘIDAT | Year extrakce (~8 řádků) |
| Za year | ➕ PŘIDAT | Mileage extrakce (~12 řádků) |
| Za mileage | ➕ PŘIDAT | Body type extrakce (~4 řádky) — reference module-level dict |
| Za body_type | ➕ PŘIDAT | Engine code → fuel (~4 řádky) — reference module-level dict |
| 376 | 🔧 FIX | `vehicle_year=detail_params.get("year") or year,` |
| Za ř. 385 | ➕ PŘIDAT | `vehicle_mileage=detail_params.get("mileage"),` |
| Za mileage | ➕ PŘIDAT | `vehicle_body_type=detail_params.get("body_type"),` |
| models.py | ❓ OVĚŘIT | `vehicle_mileage` a `vehicle_body_type` pole v `ScoutLeadPayload` |

---

## Celková souhrnná tabulka

| Fix | Řádky | Nový kód | Upravený kód | Severity |
|-----|-------|----------|--------------|----------|
| 1+2 | Za ř. 37 + ř. 473 + ř. 483 | ~28 řádků (konstanty + helper) | 2 řádky (condition) | KRITICKÁ |
| 3 | Za ř. 78 | ~15 řádků (Strategy 1.5) | 0 | IMPORTANT |
| 4 | Za ř. 36 + ř. 61 + ř. 376-385 | ~60 řádků (patterns + extrakce) | 3 řádky (wire) | MISSING |

**Celkem: ~103 řádků nového kódu, ~5 řádků upraveného kódu.**

---

## Pořadí implementace

1. **Fix 1+2** (SVG filtr) — PRVNÍ, je KRITICKÁ, nejmenší blast radius
2. **Fix 4** (metadata) — DRUHÝ, nezávislý na ostatních
3. **Fix 3** (equipment) — TŘETÍ, nezávislý

Všechny 3 fixy mohou být v jednom commitu — netřeba split.

---

## Závislosti

- `ScoutLeadPayload` — ověřit existence `vehicle_mileage` a `vehicle_body_type` polí v `models.py` (ř. ~98-102). Pokud neexistují:
  - Přidat `vehicle_mileage: Optional[int] = None`
  - Přidat `vehicle_body_type: Optional[str] = None`

---

## Error handling

| Scénář | Chování |
|--------|---------|
| SVG URL passthrough | `_is_valid_photo_url` ji odmítne → foto se nepřidá |
| Všechny fotky jsou SVG | Strategy 3 (URL generation z ID) se aktivuje jako fallback |
| Comma-separated text je věta (ne equipment) | Verb filter + min 3 items + ratio check → false positive rate nízký |
| Year regex matchne číslo v ceně | Range check 1990-2026 + prioritní patterns ("rok výroby") mají přednost |
| Mileage z textu = nesmyslná hodnota | Range check 100 < km < 1M filtruje edge cases |
| Engine code conflict (TDI v textu + "benzín") | Engine code se aplikuje jen pokud `fuel` NENÍ already set (existing FUEL_PATTERNS mají přednost) |

---

## Test scénáře

1. **SVG filter:** Inzerát s fotkami [`/img/bazos.svg`, `/img/1t/123/456789.jpg`] → bazos.svg odfiltrováno, zůstane jen .jpg
2. **Icon filter:** URL `/img/facebook.svg` → odmítnutá, `/img/3t/789/123456.jpg` → přijata
3. **Comma equipment:** Text "ACC, App-Connect, LED matrix, vyhřívaný volant" → 4 equipment items
4. **Mixed commas:** Text "Prodám auto, je v dobrém stavu, najeto málo" → verb filter odmítne (obsahuje "je")
5. **Year from desc:** "Rok výroby: 2019" → `year = 2019`, přepíše title-parsed year
6. **Mileage:** "najeto 157 618 km" → `mileage = 157618`
7. **Body type:** "Škoda Octavia kombi" → `body_type = "COMBI"`
8. **Engine code:** "2.0 TDI 150kW" → `fuel = "DIESEL"`, `power = 150`
9. **No regression:** Existující phone/seller_name/description extrakce nezměněna

---

## Acceptance Criteria

- [ ] Fotky NEOBSAHUJÍ `.svg` soubory
- [ ] Fotky NEOBSAHUJÍ known icon filenames (bazos.svg, map.svg, etc.)
- [ ] Hero foto (photos[0]) je reálná fotka auta, ne Bazoš logo
- [ ] Equipment se extrahuje z comma-separated seznamů i bez "výbava:" headeru
- [ ] vehicleYear se plní z popisu (preferenčně) nebo titulku (fallback)
- [ ] vehicleMileage se plní z popisu
- [ ] vehicleFuel se plní z engine codes (TDI→DIESEL) když generický pattern nechytí
- [ ] vehicleBodyType se plní z popisu
- [ ] Žádný regression na stávajícím phone/seller/description flow
