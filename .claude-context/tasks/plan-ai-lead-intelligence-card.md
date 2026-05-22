# Plán: AI Lead Intelligence karta — grafy, cenová analýza, kompletnost dat

**Task:** #54
**Status:** SUPERSEDED by plan-lead-enrichment.md (Fáze 3B)
**Priority:** MEDIUM → merged into #71
**Datum:** 2026-05-20

> **UPDATE 2026-05-20:** Moduly A+B (cenová distribuce + verdikt) přesunuty do `plan-lead-enrichment.md` Fáze 3B s KLÍČOVOU ZMĚNOU: data z internetu (AS24, Sauto real-time fetch), ne jen naše DB. Moduly C, D, E zůstávají zde.

---

## §1 Kontext a problém

### Uživatelův požadavek
> "tu kartu bych si dokazal představit o dost lepší!! Může tam bejt graf prodeje podobných vozu, když už to má tolik leadu tak muže AI vyhodnotit jestli ta cena je OK vysoka"
> "ty leady mužou číst i udaje kompletní ne, u spousty není mesto, vybava, nic nejsou tam ty grafy v karte"

### Současný stav `ScoutLeadDetail.tsx` (~700 řádků)
Karta zobrazuje surová data v 6 sekcích:
- Kontakt (jméno, telefon, email, web)
- Lokace (adresa, město, region)
- Business info (IČO, velikost, Google rating) — jen AUTOBAZAR/VRAKOVISTE
- Vozidlo (značka, model, rok, cena, km) — jen SOUKROMNIK
- Zdroj (source, URL, raw payload)
- Status + akce (přiřazení, konverze, odmítnutí)

**Co chybí:**
1. Žádné grafy ani vizualizace
2. Žádná cenová analýza (je cena OK/vysoká/nízká?)
3. Žádný indikátor kompletnosti dat
4. Žádné porovnání s podobnými leady
5. Žádná extrakce výbavy z titulku

### Dostupná data v DB
- **9865+ leadů** v PostgreSQL (ScoutLead)
- Vozidlo: brand, model, year, price, mileage, listingTitle
- Scoring: 0-100 bodů (scoring.py)
- Recharts v3.8.1 nainstalován, existují 2 chart komponenty (RevenueChart, OrdersChart)

---

## §2 Navrhované funkce (5 modulů)

### Modul A: Cenová distribuce — graf podobných vozů

**Co:** BarChart/Histogram cen podobných vozů z DB.

**Jak:**
1. Nový API endpoint `GET /api/scout-leads/[id]/market-analysis`
2. Query: najdi leady se stejným `vehicleBrand` + `vehicleModel` (± 2 roky, ± 50k km)
3. Vrať: cenovou distribuci (min, max, median, percentily, histogram buckets)
4. Frontend: Recharts BarChart s vyznačenou pozicí aktuálního leadu

**Prisma query:**
```typescript
const similar = await prisma.scoutLead.findMany({
  where: {
    vehicleBrand: lead.vehicleBrand,
    vehicleModel: lead.vehicleModel,
    vehicleYear: { gte: lead.vehicleYear - 2, lte: lead.vehicleYear + 2 },
    vehiclePrice: { not: null, gt: 0 },
    id: { not: lead.id },
  },
  select: { vehiclePrice: true, vehicleYear: true, vehicleMileage: true },
});
```

**Histogram buckets:**
```typescript
// Auto-bucket: rozdělíme rozsah na 8-12 sloupců
const prices = similar.map(s => s.vehiclePrice!);
const min = Math.min(...prices);
const max = Math.max(...prices);
const bucketSize = Math.ceil((max - min) / 10);
// Bucket kde je aktuální lead = zvýrazněný (orange)
```

**Minimální počet:** Pokud < 5 podobných vozů → zobrazit text "Nedostatek dat pro cenovou analýzu" místo grafu.

**Jen SOUKROMNIK:** Tento modul se zobrazuje pouze pro leady kategorie SOUKROMNIK (soukromí prodejci aut).

