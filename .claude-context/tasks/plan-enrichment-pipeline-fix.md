# Plan: Fix Enrichment Pipeline (fotky, popis, vybava)

**Datum:** 2026-05-20
**Typ:** Bugfix + Enhancement
**Stav:** PLAN READY

---

## Problém

Produkční DB:
- **Sauto**: 42 leadů, 0 fotek, 0 popisů, 0 výbavy
- **Bazoš**: 43 leadů, 3 fotky, 3 popisy, 0 výbavy
- **Sbazar**: 0 enrichment (by design — kód to neumí)

---

## Analýza pipeline (kde data tečou)

```
Scraper._fetch_detail()           ← EXTRAKCE z HTML
    ↓
ScoutLeadPayload (Pydantic)       ← MODEL má pole ✅
    ↓
LeadDB.save_lead()                ← SQLITE ukládá správně ✅
    ↓
CarmaklerClient._row_to_payload() ← SNAKE_TO_CAMEL mapování ✅ + JSON_FIELDS deserializace ✅
    ↓
POST /api/scout-leads/ingest      ← ZOD validace přijímá ✅ (ale vehiclePhotos má z.string().url())
    ↓
ingestScoutLeads() → prisma.create ← PRISMA ukládá ✅ (JSON.stringify pro array pole)
    ↓
Prisma Schema ScoutLead           ← POLE existují ✅ (vehiclePhotos String? @db.Text, etc.)
```

**Celý "backend" pipeline (SQLite → API → Prisma) je FUNKČNÍ.** Důkaz: Bazoš má 3 fotky a 3 popisy v DB — data doputují, když je scraper najde.

---

## ROOT CAUSES (seřazeno podle priority)

### RC-1: Sauto CSS selektory jsou zastaralé [CRITICAL]

**Soubor:** `lead_scout/scrapers/sauto.py:362-394` (`_fetch_detail`)

Sauto pravděpodobně redesignoval detail stránky. Všechny 3 enrichment extraktory selhávají:

**Popis (ř. 363-371):**
```python
for sel in [
    "div[class*='description']", "div[class*='popis']",
    "div.c-detail__text", "section[class*='description']",
]:
```
→ Žádný z těchto selektorů se netrefuje do aktuálního HTML Sauta.

**Fotky (ř. 375-382):**
```python
for img in soup.select("img[src], img[data-src]"):
    src = img.get("data-src") or img.get("src") or ""
    if src and ("sauto" in src or "szn" in src) and "thumb" not in src:
```
→ Filtr `"sauto" in src or "szn" in src` nemusí odpovídat novému CDN.

**Výbava (ř. 385-394):**
```python
for sel in [
    "div[class*='equipment'] li", "div[class*='vybava'] li",
    "ul[class*='features'] li", "div[class*='feature'] li",
]:
```
→ Sauto pravděpodobně změnil strukturu výbavy.

**Důkaz:** 0/42 = 0% úspěšnost → kompletně rozbité selektory.

---

### RC-2: Bazoš — selektory fungují částečně, výbava NEIMPLEMENTOVÁNA [HIGH]

**Soubor:** `lead_scout/scrapers/bazos.py:341-408` (`_fetch_detail`)

**Co funguje (3/43 = 7%):**
- `div.popisdetail` pro popis — občas matchne
- `img[src*='img.bazos']` pro fotky — občas matchne

**Co CHYBÍ:**
- **Výbava vůbec NEEXISTUJE** v `_fetch_detail`. Funkce vrací `(phone, seller_name, description, photos, params)` kde `params` obsahuje fuel/transmission/power/color, ale NE equipment.
- V `_parse_ad` (ř. 318-339) se `vehicle_equipment` NIKDY nenastavuje.

**Proč jen 7% úspěšnost:**
- Většina Bazoš ads může mít odlišnou HTML strukturu
- Detail page fetch může selhat (rate limiting, timeouty)
- Některé inzeráty nemají velký popis

