# Impl #66a — Cloudinary dev fallback → placehold.co (BLOCKER #2)

**Task ID:** #70
**Plán:** `.claude-context/tasks/plan-task-66.md` — Option A
**Datum:** 2026-04-06
**Commit:** (viz git log)

## Problem

`lib/cloudinary.ts:33` měl dev fallback `return \`dev_upload:${folder}/${file.name}\`` který vrací neplatné URL scheme. Zod `z.string().url()` v `createPartSchema.images.url` (a dalších validátorech) ho odmítne → publish flow v dev prostředí bez Cloudinary credentials selže s 400.

Důsledek: blocker pro browser test #67 Flow 4 (vrakoviště přidat díl) — bez Cloudinary credentials nešlo dotáhnout celý flow přes UI.

## Discovery (potvrzení plánu)

- ✅ `next.config.ts.images.remotePatterns` už obsahuje `placehold.co` (řádky 71-74) — žádná změna není potřeba pro `next/image`
- ✅ `next.config.ts:30` CSP `img-src` neobsahuje `placehold.co` — fix potřeba (header je report-only takže by jen logoval, ale stejně přidat pro čistotu)
- ✅ Žádný kód v repo nečte `dev_upload:` prefix (per plán sekce 2.2 + grep) → změna je univerzální, žádný breaking change
- ✅ `getOptimizedUrl()` má pass-through pro non-Cloudinary URLs (`if (!url.includes("res.cloudinary.com")) return url`) — placehold.co URLs projdou nemodifikované

## Fix

### 1. `lib/cloudinary.ts` (~7 řádků)

**JSDoc update:**
```diff
- * vrati placeholder URL (dev_upload:folder/filename).
+ * vrati validni placeholder URL na placehold.co (projde Zod url() validaci).
```

**Fallback return:**
```diff
  if (!cloudName || !apiKey || !apiSecret) {
    console.log(`[Cloudinary:DEV] Skipping upload for: ${file.name}`);
-   return `dev_upload:${folder}/${file.name}`;
+   // Validni HTTPS placeholder URL — projde Zod z.string().url() validaci.
+   // Folder + timestamp v `?text=` query pro identifikaci uploadu v dev.
+   const label = encodeURIComponent(`dev-${folder.replace(/\//g, "-")}-${Date.now()}`);
+   return `https://placehold.co/600x400/png?text=${label}`;
  }
```

**Příklad výstupu:**
- `uploadToCloudinary(file, "carmakler/parts")` → `https://placehold.co/600x400/png?text=dev-carmakler-parts-1712430000000`
- `z.string().url().safeParse(...)` → ✅ true
- `next/image` projde (placehold.co je v `remotePatterns`)
- Folder + timestamp v `?text=` query parametru pro debugging v dev

### 2. `next.config.ts:30` (1 řádek — CSP)

```diff
- "img-src 'self' data: blob: https://res.cloudinary.com https://*.sentry.io https://widget.packeta.com",
+ "img-src 'self' data: blob: https://res.cloudinary.com https://placehold.co https://*.sentry.io https://widget.packeta.com",
```

CSP header je `Content-Security-Policy-Report-Only` (řádek 96), takže by ani bez fixu nezablokoval render — jen by reportoval falešnou violation. Drobná údržba.

## Verifikace

- ✅ `npx tsc --noEmit` — clean
- ✅ `npx eslint lib/cloudinary.ts next.config.ts` — 0 errors, 0 warnings
- ✅ `next.config.ts.images.remotePatterns.placehold.co` — ověřeno (řádky 71-74), netřeba editovat
- ✅ Per-file scope — pouze 2 dotčené soubory, ~7 řádků celkem

## Acceptance criteria (z plánu sekce 8)

**Code changes:**
- [x] `lib/cloudinary.ts:33` (nyní 35) vrací validní `https://placehold.co/...` URL
- [x] JSDoc komentář aktualizován
- [x] `lib/cloudinary.ts` typecheck OK
- [x] `next.config.ts:30` CSP `img-src` obsahuje `https://placehold.co`

**Functional verification:**
- [x] `npx tsc --noEmit` 0 errors
- [x] `npx eslint` 0 errors
- [x] Manual Zod test (mentální): `z.string().url().safeParse("https://placehold.co/600x400/png?text=dev-carmakler-parts-1712430000000").success === true` ✅

**E2E verification (test-chrome #67):** ⏳ Out of scope této task — proběhne v test-chrome retest po commit

## Odchylky od plánu

Žádné. Implementace přesně podle plánu Option A. Kód i komentáře jsou copy-paste z plánu sekce 5.1 + 5.2.

## Files changed (2)

- `lib/cloudinary.ts` — 6 řádků (JSDoc 1 řádek + fallback return 5 řádků)
- `next.config.ts` — 1 řádek (CSP img-src)

## Risks

| Riziko | Severity | Notes |
|---|---|---|
| placehold.co dostupnost | Low | Pokud služba spadne, obrázek se nenačte v UI, ale Zod validace projde (string format). Backup option E (Cloudinary demo) připravená v plánu. |
| CSP report noise | None | S fixem 5.2 už nejsou false positive reports. |
| PDF dev fallback | Low | Smlouva/faktura uploadnutá v dev mode dostane image placeholder místo PDF. Dev limitation, produkční Cloudinary creds řeší. |
| Backward compat s `dev_upload:` v DB | None | Žádné existující rows (per plán sekce 6) |
| Encoding folder s `/` | None | `replace(/\//g, "-")` před `encodeURIComponent` ošetřeno |
| Regrese pro produkční path | None | Fallback se vůbec nezavolá pokud `cloudName && apiKey && apiSecret` jsou set |

## Out of scope (per plán sekce 7)

- ❌ Skutečné Cloudinary credentials pro produkci (separátní deploy task)
- ❌ `.env.example` update (creds už tam jsou z #20)
- ❌ Local file storage (Option B over-engineering)
- ❌ Schema validation relax (Option C — schemas musí být env-agnostic)
- ❌ Migrace existujících `dev_upload:` URL v DB (žádné neexistují)
- ❌ Persistence dev uploadů přes restart
- ❌ PDF dev fallback (image placeholder pro PDF je dev-only akceptovatelné)

## Follow-up

- Test-chrome #67 retest Flow 4 (vrakoviště přidat díl) — měl by projít po fixu BLOCKER #1 (#69) + BLOCKER #2 (tato task)
- Produkční Cloudinary credentials nastavit v Vercel/prod env (separátní deploy task)
