# Review #227 — EVZEN shoda-check plán #211 PWA Partner

**Reviewer:** evzen-the-king
**Datum:** 2026-04-11
**Scope:** plan-task-211-pwa-partner-100.md (801 lines, 7 commits C1-C7)
**References:** audit-208-carmakler-stav.md §10.3–§10.4, plan-task-210-pwa-dily-100.md (supplier pattern), review-task-220-217-evzen.md OBS-2

---

## §0 — Verdict

### SCHVÁLENO — 0 blockerů, 5 minor observations

Plán #211 pokrývá všech 5 gapů z auditu §10.3–§10.4 (mobile layout, CRUD detail pages, order processing, photo upload, offline awareness) + přidává onboarding (gap #6 z §0). 7 atomických commitů, 17 nových souborů, 9 editovaných, 9 STOP rules, 1 nový API route. LEAD DECISIONS Q1-Q5 all ACCEPT — konzistentní s plan recommendations. §2 defers 6 items (Pusher, messaging, invoice PDF, offline CRUD, advanced photos, opening hours) — reasonable external-service dependencies.

**Pipeline GO → implementator dispatch.**

---

## §1 — Metodologie

6 EVZEN pravidel:

1. **Doslovnost** — čtu plán byte-for-byte, cross-referencuji s audit gapama a existujícím kódem
2. **No assumptions** — nezávisle verifikuji existence souborů, API routes, middleware, ownership checks
3. **No soft hacks** — flaguji manifest aritmetiku (8≠9) a chybějící PartnerTopBar.tsx jako OBS
4. **Defense-in-depth** — verifikuji PATCH vs PUT (STOP-5), ALLOWED_TRANSITIONS (STOP-6), middleware positioning
5. **Resistance to shortcuts** — ověřuji že plán nemodifikuje shared API routes (STOP-4), no schema changes
6. **Final verdict respect** — plán je READ-ONLY investigation target

---

## §2 — Check 1: Pokrytí audit gapů

**Audit §10.3–§10.4 TOP 5 gaps (PWA Partner at 70%):**

| # | Gap z auditu | Plán commit | Status |
|---|-------------|-------------|--------|
| 1 | Mobile-first layout (sidebar → BottomNav) | C1 | ✅ |
| 2 | Onboarding flow | C6 | ✅ |
| 3 | Photo upload | C5 | ✅ |
| 4 | Order detail + shipping | C4 | ✅ |
| 5 | Offline support (OfflineBanner) | C7 | ✅ |

**Plán navíc identifikuje:**
- Vehicle detail/edit (CRUD gap) → C2 ✅
- Part detail/edit/delete (CRUD gap) → C3 ✅

✅ **Všech 5 audit gapů pokryto + 2 dodatečné CRUD gapy.**

---

## §3 — Check 2: LEAD DECISIONS konzistence

| Q# | Otázka | Lead decision | Plan alignment | Status |
|----|--------|---------------|----------------|--------|
| Q1 | BottomNav items — max 5, secondary via dashboard | ACCEPT | STOP-3 says max 5 items | ✅ |
| Q2 | Split C1-C4 / C5-C7 into separate dispatches | ACCEPT | Plan delivers 7 atomic commits, each deployable | ✅ |
| Q3 | Vehicle delete = status change only (ARCHIVED) | ACCEPT | C2: "Stáhnout z nabídky" → ARCHIVED via `/api/vehicles/[id]/status` | ✅ |
| Q4 | New PhotoUpload component, not reuse PhotoStep | ACCEPT | C5 creates `components/partner/PhotoUpload.tsx` (~80 LOC) | ✅ |
| Q5 | Separate `/api/auth/partner-onboarding` route | ACCEPT | C6 creates separate route (~70 LOC) | ✅ |

✅ **All 5 LEAD DECISIONS konzistentní s plan content.**

---

## §4 — Check 3: File manifest a aritmetika

### §4.1 New files (plan claims 17)

**EVZEN independent count:**

