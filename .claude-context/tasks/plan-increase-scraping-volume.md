# PLÁN: Zvýšit objem scrapovaných dat — víc stránek, víc leadů

**Datum:** 2026-05-20
**Priorita:** P0 (uživatel: "těch dat je málo, hodně málo")
**Cesta:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/`

---

## EXECUTIVE SUMMARY

Kompletní audit všech 9 scraperů odhalil **masivní nedostatky ve volume**. Platformy mají desítky tisíc inzerátů, Lead Scout stahuje zlomek. Hlavní příčiny:

1. **TipCars: NULOVÁ paginace** — stahuje 1 stránku z celého webu
2. **Google Places: NENÍ v scheduleru** — nikdy neběží automaticky
3. **ARES: limit 50 výsledků** per query, žádná paginace API
4. **Sbazar: jen 10 stránek** — příliš konzervativní
5. **Firmy.cz: CATEGORY_URLS prázdné** — category browsing vypnuté
6. **Detail page visits** u každého inzerátu zdvojnásobují čas

Odhadovaný denní výnos AKTUÁLNĚ: **~2 000-4 000 unikátních leadů** (po dedup)
Reálný potenciál platforem: **~100 000+ inzerátů celkem**
→ **Využíváme ~2-4% dostupných dat.**

---

## AUDIT KAŽDÉHO SCRAPERU

### 1. TipCars (`tipcars.py`) — KRITICKÝ PROBLÉM

**Aktuální stav:**
- **max_pages: ŽÁDNÉ** — nemá paginaci vůbec!
- `_scrape_listing()` volá JEDNU URL: `tipcars.com/hledam/ojete-vozy`
- Stáhne 20-50 karet z 1 stránky
- Pro každou kartu navštíví detail page (pro telefon) → 2 requesty/inzerát
- Rate limit: 4.0s

**Realita TipCars.com:**
- ~15 000-30 000 aktivních inzerátů osobních aut
- ~100-200 stránek výsledků

**Výnos per run: ~20-50 dealerů** (dedup by name)
**Výnos per den: ~80-200 dealerů** (4× denně)

**FIX:**
```python
def _scrape_listing(self, client) -> list[ScoutLeadPayload]:
    leads = []
    max_pages = 50  # ← PŘIDAT PAGINACI
    
    for page in range(1, max_pages + 1):
        url = f"{BASE_URL}/hledam/ojete-vozy?strana={page}"
        response = self._fetch(client, url)
        if response is None:
            break
        
        soup = BeautifulSoup(response.text, "lxml")
        cards = soup.select("div.advertisement")
        if not cards:
            break
        
        # ... existující parsing logic
```

**Ověřit:** TipCars URL strukturu pro paginaci. Možné varianty:
- `?strana={page}` (české)
- `?page={page}` (anglické)
- `?offset={offset}` (offset-based)

**POZOR:** TipCars může mít anti-scraping opatření na vyšších stránkách. Testovat manuálně.

**Očekávaný zlepšení:** 50 stránek × ~30 karet = **1 500 inzerátů per run** (vs 30 nyní) → **50× nárůst**

---

### 2. Sauto.cz (`sauto.py`) — HEADLESS

**Aktuální stav:**
- **max_pages: 15**
- URL: `/osobni-auta?strana={pg}`
- HEADLESS (Playwright) — pomalé, resource-intensive
- Pro KAŽDÝ listing navštíví detail page pro telefon → 2 page loads per inzerát
- Rate limit: 5.0s + 1.5-3s random wait na headless navigate
- **Celkový čas per run:** ~15 stránek × (load + 20 detail pages × ~8s) ≈ **40-60 minut**

**Realita Sauto.cz:**
- ~40 000-60 000 aktivních inzerátů osobních aut
- ~2 000-3 000 stránek

**Výnos per run: ~100-200 leads** (jen ty s telefonem)
**Výnos per den: ~300-600 leads** (3× denně, 8h interval)

**FIX:**
```python
max_pages = 50  # Zvýšit z 15 na 50

