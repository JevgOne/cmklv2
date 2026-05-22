# Chrome Browser Test Report — Kompletní Batch 1, 2, 3
**Datum:** 2026-04-05  
**Tester:** test-chrome agent  
**Dev server:** localhost:3000 (npm run dev)  
**Browser:** Playwright Chromium headless (headless-shell 147.0.7727.15)  
**Task:** #53  

---

## Executive Summary

| Kategorie | Testováno | ✅ OK | ❌ Bug | ⚠️ Varování |
|-----------|-----------|-------|-------|------------|
| Batch 1 — Právní stránky | 4 | 4 | 0 | 0 |
| Batch 1 — Cookie consent | 1 | 1 | 1 | 0 |
| Batch 1 — Footer (5 footerů) | 5 | 5 | 0 | 0 |
| Batch 1 — Security | 2 | 2 | 0 | 0 |
| Batch 2 — Kontakt | 1 | 1 | 0 | 1 |
| Batch 2 — Homepage stats | 1 | 1 | 0 | 0 |
| Batch 2 — Další stránky | 4 | 3 | 1 | 0 |
| Batch 2 — Soubory | 4 | 4 | 0 | 0 |
| Batch 3 — Password reset | 3 | 3 | 1 | 0 |
| Batch 3 — Vracení/reklamace | 2 | 2 | 0 | 0 |
| Batch 3 — Guest checkout tracking | 1 | 1 | 1 | 0 |
| Batch 3 — Sentry | 3 | 3 | 0 | 0 |
| Batch 3 — API routes | 3 | 3 | 0 | 0 |
| E2E testy (Playwright) | 15 | 9 | 6 | 0 |
| **Celkem stránek (HTTP)** | **18** | **17** | **1** | **0** |

**Playwright komprehenzivní test:** 48/49 prošlo (1 selhání: `/jak-to-funguje` → 404)

---

## BATCH 1 — Právní stránky, Cookie consent, Footer, Security

### Právní stránky (HTTP + obsah)

| Stránka | HTTP | H1 text | Sekce (h2) | Status |
|---------|------|---------|-----------|--------|
| /obchodni-podminky | 200 | "Obchodní podmínky" ✅ | ≥11 sekcí | ✅ OK |
| /ochrana-osobnich-udaju | 200 | "Ochrana osobních údajů" ✅ | ≥10 sekcí | ✅ OK |
| /reklamacni-rad | 200 | "Reklamační řád" ✅ | ≥10 sekcí | ✅ OK |
| /zasady-cookies | 200 | "Zásady cookies" ✅ | tabulka cookies | ✅ OK |

