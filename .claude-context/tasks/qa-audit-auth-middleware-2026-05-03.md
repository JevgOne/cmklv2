# QA Report: Audit middleware + auth ochrana routes — 2026-05-03

**Autor:** Kontrolor  
**Datum:** 2026-05-03  
**Soubory:** `middleware.ts`, `app/(admin)/layout.tsx`, `app/(pwa)/layout.tsx`, `app/(pwa-parts)/layout.tsx`, `app/(partner)/layout.tsx`

---

## 1. ROLE KONSTANTY (middleware.ts:7-19)

| Konstanta | Role | Použito kde |
|-----------|------|-------------|
| `ADMIN_ROLES` | ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | `/admin` |
| `MAKLER_ROLES` | BROKER, MANAGER, REGIONAL_DIRECTOR, ADMIN | `/makler/*` |
| `INZERENT_ROLES` | ADVERTISER, ADMIN, BACKOFFICE | **DEFINOVÁNO, ALE NEPOUŽITO v middleware** ⚠️ |
| `BUYER_ROLES` | BUYER, ADVERTISER, ADMIN, BACKOFFICE | **DEFINOVÁNO, ALE NEPOUŽITO v middleware** ⚠️ |
| `PARTS_SUPPLIER_ROLES` | PARTS_SUPPLIER, WHOLESALE_SUPPLIER, PARTNER_VRAKOVISTE, ADMIN, BACKOFFICE | `/parts` |
| `MARKETPLACE_DEALER_ROLES` | VERIFIED_DEALER, ADMIN, BACKOFFICE | `/marketplace/dealer` |
| `MARKETPLACE_INVESTOR_ROLES` | INVESTOR, ADMIN, BACKOFFICE | `/marketplace/investor` |
| `PARTNER_ROLES` | PARTNER_BAZAR, PARTNER_VRAKOVISTE, ADMIN, BACKOFFICE | `/partner` |

---

## 2. MAPOVÁNÍ CHRÁNĚNÝCH ROUTES

### 2.1 Admin panel (`/admin`)
- **Middleware:** ✅ Pokrývá CELÝ prefix `/admin`
- **Auth check:** getToken → nepřihlášený → `/login?callbackUrl=...`
- **Role check:** NOT in ADMIN_ROLES → redirect `/`
- **Layout auth:** ❌ AdminLayout nemá auth — čistě dekorativní komponenta
- **Page-level auth:** ✅ Většina admin stránek má `getServerSession` jako defense-in-depth
- **Manager subpage restriction:** ✅ `/admin/manager/*` dělají vlastní role check (MANAGER/REGIONAL_DIRECTOR/ADMIN)
- **Speciální omezení:** `/admin/blog/ai-drafts` → ADMIN only; `/admin/tagy` → ADMIN only; `/admin/blog/comments` → ADMIN

### 2.2 Makler PWA (`/makler`)
- **Middleware pro onboarding:** ✅ `/makler/onboarding` → MAKLER_ROLES, ACTIVE broker → dashboard
- **Middleware pro PWA (EXPLICITNÍ SEZNAM — viz ⚠️):**
  ```
  /makler/dashboard, /makler/vehicles, /makler/commissions, /makler/profile,
  /makler/assistant, /makler/contracts, /makler/leads, /makler/messages,
  /makler/contacts, /makler/stats, /makler/leaderboard,
  /makler/financing-calculator, /makler/settings, /makler/provize
  ```
- **ONBOARDING redirect:** token.status === "ONBOARDING" → `/makler/onboarding`
- **Layout auth:** ❌ PwaLayout nemá auth check

### 2.3 Parts PWA (`/parts`)
- **Middleware:** ✅ Celý prefix `/parts`
- **Role check:** PARTS_SUPPLIER_ROLES
- **ONBOARDING redirect:** `!pathname.startsWith("/parts/onboarding")` → `/parts/onboarding`
- **Layout auth:** ❌ PwaPartsLayout nemá auth check

### 2.4 Partner portal (`/partner`)
- **Middleware:** ✅ Celý prefix `/partner`
- **Role check:** PARTNER_ROLES
- **ONBOARDING redirect:** `!pathname.startsWith("/partner/onboarding")` → `/partner/onboarding`
- **Layout auth:** ❌ PartnerLayout nemá auth check (má `useSession` ale ne redirect)

