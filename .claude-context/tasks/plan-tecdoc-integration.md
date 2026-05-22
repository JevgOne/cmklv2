# Plan: TecDoc integrace — centralni sluzba pro celou platformu

**Datum:** 2026-04-26 (v3 — kompletni donor car flow + damage zones + vehicle intake)
**Status:** PLAN READY

---

## CAST 1: CEBIA PRICING

### Retail ceny (koncovi zakaznici)

| Produkt | Cena | Poznamka |
|---------|------|----------|
| Zakladni report | 199 Kc | Zakladni info (znacka, model, odcizeni, leasing) |
| Kompletni AUTOTRACER report | 599 Kc | Tachometr, nehody, vlastnici, foto, valuace, odcizeni, financni zatez |
| 2x kompletni report | 749 Kc | = 374.50 Kc/ks |
| 3x kompletni report | 990 Kc | = 330 Kc/ks |
| Sleva 10% | newsletter signup | Na kompletni provereni |
| Sleva 100 Kc | kupon YAUTO | = 559 Kc misto 659 Kc |
| Dalsi provereni | 50% sleva | = cca 329 Kc |
| VINTEST (fyzicka kontrola) | 3,950 Kc | + 400 Kc lak, + 600-1800 Kc mobilni |

### B2B ceny (obchodni partneri)

**CEBIA nezverejnuje B2B cenik.** Ceny na vyzadani pres cebianet.cz.

Odhad: B2B autobazary ~399-499 Kc/report (Sauto.cz ukazuje 399 Kc).

### Nejlevnejsi varianta pro Carmakler

| Ucel | Nejlevnejsi API | Cena | Poznamka |
|------|----------------|------|----------|
| VIN decode (specs) | Vincario | €0.22 (~5.50 Kc)/req | 100x levnejsi nez CEBIA report |
| Vehicle history | CEBIA AUTOTRACER B2B | ~399 Kc/report | Nejlepsi pro CZ trh |
| Valuace | Vincario Market Value | €0.90 (~22 Kc)/req | Alternativa k CebiCAT |
| Parts mapping | TecDoc | 219 EUR/rok flat | Viz nize |

**Doporuceni:** Kontaktovat CEBIA pro B2B podminky. Vincario pro levny VIN decode.

---

## CAST 2: TECDOC RESEARCH

### Co je TecDoc

TecDoc (TecAlliance, Nemecko) = celosvetovy standard pro aftermarket autodily:
- **700+ znacek** dilu, **6.6M produktu**, **190K typu vozidel**
- **9.8M artiklu**, **450M vehicle linkages**
- **1000+ subscribovanych firem**
- Prumyslovy standard v EU aftermarketu

### Jak TecDoc funguje

```
VIN → [KType konverze] → KType ID (napr. 48078 = Octavia III 2.0 TDI)
         |
         v
    [Product Groups] → kategorie (brzdy, motor, karoserie...)
         |
         v
    [Articles] → konkretni dily (TRW GDB1550, Bosch 0986494111...)
         |
         v
    [Article Detail] → OEM cislo, rozmery, specs, obrazky, EAN
         |
         v
    [Vehicle Linkages] → vsechna auta kde dil pasuje
```

### TecDoc pricing

| Varianta | Cena | Hodnoceni |
|----------|------|-----------|
| **TecAlliance primo** | 219 EUR/rok | DOPORUCENO — official, kompletni |
| RapidAPI wrappery | $25-150/mesic | OK pro MVP, drazi pri objemu |
| PartsLink24 | 276 EUR/rok | Drazsi, jen OEM |
| Apify scraper | Per-run | NEDOPORUCUJI — nestabilni |

**Zaver:** TecDoc za 219 EUR/rok (~460 Kc/mesic) = extrémne nizky naklad.

---

## CAST 3: TRI USE CASES

TecDoc se stava **CENTRALNI sluzba** pro celou platformu:

