# Plan: PWA Guided Vehicle Onboarding - Redesign

**Datum:** 2026-05-22
**Status:** DRAFT - ceka na schvaleni
**Cil:** Prepracovat PWA workflow nabirani vozidel tak, aby makler byl veden krok za krokem a vsechny vysledne inzeraty mely jednotnou, profesionalni a konzistentni kvalitu.

---

## 1. ANALYZA AKTUALNIHO STAVU

### 1.1 Soucasny wizard (8 kroku)

| # | Krok | Step komponenta | Route |
|---|------|-----------------|-------|
| 1 | VIN | `VinStep.tsx` | `/makler/vehicles/new/vin` |
| 2 | Kontakt | `ContactStep.tsx` | `.../contact` |
| 3 | Prohlidka | `InspectionStep.tsx` | `.../inspection` |
| 4 | Fotky | `PhotosStep.tsx` | `.../photos` |
| 5 | Detaily | `DetailsStep.tsx` | `.../details` |
| 6 | Vybava | `EquipmentStep.tsx` | `.../equipment` |
| 7 | Cena | `PricingStep.tsx` | `.../pricing` |
| 8 | Kontrola | `ReviewStep.tsx` | `.../review` |

### 1.2 Co uz existuje a funguje dobre

- **VIN sken kamerou** (Tesseract.js, `VinScanModal.tsx`) -- offline OCR
- **VIN dekodovani** (`lib/vin-decoder.ts`) -- Vincario primary, NHTSA fallback
- **Duplicitni VIN check** -- auto-check po 17 znacich
- **IndexedDB offline storage** (`lib/offline/storage.ts`, `db.ts`) -- drafty, fotky, VIN cache
- **Photo guide** (`PhotoGuide.tsx`) s kamerou, 5 kategorii, 26 slotu (13 ext + 4 int + 1 engine + 3 evidence + 2 docs + defekty)
- **PhotoPositionDiagram** -- SVG top-down diagram vozu s clickable pozicemi
- **DefectCapture** s kamerou, severity rating
- **Equipment catalog** (`EquipmentSelector.tsx`) -- 8 kategorii, 100+ polozek, VIN equipment
- **AI generovani popisu** -- `/api/assistant/generate-description`
- **AI cenovy odhad** -- `/api/assistant/price-estimate`
- **Offline sync** (`OnlineSync.tsx`) -- pending actions, retry logic, photo upload
- **DraftProvider** (`useDraft.ts`) -- context, debounced auto-save, sections
- **StepLayout** + **StepProgressBar** -- responsive, sticky header/footer, safe-area
- **Quality checklist** v ReviewStep -- 10 polozek, link na krok kde chybi
- **StepPageGuard** -- ochrana stranek, recovery UI
- **Reject vehicle** -- makler muze odmitnout auto behem prohlidky

### 1.3 Co CHYBI nebo je PROBLEMATICKE

#### A. KRITICKE NEDOSTATKY (primo z pozadavku)

1. **Chybi DB lookup pred VIN dekodovanim**
   - Pozadavek: "Pokud uz vozidlo existuje v nasi databazi, pouziji se nase interni data."
   - Soucasny stav: VinStep vola primo `/api/vin/decode` (Vincario/NHTSA). Nekontroluje Vehicle tabulku v DB.
   - CEBIA (`lib/cebia.ts`) existuje, ale je pouzita az POST-creation pres `/api/vehicles/[id]/cebia`.
   - **Dopad:** Maker muze zbytecne rucne vyplnovat data, ktera uz v systemu jsou.

2. **Formular NENI dynamicky**
   - Pozadavek: "Aplikace nasledne zobrazi pouze doplnujici informace, ktere chybi."
   - Soucasny stav: `DetailsStep.tsx` zobrazuje VSECHNA pole vzdycky. Pokud VIN dekodoval brand/model, zobrazi je jako "locked", ale zbytek je prazdny a staticky.
   - **Dopad:** Maker vyplnuje zbytecne udaje, ktere uz system zna.

3. **Chybi strukturovany foto standard s vynucovanim**
   - Pozadavek: "Jasne nastaveny standard foceni... jake fotografie poridit, v jakem poradi, z jakych uhlu."
   - Soucasny stav: PhotoGuide ma tipy per slot, ale:
     - Zadne vynucovani poradi (user muze skakat)
     - Zadna kontrola kvality (rozmazanost, osvetleni)
     - Zadny overlay s kompozicnim vodidlem
     - Minimum je 13+3 fotek, ale bez quality gate
   - **Dopad:** Jeden makler nafoti profesionalne, druhy ledabyle.

4. **Popis v DVOU mistech**
   - `DetailsStep.tsx` (line ~650) MA textarea + AI generate button
   - `PricingStep.tsx` (line ~425) MA TAKE textarea + AI generate button
   - **Dopad:** Zmatecne, duplicitni, nekonzistentni.

