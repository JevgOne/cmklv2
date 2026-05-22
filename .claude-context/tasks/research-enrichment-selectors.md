# Research: Aktuální HTML selektory pro enrichment (Sauto, Bazoš, Sbazar)

**Datum:** 2026-05-20
**Autor:** Plánovač
**Task:** LEAD-ENRICH-1
**Status:** HOTOVO

---

## Shrnutí problému

Scout-leads enrichment pipeline nefunguje:
- **Sauto:** 42 leadů, 0 fotek, 0 popisů, 0 výbavy → CSS selektory zastaralé
- **Bazoš:** 43 leadů, jen 3 fotky a 3 popisy, 0 výbavy → výbava neimplementována
- **Sbazar:** 0 enrichment → `_fetch_phone` neextrahuje fotky/popis/výbavu

---

## 1. SAUTO.CZ

### Architektura
- **Framework:** IMA (Seznam.cz vlastní framework) s SSR/hydration
- **Rendering:** Obsah je JS-rendered, proto scraper správně používá Playwright
- **CDN obrázky:** `d19-a.sdn.cz` (ne `sauto.cz` ani `szn.cz` jak očekává kód!)

### KLÍČOVÝ NÁLEZ: Sauto má REST API

Sauto vystavuje **veřejné REST API** na `https://www.sauto.cz/api/v1/items/{id}` které vrací **KOMPLETNÍ data** v JSON:

```
GET https://www.sauto.cz/api/v1/items/{id}

Response obsahuje:
- description          → textový popis
- equipment_cb[]       → pole objektů {name, equipment_category, value}
- images[]             → pole s CDN URL (//d19-a.sdn.cz/d_19/c_img_*.jpeg)
- images_total_count   → počet fotek
- premise.name         → jméno prodejce
- premise.phone        → telefon
- premise.type         → typ (dealer/soukromý)
- locality             → region, district, address
- fuel_cb.name         → palivo
- gearbox_cb.name      → převodovka
- tachometer           → nájezd
- manufacturing_date   → rok výroby
- vin                  → VIN kód
```

### Co je špatně v aktuálním kódu (`sauto.py:362-394`)

| Aspekt | Aktuální selektor | Problém | Doporučení |
|--------|-------------------|---------|------------|
| **Description** | `div[class*='description']`, `div[class*='popis']`, `div.c-detail__text` | IMA framework generuje třídy dynamicky, selektory nechytí nic | **Použít API `/api/v1/items/{id}`** → pole `description` |
| **Photos** | `img[src*='sauto']`, `img[src*='szn']` | Obrázky jsou na `d19-a.sdn.cz`, ne na `sauto.cz`/`szn.cz` | **Použít API** → pole `images[]`, CDN: `//d19-a.sdn.cz/...` |
| **Equipment** | `div[class*='equipment'] li`, `div[class*='vybava'] li` | Dynamické třídy, nechytí nic | **Použít API** → pole `equipment_cb[]` s `name` field |

### Doporučená strategie pro Sauto

**NAHRADIT DOM scraping → API volání.** Po `_navigate` na detail stránku:

1. Z URL extrahovat `source_id` (číslo na konci URL)
2. Volat `httpx.get(f"https://www.sauto.cz/api/v1/items/{source_id}")` 
3. Parsovat JSON response — description, images, equipment_cb
4. Fallback na DOM scraping jen pokud API selže

**Příklad API response (ověřeno 2026-05-20):**
```json
{
  "description": "Jedná se o čerstvě vykoupené vozidlo...",
  "equipment_cb": [
    {"name": "Bluetooth", "equipment_category": "systems", "value": 244},
    {"name": "Tempomat", "equipment_category": "systems", "value": 59},
    {"name": "Dálkové centrální zamykání", "equipment_category": "security", "value": 24}
  ],
  "images": [
    {"url": "//d19-a.sdn.cz/d_19/c_img_qB_B/nCTUX1iX5Do9kXBWIVGq8jl2/c08d.jpeg"},
    {"url": "//d19-a.sdn.cz/d_19/c_img_qB_B/kcHp2YdDtCDcb51tGq8jms/4cf9.jpeg"}
  ],
  "fuel_cb": {"name": "Hybridní", "seo_name": "hybridni"},
  "gearbox_cb": {"name": "Manuální", "seo_name": "manualni"},
  "tachometer": 24214,
  "premise": {"name": "Direct auto", "phone": "+420800720710"}
}
```

**Image URL pattern:**
```
https://d19-a.sdn.cz/d_19/c_img_{hash}/{hash}/{filename}.jpeg
```
Pro plnou velikost přidat query: `?fl=exf|res,1024,768,1|jpg,80,,1`

---

## 2. BAZOS.CZ (auto.bazos.cz)

### Architektura
- **Framework:** Tradiční server-rendered HTML (ne SPA)
- **Rendering:** HTML je kompletní — `httpx` fetch stačí (Bazos scraper správně používá httpx)
- **CDN obrázky:** `www.bazos.cz/img/`

### Aktuální HTML struktura (ověřeno 2026-05-20)

