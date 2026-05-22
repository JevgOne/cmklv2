# Implementační plán — Redesign Vehicle Intake Flow (PWA)

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Zdroj:** Task #21/22 — Team Lead požadavek  
**Status:** ČEKÁ NA SCHVÁLENÍ LEADEM

---

## Executive Summary

Kompletní UX redesign 7-krokového nabírání vozidel v PWA makléře. Hlavní změny: **VIN jako první krok** (auto-fill max dat), **level-based nápovědy** (STAR_1/2 vidí tipy, STAR_3+ ne), **vylepšený fotoprůvodce** (popisky na diagramu, lepší layout), **detailnější inspekce** (přidání tloušťky laku, stavu brzd, hloubky dezénu), a **modernější app-like design** (animace, swipe gesta, progress cards).

---

## 1. Analýza aktuálního stavu

### Aktuální flow (7 kroků)

| # | Krok | Soubor | Problém |
|---|------|--------|---------|
| 1 | **Kontakt** | `ContactStep.tsx` (327 ř.) | Obsahuje "preliminary car info" — makléř ručně zadává značku/model/rok, které VIN decode zjistí automaticky |
| 2 | **Prohlídka** | `InspectionStep.tsx` (632 ř.) | Prohlídka PŘED VIN — makléř nemá decoded data, nemůže kontrolovat shodu |
| 3 | **VIN** | `VinStep.tsx` (496 ř.) | VIN je až 3. krok — pozdě pro auto-fill. Makléř ručně vyplnil data v kroku 1 a 5 |
| 4 | **Fotky** | `PhotosStep.tsx` (541 ř.) | Diagram má čísla bez popisků. 4-sloupcový grid je malý na mobilu. Min 13+3=16 fotek |
| 5 | **Údaje** | `DetailsStep.tsx` (783 ř.) | Pre-fill z VIN funguje, ale makléř musel vyplnit prelim data v kroku 1 zbytečně |
| 6 | **Cena** | `PricingStep.tsx` (532 ř.) | Obsahuje DUPLICITNÍ popis vozidla (textarea) — je i v DetailsStep |
| 7 | **Kontrola** | `ReviewStep.tsx` (477 ř.) | OK — checklist + submit |

### Quick flow (3 kroky, pro STAR_2+)

| # | Krok | Soubor | Přístup |
|---|------|--------|---------|
| 1 | VIN + Kontakt | `QuickStep1.tsx` (466 ř.) | VIN PRVNÍ + kontakt — správný přístup! |
| 2 | Fotky (5 povinných) | `QuickStep2.tsx` (434 ř.) | Minimum fotek, rychlé |
| 3 | Detaily + cena + odeslání | `QuickStep3.tsx` | Vše v jednom |

**Klíčové zjištění:** Quick flow MÁ VIN jako první — hlavní flow by měl kopírovat tento vzor.

### Existující infrastruktura

- **VIN decode API:** `GET /api/vin/decode?vin=XXX` → VinDecoderResult (brand, model, variant, year, fuelType, transmission, enginePower, engineCapacity, bodyType, drivetrain, color, doors, seats, equipment[])
- **Duplicate check:** `GET /api/vin/check-duplicate?vin=XXX` → { exists, vehicle }
- **VIN camera scan:** `VinScanModal.tsx` (Tesseract.js OCR, offline-capable)
- **Feature gates:** `lib/feature-gates.ts` — STAR_1 through STAR_5, `canAccess(level, feature)`
- **Photo system:** PhotoGuide (camera overlay), PhotoPositionDiagram (SVG top-down diagram), offlineStorage
- **AI description:** `POST /api/assistant/generate-description` — already accepts equipment[] + highlights[]
- **AI price estimate:** `POST /api/assistant/price-estimate` — already exists
- **Draft system:** IndexedDB via useDraftContext, auto-save with 1s debounce

---

## 2. Navrhovaný nový flow

### Nové pořadí kroků

