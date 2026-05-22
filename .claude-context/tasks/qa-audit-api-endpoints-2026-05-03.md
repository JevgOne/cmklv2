# QA Audit: API Endpointy — Carmakler platforma
> Datum: 2026-05-03
> Auditor: Evžen (kontrolor zadání)
> Zdroj: plan-full-platform-audit-2026-05-03.md, sekce 3

---

## SOUHRN

| Metrika | Počet | % |
|---------|-------|---|
| **Celkem route.ts souborů** | **293** | 100% |
| Existují (route.ts nalezen) | 293 | 100% ✅ |
| S Zod validací | 157 | 53.6% |
| S auth checkem (session/CRON_SECRET) | 243 + 13 cron = 256 | 87.4% |
| S try/catch | 279 | 95.2% |
| Bez try/catch | 14 | 4.8% ⚠️ |
| POST/PATCH/PUT bez Zod | 41 | — ⚠️ |

### Kritické nálezy (🔴)
| # | Nález | Závažnost |
|---|-------|-----------|
| 1 | `/api/leads` — chybí POST metoda (plán říká GET/POST) | 🔴 CHYBÍ METODA |
| 2 | `/api/leads/[id]` — chybí PATCH metoda (plán říká GET/PATCH) | 🔴 CHYBÍ METODA |
| 3 | `/api/admin/users/[id]` — má jen DELETE, chybí GET/PATCH (plán říká GET/PATCH) | 🔴 CHYBÍ METODY |
| 4 | `/api/reservations` — chybí POST metoda (plán říká GET/POST) | 🔴 CHYBÍ METODA |
| 5 | `/api/contracts/[id]` — chybí PATCH metoda (plán říká GET/PATCH) | 🔴 CHYBÍ METODA |
| 6 | `/api/suborders/[id]` — chybí PATCH metoda (plán říká GET/PATCH) | 🔴 CHYBÍ METODA |
| 7 | `/api/manager/bonuses` — má jen GET, plán říká POST | 🔴 CHYBÍ METODA |

### Varování (⚠️)
| # | Nález | Závažnost |
|---|-------|-----------|
| 1 | 41 POST/PATCH/PUT routes bez Zod validace (viz seznam níže) | ⚠️ BEZ VALIDACE |
| 2 | 14 routes bez try/catch (viz seznam níže) | ⚠️ BEZ ERROR HANDLING |
| 3 | Několik routes používá PUT místo PATCH (plan inconsistency) | ⚠️ HTTP METODA |
| 4 | `/api/stripe/connect/dashboard-link` — plán říká GET, je POST | ⚠️ METODA MISMATCH |

---

## DETAILNÍ AUDIT PO SKUPINÁCH

### 3.1 Auth (11 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/auth/[...nextauth]` | GET,POST (handler) | N/A | NextAuth | N/A | Standardní NextAuth handler |
| ✅ | `/api/auth/register` | POST | ✅ | N/A (public) | ✅ | Veřejná registrace |
| ✅ | `/api/auth/register/broker` | POST | ✅ | N/A (public) | ✅ | |
| ✅ | `/api/auth/register/partner` | POST | ✅ | N/A (public) | ✅ | |
| ✅ | `/api/auth/register/ares` | GET | N/A | N/A (public) | ✅ | ARES lookup |
| ✅ | `/api/auth/forgot-password` | POST | ✅ | N/A (public) | ✅ | |
| ✅ | `/api/auth/reset-password` | POST | ✅ | N/A (public) | ✅ | |
| ✅ | `/api/auth/resend-verification` | POST | ✅ | N/A (public) | ✅ | |
| ⚠️ | `/api/auth/verify-email/[token]` | GET | N/A | N/A (token) | ❌ | Chybí try/catch |
| ⚠️ | `/api/auth/partner-onboarding` | PATCH | ❌ | ✅ | ✅ | Plán říká POST, je PATCH; chybí Zod |
| ⚠️ | `/api/auth/supplier-onboarding` | PATCH | ❌ | ✅ | ✅ | Plán říká POST, je PATCH; chybí Zod |

