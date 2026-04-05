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
