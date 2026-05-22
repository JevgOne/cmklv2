# QA Report — Task #45: Marketplace apply form + MarketplaceApplication model

**Datum:** 2026-04-06  
**Agent:** KONTROLOR  
**Commit:** `a720f03`  
**Zkontrolováno:** 13 souborů (7 NEW + 6 EDIT)

---

## 1. SIMPLIFY KONTROLA

### A. Prisma model — `prisma/schema.prisma:1175`

Model `MarketplaceApplication` existuje. Fieldy:

| Field | Typ | Poznámka |
|-------|-----|---------|
| id | String @id @default(cuid()) | ✅ |
| createdAt | DateTime @default(now()) | ✅ |
| updatedAt | DateTime @updatedAt | ✅ |
| firstName | String | ✅ |
| lastName | String | ✅ |
| email | String | ✅ |
| phone | String | ✅ |
| role | String | "VERIFIED_DEALER" \| "INVESTOR" ✅ |
| companyName | String? | dealer-specific ✅ |
| ico | String? | dealer-specific ✅ |
| investmentRange | String? | investor-specific ✅ |
| message | String @db.Text | ✅ |
| gdprConsent | Boolean @default(false) | ✅ |
| status | String @default("NEW") | ✅ |
| adminNotes | String? @db.Text | ✅ |
| reviewedAt | DateTime? | ✅ |
| reviewedById | String? | ✅ |
| convertedUserId | String? | ✅ |
| ipAddress | String? | ✅ |
| userAgent | String? @db.Text | ✅ |

**Relace:** `reviewedBy` → User (MarketplaceApplicationReviewer), `convertedUser` → User (MarketplaceApplicationConvertedUser) ✅  
**Indexy:** `[status, createdAt]`, `[email]`, `[role, status]` ✅  
**User model:** Obě relace přidány na řádcích 113-114 ✅

### B. Migration SQL — `prisma/migrations/20260406100000_marketplace_application/migration.sql`

Obsah migrace:
- `CREATE TABLE "MarketplaceApplication"` — 20 sloupců ✅
- 3× `CREATE INDEX` (status+createdAt, email, role+status) ✅
- 2× `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY` ✅

**✅ CRITICAL CHECK PASSED: Migrace obsahuje JEN MarketplaceApplication — žádné drift fixy, žádné jiné tabulky.**

### C. Validator — `lib/validators/marketplace.ts:94`

`applySchema` obsahuje:
- `role: z.enum(["VERIFIED_DEALER", "INVESTOR"])` ✅
- `firstName: z.string().min(2)` ✅
- `lastName: z.string().min(2)` ✅
- `email: z.string().email()` ✅
- `phone: z.string().min(9)` ✅
- `gdprConsent: z.literal(true)` ✅
- `investmentRange: z.enum(["10k-50k", "50k-200k", "200k-1M", "1M+"]).optional()` ✅
- `.refine()` pro VERIFIED_DEALER: vyžaduje `companyName.length > 0 && ico.length > 0` ✅

### D. API `/api/marketplace/apply/route.ts`

- **Žádný `getServerSession`** — endpoint je plně public ✅
- **Honeypot** (řádek 52-59): `"website" in body && body.website.length > 0` → `{ success: true }` s **HTTP 200** (silent, bez DB insert) ✅
- **Rate limit** (řádek 34): `rateLimit("marketplace-apply:${ip}", 5, 15min)` → 429 ✅
- **Anti-duplicate** (řádek 65-81): `findFirst({ email, status:"NEW", createdAt: gte 24h })` → 409 ✅
- **DB insert** (řádek 84-100): všechna pole včetně `ipAddress`, `userAgent` ✅
- **Admin email fire-and-forget** (řádek 128-135): `.catch(err => console.error(...))` — neblokuje response ✅
- **Admin DB notification** (řádek 138-146): `prisma.notification.createMany` pro všechny `role=ADMIN, status=ACTIVE` ✅
- **Confirmation email fire-and-forget** (řádek 150-163): `.catch(...)` ✅
- **Response 201** (řádek 166-173): `{ success: true, applicationId, message }` ✅
- **Direct import** (řádky 7-16): email template funkce importovány přímo — NE přes `generateEmail()` factory ✅

### E. Email templates

**`lib/email-templates/marketplace-application-admin.ts`:**
- `marketplaceApplicationAdminSubject()` ✅
- `marketplaceApplicationAdminHtml()` — `escapeHtml` na všech user datech, dealer/investor conditional rows ✅
- `marketplaceApplicationAdminText()` ✅
- CTA "Otevřít v admin panelu" link ✅

