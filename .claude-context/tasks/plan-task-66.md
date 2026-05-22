# Plán — Task #66: Cloudinary dev fallback fix (BLOCKER #2)

**Priorita:** HIGH (blocker pro browser test #67 — Flow 4 vrakoviště přidat díl)
**Typ:** Bugfix (1 řádek logiky + 1 řádek CSP + JSDoc)
**Zadal:** team-lead 2026-04-06 (z QA #64 BLOCKER #2)
**Návazný na:** task #60b (PhotoStep Cloudinary upload), QA #64

---

## 1. Cíl

Změnit dev fallback v `lib/cloudinary.ts:33` z neplatného `dev_upload:${folder}/${file.name}` na **validní HTTPS placeholder URL**, aby:
- Zod `z.string().url()` validace v `createPartSchema.images.url` projde ✅
- PhotoStep publish flow funguje v dev prostředí bez Cloudinary credentials ✅
- Browser test #67 Flow 4 (vrakoviště přidat díl) projde bez nastavení produkčních secretů ✅

## 2. Discovery — co jsem našel

### 2.1 Aktuální fallback v `lib/cloudinary.ts:31-34`
```ts
if (!cloudName || !apiKey || !apiSecret) {
  console.log(`[Cloudinary:DEV] Skipping upload for: ${file.name}`);
  return `dev_upload:${folder}/${file.name}`;
}
```

**Problém:** `dev_upload:carmakler/parts/foo.jpg` má neznámé URL scheme → `z.string().url()` v Zod ho odmítne. Test:
```ts
z.string().url().safeParse("dev_upload:carmakler/parts/foo.jpg").success
// → false
z.string().url().safeParse("https://placehold.co/600x400/png?text=foo").success
// → true
```

### 2.2 6 callerů `uploadToCloudinary` (potvrzeno grepem)
| # | Soubor | Použití | Co s URL dělá |
|---|--------|---------|---------------|
| 1 | `app/api/upload/route.ts:68` | Generic POST /api/upload (PhotoStep, listings UI) | Vrátí jako JSON `{ url }` → frontend ukládá v state |
| 2 | `app/api/listings/[id]/images/route.ts:76` | Inzerát fotky | Ukládá do `Listing.images[]` JSON |
| 3 | `app/api/onboarding/profile/route.ts:57` | Avatar makléře | Ukládá do `User.avatar` |
| 4 | `app/api/onboarding/documents/route.ts:65-67` | Trade license + IDs | Ukládá do User documents |
| 5 | `app/api/contracts/[id]/pdf/route.ts:217` | Smlouva PDF | Ukládá do `Contract.pdfUrl` |
| 6 | (`getOptimizedUrl()` interní helper) | Transform existující URL | Pokud `!url.includes("res.cloudinary.com")` → pass-through ✅ |

**Klíčový nález:** **Žádný** kód v aplikaci NEPARSUJE/NEDETEKUJE `dev_upload:` prefix (ověřeno `Grep "dev_upload"` → 0 matchů v `*.{ts,tsx}` mimo `lib/cloudinary.ts:33`). Všichni callers jen ukládají URL do DB jako string. Žádný `if (url.startsWith("dev_upload:"))` handler.

→ Změna fallback formátu se propaguje **bez breaking changes** pro všech 6 callerů.

### 2.3 Zod validace na receiving end
- **`createPartSchema.images.url: z.string().url()`** v `lib/validators/parts.ts:33` — STRICT URL validation ✅
- Listing schema (TODO ověřit) — pravděpodobně stejný pattern
- Onboarding profile/documents — TODO ověřit, pravděpodobně přijímají URL string z předchozího upload kroku

→ Všechny endpointy které ukládají URL do DB chtějí validní URL. Fix je univerzální.

### 2.4 `next.config.ts` allowed image hosts
```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "res.cloudinary.com" },
    { protocol: "https", hostname: "placehold.co" },     // ✅ UŽ TAM JE
    { protocol: "https", hostname: "images.unsplash.com" },
  ],
}
```

→ **`placehold.co` je už whitelistován** pro `next/image` component. Žádná změna `next.config.ts` (kromě CSP — viz 2.5).

### 2.5 CSP `img-src` directive
```ts
"img-src 'self' data: blob: https://res.cloudinary.com https://*.sentry.io https://widget.packeta.com"
```

**Chybí:** `https://placehold.co`. Pokud použijeme placehold.co, browser logne CSP report-only warning (header je `Content-Security-Policy-Report-Only`, takže nezablokuje render — jen reportne). Pro čistotu doporučuji přidat.

### 2.6 `placehold.co` charakteristika
- Stable, dlouhodobě maintained service
- Vrací PNG/SVG/JPG dle path: `https://placehold.co/{w}x{h}/{format}?text={label}`
- Žádný API key, žádné rate limity pro běžné použití
- Image content-type ✅

## 3. Volba option — proč Option A

| Option | Popis | Pros | Cons | Verdict |
|--------|-------|------|------|---------|
| **A — placehold.co URL** | `https://placehold.co/600x400/png?text=dev-{folder}-{ts}` | Validní URL, už v `remotePatterns`, stable, zero deps | External service (běží nad CDN, dostupnost OK) | ✅ **DOPORUČENO** |
| B — Local mock storage | `http://localhost:3000/uploads/{file}` + serving endpoint | Plně offline, persistent | Vyžaduje nový API endpoint, file system writes, cleanup logic, SSR adresy nejsou přenositelné | ❌ Over-engineering |
| C — Relax Zod v dev | `z.string().url().or(z.string().startsWith("dev_upload:"))` | Žádná změna URL formátu | **Schema musí být env-agnostic** (team-lead explicit). Production by měla stejnou validaci. | ❌ Schválen ne |
| D — Data: URL | `data:image/png;base64,iVBORw0KG...` | Self-contained, žádný external | Bloated DB rows, Zod `.url()` v některých verzích odmítne `data:` schema, CSP `img-src` má `data:` ale ne všechny image components ho akceptují | ❌ Schválen ne |
| E — Cloudinary demo | `https://res.cloudinary.com/demo/image/upload/sample.jpg` | Realistický, už v CSP + remotePatterns | `demo` account není garantovaný stable, nelze diferencovat různé uploady (vždy stejný `sample.jpg`) | 🟡 Backup |
| F — Picsum | `https://picsum.photos/600/400?random=ts` | Real image content | Není v `remotePatterns` ani CSP, vyžaduje 2 dodatečné edits | 🟡 Možné, ale víc edit |

**→ Option A** vybráno protože:
1. Team-lead explicitly doporučil v zadání
2. `placehold.co` je už v `next.config.ts.images.remotePatterns` ✅
3. CSP edit je 1 řádek (drobná údržba pro report-only)
4. Diferencovatelný přes `?text=` query parametr (vidíš identifikaci uploadu v dev)
5. Stable, zero deps, žádný API key

## 4. Dotčené soubory

| # | Soubor | Akce | Řádky | Riziko |
|---|--------|------|-------|--------|
| 1 | `lib/cloudinary.ts` | Edit fallback return + JSDoc komentář | ~6 řádků | nízké |
| 2 | `next.config.ts` | Edit CSP `img-src` directive | 1 řádek | nízké (jen report-only header) |

**Žádné** změny v API routes, validátorech, schématech Prisma, frontend komponentách, env files.

## 5. Detailní změny

### 5.1 `lib/cloudinary.ts` — fallback fix

**File:** `lib/cloudinary.ts`

**JSDoc update (řádky 1-7):**
```diff
  /**
   * Cloudinary upload pres REST API.
   * Pouziva primo fetch + SHA-1 podpis — NEPOUZIVA npm package `cloudinary`.
   *
   * Podporuje dev mode: pokud env promenne nejsou nastavene,
-  * vrati placeholder URL (dev_upload:folder/filename).
+  * vrati validni placeholder URL na placehold.co (validuje Zod url()).
   */
```

**Fallback return (řádky 30-34):**
```diff
  // Dev mode — Cloudinary neni nakonfigurovano
  if (!cloudName || !apiKey || !apiSecret) {
    console.log(`[Cloudinary:DEV] Skipping upload for: ${file.name}`);
-   return `dev_upload:${folder}/${file.name}`;
+   // Validni HTTPS placeholder URL — projde Zod z.string().url() validaci.
+   // Folder + timestamp v `?text=` query pro identifikaci uploadu v dev.
+   const label = encodeURIComponent(`dev-${folder.replace(/\//g, "-")}-${Date.now()}`);
+   return `https://placehold.co/600x400/png?text=${label}`;
  }
```

**Expected output:**
- `uploadToCloudinary(file, "carmakler/parts")` → `https://placehold.co/600x400/png?text=dev-carmakler-parts-1712430000000`
- Validní URL ✅
- Folder + timestamp viditelný v `?text=` ✅
- `next/image` projde (placehold.co je v remotePatterns) ✅

### 5.2 `next.config.ts` — CSP img-src

**File:** `next.config.ts:30`

```diff
- "img-src 'self' data: blob: https://res.cloudinary.com https://*.sentry.io https://widget.packeta.com",
+ "img-src 'self' data: blob: https://res.cloudinary.com https://placehold.co https://*.sentry.io https://widget.packeta.com",
```

**Pozn.:** CSP header je `Content-Security-Policy-Report-Only` (řádek 96), takže by nezablokoval render i bez tohoto fixu. Přidání je drobná údržba aby se nereportovala falešná violation.

## 6. Edge cases

| Scenario | Handling |
|----------|----------|
| Upload PDF (smlouva, faktura) | Vrátí placehold.co URL místo PDF. **Dev limitation** — PDF preview v admin UI bude zobrazovat placeholder image. Akceptovatelné — produkční env má credentials. |
| Upload v produkci (Cloudinary creds set) | Fallback se vůbec nezavolá — řeší skutečný Cloudinary upload. Žádný dopad. |
| File name s diakritiku/emoji | `encodeURIComponent` na label (`folder-timestamp`) — bezpečné. |
| Concurrent uploads | Každý dostane unikátní timestamp v `?text=`. URL se neopakují. |
| Test prostředí (CI) bez internetu | placehold.co dostupnost — pokud CI běží offline, request na placehold.co může selhat. **Mitigation:** validace probíhá jen Zod schemou (string format), žádný HEAD request → URL string sám projde i bez načtení obrázku. |
| `next/image` width/height props | placehold.co `600x400` = standardní image dimensions. Pokud component vyžaduje jiné rozměry, Next.js Image component je transformuje normálně. |
| Existující rows v DB s `dev_upload:...` URL | Žádné — DB má zatím jen produkční data nebo `res.cloudinary.com` URL z předchozích testů. Neexistují rows k migraci. (Pokud by existovaly, zůstaly by neplatné, ale to by byl vedlejší cleanup.) |

## 7. Out of scope

- ❌ **Skutečné Cloudinary credentials pro produkci** — separátní deploy task (nastavit `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` v Vercel/prod env). Není v code repo.
- ❌ **`.env.example` update** — credentials už tam jsou (z task #20).
- ❌ **Local file storage** (Option B) — over-engineering pro dev only flow.
- ❌ **Schema validation relax** (Option C) — schemas musí být env-agnostic (team-lead explicit).
- ❌ **Migrace existujících `dev_upload:...` URL v DB** — žádné neexistují (v dev env se DB resetuje seedem).
- ❌ **Persistence dev uploadů přes restart** — v dev mode se obrázky nemají skutečně ukládat. Placeholder má za úkol jen projít validační pipeline.
- ❌ **Modifikovat `getOptimizedUrl()`** — pass-through funguje (`!url.includes("res.cloudinary.com")` → return url).
- ❌ **Nový PDF dev fallback** — placehold.co URL stačí pro všechny scénáře (Zod ani PDF parsing nevolá obsah URL).

## 8. Acceptance criteria

**Code changes:**
- [ ] `lib/cloudinary.ts:33` vrací validní `https://placehold.co/...` URL
- [ ] JSDoc komentář aktualizován (řádky 5-7)
- [ ] `lib/cloudinary.ts` build/typecheck OK
- [ ] `next.config.ts:30` CSP `img-src` obsahuje `https://placehold.co`

**Functional verification:**
- [ ] `npm run build` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm test` → 141/141 (žádný test nečte `dev_upload:` prefix — ověřeno grepem)
- [ ] Manual test: `POST /api/upload?upload_preset=parts` s test image bez Cloudinary creds → response `{ url: "https://placehold.co/600x400/png?text=dev-carmakler-parts-..." }`
- [ ] Validace: `z.string().url().safeParse(returnedUrl).success === true`

**E2E verification (test-chrome #67):**
- [ ] PhotoStep upload v PartWizardu vrátí validní URL
- [ ] handlePublish v PartWizardu projde Zod validací (`createPartSchema.images.url`)
- [ ] `POST /api/parts` vrátí 201 (ne 400)
- [ ] Díl se uloží do DB s `images: [{ url: "https://placehold.co/...", ... }]`
- [ ] Díl se zobrazí v `/parts/my` s placeholder obrázkem
- [ ] Díl se zobrazí v `/dily` katalogu s placeholder obrázkem (pro buyers)

## 9. Risks

1. **placehold.co dostupnost** — pokud služba spadne, placeholder image se nenačte v UI. Validační pipeline ale projde (Zod validuje string format, ne HTTP fetch). **Severity:** LOW. Mitigation: backup option E (Cloudinary demo) připravená.
2. **CSP report noise** — bez fix 5.2 by report-only header logoval `placehold.co` jako violation. Neprodukční dopad. **Severity:** TRIVIAL. Mitigation: zahrnuto v plánu.
3. **PDF dev fallback** — v dev mode admin smluv vidí image místo PDF. **Severity:** LOW (dev limitation). Mitigation: produkční Cloudinary credentials řeší.
4. **Backward compat s existujícími `dev_upload:...` rows** — žádné neexistují. **Severity:** N/A.
5. **`encodeURIComponent` výstup** — pokud folder obsahuje znaky `/`, `:`, `&`, mohlo by to ovlivnit query parsing. Mitigation: replace `/` na `-` před encode (zahrnuto v 5.1).

## 10. Open questions pro team-leada

1. **Backup option pokud placehold.co nedostupný** — chceš v plánu fallback chain (placehold.co → Cloudinary demo)?
   - Default: NE (over-engineering, jeden URL stačí)
2. **PDF dev fallback** — vyřešit zvlášť (image placeholder pro PDF je dev-only akceptovatelné)?
   - Default: ANO, dev limitation OK
3. **`dev` v fallback URL identifikuje že to není reálný Cloudinary upload** — chceš jiný marker (např. log warning při použití fallback v produkci)?
   - Default: dostatečné je `console.log("[Cloudinary:DEV] Skipping upload")` (už existuje)

## 11. Velikost a status

- **Změny:** 2 soubory, ~7 řádků kódu (5 v cloudinary.ts + 1 v next.config.ts + 1 řádek JSDoc komentáře)
- **Rizikovost:** minimální (dev fallback only, žádný produkční path)
- **Testování:** build + lint + tests + manual /api/upload smoke
- **Souběžnost:** Může běžet paralelně s #65 (oba jsou disjunktní oblasti)
- **Status plánu:** ready k dispatch na implementátora

---

## Poznámka pro team-leada

**Klíčové insight:** Žádný kód v aplikaci nečte `dev_upload:` prefix — všichni callers ho jen ukládají do DB. Změna formátu fallbacku se propaguje univerzálně, žádný breaking change.

**`next.config.ts` má `placehold.co` UŽ v `images.remotePatterns`** — předchozí kód s ním evidentně počítal. CSP edit je drobná údržba (header je report-only).

Doporučuju **Variantu A** přesně jak jsi zadal v task #66. Žádný over-engineering.

Po implementaci je třeba retest #67 (test-chrome) Flow 4 vrakoviště přidat díl — měl by projít.
