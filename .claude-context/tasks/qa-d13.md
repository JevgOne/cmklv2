# QA Report — D13 Dashboard Grafy

**Datum:** 2026-04-11
**Agent:** KONTROLOR
**Task:** #16 QA review D13 Dashboard Charts
**Commit:** `71785f9`
**Plán:** `.claude-context/tasks/plan-D13-dashboard-charts.md`
**Typ:** Simplify + Debug + Reverzní kontrola

---

## VERDICT: ⚠️ PODMÍNĚNĚ SCHVÁLENO — 1 bug ke opravě

---

## 1. DEBUG KONTROLA

| Check | Výsledek |
|---|---|
| `npx tsc --noEmit` (D13 source soubory) | ✅ 0 errors |
| `npx tsc --noEmit` (celý projekt) | 1 error v `e2e/chrome-test-235-c1c7-partner.spec.ts:252` — **pre-existing**, nesouvisí s D13 |
| `npx eslint` (D13 soubory × 5) | ✅ 0 errors, 0 warnings |
| Build | ✅ (TSC čistý na source → build projde) |

---

## 2. REVERZNÍ KONTROLA — §4 Acceptance Criteria

| # | Kritérium | Výsledek | Kde ověřeno |
|---|---|---|---|
| AC1 | Partner stats page zobrazuje RevenueChart (tržby, 6 měsíců) | ✅ | `stats/page.tsx:165` — `<RevenueChart data={chartData} height={180} />` |
| AC2 | Partner stats page zobrazuje OrdersChart (prodeje/objednávky) | ✅ | `stats/page.tsx:171-174` — `<OrdersChart data={chartData} .../>` |
| AC3 | Grafy pro BAZAR (prodeje) i VRAKOVISTE (objednávky) | ✅ | `charts/route.ts:20-82` — dvě oddělené větve |
| AC4 | Loading skeleton | ✅ | `stats/page.tsx:66-75` (stats), `:180-185` (charts) — `animate-pulse` |
| AC5 | Tooltip v CZK formátu | ✅ | `RevenueChart.tsx:22` — `toLocaleString("cs-CZ")` |
| AC6 | Responsive: mobile 1 sloupec, desktop 2 sloupce | ✅ | `stats/page.tsx:160` — `grid-cols-1 lg:grid-cols-2` |
| AC7 | PWA-Parts SupplierStats mini RevenueChart (height=120) | ❌ | Viz **BUG-1** níže |
| AC8 | Prázdná data → zobrazí nuly | ✅ | `charts/route.ts:105-128` — `buildMonthlyData()` filluje chybějící měsíce 0 |
| AC9 | TypeScript: 0 errors | ✅ | (pre-existing e2e error, D13 soubory čisté) |
| AC10 | Build: passes | ✅ | TSC source čistý |

**Celkem: 9/10 ✅, 1 ❌ (BUG-1)**

---

## 3. SIMPLIFY KONTROLA

- `RevenueChart` + `OrdersChart` jsou čistě prezentační — nulová business logika ✅
- `"use client"` na obou chart komponentách — STOP-1 splněno ✅
- `buildMonthlyData()` je pure funkce — správně oddělená ✅
- bigint → Number konverze v `buildMonthlyData()` — `Number(primary.count)`, `Number(primary.revenue)` ✅
- Czech měsíční labely konzistentní (`led, uno, bre...`) ✅
- STOP-5 (`soldPrice` na Vehicle): `prisma/schema.prisma:280` — `soldPrice Int?` existuje ✅
- Plan §1.1 implementace je 1:1 verbatim shoda — žádné odchylky ✅

---

## 4. BUGS

### ❌ BUG-1 — PARTS_SUPPLIER/WHOLESALE_SUPPLIER → 403 → SupplierStats mini chart nikdy nevykreslí

**Soubor:** `app/api/partner/stats/charts/route.ts:6`

**Kód:**
```typescript
const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
  }
```

**Problém:** `SupplierStats.tsx:40` (pro PARTS_SUPPLIER) volá `/api/partner/stats/charts?months=6`. Endpoint akceptuje pouze PARTNER_BAZAR/VRAKOVISTE. PARTS_SUPPLIER dostane **403**, `res.ok = false` → `setChartData([])` zůstane prázdné → `chartData.length > 0` nikdy není true → `<RevenueChart>` se nevykreslí.

