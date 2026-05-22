---
task_id: 100
type: PLAN (P0 BLOCKER)
agent: planovac
status: APPROVED (Option b) — Q1 OVERRIDE applied 2026-04-07
created: 2026-04-07
revised: 2026-04-07 (team-lead override Q1: PATH_PREFIX.shop = "/dily")
estimate: S (small) — ~30-60 min dev
priority: P0
related_tasks:
  - "#101 PLAN — Marketplace odebrat z public menu (DONE, batch v #104 IMPL)"
  - "#104 IMPL — #100 + #101 batch (BLOCKED na #101 PLAN, teď unblockovaný)"
  - "#26 IMPL — PlatformSwitcher subdomain cross-linking (původní implementace, zdroj bug)"
---

# #100 PLAN — URGENT bug: PlatformSwitcher menu hází na *.localhost subdomény v dev

## 1 — Root cause confirmed ✅

**User report:** *"v menu furt nefunguje třeba inzerce hazi to na inzerce.localhost"*

### 1.1 Co se děje (verified)

`lib/urls.ts:1-21` definuje 4 platform URL helpers:

```typescript
const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || "http://localhost:3000";
const INZERCE_URL = process.env.NEXT_PUBLIC_INZERCE_URL || "http://inzerce.localhost:3000";
const SHOP_URL = process.env.NEXT_PUBLIC_SHOP_URL || "http://shop.localhost:3000";
const MARKETPLACE_URL = process.env.NEXT_PUBLIC_MARKETPLACE_URL || "http://marketplace.localhost:3000";
```

`PlatformSwitcher.tsx` (4 platforms ×3 variants = navbar/mobile/footer) generuje `<a href={urls.inzerce("/")}>` → v dev mode bez `/etc/hosts` setup → browser dostane:

- `http://inzerce.localhost:3000/` → DNS resolve fail → connection refused / `ERR_NAME_NOT_RESOLVED`
- `http://shop.localhost:3000/` → stejně
- `http://marketplace.localhost:3000/` → stejně

**Důsledek:** PlatformSwitcher (cross-platform menu) je v dev mode **plně rozbitý** pro 3 ze 4 odkazů. User klikne "Inzerce" → connection refused page.

`.env.example:14-19` kopíruje stejné defaults — neopravený dev environment je broken-by-default. Každý nový developer si musí ručně nastavit `/etc/hosts` (`127.0.0.1 inzerce.localhost shop.localhost marketplace.localhost`).

### 1.2 Co funguje ✅

1. **`urls.main(...)`** funguje vždy (default `http://localhost:3000` resolvuje normálně)
2. **Path-based routing v `app/(web)/` existuje** — všechny 4 platformy mají také path-based varianty:
   - `app/(web)/page.tsx` → main
   - `app/(web)/inzerce/page.tsx` → inzerce
   - `app/(web)/shop/page.tsx` → shop (parts homepage)
   - `app/(web)/dily/page.tsx` → také parts homepage (alternative path)
   - `app/(web)/marketplace/page.tsx` → marketplace
3. **Middleware podporuje OBOJÍ** módy:
   - Subdomain rewrite: `shop.host/x` → `/shop/x` (řádky 67-72)
   - Path-based routing: `/shop/x` projde middleware bez rewrite
4. **17 consumerů `urls.*`** ale **pouze 1 soubor** (`PlatformSwitcher.tsx`) volá `urls.inzerce/shop/marketplace`. Ostatních 16 volání jsou `urls.main(...)` → fungují vždy.

### 1.3 Sekundární issues nalezené při auditu (FYI, mimo scope #100)

1. **Možný bug v middleware.ts:125-127** — `response.headers.set("x-subdomain", subdomain)` nastavuje **response** header, ne **request** header. Server komponenta v `(web)/layout.tsx` čte `await headers()` → pravděpodobně dostává `null`. Nesouvisí s #100, **dokumentováno v plan-task-82.md §3.2**.
2. **Duplicitní parts homepage:** `(web)/dily/page.tsx` i `(web)/shop/page.tsx` jsou téměř identické parts landing pages. Mimo scope #100, doporučuji follow-up cleanup task.

---

## 2 — Investigace consumerů

**Grep `urls.(inzerce|shop|marketplace|main)`** napříč `components/`:

| Soubor | Volání | Co dělá |
|--------|--------|---------|
| `components/ui/PlatformSwitcher.tsx` | `urls.main("/")`, `urls.inzerce("/")`, `urls.shop("/")`, `urls.marketplace("/")` | **JEDINÝ konzument cross-platform URLs** — generuje 4 platform tlačítka |
| `components/common/FooterBase.tsx` | 8× `urls.main("/...")` | Sub-platform footers linkují BACK na main (legal, contact) |
| `components/marketplace/Navbar.tsx` | 2× `urls.main("/login")` | Login link na main |
| `components/inzerce/Navbar.tsx` | 4× `urls.main("/login")`, `urls.main("/moje-inzeraty")` | Account link na main |
| `components/shop/Navbar.tsx` | 2× `urls.main("/login")` | Login link na main |

**Insight:** `urls.inzerce/shop/marketplace` má **jediného konzumenta** — `PlatformSwitcher.tsx`. Všechny ostatní soubory volají pouze `urls.main(...)`, který funguje OK.

**Existující test** `__tests__/lib/urls.test.ts`:
```typescript
it('urls.inzerce("/katalog") vrací správnou URL', () => {
  const result = urls.inzerce('/katalog')
  expect(result).toContain('/katalog')
  expect(result).toMatch(/inzerce/)        // ← path "/inzerce/katalog" matchuje ✅
})

it('urls.shop("/katalog") vrací správnou URL', () => {
  const result = urls.shop('/katalog')
  expect(result).toContain('/katalog')
  expect(result).toMatch(/shop/)           // ← path "/shop/katalog" matchuje ✅
})
```

**Klíčové:** Test používá obecný regex `/inzerce/`, `/shop/`, `/marketplace/` — match funguje **i pro path-based** výsledek (`/inzerce/katalog` obsahuje "inzerce"). **Test bude zelený i po fixu** ✅.

---

## 3 — Návrh fixu (3 možnosti)

### Option (a) — NODE_ENV-based detection
```typescript
const IS_PROD = process.env.NODE_ENV === "production";
const INZERCE_URL = process.env.NEXT_PUBLIC_INZERCE_URL ||
  (IS_PROD ? "https://inzerce.carmakler.cz" : "");
```
- **Pros:** Explicit dev/prod separation
- **Cons:** Hardcoded prod URLs v kódu (špatné — měly by být env vars), `NODE_ENV` v Next.js client kódu má edge cases

### Option (b) — Path-based defaults, env vars override (DOPORUČENO ⭐)
```typescript
const INZERCE_URL = process.env.NEXT_PUBLIC_INZERCE_URL ?? null;
// Pokud env var nastavený → použij subdomain URL
// Pokud null/empty → fallback na path-based "/inzerce"
```
- **Pros:** Žádné hardcoded prod URLs, env vars jsou single source of truth, dev funguje out-of-the-box, explicitní opt-in pro subdomain mode
- **Cons:** Mírně složitější `buildUrl` logic

### Option (c) — Force ENV setup + /etc/hosts dokumentace
- **Pros:** Žádný kód change
- **Cons:** **Špatný DX** — každý nový dev musí trápit `/etc/hosts`, frustrace, zbytečná friction. **NEDOPORUČUJI**.

### Doporučení: Option (b)

**Důvod:**
- Žádné prod URLs v kódu (security + clean separation)
- Dev mode funguje **bez setupu** — nový developer nakloní repo, `npm install`, `npm run dev` → funguje
- Env vars zůstávají jako override (např. když chce dev testovat skutečné subdomény, nastaví env var)
- Existing test `__tests__/lib/urls.test.ts` zůstává **bez změny** (regex matchy funguje pro path-based output)
- Žádné breaking changes pro 17 consumerů (interface `urls.*(path)` zůstává identický)

---

## 4 — Konkrétní edit do `lib/urls.ts`

### 4.1 Před (current)

