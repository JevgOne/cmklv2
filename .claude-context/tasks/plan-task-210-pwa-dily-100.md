# Plan Task #210 — PWA Díly Fáze 1: z 85 % na 100 %

**Type:** Implementation plan
**Input:** audit-208-carmakler-stav.md §10.1–§10.2
**Date:** 2026-04-09
**Planner:** planovac (plan-only mode)

---

## §0 Executive summary

PWA Díly (`app/(pwa-parts)/parts/*`) is at ~85 % feature completeness. The backend is surprisingly mature — **PUT and DELETE API routes already exist** with ownership checks and Zod validation. The gap is almost entirely UI:

| Gap | Effort | Type |
|-----|--------|------|
| Part detail view page | S | New page |
| Part edit page (reuse wizard steps) | M | New page + refactor steps |
| Part delete with confirmation | S | New component + wiring |
| PartCard link fix | XS | One-line edit |
| Supplier onboarding flow (3 steps) | L | New pages + middleware |

**Total estimated effort:** ~24 h implementation across 5 atomic commits.

**No DB schema changes.** No new API routes. No new npm dependencies.

---

## §1 Current state inventory

### §1.1 Existing pages (7/7 functional)

| Route | Page | Status |
|-------|------|--------|
| `/parts` | Dashboard (stats + pending orders) | ✅ |
| `/parts/my` | My parts list (status tabs) | ✅ |
| `/parts/new` | 3-step wizard (Photo → Details → Pricing) | ✅ |
| `/parts/orders` | Orders list (5 tabs) | ✅ |
| `/parts/orders/[id]` | Order detail + actions | ✅ |
| `/parts/profile` | Supplier profile + Stripe Connect | ✅ |
| `/parts/import` | CSV bulk import | ✅ |

