# Plan: Donor Car Flow — Implementační plán (bez TecDoc API)

**Datum:** 2026-04-26
**Status:** PLAN READY
**Zdroj:** `plan-tecdoc-integration.md` (CAST 4-8, kompletní donor car flow)
**Kontext:** TecDoc API klíče zatím nemáme → implementace s mock daty + prepared interface pro budoucí TecDoc napojení

---

## Strategie: Mock-first, TecDoc-ready

TecDoc registrace (219 EUR/rok) čeká na uživatele (task #21). Implementace proto:

1. **lib/tecdoc.ts** — interface + mock implementace (hardcoded data pro 5 populárních aut)
2. **lib/damage-zones.ts** — kompletní logika (nezávisí na TecDoc)
3. **Prisma modely** — DonorVehicle + Part rozšíření (kompletní)
4. **8-step wizard** — plně funkční UI s mock daty
5. **API routes** — kompletní CRUD

Po získání TecDoc API klíčů → jen vyměnit mock za reálné API volání v `lib/tecdoc.ts`.

---

## CAST 1: Prisma změny

### 1.1 Nový model: DonorVehicle

**Edit:** `prisma/schema.prisma`

```prisma
model DonorVehicle {
  id           String @id @default(cuid())
  supplierId   String
  supplier     User   @relation("SupplierDonorVehicles", fields: [supplierId], references: [id])

  vin          String
  kTypeId      Int?          // TecDoc KType ID (null dokud nemáme TecDoc)
  brand        String
  model        String
  year         Int?
  variant      String?       // "Combi 2.0 TDI 150 PS"
  engine       String?       // "DFGA"
  fuel         String?       // "Diesel", "Benzin", "Elektro"
  transmission String?       // "DSG7", "Manual 6"

  // Likvidace
  disposalType String        // ACCIDENT, MECHANICAL, COMPLETE, FLOOD, FIRE
  damageZones  Json?         // { "front": "destroyed", "rear": "ok", "left": "light", ... }

  // Fotky celého auta
  photos       Json?         // ["url1", "url2", ...]

  // Statistiky
  totalParts     Int @default(0)
  publishedParts Int @default(0)
  totalValue     Int @default(0)

  // Status
  status       String @default("DRAFT")  // DRAFT, PUBLISHED, ARCHIVED

  // Relace
  parts        Part[]

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([supplierId])
  @@index([vin])
  @@index([kTypeId])
  @@index([status])
}
```

### 1.2 Rozšíření Part modelu

**Edit:** `prisma/schema.prisma` — přidat do modelu Part:

```prisma
model Part {
  // ... existující pole ...

  // TecDoc (NOVÉ — připraveno pro budoucí integraci)
  tecdocKTypeId       Int?      // KType donor vozidla
  tecdocArticleId     Int?      // TecDoc article ID
  tecdocProductGroup  String?   // TecDoc product group name
  tecdocLinkageIds    String?   // JSON array kompatibilních KType IDs

  // Donor car (NOVÉ)
  donorVehicleId      String?
  donorVehicle        DonorVehicle? @relation(fields: [donorVehicleId], references: [id])
  partGrade           String?   // A, B, C (stav dílu z donor flow)

  @@index([tecdocKTypeId])
  @@index([tecdocArticleId])
  @@index([donorVehicleId])
}
```

### 1.3 User model — přidat relaci

**Edit:** `prisma/schema.prisma` — přidat do modelu User:

```prisma
model User {
  // ... existující relace ...
  donorVehicles  DonorVehicle[] @relation("SupplierDonorVehicles")
}
```

### 1.4 Migrace

```bash
npx prisma migrate dev --name add-donor-vehicle-and-tecdoc-fields
```

**Pozn:** Existující Part záznamy dostanou null pro nová pole — žádný breaking change.

---

## CAST 2: lib/tecdoc.ts — Mock TecDoc service

**Nový soubor:** `lib/tecdoc.ts`

### Interface (stabilní — nebude se měnit)

```typescript
export interface KTypeResult {
  kTypeId: number;
  brand: string;
  model: string;
  year: number | null;
  variant: string | null;
  engine: string | null;
  fuel: string | null;
  transmission: string | null;
}

export interface TecdocProductGroup {
  id: number;
  name: string;        // "Motor a příslušenství"
  parentId: number | null;
}

export interface TecdocArticle {
  articleId: number;
  name: string;        // "Turbodmychadlo"
  productGroup: string;
  oemNumbers: string[];
  genericArticleId: number;
}

// Public API
export async function vinToKType(vin: string): Promise<KTypeResult | null>
export async function getProductGroupsForKType(kTypeId: number): Promise<TecdocProductGroup[]>
export async function getPartsForKType(kTypeId: number): Promise<TecdocArticle[]>
```

### Mock implementace

5 populárních aut s hardcoded daty:

| VIN prefix | Auto | KType (mock) |
|------------|------|-------------|
| TMBAG | Škoda Octavia III 2.0 TDI | 48078 |
| WVWZZ | VW Golf VII 1.4 TSI | 45123 |
| WBAPH | BMW 320d F30 | 42567 |
| WAUZZ | Audi A4 B9 2.0 TDI | 50234 |
| WDD20 | Mercedes C220d W205 | 47890 |

Pro každé auto: 40-60 dílů seskupených do 8 kategorií (motor, převodovka, karoserie přední, karoserie zadní, podvozek, elektro, interiér, ostatní).

Fallback pro neznámý VIN: vrátí `null` → UI nabídne manuální zadání.

**Klíčové:** Mock vrací STEJNÝ formát jako budoucí TecDoc API → výměna za reálné API = jen změna implementace, ne interface.

---

## CAST 3: lib/damage-zones.ts — Damage zone logika

**Nový soubor:** `lib/damage-zones.ts`

### 8 zón

```typescript
export const DAMAGE_ZONES = [
  "FRONT",          // Přední část (nárazník, světla, kapota, chladič, blatníky)
  "REAR",           // Zadní část (nárazník, světla, víko kufru, blatníky)
  "LEFT",           // Levý bok (dveře, práh, zrcátko)
  "RIGHT",          // Pravý bok (dveře, práh, zrcátko)
  "ROOF",           // Střecha (sloupky A/B/C, panorama)
  "UNDERBODY",      // Podvozek (nápravy, výfuk, nádrž, ramena)
  "ENGINE_BAY",     // Motorový prostor (motor, převodovka, turbo, alternátor)
  "INTERIOR",       // Interiér (sedačky, palubovka, airbagy, volant)
] as const;

export type DamageZone = typeof DAMAGE_ZONES[number];
```

### 4 stupně poškození

```typescript
export const DAMAGE_LEVELS = {
  OK: "ok",              // ✅ Nepoškozeno
  LIGHT: "light",        // ⚠️ Lehké (kosmetické)
  HEAVY: "heavy",        // 🔶 Těžké (strukturální)
  DESTROYED: "destroyed" // ❌ Zničeno
} as const;

export type DamageLevel = typeof DAMAGE_LEVELS[keyof typeof DAMAGE_LEVELS];
```

### Mapování zón → TecDoc product groups

```typescript
export const ZONE_TO_GROUPS: Record<DamageZone, string[]> = {
  FRONT: ["Přední nárazník", "Přední světla", "Kapota", "Chladič", "Přední blatníky", "Mlhovky", "Maska"],
  REAR: ["Zadní nárazník", "Zadní světla", "Víko kufru", "Zadní blatníky"],
  LEFT: ["Levé přední dveře", "Levé zadní dveře", "Levý práh", "Levé zrcátko"],
  RIGHT: ["Pravé přední dveře", "Pravé zadní dveře", "Pravý práh", "Pravé zrcátko"],
  ROOF: ["Střecha", "Sloupek A", "Sloupek B", "Sloupek C", "Panoramatické okno"],
  UNDERBODY: ["Přední náprava", "Zadní náprava", "Výfuk", "Palivová nádrž", "Ramena", "Silentbloky"],
  ENGINE_BAY: ["Motor komplet", "Převodovka", "Turbodmychadlo", "Alternátor", "Startér", "AC kompresor", "Řízení"],
  INTERIOR: ["Sedačky přední", "Sedačky zadní", "Palubovka", "Airbagy", "Volant", "Řídící jednotky", "Kabeláž"],
};
```

### Filtrační logika

```typescript
export function filterPartsByDamage(
  parts: TecdocArticle[],
  damageZones: Record<DamageZone, DamageLevel>
): {
  available: TecdocArticle[];     // ✅ + ⚠️ zones → normálně
  warning: TecdocArticle[];       // 🔶 zones → s varováním
  excluded: TecdocArticle[];      // ❌ zones → vyřazené
}
```

### Speciální logika

```typescript
export function getAutoPresets(disposalType: string): Partial<Record<DamageZone, DamageLevel>> {
  // Zatopené → automaticky: INTERIOR=heavy, ENGINE_BAY=heavy (elektro!), UNDERBODY=light
  // Nehoda → airbagy automaticky nepouzitelne (bezpecnostni pravidlo)
  // Kompletní rozebírání → všechny zóny OK, přeskočit damage selector
}
```

---

## CAST 4: 8-step Donor Car Wizard

### Přepsání existujícího wizardu

**Edit:** `app/(pwa-parts)/parts/new/page.tsx`

Aktuálně: 3-step wizard (Foto → Detaily → Cena) pro JEDNOTLIVÝ díl.

**Nový flow:** 2 režimy:
1. **Donor car flow** (8 kroků) — pro bouráky/rozebíraná auta
2. **Single part** (3 kroky) — stávající flow pro jednotlivé díly

Přidat výběr na začátku:

```
+--------------------------------------------------+
| Co chcete přidat?                                 |
+--------------------------------------------------+
|                                                    |
| ┌──────────────────┐  ┌──────────────────┐        |
| │  🚗               │  │  🔧               │       |
| │  Celé auto        │  │  Jednotlivý díl  │       |
| │  (donor car)      │  │  (již mám díl)   │       |
| │                    │  │                    │      |
| │  VIN → 20-30 dílů │  │  1 díl + fotky   │      |
| │  najednou          │  │                    │      |
| └──────────────────┘  └──────────────────┘        |
+--------------------------------------------------+
```

### Nová page struktura

**Edit:** `app/(pwa-parts)/parts/new/page.tsx` — přidat mode state:

```tsx
type Mode = "choose" | "single" | "donor";
type DonorStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// mode === "choose" → ModeSelector
// mode === "single" → stávající 3-step flow
// mode === "donor" → nový 8-step DonorCarWizard
```

### Step komponenty (8 nových souborů)

#### Krok 1: `DonorVehicleStep.tsx` — VIN zdrojového vozu

**Nový soubor:** `components/pwa-parts/parts/DonorVehicleStep.tsx`

```
+--------------------------------------------------+
| Přidat donor auto                     Krok 1 / 8 |
+--------------------------------------------------+
|                                                    |
| VIN kód:                                           |
| [TMBAG7NE2L0_______]  [Načíst]                   |
|                                                    |
| Tip: VIN najdete v technickém průkazu              |
| nebo na štítku u předních dveří                    |
|                                                    |
| ── Rozpoznáno: ──────────────────────             |
| Škoda Octavia III Combi 2.0 TDI 150 PS (2019)    |
| Motor: DFGA, Převod: DSG7, Palivo: Diesel         |
|                                                    |
| [Ano, souhlasí]  [Zadat jiný VIN]                 |
|                                                    |
| ── nebo ──────────────────────────                |
| [Zadat ručně (bez VIN)]                            |
+--------------------------------------------------+
```

**Logika:**
1. Input VIN (17 znaků, validace formátu)
2. Volá `POST /api/tecdoc/vin-to-ktype` → mock/TecDoc
3. Zobrazí rozpoznané auto → potvrzení
4. Fallback: manuální zadání (brand/model/year selecty) — reuse `CompatibilitySelector` logiku

**Props:**
```typescript
interface DonorVehicleStepProps {
  vehicleData: VehicleData | null;
  onVehicleConfirmed: (data: VehicleData) => void;
  onBack: () => void;   // zpět na mode selector
}

interface VehicleData {
  vin: string;
  kTypeId: number | null;
  brand: string;
  model: string;
  year: number | null;
  variant: string | null;
  engine: string | null;
  fuel: string | null;
  transmission: string | null;
}
```

#### Krok 2: `DisposalTypeStep.tsx` — Důvod likvidace

**Nový soubor:** `components/pwa-parts/parts/DisposalTypeStep.tsx`

```
+--------------------------------------------------+
| Proč se auto rozebírá?               Krok 2 / 8 |
+--------------------------------------------------+
|                                                    |
| ( ) 💥 Nehoda (bourané auto)                      |
| ( ) 🔧 Nepojízdné (mechanická závada)            |
| ( ) ✅ Kompletní rozebírání (auto OK)             |
| ( ) 🌊 Zatopené (povodeň)                         |
| ( ) 🔥 Požár                                      |
|                                                    |
|                          [Pokračovat →]            |
+--------------------------------------------------+
```

**Logika:**
- Radio button group
- COMPLETE → přeskočí krok 3 (damage zones) → rovnou krok 4
- FLOOD/FIRE → krok 3 s preset damage zones
- ACCIDENT → krok 3, airbagy auto-flagované

#### Krok 3: `DamageZoneSelector.tsx` — Vizuální schéma poškození

**Nový soubor:** `components/pwa-parts/parts/DamageZoneSelector.tsx`

Nejsložitější komponenta. Vizuální schéma auta (SVG pohled shora) s klikatelnými zónami.

**Implementace:**
- SVG obrys auta (pohled shora) — jednoduchý, ne fotorealistický
- 8 klikatelných oblastí, každá s dropdown pro stupeň poškození
- Barvy: zelená (OK), žlutá (lehké), oranžová (těžké), červená (zničeno)
- Pod SVG: 3 "další zóny" (motorový prostor, podvozek, interiér) jako samostatné řádky s dropdown
- Automatické presety pro FLOOD/FIRE (viz `damage-zones.ts`)

**Props:**
```typescript
interface DamageZoneSelectorProps {
  disposalType: string;
  damageZones: Record<DamageZone, DamageLevel>;
  onChange: (zones: Record<DamageZone, DamageLevel>) => void;
  onNext: () => void;
  onBack: () => void;
}
```

**SVG přístup:**
- Inline SVG (ne external image) → klikatelné `<path>` elementy
- Každá zóna = `<g>` element s click handler
- Fill color dle damage level
- Tooltip/popover na hover s názvem zóny + aktuálním stavem

**Složitost:** STŘEDNÍ-VELKÁ (SVG interakce, ale logika je v `damage-zones.ts`)

#### Krok 4: `PartsFilterStep.tsx` — Automatický filtr + výběr dílů

**Nový soubor:** `components/pwa-parts/parts/PartsFilterStep.tsx`

Na základě damage zones systém předfiltruje mock TecDoc parts list:

```
+--------------------------------------------------+
| Dostupné díly (38 z 67)              Krok 4 / 8 |
+--------------------------------------------------+
|                                                    |
| MOTOR A PŘÍSLUŠENSTVÍ                  [✓ Vše]    |
| ☑ Motor komplet (2.0 TDI DFGA)   [A ▾] [📝]     |
| ☑ Turbodmychadlo                  [B ▾] [📝]     |
| ☐ Alternátor                                      |
| ☑ Startér                         [A ▾] [📝]     |
|                                                    |
| KAROSERIE                              [✓ Vše]    |
| ☑ Zadní nárazník                  [A ▾]           |
| ☑ Víko kufru                     [A ▾]           |
|                                                    |
| ⚠️ DÍLY S VAROVÁNÍM (těžce poškozená zóna)       |
| ☐ Kapota 🔶 "Zkontrolujte stav!"                 |
|                                                    |
| ❌ VYŘAZENÉ DÍLY (přední náraz)      [Zobrazit]   |
| ☐ Přední nárazník (❌ zničená zóna)               |
|                                                    |
| Vybráno: 18 dílů                                   |
|                          [Pokračovat →]            |
+--------------------------------------------------+
```

**Pro každý díl:**

| Pole | Typ | Povinné |
|------|-----|---------|
| ☑ Checkbox (mám/nemám) | Boolean | ANO |
| Stav (grade) | Select: A/B/C | ANO (pokud zaškrtnuto) |
| Poznámka | Text input (ikona 📝) | NE |

**Stavy A/B/C:**
- **A** — Jako nový (bez známek opotřebení, plně funkční)
- **B** — Použitý OK (běžné opotřebení, plně funkční)
- **C** — Opotřebený (funkční ale s vadou/opotřebením)

**Quick actions:**
- "Vybrat vše v kategorii"
- "Odznačit celou kategorii"
- "Nastavit stav pro celou kategorii" (např. vše B)

**Logika:**
1. Volá `getPartsForKType(kTypeId)` → mock seznam dílů
2. Aplikuje `filterPartsByDamage()` z `damage-zones.ts`
3. Zobrazí 3 sekce: dostupné, s varováním, vyřazené
4. Vyřazené → skryté (expandovatelné), vrakoviště může ručně vrátit

#### Krok 5: `DonorPhotosStep.tsx` — Fotky celého auta

**Nový soubor:** `components/pwa-parts/parts/DonorPhotosStep.tsx`

```
+--------------------------------------------------+
| Fotky donor auta                      Krok 5 / 8 |
+--------------------------------------------------+
|                                                    |
| POVINNÉ (celkový stav vozu):                      |
| [+ Předek] [+ Zadek] [+ Levý bok] [+ Pravý bok] |
|                                                    |
| POŠKOZENÍ (doporučené):                            |
| [+ Foto poškození]  [+ Další foto]               |
|                                                    |
| Pozn: Fotky jednotlivých dílů můžete přidat       |
| v dalším kroku při nastavení cen.                 |
|                                                    |
|                          [Pokračovat →]            |
+--------------------------------------------------+
```

- 4 povinné sloty (předek, zadek, L bok, P bok)
- Nepovinné: fotky poškození (libovolný počet)
- Upload přes existující `/api/upload` endpoint
- Reuse logiku z `PhotoStep.tsx` (existující komponenta)
- Offline: uložit do IndexedDB, sync later (PWA)

#### Krok 6: `BulkPricingStep.tsx` — Ceny per díl

**Nový soubor:** `components/pwa-parts/parts/BulkPricingStep.tsx`

```
+--------------------------------------------------+
| Nastavte ceny (18 dílů)              Krok 6 / 8 |
+--------------------------------------------------+
|                                                    |
| Motor komplet (A)                                  |
| Doporučená cena: 35 000 Kč    [35000] Kč         |
| [ ] Cena dohodou                                   |
| [+ Foto dílu]                                      |
|                                                    |
| Turbodmychadlo (B)                                 |
| Doporučená cena: 8 500 Kč     [8500] Kč          |
| [ ] Cena dohodou                                   |
|                                                    |
| [Hromadně nastavit] — všem +20% / -20%            |
|                                                    |
|                          [Pokračovat →]            |
+--------------------------------------------------+
```

**Pro každý vybraný díl:**
- Název + stav (A/B/C)
- Cena: number input (Kč)
- Checkbox "Cena dohodou" (= price = 0, zobrazí se "Dohodou" v eshopu)
- Optional: fotka dílu (per-part upload)

**Doporučená cena (mock):**
- Hardcoded cenové rozsahy per kategorie + grade v mock datech
- Budoucnost: Vincario Market Value API + vlastní historické prodeje

**Hromadné akce:**
- "Vše +20%", "Vše -20%", "Zaokrouhlit na stovky"

#### Krok 7: `DonorSummaryStep.tsx` — Souhrn + publikace

**Nový soubor:** `components/pwa-parts/parts/DonorSummaryStep.tsx`

```
+--------------------------------------------------+
| Souhrn                                Krok 7 / 8 |
+--------------------------------------------------+
|                                                    |
| Auto: Škoda Octavia III 2.0 TDI (2019)           |
| VIN:  TMBAG7NE2L0123456                           |
| Typ:  Nehoda (přední náraz)                        |
|                                                    |
| Díly k publikaci: 18                               |
| Celková hodnota skladu: 127 500 Kč               |
|                                                    |
| MOTOR: 4 díly (85 000 Kč)                        |
| KAROSERIE: 6 dílů (22 000 Kč)                     |
| INTERIÉR: 3 díly (9 500 Kč)                      |
| PODVOZEK: 5 dílů (11 000 Kč)                     |
|                                                    |
| [Zpět k úpravě]  [Publikovat 18 dílů do eshopu]  |
+--------------------------------------------------+
```

**Po kliknutí "Publikovat":**
1. POST `/api/donor-vehicles` — vytvoří DonorVehicle + bulk Part.createMany()
2. Redirect na stránku donor auta (`/parts/donors/[id]`)
3. Success toast: "18 dílů publikováno do eshopu!"

#### Krok 8: Success + notifikace

Redirect na `/parts/donors/[id]` s přehledem:
- Donor auto info
- Seznam publikovaných dílů s linky
- "Zákazníci co hledali tyto díly dostanou notifikaci" (future: StockNotification trigger)

### Wizard wrapper

**Edit:** `components/pwa-parts/parts/AddPartWizard.tsx`

Přidat podporu pro 8 kroků (donor mode):

```typescript
const DONOR_STEPS = [
  { number: 1, label: "VIN" },
  { number: 2, label: "Typ" },
  { number: 3, label: "Poškození" },
  { number: 4, label: "Díly" },
  { number: 5, label: "Fotky" },
  { number: 6, label: "Ceny" },
  { number: 7, label: "Souhrn" },
  { number: 8, label: "Hotovo" },
];

// Props: mode: "single" | "donor", currentStep: number
```

---

## CAST 5: API routes

### 5.1 VIN → KType API

**Nový soubor:** `app/api/tecdoc/vin-to-ktype/route.ts`

```typescript
// POST /api/tecdoc/vin-to-ktype
// Body: { vin: string }
// Auth: PARTS_SUPPLIER, ADMIN, BACKOFFICE
// Response: { vehicle: KTypeResult | null }

import { vinToKType } from "@/lib/tecdoc";

// Validace VIN formátu (17 chars, alfanumeric bez I/O/Q)
// Volá vinToKType() — mock nebo TecDoc
```

### 5.2 Parts for vehicle API

**Nový soubor:** `app/api/tecdoc/parts-for-vehicle/route.ts`

```typescript
// POST /api/tecdoc/parts-for-vehicle
// Body: { kTypeId: number } nebo { brand: string, model: string, year?: number }
// Auth: PARTS_SUPPLIER, ADMIN, BACKOFFICE
// Response: { parts: TecdocArticle[], groups: TecdocProductGroup[] }

import { getPartsForKType } from "@/lib/tecdoc";
```

### 5.3 Donor vehicles CRUD

**Nový soubor:** `app/api/donor-vehicles/route.ts`

```typescript
// POST /api/donor-vehicles — vytvoří DonorVehicle + bulk Parts
// Auth: PARTS_SUPPLIER, ADMIN, BACKOFFICE
// Body: {
//   vehicle: { vin, brand, model, year, ... },
//   disposalType: string,
//   damageZones: Record<string, string>,
//   photos: string[],
//   parts: Array<{
//     name: string,
//     category: string,
//     grade: "A" | "B" | "C",
//     price: number,
//     priceByAgreement: boolean,
//     note?: string,
//     photo?: string,
//     tecdocArticleId?: number,
//     tecdocProductGroup?: string,
//   }>
// }
//
// Logika:
// 1. Validace (Zod schema)
// 2. $transaction:
//    a. DonorVehicle.create(...)
//    b. Pro každý part: Part.create({ ...partData, donorVehicleId, supplierId, status: "ACTIVE", slug: slugify(...) })
//    c. Pro každý part s fotkou: PartImage.create(...)
//    d. DonorVehicle.update({ totalParts, publishedParts, totalValue })
// 3. Return { donorVehicle, partsCreated: count }

// GET /api/donor-vehicles — list mých donor aut
// Auth: PARTS_SUPPLIER (vlastní), ADMIN (vše)
// Query: ?page=1&limit=12&status=PUBLISHED
// Response: { donors: DonorVehicle[], total, page, totalPages }
```

**Nový soubor:** `app/api/donor-vehicles/[id]/route.ts`

```typescript
// GET /api/donor-vehicles/[id] — detail + parts
// PUT /api/donor-vehicles/[id] — update (přidat díly, změnit status)
// DELETE /api/donor-vehicles/[id] — archivovat (soft delete → status: "ARCHIVED")
```

### 5.4 Zod validace

**Nový soubor:** `lib/validators/donor-vehicle.ts`

```typescript
export const createDonorVehicleSchema = z.object({
  vehicle: z.object({
    vin: z.string().min(1).max(17),
    kTypeId: z.number().int().optional().nullable(),
    brand: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int().min(1900).max(2100).optional().nullable(),
    variant: z.string().optional().nullable(),
    engine: z.string().optional().nullable(),
    fuel: z.string().optional().nullable(),
    transmission: z.string().optional().nullable(),
  }),
  disposalType: z.enum(["ACCIDENT", "MECHANICAL", "COMPLETE", "FLOOD", "FIRE"]),
  damageZones: z.record(z.string(), z.enum(["ok", "light", "heavy", "destroyed"])).optional(),
  photos: z.array(z.string()).optional(),
  parts: z.array(z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    grade: z.enum(["A", "B", "C"]),
    price: z.number().int().min(0),
    priceByAgreement: z.boolean().default(false),
    note: z.string().optional(),
    photo: z.string().optional(),
    tecdocArticleId: z.number().int().optional(),
    tecdocProductGroup: z.string().optional(),
  })).min(1, "Musíte vybrat alespoň 1 díl"),
});
```

---

## CAST 6: PWA stránky

### 6.1 Donor vehicle detail

**Nový soubor:** `app/(pwa-parts)/parts/donors/[id]/page.tsx`

Přehled donor auta:
- Info o vozu (brand, model, year, VIN, disposal type)
- Damage zones vizualizace (read-only)
- Seznam dílů s cenami a stavy
- Editace cen inline
- Přidání dalšího dílu (tlačítko → single part flow s předvyplněným donorVehicleId)

### 6.2 Donor vehicles list

**Nový soubor:** `app/(pwa-parts)/parts/donors/page.tsx`

Seznam donor aut:
- Karty s: brand/model/year, VIN, počet dílů, celková hodnota, status
- Filtry: status (DRAFT, PUBLISHED, ARCHIVED)
- Link na detail

### 6.3 Mode selector

**Nový soubor:** `components/pwa-parts/parts/ModeSelector.tsx`

Výběr mezi "Celé auto" a "Jednotlivý díl" na `/parts/new`.

---

## CAST 7: Edge cases

### 7.1 VIN se nenačte
→ Fallback na manuální výběr: brand dropdown (12 značek z CompatibilitySelector) + model + year. Ignorovat kTypeId (null).

### 7.2 TecDoc nezná díl
→ Tlačítko "+ Vlastní díl" v PartsFilterStep. Manuální zadání: název, kategorie (select), kompatibilita. Žádný tecdocArticleId.

### 7.3 Stejný díl z více bouráků
→ Při publikaci: check `Part.findFirst({ where: { supplierId, name, category, status: "ACTIVE" } })`. Pokud existuje → nabídnout "Navýšit sklad o X ks" místo vytvoření nového záznamu.

### 7.4 Dealer chce vrátit díl z "zničené" zóny
→ V sekci "Vyřazené díly" tlačítko "Vrátit". Klik → checkbox ON, grade povinný. Note automaticky: "Vráceno z vyřazených — zkontrolujte stav."

### 7.5 Offline mode (PWA)
→ Wizard data ukládat do IndexedDB po každém kroku. Při ztrátě spojení → "Uloženo offline, publikujeme po obnovení spojení." Background sync přes Service Worker.

### 7.6 Auto bez poškození (kompletní rozebírání)
→ disposalType = "COMPLETE" → přeskočit krok 3 (damageZones), všechny díly dostupné bez varování.

---

## CAST 8: Souhrn všech souborů

### Nové soubory (16)

| Soubor | Účel | Složitost |
|--------|------|-----------|
| `lib/tecdoc.ts` | TecDoc service (mock + interface) | STŘEDNÍ |
| `lib/damage-zones.ts` | Damage zone logika + mapování | MALÁ |
| `lib/validators/donor-vehicle.ts` | Zod schema pro donor flow | MALÁ |
| `components/pwa-parts/parts/ModeSelector.tsx` | Výběr: celé auto vs. díl | TRIVIÁLNÍ |
| `components/pwa-parts/parts/DonorVehicleStep.tsx` | Krok 1: VIN input | STŘEDNÍ |
| `components/pwa-parts/parts/DisposalTypeStep.tsx` | Krok 2: Důvod likvidace | TRIVIÁLNÍ |
| `components/pwa-parts/parts/DamageZoneSelector.tsx` | Krok 3: SVG schema + zóny | VELKÁ |
| `components/pwa-parts/parts/PartsFilterStep.tsx` | Krok 4: Výběr dílů + grade | STŘEDNÍ |
| `components/pwa-parts/parts/DonorPhotosStep.tsx` | Krok 5: Fotky celého auta | MALÁ |
| `components/pwa-parts/parts/BulkPricingStep.tsx` | Krok 6: Ceny per díl | STŘEDNÍ |
| `components/pwa-parts/parts/DonorSummaryStep.tsx` | Krok 7: Souhrn + publish | MALÁ |
| `app/api/tecdoc/vin-to-ktype/route.ts` | API: VIN → KType (mock) | MALÁ |
| `app/api/tecdoc/parts-for-vehicle/route.ts` | API: KType → díly (mock) | MALÁ |
| `app/api/donor-vehicles/route.ts` | API: CRUD donor vehicles | STŘEDNÍ |
| `app/api/donor-vehicles/[id]/route.ts` | API: detail/update/delete | MALÁ |
| `app/(pwa-parts)/parts/donors/page.tsx` | PWA: seznam donor aut | MALÁ |
| `app/(pwa-parts)/parts/donors/[id]/page.tsx` | PWA: detail donor auta | STŘEDNÍ |

### Edity (4)

| Soubor | Změna | Složitost |
|--------|-------|-----------|
| `prisma/schema.prisma` | +DonorVehicle model, +Part TecDoc/donor pole, +User relace | MALÁ |
| `app/(pwa-parts)/parts/new/page.tsx` | Přidat mode selector + donor flow routing | STŘEDNÍ |
| `components/pwa-parts/parts/AddPartWizard.tsx` | Podpora 8 kroků (donor mode) | MALÁ |
| `prisma/schema.prisma` | (migrace) | — |

**Celkem: 16 nových souborů, 4 edity, 1 Prisma migrace.**

---

## CAST 9: Implementační fáze

### Fáze 1 — Základ (hlavní priority)

1. Prisma migrace (DonorVehicle + Part pole)
2. `lib/tecdoc.ts` (mock implementace)
3. `lib/damage-zones.ts` (kompletní logika)
4. `lib/validators/donor-vehicle.ts`
5. ModeSelector + DonorVehicleStep (VIN → rozpoznání auta)
6. DisposalTypeStep

### Fáze 2 — Core wizard

7. DamageZoneSelector (SVG + interakce)
8. PartsFilterStep (výběr dílů + grades)
9. DonorPhotosStep
10. BulkPricingStep

### Fáze 3 — Publikace + PWA stránky

11. DonorSummaryStep + publish flow
12. API routes (tecdoc/*, donor-vehicles/*)
13. Donor vehicles list + detail stránky v PWA
14. AddPartWizard 8-step podpora

### Fáze 4 — Polish

15. Offline IndexedDB persistence
16. Edge cases (duplicate detection, manual part add)
17. StockNotification trigger po publikaci

---

## CAST 10: Mock data — příklad

### Škoda Octavia III 2.0 TDI (kTypeId: 48078)

**67 dílů v 8 kategoriích:**

```typescript
const MOCK_OCTAVIA_PARTS = [
  // MOTOR A PŘÍSLUŠENSTVÍ
  { articleId: 1001, name: "Motor komplet 2.0 TDI DFGA", productGroup: "ENGINE_BAY", suggestedPrice: { A: 45000, B: 35000, C: 22000 } },
  { articleId: 1002, name: "Turbodmychadlo", productGroup: "ENGINE_BAY", suggestedPrice: { A: 12000, B: 8500, C: 5000 } },
  { articleId: 1003, name: "Alternátor", productGroup: "ENGINE_BAY", suggestedPrice: { A: 3500, B: 2500, C: 1500 } },
  { articleId: 1004, name: "Startér", productGroup: "ENGINE_BAY", suggestedPrice: { A: 3000, B: 2000, C: 1200 } },
  { articleId: 1005, name: "AC kompresor", productGroup: "ENGINE_BAY", suggestedPrice: { A: 5000, B: 3500, C: 2000 } },
  { articleId: 1006, name: "Posilovač řízení", productGroup: "ENGINE_BAY", suggestedPrice: { A: 4000, B: 2800, C: 1800 } },
  // ... 8-10 dílů per kategorie
  
  // PŘEVODOVKA A POHON
  { articleId: 1010, name: "Převodovka DSG7", productGroup: "ENGINE_BAY", suggestedPrice: { A: 35000, B: 25000, C: 15000 } },
  { articleId: 1011, name: "Poloos levá", productGroup: "UNDERBODY", suggestedPrice: { A: 3000, B: 2000, C: 1200 } },
  // ...
  
  // PŘEDNÍ KAROSERIE
  { articleId: 1020, name: "Přední nárazník", productGroup: "FRONT", suggestedPrice: { A: 4500, B: 3000, C: 1500 } },
  { articleId: 1021, name: "Levý přední světlomet (LED)", productGroup: "FRONT", suggestedPrice: { A: 8000, B: 5500, C: 3000 } },
  { articleId: 1022, name: "Pravý přední světlomet (LED)", productGroup: "FRONT", suggestedPrice: { A: 8000, B: 5500, C: 3000 } },
  { articleId: 1023, name: "Kapota", productGroup: "FRONT", suggestedPrice: { A: 5000, B: 3500, C: 2000 } },
  { articleId: 1024, name: "Přední maska / gril", productGroup: "FRONT", suggestedPrice: { A: 2500, B: 1800, C: 1000 } },
  { articleId: 1025, name: "Chladič", productGroup: "FRONT", suggestedPrice: { A: 3500, B: 2500, C: 1500 } },
  // ...
  
  // ZADNÍ KAROSERIE
  { articleId: 1030, name: "Zadní nárazník", productGroup: "REAR", suggestedPrice: { A: 3500, B: 2500, C: 1200 } },
  // ...
  
  // INTERIÉR
  { articleId: 1050, name: "Přední sedačky (pár)", productGroup: "INTERIOR", suggestedPrice: { A: 8000, B: 5000, C: 3000 } },
  { articleId: 1051, name: "Palubovka komplet", productGroup: "INTERIOR", suggestedPrice: { A: 6000, B: 4000, C: 2500 } },
  // ...
];
```

5 aut × ~60 dílů = ~300 záznamů v mock datech. Stačí pro demo.

---

## CAST 11: Propojení s existujícím eshopem

Díly vytvořené přes donor flow se ukládají jako standardní `Part` záznamy s:
- `status: "ACTIVE"` → okamžitě viditelné v eshopu `/dily`
- `donorVehicleId` → propojení na zdrojové auto
- `partGrade` → A/B/C
- `condition` → mapování: A → "USED_GOOD", B → "USED_FAIR", C → "USED_POOR"
- `partType` → "USED"

**Eshop kompatibilita:** Existující PartsSearch, filtry, řazení, košík — vše funguje bez změn. Díly z donor flow jsou standardní Part záznamy.

---

## Poznámky

1. **DamageZoneSelector SVG** je nejsložitější komponenta — zvážit zjednodušenou verzi pro MVP (jen dropdown selecty bez SVG, vizualizace přidat v2)
2. **Mock data** pokrývají 5 populárních aut — dostatečné pro demo i reálné použití prvních vrakovišť
3. **TecDoc upgrade** = výměna `lib/tecdoc.ts` implementace (mock → API calls), žádná změna UI
4. **Offline** (IndexedDB) je nice-to-have — můžeze odložit na post-MVP
5. **Part duplicate detection** — při publikaci check existující Part se stejným jménem + kategorie + supplierId → nabídka navýšení skladu
