# Plan P1-04: Cloudinary upload pro vozidla, inzeraty a dily

**Priorita:** P1
**Slozitost:** M
**Zavislosti:** P0-07 (env — HOTOVO v Batch 1), P1-12 (lib/cloudinary.ts — HOTOVO v Batch 1)
**Batch:** 2
**Fix plan referece:** Puvodne P1-05 ve fix-plan-production-readiness.md

---

## Cil

Napojit existujici `lib/cloudinary.ts` (sdileny modul z Batch 1) na vsechny upload endpointy. Aktualne 5 mist v kodu pouziva placeholder URL nebo base64 misto realneho Cloudinary uploadu.

---

## Analyza aktualniho stavu

### Sdileny modul (HOTOVY — Batch 1)

`lib/cloudinary.ts` jiz existuje s funkci `uploadToCloudinary(file, folder, options?)`:
- REST API pristup (ne npm package)
- SHA-1 podpis
- Dev mode graceful fallback (`dev_upload:...`)
- Max 10 MB per soubor

### Mista ktera POUZIVAJI placeholder misto Cloudinary

| # | Soubor | Aktualni stav | Popis |
|---|--------|---------------|-------|
| A | `app/api/listings/[id]/images/route.ts` | Placeholder URL `/uploads/listings/{id}/photo-{i}.jpg` (radky 67-74) | Inzertni fotky |
| B | `components/pwa/vehicles/quick/QuickStep3.tsx` | Placeholder URL z IndexedDB thumbnailUrl (radky 147-159) | PWA rychle nabirani fotek |
| C | `components/pwa/vehicles/DamageReportForm.tsx` | Base64 v JSON (radky 59-69) | Hlaseni poskozeni |
| D | `components/pwa/BrokerPayoutsContent.tsx` | Volani neexistujiciho `/api/upload` (radky 62-68) | Upload faktury maklere |
| E | `app/api/contracts/[id]/pdf/route.ts` | Base64 data URL misto Cloudinary (radek 212) | PDF smlouvy |

### Mista ktera UZ pouzivaji Cloudinary (HOTOVE)

| Soubor | Stav |
|--------|------|
| `app/api/onboarding/documents/route.ts` | Pouziva `lib/cloudinary.ts` (Batch 1 refaktor) |
| `app/api/onboarding/profile/route.ts` | Pouziva `lib/cloudinary.ts` (Batch 1 refaktor) |

### API route pro Vehicle images (quick flow)

`app/api/vehicles/quick/route.ts` ocekava image URLs v payloadu (radek 38-47):
```ts
// Krok 2: Fotky (URLs z Cloudinary)
images: z.array(z.object({
  url: z.string().url(),
  isPrimary: z.boolean().optional(),
  order: z.number().int().optional(),
})).min(5, "Minimálně 5 fotek je povinných"),
```

**DULEZITE:** Vehicle quick flow uz ocekava Cloudinary URLs. Problem je na klientske strane (QuickStep3.tsx) ktera posilana placeholder misto realnych URL.

### `next.config.ts` — image domain uz nakonfigurovano

```ts
images: {
  remotePatterns: [{
    protocol: "https",
    hostname: "res.cloudinary.com",
  }],
},
```

Toto je jiz pripraveno.

---

## Kroky implementace

### Krok 1: Vytvorit genericky upload API endpoint

Aktualne neexistuje `/api/upload` ale `BrokerPayoutsContent.tsx` ho ocekava. Vytvorit univerzalni upload endpoint.

**Soubor:** `app/api/upload/route.ts` (NOVY)

```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOC_TYPES = ["application/pdf", ...ALLOWED_IMAGE_TYPES];

// Mapping upload_preset -> folder + allowed types
const PRESETS: Record<string, { folder: string; allowedTypes: string[] }> = {
  vehicles: { folder: "carmakler/vehicles", allowedTypes: ALLOWED_IMAGE_TYPES },
  listings: { folder: "carmakler/listings", allowedTypes: ALLOWED_IMAGE_TYPES },
  parts: { folder: "carmakler/parts", allowedTypes: ALLOWED_IMAGE_TYPES },
  invoices: { folder: "carmakler/invoices", allowedTypes: ALLOWED_DOC_TYPES },
  contracts: { folder: "carmakler/contracts", allowedTypes: ALLOWED_DOC_TYPES },
  damages: { folder: "carmakler/damages", allowedTypes: ALLOWED_IMAGE_TYPES },
};

/**
 * POST /api/upload — Univerzalni upload na Cloudinary.
 *
 * FormData:
 * - file: File (povinny)
 * - upload_preset: string (povinny) — urcuje folder a povolene typy
 * - subfolder?: string (volitelny) — napr. userId nebo vehicleId
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const preset = formData.get("upload_preset") as string | null;
    const subfolder = formData.get("subfolder") as string | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Soubor je povinny" }, { status: 400 });
    }

    if (!preset || !PRESETS[preset]) {
      return NextResponse.json(
        { error: `Neplatny upload_preset. Povolene: ${Object.keys(PRESETS).join(", ")}` },
        { status: 400 }
      );
    }

    const { folder, allowedTypes } = PRESETS[preset];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Nepodporovany typ souboru: ${file.type}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Soubor je prilis velky (max 10 MB)" },
        { status: 400 }
      );
    }

    const targetFolder = subfolder ? `${folder}/${subfolder}` : folder;
    const url = await uploadToCloudinary(file, targetFolder);

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Chyba pri uploadu" }, { status: 500 });
  }
}
```

