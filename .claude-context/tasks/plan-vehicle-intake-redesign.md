# Implementační plán — Redesign Vehicle Intake Flow (PWA)

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Zdroj:** Task #21 — Team Lead požadavek + doplnění (defect photos)  
**Status:** ČEKÁ NA SCHVÁLENÍ LEADEM

---

## Executive Summary

Kompletní UX redesign 7-krokového nabírání vozidel v PWA makléře. Hlavní změny:
- **VIN jako první krok** (auto-fill max dat z decode)
- **Level-based nápovědy** (STAR_1/2 vidí tipy, STAR_3+ ne)
- **Vylepšený fotoprůvodce** (popisky na diagramu, lepší layout, fotky KAŽDÉHO kola zvlášť)
- **Rozšířená dokumentace defektů** (pozice na diagramu + foto + popis + závažnost — ne jen checkbox)
- **Detailnější inspekce** (tloušťka laku, stav brzd, hloubka dezénu, podvozek)
- **Modernější app-like design** (animace, progress cards, sticky header)

---

## 1. Analýza aktuálního stavu

### Aktuální flow (7 kroků)

| # | Krok | Soubor | Problém |
|---|------|--------|---------|
| 1 | **Kontakt** | `ContactStep.tsx` (327 ř.) | Obsahuje "preliminary car info" — makléř ručně zadává značku/model/rok, které VIN decode zjistí automaticky |
| 2 | **Prohlídka** | `InspectionStep.tsx` (632 ř.) | Prohlídka PŘED VIN — makléř nemá decoded data, nemůže kontrolovat shodu. Defekty jen checkbox "Vady laku" — bez fotek a lokace |
| 3 | **VIN** | `VinStep.tsx` (496 ř.) | VIN je až 3. krok — pozdě pro auto-fill |
| 4 | **Fotky** | `PhotosStep.tsx` (541 ř.) | Diagram má čísla bez popisků. 4-sloupcový grid je malý. Kola jen 2 sloty (přední P + zadní P), chybí levá strana |
| 5 | **Údaje** | `DetailsStep.tsx` (783 ř.) | Pre-fill z VIN funguje, ale zbytečná duplicita s prelim daty z kroku 1 |
| 6 | **Cena** | `PricingStep.tsx` (532 ř.) | DUPLICITNÍ popis vozidla (textarea) — je i v DetailsStep |
| 7 | **Kontrola** | `ReviewStep.tsx` (477 ř.) | OK |

### Aktuální stav defektů a fotek kol

**Defekty v InspectionStep (aktuálně):**
- `DefectCapture` komponenta existuje — umožňuje přidat defekt s popisem, závažností a volitelnou fotkou
- ALE: **žádná lokalizace na diagramu** — makléř jen popíše defekt textem
- Defekty jsou jen v inspekci, NE v foto sekci

**Fotky kol (aktuálně):**
- Jen 2 sloty: `ext_wheel_front` (pravé přední) a `ext_wheel_rear` (pravé zadní) — oba NEPOVINNÉ
- Chybí: levé přední, levé zadní — celkem chybí 2 ze 4 kol
- Žádná dedikovaná fotka brzdových destiček/kotoučů

### Quick flow (3 kroky, pro STAR_2+)

| # | Krok | Soubor | Přístup |
|---|------|--------|---------|
| 1 | VIN + Kontakt | `QuickStep1.tsx` (466 ř.) | VIN PRVNÍ + kontakt — **správný vzor** |
| 2 | Fotky (5 povinných) | `QuickStep2.tsx` (434 ř.) | Minimum fotek |
| 3 | Detaily + cena | `QuickStep3.tsx` | Vše v jednom |

### Existující infrastruktura

- **VIN decode API:** `GET /api/vin/decode?vin=XXX` → VinDecoderResult (brand, model, variant, year, fuelType, transmission, enginePower, engineCapacity, bodyType, drivetrain, color, doors, seats, equipment[])
- **Duplicate check:** `GET /api/vin/check-duplicate?vin=XXX` → { exists, vehicle }
- **VIN camera scan:** `VinScanModal.tsx` (Tesseract.js OCR, offline-capable)
- **Feature gates:** `lib/feature-gates.ts` — STAR_1 through STAR_5, `canAccess(level, feature)`
- **Photo system:** PhotoGuide (camera overlay), PhotoPositionDiagram (SVG top-down), offlineStorage (IndexedDB)
- **DefectCapture:** `components/pwa/vehicles/new/DefectCapture.tsx` — existující komponenta pro fotky defektů
- **AI description:** `POST /api/assistant/generate-description` — accepts equipment[] + highlights[]
- **AI price estimate:** `POST /api/assistant/price-estimate` — exists
- **Draft system:** IndexedDB via useDraftContext, auto-save with 1s debounce

