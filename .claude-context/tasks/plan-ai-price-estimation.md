# Plán: AI cenový odhad vozidla (MVP)

## Stav

- **Aktuálně:** Makléř zadává cenu ručně v `PricingStep.tsx`. Žádný AI/ML odhad neexistuje.
- **Web kalkulačka** (`PriceCalculator.tsx`): lokální math formula (`500000 * 0.88^age * kmFactor`), ne AI — marketing tool.
- **Constraint:** Žádný scraping konkurence. AI price valuation jen z vlastních Carmakler dat (viz memory `feedback_no_competitor_scraping.md`).

## Přístup: Claude API + interní data

### Proč Claude API, ne vlastní ML model?

| Přístup | Výhoda | Nevýhoda |
|---------|--------|----------|
| Vlastní ML model | Přesnost po natrénování na 10k+ záznamech | Potřebuje velký dataset, měsíce vývoje, MLOps infrastrukturu |
| Eurotax/DAT API | Profesionální valuace | Drahé (€€€), závislost na třetí straně |
| Scraping konkurence | Reálná tržní data | ❌ ZAKÁZÁNO — ToS violation, legal exposure |
| **Claude API** | **Okamžitě nasaditelné**, Claude zná tržní hodnoty z tréninkových dat, funguje od dne 1 i bez interních dat | Odhad, ne appraisal. Nižší přesnost než Eurotax. |

**Claude API je nejlepší MVP volba** protože:
1. Už je v stacku (@anthropic-ai/sdk, existuje generate-description endpoint)
2. Claude má znalost cenových hladin aut z training data (obecné povědomí o cenách značek/modelů)
3. Můžeme enrichovat vlastními prodejními daty (SOLD vehicles) jako kontext
4. Zero ML infrastructure — jen API call
5. Od dne 1 dává orientační odhad, s rostoucím počtem SOLD záznamů se zpřesňuje

## Architektura

```
PricingStep.tsx
    │
    ├── Click "Odhadnout cenu AI"
    │
    ▼
POST /api/assistant/price-estimate
    │
    ├── 1. Validace inputu (Zod)
    ├── 2. Query SOLD vehicles z DB (comparable sales)
    ├── 3. Build prompt (vehicle specs + comparable sales)
    ├── 4. Call Claude API
    ├── 5. Parse structured response
    │
    ▼
Response: { min, max, suggested, confidence, reasoning }
```

## Implementace

### Krok 1: API endpoint

**Nový soubor:** `app/api/assistant/price-estimate/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const priceEstimateSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(2027),
  mileage: z.number().int().min(0),
  condition: z.string().min(1),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  enginePower: z.number().optional(),
  bodyType: z.string().optional(),
  equipment: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  // Auth check (BROKER, MANAGER, ADMIN)
  
  const data = priceEstimateSchema.parse(await request.json());

  // 1. Query comparable SOLD vehicles z vlastní DB
  const comparables = await prisma.vehicle.findMany({
    where: {
      brand: data.brand,
      model: data.model,
      status: "SOLD",
      soldPrice: { not: null },
      year: { gte: data.year - 2, lte: data.year + 2 },
    },
    select: {
      year: true,
      mileage: true,
      price: true,         // nabízená cena
      soldPrice: true,     // skutečná prodejní cena
      soldAt: true,
      condition: true,
      fuelType: true,
      transmission: true,
      equipment: true,
    },
    orderBy: { soldAt: "desc" },
    take: 20,
  });

  // 2. Build Claude prompt
  const systemPrompt = `Jsi expert na oceňování ojetých vozidel na českém trhu...`;
  
  // 3. Claude API call s tool_use pro strukturovaný output
  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    // tool_use pro strukturovaný JSON response
  });

  // 4. Return { min, max, suggested, confidence, reasoning }
}
```

**Klíčové aspekty API:**
- **Comparable sales:** Query vlastní SOLD vehicles (brand + model + ±2 roky). Prvních X měsíců bude málo/žádné — Claude odhadne z training data knowledge.
- **Claude prompt:** Obsahuje vehicle specs + comparable sales (pokud existují). Claude vrátí strukturovaný JSON s cenovou rozmezím.
- **Confidence level:** `high` (≥10 comparables), `medium` (3–9), `low` (0–2 nebo jen z obecných znalostí).
- **Auth:** Jen přihlášení uživatelé s rolí BROKER, MANAGER, ADMIN.

### Krok 2: System prompt pro cenový odhad

