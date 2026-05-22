# Plán — Task #60: Comprehensive verification — registrace + listing flows

**Autor:** planovac (agent team)
**Datum:** 2026-04-06
**Priorita:** HIGH (blokuje user trust — pokud něco z tohohle nefunguje, MVP není usable)
**Typ:** Test plán + diagnostika (NEpíše kód)

> **Uživatelské zadání (doslovně):** „Ověř všechno, potřebuju, aby jsi ověřil všechny registrace, jestli funguje registrace makléře, jestli funguje registrace vrakoviště, inzerce, udělat inzerát, přidat fotky, přidat popisek, zveřejnit ten inzerát. Potřebuju zkusit přidat produkt jako za vrakoviště, jestli jde přidat istram, jdou přidat fotky, jestli tam jdou přidat informace a tak dál a tak dál, jestli makléř se může přihlásit, zaregistrovat, všechno tohleto potřebuju."

---

## 1. Cíl

Vytvořit detailní test plán pro **5 klíčových flow** s identifikací co lze ověřit staticky vs. browserem, a flagovat **rozbité části** zjištěné při discovery. Cílem je dát team-leadovi a kontrolorovi/test-chrome agentu kompletní mapu, podle které mohou systematicky proklepat MVP před release.

**Priorita pořadí (per assignment):**
1. Makléř — registrace
2. Makléř — login + redirect
3. Vrakoviště — registrace
4. Vrakoviště — přidat díl (foto + info + publikace)
5. Inzerce — registrace + vytvořit inzerát (foto + popis + publikace)

---

## 2. 🚨 KRITICKÉ BUGY zjištěné při discovery (P0 BLOCKERS)

> Tyto bugy musí být fixed **PŘED** end-to-end browser testem flow #3+#4. Plánovač je flagoval, ale implementaci dispatchne team-lead samostatnými fix tasky.

### BUG #1 — Vrakoviště middleware whitelist NEZAHRNUJE PARTNER_VRAKOVISTE
**Soubor:** `middleware.ts:206-225`
```ts
const PARTS_SUPPLIER_ROLES = ["PARTS_SUPPLIER", "ADMIN", "BACKOFFICE"];
// ⚠ MISSING: "PARTNER_VRAKOVISTE"
```
**Důsledek:** Uživatel zaregistrovaný přes `/registrace/partner?type=VRAKOVISTE` má v DB `role: PARTNER_VRAKOVISTE`. Po loginu **nemůže přistoupit k `/parts/*`** — middleware vrátí 403/redirect. Celý vrakoviště PWA flow je nedostupný pro tuto registrační cestu.

**FIX:** Přidat `"PARTNER_VRAKOVISTE"` do `PARTS_SUPPLIER_ROLES`.

**Pozn.:** API endpoint `app/api/parts/route.ts` má v role whitelistu PARTNER_VRAKOVISTE správně — bug je POUZE v middleware.

### BUG #2 — Vrakoviště „Přidat díl" PhotoStep nepoužívá Cloudinary
**Soubor:** `app/(pwa-parts)/parts/new/page.tsx` → `PhotoStep` komponenta
**Popis:** Fotky se ukládají jako **base64 data URLs** přes FileReader API. Při handlePublish se posílají v request body, ale **nikdy se neuploadují na `/api/upload`** s presetem `parts`.

**Důsledek:**
- Buď request na `POST /api/parts` selže (Zod validace `images.url: z.string().url()` neprojde s `data:image/...`)
- Nebo díl se uloží s prázdným `images: []`
- V katalogu nikdo neuvidí fotky → nákupní flow rozbitý

**FIX:** Integrovat upload na `/api/upload?upload_preset=parts` v PhotoStep nebo PricingStep před submitem. Cloudinary má dev fallback (`dev_upload:...` URL), takže lokálně to projde i bez `CLOUDINARY_*` env vars.

### BUG #3 — Rozcestník `/registrace` neobsahuje „Dodavatel dílů"
**Soubor:** `app/(web)/registrace/page.tsx`
**Popis:** Hlavní registrační rozcestník nabízí pouze ADVERTISER (Prodávající) + BUYER (Kupující). **Cesta k registraci vrakoviště** (`/registrace/dodavatel` nebo `/registrace/partner`) **není nikde linkována**.

**Důsledek:** Vrakoviště musí znát přesnou URL nebo dostat link mailem. Žádný onboarding flow z homepage.

**FIX:** Přidat 3. tile na rozcestník: „Dodavatel dílů (vrakoviště)" → `/registrace/partner?type=VRAKOVISTE`. (Nebo decision: chceme open registraci? → invitation-only flow jako u BROKER?)

### BUG #4 — Listing count limit není vynucen na API úrovni
**Soubor:** `app/api/listings/route.ts`
**Popis:** PRIVATE účet má povoleno 1 inzerát / 60 dní; BAZAAR 10 / 90 dní. Tento limit je hardcoded **pouze ve frontend `moje-inzeraty/page.tsx`** (`maxListings = 10`). API endpoint `POST /api/listings` neověřuje accountType + count.

**Důsledek:** Útočník/curl uživatel může vytvořit neomezeně inzerátů.

