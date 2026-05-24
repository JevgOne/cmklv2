# Plan: STK stanice + Autoservisy — Zdroje dat, Scraping strategie, SEO expanze

**Datum:** 2026-05-23
**Status:** PLAN READY
**Typ:** Research + Implementation Plan
**Závažnost:** MEDIUM — SEO content play + local search dominance

---

## 0. Aktuální stav (co už existuje)

### Prisma model: `AutoServis` (schema.prisma:2774-2865)
- Slouží pro STK i autoservisy (rozlišeno `categories: ["stk-emise"]`)
- STK-specifická pole: `stkLines`, `stkWaitDays`, `stkOnlineBooking`, `stkEmissions`, `stkMotorcycles`, `stkTrailers`, `stkHeavy`
- Oficiální MDČR ID: `officialStationId`
- Hodnocení: `averageRating`, `reviewCount`, `recommendRate`
- GPS: `latitude`, `longitude`
- Relace: `ServisReview` model s STK-specifickým hodnocením (`ratingWaitTime`, `ratingFairness`, `passedInspection`)

### Existující stránky
| URL | Soubor | Stav |
|-----|--------|------|
| `/stk` | `app/(web)/stk/page.tsx` | Funguje (MapListView + ceníková tabulka + kalkulátor) |
| `/stk/[slug]` | `app/(web)/stk/[slug]/page.tsx` | Funguje (detail + JSON-LD AutoRepair + Breadcrumbs + recenze) |
| `/stk/mesto/[city]` | `app/(web)/stk/mesto/[city]/page.tsx` | Funguje, **CHYBÍ pageCanonical** |
| `/autoservisy` | `app/(web)/autoservisy/page.tsx` | Funguje (MapListView + filtry + FAQ JSON-LD) |
| `/autoservisy/[slug]` | `app/(web)/autoservisy/[slug]/page.tsx` | Funguje (detail + JSON-LD AutoRepair + Breadcrumbs) |
| Admin panel | `app/(admin)/admin/autoservisy/page.tsx` | Funguje |
| API CRUD | `app/api/autoservisy/route.ts` | GET (filtrování) + POST (přidání) |
| API Reviews | `app/api/autoservisy/[id]/reviews/route.ts` | Funguje |

### Existující data
- Seed: 45 STK stanic (`prisma/seed-stk-stations.ts`)
- Research: 400+ STK stanic identifikováno (`research-stk-stations-complete.md`)
- GPS: Většina stanic BEZ souřadnic (nutný geocoding)

### Co CHYBÍ
1. **Regionální stránky**: `/stk/[kraj]`, `/autoservisy/[kraj]`, `/autoservisy/mesto/[city]`
2. **Autoservisy data**: Zatím jen STK stanice, žádná data pro normální autoservisy
3. **Geocoding pipeline**: GPS souřadnice pro 400+ stanic
4. **Data enrichment**: Otevírací doby, popisy, certifikace
5. **GovernmentService schema.org**: STK detailky používají `AutoRepair` místo vhodnějšího `GovernmentService`

---

## 1. Zdroje dat

### 1.1 STK stanice (cca 400 v ČR)

| Zdroj | URL | Data | Přístup | Kvalita | Legální |
|-------|-----|------|---------|---------|---------|
| **MDČR registr** | stkstanice.cz/stk.json | Kompletní seznam, kódy, adresy | JSON download | Autoritativní | Veřejná data |
| **pkstk.cz** | pkstk.cz | 111 členů sdružení, kontakty | Web scraping | Dobrá | Veřejné info |
| **stanice-technicke-kontroly.cz** | stanice-technicke-kontroly.cz | Per-region listings, telefony | Web scraping | Dobrá | Veřejné info |
| **kupnisila.cz** | kupnisila.cz | Agregovaný seznam | Web scraping | Střední | Veřejné info |
| **ARES (MF ČR)** | wwwinfo.mfcr.cz/ares | IČO, obchodní název, sídlo | REST API (zdarma) | Autoritativní | Otevřená data |
| **Google Places API** | Google Cloud | GPS, hodnocení, otevírací doby, fotky | API (placené) | Vynikající | Licencované |

