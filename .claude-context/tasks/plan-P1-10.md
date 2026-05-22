# Plan P1-10: Sentry error tracking

**Priorita:** P1
**Slozitost:** M
**Zavislosti:** ZADNE
**Batch:** 3

---

## Cil

Pridat Sentry pro zachytavani a sledovani chyb na klientu i serveru. Aktualne chyby konci jen v konzoli — zadny alerting, zadny dashboard. `global-error.tsx` uz existuje ale bez Sentry integrace.

---

## Analyza aktualniho stavu

### Env promenne — uz pripraveny

`.env.example` (radky 68-70):
```env
# --- Sentry (error tracking — volitelne) ---
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

### global-error.tsx — uz existuje

`app/global-error.tsx` (57 radku) — basic error boundary s inline styly a "Zkusit znovu" tlacitkem. Sentry se do nej integruje pro captureException.

### Existujici error.tsx soubory

Projekt ma desitky `error.tsx` souboru v route skupinach:
- `app/(web)/error.tsx`
- `app/(web)/shop/katalog/error.tsx`
- `app/(web)/shop/kosik/error.tsx`
- atd.

Sentry se propaguje do VSECH error boundaries automaticky pres instrumentation.

### next.config.ts

```ts
const nextConfig: NextConfig = {
  turbopack: {},
  images: { remotePatterns: [...] },
  async headers() { return [...]; },
};
export default withSerwist(nextConfig);
```

Sentry webpack plugin se prida pres `withSentryConfig` wrapper.

### Package.json

`@sentry/nextjs` NENI nainstalovan.

---

## Kroky implementace

### Krok 1: Nainstalovat Sentry

```bash
npm install @sentry/nextjs
```

### Krok 2: Vytvorit `sentry.client.config.ts`

**Soubor:** `sentry.client.config.ts` (NOVY, v rootu projektu)

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Procentualni sample rate pro performance (0.0 az 1.0)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay pro reprodukci chyb (volitelne, zvysuje cost)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0,

  // Filtr: ignorovat bezne nekriticke chyby
  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error promise rejection",
    "AbortError",
    "TypeError: Failed to fetch",
    "TypeError: NetworkError",
    "TypeError: Load failed",
  ],

  // Environment tag
  environment: process.env.NODE_ENV,

  // Pouze v produkci
  enabled: process.env.NODE_ENV === "production",
});
```

### Krok 3: Vytvorit `sentry.server.config.ts`

**Soubor:** `sentry.server.config.ts` (NOVY, v rootu projektu)

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
});
```

### Krok 4: Vytvorit `sentry.edge.config.ts`

**Soubor:** `sentry.edge.config.ts` (NOVY, v rootu projektu)

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
});
```

### Krok 5: Vytvorit instrumentation file

**Soubor:** `instrumentation.ts` (NOVY, v rootu projektu)

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = async (
  err: { digest?: string } & Error,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: { routerKind: string; routePath: string; routeType: string; renderSource: string }
) => {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
};
```

### Krok 6: Aktualizovat `next.config.ts`

**Soubor:** `next.config.ts`

```diff
 import type { NextConfig } from "next";
 import withSerwistInit from "@serwist/next";
+import { withSentryConfig } from "@sentry/nextjs";

 const withSerwist = withSerwistInit({
   swSrc: "app/sw.ts",
   swDest: "public/sw.js",
   disable: process.env.NODE_ENV === "development",
 });

 const nextConfig: NextConfig = {
   turbopack: {},
   images: { ... },
   async headers() { ... },
 };