---

## 2. Navrhovaný nový flow

### Nové pořadí kroků

```
STARÝ FLOW:                          NOVÝ FLOW:
1. Kontakt                           1. VIN (PRVNÍ!)
2. Prohlídka                         2. Kontakt (zjednodušený)
3. VIN                               3. Prohlídka (rozšířená + defect map)
4. Fotky                             4. Fotky (4 kola, diagram labels, defekty)
5. Údaje                             5. Údaje (pre-filled z VIN)
6. Cena                              6. Cena + popis (sloučeno)
7. Kontrola                          7. Kontrola
```

### Důvody přeuspořádání

1. **VIN první** — decode auto-vyplní 12+ polí. Quick flow už tento vzor používá.
2. **Kontakt druhý** — makléř je u auta, zapíše prodejce. Odstraněna sekce "prelim car info".
3. **Prohlídka třetí** — makléř zná auto z VIN, rozšířená o tloušťku laku, brzdy, dezén, podvozek + **defect map**.
4. **Fotky čtvrté** — **4 kola zvlášť**, diagram s popisky, **dedikovaná defect photo sekce s lokalizací**.
5. **Údaje páté** — pre-filled z VIN (zamčené), doplnění mileage, condition, equipment.
6. **Cena šestá** — sjednocený popis (odstraněna duplicita).
7. **Kontrola** — beze změny logiky.

---

## 3. Detailní specifikace změn

### KROK 1: Nový VinStep — PRVNÍ krok (~60 řádků změn)

**Soubor:** `components/pwa/vehicles/new/VinStep.tsx`

**Změny oproti stávajícímu:**
1. Změnit `step={3}` → `step={1}` v StepLayout
2. Přidat **level-based hint** "Kde najdete VIN?" — zobrazit pouze pro STAR_1/STAR_2
3. Navigace: `handleNext` → `/makler/vehicles/new/contact?draft=...` (místo `/photos`)
4. Po úspěšném decode: zobrazit **summary card** s auto-filled daty + badge "Tato data se předvyplní automaticky"
5. Pokud VIN decode selže (offline/error): zobrazit info "Data budete muset vyplnit ručně v kroku 5"

**Level-based hint příklad:**
```typescript
import { useFeatureAccess } from "@/lib/hooks/useFeatureAccess";
const { showHints } = useFeatureAccess();

{showHints && (
  <HintCard title="Kde najdete VIN?">
    <ol>
      <li>Dveřní sloupek řidiče — štítek na rámu dveří</li>
      <li>Palubní deska — přes čelní sklo vlevo dole</li>
      <li>Technický průkaz — pole E</li>
    </ol>
  </HintCard>
)}
```

### KROK 2: Zjednodušený ContactStep (~40 řádků změn)

**Soubor:** `components/pwa/vehicles/new/ContactStep.tsx`

**Změny:**
1. Změnit `step={1}` → `step={2}`
2. **ODSTRANIT** sekci "Předběžné info o autě" (řádky 162-214) — brand/model/year/mileage/price nyní z VIN
3. Navigace: `handleNext` → `/makler/vehicles/new/inspection?draft=...`
4. Back → `/makler/vehicles/new/vin?draft=...`
5. Přidat hint pro STAR_1/2: "Kontakt prodejce je interní — kupující ho neuvidí"

### KROK 3: Rozšířený InspectionStep (~150 řádků přidáno)

**Soubor:** `components/pwa/vehicles/new/InspectionStep.tsx`

**Změny:**
1. Změnit `step={2}` → `step={3}`
2. Navigace: handleNext → `/makler/vehicles/new/photos?draft=...`

#### A) Exteriér — nové položky:

```typescript
// Přidat do InspectionData.exterior:
paintThickness: "" | "ORIGINAL" | "REPAINTED_PARTIAL" | "REPAINTED_FULL";
brakeDiscCondition: "" | "GOOD" | "WORN" | "REPLACE";
tireDepthFrontLeft: number | undefined;   // mm
tireDepthFrontRight: number | undefined;  // mm
tireDepthRearLeft: number | undefined;    // mm
tireDepthRearRight: number | undefined;   // mm
```

**UI pro tloušťku laku:**
```
┌─────────────────────────────────────────┐
│  Stav laku                              │
│  [Originál] [Částečně přelak.] [Celý]  │
│                                         │
│  {showHints && "Tip: Originální lak     │
│   má rovnoměrnou tloušťku ~100-150µm.   │
│   Přelakované panely mají vyšší µm."}   │
└─────────────────────────────────────────┘
```

**UI pro hloubku dezénu — 4 kola zvlášť:**
```
┌─────────────────────────────────────────┐
│  Hloubka dezénu (mm)                    │
│  ┌─────────┐  ┌─────────┐              │
│  │ LP [__] │  │ PP [__] │              │
│  └─────────┘  └─────────┘              │
│  ┌─────────┐  ┌─────────┐              │
│  │ LZ [__] │  │ PZ [__] │              │
│  └─────────┘  └─────────┘              │
│                                         │
│  {showHints && (                        │
│    8mm = nové | 4mm = OK                │
│    3mm = brzy měnit | 1.6mm = zákonný   │
│    limit                                │
│  )}                                     │
└─────────────────────────────────────────┘
```

**UI pro brzdy:**
```
┌─────────────────────────────────────────┐
│  Stav brzdových kotoučů                 │
│  [V pořádku] [Opotřebené] [K výměně]   │
│                                         │
│  {showHints && "Tip: Zkontrolujte       │
│   tloušťku kotoučů a stav destiček.     │
│   Hrana na obvodu = opotřebení."}       │
└─────────────────────────────────────────┘
```

#### B) Interiér — nové:
```typescript
infotainmentWorking: boolean;  // navigace, dotykový displej
trunkCondition: "" | "CLEAN" | "WORN" | "DAMAGED";
```

#### C) Motor — nové:
```typescript
oilLevel: "" | "OK" | "LOW" | "OVERFILL";
coolantLevel: "" | "OK" | "LOW";
batteryCondition: "" | "GOOD" | "WEAK" | "DEAD";
```

#### D) Nová sekce: Podvozek
```typescript
undercarriage: {
  rustLevel: "" | "NONE" | "LIGHT" | "MODERATE" | "SEVERE";
  oilLeaksVisible: boolean;
  exhaustCondition: "" | "GOOD" | "DAMAGED" | "MISSING_PARTS";
}
```

#### E) NOVÉ: Defect Map — vizuální lokalizace poškození

**Redesign DefectCapture:** Stávající `DefectCapture` umožňuje jen text + foto + severity. Nový design přidá **lokalizaci na diagramu auta**.

```
┌─────────────────────────────────────────┐
│  ZÁVADY A POŠKOZENÍ                     │
│                                         │
│  ┌─────────── Diagram auta ──────────┐  │
│  │      ┌──────────────┐             │  │
│  │      │   [auto]     │  ← tapni   │  │
│  │      │   top-down   │    kam je   │  │
│  │      │   view       │    závada   │  │
│  │      └──────────────┘             │  │
│  │  [1]●  [2]●  [3]●  ← body defek.│  │
│  └───────────────────────────────────┘  │
│                                         │
│  Defekt #1:                             │
│  ┌───────┐ Levé zadní blatník           │
│  │ foto  │ Škrábanec 15cm               │
│  │ thumb │ Závažnost: [Lehká]           │
│  └───────┘                              │
│                                         │
│  [+ Přidat závadu]                      │
└─────────────────────────────────────────┘
```

**Implementace DefectMap:**

Vytvořit novou komponentu `DefectMap.tsx`:
```typescript
interface DefectMapProps {
  defects: DefectRecord[];
  onAddDefect: (position: { x: number; y: number; zone: string }) => void;
  onRemoveDefect: (id: string) => void;
}
```

