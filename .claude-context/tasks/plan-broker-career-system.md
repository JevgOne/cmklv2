# Plan: Makléřský bodový/kariérní systém

**Task:** #38
**Issue:** Nahradit stávající level systém (počet prodejů) za bodový systém s novými kariérními úrovněmi
**Autor:** Plánovač
**Datum:** 2026-04-25

---

## ANALÝZA

### Stávající stav:

**Kariérní systém** (`lib/gamification-levels.ts`):
- 4 úrovně: JUNIOR (0-4 prodejů), BROKER (5-19), SENIOR (20-49), TOP (50+)
- Založený na `totalSales` (počet Commission záznamů)
- Žádné body — jen počet prodejů

**Provize** (`lib/commission-calculator.ts`):
- Celková provize = 5% z prodejní ceny, min 25 000 Kč
- Broker dostane VŽDY 50% (fixní)
- Firma dostane 50% minus manažerský bonus (2 500 Kč)
- Žádné rozlišení dle úrovně makléře

**User model** (`prisma/schema.prisma:34-35`):
```prisma
level      String @default("JUNIOR") // JUNIOR, BROKER, SENIOR, TOP
totalSales Int    @default(0)
```

**Kde se level používá:**
- `components/pwa/gamification/LevelBadge.tsx` — vizuální badge (JUNIOR/BROKER/SENIOR/TOP)
- `components/ui/LevelProgressBar.tsx` — progress bar k další úrovni
- `components/pwa/gamification/LeaderboardTable.tsx` — level badge v žebříčku
- `app/(pwa)/makler/dashboard/page.tsx` — badge v hlavičce + žebříček pozice
- `app/(pwa)/makler/stats/page.tsx` — level + progress bar + achievements
- `app/(pwa)/makler/leaderboard/page.tsx` — leaderboard s levely
- `lib/role-labels.ts:20-25` — LEVEL_LABELS
- `lib/gamification.ts:196-199` — `calculateLevel(totalSales)` při achievement checku
- `__tests__/lib/gamification.test.ts` — testy

**Jak se vytváří Commission** (`app/api/vehicles/[id]/handover/route.ts:119-136`):
- Při předání vozidla (handover) → `calculateCommission(soldPrice)`
- Výsledek se uloží do `commission.create()` s `brokerShare`, `companyShare`, `managerBonus`
- Fixní `rate: 0.05`

### Nový systém (dle zadání):

**Kariérní úrovně (bodový systém):**

| Úroveň | Klíč | Min. body | % provize z prodeje |
|---------|------|-----------|---------------------|
| Tipař | TIPAR | 0 | 30% |
| Junior | JUNIOR | 300 | 40% |
| Senior | SENIOR | 500 | 55% |
| Expert | EXPERT | 650 | 65% |

+5% bonus za TIP (doporučení klienta)

**Přepočet na body:**
- Auto prodej: 1 000 Kč provize pro firmu = 1 bod (auto za 25k provize = 25 bodů)
- Úvěr: fixně 20 bodů (počítá se od 20k Kč)
- POV/HAV (pojištění): 10 000 Kč co zaplatí klient = 1.4 bodu

**Modelový příklad (1 klient):**
- Auto: 25 bodů + Úvěr: 20 bodů + POV/HAV: 2.8 bodů = 47.8 bodů
- Tipař (30%): 25 000 × 0.30 = 7 500 Kč (z prodeje auta)
- Senior (55%): 25 000 × 0.55 = 13 750 Kč (z prodeje auta)

### Klíčové rozdíly old → new:

| Aspekt | Starý systém | Nový systém |
|--------|-------------|-------------|
| Úrovně | JUNIOR/BROKER/SENIOR/TOP | TIPAR/JUNIOR/SENIOR/EXPERT |
| Metrika | Počet prodejů (totalSales) | Kumulativní body (totalPoints) |
| Zdroje bodů | Jen auto prodej | Auto + Úvěr + Pojištění |
| Broker % | Vždy 50% | 30%/40%/55%/65% dle úrovně |
| TIP bonus | Neexistuje | +5% za doporučení |
| Manažerský bonus | 2 500 Kč fixní | Zachovat (nezmíněno v zadání) |

### STOP OTÁZKA PRO LEADA:

**Body se počítají kumulativně (celkem za celou kariéru) nebo jen za aktuální období?**
→ Plán předpokládá: KUMULATIVNĚ (lifetime points) — jednou dosažená úroveň se neztrácí.

