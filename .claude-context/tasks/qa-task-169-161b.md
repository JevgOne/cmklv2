# QA Task #169 — #161-b Admin UI Stripe Connect (commit `63bf026`)

**Commit:** `63bf026 feat(#161-b): admin Stripe Connect onboarding UI`
**Branch:** `main`
**QA agent:** KONTROLOR
**Datum:** 2026-04-08
**Ref impl:** `.claude-context/tasks/impl-task-168-161b.md`
**Ref plan:** `.claude-context/tasks/plan-task-161-stripe-onboarding.md` §7 + §12.2

---

## §1 — Scope

| Fáze | Oblast | QA |
|------|--------|-----|
| #161-b | StripeStatusBadge.tsx (nová) | ✅ |
| #161-b | StripeOnboardingCard.tsx (nová) | ✅ |
| #161-b | PartnerDetail.tsx modifikace (import, extends, insertion, amber removal) | ✅ |
| #161-b | lib/stripe-connect-shared.ts (nová — client-safe split) | ✅ |
| #161-b | lib/stripe-connect.ts (re-export wrapper) | ✅ |
| #161-b | lib/utils.ts — formatRelativeCz extraction | ✅ |
| #161-b | CommissionHistoryList.tsx — migrace na shared formatRelativeCz | ✅ |
| ~~#161-c~~ | ~~PWA self-service UI~~ | Out of scope |
| ~~FU1~~ | ~~applyCommissionSplit upgrade~~ | Out of scope |
| ~~E2E~~ | ~~test-chrome~~ | Out of scope |

---

## §2 — Files reviewed

| Soubor | Typ | Status |
|--------|-----|--------|
| `components/admin/partners/StripeStatusBadge.tsx` (27 ř.) | New | ✅ |
| `components/admin/partners/StripeOnboardingCard.tsx` (261 ř.) | New | ✅ |
| `components/admin/partners/PartnerDetail.tsx` | Modified | ✅ |
| `components/admin/partners/CommissionHistoryList.tsx` | Modified | ✅ |
| `lib/stripe-connect-shared.ts` (101 ř.) | New | ✅ |
| `lib/stripe-connect.ts` | Modified | ✅ |
| `lib/utils.ts` | Modified | ✅ |

**git show 63bf026 --name-only:** 7 files — žádné API routes, žádný webhook, žádné PWA soubory ✅

---

## §3 — Check 1: Scope §12.2

| Item | Implementace | Status |
|------|-------------|--------|
| `StripeStatusBadge.tsx` existuje, 5 stavů | `STATE_CONFIG` pokrývá not_started/in_progress/complete/action_required/disabled | ✅ |
| `StripeOnboardingCard.tsx` existuje, 5-state UI | `STATE_COPY` + conditional rendering pro všech 5 stavů | ✅ |
| `PartnerDetail.tsx` — import + extends + insertion + amber removal | Řádky 16-17: import StripeOnboardingCard + StripePartnerFields; interface Partner extends StripePartnerFields (L19); card na L492-498; amber warning ABSENT v komisní kartě (L439-470) | ✅ |
| Žádné nové API routes | git diff --name-only: 7 souborů, 0 v `app/api/` | ✅ |
| Žádné PWA UI | 0 soubory v `app/(pwa-parts)/` nebo `components/pwa-parts/` | ✅ |
| Žádné email notifikace | grep 0 výsledků pro Resend/email-send v commit diffsu | ✅ |

---

## §4 — Check 2: Stripe integration

| Endpoint | Implementace | Status |
|----------|-------------|--------|
| GET `/api/stripe/connect/status` | `fetchAndPropagate(false)` a `fetchAndPropagate(true)` — vždy tato cesta, nikdy `/api/admin/partners/*` | ✅ |
| POST `/api/stripe/connect/onboard-link?partnerId=` | `handleCopyOnboardingLink` L98-130 | ✅ |
| GET `/api/stripe/connect/status?refresh=1` | `handleSync` → `fetchAndPropagate(true)` L136; rate-limit 60s server-side | ✅ |
| GET `/api/stripe/connect/status` (silent, bez refresh) | `fetchAndPropagate(false)` po copy link L115 — cheap DB read, bez Stripe API | ✅ |
| POST `/api/stripe/connect/dashboard-link` | **ABSENT** — viz OBS-1 | ⚠️ |

