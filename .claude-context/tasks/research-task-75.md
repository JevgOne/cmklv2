# Research #75 — Štítky a kódy na autodílech + AI/OCR možnosti

**Typ:** Research only (žádný kód, žádný plán implementace)
**Datum:** 2026-04-06
**Plánovač:** planovac
**Pro:** team-lead → uživatel
**Východisko:** Uživatel se ptal "AI to dokáže přímo? štítky jsou individuální podle me?" — potřebuje data před návrhem feature "vyfoť kód → načti díl" pro vrakoviště PWA.

---

## TL;DR (pro leada)

1. **Štítky na autodílech NEJSOU jednotně standardizované** — koexistují minimálně 5 typů (OEM stickery, vyražené kódy na metalu, EAN/QR barcody, vrakovišťní vlastní štítky, VIN-vázané stickery v rámu dveří). Velkovýrobci (Bosch, Continental, Denso) mají *vlastní* formáty, ale **TecDoc** a **Hollander Interchange** existují právě proto, aby tu fragmentaci sjednotily.
2. **AI vidí dobře tištěné stickery a kvalitní barcody, ale špatně vyražené/oxidované kódy na metalu.** Claude Sonnet 4.5 + Google Cloud Vision dosahují ~98 % na čistých dokumentech, ale specializovaná industrial vision (Keyence, Cognex) je spolehlivější na metalu. Realistická accuracy v reálných vrakovištních podmínkách (špína, špatné světlo, úhly) je **bez custom modelu odhadem 60–80 %**.
3. **Existuje hotová DB**: TecDoc (110M+ čísel, 900+ výrobců) — ale potřebuje placený licenční kontrakt přes TecAlliance/Solera. Hollander Interchange řeší přesně to, co my chceme — "tenhle díl pasuje do těchto aut" — ale je US-centric a placený.
4. **Doporučuju MIN nebo STD** (ne MAX). MIN je 0 USD, posune nás z "ručního vyplňování formuláře" na "vyfoť → text se uloží → user zkontroluje". STD přidá TecDoc lookup pro autocomplete a ROI dává smysl pouze s ≥50 vrakovišti.
5. **Open questions** (sekce 7) — bez odpovědí nelze rozhodnout mezi variantami.

---

## 1. Typy kódů a štítků na autodílech — co reálně existuje

### 1.1 OEM part number stickery (printed/molded)

**Bosch (nejčastější ve spare parts)**
- Tradičně **10 znaků**, začínají na `04...` (originál) nebo `09...` (Bosch factory remanufactured), `F0...` pro late-model common rail
- Umístění: parts ID tag nýtovaný na housing, sticker, NEBO tištěné přímo do plastového molding
- Pro common rail komponenty (injectors, rail assemblies) existují **dva různé** Bosch part numbers — jeden pro OEM dodávku přímo do automobilky, druhý pro aftermarket
- → ![pozn. pro impl] aftermarket part number ≠ OEM, ale označují fyzicky stejný díl. TecDoc tyto cross-references řeší.

**Continental, Denso, Hella, Valeo, NGK** — vlastní formáty, vlastní kontrolní algoritmy. Žádný "globální" standard. Cross-reference probíhá přes:
- TecDoc (placený)
- Hollander Interchange (placený, US)
- Manuální cross-reference tabulky výrobců

### 1.2 Vyražené/odlité kódy na metalu (cast numbers)

**Engine blocks, cylinder heads, ECU housings**
- Casting number = alfanumerický řetězec vyražený nebo odlitý na základním kovovém dílu
- **Chevy small block** — raised ledge u rear bellhousing flange
- **Ford** — 4 znaky casting code + 4 znaky basic part number (`6015` = engine block) + revision suffix
- **Mopar** — 7 numerických znaků na driver-side bloku
- **Pozor:** výrobci recyklují casting numbers napříč roky a velikostmi → casting date code se musí číst SOUBĚŽNĚ
- **OCR challenge:** vyražené znaky mají **nízký kontrast**, často oxidované, špinavé olejem, na zakřivené ploše

### 1.3 Barcode / GS1

