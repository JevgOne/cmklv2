# Research: Kompletni prehled VIN API databazi

**Datum:** 2026-04-26
**Status:** HOTOVO
**Ucel:** Zmapovat vsechny dostupne VIN API pro Carmakler platformu

---

## Aktualni stav v projektu

Carmakler aktualne pouziva:
1. **vindecoder.eu** (primary) — `lib/vin-decoder.ts:48-73`
2. **NHTSA vPIC** (fallback) — `lib/vin-decoder.ts:134-155`

---

## 1. FREE APIs

### 1.1 NHTSA vPIC API (uz pouzivame jako fallback)
- **URL:** https://vpic.nhtsa.dot.gov/api/
- **Cena:** ZDARMA, bez limitu, bez API klice
- **Pokryti:** US-focused (auta prodavana v USA)
- **Data:** Make, Model, Year, Body type, Engine, Transmission, Drive type, Fuel type, Doors, Seats, Plant, Displacement, kW
- **Omezeni:** Slaba data pro EU vozy (neznama vybava, casto chybi parametry pro importy z EU)
- **Hodnoceni:** Dobry fallback, ale pro CZ/EU trh nedostatecny jako primary

### 1.2 Corgi by Cardog (open-source, offline)
- **URL:** https://github.com/cardog-ai/corgi
- **Cena:** ZDARMA, open-source (MIT)
- **Pokryti:** US (NHTSA data, optimalizovana)
- **Data:** Make, Model, Year, Series, Body, Drive, Fuel, Doors, Engine, Cylinders, Displacement, Manufacturer, Country, Plant
- **Vyhody:** Offline, <1ms response, 21MB databaze, zero API calls, zero rate limits
- **Omezeni:** Stejna data jako NHTSA (US-focused), neni vhodne pro EU specificke modely
- **Hodnoceni:** Zajimave pro offline PWA scenare (makler bez signalu), ale stejna data jako NHTSA

### 1.3 CarAPI
- **URL:** https://carapi.app/
- **Cena:** Free tier (omezeny), placene plany
- **Pokryti:** US primarne, vozy od 1990+
- **Data:** VIN decode, Make/Model/Year, specifikace
- **Hodnoceni:** Mene relevantni pro EU trh

### 1.4 OpenVehicleDB / open-vehicle-db
- **URL:** https://github.com/plowman/open-vehicle-db
- **Cena:** ZDARMA, open-source
- **Pokryti:** Global (makes/models/years)
- **Data:** Zakladni make/model/year/style — NEMA VIN decode
- **Hodnoceni:** Pouze pro doplnkove udaje, neni VIN decoder

### 1.5 EUCARIS (EU governmental)
- **URL:** https://www.eucaris.net/
- **Cena:** N/A — pristupne POUZE vladnim institucim (registracni urady, policie)
- **Pokryti:** 32 EU zemi
- **Data:** Registrace vozu, vlastniky, odcizeni, ridicske prukazy
- **Omezeni:** NENI dostupne pro komercni pouziti
- **Hodnoceni:** Nelze pouzit, jen pro info

---

## 2. FREEMIUM / PLACENE — VIN Decode (specifikace)

### 2.1 vindecoder.eu (aktualne primary)
- **URL:** https://vindecoder.eu/api/
- **Cena:** Free tier 20 VIN lookups; placene plany (cena na vyzadani)
- **Pokryti:** EU + global (primarni zamereni na EU)
- **Data:** Make, Model, Year, Trim, Body, Engine kW, Displacement, Fuel, Transmission, Drive, Doors, Seats + cca 30 dalsich poli
- **Autentizace:** API key + secret, SHA1 hash
- **Rate limit:** Neni verejne specifikovan
- **Hodnoceni:** Solidni pro EU trh, ale omezeny free tier. UZ POUZIVAME.

### 2.2 Vincario (vyssi kvalita nez vindecoder.eu)
- **URL:** https://vincario.com/vin-decoder/
- **Cena:**
  - VIN Decode: €0.22–0.49/request (volume discounts)
  - Market Value: €0.90–1.99/request
  - Stolen Check: €0.90–1.99/request
  - License Plate: ZDARMA
  - Free trial: 20 VIN lookups
- **Pokryti:** Global — 2400+ znacek, 99.31% EU, 98.46% US, 96.59% Asia
- **Data (50+ poli):**
  - Zakladni: Make, Model, Year, Trim, Body, Engine
  - Obohacene: Spotreba, objem nadrze, emise, rozmery (d/s/v), hmotnost, CO2, brzdy, podvozek
