# PLAN: Bazoš scraper — fix fotek, popisů + přidání výbavy

**Datum:** 2026-05-20
**Task:** #10 → blokuje #5 (LEAD-ENRICH-3)
**Soubor:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/bazos.py`
**Status:** HOTOVO

---

## Přehled

Tři problémy v `_fetch_detail()` (ř. 341-408):
1. **Fotky:** Jen 3 ze 43 leadů mají fotky — photo selektory nechytí lazy-loaded obrázky
2. **Popis:** Jen 3 ze 43 — `div.popisdetail` selektor nespolehlivý
3. **Výbava:** 0 ze 43 — neimplementováno (výbava je v popisu textu, ne v HTML)

---

## Krok 1: Fix foto extrakce (ř. 399-406)

### Problém

Bazos carousel používá **Flickity** s `lazyLoad: 1`:
- Jen 1. foto má `src` attribute
- Zbylé fotky mají `data-flickity-lazyload` místo `src`
- `img[src*='img.bazos']` NIKDY nematchuje (domain je `www.bazos.cz`, ne `img.bazos.cz`)
- `img[src*='www.bazos']` matchne jen ten 1 načtený obrázek

### Řešení — Tři strategie

**A) Carousel selector + lazyload attr (primární)**
```python
# Stávající kód (ř. 399-406):
for img in soup.select("img[src*='img.bazos'], img[src*='www.bazos']"):
    src = img.get("src", "")
    ...
```

**Nový kód:**
```python
# Photos — Strategy 1: Carousel images (Flickity lazy-loaded)
for img in soup.select("div.carousel img"):
    # Flickity lazy-loads: first image has src, rest have data-flickity-lazyload
    src = (img.get("data-flickity-lazyload")
           or img.get("data-src")
           or img.get("src")
           or "")
    if src and "/img/" in src and src not in photos:
        if not src.startswith("http"):
            src = "https:" + src if src.startswith("//") else f"https://www.bazos.cz{src}"
        # Skip thumbnails
        if "thumb" not in src and "mini" not in src:
            photos.append(src)

# Photos — Strategy 2: Generate from listing ID if carousel empty
if not photos and source_id:
    # Bazos URL pattern: /img/{n}t/{last3digits}/{id}.jpg
    dir_part = source_id[-3:]  # last 3 digits of listing ID
    for n in range(1, 21):  # try up to 20 photos
        photo_url = f"https://www.bazos.cz/img/{n}t/{dir_part}/{source_id}.jpg"
        photos.append(photo_url)
    # Note: some of these URLs may 404 — that's OK, Carmakler
    # will filter non-200 URLs when displaying

photos = photos[:30]
```

**POZOR — source_id dependency:** Metoda `_fetch_detail` aktuálně NEMÁ přístup k `source_id`. Musíme ho přidat jako parametr.

### Změna signatury `_fetch_detail`

**Stávající (ř. 341):**
```python
def _fetch_detail(self, client, url: str) -> tuple[...]:
```

**Nový:**
```python
def _fetch_detail(self, client, url: str, source_id: Optional[str] = None) -> tuple[...]:
```

**Volání v `_parse_ad` (ř. 303) — přidat source_id:**
```python
# Stávající (ř. 303):
phone, seller_name, description, photos, detail_params = self._fetch_detail(client, detail_url)

# Nový:
phone, seller_name, description, photos, detail_params = self._fetch_detail(client, detail_url, source_id)
```

---

## Krok 2: Fix description extrakce (ř. 358-366)

### Problém

`div.popisdetail` matchuje jen na některých inzerátech. Na novějších stránkách je popis v jiném elementu.

### Řešení — Přidat fallback selektory

**Stávající kód (ř. 358-366):**
```python
desc_el = soup.select_one("div.popisdetail")
```

**Nový kód:**
```python
# Description — try multiple selectors (Bazoš layout varies)
desc_el = None
for sel in [
    "div.popisdetail",         # Classic layout
    "div.popis",               # Alternative class
    "div[class*='popis']",     # Partial match
]:
    desc_el = soup.select_one(sel)
    if desc_el:
        break

# Fallback: find the main text block between h1 and carousel
if not desc_el:
    # Look for the largest text block in the page body
    h1 = soup.select_one("h1")
    if h1:
        # Get the next sibling elements until we hit the carousel or images
        for sibling in h1.find_next_siblings():
            if sibling.name in ("div", "p") and not sibling.select("img"):
                text = sibling.get_text(strip=True)
                if text and len(text) > 20:
                    desc_el = sibling
                    break