5. **Chybi nova pole z pozadavku**
   - Pocet klicu (requirements: "pocet klicu")
   - Stav pneumatik detailne (requirements: "stav pneumatik" -- soucasny stav je jen checkbox)
   - Lokalni specifikace (requirements: "lokalni specifikace vozidla")
   - Individualni poznamky strukturovane (requirements: "individualni poznamky k vozu")

#### B. STRUKTURALNI PROBLEMY

6. **Nekonzistentni step numbering**
   - StepProgressBar labels: ["VIN", "Kontakt", "Prohlidka", "Fotky", "Detaily", "Vybava", "Cena", "Shrnuti"]
   - Ale: VinStep says `step={1}`, ContactStep `step={2}`, InspectionStep `step={3}`, PhotosStep `step={4}`, DetailsStep `step={5}`, EquipmentStep `step={6}`, PricingStep `step={7}`, ReviewStep `step={8}`
   - Toto je konzistentni -- OK.

7. **Chybi "konfirmacni" rezim**
   - Po VIN dekodovani by maker mel potvrdit/opravit jiz vyplnena data, ne je ignorovat.
   - Soucasne: data jsou "locked" (LockedField) bez moznosti editace -- co kdyz VIN vraci spatnou karoserii?

8. **Inspection data se neukladaji do Vehicle modelu strukturovane**
   - InspectionStep data jdou jako JSON do `inspectionData` pole, ale nejsou validovana strukturovane.

---

## 2. NAVRHOVANY NOVY FLOW

### 2.1 Preusporadany wizard (8 kroku -- zachovame pocet)

| # | Krok | Zmena oproti stavajicimu |
|---|------|--------------------------|
| 1 | **VIN** | + DB lookup + CEBIA + data merge pipeline |
| 2 | **Kontakt** | Beze zmeny (funguje dobre) |
| 3 | **Prohlidka** | + pneumatiky detail, + pocet klicu, + lokalni spec |
| 4 | **Fotky** | + enforced order, + quality hints, + composition overlay |
| 5 | **Smart Detaily** | PREPRACOVANO: dynamicky formular, jen chybejici pole |
| 6 | **Vybava** | Beze zmeny (funguje dobre) |
| 7 | **Cena & Popis** | Presun popisu z DetailsStep sem, template-based |
| 8 | **Kontrola** | + quality scoring, + listing preview, + enhanced gates |

### 2.2 Data Pipeline: VIN -> DB -> CEBIA -> Vincario -> NHTSA

```
Maker zada VIN
    |
    v
[1] Check duplicate (existujici - uz existuje)
    |-- Existuje a je ACTIVE/RESERVED/SOLD -> STOP, zobrazit info
    |-- Existuje a je ARCHIVED -> nabidnout "pouzit historicka data"
    |-- Neexistuje -> pokracovat
    |
    v
[2] DB Vehicle lookup (VIN match v ARCHIVED/historickych vozidlech)
    |-- Nalezeno -> prefill z DB dat (nejsilnejsi zdroj)
    |-- Nenalezeno -> pokracovat
    |
    v
[3] CEBIA check (historie, odometry, damage)
    |-- Data dostupna -> merge s DB daty, ulozit CEBIA report
    |-- Nedostupna/offline -> skip
    |
    v
[4] Vincario decode (technicka data z VIN)
    |-- Data dostupna -> merge s vyssi prioritou nez NHTSA
    |-- Nedostupna -> fallback
    |
    v
[5] NHTSA decode (free fallback)
    |-- Data dostupna -> merge s nejnizsi prioritou
    |-- Nedostupna -> manual entry
    |
    v
[VYSLEDEK] Merged data objekt s confidence per field
    {
      brand: { value: "Skoda", source: "vincario", confidence: "high" },
      model: { value: "Octavia", source: "vincario", confidence: "high" },
      mileage: { value: 85000, source: "cebia", confidence: "medium" },
      ...
    }
```

---

## 3. DETAILNI IMPLEMENTACNI PLAN

### FAZE 1: Smart VIN Data Pipeline
**Priorita:** KRITICKA
**Odhad:** 5 tasku

#### Task 1.1: API endpoint `/api/vin/smart-lookup`
**Soubory:**
- `app/api/vin/smart-lookup/route.ts` (NOVY)
- `lib/vin-decoder.ts` (UPRAVA -- export normalizers)
- `lib/cebia.ts` (UPRAVA -- volani z pipeline)

