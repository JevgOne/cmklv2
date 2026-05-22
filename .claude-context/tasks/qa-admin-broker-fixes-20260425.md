# QA — Admin Broker Detail/Edit Opravy
**Datum:** 2026-04-25
**Kontrolor:** kontrolor
**Zdroj:** impl-admin-broker-fixes-20260425.md

---

## 1. Simplify kontrola

### `app/(admin)/admin/brokers/[id]/page.tsx`
- Server Component s `force-dynamic` ✅
- Auth guard přes `redirect("/login")` ✅
- Prisma queries: 1x `findFirst` + 2x `findMany` (vehicles, commissions) — správné pořadí, žádné N+1 ✅
- `statusInfo` a `vehicleStatusMap` jako lookup objekty — čisté ✅
- Lokální výpočty (`totalCommissionAmount`, `paidTotal`) přehledné ✅
- **Žádná zbytečná složitost, žádné duplicity**

### `app/(admin)/admin/brokers/[id]/edit/page.tsx`
- Tenký Server Component — fetchuje, předává data do `BrokerEditForm` ✅
- JSON.parse pro `specializations`/`cities` správně ošetřen (`?? []`) ✅
- **Čistý, bez duplicit**

### `components/admin/BrokerEditForm.tsx`
- 10 useState hooků — akceptovatelné pro rozsah formuláře (10 editovatelných polí), konzistentní se zbytkem projektu ✅
- Inline cities/specializations parsing (split+trim+filter) — správné ✅
- Error handling: `res.json().catch(() => ({}))` — bezpečné ✅
- **Žádné zbytečné duplicity**

### `app/api/admin/brokers/[id]/route.ts`
- `ALLOWED_ROLES` konstantní array — správné ✅
- GET: Prisma `findFirst` s `select` (minimální data) ✅
- PATCH: ruční `updateData` buildení — bezpečný přístup, neprůchod undefined hodnot ✅
- Zod validace: `updateBrokerSchema` s `.optional()` pro všechna pole ✅
- ZodError handling oddělený od obecné chyby ✅
- **API čistá, bez zbytečné složitosti**

---

## 2. Debug kontrola

### TypeScript (`npx tsc --noEmit`)
| Soubor | Výsledek |
|--------|----------|
| `app/(admin)/admin/brokers/[id]/page.tsx` | ✅ 0 chyb |
| `app/(admin)/admin/brokers/[id]/edit/page.tsx` | ✅ 0 chyb |
| `components/admin/BrokerEditForm.tsx` | ✅ 0 chyb |
| `app/api/admin/brokers/[id]/route.ts` | ✅ 0 chyb |

*Pre-existing chyby: 4 errory v e2e testech (scrollIntoView, implicit any) — nesouvisí s implementací.*

### Build (`npm run build`)
- První run: ENOENT chyba (stale `.next` cache) — **pre-existing issue, nesouvisí s implementací**
- Po `rm -rf .next`: ✅ **Build úspěšný — 1281/1281 stránek**
- `/admin/brokers/[id]` — ƒ dynamická route ✅
- `/admin/brokers/[id]/edit` — ƒ dynamická route ✅
- `/api/admin/brokers/[id]` — ƒ API route ✅
- Warning: `middleware` deprecated → `proxy` — pre-existing, nesouvisí

### Komponenty (existují a mají správné varianty)
- `StatusPill` — varianty `active`, `pending`, `rejected` ✅ (definovány v komponentě)
- `Badge` — varianty `verified`, `pending`, `rejected` ✅ (definovány v komponentě)
- `Card`, `Button` — standardní admin komponenty ✅

### Prisma schema
- `manager` relace (`User → User @relation("ManagerToBroker")`) ✅
- `commissions Commission[] @relation("BrokerCommissions")` ✅

---

## 3. Reverzní kontrola — STOP kritéria

| Kritérium | Stav | Poznámka |
|-----------|------|----------|
| Klik na 👁 u makléře → detail stránka existuje | ✅ PASS | `app/(admin)/admin/brokers/[id]/page.tsx` vytvořena |
| Klik na ✏️ u makléře → edit stránka existuje | ✅ PASS | `app/(admin)/admin/brokers/[id]/edit/page.tsx` vytvořena |
| Edit formulář má správná pole | ✅ PASS | Jméno, příjmení, email, telefon, status, IČO, bank. účet, města, specializace, bio |
| API route GET existuje se Zod validací | ✅ PASS | GET v `/api/admin/brokers/[id]/route.ts` |
| API route PATCH existuje se Zod validací | ✅ PASS | PATCH s `updateBrokerSchema` (Zod) |
| TypeScript bez chyb | ✅ PASS | 0 chyb v nových souborech |
| Build bez chyb | ✅ PASS | 1281/1281 stránek po clean build |

---

## Výsledek

**SCHVÁLENO ✅ — Implementace připravena pro Chrome test (Task #5)**

Všechna STOP kritéria splněna. P0 problémy (chybějící broker stránky → 404) jsou odstraněny. Kód je čistý, TypeScript bez chyb, build prochází.