Makléř tapne na diagram → otevře se modal:
1. Vybraná zóna (přední, zadní, levý bok, pravý bok, střecha, kapota, kufr)
2. Popis závady (text)
3. Závažnost: MINOR | MODERATE | MAJOR | CRITICAL
4. Fotka závady (PhotoGuide overlay)

**Rozšíření DefectRecord typu:**
```typescript
export interface DefectRecord {
  id: string;
  imageId?: string;
  thumbnailUrl?: string;
  description: string;
  severity: DefectSeverity;
  // NOVÉ:
  zone: DefectZone;       // kde na autě
  positionX?: number;     // přesná pozice na diagramu (0-100)
  positionY?: number;     // přesná pozice na diagramu (0-100)
}

export type DefectZone =
  | "FRONT_BUMPER" | "REAR_BUMPER" 
  | "LEFT_FRONT_FENDER" | "LEFT_REAR_FENDER"
  | "RIGHT_FRONT_FENDER" | "RIGHT_REAR_FENDER"
  | "LEFT_DOOR_FRONT" | "LEFT_DOOR_REAR"
  | "RIGHT_DOOR_FRONT" | "RIGHT_DOOR_REAR"
  | "HOOD" | "TRUNK" | "ROOF"
  | "WINDSHIELD" | "REAR_WINDOW"
  | "LEFT_MIRROR" | "RIGHT_MIRROR"
  | "WHEEL_FL" | "WHEEL_FR" | "WHEEL_RL" | "WHEEL_RR"
  | "OTHER";
```

### KROK 4: Vylepšený PhotosStep (~120 řádků změn)

**Soubor:** `components/pwa/vehicles/new/PhotosStep.tsx`  
**Soubor:** `components/pwa/vehicles/new/PhotoPositionDiagram.tsx`

#### A) Fotky kol — 4 kola zvlášť (NOVÉ)

**Aktuální stav:** 2 sloty (ext_wheel_front, ext_wheel_rear) — jen pravá strana

**Nový stav:** 4 povinné sloty + 4 volitelné sloty pro brzdové kotouče:

```typescript
// Nahradit v PHOTO_CATEGORIES, sekce "exterior":
// ODSTRANIT: ext_wheel_front, ext_wheel_rear
// PŘIDAT:

// Nová kategorie "Kola a pneumatiky":
{
  id: "wheels",
  label: "Kola a pneumatiky",
  slots: [
    { id: "wheel_fl", label: "Přední levé kolo", tip: "Celé kolo včetně disku a pneumatiky. Zachyťte DOT číslo.", required: true },
    { id: "wheel_fr", label: "Přední pravé kolo", tip: "Celé kolo. Viditelný stav disku a dezénu.", required: true },
    { id: "wheel_rl", label: "Zadní levé kolo", tip: "Celé kolo včetně disku a pneumatiky.", required: true },
    { id: "wheel_rr", label: "Zadní pravé kolo", tip: "Celé kolo. Zachyťte stav dezénu.", required: true },
    { id: "brake_front", label: "Přední brzdy", tip: "Detail brzdového kotouče a destičky za kolem. Natočte volant pro lepší přístup.", required: false },
    { id: "brake_rear", label: "Zadní brzdy", tip: "Detail zadního brzdového kotouče. Pokud má bubnové brzdy, foťte buben.", required: false },
  ],
}
```

**Nový diagram pro kola — WheelDiagram komponenta:**
```
┌─────────────────────────────────────────┐
│   Kola a pneumatiky                     │
│                                         │
│   ┌──[FL]──────────[FR]──┐              │
│   │        [auto]        │              │
│   │        top-down      │              │
│   └──[RL]──────────[RR]──┘              │
│                                         │
│   FL = přední levé  FR = přední pravé   │
│   RL = zadní levé   RR = zadní pravé    │
│                                         │
│   ● zelená = vyfoceno                   │
│   ○ šedá = chybí                        │
└─────────────────────────────────────────┘
```

#### B) PhotoPositionDiagram — popisky

**Problém:** Čísla 1-13 na diagramu bez popisů — makléř musí hádat.