---

### RC-3: Sbazar — ŽÁDNÁ enrichment extrakce [MEDIUM]

**Soubor:** `lead_scout/scrapers/sbazar.py:206-255` (`_fetch_phone`)

Metoda `_fetch_phone` extrahuje POUZE telefon. Žádný popis, fotky, ani výbava.

`_parse_card` (ř. 191-204) také neextrahuje žádná enrichment data.

---

### RC-4: Zod vehiclePhotos validace je křehká [LOW — potenciální budoucí problém]

**Soubor:** `lib/validators/scout-lead.ts:84`
```typescript
vehiclePhotos: z.array(z.string().url()).optional().nullable(),
```

Každá URL musí projít `z.string().url()`. Pokud jakákoliv URL neprojde (např. protocol-relative `//`, mezery, speciální znaky), celý lead selže na validaci. A protože se batch posílá jako celek:

```typescript
// route.ts:46
const data = scoutLeadIngestSchema.parse(body);
```

Pokud JEDEN lead v batchi selže, CELÝ batch 50 leadů vrátí 400 a v client.py:
```python
elif response.status_code == 400:
    for lid in lead_ids:
        self.db.mark_pushed(lid, PushStatus.ERROR)
    errors += batch_len
```
→ Celý batch 50 leadů je označen jako ERROR.

**Aktuálně to není problém** (protože scraper žádné fotky neposílá), ale jakmile se selektory opraví, může to selhat.

---

## Plán oprav

### Krok 1: Ověření aktuálních HTML struktur [RESEARCH]

Navštívit v browseru:
1. https://www.sauto.cz — detail stránku libovolného inzerátu
2. https://auto.bazos.cz — detail stránku
3. https://www.sbazar.cz — detail stránku

Zjistit aktuální CSS class names pro:
- Popis/description blok
- Fotogalerie (img src vzory)
- Výbava/equipment seznam

**Výstup:** Aktuální selektory pro všechny 3 zdroje.

### Krok 2: Oprava Sauto selektorů [IMPL — lead_scout]

**Soubor:** `lead_scout/scrapers/sauto.py` metoda `_fetch_detail` (ř. 362-394)

1. Aktualizovat CSS selektory pro popis
2. Aktualizovat filtr pro fotky (CDN URL vzor)
3. Aktualizovat CSS selektory pro výbavu
4. Přidat fallback selektory (robustnější proti budoucím změnám)

**Odhad:** ~30 řádků změn

### Krok 3: Oprava Bazoš selektorů + přidání výbavy [IMPL — lead_scout]

**Soubor:** `lead_scout/scrapers/bazos.py`

1. Zrobustnit selektory pro popis a fotky
2. **PŘIDAT extrakci výbavy** z detail stránky — nové selektory pro equipment list
3. Přidat `vehicle_equipment` do návratové hodnoty `_fetch_detail`
4. Přidat equipment do `_parse_ad` (payload construction)

**Odhad:** ~40 řádků změn

### Krok 4: Přidání enrichment do Sbazar [IMPL — lead_scout]

**Soubor:** `lead_scout/scrapers/sbazar.py`

1. Přejmenovat `_fetch_phone` → `_fetch_detail` (nebo rozšířit)
2. Přidat extrakci popisu
3. Přidat extrakci fotek
4. Přidat extrakci výbavy
5. Upravit volání v `scrape()` — přiřadit nová pole

**Odhad:** ~60 řádků změn

### Krok 5: Relaxovat Zod URL validaci pro fotky [IMPL — Carmakler]

**Soubor:** `lib/validators/scout-lead.ts:84`

```typescript
// PŘED:
vehiclePhotos: z.array(z.string().url()).optional().nullable(),

// PO:
vehiclePhotos: z.array(z.string().min(1)).optional().nullable(),
```

URL validace je zbytečně přísná — scraperům důvěřujeme a fotky jsou pouze informativní. Alternativně `z.string().startsWith("http")`.

