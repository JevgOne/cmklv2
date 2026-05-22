# Chrome Test — TASK-063 Hashtag Landing Pages Redesign

**Datum:** 2026-04-16
**Tester:** test-chrome agent
**Stav:** 4/5 PASS — 1 BLOCKER

---

## Test 1 — `/makleri/praha` redesign

| Check | Stav | Detail |
|-------|------|--------|
| Hero tmave pozadi (gray-900 gradient) | PASS | `bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900` |
| Oranzovy accent stripe dole | PASS | `h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400` |
| Statistiky s hodnotou 0 NEviditelne | **FAIL** | Subheadline zobrazuje "0 uspesnych prodeju" |
| CTA tlacitka kontrast na tmavem | PASS | `bg-orange-500` + `border-2 border-white/70` |
| Sort taby underline styl | PASS | `border-b-2` v BrokerGrid, ne filled pills |
| Broker karty stejne velke | PASS | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, zadny `col-span-2` |
| FAQ sekce zachovana | PASS | "Caste otazky" sekce pritomna |

### BLOCKER detail
**Soubor:** `lib/landing-copy.ts`, radek 65
**Problem:** `getHeroCopy()` pro CITY kategorii vlozi `${stats.totalSoldVehicles} uspesnych prodeju` do subheadline bez kontroly, zda je hodnota > 0.
**Viditelny text:** "Najdete overeneho maklere v Praze — 2 specialistu, 0 uspesnych prodeju."
**Pozn:** Hero chips (stat badges) v `LandingHero.tsx` radky 28-31 spravne filtruju nulove hodnoty. Chyba je jen v textovem subheadline z `landing-copy.ts`.

**Fix:** Podminene vynechat nulove statistiky ze subheadline textu.

---

## Test 2 — `/makleri/bmw`

| Check | Stav |
|-------|------|
| Stejny novy vizual | PASS |
| gray-900 gradient hero | PASS |
| Accent stripe | PASS |
| Underline sort taby | PASS |
| FAQ sekce | PASS |

---

## Test 3 — `/makleri` (hlavni seznam)

| Check | Stav |
|-------|------|
| Stranka se NEZMENILA | PASS |
| Vlastni inline hero ("Nasi certifikovani makleri") | PASS |
| LandingHero se nepouziva | PASS |

---

## Test 4 — Mobile responsive (`/makleri/praha`)

| Check | Stav | Detail |
|-------|------|--------|
| Hero citelny na mobilu | PASS | `text-3xl`, `flex-col`, `py-12` |
| Karty 1 sloupec | PASS | `grid-cols-1` (breakpoint sm:2, lg:3) |
| CTA tlacitka klikatelna | PASS | `px-4 py-2`, `flex-col sm:flex-row` |

---

## Test 5 — Console

| Check | Stav |
|-------|------|
| Zadne JS errors | PASS |
| Zadne 404 | PASS (15/15 assets 200) |

---

## Verdikt

**4/5 PASS**

1 blocker: Subheadline v hero ukazuje "0 uspesnych prodeju" pro CITY tagy s nulovymi prodeji. Oprava v `lib/landing-copy.ts` funkci `getHeroCopy()`.
