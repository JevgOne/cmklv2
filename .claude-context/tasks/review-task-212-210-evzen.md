# Review #212 — EVZEN shoda-check plán #210 PWA Díly

**Reviewer:** evzen-the-king
**Datum:** 2026-04-11
**Scope:** Plán `plan-task-210-pwa-dily-100.md` (653 řádků, commit `5043ef1`) — PWA Díly Fáze 1: z 85 % na 100 %
**References:** audit-208-carmakler-stav.md §10.1, LEAD DECISIONS Q1-Q3

---

## §0 — Verdict

### SCHVÁLENO — 0 blockerů, 4 minor observations

Plán #210 pokrývá 3 z TOP 5 gapů z auditu #208 §10.1 (onboarding, edit/delete, + part detail page jako bonus). 2 deferred gapy (notifikace, messaging) mají validní důvod — závisí na externích službách (Pusher, Resend) které nejsou nakonfigurované. LEAD DECISIONS Q1-Q3 jsou konzistentní se zadáním. File manifest, STOP rules (8 pravidel), acceptance criteria (per-commit + end-to-end smoke) jsou kompletní. Plán je čistě aditivní — žádné existující features se nemažou ani neschovávají.

**Lead může dispatchovat IMPL s plánem #210.**

---

## §1 — Metodologie

6 EVZEN pravidel:

1. **Doslovnost** — čtu audit §10.1 TOP 5 gapů doslovně a porovnávám s plán scope
2. **No assumptions** — nezávisle verifikuji source claims (PartCard link, JWT fields, API routes, schema fields)
3. **No soft hacks** — plan self-contradiction v §0 vs §5 flaguji
4. **Defense-in-depth** — cross-verifikuji file manifest, STOP rules, acceptance criteria
5. **Resistance to shortcuts** — ověřuji že plan NEMAZE existující features
6. **Final verdict respect** — plan je READ-ONLY investigation target

---

## §2 — Check 1: Pokrývá plán všech 5 gapů z auditu #208?

### Audit §10.1 TOP 5 gapů:

| # | Gap z auditu | Plán #210 | Status |
|---|-------------|-----------|--------|
| 1 | **Onboarding flow** — nový dodavatel nemá registraci/schválení | ✅ Commit 4: 3-step onboarding (profil → dokumenty → schválení) + middleware redirect + API route | Covered |
| 2 | **Edit/delete dílů** — CRUD jen C+R, chybí U+D | ✅ Commit 2 (edit page s wizard reuse) + Commit 3 (delete s confirmation dialog) | Covered |
| 3 | **Fotky (Cloudinary)** — PhotoStep bez API klíče | ⚠️ Plan §1.5 + STOP-7: env config issue, ne code gap. IMPL dokumentuje requirement, nepíše fallback. | Acknowledged (env) |
| 4 | **Notifikace o objednávkách** — dodavatel neví o nové objednávce | ❌ Deferred: §2 "Pusher not implemented anywhere in codebase" | Deferred |
| 5 | **Komunikace s kupujícím** — žádný messaging | ❌ Deferred: §2 "Depends on Pusher or alternative (SSE) — heavy feature" | Deferred |

**Navíc (ne v TOP 5 ale validní gapy):**
- Part detail page `/parts/[id]` — ✅ Commit 1 (gap: PartCard linkuje na `/parts/my`)
- PartCard link fix — ✅ Commit 1 (one-line edit)
- Loading/error states pro nové routes — ✅ Commit 5

### EVZEN nezávislá verifikace:

**PartCard link broken:** `components/pwa-parts/parts/PartCard.tsx:30`:
```tsx
<Link href={`/parts/my`} className="block no-underline">
```
✅ Confirmed — linkuje na list, ne na detail. Plan fix je korektní.

**Part detail page missing:** `ls app/(pwa-parts)/parts/[id]/` → EXIT=1 (neexistuje). ✅ Confirmed.

**API PUT/DELETE exist:** `app/api/parts/[id]/route.ts` — PUT (L57) + DELETE (L128). ✅ Plan správně říká "backend is mature, gap is UI."

**Deferral justification:** Gapy 4+5 závisí na Pusher, který "not implemented anywhere in codebase." Gap 3 závisí na Cloudinary env vars. Všechny 3 vyžadují external service setup mimo scope code plánu. **Deferral je obhájitelný.**

**Verdict check 1:** ✅ **PASS** — 3/5 TOP gapů pokryty, 2 deferred s validním důvodem, 3 bonus gapy adresovány.

---

## §3 — Check 2: LEAD DECISIONS konzistence

