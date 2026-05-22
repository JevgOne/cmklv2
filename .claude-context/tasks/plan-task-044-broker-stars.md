# TASK-044: Makléřský kariérní systém — hvězdičky, regionální prahy, výplaty

**Stav:** PLAN_READY
**Priorita:** 1
**Datum:** 2026-04-25
**Autor:** Plánovač

---

## §1 Souhrn

Nahradit stávající kariérní systém (Tipař/Junior/Senior/Expert s abstraktními body) za hvězdičkový systém (⭐–⭐⭐⭐⭐⭐) založený na celkovém kumulativním obratu prodejů v regionu. Provize makléře 30–60 % z celkové provize (5 % z ceny, min. 25 000 Kč). Bez TIP bonusu. Regionální prahy se liší dle velikosti trhu.

---

## §2 Analýza stávajícího stavu

### Co existuje a musí se přepsat:

| Soubor | Stávající stav | Co se mění |
|--------|---------------|------------|
| `lib/broker-points.ts` | 4 úrovně (TIPAR/JUNIOR/SENIOR/EXPERT), body z prodejů+úvěrů+pojištění, TIP_BONUS_RATE=5% | → 5 úrovní (STAR_1–5), obrat z prodejů v Kč, bez TIP, regionální prahy |
| `lib/gamification-levels.ts` | Client-safe LEVELS array (4 úrovně, bodové prahy), calculateLevel, calculateLevelProgress | → 5 úrovní, obratové prahy dle regionu, calculateStarLevel |
| `lib/commission-calculator.ts` | calculateCommission s 4 úrovněmi + TIP bonus + manažerský bonus 2500 Kč | → 5 úrovní (30/40/50/55/60%), bez TIP bonusu, manažerský bonus zůstává |
| `components/pwa/gamification/LevelBadge.tsx` | 4 levely s textovými názvy + SVG ikonami | → 5 levelů s hvězdičkami (⭐×N) |
| `components/ui/LevelProgressBar.tsx` | Progress bar body→další level | → Progress bar obrat→další hvězdička dle regionu |
| `lib/role-labels.ts` | LEVEL_LABELS: TIPAR/JUNIOR/SENIOR/EXPERT | → STAR_1–5 labels |
| `lib/gamification.ts` | Re-export + achievements (calculateLevel, totalSales update) | → Aktualizovat na nový systém |
| `lib/badges.ts` | checkAndAwardBadges (uses totalSales) | → Zachovat, ale level z nového systému |

### Soubory které REFERENCUJÍ starý systém (musí se aktualizovat):

| Soubor | Jak referencuje |
|--------|----------------|
| `app/api/vehicles/[id]/handover/route.ts` | `calculateCommission(soldPrice, brokerLevel)` + `addBrokerPoints(CAR_SALE)` |
| `app/(pwa)/makler/stats/page.tsx` | `LevelBadge`, `calculateLevelProgress`, `totalPoints`, bodové transakce |
| `app/(pwa)/makler/dashboard/page.tsx` | `level`, `totalPoints` z User |
| `components/web/BrokerBox.tsx` | `LevelProgressBar`, `LEVEL_LABELS` |
| `app/(web)/profil/[slug]/ProfileClient.tsx` | `LEVEL_LABELS`, `LevelProgressBar`, `totalPoints` |
| `components/pwa/gamification/LeaderboardTable.tsx` | `LevelBadge`, `formatPrice` |
| `app/(pwa)/makler/commissions/page.tsx` | Commission data (nepotřebuje změnu logiky) |
| `app/(pwa)/makler/provize/page.tsx` | BrokerPayout data (nepotřebuje změnu logiky) |
| `__tests__/lib/commission-calculator.test.ts` | Testy pro 4 úrovně + TIP bonus |
| `__tests__/lib/gamification.test.ts` | Testy pro 4 úrovně s body |

### DB modely (schema.prisma):

- **User.level** — `@default("TIPAR")` → změní se na `@default("STAR_1")`
- **User.totalPoints** — Float → bude `totalRevenue` (Int, celkový obrat v Kč)
- **User.totalSales** — Int → zachovat (zpětná kompatibilita pro badges)
- **User.regionId** — už existuje (nullable), propojený na `Region` model
- **BrokerPointTransaction** — přejmenovat/refaktorovat na obratové transakce
- **Region** — existuje (id, name, cities). Přidat `tier` string pro prahy
- **Commission** — existuje, zachovat strukturu