| # | Use Case | Kdo | Kde |
|---|----------|-----|-----|
| 1 | **Donor car → dily do skladu** | Vrakoviste (PWA supplier) | `app/(pwa-parts)/` |
| 2 | **VIN → kompatibilni dily** | Zakaznik (eshop) | `app/(web)/dily/` |
| 3 | **VIN → predvyplnena vybava** | Makler (vehicle intake) | `app/(pwa)/` |

---

## CAST 4: USE CASE 1 — DONOR CAR FLOW (vrakoviste PWA)

Toto je HLAVNI a nejslozitejsi flow. Kompletni logika bez zmatku.

### KROK 1: VIN zdrojoveho vozu

```
+--------------------------------------------------+
| Pridat donor auto                                 |
+--------------------------------------------------+
|                                                    |
| VIN kod: [TMBAG7NE2L0_______]  [Nacist]          |
|                                                    |
| ──────────────────────────────────────────        |
| Rozpoznano:                                        |
| Skoda Octavia III Combi 2.0 TDI 150 PS (2019)    |
| Motor: DFGA, Prevod: DSG7, Palivo: Diesel         |
|                                                    |
| [Ano, souhlasi] [Zadat jiny VIN]                  |
+--------------------------------------------------+
```

**Logika:**
1. Uzivatel zada VIN
2. TecDoc: VIN → KType + specs (znacka, model, rok, motor, palivo, prevod)
3. Zobrazit k potvrzeni
4. Pokud nesouhlasi → manualni vyber znacka/model/rok (fallback)

### KROK 2: Typ vozu / duvod likvidace

```
+--------------------------------------------------+
| Proc se auto rozebira?                            |
+--------------------------------------------------+
|                                                    |
| ( ) Nehoda (bourane auto)                         |
| ( ) Nepojízdne (mechanicka zavada)                |
| ( ) Kompletni rozebirani (auto OK, rozebira se)   |
| ( ) Zatopene (povoden)                             |
| ( ) Pozar                                          |
|                                                    |
|                          [Pokracovat →]            |
+--------------------------------------------------+
```

**Logika podle typu:**

| Typ | Dalsi krok | Specialni chovani |
|-----|-----------|-------------------|
| Nehoda | → KROK 3 (damage zones) | — |
| Nepojízdne | → KROK 4 (vyber dilu, vse dostupne) | Motor/prevod oznacit ⚠️ "Zkontrolujte" |
| Kompletni rozebirani | → KROK 4 (vyber dilu, vse dostupne) | Preskocit damage zones |
| Zatopene | → KROK 3 (damage zones, predvyplnene) | ELEKTRO auto ⚠️, interiér auto 🔶 |
| Pozar | → KROK 3 (damage zones) | Ptej se na oblast pozaru |

### KROK 3: DAMAGE ZONE SELECTOR

Vizualni schema auta (pohled shora + z boku) s klikanimi zonami.

#### 8 zon:

| Zona | Dily v zone | Poznamka |
|------|------------|----------|
| **Predni cast** | Naraznik, svetla, kapota, chladice, predni blatniky, mlhovky, gril | Karoserie predku |
| **Zadni cast** | Naraznik, svetla, viko kufru, zadni blatniky | Karoserie zadku |
| **Levy bok** | Levy predni dvere, levy zadni dvere, levy prah, leve zrcatko | — |
| **Pravy bok** | Pravy predni dvere, pravy zadni dvere, pravy prah, prave zrcatko | — |
| **Strecha** | Strecha, sloupky A/B/C, panoramaticke okno | — |
| **Podvozek** | Napravy, vyfuk, palivova nadrz, ramena, silentbloky | — |
| **Motorovy prostor** | Motor, prevodovka, turbo, alternator, starter, AC kompresor | **ODDELENE od predni karoserie!** Predni naraz ≠ rozbity motor |
| **Interior** | Sedacky, palubovka, airbagy, volant, ridici jednotky | — |

