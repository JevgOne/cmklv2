# Audit — TASK-053 (Instagram-style profil) stav k 2026-04-16

**Datum auditu:** 2026-04-16
**Autor:** PLANOVAČ
**Účel:** Lead chce vědět, co zbývá dotáhnout u TASK-053 (práce z 15.4.).
**Skenované zdroje:** plan-task053-instagram-profile.md (723 ř.), qa-task053-instagram-profile.md, review-task053-evzen.md (R1), review-task053-evzen-r2.md (R2), TASK-QUEUE.md, git log.

---

## §0 EXECUTIVE SUMMARY (TL;DR)

| Položka | Stav |
|---|---|
| Implementace dle plánu | ✅ KOMPLET (3 commity 15.4. + 1 build-fix) |
| QA review | ✅ uzavřena (BUG-1 + 3 GAP-y) |
| Evžen R1 | ⚠️ Schváleno s výhradami (8 blocking gapů G1, G3–G8) |
| Evžen R2 | ✅ **SCHVÁLENO PRO PRODUCTION** (všech 7 blocking gapů opraveno) |
| Build / TS / Lint | ✅ produkční kód clean (3 TS varování jen v e2e testech, nesouvisí) |
| **Chrome E2E test** | ❌ **CHYBÍ — BLOCKER** (žádný `chrome-test-task-053-*.md`) |
| Profilová pole | 14/14 ✅ |
| Univerzální role | 12/12 ✅ |
| Auto-population | 5/5 ✅ |
| Otevřené minor nálezy | 7 (G9–G13 + N1, N3) — všechny NÍZKÁ, žádný blocker |

**TL;DR:** Funkčně hotovo a schváleno Evženem, ale **nikdo to neproklepl v Chrome**. To je jediná cesta od „SCHVÁLENO“ k „MERGE-READY pro reálné uživatele“. Plus 7 minor textových/UX vylepšení, která lze spojit s Chrome retest fixy.

---

## §1 KOMPLETNÍ ZADÁNÍ (doslovné znění)

