# Plan — Task #86 v2: TCO Breakdown + Financování kalkulačka na detail page

**Datum:** 2026-04-06 (v1) → 2026-04-07 (v2 — rozšířený scope)
**Agent:** PLANOVAC
**Priorita:** P1 HIGH
**Návazné tasky:** #78 (research liquidity, completed), #90 (legal brief, completed), #82 (perf audit, pending), follow-up Part compatibility refactor (TBD)
**Souvislost s memory:** `project_wolt_model_platform_wide.md`

---

## ZMĚNA SCOPE V v2 (2026-04-07)

Po team-lead nudge dispatchi byly přidány tyto requirements:

1. **Pozice flexible** ("dole někde") — autonomie planovače
2. **Mix NEW + USED parts paralelně** — `Part.partType` enum split, side-by-side ceny v každé kategorii
3. **Cena format min–max + průměr** — per partType (NEW vs USED) zvlášť
4. **NOVÁ DRUHÁ SEKCE: Financování kalkulačka** — 2-tab UI (Vlastní úvěr / HomeCredit) s admin-managed sazbou
5. **Setting model** (key-value) pro `homecredit_rate` + budoucí konfigurace
6. **Marketing copy** pod celým blokem
7. **2 nové open questions** (Q6 Setting model, Q7 reverse cross-link)

→ Plán expanded z 18 na 22 sekcí, estimate M → **M+** (~10-12 hod, 1.5 dev day)

---

## 1. CÍL & BUSINESS KONTEXT

**Co stavíme:** Na detail page inzerátu (`/nabidka/[slug]`) PŘIDÁME jednotný blok **"Náklady vlastnictví"** se 2 sekcemi:

### Sekce A: TCO Breakdown (díly)
Pro konkrétní auto (brand + model + year) zobrazíme ~20 user-friendly kategorií dílů s reálnou cenou:
- **Side-by-side NEW vs USED:** "Brzdové desky — nové od 1 200 Kč | použité od 400 Kč"
- Format **min–max (průměr)**: "Brzdové desky: nové 1 200–3 500 Kč (Ø 2 100), použité 400–900 Kč (Ø 650)"
- CTA do eshopu per kategorie/partType

### Sekce B: Financování kalkulačka
- 2 módy (taby): **Vlastní úvěr** (info-only) | **HomeCredit** (active calculator)
- HomeCredit sazba z **DB Setting** (`homecredit_rate`), admin updatuje 1 input
- Annuita formula (re-use z existujícího PWA komponentu)
- Default tab: HomeCredit (pushuje partner deal)
- Disclaimer "orientační, schválení určuje HomeCredit"

**Proč spolu (TCO + financování v 1 bloku):**
- Kupující auta vidí **celkový obrázek** (cena + měsíční splátka + cena dílů) na 1 místě
- Killer marketing claim: *"Spočítáme náklady vlastnictví (díly + financování) hned u inzerátu — to nikde jinde nenajdeš."*

**Měříme úspěch:**
- TCO viewed (intersection observer 50 % visible)
- TCO category click → eshop transition
- TCO → eshop add-to-cart conversion
- Financing calc opened
- Financing tab switch (Vlastní úvěr vs HomeCredit)
- HomeCredit lead capture (pokud přidáme CTA "Chci nabídku")
- Long-tail SEO: "kolik stojí náhradní díly Octavia 2", "splátka Škoda Octavia 2018"

---

## 2. USER ROZHODNUTÍ (z dispatchů — JIŽ ROZHODNUTO)

| # | Otázka | Rozhodnutí | Zdroj |
|---|--------|------------|-------|
| D1 | Kolik kategorií TCO | **~20 user-friendly kategorií** | dispatch v1 |
| D2 | Kde umístit | **Detail page `/nabidka/[slug]`**, pozice "dole někde" — pod galerií / pod popisem (autonomie planovače) | v1 + v2 nudge |
| D3 | Zdroj dat TCO | **Real-time eshop SKUs** + category-average fallback | v1 |
| D4 | Mix parts | **Side-by-side NEW + USED** z `Part.partType` enum | v2 nudge |
| D5 | Cena format | **Min–max + průměr** per partType: "400–1500 Kč (Ø 850)" | v2 nudge |
| D6a | Financování — sazby | **2 módy:** Vlastní úvěr (info) / HomeCredit (active s DB sazbou) | v2 nudge |
| D6b | Per-listing override sazby | **NE** — keep simple, jedna sazba pro celou platformu | v2 nudge |
| D6c | Default tab | **HomeCredit** (pushuje partner deal) | v2 nudge |
| D6d | Admin UI | **`/admin/nastaveni/financovani`** — 1 input + save | v2 nudge |

---

## 3. AUDIT EXISTING BASELINE

### 3.1 Co už existuje (DON'T REINVENT)

#### TCO doména:

**`components/web/RecommendedParts.tsx`** (206 ř., `"use client"`, memo)
- Fetchne `/api/parts/for-vehicle?brand=X&model=Y&year=Z&limit=6` v useEffect
- Pattern: client component, skeleton, returns null when empty
- CTA: `/dily/katalog?brand=...&model=...&year=...`
- **Pozn.:** existuje paralelně k TCO — má JINÝ účel ("konkrétní výběr 6 dílů" vs TCO "souhrnná kalkulace per kategorie")

**`app/api/parts/for-vehicle/route.ts`** (103 ř.)
- Zod: brand+, model+, year?, limit (default 6, max 20)
- WHERE: `status: ACTIVE, stock > 0, OR: [universalFit, contains brand+model]`
- Year window filter
- Order: viewCount, createdAt
- **Vrací items+totalCount, NE aggregate** → pro TCO potřebujeme nový endpoint

**`app/(web)/nabidka/[slug]/page.tsx`** (server, ISR `revalidate=600`)
- **DUAL render**: Vehicle (broker) → fallback `renderListingDetail()` (Listing)
- `RecommendedParts` import na řádku 28, použito 2× (~ř. 799 Vehicle, ~ř. 1074 Listing)
- `generateMetadata()` dělá stejný dual lookup pro SEO
- → TCO + Financování insert MUSÍ být ve VŠECH 2 větvích

**`app/(web)/dily/katalog/page.tsx`** existuje, podporuje query params `brand`, `model`, `year`, `category` — **target stránka pro TCO CTA odkazy hotová**.

#### Financování doména:

**`components/web/FinancovaniCalc.tsx`** (130 ř., client, web verze)
- **Primitivní:** `monthlyPayment = price / 48` (žádná annuita formula!)
- Lead capture form: jméno + telefon → POST `/api/contact`
- Hard-coded "úrok od 3,9 % p.a." text
- **NEPOUŽITELNÉ as-is** pro detail page TCO — moc lead-capture-centric, špatná matematika

**`components/pwa/gamification/FinancingCalculator.tsx`** (302 ř., client, brokerová PWA)
- **Full annuita formula** (řádky 39-42):
  ```ts
  monthlyPayment = (loanAmount * monthlyRate * (1+monthlyRate)^months) / ((1+monthlyRate)^months - 1)
  ```
