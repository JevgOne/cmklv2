# Plan P2-02: CSP headers + HSTS — bezpecnostni hlavicky

**Priorita:** P2 (TOP 5 pro launch)
**Slozitost:** S
**Zavislosti:** zadne
**Duvod vyberu:** Bezpecnost — CSP je nejucinnejsi ochrana proti XSS. Bez CSP muze utocnik injektovat libovolny skript. HSTS vynucuje HTTPS.

---

## Cil

Implementovat Content Security Policy a Strict-Transport-Security hlavicky. Aktualne web ma 5 z 7 kritickych bezpecnostnich hlavicek — chybi CSP a HSTS.

---

## Analyza aktualniho stavu

### Existujici hlavicky v next.config.ts (radky 21-34)

```ts
headers: () => [{
  source: "/(.*)",
  headers: [
    { key: "X-Frame-Options", value: "DENY" },              // OK
    { key: "X-Content-Type-Options", value: "nosniff" },     // OK
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, // OK
    { key: "X-XSS-Protection", value: "1; mode=block" },    // OK (deprecated ale neuskodi)
    { key: "Permissions-Policy", value: "camera=(), microphone=()" }, // OK
  ],
}]
```

### CHYBI: Content-Security-Policy

Bez CSP muze XSS utocnik:
- Injektovat `<script>` tag
- Exfiltrovat cookies, session tokeny
- Zobrazit phishingovy formular

### CHYBI: Strict-Transport-Security

Bez HSTS muze MITM utocnik:
- Presmerovat na HTTP verzi
- Odposlouchavat traffic

### Externi domeny pouzivane v aplikaci

| Domena | Ucel | Typ |
|--------|------|-----|
| `plausible.io` | Analytics skript | script-src |
| `res.cloudinary.com` | Obrazky | img-src |
| `images.unsplash.com` | Hero obrazek | img-src |
| `api.cloudinary.com` | Upload API | connect-src |
| `checkout.stripe.com` | Platebni formular (redirect) | — (ne iframe) |
| `fonts.gstatic.com` | Google Fonts (next/font) | font-src (automaticky) |
| `ares.gov.cz` | ARES API | connect-src (server-only) |
| `api.cebia.cz` | Cebia API | connect-src (server-only) |

### Inline obsah

- **JSON-LD**: `dangerouslySetInnerHTML` pro `application/ld+json` v `Breadcrumbs.tsx`, `VehicleLandingPage.tsx` — bezpecne (data, ne executable)
- **Plausible**: `Script` komponenta s `strategy="afterInteractive"` — externi skript
- **Zadne inline skripty ani styly** — Tailwind generuje CSS soubory, ne inline

### Next.js specificke skripty

Next.js injectuje inline skripty pro:
- `__NEXT_DATA__` (data pro hydrataci)
- Chunking a lazy loading

Tyto vyzaduji `'unsafe-inline'` nebo nonce v `script-src`. Next.js 15 podporuje nonce pres `experimental.nextScriptWorker` nebo `nonce` prop na `<Script>`.

---

## Kroky implementace

### Krok 1: Pridat CSP hlavicku do next.config.ts

**Soubor:** `next.config.ts`

```ts
// CSP direktivy
const cspDirectives = [
  // Zakladni
  "default-src 'self'",

  // Skripty — self + Plausible + Next.js inline
  "script-src 'self' 'unsafe-inline' https://plausible.io",

  // Styly — self + unsafe-inline (Tailwind runtime)
  "style-src 'self' 'unsafe-inline'",

  // Obrazky — self + Cloudinary + Unsplash + data URI (base64 nahledy)
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",

  // Fonty — self (next/font stahne lokalne)
  "font-src 'self'",

  // API pripojeni — self + Cloudinary upload + Plausible events
  "connect-src 'self' https://api.cloudinary.com https://plausible.io",

  // Frames — none (zadne iframe)
  "frame-src 'none'",

  // Objekty — none (zadne Flash/Java)
  "object-src 'none'",

  // Zakladna — self
  "base-uri 'self'",

  // Formularove akce — self
  "form-action 'self'",

  // Frame ancestors — none (shodne s X-Frame-Options DENY)
  "frame-ancestors 'none'",
];

const ContentSecurityPolicy = cspDirectives.join("; ");
```

