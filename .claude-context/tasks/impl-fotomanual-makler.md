# Implementace: Fotomanuál pro makléře (13 pozic exteriéru)

**Task:** #35
**Plan:** plan-fotomanual-makler.md
**Status:** HOTOVO
**Date:** 2026-04-12
**Commit:** d985efd

---

## Změny

### Nový soubor (1)

| Soubor | Lines | Popis |
|--------|-------|-------|
| `components/pwa/vehicles/new/PhotoPositionDiagram.tsx` | ~105 | SVG top-down silueta auta s 13 čísovanými pozicemi. Barvy: oranžová=aktuální, zelená=hotovo, šedá=chybí. Klikatelné body pro navigaci. |

### Editované soubory (2)

| Soubor | Změna |
|--------|-------|
| `components/pwa/vehicles/new/PhotosStep.tsx` | Exteriér: 8→13 slotů (8 required + 5 optional). Diagram nad gridem. Draft migration (`ext_lights`→`ext_headlight`, `ext_wheels`→`ext_wheel_front`). `MIN_REGULAR_PHOTOS` = 13. |
| `components/pwa/vehicles/new/PhotoGuide.tsx` | Nová prop `positionNumber?: number`. Oranžový badge s číslem pozice v camera headeru. |

---

## 13 pozic exteriéru

| # | Slot ID | Název | Required |
|---|---------|-------|----------|
| 1 | `ext_front_34` | Přední 3/4 pohled | yes |
| 2 | `ext_front` | Přímý přední pohled | yes |
| 3 | `ext_right` | Pravý bok | yes |
| 4 | `ext_rear_34` | Zadní 3/4 (pravý) | yes |
| 5 | `ext_rear` | Přímý zadní pohled | yes |
| 6 | `ext_left` | Levý bok | yes |
| 7 | `ext_front_34_left` | Přední 3/4 (levý) | yes |
| 8 | `ext_rear_34_left` | Zadní 3/4 (levý) | yes |
| 9 | `ext_headlight` | Detail předního světla | no |
| 10 | `ext_wheel_front` | Přední kolo | no |
| 11 | `ext_wheel_rear` | Zadní kolo | no |
| 12 | `ext_badge` | Logo / badge | no |
| 13 | `ext_roof` | Střecha | no |

---

## Zpětná kompatibilita

Draft migration mapping v `PhotosStep.tsx`:
- `ext_lights` → `ext_headlight`
- `ext_wheels` → `ext_wheel_front`

---

## Build

- `npm run build` — PASS
- TypeScript errors: **0**
- Žádný obsah z Autorro — vše originální CarMakler
