# Plan — Fix `/profil/[slug]` — R4 Forward fix z commitu `4663973`

**Datum:** 2026-04-16
**Autor:** PLANOVAČ
**Rozsah:** REVIZE 4 (FORWARD FIX) — side-by-side layout + zachovat užitečné fixy z `4663973`
**Effort:** XS (~10 min) — pár CSS class edits + jeden nový wrapper div
**Commit:** `fix: profile header back to side-by-side, keep owner edit + flex stats (task #53)`
**Baseline:** `4663973` (aktuálně v main)
**Strategie:** NOVÝ commit nad `4663973`, ne reset/amend (memory: `feedback_git_reset_approval.md`)

---

## §-1 KLÍČOVÉ ROZHODNUTÍ — `items-start` místo `items-center`

**Team-lead navrhl `items-center`.** Doporučuji **`sm:items-start`** z těchto důvodů:

**Kontext:** Info div obsahuje ~10 prvků (name, role pills, bio, fav brands, motto, specs, services, lang/exp, socials, warehouse, member since, actions) → výška **350-450 px**. Avatar je **112 px mobile / 144 px desktop**.

| Volba | Kde bude jméno (H1) vůči avataru | Kde bude avatar vůči info divu | Verdikt |
|---|---|---|---|
| `items-start` | **Vedle horní hrany avataru** (zarovnaný top-top) | Avatar straddluje cover, info teče dolů pod něj | ✅ **jméno rozumně vedle avataru** |
| `items-center` | Nad avatarem (info je ~3x vyšší → střed info = bio area) | Avatar centrovaný do středu info kolony, vytažený PRYČ od jména | ❌ "jméno NAD avatarem" |
| `items-end` | Pod avatarem (bottom-bottom aligned) | Avatar na vrcholu, info zarovnaný k jeho bottomu | ❌ **původní "jméno nesedí" problém** |

**Doporučení:** `sm:items-start` + `sm:gap-6` (horizontální mezera mezi avatarem a info kolonou).

Pokud team-lead trvá na `items-center`, nech rozhodne uživatel — plán umožňuje přepnout jednu třídu. Default v plánu je `sm:items-start`.

---

## §0 KONTEXT — CO UŽ JE V MAIN

**Commit `4663973`** (v main) = R3 Instagram full-center:
- Header: `flex flex-col items-center text-center` (zarovnáno na střed, single column)
- Všechny pills/meta/stats/tabs/badges wrappery mají `justify-center`
- Badges section má `text-center`

**Uživatel chce side-by-side zpět.** R4 = forward fix: **cílené class edity** na `4663973` → side-by-side, ZACHOVÁVÁM `useSession`, `isOwner`, edit button, flex stats, N1/N3, G13.

---

## §1 ZACHOVAT z `4663973` (NE-měnit)

| Co | Kde | Důvod |
|---|---|---|
| `import { useSession } from "next-auth/react";` | `page.tsx:5` | Owner detekce |
| `const { data: session } = useSession();` | `page.tsx:156` | Session access |
| `const isOwner = !!session?.user?.id && session.user.id === user.id;` | `page.tsx:252` | Owner check |
| `{isOwner ? <Link href="/muj-ucet/profil">Upravit profil</Link> : ...}` | `page.tsx:399-415` | Owner-aware CTA |
| `label="Průměrné ROI"` | `page.tsx:433` | N1 fix |
| `label="Dokončené dealy"` | `page.tsx:435` | N3 fix |
| `aria-label="Menu účtu"` | `muj-ucet/layout.tsx:33` | G13 a11y |
| **Flex stats** (ne grid): `flex flex-wrap gap-8 sm:gap-12 mb-6 py-4 border-y border-gray-200` | `page.tsx:426` | G9 fix z 4663973 — **zachovat flex**, jen změnit `justify-center` → odebrat |

---

## §2 PROVEST — 3 DRUHY ZMĚN

### §2.1 Strukturální změna: obalit info obsah do flex-col wrapperu

**Současný stav** (`page.tsx:276-423`):
```jsx
<div className="relative -mt-16 sm:-mt-20 mb-6 flex flex-col items-center text-center">
  {/* Avatar */}
  <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full ...">...</div>

  {/* Name */}
  <h1>...</h1>

  {/* Role + Level + City */}
  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">...</div>

  {/* Bio, fav brands, motto, specs, services, lang, socials, warehouse, member since, actions */}
  ...
</div>
```

**Cíl:** Avatar = 1. sibling, všechno ostatní = 2. sibling (info kolona), parent = flex-row na sm+.

**Diff pseudokód:**
```jsx
<div className="relative -mt-16 sm:-mt-20 mb-6 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
  {/* Avatar — 1. sibling */}
  <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full ... shrink-0 mx-auto sm:mx-0">...</div>

  {/* Info column — 2. sibling (NOVÝ WRAPPER) */}
  <div className="flex-1 min-w-0">
    {/* Name */}
    <h1>...</h1>

    {/* Role + Level + City */}
    <div className="flex flex-wrap items-center gap-2 mt-2">...</div>

    {/* Bio, fav brands, ... , actions */}
    ...
  </div>
</div>
```

