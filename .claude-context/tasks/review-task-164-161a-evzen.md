# EVZEN Review #164 — #161-a Stripe Connect Express backend

**Reviewer:** evzen-the-king (READ-ONLY)
**Commit:** `2bf0657 feat(#161-a): Stripe Connect Express backend — schema, helpers, API routes, webhook`
**Plan reference:** `plan-task-161-stripe-onboarding.md` (SCHVÁLENO 2026-04-08, §20 LEAD DECISIONS Q1-Q8)
**Impl report:** `impl-task-162-161a.md`
**KONTROLOR report:** `qa-task-163-161a.md` (PASS with 4 minor OBS)
**Datum:** 2026-04-08

---

## §1 — Scope of review

EVZEN kontroluje literal shodu commitu `2bf0657` s:
- `plan-task-161-stripe-onboarding.md` §20 LEAD DECISIONS Q1-Q8 (verbatim)
- Fáze #161-a scope (backend only; admin UI/PWA UI delegováno na #161-b/#161-c)
- `feedback_stop_escalate_literal`, `feedback_git_reset_approval`, `project_wolt_model_platform_wide`, `feedback_no_competitor_scraping`
- KONTROLOR observations (non-blocking severity check)

Commit stats ověřeny: **8 souborů, 779 insertions, 0 deletions** (`git show --stat 2bf0657`).

---

## §2 — 7-question shoda check

| # | Otázka | Status | Evidence |
|---|--------|--------|----------|
| **1** | Všech 8 §20 LEAD DECISIONS (Q1-Q8) verbatim implementováno? | ✅ ANO | Viz §3 tabulka níže — každý Q má file:line evidence |
| **2** | Fáze scope dodržen (jen backend, žádný admin/PWA UI)? | ✅ ANO | 0 souborů v `components/admin/`, 0 v `app/(pwa-parts)/`, 0 v `app/(admin)/` v commitu. 3 nové API routes + 1 lib + 1 webhook extend + schema + migration |
| **3** | `applyCommissionSplit` nedotčený (STOP-5)? | ✅ ANO | `git show 2bf0657 -- app/api/stripe/webhook/route.ts` = 0 removed lines (`^-`), pouze `+` additive. Funkcionalita #88a beze změn |
| **4** | Memory feedback rules dodrženy? | ✅ ANO | `stop_escalate_literal`: 2 blockery (tsvector drift, Prisma 7 AI safety) eskalovány a autorizovány leadem per impl §9. `git_reset_approval`: žádný rewrite history po HOTOVO. `wolt_model`: Q1 transfers-only potvrzeno. `no_competitor_scraping`: grep 0 výsledků v nových souborech |
| **5** | KONTROLOR 4 observations non-blocking? | ✅ ANO | OBS-1 (lint 546) pre-existing z #88a build cycle. OBS-2 (Stripe native types) záměrně ponecháno — interní API, DTO wrapper = boilerplate. OBS-3 (SSG 1216) expected +3 route shells. OBS-4 (startedAt na admin override) záměrné drop-off metric. Žádný blocker |
| **6** | Žádné skryté stránky / undocumented routes? | ✅ ANO | 3 nové API routes (`/api/stripe/connect/onboard-link`, `/status`, `/dashboard-link`) — všechny v plánu §5. Build manifest: 1216 pages (1213 baseline + 3 API shells). Žádné UI page routes |
| **7** | Žádná zkratka / soft hack? | ✅ ANO | TOCTOU race fix použitý správně (`updateMany` atomic no-op, ne race). Replay guard přes early-return na existující `stripeAccountId` (Q4 literal). Webhook `handleStripeAccountUpdate` never-throws (outer try-catch + per-case). Rate limit 60s přes stored timestamp. `payoutsEnabled` precondition v dashboard-link zabraňuje Stripe API error `login_link_not_available` |

---

## §3 — §20 LEAD DECISIONS Q1-Q8 verbatim evidence

