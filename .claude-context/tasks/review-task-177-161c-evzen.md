# EVZEN Review #177 — #161-c PWA Stripe Connect self-service UI

**Reviewer:** evzen-the-king (READ-ONLY)
**Task:** #177 — shoda-check implementace #161-c (commity `64d7478` + `e678f7c`) vs plán §8.4/§8.5/§8.6/§12.3 + §20 Q1-Q8
**Plán:** `.claude-context/tasks/plan-task-161-stripe-onboarding.md`
**Impl:** `.claude-context/tasks/impl-task-175-161c.md`
**Kontrolor:** `.claude-context/tasks/qa-task-176-161c.md`
**Commity:** `64d7478` (feat) + `e678f7c` (simplify)
**Branch:** `main` (lokální, nepushnuto)
**Datum:** 2026-04-08

---

## §1 — 6 acceptance checks vs implementace

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| 1 | **§12.3 scope (4 položky)** — SupplierStripeCard new + page integration + query param handling + mobile copy | ✅ PASS | (a) `components/pwa-parts/profile/SupplierStripeCard.tsx` 283 ř. nový (`64d7478` +309 lines, `e678f7c` simplify −94/+22). (b) `app/(pwa-parts)/parts/profile/page.tsx` L9 import + L94-95 `<SupplierStripeCard />` insert (git diff potvrzen). (c) Query param handler v useEffect L72-130 (return + refresh + mount-only ESLint disable s rationale). (d) Mobile-first copy "Onboarding otevře prohlížeč — po dokončení se vrátíš sem sám" v `not_started.body` L24 a `action_required.body` L34 |
| 2 | **§8.4 5-state flow** — všech 5 stavů + dashboard-link v `complete` | ✅ PASS | `STATE_COPY` Record L18-47 obsahuje všech 5 klíčů (`not_started`, `in_progress`, `action_required`, `complete`, `disabled`). Primary action routing L214-215: `state === "complete" ? handleOpenDashboard : handleStartOnboarding`. `handleOpenDashboard` L159-184 volá `POST /api/stripe/connect/dashboard-link` + `window.open(url, "_blank", "noopener,noreferrer")` L171 — **přesně §8.4 step 4**. **Klíčová věc z #161-b:** dashboard-link je v PWA (správně), nikoli v admin UI |
| 3 | **§8.5 query param handling** — `?stripe=return` (force refresh + 3 toast varianty + router.replace), `?stripe=refresh` (force refresh bez toastu), router.replace v success path (ne finally) | ✅ PASS | L73-75: `stripeParam = searchParams.get("stripe")`, `isReturn`, `isRefresh`. L82: `fetchConnectStatus(isReturn || isRefresh)` — both → force refresh. L85-104: `if (isReturn) { ... 3 toasty (complete/action_required/else) }`. L105-109: `router.replace("/parts/profile")` **uvnitř `try` bloku**, ne finally — při chybě query zůstane pro retry. **Žádná nová route** — `git show 64d7478 e678f7c -- app/api/stripe/connect/` → 0 výstupů. Plán §8.5: *"Žádná nová route pro return/refresh"* — splněno |
| 4 | **§8.6 mobile-first** — "Onboarding otevře prohlížeč..." copy + responsive patterns + `window.location.href` (onboard) vs `window.open(_blank)` (dashboard) | ✅ PASS | Copy "Onboarding otevře prohlížeč — po dokončení se vrátíš sem sám" L24 (not_started) + L34 (action_required) — **doslovně dle plánu §8.6** *"v PWA UI zmínit Onboarding otevře prohlížeč, po dokončení se vrátíš sem sám"*. Layout: Card `p-4 space-y-3` L224, header `flex items-start justify-between gap-3` L225, Button `w-full` L265 — mobile-first OK. Onboard L145: `window.location.href = url` (full redirect, zachová PWA contact). Dashboard L171: `window.open(url, "_blank", "noopener,noreferrer")` (zachová PWA kontext) |
| 5 | **§20 Q1-Q8 LEAD DECISIONS compliance** | ✅ PASS | **Q1 (transfers only):** #161-c nedotýká backendu, dědí z #161-a v produkci. ✅ **Q2 (BOTH entry points):** PWA self-service teď kompletní — vrakoviště má vlastní UI. ✅ **Q5 (17 klíčů reuse):** `translateRequirementsList` import L11 ze shared, lokálně 0 duplikací — manuální count `STRIPE_REQUIREMENTS_CZ` v shared L67-85 = **přesně 17 klíčů**. ✅ **Q7 (žádná komunikace s partnery):** grep `email|notify|push|resend` v `SupplierStripeCard.tsx` + `StripeStatusBadge.tsx` = **0 výsledků**. Žádné emaily, žádné push notifikace, žádné bannery. ✅ Ostatní Q (Q3 business_type, Q4 idempotency, Q6 webhook, Q8 hard gate) = backend-only, nedotčené |
| 6 | **STOP-5 + STOP-7 + no new routes** | ✅ PASS | `git show 64d7478 e678f7c -- app/api/stripe/webhook/route.ts app/api/partner/profile/ app/api/stripe/connect/` → **0 lines** výstup. Live grep `applyCommissionSplit` v `app/api/stripe/webhook/route.ts` = stále L169, L171, L198 (nedotčeno). #161-a backend (3 Connect routes) plně reused, žádný `app/api/` v commit diffsu |

