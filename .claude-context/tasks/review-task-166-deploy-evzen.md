# EVZEN Review #167 — Deploy report #166 #161-a shoda-check

**Reviewer:** evzen-the-king (READ-ONLY)
**Task:** #167 — verify deploy-task-166-161a.md proti plánu + canonical deploy checklist
**Deploy report:** `.claude-context/tasks/deploy-task-166-161a.md`
**Plán:** `.claude-context/tasks/plan-task-161-stripe-onboarding.md` (§12.1, §20 Q1-Q8, §6.4)
**Memory reference:** `reference_deploy_checklist.md` (7-step canonical flow)
**Commit deployed:** `2bf0657`
**Datum:** 2026-04-08

---

## §1 — 8 acceptance checks vs deploy report

| # | Acceptance check | Status | Evidence |
|---|------------------|--------|----------|
| 1 | 7-step canonical flow (pull → migrate deploy → generate → build → reload → status → logs) | ✅ PASS | Deploy §1 tabulka: step 2 pull, step 3 `prisma migrate deploy`, step 4 `prisma generate`, step 5 `npm run build`, step 6 `pm2 reload all`, step 7 `pm2 status` + `pm2 logs --lines 30 --nostream`. Všech 7 canonical kroků proběhlo v správném pořadí. Step 1 `git push origin main` je dev-side prerequisite (bez push by pull nebyl no-op) — rozumná extenze, ne deviace |
| 2 | Commit deployed = `2bf0657` | ✅ PASS | Header deploy reportu: `**Commit deployed:** 2bf0657 feat(#161-a)`. Step 1 push: `42691c5..2bf0657 main -> main`. Step 2 pull: `Updating 42691c5..2bf0657`. Git log ověřen — `2bf0657` je head of main, ancestory `72ffd88` (§20 plán) → `e7c65c3` (plán) → `42691c5` (#88a) |
| 3 | Migration `20260408093456_add_partner_stripe_onboarding_state` applied | ✅ PASS | Step 3 output: `Applying migration \`20260408093456_add_partner_stripe_onboarding_state\`` + `All migrations have been successfully applied.`. Migration file ověřen lokálně (15 řádků: 8 ADD COLUMN + 2 CREATE INDEX, non-destructive) |
| 4 | Build 1216/1216 pages, exit 0 | ✅ PASS | Step 5: `✓ Compiled successfully in 24.4s` + `✓ Generating static pages (1216/1216)` + exit 0. Time: real 1m49.502s. Srovnání s #160 baseline 1213 → +3 (Connect routes shells), expected delta |
| 5 | PM2 carmakler online after reload | ✅ PASS | Step 6: `[PM2] [carmakler](0) ✓`. Step 7 status: `carmakler` id 0, pid 2209419, uptime 11s, status `online`, mem 69.8mb. Logs: `▲ Next.js 16.1.7 ... ✓ Ready in 837ms` — clean startup |
| 6 | Žádné nové runtime errory pro Stripe Connect / webhook / lib / Partner / Prisma | ✅ PASS | Deploy §2.7 explicit enumeration: "Žádné error logy spojené s: `/api/stripe/connect/onboard-link`, `/status`, `/dashboard-link`, `/api/stripe/webhook`, `lib/stripe-connect.ts`, Partner schema loading / Prisma generate, `account.updated` webhook handling". Žádný regres |
| 7 | Manuální post-deploy krok (Stripe Dashboard `account.updated` event) dokumentován | ✅ PASS | Deploy §4 celá sekce: §4.1 (4 kroky instrukce Dashboard → Developers → Webhooks → Add event `account.updated` → Save), §4.2 (cituje plán §6.4 verbatim: *"Manuální step (deploy): V Stripe Dashboard → Developers → Webhooks → upravit existující webhook endpoint → přidat event `account.updated`"*), §4.3 (verifikace Stripe CLI trigger). Plán §6.4 ověřen — text souhlasí |
| 8 | Pre-existing noise správně flagged non-blocking | ✅ PASS | §2.5: "Too many database connections" flagged jako "Dokumentovaný v impl-task-160-deploy-88a.md jako pre-existing follow-up. Build exit 0, pipeline pokračuje." §2.7 carmakler-error.log bullet list: (1) CSP Unsplash "pre-existing, unrelated k #161-a", (2) Sentry deprecation "pre-existing Sentry upgrade warnings, neblokující", (3) NoFallbackError `/dily/znacka/[brand]/[model]/[rok]` "pre-existing runtime error na unrelated route, nezasaženo #161-a". §6 blocker resolution: "Pre-existing issues které NEBYLY blockery". Všechny 4 noise kategorie explicit non-blocking |

**Výsledek 8/8:** ✅ Všech 8 acceptance checks PASS.

---

## §2 — Canonical deploy checklist compliance

Canonical 7-step flow z memory `reference_deploy_checklist.md`:

```
1. ssh server "cd /var/www/carmakler && git pull origin main"
2. ssh server "cd /var/www/carmakler && npx prisma migrate deploy"
3. ssh server "cd /var/www/carmakler && npx prisma generate"
4. ssh server "cd /var/www/carmakler && npm run build"
5. ssh server "pm2 reload all"
6. ssh server "pm2 status"
7. ssh server "pm2 logs carmakler --lines 30 --nostream"
```

Deploy report mapping:

| Canonical # | Canonical command | Deploy report step | Deploy report status |
|---|---|---|---|
| 1 | `git pull origin main` | §2.2 step 2 | ✅ Fast-forward 9 files |
| 2 | `npx prisma migrate deploy` | §2.3 step 3 | ✅ 1 migration applied |
| 3 | `npx prisma generate` | §2.4 step 4 | ✅ Client v7.5.0 in 596ms (memory pravidlo "kritický krok" — precedent #160 blocker 2 explicitně citováno v §2.4) |
| 4 | `npm run build` | §2.5 step 5 | ✅ 24.4s compile, 1216/1216, 1m49.502s total |
| 5 | `pm2 reload all` | §2.6 step 6 | ✅ Both procs reloaded |
| 6 | `pm2 status` | §2.7 step 7 (first half) | ✅ carmakler online |
| 7 | `pm2 logs carmakler --lines 30 --nostream` | §2.7 step 7 (second half) | ✅ Clean startup, pre-existing noise flagged |

Deploy report **navíc** přidal step 1 `git push origin main` (dev-side), což není v canonical. **NE-deviace** — canonical začíná na production side, push je logická předpodmínka (commit musel být na origin aby pull fungoval). Není vynechán žádný canonical krok.

**Canonical compliance: ✅ 7/7 kroků provedeno v pořadí.**

---

## §3 — Zebra test (3 náhodné claims vs repo state)

### Claim 1: "Fast-forward `42691c5..2bf0657` na produkci" (§2.2)

**Verify:** `git log --oneline -5`
```
2bf0657 feat(#161-a): Stripe Connect Express backend — schema, helpers, API routes, webhook
72ffd88 docs(plan-161): LEAD DECISIONS Q1-Q8 verbatim
e7c65c3 plan: #161 Stripe Connect Express onboarding UI
42691c5 feat(#88a): Wolt model — partner commission slider + Stripe split + audit log
```
✅ `2bf0657` je lineal descendant `42691c5` (2 commity mezi: `e7c65c3` plán + `72ffd88` §20). Fast-forward legitimní.

### Claim 2: "Migration file obsahuje 8 ADD COLUMN + 2 CREATE INDEX, non-destructive" (§3.1)

**Verify:** Read `prisma/migrations/20260408093456_add_partner_stripe_onboarding_state/migration.sql` — 15 řádků:
```sql
ALTER TABLE "Partner" ADD COLUMN "stripeAccountUpdatedAt" TIMESTAMP(3),
ADD COLUMN "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripeDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripeDisabledReason" TEXT,
ADD COLUMN "stripeOnboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN "stripeOnboardingStartedAt" TIMESTAMP(3),
ADD COLUMN "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripeRequirementsCurrentlyDue" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "Partner_stripeAccountId_idx" ON "Partner"("stripeAccountId");
CREATE INDEX "Partner_stripePayoutsEnabled_idx" ON "Partner"("stripePayoutsEnabled");
```
✅ Přesně 8 ADD COLUMN a 2 CREATE INDEX statements. Žádné DROP, žádné ALTER TYPE, žádný data migration. Non-destructive.

### Claim 3: "`applyCommissionSplit()` nedotčen" (§3.3)

**Verify:**
- `git show 2bf0657 -- app/api/stripe/webhook/route.ts | grep -c "^-[^-]"` → **0** (žádné removed lines v diff)
- Live grep `applyCommissionSplit` v `app/api/stripe/webhook/route.ts`:
  - L169: `await applyCommissionSplit(orderId);`
  - L171: `console.error('[webhook] applyCommissionSplit failed for order ${orderId}:', err);`
  - L198: `async function applyCommissionSplit(orderId: string) {`

✅ Funkce stále existuje na L198, invokace na L169, error handling L171. STOP-5 dodržen, žádná modifikace #88a webhook kódu.

**Zebra 3/3 PASS.**

---

## §4 — §20 LEAD DECISIONS Q1-Q8 coverage v deploy reportu

Deploy není mistem na verbatim cross-check Q1-Q8 (to dělal #164 EVZEN review impl). Ale deploy report **implicitně** respektuje §20 decisions:

| Q | Relevance pro deploy | Status |
|---|----------------------|--------|
| Q1 | Transfers-only capability → migration `stripeChargesEnabled` nullable boolean, ne required | ✅ Migration reflektuje (charges_enabled tracking, ne requested capability) |
| Q2 | Dual entry point → 3 API routes deployed jsou path-agnostic (resolvePartnerForConnect handles) | ✅ Deploy §3.2 potvrzuje 3 routes |
| Q3 | BEZ business_type → není deploy-relevant (runtime) | N/A |
| Q4 | Replay guard → runtime, není deploy-relevant | N/A |
| Q5 | 17 CZ klíčů → runtime | N/A |
| Q6 | Reuse existing webhook endpoint | ✅ Deploy §2.5 build output: `ƒ /api/stripe/webhook` (existing) + 3 nové Connect routes. Žádný `ƒ /api/stripe/connect/webhook` (would indicate new endpoint file) |
| Q7 | Žádná komunikace s partnery | ✅ Deploy §3.3: "Žádná email/banner/push komunikace s partnery (per §20 Q7)" |
| Q8 | Žádný hard merge gate | ✅ Deploy §6: "žádné escalation prompty", plain pipeline |

---

## §5 — Discrepancies

**Žádné.** Deploy report je vnitřně konzistentní, souhlasí s repo state, plán §6.4, memory canonical checklist, i #164 EVZEN review závěry.

**Minor observations (informační, ne blockery):**

1. **OBS-1 (informační):** Deploy report §2.2 hlásí pull "9 files changed, 2422 insertions" — to zahrnuje i `plan-task-161-stripe-onboarding.md` (1643 řádků) a `impl-task-162-161a.md` (240 řádků), které jsou v `.claude-context/tasks/` a **nemají runtime impact**. Actual runtime deploy = 7 souborů (lib + 3 API routes + webhook + schema + migration). Report to správně rozlišuje v §8 (files deployed table) s "9 files" total včetně plan/impl docs.

2. **OBS-2 (informační):** Deploy report hlásí `restart count 61` u carmakler procesu. To je kumulativní od posledního `pm2 start`, ne od tohoto deployu. Srovnání s #160 (`↺ 60`) potvrzuje delta +1 = tento reload. Žádný crash loop, žádný problém.

3. **OBS-3 (kritický post-deploy dependency):** Deploy §4 manual step (`account.updated` event ve Stripe Dashboard) je **required pro webhook push model**. Dokud lead neprovede tento krok, produkční webhook nedostane `account.updated` eventy → `syncAccountToDb` se nevolá automaticky → `stripeOnboardingCompletedAt` nezapíše se automaticky. **Pull model** přes `GET /api/stripe/connect/status?refresh=1` stále funguje (60s rate-limit). Deploy report to explicitně dokumentuje v §4.3. **Evzen doporučuje team-leadovi: ověřit Stripe Dashboard step před dispatch #161-c PWA UI fáze** (aby partner self-service onboarding měl funkční webhook push).

---

## §6 — Verdikt

### ✅ PASS — 0 discrepancies, 3 informační OBS

Deploy #166 proběhl v souladu s:
- `plan-task-161-stripe-onboarding.md` §12.1 scope (backend only)
- `plan-task-161-stripe-onboarding.md` §6.4 (manuální Stripe Dashboard step dokumentován)
- `plan-task-161-stripe-onboarding.md` §20 Q1-Q8 (implicit — code už reviewed v #164)
- memory `reference_deploy_checklist.md` 7-step canonical flow

**Všech 8 acceptance checks:** ✅ PASS
**Zebra test 3/3:** ✅ PASS
**Canonical deploy flow 7/7:** ✅ PASS
**Pre-existing noise flagging:** ✅ Všechny 4 kategorie explicit non-blocking

**Deploy je live na produkci. 0 blockerů, 0 regresí, 0 rollback doporučení.**

**Next step per deploy §7.1:**
1. Team-lead provede manuální krok ve Stripe Dashboard (§4.1) — required před #161-c PWA self-service
2. (optional) Smoke test + Stripe CLI trigger
3. Dispatch #161-b (admin UI) — unblocked

**Žádné FINDINGS, nic nevracím.**

---

**EVZEN signoff: 2026-04-08**
