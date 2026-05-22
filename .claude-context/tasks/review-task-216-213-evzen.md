# Review #216 — EVZEN shoda-check impl #213 C1-C3

**Reviewer:** evzen-the-king
**Datum:** 2026-04-11
**Scope:** Commity `31d894c` (C1 detail+PartCard+delete) + `2fa39f3` (C2 edit) — PWA Díly CRUD
**References:** plan-task-210-pwa-dily-100.md, impl-task-214-210.md, qa-task-215-213.md

---

## §0 — Verdict

### SCHVÁLENO — 0 blockerů, 3 minor observations

Impl C1-C3 plně pokrývá plan #210 scope: part detail page, PartCard link fix, edit page s wizard reuse, delete dialog. Všech 8 STOP rules dodrženo (0 diff v API/schema/deps/wizard steps). Build/lint/tsc clean. +603/-1 lines (pod 1000 limit). Acceptance criteria C1-C3 funkčně splněny.

**Pipeline GO → test-chrome → deploy.**

---

## §1 — Metodologie

6 EVZEN pravidel:

1. **Doslovnost** — čtu source byte-for-byte, ne jen impl/QA claims
2. **No assumptions** — nezávisle verifikuji git diff stat, changed files, STOP rules
3. **No soft hacks** — flagují chybějící diakritiku jako OBS
4. **Defense-in-depth** — cross-verifikuji plan acceptance criteria vs actual source
5. **Resistance to shortcuts** — ověřuji protected files (0 lines diff)
6. **Final verdict respect** — impl je READ-ONLY investigation target

---

## §2 — Check 1: Commit range a file scope

**Impl report claim:** 2 commity, 4 soubory, +603/-1.

**EVZEN nezávislá verifikace:**
```
$ git diff --stat 31d894c~1..2fa39f3
 app/(pwa-parts)/parts/[id]/edit/page.tsx        | 239 +++
 app/(pwa-parts)/parts/[id]/page.tsx             | 279 +++
 components/pwa-parts/parts/DeletePartDialog.tsx |  84 +++
 components/pwa-parts/parts/PartCard.tsx         |   2 +-
 4 files changed, 603 insertions(+), 1 deletion(-)
```

✅ **Exact match** — 4 files, +603/-1.

**Strukturální odchylka:** Plan specifikoval 3 commity (C1=detail+link, C2=edit, C3=delete). Impl dodal 2 (C1+C3 merged, C2). Důvod: detail page importuje DeletePartDialog — separace by nechala C1 s broken importem. **Odchylka zdokumentována a funkčně identická.** ✅

---

## §3 — Check 2: STOP rules compliance

**EVZEN verifikace (přímá):**
```
$ git diff 31d894c~1..2fa39f3 -- app/api/ prisma/ middleware.ts lib/auth.ts \
    package.json package-lock.json \
    components/pwa-parts/parts/PhotoStep.tsx \
    components/pwa-parts/parts/DetailsStep.tsx \
    components/pwa-parts/parts/PricingStep.tsx | wc -l
0
```

| STOP | Pravidlo | Verified | Status |
|------|---------|----------|--------|
| STOP-1 | NE edit API routes | 0 diff v `app/api/` | ✅ |
| STOP-2 | NE modify Prisma schema | 0 diff v `prisma/` | ✅ |
| STOP-3 | NE install npm packages | 0 diff v `package*.json` | ✅ |
| STOP-4 | NE refactor wizard steps | 0 diff v PhotoStep/DetailsStep/PricingStep | ✅ |
| STOP-5 | Verify JWT fields | N/A (C4 onboarding not in scope) | ✅ |
| STOP-6 | Compatibility reconstruction lossy | L68-80: `brands.map + shared yearFrom/yearTo` | ✅ |
| STOP-7 | Cloudinary = env issue | No fallback added | ✅ |
| STOP-8 | >8 files | 4 files | ✅ |

**Verdict check 2:** ✅ **PASS** — all 8 STOP rules honored.

---

## §4 — Check 3: Plan acceptance criteria C1

### PartCard link fix
```tsx
// PartCard.tsx:30
<Link href={`/parts/${id}`} className="block no-underline">
```
✅ Fixed from `href="/parts/my"` → `href={`/parts/${id}`}`.

### Detail page `/parts/[id]/page.tsx` (279 LOC)

