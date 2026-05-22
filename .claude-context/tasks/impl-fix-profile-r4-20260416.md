# IMPL Report: R4 Forward fix — profil side-by-side (task #53)

**Datum:** 2026-04-16
**Implementátor:** agent team
**Task ID:** #14
**Plán:** `.claude-context/tasks/plan-fix-profile-alignment-20260416.md` (R4)
**Baseline:** `4663973` (R3 full-center Instagram layout, v main)
**Strategie:** NOVÝ commit nad `4663973` (per memory `feedback_git_reset_approval`)

---

## §1 — Commity

| Hash | Zpráva | Rozsah |
|---|---|---|
| `23780d1` | fix: revert profile to side-by-side layout + align stats left (task #53) | +71 / −68 |
| `6f5a3e5` | fix: profile header use sm:items-start + wrap all info in flex-1 (task #53) — **HOTFIX** | +118 / −118 |

**HOTFIX zdůvodnění:** Po `23780d1` team-lead upozornil, že `sm:items-center` vytlačí H1 jméno NAD avatar — info kolona má ~350-450 px (bio + tagy + socials + warehouse + atd.), avatar 112/144 px, `items-center` zarovnává vrchní hranu avataru na střed info kolony = bio area → jméno se dostane nad avatar. Fix: `sm:items-start` + restrukturalizace (avatar + info-flex-1 jako 2 siblings, nikoli 3).

**Nepushnuto** (dle zadání).

---

## §2 — Změněné soubory

| Soubor | Změny | Net rozsah |
|---|---|---|
| `app/(web)/profil/[slug]/page.tsx` | R4 (commit #1) + HOTFIX (commit #2) | 2 commity, čistý výsledek = side-by-side layout s items-start |

**Celkem:** 1 soubor, 2 commity.

---

## §3 — Provedené změny (§2.1–§2.7 dle plánu R4)

### §2.1 Header wrapper (ř. 276)
- `flex flex-col items-center text-center` → plain `<div className="relative -mt-16 sm:-mt-20 mb-6">`

### §2.2 Avatar + Info + Actions flex-row
- Nový wrapper: `<div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">`
- **Avatar** jako 1. sibling: `flex-shrink-0` (odebráno `mb-4` — gap řeší spacing)
- **Info kolona** jako 2. sibling: `<div className="flex-1 min-w-0">` obsahuje h1 + role/level/city badges (`flex flex-wrap items-center gap-2 mt-1` — **NO** justify-center)
- **Actions** jako 3. sibling: `<div className="flex gap-2 flex-shrink-0">` (přesunuto z původního "níže pod header" místa sem)
- Parent má přesně 3 JSX children (avatar + info + actions)

### §2.3 Odebrat `justify-center` z wrapperů uvnitř header body
- Bio: `max-w-xl` → `max-w-2xl`
- favBrands wrapper: `flex flex-wrap gap-1.5 mt-3` (odebráno `justify-center`)
- specs wrapper: `flex flex-wrap gap-1.5 mt-3`
- services wrapper: `flex flex-wrap gap-1.5 mt-2`
- langs/years/website wrapper: `flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500`
- socials wrapper: `flex gap-3 mt-2`
- opening hours wrapper: `mt-1 text-xs text-gray-500 flex flex-wrap gap-x-3`

### §2.4 Actions relocation
- Odebráno `<div className="flex gap-2 mt-4 justify-center">...</div>` z konce header body
- Actions přesunuto DO flex-row row-u z §2.2 jako 3. sibling (viz výše)

### §2.5 Stats bar (ř. 429)
- `flex flex-wrap justify-center gap-8 sm:gap-12 mb-6 py-4 border-y border-gray-200`
- → `flex flex-wrap gap-8 sm:gap-12 mb-6 py-4 border-y border-gray-200`
- Comment updated: "flex justify-center s border-y divider" → "flex s border-y divider"

### §2.6 Tabs (ř. 444)
- `flex justify-center gap-0` → `flex gap-0`

### §2.7 Badges section (ř. 496, 498)
- `<section className="mb-10 text-center">` → `<section className="mb-10">`
- `<div className="flex flex-wrap justify-center gap-3">` → `<div className="flex flex-wrap gap-3">`

---

## §4 — STOP-1 checklist

| Podmínka | Stav | Evidence |
|---|---|---|
| `npm run build` | ✅ PASS | `✓ Compiled successfully in 17.9s`, 1259 statických stránek, 0 errorů |
| TS errors | ✅ PASS | Build projel, žádné TS chyby |
| Jakákoli změna mimo §2.1–§2.7 | ✅ N/A | Pouze CSS class edity + 1 JSX restructure. Žádná změna logiky/JS/state |
| Reset/amend/force-push | ✅ N/A | Nový commit nad `4663973` (per memory rule) |

---

## §5 — Odchylky od plánu

**Commit `23780d1`:** Použit `sm:items-center` (per původní zadání team-leada, přestože plán R4 §-1 doporučoval `sm:items-start`).

**Commit `6f5a3e5` (HOTFIX):** Team-lead po review zadal přepnutí na `sm:items-start` — viz §-1 analýza plánu R4. Tím je výsledek plně v souladu s plánem R4 (finální verzí).

**Struktura po HOTFIX:**
- 2 siblings místo 3: avatar (`shrink-0 mx-auto sm:mx-0`) + info-flex-1 (obsahuje vše od H1 po Actions)
- `sm:items-start` zarovná horní hrany avataru a H1 jména
- `gap-4 sm:gap-6` — větší horizontální mezera na desktop
- Actions jako poslední sibling uvnitř info-flex-1 (no `justify-center`)

---

## §6 — Co jsem testoval locally

| Test | Výsledek |
|---|---|
| `npm run build` (po `23780d1`) | ✅ 0 errorů, 1259 stránek (17.9s) |
| `npm run build` (po `6f5a3e5`) | ✅ 0 errorů, 1259 stránek (21.8s) |
| `simplify` reuse review | ✅ CLEAN (agent report: "purely CSS class restructure, no new helpers/utilities/imports") |

**Chrome E2E:** nepoušítám (per memory `feedback_no_parallel_impl_test` — team-lead si to vezme sekvenčně po mém HOTOVO).

---

## §7 — Co zbývá / co testovat externally

- **Test-chrome R4** — ověřit:
  - Desktop: avatar vlevo, jméno + role pills vpravo vertikálně zarovnané se středem avataru
  - Mobile: avatar nahoře centrovaný (`flex-col`), info a actions pod ním
  - Stats bar: left-aligned
  - Tabs: left-aligned
  - Badges section: left-aligned (H2 "Odznaky" + pill list)
  - Owner (Jan Novák přihlášený): vidí "Upravit profil" button → `/muj-ucet/profil`
  - Anonymous: vidí "Kontaktovat" + "Sdílet profil"

---

## §8 — Git stav po commitu

```
On branch main
Recent commits:
 6f5a3e5 — fix: profile header use sm:items-start + wrap all info in flex-1 (task #53)   ← HOTFIX
 23780d1 — fix: revert profile to side-by-side layout + align stats left (task #53)
 4663973 — fix: profile header restructure + owner edit + polish (task #53)
 0d27c7b — chore: mark TASK-020 and TASK-042 as done + generate presentation PDFs
 c391a34 — fix: remove custom session cookie config causing login failure
```

**Diff k `4663973`:** 1 soubor, finální struktura = side-by-side + `sm:items-start` + wrap-all-in-info-flex-1.
**Žádné mimo-scope změny.**
