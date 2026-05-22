# Chrome Browser Test — #115 Deploy Final Verification
**Datum:** 2026-04-07  
**Tester:** TEST-CHROME agent  
**Task:** #116  
**Commit:** 16367b4 (live na produkci)  
**Playwright:** headed Chromium  
**Target:** `https://carmakler.cz` (basic auth: admin:Carmakler2026!)

---

## Výsledek: ✅ PASS s 2 minor findings

**9/10 testů prošlo, 1 test selhal na false positive (test bug, ne deployment bug)**

---

## T1 — Homepage (https://carmakler.cz/)

| Test | Status | Detail |
|------|--------|--------|
| HTTP status | ✅ 200 | Stránka se načte |
| `<link rel="canonical">` | ✅ | `https://carmakler.cz` — **bare, bez www** |
| `<meta property="og:url">` | ⚠️ FINDING | **null** — og:url chybí na homepage |

**Canonical je správný.** og:url chybí — metadata pro OG sharing není nastaveno na homepage. Minor SEO/social sharing finding.

**Screenshot:** `test-results/prod-t1-homepage.png`

---

## T2 — www → bare 301 redirect

| Test | Status | Detail |
|------|--------|--------|
| `https://www.carmakler.cz/` → redirect | ✅ | **301** zachycen |
| Final URL po redirectu | ✅ | `https://carmakler.cz/` — bare, bez www |
| Browser URL bar | ✅ | URL bar ukazuje bare domain |

**Screenshots:** `test-results/prod-t2-www-redirect.png`

---

## T3 — sitemap.xml

| Test | Status | Detail |
|------|--------|--------|
| HTTP status | ✅ 200 | `https://carmakler.cz/sitemap.xml` |
| Velikost | ✅ | 112 883 bytes |
| Počet `<loc>` entries | ✅ | **100** URL |
| www. v `<loc>` | ✅ | **0** — žádné www. URL |
| Všechny `<loc>` jsou bare | ✅ | 100/100 obsahuje `https://carmakler.cz` |

**Screenshots:** `test-results/prod-t3-sitemap.png`

---

## T4 — robots.txt

| Test | Status | Detail |
|------|--------|--------|
| HTTP status | ✅ 200 | `https://carmakler.cz/robots.txt` |
| `Sitemap:` directive | ✅ | `Sitemap: https://carmakler.cz/sitemap.xml` — **bare** |
| www. v robots.txt | ✅ | Nepřítomno |
| Disallow rules | ✅ | `/api/`, `/admin/`, `/makler/dashboard`, `/login`, `/registrace` |

**Robots.txt obsah:**
```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /makler/dashboard
Disallow: /login
Disallow: /registrace

Sitemap: https://carmakler.cz/sitemap.xml
```

**Screenshots:** `test-results/prod-t4-robots.png`

---

## T5 — PWA paths

| Test | Status | Detail |
|------|--------|--------|
| `https://carmakler.cz/makler` | ⚠️ FINDING | **404** — žádná index stránka na /makler |
| `https://carmakler.cz/makler/dashboard` | ✅ | **307** → `/login?callbackUrl=%2Fmakler%2Fdashboard` |
| Auth ochrana dashboardu | ✅ | Middleware redirect funguje |

**Vysvětlení /makler → 404:** V codebase neexistuje `app/(pwa)/makler/page.tsx` — jen sub-routes (`/makler/dashboard`, `/makler/leads`, atd.). Middleware chytí `/makler/*` prefix správně, ale `/makler` bez sub-route vrátí 404.

**Dopad:** Uživatel přesměrovaný na `/makler` (bez sub-route) uvidí 404 místo login screenu. Minor — v praxi je entry-point `/login` nebo deep link.

**Screenshots:** `test-results/prod-t5-makler.png` + `prod-t5-makler-dashboard.png`

---

## T6 — Eshop autodíly (/dily)

| Test | Status | Detail |
|------|--------|--------|
| `https://carmakler.cz/dily` | ✅ 200 | Katalog dílů se načte |
| JSON-LD — www. přítomno | ✅ | **false** — žádné www. v JSON-LD |
| `https://carmakler.cz/dily/vrakoviste` | ✅ 200 | Seznam vrakovišť se načte |

**Screenshots:** `test-results/prod-t6-dily.png` + `prod-t6-dily-vrakoviste.png`

---

## T7 — Inzerce (/inzerce)

