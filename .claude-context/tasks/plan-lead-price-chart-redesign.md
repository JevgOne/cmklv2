# Plan: Redesign LeadPriceChart — profesionální cenový graf

**Task:** #2
**Status:** PLAN READY
**Datum:** 2026-05-20
**Typ:** UI Enhancement

---

## 1. Analýza aktuálního stavu

### LeadPriceChart.tsx (123 řádků)
- **Typ:** recharts `BarChart` s flat barvami
- **Problémy:**
  1. **Flat gray bars** (#E5E7EB) s jedním orange (#F97316) — vypadá genericky
  2. **X-axis labels** otočené -30° — těžko čitelné na malých obrazovkách
  3. **Stats grid** 4-column → 2-column responsive — cramped, žádná vizuální hierarchie
  4. **Žádné reference lines** — chybí vizuální indikace mediánu a ceny leadu
  5. **Tooltip** je default recharts — nesedí s design systémem
  6. **Source badges** jsou malé a oddělené od grafu — chybí kontext
  7. **Žádná animace** — statický výstup, nemoderní

### Kontext:
- Data pochází z `GET /api/scout-leads/[id]/market-analysis`
- Response: `{ priceDistribution: { buckets, stats, sources }, priceVerdict, similarOffers }`
- Props interface je OK — `buckets`, `stats`, `sources` — neměnit

---

## 2. Redesign koncept

### Inspirace: Bloomberg/TradingView cenové grafy
- Čistý dark-on-light design
- Reference lines pro klíčové hodnoty
- Gradient fill bars
- Integrované stats místo oddělené sekce

### Vizuální kompozice:

```
┌─────────────────────────────────────────────────────┐
│  CENOVÁ DISTRIBUCE                    AS24: 45 │ S: 32 │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │    ▓                                         │   │
│  │    ▓▓   ▓                                    │   │
│  │  ▓ ▓▓   ▓▓                ← ReferenceLine    │   │
│  │  ▓ ▓▓ ▓ ▓▓   ▓   ▓          medián (dashed) │   │
│  │  ▓ ▓▓ ▓ ▓▓ ▓ ▓ ▓ ▓   ▓  ← ReferenceLine    │   │
│  │  ▓ ▓▓ ▓ ▓▓ ▓ ▓ ▓ ▓ ▓ ▓     cena leadu      │   │
│  └──────────────────────────────────────────────┘   │
│   200k  250k  300k  350k  400k  450k  500k         │
│                                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │Medián│ │Průměr│ │Pásmo │ │Vzorek│               │
│  │380k  │ │395k  │ │250-550│ │77 aut│               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
└─────────────────────────────────────────────────────┘
```

---

## 3. Implementační plán

### Krok 1: Gradient bars + reference lines [IMPL]

**Soubor:** `components/admin/scout-leads/LeadPriceChart.tsx`

**Nové recharts features:**
```tsx
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine,  // ← NEW
} from "recharts";
```

**SVG gradient definice:**
```tsx
<defs>
  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#F97316" stopOpacity={0.9} />
    <stop offset="100%" stopColor="#F97316" stopOpacity={0.4} />
  </linearGradient>
  <linearGradient id="barGradientMuted" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.5} />
    <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.15} />
  </linearGradient>
</defs>
```

**Reference lines:**
```tsx
{/* Medián — dashed blue */}
<ReferenceLine
  x={medianBucketLabel}
  stroke="#3B82F6"
  strokeDasharray="5 3"
  strokeWidth={1.5}
  label={{ value: "Medián", position: "top", fontSize: 10, fill: "#3B82F6" }}
/>

{/* Cena leadu — solid orange (pokud isCurrent existuje) */}
<ReferenceLine
  x={currentBucketLabel}
  stroke="#F97316"
  strokeWidth={2}
  label={{ value: "Tento vůz", position: "top", fontSize: 10, fill: "#F97316" }}
/>
```

**Poznámka:** ReferenceLine na kategorickém BarChart XAxis potřebuje `x` = label string. Alternativně: přepočítat medián na bucket index.

---

### Krok 2: Vylepšený tooltip [IMPL]

**Custom tooltip místo default:**
```tsx
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <div className="font-medium">{label} Kč</div>
      <div className="text-gray-300 mt-0.5">
        {payload[0].value} {payload[0].value === 1 ? "vůz" : "vozů"}
      </div>
    </div>
  );
}
```

---

### Krok 3: Lepší stats layout [IMPL]

**PŘED:** Flat grid se span texty
**PO:** Mini karty s ikonami a vizuální hierarchií

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
  {/* Medián — primary stat, highlighted */}
  <div className="bg-blue-50 rounded-lg p-3">
    <div className="text-[10px] uppercase tracking-wider text-blue-500 font-semibold">
      Tržní medián
    </div>
    <div className="text-lg font-bold text-blue-700 tabular-nums">
      {stats.median.toLocaleString("cs-CZ")} Kč
    </div>
  </div>

  {/* Průměr */}
  <div className="bg-gray-50 rounded-lg p-3">
    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
      Průměr
    </div>
    <div className="text-lg font-bold text-gray-700 tabular-nums">
      {stats.mean.toLocaleString("cs-CZ")} Kč
    </div>
  </div>

  {/* Cenové pásmo */}
  <div className="bg-gray-50 rounded-lg p-3">
    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
      Cenové pásmo
    </div>
    <div className="text-sm font-bold text-gray-700 tabular-nums">
      {formatPrice(stats.min)} – {formatPrice(stats.max)} Kč
    </div>
  </div>

  {/* Vzorek */}
  <div className="bg-gray-50 rounded-lg p-3">
    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
      Porovnáno
    </div>
    <div className="text-lg font-bold text-gray-700 tabular-nums">
      {stats.count} <span className="text-sm font-normal text-gray-500">vozů</span>
    </div>
    <div className="text-[10px] text-gray-400">{stats.percentile}. percentil</div>
  </div>
</div>
```

---

### Krok 4: Source badges integrované do headeru [IMPL]

**PŘED:** Oddělená sekce pod stats
**PO:** Inline s nadpisem

```tsx
<div className="flex items-center justify-between mb-4">
  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
    Cenová distribuce
  </h3>
  {sources && (
    <div className="flex gap-1.5">
      {sources.autoscout24 > 0 && (
        <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-50 text-blue-600 font-medium">
          AS24: {sources.autoscout24}
        </span>
      )}
      {sources.sauto > 0 && (
        <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-600 font-medium">
          Sauto: {sources.sauto}
        </span>
      )}
      {sources.mobile_de > 0 && (
        <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-50 text-purple-600 font-medium">
          Mobile.de: {sources.mobile_de}
        </span>
      )}
    </div>
  )}
</div>
```

---

### Krok 5: X-axis label cleanup [IMPL]

**PŘED:** `angle={-30}` rotace, `height={50}`
**PO:** Horizontální labels, zkrácený formát

```tsx
<XAxis
  dataKey="label"
  tick={{ fontSize: 10, fill: "#9CA3AF" }}
  interval={0}
  // BEZ angle — horizontální
  height={25}
  axisLine={{ stroke: "#E5E7EB" }}
  tickLine={false}
/>
```

**Label format improvement:**
```tsx
const data = buckets.map((b) => ({
  label: formatPrice(b.min),  // Jen spodní hranici, bez rozsahu
  fullLabel: `${formatPrice(b.min)}–${formatPrice(b.max)}`,
  count: b.count,
  isCurrent: b.isCurrent,
}));
```

---

### Krok 6: Polished YAxis + grid [IMPL]

```tsx
<YAxis
  tick={{ fontSize: 10, fill: "#9CA3AF" }}
  width={25}
  allowDecimals={false}
  axisLine={false}
  tickLine={false}
/>
// Optional: CartesianGrid for subtle horizontal lines
<CartesianGrid
  strokeDasharray="3 3"
  stroke="#F3F4F6"
  horizontal={true}
  vertical={false}
/>
```

---

## 4. Finální komponenta — shrnutí změn

| Aspect | PŘED | PO |
|--------|------|-----|
| Bar fill | Flat #E5E7EB / #F97316 | SVG linearGradient (muted slate → orange gradient) |
| Reference lines | Žádné | Medián (dashed blue) + cena leadu (solid orange) |
| Tooltip | Default recharts | Custom dark tooltip s českým formátem |
| Stats layout | Flat text grid | Mini cards s barevným rozlišením (medián=blue) |
| Source badges | Pod stats, oddělené | V headeru, inline s nadpisem |
| X-axis | Rotované -30° | Horizontální, zkrácený formát |
| Y-axis | Default | Bez axis line, bez tick line (čistší) |
| Grid | Žádná | Subtle horizontal dashed lines |
| Card padding | p-6 | p-5 (kompaktnější) |

**Odhad:** ~60 řádků čistých změn (refactor existujících 123 řádků)

---

## 5. Soubory k úpravě

| Soubor | Typ změny | Řádky |
|--------|-----------|-------|
| `components/admin/scout-leads/LeadPriceChart.tsx` | REWRITE | ~140 (z 123) |

**Žádné nové soubory.** Žádné API změny. Jen frontend refactor jedné komponenty.

---

## 6. STOP pravidla

- **STOP-1:** ReferenceLine na kategorickém XAxis nefunguje (recharts limitation) → fallback: custom SVG overlay nebo přeskočit reference lines a použít jen barevné zvýraznění bucketu
- **STOP-2:** Gradient bary nefungují v recharts SVG → fallback: flat barvy ale lepší palette (slate-200 → orange-400)
- **STOP-3:** X-axis horizontální labels se překrývají při >10 buckets → přidat `interval="preserveStartEnd"` nebo zkrátit labels na "200k" formát

---

## 7. Acceptance Criteria

- [ ] Graf má gradient bars (ne flat šedá)
- [ ] Reference line pro medián je viditelná (dashed modrá)
- [ ] Reference line nebo zvýraznění pro cenu aktuálního leadu (orange)
- [ ] Stats jsou v mini-card formátu s vizuální hierarchií
- [ ] Source badges jsou v headeru grafu
- [ ] Custom tooltip v dark stylu s českým formátem
- [ ] X-axis labels jsou čitelné bez rotace
- [ ] Responzivní: funguje na mobile (2 cols stats) i desktop (4 cols)
- [ ] Celkový dojem: profesionální analytický dashboard, ne generický graf
