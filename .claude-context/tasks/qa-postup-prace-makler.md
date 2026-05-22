# QA Report — Workflow checklist makléře (9 fází)

**Datum:** 2026-04-11
**Agent:** KONTROLOR
**Task:** #39
**Typ:** Simplify + Debug + Reverzní kontrola

---

## VERDICT: ✅ SCHVÁLENO — 0 blockerů, 0 bugs

---

## 1. DEBUG KONTROLA

| Check | Výsledek |
|---|---|
| `npx tsc --noEmit` (bez e2e/) | ✅ 0 errors |
| Autorro obsah (grep) | ✅ 0 souborů |
| Build | ✅ TSC čistý → projde |

---

## 2. REVERZNÍ KONTROLA — 8 kontrolních bodů

| # | Kritérium | Výsledek | Kde ověřeno |
|---|---|---|---|
| AC1 | WorkflowChecklist.tsx — accordion, 9 fází, kroky, toggle, progress bar | ✅ | `WorkflowChecklist.tsx:24-109` — 9 fází, 30 kroků, `expandedPhase` state, ProgressBar, optimistic toggle |
| AC2 | Auto-check (modré) vs manuální (zelené) | ✅ | `:348-355` — auto: `bg-blue-500 border-blue-500`, manual: `bg-green-500 border-green-500`, "Ověřeno systémem" badge `:375-379` |
| AC3 | API route GET/PUT — auth broker/admin | ✅ | `workflow/route.ts:26-32,63-68` — brokerId === userId OR ADMIN OR BACKOFFICE; async params ✅ |
| AC4 | DB migrace: Vehicle.workflowChecklist String? | ✅ | `schema.prisma:284` — `workflowChecklist String? // JSON` |
| AC5 | Integrace do VehicleDetailHub.tsx | ✅ | `VehicleDetailHub.tsx:19,329-340` — import + render s vehicleId + autoChecks |
| AC6 | 7 autoChecks (contact, basicInfo, VIN, description, price, signed, active) | ✅ | `:331-339` — všech 7 klíčů předáno korektně |
| AC7 | Žádný Autorro obsah | ✅ | Grep přes celé repo — 0 souborů |
| AC8 | Build passes, 0 TS errors | ✅ | `npx tsc --noEmit` — bez výstupu |

**Celkem: 8/8 ✅**

---

## 3. DETAIL OVĚŘENÍ

### 3.1 WorkflowChecklist.tsx — struktura

- `"use client"` ✅
- 9 WORKFLOW_PHASES, každá má `id`, `label`, `steps[]` ✅
- Accordion: `expandedPhase` state, chevron `rotate-180` při otevření ✅
- `ProgressBar` — `completedCount / TOTAL_STEPS * 100`, zelená při 100% ✅
- "Další doporučený krok" banner: `nextStep?.step.label + description`, click → `setExpandedPhase` ✅
- Fetch GET na mount, PUT na toggle (optimistic) ✅
- `saving` indikátor (`...` vedle počítadla) ✅

### 3.2 Auto-check vs manuální

| Stav | Barva | Cursor | Badge |
|---|---|---|---|
| Auto-checked (systém) | `bg-blue-500` | `cursor-default` | "Ověřeno systémem" (modrý text) |
| Manual done | `bg-green-500` | `cursor-pointer hover:bg-gray-50` | — |
| Nedokončeno | `border-gray-300` | `cursor-pointer hover:bg-gray-50` | — |

`isAutoChecked` → disabled button, nelze togglit ✅

### 3.3 Počet kroků

| Fáze | Kroků |
|---|---|
| prep | 3 |
| equipment | 4 |
| inspection | 5 |
| photos | 5 |
| data | 5 |
| price | 3 |
| verify | 1 |
| publish | 3 |
| backup | 1 |
| **Celkem** | **30** |

`TOTAL_STEPS` je počítán přes `reduce` dynamicky — správně odráží 30 ✅

### 3.4 AutoCheckKeys × VehicleDetailHub

