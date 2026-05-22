# Implementace P1-13: E2E testy — Playwright

**Status:** HOTOVO
**Datum:** 2026-04-05
**Implementoval:** implementator agent

---

## Provedene zmeny

### 1. `npm install -D @playwright/test`
- Nainstalovan test runner (core `playwright` uz byl v devDeps)

### 2. `playwright.config.ts` (NOVY)
- testDir: ./e2e
- fullyParallel, retries 2 v CI
- 2 projekty: Desktop Chrome + iPhone 14
- webServer: auto-start npm run dev (lokalne)
- trace on-first-retry, screenshot only-on-failure

### 3. E2E testy (7 souboru, 15 testu)

| Soubor | Testy | Pokryti |
|--------|-------|---------|
| `e2e/homepage.spec.ts` | 3 | Title, navigace, footer links |
| `e2e/catalog.spec.ts` | 2 | Nabidka, inzerce |
| `e2e/auth.spec.ts` | 3 | Login form, chybne udaje, seed admin |
| `e2e/listing.spec.ts` | 1 | Inzerce stranka |
| `e2e/contact.spec.ts` | 1 | Kontakt stranka |
| `e2e/shop.spec.ts` | 3 | Dily, shop katalog, kosik |
| `e2e/responsive.spec.ts` | 2 | Mobile viewport, tablet |

### 4. `package.json` (UPRAVENO)
- Pridano: `"test:e2e": "playwright test"`, `"test:e2e:ui": "playwright test --ui"`

### 5. `vitest.config.ts` (UPRAVENO)
- Pridan `'e2e'` do exclude array (aby Vitest nespoustel Playwright testy)

### 6. `.gitignore` (UPRAVENO)
- Pridany Playwright artefakty: /test-results/, /playwright-report/, /blob-report/, /playwright/.cache/

## Overeni

- [x] `@playwright/test` v devDependencies
- [x] `playwright.config.ts` existuje s 2 projekty
- [x] 7 test souboru v e2e/ (15 testu celkem)
- [x] `npm run test:e2e` je v scripts
- [x] Vitest ignoruje e2e/ adresar
- [x] Unit testy stale funguji (141/141)
- [x] Typecheck prochazi
- [x] .gitignore ma Playwright artefakty