**Řešení 1 (tooltip):** Při tapnutí na bod zobrazit label tooltip:
```typescript
const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

// V SVG <g> pro každou pozici:
onClick={() => {
  setActiveTooltip(pos.slotId === activeTooltip ? null : pos.slotId);
  onSlotClick?.(pos.slotId);
}}

// Tooltip SVG element:
{activeTooltip === pos.slotId && (
  <foreignObject x={pos.x - 20} y={pos.y - 14} width="40" height="10">
    <div className="bg-gray-900 text-white text-[8px] px-1 py-0.5 rounded text-center whitespace-nowrap">
      {pos.label}
    </div>
  </foreignObject>
)}
```

**Řešení 2 (mini-legenda pod diagramem, pro STAR_1/2):**
```typescript
{showHints && (
  <div className="grid grid-cols-2 gap-1 mt-3 text-[10px] text-gray-500">
    {POSITIONS.map(p => (
      <span key={p.slotId} className="flex items-center gap-1">
        <span className={`w-3 h-3 rounded-full text-[7px] text-center leading-3 font-bold 
          ${completed.includes(p.slotId) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
          {p.number}
        </span>
        {p.label}
      </span>
    ))}
  </div>
)}
```

#### C) Foto grid — 3 sloupce místo 4

```diff
- <div className="grid grid-cols-4 gap-2">
+ <div className="grid grid-cols-3 gap-3">
```

#### D) Dedikovaná sekce "Defekty a poškození" s fotografiemi

**Aktuální stav:** Sekce "Defekty" v PhotosStep má jen "+" button pro přidání libovolné defektní fotky.

**Nový design:** Defekty z InspectionStep (krok 3) se zobrazí jako seznam s možností přidat/doplnit fotku:

```
┌─────────────────────────────────────────┐
│  DEFEKTY A POŠKOZENÍ                    │
│                                         │
│  {defects z inspekce, pokud existují}   │
│  ┌───────────────────────────────────┐  │
│  │ #1 Škrábanec — Levé zadní blatník│  │
│  │ Závažnost: Lehká                  │  │
│  │ [Foto: ✓] [Přefotit]             │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ #2 Promáčklina — Přední nárazník │  │
│  │ Závažnost: Střední                │  │
│  │ [Foto: ✗ CHYBÍ] [Vyfotit]        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [+ Přidat další defekt s fotkou]       │
│                                         │
│  {showHints && "Tip: Každou závadu      │
│   foťte zblízka i v kontextu celého     │
│   panelu. BackOffice potřebuje vidět    │
│   rozsah a přesnou lokaci."}            │
└─────────────────────────────────────────┘
```

#### E) Auto-sequence pro STAR_1

Po pořízení fotky automaticky otevřít PhotoGuide pro další prázdný slot:
```typescript
if (showHints && nextEmptySlot) {
  setTimeout(() => {
    setActiveGuide({ slot: nextEmptySlot, category, slotIndex: nextIndex });
  }, 500);
}
```

#### F) PhotoGuide — rozšířené tipy

**Soubor:** `components/pwa/vehicles/new/PhotoGuide.tsx`

Pro STAR_1 makléře zobrazit rozšířený tip pod kamerovým preview:
```typescript
// V overlay:
{showHints && (
  <div className="text-white/60 text-xs text-center mt-1 max-w-[250px] mx-auto">
    {extendedTip}
  </div>
)}
```

### KROK 5: DetailsStep — pre-fill cleanup (~30 řádků změn)

**Soubor:** `components/pwa/vehicles/new/DetailsStep.tsx`

1. Beze změny step čísla (step=5)
2. Přidat level-based hints pro equipment
3. Auto-generate description — **už existuje** — OK

### KROK 6: PricingStep — sjednocení popisu (~40 řádků odstraněno)

**Soubor:** `components/pwa/vehicles/new/PricingStep.tsx`

1. **ODSTRANIT** sekci "Popis inzerátu" (řádky 424-470) — duplicita s DetailsStep
2. **ODSTRANIT** `handleGenerateDescription` (řádky 148-187) — přesunut do DetailsStep
3. Ponechat: cena, DPH, AI price estimate, provize, lokace, zdroj vozu
4. Hint pro STAR_1/2: "Provize 5% z prodejní ceny, min. 25 000 Kč"

### KROK 7: ReviewStep — beze změny logiky

Aktualizovat checklist pořadí + přidat check na defektní fotky (pokud defekt nalezen → musí mít fotku).

---

## 4. Level-Based Hint System — implementace

### Nový hook: `useFeatureAccess`

**Vytvořit:** `lib/hooks/useFeatureAccess.ts`

```typescript
"use client";

import { useSession } from "next-auth/react";
import { canAccess } from "@/lib/feature-gates";

export function useFeatureAccess() {
  const { data: session } = useSession();
  const level = session?.user?.starLevel ?? "STAR_1";
  
  return {
    level,
    showHints: level === "STAR_1" || level === "STAR_2",
    showAdvancedHints: level === "STAR_1",
    canQuickMode: canAccess(level, "QUICK_VEHICLE_MODE"),
    canAI: canAccess(level, "AI_ASSISTANT"),
  };
}
```

### Nová komponenta: `HintCard`

**Vytvořit:** `components/pwa/vehicles/new/HintCard.tsx`

```typescript
"use client";

import { useState } from "react";

interface HintCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: "tip" | "warning" | "info";
}