- Sliders: cena, akontace %, splátky (12-72 měs.), úrok %
- **Sazba HARD-CODED** `DEFAULT_RATE = 5.9` (řádek 9) → musíme nahradit DB fetch
- Email send funkcionalita (FINANCING template) — out of scope pro TCO insert
- **Pattern: USE THIS** jako základ pro `HomeCreditCalculator.tsx` (extract annuita logic)

#### Settings infrastruktura:

**`Setting` / `Config` / `AppSetting` model v Prisma — NEEXISTUJE.**
- 51 modelů v `prisma/schema.prisma`, žádný generic key-value config
- Žádné existující řešení ani jako User.metadata fallback
- → **Net-new model + migrace nutná** (viz §12.1)

**`/admin/nastaveni` route v `app/(admin)/admin/` — NEEXISTUJE.**
- Existuje 24 admin route (brokers, dashboard, feeds, inzerce, leads, manager/*, marketplace, partners, payments, payouts, vehicles)
- Žádný "settings" / "nastaveni" / "config" pattern
- → **Net-new directory** (viz §12.2)

#### `Part.partType` enum:

**`prisma/schema.prisma:905`**
```prisma
partType String @default("USED") // USED, NEW, AFTERMARKET
```
**`prisma/schema.prisma:950`**
```prisma
@@index([partType])  ✅ indexed
```

→ **Existuje, indexed, ready to use** pro TCO NEW/USED split. AFTERMARKET je `NEW` z BAP perspektivy (nový aftermarket díl) — v UI buďto sloučit s NEW pod "Nové", nebo mít 3 kolony (rozhodnutí: sloučit pod "Nové" — méně cluttered UI).

### 3.2 Co NEEXISTUJE (musíme postavit)

- ❌ `app/api/parts/tco/route.ts`
- ❌ `lib/tco/` (index, categories, normalize, types)
- ❌ `components/web/TCOBreakdown.tsx` + 2 sub-komponenty
- ❌ JSON-LD `additionalProperty` blok
- ❌ **`Setting` Prisma model + migrace**
- ❌ **`lib/settings.ts` helper (`getSetting`, `setSetting` s cache)**
- ❌ **`/admin/nastaveni/financovani/page.tsx` + form action**
- ❌ **`components/web/FinancingTabs.tsx` + `HomeCreditCalculator.tsx`**

---

## 4. KRITICKÉ NÁLEZY Z CODEBASE (NEBYLY V BRIEFU — NE V v1, NE V v2)

### 4.1 ⚠️ `Part.compatibleBrands` / `compatibleModels` jsou JSON STRINGS (NE Postgres array)

```prisma
model Part {
  compatibleBrands   String?  // JSON: ["Škoda", "VW"]
  compatibleModels   String?  // JSON: ["Octavia", "Golf"]
}
```

**Důsledek:** fragile substring `{ contains: brand }` match. "VW" matches "VW Group", case-sensitive ("Škoda" ≠ "skoda"), full table scan.

**Pro TCO + NEW/USED split:** dataset bude pravděpodobně řídký → fallback path je KRITICKÝ. Plus normalize helper (alias map, lowercase compare).

**Long-term řešení = follow-up tech debt task (TBD numbering)** Postgres array nebo many-to-many. **Mimo scope #86.**

### 4.2 ⚠️ `Part.category` enum má jen **12 hodnot**, user chce **~20 kategorií**

```
ENGINE, TRANSMISSION, BRAKES, SUSPENSION, BODY, ELECTRICAL,
INTERIOR, WHEELS, EXHAUST, COOLING, FUEL, OTHER
```

**Řešení:** Mapping table 1-to-many (`lib/tco/categories.ts`) — některé user kategorie jsou subset enum bucketu + extra `name LIKE '%filtr%'` filter. Viz §7.

### 4.3 ⚠️ Detail page DUAL render (Vehicle vs Listing)

`nabidka/[slug]/page.tsx`: Vehicle větev (~ř. 600-820) + Listing větev (`renderListingDetail`, ~ř. 1000+).

**TCO + Financování bloky musí být insertovány do OBOU větví 2×**, jako RecommendedParts.

### 4.4 ⚠️ Server vs client trade-off

**TCO = server component** (lepší SEO + ISR cache + JSON-LD), vědomě breaks RecommendedParts pattern.

**Financování = client component** (interaktivní sliders, tab state, výpočet v reálném čase) — žádná alternativa.

→ Hybrid approach: TCOBreakdown (server) + FinancingTabs (client). Oba dohromady v 1 wrapping section "Náklady vlastnictví".

### 4.5 ⚠️ Cache klíč pro TCO musí být per (brand,model,year), NE per slug

`unstable_cache` s klíčem `["tco", brand, model, year]`, revalidate 86400s. Tím všech 100 listingů Octavia 2018 sdílí JEDEN cache entry.

### 4.6 ⚠️ NOVÉ — Setting fetch musí mít cache (jinak DB hit per render)

`getSetting('homecredit_rate')` se čte při každém renderu detail page. Bez cache = DB hit per slug.

**Řešení:** `unstable_cache` wrapper s `revalidate: 3600` (1h) + tag `settings`. Admin save action volá `revalidateTag('settings')` → instant invalidation.

### 4.7 ⚠️ NOVÉ — Existující 2 FinancingCalc komponenty NESPOJOVAT

- `FinancovaniCalc.tsx` (web) je lead-capture form, primitive matematika — NEPOUŽÍVAT pro TCO
- `FinancingCalculator.tsx` (PWA broker) má annuita formuli, ale je to broker tool s email send

**Decision:** **NOVÝ komponent** `HomeCreditCalculator.tsx` v `components/web/`. Extract annuita logic do `lib/financing/calculate.ts` → použít z obou (PWA může v budoucnu refaktorovat). Existující 2 komponenty nechat netknuté (out of scope refactor).

---

## 5. DATA FLOW DESIGN — TCO

### 5.1 Vstup
```ts
{ brand: string, model: string, year?: number }
```

### 5.2 Nový endpoint: `GET /api/parts/tco`

**Path:** `app/api/parts/tco/route.ts`

**Query:** `brand` (required), `model` (required), `year?`

**Logika (pseudo):**
```ts
// 1. Normalize brand/model (alias map, trim, lowercase)
const brandNorm = normalizeBrand(brand);
const modelNorm = normalizeModel(model);

// 2. Year window filter (pokud year)
const yearWindowFilter = year ? [
  { OR: [{ compatibleYearFrom: null }, { compatibleYearFrom: { lte: year } }] },
  { OR: [{ compatibleYearTo: null }, { compatibleYearTo: { gte: year } }] },
] : [];

// 3. Base WHERE
const baseWhere = {
  status: "ACTIVE",
  stock: { gt: 0 },
  OR: [
    { universalFit: true },
    {
      AND: [
        { compatibleBrands: { contains: brandNorm } },
        { compatibleModels: { contains: modelNorm } },
        ...yearWindowFilter,
      ],
    },
  ],
};

// 4. groupBy category × partType (5 hodnot enum + 3 partType = max 36 kombinací, většina prázdná)
const stats = await prisma.part.groupBy({
  by: ["category", "partType"],
  where: baseWhere,
  _count: { _all: true },
  _min: { price: true },
  _max: { price: true },
  _avg: { price: true },
});

// 5. Pro každou user-friendly kategorii (mapping table) split na "Nové" (NEW + AFTERMARKET) vs "Použité" (USED)
//    Pokud mapping vyžaduje keyword filter (např. "Olej a filtry" = ENGINE + name LIKE '%filtr%'),
//    udělat targeted query (max ~20 dotazů per call, ale cached 24h)

// 6. Fallback: pokud kategorie+partType má < 3 SKU pro brand+model →
//    spočítat aggregate z VŠECH parts té kategorie+partType (universal benchmark) → source: "fallback"

// 7. Return strukturu (viz §5.3)
```

**Cache:**
```ts
import { unstable_cache } from "next/cache";

export const getTCOData = unstable_cache(
  async (brand, model, year) => computeTCO(brand, model, year),
  ["tco-data-v1"],
  { revalidate: 86400, tags: ["tco"] }
);
```

### 5.3 Response shape

```ts
type TCOPriceStats = {
  count: number;
  priceMin: number | null;
  priceMax: number | null;
  priceAvg: number | null;
  source: "exact" | "fallback" | "none";
};

type TCOCategory = {
  key: string;              // "engine_oil", "brake_pads"
  label: string;            // "Olej a filtry"
  enumCategory: string;     // "ENGINE"
  newParts: TCOPriceStats;  // NEW + AFTERMARKET sloučeno
  usedParts: TCOPriceStats; // USED only
  catalogUrlNew: string;    // /dily/katalog?category=engine&partType=NEW&brand=...
  catalogUrlUsed: string;   // /dily/katalog?category=engine&partType=USED&brand=...
};

type TCOResponse = {
  brand: string;
  model: string;
  year: number | null;
  categories: TCOCategory[];   // ~20 položek
  summary: {
    // Sum of min..max přes všechny kategorie, kde je alespoň 1 SKU
    totalEstimateMinNew: number;
    totalEstimateMaxNew: number;
    totalEstimateMinUsed: number;
    totalEstimateMaxUsed: number;
    currency: "CZK";
    confidence: "high" | "medium" | "low";
    disclaimer: string;
  };
};
```

### 5.4 Volání ze server component

`TCOBreakdown` je **async server component**, volá `getTCOData()` přímo (interní funkce), NE přes HTTP. Endpoint `/api/parts/tco` existuje paralelně pro client-side use cases (analytics debug, admin tools).

---

## 6. UI KOMPONENTY — TCO

### 6.1 `components/web/TCOBreakdown.tsx` (NOVÝ) — server component

```tsx
import { getTCOData } from "@/lib/tco";
import { TCOCategoryRow } from "./TCOCategoryRow";
import { TCOSummaryCard } from "./TCOSummaryCard";

type Props = { brand: string; model: string; year?: number };

export async function TCOBreakdown({ brand, model, year }: Props) {
  const data = await getTCOData(brand, model, year);

  if (!data || data.categories.every(
    (c) => c.newParts.source === "none" && c.usedParts.source === "none"
  )) {
    return null;
  }

  return (
    <section className="my-12" data-tco-section>
      <header className="mb-6">
        <h2 className="text-2xl font-bold">
          Kolik tě bude stát údržba {brand} {model}
        </h2>
        <p className="text-sm text-zinc-600">
          Reálné ceny náhradních dílů z eshopu Carmakler — nové i použité
        </p>
      </header>

      <TCOSummaryCard summary={data.summary} />

      <div className="mt-8 grid gap-3">
        {data.categories.map((cat) => (
          <TCOCategoryRow key={cat.key} category={cat} />
        ))}
      </div>

      <p className="mt-6 text-xs text-zinc-500">{data.summary.disclaimer}</p>
    </section>
  );
}
```

### 6.2 `components/web/TCOCategoryRow.tsx` (NOVÝ) — server component

**Layout:** ikona | label | 2 sloupce (Nové | Použité) | šipka. Na mobile stacked.

```tsx
type Props = { category: TCOCategory };

export function TCOCategoryRow({ category }: Props) {
  if (category.newParts.source === "none" && category.usedParts.source === "none") {
    return null;
  }

  return (
    <div
      className="flex items-center gap-4 rounded-xl border border-zinc-200 p-4 hover:border-orange-500 hover:bg-orange-50/30 transition"
      data-tco-category={category.key}
    >
      <CategoryIcon category={category.key} />
      <div className="flex-1">
        <h3 className="font-semibold">{category.label}</h3>
      </div>

      {/* Nové */}
      <PriceColumn
        label="Nové"
        stats={category.newParts}
        href={category.catalogUrlNew}
        accentClass="text-blue-600"
      />

      {/* Použité */}
      <PriceColumn
        label="Použité"
        stats={category.usedParts}
        href={category.catalogUrlUsed}
        accentClass="text-orange-600"
      />
    </div>
  );
}

