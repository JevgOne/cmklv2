# EVZEN Review #180 — Deploy report #179 #161-c shoda-check

**Reviewer:** evzen-the-king (READ-ONLY)
**Task:** #180 — verify deploy-task-179-161c.md proti canonical checklist + plán §12.3
**Deploy report:** `.claude-context/tasks/deploy-task-179-161c.md`
**Plán:** `.claude-context/tasks/plan-task-161-stripe-onboarding.md` §12.3
**Memory:** `reference_deploy_checklist.md`
**Commity deployed:** `64d7478` + `e678f7c` (range `63bf026..e678f7c`)
**Datum:** 2026-04-08

---

## §1 — 8 acceptance checks vs deploy report

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| 1 | 7-step canonical flow v pořadí (push → pull → migrate deploy → generate → build → reload → status/logs) | ✅ PASS | Deploy §1 tabulka: 1. push, 2. pull, 3. migrate deploy, 4. generate, 5. build, 6. pm2 reload, 7a. pm2 status, 7b. pm2 logs. Kompletní mapping proti `reference_deploy_checklist.md` — stejný pattern jako #166 a #172. Push je dev-side prerequisite (canonical začíná na produkční straně) |
| 2 | Commity deployed = `64d7478` + `e678f7c`, fast-forward `63bf026..e678f7c` | ✅ PASS | Header: "Commity deployed: `64d7478` + `e678f7c`". Step 1 push: `63bf026..e678f7c main -> main`. Step 2 pull: `Fast-forward 63bf026..e678f7c, 5 files changed, +328/-23`. Git log ověřen: `e678f7c` parent `64d7478`, `64d7478` parent `63bf026` (#161-b HEAD). Ancestry potvrzen |
| 3 | `No pending migrations` je EXPECTED (žádné schema změny v #161-c) | ✅ PASS | Step 3: "`8 migrations found`, `No pending migrations to apply` (idempotent no-op jak očekáváno)". **Live verifikace:** `git diff --name-only 63bf026..e678f7c -- prisma/migrations/* prisma/schema.prisma \| wc -l` = **0**. Canonical memory: *"Skip both steps only if the commit range has NO `prisma/migrations/*` or `prisma/schema.prisma` changes"* — implementator zvolil safe-by-default spustit oba kroky jako no-op. Správné rozhodnutí, stejný pattern jako #172 deploy #161-b |
| 4 | Build 24.4s, exit 0, `/parts/profile` v outputu | ✅ PASS | Step 5: `Compiled successfully in 24.4s`, **EXIT_CODE=0**. §2.3: `/parts/profile` v build outputu jako `○ /parts/profile` (Static) — page šablona prerenderovaná, card self-fetch happens client-side. 24.4s v normálním rozsahu (baseline 20-25s, #172 byl 23.8s, delta +0.6s z dodatečného client bundle) |
| 5 | PM2 carmakler online po reloadu, Ready <1s (868ms) | ✅ PASS | Step 6: `[carmakler](0) ✓` + `[zajcon-firmy](2) ✓`. §2.4: carmakler online, pid 2251729, uptime 10s, 0% CPU, 69.9mb, restart 63. §2.5: `Ready in 868ms` — **868ms < 1000ms**, v normálním rozsahu (#172: 814ms, #166: 837ms, delta +54ms attributable to SupplierStripeCard ~+8KB client bundle per §7 metriky). Žádný restart loop |
| 6 | Scope sanity — 5 souborů (PWA + shared helpers + admin import update), žádné webhook/api/prisma změny | ✅ PASS | Deploy §2.2 + §4 potvrzuje 5 files. **Live `git diff --name-only 63bf026..e678f7c`:** (a) `app/(pwa-parts)/parts/profile/page.tsx`, (b) `components/admin/partners/StripeOnboardingCard.tsx`, (c) `components/pwa-parts/profile/SupplierStripeCard.tsx`, (d) `components/ui/StripeStatusBadge.tsx` (rename 100%), (e) `lib/stripe-connect-shared.ts`. **Live `git diff --name-only 63bf026..e678f7c -- 'prisma/*' 'app/api/*' \| wc -l` = 0**. Čistě UI + client-safe lib change |
| 7 | Žádný manuální Stripe Dashboard step — na rozdíl od #161-a | ✅ PASS | Deploy §4 tabulka: "Nové Stripe webhook events? ✅ None (STOP-5)", "Manual Stripe Dashboard steps? ✅ None — pure UI change". §9 explicit: "Jedna manuální akce zůstává z #161-a (nesouvisí s #161-c)" — odkazuje na `account.updated` webhook registration z #166. #161-c je **pure UI change**, žádný nový Stripe kontrakt |
| 8 | Pre-existing noise flagged non-blocking | ✅ PASS | Deploy §3 explicit enumeration: (1) CSP violations `img-src` unsplash z `inzerce.carmakler.cz` (pre-existing z #167), (2) Sentry deprecation `autoInstrument*` (pre-existing FU task), (3) `NoFallbackError` v `/dily/znacka/[brand]/[model]/[rok]` (pre-existing z #88a), (4) `prisma:error` SSG "Too many database connections" (dokumentováno v `impl-task-160-deploy-88a.md`). §3 závěr: "Žádné nové errory po deployi #161-c. Zkontroloval jsem error log podrobně — žádný `SupplierStripeCard`, `stripe-connect-shared`, `/parts/profile`, nebo `/api/stripe/connect/*` entry" |

**Výsledek 8/8:** ✅ Všech 8 acceptance checks PASS.

---

## §2 — Canonical deploy flow compliance

Mapping proti memory `reference_deploy_checklist.md`:

| Canonical # | Canonical command | Deploy report step | Status |
|---|---|---|---|
| 1 | `git pull origin main` | §1 step 2 | ✅ Fast-forward `63bf026..e678f7c` |
| 2 | `npx prisma migrate deploy` | §1 step 3 | ✅ `No pending migrations` (idempotent no-op, expected per scope) |
| 3 | `npx prisma generate` | §1 step 4 | ✅ Client v7.5.0 regen in 590ms |
| 4 | `npm run build` | §1 step 5 | ✅ 24.4s compile, exit 0 |
| 5 | `pm2 reload all` | §1 step 6 | ✅ Both procs reloaded |
| 6 | `pm2 status` | §1 step 7a | ✅ carmakler online |
| 7 | `pm2 logs carmakler --lines 30 --nostream` | §1 step 7b | ✅ Ready in 868ms, clean startup |

Deploy report přidává step 1 `git push origin main` (dev-side prerequisite — stejný pattern jako #166 #161-a deploy + #172 #161-b deploy). Není to deviace od canonical, canonical začíná na production side.

**Canonical compliance: ✅ 7/7 kroků provedeno v pořadí.**

**Poznámka k prisma krokům:** `migrate deploy` + `generate` jsou spuštěny navzdory tomu, že commit range nemá schema změny. Memory `reference_deploy_checklist.md` říká: *"Skip both steps only if the commit range has NO `prisma/migrations/*` or `prisma/schema.prisma` changes"* — tedy "skip" je opt-in. Implementator zvolil safe-by-default provést oba kroky jako no-op (idempotent). **Správné rozhodnutí** — safe-by-default pro mechanical deploy flow, zanedbatelný overhead (~2s), konzistentní s #172 deploy #161-b pattern.

---

## §3 — Plan §12.3 scope vs deployed soubory

§12.3 scope (plán L1184-1197):
1. `components/pwa-parts/profile/SupplierStripeCard.tsx` (§8.4)
2. Integrace v `app/(pwa-parts)/parts/profile/page.tsx` (insert Card)
3. Query param handling (`?stripe=return`, `?stripe=refresh`)
4. Mobile responsive sanity check

Deployed files (`git diff --name-only 63bf026..e678f7c`):
1. ✅ `components/pwa-parts/profile/SupplierStripeCard.tsx` (283 ř. new)
2. ✅ `app/(pwa-parts)/parts/profile/page.tsx` (+4 lines: import + `<SupplierStripeCard />` insert)
3. ✅ Query param handling v `SupplierStripeCard.tsx:72-130` (mount-only useEffect + router.replace)
4. ✅ Mobile responsive copy v STATE_COPY (L18-47) — ověřeno v #177 evžen review (§8.6 "Onboarding otevře prohlížeč" doslovně)

**Bonus (nad rámec §12.3, ale plan-compliant):**
- `components/ui/StripeStatusBadge.tsx` — **rename 100%** z `components/admin/partners/` per plán §13.1 L1213 explicit allowance *"(nový, **může být v components/ui/**)"*. Schválené #177 evžen review.
- `components/admin/partners/StripeOnboardingCard.tsx` — import path update (admin consumer nového badge path, atomicky v `64d7478`)
- `lib/stripe-connect-shared.ts` (+36 lines) — extrakce `StripeConnectStatusResponse` + `mapStatusResponseToPartnerFields` pro reuse mezi admin card a PWA card (simplify fix z `e678f7c`)

Všech **4 §12.3 položky** deployed + 3 architektonické optimalizace (rename, import update, reuse extract). Impl + kontrolor + evžen už tyto schválili pre-deploy.

---

## §4 — Zebra test (3 náhodné claims vs repo state)

### Claim 1: "`63bf026..e678f7c main -> main`" (§1 step 1 push output)

**Verify:** `git log --oneline -4`:
```
e678f7c refactor(#161-c): simplify per /simplify review
64d7478 feat(#161-c): partner PWA Stripe Connect self-service UI
63bf026 feat(#161-b): admin Stripe Connect onboarding UI
2bf0657 feat(#161-a): Stripe Connect Express backend...
```

✅ **PASS** — `e678f7c` je přímý potomek `64d7478` který je přímý potomek `63bf026` (žádné commity mezi). Fast-forward push legitimní, ancestry `2bf0657 → 63bf026 → 64d7478 → e678f7c` potvrzen.

### Claim 2: "5 files changed, +328/-23" (§1 step 2, §2.2 detail)

**Verify:** `git diff --stat 63bf026..e678f7c`:
```
 app/(pwa-parts)/parts/profile/page.tsx             |   4 +
 components/admin/partners/StripeOnboardingCard.tsx |  28 +-
 components/pwa-parts/profile/SupplierStripeCard.tsx| 283 +++++++++++++++++++++
 components/{admin/partners => ui}/StripeStatusBadge.tsx |   0
 lib/stripe-connect-shared.ts                       |  36 +++
 5 files changed, 328 insertions(+), 23 deletions(-)
```

✅ **PASS** — Přesně **5 souborů, 328 insertions, 23 deletions**. Deploy report claim matches git state byte-for-byte. Rename `admin/partners/StripeStatusBadge.tsx → ui/StripeStatusBadge.tsx` zobrazen jako 0 changed lines (100% similarity), **potvrzuje §13.1 promotion bez content drift**.

### Claim 3: "Schema changes? None" + "webhook nedotčen (STOP-5)" (§4 scope sanity)

**Verify:**
- `git diff --name-only 63bf026..e678f7c -- 'prisma/*'` → 0 souborů
- `git diff --name-only 63bf026..e678f7c -- 'app/api/*'` → 0 souborů
- Live grep `applyCommissionSplit` v `app/api/stripe/webhook/route.ts` → L169, L171, L198 (nedotčeno)
- Step 3 deploy output: `No pending migrations to apply`

✅ **PASS** — Nulové schema/migration/webhook/api changes v deploy range. Deploy report §4 správně flagguje. `migrate deploy` step byl no-op jak očekáváno. STOP-5 dodržen — webhook funkčnost stále intact.

**Zebra 3/3:** ✅ PASS

---

## §5 — Pipeline #161 completeness check

Deploy report §8 claim: "Pipeline #161 je KOMPLETNÍ." Verifikace:

| Fáze | Commit | Deploy | Status |
|------|--------|--------|--------|
| #161-a backend (schema + routes + webhook + `account.updated` handler) | `2bf0657` | #166 (live) | ✅ Live |
| #161-b admin UI (StripeOnboardingCard + badge + integration) | `63bf026` | #172 (live) | ✅ Live |
| #161-c partner PWA UI (SupplierStripeCard + badge move + shared extract) | `64d7478` + `e678f7c` | #179 (live — tento deploy) | ✅ Live |

**Live git log ověření:** `git log --oneline -4` potvrzuje že všechny 3 commity jsou na `main` ve správném pořadí (`2bf0657 → 63bf026 → 64d7478 → e678f7c`). Fast-forward ancestry bez deviace.

**Pipeline #161 stanovisko EVZEN:** ✅ **KOMPLETNÍ.** Stripe Connect Express onboarding je plně funkční across celou platformu — backend helpers + API routes + webhook handler (#161-a) + admin self-service UI (#161-b) + partner PWA self-service UI (#161-c). Vrakoviště teď mají **obě entry points** (admin initiation + self-service) per §20 Q2 LEAD DECISION.

**Zbývající manuální akce z #161-a (NESOUVISÍ s #161-c):**
- Stripe Dashboard webhook event `account.updated` registration (dokumentováno v #166 deploy report §4.2, flagged v #167 EVZEN review jako OBS-3)
- Dokud uživatel neprovede, push-model webhook sync je OFF
- **Pull-model** (`?stripe=return` → force refresh) funguje plně — #161-c PWA card self-fetchuje při mountu a refreshuje po return z Stripe → **pipeline #161 je funkčně hotová i bez push-model**
- Deploy report §9 tuto dependency explicitly flagguje — správně kategorizováno

---

## §6 — Discrepancies

**Žádné.** Deploy report je vnitřně konzistentní, souhlasí s git state, plán §12.3, canonical checklist, #177 evžen review závěry.

**Minor observations (informační, ne blockery):**

1. **OBS-1 (informační):** Build time 24.4s (deploy §2.3 + §7) vs #172 23.8s (#161-b) vs #166 ~24s (#161-a). Delta +0.6s vs #172 je attributable to SupplierStripeCard client bundle (+~8KB min per §7 metriky) — v rozpuštění mezi SSG pages bundling. Non-signifikantní regrese, v normálním baseline rozsahu 20-25s.

2. **OBS-2 (informační):** PM2 restart counter `63` (§2.4) oproti #172 `62`. Delta +1 = tento deploy. Žádný crash loop (stejný pattern jako #166 → #172 → #179 postupný nárůst o +1 per deploy).

3. **OBS-3 (informační):** App start time 868ms vs #172 814ms (+54ms). Attributable to dodatečný client bundle import chain (`SupplierStripeCard` → `stripe-connect-shared` → `Badge` → `StripeStatusBadge`). Pod 1s threshold, non-blocking.

4. **OBS-4 (informační — cross-reference na #167 memory):** Deploy report §9 explicitly připomíná manuální Stripe Dashboard step z #161-a (`account.updated` event registration). Tato závislost je **z #161-a**, ne #161-c — #161-c deploy **nevyžaduje žádný manuální step**. Správně flagged jako "Jedna manuální akce zůstává z #161-a (nesouvisí s #161-c)".

---

## §7 — Verdikt

### ✅ PASS — 0 discrepancies, 4 informační OBS

Deploy #179 proběhl v souladu s:
- Plán `plan-task-161-stripe-onboarding.md` §12.3 (všech 4 scope položky deployed)
- Memory `reference_deploy_checklist.md` 7-step canonical flow
- #177 evžen review závěry (commity `64d7478` + `e678f7c` schváleny pre-deploy)
- #178 test-chrome GREEN 11/11 pipeline gate

**Všech 8 acceptance checks:** ✅ PASS
**Zebra test 3/3:** ✅ PASS
**Canonical deploy flow 7/7:** ✅ PASS
**Pre-existing noise flagging 4/4:** ✅ Správně kategorizováno
**Plan §12.3 scope:** ✅ 4/4 položky deployed + 3 architektonické bonusy

**Deploy je live na produkci.** Partner PWA Stripe Connect self-service card dostupný na `https://carmakler.cz/parts/profile` pro všechny PARTS_SUPPLIER uživatele. 0 blockerů, 0 regresí, 0 rollback doporučení.

### Pipeline #161 FINAL status

✅ **KOMPLETNĚ UZAVŘENA.**

- `2bf0657` #161-a backend — live (#166)
- `63bf026` #161-b admin UI — live (#172)
- `e678f7c` #161-c PWA UI — live (#179) ← tento deploy

Stripe Connect Express onboarding je plně funkční across celou platformu. Vrakoviště mohou:
- Dostat onboarding link od admina (#161-b admin UI)
- Self-service napojit Stripe přes PWA profil (#161-c PWA UI)
- Projít KYC flow na Stripe hosted pages (backend #161-a)
- Vrátit se automaticky na profil s `?stripe=return` query → auto-refresh stavu (#161-c query handler)

**Zbývající otevřené položky (nesouvisí s #161-c):**
- Uživatel má provést Stripe Dashboard `account.updated` webhook event registration (dokumentováno v #166 + #167, dokud neprovede, push-model sync je OFF; pull-model funguje plně)

**Next step doporučení:**
- **Smoke test (manual):** partner se přihlaší do PWA → `/parts/profile` → ověří render `SupplierStripeCard` v `not_started` state + mobile layout (expected: každý partner začíná bez Stripe účtu)
- **Optional live E2E v Stripe Test mode:** admin vytvoří test account + partner projde onboarding flow → ověří `?stripe=return` toast + state transition
- **Hlavní follow-up:** uživatel má provést manual Stripe Dashboard `account.updated` event registration (pending z #166)

**Žádné FINDINGS, nic nevracím. Pipeline #161 uzavřena.**

---

**EVZEN signoff: 2026-04-08**