**Poznámky:**
- `sm:flex-row` — side-by-side desktop, single column mobile
- `sm:items-start` — viz §-1
- `gap-4 sm:gap-6` — vertikální mezera mobile / horizontální desktop
- Avatar: `shrink-0 mx-auto sm:mx-0` — nezmenšovat, centered mobile, left desktop
- Info wrapper: `flex-1 min-w-0` — zabírá zbývající prostor, `min-w-0` brání overflow flexbox children
- `mb-4` z původního bio odstraněného `mb-4` NEPŘIDÁVAT — už to má `mt-4`

---

### §2.2 CSS class edity — odebrat `justify-center` / `text-center`

**Seznam (10 míst):**

| # | Řádek | Současný fragment | Target (změna) |
|---|---|---|---|
| 1 | `276` | `flex flex-col items-center text-center` | `flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6` |
| 2 | `278` | `... rounded-full ... mb-4` (avatar div) | `... rounded-full ... shrink-0 mx-auto sm:mx-0` (odebrat `mb-4` — gap řeší spacing, přidat shrink-0 + mx-auto sm:mx-0) |
| 3 | `294` | `flex flex-wrap items-center justify-center gap-2 mt-2` | `flex flex-wrap items-center gap-2 mt-2` |
| 4 | `315` | `flex flex-wrap justify-center gap-1.5 mt-3` | `flex flex-wrap gap-1.5 mt-3` |
| 5 | `334` | `flex flex-wrap justify-center gap-1.5 mt-3` | `flex flex-wrap gap-1.5 mt-3` |
| 6 | `343` | `flex flex-wrap justify-center gap-1.5 mt-2` | `flex flex-wrap gap-1.5 mt-2` |
| 7 | `351` | `flex flex-wrap items-center justify-center gap-3 mt-3 text-xs text-gray-500` | `flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500` |
| 8 | `365` | `flex justify-center gap-3 mt-2` | `flex gap-3 mt-2` |
| 9 | `383` | `mt-1 text-xs text-gray-500 flex flex-wrap justify-center gap-x-3` | `mt-1 text-xs text-gray-500 flex flex-wrap gap-x-3` |
| 10 | `398` | `flex gap-2 mt-4 justify-center` | `flex gap-2 mt-4` |
| 11 | `426` | `flex flex-wrap justify-center gap-8 sm:gap-12 mb-6 py-4 border-y border-gray-200` | `flex flex-wrap gap-8 sm:gap-12 mb-6 py-4 border-y border-gray-200` |
| 12 | `441` | `flex justify-center gap-0` | `flex gap-0` |
| 13 | `493` | `mb-10 text-center` | `mb-10` |
| 14 | `495` | `flex flex-wrap justify-center gap-3` | `flex flex-wrap gap-3` |

**Poznámka k #2 (avatar):** Odebrat `mb-4` — parent má `gap-4`. Přidat `shrink-0 mx-auto sm:mx-0` aby se avatar centroval na mobile (single-column) a byl vlevo na desktop.

---

### §2.3 NIC NEMĚNIT v logice

- Žádné JS / state / effect změny
- `useSession`, `isOwner`, `handleShare`, tabs, items grid, paginace — beze změny
- `badges`, `roleStats`, `stats` — beze změny
- `ProfileItemCard`, `CommentSection` — beze změny

---

## §3 R4 FORWARD FIX — SOUHRN DIFFU

**Čistě textově:** 1 strukturální změna (obalit info do divu) + **13 class edits** v `page.tsx` (odebrat `justify-center`/`text-center`/`mb-4`, nahradit header flex-col single-column za flex-col sm:flex-row, přidat `shrink-0 mx-auto sm:mx-0` na avatar).

**Výsledný vizuál:**
- **Mobile (<640px):** flex-col, avatar nahoře (centrovaný `mx-auto`), pod ním info div s levostranně zarovnaným textem (H1 Jméno, role pills, bio, atd.)
- **Desktop (sm+):** flex-row, avatar vlevo (straddling cover), info vpravo (top-aligned s avatarem), všechno levostranně zarovnané
- **Stats bar:** flex, left-aligned, border-y divider — jak team-lead chce
- **Tabs:** left-aligned
- **Badges:** left-aligned

---

## §4 IMPLEMENTAČNÍ KROKY (pro IMPLEMENTÁTORA)

> **⚠️ STOP PODMÍNKY:** Pokud se objeví TypeScript chyba, build fail, nebo se JSX struktura rozsype → STOP a eskaluj.

1. **Git sanity:** `git status` → clean. `git log --oneline -1` → `4663973`. **NE-resetovat, NE-amendovat** — jde o nový commit.
2. **Pročíst** `app/(web)/profil/[slug]/page.tsx:260-516` — držet current state v hlavě.
3. **Edit 1 — Header wrapper** (ř. 276):
   - `flex flex-col items-center text-center` → `flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6`
