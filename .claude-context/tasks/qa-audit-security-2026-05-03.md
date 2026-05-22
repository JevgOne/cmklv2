# QA Security Audit — Carmakler platforma
> Datum: 2026-05-03
> Auditor: Evžen (kontrolor zadání)
> Scope: XSS, SQL injection, CSRF, env secrets, data exposure, file upload, rate limiting

---

## SOUHRN

| Kategorie | Stav | Kritických | Varování |
|-----------|------|------------|----------|
| 1. XSS (dangerouslySetInnerHTML) | ⚠️ | 2 | 3 |
| 2. SQL injection (raw queries) | ✅ | 0 | 0 |
| 3. CSRF ochrana | ✅ | 0 | 1 |
| 4. Env secrets / hardcoded klíče | ✅ | 0 | 1 |
| 5. Sensitive data exposure | ✅ | 0 | 1 |
| 6. File upload bezpečnost | ✅ | 0 | 1 |
| 7. Rate limiting | 🔴 | 1 | 2 |
| 8. Security headers | ✅ | 0 | 1 |
| 9. IDOR (object reference) | ✅ | 0 | 0 |
| **CELKEM** | | **3** | **9** |

---

## 1. XSS — dangerouslySetInnerHTML

### Nalezeno: ~60+ použití dangerouslySetInnerHTML

#### ✅ BEZPEČNÉ — JSON-LD structured data (~45 míst)
Většina použití je pro `<script type="application/ld+json">` s `JSON.stringify(jsonLd)` — data jsou generována server-side z DB, `JSON.stringify` escapuje nebezpečné znaky. **Žádné riziko XSS.**

Příklady (bezpečné):
- `app/(web)/page.tsx:246` — Homepage JSON-LD
- `app/(web)/nabidka/[slug]/page.tsx:491` — Vehicle JSON-LD
- `app/(web)/blog/[slug]/page.tsx:183` — Article JSON-LD
- `components/web/Breadcrumbs.tsx:29` — Breadcrumb JSON-LD
- Dalších ~40 JSON-LD instancí na SEO stránkách

#### ✅ SANITIZOVANÉ (DOMPurify) — 2 místa
- `components/pwa/onboarding/ContractSign.tsx:111` — `DOMPurify.sanitize(contractHtml)` ✅
- `components/pwa/emails/EmailSendModal.tsx:288` — `DOMPurify.sanitize(previewHtml)` ✅

#### 🔴 POTENCIÁLNÍ XSS — user/AI content BEZ sanitizace

| # | Soubor | Řádek | Riziko | Popis |
|---|--------|-------|--------|-------|
| **1** | `app/(web)/blog/[slug]/page.tsx` | 281 | 🔴 **VYSOKÉ** | `article.content` renderován přímo. Content pochází z DB (admin/AI vytvořený), ale pokud admin vloží XSS payload přes blog editor → execute na všech čtenářích. |
| **2** | `app/(admin)/admin/blog/ai-drafts/AiDraftGenerator.tsx` | 191 | 🔴 **STŘEDNÍ** | `draft.content` z AI bez sanitizace. Admin-only stránka, ale AI response může obsahovat neočekávaný HTML. |
| **3** | `components/pwa/AiAssistant.tsx` | 316 | ⚠️ STŘEDNÍ | AI odpovědi renderovány přes dangerouslySetInnerHTML. Pouze pro přihlášené makléře (PWA). |
| **4** | `components/pwa/materials/MaterialsContent.tsx` | 73 | ⚠️ NÍZKÉ | `signatureHtml` — interně generovaný HTML pro email podpis. |
| **5** | `app/(web)/bazar/[slug]/page.tsx` | 79 | ⚠️ NÍZKÉ | JSON-LD stringified data. |

#### ⚠️ SEO HTML content — server-side template factory
- `app/(web)/dily/znacka/[brand]/page.tsx:214,221` — `seo.introHtml` + `s.html`
- `app/(web)/dily/znacka/[brand]/[model]/page.tsx:244,251` — stejné
- `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx:235,242` — stejné

Tento HTML pochází z `lib/seo-data.ts` (template factory, žádný user input). Riziko je nízké, ale pokud se v budoucnu přidá admin editace SEO textu, je třeba sanitizovat.

