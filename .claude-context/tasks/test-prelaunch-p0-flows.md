# Pre-Launch Code Audit: P0 Flows
**Datum:** 2026-05-09  
**Typ:** Code-level audit (routes, auth, error handling, loading)  
**Build:** ✅ Compiled successfully (0 errors, 1281 pages)  
**Lint:** ✅ 0 errors

---

## F1: Veřejný web — code audit

### Route existence + error/loading coverage

| Route | page | error.tsx | loading.tsx | Poznámka |
|-------|------|-----------|-------------|---------|
| `/` homepage | ✅ | ✅ | ✅ | — |
| `/nabidka` katalog | ✅ | ✅ | ✅ | — |
| `/inzerce` | ✅ | ✅ | ✅ | — |
| `/dily` root | ✅ | ✅ | ✅ | — |
| `/dily/katalog` | ✅ | ❌ | ❌ | Prisma query bez error.tsx |
| `/blog` | ✅ | ❌ | ❌ | Prisma query, revalidate:3600, bez error.tsx nebo try/catch |
| `/marketplace` | ✅ | ✅ | ✅ | — |
| `/kariera` | ✅ | — | — | Statická (OK) |
| `/pro-maklere` | ✅ | — | — | `redirect("/kariera")` |
| `/sluzby` | ✅ | — | — | Statická |
| `/sluzby/proverka` | ✅ | — | — | Statická |
| `/o-nas` | ✅ | — | — | Statická |
| `/obchodni-podminky` | ✅ | — | — | Statická |
| `not-found.tsx` | ✅ | — | — | Custom 404 ✅ |

**⚠️ Chybí error.tsx na Prisma stránkách:**
- `app/(web)/blog/page.tsx` — 5× Prisma query, `revalidate: 3600`, no error.tsx, no try/catch → pokud DB selže, uživatel uvidí Next.js generic error
- `app/(web)/dily/katalog/page.tsx` — 2× Prisma query, no error.tsx

---

## F2: Eshop — code audit

### Route existence + error/loading

| Route | page | error.tsx | loading.tsx | auth | Poznámka |
|-------|------|-----------|-------------|------|---------|
| `/shop/katalog` | ✅ | ✅ | ✅ | — | public ✅ |
| `/shop/produkt/[slug]` | ✅ | ❌ | ❌ | — | `notFound()` ✅ ale no error.tsx |
| `/shop/kosik` | ✅ | ✅ | ✅ | — | client component ✅ |
| `/shop/objednavka` | ✅ | ✅ | ✅ | — | client + localStorage ✅ |
| `/shop/objednavka/potvrzeni` | ✅ | ✅ | ✅ | — | URL params ✅ |
| `/dily/katalog` | ✅ | ❌ | ❌ | — | Prisma, no error.tsx |
| `/dily/kosik` | ✅ | ❌ | ❌ | — | client component |

### Checkout API audit

**`POST /api/orders`** ✅
- Zod validation: `createOrderSchema.parse(body)` ✅
- Auth check: `getServerSession` (guest checkout allowed) ✅
- try/catch: ✅
- Error responses: structured JSON ✅

**`app/(web)/shop/objednavka/page.tsx`:**
- Volá `POST /api/orders` ✅
- Error state: `submitError` state + UI feedback ✅
- Loading state: `submitting` boolean ✅

---

## F12: Auth & Security — code audit

### Route existence + error handling

| Route | page | error.tsx | loading.tsx | auth | Poznámka |
|-------|------|-----------|-------------|------|---------|
| `/login` | ✅ | ✅ | ✅ | — | form, no Prisma ✅ |
| `/registrace` | ✅ | — | ✅ | — | Suspense + CC form ✅ |
| `/registrace/makler` | ✅ | ✅ | ✅ | — | token-gated form ✅ |
| `/registrace/dodavatel` | ✅ | ✅ | ✅ | — | ✅ |
| `/registrace/partner` | ✅ | ❌ | ❌ | — | chybí error.tsx |
| `/zapomenute-heslo` | ✅ | ❌ | ❌ | — | form only, low risk |
| `/reset-hesla/[token]` | ✅ | ❌ | ❌ | — | token-gated |
| `/overeni-emailu/chyba` | ✅ | ❌ | ❌ | — | statická error stránka |
| `/muj-ucet` | ✅ | ✅ | ✅ | ✅ getServerSession | ✅ |
| `/muj-ucet/profil` | ✅ | ❌ | ❌ | ✅ getServerSession | chybí error.tsx |
| `/muj-ucet/garaz` | ✅ | ❌ | ❌ | ✅ getServerSession | chybí error.tsx |
| `/muj-ucet/poptavky` | ✅ | ❌ | ❌ | ✅ getServerSession | chybí error.tsx |