```typescript
const MAIN_URL =
  process.env.NEXT_PUBLIC_MAIN_URL || "http://localhost:3000";
const INZERCE_URL =
  process.env.NEXT_PUBLIC_INZERCE_URL || "http://inzerce.localhost:3000";
const SHOP_URL =
  process.env.NEXT_PUBLIC_SHOP_URL || "http://shop.localhost:3000";
const MARKETPLACE_URL =
  process.env.NEXT_PUBLIC_MARKETPLACE_URL ||
  "http://marketplace.localhost:3000";

function buildUrl(base: string, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export const urls = {
  main: (path: string = "/") => buildUrl(MAIN_URL, path),
  inzerce: (path: string = "/") => buildUrl(INZERCE_URL, path),
  shop: (path: string = "/") => buildUrl(SHOP_URL, path),
  marketplace: (path: string = "/") => buildUrl(MARKETPLACE_URL, path),
};
```

### 4.2 Po (proposed fix)

```typescript
/**
 * Cross-platform URL builder.
 *
 * Default chování (dev, žádné env vars):
 *   - urls.main("/x")        → "http://localhost:3000/x"
 *   - urls.inzerce("/x")     → "/inzerce/x"      (path-based, žádný subdomain)
 *   - urls.shop("/x")        → "/dily/x"         (path-based — /dily je canonical, viz #87/#87a SEO)
 *   - urls.marketplace("/x") → "/marketplace/x"  (path-based)
 *
 * S env vars (prod nebo dev se subdomain setupem):
 *   NEXT_PUBLIC_INZERCE_URL=https://inzerce.carmakler.cz
 *   → urls.inzerce("/x") → "https://inzerce.carmakler.cz/x"
 *
 * Routing:
 *   Path-based: app/(web)/inzerce/page.tsx, app/(web)/shop/page.tsx, app/(web)/marketplace/page.tsx
 *   Subdomain: middleware.ts rewrituje host header → path internally
 */

const MAIN_URL =
  process.env.NEXT_PUBLIC_MAIN_URL || "http://localhost:3000";

// Subdomain URLs — env vars override path-based defaults.
// Empty/undefined → fallback na path-based routing (žádný /etc/hosts setup nutný).
const INZERCE_SUBDOMAIN_URL = process.env.NEXT_PUBLIC_INZERCE_URL || "";
const SHOP_SUBDOMAIN_URL = process.env.NEXT_PUBLIC_SHOP_URL || "";
const MARKETPLACE_SUBDOMAIN_URL = process.env.NEXT_PUBLIC_MARKETPLACE_URL || "";

// Path-based fallbacks (musí odpovídat existujícím app/(web)/<prefix>/page.tsx)
const PATH_PREFIX = {
  inzerce: "/inzerce",
  shop: "/dily", // ⚠️ canonical eshop URL (NE "/shop") — viz #87/#87a SEO investice + CLAUDE.md
  marketplace: "/marketplace",
} as const;

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function buildMainUrl(path: string): string {
  return `${MAIN_URL}${normalizePath(path)}`;
}

function buildPlatformUrl(subdomainUrl: string, pathPrefix: string, path: string): string {
  const cleanPath = normalizePath(path);
  if (subdomainUrl) {
    // Env var nastavený → použij subdomain URL (prod nebo opt-in dev)
    return `${subdomainUrl}${cleanPath}`;
  }
  // Bez env var → path-based routing
  // urls.inzerce("/") → "/inzerce" (ne "/inzerce/")
  // urls.inzerce("/katalog") → "/inzerce/katalog"
  if (cleanPath === "/") return pathPrefix;
  return `${pathPrefix}${cleanPath}`;
}

export const urls = {
  main: (path: string = "/") => buildMainUrl(path),
  inzerce: (path: string = "/") => buildPlatformUrl(INZERCE_SUBDOMAIN_URL, PATH_PREFIX.inzerce, path),
  shop: (path: string = "/") => buildPlatformUrl(SHOP_SUBDOMAIN_URL, PATH_PREFIX.shop, path),
  marketplace: (path: string = "/") => buildPlatformUrl(MARKETPLACE_SUBDOMAIN_URL, PATH_PREFIX.marketplace, path),
};
```

### 4.3 Klíčové změny

1. **`MAIN_URL` zůstává nezměněný** — funguje jak v dev tak v prod
2. **3 subdomain konstanty defaultují na prázdný string `""`** místo `http://X.localhost:3000`
3. **Nový `buildPlatformUrl()` helper** s 2 větvemi:
   - Env var set → subdomain URL (prod chování)
   - Env var empty → path-based routing (dev fallback)
