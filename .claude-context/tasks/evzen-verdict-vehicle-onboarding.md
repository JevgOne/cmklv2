# Evžen THE KING — Verdikt: Task #54 (Vehicle Onboarding Fix)

**Task:** #55 (kontrola)
**Datum:** 2026-05-22
**Verdikt:** ✅ SCHVÁLENO (s poznámkami)

---

## Zadání uživatele

> "potřebujeme projít podrobny kroky naboru auta ted už budeme používat nabor takže to musí fungovat"

**Interpretace:** 5 bugů identifikovaných v nabíracím flow musí být opraveno — DRAFT→PENDING transition, offline sync partial failure, duplicate submission, status indikace, inspection photos upload.

---

## BUG 1: DRAFT→PENDING transition ✅

**Požadavek:** Po "Odeslat ke schválení" se vehicle přepne na PENDING.

| Kontrola | Status | Důkaz |
|----------|--------|-------|
| Online: PATCH `/api/vehicles/${id}/status` s `{ status: "PENDING" }` | ✅ | `ReviewStep.tsx:258-267` — po vehicle creation + photo upload |
| Offline sync: PATCH PENDING | ✅ | `OnlineSync.tsx:106-111` — STEP 3 po photo upload |
| Non-blocking fallback (console.error, ne throw) | ✅ | `ReviewStep.tsx:265-267` |
| POST /api/vehicles stále vytváří DRAFT | ✅ | API nedotčeno (STOP-1 dodržen) |

**Odpovídá zadání?** ANO — vehicle se přepne na PENDING v obou flows (online + offline sync).

---

## BUG 2: Offline sync — atomic operation + retry ✅

**Požadavek:** Photo upload failure nesmí ztratit pending action. Retry s max pokusy.

| Kontrola | Status | Důkaz |
|----------|--------|-------|
| Pending action se odstraní POUZE pokud vše prošlo | ✅ | `OnlineSync.tsx:113-127` — `if (photosOk)` guard |
| Photo failure → vehicleId uložen pro retry | ✅ | `OnlineSync.tsx:93-96` — `_vehicleId: vehicleId` |
| Skip vehicle creation při retry (vehicleId existuje) | ✅ | `OnlineSync.tsx:44-45` — `if (!vehicleId)` check |
| Retry counter `_retries` | ✅ | `OnlineSync.tsx:36,66-70` — increment + max check |
| Max 3 retry → remove action | ✅ | `OnlineSync.tsx:98-100` |
| 409 VIN duplicate → graceful cleanup | ✅ | `OnlineSync.tsx:53-57` |
| `updatePendingAction()` helper | ✅ | `lib/offline/storage.ts:98-103` — nová metoda |

**Odpovídá zadání?** ANO — atomic sync s retry, žádná ztráta fotek při partial failure.

---

## BUG 3: Duplicate submission prevention ✅

**Požadavek:** Draft nelze odeslat dvakrát.

| Kontrola | Status | Důkaz |
|----------|--------|-------|
| Guard `draft.status === "submitted" \|\| "pending_sync"` | ✅ | `ReviewStep.tsx:146-149` |
| `updateStatus("pending_sync")` PŘED POST | ✅ | `ReviewStep.tsx:156-157` |
| Persist to IndexedDB (`saveDraft()`) | ✅ | `ReviewStep.tsx:157` |
| Rollback na "draft" při failure | ✅ | `ReviewStep.tsx:329-330` |
| UI guard — Alert pro "submitted" + "pending_sync" | ✅ | `ReviewStep.tsx:497-511` |
| Double-click guard (`submitting` state) | ✅ | `ReviewStep.tsx:151` |

**Odpovídá zadání?** ANO — 3-vrstvý guard (draft status + persistent IndexedDB + submitting state).

---

## BUG 4: Status indikace v UI ✅

**Požadavek:** PENDING badge v seznamu vozidel, success page CTA.

| Kontrola | Status | Důkaz |
|----------|--------|-------|
| PENDING badge v VehicleCard | ✅ | `VehicleCard.tsx:27` — `{ variant: "pending", label: "Ke schválení" }` |
| REJECTED badge v VehicleCard | ✅ | `VehicleCard.tsx:28` — `{ variant: "rejected", label: "Zamítnuto" }` |
| StatusPill styling — pending = warning | ✅ | `StatusPill.tsx:11` — `bg-warning-50 text-warning-500` |
| StatusPill styling — rejected = error | ✅ | `StatusPill.tsx:12` — `bg-error-50 text-error-500` |
| Success page: "Moje vozy" CTA → `/makler/vehicles` | ✅ | `SuccessView.tsx:94` — změněno z "Zpet na Dashboard" |
| Success page: "Dashboard" jako ghost button | ✅ | `SuccessView.tsx:106-110` — přidáno |
| VehicleDetailHub PENDING/REJECTED info | ✅ | `VehicleStatusActions.tsx:169-183` — Alert + akce |

