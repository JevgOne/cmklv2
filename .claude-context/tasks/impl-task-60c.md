# Impl #60c — FIX registrace rozcestník přidat tile „Dodavatel dílů" (BUG #3)

**Task ID:** #63
**Plán:** `.claude-context/tasks/plan-task-60.md` sekce „BUG #3"
**Datum:** 2026-04-06
**Commit:** (viz git log)

## Problem

Hlavní registrační stránka `/registrace` (`app/(web)/registrace/page.tsx`) nabízela pouze 2 typy účtu (BUYER, ADVERTISER). Cesta k vrakovišti (`/registrace/dodavatel`) **nebyla nikde linkována** z hlavního rozcestníku. Uživatel který chtěl zaregistrovat vrakoviště neměl jak se k formuláři dostat — musel by URL znát zpaměti.

## Fix

### `app/(web)/registrace/page.tsx`

Přidána nová sekce **„Jiný typ účtu"** pod existující registrační kartu (před `</div>` wrapperu). Obsahuje 1 dlaždici typu `<Link href="/registrace/dodavatel">` s:

- Ikonou (klíč → tools)
- Titulkem „Dodavatel dílů (vrakoviště)"
- Popiskem „Prodáváte použité díly z vrakoviště nebo nové aftermarket díly? Registrujte se jako dodavatel a spravujte nabídku v PWA."
- Šipkou vpravo (chevron right)
- Hover state (orange-50 background, orange-300 border, orange-700 title)

Vizuální styl matchuje existující `rounded-2xl border border-gray-200 bg-white shadow-card` použitý v hlavní registrační kartě.

### Routing decision

Linkuje na `/registrace/dodavatel` (existující folder). Tento path POSTuje na `/api/auth/register/partner` endpoint (zjištěno grep `app/(web)/registrace/dodavatel/page.tsx:115`), takže funkčně vytváří `PARTNER_VRAKOVISTE` roli — což je správně po fixu BUG #1 (#61) middleware whitelistu.

Plán v sekci 11.1 #2 flagoval otevřenou otázku „Otevřená vs. invitation registrace pro vrakoviště? — `/registrace/dodavatel` vs `/registrace/partner`". Použil jsem `/registrace/dodavatel` protože:
1. Sémanticky čistší URL pro UX
2. Existující dedikovaný formulář s ARES IČO lookup
3. Per task assignment od team-leada explicitně „linking to `/registrace/dodavatel`"

`/registrace/partner?type=VRAKOVISTE` zůstává funkční (z plánu sekce 6.2 B) — jen není primární vstupní cesta z hlavního rozcestníku.

## Verifikace

- ✅ `npx tsc --noEmit` — clean
- ✅ `npx eslint app/(web)/registrace/page.tsx` — clean (0 warnings, 0 errors)
- ✅ Per-file scope — pouze 1 soubor, ~50 řádků přidáno

## Acceptance criteria (z plánu BUG #3 + sekce 10)

- [x] `/registrace` rozcestník obsahuje tile „Dodavatel dílů"
- [x] Tile linkuje na funkční registrační formulář (`/registrace/dodavatel`)
- [x] Vizuální konzistence s rest of registrační stránkou (orange brand, shadow-card, rounded-2xl)
- [x] tsc/lint clean

## Odchylky od plánu

- Plán v sekci 11.1 #1 také flagoval „Backoffice approval flow pro PARTNER_VRAKOVISTE" jako open issue. Tohle není fixováno v této task — registrovaný PARTNER_VRAKOVISTE má status `PENDING` a bez admin approve UI nemůže být aktivován. Out of scope BUG #3.
- Použil jsem 1 tile místo více. Plán explicitně mluví jen o „Dodavatel dílů". Ostatní role (BROKER) jsou invitation-only per design (řádek 90 plánu) takže nepatří do open rozcestníku.

## Files changed (1)

- `app/(web)/registrace/page.tsx` — +52 řádků (nová sekce „Jiný typ účtu" s Link tile)

## Risks

| Riziko | Severity | Notes |
|---|---|---|
| Regresní risk | None | Pure additive — žádné existující chování se nemění |
| Backoffice approval pipeline | Open issue | PARTNER_VRAKOVISTE registrace produkuje status PENDING; bez admin UI nelze aktivovat. Plán flag 11.1 #1, mimo scope této task. |
| Prázdná dokumentace dodavatel flow | Low | `/registrace/dodavatel` form má ARES IČO lookup, validaci, atd. — ale nikde nenavádí uživatele co se po registraci stane. UX follow-up. |

## Follow-up (mimo scope)

- Backoffice `/admin/partneri` UI pro approve PENDING PARTNER_VRAKOVISTE (plán 11.1 #1, 14.2 follow-up)
- Vyřešit otevřenou otázku `/registrace/dodavatel` vs `/registrace/partner` (deprecate jeden z nich)
- Welcome onboarding screen pro nově registrovaného vrakoviště dodavatele
