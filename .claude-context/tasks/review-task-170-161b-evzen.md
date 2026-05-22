# EVZEN Review #170 — #161-b Admin UI Stripe Connect

**Reviewer:** evzen-the-king (READ-ONLY)
**Commit:** `63bf026 feat(#161-b): admin Stripe Connect onboarding UI`
**Plán:** `plan-task-161-stripe-onboarding.md` §7.3 + §12.2 + §20 Q1-Q8
**Impl report:** `impl-task-168-161b.md`
**KONTROLOR report:** `qa-task-169-161b.md` (PASS with 4 OBS, 0 blockers)
**Datum:** 2026-04-08

---

## §1 — Scope of review

Shoda-check #161-b IMPL vůči:
- `plan-task-161-stripe-onboarding.md` §7.3 (admin akce — 2 buttony)
- §12.2 (fáze #161-b scope — 4 položky)
- §20 Q1-Q8 (LEAD DECISIONS — Q5 a Q7 relevantní pro UI)
- STOP-5 (applyCommissionSplit nedotčen)
- KONTROLOR OBS-1 clarification (dashboard-link button discrepancy)

Commit stats: `git show --stat 63bf026` = **7 souborů, 433 insertions, 103 deletions** (net +330).
Seznam souborů: CommissionHistoryList.tsx, PartnerDetail.tsx, StripeOnboardingCard.tsx (new), StripeStatusBadge.tsx (new), stripe-connect-shared.ts (new), stripe-connect.ts (modified), utils.ts (modified). **Žádné API routes, žádný webhook, žádné PWA soubory** ✅

---

## §2 — 5-check shoda tabulka

| # | Check | Verdikt | Evidence |
|---|-------|---------|----------|
| **1** | §12.2 scope compliance — 4 položky | ✅ PASS | Scope §12.2 vyžaduje: (1) StripeOnboardingCard — ✅ `components/admin/partners/StripeOnboardingCard.tsx` 261 ř., (2) StripeStatusBadge — ✅ `components/admin/partners/StripeStatusBadge.tsx` 28 ř., (3) PartnerDetail integrace (insert + remove amber + extend interface) — ✅ `PartnerDetail.tsx` diff: +import StripeOnboardingCard, +import StripePartnerFields, `interface Partner extends StripePartnerFields`, -8 inline stripe* fields, -amber warning block, +JSX insertion, (4) STRIPE_REQUIREMENTS_CZ — ✅ v `stripe-connect-shared.ts:67-85` (17 klíčů, reuse z #161-a) |
| **2** | §7.3 admin UX — 2 akce (ne 3) | ✅ PASS | Plán §7.3 explicitně enumeruje: **(1) "Zkopírovat onboarding link"** (když state !== complete/disabled) + **(2) "Sync ze Stripe"** (když state !== not_started) + **(3) "Žádný Disable/Revoke"**. Dashboard-link **NENÍ** v §7.3 admin akcích. Implementace má obě 2 buttony a žádný dashboard-link button. **Plan-compliant.** Viz §4 OBS-1 clarification |
| **3** | §20 Q1-Q8 LEAD DECISIONS | ✅ PASS | **Q5** (17 klíčů + reuse): `stripe-connect-shared.ts:67-85` má přesně 17 klíčů (zebra test #2); admin UI importuje `translateRequirementsList` ze shared (`StripeOnboardingCard.tsx:8`), **NE** duplicitní mapping. **Q7** (žádná komunikace s partnery): grep 0 výsledků pro `Resend`/`email`/`push`/`notify`/`sendEmail` v commit souborech (KONTROLOR §3 Q6 + §11). Admin copy-to-clipboard + admin pošle přes externí kanál (email/Slack/telefon) — **ne** automatizovaná notifikace. **Q1** (transfers only) + **Q2** (dual entry) + **Q3** (bez business_type) + **Q4** (replay guard) + **Q6** (webhook reuse) + **Q8** (žádný gate) jsou backend-only decisions — nedotčeny v #161-b |
| **4** | STOP-5 #88a commission — `applyCommissionSplit` nedotčený | ✅ PASS | `git show 63bf026 -- app/api/stripe/webhook/route.ts | wc -l` = **0** (soubor není v commit diffsu). `git show --name-only` = 7 souborů, žádný není `app/api/stripe/webhook/route.ts`. Webhook beze změn, `applyCommissionSplit` na L169/171/198 produkční nedotčený |
| **5** | REUSE vs DUPLICATION — client bundle isolation | ✅ PASS | `lib/stripe-connect-shared.ts:1` = `import type { Partner } from "@prisma/client"` — **TYPE-ONLY** (erased at compile time). Žádné runtime imports prisma/stripe/pg/next. Grep pro `from "@/lib/stripe-connect"` v `components/admin/partners/`: **3 výsledky, všechny směřují na `stripe-connect-shared`** (StripeOnboardingCard L11, StripeStatusBadge L2, PartnerDetail L17). Žádný import z server `lib/stripe-connect`. Server file `lib/stripe-connect.ts` diff: -72 řádků pure helpers (moved to shared) + re-export 4 symbolů + `export type` pro backwards compat — existující backend imports (status route, webhook) pokračují bez změny |

**Výsledek 5/5:** ✅ Všech 5 checks PASS.

---

## §3 — Zebra test (3 náhodné claims vs kód)

### Claim 1 (QA §9): "StripeStatusBadge bez `"use client"` — pure presentational wrapper"

**Verify:** Read `components/admin/partners/StripeStatusBadge.tsx`:
```tsx
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import type { OnboardingState } from "@/lib/stripe-connect-shared";
// ... no "use client" directive
export function StripeStatusBadge({ state, className }: StripeStatusBadgeProps) {
  const config = STATE_CONFIG[state];
  return <Badge variant={config.variant} className={className}>...</Badge>;
}
```
✅ **PASS** — Žádná `"use client"` directive (L1 začíná import statement). Server component wrappující `Badge`. 5-state mapping: `not_started → default`, `in_progress → new`, `complete → success`, `action_required → warning`, `disabled → destructive`.

### Claim 2 (Impl §5.1 + §20 Q5): "`STRIPE_REQUIREMENTS_CZ` má 17 klíčů, reuse ze shared (ne duplikace)"

**Verify:** Read `lib/stripe-connect-shared.ts:67-85` — počítám klíče:
1. `individual.first_name`
2. `individual.last_name`
3. `individual.dob.day`
4. `individual.dob.month`
5. `individual.dob.year`
6. `individual.verification.document`
7. `individual.verification.additional_document`
8. `business_profile.url`
9. `business_profile.mcc`
10. `business_profile.product_description`
11. `company.tax_id`
12. `company.verification.document`
13. `company.directors_provided`
14. `company.owners_provided`
15. `external_account`
16. `tos_acceptance.date`
17. `tos_acceptance.ip`

✅ **PASS** — Přesně **17 klíčů**. `REQUIREMENT_FALLBACK_CZ = "Další informace požadované Stripem"` na L87. `translateRequirementsList` dedup via `Array.from(new Set(...))` na L98-101. Admin UI `StripeOnboardingCard.tsx:8` importuje `translateRequirementsList` ze shared (ne duplicitní mapping). Server `lib/stripe-connect.ts` re-exportuje symbol pro backwards compat — existující status route a webhook nemusí být měněny.

### Claim 3 (QA §6, Impl §1 scope): "`applyCommissionSplit` nedotčený — webhook soubor není v commitu"

**Verify:**
- `git show 63bf026 -- app/api/stripe/webhook/route.ts | wc -l` → **0** (soubor není v diff)
- `git show --name-only 63bf026` → CommissionHistoryList.tsx, PartnerDetail.tsx, StripeOnboardingCard.tsx, StripeStatusBadge.tsx, stripe-connect-shared.ts, stripe-connect.ts, utils.ts — **7 souborů, žádný webhook**
- Live grep `applyCommissionSplit` v `app/api/stripe/webhook/route.ts`:
  - L169: `await applyCommissionSplit(orderId);`
  - L171: `console.error('[webhook] applyCommissionSplit failed for order ${orderId}:', err);`
  - L198: `async function applyCommissionSplit(orderId: string) {`

✅ **PASS** — Webhook nedotčen v commitu. `applyCommissionSplit` nezměněn, funkce stále existuje na L198 beze změny. STOP-5 dodržen, #88a commission flow funguje nezávisle na #161-b UI změnách.

**Zebra 3/3:** ✅ PASS

---

## §4 — OBS-1 clarification: Dashboard-link button absence

**KONTROLOR §10 OBS-1:** QA acceptance check (vlastní checklist) požadoval "POST /api/stripe/connect/dashboard-link button v admin UI (jen pokud complete state s payoutsEnabled)". Implementace ho neobsahuje. KONTROLOR flaguje jako **Minor** a eskaluje na lead.

**EVZEN verdict: absence je plan-compliant, NE gap.**

**Důkaz:**

1. **§7.3 admin akce** (plán-task-161, L728-741) enumeruje přesně **2 buttony**:
   - §7.3.1 "Zkopírovat onboarding link" (state !== complete)
   - §7.3.2 "Sync ze Stripe" (state !== not_started)
   - §7.3.3 "Žádný Disable/Revoke" (explicitní absence)

   **Dashboard-link button NENÍ v §7.3.** Plán admin UX úplně o něm mlčí.

2. **§12.2 scope** (L1169-1182) seznam 4 položek:
   - StripeOnboardingCard (§7.5)
   - StripeStatusBadge (§7.6)
   - PartnerDetail integrace
   - CZ translation helper

   **Dashboard-link není v #161-b scope.**

3. **Dashboard-link endpoint** je referencován v plánu:
   - §5.3 (L471-477) — backend route spec, implementován v #161-a
   - §9 (L939) — `fetch("/api/stripe/connect/dashboard-link", { method: "POST" })` v kontextu **PWA self-service** (§8 partner PWA UI, tj. **#161-c**)
   - §13.1 (L1211) — new file list, backend route (#161-a) — už existuje a je live v produkci

4. **Sémantika Stripe Express dashboard-link:** Je to **magic login link** pro partnera, aby se přihlásil do svého Stripe Express dashboardu (úprava bank account, download statements). **Admin-scope use case** = 0 (admin nemá důvod se logovat do partnerova Stripe dashboardu).

5. **`createDashboardLink` precondition** (`#161-a` backend): `if (!partner.stripeAccountId || !partner.stripePayoutsEnabled) return 400 not_onboarded`. Jen complete state může zavolat — v kontextu partner self-service UI (§8 PWA).

**Conclusion:** Dashboard-link button v admin UI **by byl scope creep do #161-c** a funkčně nemá smysl (admin se do partner Stripe dashboardu nelogiuje). KONTROLOR OBS-1 správně identifikoval discrepancy, ale správná oprava není přidat button — je to přepsat QA acceptance check.

**Stanovisko:** ✅ **OBS-1 discrepancy je v QA acceptance checklistu, ne v implementaci.** Admin UI je **plan-compliant**. Doporučuju týmu: v příštím QA check template odstranit dashboard-link z admin acceptance criteria. Alternativně lead může autorizovat explicit §7.3.4 "Žádný dashboard-link button v admin UI" annotation v plánu pro budoucí clarity.

---

## §5 — Ostatní KONTROLOR OBS re-verification

| # | OBS | EVZEN verdict |
|---|-----|---------------|
| OBS-1 | Dashboard-link button absence | ✅ Plan-compliant (viz §4) — **NE gap** |
| OBS-2 | Lint 547 warnings (baseline 546) | ✅ Delta +1 je pre-existing unrelated v `components/pwa/vehicles/new/ContactSearch.tsx` (Unused eslint-disable directive, impl §7 dokumentuje). 0 errors, žádná regrese ze #161-b |
| OBS-3 | `StripePartnerFields` má `string \| null` pro dates (ne `Date`) | ✅ Správné — client komponenty dostanou ISO strings z API (JSON serialization), ne Date objekty. `formatRelativeCz` akceptuje `string \| Date \| null` |
| OBS-4 | `fetchAndPropagate` jako plain async function (ne `useCallback`) | ✅ Admin-only screen s nízkou interaktivitou, memoization = overkill. Efektivita: silent copy path používá `fetchAndPropagate(false)` (§5.3 impl) → ušetří 1 Stripe API call + 1 DB write |

Všechny 4 OBS jsou non-blocking a správně kategorizované. Žádný blocker.

---

## §6 — §20 LEAD DECISIONS spillover check

§20 Q1-Q8 jsou primárně backend decisions, ale mají #161-b relevance:

| Q | Decision | #161-b impact | Status |
|---|----------|---------------|--------|
| Q1 | Jen `transfers` capability | Backend nedotčen (`lib/stripe-connect.ts` createOrGetConnectAccount zachována) | ✅ Unaffected |
| Q2 | ACCEPT BOTH entry points (self-service + admin override) | Admin UI předává `?partnerId=${partner.id}` → přes `resolvePartnerForConnect` admin override cestu | ✅ Respects Q2 |
| Q3 | Bez `business_type` | Backend nedotčen | ✅ Unaffected |
| Q4 | Replay guard | Backend nedotčen; admin copy-link click eager-create je idempotent | ✅ Respects Q4 |
| Q5 | 17 klíčů + fallback + dedup | `stripe-connect-shared.ts` má 17 klíčů, fallback, dedup via Set. Admin UI reuse ✅ | ✅ Zebra test #2 |
| Q6 | Reuse existing webhook endpoint | Backend nedotčen | ✅ Unaffected |
| Q7 | Žádná komunikace s partnery | grep 0 výsledků pro email/push/notify v 7 souborech. Copy-to-clipboard je **admin-initiated** (admin kopíruje a pošle přes externí kanál manuálně) — ne auto-notifikace | ✅ Respects Q7 |
| Q8 | Žádný hard merge gate | Admin UI má 5-state info display, žádný funkční gate (provize pracuje nezávisle na Stripe status per §88a graceful fallback) | ✅ Respects Q8 |

**8/8 Q1-Q8 respektováno.**

---

## §7 — Memory compliance

| Memory | Relevance | Status |
|--------|-----------|--------|
| `feedback_stop_escalate_literal` | Žádný blocker v impl (§8 impl report), žádná eskalace nutná | ✅ |
| `feedback_git_reset_approval` | Commit `63bf026` final, žádný rewrite | ✅ |
| `feedback_no_competitor_scraping` | 0 scraping kód | ✅ |
| `project_wolt_model_platform_wide` | Admin UI odráží Wolt model (vrakoviště-side payout onboarding, ne card_payments) | ✅ |
| `feedback_no_parallel_impl_test` | Impl commit `63bf026` lokální, pipeline pokračuje sekvenčně (kontrolor → evžen → test-chrome → lead → deploy) | ✅ |

---

## §8 — Verdikt

### ✅ PASS — 0 blockers, 0 FINDINGS → GO test-chrome → lead → deploy

Commit `63bf026` implementuje #161-b Admin UI Stripe Connect onboarding v plné souladnosti s plánem `plan-task-161-stripe-onboarding.md` §7.3 + §12.2 + §20 Q1-Q8.

**Klíčové body:**
- ✅ 5/5 shoda checks PASS
- ✅ Zebra test 3/3 (StripeStatusBadge server wrapper, 17 klíčů STRIPE_REQUIREMENTS_CZ, applyCommissionSplit nedotčený)
- ✅ §7.3 admin UX 2 buttony (ne 3) — plan-compliant
- ✅ §12.2 scope všech 4 položky implementovány
- ✅ §20 Q5 + Q7 explicit (reuse ze shared, žádná auto-notifikace)
- ✅ §20 Q1-Q4, Q6, Q8 backend-only (nedotčeny v #161-b)
- ✅ STOP-5 #88a dodržen (webhook není v commitu)
- ✅ Client bundle isolation: `stripe-connect-shared.ts` zero server runtime imports (type-only Partner), admin komponenty importují pouze ze shared
- ✅ Refactor wins: wrapper `StripeStatusBadge` nad `Badge`, `extends StripePartnerFields` single source, `formatRelativeCz` extract, silent sync bez Stripe API roundtripu
- ✅ Lint/TSC/build všechny zelené (0 errors)

**OBS-1 dashboard-link discrepancy:** Implementace je **plan-compliant**. Absence dashboard-link buttonu v admin UI je správná — §7.3 ho nepožaduje, dashboard-link je semanticky partner-scoped (PWA self-service #161-c). Discrepancy je ve formulaci QA acceptance check template, **ne v kódu**. Lead nemusí autorizovat nic — impl je správná.

**FINDINGS:** žádné.

**Next step per impl §9:** PASS → test-chrome (#171) → lead review (#172) → deploy (#173).

**Pre-deploy reminder (z memory `reference_deploy_checklist.md`):** #161-b je čistě UI change — commit `63bf026` neobsahuje `prisma/migrations/*` ani `prisma/schema.prisma` změny. Deploy pipeline může **přeskočit** `prisma migrate deploy` + `prisma generate` kroky (jsou no-op). Stále by měly být spuštěny jako safe-by-default per canonical checklist (idempotentní). Žádný manuální Stripe Dashboard krok navíc (na rozdíl od #161-a).

---

**EVZEN signoff: 2026-04-08**