# OPTIONAL: skip detail page for SOUKROMNIK leads (phone not critical for private sellers)
# Phone se dá získat jen z detail page → velký bottleneck
```

**Alternativa:** Přidat search queries pro lepší coverage:
```python
# Místo jednoho univerzálního scrape, rozdělit na queries:
queries = ["škoda", "volkswagen", "bmw", "ford", "hyundai", "toyota", "kia", "audi"]
# Každý query vrátí jinou sadu výsledků → méně overlap
```

**Očekávaný zlepšení:** 50 stránek × ~20 = **1 000 listingů per run** (vs 300)
S queries: 8 queries × 50 stránek = **8 000** (ale velký overlap, reálně ~3 000-4 000 unikátních)

**RUNTIME PROBLÉM:** 50 stránek × 20 detail pages × ~8s = **~2.5 hodiny** per run. Headless scraping je extrémně pomalé. Zvážit:
- Paralelní browser contexts (2-3 současně)
- Skip detail page pro SOUKROMNÍK leady kde telefon není kritický
- Batch detail page visits (navigate + immediate back)

---

### 3. Bazoš.cz (`bazos.py`)

**Aktuální stav:**
- **max_pages: 25**
- Offset: page × 20 (20 inzerátů per stránka)
- Pro KAŽDÝ inzerát navštíví detail page → 2 requesty per inzerát
- Rate limit: 4.0s
- **Queries:** 9 CZ queries (prázdný + 8 značek), 1 SK query
- **Scheduler:** CZ každé 4h, SK každých 6h

**Realita auto.bazos.cz:**
- ~25 000-40 000 aktivních inzerátů osobních aut
- ~1 500-2 000 stránek

**Výnos per run per query: ~300-500 ads** (25 stránek × 20)
**Ale:** 9 queries s MASIVNÍM overlapem (query "" vrací VŠECHNO, brand queries jsou subset)
**Reálný unikátní výnos: ~1 000-2 000 per cycle**
**Výnos per den: ~6 000-12 000** (ale po dedup v DB mnohem méně)

**FIX:**
```python
max_pages = 50  # Zvýšit z 25 na 50 → 1 000 ads per query

# Efektivnější query strategie:
# Místo "" (all) + brands, použít POUZE specifické queries
# Query "" zahrnuje VŠECHNO → brand queries jsou zbytečný overlap

# VARIANTA A: Jen jeden velký scrape bez query
bazos_queries = [""]  # 1 query, ale max_pages = 100-150
# 150 × 20 = 3 000 ads per run

# VARIANTA B: Brand queries BEZ prázdného query
bazos_queries = ["skoda", "volkswagen", "bmw", "audi", "ford", 
                 "hyundai", "toyota", "kia", "renault", "peugeot",
                 "opel", "seat", "dacia", "mazda", "honda", "volvo",
                 "fiat", "citroen", "nissan", "suzuki", "mercedes"]
# 21 queries × 50 stránek = menší overlap, lepší coverage

# VARIANTA C (DOPORUČENO): Velký scrape + brand queries pro hloubku
bazos_queries = [""]  # max_pages=100 pro široký záběr
# + brand queries s max_pages=30 pro specifické výsledky (řazení dle relevance)
```

**Detail page bottleneck:** 
- 1 000 ads × 2 requests × 4s = **~2.2 hodiny** per query
- S 9 queries: **~20 hodin** — NEPROJDE za 4h interval!

**ŘEŠENÍ detail page bottleneck:**
1. **Skip detail page pokud lead už v DB** — `db.exists(source, source_id)` check před fetch
2. **Batch phone scraping** — stáhnout listing pages PRVNÍ, pak detail pages jen pro nové leady
3. **Phone z listing page** — Bazoš někdy ukazuje telefon i na listing page (ověřit)

---

### 4. Sbazar.cz (`sbazar.py`) — HEADLESS

**Aktuální stav:**
- **max_pages: 10**
- URL: `/auto-moto/osobni-auta?strana={pg}`
- HEADLESS (Playwright)
- Detail page visits pro telefon
- Rate limit: 5.0s

**Realita Sbazar.cz:**
- ~10 000-20 000 aktivních inzerátů aut
- ~500-1 000 stránek

**Výnos per run: ~50-100 leads** (jen s telefonem)
**Výnos per den: ~150-300 leads** (3× denně)

**FIX:**
```python
max_pages = 30  # Zvýšit z 10 na 30
```

**Očekávaný zlepšení:** 30 × 20 = **600 listingů** (vs 200) → **3× nárůst**

---

### 5. AutoScout24 (`autoscout24.py`)

**Aktuální stav:**
- **max_pages: 15**
- 20 výsledků per stránka (`size=20`)
- Rate limit: 5.0s
- ŽÁDNÉ detail page visits (extrahuje z listing card)
- **Countries:** DE + CZ (každý zvlášť, 6h interval)

**Realita AutoScout24:**
- **DE: ~1 500 000** aktivních inzerátů (největší trh EU)
- **CZ: ~20 000-30 000** inzerátů
- **AT: ~80 000** inzerátů (NENÍ v scheduleru!)

**Výnos per run per country: ~200-300 listingů**
**Výnos per den: ~1 600-2 400** (2 countries × 4 runs)

**FIX:**
```python
max_pages = 50  # Zvýšit z 15 na 50