### 3.2 Vehicles (25+ routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/vehicles` | GET,POST | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/vehicles/[id]` | GET,PATCH | ✅ | ✅ | ✅ | Plán říká GET/PATCH/DELETE — chybí DELETE |
| ✅ | `/api/vehicles/[id]/full` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/vehicles/[id]/images` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/vehicles/[id]/similar` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/vehicles/[id]/price-history` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/vehicles/[id]/price-reduction` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/vehicles/[id]/price-reduction/[reductionId]/respond` | PUT | ✅ | ✅ | ✅ | PUT místo POST |
| ✅ | `/api/vehicles/[id]/reserve` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/vehicles/[id]/status` | PATCH | ✅ | ✅ | ✅ | |
| ✅ | `/api/vehicles/[id]/timeline` | GET | ✅ | N/A (public) | ✅ | |
| ⚠️ | `/api/vehicles/[id]/workflow` | GET,PUT | ✅ | ✅ | ❌ | Chybí try/catch; plán říká PATCH, je PUT |
| ✅ | `/api/vehicles/[id]/flag` | POST | ✅ | N/A (public) | ✅ | Nahlášení veřejné |
| ✅ | `/api/vehicles/[id]/report-violation` | POST | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/vehicles/[id]/cebia` | POST | ❌ | ✅ | ✅ | Plán říká GET, je POST; chybí Zod |
| ✅ | `/api/vehicles/[id]/damage` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/vehicles/[id]/damage/[damageId]/repair` | PUT | ✅ | ✅ | ✅ | PUT místo POST |
| ✅ | `/api/vehicles/[id]/exclusive-status` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/vehicles/[id]/extend-exclusive` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/vehicles/[id]/terminate-exclusive` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/vehicles/[id]/handover` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/vehicles/[id]/inquiries` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/vehicles/[id]/inquiries/[inquiryId]` | PUT | ✅ | ✅ | ✅ | PUT místo PATCH |
| ✅ | `/api/vehicles/quick` | POST | ✅ | ✅ | ✅ | |

### 3.3 Broker (9 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/broker/stats` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/broker/detailed-stats` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/broker/commissions` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/broker/vehicles` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/broker/achievements` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/broker/profile` | GET,PATCH | ✅ | ✅ | ✅ | |
| ✅ | `/api/broker/leaderboard` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/broker/notifications` | GET,PATCH | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/broker/tour-complete` | POST | ❌ | ✅ | ❌ | Chybí Zod + try/catch |

### 3.4 Contacts CRM (5 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/contacts` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/contacts/[id]` | GET,PUT,DELETE | ✅ | ✅ | ✅ | PUT místo PATCH |
| ✅ | `/api/contacts/[id]/communications` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/contacts/search` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/contacts/sync` | POST | ✅ | ✅ | ✅ | |

### 3.5 Contracts (5 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/contracts` | GET,POST | ✅ | ✅ | ✅ | |
| 🔴 | `/api/contracts/[id]` | GET | N/A | ✅ | ✅ | **Chybí PATCH** (plán říká GET/PATCH) |
| ✅ | `/api/contracts/[id]/sign` | PUT | ✅ | ✅ | ✅ | PUT místo POST |
| ✅ | `/api/contracts/[id]/pdf` | POST | ✅ | ✅ | ✅ | POST místo GET |
| ⚠️ | `/api/contracts/[id]/send` | POST | ❌ | ✅ | ✅ | Chybí Zod validace |

### 3.6 Leads (7 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| 🔴 | `/api/leads` | GET | N/A | ✅ | ✅ | **Chybí POST** (plán říká GET/POST) |
| 🔴 | `/api/leads/[id]` | GET | N/A | ✅ | ✅ | **Chybí PATCH** (plán říká GET/PATCH) |
| ✅ | `/api/leads/[id]/assign` | PUT | ✅ | ✅ | ✅ | PUT místo POST |
| ✅ | `/api/leads/[id]/status` | PUT | ✅ | ✅ | ✅ | PUT místo PATCH |
| ✅ | `/api/leads/stats` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/leads/external` | POST | ✅ | N/A (public) | ✅ | Správně veřejný |

### 3.7 Listings / Inzerce (14 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/listings` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/listings/my` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/listings/[id]` | GET,PUT,PATCH,DELETE | ✅ | ✅ | ✅ | Má i PUT i PATCH |
| ⚠️ | `/api/listings/[id]/images` | POST | ❌ | ✅ | ✅ | Chybí Zod (file upload) |
| ⚠️ | `/api/listings/[id]/extend` | POST | ❌ | ✅ | ✅ | Chybí Zod |
| ✅ | `/api/listings/[id]/flag` | POST | ✅ | N/A (public) | ✅ | |
| ✅ | `/api/listings/[id]/promote` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/listings/[id]/reserve` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/listings/[id]/stats` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/listings/[id]/inquiry` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/listings/[id]/inquiry/[inquiryId]/reply` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/listings/[id]/inquiry/[inquiryId]/status` | PATCH | ✅ | ✅ | ✅ | |
| ✅ | `/api/listings/quick-filters` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/inzerce` | POST | ✅ | N/A (public) | ✅ | Veřejné podání inzerátu |

