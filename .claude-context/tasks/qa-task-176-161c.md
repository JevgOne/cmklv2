# QA Task #176 — #161-c Partner PWA Stripe Connect self-service UI

**Commity:** `64d7478 feat(#161-c): partner PWA Stripe Connect self-service UI` + `e678f7c refactor(#161-c): simplify per /simplify review`
**Branch:** `main`
**QA agent:** KONTROLOR
**Datum:** 2026-04-08
**Ref impl:** `.claude-context/tasks/impl-task-175-161c.md`
**Ref plan:** `.claude-context/tasks/plan-task-161-stripe-onboarding.md` §8.4, §8.5, §8.6, §12.3

---

## §1 — Scope

| Fáze | Oblast | QA |
|------|--------|-----|
| #161-c | `SupplierStripeCard.tsx` (NEW) | ✅ |
| #161-c | `app/(pwa-parts)/parts/profile/page.tsx` integrace | ✅ |
| #161-c | `components/ui/StripeStatusBadge.tsx` move + admin import update | ✅ |
| #161-c | `lib/stripe-connect-shared.ts` — nové helpers (simplify extract) | ✅ |
| #161-c | Admin `StripeOnboardingCard.tsx` migrace na shared mapping | ✅ |
| ~~API routes~~ | ~~0 nových~~ | Out of scope |
| ~~E2E~~ | ~~test-chrome~~ | Out of scope |

---

## §2 — Files reviewed

| Soubor | Typ | Status |
|--------|-----|--------|
| `components/pwa-parts/profile/SupplierStripeCard.tsx` (265 ř.) | New | ✅ |
| `components/ui/StripeStatusBadge.tsx` (27 ř.) | Moved z admin/partners/ | ✅ |
| `app/(pwa-parts)/parts/profile/page.tsx` | Modified | ✅ |
| `components/admin/partners/StripeOnboardingCard.tsx` | Modified | ✅ |
| `lib/stripe-connect-shared.ts` (+36 ř.) | Modified | ✅ |

**git show 64d7478 --name-only:** 4 files (SupplierStripeCard, ui/StripeStatusBadge, page.tsx, StripeOnboardingCard)
**git show e678f7c --name-only:** 3 files (StripeOnboardingCard, SupplierStripeCard, stripe-connect-shared)
**STOP checks (webhook + partner/profile):** 0 output → nedotčeny ✅

---

## §3 — Check 1: Scope §12.3

| Item | Implementace | Status |
|------|-------------|--------|
| `SupplierStripeCard.tsx` existuje, client component, 5-state | `"use client"`, `STATE_COPY` Record s not_started/in_progress/action_required/complete/disabled | ✅ |
| `parts/profile/page.tsx` — import + insert card | L9 import, L95 `<SupplierStripeCard />` | ✅ |
| `components/ui/StripeStatusBadge.tsx` — přesunut z admin/partners/ | Existuje v nové lokaci; `components/admin/partners/StripeStatusBadge.tsx` = neexistuje (ověřeno `ls`) | ✅ |
| Admin `StripeOnboardingCard.tsx` import path aktualizován | L15: `import { StripeStatusBadge } from "@/components/ui/StripeStatusBadge"` | ✅ |
| Žádné nové API routes | 0 souborů v `app/api/` v obou commitech | ✅ |
| STOP-7: `/api/partner/profile` nedotčen | `git show 64d7478 e678f7c -- app/api/partner/profile/` → 0 output | ✅ |
| STOP-5: webhook nedotčen | `git show 64d7478 e678f7c -- app/api/stripe/webhook/route.ts` → 0 output | ✅ |

---

## §4 — Check 2: 5-state flow (§8.4)

| State | Badge | Headline | CTA | Specifika | Status |
|-------|-------|----------|-----|-----------|--------|
| `not_started` | gray "Nepřipojeno" | "Rychlejší výplaty se Stripe" | "Napoj Stripe účet" | — | ✅ |
| `in_progress` | blue "Stripe zpracovává" | "Stripe zpracovává tvé údaje" | "Dokončit onboarding" | — | ✅ |
| `action_required` | amber "Vyžaduje akci" | "Stripe potřebuje dodatečné informace" | "Dokončit onboarding" | CZ requirements list přes `translateRequirementsList` (L210-212, L232-245) | ✅ |
| `complete` | green "Výplaty aktivní" | "Výplaty jsou aktivní" | "Upravit údaje ve Stripe" | `handleOpenDashboard` → POST /dashboard-link → `window.open(url, "_blank", "noopener,noreferrer")` | ✅ |
| `disabled` | red "Zakázáno" | "Napojení je deaktivované" | "Obnovit onboarding" | Red box s `stripeDisabledReason` (L248-252); CTA volá `handleStartOnboarding` | ✅ |

