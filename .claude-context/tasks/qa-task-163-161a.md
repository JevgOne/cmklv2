# QA Task #163 — #161-a Stripe Connect Express backend (commit `2bf0657`)

**Commit:** `2bf0657 feat(#161-a): Stripe Connect Express backend — schema, helpers, API routes, webhook`
**Branch:** `main`
**QA agent:** KONTROLOR
**Datum:** 2026-04-08
**Ref impl:** `.claude-context/tasks/impl-task-162-161a.md`

---

## §1 — Scope

| Fáze | Oblast | QA |
|------|--------|-----|
| #161-a | Schema (8 sloupců + 2 indexy) | ✅ |
| #161-a | `lib/stripe-connect.ts` helper library | ✅ |
| #161-a | POST `/api/stripe/connect/onboard-link` | ✅ |
| #161-a | GET `/api/stripe/connect/status` | ✅ |
| #161-a | POST `/api/stripe/connect/dashboard-link` | ✅ |
| #161-a | Webhook `account.updated` extension | ✅ |
| ~~#161-b~~ | ~~Admin UI Card~~ | Out of scope |
| ~~#161-c~~ | ~~PWA UI Card~~ | Out of scope |
| ~~FU1~~ | ~~applyCommissionSplit upgrade~~ | Out of scope |

---

## §2 — Files reviewed

| Soubor | Typ | Status |
|--------|-----|--------|
| `prisma/schema.prisma` (+12 ř.) | Modified | ✅ |
| `prisma/migrations/20260408093456_add_partner_stripe_onboarding_state/migration.sql` | New | ✅ |
| `lib/stripe-connect.ts` (261 ř.) | New | ✅ |
| `app/api/stripe/connect/onboard-link/route.ts` (79 ř.) | New | ✅ |
| `app/api/stripe/connect/status/route.ts` (79 ř.) | New | ✅ |
| `app/api/stripe/connect/dashboard-link/route.ts` (55 ř.) | New | ✅ |
| `app/api/stripe/webhook/route.ts` (+41 ř.) | Modified | ✅ |

---

## §3 — §20 LEAD DECISIONS cross-check (8 Q)

| Q | Decision | Implementace | Status |
|---|----------|-------------|--------|
| Q1 | Jen `transfers` capability, žádné `card_payments` | `capabilities: { transfers: { requested: true } }` v `createOrGetConnectAccount` (L87-89) — žádné `card_payments` | ✅ |
| Q2 | ACCEPT BOTH entry points (self-service + admin override) | `resolvePartnerForConnect`: `?partnerId=xxx` → ADMIN/BACKOFFICE cesta; bez query → PARTS_SUPPLIER self-service | ✅ |
| Q3 | BEZ `business_type` v accounts.create | `stripe.accounts.create` neobsahuje `business_type` (L83-101) | ✅ |
| Q4 | Eager create per request, replay-safe | `createOrGetConnectAccount` early-return na existující `stripeAccountId` (L76); volán při každém POST | ✅ |
| Q5 | Min 17 klíčů + fallback + dedup | `STRIPE_REQUIREMENTS_CZ` = **17 klíčů** (grep ověřeno), `REQUIREMENT_FALLBACK_CZ` = "Další informace požadované Stripem", `translateRequirementsList` s `Array.from(new Set(...))` | ✅ |
| Q6 | Reuse existující webhook endpoint | `account.updated` přidán do existujícího `switch(event.type)` — žádný nový route soubor | ✅ |
| Q7 | Žádná komunikace s partnery (email/push/banner) | grep: 0 výsledků pro email-send/push/notify v nových souborech — `email` field je jen pro Stripe API | ✅ |
| Q8 | Žádný hard merge gate kód | grep: 0 výsledků pro `completedCount`, `< N`, hard threshold — soft validation ponechána na team-lead post-deploy | ✅ |

---

## §4 — Code quality

### `lib/stripe-connect.ts`

**Export surface (11 exportů):**
- `OnboardingState` type union (5 stavů: not_started/in_progress/complete/action_required/disabled) ✅
- `isAdminOrBackoffice(role)` helper ✅
- `PartnerResolution` discriminated union `{ ok: true, partner, isAdmin } | { ok: false, error, status }` ✅
- `resolvePartnerForConnect(request, session)` ✅
- `createOrGetConnectAccount(partner)` ✅
- `createOnboardingLink(params)` ✅
- `createDashboardLink(stripeAccountId)` ✅
- `getAccountStatus(stripeAccountId)` ✅
- `syncAccountToDb(partnerId, account)` ✅
- `deriveOnboardingState(partner)` ✅
- `STRIPE_REQUIREMENTS_CZ`, `translateRequirement()`, `translateRequirementsList()` ✅

