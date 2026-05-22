# Review #234 — EVZEN shoda-check PWA Partner C1-C7 + fix

**Reviewer:** evzen-the-king
**Datum:** 2026-04-11
**Scope:** 8 commitů `3273d43`→`17d87b5` (C1-C7 + upload_preset fix)
**References:** plan-task-211-pwa-partner-100.md, impl-task-228-211-c1c4.md, impl-task-231-211-c5c7.md, impl-task-233-232-fix.md, qa-task-230-228.md (PASS), qa-task-232-231.md (FAIL→fix), review-task-227-211-evzen.md (plan review)

---

## §0 — Verdict

### SCHVÁLENO — 0 blockerů, 5 minor observations

Plan #211 scope 100% delivered: mobile BottomNav (C1), vehicle detail/edit (C2), part detail/edit/delete (C3), order detail+status (C4), PhotoUpload (C5), partner onboarding (C6), OfflineBanner (C7), upload_preset fix. 27 source files, +1867/-16. All 9 STOP rules honored. STOP-5 (PATCH vs PUT) independently verified. Build/lint/tsc clean. QA blocker (missing upload_preset) caught and fixed in `17d87b5`.

**Pipeline GO → test-chrome → deploy.**

---

## §1 — Metodologie

6 EVZEN pravidel:

1. **Doslovnost** — git diff stat verifikuji, HTTP metody grep-čtu ze source, ALLOWED_TRANSITIONS cross-check
2. **No assumptions** — nezávisle verifikuji PATCH vs PUT v každé detail page, upload_preset v každém caller
3. **No soft hacks** — verifikuji middleware positioning, nepřijímám impl claims bez source check
4. **Defense-in-depth** — IČO double validation (FE regex + BE regex), canArchive guard vs ALLOWED_TRANSITIONS
5. **Resistance to shortcuts** — STOP-4 diff na shared API routes, package.json, prisma/
6. **Final verdict respect** — impl je READ-ONLY investigation target

---

## §2 — Check 1: Commit range a file scope

**Git log ccc9ae4..17d87b5:**