**Strategie pro STK:**
1. **Primární zdroj**: `stkstanice.cz/stk.json` — JSON se všemi stanicemi + kódy MDČR
2. **Enrichment**: ARES API → IČO, právní forma, sídlo
3. **Geocoding**: Google Geocoding API → GPS z adres (cca 400 requestů = $2)
4. **Enrichment 2**: Google Places API → hodnocení, otevírací doby, fotky (cca $20 jednorázově)
5. **Verify**: Křížová kontrola s pkstk.cz a stanice-technicke-kontroly.cz

### 1.2 Autoservisy (cca 8 000–15 000 v ČR)

| Zdroj | URL | Data | Přístup | Kvalita | Legální |
|-------|-----|------|---------|---------|---------|
| **ARES** | wwwinfo.mfcr.cz/ares | IČO subjektů s NACE 45.20 (autoopravárenství) | REST API | Kompletní pro registrované | Otevřená data |
| **Firmy.cz (Seznam)** | firmy.cz/autoservisy | Název, adresa, telefon, web, popis, hodnocení | Web scraping | Dobrá | ToS omezují scraping |
| **Google Places API** | Google Cloud | Kompletní data | API (placené) | Vynikající | Licencované, $17/1000 req |
| **Mapy.cz API** | api.mapy.cz | Firmy, POI, recenze | REST API (freemium) | Dobrá pro ČR | API podmínky OK |
| **Zlaté stránky** | zlatestranky.cz | Starší data, kontakty | Web scraping | Zastaralá | ToS omezují |
| **Data.gov.cz** | data.gov.cz | Některé živnostenské registry | Open data | Omezená pro servisy | Otevřená data |

**Strategie pro autoservisy:**
1. **Primární zdroj**: ARES API → všechny subjekty s NACE kódem 45.20 (údržba a opravy motorových vozidel)
2. **Enrichment**: Google Places Nearby Search → GPS, hodnocení, otevírací doby
3. **Alternativa**: Mapy.cz API (Suggest/Geocode endpoints) — zdarma do 100k req/den
4. **Cross-reference**: Porovnat s Firmy.cz pro validaci (jen čtení, NE scraping)
5. **User-generated**: Umožnit uživatelům přidávat servisy + nechat servisy claimnout profil

### 1.3 Odhadovaný rozpočet

| Položka | Cena | Jednorázově/Měsíčně |
|---------|------|---------------------|
| Google Geocoding (400 STK) | ~$2 | Jednorázově |
| Google Places (400 STK enrichment) | ~$20 | Jednorázově |
| Google Places (8000 autoservisů) | ~$400 | Jednorázově |
| Mapy.cz API (alternativa) | Zdarma | — |
| ARES API | Zdarma | — |
| **Doporučení** | **$22 (STK) + $0–400 (servisy)** | — |

**Doporučení**: Začít s ARES + Mapy.cz (zdarma), Google Places jen pro top 500 servisů a STK stanice.

---

## 2. Datový model — rozšíření

### 2.1 Existující model je dostatečný

`AutoServis` model v `schema.prisma:2774-2865` **nepotřebuje strukturální změny**. Všechna potřebná pole existují:
- Základní info (name, description, ico, slug)
- Adresa (address, city, region, zip, latitude, longitude)
- Kontakt (phone, email, web)
- Kategorie, certifikace, značky (String arrays)
- STK-specifická pole
- Hodnocení (averageRating, reviewCount, recommendRate)
- Flags (isVerified, isClaimed, isPublished, isFeatured)
- Zdroj (source, officialStationId, lastVerifiedAt)

### 2.2 Doporučená drobná rozšíření

```prisma
// Přidat do AutoServis modelu:
googlePlaceId   String?   @unique  // Google Places ID pro enrichment
aresSubjectId   String?            // ARES IČO reference  
naceCode        String?            // NACE klasifikace (45.20 = autoopravárenství)
yearsInBusiness Int?               // Roky na trhu (z ARES)
employeeCount   String?            // "1-10", "11-50", "51-200"
parkingAvailable Boolean @default(false)  // Parkování u servisu
wheelchairAccessible Boolean @default(false)  // Bezbariérový
```