**FIX:** Přidat count check do `POST /api/listings` před `prisma.listing.create()`. Blocker pro production, ne pro testovací sweep.

### BUG #5 — `POST /api/listings` umožňuje neautentizované vytvoření přes auto-create User
**Soubor:** `app/api/listings/route.ts`
**Popis:** Pokud session není přítomná, API automaticky **vytvoří anonymního uživatele** (`email: anon-{ts}@carmakler.local`, `role: ADVERTISER`, `status: ACTIVE`) a inzerát uloží pod ním.

**Důsledek:** Zaplevelení DB ghost účty + spam vector + GDPR risk (ghost users bez email verification).

**FIX:** Decision: chceme guest listings? Pokud ne, vyžadovat session. Pokud ano, alespoň označit jako `isGuest: true` a expirovat do 24h pokud uživatel neclaim přes email.

### BUG #6 — Email verification je SOFT (warning only, neblokuje login)
**Soubor:** `app/(web)/login/page.tsx` + `lib/auth.ts`
**Popis:** Po registraci se posílá verification email (24h token), ale login funguje i bez ověření. Banner se zobrazí jen jako varování.

**Hodnocení:** Není to bug per se — soft enforcement je validní design pro MVP. Jen flagovat pro QA a budoucí compliance audit (GDPR si soft enforcement obvykle žádá).

---

## 3. Flow #1 — Makléř registrace

### 3.1 URL + soubory
| Vrstva | Cesta | Popis |
|--------|-------|-------|
| Page | `app/(web)/registrace/makler/page.tsx` | Form (token-gated) |
| Page | `app/(web)/registrace/page.tsx` | Rozcestník (NEMÁ link na makler — invitation only) |
| API | `app/api/auth/register/broker/route.ts` | POST endpoint |
| Email | `lib/email-verification.ts` | sendVerificationEmail |
| Email | `app/api/auth/resend-verification/route.ts` | Resend (rate-limit 3/h) |
| Verify | `app/(web)/overeni-emailu/[token]/page.tsx` | Email verification landing |
| Schema | `lib/validators/onboarding.ts` | brokerRegistrationSchema |
| Schema | `prisma/schema.prisma` | User: role, status, onboardingStep, emailVerified |

### 3.2 Klíčová zjištění
- **Invitation-only:** Registrace vyžaduje validní token v URL `?token=xxx` (DB model `Invitation`, status PENDING, expires 24h)
- **Token check:** POST endpoint nejprve ověří invitation v DB → 404/409 pokud invalid/expired/used
- **Auto-fill:** Email z invitation je readonly; jméno se předvyplní pokud invitation má `firstName/lastName`
- **ARES validace IČO:** Real-time přes `/api/ares?ico=...` → vrátí companyName + adresu
- **Vytvoření User:** transakce → `role: BROKER`, `status: ONBOARDING`, `onboardingStep: 1`, `onboardingCompleted: false`, linkne managera + region z invitation
- **Verifikační email:** sendVerificationEmail (32-byte hex token, 24h expiry, model `EmailVerificationToken`)
- **Auto-signin:** Po úspěšné registraci se v page volá `signIn("credentials", ...)` a redirect na `/makler/onboarding/profile`

### 3.3 Pole formuláře
| Pole | Typ | Validace | Pozn. |
|------|-----|----------|-------|
| token (URL param) | string | min 1 | Z URL `?token=...` |
| email | readonly | min 1 | Z invitation |
| firstName | text | min 1 | |
| lastName | text | min 1 | |
| phone | tel | min 1 | |
| ico | text | 7-8 znaků | ARES live check |
| password | password | min 8 | bcrypt salt 12 |
| passwordConfirm | password | === password | Client check |
| consent | checkbox | required | Terms + GDPR |

### 3.4 Static-checkable
- ✅ Zod schema `brokerRegistrationSchema` (`lib/validators/onboarding.ts`)
- ✅ API validation flow (token → email duplicate → password hash → user create → invitation mark USED)
- ✅ Email template je plain HTML (žádné dynamic data injection issues)
- ✅ Bcrypt salt = 12, JWT v cookies, sameSite: lax

### 3.5 Needs browser test
- 🌐 **Validní invitation token flow:** seedovat invitation v DB → otevřít `/registrace/makler?token=XYZ` → vyplnit formulář → submit → ověřit auto-signin a redirect
- 🌐 **Invalid token:** `/registrace/makler?token=invalid` → očekávat error message
- 🌐 **Expired token:** seedovat invitation s `expiresAt: < now` → očekávat error
- 🌐 **Already used token:** druhý pokus o registraci se stejným tokenem → očekávat 409
- 🌐 **ARES live lookup:** zadat platné IČO (např. `27074358` Apple Czech) → ověřit auto-fill
- 🌐 **Email verification:** kliknout na link v inboxu (Resend test mode) → ověřit `user.emailVerified` v DB
- 🌐 **Resend rate-limit:** 4× resend za hodinu → očekávat 429

### 3.6 Závislosti pro browser test
- DB seed: vytvořit minimálně 1 PENDING invitation s tokenem (`prisma/seed.ts` nebo manual SQL)
- ARES API musí být dostupné (production endpoint, fallback NHTSA jen pro vehicle dekódování ne pro IČO)
- Resend API key v `.env` (nebo Resend dev mode)