- **API:** REST JSON, <1ms, 99.9% uptime, 60 req/min
- **Autentizace:** API key + secret key, SHA1
- **BONUS sluzby:** Market Value API (valuace), Stolen Vehicle Check
- **Hodnoceni:** DOPORUCENO jako upgrade/nahrada za vindecoder.eu. Lepsi pokryti, vic dat, podobna cena, navic valuace + stolen check

### 2.3 Auto-Data.net API
- **URL:** https://api.auto-data.net/
- **Cena:** Pay-per-parameter (kupite jen parametry, ktere potrebujete), cena na vyzadani
- **Pokryti:** Primarni EU, 350+ znacek, 3500+ modelu, 10000+ generaci, 55000+ specifikaci
- **Data:** Extrémne detailni technicke specifikace — motor, podvozek, rozmery, spotreba, emise, brzdeni, zrychleni, objem nadrze, prevody
- **Format:** XML/JSON API
- **Aktualizace:** Denne (tym expertu)
- **Hodnoceni:** Velmi detailni technicke data, dobre pro EU. Vhodne pokud potrebujeme hluboké specifikace

### 2.4 VehicleDatabases
- **URL:** https://vehicledatabases.com/vin-decode-api
- **Cena:** $100–$2500/mesic, $0.05–0.25/credit
- **Pokryti:** US + EU
- **Data:** 200+ atributu, specifikace, trim, classic VINs
- **Hodnoceni:** Siroky rozsah dat, ale draha

### 2.5 DataOne Software
- **URL:** https://www.dataonesoftware.com/web-services-vin-decoder-api
- **Cena:** Enterprise $10,000+/rok
- **Pokryti:** Primarni US
- **Data:** OEM-level presnost, exact trim, build data, installed options
- **Hodnoceni:** Premium, enterprise. Predrazene pro nase ucely, US-focused

### 2.6 MarketCheck
- **URL:** https://www.marketcheck.com/
- **Cena:** Free 500/mesic; $299–$749+/mesic
- **Pokryti:** US primarne
- **Data:** Specifikace + trzni ceny + dealer inventory + inzeráty
- **Hodnoceni:** Zajimave pro trzni data, ale US-focused

### 2.7 Edmunds API
- **URL:** Pouze na zadost (approval required)
- **Cena:** Custom
- **Pokryti:** US
- **Data:** Trim, engine, transmission, features
- **Hodnoceni:** Tezko pristupne, US-only

---

## 3. VEHICLE HISTORY APIs (historie vozu)

### 3.1 CEBIA — KOMPLETNI SCOPE

CEBIA je #1 v CR pro overovani vozu. Nabizi MNOHEM vic nez jen VIN decode.

**B2B Portal:** https://www.cebianet.cz/

#### CEBIA Sluzby — kompletni seznam:

| Sluzba | Co dela | Typ dat |
|--------|---------|---------|
| **VINonline** | VIN decode + technicke parametry | Make, Model, Engine, Dimensions, Weight, CO2, Fuel, Registration date, Manufacturing date |
| **AUTOTRACER** | Kompletni historie vozu | Tachometr, nehody, pocet vlastniku, zeme puvodu, foto |
| **ROKVY** | Overeni roku vyroby | Skutecny rok a mesic vyroby |
| **PROVIN** | Overeni puvodu importu | Import z jake zeme, historie pred importem |
| **VINTEST** | Fyzicka kontrola identifikatoru | Originalita VIN, motoru, bezp. pasu, skel, lak — kategorie A/B/b/C/c |
| **CHECKLEASE** | Overeni financni zateze | Leasing, uver, exekuce na vozidle |
| **CebiCAT GT** | Automaticka identifikace + valuace | Odhad trzni ceny vozu |
| **CebiGLASS GT** | Cena vymeny skla | Kalkulace nakladu na vymenu skla |
| **ICARIS EXPERT** | Systemove overeni identifikatoru | Databaze skrytych/viditelnych identifikatoru |
| **VINFOTO** | Dokumentace vozu pro pojistovny | Fotograficka dokumentace stavu vozu |
| **Insolvencni rejstrik** | Kontrola insolvence | Overeni osoby/firmy v insolvencnim rejstriku |
| **Exekucni rejstrik** | Kontrola exekuci | Overeni osoby/firmy v exekucnim rejstriku |
| **OCIS** | Bezpecnostni oznaceni skel | Gravírovani/leptani VIN do skel |
| **Cebia SAT** | Satelitni zabezpeceni | GPS sledovani + zabezpeceni vozu |