### §1.2 Existing API routes (all needed endpoints present)

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/parts` | GET | ✅ | List with filters |
| `/api/parts` | POST | ✅ | Create + slug generation |
| `/api/parts/[id]` | GET | ✅ | By ID or slug, includes images + supplier |
| `/api/parts/[id]` | PUT | ✅ | Full update, ownership check, image replace |
| `/api/parts/[id]` | DELETE | ✅ | Soft delete (status → INACTIVE) |
| `/api/parts/supplier-stats` | GET | ✅ | activeParts, pendingOrders, revenue, rating |
| `/api/parts/import` | POST | ✅ | CSV bulk create |
| `/api/orders` | GET | ✅ | `?role=supplier` filter |
| `/api/orders/[id]` | GET/PATCH | ✅ | Order detail + status updates |

### §1.3 Existing components (reusable for edit)

| Component | Location | Reusable? |
|-----------|----------|-----------|
| `PhotoStep` | `components/pwa-parts/parts/PhotoStep.tsx` | ✅ needs `initialPhotos` prop |
| `DetailsStep` | `components/pwa-parts/parts/DetailsStep.tsx` | ✅ needs `initialData` prop |
| `PricingStep` | `components/pwa-parts/parts/PricingStep.tsx` | ✅ needs `initialData` prop |
| `CompatibilitySelector` | `components/pwa-parts/parts/CompatibilitySelector.tsx` | ✅ already prop-driven |
| `PartCard` | `components/pwa-parts/parts/PartCard.tsx` | ✅ needs link fix |
| `SupplierBottomNav` | `components/pwa-parts/SupplierBottomNav.tsx` | ✅ no changes |
| `SupplierTopBar` | `components/pwa-parts/SupplierTopBar.tsx` | ✅ no changes |

### §1.4 Missing pages (the 15 % gap)

| Route | Purpose | Why missing |
|-------|---------|-------------|
| `/parts/[id]` | Part detail view | Never created — PartCard links to `/parts/my` |
| `/parts/[id]/edit` | Part edit wizard | PUT API exists, UI doesn't |
| `/parts/onboarding` | Onboarding router | Supplier onboarding not implemented |
| `/parts/onboarding/profile` | Step 1: Company info | — |
| `/parts/onboarding/documents` | Step 2: Documents | — |
| `/parts/onboarding/approval` | Step 3: Pending approval | — |

### §1.5 Key architectural facts

1. **PUT `/api/parts/[id]`** (`app/api/parts/[id]/route.ts:48-100`) — already handles:
   - Session auth + ownership check (supplierId match or ADMIN/BACKOFFICE)
   - `updatePartSchema` = `createPartSchema.partial()` — all fields optional
   - Image replacement: deletes all existing PartImage rows, creates new ones
   - Serializes `compatibleBrands`/`compatibleModels` to JSON strings

2. **DELETE `/api/parts/[id]`** (`app/api/parts/[id]/route.ts:102-130`) — soft delete sets `status: "INACTIVE"`

3. **GET `/api/parts/[id]`** (`app/api/parts/[id]/route.ts:12-46`) — returns part by ID or slug, includes images (ordered) + supplier info, increments viewCount

4. **Onboarding infra**: `User.onboardingStep` (Int, default 1) and `User.onboardingCompleted` (Boolean) already exist in schema. `User.status` has PENDING/ONBOARDING/ACTIVE states. Middleware already has broker onboarding redirect pattern at line 192-247 — supplier version follows same structure.

5. **Photo upload**: `PhotoStep` posts FormData to `/api/upload` which uses Cloudinary. Works if `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` env vars are set. Currently NOT set in `.env.local` — this is an **env dependency**, not a code gap.

---

## §2 Gaps NOT in scope for Fáze 1

These are known gaps from audit §10.2 that are deferred to Fáze 2+:

| Gap | Reason for deferral |
|-----|---------------------|
| Real-time notifications (Pusher) | Pusher not implemented anywhere in codebase |
| Buyer messaging / chat | Depends on Pusher or alternative (SSE) — heavy feature |
| Rating system | `rating` field returns hardcoded 0; needs review/rating model |
| Advanced search/filter on `/parts/my` | Nice-to-have, not blocking 100% |
| Offline CRUD (IndexedDB queue) | PWA offline infrastructure exists but part-specific offline mutations not wired |
| Webhook order notifications | Needs external service (email/SMS) — Resend not configured |

---

## §3 Implementation plan

### Commit 1 — Part detail view + PartCard link fix

**Goal:** Supplier can tap a part in My Parts → see full detail with status, images, all fields.

**Files to CREATE:**

#### `app/(pwa-parts)/parts/[id]/page.tsx` (~120 lines)
Part detail view page. Server component or client with fetch.

```
Structure:
- Fetch GET /api/parts/[id] (use params.id)
- Image carousel (swipeable, show all images)
- Status badge (ACTIVE/INACTIVE/SOLD/DRAFT)
- Part name (h1)
- Price (large, bold) + VAT indicator
- Category badge + Condition badge
- Description (if exists)
- Manufacturer + OEM number (if exists)
- Warranty (if exists)
- Compatibility list (brand/model/year entries)
- Stock quantity
- View count
- Action buttons:
  - "Upravit" → link to /parts/[id]/edit (primary button)
  - "Smazat" → opens DeletePartDialog (danger button)
  - "Zpět" → link to /parts/my
