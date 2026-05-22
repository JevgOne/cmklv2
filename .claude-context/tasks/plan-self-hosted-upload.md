# Plan — Přechod z Cloudinary na self-hosted upload

**Datum:** 2026-04-12
**Agent:** Plánovač
**Zdroj:** Task #29 (team-lead, požadavek uživatele)
**Effort:** ~6-8h (implementace) + ~1h (Nginx setup na serveru)
**DB migrace:** ŽÁDNÁ (URL jsou stringy, nový formát je stále string URL)

---

## §0 Executive summary

Přechod z Cloudinary REST API na vlastní upload server. Místo odesílání fotek třetí straně se fotky zpracují pomocí **Sharp** (resize + watermark + WebP optimalizace) a uloží na disk produkčního serveru. Nginx servíruje statické soubory z `files.carmakler.cz` subdomény.

**Motivace:**
- Žádné limity (Cloudinary Free = 25 credits/měsíc)
- Žádné credentials třetích stran
- Plná kontrola nad vodoznaky (Sharp composite)
- Server 91.98.203.239 má 32 GB RAM — Sharp processing je triviální

**Rozsah změn:**
- **2 nové soubory:** `lib/upload.ts` (~150 lines), `scripts/migrate-cloudinary.ts` (~80 lines)
- **1 nový soubor (server):** Nginx config pro `files.carmakler.cz`
- **5 editů:** upload route, 4 API routes (přepojit import)
- **2 config edity:** `next.config.ts` (CSP + image domains), `.env.example`
- **1 smazání:** `scripts/upload-watermark.ts` (Cloudinary-specific, nahrazen)

---

## §1 Kompletní audit Cloudinary usage

### 1.1 Všechna místa volání `uploadToCloudinary()`

| # | Soubor | Line | Účel | Preset/Folder |
|---|--------|------|------|---------------|
| 1 | `app/api/upload/route.ts` | 69 | Univerzální upload (6 presetů) | vehicles, listings, parts, invoices, contracts, damages |
| 2 | `app/api/listings/[id]/images/route.ts` | 76 | Fotky inzerátu (přímý upload) | `carmakler/listings/{id}` |
| 3 | `app/api/onboarding/documents/route.ts` | 64-67 | Onboarding dokumenty (3 soubory) | `carmakler/onboarding/{userId}` |
| 4 | `app/api/onboarding/profile/route.ts` | 57 | Avatar makléře | `carmakler/avatars/{userId}` |
| 5 | `app/api/contracts/[id]/pdf/route.ts` | 217 | Generovaný PDF kontrakt | `carmakler/contracts/{id}` |

### 1.2 Všechna místa čtení Cloudinary URL

| # | Soubor | Line | Typ | Detail |
|---|--------|------|-----|--------|
| 1 | `next.config.ts` | 30 | CSP | `img-src ... https://res.cloudinary.com` |
| 2 | `next.config.ts` | 69 | Image domain | `hostname: "res.cloudinary.com"` |
| 3 | `lib/cloudinary.ts` | 108 | URL check | `getOptimizedUrl()` — `url.includes("res.cloudinary.com")` |
| 4 | 31 komponent | various | `next/image` | `<Image src={url} />` — URL z DB (VehicleImage.url, Part.images atd.) |
| 5 | `.env.example` | 31-33 | Env vars | `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` |
| 6 | `prisma/seed.ts` | 2039+ | Seed data | `placehold.co` URLs (ne Cloudinary, ale related) |

### 1.3 DB pole ukládající URL

| Model | Pole | Typ | Příklad hodnoty |
|-------|------|-----|-----------------|
| `VehicleImage` | `url` | String | `https://res.cloudinary.com/.../carmakler/vehicles/xyz.jpg` |
| `ListingImage` | `url` | String | `https://res.cloudinary.com/.../carmakler/listings/xyz.jpg` |
| `Part` | `images` | String (JSON array) | `["https://res.cloudinary.com/..."]` |
| `User` | `avatar` | String? | `https://res.cloudinary.com/.../carmakler/avatars/xyz.jpg` |
| `User` | `documents` | String? (JSON) | `{"tradeLicense":"https://res.cloudinary.com/..."}` |
| `Contract` | `pdfUrl` | String? | `https://res.cloudinary.com/.../carmakler/contracts/xyz.pdf` |
| `BrokerPayout` | `invoiceUrl` | String? | `https://res.cloudinary.com/...` |
| `Vehicle` | `damageImages` | String? (JSON) | `["https://res.cloudinary.com/..."]` |
| `Order` | `images` | String? (JSON) | damage/reklamace fotky |