### Doporučení:
1. **P0:** Přidat `DOMPurify.sanitize()` na `article.content` v `blog/[slug]/page.tsx` (isomorphic-dompurify je už v deps)
2. **P0:** Přidat `DOMPurify.sanitize()` na AI draft content v `AiDraftGenerator.tsx`
3. **P1:** Přidat sanitizaci na AI asistent odpovědi v `AiAssistant.tsx`

---

## 2. SQL Injection — Raw queries

### Nalezeno: 8 souborů s $queryRaw / $queryRawUnsafe

| Soubor | Metoda | Parametrizace | Stav |
|--------|--------|---------------|------|
| `lib/search.ts` | `$queryRawUnsafe` | `$1, $2, $3` pozicní params | ✅ BEZPEČNÉ |
| `lib/search.ts` | `sanitizeQuery()` | Regex strip speciálních znaků | ✅ BEZPEČNÉ |
| `lib/tags.ts` | `$queryRaw` | Tagged template literal | ✅ BEZPEČNÉ |
| `app/api/parts/oem-lookup/route.ts` | `$queryRawUnsafe` | `$1, $2, $3` pozicní params | ✅ BEZPEČNÉ |
| `app/api/parts/autocomplete/route.ts` | `$queryRaw` | Tagged template literal | ✅ BEZPEČNÉ |
| `app/api/partner/stats/charts/route.ts` | `$queryRaw` | Tagged template literal | ✅ BEZPEČNÉ |

### Analýza:
- **Žádná string interpolace v SQL dotazech** — všechny raw queries používají buď:
  - `$queryRaw` s tagged template literals (Prisma auto-escaping)
  - `$queryRawUnsafe` s pozicními parametry (`$1, $2, $3`) — ekvivalent pg parametrized queries
- **`sanitizeQuery()`** v `lib/search.ts` stripuje speciální znaky před použitím v tsquery
- **`normalizeOem()`** v `oem-lookup/route.ts` používá regex `replace(/[\s\-.]/g, "")` — bezpečné

### Verdikt: ✅ **ŽÁDNÉ SQL injection riziko nalezeno**

---

## 3. CSRF ochrana

### Mechanismy:
- **NextAuth.js** automaticky řeší CSRF pro auth flows (login, signout) ✅
- **API routes** používají `getServerSession(authOptions)` — server-side session validace, ne cookie-only ✅
- **Next.js API routes** jsou same-origin by default (SameSite cookies) ✅
- **CSP `form-action 'self'`** omezuje formuláře na vlastní doménu ✅

### ⚠️ Varování:
- Není implementován explicitní CSRF token systém — spoléhá se na NextAuth session + SameSite cookies
- Pro kritické akce (smazání účtu, platby) by bylo vhodné přidat double-submit cookie pattern

### Verdikt: ✅ **Dostatečná ochrana pro současný stav** (Next.js + NextAuth + SameSite)

---

## 4. Env secrets / hardcoded klíče

### Kontrolované vzory:
- `password = "..."`, `secret = "..."`, `token = "..."`, `apiKey = "..."`

### Nalezeno:

| Soubor | Obsah | Stav |
|--------|-------|------|
| `e2e/marketplace/helpers.ts:32-35` | Test credentials `password: "heslo123"` | ✅ Test soubor |
| `prisma/seed.ts:355-381` | Seed invitation tokens | ✅ Seed data |
| `app/(web)/registrace/*.tsx` | Client-side validation messages | ✅ Bezpečné |

### API klíče v kódu:
- **Všechny API klíče přístupny pouze přes `process.env.*`** ✅
- `ANTHROPIC_API_KEY`, `CRON_SECRET`, `REVALIDATE_SECRET`, `ZASILKOVNA_API_PASSWORD`, `LEADS_API_KEY` — vždy z env
- **Žádné hardcoded production credentials v kódu** ✅

### ⚠️ Varování:
- `e2e/marketplace/helpers.ts` obsahuje test hesla — ujistit se že `.env.test` není v produkci
- `Math.random().toString(36)` pro temp hesla v `admin/marketplace/applications/[id]/route.ts:95` — kryptograficky slabé (ale pro temp heslo přijatelné)