### 3.8 Parts / Díly (15 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/parts` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/parts/[id]` | GET,PUT,DELETE | ✅ | ✅ | ✅ | PUT místo PATCH |
| ✅ | `/api/parts/[id]/notify-stock` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/parts/for-vehicle` | GET | ✅ | N/A (public) | ✅ | |
| ✅ | `/api/parts/autocomplete` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/parts/compare` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/parts/compatible` | GET | N/A | N/A (public) | ✅ | |
| ⚠️ | `/api/parts/import` | POST | ❌ | ✅ | ✅ | Chybí Zod (file upload) |
| ✅ | `/api/parts/my` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/parts/oem-lookup` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/parts/reserve` | POST,DELETE | ✅ | N/A (session-based) | ✅ | Používá sessionId místo auth |
| ✅ | `/api/parts/smart-search` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/parts/supplier-stats` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/parts/visual-search` | POST | ✅ | N/A (public) | ✅ | |

### 3.9 Orders (10 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/orders` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/orders/[id]` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/orders/[id]/status` | PUT | ✅ | ✅ | ✅ | PUT místo PATCH |
| ✅ | `/api/orders/[id]/returns` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/orders/[id]/returns/[returnId]/ship-back` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/orders/track/[token]` | GET | N/A | N/A (token) | ✅ | Token-based tracking |
| ✅ | `/api/suborders/[id]` | GET | N/A | ✅ | ✅ | Plán říká GET/PATCH — chybí PATCH |
| ✅ | `/api/suborders/[id]/status` | PUT | ✅ | ✅ | ✅ | PUT místo PATCH |
| ✅ | `/api/suborders/[id]/tracking` | PUT | ✅ | ✅ | ✅ | PUT místo PATCH |

