# IMPL #214 — PWA Dily C1-C3 (detail + edit + delete)

**Task:** #214 IMPL — PWA Dily C1-C3
**Plan:** `.claude-context/tasks/plan-task-210-pwa-dily-100.md` (`5043ef1`)
**Datum:** 2026-04-11
**Branch:** main
**Commits delivered (2, atomic):**

| # | Hash | Subject |
|---|---|---|
| C1 | `31d894c` | feat(parts): add part detail page + fix PartCard link (#210) |
| C2 | `2fa39f3` | feat(parts): add part edit page with wizard reuse (#210) |

---

## §1 — Scope delivered

| Gap | Polozka | Status |
|---|---|---|
| Part detail view | `/parts/[id]` page with image carousel, all fields, action buttons | ✅ |
| PartCard link fix | `href="/parts/my"` → `href="/parts/${id}"` | ✅ |
| Part edit page | `/parts/[id]/edit` reusing PhotoStep/DetailsStep/PricingStep, PUT API | ✅ |
| Part delete dialog | `DeletePartDialog` component, wired in detail page | ✅ |

**Notes on commit structure:**
- Plan specified 3 commits (C1=detail+link, C2=edit, C3=delete dialog). DeletePartDialog was included in C1 because the detail page imports it directly — separating would leave C1 in a broken state (missing import). This is a minor structural deviation but delivers identical functionality.

---

## §2 — Files changed (4 files, +603/-1)

### C1 — Detail page + PartCard fix + DeletePartDialog

**New:** `app/(pwa-parts)/parts/[id]/page.tsx` (279 lines)
- Client component with `useParams` for route param
- Fetches `GET /api/parts/[id]` on mount
- Image carousel with dot navigation (multi-image support)
- Status/category/condition badges
- Name + price (with VAT indicator)
- Description, manufacturer + warranty block (conditional)
- OEM number, stock, view count grid
- Compatibility list (reconstructed from JSON strings)
- Action buttons: Zpet, Upravit (→ `/parts/[id]/edit`), Smazat (opens dialog)
- Loading skeleton + empty state

**New:** `components/pwa-parts/parts/DeletePartDialog.tsx` (84 lines)
- Modal overlay with confirmation
- `DELETE /api/parts/[partId]` on confirm → `onDeleted` callback
- Loading state, error handling
- Warning icon + descriptive text

**Edited:** `components/pwa-parts/parts/PartCard.tsx` (1 line)
- `href="/parts/my"` → `href="/parts/${id}"`

### C2 — Edit page

**New:** `app/(pwa-parts)/parts/[id]/edit/page.tsx` (239 lines)
- Client component reusing AddPartWizard, PhotoStep, DetailsStep, PricingStep
- Fetches `GET /api/parts/[id]` → populates all state:
  - Photos from `images[]` sorted by order
  - Details from flat fields + compatibility reconstructed from JSON arrays
  - Pricing from price/vatIncluded/stock/warranty
- On save: `PUT /api/parts/[id]` with same body format as create
- Redirect to `/parts/[id]` on success
- Cancel link → `/parts/[id]`
- Loading skeleton + error state

**Compatibility reconstruction (per plan §8 STOP-6):**
- `compatibleBrands: '["Skoda","VW"]'` → parsed → per-entry with shared yearFrom/yearTo
- Lossy (year range shared across all entries) — acceptable for MVP

---

## §3 — STOP rules check

| # | Rule | Status |
|---|---|---|
| STOP-1 | NE edit API routes | ✅ 0 API files touched |
| STOP-2 | NE modify Prisma schema | ✅ 0 schema changes |
| STOP-3 | NE install npm packages | ✅ 0 new deps |
| STOP-4 | NE refactor wizard steps | ✅ 0 changes to PhotoStep/DetailsStep/PricingStep |
| STOP-5 | Verify JWT fields before middleware edit | ✅ N/A (C4 onboarding not in scope) |
| STOP-6 | Compatibility data reconstruction | ✅ Lossy year range, documented |
| STOP-7 | Cloudinary env = env issue | ✅ No fallback added |
| STOP-8 | >6h or >8 files | ✅ 4 files, well within bounds |

---

## §4 — Acceptance checks

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ EXIT=0 |
| `npm run lint` | ✅ 0 errors (554 warnings, 1 less than baseline 555) |
| `npm run build` | ✅ EXIT=0, `Compiled successfully in 24.7s` |
| PartCard link fixed | ✅ `href="/parts/${id}"` |
| Detail page created | ✅ `/parts/[id]/page.tsx` (279 LOC) |
| Edit page created | ✅ `/parts/[id]/edit/page.tsx` (239 LOC) |
| DeletePartDialog created | ✅ `DeletePartDialog.tsx` (84 LOC) |
| No API route edits | ✅ |
| No schema changes | ✅ |
| No new npm deps | ✅ |
| Total diff < 1000 lines | ✅ 603 lines |

---

## §5 — Pipeline next

- Kontrolor — verify C1-C3 vs plan acceptance criteria
- Evzen — smart code review
- Test-chrome — headed flow: list → detail → edit → save → delete
- Deploy — production rollout (no migration, schema-only from #184 already applied)

**Do NOT push** — commits locally on `main`.

---

**HOTOVO** — Task #214 ready for review.
Commits `31d894c` (C1), `2fa39f3` (C2) na `main`.
