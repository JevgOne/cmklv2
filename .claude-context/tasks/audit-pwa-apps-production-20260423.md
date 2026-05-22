# PWA Apps Audit — PRODUCTION — 2026-04-23

**Target:** https://carmakler.cz (91.98.203.239)  
**Viewport:** 390×844 (iPhone 14 Pro)  
**Auth:** Unauthenticated (testing route protection + public rendering)  
**Tools:** Playwright (chromium, headless) + curl verification  

---

## Executive Summary

| Area | Status | Notes |
|------|--------|-------|
| Route protection — makléř (14 routes) | ✅ OK | 100% redirect to `/login?callbackUrl=...` |
| Route protection — partner (9 routes) | ✅ OK | 100% redirect to `/login?callbackUrl=...` |
| Route protection — parts supplier (7 routes) | ✅ OK | 100% redirect to `/login?callbackUrl=...` |
| Login page `/login` | ✅ OK | HTTP 200, form renders, 2 inputs |
| Login alias `/prihlaseni` | ⚠️ SEO ISSUE | HTTP 200 + client-side redirect (should be 308) |
| Registration `/registrace/partner` | ✅ OK | HTTP 200, form renders client-side |
| Registration `/registrace/dodavatel` | ✅ OK | HTTP 200, form renders client-side |
| Registration `/registrace/makler` | ✅ BY DESIGN | Token-gated, shows invalid message without token |
| Service Worker `/sw.js` | ✅ OK | HTTP 200, Serwist-based |
| Manifest `/manifest.json` | ✅ OK | HTTP 200, valid, linked in `<head>` |
| Manifest `/manifest.webmanifest` | ❌ 404 | Missing alternative manifest URL |
| PWA Icons (all 4) | ✅ OK | All return HTTP 200 |
| `/makler/offline` auth-gated | ⚠️ BUG | Offline fallback protected by auth — breaks PWA offline UX |

**Overall: All 30 PWA routes are protected. Zero crashes. Zero missing pages on production.**

---

## Service Worker & PWA Assets

| Asset | HTTP | Notes |
|-------|------|-------|
| `/sw.js` | ✅ 200 | Serwist service worker, properly served |
| `/manifest.json` | ✅ 200 | Valid PWA manifest, linked via `<link rel="manifest">` |
| `/manifest.webmanifest` | ❌ 404 | Alternative manifest URL — some validators expect it |
| `/icons/icon-192.png` | ✅ 200 | Standard icon |
| `/icons/icon-512.png` | ✅ 200 | Standard icon |
| `/icons/icon-maskable-192.png` | ✅ 200 | Maskable icon |
| `/icons/icon-maskable-512.png` | ✅ 200 | Maskable icon |

### Manifest contents:
```json
{
  "name": "CarMakléř Pro",
  "short_name": "CarMakléř",
  "start_url": "/makler/dashboard",
  "display": "standalone",
  "background_color": "#F9FAFB",
  "theme_color": "#F97316",
  "scope": "/",
  "lang": "cs"
}
```

---

## PWA MAKLÉŘ — Route Protection (14/14 ✅)

| Route | Redirect Target | HTTP |
|-------|----------------|------|
| `/makler` | `/login?callbackUrl=%2Fmakler%2Fdashboard` | 307 |
| `/makler/dashboard` | `/login?callbackUrl=%2Fmakler%2Fdashboard` | 307 |
| `/makler/vehicles` | `/login?callbackUrl=%2Fmakler%2Fvehicles` | 307 |
| `/makler/vehicles/new` | `/login?callbackUrl=%2Fmakler%2Fvehicles%2Fnew` | 307 |
| `/makler/contracts` | `/login?callbackUrl=%2Fmakler%2Fcontracts` | 307 |
| `/makler/contacts` | `/login?callbackUrl=%2Fmakler%2Fcontacts` | 307 |
| `/makler/leads` | `/login?callbackUrl=%2Fmakler%2Fleads` | 307 |
| `/makler/leaderboard` | `/login?callbackUrl=%2Fmakler%2Fleaderboard` | 307 |
| `/makler/commissions` | `/login?callbackUrl=%2Fmakler%2Fcommissions` | 307 |
| `/makler/stats` | `/login?callbackUrl=%2Fmakler%2Fstats` | 307 |
| `/makler/profile` | `/login?callbackUrl=%2Fmakler%2Fprofile` | 307 |
| `/makler/settings` | `/login?callbackUrl=%2Fmakler%2Fsettings` | 307 |
| `/makler/onboarding` | `/login?callbackUrl=%2Fmakler%2Fonboarding` | 307 |
| `/makler/offline` | `/login?callbackUrl=%2Fmakler%2Foffline` | 307 ⚠️ |