| Q | LEAD Decision | Plan §12 recommendation | Konzistentní? |
|---|--------------|------------------------|---------------|
| Q1 | ACCEPT — part detail owner-only | "Supplier-only (behind middleware `/parts/*` auth). Buyers see parts via public catalog at `/dily/[slug]`." | ✅ |
| Q2 | ACCEPT — onboarding jen pro nové registrace | "Only new registrations. Existing seed users (`dily@carmakler.cz`, `velkoobchod@carmakler.cz`) have `status=ACTIVE` — they bypass onboarding." | ✅ |
| Q3 | ACCEPT — rozdělit CRUD (C1-C3) a onboarding (C4-C5) | "CRUD is higher priority and independently valuable. Onboarding can be C4+C5 in a separate dispatch." | ✅ |

### EVZEN verifikace Q2 claim:

Middleware pattern for broker onboarding (`middleware.ts:192-246`):
```
if (token.status === "ONBOARDING") {
  return NextResponse.redirect(new URL("/makler/onboarding", request.url));
}
```

Plan proposes same pattern for supplier. Existing ACTIVE users bypass because `token.status !== "ONBOARDING"`. ✅ Q2 is **technically correct** — existing suppliers remain unaffected.

**Verdict check 2:** ✅ **PASS** — all 3 decisions consistent with plan recommendations.

---

## §4 — Check 3: File manifest, STOP rules, acceptance criteria

### 4.1 File manifest (§4)

**New files: 12** — all listed with commit assignment + estimated lines.

EVZEN spot-check:
- `app/(pwa-parts)/parts/[id]/page.tsx` (C1, ~120 lines) — main deliverable ✅
- `app/api/auth/supplier-onboarding/route.ts` (C4, ~60 lines) — new API route ✅
- 4 loading/error files (C5) — CLAUDE.md says "Každá stránka má svůj loading.tsx a error.tsx" ✅

**Edited files: 3-4** — PartCard.tsx, middleware.ts, lib/auth.ts (verify-only), parts/my/page.tsx.

EVZEN verifikace lib/auth.ts claim:
```
lib/auth.ts:36:  status: user.status,
lib/auth.ts:41:  onboardingStep: user.onboardingStep,
lib/auth.ts:42:  onboardingCompleted: user.onboardingCompleted,
lib/auth.ts:68:  token.status = user.status;
lib/auth.ts:73:  token.onboardingStep = user.onboardingStep;
lib/auth.ts:74:  token.onboardingCompleted = user.onboardingCompleted;
```

**Všech 3 JWT fields (`status`, `onboardingStep`, `onboardingCompleted`) JIŽ EXISTUJÍ.** Plan STOP-5 správně říká "verify first — may already be there." → IMPL by měl verify-only, 0 edits na lib/auth.ts. Viz OBS-3.

**"Files NOT to edit" table:** 6 files explicitně chráněny (API routes, validators, schema). ✅

### 4.2 STOP rules (§8) — 8 pravidel

| STOP | Popis | Validní? |
|------|-------|----------|
| STOP-1 | NE edit API routes (PUT/DELETE/GET work) | ✅ Verified: PUT L57, DELETE L128 |
| STOP-2 | NE modify Prisma schema | ✅ Verified: all fields exist (L46-59) |
| STOP-3 | NE install npm packages | ✅ Reasonable |
| STOP-4 | NE refactor wizard steps | ✅ Verified: controlled components (props-driven) |
| STOP-5 | Verify JWT fields before middleware edit | ✅ Critical — verified, fields present |
| STOP-6 | Compatibility data reconstruction (lossy) | ✅ Documented, acceptable MVP |
| STOP-7 | Cloudinary env vars = env issue, ne code | ✅ Consistent with audit §10.1 gap 3 |
| STOP-8 | Escalation: >6h or >8 files per commit | ✅ Reasonable bounds |

### 4.3 Acceptance criteria (§9)

**Per-commit:** C1-C5 each with 4-8 checkboxes. ✅
**End-to-end smoke:** 8-step CRUD cycle test (login → list → detail → edit → save → delete → create → verify). ✅
**Onboarding smoke:** 7-step test with separate seed user (create ONBOARDING user → 3 steps → admin approve → access). ✅
**Post-plan checklist (§13):** build + lint + CRUD cycle + no new deps + no schema changes + diff < 1000 lines. ✅

### 4.4 Schema fields verified

```
prisma/schema.prisma:46:  onboardingStep      Int      @default(1)
prisma/schema.prisma:47:  onboardingCompleted Boolean  @default(false)
prisma/schema.prisma:58:  companyName String?
prisma/schema.prisma:59:  ico         String?
```

✅ All 4 fields exist. Plan §6 claim "NONE" schema changes confirmed.

**Verdict check 3:** ✅ **PASS** — file manifest, STOP rules, acceptance criteria all complete.

---

## §5 — Check 4: Žádné mazání/schovávání existujících features

**Audit §10.1 existing pages (7/7 functional):**