export function HintCard({ title, children, defaultOpen = false, variant = "tip" }: HintCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const colors = {
    tip: "bg-blue-50 border-blue-200 text-blue-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    info: "bg-gray-50 border-gray-200 text-gray-600",
  };

  return (
    <div className={`rounded-xl border p-3 ${colors[variant]}`}>
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left">
        <span className="text-sm font-medium">{title}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {open && <div className="mt-2 text-sm">{children}</div>}
    </div>
  );
}
```

### Hint placements

| Krok | Hint | Level | Typ |
|------|------|-------|-----|
| VIN | "Kde najdete VIN?" + 3 lokace | STAR_1/2 | Collapsible |
| VIN | "VIN nemá písmena I, O, Q" | STAR_1 | Inline |
| Contact | "Kontakt prodejce je interní" | STAR_1/2 | Inline |
| Inspection | "Jak kontrolovat lak" | STAR_1 | Collapsible |
| Inspection | Hloubka dezénu guide (8mm=nové, 1.6mm=limit) | STAR_1/2 | Inline |
| Inspection | "Zkontrolujte brzdy a kotouče" | STAR_1 | Collapsible |
| Inspection | "Foťte každou závadu — BackOffice potřebuje" | STAR_1/2 | Warning |
| Photos | Diagram legenda (číslo→název) | STAR_1/2 | Always visible |
| Photos | Auto-sequence (auto-open next slot) | STAR_1 | Behavior |
| Photos | "Fotky kol — zachyťte DOT, disk, dezén" | STAR_1 | Collapsible |
| Details | "Výbava zvyšující hodnotu" | STAR_1 | Collapsible |
| Pricing | "Provize 5%, min. 25 000 Kč" | STAR_1/2 | Inline |

---

## 5. Modernější app-like design

### A) Page transition animace

**Soubor:** `components/pwa/vehicles/new/StepLayout.tsx`

```typescript
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence mode="wait">
  <motion.div
    key={step}
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### B) Step indicator s ikonami

```
  ①──②──③──④──⑤──⑥──⑦
 VIN Kont Proh Foto Úda Cena Rev

● oranžová = aktuální (pulse)
● zelená + ✓ = dokončený
○ šedá = budoucí
```

### C) Sticky header s kontextem vozidla

```
┌──────────────────────────────────────┐
│ ← Krok 3/7: Prohlídka          ✕    │
│    Škoda Octavia III 2019            │  ← z VIN decode
│ ════════════════░░░░░░░░░░░░░░░      │
└──────────────────────────────────────┘
```

### D) Accordion sections

Dlouhé stránky (Inspection, Details) → collapsible sekce s progress badge:
```
▸ Exteriér (3/6 ✓)
▾ Interiér (0/6)
  [rozbalený obsah]
▸ Motor (2/6 ✓)
```

---

## 6. Implementační kroky (6 fází)

### Fáze 1: Přeuspořádání kroků + navigace