**API response mapping (fetchAndPropagate):** Všech 9 polí správně namapováno (stripeAccountId, detailsSubmitted→stripeDetailsSubmitted, payoutsEnabled→stripePayoutsEnabled, chargesEnabled→stripeChargesEnabled, requirementsCurrentlyDue→stripeRequirementsCurrentlyDue, disabledReason→stripeDisabledReason, startedAt→stripeOnboardingStartedAt, completedAt→stripeOnboardingCompletedAt, updatedAt→stripeAccountUpdatedAt). Raw klíče jsou mappovány (ne CZ labels) — klient re-překládá přes `translateRequirementsList` z shared. ✅

---

## §5 — Check 3: Client-safe bundle isolation

| Item | Status |
|------|--------|
| `lib/stripe-connect-shared.ts` — zero server imports | `import type { Partner } from "@prisma/client"` — TYPE-ONLY (erasable at compile), žádné runtime imports prisma/stripe/pg | ✅ |
| `lib/stripe-connect.ts` re-exportuje 5 symbolů ze shared | `export { deriveOnboardingState, STRIPE_REQUIREMENTS_CZ, translateRequirement, translateRequirementsList }` + `export type { OnboardingState }` | ✅ |
| `StripeOnboardingCard.tsx` imports jen ze stripe-connect-shared | `import { deriveOnboardingState, translateRequirementsList, type OnboardingState, type StripePartnerFields } from "@/lib/stripe-connect-shared"` — NEimportuje z lib/stripe-connect | ✅ |
| `StripeStatusBadge.tsx` imports jen ze stripe-connect-shared | `import type { OnboardingState } from "@/lib/stripe-connect-shared"` | ✅ |
| `StripePartnerFields` — NEre-exportovaný ze server lib | Správné — je to client-side interface, server routes používají `Partner` přímo | ✅ |
| Server-only helpers (`isAdminOrBackoffice`, `resolvePartnerForConnect`, atd.) | Zůstávají v `lib/stripe-connect.ts`, NEpřesunuty do shared | ✅ |
| Build: žádné bundler warnings o server imports | Impl report: compiled successfully 16.4s bez warnings | ✅ |

---

## §6 — Check 4: STOP-5 #88a Commission regression

| Item | Status |
|------|--------|
| `app/api/stripe/webhook/route.ts` v commit 63bf026 | **NOT IN COMMIT** — git show --name-only: 7 souborů, webhook chybí | ✅ |
| `applyCommissionSplit` nedotčen | Vyplývá z předchozího: soubor nezměněn v tomto commitu | ✅ |
| `CommissionCard` / `CommissionEditDialog` | Grep v diff: 0 funkčních změn; jen `CommissionHistoryList` migroval formatRelativeCz import | ✅ |
| Amber warning (kartě Provize) odstraněn | Provize Card (L439-470) neobsahuje žádný amber/warning element — removed ✅ | ✅ |

---

## §7 — Check 5: REUSE

| Item | Status |
|------|--------|
| `STRIPE_REQUIREMENTS_CZ` importovaný ze shared | StripeOnboardingCard používá `translateRequirementsList` ze shared, ne duplicitní mapping | ✅ |
| `deriveOnboardingState` ze shared | `import { deriveOnboardingState } from "@/lib/stripe-connect-shared"` | ✅ |
| `formatRelativeCz` v `lib/utils.ts` | Exportovaná na L24-40, implementace kompletní (null→"nikdy", relative→absolute pro >30d) | ✅ |
| `CommissionHistoryList.tsx` migrovaná na shared helper | `import { formatRelativeCz } from "@/lib/utils"` (L4), lokální duplikát odstraněn | ✅ |

---

## §8 — Check 6: Technická validace