**Standardy podle AIAG B-4 (4. edice)** — recommended automotive symbology:
- 1D: **Code 39**, **Code 128** (často pro vehicle traceability)
- 2D: **Data Matrix** (preferováno na metalu — robustní), **QR Code**
- GS1-vázané: EAN-13, UPC-A, GS1-128, GS1 DataBar, GS1 DataMatrix, GS1 QR Code
- **GS1 Digital Link** (novější standard) — kombinuje URL + GTIN + serial number do jednoho 2D barcode

**Reálná penetrace v aftermarket:**
- Nové díly v originálním obalu — téměř vždy mají EAN-13 nebo Data Matrix na obalu
- Použité díly z vrakoviště — **většinou bez barcode** (sticker po ~5–15 letech provozu chybí, oxidoval, nebo nikdy nebyl na samotném dílu, jen na obalu)
- Velké komponenty (motor, převodovka) — někdy mají kovový tag s razenými čísly + výrobní štítek (často poškozený)

### 1.4 Vrakovišťní vlastní štítky

**Co tam typicky bývá:**
- VIN auta, ze kterého byl díl demontován
- Internal SKU vrakoviště
- Datum demontáže
- Cena
- Hollander Interchange number (US recyklátoři)
- Typicky **tištěný thermal label** (Zebra, Brother)

**Bez standardizace** — každé vrakoviště má svůj vlastní formát. To je hlavní důvod, proč generický AI lookup je obtížný: štítek je freeform layout, ne standardní barcode.

### 1.5 VIN-vázané stickery z karoserie

**Door jamb sticker** (Federal Motor Vehicle Safety Standard 49 CFR Part 567 v USA, podobné v EU):
- Obsahuje VIN, GVWR, datum výroby, tire pressure
- Na bočních panelech, kapotě, dveřích — výrobci tam dávají **paint code, body color, trim code, options codes**
- Pro vrakoviště užitečné když chce identifikovat, **z jakého modelu** je odebraný panel
- ECS Automotive je oficiální OEM-licensed dodavatel replacement labelů

### 1.6 Datum výroby, šarže, sériové číslo

Často přítomné jako sekundární informace na stickeru. Užitečné pro:
- Recall identifikaci
- Rozlišení verzí (např. ECU firmware version)
- Záruční nárok

---

## 2. Je to standardizované? Krátká odpověď: NE.

**Co JE standardizováno:**
- Symbology (AIAG B-4) — *jak* zakódovat data do barcodu, pokud je výrobce použije
- GS1 GTIN — *unikátní 14-místné* číslo trade itemu, povinné pro retail (nové díly v krabičce)
- ISO 9001 kvalita procesu (ne formát čísla)

**Co NENÍ standardizováno:**
- Formát samotného OEM part number (každý výrobce jiný)
- Umístění štítku na dílu (variabilní per komponenta)
- Cross-reference mezi výrobci (řeší TecDoc, Hollander, ne norma)
- Vrakovišťní interní štítky

**Co dělají velcí B2B hráči:**
- **TecAlliance / TecDoc** (Solera-vlastněný) — největší DB autodílů, 110M+ part numbers, 900+ ověřených výrobců. API dostupné jako web service nebo bulk data package (týdně/kvartálně). Cena přes business kontrakt — typicky **single-digit thousands EUR/year** podle objemu.
- **Hollander Solutions** (Powerlink, YardMaster) — yard management software pro recyklátory. **Hollander Interchange** přiřazuje unique number a říká "tento díl pasuje do těchto aut". Standard v US salvage industry.
- **Car-Part Interchange** — marketplace + interchange DB pro recyklátory.
- **PartsTech** — search aggregator pro repair shopy, filtruje VIN nebo license plate napříč suppliery.
- **Autodoc PRO** (CZ market — Cheb DC od 2023) — TecDoc-derived katalog s VIN filtrem, 6.7M produktů.
- **NHTSA vPIC API** — zdarma, ale **pouze vehicle-level data** (year/make/model/engine), ne parts.
- **vindecoder.eu** — už používáme; vehicle-level only.

→ **Klíčový insight:** DB s 110M part numbers + cross-reference EXISTUJE (TecDoc), ale NENÍ free a NENÍ určeno pro vrakoviště specificky. Hollander je salvage-specific, ale US-centric a drahé.

---

## 3. AI/OCR možnosti — co dokáže a co ne

### 3.1 Foundation modely (cloud)