### 2.3 Index pro region queries

```prisma
@@index([region, city])     // Pro /autoservisy/[kraj]/[mesto]
@@index([categories])       // Pro kategorie filtry
@@index([source])           // Pro import tracking
```

---

## 3. Scraping/Import strategie

### 3.1 Fáze 1: STK stanice (400 stanic) — 1-2 dny

```
Krok 1: JSON import
├── Stáhni stkstanice.cz/stk.json
├── Parse → AutoServis record
├── categories: ["stk-emise"]
├── officialStationId: kód MDČR (31.00, 32.01, ...)
└── source: "MDCR_IMPORT"

Krok 2: ARES enrichment (per IČO)
├── Pro každou stanici → ARES API query
├── Doplň: právní forma, sídlo, datum vzniku
└── Rate limit: 1 req/s (ARES limit)

Krok 3: Geocoding
├── Google Geocoding API (nebo Mapy.cz)
├── Adresa → latitude, longitude
└── Batch: 400 requestů = $2

Krok 4: Places enrichment
├── Google Places Nearby Search per GPS
├── Match s existujícím záznamem
├── Doplň: rating, review count, opening hours, photos
└── Budget: ~$20
```

**Script**: `scripts/import-stk-stations.ts`

### 3.2 Fáze 2: Autoservisy (8000+ servisů) — 3-5 dní

```
Krok 1: ARES bulk query
├── NACE 45.20 (údržba a opravy MV)
├── NACE 45.40 (prodej, údržba motocyklů)
├── Per-kraj queries → kompletní seznam
└── Estimated: 8000-15000 subjektů

Krok 2: Deduplikace a filtr
├── Odstraň duplicity (stejné IČO)
├── Odstraň neaktivní (ARES flag)
├── Odstraň autoobchody bez servisní činnosti
└── Expected: ~8000 relevantních servisů

Krok 3: Mapy.cz enrichment
├── Search API: "autoservis" per město
├── GPS, telefon, web
├── Zdarma (100k req/den limit)
└── Match s ARES záznamy

Krok 4: Category classification
├── Z popisu/názvu → automatická klasifikace
├── "karosárna" → categories: ["karosarna"]
├── "pneuservis" → categories: ["pneuservis"]
├── AI klasifikace pro nejednoznačné (Claude API batch)
└── Default: categories: ["mechanika"]
```

**Script**: `scripts/import-autoservisy.ts`

### 3.3 Fáze 3: Ongoing maintenance — continuous

```
Cron job (měsíční):
├── Re-check ARES pro nové/zaniklé subjekty
├── Re-fetch Google Places ratings
├── Geocode nově přidané user-submitted servisy
└── Script: scripts/update-autoservisy-ratings.ts
```

---

## 4. URL struktura pro maximální SEO

### 4.1 STK stanice

```
/stk                              → Hlavní listing (✅ existuje)
/stk/[slug]                       → Detail STK stanice (✅ existuje)
/stk/mesto/[city]                  → STK ve městě (✅ existuje, CHYBÍ canonical)
/stk/[kraj]                       → STK v kraji (🆕 NOVÉ — vytvořit)
```

### 4.2 Autoservisy

```
/autoservisy                      → Hlavní listing (✅ existuje)
/autoservisy/[slug]               → Detail servisu (✅ existuje)
/autoservisy/mesto/[city]         → Servisy ve městě (🆕 NOVÉ)
/autoservisy/[kraj]               → Servisy v kraji (🆕 NOVÉ)
/autoservisy/kategorie/[category] → Servisy dle typu (🆕 NOVÉ)
```

### 4.3 SEO cílení pro lokální fráze

**Klíčové fráze (cílový objem):**