### Verdikt: ✅ **Žádné hardcoded production secrets**

---

## 5. Sensitive data exposure

### Hesla v API responses:

| Endpoint | Co se děje | Stav |
|----------|-----------|------|
| `settings/password` | Vybírá `passwordHash` pro `bcrypt.compare`, NEVRACÍ v response | ✅ |
| `admin/profile/password` | Vybírá `passwordHash` pro `bcrypt.compare`, NEVRACÍ v response | ✅ |
| `partners/[id]/activate` | Vrací `temporaryPassword` adminovi | ⚠️ Záměrné (admin flow) |
| `partners/create-with-account` | Vrací `temporaryPassword` + posílá emailem | ⚠️ Záměrné (admin flow) |
| `admin/marketplace/applications/[id]` | Generuje temp heslo, posílá emailem | ⚠️ Záměrné |
| `listings/route.ts:107` | `passwordHash: ""` pro anonymní inzerenty | ⚠️ Prázdný hash, ne leak |

### ⚠️ Varování:
- **`temporaryPassword` v API response** — vrací se adminovi při aktivaci partnera/marketplace aplikace. To je záměrný flow, ale heslo by ideálně mělo být posláno POUZE emailem, ne i v API response.

### Verdikt: ✅ **Žádný neúmyslný leak hesel nebo tokenů**

---

## 6. File upload bezpečnost

### `lib/upload.ts` — analýza:

| Kontrola | Implementace | Stav |
|----------|-------------|------|
| Max velikost | `MAX_FILE_SIZE = 10MB` | ✅ |
| Typ souboru | `IMAGE_EXTENSIONS` set (`image/jpeg`, `image/png`, `image/webp`) | ✅ |
| Filename sanitizace | `${timestamp}-${hash}.${ext}` — žádný user input ve filename | ✅ |
| Path traversal | `join(UPLOAD_DIR, folder)` — folder je server-controlled | ✅ |
| Image processing | Sharp resize + WebP konverze | ✅ |
| EXIF stripping | `sharp(buffer).rotate()` auto-rotace + metadata strip | ✅ |

### `/api/uploads/[...path]/route.ts` — DEV ONLY:

| Kontrola | Stav |
|----------|------|
| Produkce disabled | `NODE_ENV !== "development"` → 404 | ✅ |
| Path traversal | `join(UPLOAD_DIR, ...path)` — uživatel posílá path segmenty | ⚠️ DEV ONLY |

### ⚠️ Varování:
- **Dev uploads route** přijímá user-supplied path segments a joinuje je s UPLOAD_DIR. V dev mode toto není kritické, ale `path.join` normalizuje `..` segmenty. Doporučeno přidat validaci i v dev mode.

### Verdikt: ✅ **Upload bezpečnost je solidní pro produkci**

---

## 7. Rate limiting

### Existující rate limiting:

| Endpoint | Limit | Implementace | Stav |
|----------|-------|-------------|------|
| `POST /api/auth/register` | 5/15min per IP | `lib/rate-limit.ts` | ✅ |
| `POST /api/auth/register/broker` | 5/15min per IP | `lib/rate-limit.ts` | ✅ |
| `POST /api/auth/register/partner` | 5/15min per IP | `lib/rate-limit.ts` | ✅ |
| `POST /api/auth/resend-verification` | 3/hour per IP | `lib/rate-limit.ts` | ✅ |
| `POST /api/auth/forgot-password` | 3/hour per email | DB-based (token count) | ✅ |
| `POST /api/contact` | 3/5min per IP | `lib/rate-limit.ts` | ✅ |
| `POST /api/marketplace/apply` | Rate limited per IP | `lib/rate-limit.ts` | ✅ |
| SMS sending | 5/den per číslo | `lib/sms.ts` DB-based | ✅ |

### 🔴 CHYBĚJÍCÍ rate limiting:

| # | Endpoint | Riziko | Závažnost |
|---|----------|--------|-----------|
| **1** | **NextAuth login** (`/api/auth/[...nextauth]`) | Brute-force hesla | 🔴 **KRITICKÉ** |
| **2** | `POST /api/auth/reset-password` | Token brute-force | ⚠️ STŘEDNÍ |
| **3** | `POST /api/assistant/chat` | API cost abuse (Claude API) | ⚠️ STŘEDNÍ |
| **4** | `POST /api/assistant/generate-description` | API cost abuse | ⚠️ STŘEDNÍ |
| **5** | `POST /api/assistant/price-estimate` | API cost abuse | ⚠️ STŘEDNÍ |
| **6** | `POST /api/ai/generate-bio` | API cost abuse | ⚠️ STŘEDNÍ |
| **7** | `POST /api/blog/ai-generate` | API cost abuse | ⚠️ STŘEDNÍ |
| **8** | `POST /api/newsletter/subscribe` | Spam subscribe | ⚠️ NÍZKÉ |
| **9** | `POST /api/sell-request` | Form spam | ⚠️ NÍZKÉ |

### Rate limit implementace — analýza `lib/rate-limit.ts`:
- **In-memory Map** — resetuje se při restartu serveru
- **Jednoduchý window counter** — funkční pro single-instance
- **Limitace:** Nefunguje přes více instancí (pokud je horizontal scaling). Pro produkci zvážit Redis-based rate limiting.

### Doporučení:
1. **P0:** Přidat rate limiting na NextAuth login (5 pokusů/15 min per IP)
2. **P1:** Přidat rate limiting na všechny AI endpointy (10 req/min per user)
3. **P2:** Přidat rate limiting na reset-password, newsletter, sell-request
4. **P3:** Zvážit Redis rate limiter pro horizontální scaling

---

## 8. Security headers

### next.config.ts — response headers:

| Header | Hodnota | Stav |
|--------|---------|------|
| `X-Frame-Options` | `DENY` | ✅ |
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `X-XSS-Protection` | `1; mode=block` | ✅ |
| `Permissions-Policy` | `camera=(), microphone=()` | ✅ |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | ✅ |
| `Content-Security-Policy` | **Report-Only** mode | ⚠️ |

### CSP direktivy (Report-Only):
- `default-src 'self'` ✅
- `script-src 'self' 'unsafe-eval' 'unsafe-inline'` — unsafe-eval/inline pro Next.js
- `base-uri 'self'` ✅
- `form-action 'self'` ✅
- `frame-ancestors 'none'` ✅
- `report-uri /api/csp-report` ✅

### ⚠️ Varování:
- **CSP je v Report-Only mode** — neblokuje, jen reportuje. Pro plnou ochranu přepnout na enforced mode (po ověření že neblokuje legitimní resources).

### Anti-spam:
- **Honeypot** na: newsletter subscribe, blog komentáře, marketplace apply ✅

---

## CELKOVÝ BEZPEČNOSTNÍ VERDIKT

### 🟢 Silné stránky:
1. **SQL injection: NULOVÉ riziko** — všechny raw queries parametrizované
2. **Auth: solidní** — getServerSession na protected routes, CRON_SECRET na cron joby, Stripe webhook signature
3. **File upload: bezpečný** — validace typu, velikosti, sanitizace filename, Sharp processing
4. **Security headers: kompletní** — HSTS, X-Frame, CSP (report-only), nosniff
5. **Env secrets: čisté** — žádné hardcoded credentials v kódu
6. **Honeypot anti-spam** na klíčových formulářích
7. **DOMPurify** správně použit na onboarding kontrakty a email preview

### 🔴 Kritické problémy (3):
1. **Blog article.content bez DOMPurify** — XSS vektor přes admin blog editor
2. **AI draft content bez sanitizace** — XSS přes AI response v admin panelu
3. **Login endpoint bez rate limiting** — brute-force attack vector

### ⚠️ Varování (9):
1. AI asistent odpovědi bez sanitizace (PWA, auth-only)
2. CSP v Report-Only mode (neblokuje)
3. AI endpointy bez rate limiting (cost abuse)
4. Reset password bez rate limiting
5. In-memory rate limiter (nefunguje při scale-out)
6. temporaryPassword v API response (měl by být jen v emailu)
7. Dev uploads route bez path traversal validace
8. `Math.random()` pro temp hesla (měl by být `crypto.randomBytes`)
9. Newsletter/sell-request bez rate limiting

---

## DOPORUČENÍ PRO OPRAVU (prioritizované)