Pridat do hlavicek:

```diff
 headers: [
   { key: "X-Frame-Options", value: "DENY" },
   { key: "X-Content-Type-Options", value: "nosniff" },
   { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
   { key: "X-XSS-Protection", value: "1; mode=block" },
   { key: "Permissions-Policy", value: "camera=(), microphone=()" },
+  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
+  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
 ],
```

### Krok 2: Overit kompatibilitu s Next.js

**Potencialni problemy:**

1. **Next.js inline skripty:** `'unsafe-inline'` v `script-src` je nutne pro Next.js hydrataci. Idealne by se melo pouzit nonce, ale to vyzaduje middleware zmeny. Pro MVP je `'unsafe-inline'` akceptovatelne — stale blokuje externi utocnicky skripty.

2. **Plausible:** Externi skript z `plausible.io` — explicitne povoleno.

3. **Stripe Checkout:** Pouziva redirect (ne iframe) — nepotrebuje `frame-src`.

4. **Tailwind CSS:** Generuje externi CSS soubory — `'self'` staci. Ale Next.js muze injectovat inline styly pro optimalizaci — `'unsafe-inline'` v `style-src` je nutne.

### Krok 3: Pridat Stripe checkout domenu (pokud P2-01 zavede platby)

Po implementaci Stripe plateb pro e-shop, pokud se pouzije Stripe.js na klientu:

```diff
-"script-src 'self' 'unsafe-inline' https://plausible.io",
+"script-src 'self' 'unsafe-inline' https://plausible.io https://js.stripe.com",
+"frame-src https://js.stripe.com https://hooks.stripe.com",
+"connect-src 'self' https://api.cloudinary.com https://plausible.io https://api.stripe.com",
```

Pozn.: Aktualne Stripe pouziva server-side Checkout session s redirect — NE klientsky JS. Pokud zustane redirect, Stripe domeny NEJSOU potreba.

### Krok 4: Report-Only mode pro testovani

Pred ostrym nasazenim pouzit `Content-Security-Policy-Report-Only` misto `Content-Security-Policy`:

```ts
// Testovaci faze — pouze reportuje, neblokuje:
{ key: "Content-Security-Policy-Report-Only", value: ContentSecurityPolicy },
```

Po overeni ze nic neni blokovano, prepnout na ostry `Content-Security-Policy`.

### Krok 5: Pridat report-uri (volitelne)

Pro monitoring CSP poruseni pridat reporting endpoint:

```diff
 // Pridat na konec CSP:
+"report-uri /api/csp-report",
+"report-to csp-endpoint",
```

A vytvorit jednoduchy endpoint `app/api/csp-report/route.ts` ktery loguje poruseni.

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `next.config.ts` | Pridat CSP a HSTS hlavicky |
| `app/api/csp-report/route.ts` | VOLITELNE — endpoint pro CSP report logging |

## Bezpecnostni poznamky

1. **`'unsafe-inline'` v script-src** — nutne pro Next.js. Oslabuje CSP, ale stale blokuje externi skripty z nepovolených domen. Pro budouci zlepseni implementovat nonce.
2. **`'unsafe-inline'` v style-src** — nutne pro Next.js inline styly. Bezpecnostni riziko je nizke (CSS injection je mene nebezpecne nez JS).
3. **HSTS preload** — registrace na hstspreload.org az po overeni ze HTTPS funguje spravne na vsech subdomenach.
4. **frame-ancestors 'none'** — duplicitni s X-Frame-Options DENY, ale CSP ma vyssi prioritu.

## Overeni

- [ ] CSP hlavicka je pritomna v HTTP response (DevTools → Network → Response Headers)
- [ ] HSTS hlavicka je pritomna
- [ ] Web funguje bez CSP erroru v konzoli
- [ ] Plausible analytics se nacitaji
- [ ] Obrazky z Cloudinary a Unsplash se zobrazuji
- [ ] JSON-LD v Breadcrumbs funguje
- [ ] Login/registrace formulare funguji
- [ ] Stripe platby funguji (pokud P2-01 implementovano)
- [ ] Console neobsahuje CSP violation errory
- [ ] Build prochazi