**Poznámka P1 (NEBLOKUJÍCÍ):** Plán říká PENDING badge label "Čeká na schválení", implementace má "Ke schválení". VehicleDetailHub také "Ke schválení". Konzistentní v rámci UI, jen jiný text než plán. Plán říká REJECTED "Vráceno", implementace má "Zamítnuto". Opět konzistentní v UI. Funkčně ekvivalentní.

**Odpovídá zadání?** ANO — broker vidí jasný status v seznamu i detailu vozidel.

---

## BUG 5: Inspection photos upload ✅

**Požadavek:** Defect + wheel fotky se nahrají na Cloudinary, inspectionData má URL místo lokálních ID.

| Kontrola | Status | Důkaz |
|----------|--------|-------|
| Defect imageId sběr | ✅ | `ReviewStep.tsx:233-236` |
| Wheel photo sběr (LP, PP, LZ, PZ) | ✅ | `ReviewStep.tsx:238-242` |
| `uploadImagesByIds()` helper | ✅ | `upload-photos.ts:81-126` — nová funkce |
| `replaceLocalIdsWithUrls()` helper | ✅ | `upload-photos.ts:131-160` — nová funkce |
| PATCH inspectionData s Cloudinary URLs | ✅ | `ReviewStep.tsx:250-254` |
| Dynamic import (code splitting) | ✅ | `ReviewStep.tsx:246` — `await import()` |
| Progress status "Nahrávám inspekční fotky..." | ✅ | `ReviewStep.tsx:245` |

**Odpovídá zadání?** ANO — inspection fotky se nahrají na server, inspectionData JSON obsahuje Cloudinary URLs.

---

## STOP pravidla

| STOP | Pravidlo | Status | Důkaz |
|------|----------|--------|-------|
| STOP-1 | POST /api/vehicles nedotčen | ✅ | `git show 8cb0b9d --stat` — žádné api/ soubory |
| STOP-2 | PATCH /api/vehicles/[id]/status nedotčen | ✅ | Žádné api/ soubory v commitu |
| STOP-3 | Prisma schema nedotčen | ✅ | Žádné prisma/ soubory v commitu |
| STOP-4 | PhotosStep/InspectionStep nedotčeny | ✅ | Nejsou v commitu |
| STOP-5 | Pending action se neodstraňuje při photo failure | ✅ | `OnlineSync.tsx:114` — `if (photosOk)` guard |
| STOP-6 | VIN uniqueness constraint nedotčen | ✅ | Schema nedotčeno |
| STOP-7 | Service worker sync nedotčen | ✅ | Žádné sw soubory v commitu |
| STOP-8 | Admin approval flow nedotčen | ✅ | Žádné admin/ soubory v commitu |

**Všech 8 STOP pravidel dodrženo.** ✅

---

## Editované soubory

| # | Plán | Commit | Shoda |
|---|------|--------|-------|
| 1 | `components/pwa/vehicles/new/ReviewStep.tsx` | ✅ | ✅ |
| 2 | `components/pwa/OnlineSync.tsx` | ✅ | ✅ |
| 3 | `lib/offline/upload-photos.ts` | ✅ | ✅ |
| 4 | `app/(pwa)/makler/vehicles/new/success/page.tsx` | SuccessView.tsx (komponenta renderovaná z page.tsx) | ✅ ekvivalent |
| 5 | "Vehicle status badge component" | `lib/offline/storage.ts` (updatePendingAction helper) | ⚠️ |

**Poznámka P2 (NEBLOKUJÍCÍ):** Plán říká 5. soubor = "Vehicle status badge component". Commit má místo toho `lib/offline/storage.ts` (helper pro retry). Status badge styling už existoval před commitem (`VehicleCard.tsx:25-33` + `StatusPill.tsx`), takže nepotřeboval editaci. `storage.ts` potřeboval `updatePendingAction()` pro retry support v OnlineSync. Správné rozhodnutí implementátora.

---

## Žádné zkratky v UI ✅
- "Odeslat ke schválení" — plný název
- "Ke schválení" — plný badge text  
- "Zamítnuto" — plný badge text
- "Moje vozy" — plný CTA text
- "Nahrávám inspekční fotky..." — plný status text
- "Toto vozidlo bylo odesláno ke schválení." — plná věta

---

## Závěr

Task #54 odpovídá zadání "potřebujeme projít podrobny kroky naboru auta ted už budeme používat nabor takže to musí fungovat":

- **BUG 1:** DRAFT→PENDING transition funguje (online + offline) ✅
- **BUG 2:** Offline sync atomic s retry, žádná ztráta fotek ✅
- **BUG 3:** Duplicate submission prevention (3 vrstvy guardu) ✅
- **BUG 4:** Status badges + success page CTA ✅
- **BUG 5:** Inspection photos upload na Cloudinary ✅
- **8/8 STOP pravidel dodrženo** ✅
- **Build:** 0 errors (1310 pages) ✅

Nabírací flow je připraven na reálné používání.
