# IMPL #175 — #161-c Partner PWA Stripe Connect self-service UI

**Task:** #175 IMPL #161-c — Partner PWA Stripe Connect self-service UI
**Plan:** `.claude-context/tasks/plan-task-161-stripe-onboarding.md` §8.4, §8.5, §8.6, §12.3
**Navazuje na:** #162 #161-a backend LIVE (`2bf0657`) + #168 #161-b admin UI LIVE (`63bf026`)
**Datum:** 2026-04-08
**Branch:** main
**Commity:** `64d7478` (main) + `e678f7c` (simplify refactor)

---

## §1 — Scope delivered

| # | Položka | File | Status |
|---|---|---|---|
| 1 | `SupplierStripeCard` — main PWA self-service card (5-state flow) | `components/pwa-parts/profile/SupplierStripeCard.tsx` | ✅ New |
| 2 | `StripeStatusBadge` → shared `components/ui/` | `components/ui/StripeStatusBadge.tsx` | ✅ Moved (z admin/partners/) |
| 3 | PWA profile page integration | `app/(pwa-parts)/parts/profile/page.tsx` | ✅ Modified |
| 4 | Admin card import update na nový badge path | `components/admin/partners/StripeOnboardingCard.tsx` | ✅ Modified |
| 5 | Shared API↔partner mapping helper (simplify extract) | `lib/stripe-connect-shared.ts` | ✅ Modified |

**Out of scope (per task brief):**
- `/api/partner/profile` endpoint — STOP-7 dodržen, nedotčen
- Stripe webhook `applyCommissionSplit` — STOP-5 dodržen, nedotčen
- Email notifikace (Q7 NO)
- PWA push notifikace (Q7 NO)
- Nové API routes — backend #161-a plně reused
- E2E tests — test-chrome fáze pokryje

---

## §2 — Architecture rozhodnutí

### §2.1 — StripeStatusBadge přesun do `components/ui/`

**Problem:** #161-b umístil `StripeStatusBadge` do `components/admin/partners/` (namespace: admin-only). PWA komponenta `SupplierStripeCard` potřebuje stejnou 5-state badge logiku. Dva čisté způsoby: (a) cross-namespace import z admin/ do pwa-parts/ (leaky), (b) přesun do shared `components/ui/` (clean).

**Řešení:** Zvolena (b). Plán §13.1 explicitně píše "nebo v `components/ui/`" — plán otevíral oboje, #161-b pod časovým tlakem zvolil admin/partners/, ale #161-c je moment kdy se to promotes do shared. Badge má žádné admin-specific props (jen `state: OnboardingState` + optional `className`), takže přesun je čistý.

**Migrace:**
1. Move `components/admin/partners/StripeStatusBadge.tsx` → `components/ui/StripeStatusBadge.tsx` (git rename, similarity 100%)
2. Update import v `StripeOnboardingCard.tsx`: `./StripeStatusBadge` → `@/components/ui/StripeStatusBadge`
3. PWA card importuje z nového shared path

**Verifikace:** `git show --stat 64d7478` ukazuje rename 100%, žádný content diff. Admin UI #161-b v produkci funguje beze změny (jen path update).

### §2.2 — Self-fetching pattern vs. props

**Admin card** (`StripeOnboardingCard`) přijímá `partner: StripePartnerFields` jako prop — parent (`PartnerDetail`) už má partner data načtené přes `/api/admin/partners/[id]`. Žádný extra fetch.

**PWA card** (`SupplierStripeCard`) self-fetchuje `/api/stripe/connect/status` na mount — `/parts/profile` page už fetchuje `/api/partner/profile` pro veřejný profil, ale per STOP-7 **nesmíme ten endpoint rozšířit o Stripe fieldy**. Separátní dedikovaný fetch je čistý.

### §2.3 — Query param handling (§8.5)

