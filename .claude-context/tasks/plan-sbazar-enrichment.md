# PLAN: Sbazar scraper — přidání enrichment (fotky, popis, výbava)

**Datum:** 2026-05-20
**Task:** #11 → blokuje #6 (LEAD-ENRICH-4)
**Soubor:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/sbazar.py`
**Status:** HOTOVO

---

## Přehled

Sbazar scraper aktuálně extrahuje z detail stránky POUZE telefon (`_fetch_phone`, ř. 206-255).
Neextrahuje popis, fotky ani výbavu → 0 enrichment.

**Cíl:** Rozšířit `_fetch_phone` na `_fetch_detail` a přidat extrakci description, photos, equipment.

**Klíčový kontext:** Sbazar je Astro.js framework (plně JS-rendered). WebFetch NEMŮŽE vidět rendered DOM. Selektory v tomto plánu jsou kandidáti — **implementátor MUSÍ ověřit v Playwright runtime** (spustit Playwright, navigovat na reálný inzerát, uložit `page.content()`, analyzovat HTML).

---

## Krok 0: Selector discovery (IMPLEMENTÁTOR MUSÍ UDĚLAT PRVNÍ)

**Před implementací** musí developer:

1. Spustit Playwright na reálný Sbazar inzerát
2. Uložit rendered HTML: `page.content()` → soubor
3. Hledat v něm reálné class names pro:
   - Description container
   - Gallery/photos container + img src pattern
   - Parameters/equipment section
   - CDN domain pro obrázky

**Příklad kódu pro discovery:**
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=False)  # headless=False pro vizuální kontrolu
    page = browser.new_page()
    page.goto("https://www.sbazar.cz/inzerat/228345644-skoda-octavia-iii-kombi-20-tdi-dsg-182-2026")
    # Dismiss consent
    page.locator("button:has-text('Souhlasím')").click()
    page.wait_for_timeout(3000)
    
    html = page.content()
    with open("/tmp/sbazar_detail.html", "w") as f:
        f.write(html)
    
    browser.close()
```

Pak: `grep -oP 'class="[^"]*"' /tmp/sbazar_detail.html | sort -u`

---

## Krok 1: Přejmenovat `_fetch_phone` → `_fetch_detail`

### Změna signatury

**Stávající (ř. 206):**
```python
def _fetch_phone(self, page, url: str) -> Optional[str]:
    """Visit detail page and extract phone number."""
```

**Nový:**
```python
def _fetch_detail(self, page, url: str) -> tuple[
    Optional[str],   # phone
    Optional[str],   # description
    list[str],       # photos
    list[str],       # equipment
]:
    """Visit detail page, extract phone, description, photos, equipment."""
```

---

## Krok 2: Rozšířit tělo metody

**Stávající flow (ř. 206-255):**
1. Navigate → URL
2. Click "Zobrazit telefon" button
3. `page.content()` → soup
4. Extract phone (tel: link → contact sections → full page scan)
5. Return phone

**Nový flow:**
1. Navigate → URL
2. Click "Zobrazit telefon" button
3. `page.content()` → soup
4. Extract phone (BEZE ZMĚNY)
5. **NEW: Extract description**
6. **NEW: Extract photos**
7. **NEW: Extract equipment**
8. Return (phone, description, photos, equipment)

### Nový kód (za phone extrakci, nahradit return na ř. 254-255):