| Model | OCR accuracy | Hallucination | Cena/image | Sweet spot |
|-------|--------------|---------------|------------|-----------|
| **Claude Sonnet 4.5** | CER 2,1 % na print | **0,09 %** | ~$0,0048 | Multilingual, multilingual non-Latin (Thai 94,2 %), nízká hallucinace, layout-aware |
| **Claude Opus 4.6** | Nejvyšší kvalita, vyšší cena | velmi nízká | ~$0,015–0,02 | Premium, kdy je třeba 100% spolehlivost |
| **GPT-4o** | Edit distance 0,02 (mírně lepší) | 0,15 % | ~$0,0075 | Rychlejší (2,3 s/page), čistý dokument OCR |
| **Google Cloud Vision API** | **98 %** na full dataset | n/a | ~$0,0015 | Document AI, barcode detection, top-tier industrial OCR |
| **AWS Textract** | Top-tier | n/a | ~$0,0015–0,05 podle features | Forms + tables, americký |
| **Gemini 2.5 Pro** | Top-tier multilingual | n/a | $0,003 input | Konkurent Claude Vision |

**Limity všech LLM-vision modelů:**
- "Claude may hallucinate or make mistakes when interpreting low-quality, rotated, or very small images under 200 pixels"
- **Metal stamped text:** žádný z LLM modelů nemá zveřejněné benchmarks; obecně horší než tištěný text kvůli low contrast + reflective surfaces
- **Specialized industrial vision (Keyence, Cognex)** — built for stamped/dot-peen marks, ale 1000× dražší a požaduje fixed kameru, ne smartphone

### 3.2 On-device / offline řešení

| Knihovna | Use case | Accuracy | Offline | Cena |
|----------|----------|----------|---------|------|
| **Google ML Kit (Barcode Scanner)** | EAN, UPC, QR, Data Matrix | **Vynikající** | Ano (mobil) | Free |
| **ZXing-JS** | Browser barcode scanner | Dobrý na čisté, slabý na poškozené/malé | Ano (browser) | Free |
| **Tesseract.js (WASM)** | Browser OCR libovolný text | 1–3 s/page, slabší na nestandard fonts | Ano (browser, ~2 MB lang data) | Free |
| **PaddleOCR / TrOCR** | On-device LLM-OCR | Velmi dobrá, ale velký model | Ano (server-side spíš) | Free |
| **Apple VisionKit / Android Text Recognition** | Native mobile OCR | Dobrá pro print, slabší pro stamped | Ano | Free |

**Pozitiva offline řešení:**
- 0 USD provoz
- Funguje na vrakovišti bez signálu (Carmakler PWA má offline-first ambici — viz CLAUDE.md "Serwist + IndexedDB")
- Žádný GDPR transfer rizika (foto neopouští zařízení)

**Negativa:**
- Slabší než cloud LLM-vision na obtížných případech
- Nepotřebuje kontextové porozumění ("To je Bosch injector pro VW Passat 2.0 TDI") — jen extrahuje text

### 3.3 Custom modely (Roboflow + YOLO)

**Co to je:**
- Vytvoříš dataset 500–2000 fotek vrakovišťních štítků, ručně oanotuješ bounding boxy + text
- Roboflow Annotate má auto-label assist (Grounding DINO + SAM) → zkrátí labeling až 50 %
- Trénink YOLOv8 / YOLO11 / YOLO26 na Roboflow → vlastní model rozpoznávající přesně tvoje typy štítků

**Kdy to dává smysl:**
- Pokud jsou štítky jednoho dominantního formátu (např. všechna vrakoviště používají Zebra thermal labely se stejným layoutem)
- Pokud generic AI selhává a máš čas/peníze na sběr a anotaci dat
- Pokud chceš > 95 % accuracy na konkrétní typ úlohy

**Kdy to NEDAVÁ smysl:**
- Pokud máš heterogenní vstupy (každé vrakoviště jiný štítek) — generic Claude Vision bude univerzálnější
- Pokud nemáš čas na sběr 500+ fotek
- Pokud accuracy 70 % stačí (uživatel zkontroluje a opraví)

### 3.4 Realistická accuracy v reálných podmínkách