### 3.10 Marketplace (14 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/marketplace/apply` | POST | ✅ | N/A (public) | ✅ | |
| ✅ | `/api/marketplace/opportunities` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/marketplace/opportunities/[id]` | GET,PUT | ✅ | ✅ | ✅ | PUT místo PATCH |
| ✅ | `/api/marketplace/opportunities/[id]/approve` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/marketplace/opportunities/[id]/milestones` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/marketplace/opportunities/[id]/payout` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/marketplace/investments` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/marketplace/investments/[id]/confirm-payment` | PUT | ✅ | ✅ | ✅ | PUT místo POST |
| ✅ | `/api/marketplace/negotiations` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/marketplace/negotiations/[id]/respond` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/marketplace/notifications` | GET | N/A | ✅ | ✅ | |
| ⚠️ | `/api/marketplace/notifications/[id]/read` | PUT | ❌ | ✅ | ✅ | Chybí Zod; PUT místo POST |
| ⚠️ | `/api/marketplace/notifications/read-all` | PUT | ❌ | ✅ | ✅ | Chybí Zod; PUT místo POST |
| ✅ | `/api/marketplace/stats` | GET | N/A | ✅ | ✅ | |

### 3.11 Payments & Payouts (14 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/payments` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/payments/create-checkout` | POST | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/payments/[id]/confirm` | PUT | ❌ | ✅ | ✅ | Chybí Zod; PUT místo POST |
| ✅ | `/api/payments/webhook` | POST | N/A | Stripe sig ✅ | ✅ | constructEvent validace |
| ✅ | `/api/payouts/broker` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/payouts/broker/generate` | POST | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/payouts/broker/[id]/approve` | PUT | ❌ | ✅ | ✅ | Chybí Zod; PUT místo POST |
| ✅ | `/api/payouts/broker/[id]/upload-invoice` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/payouts/seller` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/payouts/seller/[id]/process` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/stripe/webhook` | POST | N/A | Stripe sig ✅ | ✅ | constructEvent validace |
| ✅ | `/api/stripe/connect/status` | GET | N/A | ✅ | ✅ | |
| ⚠️ | `/api/stripe/connect/onboard-link` | POST | ❌ | ✅ | ✅ | Chybí Zod |
| ⚠️ | `/api/stripe/connect/dashboard-link` | POST | ❌ | ✅ | ✅ | Plán říká GET, je POST; chybí Zod |

### 3.12 Admin API (42 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/admin/brokers` | GET | ✅ | ✅ | ✅ | |
| ✅ | `/api/admin/brokers/[id]` | GET,PATCH | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/admin/brokers/[id]/activate` | PUT | ❌ | ✅ | ✅ | Plán říká POST, je PUT; chybí Zod |
| ✅ | `/api/admin/brokers/[id]/reject` | POST | N/A | ✅ | ✅ | |
| ✅ | `/api/admin/vehicles` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/admin/vehicles/[id]` | GET,PATCH,DELETE | ✅ | ✅ | ✅ | |
| ✅ | `/api/admin/vehicles/[id]/approve` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/admin/listings` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/admin/listings/[id]` | GET,PATCH | ✅ | ✅ | ✅ | |
| ✅ | `/api/admin/listings/[id]/moderate` | PATCH | ✅ | ✅ | ✅ | Plán říká POST, je PATCH |
| ✅ | `/api/admin/listings/flagged` | GET | N/A | ✅ | ✅ | |
| ⚠️ | `/api/admin/orders` | GET,PATCH | ❌ | ✅ | ✅ | PATCH bez Zod |
| ✅ | `/api/admin/parts` | GET,PATCH | ✅ | ✅ | ✅ | |
| ✅ | `/api/admin/suppliers` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/admin/returns` | GET | N/A | ✅ | ✅ | Plán říká GET/POST — POST chybí |
| ✅ | `/api/admin/returns/[id]` | GET,PUT | ✅ | ✅ | ✅ | PUT místo PATCH |
| ✅ | `/api/admin/reviews` | GET,POST | ✅ | ✅ | ❌ | Chybí try/catch ⚠️ |
| ✅ | `/api/admin/reviews/[id]` | PUT,DELETE | ✅ | ✅ | ✅ | PUT místo PATCH |
| ✅ | `/api/admin/users` | GET,PATCH | N/A | ✅ | ✅ | PATCH bez Zod |
| 🔴 | `/api/admin/users/[id]` | DELETE | N/A | ✅ | ✅ | **Chybí GET,PATCH** (plán říká GET/PATCH) |
| ⚠️ | `/api/admin/users/[id]/password` | PUT | ❌ | ✅ | ✅ | Plán říká PATCH, je PUT; chybí Zod |
| ⚠️ | `/api/admin/team` | GET,POST | ✅ | ✅ | ❌ | Chybí try/catch |
| ✅ | `/api/admin/team/[id]` | GET,PUT,DELETE | ✅ | ✅ | ✅ | PUT místo PATCH |
| ✅ | `/api/admin/profile` | GET,PATCH | ✅ | ✅ | ✅ | |
| ✅ | `/api/admin/profile/password` | PUT | ✅ | ✅ | ✅ | PUT místo PATCH |
| ✅ | `/api/admin/feeds` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/admin/feeds/[id]` | GET,PATCH,DELETE | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/admin/feeds/[id]/import` | POST | ❌ | ✅ | ✅ | Chybí Zod |
| ✅ | `/api/admin/feeds/[id]/logs` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/admin/feeds/suppliers` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/admin/notifications` | GET,PATCH | ✅ | ✅ | ✅ | Plán říká POST, má GET+PATCH |
| ✅ | `/api/admin/export` | GET | N/A | ✅ | ✅ | Plán říká POST, je GET |
| ⚠️ | `/api/admin/send-verification-emails` | POST | ❌ | ✅ | ✅ | Chybí Zod |
| ✅ | `/api/admin/marketplace/applications` | GET | ✅ | ✅ | ✅ | |
| ✅ | `/api/admin/marketplace/applications/[id]` | GET,PUT | ✅ | ✅ | ✅ | PUT místo PATCH |
| ✅ | `/api/admin/comments/[commentId]` | PATCH,DELETE | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/admin/career` | GET | N/A | ✅ | ❌ | Chybí try/catch |
| ✅ | `/api/admin/career/[id]/level` | PUT | ✅ | ✅ | ✅ | PUT místo PATCH |
| ✅ | `/api/admin/reports/commission-summary` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/admin/partners/[id]/commission` | PATCH | ✅ | ✅ | ✅ | |
| ✅ | `/api/admin/partners/[id]/commission/history` | GET | N/A | ✅ | ✅ | |

### 3.13 Manager API (7 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/manager/stats` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/manager/brokers/[id]` | GET,PUT | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/manager/brokers/[id]/deactivate` | POST | ❌ | ✅ | ✅ | Chybí Zod |
| ✅ | `/api/manager/brokers/[id]/transfer-vehicles` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/manager/vehicles/[id]` | GET,PUT | ✅ | ✅ | ✅ | |
| ✅ | `/api/manager/vehicles/[id]/approve` | POST | ✅ | ✅ | ✅ | |
| 🔴 | `/api/manager/bonuses` | GET | N/A | ✅ | ✅ | **Plán říká POST, má jen GET** |

### 3.14 Partner API (17 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/partner/dashboard` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/partner/stats` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/partner/stats/charts` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/partner/billing` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/partner/leads` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/partner/leads/[id]` | PATCH | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/partner/profile` | GET,PUT | ❌ | ✅ | ✅ | PUT bez Zod |
| ⚠️ | `/api/partner/parts` | GET,POST | ❌ | ✅ | ✅ | POST bez Zod |
| ⚠️ | `/api/partner/vehicles` | GET,POST | ❌ | ✅ | ✅ | POST bez Zod |
| ✅ | `/api/partner/search` | GET | N/A | ✅ | ✅ | |
| ⚠️ | `/api/partner/orders/[id]/pdf` | POST | ❌ | ✅ | ✅ | POST bez Zod (PDF gen) |
| ✅ | `/api/partners` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/partners/[id]` | GET,PATCH,DELETE | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/partners/[id]/activate` | POST | ❌ | ✅ | ✅ | Chybí Zod |
| ✅ | `/api/partners/[id]/activities` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/partners/public/[slug]` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/partners/create-with-account` | POST | ✅ | ✅ | ✅ | |