#### 4 stupne poskozeni (ne jen ano/ne):

| Stupen | Ikona | Vyznam | Vliv na dily |
|--------|-------|--------|-------------|
| Neposkozeno | ✅ | Zona OK | Dily zobrazeny normalne |
| Lehke poskozeni | ⚠️ | Kosmeticke (skrabance, promacklinky) | Dily zobrazeny normalne |
| Tezke poskozeni | 🔶 | Strukturalni (deformace) | Dily s varovanim "Zkontrolujte stav" |
| Zniceno | ❌ | Totalni (nepouzitelne) | Dily VYRAZENY (ale vrakoviste muze rucne vratit) |

#### Wireframe:

```
+--------------------------------------------------+
| Oznacte poskozene zony                            |
+--------------------------------------------------+
|                                                    |
|        POHLED SHORA                                |
|     ┌─────────────────┐                            |
|     │   PREDEK  [⚠️▾] │                           |
|     ├──┬─────────┬──┤                              |
|     │L │  STRECHA│R │                              |
|     │E │   [✅▾] │A │                              |
|     │V │         │V │                              |
|     │Y │         │Y │                              |
|     │  │         │  │                              |
|     │[✅▾]      │[❌▾]                             |
|     ├──┴─────────┴──┤                              |
|     │   ZADEK  [✅▾] │                             |
|     └─────────────────┘                            |
|                                                    |
|  DALSI ZONY:                                       |
|  Motorovy prostor: [✅ ▾]                          |
|  Podvozek:         [✅ ▾]                          |
|  Interiér:         [⚠️ ▾]                          |
|                                                    |
|                          [Pokracovat →]            |
+--------------------------------------------------+
```

#### Specialni logika:

1. **Motor ≠ predek:** Predni naraz NEMUSI znamenat rozbity motor. Motorovy prostor je ODDELENA zona.
2. **Airbagy:** Pokud typ = NEHODA → automaticky oznacit airbagy jako "odpalene/nepouzitelne" (bezpecnostni pravidlo)
3. **Zatopene:** Automaticky predvyplnit:
   - Elektro → 🔶 (tezke)
   - Interiér → 🔶 (tezke)
   - Podvozek → ⚠️ (lehke)
4. **Kabelaz a vedeni:** Dily co sahaji pres vic zon (kabelovy svazek, palivove vedeni, brzdove vedeni) → varovani pokud JAKAKOLIV napojena zona je 🔶 nebo ❌
5. **Elektronika po zatopeni:** ECU, BCM, ridici jednotky → VZDY varovani

### KROK 4: AUTOMATICKY FILTR DILU

Na zaklade damage zones system prefiltruje TecDoc parts list:

| Stupen zony | Chovani dilu v zone |
|-------------|-------------------|
| ✅ Neposkozeno | Zobrazeny normalne, checkbox ON |
| ⚠️ Lehke | Zobrazeny normalne, checkbox ON |
| 🔶 Tezke | Zobrazeny s oranzovym varovanim "Zkontrolujte stav!", checkbox OFF |
| ❌ Zniceno | SKRYTE (presunute do sekce "Vyrazene dily"). Vrakoviste muze RUCNE vratit pokud dil prezil |

### KROK 5: VYBER DILU + STAV

Dily seskupene podle TecDoc kategorii:

```
+--------------------------------------------------+
| Dostupne dily (38 z 67)                          |
+--------------------------------------------------+
|                                                    |
| MOTOR A PRISLUSENSTVI                    [✓ Vse]   |
| ☑ Motor komplet (2.0 TDI DFGA)     [A ▾] [📝]    |
| ☑ Turbodmychadlo                    [B ▾] [📝]    |
| ☐ Alternator                                      |
| ☑ Starter                           [A ▾] [📝]    |
| ☐ AC kompresor                                     |
|                                                    |
| PREVODOVKA A POHON                       [✓ Vse]   |
| ☑ Prevodovka DSG7                   [B ▾] [📝]    |
| ☐ Poloos leva                                      |
| ☐ Poloos prava                                     |
|                                                    |
| KAROSERIE                                [✓ Vse]   |
| ☑ Zadni naraznik                    [A ▾]          |
| ☑ Viko kufru / pata                [A ▾]          |
| ☑ Zadni svetlo leve                [A ▾]          |
| ☑ Zadni svetlo prave               [A ▾]          |
|                                                    |
| ⚠️ VYRAZENE DILY (predni naraz)         [Zobrazit] |
| ☐ Predni naraznik (❌ znicena zona)                |
| ☐ Levy svetlomet (❌ znicena zona)                  |
| ...                                                |
|                                                    |
| Vybrano: 18 dilu                                   |
|                          [Pokracovat →]            |
+--------------------------------------------------+
```

**Pro kazdy dil:**

| Pole | Typ | Povinne |
|------|-----|---------|
| ☑ Checkbox | Mam/nemam | ANO |
| Stav | Select: A/B/C | ANO (pokud zaskrtnuto) |
| Poznamka | Text | NE ("drobny skrabanec", "original BMW") |
| Fotka | Upload | NE (zvysuje prodejnost) |

**Stavy:**

| Stav | Popis | Vliv na cenu |
|------|-------|-------------|
| **A** — Jako novy | Bez znamek opotrebeni, plne funkcni | Vyssi cena |
| **B** — Pouzity OK | Bezne opotrebeni, plne funkcni | Stredni cena |
| **C** — Opotrebeny | Funkcni ale s vadou/opotrebenim | Nizsi cena |

**Quick actions:**
- "Vybrat vse v kategorii"
- "Odznacit celou kategorii"
- "Nastavit stav pro celou kategorii" (napr. vse B)

### KROK 6: FOTKY AUTA

```
+--------------------------------------------------+
| Fotky donor auta                                  |
+--------------------------------------------------+
|                                                    |
| POVINNE (celkovy stav vozu):                      |
| [+ Predek] [+ Zadek] [+ Levy bok] [+ Pravy bok] |
|                                                    |
| POSKOZENI (doporucene):                            |
| [+ Foto poskozeni]  [+ Dalsi foto]               |
|                                                    |
| Pozn: Fotky jednotlivych dilu muzete pridat       |
| v dalsim kroku pri nastaveni cen.                 |
|                                                    |
|                          [Pokracovat →]            |
+--------------------------------------------------+
```

4 povinne fotky celeho auta + volitelne fotky poskozeni.
Fotky dilu se pridavaji per-part v dalsim kroku.

### KROK 7: CENA

Per-part pricing screen:

```
+--------------------------------------------------+
| Nastavte ceny (18 dilu)                           |
+--------------------------------------------------+
|                                                    |
| Motor komplet (A)                                  |
| Doporucena cena: 35,000 Kc    [35000] Kc         |
| [ ] Cena dohodou                                   |
| [+ Foto dilu]                                      |
|                                                    |
| Turbodmychadlo (B)                                 |
| Doporucena cena: 8,500 Kc     [8500] Kc          |
| [ ] Cena dohodou                                   |
|                                                    |
| ...                                               |
|                                                    |
| [Hromadne nastavit] — vsem dilum +20% / -20%     |
|                                                    |
|                          [Pokracovat →]            |
+--------------------------------------------------+
```

**Logika doporucene ceny:**
- Pokud mame trzni data (Vincario Market Value, vlastni historicke prodeje) → navrh ceny
- Jinak: prazdne pole, vrakoviste zada rucne
- "Cena dohodou" pro vzacne/unikatni dily

### KROK 8: SOUHRN + PUBLIKACE

