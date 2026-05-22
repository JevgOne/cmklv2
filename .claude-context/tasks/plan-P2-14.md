# Plan P2-14: Content Security Policy (CSP) Headers

**Priorita:** P2 (TOP 5 z 25 — Business Value 1/5, UX 1/5, Security 5/5 = 7/15)
**Slozitost:** M (2-3 hodiny)
**Zavislosti:** P1-10 (Sentry — potrebuje report-uri), P1-11 (Analytics — potrebuje script-src)
**Batch:** 4+

---

## Zduvodneni vyberu

**CSP je posledni chybejici security header.** Aktualne next.config.ts ma:
- `X-Frame-Options: DENY` — OK
- `X-Content-Type-Options: nosniff` — OK
- `Referrer-Policy: strict-origin-when-cross-origin` — OK
- `X-XSS-Protection: 1; mode=block` — OK (zastarale, ale nevadi)
- `Permissions-Policy: camera=(), microphone=()` — OK
- **Content-Security-Policy: CHYBI** — bez CSP je web zranitelny vuci XSS

CSP je nejucinnejsi obrana proti XSS utokum. Definuje odkud mohou byt nacteny skripty, styly, obrazky a dalsi zdroje.

---

## Analyza aktualniho stavu

### Existujici headers

**Soubor:** `next.config.ts` (radky 22-31):
```ts
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Permissions-Policy", value: "camera=(), microphone=()" },
    ],
  }];
},
```

### Externi zdroje v projektu

**Audit externich zdroju ktere CSP musi povolit:**

| Zdroj | Typ | Soubor/Pouziti |
|-------|-----|----------------|
| `res.cloudinary.com` | img-src | Obrazky vozidel, dilu, profilu |
| `fonts.googleapis.com` | style-src | Jen v design system HTML (ne v main app — pouziva next/font) |
| `fonts.gstatic.com` | font-src | Jen v design system HTML |
| `plausible.io` | script-src | Plausible analytics (plan P1-11) |
| `js.stripe.com` | script-src | Stripe.js (jen pokud se pouzije client-side) |
| `checkout.stripe.com` | frame-src | Stripe Checkout (redirect, ne iframe) |
| Sentry | connect-src | `*.ingest.sentry.io` (plan P1-10) |
| `api.resend.com` | connect-src | Server-only — neni treba v CSP |
| Inline styles | style-src | Next.js pouziva inline styles (global-error.tsx, framer-motion) |
| Inline scripts | script-src | Next.js hydrace, Serwist SW registrace |

### Next.js specificke CSP pozadavky

Next.js 15+ App Router vyzaduje:
- `script-src 'self' 'unsafe-inline'` — pro hydration skripty (nebo nonce)
- `style-src 'self' 'unsafe-inline'` — pro inline styles (Tailwind v4 injektuje do `<style>`)
- Nonce-based CSP je preferovany, ale vyzaduje middleware integraci

---

## Kroky implementace

### Pristup A: Static CSP header (jednodussi, bez nonce)

**Soubor:** `next.config.ts`

```diff
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Permissions-Policy", value: "camera=(), microphone=()" },
+         {
+           key: "Content-Security-Policy",
+           value: [
+             // Zakladni politika
+             "default-src 'self'",
+
+             // Skripty: self + inline (Next.js hydrace) + external analytics
+             "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io https://js.stripe.com",
+
+             // Styly: self + inline (Tailwind injection, framer-motion)
+             "style-src 'self' 'unsafe-inline'",
+
+             // Obrazky: self + Cloudinary + data: URIs (base64 previews)
+             "img-src 'self' https://res.cloudinary.com data: blob:",
+
+             // Fonty: self (next/font stahuji a serviruji lokalne)
+             "font-src 'self'",
+
+             // API/fetch: self + Sentry + Stripe
+             "connect-src 'self' https://*.ingest.sentry.io https://api.stripe.com https://plausible.io",
+
+             // Iframe: Stripe Checkout (pokud se pouzije embedded)
+             "frame-src 'self' https://checkout.stripe.com https://js.stripe.com",
+
+             // Media: self
+             "media-src 'self'",
+
+             // Object: none (zadne Flash/Java pluginy)
+             "object-src 'none'",
+
+             // Base URI: self (prevence <base> tag hijack)
+             "base-uri 'self'",
+
+             // Form action: self (prevence form hijack)
+             "form-action 'self'",
+
+             // Frame ancestors: none (ekvivalent X-Frame-Options: DENY)
+             "frame-ancestors 'none'",
+           ].join("; "),
+         },
        ],
      },
    ];
  },
```

**Pozn. k 'unsafe-inline' a 'unsafe-eval':**
- `'unsafe-inline'` je potreba pro Next.js hydration skripty a Tailwind inline styles
- `'unsafe-eval'` je potreba pro Next.js development mode a nektere Webpack transformace
- **V produkci** lze `'unsafe-eval'` odebrat a nahradit nonce-based CSP (Pristup B)
- Bez `'unsafe-inline'` by Next.js nefungoval bez nonce

### Pristup B: Nonce-based CSP (bezpecnejsi, slozitejsi)

**Preferovany pristup pro produkci** — eliminuje `'unsafe-inline'` pro skripty.

**Soubor:** `middleware.ts` — pridat CSP nonce generovani:

