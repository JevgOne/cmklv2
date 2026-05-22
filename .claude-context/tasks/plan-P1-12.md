# Plan P1-12: Onboarding profile -- Cloudinary upload

**Priorita:** P1
**Slozitost:** S
**Zavislosti:** ZADNE (Cloudinary env promenne uz jsou v .env.example)
**Batch:** 1

---

## Cil

Implementovat upload profilove fotky na Cloudinary v onboarding profilu maklere. Aktualne je na radku 51 jen TODO komentar.

---

## Analyza aktualniho stavu

### 1. Soubor s TODO: `app/api/onboarding/profile/route.ts`

**Radky 51-54 — zakomentovany TODO:**
```ts
// TODO: Upload profilove fotky na Cloudinary (pokud prilozena)
// const photo = formData.get("photo") as File | null;
// let avatarUrl = null;
// if (photo) { avatarUrl = await uploadToCloudinary(photo); }
```

**Radky 56-68 — prisma update BEZ avatar pole:**
```ts
const user = await prisma.user.update({
  where: { id: session.user.id },
  data: {
    bio: bio || null,
    specializations: specializations || null,
    cities: JSON.stringify(citiesArray),
    bankAccount: iban,
    onboardingStep: 2,
  },
  select: { id: true, onboardingStep: true },
});
```

### 2. KRITICKE — Existujici Cloudinary upload pattern

**Soubor:** `app/api/onboarding/documents/route.ts` (radky 14-60)

Projekt UZ MA fungujici `uploadToCloudinary` funkci! Pouziva REST API primo (ne npm `cloudinary` package):
- SHA-1 podpis pres `crypto.createHash`
- Base64 encoding souboru
- Fetch na `https://api.cloudinary.com/v1_1/{cloudName}/auto/upload`
- Graceful dev mode: pokud env neni nastavene, vrati `dev_upload:...` placeholder

**DULEZITE:** npm package `cloudinary` NENI v `package.json`. Projekt pouziva vlastni REST implementaci. Plan MUSI zachovat tento pattern — NEPRIDAVAT novou zavislost.

### 3. User.avatar pole

`prisma/schema.prisma` (radek 21):
```prisma
avatar  String?
```
Pole existuje. Neni potreba migrace.

### 4. Env promenne

`.env.example` (radky 21-24) uz obsahuje:
```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Kroky implementace

### Krok 1: Extrahovat uploadToCloudinary do sdileneho lib/cloudinary.ts

Funkce `uploadToCloudinary` v `documents/route.ts` (radky 14-60) se aktualne pouziva jen tam. Extrahovat do sdileneho modulu, aby se dala pouzit i v `profile/route.ts`.

**Soubor:** `lib/cloudinary.ts` (NOVY)

```ts
/**
 * Cloudinary upload pres REST API.
 * Pouziva primo fetch + SHA-1 podpis — NEPOUZIVA npm package `cloudinary`.
 *
 * Podporuje dev mode: pokud env promenne nejsou nastavene,
 * vrati placeholder URL (dev_upload:folder/filename).
 */

// Maximalni velikost souboru: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Upload souboru na Cloudinary pres REST API.
 * @param file - File objekt (z FormData)
 * @param folder - Cloudinary folder (napr. "carmakler/avatars", "carmakler/onboarding/xyz")
 * @param options - Volitelne transformace
 * @returns URL uploadovaneho obrazku (secure_url)
 */