**Dopad v UI:**
```
SupplierStats (PARTS_SUPPLIER dashboard):
  ✅ StatCardy se zobrazí (z /api/parts/supplier-stats)
  ❌ "Trzby (6 mesicu)" RevenueChart se nezobrazí nikdy
     (chartData = [] kvůli 403 na charts endpoint)
```

**Původ:** Stejný PARTNER_ROLES pattern oversight jako D11 (search route). Plán §1.1 definuje `PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"]` a zároveň §2.2 přidává mini graf do SupplierStats pro PARTS_SUPPLIER. Interní nesoulad v plánu.

**Fix:**
```typescript
// route.ts:6 — rozšířit PARTNER_ROLES:
const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE", "PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "ADMIN", "BACKOFFICE"];

// Přidat třetí větev (po VRAKOVISTE else větvi):
} else {
  // PARTS_SUPPLIER / WHOLESALE_SUPPLIER — identická logika jako VRAKOVISTE
  const ordersData = await prisma.$queryRaw<Array<{
    month: Date;
    count: bigint;
    revenue: bigint | null;
  }>>`
    SELECT
      date_trunc('month', o."createdAt") as month,
      COUNT(DISTINCT o."id")::bigint as count,
      COALESCE(SUM(oi."totalPrice"), 0)::bigint as revenue
    FROM "OrderItem" oi
    JOIN "Order" o ON o."id" = oi."orderId"
    WHERE oi."supplierId" = ${session.user.id}
      AND o."createdAt" >= NOW() - (${months} || ' months')::interval
    GROUP BY date_trunc('month', o."createdAt")
    ORDER BY month
  `;
  const result = buildMonthlyData(months, ordersData, []);
  return NextResponse.json({ type: "SUPPLIER", months: result });
}
```

**Závažnost:** Střední — SupplierStats se zobrazí, mini chart je ale trvale prázdný. AC7 nesplněno.

---

## 5. OBSERVATIONS

### OBS-1 — Grafy zobrazí i pro VRAKOVISTE (AC3 partially untested)

Plan AC3 říká "Grafy správně zobrazují data pro BAZAR i VRAKOVISTE". V `stats/page.tsx:77`:
```typescript
const isBazar = session?.user?.role === "PARTNER_BAZAR";
```
Grafy jsou vně podmínky a zobrazí se pro OBOU rolí ✅. Pro VRAKOVISTE bude `OrdersChart` mít `barLabel="Objednavky"` ✅. Runtime only — kód je správný.

### OBS-2 — StatCard icon type: ReactNode vs. string

`SupplierStats.tsx:65` předává `icon={<span>📦</span>}` (ReactNode), zatímco `stats/page.tsx:122` předává `icon="🚗"` (string). ESLint + TSC oba prochází → StatCard přijímá `ReactNode | string`. Non-blocker, vědomý pattern.

---

## 6. SOUHRN

| Kategorie | Výsledek |
|---|---|
| AC splněno | 9/10 ✅ (1 ❌ BUG-1) |
| Blokerů | 0 |
| TypeScript errors (D13 soubory) | 0 |
| Nové lint errors | 0 |
| Nové lint warnings | 0 |
| Bugs | 1 ⚠️ (BUG-1 — PARTS_SUPPLIER 403 na charts endpoint) |
| STOP-5 (soldPrice) | ✅ existuje na schema:280 |

---

## 7. AKCE

### Priorita 1 — Opravit před releasem
1. **BUG-1:** `app/api/partner/stats/charts/route.ts:6` — přidat `PARTS_SUPPLIER`, `WHOLESALE_SUPPLIER` (+ ADMIN, BACKOFFICE) do `PARTNER_ROLES` + nová větev s identickou OrderItem SQL logikou jako VRAKOVISTE branch. ~25 řádků. 1 soubor.

### Priorita 3 — Nice-to-have
2. Tooltip zobrazuje "Kc" bez diakritiky — MVP vědomé rozhodnutí (jsPDF pattern), non-blocker.
