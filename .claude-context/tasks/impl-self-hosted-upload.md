# Implementace: Self-hosted upload (lib/upload.ts + API přepojení)

**Task:** #32
**Plan:** plan-self-hosted-upload.md
**Status:** HOTOVO
**Date:** 2026-04-12

---

## Změny

### Nové soubory (3)

| Soubor | Lines | Popis |
|--------|-------|-------|
| `lib/upload.ts` | ~130 | `uploadToServer()` — Sharp resize + watermark composite + WebP output. Dev fallback na placehold.co. |
| `app/api/uploads/[...path]/route.ts` | ~40 | DEV ONLY serving route pro lokální soubory. Produkce: Nginx. |
| `scripts/migrate-cloudinary.ts` | ~100 | Skeleton pro budoucí migraci starých Cloudinary fotek. |

### Přepojené API routes (5)

| Soubor | Změna |
|--------|-------|
| `app/api/upload/route.ts` | `uploadToCloudinary` → `uploadToServer`, přidán `skipProcessing` pro invoices/contracts |
| `app/api/listings/[id]/images/route.ts` | `uploadToCloudinary` → `uploadToServer`, watermark: true |
| `app/api/onboarding/documents/route.ts` | `uploadToCloudinary` → `uploadToServer`, skipProcessing: true |
| `app/api/onboarding/profile/route.ts` | `uploadToCloudinary` → `uploadToServer`, avatar bez watermarku |
| `app/api/contracts/[id]/pdf/route.ts` | Dynamic import `@/lib/cloudinary` → `@/lib/upload`, skipProcessing: true |

### Config změny (2)

| Soubor | Změna |
|--------|-------|
| `next.config.ts` | CSP img-src + remotePatterns: přidán `files.carmakler.cz` (Cloudinary ponechán pro transition) |
| `.env.example` | Nové `UPLOAD_DIR` + `UPLOAD_BASE_URL`, Cloudinary zakomentován jako LEGACY |

### Dependency (1)

| Package | Verze |
|---------|-------|
| `sharp` | přidán via `npm install sharp` |

### Smazáno (1)

| Soubor | Důvod |
|--------|-------|
| `scripts/upload-watermark.ts` | Cloudinary-specific, nahrazeno Sharp composite v lib/upload.ts |

### Ponecháno (1)

| Soubor | Důvod |
|--------|-------|
| `lib/cloudinary.ts` | Transition period — žádný import v app/, netahá se do bundle. Smazat po migraci. |

---

## Upload pipeline

```
File (FormData)
  ↓
uploadToServer(file, folder, options)
  ↓
  ├─ Dev mode (no UPLOAD_DIR) → placehold.co URL
  ├─ Image + !skipProcessing:
  │    sharp(buffer)
  │      .resize(1920, withoutEnlargement)
  │      .composite([watermark]) ← jen pokud options.watermark
  │      .webp(quality: 85)
  │      → disk: UPLOAD_DIR/folder/timestamp-hash.webp
  └─ PDF/docs (skipProcessing):
       → disk: UPLOAD_DIR/folder/timestamp-hash.ext (as-is)
  ↓
URL: UPLOAD_BASE_URL/folder/filename
```

## Watermark parametry

| Parametr | Hodnota |
|----------|---------|
| Zdroj | `public/brand/logo-white.png` |
| Pozice | southeast (pravý dolní roh) |
| Velikost | 15% šířky obrázku |
| Opacity | 40% (Sharp dest-in blend) |

## Preset mapping

| Preset | Watermark | skipProcessing | Output |
|--------|-----------|----------------|--------|
| vehicles | yes | no | WebP 1920px + watermark |
| listings | yes | no | WebP 1920px + watermark |
| parts | yes | no | WebP 1920px + watermark |
| damages | yes | no | WebP 1920px + watermark |
| invoices | no | yes | as-is (PDF) |
| contracts | no | yes | as-is (PDF) |
| avatars | no | no | WebP 1920px, bez watermarku |
| onboarding docs | no | yes | as-is (PDF/image) |

---

## Build

- `npm run build` — PASS
- TypeScript errors v implementaci: **0**
- (1 pre-existing TS error v e2e testu — nesouvisí)

---

## Serverový setup (nutný před deploy)

1. DNS: `files.carmakler.cz` → `91.98.203.239`
2. `mkdir -p /var/www/uploads/carmakler/{vehicles,listings,parts,damages,avatars,onboarding,contracts}`
3. Nginx config pro `files.carmakler.cz` (viz plán §5.2)
4. `certbot --nginx -d files.carmakler.cz`
5. `.env.local`: `UPLOAD_DIR=/var/www/uploads`, `UPLOAD_BASE_URL=https://files.carmakler.cz`
6. `npm install sharp` na serveru
7. `git pull && npm run build && pm2 reload all`