function PriceColumn({ label, stats, href, accentClass }) {
  if (stats.source === "none") {
    return <div className="w-32 text-center text-xs text-zinc-400">{label} —</div>;
  }
  return (
    <Link href={href} className="w-32 text-right">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`font-bold ${accentClass}`}>
        {formatPrice(stats.priceMin)}–{formatPrice(stats.priceMax)} Kč
      </div>
      <div className="text-xs text-zinc-500">
        Ø {formatPrice(stats.priceAvg)}{stats.source === "fallback" && " · průměr"}
      </div>
    </Link>
  );
}
```

### 6.3 `components/web/TCOSummaryCard.tsx` (NOVÝ) — server component

**Velký box s 2 intervaly** (Nové vs Použité):

```tsx
export function TCOSummaryCard({ summary }: { summary: TCOSummary }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 p-6">
      <div className="text-sm text-zinc-700 mb-2">Odhadovaná celková cena dílů</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-blue-600 font-medium">NOVÉ DÍLY</div>
          <div className="text-2xl font-bold text-zinc-900">
            {formatPrice(summary.totalEstimateMinNew)}–{formatPrice(summary.totalEstimateMaxNew)} Kč
          </div>
        </div>
        <div>
          <div className="text-xs text-orange-600 font-medium">POUŽITÉ DÍLY</div>
          <div className="text-2xl font-bold text-zinc-900">
            {formatPrice(summary.totalEstimateMinUsed)}–{formatPrice(summary.totalEstimateMaxUsed)} Kč
          </div>
        </div>
      </div>
      <ConfidenceBadge level={summary.confidence} />
    </div>
  );
}
```

### 6.4 Insertion points v `nabidka/[slug]/page.tsx`

```tsx
{/* Pod popisem vozu, nad RecommendedParts */}
<section className="mt-12">
  <h2 className="text-3xl font-bold mb-2">Náklady vlastnictví</h2>
  <p className="text-zinc-600 mb-8">
    Spočítáme za tebe ceny náhradních dílů a měsíční splátku — to nikde jinde nenajdeš.
  </p>
  <TCOBreakdown brand={...} model={...} year={...} />
  <FinancingTabs vehiclePrice={...} />
</section>