| Fráze | Měsíční hledanost (odhad) | Cílová stránka |
|-------|--------------------------|----------------|
| "STK Praha" | 5 000+ | `/stk/mesto/praha` |
| "STK cena" | 3 000+ | `/stk` (ceník) |
| "STK Brno" | 2 000+ | `/stk/mesto/brno` |
| "autoservis Praha recenze" | 4 000+ | `/autoservisy/mesto/praha` |
| "autoservis Brno" | 2 000+ | `/autoservisy/mesto/brno` |
| "karosárna Praha" | 1 000+ | `/autoservisy/kategorie/karosarna` + mesto |
| "pneuservis Praha" | 1 500+ | `/autoservisy/kategorie/pneuservis` + mesto |
| "kolik stojí STK" | 3 000+ | `/stk` (kalkulátor) |
| "STK co potřebuji" | 2 000+ | `/stk` (FAQ) |

---

## 5. Schema.org markup

### 5.1 STK stanice — GovernmentService (zlepšení)

**Aktuální**: `AutoRepair` s `additionalType: "STK"` (funkční, ale lze vylepšit)

**Doporučení**: `AutoRepair` jako primární typ + `GovernmentService` jako `additionalType`

**POZOR**: `GovernmentService` (Thing > Intangible > Service) je určen pro služby *poskytované vládou* (pas, řidičák). STK stanice jsou *soukromé firmy* provádějící *státem regulovanou službu* → `AutoRepair` zůstává primární, `GovernmentService` jako sekundární typ pro kontext. Google deprecated Vehicle rich results (Sept 2025), ale schema pomáhá pro AI/Bing.

```json
{
  "@context": "https://schema.org",
  "@type": ["GovernmentService", "AutoRepair"],
  "name": "STK Praha 10 — Ečka",
  "serviceType": "Vehicle Technical Inspection (STK)",
  "provider": {
    "@type": "GovernmentOrganization",
    "name": "Ministerstvo dopravy ČR"
  },
  "areaServed": {
    "@type": "City",
    "name": "Praha"
  },
  "address": { "@type": "PostalAddress", ... },
  "geo": { "@type": "GeoCoordinates", ... },
  "aggregateRating": { ... },
  "openingHoursSpecification": [ ... ],
  "offers": {
    "@type": "Offer",
    "price": "1200",
    "priceCurrency": "CZK",
    "description": "Technická prohlídka + emise, osobní automobil"
  }
}
```

### 5.2 Autoservisy — AutoRepair (zůstává)

```json
{
  "@context": "https://schema.org",
  "@type": "AutoRepair",
  "name": "Auto Kovář s.r.o.",
  "address": { ... },
  "geo": { ... },
  "telephone": "+420...",
  "openingHoursSpecification": [ ... ],
  "aggregateRating": { ... },
  "review": [ ... ],
  "makesOffer": [
    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Mechanické opravy" } },
    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Pneuservis" } }
  ],
  "areaServed": { "@type": "City", "name": "Praha" },
  "priceRange": "$$"
}
```