**Manažerský bonus 2 500 Kč — zachovat?**
→ Plán předpokládá: ANO, zachovat stávající logiku.

---

## IMPLEMENTAČNÍ PLÁN (7 kroků)

### Krok 1: Prisma schema — nový model BrokerPointTransaction + úprava User

**Soubor:** `prisma/schema.prisma`

**1a) Nový model BrokerPointTransaction:**

```prisma
model BrokerPointTransaction {
  id       String @id @default(cuid())
  brokerId String
  broker   User   @relation("BrokerPoints", fields: [brokerId], references: [id])

  type     String // CAR_SALE, LOAN, INSURANCE, TIP_BONUS, MANUAL_ADJUSTMENT
  points   Float  // Počet bodů (může být desetinné — např. 2.8 za pojištění)
  
  // Reference na zdroj bodů
  vehicleId    String?  // Pro CAR_SALE — propojení na vozidlo
  commissionId String?  // Pro CAR_SALE — propojení na Commission
  description  String?  // Popis transakce (např. "Úvěr 450 000 Kč", "POV/HAV 20 000 Kč")
  
  // Finanční hodnoty pro audit
  sourceAmount Int?     // Částka ze které se body počítaly (provize firmy / klientova platba)
  
  createdAt DateTime @default(now())

  @@index([brokerId])
  @@index([type])
  @@index([createdAt])
}
```

**1b) Úprava User modelu (ř. 33-35):**

Nahradit:
```prisma
// Gamifikace
level      String @default("JUNIOR") // JUNIOR, BROKER, SENIOR, TOP
totalSales Int    @default(0)
```

Za:
```prisma
// Gamifikace — bodový systém
level       String @default("TIPAR")  // TIPAR, JUNIOR, SENIOR, EXPERT
totalSales  Int    @default(0)        // Zachovat pro zpětnou kompatibilitu
totalPoints Float  @default(0)        // Kumulativní body
```

**1c) Přidat relaci na User (za ř. 88 — gamifikace relace):**

```prisma
// Bodové transakce
pointTransactions BrokerPointTransaction[] @relation("BrokerPoints")
```

**1d) Vytvořit migraci:**

```bash
npx prisma migrate dev --name add-broker-points-system
```

---

### Krok 2: Nový `lib/broker-points.ts` — logika bodového systému

**Nový soubor:** `lib/broker-points.ts`