{/* Existující RecommendedParts ZACHOVAT (paralelní účel) */}
<RecommendedParts brand={...} model={...} year={...} />
```

**Insert do OBOU větví** (Vehicle ~ř. 800, Listing ~ř. 1075).

---

## 7. MAPPING TABLE: ~20 USER-FRIENDLY → 12 ENUM × 2 PARTTYPE

> First-pass mapping. Některé spadnou do `OTHER` — viz Q3.
> NEW kolona = `partType IN ('NEW', 'AFTERMARKET')`. USED kolona = `partType = 'USED'`.

| # | User-friendly | enum | Extra `name LIKE` filter | Pozn. |
|---|---------------|------|--------------------------|-------|
| 1 | Olej a filtry | ENGINE | `%olej%` OR `%filtr%` | High-frequency údržba |
| 2 | Brzdové destičky | BRAKES | `%destič%` | |
| 3 | Brzdové kotouče | BRAKES | `%kotouč%` | |
| 4 | Tlumiče | SUSPENSION | `%tlumič%` | |
| 5 | Pružiny | SUSPENSION | `%pružin%` | |
| 6 | Spojka | TRANSMISSION | `%spojk%` | |
| 7 | Rozvody | ENGINE | `%rozvod%` | |
| 8 | Vodní pumpa | COOLING | `%pump%` | |
| 9 | Chladič | COOLING | `%chladič%` | |
| 10 | Alternátor | ELECTRICAL | `%alternát%` | |
| 11 | Startér | ELECTRICAL | `%startér%` | |
| 12 | Akumulátor | ELECTRICAL | `%akumul%` OR `%baterie%` | |
| 13 | Výfuk | EXHAUST | — | celá enum |
| 14 | Pneumatiky | WHEELS | `%pneu%` | |
| 15 | Disky | WHEELS | `%disk%` | |
| 16 | Karoserie / nárazníky | BODY | `%nárazník%` OR `%blatník%` | |
| 17 | Světlomety | BODY | `%světlo%` OR `%lampa%` | |
| 18 | Zrcátka | BODY | `%zrcátk%` | |
| 19 | Sedačky / interiér | INTERIOR | — | celá enum |
| 20 | Palivo / čerpadlo | FUEL | — | celá enum |

**Kategorie, kde NEW vs USED rozdíl bude největší:**
- Olej a filtry: NEW dominuje (USED bezpečnostně problematické)
- Brzdové destičky: NEW dominuje (USED bezpečnostně problematické)
- Karoserie/nárazníky: USED dominuje (originál cena z vrakoviště je 5-10× nižší)
- Světlomety: USED dominuje
- Tlumiče, pružiny: mix — USED jsou frequent na vrakovišti

**Mapping v `lib/tco/categories.ts`** jako exportovaná konstanta + helper `getCategoryWhere(userKey, partTypeFilter)`.

---

## 8. FALLBACK PATH

**Tier 1 — exact match (per partType):** `compatibleBrands/Models contains` AND partType filter. Pokud ≥ 3 SKU → `source: "exact"`.

**Tier 2 — fallback (category+partType average):** Pokud < 3 SKU → aggregate ze všech parts v té kategorii + partType (bez brand/model filtru). UI badge "průměr kategorie".

**Tier 3 — none:** Pokud ani celá kategorie+partType nemá data → `source: "none"`. PriceColumn vrátí `"Nové —"` / `"Použité —"`.

**Asymetrický scenario:** Často bude NEW exact + USED fallback (USED dataset je řidší per model). To je OK — UI to zobrazí jednoduše.

**Confidence level:**
- `high`: ≥ 80 % kategorií má alespoň jeden source=exact
- `medium`: 40–80 %
- `low`: < 40 %

**Disclaimer text** (Q2 — final wording od legal v #80):
> "Orientační kalkulace na základě cen v eshopu Carmakler. Skutečné náklady se mohou lišit dle stavu vozu, regionu a servisu. Údaje aktualizovány denně."

---

## 9. PERFORMANCE + CACHING

### 9.1 TCO data cache
```ts
// lib/tco/index.ts
import { unstable_cache } from "next/cache";

export const getTCOData = unstable_cache(
  async (brand: string, model: string, year?: number) => computeTCO(brand, model, year),
  ["tco-data-v1"],
  { revalidate: 86400, tags: ["tco"] }
);
```

**Klíč:** brand+model+year (NE per slug). Tím všech 100 listingů Octavia 2018 sdílí 1 cache entry.

### 9.2 Setting cache (financování sazba)
```ts
// lib/settings.ts
import { unstable_cache } from "next/cache";