**Co se implementuje:**
- Novy API endpoint, ktery provede celou pipeline: DB -> CEBIA -> Vincario -> NHTSA
- Kazde pole ma `source` a `confidence` level
- Vraci merged result + metadata o zdrojich
- Request: `GET /api/vin/smart-lookup?vin=XXXXX`
- Response:
  ```json
  {
    "fields": {
      "brand": { "value": "Skoda", "source": "vincario", "confidence": "high", "editable": false },
      "model": { "value": "Octavia", "source": "vincario", "confidence": "high", "editable": false },
      "mileage": { "value": null, "source": null, "confidence": null, "editable": true }
    },
    "sources": ["db", "cebia", "vincario"],
    "cebiaReport": { "status": "OK", "reportUrl": "..." },
    "existingVehicleId": null
  }
  ```

**Acceptance criteria:**
- [ ] Endpoint prohledava DB Vehicle tabulku pred externimi APIs
- [ ] CEBIA se vola pokud je nakonfigurovana (env CEBIA_API_KEY)
- [ ] Vincario -> NHTSA fallback chain zachovana
- [ ] Kazde pole ma source + confidence
- [ ] Offline: vraci cached data z IndexedDB (VIN cache)
- [ ] Error handling: kazdy zdroj muze selhat nezavisle

#### Task 1.2: Typ `SmartLookupResult` + merge logic
**Soubory:**
- `types/vehicle-draft.ts` (UPRAVA)
- `lib/vin-merge.ts` (NOVY)

**Co se implementuje:**
- Novy typ `SmartLookupResult` s per-field metadata
- Novy typ `FieldWithSource<T>` pro source tracking
- Merge funkce: `mergeVinSources(dbData, cebiaData, vincarioData, nhtsaData)`
- Priority: DB > CEBIA > Vincario > NHTSA
- Confidence mapping: DB=high, CEBIA=high, Vincario=high, NHTSA=medium (EU low)

**Acceptance criteria:**
- [ ] Priority merge funguje spravne (DB > CEBIA > Vincario > NHTSA)
- [ ] Kazde pole trackuje svuj zdroj
- [ ] Null/undefined pole se preskocuji v merge
- [ ] Typ je exportovan a pouzitelny v klientskych komponentach

#### Task 1.3: Uprava VinStep na smart lookup
**Soubory:**
- `components/pwa/vehicles/new/VinStep.tsx` (UPRAVA)
- `lib/offline/storage.ts` (UPRAVA -- cache SmartLookupResult)

**Co se implementuje:**
- Nahradit `handleDecode` -> `handleSmartLookup` (vola novy endpoint)
- Zobrazit zdroje dat (badge per field: "Z nasi DB", "CEBIA", "VIN dekoder")
- Pokud existuji historicka data v DB, zobrazit summary card
- Pokud CEBIA reportuje problem (stolen, mileage issue), zobrazit warning
- Cache SmartLookupResult do IndexedDB

**Acceptance criteria:**
- [ ] Po zadani VIN se automaticky spusti smart lookup (po duplicate checku)
- [ ] Zobrazuji se data s oznacenim zdroje
- [ ] CEBIA warnings (stolen, mileage) se zobrazuji prominentne
- [ ] Offline fallback na VIN cache funguje
- [ ] Data se ukladaji do draftu vcetne source metadata

#### Task 1.4: API endpoint `/api/vin/check-duplicate` uprava
**Soubory:**
- `app/api/vin/check-duplicate/route.ts` (UPRAVA)

**Co se implementuje:**
- Rozliseni statusu: ACTIVE/RESERVED/SOLD vs ARCHIVED
- Pro ARCHIVED: vratit summary dat pro nabidku "pouzit historicka data"
- Nove pole v response: `archiveData`, `canReuse`

**Acceptance criteria:**
- [ ] ACTIVE/RESERVED/SOLD = blocker (nelze pokracovat)
- [ ] ARCHIVED = nabidka reuse dat
- [ ] Response obsahuje dostatecne info pro zobrazeni v UI

#### Task 1.5: CEBIA integrace do pipeline
**Soubory:**
- `lib/cebia.ts` (UPRAVA)
- `app/api/vin/smart-lookup/route.ts` (z Task 1.1)

**Co se implementuje:**
- Volani CEBIA v ramci smart-lookup pipeline
- Ulozeni CEBIA report ID do draftu
- Zobrazeni CEBIA statusu v UI (OK/WARNING badges)
- Mock fallback pro dev prostredi zachovan

**Acceptance criteria:**
- [ ] CEBIA se vola automaticky v ramci pipeline
- [ ] Report status se uklada do draftu
- [ ] Dev mock funguje bez CEBIA_API_KEY
- [ ] CEBIA selhani neblokuje zbytek pipeline

---

### FAZE 2: Dynamic Smart Form
**Priorita:** KRITICKA
**Odhad:** 4 tasky

#### Task 2.1: Smart DetailsStep -- dynamicky formular
**Soubory:**
- `components/pwa/vehicles/new/DetailsStep.tsx` (PREPRACOVANI)