```
Jsi expert na oceňování ojetých vozidel na českém trhu. Odhadni tržní cenu 
na základě parametrů vozidla a (pokud jsou k dispozici) reálných prodejních 
dat z platformy Carmakler.

PRAVIDLA:
- Vrať cenové rozmezí (min-max) a doporučenou cenu v Kč
- Zohledni: značku, model, rok, km, stav, palivo, převodovku, výbavu
- Český trh: populární značky (Škoda, VW, Hyundai, Kia) mají vyšší likviditu
- Stav vozidla: EXCELLENT +10%, GOOD baseline, FAIR -15%, DAMAGED -35%
- Servisní kniha: +5-10%
- Automatická převodovka: +5-15% (závisí na segmentu)
- Cenu vyjádři v CZK, zaokrouhli na 5000 Kč
- Pokud máš k dispozici comparable sales data, váží je vyšší váhou
- Buď upřímný o confidence — pokud nemáš dostatek dat, řekni to

FORMÁT ODPOVĚDI (JSON):
{
  "min": number,        // spodní hranice cenového rozpětí (Kč)
  "max": number,        // horní hranice cenového rozpětí (Kč)
  "suggested": number,  // doporučená prodejní cena (Kč)
  "confidence": "high" | "medium" | "low",
  "reasoning": "string" // 2-3 věty česky proč tato cena
}
```

### Krok 3: Integrace do PricingStep

**Soubor:** `components/pwa/vehicles/new/PricingStep.tsx`

Přidat tlačítko "Odhadnout cenu AI" vedle manuálního input pro cenu:

```tsx
// Nový state
const [estimating, setEstimating] = useState(false);
const [estimate, setEstimate] = useState<PriceEstimate | null>(null);

// Handler
const handleEstimatePrice = useCallback(async () => {
  if (!draft?.details) return;
  setEstimating(true);
  try {
    const res = await fetch("/api/assistant/price-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: draft.details.brand,
        model: draft.details.model,
        year: draft.details.year,
        mileage: draft.details.mileage,
        condition: draft.details.condition,
        fuelType: draft.details.fuelType,
        transmission: draft.details.transmission,
        enginePower: draft.details.enginePower,
        bodyType: draft.details.bodyType,
        equipment: draft.details.equipment ?? [],
      }),
    });
    const data = await res.json();
    setEstimate(data);
    // Prefill cenu s doporučenou hodnotou
    if (data.suggested) {
      setPriceFormatted(formatPriceInput(String(data.suggested)));
    }
  } catch (err) {
    console.error("AI price estimate error:", err);
  } finally {
    setEstimating(false);
  }
}, [draft?.details]);
```

**UI komponenta — cenový odhad card:**

```tsx
{estimate && (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-sm font-bold text-blue-700">AI cenový odhad</span>
      <ConfidenceBadge level={estimate.confidence} />
    </div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-sm text-blue-600">Rozmezí:</span>
      <span className="font-bold text-blue-700">
        {formatCurrency(estimate.min)} – {formatCurrency(estimate.max)}
      </span>
    </div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-blue-600">Doporučená cena:</span>
      <span className="text-lg font-bold text-blue-800">
        {formatCurrency(estimate.suggested)}
      </span>
    </div>
    <p className="text-xs text-blue-600 mt-2">{estimate.reasoning}</p>
    <p className="text-[10px] text-blue-400 mt-1 italic">
      Orientační odhad — skutečná cena závisí na individuálním stavu vozu.
    </p>
    <button
      onClick={() => setPriceFormatted(formatPriceInput(String(estimate.suggested)))}
      className="mt-2 text-sm text-blue-700 font-medium hover:text-blue-800"
    >
      Použít doporučenou cenu
    </button>
  </div>
)}
```

### Krok 4: Confidence badge

```tsx
function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const config = {
    high: { label: "Vysoká přesnost", color: "bg-green-100 text-green-700" },
    medium: { label: "Střední přesnost", color: "bg-yellow-100 text-yellow-700" },
    low: { label: "Orientační", color: "bg-gray-100 text-gray-600" },
  };
  const c = config[level];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.color}`}>
      {c.label}
    </span>
  );
}
```

### Krok 5: Vylepšit webovou kalkulačku (bonus)

**Soubor:** `components/web/PriceCalculator.tsx`

Nahradit lokální math formuli za volání stejného API endpointu. Veřejný web by mohl nabídnout zjednodušenou verzi (bez auth, s rate limitem).

**Nový soubor:** `app/api/public/price-estimate/route.ts` — rate-limited verze pro veřejný web (max 10 odhadů/den/IP).

## Prompt engineering — detaily

### User prompt template

```
Oceň toto vozidlo na českém trhu:

Značka: {brand}
Model: {model}
Rok výroby: {year}
Nájezd: {mileage} km
Stav: {condition}
Palivo: {fuelType}
Převodovka: {transmission}
Výkon: {enginePower} kW
Karoserie: {bodyType}
Výbava: {equipment.join(", ")}

{comparables.length > 0 ? `
REÁLNÁ PRODEJNÍ DATA Z PLATFORMY (${comparables.length} vozidel):
${comparables.map(c => `- ${c.year} ${brand} ${model}, ${c.mileage} km, stav ${c.condition}, nabízeno za ${c.price} Kč, prodáno za ${c.soldPrice} Kč (${c.soldAt})`).join("\n")}
` : "Nemám vlastní prodejní data pro tento model — odhadni z obecné znalosti trhu."}
```

### Structured output via tool_use

Pro spolehlivý JSON output použít Claude `tool_use` s definovaným schema:

```typescript
tools: [{
  name: "price_estimate",
  description: "Vrátí strukturovaný cenový odhad vozidla",
  input_schema: {
    type: "object",
    properties: {
      min: { type: "number", description: "Spodní hranice (Kč)" },
      max: { type: "number", description: "Horní hranice (Kč)" },
      suggested: { type: "number", description: "Doporučená cena (Kč)" },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      reasoning: { type: "string", description: "Zdůvodnění v češtině (2-3 věty)" },
    },
    required: ["min", "max", "suggested", "confidence", "reasoning"],
  },
}],
tool_choice: { type: "tool", name: "price_estimate" },
```

## Zpřesňování v čase

```
Měsíc 1-3:  0-50 SOLD vehicles  → confidence: low     → Claude obecné znalosti
Měsíc 4-6:  50-200 SOLD vehicles → confidence: medium  → Claude + vlastní data
Měsíc 7+:   200+ SOLD vehicles   → confidence: high    → vlastní data dominují
Rok 2+:     1000+ SOLD vehicles  → zvážit vlastní ML model trénovaný na interních datech
```

## Dotčené soubory

| Soubor | Akce |
|--------|------|
| `app/api/assistant/price-estimate/route.ts` | **NOVÝ** — hlavní API endpoint |
| `components/pwa/vehicles/new/PricingStep.tsx` | **EDIT** — přidat AI odhad tlačítko + card |
| `components/web/PriceCalculator.tsx` | **EDIT** (bonus, fáze 2) — nahradit lokální formuli za API |
| `app/api/public/price-estimate/route.ts` | **NOVÝ** (bonus, fáze 2) — rate-limited veřejná verze |

## Acceptance Criteria

- [ ] Makléř v PricingStep vidí tlačítko "Odhadnout cenu AI"
- [ ] Tlačítko je aktivní jen pokud draft má brand, model, year, mileage, condition
- [ ] Po kliknutí se zobrazí loading spinner → cenový odhad card
- [ ] Card zobrazuje: rozmezí (min–max), doporučenou cenu, confidence badge, reasoning
- [ ] "Použít doporučenou cenu" prefillne cenový input
- [ ] Confidence level odpovídá počtu comparable sales (0–2: low, 3–9: medium, 10+: high)
- [ ] API endpoint používá tool_use pro spolehlivý structured output
- [ ] API je auth-protected (BROKER, MANAGER, ADMIN)
- [ ] Disclaimer "Orientační odhad" je vždy viditelný

## Složitost

**Střední** — 1 nový API endpoint, 1 edit. Využívá existující @anthropic-ai/sdk infrastrukturu.

## Náklady Claude API

- Sonnet 4.6: ~$3/1M input tokens, ~$15/1M output tokens
- Jeden odhad: ~500 input tokens + ~200 output tokens ≈ $0.005
- 1000 odhadů/měsíc ≈ **$5/měsíc** — zanedbatelné

## Rizika

| Riziko | Mitigace |
|--------|----------|
| Claude může dát nepřesný odhad | Disclaimer "orientační", confidence badge, makléř vždy rozhoduje finální cenu |
| Halucinace v reasoning | tool_use schema vynucuje strukturovaný output |
| Vysoké API náklady | Sonnet 4.6 je levný, rate limit 50/h existuje |
| Pomalá response | Sonnet je rychlý (~1-2s), loading spinner v UI |