-export default withSerwist(nextConfig);
+export default withSentryConfig(withSerwist(nextConfig), {
+  // Sentry webpack plugin options
+  org: process.env.SENTRY_ORG,
+  project: process.env.SENTRY_PROJECT,
+  authToken: process.env.SENTRY_AUTH_TOKEN,
+
+  // Tichy rezim: nevyhazovat chyby pokud Sentry neni nakonfigurovano
+  silent: !process.env.SENTRY_AUTH_TOKEN,
+
+  // Upload source maps (jen v produkci s auth tokenem)
+  sourcemaps: {
+    disable: !process.env.SENTRY_AUTH_TOKEN,
+  },
+
+  // Automaticka instrumentace
+  autoInstrumentServerFunctions: true,
+  autoInstrumentMiddleware: true,
+  autoInstrumentAppDirectory: true,
+});
```

### Krok 7: Aktualizovat `global-error.tsx`

**Soubor:** `app/global-error.tsx`

Pridat Sentry reporting:

```diff
 "use client";

+import * as Sentry from "@sentry/nextjs";
+import { useEffect } from "react";
+
 export default function GlobalError({
+  error,
   reset,
 }: {
   error: Error & { digest?: string };
   reset: () => void;
 }) {
+  useEffect(() => {
+    Sentry.captureException(error);
+  }, [error]);
+
   return (
     <html lang="cs">
       <body>
         {/* existujici JSX zustava beze zmeny */}
       </body>
     </html>
   );
 }
```

### Krok 8: Aktualizovat env promenne

**Soubor:** `.env.example` — pridat chybejici promenne:

```diff
 # --- Sentry (error tracking — volitelne) ---
 SENTRY_DSN=
 SENTRY_AUTH_TOKEN=
+SENTRY_ORG=
+SENTRY_PROJECT=
+NEXT_PUBLIC_SENTRY_DSN=
```

**POZOR:** `NEXT_PUBLIC_SENTRY_DSN` je stejna hodnota jako `SENTRY_DSN`, ale s NEXT_PUBLIC prefixem pro klientsky kod.

### Krok 9: Setup v Sentry dashboardu (manualni)

1. Vytvorit projekt na https://sentry.io (nebo self-hosted)
2. Zvolit platform: Next.js
3. Ziskat DSN (napr. `https://xxx@o123.ingest.sentry.io/456`)
4. Ziskat Auth Token pro source map upload
5. Vyplnit v `.env.local`:
   ```env
   SENTRY_DSN=https://xxx@o123.ingest.sentry.io/456
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@o123.ingest.sentry.io/456
   SENTRY_AUTH_TOKEN=sntrys_xxx
   SENTRY_ORG=carmakler
   SENTRY_PROJECT=carmakler-web
   ```

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `sentry.client.config.ts` | NOVY — klientska konfigurace |
| `sentry.server.config.ts` | NOVY — serverova konfigurace |
| `sentry.edge.config.ts` | NOVY — edge runtime konfigurace |
| `instrumentation.ts` | NOVY — Next.js instrumentation hook |
| `next.config.ts` | Pridat withSentryConfig wrapper |
| `app/global-error.tsx` | Pridat Sentry.captureException |
| `.env.example` | Pridat SENTRY_ORG, SENTRY_PROJECT, NEXT_PUBLIC_SENTRY_DSN |
| `package.json` | npm install @sentry/nextjs |

## Overeni

- [ ] `@sentry/nextjs` je v dependencies
- [ ] 4 config soubory existuji v rootu (sentry.client, server, edge, instrumentation)
- [ ] `next.config.ts` pouziva `withSentryConfig` wrapper
- [ ] `global-error.tsx` hlasi chyby do Sentry
- [ ] Bez SENTRY_DSN — aplikace funguje normalne (graceful, `enabled: false` v dev)
- [ ] S SENTRY_DSN — chyby se zobrazi v Sentry dashboardu
- [ ] Source maps se uploaduji pri produkci buildu (pokud SENTRY_AUTH_TOKEN existuje)
- [ ] Build prochazi bez chyb
- [ ] Dev server funguje bez Sentry (enabled: false v development)
- [ ] Ignorovane chyby (ResizeObserver, fetch failed) se nelogují