---

## §3 Nový datový model

### 3.1 Úrovně a provize

```typescript
// 5 úrovní = hvězdičky
export const STAR_LEVELS = [
  { key: "STAR_1", stars: 1, name: "⭐ Makléř",       commissionRate: 0.30 },
  { key: "STAR_2", stars: 2, name: "⭐⭐ Makléř",      commissionRate: 0.40 },
  { key: "STAR_3", stars: 3, name: "⭐⭐⭐ Makléř",     commissionRate: 0.50 },
  { key: "STAR_4", stars: 4, name: "⭐⭐⭐⭐ Makléř",    commissionRate: 0.55 },
  { key: "STAR_5", stars: 5, name: "⭐⭐⭐⭐⭐ Makléř",   commissionRate: 0.60 },
] as const;
```

### 3.2 Regionální prahy (celkový kumulativní obrat v Kč)

```typescript
export type RegionTier = "PRAHA" | "BRNO" | "OSTRAVA_PLZEN" | "SMALL";

export const REGION_THRESHOLDS: Record<RegionTier, Record<string, number>> = {
  PRAHA: {
    STAR_1: 0,
    STAR_2: 1_500_000,
    STAR_3: 2_500_000,
    STAR_4: 4_000_000,
    STAR_5: 6_000_000,
  },
  BRNO: {
    STAR_1: 0,
    STAR_2: 1_200_000,
    STAR_3: 2_000_000,
    STAR_4: 3_000_000,
    STAR_5: 4_500_000,
  },
  OSTRAVA_PLZEN: {
    STAR_1: 0,
    STAR_2: 1_000_000,
    STAR_3: 1_500_000,
    STAR_4: 2_500_000,
    STAR_5: 3_500_000,
  },
  SMALL: {
    STAR_1: 0,
    STAR_2: 750_000,
    STAR_3: 1_200_000,
    STAR_4: 2_000_000,
    STAR_5: 3_000_000,
  },
};
```

**Poznámka:** Zadání říká pro STAR_1 Praha = 1 000 000 Kč, ale to je **vstupní hranice** (obrat od kterého je makléř na 1. hvězdičce). Protože 1. hvězdička = vstupní úroveň (začíná se od 0), nastavíme STAR_1 = 0 a prahy ze zadání použijeme jako vstupní požadavek pro STAR_2+. Toto vyžaduje **potvrzení od leada** — alternativně lze interpretovat tak, že makléř pod 1 000 000 Kč v Praze nemá ani 1 hvězdičku (žádná úroveň). V tom případě přidáme úroveň STAR_0 (nováček, 0 %) nebo prahy posuneme.

**STOP-1: Interpretace prahů** — Lead musí potvrdit: je STAR_1 od 0 Kč (nováček hned dostane 30 %), nebo od 1 000 000 Kč v Praze? Pokud od 1M, pak makléř pod touto hranicí nemá žádnou provizi, což odporuje business modelu. Doporučení: STAR_1 od 0 Kč, prahy ze zadání = požadavek pro STAR_2+.

### 3.3 Prisma změny

#### Region — přidat `tier` field:

```prisma
model Region {
  id     String  @id @default(cuid())
  name   String  @unique
  cities String? // JSON array
  tier   String  @default("SMALL") // PRAHA, BRNO, OSTRAVA_PLZEN, SMALL
  users  User[]

  invitations Invitation[]
  leads       Lead[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### User — upravit fields:

```prisma
// Změnit:
level       String @default("STAR_1")  // STAR_1, STAR_2, STAR_3, STAR_4, STAR_5
totalPoints Float  @default(0)         // PŘEJMENOVAT na totalRevenue? Nebo zachovat název a změnit sémantiku.
```

**Rozhodnutí:** Přejmenovat `totalPoints` → `totalRevenue` je čistší, ale rozbije hodně referencí. Pragmatičtější varianta: **zachovat `totalPoints` jako field name** ale sémanticky = celkový obrat v Kč. Všechny references se stejně musí přepsat. Přejmenování přes `@map` je taky opce.

**Doporučení:** Přejmenovat na `totalRevenue` (Int, ne Float) — čistší. Stará data se migrují. `totalPoints` sloužil pro body, nový systém používá obrat v Kč.

```prisma
// V model User:
level         String @default("STAR_1")  // STAR_1..STAR_5
totalRevenue  Int    @default(0)         // Celkový kumulativní obrat prodejů v Kč
// totalPoints — ODSTRANIT (nebo zachovat jako deprecated @map)
```

#### BrokerPointTransaction — refaktor:

Stávající model `BrokerPointTransaction` ukládá bodové transakce. Nový systém sleduje obrat, ne body. Dvě varianty:

**Varianta A (doporučená):** Zachovat model ale změnit sémantiku:
- `points` → přejmenovat na `amount` (Int, obrat v Kč)
- `type` → zachovat (CAR_SALE zůstává, LOAN/INSURANCE/TIP_BONUS odebrat)
- Přidat `revenueAtTime` Int (kumulativní obrat po této transakci — pro audit)

**Varianta B:** Vytvořit nový model `BrokerRevenueTransaction` a starý zachovat pro historii.

**Doporučení: Varianta A** — méně práce, zachová historii.

```prisma
model BrokerPointTransaction {
  id       String @id @default(cuid())
  brokerId String
  broker   User   @relation("BrokerPoints", fields: [brokerId], references: [id])

  type     String // CAR_SALE, MANUAL_ADJUSTMENT (zjednodušeno — zrušit LOAN, INSURANCE, TIP_BONUS)
  amount   Int    // Obrat v Kč (dříve `points` Float)

  // Reference na zdroj
  vehicleId    String?
  commissionId String?
  description  String?

  // Audit
  revenueAtTime Int?  // Kumulativní obrat po této transakci

  createdAt DateTime @default(now())

  @@index([brokerId])
  @@index([type])
  @@index([createdAt])
}
```

**Migrace dat:** `amount = sourceAmount` (starý field), `points` se dropne.

---

## §4 Implementační kroky — pořadí

### Fáze 1: Core lib refaktor (3 soubory — základ)

| # | Krok | Soubor | Popis |
|---|------|--------|-------|
| 1 | Přepsat broker-points.ts | `lib/broker-points.ts` | Nový STAR_LEVELS, REGION_THRESHOLDS, calculateStarLevel(totalRevenue, regionTier), addBrokerRevenue(), calculateStarProgress() |
| 2 | Přepsat gamification-levels.ts | `lib/gamification-levels.ts` | Client-safe: STAR_LEVELS export, calculateStarLevel, calculateStarProgress (bez prisma importu) |
| 3 | Přepsat commission-calculator.ts | `lib/commission-calculator.ts` | Nový calculateCommission bez TIP bonusu, 5 úrovní (30/40/50/55/60%) |

**Detaily kroku 1 — `lib/broker-points.ts`:**

```typescript
// Nové exporty:
export type StarLevelKey = "STAR_1" | "STAR_2" | "STAR_3" | "STAR_4" | "STAR_5";
export type RegionTier = "PRAHA" | "BRNO" | "OSTRAVA_PLZEN" | "SMALL";

export const STAR_LEVELS = [...]; // viz §3.1
export const REGION_THRESHOLDS = {...}; // viz §3.2

// Nová funkce — level dle obratu + regionu
export function calculateStarLevel(totalRevenue: number, regionTier: RegionTier): StarLevel {
  const thresholds = REGION_THRESHOLDS[regionTier];
  for (let i = STAR_LEVELS.length - 1; i >= 0; i--) {
    if (totalRevenue >= thresholds[STAR_LEVELS[i].key]) {
      return STAR_LEVELS[i];
    }
  }
  return STAR_LEVELS[0];
}

// Nová funkce — progress k další hvězdičce
export function calculateStarProgress(totalRevenue: number, regionTier: RegionTier): StarProgress {
  const currentLevel = calculateStarLevel(totalRevenue, regionTier);
  const thresholds = REGION_THRESHOLDS[regionTier];
  const currentIdx = STAR_LEVELS.findIndex(l => l.key === currentLevel.key);
  const nextLevel = currentIdx < STAR_LEVELS.length - 1 ? STAR_LEVELS[currentIdx + 1] : null;
  
  if (!nextLevel) return { currentLevel, nextLevel: null, percentage: 100, ... };
  
  const currentThreshold = thresholds[currentLevel.key];
  const nextThreshold = thresholds[nextLevel.key];
  const range = nextThreshold - currentThreshold;
  const progress = totalRevenue - currentThreshold;
  const percentage = Math.min(100, Math.round((progress / range) * 100));
  const revenueNeeded = Math.max(0, nextThreshold - totalRevenue);
  
  return { currentLevel, nextLevel, percentage, totalRevenue, revenueNeeded };
}