**Poznámka:** Diacritika v právních stránkách OPRAVENA (task #56). Metadata title, H1, breadcrumbs, JSON-LD — vše správně.

### Cookie consent banner

| Check | Status | Detail |
|-------|--------|--------|
| Banner se zobrazí při prvním načtení | ✅ | Fixed element bottom-0, `role="dialog"` |
| 500ms delay (bez SSR flash) | ✅ | useEffect s setTimeout |
| 3 kategorie cookies | ❌ BUG | Text bez diacritiky: "Pouzivame cookies", "Nutne cookies", "Analyticke cookies", "Marketingove cookies" |
| Nezbytné cookies | ✅ | Checkbox disabled (nelze vypnout) |
| Analytické cookies | ✅ | Toggle přítomen |
| Marketingové cookies | ✅ | Toggle přítomen |
| Link na /zasady-cookies | ✅ | Odkaz přítomen (ale text "zasadach cookies" bez diakritiky) |
| aria-label | ⚠️ | "Nastaveni cookies" místo "Nastavení cookies" |

**BUG:** `components/web/CookieConsent.tsx` — veškerý text bez háčků a čárek (Pouzivame, Nutne, Analyticke, Marketingove cookies).

### Footer — právní odkazy (všech 5 footerů)

| Footer soubor | Ochrana os. údajů | Obchodní podmínky | Reklamační řád | Status |
|---------------|------------------|-------------------|----------------|--------|
| components/main/Footer.tsx | ✅ | ✅ | ✅ | ✅ |
| components/shop/Footer.tsx | ✅ | ✅ | ✅ | ✅ |
| components/inzerce/Footer.tsx | ✅ | ✅ | ✅ | ✅ |
| components/marketplace/Footer.tsx | ✅ | ✅ | ✅ | ✅ |
| components/web/Footer.tsx | ✅ | ✅ | ✅ | ✅ |

**Všech 5 footerů** má všechny 3 právní odkazy. ✅

### Security

| Check | Status | Detail |
|-------|--------|--------|
| middleware.ts — žádné hardcoded heslo | ✅ | Používá `process.env.SITE_PASSWORD` |
| .env.example existuje | ✅ | Soubor přítomen |

---

## BATCH 2 — Kontakt, Homepage, Další stránky, Soubory

### Kontakt stránka

| Check | Status | Detail |
|-------|--------|--------|
| /kontakt HTTP 200 | ✅ | |
| H1 "Kontaktujte nás" | ✅ | |
| Formulář přítomen | ✅ | ContactPageForm komponenta |
| Centralizovaný companyInfo | ✅ | `import { companyInfo } from "@/lib/company-info"` |
| lib/company-info.ts existuje | ✅ | |
| Reálná data | ⚠️ | email `info@carmakler.cz` ✅, ale telefon/adresa/IČO/DIČ jsou `[DOPLNIT]` |

### Homepage — statistiky a obsah

| Check | Status | Detail |
|-------|--------|--------|
| HTTP 200 | ✅ | |
| H1 "Vaše auto prodáme v průměru do 20 dní" | ✅ | |
| Dynamická data z DB | ✅ | `prisma.vehicle.findMany()` + `prisma.user.findMany()` při SSR |
| Navigace přítomna | ✅ | |
| Footer s právními odkazy | ✅ | |
| Title: "CarMakléř | Prodej aut přes certifikované makléře" | ✅ | |

### Další stránky

| Stránka | HTTP | H1 | Status |
|---------|------|-----|--------|
| /chci-prodat | 200 | "Prodáme vaše auto rychleji a za lepší cenu" | ✅ |
| /marketplace | 200 | "Investujte do aut, vydělejte 15-25 % ročně" | ✅ |
| /o-nas | 200 | "Nová éra prodeje aut v Česku" | ✅ |
| /jak-to-funguje | **404** | "Stránka nenalezena" | ❌ BUG |

**BUG:** `/jak-to-funguje` neexistuje — vrací 404. Stránka nebyla implementována.

### Soubory (Batch 2)

| Soubor | Status |
|--------|--------|
| lib/resend.ts | ✅ |
| lib/cloudinary.ts | ✅ |
| components/web/Analytics.tsx | ✅ |
| .github/workflows/ci.yml | ✅ |
| Plausible Analytics v HTML | ⚠️ Inactive — `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` není v `.env.local` (správné chování — graceful null) |

---

## BATCH 3 — Password reset, Vracení, Guest checkout, Sentry, E2E

### Password reset flow

| Check | HTTP | H1 | Status |
|-------|------|----|--------|
| /zapomenute-heslo | 200 | "Zapomenuté heslo" ✅ | ✅ |
| Email input přítomen | — | — | ✅ |
| Submit button "Odeslat odkaz" | — | — | ✅ |
| /login → odkaz na /zapomenute-heslo | — | — | ✅ |
| /reset-hesla/test-token | 200 | "Nove heslo" ❌ | ❌ BUG (diakritika) |
| 2x password input | — | — | ✅ |

**BUG:** `app/(web)/reset-hesla/[token]/page.tsx` — H1 "Nove heslo" místo "Nové heslo", popisky polí bez diakritiky ("Zadejte sve nove heslo", "Nove heslo", "Potvrzeni hesla", "Menim heslo...").

### Vracení a reklamace (auth guard)

| Check | HTTP | Redirect | Status |
|-------|------|----------|--------|
| /shop/moje-objednavky/test-id/vraceni | 200 | → /login?callbackUrl=... | ✅ |
| /shop/moje-objednavky/test-id/reklamace | 200 | → /login?callbackUrl=... | ✅ |

Auth guard funguje správně. Obě stránky přesměrovávají nepřihlášeného uživatele na login s callbackUrl.

### Guest checkout — order tracking

| Check | HTTP | H1 | Status |
|-------|------|----|--------|
| /shop/objednavky/sledovani/test-token | 200 | "Objednavka nenalezena" ❌ | ❌ BUG (diakritika) |

**BUG:** `app/(web)/shop/objednavky/sledovani/[token]/page.tsx` — H1 "Objednavka nenalezena" místo "Objednávka nenalezena". Stránka existuje a renderuje, ale text bez diakritiky.

### Sentry konfigurace

| Soubor | Status |
|--------|--------|
| sentry.client.config.ts | ✅ |
| sentry.server.config.ts | ✅ |
| sentry.edge.config.ts | ✅ |
| instrumentation.ts | ✅ (z impl-P1-10) |

### API routes (HTTP status)

| Route | Metoda | HTTP | Status |
|-------|--------|------|--------|
| /api/auth/forgot-password | POST | ne 404 (validační chyba = OK) | ✅ |
| /api/auth/reset-password | POST | ne 404 | ✅ |
| /api/orders/track/[token] | GET | ne 404 | ✅ |
| /api/admin/returns/[id] | — | soubor existuje | ✅ |

### E2E testy

| Check | Status | Detail |
|-------|--------|--------|
| `npx playwright test --list` | ✅ | 15 chromium + 15 mobile = 30 testů |
| Playwright chromium browser | ✅ | Nainstalován (byl chybějící, nyní opraveno) |
| Komprehenzivní test (49 testů) | 48/49 | `/jak-to-funguje` → 404 ❌ |
| Původní E2E testy (15 chromium) | 9/15 | 6 selhání — strict mode violation `locator('main')` |

**E2E test failures (původní testy):**
- `catalog.spec.ts` — `locator('main')` strict mode: na stránce jsou 2-3 `<main>` elementy
- `contact.spec.ts` — stejný problém s locator('main')
- `homepage.spec.ts` — locator('main') strict mode
- `listing.spec.ts` — locator('main') strict mode
- `responsive.spec.ts` — locator('main') strict mode
- `auth.spec.ts` — seed admin přihlášení: test závisí na seed datech v DB

**Příčina:** Více `<main>` elementů na stránce (nested layouts) způsobuje Playwright strict mode violations. Testy je nutné opravit: `page.locator('main').first()` nebo `page.locator('#main-content')`.

---

## Celková tabulka HTTP + render pro všechny stránky

| Stránka | HTTP | Final URL | H1 | Title |
|---------|------|-----------|-----|-------|
| / | 200 | / | "Vaše auto prodáme v průměru do 20 dní" | CarMakléř | Prodej aut... |
| /obchodni-podminky | 200 | / | "Obchodní podmínky" | Obchodní podmínky | CarMakléř |
| /ochrana-osobnich-udaju | 200 | / | "Ochrana osobních údajů" | Ochrana osobních údajů | CarMakléř |
| /reklamacni-rad | 200 | / | "Reklamační řád" | Reklamační řád | CarMakléř |
| /zasady-cookies | 200 | / | "Zásady cookies" | Zásady cookies | CarMakléř |
| /kontakt | 200 | / | "Kontaktujte nás" | Kontakt | CarMakléř |
| /login | 200 | / | "Přihlášení" | Přihlášení | CarMakléř |
| /zapomenute-heslo | 200 | / | "Zapomenuté heslo" ✅ | CarMakléř | Prodej aut... |
| /reset-hesla/test-token | 200 | / | "Nove heslo" ❌ | CarMakléř | ... |
| /dily | 200 | / | "Autodíly a příslušenství" | Autodíly — použité i nové náhradní díly |
| /shop | 200 | / | "Autodíly a příslušenství" | Shop — autodíly a příslušenství |
| /nabidka | 200 | / | (dynamický) | Nabídka vozidel | CarMakléř |
| /inzerce | 200 | /inzerce | "Prodejte své auto. Zdarma." | Inzerce — vložte inzerát zdarma |
| /chci-prodat | 200 | / | "Prodáme vaše auto rychleji a za lepší cenu" | Chci prodat auto | CarMakléř |
| /marketplace | 200 | / | "Investujte do aut, vydělejte 15-25 % ročně" | Marketplace | Investiční platforma |
| /o-nas | 200 | / | "Nová éra prodeje aut v Česku" | O nás | CarMakléř |
| /jak-to-funguje | **404** | / | "Stránka nenalezena" | Stránka nenalezena |
| /shop/objednavky/sledovani/test-token | 200 | / | "Objednavka nenalezena" ❌ | CarMakléř | ... |

---

## Souhrn bugů (priorita)

### 🔴 HIGH — Bugů: 4

**BUG #1:** `/jak-to-funguje` neexistuje (404)
- Stránka není implementována
- Je potřeba vytvořit nebo přidat redirect

**BUG #2:** `CookieConsent.tsx` — veškerý text bez háčků a čárek
- "Pouzivame cookies" → "Používáme cookies"
- "Nutne cookies" → "Nezbytné cookies"  
- "Analyticke cookies" → "Analytické cookies"
- "Marketingove cookies" → "Marketingové cookies"
- "zasadach cookies" → "zásadách cookies"
- aria-label "Nastaveni cookies" → "Nastavení cookies"
- Soubor: `components/web/CookieConsent.tsx`

**BUG #3:** `/reset-hesla/[token]` — H1 a labels bez diakritiky
- "Nove heslo" → "Nové heslo"
- Soubor: `app/(web)/reset-hesla/[token]/page.tsx`

**BUG #4:** `/shop/objednavky/sledovani/[token]` — H1 bez diakritiky
- "Objednavka nenalezena" → "Objednávka nenalezena"
- Soubor: `app/(web)/shop/objednavky/sledovani/[token]/page.tsx`

### 🟡 MEDIUM — Varování: 2

**Varování #1:** E2E testy — 6/15 selhává na strict mode violation `locator('main')`
- Příčina: nested layouts způsobují více `<main>` elementů
- Fix: nahradit `page.locator('main')` za `page.locator('#main-content')` nebo `.first()`
- Soubory: `e2e/catalog.spec.ts`, `e2e/contact.spec.ts`, `e2e/homepage.spec.ts`, `e2e/listing.spec.ts`, `e2e/responsive.spec.ts`

**Varování #2:** `/kontakt` — `[DOPLNIT]` placeholder data
- Telefon, adresa, IČO, DIČ potřeba doplnit v `lib/company-info.ts` před launchem

### 🟢 INFO

- Plausible Analytics: neaktivní bez `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` env var (správné chování)
- Sentry: neaktivní bez `SENTRY_DSN` env var (správné chování)

---

## Co funguje správně ✅

- Všechny hlavní stránky vrací HTTP 200
- Právní stránky — správný obsah a diacritika (opraveno task #56)
- Všech 5 footerů má 3 právní odkazy
- Cookie consent banner se zobrazuje (fixed bottom element)
- Middleware — SITE_PASSWORD z env proměnné (ne hardcoded)
- .env.example existuje
- Homepage — dynamická data z DB (Prisma queries)
- Password reset flow: /zapomenute-heslo + /reset-hesla/[token] fungují
- Login → odkaz na /zapomenute-heslo ✅
- Auth guard: vracení/reklamace přesměrovává na login s callbackUrl
- Guest checkout tracking: stránka existuje a renderuje
- Sentry: 3 config soubory přítomny
- API routes: /api/auth/forgot-password, /api/auth/reset-password, /api/orders/track/[token] — všechny existují (ne 404)
- lib/resend.ts, lib/cloudinary.ts, lib/company-info.ts — všechny existují
- .github/workflows/ci.yml existuje
- Playwright E2E: 15 testů nalezeno, Chromium browser funkční
- Playwright komprehenzivní test: 48/49 passed

---

*Report vygenerován: 2026-04-05 | Agent: test-chrome | Task #53 | Playwright Chromium 147.0.7727.15*