```

**Files to EDIT:**

#### `components/pwa-parts/parts/PartCard.tsx` (line ~53)
Change link target from `/parts/my` to `/parts/${id}`.

Current (line ~53):
```tsx
<Link href="/parts/my" ...>
```
Change to:
```tsx
<Link href={`/parts/${id}`} ...>
```

**Acceptance criteria (C1):**
- [ ] Navigate `/parts/my` → tap PartCard → lands on `/parts/[partId]`
- [ ] Detail page renders all part fields from API response
- [ ] Image carousel shows all photos (or fallback 🔧 if no images)
- [ ] "Upravit" button links to `/parts/[partId]/edit`
- [ ] "Zpět" goes back to `/parts/my`
- [ ] Non-owner gets 403 or redirect (middleware already handles role; page should check ownership for edit/delete buttons visibility)

---

### Commit 2 — Part edit page (reuse wizard steps)

**Goal:** Supplier can edit any of their parts. Reuse existing PhotoStep/DetailsStep/PricingStep with pre-populated data.

**Files to CREATE:**

#### `app/(pwa-parts)/parts/[id]/edit/page.tsx` (~150 lines)
Edit wizard page. Client component ("use client").

```
Structure:
- Fetch GET /api/parts/[id] on mount → populate state
- Show loading skeleton while fetching
- Same 3-step wizard as /parts/new:
  Step 1: PhotoStep (pre-populated with existing images)
  Step 2: DetailsStep (pre-populated with name, category, condition, etc.)
  Step 3: PricingStep (pre-populated with price, VAT, stock, warranty, delivery)
- On final "Uložit":
  - PUT /api/parts/[id] with all fields
  - Include images array (with url, order, isPrimary)
  - On success → redirect to /parts/[id] (detail)
  - On error → show error toast
- "Zrušit" link → /parts/[id]
```

**Files to EDIT:**

#### `components/pwa-parts/parts/PhotoStep.tsx`
Add optional `initialPhotos` prop. If provided, pre-populate the photos array on mount.

Current interface (implicit from usage):
```tsx
interface Props {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  onNext: () => void;
}
```
No code change needed if parent passes pre-populated `photos` prop — **verify at impl time**. The component is already controlled (photos come from parent state). If the parent initializes state from API data, PhotoStep will render them. Likely **zero changes** to PhotoStep itself.

#### `components/pwa-parts/parts/DetailsStep.tsx`
Same pattern — already controlled by parent via props. Parent initializes state from API → passes to DetailsStep. Likely **zero changes**.

Key fields to map from API response to DetailsStep props:
- `name` → `details.name`
- `category` → `details.category`
- `condition` → mapped from Part.condition to DetailsStep condition enum
- `description` → `details.description`
- `oemNumber` → `details.oemNumber`
- `manufacturer` → `details.manufacturer`
- `compatibleBrands` / `compatibleModels` → `details.compatibility` array

**IMPL NOTE:** The API returns `compatibleBrands` and `compatibleModels` as JSON strings (serialized arrays). The edit page must parse them back: `JSON.parse(part.compatibleBrands)`. The DetailsStep uses a structured `compatibility` array with `{ brand, model, yearFrom, yearTo }` objects. The edit page must reconstruct this from the flat `compatibleBrands`/`compatibleModels` + `compatibleYearFrom`/`compatibleYearTo` fields. This is the main mapping complexity.

#### `components/pwa-parts/parts/PricingStep.tsx`
Same pattern — controlled by parent. Likely **zero changes**.

Key fields to map:
- `price` → `pricing.price`
- `vatIncluded` → `pricing.vatIncluded`
- `stock` → `pricing.quantity` (field name difference: API uses `stock`, PricingStep uses `quantity`)
- `warranty` → `pricing.warranty`
- Delivery options: not stored on Part model — either derive from existing data or let supplier re-select. **Decision for IMPL:** if Part model lacks `deliveryOptions` field, skip pre-population of delivery checkboxes. Supplier must re-confirm delivery each edit. This is acceptable for MVP.

**Acceptance criteria (C2):**
- [ ] Navigate `/parts/[id]` → "Upravit" → lands on `/parts/[id]/edit`
- [ ] All 3 wizard steps pre-populated with existing data
- [ ] Photos show existing images (editable: add/remove)
- [ ] Compatibility entries reconstructed from API data
- [ ] "Uložit" sends PUT → part updated → redirect to `/parts/[id]`
- [ ] Editing images replaces all (API behavior: deleteMany + createMany)
- [ ] "Zrušit" returns to detail without changes
- [ ] Non-owner cannot access edit page (show error or redirect)

---

### Commit 3 — Part delete with confirmation

**Goal:** Supplier can delete (soft-delete) their parts from the detail page.

**Files to CREATE:**

#### `components/pwa-parts/parts/DeletePartDialog.tsx` (~60 lines)
Confirmation dialog component.

```
Structure:
- Props: { partId: string; partName: string; isOpen: boolean; onClose: () => void; onDeleted: () => void; }
- Modal overlay with:
  - Warning icon
  - "Opravdu chcete smazat díl '{partName}'?"
  - "Díl bude deaktivován a nebude viditelný v katalogu."
  - "Zrušit" button (secondary) → onClose
  - "Smazat" button (danger/red) → DELETE /api/parts/[partId] → onDeleted
