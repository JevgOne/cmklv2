# AUDIT: Kategorizace AUTOBAZAR + VRAKOVISTE — kompletní analýza queries + filtrů

**Datum:** 2026-05-20 (rozšířeno o VRAKOVISTE)
**Priorita:** P0 (URGENTNÍ — uživatel říká "musí fungovat o mnoho lépe")

---

## EXECUTIVE SUMMARY

**Problém je DVOUVRSTVÝ a zasahuje OBĚ kategorie:**

**AUTOBAZAR:** Systém zaměňuje "auto-related business" za "business that SELLS cars". Queries jako "autoservis", "autolakovna", "karosárna" generují stovky špatných leadů — tyto podniky auta NEPRODÁVAJÍ.

**VRAKOVISTE:** Systém zaměňuje "likviduje auta" za "prodává díly z aut". Query "ekologická likvidace" a keyword "likvidace" v ARES kategorizují ekolikvidační služby jako VRAKOVISTE. Příklad: "Martin Nováček" — ekologická likvidace vozidel, odtah autovraků. Pro Carmakler je BEZCENNÝ lead — neprodává díly.

### Definice (co Carmakler SKUTEČNĚ potřebuje):

| Kategorie | Definice | Příklady ✅ | NE příklady ❌ |
|-----------|----------|------------|----------------|
| **AUTOBAZAR** | Firmy co **PRODÁVAJÍ auta** | Autobazar, autosalon, dealer ojetých vozů, komisní prodej | Autoservis, autolakovna, pneuservis, STK, autoškola |
| **VRAKOVISTE** | Firmy co **PRODÁVAJÍ DÍLY** z aut | Vrakoviště s prodejem dílů, rozborka aut, autodíly z vraků | Ekolikvidace, sběrna autovraků, odtahová služba, šrotovné |
| **SOUKROMNIK** | Soukromé osoby prodávající auto | Bazoš/Sbazar inzeráty | — |

---

## 1. AUTOBAZAR — KOMPLETNÍ AUDIT QUERIES

### firmy_cz.py

**SEARCH_QUERIES[AUTOBAZAR]:**

| Query | Prodává auta? | Verdikt |
|-------|---------------|---------|
| `"autobazar"` | ✅ ANO | **NECHAT** |
| `"autosalon"` | ✅ ANO | **NECHAT** |
| `"prodej aut"` | ✅ ANO | **NECHAT** |
| `"ojeté vozy"` | ✅ ANO | **NECHAT** |
| `"autoservis"` | ❌ NE — opravuje | **ODEBRAT** |
| `"autoopravna"` | ❌ NE — opravuje | **ODEBRAT** |

**CATEGORY_URLS[AUTOBAZAR] = `["/Auto-moto"]`**
❌ **ODEBRAT** — mega-kategorie na Firmy.cz zahrnující VŠECHNO: servisy, STK, autoškoly, půjčovny, mytí. Generuje obrovský mix.

### zlatestranky.py

**DEFAULT_QUERIES** (všechny query → default AUTOBAZAR, keyword match → VRAKOVISTE):

| Query | Výsledná kategorie | Prodává auta/díly? | Verdikt |
|-------|--------------------|--------------------|---------|
| `"autobazar"` | AUTOBAZAR | ✅ ANO | **NECHAT** |
| `"autoservis"` | AUTOBAZAR | ❌ NE — opravuje | **ODEBRAT** |
| `"vrakoviště"` | VRAKOVISTE ✅ | ✅ ale viz sekce 2 | **NECHAT** |
| `"autodíly"` | VRAKOVISTE ✅ | ✅ | **NECHAT** |
| `"prodej aut"` | AUTOBAZAR | ✅ ANO | **NECHAT** |
| `"autosalon"` | AUTOBAZAR | ✅ ANO | **NECHAT** |
| `"ojeté vozy"` | AUTOBAZAR | ✅ ANO | **NECHAT** |
| `"autovraky"` | VRAKOVISTE ✅ | ⚠️ viz sekce 2 | **NECHAT** |
| `"rozborka aut"` | AUTOBAZAR ❌ | Mělo by být VRAKOVISTE | **FIX kategorie** |
| `"autolakovna"` | AUTOBAZAR | ❌ NE — lakuje | **ODEBRAT** |