---

## 4. Flow #2 — Makléř login + role-based redirect

### 4.1 URL + soubory
| Vrstva | Cesta | Popis |
|--------|-------|-------|
| Page | `app/(web)/login/page.tsx` | Login form |
| Auth | `lib/auth.ts` | NextAuth CredentialsProvider, JWT callbacks |
| Auth | `app/api/auth/[...nextauth]/route.ts` | Re-export |
| Middleware | `middleware.ts:200-225` | Role + status check pro `/makler/*` |
| PWA Router | `app/(pwa)/makler/onboarding/page.tsx` | Step-based redirect |

### 4.2 Klíčová zjištění
- **Login:** Email + password → POST `/api/auth/callback/credentials`
- **Allowed statuses pro login:** `ACTIVE` nebo `ONBOARDING` (kritické! BROKER ve fázi onboarding se musí přihlásit)
- **JWT payload:** `{ id, email, role, status, firstName, lastName, accountType, onboardingStep, onboardingCompleted, isEmailVerified }`
- **Role-based client redirect** (po loginu, v `login/page.tsx`):
  ```js
  switch (role) {
    case "BROKER": router.push("/makler/dashboard"); break;
    case "PARTS_SUPPLIER": router.push("/parts"); break;
    // ...
  }
  ```
- **Middleware override:** Pokud BROKER má `status === "ONBOARDING"`, middleware (řádky 200-203) intercepts `/makler/dashboard|vehicles|...` → redirect na `/makler/onboarding`
- **Onboarding router** (`/makler/onboarding/page.tsx`): server-side check `onboardingStep` → redirect na `/makler/onboarding/{step}` (profile/documents/training/contract/approval)

### 4.3 Static-checkable
- ✅ NextAuth config (providers, callbacks, JWT/session strategy)
- ✅ Allowed status check v authorize callback
- ✅ JWT payload struktura
- ✅ Middleware role array `MAKLER_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"]`
- ✅ Onboarding step → URL mapping

### 4.4 Needs browser test
- 🌐 **Valid login (ACTIVE BROKER):** přihlásit existujícího aktivního makléře → ověřit redirect na `/makler/dashboard`
- 🌐 **Login + ONBOARDING status:** přihlásit makléře v onboardingu → ověřit middleware redirect na `/makler/onboarding/{aktuální step}`
- 🌐 **Wrong password:** ověřit error message + zachování emailu v poli
- 🌐 **Non-existent email:** ověřit generickou chybu (NESMÍ leakovat existence účtu)
- 🌐 **Email verification banner:** přihlásit user s `emailVerified: null` → ověřit zobrazení banneru + funkci „Odeslat znovu"
- 🌐 **Logout flow:** ověřit `signOut()` redirect

### 4.5 Závislosti pro browser test
- DB seed: 1 BROKER user s `status: ACTIVE`, 1 BROKER s `status: ONBOARDING, onboardingStep: 2`
- Cookie domain config (production: `.carmakler.cz`, dev: `localhost`)

---

## 5. Flow #2.5 — Makléř onboarding (5 kroků)

### 5.1 Kroky + API endpoints
| Step | URL | Komponenta | API endpoint | Akce |
|------|-----|------------|--------------|------|
| 1 | `/makler/onboarding/profile` | ProfileForm | `PUT /api/onboarding/profile` | photo, bio, specializations, cities[], iban → step 2 |
| 2 | `/makler/onboarding/documents` | DocumentUpload | `POST /api/onboarding/documents` | trade_license, id_front, id_back (multipart, max 10MB, JPG/PNG/WebP/PDF) → Cloudinary → step 3 |
| 3 | `/makler/onboarding/training` | TrainingSlides + QuizForm | `POST /api/onboarding/quiz` | 10 questions, server-side scoring 80% threshold → step 4 |
| 4 | `/makler/onboarding/contract` | ContractSign | `GET/POST /api/onboarding/contract` | GET preview HTML (`generateBrokerAgreement()`), POST signature → step 5 + `onboardingCompleted: true` |
| 5 | `/makler/onboarding/approval` | static page | — | Waiting screen "Manažer vás bude kontaktovat do 24h" |

### 5.2 Schválení adminem
- **Endpoint:** `PUT /api/admin/brokers/[id]/activate` (vyžaduje role MANAGER/REGIONAL_DIRECTOR/ADMIN)
- **Constraints:** broker.role === BROKER, status === ONBOARDING, onboardingCompleted === true
- **MANAGER restriction:** může aktivovat pouze vlastní brokery (`managerId` check)
- **Po aktivaci:** status `ONBOARDING → ACTIVE`, broker se může přihlásit do `/makler/dashboard`
- **❌ Chybí:** email notifikace brokerovi po aktivaci (assumed manual contact)

### 5.3 Static-checkable
- ✅ Onboarding Zod schemas (profileSchema, documentsSchema, quizSchema, contractSignSchema)
- ✅ Cloudinary upload preset `avatars` (Step 1 photo) + dokumenty (Step 2)
- ✅ Quiz CORRECT_ANSWERS hardcoded v `/api/onboarding/quiz/route.ts` (must match `QUIZ_QUESTIONS` v `QuizForm.tsx`)
- ✅ Contract template generator funkce
- ✅ Status transition guards v admin endpoint

