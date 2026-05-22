# Plan D13 — Dashboard Grafy (Partner PWA + PWA-Parts)

**Datum:** 2026-04-11
**Agent:** Plánovač
**Zdroj:** plan-faze3-batch-a.md §3, codebase audit
**Effort:** ~5h
**DB migrace:** ŽÁDNÁ
**Nové dependencies:** ŽÁDNÉ (recharts v3.8.1 already installed)

---

## §0 Executive summary

Recharts je nainstalován a funguje — proven pattern v `components/web/PriceHistory.tsx` (LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis). Partner stats page i PWA-Parts SupplierStats zobrazují jen StatCardy bez grafů. API vrací jen snapshot counts, žádná time-series data.

**Přístup:**
1. Nový **time-series API endpoint** `/api/partner/stats/charts` s Prisma raw SQL `date_trunc`
2. Dva **reusable chart components**: `RevenueChart` (Area) + `OrdersChart` (Bar)
3. Integrace do **partner stats page** pod existující StatCard grid
4. Mini graf do **SupplierStats** na PWA-Parts dashboard

---

## §1 Soubory k vytvoření

### 1.1 `app/api/partner/stats/charts/route.ts` (NEW, ~90 lines)

```tsx
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"];

const MONTH_LABELS = ["led", "uno", "bre", "dub", "kve", "cer", "cvc", "srp", "zar", "rij", "lis", "pro"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const monthsParam = new URL(request.url).searchParams.get("months") || "6";
    const months = Math.min(12, Math.max(1, parseInt(monthsParam, 10)));

    if (session.user.role === "PARTNER_BAZAR") {
      // Prodeje po měsících
      const salesData = await prisma.$queryRaw<Array<{
        month: Date;
        count: bigint;
        revenue: bigint | null;
      }>>`
        SELECT
          date_trunc('month', "soldAt") as month,
          COUNT(*)::bigint as count,
          COALESCE(SUM("soldPrice"), 0)::bigint as revenue
        FROM "Vehicle"
        WHERE "brokerId" = ${session.user.id}
          AND "status" = 'SOLD'
          AND "soldAt" IS NOT NULL
          AND "soldAt" >= NOW() - (${months} || ' months')::interval
        GROUP BY date_trunc('month', "soldAt")
        ORDER BY month
      `;

      // Leads po měsících
      const partner = await prisma.partner.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      let leadsData: Array<{ month: Date; count: bigint }> = [];
      if (partner) {
        leadsData = await prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
          SELECT
            date_trunc('month', "createdAt") as month,
            COUNT(*)::bigint as count
          FROM "PartnerLead"
          WHERE "partnerId" = ${partner.id}
            AND "createdAt" >= NOW() - (${months} || ' months')::interval
          GROUP BY date_trunc('month', "createdAt")
          ORDER BY month
        `;
      }

      // Build unified response — fill missing months with zeros
      const result = buildMonthlyData(months, salesData, leadsData);
      return NextResponse.json({ type: "BAZAR", months: result });

    } else {
      // PARTNER_VRAKOVISTE — objednávky + tržby
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
      return NextResponse.json({ type: "VRAKOVISTE", months: result });
    }
  } catch (error) {
    console.error("GET /api/partner/stats/charts error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

interface MonthEntry {
  label: string;
  month: string;     // "2026-01"
  count: number;
  revenue: number;
  leads?: number;
}

function buildMonthlyData(
  months: number,
  primaryData: Array<{ month: Date; count: bigint; revenue?: bigint | null }>,
  leadsData: Array<{ month: Date; count: bigint }>,
): MonthEntry[] {
  const now = new Date();
  const result: MonthEntry[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = MONTH_LABELS[d.getMonth()];

    const primary = primaryData.find(r => {
      const rd = new Date(r.month);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    });

    const leads = leadsData.find(r => {
      const rd = new Date(r.month);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    });

    result.push({
      label,
      month: key,
      count: primary ? Number(primary.count) : 0,
      revenue: primary?.revenue ? Number(primary.revenue) : 0,
      ...(leadsData.length > 0 ? { leads: leads ? Number(leads.count) : 0 } : {}),
    });
  }

  return result;
}
```

**Klíčová rozhodnutí:**
- **Raw SQL** (`$queryRaw`) místo Prisma aggregate — Prisma groupBy nepodporuje `date_trunc`. Proven pattern z codebase (pricingAggregate, feed-import).
- **bigint → Number** konverze (PostgreSQL vrací bigint pro COUNT/SUM)
- **Fill missing months** — pokud v měsíci nebyly žádné prodeje, vrátíme 0 (ne díru v datech)
- Czech month labels (`led`, `uno`, `bre`...) pro grafy
- **Interval parametrizace** — `${months} || ' months'` jako bezpečný tagged template

---

### 1.2 `components/ui/charts/RevenueChart.tsx` (NEW, ~40 lines)

```tsx
"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RevenueChartProps {
  data: Array<{ label: string; revenue: number }>;
  height?: number;
}

export function RevenueChart({ data, height = 200 }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11 }}
          width={50}
        />
        <Tooltip
          formatter={(value: number) => [`${Number(value).toLocaleString("cs-CZ")} Kc`, "Trzby"]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#F97316"
          fill="#F97316"
          fillOpacity={0.1}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

---

### 1.3 `components/ui/charts/OrdersChart.tsx` (NEW, ~40 lines)

```tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface OrdersChartProps {
  data: Array<{ label: string; count: number }>;
  height?: number;
  barLabel?: string;
}

export function OrdersChart({ data, height = 200, barLabel = "Objednavky" }: OrdersChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} width={30} allowDecimals={false} />
        <Tooltip formatter={(value: number) => [value, barLabel]} />
        <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

---

## §2 Soubory k editaci

### 2.1 `app/(partner)/partner/stats/page.tsx` — přidat grafy pod StatCard grid

**Přidat importy (line 1-6):**

```diff
  "use client";
  
  import { useEffect, useState } from "react";
  import { useSession } from "next-auth/react";
  import { Card } from "@/components/ui/Card";
  import { StatCard } from "@/components/ui/StatCard";
+ import { RevenueChart } from "@/components/ui/charts/RevenueChart";
+ import { OrdersChart } from "@/components/ui/charts/OrdersChart";
```

**Přidat chart data state (po line 21):**

```tsx
interface ChartMonth {
  label: string;
  month: string;
  count: number;
  revenue: number;
  leads?: number;
}

const [chartData, setChartData] = useState<ChartMonth[]>([]);
const [chartLoading, setChartLoading] = useState(true);
```

**Přidat chart data fetch (do existujícího useEffect, nebo přidat nový):**

```tsx
useEffect(() => {
  async function loadCharts() {
    try {
      const res = await fetch("/api/partner/stats/charts?months=6");
      if (res.ok) {
        const data = await res.json();
        setChartData(data.months || []);
      }
    } catch { /* silent */ }
    finally { setChartLoading(false); }
  }
  loadCharts();
}, []);
```

**Přidat grafy do JSX — po StatCard gridech (po line 107 pro Bazar, po line 129 pro Vrakoviste):**

Pro **obě varianty** (Bazar i Vrakoviste) přidat pod příslušný StatCard grid:

```tsx
{/* Charts */}
{!chartLoading && chartData.length > 0 && (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
    <Card className="p-4">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
        Trzby po mesicich
      </h3>
      <RevenueChart data={chartData} height={180} />
    </Card>
    <Card className="p-4">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
        {isBazar ? "Prodeje po mesicich" : "Objednavky po mesicich"}
      </h3>
      <OrdersChart
        data={chartData}
        height={180}
        barLabel={isBazar ? "Prodeje" : "Objednavky"}
      />
    </Card>
  </div>
)}

{chartLoading && (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
    <div className="bg-white rounded-2xl p-4 shadow-sm h-52 animate-pulse" />
    <div className="bg-white rounded-2xl p-4 shadow-sm h-52 animate-pulse" />
  </div>
)}
```

**POZOR:** Grafy musí být UVNITŘ podmíněného bloku (isBazar ? ... : ...) — obě větve dostanou stejné grafy, jen s jiným labelem. Implementator by měl přidat chart sekci po OBOU StatCard gridech (line ~108 a ~130), ne mezi nimi.

Alternativně (jednodušší): vytáhnout chart sekci VEN z podmínky a umístit ji na konec celé stránky:

```tsx
return (
  <div>
    <h1>...</h1>
    {isBazar && stats?.funnel ? ( ... ) : stats ? ( ... ) : null}

    {/* Charts — zobrazí se pro obě role */}
    {!chartLoading && chartData.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        ...
      </div>
    )}
  </div>
);
```

---

### 2.2 `components/pwa-parts/dashboard/SupplierStats.tsx` — přidat mini graf

**Přidat importy:**

```diff
  "use client";
  
  import { useState, useEffect } from "react";
  import { StatCard } from "@/components/ui/StatCard";