---

## §2 Architektura self-hosted uploadu

### 2.1 Upload flow (nový)

```
Client (PhotoUpload, PhotoStep, Step4Photos, ...)
    ↓ FormData { file, upload_preset, subfolder? }
    ↓
POST /api/upload (existing route, reimplemented)
    ↓
lib/upload.ts :: uploadToServer(file, folder, options)
    ├─ 1. Validace (typ, velikost)
    ├─ 2. Sharp: resize (max 1920px)
    ├─ 3. Sharp: watermark overlay (pokud options.watermark)
    ├─ 4. Sharp: optimalizace (WebP 85% quality)
    ├─ 5. Zapsat na disk: /var/www/uploads/{folder}/{hash}.webp
    └─ 6. Return URL: https://files.carmakler.cz/{folder}/{hash}.webp
    ↓
Response: { url: "https://files.carmakler.cz/..." }
```

### 2.2 Adresářová struktura na serveru

```
/var/www/uploads/
├── carmakler/
│   ├── vehicles/           # fotky vozidel
│   │   └── {subfolder}/    # optional vehicleId
│   ├── listings/           # fotky inzerátů
│   │   └── {listingId}/
│   ├── parts/              # fotky autodílů
│   ├── damages/            # fotky poškození
│   ├── avatars/            # profilové fotky
│   │   └── {userId}/
│   ├── onboarding/         # dokumenty (živnosťák, OP)
│   │   └── {userId}/
│   └── contracts/          # generované PDF
│       └── {contractId}/
```

### 2.3 Naming convention

```
{timestamp}-{hash8}.{ext}

Příklad: 1744451234-a3f8b2c1.webp
```

- `timestamp` = `Date.now()` — natural ordering
- `hash8` = prvních 8 znaků SHA-256 z file bufferu — unikátnost + deduplikace
- `ext` = `webp` pro obrázky, `pdf` pro dokumenty

### 2.4 Dev mode

```
Pokud !UPLOAD_DIR (env var):
  → uložit do /tmp/carmakler-uploads/{folder}/{hash}.webp
  → vrátit URL: http://localhost:3000/api/uploads/{folder}/{hash}.webp

Dev API route /api/uploads/[...path] servíruje soubory z /tmp/carmakler-uploads/
(jen v NODE_ENV === "development")
```

**Alternativa:** Zachovat placehold.co fallback pro čistě offline dev bez Sharp.

---

## §3 Soubory k vytvoření

### 3.1 `lib/upload.ts` (NEW, ~150 lines)

Kompletní náhrada za `lib/cloudinary.ts`.

