# Plan — Fotomanuál pro makléře (13 pozic exteriéru)

**Datum:** 2026-04-12
**Agent:** Plánovač
**Zdroj:** Task #30 (team-lead, inspirace Autorro — VEŠKERÝ obsah musí být originální CarMakler)
**Effort:** ~3-4h
**DB migrace:** ŽÁDNÁ

---

## §0 Executive summary

Rozšíření existujícího `PhotosStep.tsx` o interaktivní fotomanuál s 13 pozicemi exteriéru. Každá pozice má SVG diagram ukazující kde stát + popis co zachytit. Makléř proklikává pozice 1→13, u každé fotí přes existující `PhotoGuide`.

**Existující stav:**
- `PhotosStep.tsx` (505 lines) — 8 exterior slotů, 4 interiér, 1 motor, 3 evidence, 2 dokumenty
- `PhotoGuide.tsx` (229 lines) — kamera overlay s tipem, capture, retake, gallery fallback
- Grid 4×N s thumbnaily, progress bar, "Pokračovat" button

**Co se mění:**
- **1 nový soubor:** `components/pwa/vehicles/new/PhotoPositionDiagram.tsx` — SVG diagram s pohledem na auto
- **1 edit:** `PhotosStep.tsx` — rozšířit exteriér sloty na 13, přidat diagram do PhotoGuide flow
- **1 edit:** `PhotoGuide.tsx` — přidat diagram overlay před kamerou (volitelné)

---

## §1 13 pozic exteriéru (CarMakler originál)

| # | Slot ID | Název | Pozice fotografa | Tip |
|---|---------|-------|-------------------|-----|
| 1 | `ext_front_34` | Přední 3/4 pohled | Pravý přední roh, 45° | Klasický prodejní záběr. Vůz čistý, denní světlo, žádné stíny na kapotě. |
| 2 | `ext_front` | Přímý přední pohled | Přímo zepředu, střed | Symetricky. Zachyťte masku, světla, SPZ. |
| 3 | `ext_right` | Pravý bok | Kolmo k pravému boku, střed vozu | Celý bok v záběru. Foťte z pasu, ne shora. |
| 4 | `ext_rear_34` | Zadní 3/4 pohled (pravý) | Pravý zadní roh, 45° | Zachyťte celé auto, svítilny, výfuk. |
| 5 | `ext_rear` | Přímý zadní pohled | Přímo zezadu, střed | Symetricky. SPZ, svítilny, nárazník. |
| 6 | `ext_left` | Levý bok | Kolmo k levému boku, střed vozu | Celý bok v záběru. Stejná výška jako pravý bok. |
| 7 | `ext_front_34_left` | Přední 3/4 pohled (levý) | Levý přední roh, 45° | Doplňkový záběr k #1 z druhé strany. |
| 8 | `ext_rear_34_left` | Zadní 3/4 pohled (levý) | Levý zadní roh, 45° | Doplňkový záběr k #4 z druhé strany. |
| 9 | `ext_headlight` | Detail předního světla | Přiblížit se, pravé světlo | Detail DRL, projektor, čočky. Stav bez orosení. |
| 10 | `ext_wheel_front` | Detail předního kola | Přiblížit se, pravé přední | Disk, pneumatika (DOT viditelný), brzdový kotouč. |
| 11 | `ext_wheel_rear` | Detail zadního kola | Přiblížit se, pravé zadní | Stav pneumatiky, hloubka dezénu. |
| 12 | `ext_badge` | Logo / badge výrobce | Přiblížit se, zadní badge | Značka + model badge. Pro verifikaci typu vozu. |
| 13 | `ext_roof` | Střecha / panorama | Ze strany, mírně shora (schody/kopec) | Stav střechy, panoramatické okno, střešní nosič. |

**Vs. aktuální stav (8 slotů):**
- Přidáno 5 nových: `ext_front_34_left`, `ext_rear_34_left`, `ext_headlight`, `ext_wheel_front` (split z `ext_wheels`), `ext_wheel_rear`, `ext_badge`, `ext_roof`
- Přejmenováno: `ext_lights` → `ext_headlight`, `ext_wheels` → `ext_wheel_front` + `ext_wheel_rear`

---

## §2 Soubory k vytvoření

### 2.1 `components/pwa/vehicles/new/PhotoPositionDiagram.tsx` (NEW, ~200 lines)

SVG diagram ukazující siluetu auta shora (top-down view) s čísly pozic 1–13 kolem ní. Aktivní pozice je zvýrazněná oranžově.

