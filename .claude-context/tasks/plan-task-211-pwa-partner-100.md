# Plan Task #211 — PWA Partner Fáze 1: z 70 % na 100 %

**Type:** Implementation plan
**Input:** audit-208-carmakler-stav.md §10.3–§10.4
**Date:** 2026-04-11
**Planner:** planovac (plan-only mode)

---

## §0 Executive summary

PWA Partner (`app/(partner)/partner/*`) is at ~70 % feature completeness. It has 13 working pages, 8 API routes, and dual-role support (PARTNER_BAZAR + PARTNER_VRAKOVISTE). The 30 % gap falls into 5 categories:

| Gap | Effort | Impact |
|-----|--------|--------|
| 1. Mobile layout (sidebar → BottomNav) | M | UX — currently desktop-first, unusable as PWA |
| 2. Vehicle detail/edit page | M | CRUD incomplete for Bazar |
| 3. Part detail/edit page | S | CRUD incomplete for Vrakoviste |
| 4. Order detail + status actions | M | Vrakoviste can't process orders |
| 5. Photo upload in create/edit forms | M | No images on vehicles/parts |
| 6. Partner onboarding flow | L | New partners can't register |

**Key finding:** Most API routes already exist. Vehicle PATCH is at shared `/api/vehicles/[id]` with ownership check. Part PUT/DELETE is at shared `/api/parts/[id]`. Order GET + status PATCH is at `/api/orders/[id]` + `/api/orders/[id]/status`. The work is predominantly UI.

**Total estimated effort:** ~32 h across 7 atomic commits.
**DB schema changes:** NONE.
**New API routes:** 1 (partner onboarding step save).

---

## §1 Current state inventory

### §1.1 Existing pages (13)

| Route | Page | Role | Status |
|-------|------|------|--------|
| `/partner/dashboard` | Dashboard (role-based stats) | Both | ✅ |
| `/partner/vehicles` | Vehicle list + status tabs | Bazar | ✅ |
| `/partner/vehicles/new` | Add vehicle form | Bazar | ✅ (no photos) |
| `/partner/parts` | Parts list + pagination | Vrakoviste | ✅ |
| `/partner/parts/new` | Add part form | Vrakoviste | ✅ (no photos) |
| `/partner/orders` | Orders list | Vrakoviste | ✅ (no detail link) |
| `/partner/leads` | Lead management + status | Bazar | ✅ |
| `/partner/billing` | Revenue/commission/payout | Vrakoviste | ✅ |
| `/partner/stats` | Analytics (role-based) | Both | ✅ |
| `/partner/messages` | Notification list | Both | ✅ (placeholder) |
| `/partner/documents` | Static document list | Both | ✅ |
| `/partner/profile` | Profile edit form | Both | ✅ (no opening hrs) |

All 13 pages have loading.tsx + error.tsx boundaries.

### §1.2 Existing API routes

| Endpoint | Method | Used by | Status |
|----------|--------|---------|--------|
| `/api/partner/dashboard` | GET | Dashboard | ✅ |
| `/api/partner/vehicles` | GET, POST | Vehicles list/new | ✅ |
| `/api/partner/parts` | GET, POST | Parts list/new | ✅ |
| `/api/partner/leads` | GET | Leads list | ✅ |
| `/api/partner/leads/[id]` | PATCH | Lead status update | ✅ |
| `/api/partner/billing` | GET | Billing page | ✅ |
| `/api/partner/stats` | GET | Stats page | ✅ |
| `/api/partner/profile` | GET, PUT | Profile page | ✅ |

### §1.3 Shared API routes usable by partners

| Endpoint | Method | Auth model | Usable? |
|----------|--------|------------|---------|
| `/api/vehicles/[id]` | GET | Public (with admin extras) | ✅ for detail |
| `/api/vehicles/[id]` | PATCH | `brokerId === session.user.id` or admin | ✅ for edit |
| `/api/vehicles/[id]/status` | PATCH | Owner + admin (with transition rules) | ✅ for archive |
| `/api/parts/[id]` | GET | Public | ✅ for detail |
| `/api/parts/[id]` | PUT | `supplierId === session.user.id` or admin | ✅ for edit |
| `/api/parts/[id]` | DELETE | `supplierId === session.user.id` or admin | ✅ soft delete |
| `/api/orders/[id]` | GET | Buyer, supplier (item check), admin | ✅ for detail |
| `/api/orders/[id]/status` | PATCH | Supplier (item check) or admin | ✅ for status |
| `/api/upload` | POST | Any auth'd user | ✅ for photos |

**Critical insight:** Partner vehicle creation (POST `/api/partner/vehicles`) sets `brokerId: session.user.id`. The shared PATCH `/api/vehicles/[id]` checks `brokerId === session.user.id`. Therefore partners CAN edit their vehicles through the shared route. Same for Vrakoviste parts — `supplierId: session.user.id` matches the shared PUT/DELETE checks.