### 3.15 Blog (10 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/blog/articles` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/blog/articles/[id]` | GET,PATCH,DELETE | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/blog/articles/[id]/publish` | POST | ❌ | ✅ | ✅ | Chybí Zod |
| ✅ | `/api/blog/articles/[id]/comments` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/blog/articles/[id]/comments/[commentId]` | PATCH,DELETE | ✅ | ✅ | ✅ | |
| ✅ | `/api/blog/articles/[id]/reactions` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/blog/categories` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/blog/ai-generate` | POST | ✅ | ✅ | ✅ | |

### 3.16 Search (3 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/search` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/search/smart` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/search/history` | GET,POST | ✅ | ✅ | ✅ | |

### 3.17 Profile & Reputation (8 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/profile/[slug]` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/profile/[slug]/items` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/profile/edit` | GET,PUT | ✅ | ✅ | ✅ | PUT místo POST |
| ✅ | `/api/profile/quick-mode` | PATCH | ✅ | ✅ | ✅ | PATCH místo POST |
| ✅ | `/api/profile/tags` | GET,PUT | ✅ | ✅ | ✅ | PUT místo POST |
| ✅ | `/api/reputation/[userId]/score` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/reputation/[userId]/tags` | POST | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/reputation/recalculate` | POST | ❌ | ✅ | ✅ | Chybí Zod |

