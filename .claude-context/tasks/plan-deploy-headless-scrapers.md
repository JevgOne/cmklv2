# PLÁN: Deploy Headless Scrapers + Playwright na produkci

**Datum:** 2026-05-20
**Priorita:** P1
**Cesta:** Produkce `ssh server` → `/var/www/lead-scout`

---

## Co se deployuje

Dva nové headless scrapery (Sbazar.cz + Sauto.cz) + Playwright runtime:

- `lead_scout/scrapers/headless_base.py` — base class pro Playwright scrapery
- `lead_scout/scrapers/sbazar.py` — Sbazar.cz scraper
- `lead_scout/scrapers/sauto.py` — Sauto.cz scraper
- Scheduler jobs pro oba (v `scheduler.py`)

## Prerekvizity na serveru

- Python 3.11+ ✅ (již nainstalováno)
- Playwright Chromium browser ❌ (nutno nainstalovat)
- Dostatek RAM pro headless Chromium (~200MB per instance)

## Deploy postup

### Krok 1: Push kód na server

```bash
# Lokálně — ověřit že vše je committnuté
cd /Users/zen/Projects/lead-scout
git status
git push origin main
```

### Krok 2: SSH + pull

```bash
ssh server
cd /var/www/lead-scout
git pull origin main
```

### Krok 3: Instalace dependencies

```bash
# Aktivovat virtualenv
source venv/bin/activate

# Update pip dependencies
pip install -r requirements.txt

# Instalace Playwright + Chromium browser
pip install playwright
playwright install chromium

# Playwright potřebuje system deps na Ubuntu/Debian:
playwright install-deps chromium
```

**POZOR:** `playwright install-deps` vyžaduje sudo a instaluje system packages (libnss3, libatk1.0-0, libcups2, atd.). Na Ubuntu/Debian je to nutné pro headless Chromium.

Pokud server nemá sudo přístup nebo je stripped OS:

```bash
# Alternativa: manual system deps
sudo apt-get install -y \
    libnss3 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 \
    libxrandr2 libgbm1 libpango-1.0-0 libcairo2 \
    libasound2 libatspi2.0-0
```

### Krok 4: Test Playwright

```bash
# Ověřit že Chromium funguje headless
python -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('https://www.google.com')
    print(f'Title: {page.title()}')
    browser.close()
    print('Playwright OK')
"
```

### Krok 5: Test scraperů

```bash
# Test Sbazar scraper
python -m lead_scout scrape sbazar --limit 5

# Test Sauto scraper
python -m lead_scout scrape sauto --limit 5

# Ověřit výsledky
python -m lead_scout stats
```

### Krok 6: Restart Lead Scout

```bash
# Restart PM2 procesu
pm2 restart lead-scout

# Ověřit status
pm2 status

# Sledovat logy
pm2 logs lead-scout --lines 30
```

### Krok 7: Monitoring (první 24h)

```bash
# Po 8 hodinách zkontrolovat zda Sbazar + Sauto jobs běží
pm2 logs lead-scout --lines 100 | grep -E "(Sbazar|Sauto|sbazar|sauto)"

# Zkontrolovat DB stats
python -m lead_scout stats
```

---

## Paměťové požadavky

- Headless Chromium: ~200-300 MB RAM per instance
- Sbazar + Sauto nikdy neběží paralelně (offset v scheduler: 04:00 vs 05:00)
- Server by měl mít min. 2 GB volné RAM

Ověřit:
```bash
free -h
```

## Scheduler konfigurace (reference)

Existující joby v `scheduler.py`:
- **Sbazar:** `IntervalTrigger(hours=8, start_date="2026-01-01 04:00:00")`
- **Sauto:** `IntervalTrigger(hours=8, start_date="2026-01-01 05:00:00")`

→ 3x denně každý, 1 hodina offset mezi nimi.

## STOP pravidla

- **STOP-1:** Pokud `playwright install chromium` failne → zkontrolovat disk space (`df -h`) a RAM (`free -h`)
- **STOP-2:** Pokud `playwright install-deps` vyžaduje sudo a nemáme → hledat alternativu (Docker, snap)
- **STOP-3:** Pokud test scraper (`scrape sbazar --limit 5`) vrátí 0 leadů → debugging (anti-bot ochrana, CMP consent cookies)
- **STOP-4:** Pokud po restartu PM2 logs ukazují `playwright._impl._errors.Error` → Chromium path nebo system deps

## Rollback

Pokud scrapery padají a ovlivňují zbytek Lead Scoutu:

```bash
# V scheduler.py zakomentovat sbazar + sauto joby
# NEBO: nastavit enabled=False
pm2 restart lead-scout
```

## Rizika

- **Střední:** Headless Chromium na VPS může být resource-intensive
- **Nízké:** Anti-bot ochrana Sbazar/Sauto — řešeno consent cookies + user-agent rotation v base class
- **Nízké:** CMP consent banner — řešeno v `BaseScraper._get_client()` (euconsent-v2 cookie)
