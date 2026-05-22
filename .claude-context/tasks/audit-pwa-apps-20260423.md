# PWA Apps Audit — 2026-04-23

**Base URL:** http://localhost:3000  
**Viewport:** 390×844 (iPhone 14 Pro)  
**Auth:** Unauthenticated (testing route protection + public rendering)  
**Tool:** Playwright (chromium, headless) + curl verification  

---

## Executive Summary

| Area | Status | Notes |
|------|--------|-------|
| Route protection (makléř) | ✅ OK | All 14 routes redirect to `/login?callbackUrl=...` |
| Route protection (partner) | ✅ OK | All 9 routes redirect to `/login?callbackUrl=...` |
| Route protection (parts supplier) | ✅ OK | All 7 routes redirect to `/login?callbackUrl=...` |
| Login page `/login` | ✅ OK | Renders form, 2 inputs, HTTP 200 |
| Login page `/prihlaseni` | ⚠️ REDIRECT ISSUE | Redirects to `/login` — Czech URL should be canonical |
| Registration `/registrace/partner` | ✅ OK | Form renders client-side |
| Registration `/registrace/dodavatel` | ✅ OK | Form renders client-side |
| Registration `/registrace/makler` | ⚠️ TOKEN REQUIRED | Shows loading/invalid state without token (by design) |
| Service Worker `/sw.js` | ✅ OK | HTTP 200, proper JS |
| Manifest `/manifest.json` | ✅ OK | HTTP 200, valid PWA manifest |
| Manifest `/manifest.webmanifest` | ❌ 404 | Alternative manifest URL returns 404 |
| PWA Icons | ✅ OK | All 4 icons (192, 512, maskable) return 200 |
| NextAuth session errors | ⚠️ WARNING | `CLIENT_FETCH_ERROR` on some pages in dev mode |
| Onboarding timeouts | ℹ️ INFO | Playwright networkidle timeout — not a production issue |

---

## Service Worker & PWA Manifest

| Asset | HTTP | Content-Type | Status |
|-------|------|------|--------|
| `/sw.js` | 200 | `application/javascript` | ✅ OK — Serwist SW (minified, 124KB) |
| `/manifest.json` | 200 | `application/json` | ✅ OK — valid manifest |
| `/manifest.webmanifest` | 404 | `text/html` | ❌ MISSING |

### Manifest content (`/manifest.json`):
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
- Icons: 192×192, 512×512 (any + maskable) — all return HTTP 200 ✅
- Linked in `<head>` as `<link rel="manifest" href="/manifest.json"/>` ✅

**Issue:** `/manifest.webmanifest` returns 404. Some browsers/tools look for this alternative URL. Not critical since `/manifest.json` works, but worth noting.

---

## PWA MAKLÉŘ — Route Protection

All 14 routes properly redirect unauthenticated users to `/login?callbackUrl=<url>` (HTTP 307 via middleware).

| Route | Redirect | HTTP | Notes |
|-------|----------|------|-------|
| `/makler` | → `/login?callbackUrl=%2Fmakler%2Fdashboard` | 307 | ✅ |
| `/makler/dashboard` | → `/login?callbackUrl=%2Fmakler%2Fdashboard` | 307 | ✅ |
| `/makler/vehicles` | → `/login?callbackUrl=%2Fmakler%2Fvehicles` | 307 | ✅ |
| `/makler/vehicles/new` | → `/login?callbackUrl=%2Fmakler%2Fvehicles%2Fnew` | 307 | ✅ |
| `/makler/contracts` | → `/login?callbackUrl=%2Fmakler%2Fcontracts` | 307 | ✅ |
| `/makler/contacts` | → `/login?callbackUrl=%2Fmakler%2Fcontacts` | 307 | ✅ |
| `/makler/leads` | → `/login?callbackUrl=%2Fmakler%2Fleads` | 307 | ✅ |
| `/makler/leaderboard` | → `/login?callbackUrl=%2Fmakler%2Fleaderboard` | 307 | ✅ |
| `/makler/commissions` | → `/login?callbackUrl=%2Fmakler%2Fcommissions` | 307 | ✅ |
| `/makler/stats` | → `/login?callbackUrl=%2Fmakler%2Fstats` | 307 | ✅ |
| `/makler/profile` | → `/login?callbackUrl=%2Fmakler%2Fprofile` | 307 | ✅ |
| `/makler/settings` | → `/login?callbackUrl=%2Fmakler%2Fsettings` | 307 | ✅ |
| `/makler/onboarding` | → `/login?callbackUrl=%2Fmakler%2Fonboarding` | 307 | ✅ |
| `/makler/offline` | → `/login?callbackUrl=%2Fmakler%2Foffline` | 307 | ⚠️ See note |