### 3.18 Other APIs (51 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/ai/generate-bio` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/assistant/chat` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/assistant/generate-description` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/assistant/price-estimate` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/ares` | GET | ✅ | N/A (public) | ✅ | |
| ✅ | `/api/cebia/check` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/cebia/report/[id]` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/contact` | POST | ✅ | N/A (public) | ✅ | Kontaktní formulář |
| ✅ | `/api/sell-request` | POST | ✅ | N/A (public) | ✅ | |
| ⚠️ | `/api/upload` | POST | ❌ | ✅ | ✅ | File upload — chybí Zod |
| ✅ | `/api/uploads/[...path]` | GET | N/A | N/A (public) | ✅ | Statické soubory |
| ✅ | `/api/vin/decode` | GET | ✅ | ✅ | ✅ | Plán říká POST, je GET |
| ✅ | `/api/vin/check-duplicate` | GET | ✅ | ✅ | ✅ | Plán říká POST, je GET |
| ⚠️ | `/api/tecdoc/parts-for-vehicle` | POST | ✅ | ✅ | ❌ | Plán říká GET, je POST; chybí try/catch |
| ⚠️ | `/api/tecdoc/vin-to-ktype` | POST | ✅ | ✅ | ❌ | Plán říká GET, je POST; chybí try/catch |
| ✅ | `/api/tags` | GET,POST | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/favorites` | GET,POST | ❌ | ✅ | ✅ | POST bez Zod |
| ✅ | `/api/likes` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/garage` | GET,POST | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/garage/[id]` | DELETE,PUT | ❌ | ✅ | ✅ | PUT bez Zod |
| ✅ | `/api/watchdog` | GET,POST,DELETE | ✅ | ✅ | ✅ | |
| ✅ | `/api/watchdog/[id]` | PATCH,DELETE | ✅ | ✅ | ✅ | |
| ✅ | `/api/watchdog/email` | POST | ✅ | N/A (public) | ✅ | Veřejný — email-based, rate limited |
| 🔴 | `/api/reservations` | GET | N/A | ✅ | ✅ | **Chybí POST** (plán říká GET/POST) |
| ⚠️ | `/api/reservations/[id]/cancel` | POST | ❌ | ✅ | ✅ | Chybí Zod |
| ✅ | `/api/comments` | GET,POST | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/comments/[id]` | PATCH,DELETE | ❌ | ✅ | ✅ | PATCH bez Zod |
| ✅ | `/api/invitations` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/invitations/[token]` | GET | N/A | N/A (token) | ✅ | |
| ✅ | `/api/newsletter/subscribe` | POST | ✅ | N/A (public) | ✅ | |
| ✅ | `/api/newsletter/confirm` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/csp-report` | POST | N/A | N/A (browser) | ✅ | CSP report endpoint |
| ✅ | `/api/sms/opt-out` | POST | ✅ | N/A (public) | ✅ | |
| ✅ | `/api/seller-notifications/[token]` | GET,PUT | ✅ | N/A (token) | ✅ | |
| ✅ | `/api/buyer/inquiries` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/buyer/stats` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/escalations` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/escalations/[id]` | PUT | ✅ | ✅ | ✅ | PUT místo PATCH |
| ✅ | `/api/part-requests` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/part-requests/[id]/offer` | POST | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/donor-vehicles` | GET,POST | ✅ | ✅ | ❌ | Chybí try/catch |
| ⚠️ | `/api/donor-vehicles/[id]` | GET,PUT,DELETE | ❌ | ✅ | ❌ | PUT bez Zod + chybí try/catch |
| ✅ | `/api/revalidate/parts` | POST | ✅ | REVALIDATE_SECRET ✅ | ✅ | Timing-safe compare |
| ✅ | `/api/shipping/calculate` | POST | ✅ | N/A (public) | ✅ | |
| ✅ | `/api/shipping/label/[trackingNumber]` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/shipping/zasilkovna-points` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/suppliers/[id]/reviews` | GET | N/A | N/A (public) | ✅ | |
| ✅ | `/api/suppliers/[id]/review` | POST | ✅ | ✅ | ✅ | |
| ⚠️ | `/api/materials/business-card` | GET | N/A | ✅ | ❌ | Chybí try/catch |
| ⚠️ | `/api/materials/email-signature` | GET | N/A | ✅ | ❌ | Chybí try/catch |
| ⚠️ | `/api/materials/sales-presentation` | GET | N/A | ✅ | ❌ | Chybí try/catch |

### 3.19 Settings (5 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/settings/password` | PUT | ✅ | ✅ | ✅ | PUT místo POST |
| ✅ | `/api/settings/bank-account` | PUT | ✅ | ✅ | ✅ | PUT místo POST |
| ✅ | `/api/settings/notifications` | GET,PUT | ✅ | ✅ | ✅ | PUT místo POST |
| ✅ | `/api/settings/export` | GET | N/A | ✅ | ✅ | Plán říká POST, je GET |
| ⚠️ | `/api/settings/delete-account` | POST | ❌ | ✅ | ✅ | Plán říká DELETE, je POST; chybí Zod |

### 3.20 Email System (4 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/emails/history/[vehicleId]` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/emails/preview` | GET | ✅ | ✅ | ✅ | Plán říká POST, je GET |
| ✅ | `/api/emails/send` | POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/emails/templates` | GET | N/A | ✅ | ✅ | |

### 3.21 Onboarding (4 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/onboarding/profile` | PUT | ✅ | ✅ | ✅ | PUT místo POST |
| ⚠️ | `/api/onboarding/documents` | POST | ❌ | ✅ | ✅ | File upload — chybí Zod |
| ✅ | `/api/onboarding/contract` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/onboarding/quiz` | POST | ✅ | ✅ | ✅ | |

### 3.22 Feeds (7 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/feeds/sauto.xml` | GET | N/A | N/A (public) | ✅ | XML feed |
| ✅ | `/api/feeds/bazos.xml` | GET | N/A | N/A (public) | ✅ | XML feed |
| ✅ | `/api/feeds/tipcars.xml` | GET | N/A | N/A (public) | ✅ | XML feed |
| ✅ | `/api/feeds/import/config` | GET,POST | ✅ | ✅ | ✅ | |
| ✅ | `/api/feeds/import/config/[id]` | PATCH,DELETE | ✅ | ✅ | ✅ | Plán říká GET/PATCH — má PATCH+DELETE |
| ✅ | `/api/feeds/import/logs` | GET | N/A | ✅ | ✅ | |
| ✅ | `/api/feeds/import/run` | POST | ✅ | ✅ | ✅ | |

### 3.23 Cron Jobs (13 routes)

