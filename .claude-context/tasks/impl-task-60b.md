# Impl #60b — FIX PhotoStep Cloudinary upload pro vrakoviště (BUG #2)

**Task ID:** #62
**Plán:** `.claude-context/tasks/plan-task-60.md` sekce „BUG #2"
**Datum:** 2026-04-06
**Commit:** (viz git log)

## Problem

Vrakoviště add-part flow byl rozbitý ve dvou místech:

### 2a) `components/pwa-parts/parts/PhotoStep.tsx`
Použil `FileReader.readAsDataURL()` → ukládal `data:image/jpeg;base64,...` URLs do `photos: string[]`. Tyto URL by později neprošly Zod `z.string().url()` validací v `createPartSchema.images.url`.

### 2b) `app/(pwa-parts)/parts/new/page.tsx`
Druhý bug objevený při čtení: `handlePublish()` **vůbec neposílal** `images` field do `POST /api/parts`. Komentář v kódu („Photos would be uploaded via separate endpoint") naznačoval že to autor odložil. Bez fixu by díl byl vždy publikován bez fotek, i kdyby PhotoStep fungoval.

## Fix

### 1. `components/pwa-parts/parts/PhotoStep.tsx` (refactor)

**Před:**
```ts
const reader = new FileReader();
reader.onload = () => {
  if (typeof reader.result === "string") {
    newPhotos.push(reader.result);  // ❌ data: URL
    onPhotosChange([...newPhotos]);
  }
};
reader.readAsDataURL(file);
```

**Po:** async upload přes existující `/api/upload` endpoint:
```ts
const formData = new FormData();
formData.append("file", file);
formData.append("upload_preset", "parts");

const res = await fetch("/api/upload", { method: "POST", body: formData });
if (!res.ok) {
  const data = await res.json().catch(() => ({}));
  setError(data.error || "Nahrávání selhalo, zkuste to znovu");
  continue;
}
const { url } = await res.json();
uploadedUrls.push(url);  // ✅ Cloudinary https URL
```

**Změny v komponentě:**
- Nový state `uploading: boolean` — true během FormData uploadu
- `handleFileSelect` je nyní `async`, používá `await fetch` v `for...of` loopu (sekvenčně, aby chyby byly přehledné)
- Slot limit 10: `remainingSlots = 10 - photos.length`, pak `slice(0, remainingSlots)`
- Per-file MIME check (`!file.type.startsWith("image/")` → setError + continue)
- Per-file fail handling (4xx/5xx → setError z API response, continue na další)
- Network error handling (`catch` → generic „zkontrolujte připojení")
- `finally`: reset uploading + clear input value (aby šel re-select stejného souboru)
- Add-photo tlačítko: `disabled={uploading}` + spinner SVG + label „Nahrávám…"
- Pokračovat tlačítko: `disabled={photos.length === 0 || uploading}` + label „Nahrávám fotky…"

### 2. `app/(pwa-parts)/parts/new/page.tsx` (handlePublish — odstranění bonus chyby)

**Před:**
```ts
compatibleYearTo: validCompat[0]?.yearTo ? parseInt(...) : undefined,
// Photos would be uploaded via separate endpoint
};
```

**Po:**
```ts
compatibleYearTo: validCompat[0]?.yearTo ? parseInt(...) : undefined,
images: photos.map((url, i) => ({
  url,
  order: i,
  isPrimary: i === 0,
})),
};
```

Mapuje `photos: string[]` (Cloudinary URLs po refactoru #1) na shape vyžadovaný `createPartSchema.images` z `lib/validators/parts.ts`:
```ts
images: z.array(z.object({
  url: z.string().url(),
  order: z.number().int().min(0),
  isPrimary: z.boolean().default(false),
})).optional()
```

První fotka = `isPrimary: true`, ostatní `false`. Order odpovídá pořadí v poli (0-indexed).

## API contract poznámka

Task assignment popisoval `fetch('/api/upload?upload_preset=parts', ...)` (query string). Reálná implementace `/api/upload` ale očekává `upload_preset` jako **FormData field**, ne query parametr — viz `app/api/upload/route.ts:37`:
```ts
const preset = formData.get("upload_preset") as string | null;
```

Použil jsem správnou variantu (FormData field). Response shape je `{ url: string }` (wrapped, ne raw `secure_url` z Cloudinary) — viz `app/api/upload/route.ts:70`.

## Dev fallback caveat (out of scope)

`lib/cloudinary.ts:31-34` má dev fallback který vrací string `dev_upload:${folder}/${file.name}` když chybí Cloudinary env vars. Tento string **NENÍ validní URL** a Zod `z.string().url()` ho odmítne v `POST /api/parts`. Důsledek: v dev prostředí bez Cloudinary credentials publish stále selže s validation errorem.

Tohle není ve scope BUG #2 (bug byl o data URLs, ne o dev fallback). V produkci s Cloudinary env vars to funguje. Možný follow-up: změnit dev fallback na placeholder URL typu `https://placehold.co/600x400/png?text=...` který projde Zod validací.

## Verifikace

- ✅ `npx tsc --noEmit` — clean (žádné errors)
- ✅ `npx eslint components/pwa-parts/parts/PhotoStep.tsx app/(pwa-parts)/parts/new/page.tsx` — 1 pre-existing warning (`<img>` element, byl tam před změnami), 0 errors
- ✅ Per-file scope — pouze 2 dotčené soubory

## Acceptance criteria (z plánu BUG #2)

- [x] PhotoStep nepoužívá `FileReader.readAsDataURL`
- [x] PhotoStep používá `POST /api/upload` s `upload_preset: 'parts'`
- [x] Loading state (spinner) během uploadu
- [x] Error handling (per-file + network)
- [x] Po success uloží Cloudinary URL místo data URL
- [x] Preview <img> používá tu stejnou Cloudinary URL
- [x] tsc/lint clean
- [x] **Bonus:** `handlePublish()` posílá `images` array do API (jinak by fotky byly ztracené i po PhotoStep fixu)

## Odchylky od plánu

1. **Bonus fix v `page.tsx handlePublish()`** — task assignment se zaměřoval pouze na PhotoStep, ale při čtení `app/(pwa-parts)/parts/new/page.tsx` jsem objevil že `handlePublish()` vůbec neposílá `images` field (řádek 56 měl komentář „Photos would be uploaded via separate endpoint"). Bez tohoto fixu by se PhotoStep refactor nikam neprojevil — fotky by se uploadnuly ale published díl by je neměl. Proto fix obou souborů v jednom commit.

2. **API contract korekce** — task popisoval query string `?upload_preset=parts`, použil jsem FormData field per skutečnou implementaci `/api/upload`. Detail viz sekce „API contract poznámka".

3. **Sekvenční upload místo parallel** — použil jsem `for...of` loop s `await` (sekvenčně), ne `Promise.all`. Důvod: pokud uživatel vybere 5 fotek a 3 selžou, sekvenční upload jasně ukáže first error v UI. Parallel by byl rychlejší ale chyba handling by byl složitější (a max 10 fotek z mobilu, latence není kritická).

## Files changed (2)

- `components/pwa-parts/parts/PhotoStep.tsx` — ~50 řádků (handleFileSelect refactor, uploading state, spinner SVG, button disabled states)
- `app/(pwa-parts)/parts/new/page.tsx` — 5 řádků (images mapping v handlePublish body)

## Risks

| Riziko | Severity | Notes |
|---|---|---|
| Cloudinary config v dev | Medium | Dev fallback `dev_upload:` neprojde Zod url() validací → publish v dev bez Cloudinary stále selže. Možný follow-up. |
| Network failure during upload | Low | Error catch → user vidí message, může zkusit znovu. Input value se resetuje aby šel re-select. |
| User interrupts upload | Low | `uploading` lock disabluje navigation tlačítko, ale routing přes browser back funguje (žádný unload listener). Akceptováno. |
| Regresní risk pro existující data | None | Vrakoviště add-part flow byl rozbitý, žádný produkční data risk. |

## Follow-up (mimo scope)

- Dev placeholder URL fallback v `lib/cloudinary.ts` (aby Zod validace prošla i bez Cloudinary creds)
- Drag & drop reorder fotek v PhotoStep (UX nice-to-have)
- BUG #3 (#63) — `/registrace` rozcestník přidat dlaždici „Dodavatel dílů"