---

### Modul B: AI cenové vyhodnocení

**Co:** Textový verdikt: "Cena je **pod průměrem** (o 12%)" / "Cena je **nad průměrem** (o 8%)" / "Cena je **v normálu**".

**Jak:** Čistá matematika, žádné AI API volání:
```typescript
const median = calculateMedian(prices);
const percentile = calculatePercentile(prices, lead.vehiclePrice);
const deviation = ((lead.vehiclePrice - median) / median) * 100;

let verdict: "LOW" | "OK" | "HIGH";
if (deviation < -15) verdict = "LOW";       // Pod průměrem > 15%
else if (deviation > 15) verdict = "HIGH";  // Nad průměrem > 15%
else verdict = "OK";                        // V normálu ± 15%
```

**UI:** Barevný badge + text:
- `LOW` → zelený badge "Pod průměrem (−12%)" + "Dobrá příležitost"
- `OK` → šedý badge "V normálu" 
- `HIGH` → oranžový badge "Nad průměrem (+8%)" + "Vyšší cena"

**Faktory zobrazené pod verdiktem:**
- Medián podobných: `XXX XXX Kč`
- Rozsah: `XX XXX — X XXX XXX Kč`
- Počet porovnaných: `N vozů`
- Rok ± 2, km ± 50k

**Jen SOUKROMNIK.**

---

### Modul C: Indikátor kompletnosti dat

**Co:** Progress bar + checklist co chybí.

**Definice kompletnosti:**

**SOUKROMNIK (max 10 bodů):**
| Pole | Body | Popis |
|------|------|-------|
| phone | 2 | Telefon |
| city | 1 | Město |
| vehicleBrand | 1 | Značka |
| vehicleModel | 1 | Model |
| vehicleYear | 1 | Rok |
| vehiclePrice | 2 | Cena |
| vehicleMileage | 1 | Nájezd |
| listingTitle | 1 | Titulek |

**AUTOBAZAR/VRAKOVISTE (max 10 bodů):**
| Pole | Body | Popis |
|------|------|-------|
| phone | 2 | Telefon |
| email | 1 | Email |
| web | 1 | Web |
| city | 1 | Město |
| address | 1 | Adresa |
| ico | 1 | IČO |
| googleRating | 1 | Google rating |
| estimatedSize | 1 | Velikost |
| estimatedInventory | 1 | Počet aut |

**UI:**
```
Kompletnost dat: ████████░░ 80%
✅ Telefon  ✅ Značka  ✅ Model  ✅ Rok  ✅ Cena
❌ Město  ❌ Nájezd  ✅ Titulek
```

Barva progress baru:
- ≥ 80% → zelená
- 50-79% → oranžová
- < 50% → červená

**Implementace:** Čistě frontend logika, žádné API — počítá se z dat leadu které už máme.

---

### Modul D: Extrakce výbavy z titulku

**Co:** Parsování výbavy (výbavové prvky) z `listingTitle` pomocí regex/keyword matching.

**Jak:** Frontend utility funkce (žádné API):
```typescript
const EQUIPMENT_KEYWORDS: Record<string, string> = {
  // Převodovka
  "automat": "Automat",
  "automatická": "Automat",
  "manuál": "Manuál",
  "dsg": "DSG",
  // Palivo
  "benzín": "Benzín",
  "nafta": "Diesel",
  "diesel": "Diesel",
  "hybrid": "Hybrid",
  "elektro": "Elektro",
  "cng": "CNG",
  "lpg": "LPG",
  // Výbava
  "4x4": "4x4",
  "awd": "AWD",
  "klima": "Klimatizace",
  "tempomat": "Tempomat",
  "navi": "Navigace",
  "xenon": "Xenon",
  "led": "LED",
  "kůže": "Kůže",
  "panorama": "Panorama",
  "tažné": "Tažné",
  "park": "Parkovací senzory",
  "kamera": "Kamera",
  "vyhřívan": "Vyhřívaná sedadla",
  "serviska": "Servisní knížka",
  "1. majitel": "1. majitel",
  "garáž": "Garážováno",
  // Stav
  "havarovan": "Havarované",
  "neboura": "Nebourané",
  "zánovní": "Zánovní",
};

function extractEquipment(title: string | null): string[] {
  if (!title) return [];
  const lower = title.toLowerCase();
  return Object.entries(EQUIPMENT_KEYWORDS)
    .filter(([keyword]) => lower.includes(keyword))
    .map(([, label]) => label);
}
```