4. **Edit 2 — Avatar div** (ř. 278):
   - `mb-4` → odebrat
   - Přidat na konec className: `shrink-0 mx-auto sm:mx-0`
5. **Edit 3 — Obalit info content** (vše od `{/* Name */}` na ř. 288 do `</div>` zavírajícího actions na ř. 422):
   - Před `<h1>` přidat: `<div className="flex-1 min-w-0">`
   - Za `</div>` (konec actions, ř. 422) přidat: `</div>` (zavírá info wrapper)
   - Kontrola: parent div na ř. 276 musí mít přesně 2 JSX children (avatar + info wrapper)
6. **Edit 4-14 — Odebrat `justify-center` / `text-center`** dle tabulky v §2.2 (#3-#14):
   - ř. 294, 315, 334, 343, 351, 365, 383, 398, 426, 441, 493, 495
7. **Build check:** `npm run build`. Pokud TS/lint chyba → STOP a eskaluj.
8. **Dev check** (optional, pokud máš `npm run dev` běžící): otevřít `/profil/jan-novak-praha` anonymously a přihlášený jako jan.novak@carmakler.cz:
   - Desktop: avatar vlevo, jméno vpravo vedle avataru na stejné výšce
   - Mobile: avatar centrovaný nahoře, vše pod ním left-aligned
   - Stats bar: left-aligned
   - Owner (Jan Novák přihlášený): vidí "Upravit profil" button
9. **Git commit:** viz §5.
10. **Report HOTOVO team-lead** s commit hash + odkazem na tento plán.

---

## §5 COMMIT MESSAGE

```
fix: profile header back to side-by-side, keep owner edit + flex stats (task #53)

Reverts full-center Instagram layout from 4663973 to original side-by-side
(avatar left + info right on desktop, single-column on mobile).

Keeps from 4663973:
- useSession + isOwner + "Upravit profil" button for profile owner
- Flex stats bar (non-grid, no asymmetric gap)
- N1 "Průměrné ROI" / N3 "Dokončené dealy" labels
- G13 aria-label "Menu účtu" in muj-ucet layout

Changes:
- Header wrapper: flex-col items-center text-center → flex-col sm:flex-row sm:items-start gap-4 sm:gap-6
- Wrap name/pills/bio/.../actions into new flex-1 min-w-0 info column
- Avatar: shrink-0 mx-auto sm:mx-0 (centered mobile, left desktop)
- Remove justify-center from 10 flex wrappers (role pills, fav brands, specs, services, lang, socials, opening hours, actions, stats, tabs)
- Remove text-center / justify-center from badges section

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## §6 VERIFIKACE (10 test cases)

| # | Test | Expected |
|---|---|---|
| 1 | Desktop `/profil/jan-novak-praha` anonymous | Avatar vlevo, info vpravo, H1 na stejné výšce jako avatar top |
| 2 | Mobile < 640px | Avatar centrovaný nahoře, info pod ním left-aligned |
| 3 | Stats bar | flex, left-aligned, border-y divider |
| 4 | Tabs | left-aligned |
| 5 | Badges section | left-aligned (H2 + pill list) |
| 6 | Přihlášený Jan Novák na `/profil/jan-novak-praha` | Vidí "Upravit profil" button (href=/muj-ucet/profil) |
| 7 | Přihlášený jiný broker na cizím profilu | Vidí "Kontaktovat" tlačítko (ne "Upravit profil") |
| 8 | Anonymous | Vidí "Kontaktovat" + "Sdílet profil" |
| 9 | ROI stat pro INVESTOR | Label "Průměrné ROI" (ne "Prům. ROI") |
| 10 | VERIFIED_DEALER stat | Label "Dokončené dealy" (ne "Dokončené") |

**Playwright:** spustit `npx playwright test e2e/TASK-053-*.spec.ts --project=chromium` (3/4 by měly PASS jako předtím, mobile=webkit skip).

---

## §7 ESTIMATE & ROZSAH

- **Effort:** XS (~10 min) pro zkušeného implementátora
- **Risk:** nízký — žádná JS/state logic změna, jen CSS + 1 wrapper div
- **Dependencies:** žádné
- **Rollback:** `git revert <new-commit>` → vrátí se na `4663973`

---

## §8 MEMORY REMINDERS

- `feedback_git_reset_approval.md` — **NE-resetovat, NE-amendovat `4663973`**. Nový commit.
- `feedback_stop_escalate_literal.md` — pokud build fail / TS error → STOP, eskaluj.
- `feedback_no_parallel_impl_test.md` — po HOTOVO dej vědět, test-chrome startuje SEKVENČNĚ ne paralelně.

---

## §9 OPEN QUESTION PRO TEAM-LEAD

**`items-start` vs `items-center`?**

Doporučuji `sm:items-start` (viz §-1 analýza). Pokud team-lead nebo uživatel preferuje `items-center`, stačí v kroku §4.3 přepnout `sm:items-start` → `sm:items-center`. Zbytek plánu je identický.

Default v plánu: **`sm:items-start`**.

---

**END OF PLAN R4**