| Q | Decision (verbatim z plánu) | Implementace | File:line | Status |
|---|---|---|---|---|
| **Q1** | Jen `transfers` capability, žádné `card_payments` (Wolt model) | `capabilities: { transfers: { requested: true } }` bez card_payments | `lib/stripe-connect.ts:87-89` | ✅ |
| **Q2** | ACCEPT BOTH entry points — PWA self-service + admin override přes `?partnerId=xxx` | `resolvePartnerForConnect` discriminated union handles obě cesty | `lib/stripe-connect.ts:33-63` | ✅ |
| **Q3** | BEZ `business_type` v accounts.create (Stripe Express UI to vyřeší) | `stripe.accounts.create({ type: "express", country: "CZ", email, capabilities, business_profile, metadata })` — žádný business_type field | `lib/stripe-connect.ts:83-101` | ✅ |
| **Q4** | Eager create per request, replay-safe | `createOrGetConnectAccount` early-return: `if (partner.stripeAccountId) return partner.stripeAccountId;` | `lib/stripe-connect.ts:76` | ✅ |
| **Q5** | Min 17 klíčů + fallback + dedup | `STRIPE_REQUIREMENTS_CZ` = 17 klíčů (grep ověřen), `REQUIREMENT_FALLBACK_CZ = "Další informace požadované Stripem"`, `translateRequirementsList` s `Array.from(new Set(...))` | `lib/stripe-connect.ts:227-261` | ✅ |
| **Q6** | Reuse existující webhook endpoint `/api/stripe/webhook` | `case "account.updated"` přidán do existujícího switche, žádný nový route soubor | `app/api/stripe/webhook/route.ts` (case + `handleStripeAccountUpdate` helper) | ✅ |
| **Q7** | Žádná komunikace s partnery v #161-a (email/push/banner) | grep 0 výsledků pro email-send/push/notify v nových souborech (KONTROLOR §3). `email` field v accounts.create je jen pro Stripe API | All new files | ✅ |
| **Q8** | Soft validation — deploy po ≥1 úspěšném test onboardingu, žádný hard merge gate | grep 0 výsledků pro `completedCount`, `< N`, hard threshold. Validace ponechána na lead post-deploy | N/A (absence kontrolována) | ✅ |

**Závěr Q1-Q8:** Všech 8 rozhodnutí verbatim reflektováno. Žádné "almost/reinterpreted" — každý Q má přímou file:line vazbu nebo ověřenou absenci (Q7, Q8).

---

## §4 — Zebra test (scope creep detection)

**Explicitní literal absence kontrolovány:**

| Item | Plán scope? | V commitu? | Status |
|------|-------------|------------|--------|
| Admin UI `StripeOnboardingCard` v PartnerDetail | #161-b (out of scope) | ❌ absent | ✅ |
| Admin `StripeStatusBadge` sdílená komponenta | #161-b (out of scope) | ❌ absent | ✅ |
| PWA Card v `/parts/profile` | #161-c (out of scope) | ❌ absent | ✅ |
| `applyCommissionSplit` upgrade (payoutsEnabled check) | FU1 (out of scope) | ❌ absent (0 deleted lines) | ✅ |
| Email template / Resend call partnerům | Q7 explicit NO | ❌ absent | ✅ |
| Push notification | Q7 explicit NO | ❌ absent | ✅ |
| Hard merge gate kód | Q8 explicit NO | ❌ absent | ✅ |
| E2E testy pro Connect flow | Deferred na #161-c | ❌ absent | ✅ |
| Competitor scraping | `feedback_no_competitor_scraping` | ❌ absent | ✅ |
| `card_payments` capability | Q1 explicit NO | ❌ absent | ✅ |
| `business_type` field | Q3 explicit NO | ❌ absent | ✅ |

**Commit diff stats: 779 insertions / 0 deletions** → čistě aditivní, žádný out-of-scope obsah, žádná modifikace existujícího kódu mimo webhook switch.

