# Impl #60a — FIX middleware PARTS_SUPPLIER_ROLES whitelist (BUG #1)

**Task ID:** #61
**Plán:** `.claude-context/tasks/plan-task-60.md` sekce „BUG #1"
**Datum:** 2026-04-06
**Commit:** (viz git log)

## Problem

`middleware.ts:15` definovala:
```ts
const PARTS_SUPPLIER_ROLES = ["PARTS_SUPPLIER", "ADMIN", "BACKOFFICE"];
```

Chyběla role `PARTNER_VRAKOVISTE`. Důsledek: uživatel zaregistrovaný přes `/registrace/partner?type=VRAKOVISTE` má v DB `role: PARTNER_VRAKOVISTE` a po loginu **nemůže přistoupit k `/parts/*`** — middleware ho vrátí na `/`. Celý vrakoviště PWA flow byl nedostupný.

## Fix

### 1. `middleware.ts:15` (primary fix)

```ts
const PARTS_SUPPLIER_ROLES = ["PARTS_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"];
```

### 2. `app/api/parts/import/route.ts:59` (konzistence — bonus)

Per task instrukce „grep konzistence v ostatních gate checks" jsem našel druhou stejnou inkonzistenci v API endpointu pro CSV import dílů:

```ts
// Před:
const allowedRoles = ["PARTS_SUPPLIER", "ADMIN", "BACKOFFICE"];
// Po:
const allowedRoles = ["PARTS_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"];
```

Bez fixu by registrovaný PARTNER_VRAKOVISTE prošel middleware (po fixu #1), ale nemohl by používat CSV import. Ve scope BUG #1 to není explicitně, ale jde o stejnou logickou chybu.

## Audit ostatních gate checks

| Soubor | Gate pattern | Stav |
|---|---|---|
| `middleware.ts` | `PARTS_SUPPLIER_ROLES` whitelist | ✅ FIXED |
| `app/api/parts/route.ts:21` | `allowedRoles` whitelist | ✅ Already correct (oba PARTS_SUPPLIER + PARTNER_VRAKOVISTE) |
| `app/api/parts/import/route.ts:59` | `allowedRoles` whitelist | ✅ FIXED (bonus) |
| `app/api/parts/[id]/route.ts:80,149` | `isAdmin \|\| ownership` (`supplierId === session.user.id`) | ✅ Role-agnostic (owner-based), funguje pro libovolnou roli |
| `app/api/parts/compatible/route.ts` | žádný role check | ✅ Public |
| `app/api/parts/for-vehicle/route.ts` | žádný role check | ✅ Public |
| `app/api/parts/supplier-stats/route.ts` | žádný role check | ✅ Session-based, role-agnostic |
| `app/(pwa-parts)/layout.tsx` | žádný layout-level gate | ✅ Spoléhá na middleware |
| `app/(pwa-parts)/parts/new/layout.tsx` | žádný layout-level gate | ✅ Spoléhá na middleware |

**Konzistence audit hotový — žádné další chybějící whitelisty pro `PARTNER_VRAKOVISTE` v `/parts/*` flow.**

## Verifikace

- ✅ `prisma/schema.prisma:21` — `PARTNER_VRAKOVISTE` je dokumentovaný v komentáři u User.role (string field s enum hodnotami)
- ✅ `npx tsc --noEmit` — clean (žádné errors)
- ✅ `npx eslint middleware.ts app/api/parts/import/route.ts` — 2 pre-existing warnings (`INZERENT_ROLES`, `BUYER_ROLES` unused), 0 errors
- ✅ Per-file scoped — pouze 2 řádky změn, žádný regresní risk

## Acceptance criteria (z plánu sekce 10)

- [x] `PARTNER_VRAKOVISTE` v `PARTS_SUPPLIER_ROLES` middleware whitelistu
- [x] Konzistence check ostatních gate pointů hotový
- [x] tsc/lint clean

## Odchylky od plánu

- **Bonus fix v `app/api/parts/import/route.ts`** — nebylo explicitně v BUG #1 scope, ale audit instrukce v task assignment-u řekl „ověř konzistenci v ostatních gate checks (...API routes)". Když jsem našel stejnou inkonzistenci, bylo by polovičaté ji nechat — fixoval jsem a označil jako bonus konzistence fix.

## Files changed (2)

- `middleware.ts` — 1 řádek
- `app/api/parts/import/route.ts` — 1 řádek

## Risks

| Riziko | Severity | Notes |
|---|---|---|
| Regresní risk | None | Whitelist expansion = additive change, žádné existující chování se nemění |
| Nový role gap | Low | Audit prošel všech 6 parts API routes + layout.tsx + middleware |
| Backoffice approval flow | Out of scope | Plán flagoval jako separátní open issue (sekce 11.1 #1) — pokud PARTNER_VRAKOVISTE má status PENDING, login stejně nepovolí; tento fix odblokuje až po activate |

## Follow-up (mimo scope)

- BUG #2 (#62) — PhotoStep Cloudinary upload v `app/(pwa-parts)/parts/new/page.tsx`
- BUG #3 (#63) — `/registrace` rozcestník přidat dlaždici „Dodavatel dílů"
- Backoffice approval UI pro PARTNER_VRAKOVISTE (open question z plánu 11.1 #1)
