# Impl #28a — Fix broken footer links

**Task ID:** #47
**Plán:** `.claude-context/tasks/plan-task-28a-broken-footer-links.md`
**Datum:** 2026-04-06
**Commit:** (viz git log)

## Scope

4 broken linky v footerech, které byly zavedeny během #28 redesignu a vedly na 404. Fix bez vytváření nových stránek — jen remapping na existující routy + odstranění blogu mimo MVP + typo fix.

## Changes

| # | Link | Akce | Soubor(y) |
|---|------|------|-----------|
| 1 | `/stan-se-maklerem` → `/kariera` | Remap | `components/main/Footer.tsx`, `components/web/Footer.tsx` |
| 2 | `/blog` | **Odebráno** (mimo MVP) | `components/main/Footer.tsx`, `components/web/Footer.tsx` |
| 3 | `/faq` → `/jak-to-funguje` | Remap (label "FAQ" ponechán) | `components/common/FooterBase.tsx` |
| 4 | `/cookies` → `/zasady-cookies` | Typo fix (bonus) | `components/common/FooterBase.tsx` |

**Soubory (3):**
- `components/main/Footer.tsx` — 1 remap + 1 delete (řádky 14–15)
- `components/web/Footer.tsx` — dual-update (orphan pattern, stejné broken linky, plán 6.3)
- `components/common/FooterBase.tsx` — 2 path fixy (řádek 174 + 273)

## Verification

- **Grep check:** `components/` po fixu neobsahuje žádný z `"/stan-se-maklerem"`, `"/blog"`, `"/faq"`, `"/cookies"`.
- **`npm run build`** → ✅ green, všechny routy vygenerovány.
- **FooterBase je sdílený** — fix #3 a #4 se propaguje do main + shop + inzerce + marketplace footer wrapperů automaticky.

## Acceptance criteria (plán sekce 7)

- [x] `components/main/Footer.tsx` neobsahuje `/stan-se-maklerem` ani `/blog`
- [x] `components/web/Footer.tsx` neobsahuje `/stan-se-maklerem` ani `/blog` (dual-update)
- [x] `components/common/FooterBase.tsx` obsahuje `/jak-to-funguje` (ne `/faq`)
- [x] `components/common/FooterBase.tsx` obsahuje `/zasady-cookies` (ne `/cookies`)
- [x] Grep check: 0 matches
- [ ] Manuální click-through → ponecháno na test-chrome #42 re-run
- [ ] Test-chrome re-run → po commitu

## Odchylky od plánu

Žádné. Plán byl triviální (~6 řádků), implementace přesně podle sekce 4.

## Follow-up

- Smazání orphan `components/web/Footer.tsx` (mimo scope, cleanup task po 1 týdnu produkce bez incidentu)
- Test-chrome #42 re-run na ověření (team-lead koordinuje)