- Loading state on delete button
- Error handling (toast on failure)
```

**Files to EDIT:**

#### `app/(pwa-parts)/parts/[id]/page.tsx` (from Commit 1)
Wire "Smazat" button to open `DeletePartDialog`. On successful delete → redirect to `/parts/my`.

**Acceptance criteria (C3):**
- [ ] "Smazat" button on detail page opens confirmation dialog
- [ ] Dialog shows part name
- [ ] "Zrušit" closes dialog without action
- [ ] "Smazat" sends DELETE → part status becomes INACTIVE → redirect to `/parts/my`
- [ ] Part disappears from ACTIVE tab, appears in INACTIVE tab on `/parts/my`
- [ ] Non-owner cannot see delete button

---

### Commit 4 — Supplier onboarding flow (3 steps)

**Goal:** New suppliers go through onboarding before accessing the dashboard. Follows the same pattern as broker onboarding (`app/(pwa)/makler/onboarding/*`).

**Design decision:** Supplier onboarding is simpler than broker (3 steps vs 5):

| Step | Route | Purpose |
|------|-------|---------|
| 1 | `/parts/onboarding/profile` | Company name, IČO, contact info, address |
| 2 | `/parts/onboarding/documents` | Upload: živnostenský list / výpis z OR |
| 3 | `/parts/onboarding/approval` | Waiting screen (status=PENDING → ACTIVE by admin) |

**Files to CREATE:**

#### `app/(pwa-parts)/parts/onboarding/page.tsx` (~25 lines)
Router page — reads session `onboardingStep`, redirects to correct step.

```tsx
// Pattern from app/(pwa)/makler/onboarding/page.tsx
const step = session.user.onboardingStep ?? 1;
switch (step) {
  case 1: redirect("/parts/onboarding/profile");
  case 2: redirect("/parts/onboarding/documents");
  case 3: redirect("/parts/onboarding/approval");
  default: redirect("/parts");
}
```

#### `app/(pwa-parts)/parts/onboarding/profile/page.tsx` (~130 lines)
Step 1: Company profile form.

```
Fields:
- companyName (required) — maps to User.companyName
- ico (required) — maps to User.ico (IČO validation: 8 digits)
- phone (required)
- email (pre-filled from session, read-only)
- address (street, city, zip)
- description (optional)

On submit:
- PATCH /api/auth/onboarding (or PUT /api/partner/profile)
- Set onboardingStep = 2
- Redirect to /parts/onboarding/documents
```

#### `app/(pwa-parts)/parts/onboarding/documents/page.tsx` (~120 lines)
Step 2: Document upload.

```
Required documents:
- Živnostenský list / Výpis z obchodního rejstříku (image/PDF upload)
- Občanský průkaz (image upload)

On submit:
- Upload files via /api/upload
- Save document references (PATCH /api/auth/onboarding with step=3)
- Redirect to /parts/onboarding/approval
```

#### `app/(pwa-parts)/parts/onboarding/approval/page.tsx` (~80 lines)
Step 3: Waiting for admin approval.

```
- Status card: "Vaše registrace je v procesu schvalování"
- "Zkontrolujeme vaše dokumenty do 24 hodin"
- Contact info for support
- Logout button
- No action possible — admin approves in /admin panel (sets status=ACTIVE)
```

#### `app/api/auth/supplier-onboarding/route.ts` (~60 lines)
API route for saving onboarding steps.

```
PATCH handler:
- Auth check (session required)
- Role check (PARTS_SUPPLIER, WHOLESALE_SUPPLIER, PARTNER_VRAKOVISTE)
- Accept: { step: number, data: { companyName?, ico?, phone?, documents?: string[] } }
- Step 1: Update User (companyName, ico, phone, address fields)
- Step 2: Save document URLs to user (or a documents table if exists)
- Update onboardingStep to next value
- Return { success: true, nextStep }
```

**Files to EDIT:**

#### `middleware.ts` (~10 lines added, around line 250)
Add supplier onboarding redirect BEFORE the existing `/parts` protection block.

```tsx
// Insert BEFORE line 251 (protectedPartsPaths block):

// Supplier onboarding redirect
if (pathname.startsWith("/parts") && !pathname.startsWith("/parts/onboarding")) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token && PARTS_SUPPLIER_ROLES.includes(token.role as string)) {
    if (token.status === "ONBOARDING" || (token.status === "PENDING" && !token.onboardingCompleted)) {
      return NextResponse.redirect(new URL("/parts/onboarding", request.url));
    }
  }
}
```

**IMPL NOTE:** The `getToken()` call for supplier onboarding happens BEFORE the existing `/parts` protection block (line 251-269). To avoid double `getToken()` calls, IMPL should refactor: hoist the token fetch and reuse it. But this is an optimization, not a blocker — two `getToken()` calls is functionally correct (it reads from cookie, no DB hit).

**IMPL NOTE 2:** The NextAuth JWT token must include `status` and `onboardingCompleted` fields. Check `lib/auth.ts` JWT callback — if these fields are not forwarded to the token, add them. The broker onboarding already relies on `token.status === "ONBOARDING"` (middleware line 245), so `status` is likely already in the token. Verify.

**Acceptance criteria (C4):**
- [ ] New supplier (status=PENDING or ONBOARDING) → any `/parts/*` route → redirected to `/parts/onboarding`
- [ ] `/parts/onboarding` reads step → redirects to correct sub-page
- [ ] Step 1: form validates IČO (8 digits), saves company info, advances to step 2
- [ ] Step 2: file upload works (via /api/upload), saves references, advances to step 3
- [ ] Step 3: shows waiting message, no further action possible
- [ ] Admin sets user status=ACTIVE → supplier can access `/parts` dashboard
- [ ] Existing ACTIVE suppliers are NOT redirected to onboarding
- [ ] `/parts/onboarding/*` routes accessible only by suppliers in ONBOARDING/PENDING status

---

### Commit 5 — Polish: loading/error states + navigation

**Goal:** Add missing loading.tsx and error.tsx for new routes. Ensure navigation consistency.

**Files to CREATE:**

#### `app/(pwa-parts)/parts/[id]/loading.tsx` (~15 lines)
Skeleton for part detail page (image placeholder + text lines).

#### `app/(pwa-parts)/parts/[id]/edit/loading.tsx` (~15 lines)
Skeleton for edit wizard.

#### `app/(pwa-parts)/parts/[id]/error.tsx` (~20 lines)
Error boundary with "Díl nenalezen" message and retry button.

#### `app/(pwa-parts)/parts/onboarding/loading.tsx` (~10 lines)
Simple spinner.

**Files to EDIT:**

#### `app/(pwa-parts)/parts/my/page.tsx` (~3 lines)
Add empty state improvement: when no parts exist, show CTA linking to `/parts/new` with more prominent design (instead of just empty list).

**Acceptance criteria (C5):**
- [ ] Loading skeletons appear during data fetch on detail and edit pages
- [ ] Error boundary catches API failures gracefully
- [ ] Empty state on My Parts shows clear CTA to add first part

---

## §4 File manifest

### New files (12)

| File | Commit | Lines (est.) |
|------|--------|-------------|
| `app/(pwa-parts)/parts/[id]/page.tsx` | C1 | ~120 |
| `app/(pwa-parts)/parts/[id]/edit/page.tsx` | C2 | ~150 |
| `components/pwa-parts/parts/DeletePartDialog.tsx` | C3 | ~60 |
| `app/(pwa-parts)/parts/onboarding/page.tsx` | C4 | ~25 |
| `app/(pwa-parts)/parts/onboarding/profile/page.tsx` | C4 | ~130 |
| `app/(pwa-parts)/parts/onboarding/documents/page.tsx` | C4 | ~120 |
| `app/(pwa-parts)/parts/onboarding/approval/page.tsx` | C4 | ~80 |
| `app/api/auth/supplier-onboarding/route.ts` | C4 | ~60 |
| `app/(pwa-parts)/parts/[id]/loading.tsx` | C5 | ~15 |
| `app/(pwa-parts)/parts/[id]/edit/loading.tsx` | C5 | ~15 |
| `app/(pwa-parts)/parts/[id]/error.tsx` | C5 | ~20 |
| `app/(pwa-parts)/parts/onboarding/loading.tsx` | C5 | ~10 |

### Edited files (3-4)

| File | Commit | Change |
|------|--------|--------|
| `components/pwa-parts/parts/PartCard.tsx` | C1 | Link href `/parts/my` → `/parts/${id}` |
| `middleware.ts` | C4 | Add supplier onboarding redirect (~10 lines before line 251) |
| `lib/auth.ts` | C4 | Ensure `status` + `onboardingCompleted` in JWT token (verify first — may already be there) |
| `app/(pwa-parts)/parts/my/page.tsx` | C5 | Improve empty state CTA |

### Files NOT to edit (API is complete)

| File | Reason |
|------|--------|
| `app/api/parts/route.ts` | POST already works |
| `app/api/parts/[id]/route.ts` | GET/PUT/DELETE all working |
| `app/api/parts/supplier-stats/route.ts` | Stats API working |
| `app/api/orders/*` | Order APIs working |
| `lib/validators/parts.ts` | Zod schemas correct |
| `prisma/schema.prisma` | No model changes needed |

---

## §5 API routes needed

**New (1):**
- `PATCH /api/auth/supplier-onboarding` — Save onboarding step data

**Existing (used by new pages, no changes):**
- `GET /api/parts/[id]` — Detail + edit page data source
- `PUT /api/parts/[id]` — Edit page submission
- `DELETE /api/parts/[id]` — Delete action
- `POST /api/upload` — Photo upload (Cloudinary)

---

## §6 DB schema changes

**NONE.** All fields needed already exist:

- `User.onboardingStep: Int @default(1)` — tracks current onboarding step
- `User.onboardingCompleted: Boolean @default(false)` — completion flag
- `User.status: String @default("PENDING")` — PENDING/ONBOARDING/ACTIVE
- `User.companyName: String?` — company name
- `User.ico: String?` — IČO (company registration)
- `User.icoVerified: Boolean` — IČO verification flag
- `Part.status` — DRAFT/ACTIVE/SOLD/INACTIVE (soft delete target)

---

## §7 Delivery pipeline

```
C1  Part detail view + PartCard link fix
 │   └─ git commit -m "feat(parts): add part detail page + fix PartCard link (#210)"
 ↓
C2  Part edit page (reuse wizard steps)
 │   └─ git commit -m "feat(parts): add part edit page with wizard reuse (#210)"
 ↓
C3  Delete confirmation dialog
 │   └─ git commit -m "feat(parts): add part delete with confirmation dialog (#210)"
 ↓
C4  Supplier onboarding (3 steps + middleware)
 │   └─ git commit -m "feat(parts): add supplier onboarding flow + middleware redirect (#210)"
 ↓
C5  Loading/error states + polish
     └─ git commit -m "feat(parts): add loading/error boundaries for detail + onboarding (#210)"
```

**Ordering rationale:**
- C1 before C2: Detail page is the entry point to edit — edit page links back to it
- C2 before C3: Delete button lives on detail page (C1), but edit must work first
- C3 before C4: CRUD complete before onboarding (core flow > onboarding)
- C5 last: Polish pass after all features land

**Each commit is independently deployable and testable.**

---

## §8 STOP rules for implementator

### STOP-1: Do NOT create or edit API routes for parts CRUD
PUT, DELETE, GET at `/api/parts/[id]` already work. POST at `/api/parts` already works. The Zod schemas in `lib/validators/parts.ts` are correct. Do NOT touch these files unless a bug is discovered during implementation.

### STOP-2: Do NOT modify the Prisma schema
`onboardingStep`, `onboardingCompleted`, `status`, `companyName`, `ico` all exist. No `prisma migrate dev` needed. If IMPL thinks a new field is needed, STOP and escalate to planovac.

### STOP-3: Do NOT install new npm packages
Everything needed (Next.js, React, Tailwind, Zod, NextAuth) is already installed. Delete confirmation dialog uses native HTML dialog or existing UI components — no modal library needed.

### STOP-4: Do NOT refactor existing wizard steps
PhotoStep, DetailsStep, PricingStep are controlled components — parent passes data via props. The edit page should initialize parent state from API data and pass it to these components. Do NOT restructure the step components' internal logic. If a prop interface change is needed, add optional props — do not change existing required props.

### STOP-5: Verify JWT token fields before middleware edit
Before adding supplier onboarding redirect to middleware.ts, verify that `lib/auth.ts` JWT callback includes `status` and `onboardingCompleted`. If missing, add them to the JWT callback (same pattern as `role` field). Do NOT proceed with middleware edit until this is confirmed.

### STOP-6: Compatibility data reconstruction
The API stores `compatibleBrands` (JSON string array) and `compatibleModels` (JSON string array) separately from `compatibleYearFrom`/`compatibleYearTo` (integers). The edit page wizard uses a structured array: `[{ brand, model, yearFrom, yearTo }]`. The reconstruction mapping is:
```
API → Edit wizard:
  compatibleBrands: '["Škoda","VW"]' → parse → ["Škoda", "VW"]
  compatibleModels: '["Octavia","Golf"]' → parse → ["Octavia", "Golf"]
  compatibleYearFrom: 2015
  compatibleYearTo: 2023
  → compatibility: [
      { brand: "Škoda", model: "Octavia", yearFrom: 2015, yearTo: 2023 },
      { brand: "VW", model: "Golf", yearFrom: 2015, yearTo: 2023 }
    ]
```
This is a **best-effort** reconstruction (year range is shared across all entries). If the original data had different year ranges per brand, that granularity was lost at create time. This is acceptable — do NOT add new DB fields to fix this.

### STOP-7: Photo upload requires Cloudinary env vars
PhotoStep posts to `/api/upload` which uses Cloudinary. If `CLOUDINARY_*` env vars are not in `.env.local`, photo upload will fail silently or return 500. This is an **env configuration issue**, not a code bug. IMPL should document the requirement but NOT add fallback upload logic.

### STOP-8: Escalation threshold
If any single commit takes more than 6 hours of wall time or touches more than 8 files, STOP and escalate to planovac. The plan is designed for 3-5 files per commit.

---

## §9 Acceptance criteria (summary)

### Per-commit (detailed above in §3)

| Commit | Key check |
|--------|-----------|
| C1 | PartCard → `/parts/[id]` → detail renders all fields |
| C2 | Detail → "Upravit" → edit wizard pre-populated → PUT → updated |
| C3 | Detail → "Smazat" → confirmation → DELETE → INACTIVE |
| C4 | New supplier → redirected to onboarding → 3 steps → awaits approval |
| C5 | Loading skeletons + error boundaries on all new routes |

### End-to-end smoke test (after all 5 commits)

1. Login as `dily@carmakler.cz` (PARTS_SUPPLIER, ACTIVE)
2. Navigate to `/parts/my` → see list of parts
3. Tap a part → see detail page with all info
4. Tap "Upravit" → edit wizard with pre-populated data
5. Change price → "Uložit" → back to detail → price updated
6. Tap "Smazat" → confirm → part disappears from ACTIVE tab, appears in INACTIVE
7. Add new part via `/parts/new` → appears in ACTIVE tab
8. Tap new part → detail shows correct data

### Onboarding smoke test (separate seed user)

1. Create test user with `role=PARTS_SUPPLIER, status=ONBOARDING, onboardingStep=1`
2. Login → redirected to `/parts/onboarding/profile`
3. Fill company info → "Pokračovat" → redirected to `/parts/onboarding/documents`
4. Upload documents → "Pokračovat" → redirected to `/parts/onboarding/approval`
5. See waiting message
6. Admin sets `status=ACTIVE` in admin panel
7. Refresh → redirected to `/parts` dashboard

---

## §10 Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cloudinary env vars missing → photo upload fails | Medium | Document in commit message; photos already work in wizard if env is set |
| Compatibility data reconstruction lossy | Low | Year range shared across entries — acceptable for MVP, no data loss |
| `getToken()` called twice in middleware (onboarding + role check) | Low perf | Cookie-based, no DB hit; optimize in future if needed |
| Step components have hidden state assumptions | Medium | STOP-4: test each step in isolation before wiring full edit flow |
| Delivery options not stored on Part model | Low | Skip pre-population in edit; supplier re-confirms delivery each time |

---

## §11 Dependencies

| Dependency | Status | Impact if missing |
|------------|--------|-------------------|
| Cloudinary env vars | ❌ NOT SET in .env.local | Photo upload won't work (existing issue, pre-dates #210) |
| Dev server running | ✅ PID active | Required for testing |
| Seed data (dily@carmakler.cz) | ✅ EXISTS | Required for smoke test |
| Admin panel user management | ✅ EXISTS at /admin | Required for onboarding approval step |

---

## §12 Open questions for team-lead

**Q1:** Should the part detail page (`/parts/[id]`) be accessible to buyers/public, or only to the supplier who owns it?
- **Planovac recommendation:** Supplier-only (behind middleware `/parts/*` auth). Buyers see parts via the public catalog at `/dily/[slug]`. The detail page is a management view, not a storefront.
- **Needs decision from lead.**

**Q2:** Should onboarding be enforced for existing ACTIVE suppliers, or only for new registrations?
- **Planovac recommendation:** Only new registrations. Existing seed users (`dily@carmakler.cz`, `velkoobchod@carmakler.cz`) have `status=ACTIVE` — they bypass onboarding. Setting `status=ONBOARDING` on existing users would lock them out.
- **Needs decision from lead.**

**Q3:** Priority order: Should IMPL do C1-C3 (CRUD) first and defer C4 (onboarding) to a separate PR?
- **Planovac recommendation:** Yes — CRUD is higher priority and independently valuable. Onboarding can be C4+C5 in a separate dispatch if lead prefers smaller batches.
- **Needs decision from lead.**

---

## §13 Post-plan validation checklist

After IMPL completes all commits:

- [ ] `npm run build` passes (no type errors)
- [ ] `npm run lint` passes
- [ ] Part CRUD cycle works end-to-end (create → view → edit → delete)
- [ ] Onboarding flow works for new supplier
- [ ] Existing ACTIVE suppliers NOT affected by onboarding middleware
- [ ] All new routes have loading.tsx and error.tsx
- [ ] No new npm dependencies added
- [ ] No Prisma schema changes
- [ ] Total diff < 1000 lines (target: ~800 across 12 new + 4 edited files)