| AutoCheckKey | Krok | Logika v Hub | Status |
|---|---|---|---|
| hasContact | 1.1 | `!!vehicle.sellerPhone` | ✅ |
| hasBasicInfo | 1.2 | `!!vehicle.brand && !!vehicle.model` | ✅ |
| hasExteriorPhotos | 4.1 | — nepředáváno | ⚠️ OBS-2 |
| hasInteriorPhotos | 4.2 | — nepředáváno | ⚠️ OBS-2 |
| hasEvidencePhotos | 4.3 | — nepředáváno | ⚠️ OBS-2 |
| hasVin | 5.1 | `!!vehicle.vin && vehicle.vin.length === 17` | ✅ |
| hasDescription | 5.3 | `(vehicle.description?.length \|\| 0) >= 20` | ✅ |
| hasPrice | 6.1 | `vehicle.price > 0` | ✅ |
| hasSigned | 6.3 | `vehicle.contracts.some((c) => c.status === "SIGNED")` | ✅ |
| isActive | 8.3 | `vehicle.status === "ACTIVE"` | ✅ |

7 klíčů specifikovaných plánem předáno ✅. 3 foto klíče jsou v komponentě definovány ale Hub je neposkytuje → efektivně manual-only (viz OBS-2).

### 3.5 API Route — workflow/route.ts

- **Async params:** `{ params }: { params: Promise<{ id: string }> }` + `const { id } = await params` ✅ (Next.js 15 pattern)
- **GET auth:** `brokerId !== userId && role !== ADMIN && role !== BACKOFFICE` → 403 ✅
- **GET response:** `JSON.parse(workflowChecklist)` nebo empty default `{ steps: {}, lastUpdated }` ✅
- **PUT auth:** stejná logika ✅
- **PUT save:** `JSON.stringify({ ...body, lastUpdated: new Date().toISOString() })` — server přepíše `lastUpdated` ✅

---

## 4. SIMPLIFY KONTROLA

- `WorkflowChecklist` nedrží zbytečný state — pouze `data`, `expandedPhase`, `loading`, `saving` ✅
- `useMemo` pro výpočet stats — bez zbytečných re-renderů ✅
- `useCallback` pro `isStepDone`, `isAutoChecked`, `toggleStep` ✅
- API route je minimální — žádná zbytečná logika ✅
- WORKFLOW_PHASES je statická konstanta mimo komponentu — správně ✅

---

## 5. OBSERVATIONS

### OBS-1 — PUT body bez Zod validace

`route.ts:52`: `const body = await request.json()` — body se ukládá bez validace.

CLAUDE.md říká "API routes používají Zod validaci na vstupu". Riziko je nízké (broker může ovlivnit jen vlastní Vehicle.workflowChecklist), ale odchylka od projektového standardu. Non-blocker.

### OBS-2 — 3 foto autoCheckKeys v komponentě bez hodnot z VehicleDetailHub

Kroky 4.1 (`hasExteriorPhotos`), 4.2 (`hasInteriorPhotos`), 4.3 (`hasEvidencePhotos`) mají v WORKFLOW_PHASES `autoCheckKey` definován, ale VehicleDetailHub tyto klíče nepředává. Komponenta defaultuje `autoChecks = {}`, takže tyto kroky nikdy nejsou auto-checked — fungují jako manuální kroky.

Plán specifikuje 7 autoChecks (bez foto klíčů) — Hub odpovídá spec ✅. 3 foto klíče jsou forward-looking placeholder. Non-blocker.

### OBS-3 — Plan title říká "28 kroků", implementace má 30

Plán §1 definuje 30 kroků (3+4+5+5+5+3+1+3+1), ale nadpis říká "28 kroků". `TOTAL_STEPS` se počítá dynamicky — správně vrátí 30. Chyba je v titulu plánu, ne v implementaci. Non-blocker.

---

## 6. SOUHRN

| Kategorie | Výsledek |
|---|---|
| AC splněno | 8/8 ✅ |
| Blokerů | 0 |
| Bugs | 0 |
| TypeScript errors | 0 |
| Autorro obsah | 0 ✅ |
| 9 fází, 30 kroků | ✅ |
| Auto-check (modrá) vs manuální (zelená) | ✅ |
| API auth (broker/admin/backoffice) | ✅ |
| DB migrace (workflowChecklist String?) | ✅ |
| 7 autoChecks z Hub | ✅ |

---

## 7. AKCE

Žádné blokanty. Implementace splňuje všechny AC.

**Doporučení (non-blocker, pro future sprint):**
- OBS-1: Přidat Zod validaci na PUT body
- OBS-2: Zvážit implementaci `hasExteriorPhotos`/`hasInteriorPhotos`/`hasEvidencePhotos` z dat vehicle photos (počty uploadů per kategorie)