**Co se implementuje:**
- Rozdeleni poli do 3 kategorii:
  - **Confirmed (locked)** -- z VIN/DB, high confidence, zobrazeno jako read-only s "edit" ikonou
  - **Pre-filled (review)** -- z VIN/DB, medium confidence, zobrazeno s hodnotou ale editovatelne + "Potvrdit" button
  - **Missing (input)** -- zadny zdroj, plne editovatelne, zvyraznene jako "Doplnte"
- Sekce se dynamicky skryvaji/zobrazuji podle toho, co je prefilled
- "Potvrdit vse" tlacitko pro hromadne potvrzeni pre-filled dat
- Vizualni indikace zdroje dat (maly badge "Z VIN", "Z DB", "Z CEBIA")

**Acceptance criteria:**
- [ ] Pole s high confidence jsou locked (s override moznosti)
- [ ] Pole s medium confidence jsou editovatelne ale pre-filled
- [ ] Chybejici pole jsou vizualne zvyraznena
- [ ] Potvrzeni funguje per-field i hromadne
- [ ] Formular se NEZOBRAZUJE prazdny pokud VIN dekodoval vsechno

#### Task 2.2: Nove pole v InspectionStep
**Soubory:**
- `components/pwa/vehicles/new/InspectionStep.tsx` (UPRAVA)
- `types/vehicle-draft.ts` (UPRAVA -- InspectionData)

**Co se implementuje:**
- **Pocet klicu** (1/2/3+) -- radio buttons
- **Stav pneumatik detailne:**
  - Typ (letni/zimni/celorocni)
  - Znacka (text input)
  - Hloubka desenu (slider 0-8mm)
  - DOT (stari, rok vyroba)
  - Druha sada (checkbox + typ)
- **Lokalni specifikace:**
  - Homologace CZ (ano/ne)
  - Pocet registraci v CR
  - Dovoz (pokud ano, odkud + datum)
- **Individualni poznamky k vozu** (strukturovany textarea s placeholdery)

**Acceptance criteria:**
- [ ] Vsechna nova pole jsou v InspectionData typu
- [ ] Pneumatiky maji vizualni slider pro hloubku desenu
- [ ] Klice maji vizualni volbu (1/2/3+)
- [ ] Data se ukladaji do draftu a prenasi do ReviewStep
- [ ] Pole jsou kontextove -- napr. "druha klice" v Documents sekci se propoji s novym polem

#### Task 2.3: Odstraneni popisu z DetailsStep
**Soubory:**
- `components/pwa/vehicles/new/DetailsStep.tsx` (UPRAVA)
- `components/pwa/vehicles/new/PricingStep.tsx` (UPRAVA)

**Co se implementuje:**
- Odstranit sekci "Popis vozidla" + AI generate z DetailsStep
- Ponechat popis POUZE v PricingStep (prejmenovano na "Cena & Popis")
- Presunout "Hlavni prednosti" (highlights chips) z DetailsStep do PricingStep
- Aktualizovat validaci v obou krocich

**Acceptance criteria:**
- [ ] Popis existuje POUZE v jednom kroku (PricingStep)
- [ ] Highlights presunute do PricingStep
- [ ] DetailsStep validace neobsahuje description
- [ ] Zadne broken references

#### Task 2.4: Template-based popis inzeratu
**Soubory:**
- `components/pwa/vehicles/new/PricingStep.tsx` (UPRAVA)
- `lib/description-template.ts` (NOVY)
- `app/api/assistant/generate-description/route.ts` (UPRAVA)

**Co se implementuje:**
- Definovat sablonu popisu s povinnymi sekcemi:
  ```
  [Uvodni veta -- AI]
  
  TECHNICKE PARAMETRY:
  - Motor: [auto-fill z dat]
  - Prevodovka: [auto-fill]
  - Najeto: [auto-fill]
  ...
  
  STAV VOZIDLA:
  [Z inspection dat -- auto-fill]
  
  VYBAVA:
  [Z equipment -- auto-fill, top 10]
  
  HLAVNI PREDNOSTI:
  [Z highlights -- auto-fill]
  
  [Zaverecna veta -- AI]
  ```
- AI generuje pouze volne textove casti, rest je auto-fill
- Preview popisu v realnem case
- Maker muze editovat volne textove casti, ale struktura zustava

**Acceptance criteria:**
- [ ] Popis ma konzistentni strukturu pro vsechny inzeraty
- [ ] Technicke parametry jsou auto-filled z dat (ne AI)
- [ ] AI generuje pouze uvodni + zaverecni vetu
- [ ] Preview ukazuje finalni verzi
- [ ] Maker muze editovat volne casti, ale ne strukturu

---

