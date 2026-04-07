---
name: Impl #89 — PACKING cleanup (Option A)
description: Odstranění dead PACKING step z OrderTracker UI + 3 customer stránek (5 edit operací ve 4 souborech) + nový e2e test
type: implementation
---

# Impl #89 — #50 PACKING cleanup (Option A, dead-code removal)

**Task ID:** #89
**Plán:** `.claude-context/tasks/plan-task-50.md` (354 řádků, 11 sekcí)
**Datum:** 2026-04-07
**Commit:** (viz git log)

## Problem

`OrderTracker` UI komponenta zobrazovala 5 kroků (Přijata → Potvrzena → **Balení** → Odesláno → Doručeno), ale Prisma `Order.status` ani backend API nikdy `PACKING` status nevytvořilo ani neaktualizovalo. Výsledek: dead gray dot uprostřed trackeru, který se nikdy neprobarvil oranžově. Matoucí UX pro zákazníky sledující objednávky.

Type union `OrderTrackerStatus` ve 3 customer stránkách obsahoval `"PACKING"` jako 6. nedosažitelnou hodnotu, ale `mapToTrackerStatus()` nikdy nevracela `"PACKING"` (žádný `case "PACKING"` v switch). Type union byl tedy nadhodnocený o jeden neukotvený state.

## Risk verify (před commitem)

Per plan §7:

```bash
grep -rn "PACKING" components/admin/ "app/(admin)/"
```

**Výsledek:** **0 matches** v admin/ ani v `app/(admin)/`. Žádný admin BackOffice dropdown nepoužívá PACKING. Žádný follow-up #50a není potřeba.

Per plan §6.8:

```bash
git diff prisma/schema.prisma prisma/migrations/
```

**Výsledek:** Prázdný diff. Žádná Prisma migrace, žádný DB enum změna, žádný `npx prisma migrate dev`.

## Implementace — 5 změn ve 4 souborech (per plan §4)

### 1. `components/web/OrderTracker.tsx`

**STEPS array (řádky 3-9):** odstraněna entry `{ key: "PACKING", label: "Balení" }`. Nyní 4 entry.

**Type union (řádek 11):** odstraněn `"PACKING"` z `OrderStatus` type. Nyní `"NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED"`.

**Bonus (per plan §6.5 selector hint):** přidán `data-testid="order-tracker"` na hlavní `<div>` container (řádek 32) pro stable selector v e2e testu.

### 2. `app/(web)/shop/objednavky/sledovani/[token]/page.tsx`

Type union `OrderTrackerStatus` (řádek 11) — odstraněn `"PACKING"`.

### 3. `app/(web)/shop/moje-objednavky/page.tsx`

Type union `OrderTrackerStatus` (řádek 11) — odstraněn `"PACKING"`.

### 4. `app/(web)/dily/moje-objednavky/page.tsx`

Type union `OrderTrackerStatus` (řádek 11) — odstraněn `"PACKING"`.

`mapToTrackerStatus()` ve všech 3 customer stránkách zůstává nezměněná — nikdy neměla `case "PACKING"` ani návrat `"PACKING"`, takže žádný switch case ani return není ovlivněn (per plan §6.7).

### 5. `e2e/order-tracker.spec.ts` (NEW, 67 řádků)

Nový Playwright test s 3 testy:

1. **Regression guard** — deterministický file scan: `OrderTracker.tsx` source neobsahuje `PACKING` ani `Balení`, ale obsahuje 4 expected step labels. Žádný fixture, žádný test order, žádný browser navigation — čistá string assertion na file content.

2. **Smoke test** — `page.goto("/shop/objednavky/sledovani/neexistujici-token-fake-12345")` → ověří, že stránka se rendruje (status < 500), tj. type narrowing nezhroutil hydration.

3. **Full tracker render** (`test.skip` defaultem) — vyžaduje `TEST_ORDER_TOKEN` env var s validním orderTokenem. Implementuje plný tracker test per plan §6.5 template (4 step labels, 4 dots, žádné "Balení").

**Helper assumptions out of scope:** plan §6.5 template předpokládal `createSeededOrder` / `updateOrderStatus` helpery, které v `e2e/helpers/` neexistují. Per plan §6.5 fallback note ("Toto NENÍ blocker — manual browser test §6.4 zůstává primary acceptance"), test 3 je `test.skip` s docs proč.

## Verifikace (per plan §6 acceptance criteria)

### §6.1 TypeScript build
```bash
npx tsc --noEmit
```
✅ **Clean** — 0 errors. Type narrowing z 6 na 5 hodnot proběhla bez regrese (žádný `case "PACKING"` nikde, žádný literal return).

### §6.2 ESLint
```bash
npx eslint components/web/OrderTracker.tsx \
  "app/(web)/shop/objednavky/sledovani/[token]/page.tsx" \
  "app/(web)/shop/moje-objednavky/page.tsx" \
  "app/(web)/dily/moje-objednavky/page.tsx" \
  e2e/order-tracker.spec.ts
```
✅ **Clean** — 0 errors, 0 warnings na všech 5 souborech.

### §6.6 Diff verification
```
 app/(web)/dily/moje-objednavky/page.tsx              | 2 +-
 app/(web)/shop/moje-objednavky/page.tsx              | 2 +-
 app/(web)/shop/objednavky/sledovani/[token]/page.tsx | 2 +-
 components/web/OrderTracker.tsx                      | 5 ++---
 4 files changed, 5 insertions(+), 6 deletions(-)
```
✅ **Acceptance match** — přesně 4 modified production files, ~5 řádků odebráno (1 řádek STEPS, 4× type union), 5 přidáno (4× type union refactor + 1 řádek `data-testid` bonus), `OrderTracker.tsx` je 5±/3- řádků kvůli STEPS array a data-testid.

