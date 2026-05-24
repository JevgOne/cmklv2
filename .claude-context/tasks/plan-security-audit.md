# Bezpečnostní audit + implementační plán

**Task #6** | Plánovač | 2026-05-24
**Status:** HOTOVO

---

## §1 Executive Summary

Carmakler platforma má **solidní základ** bezpečnosti díky Next.js 15 + NextAuth.js + Prisma ORM, ale obsahuje několik **kritických mezer**, které je nutné řešit před produkčním nasazením s reálnými uživateli a finančními transakcemi.

**Celkové skóre: 6.5/10**

| Oblast | Skóre | Priorita |
|--------|-------|----------|
| Autentizace (NextAuth.js) | 7/10 | P1 |
| Role a oprávnění | 8/10 | P2 |
| API endpoint ochrana | 6/10 | P0 |
| Session/JWT tokeny | 7/10 | P1 |
| XSS ochrana | 5/10 | P0 |
| SQL injection | 9/10 | — |
| CSRF ochrana | 7/10 | P2 |
| Rate limiting | 4/10 | P0 |
| Anti-bot/anti-scraping | 3/10 | P1 |
| Audit logy | 2/10 | P1 |
| Monitoring | 3/10 | P1 |
| 2FA | 0/10 | P2 |
| Šifrování dat | 5/10 | P1 |
| Security headers | 6/10 | P2 |
| Zálohy DB | ?/10 | P1 |

---

## §2 Autentizace (NextAuth.js)

### Současný stav

**Soubor:** `lib/auth.ts`

- **Provider:** CredentialsProvider (email + heslo)
- **Strategy:** JWT (ne database sessions)
- **Password hashing:** bcryptjs, salt rounds = 12 ✅
- **Session callback:** Enrichuje token s role, status, level, onboarding ✅
- **NEXTAUTH_SECRET:** Použit pro podepisování JWT ✅

### Nalezené problémy

| # | Problém | Závažnost | Detail |
|---|---------|-----------|--------|
| A1 | Žádný account lockout | HIGH | Po N neúspěšných pokusech se účet nezamkne. Brute-force útok je možný (zmírněn rate limitem, ale ten je in-memory). |
| A2 | Žádný refresh token rotation | MEDIUM | JWT nemá refresh mechanismus. Token platí celou dobu session. Při kompromitaci nelze odvolat. |
| A3 | Žádný token revocation | MEDIUM | Nelze invalidovat konkrétní JWT (logout = jen smazání cookie na klientu). Kompromitovaný token platí do expirace. |
| A4 | Chybí password policy | MEDIUM | `app/api/auth/register/route.ts` — žádná validace síly hesla (min. délka, komplexnost). |
| A5 | Žádný password reset flow | LOW | Není implementován forgot password endpoint. |

### Doporučení

```
P0: A1 — Account lockout po 5 neúspěšných pokusech (15 min cooldown)
     → Přidat failedLoginAttempts + lockedUntil do User modelu
     → Kontrola v CredentialsProvider.authorize()

P1: A4 — Password policy (min. 8 znaků, 1 velké, 1 číslo)
     → Zod schema v register + change password routes

P1: A2+A3 — Token blacklist pro logout
     → Redis set s invalidovanými JTI (JWT ID)
     → Alternativa: Krátká JWT expirace (15 min) + refresh token v DB

P2: A5 — Password reset flow
     → Časově omezený token (1h) + Resend email
```

---

## §3 Role a oprávnění

### Současný stav

**13 rolí:** ADMIN, BACKOFFICE, REGIONAL_DIRECTOR, MANAGER, BROKER, ADVERTISER, BUYER, PARTS_SUPPLIER, INVESTOR, VERIFIED_DEALER, PARTNER, USER, SUPER_ADMIN