#### CEBIA — VINonline (VIN Decode B2B):
- **Integrace:** Web API + batch processing
- **Data:** Brand, Model, Type, Category, Engine (kW, ccm, fuel), Dimensions, Weight, Transmission, Speed, Body, CO2, EURO norma, spotreba, EV info, datum 1. registrace, datum vyroby, odcizeni, financni zatez, tachometr
- **Watchdog:** Notifikace pri zmene vlastnika, odhlaseni, nove inzerci, nehode
- **Cílová skupina:** Pojistovny, leasing, fleety, bazary, dealeri, portaly
- **Cena:** Na vyzadani (B2B kontakt pres cebianet.cz)

#### CEBIA — AUTOTRACER (Vehicle History):
- **Data:** Kompletni historie vozu (32+ zemi):
  - Overeni tachometru (nacteni z STK + servisni zaznamy)
  - Skody a nehody
  - Pocet vlastniku
  - Zeme puvodu
  - Foto dokumentace
  - Odcizeni
  - Financni zatez
- **Cena:** Jednotlive: cca 599 Kc/report, B2B: na vyzadani

**Hodnoceni CEBIA:** KLICOVY partner pro CR trh. Kombinace VINonline (technicke specs) + AUTOTRACER (historie) + CHECKLEASE (financni) + CebiCAT (valuace) pokryva VSE, co Carmakler potrebuje. B2B integrace pres API. NUTNO kontaktovat pro B2B podminky.

### 3.2 CarVertical
- **URL:** https://www.carvertical.com/en/business/api
- **Cena:** $24.99/report (slevy pri objemu: 2 reporty = $16/ks)
- **Pokryti:** EU + US (1000+ mezinarodnich databazi)
- **Data:** Nehody, tachometr, odcizeni, vlastnici, pojistne udalosti, servis
- **B2B API:** Ano — tailored API, PDF export, web widget
- **Blockchain:** Overeni integrity dat pres blockchain
- **Hodnoceni:** Silna alternativa k CEBIA pro mezinarodni pokryti. Drazsi per-report.

### 3.3 AutoDNA
- **URL:** https://www.autodna.com/
- **Cena:** €24.99/report (3-pack: €16.66/ks)
- **Pokryti:** 26+ EU zemi + US + Kanada (50,000+ automotive service providers)
- **Data:** Nehody, tachometr, odcizeni, vlastnici, servisni akce, skody
- **B2B API:** Neni verejne dokumentovano
- **Hodnoceni:** Dobra alternativa, silna v EU. Ale chybi verejne B2B API.

### 3.4 VinAudit
- **URL:** https://www.vinaudit.com/vehicle-data-api
- **Cena:** Pay-per-request (credits)
- **Pokryti:** US primarne (NMVTIS data)
- **Data:** Specs, title records, accidents, auction data, NMVTIS
- **Hodnoceni:** US-focused, mene relevantni pro CZ/EU

### 3.5 ClearVIN
- **URL:** clearvin.com
- **Cena:** Pay-per-request
- **Pokryti:** US
- **Data:** Specs, history, NMVTIS, accidents, auctions
- **Hodnoceni:** US-only

---

## 4. SPECIALTY APIs

### 4.1 TecDoc / TecAlliance (AUTODILY)
- **URL:** https://www.tecalliance.net/tecdoc-catalogue/
- **Cena:** Subscription (1000+ firem je napojeno)
- **Pokryti:** Global, 1000+ znacek autodilu
- **Data:** Katalog nahradnich dilu, OEM cisla, kompatibilita, tech specifikace, ceny dilu
- **VIN Lookup:** ANO — VIN/VRM → TecDoc TypeId → kompatibilni dily
- **Hodnoceni:** KRITICKE pro eshop autodilu v Carmakler! Umoznuje: VIN → vyhledat vsechny kompatibilni dily. Nutno integrovat pro eshop dilů.

### 4.2 JATO Dynamics (OEM data + valuace)
- **URL:** https://developer.jato.com/
- **Cena:** Custom enterprise
- **Pokryti:** UK, ES, IT, FR, IE + North America (rozsirovani na 22 EU trhu pres autobiz partnership)
- **Data:** 1000+ datovych bodu/vozidlo:
  - Kompletni specifikace
  - Standard + optional vybava
  - Barvy, ceny, balicky
  - WLTP data
  - VIN/REG → kompletni profil vozidla "as built"
  - Trzni analyzy + incentive data