| Criterion | Source location | Status |
|-----------|----------------|--------|
| Image carousel + dot nav | L132-161: `images[imageIndex]?.url`, dot buttons with `setImageIndex` | ✅ |
| Fallback 🔧 if no images | L157: `<span className="text-5xl text-gray-300">🔧</span>` | ✅ |
| Status/category/condition badges | L166-171: `Badge` with `statusConfig`, `categoryLabels`, `conditionLabels` | ✅ |
| Name + price + VAT | L176-180: `part.name`, `formatPrice(part.price)`, `s DPH / bez DPH` | ✅ |
| Description (conditional) | L184-188: `{part.description && ...}` | ✅ |
| Manufacturer + warranty block | L192-206: `{(part.manufacturer || part.warranty) && ...}` | ✅ |
| OEM number | L211-215: `{part.oemNumber && ...}` | ✅ |
| Stock + viewCount | L217-224: `part.stock ks`, `part.viewCount` | ✅ |
| Compatibility list | L228-244: JSON.parse brands/models + year range | ✅ |
| "Zpět" → `/parts/my` | L249: `href="/parts/my"` | ✅ |
| "Upravit" → `/parts/[id]/edit` | L254: `href={`/parts/${part.id}/edit`}` | ✅ |
| "Smazat" → opens dialog | L264: `onClick={() => setDeleteOpen(true)}` | ✅ |
| Loading skeleton | L97-106: 4 animated-pulse blocks | ✅ |
| Empty state | L108-121: "Dil nenalezen" + zpět button | ✅ |

**Verdict C1:** ✅ **PASS** — all plan criteria met.

---

## §5 — Check 4: Plan acceptance criteria C2

### Edit page `/parts/[id]/edit/page.tsx` (239 LOC)

| Criterion | Source location | Status |
|-----------|----------------|--------|
| Reuse PhotoStep | L211-215: `<PhotoStep photos={photos} onPhotosChange={setPhotos} onNext=.../>` | ✅ |
| Reuse DetailsStep | L218-223: `<DetailsStep details={details} onDetailsChange={setDetails} .../>` | ✅ |
| Reuse PricingStep | L226-234: `<PricingStep pricing={pricing} onPricingChange={setPricing} .../>` | ✅ |
| Reuse AddPartWizard | L209: `<AddPartWizard currentStep={step}>` | ✅ |
| Pre-fill photos from API | L62-65: `images.sort(order).map(img.url)` | ✅ |
| Pre-fill details | L82-92: name, category, condition, description, oemNumber, manufacturer | ✅ |
| Pre-fill pricing | L95-101: price, vatIncluded, stock→quantity, warranty | ✅ |
| Compatibility reconstruction | L68-80: `JSON.parse(compatibleBrands)` → `brands.map((brand, i) => ({brand, model: models[i], yearFrom, yearTo}))` | ✅ |
| PUT on save | L143-146: `fetch(`/api/parts/${id}`, { method: "PUT" })` | ✅ |
| Redirect after save | L150: `router.push(`/parts/${id}`)` | ✅ |
| Cancel link | L197: `<Link href={`/parts/${id}`}>Zrusit</Link>` | ✅ |
| Loading skeleton | L162-175: animated-pulse blocks | ✅ |
| Error state | L177-189: "Dil nenalezen" + zpět | ✅ |
| Inline error | L203-206: red error banner | ✅ |

**Compatibility data reconstruction per STOP-6:**
```tsx
// L68-80 — lossy year range shared across entries (documented, acceptable MVP)
const compatibility = brands.length > 0
  ? brands.map((brand, i) => ({
      brand,
      model: models[i] ?? "",
      yearFrom,  // shared
      yearTo,    // shared
    }))
  : [{ brand: "", model: "", yearFrom: "", yearTo: "" }];
```
✅ Matches plan §8 STOP-6 specification exactly.

**Verdict C2:** ✅ **PASS** — all plan criteria met.

---

## §6 — Check 5: Plan acceptance criteria C3

### DeletePartDialog (84 LOC)

| Criterion | Source location | Status |
|-----------|----------------|--------|
| Modal overlay | L39: `fixed inset-0 z-50` | ✅ |
| Backdrop click → close | L40: `onClick={onClose}` | ✅ |
| Warning icon | L43-46: trash SVG in red circle | ✅ |
| Part name in confirmation | L50: `<strong>&quot;{partName}&quot;</strong>` | ✅ |
| Descriptive text | L53: "Dil bude deaktivovan a nebude viditelny v katalogu." | ✅ |
| DELETE API call | L24: `fetch(`/api/parts/${partId}`, { method: "DELETE" })` | ✅ |
| onDeleted callback | L26: `onDeleted()` after `res.ok` | ✅ |
| Loading state | L77: `{deleting ? "Mazu..." : "Smazat"}` + disabled | ✅ |
| Error handling | L29: `setError(data.error || "Smazani se nezdarilo")` | ✅ |
| Redirect after delete | detail page L275: `onDeleted={() => router.push("/parts/my")}` | ✅ |