> **⚠️ `/makler/offline` is auth-gated — this is a bug.** See Issues section.

All redirects preserve `callbackUrl` correctly so users are returned to their destination after login.

---

## PWA PARTNER — Route Protection (9/9 ✅)

| Route | Redirect Target | HTTP |
|-------|----------------|------|
| `/partner/dashboard` | `/login?callbackUrl=%2Fpartner%2Fdashboard` | 307 |
| `/partner/vehicles` | `/login?callbackUrl=%2Fpartner%2Fvehicles` | 307 |
| `/partner/parts` | `/login?callbackUrl=%2Fpartner%2Fparts` | 307 |
| `/partner/orders` | `/login?callbackUrl=%2Fpartner%2Forders` | 307 |
| `/partner/leads` | `/login?callbackUrl=%2Fpartner%2Fleads` | 307 |
| `/partner/profile` | `/login?callbackUrl=%2Fpartner%2Fprofile` | 307 |
| `/partner/stats` | `/login?callbackUrl=%2Fpartner%2Fstats` | 307 |
| `/partner/billing` | `/login?callbackUrl=%2Fpartner%2Fbilling` | 307 |
| `/partner/onboarding` | `/login?callbackUrl=%2Fpartner%2Fonboarding` | 307 |

---

## PWA PARTS SUPPLIER — Route Protection (7/7 ✅)

| Route | Redirect Target | HTTP |
|-------|----------------|------|
| `/parts` | `/login?callbackUrl=%2Fparts` | 307 |
| `/parts/my` | `/login?callbackUrl=%2Fparts%2Fmy` | 307 |
| `/parts/new` | `/login?callbackUrl=%2Fparts%2Fnew` | 307 |
| `/parts/import` | `/login?callbackUrl=%2Fparts%2Fimport` | 307 |
| `/parts/orders` | `/login?callbackUrl=%2Fparts%2Forders` | 307 |
| `/parts/profile` | `/login?callbackUrl=%2Fparts%2Fprofile` | 307 |
| `/parts/onboarding` | `/login?callbackUrl=%2Fparts%2Fonboarding` | 307 |

---

## Auth Pages

### `/login` ✅
- **HTTP:** 200
- **Content:** Login form with email + password inputs renders correctly
- **Logic:** After login, redirects by `callbackUrl` (from middleware) or by role via `getRedirectByRole()`
- **Note:** This is the actual NextAuth login page. All protected routes redirect here.

### `/prihlaseni` ⚠️
- **HTTP:** 200 (server returns 200, NOT 308)
- **Behavior:** Page uses `permanentRedirect("/login")` (Next.js Server Component API) — but in production this embeds the redirect in the RSC payload and returns **HTTP 200**, not a true 308. The browser client-side router then navigates to `/login`.
- **Issue:** Crawlers see HTTP 200 with empty content instead of a proper 308 redirect. Not visible to users (UX works fine), but SEO bots may index `/prihlaseni` as a blank page.
- **Fix:** Replace `permanentRedirect` with a proper middleware redirect, or add `<meta http-equiv="refresh">` to ensure HTTP-level redirect.

### `/registrace/makler` — Token-gated ✅ (by design)
- **HTTP:** 200
- **Behavior:** Without `?token=XXX` → shows loading → transitions to "Chybí pozvázkový token" error message. No form rendered.
- **Design:** Correct — broker registration is invitation-only. Token is sent via email by BackOffice.
- **Minor:** Could use a cleaner dedicated error/landing page rather than loading state transitioning to inline error.