### §1.4 Current layout architecture

`components/partner/PartnerLayout.tsx` (144 lines):
- **Desktop (lg+):** Fixed sidebar (260px) with role-based nav (bazarNav vs vrakovisteNav)
- **Mobile (<lg):** Hamburger menu opens sidebar as overlay (z-[100])
- **No BottomNav** — mobile UX requires opening hamburger for every navigation
- Uses emoji icons (📊🚗👥 etc.) — not SVG icons like Makler/Dily PWA

Compare to Makler PWA (`components/pwa/BottomNav.tsx`):
- Fixed bottom nav with 5 items + central FAB
- SVG icons with active/inactive states
- `pb-[env(safe-area-inset-bottom)]` for iOS notch

Compare to Dily PWA (`components/pwa-parts/SupplierBottomNav.tsx`):
- Same pattern: 5 items + central "Přidat" FAB
- Green accent color (vs orange for Makler)

### §1.5 Missing pages (the 30 % gap)

| Route | Purpose | Why missing |
|-------|---------|-------------|
| `/partner/vehicles/[id]` | Vehicle detail + edit | No dynamic route |
| `/partner/parts/[id]` | Part detail + edit | No dynamic route |
| `/partner/orders/[id]` | Order detail + status actions | No dynamic route, orders list has no link |
| `/partner/onboarding` | Onboarding router | Not implemented |
| `/partner/onboarding/profile` | Step 1: Company info | — |
| `/partner/onboarding/documents` | Step 2: Documents | — |
| `/partner/onboarding/approval` | Step 3: Pending | — |

---

## §2 Gaps NOT in scope for Fáze 1

| Gap | Reason for deferral |
|-----|---------------------|
| Real-time notifications (Pusher) | Not implemented anywhere in codebase |
| Two-way messaging/chat | Depends on Pusher or SSE — heavy feature |
| Opening hours editor | Nice-to-have for profile, not blocking |
| Invoice PDF generation | Billing page shows data, PDF can come later |
| Offline CRUD (IndexedDB) | PWA offline infra exists but partner-specific mutations not wired |
| Advanced vehicle photos (carousel, reorder) | Basic upload first, polish later |

---

## §3 Implementation plan

### Commit 1 — PartnerBottomNav + layout dual mode

**Goal:** Mobile users get a fixed bottom nav (like Makler/Dily PWA) instead of hamburger sidebar. Desktop keeps sidebar.

**Files to CREATE:**

#### `components/partner/PartnerBottomNav.tsx` (~110 lines)
Bottom navigation component with role-based items.

```
Bazar variant (5 items):
1. "Domů" → /partner/dashboard (home icon)
2. "Vozidla" → /partner/vehicles (car icon)
3. "Přidat" → /partner/vehicles/new (central FAB, orange circle)
4. "Zájemci" → /partner/leads (users icon)
5. "Profil" → /partner/profile (user icon)

Vrakoviste variant (5 items):
1. "Domů" → /partner/dashboard (home icon)
2. "Díly" → /partner/parts (box icon)
3. "Přidat" → /partner/parts/new (central FAB, orange circle)
4. "Objednávky" → /partner/orders (clipboard icon)
5. "Profil" → /partner/profile (user icon)

Structure:
- Uses useSession() to determine role → select nav variant
- Fixed bottom, z-50, bg-white, border-t
- pb-[env(safe-area-inset-bottom)] for iOS
- SVG icons with active/inactive state (follow Makler BottomNav pattern)
- Central FAB with -mt-3 offset + shadow
```

**Files to EDIT:**

#### `components/partner/PartnerLayout.tsx` (~30 lines changed)
Refactor to dual layout:
- Desktop (lg+): Keep existing sidebar (unchanged)
- Mobile (<lg): Remove hamburger header → add PartnerBottomNav + simple TopBar

```diff
+ import { PartnerBottomNav } from "@/components/partner/PartnerBottomNav";

  // Mobile header: replace hamburger with simple top bar
- <header className="lg:hidden sticky top-0 ...">
-   <button onClick={() => setSidebarOpen(true)} ...>☰</button>
-   <img src="/brand/logo-dark.png" ... />
- </header>
+ <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
+   <div className="flex items-center justify-center">
+     <img src="/brand/logo-dark.png" alt="CarMakler" className="h-7" />
+     <span className="ml-2 text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">PARTNER</span>
+   </div>
+ </header>

  // Main content: add top/bottom padding on mobile for fixed bars
- <main className="p-4 sm:p-6 lg:p-8 max-w-7xl">{children}</main>
+ <main className="p-4 sm:p-6 lg:p-8 max-w-7xl pt-[calc(56px+16px)] lg:pt-4 pb-24 lg:pb-8">{children}</main>

+ {/* Mobile bottom nav */}
+ <div className="lg:hidden">
+   <PartnerBottomNav />
+ </div>
```