**Primary action routing:** `state === "complete" ? handleOpenDashboard : handleStartOnboarding` (L214-215) — disabled state správně volá re-onboarding, ne dashboard ✅

---

## §5 — Check 3: Query param handling (§8.5)

| Požadavek | Implementace | Status |
|-----------|-------------|--------|
| `useSearchParams()` na mount | L66 + `useEffect([], [])` | ✅ |
| `?stripe=return` → force refresh + 3 toast varianty + router.replace | L74-108: `isReturn = true` → `fetchConnectStatus(true)` → 3 toast varianty (complete/action_required/else) → `router.replace("/parts/profile")` | ✅ |
| `?stripe=refresh` → force refresh BEZ toastu + router.replace | L75: `isRefresh = true` → `fetchConnectStatus(true)` (L82: `isReturn \|\| isRefresh`) → `if (isReturn)` blok se přeskočí → wipe na L105-109 | ✅ |
| `router.replace` v success path (ne finally) | L105-109 je v `try` bloku, ne `finally` — při chybě query zůstane pro retry ✅ | ✅ |
| Normal mount → cheap DB read | `fetchConnectStatus(false || false)` = bez `?refresh=1` ✅ | ✅ |
| **3 toast varianty pro `?stripe=return`** | complete → "Stripe účet propojen, výplaty aktivní!" / action_required → "Pokračuj v dokončení..." / else → "Stripe zpracovává..." — všechny `kind: "ok"` ✅ | ✅ |

---

## §6 — Check 4: Mobile-first (§8.6)

| Požadavek | Implementace | Status |
|-----------|-------------|--------|
| Copy zmiňuje "otevře prohlížeč" | `not_started.body`: "Onboarding otevře prohlížeč — po dokončení se vrátíš sem sám." `action_required.body`: "Onboarding otevře prohlížeč — po dokončení se vrátíš sem sám." | ✅ |
| Responsive patterns | Card `p-4 space-y-3`, header `flex items-start justify-between gap-3`, Button `w-full` — mobile-first OK | ✅ |
| window.location.href pro onboard (PWA flow) | L145: `window.location.href = url` — správný redirect (zachová PWA kontakt s Stripe) | ✅ |
| window.open pro dashboard (complete state) | L171: `window.open(url, "_blank", "noopener,noreferrer")` — zachová PWA kontext | ✅ |

---

## §7 — Check 5: REUSE (zero duplikace)

| Helper / Component | Path | SupplierStripeCard | Admin StripeOnboardingCard |
|---|---|---|---|
| `StripeStatusBadge` | `components/ui/StripeStatusBadge` | L7 import ✅ | L15 import ✅ (updated path) |
| `StripePartnerFields` | `lib/stripe-connect-shared` | L14 ✅ | existující ✅ |
| `OnboardingState` | `lib/stripe-connect-shared` | L12 ✅ | existující ✅ |
| `deriveOnboardingState` | `lib/stripe-connect-shared` | L9 ✅ | existující ✅ |
| `translateRequirementsList` | `lib/stripe-connect-shared` | L10 ✅ | existující ✅ |
| `StripeConnectStatusResponse` | `lib/stripe-connect-shared` **NEW** | L13 ✅ | L11 ✅ |
| `mapStatusResponseToPartnerFields` | `lib/stripe-connect-shared` **NEW** | L10 ✅ | L8 + L77 ✅ |
| `formatRelativeCz` | `lib/utils.ts` | L16 ✅ | existující ✅ |
| `Card`, `Button` | `components/ui/` | L5-6 ✅ | existující ✅ |

**Admin card ~25 LOC reduction:** `StripeOnboardingCard.tsx` L76: `const data = (await res.json()) as StripeConnectStatusResponse;` → `onRefresh(mapStatusResponseToPartnerFields(data))` — eliminuje ~10 inline field mappings (bylo `stripeDetailsSubmitted: data.detailsSubmitted` apod.) ✅

---

## §8 — Check 6: Client bundle isolation

| Item | Status |
|------|--------|
| `lib/stripe-connect-shared.ts` imports | POUZE `import type { Partner } from "@prisma/client"` (type-only, erased at compile) | ✅ |
| Nové helpers jsou pure | `StripeConnectStatusResponse` = interface (no runtime), `mapStatusResponseToPartnerFields` = pure mapping function (no imports) | ✅ |
| `SupplierStripeCard` neimportuje ze server libu | Import pouze z `@/lib/stripe-connect-shared` + `@/lib/utils` + `@/components/ui/*` | ✅ |

