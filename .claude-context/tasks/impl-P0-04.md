# Implementace P0-04: Cookie consent banner

**Status:** HOTOVO
**Datum:** 2026-04-04
**Implementator:** Claude Agent

---

## Co bylo udelano

Implementovan GDPR cookie consent banner + stranka /zasady-cookies + utilitni hook pro cteni consentu.

### Vytvorene soubory

| Soubor | Popis |
|--------|-------|
| `components/web/CookieConsent.tsx` | "use client" banner s 3 tlacitky (Prijmout vse, Pouze nutne, Nastaveni) |
| `lib/hooks/useCookieConsent.ts` | Hook pro cteni aktualniho consentu z localStorage |
| `app/(web)/zasady-cookies/page.tsx` | Stranka s prehledem cookies, tabulka s badges |
| `app/(web)/zasady-cookies/loading.tsx` | Skeleton loading state |

### Upravene soubory

| Soubor | Zmena |
|--------|-------|
| `app/(web)/layout.tsx` | Pridan import CookieConsent + `<CookieConsent />` za CompareBar |
| `app/sitemap.ts` | Pridano `/zasady-cookies` do staticPages |

### CookieConsent banner

- 3 kategorie: Nutne (vzdy on, disabled checkbox), Analyticke, Marketingove
- 3 akce: "Prijmout vse", "Pouze nutne", "Nastaveni" (rozbali detaily) + "Ulozit nastaveni"
- Ulozeni do localStorage (klic `cookie_consent`) s verzovanim
- CustomEvent `cookie-consent-changed` pro reaktivni Analytics
- z-[100] nad vsim (CompareBar z-50)
- 500ms delay pro zamezeni hydration flash
- role="dialog" + aria-label pro accessibility
- Responzivni: plna sirka na mobilu, max-w-2xl na desktopu

### useCookieConsent hook

- Vraci `CookiePreferences | null` (null = jeste neudal souhlas)
- Automaticky reaguje na CustomEvent zmeny
- Umisteni v `lib/hooks/` vedle existujicich hooku

### Zasady cookies stranka

- Tabulka 8 cookies s barevnymi badges (sedy=Nutne, modry=Analyticke, fialovy=Marketingove)
- Sekce: Co jsou cookies, Kategorie, Prehled, Jak spravovat
- Odkaz na /ochrana-osobnich-udaju

## Overeni

- [x] CookieConsent komponenta vytvorena
- [x] Pridana do web layoutu za CompareBar
- [x] useCookieConsent hook vytvoren v lib/hooks/
- [x] Zasady cookies stranka s tabulkou
- [x] localStorage ulozeni s verzovanim
- [x] CustomEvent dispatch
- [x] z-[100] nad CompareBar
- [x] Accessibility (role, aria-label)
- [x] Pridano do sitemap.ts