4. **`buildUrl` rozděleno na `buildMainUrl` + `buildPlatformUrl`** kvůli různému chování (main vždy plný URL, platform má fallback)
5. **JSDoc** nahoře vysvětluje obě dva módy

### 4.4 Behavior matrix po fixu

| Volání | Dev (no env vars) | Dev (env vars set) | Prod (env vars set) |
|--------|-------------------|-------------------|---------------------|
| `urls.main("/")` | `http://localhost:3000/` | `http://localhost:3000/` | `https://www.carmakler.cz/` |
| `urls.main("/login")` | `http://localhost:3000/login` | same | `https://www.carmakler.cz/login` |
| `urls.inzerce("/")` | **`/inzerce`** ⭐ | `http://inzerce.localhost:3000/` | `https://inzerce.carmakler.cz/` |
| `urls.inzerce("/katalog")` | **`/inzerce/katalog`** ⭐ | `http://inzerce.localhost:3000/katalog` | `https://inzerce.carmakler.cz/katalog` |
| `urls.shop("/")` | **`/dily`** ⭐ | `http://shop.localhost:3000/` | `https://shop.carmakler.cz/` |
| `urls.shop("/katalog")` | **`/dily/katalog`** ⭐ | `http://shop.localhost:3000/katalog` | `https://shop.carmakler.cz/katalog` |
| `urls.marketplace("/")` | **`/marketplace`** ⭐ | `http://marketplace.localhost:3000/` | `https://marketplace.carmakler.cz/` |

**⭐ = nové chování po fixu (před: hardcoded subdomain → broken)**

---

## 5 — Edit do `.env.example`

### 5.1 Před (current řádky 14-19)

```bash
# --- Subdomeny (verejne URL) ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAIN_URL=http://localhost:3000
NEXT_PUBLIC_INZERCE_URL=http://inzerce.localhost:3000
NEXT_PUBLIC_SHOP_URL=http://shop.localhost:3000
NEXT_PUBLIC_MARKETPLACE_URL=http://marketplace.localhost:3000
```

### 5.2 Po (proposed)

```bash
# --- Platform URLs ---
# MAIN URL — vzdy nastaveno (default fallback localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAIN_URL=http://localhost:3000

# Subdomain URLs (volitelne) —
# - DEV: nech prazdne, pouzije se path-based routing (/inzerce, /shop, /marketplace)
#        funguje out-of-the-box bez /etc/hosts setupu
# - PROD: nastav real subdomeny:
#        NEXT_PUBLIC_INZERCE_URL=https://inzerce.carmakler.cz
#        NEXT_PUBLIC_SHOP_URL=https://shop.carmakler.cz
#        NEXT_PUBLIC_MARKETPLACE_URL=https://marketplace.carmakler.cz
NEXT_PUBLIC_INZERCE_URL=
NEXT_PUBLIC_SHOP_URL=
NEXT_PUBLIC_MARKETPLACE_URL=
```

### 5.3 Edit do user's `.env.local` (manuální step pro usera)

**Soubor `.env.local` je na disku** (potvrzeno `ls .env*`), pravděpodobně obsahuje subdomain URLs z původního template. **User musí ručně:**

1. Otevřít `.env.local`
2. Vyhledat `NEXT_PUBLIC_INZERCE_URL`, `NEXT_PUBLIC_SHOP_URL`, `NEXT_PUBLIC_MARKETPLACE_URL`
3. Nastavit hodnoty na **prázdné** (nebo smazat řádky úplně):
   ```bash
   NEXT_PUBLIC_INZERCE_URL=
   NEXT_PUBLIC_SHOP_URL=
   NEXT_PUBLIC_MARKETPLACE_URL=
   ```
4. Restart `npm run dev` (env vars se načítají při startu)

**⚠️ Důležité:** Bez tohoto kroku zůstane bug. Implementator MUSÍ user instruct v PR popisu nebo v post-fix message.

**Alternativa:** Implementator může na user's stroji udělat jednorázový edit `.env.local` (s permission), pokud má přístup. Ale lepší je dokumentovat manual step.

---

## 6 — Test update plan

### 6.1 Existing test `__tests__/lib/urls.test.ts` — JEDNA editace nutná (Q1 OVERRIDE konsekvence)