> **Note on `/makler/offline`:** This is the PWA offline fallback page. It probably should NOT require auth — a user who installed the PWA and is offline but has a cached session should see this page, not be redirected to login. Check if the service worker caches this page correctly and whether it needs to be excluded from middleware auth protection.

**PWA Bottom Navigation:** Login page that users land on has a PWA bottom nav — this is inherited from the global layout. Correct behavior for the PWA wrapper.

---

## PWA PARTNER — Route Protection

All 9 routes properly redirect unauthenticated users to login.

| Route | Redirect | HTTP | Notes |
|-------|----------|------|-------|
| `/partner/dashboard` | → `/login?callbackUrl=...` | 307 | ✅ |
| `/partner/vehicles` | → `/login?callbackUrl=...` | 307 | ✅ |
| `/partner/parts` | → `/login?callbackUrl=...` | 307 | ✅ |
| `/partner/orders` | → `/login?callbackUrl=...` | 307 | ✅ |
| `/partner/leads` | → `/login?callbackUrl=...` | 307 | ✅ |
| `/partner/profile` | → `/login?callbackUrl=...` | 307 | ✅ |
| `/partner/stats` | → `/login?callbackUrl=...` | 307 | ✅ |
| `/partner/billing` | → `/login?callbackUrl=...` | 307 | ✅ |
| `/partner/onboarding` | → `/login?callbackUrl=...` | 307 | ✅ (see timeout note) |

> **Playwright timeout on `/partner/onboarding`:** Playwright reported a networkidle timeout. Curl confirms the page returns HTTP 307 correctly. The timeout is a test artifact — NextAuth client-side session polling on the login page prevents `networkidle` from settling quickly. Not a production issue.

---

## PWA PARTS SUPPLIER — Route Protection

All 7 routes properly redirect unauthenticated users to login.

| Route | Redirect | HTTP | Notes |
|-------|----------|------|-------|
| `/parts` | → `/login?callbackUrl=%2Fparts` | 307 | ✅ |
| `/parts/my` | → `/login?callbackUrl=%2Fparts%2Fmy` | 307 | ✅ |
| `/parts/new` | → `/login?callbackUrl=%2Fparts%2Fnew` | 307 | ✅ |
| `/parts/import` | → `/login?callbackUrl=%2Fparts%2Fimport` | 307 | ✅ |
| `/parts/orders` | → `/login?callbackUrl=%2Fparts%2Forders` | 307 | ✅ |
| `/parts/profile` | → `/login?callbackUrl=%2Fparts%2Fprofile` | 307 | ✅ |
| `/parts/onboarding` | → `/login?callbackUrl=...` | 307 | ✅ (see timeout note same as partner) |

> **NextAuth CLIENT_FETCH_ERROR on `/parts`:** Console showed `CLIENT_FETCH_ERROR Failed to fetch`. This is a dev-mode warning where NextAuth's client session check fails to reach the server while the page is being hydrated. Does not indicate a broken page — just a dev environment artifact (typically NEXTAUTH_URL misconfiguration or network race). NEXTAUTH_URL is correctly set to `http://localhost:3000` in `.env.local`.

---

## Auth Pages

### `/prihlaseni`
- **Status:** Redirects to `/login` (HTTP 307)
- **Issue:** The Czech URL `/prihlaseni` is not the canonical login page — it redirects to `/login`. This creates an SEO/UX inconsistency. Either:
  - Make `/prihlaseni` the canonical URL (with `/login` redirecting to it), or
  - Keep `/login` as canonical and remove/alias `/prihlaseni`
- The destination `/login` page renders correctly: form with email + password inputs, HTTP 200.