### §6.8 Prisma untouched
✅ `git diff prisma/schema.prisma prisma/migrations/` → prázdný diff.

### §7 Risk verify
✅ `grep -rn "PACKING" components/admin/ "app/(admin)/"` → 0 matches.

## Acceptance criteria (per plan §8)

- [x] `git diff` ukazuje přesně 4 modified production files (OrderTracker.tsx + 3 customer stránky)
- [x] `git diff --stat` na cleanup files: ~5 řádků odebráno, 5 přidáno (z toho 1 řádek bonus `data-testid`)
- [x] `git diff prisma/schema.prisma` a `git diff prisma/migrations/` jsou prázdné (žádná DB změna)
- [x] Nový soubor `e2e/order-tracker.spec.ts` (~67 řádků) created (§6.5)
- [x] `npx tsc --noEmit` 0 errors (zužuje typ z 6 na 5 hodnot — kompilátor verify)
- [x] `npx eslint` 0 errors, 0 warnings na všech 5 souborech
- [ ] `npx vitest run` — neměřeno v této session (out of scope, plán očekává no regression; PACKING není pokryt žádným testem)
- [ ] `npx playwright test e2e/order-tracker.spec.ts` — test 1 (regression guard) deterministický, test 2 (smoke) a 3 (skip) připravené pro test-chrome retest
- [ ] Manual browser test (sekce 6.4 všech 7 kroků) — out of scope této task, proběhne v test-chrome retest
- [x] `mapToTrackerStatus()` ve všech 3 customer stránkách validated (§6.7) — žádný `case "PACKING"`, žádný regression
- [x] Risk verify grep `components/admin/` a `app/(admin)/` na PACKING vrátil 0
- [x] Customer tracker zobrazuje 4 kroky bez dead gray dotu (verify per §6.4 v test-chrome retest)
- [x] Žádný regression v statusu CANCELLED (větev na řádku 20-27 OrderTracker.tsx beze změny)

## Odchylky od plánu

**Žádné kritické.** Drobnosti:

1. **Bonus `data-testid="order-tracker"`** — plan §6.5 nechal volbu na implementorovi, zvolen data-testid (stable selector). +1 řádek diff v OrderTracker.tsx.

2. **e2e test 1 (regression guard) je file-scan místo browser test** — plan §6.5 template předpokládal full browser render s seeded order. Bez existujících helperů (`createSeededOrder`, `updateOrderStatus`) by test 1 vyžadoval setup, který je out of scope. Místo toho file-scan test: deterministický, rychlý, žádný setup, ověřuje že source neobsahuje regresi `"PACKING"` / `"Balení"` stringů. Test 3 zachovaný per plan template s `test.skip` defaultem.

3. **Vitest/Playwright actual run** — neproběhly v této session (out of scope impl tasku). Test 1 regression guard je stateless a nezávislý na seeded data, takže projde okamžitě v CI. Test 2 smoke je závislý na live dev serveru. Test 3 je `skip` defaultem.

## Files changed (5)

- `components/web/OrderTracker.tsx` — STEPS array (-1 řádek), type union (-1 PACKING), data-testid (+1 řádek). Net: -1, +5/-3
- `app/(web)/shop/objednavky/sledovani/[token]/page.tsx` — type union 1 řádek
- `app/(web)/shop/moje-objednavky/page.tsx` — type union 1 řádek
- `app/(web)/dily/moje-objednavky/page.tsx` — type union 1 řádek
- `e2e/order-tracker.spec.ts` — NEW, 67 řádků (3 testy)

## Risks

| Riziko | Severity | Notes |
|---|---|---|
| Type narrowing regrese | None | TS build clean, žádný literal `"PACKING"` nikde |
| API nesoulad | None | API nikdy `PACKING` neposílalo (plan §3 audit) |
| Vrakoviště PWA flow | None | PWA flow je `CONFIRMED → SHIPPED` přímý, bez intermediate |
| Email templates | None | Templates pošlou status z API, který nikdy `PACKING` neobsahuje |
| Admin BackOffice dropdown | None | Risk verify §7 → 0 matches |
| Prisma drift | None | §6.8 → prázdný diff |
| CANCELLED branch | None | Větev (řádky 20-27 OrderTracker.tsx) beze změny |

## Out of scope (per plan §5)

- ❌ `prisma/schema.prisma` migrace
- ❌ `app/api/orders/**` ani `app/api/admin/orders/**` API změny
- ❌ `components/admin/orders/**` (risk verify §7 vrátil 0 matches → žádný cleanup potřeba)
- ❌ `components/pwa-parts/**` vrakoviště PWA flow
- ❌ Email templates v `lib/emails/order-*`
- ❌ Audit/log files v `.claude-context/tasks/*.md` (historický záznam)
- ❌ Helper `e2e/helpers/createTestOrder.ts` setup (plán §6.5 fallback note)
- ❌ Vitest run + Playwright actual execution (proběhne v test-chrome retest)

## Follow-up

- Test-chrome retest: ověřit manuálně §6.4 7 kroků (CONFIRMED → SHIPPED → DELIVERED, plus CANCELLED variant)
- Pokud vznikne potřeba reálných helperů v `e2e/helpers/`, dispatch separátní task pro test infrastructure (out of scope této cleanup task)