// Nová funkce — přidat obrat po prodeji
export async function addBrokerRevenue(params: {
  brokerId: string;
  type: "CAR_SALE" | "MANUAL_ADJUSTMENT";
  amount: number; // obrat v Kč (= soldPrice)
  vehicleId?: string;
  commissionId?: string;
  description?: string;
}): Promise<{ newTotalRevenue: number; newLevel: StarLevelKey; levelChanged: boolean }> {
  // 1. Vytvořit BrokerPointTransaction (s novým amount field)
  // 2. Spočítat nový celkový obrat (SUM amount WHERE brokerId)
  // 3. Zjistit region tier makléře (User → Region → tier)
  // 4. Spočítat novou úroveň
  // 5. Update User.totalRevenue + User.level
  // 6. Vrátit výsledek
}
```

**Detaily kroku 3 — `lib/commission-calculator.ts`:**

```typescript
// ZMĚNY:
// - Odstranit TIP_BONUS_RATE import a isTip parametr
// - Změnit 4 úrovně na 5 (30/40/50/55/60%)
// - Zachovat MIN_COMMISSION = 25_000, COMMISSION_RATE = 0.05, MANAGER_BONUS = 2_500

export function calculateCommission(
  soldPrice: number,
  brokerLevel: StarLevelKey = "STAR_1"
  // BEZ isTip parametru
): CommissionBreakdown {
  const total = Math.max(soldPrice * COMMISSION_RATE, MIN_COMMISSION);
  const level = getStarLevelByKey(brokerLevel);
  const brokerRate = level.commissionRate; // bez TIP bonusu
  const brokerShare = total * brokerRate;
  const managerBonus = MANAGER_BONUS;
  const companyShare = total - brokerShare - managerBonus;
  return { total, brokerShare, companyShare, managerBonus, brokerRate };
}
```

### Fáze 2: Prisma schema + migrace

| # | Krok | Soubor | Popis |
|---|------|--------|-------|
| 4 | Přidat `tier` do Region | `prisma/schema.prisma` | `tier String @default("SMALL")` |
| 5 | Přejmenovat User.totalPoints → totalRevenue | `prisma/schema.prisma` | Typ Int, default 0 |
| 6 | Změnit User.level default | `prisma/schema.prisma` | `@default("STAR_1")` místo `@default("TIPAR")` |
| 7 | Refaktor BrokerPointTransaction | `prisma/schema.prisma` | `points Float` → `amount Int`, přidat `revenueAtTime Int?` |
| 8 | Vytvořit migraci | `npx prisma migrate dev --name star-career-system` | — |
| 9 | Data migrace script | `prisma/migrations/xxx/migration.sql` nebo seed | Konvertovat existující data: level TIPAR→STAR_1, JUNIOR→STAR_2, SENIOR→STAR_3, EXPERT→STAR_4. Nastavit region tier. |
| 10 | Seed — region tier | `prisma/seed.ts` | Praha→PRAHA, Jihomoravský→BRNO, Moravskoslezský→OSTRAVA_PLZEN |

**Data migrace (krok 9):**

```sql
-- Konverze level hodnot
UPDATE "User" SET level = 'STAR_1' WHERE level = 'TIPAR';
UPDATE "User" SET level = 'STAR_2' WHERE level = 'JUNIOR';
UPDATE "User" SET level = 'STAR_3' WHERE level = 'SENIOR';
UPDATE "User" SET level = 'STAR_4' WHERE level = 'EXPERT';

-- Nastavit region tier
UPDATE "Region" SET tier = 'PRAHA' WHERE name = 'Praha';
UPDATE "Region" SET tier = 'BRNO' WHERE name = 'Jihomoravský';
UPDATE "Region" SET tier = 'OSTRAVA_PLZEN' WHERE name = 'Moravskoslezský';

-- Přepočítat totalRevenue z Commission.salePrice
UPDATE "User" u SET "totalRevenue" = COALESCE((
  SELECT SUM(c."salePrice") FROM "Commission" c WHERE c."brokerId" = u.id
), 0) WHERE u.role = 'BROKER';

