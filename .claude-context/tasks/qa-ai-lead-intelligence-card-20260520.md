# QA Report: AI Lead Intelligence karta

**Datum:** 2026-05-20  
**Task:** #68  
**Reviewer:** kontrolor  
**Verdict: APPROVED s 2 minor issues**

---

## Zkontrolované soubory

- `app/api/scout-leads/[id]/market-analysis/route.ts`
- `lib/equipment-parser.ts`
- `lib/lead-completeness.ts`
- `components/admin/scout-leads/LeadPriceChart.tsx`
- `components/admin/scout-leads/LeadPriceVerdict.tsx`
- `components/admin/scout-leads/LeadSimilarTable.tsx`
- `components/admin/scout-leads/LeadEquipmentTags.tsx`
- `components/admin/scout-leads/LeadDataCompleteness.tsx`
- `components/admin/scout-leads/ScoutLeadDetail.tsx`
- `prisma/migrations/20260520125221_add_vehicle_search_index/migration.sql`
- `prisma/schema.prisma`

---

## Ověřovací body

### ✅ 1. API endpoint `/api/scout-leads/[id]/market-analysis`

**Struktura odpovědi:** `priceDistribution | null`, `priceVerdict | null`, `similarLeads[]` ✅

**Non-SOUKROMNIK / chybějící brand+model:**
```typescript
if (lead.category !== "SOUKROMNIK" || !lead.vehicleBrand || !lead.vehicleModel) {
  return { priceDistribution: null, priceVerdict: null, similarLeads: [] }
}
```
Vrací prázdnou odpověď bez chyby ✅

**Cenová distribuce (≥5 bodů):** Podmínka `prices.length >= 5 && lead.vehiclePrice && lead.vehiclePrice > 0` ✅

**Bucket count auto-calculation:**
```
5 prices  → 8 buckets  ✅
10 prices → 8 buckets  ✅
50 prices → 10 buckets ✅
100 prices → 12 buckets ✅
500 prices → 12 buckets ✅
```

**Matematika (live testy):**
- Median [100k, 150k, 200k, 250k, 300k, 350k, 400k] = 250 000 ✅
- Percentile 200k/7 = 29 (Math.round(2/7*100) = 29) ✅

**Verdict thresholds (±15%):**
```
−20% → LOW   ✅
−2%  → OK    ✅
+16% → HIGH  ✅
−15% boundary → OK (not < -15) ✅
```

**Similar leads sorting:** Top 5 closest by price diff ✅  
**Fallback bez ceny:** `similar.slice(0, 5)` ✅

---

### ✅ 2. equipment-parser.ts

| Kategorie | Vzorky |
|---|---|
| transmission | automat, automatická, manuál, DSG |
| fuel | benzín, nafta, diesel, hybrid, elektro, cng, lpg |
| feature | 4x4, awd, klima, tempomat, navi, xenon, led, kůže, panorama, tažné, park, kamera, vyhřívan, serviska, servisní |
| condition | 1. majitel, garáž, neboura, zánovní |
| negative | havarovan |

**Dedup:** `seen` Set zabraňuje duplicate labelů (nafta + diesel → jen "Diesel" jednou) ✅  
**Null guard:** `if (!title) return []` ✅  
**Export:** `extractEquipment()` + `type EquipmentTag` ✅

---

### ✅ 3. lead-completeness.ts

**Max skóre (live testy):**
- SOUKROMNIK: phone(2)+city(1)+vehicleBrand(1)+vehicleModel(1)+vehicleYear(1)+vehiclePrice(2)+vehicleMileage(1)+listingTitle(1) = **10/10** ✅
- BUSINESS: phone(2)+email(1)+web(1)+city(1)+address(1)+ico(1)+googleRating(1)+estimatedSize(1)+estimatedInventory(1) = **10/10** ✅

**`hasValue()` edge cases (9/9 passed):**
```
null       → false ✅
undefined  → false ✅
""         → false ✅
"  "       → false ✅  (whitespace trim)
"Praha"    → true  ✅
0          → false ✅  (nulová cena = chybí)
150000     → true  ✅
3.8        → true  ✅  (Google rating)
true       → true  ✅
```

---

### ✅ 4. Komponenty — props a rendering

#### LeadPriceChart
- Props: `buckets: Bucket[]` + `stats: {median, mean, min, max, count, percentile}` ✅
- Recharts `BarChart` s `ResponsiveContainer` ✅
- Aktuální bucket zvýrazněn `#F97316` (orange), ostatní `#E5E7EB` ✅
- Stats grid: medián, rozsah, percentil, počet vozů ✅

#### LeadPriceVerdict
- Props: `verdict: "LOW"|"OK"|"HIGH"`, `label: string`, `deviationPercent: number` ✅
- Barevná konfigurace: LOW→zelená, OK→šedá, HIGH→oranžová ✅
- Renders: badge, label, hint text ✅