### Krok 2: Opravit `app/api/listings/[id]/images/route.ts`

Nahradit placeholder URL za realny Cloudinary upload.

**Zmena 1 — pridat import (za radek 4):**
```diff
 import { prisma } from "@/lib/prisma";
+import { uploadToCloudinary } from "@/lib/cloudinary";
```

**Zmena 2 — nahradit radky 67-84 (upload loop):**
```diff
-    // V MVP ukládáme jen placeholder URL (v produkci Cloudinary upload)
-    const images = [];
-    for (let i = 0; i < photos.length; i++) {
-      const order = parseInt(formData.get(`order_${i}`) as string, 10) || i;
-      const isPrimary = formData.get(`isPrimary_${i}`) === "true";
-
-      // V produkci: upload na Cloudinary, zde placeholder
-      const url = `/uploads/listings/${id}/photo-${i}.jpg`;
-
-      const image = await prisma.listingImage.create({
-        data: {
-          listingId: id,
-          url,
-          order,
-          isPrimary,
-        },
-      });
-      images.push(image);
-    }
+    // Upload na Cloudinary
+    const images = [];
+    for (let i = 0; i < photos.length; i++) {
+      const order = parseInt(formData.get(`order_${i}`) as string, 10) || i;
+      const isPrimary = formData.get(`isPrimary_${i}`) === "true";
+
+      let url: string;
+      try {
+        url = await uploadToCloudinary(photos[i], `carmakler/listings/${id}`);
+      } catch (uploadError) {
+        console.error(`Failed to upload photo ${i}:`, uploadError);
+        continue; // Preskocit selhany upload, pokracovat s dalsimi
+      }
+
+      const image = await prisma.listingImage.create({
+        data: {
+          listingId: id,
+          url,
+          order,
+          isPrimary,
+        },
+      });
+      images.push(image);
+    }
```

### Krok 3: Opravit `components/pwa/vehicles/quick/QuickStep3.tsx`

Aktualni flow: QuickStep3 cte fotky z IndexedDB a posila thumbnailUrl jako placeholder.

**Problem:** Quick flow fotky jsou ulozeny v IndexedDB (offline-first). Pred odeslanim na server se musi uploadovat na Cloudinary.

**Zmena (radky 146-159):**
```diff
-      // Přečíst fotky — v quick flow jsou uložené v IndexedDB
-      // Pro MVP pošleme placeholder URLs, reálné fotky se uploadují přes Cloudinary
-      const photos = (draft.photos as unknown as Array<{
-        slotId: string;
-        imageId: string;
-        thumbnailUrl: string;
-        isMain: boolean;
-      }>) ?? [];
-
-      const imageUrls = photos.map((p, i) => ({
-        url: p.thumbnailUrl || `/api/images/${p.imageId}`,
-        isPrimary: p.isMain || i === 0,
-        order: i,
-      }));
+      // Přečíst fotky z IndexedDB a uploadovat na Cloudinary
+      const photos = (draft.photos as unknown as Array<{
+        slotId: string;
+        imageId: string;
+        thumbnailUrl: string;
+        isMain: boolean;
+        file?: File;
+        blob?: Blob;
+      }>) ?? [];
+
+      const imageUrls: Array<{ url: string; isPrimary: boolean; order: number }> = [];
+      for (let i = 0; i < photos.length; i++) {
+        const p = photos[i];
+        // Pokud mame soubor, uploadovat na Cloudinary pres /api/upload
+        if (p.file || p.blob) {
+          const formData = new FormData();
+          const fileToUpload = p.file || new File([p.blob!], `photo-${i}.jpg`, { type: "image/jpeg" });
+          formData.append("file", fileToUpload);
+          formData.append("upload_preset", "vehicles");
+
+          try {
+            const uploadRes = await fetch("/api/upload", {
+              method: "POST",
+              body: formData,
+            });
+            if (uploadRes.ok) {
+              const { url } = await uploadRes.json();
+              imageUrls.push({ url, isPrimary: p.isMain || i === 0, order: i });
+              continue;
+            }
+          } catch (err) {
+            console.error(`Failed to upload photo ${i}:`, err);
+          }
+        }
+        // Fallback: pouzit thumbnailUrl (IndexedDB data URL)
+        if (p.thumbnailUrl) {
+          imageUrls.push({
+            url: p.thumbnailUrl,
+            isPrimary: p.isMain || i === 0,
+            order: i,
+          });
+        }
+      }
```

**POZNAMKA:** Toto je klientska komponenta (`"use client"`), takze pouziva `/api/upload` endpoint misto primeho importu `lib/cloudinary.ts` (ktery je server-only).