**Keyword detekce (řádek 144):** `["vrak", "díl", "šrot"]` — chybí `"rozborka"`.

### ares.py

**Default queries** (flat list, kategorizace přes name heuristic):

| Query | Výsledná kat. | Prodává auta/díly? | Verdikt |
|-------|---------------|--------------------| --------|
| `"autobazar"` | AUTOBAZAR | ✅ ANO | **NECHAT** |
| `"autoservis"` | AUTOBAZAR | ❌ NE — opravuje | **ODEBRAT** |
| `"vrakoviště"` | VRAKOVISTE ✅ | ⚠️ viz sekce 2 | **NECHAT** |
| `"autodíly"` | AUTOBAZAR ❌ | Mělo by být VRAKOVISTE | **FIX kategorie** |
| `"autosalon"` | AUTOBAZAR | ✅ ANO | **NECHAT** |
| `"prodej aut"` | AUTOBAZAR | ✅ ANO | **NECHAT** |
| `"ojeté vozy"` | AUTOBAZAR | ✅ ANO | **NECHAT** |
| `"autovraky"` | VRAKOVISTE ✅ | ⚠️ viz sekce 2 | **NECHAT** |
| `"rozborka aut"` | AUTOBAZAR ❌ | Mělo by být VRAKOVISTE | **FIX kategorie** |
| `"autoopravna"` | AUTOBAZAR | ❌ NE — opravuje | **ODEBRAT** |
| `"autolakovna"` | AUTOBAZAR | ❌ NE — lakuje | **ODEBRAT** |
| `"karosárna"` | AUTOBAZAR | ❌ NE — opravuje karoserie | **ODEBRAT** |
| `"autokosmetika"` | AUTOBAZAR | ❌ NE — čistí/leští | **ODEBRAT** |
| `"autoelektrika"` | AUTOBAZAR | ❌ NE — opravuje elektro | **ODEBRAT** |

**ARES je NEJHORŠÍ** — 8 z 14 queries generuje špatné leady. A ARES vrací VŠECHNY firmy s daným slovem v názvu z obchodního rejstříku = obrovský objem.

**Keyword detekce (řádek 118):** `["vrak", "díl", "šrot", "likvidace"]` — keyword `"likvidace"` je **CHYBNÝ** (viz sekce 2).

### google_places.py

| Query | OK? | Verdikt |
|-------|-----|---------|
| `"autobazar"` | ✅ | **NECHAT** |
| `"car dealership"` | ✅ | **NECHAT** |
| `"prodej aut"` | ✅ | **NECHAT** |
| `"ojeté vozy"` | ✅ | **NECHAT** |

**Google Places AUTOBAZAR = ČISTÝ.**

### tipcars.py, autoscout24.py, bazos.py, sbazar.py, sauto.py

Všechny OK — buď listing-based (žádné problematické queries), nebo SOUKROMNIK only.

---

## 2. VRAKOVISTE — KOMPLETNÍ AUDIT QUERIES

### firmy_cz.py — SEARCH_QUERIES[VRAKOVISTE]

| Query | Prodává DÍLY? | Verdikt |
|-------|---------------|---------|
| `"vrakoviště"` | ✅ ANO — vrakoviště typicky prodává díly | **NECHAT** |
| `"autodíly"` | ✅ ANO — přímo prodej dílů | **NECHAT** |
| `"autovraky"` | ⚠️ HRANICE — může být prodej dílů ale i jen likvidace | **NECHAT** (filtr zachytí likvidace) |
| `"rozborka aut"` | ✅ ANO — rozborka = rozebírání na díly → prodej | **NECHAT** |
| `"ekologická likvidace"` | ❌ **NE** — LIKVIDACE ≠ prodej dílů! | **ODEBRAT** |
| `"autošrot"` | ⚠️ HRANICE — šrot může prodávat díly ale často jen lisuje | **NECHAT** (filtr zachytí čisté šroty) |
| `"náhradní díly"` | ⚠️ HRANICE — může být eshop s novými díly, ne vrakoviště | **ODEBRAT** (příliš široké) |

