# Evžen Review #7 — TASK-020 gap-fix #184 (manufacturer, warranty, WHOLESALE_SUPPLIER)

**Datum:** 2026-04-11
**Reviewer:** Evžen THE KING
**Implementace:** `.claude-context/tasks/impl-task-184-182.md` (commits 9dfadde–1b539a3)
**Plán:** `.claude-context/tasks/plan-task-182-eshop-dily-gap.md`
**QA report:** `.claude-context/tasks/qa-task-185-182.md` (14/14 ✅)

---

## VERDIKT: ✅ SCHVÁLENO — Implementace přesně odpovídá zadání TASK-020

---

## 1. Kontrola: Původní zadání TASK-020 vs implementace

### Původní zadání (TASK-QUEUE.md řádky 1740-1938)

TASK-020 specifikuje 3 konkrétní položky v sekci "Rozšíření Part modelu" (řádky 1944-1945):
- `manufacturer (String?)` — výrobce dílu (TRW, Bosch, LUK...)
- `warranty (String?)` — záruka ("24 měsíců")

Plus v sekci "Velcí dodavatelé" (řádek 1831):
- `WHOLESALE_SUPPLIER` — nová role pro velkoobchodní dodavatele

### QA gap report (QA-TASK-019-020.md, 2026-04-04)

QA identifikoval přesně tyto 3 gapy:
1. ❌ `WHOLESALE_SUPPLIER` role — 0 výskytů v kódu
2. ❌ `Part.manufacturer` — chybí
3. ❌ `Part.warranty` — chybí

### Ověření kódem — bod po bodu

| # | Acceptance Criterion | Verdikt | Ověřeno v souboru |
|---|---|---|---|
| AC1 | `Part.manufacturer String?` + `Part.warranty String?` v schema | ✅ | `prisma/schema.prisma:906-907` + `@@index([manufacturer])` na :958 |
| AC2 | `UserRole` comment obsahuje `WHOLESALE_SUPPLIER` | ✅ | `prisma/schema.prisma:21` |
| AC3 | `middleware.ts` `PARTS_SUPPLIER_ROLES` obsahuje `WHOLESALE_SUPPLIER` | ✅ | `middleware.ts:16` |
| AC4 | `createPartSchema` + `updatePartSchema` akceptují manufacturer (max 100) + warranty (max 50) | ✅ | `lib/validators/parts.ts:18-19` |
| AC5 | `partFilterSchema` + `GET /api/parts` podporují manufacturer filter (ILIKE) | ✅ | `lib/validators/parts.ts:51`, `api/parts/route.ts:105-106,134` |
| AC6 | `POST /api/parts` ukládá manufacturer + warranty z body | ✅ | `api/parts/route.ts:43-44` |
| AC7 | `PUT /api/parts/[id]` akceptuje update polí | ✅ | Via `updatePartSchema = createPartSchema.partial()` |
| AC8 | `POST /api/parts` + `POST /api/parts/import` allowedRoles obsahují `WHOLESALE_SUPPLIER` | ✅ | `api/parts/route.ts:21`, `api/parts/import/route.ts:61` |
| AC9 | `DetailsStep` wizard: manufacturer Input field | ✅ | `components/pwa-parts/parts/DetailsStep.tsx:172-173`, initial state `parts/new/page.tsx:25` |
| AC10 | `PricingStep` wizard: warranty Input field | ✅ | `components/pwa-parts/parts/PricingStep.tsx:136-137`, initial state `parts/new/page.tsx:33` |
| AC11 | `/dily/[slug]/page.tsx` zobrazuje manufacturer + warranty (conditional) | ✅ | `app/(web)/dily/[slug]/page.tsx:235-254` — container hidden pokud `!manufacturer && !warranty` |
| AC12 | `/dily/katalog/page.tsx` manufacturer filter input + URLSearchParams | ✅ | `app/(web)/dily/katalog/page.tsx:91,110,129,186` |
| AC13 | Seed: 1× WHOLESALE_SUPPLIER user + 3 sample Parts s manufacturer + warranty | ✅ | `prisma/seed.ts:1766` (role), `:1784-1785`, `:1808-1809`, `:1832-1833` |
| AC14 | 1× E2E test `e2e/parts-wholesale.spec.ts` | ✅ | 4 Chromium testy: login, wizard access, katalog filter, detail render |

**Celkem: 14/14 ✅**

---

## 2. Kontrola konzistence se spec

| Spec požadavek | Implementace | Shoda |
|---|---|---|
| "Nová role: WHOLESALE_SUPPLIER" (ř. 1831) | Přidána do schema comment + middleware + 2 API routes + import route + login page + seed | ✅ |
| "Přidat pole manufacturer (String?)" (ř. 1944) | Schema + B-tree index + Zod max(100) + API ILIKE filter + wizard input + katalog filter + detail render | ✅ |
| "Přidat pole warranty (String?)" (ř. 1945) | Schema + Zod max(50) + wizard input + detail render | ✅ |
| "U aftermarket dílů: výrobce dílu, záruka" (ř. 1875) | Detail page zobrazuje oba pokud jsou vyplněné, pro jakýkoliv typ dílu (lepší než spec) | ✅ |
| Phase B items (TecDoc, drop-shipping, B2B pricing) | Správně odloženy, žádné touches | ✅ |

---

## 3. Scope creep kontrola

- ✅ Žádné Phase B touches
- ✅ Protected systems nedotčeny (Stripe webhook, admin partners, listings, orders)
- ✅ Žádné nové lint errors z #184 souborů
- ✅ Žádné neoznámené přidané funkce

---

## 4. Bonus: Propagace WHOLESALE_SUPPLIER

Ověřil jsem kompletní řetězec:
- `prisma/schema.prisma:21` — role comment ✅
- `middleware.ts:16` — PARTS_SUPPLIER_ROLES ✅
- `app/api/parts/route.ts:21` — POST allowedRoles ✅
- `app/api/parts/import/route.ts:61` — import allowedRoles ✅
- `app/api/auth/supplier-onboarding/route.ts:6` — onboarding roles ✅
- `app/(web)/login/page.tsx:77` — login redirect case ✅
- `prisma/seed.ts:1766` — seed user ✅

Konzistentní na všech 7 místech.

---

## 5. Minor observation (přejímám z QA)

**OBS-1:** Middleware unit test (`__tests__/middleware.test.ts`) nerozšířen o WHOLESALE_SUPPLIER. E2E pokrývá (T1). Non-blocker, nice-to-have pro future chore.

---

## 6. CELKOVÝ SOUHRN

| Kategorie | Výsledek |
|---|---|
| AC splnění | 14/14 ✅ |
| Shoda s původním zadáním TASK-020 | ✅ Přesná |
| Scope creep | ✅ Žádný |
| Protected systems | ✅ Nedotčeny |
| Blockery | 0 |
| Minor | 1 (middleware test — non-blocker) |

### ✅ SCHVÁLENO — Pipeline pokračuje na #187 test-chrome