`useEffect` s prázdnými deps (mount-only) čte `searchParams.get("stripe")`:
- `"return"` → `fetchConnectStatus(true)` (force refresh přes Stripe API) + 3 toast varianty podle výsledného state + `router.replace("/parts/profile")` wipe query
- `"refresh"` → stejný force refresh ale bez toastu (partner klikl Back v Stripe UI)
- žádný param → cheap DB read (`/status` bez `refresh=1`)

**Wipe query je v success path, ne finally** — když load fail, `?stripe=return` zůstane a reload stránky spustí refresh flow znovu. Efficiency agent to flagnul jako retry-safety issue.

### §2.4 — Mount-only useEffect (eslint-disable)

`useEffect(() => {...}, [])` s eslint-disable. Pokud bychom poslouchali změny `searchParams`, po `router.replace("/parts/profile")` by se useEffect retriggered → re-fetch → nekonečná smyčka. Komentář v kódu vysvětluje rationale.

### §2.5 — Unmount guard (ignore flag)

```ts
let ignore = false;
async function init() {
  try {
    const updated = await fetchConnectStatus(...);
    if (ignore) return;
    setPartner(updated);
    // ...
  } catch (err) {
    if (ignore) return;
    setFeedback({...});
  } finally {
    if (!ignore) setLoaded(true);
  }
}
init();
return () => { ignore = true; };
```

Chrání proti React "setState on unmounted component" warning když partner naviguje pryč během fetche. Efficiency agent to flagnul.

### §2.6 — Loaded vs partner state

První verze měla `loading: boolean` i `partner: StripePartnerFields | null` — redundant state (agent quality flagnul). Refactor: `loaded: boolean` (fetch resolved ať success nebo error) + `partner: StripePartnerFields | null` (null = fetch selhal nebo ještě neběží). Renderovací tree:
1. `!loaded` → skeleton
2. `loaded && !partner` → error fallback s `feedback.message`
3. `loaded && partner` → normal 5-state render

---

## §3 — 5-state PWA UI mapping

| State | Badge | Headline | Body | CTA |
|---|---|---|---|---|
| `not_started` | gray "Nepřipojeno" | "Rychlejší výplaty se Stripe" | "Napoj svůj bankovní účet... Onboarding otevře prohlížeč..." | "Napoj Stripe účet" |
| `in_progress` | blue "Stripe zpracovává" | "Stripe zpracovává tvé údaje" | "Obvykle to trvá 1–2 dny..." | "Dokončit onboarding" |
| `action_required` | amber "Vyžaduje akci" | "Stripe potřebuje dodatečné informace" | copy + CZ requirements list (přes `translateRequirementsList`) | "Dokončit onboarding" |
| `complete` | green "Výplaty aktivní" | "Výplaty jsou aktivní" | "Tvůj účet je plně propojen..." | "Upravit údaje ve Stripe" (→ dashboard-link → `_blank`) |
| `disabled` | red "Zakázáno" | "Napojení je deaktivované" | copy + red `<code>` s `stripeDisabledReason` | "Obnovit onboarding" |

**Mobile-first copy:** všechny states zmiňují "Onboarding otevře prohlížeč — po dokončení se vrátíš sem sám" per §8.6 (mitigace PWA↔browser context switch).

---

## §4 — Flow detail

### §4.1 — Normal mount (no query param)

```
Mount → useEffect → fetchConnectStatus(false) → /status (cheap DB read)
     → setPartner(mapped) → setLoaded(true) → 5-state render
```

Žádný Stripe API roundtrip. Rate-limit quota zachovaná.

### §4.2 — Start onboarding (handleStartOnboarding)

```
Click "Napoj Stripe účet" → setBusy("link") → POST /onboard-link
     → { url } → window.location.href = url
```

Busy **zůstává aktivní** — browser už přesměrovává, clear by způsobil flash. Comment v kódu vysvětluje. Pokud POST fail → setBusy(null) + error feedback.

### §4.3 — Return from Stripe (?stripe=return)

```
Mount → searchParams.stripe === "return" → fetchConnectStatus(true)
     → Stripe API roundtrip + DB sync → setPartner(mapped)
     → deriveOnboardingState(updated):
         complete → toast "Stripe účet propojen, výplaty aktivní!"
         action_required → toast "Pokračuj v dokončení..."
         else → toast "Stripe zpracovává..."
     → router.replace("/parts/profile") wipe query
```

