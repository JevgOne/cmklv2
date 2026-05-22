# QA Rerun Report: TASK-055 to TASK-060 (7 commits)

**Date:** 2026-04-16
**Auditor:** Kontrolor (read-only QA agent)
**Commit range:** `40c63a1..7c1d7a9` (7 commits, Apr 16-17)

---

## Per-Commit Review

### 1. `40c63a1` — fix(profile): DAY_LABELS use full weekday names
- **What:** Replaced abbreviations ("Po","Ut"...) with full Czech names ("Pondeli","Utery"...)
- **Simplify:** Clean, minimal change. No dead code.
- **Debug:** No issues.
- **Reverse:** Matches Rule 1 (no abbreviations). Correct.
- **Verdict:** OK

### 2. `5c7337a` — feat(profile): default automotive cover photo
- **What:** Added 4 Unsplash cover JPGs, `lib/profile/defaultCovers.ts` with deterministic `getDefaultCover(userId)`, dark overlay for readability, onError fallback.
- **Simplify:** Clean. Deterministic hash is simple char-code sum. ATTRIBUTION.md included.
- **Debug:** 4 valid JPGs (1920x720 progressive JPEG). No broken imports.
- **Reverse:** Matches TASK-055 spec.
- **Verdict:** OK

### 3. `6ae64e6` — feat(profile): languages as pills, sold cars metric, expanded specializations catalog
- **What:** New `lib/broker-specializations.ts` (8 vehicle types + 16 services), languages rendered as orange pills, "Prodano" metric from DB SOLD status, PWA ProfileForm aligned to CZ labels.
- **Simplify:** `categorizeSpecialization` is backward-compat case-insensitive. SERVICE_GROUPS for editor subheadings.
- **Debug:** No broken imports. All labels are full CZ words, no abbreviations.
- **Reverse:** Matches TASK-057/058/059 specs.
- **Verdict:** OK

### 4. `d8ed0f0` — feat(profile): unified vehicle cards matching /nabidka
- **What:** Profile vehicles tab now uses shared `VehicleCard` component. Extracted `lib/vehicle-labels.ts` (single source of truth). Added `CommentSection` + `LikeButton` below cards.
- **Simplify:** Good dedup of fuelLabels/transmissionLabels into shared module.
- **Debug:** No issues.
- **Reverse:** Matches TASK-056. Note: CommentSection was added here then removed in `7c1d7a9`.
- **Verdict:** OK

### 5. `3be0a4d` — chore(profile): simplify part-only render + dedupe vehicle labels
- **What:** Removed unreachable vehicle/listing branches after early return. `lib/listings.ts` now re-exports from `lib/vehicle-labels.ts`.
- **Simplify:** Proper cleanup, -48 lines net. Single source of truth maintained.
- **Debug:** No issues.
- **Reverse:** Follow-up cleanup, matches intent.
- **Verdict:** OK

### 6. `ca58caf` — feat(profile): onboarding wizard, real cover/avatar upload, completeness bar
- **What:** 5-step wizard at `/muj-ucet/profil/setup`, `ImageUpload` component, Cloudinary upload presets (avatar + cover), `lib/profile-completeness.ts` with 11-field weighted calculator (sum=100).
- **Simplify:** Wizard is 741 lines -- large but justified (5 steps, preview, incremental save). Completeness calculator is clean with typed interface.
- **Debug:** No TS errors. Upload route has avatar + cover presets.
- **Reverse:** Matches TASK-060 spec completely.
- **Verdict:** OK

### 7. `7c1d7a9` — fix(profile): remove CommentSection from vehicle cards on profile
- **What:** Removed CommentSection import and usage from ProfileClient.tsx. LikeButton retained.
- **Simplify:** Clean removal, -13 lines.
- **Debug:** Confirmed zero `CommentSection` references in entire `app/` directory.
- **Reverse:** Comments managed by ADMIN only -- correct business logic.
- **Verdict:** OK

---

## Systemic Checks

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 5 | **Build** (`npm run build`) | PASS | Clean build, all routes compiled |
| 6 | **Lint** (`npm run lint`) | PASS | 0 errors, 627 warnings (all pre-existing, none from these commits) |
| 7 | **Integrita** — broken imports | PASS | No `CommentSection` imports anywhere in `app/`. All `vehicle-labels` imports resolve. |
| 8 | **Konzistence** — specialization catalog | PASS | Full CZ names in `lib/broker-specializations.ts`: "Osobni", "SUV", "Dodavky", etc. No abbreviations. |
| 9 | **Seed data** | WARNING | `prisma/seed.ts` line 223 uses `["osobni", "SUV"]` (lowercase "o" in "osobni"). Catalog uses `"Osobni"`. `categorizeSpecialization` handles it (case-insensitive), but display will show lowercase "osobni" on seeded broker profile. |
| 10 | **Cover fotky** | PASS | 4 valid JPEG files (1920x720, progressive, 95-173 KB each) |
| 11 | **Wizard** | PASS | `/muj-ucet/profil/setup/page.tsx` exists, 5 steps: Fotky, Specializace, Jazyky, Kontakty, Prehled |
| 12 | **Upload presets** | PASS | `avatar` + `cover` presets in `/api/upload/route.ts` (lines 19-20) |
| 13 | **CommentSection removed** | PASS | Zero references in ProfileClient.tsx or anywhere in `app/**/*.tsx` |

---

## Summary

**Score: 12/13 checks PASS, 1 WARNING**

### Blockers: NONE

### Non-blocking (WARNING):
- **Seed casing drift** (`prisma/seed.ts:223`): `"osobni"` should be `"Osobni"` to match catalog capitalization. The `categorizeSpecialization` function handles this at runtime (case-insensitive), so it categorizes correctly. But the raw value from DB is displayed as-is on the profile, meaning seeded brokers will show lowercase "osobni" instead of "Osobni". Fix: update seed to `JSON.stringify(["Osobni", "SUV"])`.

### Positive observations:
- Clean dedup of vehicle labels into single source of truth
- PWA ProfileForm properly aligned to shared catalog (no more English lowercase values)
- Backward-compat categorization handles any casing from old DB entries
- Wizard has proper incremental save, completeness weights sum to 100
- Cover photos have deterministic assignment + error fallback