**UI:** Barevné tagy/chipy pod titulkem:
```
🔧 Automat | Diesel | 4x4 | Klima | Tažné | Servisní knížka
```

Typy chipů:
- Modrý: převodovka, palivo
- Zelený: výbava
- Žlutý: stav (zánovní, 1. majitel)
- Červený: negativní (havarované)

**Jen SOUKROMNIK** (business leady nemají listingTitle s výbavou).

---

### Modul E: Porovnání s podobnými leady

**Co:** Malá tabulka 3-5 nejpodobnějších leadů z DB.

**Jak:** Součást stejného API endpointu `market-analysis`:
```typescript
const topSimilar = await prisma.scoutLead.findMany({
  where: {
    vehicleBrand: lead.vehicleBrand,
    vehicleModel: lead.vehicleModel,
    vehicleYear: { gte: lead.vehicleYear - 2, lte: lead.vehicleYear + 2 },
    vehiclePrice: { not: null },
    id: { not: lead.id },
  },
  orderBy: [
    // Sort by closest price to current lead
    { vehiclePrice: "asc" },
  ],
  take: 10,
  select: {
    id: true,
    vehiclePrice: true,
    vehicleYear: true,
    vehicleMileage: true,
    city: true,
    source: true,
    sourceUrl: true,
    listingTitle: true,
  },
});

// Pick 5 closest by price distance
const sorted = topSimilar.sort((a, b) => 
  Math.abs(a.vehiclePrice! - lead.vehiclePrice!) - 
  Math.abs(b.vehiclePrice! - lead.vehiclePrice!)
).slice(0, 5);
```

**UI tabulka:**
| Titulek | Rok | Cena | Km | Město | Zdroj |
|---------|-----|------|----|-------|-------|
| Škoda Octavia 2.0 TDI | 2020 | 385 000 Kč | 92 000 | Praha | Bazoš |
| Škoda Octavia Combi | 2019 | 412 000 Kč | 78 000 | Brno | Sauto |

Kliknutí na řádek → navigace na detail daného leadu.

**Jen SOUKROMNIK.**

---

## §3 UI Layout — nový design karty

### Aktuální layout (2 sloupce: 2/3 + 1/3)
```
┌─────────────────────────────────┬───────────────────┐
│ Kontakt                         │ Status + Score     │
│ Lokace                          │ Akce              │
│ Business / Vozidlo              │ Poznámky          │
│ Zdroj                           │ Activity Log      │
└─────────────────────────────────┴───────────────────┘
```

### Nový layout (3 sekce)
```
┌─────────────────────────────────┬───────────────────┐
│ ┌─── Kompletnost dat (C) ────┐  │ Status + Score     │
│ │ ████████░░ 80% ✅✅✅❌❌  │  │ Cenový verdikt (B) │
│ └────────────────────────────┘  │ Akce              │
│                                  │ Poznámky          │
│ Kontakt                         │ Activity Log      │
│ Lokace                          │                   │
│ Vozidlo + Výbava tagy (D)       │                   │
│                                  │                   │
│ ┌─── Cenová distribuce (A) ──┐  │                   │
│ │ ▁▃▅▇█▅▃▁  [aktuální=█]    │  │                   │
│ │ Medián: 385k, Rozsah: ...  │  │                   │
│ └────────────────────────────┘  │                   │
│                                  │                   │
│ Podobné leady (E)               │                   │
│ ┌─────┬─────┬───────┬─────┐    │                   │
│ │ ... │ ... │ ...   │ ... │    │                   │
│ └─────┴─────┴───────┴─────┘    │                   │
│                                  │                   │
│ Zdroj info                      │                   │
└─────────────────────────────────┴───────────────────┘
```