**`lib/email-templates/marketplace-application-confirmation.ts`:**
- `marketplaceApplicationConfirmationSubject()` — bez parametrů ✅
- `marketplaceApplicationConfirmationHtml({ firstName, role })` ✅
- `marketplaceApplicationConfirmationText({ firstName, role })` ✅

**Konfirmace NE v `generateEmail()` factory:**
```
grep "marketplace.application" lib/email-templates/index.ts → 0 matches
```
**✅ Přímý import konzistentní s pattern task #19.**

### F. UI stránky

**`app/(web)/marketplace/apply/page.tsx`:**
- `searchParams: Promise<{ role?: string; reason?: string }>` ✅
- `initialRole` mapování: `role=investor` → INVESTOR, `role=dealer` → VERIFIED_DEALER, jinak null ✅
- `Breadcrumbs` s Domů / Marketplace / Žádost o přístup ✅
- `reason === "auth_required"` → `<Alert variant="info">` ✅
- `reason === "not_authorized"` → `<Alert variant="warning">` ✅
- `<ApplyForm initialRole={initialRole} />` ✅

**`app/(web)/marketplace/apply/loading.tsx`:** spinner s animací ✅  
**`app/(web)/marketplace/apply/error.tsx`:** "use client", error boundary s retry button ✅

### G. `components/web/marketplace/ApplyForm.tsx`

- `"use client"` ✅
- `initialRole` prop (default null) ✅
- Role selection UI (2 tlačítka) → zobrazí formu ✅
- Honeypot: `aria-hidden="true"`, `position: absolute; left: -9999px`, `tabIndex={-1}`, `autoComplete="off"` ✅
- Všechna povinná pole: firstName, lastName, email, phone, message ✅
- VERIFIED_DEALER: companyName + ico ✅
- INVESTOR: investmentRange `<select>` ✅
- GDPR checkbox: `required`, `checked={gdprConsent}` ✅
- `canSubmit` validace: zahrnuje gdprConsent + dealer companyName/ico check ✅
- Error state (Alert) ✅
- Submitting state (disabled button + text "Odesílám...") ✅
- Thank-you state (setSubmitted → success card) ✅

### H. Landing page `/marketplace` + Middleware

**Middleware redirects (middleware.ts):**
- Dealer unauth → `/marketplace/apply?reason=auth_required&role=dealer` ✅
- Investor unauth → `/marketplace/apply?reason=auth_required&role=investor` ✅
- Dealer wrong role → `/marketplace?reason=not_authorized` ✅
- Investor wrong role → `/marketplace?reason=not_authorized` ✅

**Landing page (marketplace/page.tsx):**
- `searchParams: Promise<{ reason?: string }>` ✅
- `reason === "not_authorized"` → `<Alert variant="warning">` ✅
- CTA linky míří na `/marketplace/apply?role=...` ✅

---

## 2. DEBUG KONTROLA

### Build

```
npm run build
✓ Compiled successfully in 44s
✓ Generating static pages (310/310)
```

**✅ BUILD PASSED — 310 routes (309 + nová /marketplace/apply)**

### Lint

```
npm run lint
✖ 169 problems (10 errors, 159 warnings)
```

Kontrola dotčených souborů: 0 výskytů v lint výstupu pro:
- `marketplace/apply/`
- `marketplace-application-*`
- `ApplyForm.tsx`

10 errors jsou pre-existing (e2e soubory + Tabs.tsx). **✅ Žádné nové problémy zavedeny.**