```ts
import { prisma } from "./prisma";

// ============================================
// KARIÉRNÍ ÚROVNĚ
// ============================================

export const CAREER_LEVELS = [
  { key: "TIPAR", name: "Tipař", minPoints: 0, commissionRate: 0.30 },
  { key: "JUNIOR", name: "Junior", minPoints: 300, commissionRate: 0.40 },
  { key: "SENIOR", name: "Senior", minPoints: 500, commissionRate: 0.55 },
  { key: "EXPERT", name: "Expert", minPoints: 650, commissionRate: 0.65 },
] as const;

export type CareerLevelKey = "TIPAR" | "JUNIOR" | "SENIOR" | "EXPERT";

export const TIP_BONUS_RATE = 0.05; // +5% za doporučení klienta

// ============================================
// VÝPOČET BODŮ
// ============================================

/** Auto prodej: 1 000 Kč provize pro firmu = 1 bod */
export function calculateCarSalePoints(companyCommission: number): number {
  return companyCommission / 1000;
}

/** Úvěr: fixně 20 bodů (počítá se od 20k Kč) */
export function calculateLoanPoints(loanAmount: number): number {
  if (loanAmount < 20_000) return 0;
  return 20;
}

/** POV/HAV: 10 000 Kč co zaplatí klient = 1.4 bodu */
export function calculateInsurancePoints(clientPayment: number): number {
  return (clientPayment / 10_000) * 1.4;
}

// ============================================
// LEVEL Z BODŮ
// ============================================

export function calculateCareerLevel(totalPoints: number): (typeof CAREER_LEVELS)[number] {
  for (let i = CAREER_LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= CAREER_LEVELS[i].minPoints) {
      return CAREER_LEVELS[i];
    }
  }
  return CAREER_LEVELS[0];
}

export function getCareerLevelByKey(key: string): (typeof CAREER_LEVELS)[number] {
  return CAREER_LEVELS.find((l) => l.key === key) ?? CAREER_LEVELS[0];
}

// ============================================
// BROKER COMMISSION RATE
// ============================================

/** Vrátí % provize pro makléře na základě jeho úrovně + TIP bonus */
export function getBrokerCommissionRate(level: CareerLevelKey, isTip: boolean = false): number {
  const careerLevel = getCareerLevelByKey(level);
  return careerLevel.commissionRate + (isTip ? TIP_BONUS_RATE : 0);
}

// ============================================
// PŘIDAT BODY
// ============================================

export async function addBrokerPoints(params: {
  brokerId: string;
  type: "CAR_SALE" | "LOAN" | "INSURANCE" | "TIP_BONUS" | "MANUAL_ADJUSTMENT";
  points: number;
  vehicleId?: string;
  commissionId?: string;
  description?: string;
  sourceAmount?: number;
}): Promise<{ newTotalPoints: number; newLevel: CareerLevelKey; levelChanged: boolean }> {
  const { brokerId, type, points, vehicleId, commissionId, description, sourceAmount } = params;

  // Vytvořit point transakci + aktualizovat totalPoints atomicky
  const result = await prisma.$transaction(async (tx) => {
    await tx.brokerPointTransaction.create({
      data: {
        brokerId,
        type,
        points,
        vehicleId: vehicleId ?? null,
        commissionId: commissionId ?? null,
        description: description ?? null,
        sourceAmount: sourceAmount ?? null,
      },
    });

    // Přepočítat totalPoints z transakcí (přesnější než increment)
    const agg = await tx.brokerPointTransaction.aggregate({
      where: { brokerId },
      _sum: { points: true },
    });

    const newTotalPoints = agg._sum.points ?? 0;
    const newLevel = calculateCareerLevel(newTotalPoints);

    const user = await tx.user.findUnique({
      where: { id: brokerId },
      select: { level: true },
    });

    const levelChanged = user?.level !== newLevel.key;

    await tx.user.update({
      where: { id: brokerId },
      data: {
        totalPoints: newTotalPoints,
        level: newLevel.key,
      },
    });

    return { newTotalPoints, newLevel: newLevel.key as CareerLevelKey, levelChanged };
  });

  return result;
}

// ============================================
// PROGRESS K DALŠÍ ÚROVNI
// ============================================

export interface CareerProgress {
  currentLevel: (typeof CAREER_LEVELS)[number];
  nextLevel: (typeof CAREER_LEVELS)[number] | null;
  percentage: number;
  currentPoints: number;
  pointsNeeded: number;
}

export function calculateCareerProgress(totalPoints: number): CareerProgress {
  const currentLevel = calculateCareerLevel(totalPoints);
  const currentIdx = CAREER_LEVELS.findIndex((l) => l.key === currentLevel.key);
  const nextLevel = currentIdx < CAREER_LEVELS.length - 1 ? CAREER_LEVELS[currentIdx + 1] : null;

  if (!nextLevel) {
    return { currentLevel, nextLevel: null, percentage: 100, currentPoints: totalPoints, pointsNeeded: 0 };
  }

  const rangeSize = nextLevel.minPoints - currentLevel.minPoints;
  const progress = totalPoints - currentLevel.minPoints;
  const percentage = Math.min(100, Math.round((progress / rangeSize) * 100));
  const pointsNeeded = Math.max(0, nextLevel.minPoints - totalPoints);

  return { currentLevel, nextLevel, percentage, currentPoints: totalPoints, pointsNeeded };
}
```

---

### Krok 3: Aktualizovat `lib/gamification-levels.ts` — nové úrovně

**Soubor:** `lib/gamification-levels.ts`

Kompletně přepsat s novými úrovněmi (tento soubor je importován v client komponentech):