**Bez custom modelu (čistý Claude Vision / GPT-4o / Cloud Vision):**
- Tištěný sticker, dobré osvětlení, blízko: **~95 %**
- Tištěný sticker, slabé světlo, úhel 30°: **~70–85 %**
- Vyražené číslo na čistém metalu: **~50–70 %**
- Vyražené číslo, oxidace, špína, špatné světlo: **~20–50 %**
- Poškozený / částečně chybějící štítek: **~30–60 %**

**S barcode/QR (ML Kit nebo ZXing):**
- Čistý barcode: **~99 %**
- Mírně poškozený: **~80–90 %**
- Chybí > 30 % barcode: prakticky 0 %

**S custom YOLO modelem (po sběru 500+ vzorků):**
- Specifický typ štítku, na který trénován: **~95 %**
- Štítky mimo trénovací distribuci: **~30–60 %**

### 3.5 Latency a provozní cena (přibližně)

| Řešení | Latency / image | Cena / 1000 images | Cena / 10k/měsíc |
|--------|----------------|--------------------|-----------------|
| Claude Sonnet 4.5 | 1,5–3 s | ~$4,80 | ~$48 |
| Claude Opus 4.6 | 2–4 s | ~$15–20 | ~$150–200 |
| GPT-4o vision | 2,3 s | ~$7,50 | ~$75 |
| Google Cloud Vision | < 1 s | ~$1,50 | ~$15 |
| Tesseract.js (browser) | 1–3 s | $0 | $0 |
| ML Kit (mobile) | < 0,5 s | $0 | $0 |

**Pozn.:** Carmakler může v PWA použít **client-side ML Kit / Tesseract.js zdarma** a šetřit cloud volání pouze na fallback edge cases. To je dnes typický pattern u shipping/inventory aplikací.

---

## 4. Existující commercial řešení / API pro lookup

| Systém | Pokrytí | Pricing | Pro CZ trh? | Hodnocení pro naše použití |
|--------|---------|---------|-------------|---------------------------|
| **TecDoc** (TecAlliance/Solera) | 110M+ part numbers, 900+ výrobců | Business kontrakt, low-thousands EUR/year | ✅ EU standard | **★★★★★** Nejcomprehensivnější, ale placený |
| **Hollander Powerlink + Interchange** | US recyklátoři, ~85M+ interchange | Yard management license + Interchange license | ⚠️ US-centric | **★★★★** Přesně náš use case, ale drahé a US |
| **Car-Part.com Interchange** | ~10k+ recyklátorů US | Marketplace fees | ⚠️ US-centric | **★★★** Marketplace, ne čistá DB |
| **PartsTech** | OEM + aftermarket aggregator | Free for shops, suppliers paid | ⚠️ US/CA | **★★★** Repair shop fokus |
| **Levam** | OEM Parts Catalog API | API tier pricing | ✅ Multi-region | **★★★** Modernější, méně dat |
| **Autodoc PRO** (CZ market) | 6,7M produktů, VIN filtr | Free (B2B login) | ✅ CZ od 2014, DC Cheb 2023 | **★★★** Browser-only, žádné public API |
| **17vin.com** | VIN → parts | Pay per query | ⚠️ Asia origin | **★★** Quality nejasné |
| **vehicledatabases.com** | VIN + parts API | Tiered API pricing | ✅ International | **★★★** Vehicle-first |
| **NHTSA vPIC** | US vehicle data | **Free** | ⚠️ US only, vehicle-level | **★★** Už používáme jako VIN fallback |
| **vindecoder.eu** | EU vehicle data | Free tier + paid | ✅ EU | **★★★** Už používáme |

**Praktický závěr:** Pokud uživatel chce **autocomplete formuláře z OEM number** → potřebuje TecDoc kontrakt. Pokud chce jen **uložit naskenovaný kód jako text** → free řešení stačí.

---

## 5. Reálné use cases v ČR/EU

**Co dělají velcí hráči:**
- **Autodoc** (CZ od 2014, DC Cheb 2023) — silná pozice v CZ, AUTODOC PRO má VIN filter na TecDoc-derived datasetu pro profi zákazníky
- **Profi-Auto, Trost, K2 Mobility** — distribuce, ale nemají public catalog API; vlastní webshopy s VIN search
- **Auto-Doplnky.cz, Auta5p.eu, MotoFocus.cz** — menší hráči, žádný technologický odlišovač

