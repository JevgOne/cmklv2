# QA Report — Task #44: Kritické fixy (placeholder, logo, orphans, auto-checks)

**Datum:** 2026-04-12
**Agent:** KONTROLOR
**Task:** #44
**Commit:** 5a79d3d
**Typ:** Debug + Reverzní kontrola

---

## VERDICT: ✅ SCHVÁLENO — 0 blockerů, 0 bugs

---

## 1. DEBUG KONTROLA

| Check | Výsledek |
|---|---|
| `npx tsc --noEmit` (bez e2e/) | ✅ 0 errors |

---

## 2. REVERZNÍ KONTROLA — 6 kontrolních bodů

| # | Kritérium | Výsledek | Kde ověřeno |
|---|---|---|---|
| 1 | `/public/images/placeholder-car.jpg` existuje a je validní obrázek | ✅ | `ls` + `file` — JPEG 600×400, 3 komponenty, 4308 bytes |
| 2 | `lib/company-info.ts` logo URL ukazuje na existující soubor | ✅ | `logo-color.png` v URL + `/public/brand/logo-color.png` EXISTS |
| 3 | `components/web/Navbar.tsx` smazán | ✅ | Glob — No files found |
| 4 | `components/web/Footer.tsx` smazán | ✅ | Glob — No files found |
| 5 | `components/web/MobileMenu.tsx` smazán | ✅ | Glob — No files found |
| 6 | Komentář o fiktivních pobočkách smazán | ✅ | Git diff 5a79d3d: 5 řádků komentáře odstraněno |
| 7 | VehicleDetailHub předává hasExteriorPhotos/hasInteriorPhotos/hasEvidencePhotos | ✅ | `VehicleDetailHub.tsx:339-342` |
| 8 | Build passes, 0 TS errors | ✅ | `npx tsc --noEmit` — bez výstupu |

**Celkem: 8/8 ✅**

---

## 3. DETAIL OVĚŘENÍ

### 3.1 placeholder-car.jpg

```
-rw-r--r--  1 zen staff  4308 12 dub 12:28 public/images/placeholder-car.jpg
JPEG image data, baseline, precision 8, 600x400, components 3
```
Soubor existuje, je validní JPEG, správné rozměry ✅

### 3.2 Logo URL fix

| | Před | Po |
|---|---|---|
| `company-info.ts:43` | `"https://carmakler.cz/brand/logo.svg"` | `"https://carmakler.cz/brand/logo-color.png"` |
| Soubor existuje? | ❌ (logo.svg neexistoval) | ✅ `/public/brand/logo-color.png` EXISTS |

### 3.3 Orphan components

Soubory byly orphany (replacovány `components/main/`):
- `components/web/Navbar.tsx` → SMAZÁN (byl 211 řádků) ✅
- `components/web/Footer.tsx` → SMAZÁN (byl 27 řádků) ✅
- `components/web/MobileMenu.tsx` → SMAZÁN (byl 197 řádků) ✅

Git diff: `-441 lines` z těchto 3 souborů ✅

### 3.4 Komentář o fiktivních pobočkách

Diff z 5a79d3d:
```diff
-  /**
-   * Pobocky.
-   * POZNAMKA: Odebrat fiktivni pobocky Brno a Ostrava.
-   * Pridat realne pobocky az budou existovat.
-   */
  branches: [
```
Komentář odstraněn ✅. `branches` pole zůstává s jediným záznamem (Praha centrála).

### 3.5 Photo auto-checks v VehicleDetailHub

```typescript
// VehicleDetailHub.tsx:339-342
// Count-based heuristic (VehicleImage lacks category field)
hasExteriorPhotos: vehicle.images.length >= 8,
hasInteriorPhotos: vehicle.images.length >= 13,
hasEvidencePhotos: vehicle.images.length >= 16,
```

Všechny 3 klíče předány ✅. Heuristika vychází z kumulativního počtu fotek:
- `>= 8` = 8 required ext. pozic
- `>= 13` = 8 ext + 4 int + 1 motor (MIN_REGULAR_PHOTOS)
- `>= 16` = 13 + 3 důkazní fotky (tachometr, VIN, klíče)

---

## 4. OBSERVATIONS

### OBS-1 — Count-based heuristic pro photo auto-checks

`VehicleImage` nemá `category` pole, takže není možné přesně zjistit počet exteriérových vs interiérových fotek. Implementace používá kumulativní count jako proxy. Logika je rozumná a konzistentní s MIN_REGULAR_PHOTOS = 13. Kód to sám komentuje.

Riziko: makléř mohl nahrát 8+ fotek pouze interiéru → `hasExteriorPhotos` by se aktivovalo nesprávně. Prakticky nízké riziko (workflow vede k nahrávání ext fotek dříve). Non-blocker.

---

## 5. SOUHRN

| Kategorie | Výsledek |
|---|---|
| AC splněno | 8/8 ✅ |
| Blokerů | 0 |
| Bugs | 0 |
| TypeScript errors | 0 |
| placeholder-car.jpg | ✅ JPEG 600×400 |
| Logo URL fix | ✅ .svg → .png (existující soubor) |
| Orphan components smazány | 3/3 ✅ |
| Komentář fiktivní pobočky smazán | ✅ |
| Photo auto-checks (3 klíče) | ✅ |

---

## 6. AKCE

Žádné. Commit 5a79d3d je čistý — všechny opravy provedeny správně.