```ts
/**
 * Client-safe career level definitions and progress calculation.
 * Based on points system (not sales count).
 */

export const LEVELS = [
  { key: "TIPAR", name: "Tipař", minPoints: 0, badge: "bronze", commissionRate: 0.30 },
  { key: "JUNIOR", name: "Junior", minPoints: 300, badge: "silver", commissionRate: 0.40 },
  { key: "SENIOR", name: "Senior", minPoints: 500, badge: "gold", commissionRate: 0.55 },
  { key: "EXPERT", name: "Expert", minPoints: 650, badge: "diamond", commissionRate: 0.65 },
] as const;

export type LevelKey = "TIPAR" | "JUNIOR" | "SENIOR" | "EXPERT";

// Zpětná kompatibilita — stará funkce (deprecated, ale ponechat aby nepadaly importy)
export function calculateLevel(totalSalesOrPoints: number): (typeof LEVELS)[number] {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalSalesOrPoints >= LEVELS[i].minPoints) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getLevelByKey(key: string) {
  return LEVELS.find((l) => l.key === key) ?? LEVELS[0];
}

// ============================================
// LEVEL PROGRESS (bodový systém)
// ============================================

export interface LevelProgress {
  currentLevel: (typeof LEVELS)[number];
  nextLevel: (typeof LEVELS)[number] | null;
  percentage: number;
  currentPoints: number;
  pointsNeeded: number;
}

export function calculateLevelProgress(totalPoints: number): LevelProgress {
  const currentLevel = calculateLevel(totalPoints);
  const currentIdx = LEVELS.findIndex((l) => l.key === currentLevel.key);
  const nextLevel = currentIdx < LEVELS.length - 1 ? LEVELS[currentIdx + 1] : null;

  if (!nextLevel) {
    return { currentLevel, nextLevel: null, percentage: 100, currentPoints: totalPoints, pointsNeeded: 0 };
  }

  const rangeSize = nextLevel.minPoints - currentLevel.minPoints;
  const progress = totalPoints - currentLevel.minPoints;
  const percentage = Math.min(100, Math.round((progress / rangeSize) * 100));
  const pointsNeeded = Math.max(0, nextLevel.minPoints - totalPoints);

  return { currentLevel, nextLevel, percentage, currentPoints: totalPoints, pointsNeeded };
}
```

**BREAKING CHANGE:** `minSales` → `minPoints`, `maxSales` → odstraněno (nepotřeba), `salesNeeded` → `pointsNeeded`, `currentSales` → `currentPoints`.

---

### Krok 4: Aktualizovat `lib/commission-calculator.ts` — provize dle úrovně

**Soubor:** `lib/commission-calculator.ts`

Přepsat aby akceptoval level makléře:

```ts
/**
 * Kalkulace provize z prodeje vozidla.
 *
 * Pravidla:
 * - Celková provize = 5% z prodejní ceny, minimálně 25 000 Kč
 * - Makléřův podíl závisí na kariérní úrovni:
 *   - Tipař: 30%
 *   - Junior: 40%
 *   - Senior: 55%
 *   - Expert: 65%
 * - +5% bonus za TIP (doporučení klienta)
 * - Manažerský bonus = 2 500 Kč (fixní)
 */

import { getCareerLevelByKey, TIP_BONUS_RATE, type CareerLevelKey } from "./broker-points";

export interface CommissionBreakdown {
  total: number;
  brokerShare: number;
  companyShare: number;
  managerBonus: number;
  brokerRate: number; // Skutečná sazba makléře (0.30-0.70)
}

const MIN_COMMISSION = 25_000;
const COMMISSION_RATE = 0.05;
const MANAGER_BONUS = 2_500;

export function calculateCommission(
  soldPrice: number,
  brokerLevel: CareerLevelKey = "TIPAR",
  isTip: boolean = false
): CommissionBreakdown {
  const total = Math.max(soldPrice * COMMISSION_RATE, MIN_COMMISSION);

  const careerLevel = getCareerLevelByKey(brokerLevel);
  const brokerRate = careerLevel.commissionRate + (isTip ? TIP_BONUS_RATE : 0);

  const brokerShare = total * brokerRate;
  const managerBonus = MANAGER_BONUS;
  const companyShare = total - brokerShare - managerBonus;

  return {
    total: Math.round(total),
    brokerShare: Math.round(brokerShare),
    companyShare: Math.round(Math.max(0, companyShare)),
    managerBonus,
    brokerRate,
  };
}
```

**BREAKING CHANGE:** `calculateCommission(soldPrice)` → `calculateCommission(soldPrice, brokerLevel, isTip)`. Defaultní level = TIPAR (30%), takže bez parametru vrátí nižší broker share než dřív (30% vs 50%).

---

### Krok 5: Aktualizovat handover route — body + level-based provize

**Soubor:** `app/api/vehicles/[id]/handover/route.ts`

**5a) Přidat import (ř. 7-8):**
```ts
import { calculateCommission } from "@/lib/commission-calculator";
import { addBrokerPoints, calculateCarSalePoints } from "@/lib/broker-points";
```

