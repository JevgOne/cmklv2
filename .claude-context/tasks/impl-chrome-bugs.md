# Implementace: Fix 4 bugy z Chrome testu + E2E test fix

**Status:** HOTOVO
**Datum:** 2026-04-05
**Implementoval:** implementator agent

---

## Provedené změny

### BUG #1 (HIGH): /jak-to-funguje → 404
- VYTVOŘENO: `app/(web)/jak-to-funguje/page.tsx`
- Landing page s 3 sekcemi: Prodej přes makléře (4 kroky), Nákup auta (3 kroky), E-shop autodíly (3 kroky)
- Metadata, OG, JSON-LD, breadcrumbs, ISR (revalidate 3600)
- POZOR: Neobsahuje zmínku o výkupu vozidel (Carmakler nedělá výkup)

### BUG #2 (HIGH): CookieConsent.tsx — diacritika
- "Pouzivame cookies" → "Používáme cookies"
- "Nutne cookies" → "Nutné cookies"
- "Analyticke cookies" → "Analytické cookies"
- "Marketingove cookies" → "Marketingové cookies"
- "zasadach cookies" → "zásadách cookies"
- aria-label "Nastaveni cookies" → "Nastavení cookies"
- Tlačítka: "Prijmout vse" → "Přijmout vše", "Pouze nutne" → "Pouze nutné"
- "Nastaveni" → "Nastavení", "Ulozit nastaveni" → "Uložit nastavení"
- Popisy: správné fungování, analýza návštěvnosti, přihlášení, košík, cílená reklama

### BUG #3 (HIGH): reset-hesla/[token]/page.tsx — diacritika
- H1: "Nove heslo" → "Nové heslo"
- Label: "Potvrzeni hesla" → "Potvrzení hesla"
- + 10 dalších oprav: error messages, success texts, placeholders, links, buttons

### BUG #4 (HIGH): shop/objednavky/sledovani/[token]/page.tsx — diacritika
- H1: "Objednavka nenalezena" → "Objednávka nenalezena"
- H1: "Sledovani objednavky" → "Sledování objednávky"
- + 12 dalších oprav: error messages, loading text, status badges, info labels, CTA

### VAROVÁNÍ: E2E testy — nested `main` element fix
- 7 spec souborů: `locator('main')` → `locator('#main-content')`
- Soubory: homepage, catalog, listing, shop, contact, responsive, comprehensive-batch-test

## Ověření

- [x] Build: PASS (jak-to-funguje v routách)
- [x] Testy: 141/141 PASS
- [x] /jak-to-funguje stránka vytvořena
- [x] CookieConsent plná diacritika
- [x] reset-hesla plná diacritika
- [x] sledovani plná diacritika
- [x] E2E testy opraveny na #main-content