### FAZE 3: Photo Standard & Quality
**Priorita:** VYSOKA
**Odhad:** 4 tasky

#### Task 3.1: Enforced photo order (guided mode)
**Soubory:**
- `components/pwa/vehicles/new/PhotosStep.tsx` (UPRAVA)
- `components/pwa/vehicles/new/PhotoGuide.tsx` (UPRAVA)

**Co se implementuje:**
- "Guided mode" (default) -- makler je veden slot po slotu v presnem poradi
  - Po dokonceni jedne fotky se automaticky otevre dalsi slot
  - Progress bar ukazuje "Fotka 3/26"
  - Nelze preskocit povinne fotky (ext_front_34 -> ext_front -> ext_right -> ...)
  - Nepovinne fotky lze preskocit ("Preskocit" tlacitko)
- "Free mode" -- soucasne chovani (grid s clickable sloty)
- Toggle mezi mody v headeru
- Guided mode je DEFAULT pro nove makiere

**Acceptance criteria:**
- [ ] Guided mode vede makiere krok za krokem
- [ ] Povinne fotky nelze preskocit
- [ ] Po vyfoceni se automaticky otevre dalsi slot
- [ ] Free mode zachovan pro zkusene makiere
- [ ] Default je guided mode

#### Task 3.2: Composition overlay v PhotoGuide
**Soubory:**
- `components/pwa/vehicles/new/PhotoGuide.tsx` (UPRAVA)

**Co se implementuje:**
- Semi-transparentni overlay s orientacnimi liniemi:
  - Pro exterierni fotky: obrys auta v spravnem uhlu (per slot)
  - Pro interierni fotky: vodici linky
  - Pro detail fotky (svetla, kola): kruh pro zaosteni
- Overlay se skryje pri foceni (jen jako vodidlo pred stisknutim)
- Tip text je prominentnejsi (vetsi font, animace pri prvnim zobrazeni)

**Acceptance criteria:**
- [ ] Kazdy slot ma spravny overlay (min. pro 8 hlavnich exteriernich pozic)
- [ ] Overlay je polopruhledny a neobtezuje
- [ ] Overlay se skryje pri capture
- [ ] Funguje na ruznych rozlisenich displeje

#### Task 3.3: Photo quality hints (post-capture)
**Soubory:**
- `components/pwa/vehicles/new/PhotoGuide.tsx` (UPRAVA)
- `lib/image-quality.ts` (NOVY)

**Co se implementuje:**
- Po vyfoceni (preview stav) zkontrolovat:
  - **Rozmazanost** -- Laplacian variance check (basic, client-side)
  - **Tmavost/presvetlenost** -- histogram analysis
  - **Orientace** -- landscape vs portrait check per slot
- Pokud kvalita nevyhovuje, zobrazit hint:
  - "Fotka se zda rozmazana. Chcete ji vyfotit znovu?"
  - "Fotka je prilis tmava. Zkuste lepsi osvetleni."
- Hint je DOPORUCENI, ne blocker (maker muze pouzit i tak)

**Acceptance criteria:**
- [ ] Blur detection funguje na mobile (< 500ms)
- [ ] Brightness check funguje
- [ ] Hinty jsou uzivatelsky privetive (ne technicke)
- [ ] Maker muze hint ignorovat a pokracovat
- [ ] Nedochazi k false positives u normalnych fotek

#### Task 3.4: Evidence foto enforced ordering
**Soubory:**
- `components/pwa/vehicles/new/PhotosStep.tsx` (UPRAVA)

**Co se implementuje:**
- Evidence fotky (tachometr, VIN, klice) musi byt posledni 3 v guided mode
- Duvod: maker nejprve nafoti auto, pak zapne motor (tachometr), pak vyfoti VIN a klice
- Vizualni odliseni evidence sekce (jina barva border, "POVINNE" badge)
- Warning pokud evidence fotky chybi a maker chce pokracovat

**Acceptance criteria:**
- [ ] Evidence fotky jsou jasne vizualne odlisene
- [ ] V guided mode jsou na konci
- [ ] Nelze pokracovat bez 3 evidence fotek
- [ ] Warning je jasny a specificky (co chybi)

---

### FAZE 4: Quality Gate & Completeness
**Priorita:** VYSOKA
**Odhad:** 3 tasky

#### Task 4.1: Quality scoring system
**Soubory:**
- `lib/listing-quality.ts` (NOVY)
- `components/pwa/vehicles/new/ReviewStep.tsx` (UPRAVA)