**5b) Načíst level makléře (ř. 30-36) — přidat `level` do select:**
```ts
broker: {
  select: { id: true, firstName: true, lastName: true, managerId: true, level: true },
},
```

**5c) Předat level do calculateCommission (ř. 84):**
```ts
const brokerLevel = (vehicle.broker?.level ?? "TIPAR") as CareerLevelKey;
const commissionBreakdown = calculateCommission(data.soldPrice, brokerLevel);
```

**5d) Po vytvoření Commission — přidat body (za ř. 136):**
```ts
// Přidat body za prodej auta
if (vehicle.brokerId && commission) {
  const points = calculateCarSalePoints(commissionBreakdown.total);
  const pointResult = await addBrokerPoints({
    brokerId: vehicle.brokerId,
    type: "CAR_SALE",
    points,
    vehicleId: vehicle.id,
    commissionId: commission.id,
    description: `Prodej ${vehicle.brand} ${vehicle.model} za ${data.soldPrice} Kč`,
    sourceAmount: commissionBreakdown.total,
  });

  // Notifikace při změně úrovně
  if (pointResult.levelChanged) {
    await createNotification({
      userId: vehicle.brokerId,
      type: "SYSTEM",
      title: `Povýšení! Jste nyní ${pointResult.newLevel}`,
      body: `Celkem ${pointResult.newTotalPoints.toFixed(1)} bodů`,
      link: "/makler/stats",
    });
  }
}
```

---

### Krok 6: Aktualizovat UI komponenty

**6a) `components/pwa/gamification/LevelBadge.tsx` — nové úrovně:**

Nahradit celý `LEVEL_CONFIG`:
```ts
const LEVEL_CONFIG: Record<string, { name: string; colors: string; icon: string }> = {
  TIPAR: {
    name: "Tipař",
    colors: "bg-gray-100 text-gray-600 border-gray-300",
    icon: "starter",
  },
  JUNIOR: {
    name: "Junior",
    colors: "bg-amber-100 text-amber-700 border-amber-300",
    icon: "bronze",
  },
  SENIOR: {
    name: "Senior",
    colors: "bg-yellow-100 text-yellow-700 border-yellow-400",
    icon: "gold",
  },
  EXPERT: {
    name: "Expert",
    colors: "bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 border-blue-400",
    icon: "diamond",
  },
};
```

Aktualizovat `LevelIcon` — přidat `TIPAR` ikonu (jednoduchý person icon), přejmenovat `TOP` → `EXPERT`, `BROKER` → nepoužívat.

Fallback v `LevelBadge` (ř. 77):
```ts
const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.TIPAR;
```

**6b) `components/ui/LevelProgressBar.tsx` — body místo prodejů:**

Změnit props:
```ts
export interface LevelProgressBarProps {
  level: string;
  totalPoints: number; // ZMĚNA: bylo totalSales
  size?: "sm" | "md";
}
```

Změnit vnitřek:
```ts
const progress = calculateLevelProgress(totalPoints); // bylo totalSales
```

Text:
```ts
{progress.percentage}% do {nextLabel}
{!isSm && ` · ${progress.pointsNeeded.toFixed(0)} bodů`}
```

**6c) `lib/role-labels.ts:20-25` — nové LEVEL_LABELS:**

```ts
export const LEVEL_LABELS: Record<string, string> = {
  TIPAR: "Tipař",
  JUNIOR: "Junior",
  SENIOR: "Senior",
  EXPERT: "Expert",
};
```

---

### Krok 7: Aktualizovat dashboard + stats stránky

**7a) `app/(pwa)/makler/dashboard/page.tsx`:**

Přidat `totalPoints` do User select (ř. 82):
```ts
select: { quickModeEnabled: true, level: true, totalPoints: true },
```

Přidat progress pod Level badge (ř. ~114):
```tsx
<div className="text-right">
  <LevelBadge level={userLevel} size="md" />
  <p className="text-xs text-gray-500 mt-1">
    {userData?.totalPoints?.toFixed(0) ?? 0} bodů
  </p>
</div>
```

**7b) `app/(pwa)/makler/stats/page.tsx`:**

- Změnit User select: přidat `totalPoints` (ř. 42)
- Nahradit `totalSales` logiku za `totalPoints` v Úroveň sekci (ř. 427-453)
- Progress bar: `calculateLevelProgress(totalPoints)` místo `calculateLevelProgress(totalSales)`
- Přidat sekci "Historie bodů" — fetch z BrokerPointTransaction:

```tsx
{/* Historie bodů */}
<Card className="p-4">
  <h3 className="font-bold text-gray-900 mb-3">Poslední body</h3>
  <div className="space-y-2">
    {recentPoints.map((pt) => (
      <div key={pt.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <div>
          <p className="text-sm font-medium text-gray-900">{pt.description}</p>
          <p className="text-xs text-gray-500">{pt.type} · {formatDate(pt.createdAt)}</p>
        </div>
        <span className="text-sm font-bold text-orange-500">+{pt.points.toFixed(1)} b</span>
      </div>
    ))}
  </div>
</Card>
```

Data fetch přidat do Promise.all:
```ts
prisma.brokerPointTransaction.findMany({
  where: { brokerId: userId },
  orderBy: { createdAt: "desc" },
  take: 10,
  select: { id: true, type: true, points: true, description: true, createdAt: true },
}),
```

**7c) `app/(pwa)/makler/leaderboard/page.tsx`:**

Leaderboard aktuálně řadí dle měsíčních provizí — to může zůstat. Přidat level badge s novými hodnotami (TIPAR místo JUNIOR default).

**7d) `__tests__/lib/gamification.test.ts`:**

Aktualizovat testy:
```ts
describe('calculateLevel (points-based)', () => {
  it('0 bodů → TIPAR', () => {
    const level = calculateLevel(0);
    expect(level.key).toBe('TIPAR');
  });
  
  it('299 bodů → TIPAR', () => {
    const level = calculateLevel(299);
    expect(level.key).toBe('TIPAR');
  });

  it('300 bodů → JUNIOR', () => {
    const level = calculateLevel(300);
    expect(level.key).toBe('JUNIOR');
  });

  it('500 bodů → SENIOR', () => {
    const level = calculateLevel(500);
    expect(level.key).toBe('SENIOR');
  });

  it('650 bodů → EXPERT', () => {
    const level = calculateLevel(650);
    expect(level.key).toBe('EXPERT');
  });
});
```

---

## API ENDPOINTS PRO BUDOUCÍ ROZŠÍŘENÍ

**Úvěr + Pojištění body** — zatím neexistují API endpointy pro záznam úvěru/pojištění. Bodový systém je připravený (`addBrokerPoints` s `type: "LOAN" | "INSURANCE"`), ale volání se přidá až budou tyto API vytvořeny.

Pro manuální přidání bodů (ADMIN):

**Nový endpoint (optional follow-up):** `app/api/admin/brokers/[id]/points/route.ts`
```ts
// POST — manuální přidání bodů (ADMIN/BACKOFFICE only)
// Body: { type: "LOAN" | "INSURANCE" | "MANUAL_ADJUSTMENT", points: number, description: string, sourceAmount?: number }
```

---

## SOUBORY K EDITACI

| # | Soubor | Akce | Popis |
|---|--------|------|-------|
| 1 | `prisma/schema.prisma` | EDIT | Nový model BrokerPointTransaction + User: totalPoints, level default TIPAR |
| 2 | `lib/broker-points.ts` | **CREATE** | Bodový systém — výpočty, přidávání bodů, career levels (~120 řádků) |
| 3 | `lib/gamification-levels.ts` | EDIT | Přepsat na body-based úrovně (TIPAR/JUNIOR/SENIOR/EXPERT) |
| 4 | `lib/commission-calculator.ts` | EDIT | Broker share % dle úrovně (30-65%) místo fixních 50% |
| 5 | `app/api/vehicles/[id]/handover/route.ts` | EDIT | Předat level do commission calc + přidat body po prodeji |
| 6 | `components/pwa/gamification/LevelBadge.tsx` | EDIT | Nové úrovně + barvy |
| 7 | `components/ui/LevelProgressBar.tsx` | EDIT | totalSales → totalPoints, prodeje → body |
| 8 | `lib/role-labels.ts` | EDIT | Nové LEVEL_LABELS |
| 9 | `app/(pwa)/makler/dashboard/page.tsx` | EDIT | Přidat totalPoints, zobrazit body |
| 10 | `app/(pwa)/makler/stats/page.tsx` | EDIT | Body-based progress + historie bodů |
| 11 | `lib/gamification.ts` | EDIT | calculateLevel volat s totalPoints |
| 12 | `__tests__/lib/gamification.test.ts` | EDIT | Přepsat testy na body |

---

## MIGRACE STÁVAJÍCÍCH DAT