**IMPL NOTE:** The mobile hamburger + sidebar overlay code (lines 50-55 for backdrop, the `sidebarOpen` state, the mobile `<header>` block) should be kept for desktop sidebar but conditionally hidden on mobile. The `max-lg:-translate-x-full` on sidebar already handles this — sidebar is always hidden on mobile. Just replace the mobile trigger (hamburger) with a static top bar + bottom nav.

**Acceptance criteria (C1):**
- [ ] Mobile viewport (375×667): Fixed bottom nav visible with 5 items
- [ ] Bazar role: shows Dashboard, Vozidla, Přidat (→vehicles/new), Zájemci, Profil
- [ ] Vrakoviste role: shows Dashboard, Díly, Přidat (→parts/new), Objednávky, Profil
- [ ] Central "Přidat" FAB visually prominent (orange, elevated)
- [ ] Active route highlighted (orange text/icon)
- [ ] Desktop (1280px+): Sidebar unchanged, bottom nav hidden
- [ ] No hamburger menu on mobile (replaced by top bar)
- [ ] Sidebar still navigable on desktop
- [ ] Stats, Messages, Documents, Billing accessible via Dashboard → links or through sidebar on desktop (secondary navigation)

**IMPL NOTE on secondary nav:** BottomNav has 5 slots but partner has 7-8 pages. Stats/Messages/Documents/Billing are secondary — accessible via dashboard quick-links or desktop sidebar. This matches how Makler PWA handles it (stats, leads not in bottom nav, accessible from dashboard). If lead wants all pages in BottomNav, escalate — 7 items won't fit.

---

### Commit 2 — Vehicle detail/edit page (Bazar)

**Goal:** Bazar partner can view and edit their vehicle listings.

**Files to CREATE:**

#### `app/(partner)/partner/vehicles/[id]/page.tsx` (~200 lines)
Combined detail + inline edit page. Client component.

```
Structure:
- Fetch GET /api/vehicles/[id] on mount
- View mode (default):
  - Vehicle image(s) at top (or placeholder)
  - Status badge
  - Brand + Model + Year (h1)
  - Price (large, bold)
  - Specs grid: mileage, fuel, transmission, power, VIN, city
  - Description
  - Inquiry count, view count
  - Action buttons:
    - "Upravit" → switch to edit mode (same page, state toggle)
    - "Stáhnout z nabídky" → PATCH /api/vehicles/[id]/status { status: "ARCHIVED" }
    - "Zpět" → /partner/vehicles
- Edit mode:
  - Pre-populated form (reuse same fields as vehicles/new)
  - Submit → PATCH /api/vehicles/[id] with changed fields
  - "Zrušit" → back to view mode
  - "Uložit" → PATCH then back to view mode with refreshed data
```

#### `app/(partner)/partner/vehicles/[id]/loading.tsx` (~15 lines)
#### `app/(partner)/partner/vehicles/[id]/error.tsx` (~20 lines)

**Files to EDIT:**

#### `app/(partner)/partner/vehicles/page.tsx` (~3 lines)
Make vehicle cards clickable → link to `/partner/vehicles/[id]`.

Current: Cards are non-clickable `<Card>` components.
Change: Wrap each card in `<Link href={/partner/vehicles/${vehicle.id}}>`.

**Acceptance criteria (C2):**
- [ ] Vehicles list → tap card → lands on `/partner/vehicles/[vehicleId]`
- [ ] Detail shows all vehicle fields from API
- [ ] "Upravit" switches to edit form with pre-populated data
- [ ] Edit → "Uložit" → PATCH → data updated → back to view mode
- [ ] "Stáhnout z nabídky" → status change to ARCHIVED → redirect to list
- [ ] Non-owner cannot access (shared API PATCH has ownership check)

---

### Commit 3 — Part detail/edit + delete (Vrakoviste)

**Goal:** Vrakoviste partner can view, edit, and delete (soft-delete) their parts.

**Files to CREATE:**

#### `app/(partner)/partner/parts/[id]/page.tsx` (~200 lines)
Combined detail + inline edit page. Same pattern as vehicles/[id].

```
Structure:
- Fetch GET /api/parts/[id] on mount
- View mode:
  - Image(s) or placeholder
  - Status badge
  - Part name (h1)
  - Price + stock quantity
  - Category + Condition badges
  - Description, OEM number, manufacturer
  - Compatible brands/models
  - Action buttons:
    - "Upravit" → edit mode
    - "Smazat" → DELETE /api/parts/[id] (soft delete, with confirmation)
    - "Zpět" → /partner/parts
- Edit mode:
  - Pre-populated form (same fields as parts/new)
  - Submit → PUT /api/parts/[id]
```

#### `app/(partner)/partner/parts/[id]/loading.tsx` (~15 lines)
#### `app/(partner)/partner/parts/[id]/error.tsx` (~20 lines)