```

Zbytek (ř. 360-366) zůstává beze změny — `desc_text = desc_el.get_text()` etc.

---

## Krok 3: Přidat extrakci výbavy z popisu (NOVÉ)

### Kontext

Bazos NEMÁ strukturovanou sekci pro výbavu. Prodejci píšou výbavu do description:
- Checkmark style: `✅Garance kilometru`, `✅Nehavarováno`
- Seznam: `Výbava: klima, tempomat, alu kola, ...`
- Volný text: "vybavení zahrnuje: ..."

### Implementace — Nová funkce + integrace

**A) Přidat novou funkci po `_extract_params_from_text` (za ř. 63):**

```python
def _extract_equipment_from_text(text: str) -> list[str]:
    """Extract equipment items from Bazoš description text.
    
    Bazoš has no structured equipment HTML — sellers write it in description
    using checkmarks (✅), bullet points, or comma-separated lists.
    """
    equipment: list[str] = []
    
    # Strategy 1: Checkmark items (✅ or ☑ followed by text)
    for match in re.finditer(r'[✅☑✓►•]\s*(.+?)(?=\n|[✅☑✓►•]|$)', text):
        item = match.group(1).strip().rstrip(',.')
        if item and len(item) > 2 and len(item) < 100 and item not in equipment:
            equipment.append(item)
    
    # Strategy 2: "výbava:" or "vybavení:" section — comma-separated
    vybava_match = re.search(
        r'(?:výbava|vybavení|equipment|features)\s*[:\-–]\s*(.+?)(?:\n\n|\.\s*[A-Z]|$)',
        text, re.IGNORECASE | re.DOTALL
    )
    if vybava_match:
        items_text = vybava_match.group(1)
        for item in re.split(r'[,;•\n]', items_text):
            item = item.strip().rstrip(',.')
            if item and len(item) > 2 and len(item) < 100 and item not in equipment:
                equipment.append(item)
    
    # Strategy 3: Known equipment keywords (if nothing found yet)
    if not equipment:
        known_items = [
            "klimatizace", "klima", "tempomat", "navigace", "kamera",
            "parkovací senzory", "vyhřívané sedačky", "kožené sedačky",
            "xenon", "led", "alu kola", "litá kola", "tažné zařízení",
            "střešní okno", "panoramatická střecha", "bluetooth",
            "centrální zamykání", "el. okna", "el. zrcátka",
            "abs", "esp", "asr", "isofix", "hands-free",
        ]
        text_lower = text.lower()
        for item in known_items:
            if item in text_lower and item.capitalize() not in equipment:
                equipment.append(item.capitalize())
    
    return equipment[:50]
```

**B) Integrace do `_fetch_detail` — za description extrakci (za ř. 366):**

```python
# Equipment — extract from description text
equipment: list[str] = []
if description:
    equipment = _extract_equipment_from_text(description)
```

**C) Upravit return type a return statement:**

**Stávající return type (ř. 341-344):**
```python
def _fetch_detail(self, client, url: str) -> tuple[
    Optional[str], Optional[str],
    Optional[str], list[str], dict,
]:
```

**Nový return type:**
```python
def _fetch_detail(self, client, url: str, source_id: Optional[str] = None) -> tuple[
    Optional[str], Optional[str],
    Optional[str], list[str], list[str], dict,
]:
    """Fetch detail page: phone, seller name, description, photos, equipment, extracted params."""