```python
        # === ENRICHMENT (new) ===

        # Description — try multiple selectors
        description = None
        desc_selectors = [
            # Sbazar-specific (VERIFY IN PLAYWRIGHT):
            "div[data-dot='description']",
            "div[class*='description']",
            "div[class*='popis']",
            "section[class*='description']",
            # Astro-rendered article content:
            "article p",
            "div[class*='detail'] p",
            # Generic fallback:
            "div[class*='text'] p",
        ]
        for sel in desc_selectors:
            el = soup.select_one(sel)
            if el:
                text = el.get_text(strip=True)
                if text and len(text) > 20:
                    description = text[:5000]
                    break

        # If individual selectors failed, try collecting all <p> in main content
        if not description:
            main = soup.select_one("main, article, div[role='main']")
            if main:
                paragraphs = [p.get_text(strip=True) for p in main.select("p") if len(p.get_text(strip=True)) > 10]
                if paragraphs:
                    description = "\n".join(paragraphs)[:5000]

        # Photos — Sbazar is Seznam.cz property, CDN likely im9.cz or sdn.cz
        photos: list[str] = []
        photo_selectors = [
            # Sbazar-specific (VERIFY IN PLAYWRIGHT):
            "div[class*='gallery'] img",
            "div[class*='carousel'] img",
            "div[class*='slider'] img",
            "div[class*='photo'] img",
            # Astro picture elements:
            "picture source[srcset]",
            "picture img[src]",
            # Generic image containers:
            "div[class*='image'] img",
            "figure img",
        ]
        seen_urls: set[str] = set()
        for sel in photo_selectors:
            for el in soup.select(sel):
                # Try multiple src attributes (lazy loading patterns)
                src = (el.get("data-src")
                       or el.get("srcset", "").split(",")[0].split(" ")[0]  # first srcset URL
                       or el.get("src")
                       or "")
                if not src or src in seen_urls:
                    continue
                # Filter: must be Seznam CDN or contain listing-related path
                if any(cdn in src for cdn in ["im9.cz", "sdn.cz", "sbazar", "szn.cz"]):
                    if src.startswith("//"):
                        src = "https:" + src
                    elif src.startswith("/"):
                        src = f"{BASE_URL}{src}"
                    seen_urls.add(src)
                    photos.append(src)
            if photos:
                break  # found photos with this selector, stop trying others
        photos = photos[:30]

        # Equipment/Parameters — structured list or definition list
        equipment: list[str] = []
        param_selectors = [
            # Sbazar-specific (VERIFY IN PLAYWRIGHT):
            "div[class*='parameter'] li",
            "div[class*='param'] li",
            "div[class*='feature'] li",
            "div[class*='vybava'] li",
            "div[class*='equipment'] li",
            # Definition lists:
            "dl dt",
            # Table cells:
            "table[class*='param'] td",
            "div[class*='spec'] span",
            # data-dot attributes:
            "div[data-dot*='param'] li",
        ]
        for sel in param_selectors:
            for el in soup.select(sel):
                text = el.get_text(strip=True)
                if text and len(text) > 1 and len(text) < 100 and text not in equipment:
                    equipment.append(text)
            if equipment:
                break
        equipment = equipment[:50]

        # Fallback: extract equipment from description (same as Bazoš approach)
        if not equipment and description:
            # Checkmarks
            for match in re.finditer(r'[✅☑✓►•]\s*(.+?)(?=\n|[✅☑✓►•]|$)', description):
                item = match.group(1).strip().rstrip(',.')
                if item and len(item) > 2 and len(item) < 100:
                    equipment.append(item)
            # "Výbava:" section
            if not equipment:
                vybava_match = re.search(
                    r'(?:výbava|vybavení)\s*[:\-–]\s*(.+?)(?:\n\n|\.\s*[A-Z]|$)',
                    description, re.IGNORECASE | re.DOTALL
                )
                if vybava_match:
                    for item in re.split(r'[,;•\n]', vybava_match.group(1)):
                        item = item.strip().rstrip(',.')
                        if item and len(item) > 2 and len(item) < 100:
                            equipment.append(item)

        return phone, description, photos, equipment
```

---

## Krok 3: Aktualizovat volání v `scrape()`

### Místo 1: První stránka (ř. 52-59)

**Stávající:**
```python
# Visit detail pages for phone numbers
for lead in leads:
    if lead.source_url:
        phone = self._fetch_phone(page, lead.source_url)
        if phone:
            lead.phone = phone
            result.leads.append(lead)
            result.total_found += 1
```

**Nový:**
```python
# Visit detail pages for phone + enrichment
for lead in leads:
    if lead.source_url:
        phone, description, photos, equipment = self._fetch_detail(page, lead.source_url)
        if phone:
            lead.phone = phone
            if description:
                lead.vehicle_description = description
            if photos:
                lead.vehicle_photos = photos
            if equipment:
                lead.vehicle_equipment = equipment
            result.leads.append(lead)
            result.total_found += 1
```

### Místo 2: Zbylé stránky (ř. 76-82) — identická změna

**Stávající:**
```python
for lead in page_leads:
    if lead.source_url:
        phone = self._fetch_phone(page, lead.source_url)
        if phone:
            lead.phone = phone
            result.leads.append(lead)
            result.total_found += 1
```

**Nový:**
```python
for lead in page_leads:
    if lead.source_url:
        phone, description, photos, equipment = self._fetch_detail(page, lead.source_url)
        if phone:
            lead.phone = phone
            if description:
                lead.vehicle_description = description
            if photos:
                lead.vehicle_photos = photos
            if equipment:
                lead.vehicle_equipment = equipment
            result.leads.append(lead)
            result.total_found += 1
```

**TIP: Extrahovat do helper metody** aby se kód neopakoval:

```python
def _enrich_lead(self, lead: ScoutLeadPayload, page) -> bool:
    """Fetch detail page for lead, enrich with phone + data. Returns True if phone found."""
    if not lead.source_url:
        return False
    phone, description, photos, equipment = self._fetch_detail(page, lead.source_url)
    if not phone:
        return False
    lead.phone = phone
    if description:
        lead.vehicle_description = description
    if photos:
        lead.vehicle_photos = photos
    if equipment:
        lead.vehicle_equipment = equipment
    return True
```

Pak volání v obou místech: 
```python
if self._enrich_lead(lead, page):
    result.leads.append(lead)
    result.total_found += 1
```

---

## Souhrnná tabulka změn

| Řádky | Akce | Detail |
|-------|------|--------|
| 52-59 | 🔄 PŘEPSAT | `_fetch_phone` → `_fetch_detail` + enrichment |
| 76-82 | 🔄 PŘEPSAT | Identická změna (druhá smyčka) |
| 206 | 🔄 PŘEJMENOVAT | `_fetch_phone` → `_fetch_detail` |
| 206 | 🔧 FIX | Nová signatura: return tuple[str, str, list, list] |
| Za ř. 254 | ➕ PŘIDAT | Description extrakce (~20 řádků) |
| Za desc | ➕ PŘIDAT | Photo extrakce (~25 řádků) |
| Za photos | ➕ PŘIDAT | Equipment extrakce (~25 řádků) |
| 254-255 | 🔧 FIX | Return tuple místo Optional[str] |
| (optional) | ➕ PŘIDAT | Helper `_enrich_lead()` (~12 řádků) |

---

## Závislosti a pořadí

1. **Krok 0** (selector discovery) MUSÍ být první — bez reálných class names jsou selektory jen kandidáti
2. Krok 1 (přejmenování) + Krok 2 (rozšíření těla) + Krok 3 (caller update) → jeden commit
3. Žádné schema/DB změny — `ScoutLeadPayload` už má `vehicle_description`, `vehicle_photos`, `vehicle_equipment` pole

---

## Error handling

| Scénář | Chování |
|--------|---------|
| Navigate fail | Return (None, None, [], []) — lead se nepřidá |
| No description found | `description = None` — lead se přidá (pokud má phone) |
| No photos found | `photos = []` → `lead.vehicle_photos` stays None |
| Photo CDN unknown | Photos s neznámou CDN se přeskočí (filter) |
| Equipment selector miss | Fallback: parsování z description textu |
| Astro hydration slow | Playwright `page.content()` by měl počkat na hydration, ale můžeme přidat `page.wait_for_timeout(2000)` po navigate |

---

## DŮLEŽITÉ: Hydration wait

Sbazar (Astro.js) potřebuje čas na hydration. Aktuální `_fetch_phone` nemá explicit wait po navigate (jen po phone button click). Přidat:

```python
if not self._navigate(page, url):
    return None, None, [], []

# Wait for Astro hydration to complete
page.wait_for_timeout(2000)
```

Nebo lépe — wait for specific element:
```python
try:
    page.wait_for_selector("img[src*='im9.cz'], img[src*='sdn.cz'], div[class*='gallery']", timeout=5000)
except Exception:
    pass  # Continue even if selector not found — we'll try with what we have
```

---

## Test scénáře

1. **Happy path:** Phone + description + photos + equipment all found
2. **Phone only:** Selektory pro enrichment nechytí nic → lead má jen phone (jako dosud)
3. **No phone:** Return early → lead se nepřidá
4. **Slow hydration:** `wait_for_timeout(2000)` zajistí rendered DOM
5. **Expired listing (410):** Navigate fail → return empty tuple

---

## Acceptance Criteria

- [ ] **Krok 0 hotov:** Developer ověřil reálné CSS class names v Playwright
- [ ] `_fetch_phone` přejmenována na `_fetch_detail`
- [ ] Description extrakce funguje na >50% leadů
- [ ] Photo extrakce funguje (s ověřenými selektory)
- [ ] Equipment extrakce funguje (z HTML nebo z textu)
- [ ] Oba caller místa (`scrape()` ř. 52-59 a 76-82) aktualizovány
- [ ] Hydration wait přidán
- [ ] Žádný regression — phone extrakce stále funguje

---

## Odhad rozsahu

- **Nový kód:** ~70 řádků (description + photos + equipment extrakce)
- **Upravený kód:** ~20 řádků (signatura + caller sites)
- **Helper (optional):** ~12 řádků (`_enrich_lead`)
- **Riziko:** STŘEDNÍ — selektory jsou kandidáti, musí se ověřit v Playwright. Bez ověření může enrichment vrátit 0 dat.