**Český trh autovrakovišť:**
- **Search nenašel žádné CZ-specifické "yard management" software** (Hollander typu) — možná gap v trhu, nebo existují pouze offline (Excel, vlastní databáze, papír)
- Velkou roli hrají marketplace: **Sauto díly**, **Hyperinzerce** (kategorie auto-díly), **Bazoš**
- Nikdo z těch marketplace neposkytuje barcode/photo upload feature — vše ručně

→ **Strategická příležitost:** Pokud Carmakler PWA bude **jediná** platforma v CZ s "vyfoť → vyplň formulář" workflow, to je distinct competitive feature, i kdyby accuracy byla jen 70 %. Nikdo jiný to nemá.

---

## 6. Tři varianty doporučení (MIN / STD / MAX)

### MIN — "Foto + OCR text + manual edit" — **0 USD**

**Co dělá:**
- PWA capture button → vrakoviště-uživatel vyfotí samolepku/štítek
- Browser OCR (Tesseract.js, ~2 MB WASM) → extrahuje text → vloží do textového pole "Kód dílu"
- ALTERNATIVE: client-side ML Kit barcode scan (mobile) — pokud je barcode, instant extract
- Uloží se jako `part.code: string` a `part.scannedText: string` na DB
- Search v eshopu pak najde díl podle textu (case-insensitive contains)

**Co NEDĚLÁ:**
- Žádný lookup proti DB výrobce
- Žádná autocompletace formuláře
- Žádné AI matching ("tento kód = Bosch injector pro Passat 2.0 TDI")

**Náklady:**
- Provozní: **$0/měsíc**
- Implementace: malá (knihovna Tesseract.js / ZXing-JS / @zxing/browser, formulářové pole, DB sloupec)
- Závislosti: 1 npm package (Tesseract.js OR @zxing/browser), žádný API key

**Užitek:**
- Vrakoviště rychleji vyplní formulář (kód místo opisování)
- Search funguje "alespoň" — zákazník hledá podle Bosch čísla → najde díl
- Rychlé time-to-ship; nezamykání do žádného vendora

**Realistická accuracy:**
- 70–80 % na čisté stickery
- 30–50 % na vyražené metalické kódy
- 95 % na barcode (pokud je přítomný)

**Risks:**
- Nízký user delight (nezní jako "AI feature") — marketingově slabší
- Vrakoviště musí stejně zkontrolovat výsledek → moderate UX win, ne wow effect

---

### STD — "Foto + AI Vision + TecDoc lookup + autocomplete" — **~$50–150/měsíc + TecDoc kontrakt** — DOPORUČENO

**Co dělá:**
- PWA capture button → vrakoviště-uživatel vyfotí
- **Vrstva 1:** Client-side ML Kit / ZXing barcode scan → pokud je barcode, instant extract
- **Vrstva 2 (fallback):** Foto se pošle na `/api/parts/scan` endpoint → server volá Claude Sonnet 4.5 Vision API se strukturovaným promptem ("Extract: OEM part number, manufacturer, dimensions, condition indicators. Format as JSON.")
- **Vrstva 3:** Extrahovaný OEM part number se queryne proti TecDoc API → vrátí se kanonický název dílu, kategorie, kompatibilní vozidla, výrobce
- Formulář předvyplní pole: `name`, `category`, `manufacturer`, `compatibleVehicles[]`, `oemNumber`
- User pouze zkontroluje, doplní cenu a stav, publikne

**Co NEDĚLÁ:**
- Žádný custom YOLO model (heterogenní vstupy → generic Claude lépe)
- Žádný offline-only flow (TecDoc lookup vyžaduje connectivity)
- Žádné multi-source DB reconciliation

**Náklady:**
- Provozní:
  - Claude Vision: ~$0,005/foto × cca 10 000 fotek/měsíc = **~$50/měsíc**
  - TecDoc license: **kontaktovat TecAlliance/Solera pro quote** (typicky low-thousands EUR/year, závisí na objemu queries)
  - Server compute: zanedbatelné
- Implementace: středně velká (capture flow, scan endpoint, Claude SDK už máme, TecDoc client wrapper, autocomplete UX)
- Závislosti: TecDoc kontrakt (BLOCKING), `@anthropic-ai/sdk` (už máme), volitelně `@zxing/browser` nebo `@capacitor-mlkit/barcode-scanning`

