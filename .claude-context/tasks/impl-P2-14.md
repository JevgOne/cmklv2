# Implementace P2-14: CSP + security headers

**Status:** DONE
**Datum:** 2026-04-05

## Změny

### next.config.ts
- **CSP header** (Content-Security-Policy-Report-Only) — phased rollout:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval'(dev) plausible.io widget.packeta.com js.stripe.com`
  - `style-src 'self' 'unsafe-inline' fonts.googleapis.com widget.packeta.com`
  - `img-src 'self' data: blob: res.cloudinary.com *.sentry.io widget.packeta.com`
  - `font-src 'self' fonts.gstatic.com`
  - `connect-src 'self' *.sentry.io plausible.io api.stripe.com widget.packeta.com`
  - `frame-src 'self' js.stripe.com hooks.stripe.com widget.packeta.com`
  - `worker-src 'self'` (Serwist PWA)
  - `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`
- **HSTS header**: `max-age=63072000; includeSubDomains; preload`
- Linter vylepšil: `unsafe-eval` jen v dev mode, přidal `worker-src`, `media-src`, `frame-ancestors`, komentáře

### app/api/csp-report/route.ts (NOVÝ)
- POST endpoint pro CSP violation reports
- Dev: full JSON log, Prod: single-line summary

### Existující headers (zachovány)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-XSS-Protection: 1; mode=block
- Permissions-Policy: camera=(), microphone=()

## Build
- ✅ `next build` prošel bez chyb
