# Implementace P1-11: Analytics (Plausible)

**Status:** HOTOVO
**Datum:** 2026-04-04

---

## Co bylo udelano

### 1. Vytvoreno: `components/web/Analytics.tsx` (NOVY)

Server Component (bez "use client") — renderuje Plausible `<Script>` tag.
- Cte `process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN`
- Pokud env neni nastavene, vraci `null` (graceful — zadny script se nenacita)
- Pouziva `strategy="afterInteractive"` a `defer` (neblokuje LCP)

### 2. Vytvoreno: `lib/analytics.ts` (NOVY)

Helper pro custom event tracking:
- `trackEvent(name, props?)` — volani `window.plausible()` pokud je nacteny
- Type-safe s TypeScript casting
- Safe — pokud Plausible neni nacteny, nic se nestane
- Pripraven pro budouci pouziti (Listing Created, Contact Form, Watchdog, atd.)

### 3. Upraven: `app/layout.tsx`

- Pridan import `Analytics` z `@/components/web/Analytics`
- Pridana `<Analytics />` komponenta za `</AuthProvider>` uvnitr `<body>`
- Analytics je mimo AuthProvider — nepotrebuje session, je to jen script tag

---

## Soubory

| Soubor | Zmena |
|--------|-------|
| `components/web/Analytics.tsx` | NOVY — Plausible script komponenta |
| `lib/analytics.ts` | NOVY — trackEvent helper pro custom eventy |
| `app/layout.tsx` | Import + `<Analytics />` za AuthProvider |

---

## Overeni

- [x] Analytics komponenta se renderuje jen kdyz `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` je nastavene
- [x] Bez env promenne — graceful null return, zadny script
- [x] Script pouziva `defer` a `strategy="afterInteractive"`
- [x] `<Analytics />` je mimo `<AuthProvider>` (nepotrebuje session)
- [x] `trackEvent` je type-safe a safe (nevolani pokud Plausible neni nacteny)
- [x] npm package `@plausible/tracker` NENI pridany — pouzivame primo script tag

## Poznamky

- Pro aktivaci: vyplnit `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=carmakler.cz` v `.env.local`
- Env promenna uz existuje v `.env.example` (radky 72-75)
- GA4 alternativa (popsana v planu) nebyla implementovana — Plausible je doporucena volba (GDPR bez cookie consent)
- Pokud bude pozadavek na GA4, je treba vytvorit `components/web/GoogleAnalytics.tsx` s `useCookieConsent` hookem (zavisi na P0-04)
