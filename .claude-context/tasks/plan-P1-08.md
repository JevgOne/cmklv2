# Plan P1-08: Nahradit hardcoded statistiky dynamickymi

**Priorita:** P1
**Slozitost:** S
**Zavislosti:** ZADNE
**Batch:** 1

---

## Cil

Statistiky na /chci-prodat (247 prodanych, 4.8 hodnoceni, 20 dni) a /marketplace (127 flipu, 21% ROI, 48 dni) jsou hardcoded. Nahradit DB queries s graceful fallback.

---

## Analyza aktualniho stavu

### 1. Stranka /chci-prodat
**Soubor:** `app/(web)/chci-prodat/page.tsx`
- Radek 107: `export default function ChciProdatPage()` — **neni async**, musi se zmenit
- Radky 136-137: `20 dni` — prumerna doba prodeje (hardcoded)
- Radky 143-144: `247` — prodanych vozidel (hardcoded)
- Radky 149-150: `4.8` — hodnoceni (hardcoded)

### 2. Stranka /marketplace
**Soubor:** `app/(web)/marketplace/page.tsx`
- Radek 117: `export default function MarketplacePage()` — **neni async**, musi se zmenit
- Radek 165: `127` — dokoncenych flipu
- Radek 169: `21%` — prumerny ROI
- Radek 173: `48 dni` — prumerna doba

### 3. Prisma modely (overeno ve schema)

**DULEZITE — Nazvy modelu ve schema se LISI od puvodniho planu:**
- `Vehicle` (ne ~~BrokerReview~~) — status `SOLD`, pole `overallRating` (1-5, per vehicle), `createdAt`, `updatedAt`
- `FlipOpportunity` (ne ~~MarketplaceDeal~~) — status `COMPLETED`, pole `purchasePrice`, `repairCost`, `actualSalePrice`, `soldAt`, `createdAt`
- Pro rating: Vehicle.overallRating (Int? 1-5) — prumerne hodnoceni se spocita pres vozidla, ne pres BrokerReview (ten neexistuje)

---

## Kroky implementace

### Krok 1: Vytvorit lib/stats.ts

**Soubor:** `lib/stats.ts` (NOVY)

```ts
import { prisma } from "@/lib/prisma";

/**
 * Fallback defaults — pouziji se pokud DB je prazdna nebo nedostupna.
 * Zobrazuji se jako "–" v UI (ne nuly, ne fiktivni cisla).
 */
const DEFAULTS = {
  soldVehicles: 0,
  avgSaleDays: 0,
  avgRating: 0,
  completedFlips: 0,
  avgROI: 0,
  avgFlipDays: 0,
};

/**
 * Statistiky pro stranku /chci-prodat
 */
export async function getBrokerStats() {
  try {
    // 1) Pocet prodanych vozidel (Vehicle.status === "SOLD")
    const soldVehicles = await prisma.vehicle.count({
      where: { status: "SOLD" },
    });

    // 2) Prumerna doba prodeje (createdAt -> updatedAt pro SOLD vozidla)
    //    Vehicle nema explicitni soldAt pole, pouzijeme updatedAt
    const recentSold = await prisma.vehicle.findMany({
      where: { status: "SOLD" },
      select: { createdAt: true, updatedAt: true },
      take: 100,
      orderBy: { updatedAt: "desc" },
    });

    let avgSaleDays = DEFAULTS.avgSaleDays;
    if (recentSold.length > 0) {
      const totalDays = recentSold.reduce((sum, v) => {
        const days = Math.ceil(
          (v.updatedAt.getTime() - v.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + Math.max(days, 1); // min 1 den
      }, 0);
      avgSaleDays = Math.round(totalDays / recentSold.length);
    }

    // 3) Prumerne hodnoceni vozidel (Vehicle.overallRating — Int? 1-5)
    //    POZOR: model BrokerReview NEEXISTUJE v schema.
    //    Pouzijeme Vehicle.overallRating jako proxy.
    const ratingResult = await prisma.vehicle.aggregate({
      where: {
        overallRating: { not: null },
      },
      _avg: { overallRating: true },
    });
    const avgRating = ratingResult._avg.overallRating
      ? Math.round(ratingResult._avg.overallRating * 10) / 10
      : DEFAULTS.avgRating;

    return {
      soldVehicles: soldVehicles || DEFAULTS.soldVehicles,
      avgSaleDays: avgSaleDays || DEFAULTS.avgSaleDays,
      avgRating: avgRating || DEFAULTS.avgRating,
    };
  } catch (error) {
    console.error("Failed to load broker stats:", error);
    return DEFAULTS;
  }
}

/**
 * Statistiky pro stranku /marketplace
 */
export async function getMarketplaceStats() {
  try {
    // 1) Pocet dokoncenych flipu (FlipOpportunity.status === "COMPLETED")
    const completedFlips = await prisma.flipOpportunity.count({
      where: { status: "COMPLETED" },
    });

    // 2) Prumerny ROI a doba flipu
    const completedDeals = await prisma.flipOpportunity.findMany({
      where: { status: "COMPLETED" },
      select: {
        purchasePrice: true,
        repairCost: true,
        actualSalePrice: true,  // NE "salePrice" — schema pouziva actualSalePrice
        soldAt: true,           // NE "completedAt" — schema pouziva soldAt
        createdAt: true,
      },
      take: 50,
      orderBy: { soldAt: "desc" },
    });

    let avgROI = DEFAULTS.avgROI;
    let avgFlipDays = DEFAULTS.avgFlipDays;

    if (completedDeals.length > 0) {
      let roiCount = 0;
      let daysCount = 0;
      let totalROI = 0;
      let totalDays = 0;

      for (const d of completedDeals) {
        // ROI: (prodejni - nakupni - opravy) / (nakupni + opravy) * 100
        if (d.actualSalePrice && d.purchasePrice) {
          const investment = d.purchasePrice + (d.repairCost || 0);
          const profit = d.actualSalePrice - investment;
          totalROI += (profit / investment) * 100;
          roiCount++;
        }
        // Doba: createdAt -> soldAt
        if (d.soldAt) {
          const days = Math.ceil(
            (d.soldAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          totalDays += Math.max(days, 1);
          daysCount++;
        }
      }

      if (roiCount > 0) avgROI = Math.round(totalROI / roiCount);
      if (daysCount > 0) avgFlipDays = Math.round(totalDays / daysCount);
    }

    return {
      completedFlips: completedFlips || DEFAULTS.completedFlips,
      avgROI: avgROI || DEFAULTS.avgROI,
      avgFlipDays: avgFlipDays || DEFAULTS.avgFlipDays,
    };
  } catch (error) {
    console.error("Failed to load marketplace stats:", error);
    return DEFAULTS;
  }
}
```