### Pozice modulů v kartě
1. **Kompletnost dat (C)** — na začátku levého sloupce, vždy viditelný
2. **Cenový verdikt (B)** — v pravém sloupci pod Score (badge)
3. **Výbava tagy (D)** — pod Vehicle Info kartou
4. **Cenová distribuce (A)** — nová sekce v levém sloupci pod vozidlem
5. **Podobné leady (E)** — nová sekce v levém sloupci pod grafem

---

## §4 Nový API endpoint

### `GET /api/scout-leads/[id]/market-analysis`

**Request:** žádné query parametry

**Response:**
```typescript
interface MarketAnalysisResponse {
  // Cenová distribuce
  priceDistribution: {
    buckets: Array<{
      min: number;
      max: number;
      count: number;
      isCurrent: boolean; // bucket kde je aktuální lead
    }>;
    stats: {
      median: number;
      mean: number;
      min: number;
      max: number;
      count: number; // celkem podobných vozů
      percentile: number; // percentil aktuální ceny (0-100)
    };
  } | null; // null pokud < 5 podobných

  // Cenový verdikt
  priceVerdict: {
    verdict: "LOW" | "OK" | "HIGH";
    deviationPercent: number; // odchylka od mediánu
    label: string; // "Pod průměrem (−12%)"
  } | null;

  // Podobné leady
  similarLeads: Array<{
    id: string;
    listingTitle: string | null;
    vehicleYear: number | null;
    vehiclePrice: number | null;
    vehicleMileage: number | null;
    city: string | null;
    source: string;
    sourceUrl: string | null;
  }>;
}
```

**RBAC:** Stejná jako GET /api/scout-leads/[id] — ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR, BROKER (vlastní).

**Performance:** 
- Jeden Prisma query s `findMany` + JS aggregation
- Cache: žádný (data se mění s novými leady, ale endpoint se volá jen na detail page)
- Očekávaná doba: < 200ms (index na vehicleBrand + vehicleModel)

**Prisma index (doporučený):**
```prisma
@@index([vehicleBrand, vehicleModel, vehicleYear])
```

---

## §5 Implementační kroky

### Krok 1: API endpoint `market-analysis`
**Soubor:** `app/api/scout-leads/[id]/market-analysis/route.ts` (nový)
- Fetch lead by ID
- Query similar leads (brand + model ± 2 roky)
- Compute histogram buckets, stats, percentile
- Compute verdict (LOW/OK/HIGH)
- Pick 5 closest similar leads
- Return MarketAnalysisResponse

### Krok 2: Frontend utility — equipment extraction
**Soubor:** `lib/equipment-parser.ts` (nový, ~50 řádků)
- `extractEquipment(title: string): string[]`
- Keyword map pro české výbavové prvky

### Krok 3: Frontend utility — data completeness
**Soubor:** `lib/lead-completeness.ts` (nový, ~40 řádků)
- `calculateCompleteness(lead, category): { score, max, percent, missing[] }`
- Oddělená logika pro SOUKROMNIK vs AUTOBAZAR

### Krok 4: Nové UI komponenty
**Soubory** (v `components/admin/scout-leads/`):
- `LeadDataCompleteness.tsx` — progress bar + checklist (Modul C)
- `LeadPriceChart.tsx` — Recharts BarChart s highlighted bucket (Modul A)
- `LeadPriceVerdict.tsx` — badge + stats text (Modul B)
- `LeadEquipmentTags.tsx` — chip/tag list (Modul D)
- `LeadSimilarTable.tsx` — mini tabulka podobných (Modul E)

### Krok 5: Integrace do ScoutLeadDetail.tsx
- Import nových komponent
- Fetch `market-analysis` v useEffect (SOUKROMNIK only)
- Vložit komponenty do layoutu dle §3

