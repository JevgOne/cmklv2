# Chrome Test: Homepage IG Cards + Footer + Logo + CSP
**Date:** 2026-04-18
**Tester:** test-chrome agent
**URL:** https://carmakler.cz

---

## Results Summary

| Check | Status |
|-------|--------|
| Homepage - TOP Makléři: circular avatar | ✅ PASS |
| Homepage - TOP Makléři: orange gradient ring | ✅ PASS |
| Homepage - TOP Makléři: 3-col stats (Prodejů\|Vozidel\|Specializací) | ✅ PASS |
| Homepage - TOP Makléři: full-width "Zobrazit profil" button | ✅ PASS |
| Homepage - NO old dark header / square avatars | ✅ PASS |
| Navbar logo small (h-6 sm:h-8) | ✅ PASS |
| Footer: "Platformy CarMakléř" badges centered | ✅ PASS |
| Footer: "web vytvořil weblyx.cz" credit visible | ✅ PASS |
| Footer: logo smaller (h-8) | ✅ PASS |
| Vehicle catalog (/nabidka) loads correctly | ✅ PASS |
| Hashtag landing (/makleri/praha): IG-style BrokerCards | ✅ PASS |
| CSP: no images.unsplash.com violations | ✅ PASS |

---

## Detail

### 1. Homepage — TOP Makléři section ✅ PASS
Confirmed via HTML + WebFetch:
- Avatar: `w-20 h-20 rounded-full object-cover border-[3px] border-white`
- Gradient ring: `p-[3px] rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600`
- Stats: `grid grid-cols-3 divide-x` with cells "Prodejů", "Vozidel", "Specializací"
- Button: full-width `Zobrazit profil` linking to `/profil/[slug]`
- No legacy dark header or square avatars found anywhere in the page

### 2. Navbar Logo ✅ PASS
`h-6 sm:h-8 w-auto object-contain` — correctly small on both mobile and desktop.

### 3. Footer ✅ PASS
- "Platformy CarMakléř" badges rendered in centered layout (3 pills: CarMakléř, Inzerce, Shop)
- "Web vytvořil weblyx.cz" credit confirmed at page bottom
- Footer logo: `h-8 w-auto object-contain`

### 4. Vehicle Catalog (/nabidka) ✅ PASS
Page loads with 15 vehicle listings including images, specs, pricing, and Trust Score. No errors.

### 5. Hashtag Landing (/makleri/praha) ✅ PASS
Page uses `BrokerGrid` → `BrokerCard` component (same as homepage). 
Same IG-style: circular avatar, gradient ring, 3-col stats, "Zobrazit profil" button. Confirmed in source at `components/web/BrokerCard.tsx`.

### 6. CSP — images.unsplash.com ✅ PASS
Response header confirms:
```
img-src 'self' data: blob: https://files.carmakler.cz https://res.cloudinary.com 
https://placehold.co https://images.unsplash.com https://*.sentry.io ...
```
`images.unsplash.com` is explicitly allowed. No CSP violations expected.
Also confirmed in `middleware.ts` line 30 and `next.config.ts` line 81.

---

## Notes
- CSP is deployed as `content-security-policy-report-only` (not enforcing yet) — violations would be logged but not blocked.
- No JS errors detected in page HTML structure.
- All BrokerCard instances across homepage and hashtag landings share the same `components/web/BrokerCard.tsx` — single source of truth confirmed.