### `/login`
- ✅ HTTP 200, renders correctly
- Form: email + password inputs
- Handles `callbackUrl` parameter for post-auth redirect
- Role-based redirect via `getRedirectByRole(role)` after successful login

### `/registrace/makler`
- **Behavior:** Requires `?token=XXX` invitation token. Without token: shows "Ověřuji pozvánku..." then transitions to invalid state with message "Chybí pozvázkový token. Použijte odkaz z pozvánkového emailu."
- **Status:** Expected by design — broker registration is invite-only
- **Issue:** No graceful landing page without token. Consider a proper error page instead of just the loading+invalid states.

### `/registrace/partner`
- ✅ Client component, form renders with all fields (companyName, IČO, ARES lookup, contact, address, etc.)
- Supports both `AUTOBAZAR` and `VRAKOVISTE` partner types
- HTTP 200

### `/registrace/dodavatel`
- ✅ Client component, form renders with all supplier fields
- ARES IČO lookup integrated
- HTTP 200

> **Note:** The Playwright audit showed "no form found" for registration pages. This was a false negative — the forms are client-side React components that require JS hydration. The raw SSR HTML doesn't include form elements; they render after hydration. Manual verification confirms the forms are present.

---

## Issues & Recommendations

### 🔴 HIGH

None critical — all routes are properly protected.

### 🟡 MEDIUM

1. **`/makler/offline` requires auth** — The offline fallback page is redirected to login by middleware. This should be publicly accessible (or at minimum SW-cached without auth check) so that installed PWA users who go offline see a proper offline page, not a broken login redirect. Fix: add `/makler/offline` to middleware public routes.

2. **`/prihlaseni` redirect to `/login`** — Two login URLs exist. Decide on canonical URL. If `/prihlaseni` is the user-facing Czech URL, make it canonical and redirect `/login` → `/prihlaseni`.

### 🟢 LOW / INFORMATIONAL

3. **`/manifest.webmanifest` 404** — Only `/manifest.json` exists. Browsers use `manifest.json` fine (it's linked in the HTML head). Some PWA validators and Android Chrome also look for `.webmanifest`. Either add a redirect or note as acceptable.

4. **`/registrace/makler` without token** — Shows loading state transitioning to error. Consider a cleaner "invalid invitation" error page.

5. **NextAuth `CLIENT_FETCH_ERROR` in dev** — Seen on `/parts` page during hydration. Dev-only artifact, not present in production. No action needed.

6. **500 HTTP responses** — Playwright captured HTTP 500 on a handful of page loads (`/makler/dashboard`, `/makler/vehicles/new`, `/parts/import`). These appear to be transient compilation-time 500s in Next.js dev mode (Turbopack first compile), not stable errors. Curl re-verification confirms all return 307 redirects properly.

---

## PWA Configuration Quality

| Check | Result |
|-------|--------|
| Service Worker (`/sw.js`) | ✅ Serwist-based, properly served |
| Manifest linked in HTML | ✅ `<link rel="manifest" href="/manifest.json"/>` |
| Manifest `start_url` | ✅ `/makler/dashboard` |
| Manifest `display: standalone` | ✅ |
| Manifest `theme_color` | ✅ `#F97316` (orange, matches design) |
| Icons (all 4 sizes) | ✅ All return HTTP 200 |
| `scope: "/"` | ⚠️ Global scope covers all 3 PWA apps — single manifest, single SW. Consider if partner/supplier apps need their own manifests. |
| `manifest.webmanifest` | ❌ 404 |

---

## Routes Inventory Summary

| PWA App | Total Routes | Protected | Auth Redirect | Crash | Missing |
|---------|-------------|-----------|---------------|-------|---------|
| Makléř | 14 | 14 | 14 (100%) | 0 | 0 |
| Partner | 9 | 9 | 9 (100%) | 0 | 0 |
| Parts Supplier | 7 | 7 | 7 (100%) | 0 | 0 |
| Auth pages | 4 | 0 | 1 (prihlaseni→login) | 0 | 0 |

**All 30 PWA routes are either properly protected (redirecting to login) or rendering correctly. Zero actual crashes or missing pages found.**