```
STARÝ FLOW:                          NOVÝ FLOW:
1. Kontakt                           1. VIN (PRVNÍ!)
2. Prohlídka                         2. Kontakt (zjednodušený)
3. VIN                               3. Prohlídka (rozšířená)
4. Fotky                             4. Fotky (vylepšený průvodce)
5. Údaje                             5. Údaje (pre-filled z VIN)
6. Cena                              6. Cena + popis (sloučeno)
7. Kontrola                          7. Kontrola
```

### Důvody přeuspořádání

1. **VIN první** — decode automaticky vyplní 12+ polí (brand, model, year, fuelType, transmission, enginePower, bodyType, drivetrain, doors, seats, equipment). Makléř v dalších krocích jen kontroluje/doplňuje.
2. **Kontakt druhý** — makléř je u auta, zadá prodejce. Odstraněna sekce "preliminary car info" (brand/model/year/mileage/price) — bude z VIN.
3. **Prohlídka třetí** — makléř už zná auto z VIN (brand/model/year), může porovnat s realitou. Rozšířená o tloušťku laku, stav brzd, hloubku dezénu.
4. **Fotky čtvrté** — fyzická dokumentace, vylepšený diagram.
5. **Údaje páté** — většina pre-filled z VIN (zamčené), makléř doplní mileage, condition, equipment, highlights.
6. **Cena šestá** — cena + popis (sjednoceno, odstraněna duplicita PricingStep vs DetailsStep).
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

