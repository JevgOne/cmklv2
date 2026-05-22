# Plán: AS24/Sauto — filtrovat dealery, scrapovat JEN soukromé prodejce

**Task:** #53
**Status:** READY FOR IMPLEMENTATION
**Priority:** HIGH
**Datum:** 2026-05-20

---

## §1 Kontext a problém

### Současný stav
Listing scrapery (AS24, Sauto) stahují VŠECHNY inzeráty — jak od soukromníků, tak od dealerů/autobazarů. Výsledek:
- **6143 AS24 AUTOBAZAR leadů** v DB — jsou to jednotlivé inzeráty aut od dealerů, ne firmy
- Dealer s 50 auty → 50 leadů v kategorii AUTOBAZAR → nesmysl
- Carmakler nepotřebuje inzeráty aut od dealerů — dealery se scrapují jako FIRMY přes Firmy.cz, Zlaté stránky, ARES

### Cílový stav
| Zdroj | Kategorie | Co scrapuje | Lead = |
|-------|-----------|-------------|--------|
| AS24, Sauto, Bazoš, Sbazar | SOUKROMNIK | auta od soukromých osob | 1 auto = 1 lead |
| Firmy.cz, Zlaté stránky, ARES, Google Places | AUTOBAZAR / VRAKOVISTE | firmy | 1 firma = 1 lead |
| TipCars | AUTOBAZAR | dealery (z listing karet) | 1 dealer = 1 lead |

### Pravidlo
> Listing scrapery (AS24, Sauto, Bazoš, Sbazar) scrapují **POUZE soukromé prodejce**.
> Dealer/autobazar leady přicházejí **VÝHRADNĚ** z business scraperů (Firmy.cz, Zlaté stránky, ARES, Google Places).
> TipCars je výjimka — extrahuje dealera z listing karet (1 dealer = 1 lead, ne 1 auto = 1 lead).

---

## §2 Analýza scraperů

### 2.1 AutoScout24 (`autoscout24.py`)
**Problém:** Scrapuje dealers i private sellers dohromady.

**Detekce seller typu:** Perfektní — AS24 má `data-seller-type` atribut na `<article>`:
- `data-seller-type="d"` → dealer
- `data-seller-type="p"` → private (soukromník)

**Řádek 108-110:**
```python
seller_type = ad_el.get("data-seller-type", "")
category = Category.AUTOBAZAR if seller_type == "d" else Category.SOUKROMNIK
```

**URL filtr:** `&custtype=P` — filtruje na soukromé prodejce (Private).
Ověřeno 2026-05-20 implementátorem: DE 20/20 private, CZ 50/50 private, AT 50/50 private. ✅ DEPLOYED.
> Pozn.: `&seller=P` = Professional (dealer), NE private. Správný parametr je `custtype=P`.

**Řešení (IMPLEMENTOVÁNO):**
1. **URL level:** `&custtype=P` přidán do search URL
2. **Parse level:** V `_parse_ad()` skip `data-seller-type="d"` jako safety net

### 2.2 Sauto (`sauto.py`)
**Problém:** Scrapuje vše, na detail page detekuje typ prodejce a nastaví kategorii.

**Detekce seller typu:**
- **V listing kartě (řádek 169-182):** `category = Category.SOUKROMNIK` default, přepíše na AUTOBAZAR pokud text obsahuje "bazar", "autosalon", "dealer", "s.r.o", "a.s.", "spol."
- **V detail page (řádek 276-288):** Přesnější detekce — "soukromý" → SOUKROMNIK, keywords → AUTOBAZAR

**Hlavní smyčka (řádek 63-73):**
```python
for lead in page_leads:
    if lead.source_url:
        phone, seller_name, seller_cat = self._fetch_detail(page, lead.source_url)
        if phone:
            lead.phone = phone
            if seller_name:
                lead.name = seller_name
            if seller_cat:
                lead.category = seller_cat
            result.leads.append(lead)
```

**URL filtr:** Sauto.cz podporuje URL parametr pro typ prodejce:
- `?prodejce=soukromy` nebo `?prodejce=2` (soukromý) vs `?prodejce=1` (firma)
- Ověřit přesný parametr na webu.

**Řešení:** Dvouvrstvý filtr:
1. **Listing karta:** V `_parse_card()` přeskočit karty kde `category == AUTOBAZAR` (dealer keywords detekované)
2. **Detail page:** V hlavní smyčce po `_fetch_detail()` přeskočit lead kde `seller_cat == AUTOBAZAR`
3. **Bonus (URL filtr):** Přidat parametr soukromého prodejce do URL pokud Sauto.cz ho podporuje