### Krok 2: Upravit /chci-prodat

**Soubor:** `app/(web)/chci-prodat/page.tsx`

**Zmena 1 — pridat import a zmenit na async (radek 1 a 107):**
```diff
+import { getBrokerStats } from "@/lib/stats";

-export default function ChciProdatPage() {
+export default async function ChciProdatPage() {
+  const stats = await getBrokerStats();
```

**Zmena 2 — pridat ISR revalidate (za metadata export):**
```ts
export const revalidate = 3600; // 1 hodina
```

**Zmena 3 — nahradit hardcoded hodnoty (radky 135-153):**
```diff
 <div className="text-2xl md:text-3xl font-extrabold text-gray-900">
-  20 dní
+  {stats.avgSaleDays > 0 ? `${stats.avgSaleDays} dni` : "–"}
 </div>
 <div className="text-sm text-gray-500">
   průměrná doba prodeje
 </div>

 {/* ... */}

 <div className="text-2xl md:text-3xl font-extrabold text-gray-900">
-  247
+  {stats.soldVehicles > 0 ? stats.soldVehicles.toLocaleString("cs-CZ") : "–"}
 </div>
 <div className="text-sm text-gray-500">prodaných vozidel</div>

 {/* ... */}

 <div className="text-2xl md:text-3xl font-extrabold text-gray-900">
-  4.8
+  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "–"}
 </div>
 <div className="text-sm text-gray-500">hodnocení</div>
```

**Zmena 4 — aktualizovat metadata description (radek 10):**
```diff
-  "Prodáme vaše auto rychleji a za lepší cenu. Průměrná doba prodeje 20 dní. Nechte to na certifikovaném makléři.",
+  "Prodáme vaše auto rychleji a za lepší cenu. Nechte to na certifikovaném makléři CarMakléř.",
```

### Krok 3: Upravit /marketplace

**Soubor:** `app/(web)/marketplace/page.tsx`

**Zmena 1 — pridat import a zmenit na async (radek 117):**
```diff
+import { getMarketplaceStats } from "@/lib/stats";

-export default function MarketplacePage() {
+export default async function MarketplacePage() {
+  const stats = await getMarketplaceStats();
```

**Zmena 2 — pridat ISR revalidate:**
```ts
export const revalidate = 3600;
```

**Zmena 3 — nahradit hardcoded hodnoty (radky 165-175):**
```diff
-  <div className="text-2xl font-extrabold text-orange-500">127</div>
+  <div className="text-2xl font-extrabold text-orange-500">
+    {stats.completedFlips > 0 ? stats.completedFlips : "–"}
+  </div>
   <div className="text-sm text-white/50">Dokončených flipů</div>

-  <div className="text-2xl font-extrabold text-orange-500">21%</div>
+  <div className="text-2xl font-extrabold text-orange-500">
+    {stats.avgROI > 0 ? `${stats.avgROI}%` : "–"}
+  </div>
   <div className="text-sm text-white/50">Průměrný ROI</div>

-  <div className="text-2xl font-extrabold text-orange-500">48 dní</div>
+  <div className="text-2xl font-extrabold text-orange-500">
+    {stats.avgFlipDays > 0 ? `${stats.avgFlipDays} dni` : "–"}
+  </div>
   <div className="text-sm text-white/50">Průměrná doba</div>
```

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `lib/stats.ts` | NOVY — kompletni kod vyse |
| `app/(web)/chci-prodat/page.tsx` | Import stats, async, revalidate, nahradit 3 hardcoded cisla + metadata |
| `app/(web)/marketplace/page.tsx` | Import stats, async, revalidate, nahradit 3 hardcoded cisla |

## Overeni

- [ ] /chci-prodat zobrazuje statistiky z DB (nebo "–" pokud prazdna DB)
- [ ] /marketplace zobrazuje statistiky z DB (nebo "–" pokud prazdna DB)
- [ ] Grep `"247"` v chci-prodat vraci 0 vysledku (hardcoded cislo odstraneno)
- [ ] Grep `"127"` v marketplace vraci 0 vysledku
- [ ] Stranky funguji i s prazdnou DB (graceful fallback, ne crash)
- [ ] ISR revalidate = 3600 je nastaveny na obou strankach
- [ ] Prisma queries pouzivaji spravne nazvy modelu: `vehicle` (ne ~~brokerReview~~), `flipOpportunity` (ne ~~marketplaceDeal~~)
- [ ] Prisma queries pouzivaji spravna pole: `actualSalePrice` (ne ~~salePrice~~), `soldAt` (ne ~~completedAt~~)
- [ ] Build prochazi bez TypeScript chyb
