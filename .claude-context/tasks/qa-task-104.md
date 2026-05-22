# QA Report — Task #108: Batch #104 (commits 5f7cac1 + c77eb52)

**Datum:** 2026-04-07  
**Agent:** KONTROLOR  
**Commits:** `5f7cac1` (#100 — lib/urls.ts dev menu fix), `c77eb52` (#101 — Marketplace remove from menu)

---

## SEKCE 1 — Simplify kontrola

### `lib/urls.ts` — `buildPlatformUrl()` helper

```typescript
function buildPlatformUrl(subdomainUrl: string, pathPrefix: string, path: string): string {
  const cleanPath = normalizePath(path);
  if (subdomainUrl) {
    return `${subdomainUrl}${cleanPath}`;           // Branch A: prod (env var set)
  }
  if (cleanPath === "/") return pathPrefix;           // Branch B1: root path, no trailing /
  return `${pathPrefix}${cleanPath}`;                // Branch B2: sub-path
}
```

**Hodnocení:** Jednoduchá a čitelná 2-branch logika — přesně to co plan-task-100.md Option (b) navrhoval. Žádná zbytečná složitost. `normalizePath()` helper je trivial (1 podmínka). Root-path guard `if (cleanPath === "/") return pathPrefix` eliminuje trailing slash (`/inzerce/` → `/inzerce`) — správný UX detail. ✅

### `PlatformSwitcher.tsx` — delete-only (Option a)

Odstraněn 1 záznam z `PLATFORMS` array (marketplace entry, původně řádky 31-36), nahrazen vysvětlujícím komentářem. Žádná složitost přidána. Nejjednodušší možná implementace. ✅

---

## SEKCE 2 — Debug kontrola

### Build
```
npm run build
✓ Compiled successfully in 23.5s
✓ Generating static pages (313/313)
```
**✅ BUILD PASSED — 313 routes** (+1 oproti předchozímu baseline 312 je z #87a SEO slice, nikoliv z tohoto batche)

### Lint
```
npm run lint
✖ 538 problems (0 errors, 538 warnings)
```
**✅ LINT PASSED — 0 errors** (538 warnings je aktuální baseline — shodný s post-#93 stavem)

### Vitest — `__tests__/lib/urls.test.ts`
```
npx vitest run __tests__/lib/urls.test.ts
Test Files: 1 passed (1)
Tests:      6 passed (6)
```
**✅ 6/6 PASS**

### Vitest — full suite
```
npx vitest run
Test Files: 15 passed (15)
Tests:      141 passed (141)
```
**✅ 141/141 PASS — žádná regrese**

### TypeScript
```
npx tsc --noEmit → 0 errors
```
**✅ CLEAN**

### Bonus — marketplace grep v non-marketplace komponentách
```bash
grep -rn "marketplace" components/web components/main components/inzerce components/shop --include="*.tsx"
```
**Výsledky:** Všechny nalezené výskyty jsou výhradně v `components/web/marketplace/` — explicitně povolený scope:
- `components/web/marketplace/ApplyForm.tsx` — marketplace apply API + text ✅ (in-scope)
- `components/web/marketplace/InvestModal.tsx` — marketplace investments API ✅ (in-scope)
- `components/web/marketplace/OpportunityCard.tsx` — marketplace route prefix ✅ (in-scope)
- `components/web/marketplace/OpportunityWizard.tsx` — marketplace create + redirect ✅ (in-scope)

**Žádný hardcoded marketplace odkaz v `components/web/Navbar.tsx`, `MobileMenu.tsx`, `Footer.tsx`, `components/main/*`, `components/inzerce/*`, `components/shop/*`** ✅

---

## SEKCE 3 — Reverzní kontrola (task #104 Acceptance Criteria)

| # | Acceptance criterion | Stav | Verifikace |
|---|---------------------|------|-----------|
| 1 | Klik "Inzerce" → `/inzerce` (dev, bez env var) | ✅ | `urls.inzerce("/")` = `buildPlatformUrl("", "/inzerce", "/")` → `"/inzerce"` (žádný trailing slash) |
| 2 | Klik "Eshop autodíly" → `/dily` (NE `/shop`!) | ✅ | `PATH_PREFIX.shop = "/dily"` (ř. 31) + `urls.shop("/")` → `"/dily"` |
| 3 | Marketplace NIKDE v PlatformSwitcher/navbarech/footerech | ✅ | PLATFORMS array: main + inzerce + shop (3 items). Marketplace grep → 0 matches mimo `components/web/marketplace/*` |
| 4 | `http://localhost:3000/marketplace` přímý URL stále funguje | ✅ | `app/(web)/marketplace/page.tsx` nedotčen (není v commitu) |
| 5 | Prod env vars → subdomain URLs fungují (backwards compat) | ✅ | `buildPlatformUrl(subdomainUrl, ...)` — pokud `subdomainUrl` truthy → vrátí `subdomainUrl + path` |
| 6 | PlatformSwitcher zůstává server component (žádný `"use client"`) | ✅ | Grep `"use client"` v PlatformSwitcher.tsx → 0 matches |
| 7 | `npm run build` zelený | ✅ | 313/313 |
| 8 | `npm run lint` zelený | ✅ | 0 errors |
| 9 | `__tests__/lib/urls.test.ts` zelený | ✅ | 6/6 pass |

### Override checks

| Override | Verifikace | Stav |
|----------|-----------|------|
| `PATH_PREFIX.shop = "/dily"` (NE `/shop`) | `lib/urls.ts:31` — `shop: "/dily"` + komentář `⚠️ canonical eshop URL` | ✅ |
| Option (a) delete-only (NE plánovačovo b' useSession) | Commit `c77eb52` — pouze 1 entry smazána z PLATFORMS, žádný useSession | ✅ |
| Žádný `"use client"` v PlatformSwitcher | grep 0 matches | ✅ |

### Detailní verifikace `lib/urls.ts`

**Path normalizace:**
- `urls.inzerce("/")` → `normalizePath("/")` = `"/"` → `cleanPath === "/"` → return `"/inzerce"` ✅
- `urls.inzerce("/katalog")` → `"/inzerce/katalog"` ✅
- `urls.inzerce("katalog")` → `normalizePath("katalog")` = `"/katalog"` → `"/inzerce/katalog"` ✅
- `urls.shop("/")` → `"/dily"` ✅ (override Q1 splněn)

**Dev fallback (env vars prázdné):**
- `INZERCE_SUBDOMAIN_URL = process.env.NEXT_PUBLIC_INZERCE_URL || ""` — prázdný string → falsy → path-based ✅
- Dtto pro SHOP a MARKETPLACE ✅

**`.env.example`:**
- Řádky 26-28: `NEXT_PUBLIC_INZERCE_URL=`, `NEXT_PUBLIC_SHOP_URL=`, `NEXT_PUBLIC_MARKETPLACE_URL=` — prázdné hodnoty ✅
- Komentáře řádky 23-25 vysvětlují prod subdomain setup ✅

**`urls.marketplace()` v lib/urls.ts zachováno:**
- Řádek 60: `marketplace: (path: string = "/") => buildPlatformUrl(MARKETPLACE_SUBDOMAIN_URL, PATH_PREFIX.marketplace, path)` ✅
- Potřeba pro interní VIP navigate a direct linking

**Commit #101 — `components/ui/PlatformSwitcher.tsx` zachovány:**
- `PlatformKey` type union stále obsahuje `"marketplace"` (pro kompatibilitu s callers) ✅
- `href: urls.marketplace("/")` v PLATFORMS odstraněno ✅
- Komentář vysvětlující záměr + pokyn `NEPRIDÁVAT zpět bez konzultace` ✅

### Nesmazané per task `NESMAZAT` checklist

| Item | Stav |
|------|------|
| `app/(web)/marketplace/page.tsx` (landing) | ✅ nedotčen |
| `urls.marketplace()` v lib/urls.ts | ✅ přítomen (ř. 60) |
| `app/(web)/marketplace/dealer/*` + `investor/*` | ✅ nedotčeny |
| marketplace route v middleware.ts | ✅ nedotčen |
| `components/marketplace/Navbar.tsx` + `Footer.tsx` | ✅ nedotčeny |
| `app/sitemap.ts` marketplace URL | ✅ nedotčen |

---

## SOUHRN

| Sekce | Výsledek |
|-------|---------|
| Simplify | ✅ `buildPlatformUrl()` čistý 2-branch helper. PlatformSwitcher delete-only. |
| Build | ✅ 313/313 |
| Lint | ✅ 0 errors (538 warnings = aktuální baseline) |
| Vitest urls.test.ts | ✅ 6/6 |
| Vitest full | ✅ 141/141 |
| TypeScript | ✅ 0 errors |
| Marketplace grep | ✅ 0 matches mimo povolený scope |
| Acceptance criteria #104 (9 bodů) | ✅ Všechny splněny |
| Override checks (3 body) | ✅ Všechny splněny |
| NESMAZAT checklist (6 položek) | ✅ Vše zachováno |

---

## VERDICT: **PASS** ✅

Oba commity jsou správně implementovány:
- `5f7cac1` (#100): `lib/urls.ts` env-var-aware fallback + `PATH_PREFIX.shop = "/dily"` + `.env.example` aktualizace. Dev menu přestane odkazovat na ERR_NAME_NOT_RESOLVED subdomény.
- `c77eb52` (#101): Marketplace smazán z PLATFORMS array — 1 line change, server component zachován, přímý URL stále funguje.

**Žádné blockers. Žádné minor findings.**
