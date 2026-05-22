# QA Report — Task #26: PlatformSwitcher subdomain menu

**Datum:** 2026-04-06  
**Agent:** KONTROLOR  
**Commit:** `7e2c373`  
**Zkontrolováno:** 14 souborů (1 NEW + 13 EDIT)

---

## 1. SIMPLIFY KONTROLA

### `components/ui/PlatformSwitcher.tsx`

- Server component — bez `"use client"` ✅ (schváleno plánem sekce 6)
- `PLATFORMS` array — 4 platformy, centralizovaně, žádné duplicity ✅
- 3 varianty v jednom souboru (`navbar` / `navbar-mobile` / `footer`) — čisté if/else ✅
- `<a>` tagy místo `<Link>` — správně pro cross-origin subdomény ✅
- `urls.*` z `lib/urls.ts` — single source of truth pro URLs ✅
- `aria-current="page"` na aktivní platformě ✅
- `min-h-[44px]` WCAG touch target v `navbar-mobile` variantě ✅
- `mobileLabel` oddělené od `label` — dobré UX (kratší desktop vs. delší mobile popis) ✅

### Duplicity v navbarech
- Všech 13 editovaných souborů volá `<PlatformSwitcher>` — žádné hardcoded `<a href="...carmakler.cz">` linky nezbývají ✅
- `PLATFORMS` definice je 1× v PlatformSwitcher.tsx — nulová duplicita ✅

### Drobnosti (neblokující)
- `urls` import v inzerce/shop Footer.tsx zůstává (správně — stále potřebný pro legal links v bottom baru)
- `theme="dark"` je validní jen u marketplace navbar (ostatní default light) — funkčně OK

---

## 2. DEBUG KONTROLA

### Build
```
npm run build
✓ Compiled successfully in 20.3s
✓ Generating static pages (309/309)
```
**✅ BUILD PASSED**

### Lint
```
npm run lint
✖ 549 problems (10 errors, 539 warnings)
```
Baseline (před task #26): 550 problems.  
Nový stav: **549 problems — o 1 méně** (1 pre-existing warning odstraněn, žádné nové zavedeny).

**✅ LINT PASSED — žádné nové problémy, 1 zlepšení**

---

## 3. REVERZNÍ KONTROLA PROTI PLÁNU

### 3 schválené deviation:

| Deviation | Stav | Poznámka |
|-----------|------|----------|
| Server component místo `"use client"` | ✅ | Plán sekce 6 explicitně připouští, žádný state/useEffect v komponentě |
| Odstraněný `carmakler.cz` fallback v subdomain navbarech | ✅ | Redundantní s PlatformSwitcherem, konzistentní UX |
| Odstraněná "Pro makléře" položka z MainFooter | ✅ | Kariéra není cross-platform link, patří do "O nás" |

### Acceptance criteria (z impl report):

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 1 | `PlatformSwitcher.tsx` existuje, exportuje `PlatformSwitcher` + `PlatformKey` | ✅ | `components/ui/PlatformSwitcher.tsx` |
| 2 | 3 varianty: `navbar`, `navbar-mobile`, `footer` | ✅ | PlatformSwitcher.tsx:66, 92, 124 |
| 3 | `hideCurrent` prop | ✅ | PlatformSwitcher.tsx:62-64 |
| 4 | `theme: "light" \| "dark"` | ✅ | PlatformSwitcher.tsx:47 |
| 5 | `urls.*` + `<a>` tagy (ne `<Link>`) | ✅ | PlatformSwitcher.tsx:1, 72, 105, 131 |
| 6 | `MainNavbar` → `current="main" hideCurrent` | ✅ | components/main/Navbar.tsx:108 |
| 7 | `MainMobileMenu` → `current="main" variant="navbar-mobile" hideCurrent` | ✅ | components/main/MobileMenu.tsx:86 |
| 8 | `MainFooter` → `current="main" variant="footer"` | ✅ | components/main/Footer.tsx:89 |
| 9 | `InzerceNavbar` → `current="inzerce" hideCurrent` | ✅ | components/inzerce/Navbar.tsx:46, 105 |
| 10 | `ShopNavbar` → `current="shop" hideCurrent` | ✅ | components/shop/Navbar.tsx:47, 110 |
| 11 | `MarketplaceNavbar` → `current="marketplace" hideCurrent theme="dark"` | ✅ | components/marketplace/Navbar.tsx:40, 92 |
| 12 | `InzerceFooter` → `current="inzerce" variant="footer"` | ✅ | components/inzerce/Footer.tsx:54 |
| 13 | `ShopFooter` → `current="shop" variant="footer"` | ✅ | components/shop/Footer.tsx:54 |
| 14 | `MarketplaceFooter` → `current="marketplace" variant="footer"` | ✅ | components/marketplace/Footer.tsx:49 |
| 15 | `components/web/Navbar.tsx` migrován + TODO komentář | ✅ | TODO řádky 1-6 přítomny |
| 16 | `components/web/Footer.tsx` migrován + TODO komentář | ✅ | TODO řádky 1-6 přítomny |
| 17 | `components/web/MobileMenu.tsx` migrován + TODO komentář | ✅ | TODO řádky 1-6 přítomny |
| 18 | `npm run build` prošel | ✅ | viz Debug |
| 19 | `components/pwa/TopBar.tsx` beze změny | ✅ | grep: 0 výskytů PlatformSwitcher |
| 20 | `components/ui/index.ts` barrel export | ✅ | index.ts:55-56 |

**Celkem: 20/20 ✅**

### Orphan soubory — synchronicita:

| Soubor | TODO komentář | Migrován (PlatformSwitcher) | Synchronní s main/ |
|--------|-------------|---------------------------|-------------------|
| `components/web/Navbar.tsx` | ✅ řádky 1-6 | ✅ | ✅ |
| `components/web/MobileMenu.tsx` | ✅ řádky 1-6 | ✅ | ✅ |
| `components/web/Footer.tsx` | ✅ řádky 1-6 | ✅ | ✅ |

---

## SOUHRN

| Check | Výsledek |
|-------|---------|
| Simplify | ✅ Čisté, 1 sdílená komponenta, žádné duplicity |
| Build | ✅ PASSED (309/309) |
| Lint | ✅ 549 (-1 oproti baseline 550) |
| 3 approved deviations | ✅ Všechny správně ohodnoceny |
| Reverzní kontrola | ✅ 20/20 |
| Orphan dual-write | ✅ TODO komentáře přítomny, synchronní s main/ |

**Celkové hodnocení: ✅ QA #26 PASS**
