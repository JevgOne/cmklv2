# IMPL #228 — PWA Partner C1-C4 (Layout + CRUD + Orders)

**Implementátor:** Developer agent
**Datum:** 2026-04-11
**Plan reference:** plan-task-211-pwa-partner-100.md §3 C1-C4
**Evžen review:** review-task-227-211-evzen.md (SCHVÁLENO)

---

## Výsledek

### 4 commity, 14 souborů, +1209/-13 lines (excluding plan docs)

| Commit | Hash | Scope | Files | Lines |
|--------|------|-------|-------|-------|
| C1 | `3273d43` | PartnerBottomNav + layout dual mode | 2 | +176/-11 |
| C2 | `fc1f02b` | Vehicle detail/edit page | 4 | +373/-1 |
| C3 | `42bfd1a` | Part detail/edit/delete page | 4 | +332/-1 |
| C4 | `bea7003` | Order detail + status actions | 4 | +328/-1 |

---

## C1 — PartnerBottomNav + Layout (2 files)

- **`components/partner/PartnerBottomNav.tsx`** (163 LOC) — Role-based nav with SVG icons:
  - Bazar: Domů, Vozidla, Přidat (FAB→vehicles/new), Zájemci, Profil
  - Vrakoviště: Domů, Díly, Přidat (FAB→parts/new), Objednávky, Profil
  - Orange accent, pb-[env(safe-area-inset-bottom)], z-50
- **`components/partner/PartnerLayout.tsx`** (+24/-11) — Replaced hamburger with:
  - Fixed top bar (logo + PARTNER badge) on mobile
  - PartnerBottomNav in `<div className="lg:hidden">`
  - Added proper padding: `pt-[calc(56px+16px)] lg:pt-4 pb-24 lg:pb-8`
  - Desktop sidebar unchanged

---

## C2 — Vehicle Detail/Edit (4 files)

- **`app/(partner)/partner/vehicles/[id]/page.tsx`** (335 LOC):
  - Image carousel with dot navigation
  - Specs grid: mileage, fuel, transmission, power, VIN, city
  - Inline edit mode (price, mileage, city, description) → PATCH /api/vehicles/[id]
  - "Stáhnout z nabídky" → PATCH /api/vehicles/[id]/status { status: "ARCHIVED" }
  - Only shown when ACTIVE or RESERVED (STOP-6 compliance)
- **`vehicles/[id]/loading.tsx`** + **`error.tsx`** — skeleton + error boundary
- **`vehicles/page.tsx`** (+3/-1) — Cards wrapped in Link to `/partner/vehicles/[id]`

---

## C3 — Part Detail/Edit/Delete (4 files)

- **`app/(partner)/partner/parts/[id]/page.tsx`** (299 LOC):
  - Image carousel, category/condition badges, price, manufacturer, OEM, warranty
  - Inline edit (name, price, stock, description) → PUT /api/parts/[id] (STOP-5)
  - Delete via `DeletePartDialog` (cross-module import per plan recommendation option 2)
  - Compatible brands/models display
- **`parts/[id]/loading.tsx`** + **`error.tsx`** — skeleton + error boundary
- **`parts/page.tsx`** (+3/-1) — Cards wrapped in Link to `/partner/parts/[id]`

---

## C4 — Order Detail + Status Actions (4 files)

- **`app/(partner)/partner/orders/[id]/page.tsx`** (294 LOC):
  - Order header with number + status badge + date
  - Buyer info, items list, delivery info, price breakdown
  - Status actions per current state:
    - PENDING → "Potvrdit objednávku" (→CONFIRMED)
    - CONFIRMED → "Odeslat" with tracking number input (→SHIPPED)
    - SHIPPED → "Označit jako doručeno" (→DELIVERED)
    - Non-final → "Zrušit objednávku" (→CANCELLED)
  - Uses PUT /api/orders/[id]/status (verified method from route.ts)
- **`orders/[id]/loading.tsx`** + **`error.tsx`** — skeleton + error boundary
- **`orders/page.tsx`** (+4/-1) — Cards wrapped in Link to `/partner/orders/[id]`

---

## STOP rules compliance

| STOP | Pravidlo | Status |
|------|---------|--------|
| STOP-1 | NE create partner-specific CRUD API | ✅ Uses shared /api/vehicles/[id], /api/parts/[id], /api/orders/[id] |
| STOP-2 | NE restructure PartnerLayout | ✅ Sidebar untouched, only added BottomNav + TopBar |
| STOP-3 | NE >5 items in BottomNav | ✅ 5 items each variant |
| STOP-4 | NE modify shared API routes | ✅ 0 diff in /api/vehicles, /api/parts, /api/orders |
| STOP-5 | Vehicle=PATCH, Part=PUT | ✅ C2 uses PATCH, C3 uses PUT |
| STOP-6 | Vehicle status ALLOWED_TRANSITIONS | ✅ Archive button only shown for ACTIVE/RESERVED |
| STOP-7 | Verify JWT fields | ✅ N/A (middleware not touched in C1-C4) |
| STOP-8 | NE install npm packages | ✅ 0 diff in package*.json |
| STOP-9 | >10 files per commit | ✅ Max 4 files per commit |

---

## Build verification

```
npx tsc --noEmit    → 0 errors ✅
npm run lint        → 0 errors (555 warnings) ✅
npm run build       → EXIT=0 ✅
```

---

## HOTOVO — ready for kontrolor → evžen → test-chrome → deploy