**Užitek:**
- Vrakoviště přidá díl za **30 sekund** místo 5 minut
- Kompatibilita vozidel se vyplní **automaticky** (jinak je to největší pain point — vrakoviště neví přesně, do jakých dalších modelů díl pasuje)
- Eshop má vyšší kvalitu listingů → vyšší konverze
- "AI scan" je marketing-friendly feature

**Realistická accuracy (end-to-end):**
- 85–95 % na čisté stickery (Claude Vision OCR ~95 % × TecDoc match ~90 %)
- 50–70 % na vyražené metalické kódy
- > 95 % na barcode

**Risks:**
- TecDoc kontrakt je vendor lock-in
- Cena Claude Vision škáluje s objemem (10k/měsíc OK, 1M/měsíc začíná bolet)
- Nutná connectivity (vrakoviště v terénu offline → musí jet do kanceláře)
- Mitigace: **lokální cache** TOP 100 výrobců v IndexedDB → 80 % případů řešeno offline

---

### MAX — "Hybridní stack: ML Kit + Claude Vision + Custom YOLO + Multi-source DB" — **~$300–500/měsíc + investice do datasetu**

**Co dělá:**
- Vše co STD
- **Plus vrstva 4:** Vlastní YOLO model trénovaný na 500–2000 fotkách CZ vrakovišťních štítků (Roboflow workflow), nasazený jako serverless inference (Roboflow / Replicate / vlastní)
- **Plus vrstva 5:** Multi-source reconciliation — pokud TecDoc nemá match, fallback na Hollander API (US dílky), Levam, Autodoc PRO scrape
- **Plus vrstva 6:** Offline cache TOP 100 výrobců v IndexedDB (Service Worker přednahrá při registraci PWA) — 80 % offline coverage
- **Plus vrstva 7:** ML reconciliation (různé OCR výsledky se vzájemně validují, agregují confidence scores)
- Audit log pro každý scan (foto, OCR výsledek, DB match, user oprava) → continuous learning dataset

**Co NEDĚLÁ:**
- Nic — to je komplet všechno, co dnes lze udělat

**Náklady:**
- Provozní:
  - Claude Vision: ~$50/měsíc
  - Cloud Vision (validation): ~$15/měsíc
  - Custom YOLO inference: ~$50–100/měsíc (Roboflow Hosted, Replicate, nebo vlastní GPU)
  - TecDoc license: low-thousands EUR/year
  - Hollander/Levam: další license fees
  - Servery + storage: ~$50/měsíc
- One-time investice:
  - Sběr a anotace 500–2000 fotek (interní práce + Roboflow Annotate)
  - Trénink YOLO modelu (Roboflow tier nebo vlastní GPU)
  - Setup multi-source pipeline (TecDoc + Hollander + cache + reconciliation)
- Implementace: **velká** (multi-stage pipeline, custom model lifecycle, cache invalidation, audit logging, fallback strategy)
- Závislosti: Roboflow account, Hollander/Levam kontrakty, GPU compute, ML ops znalost

**Užitek:**
- 95–98 % accuracy ve většině případů
- Funguje offline pro 80 % případů (cache)
- Continuous learning — model se zlepšuje s každým scanem
- Distinct competitive moat (žádný CZ konkurent toto nemá)

**Realistická accuracy:**
- 95–98 % na čisté i lehce poškozené stickery
- 75–90 % na vyražené metalické kódy (custom YOLO si poradí s low-contrast lépe než generic LLM)
- > 99 % na barcode
- Edge cases (úplně nečitelné štítky) — fallback na manuální zadání s OCR hint

**Risks:**
- **Vysoké náklady i complexity** vs. user base — pro 5 vrakovišť to nemá ROI
- Vendor lock-in × 3 (TecDoc, Hollander, Roboflow)
- ML ops zátěž (model retraining, drift detection)
- Time-to-ship: značně delší než STD
- Pokud se vrakoviště feature nechytí → ztracená investice

---

## 7. Open questions pro uživatele (lead → uživatel)

Tyto otázky lead potřebuje zodpovědět **před** dispatchem implementace, jinak nelze rozhodnout mezi MIN/STD/MAX:

1. **Budget pro provozní náklady?**
   - 0 EUR/měsíc → MIN je jediná možnost
   - 50–200 USD/měsíc → STD bez TecDoc (jen Claude Vision OCR + manuální vyplnění formuláře)
   - 200+ USD/měsíc + ochota platit TecDoc kontrakt (low-thousands EUR/year) → STD plně
   - 500+ USD/měsíc + interní ML kapacita → MAX

2. **Target accuracy?**
   - 60 % stačí (uživatel zkontroluje a opraví) → MIN
   - 85–90 % (semi-autonomous) → STD
   - 95 %+ (téměř bez korekce) → MAX nebo specializovaná industrial vision

3. **Kolik vrakovišť používá platformu dnes/za 6 měsíců?**
   - 1–10 → MIN je jediné, co má ekonomický smysl
   - 10–50 → STD se vyplatí
   - 50+ → MAX dává smysl

4. **Jaké typy dílů jsou nejčastější?**
   - Motory, převodovky, ECU → vyražené čísla na metalu (HARD pro AI)
   - Světla, zrcátka, bumpery → tištěné stickery + někdy barcody (EASY)
   - Karoserní díly → většinou bez kódu, jen vrakovišťní vlastní štítek
   - **Pokud převažují HARD typy → MAX je odůvodněn**
   - **Pokud převažují EASY typy → MIN/STD stačí**

5. **Connectivity vrakoviště v terénu?**
   - Vrakoviště přidává díly v kanceláři s WiFi → online STD/MAX OK
   - Vrakoviště přidává díly přímo u rozebíraného auta v terénu → potřebuje **offline-first** flow → MIN nebo MAX (s cachí)

6. **Existuje preferovaný path proti vendor lock-inu?**
   - Pokud ANO → MIN (žádný vendor) nebo STD bez TecDoc (jen Claude API, kterou už máme)
   - Pokud nevadí → STD/MAX s TecDoc je rychlejší cesta

7. **Marketingový tlak na "AI feature" pro investory/zákazníky?**
   - Vysoký → STD/MAX je sellable jako "AI scan parts"
   - Nízký → MIN funkčně stačí

---

## 8. Doporučení plánovače

**Pokud uživatel nemá jasný budget:** začni s **MIN** jako proof-of-concept (Tesseract.js / ZXing-JS, 0 USD). Měřte:
- Kolik vrakovišť to skutečně používá
- Jaká je real-world accuracy
- Kolik fotek měsíčně
- Kolik chyb user opravuje

Po 1–2 měsících měření rozhodneme, zda upgradovat na STD.

**Pokud uživatel chce wow effect ihned:** STD bez TecDoc — Claude Vision OCR + autocomplete pole formuláře (název dílu, výrobce z fotky), zbytek user vyplní. To je ~$50/měsíc, žádný vendor kontrakt, viditelný "AI" benefit.

**MAX nedoporučuju** dokud Carmakler nemá ≥50 aktivních vrakovišť a clear product-market fit. ROI nedává smysl pro malou user base.

---

## 9. Klíčová zjištění (executive summary)

1. ✅ **Štítky NEJSOU standardizované** — 5+ typů, fragmentace per výrobce
2. ✅ **AI Vision dobře čte tištěné stickery** (~95 %), špatně vyražené metalické kódy (~50 %)
3. ✅ **TecDoc existuje s 110M dílů**, ale je placené (low-thousands EUR/year) — *ne-MUST mít*
4. ✅ **Hollander Interchange** je přesně náš use case, ale US-centric
5. ✅ **V CZ neexistuje žádný "yard management" SaaS** — gap v trhu = competitive opportunity
6. ✅ **Free offline řešení (ML Kit + ZXing + Tesseract.js) zvládne 70–80 %** — MIN varianta má reálnou hodnotu
7. ✅ **Doporučení: Start MIN → měř → upgrade na STD pokud má smysl**
8. ⚠️ **Bez odpovědí na 7 open questions nelze definitivně rozhodnout** — lead musí probrat s uživatelem

---

## 10. Sources (web research)