+ import { RevenueChart } from "@/components/ui/charts/RevenueChart";
+ import { Card } from "@/components/ui/Card";
```

**Přidat chart state + fetch (po existujícím stats fetch):**

```tsx
const [chartData, setChartData] = useState<Array<{ label: string; revenue: number }>>([]);

useEffect(() => {
  async function fetchCharts() {
    try {
      const res = await fetch("/api/partner/stats/charts?months=6");
      if (res.ok) {
        const data = await res.json();
        setChartData(data.months || []);
      }
    } catch { /* silent */ }
  }
  fetchCharts();
}, []);
```

**Přidat mini graf pod StatCard grid (po line 70, před closing `</div>`):**

```tsx
{chartData.length > 0 && (
  <Card className="p-3 mt-3 col-span-2">
    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Trzby (6 mesicu)</h4>
    <RevenueChart data={chartData} height={120} />
  </Card>
)}
```

**POZOR na grid:** SupplierStats používá `grid grid-cols-2 gap-3`. Mini graf by měl mít `col-span-2` aby zabral celou šířku.

---

## §3 Adresářová struktura

```
components/ui/charts/
  RevenueChart.tsx    ← NEW
  OrdersChart.tsx     ← NEW

app/api/partner/stats/
  route.ts            ← EXISTS (stats summary)
  charts/
    route.ts          ← NEW (time-series)
