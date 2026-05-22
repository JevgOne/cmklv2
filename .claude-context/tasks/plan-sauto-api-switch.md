# PLAN: Sauto scraper — přepnutí z DOM scrapingu na API volání

**Datum:** 2026-05-20
**Task:** #9 → blokuje #4 (LEAD-ENRICH-2)
**Soubor:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/sauto.py`
**Status:** HOTOVO

---

## Přehled

Přepnout enrichment data (description, photos, equipment) z nefunkčního DOM scrapingu na Sauto REST API.
Ponechat Playwright pro listing page crawling (stránky výpisů) a phone reveal button click.

**API endpoint:** `GET https://www.sauto.cz/api/v1/items/{source_id}`

---

## Krok 1: Přidat API fetch metodu

**Kde:** Nová metoda `_fetch_enrichment_from_api()` ve třídě `SautoScraper` (po řádku 397)

```python
def _fetch_enrichment_from_api(self, source_id: str) -> tuple[
    Optional[str], list[str], list[str],   # description, photos, equipment
    Optional[str], Optional[Category],      # seller_name, seller_category
    Optional[str],                          # city
]:
    """Fetch enrichment data from Sauto REST API (more reliable than DOM scraping)."""
    api_url = f"{BASE_URL}/api/v1/items/{source_id}"
    try:
        with self._get_client() as client:
            self._rate_limit()
            response = client.get(api_url)
            if response.status_code != 200:
                logger.debug("Sauto API %d for %s", response.status_code, source_id)
                return None, [], [], None, None, None
            data = response.json()
    except Exception as e:
        logger.debug("Sauto API error for %s: %s", source_id, e)
        return None, [], [], None, None, None

    # Description
    description = data.get("description")
    if description:
        description = description.strip()[:5000]

    # Photos — CDN: d19-a.sdn.cz
    photos = []
    for img in (data.get("images") or []):
        url = img.get("url") or ""
        if url:
            if url.startswith("//"):
                url = "https:" + url
            photos.append(url)
    photos = photos[:30]

    # Equipment
    equipment = []
    for item in (data.get("equipment_cb") or []):
        name = item.get("name")
        if name and name not in equipment:
            equipment.append(name)
    equipment = equipment[:50]

    # Seller info
    seller_name = None
    seller_category = None
    premise = data.get("premise")
    if premise:
        seller_name = premise.get("name")
        # Premises (named entities) are dealers
        seller_category = Category.AUTOBAZAR
    else:
        # No premise = private seller
        seller_category = Category.SOUKROMNIK

    # City
    city = None
    locality = data.get("locality") or {}
    city = locality.get("district") or locality.get("region")

    return description, photos, equipment, seller_name, seller_category, city
```

**Závislost:** Metoda potřebuje `self._get_client()` a `self._rate_limit()` z `BaseScraper`. Ty jsou dostupné přes dědičnost `HeadlessScraper → BaseScraper`.

**POZOR:** `_get_client()` vrací `httpx.Client` — je to context manager. V SautoScraper se v hlavním `scrape()` používá Playwright (`_get_browser()`), ale pro API volání potřebujeme httpx separátně. Ověřit, že `_get_client()` je dostupná (je — definovaná v `BaseScraper`, ř. 39).

---

## Krok 2: Upravit `_fetch_detail` — hybridní přístup

**Kde:** Metoda `_fetch_detail` na řádcích 256-397

**Strategie:** 
1. Nejdříve zavolat API pro enrichment (description, photos, equipment, seller info, city)
2. Ponechat Playwright pro phone (API phone = dealer phone, ale chceme soukromý telefon z revealed buttonu)
3. Pokud API selže → fallback na stávající DOM scraping

```python
def _fetch_detail(self, page, url: str) -> tuple[
    Optional[str], Optional[str], Optional[Category], Optional[str],
    Optional[str], list[str], list[str],
]:
    """Visit detail page, extract phone + enrichment via API + DOM fallback."""

    # --- STEP 1: Try API for enrichment data ---
    api_description = None
    api_photos: list[str] = []
    api_equipment: list[str] = []
    api_seller_name = None
    api_seller_category = None
    api_city = None

    source_id = None
    id_match = re.search(r"/(\d{6,})", url)
    if id_match:
        source_id = id_match.group(1)

    if source_id:
        (api_description, api_photos, api_equipment,
         api_seller_name, api_seller_category, api_city
        ) = self._fetch_enrichment_from_api(source_id)

    # --- STEP 2: Playwright for phone (always needed) ---
    if not self._navigate(page, url):
        # Even without page navigation, return API data if available
        return (None, api_seller_name, api_seller_category, api_city,
                api_description, api_photos, api_equipment)

    # Try clicking phone reveal button
    try:
        phone_btn = page.locator(
            "button:has-text('telefon'), "
            "button:has-text('Telefon'), "
            "button:has-text('Zobrazit číslo'), "
            "button:has-text('Ukázat'), "
            "a:has-text('telefon')"
        ).first
        if phone_btn.is_visible(timeout=2000):
            phone_btn.click()
            page.wait_for_timeout(1500)
    except Exception:
        pass

    html = page.content()
    soup = BeautifulSoup(html, "lxml")

    # Phone — tel: link first
    phone = None
    tel_link = soup.select_one("a[href^='tel:']")
    if tel_link:
        phone = tel_link.get("href", "")[4:].strip()
        if not self._is_valid_phone(phone):
            phone = None

    # Phone from contact/seller sections
    if not phone:
        contact_selectors = [
            "div[class*='contact']",
            "div[class*='seller']",
            "div[class*='phone']",
            "span[class*='phone']",
            "div[class*='author']",
            "section[class*='seller']",
        ]
        for sel in contact_selectors:
            el = soup.select_one(sel)
            if el:
                text = el.get_text(separator=" ", strip=True)
                phone = self._extract_phone(text)
                if phone:
                    break

    # --- STEP 3: Use API data if available, else DOM fallback ---
    seller_name = api_seller_name
    seller_category = api_seller_category
    city = api_city
    description = api_description
    photos = api_photos
    equipment = api_equipment

    # DOM fallback only if API returned nothing
    if not seller_name:
        # ... keep existing seller_name DOM selectors (ř. 311-325)
        for sel in ["div[class*='seller'] h2", ...]:
            ...

    if not seller_category:
        # ... keep existing seller_category detection (ř. 328-338)
        ...

    if not city:
        # ... keep existing city DOM selectors (ř. 342-360)
        ...

    if not description:
        # ... keep existing description DOM selectors (ř. 364-373)
        ...

    if not photos:
        # ... keep existing photo DOM selectors (ř. 376-383)
        # BUT: update CDN filter from "sauto"/"szn" → "sdn.cz"
        ...

    if not equipment:
        # ... keep existing equipment DOM selectors (ř. 387-394)
        ...

    return phone, seller_name, seller_category, city, description, photos, equipment
```