```typescript
"use client";

interface PhotoPositionDiagramProps {
  /** Aktuální slot ID (zvýrazní se) */
  activeSlot: string | null;
  /** Slot IDs, které už mají fotku (zelené) */
  completedSlots: string[];
  /** Callback při kliknutí na pozici */
  onSlotClick?: (slotId: string) => void;
}

// Mapování slot ID → číslo pozice + souřadnice kolem auta
const POSITIONS: Array<{
  slotId: string;
  number: number;
  label: string;
  /** SVG coordinates (top-down view, auto centrováno) */
  x: number;
  y: number;
  /** Šipka směr k autu */
  arrowAngle: number;
}> = [
  { slotId: "ext_front_34", number: 1, label: "Přední 3/4", x: 85, y: 20, arrowAngle: 225 },
  { slotId: "ext_front", number: 2, label: "Přední", x: 50, y: 5, arrowAngle: 180 },
  { slotId: "ext_right", number: 3, label: "Pravý bok", x: 95, y: 50, arrowAngle: 270 },
  { slotId: "ext_rear_34", number: 4, label: "Zadní 3/4 P", x: 85, y: 80, arrowAngle: 315 },
  { slotId: "ext_rear", number: 5, label: "Zadní", x: 50, y: 95, arrowAngle: 0 },
  { slotId: "ext_left", number: 6, label: "Levý bok", x: 5, y: 50, arrowAngle: 90 },
  { slotId: "ext_front_34_left", number: 7, label: "Přední 3/4 L", x: 15, y: 20, arrowAngle: 135 },
  { slotId: "ext_rear_34_left", number: 8, label: "Zadní 3/4 L", x: 15, y: 80, arrowAngle: 45 },
  { slotId: "ext_headlight", number: 9, label: "Světlo", x: 75, y: 12, arrowAngle: 210 },
  { slotId: "ext_wheel_front", number: 10, label: "Kolo P", x: 80, y: 32, arrowAngle: 250 },
  { slotId: "ext_wheel_rear", number: 11, label: "Kolo Z", x: 80, y: 68, arrowAngle: 290 },
  { slotId: "ext_badge", number: 12, label: "Badge", x: 60, y: 88, arrowAngle: 340 },
  { slotId: "ext_roof", number: 13, label: "Střecha", x: 30, y: 40, arrowAngle: 120 },
];

export function PhotoPositionDiagram({ activeSlot, completedSlots, onSlotClick }: PhotoPositionDiagramProps) {
  return (
    <div className="relative w-full max-w-[280px] mx-auto aspect-[4/5]">
      {/* SVG: Auto silueta (top-down) + pozice */}
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Auto silueta — jednoduchý obrys shora */}
        <rect x="30" y="18" width="40" height="64" rx="12" ry="12"
          className="fill-gray-100 stroke-gray-300" strokeWidth="1" />
        {/* Přední okno */}
        <rect x="35" y="25" width="30" height="10" rx="4"
          className="fill-gray-200" />
        {/* Zadní okno */}
        <rect x="35" y="65" width="30" height="8" rx="4"
          className="fill-gray-200" />
        {/* Kola */}
        <rect x="27" y="28" width="5" height="10" rx="2" className="fill-gray-400" />
        <rect x="68" y="28" width="5" height="10" rx="2" className="fill-gray-400" />
        <rect x="27" y="62" width="5" height="10" rx="2" className="fill-gray-400" />
        <rect x="68" y="62" width="5" height="10" rx="2" className="fill-gray-400" />

        {/* Pozice bodů */}
        {POSITIONS.map((pos) => {
          const isActive = activeSlot === pos.slotId;
          const isCompleted = completedSlots.includes(pos.slotId);
          const fillColor = isActive ? "#F97316" : isCompleted ? "#22C55E" : "#D1D5DB";
          const textColor = isActive || isCompleted ? "white" : "#6B7280";

          return (
            <g key={pos.slotId} className="cursor-pointer"
              onClick={() => onSlotClick?.(pos.slotId)}>
              <circle cx={pos.x} cy={pos.y} r="4.5"
                fill={fillColor}
                stroke={isActive ? "#EA580C" : "transparent"}
                strokeWidth="1" />
              <text x={pos.x} y={pos.y + 1.5}
                textAnchor="middle" fontSize="4" fontWeight="bold"
                fill={textColor}>
                {pos.number}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Aktuální
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Hotovo
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" /> Chybí
        </span>
      </div>
    </div>
  );
}
```

**Klíčové principy:**
- SVG top-down silueta auta (minimalistická, ne fotka Autorro)
- 13 číslovaných bodů kolem siluety
- Barevné kódování: oranžový = aktuální, zelený = hotovo, šedý = chybí
- Klikatelné body pro navigaci mezi pozicemi
- Responsive, max 280px šířka