# URL umožňuje size=50:
url = f"{base_url}/lst?sort=standard&desc=0&ustate=N%2CU&size=50&page={page}&atype=C"
# 50 × 50 = 2 500 per run per country
```

**Přidat chybějící countries:**
```python
# scheduler.py — přidat AT
scheduler.add_job(
    _run_scraper,
    IntervalTrigger(hours=6, start_date="2026-01-01 04:00:00"),
    args=["AUTOSCOUT24", "", "AT"],
    id="autoscout24_at_scrape",
    name="AutoScout24 AT scrape",
)

# Zvážit SK (autoscout24.sk existuje?)
# Zvážit PL (autoscout24.pl — velký trh)
```

**Brand/model queries pro hloubku:**
```python
# AutoScout24 support search params:
# &mmvmk0=84&mmvmd0=0  ← Škoda (brand ID 84)
# &mmvmk0=75&mmvmd0=0  ← Volkswagen

as24_brands = {
    "skoda": 84, "volkswagen": 75, "bmw": 9, "audi": 5, "ford": 20,
    "hyundai": 27, "toyota": 70, "kia": 34, "renault": 54, "peugeot": 49,
    "opel": 48, "seat": 58, "mercedes": 41,
}
# 13 brands × 50 stránek × 50 results = 32 500 per country (heavy overlap)
```

**Očekávaný zlepšení:** 
- S size=50 + max_pages=50: **2 500 per run** (vs 300) → **8× nárůst**
- S AT: **+2 500 per run**
- S brand queries: až **10 000+** per run per country

---

### 6. Firmy.cz (`firmy_cz.py`)

**Aktuální stav:**
- **CATEGORY_URLS: PRÁZDNÉ `{}`** — category browsing VYPNUTÉ!
- Search: 9 queries × max 10 stránek = 90 page fetches
- Rate limit: 4.0s

**Realita Firmy.cz:**
- ~8 000-12 000 auto-related firem
- Category pages mají stovky výsledků

**Výnos per run: ~200-500 firem**

**FIX:**
```python
CATEGORY_URLS = {
    Category.AUTOBAZAR: [
        "/auto-moto/autobazary",          # Hlavní kategorie autobazarů
        "/auto-moto/autosalony",           # Autosalony
        "/auto-moto/prodej-ojeta-auta",    # Prodej ojetých aut
    ],
    Category.VRAKOVISTE: [
        "/auto-moto/autovraky",            # Autovraky
        "/auto-moto/nahradni-dily",        # Náhradní díly (filtrovat!)
        "/auto-moto/autosroty",            # Autošroty
    ],
}
```

**POZOR:** URL paths je nutné OVĚŘIT na firmy.cz. Výše uvedené jsou odhady. Implementátor MUSÍ zkontrolovat reálnou URL strukturu.

**Navýšit search pages:**
```python
max_pages = 20  # Zvýšit z 10 na 20
```

**Očekávaný zlepšení:** Category browsing + víc stránek → **1 000-2 000 firem** (vs 200-500)

---

### 7. Zlatéstránky (`zlatestranky.py`)

**Aktuální stav:**
- 8 queries × 20 měst = 160 kombinací
- **ŽÁDNÁ PAGINACE** per search result — 1 stránka per kombinace!
- Rate limit: 4.0s
- **Celkový čas:** 160 × ~5s = ~13 minut

**Realita Zlatéstránky.cz:**
- Každý search result má potenciálně více stránek
- ~5 000-10 000 auto-related firem

**Výnos per run: ~800-3 200 firem** (ale těžký overlap)

**FIX:**
```python
def _search(self, client, query: str, city: str) -> list[ScoutLeadPayload]:
    leads = []
    max_pages = 5  # ← PŘIDAT PAGINACI
    
    for page in range(1, max_pages + 1):
        url = f"{BASE_URL}/firmy/hledani/{quote_plus(query)}+{quote_plus(city)}"
        if page > 1:
            url += f"?strana={page}"  # Ověřit URL pattern!
        
        response = self._fetch(client, url)
        if response is None:
            break
        # ... rest of parsing
        
        if not listings:  # No more results
            break