**Výsledek 6/6:** ✅ Všech 6 acceptance checks PASS.

---

## §2 — Architectural deviation: StripeStatusBadge MOVE

**Změna:** `components/admin/partners/StripeStatusBadge.tsx` → `components/ui/StripeStatusBadge.tsx` (git rename 100%, žádný content diff)

**Plán §13.1 L1213 (verbatim):**
> `components/admin/partners/StripeStatusBadge.tsx                           (nový, **může být v components/ui/**)`

**Stanovisko EVZEN:** ✅ **Plan-compliant.** Plán explicitně otevíral oboje umístění v jedné větě. #161-b pod časovým tlakem zvolil `admin/partners/`, #161-c moment kdy badge potřebují **dva consumers** (admin + PWA) — promotion do shared `components/ui/` je **správné architektonické rozhodnutí, ne deviation**.

**Verifikace:**
- `find . -name StripeStatusBadge.tsx` (mimo node_modules/.next) → **1 výsledek**: `./components/ui/StripeStatusBadge.tsx`
- Žádný duplikát badge logiky
- `components/admin/partners/StripeOnboardingCard.tsx:15` import path aktualizován: `import { StripeStatusBadge } from "@/components/ui/StripeStatusBadge"` ✅
- `components/pwa-parts/profile/SupplierStripeCard.tsx:7`: `import { StripeStatusBadge } from "@/components/ui/StripeStatusBadge"` ✅
- Badge má 0 admin-specific props (jen `state: OnboardingState` + optional `className`) → namespace promotion legitimní