### 5.4 Needs browser test
- 🌐 **Sequential flow:** Step 1 → 2 → 3 → 4 → 5 v jednom session, ověřit DB updaty po každém kroku
- 🌐 **File upload:** real Cloudinary upload (3× dokument + avatar) — sleduj filename + format
- 🌐 **Quiz fail (< 80%):** ověřit zachování step 3 + uložení quizScore
- 🌐 **Quiz pass:** ověřit přechod na step 4
- 🌐 **Contract preview** + signature submit → step 5
- 🌐 **Admin approval:** přihlásit se jako MANAGER → seznam ONBOARDING brokerů → activate → ověřit status ACTIVE
- 🌐 **Re-login po aktivaci:** broker se přihlásí → middleware NESMÍ redirectnout na onboarding → musí jít na `/makler/dashboard`

### 5.5 Závislosti
- Cloudinary production env vars (jinak fallback `dev_upload:...` placeholder URL pro lokální test)
- MANAGER user pro admin approval test

---

## 6. Flow #3 — Vrakoviště registrace

### 6.1 URL + soubory
| Vrstva | Cesta | Popis |
|--------|-------|-------|
| Page | `app/(web)/registrace/dodavatel/page.tsx` | PARTS_SUPPLIER form |
| Page | `app/(web)/registrace/partner/page.tsx` | PARTNER_VRAKOVISTE/PARTNER_BAZAR form |
| API | `app/api/auth/register/partner/route.ts` | POST endpoint |
| API | `app/api/ares/route.ts` | IČO lookup |
| Schema | `lib/validators/partner.ts` | registerPartnerSchema |
| Page | `app/(web)/registrace/page.tsx` | ⚠ Rozcestník — chybí link na vrakoviště (BUG #3) |

### 6.2 Klíčová zjištění
**Existují 2 cesty k registraci vrakoviště:**

#### A) `/registrace/dodavatel` → role `PARTS_SUPPLIER`
- Direkt registrace bez výběru typu
- API: pravděpodobně `app/api/auth/register/route.ts` (generic register)
- Status po vytvoření: třeba ověřit (PENDING vs ACTIVE)

#### B) `/registrace/partner?type=VRAKOVISTE` → role `PARTNER_VRAKOVISTE`
- Choice buttons: `AUTOBAZAR | VRAKOVISTE`
- API: `app/api/auth/register/partner/route.ts`
- Vytváří v transakci: `User` (status PENDING) + `Partner` (status JEDNAME) + `PartnerActivity` log
- Vyžaduje **backoffice schválení** (status PENDING → ACTIVE)
- ❌ **Login zablokován** dokud admin neaktivuje (lib/auth.ts allowed: ACTIVE | ONBOARDING)

### 6.3 Pole formuláře (varianta B — partner)
| Pole | Typ | Povinné | Pozn. |
|------|-----|---------|-------|
| type | choice | ano | AUTOBAZAR \| VRAKOVISTE |
| companyName | text | ano | Pre-fill z ARES |
| ico | text | ano | 8-digit, ARES check |
| contactName | text | ano | |
| email | email | ano | Unique |
| phone | tel | ano | |
| password | password | ano | min 8 |
| passwordConfirm | password | ano | === password |
| street | text | ne | Pre-fill z ARES |
| city | text | ne | Pre-fill z ARES |
| zip | text | ne | Pre-fill z ARES |
| description | textarea | ne | |

### 6.4 Static-checkable
- ✅ Zod schema `registerPartnerSchema` (`lib/validators/partner.ts`)
- ✅ ARES integrace (`lib/ares.ts` → `verifyIco()`)
- ✅ Role mapping: type → role
- ✅ Transakční DB write (User + Partner + PartnerActivity)
- ❌ **BUG #1** middleware neumožní login → flagged výše

### 6.5 Needs browser test
- 🌐 **Variant A (`/dodavatel`):** vyplnit formulář → submit → ověřit role v DB + zda lze rovnou se přihlásit (pokud status ACTIVE) nebo čeká na approval
- 🌐 **Variant B (`/partner?type=VRAKOVISTE`):** vyplnit → submit → ověřit role PARTNER_VRAKOVISTE, status PENDING, partner status JEDNAME
- 🌐 **ARES auto-fill:** zadat platné IČO → ověřit pre-fill polí
- 🌐 **Login attempt PENDING:** pokus o login bez aktivace → očekávat error
- 🌐 **Backoffice approval:** najít UI/API pro aktivaci (❌ pravděpodobně neexistuje)
- 🌐 **Po aktivaci login:** přihlásit se → ověřit redirect na `/parts` (POZOR: blocked BUG #1)

### 6.6 Závislosti / blockery
- ⛔ **BLOCKER:** BUG #1 (middleware role whitelist) musí být fixed před `/parts/*` testem
- ⛔ **BLOCKER:** Backoffice approval flow musí existovat — pokud ne, manuální SQL UPDATE pro test
- Cloudinary není potřeba pro registrační flow (jen pro „přidat díl")

---

## 7. Flow #4 — Vrakoviště přidat díl

### 7.1 URL + soubory
| Vrstva | Cesta | Popis |
|--------|-------|-------|
| Page | `app/(pwa-parts)/parts/new/page.tsx` | 3-step wizard |
| Layout | `app/(pwa-parts)/layout.tsx` | PWA shell (TopBar + BottomNav + offline) |
| API | `app/api/parts/route.ts` | POST endpoint |
| API | `app/api/upload/route.ts` | Cloudinary upload (preset `parts`) |
| API | `app/api/parts/compatible/route.ts` | VIN/vehicle kompatibilita |
| Schema | `lib/validators/parts.ts` | createPartSchema (already verified) |
| Middleware | `middleware.ts:206-225` | ⚠ BUG #1 — chybí PARTNER_VRAKOVISTE |

### 7.2 Wizard kroky
**Step 1 — PhotoStep**
- File picker (jpg/png/webp), max 10 fotek
- ❌ **BUG #2:** používá FileReader → data URLs (nikoli Cloudinary upload)
- Mělo by volat `POST /api/upload?upload_preset=parts` → vrátí `secure_url`

**Step 2 — DetailsStep**
- name (text, required)
- category (enum select, required)
- condition (enum select, required)
- description (textarea, optional)
- oemNumber (text, optional)
- partNumber (text, optional)
- sourceVin (text, optional, pro VIN dekódování)
- compatibility[] (CompatibilitySelector — { brand, model, yearFrom, yearTo })

**Step 3 — PricingStep**
- price (int, Kč) — required
- vatIncluded (bool, default true)
- stock (int, default 1)
- (volitelně) deliveryOptions, weight, dimensions

### 7.3 API `POST /api/parts/route.ts`
- **Auth:** session.user.id required (401 jinak)
- **Role check:** `["PARTS_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"]` ✅ (correctly inclusive)
- **Validation:** `createPartSchema.parse(body)`
- **Slug:** `slugify(name)` + collision check + timestamp suffix
- **DB write:** Part s `supplierId: session.user.id`, `status: ACTIVE`
- **Images:** nested create do `PartImage` (id, url, order, isPrimary)
- **Response:** `{ part }` (201)

### 7.4 Cloudinary upload
- **Endpoint:** `POST /api/upload`
- **FormData:** file + upload_preset (`parts` | `vehicles` | `listings` | `invoices` | `contracts` | `damages` | `avatars`)
- **Dev fallback:** pokud chybí `CLOUDINARY_*` env vars → vrátí `dev_upload:carmakler/parts/{filename}` (placeholder URL)
- **Production:** SHA-1 podpis → REST API call → vrátí `secure_url`

### 7.5 Static-checkable
- ✅ `createPartSchema` (already read)
- ✅ POST endpoint role check (správně)
- ✅ Cloudinary preset config v `/api/upload`
- ✅ DB Part model (`prisma/schema.prisma:888-953`) — supplierId relation, images relation, indexes
- ❌ **BUG #2** PhotoStep nepoužívá Cloudinary
- ❌ **BUG #1** middleware whitelist neobsahuje PARTNER_VRAKOVISTE

### 7.6 Needs browser test
- 🌐 **Wizard navigation:** prošel všemi 3 kroky bez ztráty state (back/next button)
- 🌐 **PhotoStep upload:** ⛔ **BLOCKED bug #2** — fotky se neuložou do DB, dokud se nepofixuje
- 🌐 **DetailsStep validation:** všechna povinná pole, enum selecty, compatibility dynamic add/remove
- 🌐 **PricingStep:** number inputs, default values
- 🌐 **Submit:** ověřit POST `/api/parts` → response 201 → redirect na `/parts/my`
- 🌐 **Moje díly list:** ověřit nový díl viditelný v `/parts/my`
- 🌐 **Veřejný katalog:** ověřit viditelnost dílu na `/shop/katalog` (pokud status ACTIVE)
- 🌐 **VIN dekódování (volitelné):** zadat sourceVin → ověřit auto-fill kompatibility (pokud feature funkční)

### 7.7 Závislosti / blockery
- ⛔ BUG #1 (middleware) — bez fixu se k `/parts/new` ani nedostane
- ⛔ BUG #2 (PhotoStep) — bez fixu fotky neprojdou
- ✅ Cloudinary není hard blocker (dev fallback)
- ✅ Žádný backoffice approval pro publikaci dílu — `status: ACTIVE` rovnou po vytvoření

---

## 8. Flow #5 — Inzerce: registrace + vytvořit inzerát

### 8.1 URL + soubory
| Vrstva | Cesta | Popis |
|--------|-------|-------|
| Page | `app/(web)/inzerce/registrace/page.tsx` | ADVERTISER signup (4 account types) |
| Page | `app/(web)/inzerce/pridat/page.tsx` | Wrapper pro 6-step wizard |
| Component | `components/web/listing-form/ListingFormWizard.tsx` | Multi-step orchestrator |
| Component | `components/web/listing-form/Step1Vin.tsx` | VIN decode |
| Component | `components/web/listing-form/Step2Details.tsx` | Vehicle details |
| Component | `components/web/listing-form/Step3Equipment.tsx` | Výbava |
| Component | `components/web/listing-form/Step4Photos.tsx` | Photo upload |
| Component | `components/web/listing-form/Step5PriceContact.tsx` | Cena + kontakt |
| Component | `components/web/listing-form/Step6Preview.tsx` | Náhled + submit |
| Page | `app/(web)/moje-inzeraty/page.tsx` | Správa inzerátů (auth required) |
| API | `app/api/listings/route.ts` | POST (create), GET (search) |
| API | `app/api/listings/[id]/images/route.ts` | POST (upload fotky → Cloudinary) |
| API | `app/api/listings/my/route.ts` | GET own listings |
| API | `app/api/auth/register/route.ts` | Generic register (ADVERTISER) |
| API | `app/api/auth/register/ares/route.ts` | ARES IČO check |
| Schema | `lib/validators/listing.ts` | createListingSchema |

### 8.2 Registrace ADVERTISER
**4 account types:**
- `PRIVATE` — soukromý prodejce, 1 inzerát / 60 dní
- `BAZAAR` — autobazar, 10 inzerátů / 90 dní, vyžaduje IČO
- `DEALER` — autorizovaný prodejce, neomezeno
- `BUYER` — kupující (nemůže inzerovat)

**Pole:**
1. Account type tile selection
2. firstName, lastName, email, phone, password, passwordConfirm
3. Pokud BAZAAR/DEALER → ico + ARES check button → companyName auto-fill

**API:** `POST /api/auth/register` s `role: "ADVERTISER"` (nebo `BUYER`)
**Po registraci:** redirect na `/login?registered=1`

### 8.3 6-step wizard pro vytvoření inzerátu

**Step 1 — VIN**
- VIN input (regex `/^[A-HJ-NPR-Z0-9]{17}$/`)
- Tlačítko „Dekódovat" → `/api/vin/decode?vin=...` → auto-fill brand/model/year/fuel/transmission/...
- Možnost přeskočit

**Step 2 — Details (povinná pole označená ⚠)**
- ⚠ brand (select 21 značek)
- ⚠ model (text — žádný DB select)
- variant (text)
- ⚠ year (select 2000-2026)
- ⚠ mileage (number)
- ⚠ fuelType (PETROL/DIESEL/ELECTRIC/HYBRID/PLUGIN_HYBRID/LPG/CNG)
- ⚠ transmission (MANUAL/AUTOMATIC/DSG/CVT)
- enginePower, engineCapacity (volitelné)
- bodyType, color, doorsCount, seatsCount, drivetrain (volitelné)
- ⚠ condition (NEW/LIKE_NEW/EXCELLENT/GOOD/FAIR/DAMAGED)
- serviceBook (bool), stkValidUntil (date), odometerStatus, ownerCount
- Readonly flag pokud `vinDecoded === true`

**Step 3 — Equipment**
- Předdefinované checkboxes (výbava)
- Custom equipment add (text)
- Highlights (max 5 stringů)

**Step 4 — Photos**
- Drag-drop / file picker (multi)
- Local preview (Blob URL)
- Mark primary, reorder
- JPG/PNG/WebP, max 10 MB / file

**Step 5 — Price & Contact**
- ⚠ price (number)
- priceNegotiable (bool, default true)
- vatStatus (DEDUCTIBLE/NON_DEDUCTIBLE/MARGIN_SCHEME)
- ⚠ city (text)
- district (text)
- description (textarea)
- ⚠ contactName, ⚠ contactPhone, contactEmail
- wantsBrokerHelp (bool)

**Step 6 — Preview + Submit**
- Full preview všech dat
- Buttons:
  - „Uložit jako koncept" → status=DRAFT
  - „Publikovat" → status=ACTIVE + publishedAt=now
- Success screen → linky „Moje inzeráty" + „Vložit další"

### 8.4 API `POST /api/listings`
- Validation: `createListingSchema.parse(body)` (Zod)
- **Auth optional:** ⚠ unauth user → auto-create anonymous User (BUG #5)
- **listingType determinace** z user role/accountType: BROKER/MANAGER → BROKER, DEALER/BAZAAR → DEALER, jinak PRIVATE
- Slug generace
- DB create + `autoFlagListing()` post-insert
- Response 201 + `{ listing, flagResult }`

### 8.5 API `POST /api/listings/[id]/images` (Cloudinary upload)
- multipart/form-data
- `photos[]` File array
- `order_{i}`, `isPrimary_{i}` per file
- **Auth:** session ownership OR unauth + listing < 30 min old (window pro post-create upload)
- DB: vytvoří `ListingImage` records
- Response 201 + `{ images }`

### 8.6 API `GET /api/listings/my`
- Auth required (401 jinak)
- Vrátí `Listing[]` userId === session.user.id, include images sorted

### 8.7 Static-checkable
- ✅ `createListingSchema` (Zod, ~25+ polí)
- ✅ Auth-optional create (BUG #5 pattern)
- ✅ Cloudinary upload route (multipart, ownership check, time window)
- ✅ Status enum + transitions
- ✅ Listing model v Prisma (image relations, cascade delete, flagging fields)
- ❌ **BUG #4** — žádný count check na API úrovni (jen frontend hardcoded)
- ❌ **BUG #5** — auto-create anonymous user

### 8.8 Needs browser test
- 🌐 **Registrace ADVERTISER (PRIVATE):** vyplnit basic data → submit → redirect na login → ověřit role
- 🌐 **Registrace ADVERTISER (BAZAAR + ARES):** vyplnit ico → ARES button → auto-fill companyName → submit
- 🌐 **VIN dekódování:** zadat platný VIN → ověřit auto-fill Step 2
- 🌐 **VIN přeskočení:** přejít přímo na Step 2 → ověřit, že pole jsou editable
- 🌐 **Step 2 brand/model:** brand select 21 hodnot, model je text — ověřit absence autocomplete
- 🌐 **Step 4 photo upload:** drag-drop multi → preview → reorder → mark primary
- 🌐 **Step 6 DRAFT submit:** ověřit listing v `/moje-inzeraty` jako DRAFT
- 🌐 **Step 6 ACTIVE submit:** ověřit listing v `/moje-inzeraty` jako ACTIVE + viditelný v `/inzerce/katalog`
- 🌐 **Photo upload Cloudinary:** ověřit URL v DB (real `secure_url` nebo dev fallback `dev_upload:...`)
- 🌐 **`/moje-inzeraty` actions:** Activate / Deactivate / Delete (⚠ DELETE/PATCH endpointy nebyly nalezeny ve Glob — možná chybí, viz Risks)
- 🌐 **Unauth flow:** vytvořit listing bez přihlášení → ověřit auto-create User v DB (BUG #5)

### 8.9 Závislosti / blockery
- ⚠ DELETE/PATCH `/api/listings/[id]` — Explore agent je nenašel ve Glob, ale UI je volá. Možná existují, jen pod jiným patternem. **Verify needed:** ručně grepnout `app/api/listings/[id]/route.ts`
- ⚠ `/api/vin/decode` — also not found in initial Glob. Verify.
- ⚠ `/api/listings/[id]/promote` — not globbed. Verify.
- Cloudinary env vars — fallback exists pro dev

---

## 9. Test priority — pořadí provedení

> Pořadí doporučené pro test-chrome / kontrolora. **Bugy P0** musí být fixed před tím, než se dostane k flow #3+#4.

| # | Flow | Priorita | Závislosti |
|---|------|----------|------------|
| 1 | Makléř registrace (#3) | P0 | DB seed: invitation token |
| 2 | Makléř login + redirect (#4) | P0 | DB seed: ACTIVE BROKER + ONBOARDING BROKER |
| 3 | Makléř onboarding 5-step (#5) | P0 | Cloudinary + Resend (file upload + emaily) |
| 4 | Vrakoviště registrace partner (#6) | P0 | ARES API; **PŘED testem fixnout BUG #1** |
| 5 | Vrakoviště login → /parts (#6.5) | P0 | Manuální DB UPDATE (status PENDING → ACTIVE), pokud chybí backoffice UI |
| 6 | Vrakoviště přidat díl wizard (#7) | P0 | **PŘED testem fixnout BUG #2** (Cloudinary upload v PhotoStep) |
| 7 | Inzerce ADVERTISER registrace (#8) | P0 | ARES API |
| 8 | Inzerce vytvořit inzerát 6-step (#8) | P0 | VIN decode endpoint, Cloudinary upload, Listing API |
| 9 | Inzerce moje-inzeraty actions (#8) | P1 | DELETE/PATCH endpointy existují? (verify) |
| 10 | Email verification flow (cross-cutting) | P1 | Resend dev mode |

---

## 10. Acceptance criteria pro celkové ověření

### 10.1 Statické (kód + schema)
- [ ] Zod schemas existují pro všech 5 flow (broker register, partner register, ADVERTISER register, createPart, createListing) — všechny s required field validací
- [ ] API endpoints existují pro každý form submit (verified via Glob)
- [ ] Middleware chrání `/makler/*`, `/parts/*`, `/moje-inzeraty/*`, `/admin/*` se správnými role whitelisty
- [ ] **NO BUG #1:** `PARTNER_VRAKOVISTE` v `PARTS_SUPPLIER_ROLES` middleware whitelistu
- [ ] **NO BUG #2:** PhotoStep v `parts/new` volá `/api/upload` s presetem `parts`
- [ ] **NO BUG #3:** `/registrace` rozcestník má dlaždici „Dodavatel dílů"
- [ ] **NO BUG #4:** `POST /api/listings` má count check podle accountType
- [ ] **NO BUG #5:** `POST /api/listings` vyžaduje session NEBO má isGuest flag + expirace

### 10.2 Browser (E2E)
- [ ] Makléř se může zaregistrovat přes platný invitation token, dokončit 5-step onboarding, být aktivován adminem, přihlásit se a vidět dashboard
- [ ] Vrakoviště se může zaregistrovat (obě cesty), být aktivováno, přihlásit se a přistoupit k `/parts/*` PWA
- [ ] Vrakoviště může vytvořit díl (3-step wizard), nahrát fotky na Cloudinary, díl se uloží do DB s `images[]` neprázdné, je vidět v `/parts/my` a v public `/shop/katalog`
- [ ] ADVERTISER se může zaregistrovat (PRIVATE i BAZAAR cestou), přihlásit se a vytvořit inzerát přes 6-step wizard, nahrát fotky, publikovat
- [ ] Publikovaný inzerát je viditelný v `/inzerce/katalog` a ve vlastním `/moje-inzeraty`
- [ ] Email verification email dorazí, kliknutí na link nastaví `emailVerified` v DB
- [ ] Login redirecty fungují per role

---

## 11. Risks + open questions

### 11.1 Otevřené otázky pro team-leada
1. **Backoffice approval UI pro vrakoviště** — existuje? Pokud ne, je třeba decision: build now, nebo manuální DB UPDATE pro MVP?
2. **Otevřená vs. invitation registrace pro vrakoviště?** — `/registrace/dodavatel` (PARTS_SUPPLIER) vs `/registrace/partner` (PARTNER_VRAKOVISTE) — která je zamýšlena jako primární? Jedna z nich by měla být deprecated nebo sjednoceny.
3. **Guest listings** (BUG #5) — chceme umožnit unauth vytvoření? Pokud ano, claim flow přes email; pokud ne, zablokovat.
4. **Listing count limits** (BUG #4) — kdy enforce? Při create POST (UX disruptive při error) nebo nightly cron (UX horší ale safer)?
5. **VIN decode endpoint** — `/api/vin/decode` — existuje? Pokud ne, Step 1 wizardu je dead.

### 11.2 Verify needed (planovac to-do follow-up)
- [ ] Existence `/api/listings/[id]/route.ts` (DELETE/PATCH)
- [ ] Existence `/api/listings/[id]/promote/route.ts`
- [ ] Existence `/api/vin/decode/route.ts`
- [ ] Backoffice `/admin/partneri/[id]/approve` endpoint
- [ ] Backoffice UI na `/admin/partneri` nebo podobné

### 11.3 Risks
- 🔴 **High:** BUG #1 + BUG #2 jsou totální blockery pro vrakoviště flow — bez fixu nelze provést end-to-end test
- 🟡 **Medium:** Backoffice approval UI chybějící → browser test bude vyžadovat manuální DB intervence
- 🟡 **Medium:** Quiz hardcoded answers — pokud se synchronizace `QUIZ_QUESTIONS` ↔ `CORRECT_ANSWERS` rozejde, broker quiz vždy fail
- 🟢 **Low:** Cloudinary dev fallback prevents test failure pro lokální dev (file upload OK)
- 🟢 **Low:** ARES API outage je external dependency (test by mockovat když offline)

---

## 12. Doporučení pro team-leada

### 12.1 Co dispatchnout JAKO PRVNÍ (před browser testy)
1. **FIX BUG #1** — `middleware.ts` přidat `PARTNER_VRAKOVISTE` do `PARTS_SUPPLIER_ROLES` (1-line fix, mini-task)
2. **FIX BUG #2** — `app/(pwa-parts)/parts/new/page.tsx` PhotoStep integrace s `/api/upload` (medium task, ~30-60 min implementatorovi)
3. **FIX BUG #3** — `app/(web)/registrace/page.tsx` přidat dlaždici „Dodavatel" (mini-task, 5 min)

### 12.2 Co decision-needed PŘED dispatchem
- **Backoffice approval UI** pro PARTNER_VRAKOVISTE — pokud chybí, rozhodnout build now vs manuální seed
- **BUG #4 + BUG #5** — production blockers ale ne MVP demo blockers; zařadit do P1 batch fixes
- **Sjednocení dvou cest registrace vrakoviště** — design rozhodnutí (deprecate jedna, nebo nechat obě)

### 12.3 Pak browser test sweep
Po fixech dispatch test-chrome agentovi s touto plán-mapou. Doporučené pořadí v sekci 9. Test-chrome by měl použít real DB seedy (`prisma/seed.ts`) a dělat assertions na DB state po každém kroku, ne jen UI assertions.

### 12.4 Out of scope tohohle plánu
- ❌ Marketplace flow (INVESTOR/VERIFIED_DEALER) — pokrývá #29/#45
- ❌ Eshop nákup flow — pokrývá #18 (checkout), #21 (vrakoviště ship)
- ❌ Admin panel — pouze část broker activation (#5.2)
- ❌ PWA offline mode test
- ❌ Performance / load testing

---

## 13. Velikost a status

- **Plán:** ~570 řádků, 5 flow + 6 bugů + 10 acceptance criteria + 5 open questions
- **Discovery:** 3 paralelní Explore agenty (makléř / vrakoviště / inzerce) + manuální verifikace klíčových souborů
- **Status:** Ready k review team-leadem
- **Implementace:** NEPSAT KÓD (planner-only task). Po schválení team-lead dispatch:
  - 3 mini-fix tasky (BUGs #1, #2, #3) na implementátora
  - 1 verify task na planovac (sekce 11.2 — existence chybějících endpoints)
  - 1 test-chrome task s touto plán-mapou jako brief