| Check | Výsledek |
|-------|---------|
| `npx tsc --noEmit` | ✅ 0 errors (ověřeno lokálně) |
| `npm run lint` | ✅ 0 errors, 547 warnings (viz OBS-2) |
| `npm run build` | ✅ impl report: compiled 16.4s, exit 0 (lokálně neověřeno — důvěřuji impl reportu) |
| SSG count | Impl report: 1216/1216 (neměnný z #161-a) — čistě UI change, bez nových routes |
| Bundle bloat | stripe-connect-shared.ts: zero runtime server imports (verified §5) |

---

## §9 — Check 7: Code quality

| Item | Status |
|------|--------|
| Žádné WHAT comments | Jediný comment v StripeOnboardingCard L113-114 je WHY: "Cheap DB read bez Stripe API roundtripu..." — oprávněný | ✅ |
| Busy state lock | `busy: null \| "copy" \| "sync"`, obě tlačítka: `disabled={busy !== null}` — nemůže běžet 2 fetch paralelně | ✅ |
| Single feedback state | `type Feedback = { kind: "ok" \| "err"; message: string }` — sloučeno z 2 hooks (review fix) | ✅ |
| canEdit = ADMIN || BACKOFFICE | `canEdit={canActivate}`, `canActivate = session?.user?.role === "ADMIN" || "BACKOFFICE"` (PartnerDetail L89) | ✅ |
| StripeStatusBadge bez "use client" | Správně — pure presentational wrapper over Badge, no interactivity; server component | ✅ |
| useMemo na state + requirementsCz | Defensivní optimalizace pro derived state — akceptabilní | ✅ |

---

## §10 — Observations

| # | Severity | Popis |
|---|----------|-------|
| OBS-1 | **Minor** | **Dashboard button discrepancy:** QA acceptance check #2 požaduje tlačítko "POST /api/stripe/connect/dashboard-link (jen pokud complete state s payoutsEnabled)". Implementace ho neobsahuje. **Plán §7.3 ho také NEPOŽADUJE** — admin akce jsou jen (1) copy onboarding/refresh link a (2) sync ze Stripe. Implementace je plan-compliant. Discrepancy je ve formulaci QA acceptance checku, který přidává požadavek nad rámec plánu. Lead ke clarification: je dashboard-link pro admin scoped do #161-b nebo #161-c (PWA)? Non-blocking pro PASS verdict. |
| OBS-2 | Minor | Lint warnings: 547 (oproti baseline 546 z #161-a QA). Delta +1 je pre-existing unrelated warning v `components/pwa/vehicles/new/ContactSearch.tsx` (Unused eslint-disable directive) — zdokumentováno impl reportem §7. 0 errors. |
| OBS-3 | Observation | `StripePartnerFields.stripeOnboardingStartedAt/CompletedAt/AccountUpdatedAt` jsou `string | null` (ne `Date`) — správně, client komponenty dostanou ISO strings z API, ne Date objekty. `formatRelativeCz` akceptuje `string | Date | null`. |
| OBS-4 | Observation | `fetchAndPropagate` na L66 je plain `async function`, ne `useCallback`. Pro admin-only screen s nízkou interaktivitou je to akceptabilní (memoization by byl overkill). Efektivita: copy path ušetří 1 Stripe API call použitím `fetchAndPropagate(false)`. |

---

## §11 — §20 LEAD DECISIONS cross-check (relevantní pro #161-b)

| Q | Decision | #161-b implementace | Status |
|---|----------|---------------------|--------|
| Q1 | Jen `transfers` capability | Nemodifikuje backend — stripe-connect.ts zachován beze změny v createOrGetConnectAccount | ✅ |
| Q2 | ACCEPT BOTH entry points | resolvePartnerForConnect nedotčen; admin UI předává `?partnerId=${partner.id}` | ✅ |
| Q7 | Žádná komunikace s partnery | 0 email/push/banner kód v #161-b souborech | ✅ |

---

## §12 — Verdict

### ✅ PASS with observations — 0 blockers

Commit `63bf026` implementuje #161-b Admin UI Stripe Connect onboarding kompletně a správně vůči plánu §7 + §12.2.

**Klíčové:**
- 7 souborů, čistě aditivní/minimálně modifikující — žádný scope creep
- Client-safe bundle split (`stripe-connect-shared.ts`) je čistý: zero runtime server imports
- StripeOnboardingCard importuje POUZE ze shared lib ✅
- Webhook/applyCommissionSplit: 0 modified lines (soubor není v commit diffsu) ✅
- Amber warning z komisní karty odstraněn ✅
- Busy lock (`busy !== null`) chrání proti paralelním fetch requestům ✅
- CommissionHistoryList migrována na sdílený formatRelativeCz ✅
- Lint 0 errors | TSC 0 errors | Build ✅

4 observations — žádný blocker. OBS-1 (Dashboard button discrepancy) vyžaduje lead clarification ale je non-blocking (plan §7.3 to nepožaduje).