**Konsumenti badge:**
1. `components/admin/partners/StripeOnboardingCard.tsx` (admin UI #161-b)
2. `components/pwa-parts/profile/SupplierStripeCard.tsx` (PWA UI #161-c)
3. `e2e/chrome-test-171-161b.spec.ts` (test fixture, jen reference)

---

## §3 — Stanovisko ke 3 KONTROLOR observations

| # | KONTROLOR popis | EVZEN klasifikace | Důvod |
|---|---|---|---|
| OBS-1 | Lint warnings 550 (delta +3 vs #161-b baseline 547), pre-existing v `.next` bundlech (sw.js) | **Informační, non-blocker** | Pre-existing v generated `.next` artifacts. 0 errors v `npm run lint`. Delta +3 nemá souvislost s #161-c kódem (commity nemodifikují sw.js). Stejný pattern jako OBS-2 v #170 (lint baseline drift) |
| OBS-2 | `in_progress` copy: plán §8.2 uvádí "Dáme ti vědět emailem", implementace to vynechala | **Pozitivní deviation, non-blocker** | **Q7 LEAD DECISION zakazuje veškerou komunikaci s partnery v #161-x.** Plán §8.2 obsahuje zastaralý copy ze early draftu, který Q7 přepsala. Implementace správně vynechala false email promise a nahradila motivačním copy "Pokud chceš něco upravit, pokračuj v onboardingu." Kontrolor správně označil jako observation, ne discrepancy. EVZEN potvrzuje: implementace honoruje §20 Q7 nad §8.2 draftem |
| OBS-3 | `disabled` state CTA "Obnovit onboarding" — plán §8.2 nezmiňuje CTA pro disabled | **Pozitivní deviation, non-blocker** | Plán §8.2 neobsahuje explicitní disabled CTA, ale ani ho nezakazuje. Implementace přidává CTA `state === "disabled"` → `handleStartOnboarding` (re-onboarding bez admin intervence) — **přidává hodnotu, neodebírá**. Plan-compliant per princip "additivní deviation OK". Plán §3 (5-state flow) předpokládá self-recovery path, takže UX rozhodnutí dává smysl |

**Závěr ke KONTROLOR OBS:** Všechny 3 jsou informační. Žádný blocker, žádný RETURN trigger.

---

## §4 — Zebra test (3 náhodné claims vs repo state)

### Claim 1: "`git show 64d7478 e678f7c -- app/api/stripe/webhook/route.ts app/api/partner/profile/ app/api/stripe/connect/` → 0 output" (KONTROLOR §9 + IMPL §7)

**Verify:** Live `git show 64d7478 e678f7c -- app/api/stripe/webhook/route.ts app/api/partner/profile/ app/api/stripe/connect/ | wc -l` → **0**.

✅ **PASS** — STOP-5 (webhook), STOP-7 (`/api/partner/profile`), no new Connect routes všechny ověřeny. Backend #161-a plně reused.

### Claim 2: "Commit `64d7478` 4 files +314/-1, `e678f7c` 3 files +86/-94" (IMPL §6)

**Verify:** `git show --stat 64d7478 e678f7c`:
```
64d7478:
 app/(pwa-parts)/parts/profile/page.tsx             |   4 +
 components/admin/partners/StripeOnboardingCard.tsx |   2 +-
 components/pwa-parts/profile/SupplierStripeCard.tsx | 309 +++++++++++++++++++++
 components/{admin/partners => ui}/StripeStatusBadge.tsx |   0  ← rename
 4 files changed, 314 insertions(+), 1 deletion(-)

e678f7c:
 components/admin/partners/StripeOnboardingCard.tsx     |  26 +----
 components/pwa-parts/profile/SupplierStripeCard.tsx    | 118 +++++--------
 lib/stripe-connect-shared.ts                           |  36 +++++++
 3 files changed, 86 insertions(+), 94 deletions(-)
```

✅ **PASS** — Přesně **4 files +314/-1** a **3 files +86/-94**, byte-for-byte. Rename `admin/partners/StripeStatusBadge.tsx → ui/StripeStatusBadge.tsx` zobrazený jako 0 changed lines (100% similarity rename) — **potvrzuje plan §13.1 promotion bez content drift**.

### Claim 3: "STRIPE_REQUIREMENTS_CZ má přesně 17 klíčů" (§20 Q5)

**Verify:** Manuálně počítám klíče v `lib/stripe-connect-shared.ts:67-85`:
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

✅ **PASS** — Přesně **17 klíčů** + `REQUIREMENT_FALLBACK_CZ` "Další informace požadované Stripem" L87. `translateRequirementsList` L98-101 dedupes (`Array.from(new Set(...))`) — `dob.day/month/year` → 1× "Datum narození", `tos_acceptance.date/ip` → 1× "Souhlas s podmínkami Stripe". Plán §8.3 dodržen.

**Zebra 3/3:** ✅ PASS

---

## §5 — Bonus checks (defense-in-depth)

### §5.1 — Client bundle isolation
- `lib/stripe-connect-shared.ts` L1: `import type { Partner } from "@prisma/client"` — TYPE-ONLY (erased at compile, žádný runtime pg driver). Žádný runtime server import.
- `SupplierStripeCard.tsx` imports L4-16: `next/navigation` + `@/components/ui/*` + `@/lib/stripe-connect-shared` + `@/lib/utils` — **nikdy** z server `@/lib/stripe-connect`.
- `mapStatusResponseToPartnerFields` + `StripeConnectStatusResponse` jsou pure functions/interfaces (zero runtime imports).
- ✅ Bundle bloat prevented.

### §5.2 — Race condition guards
- **Mount-only useEffect** L72-130 s ESLint disable + WHY comment L127-129 — chrání před infinite refetch loop při `router.replace()` re-trigger.
- **Unmount guard** L76 (`let ignore = false`) + L83/111/119 (`if (ignore) return`) + cleanup L124-126 — chrání před setState-on-unmounted warning.
- **Busy lock** L267 `disabled={busy !== null}` — paralelní `handleStartOnboarding` + `handleOpenDashboard` clicky blokované.
- **Router.replace v success path** L105-109 v `try` bloku, ne `finally` — chyba ponechá `?stripe=return` pro retry (kontrolor §5).
- ✅ Defenzivně robust pro PWA edge cases.

### §5.3 — Q7 verification (žádná komunikace s partnery)
- Grep `email|notify|push|resend` v `components/pwa-parts/profile/SupplierStripeCard.tsx` + `components/ui/StripeStatusBadge.tsx` → **0 hits**.
- Žádné emailové notifikace, žádné push, žádné bannery.
- Implementace honoruje §20 Q7 doslovně.
- ✅ Confirmed.

---

## §6 — Discrepancies

**Žádné.** Implementace je vnitřně konzistentní, souhlasí s git state, kontrolor PASS, plán §8.4/§8.5/§8.6/§12.3, §20 Q1-Q8 LEAD DECISIONS.

**Minor observations (informační, ne blockery):**

1. **OBS-1 (informační):** Plán §8.4 neobsahuje explicitní instrukce pro `disabled` state CTA, ale implementace ho přidává (`handleStartOnboarding` re-onboarding). Pozitivní self-recovery deviation. Schválené KONTROLOR §12 OBS-3.

2. **OBS-2 (informační):** Plán §8.2 původní draft obsahoval "Dáme ti vědět emailem" pro `in_progress` state. Implementace ho správně vynechává per §20 Q7 LEAD DECISION (žádná komunikace s partnery). KONTROLOR §12 OBS-2 to také zaznamenal.

3. **OBS-3 (architektonický kontext, plan-compliant):** `StripeStatusBadge` přesun z `components/admin/partners/` do `components/ui/`. Plán §13.1 L1213 explicit allowance: *"(nový, **může být v components/ui/**)"*. #161-b zvolil admin namespace pod časovým tlakem, #161-c promotes na shared když má dva consumers. Architektonicky správné. **NEvyžaduje rollback admin UI** — admin import path aktualizován v `64d7478` simultánně s movem (atomicky v jednom commitu).

4. **OBS-4 (informační):** Lokální commity nepushnuté na origin/main. Pipeline pokračuje #178 test-chrome → #179 lead → #180 deploy. Žádný issue.

---

## §7 — Verdikt

### ✅ PASS — 0 discrepancies, 0 blockers, 4 informační OBS

Implementace #161-c (commity `64d7478` + `e678f7c`) je v souladu s:
- Plán `plan-task-161-stripe-onboarding.md` §8.4 (5-state flow + 4 logické kroky), §8.5 (query param handling, žádná nová route), §8.6 (mobile-first copy + window.location.href vs window.open), §12.3 (4 scope položky), §13.1 (StripeStatusBadge umístění allowance)
- §20 LEAD DECISIONS Q1-Q8 (Q2 BOTH entry points kompletní, Q5 17 klíčů reuse, Q7 žádná komunikace)
- STOP-5 (webhook applyCommissionSplit nedotčen)
- STOP-7 (`/api/partner/profile` nedotčen)
- KONTROLOR #176 závěry (3 OBS všechny informační)

**Všech 6 acceptance checks:** ✅ PASS
**Zebra test 3/3:** ✅ PASS
**Architectural deviation (StripeStatusBadge move):** ✅ Plan-compliant per §13.1 L1213
**KONTROLOR 3 OBS:** ✅ Všechny informační, ne blockery
**Defense-in-depth (race guards, bundle isolation, Q7):** ✅ Robust

**Doporučení:**
- Dispatch **#178 test-chrome** — e2e flow PWA partner login → `/parts/profile` → SupplierStripeCard render → 5-state mock testing → onboard link redirect simulation → return handler with `?stripe=return`
- **Před deployem #180:** mobile responsive sanity check (impl §9 note: "test-chrome fáze #177 [#178] pokryje")
- Lokální commity stále na `main` lokálně, čekají na schválení leadem (#179)
- **Žádný manuální deploy step** (čistě UI change, žádný Stripe Dashboard step na rozdíl od #166 deploy #161-a)

**Žádné FINDINGS, nic nevracím.**

---

**EVZEN signoff: 2026-04-08**
