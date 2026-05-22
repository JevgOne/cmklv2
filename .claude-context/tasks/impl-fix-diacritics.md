# Implementace: Fix chybějící diakritiky v právních stránkách

**Status:** HOTOVO
**Datum:** 2026-04-05
**Implementoval:** implementator agent

---

## Provedené změny

### 1. obchodni-podminky/page.tsx
- metadata description: "Podminky pro nakup autodilu, inzertni sluzby, maklerske sluzby a investicni marketplace" → "Podmínky pro nákup autodílů, inzertní služby, makléřské služby a investiční marketplace"
- OG description: "e-shop s autodily, inzerce vozidel, maklerske sluzby" → "e-shop s autodíly, inzerce vozidel, makléřské služby"
- Breadcrumb: "Domu" → "Domů"

### 2. ochrana-osobnich-udaju/page.tsx
- metadata description: "Informace o zpracovani osobnich udaju na platforme CarMakler dle GDPR a zakona 110/2019 Sb." → s diakritikou
- OG description: "Zasady ochrany osobnich udaju platformy CarMakler — spravce, ucely zpracovani, prava subjektu." → s diakritikou
- JSON-LD description: "Zasady ochrany osobnich udaju platformy CarMakler dle GDPR" → s diakritikou
- Breadcrumb: "Domu" → "Domů"

### 3. reklamacni-rad/page.tsx
- metadata description: "Zarucni doby, uplatneni reklamace, odstoupeni od smlouvy, mimosoudni reseni sporu." → s diakritikou
- OG description: "e-shopu s autodily CarMakler — zarucni doby, postup reklamace, prava spotrebitele." → s diakritikou
- Breadcrumb: "Domu" → "Domů"

### 4. zasady-cookies/page.tsx
- metadata description: "Informace o pouzivani cookies na platforme CarMakler. Prehled cookies, ucely a zpusob spravy." → s diakritikou
- OG description: "Informace o pouzivani cookies na platforme CarMakler." → s diakritikou
- Breadcrumb: "Domu" → "Domů"

### 5. zapomenute-heslo/page.tsx
- Subtitle: "Zadejte svuj email a poslem vam..." → "Zadejte svůj email a pošleme vám..."
- Error messages (2x): "Doslo k chybe. Zkuste to prosim znovu." → "Došlo k chybě. Zkuste to prosím znovu."
- H2: "Zkontrolujte svuj email" → "Zkontrolujte svůj email"
- Success text: "Pokud ucet s timto emailem existuje..." → "Pokud účet s tímto emailem existuje..."
- Links (2x): "Zpet na prihlaseni" → "Zpět na přihlášení"
- Button: "Odesilam..." → "Odesílám..."

## Ověření

- [x] Build: PASS
- [x] Testy: 141/141 PASS
- [x] Všechny metadata description s diakritikou
- [x] Všechny OG description s diakritikou
- [x] Všechny JSON-LD description s diakritikou
- [x] Všechny breadcrumbs "Domů" (ne "Domu")
- [x] H1/H2 titulky s diakritikou
- [x] UI texty zapomenuté heslo s diakritikou