```
+--------------------------------------------------+
| Souhrn                                             |
+--------------------------------------------------+
|                                                    |
| Auto: Skoda Octavia III 2.0 TDI (2019)           |
| VIN:  TMBAG7NE2L0123456                           |
| Typ:  Nehoda (predni naraz)                        |
|                                                    |
| Dily k publikaci: 18                               |
| Celkova hodnota skladu: 127,500 Kc               |
|                                                    |
| MOTOR: 4 dily (85,000 Kc)                        |
| KAROSERIE: 6 dilu (22,000 Kc)                     |
| INTERIÉR: 3 dily (9,500 Kc)                      |
| PODVOZEK: 5 dilu (11,000 Kc)                     |
|                                                    |
| [Zpet k uprave]  [Publikovat 18 dilu do eshopu]  |
|                                                    |
| Po publikaci:                                      |
| • Dily budou viditelne v eshopu                    |
| • Zakaznici co hledali tyto dily dostanou         |
|   notifikaci                                       |
+--------------------------------------------------+
```

### EDGE CASES

1. **Auto bez poskozeni** (kompletni rozebirani) → preskocit damage selector (krok 3)
2. **TecDoc nezna dil** → manualni pridani (nazev, kategorie, kompatibilita rucne) — tlacitko "+ Vlastni dil"
3. **Cross-compatibility** → TecDoc resi automaticky (KType linkages = vsechna auta kde dil pasuje)
4. **Stejny dil z vic bouraku** → skladove mnozstvi (ks) — system precte existujici Part se stejnym KType+article a nabidne "Navysit sklad o X ks"
5. **VIN se nenacte** → fallback na manualni vyber znacka/model/rok (jako ted)
6. **Vrakoviste chce vratit dil z "znicene" zony** → tlacitko "Vratit" v sekci "Vyrazene dily", musi zadat duvod

---

## CAST 5: USE CASE 2 — ESHOP (zakaznik VIN → kompatibilni dily)

### Aktualni stav

VIN → vindecoder.eu → brand/model/year → Prisma `compatibleBrands CONTAINS "Skoda"` (nepresne)

### Novy stav s TecDoc

VIN → TecDoc KType → Prisma `tecdocLinkageIds CONTAINS kTypeId` (presne)

### Zmeny

1. **PartsSearch** — pridat VIN input pole vedle brand/model/year selectu
2. **compatible route** — pridat TecDoc KType matching jako primarni, fallback na brand/model
3. **Product detail** — zobrazit "Pasuje na:" seznam z TecDoc linkages

---

## CAST 6: USE CASE 3 — VEHICLE INTAKE (makler VIN → vybava)

### Kontext

Makler nabira auto v terenu (PWA). Zada VIN → system predvyplni technicke udaje.
Aktualne: vindecoder.eu/NHTSA vraci specs (motor, palivo, karoserie...) ale **NE VYBAVU**.

### Co TecDoc/Vincario pridaji

VIN → KType → TecDoc equipment list:
- Seriova vybava (ABS, ESP, klima, ...)
- Prizpusobitelna vybava (navigace, kozene sedacky, panorama, ...)
- Aftermarket/optional (tahne, sportovni podvozek, ...)

### Navrh

**Upravit:** Vehicle intake step (existujici flow v PWA)

```
Po zadani VIN:
1. Dekodovat specs (vindecoder.eu — uz delame)
2. Z TecDoc/Vincario stahnout equipment list
3. Predvyplnit checkboxy vybavY → makler jen potvrdí/upravi
4. Makler muze pridat aftermarket upravy rucne
```

**Wireframe:**