### 2.3 Bazoš (`bazos.py`) ✅ OK
Hardcoded `category=Category.SOUKROMNIK` (řádek 260). Nemá žádnou dealer detekci. Soukromé inzeráty by design.

### 2.4 Sbazar (`sbazar.py`) ✅ OK
Hardcoded `category=Category.SOUKROMNIK` (řádek 187). Stejný případ jako Bazoš.

### 2.5 TipCars (`tipcars.py`) — VÝJIMKA
**Opačný přístup:** TipCars extrahuje dealer name z karet a vytváří 1 lead per dealer.
- Řádek 195-202: Extrahuje `dealer_name` z footer, přeskočí pokud nemá dealer info
- Řádek 81-83: `seen_dealers` set pro dedup by dealer name
- Hardcoded `category=Category.AUTOBAZAR` (řádek 209)

**Rozhodnutí:** TipCars zůstává beze změny. Funguje správně jako dealer scraper (1 dealer = 1 lead). Doplňuje business scrapery — zachytí menší bazary co nejsou ve Firmy.cz/ARES.

---

## §3 Implementační plán

### Krok 1: AutoScout24 — filtrovat na private sellers only

**Soubor:** `lead_scout/scrapers/autoscout24.py`

> **UPDATE 2026-05-20:** Správný URL parametr je `&custtype=P` (ne `&seller=P`).
> Ověřeno na DE/CZ/AT — 100% private sellers. DEPLOYED na server. ✅

**1a) URL parametr (řádek 55):**
```python
# PŘED:
url = f"{base_url}/lst?sort=standard&desc=0&ustate=N%2CU&size=50&page={page}&atype=C"

# PO:
url = f"{base_url}/lst?sort=standard&desc=0&ustate=N%2CU&size=50&page={page}&atype=C&custtype=P"
```

**1b) Parse-level filtr v `_parse_ad()` (řádek 108-110):**
```python
# PŘED:
seller_type = ad_el.get("data-seller-type", "")
category = Category.AUTOBAZAR if seller_type == "d" else Category.SOUKROMNIK

# PO:
seller_type = ad_el.get("data-seller-type", "")
if seller_type == "d":
    return None  # Skip dealer listings — only private sellers
category = Category.SOUKROMNIK
```

**1b) Odstranit mrtvý kód:** Po filtraci dealer listingů jsou tyto věci nepotřebné:
- `customer_id = ad_el.get("data-customer-id")` (řádek 155) — dealer-specific
- Category AUTOBAZAR branch v `_parse_ad()` — nikdy nenastane

**1c) Logování:**
```python
logger.info("AutoScout24 page %d (%s): %d private ads (skipped %d dealer)", 
            page, country.value, len(leads), dealer_skipped)
```

**1d) VYŘEŠENO:** S `&custtype=P` AS24 vrací 100% private sellers. Funguje na všech trzích (CZ/DE/AT).

### Krok 2: Sauto — filtrovat na private sellers only

**Soubor:** `lead_scout/scrapers/sauto.py`

**2a) Listing karta — early skip (v `_parse_card()`, po řádek 182):**
```python
# Po detekci category z dat sekce:
if category == Category.AUTOBAZAR:
    return None  # Skip dealer/autobazar listings
```

**2b) Detail page — safety net (v `scrape()`, řádek 63-73):**
```python
for lead in page_leads:
    if lead.source_url:
        phone, seller_name, seller_cat = self._fetch_detail(page, lead.source_url)
        if seller_cat == Category.AUTOBAZAR:
            logger.debug("Skipping dealer listing: %s", lead.source_url)
            continue  # Skip — confirmed dealer on detail page
        if phone:
            lead.phone = phone
            if seller_name:
                lead.name = seller_name
            lead.category = Category.SOUKROMNIK  # Always SOUKROMNIK
            result.leads.append(lead)
            result.total_found += 1
```

**2c) Bonus — URL filtr pokud existuje:**
Implementátor ověří na Sauto.cz jestli parametr `?prodejce=soukromy` nebo `?prodejce=2` funguje. Pokud ano, přidat do `first_url` a pagination URL.

**2d) Hardcode category:**
V `_parse_card()` nastavit `category = Category.SOUKROMNIK` vždy (ne jako default s přepisem).

### Krok 3: DB cleanup — existující AUTOBAZAR leady z AS24/Sauto

**3a) Analýza dat (SQL):**
```sql
-- Kolik AS24 AUTOBAZAR leadů existuje?
SELECT COUNT(*) FROM leads WHERE source = 'AUTOSCOUT24' AND category = 'AUTOBAZAR';
-- Očekáváno: ~6143

-- Kolik Sauto AUTOBAZAR leadů?
SELECT COUNT(*) FROM leads WHERE source = 'SAUTO' AND category = 'AUTOBAZAR';
```

