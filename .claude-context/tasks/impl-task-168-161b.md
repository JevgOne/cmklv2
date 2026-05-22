# IMPL #168 — #161-b Admin UI Stripe Connect onboarding

**Task:** #168 IMPL #161-b — Admin UI Stripe Connect onboarding
**Plan:** `plan-task-161-stripe-onboarding.md` §7 (Admin UI)
**Navazuje na:** #162 (#161-a backend) + #166 (deploy) — ty už jsou v produkci
**Datum:** 2026-04-08
**Branch:** main
**Commit:** `63bf026`

---

## §1 — Scope delivered

| # | Položka | File | Status |
|---|---|---|---|
| 1 | `StripeStatusBadge` — 5-state badge wrapper | `components/admin/partners/StripeStatusBadge.tsx` | ✅ New |
| 2 | `StripeOnboardingCard` — main admin UI card | `components/admin/partners/StripeOnboardingCard.tsx` | ✅ New |
| 3 | PartnerDetail integration (interface + insertion + amber removal) | `components/admin/partners/PartnerDetail.tsx` | ✅ Modified |
| 4 | Client-safe shared helpers (split z #161-a) | `lib/stripe-connect-shared.ts` | ✅ New |
| 5 | Server re-export wrapper | `lib/stripe-connect.ts` | ✅ Modified |
| 6 | Extract `formatRelativeCz` to shared utils (4. duplikát) | `lib/utils.ts` | ✅ Modified |
| 7 | Migrate CommissionHistoryList na shared formatRelativeCz | `components/admin/partners/CommissionHistoryList.tsx` | ✅ Modified |

**Out of scope (per task brief):**
- PWA self-service UI (#161-c — separátní task)
- Backend changes (API routes, schema) — #161-a je v produkci, nerefaktorujeme
- Email/banner/push komunikace s partnery
- E2E tests (test-chrome fáze)
- Stripe Dashboard webhook event registration (manual deploy step, out of code scope)

---

## §2 — Architecture rozhodnutí

### §2.1 — Client-safe helper split

**Problem:** StripeOnboardingCard a StripeStatusBadge jsou client componenty
(`"use client"`), potřebují importovat `deriveOnboardingState` a
`STRIPE_REQUIREMENTS_CZ`. Ale `lib/stripe-connect.ts` importuje
`@/lib/prisma` → `@prisma/adapter-pg` → `pg` Node driver, který nelze
bundlovat do browser bundle.

**Řešení:** Extrahoval jsem pure helpers do nového `lib/stripe-connect-shared.ts`:
- `OnboardingState` type union
- `StripePartnerFields` interface (client-side, string dates)
- `deriveOnboardingState` pure function
- `STRIPE_REQUIREMENTS_CZ` constant
- `translateRequirement` + `translateRequirementsList` pure functions

Zero server imports (jen `import type { Partner } from "@prisma/client"` — type-only, erased at compile time). `lib/stripe-connect.ts` re-exportuje všech 5 symbolů pro backwards compat — existující imports (status route, webhook) pokračují bez změny.

**Verifikace:** Build compiled successfully in 16.4s, žádné bundler warnings o server imports v client bundle.

### §2.2 — StripeStatusBadge jako wrapper Badge komponenty

První verze duplikovala `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-bold` chrome + barvy z `components/ui/Badge.tsx`. Po review (code-reuse agent) refactoringoval na wrapper kolem existujícího Badge:

```tsx
<Badge variant={config.variant} className={className}>
  {config.icon && <span aria-hidden="true">{config.icon}</span>}
  {config.label}
</Badge>
```

Mapping 5-state → existující Badge variants:
| OnboardingState | Badge variant | Barva |
|---|---|---|
| `not_started` | `default` | gray |
| `in_progress` | `new` | blue (info) |
| `complete` | `success` | green |
| `action_required` | `warning` | amber |
| `disabled` | `destructive` | red |

Custom Stripe icons (⏳✓⚠✕) jsou children, Badge neposkytuje built-in icon system kromě `live` varianty (pulsing dot).

### §2.3 — Interface extension přes `extends`

PartnerDetail.tsx `interface Partner` používá `extends StripePartnerFields` pro 8 stripe* fieldů → single source of truth. Eliminuje 8 řádků duplikace vs. inline declarace. StripeOnboardingCard props: `StripePartnerFields & { id: string }` (id není v shared interface protože není Stripe-specific).

### §2.4 — Feedback state (collapsed toast/error)

Původně jsem měl `toast: string | null` a `error: string | null` jako oddělené useState hooks. Po review (code quality agent) sloučil do jednoho `feedback: { kind: "ok" | "err"; message: string } | null` — protože v UI se toast a error nikdy nezobrazují současně. Méně state, méně re-rendering, čistější.

### §2.5 — Silent sync efficiency fix

Původní handleCopyOnboardingLink po copy volal `fetchAndPropagate({ silent: true })` s `refresh=1`, což triggered Stripe API roundtrip přes `stripe.accounts.retrieve()`. Po review (efficiency agent) opraveno:

```ts
// Cheap DB read bez Stripe API roundtripu — propaguje čerstvě
// vytvořený stripeAccountId + stripeOnboardingStartedAt do UI.
await fetchAndPropagate(false).catch((err) => {
  console.error("silent status fetch failed:", err);
});
```

Po POST /onboard-link je nově vytvořený accountId v DB, ale partner ještě neklikl na link → Stripe state se nezměnil. Stačí cheap DB read (`/status` bez `refresh=1`), který vrátí aktualizovaný snapshot. Ušetří 1 Stripe API call + 1 DB write na každý copy.

---

## §3 — 5-state UI mapping (§7.2 plan)

| State | Badge | Text | Buttons |
|---|---|---|---|
| `not_started` | gray "Nepřipojeno" | "Výplaty jdou zatím manuálně..." | Zkopírovat onboarding link |
| `in_progress` | blue "Stripe zpracovává" | "Partner zahájil onboarding..." | Zkopírovat refresh link + Sync ze Stripe |
| `action_required` | amber "Vyžaduje akci" | "Stripe potřebuje od partnera..." + requirements list (CZ) | Zkopírovat refresh link + Sync ze Stripe |
| `complete` | green "Výplaty aktivní" | "Stripe Connect účet je plně aktivní..." + checkmark list (Údaje odeslány / Výplaty povoleny / Platby povoleny) | Sync ze Stripe |
| `disabled` | red "Zakázáno" | "Stripe account je deaktivovaný..." + red box s `stripeDisabledReason` | Sync ze Stripe |

Requirements list v `action_required` používá `translateRequirementsList` ze shared helpers → 17 CZ labelů + fallback pro unknown keys + dedup duplicit (dob.day/month/year → "Datum narození").

---

## §4 — Admin akce detail

### §4.1 — Zkopírovat onboarding link

**Zobrazeno:** `state === "not_started" | "in_progress" | "action_required"`
**Endpoint:** `POST /api/stripe/connect/onboard-link?partnerId=${partner.id}`
**Flow:**
1. POST → backend eager-create Stripe Express account + return fresh hosted onboarding URL (expires ~5 min)
2. `navigator.clipboard.writeText(url)` → schránka
3. Feedback "Link zkopírován do schránky"
4. Silent `/status` fetch (bez `refresh=1`) → aktualizuje local partner state s čerstvě vytvořeným `stripeAccountId` a `stripeOnboardingStartedAt`
5. Badge transition not_started → in_progress bez page refresh

**UX rationale:** Admin pak pošle partnerovi přes email/Slack/telefon. Proaktivní oslovení vrakovišť bez čekání na partnerův self-service login.

### §4.2 — Sync ze Stripe

**Zobrazeno:** `state !== "not_started"` (nutný `stripeAccountId`)
**Endpoint:** `GET /api/stripe/connect/status?partnerId=${partner.id}&refresh=1`
**Flow:**
1. GET s `refresh=1` → backend volá `stripe.accounts.retrieve()` + syncuje DB přes `syncAccountToDb`
2. Rate-limit 60 s server-side (§5.2 #161-a backend) — druhý rychlý click dostane cached DB snapshot
3. Response → `onRefresh(updated)` → parent `setPartner((prev) => ({ ...prev, ...updated }))`
4. Feedback "Stav synchronizován ze Stripe"

**UX rationale:** Admin manuálně triggeruje sync když webhook nezaplatil nebo pro debug. 60s rate-limit chrání Stripe API quota.

### §4.3 — Žádný "Disable"/"Revoke"

Express accounty se deaktivují jen přes Stripe Dashboard (per plan §7.3.3). Admin UI tu responsibility nezachycuje.

---

## §5 — /simplify review cyklus

Po commitu dispatched 3 parallel review agenti (code-reuse, code-quality, efficiency). **Aplikované fixy:**

### §5.1 — Code reuse fixes

1. **[CRITICAL] `formatRelative` 4. duplikát** — extrakce `formatRelativeCz` do `lib/utils.ts`, migrace `CommissionHistoryList.tsx` na sdílený helper. Agent identifikoval 9+ kopií téhož helperu po repu (admin/dashboard, partners, PWA dashboard, leads, messages) — migrace zbylých call-sites je follow-up task.
2. **[NICE-TO-HAVE] StripeStatusBadge wrap Badge** — refactor z custom JSX (54 řádků) na wrapper přes `components/ui/Badge.tsx` (30 řádků). Visual language consistency s `PartnerStatusBadge`.
3. **[NICE-TO-HAVE] StripePartnerFields single source** — přesun interface z `StripeOnboardingCard.tsx` do `lib/stripe-connect-shared.ts`, reuse v `PartnerDetail.Partner` přes `extends StripePartnerFields`.

### §5.2 — Code quality fixes

1. **Collapse toast + error na feedback state** — jediný `useState<Feedback | null>` místo dvou oddělených state hooks. Feedback = `{ kind: "ok" | "err"; message: string }`.
2. **Delete narrating WHAT comment** — `// Mapujeme API response (kompaktní) → Partner DB fieldy` odstraněno (obvious z kontextu).
3. **Delete stale trailing comment v stripe-connect.ts** — redundant re-export notice.

### §5.3 — Efficiency fixes

1. **Silent sync bez Stripe API roundtripu** — změna `fetchAndPropagate(true)` → `fetchAndPropagate(false)` po copy link. Jen cheap DB read, partner ještě neklikl na link, Stripe state se nezměnil. Ušetří ~300ms per copy.

### §5.4 — Neaplikované fixy (ze zdůvodněných důvodů)

- **`"use client"` na StripeStatusBadge** — StripeStatusBadge nemá `"use client"` directive (je to server component wrappující server component Badge). Už bylo clean, agent false positive.
- **`useMemo` na `state`/`requirementsCz`** — ponecháno. Je to defenzivní marker že jde o derived state; cost je minimální, hodnota čitelnosti nenulová.
- **Client-side rate-limit guard** — server side 60s rate-limit + `busy !== null` disabled state je dostatečné pro admin-only screen. Over-engineering.

---

## §6 — Files changed

### New files:
- `components/admin/partners/StripeStatusBadge.tsx` (27 řádků)
- `components/admin/partners/StripeOnboardingCard.tsx` (261 řádků)
- `lib/stripe-connect-shared.ts` (99 řádků)

### Modified files:
- `components/admin/partners/PartnerDetail.tsx` — +1 import, +1 `extends StripePartnerFields`, -8 inline stripe* fields, -7 amber warning, +8 StripeOnboardingCard insertion
- `components/admin/partners/CommissionHistoryList.tsx` — -16 local formatRelative, +1 import shared
- `lib/stripe-connect.ts` — -72 řádků pure helpers (moved to shared), +7 re-export
- `lib/utils.ts` — +22 `formatRelativeCz` helper

### Commit
- `63bf026 feat(#161-b): admin Stripe Connect onboarding UI`
- 7 files changed, 433 insertions(+), 103 deletions(-)

---

## §7 — Validation

| Check | Výsledek |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors (547 warnings pre-existing v .next bundlech a 1 warning v components/pwa/vehicles/new/ContactSearch.tsx — unrelated pre-existing `Unused eslint-disable directive`) |
| `npm run build` | ✅ Compiled successfully in 16.4s, exit code 0 |
| 3 nové Connect routes v build outputu | ✅ pre-existing z #161-a, unchanged |
| Bundle bloat check | ✅ stripe-connect-shared.ts má ZERO server imports (verified by efficiency agent) |
| Prisma build noise | ✅ Pre-existing "Too many database connections" SSG warnings, non-blocking (dokumentováno v `impl-task-160-deploy-88a.md`) |

---

## §8 — Known blockers / notes

**None.** Implementace proběhla bez blockerů. Žádný STOP-1 ritual nebyl potřeba — nezasahoval jsem do schema, migrací, ani test infrastructure.

**Note na deploy:** #161-b je čistě UI change — žádné backend/schema migrations. Deploy pipeline bude standardní 7-step flow per `reference_deploy_checklist.md` (pull → build → pm2 reload). Žádné manuální kroky navíc (na rozdíl od #161-a, kde bylo nutno přidat `account.updated` event do Stripe Dashboard).

---

## §9 — Pipeline next steps

- **#169 kontrolor** — ověří implementaci vůči plan §7 + §20 LEAD DECISIONS
- **#170 evžen** — smart code review (security, correctness, UX)
- **#171 test-chrome** — e2e flow test (admin otevře PartnerDetail → 5-state rendering → copy link + sync buttons)
- **#172 lead review** — SCHVÁLENO/AMEND rozhodnutí
- **#173 deploy** — production rollout (pokud SCHVÁLENO)

**Do NOT push** — per task brief, pipeline jde přes kontrolor → evžen → test-chrome → lead → deploy. Lokální commit je na `main` větvi, čeká na pipeline.

---

**HOTOVO** — Task #168 ready for lead review. Commit `63bf026` na `main`.