```
+--------------------------------------------------+
| Vybava vozu                                       |
+--------------------------------------------------+
|                                                    |
| SERIOVA (predvyplnena z VIN):                     |
| ☑ ABS  ☑ ESP  ☑ Klima manual  ☑ El. okna         |
| ☑ Centralni zamykani  ☑ Parkovaci senzory zadni   |
|                                                    |
| PRIZPUSOBITELNA:                                   |
| ☑ Navigace  ☐ Kozene sedacky  ☑ LED svetla       |
| ☐ Panoramaticke okno  ☑ Vyhr. sedacky            |
|                                                    |
| AFTERMARKET (pridat rucne):                        |
| [+ Tahne zarizeni]                                 |
| [+ Sportovni podvozek]                             |
| [+ Pridat vlastni...]                              |
|                                                    |
|                          [Potvrdit vybavu →]       |
+--------------------------------------------------+
```

**Soubory k uprave:**
- Existujici vehicle intake step v `app/(pwa)/` — pridat vybava checkboxy
- `lib/tecdoc.ts` — pridat `getEquipmentForKType(kTypeId)` funkci

---

## CAST 7: NAPOVEDA PRO VRAKOVISTE (PWA onboarding/help)

### 7.1 Welcome screen pri prvnim prihlaseni

```
+--------------------------------------------------+
| Vitejte v CarMakler!                              |
+--------------------------------------------------+
|                                                    |
|   🚗 → 📋 → 💰                                    |
|                                                    |
| Jak to funguje:                                    |
|                                                    |
| 1️⃣ ZADEJTE VIN AUTA                               |
|    Naskenujte nebo zadejte VIN kod                 |
|    bouráku / auta k rozebrání                      |
|                                                    |
| 2️⃣ VYBERTE DILY                                    |
|    System vám ukaze vse co jde sundat.             |
|    Zaskrtnete co máte na sklade.                   |
|                                                    |
| 3️⃣ NASTAVTE CENY                                   |
|    Zadejte cenu za kazdy dil.                      |
|    System muze navrhnout cenu.                     |
|                                                    |
| 4️⃣ PRODAVEJTE                                      |
|    Dily jdou rovnou do eshopu.                     |
|    Zakaznici vas najdou automaticky.               |
|                                                    |
| Carmakler si bere provizi az z prodaneho dilu.     |
| Zadne mesicni poplatky, zadne skryte naklady.      |
|                                                    |
|              [Zacit →]                              |
+--------------------------------------------------+
```

**Implementace:**
- Zobrazit pri prvnim prihlaseni (user.hasSeenTour === false)
- Po kliknuti "Zacit" → nastavit hasSeenTour = true
- Dostupne z menu jako "Jak to funguje?"

### 7.2 Help ikona na strance pridavani dilu

- `?` ikona v pravem hornim rohu kazdeho kroku
- Klik → tooltip/drawer s kratkym vysvetlenim aktualniho kroku
- Napr. na damage zone selectoru: "Kliknete na cast auta, ktera je poskozena. System automaticky vyradi dily z teto oblasti."

### 7.3 Kontextove tipy

Na kazdem kroku zobrazt jednoradkovy tip:
- Krok 1: "Tip: VIN najdete v technickem prukazu nebo na stitku u prednich dveri"
- Krok 3: "Tip: Motor casto prezije predni naraz — oznacte motorovy prostor zvlast"
- Krok 5: "Tip: Dily se stavem A se prodavaji 3x rychleji"

### Soubory

| Soubor | Akce |
|--------|------|
| `components/pwa-parts/onboarding/WelcomeScreen.tsx` | NOVY |
| `app/(pwa-parts)/parts/page.tsx` | EDIT — pridat welcome modal trigger |
| Kazdy step component | EDIT — pridat help ikona + tooltip |

---

## CAST 8: AKTUALNI STAV KODU V CARMAKLER

### Part model (`prisma/schema.prisma:951-1001`)

Rucni kompatibilita: compatibleBrands/Models (JSON), yearFrom/To, universalFit, oemNumber.
**Problem:** Zadny TecDoc KType, hardcoded 12 znacek v CompatibilitySelector.tsx.

### Supplier PWA (`app/(pwa-parts)/parts/new/`)