**3b) Smazat nevalidní leady:**
```sql
-- Smazat ALL AUTOBAZAR leady z listing scraperů (jsou to inzeráty aut, ne firmy)
DELETE FROM leads WHERE source = 'AUTOSCOUT24' AND category = 'AUTOBAZAR';
DELETE FROM leads WHERE source = 'SAUTO' AND category = 'AUTOBAZAR';
```

**Důvod smazání místo překategorizování:**
- Jsou to inzeráty od dealerů — nemají telefon soukromníka, jen dealer kontakt
- Dealer kontakty má Lead Scout správně z Firmy.cz/ARES/Zlaté stránky
- Duplicity by narušily dedup logiku

**3c) Ověření po cleanup:**
```sql
SELECT source, category, COUNT(*) FROM leads GROUP BY source, category;
-- AS24 a Sauto by měly mít POUZE SOUKROMNIK
```

### Krok 4: TipCars — bez změny, jen ověření

TipCars zůstává beze změny. Extrahuje dealery z listing karet — to je správný přístup pro doplnění business scraperů.

Ověřit:
- `category=Category.AUTOBAZAR` hardcoded ✅
- `seen_dealers` dedup funguje ✅
- `dealer_name` extrakce z footer ✅

---

## §4 Dopad na objem a výkon

### Objem po filtraci
- **AS24:** Z ~50 ads/page přibližně 30-40% je od soukromníků (odhad). S URL filtrem `&seller=P` dostaneme čistě soukromé inzeráty.
- **Sauto:** Podobný poměr. Méně detail page requestů (přeskočíme dealer karty ještě před fetch_detail).

### Výkonnostní zisk u Sauto
Sauto navštěvuje detail page pro KAŽDÝ listing (Playwright, pomalé). Po filtraci dealer karet v `_parse_card()`:
- Přeskočíme ~60% detail page requestů
- Výrazné zrychlení scrape runu

### Kvalita dat
- SOUKROMNIK leady budou mít správná data (telefon soukromníka, ne dealer hotline)
- Žádné duplicitní firmy v DB z listing scraperů
- AUTOBAZAR leady přicházejí ČISTĚ z business scraperů → konzistentní data

---

## §5 Acceptance Criteria

- [x] AS24 scraper vrací POUZE `Category.SOUKROMNIK` leady ✅ DEPLOYED
- [x] AS24 `_parse_ad()` vrací `None` pro `data-seller-type="d"` ✅ DEPLOYED
- [x] AS24 URL obsahuje `&custtype=P` parametr ✅ DEPLOYED (DE/CZ/AT ověřeno)
- [ ] Sauto scraper vrací POUZE `Category.SOUKROMNIK` leady
- [ ] Sauto `_parse_card()` vrací `None` pro dealer karty
- [ ] Sauto hlavní smyčka přeskočí lead kde detail page vrátí `seller_cat == AUTOBAZAR`
- [ ] DB cleanup: žádné AUTOBAZAR leady z AS24/Sauto v databázi
- [ ] Bazoš — beze změny ✅ (hardcoded SOUKROMNIK)
- [ ] Sbazar — beze změny ✅ (hardcoded SOUKROMNIK)
- [ ] TipCars — beze změny ✅ (dealer scraper, correct pattern)
- [ ] Logování dealer skip countů
- [ ] Testy projdou

---

## §6 STOP pravidla

- **STOP-1:** ~~URL parametr `&seller=P`~~ VYŘEŠENO: správný parametr je `&custtype=P`. Deployed ✅
- **STOP-2:** Sauto URL filtr pro soukromé prodejce nefunguje → spoléhat na parse + detail page filtr
- **STOP-3:** Po DB cleanup zůstane < 100 SOUKROMNIK leadů z AS24 → ověřit že filtr není příliš agresivní
- **STOP-4:** Nejasnost zda TipCars má zůstat jako dealer scraper → eskalovat na uživatele

---

## §7 Soubory k úpravě

| Soubor | Změna | Rozsah |
|--------|-------|--------|
| `lead_scout/scrapers/autoscout24.py` | URL filtr + parse skip dealers | ~10 řádků |
| `lead_scout/scrapers/sauto.py` | Parse skip + detail page skip | ~15 řádků |
| SQLite DB | DELETE AUTOBAZAR z AS24/Sauto | SQL příkazy |
| `lead_scout/scrapers/tipcars.py` | Žádná změna | — |
| `lead_scout/scrapers/bazos.py` | Žádná změna | — |
| `lead_scout/scrapers/sbazar.py` | Žádná změna | — |

**Celkový rozsah:** Malý (~25 řádků kódu + SQL cleanup). Čistý, jasný zásah.