**Co se implementuje:**
- Bodovaci system kvality inzeratu (0-100):
  - Fotky: max 35 bodu
    - 13+ regularnich = 20b, 20+ = 25b, 25+ = 30b
    - 3 evidence = 5b
    - Hlavni fotka nastavena = +5b (bonus)
  - Data: max 30 bodu
    - Zakladni pole (brand, model, year, mileage, fuel, trans) = 15b
    - Rozsirena pole (color, doors, seats, drivetrain, STK) = 10b
    - Inspection kompletni = 5b
  - Popis: max 20 bodu
    - Delka > 100 znaku = 10b
    - Highlights >= 3 = 5b
    - AI generated = 5b
  - Vybava: max 15 bodu
    - 5+ polozek = 5b, 15+ = 10b, 25+ = 15b
- Vizualni skore v ReviewStep (kruhovy progress, barva podle urovne)
- **Minimum pro odeslani: 60 bodu** (soucasny checklist = pass/fail, novy = scoring)
- Doporuceni pro zlepseni ("Pridejte jeste 2 fotky exterieru pro 5 bodu navic")

**Acceptance criteria:**
- [ ] Score se pocita v realnem case
- [ ] Vizualni indicator (kruhovy progress)
- [ ] Minimum 60 bodu pro odeslani
- [ ] Konkretni doporuceni pro zlepseni
- [ ] Score se uklada do draftu a prenasi na server

#### Task 4.2: Enhanced ReviewStep s listing preview
**Soubory:**
- `components/pwa/vehicles/new/ReviewStep.tsx` (UPRAVA)

**Co se implementuje:**
- Realisticky nahled inzeratu (jak bude vypadat na webu):
  - Photo carousel s thumbnaily
  - Titulek, cena, lokace
  - Technicke parametry v gridu
  - Popis
  - Vybava chips
  - Highlights badges
- Srovnani s "ideal" inzeratem (vizualni benchmark)
- "Edit" buttony per sekce pro rychly navrat do kroku

**Acceptance criteria:**
- [ ] Preview verne kopiruje design z web katalogu
- [ ] Photo carousel funguje s thumbnaily z IndexedDB
- [ ] Per-sekce edit buttony vedou na spravny krok
- [ ] Preview je scrollable a kompletni

#### Task 4.3: Consistency check engine
**Soubory:**
- `lib/listing-quality.ts` (UPRAVA z 4.1)
- `components/pwa/vehicles/new/ReviewStep.tsx` (UPRAVA)

**Co se implementuje:**
- Kontrola konzistence mezi sekcemi:
  - Inspection rika "vady laku" = TRUE, ale neni zadna defect fotka -> WARNING
  - Mileage > 200k, ale condition = "EXCELLENT" -> WARNING
  - Year < 2010, ale "pocet majitelu" = 1 -> HINT (neobvykle)
  - Equipment obsahuje "Xenon svetlomety" ale v inspection "poskozena svetla" = TRUE -> WARNING
  - EV/PHEV vozidlo ale "nabijeci kabel" = FALSE v documents -> WARNING
- Warnings jsou zluty alert s odkazem na krok kde opravit
- Neblokuji odeslani, ale snizuji quality score

**Acceptance criteria:**
- [ ] Min. 5 konzistentnich pravidel implementovano
- [ ] Warnings jsou srozumitelne a actionable
- [ ] Kliknuti na warning vede na spravny krok
- [ ] Warnings snizuji quality score (-5b per warning)

---

### FAZE 5: UX Polish & Flow Optimization
**Priorita:** STREDNI
**Odhad:** 3 tasky

#### Task 5.1: Step reorder + progress persistence
**Soubory:**
- `components/pwa/vehicles/new/StepProgressBar.tsx` (UPRAVA)
- `components/pwa/vehicles/new/StepLayout.tsx` (UPRAVA)

**Co se implementuje:**
- Clickable step indicators -- maker muze kliknout na jiz hotovy krok a vratit se
- Vizualni stav per krok: pending (sedy), in-progress (oranzovy), complete (zeleny), warning (zluty)
- Odhadovany cas na krok (zobrazeny pri prvnim pouziti):
  - VIN: ~1 min
  - Kontakt: ~2 min
  - Prohlidka: ~5 min
  - Fotky: ~10 min
  - Detaily: ~2 min (nebo 0 pokud prefilled)
  - Vybava: ~3 min
  - Cena: ~2 min
  - Kontrola: ~1 min

**Acceptance criteria:**
- [ ] Kroky jsou clickable pro navrat
- [ ] Vizualni stav per krok
- [ ] Neni mozne preskocit na krok ktery nebyl jeste navstiven (sekvencne)
- [ ] Casove odhady zobrazeny u novych makleriu

#### Task 5.2: Auto-save indikator + offline badge
**Soubory:**
- `components/pwa/vehicles/new/StepLayout.tsx` (UPRAVA)
- `lib/hooks/useDraft.ts` (UPRAVA)