```

**POZOR:** Paginace URL formát na Zlatéstránky.cz je nutné ověřit.

**Očekávaný zlepšení:** 5 stránek × 160 kombinací → **5× nárůst** (ale diminishing returns po stránce 2-3)

---

### 8. ARES (`ares.py`)

**Aktuální stav:**
- 8 queries (4 AUTOBAZAR + 4 VRAKOVISTE)
- API limit: **50 výsledků per query** (`"pocet": 50`)
- ŽÁDNÁ paginace přes API
- Rate limit: 2.0s

**Realita ARES:**
- ~5 000-8 000 auto-related firem v registru
- API podporuje `start` parameter pro paginaci!

**Výnos per run: ~200-400 firem**

**FIX:**
```python
def _search_ares(self, client, query, default_category):
    leads = []
    max_results = 500  # Chceme víc
    page_size = 50
    
    for start in range(0, max_results, page_size):
        response = self._post(
            client,
            f"{ARES_API_URL}/ekonomicke-subjekty/vyhledat",
            json={
                "obchodniJmeno": query,
                "pocet": page_size,
                "start": start,       # ← PAGINACE!
            },
        )
        # ... parse results
        
        items = data.get("ekonomickeSubjekty", [])
        if len(items) < page_size:
            break  # No more results
    
    return leads
```

**Přidat víc queries:**
```python
# AUTOBAZAR queries (specifičtější = méně false positive):
autobazar_queries = [
    "autobazar", "autosalon", "prodej aut", "ojeté vozy",
    "bazar aut", "auto bazar", "autosalon",
]

# VRAKOVISTE queries:
vrakoviste_queries = [
    "vrakoviště", "autovraky", "rozborka aut", "autodíly",
    "autošrot", "náhradní díly auto",
]
```

**Rozšířit na NACE kódy:**
ARES API podporuje filtr dle NACE kódů:
- 45.11 — Obchod s automobily a motorovými vozidly o celkové hmotnosti do 3,5 t
- 45.19 — Obchod s ostatními motorovými vozidly
- 45.20 — Údržba a opravy motorových vozidel
- 45.31 — Velkoobchod s díly pro motorová vozidla
- 45.32 — Maloobchod s díly pro motorová vozidla

```python
# Alternativní přístup: hledat dle NACE kódu místo jména
response = self._post(
    client,
    f"{ARES_API_URL}/ekonomicke-subjekty/vyhledat",
    json={
        "czNace": ["45110"],   # ← Filtr dle NACE
        "pocet": 50,
        "start": start,
    },
)
```

**POZOR:** ARES API endpoint a parametry je nutné ověřit v dokumentaci: https://ares.gov.cz/

**Očekávaný zlepšení:** Paginace + víc queries + NACE kódy → **2 000-5 000 firem** (vs 200-400) → **10× nárůst**

---

### 9. Google Places (`google_places.py`) — KRITICKÝ PROBLÉM

**Aktuální stav:**
- 8 queries (4 AUTOBAZAR + 4 VRAKOVISTE)
- API limit: **20 výsledků per query** (`maxResultCount: 20`)
- **ŽÁDNÁ paginace** (nextPageToken NENÍ použit)
- **NENÍ V SCHEDULERU** — nikdy neběží automaticky!
- Rate limit: 1.0s

**Realita Google Places:**
- Tisíce auto-related firem per country
- API vrací `nextPageToken` pro další stránku → max 60 výsledků (3 × 20)

**Výnos per run: ~100-160 firem**
**Výnos per den: 0** (není v scheduleru!)

**FIX 1: Přidat do scheduleru:**
```python
# scheduler.py
# Google Places CZ — daily (API má billing, šetřit)
scheduler.add_job(
    _run_scraper,
    CronTrigger(hour=4, minute=0),
    args=["GOOGLE_PLACES", "", "CZ"],
    id="google_places_cz",
    name="Google Places CZ",
)