**Middleware:** `middleware.ts` (410 řádků)
- Role arrays: ADMIN_ROLES, MAKLER_ROLES, INZERENT_ROLES, BUYER_ROLES, PARTS_SUPPLIER_ROLES, MARKETPLACE_DEALER_ROLES, MARKETPLACE_INVESTOR_ROLES, PARTNER_ROLES
- Protected paths: /admin, /makler/*, /parts, /marketplace/deals|dealer|investor, /partner
- Subdomain rewrite + role check ✅

**API routes:** 40+ routes používají `getServerSession(authOptions)` nebo `getToken()`

### Nalezené problémy

| # | Problém | Závažnost | Detail |
|---|---------|-----------|--------|
| R1 | Nekonzistentní auth pattern v API | MEDIUM | Některé routes používají `getServerSession()`, jiné `getToken()`. Není centrální `requireAuth()` wrapper. |
| R2 | Chybí resource-level authorization | MEDIUM | Middleware chrání cestu, ale API route neověřuje, zda user X smí editovat vehicle Y (ownership check). Závisí na per-route implementaci. |
| R3 | Role escalation | LOW | Žádný mechanismus zabraňující ADMIN vytvořit SUPER_ADMIN účet (pokud SUPER_ADMIN existuje). |

### Doporučení

```
P1: R1 — Centrální auth wrapper
     → lib/api-auth.ts: requireAuth(roles?: Role[]) → user | 401/403
     → Refaktor všech 40+ API routes

P1: R2 — Ownership middleware
     → Per-resource check: vehicle.brokerId === session.user.id
     → Generický pattern: requireOwnership(resourceId, userId)

P2: R3 — Role hierarchy enforcement
     → SUPER_ADMIN nelze vytvořit přes API, jen přes DB seed
```

---

## §4 API endpoint ochrana

### Současný stav

**Rate limiting:** `lib/rate-limit.ts`
- In-memory Map<string, {count, resetTime}>
- Per-IP rate limiting
- Použit v **14 API routes**: register, login, contact, search, reviews, VIN decode, leads, atd.
- Konfigurovatelné limity (typicky 10-30 req / 60s window)

**CRON protection:** 17 files s `CRON_SECRET` validací
- Pattern: `headers().get("authorization") === \`Bearer ${process.env.CRON_SECRET}\``

**External API:** `app/api/leads/external/route.ts`
- `X-API-Key` header check
- Vlastní duplicovaný rate limiter

### Nalezené problémy

| # | Problém | Závažnost | Detail |
|---|---------|-----------|--------|
| E1 | In-memory rate limiter | CRITICAL | Map se resetuje při každém deployi/restartu. Při horizontálním škálování nefunguje (každá instance má vlastní Map). Útočník může obejít restart forcingem. |
| E2 | IP spoofing | HIGH | Rate limiter čte IP z headers. Za reverse proxy (Nginx/Vercel) může být manipulovatelný přes X-Forwarded-For. |
| E3 | Chybí rate limit na některých routes | MEDIUM | Některé API routes nemají rate limiting vůbec (workflow, notifications, file upload). |
| E4 | Žádný API versioning | LOW | Všechny routes pod /api/ bez verzování. Breaking changes ovlivní všechny klienty. |
| E5 | CRON secret v plain text | MEDIUM | Porovnání `===` je vulnerability na timing attack (konstantní != bezpečné porovnání). |
| E6 | Duplicovaný rate limiter | LOW | External leads route má vlastní kopii místo sdíleného lib/rate-limit.ts. |

### Doporučení

```
P0: E1 — Redis-based rate limiter
     → Nahradit Map za Redis (Upstash Redis — serverless kompatibilní)
     → Sliding window algorithm
     → Sdílený stav mezi instancemi
     → Estimace: @upstash/ratelimit knihovna, ~2h práce

P0: E2 — Trusted proxy IP extraction
     → Použít only X-Real-IP z trusted proxy
     → Validace X-Forwarded-For chain

P1: E3 — Rate limit na všechny POST/PUT/DELETE routes
     → Centrální middleware approach

P1: E5 — Timing-safe CRON comparison
     → crypto.timingSafeEqual() místo ===

P2: E6 — Deduplikace rate limiteru
     → External route použít lib/rate-limit.ts
```

---

## §5 XSS ochrana

### Současný stav

**dangerouslySetInnerHTML** použit v ~20 souborech:
- **JSON-LD scripts** (~15 souborů) — `<script type="application/ld+json">` ✅ bezpečné (ne user-facing HTML)
- **DOMPurify sanitizace** (2 soubory):
  - `components/pwa/ContractSign.tsx` — sanitizuje HTML před renderem ✅
  - `components/admin/EmailSendModal.tsx` — sanitizuje email preview ✅
- **BEZ sanitizace** (2 soubory):
  - `components/pwa/AiDraftGenerator.tsx` — renderuje AI-generovaný HTML ⚠️
  - `components/web/MaterialsContent.tsx` — renderuje CMS content ⚠️

**CSP:** `next.config.ts` — Content-Security-Policy v **Report-Only** režimu (neblokuje, jen reportuje)

### Nalezené problémy

| # | Problém | Závažnost | Detail |
|---|---------|-----------|--------|
| X1 | Nesanitizovaný AI output | HIGH | `AiDraftGenerator.tsx` renderuje HTML z Claude API bez DOMPurify. Pokud AI output obsahuje `<script>` nebo event handlers, XSS je možný. |
| X2 | Nesanitizovaný CMS content | HIGH | `MaterialsContent.tsx` renderuje HTML bez sanitizace. Pokud admin vloží škodlivý HTML, XSS pro všechny visitors. |
| X3 | CSP v Report-Only | MEDIUM | CSP neblokuje žádné skripty. Pouze reportuje — žádná aktivní ochrana. |
| X4 | Chybí nonce-based CSP | LOW | Inline skripty (JSON-LD) nemají nonce. Při enforce CSP by se rozbily. |

### Doporučení

```
P0: X1 + X2 — DOMPurify na VŠECH dangerouslySetInnerHTML
     → Import DOMPurify, wrap: dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
     → AiDraftGenerator.tsx: sanitizovat AI response před renderem
     → MaterialsContent.tsx: sanitizovat CMS content

P1: X3 — CSP enforce mode
     → Přepnout z Report-Only na enforce
     → Whitelist: self, trusted CDNs (Cloudinary, Google Fonts, Stripe)
     → Nonce pro inline scripts

P2: X4 — Nonce-based CSP pro JSON-LD
     → Next.js generateMetadata nonce support
```

---

## §6 SQL injection

### Současný stav

- **Prisma ORM** — všechny DB queries přes typesafe Prisma client ✅
- **Žádné raw SQL** — `prisma.$queryRaw` / `prisma.$executeRaw` nenalezeny ✅
- **Zod validace** na vstupech API routes ✅
- **Full-text search** — tsvector/trgm extension, ale přes Prisma ✅

### Hodnocení: 9/10 — Vynikající

Prisma parametrizuje všechny queries automaticky. SQL injection je prakticky nemožný při současném nastavení.

**Jediné riziko:** Budoucí použití `$queryRaw` bez parametrizace. Doporučení: ESLint rule zakazující `$queryRaw` bez template literals.

---

## §7 CSRF ochrana

### Současný stav

- **NextAuth.js** — vestavěná CSRF ochrana pro auth routes (csrfToken) ✅
- **SameSite cookies** — Next.js default `Lax` ✅
- **Custom API routes** — žádná explicitní CSRF ochrana ⚠️

### Nalezené problémy

| # | Problém | Závažnost | Detail |
|---|---------|-----------|--------|
| C1 | Žádná CSRF ochrana na custom API | MEDIUM | POST/PUT/DELETE routes nemají CSRF token validaci. SameSite=Lax chrání před cross-origin POST, ale ne před subdomain attacks. |

### Doporučení

```
P2: C1 — CSRF middleware pro mutace
     → Origin/Referer header check
     → Alternativa: Double-submit cookie pattern
     → SameSite=Strict pro session cookie
```

---

## §8 Session/JWT tokeny

### Současný stav

- **JWT strategy** — tokeny v httpOnly cookie ✅
- **NEXTAUTH_SECRET** — podepisování HS256 ✅
- **Session expiry** — konfigurovatelná (default 30 dní)
- **Secure cookie** — automaticky v production (HTTPS) ✅

### Nalezené problémy

| # | Problém | Závažnost | Detail |
|---|---------|-----------|--------|
| S1 | Dlouhá JWT expirace | MEDIUM | 30 dní = kompromitovaný token platí 30 dní. |
| S2 | Žádný JTI (JWT ID) | MEDIUM | Nelze invalidovat konkrétní token. |
| S3 | Session fixation | LOW | Při login se negeneruje nový session ID (JWT = stateless, menší riziko). |

### Doporučení

```
P1: S1+S2 — Krátký JWT (15 min) + refresh token
     → JWT expiry: 15 min
     → Refresh token: 30 dní, rotace při každém použití
     → JTI pro invalidaci

P2: S3 — Token rotation při login
     → Nový JWT při každém login
```

---

## §9 Anti-bot / Anti-scraping

### Současný stav

- **robots.txt** — Disallow pro /api/, /admin/, /makler/, /partner/, /parts/, /muj-ucet/ ✅
- **AI crawlers** — Explicitní Allow pro GPTBot, ClaudeBot, PerplexityBot (záměrné pro GEO SEO) ✅
- **Rate limiting** — In-memory, per-IP (viz §4)
- **Žádný CAPTCHA** — Ani reCAPTCHA, ani hCaptcha ⚠️
- **Žádný fingerprinting** — Žádná detekce botů ⚠️
- **SITE_PASSWORD** — Pre-launch gate v middleware (dočasné) ✅

### Nalezené problémy

| # | Problém | Závažnost | Detail |
|---|---------|-----------|--------|
| B1 | Žádný CAPTCHA | HIGH | Registration, contact form, lead submission — vše bez CAPTCHA. Spam boti mohou zaplavit DB. |
| B2 | Žádná bot detekce | MEDIUM | User-agent check nestačí. Headless Chrome projde. |
| B3 | Masové kopírování dat | HIGH | Veřejný katalog (/nabidka) nemá žádnou ochranu proti masovému scrapingu (konkurence). |
| B4 | Žádný honeypot | LOW | Formuláře nemají honeypot fields pro detekci botů. |

### Doporučení

```
P1: B1 — Turnstile (Cloudflare) na formuláře
     → Registration, contact, lead submission, inzerát podání
     → Turnstile je zdarma, privacy-friendly alternativa k reCAPTCHA
     → Server-side validace tokenu

P1: B3 — Anti-scraping middleware pro katalog
     → Request fingerprinting (IP + User-Agent + Accept-Language hash)
     → Progressive penalties: slow response → CAPTCHA → block
     → Pagination limit enforcement (max 100 pages/session)
     → Cloudflare Bot Management (pokud CF proxy)

P2: B2 — Bot detection middleware
     → User-Agent analysis
     → Request pattern analysis (too-fast, sequential pagination)
     → JavaScript challenge pro podezřelé requesty

P2: B4 — Honeypot fields
     → Hidden field v každém formuláři
     → Bot vyplní → request zahozený
```

---

## §10 Audit logy a monitoring

### Současný stav

- **Žádný audit log systém** ⚠️
- **Console.log** — Sporadické logování v API routes
- **Sentry** — Nastavený pro error tracking ✅
- **No access logging** — Kdo co kdy udělal není trackováno

### Nalezené problémy

| # | Problém | Závažnost | Detail |
|---|---------|-----------|--------|
| L1 | Žádné audit logy | HIGH | Žádný záznam o: login/logout, role changes, vehicle edits, financial transactions, admin actions. Pro finanční platformu (provize, Stripe) je to compliance risk. |
| L2 | Žádný security event monitoring | HIGH | Failed logins, permission denials, rate limit hits — nic se neloguje centrálně. |
| L3 | Žádný anomaly detection | MEDIUM | Neobvyklé vzorce (login z jiné země, hromadné mazání) nejsou detekovány. |

### Doporučení

```
P1: L1 — AuditLog model v Prisma
     → Tabulka: userId, action, resource, resourceId, metadata (JSON), ip, userAgent, createdAt
     → Actions: LOGIN, LOGOUT, ROLE_CHANGE, VEHICLE_CREATE/EDIT/DELETE, 
       COMMISSION_CREATE, PAYMENT, ADMIN_ACTION, SETTINGS_CHANGE
     → Centrální lib/audit.ts: logAudit({ action, resource, ... })
     → Retention: 2 roky (GDPR)

P1: L2 — Security event dashboard
     → Agregace failed logins per IP/user
     → Rate limit hit frequency
     → Permission denial patterns
     → Webhook/alert pro threshold překročení

P2: L3 — Anomaly detection
     → Geo-IP check (login z nové země → email notifikace)
     → Velocity check (příliš mnoho akcí za krátkou dobu)
     → Bulk operation detection
```

---

## §11 2FA pro adminy

### Současný stav

- **Žádné 2FA** — ani pro ADMIN, ani pro SUPER_ADMIN ⚠️
- **Jen email + heslo** pro všechny role

### Doporučení

```
P2: TOTP 2FA pro privilegované role
     → ADMIN, SUPER_ADMIN, MANAGER, BACKOFFICE — povinné 2FA
     → BROKER, REGIONAL_DIRECTOR — volitelné 2FA
     → Knihovna: otpauth (TOTP generátor)
     → QR kód pro Authenticator app setup
     → Recovery codes (8x) při setup
     → Model: TwoFactorSecret (userId, secret, enabled, recoveryCodes)
     → Flow: Login → password OK → 2FA challenge → session
```

---

## §12 Šifrování citlivých dat

### Současný stav

- **Hesla:** bcryptjs hash, salt 12 ✅
- **JWT:** HS256 podepsaný NEXTAUTH_SECRET ✅
- **HTTPS:** Předpokládáno v production ✅
- **DB connection:** SSL v connection string (závisí na konfiguraci) ⚠️
- **Citlivá data v DB:** Rodné číslo, číslo OP, bankovní účet — **plain text** ⚠️
- **Soubory:** Cloudinary (HTTPS upload) ✅
- **Env vars:** .env soubor (gitignored) ✅

### Nalezené problémy

| # | Problém | Závažnost | Detail |
|---|---------|-----------|--------|
| D1 | PII v plain text | HIGH | Rodné číslo (birthNumber), číslo OP (idCardNumber), bankovní účet (bankAccount) uloženy bez šifrování v DB. GDPR citlivé údaje. |
| D2 | Smlouvy v plain text | MEDIUM | Dokumenty/smlouvy na Cloudinary — přístup přes URL (byť neprediktovatelné). |
| D3 | DB connection SSL | LOW | Nutno ověřit, zda je SSL v production connection stringu. |

### Doporučení

```
P1: D1 — Application-level šifrování PII
     → AES-256-GCM pro: birthNumber, idCardNumber, bankAccount, phoneNumber
     → Šifrovací klíč: ENCRYPTION_KEY v env vars
     → lib/encryption.ts: encrypt(plaintext) → ciphertext, decrypt(ciphertext) → plaintext
     → Prisma middleware pro automatické encrypt/decrypt
     → Migration: encrypt existující data, update schema (String → encrypted prefix)

P2: D2 — Signed URLs pro dokumenty
     → Cloudinary signed URLs s expirací (1h)
     → Přístup jen přes API route s auth check

P2: D3 — DB SSL verification
     → sslmode=verify-full v production connection string
```

---

## §13 Bezpečné ukládání dokumentů

### Současný stav

- **Cloudinary** — Obrázky a dokumenty ✅
- **Upload route:** `app/api/upload/route.ts` — auth check přes session ✅
- **File type validation:** Omezená (viz code) ⚠️
- **File size limit:** Next.js default (5MB body) ⚠️

### Nalezené problémy

| # | Problém | Závažnost | Detail |
|---|---------|-----------|--------|
| F1 | Nedostatečná file type validace | MEDIUM | Magic bytes (file header) se nevalidují. Útočník může uploadnout .exe přejmenovaný na .jpg. |
| F2 | Chybí virus scan | LOW | Uploadnuté soubory se neskenují na malware. |

### Doporučení

```
P1: F1 — Magic bytes validace
     → Knihovna: file-type (npm)
     → Validace skutečného typu souboru, ne jen extension
     → Whitelist: image/jpeg, image/png, image/webp, application/pdf

P2: F2 — ClamAV scan (optional)
     → Jen pro smlouvy/dokumenty, ne pro obrázky
     → ClamAV docker container + API
```

---

## §14 Detekce neobvyklého chování

### Doporučení

```
P2: Security anomaly detection systém
     → Triggery:
       - Login z nové IP/země → email alert uživateli
       - 5+ failed logins za 5 min → account lock + admin alert
       - Bulk data access (100+ vehicle views/min) → rate limit + CAPTCHA
       - Admin role change → email všem ADMIN
       - Hromadné mazání (5+ vehicles) → require confirmation + audit log
       - Neobvyklý čas (login 3:00 AM CZ pro CZ uživatele) → flag
     → Implementace: Event-driven (pub/sub pattern)
       - lib/security-events.ts: emit("suspicious_login", { userId, ip, country })
       - Listener: log + notify based on severity
```

---

## §15 Rychlé blokování uživatelů/API přístupu

### Současný stav

- **User status:** `status` field v User modelu (ACTIVE, SUSPENDED, BANNED) ✅
- **Middleware check:** Kontroluje session, ale ne user status při každém requestu ⚠️
- **API key revocation:** Není implementováno ⚠️

### Nalezené problémy

| # | Problém | Závažnost | Detail |
|---|---------|-----------|--------|
| K1 | Status check jen při login | MEDIUM | Pokud admin zablokuje uživatele, stávající JWT zůstane platný do expirace. |
| K2 | Žádný API key management | LOW | External API key je single env var. Nelze revokovat per-partner. |

### Doporučení

```
P1: K1 — Real-time user block
     → Middleware check: Redis set "blocked_users" → check při každém req
     → Nebo: Krátký JWT (15 min) + refresh token check against DB status
     → Admin UI: "Block user" tlačítko → okamžité odpojení

P2: K2 — API key management
     → ApiKey model: key, partnerId, permissions, rateLimit, active, expiresAt
     → Admin UI: Create/revoke API keys per partner
     → Middleware: Validate API key + check active + log usage
```

---

## §16 Zálohování DB

### Současný stav

- **Neznámý** — závisí na hosting provideru
- **Žádný application-level backup** ⚠️

### Doporučení

```
P1: DB backup strategie
     → Automatický daily backup (pg_dump)
     → Retence: 30 dní daily, 12 měsíců monthly
     → Off-site backup (S3/R2)
     → Testování restore: měsíční drill
     → Point-in-time recovery (PITR) pokud hosting podporuje
     → Monitoring: alert pokud backup selže
```

---

## §17 Security headers

### Současný stav

**`next.config.ts`** headers:
- Content-Security-Policy: **Report-Only** (neblokuje) ⚠️
- X-Frame-Options: pravděpodobně default ⚠️
- X-Content-Type-Options: pravděpodobně default ⚠️
- Strict-Transport-Security: nutno ověřit ⚠️
- Referrer-Policy: nutno ověřit ⚠️

### Doporučení

```
P2: Kompletní security headers
     → Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
     → X-Content-Type-Options: nosniff
     → X-Frame-Options: DENY (nebo SAMEORIGIN pro admin iframe)
     → Referrer-Policy: strict-origin-when-cross-origin
     → Permissions-Policy: camera=(), microphone=(), geolocation=(self)
     → CSP: enforce mode (viz §5)
     → X-XSS-Protection: 0 (deprecated, CSP je lepší)
```

---

## §18 Ochrana veřejných dat proti masovému kopírování

### Současný stav

- **Veřejný katalog** (/nabidka) — plně přístupný bez auth ✅ (správně pro SEO)
- **Žádná ochrana** proti masovému scrapingu ⚠️
- **robots.txt** — povoluje Googlebot a AI crawlers ✅

### Doporučení

```
P1: Anti-scraping multi-layer ochrana
     Layer 1: Rate limiting per session (ne jen IP)
       → Cookie-based session fingerprint
       → Max 200 vehicle views / 10 min / session
     
     Layer 2: Progressive degradation
       → 200 views → CAPTCHA challenge
       → 500 views → 24h block
       → Pattern: sequential ID access → immediate block
     
     Layer 3: Data watermarking
       → Invisible Unicode znaky v popisech vozidel
       → Unique per-session → traceback při nalezení na konkurenci
     
     Layer 4: Honeypot endpoints
       → /api/v2/vehicles/export (fake endpoint)
       → Přístup → okamžitý ban + alert
     
     Layer 5: Legal
       → Terms of Service: explicitní zákaz scrapingu
       → Copyright notice v meta tagu
```

---

## §19 Implementační plán — prioritizovaný

### Fáze 1: Kritické (P0) — Týden 1-2

| # | Úkol | Effort | Soubory |
|---|------|--------|---------|
| 1 | Redis rate limiter (Upstash) | 4h | lib/rate-limit.ts, všechny API routes |
| 2 | DOMPurify na AiDraftGenerator + MaterialsContent | 1h | 2 soubory |
| 3 | Trusted proxy IP extraction | 2h | lib/rate-limit.ts, middleware.ts |
| 4 | Timing-safe CRON comparison | 1h | 17 CRON files |

**Celkem: ~8h**

### Fáze 2: Vysoká priorita (P1) — Týden 3-4

| # | Úkol | Effort | Soubory |
|---|------|--------|---------|
| 5 | Account lockout (5 attempts) | 3h | lib/auth.ts, prisma/schema.prisma |
| 6 | Password policy (Zod) | 1h | API register + change password |
| 7 | Centrální requireAuth() wrapper | 4h | lib/api-auth.ts, 40+ API routes |
| 8 | AuditLog model + logAudit() | 6h | prisma/schema.prisma, lib/audit.ts |
| 9 | Turnstile CAPTCHA na formuláře | 4h | Registration, contact, lead forms |
| 10 | PII encryption (AES-256-GCM) | 8h | lib/encryption.ts, prisma middleware |
| 11 | Anti-scraping middleware | 6h | middleware.ts, lib/anti-scraping.ts |
| 12 | DB backup setup | 4h | Infrastructure |
| 13 | User block real-time | 3h | middleware.ts, Redis |
| 14 | File type magic bytes validation | 2h | API upload routes |

**Celkem: ~41h**

### Fáze 3: Střední priorita (P2) — Týden 5-8

| # | Úkol | Effort | Soubory |
|---|------|--------|---------|
| 15 | 2FA (TOTP) pro adminy | 12h | Nové routes, UI, prisma model |
| 16 | CSP enforce mode | 4h | next.config.ts |
| 17 | Security headers komplet | 2h | next.config.ts |
| 18 | CSRF middleware | 3h | middleware.ts |
| 19 | JWT refresh token rotation | 8h | lib/auth.ts, nové routes |
| 20 | Anomaly detection systém | 8h | lib/security-events.ts |
| 21 | API key management | 6h | Prisma model, admin UI |
| 22 | Password reset flow | 4h | API routes, email template |
| 23 | Signed URLs pro dokumenty | 3h | Cloudinary config, API routes |

**Celkem: ~50h**

---

## §20 STOP pravidla pro implementátora

```
STOP-1: Nikdy nepoužívej $queryRaw bez parametrizace (template literal)
STOP-2: Nikdy nepoužívej dangerouslySetInnerHTML bez DOMPurify.sanitize()
STOP-3: Nikdy neukládej PII (rodné číslo, OP, bank. účet) v plain text
STOP-4: Nikdy neporovnávej secrets přes === (vždy crypto.timingSafeEqual)
STOP-5: Nikdy neukládej hesla jinak než bcryptjs hash (min. salt 12)
STOP-6: Nikdy nevytvářej API route bez rate limitingu
STOP-7: Nikdy nevytvářej API route bez auth checku (pokud není veřejná)
STOP-8: Nikdy nenastavuj CORS na * pro API routes s auth
```

---

## §21 Závěr

Carmakler má **dobrý základ** díky modernímu stacku (Next.js 15, Prisma, NextAuth.js), který eliminuje celé kategorie zranitelností (SQL injection, CSRF pro auth). Hlavní rizika jsou:

1. **In-memory rate limiting** — single point of failure, obcházitelný
2. **XSS ve 2 komponentách** — přímé riziko
3. **Žádné audit logy** — compliance a forensic risk
4. **Žádný CAPTCHA** — spam vulnerability
5. **PII v plain text** — GDPR risk

**Doporučené pořadí implementace:** P0 (8h) → P1 (41h) → P2 (50h)

**Celkový effort: ~99h** (12-13 pracovních dní)

Po implementaci Fáze 1 a 2 se skóre zvedne z **6.5/10 na 8.5/10**.