### §4.4 — Refresh link (?stripe=refresh)

```
Mount → searchParams.stripe === "refresh" → fetchConnectStatus(true)
     → setPartner(mapped) → žádný toast → router.replace
```

Stripe refresh URL znamená partner klikl Back nebo link expiroval (5 min). Partner se vrátí na card, vidí aktualizovaný state, může klikat dál.

### §4.5 — Open Stripe dashboard (handleOpenDashboard)

Jen `complete` state. `POST /dashboard-link` → `window.open(url, "_blank", "noopener,noreferrer")`. Magic link expires ~1 min, target="_blank" zachová PWA context.

---

## §5 — /simplify review cyklus

Po `64d7478` jsem dispatchnul 3 parallel review agenty. **Aplikované fixy v `e678f7c`:**

### §5.1 — Code reuse (1 finding aplikován)

**NICE-TO-HAVE — Extract StripeConnectStatusResponse + mapStatusResponseToPartnerFields** — Admin card a PWA card měly ~25 LOC duplicate (inline API response type + field mapping). Extrahoval jsem do `lib/stripe-connect-shared.ts` jako single source of truth pro API↔partner contract. Backend drift by teď selhal TypeScript check v jednom místě.

### §5.2 — Code quality (5 fixů aplikovaných)

1. **Drop useCallback na fetchStatus** — Module-scoped `fetchConnectStatus` function, ne wrapped v `useCallback`. Volaná jen v mount-only useEffect, memoization byl noise.
2. **Drop useMemo na state/requirementsCz** — Cheap pure derivace, memoization overhead ≥ compute cost. Inline v renderu.
3. **Rename loading → loaded** — Jasnější sémantika (loaded=true znamená fetch resolved, success nebo error). Odstraní dual-state ambiguitu.
4. **Collapse error fallback branch** — První verze měla `{!state || !partner}` fallback který renderoval separátní error card. Refactor: `!partner` větev používá `feedback?.kind === "err" ? feedback.message : fallback`. Jeden error surface.
5. **Prune WHAT-comments** — Smazány 3 narrating comments (`// Mount: ...`, `// Return from Stripe: ...`, `// Wipe query tak ať ...`). Zachovány 2 load-bearing WHY: mount-only useEffect rationale + busy aktivní při redirectu.

### §5.3 — Efficiency (2 fixů aplikovaných)

1. **Unmount guard** — `let ignore = false` + cleanup function. Chrání proti setState-on-unmounted warning.
2. **Router.replace mimo finally** — Původně v `finally` blocku → při chybě load wipe query (partner ztratil retry signal). Přesun do success path — error cesta ponechá `?stripe=return`, reload stránky spustí refresh znovu.

### §5.4 — Neaplikované finding (skip reasons)

- **Feedback type duplicate** (reuse agent) — 1-line type alias, extrahování by bylo negative ROI.
- **Error-payload extraction pattern** (reuse agent) — `res.json().catch(() => ({}))` + `throw new Error(payload.error ?? ...)` 3× v file. Helper by obscured fetch flow a ušetří ~2 LOC per call — pod threshold.
- **BusyAction type → boolean** (quality agent) — Současný `"link" | "dashboard"` union je čitelnější než boolean + discriminator, scales na další akce.
- **Duplicate isReturn || isRefresh** (quality agent) — Použité 2× s různými sémantikami (fetch arg + wipe gate), extract by nic nezískal.

---

## §6 — Files changed

### New files (1):
- `components/pwa-parts/profile/SupplierStripeCard.tsx` (265 LOC po simplify)

### Moved (1):
- `components/admin/partners/StripeStatusBadge.tsx` → `components/ui/StripeStatusBadge.tsx` (git rename 100%)