### Krok 4: Opravit `components/pwa/vehicles/DamageReportForm.tsx`

**Zmena (radky 58-69) — nahradit base64 za Cloudinary upload:**
```diff
     try {
-      // Upload photos if any — for now, send as base64 in JSON
-      // In production, this would use Cloudinary
-      const imageData: string[] = [];
-      for (const photo of photos) {
-        const reader = new FileReader();
-        const base64 = await new Promise<string>((resolve) => {
-          reader.onload = (ev) => resolve(ev.target?.result as string);
-          reader.readAsDataURL(photo);
-        });
-        imageData.push(base64);
-      }
+      // Upload photos na Cloudinary
+      const imageData: string[] = [];
+      for (const photo of photos) {
+        const formData = new FormData();
+        formData.append("file", photo);
+        formData.append("upload_preset", "damages");
+        formData.append("subfolder", vehicleId);
+
+        try {
+          const uploadRes = await fetch("/api/upload", {
+            method: "POST",
+            body: formData,
+          });
+          if (uploadRes.ok) {
+            const { url } = await uploadRes.json();
+            imageData.push(url);
+          }
+        } catch (err) {
+          console.error("Failed to upload damage photo:", err);
+        }
+      }
```

### Krok 5: BrokerPayoutsContent.tsx — opravit upload_preset

Aktualni kod uz vola `/api/upload` (radky 62-68), ale s `upload_preset: "invoices"` a bez subfolder. Po vytvoreni `/api/upload` v Kroku 1 bude fungovat automaticky.

**Mala zmena — pridat subfolder (radek 65):**
```diff
       const formData = new FormData();
       formData.append("file", file);
       formData.append("upload_preset", "invoices");
+      formData.append("subfolder", payoutId);
```

### Krok 6: Opravit `app/api/contracts/[id]/pdf/route.ts`

**Zmena (radek 212-213):**
```diff
-    // For now, store as base64 data URL (can be replaced with Cloudinary upload)
-    const pdfBase64 = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
+    // Upload PDF na Cloudinary
+    let pdfUrl: string;
+    try {
+      const { uploadToCloudinary } = await import("@/lib/cloudinary");
+      const pdfFile = new File([pdfBuffer], `smlouva-${id}.pdf`, { type: "application/pdf" });
+      pdfUrl = await uploadToCloudinary(pdfFile, `carmakler/contracts/${id}`);
+    } catch (uploadError) {
+      console.error("PDF upload failed, using base64 fallback:", uploadError);
+      pdfUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
+    }
```

A nasledne na radku kde se uklada URL do DB (cca radek 216):
```diff
-    pdfUrl: pdfBase64,
+    pdfUrl,
```

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `app/api/upload/route.ts` | NOVY — univerzalni upload endpoint s presety |
| `app/api/listings/[id]/images/route.ts` | Nahradit placeholder za Cloudinary upload (radky 67-84) |
| `components/pwa/vehicles/quick/QuickStep3.tsx` | Upload z IndexedDB na Cloudinary pred odeslanim (radky 146-159) |
| `components/pwa/vehicles/DamageReportForm.tsx` | Nahradit base64 za Cloudinary upload (radky 58-69) |
| `components/pwa/BrokerPayoutsContent.tsx` | Pridat subfolder do uploadu (radek 65) |
| `app/api/contracts/[id]/pdf/route.ts` | Upload PDF na Cloudinary s fallback (radek 212) |

**NEPRIDAVAT:** npm package `cloudinary` — pouzivame REST API z `lib/cloudinary.ts`.

## Zavislosti mezi kroky

```
Krok 1 (api/upload) → Krok 3, 4, 5 (client-side components pouzivaji /api/upload)
Krok 2 (listings/images) → nezavisly (server-side import)
Krok 6 (contracts/pdf) → nezavisly (server-side import)
```

Kroky 2 a 6 mohou bezet paralelne s Krokem 1.
Kroky 3, 4, 5 ZAVISI na Kroku 1 (api/upload endpoint musi existovat).

## Overeni

- [ ] `POST /api/upload` funguje s preset `vehicles` — vraci `{ url: "https://res.cloudinary.com/..." }`
- [ ] `POST /api/upload` odmitne neplatny preset (400)
- [ ] `POST /api/upload` odmitne prilis velky soubor (400)
- [ ] `POST /api/upload` odmitne neprihlaseneho uzivatele (401)
- [ ] Listing images se uploaduji na Cloudinary (ne placeholder URL)
- [ ] Quick flow fotky se uploaduji pred odeslanim na API
- [ ] Damage report fotky jsou Cloudinary URL (ne base64)
- [ ] Invoice upload v BrokerPayouts funguje
- [ ] Contract PDF se uploaduje na Cloudinary s base64 fallback
- [ ] Bez Cloudinary env klicu — vsechny endpointy vraci `dev_upload:...` (graceful)
- [ ] `next.config.ts` image pattern pro `res.cloudinary.com` uz existuje (nement)
- [ ] Build prochazi bez TypeScript chyb
