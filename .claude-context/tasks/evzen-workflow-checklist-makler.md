# Evžen Review — Workflow checklist makléře

**Datum:** 2026-04-12
**Reviewer:** Evžen THE KING
**Task:** #40
**Zadání:** "Postup práce makléra" — interaktivní checklist dle Autorro inspirace, ale bez Autorro obsahu

---

## VERDIKT: ✅ SCHVÁLENO — Implementace odpovídá zadání, 5/5 kontrolních bodů splněno

---

## 1. Kontrolní body

### KB1: Kompletní workflow od kontaktu po zálohu fotek ✅

- `WorkflowChecklist.tsx:24-109` — 9 fází, 28 kroků:

| Fáze | Kroky | Obsah |
|------|-------|-------|
| 1. Příprava | 3 | Kontakt, základní info, schůzka |
| 2. Vybavení | 4 | Měřič laku, baterka, utěrka, telefon |
| 3. Osobní prohlídka | 5 | Exteriér, měření laku, interiér, motor, testjízda |
| 4. Fotodokumentace | 5 | Exteriér dle manuálu, interiér+motor, důkazní, TP, defekty |
| 5. Zadání do systému | 5 | VIN, výbava, popis, STK+emise, doplňky |
| 6. Cena a smlouva | 3 | Prodejní cena, provize (5%/25k), smlouva |
| 7. Ověření | 1 | CEBIA prověrka |
| 8. Publikace | 3 | Úprava fotek, seřazení, publikace |
| 9. Záloha | 1 | Záloha fotek na cloud/disk |

- Celkový počet: **28 kroků** (ověřeno: `TOTAL_STEPS = WORKFLOW_PHASES.reduce(...)` na řádku 111)
- Workflow pokrývá celý cyklus: první kontakt (1.1) → záloha fotek (9.1) ✅

### KB2: Interaktivní checklist v PWA ✅

- `WorkflowChecklist.tsx:141-391` — plně interaktivní komponenta:
  - **Accordion** — fáze se rozbalují kliknutím (expandedPhase state)
  - **Checkboxy** — manuální toggle per krok (toggleStep callback)
  - **Progress bar** — celkový postup X/28 s procentem
  - **"Další krok"** — oranžový box s doporučeným dalším krokem
  - **Barevné kódování fází**: zelená (hotovo), oranžová (rozpracováno), šedá (nezačato)
  - **Okamžitý save** — každý toggle okamžitě PUT na API
- Integrace: `VehicleDetailHub.tsx:329-340` — checklist renderován na detail vozidla

### KB3: Auto-check z dat v systému ✅

- `WorkflowChecklist.tsx:162-175` — `isStepDone()` + `isAutoChecked()`:
  - Pokud step má `autoCheckKey` a `autoChecks[key]` je true → automaticky zaškrtnuto
  - Auto-checked kroky nelze manuálně odškrtnout (řádek 180)
  - Vizuální odlišení: modrý checkbox + "Ověřeno systémem" label (řádky 348-379)
- `VehicleDetailHub.tsx:331-339` — 7 auto-check podmínek:

| Auto-check key | Podmínka | Krok |
|---|---|---|
| hasContact | `!!vehicle.sellerPhone` | 1.1 |
| hasBasicInfo | `!!vehicle.brand && !!vehicle.model` | 1.2 |
| hasVin | `!!vehicle.vin && vin.length === 17` | 5.1 |
| hasDescription | `description.length >= 20` | 5.3 |
| hasPrice | `vehicle.price > 0` | 6.1 |
| hasSigned | `contracts.some(c => c.status === "SIGNED")` | 6.3 |
| isActive | `vehicle.status === "ACTIVE"` | 8.3 |

- **Poznámka:** 3 foto auto-check keys (`hasExteriorPhotos`, `hasInteriorPhotos`, `hasEvidencePhotos`) jsou definovány v krocích 4.1-4.3 ale nejsou předány z VehicleDetailHub. Tyto kroky vyžadují manuální zaškrtnutí. Nefunkční auto-check, ale neblokující — workflow je plně funkční i bez nich. Doporučuji doplnit v budoucnu.

### KB4: Žádný Autorro obsah ✅

- Grep `autorro` (case-insensitive) v `**/*.{ts,tsx}`: **0 výskytů**
- Workflow texty jsou originální (české, specifické pro Carmakler workflow)
- Žádné reference na Autorro, Trello, nebo externí služby v komponentě

### KB5: DB migrace nullable (neblokující) ✅

- `prisma/migrations/20260412090835_add_workflow_checklist/migration.sql`:
  ```sql
  ALTER TABLE "Vehicle" ADD COLUMN "workflowChecklist" TEXT;
  ```
  - `TEXT` bez `NOT NULL` → **nullable** ✅
  - Žádný `DEFAULT` → existující záznamy dostanou `NULL` ✅
  - Neblokující pro existující data ✅
- `prisma/schema.prisma:284`: `workflowChecklist String?` — `?` = optional ✅
- `workflow/route.ts:34-36` — GET handler: pokud `null` → vrátí prázdný objekt `{ steps: {}, lastUpdated: ... }` ✅

---

## 2. Soubory — souhrn

| Akce | Soubor | Lines | Popis |
|------|--------|-------|-------|
| NEW | `components/pwa/vehicles/WorkflowChecklist.tsx` | 391 | Hlavní checklist komponenta (9 fází, 28 kroků) |
| NEW | `app/api/vehicles/[id]/workflow/route.ts` | 82 | GET/PUT API pro checklist data |
| NEW | `prisma/migrations/20260412.../migration.sql` | 3 | ALTER TABLE: nullable TEXT column |
| EDIT | `prisma/schema.prisma` | +1 | `workflowChecklist String?` |
| EDIT | `components/pwa/vehicles/VehicleDetailHub.tsx` | +20 | Import + render WorkflowChecklist s autoChecks |

---

## 3. Bezpečnost API

- `workflow/route.ts:26-32` (GET) + `:62-68` (PUT) — ownership check:
  - `brokerId === session.user.id` NEBO role `ADMIN`/`BACKOFFICE`
  - 401 pro nepřihlášené, 403 pro neoprávněné, 404 pro neexistující ✅

---

## 4. Scope creep kontrola

- ✅ Žádné dotčení existujících features
- ✅ Žádné dotčení middleware/auth
- ✅ DB migrace je additivní (nový nullable sloupec)
- ✅ Protected systems nedotčeny (upload, Stripe, contracts)

---

## 5. Drobné doporučení (NE blokující)

| # | Popis | Závažnost |
|---|-------|-----------|
| 1 | Auto-check pro foto kroky (4.1-4.3) nejsou zapojeny | Low — manuální check funguje |

---

## Celkový souhrn

| Kontrolní bod | Verdikt |
|---|---|
| 1. Kompletní workflow kontakt→záloha | ✅ (9 fází, 28 kroků) |
| 2. Interaktivní checklist v PWA | ✅ (accordion, checkboxy, progress, auto-save) |
| 3. Auto-check z dat v systému | ✅ (7/10 keys zapojeno, 3 foto keys neblokující) |
| 4. Žádný Autorro obsah | ✅ (0 výskytů v .ts/.tsx) |
| 5. DB migrace nullable | ✅ (TEXT bez NOT NULL, String? v schema) |

### ✅ SCHVÁLENO — Workflow checklist pro makléře připraven