**Co se implementuje:**
- Vizualni indikator "Ukladam..." / "Ulozeno" / "Offline" v headeru
- Pulsujici tecka pri auto-save (1s debounce z DraftProvider)
- Badge "Offline" pokud neni pripojeni (cerveny)
- Badge "Ulozeno" po uspesnem ulozeni (zeleny, zmizi po 2s)

**Acceptance criteria:**
- [ ] Maker vidi ze data se ukladaji
- [ ] Offline stav je jasne vizualni
- [ ] Zelena tecka po ulozeni
- [ ] Neblokuje interakci

#### Task 5.3: Onboarding walkthrough pro nove makiere
**Soubory:**
- `components/pwa/vehicles/new/OnboardingTour.tsx` (NOVY)
- `components/pwa/vehicles/new/StepLayout.tsx` (UPRAVA)

**Co se implementuje:**
- Pri prvnim pouziti (localStorage flag) zobrazit kroceny tutorial:
  - Slide 1: "Vitejte! Provedeme vas celym procesem nabirani."
  - Slide 2: "Zacnete zadanim VIN -- system vyplni co muze."
  - Slide 3: "Provedete prohlidku a nafotite auto."
  - Slide 4: "Zkontrolujte a odeslite ke schvaleni."
- 4 slidy s ilustracemi, "Dalsi" / "Preskocit" buttony
- Zobrazuje se JEDNOU (localStorage `onboarding_completed`)

**Acceptance criteria:**
- [ ] Walkthrough se zobrazi pouze pri prvnim pouziti
- [ ] Preskocit funguje
- [ ] Po dokonceni se uz nikdy nezobrazi
- [ ] Neni vtiravy (max 4 slidy)

---

## 4. DEPENDENCY CHAIN & PORADNI IMPLEMENTACE

```
FAZE 1 (VIN Pipeline) -- ZAKLAD, musi byt prvni
  Task 1.2 (typy + merge)     -- zadne zavislosti
  Task 1.1 (API endpoint)     -- zavisi na 1.2
  Task 1.4 (duplicate uprava) -- zadne zavislosti
  Task 1.5 (CEBIA integrace)  -- zavisi na 1.1
  Task 1.3 (VinStep uprava)   -- zavisi na 1.1, 1.4, 1.5
  
FAZE 2 (Smart Form) -- muze zacat jakmile je 1.2 hotovy
  Task 2.3 (odstraneni popisu dup) -- zadne zavislosti
  Task 2.2 (nova pole inspection)  -- zadne zavislosti
  Task 2.1 (smart details)         -- zavisi na 1.2 (typy)
  Task 2.4 (template popis)        -- zavisi na 2.3
  
FAZE 3 (Photo Quality) -- nezavisla na FAZI 1/2
  Task 3.3 (quality hints lib)  -- zadne zavislosti
  Task 3.1 (guided mode)        -- zadne zavislosti
  Task 3.2 (composition overlay)-- zavisi na 3.1
  Task 3.4 (evidence ordering)  -- zavisi na 3.1
  
FAZE 4 (Quality Gate) -- zavisi na FAZI 2 a 3
  Task 4.1 (scoring system)     -- zavisi na 2.4 (template popis pro scoring)
  Task 4.3 (consistency check)  -- zavisi na 4.1
  Task 4.2 (enhanced review)    -- zavisi na 4.1
  
FAZE 5 (UX Polish) -- muze byt paralelne s FAZI 4
  Task 5.1 (step reorder)       -- zadne zavislosti
  Task 5.2 (auto-save indicator)-- zadne zavislosti
  Task 5.3 (onboarding tour)    -- zadne zavislosti
```

### Paralelizace

Tyto tasky mohou bezet PARALELNE:
- **Vlna 1:** Task 1.2 + Task 2.2 + Task 2.3 + Task 3.3 + Task 3.1 + Task 5.1 + Task 5.2
- **Vlna 2:** Task 1.1 + Task 1.4 + Task 2.1 + Task 3.2 + Task 3.4 + Task 5.3
- **Vlna 3:** Task 1.5 + Task 2.4
- **Vlna 4:** Task 1.3 + Task 4.1
- **Vlna 5:** Task 4.2 + Task 4.3

---

## 5. SOUBORY KTERE SE MENI (KOMPLETNI SEZNAM)

### NOVE soubory:
| Soubor | Faze/Task |
|--------|-----------|
| `app/api/vin/smart-lookup/route.ts` | 1.1 |
| `lib/vin-merge.ts` | 1.2 |
| `lib/description-template.ts` | 2.4 |
| `lib/image-quality.ts` | 3.3 |
| `lib/listing-quality.ts` | 4.1 |
| `components/pwa/vehicles/new/OnboardingTour.tsx` | 5.3 |