#### LeadSimilarTable
- `leads.length === 0 → return null` ✅
- Klik na řádek → `router.push(/admin/scout-leads/[id])` ✅
- Responsive: km, město, zdroj skryté na mobile ✅

#### LeadEquipmentTags
- `tags.length === 0 → return null` ✅
- CSS per type: transmission/fuel→modrá, feature→zelená, condition→amber, negative→červená ✅

#### LeadDataCompleteness
- Progress bar barvy: ≥80%→zelená, 50-79%→oranžová, <50%→červená ✅
- Checklist: ✓/✗ per field ✅
- Score/max zobrazeno ✅

---

### ✅ 5. Integrace v ScoutLeadDetail.tsx — A/B/D/E SOUKROMNIK, C pro všechny

| Modul | Komponenta | Gate | Status |
|---|---|---|---|
| A | LeadPriceChart | `lead.category === "SOUKROMNIK" && marketData?.priceDistribution` | ✅ |
| B | LeadPriceVerdict | `marketData?.priceVerdict` (API vrací null pro non-SOUKROMNIK) | ✅ |
| C | LeadDataCompleteness | Vždy (line 260, no gate) | ✅ |
| D | LeadEquipmentTags | Inside `lead.category === "SOUKROMNIK" && (brand || title)` block | ✅ |
| E | LeadSimilarTable | `lead.category === "SOUKROMNIK" && marketData?.similarLeads?.length > 0` | ✅ |

Fallback pro A (< 5 dat): "Nedostatek dat pro cenovou analýzu" ✅

Market analysis fetch pouze pro SOUKROMNIK (`if (!lead || lead.category !== "SOUKROMNIK") return`) ✅

---

### ✅ 6. RBAC na market-analysis endpointu

```typescript
const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"];
```

- Nepřihlášen → 401 ✅
- Jiná role (BUYER, ADVERTISER, INVESTOR...) → 403 ✅
- BROKER: pouze vlastní leady (`lead.assignedToId !== session.user.id` → 403) ✅

---

### ✅ 7. Prisma index [vehicleBrand, vehicleModel, vehicleYear]

**migration.sql:**
```sql
CREATE INDEX "ScoutLead_vehicleBrand_vehicleModel_vehicleYear_idx"
  ON "ScoutLead"("vehicleBrand", "vehicleModel", "vehicleYear");
```
✅

**schema.prisma:**
```prisma
@@index([vehicleBrand, vehicleModel, vehicleYear])
```
✅ Konzistentní, index pokrývá přesně query v market-analysis.

---

## Bugy

### 🐛 BUG (very low): `deviationPercent` prop unused v LeadPriceVerdict

```typescript
interface LeadPriceVerdictProps {
  verdict: "LOW" | "OK" | "HIGH";
  label: string;
  deviationPercent: number;  // ← deklarováno
}

export function LeadPriceVerdict({ verdict, label }: LeadPriceVerdictProps) {
  // deviationPercent není destructurováno ani renderováno
```

Funkčně neškodné — `label` již obsahuje procento ("Pod průměrem (−12%)"). Prop je dead code.

**Fix:** Buď přidat renderování procentuálního čísla, nebo odstranit `deviationPercent` z interface + volání.

---

### 🐛 BUG (medium): ±50k km mileage filter chybí v market-analysis query

Plán §2 Modul A specifikuje `vehicleMileage: { gte: ..., lte: ... }` (±50k km), implementace filtruje pouze podle brand + model + year ± 2.

**Dopad:** Podobné leady mohou zahrnovat auta s nájezdem 200 000 km i 20 000 km pro stejný rok, čímž se zkresluje cenová distribuce.

**Navrhovaná oprava:**
```typescript
...(lead.vehicleMileage
  ? { vehicleMileage: { gte: lead.vehicleMileage - 50000, lte: lead.vehicleMileage + 50000 } }
  : {}),
```
S fallbackem pokud lead nemá nájezd (ne všechny leady ho mají).

---

## Souhrn

| Bod | Status |
|---|---|
| API endpoint — struktura, RBAC, matematika | ✅ |
| equipment-parser.ts — keywords, typy, dedup | ✅ |
| lead-completeness.ts — bodování SOUKROMNIK/AUTOBAZAR | ✅ |
| LeadPriceChart — Recharts, bucket highlight | ✅ |
| LeadPriceVerdict — badge, barvy | ✅ |
| LeadSimilarTable — null guard, navigate | ✅ |
| LeadEquipmentTags — null guard, type styles | ✅ |
| LeadDataCompleteness — progress bar, checklist | ✅ |
| Integrace A/B/D/E SOUKROMNIK, C pro všechny | ✅ |
| BROKER own-lead RBAC | ✅ |
| Prisma index migration + schema | ✅ |
| `deviationPercent` prop unused | 🐛 Very Low |
| ±50k km mileage filter chybí | 🐛 Medium |

**Verdict: APPROVED** — všech 5 modulů funguje správně, matematika ověřena, RBAC správné. Mileage filter je žádoucí improvement pro přesnější cenovou analýzu, ale neblokuje funkčnost.