-- BrokerPointTransaction: amount = sourceAmount (konverze)
ALTER TABLE "BrokerPointTransaction" ADD COLUMN "amount" INTEGER DEFAULT 0;
UPDATE "BrokerPointTransaction" SET "amount" = COALESCE("sourceAmount", 0);
ALTER TABLE "BrokerPointTransaction" ADD COLUMN "revenueAtTime" INTEGER;
```

### Fáze 3: Komponenty UI

| # | Krok | Soubor | Popis |
|---|------|--------|-------|
| 11 | Přepsat LevelBadge | `components/pwa/gamification/LevelBadge.tsx` | 5 úrovní, hvězdičky (⭐×N) místo textových názvů, nové barvy |
| 12 | Přepsat LevelProgressBar | `components/ui/LevelProgressBar.tsx` | Přijímá `totalRevenue` + `regionTier` místo `totalPoints`, zobrazuje obrat + kolik chybí v Kč |
| 13 | Aktualizovat role-labels.ts | `lib/role-labels.ts` | LEVEL_LABELS: STAR_1→"⭐", STAR_2→"⭐⭐", atd. |

**Detaily kroku 11 — LevelBadge:**

```tsx
const LEVEL_CONFIG: Record<string, { name: string; stars: number; colors: string }> = {
  STAR_1: { name: "Makléř", stars: 1, colors: "bg-gray-100 text-gray-600 border-gray-300" },
  STAR_2: { name: "Makléř", stars: 2, colors: "bg-amber-100 text-amber-700 border-amber-300" },
  STAR_3: { name: "Makléř", stars: 3, colors: "bg-yellow-100 text-yellow-700 border-yellow-400" },
  STAR_4: { name: "Makléř", stars: 4, colors: "bg-orange-100 text-orange-700 border-orange-400" },
  STAR_5: { name: "Makléř", stars: 5, colors: "bg-gradient-to-br from-orange-100 to-red-100 text-orange-700 border-orange-500" },
};

// Render: "⭐⭐⭐ Makléř" (hvězdičky + text)
function StarIcons({ count, size }: { count: number; size: string }) {
  return <span>{Array(count).fill("⭐").join("")}</span>;
}
```

**Detaily kroku 12 — LevelProgressBar:**

```tsx
// NOVÝ interface:
export interface LevelProgressBarProps {
  level: string;
  totalRevenue: number;   // Celkový obrat v Kč (dříve totalPoints)
  regionTier: RegionTier; // NOVÝ parametr
  size?: "sm" | "md";
}

// Zobrazí:
// [========60%=======] 
// 1 500 000 Kč / 2 500 000 Kč do ⭐⭐⭐
// Chybí: 1 000 000 Kč
```

### Fáze 4: Aktualizace existujících stránek

| # | Krok | Soubor | Popis |
|---|------|--------|-------|
| 14 | Handover route | `app/api/vehicles/[id]/handover/route.ts` | `addBrokerRevenue` místo `addBrokerPoints`, `soldPrice` jako amount |
| 15 | PWA stats page | `app/(pwa)/makler/stats/page.tsx` | `totalRevenue` + regionTier, přepsat bodovou sekci na obratovou, hvězdičky místo levelů |
| 16 | PWA dashboard | `app/(pwa)/makler/dashboard/page.tsx` | `totalRevenue` místo `totalPoints`, region tier pro LevelProgressBar |
| 17 | BrokerBox | `components/web/BrokerBox.tsx` | `totalRevenue` + `regionTier` pro LevelProgressBar |
| 18 | ProfileClient | `app/(web)/profil/[slug]/ProfileClient.tsx` | `totalRevenue`, LEVEL_LABELS aktualizace |
| 19 | LeaderboardTable | `components/pwa/gamification/LeaderboardTable.tsx` | Nový LevelBadge (hvězdičky) |
| 20 | Gamification.ts | `lib/gamification.ts` | Re-exporty z nového systému, achievements update (level z nového systému) |
| 21 | Badges.ts | `lib/badges.ts` | Zachovat, level logika z nového systému |

**Detaily kroku 14 — handover route:**

```typescript
// PŘED:
const brokerLevel = (vehicle.broker?.level ?? "TIPAR") as CareerLevelKey;
const commissionBreakdown = calculateCommission(data.soldPrice, brokerLevel);
// ...
const points = calculateCarSalePoints(result.commissionBreakdown.total);
await addBrokerPoints({ type: "CAR_SALE", points, ... });