| # | File | Commit | Verified |
|---|------|--------|----------|
| 1 | `components/partner/PartnerBottomNav.tsx` | C1 | ✅ |
| 2 | `app/(partner)/partner/vehicles/[id]/page.tsx` | C2 | ✅ |
| 3 | `app/(partner)/partner/vehicles/[id]/loading.tsx` | C2 | ✅ |
| 4 | `app/(partner)/partner/vehicles/[id]/error.tsx` | C2 | ✅ |
| 5 | `app/(partner)/partner/parts/[id]/page.tsx` | C3 | ✅ |
| 6 | `app/(partner)/partner/parts/[id]/loading.tsx` | C3 | ✅ |
| 7 | `app/(partner)/partner/parts/[id]/error.tsx` | C3 | ✅ |
| 8 | `app/(partner)/partner/orders/[id]/page.tsx` | C4 | ✅ |
| 9 | `app/(partner)/partner/orders/[id]/loading.tsx` | C4 | ✅ |
| 10 | `app/(partner)/partner/orders/[id]/error.tsx` | C4 | ✅ |
| 11 | `components/partner/PhotoUpload.tsx` | C5 | ✅ |
| 12 | `app/(partner)/partner/onboarding/page.tsx` | C6 | ✅ |
| 13 | `app/(partner)/partner/onboarding/profile/page.tsx` | C6 | ✅ |
| 14 | `app/(partner)/partner/onboarding/documents/page.tsx` | C6 | ✅ |
| 15 | `app/(partner)/partner/onboarding/approval/page.tsx` | C6 | ✅ |
| 16 | `app/api/auth/partner-onboarding/route.ts` | C6 | ✅ |
| 17 | `app/(partner)/partner/onboarding/loading.tsx` | C6 | ✅ |

**Count: 17** — matches plan §4 header. ✅

**BUT:** C7 §3 says "Files to CREATE: `components/partner/PartnerTopBar.tsx` (~30 lines)" — this file is **NOT in the §4 manifest**. → **OBS-1**

### §4.2 Edited files (plan claims 8)

**EVZEN independent count from §4 table:**

| # | File | Commit | Exists? |
|---|------|--------|---------|
| 1 | `components/partner/PartnerLayout.tsx` | C1 | ✅ verified (144 LOC) |
| 2 | `app/(partner)/partner/vehicles/page.tsx` | C2 | ✅ verified |
| 3 | `app/(partner)/partner/parts/page.tsx` | C3 | ✅ verified |
| 4 | `app/(partner)/partner/orders/page.tsx` | C4 | ✅ verified |
| 5 | `app/(partner)/partner/vehicles/new/page.tsx` | C5 | ✅ verified |
| 6 | `app/(partner)/partner/parts/new/page.tsx` | C5 | ✅ verified |
| 7 | `app/api/partner/vehicles/route.ts` | C5 | ✅ verified |
| 8 | `middleware.ts` | C6 | ✅ verified |
| 9 | `app/(partner)/layout.tsx` | C7 | ✅ verified |

**Count: 9** — plan header says "(8)" but table has **9 entries**. Off by one. → **OBS-2**

**Additional hidden edits from C5:** Plan §3 C5 describes editing `vehicles/[id]/page.tsx` and `parts/[id]/page.tsx` (add PhotoUpload in edit mode) — these are created in C2/C3 and edited in C5 but NOT listed in the edited manifest. IMPL may fold photo integration into C2/C3 creation instead.

---

## §5 — Check 4: Source existence verification

