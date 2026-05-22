# QA Report — Build + Test Fixes (1cb6251, 8cebc17)

**Datum:** 2026-04-27  
**Autor:** Kontrolor  
**Commity:** `1cb6251` (fix test assertions) + `8cebc17` (fix build prerender)  
**Status: ✅ APPROVED — oba commity čisté a správné**

---

## SHRNUTÍ

Dva follow-up commity po marketplace implementaci. Opravují BUG-T1, BUG-T2 z předchozího QA reportu (`qa-marketplace-e2e-20260426.md`) a 3 prerender chyby blokující production build. Build prošel. Lint čistý.

---

## 1. SIMPLIFY KONTROLA

### `1cb6251` — fix(test)
- Minimální, cílené změny (+9/-6 řádků)
- Žádná duplicita, žádná zbytečná složitost
- ✅ OK

### `8cebc17` — fix(build)
- Minimální, cílené změny (+5/-1 řádků)
- `as string[]` cast — pragmatický workaround pro Prisma readonly pole, akceptovatelné
- `force-dynamic` export — standardní Next.js pattern pro SSR stránky
- ✅ OK

---

## 2. DEBUG KONTROLA

### Build
```
✓ Compiled successfully in 22.0s
✓ Generating static pages using 7 workers (1295/1295)
```
**Build: ✅ PASS** — žádné chyby kompilace

`prisma:error` záznamy ve výstupu = DB connection timeouty při SSG prerendering (očekávané v local bez DB, neblokují build).

### Lint
```
3 errors — scripts/audit-pwa-apps.js (require() imports)
669 warnings — mix across codebase
```
**Lint: ✅ PASS** — 3 errory jsou pre-existing v `scripts/` (audit script, mimo app kód). Žádné nové errory.

---

## 3. REVERZNÍ KONTROLA

### BUG-T1: API tests 401 vs 403 (`1cb6251`)

| Soubor | Změna | Správnost |
|--------|-------|-----------|
| `e2e/marketplace/admin.spec.ts:220` | `toBe(403)` → `toBe(401)` (confirm-payment) | ✅ |
| `e2e/marketplace/admin.spec.ts:227` | `toBe(403)` → `toBe(401)` (approve) | ✅ |
| `e2e/marketplace/admin.spec.ts:234` | `toBe(403)` → `toBe(401)` (payout) | ✅ |
| Popis testů | "requires ADMIN role" → "requires auth" | ✅ |

**Logika:** Unauthenticated request → API vrací 401. 403 nastane jen pokud je user přihlášen ale nemá správnou roli. Testy posílají request bez tokenu → správně 401.

### BUG-T2: Chybějící assertace v wizard step 1 (`1cb6251`)

| Soubor | Změna | Správnost |
|--------|-------|-----------|
| `e2e/marketplace/dealer.spec.ts:136-137` | Přidáno `const continueBtn` + `await expect(continueBtn).toBeEnabled()` | ✅ |

Přidáno na správném místě — po `waitForTimeout(300)` state update.

### Build fix — prerender errory (`8cebc17`)

| Soubor | Změna | Důvod |
|--------|-------|-------|
| `app/(web)/makleri/page.tsx:33` | `as const` → `as string[]` | Prisma `role: { in: [...] }` vyžaduje `string[]`, ne `readonly string[]` |
| `app/(admin)/admin/career/page.tsx:6` | `export const dynamic = "force-dynamic"` | `getServerSession` potřebuje request context — nelze prerendovat |
| `app/(web)/shop/reklamace/page.tsx:8` | `export const dynamic = "force-dynamic"` | Parent layout používá `headers()` — child musí být dynamic |

Všechny 3 změny jsou správné a minimálně invazivní.

---

## ZBÝVAJÍCÍ OTEVŘENÉ ISSUES (z předchozích QA reportů)

Tyto issues nebyly součástí těchto commitů — **stále otevřené**:

| ID | Popis | Závažnost | Soubor |
|----|-------|-----------|--------|
| BUG-T3 | Conditional tests — false positives na prázdném DB | Minor | `e2e/marketplace/*.spec.ts` |
| MINOR-1 | F12: catch bloky bez console.error | Minor | `marketplace/dealer/page.tsx:80`, `investor/page.tsx:117` |
| MINOR-2 | `applications/[id]` bez error feedbacku v UI | Minor | `admin/marketplace/applications/[id]/page.tsx` |

Žádná z těchto issues neblokuje nasazení.

---

## ZÁVĚR

**✅ SCHVÁLENO**

Oba commity jsou čisté, cílené a správné. Build prošel (1295 stránek). Lint bez nových chyb. BUG-T1 a BUG-T2 správně opraveny. Zbývající open issues jsou minor a neblokují produkci.
