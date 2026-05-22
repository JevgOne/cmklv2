# IMPL Report — Task #231 PWA Partner C5-C7

## Commity
| Commit | Popis |
|--------|-------|
| `316d957` | **C5:** PhotoUpload component + integrace do vehicle/part new+edit + vehicle API images |
| `4057b4b` | **C6:** Partner onboarding (3 kroky: profil→dokumenty→schválení) + API PATCH route + middleware redirect |
| `9c7b38b` | **C7:** OfflineBanner + OnlineStatusProvider v partner layout |

## C5 — Photo Upload

### Nové soubory
- `components/partner/PhotoUpload.tsx` — Reusable grid photo upload s delete, "Hlavní" badge, max enforcement

### Editované soubory
- `app/(partner)/partner/vehicles/new/page.tsx` — přidán PhotoUpload, photos state, images v POST body
- `app/(partner)/partner/parts/new/page.tsx` — přidán PhotoUpload, photos state, images v POST body
- `app/(partner)/partner/vehicles/[id]/page.tsx` — PhotoUpload v edit mode, images v PATCH body
- `app/(partner)/partner/parts/[id]/page.tsx` — PhotoUpload v edit mode, images v PUT body
- `app/api/partner/vehicles/route.ts` — `VehicleImage.createMany()` po vehicle creation

## C6 — Partner Onboarding

### Nové soubory
- `app/(partner)/partner/onboarding/page.tsx` — Server component router (session → step → redirect)
- `app/(partner)/partner/onboarding/loading.tsx` — Orange spinner
- `app/(partner)/partner/onboarding/profile/page.tsx` — Step 1: firma profil (IČO, telefon, adresa)
- `app/(partner)/partner/onboarding/documents/page.tsx` — Step 2: upload dokumentů (ŽL + OP)
- `app/(partner)/partner/onboarding/approval/page.tsx` — Step 3: čekání na schválení
- `app/api/auth/partner-onboarding/route.ts` — PATCH handler (step 1→onboardingStep=2, step 2→status=PENDING)

### Editované soubory
- `middleware.ts` — Partner ONBOARDING redirect přidán do `/partner` bloku

## C7 — Offline Awareness

### Editované soubory
- `app/(partner)/layout.tsx` — přidán `"use client"`, OnlineStatusProvider, OfflineBanner (reuse z pwa)

## Ověření
- `npx tsc --noEmit` — ✅ 0 errors
- `npm run lint` — ✅ 0 errors (555 warnings z sw.js)
- `npm run build` — ✅ success

## STOP compliance
- STOP-5: Vehicle edit = PATCH, Part edit = PUT ✅
- STOP-6: Archive button jen pro ACTIVE/RESERVED ✅
- STOP-7: Onboarding API pattern shodný se supplier-onboarding ✅
- STOP-8: Middleware redirect PŘED role check (uvnitř partner bloku, po auth+role) ✅