---

## §3 Soubory k editaci

### 3.1 `components/pwa/vehicles/new/PhotosStep.tsx` — rozšířit exteriér na 13 pozic (lines 29-42)

**Aktuální exteriér sloty (lines 33-42):**
```typescript
slots: [
  { id: "ext_front_34", label: "Přední 3/4 pohled", tip: "Foťte za denního světla, vůz by měl být čistý", required: true },
  { id: "ext_rear_34", label: "Zadní 3/4 pohled", tip: "Zachyťte celé auto z pravého zadního rohu", required: true },
  { id: "ext_left", label: "Levý bok", tip: "Foťte kolmo k vozu, celý bok v záběru", required: true },
  { id: "ext_right", label: "Pravý bok", tip: "Foťte kolmo k vozu, celý bok v záběru", required: true },
  { id: "ext_front", label: "Přední pohled", tip: "Foťte zepředu, symetricky", required: true },
  { id: "ext_rear", label: "Zadní pohled", tip: "Foťte zezadu, symetricky", required: true },
  { id: "ext_lights", label: "Detail světel", tip: "Přiblížte se k předním světlům", required: false },
  { id: "ext_wheels", label: "Kola", tip: "Detail disku a pneumatiky", required: false },
],
```

**Nový kód:**
```typescript
slots: [
  { id: "ext_front_34", label: "1. Přední 3/4 pohled", tip: "Klasický prodejní záběr. Pravý přední roh, 45°. Vůz čistý, denní světlo.", required: true },
  { id: "ext_front", label: "2. Přímý přední pohled", tip: "Přímo zepředu, symetricky. Zachyťte masku, světla, SPZ.", required: true },
  { id: "ext_right", label: "3. Pravý bok", tip: "Kolmo k pravému boku, ze středu vozu. Foťte z pasu, ne shora.", required: true },
  { id: "ext_rear_34", label: "4. Zadní 3/4 (pravý)", tip: "Pravý zadní roh, 45°. Zachyťte svítilny, výfuk.", required: true },
  { id: "ext_rear", label: "5. Přímý zadní pohled", tip: "Přímo zezadu, symetricky. SPZ, svítilny, nárazník.", required: true },
  { id: "ext_left", label: "6. Levý bok", tip: "Kolmo k levému boku, ze středu vozu. Stejná výška jako pravý bok.", required: true },
  { id: "ext_front_34_left", label: "7. Přední 3/4 (levý)", tip: "Levý přední roh, 45°. Doplňkový záběr z druhé strany.", required: true },
  { id: "ext_rear_34_left", label: "8. Zadní 3/4 (levý)", tip: "Levý zadní roh, 45°. Doplňkový záběr z druhé strany.", required: true },
  { id: "ext_headlight", label: "9. Detail předního světla", tip: "Přibližte se k pravému světlu. Detail DRL, čočky. Bez orosení.", required: false },
  { id: "ext_wheel_front", label: "10. Přední kolo", tip: "Pravé přední kolo. Disk, pneumatika (DOT viditelný), brzdový kotouč.", required: false },
  { id: "ext_wheel_rear", label: "11. Zadní kolo", tip: "Pravé zadní kolo. Stav pneumatiky, hloubka dezénu.", required: false },
  { id: "ext_badge", label: "12. Logo / badge", tip: "Zadní badge výrobce + model. Pro verifikaci typu vozu.", required: false },
  { id: "ext_roof", label: "13. Střecha", tip: "Ze strany, mírně shora. Stav střechy, panoramatické okno.", required: false },
],
```

**Změna `MIN_REGULAR_PHOTOS` (line 80):**
```diff
-const MIN_REGULAR_PHOTOS = 12;
+const MIN_REGULAR_PHOTOS = 13;
```

Vysvětlení: 8 required exteriér + 4 required interiér + 1 required motor = 13 minimum.

---

### 3.2 `PhotosStep.tsx` — přidat diagram nad exteriér grid (line ~311)

**Přidat import na začátek:**
```typescript
import { PhotoPositionDiagram } from "@/components/pwa/vehicles/new/PhotoPositionDiagram";
```

**Přidat diagram do exteriér sekce (uvnitř `PHOTO_CATEGORIES.map`):**

Po `<h3>` elementu pro kategorii `exterior`, před `<div className="grid grid-cols-4">`:

```typescript
{category.id === "exterior" && (
  <PhotoPositionDiagram
    activeSlot={null}
    completedSlots={photos.filter(p => p.slotId.startsWith("ext_")).map(p => p.slotId)}
    onSlotClick={(slotId) => {
      const slot = category.slots.find(s => s.id === slotId);
      if (slot) {
        const slotIndex = category.slots.indexOf(slot);
        setActiveGuide({ slot, category, slotIndex });
      }
    }}
  />
)}
```

---

### 3.3 `PhotoGuide.tsx` — přidat diagram vedle camera view (volitelné rozšíření)

**Přidat prop (line 8-9):**
```diff
 interface PhotoGuideProps {
   slotName: string;
   tip: string;
   categoryLabel: string;
   currentIndex: number;
   totalInCategory: number;
+  positionNumber?: number; // 1-13 pro exteriér pozice
   onCapture: (full: Blob, thumb: Blob) => void;
   onClose: () => void;
 }
```

**Přidat číslo pozice do headeru (line 148-150):**
```diff
         <h2 className="text-white text-lg font-bold text-center mt-2">
+          {positionNumber && (
+            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-sm font-bold mr-2">
+              {positionNumber}
+            </span>
+          )}
           {slotName}
         </h2>
```

**Předání z PhotosStep:** Při otevření PhotoGuide pro exteriér slot přidat `positionNumber`:

```typescript
// V setActiveGuide volání pro exterior:
const posNumber = category.id === "exterior" ? category.slots.indexOf(slot) + 1 : undefined;
```

---

## §4 Zpětná kompatibilita

### Draft data
Existující drafty v IndexedDB mají fotky s původními slot IDs (`ext_lights`, `ext_wheels`). Nové slot IDs (`ext_headlight`, `ext_wheel_front`, `ext_wheel_rear`) nebudou matchovat staré fotky.

**Řešení:** V `useEffect` při loadu fotek z draftu přidat migration mapping:

```typescript
// V PhotosStep, v useEffect kde se loadují fotky z draftu:
const SLOT_MIGRATION: Record<string, string> = {
  "ext_lights": "ext_headlight",
  "ext_wheels": "ext_wheel_front", // starý "kola" → mapovat na přední kolo
};

const migratedPhotos = (draft.photos as StoredPhoto[]).map(p => ({
  ...p,
  slotId: SLOT_MIGRATION[p.slotId] || p.slotId,
}));
```

---

## §5 Implementační pořadí

1. **Vytvořit** `PhotoPositionDiagram.tsx` — SVG diagram
2. **Edit** `PhotosStep.tsx` — rozšířit exteriér sloty na 13, přidat diagram
3. **Edit** `PhotoGuide.tsx` — přidat číslo pozice (volitelné)
4. **Test** — proklikat všech 13 pozic, ověřit diagram, ověřit zpětnou kompatibilitu

---

## §6 Acceptance criteria

- [ ] 13 exteriérních pozic v gridu (8 required + 5 optional)
- [ ] Každá pozice má číslo (1-13), název, a detailní tip
- [ ] SVG diagram nad exteriér gridem s top-down pohledem na auto
- [ ] Diagram: kliknutí na bod otevře PhotoGuide pro danou pozici
- [ ] Diagram: zelené body = hotové fotky, oranžový = aktuální, šedé = chybí
- [ ] Číslo pozice zobrazeno v PhotoGuide headeru
- [ ] Zpětná kompatibilita: staré drafty s `ext_lights`/`ext_wheels` se migrují
- [ ] `MIN_REGULAR_PHOTOS` = 13 (8 ext required + 4 int + 1 motor)
- [ ] Žádný obsah z Autorro (vše originální CarMakler)
- [ ] TypeScript: 0 errors
- [ ] Build: passes

---

## §7 STOP kritéria

- **STOP-1:** SVG diagram je příliš malý na mobilu (13 bodů se překrývají) → zmenšit počet viditelných bodů, scrollable diagram, nebo accordion view místo SVG
- **STOP-2:** Grid 4×N s 13 sloty vypadá přeplněný → přepnout na 3-column grid pro exteriér, nebo accordion/carousel
- **STOP-3:** Existující E2E testy pro PhotosStep selhávají (změna slot IDs) → aktualizovat test fixtures

---

## §8 Design poznámky

- **Branding:** SVG diagram používá CarMakler oranžovou (#F97316), ne žádné Autorro barvy/ikony
- **Top-down silueta:** Univerzální tvar auta (sedan), ne specifický model. Jednoduché obrysy.
- **Numbered positions:** Čísla 1-13 odpovídají doporučenému pořadí focení (obejít auto clockwise)
- **Tipy:** Každý tip je konkrétní instrukce (kde stát, co zachytit, na co dát pozor), ne generický text