### Krok 6: Prisma index
```prisma
// V schema.prisma, model ScoutLead:
@@index([vehicleBrand, vehicleModel, vehicleYear])
```
+ `npx prisma migrate dev --name add-vehicle-search-index`

---

## §6 Co NENÍ součástí tohoto plánu

1. **AI API volání** — žádné Claude API, žádné externí API. Vše z vlastních dat.
2. **Predikce ceny** — to by vyžadovalo ML model. Jen porovnání s mediánem.
3. **Výbava z externího zdroje** — jen parsing z titulku. Kvalita závisí na tom co prodejce napíše.
4. **Historické cenové trendy** — nemáme časovou řadu cen, jen aktuální snapshot. (Možné v budoucnu po měsících scrapování.)
5. **AUTOBAZAR market analysis** — business leady nemají vehicle data, grafy se zobrazují jen pro SOUKROMNIK.

---

## §7 Acceptance Criteria

- [ ] API endpoint `GET /api/scout-leads/[id]/market-analysis` vrací cenovou distribuci, verdikt, podobné leady
- [ ] Histogram zobrazuje 8-12 cenových bucketů, aktuální lead je zvýrazněný (orange)
- [ ] Verdikt LOW/OK/HIGH se zobrazuje jako barevný badge v pravém sloupci
- [ ] Kompletnost dat zobrazuje progress bar + checklist chybějících polí
- [ ] Výbavové tagy se extrahují z listingTitle a zobrazují jako chipy
- [ ] Tabulka podobných leadů zobrazuje 3-5 nejbližších (klikatelné)
- [ ] Moduly A, B, D, E se zobrazují POUZE pro SOUKROMNIK
- [ ] Modul C (kompletnost) se zobrazuje pro VŠECHNY kategorie
- [ ] Pokud < 5 podobných vozů → graf + verdikt se nezobrazují, text "Nedostatek dat"
- [ ] Prisma index na [vehicleBrand, vehicleModel, vehicleYear]
- [ ] Endpoint má RBAC ochranu (stejná jako GET /api/scout-leads/[id])

---

## §8 STOP pravidla

- **STOP-1:** Recharts BarChart nefunguje s bucket daty → přepnout na jednoduchý HTML/CSS bar chart
- **STOP-2:** Market analysis query trvá > 500ms → přidat DB index, omezit na 1000 leadů max
- **STOP-3:** Výbavové keywords mají příliš mnoho false positives → omezit na 10 nejspolehlivějších keywords
- **STOP-4:** Kompletnost data logic je nekonzistentní s scoring.py → sladit váhy

---

## §9 Soubory k vytvoření / úpravě

| Soubor | Typ | Rozsah |
|--------|-----|--------|
| `app/api/scout-leads/[id]/market-analysis/route.ts` | NOVÝ | ~120 řádků |
| `lib/equipment-parser.ts` | NOVÝ | ~50 řádků |
| `lib/lead-completeness.ts` | NOVÝ | ~40 řádků |
| `components/admin/scout-leads/LeadDataCompleteness.tsx` | NOVÝ | ~60 řádků |
| `components/admin/scout-leads/LeadPriceChart.tsx` | NOVÝ | ~80 řádků |
| `components/admin/scout-leads/LeadPriceVerdict.tsx` | NOVÝ | ~40 řádků |
| `components/admin/scout-leads/LeadEquipmentTags.tsx` | NOVÝ | ~30 řádků |
| `components/admin/scout-leads/LeadSimilarTable.tsx` | NOVÝ | ~60 řádků |
| `components/admin/scout-leads/ScoutLeadDetail.tsx` | ÚPRAVA | +30 řádků (imports + layout) |
| `prisma/schema.prisma` | ÚPRAVA | +1 řádek (index) |

**Celkový rozsah:** ~510 řádků nového kódu, ~30 řádků úprav. Střední náročnost.
