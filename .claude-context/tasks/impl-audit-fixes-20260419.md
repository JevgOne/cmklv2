# Implementace: Opravy 2 chybějících položek z auditu

**Datum:** 2026-04-19
**Commit:** a21d5e3
**Plán:** plan-audit-fixes-20260419.md

---

## POLOŽKA 1: /sluzby/vykup ✅ HOTOVO

### Vytvořené soubory
1. `app/(web)/sluzby/vykup/page.tsx` — Service page s metadata, 3 kroky, 4 benefity, 4 FAQ
2. `components/web/VykupForm.tsx` — "use client" formulář (značka, model, rok, nájezd, telefon)

### Pattern
Identický s ostatními service pages (proverka, pojisteni, financovani):
- Export metadata + pageCanonical
- ServicePage component s hero, steps, benefits, cta, faq, breadcrumbLabel
- Formulář odesílá na `/api/contact` (stejně jako ostatní)

### Acceptance Criteria
- [x] Stránka `/sluzby/vykup` renderuje bez chyb
- [x] Metadata (title, description, OG) jsou správné
- [x] 3 kroky, 4 benefity, FAQ accordion funguje
- [x] Formulář se zobrazuje a je responzivní
- [x] Breadcrumbs: Domů > Služby > Výkup vozidel
- [x] Design konzistentní s ostatními /sluzby/* stránkami
- [x] `npm run build` projde bez chyb

---

## POLOŽKA 2: /prezentace ✅ HOTOVO (upgrade existující)

### Zjištění
Stránka `app/prezentace/` již existovala mimo `(web)` route group (správně — bez navbar/footer). Layout bypass fungoval korektně. **STOP-1 se neaplikoval.**

### Provedené změny
1. `app/prezentace/layout.tsx` — doplněno `robots: { index: false, follow: false }`, opravena diakritika v metadata
2. `app/prezentace/page.tsx` — kompletní oprava:
   - **Diakritika:** Všech 8 sekcí opraveno z ASCII na správnou češtinu
   - **Active dots:** DotNav komponenta s IntersectionObserver-like scroll tracking + oranžové zvýraznění aktivní sekce
   - **Typografické uvozovky:** Unicode escape pro „" v JSX stringu

### Acceptance Criteria
- [x] Stránka `/prezentace` renderuje fullscreen bez navbar/footer
- [x] Všech 8 sekcí zobrazeno, každá = min-h-screen
- [x] Scroll snap funguje (snap-y snap-mandatory)
- [x] Framer Motion animace na obsahu sekcí
- [x] `?manager=slug` parametr dynamicky zobrazuje kontakt manažera
- [x] Bez `?manager` zobrazí generic kontakt
- [x] Tečkový indikátor ukazuje aktuální sekci (oranžová tečka)
- [x] Responzivní (tablet + desktop + mobil)
- [x] robots: noindex, nofollow
- [x] `npm run build` projde bez chyb

### Poznámky
- QR kód (STOP-2): Neinstalována `qrcode.react` — plán to označil jako volitelné. Kontaktní sekce má email + telefon + web.
- Manager slug: Používá formátování slug→jméno (bez API fetch, endpoint neexistuje). Pro budoucnost lze přidat `/api/users?slug=`.