**TOCTOU race fix:**
```typescript
if (nowComplete) {
  await prisma.partner.updateMany({
    where: { id: partnerId, stripeOnboardingCompletedAt: null },
    data: { stripeOnboardingCompletedAt: now },
  });
}
```
✅ Atomic no-op pokud `stripeOnboardingCompletedAt` už bylo nastaveno jiným paralelním webhook deliverym. `updateMany` s conditional WHERE je Prisma-safe.

**deriveOnboardingState pořadí:**
1. `!stripeAccountId` → not_started ✅
2. `stripeDisabledReason` → disabled ✅ (Stripe zablokoval, priorita nad payouts)
3. `stripePayoutsEnabled` → complete ✅
4. `stripeRequirementsCurrentlyDue.length > 0` → action_required ✅
5. fallback → in_progress ✅

Pořadí je správné — disabled má prioritu před payoutsEnabled (edge case kde Stripe disabluje i po completion).

**Code smells:**
- TypeScript `any`: 0 (grep ověřen — "any" výskyty jsou substrings v "updateMany") ✅
- `@ts-ignore`: 0 ✅
- `console.log`: 0 (pouze `console.error` a `console.warn`) ✅
- Mocking: 0 ✅

### `app/api/stripe/connect/onboard-link/route.ts`

```
Auth flow:
1. getServerSession → 401 bez session ✅
2. resolvePartnerForConnect → 401/403/404 ✅
3. partner.email check → 400 (partner_missing_email) ✅
4. createOrGetConnectAccount (eager, replay-safe) ✅
5. stripeOnboardingStartedAt marker (drop-off metric) ✅
6. context-aware return/refresh paths (admin vs PWA) ✅
7. return { url, expiresAt } ✅
```

**Double email check:** Route kontroluje `partner.email` PŘED `createOrGetConnectAccount`, který interně email taky kontroluje. Redundance je záměrná — route poskytuje specifický error code `partner_missing_email` (400), library by vyhodila Error → 500. ✅

### `app/api/stripe/connect/status/route.ts`

```typescript
const shouldRefresh = url.searchParams.get("refresh") === "1" && !!partner.stripeAccountId;
```
✅ Podmínka `!!partner.stripeAccountId` chrání non-null assertion `partner.stripeAccountId!` uvnitř bloku. Logicky bezpečné.

```typescript
if (Date.now() - lastSync >= REFRESH_RATE_LIMIT_MS) { ... }
// lastSync = partner.stripeAccountUpdatedAt?.getTime() ?? 0
```
✅ Na prvním volání (NULL) `lastSync = 0` → `Date.now() - 0 >= 60000` vždy true → refresh projde. Správné chování. ✅

**Rate limit:** `REFRESH_RATE_LIMIT_MS = 60_000` ✅

**Response fields:** state, stripeAccountId, detailsSubmitted, payoutsEnabled, chargesEnabled, requirementsCurrentlyDue, requirementsCurrentlyDueCz, disabledReason, startedAt, completedAt, updatedAt — kompletní ✅

### `app/api/stripe/connect/dashboard-link/route.ts`

```typescript
if (!partner.stripeAccountId || !partner.stripePayoutsEnabled) {
  return NextResponse.json({ error: "not_onboarded" }, { status: 400 });
}
```
✅ `payoutsEnabled` precondition zabraňuje Stripe error `login_link_not_available`. ✅

### Webhook extension

```typescript
case "account.updated": {
  await handleStripeAccountUpdate(event.data.object as Stripe.Account);
  break;
}
```
✅ Existující `switch` rozšířen o nový case — Q6 splněn.

```typescript
async function handleStripeAccountUpdate(account: Stripe.Account) {
  try {
    const partner = await prisma.partner.findFirst({...});
    if (!partner) { console.warn(...); return; }
    await syncAccountToDb(partner.id, account);
    console.log(...);
  } catch (error) {
    console.error(...);
  }
}
```
✅ Never throws (celé tělo v try-catch) ✅ Unknown account → warn + return (Stripe test events) ✅ Log po úspěšném sync ✅

