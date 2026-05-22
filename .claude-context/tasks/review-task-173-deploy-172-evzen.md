# EVZEN Review #174 — Deploy report #172 #161-b shoda-check

**Reviewer:** evzen-the-king (READ-ONLY)
**Task:** #174 — verify deploy-task-172-161b.md proti canonical checklist + plán §12.2
**Deploy report:** `.claude-context/tasks/deploy-task-172-161b.md`
**Plán:** `.claude-context/tasks/plan-task-161-stripe-onboarding.md` §12.2
**Memory:** `reference_deploy_checklist.md`
**Commit deployed:** `63bf026`
**Datum:** 2026-04-08

---

## §1 — 8 acceptance checks vs deploy report

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| 1 | 7-step canonical flow v pořadí (push→pull→migrate deploy→generate→build→reload→status/logs) | ✅ PASS | Deploy §1 tabulka: 1. push, 2. pull, 3. migrate deploy, 4. generate, 5. build, 6. pm2 reload, 7a. pm2 status, 7b. pm2 logs. Canonical `reference_deploy_checklist.md` 7-step flow fully respected (push je dev-side prerequisite, stejně jako u #166) |
| 2 | Commit deployed = `63bf026` | ✅ PASS | Header: "`Commit deployed: 63bf026 feat(#161-b): admin Stripe Connect onboarding UI`". Step 1 push: `2bf0657..63bf026 main -> main`. Git log ověřen — `63bf026` je HEAD of main s parent `2bf0657` (#161-a) |
| 3 | `No pending migrations` je očekávané (žádné schema změny v #161-b) | ✅ PASS | Step 3: `No pending migrations to apply`. **Očekávané** — commit `63bf026` neobsahuje žádný `prisma/migrations/*` ani `prisma/schema.prisma` soubor (ověřeno `git show --stat`). `migrate deploy` je idempotent no-op. Canonical memory přímo dokumentuje: "Skip both steps only if the commit range has NO `prisma/migrations/*` or `prisma/schema.prisma` changes" — implementator zvolil safe-by-default spustit oba kroky, což je správné |
| 4 | Build 1216/1216 nebo blízko, exit 0, žádné nové errory | ✅ PASS | Step 5: `Compiled successfully in 23.8s`, `EXIT_CODE=0`. §2.2: "Static generation: 1216 SSG pages". Baseline po #161-a byla 1216, delta 0 (#161-b nepřidává žádné routes — čistě UI komponenty importované do existujícího `PartnerDetail.tsx`). §3: "Žádné nové errory po deployi #161-b" |
| 5 | PM2 carmakler online po reloadu, Ready time <1s | ✅ PASS | Step 6: `[carmakler](0) ✓`. §2.3: carmakler online, pid 2234979, uptime 10s, 0% CPU, mem 69.6mb. §2.4: `Ready in 814ms` — **814ms < 1000ms**, v normálním rozsahu (#160: 845ms, #166: 837ms). Žádný restart loop |
| 6 | Scope sanity — 7 souborů (admin UI + shared lib + utils), žádné schema/webhook changes | ✅ PASS | Deploy §2.1 + §4 potvrzuje 7 files. `git show --stat 63bf026` potvrzuje přesně: CommissionHistoryList.tsx, PartnerDetail.tsx, StripeOnboardingCard.tsx (new), StripeStatusBadge.tsx (new), stripe-connect-shared.ts (new), stripe-connect.ts (modified), utils.ts (modified). **0 souborů v `prisma/`, 0 souborů v `app/api/`, 0 souborů v `app/(pwa-parts)/`**. Čistě UI change |
| 7 | Žádný manuální Stripe Dashboard step | ✅ PASS | Deploy §4 tabulka: "Nové Stripe webhook events? None (`account.updated` už v Dashboardu z #161-a)", "Manual deploy steps? None (čistě UI change)". Na rozdíl od #161-a, kde #166 měl celou §4 sekci s `account.updated` event registrací, #172 deploy report **explicitně** potvrzuje absenci manuálního kroku |
| 8 | Pre-existing noise flagged non-blocking | ✅ PASS | Deploy §3 explicit enumeration: (1) "Too many database connections" SSG — "Pre-existing, dokumentováno v impl-task-160-deploy-88a.md. Non-blocking", (2) CSP violations `img-src` unsplash — "Pre-existing CSP tightening z #167", (3) Sentry deprecation — "Pre-existing, follow-up Sentry upgrade task", (4) NoFallbackError na `/dily/znacka/...` — "pre-existing runtime fallback error z #88a". Všechny 4 kategorie explicit non-blocking + závěr §3: "Žádné nové errory po deployi #161-b" |

**Výsledek 8/8:** ✅ Všech 8 acceptance checks PASS.

---

## §2 — Canonical deploy flow compliance

Mapping proti memory `reference_deploy_checklist.md`:

| Canonical # | Canonical command | Deploy report step | Status |
|---|---|---|---|
| 1 | `git pull origin main` | §1 step 2 | ✅ Fast-forward |
| 2 | `npx prisma migrate deploy` | §1 step 3 | ✅ `No pending migrations` (idempotent no-op, expected per scope) |
| 3 | `npx prisma generate` | §1 step 4 | ✅ Client v7.5.0 regen in 628ms |
| 4 | `npm run build` | §1 step 5 | ✅ 23.8s compile, exit 0 |
| 5 | `pm2 reload all` | §1 step 6 | ✅ Both procs reloaded |
| 6 | `pm2 status` | §1 step 7a | ✅ carmakler online |
| 7 | `pm2 logs carmakler --lines 30 --nostream` | §1 step 7b | ✅ Ready in 814ms, clean startup |

Deploy report přidává step 1 `git push origin main` (dev-side prerequisite — stejný pattern jako #166 #161-a deploy). Není to deviace od canonical, canonical začíná na production side.

**Canonical compliance: ✅ 7/7 kroků provedeno v pořadí.**

**Poznámka k prisma krokům:** `migrate deploy` + `generate` jsou spuštěny navzdory tomu, že commit nemá schema změny. Memory `reference_deploy_checklist.md` říká: *"Skip both steps only if the commit range has NO `prisma/migrations/*` or `prisma/schema.prisma` changes"* — tedy "skip" je opt-in. Implementator zvolil safe-by-default provést oba kroky jako no-op (idempotent). **Správné rozhodnutí** — safe-by-default pro mechanical deploy flow, zanedbatelný overhead (~2s).

---

## §3 — Plan §12.2 scope vs deployed soubory

§12.2 scope (plán L1171-1175):
1. `components/admin/partners/StripeOnboardingCard.tsx`
2. `components/admin/partners/StripeStatusBadge.tsx`
3. Integrace v `PartnerDetail.tsx` (insert Card, remove amber warning, extend interface)
4. CZ translation helper `STRIPE_REQUIREMENTS_CZ`

Deployed files (`git show --stat 63bf026`):
1. ✅ `StripeOnboardingCard.tsx` (260 ř. new)
2. ✅ `StripeStatusBadge.tsx` (28 ř. new)
3. ✅ `PartnerDetail.tsx` (+20 / -)
4. ✅ `stripe-connect-shared.ts` (101 ř. new) — client-safe helper s `STRIPE_REQUIREMENTS_CZ` (#161-b zvolená architektura z impl §2.1, plán §8.3 extraction)

**Bonus (ne v §12.2 ale schválené v impl review):**
- `CommissionHistoryList.tsx` — migrace na shared `formatRelativeCz` helper
- `lib/utils.ts` — `formatRelativeCz` extract (4. duplikát v repu, review fix)
- `lib/stripe-connect.ts` — re-export wrapper pro backwards compat

Všech **4 § 12.2 položky** deployed + 3 review-driven refactor polish bonusy. Impl už byl schválen v #170 evžen review, takže scope je consistent.

---

## §4 — Zebra test (3 náhodné claims vs repo state)

### Claim 1: "`2bf0657..63bf026 main -> main`" (§1 step 1 push output)

**Verify:** `git log --oneline -5`:
```
63bf026 feat(#161-b): admin Stripe Connect onboarding UI
2bf0657 feat(#161-a): Stripe Connect Express backend — schema, helpers, API routes, webhook
```
✅ **PASS** — `63bf026` je přímý potomek `2bf0657` (no commits between). Fast-forward push legitimní, ancestry potvrzen.

### Claim 2: "7 files changed, 433 insertions(+), 103 deletions(-)" (§1 step 2, §7 deploy metrics)

**Verify:** `git show --stat 63bf026 | tail`:
```
components/admin/partners/CommissionHistoryList.tsx       |  20 +-
components/admin/partners/PartnerDetail.tsx               |  20 +-
components/admin/partners/StripeOnboardingCard.tsx        | 260 +++++++++++++++++++++
components/admin/partners/StripeStatusBadge.tsx           |  28 +++
lib/stripe-connect-shared.ts                              | 101 ++++++++
lib/stripe-connect.ts                                     |  85 +------
lib/utils.ts                                              |  22 ++
7 files changed, 433 insertions(+), 103 deletions(-)
```
✅ **PASS** — Přesně **7 souborů, 433 insertions, 103 deletions**. Deploy report claim matches git state byte-for-byte.

### Claim 3: "Schema changes? None" (§4 scope sanity)

**Verify:**
- `git show --stat 63bf026` — 7 files, **žádný v `prisma/`** (migrations ani schema.prisma)
- Step 3 deploy output: `No pending migrations to apply`
- §12.2 plán scope **neobsahuje** schema changes (#161-b je čistě UI)

✅ **PASS** — Nulové schema/migration changes v commitu. Deploy report §4 správně flagguje. `migrate deploy` step byl no-op jak očekáváno.

**Zebra 3/3:** ✅ PASS

---

## §5 — Discrepancies

**Žádné.** Deploy report je vnitřně konzistentní, souhlasí s git state, plán §12.2, canonical checklist, #170 evžen review závěry.

**Minor observations (informační, ne blockery):**

1. **OBS-1 (informační):** Build time 23.8s (deploy report §2.2 + §7) vs impl report's lokální build `16.4s`. Delta +7.4s je typicky production build overhead (serwist bundling, full SSG pass 1216 pages). Srovnání s #160 baseline (24s compile) je konzistentní. **Žádná regrese.**

2. **OBS-2 (informační):** PM2 restart counter `62` (§2.3) oproti #166 `61`. Delta +1 = tento deploy. Žádný crash loop (stejný pattern jako #166 observation).

3. **OBS-3 (informační):** Plán §12.2 explicitně `STRIPE_REQUIREMENTS_CZ` jako položka #4 — ale původní plán §8.3 tuto constantu umisťuje do `lib/stripe-connect.ts`. Implementace zvolila lepší architekturu: extrahuje do `lib/stripe-connect-shared.ts` (client-safe split) a re-exportuje ze server `lib/stripe-connect.ts` pro backwards compat. **Žádná deviation od spirit §12.2**, jen architektonická optimalizace vyžádaná technickou potřebou (`pg` driver v client bundle). Impl §2.1 + #170 evžen review už tuto architektonickou volbu schválili.

4. **OBS-4 (informační — cross-check s #167):** Deploy report §3 zmiňuje pre-existing CSP violations z `inzerce.carmakler.cz` odkazující na Unsplash — nová informace oproti #166 kde CSP violations byly z hlavní domény. Subdomain konzistentní s pre-existing tightening z #167. Non-blocking, unrelated k #161-b.

---

## §6 — Verdikt

### ✅ PASS — 0 discrepancies, 4 informační OBS

Deploy #172 proběhl v souladu s:
- Plán `plan-task-161-stripe-onboarding.md` §12.2 (všech 4 scope položky deployed)
- Memory `reference_deploy_checklist.md` 7-step canonical flow
- #170 evžen review závěry (commit `63bf026` schválen pre-deploy)
- #171 test-chrome pipeline gate

**Všech 8 acceptance checks:** ✅ PASS
**Zebra test 3/3:** ✅ PASS
**Canonical deploy flow 7/7:** ✅ PASS
**Pre-existing noise flagging 4/4:** ✅ Správně kategorizováno
**Plan §12.2 scope:** ✅ 4/4 položky deployed

**Deploy je live na produkci.** Admin UI Stripe Connect onboarding dostupný na `/admin/partners/[id]`. 0 blockerů, 0 regresí, 0 rollback doporučení.

**Next step:**
- Smoke test (manual): admin login do `/admin/partners/[id]` → ověřit `StripeOnboardingCard` render pro existing partner (expected state: `not_started` protože žádný partner ještě nemá Stripe account)
- Dispatch **#161-c** (PWA self-service UI) — unblocked per plán §12.3

**Žádné FINDINGS, nic nevracím.**

---

**EVZEN signoff: 2026-04-08**