**Files to EDIT:**

#### `app/(partner)/partner/parts/page.tsx` (~3 lines)
Make part cards clickable → link to `/partner/parts/[id]`.

**IMPL NOTE:** Delete uses shared `/api/parts/[id]` DELETE (sets status=INACTIVE). The confirmation can reuse `DeletePartDialog` from PWA Díly — but it's in `components/pwa-parts/parts/`. Two options:
1. Move to `components/ui/DeleteConfirmDialog.tsx` (shared) — cleaner but touches more files
2. Import directly from `components/pwa-parts/parts/DeletePartDialog.tsx` — works but cross-module import

**Recommendation:** Option 2 for minimal diff. The component is self-contained (no pwa-parts-specific deps). Refactoring to shared can be a follow-up.

**Acceptance criteria (C3):**
- [ ] Parts list → tap card → lands on `/partner/parts/[partId]`
- [ ] Detail shows all part fields
- [ ] Edit → "Uložit" → PUT → updated
- [ ] "Smazat" → confirm → DELETE → status=INACTIVE → redirect to list
- [ ] Part disappears from ACTIVE filter, appears in INACTIVE

---

### Commit 4 — Order detail + status actions (Vrakoviste)

**Goal:** Vrakoviste partner can view order details and update order status (confirm, ship, mark delivered).

**Files to CREATE:**

#### `app/(partner)/partner/orders/[id]/page.tsx` (~180 lines)
Order detail page with status actions.

```
Structure:
- Fetch GET /api/orders/[id] on mount
- Header: Order number + status badge
- Buyer info: name, email
- Items list: part name, quantity, unit price, total
- Delivery info: method, address, tracking number
- Payment info: method, status
- Price breakdown: items subtotal, shipping, total
- Created date
- Status actions (based on current status):
  - PENDING → "Potvrdit objednávku" (→ CONFIRMED)
  - CONFIRMED → "Odeslat" (→ SHIPPED, with optional tracking number input)
  - SHIPPED → "Doručeno" (→ DELIVERED)
  - Any non-final → "Zrušit" (→ CANCELLED)
- Each action calls PATCH /api/orders/[id]/status with { status, trackingNumber? }
```

**Reference:** `app/(pwa-parts)/parts/orders/[id]/page.tsx` (265 lines) — existing order detail in PWA Díly. Similar structure but partner version is simpler (no ShippingLabelCard, no Zásilkovna integration).

#### `app/(partner)/partner/orders/[id]/loading.tsx` (~15 lines)
#### `app/(partner)/partner/orders/[id]/error.tsx` (~20 lines)

**Files to EDIT:**

#### `app/(partner)/partner/orders/page.tsx` (~5 lines)
Make order cards clickable → link to `/partner/orders/[id]`.

Current (line 89): `<Card key={order.id} className="p-4">`
Change: Wrap in `<Link href={/partner/orders/${order.id}}>`.

**Acceptance criteria (C4):**
- [ ] Orders list → tap order card → lands on `/partner/orders/[orderId]`
- [ ] Detail shows buyer info, items, delivery, payment, prices
- [ ] PENDING order → "Potvrdit" button → status becomes CONFIRMED
- [ ] CONFIRMED order → "Odeslat" button (with tracking input) → status becomes SHIPPED
- [ ] SHIPPED order → "Doručeno" button → status becomes DELIVERED
- [ ] "Zrušit" on non-final order → CANCELLED
- [ ] Status badge updates after action without page reload

---

### Commit 5 — Photo upload for vehicle/part forms

**Goal:** Partners can add photos when creating or editing vehicles/parts.

**Files to CREATE:**