```typescript
/**
 * Self-hosted file upload: Sharp processing + disk storage.
 * Nahrazuje Cloudinary REST API — žádné externí závislosti.
 */

import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

// Konfigurace z env
const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/uploads";
const UPLOAD_BASE_URL = process.env.UPLOAD_BASE_URL || "https://files.carmakler.cz";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGE_WIDTH = 1920;
const WEBP_QUALITY = 85;
const WATERMARK_PATH = join(process.cwd(), "public/brand/logo-white.png");

interface UploadOptions {
  watermark?: boolean;
  /** Pro PDF/dokumenty: přeskočit Sharp processing */
  skipProcessing?: boolean;
}

/**
 * Upload souboru na vlastní server.
 * - Obrázky: Sharp resize + watermark + WebP optimalizace
 * - PDF/dokumenty: uloží as-is
 *
 * @returns Absolutní URL na soubor
 */
export async function uploadToServer(
  file: File,
  folder: string,
  options?: UploadOptions
): Promise<string> {
  // Dev mode fallback (žádný Sharp, žádný disk)
  if (process.env.NODE_ENV === "development" && !process.env.UPLOAD_DIR) {
    const label = encodeURIComponent(`dev-${folder.replace(/\//g, "-")}-${Date.now()}`);
    return `https://placehold.co/600x400/png?text=${label}`;
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${file.size} bytes (max ${MAX_FILE_SIZE})`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Generovat unikátní název
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 8);
  const timestamp = Date.now();
  const isImage = file.type.startsWith("image/") && !file.type.includes("pdf");
  const ext = isImage ? "webp" : file.name.split(".").pop() || "bin";
  const filename = `${timestamp}-${hash}.${ext}`;

  // Vytvořit adresář
  const targetDir = join(UPLOAD_DIR, folder);
  await mkdir(targetDir, { recursive: true });
  const targetPath = join(targetDir, filename);

  if (isImage && !options?.skipProcessing) {
    // Sharp processing pipeline
    const sharp = (await import("sharp")).default;

    let pipeline = sharp(buffer)
      .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true });

    // Watermark overlay
    if (options?.watermark) {
      // Načíst watermark, resize na 15% šířky původního obrázku
      const metadata = await sharp(buffer).metadata();
      const imgWidth = metadata.width || MAX_IMAGE_WIDTH;
      const watermarkWidth = Math.round(imgWidth * 0.15);

      const watermarkBuffer = await sharp(WATERMARK_PATH)
        .resize({ width: watermarkWidth })
        .ensureAlpha()
        // 40% opacity = multiply alpha channel
        .composite([{
          input: Buffer.from([0, 0, 0, Math.round(255 * 0.4)]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: "dest-in",
        }])
        .toBuffer();

      pipeline = pipeline.composite([{
        input: watermarkBuffer,
        gravity: "southeast",
      }]);
    }

    const outputBuffer = await pipeline
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    await writeFile(targetPath, outputBuffer);
  } else {
    // PDF/dokumenty — uložit as-is
    await writeFile(targetPath, buffer);
  }

  // Vrátit veřejnou URL
  return `${UPLOAD_BASE_URL}/${folder}/${filename}`;
}

/**
 * Generuje optimalizovanou URL pro zobrazení.
 * Self-hosted: Nginx cache + CDN headers, nepotřebuje URL transformaci.
 * Zachovává zpětnou kompatibilitu s Cloudinary URLs v DB.
 */
export function getOptimizedUrl(
  url: string,
  _width: number = 800,
  _quality: string = "auto"
): string {
  // Cloudinary URLs (staré fotky) — pass-through
  // Self-hosted URLs — already optimized at upload time
  return url;
}
```

**Klíčové principy:**
- `sharp` je lazy import (`await import("sharp")`) — nestahuje se pokud není potřeba
- Watermark: composite logo-white.png přes Sharp (ne Cloudinary overlay)
- WebP output (85% quality) — ~50% menší než JPEG při stejné kvalitě
- Dev mode: zachovává placehold.co fallback (žádný Sharp, žádný disk)
- `getOptimizedUrl()` je pass-through — optimalizace proběhla při uploadu, ne při zobrazení
- Zpětná kompatibilita: Cloudinary URLs v DB stále fungují (next/image je servíruje)

### 3.2 `app/api/uploads/[...path]/route.ts` (NEW, ~30 lines, DEV ONLY)

Dev-only route pro servírování lokálně uložených souborů.

```typescript
/**
 * DEV ONLY: Servíruje lokálně uložené soubory.
 * V produkci toto obsluhuje Nginx (files.carmakler.cz).
 */
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { path } = await params;
  const filePath = join(
    process.env.UPLOAD_DIR || "/tmp/carmakler-uploads",
    ...path
  );

  try {
    const buffer = await readFile(filePath);
    const ext = filePath.split(".").pop();
    const contentType = ext === "webp" ? "image/webp"
      : ext === "pdf" ? "application/pdf"
      : ext === "jpg" || ext === "jpeg" ? "image/jpeg"
      : ext === "png" ? "image/png"
      : "application/octet-stream";

    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
```

### 3.3 `scripts/migrate-cloudinary.ts` (NEW, ~80 lines)

Jednorázový migration script pro stažení existujících fotek z Cloudinary a re-upload na vlastní server.

```typescript
/**
 * Migrace: stáhnout fotky z Cloudinary, zpracovat přes Sharp, uložit na disk.
 * Spustit na produkčním serveru: npx tsx scripts/migrate-cloudinary.ts
 *
 * Postup:
 * 1. Načíst všechny URL z DB (VehicleImage, ListingImage, Part.images, User.avatar, ...)
 * 2. Pro každou Cloudinary URL:
 *    a. Stáhnout originál
 *    b. Sharp: resize + watermark (pro produktové fotky) + WebP
 *    c. Uložit na disk
 *    d. Aktualizovat URL v DB
 * 3. Logovat výsledky
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/uploads";
const UPLOAD_BASE_URL = process.env.UPLOAD_BASE_URL || "https://files.carmakler.cz";

// Modely a pole s Cloudinary URLs
const MIGRATIONS = [
  {
    name: "VehicleImage",
    query: () => prisma.vehicleImage.findMany({ where: { url: { contains: "res.cloudinary.com" } } }),
    update: (id: string, url: string) => prisma.vehicleImage.update({ where: { id }, data: { url } }),
    urlField: "url",
    folder: "carmakler/vehicles",
    watermark: true,
  },
  {
    name: "ListingImage",
    query: () => prisma.listingImage.findMany({ where: { url: { contains: "res.cloudinary.com" } } }),
    update: (id: string, url: string) => prisma.listingImage.update({ where: { id }, data: { url } }),
    urlField: "url",
    folder: "carmakler/listings",
    watermark: true,
  },
  // ... Part.images (JSON parse), User.avatar, User.documents, Contract.pdfUrl
  // Plná implementace v migration scriptu
];

async function migrateUrl(cloudinaryUrl: string, folder: string, watermark: boolean): Promise<string> {
  // 1. Fetch originál z Cloudinary
  // 2. Sharp processing (resize + watermark + WebP)
  // 3. Zapsat na disk
  // 4. Vrátit novou URL
  // ... (implementační detail)
  return ""; // placeholder
}

async function main() {
  for (const migration of MIGRATIONS) {
    console.log(`\nMigrating ${migration.name}...`);
    const items = await migration.query();
    let ok = 0, fail = 0;

    for (const item of items) {
      try {
        const newUrl = await migrateUrl(
          (item as Record<string, string>)[migration.urlField],
          migration.folder,
          migration.watermark
        );
        await migration.update((item as Record<string, string>).id, newUrl);
        ok++;
      } catch (err) {
        console.error(`  FAIL ${(item as Record<string, string>).id}:`, err);
        fail++;
      }
    }

    console.log(`  ${migration.name}: ${ok} OK, ${fail} FAIL (z ${items.length})`);
  }
}

main().finally(() => prisma.$disconnect());
```

**POZNÁMKA:** Toto je skeleton. Implementátor doplní detaily (Sharp pipeline, JSON parse pro Part.images, batch processing). Migration script se spouští PO úspěšném nasazení nového upload systému.

---

## §4 Soubory k editaci

### 4.1 `app/api/upload/route.ts` — přepojit na `uploadToServer` (lines 4, 11-18, 67-71)

**Změna 1 — import (line 4):**
```diff
-import { uploadToCloudinary, WATERMARK_TRANSFORMATION } from "@/lib/cloudinary";
+import { uploadToServer } from "@/lib/upload";
```

**Změna 2 — PRESETS typ (lines 11-18):**
```diff
-const PRESETS: Record<string, { folder: string; allowedTypes: string[]; watermark?: boolean }> = {
-  vehicles: { folder: "carmakler/vehicles", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
-  listings: { folder: "carmakler/listings", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
-  parts: { folder: "carmakler/parts", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
-  invoices: { folder: "carmakler/invoices", allowedTypes: ALLOWED_DOC_TYPES },
-  contracts: { folder: "carmakler/contracts", allowedTypes: ALLOWED_DOC_TYPES },
-  damages: { folder: "carmakler/damages", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
+const PRESETS: Record<string, { folder: string; allowedTypes: string[]; watermark?: boolean; skipProcessing?: boolean }> = {
+  vehicles: { folder: "carmakler/vehicles", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
+  listings: { folder: "carmakler/listings", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
+  parts: { folder: "carmakler/parts", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
+  invoices: { folder: "carmakler/invoices", allowedTypes: ALLOWED_DOC_TYPES, skipProcessing: true },
+  contracts: { folder: "carmakler/contracts", allowedTypes: ALLOWED_DOC_TYPES, skipProcessing: true },
+  damages: { folder: "carmakler/damages", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
 };
```

**Změna 3 — upload call (lines 67-71):**
```diff
     const targetFolder = subfolder ? `${folder}/${subfolder}` : folder;
-    const { watermark } = PRESETS[preset];
-    const url = await uploadToCloudinary(
-      file, targetFolder,
-      watermark ? { transformation: WATERMARK_TRANSFORMATION } : undefined
-    );
+    const { watermark, skipProcessing } = PRESETS[preset];
+    const url = await uploadToServer(file, targetFolder, { watermark, skipProcessing });
```

---

### 4.2 `app/api/listings/[id]/images/route.ts` — přepojit (lines 5, 76)

```diff
-import { uploadToCloudinary, WATERMARK_TRANSFORMATION } from "@/lib/cloudinary";
+import { uploadToServer } from "@/lib/upload";
 // ...
-        url = await uploadToCloudinary(photos[i], `carmakler/listings/${id}`, {
-          transformation: WATERMARK_TRANSFORMATION,
-        });
+        url = await uploadToServer(photos[i], `carmakler/listings/${id}`, { watermark: true });
```

---

### 4.3 `app/api/onboarding/documents/route.ts` — přepojit (lines 5, 64-67)

```diff
-import { uploadToCloudinary } from "@/lib/cloudinary";
+import { uploadToServer } from "@/lib/upload";
 // ...
     const [tradeLicenseUrl, idFrontUrl, idBackUrl] = await Promise.all([
-      uploadToCloudinary(tradeLicense, folder),
-      uploadToCloudinary(idFront, folder),
-      uploadToCloudinary(idBack, folder),
+      uploadToServer(tradeLicense, folder, { skipProcessing: true }),
+      uploadToServer(idFront, folder, { skipProcessing: true }),
+      uploadToServer(idBack, folder, { skipProcessing: true }),
     ]);
```

**Poznámka:** Dokumenty (živnosťák, OP) se NERESIZUJÍ a NEMAJÍ watermark — `skipProcessing: true`.

---

### 4.4 `app/api/onboarding/profile/route.ts` — přepojit (lines 5, 57)

```diff
-import { uploadToCloudinary } from "@/lib/cloudinary";
+import { uploadToServer } from "@/lib/upload";
 // ...
-        avatarUrl = await uploadToCloudinary(photo, `carmakler/avatars/${session.user.id}`);
+        avatarUrl = await uploadToServer(photo, `carmakler/avatars/${session.user.id}`);
```

**Poznámka:** Avatar NEMÁ watermark (defaultní `options` = undefined → žádný watermark). Sharp resize ano (zmenšení velkých fotek).

---

### 4.5 `app/api/contracts/[id]/pdf/route.ts` — přepojit (lines 215-217)

```diff
-      const { uploadToCloudinary } = await import("@/lib/cloudinary");
+      const { uploadToServer } = await import("@/lib/upload");
       const pdfFile = new File([pdfBuffer], `smlouva-${id}.pdf`, { type: "application/pdf" });
-      pdfUrl = await uploadToCloudinary(pdfFile, `carmakler/contracts/${id}`);
+      pdfUrl = await uploadToServer(pdfFile, `carmakler/contracts/${id}`, { skipProcessing: true });
```

---

### 4.6 `next.config.ts` — CSP + image domains (lines 30, 66-70)

**Změna 1 — CSP img-src (line 30):**
```diff
-  "img-src 'self' data: blob: https://res.cloudinary.com https://placehold.co https://*.sentry.io https://widget.packeta.com",
+  "img-src 'self' data: blob: https://files.carmakler.cz https://res.cloudinary.com https://placehold.co https://*.sentry.io https://widget.packeta.com",
```

**DŮLEŽITÉ:** `https://res.cloudinary.com` PONECHAT během přechodného období (staré fotky v DB).

**Změna 2 — Image remote patterns (lines 66-70):**
```diff
   images: {
     remotePatterns: [
+      {
+        protocol: "https",
+        hostname: "files.carmakler.cz",
+      },
       {
         protocol: "https",
         hostname: "res.cloudinary.com",
       },
```

**PONECHAT** `res.cloudinary.com` pattern dokud migrace starých fotek neproběhne.

---

### 4.7 `.env.example` — nové env vars (lines 30-33)

```diff
-# --- Cloudinary (obrazky) ---
-CLOUDINARY_CLOUD_NAME=
-CLOUDINARY_API_KEY=
-CLOUDINARY_API_SECRET=
+# --- Upload (obrazky) ---
+# Self-hosted upload na vlastní server
+UPLOAD_DIR=/var/www/uploads          # produkce: absolutní cesta na disku
+UPLOAD_BASE_URL=https://files.carmakler.cz  # produkce: veřejná URL
+# Dev: nechte prázdné → placehold.co fallback
+
+# --- Cloudinary (LEGACY — jen pro migraci starých fotek) ---
+# CLOUDINARY_CLOUD_NAME=
+# CLOUDINARY_API_KEY=
+# CLOUDINARY_API_SECRET=
```

---

### 4.8 `lib/cloudinary.ts` — PONECHAT (read-only, transition)

**NESMAZAT** `lib/cloudinary.ts` dokud migrace neproběhne. Důvody:
1. `getOptimizedUrl()` se může volat na staré Cloudinary URLs
2. `scripts/migrate-cloudinary.ts` může potřebovat referenci
3. Žádný import ho netahá do bundle pokud se nepoužívá

Po migraci smazat celý soubor + `scripts/upload-watermark.ts`.

---

## §5 Nginx konfigurace (produkční server)

### 5.1 DNS

Přidat A záznam:
```
files.carmakler.cz → 91.98.203.239
```

### 5.2 Nginx config `/etc/nginx/sites-available/files-carmakler`

```nginx
server {
    listen 80;
    server_name files.carmakler.cz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name files.carmakler.cz;

    # SSL certifikát (certbot auto-renew)
    ssl_certificate /etc/letsencrypt/live/files.carmakler.cz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/files.carmakler.cz/privkey.pem;

    root /var/www/uploads;

    # CORS pro carmakler.cz subdomény
    add_header Access-Control-Allow-Origin "https://carmakler.cz" always;
    add_header Access-Control-Allow-Origin "https://inzerce.carmakler.cz" always;
    add_header Access-Control-Allow-Origin "https://shop.carmakler.cz" always;

    location / {
        # Immutable cache: soubory mají unikátní hash v názvu
        expires 1y;
        add_header Cache-Control "public, immutable";

        # Ochrana proti directory listing
        autoindex off;

        # Jen GET/HEAD
        limit_except GET HEAD {
            deny all;
        }

        try_files $uri =404;
    }

    # Blokovat přístup mimo /carmakler/ prefix
    location = / {
        return 404;
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
}
```

### 5.3 Setup kroky na serveru

```bash
# 1. Vytvořit upload adresář
ssh server "mkdir -p /var/www/uploads/carmakler/{vehicles,listings,parts,damages,avatars,onboarding,contracts}"

# 2. Nastavit oprávnění (PM2 běží jako root)
ssh server "chown -R root:root /var/www/uploads && chmod -R 755 /var/www/uploads"

# 3. Nainstalovat sharp na serveru
ssh server "cd /var/www/carmakler && npm install sharp"

# 4. Přidat nginx config
# (zkopírovat config z §5.2)
ssh server "ln -s /etc/nginx/sites-available/files-carmakler /etc/nginx/sites-enabled/"

# 5. Certbot SSL
ssh server "certbot --nginx -d files.carmakler.cz"

# 6. Reload nginx
ssh server "nginx -t && systemctl reload nginx"

# 7. Přidat env vars do produkce
ssh server "cat >> /var/www/carmakler/.env.local << 'EOF'
UPLOAD_DIR=/var/www/uploads
UPLOAD_BASE_URL=https://files.carmakler.cz
EOF"

# 8. Deploy nový kód
ssh server "cd /var/www/carmakler && git pull origin main && npm run build && pm2 reload all"
```

---

## §6 Watermark přes Sharp

### 6.1 Přístup

Místo Cloudinary overlay transformation → **Sharp composite** s `logo-white.png`.

```
Originální foto (buffer)
    ↓
sharp(buffer)
  .resize({ width: 1920, withoutEnlargement: true })
  .composite([{
      input: watermarkBuffer,  // logo-white.png, resized na 15% šířky
      gravity: "southeast",
  }])
  .webp({ quality: 85 })
  .toBuffer()
    ↓
Výsledek: WebP s vodoznakem
```

### 6.2 Watermark processing detail

```typescript
// 1. Zjistit šířku obrázku
const metadata = await sharp(buffer).metadata();
const imgWidth = metadata.width || 1920;
const watermarkWidth = Math.round(imgWidth * 0.15); // 15% šířky

// 2. Připravit watermark s 40% opacity
const watermarkBuffer = await sharp("public/brand/logo-white.png")
  .resize({ width: watermarkWidth })
  .ensureAlpha()
  .composite([{
    input: Buffer.from([0, 0, 0, Math.round(255 * 0.4)]),
    raw: { width: 1, height: 1, channels: 4 },
    tile: true,
    blend: "dest-in",  // Multiply alpha → 40% opacity
  }])
  .toBuffer();

// 3. Composite na originál
const result = await sharp(buffer)
  .resize({ width: 1920, withoutEnlargement: true })
  .composite([{ input: watermarkBuffer, gravity: "southeast" }])
  .webp({ quality: 85 })
  .toBuffer();
```

### 6.3 Watermark parametry (stejné jako plan-watermark-photos.md)

| Parametr | Hodnota | Důvod |
|----------|---------|-------|
| Pozice | southeast (pravý dolní roh) | Konvenční, nepřekáží obsahu |
| Velikost | 15% šířky obrázku | Proporcionální, responsivní |
| Opacity | 40% | Viditelný ale nerušivý |
| Zdroj | `public/brand/logo-white.png` | Bílé logo, funguje na tmavých fotkách |

---

## §7 Migrace existujících fotek

### 7.1 Rozhodnutí

**Doporučení: Dual-mode přechodné období.**

1. **Nové fotky** → self-hosted (okamžitě po nasazení)
2. **Staré fotky** → Cloudinary URLs v DB zůstávají funkční
3. **Migrace** → separátní batch script (neblokuje deploy)

### 7.2 Proč NE smazat Cloudinary hned

- Cloudinary Free tier: 25 credits/měsíc, stávající fotky jsou "stored" (ne "transformations")
- URLs v DB jsou hardcoded — migrace musí projít KAŽDÝ záznam
- Nelze riskovat broken images na produkci
- `next/image` + CSP stále povoluje `res.cloudinary.com`

### 7.3 Migration timeline

```
Fáze 1 (tento deploy):
  ✅ Nové fotky → self-hosted
  ✅ Staré fotky → Cloudinary (nezměněno)
  ✅ next.config.ts povoluje oba zdroje

Fáze 2 (po stabilizaci, ~1 týden):
  ✅ Spustit migrate-cloudinary.ts
  ✅ Ověřit všechny URL přepsány

Fáze 3 (po ověření):
  ✅ Odebrat res.cloudinary.com z CSP + remotePatterns
  ✅ Smazat lib/cloudinary.ts
  ✅ Odebrat CLOUDINARY_* z .env.example
  ✅ Smazat Cloudinary account
```

---

## §8 Shrnutí všech změn

| # | Soubor | Akce | Effort |
|---|--------|------|--------|
| 1 | `lib/upload.ts` | NEW (~150 lines) | M |
| 2 | `app/api/uploads/[...path]/route.ts` | NEW (~30 lines, dev only) | XS |
| 3 | `scripts/migrate-cloudinary.ts` | NEW (~80 lines skeleton) | S |
| 4 | `app/api/upload/route.ts` | EDIT (import + upload call) | XS |
| 5 | `app/api/listings/[id]/images/route.ts` | EDIT (import + upload call) | XS |
| 6 | `app/api/onboarding/documents/route.ts` | EDIT (import + upload call) | XS |
| 7 | `app/api/onboarding/profile/route.ts` | EDIT (import + upload call) | XS |
| 8 | `app/api/contracts/[id]/pdf/route.ts` | EDIT (import + upload call) | XS |
| 9 | `next.config.ts` | EDIT (CSP + image domain) | XS |
| 10 | `.env.example` | EDIT (nové env vars) | XS |
| 11 | `package.json` | EDIT (`npm install sharp`) | XS |
| 12 | Nginx config (server) | NEW (manual setup) | S |
| 13 | `scripts/upload-watermark.ts` | DELETE (Cloudinary-specific) | XS |
| 14 | `lib/cloudinary.ts` | KEEP (transition) → DELETE later | - |

**Celkem: 3 new + 8 edit + 1 delete + 1 server config**

---

## §9 Implementační pořadí

1. **`npm install sharp`** — přidat dependency
2. **Vytvořit** `lib/upload.ts` — nový upload modul
3. **Vytvořit** `app/api/uploads/[...path]/route.ts` — dev serving
4. **Edit** 5 API routes — přepojit import z cloudinary → upload
5. **Edit** `next.config.ts` — přidat `files.carmakler.cz`
6. **Edit** `.env.example` — nové env vars
7. **Smazat** `scripts/upload-watermark.ts`
8. **Test lokálně** — upload fotky, ověřit WebP + watermark
9. **Server setup** — mkdir, nginx, certbot, env vars
10. **Deploy** — git pull, build, pm2 reload
11. **Test produkce** — nahrát fotku, ověřit `files.carmakler.cz` URL

---

## §10 Acceptance criteria

- [ ] `npm install sharp` — dependency přidána
- [ ] Nové fotky se ukládají na disk `/var/www/uploads/carmakler/...`
- [ ] URL nových fotek: `https://files.carmakler.cz/carmakler/...`
- [ ] Produktové fotky (vehicles, listings, parts, damages) mají watermark
- [ ] Dokumenty (invoices, contracts, onboarding) NEMAJÍ watermark
- [ ] Avatary NEMAJÍ watermark
- [ ] Obrázky jsou WebP, max 1920px šířka
- [ ] PDF/dokumenty se ukládají as-is (bez Sharp processing)
- [ ] Dev mode: placehold.co fallback funguje
- [ ] Staré Cloudinary URL v DB stále fungují (next/image, CSP)
- [ ] Nginx servíruje soubory s `Cache-Control: public, immutable`
- [ ] SSL certifikát na `files.carmakler.cz`
- [ ] TypeScript: 0 errors
- [ ] Build: passes
- [ ] E2E: upload testy procházejí (placehold.co dev fallback)

---

## §11 STOP kritéria

- **STOP-1:** `sharp` install selže na serveru (native dependency, binary mismatch) → ověřit `node -e "require('sharp')"` PO npm install. Pokud selže → `npm rebuild sharp` nebo `npm install --platform=linux --arch=x64 sharp`.
- **STOP-2:** Disk space na serveru < 10 GB volných → `df -h /var/www/uploads`. 32GB RAM server by měl mít dostatek disku, ale ověřit.
- **STOP-3:** `files.carmakler.cz` DNS propagace trvá > 24h → dočasně použít path-based: `https://carmakler.cz/uploads/...` s Nginx location proxy. Toto by byl fallback config.
- **STOP-4:** Certbot selže (rate limit, DNS challenge) → použít self-signed cert dočasně NEBO proxy přes hlavní carmakler.cz certifikát.
- **STOP-5:** Sharp watermark composite produkuje artefakty → zjednodušit pipeline (skip opacity multiply, použít plain composite bez alpha manipulation). Test s reálnou fotkou PŘED deploy.
- **STOP-6:** Migration script selže na specifickém Cloudinary URL formátu → logovat, přeskočit, opravit ručně. Migrace nesmí blokovat hlavní deploy.

---

## §12 Poznámky

### Proč WebP a ne JPEG
- WebP je ~30-50% menší při stejné kvalitě
- Podporován ve všech moderních prohlížečích (2025+: 97%+ coverage)
- Next.js `Image` component umí servírovat WebP automaticky, ale při self-hosted je lepší uložit rovnou jako WebP
- Sharp WebP encoder je rychlý (~50ms pro 1920px foto)

### Proč NE on-demand resize
- Cloudinary umí on-demand resize přes URL parametry
- Self-hosted: on-demand resize vyžaduje image proxy (imgproxy, thumbor) — zbytečná komplexita
- Lepší: resize + optimize AT UPLOAD TIME. Jedno rozlišení (1920px) stačí pro web i mobil
- Next.js `Image` component přidá client-side responsive sizing

### Sharp performance na 32GB server
- Resize 4000px → 1920px JPEG→WebP: ~80ms
- Watermark composite: ~30ms
- Celkem: ~110ms per photo (vs Cloudinary ~200-500ms RTT)
- Paralelně: Node.js zvládne 10-20 concurrent Sharp operations bez problémů

### Bezpečnost
- Nginx `limit_except GET HEAD { deny all; }` — žádný upload přímo přes Nginx
- Upload JEN přes Next.js API route (autentizace, validace)
- Filename = timestamp + hash — nepredikovatelný, bez user inputu
- Žádný directory listing (`autoindex off`)
