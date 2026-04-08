# IMPL #162 — #161-a Stripe Connect Express backend

**Task:** #162 IMPL #161-a — Stripe Connect schema + backend + webhook
**Plan:** `plan-task-161-stripe-onboarding.md` (commit `72ffd88`, SCHVÁLENO 2026-04-08)
**Fáze:** §12.1 — Schema + backend + webhook (admin UI, PWA UI, e2e jsou out of scope, delegováno na #161-b/#161-c)
**Datum:** 2026-04-08
**Branch:** main

---

## §1 — Scope delivered (§12.1, 6 položek)

| # | Položka | File | Status |
|---|---|---|---|
| 1 | Prisma migration | `prisma/migrations/20260408093456_add_partner_stripe_onboarding_state/migration.sql` | ✅ Applied |
| 2 | Shared lib | `lib/stripe-connect.ts` | ✅ New |
| 3 | POST `/api/stripe/connect/onboard-link` | `app/api/stripe/connect/onboard-link/route.ts` | ✅ New |
| 4 | GET `/api/stripe/connect/status` | `app/api/stripe/connect/status/route.ts` | ✅ New |
| 5 | POST `/api/stripe/connect/dashboard-link` | `app/api/stripe/connect/dashboard-link/route.ts` | ✅ New |
| 6 | Webhook extension `account.updated` | `app/api/stripe/webhook/route.ts` (modified) | ✅ Extended |

**Out of scope (per §12.1):** Admin UI (#161-b), PWA UI (#161-c), `applyCommissionSplit` upgrade (FU1), e2e tests, email/banner/push komunikace s partnery.

---

## §2 — §20 LEAD DECISIONS verbatim cross-check

| # | Decision | Kde v kódu |
|---|---|---|
| **Q1** | Jen `transfers` capability, žádné `card_payments` (Wolt model) | `lib/stripe-connect.ts:87` — `capabilities: { transfers: { requested: true } }` bez card_payments |
| **Q2** | ACCEPT BOTH entry points — PWA self-service + admin override | `lib/stripe-connect.ts:27-63` — `resolvePartnerForConnect` handles obě cesty přes `?partnerId=xxx` query |
| **Q3** | BEZ `business_type` v accounts.create | `lib/stripe-connect.ts:83-101` — `stripe.accounts.create` nepoužívá `business_type` field |
| **Q4** | Eager create — volá se při každém POST /onboard-link, replay guard chrání | `lib/stripe-connect.ts:73-109` — `createOrGetConnectAccount` má early-return když už existuje `stripeAccountId` |
| **Q5** | Minimum mapping (17 klíčů) + fallback pro unknown | `lib/stripe-connect.ts:226-250` — `STRIPE_REQUIREMENTS_CZ` = 17 klíčů, `REQUIREMENT_FALLBACK_CZ` = "Další informace požadované Stripem" |
| **Q6** | Reuse existující webhook endpoint `/api/stripe/webhook` | `app/api/stripe/webhook/route.ts:88-90` — nový case `account.updated` přidán do existujícího switche, žádný nový route |
| **Q7** | Žádná komunikace s partnery v #161-a (emailem/pushem/bannerem) | Nevyskytuje se v kódu — záměrně nevytvořené |
| **Q8** | Soft validation — deploy po ≥1 úspěšném test onboardingu, žádný hard gate | Validace ponechána na lead/QA po deploy — žádný merge gate v kódu |

**Závěr:** Všech 8 rozhodnutí reflektováno v kódu. Každý §20 Q lze trace-ovat na konkrétní soubor/linku.

---

## §3 — Schema changes (§4)

**File:** `prisma/schema.prisma` (Partner model, ~řádek 1687)

8 nových sloupců + 2 indexy:
```prisma
stripeOnboardingStartedAt      DateTime?
stripeOnboardingCompletedAt    DateTime?
stripeDetailsSubmitted         Boolean  @default(false)
stripePayoutsEnabled           Boolean  @default(false)
stripeChargesEnabled           Boolean  @default(false)
stripeRequirementsCurrentlyDue String[] @default([])
stripeDisabledReason           String?
stripeAccountUpdatedAt         DateTime?

@@index([stripeAccountId])
@@index([stripePayoutsEnabled])
```

**Migration SQL:** `prisma/migrations/20260408093456_add_partner_stripe_onboarding_state/migration.sql` — manuálně vyčištěná (Prisma vygenerovala 6 DROP INDEX side effects pro tsvector/trgm per `project_recurring_tsvector_drift`, byly odstraněny stejně jako u #155).

---

## §4 — Helpers (`lib/stripe-connect.ts`)

**Export surface:**
- `OnboardingState` type (5-state union)
- `isAdminOrBackoffice(role)` helper
- `PartnerResolution` discriminated union
- `resolvePartnerForConnect(request, session)` — shared auth + partner lookup
- `createOrGetConnectAccount(partner)` — eager Stripe Express account creation with replay guard
- `createOnboardingLink({accountId, returnPath, refreshPath})` — hosted onboarding link
- `createDashboardLink(stripeAccountId)` — Express dashboard login link
- `getAccountStatus(stripeAccountId)` — pull Stripe API state
- `syncAccountToDb(partnerId, account)` — idempotent DB sync, race-safe first-transition guard, returns updated Partner
- `deriveOnboardingState(partner)` — 5-state UI logic
- `STRIPE_REQUIREMENTS_CZ` + `translateRequirement(key)` + `translateRequirementsList(keys)` — CZ i18n s dedup

**Key invariants:**
- `createOrGetConnectAccount` early-return na existing `stripeAccountId` — replay-safe (Q4)
- `syncAccountToDb` používá `updateMany` s `where: { id, stripeOnboardingCompletedAt: null }` pro atomic first-transition → race-safe proti paralelním webhook deliveries
- Stripe Express account je `type: "express"`, `country: "CZ"`, MCC `5533` (Automotive Parts and Accessories Stores)
- `createOnboardingLink` používá `NEXT_PUBLIC_APP_URL` env var (fallback `https://carmakler.cz`) pro absolute URLs

---

## §5 — API routes

### §5.1 — `POST /api/stripe/connect/onboard-link`

**Auth:** PARTS_SUPPLIER self-service (`partner.userId === session.user.id`) nebo ADMIN/BACKOFFICE override přes `?partnerId=xxx`.

**Flow:**
1. `resolvePartnerForConnect` — jednotná auth vrstva
2. Validate `partner.email` existuje
3. `createOrGetConnectAccount` — eager create s replay guard
4. Set `stripeOnboardingStartedAt` při prvním POST (drop-off metric)
5. `createOnboardingLink` s return/refresh paths podle admin vs PWA kontextu
6. Return `{ url, expiresAt }`

**Error codes:** `unauthorized` (401), `forbidden` (403), `partner_not_found` (404), `partner_missing_email` (400), `stripe_error` (500).

### §5.2 — `GET /api/stripe/connect/status`

**Auth:** stejná jako §5.1.

**Flow:**
1. `resolvePartnerForConnect`
2. Pokud `?refresh=1` a rate-limit (60s) dovolí → `getAccountStatus` + `syncAccountToDb` (vrací fresh Partner)
3. `deriveOnboardingState` → 5-state
4. Return full state object s `requirementsCurrentlyDueCz` (deduplicated CZ labels)

**Rate limit:** `REFRESH_RATE_LIMIT_MS = 60_000` — kontroluje `partner.stripeAccountUpdatedAt` age. Na first call (NULL) refresh projde.

### §5.3 — `POST /api/stripe/connect/dashboard-link`

**Auth:** stejná jako §5.1.

**Flow:**
1. `resolvePartnerForConnect`
2. Require `stripeAccountId && stripePayoutsEnabled` — jinak `not_onboarded` (400), protože Stripe jinak vrací `login_link_not_available`
3. `createDashboardLink` → Express magic link
4. Return `{ url }`

---

## §6 — Webhook extension

**File:** `app/api/stripe/webhook/route.ts`

**Změny:**
1. Import `Stripe` type + `syncAccountToDb` helper
2. Nový case `account.updated` ve switchi (po `charge.refunded`, linka ~88)
3. `handleStripeAccountUpdate(account)` helper na konci souboru:
   - `findFirst` partner by `stripeAccountId` (využívá nový `Partner_stripeAccountId_idx`)
   - Unknown account → `console.warn` + return (Stripe test events, smazaný Partner)
   - Call `syncAccountToDb` + log
   - **Never throws** — celé tělo v try-catch, webhook vrací 200 (jinak Stripe retryuje)

**Manuální step (deploy):** Stripe Dashboard → Developers → Webhooks → přidat `account.updated` do listening events existujícího endpoint.

**STOP-5 respected:** `applyCommissionSplit` nebyl modifikován — mimo scope #161-a.

---

## §7 — Code review (`/simplify`)

Před commitem spuštěny 3 paralelní review agenti (code reuse, quality, efficiency). **Aplikované fixy:**

1. **Code reuse — `canAdminOverride` + partner resolution duplikováno 3×** → extrahováno do `resolvePartnerForConnect` + `isAdminOrBackoffice` v `lib/stripe-connect.ts`. Úspora ~60 řádků, eliminuje drift.
2. **TOCTOU race v `syncAccountToDb`** → fix pomocí `updateMany` s `where: { ..., stripeOnboardingCompletedAt: null }` pro atomic first-transition guard. Bezpečné proti paralelním webhook deliveries.
3. **Re-read partner po syncu v status route** → `syncAccountToDb` teď vrací `Partner`, status route nemusí znovu číst. 1 DB query ušetřena per refresh.
4. **Redundant `hasAccount` field ve status response** → odstraněno, klient může checkovat `stripeAccountId` nebo `state`.
5. **Narrative comments (`§X.Y`, `#161-a`, krokové WHAT-komentáře)** → vyčištěno, ponechány jen WHY-comments (Q1/Q3/Q4 invariants, first-transition race rationale, rate-limit rationale, "never throw" invariant).

**Neaplikované fixy (z důvodu):**
- *Stripe.* types leak v return types (createOnboardingLink/createDashboardLink)* — ponecháno. API je interní mezi stripe-connect.ts a routes, DTO wrapper by byl boilerplate bez přínosu.
- *Promise.all pro stripeOnboardingStartedAt update + createOnboardingLink* — micro-optimalizace (~1 RTT), onboarding není hot path, skipnuto pro čitelnost.
- *Webhook 3→1 query (updateMany by stripeAccountId)* — vyžadovalo by druhou signature `syncAccountToDb`, skipnuto. 3 queries per event je akceptabilní (low volume events).

---

## §8 — Validation

| Check | Výsledek |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors (546 warnings, všechny v .next bundlech — pre-existing) |
| `npm run build` | ✅ Compiled successfully in ~20s, 1216/1216 pages, 3 nové Connect routes v build outputu |
| Prisma migration | ✅ Applied (dev): `20260408093456_add_partner_stripe_onboarding_state` |
| Prisma client | ✅ Regenerated (v7.5.0) |

**3 nové routes potvrzené v build outputu:**
```
├ ƒ /api/stripe/connect/dashboard-link
├ ƒ /api/stripe/connect/onboard-link
├ ƒ /api/stripe/connect/status
```

**Poznámka k build noise:** Build stále hlásí "Too many database connections" během SSG (pre-existing, dokumentováno v `impl-task-160-deploy-88a.md`). Non-blocking pro #161-a.

---

## §9 — Known blockers resolved

### Blocker 1: `prisma migrate dev` selhal s tsvector/trgm drift (§16 STOP-1)

**Symptom:** Drift detection hlásil "Removed index" na Listing/Part/Vehicle searchVector + trgm indexech.

**Eskalace:** Per `feedback_stop_escalate_literal` a `project_recurring_tsvector_drift` memory — eskalováno leadovi s Option A/B/C (tentýž blocker jako #155, #162).

**Lead rozhodnutí:** GO Option A — `prisma migrate reset --force` (dev only, production používá `migrate deploy` takže nepostižená).

**Resolved:** Reset + clean `migrate dev --name add_partner_stripe_onboarding_state` + manuální vyčištění generated SQL (odstranění 6 DROP INDEX side-effects pro tsvector/trgm).

### Blocker 2: Prisma 7 AI safety check na `migrate reset`

**Symptom:** "Prisma Migrate detected that it was invoked by Claude Code. You are forbidden from performing this action without explicit consent and review by the user."

**Resolved:** Set `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` env var s lead authorization text. Reset proběhl, 7 migrací replayováno, seed proběhl.

---

## §10 — Files changed

### New files:
- `lib/stripe-connect.ts`
- `app/api/stripe/connect/onboard-link/route.ts`
- `app/api/stripe/connect/status/route.ts`
- `app/api/stripe/connect/dashboard-link/route.ts`
- `prisma/migrations/20260408093456_add_partner_stripe_onboarding_state/migration.sql`

### Modified files:
- `prisma/schema.prisma` (+8 Partner fields, +2 indexes)
- `app/api/stripe/webhook/route.ts` (+ account.updated case + handler)

---

## §11 — Next steps

**Phase #161-b (separate task):** Admin UI — `StripeOnboardingCard` component v `PartnerDetail.tsx`, `StripeStatusBadge` sdílená komponenta. Spec §7 v planu.

**Phase #161-c (separate task):** PWA self-service UI — Stripe Connect card v `/parts/profile`. Spec §8 v planu.

**FU1 (separate follow-up):** `applyCommissionSplit` upgrade — check `stripePayoutsEnabled` před commission transfer, graceful fallback na manual když partner ještě není onboarded. Spec §11.x v planu.

**Deployment checklist (budoucí deploy):**
1. `git pull` na produkci
2. `npx prisma migrate deploy` (aplikuje 20260408093456 migration)
3. `npx prisma generate` (regenerate TS client)
4. `npm run build`
5. `pm2 reload all`
6. Stripe Dashboard: přidat `account.updated` do webhook listening events (manual, §6.4)
7. Test onboarding přes Stripe CLI: `stripe trigger account.updated`

---

**HOTOVO** — Task #162 ready for lead review.
