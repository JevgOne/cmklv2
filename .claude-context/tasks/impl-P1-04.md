# Implementace P1-04: Cloudinary upload pro vozidla, inzeraty a dily

**Status:** HOTOVO
**Datum:** 2026-04-04
**Zavislost:** P1-12 (lib/cloudinary.ts — HOTOVO v Batch 1)

---

## Co bylo udelano

### 1. Vytvoreno: `app/api/upload/route.ts` (NOVY)

Univerzalni upload endpoint s preset systemem:
- Auth: vyzaduje prihlaseneho uzivatele
- 6 presetu: `vehicles`, `listings`, `parts`, `invoices`, `contracts`, `damages`
- Kazdy preset ma svuj Cloudinary folder a povolene typy souboru
- Volitelny `subfolder` parametr (napr. vehicleId, userId)
- Max 10 MB per soubor
- Pouziva sdileny `uploadToCloudinary()` z `lib/cloudinary.ts`

### 2. Opraven: `app/api/listings/[id]/images/route.ts`

- Pridan import `uploadToCloudinary` z `@/lib/cloudinary`
- Nahrazeny placeholder URL (`/uploads/listings/{id}/photo-{i}.jpg`) za realny Cloudinary upload
- Selhany upload preskoci s `continue` (nezastavi cely batch)
- Server-side upload — primo import, ne pres /api/upload

### 3. Opraven: `components/pwa/vehicles/quick/QuickStep3.tsx`

- Fotky z IndexedDB se nyni uploaduji na Cloudinary pres `/api/upload` endpoint
- Pokud ma foto `file` nebo `blob`, uploaduje se s presetem `vehicles`
- Fallback: pouzije `thumbnailUrl` z IndexedDB (pro offline scenar)
- Klientska komponenta (`"use client"`) — pouziva fetch na `/api/upload`

### 4. Opraven: `components/pwa/vehicles/DamageReportForm.tsx`

- Nahrazeno base64 cteni (FileReader + readAsDataURL) za Cloudinary upload
- Kazda fotka se uploaduje pres `/api/upload` s presetem `damages` a subfolder `vehicleId`
- API prijima Cloudinary URL misto base64 stringu

### 5. Opraven: `components/pwa/BrokerPayoutsContent.tsx`

- Pridan `subfolder: payoutId` do FormData pro upload faktury
- Endpoint `/api/upload` uz existoval v kodu (puvodni placeholder), nyni realne funguje

### 6. Opraven: `app/api/contracts/[id]/pdf/route.ts`

- Nahrazen base64 data URL za Cloudinary upload s try/catch
- Pouziva dynamic import: `await import("@/lib/cloudinary")`
- Fallback: pokud upload selze, pouzije base64 (graceful degradation)
- Opravena reference `pdfBase64` -> `pdfUrl` v JSON response

---

## Soubory

| Soubor | Zmena |
|--------|-------|
| `app/api/upload/route.ts` | NOVY — univerzalni upload endpoint s 6 presety |
| `app/api/listings/[id]/images/route.ts` | Nahrazeny placeholder URL za Cloudinary upload |
| `components/pwa/vehicles/quick/QuickStep3.tsx` | Upload fotek z IndexedDB na Cloudinary |
| `components/pwa/vehicles/DamageReportForm.tsx` | Nahrazen base64 za Cloudinary upload |
| `components/pwa/BrokerPayoutsContent.tsx` | Pridan subfolder do invoices uploadu |
| `app/api/contracts/[id]/pdf/route.ts` | Upload PDF na Cloudinary s base64 fallback |

---

## Overeni

- [x] `POST /api/upload` endpoint existuje a pouziva presety
- [x] Listing images se uploaduji na Cloudinary (ne placeholder URL)
- [x] Quick flow fotky se uploaduji pred odeslanim na API
- [x] Damage report fotky jsou Cloudinary URL (ne base64)
- [x] Invoice upload v BrokerPayouts pouziva subfolder
- [x] Contract PDF se uploaduje na Cloudinary s base64 fallback
- [x] Bez Cloudinary env klicu — vsechny endpointy vraci `dev_upload:...` (graceful)
- [x] `next.config.ts` image pattern pro `res.cloudinary.com` uz existuje (nemeneno)
- [x] npm package `cloudinary` NENI v package.json — pouzivame REST API

## Poznamky

- Server-side routes (listings/images, contracts/pdf) pouzivaji primo import `lib/cloudinary.ts`
- Client-side komponenty (QuickStep3, DamageReport, BrokerPayouts) pouzivaji `/api/upload` endpoint
- `/api/upload` vyzaduje auth — neprihlaseny uzivatel dostane 401
- Presety: `vehicles`, `listings`, `parts`, `invoices`, `contracts`, `damages`
