# Evžen Review — Fotomanuál pro makléře

**Datum:** 2026-04-11
**Reviewer:** Evžen THE KING
**Task:** #38
**Zadání:** Fotomanuál — guided photo capture s SVG diagramem pro makléře v PWA

---

## VERDIKT: ✅ SCHVÁLENO — Implementace přesně odpovídá zadání, 5/5 kontrolních bodů splněno

---

## 1. Kontrolní body

### KB1: 13 pozic exteriéru ✅

- `components/pwa/vehicles/new/PhotosStep.tsx` — `PHOTO_CATEGORIES[0]` (Exteriér) obsahuje přesně 13 slotů:

| # | Slot ID | Label |
|---|---------|-------|
| 1 | ext_front_34 | Přední 3/4 |
| 2 | ext_front | Přední pohled |
| 3 | ext_right | Pravý bok |
| 4 | ext_rear_34 | Zadní 3/4 |
| 5 | ext_rear | Zadní pohled |
| 6 | ext_left | Levý bok |
| 7 | ext_front_34_left | Přední 3/4 levá |
| 8 | ext_rear_34_left | Zadní 3/4 levá |
| 9 | ext_headlight | Přední světlo |
| 10 | ext_wheel_front | Přední kolo |
| 11 | ext_wheel_rear | Zadní kolo |
| 12 | ext_badge | Emblém/badge |
| 13 | ext_roof | Střecha |

- `PhotoPositionDiagram.tsx:9-29` — POSITIONS array rovněž 13 položek, čísla 1-13 ✅

### KB2: SVG diagram ✅

- `components/pwa/vehicles/new/PhotoPositionDiagram.tsx` (106 lines)
- SVG `viewBox="0 0 100 100"` s:
  - Auto silueta (top-down): rect s rx/ry zaoblením + přední/zadní okno + 4 kola
  - 13 číslovaných kruhových bodů s barvami:
    - Oranžová (`#F97316`) = aktuální slot
    - Zelená (`#22C55E`) = hotový slot
    - Šedá (`#D1D5DB`) = chybějící slot
  - Interaktivní `onSlotClick` callback
  - Legenda: Aktuální / Hotovo / Chybí

### KB3: Žádný obsah z Autorro ✅

- Grep `autorro` v `**/*.ts` + `**/*.tsx`: **0 výskytů** v aplikačním kódu
- Výraz existuje pouze v docs/plans/task-queue (plánovací kontext), NE v komponentách

### KB4: Integrace do existující PWA ✅

- `PhotosStep.tsx:338-352` — `PhotoPositionDiagram` renderován uvnitř Exteriér kategorie:
  - `activeSlot` = aktuální slot z `activeGuideSlot`
  - `completedSlots` = sloty s existující fotkou
  - `onSlotClick` → otevře `PhotoGuide` pro daný slot
- `PhotoGuide.tsx` (235 lines) — Full-screen camera overlay:
  - Header: slot name + position number + counter (X/Y v kategorii)
  - Video stream s rámečkovým overlayem (car outline)
  - Capture → Preview → Retake/Use workflow
  - File input fallback pro zařízení bez kamery
  - `resizeImage` + `createThumbnail` processing

### KB5: Zpětná kompatibilita se starými drafty ✅

- `PhotosStep.tsx` — `SLOT_MIGRATION` mapa:
  - `ext_lights` → `ext_headlight`
  - `ext_wheels` → `ext_wheel_front`
- `useEffect` v `PhotosStep` migruje existující drafty při načtení (starý klíč → nový klíč)
- Staré fotky se neztratí, automaticky se přeřadí pod nové slot ID

---

## 2. Soubory — souhrn

| Akce | Soubor | Lines | Popis |
|------|--------|-------|-------|
| NEW | `components/pwa/vehicles/new/PhotoPositionDiagram.tsx` | 106 | SVG diagram s 13 pozicemi |
| NEW | `components/pwa/vehicles/new/PhotoGuide.tsx` | 235 | Full-screen camera overlay |
| EDIT | `components/pwa/vehicles/new/PhotosStep.tsx` | 540 | Integrace diagramu + guide + slot migrace |

---

## 3. Detaily implementace

### Photo Categories (5)

| Kategorie | Počet slotů | Povinné |
|-----------|-------------|---------|
| Exteriér | 13 | ano (MIN_REGULAR_PHOTOS=13) |
| Interiér | 4 | ano |
| Motor | 1 | ano |
| Důkazní | 3 | ano (EVIDENCE_REQUIRED=3) |
| Doklady | 2 | ano |

### PhotoGuide workflow

```
Slot selected → PhotoGuide opens
  ↓
Camera starts (or file fallback)
  ↓
User captures → Preview shown
  ↓
Retake / Use
  ↓
Use → resizeImage + createThumbnail → onCapture(full, thumb)
  ↓
PhotosStep updates draft via IndexedDB
```

---

## 4. Scope creep kontrola

- ✅ Žádné dotčení DB schema
- ✅ Žádné dotčení API routes
- ✅ Žádné dotčení middleware/auth
- ✅ Protected systems nedotčeny (upload, Stripe, contracts)
- ✅ Pouze 3 soubory v `components/pwa/vehicles/new/`

---

## Celkový souhrn

| Kontrolní bod | Verdikt |
|---|---|
| 1. 13 pozic exteriéru | ✅ (13/13 slotů + 13/13 SVG bodů) |
| 2. SVG diagram | ✅ (top-down silueta, barevné kódování, legenda) |
| 3. Žádný obsah z Autorro | ✅ (0 výskytů v app kódu) |
| 4. Integrace do PWA | ✅ (PhotosStep + PhotoGuide + PhotoPositionDiagram) |
| 5. Zpětná kompatibilita | ✅ (SLOT_MIGRATION: 2 staré klíče → nové) |

### ✅ SCHVÁLENO — Fotomanuál pro makléře připraven