# Google Places SK — daily
scheduler.add_job(
    _run_scraper,
    CronTrigger(hour=4, minute=30),
    args=["GOOGLE_PLACES", "", "SK"],
    id="google_places_sk",
    name="Google Places SK",
)
```

**FIX 2: Paginace přes nextPageToken:**
```python
def _search_places(self, client, query, country, category):
    leads = []
    page_token = None
    
    for page in range(3):  # Max 3 pages (Google limit = 60 results)
        body = {
            "textQuery": query,
            "locationBias": { ... },
            "maxResultCount": 20,
        }
        if page_token:
            body["pageToken"] = page_token
        
        response = client.post(url, headers=headers, json=body)
        data = response.json()
        
        # ... parse places
        
        page_token = data.get("nextPageToken")
        if not page_token:
            break
    
    return leads
```

**FIX 3: City-based queries pro víc výsledků:**
```python
# Místo 1 query s center CZ, rozdělit na cities:
CITIES = ["Praha", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc",
          "České Budějovice", "Hradec Králové", "Zlín", "Pardubice",
          "Ústí nad Labem", "Karlovy Vary"]

for city in CITIES:
    for q in queries:
        leads = self._search_places(client, f"{q} {city}", country, category)
```

**POZOR:** Google Places API je PLACENÉ. Každý request stojí peníze. City-based queries → 12 × 8 × 3 = 288 API calls per run. Při $0.032 per call = ~$9 per run. Zvážit frekvenci.

**Očekávaný zlepšení:**
- Paginace (3 stránky): **480 firem** (vs 160) → **3× nárůst**
- City queries + paginace: **~2 000-3 000 firem** → **15× nárůst**
- Ale: BILLING! Odhadovaný cost: ~$9-15 per run, ~$270-450/měsíc

---

## SOUHRNNÁ TABULKA: AKTUÁLNÍ VS NAVRHOVANÝ

| Scraper | max_pages NYNÍ | max_pages NOVĚ | Leads/run NYNÍ | Leads/run NOVĚ | Nárůst |
|---------|---------------|---------------|----------------|----------------|--------|
| **TipCars** | **1 (žádná paginace!)** | **50** | **30** | **1 500** | **50×** |
| Sauto | 15 | 50 | 200 | 1 000 | 5× |
| Bazoš CZ | 25 (× 9 queries) | 50 (× 9 queries) | 1 500 | 4 000 | 2.5× |
| Bazoš SK | 25 | 50 | 400 | 1 000 | 2.5× |
| Sbazar | 10 | 30 | 100 | 300 | 3× |
| AutoScout24 DE | 15 | 50 (size=50) | 300 | 2 500 | 8× |
| AutoScout24 CZ | 15 | 50 (size=50) | 300 | 2 500 | 8× |
| **AutoScout24 AT** | **N/A (chybí!)** | **50 (size=50)** | **0** | **2 500** | **∞** |
| Firmy.cz | 10 (no cat URLs) | 20 + category URLs | 400 | 1 500 | 4× |
| Zlatéstránky | 1 per combo | 5 per combo | 1 500 | 4 000 | 2.5× |
| ARES | 50 per query | 500 per query + paginace | 300 | 2 000 | 7× |
| **Google Places** | **N/A (ne v scheduleru!)** | **20 × 3 pages × cities** | **0** | **2 000** | **∞** |
| **CELKEM** | | | **~5 000** | **~25 000** | **5×** |

---

## IMPLEMENTAČNÍ PRIORITA

### P0 — Okamžitě (1-2 hodiny práce)

1. **TipCars: přidat paginaci** (`tipcars.py`)
   - Přidat `max_pages = 50` a stránkovací loop
   - Ověřit URL pattern pro paginaci
   - **Dopad: 30 → 1 500 leadů per run (50× nárůst)**

2. **Google Places: přidat do scheduleru** (`scheduler.py`)
   - Přidat `_run_scraper("GOOGLE_PLACES", "", "CZ")` a SK
   - Frekvence: denně (šetřit API billing)
   - **Dopad: 0 → 160 firem denně**

3. **AutoScout24: přidat AT** (`scheduler.py`)
   - Přidat `_run_scraper("AUTOSCOUT24", "", "AT")`
   - **Dopad: +300 leadů per run**

### P1 — Tento týden (4-8 hodin)

4. **Zvýšit max_pages u všech scraperů:**
   - Bazoš CZ: 25 → 50
   - Sauto: 15 → 50
   - Sbazar: 10 → 30
   - AutoScout24: 15 → 50, size 20 → 50
   
5. **ARES: přidat paginaci** (`ares.py`)
   - Použít `start` parameter pro iteraci přes výsledky
   - Přidat NACE kód queries

6. **Firmy.cz: vyplnit CATEGORY_URLS** (`firmy_cz.py`)
   - Ověřit URL strukturu na firmy.cz
   - Přidat category paths

### P2 — Příští týden (8-16 hodin)

7. **Google Places: paginace + city queries**
   - nextPageToken paginace
   - Rozdělit na 12 měst
   - Zvážit billing impact

8. **Zlatéstránky: přidat paginaci per search result**
   - Ověřit URL pattern
   - max_pages = 5 per kombinace

9. **AutoScout24: brand queries pro hloubku**
   - Přidat per-brand scraping s brand ID parametry

### P3 — Optimalizace (ongoing)

10. **Detail page skip pro existující leady**
    - Před fetch detail page: `if db.exists(source, source_id): skip`
    - Ušetří 50%+ času na Bazoš, Sauto, Sbazar, TipCars

11. **Paralelní browser contexts pro headless** (Sauto, Sbazar)
    - 2-3 tabs současně → 2-3× rychlejší

12. **Efektivnější Bazoš query strategie**
    - Analyzovat overlap mezi queries
    - Optimalizovat: buď velký "" scrape NEBO brand queries, ne obojí

---

## SCHEDULER — NAVRHOVANÉ ZMĚNY

### Aktuální scheduler

| Job | Interval | Queries | Est. time |
|-----|----------|---------|-----------|
| Bazoš CZ × 9 | 4h | 9 | ~4h+ (problém!) |
| Bazoš SK | 6h | 1 | ~30min |
| ARES | daily | 1 | ~5min |
| Firmy.cz | 12h | 1 | ~15min |
| Zlatéstránky | 12h | 1 | ~13min |
| TipCars | 6h | 1 | ~5min |
| Sbazar | 8h | 1 | ~30min |
| Sauto | 8h | 1 | ~45min |
| AutoScout24 DE | 6h | 1 | ~5min |
| AutoScout24 CZ | 6h | 1 | ~5min |
| Push | 6h | — | ~1min |
| Verify | 4h | — | ~10min |

### Navrhovaný scheduler

| Job | Interval | Změna | Est. time |
|-----|----------|-------|-----------|
| Bazoš CZ × 9 | 4h | max_pages 50 | ~8h (problém → rozložit!) |
| Bazoš SK | 6h | max_pages 50 | ~1h |
| ARES | daily | + paginace + NACE | ~30min |
| Firmy.cz | 12h | + category URLs + max_pages 20 | ~45min |
| Zlatéstránky | 12h | + paginace (5 stránek) | ~30min |
| **TipCars** | **6h** | **+ paginace (50 stránek)** | **~30min** |
| Sbazar | 8h | max_pages 30 | ~1h |
| Sauto | 8h | max_pages 50 | ~2h |
| AutoScout24 DE | 6h | size=50, max_pages 50 | ~15min |
| AutoScout24 CZ | 6h | size=50, max_pages 50 | ~15min |
| **AutoScout24 AT** | **6h** | **NOVÝ** | **~15min** |
| **Google Places CZ** | **daily** | **NOVÝ** | **~5min** |
| **Google Places SK** | **daily** | **NOVÝ** | **~5min** |

### Problém: Bazoš CZ runtime

9 queries × 50 stránek × ~20 ads × 2 requests × 4s = **~20 hodin**. To je VÍCK než 4h interval!

**Řešení:**
1. **Snížit na 3 queries:** `["", "skoda", "volkswagen"]` — pokryjí 80% trhu
2. **Stagger queries:** Místo 9 queries najednou, 3 queries per interval (rotace)
3. **Skip detail pages pro existující leady** → 50% time savings
4. **Zvýšit interval na 6h** pro Bazoš CZ

---

## DETAIL PAGE BOTTLENECK — SYSTÉMOVÝ PROBLÉM

Největší bottleneck celého systému je **návštěva detail pages pro telefon**. Každý inzerát vyžaduje 2 HTTP requesty (listing + detail).

### Aktuální stav per scraper:

| Scraper | Detail page? | Proč? | Čas per inzerát |
|---------|-------------|-------|-----------------|
| TipCars | ✅ Ano | Telefon + adresa | ~8s |
| Sauto | ✅ Ano (headless) | Telefon + jméno prodejce | ~10s |
| Bazoš | ✅ Ano | Telefon + jméno | ~8s |
| Sbazar | ✅ Ano (headless) | Telefon (klik na tlačítko) | ~10s |
| AutoScout24 | ❌ Ne | Extrahuje z listing card | ~5s |
| Firmy.cz | ❌ Ne | Extrahuje z listing/JSON-LD | ~4s |
| Zlatéstránky | ❌ Ne | Extrahuje z listing | ~4s |
| ARES | ❌ Ne | API response | ~2s |
| Google Places | ❌ Ne | API response | ~1s |

### Řešení:

**A) Skip pro existující leady (NEJEFEKTIVNĚJŠÍ):**
```python
# V _scrape_listing_page(), před _parse_ad():
if source_id and db.lead_exists(Source.BAZOS, source_id):
    logger.debug("Skip existing lead: %s", source_id)
    continue
