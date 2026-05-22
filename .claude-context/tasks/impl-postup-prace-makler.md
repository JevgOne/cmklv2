# Implementace: Postup práce makléře — checklist workflow

**Task:** #37
**Plan:** plan-postup-prace-makler.md
**Status:** HOTOVO
**Date:** 2026-04-12
**Commit:** f415e93

---

## Změny

### Nové soubory (3)

| Soubor | Lines | Popis |
|--------|-------|-------|
| `components/pwa/vehicles/WorkflowChecklist.tsx` | ~300 | Accordion fáze + toggle kroky. Auto-check (modré) vs manuální (zelené). Progress bar + "Další krok" banner. |
| `app/api/vehicles/[id]/workflow/route.ts` | ~80 | GET/PUT workflow checklist JSON. Auth: broker owner, ADMIN, BACKOFFICE. |
| `prisma/migrations/20260412090835_add_workflow_checklist/migration.sql` | 2 | `ALTER TABLE "Vehicle" ADD COLUMN "workflowChecklist" TEXT;` |

### Editované soubory (2)

| Soubor | Změna |
|--------|-------|
| `prisma/schema.prisma` | Přidáno `workflowChecklist String?` na model Vehicle |
| `components/pwa/vehicles/VehicleDetailHub.tsx` | Import + WorkflowChecklist sekce s autoChecks z vehicle dat |

---

## 9 fází, 28 kroků

| Fáze | Kroky | Auto-check |
|------|-------|------------|
| 1. Příprava | 3 | hasContact, hasBasicInfo |
| 2. Vybavení | 4 | - (vše manuální) |
| 3. Osobní prohlídka | 5 | - (vše manuální) |
| 4. Fotodokumentace | 5 | hasExteriorPhotos, hasInteriorPhotos, hasEvidencePhotos |
| 5. Zadání do systému | 5 | hasVin, hasDescription |
| 6. Cena a smlouva | 3 | hasPrice, hasSigned |
| 7. Ověření | 1 | - |
| 8. Publikace | 3 | isActive |
| 9. Záloha | 1 | - |

## Auto-checks (computed in VehicleDetailHub)

| Key | Condition |
|-----|-----------|
| `hasContact` | `vehicle.sellerPhone` exists |
| `hasBasicInfo` | `vehicle.brand && vehicle.model` |
| `hasVin` | `vehicle.vin.length === 17` |
| `hasDescription` | `vehicle.description.length >= 20` |
| `hasPrice` | `vehicle.price > 0` |
| `hasSigned` | `contracts.some(status === "SIGNED")` |
| `isActive` | `vehicle.status === "ACTIVE"` |

Photo auto-checks (4.1-4.3) are defined as keys but not yet computed from server — would require images join in the hub. Left for future enhancement.

---

## Build

- `npm run build` — PASS
- `npx prisma generate` — PASS
- TypeScript errors: **0**
- Migration: clean (tsvector drift removed)
- Žádný obsah z Autorro
