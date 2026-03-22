# Zadání: Obohacení dat partnerů (autobazary + vrakoviště)

## Stav
- **Soubor s daty:** `~/carmakler/prisma/data/partners-seed.json`
- **Enrichment skript:** `~/carmakler/prisma/data/enrich-partners.mjs`
- **Celkem záznamů:** 289 (214 autobazarů + 75 vrakovišť)
- **Pokrytí:** všech 14 krajů ČR

## Co je potřeba doplnit

### 1. GPS souřadnice (lat/lng)
- **Stav:** ~26% záznamů má GPS, ~74% chybí
- **Řešení:** Mapy.cz Suggest API (zdarma) + Nominatim (OSM) jako fallback
- **Žádný API klíč není potřeba**
- **Spuštění:** `node enrich-partners.mjs --geocode`

### 2. Ověření a doplnění IČO přes ARES
- **Stav:** ~73% záznamů má IČO, ~27% chybí
- **Řešení:** ARES REST API (ares.gov.cz) — veřejné, zdarma
- **Co skript dělá:**
  - Ověří existující IČO (aktivní/zaniklý subjekt)
  - Hledá IČO pro záznamy kde chybí (podle názvu firmy + města)
  - Označí zaniklé firmy
- **Žádný API klíč není potřeba**
- **Spuštění:** `node enrich-partners.mjs --ares`

### 3. Google hodnocení a počet recenzí
- **Stav:** 0% — žádný záznam nemá hodnocení
- **Řešení:** Google Places API (Find Place from Text)
- **⚠️ Vyžaduje Google API klíč** s povoleným Places API
- **Spuštění:**
  ```bash
  # Přes env proměnnou
  GOOGLE_PLACES_API_KEY=AIzaSy... node enrich-partners.mjs --google

  # Nebo přes argument
  node enrich-partners.mjs --google --api-key=AIzaSy...
  ```
- **Cena:** ~$0.017 za request → 289 záznamů ≈ $5

## Jak spustit

```bash
cd ~/carmakler/prisma/data

# Vše najednou (geocode + ARES, Google přeskočí bez klíče)
node enrich-partners.mjs

# Jen geocoding
node enrich-partners.mjs --geocode

# Jen ARES
node enrich-partners.mjs --ares

# Jen Google Places
GOOGLE_PLACES_API_KEY=tvůj_klíč node enrich-partners.mjs --google

# Vše včetně Google
GOOGLE_PLACES_API_KEY=tvůj_klíč node enrich-partners.mjs
```

## Poznámky
- Skript automaticky vytvoří zálohu `partners-seed.backup.json` před úpravami
- Rate limiting: 350ms pauza mezi requesty (respektuje limity API)
- Geocoding: Mapy.cz jako primární zdroj, Nominatim (OSM) jako fallback
- ARES: zaniklé firmy budou vypsány v logu (zvážit ruční odstranění)
- Celková doba běhu: ~3-5 minut pro geocode+ARES, ~2 minuty pro Google