**Odhad:** 1 řádek

### Krok 6: Testování [QA]

1. Spustit scraper lokálně pro 1 stránku Sauto/Bazoš/Sbazar
2. Ověřit, že SQLite obsahuje enrichment data
3. Ověřit, že push do API projde (status 201)
4. Ověřit, že produkční DB má fotky/popis/výbavu

---

## Soubory k úpravě

| Soubor | Projekt | Typ změny | Rozsah |
|--------|---------|-----------|--------|
| `lead_scout/scrapers/sauto.py` | lead-scout | UPDATE selektory | ~30 řádků |
| `lead_scout/scrapers/bazos.py` | lead-scout | UPDATE + NEW (výbava) | ~40 řádků |
| `lead_scout/scrapers/sbazar.py` | lead-scout | NEW (enrichment) | ~60 řádků |
| `lib/validators/scout-lead.ts` | carmakler | UPDATE (relax URL) | 1 řádek |

**Celkem:** ~130 řádků změn

---

## STOP pravidla

- **STOP-1:** Sauto má anti-bot ochranu → selektory nefungují ani po aktualizaci → eskalovat, zvážit jiný přístup (API?)
- **STOP-2:** Bazoš rate-limituje agresivně → snížit concurrency, zvýšit delay
- **STOP-3:** Zod batch validace stále padá po opravě → implementovat per-lead validaci (try-catch kolem každého leadu v ingest)

---

## Závislosti

- Krok 1 (research) MUSÍ proběhnout PŘED Krok 2-4
- Krok 5 (Zod relax) je NEZÁVISLÝ — může jít paralelně
- Krok 6 (QA) vyžaduje dokončení Kroků 2-5

---

## Poznámky

- **Bazoš 3/43 enrichment potvrzuje funkční pipeline** — oprava selektorů by měla zvýšit coverage
- **`inventory_trend` pole** je v Zod jako enum ["UP","DOWN","STABLE"] — nemělo by ovlivnit SOUKROMNIK leady
- **Sauto Playwright scraping** — pokud je problém anti-bot (cloudflare), bude potřeba jiný přístup pro selektory. Ale 42 leadů v DB znamená, že listing pages fungují — problém je specificky na detail pages.

---

## ZADÁNÍ OD UŽIVATELE (doslovné)

1. **"musí to bejt stejne"** — KAŽDÝ lead musí vypadat jako ten VW Passat: hero s fotkou, fotogalerie, popis prodejce, výbava, cenový graf, podobné nabídky
2. **"ale i fotky atd"** — nestačí gradient na hero, musí být reálné fotky z inzerátu
3. **"a každy je jiny, nečteš tam tu vybavu atd"** — scrapery musí číst i detail stránky, ne jen listing karty
4. **"musi se to upravit a stahnout znovu"** — po opravě scraperů spustit re-enrichment pro existující leady
5. **MIN_PRICE změněn z 250k na 200k** — hotovo, nasazeno
6. **99 leadů pod 200k smazáno** — hotovo

---

## CO JE HOTOVÉ (session 2026-05-20)

- [x] Market analysis: AS24 model filtering, single CZ fetch, correct URLs
- [x] Market analysis: IQR outlier filtering (žádné rozsahy 63k–6.3M)
- [x] Market analysis: snížen threshold z 5 na 3, širší rok pro starší auta
- [x] Chart labely: Tržní medián, Průměr, Cenové pásmo
- [x] Hero banner redesign (tmavý s fotkou, spec chips, contact buttons)
- [x] Hero gradient pro leady bez fotek
- [x] MIN_PRICE 250k → 200k (lead-scout config.py + deploy)
- [x] Smazáno 99 leadů pod 200k z DB
- [x] Deploy na produkci (carmakler + lead-scout)

## CO ZBÝVÁ (příští session)