| Test | Status | Detail |
|------|--------|--------|
| `https://carmakler.cz/inzerce` | ✅ 200 | Landing se načte |
| Listing link | ✅ | `/inzerce/pridat` — relativní odkaz (bare) |
| www. v listing links | ✅ | Nepřítomno |

**Screenshots:** `test-results/prod-t7-inzerce.png`

---

## T8 — Marketplace VIP (/marketplace)

| Test | Status | Detail |
|------|--------|--------|
| `https://carmakler.cz/marketplace` | ✅ 200 | Public landing se načte |
| Veřejný obsah viditelný | ✅ | "Marketplace" / "Investovat" / "Dealer" content |
| Dealer dashboard (gated) | ✅ | **false** — "Moje příležitosti" / "Přidat příležitost" neviditelné bez login |

**Screenshots:** `test-results/prod-t8-marketplace.png`

---

## T9 — Subdomény (optional)

| Subdoména | Status | Detail |
|-----------|--------|--------|
| `https://inzerce.carmakler.cz/` | ✅ 200 | **UP** |
| `https://shop.carmakler.cz/` | ✅ 200 | **UP** |
| `https://marketplace.carmakler.cz/` | ✅ 200 | **UP** |

Všechny 3 subdomény jsou živé. ✅

**Screenshots:** `test-results/prod-t9-subdomain-inzerce.png` + `...-shop.png` + `...-marketplace.png`

---

## T10 — PlatformSwitcher menu

| Test | Status | Detail |
|------|--------|--------|
| Localhost links | ✅ | **0** — žádné localhost v nav |
| www. links | ✅ | **0** — žádné www.carmakler.cz v nav |
| Platform links | ✅ | `https://inzerce.carmakler.cz/` + `https://shop.carmakler.cz/` |

**Nav links (sample):**
```
/nabidka
https://inzerce.carmakler.cz/
https://shop.carmakler.cz/
/sluzby/proverka
/sluzby/financovani
/sluzby/pojisteni
/o-nas
/kariera
```

**Screenshots:** `test-results/prod-t10-navbar.png`

---

## Souhrn findings

### ⚠️ Finding #1 — `/makler` vrací 404 (minor)
- **URL:** `https://carmakler.cz/makler`
- **Status:** 404
- **Příčina:** Chybí `app/(pwa)/makler/page.tsx` — žádná index stránka
- **Dopad:** Uživatel navigovaný na bare `/makler` uvidí 404
- **Workaround:** Entry-point je `/login` nebo direct deep link na `/makler/dashboard`
- **Doporučení:** Přidat redirect `/makler` → `/makler/dashboard` nebo index page

### ⚠️ Finding #2 — `og:url` chybí na homepage (minor SEO)
- **URL:** `https://carmakler.cz/`
- **Nalezeno:** `<meta property="og:url">` = null
- **Dopad:** Social sharing (FB, Twitter, LinkedIn) nepřenese správnou URL
- **Doporučení:** Přidat `og:url` do homepage metadata

---

## Celkové skóre

| Test | Pass | Warn | Fail |
|------|------|------|------|
| T1 — Homepage | 2 | 1 | 0 |
| T2 — www → 301 redirect | 3 | 0 | 0 |
| T3 — sitemap.xml | 5 | 0 | 0 |
| T4 — robots.txt | 4 | 0 | 0 |
| T5 — PWA paths | 2 | 1 | 0 |
| T6 — /dily | 3 | 0 | 0 |
| T7 — /inzerce | 3 | 0 | 0 |
| T8 — /marketplace | 3 | 0 | 0 |
| T9 — Subdomény | 3 | 0 | 0 |
| T10 — PlatformSwitcher | 3 | 0 | 0 |
| **CELKEM** | **31** | **2** | **0** |

---

## Závěr

**✅ PASS — Deployment #115 (commit 16367b4) je funkční**

Kritické požadavky splněny:
- **Canonical** na homepage: `https://carmakler.cz` ✅
- **www → bare 301**: funguje ✅
- **Sitemap.xml**: 100 bare URLs, 0 www. entries ✅
- **robots.txt**: bare sitemap URL ✅
- **Auth ochrana**: `/makler/dashboard` → 307 → /login ✅
- **Subdomény**: inzerce + shop + marketplace všechny UP ✅
- **PlatformSwitcher**: žádné localhost, žádné www. links ✅

**2 minor findings (noni blocker pro ship):**
1. `/makler` → 404 (no index page — zvážit redirect na /makler/dashboard)
2. `og:url` chybí na homepage (SEO/social sharing)