**⚠️ POZOR:** Po team-lead override Q1 (`PATH_PREFIX.shop = "/dily"`) test `urls.shop("/katalog")` se ZBARVÍ ČERVENĚ — `/dily/katalog` neobsahuje string `"shop"`. Test regex `/shop/` musí být přepsán na `/dily/`.

**Edit `__tests__/lib/urls.test.ts:18-22`:**

```diff
  it('urls.shop("/katalog") vrací správnou URL', () => {
    const result = urls.shop('/katalog')
    expect(result).toContain('/katalog')
-   expect(result).toMatch(/shop/)
+   expect(result).toMatch(/dily/)
  })
```

**Důvod:** `/dily` je canonical eshop URL (CLAUDE.md + #87/#87a SEO investice), `/shop/page.tsx` je legacy duplicate (separate cleanup task). Po fixu `urls.shop("/katalog")` vrátí `/dily/katalog` v dev (path-based) a `https://shop.carmakler.cz/katalog` v prod (subdomain-based — match `/dily/` regex by failnul, ale POZOR — v prod je env var nastavený a vrátí subdomain URL který obsahuje `/katalog` ale ne `/dily`). Test běží v dev/test mode kde env var prázdný → výsledek `/dily/katalog` → match `/dily/` ✅.

**Pozn. pro implementatora:** Test je single regex change. Pokud chceš být safer (test passne i kdyby env var byl nastaven), použij OR regex `/(shop|dily)/`. Doporučuju ale clean break `/dily/` — refllektuje canonical naming.

| Test | Result před fixem | Result po fixu | Status | Edit nutný? |
|------|------------------|----------------|--------|------------|
| `urls.main("/katalog") vrací správnou URL` | `http://localhost:3000/katalog` (matchuje `^https?://`) | same | ✅ | Ne |
| `urls.inzerce("/katalog") vrací správnou URL` | `http://inzerce.localhost:3000/katalog` (matchuje `/inzerce/`) | **`/inzerce/katalog`** (matchuje `/inzerce/`) | ✅ | Ne |
| `urls.shop("/katalog") vrací správnou URL` | `http://shop.localhost:3000/katalog` (matchuje `/shop/`) | **`/dily/katalog`** (NEmatchuje `/shop/`) | ❌→✅ | **ANO** — regex `/shop/` → `/dily/` |
| `urls.marketplace("/")` | `http://marketplace.localhost:3000/` (matchuje `/marketplace/`) | **`/marketplace`** (matchuje `/marketplace/`) | ✅ | Ne |
| `cesta bez lomítka se normalizuje` | `http://localhost:3000/katalog` (obsahuje `/katalog`) | same | ✅ | Ne |
| `výchozí cesta je "/"` | `http://localhost:3000/` (matchuje `/$`) | same | ✅ | Ne |

### 6.2 Doporučené nové testy (volitelné, low priority)

```typescript
// __tests__/lib/urls.test.ts — nová test suite
describe('urls — path-based fallback (dev mode)', () => {
  it('urls.inzerce("/") → /inzerce v dev', () => {
    // Předpokládá NEXT_PUBLIC_INZERCE_URL prázdné
    delete process.env.NEXT_PUBLIC_INZERCE_URL;
    // POZNÁMKA: env vars jsou bundle-time v Next.js, takže test musí re-importovat
    // module nebo testovat helper přímo. Zatim skip — out of scope.
  });
});
```

**Doporučení:** Skip nové testy — vyžadují dynamic env mocking (module re-import), což je komplikované v Vitest. Spíš doplnit Playwright E2E test (§7.3).

### 6.3 Vitest run check

```bash
npx vitest run __tests__/lib/urls.test.ts
# Očekáváno: 6/6 passed
```

---

## 7 — Acceptance criteria

### AC1 — Build & test
- [ ] **AC1.1:** `npm run lint` → 0 errors (~537 warnings pre-existing OK)
- [ ] **AC1.2:** `npx vitest run` → 141/141 passed (žádný regres)
- [ ] **AC1.3:** `npx vitest run __tests__/lib/urls.test.ts` → 6/6 passed
- [ ] **AC1.4:** `npm run build` → success, žádné nové errors

### AC2 — Dev mode (no env vars)
- [ ] **AC2.1:** V dev (`.env.local` má prázdné `NEXT_PUBLIC_INZERCE_URL`) klik na "Inzerce" v navbaru hlavního webu → otevře `http://localhost:3000/inzerce` → renderuje `app/(web)/inzerce/page.tsx`
- [ ] **AC2.2:** Klik na "Eshop autodíly" → otevře `http://localhost:3000/dily` → renderuje `app/(web)/dily/page.tsx` (canonical, NE legacy `/shop/page.tsx`)
- [ ] **AC2.3:** Klik na "Marketplace" → otevře `http://localhost:3000/marketplace` → renderuje `app/(web)/marketplace/page.tsx`
- [ ] **AC2.4:** Klik na "CarMakléř" → otevře `http://localhost:3000/` → renderuje homepage
- [ ] **AC2.5:** PlatformSwitcher v navbaru/mobile/footer všech 4 platform variantách funguje (testovat z main, inzerce, shop, marketplace navbar)

### AC3 — Prod mode (env vars set)
- [ ] **AC3.1:** S env vars `NEXT_PUBLIC_INZERCE_URL=https://inzerce.carmakler.cz` `urls.inzerce("/")` vrací `https://inzerce.carmakler.cz/`
- [ ] **AC3.2:** Žádné breaking changes pro 17 consumerů `urls.*` (16 z nich je `urls.main(...)` které zůstává nezměněné)

### AC4 — Backwards compat
- [ ] **AC4.1:** Existující `urls.main(...)` chování zachováno (16 consumerů)
- [ ] **AC4.2:** PlatformSwitcher všech 4 platforms × 3 variants render bez chyby (`current` prop check)
- [ ] **AC4.3:** Test-Chrome verifikace všech 4 platform menu odkazů v dev (Test-Chrome agent)

### AC5 — Documentation
- [ ] **AC5.1:** `.env.example` má aktualizovaný komentář vysvětlující dev vs prod chování
- [ ] **AC5.2:** `lib/urls.ts` má JSDoc nahoře vysvětlující obě módy
- [ ] **AC5.3:** Implementator pošle user post-fix message s instrukcí jak upravit `.env.local`

---

## 8 — Risk assessment

### 8.1 Production breakage check ❌ (žádné riziko)

**Otázka:** Mohlo by tato změna rozbít prod build/deploy?

**Odpověď:** **Ne**, pokud production env vars jsou nastavené.

- Production deploy v Vercel/etc má `NEXT_PUBLIC_INZERCE_URL=https://inzerce.carmakler.cz` (správně nastavený) → `INZERCE_SUBDOMAIN_URL` je truthy → fallback path-based se nepoužije → chování identické s před fixem
- Pokud se na produkci NĚKTERÝ env var omylem nezavede → namísto plné URL se použije path-based `/inzerce` (relative URL) → user na `inzerce.carmakler.cz` klikne "Shop" → relativní `/shop` → `inzerce.carmakler.cz/shop` → middleware ho rewritne → nebude crashnout, jen mírně podivné chování. **Mnohem lepší než connection refused** v dev.

### 8.2 Risk matrix

| Risk | Pravděpodobnost | Dopad | Mitigace |
|------|-----------------|-------|---------|
| Test regrese | Low | Low | Existující test používá obecný regex `/inzerce/` který matchuje i path-based output |
| Prod missing env var → relative URL | Med (deployment misconfig) | Low | Lepší než current crash; lze přidat build-time check |
| Někdo má lokální `.env.local` se subdomain URLs nastavený a očekává subdomain mode | Med | Low | Manual step v post-fix message instruct user |
| User klikne "Eshop autodíly" v dev → otevře `/dily` (canonical) místo legacy `/shop` | None | None | Q1 OVERRIDE: `/dily` je canonical (CLAUDE.md + #87/#87a SEO). `/shop/page.tsx` je legacy duplicate — separate cleanup task. |
| 17 consumerů `urls.*` se rozbije | None | High | Pouze 1 consumer (`PlatformSwitcher.tsx`) volá `urls.inzerce/shop/marketplace`. Ostatní volají pouze `urls.main` (zachováno). |
| `NODE_ENV` edge cases v Next.js | None | — | **Option (b) NEpoužívá `NODE_ENV`** — fallback je založený na empty string check, žádná NODE_ENV detekce |

### 8.3 Rollback plán

- Single-file change (`lib/urls.ts`) + 1 file change (`.env.example`)
- Git revert single commit → restore current state

### 8.4 Forward compatibility

- **#101 (Marketplace remove from menu)** touchne stejný `PlatformSwitcher.tsx` — implementator může batch oba fixy do **jednoho commitu** pro menší diff churn
- **#82 PERF audit Phase 1** (route group split) přesune `app/(web)/inzerce/page.tsx` do `app/(inzerce-web)/inzerce/page.tsx`. **Path-based URLs se nezmění** (route groups jsou neviditelné v URL), takže #82 fix je kompatibilní

---

## 9 — Implementation checklist (pro implementatora)

### Files to edit
1. **`lib/urls.ts`** — replace celý obsah dle §4.2 (~50 řádků)
2. **`.env.example`** — replace řádky 14-19 dle §5.2

### Files to edit (REVIDOVÁNO po Q1 override)
1. **`lib/urls.ts`** — replace celý obsah dle §4.2 (~50 řádků), POZOR `PATH_PREFIX.shop = "/dily"`
2. **`.env.example`** — replace řádky 14-19 dle §5.2
3. **`__tests__/lib/urls.test.ts:21`** — change regex `/shop/` → `/dily/` (single line edit, viz §6.1)

### Files NOT to touch
- `components/ui/PlatformSwitcher.tsx` — žádný edit pro #100 (BUT see #101 batch)
- 16 consumerů `urls.main(...)` — žádný edit
- `middleware.ts` — žádný edit (subdomain detection zůstává funkční pro prod)

### Manual steps (post-implementation)
1. Implementator instruct user: "Otevři `.env.local`, vyprázdni `NEXT_PUBLIC_INZERCE_URL=`, `NEXT_PUBLIC_SHOP_URL=`, `NEXT_PUBLIC_MARKETPLACE_URL=` (nebo smaž řádky), restart `npm run dev`"
2. User testuje v browseru: klik všech 4 platform tlačítek z hlavního webu

### Verification before commit
1. `npm run lint` → 0 errors
2. `npx vitest run` → 141/141 passed
3. `npm run build` → success
4. Manual test v dev: 4 platform clicks → 4 successful page loads

### Commit message
```
fix(#100): PlatformSwitcher path-based fallback v dev mode

Před: lib/urls.ts hardcoded fallback na http://inzerce.localhost:3000
(a shop/marketplace stejně) → bez /etc/hosts setupu = connection refused.

Po: Pokud NEXT_PUBLIC_INZERCE_URL/SHOP_URL/MARKETPLACE_URL prázdné →
fallback na path-based routing (/inzerce, /shop, /marketplace).
Pokud env vars nastaveny (prod) → použije subdomain URLs jako dříve.

Žádné breaking changes pro 17 consumerů. Existující test stále zelený.

Manual step: vyprázdnit env vars v .env.local + restart dev server.
```

---

## 10 — Estimate

| Krok | Estimate |
|------|----------|
| Dev edit `lib/urls.ts` + `.env.example` | 15 min |
| Verify `lint` + `test` + `build` | 5 min |
| Manual test 4 platform clicks v dev | 5 min |
| Commit + PR + popis user manual step | 10 min |
| **CELKEM** | **~30-40 min** |

**Estimate scope:** S (small) — single-file change, žádné DB migrace, žádný refactor.

---

## 11 — Návaznosti & batching

### 11.1 Batch s #101 (Marketplace odebrat z public menu)

**#101 task** říká odebrat marketplace z PlatformSwitcher (a navbarů/footerů). Touchne **stejný soubor** `components/ui/PlatformSwitcher.tsx`.

**Doporučení implementatorovi:** Udělat #100 + #101 v **jednom batchu**:
1. Phase A — `lib/urls.ts` fix (#100) — 1 commit
2. Phase B — `PlatformSwitcher.tsx` marketplace conditional (#101) — 1 commit
3. Single PR

**Důvod:** Menší diff churn, jednodušší code review, společný E2E test 4 platformy → 3 platformy.

### 11.2 Návaznost na #82 PERF audit

Phase 1 #82 přesune adresářovou strukturu, ale path-based URLs (`/inzerce`, `/shop`, `/marketplace`) zůstanou identické (route groups neovlivňují URL). **Žádný konflikt.**

### 11.3 Sekundární cleanup (follow-up TBD)

- **TBD-1:** ✅ **VYŘEŠENO** Q1 override (2026-04-07): `/dily` je canonical. **TODO follow-up:** smazat legacy `app/(web)/shop/page.tsx` (duplicate parts homepage) — separate cleanup task až po #104
- **TBD-2:** Middleware bug fix (`response.headers.set` vs `request.headers.set`) — viz plan-task-82.md §3.2
- **TBD-3:** Production deploy validation — ověřit že Vercel deployment má `NEXT_PUBLIC_INZERCE_URL=https://inzerce.carmakler.cz` (a další 2) skutečně nastavené

---

## 12 — Doporučená option pro team-lead

**Option (b) — Path-based defaults s env vars override** ⭐

**Reasoning v 1 větě:** Žádné prod URLs v kódu, dev funguje out-of-the-box, prod chování zachováno, existující test zůstává zelený, jediný consumer (`PlatformSwitcher`) automaticky dostává správné URLs bez kódové změny.

**Estimate:** S (~30-40 min total)

**Risk:** Zero (single-file, backwards compatible, existing tests pass)

**Blockery:** Žádné. Implementator může začít okamžitě po schválení.

---

## 13 — Open questions pro team-leada

### Q1 — `/shop` vs `/dily` jako canonical eshop URL? ✅ RESOLVED 2026-04-07 — TEAM-LEAD OVERRIDE

**Final decision:** **B — `/dily`** (canonical, NE `/shop`)

**Důvody team-leada (override mého původního doporučení A):**
1. CLAUDE.md kanonický: `app/(web)/dily/ → eshop autodíly` (project doc)
2. SEO investice #87/#87a/#87b celá SEO struktura targets `/dily/[brand]/[model]/[rok]` — Google už indexuje
3. Sémantika: PlatformSwitcher label v UI je „Eshop autodíly" → path `/dily` je sémanticky správnější
4. `/shop/page.tsx` JE legacy duplicate — separate cleanup task vznikne až po #104

**Důsledek pro fix:**
- `PATH_PREFIX.shop = "/dily"` (klíč zůstává `shop` aby `urls.shop()` API neměnit)
- Test `__tests__/lib/urls.test.ts:21` musí změnit regex `/shop/` → `/dily/` (single line edit)
- AC2.2 mění očekávaný URL z `localhost:3000/shop` → `localhost:3000/dily`

### Q2 — Batch s #101?

Implementator může #100 + #101 udělat v **jednom commitu** (menší churn, společný code review). Souhlasíš?

**Doporučení:** **Ano** — batch.

### Q3 — `.env.local` manual step

Po deploy fixu user musí ručně vyprázdnit env vars v `.env.local`. **Mám to napsat do post-fix message?**

**Doporučení:** **Ano** — implementator pošle user instrukce v PR description nebo SendMessage.

---

## 14 — Souhrn pro Evžen review

**Co plán řeší:**
- Root cause confirmed: `lib/urls.ts:3-9` hardcoded `inzerce.localhost:3000` (a shop/marketplace stejně)
- Konkrétní fix: path-based fallback v dev (Option b) — žádná NODE_ENV detekce
- Single-file change `lib/urls.ts` + `.env.example` update
- Žádné breaking changes pro 17 consumerů
- Existing test `__tests__/lib/urls.test.ts` zůstává zelený bez editace
- Backwards compatible s prod (env vars set → subdomain URLs jako dříve)
- Forward compatible s #82 PERF Phase 1 (route group split)
- Doporučení batch s #101 (stejný soubor)

**Co plán NEŘEŠÍ (out of scope):**
- Middleware response/request header bug (separate issue, viz #82)
- ✅ `/shop` vs `/dily` canonical decision RESOLVED — viz Q1 (team-lead override `/dily`). Smazání legacy `/shop/page.tsx` zůstává jako separate cleanup task po #104
- Test mocking pro env var dynamic check (vyžaduje komplikovanou Vitest setup)

**Estimate:** S (~30-40 min)
**Risk:** Zero
**Blockery:** Žádné — pouze schválení Option (b) team-leadem

**Status #100 PLAN:** ready_for_review.