### KROK 1: Research aktuálních HTML (NUTNÉ PRVNÍ)
- [ ] Otevřít Sauto detail stránku v browseru, zjistit CSS class names pro: galerii, popis, výbavu/parametry
- [ ] Otevřít Bazoš detail stránku, zjistit selektory pro: fotky (`img.obrazekDetail`?), popis (`div.popisdetail`?), výbavu
- [ ] Otevřít Sbazar detail stránku, zjistit selektory pro: fotky, popis, výbavu
- **Jak:** použít DevTools → Elements, nebo `test-chrome` agent s Playwright `page.content()` dump

### KROK 2: Fix Sauto scraper
- **Soubor:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/sauto.py`
- **Metoda:** `_fetch_detail` řádky 362-394
- [ ] Opravit selektory pro popis (aktuální CSS class?)
- [ ] Opravit filtr fotek (aktuální CDN URL vzor? ne jen `"sauto" in src`)
- [ ] Opravit selektory pro výbavu (aktuální HTML struktura?)
- [ ] Přidat fallback selektory

### KROK 3: Fix Bazoš scraper  
- **Soubor:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/bazos.py`
- **Metoda:** `_fetch_detail` řádky 341-408
- [ ] Zrobustnit popis selektory (proč jen 7% matchuje?)
- [ ] Zrobustnit foto selektory
- [ ] **PŘIDAT extrakci výbavy** — aktuálně VŮBEC NEEXISTUJE
- [ ] Přidat `vehicle_equipment` do payload construction v `_parse_ad`

### KROK 4: Přidat enrichment do Sbazar
- **Soubor:** `/Users/zen/Projects/lead-scout/lead_scout/scrapers/sbazar.py`
- **Metoda:** `_fetch_phone` řádky 206-255 (rozšířit nebo přejmenovat na `_fetch_detail`)
- [ ] Přidat extrakci fotek z galerie
- [ ] Přidat extrakci popisu
- [ ] Přidat extrakci výbavy
- [ ] Upravit `scrape()` metodu — přiřadit nová pole do leadu

### KROK 5: Zod validátor fix
- **Soubor:** `/Users/zen/Projects/cmklv2/cmklv2/lib/validators/scout-lead.ts` řádek 84
- [ ] Změnit `z.array(z.string().url())` → `z.array(z.string().min(1))` pro vehiclePhotos
- **Důvod:** některé fotky nemají plný URL prefix, přísná validace může zablokovat celý batch 50 leadů

### KROK 6: Deploy + Re-enrichment
- [ ] Deploy opravených scraperů na produkci (SCP → `/var/www/lead-scout/`)
- [ ] Deploy Zod fix na produkci (git push → ssh server build)
- [ ] Spustit re-enrichment script — projít existující leady s `sourceUrl`, znovu navštívit detail, doplnit data
- [ ] Ověřit v DB: fotky, popis, výbava pro Sauto + Bazoš + Sbazar leady

### KROK 7: Ověření na produkci
- [ ] Otevřít libovolný lead v admin detailu
- [ ] Ověřit: hero má fotku na pozadí, fotogalerie, popis prodejce, výbava, cenový graf
- [ ] Porovnat s VW Passat referencí — musí vypadat STEJNĚ

---

## PRODUKČNÍ PŘÍSTUPY

- **Server:** `ssh server` (alias → 91.98.203.239)
- **Carmakler:** `/var/www/carmakler/` — PM2 id 6
- **Lead-scout:** `/var/www/lead-scout/` — PM2 id 7 (scheduler), id 8 (batch)
- **DB:** `PGPASSWORD=lNMDag5zHkyMIQ5mCBUXCP1o psql -h localhost -U carmakler -d carmakler`
- **Deploy carmakler:** `git push origin main && ssh server "cd /var/www/carmakler && git pull && npx prisma generate && npm run build && pm2 reload carmakler"`
- **Deploy lead-scout:** `scp soubor server:/var/www/lead-scout/... && ssh server "pm2 reload lead-scout-scheduler && pm2 reload lead-scout-batch"`
