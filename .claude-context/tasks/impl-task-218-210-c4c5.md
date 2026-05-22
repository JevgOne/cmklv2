# IMPL #218 — PWA Díly C4-C5 (Onboarding + Polish + Diakritika)

**Implementátor:** Developer agent
**Datum:** 2026-04-09
**Plan reference:** plan-task-210-pwa-dily-100.md §3 C4, §3 C5
**Review trigger:** review-task-216-213-evzen.md OBS-2

---

## Výsledek

### 2 commity, 13 souborů, +709/-33 lines

| Commit | Hash | Scope |
|--------|------|-------|
| C4 | `51596f3` | Supplier onboarding flow (3 steps + middleware + API) |
| C5 | `ccc9ae4` | Loading/error states + diacritics fix (OBS-2) |

---

## C4 — Supplier Onboarding (7 souborů, +600)

### Pages (5 souborů)
1. **`app/(pwa-parts)/parts/onboarding/page.tsx`** (22 LOC) — Server component router, reads `session.user.onboardingStep`, redirects to correct step
2. **`app/(pwa-parts)/parts/onboarding/profile/page.tsx`** (161 LOC) — Step 1: company info form (companyName, IČO 8-digit validation, phone, address, description)
3. **`app/(pwa-parts)/parts/onboarding/documents/page.tsx`** (210 LOC) — Step 2: document upload (business license + ID card) via POST /api/upload
4. **`app/(pwa-parts)/parts/onboarding/approval/page.tsx`** (88 LOC) — Step 3: waiting screen with animated clock, "co se děje dál" list
5. **`app/(pwa-parts)/parts/onboarding/loading.tsx`** (10 LOC) — Onboarding route spinner

### API
6. **`app/api/auth/supplier-onboarding/route.ts`** (104 LOC) — PATCH handler:
   - Step 1: validates companyName/IČO/phone, updates User fields, sets onboardingStep=2
   - Step 2: validates 2 document URLs, saves to `documents` JSON field, sets onboardingStep=3 + status=PENDING

### Middleware
7. **`middleware.ts`** (+5 lines) — Supplier onboarding redirect: if PARTS_SUPPLIER_ROLES + status=ONBOARDING → redirect to `/parts/onboarding` (excludes /parts/onboarding itself). Inserted inside existing `/parts` protection block.

---

## C5 — Loading/Error + Diacritics (6 souborů, +109/-33)

### Loading/Error (3 new files)
1. **`app/(pwa-parts)/parts/[id]/loading.tsx`** (20 LOC) — Skeleton for detail page
2. **`app/(pwa-parts)/parts/[id]/edit/loading.tsx`** (19 LOC) — Skeleton for edit page
3. **`app/(pwa-parts)/parts/[id]/error.tsx`** (37 LOC) — Error boundary with "Zkusit znovu" + "Zpět na díly"

### Diacritics fixes (3 modified files)
4. **`app/(pwa-parts)/parts/[id]/page.tsx`** — Fixed: "Aktivní", "Neaktivní", "Prodáno", "Rezervováno", "Převodovka", "Karosérie", "Interiér", "Výfuk", "Ostatní", "Nový", "Plně funkční", "Funkční s vadou", "Na díly", "Repasovaný", "Díl nenalezen", "Díl byl odstraněn", "Zpět na moje díly", "Výrobce", "Záruka", "OEM číslo", "Zobrazení", "Smazat díl"
5. **`app/(pwa-parts)/parts/[id]/edit/page.tsx`** — Fixed: "Díl nenalezen", "Chyba při načítání dílu", "Uložení se nezdařilo", "Chyba při ukládání", "Upravit díl", "Zrušit", "Zpět na moje díly"
6. **`components/pwa-parts/parts/DeletePartDialog.tsx`** — Fixed: "Smazání se nezdařilo", "Chyba připojení", "Smazat díl?", "Díl bude deaktivován a nebude viditelný", "Zrušit", "Mažu..."

---

## STOP rules compliance

| STOP | Pravidlo | Status |
|------|---------|--------|
| STOP-1 | NE edit API parts CRUD routes | ✅ 0 diff in `app/api/parts/` |
| STOP-2 | NE modify Prisma schema | ✅ 0 diff in `prisma/` |
| STOP-3 | NE install npm packages | ✅ 0 diff in `package*.json` |
| STOP-4 | NE refactor wizard steps | ✅ 0 diff in PhotoStep/DetailsStep/PricingStep |
| STOP-5 | Verify JWT fields before middleware | ✅ Verified: onboardingStep (L41/73), status (L36/68) in lib/auth.ts |
| STOP-6 | Compatibility lossy | ✅ N/A (no compatibility changes) |
| STOP-7 | Cloudinary env | ✅ No env hardcoding |
| STOP-8 | >8 files per commit | ✅ C4=7, C5=6 |

---

## Build verification

```
npx tsc --noEmit    → 0 errors ✅
npm run lint        → 0 errors (554 warnings, unchanged) ✅
npm run build       → EXIT=0 ✅
```

---

## HOTOVO — ready for kontrolor → evžen → test-chrome → deploy