### 5.3 Listing stránky — ItemList

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "STK stanice v Praze",
  "numberOfItems": 30,
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "url": "https://carmakler.cz/stk/stk-eckova-praha-10" },
    ...
  ]
}
```

---

## 6. Interní prolinkování

### 6.1 Cross-linking s existujícími sekcemi

| Ze stránky | Na stránku | Kontext |
|------------|------------|---------|
| `/stk/[slug]` | `/autoservisy` | "Hledáte autoservis?" (✅ existuje) |
| `/autoservisy/[slug]` | `/nabidka` | "Hledáte auto?" (✅ existuje) |
| `/nabidka/[slug]` (detail vozu) | `/stk/mesto/[city]` | "STK vyprší za X dní — najděte nejbližší STK" |
| `/nabidka/[slug]` (detail vozu) | `/autoservisy/mesto/[city]` | "Servis v blízkosti" |
| `/dily/[slug]` (detail dílu) | `/autoservisy/kategorie/[cat]` | "Potřebujete montáž? Najděte autoservis" |
| `/profil/[slug]` (profil makléře) | `/autoservisy/mesto/[city]` | "Doporučené servisy v regionu" |
| `/stk` | `/jak-prodat-auto` | "Prodáváte auto? Podívejte se na průvodce" |
| `/autoservisy` | `/stk` | "Potřebujete STK? Najděte stanici" |
| Blog články | `/stk`, `/autoservisy` | Kontextové linky v článcích o údržbě aut |

### 6.2 Footer section

Přidat do footeru:
```
Služby: STK stanice | Autoservisy | Prověrka vozu | Financování | Pojištění
```

---

## 7. Implementační plán

### Fáze A: Data import STK (Priority: HIGH) — 1-2 dny

1. ✅ Research dokončen (400+ stanic identifikováno)
2. Script `scripts/import-stk-stations.ts`:
   - Stáhni JSON z stkstanice.cz
   - Upsert do AutoServis (officialStationId jako unique key)
   - Geocode adresy → GPS
3. Fix: Přidat `pageCanonical` do `/stk/mesto/[city]`
4. Fix: Schema.org GovernmentService pro STK detaily

### Fáze B: Nové landing pages (Priority: MEDIUM) — 2-3 dny

1. `/stk/[kraj]/page.tsx` — STK v kraji (14 stránek)
2. `/autoservisy/mesto/[city]/page.tsx` — kopie STK city page
3. `/autoservisy/[kraj]/page.tsx` — servisy v kraji
4. `/autoservisy/kategorie/[category]/page.tsx` — servisy dle typu (8 kategorií)
5. Aktualizace sitemap.ts pro nové stránky
6. Breadcrumbs + JSON-LD na každé nové stránce

### Fáze C: Import autoservisů (Priority: MEDIUM) — 3-5 dní

1. Script `scripts/import-autoservisy-ares.ts`:
   - ARES bulk query NACE 45.20
   - Parse + deduplicate
   - Kategorize (AI nebo rule-based)
2. Script `scripts/enrich-autoservisy-mapycz.ts`:
   - GPS, kontakty z Mapy.cz
3. Volitelně: Google Places enrichment pro top 500

### Fáze D: Cross-linking + SEO polish (Priority: LOW) — 1-2 dny

1. Přidat kontextové cross-links na detail vozů
2. Přidat linky ve footeru
3. Blog články: "Jak vybrat autoservis", "Průvodce STK"
4. FAQ rozšíření na stávajících stránkách

---

## 8. KPI a měření úspěchu

| KPI | Cíl (3 měsíce) | Cíl (12 měsíců) |
|-----|----------------|-----------------|
| Indexované stránky (STK+servisy) | 500+ | 10 000+ |
| Organický traffic z "STK" frází | 500 visits/měsíc | 5 000/měsíc |
| Organický traffic z "autoservis" frází | 200 visits/měsíc | 3 000/měsíc |
| Recenze na servisech | 50 | 1 000 |
| Claimnuté profily servisů | 10 | 200 |
| Cross-link CTR (servis → nabídka) | 2% | 5% |

---

## 9. Rizika a mitigace

| Riziko | Dopad | Mitigace |
|--------|-------|----------|
| ARES rate limiting | Pomalý import | Batch po 100, 1 req/s, noční job |
| Duplicity v datech | Špatná UX | Deduplikace per IČO + adresa, admin review |
| Staré/neaktuální data | Nedůvěryhodnost | Měsíční re-check, "Poslední ověření: datum" UI |
| Firmy.cz ToS | Právní riziko | NEscrapovat — jen ARES + Google/Mapy.cz |
| Geocoding costs | Budget | Mapy.cz Geocode API (zdarma) jako fallback |
| Low content quality | Špatné SEO | AI generování popisů + user reviews jako UGC |

---

## 10. Shrnutí priorit

| Priorita | Akce | Effort | Impact |
|----------|------|--------|--------|
| P0 | Fix canonical na `/stk/mesto/[city]` | 5 min | Kritický SEO bug |
| P1 | Import 400 STK stanic z JSON | 1 den | 400 nových stránek |
| P1 | Geocoding GPS pro STK | 0.5 dne | Mapa funguje |
| P2 | Nové landing pages (kraj/město/kategorie) | 2-3 dny | 50+ nových SEO stránek |
| P2 | Schema.org GovernmentService pro STK | 0.5 dne | Lepší rich snippets |
| P3 | Import autoservisů z ARES | 3-5 dní | 8000+ nových stránek |
| P3 | Cross-linking s nabídkou/díly | 1 den | Vyšší engagement |
| P4 | Google Places enrichment | 1 den | Hvězdičky, otevírací doby |