| # | Úkol | Soubor | Změna |
|---|------|--------|-------|
| 1.1 | VinStep → step 1 | `VinStep.tsx` | `step={1}`, navigace na `/contact` |
| 1.2 | ContactStep → step 2 | `ContactStep.tsx` | `step={2}`, odstranit prelim car info |
| 1.3 | InspectionStep → step 3 | `InspectionStep.tsx` | `step={3}` |
| 1.4 | PhotosStep → step 4 | `PhotosStep.tsx` | `step={4}` |
| 1.5 | DetailsStep → step 5 | `DetailsStep.tsx` | `step={5}` |
| 1.6 | PricingStep → step 6 | `PricingStep.tsx` | `step={6}`, odstranit duplicitní popis |
| 1.7 | ReviewStep → step 7 | `ReviewStep.tsx` | `step={7}` |
| 1.8 | Step pages navigace | 7× page.tsx | URL redirecty |
| 1.9 | StepLayout labels | `StepLayout.tsx` | Nové step labels |

### Fáze 2: Level-based hint system

| # | Úkol | Soubor | Typ |
|---|------|--------|-----|
| 2.1 | useFeatureAccess hook | `lib/hooks/useFeatureAccess.ts` | Nový |
| 2.2 | HintCard komponenta | `components/pwa/vehicles/new/HintCard.tsx` | Nový |
| 2.3 | SHOW_HINTS feature flag | `lib/feature-gates.ts` | Edit |
| 2.4-2.8 | Hinty v krocích 1-6 | 6 step komponent | Edit |

### Fáze 3: Fotky kol + defect photos + diagram

| # | Úkol | Soubor | Změna |
|---|------|--------|-------|
| 3.1 | 4 kola + 2 brzdy sloty | `PhotosStep.tsx` | Nová kategorie "wheels" |
| 3.2 | WheelDiagram komponenta | Nový soubor | SVG diagram 4 kol |
| 3.3 | Diagram tooltip/labels | `PhotoPositionDiagram.tsx` | Tap labels + mini-legenda |
| 3.4 | Grid 3 sloupce | `PhotosStep.tsx` | `grid-cols-3` |
| 3.5 | Defect photo integration | `PhotosStep.tsx` | Propojit s defects z inspekce |
| 3.6 | Auto-sequence STAR_1 | `PhotosStep.tsx` | Auto-open next slot |
| 3.7 | PhotoGuide tipy | `PhotoGuide.tsx` | Level-based extended tips |

### Fáze 4: Rozšířená inspekce + DefectMap

| # | Úkol | Soubor | Změna |
|---|------|--------|-------|
| 4.1 | Rozšířit InspectionData | `types/vehicle-draft.ts` | Nové fieldy + DefectZone |
| 4.2 | Exteriér: lak, brzdy, dezén 4 kol | `InspectionStep.tsx` | Nové UI |
| 4.3 | Interiér: infotainment, kufr | `InspectionStep.tsx` | Nové checkboxy |
| 4.4 | Motor: olej, chladič, baterie | `InspectionStep.tsx` | Nové selects |
| 4.5 | Podvozek: nová sekce | `InspectionStep.tsx` | Nová Section |
| 4.6 | DefectMap komponenta | Nový soubor | Diagram + tap-to-add defect |
| 4.7 | Rozšířit DefectCapture | `DefectCapture.tsx` | Přidat zone selector |

### Fáze 5: App-like design polish

| # | Úkol | Soubor | Změna |
|---|------|--------|-------|
| 5.1 | Page transitions | `StepLayout.tsx` | Framer Motion |
| 5.2 | Step indicator | `StepLayout.tsx` | Ikony + progress |
| 5.3 | Sticky header | `StepLayout.tsx` | Zobrazit brand/model |
| 5.4 | Accordion sections | `InspectionStep.tsx`, `DetailsStep.tsx` | Collapsible |

### Fáze 6: Cleanup + build

| # | Úkol |
|---|------|
| 6.1 | Odstranit nepoužívané importy |
| 6.2 | Smazat duplicitní popis z PricingStep |
| 6.3 | Aktualizovat ReviewStep checklist (přidat defect photo check) |
| 6.4 | `npm run build` |

---

## 7. Soubory k vytvoření

| # | Soubor | Typ | Popis |
|---|--------|-----|-------|
| 1 | `lib/hooks/useFeatureAccess.ts` | Hook | Level detection + showHints |
| 2 | `components/pwa/vehicles/new/HintCard.tsx` | Component | Collapsible hint box |
| 3 | `components/pwa/vehicles/new/DefectMap.tsx` | Component | SVG diagram + tap-to-locate defekt |
| 4 | `components/pwa/vehicles/new/WheelDiagram.tsx` | Component | SVG diagram 4 kol (optional, může být inline v PhotosStep) |

