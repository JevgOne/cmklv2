# Test Chrome — TASK-036 unified profile + regression

Datum: 2026-04-16
Runner: Playwright v headed Chromium (viditelný browser)
Spec: `e2e/chrome-test-unified-profile.spec.ts`
Broker pro testy: `jan-novak-praha` (existuje v `prisma/seed.ts`)

## Sekce A — Unified profile (TASK-036)
| # | Test | Status | Notes |
|---|------|--------|-------|
| A1 | `/profil/jan-novak-praha` layout | PASS | `max-w-6xl`, cover gradient, avatar, hero, TagPill, "O makléři", "Specializace", "Kontakt", "Vozidla", "Badges/Odznaky", "Komentáře" — všech 11 kontrol passed |
| A2 | TagPill → `/makleri/[slug]` | PASS | Našel 5 tag linků, první `/makleri/bmw` → klik → URL změnila na `http://localhost:3000/makleri/bmw` |
| A3 | `/makler/[slug]` redirect → `/profil/[slug]` | PASS | Dev server používá meta-refresh (Next.js `permanentRedirect` v dev režimu = 200 + `<meta http-equiv="refresh">`). V produkci to bude 308. Finální URL: `/profil/jan-novak-praha` |
| A4 | Mobile 360×800 | PASS | `scrollW=360, clientW=360` — žádný horizontal overflow |

## Sekce B — Hashtag landingy (TASK-054)
| # | Test | Status | Notes |
|---|------|--------|-------|
| B1 | `/makleri/praha` | PASS | HTTP 200, slovo "praha" přítomno v obsahu |
| B2 | `/makleri/bmw` | PASS | HTTP 200 |
| B3 | `/makleri/elektromobily` | PASS | HTTP 200 |

## Sekce C — Vlny 1 & 2 smoke
| # | Test | Status | Notes |
|---|------|--------|-------|
| C1 | `/dodavatel/autovrakoviste-pilsen` → `/dily/vrakoviste/…` | PASS | Meta-refresh redirect, finální URL: `/dily/vrakoviste/autovrakoviste-pilsen` |
| C2 | `/prihlaseni` → `/login` | PASS | Meta-refresh redirect, finální URL: `/login` |
| C3 | `/jak-prodat-auto` FAQ | PASS | HTTP 200, "Často kladené otázky" / "FAQ" nalezeno |
| C4 | `/sluzby/*` FAQ | PASS | `/sluzby/financovani`, `/sluzby/pojisteni`, `/sluzby/proverka` všechny HTTP 200 + FAQ přítomen. `/sluzby` root neexistuje (pouze subpages) |

## Screenshots (paths)
- `/Users/zen/Projects/cmklv2/cmklv2/.claude-context/screenshots/A1-profile-desktop.png` (full page desktop)
- `/Users/zen/Projects/cmklv2/cmklv2/.claude-context/screenshots/A2-hashtag-landing.png`
- `/Users/zen/Projects/cmklv2/cmklv2/.claude-context/screenshots/A4-profile-mobile.png` (360×800)
- `/Users/zen/Projects/cmklv2/cmklv2/.claude-context/screenshots/B1-makleri-praha.png`
- `/Users/zen/Projects/cmklv2/cmklv2/.claude-context/screenshots/B2-makleri-bmw.png`
- `/Users/zen/Projects/cmklv2/cmklv2/.claude-context/screenshots/B3-makleri-elektromobily.png`
- `/Users/zen/Projects/cmklv2/cmklv2/.claude-context/screenshots/C3-jak-prodat-auto.png`
- `/Users/zen/Projects/cmklv2/cmklv2/.claude-context/screenshots/C4-sluzby-last.png` (proverka page)

## Bugs found
žádné blocking bugy.

Pozorování (ne bug):
- Next.js dev server (`npm run dev` / turbopack) renderuje `permanentRedirect()` jako HTTP 200 s `<meta http-equiv="refresh">` místo skutečného 308. V produkci (`next start`) je redirect skutečný 308 HTTP status. Test curl -I v dev tedy vrátí 200 — není to chyba kódu, jen Next.js dev chování.

## Verdikt
ALL PASS — 11/11 testů prošlo v headed Chromium. TASK-036 (unified profile) plus Vlna 1/2 regrese plus TASK-054 landingy fungují správně. Žádné blokující bugy.