// PO:
const brokerLevel = (vehicle.broker?.level ?? "STAR_1") as StarLevelKey;
const commissionBreakdown = calculateCommission(data.soldPrice, brokerLevel);
// ...
// Obrat = prodejní cena (NE provize)
await addBrokerRevenue({
  brokerId: vehicle.brokerId,
  type: "CAR_SALE",
  amount: data.soldPrice, // celková cena vozu
  vehicleId: vehicle.id,
  commissionId: result.commission.id,
  description: `Prodej ${vehicle.brand} ${vehicle.model} za ${data.soldPrice} Kč`,
});
```

**Detaily kroku 15 — stats page:**

Hlavní změny:
- `totalPoints` → `totalRevenue` 
- `calculateLevelProgress(totalPoints)` → `calculateStarProgress(totalRevenue, regionTier)`
- Bodové transakce → obratové transakce (zobrazit Kč místo bodů)
- Query: přidat `region: { select: { tier: true } }` do User query
- Sekce "Úroveň" → zobrazit hvězdičky + regionální prahy
- **NOVÉ:** Přidat sekci "Prahy pro váš region" — tabulka s prahy + aktuální pozice

### Fáze 5: Admin panel — přehled výplat + vysvětlivky

| # | Krok | Soubor | Popis |
|---|------|--------|-------|
| 22 | Admin career overview page | `app/(admin)/admin/career/page.tsx` | Nová stránka |
| 23 | CareerOverviewContent | `components/admin/CareerOverviewContent.tsx` | Client component |
| 24 | API: broker career data | `app/api/admin/career/route.ts` | GET endpoint pro admin data |
| 25 | API: level override | `app/api/admin/career/[id]/level/route.ts` | PUT — snížení úrovně (ADMIN/MANAGER only) |
| 26 | Admin sidebar update | `components/admin/AdminSidebar.tsx` | Přidat "Kariéra" do sekce |

**Detaily kroku 22-23 — Admin career page:**

**Dvě sekce:**

**A) Vysvětlivky systému:**
- Tabulka všech regionů × všech prahů × provize %
- Pravidla (kumulativní, snížení jen ADMIN/MANAGER)

**B) Přehled makléřů:**
DataTable s columns:
| Jméno | Region | Celkový obrat | Úroveň (hvězdičky) | Provize % | Počet prodejů | Obrat tento měsíc | Provize k vyplacení | Akce |
|-------|--------|--------------|--------------------|-----------|--------------|--------------------|--------------------| ----- |
| Jan N. | Praha | 2 350 000 Kč | ⭐⭐⭐ | 50% | 12 | 450 000 Kč | 22 500 Kč | [Snížit úroveň] |

- Filtry: Region, Úroveň
- Export CSV
- Akce: Snížit úroveň (modal s důvodem, jen ADMIN/MANAGER)

**Detaily kroku 25 — level override API:**

```typescript
// PUT /api/admin/career/[id]/level
// Auth: ADMIN, MANAGER (NE REGIONAL_DIRECTOR)
// Body: { level: "STAR_2", reason: "..." }
// Validace: nová úroveň musí být NIŽŠÍ než aktuální
// Záznam do BrokerPointTransaction s type = "MANUAL_ADJUSTMENT", amount = 0
```

### Fáze 6: Testy

| # | Krok | Soubor | Popis |
|---|------|--------|-------|
| 27 | Přepsat commission testy | `__tests__/lib/commission-calculator.test.ts` | 5 úrovní, bez TIP, nové % |
| 28 | Přepsat gamification testy | `__tests__/lib/gamification.test.ts` | 5 úrovní, obratové prahy dle regionu |
| 29 | Nový test: broker-points | `__tests__/lib/broker-points.test.ts` | calculateStarLevel dle regionu, progress calculation |

---

## §5 Kompletní seznam souborů

### Přepisované soubory (core refaktor):
```
lib/broker-points.ts              # Kompletní přepis → hvězdičky + regionální prahy
lib/gamification-levels.ts        # Kompletní přepis → client-safe star levels
lib/commission-calculator.ts      # Přepis → 5 úrovní, bez TIP
lib/gamification.ts               # Aktualizace re-exportů + achievements
lib/badges.ts                     # Malá úprava — level z nového systému
lib/role-labels.ts                # LEVEL_LABELS → STAR_1–5
```

### Přepisované komponenty:
```
components/pwa/gamification/LevelBadge.tsx    # Hvězdičky místo textů
components/ui/LevelProgressBar.tsx            # Obrat + region místo bodů
```

### Aktualizované stránky:
```
app/api/vehicles/[id]/handover/route.ts       # addBrokerRevenue, nový level type
app/(pwa)/makler/stats/page.tsx               # totalRevenue, regionTier, hvězdičky
app/(pwa)/makler/dashboard/page.tsx           # totalRevenue, regionTier
components/web/BrokerBox.tsx                  # totalRevenue + regionTier props
app/(web)/profil/[slug]/ProfileClient.tsx     # LEVEL_LABELS, totalRevenue
components/pwa/gamification/LeaderboardTable.tsx  # Nový LevelBadge
```

### Nové soubory:
```
app/(admin)/admin/career/page.tsx             # Admin career overview
components/admin/CareerOverviewContent.tsx     # Admin career UI
app/api/admin/career/route.ts                 # GET brokers career data
app/api/admin/career/[id]/level/route.ts      # PUT level override
```

### Upravené soubory:
```
prisma/schema.prisma                          # Region.tier, User.level/totalRevenue, BrokerPointTransaction
prisma/seed.ts                                # Region tier values
components/admin/AdminSidebar.tsx             # Přidat "Kariéra" nav item
```

### Testy:
```
__tests__/lib/commission-calculator.test.ts   # Přepsat pro 5 úrovní
__tests__/lib/gamification.test.ts            # Přepsat pro hvězdičky + regiony
__tests__/lib/broker-points.test.ts           # Nový test
```

---

## §6 STOP pravidla

- **STOP-1:** Interpretace prahů — je STAR_1 od 0 Kč nebo od 1 000 000 Kč v Praze? Viz §3.2 poznámka. **Eskaluj na leada.**
- **STOP-2:** Prisma migrate selhání (tsvector drift) → `migrate reset --force` na dev.
- **STOP-3:** Přejmenování `totalPoints` → `totalRevenue` rozbije víc než 10 souborů → provést grep a opravit všechny reference.
- **STOP-4:** Pokud existují reálná data v `BrokerPointTransaction` (produkce) → migrační script musí být testovaný na dump DB.
- **STOP-5:** Snížení úrovně — REGIONAL_DIRECTOR NESMÍ mít tuto pravomoc (explicitně ze zadání). Middleware check.

---

## §7 Acceptance Criteria

1. ✅ 5 kariérních úrovní (⭐–⭐⭐⭐⭐⭐) s provizemi 30/40/50/55/60%
2. ✅ Úroveň se určuje dle celkového kumulativního obratu prodejů
3. ✅ Regionální prahy — Praha/Brno/Ostrava+Plzeň/menší města (konfigurovatelné přes Region.tier)
4. ✅ Jednou dosažená úroveň se neztrácí (kumulativní obrat neklesá)
5. ✅ Snížení úrovně může provést pouze ADMIN nebo MANAGER (NE REGIONAL_DIRECTOR)
6. ✅ Admin panel — tabulka regionů + prahů + provizí (vysvětlivky)
7. ✅ Admin panel — přehled makléřů s obratem, úrovní, provizí k vyplacení
8. ✅ PWA makléře — vidí svou úroveň (hvězdičky), % provize, prahy pro svůj region, progress
9. ✅ Bez TIP bonusu — max provize 60%
10. ✅ Manažerský bonus 2 500 Kč zachován
11. ✅ Testy aktualizovány pro nový systém
12. ✅ Stará data migrována (level konverze, obrat přepočítán)

---

## §8 Závislosti a rizika

| Riziko | Mitigace |
|--------|----------|
| Makléři bez regionu (regionId = null) | Default na SMALL tier. Warning v admin panelu. |
| Historická data — staré body nesedí s obratem | Přepočítat totalRevenue z Commission.salePrice SUM |
| Produkční migrace — downtime | Migrace je additive (přidáváme sloupce), ne destructive |
| Region model má jen 3 záznamy (Praha, Jihomoravský, Moravskoslezský) | Přidat Plzeňský region do seedu, nebo mapovat existující na tier OSTRAVA_PLZEN |
| TIP bonus odstraněn — zpětná kompatibilita API | Handover route `isTip` parametr odebrat, starý kód nebude breaknout (default false) |

---

## §9 Odhad rozsahu

- **Přepsané soubory:** 8 (core lib + komponenty)
- **Aktualizované soubory:** 8 (stránky + admin sidebar + seed + schema)
- **Nové soubory:** 5 (admin career page + API + test)
- **Celkem dotčených souborů:** ~21
- **Prisma migrace:** 1 (+ data migration SQL)