## 8. Soubory k úpravě

| # | Soubor | Hlavní změna |
|---|--------|-------------|
| 5 | `VinStep.tsx` | step=1, navigace na /contact, hints |
| 6 | `ContactStep.tsx` | step=2, odstranit prelim car info, hints |
| 7 | `InspectionStep.tsx` | step=3, nové sekce (lak, 4x dezén, brzdy, podvozek, olej...), DefectMap |
| 8 | `PhotosStep.tsx` | grid-cols-3, 4 kola + 2 brzdy, defect section, auto-sequence |
| 9 | `PhotoPositionDiagram.tsx` | Tooltip labels, mini-legenda |
| 10 | `PhotoGuide.tsx` | Level-based extended tips |
| 11 | `DetailsStep.tsx` | Equipment hints |
| 12 | `PricingStep.tsx` | Odstranit duplicitní popis + hints |
| 13 | `ReviewStep.tsx` | Checklist pořadí + defect photo validation |
| 14 | `StepLayout.tsx` | Page transitions, step indicator, sticky header |
| 15 | `types/vehicle-draft.ts` | InspectionData rozšíření + DefectZone + DefectRecord.zone |
| 16 | `lib/feature-gates.ts` | SHOW_HINTS flag |
| 17 | `DefectCapture.tsx` | Zone selector |
| 18-24 | 7× `app/(pwa)/makler/vehicles/new/*/page.tsx` | Navigace |

**Celkem: 4 nové + 20 editovaných souborů**

---

## 9. STOP kritéria

1. VIN je první krok — makléř začíná zadáním/skenováním VIN
2. Po VIN decode se zobrazí summary card s auto-filled daty
3. ContactStep NEOBSAHUJE prelim car info
4. PricingStep NEOBSAHUJE duplicitní popis vozidla
5. STAR_1/2 makléř vidí HintCard nápovědy, STAR_3+ ne
6. PhotoPositionDiagram zobrazuje popisky (ne jen čísla)
7. Photo grid má 3 sloupce
8. **Všechna 4 kola mají dedikovaný foto slot (FL, FR, RL, RR)**
9. **Brzdové kotouče mají volitelné foto sloty (přední, zadní)**
10. **Defekty mají lokalizaci na diagramu auta (zone)**
11. **Každý nalezený defekt v inspekci požaduje fotodokumentaci**
12. InspectionStep: tloušťka laku, hloubka dezénu (4 kola), stav brzd, podvozek
13. Page transitions Framer Motion
14. Step indicator s ikonami
15. Navigace VIN→Contact→Inspection→Photos→Details→Pricing→Review
16. `npm run build` bez chyb

---

## 10. Rizika

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|----------------|-------|----------|
| Přeuspořádání kroků rozbije drafty | Nulová | — | Draft data jsou per-section, pořadí nemění strukturu |
| VIN decode offline → nemůže pokračovat | Nízká | Střední | Offline logika zachována, makléř vyplní ručně v kroku 5 |
| Feature gates bez starLevel | Nízká | Nízká | Fallback na STAR_1 (všechny hints) |
| 4 kola + 2 brzdy = +6 fotek nad minimum | Střední | Nízká | Kola povinná, brzdy volitelné. Celkové minimum zvýšit na 16+3+4=23 |
| DefectMap příliš komplexní | Střední | Střední | MVP: jen zone dropdown (ne precise x/y). Přesná pozice = fáze 2 |
| Rozšíření InspectionData | Nulová | — | Nové fieldy optional, zpětně kompatibilní |
| Quick flow nezměněn | Jistá | Žádný | Quick flow v `/quick/*` — nezávislý |

---

## 11. Závislosti

| Plán | Status | Závislost |
|------|--------|-----------|
| `plan-fix-vin-page-no-draft.md` | Čeká | StepPageGuard PŘED redesignem |
| `plan-fix-vehicle-intake-issues.md` | Čeká | Photo upload fix NEZÁVISLE |
| `plan-ai-description-from-equipment.md` | V implementaci | DetailsStep auto-gen zachován |

---

*Plán připraven: 2026-04-26*  
*Čeká na schválení team leadem*