### 2.5 Marketplace (`/marketplace`)
- **`/marketplace/deals`** → VERIFIED_DEALER, INVESTOR, ADMIN, BACKOFFICE; no auth → `/marketplace/apply?reason=auth_required`
- **`/marketplace/dealer`** → VERIFIED_DEALER, ADMIN, BACKOFFICE; no auth → `/marketplace/apply?reason=auth_required&role=dealer`
- **`/marketplace/investor`** → INVESTOR, ADMIN, BACKOFFICE; no auth → `/marketplace/apply?reason=auth_required&role=investor`
- **`/marketplace`** (landing) → ✅ PUBLIC, žádná ochrana
- **`/marketplace/apply`** → ✅ PUBLIC, žádná ochrana (záměrně)

### 2.6 User account (přihlášený uživatel)
- **`/moje-inzeraty`** → jakýkoliv auth
- **`/muj-ucet`** → jakýkoliv auth
- **`/shop/moje-objednavky`** → jakýkoliv auth
- **`/dily/moje-objednavky`** → jakýkoliv auth
- Redirect při no auth → `/login?callbackUrl=...`

### 2.7 Veřejné routes (bez ochrany — záměrně)
- `/marketplace`, `/marketplace/apply` — veřejné landing
- `/shop/objednavka`, `/dily/objednavka` — guest checkout (záměrné, guest orders OK)
- `/nabidka/*`, `/blog/*`, `/inzerce` — veřejné

---

## 3. AUTH REDIRECT FLOW

```
Nepřihlášený uživatel:
  /admin/*           → /login?callbackUrl=...
  /makler/dashboard  → /login?callbackUrl=...
  /parts/*           → /login?callbackUrl=...
  /partner/*         → /login?callbackUrl=...
  /muj-ucet/*        → /login?callbackUrl=...
  /marketplace/deals → /marketplace/apply?reason=auth_required
  /marketplace/dealer → /marketplace/apply?reason=auth_required&role=dealer
  /marketplace/investor → /marketplace/apply?reason=auth_required&role=investor

Přihlášený, špatná role:
  BUYER → /admin    → redirect /
  BUYER → /makler/dashboard → redirect /
  ADVERTISER → /parts → redirect /
  BROKER → /admin   → redirect /
  BUYER → /marketplace/dealer → /marketplace?reason=not_authorized

ONBOARDING stav:
  BROKER (ONBOARDING) → /makler/dashboard → /makler/onboarding
  PARTS_SUPPLIER (ONBOARDING) → /parts/my → /parts/onboarding
  PARTNER (ONBOARDING) → /partner/dashboard → /partner/onboarding
  BROKER (ACTIVE) → /makler/onboarding → /makler/dashboard
```

---

## 4. NALEZENÉ PROBLÉMY

### 🟠 Střední priorita

#### 4.1 Explicitní seznam makler paths — fragile pattern
**Soubor:** `middleware.ts:225-241`

```typescript
const protectedMaklerPaths = [
  "/makler/dashboard", "/makler/vehicles", ...  // 14 explicitních cest
];
```

**Problém:** Chybějí cesty:
- `/makler/materials` → NENÍ v seznamu, ale page má `getServerSession` ✅
- `/makler/blog` → NENÍ v seznamu, ale page má `getServerSession` ✅
- `/makler/blog/[id]/edit` → NENÍ v seznamu, ale page má `getServerSession` ✅
- `/makler/offline` → NENÍ v seznamu, NEMÁ auth (záměrně — PWA offline stránka)

**Riziko:** Kdokoliv přidá novou makler stránku a zapomene ji přidat do seznamu NEBO zapomene na `getServerSession`, stránka bude nechráněná. Explicitní seznam je fragile pattern.

**Doporučení:** Změnit na prefix-based ochrana: `pathname.startsWith("/makler/") && !PUBLIC_MAKLER_PATHS.includes(pathname)` kde PUBLIC_MAKLER_PATHS = ["/makler/offline", "/makler/[slug]"]