export async function uploadToCloudinary(
  file: File,
  folder: string,
  options?: {
    transformation?: string;
  }
): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Dev mode — Cloudinary neni nakonfigurovano
  if (!cloudName || !apiKey || !apiSecret) {
    console.log(`[Cloudinary:DEV] Skipping upload for: ${file.name}`);
    return `dev_upload:${folder}/${file.name}`;
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${file.size} bytes (max ${MAX_FILE_SIZE})`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  // Generovat signature pro Cloudinary upload
  const timestamp = Math.round(Date.now() / 1000).toString();

  // Parametry pro podpis (alphabetical order!)
  let paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  if (options?.transformation) {
    paramsToSign = `folder=${folder}&timestamp=${timestamp}&transformation=${options.transformation}`;
  }
  paramsToSign += apiSecret;

  // SHA-1 hash pro Cloudinary signature
  const { createHash } = await import("crypto");
  const signature = createHash("sha1").update(paramsToSign).digest("hex");

  const formData = new FormData();
  formData.append("file", dataUri);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);
  if (options?.transformation) {
    formData.append("transformation", options.transformation);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Cloudinary] Upload error:", response.status, errorBody);
    throw new Error(`Cloudinary upload failed: ${response.status}`);
  }

  const data = await response.json();
  return data.secure_url as string;
}
```

### Krok 2: Refaktorovat documents/route.ts (pouzit sdileny modul)

**Soubor:** `app/api/onboarding/documents/route.ts`

Smazat lokalni `uploadToCloudinary` funkci (radky 14-60) a nahradit importem:

```diff
 import { NextResponse } from "next/server";
 import { getServerSession } from "next-auth";
 import { authOptions } from "@/lib/auth";
 import { prisma } from "@/lib/prisma";
+import { uploadToCloudinary } from "@/lib/cloudinary";

 // Maximalni velikost souboru: 10 MB
 const MAX_FILE_SIZE = 10 * 1024 * 1024;
 const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

-/**
- * Upload jednoho souboru na Cloudinary pres REST API.
- * Pokud Cloudinary neni nakonfigurovano, ulozi placeholder URL.
- */
-async function uploadToCloudinary(
-  file: File,
-  folder: string
-): Promise<string> {
-  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
-  const apiKey = process.env.CLOUDINARY_API_KEY;
-  const apiSecret = process.env.CLOUDINARY_API_SECRET;
-
-  // Dev mode — Cloudinary neni nakonfigurovano
-  if (!cloudName || !apiKey || !apiSecret) {
-    console.log(`[Cloudinary:DEV] Skipping upload for: ${file.name}`);
-    return `dev_upload:${folder}/${file.name}`;
-  }
-
-  const arrayBuffer = await file.arrayBuffer();
-  const base64 = Buffer.from(arrayBuffer).toString("base64");
-  const dataUri = `data:${file.type};base64,${base64}`;
-
-  // Generovat signature pro Cloudinary upload
-  const timestamp = Math.round(Date.now() / 1000).toString();
-  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
-
-  // SHA-1 hash pro Cloudinary signature
-  const { createHash } = await import("crypto");
-  const signature = createHash("sha1").update(paramsToSign).digest("hex");
-
-  const formData = new FormData();
-  formData.append("file", dataUri);
-  formData.append("api_key", apiKey);
-  formData.append("timestamp", timestamp);
-  formData.append("signature", signature);
-  formData.append("folder", folder);
-
-  const response = await fetch(
-    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
-    { method: "POST", body: formData }
-  );
-
-  if (!response.ok) {
-    const errorBody = await response.text();
-    console.error("[Cloudinary] Upload error:", response.status, errorBody);
-    throw new Error(`Cloudinary upload failed: ${response.status}`);
-  }
-
-  const data = await response.json();
-  return data.secure_url as string;
-}

 // POST /api/onboarding/documents — upload dokumentu (krok 2)
 export async function POST(request: Request) {
```

Zbytek souboru zustava beze zmeny — `uploadToCloudinary(file, folder)` volani je API-kompatibilni.

### Krok 3: Odkomentovat a doplnit upload v profile/route.ts

**Soubor:** `app/api/onboarding/profile/route.ts`

**Zmena 1 — pridat import (za radek 4):**
```diff
 import { prisma } from "@/lib/prisma";
+import { uploadToCloudinary } from "@/lib/cloudinary";
```

**Zmena 2 — nahradit TODO (radky 51-54):**
```diff
-    // TODO: Upload profilove fotky na Cloudinary (pokud prilozena)
-    // const photo = formData.get("photo") as File | null;
-    // let avatarUrl = null;
-    // if (photo) { avatarUrl = await uploadToCloudinary(photo); }
+    // Upload profilove fotky na Cloudinary
+    const photo = formData.get("photo") as File | null;
+    let avatarUrl: string | null = null;
+    if (photo && photo.size > 0) {
+      try {
+        avatarUrl = await uploadToCloudinary(photo, `carmakler/avatars/${session.user.id}`);
+      } catch (uploadError) {
+        console.error("Avatar upload failed:", uploadError);
+        // Pokracovat bez fotky — neni to bloker pro onboarding
+      }
+    }
```

**Zmena 3 — pridat avatar do prisma update (radek 58, data objekt):**
```diff
     const user = await prisma.user.update({
       where: { id: session.user.id },
       data: {
         bio: bio || null,
         specializations: specializations || null,
         cities: JSON.stringify(citiesArray),
         bankAccount: iban,
         onboardingStep: 2,
+        ...(avatarUrl && { avatar: avatarUrl }),
       },
       select: {
         id: true,
         onboardingStep: true,
       },
     });
```

---

## Presny diff — vsechny 3 soubory

### `lib/cloudinary.ts` (NOVY)

Kompletni kod viz Krok 1 vyse.

### `app/api/onboarding/documents/route.ts`

```diff
 import { NextResponse } from "next/server";
 import { getServerSession } from "next-auth";
 import { authOptions } from "@/lib/auth";
 import { prisma } from "@/lib/prisma";
+import { uploadToCloudinary } from "@/lib/cloudinary";

 // Maximalni velikost souboru: 10 MB
 const MAX_FILE_SIZE = 10 * 1024 * 1024;
 const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

-/**
- * Upload jednoho souboru na Cloudinary pres REST API.
- * ... (47 radku lokalni funkce)
- */
-async function uploadToCloudinary( ... ): Promise<string> { ... }
-
 // POST /api/onboarding/documents — upload dokumentu (krok 2)
 export async function POST(request: Request) {
```

### `app/api/onboarding/profile/route.ts`

```diff
 import { prisma } from "@/lib/prisma";
+import { uploadToCloudinary } from "@/lib/cloudinary";

 // ... (radky 7-50 beze zmeny)

-    // TODO: Upload profilove fotky na Cloudinary (pokud prilozena)
-    // const photo = formData.get("photo") as File | null;
-    // let avatarUrl = null;
-    // if (photo) { avatarUrl = await uploadToCloudinary(photo); }
+    // Upload profilove fotky na Cloudinary
+    const photo = formData.get("photo") as File | null;
+    let avatarUrl: string | null = null;
+    if (photo && photo.size > 0) {
+      try {
+        avatarUrl = await uploadToCloudinary(photo, `carmakler/avatars/${session.user.id}`);
+      } catch (uploadError) {
+        console.error("Avatar upload failed:", uploadError);
+      }
+    }

     const user = await prisma.user.update({
       where: { id: session.user.id },
       data: {
         bio: bio || null,
         specializations: specializations || null,
         cities: JSON.stringify(citiesArray),
         bankAccount: iban,
         onboardingStep: 2,
+        ...(avatarUrl && { avatar: avatarUrl }),
       },
```

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `lib/cloudinary.ts` | NOVY — sdileny upload helper (REST API, BEZ npm package) |
| `app/api/onboarding/documents/route.ts` | Smazat lokalni uploadToCloudinary (47 radku), pridat import ze sdileneho modulu |
| `app/api/onboarding/profile/route.ts` | Pridat import, odkomentovat TODO, pridat avatar do prisma update |

**NEPRIDAVAT:** npm package `cloudinary` — projekt pouziva vlastni REST API implementaci.

## Overeni

- [ ] Upload fotky pri onboardingu funguje (fotka se objevi na Cloudinary v folder `carmakler/avatars/{userId}`)
- [ ] Avatar URL se ulozi do `User.avatar` v DB
- [ ] Bez Cloudinary env klicu — graceful dev mode, vrati `dev_upload:...` placeholder, onboarding pokracuje
- [ ] Bez prilozene fotky — onboarding funguje normalne (avatar zustava null)
- [ ] `documents/route.ts` stale funguje po refaktoru (import sdileneho modulu)
- [ ] Oba endpointy pouzivaji STEJNOU `uploadToCloudinary` funkci z `lib/cloudinary.ts`
- [ ] `User.avatar` pole existuje v schema (potvrzeno — radek 21 schema.prisma)
- [ ] Build prochazi bez TypeScript chyb
- [ ] npm package `cloudinary` NENI v package.json (pouzivame REST API primo)