### Modified (3):
- `components/admin/partners/StripeOnboardingCard.tsx` — +1 import `@/components/ui/StripeStatusBadge`, `-25 LOC` inline API mapping, +1 `mapStatusResponseToPartnerFields` call
- `app/(pwa-parts)/parts/profile/page.tsx` — +1 import, +3 lines Card insertion
- `lib/stripe-connect-shared.ts` — +36 LOC (`StripeConnectStatusResponse` interface + `mapStatusResponseToPartnerFields` function)

### Commits:
- `64d7478 feat(#161-c): partner PWA Stripe Connect self-service UI` — 4 files, +314/-1
- `e678f7c refactor(#161-c): simplify per /simplify review` — 3 files, +86/-94

---

## §7 — Validation

| Check | Výsledek |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors (550 warnings pre-existing z `.next` bundles, žádné nové v mém kódu) |
| `npm run build` | ✅ `Compiled successfully in 21.2s`, exit 0 |
| `/parts/profile` v build outputu | ✅ Static (`○ /parts/profile`) |
| Bundle client-safety | ✅ `lib/stripe-connect-shared.ts` má zero server imports — nové helpers jsou pure functions |
| STOP-5 webhook | ✅ Nedotčen (grep `applyCommissionSplit` nic v commitu) |
| STOP-7 `/api/partner/profile` | ✅ Nedotčen (grep `api/partner/profile` nic v commitu) |

---

## §8 — REUSE summary (klíčové)

| Helper / Component | Path | Použití v #161-c |
|---|---|---|
| `StripePartnerFields` interface | `lib/stripe-connect-shared.ts` | state type + API mapping target |
| `OnboardingState` union | `lib/stripe-connect-shared.ts` | STATE_COPY key + StripeStatusBadge prop |
| `deriveOnboardingState` | `lib/stripe-connect-shared.ts` | render-time derivace |
| `translateRequirementsList` | `lib/stripe-connect-shared.ts` | CZ i18n requirements |
| `StripeConnectStatusResponse` | `lib/stripe-connect-shared.ts` | **NEW v simplify** — API response type |
| `mapStatusResponseToPartnerFields` | `lib/stripe-connect-shared.ts` | **NEW v simplify** — API→fields mapping |
| `StripeStatusBadge` | `components/ui/StripeStatusBadge.tsx` | **NEW location** — 5-state badge |
| `formatRelativeCz` | `lib/utils.ts` | "Naposledy synchronizováno" |
| `Card`, `Button` | `components/ui/` | layout primitives |

Zero duplikace mezi admin a PWA card — každý sdílený pattern má jediný source of truth.

---

## §9 — Known blockers / notes

**None.** Implementace proběhla bez blockerů. Backend #161-a + admin UI #161-b jsou stabilní reuse base.

**Note na mobile responsive check:** Card je postaven s `max-w-lg mx-auto` (z parent page), `space-y-3`, `flex items-start justify-between gap-3` hlavička s badge → funguje od 320px šířky. Nebyl jsem schopen provést live DevTools mobile viewport verification (background agent nemá browser control), ale layout patterny jsou stejné jako existující PWA cards na stránce (User info, Edit form, Logout) — test-chrome fáze #177 to pokryje.

**Note na bundle:** Nový `components/ui/StripeStatusBadge.tsx` a helper export v `lib/stripe-connect-shared.ts` přidají ~1 KB do `/parts/profile` client bundle. Není to hot-path issue.

---

## §10 — Pipeline next steps

- **#176 kontrolor** — ověří implementaci vůči plan §8.4/§8.5/§8.6/§12.3 + STOP rules
- **#177 evžen** — smart code review
- **#178 test-chrome** — e2e flow (PWA partner login → /parts/profile → card viditelná → 5-state rendering → onboard link redirect sim → return handler)
- **#179 lead review** — SCHVÁLENO/AMEND
- **#180 deploy** — production rollout (čistě UI change, 7-step standard flow, žádný manuální krok)

**Do NOT push** — per task brief, pipeline čeká. Lokální commits jsou na `main` větvi.

---

**HOTOVO** — Task #175 ready for kontrolor review. Commits `64d7478` + `e678f7c` na `main`.