**Problém:** Query `"ekologická likvidace"` je primární zdroj bezcenných leadů. Ekolikvidační firmy:
- Přijmou autovrak
- Vydají potvrzení o ekologické likvidaci (pro odhlášení z registru)
- Sešrotují auto
- **NEPRODÁVAJÍ DÍLY** — to je klíčový rozdíl!

### zlatestranky.py

Nemá explicitní VRAKOVISTE queries — ale queries jako `"vrakoviště"`, `"autodíly"`, `"autovraky"` přes keyword detekci spadnou do VRAKOVISTE. **OK**, ale:
- Chybí `"rozborka"` v keyword detekci (řádek 144) → "rozborka aut" leady spadnou jako AUTOBAZAR

### ares.py

Nemá explicitní VRAKOVISTE queries — kategorizace je přes name heuristic. **ALE:**
- Řádek 118: `["vrak", "díl", "šrot", "likvidace"]`
- **Keyword `"likvidace"` je CHYBNÝ!** Způsobuje že "Ekologická likvidace vozidel Martin Nováček" → VRAKOVISTE. Ale tato firma NEPRODÁVÁ DÍLY.

### google_places.py — QUERIES[VRAKOVISTE]

| Query | Prodává DÍLY? | Verdikt |
|-------|---------------|---------|
| `"vrakoviště"` | ✅ ANO | **NECHAT** |
| `"autodíly"` | ✅ ANO | **NECHAT** |
| `"autovraky"` | ⚠️ HRANICE | **NECHAT** (filtr zachytí) |
| `"car wreckers"` | ⚠️ EN, široké | **NECHAT** (Google Places je API-based, méně šumu) |

---

## 3. AUDIT filters.py — SOUČASNÝ STAV + CHYBĚJÍCÍ PATTERNY

### Aktuální patterny (12 pravidel):

| Pattern | Zachytí | Pokrývá VRAKOVISTE? |
|---------|---------|---------------------|
| `\bSTK\b` | STK stanice | AUTOBAZAR only |
| `\bstanice technické kontroly\b` | Plný název STK | AUTOBAZAR only |
| `\bemisn[ií]\b` | Emisní stanice | AUTOBAZAR only |
| `\bautoškol[ay]?\b` | Autoškoly | AUTOBAZAR only |
| `\bautopůjčovn[ay]?\b` | Autopůjčovny | AUTOBAZAR only |
| `\bčerpací stanic[ei]\b` | Čerpací stanice | AUTOBAZAR only |
| `\btankstelle\b` | DE čerpací | AUTOBAZAR only |
| `\bfahrschule\b` | DE autoškoly | AUTOBAZAR only |
| `\bmytí\b.*\baut\b` | Ruční mytí aut | AUTOBAZAR only |
| `\bautomyčk[ay]?\b` | Automyčky | AUTOBAZAR only |
| `\bpneuservis\b` | Pneuservisy | AUTOBAZAR only |
| `\bpneu\b` | Pneu shopy | AUTOBAZAR only |

**KRITICKÉ ZJIŠTĚNÍ:** Filter momentálně VŮBEC NEFILTRUJE VRAKOVISTE leads! Funkce `is_excluded_business()` se volá jen pro `Category.AUTOBAZAR` (db.py řádek 174).

### CHYBĚJÍCÍ patterny — AUTOBAZAR

| Pattern | Co zachytí |
|---------|-----------|
| `\bautoservis\b` | Autoservisy |
| `\bautooprav[na]+\b` | Autoopravny |
| `\bautolakovn[ay]?\b` | Autolakovny |
| `\blakovn[ay]?\b` | Lakovny obecně |
| `\bkarosárn[ay]?\b` | Karosárny |
| `\bklempířství\b` | Autoklempířství |
| `\bautokosmetik[ay]?\b` | Autokosmetiky |
| `\bdetailing\b` | Detailing studia |
| `\bautoelektrik[ay]?\b` | Autoelektriky |
| `\bautoelektron\b` | Autoelektronika |
| `\bautodíln[ay]?\b` | Autodílny (opravny) |
| `\bservis\b` | Generické "servis" |
| `\bopravna\b` | Generické "opravna" |
| `\btažná služba\b` | Odtahové služby |
| `\bodtah\b` | Odtahy |
| `\btuning\b` | Tuning shopy |
| `\bchip\s*tuning\b` | Chiptuning |
| `\bautodoprav\b` | Autodoprava |
| `\bautojeřáb\b` | Autojeřáby |
| `\bautobusov[áý]\b` | Autobusová doprava |
| `\bKfz\b` | DE autoservis |
| `\bWerkstatt\b` | DE dílna |

