# Implementace P1-12: Onboarding profile — Cloudinary upload

**Status:** HOTOVO
**Datum:** 2026-04-04

---

## Co bylo udelano

### 1. Vytvoreno: `lib/cloudinary.ts` (NOVY)

Sdileny Cloudinary upload modul — extrahovan z `documents/route.ts` a rozsiren:
- REST API upload (fetch + SHA-1 podpis) — BEZ npm package `cloudinary`
- Dev mode: pokud env neni nastavene, vrati `dev_upload:folder/filename` placeholder
- Max file size: 10 MB
- Volitelny `options.transformation` parametr (pro budouci pouziti)
- Alphabetical sorting parametru v podpisu (Cloudinary requirement)

### 2. Refaktorovan: `app/api/onboarding/documents/route.ts`

- Smazana lokalni `uploadToCloudinary` funkce (47 radku, radky 10-60)
- Pridan import: `import { uploadToCloudinary } from "@/lib/cloudinary"`
- Zbytek souboru beze zmeny — volani `uploadToCloudinary(file, folder)` je API-kompatibilni
- Soubor zmenšen ze 148 na 97 radku

### 3. Upraven: `app/api/onboarding/profile/route.ts`

- Pridan import: `import { uploadToCloudinary } from "@/lib/cloudinary"`
- Nahrazen TODO komentar (radky 51-54) fungujicim upload kodem:
  - `formData.get("photo")` s kontrolou `photo.size > 0`
  - `uploadToCloudinary(photo, "carmakler/avatars/{userId}")` 
  - try/catch — avatar upload failure neblokuje onboarding
- Pridan `...(avatarUrl && { avatar: avatarUrl })` do prisma update data objektu
- Avatar se ulozi jen pokud upload uspel

---

## Soubory

| Soubor | Zmena |
|--------|-------|
| `lib/cloudinary.ts` | NOVY — sdileny upload helper (REST API, BEZ npm package) |
| `app/api/onboarding/documents/route.ts` | Smazana lokalni funkce (47 radku), pridan import ze sdileneho modulu |
| `app/api/onboarding/profile/route.ts` | Pridan import, odkomentovan TODO, avatar upload + prisma update |

---

## Overeni

- [x] Oba endpointy pouzivaji STEJNOU `uploadToCloudinary` funkci z `lib/cloudinary.ts`
- [x] `documents/route.ts` — volani `uploadToCloudinary(file, folder)` je API-kompatibilni (2 parametry)
- [x] `profile/route.ts` — avatar upload s try/catch (neni bloker pro onboarding)
- [x] `profile/route.ts` — avatar se ulozi do `User.avatar` pres spread operator
- [x] Dev mode — graceful placeholder URL bez Cloudinary env
- [x] `User.avatar` pole existuje v schema.prisma (radek 21) — neni treba migrace
- [x] npm package `cloudinary` NENI v package.json — pouzivame REST API primo
- [x] Env promenne uz existuji v `.env.example` (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET)

## Poznamky

- Sdileny modul `lib/cloudinary.ts` ma navic `options.transformation` parametr oproti puvodni lokalni funkci — pripraven pro budouci pouziti (napr. resize avataru)
- Avatar folder: `carmakler/avatars/{userId}` — kazdy uzivatel ma svuj subfolder
- Pokud photo neni prilozeno nebo ma size 0, avatar zustava null (onboarding pokracuje normalne)