**Nový level-based hint systém:**
```typescript
// V komponentě:
import { useFeatureAccess } from "@/lib/hooks/useFeatureAccess";

const { showHints } = useFeatureAccess(); // true pro STAR_1, STAR_2

// V JSX (podmíněný render):
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
2. **ODSTRANIT** sekci "Předběžné info o autě" (řádky 162-214) — brand/model/year/mileage/price jsou nyní z VIN
3. Navigace: `handleNext` → `/makler/vehicles/new/inspection?draft=...` (beze změny)
4. Back button → `/makler/vehicles/new/vin?draft=...`
5. Přidat hint pro STAR_1/2: "Tip: Kontakt prodejce je interní — kupující ho neuvidí"

**Odstraněná pole (nyní z VIN):**
- prelimBrand, prelimModel, prelimYear, prelimMileage, prelimPrice

**Zachovaná pole:**
- leadSource, leadUrl, sellerName*, sellerPhone*, sellerEmail, address, GPS, appointmentDate/Time, notes

### KROK 3: Rozšířený InspectionStep (~120 řádků přidáno)

**Soubor:** `components/pwa/vehicles/new/InspectionStep.tsx`

**Změny:**
1. Změnit `step={2}` → `step={3}`
2. Navigace: handleNext → `/makler/vehicles/new/photos?draft=...` (beze změny)
3. Back → `/makler/vehicles/new/contact?draft=...` (beze změny)

**Nové inspekční položky:**

#### A) Exteriér — přidat:
```typescript
// Přidat do DEFAULT_EXTERIOR a do formuláře:
paintThickness: "" as "" | "ORIGINAL" | "REPAINTED_PARTIAL" | "REPAINTED_FULL",
brakeDiscCondition: "" as "" | "GOOD" | "WORN" | "REPLACE",
tireDepthFront: undefined as number | undefined,  // mm
tireDepthRear: undefined as number | undefined,    // mm
```

**UI pro tloušťku laku:**
```
┌─────────────────────────────────────────┐
│  Stav laku                              │
│  [Originál] [Částečně přelak.] [Celý]  │
│                                         │
│  {showHints && "Tip: Originální lak     │
│   má rovnoměrnou tloušťku ~100-150µm"}  │
└─────────────────────────────────────────┘
```

**UI pro hloubku dezénu (nová):**
```
┌─────────────────────────────────────────┐
│  Hloubka dezénu                         │
│  Přední: [___] mm    Zadní: [___] mm    │
│                                         │
│  {showHints && (                        │
│    <DepthGuide>                         │
│      8mm = nové | 4mm = OK              │
│      3mm = brzy měnit | 1.6mm = limit   │
│    </DepthGuide>                        │
│  )}                                     │
└─────────────────────────────────────────┘
```

**UI pro brzdy:**
```
┌─────────────────────────────────────────┐
│  Stav brzdových kotoučů                 │
│  [V pořádku] [Opotřebené] [K výměně]   │
└─────────────────────────────────────────┘
```

#### B) Interiér — přidat:
```typescript
infotainmentWorking: false,  // navigace, dotykový displej
trunkCondition: "" as "" | "CLEAN" | "WORN" | "DAMAGED",
```

#### C) Motor — přidat:
```typescript
oilLevel: "" as "" | "OK" | "LOW" | "OVERFILL",
coolantLevel: "" as "" | "OK" | "LOW",
batteryCondition: "" as "" | "GOOD" | "WEAK" | "DEAD",
```

#### D) Nové: Podvozek (nová sekce)
```typescript
undercarriage: {
  rustLevel: "" as "" | "NONE" | "LIGHT" | "MODERATE" | "SEVERE",
  oilLeaksVisible: false,
  exhaustCondition: "" as "" | "GOOD" | "DAMAGED" | "MISSING_PARTS",
}
```

**Typ rozšíření v `types/vehicle-draft.ts`:**
Přidat nové fieldy do `InspectionData` interface.

### KROK 4: Vylepšený PhotosStep (~80 řádků změn)

**Soubor:** `components/pwa/vehicles/new/PhotosStep.tsx`  
**Soubor:** `components/pwa/vehicles/new/PhotoPositionDiagram.tsx`

#### A) PhotoPositionDiagram — popisky na čísla

**Problém:** Diagram zobrazuje čísla 1-13, ale makléř musí hádat co číslo znamená.

**Řešení:** Přidat tooltip/label při tapnutí na bod:
```typescript
// V PhotoPositionDiagram přidat:
const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

// Ke každému <g>:
<g
  key={pos.slotId}
  className="cursor-pointer"
  onClick={() => onSlotClick?.(pos.slotId)}
  onPointerEnter={() => setHoveredSlot(pos.slotId)}
  onPointerLeave={() => setHoveredSlot(null)}
>
  <circle ... />
  <text ...>{pos.number}</text>
  
  {/* Label tooltip */}
  {hoveredSlot === pos.slotId && (
    <g>
      <rect 
        x={pos.x - 15} y={pos.y - 10} 
        width="30" height="6" rx="1" 
        fill="rgba(0,0,0,0.8)" 
      />
      <text 
        x={pos.x} y={pos.y - 6} 
        textAnchor="middle" fontSize="2.5" 
        fill="white"
      >
        {pos.label}
      </text>
    </g>
  )}
</g>
```

**Alternativní (lepší) řešení pro mobile:** Pod diagramem zobrazit mini-legendu s čísly:
```
1-Přední 3/4  2-Přední  3-Pravý bok  4-Zadní 3/4 P  ...
```

Zobrazit legendu **vždy pro STAR_1/2**, skrýt pro STAR_3+ (kteří si pamatují).

#### B) Photo grid layout — 3 sloupce místo 4

**Problém:** 4-sloupcový grid (`grid-cols-4`) je příliš malý na mobilu — fotky mají cca 80px.

**Řešení:** Změnit na `grid-cols-3` pro lepší přehlednost:
```diff
- <div className="grid grid-cols-4 gap-2">
+ <div className="grid grid-cols-3 gap-3">
```

#### C) Guided photo flow pro STAR_1

Pro STAR_1 makléře přidat **auto-sequence** — po pořízení fotky automaticky otevřít PhotoGuide pro další slot:
```typescript
// V handleCapture callback, po uložení fotky:
if (showHints && nextEmptySlot) {
  // Automaticky otevřít průvodce pro další prázdný slot
  setTimeout(() => {
    setActiveGuide({ slot: nextEmptySlot, category, slotIndex: nextIndex });
  }, 500);
}
```

#### D) PhotoGuide — vylepšení

**Soubor:** `components/pwa/vehicles/new/PhotoGuide.tsx`

Přidat **referenční obrázek** (wireframe/silhouette) pro danou pozici:
```typescript
// Nový prop:
referenceImage?: string; // URL na SVG/PNG referenčního snímku

// V overlay pod tip textem:
{referenceImage && showHints && (
  <div className="mb-4 opacity-30">
    <img src={referenceImage} alt="Referenční záběr" className="max-h-24 mx-auto" />
  </div>
)}
```

### KROK 5: DetailsStep — pre-fill cleanup (~30 řádků změn)

**Soubor:** `components/pwa/vehicles/new/DetailsStep.tsx`

**Změny:**
1. Změnit `step={5}` → `step={5}` (beze změny čísla)
2. Přidat level-based hints pro equipment sekci:
   ```
   {showHints && (
     <p className="text-xs text-gray-500 mb-2">
       Tip: Vyberte výbavu, která zvyšuje hodnotu vozu. 
       AI automaticky vygeneruje popis z vaší výbavy.
     </p>
   )}
   ```
3. Auto-generate description trigger — **už existuje** (useEffect s debounce) — OK

### KROK 6: PricingStep — sjednocení popisu (~40 řádků odstraněno)

**Soubor:** `components/pwa/vehicles/new/PricingStep.tsx`

**Změny:**
1. **ODSTRANIT** sekci "Popis inzerátu" (řádky 424-470) — popis je v DetailsStep, zde je duplicitní
2. **ODSTRANIT** `handleGenerateDescription` funkci (řádky 148-187) — přesunuta do DetailsStep
3. Ponechat: cena, DPH, AI price estimate, provize, lokace, zdroj vozu
4. Přidat hint pro STAR_1/2 u ceny: "Tip: Provize 5% z prodejní ceny, min. 25 000 Kč"

### KROK 7: ReviewStep — beze změny logiky

Pouze aktualizovat checklist pořadí tak, aby odpovídalo novému flow.

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
    showAdvancedHints: level === "STAR_1", // extra detailní nápovědy jen pro úplné nováčky
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
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-medium flex items-center gap-2">
          <span>{variant === "tip" ? "💡" : variant === "warning" ? "⚠️" : "ℹ️"}</span>
          {title}
        </span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="mt-2 text-sm">
          {children}
        </div>
      )}
    </div>
  );
}
```

### Hint placements across steps

| Krok | Hint | Level | Typ |
|------|------|-------|-----|
| VIN | "Kde najdete VIN?" + 3 lokace | STAR_1, STAR_2 | Collapsible tip |
| VIN | "VIN nemá písmena I, O, Q" | STAR_1 | Inline info |
| Contact | "Kontakt prodejce je interní" | STAR_1, STAR_2 | Inline info |
| Inspection | "Jak kontrolovat lak" | STAR_1 | Collapsible tip |
| Inspection | Hloubka dezénu guide (8mm=nové...) | STAR_1, STAR_2 | Inline info |
| Inspection | "Tip: Poslouchejte motor za studena" | STAR_1 | Collapsible tip |
| Photos | Diagram legenda (číslo → název) | STAR_1, STAR_2 | Always visible |
| Photos | Auto-sequence (auto-open next slot) | STAR_1 | Behavior |
| Details | "Výbava zvyšující hodnotu" | STAR_1 | Collapsible tip |
| Pricing | "Provize 5%, min. 25 000 Kč" | STAR_1, STAR_2 | Inline info |

---

## 5. Modernější app-like design — specifikace

### A) Animace přechodu mezi kroky

**Soubor:** `components/pwa/vehicles/new/StepLayout.tsx`

Přidat Framer Motion page transition:
```typescript
import { motion, AnimatePresence } from "framer-motion";

// Wrap children:
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

### B) Progress bar vylepšení

**Aktuální:** Jednoduchý pruhy progress (StepLayout má progress bar)

**Nový:** Step indicator s ikonami + aktuální step highlight:
```
  ①──②──③──④──⑤──⑥──⑦
 VIN Kont Proh Foto Úda Cena Rev
```

Každý kroužek má:
- Šedá = budoucí
- Oranžová = aktuální (s pulse animací)
- Zelená s fajfkou = dokončený

### C) Sticky header s kontextem

V StepLayout přidat informaci o aktuálním vozidle (pokud VIN decoded):
```
┌──────────────────────────────────────┐
│ ← Krok 3/7: Prohlídka          ✕    │
│    Škoda Octavia III 2019            │  ← z VIN decode
│ ════════════════░░░░░░░░░░░░░░░      │
└──────────────────────────────────────┘
```

### D) Section accordion pattern

Dlouhé stránky (Inspection, Details) rozdělit do collapsible sekcí:
```typescript
// Místo:
<Section title="Exteriér">...</Section>

// Použít:
<AccordionSection title="Exteriér" defaultOpen badge="3/6 ✓">
  ...
</AccordionSection>
```

Badge ukazuje progress (kolik z checkboxů je zaškrtnutých).

---

## 6. Implementační kroky

### Fáze 1: Přeuspořádání kroků + navigace (~2 hodiny)

| # | Úkol | Soubor | Změna |
|---|------|--------|-------|
| 1.1 | VinStep → step 1 | `VinStep.tsx` | `step={1}`, navigace na `/contact` |
| 1.2 | ContactStep → step 2 | `ContactStep.tsx` | `step={2}`, odstranit prelim car info |
| 1.3 | InspectionStep → step 3 | `InspectionStep.tsx` | `step={3}` |
| 1.4 | PhotosStep → step 4 | `PhotosStep.tsx` | `step={4}` (beze změny) |
| 1.5 | DetailsStep → step 5 | `DetailsStep.tsx` | `step={5}` (beze změny) |
| 1.6 | PricingStep → step 6 | `PricingStep.tsx` | `step={6}`, odstranit duplicitní popis |
| 1.7 | ReviewStep → step 7 | `ReviewStep.tsx` | `step={7}` (beze změny) |
| 1.8 | Aktualizovat step pages | 7 page.tsx souborů | Navigační URL v layout/pages |
| 1.9 | StepLayout label mapping | `StepLayout.tsx` | Aktualizovat step labels pro nové pořadí |

### Fáze 2: Level-based hint system (~1 hodina)

| # | Úkol | Soubor | Typ |
|---|------|--------|-----|
| 2.1 | Vytvořit useFeatureAccess hook | `lib/hooks/useFeatureAccess.ts` | Nový |
| 2.2 | Vytvořit HintCard komponenta | `components/pwa/vehicles/new/HintCard.tsx` | Nový |
| 2.3 | Přidat SHOW_HINTS do feature-gates | `lib/feature-gates.ts` | Edit (přidat nový feature flag) |
| 2.4 | VinStep — hint "Kde najdete VIN" | `VinStep.tsx` | Přidat conditional render |
| 2.5 | ContactStep — hint "Kontakt je interní" | `ContactStep.tsx` | Přidat conditional render |
| 2.6 | InspectionStep — hints pro nové sekce | `InspectionStep.tsx` | Přidat conditional renders |
| 2.7 | PhotosStep — diagram legenda | `PhotoPositionDiagram.tsx` | Přidat mini-legend |
| 2.8 | PricingStep — hint provize | `PricingStep.tsx` | Přidat conditional render |

### Fáze 3: Vylepšený fotoprůvodce (~1.5 hodiny)

| # | Úkol | Soubor | Změna |
|---|------|--------|-------|
| 3.1 | Diagram — tooltip/labels | `PhotoPositionDiagram.tsx` | Hover/tap label, mini-legenda |
| 3.2 | Grid layout 3 sloupce | `PhotosStep.tsx` | `grid-cols-4` → `grid-cols-3` |
| 3.3 | Auto-sequence pro STAR_1 | `PhotosStep.tsx` | Auto-open next slot po capture |
| 3.4 | PhotoGuide reference hints | `PhotoGuide.tsx` | Level-based detailed tips |

### Fáze 4: Rozšířená inspekce (~1.5 hodiny)

| # | Úkol | Soubor | Změna |
|---|------|--------|-------|
| 4.1 | Rozšířit InspectionData typ | `types/vehicle-draft.ts` | Přidat nové fieldy |
| 4.2 | Exteriér: lak, brzdy, dezén | `InspectionStep.tsx` | Nové UI sekce |
| 4.3 | Interiér: infotainment, kufr | `InspectionStep.tsx` | Nové checkboxy |
| 4.4 | Motor: olej, chladič, baterie | `InspectionStep.tsx` | Nové selects |
| 4.5 | Podvozek: nová sekce | `InspectionStep.tsx` | Nová Section |

### Fáze 5: App-like design polish (~1 hodina)

| # | Úkol | Soubor | Změna |
|---|------|--------|-------|
| 5.1 | Page transition animation | `StepLayout.tsx` | Framer Motion wrap |
| 5.2 | Step indicator s ikonami | `StepLayout.tsx` | Nový progress UI |
| 5.3 | Sticky header s vozidlem | `StepLayout.tsx` | Zobrazit brand/model z draft |
| 5.4 | Section accordions | `InspectionStep.tsx`, `DetailsStep.tsx` | AccordionSection pattern |

### Fáze 6: Cleanup + build (~30 min)

| # | Úkol | Soubor | Změna |
|---|------|--------|-------|
| 6.1 | Odstranit nepoužívané importy | Všechny editované soubory | Cleanup |
| 6.2 | Smazat duplicitní popis z PricingStep | `PricingStep.tsx` | Odstranit description textarea + handleGenerateDescription |
| 6.3 | npm run build | — | Ověřit build |
| 6.4 | Aktualizovat ReviewStep checklist | `ReviewStep.tsx` | Sladit pořadí s novým flow |

---

## 7. Soubory k vytvoření

| # | Soubor | Typ | Popis |
|---|--------|-----|-------|
| 1 | `lib/hooks/useFeatureAccess.ts` | Hook | Level detection + showHints flag |
| 2 | `components/pwa/vehicles/new/HintCard.tsx` | Component | Collapsible hint box (tip/warning/info) |

## 8. Soubory k úpravě

| # | Soubor | Hlavní změna |
|---|--------|-------------|
| 3 | `components/pwa/vehicles/new/VinStep.tsx` | step=1, navigace na /contact, přidat hints |
| 4 | `components/pwa/vehicles/new/ContactStep.tsx` | step=2, odstranit prelim car info, přidat hints |
| 5 | `components/pwa/vehicles/new/InspectionStep.tsx` | step=3, nové sekce (lak, dezén, brzdy, podvozek, olej...) |
| 6 | `components/pwa/vehicles/new/PhotosStep.tsx` | grid-cols-3, auto-sequence, hints |
| 7 | `components/pwa/vehicles/new/PhotoPositionDiagram.tsx` | Tooltip labels, mini-legenda |
| 8 | `components/pwa/vehicles/new/PhotoGuide.tsx` | Level-based detailed tips |
| 9 | `components/pwa/vehicles/new/DetailsStep.tsx` | Hints pro equipment |
| 10 | `components/pwa/vehicles/new/PricingStep.tsx` | Odstranit duplicitní popis, přidat hints |
| 11 | `components/pwa/vehicles/new/ReviewStep.tsx` | Aktualizovat checklist pořadí |
| 12 | `components/pwa/vehicles/new/StepLayout.tsx` | Page transitions, step indicator, sticky header |
| 13 | `types/vehicle-draft.ts` | Rozšířit InspectionData o nové fieldy |
| 14 | `lib/feature-gates.ts` | Přidat SHOW_HINTS feature flag |
| 15-21 | 7× `app/(pwa)/makler/vehicles/new/*/page.tsx` | Step guard + navigace (pokud bude implementován plan-fix-vin-page-no-draft.md) |

---

## 9. STOP kritéria

1. VIN je první krok — makléř začíná zadáním/skenováním VIN
2. Po VIN decode se zobrazí summary card s auto-filled daty
3. ContactStep NEOBSAHUJE prelim car info (brand/model/year/mileage/price)
4. PricingStep NEOBSAHUJE duplicitní popis vozidla (jen v DetailsStep)
5. STAR_1 makléř vidí rozšířené nápovědy (HintCard) ve všech krocích
6. STAR_3+ makléř NEVIDÍ nápovědy — čistý minimální UI
7. PhotoPositionDiagram zobrazuje popisky/legendu (ne jen čísla)
8. Photo grid má 3 sloupce (ne 4)
9. InspectionStep obsahuje nové sekce: tloušťka laku, stav brzd, hloubka dezénu, podvozek
10. Přechody mezi kroky mají plynulou animaci (Framer Motion)
11. StepLayout progress ukazuje ikony pro každý krok
12. Navigace mezi kroky odpovídá novému pořadí (VIN→Contact→Inspection→Photos→Details→Pricing→Review)
13. `npm run build` projde bez chyb

---

## 10. Rizika

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|----------------|-------|----------|
| Přeuspořádání kroků rozbije existující drafty | Střední | Vysoký | Draft data jsou uložena per-section (contact, vin, ...) — pořadí kroků NEMĚNÍ strukturu dat. Existující drafty budou fungovat. |
| VIN decode selhává offline → makléř nemůže pokračovat | Nízká | Střední | Stávající offline logika zachována — VIN se uloží, decode proběhne po připojení. Makléř může pokračovat s ručním vyplněním. |
| Feature gates nemají starLevel v session | Nízká | Nízká | Fallback na STAR_1 (= zobrazit všechny hints) — bezpečný default |
| Framer Motion zvětší bundle size | Jistá | Nízká | Framer Motion je already in dependencies (import jen page-level, tree-shaking) |
| Rozšíření InspectionData rozbije existující inspekce | Nulová | — | Všechny nové fieldy jsou optional (undefined default) — zpětně kompatibilní |
| Quick flow (3 kroky) je neovlivněn | Jistá | Žádný | Quick flow je oddělen v `/quick/*` — tento redesign se ho netýká |

---

## 11. Závislosti na jiných plánech

| Plán | Status | Závislost |
|------|--------|-----------|
| `plan-fix-vin-page-no-draft.md` | Čeká na schválení | StepPageGuard by měl být implementován PŘED tímto redesignem — jinak přeuspořádání kroků nezafixuje draft-less access |
| `plan-fix-vehicle-intake-issues.md` | Čeká na schválení | Photo upload pipeline fix by měl být implementován NEZÁVISLE — tento redesign nemění upload logiku |
| `plan-ai-description-from-equipment.md` | Schválen, v implementaci | Auto-generate description — DetailsStep UŽ MÁ tuto logiku. Redesign ji zachovává. |

---

## 12. Poznámky k implementaci

1. **Draft struktura se NEMĚNÍ** — `VehicleDraft` interface zůstává stejný (contact, inspection, vin, photos, details, pricing). Mění se jen POŘADÍ kroků a navigace.
2. **Quick flow NEZMĚNĚN** — 3-krokový quick flow pro STAR_2+ zůstává jak je.
3. **Kontakt prodejce zůstává interní** — žádné pole z ContactStep se nezobrazuje na veřejném webu. Toto explicitně potvrzeno team leadem.
4. **InspectionData rozšíření je additivní** — všechny nové fieldy jsou optional, žádný breaking change.
5. **Step numbering v StepLayout** — StepLayout přijímá `step` prop pro progress bar. Stačí změnit číslo v každém step komponentu.

---

*Plán připraven: 2026-04-26*  
*Čeká na schválení team leadem*