### P0 — Okamžitě
1. `DOMPurify.sanitize(article.content)` v `blog/[slug]/page.tsx:281`
2. `DOMPurify.sanitize(draft.content)` v `AiDraftGenerator.tsx:191`
3. Rate limiting na NextAuth login (5/15min per IP)

### P1 — Brzy
4. DOMPurify na AI asistent response v `AiAssistant.tsx`
5. Rate limiting na AI endpointy (assistant/chat, generate-description, price-estimate, ai/generate-bio, blog/ai-generate)
6. Rate limiting na reset-password
7. Nahradit `Math.random()` za `crypto.randomBytes()` pro temp hesla

### P2 — Při příležitosti
8. Přepnout CSP z Report-Only na enforced
9. Rate limiting na newsletter/subscribe, sell-request
10. Redis-based rate limiter pro horizontal scaling
11. Path traversal validace v dev uploads route

---

## 9. IDOR — Insecure Direct Object Reference

### Analýza: ownership validace na user-owned resources

Prověřeno 15+ klíčových endpointů s `[id]` parametrem — zda ověřují, že přistupující uživatel je vlastníkem resource.

#### ✅ Správně chráněné endpointy:

| Endpoint | Ochrana | Stav |
|----------|---------|------|
| `/api/listings/[id]` (PUT/PATCH/DELETE) | `listing.userId !== session.user.id && !isAdmin` | ✅ |
| `/api/listings/[id]/extend` | `listing.userId !== session.user.id` | ✅ |
| `/api/listings/[id]/stats` | `listing.userId !== session.user.id && !isAdmin` | ✅ |
| `/api/vehicles/[id]` (PATCH) | `isOwnerOrAdmin(vehicle.brokerId)` | ✅ |
| `/api/vehicles/[id]/images` | `vehicle.brokerId !== session.user.id && !isAdmin` | ✅ |
| `/api/vehicles/[id]/handover` | `vehicle.brokerId === session.user.id` (isOwner) | ✅ |
| `/api/orders/[id]` | `order.buyerId === session.user.id \|\| supplier match` | ✅ |
| `/api/contracts/[id]` | `contract.brokerId !== session.user.id && !isAdmin` | ✅ |
| `/api/watchdog/[id]` (PATCH/DELETE) | `existing.userId !== session.user.id` | ✅ |
| `/api/garage/[id]` (DELETE/PUT) | `car.userId !== session.user.id` | ✅ |
| `/api/contacts/[id]` (GET/PUT/DELETE) | `contact.brokerId !== session.user.id` | ✅ |
| `/api/parts/[id]` (PUT/DELETE) | `existing.supplierId !== session.user.id && !isAdmin` | ✅ |
| `/api/parts/my` | `supplierId: session.user.id` (scoped query) | ✅ |
| `/api/broker/*` | Scoped k `session.user.id` (brokerId) | ✅ |
| `/api/marketplace/investments` (GET) | `where.investorId = session.user.id` (non-admin) | ✅ |
| `/api/marketplace/opportunities/[id]` | Dealer: `dealerId !== session.user.id`; Investor: vidí jen své investice | ✅ |
| `/api/marketplace/negotiations` (POST) | `opportunity.dealerId !== session.user.id && !admin` | ✅ |

#### Pattern analýza:
Codebase konzistentně používá jeden z těchto IDOR ochranných vzorů:
1. **Ownership check:** `resource.userId !== session.user.id` → 403
2. **Admin bypass:** `|| isAdmin` (ADMIN/BACKOFFICE mohou přistoupit ke všem)
3. **Scoped queries:** `where: { userId: session.user.id }` → query vrací jen vlastní data
4. **Role-based gating:** `ALLOWED_ROLES.includes(session.user.role)` + ownership

### Verdikt: ✅ **IDOR ochrana je konzistentní a solidní**

Všechny prověřené endpointy správně ověřují vlastnictví resource. Admin/BackOffice role mají oprávněný bypass. Žádný endpoint neposkytuje data jiného uživatele bez autorizace.

---

*Security audit dokončen: 2026-05-03 (aktualizace: +IDOR sekce)*
*Auditor: Evžen (kontrolor zadání)*
*Závěr: Platforma má solidní bezpečnostní základ. 3 kritické nálezy vyžadují okamžitou opravu.*