export const getSetting = unstable_cache(
  async (key: string) => prisma.setting.findUnique({ where: { key } }),
  ["setting-v1"],
  { revalidate: 3600, tags: ["settings"] }
);
```

**Klíč:** setting key. Admin save action volá `revalidateTag("settings")` → instant flush.

### 9.3 Query optimizations
- `groupBy(['category', 'partType'])` — Prisma podporuje multi-column groupBy
- `Part.category` má `@@index([category])` ✅
- `Part.partType` má `@@index([partType])` ✅
- Pokud groupBy pomalý → fallback `prisma.$queryRaw` s GROUP BY (benchmark v #82)
- `compatibleBrands LIKE` = full table scan, ALE 24h cache to maskuje

### 9.4 Bundle impact
- Server komponenty (TCOBreakdown + sub) → 0 KB JS
- FinancingTabs (client) → ~3 KB (annuita + tab state, žádný framework)
- Žádné externí libs

---

## 10. ANALYTICS EVENTS

| Event | Props | Trigger |
|-------|-------|---------|
| `tco_view` | `{ brand, model, year, confidence, categoriesCount }` | IntersectionObserver 50% visible |
| `tco_category_click` | `{ brand, model, category, partType: "new"\|"used", priceAvg }` | Klik na PriceColumn link |
| `tco_to_eshop` | `{ brand, model, source: "tco", category, partType }` | Navigace na `/dily/katalog` (UTM) |
| `financing_view` | `{ vehiclePrice }` | IntersectionObserver na FinancingTabs |
| `financing_tab_switch` | `{ from, to }` | Klik na tab "Vlastní úvěr" / "HomeCredit" |
| `financing_calculate` | `{ price, downPayment, months, monthly }` | Změna sliderů (debounced) |
| `financing_lead_click` | `{ price, monthly }` | Volitelný CTA "Chci nabídku HomeCredit" |

**Implementace:** `tco_view` + `financing_view` vyžadují tenký client wrapper `<TCOAnalyticsTracker>` (jen IntersectionObserver, 0 state). Ostatní events fire přímo z client komponent.

---

## 11. SEO BONUS — JSON-LD

V `nabidka/[slug]/page.tsx` přidat JSON-LD `Vehicle` schema s `additionalProperty`:

```json
{
  "@context": "https://schema.org",
  "@type": "Vehicle",
  "name": "Škoda Octavia 2.0 TDI",
  "brand": { "@type": "Brand", "name": "Škoda" },
  "model": "Octavia",
  "modelDate": "2018",
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Estimated parts cost — Olej a filtry (new)",
      "value": "1200-3500 CZK",
      "valueReference": "https://carmakler.cz/dily/katalog?category=engine&partType=NEW&brand=skoda&model=octavia"
    },
    {
      "@type": "PropertyValue",
      "name": "Estimated parts cost — Olej a filtry (used)",
      "value": "400-900 CZK"
    },
    // ... 18 dalších × 2
  ]
}
```

**SEO long-tail keywords:** "kolik stojí náhradní díly Octavia 2", "splátka Škoda Octavia 2018", "TCO Octavia", "údržba Škoda cena".

---

## 12. **NOVÁ SEKCE: FINANCOVÁNÍ KALKULAČKA**

### 12.1 Prisma Setting model (NOVÁ MIGRACE)

**`prisma/schema.prisma`** — přidat:

```prisma
model Setting {
  key         String   @id           // "homecredit_rate", "commission_rate", ...
  value       String                 // serialized: "7.90", "5", "{\"x\": 1}"
  type        String   @default("string") // string | number | decimal | boolean | json
  category    String?                // "financing", "marketplace", "shipping"
  description String?                // human-readable label
  updatedAt   DateTime @updatedAt
  updatedBy   String?                // User.id (kdo naposled změnil)

  @@index([category])
}
```

**Migrace:** `npx prisma migrate dev --name add_setting_model`

**Seed (`prisma/seed.ts`):**
```ts
await prisma.setting.upsert({
  where: { key: "homecredit_rate" },
  update: {},
  create: {
    key: "homecredit_rate",
    value: "7.90",
    type: "decimal",
    category: "financing",
    description: "HomeCredit roční úroková sazba (% p.a.)",
  },
});
```

**Zod validace** v admin save action:
```ts
const settingValueSchema = z.object({
  homecredit_rate: z.coerce.number().min(0).max(30),
});
```

**Pozn. (vyřešeno team-leadem 2026-04-07):** V scope #86 = **POUZE `homecredit_rate`** (1 row, 1 admin input). Setting model je generic, ale v MVP nepřidáváme další klíče protože:
- `commission_rate` je řešený v `Partner.commissionRate Decimal` per-partner (#76v2 §0.2 + PartnerCommissionLog audit trail) — neduplikuj globální klíč
- `default_delivery_price` je řešený v DeliveryMethod enum + per-method shipping config (#15)
- `parts_supplier_payout_threshold`, `min_order_value` neexistují v MVP → předčasná abstrakce, přidat až bude potřeba

Setting model je **generic shape**, takže future tasks můžou přidávat keys **bez migrace** (jen seed). To je správný engineering pattern.

### 12.2 Admin route `/admin/nastaveni/financovani`

**Soubory:**
- `app/(admin)/admin/nastaveni/page.tsx` — landing s linky na sub-stránky
- `app/(admin)/admin/nastaveni/financovani/page.tsx` — server component, `findUnique` + form
- `app/(admin)/admin/nastaveni/financovani/loading.tsx`
- `app/(admin)/admin/nastaveni/financovani/error.tsx`
- `app/api/admin/settings/route.ts` — POST `{ key, value }` action s ADMIN role check

**UI:** 1 input (number, step 0.1, min 0 max 30), 1 save button, success toast.

```tsx
// app/(admin)/admin/nastaveni/financovani/page.tsx
export default async function FinancovaniSettingsPage() {
  const setting = await prisma.setting.findUnique({
    where: { key: "homecredit_rate" },
  });

  return (
    <div>
      <h1>Financování — HomeCredit sazba</h1>
      <form action={saveHomeCreditRate}>
        <input
          name="value"
          type="number"
          step="0.1"
          min="0"
          max="30"
          defaultValue={setting?.value ?? "7.90"}
        />
        <button type="submit">Uložit</button>
      </form>
      <p className="text-xs">Naposledy změněno: {setting?.updatedAt}</p>
    </div>
  );
}
```

**Server action** (volaná z form):
```ts
async function saveHomeCreditRate(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Forbidden");

  const value = String(formData.get("value"));
  const parsed = z.coerce.number().min(0).max(30).parse(value);

  await prisma.setting.upsert({
    where: { key: "homecredit_rate" },
    update: { value: String(parsed), updatedBy: session.user.id },
    create: {
      key: "homecredit_rate",
      value: String(parsed),
      type: "decimal",
      category: "financing",
      description: "HomeCredit roční úrok %",
      updatedBy: session.user.id,
    },
  });

  revalidateTag("settings"); // flush cache
}
```

### 12.3 `lib/financing/calculate.ts` (extracted annuita logic)

```ts
export function calculateMonthlyPayment(
  loanAmount: number,
  annualRatePct: number,
  months: number
): number {
  if (loanAmount <= 0 || months <= 0) return 0;
  if (annualRatePct <= 0) return Math.round(loanAmount / months);

  const monthlyRate = annualRatePct / 100 / 12;
  const payment =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(payment);
}

export function calculateFinancingResult(input: {
  vehiclePrice: number;
  downPaymentPct: number;
  months: number;
  annualRatePct: number;
}) {
  const downPayment = Math.round(input.vehiclePrice * (input.downPaymentPct / 100));
  const loanAmount = input.vehiclePrice - downPayment;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, input.annualRatePct, input.months);
  const totalPaid = downPayment + monthlyPayment * input.months;
  const overpayment = totalPaid - input.vehiclePrice;
  return { downPayment, loanAmount, monthlyPayment, totalPaid, overpayment };
}
```

### 12.4 `components/web/FinancingTabs.tsx` (NOVÝ) — client komponent wrapper

```tsx
"use client";
import { useState } from "react";
import { HomeCreditCalculator } from "./HomeCreditCalculator";

type Props = { vehiclePrice: number; homecreditRate: number };