| Status | Endpoint | Metody | Zod | Auth | Try/Catch | Poznámky |
|--------|----------|--------|-----|------|-----------|----------|
| ✅ | `/api/cron/daily-summary` | POST | N/A | CRON_SECRET ✅ | ✅ | Plán říká GET, je POST |
| ✅ | `/api/cron/exclusive-expiry` | GET | N/A | CRON_SECRET ✅ | ✅ | |
| ✅ | `/api/cron/feed-import` | GET | N/A | CRON_SECRET ✅ | ✅ | |
| ✅ | `/api/cron/listing-expiry` | GET | N/A | CRON_SECRET ✅ | ✅ | |
| ✅ | `/api/cron/part-request-expiry` | GET | N/A | CRON_SECRET ✅ | ✅ | |
| ✅ | `/api/cron/quick-draft-expiry` | GET | N/A | CRON_SECRET ✅ | ✅ | |
| ✅ | `/api/cron/reservation-expiry` | GET | N/A | CRON_SECRET ✅ | ✅ | |
| ✅ | `/api/cron/reservation-part-expiry` | GET | N/A | CRON_SECRET ✅ | ✅ | |
| ✅ | `/api/cron/sla-check` | GET | N/A | CRON_SECRET ✅ | ✅ | |
| ✅ | `/api/cron/stale-vehicles` | GET | N/A | CRON_SECRET ✅ | ✅ | |
| ✅ | `/api/cron/stock-alerts` | GET | N/A | CRON_SECRET ✅ | ✅ | |
| ✅ | `/api/cron/upsell-check` | GET | N/A | CRON_SECRET ✅ | ✅ | |
| ✅ | `/api/cron/watchdog-match` | GET | N/A | CRON_SECRET ✅ | ✅ | |

---

## SEZNAM: POST/PATCH/PUT ROUTES BEZ ZOD VALIDACE (41)

> Tyto endpointy přijímají data od klienta, ale nemají explicitní Zod schéma pro vstup.
> Některé jsou legitimní (file uploady, jednoduché akce bez body), ale většina by měla mít validaci.

### Akce bez body (nízké riziko)
1. `/api/admin/brokers/[id]/activate` — PUT (toggle, nepotřebuje body)
2. `/api/admin/feeds/[id]/import` — POST (trigger, nepotřebuje body)
3. `/api/admin/send-verification-emails` — POST (batch akce)
4. `/api/blog/articles/[id]/publish` — POST (toggle)
5. `/api/broker/tour-complete` — POST (toggle)
6. `/api/manager/brokers/[id]/deactivate` — POST (toggle)
7. `/api/marketplace/notifications/[id]/read` — PUT (toggle)
8. `/api/marketplace/notifications/read-all` — PUT (toggle)
9. `/api/partners/[id]/activate` — POST (toggle)
10. `/api/payments/[id]/confirm` — PUT (trigger)
11. `/api/payouts/broker/[id]/approve` — PUT (trigger)
12. `/api/reputation/recalculate` — POST (trigger)
13. `/api/reservations/[id]/cancel` — POST (trigger)
14. `/api/settings/delete-account` — POST (trigger)
15. `/api/csp-report` — POST (browser CSP report)
16. `/api/cron/daily-summary` — POST (cron trigger)

### File uploady (medium riziko)
17. `/api/listings/[id]/images` — POST (multipart file upload)
18. `/api/parts/import` — POST (CSV import)
19. `/api/upload` — POST (generic file upload)
20. `/api/onboarding/documents` — POST (document upload)

### S body ale BEZ Zod (vyšší riziko ⚠️)
21. `/api/admin/brokers/[id]/reject` — POST (reason field?)
22. `/api/admin/orders` — PATCH (status update)
23. `/api/admin/users/[id]/password` — PUT (password change!)
24. `/api/admin/users` — PATCH (role/status change)
25. `/api/auth/partner-onboarding` — PATCH (profile data)
26. `/api/auth/supplier-onboarding` — PATCH (profile data)
27. `/api/comments/[id]` — PATCH (content edit)
28. `/api/contracts/[id]/send` — POST (email params?)
29. `/api/donor-vehicles/[id]` — PUT (update data)
30. `/api/favorites` — POST (vehicleId/listingId)
31. `/api/garage/[id]` — PUT (update)
32. `/api/listings/[id]/extend` — POST (duration?)
33. `/api/partner/orders/[id]/pdf` — POST (PDF params)
34. `/api/partner/parts` — POST (create part)
35. `/api/partner/profile` — PUT (profile update)
36. `/api/partner/vehicles` — POST (create vehicle)
37. `/api/payments/webhook` — POST (Stripe signature validates)
38. `/api/stripe/connect/dashboard-link` — POST (account params)
39. `/api/stripe/connect/onboard-link` — POST (account params)
40. `/api/stripe/webhook` — POST (Stripe signature validates)
41. `/api/vehicles/[id]/cebia` — POST (VIN data)

---