V `TASK-QUEUE.md` **NENÍ samostatný TASK-053 řádek** — task vznikl ad-hoc 15.4. a žije jen v `plan-task053-instagram-profile.md` + TaskList systému (task #9 / #53). Doslovný plán-souhrn:

> **Task #53: Instagram-style uživatelský profil**
> *Datum:* 2026-04-15 · *Effort:* L (2-3 dny)
>
> Sjednotit fragmentované profily (`/makler/[slug]`, `/dodavatel/[slug]`, `/bazar/[slug]`, `/muj-ucet/`) do jednoho IG-style layoutu na `/profil/[slug]` a přidat **lajky, komentáře, badge gamifikaci a level system**.
>
> **Schema:** rozšířit User o 14 polí (coverPhoto, favoriteBrands, city, website, motto, showPhone, showEmail, profileViews, socialLinks, yearsExperience, warehouseAddress, services, languageSkills, openingHours) + nové modely `ProfileLike`, `ProfileComment`, `ProfileBadge` (polymorfní target Vehicle/Listing/Part).
>
> **API:** `GET /api/profile/[slug]`, `GET /api/profile/[slug]/items`, `GET/PUT /api/profile/edit`, `POST/DELETE /api/likes`, `POST/GET/DELETE /api/comments`.
>
> **Stránky:** `/profil/[slug]` (public), `/muj-ucet/profil` (edit). Nemazat existující `/makler/`, `/dodavatel/`, `/bazar/` (SEO).
>
> **Role-aware tabs:** BROKER → vehicles+reviews+liked, ADVERTISER → listings+liked, PARTS_SUPPLIER/PARTNER_VRAKOVISTE → parts+reviews+liked, BUYER → liked, ADMIN → all, INVESTOR → investments+liked, VERIFIED_DEALER → flips+vehicles+liked.
>
> **Stats:** výhradně z reálných DB dat (žádný hardcode).
>
> **Gamifikace:** 12 badge typů (FIRST_SALE, FIVE/TEN/FIFTY_SALES, PHOTO_PRO, FAST_RESPONDER, TOP_RATED, VERIFIED, POPULAR, COMMUNITY, COLLECTOR, EARLY_ADOPTER) + level system JUNIOR → BROKER → SENIOR → TOP (≥50 sales + ≥4.5 rating).
>
> **Auto-population:** žádné kopírování dat — query-time view.
>
> **STOP-1:** Prisma migrace selhává → eskaluj. **STOP-2:** Polymorfní constraint na DB → app validace stačí. **STOP-3:** Cloudinary upload → fallback na existující pattern.
>
> **Commit:** `feat: add Instagram-style profile with likes, comments & badges`

(Plný plán: 723 řádků, 11 sekcí, viz `.claude-context/tasks/plan-task053-instagram-profile.md`.)

---

## §2 CO JE HOTOVO

### 2.1 Commity (chronologicky 15.4.2026)

| # | SHA | Čas | Popis | Stat |
|---|-----|-----|-------|------|
| 1 | `8d74958` | 15.4. | feat: add Instagram-style profile with likes, comments & badges | initial impl |
| 2 | `9aa2603` | 15.4. | fix: resolve QA findings for Instagram-style profile (task #53) | QA pas |
| 3 | `d51a353` | 15.4. 08:35 | fix: resolve profile gaps G1, G3-G8 (task #53) | +584 ř. / 7 souborů |
| 4 | `9f566bd` | 15.4. 08:55 | fix: extract BADGE_CATALOG to client-safe module (build fix) | +19/-15 ř. |
| 5 | `c391a34` | 15.4. 11:10 | fix: remove custom session cookie config causing login failure | -12 ř. |

> Pozn.: `c391a34` není přímo v rozsahu task-053, ale byl objeven jako nutný side-effect v rámci téhož dne (login redirect loop). Souvisí s auth flow používaným profilem.

### 2.2 Profilová pole (14/14)

bio, avatar, coverPhoto, city, favoriteBrands, specialization, yearsExperience, website, motto, socialLinks, services, languageSkills, warehouseAddress (role-gated), openingHours (role-gated) — **všech 14 v Schema + API + Edit UI + Display** (per Evžen R2 tabulka).

### 2.3 API routes

- `GET /api/profile/[slug]` — public, role-specific stats (BROKER/ADVERTISER/PARTS_SUPPLIER/PARTNER_VRAKOVISTE/VERIFIED_DEALER/INVESTOR/BUYER), profileViews increment (atomic), privacy gates ✅
- `GET /api/profile/[slug]/items` — cursor pagination, tab validation (vehicles/listings/parts/flips/investments/liked) ✅
- `GET/PUT /api/profile/edit` — only own (session guard), Zod, auto-slug, JSON.stringify pro array fields ✅
- `POST/DELETE /api/likes` — Zod refine (právě 1 non-null), toggle, best-effort badge check ✅
- `POST/GET/DELETE /api/comments` — Zod refine, rate limit 10/5min, isHidden default false, 3-way auth (owner/ADMIN-BACKOFFICE/item-owner) ✅

### 2.4 Stránky a komponenty

- `/profil/[slug]` (public) — role-based tabs, stats bar (conditional, 0-hidden), badges z BADGE_CATALOG, favoriteBrands JSON.parse, motto kurzívou, specializations/services pills, socialLinks linky, warehouse box (role-gated) ✅
- `/muj-ucet/profil` (edit) — formulář se sekcemi: Profil detaily, Sociální sítě, Specializace, Služby, Jazyky, Sklad (role-gated) ✅
- `LikeButton` — optimistic UI, login redirect, animace ✅
- `CommentSection` — lazy-load, timeAgo, auth-gated form, integrovaná pod každou položkou v profil gridu ✅
- `ProfileItemCard` — 5 typů: vehicle/listing/part/flip/investment/liked ✅
- `lib/profile-slug.ts` — NFD normalizace, loop-with-counter collision ✅
- `lib/badges.ts` — `checkAndAwardBadges` (idempotent) + `checkAndUpdateLevel` (bidirekční JUNIOR↔BROKER↔SENIOR↔TOP) ✅
- `lib/badge-catalog.ts` — extrahováno z `lib/badges.ts` jako client-safe modul (build fix `9f566bd`)

### 2.5 Acceptance criteria (per Evžen R2)

| Požadavek | Skóre |
|---|---|
| Instagram layout | 6/6 ✅ |
| Univerzální role | 12/12 ✅ |
| Auto-population | 5/5 ✅ |
| Komentáře integrované | ✅ |
| Reálná data (žádný hardcode) | ✅ |
| BEZ certifikací | ✅ |
| 14 polí | 14/14 ✅ |
| Gamifikace (badges + level-up) | ✅ |

### 2.6 Build / TS / Lint stav (k 2026-04-16)

- **TS:** `npx tsc --noEmit` — **0 errors v produkčním kódu**. 3 errors jen v `e2e/*.spec.ts` (chrome-test specs, nesouvisí s task-053):
  - `chrome-test-235-c1c7-partner.spec.ts:252` — TS18048 možná undefined
  - `chrome-test-makler-broker-pwa.spec.ts:28` — implicit any
  - `chrome-test-pwa-makler-full.spec.ts:19` — implicit any
- **Lint:** `npm run lint` — **0 errors, 613 warnings**. Vše buď v minified `public/sw.js` nebo `scripts/migrate-cloudinary.ts` (nesouvisí s task-053).
- **Závěr:** task-053 kód je **build-clean**.

---

## §3 CO CHYBÍ / OTEVŘENÉ NÁLEZY

### 3.1 BLOCKER

- **Chrome E2E test pro task-053 NEEXISTUJE.**
  Žádný `chrome-test-task-053-*.md` ani `chrome-test-task053-*.md` v `.claude-context/tasks/`. Žádný `e2e/*-053-*.spec.ts`.
  Per dosavadní team-lead pravidlo: bez Chrome ověření feature není MERGE-READY.

### 3.2 QA findings (qa-task053-instagram-profile.md) — **STAV neoznačen jako uzavřen**

Tyto byly vytvořeny po commitu 8d74958 — některé mohly být tiše opraveny v `9aa2603`. **Vyžaduje rychlé spot-check ověření.**

| ID | Závažnost | Popis | Pravděpodobný stav |
|---|---|---|---|
| BUG-1 | Minor | CommentSection delete tlačítko chybí pro item-ownery (API umí, UI ne) | ⚠️ Neověřeno — pravděpodobně přetrvává (Evžen R1/R2 to neřeší) |
| GAP-1 | — | 4 badge typy bez auto-award (PHOTO_PRO, FAST_RESPONDER, TOP_RATED, EARLY_ADOPTER) | ⚠️ Neopraveno (R2 to neřeší) |
| GAP-2 | — | `isHidden` na ProfileComment bez API/UI pro nastavení | ⚠️ Neopraveno |
| GAP-3 | — | MANAGER, REGIONAL_DIRECTOR chybí v ROLE_TABS (fallback "liked") | ⚠️ Neopraveno (R2 doplnil INVESTOR + VERIFIED_DEALER, ne MANAGER/RD) |

### 3.3 Evžen R1 — VŠECH 8 BLOCKING (G1, G3–G8) → ✅ OPRAVENO v R2 (commit `d51a353`)

G2 (lajky vyžadují auth) — **záměrně ponecháno** (IG standard, potvrzeno leadem). Není gap.

### 3.4 Evžen R1 — LOW PRIORITY (G9–G13) → **NEOPRAVENO** (žádný blocker)

| ID | Popis | Závažnost |
|---|---|---|
| G9 | Komentáře — max 20, žádná paginace | NÍZKÁ |
| G10 | Komentáře — nelze editovat text (jen smazat/skrýt) | NÍZKÁ |
| G11 | Avatar/cover — URL input (ne file upload přes Cloudinary) | NÍZKÁ |
| G12 | Nelze lajkovat profil samotný (jen položky) | NÍZKÁ |
| G13 | Překlep `aria-label="Menu uctu"` → "Menu účtu" | NÍZKÁ (a11y nit) |

### 3.5 Evžen R2 — NOVÉ NÁLEZY (NEOPRAVENO)

| ID | Soubor | Popis | Závažnost |
|---|---|---|---|
| N1 | `profil/[slug]/page.tsx` | "Prům. ROI" je zkratka → "Průměrné ROI" (pravidlo: žádné zkratky) | NÍZKÁ |
| N3 | `profil/[slug]/page.tsx` | "Dokončené" jako stat label je vágní → "Dokončené dealy" | NÍZKÁ |

> N2 (DAY_LABELS po/út/...) — Evžen označil jako OK, není fix.

### 3.6 Unstaged / orphan soubory pro task-053

Z `git status`: **žádné unstaged změny pro task-053 kód.** Všechny změny jsou v commitech 8d74958, 9aa2603, d51a353, 9f566bd. Audit/review markdown soubory zůstávají untracked (`.claude-context/tasks/`), což je standardní pattern.

### 3.7 Není v TASK-QUEUE.md

TASK-QUEUE.md neobsahuje formální řádek `## TASK-053`. Až bude task uzavřen, lead by měl rozhodnout, zda doplnit retro-aktivně do queue (sekce HOTOVO) pro auditní stopu.

---

## §4 ROZPRACOVANÉ

**Žádné aktivní rozpracované práce na task-053.** Poslední commit `9f566bd` byl 15.4. 08:55. Od té doby žádné další TASK-053 commity. Implementační fáze je uzavřená — chybí jen ověřovací krok (Chrome) a kosmetické fixy.

---

## §5 DOPORUČENÝ NEXT STEP (prioritized fix plán)

### Krok 1 — BLOCKER FIX: Chrome E2E test (P0)

**Akce:** Dispatch test-chrome agent s briefingem:
1. Vytvořit `e2e/chrome-test-task-053.spec.ts` pokrývající:
   - GET `/profil/[slug]` pro 3 role: BROKER, PARTS_SUPPLIER, INVESTOR (ověřit role-aware tabs + stats)
   - PUT `/api/profile/edit` (login → save → reload → ověřit perzistenci motto, services, languageSkills)
   - LikeButton (login → like vehicle → counter +1 → unlike → counter -1)
   - CommentSection (login → submit comment → appears → delete by owner)
   - Badge display (uživatel s `totalSales >= 5` → vidí FIVE_SALES badge)
   - Level system (uživatel s 50+ sales + 4.5+ rating → label "TOP")
   - Edge: nepřihlášený uživatel klikne LikeButton → redirect na /login
2. Output report do `.claude-context/tasks/chrome-test-task-053.md`

**Estimate:** 30–45 min agent run.

### Krok 2 — KOSMETICKÉ FIXY (P2, jeden batch commit)

Po Chrome ověření v jednom commit:
- N1: `profil/[slug]/page.tsx` — "Prům. ROI" → "Průměrné ROI"
- N3: `profil/[slug]/page.tsx` — "Dokončené" → "Dokončené dealy"
- G13: a11y typo `aria-label="Menu uctu"` → "Menu účtu"
- BUG-1 (z QA): CommentSection delete tlačítko zobrazit pro všechny přihlášené (API zapečetí oprávnění 403) — viz fix navržený v `qa-task053-instagram-profile.md` ř. 28

Commit: `fix: cosmetic + a11y polish for Instagram profile (task #53)`

### Krok 3 — ROZHODNUTÍ leadem (P2)

Tři otevřené QA gapy z R0 vyžadují produktové rozhodnutí — **DEFER nebo FIX?**

- GAP-1: 4 badge typy bez auto-award. Buď doplnit triggery (PHOTO_PRO snadné, ostatní vyžadují tracking), nebo dočasně odstranit z `BADGE_CATALOG` (lib/badge-catalog.ts), aby uživatelé nečetli undeliverable sliby.
- GAP-2: `isHidden` na ProfileComment bez API/UI. Buď doplnit ADMIN endpoint `PATCH /api/comments/[id]/hide`, nebo polem zmrazit (deprecated comment).
- GAP-3: MANAGER + REGIONAL_DIRECTOR chybí v ROLE_TABS. Snadný fix v `app/(web)/profil/[slug]/page.tsx` ř. 76–88.

### Krok 4 — Low priority backlog (P3, defer)

G9 (paginace komentářů), G10 (edit komentáře), G11 (file upload), G12 (like profilu) — všechny lze vyhodit do samostatného TASK-054 nebo backlog. Nejsou blocker.

### Krok 5 — TASK-QUEUE evidence (P3)

Přidat retro-aktivní řádek `## TASK-053 — Instagram-style profil ✅` do sekce HOTOVO v `TASK-QUEUE.md` s odkazy na 4 commity a Evžen R2 verdict.

---

## §6 KEY CONCLUSIONS

1. **Implementace TASK-053 je v jádru hotová a Evženem schválena pro production** (R2 verdict).
2. **Jediný skutečný blocker je chybějící Chrome E2E test** — feature dosud neproběhla browser ověřením.
3. **Žádný kód není rozpracovaný** — vše commitnuto, build clean, TS/lint nesignalizují regresi.
4. **7 minor nálezů** (G9–G13 + N1, N3) lze spojit do jednoho cleanup commitu po Chrome ověření.
5. **3 otevřené QA gapy** (GAP-1/2/3) vyžadují produktové rozhodnutí (DEFER vs FIX) — nejsou blocker, ale jsou viditelné v UI/katalogu (zejména badge typy bez triggeru = "dead" sliby uživatelům).

**Doporučený postup:** 1) test-chrome → 2) batch cosmetic fix → 3) lead rozhodne o GAP-1/2/3 → 4) MERGE-READY.

---

*Audit kompletní. Bez kódových změn, jen analýza. — PLANOVAČ, 2026-04-16*