export function FinancingTabs({ vehiclePrice, homecreditRate }: Props) {
  const [tab, setTab] = useState<"homecredit" | "vlastni">("homecredit"); // default HomeCredit

  return (
    <div className="rounded-2xl border border-zinc-200 p-6">
      <h3 className="text-xl font-bold mb-4">Měsíční splátka</h3>

      <div className="flex gap-2 mb-6">
        <TabButton active={tab === "homecredit"} onClick={() => setTab("homecredit")}>
          HomeCredit
        </TabButton>
        <TabButton active={tab === "vlastni"} onClick={() => setTab("vlastni")}>
          Vlastní úvěr
        </TabButton>
      </div>

      {tab === "homecredit" && (
        <HomeCreditCalculator vehiclePrice={vehiclePrice} annualRate={homecreditRate} />
      )}

      {tab === "vlastni" && (
        <div className="text-sm text-zinc-600 space-y-2">
          <p>
            Použij vlastního poskytovatele úvěru. Měsíční splátky závisí na podmínkách tvé banky.
          </p>
          <p className="text-xs text-zinc-500">
            Tip: porovnej nabídky více bank — rozdíl mezi 4 % a 8 % p.a. je u 500 000 Kč úvěru
            na 5 let cca 100 000 Kč přeplatek.
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-500">
        Orientační výpočet. Schválení a finální podmínky určuje HomeCredit.
      </p>
    </div>
  );
}
```

**Načtení sazby:** `FinancingTabs` je client komponent → `homecreditRate` se předává jako prop ze server parent (TCOBreakdown wrapper nebo přímo nabidka/[slug]/page.tsx volá `getSetting('homecredit_rate')` server-side).

### 12.5 `components/web/HomeCreditCalculator.tsx` (NOVÝ) — client komponent

```tsx
"use client";
import { useMemo, useState } from "react";
import { calculateFinancingResult } from "@/lib/financing/calculate";
import { formatPrice } from "@/lib/utils";

const INSTALLMENT_OPTIONS = [12, 24, 36, 48, 60, 72, 84, 96];

type Props = { vehiclePrice: number; annualRate: number };

export function HomeCreditCalculator({ vehiclePrice, annualRate }: Props) {
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [months, setMonths] = useState(60);

  const result = useMemo(
    () =>
      calculateFinancingResult({
        vehiclePrice,
        downPaymentPct,
        months,
        annualRatePct: annualRate,
      }),
    [vehiclePrice, downPaymentPct, months, annualRate]
  );

  return (
    <div className="space-y-5">
      {/* Akontace slider */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-bold">Akontace</label>
          <span className="text-sm font-bold text-orange-600">
            {downPaymentPct}% ({formatPrice(result.downPayment)})
          </span>
        </div>
        <input
          type="range"
          value={downPaymentPct}
          onChange={(e) => setDownPaymentPct(Number(e.target.value))}
          min={0}
          max={50}
          step={5}
          className="w-full accent-orange-500"
        />
      </div>

      {/* Splátky */}
      <div>
        <label className="text-sm font-bold mb-2 block">Počet splátek</label>
        <div className="grid grid-cols-4 gap-2">
          {INSTALLMENT_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={
                months === m
                  ? "bg-orange-500 text-white py-2 rounded-xl text-sm font-bold"
                  : "bg-zinc-100 text-zinc-600 py-2 rounded-xl text-sm font-bold"
              }
            >
              {m} měs.
            </button>
          ))}
        </div>
      </div>

      {/* Sazba (read-only display) */}
      <div className="text-xs text-zinc-500">
        Úroková sazba: <strong>{annualRate}% p.a.</strong> (HomeCredit)
      </div>

      {/* Výsledek */}
      <div className="bg-orange-50 rounded-xl p-6 text-center">
        <p className="text-xs text-orange-600 font-medium mb-1">Měsíční splátka</p>
        <p className="text-3xl font-extrabold text-orange-600">
          {formatPrice(result.monthlyPayment)}
        </p>
        <div className="mt-3 text-xs text-zinc-500 space-y-1">
          <div>Výše úvěru: {formatPrice(result.loanAmount)}</div>
          <div>Celkem zaplaceno: {formatPrice(result.totalPaid)}</div>
          <div className="text-red-500">
            Přeplatek: +{formatPrice(result.overpayment)}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 12.6 Insertion v `nabidka/[slug]/page.tsx`

```tsx
// Server component fetch
const homecreditSetting = await getSetting("homecredit_rate");
const homecreditRate = parseFloat(homecreditSetting?.value ?? "7.90");

// Render
<section className="mt-12">
  <h2 className="text-3xl font-bold mb-2">Náklady vlastnictví</h2>
  <p className="text-zinc-600 mb-8">
    Spočítáme za tebe ceny náhradních dílů a měsíční splátku — to nikde jinde nenajdeš.
  </p>

  <div className="grid lg:grid-cols-2 gap-8">
    <TCOBreakdown brand={...} model={...} year={...} />
    <FinancingTabs vehiclePrice={vehicle.priceCzk} homecreditRate={homecreditRate} />
  </div>
</section>
```

**Insert do OBOU větví** (Vehicle ~ř. 800, Listing ~ř. 1075).

### 12.7 Disclaimer + legal compliance

Pod kalkulačkou:
> "Orientační výpočet. Schválení a finální podmínky určuje HomeCredit."

**Legal angle (#80):** Wording finalizovat společně s legal review komisionářského modelu.

---

## 13. AKCEPTAČNÍ KRITÉRIA (rozšíření v2)

### TCO sekce
- [ ] AC1: `app/api/parts/tco/route.ts` existuje, vrací správný shape (NEW + USED split)
- [ ] AC2: `lib/tco/index.ts` exportuje `getTCOData()` s `unstable_cache` (revalidate 86400)
- [ ] AC3: `lib/tco/categories.ts` mapping table ~20 user-friendly → 12 enum × 2 partType
- [ ] AC4: `components/web/TCOBreakdown.tsx` (server) renderuje sekci pro brand+model+year
- [ ] AC5: `components/web/TCOCategoryRow.tsx` zobrazuje 2 sloupce (Nové | Použité) s min–max + průměr
- [ ] AC6: `components/web/TCOSummaryCard.tsx` zobrazuje 2 intervaly (NEW total + USED total)
- [ ] AC7: 3-tier fallback funguje (exact ≥3 → category avg → none skip)
- [ ] AC8: Graceful degradation: pokud žádná data → komponent vrací null
- [ ] AC9: JSON-LD `additionalProperty` pro každou kategorii × partType

### Financování sekce
- [ ] AC10: `prisma/schema.prisma` rozšířen o `Setting` model
- [ ] AC11: Migrace `add_setting_model` aplikována, seed inicializuje `homecredit_rate=7.90`
- [ ] AC12: `lib/settings.ts` exportuje `getSetting()` s cache (revalidate 3600, tag `settings`)
- [ ] AC13: `app/(admin)/admin/nastaveni/financovani/page.tsx` ADMIN-only, 1 input + save
- [ ] AC14: Server action `saveHomeCreditRate` má ADMIN role check + zod validation + revalidateTag
- [ ] AC15: `lib/financing/calculate.ts` exportuje `calculateMonthlyPayment` + `calculateFinancingResult`
- [ ] AC16: `components/web/FinancingTabs.tsx` má 2 taby, default HomeCredit
- [ ] AC17: `components/web/HomeCreditCalculator.tsx` používá sazbu z DB (přes prop), annuita formula
- [ ] AC18: Vlastní úvěr tab zobrazuje info text, NE active calculator
- [ ] AC19: Disclaimer text pod kalkulačkou viditelný

### Integration
- [ ] AC20: `nabidka/[slug]/page.tsx` má `<section>` "Náklady vlastnictví" v OBOU větvích (Vehicle + Listing) s TCOBreakdown + FinancingTabs
- [ ] AC21: Server-side fetch `getSetting('homecredit_rate')` v parent server komponentě
- [ ] AC22: 7 analytics events fire correctly (3 TCO + 4 financing)

### Quality
- [ ] AC23: `npm run build` pass + `npm run lint` clean
- [ ] AC24: Vitest unit test pro `mapUserCategoryToEnum()` + `getCategoryWhere()`
- [ ] AC25: Vitest unit test pro `calculateMonthlyPayment()` (např. 500k @ 7.9% / 60 měs ≈ 10 124 Kč)
- [ ] AC26: Vitest unit test pro `computeTCO()` mock data — exact + fallback + none branches
- [ ] AC27: Žádný regression v existujícím `RecommendedParts` nebo `nabidka/[slug]/page.tsx` SEO `generateMetadata`

---

## 14. OTEVŘENÉ OTÁZKY PRO OWNER

### Z původního dispatch (Q1-Q5):

**Q1 — TCO: per-rok vs jednorázová oprava cost**
Total estimate je: (a) cena všech dílů jednorázově (shopping list), (b) odhad ročních nákladů (rozpočet), (c) oboje toggle?
**Doporučení:** **(a) jednorázová** — per-rok vyžaduje znalost intervalů výměny každého dílu (engineering spec, mimo MVP scope). V2 přidat per-rok view.

**Q2 — Disclaimer "orientační kalkulace" povinný (legal)?**
Wording návrh:
> "Orientační kalkulace na základě cen v eshopu Carmakler. Skutečné náklady se mohou lišit dle stavu vozu, regionu a servisu."
**Doporučení:** **ANO povinný.** Bez toho riskujeme spotřebitelské dispute. Wording finalizovat s legal v #80.

**Q3 — Mapping ~20 → enum 12, některé spadnou do `OTHER`**
Některé user-friendly kategorie jsou subset jedné enum hodnoty (1-to-many).
- (A) **Mapping table** (jak navrhuji) — žádná schema migrace, name LIKE filter
- (B) Rozšířit `Part.category` enum na 20 hodnot — schema migrace + reseed všech parts (breaking change pro vrakoviště PWA)

**Doporučení:** **Varianta A.** Migrace = 2-3 dny práce + breaking change. Mapping table = 0 migrace, řešitelné v scope #86. V budoucnu možná přejít na enum extension.

**Q4 — Listing bez brand/model (univerzální fallback)**
Některé inzeráty od soukromníků nemají přesný model. Co dělat?
- (a) Skip TCO sekci silently
- (b) Universal benchmark per kategorie
- (c) VIN OCR / inference (overkill MVP)

**Doporučení:** **(a) skip silently** — bez kontextu vozu ztrácí TCO value, riziko dispute.

**Q5 — Total estimate format: sum vs interval**
**Doporučení:** **INTERVAL** "15 000 – 22 000 Kč". Sum = fake precision, dispute risk. Plus v2 už máme **2 intervaly per partType** (NEW + USED).

### Nové z v2 nudge:

**Q6 — `Setting` generic key-value model: rozsah polí (✅ VYŘEŠENO 2026-04-07)**

**Team-lead odpověď:** V scope #86 = **jen `homecredit_rate`**. Důvody:
- `commission_rate` je řešený jinde v `Partner.commissionRate Decimal` per-partner (#76v2 §0.2 + PartnerCommissionLog audit trail) — neduplikuj globální klíč
- `default_delivery_price` je řešený v DeliveryMethod enum + per-method shipping config (#15)
- `parts_supplier_payout_threshold` + `min_order_value` neexistují v MVP — předčasná abstrakce, přidat až bude potřeba
- Setting model je generic shape → future tasks můžou přidávat keys **bez migrace** (jen seed). Správný engineering pattern.

### Q7 — Reverse cross-link: eshop → inzerce (✅ VYŘEŠENO 2026-04-07)

**Team-lead odpověď:** **Mimo scope #86, ANO udělat jako samostatný follow-up task — ale později, ne teď.** Důvody:
1. Závisí na shipnutí #86 (UI komponenty, mapping logic)
2. Závisí na vyřešení `compatibleBrands` JSON strings problému (tedy nejdřív tech debt task na schema migraci)
3. Není urgent — TCO sám o sobě je hlavní moat, reverse link je polish

→ Team-lead vytvoří follow-up task s novým ID až bude potřeba (cca #94/#95). Označen jako **P2 backlog**.

### Mé technické otázky z codebase research:

**QT1 — `compatibleBrands`/`compatibleModels` JSON strings**
Stávající `for-vehicle` endpoint používá fragile substring match. Pro TCO chceme:
- (a) Použít stejný fragile match (rychlé)
- (b) **Normalize helper** (alias map "Škoda"↔"skoda", trim, lowercase) — marginally better
- (c) Schema migrace na Postgres array → separate follow-up tech debt task

**Doporučení:** **(b) v scope #86** + **follow-up tech debt task** na schema migraci (TBD numbering, team-lead vytvoří).

**QT2 — Server vs client component pro TCOBreakdown**
RecommendedParts je client. TCOBreakdown chci jako server (lepší SEO + ISR cache + JSON-LD). Vědomě **breaks pattern**.
**Doporučení:** **Server component** — hodnota >> consistency. Dokumentovat v komponentě komentářem proč jiný pattern.

---

## 15. CO NEMĚNIT (out of scope)

- ❌ Schema migrace `Part.category` enum (Q3 varianta B) — separate task
- ❌ Schema migrace `compatibleBrands`/`compatibleModels` na Postgres array (QT1 varianta C) — follow-up tech debt task (TBD numbering)
- ❌ Refactor `RecommendedParts.tsx` na server component — funguje, jiný účel, žádný benefit
- ❌ Refactor `FinancingCalculator.tsx` (PWA broker) — ponechat netknuté, jen extract annuita logic do `lib/financing/calculate.ts`
- ❌ Refactor `FinancovaniCalc.tsx` (web lead capture) — ponechat netknuté
- ❌ Per-rok TCO view (Q1 varianta b/c) — v2 feature
- ❌ #50 PACKING cleanup — separate task, lower priority
- ❌ Refactor `nabidka/[slug]/page.tsx` dual Vehicle/Listing render — funguje, TCO + Financování insertujeme 2× jako RecommendedParts
- ❌ Marketplace VIP integrace — TCO je pro veřejnou inzerci
- ❌ VIN-based parts compatibility — separate moonshot
- ❌ HomeCredit lead capture form (CTA "Chci nabídku") — možný future enhancement, ne MVP scope
- ❌ Reverse cross-link eshop → inzerce — P2 backlog follow-up task (TBD numbering)
- ❌ Per-listing override sazby (D6b) — keep simple, jedna sazba platforme-wide

---

## 16. SEZNAM SOUBORŮ

### Nové soubory (CREATE)

#### TCO doména
1. `app/api/parts/tco/route.ts` (~80 ř)
2. `lib/tco/index.ts` — `getTCOData()`, `computeTCO()`, cache (~120 ř)
3. `lib/tco/categories.ts` — mapping table 20 → 12 × partType + helper (~100 ř)
4. `lib/tco/normalize.ts` — `normalizeBrand()`, alias map (~40 ř)
5. `lib/tco/types.ts` — `TCOCategory`, `TCOResponse`, `TCOSummary`, `TCOPriceStats` (~40 ř)
6. `components/web/TCOBreakdown.tsx` — server (~50 ř)
7. `components/web/TCOCategoryRow.tsx` — server, 2 sloupce (~80 ř)
8. `components/web/TCOSummaryCard.tsx` — server, 2 intervaly (~50 ř)
9. `components/web/TCOAnalyticsTracker.tsx` — client wrapper (~30 ř)

#### Financování doména
10. `lib/financing/calculate.ts` — extracted annuita formula (~40 ř)
11. `lib/settings.ts` — `getSetting()` cached helper (~30 ř)
12. `components/web/FinancingTabs.tsx` — client, 2 taby (~80 ř)
13. `components/web/HomeCreditCalculator.tsx` — client, sliders + výpočet (~120 ř)
14. `app/(admin)/admin/nastaveni/page.tsx` — landing s linky (~30 ř)
15. `app/(admin)/admin/nastaveni/financovani/page.tsx` — server, form (~60 ř)
16. `app/(admin)/admin/nastaveni/financovani/loading.tsx` (~10 ř)
17. `app/(admin)/admin/nastaveni/financovani/error.tsx` (~10 ř)
18. `app/api/admin/settings/route.ts` — POST action s ADMIN check (~50 ř)
19. `prisma/migrations/YYYYMMDD_add_setting_model/migration.sql` (auto-gen)

#### Testy
20. `tests/lib/tco/categories.test.ts` (~40 ř)
21. `tests/lib/tco/computeTCO.test.ts` (~80 ř)
22. `tests/lib/financing/calculate.test.ts` (~50 ř)

### Modifikované soubory (EDIT)

1. **`prisma/schema.prisma`** — přidat `Setting` model (~15 ř insert)
2. **`prisma/seed.ts`** — upsert `homecredit_rate=7.90` (~10 ř insert)
3. **`app/(web)/nabidka/[slug]/page.tsx`**:
   - Import `TCOBreakdown`, `FinancingTabs`, `getSetting`
   - Server-side fetch `homecreditRate`
   - Insert `<section>` "Náklady vlastnictví" v Vehicle větvi (~ř. 800)
   - Insert `<section>` "Náklady vlastnictví" v Listing větvi (~ř. 1075)
   - Volitelně: rozšířit JSON-LD generateMetadata
4. **`app/(admin)/admin/layout.tsx`** nebo sidebar navigation — přidat link "Nastavení" (drobný edit, pokud má statickou navigaci; pokud je dynamická, žádný edit)

---

## 17. ESTIMATE & KOMPLEXITA

| Část | Effort | Risk |
|------|--------|------|
| TCO API endpoint + lib/tco/ + cache | M | LOW |
| TCO UI komponenty (3 server) NEW/USED split | M | LOW |
| Mapping table 20 × 2 partType | S | LOW |
| TCO insert do nabidka/[slug] (2 větve) | XS | LOW |
| **Setting model + migrace + seed** | S | LOW |
| **`lib/settings.ts` cache wrapper** | XS | LOW |
| **Admin route + form action + ADMIN guard** | S | LOW |
| **`lib/financing/calculate.ts` extraction** | XS | LOW |
| **FinancingTabs + HomeCreditCalculator** | M | LOW |
| **Financování insert do nabidka/[slug]** | XS | LOW |
| JSON-LD additionalProperty | S | LOW |
| Analytics events (7 events) | S | LOW |
| Unit testy (3 test files) | M | LOW |
| **CELKEM** | **M+ (~10-12 hod, 1.5 dev day)** | **LOW-MEDIUM** |

**Hlavní risk:** Data quality `compatibleBrands` JSON strings → mnoho `source: "fallback"` rows → snížený trust. **Mitigace:** confidence badge.

**Sekundární risk:** Setting cache invalidation timing — pokud admin změní sazbu, ale Vercel CDN cache trvá ještě 1h. **Mitigace:** `revalidateTag('settings')` v admin save action + reasonable expectation že sazba se mění zřídka.

**Tertiary risk:** HomeCredit legal exposure — pokud kalkulačka ukáže "10 124 Kč/měs" a HomeCredit pak nabídne "12 500 Kč/měs", uživatel může mít pocit oklamání. **Mitigace:** silný disclaimer + ADMIN-managed sazba (admin musí být v sync s HomeCredit smlouvou).

---

## 18. NÁVAZNOSTI

- **#90 LEGAL** (completed) — společný disclaimer wording (TCO + financování). Brief obsahuje §1 B2C reklamace + §2 komisionář + §3 DPH; po obdržení odpovědí od právníka zapracovat do TCO + HomeCredit disclaimer.
- **#82 PERF** (pending) — TCO endpoint do auditu (groupBy + raw SQL benchmark) + Setting cache layer
- **Follow-up task TBD** — Part compatibility refactor (`compatibleBrands` JSON → Postgres array nebo many-to-many). Tech debt task, po shipnutí #86. Team-lead vytvoří s novým ID (cca #94/#95).
- **Follow-up task TBD** — Reverse cross-link eshop → inzerce (Q7). P2 backlog. Závisí na shipnutí #86 + tech debt schema migrace. Team-lead vytvoří s novým ID.

**Pozn. k Q6:** Setting model rozšíření o další klíče **NENÍ potřeba jako follow-up task** — model je generic, future tasks můžou přidávat keys ad-hoc bez migrace (jen seed). `commission_rate` je řešený v `Partner.commissionRate` (#76v2 §0.2), `default_delivery_price` v DeliveryMethod enum (#15).

---

## 19. CHANGELOG

- **2026-04-06 (PLANOVAC v1):** Initial plan po team-lead dispatch #86 — TCO breakdown only. Codebase research dokončen, 5 critical findings + 5+2 open questions surfaced. Estimate M (~6-8 hod). 18 sekcí, 520 ř.

- **2026-04-07 (PLANOVAC v2):** Major scope expansion po team-lead nudge dispatchi:
  - Mix NEW + USED parts paralelně (D4)
  - Cena format min–max + průměr per partType (D5)
  - **Nová sekce: Financování kalkulačka** (D6a-d) — 2 taby, admin Setting model, annuita formula
  - 2 nové open questions (Q6 Setting, Q7 reverse cross-link)
  - Seznam souborů: 11 → 22 nových, 1 → 4 modified
  - Estimate M → M+ (~10-12 hod, 1.5 dev day)
  - 22 sekcí, ~750 řádků
  - Critical findings #4.6 (Setting cache) a #4.7 (existing FinancingCalc duplicates) přidány

---

## 20. AKČNÍ KROKY PRO TEAM-LEAD (TL;DR)

1. **Approve plán** nebo požádat o úpravy ✅ (team-lead 2026-04-07: schválil v2 + akceptoval všechny doporučení Q1-Q7 + QT1-QT2)
2. **Odpovědět na Q6 + Q7** ✅ (team-lead 2026-04-07: Q6 = jen homecredit_rate, Q7 = follow-up TBD)
3. **Dispatch developer** s tímto plánem (1.5 dev day) — pending
4. **Note pro sebe:** Follow-up tasks (Part compatibility refactor + Reverse cross-link) jako P2 backlog s novými task ID, ne #87/#88/#89 (ty jsou už obsazené v TaskList).

### Update 2026-04-07 (post team-lead approval)
- Q6 vyřešeno: scope #86 = jen `homecredit_rate` (commission je v Partner model, delivery v DeliveryMethod enum, ostatní MVP-irrelevant)
- Q7 vyřešeno: mimo scope #86, follow-up task s novým ID po shipnutí #86 + schema migrace
- §12.1 Setting model návrh upraven (žádné spekulativní future klíče)
- §18 návaznosti: #80 → #90 (completed), follow-up tasky bez konkrétních ID (TBD od team-leada)