### UPRAVOVANE soubory:
| Soubor | Faze/Task |
|--------|-----------|
| `types/vehicle-draft.ts` | 1.2, 2.2 |
| `lib/vin-decoder.ts` | 1.1 |
| `lib/cebia.ts` | 1.5 |
| `lib/offline/storage.ts` | 1.3 |
| `app/api/vin/check-duplicate/route.ts` | 1.4 |
| `app/api/assistant/generate-description/route.ts` | 2.4 |
| `components/pwa/vehicles/new/VinStep.tsx` | 1.3 |
| `components/pwa/vehicles/new/DetailsStep.tsx` | 2.1, 2.3 |
| `components/pwa/vehicles/new/InspectionStep.tsx` | 2.2 |
| `components/pwa/vehicles/new/PricingStep.tsx` | 2.3, 2.4 |
| `components/pwa/vehicles/new/PhotosStep.tsx` | 3.1, 3.4 |
| `components/pwa/vehicles/new/PhotoGuide.tsx` | 3.1, 3.2, 3.3 |
| `components/pwa/vehicles/new/ReviewStep.tsx` | 4.1, 4.2, 4.3 |
| `components/pwa/vehicles/new/StepProgressBar.tsx` | 5.1 |
| `components/pwa/vehicles/new/StepLayout.tsx` | 5.1, 5.2, 5.3 |
| `lib/hooks/useDraft.ts` | 5.2 |

### NEMODIFIKOVANE soubory (funguju dobre):
- `components/pwa/vehicles/new/ContactStep.tsx`
- `components/pwa/vehicles/new/EquipmentStep.tsx`
- `components/pwa/vehicles/new/EquipmentSelector.tsx`
- `components/pwa/vehicles/new/ContactSearch.tsx`
- `components/pwa/vehicles/new/StepPageGuard.tsx`
- `components/pwa/vehicles/new/SuccessView.tsx`
- `components/pwa/vehicles/new/VinScanModal.tsx`
- `components/pwa/vehicles/new/HintBox.tsx`
- `components/pwa/vehicles/new/StarRating.tsx`
- `components/pwa/vehicles/new/DefectCapture.tsx`
- `components/pwa/vehicles/new/PhotoPositionDiagram.tsx`
- `components/pwa/OnlineSync.tsx`
- `lib/offline/db.ts`
- `lib/offline/sync.ts`
- `lib/offline/upload-photos.ts`
- `app/(pwa)/makler/vehicles/new/layout.tsx`
- `app/(pwa)/makler/vehicles/new/page.tsx`
- Vsechny page.tsx, loading.tsx, error.tsx v step slozach

---

## 6. RIZIKA A OMEZENI

### Rizika:
1. **CEBIA API integrace** -- Nemame realne CEBIA API credentials. Mock existuje. Implementace musi byt robustni vuci CEBIA selhani.
2. **Image quality detection client-side** -- Laplacian blur detection na mobile muze byt pomaly. Musi byt < 500ms.
3. **Offline kompatibilita** -- Smart lookup pipeline musi fungovat offline (cached data).
4. **Zpetna kompatibilita draftu** -- Existujici drafty v IndexedDB musi zustat kompatibilni. Migrace novych poli.

### Omezeni:
- CEBIA credentials = dev-mock v dev prostredi
- Vincario API = limitovane requesty (API key/secret)
- Offline-first = vsechna data musi byt cachovatelna
- Mobile-first = vsechny UI zmeny musi fungovat na malych displejich
- Zadne zmeny Prisma schema (data jdou jako JSON do existujicich poli)

---

## 7. STOP THRESHOLDS

### STOP-1: Technicky blocker
Pokud jakykoli task narazí na:
- Prisma schema zmenu, ktera vyzaduje migraci
- Breaking change v IndexedDB schema (existujici drafty)
- API endpoint ktery vyzaduje autentifikaci, ktera neni implementovana

-> **STOP, eskalovat na leadera.**

### STOP-2: Scope creep
Pokud implementace jakehokoli tasku presahne:
- 500 radku zmen v jednom souboru
- 3 nove soubory navic oproti planu

-> **STOP, eskalovat na leadera pro review scope.**

### STOP-3: Quality regression
Pokud po implementaci faze:
- Build failuje (`npm run build`)
- Existujici PWA flow prestal fungovat
- Offline sync se rozbil

-> **STOP, revert a eskalovat.**

---

## 8. METRIKY USPECHU

Po implementaci vsech fazi:
1. **Konzistence:** Vsechny inzeraty maji stejnou strukturu popisu
2. **Kompletnost:** Quality score >= 60 pro kazdy odeslany inzerat
3. **Efektivita:** Maker s VIN decode vyplnuje max 5 poli rucne (vs 15+ ted)
4. **Kvalita fotek:** Min. 16 fotek v definovanem poradi
5. **Cas:** Cely flow < 25 minut (ted ~35 min)