**OEM part numbering:**
- [Identifying Bosch Fuel Injection Part Numbers — Denco Diesel](https://www.dencodiesel.com/pages/identifying-bosch-part-numbers)
- [Bosch automotive electronics labeling spec (PDF)](https://assets.bosch.com/media/global/bosch_group/purchasing_and_logistics/information_for_business_partners/downloads/logistics_docs/mat_label/specific-arrangements-for-automotive-electronics.pdf)
- [Denso Cross Reference](https://www.densoproducts.com/using-the-denso-cross-reference)

**Standardy / barcode:**
- [Automotive Barcode Guide — Seagull Scientific](https://barcodeguide.seagullscientific.com/Content/Ind_Automotive.htm)
- [AIAG B-4 Parts Identification Standard](https://www.aiag.org/training-and-resources/manuals/details/B-4)
- [GS1 Verified by GS1](https://www.gs1.org/services/verified-by-gs1)
- [Scanbot SDK — AIAG labels](https://scanbot.io/blog/what-are-aiag-labels/)

**Casting numbers:**
- [Ford V8 Casting Numbers Guide — EngineLabs](https://www.enginelabs.com/tech-stories/a-guide-to-ford-v8-engine-block-casting-numbers-1952-1996/)
- [Small Block Chevy Casting ID](https://nastyz28.com/sbchevy/sblock.html)
- [Mopar V8 Casting Numbers](https://www.enginelabs.com/engine-tech/a-guide-to-mopar-v8-cylinder-head-and-block-casting-numbers/)

**AI/Vision:**
- [Claude Vision API Docs](https://platform.claude.com/docs/en/build-with-claude/vision)
- [Claude vs GPT-4o OCR Benchmark — CodeSOTA](https://www.codesota.com/ocr/claude-vs-gpt4o-ocr)
- [OmniAI OCR Benchmark](https://getomni.ai/blog/ocr-benchmark)
- [Top 5 Vision LLMs for OCR 2025 — DocsRouter](https://docs.docsrouter.com/blog/top-5-vision-llms-for-ocr-in-2025-ranked-by-elo-score)
- [OCR Accuracy Benchmark — AImultiple](https://aimultiple.com/ocr-accuracy)
- [Google Cloud Vision OCR docs](https://docs.cloud.google.com/vision/docs/ocr)
- [Roboflow YOLOv8 training guide](https://blog.roboflow.com/how-to-train-yolov8-on-a-custom-dataset/)
- [Tesseract.js performance docs](https://github.com/naptha/tesseract.js/blob/master/docs/performance.md)
- [Tesseract.js project](https://tesseract.projectnaptha.com/)
- [ML Kit Barcode Scanning](https://developers.google.com/ml-kit/vision/barcode-scanning)
- [ZXing JS Library](https://github.com/zxing-js/library)

**Commercial DBs / API:**
- [TecAlliance — TecDoc Catalogue](https://www.tecalliance.net/tecdoc-catalogue/)
- [Hollander Solutions](https://www.hollandersolutions.com/products/)
- [Solera — Hollander page](https://www.solera.com/solutions/vehicle-repair/hollander/)
- [Car-Part Interchange (via TecDoc data delivery)](https://www.tecalliance.net/tecdoc-data-delivery/)
- [PartsTech Auto Parts Search](https://partstech.com/)
- [Levam OEM Parts Catalog API](https://levam.net/)
- [NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/)
- [Autodoc PRO](https://autodoc.pro/signin)
- [Autodoc Group — about](https://autodoc.group/en/about-us/)
- [YardSmart — junkyard software](https://yardsmartapp.com/solutions/)

**AI v auto recyklaci:**
- [How AI Is Transforming the Auto Salvage Industry — Southern Imports blog](https://blog.southernimportspecialist.com/index.php/2025/08/01/how-ai-is-transforming-the-auto-salvage-industry-worldwide-from-efficiency-to-eco-impact/)
- [Auto Recyclers Scale Sales Using AI — Auto PARTnered Solutions](https://www.autopartneredsolutions.com/blog2/auto-recyclers-scale-sales-amp-profit-using-ainbspnbsp)
- [URG — AI in Car Wrecking](https://u-r-g.com/ai-and-automation-in-the-car-wrecking-industry/)
- [LandingAI — Computer Vision in Automotive](https://landing.ai/industries/automotive)

**Existing apps:**
- [Foogle Tech Part Identifier](https://foogletech.com/identify-any-part-with-part-identifier/)
- [Car Part Identifier (App Store)](https://apps.apple.com/us/app/car-part-identifier/id6738489603)

---

**Konec research dokumentu.** Žádný kód, žádný plán implementace — čistě data + 3 varianty + open questions pro leada → uživatele.