---

## §9 — Check 7 + 8: STOP checks

| STOP | Check | Výsledek |
|------|-------|---------|
| STOP-5 | `git show 64d7478 e678f7c -- app/api/stripe/webhook/route.ts` | 0 output — webhook NEDOTČEN ✅ |
| STOP-5 | `applyCommissionSplit` | Vyplývá z výše: 0 changed lines v webhook souboru ✅ |
| STOP-7 | `git show 64d7478 e678f7c -- app/api/partner/profile/` | 0 output — endpoint NEDOTČEN ✅ |

---

## §10 — Check 9: Technická validace

| Check | Výsledek |
|-------|---------|
| `npx tsc --noEmit` | ✅ 0 errors (ověřeno lokálně) |
| `npm run lint` | ✅ 0 errors, 550 warnings (viz OBS-1) |
| `npm run build` | ✅ impl report: compiled 21.2s, exit 0 |
| `/parts/profile` v build outputu | ✅ `○ /parts/profile` (static) — impl report |
| Bundle client-safety | ✅ stripe-connect-shared.ts: zero runtime server imports (ověřeno §8) |

---

## §11 — Check 10: Code quality

| Item | Status |
|------|--------|
| Žádné WHAT komentáře | 2 WHY comments zachovány: L127-129 (mount-only useEffect rationale), L144 (busy aktivní při redirectu) — oba load-bearing | ✅ |
| Busy state lock | Primární Button: `disabled={busy !== null}` (L267) — nemůže běžet 2 akce paralelně | ✅ |
| Single feedback state | `type Feedback = { kind: "ok" \| "err"; message: string }` — ne 2 oddělené hooks | ✅ |
| Žádné zbytečné useCallback/useMemo | `fetchConnectStatus` = module-scoped function (ne useCallback). `state` + `requirementsCz` inline v renderu (ne useMemo) — simplify review aplikován | ✅ |
| Unmount guard | `let ignore = false` + cleanup `return () => { ignore = true; }` (L76, L124) | ✅ |

---

## §12 — Observations

| # | Severity | Popis |
|---|----------|-------|
| OBS-1 | Minor | Lint warnings: 550 (oproti baseline 547 z #161-b QA). Delta +3 je pre-existing v `.next` bundlech (sw.js) — impl report §7 to dokumentuje jako pre-existing. 0 errors. |
| OBS-2 | Observation | `in_progress` copy: plán §8.2 uvádí "Dáme ti vědět emailem". Implementace to **správně vynechala** — Q7 LEAD DECISION = žádná komunikace s partnery v #161-x. Implementační copy "Pokud chceš něco upravit, pokračuj v onboardingu" je lepší alternativa bez false email promise. |
| OBS-3 | Observation | `disabled` state: plán §8.2 neukazuje CTA pro disabled. Implementace přidává "Obnovit onboarding" button (volá `handleStartOnboarding`). Toto je pozitivní deviation — umožňuje partnerovi znovu iniciovat onboarding bez admin intervence. Plan-compliant (přidává, neodstraňuje). |

---

## §13 — Verdict

### ✅ PASS — 0 blockers, 3 minor observations

Commity `64d7478` + `e678f7c` implementují #161-c Partner PWA Stripe Connect self-service UI kompletně a správně vůči plánu §8.4/§8.5/§8.6/§12.3.

**Klíčové:**
- 5-state flow kompletní (not_started/in_progress/action_required/complete/disabled) ✅
- Query param handling přesně per §8.5: return → 3 toasty + wipe, refresh → wipe bez toastu, error → query zůstane ✅
- `router.replace` správně v success path (ne finally) ✅
- Unmount guard chrání proti setState-on-unmounted ✅
- `window.location.href` pro onboarding redirect + `window.open(_blank)` pro dashboard ✅
- STOP-5 (webhook) + STOP-7 (/api/partner/profile) = 0 changes ✅
- StripeStatusBadge přesunut do `components/ui/` — admin + PWA sdílí stejnou komponentu ✅
- `mapStatusResponseToPartnerFields` + `StripeConnectStatusResponse` extrahované do shared — zero API↔field drift ✅
- Client bundle isolation: stripe-connect-shared.ts zero runtime server imports ✅
- TSC 0 errors | lint 0 errors | build ✅