---

## §5 — Memory compliance

| Memory | Relevance | Status |
|--------|-----------|--------|
| `feedback_stop_escalate_literal` | 2 blockery (STOP-1 tsvector drift, Prisma 7 AI safety) | ✅ Oba eskalovány leadovi s Option A/B/C, lead GO Option A autorizováno, zdokumentováno v impl §9 |
| `feedback_git_reset_approval` | Žádný git rewrite po HOTOVO | ✅ Commit `2bf0657` je final, žádný force-push, žádný amend |
| `feedback_no_competitor_scraping` | 0 scraping kód | ✅ Grep ověřen (KONTROLOR §3 Q7 + §5) |
| `project_wolt_model_platform_wide` | Q1 transfers-only | ✅ `capabilities: { transfers: { requested: true } }` bez card_payments |
| `project_vrakoviste_business_model` | PARTS_SUPPLIER self-service entry point | ✅ Q2 `resolvePartnerForConnect` self-service přes `partner.userId === session.user.id` |
| `feedback_planovac_consistent_ranges` | N/A (impl fáze) | — |
| `feedback_no_parallel_impl_test` | N/A (impl fáze, test-chrome není spuštěn zároveň) | — |

---

## §6 — KONTROLOR observations re-verification

| # | OBS | EVZEN verdict |
|---|-----|---------------|
| OBS-1 | Lint 546 warnings (baseline 543 z #87d → 546 z #88a → 546 z #161-a). Delta 0 oproti #88a baseline. 0 errors. | ✅ Non-blocking — žádná regrese |
| OBS-2 | `createOnboardingLink`/`createDashboardLink` vrací Stripe native types | ✅ Záměrné — interní API mezi `lib/stripe-connect.ts` a routes, DTO wrapper by byl boilerplate bez přínosu. Schváleno impl §7. |
| OBS-3 | SSG 1216 (+3 oproti 1213 po #88a) | ✅ Expected — 3 nové API route shells (`ƒ` dynamic). Next.js 15 počítá do total. |
| OBS-4 | `stripeOnboardingStartedAt` se nastavuje i pro admin override | ✅ Záměrné — každý pokus = drop-off metric start, bez ohledu na iniciátora. Plán §12 to podporuje (drop-off metric per attempt). |

Žádná OBS není blocker. Všechny 4 korespondují s explicitními design decisions nebo pre-existing stavem.

---

## §7 — Verdikt

### ✅ PASS with observations — 0 blockers

Commit `2bf0657` implementuje #161-a Stripe Connect Express backend v souladu s plánem `plan-task-161-stripe-onboarding.md` a §20 LEAD DECISIONS Q1-Q8.

**Klíčové body:**
- ✅ Všech 8 §20 Q1-Q8 verbatim splněno (každý s file:line evidence)
- ✅ Fáze #161-a scope striktně dodržen (0 out-of-scope souborů)
- ✅ `applyCommissionSplit` nedotčený (0 deleted lines v webhook diff)
- ✅ TOCTOU race fix správný (`updateMany` atomic no-op guard)
- ✅ Webhook `handleStripeAccountUpdate` never-throws (outer try-catch)
- ✅ Replay guard bezpečný (early-return na existující `stripeAccountId`)
- ✅ 60s rate limit pro status refresh (first call projde přes NULL check)
- ✅ `payoutsEnabled` precondition v dashboard-link (zabraňuje Stripe error)
- ✅ 4 KONTROLOR OBS jsou non-blocking a správně kategorizované
- ✅ Memory rules dodrženy (stop-escalate, git-reset-approval, wolt-model, no-scraping)
- ✅ Build/lint/tsc/prisma validate čisté

**Next step:** test-chrome → lead → deploy (per team-lead #164 dispatch instruction).

**FINDINGS:** žádné.

---

**EVZEN signoff: 2026-04-08**