3-step wizard: Foto → Detaily → Cena. sourceVin pole existuje ale nepouziva se.

### Eshop (`app/(web)/dily/`)

PartsSearch + SmartSearchBar, VIN lookup pres decodeVin → brand/model/year → Prisma contains.

### API (`app/api/parts/`)

compatible, for-vehicle, oem-lookup, smart-search — vse na bazi brand/model string matching.

---

## CAST 9: ARCHITEKTURA

```
                    +------------------+
                    | lib/tecdoc.ts    |
                    | CENTRALNI SLUZBA |
                    +------------------+
                    |                  |
        +-----------+--------+---------+----------+
        |                    |                     |
+-------v--------+  +-------v--------+  +---------v------+
| USE CASE 1     |  | USE CASE 2     |  | USE CASE 3     |
| Donor car flow |  | Eshop search   |  | Vehicle intake |
| (vrakoviste)   |  | (zakaznik)     |  | (makler)       |
+----------------+  +----------------+  +----------------+
| PWA supplier   |  | Web /dily      |  | PWA broker     |
| VIN → dily     |  | VIN → match    |  | VIN → vybava   |
+----------------+  +----------------+  +----------------+
```

### lib/tecdoc.ts funkce

```typescript
// Core
vinToKType(vin: string): Promise<KTypeResult>
getProductGroupsForKType(kTypeId: number): Promise<ProductGroup[]>
getArticlesForProductGroup(kTypeId: number, groupId: number): Promise<Article[]>

// Search
searchByOemNumber(oem: string): Promise<Article[]>
searchByPartNumber(partNum: string): Promise<Article[]>

// Linkage
getVehicleLinkages(articleId: number): Promise<KType[]>
getCompatibleKTypes(articleId: number): Promise<number[]>

// Equipment (pro vehicle intake)
getEquipmentForKType(kTypeId: number): Promise<Equipment[]>

// Cache
getCachedVehicle(vin: string): Promise<CachedVehicle | null>
cacheVehicle(vin: string, data: KTypeResult): Promise<void>
```

---

## CAST 10: PRISMA ZMENY

### Rozsireni Part modelu

```prisma
model Part {
  // ... existujici pole ...

  // TecDoc (NOVE)
  tecdocKTypeId       Int?     // KType donor vozidla
  tecdocArticleId     Int?     // TecDoc article ID
  tecdocProductGroup  String?  // TecDoc product group
  tecdocLinkageIds    String?  // JSON array KType IDs — vsechna kompatibilni auta

  // Donor car (NOVE)
  donorVehicleId      String?  // FK na DonorVehicle
  donorVehicle        DonorVehicle? @relation(fields: [donorVehicleId], references: [id])
  partGrade           String?  // A, B, C

  @@index([tecdocKTypeId])
  @@index([tecdocArticleId])
  @@index([donorVehicleId])
}
```

### Novy model: DonorVehicle

```prisma
model DonorVehicle {
  id           String @id @default(cuid())
  supplierId   String
  supplier     User   @relation(fields: [supplierId], references: [id])

  vin          String
  kTypeId      Int?
  brand        String
  model        String
  year         Int?
  variant      String?
  engine       String?
  fuel         String?
  transmission String?

  // Likvidace
  disposalType   String  // ACCIDENT, MECHANICAL, COMPLETE, FLOOD, FIRE
  damageZones    Json?   // { front: "destroyed", rear: "ok", left: "light", ... }

  // Fotky
  photos       Json?   // ["url1", "url2", ...]

  // Stats
  totalParts       Int @default(0)
  publishedParts   Int @default(0)
  totalValue       Int @default(0)

  parts        Part[]

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([supplierId])
  @@index([vin])
  @@index([kTypeId])
}
```

### Novy model: TecdocCache