### `/registrace/partner` ✅
- **HTTP:** 200
- **Content:** Full registration form renders client-side (companyName, IČO + ARES lookup, contact details, address, partner type selection: AUTOBAZAR / VRAKOVISTE)
- **Note:** Form rendered by Playwright after JS hydration.

### `/registrace/dodavatel` ✅
- **HTTP:** 200
- **Content:** Full registration form renders client-side (same fields as partner + supplier-specific)
- **ARES IČO lookup** integrated

---

## Issues & Recommendations

### 🟡 MEDIUM — `/makler/offline` requires authentication
**Impact:** Real user-facing bug for installed PWA users.

When a broker installs the PWA and goes offline, the service worker would normally serve the `/makler/offline` page from cache. However, the middleware intercepts `/makler/offline` with the auth check and returns a 307 redirect to `/login`. If offline, this redirect fails (no network), resulting in a blank/broken screen instead of the offline fallback.

**Fix:** Add `/makler/offline` to the public routes whitelist in `middleware.ts`:
```typescript
// In the public paths array (around line 30 in middleware.ts):
"/makler/offline",
```

### 🟡 MEDIUM — `/prihlaseni` returns HTTP 200 instead of 308
**Impact:** SEO — page may be indexed with empty content. Not a UX issue.

`app/(web)/prihlaseni/page.tsx` uses `permanentRedirect("/login")` which in Next.js 15 App Router returns HTTP 200 with the redirect embedded in RSC streaming payload. Crawlers receive a 200 with minimal content.

**Fix option A:** Remove the page entirely and add a middleware rule:
```typescript
// In middleware.ts, before other checks:
if (pathname === "/prihlaseni") {
  return NextResponse.redirect(new URL("/login", request.url), 308);
}
```
**Fix option B:** Keep as-is if SEO on `/prihlaseni` is not important.

### 🟢 LOW — `/manifest.webmanifest` returns 404
**Impact:** PWA validators (Lighthouse, web.dev) may flag this. Browsers use `/manifest.json` correctly since it's linked in `<head>`. Chrome on Android also respects `manifest.json`.

**Fix:** Either add a redirect in `next.config.ts`:
```typescript
async redirects() {
  return [{
    source: '/manifest.webmanifest',
    destination: '/manifest.json',
    permanent: true,
  }];
}
```
Or note as acceptable since `/manifest.json` works.

### 🟢 LOW — Single manifest for 3 PWA apps
**Impact:** `start_url: "/makler/dashboard"` and `name: "CarMakléř Pro"` — partner and parts supplier users installing the PWA get the makléř-branded app.

**Consideration:** Each PWA audience (makléř, partner, supplier) might benefit from its own manifest with appropriate `start_url`, `name`, and `short_name`. Not blocking, but worth planning.

### 🟢 LOW — `/registrace/makler` UX without token
**Impact:** Minor UX — shows loading spinner transitioning to error. Consider a dedicated landing page for "invitation required" scenario.

---

## Production vs Dev Differences

| Observation | Dev (localhost) | Production |
|------------|-----------------|------------|
| HTTP 500 on some pages | Seen (compilation artifacts) | Not seen ✅ |
| Playwright timeouts on onboarding | Timed out | Clean redirects ✅ |
| NextAuth `CLIENT_FETCH_ERROR` | Present (dev artifact) | Not present ✅ |
| `/prihlaseni` HTTP status | 307→/login (client-side) | 200 (RSC redirect) |

---

## Routes Summary

| PWA App | Routes Tested | Protected | Missing/Broken |
|---------|--------------|-----------|----------------|
| Makléř | 14 | 14 (100%) | 0 |
| Partner | 9 | 9 (100%) | 0 |
| Parts Supplier | 7 | 7 (100%) | 0 |
| **Total** | **30** | **30 (100%)** | **0** |

**Production is clean. No crashes, no missing pages, no unauthorized access.**