### CHYBĚJÍCÍ patterny — VRAKOVISTE (NOVÉ!)

| Pattern | Co zachytí | Proč vyloučit |
|---------|-----------|---------------|
| `\bekologická likvidace\b` | Ekolikvidační služby | Likvidují, ne prodávají díly |
| `\bekolikvidace\b` | Zkratka ekolikvidace | Totéž |
| `\blikvidace vozidel\b` | Likvidace vozidel | Neprodávají díly |
| `\blikvidace autovraků\b` | Likvidace autovraků | Neprodávají díly |
| `\bodtah\b.*\bvrak\b` | Odtah autovraků | Logistika, ne prodej dílů |
| `\bsběrn[ay]?\b.*\bvrak\b` | Sběrna autovraků | Sbírá, ne prodává díly |
| `\bsběrn[ay]?\b.*\bkov\b` | Sběrna kovů | Šrotovné, ne díly |
| `\bšrotovné\b` | Služba výdeje šrotovného | Admin služba |
| `\bvýkup\b.*\bvrak\b` | Výkup autovraků | Kupují vraky, ne prodávají díly |
| `\brecyklace\b` | Recyklace | Zpracování odpadu |
| `\bodpad\b` | Odpady | Odpadové hospodářství |

---

## 4. KOMPLETNÍ DOPORUČENÍ

### A) AUTOBAZAR queries — FINÁLNÍ SEZNAM

**CO ZŮSTANE (validní AUTOBAZAR queries):**
```
"autobazar"
"autosalon"
"prodej aut"
"ojeté vozy"
"car dealership"        (jen Google Places)
```

**CO SE ODEBERE:**
```
"autoservis"            → firmy_cz, zlatestranky, ares
"autoopravna"           → firmy_cz, ares
"autolakovna"           → zlatestranky, ares
"karosárna"             → ares
"autokosmetika"         → ares
"autoelektrika"         → ares
"/Auto-moto" URL        → firmy_cz CATEGORY_URLS
```

**CO SE PŘIDÁ (volitelně):**
```
"výkup aut"             → na hraně, ale kupuje auta = obchoduje
"komisní prodej"        → přesně definice autobazaru
```

### B) VRAKOVISTE queries — FINÁLNÍ SEZNAM

**CO ZŮSTANE (validní VRAKOVISTE queries):**
```
"vrakoviště"
"autodíly"
"autovraky"
"rozborka aut"
"autošrot"              (hranice, ale filtr zachytí čisté šroty)
"car wreckers"          (jen Google Places)
```

**CO SE ODEBERE:**
```
"ekologická likvidace"  → firmy_cz — NEPRODÁVÁ DÍLY
"náhradní díly"         → firmy_cz — příliš široké, vrací eshopy s novými díly
```

### C) Keyword detekce v scraperech — OPRAVY

**ares.py řádek 118 — ODEBRAT "likvidace"!**
```python
# AKTUÁLNĚ:
if any(kw in name_lower for kw in ["vrak", "díl", "šrot", "likvidace"]):
    category = Category.VRAKOVISTE
# NOVĚ:
if any(kw in name_lower for kw in ["vrak", "díl", "šrot", "rozborka"]):
    category = Category.VRAKOVISTE
```
Odstraněno `"likvidace"`, přidáno `"rozborka"`. Firma s "likvidace" v názvu = ekolikvidace, NE vrakoviště.