---

## Krok 3: Konkrétní řádky k úpravě

| Řádky | Akce | Detail |
|-------|------|--------|
| 10 | ✅ Ponechat | `import httpx` — už existuje |
| Po ř. 397 | ➕ PŘIDAT | Nová metoda `_fetch_enrichment_from_api()` (~35 řádků) |
| 256-397 | 🔄 PŘEPSAT | `_fetch_detail()` — hybridní API + Playwright approach |
| 379 | 🔧 FIX | Změnit `"sauto" in src or "szn" in src` → `"sdn.cz" in src` (DOM fallback) |

---

## Krok 4: Detailní pseudokód nové `_fetch_detail`

```
_fetch_detail(page, url):
    # 1. Extract source_id from URL
    source_id = regex_extract(r"/(\d{6,})", url)
    
    # 2. API call (fast, reliable)
    IF source_id:
        api_data = _fetch_enrichment_from_api(source_id)
        description, photos, equipment = api_data[0:3]
        seller_name, seller_category, city = api_data[3:6]
    
    # 3. Playwright navigate + phone reveal (always needed)
    navigate(page, url)
    click_phone_reveal_button()
    html = page.content()
    soup = parse(html)
    
    # 4. Extract phone from rendered DOM
    phone = find_tel_link(soup) or find_phone_in_sections(soup)
    
    # 5. Merge: API data wins, DOM is fallback
    IF NOT seller_name: seller_name = dom_extract_seller(soup)
    IF NOT seller_category: seller_category = dom_detect_seller_type(soup)
    IF NOT city: city = dom_extract_city(soup)
    IF NOT description: description = dom_extract_description(soup)
    IF NOT photos: photos = dom_extract_photos(soup)  # fixed CDN filter
    IF NOT equipment: equipment = dom_extract_equipment(soup)
    
    RETURN (phone, seller_name, seller_category, city, description, photos, equipment)
```

---

## Krok 5: Error handling

| Scénář | Chování |
|--------|---------|
| API 404 (inzerát smazán) | Vrátit None enrichment, pokračovat s DOM |
| API 403 (rate limited) | Log warning, fallback na DOM |
| API timeout | Log warning, fallback na DOM |
| API JSON parse error | Log error, fallback na DOM |
| API vrátí premise (dealer) | Nastavit `seller_category = AUTOBAZAR` → lead bude skippnutý v `scrape()` (ř. 85-87) |
| Playwright navigate fail | Vrátit API data bez phone |

---

## Krok 6: Test scénáře

1. **Happy path:** API vrátí data, Playwright najde phone → lead má vše
2. **API fail, DOM OK:** API timeout, DOM fallback najde aspoň něco → partial enrichment
3. **API OK, no phone:** API data OK ale Playwright nenajde phone → lead se nepřidá (ř. 88)
4. **Dealer detected:** API `premise` existuje → `seller_category = AUTOBAZAR` → lead skippnutý
5. **Invalid source_id:** Regex nenajde ID → skip API, full DOM fallback

---

## Acceptance Criteria

- [ ] API volání funguje pro reálný Sauto listing (test s ID z produkce)
- [ ] Description, photos, equipment se plní z API response
- [ ] Photos mají prefix `https://` (ne `//`)
- [ ] Seller type detection z `premise` pole funguje (dealer → skip)
- [ ] DOM fallback se aktivuje při API failure
- [ ] Phone extraction přes Playwright zůstává funkční
- [ ] Rate limiting je dodržen (5s delay) i pro API volání
- [ ] Celkový flow: 42 leadů → majority má enrichment data (description + photos)

---

## Odhad rozsahu

- **Nový kód:** ~40 řádků (`_fetch_enrichment_from_api`)
- **Upravený kód:** ~60 řádků (`_fetch_detail` refactor)
- **Smazaný kód:** 0 (vše zachováno jako fallback)
- **Riziko:** Nízké — API je jednoduchý GET, fallback zachovává kompatibilitu