```prisma
model TecdocCache {
  id        String @id @default(cuid())
  vin       String @unique
  kTypeId   Int
  brand     String
  model     String
  year      Int?
  variant   String?
  raw       Json?

  createdAt DateTime @default(now())
  expiresAt DateTime

  @@index([kTypeId])
}
```

---

## CAST 11: SOUHRN VSECH ZMEN

### Nove soubory (13)

| Soubor | Ucel |
|--------|------|
| `lib/tecdoc.ts` | Centralni TecDoc service |
| `lib/damage-zones.ts` | Mapovani zon → dily, auto-filtr logika |
| `components/pwa-parts/parts/DonorVehicleStep.tsx` | Krok 1: VIN input |
| `components/pwa-parts/parts/DisposalTypeStep.tsx` | Krok 2: Duvod likvidace |
| `components/pwa-parts/parts/DamageZoneSelector.tsx` | Krok 3: Vizualni schema + zony |
| `components/pwa-parts/parts/PartsSelectionStep.tsx` | Krok 5: Vyber dilu + stav |
| `components/pwa-parts/parts/DonorPhotosStep.tsx` | Krok 6: Fotky auta |
| `components/pwa-parts/parts/BulkPricingStep.tsx` | Krok 7: Ceny per part |
| `components/pwa-parts/parts/DonorSummaryStep.tsx` | Krok 8: Souhrn + publikace |
| `components/pwa-parts/onboarding/WelcomeScreen.tsx` | Help/onboarding |
| `app/api/tecdoc/vin-to-ktype/route.ts` | API: VIN → KType |
| `app/api/tecdoc/parts-for-vehicle/route.ts` | API: KType → dily |
| `app/api/donor-vehicles/route.ts` | API: CRUD donor vehicles |

### Edity (8)

| Soubor | Zmena |
|--------|-------|
| `prisma/schema.prisma` | +Part pole, +DonorVehicle, +TecdocCache |
| `app/(pwa-parts)/parts/new/page.tsx` | Prepsat na 8-step donor flow |
| `components/pwa-parts/parts/DetailsStep.tsx` | Predvyplneni z TecDoc |
| `components/pwa-parts/parts/CompatibilitySelector.tsx` | TecDoc dynamicke data |
| `app/api/parts/compatible/route.ts` | + KType matching |
| `components/web/PartsSearch.tsx` | + VIN input |
| `app/(pwa-parts)/parts/page.tsx` | + Welcome modal |
| Vehicle intake step (PWA broker) | + Equipment checkboxy |

---

## CAST 12: IMPLEMENTACNI FAZE

### Faze 1 — Zaklad (2 tydny)

1. TecDoc registrace (219 EUR)
2. `lib/tecdoc.ts` + `lib/damage-zones.ts`
3. Prisma migrace (DonorVehicle, TecdocCache, Part pole)
4. DonorVehicleStep (VIN → KType)
5. DisposalTypeStep
6. DamageZoneSelector
7. PartsSelectionStep (s auto-filtrem)

### Faze 2 — Kompletni donor flow (1 tyden)

8. DonorPhotosStep
9. BulkPricingStep
10. DonorSummaryStep + publikace
11. WelcomeScreen (onboarding)

### Faze 3 — Eshop + vehicle intake (1 tyden)

12. PartsSearch VIN input
13. Compatible route KType matching
14. Vehicle intake equipment checkboxy

### Faze 4 — Polish (1 tyden)

15. CompatibilitySelector z TecDoc
16. OEM cross-reference
17. Backfill existujicich dilu
18. Notifikace zakazniku pri novych dilech

---

## CAST 13: NAKLADY

| Polozka | Rocni naklad |
|---------|-------------|
| TecDoc Classic | 219 EUR (~5,500 Kc) |
| Vincario VIN decode (1000 req) | ~5,500 Kc |
| CEBIA B2B | Na vyzadani |
| **Celkem (bez CEBIA)** | **~11,000 Kc/rok (~920 Kc/mesic)** |