#### `components/partner/PhotoUpload.tsx` (~80 lines)
Simplified photo upload component (lighter than PWA Díly's PhotoStep wizard step).

```
Structure:
- Props: { photos: string[]; onChange: (photos: string[]) => void; max?: number; }
- Grid of uploaded photos (thumbnails with delete X)
- "Přidat fotky" button → file input (accept image/*)
- Upload via POST /api/upload (FormData)
- Loading spinner per upload
- Max 10 photos (configurable via prop)
- First photo marked as primary (visual indicator)
```

**IMPL NOTE:** This does NOT reuse PhotoStep directly because PhotoStep is a wizard step component with onNext/onBack callbacks. A standalone `PhotoUpload` component is more reusable. Internally, both POST to `/api/upload` the same way.

**Files to EDIT:**

#### `app/(partner)/partner/vehicles/new/page.tsx` (~15 lines)
Add `<PhotoUpload>` above the form. On submit, include photo URLs in the POST body.

**IMPL NOTE:** Current POST `/api/partner/vehicles` does NOT handle images. Vehicle model has `images: VehicleImage[]` relation. Two options:
1. Add image creation to POST handler — add `body.images` array processing
2. Upload images separately after vehicle creation via a dedicated route

**Recommendation:** Option 1 — extend the existing POST handler to accept `images: [{ url, order, isPrimary }]` and create VehicleImage records. Same pattern as `/api/parts` POST.

#### `app/(partner)/partner/vehicles/[id]/page.tsx` (from C2)
Add `<PhotoUpload>` in edit mode. Existing images pre-populated.

#### `app/(partner)/partner/parts/new/page.tsx` (~15 lines)
Add `<PhotoUpload>` above the form. POST body already can include images via shared route pattern.

#### `app/(partner)/partner/parts/[id]/page.tsx` (from C3)
Add `<PhotoUpload>` in edit mode.

#### `app/api/partner/vehicles/route.ts` (~20 lines added to POST)
After vehicle creation, create VehicleImage records if `body.images` provided.

```typescript
// After vehicle = await prisma.vehicle.create(...)
if (body.images?.length) {
  await prisma.vehicleImage.createMany({
    data: body.images.map((img: { url: string }, i: number) => ({
      vehicleId: vehicle.id,
      url: img.url,
      order: i,
      isPrimary: i === 0,
    })),
  });
}
```

**Acceptance criteria (C5):**
- [ ] Vehicle new form: photo upload grid visible
- [ ] Upload photo → appears in grid → submit → vehicle created with images
- [ ] Vehicle edit: existing photos shown, can add/remove
- [ ] Part new form: photo upload grid visible
- [ ] Part edit: existing photos shown
- [ ] Placeholder shown if no photos (both list and detail)
- [ ] Max 10 photos enforced

**Dependency:** Cloudinary env vars (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) must be configured. This is an env issue, not code — document but don't block.

---

### Commit 6 — Partner onboarding flow (3 steps)

**Goal:** New partners go through onboarding before accessing the dashboard. Same pattern as supplier onboarding (#210 C4).

**Design:** 3 steps for both Bazar and Vrakoviste:

| Step | Route | Purpose |
|------|-------|---------|
| 1 | `/partner/onboarding/profile` | Company name, IČO, type (bazar/vrakoviste), address, contact |
| 2 | `/partner/onboarding/documents` | Upload: živnostenský list, OP |
| 3 | `/partner/onboarding/approval` | Waiting for admin approval |

**Files to CREATE:**

#### `app/(partner)/partner/onboarding/page.tsx` (~25 lines)
Router — reads `session.user.onboardingStep`, redirects to correct step.

#### `app/(partner)/partner/onboarding/profile/page.tsx` (~140 lines)
Step 1: Company profile form.
```
Fields:
- companyName (required)
- ico (required, 8 digits)
- partnerType: Bazar / Vrakoviste (read-only if role already assigned)
- phone (required)
- address: street, city, zip
- description (optional)

Submit → PATCH /api/auth/partner-onboarding { step: 1, data: {...} }
→ Set onboardingStep = 2
→ Redirect to /partner/onboarding/documents
```

#### `app/(partner)/partner/onboarding/documents/page.tsx` (~120 lines)
Step 2: Document upload (same as supplier onboarding).

#### `app/(partner)/partner/onboarding/approval/page.tsx` (~80 lines)
Step 3: Waiting message + logout.

#### `app/(partner)/partner/onboarding/loading.tsx` (~10 lines)

#### `app/api/auth/partner-onboarding/route.ts` (~70 lines)
PATCH handler for saving onboarding steps.
```
- Auth check (PARTNER_BAZAR or PARTNER_VRAKOVISTE)
- Step 1: Update User (companyName, ico, phone, address)
- Step 2: Save document URLs
- Update onboardingStep
- Return { success, nextStep }
```

**Files to EDIT:**

#### `middleware.ts` (~12 lines added, before line 321)
Add partner onboarding redirect.

```typescript
// Before existing partner route protection (line 321):
if (pathname.startsWith("/partner") && !pathname.startsWith("/partner/onboarding")) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token && PARTNER_ROLES.includes(token.role as string)
      && token.role !== "ADMIN" && token.role !== "BACKOFFICE") {
    if (token.status === "ONBOARDING" || (token.status === "PENDING" && !token.onboardingCompleted)) {
      return NextResponse.redirect(new URL("/partner/onboarding", request.url));
    }
  }
}
```

**IMPL NOTE:** Same JWT token field verification as #210 STOP-5 — ensure `status` and `onboardingCompleted` are in the JWT callback in `lib/auth.ts`. If already added by #210 C4 implementation, no change needed.

**Acceptance criteria (C6):**
- [ ] New partner (status=PENDING) → any `/partner/*` route → redirected to `/partner/onboarding`
- [ ] Step 1 validates IČO, saves company info, advances
- [ ] Step 2 accepts document uploads, advances
- [ ] Step 3 shows waiting message
- [ ] Existing ACTIVE partners not affected
- [ ] Admin sets status=ACTIVE → partner can access dashboard

---

### Commit 7 — Polish: OfflineBanner, loading states, list item links

**Goal:** Add offline awareness and ensure all new routes have proper loading/error states.

**Files to CREATE:**

#### `components/partner/PartnerTopBar.tsx` (~30 lines)
Simple fixed top bar for mobile (extracted from PartnerLayout edit in C1 for cleanliness). Shows logo + PARTNER badge + optional online/offline indicator.

**Files to EDIT:**

#### `app/(partner)/layout.tsx` (~5 lines)
Add `OnlineStatusProvider` wrapper (same as PWA Díly layout).

```diff
+ import { OnlineStatusProvider } from "@/components/providers/OnlineStatusProvider";
+ import { OfflineBanner } from "@/components/pwa/OfflineBanner";

  return (
    <AuthProvider>
+     <OnlineStatusProvider>
        <PartnerLayout>{children}</PartnerLayout>
+       <OfflineBanner />
+     </OnlineStatusProvider>
    </AuthProvider>
  );
```

**IMPL NOTE:** `OnlineStatusProvider` and `OfflineBanner` already exist from Makler/Díly PWA. Direct import, no code changes to those components.

**Acceptance criteria (C7):**
- [ ] Go offline → OfflineBanner appears ("Jste offline")
- [ ] Go online → banner disappears
- [ ] All new routes have loading.tsx + error.tsx
- [ ] No console errors on any partner route

---

## §4 File manifest

### New files (17)

| File | Commit | Lines (est.) |
|------|--------|-------------|
| `components/partner/PartnerBottomNav.tsx` | C1 | ~110 |
| `app/(partner)/partner/vehicles/[id]/page.tsx` | C2 | ~200 |
| `app/(partner)/partner/vehicles/[id]/loading.tsx` | C2 | ~15 |
| `app/(partner)/partner/vehicles/[id]/error.tsx` | C2 | ~20 |
| `app/(partner)/partner/parts/[id]/page.tsx` | C3 | ~200 |
| `app/(partner)/partner/parts/[id]/loading.tsx` | C3 | ~15 |
| `app/(partner)/partner/parts/[id]/error.tsx` | C3 | ~20 |
| `app/(partner)/partner/orders/[id]/page.tsx` | C4 | ~180 |
| `app/(partner)/partner/orders/[id]/loading.tsx` | C4 | ~15 |
| `app/(partner)/partner/orders/[id]/error.tsx` | C4 | ~20 |
| `components/partner/PhotoUpload.tsx` | C5 | ~80 |
| `app/(partner)/partner/onboarding/page.tsx` | C6 | ~25 |
| `app/(partner)/partner/onboarding/profile/page.tsx` | C6 | ~140 |
| `app/(partner)/partner/onboarding/documents/page.tsx` | C6 | ~120 |
| `app/(partner)/partner/onboarding/approval/page.tsx` | C6 | ~80 |
| `app/api/auth/partner-onboarding/route.ts` | C6 | ~70 |
| `app/(partner)/partner/onboarding/loading.tsx` | C6 | ~10 |

### Edited files (8)

| File | Commit | Change |
|------|--------|--------|
| `components/partner/PartnerLayout.tsx` | C1 | Replace mobile hamburger with TopBar + BottomNav (~30 lines) |
| `app/(partner)/partner/vehicles/page.tsx` | C2 | Wrap cards in Link (~3 lines) |
| `app/(partner)/partner/parts/page.tsx` | C3 | Wrap cards in Link (~3 lines) |
| `app/(partner)/partner/orders/page.tsx` | C4 | Wrap cards in Link (~5 lines) |
| `app/(partner)/partner/vehicles/new/page.tsx` | C5 | Add PhotoUpload component (~15 lines) |
| `app/(partner)/partner/parts/new/page.tsx` | C5 | Add PhotoUpload component (~15 lines) |
| `app/api/partner/vehicles/route.ts` | C5 | Add image creation to POST (~20 lines) |
| `middleware.ts` | C6 | Add partner onboarding redirect (~12 lines) |
| `app/(partner)/layout.tsx` | C7 | Add OnlineStatusProvider + OfflineBanner (~5 lines) |

### Files NOT to edit

| File | Reason |
|------|--------|
| `/api/vehicles/[id]/route.ts` | Shared PATCH already has ownership check |
| `/api/parts/[id]/route.ts` | Shared PUT/DELETE already has ownership check |
| `/api/orders/[id]/route.ts` | Shared GET already has supplier access |
| `/api/orders/[id]/status/route.ts` | Shared PATCH already has supplier access |
| `prisma/schema.prisma` | No model changes needed |

---

## §5 API routes needed

**New (1):**
- `PATCH /api/auth/partner-onboarding` — Save onboarding step data

**Existing — edit (1):**
- `POST /api/partner/vehicles` — Add `images` array handling to create VehicleImage records

**Existing — used by new pages, no changes (5):**
- `GET /api/vehicles/[id]` — Vehicle detail data source
- `PATCH /api/vehicles/[id]` — Vehicle edit submission
- `PATCH /api/vehicles/[id]/status` — Vehicle archive/status change
- `GET/PUT/DELETE /api/parts/[id]` — Part detail/edit/delete
- `GET /api/orders/[id]` + `PATCH /api/orders/[id]/status` — Order detail + actions

---

## §6 DB schema changes

**NONE.** All needed fields exist:
- `User.onboardingStep`, `User.onboardingCompleted`, `User.status` — onboarding tracking
- `User.companyName`, `User.ico` — company info
- `Vehicle.brokerId` — ownership for PATCH auth
- `Part.supplierId` — ownership for PUT/DELETE auth
- `VehicleImage` model — vehicle photo storage
- `PartImage` model — part photo storage
- `Order.items[].supplierId` — supplier access check for orders

---

## §7 Delivery pipeline

```
C1  PartnerBottomNav + layout dual mode
 │   └─ git commit -m "feat(partner): add mobile BottomNav + refactor layout (#211)"
 ↓
C2  Vehicle detail/edit page
 │   └─ git commit -m "feat(partner): add vehicle detail/edit page (#211)"
 ↓
C3  Part detail/edit + delete
 │   └─ git commit -m "feat(partner): add part detail/edit/delete page (#211)"
 ↓
C4  Order detail + status actions
 │   └─ git commit -m "feat(partner): add order detail with status actions (#211)"
 ↓
C5  Photo upload for vehicles + parts
 │   └─ git commit -m "feat(partner): add photo upload to vehicle/part forms (#211)"
 ↓
C6  Partner onboarding (3 steps + middleware)
 │   └─ git commit -m "feat(partner): add onboarding flow + middleware redirect (#211)"
 ↓
C7  OfflineBanner + polish
     └─ git commit -m "feat(partner): add offline awareness + polish (#211)"
```

**Ordering rationale:**
- C1 first: Layout is the foundation — all subsequent pages render inside it
- C2-C4: CRUD pages (core functionality), independent of each other but C1-first
- C5 after C2-C3: Photo upload enhances create/edit forms that must exist first
- C6 after C4: Onboarding is for new users; existing CRUD more immediately valuable
- C7 last: Polish pass

**Each commit is independently deployable.**

---

## §8 STOP rules for implementator

### STOP-1: Do NOT create partner-specific vehicle/part CRUD API routes
Shared `/api/vehicles/[id]` (PATCH) and `/api/parts/[id]` (PUT/DELETE) already have ownership checks that work for partners. Do NOT duplicate these endpoints under `/api/partner/`. The partner pages should call the shared routes directly.

### STOP-2: Do NOT restructure PartnerLayout into separate files
Keep sidebar + mobile nav in the same `PartnerLayout.tsx` component. Extract `PartnerBottomNav` as a new component, but do NOT split sidebar into `PartnerSidebar.tsx` — unnecessary file churn.

### STOP-3: Do NOT add more than 5 items to BottomNav
Mobile bottom nav has space for 5 items max (4 regular + 1 central FAB). Stats, Messages, Documents, Billing are secondary navigation — accessible from dashboard or desktop sidebar. If lead disagrees, escalate.

### STOP-4: Do NOT modify shared API routes
`/api/vehicles/[id]`, `/api/parts/[id]`, `/api/orders/[id]`, `/api/orders/[id]/status` — these are shared by multiple consumers (admin, makler, pwa-parts, partner). Do NOT add partner-specific logic to them. If partner needs different behavior, create a partner-specific wrapper route.

### STOP-5: Vehicle edit uses PATCH, Part edit uses PUT
Different HTTP methods! Vehicle route exports `PATCH` (with change logs + reason field). Part route exports `PUT` (full replace). Partner edit pages must use the correct method for each.

### STOP-6: Vehicle status transitions have rules
`/api/vehicles/[id]/status` enforces allowed transitions (e.g., ACTIVE → ARCHIVED allowed, PENDING → SOLD NOT allowed). Partner "archive" button should only be shown when vehicle status allows ARCHIVED transition. Check `ALLOWED_TRANSITIONS` in the status route before rendering action buttons.

### STOP-7: Verify JWT token fields before middleware edit
Same as #210 STOP-5. Ensure `status` and `onboardingCompleted` are in JWT callback.

### STOP-8: Do NOT install new npm packages
Everything needed is already installed.

### STOP-9: Escalation threshold
If any single commit takes more than 6 hours or touches more than 10 files, STOP and escalate.

---

## §9 Acceptance criteria (summary)

### Per-commit

| Commit | Key check |
|--------|-----------|
| C1 | Mobile bottom nav renders, desktop sidebar unchanged |
| C2 | Vehicle list → detail → edit → save → updated |
| C3 | Parts list → detail → edit/delete → works |
| C4 | Orders list → detail → confirm/ship/deliver status actions |
| C5 | Photo upload works in create + edit forms for both vehicles and parts |
| C6 | New partner → onboarding 3 steps → awaits approval |
| C7 | OfflineBanner, all routes have loading/error states |

### End-to-end smoke test — Bazar

1. Login as partner bazar user
2. Mobile: bottom nav shows Dashboard, Vozidla, Přidat, Zájemci, Profil
3. Tap "Přidat" → vehicle form → add photos → submit → vehicle created
4. Tap "Vozidla" → see new vehicle in list
5. Tap vehicle → detail page → tap "Upravit" → edit → save → updated
6. Tap "Stáhnout z nabídky" → vehicle archived
7. Desktop: sidebar visible with all 7 nav items

### End-to-end smoke test — Vrakoviste

1. Login as partner vrakoviste user
2. Mobile: bottom nav shows Dashboard, Díly, Přidat, Objednávky, Profil
3. Add part with photos → appears in list
4. Tap part → detail → edit → save → updated
5. Delete part → soft deleted → appears as INACTIVE
6. Tap "Objednávky" → see orders → tap order → detail page
7. PENDING order → "Potvrdit" → CONFIRMED
8. CONFIRMED → "Odeslat" (enter tracking) → SHIPPED
9. SHIPPED → "Doručeno" → DELIVERED

### Onboarding smoke test

1. Create test user with `role=PARTNER_BAZAR, status=ONBOARDING`
2. Login → redirected to `/partner/onboarding/profile`
3. Fill company info → next → documents → next → approval screen
4. Admin sets status=ACTIVE → refresh → dashboard accessible

---

## §10 Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cloudinary env vars missing → photo upload fails | Medium | Document as env dependency; forms work without photos |
| BottomNav 5-item limit vs 7+ pages | Medium | Secondary pages via dashboard links + desktop sidebar; escalate if lead wants more |
| Vehicle PATCH requires `reason` for sensitive field changes | Low | Partner edit form should include optional reason field for price/mileage/VIN changes |
| `getToken()` called multiple times in middleware | Low perf | Cookie-based, no DB hit; acceptable |
| Cross-module import of DeletePartDialog | Low | Import from pwa-parts works; refactor to shared later |
| Vehicle POST doesn't handle images yet | Medium | C5 extends POST handler — not breaking, additive only |

---

## §11 Open questions for team-lead

**Q1:** BottomNav items — should Stats/Messages/Documents/Billing be accessible from bottom nav or only via dashboard/sidebar?
- **Planovac recommendation:** Dashboard + sidebar only. 5-slot BottomNav is a proven pattern (Makler, Díly). More items = unusable on small screens.
- **Needs decision from lead.**

**Q2:** Should C1-C4 (mobile layout + CRUD) and C5-C7 (photos + onboarding + polish) be split into separate dispatches?
- **Planovac recommendation:** Yes. C1-C4 is core functionality (~20h). C5-C7 is enhancement (~12h). Smaller batches are safer.
- **Needs decision from lead.**

**Q3:** Vehicle "delete" — should partners be able to permanently archive vehicles, or just change status?
- **Planovac recommendation:** Status change only (ACTIVE → ARCHIVED). No hard delete for vehicles — they have VIN, price history, and audit trail. Use existing `/api/vehicles/[id]/status` route.
- **Needs decision from lead.**

**Q4:** Should PhotoUpload be a new component or reuse `PhotoStep` from PWA Díly?
- **Planovac recommendation:** New lightweight `PhotoUpload` component. PhotoStep is a wizard step with onNext/onBack lifecycle that doesn't fit partner's inline form pattern. Both POST to `/api/upload` internally.
- **Needs decision from lead.**

**Q5:** Onboarding — same API as supplier (`/api/auth/supplier-onboarding`) or separate (`/api/auth/partner-onboarding`)?
- **Planovac recommendation:** Separate route. Partners have different data requirements (partner type bazar/vrakoviste, potentially different document requirements). Shared logic can be extracted later.
- **Needs decision from lead.**

---

## §12 Post-plan validation checklist

After IMPL completes all commits:

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Mobile BottomNav renders for both roles
- [ ] Desktop sidebar unchanged
- [ ] Vehicle CRUD cycle works (create → view → edit → archive)
- [ ] Part CRUD cycle works (create → view → edit → delete)
- [ ] Order detail + status actions work
- [ ] Photo upload works (if Cloudinary configured)
- [ ] Onboarding flow works for new partners
- [ ] Existing ACTIVE partners not affected by onboarding
- [ ] OfflineBanner appears when offline
- [ ] All new routes have loading.tsx + error.tsx
- [ ] No new npm dependencies
- [ ] No Prisma schema changes
- [ ] Total diff < 1500 lines (target: ~1200 across 17 new + 8 edited files)