> Poznámka: Lint baseline klesl z 548 → 169 (jiné tasky #47, #48 opravily pre-existing issues). Kritické číslo je 10 errors — stejné jako před tímto taskem.

---

## 3. REVERZNÍ KONTROLA PROTI PLÁNU

### 6 schválených odchylek:

| Odchylka | Stav | Poznámka |
|----------|------|----------|
| Migrace ručně přes psql (Prisma drift workaround) | ✅ | SQL je čistý, follow-up task #54 vytvořen |
| Server-side Alert místo client toast | ✅ | Schváleno team-leadem, jednodušší implementace |
| Honeypot field `website` | ✅ | Dle plánu |
| Rate limit 5 req / 15 min | ✅ | Dle plánu |
| Investment range enum `10k-50k \| 50k-200k \| 200k-1M \| 1M+` | ✅ | Dle plánu |
| Admin DB notification navíc k emailům | ✅ | Konzistentní s ostatními flows |

### Acceptance criteria:

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 1 | `MarketplaceApplication` model v schema.prisma | ✅ | schema.prisma:1175 |
| 2 | Všechny fieldy z plánu (19 polí) | ✅ | schema.prisma:1176-1215 |
| 3 | Migration SQL: POUZE CREATE TABLE MarketplaceApplication | ✅ | migration.sql — žádný drift |
| 4 | `applySchema` má firstName/lastName/phone/gdprConsent/investmentRange | ✅ | validators/marketplace.ts:94 |
| 5 | `.refine()` pro VERIFIED_DEALER (companyName + ico) | ✅ | validators/marketplace.ts:118 |
| 6 | **Žádný session check** — endpoint public | ✅ | route.ts — no getServerSession |
| 7 | Honeypot `website` → 200 silent (bez DB insert) | ✅ | route.ts:52-59 |
| 8 | Rate limit 5 req / 15 min | ✅ | route.ts:23-39 |
| 9 | Anti-duplicate 24h (email + status=NEW) | ✅ | route.ts:65-81 |
| 10 | Admin email fire-and-forget | ✅ | route.ts:128-135 |
| 11 | Confirmation email fire-and-forget | ✅ | route.ts:150-163 |
| 12 | Admin DB notification `createMany` | ✅ | route.ts:138-146 |
| 13 | Admin template: html + text + subject | ✅ | marketplace-application-admin.ts |
| 14 | Confirmation template: html + text + subject | ✅ | marketplace-application-confirmation.ts |
| 15 | Email templates NEJSOU v `generateEmail()` factory | ✅ | grep → 0 matches v index.ts |
| 16 | `apply/page.tsx` existuje + loading.tsx + error.tsx | ✅ | Glob → 3 soubory |
| 17 | Breadcrumbs v apply page | ✅ | apply/page.tsx:37 |
| 18 | searchParams: role + reason | ✅ | apply/page.tsx:19-26 |
| 19 | Alert pro reason=auth_required (info) | ✅ | apply/page.tsx:47 |
| 20 | Alert pro reason=not_authorized (warning) | ✅ | apply/page.tsx:56 |
| 21 | `initialRole` prop v ApplyForm | ✅ | ApplyForm.tsx:24 |
| 22 | Všechna povinná pole + honeypot | ✅ | ApplyForm.tsx:155-278 |
| 23 | GDPR checkbox — povinný pro canSubmit | ✅ | ApplyForm.tsx:102-110 |
| 24 | Investment range: pouze investor | ✅ | ApplyForm.tsx:227-244 |
| 25 | companyName + ico: pouze dealer | ✅ | ApplyForm.tsx:209-225 |
| 26 | Thank-you state po úspěšném odeslání | ✅ | ApplyForm.tsx:84-99 |
| 27 | Landing `/marketplace` Alert pro not_authorized | ✅ | marketplace/page.tsx:144 |
| 28 | Middleware: unauth → apply?reason=auth_required | ✅ | middleware.ts:236,258 |
| 29 | Middleware: wrong role → marketplace?reason=not_authorized | ✅ | middleware.ts:244,265 |
| 30 | Build green (310/310) | ✅ | viz Debug |
| 31 | Lint — 0 nových errors | ✅ | 10 errors = pre-existing |

**Celkem: 31/31 ✅**

---

## SOUHRN

| Check | Výsledek |
|-------|---------|
| Prisma model | ✅ Všechna pole, indexy, relace |
| Migration SQL | ✅ POUZE MarketplaceApplication — žádný drift |
| API veřejnost | ✅ Žádný session check |
| Honeypot | ✅ 200 silent (NE 201) |
| Rate limit + anti-dup | ✅ 5/15min + 24h window |
| Email templates | ✅ Direct import, NE factory |
| UI (apply page + form) | ✅ Všechna pole, GDPR, honeypot, AlertBannery |
| Middleware redirects | ✅ auth_required + not_authorized |
| Build | ✅ 310/310 (+1 nová route) |
| Lint | ✅ 0 nových errors |
| 6 approved odchylek | ✅ Správně implementovány |
| Reverzní kontrola | ✅ 31/31 |

**Celkové hodnocení: ✅ QA #45 PASS**

---

## Poznámky

1. **Prisma drift (task #54)** — migration.sql je čistý, ale na produkci bude nutné buď vyřešit searchVector drift nebo aplikovat stejný psql workaround. DevOps musí být informován před deployem.
2. **Admin panel pro review aplikací** — NEimplementován (out of scope). Admini dostanou email + DB notification, ale žádný list/approve/reject UI.
3. **E2E test chybí** — honeypot + rate limit + happy path testy neimplementovány. Doporučen jako samostatný task.