| Stránka | Plán edit? | Status |
|---------|-----------|--------|
| `/parts` (dashboard) | NE | ✅ Untouched |
| `/parts/my` | C5: minor CTA improvement | ✅ Additive only |
| `/parts/new` (wizard) | NE | ✅ Untouched |
| `/parts/import` (CSV) | NE | ✅ Untouched |
| `/parts/orders` | NE | ✅ Untouched |
| `/parts/orders/[id]` | NE | ✅ Untouched |
| `/parts/profile` | NE | ✅ Untouched |

**PartCard.tsx:** Link href changes from `/parts/my` to `/parts/${id}` — this is a **fix**, not removal. Users still reach My Parts via bottom nav. ✅

**Wizard steps (PhotoStep, DetailsStep, PricingStep):** Plan uses them AS-IS for edit page. STOP-4 explicitly protects against refactoring. ✅

**middleware.ts:** Plan adds ~10 lines for supplier onboarding redirect BEFORE existing `/parts` protection. Existing broker onboarding (L192-246) untouched. ✅

**Verdict check 4:** ✅ **PASS** — plán je čistě aditivní, žádné features se nemažou.

---

## §6 — Observations (non-blockers)

| # | Severity | Popis |
|---|----------|-------|
| **OBS-1** | Observation | **§0 self-contradiction:** Executive summary (L24) říká "No new API routes" ale §5 (L471-474) definuje nový `PATCH /api/auth/supplier-onboarding` a §3 Commit 4 file manifest vytváří `app/api/auth/supplier-onboarding/route.ts`. §0 by měl říkat "1 new API route (supplier onboarding)." **Non-blocker** — §5 je autoritativní, §0 je jen summary. |
| **OBS-2** | Observation | **Title "na 100 %" vs 6 deferred features.** Plan §2 explicitně deferuje 6 položek (Pusher notifications, messaging, rating, advanced search, offline CRUD, webhook notifications). Realisticky toto posune PWA Díly na ~95 % — chybějí external service integrace. Plan sub-title "Fáze 1" naznačuje další fáze, ale hlavní title "na 100 %" je mírně zavádějící. **Non-blocker** — core CRUD + onboarding je kompletní, deferred items jsou external dependency. |
| **OBS-3** | Observation | **lib/auth.ts v file manifest jako "edited" ale JWT fields ALREADY EXIST.** EVZEN verified: `status` (L36/68/83), `onboardingStep` (L41/73/88), `onboardingCompleted` (L42/74/89) jsou v JWT callbacku. Plan STOP-5 správně říká "verify first — may already be there" ale file manifest (§4) listuje `lib/auth.ts` jako edited file. IMPL by měl verify-only a NE editovat. **Non-blocker** — STOP-5 je guard. |
| **OBS-4** | Observation | **Žádný E2E test spec v plánu.** Plan vytváří 12 nových souborů ale žádný automated test. Porovnání: #182 zahrnul `e2e/parts-wholesale.spec.ts`. §9 má manual smoke test kroky ale NE Playwright spec. Pro CRUD cycle (create → view → edit → delete) by E2E test byl cenný. **Non-blocker** — UI-only work, manual smoke suffices pro Fáze 1. Lead rozhodne zda chce E2E jako follow-up. |

---

## §7 — Cross-reference s předchozími schváleními

| Review | Relevance | Konzistence |
|--------|-----------|-------------|
| #183 (plan #182) | Plan #210 builds on #182 deployed code (manufacturer + warranty fields) | ✅ No regression — #210 doesn't touch these fields, just renders them in detail page |
| #195 (impl #184) | Commit set `9dfadde`→`059f6a2` deployed. Plan #210 creates new pages in same route group | ✅ No conflict |
| #207 (deploy #206) | Production has manufacturer/warranty migration. Plan #210 doesn't need new migration | ✅ Consistent |

---

## §8 — Final verdict

### SCHVÁLENO

Plán #210 je:

- **Scoped** — pokrývá 3/5 TOP gapů z auditu + 3 bonus gapy, 2 deferred s validním důvodem (external service dependencies)
- **Verified** — PartCard link broken (L30), detail page missing, PUT/DELETE exist, JWT fields present, schema fields present — vše nezávisle ověřeno
- **Additive** — 12 new files, 3-4 edited, žádné existující features smazány ani schovány
- **Protected** — 8 STOP rules, 6 "Files NOT to edit" explicitně chráněny
- **Testable** — per-commit acceptance criteria + end-to-end smoke + onboarding smoke
- **Consistent** — LEAD DECISIONS Q1-Q3 match plan recommendations, no regression vs #182/#184/#206

**0 blockerů. 4 minor non-blocker observations.**

**Lead může dispatchovat IMPL.** Per Q3 ACCEPT, doporučený postup: C1-C3 (CRUD) jako první batch, C4-C5 (onboarding) jako druhý batch.