```

**Stávající return (ř. 408):**
```python
return phone, seller_name, description, photos, params
```

**Nový return:**
```python
return phone, seller_name, description, photos, equipment, params
```

**D) Upravit volání v `_parse_ad` (ř. 303):**

**Stávající:**
```python
phone, seller_name, description, photos, detail_params = self._fetch_detail(client, detail_url)
```

**Nový:**
```python
phone, seller_name, description, photos, equipment, detail_params = self._fetch_detail(client, detail_url, source_id)
```

**E) Přidat equipment do ScoutLeadPayload (ř. 318-339):**

Za ř. 333 přidat:
```python
vehicle_equipment=equipment if equipment else None,
```

---

## Souhrnná tabulka změn

| Řádky | Soubor | Akce | Detail |
|-------|--------|------|--------|
| Za ř. 63 | bazos.py | ➕ PŘIDAT | Nová funkce `_extract_equipment_from_text()` (~30 řádků) |
| 303 | bazos.py | 🔧 FIX | Přidat `source_id` do volání `_fetch_detail`, přidat `equipment` do unpacking |
| Za ř. 333 | bazos.py | ➕ PŘIDAT | `vehicle_equipment=equipment if equipment else None,` |
| 341-344 | bazos.py | 🔧 FIX | Přidat `source_id` parametr + `list[str]` do return type |
| 345 | bazos.py | 🔧 FIX | Aktualizovat docstring |
| 358-366 | bazos.py | 🔧 FIX | Přidat fallback selektory pro description |
| Za ř. 366 | bazos.py | ➕ PŘIDAT | Equipment extrakce: `equipment = _extract_equipment_from_text(description)` |
| 399-406 | bazos.py | 🔄 PŘEPSAT | Kompletně nová photo extrakce (carousel + lazyload + URL generation) |
| 408 | bazos.py | 🔧 FIX | Přidat `equipment` do return tuple |

---

## Detailní pseudokód nové `_fetch_detail`

```
_fetch_detail(client, url, source_id=None):
    response = fetch(url)
    soup = parse(response)
    
    phone = None
    seller_name = None
    description = None
    photos = []
    equipment = []
    params = {}
    
    # 1. DESCRIPTION — multi-selector with fallback
    desc_el = try_selectors([
        "div.popisdetail",
        "div.popis", 
        "div[class*='popis']",
    ])
    IF NOT desc_el:
        desc_el = find_text_block_after_h1()
    
    IF desc_el:
        description = desc_el.text[:5000]
        params = extract_params_from_text(description)
    
    # 2. PHONE — unchanged (tel: link, regex in description)
    phone = find_tel_link() or find_phone_in_text(desc_text)
    
    # 3. SELLER NAME — unchanged
    seller_name = find_in_td("inzer")
    
    # 4. PHOTOS — new triple strategy
    # 4a. Carousel images with lazyload
    FOR img IN soup.select("div.carousel img"):
        src = img["data-flickity-lazyload"] or img["data-src"] or img["src"]
        IF valid: photos.append(src)
    
    # 4b. URL generation fallback
    IF NOT photos AND source_id:
        dir = source_id[-3:]
        FOR n IN 1..20:
            photos.append(f"https://www.bazos.cz/img/{n}t/{dir}/{source_id}.jpg")
    
    photos = photos[:30]
    
    # 5. EQUIPMENT — new, from description text
    IF description:
        equipment = extract_equipment_from_text(description)
    
    RETURN (phone, seller_name, description, photos, equipment, params)
```

---

## Error handling

| Scénář | Chování |
|--------|---------|
| `div.popisdetail` neexistuje | Fallback selektory → h1 sibling scan |
| Žádný carousel | URL generation z source_id (20 URLs, některé budou 404) |
| source_id je None | Skip URL generation, prázdný photo list |
| Description je prázdný | Equipment extrakce se neprovede, vrátí [] |
| Equipment regex nechytí nic | Known-keywords scan jako poslední fallback |

---

## Test scénáře

1. **Classic layout:** `div.popisdetail` existuje, carousel s Flickity → popis + fotky + výbava z textu
2. **New layout:** `div.popisdetail` neexistuje → fallback najde popis, carousel fotky fungují
3. **No carousel:** Inzerát bez fotek → URL generation z ID (pokud source_id existuje)
4. **Checkmark equipment:** Popis obsahuje `✅Klima ✅Tempomat` → extrahuje ["Klima", "Tempomat"]
5. **"Výbava:" section:** Popis obsahuje `Výbava: klima, tempomat, alu kola` → extrahuje 3 items
6. **No equipment text:** Popis nemá výbavu → known-keywords fallback hledá "klimatizace" etc.

---

## Acceptance Criteria

- [ ] Photo extrakce: majority leadů (>30 ze 43) má `vehicle_photos` (ne 3 jako dosud)
- [ ] Description: majority leadů má `vehicle_description` (ne 3)
- [ ] Equipment: leadů s `vehicle_equipment` > 0 (nově implementováno)
- [ ] Return type change nerozbije callers (`_parse_ad` aktualizován)
- [ ] Zachována zpětná kompatibilita — stávající flow (phone, seller, price) nezměněn
- [ ] `_extract_equipment_from_text` funguje na reálných Bazoš popisech

---

## Odhad rozsahu

- **Nový kód:** ~50 řádků (`_extract_equipment_from_text` + equipment integrace)
- **Upravený kód:** ~30 řádků (photo selektory + description fallbacky + return types)
- **Riziko:** Nízké — photo URL generation může vytvořit 404 URLs, ale to je OK pro Carmakler frontend
