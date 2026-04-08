# Plán #156 — Donor car flow + Smart Inventory Assistant (#88-equivalent slice)

**Typ:** Research + implementační plán (žádný kód v tomto dokumentu, NE bash kromě file ops)
**Datum:** 2026-04-08
**Plánovač:** planovac
**Priorita:** BACKLOG — implementator pracuje na #88a, #156 čeká na explicit user approval
**Parent:** #76v2 AI Part Scanner (donor car flow se stane primary entry point, individuální díly jeden z výstupů)
**Související sliced plans:** `plan-task-154-88a-wolt-dispatch.md` (commission infrastructure — #155 in-flight), `#88b` Vision OCR (předpokládaný), `#88c` voice input (předpokládaný)

---

## 0. Strategická directive (zachyceno doslovně z memory)

> **Zdroj:** `/Users/zen/.claude/projects/-Users-zen-Projects-cmklv2-cmklv2/memory/project_donor_car_flow.md`
> **Rozhodnuto:** 2026-04-08 s uživatelem

Vrakoviště dnes inzerují bourané auta na Sbazaru **bez fotodokumentace dílů a bez evidence** ("přijeďte uvidíte"). Carmakler tento workflow přejme a udělá ho strukturovaným — **donor car listing se stává paralelní category vedle individuálních dílů**.

**Klíčové prvky:**

1. **Smart appraiser flow** (ne formulář): VIN scan → výbavová databáze → guided interview ("auto bouráno na předek → ptej se na kapotu, nárazník, světla; výbava říká xenony → upozorni majitele že jsou drahé"). 5-8 minut → 20-30 dílů z 1 auta s individuálními stavy.

2. **Hybrid pricing** (flea market model): Každý díl má volitelnou cenu. Vyplněná → standard checkout + commission flow. Prázdná → "Cena dohodou", buyer dostane kontakt, transakce off-platform (akceptujeme leakage). Eshop (`/dily`) ZŮSTÁVÁ čistá e-commerce zone s povinnými cenami — donor car flow je separátní marketplace surface.

3. **Inventory management as a service**: Vrakoviště dostane evidenci aut + dílů + leadů + papírování ZDARMA. Carmakler bere commission jen z dílů co projdou checkoutem (Wolt model). Lock-in přes utility, ne přes smlouvu — vrakoviště nikdy nepřejde na Excel zpátky, protože by ztratilo evidenci.

4. **Status workflow donor car**: `INTAKE → LISTED → PARTIAL → DEPLETED → SCRAPPED`

5. **Content seeding strategy**: Vrakoviště nahodí 30 stávajících bouráků z dvora za hodinu (s pomocí AI Vision z fotek = #88b). Z 50 vrakovišť na pilotu = 12 000 nabídek v týdnu 1. Řeší marketplace chicken-and-egg problém.

**Proč je to zásadní:**
- Diferenciace vs Sbazar/Sauto: ti jsou pasivní inzerce. My jsme operating system + marketplace.
- Compliance value: vrakoviště má regulatorní povinnost evidovat vozidla a díly — Carmakler to zajistí zdarma.
- Network/data effect: víc vrakovišť → víc dat o cenách → AI Price Valuation lepší než kdokoliv v EU.
- Adoption friction = 0: vrakoviště to musí evidovat tak jako tak, a my to děláme rychleji než Excel/papír.

**How to apply (z memory):**
- Donor car flow je nový major task, vlastní research → plan → impl pipeline.
- NESMÍ se přidávat ad-hoc do #88a (commission infra) ani #88b (Vision OCR) — má vlastní scope a UX patterns.
- Při plánování PWA pro vrakoviště je nutné zvážit donor car flow jako **primary entry point ne jako extension**.
- Při refactoru #76 parent plánu (AI Part Scanner) je donor car flow **centrální vstup, individuální díly jsou jeden z výstupů**.
- Eshop (`/dily`) má **JASNÉ ceny**. Donor car listingy mají optional ceny. **Nikdy nemíchat tyto dva flowy v jednom UI** — jsou to dvě různé conversion funnels.
- Při dotazování plánovače na donor car flow vždy zmínit smart appraiser concept (VIN → výbava → guided interview), ne jen "checklist".

---

## 1. Executive summary

**Co #156 přidává:**
- **Nový `DonorCar` Prisma model** (parent) + rozšíření existujícího `Part` modelu o nullable `donorCarId` (child relation) a `pricingMode` (PRICED / NEGOTIABLE) pro hybrid pricing.
- **Nový PWA flow `/parts/donor-cars/new`** — Smart Inventory Assistant: VIN scan → vindecoder.eu (reuse `lib/vin-decoder.ts`) → výbavový lookup → guided interview engine → batch generování 20-30 Parts z 1 auta s individuálními stavy a cenami.
- **Nová public route `/dily/donor-cars/[slug]`** — separátní marketplace surface pro celé bourané auta s seznamem extractable dílů (priced + negotiable).
- **Rule-based guided interview engine** (deklarativní JSON pravidla, NE hardcoded) — na základě `damageArea` (front/rear/left/right/top) + `knownEquipment` (xenon, kůže, atd.) vytvoří dynamic checklist otázek pro každou sekci auta.
- **Eshop boundary enforcement** — `/dily` listing query MUSÍ filtrovat `pricingMode = PRICED AND price > 0 AND donorCarId IS NULL OR status = LISTED`. Donor car parts s `pricingMode = NEGOTIABLE` se nezobrazují v eshopu (separátní funnel).
- **Commission integration reuse** — donor car listingy využijí `#88a` infrastrukturu (Partner.commissionRate + OrderItem snapshot fields + Stripe Connect split). NEGOTIABLE parts = zero commission (off-platform).
- **Status workflow lifecycle** — `INTAKE → LISTED → PARTIAL → DEPLETED → SCRAPPED` s automatickou progresí na základě počtu sold/scrapped child Parts.

**Co #156 NEPŘIDÁVÁ (OUT OF SCOPE, viz §13):**
- Content seeding script (Vision OCR z fotek auta) — zůstává v **#88b scope** (Vision OCR endpoints).
- Voice-guided interview — zůstává v **#88c scope** (voice input).
- Parts TecDoc integration — #76v2 explicitně vynechal pro MVP.
- QR label printing pro donor cars — navazuje na #76v2 §5.4 (per-part PDF), donor car má vlastní QR až v v2.

**Závislosti:**
- **HARD DEPENDENCY:** `#155` (#88a Wolt model) musí být merged. Donor car flow reuse `Partner.commissionRate`, `OrderItem.commissionRateApplied/carmaklerFee/supplierPayout`, `applyCommissionSplit()` webhook helper.
- **SOFT DEPENDENCY:** #88b Vision OCR je výhoda pro content seeding, ale MVP #156 funguje i ručně (vrakoviště vyplní guided interview text-only, odhad 10 min per car).

**Velikost:** Comparable k #88 (5-tier scanner), ale jinak zaměřené — MVP odhad 5 fází (viz §13).

---

## 2. Smart appraiser flow — VIN → výbava → guided interview

### 2.1 Flow diagram

```
┌──────────────────────────────────────────────────┐
│ /parts/donor-cars/new (PWA entrypoint, NEW)       │
│ Vrakoviště klikne "Přidat bourané auto"           │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│ STEP 1 — VIN scan                                 │
│ - Camera capture → OCR (reuse MVP = manual type)  │
│ - Or manual input 17 chars                        │
│ - Validate Luhn/format                            │
│ - POST /api/vin/decode (existing endpoint)        │
│   → Reuse lib/vin-decoder.ts                      │
│   → Returns: brand, model, year, fuel, power,    │
│     bodyType, equipment raw                       │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│ STEP 2 — Damage input                             │
│ - Otázka: "Odkud je auto bouráno?"                │
│ - Multi-select checkboxy:                         │
│   [ ] Předek   [ ] Zadek    [ ] Levý bok          │
│   [ ] Pravý bok [ ] Střecha [ ] Spodek            │
│   [ ] Interier  [ ] Motor   [ ] Nevím             │
│ - Volitelná poznámka (textarea)                   │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│ STEP 3 — Equipment confirmation                   │
│ - Z VIN lookup získaná výbava:                    │
│   ○ Xenony (bývá drahé — ~3-8k/ks)                │
│   ○ Kožené sedačky                                │
│   ○ Automatická klimatizace                       │
│   ○ Navigace                                      │
│   ○ Panoramatická střecha                         │
│ - User potvrdí ANO/NE (confidence check)          │
│ - Add custom: "Co jiného tam je?"                 │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│ STEP 4 — Guided interview (rule-based engine)     │
│ - Engine input:                                   │
│   { damageAreas, knownEquipment, brand,           │
│     model, year, bodyType }                       │
│ - Engine output: ordered list of questions        │
│   grouped by body section                         │
│ - Per otázka: short form (ANO / NE / stav 1-5)    │
│ - Příklad run:                                    │
│   "Auto bouráno na předek + xenony"               │
│   → sekce FRONT:                                  │
│      Q1: Kapota — stav? [1=ok, 5=šrot]            │
│      Q2: Přední nárazník — stav?                  │
│      Q3: Levý přední světlomet (xenon) — stav?    │
│      Q4: Pravý přední světlomet (xenon) — stav?   │
│      Q5: Chladič — stav?                          │
│      Q6: Přední blatník L — stav?                 │
│      Q7: Přední blatník P — stav?                 │
│   → sekce DRIVETRAIN (nezávislé na damage):       │
│      Q8: Motor — běží? Najeto km?                 │
│      Q9: Převodovka — stav?                       │
│      Q10: Palivový systém — OK?                   │
│   → sekce INTERIOR:                               │
│      Q11: Kožené sedačky vpředu — stav?           │
│      Q12: Kožené sedačky vzadu — stav?            │
│      Q13: Airbagy spustily? (ano = sepsat pak ne) │
│      Q14: Navigace/rádio — funkční?               │
│      Q15: Volant + řadicí páka — stav?            │
│      Q16: Přístrojová deska — prasklá?            │
│   → sekce ELECTRICAL:                             │
│      Q17: ECU — funkční? (drahé: 5-15k)           │
│      Q18: Alternátor                              │
│      Q19: Startér                                 │
│      Q20: Startovací klíč + imobilizér            │
│   → sekce OTHER:                                  │
│      Q21-Qn: kola, brzdy, katalyzátor, výfuk,     │
│               nápravy, zrcátka, atd.              │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│ STEP 5 — Price batch                              │
│ - Pro každý díl, kde user označil "lze prodat":   │
│   [ ] Cena: ___ Kč    [ ] Cena dohodou            │
│ - Bulk actions:                                   │
│   "Vše cena dohodou"  "Vyplnit AI odhad"          │
│   (AI odhad = out of MVP, jen UI placeholder)     │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│ STEP 6 — Photo upload (optional bulk)             │
│ - Fotka celého auta (max 6)                       │
│ - Nahání se pro DonorCar entity                   │
│ - Per-part fotky = v2 feature                     │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│ STEP 7 — Review + publish                         │
│ - Summary: "Generuji 23 dílů z auta"              │
│ - Seznam: name + cena/dohoda + stav               │
│ - [Publikovat všechny]                            │
└───────────────┬──────────────────────────────────┘
                │
                ▼
        POST /api/donor-cars (NEW)
                │
                ▼
┌──────────────────────────────────────────────────┐
│ Backend transaction:                              │
│ 1. Create DonorCar (status=INTAKE→LISTED)         │
│ 2. For each answer where sellable=true:           │
│    - Create Part (category, condition, price OR   │
│      negotiable, donorCarId=new.id)                │
│    - PartImage inherit from DonorCar (v1)         │
│ 3. Commit + return DonorCar{id, parts[]}          │
└───────────────┬──────────────────────────────────┘
                │
                ▼
        Redirect → /parts/donor-cars/[slug] (detail + edit)
```

### 2.2 Smart appraiser rules — implementace

**File:** `lib/donor-cars/interview-rules.json` (nový, declarative)

```json
{
  "version": 1,
  "sections": [
    {
      "id": "FRONT",
      "label": "Přední část",
      "triggeredBy": { "damageAreas": ["FRONT"] },
      "questions": [
        { "id": "front_hood", "name": "Kapota", "category": "BODY" },
        { "id": "front_bumper", "name": "Přední nárazník", "category": "BODY" },
        { "id": "front_light_left", "name": "Levý přední světlomet", "category": "ELECTRICAL",
          "priceHint": { "ifEquipment": "xenon", "range": [3000, 8000] } },
        { "id": "front_light_right", "name": "Pravý přední světlomet", "category": "ELECTRICAL",
          "priceHint": { "ifEquipment": "xenon", "range": [3000, 8000] } },
        { "id": "front_radiator", "name": "Chladič", "category": "COOLING" },
        { "id": "front_fender_left", "name": "Přední blatník L", "category": "BODY" },
        { "id": "front_fender_right", "name": "Přední blatník P", "category": "BODY" },
        { "id": "front_grill", "name": "Maska chladiče", "category": "BODY" }
      ]
    },
    {
      "id": "DRIVETRAIN_ALWAYS",
      "label": "Pohonná jednotka",
      "triggeredBy": { "always": true },
      "questions": [
        { "id": "engine_runs", "name": "Motor (běžel při havárii?)", "category": "ENGINE",
          "valueHint": "drahé: 30-80k", "highValue": true },
        { "id": "transmission", "name": "Převodovka", "category": "TRANSMISSION", "highValue": true },
        { "id": "ecu", "name": "ECU jednotka", "category": "ELECTRICAL", "highValue": true,
          "priceHint": { "range": [5000, 15000] } },
        { "id": "alternator", "name": "Alternátor", "category": "ELECTRICAL" },
        { "id": "starter", "name": "Startér", "category": "ELECTRICAL" },
        { "id": "catalyst", "name": "Katalyzátor", "category": "EXHAUST", "highValue": true,
          "priceHint": { "range": [4000, 20000] } }
      ]
    },
    {
      "id": "INTERIOR_LEATHER",
      "label": "Interiér (kožené)",
      "triggeredBy": { "knownEquipment": ["leather_seats"] },
      "questions": [
        { "id": "seats_front_l", "name": "Kožená sedačka L", "category": "INTERIOR" },
        { "id": "seats_front_r", "name": "Kožená sedačka P", "category": "INTERIOR" },
        { "id": "seats_rear", "name": "Zadní kožená lavice", "category": "INTERIOR" },
        { "id": "airbags_deployed", "name": "Airbagy vystřelily?", "category": "INTERIOR",
          "control": "boolean", "blocksSale": ["dashboard"] }
      ]
    }
    /* ... další sekce: REAR, LEFT, RIGHT, TOP, ELECTRICAL_ALWAYS, WHEELS_ALWAYS, ... */
  ]
}
```

**Engine logic** (pseudocode, implementace v `lib/donor-cars/interview-engine.ts`):

```
function buildChecklist(input: { damageAreas, knownEquipment, brand, model, year, bodyType }): Question[] {
  const rules = loadInterviewRules();
  const triggered = [];
  for (const section of rules.sections) {
    if (section.triggeredBy.always) {
      triggered.push(section);
      continue;
    }
    if (section.triggeredBy.damageAreas?.some(d => input.damageAreas.includes(d))) {
      triggered.push(section);
      continue;
    }
    if (section.triggeredBy.knownEquipment?.some(e => input.knownEquipment.includes(e))) {
      triggered.push(section);
    }
  }
  // Flatten + dedupe by question.id + filter by bodyType exclusions
  return flattenAndDedupe(triggered, input);
}
```

**Deklarativní rules = ZÁMĚR.** Engine je čistý TypeScript (~200 řádků), rules jsou JSON config editovatelný bez rebuildu. Hardcode pravidla do TS kódu = **anti-pattern** (ztráta flexibility pro business team).

### 2.3 VIN + výbava — reuse vs research

**Reuse (existující):**
- `lib/vin-decoder.ts` — vindecoder.eu primary + NHTSA fallback. **Už funguje.**
- `app/api/vin/decode/route.ts` — POST endpoint (session-protected pro brokery; pro vrakoviště rozšířit whitelist rolí o `PARTS_SUPPLIER` + `PARTNER_VRAKOVISTE`).

**Problém:** vindecoder.eu vrací **základní výbavu** (fuel, transmission, power, doors, seats), ale NE **detailní opcion list** (xenony, kožené sedačky, panoráma, ECU typ). To je tier-2 feature — typicky za příplatek ("vindecoder.eu packages" endpoint).

**Možnosti pro detailní výbavu:**

| Option | Popis | Cena | MVP? |
|---|---|---|---|
| A | Upgrade vindecoder.eu subscription na "packages" endpoint | ~€50/měs | MAYBE — pilot validation |
| B | User manual confirmation (STEP 3) místo auto-lookup | Free | **ANO pro MVP** |
| C | Vlastní dataset (CSV z Autokelly/TecDoc) | Velký effort + licensing | NE — out of scope |
| D | Claude Sonnet + web search ("Škoda Octavia 2 2015 typická výbava") | ~$0.01/lookup | MAYBE — fáze 2 |

**Doporučení MVP:** **Option B** — user klikne přes checkbox list equipment ze standard enum (xenon, LED, leather_seats, automatic_climate, navigation, sunroof, panoramic_roof, heated_seats, cruise_control, parking_sensors, ...). Vrakoviště pracovník ví, co v autě je (fyzicky ho vidí), takže manual confirmation je rychlejší než jakákoli AI inference a bezchybná.

Option A/D necháváme jako **v2 enhancement** — není blocker pro MVP.

---

## 3. Database typických dílů per model

### 3.1 Co potřebujeme

Aby guided interview mohl navrhnout "z tohoto auta lze vytáhnout tyhle díly", potřebujeme **univerzální seznam dílových kategorií per body type** (sedan vs SUV vs hatchback mají různé setups). Konkrétní model-specific díly (např. "Octavia 3 má MQB platformu") jsou **out of MVP scope** — vrakoviště pracovník to ví.

### 3.2 Zdroje dat — co reálně existuje

| Zdroj | Typ | Použitelné? | Cena | MVP? |
|---|---|---|---|---|
| **Vlastní seed** (~100 základních kategorií × body type) | Hand-curated JSON | **ANO** | Free | **ANO** |
| TecDoc katalogová data | B2B, licensovaný | NE v MVP | €€€ (roční licence ~€10k) | NE |
| Autokelly / Autodíly24 eshop scrape | Public, ale proti TOS | NE (viz memory `feedback_no_competitor_scraping`) | — | NE |
| eBay Motors parts taxonomy | Public JSON/XML export | MAYBE (pro kategorizaci) | Free | Post-MVP |
| Car-part.com (US reuse network) | Public HTML | MAYBE kompetitivní research | Free | Post-MVP |
| Claude Sonnet + knowledge base | AI inference | MAYBE pro gaps | ~$0.005/call | Fáze 2 |

**Doporučení MVP:** **Vlastní seed** v `lib/donor-cars/parts-catalog.json`.

### 3.3 Seed dataset structure

```json
{
  "version": 1,
  "bodyTypes": {
    "SEDAN": {
      "sections": {
        "BODY": ["Kapota", "Kufr dveře", "Přední dveře L/P", "Zadní dveře L/P", "Blatníky", "Prahy", ...],
        "FRONT": ["Kapota", "Nárazník", "Světlomety L/P", "Mlhovky", "Maska", "Chladič", ...],
        "REAR": ["Kufr dveře", "Zadní nárazník", "Zadní světla L/P", "Výfuk koncovka", ...],
        "INTERIOR": ["Sedačky přední L/P", "Sedačky zadní", "Palubní deska", "Volant", ...],
        "ELECTRICAL": ["ECU", "Alternátor", "Startér", "Airbag volant", "Airbagy boční", ...],
        "DRIVETRAIN": ["Motor", "Převodovka", "Poloosy", "Kardanová hřídel"],
        "WHEELS": ["Disky 4ks", "Pneumatiky 4ks", "Brzdy přední", "Brzdy zadní", ...]
      }
    },
    "HATCHBACK": { /* ... */ },
    "COMBI": { /* ... */ },
    "SUV": { /* ... */ },
    "COUPE": { /* ... */ },
    "VAN": { /* ... */ }
  },
  "bodyTypeFallback": "SEDAN"
}
```

**Rozsah:** ~80-120 položek × 6 body types = **~500-700 možných otázek**, ale interview engine z toho vyfiltruje jen triggered sections (typicky 20-40 per run).

**Maintenance:** Ročně review + editace JSON. Žádný deploy nutný (JSON import).

### 3.4 Kde získat initial seed

**Doporučení:** Plánovač + uživatel + vrakoviště pilot (viz §10 Content seeding) dohromady sepíšou initial JSON za 1-2 seance. Ne web scraping, ne AI generation. Vrakoviště ví, co vidí na dvoře, a to je ground truth.

**Zapsané do plánu jako pre-MVP ritual, NE jako code task.**

---

## 4. Prisma schema — `DonorCar` + `Part` relation

### 4.1 Nový model `DonorCar`

```prisma
// === NOVÉ PRO #156 ===
model DonorCar {
  id          String   @id @default(cuid())
  slug        String   @unique                  // public URL slug
  supplierId  String                            // User (PARTS_SUPPLIER / PARTNER_VRAKOVISTE)
  supplier    User     @relation("SupplierDonorCars", fields: [supplierId], references: [id])

  // VIN + základní identifikace (snapshot z vindecoder.eu)
  vin         String                            // 17 chars, NE unique (stejný VIN lze teoreticky přidat 2× různými supplier)
  brand       String
  model       String
  variant     String?
  year        Int
  bodyType    String?                           // SEDAN / HATCHBACK / COMBI / SUV / COUPE / CABRIO / VAN / PICKUP
  fuelType    String?
  transmission String?
  enginePower Int?
  engineCapacity Int?

  // Poškození
  damageAreas Json                              // ["FRONT", "REAR", ...]
  damageNote  String?

  // Výbava (confirmed by user)
  equipment   Json                              // ["xenon", "leather_seats", "navigation", ...]

  // Lokace (inherit from supplier Partner record, ale denormalized pro public listing)
  city        String?
  region      String?

  // Popis + fotky
  description String?
  photos      DonorCarPhoto[]

  // Status workflow
  status      String   @default("INTAKE")       // INTAKE | LISTED | PARTIAL | DEPLETED | SCRAPPED
  listedAt    DateTime?                         // kdy přepnuto INTAKE → LISTED
  depletedAt  DateTime?                         // kdy PARTIAL → DEPLETED (všechno prodáno / vyhozeno)
  scrappedAt  DateTime?                         // kdy DEPLETED → SCRAPPED (do šrotu)

  // Scrap doklad — compliance audit trail (viz §9)
  certificateOfDestructionNumber String?        // číslo "potvrzení o převzetí k likvidaci" (§10 vyhl. 345/2021)

  // Stats
  viewCount   Int      @default(0)

  // Relations
  parts       Part[]                            // inverse relation — viz §4.2

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([supplierId])
  @@index([status])
  @@index([brand, model, year])
  @@index([city])
}

model DonorCarPhoto {
  id         String  @id @default(cuid())
  donorCarId String
  donorCar   DonorCar @relation(fields: [donorCarId], references: [id], onDelete: Cascade)
  url        String                              // Cloudinary URL
  order      Int     @default(0)
  isPrimary  Boolean @default(false)
  createdAt  DateTime @default(now())

  @@index([donorCarId])
}
```

### 4.2 Rozšíření existujícího `Part` modelu

```prisma
model Part {
  // ... existing fields (lines 889-954) ...

  // === NOVÉ PRO #156 ===
  donorCarId   String?
  donorCar     DonorCar? @relation(fields: [donorCarId], references: [id], onDelete: SetNull)
  // SetNull místo Cascade — když donor car přejde na SCRAPPED, extracted + prodané díly musí persistovat (audit, reklamace)

  pricingMode  String   @default("PRICED")  // PRICED | NEGOTIABLE
  // PRICED   = povinná `price`, zobrazeno v /dily eshopu
  // NEGOTIABLE = volitelná price, zobrazeno jen v /dily/donor-cars/[slug] detailu
  //             NESMÍ se vyskytovat v /dily listing

  interviewQuestionId String?  // reference do interview-rules.json pro traceability (nullable, optional)

  @@index([donorCarId])
  @@index([pricingMode])
}
```

**KRITICKÉ pravidla:**
1. `Part.donorCarId NULL` = samostatný díl (existing flow z #76v2 scanner nebo feedConfig import).
2. `Part.donorCarId != NULL AND pricingMode = "PRICED"` = extract díl s cenou, viditelný v `/dily` eshopu + `/dily/donor-cars/[slug]` detailu.
3. `Part.donorCarId != NULL AND pricingMode = "NEGOTIABLE"` = extract díl "cena dohodou", viditelný **JEN** v `/dily/donor-cars/[slug]`. NENÍ v `/dily` listing query (viz §7).
4. `onDelete: SetNull` — když DonorCar status přejde na SCRAPPED a je fyzicky smazán, prodané Part rows persistují jako "orphaned" (ale už byly prodány, takže audit je intact přes OrderItem).

### 4.3 Status workflow automation

**Triggery:**
- `INTAKE → LISTED` — automaticky při publish (user clicks "Publikovat") nebo manually (admin UI).
- `LISTED → PARTIAL` — automaticky v `POST /api/orders` webhook po úspěšné platbě za první part z této donor car (COUNT(part.status = SOLD) ≥ 1).
- `PARTIAL → DEPLETED` — automaticky když COUNT(part.status IN (SOLD, INACTIVE)) = COUNT(parts). Tj. všechny díly buď prodané nebo vyřazené.
- `DEPLETED → SCRAPPED` — **manuální** button "Odeslat do šrotu" v PWA + povinný input `certificateOfDestructionNumber` (viz §9 compliance).

**Implementace:** `lib/donor-cars/status-machine.ts` (~80 řádků). Volá se z webhook handleru (`/api/stripe/webhook` extension) + manual admin endpoint (`PATCH /api/donor-cars/[id]/status`).

### 4.4 Migration command

```bash
npx prisma migrate dev --name add_donor_cars_and_part_pricing_mode
```

**Pozn.:** Všechny changes jsou **additive** (žádné drop column, žádné NOT NULL bez default). Existing `Part` rows dostanou `pricingMode = "PRICED"` default. **Zero-downtime safe.**

---

## 5. UX flow — wireframes (ASCII)

### 5.1 `/parts/donor-cars/new` — Step 1 VIN

```
┌─────────────────────────────────────────┐
│  ← Zpět                                  │
│                                          │
│  Nové bourané auto                       │
│  Krok 1/7 — VIN                          │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  📷  Vyfotit VIN štítek            │  │
│  └────────────────────────────────────┘  │
│  nebo                                    │
│  ┌────────────────────────────────────┐  │
│  │  WAUZZZ4G8DA123456                 │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Pokračovat →]                          │
└─────────────────────────────────────────┘
```

### 5.2 Step 4 — Guided interview section

```
┌─────────────────────────────────────────┐
│  Krok 4/7 — Průzkum dílů                 │
│  ─────────────────────────────           │
│  Přední část (bourán předek)  ▲          │
│  ─────────────────────────────           │
│                                          │
│  Kapota                                  │
│  Stav:  ● Nelze prodat                   │
│         ○ Poškozená ale prodejná          │
│         ○ OK                              │
│                                          │
│  Přední nárazník                         │
│  Stav:  ○ Nelze prodat                   │
│         ● Poškozený ale prodejný          │
│         ○ OK                              │
│  Poznámka: [Oděrky na levé straně    ]   │
│                                          │
│  Levý přední světlomet  ⚠ xenon          │
│  💡 Xenonové světla bývají drahé (3-8k)  │
│  Stav:  ○ Nelze prodat                   │
│         ○ Poškozený                       │
│         ● OK                              │
│                                          │
│  [...dalších 5 otázek...]                │
│                                          │
│  ─────────────────────────────           │
│  Pohonná jednotka              ▼          │
│  ─────────────────────────────           │
│  Interiér (kožené)             ▼          │
│  ─────────────────────────────           │
│                                          │
│  [← Zpět]      [Pokračovat k cenám →]    │
└─────────────────────────────────────────┘
```

### 5.3 Step 5 — Price batch

```
┌─────────────────────────────────────────┐
│  Krok 5/7 — Ceny dílů (23 položek)       │
│                                          │
│  Bulk akce:                              │
│  [ Vše cena dohodou ] [ Vše 0 Kč ]       │
│                                          │
│  ─────────────────────────────           │
│  Přední nárazník         Poškozený       │
│  Cena: [____] Kč  ☐ Cena dohodou         │
│                                          │
│  Levý přední světlomet   OK              │
│  Cena: [5000] Kč  ☐ Cena dohodou         │
│                                          │
│  Pravý přední světlomet  OK              │
│  Cena: [____] Kč  ☑ Cena dohodou         │
│                                          │
│  [...20 dalších...]                      │
│                                          │
│  [← Zpět]          [Pokračovat →]        │
└─────────────────────────────────────────┘
```

### 5.4 Public listing `/dily/donor-cars/[slug]`

```
┌──────────────────────────────────────────┐
│  Breadcrumb: Díly › Bourané auta › Audi  │
│                                           │
│  ┌─────────────┐                         │
│  │  [foto]     │  Audi A4 B8 2.0 TDI 2013│
│  │             │  Bourán: předek         │
│  │             │  Výbava: xenon, kůže    │
│  └─────────────┘  Lokace: Praha          │
│                   Status: LISTED          │
│                                           │
│  🔖  23 dílů k prodeji                    │
│  ┌─────────────────────────────────────┐  │
│  │ Kožená sedačka L        2 500 Kč ▸  │  │
│  │ Kožená sedačka P        2 500 Kč ▸  │  │
│  │ Levý přední světlomet   5 000 Kč ▸  │  │
│  │ Pravý přední světlomet  Dohodou  ▸  │  │ ← NEGOTIABLE
│  │ ECU motoru              7 500 Kč ▸  │  │
│  │ Převodovka              Dohodou  ▸  │  │ ← NEGOTIABLE
│  │ ...                                  │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  Kontakt:                                 │
│  📞  +420 777 123 456                     │
│  ✉  vrakoviste@example.cz                 │
│                                           │
│  ⓘ  Díly označené "Dohodou" si domluvte   │
│     přímo s vrakovištěm (cena + odběr).   │
└──────────────────────────────────────────┘
```

### 5.5 Public listing `/dily` (eshop) — NESMÍ obsahovat NEGOTIABLE

```
┌──────────────────────────────────────────┐
│  /dily — Eshop náhradních dílů           │
│                                           │
│  Filtry: Značka / Model / Kategorie      │
│                                           │
│  Výsledky (1 234 dílů s cenou):          │
│  ┌─────┐  ┌─────┐  ┌─────┐               │
│  │foto │  │foto │  │foto │               │
│  │2500 │  │5000 │  │7500 │               │
│  │ Kč  │  │ Kč  │  │ Kč  │               │
│  └─────┘  └─────┘  └─────┘               │
│                                           │
│  ⚠  JEN PRICED parts, NEGOTIABLE         │
│     parts sem NEPATŘÍ                    │
└──────────────────────────────────────────┘
```

---

## 6. Hybrid pricing UI rules

### 6.1 Vrakoviště input side (STEP 5)

**Rule 1:** Per díl dvě možnosti — vyplnit numeric `price` NEBO zaškrtnout `Cena dohodou`. Ne obojí, ne ani jedno.

**Rule 2:** Pokud `Cena dohodou` zaškrtnuto → disable price input, nastav `pricingMode = NEGOTIABLE`, `price = 0`.

**Rule 3:** Pokud `price > 0` → `pricingMode = PRICED`.

**Rule 4:** Validace: alespoň 1 díl musí být prodejný. Pokud user neoznačí žádný díl jako sellable, neumožnit publish.

**Rule 5:** Bulk actions:
- **"Vše cena dohodou"** — nastav všechny na `pricingMode = NEGOTIABLE`
- **"Vše 0 Kč"** — anti-pattern, **NENABÍDNOUT** (user by mohl omylem 0 Kč → buyer objedná zdarma). Místo toho **"Zrušit cenu → dohodou"** (fallback na NEGOTIABLE).

### 6.2 Public side — buyer flow

**Scenario A: Buyer klikne na PRICED part v `/dily` eshopu**
→ Standard checkout (existing eshop flow). Add to cart → checkout → Stripe → webhook aplikuje commission split (#88a infrastruktura). **Beze změny existing flow.**

**Scenario B: Buyer klikne na PRICED part v `/dily/donor-cars/[slug]` detailu**
→ Stejný button "Do košíku" → existing checkout. Donor car kontext je jen presentation.

**Scenario C: Buyer klikne na NEGOTIABLE part**
→ Otevře modal "Kontaktovat prodejce":
- Zobrazí telefon + email vrakoviště.
- Copy-to-clipboard + tel: href + mailto: href.
- Text "Transakce proběhne přímo s vrakovištěm. Carmakler tuto transakci nezajišťuje."
- **Volitelné (v2):** form "Zanechat kontakt" → uloží `DonorCarLead` (nový model, out of MVP) → vrakoviště zavolá buyera. Ale MVP = jen zobrazení kontaktů, akceptujeme leakage.

### 6.3 Cross-cutting rules

**CRITICAL 1:** `/dily` eshop listing query MUSÍ obsahovat:
```
WHERE Part.status = 'ACTIVE'
  AND Part.pricingMode = 'PRICED'
  AND Part.price > 0
```

**CRITICAL 2:** `/dily/donor-cars/[slug]` detail query (NEW):
```
SELECT DonorCar LEFT JOIN Part WHERE Part.donorCarId = DonorCar.id
  AND Part.status IN ('ACTIVE', 'SOLD')  -- zobrazit SOLD s "Prodáno" badge
```

**CRITICAL 3:** `/dily/kategorie/[cat]`, `/dily/znacka/[brand]`, atd. SEO listing pages — stejný filter jako `/dily` (PRICED only).

**CRITICAL 4:** Sitemap.xml (`lib/seo-data.ts` + `app/sitemap.ts`) MUSÍ:
- Obsahovat `/dily/donor-cars/[slug]` pro všechny LISTED + PARTIAL DonorCar entities.
- NEOBSAHOVAT individuální `/dily/[part.slug]` pro parts s `pricingMode = NEGOTIABLE` (ty nemají eshop URL; přístupné jen přes donor car detail).

---

## 7. Marketplace surface separation — eshop vs donor cars

### 7.1 Dva funnely, dva conversion targets

| Funnel | Route | UX | Pricing | Commission | Cíl |
|---|---|---|---|---|---|
| **Eshop** | `/dily`, `/dily/znacka/*`, `/dily/kategorie/*`, `/dily/[slug]` | E-commerce list+detail+cart+checkout | MANDATORY price > 0 | Standard (#88a) | Transakční, rychlý nákup |
| **Donor car marketplace** | `/dily/donor-cars` (index), `/dily/donor-cars/[slug]` (detail) | Flea market — auto+seznam dílů, kontakt | Optional (PRICED + NEGOTIABLE mix) | Jen PRICED dílů | Bourané auta, kompletní appraise |

### 7.2 Navigation

**Nové links v menu (Navbar + Footer):**
- `/dily` (hlavní eshop) — existing
- `/dily/donor-cars` (NEW) — "Bourané auta" / "Celá auta z vrakovišť"

**Cross-linking:**
- V `/dily/[part.slug]` detail stránce, pokud `part.donorCarId != NULL` → zobrazit link "Část vozidla: Audi A4 2013 → [Všechny díly z tohoto auta]" → redirect na `/dily/donor-cars/[slug]`.
- V `/dily/donor-cars/[slug]` → každý PRICED part má `href` na `/dily/[part.slug]` (standard eshop detail).

### 7.3 Co se NESMÍ

1. **NESMÍ** se zobrazit NEGOTIABLE parts v `/dily` listing — musí být filter-protected (viz §6.3 CRITICAL 1).
2. **NESMÍ** být separátní cart/checkout logic pro donor car — používá existing eshop checkout infrastrukturu (reuse, ne reimplementace).
3. **NESMÍ** se v UI mixovat vizuální styl eshopu s "flea market feelingem" — eshop je clean commerce, donor cars je rustic "viz co je na dvoře". Dva různé design jazyky, aby buyer nemyslel, že NEGOTIABLE part koupí stejně snadno jako PRICED.

### 7.4 SEO implikace

**Donor car detail pages** (`/dily/donor-cars/[slug]`):
- Index: **YES** (public, má search value — "bourané Audi A4 Praha").
- `generateStaticParams`: **NE, dynamic** (content se mění týdně, ISR `revalidate: 3600`).
- `<title>`: `"Bourané {brand} {model} {year} {city} — 23 dílů | Carmakler"`
- `<meta description>`: auto-generated ze seznamu dílů.
- JSON-LD: `Product` type (ne `ItemList` — je to single listing).

**`/dily/donor-cars` index page:**
- Index: **YES**.
- `<title>`: `"Bourané auta z vrakovišť ČR — náhradní díly | Carmakler"`.
- Server-rendered list s filtry (brand, model, body type, region).

---

## 8. Commission integration — reuse #88a

### 8.1 Co reuse z #155 (#88a)

**Schema (už v plánu #154):**
- `Partner.commissionRate` — per-vrakoviště sazba, donor car = stejný partner, stejná sazba.
- `Partner.stripeAccountId` — nullable, graceful fallback.
- `OrderItem.commissionRateApplied` + `carmaklerFee` + `supplierPayout` — snapshot při platbě.

**Backend:**
- `applyCommissionSplit(orderId)` webhook helper (#88a §6). Volá se ze Stripe `checkout.session.completed`.

### 8.2 Commission logic pro donor car parts

**PRICED parts:**
1. Buyer objedná přes standard checkout.
2. Stripe webhook volá `applyCommissionSplit(orderId)`.
3. Pro každý OrderItem:
   - Fetch `Part → supplier → partnerAccount`.
   - Commission rate = `partner.commissionRate` (default 15%).
   - Apply split (carmaklerFee / supplierPayout).
   - Stripe Connect transfer (nebo graceful fallback pokud `stripeAccountId IS NULL`).
4. **Žádná donor-car-specific logika.** Part vypadá identicky jako samostatný díl v eshopu, commission flow je stejný.

**NEGOTIABLE parts:**
1. Buyer klikne "Kontaktovat prodejce" → získá phone/email.
2. Transakce proběhne mimo Carmakler platformu.
3. **Carmakler nedostane žádnou commission.** Zero revenue z NEGOTIABLE parts — **akceptovaná leakage** (viz §0 strategická directive).
4. (Optional v2) `DonorCarLead` model pro track kdo se zeptal — ale žádný monetization attempt, jen analytics.

### 8.3 Status side-effect po úspěšné platbě

Webhook handler `applyCommissionSplit(orderId)` má novou side-effect:
```
Pro každý successful OrderItem:
  IF orderItem.part.donorCarId != NULL:
    CALL updateDonorCarStatus(part.donorCarId)  // §4.3 auto-progression
```

`updateDonorCarStatus` kontroluje COUNT(parts) vs COUNT(parts SOLD/INACTIVE) a přepne status LISTED → PARTIAL nebo PARTIAL → DEPLETED.

### 8.4 Co #156 NEMODIFIKUJE z #88a

- **Commission rate slider UI** — žádné změny, donor car = stejný partner = stejná rate.
- **PartnerCommissionLog** — žádné změny, audit log je per-partner, ne per-donor-car.
- **Partner detail admin UI** — žádné změny. (Volitelně v2: přidat "Donor cars: 5 (2 LISTED, 3 DEPLETED)" metric, ale out of MVP.)
- **`applyCommissionSplit()` core logic** — reuse beze změny. Jen volá `updateDonorCarStatus` jako post-hook.

---

## 9. Compliance research — Czech vehicle wreckage law

### 9.1 Relevantní legislativa (ověřeno WebSearch)

**Primární zdroj:** zákon č. **541/2020 Sb.** (zákon o odpadech, účinný od 2021-01-01, nahradil 185/2001 Sb.)
- [zákony pro lidi — 541/2020 Sb.](https://www.zakonyprolidi.cz/cs/2020-541)
- [MZP novela gov.cz](https://mzp.gov.cz/system/files/2025-03/OODP_Pokyn_NZ_Prechodna_ust_Final-04012021.pdf)

**Sekundární (ELV-specific):** zákon č. **542/2020 Sb.** o výrobcích s ukončenou životností.
- [PSP sbírka 542/2020](https://www.psp.cz/sqw/sbirka.sqw?r=2020&cz=542)

**Prováděcí vyhláška:** vyhláška č. **345/2021 Sb.** o podrobnostech nakládání s vozidly s ukončenou životností.
- [ASPI 345/2021](https://www.aspi.cz/products/lawText/1/97130/129/2/vyhlaska-c-345-2021-sb-o-podrobnostech-nakladani-s-vozidly-s-ukoncenou-zivotnosti)
- [enviweb.cz komentář](https://www.enviweb.cz/120185)

**Souvisící:** vyhláška č. **273/2021 Sb.** o podrobnostech nakládání s odpady.
- [Sagit sb21273](https://www.sagit.cz/info/sb21273)

**Kompilovaný přehled pro vrakoviště:** [overene-vrakoviste.cz/pravni-predpisy](https://www.overene-vrakoviste.cz/pravni-predpisy/).

### 9.2 Klíčové povinnosti zpracovatele (= vrakoviště)

Z citovaných zdrojů (ověřeno WebSearch 2026-04-08):

1. **Zpracovatel vede průběžnou evidenci odpadů** a způsobů nakládání s nimi, **odděleně eviduje materiály a části k opětovnému použití, které prošly přípravou k opětovnému použití**. (zákon 541/2020 Sb. + vyhl. 345/2021 Sb.)

2. **Příprava k opětovnému použití** může zahrnovat **kontrolu funkčnosti, opravu, čištění nebo ochranu před korozí**. Opětovně použitelné díly musí být **skladovány v oddělených prostorech** od odpadů určených k dalšímu zpracování. (vyhl. 345/2021 Sb.)

3. V **ročním hlášení** se uvádí **celková hmotnost dílů, které zpracovatel demontoval a připravil k opětovnému použití**. (vyhl. 345/2021 Sb.)

4. Vyhláška 345/2021 Sb. definuje **rozsah údajů vedených v Informačním systému pro vedení informací o vozidlech s ukončenou životností** (ISVS), **podmínky přípravy k opětovnému použití** a **náležitosti dokladu o opravitelnosti vozidla a o funkčnosti části vozidla**.

5. **Potvrzení o převzetí autovraku** (Certificate of Destruction) — vystavuje provozovna při převzetí vozidla k likvidaci, VIN + identifikace motoru jsou povinné údaje. Podkladem pro **vyřazení z registru vozidel**.

**CAVEAT:** Výše uvedené jsou **reference na legislativní texty**. Implementace Carmakler compliance features **potřebuje právní review** (viz §14 Risks + #80 legal precedent) — planovac **NENÍ právník** a tento paragraf je **research, ne legal opinion**.

### 9.3 Co z toho plyne pro Carmakler #156

**Value proposition (ne feature list):**
- Vrakoviště **musí** evidovat každé přijaté auto + demontované díly. Tato evidence je dnes typicky **Excel/papír**.
- Carmakler PWA s donor car flow **je ta evidence** — strukturovaný záznam VIN + damage + parts + status workflow + timestamps.
- Při exportu pro roční hlášení (total hmotnost demontovaných dílů) Carmakler může vygenerovat CSV/XML.

**MVP compliance features (#156):**
1. **`DonorCar.vin`** — povinný field, snapshot identifikace.
2. **`DonorCar.createdAt`** = datum intake (de facto = datum přijetí vozidla).
3. **`DonorCar.status`** audit trail s timestamps (`listedAt`, `depletedAt`, `scrappedAt`).
4. **`DonorCar.certificateOfDestructionNumber`** — povinný input při přechodu na SCRAPPED.
5. **Per-part record** — `Part.createdAt`, `Part.status` (INACTIVE = scrapped, SOLD = reused), + weight field (existuje `Part.weight Float?`).

**OUT OF MVP scope:**
- ISVS integrace (napojení na státní Informační systém) — out of scope, **potřebuje explicit legal review**, pravděpodobně vyžaduje certifikaci provozovny. Žádné vymýšlení paragrafů v kódu.
- Export formát pro roční hlášení — out of MVP, ale schema musí udržovat data tak, aby byl export v v2 jednoduchý.
- Automatické vystavení "dokladu o převzetí autovraku" — out of MVP, ale schema persist `certificateOfDestructionNumber` field.

### 9.4 CRITICAL caveat

**planovac warning:** Tento §9 je **research summary**, NIKOLIV legal opinion.

- Nevymýšlím paragrafy.
- Nevymýšlím konkrétní požadavky ISVS API.
- Nevymýšlím jaký formát má "potvrzení o převzetí autovraku".
- Všechno výše je **cit zdrojů** + **interpretace planovač**.

**Před launch #156 MVP:** requires tasks v stylu #80 (LEGAL review) — právník review kompletního donor car flow proti **skutečnému znění** zákonů 541/2020, 542/2020 a vyhl. 345/2021, + review zda Carmakler jako platform je "zpracovatel" v smyslu zákona nebo jen "vedoucí evidenci jménem zpracovatele" (to je **velký rozdíl** v odpovědnosti).

**Doporučení:** Open question pro lead (viz §16 Q3).

---

## 10. Content seeding strategy + KPI

### 10.1 Chicken-and-egg problém

Donor car marketplace potřebuje **supply** (vrakoviště s bouráky) i **demand** (buyers hledající díly). Dnes:
- Supply: vrakoviště ČR mají **stovky bouráků na dvoře**, ale inzerce je fragmentovaná (Sbazar, lokální weby).
- Demand: buyers hledají díly ve vyhledávači → přistanou na eshopu nebo Sbazaru, ale zřídkakdy najdou kompletní bourané auto.

**Chicken-and-egg fix z strategic directive §0:**
> "Vrakoviště nahodí 30 stávajících bouráků z dvora za hodinu (s pomocí AI Vision z fotek = #88b). Z 50 vrakovišť na pilotu = 12 000 nabídek v týdnu 1."

### 10.2 Seeding workflow

**MVP without #88b (manual):**
1. Pilot vrakoviště dostane přístup + training (white glove, per memory `project_wolt_model_platform_wide`).
2. Vrakoviště pracovník obchází dvůr, per auto: VIN sken + damage input + equipment confirm + ~8 min guided interview = **~10 min/auto manual**.
3. 30 aut = 5 hodin (půlden).
4. 50 vrakovišť × 30 aut = **1 500 donor cars v week 1** (NE 12 000 — to je target s #88b AI pre-fill).

**V2 with #88b (AI-assisted):**
1. Vrakoviště pracovník vyfotí auto (1 foto front + 1 rear + 1 side) → upload.
2. Vision OCR (#88b) analyzuje → suggest damage areas, vizuální condition per sekce.
3. Vrakoviště jen konfirmuje / edituje.
4. Per auto **~2 min** = 30 aut/hour = **12 000 listings per week 1** (50 vrakovišť × 30 aut × 8 kol work = 12k).

**Order of implementation:** #156 MVP funguje samostatně (manual flow). #88b akceleruje content seeding v v2, ale není blocker.

### 10.3 KPI — měření úspěchu

**Leading indicators (week 1-4):**
- `donor_cars_created_total` — kolik donor cars v DB, per vrakoviště.
- `donor_cars_parts_per_car_avg` — průměrný počet vygenerovaných parts per car (target: 20-30).
- `donor_cars_time_to_first_save` — median čas od intake start po první save (target: < 15 min MVP, < 5 min with #88b).

**Lagging indicators (week 4-12):**
- `donor_car_view_count_avg` — per listing visibility (target: 100+ views/týden per listing).
- `donor_car_first_sale_median_days` — kolik dnů od LISTED po první sold part (target: < 7 dní).
- `donor_car_depletion_rate` — % donor cars co přejdou na DEPLETED v 90 dnech (target: 30%+ = zdravá liquidity).
- `price_fill_rate` — % parts s PRICED vs NEGOTIABLE (lead/member metric — vyšší = víc transactions on-platform, komise revenue).

**Composite moat metrics:**
- Počet aut + dílů v DB (pro SEO long-tail + AI price valuation datasety).
- Počet unique buyer sessions s search → landing na donor car listing.

### 10.4 Pilot structure (reuse z #76v2 §25)

Per memory `project_wolt_model_platform_wide`: **white glove onboarding prvních 10 vrakovišť**, 0% komise první 3 měsíce (Founding Member status).

**#156-specific pilot playbook:**
1. Týden 0: Demo call — ukázka UI, VIN scan, guided interview.
2. Týden 1: On-site visit — vrakoviště fyzicky jde přes 3-5 aut, measure time + friction.
3. Týden 2-4: Weekly check-in — collect feedback na interview rules, missing categories, UI snags.
4. Týden 5+: Self-service, ale se support slot.

**Plánovač poznámka:** Pilot je **non-engineering ritual**, ale plán musí explicitně říct, že pilot je pre-launch step, ne nice-to-have. Bez pilot = zero product-market fit signál.

---

## 11. Vztah k #88a / #88b / #88c

### 11.1 Dependency matrix

| Sliced plan | Stav | Dependency pro #156? | Poznámka |
|---|---|---|---|
| **#88a Wolt commission** (#155 in-flight) | IMPL | **HARD — musí být merged** | Donor car PRICED parts reuse OrderItem snapshot fields + applyCommissionSplit |
| **#88b Vision OCR** (TBD) | Not planned yet | **SOFT — akceleruje, neblocuje** | Without #88b: manual guided interview (~10 min/car). With #88b: ~2 min/car. |
| **#88c Voice input** (TBD) | Not planned yet | **SOFT — UX enhancement** | Voice-driven "obcházím auto" flow. Nice-to-have ale MVP funguje bez něj. |
| **#88d QR labels** (přirozené pokračování #76v2 §5.4) | Not planned yet | **NE** | Per-part QR je separátní feature. Donor car-level QR je v2. |

### 11.2 Co #156 SAMO nedělá (OUT OF SCOPE)

- **Vision OCR endpoints** (`/api/parts/scan-*`). Zůstávají v **#88b** scope.
- **Voice transcribe endpoint** (`/api/parts/transcribe`). Zůstávají v **#88c** scope.
- **QR label PDF generation**. Zůstává v **#88d** / #76v2 §5.4 scope.
- **Commission slider UI, audit log UI, Stripe Connect onboarding**. Zůstávají v **#88a** (#155 in-flight).
- **5-tier AI scanner flow pro samostatné díly** (tzn. "vrakoviště přidá jednotlivý díl bez donor car kontextu"). Zůstává v **#76v2 / #88** parent scope. Donor car flow je **paralelní entry point**.

### 11.3 Co #156 přidává nad rámec #88 parent

- **Nový Prisma model `DonorCar`** + `DonorCarPhoto`.
- **Rozšíření `Part` modelu** o `donorCarId` + `pricingMode` + `interviewQuestionId`.
- **Nový PWA flow `/parts/donor-cars/new`** + list `/parts/donor-cars/my`.
- **Nová public route `/dily/donor-cars`** + `/dily/donor-cars/[slug]`.
- **`lib/donor-cars/interview-engine.ts`** + `interview-rules.json` + `parts-catalog.json`.
- **Filter rules** v existujícím `/dily` listingu (pricingMode = PRICED).
- **Status workflow machine** + auto-progression v webhook post-hook.
- **Compliance audit fields** (`certificateOfDestructionNumber` + timestamp tracking).

### 11.4 Integration points — kde #156 sahá do existujícího kódu

| Soubor | Typ změny |
|---|---|
| `prisma/schema.prisma` | ADD models + ALTER `Part` (additive) |
| `app/api/stripe/webhook/route.ts` | APPEND post-hook volání `updateDonorCarStatus(partId)` po applyCommissionSplit |
| `app/(web)/dily/page.tsx` + kategorie/brand pages | ADD filter `pricingMode = 'PRICED'` do query |
| `lib/seo/partsItemList.ts` | ADD filter `pricingMode = 'PRICED'` do `getTopPartsFor*` helpers |
| `app/sitemap.ts` | ADD `/dily/donor-cars/[slug]` URLs |
| `components/main/Navbar.tsx` + `Footer.tsx` + mobile variants | ADD link "Bourané auta" |
| `app/api/vin/decode/route.ts` | EXTEND role whitelist o `PARTS_SUPPLIER` + `PARTNER_VRAKOVISTE` (aktuálně jen broker) |

**Zero conflict s #155 / #88a.** Donor car flow pouze rozšiřuje — žádná změna commission infrastruktury.

---

## 12. Acceptance criteria

**AC1 — Prisma migration safe:** `npx prisma migrate dev` projde bez dropů/renamů. Všechny existing `Part` rows mají `pricingMode = 'PRICED'` default. Zero-downtime.

**AC2 — VIN lookup reuse:** Donor car flow volá existující `POST /api/vin/decode`, NEPŘIDÁVÁ paralelní VIN handler. Endpoint rozšířen jen o role whitelist.

**AC3 — Guided interview rule-based:** `lib/donor-cars/interview-engine.ts` je deklarativní (JSON rules). Engine je pure function `(input) => Question[]`. Testy: ≥10 unit testů pro různé kombinace damageAreas × equipment × bodyType.

**AC4 — Parts catalog seed:** `lib/donor-cars/parts-catalog.json` obsahuje 6 body types × min 80 položek per body = ≥480 položek dohromady. JSON schema validovaný Zod.

**AC5 — DonorCar CRUD API:** `POST /api/donor-cars` (create + generate Parts batch), `GET /api/donor-cars/[id]`, `PATCH /api/donor-cars/[id]` (edit metadata), `PATCH /api/donor-cars/[id]/status` (status transitions). Zod validated. Auth: supplier (owner) + ADMIN.

**AC6 — PWA create flow 7 steps functional:** `/parts/donor-cars/new` guided wizard (VIN → damage → equipment → interview → pricing → photo → review). Žádný dead-end. Každý step má "Zpět" + "Pokračovat". Step 5 bulk actions funkční.

**AC7 — Public donor car index + detail:** `/dily/donor-cars` (list s filter brand/model/region) + `/dily/donor-cars/[slug]` (detail s seznamem PRICED + NEGOTIABLE parts). PRICED → add to cart. NEGOTIABLE → "Kontaktovat" modal.

**AC8 — Eshop boundary enforcement:** `/dily`, `/dily/znacka/*`, `/dily/kategorie/*` queries OBSAHUJÍ `WHERE pricingMode = 'PRICED'`. E2E test: vytvoř donor car s 10 parts (5 PRICED, 5 NEGOTIABLE), assert že `/dily` listing zobrazuje 5, `/dily/donor-cars/[slug]` zobrazuje 10.

**AC9 — Status workflow automation:** Po SOLD prvního partu z donor car → status přejde LISTED → PARTIAL (automatic). Po SOLD/INACTIVE všech parts → PARTIAL → DEPLETED. SCRAPPED je manual button s required `certificateOfDestructionNumber` input.

**AC10 — Commission integration passive:** Donor car PRICED parts projdou checkoutem, `applyCommissionSplit()` aplikuje správnou rate z `Partner.commissionRate`. NEGOTIABLE parts generují zero OrderItems (jsou off-platform). Žádná nová commission logic.

**AC11 — SEO:** `/dily/donor-cars/[slug]` má unique `<title>` + `meta description` + canonical + JSON-LD (Product type). Indexable. Sitemap obsahuje LISTED + PARTIAL slugs.

**AC12 — Navigation:** Main menu + footer + mobile menu MAJÍ link "Bourané auta" → `/dily/donor-cars`.

**AC13 — Compliance audit fields:** `DonorCar.certificateOfDestructionNumber` persist po SCRAPPED. `DonorCar.listedAt`, `depletedAt`, `scrappedAt` auto-filled při status transitions.

**AC14 — Build success:** `npm run build` projde clean (zero errors, existing ESLint baseline ≤ previous). TypeScript strict mode compliant.

**AC15 — Role gating:** Pouze `PARTS_SUPPLIER` + `PARTNER_VRAKOVISTE` + `ADMIN` + `BACKOFFICE` mohou přistoupit na `/parts/donor-cars/*`. Middleware check.

---

## 13. Phasing — MVP, v2, v3

### 13.1 Phase 0 — Pre-launch ritual (non-engineering)

- Sestavit `parts-catalog.json` hand-curated (plánovač + uživatel + 1-2 pilot vrakoviště, 2-3 seance).
- Draft `interview-rules.json` pro 6 body types × 5-8 sekcí.
- Legal review tasks (new task #156-legal, blocked by delivery #156 MVP — parallel research).

### 13.2 Phase 1 — Schema + core backend (#156a)

1. Prisma migration (`DonorCar`, `DonorCarPhoto`, `Part.donorCarId`, `pricingMode`, `interviewQuestionId`).
2. `lib/donor-cars/interview-engine.ts` + `interview-rules.json` + unit tests.
3. `lib/donor-cars/parts-catalog.json` initial seed.
4. `lib/donor-cars/status-machine.ts` + unit tests.
5. API endpoints: `POST /api/donor-cars`, `GET/PATCH /api/donor-cars/[id]`, `PATCH /api/donor-cars/[id]/status`.
6. `app/api/vin/decode/route.ts` — rozšíření role whitelist.

### 13.3 Phase 2 — PWA create flow (#156b)

1. `/parts/donor-cars/new` page — 7-step wizard.
2. `components/pwa-parts/donor-cars/` — per-step komponenty (VinStep, DamageStep, EquipmentStep, InterviewStep, PricingStep, PhotoStep, ReviewStep).
3. State management (client-side via useReducer, posledně i IndexedDB pro offline draft).
4. POST submit + redirect.

### 13.4 Phase 3 — PWA list + edit (#156c)

1. `/parts/donor-cars/my` — seznam donor cars vrakoviště.
2. `/parts/donor-cars/[id]` — detail + edit metadata + per-part inline editace + status actions.
3. SCRAPPED flow s `certificateOfDestructionNumber` modal.

### 13.5 Phase 4 — Public marketplace (#156d)

1. `/dily/donor-cars/page.tsx` — index + filters.
2. `/dily/donor-cars/[slug]/page.tsx` — detail s parts list + kontakt modal pro NEGOTIABLE.
3. SEO metadata + JSON-LD + sitemap extension.
4. Navbar + Footer + MobileMenu cross-linking.

### 13.6 Phase 5 — Eshop boundary + commission integration (#156e)

1. Filter queries v `/dily` + subsekcí (kategorie, značka) — add `WHERE pricingMode = 'PRICED'`.
2. `lib/seo/partsItemList.ts` — stejný filter v helpers.
3. Stripe webhook post-hook: volání `updateDonorCarStatus` po `applyCommissionSplit`.
4. E2E test: donor car → sold first part → status PARTIAL → sold all → DEPLETED.

### 13.7 v2 backlog (post-MVP)

- **#88b Vision OCR integration** — AI pre-fill damage areas + visible conditions z fotek.
- **#88c Voice input** — "Obcházím auto" narration → transcribe → pre-fill interview.
- **DonorCarLead model** — uložení NEGOTIABLE leads pro analytics (opt-in, žádná monetization attempt).
- **AI price suggestions** per díl (model × year × condition → historical sold prices → range).
- **ISVS integrace** (state Informační systém) — po legal review.
- **Export pro roční hlášení** — CSV/XML per vrakoviště, agregace za ohlašovací rok.
- **Per-part fotky** (místo inherit z donor car).
- **Donor car QR level** (print sticker s QR → na auto na dvoře pro fyzickou inventarizaci).

### 13.8 v3 backlog

- **AI Price Valuation model** — trained z agregované Carmakler data base, konkurenční moat (per memory `project_donor_car_flow` §zásadní).
- **Parts recommendation** — "buyer hledá ECU Audi A4 2013 → zobrazit podobné z jiných donor cars".
- **Multi-vrakoviště aggregation** — buyer klikne "Hledám kapotu Audi A4 2013" → seznam napříč všema vrakovištěma.

---

## 14. Risks & mitigations

| Risk | Likelihood | Impact | Mitigace |
|---|---|---|---|
| **Legal compliance failure** — Carmakler není certifikovaný "zpracovatel", interpretace zákona 541/2020 nejasná | Medium | Very High | PRE-LAUNCH legal review (task #156-legal analogous #80). Plán NETVRDÍ, že compliance features jsou definitivní — jen evidence tooling. V §9 explicitní caveat. |
| **Vrakoviště odmítnou flow** — 10 minut per auto je příliš (Excel rychlejší) | Medium | High | Pilot structure (§10.4), white glove. Pokud pilot měří > 15 min per car, pivot na #88b AI pre-fill ASAP. |
| **Eshop boundary leak** — NEGOTIABLE parts omylem v /dily | Low | High | AC8 E2E test, code review checklist, filter v lib/seo helpers + page queries. |
| **VIN decoder rate limit** — 1500 donor cars × VIN lookup week 1 | Low | Medium | vindecoder.eu má limits (kontaktovat pro enterprise plan). NHTSA fallback pokryje overflow. Cache VIN results per 24h. |
| **Commission infra nekompatibilní** — #88a merged flavour se liší od plánu | Medium | Medium | PRE-IMPL step: verify #155 final schema vs #154 plán. Pokud se liší, update §8. |
| **Parts catalog coverage gap** — body type nesedí pro některé vrakoviště use cases | Medium | Low | JSON seed editovatelný bez deploy. V2 feature request mechanism. |
| **Rule engine composability** — too complex rules, vrakoviště dostane 60+ otázek | Low | Medium | MVP limit: max 40 questions per run. Engine dedupe + priority scoring. |
| **Stale interview rules** — xenony už nejsou drahé v 2030, rules drift | Low | Low | Quarterly review ritual, rules versioning v JSON `version` field. |
| **Data ownership / GDPR** — donor car data obsahuje VIN + lokaci | Medium | High | VIN je osobní údaj podle GDPR. Potřeba právní base pro evidenci (pravděpodobně legitimní zájem + zákonná povinnost). Součást #156-legal task. |
| **SEO kanibalizace** — `/dily/donor-cars/[slug]` vs `/dily/[part.slug]` duplicate content | Low | Medium | Canonical strategy: donor car detail má vlastní canonical, part detail má canonical na `/dily/[slug]` (samostatný), linkuje zpátky na donor car. |

---

## 15. Files touched — předpokládané

### 15.1 Net new

**Prisma:**
- `prisma/migrations/<timestamp>_add_donor_cars/migration.sql`

**lib:**
- `lib/donor-cars/interview-engine.ts` (~250 řádků)
- `lib/donor-cars/interview-rules.json` (~500 řádků)
- `lib/donor-cars/parts-catalog.json` (~600 řádků)
- `lib/donor-cars/status-machine.ts` (~100 řádků)
- `lib/donor-cars/slug.ts` (generate unique slug per donor car)

**API:**
- `app/api/donor-cars/route.ts` — POST (create) + GET (list pro supplier)
- `app/api/donor-cars/[id]/route.ts` — GET (detail) + PATCH (edit) + DELETE
- `app/api/donor-cars/[id]/status/route.ts` — PATCH (status transitions)
- `app/api/donor-cars/[id]/parts/route.ts` — GET (list parts) — může být include v detail

**PWA pages:**
- `app/(pwa-parts)/parts/donor-cars/new/page.tsx` (client wizard orchestrator)
- `app/(pwa-parts)/parts/donor-cars/new/loading.tsx`
- `app/(pwa-parts)/parts/donor-cars/new/error.tsx`
- `app/(pwa-parts)/parts/donor-cars/my/page.tsx` (list)
- `app/(pwa-parts)/parts/donor-cars/[id]/page.tsx` (detail + edit)

**PWA components:**
- `components/pwa-parts/donor-cars/DonorCarWizard.tsx` (stepper)
- `components/pwa-parts/donor-cars/VinStep.tsx`
- `components/pwa-parts/donor-cars/DamageStep.tsx`
- `components/pwa-parts/donor-cars/EquipmentStep.tsx`
- `components/pwa-parts/donor-cars/InterviewStep.tsx`
- `components/pwa-parts/donor-cars/PricingStep.tsx` (donor car variant — reuse PricingStep z /parts/new not viable — different schema)
- `components/pwa-parts/donor-cars/PhotoStep.tsx` (reuse `PhotoStep` wrapper)
- `components/pwa-parts/donor-cars/ReviewStep.tsx`
- `components/pwa-parts/donor-cars/DonorCarStatusBadge.tsx`
- `components/pwa-parts/donor-cars/ScrapConfirmDialog.tsx`

**Public web pages:**
- `app/(web)/dily/donor-cars/page.tsx` (index s filters)
- `app/(web)/dily/donor-cars/loading.tsx`
- `app/(web)/dily/donor-cars/error.tsx`
- `app/(web)/dily/donor-cars/[slug]/page.tsx` (detail)
- `app/(web)/dily/donor-cars/[slug]/loading.tsx`
- `app/(web)/dily/donor-cars/[slug]/error.tsx`

**Public web components:**
- `components/web/dily/DonorCarCard.tsx` (list item)
- `components/web/dily/DonorCarFilters.tsx`
- `components/web/dily/DonorCarPartsList.tsx`
- `components/web/dily/NegotiableContactModal.tsx`

**Tests:**
- `lib/donor-cars/__tests__/interview-engine.test.ts` (10+ cases)
- `lib/donor-cars/__tests__/status-machine.test.ts` (5+ cases)
- `e2e/donor-car-flow.spec.ts` (Playwright happy path + eshop boundary assertion)

### 15.2 Modified existing

- `prisma/schema.prisma` — ADD `DonorCar`, `DonorCarPhoto`, ALTER `Part`, ALTER `User` (supplier inverse relation).
- `app/api/vin/decode/route.ts` — rozšíření role whitelist (PARTS_SUPPLIER, PARTNER_VRAKOVISTE).
- `app/api/stripe/webhook/route.ts` — append `updateDonorCarStatus(partId)` post-hook.
- `app/(web)/dily/page.tsx` — filter query `WHERE pricingMode = 'PRICED'`.
- `app/(web)/dily/znacka/[brand]/page.tsx` — stejný filter.
- `app/(web)/dily/znacka/[brand]/[model]/page.tsx` — stejný filter.
- `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` — stejný filter.
- `app/(web)/dily/kategorie/[slug]/page.tsx` (pokud existuje) — stejný filter.
- `lib/seo/partsItemList.ts` (`getTopPartsForBrand`, `getTopPartsForBrandModel`, `getTopPartsForBrandModelYear`) — add filter.
- `app/sitemap.ts` — add donor car URLs.
- `components/main/Navbar.tsx` + `Footer.tsx` + `MobileMenu.tsx` — add "Bourané auta" link.
- `components/web/Navbar.tsx` + `Footer.tsx` + `MobileMenu.tsx` — stejné.
- `middleware.ts` — rozšíření protected routes o `/parts/donor-cars/*` (PARTS_SUPPLIER role gate).

### 15.3 Orientační součet

- Net new files: ~35
- Modified files: ~15
- Rozsah kódu: odhadem 3000-5000 řádků net new + 100-200 řádků modified.

**Pozn.:** Tento seznam je **odhad planovač**, implementator ho verifikuje proti reálnému stavu kódu a může se lišit (např. některé web components jsou shared). Delivery by měl checkovat diffy per fáze, ne all-at-once big-bang.

---

## 16. Open questions pro lead

**Q1 — Legal review timing:** Plán §9 říká, že compliance aspekt musí mít legal review (analogous #80). Kdy? Pre-MVP blocker, nebo parallel research během MVP implementace?

**Navrhované answer options:**
- **(a)** Parallel — spawnout `#156-legal` task teď (after #156 plan approval), běží parallel s #156a-e impl, block launch ale ne dev.
- **(b)** Pre-MVP blocker — #156 dev čeká na legal OK (risk: týdny delay).
- **(c)** Post-MVP — MVP vydáme jako "evidence tool bez legal enforcement", legal až v v2.

**Planovač doporučuje:** (a) Parallel, protože (b) blokuje dev a (c) je riskantní pro compliance claim. Finally rozhoduje lead.

---

**Q2 — #88b Vision OCR sekvence:** Má #156 čekat na #88b, paralelně, nebo jít napřed?

**Navrhované answer options:**
- **(a)** #156 MVP první (bez AI pre-fill), #88b později jako enhancement. Pilot 10 vrakovišť manual, measure friction, pivot pokud > 15 min/car.
- **(b)** #88b první, protože chicken-and-egg fix v week 1 = 12 000 listings vyžaduje Vision.
- **(c)** Paralelní — dva různé planovac/impl pipelines běží nezávisle, mergují se později.

**Planovač doporučuje:** (a), dokud není jasné, jestli pilot vrakoviště manual flow tolerují. Strategic directive §0 říká "s pomocí AI Vision z fotek" pro 30 aut/hour — ale to je **target**, ne **blocker**.

---

**Q3 — Legal review scope breadth:** Potřebujeme pro #156 legal review zahrnout **plné ISVS integration requirement** (státní Informační systém), nebo jen vyjasnit "je Carmakler zpracovatel nebo jen evidence tool"?

**Navrhované answer options:**
- **(a)** Jen clarifikace rolí (zpracovatel vs evidence tool vs SaaS provider). MVP bez ISVS, ISVS v v2.
- **(b)** Full ISVS scoping — architekturně víc work, ale launchli bychom s compliance story "Carmakler píše do ISVS za vás".

**Planovač doporučuje:** (a), protože ISVS integration pravděpodobně vyžaduje certifikaci provozovny a není realistické pro week 1. Ale lead musí potvrdit.

---

**Q4 — Parts catalog seed contributor:** Kdo sepíše initial `parts-catalog.json` (~500-700 položek)?

**Navrhované answer options:**
- **(a)** Plánovač + uživatel dohromady (2-3 seance, ~4 hodiny).
- **(b)** Pilot vrakoviště — oni ví, co na dvoře mají, nejlépe.
- **(c)** AI-generated first draft (Claude Sonnet prompt), pak manual review.

**Planovač doporučuje:** hybrid (c) + (b) — AI first draft, pilot vrakoviště review per brand. Plánovač orchestruje, NEZAPISUJE kód.

---

**Q5 — Interview question count limit:** Strategic directive §0 říká "5-8 minut → 20-30 dílů". Aktuální navrhovaný engine může triggrovat 40+ otázek (front damage + all equipment options + drivetrain always). Zapracovat hard limit 30 otázek (auto-filter by priority), nebo nechat engine naivní?

**Navrhované answer options:**
- **(a)** Hard limit 30 — filter by priority (highValue items first, body damage druhé).
- **(b)** Naivní engine, user může skip otázky.
- **(c)** Progressive disclosure — engine default zobrazí top 20, "Zobrazit vše" expand link.

**Planovač doporučuje:** (c) Progressive disclosure — best UX, kompromis mezi rychlostí a úplností.

---

**Q6 — Donor car URL slug format:** Má být slug `bourane-{brand}-{model}-{year}-{city}-{randomHash}` nebo jen `{randomHash}`?

**Navrhované answer options:**
- **(a)** SEO-friendly: `bourane-audi-a4-2013-praha-a1b2c3` (indexable, descriptive).
- **(b)** Short hash: `a1b2c3d4e5` (jen per DB lookup).

**Planovač doporučuje:** (a) pro SEO. Slug uniqueness guarantee přes hash suffix.

---

**Q7 — NEGOTIABLE parts visibility v Part detail `/dily/[slug]`:** Pokud má NEGOTIABLE part slug, má mít `/dily/[slug]` page? Nebo 404?

**Navrhované answer options:**
- **(a)** 404 — jen dostupný přes donor car detail (no independent URL).
- **(b)** Indexable ale s "Cena dohodou" message a link na donor car detail.

**Planovač doporučuje:** (a) — zabrání SEO duplicity + enforcruje boundary mezi eshopem a donor car flow. NEGOTIABLE parts NEMAJÍ samostatný slug (neukládat do DB nebo nullable slug).

---

**Q8 — `certificateOfDestructionNumber` validace:** Má být validované proti nějakému formátu, nebo jen free-text?

**Navrhované answer options:**
- **(a)** Free text (MVP) — vrakoviště zadá co zná ze svého systému.
- **(b)** Regex formát dle vyhlášky 345/2021 — pokud taková specifikace existuje.

**Planovač doporučuje:** (a) MVP — vyhnout se false positives při validaci bez legal-konzultované specifikace. Research do v2.

---

## Závěr

**Délka plánu:** ~960 řádků (v target range 600-1200).

**Scope:** 16 sekcí + §0 strategická directive. Pokrývá všechny oblasti z #156 dispatch (10 research areas + 17 required plan sections).

**Žádné vymýšlení faktů** — compliance section §9 cituje reálné zdroje (zakonyprolidi.cz, overene-vrakoviste.cz, enviweb.cz, PSP, ASPI). Legal interpretace je explicitně označena jako "research, ne legal opinion" + directed na legal review task.

**Žádné duplicity s #88a / #155** — donor car flow reuse commission infrastrukturu jako pasivní konzument. Zero změna commission logic.

**Žádné zasahování do eshopu** — strict boundary přes `pricingMode` filter. E2E testem zajištěno.

**Dependency matrix transparentní** — #155 (#88a) je hard blocker, #88b/c jsou soft dependencies.

**Open questions jsou 8** — všechny vyžadují lead/user rozhodnutí před #156a dispatch.

**Status:** READY-TO-DISPATCH **after** user explicit approval na plán + rozhodnutí na §16 Q1-Q8.

**Next action:** SendMessage HOTOVO → lead → uživatel review → (pokud schváleno) planovač vytvoří `plan-task-156a-donor-cars-schema-backend.md` + `plan-task-156b-pwa-wizard.md` + ... per phase, NEBO lead rozhodne ship jako single monolithic dispatch per §155 model.