```
→ Po prvním full scrape, další runs přeskočí 80%+ detail pages.

**B) Lazy phone enrichment:**
- Uložit lead BEZ telefonu z listing page
- Později (background job) enrichovat detail pages pro leady bez telefonu
- Oddělí scraping (rychlý) od enrichment (pomalý)

**C) Phone z listing page (kde možné):**
- Bazoš: občas ukazuje telefon přímo v listing card
- AutoScout24 (CZ verze): někdy ukazuje telefon
- Ověřit per platform

---

## TESTOVÁNÍ

1. **Per-scraper volume test:**
   ```bash
   python -m lead_scout scrape tipcars --limit 100
   python -m lead_scout scrape sauto --limit 100
   python -m lead_scout scrape bazos --limit 100
   # ... atd.
   ```
   Ověřit: vrací se víc výsledků než předtím.

2. **Paginace test:**
   ```bash
   # Ověřit že page 2, 3, ... vrací jiné výsledky než page 1
   python -m lead_scout scrape tipcars --debug 2>&1 | grep "page"
   ```

3. **Runtime monitoring:**
   ```bash
   time python -m lead_scout scrape bazos --country CZ
   # Mělo by trvat rozumnou dobu (< 1h pro 50 stránek)
   ```

4. **Dedup efektivita:**
   - Po zvýšení volume ověřit, že DB dedup funguje a neukládá duplikáty

---

## STOP PRAVIDLA

- **STOP-1:** Pokud scraper dostane 403/429 na vyšších stránkách → snížit max_pages, zvýšit rate_limit_delay
- **STOP-2:** Pokud Bazoš CZ runtime přesáhne 8h → snížit queries nebo zvýšit interval
- **STOP-3:** Pokud Google Places billing > $500/měsíc → snížit frekvenci nebo city count
- **STOP-4:** Pokud headless scrapers (Sauto, Sbazar) konzumují > 2GB RAM → omezit paralelní contexts
- **STOP-5:** Pokud některá platforma změní HTML strukturu po zvýšení volume → scraper selže, opravit selektory

---

## ZÁVĚR

Největší quick wins:
1. **TipCars paginace** — 50× nárůst za 30 minut práce
2. **Google Places do scheduleru** — 0 → 160+ firem denně za 5 minut práce
3. **AutoScout24 AT** — +2 500 leadů per run za 2 minuty práce
4. **Skip existing leads** — 50%+ time savings systémově

Celkový očekávaný nárůst: **~5 000 → ~25 000 leadů per den (5× nárůst)**