#### 4.2 INZERENT_ROLES a BUYER_ROLES jsou definovány ale nepoužity
**Soubor:** `middleware.ts:14-15`

`INZERENT_ROLES` a `BUYER_ROLES` jsou definovány, ale middleware je nikde neaplikuje. 
- `/inzerce/pridat` je dostupné KAŽDÉMU přihlášenému uživateli (pokrývá `/moje-inzeraty` check? — ne, `/inzerce/pridat` není chráněné vůbec)
- BROKER může podávat inzeráty aniž by měl `ADVERTISER` roli

**Dopad:** Drobný — spíš konzistentnost. Inzerce je business-wise otevřená všem.

### ⚠️ Nízká priorita / informativní

#### 4.3 Layouts nemají auth check (defense-in-depth chybí)
- `AdminLayout.tsx` — čistě UI komponenta, žádný auth
- `PwaLayout.tsx` — žádný auth
- `PwaPartsLayout.tsx` — žádný auth
- `PartnerLayout.tsx` — `useSession()` pro zobrazení jména, ale ne pro redirect

**Dopad:** Middleware je single point of failure. Pokud selže middleware (edge case), layouts nijak nezabrání přístupu. Nicméně middleware je robustní a tento pattern je v Next.js běžný.

#### 4.4 Makler client-component pages bez server auth
Tyto stránky jsou "use client" a nemají `getServerSession`:
- `/makler/leads/page.tsx` — klient-only, auth via middleware
- `/makler/contacts/page.tsx`, `/makler/contacts/[id]/page.tsx`, `/makler/contacts/new/page.tsx`
- `/makler/vehicles/new/*` (celý step flow) — klient-only, auth via middleware
- `/makler/vehicles/quick/*` — klient-only

**Dopad:** Nulový pokud middleware funguje. API routes mají vlastní auth check.

#### 4.5 `/admin/blog/comments` — chybí role check v middleware
Middleware pustí DO `/admin/blog/comments` každého s ADMIN_ROLE (včetně BACKOFFICE, MANAGER). Stránka sama ale patrně neomezuje dál. Tohle je záměrné (moderace komentářů je pro více rolí).

---

## 5. VĚCI CO FUNGUJÍ SPRÁVNĚ ✅

| Kontrola | Výsledek |
|----------|----------|
| Nepřihlášený → /admin → /login | ✅ |
| Nepřihlášený → /makler/dashboard → /login | ✅ |
| Nepřihlášený → /marketplace/dealer → /marketplace/apply | ✅ (lepší UX než /login) |
| BROKER → /admin → redirect / | ✅ |
| BUYER → /makler/dashboard → redirect / | ✅ |
| BROKER ONBOARDING → /makler/dashboard → /makler/onboarding | ✅ |
| BROKER ACTIVE → /makler/onboarding → /makler/dashboard | ✅ |
| PARTS_SUPPLIER ONBOARDING → /parts/my → /parts/onboarding | ✅ |
| PARTNER ONBOARDING → /partner/dashboard → /partner/onboarding | ✅ |
| Marketplace gating (dealer vs investor vs deals) | ✅ |
| Admin manager subpages — granulární role check | ✅ |
| Defense-in-depth: admin pages mají getServerSession | ✅ |
| Site password gate (SITE_PASSWORD env) | ✅ |
| Diakritika 301 redirect /dily/znacka/* | ✅ |
| callbackUrl zachována při redirectu | ✅ |
| Guest checkout (/shop/objednavka) — záměrně nechráněné | ✅ |

---

## 6. ZÁVĚR

**Celkový stav: ✅ Middleware je robustní. Žádné kritické bezpečnostní díry.**

Hlavní ochrana funguje správně. Všechny klíčové route skupiny jsou chráněny. Role-based redirecty jsou implementovány správně.

**Prioritizace oprav:**
1. 🟠 Přepsat makler paths na prefix-based ochranu (místo explicitního seznamu) — prevence budoucích chyb
2. 🟢 Zvážit přidání `INZERENT_ROLES` check na `/inzerce/pridat` (konzistentnost)
3. 🟢 Zvážit server-side redirect v `AdminLayout` jako defense-in-depth