**applyCommissionSplit zachován:** `git show 2bf0657 -- app/api/stripe/webhook/route.ts | grep "^-"` → 0 removed lines → funkcionalita #88a beze změn ✅

---

## §5 — Out-of-scope audit

| Item | Výsledek |
|------|----------|
| Admin UI Card (`StripeOnboardingCard` v PartnerDetail) | ✅ ABSENT — žádná změna v `components/admin/` |
| PWA Card (`/parts/profile`) | ✅ ABSENT — žádná změna v `app/(pwa-parts)/` |
| `applyCommissionSplit` modifikace | ✅ ABSENT — 0 deleted lines v webhook diff |
| Email template/Resend call | ✅ ABSENT — grep 0 výsledků |
| Push notification | ✅ ABSENT |
| E2E testy | ✅ ABSENT (deferred na #161-c) |
| Competitor scraping | ✅ ABSENT |

Commit stats: **8 files, 779 insertions, 0 deletions** — čistě aditivní, žádný out-of-scope obsah.

---

## §6 — Memory compliance

| Memory pravidlo | Status |
|----------------|--------|
| `feedback_stop_escalate_literal` — STOP-1 (tsvector drift) eskalován na lead | ✅ Impl report §9: GO Option A autorizováno leadem |
| `feedback_no_competitor_scraping` — žádný scraping kód | ✅ |
| `project_wolt_model_platform_wide` — Wolt model (transfers only, no card_payments) | ✅ Q1 potvrzeno |
| `project_vrakoviste_business_model` — free tool + commission, PARTS_SUPPLIER self-service | ✅ Q2 dual entry point |
| Žádný git history rewrite po HOTOVO report | ✅ |

---

## §7 — Build/lint/tsc

| Check | Výsledek |
|-------|---------|
| `npm run lint` | ✅ 0 errors, 546 warnings (viz Observation #1) |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx prisma validate` | ✅ "The schema at prisma/schema.prisma is valid 🚀" |
| `npm run build` (impl report) | ✅ 1216/1216, 3 nové routes v manifestu (`ƒ` server functions) |
| Prisma migrate status | N/A bez live DB; impl report: "Applied" |

**3 routes potvrzeny v build:**
```
├ ƒ /api/stripe/connect/dashboard-link
├ ƒ /api/stripe/connect/onboard-link
├ ƒ /api/stripe/connect/status
```

---

## §8 — Observations

| # | Severity | Popis |
|---|----------|-------|
| OBS-1 | Minor | Lint warnings: 546 (oproti baseline 543 z #87d QA). Delta +3 je pre-existing z #88a build cycle (sw.js minified service worker). Impl report #88a a #161-a oba uvádí 546. 0 errors. |
| OBS-2 | Minor | `createOnboardingLink`/`createDashboardLink` vrací Stripe native types (`AccountLink`, `LoginLink`). Impl report to záměrně ponechává — interní API, DTO wrapper by byl boilerplate. |
| OBS-3 | Minor | SSG count 1216 (bylo 1213 po #88a). +3 = 3 nové API route shells v build manifestu. Expected — Next.js 15 počítá i dynamic `ƒ` routes. |
| OBS-4 | Observation | `stripeOnboardingStartedAt` se nastavuje jen při prvním POST onboard-link (drop-off metric). Pokud partner přijde z admin override, `isAdmin` flag je true ale StartedAt se stále nastaví. Toto je záměrné chování (každý pokus = drop-off metric start). |

---

## §9 — Verdict

### ✅ PASS with observations — 0 blockers

Commit `2bf0657` implementuje #161-a Stripe Connect Express backend kompletně a správně.

**Klíčové:**
- Všech 8 §20 LEAD DECISIONS Q1-Q8 verbatim splněny
- TOCTOU race fix v `syncAccountToDb` je správný (updateMany s conditional WHERE)
- Webhook MUSÍ never throw — implementace tohle dodržuje (outer try-catch + per-case)
- Replay guard (early return na existující stripeAccountId) je bezpečný
- 60s rate limit pro status refresh logicky správný (první volání vždy projde)
- payoutsEnabled precondition v dashboard-link zabraňuje Stripe API error
- applyCommissionSplit beze změn (0 deleted lines)
- 0 out-of-scope code
- Lint/TSC/Prisma čisté

4 minor observations — žádný blocker.