### Middleware auth protection ✅

| Prefix | Ochrana |
|--------|---------|
| `/admin` | ✅ ADMIN_ROLES check (line 184) |
| `/makler` | ✅ BROKER role check |
| `/parts` | ✅ PARTS_SUPPLIER roles check |
| `/partner` | ✅ PARTNER_ROLES check (line 355) |
| `/muj-ucet` | ✅ any authenticated user (line 381) |
| `/moje-inzeraty` | ✅ any authenticated user (line 380) |
| `/shop/moje-objednavky` | ✅ any authenticated user (line 382) |

### Auth API routes

| Route | Exists | Validation | Error handling |
|-------|--------|------------|---------------|
| `POST /api/auth/register` | ✅ | Zod ✅ | try/catch ✅ |
| NextAuth `/api/auth/[...nextauth]` | ✅ | built-in ✅ | ✅ |
| `POST /api/auth/forgot-password` | ✅ | ✅ | ✅ |

---

## Playwright spec audit

| Spec | Pass | Fail | Cause |
|------|------|------|-------|
| `auth.spec.ts` | 1 | 2 | Spec bugs (viz níže) |
| `shop.spec.ts` | 3 | 0 | ✅ |
| `homepage.spec.ts` | 2 | 1 | Spec bug (viz níže) |
| `catalog.spec.ts` | 2 | 0 | ✅ |
| **Celkem** | **8** | **3** | |

### Selhání = spec bugy (NOT app bugy)

1. `auth.spec.ts:11` — Hledá `locator('text=Nesprávný email')`, app vrací **"Nesprávný email nebo heslo"** (viz `LoginForm.tsx:48`). Fix: změnit text v testu.
2. `auth.spec.ts:19` — Login `admin@carmakler.cz/heslo123` selže — dev DB neseeded. Fix: `npx prisma db seed`
3. `homepage.spec.ts:10` — `locator('nav')` vrátí 2 elementy (strict mode violation). Fix: použít `locator('nav').first()` nebo konkrétnější selektor.

---

## Souhrn nálezů

### ❌ Chybí (potenciálně P1)

| # | Typ | Soubor | Popis |
|---|-----|--------|-------|
| 1 | Missing error.tsx | `blog/page.tsx` | 5× Prisma query bez error boundary → generic Next.js error |
| 2 | Missing error.tsx | `dily/katalog/page.tsx` | Prisma query bez error boundary |
| 3 | Missing error.tsx | `shop/produkt/[slug]/page.tsx` | `notFound()` OK ale DB error nevyřešen |
| 4 | Missing error.tsx | `muj-ucet/profil`, `garaz`, `poptavky` | SSR pages s Prisma bez error boundary |
| 5 | Missing error.tsx | `registrace/partner` | forma bez error boundary |

### ⚠️ Test spec problémy (opravit před CI)

| # | Soubor | Problém |
|---|--------|---------|
| 1 | `auth.spec.ts:11` | Outdated error text |
| 2 | `auth.spec.ts:19` | Dev DB not seeded |
| 3 | `homepage.spec.ts:10` | Strict mode — 2 nav elements |

### ✅ Vše funguje

- Build: 0 errors ✅
- Lint: 0 errors ✅
- Všechny P0 routes existují ✅
- Middleware auth protection ✅
- Checkout API: Zod validation + try/catch ✅
- 8/11 Playwright tests pass ✅
- 404 stránka ✅
- Footer právní links ✅
