# QA Report — Task #64: Fixy #60a/b/c + verification flow code review

**Datum:** 2026-04-06  
**Agent:** KONTROLOR  
**Commits:** `a79376c` (#60a), `ab49593` (#60b), `f852aa9` (#60c)

---

## FÁZE 1 — Build / Lint / Test

### Build
```
npm run build
✓ Compiled successfully in 44s
✓ Generating static pages (312/312)
```
**✅ BUILD PASSED — 312 routes**

### Lint
```
npm run lint
✖ 537 problems (0 errors, 537 warnings)
```
**✅ LINT PASSED — 0 errors (537 warnings jsou pre-existing)**

### Tests (vitest)
```
npx vitest run
Test Files: 15 passed (15)
Tests:      141 passed (141)
Duration:   566ms
```
**✅ VŠECHNY TESTY ZELENÉ — 141/141**

---

## FÁZE 2 — Code review fixů

### #60a — `middleware.ts:15` PARTS_SUPPLIER_ROLES (commit `a79376c`)

```typescript
const PARTS_SUPPLIER_ROLES = ["PARTS_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"];
```
**✅ Fix správně implementován.**

**Audit konzistence API routes vs. middleware:**

| Endpoint | Role check | Konzistentní? |
|----------|-----------|--------------|
| `POST /api/parts` (route.ts:21) | `["PARTS_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"]` | ✅ |
| `POST /api/parts/import` (route.ts:59) | `["PARTS_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"]` | ✅ |
| `PUT/DELETE /api/parts/[id]` | auth + `supplierId === user.id || isAdmin` (žádný role whitelist) | ✅ (middleware gate dostatečný) |
| `GET /api/parts/supplier-stats` | auth + `supplierId === user.id` (žádný role whitelist) | ✅ (middleware gate) |

**Závěr:** Všechny `/parts/*` API routes jsou konzistentní — buď mají explicitní role whitelist shodný s middleware, nebo používají resource-owner check (supplierId). Žádná nekonzistence.

---

### #60b — `PhotoStep.tsx` + `parts/new/page.tsx` (commit `ab49593`)

**PhotoStep.tsx:**
- `fetch("/api/upload", { method: "POST", body: formData })` ✅
- Error handling: `if (!res.ok) { setError(data.error || "...") }` ✅
- Loading state: `setUploading(true/false)` + disabled button + spinner ✅
- `const { url } = await res.json()` — ukládá URL z response ✅
- `typeof url === "string"` guard před push ✅

**`api/upload/route.ts`** volá `uploadToCloudinary()` a vrací `{ url }` s HTTP 201.

**⚠️ BLOCKER — Cloudinary creds chybí v `.env`:**
```
grep CLOUDINARY .env → 0 matches (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET nenalezeny)
```

Dopad:
1. `uploadToCloudinary()` → dev fallback: `return "dev_upload:carmakler/parts/{filename}"`
2. `api/upload` vrací `{ url: "dev_upload:..." }` s HTTP 201 (PhotoStep nevidí chybu)
3. PhotoStep ukládá `dev_upload:...` URL do `photos[]` state
4. `handlePublish` posílá `images: [{ url: "dev_upload:...", order: 0, isPrimary: true }]`
5. **`createPartSchema.images.url: z.string().url()` odmítne `dev_upload:...`** → 400
6. `handlePublish` catch blok: "// Fallback demo mode" → `router.push("/parts/my")` (tiché selhání)
7. **Díl se neuloží — uživatel dostane redirect bez error hlášky**

**Pozitivní nález:** Dev fallback vrací `dev_upload:...` (NE `data:image/...`), takže žádný base64 data: URL není ukládán. ✅

**Verdict:** PhotoStep kód je správný — chyba je v chybějících Cloudinary credentials. Browser test by failnul při pokusu o zveřejnění dílu.

**`parts/new/page.tsx`:**
- 3-step wizard: PhotoStep → DetailsStep → PricingStep ✅
- `handlePublish` posílá `images: photos.map(...)` ✅
- Fallback redirect (tiché selhání při API error) — UX issue, ale mimo scope tohoto fixi

---

### #60c — `registrace/page.tsx` tile "Dodavatel dílů" (commit `f852aa9`)

```tsx
<Link href="/registrace/dodavatel" className="group block rounded-2xl border ...">
  <div className="flex items-start gap-4">
    <div className="flex h-11 w-11 ... bg-orange-100 text-orange-600">
      <svg>...</svg>  {/* wrench icon */}
    </div>
    <div>
      <h3>Dodavatel dílů (vrakoviště)</h3>
      <p>Prodáváte použité díly... Registrujte se jako dodavatel...</p>
    </div>
    <svg>...</svg>  {/* chevron icon */}
  </div>
</Link>
```

- Link na `/registrace/dodavatel` ✅
- Heading "Dodavatel dílů (vrakoviště)" ✅
- Popis role + popis PWA ✅
- Vizuální konzistence s ostatními tiles (orange icon, card border, chevron, group hover) ✅
- Nadpis sekce "Jiný typ účtu" ✅

**✅ #60c PASS**

---

## FÁZE 3 — Statická review 4 verification flows

### Flow 1: Makléř registrace + login + redirect do PWA

| Krok | Implementace | Stav |
|------|-------------|------|
| Broker registrace | Invite-only: `/api/auth/register/broker` + invitation token required | ✅ (by design) |
| Status po registraci | `status: "ONBOARDING"` | ✅ |
| Login | lib/auth.ts: allows ACTIVE + **ONBOARDING** → ✅ | ✅ |
| PWA redirect | login/page.tsx: `case "BROKER" → router.push("/makler/dashboard")` | ✅ |
| Middleware | `/makler/*` protected, BROKER role má přístup | ✅ |
| Onboarding flow | `/makler/onboarding` dostupné pro ONBOARDING status | ✅ |

**✅ Flow 1 COMPLETE** — Invite-based registrace je záměrná (ne self-service). Po pozvance: register → ONBOARDING → login → /makler/dashboard.

---

### Flow 2: Vrakoviště (PARTNER_VRAKOVISTE) registrace

| Krok | Implementace | Stav |
|------|-------------|------|
| Registrace stránka | `/registrace/dodavatel` → DodavatelRegistracePage | ✅ |
| API endpoint | `POST /api/auth/register/partner` | ✅ |
| Vytvoření user + partner | Prisma `$transaction` | ✅ |
| User status | `status: "PENDING"` (řádek 94 v route.ts) | ⚠️ |
| Email verifikace | `sendVerificationEmail()` voláno | ✅ |
| Login PENDING uživatele | `lib/auth.ts:23` blokuje PENDING → `return null` | ❌ |
| Admin aktivace | `/api/admin/brokers/[id]/activate` — **vyžaduje `role === "BROKER"`**, vrací 400 pro jiné role | ❌ |
| Admin UI pro partnery | `admin/partners` — správa Partner záznamů (CRM), **NE User.status aktivace** | ❌ |

**⚠️ BLOCKER: PARTNER_VRAKOVISTE nemůže nikdy přistoupit k PWA parts.**

Registrace proběhne, ale uživatel se nemůže přihlásit (status=PENDING). V celém admin panelu neexistuje žádný mechanismus pro změnu `User.status: "PENDING" → "ACTIVE"` pro PARTNER_VRAKOVISTE role:
- `admin/brokers/[id]/activate` → explicitní guard `broker.role !== "BROKER"` → vrací 400
- Žádný `admin/partners/[id]/activate` endpoint
- Admin partners stránka spravuje `Partner` model (CRM pipeline), NE `User.status`

**Nutná akce:** Vytvořit `PUT /api/admin/partners/[id]/activate` endpoint + UI tlačítko v admin/partners/[id] stránce.

---

### Flow 3: Inzerce vytvořit inzerát (6-step wizard)

| Krok | Implementace | Stav |
|------|-------------|------|
| Stránka | `/inzerce/pridat` → `<ListingFormWizard />` | ✅ |
| Step 1 | `Step1Vin.tsx` — VIN decoder | ✅ |
| Step 2 | `Step2Details.tsx` — základní údaje vozu | ✅ |
| Step 3 | `Step3Equipment.tsx` — výbava | ✅ |
| Step 4 | `Step4Photos.tsx` — foto upload | ✅ |
| Step 5 | `Step5PriceContact.tsx` — cena + kontakt | ✅ |
| Step 6 | `Step6Preview.tsx` — náhled + odeslání | ✅ |
| API | `POST /api/listings` (route.ts existuje) | ✅ |

**✅ Flow 3 COMPLETE** — 6-step wizard implementován, všechny kroky přítomny.

---

### Flow 4: Vrakoviště přidat díl (3-step wizard)

| Krok | Implementace | Stav |
|------|-------------|------|
| Stránka | `/parts/new` → 3-step wizard | ✅ |
| Step 1 | `PhotoStep.tsx` — foto upload | ✅ (kód OK) |
| Step 2 | `DetailsStep.tsx` — kategorie, stav, kompatibilita | ✅ |
| Step 3 | `PricingStep.tsx` — cena, sklad, doprava | ✅ |
| Cloudinary creds | **CHYBÍ** v `.env` | ❌ |
| Dev fallback URL | `dev_upload:carmakler/parts/filename` | ⚠️ |
| Zod validace | `z.string().url()` odmítne dev_upload URL | ❌ |
| handlePublish fail | Tiché selhání → redirect /parts/my (bez error hlášky) | ⚠️ |

**⚠️ BLOCKER (dev environment):** Bez CLOUDINARY creds nelze díl publikovat. PhotoStep nevyhodí chybu (API vrací 201 s dev_upload URL), ale POST /api/parts selže na Zod validaci a uživatel dostane redirect bez chybové hlášky.

---

## SOUHRN

| Check | Výsledek |
|-------|---------|
| Build | ✅ 312/312 |
| Lint | ✅ 0 errors |
| Tests | ✅ 141/141 |
| #60a — middleware role fix | ✅ Správně, API konzistentní |
| #60b — PhotoStep upload | ✅ Kód správný |
| #60c — Tile "Dodavatel" | ✅ Implementováno |
| Flow 1 — Broker → PWA | ✅ Complete |
| Flow 2 — Vrakoviště registrace | ❌ **BLOCKER: žádná admin aktivace pro PARTNER_VRAKOVISTE** |
| Flow 3 — Inzerce wizard | ✅ 6 steps complete |
| Flow 4 — Part wizard | ⚠️ Kód OK, **BLOCKER: Cloudinary creds chybí v .env** |

---

## Blockers (reportovány team-leadovi před completed)

### BLOCKER #1 — Chybějící admin aktivace PARTNER_VRAKOVISTE ⚠️
- **Závažnost:** HIGH — Registrace funguje, ale uživatel se nikdy nemůže přihlásit
- **Příčina:** `User.status = "PENDING"` po registraci, lib/auth.ts blokuje PENDING
- **Chybí:** `PUT /api/admin/partners/[id]/activate` endpoint + admin UI tlačítko
- **Doporučení:** Nový task — implement partner/user activate endpoint v admin panelu

### BLOCKER #2 — Cloudinary credentials chybí v `.env` ⚠️
- **Závažnost:** MEDIUM (dev only) — browser test flow vrakoviště přidat díl by failnul
- **Příčina:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` nejsou v .env
- **Dopad:** PhotoStep upload vrátí `dev_upload:...` URL → Zod odmítne → díl se neuloží tiše
- **Doporučení:** Přidat credentials do `.env.local` nebo nastavit v prostředí před browser testem

### Vedlejší nález — handlePublish tiché selhání ℹ️
- `handlePublish` při API error redirectuje `/parts/my` bez error hlášky uživateli
- UX issue (ne crash) — uživatel neví proč díl nebyl uložen
- Doporučení: zobrazit chybovou hlášku místo silent redirect (low priority fix)