Existující makléři mají `level` hodnoty JUNIOR/BROKER/SENIOR/TOP. Migrace:

```sql
-- Mapování starých úrovní na nové
UPDATE "User" SET level = 'TIPAR' WHERE level = 'JUNIOR';
-- BROKER → JUNIOR (oba jsou "střední" tier)
UPDATE "User" SET level = 'JUNIOR' WHERE level = 'BROKER';
-- SENIOR zůstává SENIOR
-- TOP → EXPERT
UPDATE "User" SET level = 'EXPERT' WHERE level = 'TOP';

-- Iniciální body z existujících Commission záznamů
-- (jednorázový script — spustit po migraci)
-- Pro každý Commission záznam: body = commission / 1000
```

**IMPLEMENTÁTOR:** Vytvořit jednorázový skript `prisma/migrate-points.ts` který:
1. Projde všechny Commission záznamy
2. Vytvoří BrokerPointTransaction pro každý
3. Přepočítá totalPoints na User
4. Aktualizuje level dle nových pravidel

---

## ACCEPTANCE CRITERIA

- [ ] Nový Prisma model `BrokerPointTransaction` existuje a je migrovaný
- [ ] User má pole `totalPoints` (Float, default 0)
- [ ] User.level default je "TIPAR" (ne "JUNIOR")
- [ ] Při prodeji auta se vytvoří BrokerPointTransaction s type "CAR_SALE"
- [ ] Body za auto = provize firmy / 1000
- [ ] Provize makléře závisí na úrovni: Tipař 30%, Junior 40%, Senior 55%, Expert 65%
- [ ] LevelBadge zobrazuje nové úrovně (Tipař, Junior, Senior, Expert)
- [ ] LevelProgressBar ukazuje body (ne prodeje) a % k další úrovni
- [ ] Dashboard ukazuje aktuální body
- [ ] Stats stránka ukazuje historii bodů
- [ ] LEVEL_LABELS aktualizované
- [ ] Při dosažení nové úrovně přijde notifikace
- [ ] Existující Commission záznamy mají migrované body (jednorázový skript)
- [ ] Testy aktualizované a procházejí
- [ ] TypeScript build OK

## STOP PRAVIDLA

- **STOP-1:** Pokud `BrokerPointTransaction` model koliduje s existujícím modelem → přejmenovat
- **STOP-2:** Pokud `totalPoints` Float na User model způsobí problémy (Prisma + PostgreSQL) → použít `Decimal` nebo `Int` (body × 10)
- **STOP-3:** Pokud import `broker-points.ts` do `commission-calculator.ts` vytvoří circular dependency → refaktorovat (přesunout CAREER_LEVELS do sdíleného souboru)
- **STOP-4:** Pokud `TIPAR` název koliduje s existující logikou nebo enum → zkontrolovat všechny výskyty
- **STOP-5:** Pokud handover route test selže kvůli novému parametru `calculateCommission` → upravit default parameter

## POZNÁMKY PRO IMPLEMENTÁTORA

1. **Circular dependency risk:** `commission-calculator.ts` bude importovat z `broker-points.ts`. Ověřit že `broker-points.ts` neimportuje z `commission-calculator.ts`. Pokud ano → extrahovat `CAREER_LEVELS` do separátního `lib/career-levels.ts` (client-safe, žádné prisma).

2. **Body za úvěr/pojištění:** `addBrokerPoints` podporuje typy LOAN a INSURANCE, ale zatím neexistuje API endpoint který je volá. To je follow-up task — bodový systém je PŘIPRAVENÝ, ale tyto zdroje bodů se přidají až budou příslušné business flows implementované.

3. **Seed data:** Aktualizovat `prisma/seed.ts` — změnit `level: "BROKER"` → `level: "JUNIOR"`, přidat `totalPoints` k seed uživatelům.

4. **calculateCommission zpětná kompatibilita:** Nový podpis je `calculateCommission(soldPrice, level?, isTip?)`. Default `level = "TIPAR"` → nižší broker share (30% vs starých 50%). Ověřit že nikde jinde se nevolá bez parametru (Grep: `calculateCommission(`).

## ODHAD

- **Složitost:** Střední-vysoká (12 souborů, nový model, migrace dat, breaking changes v commission calc)
- **Risk:** Střední — breaking change v provizním výpočtu ovlivní ekonomiku platformy. Commission calculator MUSÍ dostat správný level.