```

---

## §4 Acceptance criteria

- [ ] Partner stats page zobrazuje RevenueChart (tržby po měsících, posledních 6)
- [ ] Partner stats page zobrazuje OrdersChart (prodeje/objednávky po měsících)
- [ ] Grafy správně zobrazují data pro BAZAR (prodeje) i VRAKOVISTE (objednávky)
- [ ] Grafy mají loading skeleton
- [ ] Tooltip ukazuje přesné hodnoty v CZK formátu (CZ locale)
- [ ] Responsive: grafy na mobile 1 sloupec, desktop 2 sloupce
- [ ] PWA-Parts SupplierStats zobrazuje mini RevenueChart (height=120)
- [ ] Prázdná data: pokud žádné prodeje/objednávky → grafy zobrazí nuly (ne broken state)
- [ ] TypeScript: 0 errors
- [ ] Build: passes

## §5 STOP kritéria

- **STOP-1:** recharts import failure / tree-shaking issue → ověř `"use client"` na chart components. Recharts VYŽADUJE client-side rendering.
- **STOP-2:** Raw SQL `$queryRaw` selhává → ověř PostgreSQL `date_trunc` syntax. Fallback: Prisma `groupBy` s vlastním month bucket (méně elegantní ale funkční).
- **STOP-3:** Rendering SSR error (recharts requires window) → chart components MUSÍ být `"use client"` a importovány pouze v client components.
- **STOP-4:** bigint serialization error → `Number(bigint)` konverze v `buildMonthlyData`. Pokud přetéká (unlikely pro SMB), použij `BigInt.toString()` + parseInt.
- **STOP-5:** `soldPrice` neexistuje na Vehicle modelu → ověř schema. Pokud chybí, fallback na `price` field.

## §6 Implementation order

D13 by se měl implementovat **PO D11** (obě editují partner-related files). Doporučené pořadí:
1. API endpoint (`charts/route.ts`) — testovatelný samostatně
2. Chart components (`RevenueChart` + `OrdersChart`) — izolované
3. Stats page integrace — propojení
4. SupplierStats mini graf — bonus