**Props interface matches plan §3 C3 spec:**
```tsx
interface DeletePartDialogProps {
  partId: string;
  partName: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}
```
✅ Exact match with plan specification.

**Verdict C3:** ✅ **PASS** — all plan criteria met.

---

## §7 — Check 6: Protected files and build hygiene

**Protected files (0 diff):** API routes, schema, middleware, auth, package files, wizard steps — all untouched. ✅

**Build hygiene (from impl report, corroborated by QA):**
- `npx tsc --noEmit` → 0 errors ✅
- `npm run lint` → 0 errors (554 warnings, -1 from baseline) ✅
- `npm run build` → EXIT=0 (24.7s compile) ✅

**C5 loading/error files:** NOT in scope for C1-C3 (plan C5 is separate commit). New pages have inline client-side loading skeletons and error states. Route-level `loading.tsx`/`error.tsx` files NOT yet created — confirmed: `glob app/(pwa-parts)/parts/[id]/**/loading.tsx` → no files found. Per plan scope this is expected. ✅

---

## §8 — Observations (non-blockers)

| # | Severity | Popis |
|---|----------|-------|
| **OBS-1** | Observation | **Ownership check v UI chybí.** Detail page zobrazuje "Upravit" + "Smazat" tlačítka VŠEM uživatelům s PARTS_SUPPLIER rolí, nejen vlastníkovi dílu. GET `/api/parts/[id]` nemá ownership check (QA OBS-1 totéž). **Mitigace:** PUT a DELETE API endpointy ownership OVĚŘUJÍ (`supplierId !== session.user.id → 403`). Kliknutí na "Smazat" cizího dílu → API vrátí 403 → dialog zobrazí chybu. Funkčně bezpečné, ale UX suboptimální (tlačítka by neměla být viditelná). Data nejsou tajná — dostupná v public katalogu `/dily/[slug]`. **Non-blocker.** |
| **OBS-2** | Observation | **Chybějící diakritika v českých UI textech.** Nové soubory systematicky nepoužívají háčky/čárky: "Aktivni" místo "Aktivní", "Vyrobce" místo "Výrobce", "Zaruka" místo "Záruka", "Prevodovka" místo "Převodovka", "Dil nenalezen" místo "Díl nenalezen", "Smazani se nezdarilo" místo "Smazání se nezdařilo", atd. Porovnání s existujícím web detail page (`app/(web)/dily/[slug]/page.tsx:240,248`) který používá správné "Výrobce" a "Záruka". CLAUDE.md říká "Vše v češtině (UI texty, komentáře)." Konzistence narušena. **Non-blocker** — kosmetický issue, fixovatelný v C5 polish commitu nebo follow-up. |
| **OBS-3** | Observation | **2 commity místo 3** (C1+C3 sloučeny). Zdokumentovaná odchylka — DeletePartDialog je importován v detail page, separace by vytvořila broken import v C1. Funkčně identické. **Non-blocker.** |

---

## §9 — Cross-reference s předchozími reviews

| Review | Relevance | Konzistence |
|--------|-----------|-------------|
| #212 (plan #210 SCHVÁLENO) | Plan scope C1-C3 verified | ✅ Impl matches plan exactly |
| #207 (deploy #206) | Production has manufacturer/warranty migration | ✅ Detail page renders these fields (L192-206) |
| #195/#201 (impl #184/#199) | PartCard existed, login redirect fixed | ✅ PartCard link now fixed (L30) |

---

## §10 — Final verdict

### SCHVÁLENO

Impl C1-C3 je:

- **Complete** — part detail (279 LOC), edit page (239 LOC), DeletePartDialog (84 LOC), PartCard fix (1 line) — all plan deliverables present
- **Correct** — all plan acceptance criteria C1/C2/C3 verified against source byte-for-byte
- **Safe** — 8/8 STOP rules honored, 0 lines diff in protected files
- **Clean** — tsc 0 errors, lint 0 errors, build EXIT=0
- **Bounded** — +603/-1 lines (under 1000 limit), 4 files (under 8 limit)

**0 blockerů. 3 minor non-blocker observations (ownership UI, diacritics, commit merge).**

**Pipeline GO → test-chrome → deploy.**
