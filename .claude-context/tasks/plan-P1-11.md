# Plan P1-11: Analytics (Plausible nebo GA4)

**Priorita:** P1
**Slozitost:** S
**Zavislosti:** ZADNE (pokud Plausible -- nevyzaduje cookie consent). ZAVISI na P0-04 pokud GA4.
**Batch:** 1

---

## Cil

Pridat privacy-friendly analytics pro mereni navstevnosti. Doporuceni: **Plausible** (nevyzaduje cookie consent, GDPR-friendly, lehky script ~1KB).

---

## Rozhodnuti: Plausible vs GA4

| Kriterium | Plausible | GA4 |
|-----------|-----------|-----|
| Cookie consent | NENI potreba | NUTNY |
| GDPR | Plne kompatibilni | Vyzaduje souhlas |
| Script velikost | ~1 KB | ~45 KB |
| Cena | 9 EUR/mesic (cloud) nebo self-hosted zdarma | Zdarma |
| Slozitost implementace | 1 script tag | Script + consent integration |
| Data ownership | Ano (self-hosted) | Google vlastni data |

**Doporuceni:** Plausible Cloud (9 EUR/mesic) -- nejrychlejsi implementace, GDPR bez cookie consent.

---

## Analyza aktualniho stavu

### Env promenne (uz existuji v .env.example)

`.env.example` (radky 72-75) jiz obsahuje:
```env
# --- Analytics (volitelne) ---
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
# nebo:
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
```

**NETREBA pridavat do .env.example** -- jiz existuji. Staci vyplnit v `.env.local`.

### Root layout: `app/layout.tsx`

Aktualn struktura (radky 66-78):
```tsx
export default function RootLayout({ children }: ...) {
  return (
    <html lang="cs">                                           // radek 72
      <body className={`${outfit.variable} font-sans ...`}>    // radek 73
        <AuthProvider>{children}</AuthProvider>                 // radek 74
      </body>                                                  // radek 75
    </html>                                                    // radek 76
  );                                                           // radek 77
}                                                              // radek 78
```

Analytics `<Script>` patri dovnitr `<body>`, mimo `<AuthProvider>` (neni interaktivni, nepotrebuje session).

---

## Kroky implementace (Plausible)

### Krok 1: Registrace Plausible (manualni)

1. https://plausible.io -- vytvorit ucet
2. Pridat domenu `carmakler.cz`
3. Ziskat script URL: `https://plausible.io/js/script.js`
4. Vyplnit `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=carmakler.cz` v `.env.local`

### Krok 2: Vytvorit Analytics komponentu

**Soubor:** `components/web/Analytics.tsx` (NOVY)

```tsx
import Script from "next/script";

export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  if (!domain) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
```

### Krok 3: Pridat do root layoutu

**Soubor:** `app/layout.tsx`

**Zmena 1 -- pridat import (za radek 4):**
```diff
 import { AuthProvider } from "@/components/providers/AuthProvider";
 import "./globals.css";
+import { Analytics } from "@/components/web/Analytics";
```

**Zmena 2 -- pridat komponentu do `<body>` (radek 73-74):**
```diff
-      <body className={`${outfit.variable} font-sans antialiased overflow-x-hidden`}>
-        <AuthProvider>{children}</AuthProvider>
+      <body className={`${outfit.variable} font-sans antialiased overflow-x-hidden`}>
+        <AuthProvider>{children}</AuthProvider>
+        <Analytics />
       </body>
```

**POZOR:** `<Analytics />` je mimo `<AuthProvider>` -- neni interaktivni a nepotrebuje session. Jde o `<Script>` tag, ktery se renderuje jako `<script>` v `<body>`.

### Krok 4: Vytvorit analytics helper (volitelne, pro custom eventy)

**Soubor:** `lib/analytics.ts` (NOVY)

```ts
/**
 * Plausible custom event tracking.
 * Pouziti: trackEvent("Listing Created", { type: "PRIVATE" });
 *
 * Funkce je safe — pokud Plausible neni nacteny, nic se nestane.
 */
export function trackEvent(name: string, props?: Record<string, string | number>) {
  if (typeof window !== "undefined" && (window as unknown as { plausible?: (name: string, opts?: { props: Record<string, string | number> }) => void }).plausible) {
    (window as unknown as { plausible: (name: string, opts?: { props: Record<string, string | number> }) => void }).plausible(name, props ? { props } : undefined);
  }
}
```

**Prikladove pouziti (v budoucnu):**
```ts
trackEvent("Listing Created", { type: "PRIVATE" });
trackEvent("Contact Form Submitted");
trackEvent("Watchdog Created");
trackEvent("Flip Investment", { amount: 150000 });
```

---

## Alternativa: GA4 (pokud se rozhodne misto Plausible)

Pokud se rozhodne pro GA4, je potreba **P0-04 (cookie consent)** jako zavislost.

### Krok A: GA4 komponenta

**Soubor:** `components/web/GoogleAnalytics.tsx` (NOVY — misto Analytics.tsx)

```tsx
"use client";

import Script from "next/script";
import { useCookieConsent } from "@/lib/hooks/useCookieConsent";

export function GoogleAnalytics() {
  const consent = useCookieConsent();
  const gaId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  // Nacist JEN pokud uzivatel souhlasil s analytickymi cookies
  if (!gaId || !consent?.analytics) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
```

**POZOR:** GA4 vyzaduje `consent?.analytics === true` -- zavisi na P0-04 (cookie consent).
GA4 komponenta pouziva `"use client"` kvuli `useCookieConsent` hooku.

### Krok B: Pridat do layoutu

Shodne jako krok 3, ale import `GoogleAnalytics` misto `Analytics`.

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `components/web/Analytics.tsx` | NOVY — Plausible script |
| `app/layout.tsx` | Pridat import (za radek 4) + `<Analytics />` za `</AuthProvider>` (radek 74) |
| `lib/analytics.ts` | NOVY (volitelne — custom eventy pro budouci pouziti) |
| `.env.local` | Vyplnit `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=carmakler.cz` |

**NEMEN:** `.env.example` — promenne `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` a `NEXT_PUBLIC_GA4_MEASUREMENT_ID` tam uz jsou (radky 73-75).

## Overeni

- [ ] Plausible script se nacita na vsech strankach (zkontrolovat v DevTools Network tab — `script.js` z plausible.io)
- [ ] Plausible dashboard ukazuje navstevy
- [ ] Bez `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` v env se script NENACITA (graceful — Analytics vraci null)
- [ ] Script pouziva `defer` a `strategy="afterInteractive"` (neblokuje LCP)
- [ ] Pokud GA4: script se nacita JEN po souhlasu s analytickymi cookies
- [ ] Build prochazi bez TypeScript chyb
- [ ] Import `Analytics` je z `@/components/web/Analytics` (spravna cesta)