```ts
import { randomBytes } from "crypto";

// V middleware funkci, pred response:
const nonce = randomBytes(16).toString("base64");

const csp = [
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}' https://plausible.io https://js.stripe.com`,
  "style-src 'self' 'unsafe-inline'", // Inline styles musi zustat kvuli Tailwind
  "img-src 'self' https://res.cloudinary.com data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://*.ingest.sentry.io https://api.stripe.com https://plausible.io",
  "frame-src 'self' https://checkout.stripe.com https://js.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const requestHeaders = new Headers(request.headers);
requestHeaders.set("x-nonce", nonce);

const response = NextResponse.next({ request: { headers: requestHeaders } });
response.headers.set("Content-Security-Policy", csp);
```

**Soubor:** `app/layout.tsx` — precist nonce z headers:

```tsx
import { headers } from "next/headers";

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || "";

  return (
    <html lang="cs">
      <body nonce={nonce}>
        {/* Next.js automaticky prida nonce na inline skripty */}
        {children}
      </body>
    </html>
  );
}
```

**Pozn.:** Next.js 15+ podporuje nonce nativne pres `headers()` — skripty generovane frameworkem automaticky dostanou nonce atribut.

### Doporuceni: Zacit s Pristupem A, pak migrovat na B

1. **Faze 1:** Static CSP s `'unsafe-inline'` — okamzita ochrana proti vetsine XSS
2. **Faze 2:** Nonce-based CSP — eliminace `'unsafe-inline'` pro skripty

---

### Krok 2: CSP Report-Only mod pro testovani

**DULEZITE:** Pred nasazenim CSP v enforcement modu, testovat v report-only:

```diff
- { key: "Content-Security-Policy", value: csp },
+ { key: "Content-Security-Policy-Report-Only", value: csp + "; report-uri /api/csp-report" },
```

**Soubor:** `app/api/csp-report/route.ts` (NOVY)

```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const report = await request.json();
    // Logovat CSP poruseni — identifikovat co je treba povolit
    console.warn("CSP Violation:", JSON.stringify(report, null, 2));

    // Volitelne: poslat do Sentry
    // Sentry.captureMessage("CSP Violation", { extra: report });
  } catch {
    // Ignorovat malformed reporty
  }
  return NextResponse.json({ ok: true });
}
```

### Krok 3: Testovani a ladeni

**Postup:**
1. Nasadit s `Content-Security-Policy-Report-Only`
2. Projit vsechny stranky — kontrolovat browser konzoli na CSP warnings
3. Pridat chybejici zdroje do CSP
4. Po 1 tydnu bez poruseni: prepnout na enforcement (`Content-Security-Policy`)

**Bezne problemy a reseni:**

| Problem | Reseni |
|---------|--------|
| Next.js dev server nefunguje | Pridat `'unsafe-eval'` jen pro dev: `process.env.NODE_ENV === 'development'` |
| Inline event handlers (onClick atd.) | Nemeni — React pouziva delegovane event listenery |
| Google Fonts v design-system.html | To neni app stranka — ignorovat |
| Serwist SW | `worker-src 'self'` (pokud potreba) |
| base64 obrazky v ProfileForm | `img-src ... data:` (jiz zahrnuto) |
| Blob URL pro stazeni PDF | `img-src ... blob:` (jiz zahrnuto) |

### Krok 4: Produkci-only CSP (bez unsafe-eval)

**Soubor:** `next.config.ts`

```ts
const isDev = process.env.NODE_ENV === "development";

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://plausible.io https://js.stripe.com`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://res.cloudinary.com data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://*.ingest.sentry.io https://api.stripe.com https://plausible.io",
  "frame-src 'self' https://checkout.stripe.com https://js.stripe.com",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];
```

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena | Narocnost |
|--------|-------|-----------|
| `next.config.ts` | CSP header (Pristup A) | S |
| `app/api/csp-report/route.ts` | NOVY — CSP violation log | XS |
| `middleware.ts` | Nonce generovani (Pristup B, volitelne) | M |
| `app/layout.tsx` | Nonce prop na body (Pristup B, volitelne) | XS |

---

## Poradi implementace

1. **Faze 1 — Report-Only:** Pridat CSP-Report-Only header + report endpoint (1 den)
2. **Faze 2 — Ladeni:** Monitorovat reporty, opravit false positives (1 tyden)
3. **Faze 3 — Enforcement:** Prepnout na Content-Security-Policy (po overeni)
4. **Faze 4 — Nonce (volitelne):** Migrace na nonce-based CSP pro eliminaci unsafe-inline

---

## Overeni

- [ ] CSP header pritomen v HTTP response (check v browser DevTools → Network)
- [ ] Browser konzole: zadne CSP violation chyby na hlavnich strankach
- [ ] Cloudinary obrazky se zobrazuji (img-src)
- [ ] Stripe Checkout funguje (frame-src, script-src)
- [ ] Plausible analytics funguje (script-src, connect-src)
- [ ] Sentry reportuje chyby (connect-src)
- [ ] Service Worker se registruje (worker-src)
- [ ] Next.js hydrace funguje (script-src unsafe-inline)
- [ ] Tailwind styly se aplikuji (style-src unsafe-inline)
- [ ] CSP report endpoint prijima a loguje poruseni
- [ ] Dev server funguje (unsafe-eval povoleno v dev)
- [ ] Build prochazi
- [ ] securityheaders.com: A+ rating