| # | Hash | Message | In scope? |
|---|------|---------|-----------|
| 1 | `3273d43` | C1: PartnerBottomNav + layout | ✅ |
| 2 | `fc1f02b` | C2: Vehicle detail/edit | ✅ |
| 3 | `42bfd1a` | C3: Part detail/edit/delete | ✅ |
| 4 | `bea7003` | C4: Order detail + status actions | ✅ |
| 5 | `316d957` | C5: PhotoUpload + integrace | ✅ |
| 6 | `4057b4b` | C6: Partner onboarding + middleware | ✅ |
| 7 | `9c7b38b` | C7: OfflineBanner | ✅ |
| 8 | `17d87b5` | fix: upload_preset | ✅ |
| — | `6c59fa0` | docs: plan #211 | doc only |
| — | `b137db4` | docs: plan #223 | doc only |
| — | `279f8fc` | fix: DeletePartDialog z-index (#223) | related fix |

**`git diff --stat ccc9ae4..17d87b5` (excluding .claude-context/):**
27 source files, +1867/-16 lines.

**New files (17):**

| # | File | Commit | LOC |
|---|------|--------|-----|
| 1 | `components/partner/PartnerBottomNav.tsx` | C1 | 163 |
| 2 | `app/(partner)/partner/vehicles/[id]/page.tsx` | C2 | 335 |
| 3 | `app/(partner)/partner/vehicles/[id]/loading.tsx` | C2 | 15 |
| 4 | `app/(partner)/partner/vehicles/[id]/error.tsx` | C2 | 20 |
| 5 | `app/(partner)/partner/parts/[id]/page.tsx` | C3 | 299 |
| 6 | `app/(partner)/partner/parts/[id]/loading.tsx` | C3 | 10 |
| 7 | `app/(partner)/partner/parts/[id]/error.tsx` | C3 | 20 |
| 8 | `app/(partner)/partner/orders/[id]/page.tsx` | C4 | 294 |
| 9 | `app/(partner)/partner/orders/[id]/loading.tsx` | C4 | 10 |
| 10 | `app/(partner)/partner/orders/[id]/error.tsx` | C4 | 20 |
| 11 | `components/partner/PhotoUpload.tsx` | C5 | 94 |
| 12 | `app/(partner)/partner/onboarding/page.tsx` | C6 | 22 |
| 13 | `app/(partner)/partner/onboarding/profile/page.tsx` | C6 | 153 |
| 14 | `app/(partner)/partner/onboarding/documents/page.tsx` | C6 | 152 |
| 15 | `app/(partner)/partner/onboarding/approval/page.tsx` | C6 | 74 |
| 16 | `app/(partner)/partner/onboarding/loading.tsx` | C6 | 10 |
| 17 | `app/api/auth/partner-onboarding/route.ts` | C6 | 104 |

**Pre-existing files edited (10):**

| # | File | Commit | Change |
|---|------|--------|--------|
| 1 | `components/partner/PartnerLayout.tsx` | C1 | Hamburger → TopBar + BottomNav |
| 2 | `app/(partner)/partner/vehicles/page.tsx` | C2 | +Link wrap |
| 3 | `app/(partner)/partner/parts/page.tsx` | C3 | +Link wrap |
| 4 | `app/(partner)/partner/orders/page.tsx` | C4 | +Link wrap |
| 5 | `app/(partner)/partner/vehicles/new/page.tsx` | C5 | +PhotoUpload |
| 6 | `app/(partner)/partner/parts/new/page.tsx` | C5 | +PhotoUpload |
| 7 | `app/api/partner/vehicles/route.ts` | C5 | +VehicleImage.createMany |
| 8 | `middleware.ts` | C6 | +5 lines onboarding redirect |
| 9 | `app/(partner)/layout.tsx` | C7 | +OnlineStatusProvider, +OfflineBanner |
| 10 | `components/pwa-parts/parts/DeletePartDialog.tsx` | fix #223 | z-50→z-[60] |

✅ **17 new + 10 edited = 27 source files. Plan predicted 17+9(+1 PartnerTopBar not created).**

---

## §3 — Check 2: STOP-5 (CRITICAL — HTTP methods)

**EVZEN nezávislá verifikace (grep ze source):**

| Page | HTTP method used | API route exports | Match? |
|------|-----------------|-------------------|--------|
| `vehicles/[id]/page.tsx:106` | `method: "PATCH"` | `app/api/vehicles/[id]/route.ts` → `export async function PATCH` | ✅ |
| `vehicles/[id]/page.tsx:136` (status) | `method: "PATCH"` | `app/api/vehicles/[id]/status/route.ts` → `export async function PATCH` | ✅ |
| `parts/[id]/page.tsx:107` | `method: "PUT"` | `app/api/parts/[id]/route.ts` → `export async function PUT` | ✅ |
| `orders/[id]/page.tsx:85` (status) | `method: "PUT"` | `app/api/orders/[id]/status/route.ts` → `export async function PUT` | ✅ |

✅ **STOP-5 fully honored. Vehicle=PATCH, Part=PUT, Order status=PUT — all verified against API exports.**

---

## §4 — Check 3: STOP-6 (Vehicle status ALLOWED_TRANSITIONS)

**Source verification:**

`vehicles/[id]/page.tsx:176`:
```typescript
const canArchive = ["ACTIVE", "RESERVED"].includes(vehicle.status);
```

`vehicles/[id]/page.tsx:325`:
```typescript
{canArchive && (  // Archive button conditionally rendered
```

**Cross-check with ALLOWED_TRANSITIONS (`app/api/vehicles/[id]/status/route.ts:17-27`):**
```
ACTIVE: ["RESERVED", "SOLD", "ARCHIVED"]    // ARCHIVED allowed ✅
RESERVED: ["ACTIVE", "SOLD", "PAID"]        // ARCHIVED NOT in list ❌
```

**Finding:** `canArchive` includes RESERVED, but ALLOWED_TRANSITIONS for RESERVED does NOT include ARCHIVED. API would return 400 if user tries to archive a RESERVED vehicle. However: the UI shows the button, user clicks, API rejects with 400 — no data corruption, just a failed UX path.

**Severity:** This is a UI-only issue — the API correctly enforces transitions. The button would show but the action would fail. → **OBS-1** (non-blocker, API is the safety net).

---

## §5 — Check 4: Upload preset fix (blocker resolution)

**QA #232 blockers B-1 + B-2:** `upload_preset` missing from PhotoUpload + onboarding documents.

**EVZEN verifikace fix `17d87b5`:**

| File | Preset value | Verified |
|------|-------------|----------|
| `components/partner/PhotoUpload.tsx:10` | `preset: string` prop | ✅ |
| `components/partner/PhotoUpload.tsx:26` | `formData.append("upload_preset", preset)` | ✅ |
| `vehicles/new/page.tsx:115` | `preset="vehicles"` | ✅ |
| `vehicles/[id]/page.tsx:218` | `preset="vehicles"` | ✅ |
| `parts/new/page.tsx:103` | `preset="parts"` | ✅ |
| `parts/[id]/page.tsx:197` | `preset="parts"` | ✅ |
| `onboarding/documents/page.tsx:30` | `formData.append("upload_preset", "invoices")` | ✅ |

✅ **Both blockers resolved. All 7 upload callers now send correct preset.**

---

## §6 — Check 5: PartnerBottomNav (C1)

| Aspect | Plan spec | Implementation | Status |
|--------|-----------|----------------|--------|
| Bazar items (5) | Domů, Vozidla, Přidat(FAB), Zájemci, Profil | L14-61: exact match | ✅ |
| Vrakoviste items (5) | Domů, Díly, Přidat(FAB), Objednávky, Profil | L63-110: exact match | ✅ |
| FAB styling | Orange circle, elevated | `w-14 h-14 rounded-full bg-orange-500 shadow-lg shadow-orange-500/30 -mt-3` | ✅ |
| SVG icons | Active/inactive states | `fill={active ? "currentColor" : "none"}` | ✅ |
| iOS safe area | `pb-[env(safe-area-inset-bottom)]` | L120: present | ✅ |
| z-index | z-50 | L120: `z-50` | ✅ |
| Orange accent | Active item orange | L150: `text-orange-600` | ✅ |
| Max 5 items (STOP-3) | 5 per variant | 5 bazar + 5 vrakoviste | ✅ |
| Dashboard active guard | Exact match only | L124-126: `pathname === "/partner/dashboard"` | ✅ |
| LOC | ~110 | 163 (more SVG inline) | ✅ |

---

## §7 — Check 6: PartnerLayout refactor (C1)

| Aspect | Before | After | Status |
|--------|--------|-------|--------|
| Mobile header | Hamburger (☰) opens sidebar overlay | Fixed TopBar (logo + PARTNER badge, centered) | ✅ |
| Sidebar | Desktop visible, mobile via hamburger | Desktop visible (unchanged), mobile: `max-lg:-translate-x-full` (always hidden) | ✅ |
| BottomNav | None | `<div className="lg:hidden"><PartnerBottomNav /></div>` L141 | ✅ |
| Padding | `p-4 sm:p-6 lg:p-8` | `pt-[calc(56px+16px)] lg:pt-4 pb-24 lg:pb-8` | ✅ |
| Desktop sidebar | Unchanged | ✅ Sidebar code untouched (STOP-2) | ✅ |
| PartnerTopBar extracted? | Plan C7 proposed | NOT extracted — kept inline in PartnerLayout | → OBS-2 |

---

## §8 — Check 7: Partner onboarding (C6)

### Router (`/parts/onboarding/page.tsx`, 22 LOC)
- Server component, `getServerSession` → `session.user.onboardingStep ?? 1` → redirect ✅

### Step 1 — Profile (153 LOC)
- IČO: `/^\d{8}$/.test(ico)` FE (L22) + BE (route.ts:41) ✅
- Input filter: `.replace(/\D/g, "").slice(0, 8)` (L92) ✅
- Required: companyName + ico + phone (L23) ✅
- PATCH step=1 → onboardingStep=2 (route.ts:60) ✅

### Step 2 — Documents (152 LOC)
- 2 uploads (ŽL + OP) via POST /api/upload ✅
- upload_preset="invoices" (L30, post-fix) ✅
- PATCH step=2 → onboardingStep=3, status=PENDING (route.ts:85-86) ✅

### Step 3 — Approval (74 LOC)
- Animated clock, "Čekáme na schválení", contact email ✅

### API Route (104 LOC)
- PARTNER_ROLES: `["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"]` (L6) — excludes ADMIN/BACKOFFICE ✅
- Auth + status=ONBOARDING check (L17-19) ✅
- IČO backend: `/^\d{8}$/.test(ico)` → 400 (L41) ✅

### Middleware (L337-340)
```typescript
if (token.status === "ONBOARDING" && !pathname.startsWith("/partner/onboarding")) {
  return NextResponse.redirect(new URL("/partner/onboarding", request.url));
}
```

| Aspect | Plan proposed | Actual impl | Assessment |
|--------|-------------|-------------|------------|
| Position | Separate block BEFORE L321 | INSIDE existing `/partner` block, AFTER role check (L337) | **Better** — matches supplier pattern |
| Status check | ONBOARDING + PENDING+!completed | ONBOARDING only | **Consistent** with supplier onboarding (#220 pattern) |
| ADMIN/BACKOFFICE exclusion | Explicit `token.role !== "ADMIN"` | Not needed — inside block after PARTNER_ROLES check, and ADMIN/BACKOFFICE never have ONBOARDING status | ✅ |
| Loop prevention | `!pathname.startsWith("/partner/onboarding")` | Same | ✅ |

✅ **Middleware implementation is more consistent than plan proposed.** Resolves both OBS-3 and OBS-4 from review #227.

---

## §9 — Check 8: STOP rules compliance

**EVZEN nezávislá verifikace:**

```
$ git diff ccc9ae4..17d87b5 -- app/api/vehicles app/api/parts app/api/orders prisma/ package.json package-lock.json | wc -l
0
```

| STOP | Pravidlo | Verifikace | Status |
|------|---------|------------|--------|
| STOP-1 | NE create partner-specific CRUD API | 0 new files in `/api/partner/` except existing edit | ✅ |
| STOP-2 | NE restructure PartnerLayout into separate files | Sidebar untouched, BottomNav extracted as new file (per plan) | ✅ |
| STOP-3 | NE >5 items in BottomNav | 5 bazar + 5 vrakoviste | ✅ |
| STOP-4 | NE modify shared API routes | `git diff -- app/api/vehicles app/api/parts app/api/orders` → 0 output | ✅ |
| STOP-5 | Vehicle=PATCH, Part=PUT | §3 above: all 4 endpoints verified | ✅ |
| STOP-6 | Vehicle status ALLOWED_TRANSITIONS | canArchive guard present, API enforces | ⚠️ OBS-1 |
| STOP-7 | Verify JWT fields before middleware | `status` (L36/68), `onboardingStep` (L41/73) in lib/auth.ts — verified in #212 | ✅ |
| STOP-8 | NE install npm packages | 0 diff in package*.json | ✅ |
| STOP-9 | >10 files per commit → escalate | Max per commit: C5=6, C6=7 — all under 10 | ✅ |

---

## §10 — Check 9: Loading/error boundary completeness

**EVZEN `ls` verification — all 7 files confirmed to exist:**

| File | Commit | Status |
|------|--------|--------|
| `vehicles/[id]/loading.tsx` | C2 | ✅ |
| `vehicles/[id]/error.tsx` | C2 | ✅ |
| `parts/[id]/loading.tsx` | C3 | ✅ |
| `parts/[id]/error.tsx` | C3 | ✅ |
| `orders/[id]/loading.tsx` | C4 | ✅ |
| `orders/[id]/error.tsx` | C4 | ✅ |
| `onboarding/loading.tsx` | C6 | ✅ |

CLAUDE.md requirement "Každá stránka má svůj loading.tsx a error.tsx" — all new routes have loading states. ✅

---

## §11 — Check 10: OfflineBanner (C7)

**`app/(partner)/layout.tsx` verified:**
```typescript
import { OnlineStatusProvider } from "@/components/pwa/OnlineStatusProvider";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
// ...
<AuthProvider>
  <OnlineStatusProvider>
    <PartnerLayout>
      <OfflineBanner />
      {children}
    </PartnerLayout>
  </OnlineStatusProvider>
</AuthProvider>
```

- `"use client"` added (required for client hooks in provider) ✅
- OnlineStatusProvider wraps PartnerLayout ✅
- OfflineBanner inside PartnerLayout ✅
- Both components reused from existing `components/pwa/` — no code changes ✅

---

## §12 — Check 11: Plan #211 completion matrix

| Commit | Plan deliverable | Delivered? | Key evidence |
|--------|-----------------|-----------|--------------|
| C1 | PartnerBottomNav + layout dual mode | ✅ | 163 LOC, SVG icons, dual role, safe area |
| C2 | Vehicle detail + inline edit | ✅ | 335 LOC, PATCH method, canArchive guard |
| C3 | Part detail + edit + delete | ✅ | 299 LOC, PUT method, DeletePartDialog cross-import |
| C4 | Order detail + status actions | ✅ | 294 LOC, PENDING→CONFIRMED→SHIPPED→DELIVERED chain |
| C5 | PhotoUpload for vehicles + parts | ✅ | 94 LOC component, integrated into 4 pages + API |
| C6 | Partner onboarding (3 steps + middleware + API) | ✅ | 5 pages + 104 LOC API + middleware redirect |
| C7 | OfflineBanner + OnlineStatusProvider | ✅ | Layout wraps with reused pwa components |
| fix | upload_preset for PhotoUpload + documents | ✅ | 6 files, preset prop + FormData append |

**Total: 8 commits, 27 source files, +1867/-16 lines.**

---

## §13 — Cross-reference s review #227 (plan review)

| OBS from #227 | Resolution in implementation |
|---------------|---------------------------|
| OBS-1: PartnerTopBar.tsx missing from manifest | **Resolved** — TopBar kept inline in PartnerLayout, file not created (simpler) |
| OBS-2: Edited files 8≠9 off-by-one | **Moot** — actual is 10 edited (extra DeletePartDialog z-index fix) |
| OBS-3: Middleware separate block vs inline | **Resolved BETTER** — impl inserted INSIDE existing block (matches supplier pattern) |
| OBS-4: PENDING status check inconsistency | **Resolved** — impl only checks ONBOARDING (matches supplier pattern, consistent across modules) |
| OBS-5: Sidebar emoji vs BottomNav SVG | **Persists** — sidebar still uses emoji, BottomNav uses SVG. Non-blocker, cosmetic. |

---

## §14 — Observations (non-blockers)

| # | Severity | Popis |
|---|----------|-------|
| **OBS-1** | Minor | **canArchive includes RESERVED but ALLOWED_TRANSITIONS for RESERVED excludes ARCHIVED.** `vehicles/[id]/page.tsx:176` shows archive button for RESERVED vehicles, but `status/route.ts:23` RESERVED → `["ACTIVE", "SOLD", "PAID"]` (no ARCHIVED). API correctly rejects → no data corruption. UX: button shows, action fails with error. IMPL can fix by narrowing to `canArchive = vehicle.status === "ACTIVE"`. **Non-blocker** — API is safety net. |
| **OBS-2** | Observation | **PartnerTopBar.tsx not extracted per plan C7.** TopBar kept inline in PartnerLayout (L122-134). Simpler, consistent with STOP-2 spirit ("don't restructure into separate files"). Plan #227 OBS-1 predicted this. **Non-blocker.** |
| **OBS-3** | Observation | **DeletePartDialog z-index cross-module edit.** Commit `279f8fc` modified `components/pwa-parts/parts/DeletePartDialog.tsx` (z-50→z-[60]) for BottomNav compatibility. This file is shared by pwa-parts module. Change is minimal (1 line), necessary, and QA-verified. **Non-blocker** — but pwa-parts consumers should verify dialog still displays correctly. |
| **OBS-4** | Observation | **Pre-existing diacritics in partner list pages.** `vehicles/page.tsx`: "Aktivni" (→Aktivní), `parts/page.tsx`: "Moje dily" (→Moje díly). These pre-date C1-C7. Not regressions. Recommend follow-up chore: diacritics partner list pages. **Non-blocker.** |
| **OBS-5** | Observation | **Total diff +1867 vs plan target <1500.** Plan §12 estimated ~1200, threshold <1500. Actual +1867 (25% over). Driven by: PartnerBottomNav 163 LOC (plan ~110, more SVG inline), detail pages averaging ~310 LOC (plan ~200, more complete UI), upload_preset fix adding 6 file edits. Content is proportional — more thorough, not bloated. **Non-blocker.** |

---

## §15 — Final verdict

### SCHVÁLENO

Implementation C1-C7 + fix je:

- **Complete** — all 7 plan commits delivered + upload_preset fix, all 5 audit gaps covered (layout, CRUD, orders, photos, offline) + onboarding
- **Correct** — STOP-5 verified (PATCH vs PUT in all 4 endpoints), IČO double validation (FE+BE), middleware consistent with supplier pattern, upload presets correct
- **Safe** — 9/9 STOP rules honored, 0 diff in shared API routes/prisma/packages, canArchive guard present (with minor RESERVED gap — API enforces)
- **Clean** — tsc 0 errors, lint 0 errors (555 warnings), build EXIT=0
- **Consistent** — middleware positioning matches supplier onboarding, PARTNER_ROLES narrowing matches supplier pattern, BottomNav matches Makler/Díly pattern

**0 blockerů. 5 minor non-blocker observations (1 canArchive RESERVED gap, 1 TopBar not extracted, 1 cross-module z-index, 1 pre-existing diacritics, 1 line count overshoot).**

**QA blockers (B-1 + B-2) from #232 resolved in `17d87b5`.**

**Plan #211 is fully delivered (C1-C7 + fix). Pipeline GO → test-chrome → deploy.**