**zlatestranky.py řádek 144 — přidat "rozborka":**
```python
# AKTUÁLNĚ:
if any(kw in query_lower or kw in name_lower for kw in ["vrak", "díl", "šrot"]):
# NOVĚ:
if any(kw in query_lower or kw in name_lower for kw in ["vrak", "díl", "šrot", "rozborka"]):
```

**firmy_cz.py řádek 235 — přidat "rozborka" (JIŽ TAM JE ✅):**
```python
vrakoviste_keywords = {"vrak", "díl", "šrot", "rozborka", "autovrak"}
```

### D) filters.py — NOVÁ KOMPLETNÍ VERZE

```python
"""Lead filtering — reject non-relevant businesses before saving."""

import re

# ============================================================
# AUTOBAZAR exclusions — businesses that DON'T SELL CARS
# ============================================================
EXCLUDED_AUTOBAZAR_PATTERNS = [
    # STK / emisní
    r"\bSTK\b",
    r"\bstanice technické kontroly\b",
    r"\bemisn[ií]\b",

    # Servisy / opravny (opravují, ne prodávají)
    r"\bautoservis\b",
    r"\bautooprav[na]+\b",
    r"\bautodíln[ay]?\b",
    r"\bservis\b",
    r"\bopravna\b",
    r"\bwerkstatt\b",
    r"\bKfz\b",

    # Lakovny / karosárny
    r"\bautolakovn[ay]?\b",
    r"\blakovn[ay]?\b",
    r"\bkarosárn[ay]?\b",
    r"\bklempířství\b",

    # Elektrika / elektronika
    r"\bautoelektrik[ay]?\b",
    r"\bautoelektron\b",

    # Kosmetika / detailing / mytí
    r"\bautokosmetik[ay]?\b",
    r"\bdetailing\b",
    r"\bmytí\b.*\baut\b",
    r"\bautomyčk[ay]?\b",
    r"\bcar\s*wash\b",

    # Pneu
    r"\bpneuservis\b",
    r"\bpneu\b",

    # Autoškoly / půjčovny
    r"\bautoškol[ay]?\b",
    r"\bautopůjčovn[ay]?\b",
    r"\bfahrschule\b",

    # Čerpací stanice
    r"\bčerpací stanic[ei]\b",
    r"\btankstelle\b",

    # Odtah / asistence
    r"\btažná služba\b",
    r"\bodtah\b",
    r"\basistenční\b",

    # Tuning
    r"\btuning\b",
    r"\bchip\s*tuning\b",

    # Speciální
    r"\bautobusov[áý]\b",
    r"\bautojeřáb\b",
    r"\bautodoprav\b",
]

# ============================================================
# VRAKOVISTE exclusions — businesses that DON'T SELL PARTS
# ============================================================
EXCLUDED_VRAKOVISTE_PATTERNS = [
    # Ekolikvidace (likvidují vraky, neprodávají díly)
    r"\bekologická likvidace\b",
    r"\bekolikvidace\b",
    r"\blikvidace vozidel\b",
    r"\blikvidace autovraků\b",
    r"\blikvidace vrak\b",

    # Sběrny (sbírají vraky/kovy, neprodávají díly)
    r"\bsběrn[ay]?\b",
    r"\bsběrné\b",

    # Výkup vraků (kupují vraky pro likvidaci, ne pro prodej dílů)
    r"\bvýkup\b.*\bvrak\b",
    r"\bvýkup\b.*\bautovrak\b",

    # Odtah vraků
    r"\bodtah\b.*\bvrak\b",
    r"\bodtah\b.*\bautovrak\b",

    # Šrotovné (služba vyřízení šrotovného)
    r"\bšrotovné\b",

    # Recyklace / odpady
    r"\brecyklace\b",
    r"\bodpad[yů]?\b",
]

_EXCLUDED_AUTOBAZAR_RE = re.compile(
    "|".join(EXCLUDED_AUTOBAZAR_PATTERNS), re.IGNORECASE
)
_EXCLUDED_VRAKOVISTE_RE = re.compile(
    "|".join(EXCLUDED_VRAKOVISTE_PATTERNS), re.IGNORECASE
)


def is_excluded_business(name: str, category: str = "AUTOBAZAR") -> bool:
    """Check if business name matches exclusion patterns.

    Returns True if the business should be EXCLUDED (not saved).
    Uses category-specific patterns.
    """
    if category == "VRAKOVISTE":
        return bool(_EXCLUDED_VRAKOVISTE_RE.search(name))
    else:
        return bool(_EXCLUDED_AUTOBAZAR_RE.search(name))
```