#### Description
```html
<!-- POZOR: WebFetch analysis ukazuje že popis NENÍ v div.popisdetail -->
<!-- Popis je jako plain text bez specifického wrapper class -->
<!-- Ale kód to má jako div.popisdetail — možná to funguje jen na některých inzerátech -->
```

| Aktuální selektor | Stav | Poznámka |
|-------------------|------|----------|
| `div.popisdetail` | ⚠️ NESPOLEHLIVÉ | Na testovaných stránkách se popis zobrazuje bez wrapper elementu s touto třídou. Ale 3 ze 43 leadů ho přece jen zachytily → funguje jen sporadicky |

**Doporučení:** Zkontrolovat další selektory. Fallback strategie:
1. `div.popisdetail` (zachovat pro zpětnou kompatibilitu)
2. Hledat textový blok mezi nadpisem (`h1`) a obrázky — parsovat `text_content` z hlavního bloku stránky

#### Photos (galerie)
```html
<div class="carousel">
  <img src="https://www.bazos.cz/img/1t/280/218009280.jpg?t=1779297201">
  <img src="https://www.bazos.cz/img/2t/280/218009280.jpg?t=1779297201">
  <!-- ... až 20 fotek -->
</div>
<script>
  var flkty = new Flickity('.carousel', {fullscreen: true, lazyLoad: 1, wrapAround: true});
</script>
```

**URL pattern:** `https://www.bazos.cz/img/{n}t/{dir}/{listing_id}.jpg?t={timestamp}`
- `{n}` = číslo fotky (1, 2, 3, ...)
- `{dir}` = poslední 3 cifry listing ID
- `{listing_id}` = ID inzerátu

| Aktuální selektor | Stav | Poznámka |
|-------------------|------|----------|
| `img[src*='img.bazos']` | ❌ NEFUNGUJE | Domain je `www.bazos.cz/img/`, ne `img.bazos.cz` |
| `img[src*='www.bazos']` | ✅ FUNGUJE | Matchuje `www.bazos.cz/img/...` |

**Problém: Jen 3 ze 43 leadů mají fotky** — pravděpodobně proto, že `img[src*='img.bazos']` selektor chytí první (je v OR), ale pokud src je absolutní URL s `www.bazos.cz`, tak `img.bazos` v ní NENÍ. Druhý selektor `www.bazos` by měl matchovat, ALE: je možné, že se fotky loadují lazy (Flickity `lazyLoad: 1`). 

**Doporučení:** 
1. Přidat selektor `div.carousel img` jako primární
2. Zachovat `img[src*='www.bazos']` jako fallback
3. Zkontrolovat zda `data-flickity-lazyload` attribute existuje — pokud ano, číst z něj URL místo `src`
4. Alternativně: generovat URL přímo z listing ID: `https://www.bazos.cz/img/{n}t/{dir}/{id}.jpg` pro n=1..20

#### Equipment/Výbava
```
❌ ŽÁDNÝ strukturovaný HTML pro výbavu
```

Bazos nemá dedikovanou sekci pro výbavu. Prodejci píšou výbavu do description:
- Checkmarks: `✅Garance kilometru`, `✅Nehavarováno`
- Volný text: "výbava: klima, tempomat, alu kola..."

**Doporučení pro Task #5 (přidat výbavu do Bazos):**
1. Extrahovat z description textu
2. Pattern matching: hledat `✅{text}` (checkmark items)
3. Hledat sekci začínající "výbava:", "vybavení:", "features:" a parsovat čárkami oddělený seznam
4. Regex: `✅\s*(.+?)(?=\n|✅|$)` pro checkmark items

#### Seller info
```html
<strong>Jméno</strong>      <!-- seller name -->
602... zobraz číslo          <!-- masked phone — odmaskovává se přes JS click -->
<a href="...">334 01 Plzeň-jih</a>  <!-- lokace -->
```

#### Parameters
```
❌ ŽÁDNÁ strukturovaná tabulka parametrů
```
Parametry jsou v nadpisu a popisu — aktuální `_extract_params_from_text()` je správný přístup.

---

## 3. SBAZAR.CZ

### Architektura
- **Framework:** Astro.js (SSR + client-side hydration)
- **Rendering:** Plně JS-rendered → raw HTML je jen shell + JS → **Playwright je nutný** (správně)
- **URL pattern:** `/inzerat/{id}-{slug}` (potvrzeno z Google search)

### Problém
**WebFetch NEMŮŽE analyzovat Sbazar** — stránka je plně client-side rendered pomocí Astro.js. Raw HTML obsahuje jen:
- JavaScript pro history management
- Google Tag Manager
- Hotjar analytics
- JSON s kategoriemi

**Žádný HTML obsah (fotky, popis, parametry) není v raw HTML** — vše se renderuje na klientu po JS execution.

### Aktuální kód (`sbazar.py:206-255`)
`_fetch_phone()` extrahuje POUZE telefon. **Neextrahuje:**
- ❌ description
- ❌ photos
- ❌ equipment/parameters

### Doporučení pro Task #6 (přidat enrichment do Sbazar)

