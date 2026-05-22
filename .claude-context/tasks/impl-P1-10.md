# Implementace P1-10: Sentry error tracking

**Status:** HOTOVO
**Datum:** 2026-04-05
**Implementoval:** implementator agent

---

## Provedene zmeny

### 1. `npm install @sentry/nextjs`
- Nainstalovan `@sentry/nextjs` do dependencies

### 2. `sentry.client.config.ts` (NOVY)
- Klientska konfigurace Sentry
- tracesSampleRate: 0.1 v produkci, 1.0 v dev
- replaysOnErrorSampleRate: 1.0 v produkci
- ignoreErrors: ResizeObserver, fetch failures, AbortError
- enabled: pouze v production

### 3. `sentry.server.config.ts` (NOVY)
- Serverova konfigurace Sentry
- Shodne nastaveni tracesSampleRate a environment

### 4. `sentry.edge.config.ts` (NOVY)
- Edge runtime konfigurace Sentry

### 5. `instrumentation.ts` (NOVY)
- Next.js instrumentation hook
- register(): importuje server/edge config podle NEXT_RUNTIME
- onRequestError(): captureRequestError pro automaticky error reporting

### 6. `next.config.ts` (UPRAVENO)
- Pridan import `withSentryConfig` z `@sentry/nextjs`
- Export zmenen z `withSerwist(nextConfig)` na `withSentryConfig(withSerwist(nextConfig), {...})`
- Sentry options: org, project, authToken, silent mode, source maps
- autoInstrument: serverFunctions, middleware, appDirectory

### 7. `app/global-error.tsx` (UPRAVENO)
- Pridan import `* as Sentry` a `useEffect`
- Pridan `error` prop do parametru
- Pridan `useEffect` s `Sentry.captureException(error)`

### 8. `.env.example` (UPRAVENO)
- Pridany: SENTRY_ORG, SENTRY_PROJECT, NEXT_PUBLIC_SENTRY_DSN

## Overeni

- [x] `@sentry/nextjs` v dependencies
- [x] 3 config soubory v rootu (client, server, edge)
- [x] instrumentation.ts s register() a onRequestError()
- [x] next.config.ts pouziva withSentryConfig wrapper
- [x] global-error.tsx hlasi chyby do Sentry
- [x] Bez SENTRY_DSN aplikace funguje (enabled: false v dev)
- [x] silent mode pokud SENTRY_AUTH_TOKEN chybi
- [x] Typecheck prochazi
- [x] Unit testy prochazi (141/141)
