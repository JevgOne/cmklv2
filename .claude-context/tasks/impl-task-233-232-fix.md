# IMPL Report — Task #233 fix upload_preset

## Commit
`17d87b5` — fix: add upload_preset to PhotoUpload and onboarding document upload

## Fixes
- **BLOCKER-1:** `PhotoUpload.tsx` — added required `preset: string` prop, sends `formData.append("upload_preset", preset)`. Vehicle pages pass `"vehicles"`, part pages pass `"parts"`.
- **BLOCKER-2:** `partner/onboarding/documents/page.tsx` — added `formData.append("upload_preset", "invoices")` to document upload handler.

## Files changed (6)
- `components/partner/PhotoUpload.tsx` — added `preset` prop + FormData append
- `app/(partner)/partner/vehicles/new/page.tsx` — `preset="vehicles"`
- `app/(partner)/partner/vehicles/[id]/page.tsx` — `preset="vehicles"`
- `app/(partner)/partner/parts/new/page.tsx` — `preset="parts"`
- `app/(partner)/partner/parts/[id]/page.tsx` — `preset="parts"`
- `app/(partner)/partner/onboarding/documents/page.tsx` — `upload_preset: "invoices"`

## Ověření
- `npx tsc --noEmit` — ✅ 0 errors