**Missing pages (confirmed don't exist — plan creates them):**

| Route | `ls` result | Status |
|-------|------------|--------|
| `app/(partner)/partner/vehicles/[id]/` | No such file or directory | ✅ needs creation |
| `app/(partner)/partner/parts/[id]/` | No such file or directory | ✅ needs creation |
| `app/(partner)/partner/orders/[id]/` | No such file or directory | ✅ needs creation |

**Existing files (plan edits them — confirmed they exist):**

| File | Status |
|------|--------|
| `components/partner/PartnerLayout.tsx` | ✅ exists (144 LOC, desktop sidebar + mobile hamburger) |
| `app/(partner)/partner/vehicles/page.tsx` | ✅ exists |
| `app/(partner)/partner/parts/page.tsx` | ✅ exists |
| `app/(partner)/partner/orders/page.tsx` | ✅ exists |
| `app/(partner)/partner/vehicles/new/page.tsx` | ✅ exists |
| `app/(partner)/partner/parts/new/page.tsx` | ✅ exists |
| `app/api/partner/vehicles/route.ts` | ✅ exists |
| `middleware.ts` | ✅ exists |
| `app/(partner)/layout.tsx` | ✅ exists |

**Shared API routes (plan claims exist — confirmed):**

| Route | Status |
|-------|--------|
| `/api/vehicles/[id]/route.ts` | ✅ exists, `brokerId` ownership (L20-21, L56, L158) |
| `/api/parts/[id]/route.ts` | ✅ exists, `supplierId` ownership (L73/81, L142/150) |
| `/api/vehicles/[id]/status/route.ts` | ✅ exists, `ALLOWED_TRANSITIONS` (L17-27) |
| `/api/orders/[id]/route.ts` | ✅ exists |
| `/api/orders/[id]/status/route.ts` | ✅ exists |

**Reusable components (plan claims exist — confirmed):**

| Component | Status |
|-----------|--------|
| `components/pwa/OnlineStatusProvider.tsx` | ✅ exists (26 LOC) |
| `components/pwa/OfflineBanner.tsx` | ✅ exists (29 LOC, Framer Motion) |
| `components/pwa-parts/parts/DeletePartDialog.tsx` | ✅ exists (84 LOC, cross-module import for C3) |

---

## §6 — Check 5: STOP rules validita

| STOP | Pravidlo | EVZEN verifikace | Status |
|------|---------|-------------------|--------|
| STOP-1 | NE create partner-specific CRUD API routes | Plan uses shared `/api/vehicles/[id]`, `/api/parts/[id]` — verified ownership checks work for partners | ✅ |
| STOP-2 | NE restructure PartnerLayout into separate files | Plan keeps sidebar in PartnerLayout, extracts only PartnerBottomNav | ✅ |
| STOP-3 | NE >5 items in BottomNav | Plan spec: 5 items each variant (Bazar/Vrakoviste), Q1 ACCEPT aligns | ✅ |
| STOP-4 | NE modify shared API routes | Plan §4 "Files NOT to edit" table explicit: 5 shared routes not touched | ✅ |
| STOP-5 | Vehicle=PATCH, Part=PUT | Plan C2: "PATCH /api/vehicles/[id]", C3: "PUT /api/parts/[id]" — correct methods | ✅ |
| STOP-6 | Vehicle status ALLOWED_TRANSITIONS | Plan C2: "Stáhnout z nabídky" → ARCHIVED. Verified ACTIVE→ARCHIVED is allowed (L22) | ✅ |
| STOP-7 | Verify JWT fields before middleware edit | Plan C6 IMPL NOTE references #210 STOP-5, fields verified in review #212 | ✅ |
| STOP-8 | NE install npm packages | Plan §6 "NONE" for schema, no package mentions | ✅ |
| STOP-9 | >6h or >10 files per commit → escalate | Max commit file count: C5=7 files (5 edited + 1 new + 1 API edit) | ✅ |

**ALLOWED_TRANSITIONS verification (STOP-6 deep check):**
```
ACTIVE: ["RESERVED", "SOLD", "ARCHIVED"]  // L22 — ARCHIVED is allowed ✅
```

Partner "Stáhnout z nabídky" → ARCHIVED works. Plan also says "show button only when vehicle status allows ARCHIVED transition" — defense-in-depth. ✅

---

## §7 — Check 6: Middleware positioning (C6)

**Současný stav middleware (L320-336):**
```typescript
// Chráněné routy partnerského portálu
if (pathname.startsWith("/partner")) {
  const token = await getToken({...});
  if (!token) → redirect to /login
  if (!PARTNER_ROLES.includes(token.role)) → redirect to /
}
```

**PARTNER_ROLES (L19):** `["PARTNER_BAZAR", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"]` — 4 roles.

**Plan C6 inserts BEFORE L321:**
```typescript
if (pathname.startsWith("/partner") && !pathname.startsWith("/partner/onboarding")) {
  const token = await getToken({...});
  if (token && PARTNER_ROLES.includes(token.role)
      && token.role !== "ADMIN" && token.role !== "BACKOFFICE") {
    if (token.status === "ONBOARDING" || (token.status === "PENDING" && !token.onboardingCompleted)) {
      return NextResponse.redirect(new URL("/partner/onboarding", request.url));
    }
  }
}
```

| Aspekt | Výsledek | Status |
|--------|---------|--------|
| Loop prevention | `!pathname.startsWith("/partner/onboarding")` | ✅ |
| ADMIN/BACKOFFICE exclusion | `token.role !== "ADMIN" && token.role !== "BACKOFFICE"` | ✅ |
| ONBOARDING redirect | `token.status === "ONBOARDING"` | ✅ |
| PENDING+!completed redirect | `token.status === "PENDING" && !token.onboardingCompleted` | ✅ |
| Separate block, own getToken() | Yes — token fetched twice for partner routes | Plan §10 acknowledges: "Cookie-based, no DB hit; acceptable" ✅ |

**Structural difference from supplier onboarding:** Supplier (#210 C4) inserts onboarding redirect INSIDE existing `/parts` protection block (after role check, L266). Partner (#211 C6) inserts as SEPARATE block BEFORE existing `/partner` protection (L321). Both work but different patterns. → **OBS-3**

**PENDING status handling:** Partner checks both ONBOARDING and PENDING+!onboardingCompleted. Supplier (#210 C4) only checks ONBOARDING. Partner pattern is more thorough — addresses gap noted in review #220 OBS-2. But inconsistent across PWA modules. → **OBS-4**

---

## §8 — Check 7: Ownership model správnost

**Klíčový claim (§1.3):** "Partner vehicle creation (POST `/api/partner/vehicles`) sets `brokerId: session.user.id`. The shared PATCH `/api/vehicles/[id]` checks `brokerId === session.user.id`. Therefore partners CAN edit their vehicles through the shared route."

**EVZEN verifikace:**
- `app/api/vehicles/[id]/route.ts:158` — PATCH: `if (existing.brokerId !== session.user.id && !isAdmin)` → 403
- `app/api/parts/[id]/route.ts:81` — PUT: `if (existing.supplierId !== session.user.id && !isAdmin)` → 403
- `app/api/parts/[id]/route.ts:150` — DELETE: `if (existing.supplierId !== session.user.id && !isAdmin)` → 403

Partner bazar creates vehicles → `brokerId = session.user.id` → shared PATCH allows edit. ✅
Partner vrakoviste creates parts → `supplierId = session.user.id` → shared PUT/DELETE allows edit/delete. ✅

**STOP-5 compliance:** Vehicle route exports PATCH (L158). Part route exports PUT (L81). Different methods correctly documented in plan. ✅

---

## §9 — Check 8: Acceptance criteria kompletnost

### Per-commit criteria

| Commit | Criteria count | Testable? | Status |
|--------|---------------|-----------|--------|
| C1 | 9 items | Mobile viewport + desktop check | ✅ |
| C2 | 6 items | Full CRUD cycle | ✅ |
| C3 | 5 items | CRUD + soft delete | ✅ |
| C4 | 7 items | Status transition chain | ✅ |
| C5 | 7 items | Photo in create + edit | ✅ |
| C6 | 6 items | Onboarding 3 steps + existing users safe | ✅ |
| C7 | 4 items | Offline + loading/error existence | ✅ |

### Smoke tests (3)
1. **Bazar E2E:** Login → bottom nav → create with photos → edit → archive ✅
2. **Vrakoviste E2E:** Login → parts + orders → CRUD + status chain ✅
3. **Onboarding E2E:** New user → 3 steps → admin activates → dashboard ✅

### Post-plan checklist (§12)
15 items including build/lint/tsc, CRUD cycles, photo upload, offline, loading/error states, no new deps, no schema changes, diff target <1500 lines.

✅ **Acceptance criteria kompletní a testovatelná.**

---

## §10 — Check 9: Deferred items (§2)

| Deferred | Reason | Reasonable? |
|----------|--------|-------------|
| Real-time notifications (Pusher) | Not implemented anywhere in codebase | ✅ |
| Two-way messaging/chat | Depends on Pusher or SSE | ✅ |
| Opening hours editor | Nice-to-have | ✅ |
| Invoice PDF generation | Billing shows data, PDF later | ✅ |
| Offline CRUD (IndexedDB) | Heavy feature, infra exists but not wired | ✅ |
| Advanced vehicle photos (carousel, reorder) | Basic upload first | ✅ |

✅ **6 deferrals — all have valid justification.** No features hidden or deleted.

---

## §11 — Check 10: Cross-reference s předchozími reviews

| Review | Relevance | Konzistence |
|--------|-----------|-------------|
| #212 (plan #210) | JWT fields verified: status, onboardingStep, onboardingCompleted in lib/auth.ts | ✅ Plan #211 STOP-7 references same fields |
| #216 (impl C1-C3) | DeletePartDialog cross-module import pattern | ✅ Plan #211 C3 uses same pattern (IMPL NOTE option 2) |
| #220 (impl C4-C5) OBS-1 | PARTS_SUPPLIER_ROLES narrower in API vs middleware | ✅ Plan #211 C6 similarly excludes ADMIN/BACKOFFICE from onboarding |
| #220 OBS-2 | Middleware only redirects ONBOARDING, not PENDING | ⚠️ Plan #211 C6 addresses this for partner (checks PENDING too) but creates cross-module inconsistency → OBS-4 |

---

## §12 — Observations (non-blockers)

| # | Severity | Popis |
|---|----------|-------|
| **OBS-1** | Minor | **PartnerTopBar.tsx missing from §4 file manifest.** C7 §3 says "Files to CREATE: `components/partner/PartnerTopBar.tsx` (~30 lines)" but §4 "New files (17)" table does not include it. True new file count is 18. IMPL should create this file per C7 spec or fold TopBar inline into PartnerLayout (as C1 diff already shows). **Non-blocker** — IMPL will resolve either way. |
| **OBS-2** | Minor | **Edited files count off-by-one.** §4 header says "Edited files (8)" but table lists 9 entries (PartnerLayout, 3 list pages, 2 new pages, API route, middleware, layout.tsx). Additionally, C5 edits `vehicles/[id]/page.tsx` and `parts/[id]/page.tsx` (created in C2/C3) — unlisted in manifest. **Non-blocker** — arithmetic error, doesn't affect implementation. |
| **OBS-3** | Observation | **Middleware structural pattern divergence.** Supplier onboarding redirect (#210 C4) is INSIDE the existing `/parts` protection block. Partner onboarding redirect (#211 C6) is a SEPARATE block BEFORE existing `/partner` protection. Both work correctly but different structural approaches. Means `getToken()` called twice for partner routes. Plan §10 acknowledges perf impact as acceptable (cookie-based, no DB hit). **Non-blocker** — functionally correct. |
| **OBS-4** | Observation | **PENDING status redirect inconsistency across PWA modules.** Partner onboarding checks both `ONBOARDING` AND `PENDING && !onboardingCompleted`. Supplier onboarding (#210 C4) only checks `ONBOARDING`. Partner pattern is more thorough (addresses #220 OBS-2 gap) but creates inconsistency. **Non-blocker** — partner pattern is arguably better. |
| **OBS-5** | Observation | **PartnerLayout current state: emoji icons vs SVG.** Plan §1.4 notes PartnerLayout uses emoji icons (📊🚗👥) while Makler/Díly use SVG. Plan C1 PartnerBottomNav uses "SVG icons with active/inactive states" — correct. But existing sidebar nav items keep emoji icons. Sidebar emoji vs BottomNav SVG creates visual inconsistency on desktop. **Non-blocker** — sidebar refactor can be follow-up. |

---

## §13 — Final verdict

### SCHVÁLENO

Plán #211 je:

- **Complete** — pokrývá všech 5 audit gapů + 2 CRUD gapy, 7 atomic commits, 3 smoke tests
- **Correct** — shared API ownership model verified (brokerId/supplierId checks), ALLOWED_TRANSITIONS confirmed, PATCH vs PUT correctly differentiated (STOP-5)
- **Safe** — 9 STOP rules validní, 0 schema changes, 0 new dependencies, shared API routes NOT edited (STOP-4), escalation threshold at 6h/10 files (STOP-9)
- **Consistent** — LEAD DECISIONS Q1-Q5 all align with plan recommendations, DeletePartDialog cross-module pattern reused from #210
- **Proportional** — ~1200 LOC target for 17+9 files, 6 items deferred with valid justification, no features deleted/hidden

**0 blockerů. 5 minor non-blocker observations (2 manifest arithmetic, 2 middleware patterns, 1 visual consistency).**

**Pipeline GO → implementator dispatch (C1-C4 first batch per Q2 ACCEPT).**