Protože Sbazar je Astro.js a plně JS-rendered, enrichment MUSÍ být přes Playwright (page.content() → BeautifulSoup). 

**Přejmenovat `_fetch_phone` → `_fetch_detail`** a přidat enrichment selektory. Selektory se musí ověřit v Playwright runtime:

**Suggested approach (developer musí ověřit v Playwright):**
```python
# 1. Navigovat na detail stránku (už to dělá _fetch_phone)
# 2. Počkat na hydration (page.wait_for_selector nebo timeout)
# 3. page.content() → soup

# Selektory k otestování (Sbazar je Seznam.cz property, pravděpodobně sdílí patterns):
# Description:
desc_selectors = [
    "div[class*='description']",
    "div[class*='popis']",
    "section[class*='description']",
    "div[data-dot='description']",
    "article p",  # fallback — main article paragraphs
]

# Photos:
photo_selectors = [
    "img[data-dot='image']",
    "div[class*='gallery'] img",
    "div[class*='carousel'] img",
    "picture source[srcset]",  # Astro uses <picture> with srcset
    "img[src*='im9.cz']",     # Seznam CDN
    "img[src*='sdn.cz']",     # Seznam CDN alt
]

# Parameters:
param_selectors = [
    "div[class*='parameter']",
    "div[class*='param']",
    "dl dt, dl dd",  # definition list
    "table tr td",
    "div[data-dot*='param']",
]
```

**CDN domain pro Sbazar obrázky:** Pravděpodobně `im9.cz` nebo `d25-a.sdn.cz` (Seznam CDN — Sbazar je Seznam.cz property, stejně jako Sauto).

**Developer MUSÍ:**
1. Spustit Playwright na reálný Sbazar inzerát (e.g. `https://www.sbazar.cz/inzerat/228345644-skoda-octavia-iii-kombi-20-tdi-dsg-182-2026`)
2. `page.content()` → uložit HTML do souboru
3. Analyzovat rendered DOM → najít přesné class names
4. Implementovat selektory

---

## 4. Souhrnná tabulka: Aktuální vs. Doporučené selektory

### Sauto.cz

| Data | Aktuální selektor (BROKEN) | Doporučený přístup |
|------|---------------------------|-------------------|
| Description | `div[class*='description']`, `div.c-detail__text` | **API:** `GET /api/v1/items/{id}` → `response.description` |
| Photos | `img[src*='sauto']`, `img[src*='szn']` | **API:** `response.images[].url` (CDN: `d19-a.sdn.cz`) |
| Equipment | `div[class*='equipment'] li` | **API:** `response.equipment_cb[].name` |

### Bazos.cz

| Data | Aktuální selektor | Stav | Doporučení |
|------|-------------------|------|------------|
| Description | `div.popisdetail` | ⚠️ Nespolehlivé (3/43) | Zachovat + přidat fallbacky |
| Photos | `img[src*='img.bazos'], img[src*='www.bazos']` | ⚠️ Částečně (3/43) | `div.carousel img` + check `data-flickity-lazyload` attr + generovat URL z ID |
| Equipment | ❌ neimplementováno | N/A | Parsovat z description textu (checkmarks ✅, "výbava:" sekce) |

### Sbazar.cz

| Data | Aktuální kód | Stav | Doporučení |
|------|-------------|------|------------|
| Description | ❌ neimplementováno | N/A | Přidat do `_fetch_detail` — selektory musí developer ověřit v Playwright |
| Photos | ❌ neimplementováno | N/A | Přidat — CDN pravděpodobně `im9.cz` nebo `sdn.cz` |
| Equipment | ❌ neimplementováno | N/A | Přidat — hledat structured params v rendered DOM |

---

## 5. Doporučené pořadí implementace

1. **Task #4 — Sauto (HIGHEST IMPACT):** Přepnout na API volání. 42 leadů × 0 enrichment → fix přinese největší hodnotu. API je stabilní a spolehlivé.
2. **Task #5 — Bazoš fotky + popis fix:** Opravit photo selektor (`div.carousel img`), ověřit description selektor, přidat equipment extrakci z textu.
3. **Task #6 — Sbazar enrichment:** Rozšířit `_fetch_phone` na `_fetch_detail`. Vyžaduje hands-on Playwright session pro identifikaci selektorů.

---

## 6. Rizika a poznámky

- **Sauto API:** Není dokumentované veřejné API — může se změnit. Ale je stabilnější než DOM scraping na IMA framework.
- **Bazoš lazy loading:** Flickity carousel používá `lazyLoad: 1` — jen 1 obrázek se předloaderuje. Ostatní mají `data-flickity-lazyload` místo `src`. Při httpx fetch (ne Playwright) se vidí jen první obrázek. **Řešení:** Generovat URL přímo z listing ID.
- **Sbazar:** Plně JS-rendered, selektory nelze zjistit bez Playwright runtime. Developer musí je ověřit manuálně.
- **Rate limiting:** Sauto API může mít rate limiting — používat stejné `rate_limit_delay = 5.0` jako pro stránky.