## SEZNAM: ROUTES BEZ TRY/CATCH (14)

| # | Route | Závažnost |
|---|-------|-----------|
| 1 | `/api/admin/career` | ⚠️ GET-only, nízké riziko |
| 2 | `/api/admin/reviews` | ⚠️ GET+POST |
| 3 | `/api/admin/team` | ⚠️ GET+POST |
| 4 | `/api/auth/[...nextauth]` | ✅ NextAuth handler — interní |
| 5 | `/api/auth/verify-email/[token]` | ⚠️ GET, veřejný |
| 6 | `/api/broker/tour-complete` | ⚠️ POST |
| 7 | `/api/donor-vehicles/[id]` | ⚠️ GET+PUT+DELETE |
| 8 | `/api/donor-vehicles` | ⚠️ GET+POST |
| 9 | `/api/materials/business-card` | ⚠️ GET |
| 10 | `/api/materials/email-signature` | ⚠️ GET |
| 11 | `/api/materials/sales-presentation` | ⚠️ GET |
| 12 | `/api/tecdoc/parts-for-vehicle` | ⚠️ POST (external API call!) |
| 13 | `/api/tecdoc/vin-to-ktype` | ⚠️ POST (external API call!) |
| 14 | `/api/vehicles/[id]/workflow` | ⚠️ GET+PUT |

---

## SEZNAM: CHYBĚJÍCÍ HTTP METODY vs PLÁN (7 kritických)

| # | Route | Plán říká | Skutečnost | Chybí |
|---|-------|-----------|------------|-------|
| 1 | `/api/leads` | GET/POST | GET | **POST** |
| 2 | `/api/leads/[id]` | GET/PATCH | GET | **PATCH** |
| 3 | `/api/admin/users/[id]` | GET/PATCH | DELETE | **GET, PATCH** |
| 4 | `/api/reservations` | GET/POST | GET | **POST** |
| 5 | `/api/contracts/[id]` | GET/PATCH | GET | **PATCH** |
| 6 | `/api/suborders/[id]` | GET/PATCH | GET | **PATCH** |
| 7 | `/api/manager/bonuses` | POST | GET | **POST** (má GET místo POST) |

---

## POZITIVNÍ NÁLEZY ✅

1. **Všech 293 route.ts souborů existuje** — 100% pokrytí
2. **Všech 13 cron jobů má CRON_SECRET** autorizaci — žádný veřejně přístupný
3. **Oba Stripe webhooky mají constructEvent** (signature validaci) — bezpečné
4. **Revalidate endpoint používá timing-safe compare** — bezpečné
5. **95.2% routes má try/catch** — dobrý error handling
6. **Všechny admin/manager/broker routes mají session auth** — žádný nezabezpečený admin endpoint
7. **Veřejné endpointy dávají smysl** — kontaktní formulář, hledání, XML feedy, token-based tracking
8. **NextAuth handler správně re-exportuje** GET i POST

---

## DOPORUČENÍ PRO OPRAVU (prioritizované)

### P0 — Kritické (chybějící funkčnost)
1. Doimplementovat POST `/api/leads` (vytvoření leadu)
2. Doimplementovat PATCH `/api/leads/[id]` (editace leadu)
3. Doimplementovat GET+PATCH `/api/admin/users/[id]` (detail/editace uživatele)
4. Doimplementovat POST `/api/reservations` (vytvoření rezervace)
5. Doimplementovat PATCH `/api/contracts/[id]` (editace smlouvy)
6. Doimplementovat POST `/api/manager/bonuses` (vytvoření bonusu)

### P1 — Důležité (bezpečnost)
7. Přidat Zod validaci na `/api/admin/users/[id]/password` (PUT bez validace hesla!)
8. Přidat Zod na `/api/auth/partner-onboarding` a `/api/auth/supplier-onboarding`
9. Přidat Zod na `/api/partner/parts` POST a `/api/partner/vehicles` POST
10. Přidat Zod na `/api/donor-vehicles/[id]` PUT

### P2 — Kvalita (error handling)
11. Přidat try/catch na `/api/tecdoc/*` (external API calls bez error handling!)
12. Přidat try/catch na `/api/donor-vehicles/*`
13. Přidat try/catch na `/api/vehicles/[id]/workflow`
14. Přidat try/catch na `/api/materials/*`

### P3 — Nice-to-have
15. Sjednotit PUT vs PATCH (konzistence HTTP metod)
16. Přidat Zod na zbývající POST toggle endpointy

---

*Audit dokončen: 2026-05-03*
*Auditor: Evžen (kontrolor zadání)*
*Celkem auditováno: 293 route souborů, ~350+ HTTP metod*