### E) db.py — ROZŠÍŘIT FILTR NA OBĚ KATEGORIE

**Soubor:** `lead_scout/db.py` řádek 174

```python
# AKTUÁLNĚ:
if lead.category == Category.AUTOBAZAR and is_excluded_business(lead.name):

# NOVĚ:
if lead.category in (Category.AUTOBAZAR, Category.VRAKOVISTE) and \
   is_excluded_business(lead.name, category=lead.category.value):
```

### F) ARES — SPLIT QUERIES NA KATEGORIE

Aktuálně ARES má flat list queries s name-based category detection. Lepší: explicitně rozdělit:

```python
AUTOBAZAR_QUERIES = [
    "autobazar", "autosalon", "prodej aut", "ojeté vozy",
]
VRAKOVISTE_QUERIES = [
    "vrakoviště", "autovraky", "rozborka aut", "autodíly",
]

# V _search_ares() nastavit default category podle query listu
```

---

## 5. SCOPE DOPADU

### AUTOBAZAR — špatné leady per scrape cyklus

| Scraper | Špatné queries | Odhad špatných leadů |
|---------|---------------|---------------------|
| ARES | 8 z 14 | ~400 |
| Firmy.cz | 2 queries + `/Auto-moto` | ~100-300 |
| Zlatéstránky | 2 queries × 20 měst | ~200 |
| **CELKEM** | | **~700-900** |

### VRAKOVISTE — špatné leady per scrape cyklus

| Scraper | Špatné queries/keywords | Odhad špatných leadů |
|---------|------------------------|---------------------|
| Firmy.cz | "ekologická likvidace", "náhradní díly" | ~50-100 |
| ARES | keyword "likvidace" zachytí ALL firmy s "likvidace" v názvu | ~100-200 |
| **CELKEM** | | **~150-300** |

### Celkový šum: **~850-1200 špatných leadů per full scrape cyklus!**

---

## 6. IMPLEMENTAČNÍ PLÁN

**Pořadí (KRITICKÉ — nesmí se přeházet):**

1. **Odebrat špatné queries** ze všech scraperů
   - AUTOBAZAR: odebrat autoservis, autoopravna, autolakovna, karosárna, autokosmetika, autoelektrika
   - AUTOBAZAR: odebrat `/Auto-moto` z firmy_cz
   - VRAKOVISTE: odebrat "ekologická likvidace", "náhradní díly" z firmy_cz
2. **Opravit keyword detekci**
   - ARES: **ODEBRAT** "likvidace" z VRAKOVISTE keywords, PŘIDAT "rozborka"
   - Zlatéstránky: PŘIDAT "rozborka" do keyword detekce
3. **Aktualizovat filters.py** — rozdělit na AUTOBAZAR + VRAKOVISTE patterns, nový signature `is_excluded_business(name, category)`
4. **Aktualizovat db.py** — volat filtr pro OBĚ kategorie
5. **SQL cleanup** existujících špatných leadů
6. **ARES refactor** — rozdělit flat query list na explicitní AUTOBAZAR/VRAKOVISTE seznamy

## STOP pravidla

- **STOP-1:** Pattern `\bservis\b` — firma "Autoservis a Bazar Novák" by měla projít. Pokud existují firmy kde "servis" + "bazar/prodej" v jednom názvu → potřeba negative lookahead nebo whitelist.
- **STOP-2:** Pattern `\bsběrn[ay]?\b` — "Sběrna dílů" by měla projít (prodává díly). Pokud koliduje → zpřesnit na `\bsběrn[ay]?\b.*\b(vrak|kov|odpad)\b`.
- **STOP-3:** Po odebrání queries ověřit že stále zůstává dostatečný počet validních leadů.