- **Hodnoceni:** Premium enterprise. Nejdetailnejsi data (vybava, barvy, ceny). Ale CZ pokryti zatim omezene (partnership s autobiz ho rozsiruji).

### 4.3 Autodata Group (servisni data)
- **URL:** https://developer.autodata-group.com/
- **Cena:** Subscription — cca $89/mesic (full pack)
- **Pokryti:** Global, 34,000+ modelu, 142 vyrobcu
- **Data:**
  - 826,000+ technickych opravnych postupu
  - 600,000+ step-by-step repair procedures
  - 360,000+ wiring diagrams
  - Servisni intervaly (OEM)
  - Diagnostic Trouble Codes (DTC)
  - Labour estimates
- **Hodnoceni:** UZITECNE pro servisni knihu / maintenance planning. Ne primo VIN decode, ale doplnkova data.

---

## 5. DOPORUCENI PRO CARMAKLER

### Priorita 1 — Okamzite (MVP/aktualne)
| API | Ucel | Akce |
|-----|------|------|
| **vindecoder.eu** | VIN decode (specs) | UZ POUZIVAME — ponechat |
| **NHTSA vPIC** | Fallback | UZ POUZIVAME — ponechat |

### Priorita 2 — Krátkodobe (Q2-Q3 2026)
| API | Ucel | Akce |
|-----|------|------|
| **CEBIA VINonline** | VIN decode pro CZ vozy | KONTAKTOVAT pro B2B API podminky |
| **CEBIA AUTOTRACER** | Historie vozu | KONTAKTOVAT — klicove pro "proverka auta" feature |
| **CEBIA CHECKLEASE** | Financni zatez | KONTAKTOVAT — nutne pro bezpecny prodej |
| **CEBIA CebiCAT** | Valuace vozu | KONTAKTOVAT — pro AI Price Valuation |
| **Vincario** | Upgrade VIN decode + stolen check + valuace | ZVAZIT jako nahrada/doplnek vindecoder.eu (lepsi pokryti, vic dat) |

### Priorita 3 — Strednedobé (eshop dilu)
| API | Ucel | Akce |
|-----|------|------|
| **TecDoc/TecAlliance** | VIN → kompatibilni dily | INTEGRACE pro eshop autodilu |

### Priorita 4 — Dlouhodobo / Nice-to-have
| API | Ucel | Akce |
|-----|------|------|
| **CarVertical** | Mezinarodni historie vozu | Alternativa k CEBIA pro non-CZ vozy |
| **JATO Dynamics** | Premium OEM vybava data | Pokud potrebujeme "as built" equipment |
| **Auto-Data.net** | Detailni tech specs | Pokud vindecoder.eu/Vincario nestaci |
| **Corgi (Cardog)** | Offline VIN decode v PWA | Pro makler bez signalu |
| **Autodata** | Servisni data | Pro servisni knihu feature |

### Celkovy architekturni navrh

```
VIN Input
    |
    v
[1] vindecoder.eu (primary) — specs
    |— fallback → NHTSA vPIC (free)
    |— upgrade → Vincario (lepsi pokryti + valuace)
    |
[2] CEBIA VINonline — CZ-specificke tech params
    |
[3] CEBIA AUTOTRACER — historie vozu
    |— alt → CarVertical (non-CZ)
    |
[4] CEBIA CHECKLEASE — financni zatez
    |
[5] CEBIA CebiCAT — trzni valuace
    |— alt → Vincario Market Value
    |
[6] TecDoc — VIN → kompatibilni dily (eshop)
```

---

## Zdroje

- https://vpic.nhtsa.dot.gov/api/
- https://vindecoder.eu/api/
- https://vincario.com/vin-decoder/
- https://www.cebia.cz/en/
- https://www.cebianet.cz/pub/web/cs/Sluzby
- https://www.carvertical.com/en/business/api
- https://www.autodna.com/
- https://www.tecalliance.net/tecdoc-catalogue/
- https://developer.jato.com/
- https://developer.autodata-group.com/
- https://api.auto-data.net/
- https://github.com/cardog-ai/corgi
- https://vehicledatabases.com/vin-decode-api
- https://www.dataonesoftware.com/web-services-vin-decoder-api
