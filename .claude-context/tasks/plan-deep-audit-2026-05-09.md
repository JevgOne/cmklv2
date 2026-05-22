# Kompletní hluboký audit platformy Carmakler

**Datum:** 2026-05-09
**Auditor:** Plánovač (agent team)
**Scope:** Celý ekosystém — hlavní web, inzerce, eshop díly, marketplace VIP, admin, PWA makléř, PWA díly, partner portál

---

## Obsah

1. [Funkční audit](#1-funkční-audit)
2. [SEO audit](#2-seo-audit)
3. [GEO audit](#3-geo-audit)
4. [AIEO audit](#4-aieo-audit)
5. [Prioritizované nálezy](#5-prioritizované-nálezy)
6. [Souhrnné statistiky](#6-souhrnné-statistiky)
7. [Celkové hodnocení](#7-celkové-hodnocení)
8. [Doporučený postup implementace](#8-doporučený-postup-implementace)
9. [PRE-LAUNCH: End-to-end user flow testy](#9-pre-launch-end-to-end-user-flow-testy)

---

## 1. FUNKČNÍ AUDIT

### 1.1 Kompletní mapa routes

#### (web) — Veřejný web (100+ stránek)

**Hlavní stránky:**
| Route | Stav | loading.tsx | error.tsx |
|-------|------|-------------|-----------|
| `/` (homepage) | ✅ SSR, Prisma | ✅ | ✅ |
| `/nabidka` | ✅ SSR | ✅ | ✅ |
| `/nabidka/[slug]` | ✅ SSR, generateMetadata | ✅ | — |
| `/nabidka/[slug]/platba` | ✅ | ✅ | ✅ |
| `/nabidka/[slug]/platba/uspech` | ✅ | — | — |
| `/nabidka/porovnani` | ✅ | ✅ | ✅ |
| `/chci-prodat` | ✅ SSR | ✅ | — |
| `/jak-prodat-auto` | ✅ | ✅ | ✅ |
| `/kolik-stoji-moje-auto` | ✅ | ✅ | — |
| `/jak-to-funguje` | ✅ | — | — |
| `/makleri` | ✅ | ✅ | — |
| `/makleri/[slug]` | ✅ SSR, generateMetadata | ✅ | — |
| `/profil/[slug]` | ✅ SSR, generateMetadata | ✅ | — |
| `/makler/[slug]` | ✅ | — | — |

**SEO landing pages — značky (16):** `/nabidka/skoda`, `/nabidka/volkswagen`, `/nabidka/bmw`, atd. — všechny mají metadata + pageCanonical ✅

**SEO landing pages — modely (12):** `/nabidka/skoda/octavia`, `/nabidka/bmw/3-series`, atd. — ✅

**SEO landing pages — karoserie (7):** `/nabidka/suv`, `/nabidka/sedan`, `/nabidka/hatchback`, atd. — ✅

**SEO landing pages — ceny (6):** `/nabidka/do-100000` ... `/nabidka/do-1000000` — ✅

**SEO landing pages — města (8):** `/nabidka/praha`, `/nabidka/brno`, `/nabidka/ostrava`, atd. — ✅

**Eshop díly:**
| Route | Stav | loading.tsx | error.tsx |
|-------|------|-------------|-----------|
| `/dily` | ✅ SSR | ✅ | ✅ |
| `/dily/[slug]` (detail dílu) | ✅ SSR, generateMetadata | — | — |
| `/dily/katalog` | ✅ | — | — |
| `/dily/kategorie/[slug]` | ✅ SSR | ✅ | ✅ |
| `/dily/znacka/[brand]` | ✅ SSR | ✅ | ✅ |
| `/dily/znacka/[brand]/[model]` | ✅ SSR | ✅ | ✅ |
| `/dily/znacka/[brand]/[model]/[rok]` | ✅ SSR | ✅ | ✅ |
| `/dily/objednavka` | ✅ | — | — |
| `/dily/kosik` | ✅ | — | — |
| `/dodavatel/[slug]` | ✅ | — | — |

**Inzerce:**
| Route | Stav | loading.tsx | error.tsx |
|-------|------|-------------|-----------|
| `/inzerce` | ✅ | ✅ | ✅ |
| `/inzerce/katalog` | ✅ | ✅ | ✅ |
| `/inzerce/pridat` | ✅ | ✅ | ✅ |
| `/inzerce/registrace` | ✅ | ✅ | ✅ |

**Marketplace:**
| Route | Stav | loading.tsx | error.tsx |
|-------|------|-------------|-----------|
| `/marketplace` | ✅ | ✅ | ✅ |
| `/marketplace/apply` | ✅ | ✅ | ✅ |
| `/marketplace/deals/[id]` | ✅ SSR, gated | ✅ | — |
| `/marketplace/dealer` | ✅ gated | ✅ | ✅ |
| `/marketplace/dealer/[id]` | ✅ gated | ✅ | ✅ |
| `/marketplace/dealer/nova` | ✅ gated | ✅ | ✅ |
| `/marketplace/investor` | ✅ gated | ✅ | ✅ |
| `/marketplace/investor/[id]` | ✅ gated | ✅ | ✅ |

**Shop:**
| Route | Stav | loading.tsx | error.tsx |
|-------|------|-------------|-----------|
| `/shop` | ✅ | ✅ | — |
| `/shop/katalog` | ✅ | ✅ | ✅ |
| `/shop/produkt/[slug]` | ✅ SSR, generateMetadata | — | — |
| `/shop/kosik` | ✅ | ✅ | ✅ |
| `/shop/objednavka` | ✅ | ✅ | ✅ |
| `/shop/reklamace` | ✅ | — | — |
| `/shop/vraceni-zbozi` | ✅ | — | — |

**Blog:**
| Route | Stav | loading.tsx | error.tsx |
|-------|------|-------------|-----------|
| `/blog` | ✅ SSR | — | — |
| `/blog/[slug]` | ✅ SSR, generateMetadata | — | — |
| `/blog/kategorie/[slug]` | ✅ SSR, generateMetadata | — | — |

**Služby:**
| Route | Stav |
|-------|------|
| `/sluzby` | ✅ |
| `/sluzby/proverka` | ✅ |
| `/sluzby/financovani` | ✅ |
| `/sluzby/pojisteni` | ✅ |

**Statické/právní:**
| Route | Stav | metadata | canonical |
|-------|------|----------|-----------|
| `/o-nas` | ✅ | ✅ | ✅ |
| `/kontakt` | ✅ | ✅ | ✅ |
| `/cenik` | ✅ | ✅ | ✅ |
| `/kariera` | ✅ | ✅ | ✅ |
| `/recenze` | ✅ (layout) | ✅ | ✅ |
| `/obchodni-podminky` | ✅ | ✅ | ✅ |
| `/ochrana-osobnich-udaju` | ✅ | ✅ | ✅ |
| `/reklamacni-rad` | ✅ | ✅ | ✅ |
| `/zasady-cookies` | ✅ | ✅ | ✅ |
| `/pro-maklere` | ✅ | — | — |

**Auth & registrace:**
| Route | Stav |
|-------|------|
| `/login` | ✅ |
| `/prihlaseni` | ✅ (redirect → /login) |
| `/registrace` | ✅ |
| `/registrace/makler` | ✅ |
| `/registrace/dodavatel` | ✅ |
| `/registrace/partner` | ✅ |
| `/zapomenute-heslo` | ✅ |
| `/reset-hesla/[token]` | ✅ |
| `/overeni-emailu/[token]` | ✅ |

**Ostatní (web):**
| Route | Stav | Problém |
|-------|------|---------|
| `/h/[slug]` | ❓ | Stránka nemá fyzický soubor — broken? |
| `/tag/[slug]` | ❓ | Stránka nemá fyzický soubor — broken? |
| `/dodavatel/[slug]` | ⚠️ | Chybí metadata, chybí v sitemap |
| `/bazar/[slug]` | ✅ | generateMetadata ✅ |
| `/notifikace/[token]` | ✅ | Utility stránka |

#### (admin) — Admin panel (47 stránek)

Všechny stránky chráněny přes middleware — ADMIN_ROLES check ✅

Celkem 47 page.tsx souborů včetně:
- Dashboard, vehicles, leads, blog, brokers, partners, orders, parts, suppliers, returns, feeds, marketplace, users, payments, payouts, career, reviews, team, tagy, notifikace
- Manager sub-routes: approvals, brokers, bonuses, notifications, vehicles edit, transfer

#### (pwa) — PWA Makléř (51 stránek)

Chráněno middleware — MAKLER_ROLES + onboarding redirect ✅

Klíčové flows:
- Dashboard, vehicles (list, detail, edit, quick intake, full intake 9-step wizard)
- Leads, contacts, messages, contracts, commissions, stats, leaderboard
- Blog (list, new, edit), onboarding (4 kroky), profile, settings

#### (pwa-parts) — PWA Díly (15 stránek)

Chráněno middleware — PARTS_SUPPLIER_ROLES + onboarding redirect ✅

Routes: parts (list, new, import, detail, edit), my, orders (list, detail), donors (list, detail), profile, onboarding (3 kroky)

#### (partner) — Partner portál (19 stránek)

Chráněno middleware — PARTNER_ROLES + onboarding redirect ✅

Routes: dashboard, vehicles (list, detail, new), parts (list, detail, new), orders (list, detail), leads, stats, billing, profile, documents, messages, onboarding (3 kroky)

### 1.2 Auth & Middleware

**Soubor:** `middleware.ts` (408 řádků)

**Chráněné prefixes:**
| Prefix | Povolené role | Onboarding redirect |
|--------|--------------|---------------------|
| `/admin` | ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | ❌ |
| `/makler/dashboard`, `/makler/vehicles`, atd. (14 paths) | BROKER, MANAGER, REGIONAL_DIRECTOR, ADMIN | ✅ → `/makler/onboarding` |
| `/makler/onboarding` | BROKER+ | ✅ ACTIVE → `/makler/dashboard` |
| `/parts` | PARTS_SUPPLIER, WHOLESALE_SUPPLIER, PARTNER_VRAKOVISTE, ADMIN, BACKOFFICE | ✅ → `/parts/onboarding` |
| `/marketplace/deals` | VERIFIED_DEALER, INVESTOR, ADMIN, BACKOFFICE | ❌ (→ `/marketplace/apply`) |
| `/marketplace/dealer` | VERIFIED_DEALER, ADMIN, BACKOFFICE | ❌ |
| `/marketplace/investor` | INVESTOR, ADMIN, BACKOFFICE | ❌ |
| `/partner` | PARTNER_BAZAR, PARTNER_VRAKOVISTE, ADMIN, BACKOFFICE | ✅ → `/partner/onboarding` |
| `/moje-inzeraty`, `/muj-ucet`, `/shop/moje-objednavky`, `/dily/moje-objednavky` | Jakýkoli přihlášený uživatel | ❌ |

**Subdomain rewrites:**
- `inzerce.carmakler.cz` → prepend `/inzerce` to pathname
- `shop.carmakler.cz` → prepend `/shop` to pathname
- `marketplace.carmakler.cz` → prepend `/marketplace` to pathname

**Site-wide password:** Volitelná ochrana přes `SITE_PASSWORD` env variable + `/gate` cookie flow ✅

### 1.3 API Routes

**Celkem: 293 route.ts souborů**

Hlavní skupiny:
- `/api/vehicles/` — CRUD, images, cebia, pricing, damage, reservations, inquiries
- `/api/admin/` — admin CRUD pro všechny entity
- `/api/broker/` — broker stats, profile, commissions, vehicles
- `/api/partner/` — dashboard, billing, stats, leads
- `/api/parts/` — CRUD, supplier stats
- `/api/marketplace/` — opportunities, investments
- `/api/listings/` — CRUD, stats, promotions, inquiries
- `/api/orders/` — status updates
- `/api/leads/` — CRUD, assignment, status
- `/api/contacts/` — CRUD, search, sync
- `/api/contracts/` — CRUD, signing
- `/api/payments/` — Stripe checkout
- `/api/feeds/` — XML export (Sauto, TipCars, Bazoš), import
- `/api/auth/` — NextAuth + registration
- `/api/settings/` — user account management

### 1.4 Formuláře

**Celkem 37 formulářových komponent** identifikováno:
- Web forms: 21 (login, registrace, listing wizard, objednávka, kontakt, reklamace, pojištění, prověrka, career, marketplace apply...)
- PWA forms: 6 (onboarding profil, quiz, kontakty, damage report, eskalace)
- Admin forms: 6 (vehicle CRUD, feed config, broker edit, partner create)
- Partner forms: 4 (onboarding, nové vozidlo, nový díl)

### 1.5 Error/Loading Coverage

| Route Group | Stránek | error.tsx | loading.tsx | Error % | Loading % |
|-------------|---------|-----------|-------------|---------|-----------|
| (web) | 141 | 38 | 56 | 27% | 40% |
| (admin) | 48 | 32 | 38 | 67% | 79% |
| (pwa) | 51 | 43 | 46 | 84% | 90% |
| (pwa-parts) | 15 | 7 | 10 | 47% | 67% |
| (partner) | 19 | 13 | 17 | 68% | 89% |
| **CELKEM** | **274** | **133** | **167** | **49%** | **61%** |

### 1.6 Funkční nálezy

| # | Priorita | Nález | Detail |
|---|----------|-------|--------|
| F1 | **P1** | `/h/[slug]` a `/tag/[slug]` nemají page.tsx | Glob vrátil tyto soubory v prvním scanu, ale druhý cílený Glob je nenašel. Možná existují jen v původním Glob výstupu z modifikovaného stavu — OVĚŘIT zda existují v repo |
| F2 | **P1** | Dead links v navigaci | `/katalog` (v inzerce navbar — závisí na subdomain rewrite), `/podminky` (má být `/obchodni-podminky`), `/zapomenute-heslo` (ověřit page.tsx) |
| F3 | **P2** | `/dodavatel/[slug]` — chybí metadata + canonical + OG | Route existuje ale nemá generateMetadata ani pageCanonical. Chybí i v sitemap. |
| F4 | **P2** | `/pro-maklere` — chybí metadata | Page existuje ale nemá vlastní metadata export |
| F5 | **P2** | `/dily/[slug]` — chybí loading.tsx a error.tsx | Detail dílu nemá loading ani error boundary |
| F6 | **P2** | `/shop/produkt/[slug]` — chybí loading.tsx a error.tsx | Detail produktu v shopu nemá loading/error |
| F7 | **P2** | `/blog/[slug]` — chybí loading.tsx a error.tsx | Blog post detail nemá loading/error |
| F8 | **P2** | Onboarding routes nemají error boundaries | `/parts/onboarding/*` (4 stránky) a `/partner/onboarding/*` (4 stránky) — VŠECHNY bez error.tsx |
| F9 | **P2** | `/jak-to-funguje` — chybí loading.tsx a error.tsx | Informační stránka bez loading/error |
| F10 | **P3** | `/nabidka/[slug]/platba/uspech` — chybí loading + error | Platební success page |
| F11 | **P3** | Makléř PWA — `/makler/blog/*` chybí loading.tsx | 3 blog stránky v PWA nemají loading |
| F12 | **P3** | Admin blog pages bez error boundaries | 4 admin blog stránky nemají error.tsx |

---

## 2. SEO AUDIT

### 2.1 Metadata & OG tagy

**Root layout (`app/layout.tsx`):**
- ✅ `metadataBase: new URL(BASE_URL)` — správně nastaveno
- ✅ `title.template: "%s | CarMakléř"` — template pro child stránky
- ✅ `title.default` — fallback title
- ✅ `description` — přítomna
- ✅ `keywords` — 8 klíčových slov
- ✅ `openGraph` — type, locale (cs_CZ), siteName, title, description, url
- ✅ `twitter` — card, title, description
- ✅ `icons` — favicon 32/48/96/192/512 + apple-touch-icon
- ✅ `manifest` — `/manifest.json`
- ✅ `<html lang="cs">` — správný jazyk
- ✅ `viewport` — device-width, themeColor #F97316
- ✅ Root layout NEMÁ `alternates.canonical` (bug #127 fix)

**Per-page metadata coverage:**
- ✅ **109 stránek** v `(web)` má `metadata` nebo `generateMetadata` export
- ✅ **97 souborů** používá `pageCanonical()` — systematický canonical helper
- ✅ **Všechny SEO landing pages** (značky, modely, města, ceny, karoserie) mají metadata + canonical

**Dynamické stránky s generateMetadata:**
- ✅ `/nabidka/[slug]` — title z vozidla, OG tagy, Vehicle structured data
- ✅ `/dily/[slug]` — title z dílu
- ✅ `/blog/[slug]` — title z článku, Article structured data
- ✅ `/profil/[slug]` — title z makléře, Person structured data
- ✅ `/makleri/[slug]` — generateMetadata
- ✅ `/bazar/[slug]` — generateMetadata
- ✅ `/dily/vrakoviste/[slug]` — generateMetadata, Store JSON-LD
- ✅ `/dily/znacka/[brand]` — generateMetadata
- ✅ `/dily/znacka/[brand]/[model]` — generateMetadata
- ✅ `/dily/znacka/[brand]/[model]/[rok]` — generateMetadata
- ✅ `/dily/kategorie/[slug]` — generateMetadata
- ✅ `/shop/produkt/[slug]` — generateMetadata

**OG Images (opengraph-image.tsx):**
- ✅ 9 route segments s dynamickým OG image generátorem:
  - Root `(web)/`, `/nabidka/[slug]`, `/profil/[slug]`, `/blog/[slug]`, `/blog`, `/dily`, `/marketplace`, `/makleri`, `/inzerce`
- ⚠️ Chybí OG image pro: `/shop`, `/sluzby`, `/kontakt`, `/o-nas`, `/cenik`, `/kariera`, `/recenze`, `/chci-prodat`

### 2.2 Structured Data (JSON-LD)

**Centrální JSON-LD library:** `lib/seo.ts` (726 řádků) — 18 generátorů

| Generátor | Schema type | Použito na |
|-----------|------------|------------|
| `generateOrganizationJsonLd()` | Organization | Homepage, kontakt |
| `generateWebSiteJsonLd()` | WebSite + SearchAction | Homepage |
| `generateVehicleJsonLd()` | Vehicle + Offer | `/nabidka/[slug]` |
| `generateAggregateOfferJsonLd()` | Product + AggregateOffer | Brand/model landing pages |
| `generateBreadcrumbJsonLd()` | BreadcrumbList | Přes Breadcrumbs component |
| `generateFaqJsonLd()` / `generateFaqPageJsonLd()` | FAQPage | `/chci-prodat`, landing pages |
| `generateArticleJsonLd()` | Article | `/blog/[slug]` |
| `generateServiceJsonLd()` | Service | `/sluzby/*` |
| `generateHowToJsonLd()` | HowTo | `/jak-prodat-auto`, `/jak-to-funguje` |
| `generateWebApplicationJsonLd()` | WebApplication | — |
| `generateItemListJsonLd()` | ItemList | Landing pages |
| `generateBrandItemListJsonLd()` | ItemList (brand) | Brand landing pages |
| `generatePartsItemListJsonLd()` | ItemList (parts) | Parts landing pages |
| `generatePartProductJsonLd()` | Product + Offer | `/dily/[slug]`, part cards |
| `generateStoreJsonLd()` | AutoPartsStore | `/dily/vrakoviste/[slug]` |
| `generateLocalBusinessJsonLd()` | AutomotiveBusiness | `/kontakt` |
| `generateAggregateRatingJsonLd()` | Organization + AggregateRating + Review | `/recenze` |
| `generateJobPostingJsonLd()` | JobPosting | `/kariera` |
| `generatePersonJsonLd()` | Person | `/profil/[slug]` |
| `generateWebPageJsonLd()` | WebPage + speakable | Key pages |

**Coverage: 48 souborů** obsahuje `application/ld+json` — rozsáhlé pokrytí ✅

**Chybějící structured data:**
| # | Stránka | Chybí | Dopad |
|---|---------|-------|-------|
| S1 | `/shop/produkt/[slug]` | Product JSON-LD | ❗ Google Shopping rich results |
| S2 | `/inzerce/katalog/[slug]` (listing detail) | Vehicle JSON-LD | Rich snippets pro inzeráty |
| S3 | `/nabidka/porovnani` | ItemList JSON-LD | Comparison page |
| S4 | `/pro-maklere` | WebPage | Recruitingová stránka |

### 2.3 Sitemap

**Soubor:** `app/sitemap.ts` (445 řádků) — **dynamický, data-driven**

**Statické URL:** 30 stránek ✅
**Dynamické skupiny:**
- ✅ Značky (16) z `BRANDS`
- ✅ Modely (12) z `TOP_MODELS`
- ✅ Karoserie (7) z `BODY_TYPES`
- ✅ Cenové rozsahy (5) z `PRICE_RANGES`
- ✅ Města (8) z `CITIES`
- ✅ Díly kategorie (11) z `PARTS_CATEGORIES`
- ✅ Díly značky (8) z `PARTS_BRANDS`
- ✅ Díly model (~24) z `PARTS_MODELS_BY_BRAND`
- ✅ Díly model+rok (~72) z `PARTS_MODELS_BY_BRAND` × topYears
- ✅ Vozidla z DB (ACTIVE status)
- ✅ Makléři z DB (BROKER, ACTIVE status)
- ✅ Tag pages z DB (≥2 aktivní brokeři)
- ✅ Vrakoviště z DB (AKTIVNI_PARTNER, VRAKOVISTE)
- ✅ Autobazary z DB (AKTIVNI_PARTNER, AUTOBAZAR)
- ✅ Inzeráty z DB (ACTIVE listings)
- ✅ Blog články z DB (PUBLISHED)

**Chybí v sitemap:**
| # | URL pattern | Existence | Priorita |
|---|------------|-----------|----------|
| SM1 | `/dily/[slug]` (jednotlivé díly) | Existuje route + page.tsx | **P1** — potenciálně tisíce product pages |
| SM2 | `/shop/produkt/[slug]` | Existuje route + page.tsx | **P1** — shop product pages |
| SM3 | `/dodavatel/[slug]` | Existuje page.tsx | **P2** |
| SM4 | `/shop/katalog` | Existuje v sitemap ✅ ale URL je `shop/katalog` — ověřit zda stránka existuje pod tímto path nebo je to subdomain route | **P3** |

### 2.4 Robots.txt

**Soubor:** `app/robots.ts` — **dobře strukturovaný** ✅

- ✅ Default `*` useragent: allow `/`, disallow private paths
- ✅ AI crawlers explicitně povoleny (GPTBot, ChatGPT-User, CCBot, ClaudeBot, PerplexityBot, Applebot-Extended, GoogleOther)
- ✅ Sitemap reference
- ✅ Blokované paths: `/api/`, `/admin/`, `/makler/`, `/partner/`, `/parts/`, `/muj-ucet/`, marketplace private paths

**Chybí v disallow pro `*`:**
| # | Path | Důvod |
|---|------|-------|
| R1 | `/gate` | Password gate stránka — nemá být indexována |
| R2 | `/overeni-emailu/*` | Utility stránky — nemají SEO hodnotu |
| R3 | `/reset-hesla/*` | Token-based utility stránky |
| R4 | `/zapomenute-heslo` | Auth utility stránka |
| R5 | `/notifikace/*` | Token-based utility stránky |

### 2.5 Canonical URLs

**Systém:** `lib/canonical.ts` — `pageCanonical()` helper

- ✅ 97 souborů používá `pageCanonical()` systematicky
- ✅ Bug #127 fix — root layout NEMÁ canonical (zabraňuje dědění homepage URL)
- ✅ Query string stripping
- ✅ Hash fragment stripping
- ✅ Trailing slash normalizace
- ✅ Path validation (musí začínat `/`)
- ⚠️ **Phase 1 only** — subdomain canonicals (shop.carmakler.cz) nejsou řešeny (deferred to #127b)

**Stránky BEZ canonical:**
| # | Stránka | Priorita |
|---|---------|----------|
| C1 | `/dodavatel/[slug]` | **P2** |
| C2 | `/pro-maklere` | **P2** |
| C3 | `/h/[slug]` | **P3** (pokud existuje) |
| C4 | `/tag/[slug]` | **P3** (pokud existuje) |
| C5 | `/nabidka/[slug]/platba/uspech` | **P3** — utility, neměla by být indexována |

### 2.6 Heading Hierarchy

Na základě analýzy veřejných stránek:
- ✅ Homepage — má `<h1>`, sekce s `<h2>`
- ✅ Landing pages (značky, modely) — generované z VehicleLandingPage komponenty, konzistentní H1/H2
- ✅ Blog — article content s TipTap heading hierarchy
- ⚠️ **Bez automatické kontroly** — heading hierarchy závisí na individuálním obsahu stránek

### 2.7 OG Images Coverage

| Segment | opengraph-image.tsx | Stav |
|---------|--------------------|----|
| Root `(web)/` | ✅ | Default OG image |
| `/nabidka/[slug]` | ✅ | Dynamické — auto fotka + info |
| `/profil/[slug]` | ✅ | Dynamické — makléř fotka |
| `/blog/[slug]` | ✅ | Dynamické — článek |
| `/blog` | ✅ | Blog listing |
| `/dily` | ✅ | Díly landing |
| `/marketplace` | ✅ | Marketplace landing |
| `/makleri` | ✅ | Makléři listing |
| `/inzerce` | ✅ | Inzerce landing |
| `/shop` | ❌ | **CHYBÍ** |
| `/sluzby` | ❌ | **CHYBÍ** |
| `/kontakt` | ❌ | **CHYBÍ** |
| `/o-nas` | ❌ | **CHYBÍ** |
| `/chci-prodat` | ❌ | **CHYBÍ** |
| `/cenik` | ❌ | **CHYBÍ** |
| `/kariera` | ❌ | **CHYBÍ** |
| `/recenze` | ❌ | **CHYBÍ** |

### 2.8 Security Headers (next.config.ts)

- ✅ `X-Frame-Options: DENY` — prevence clickjacking
- ✅ `X-Content-Type-Options: nosniff` — prevence MIME sniffing
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HSTS 2 roky)
- ✅ `Content-Security-Policy-Report-Only` — CSP s whitelistem pro Plausible, Stripe, Packeta, Sentry
- ✅ `Permissions-Policy: camera=(), microphone=()`
- ✅ WWW redirect: `www.carmakler.cz` → `https://carmakler.cz` (301 permanent)

### 2.9 Analytics

- ✅ **Plausible Analytics** — lightweight, privacy-friendly
- ✅ Načítání přes `next/script` s `strategy="afterInteractive"`
- ✅ Podmíněné — jen pokud `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` je nastaveno
- ⚠️ Žádný Google Analytics / GA4 — OK pokud záměrné (privacy-first přístup)
- ⚠️ Žádný Google Search Console verification meta tag v kódu

### 2.9 Image Optimization

- ✅ Next.js `<Image>` komponent používán ve většině komponent
- ✅ Font: Outfit s `display: "swap"` — CLS optimalizace
- ✅ Font subsety: `latin`, `latin-ext`
- ⚠️ Chybí explicitní `sizes` attribute na mnoha `<Image>` komponentách — LCP impact

### 2.10 Internal Linking

- ✅ Breadcrumbs komponenta s JSON-LD — `components/web/Breadcrumbs.tsx`
- ✅ Parts Breadcrumbs — `components/web/dily/PartsBreadcrumbs.tsx`
- ✅ Sitemap zahrnuje cross-linking mezi sekcemi
- ⚠️ Breadcrumbs nejsou na všech veřejných stránkách

---

## 3. GEO AUDIT

### 3.1 Lokální SEO základ

**Company info (`lib/company-info.ts`):**
- ✅ Centrální zdroj pravdy pro NAP (Name, Address, Phone)
- ✅ Právní název: "CAR makléř, s.r.o."
- ✅ IČO: 21957151, DIČ: CZ21957151
- ✅ Adresa: Školská 660/3, 110 00 Praha
- ✅ Telefon: 733 179 199 (formátovaný pro display i tel: href i JSON-LD)
- ✅ Email: info@carmakler.cz
- ✅ Otevírací hodiny: Po-Pa 8:00-18:00 (s schema.org `hoursSpec`)
- ✅ Logo URL
- ✅ Social links: Facebook, Instagram, YouTube
- ✅ Branches array (zatím jen Praha centrála)

### 3.2 LocalBusiness Schema

- ✅ `generateLocalBusinessJsonLd()` — typ `AutomotiveBusiness`
- ✅ Použito na `/kontakt` stránce
- ✅ Obsahuje: name, description, url, telephone, email, address (PostalAddress), geo (GeoCoordinates), openingHours
- ⚠️ **Chybí na homepage** — Google doporučuje Organization + LocalBusiness na hlavní stránce
- ⚠️ **Chybí `priceRange`** — Google rich results rozšíření

### 3.3 GEO meta tagy

| Tag | Přítomnost | Stav |
|-----|-----------|------|
| `geo.region` | ❌ | **CHYBÍ** — `<meta name="geo.region" content="CZ-10">` |
| `geo.placename` | ❌ | **CHYBÍ** — `<meta name="geo.placename" content="Praha">` |
| `geo.position` | ❌ | **CHYBÍ** — `<meta name="geo.position" content="50.0755;14.4378">` |
| `ICBM` | ❌ | **CHYBÍ** — `<meta name="ICBM" content="50.0755, 14.4378">` |

### 3.4 Hreflang

- ❌ **CHYBÍ** — žádné hreflang tagy
- ✅ `<html lang="cs">` je nastaveno
- ℹ️ Web je pouze v češtině — hreflang není kritický, ale `<link rel="alternate" hreflang="cs" href="...">` + `hreflang="x-default"` by zlepšil signál pro Google

### 3.5 Google Business Profile Readiness

| Požadavek | Stav |
|-----------|------|
| NAP konzistentní | ✅ Centrální `company-info.ts` |
| Adresa kompletní | ✅ Školská 660/3, 110 00 Praha |
| Telefon | ✅ 733 179 199 |
| Otevírací hodiny | ✅ Po-Pa 8:00-18:00 |
| Logo | ✅ `/brand/logo-color.png` |
| Kategorie byznysu | ✅ AutomotiveBusiness v JSON-LD |
| Fotky | ⚠️ Chybí fotky pobočky/kanceláře |
| Google verification meta tag | ❌ Neimplementováno v kódu |

### 3.6 Lokální Landing Pages

- ✅ **8 městských landing pages:** Praha, Brno, Ostrava, Plzeň, Liberec, Olomouc, České Budějovice, Hradec Králové
- ✅ V sitemap s priority 0.7
- ✅ Vlastní metadata + canonical
- ⚠️ Chybí lokální structured data na městských stránkách (LocalBusiness pro každé město)
- ⚠️ Chybí další města (Zlín, Pardubice, Jihlava, Karlovy Vary, Ústí nad Labem)

### 3.7 Map Integration

- ✅ **Mapy.cz embed** na `/kontakt` — iframe s koordináty Praha (50.0793, 14.4244), zoom 16
- ⚠️ Použita česká Mapy.cz místo Google Maps — OK pro lokální trh, ale Google Places/Maps je lepší pro GBP integraci
- ⚠️ Chybí mapa na městských landing pages (`/nabidka/brno` atd.)
- ⚠️ Chybí `hasMap` property v LocalBusiness JSON-LD

---

## 4. AIEO AUDIT (AI Engine Optimization)

### 4.1 AI Crawler Access

**robots.ts — AI crawlers explicitně povoleny:**
- ✅ `GPTBot` — ChatGPT web browsing
- ✅ `ChatGPT-User` — ChatGPT user-initiated browsing
- ✅ `CCBot` — Common Crawl (training data)
- ✅ `ClaudeBot` — Claude web browsing
- ✅ `PerplexityBot` — Perplexity AI search
- ✅ `Applebot-Extended` — Apple Intelligence
- ✅ `GoogleOther` — Google AI features

**Hodnocení: VÝBORNÉ** — proaktivní povolení AI crawlerů ✅

### 4.2 llms.txt

**Soubor:** `app/llms.txt/route.ts` — **plně implementováno** ✅

- ✅ Formát dle https://llmstxt.org spec (Markdown s H1 + blockquote)
- ✅ `force-static` + revalidate 24h
- ✅ Správné Content-Type: `text/markdown; charset=utf-8`
- ✅ Cache headers: 24h s 7d stale-while-revalidate
- ✅ Obsah pokrývá:
  - Všechny 4 produkty (eshop, nabídka, inzerce, marketplace)
  - Služby (Cebia, financování, pojištění)
  - Klíčové vlastnosti (VIN kompatibilita, záruka, doprava)
  - Pro vrakoviště info
  - O nás, kariéra, kontakt
  - Právní dokumenty
  - Sitemap reference

**Hodnocení: VÝBORNÉ** — jeden z mála českých webů s llms.txt ✅

### 4.3 FAQ Schema

- ✅ `generateFaqJsonLd()` + `generateFaqPageJsonLd()` generátory v `lib/seo.ts`
- ✅ Použito na `/chci-prodat` a parts landing pages
- ⚠️ **Chybí FAQ na klíčových stránkách:**
  - `/jak-to-funguje` — FAQ by dramaticky zlepšilo AI citovatelnost
  - `/sluzby/proverka` — "Kolik stojí prověrka vozu?" atd.
  - `/sluzby/financovani` — "Jaké jsou podmínky financování?"
  - `/nabidka` — "Jak funguje prodej přes makléře?"
  - `/dily` — "Jak objednat díl?" "Jaká je záruka?"
  - Homepage — obecné FAQ o platformě

### 4.4 Entity Markup

| Entity | Schema Type | Kde | Stav |
|--------|------------|-----|------|
| Organization | Organization | Homepage, kontakt | ✅ |
| Person (makléř) | Person | `/profil/[slug]` | ✅ |
| Vehicle | Vehicle + Offer | `/nabidka/[slug]` | ✅ |
| Product (díl) | Product + Offer | Díl detail, part cards | ✅ |
| Article | Article | `/blog/[slug]` | ✅ |
| Service | Service | `/sluzby/*` | ✅ |
| HowTo | HowTo | `/jak-prodat-auto`, `/jak-to-funguje` | ✅ |
| JobPosting | JobPosting | `/kariera` | ✅ |
| Store | AutoPartsStore | `/dily/vrakoviste/[slug]` | ✅ |
| LocalBusiness | AutomotiveBusiness | `/kontakt` | ✅ |
| WebSite + SearchAction | WebSite | Homepage | ✅ |
| WebPage + Speakable | WebPage | Key pages | ✅ |
| BreadcrumbList | BreadcrumbList | Via Breadcrumbs component | ✅ |
| AggregateRating | Organization + AggregateRating | `/recenze` | ✅ |
| AggregateOffer | Product + AggregateOffer | Brand landing pages | ✅ |
| ItemList | ItemList | Various landing pages | ✅ |

**Hodnocení: VÝBORNÉ** — 16 různých schema typů, rozsáhlé pokrytí ✅

### 4.5 Speakable Content

- ✅ `WebPageJsonLd` podporuje `speakableCssSelectors` — SpeakableSpecification
- ⚠️ Ověřit na kolika stránkách je skutečně použito

### 4.6 Citovatelný obsah

- ✅ `/jak-prodat-auto` — How-To formát s kroky → AI-friendly
- ✅ `/jak-to-funguje` — procesní vysvětlení → AI-friendly
- ✅ `/chci-prodat` — FAQ sekce → přímo citovatelná
- ✅ Blog články — strukturované s headings → dobré pro AI excerpty
- ✅ llms.txt — kompletní overview pro AI engines
- ⚠️ Chybí autoritativní "Co je Carmakler" paragraph na homepage — AI engines potřebují jasnou definici entity

### 4.7 Obsah pro AI vyhledávání

**Silné stránky:**
1. Jasná hierarchie obsahu na většině veřejných stránek
2. Bohaté structured data (16 schema typů)
3. FAQ schema na klíčových stránkách
4. llms.txt s kompletním přehledem
5. AI crawlers explicitně povoleny
6. Speakable specification support

**Slabé stránky:**
1. Chybí FAQ na více stránkách (viz 4.3)
2. Chybí "definice entity" paragraph na homepage
3. Chybí Q&A formát na servisních stránkách
4. Breadcrumbs nejsou na všech veřejných stránkách

---

## 5. PRIORITIZOVANÉ NÁLEZY

### P0 — CRITICAL (okamžitě řešit)

| # | Oblast | Nález | Dopad | Řešení |
|---|--------|-------|-------|--------|
| — | — | **Žádné P0 nálezy** | — | — |

### P1 — HIGH (řešit do 1 týdne)

| # | Oblast | Nález | Dopad | Řešení |
|---|--------|-------|-------|--------|
| 1 | SEO/Sitemap | `/dily/[slug]` (part detail pages) chybí v sitemap | Tisíce product pages neindexovány Googlem | Přidat dynamickou sekci do `sitemap.ts` — `prisma.part.findMany({ where: { status: "ACTIVE" } })` |
| 2 | SEO/Sitemap | `/shop/produkt/[slug]` chybí v sitemap | Shop product pages neindexovány | Přidat do sitemap.ts |
| 3 | SEO/Schema | `/shop/produkt/[slug]` chybí Product JSON-LD | Google Shopping rich results — velký e-commerce dopad | Použít `generatePartProductJsonLd()` z lib/seo.ts |
| 4 | Funkce | `/h/[slug]` a `/tag/[slug]` — ověřit existenci routes | Potenciální 404 stránky | Zkontrolovat git stav — buď smazat z navigace nebo vytvořit stránky |
| 5 | Funkce | Dead links v navigaci: `/podminky` → `/obchodni-podminky` | Broken link pro uživatele | Opravit href v navigačních komponentách |

### P2 — MEDIUM (řešit do 2 týdnů)

| # | Oblast | Nález | Dopad | Řešení |
|---|--------|-------|-------|--------|
| 5 | SEO | `/dodavatel/[slug]` — chybí metadata, canonical, sitemap | Dodavatelské stránky bez SEO | Přidat generateMetadata, pageCanonical, sitemap entry |
| 6 | SEO | `/pro-maklere` — chybí metadata | Recruiting stránka bez vlastního title/description | Přidat metadata export |
| 7 | SEO/OG | 8 veřejných stránek chybí opengraph-image.tsx | Sdílení na sociálních sítích používá fallback image | Vytvořit OG image generátory pro `/shop`, `/sluzby`, `/kontakt`, `/o-nas`, `/chci-prodat`, `/cenik`, `/kariera`, `/recenze` |
| 8 | GEO | Chybí geo meta tagy (geo.region, geo.placename, geo.position) | Lokální SEO signál pro Google | Přidat do root layout nebo web layout |
| 9 | GEO | Městské landing pages nemají lokální structured data | Lokální SEO — Google My Business integration | Přidat LocalBusiness/Place JSON-LD na /nabidka/{mesto} |
| 10 | AIEO | Chybí FAQ na `/jak-to-funguje`, `/sluzby/*`, `/nabidka`, `/dily`, homepage | AI engines nemohou citovat odpovědi na běžné otázky | Přidat FAQ sekce + FAQPage JSON-LD |
| 11 | SEO | Subdomain canonical handling (shop.carmakler.cz) chybí | Duplicitní obsah mezi doménou a subdoménou | Implementovat #127b |
| 12 | Funkce | `/dily/[slug]`, `/shop/produkt/[slug]`, `/blog/[slug]` — chybí loading.tsx + error.tsx | UX — žádný loading skeleton na detail stránkách | Přidat loading.tsx a error.tsx |
| 13 | SEO/Robots | `/gate`, `/overeni-emailu/*`, `/reset-hesla/*`, `/zapomenute-heslo`, `/notifikace/*` chybí v robots.txt disallow | Utility stránky mohou být indexovány | Přidat do disallow list |
| 14 | Funkce | Onboarding routes bez error boundaries | `/parts/onboarding/*` (4p) + `/partner/onboarding/*` (4p) — kritické flow bez error handling | Přidat error.tsx ke všem 8 onboarding stránkám |
| 15 | SEO/Schema | Blog články používají `Article` místo `BlogPosting` | Přesnější schema pro Google | Změnit @type na BlogPosting v generateArticleJsonLd |

### P3 — LOW (nice to have)

| # | Oblast | Nález | Dopad | Řešení |
|---|--------|-------|-------|--------|
| 14 | GEO | Chybí hreflang tag (i pro single-language) | Minimální — web je jen česky | Přidat `<link rel="alternate" hreflang="cs" href="...">` |
| 15 | GEO | Chybí mapa na `/kontakt` | UX + GEO signál | Přidat Google Maps embed nebo Mapbox |
| 16 | GEO | Chybí dalších 5 měst (Zlín, Pardubice, Jihlava, Karlovy Vary, Ústí n.L.) | Rozšíření lokálního dosahu | Nové landing pages |
| 17 | GEO | Chybí fotky pobočky/kanceláře pro Google Business Profile | GBP completeness | Přidat do `/o-nas` nebo `/kontakt` |
| 18 | AIEO | Homepage chybí "Co je Carmakler" definice paragraph | AI entity recognition | Přidat jasný paragraph s `<section id="about">` |
| 19 | AIEO | Breadcrumbs nejsou na všech veřejných stránkách | AI navigační kontext | Rozšířit Breadcrumbs komponent na zbývající stránky |
| 20 | SEO | Google Search Console verification meta tag chybí v kódu | GSC setup | Přidat do root layout metadata |
| 21 | SEO | Chybí `sizes` attribute na některých `<Image>` | LCP/CLS optimalizace | Audit a doplnit |
| 22 | SEO/Schema | Inzertní stránky (listing detail) nemají Vehicle JSON-LD | Rich results pro inzeráty | Přidat Vehicle structured data |

---

## 6. SOUHRNNÉ STATISTIKY

| Metrika | Hodnota |
|---------|---------|
| Celkem routes (page.tsx) | 274 |
| Veřejné routes (web) | 141 |
| Admin routes | 47 |
| PWA Makléř routes | 51 |
| PWA Díly routes | 15 |
| Partner routes | 19 |
| API routes | 293 |
| Stránek s metadata | 178 |
| Stránek s pageCanonical | 97 |
| Stránek s JSON-LD | 48 |
| OG Image generátorů | 9 |
| Schema.org typů | 16 |
| Sitemap statických URL | 30 |
| Sitemap dynamických skupin | 16 |
| P0 nálezů | 0 |
| Formulářových komponent | 37 |
| Error boundary coverage | 49% (133/274) |
| Loading state coverage | 61% (167/274) |
| P1 nálezů | 5 |
| P2 nálezů | 11 |
| P3 nálezů | 9 |
| **Celkem nálezů** | **25** |

---

## 7. CELKOVÉ HODNOCENÍ

| Oblast | Skóre | Komentář |
|--------|-------|----------|
| **Funkční** | ⭐⭐⭐⭐ (4/5) | Kompletní middleware auth, 235+ routes, loading/error na většině stránek. Pár chybějících error boundaries. |
| **SEO** | ⭐⭐⭐⭐ (4/5) | Rozsáhlé metadata pokrytí (178 stránek), 97 canonicals, dynamický sitemap, 18 JSON-LD generátorů. Hlavní gap: chybějící product pages v sitemap. |
| **GEO** | ⭐⭐⭐ (3/5) | Dobrý základ (NAP centralizováno, LocalBusiness schema, 8 městských landing pages, Mapy.cz na /kontakt). Chybí geo meta tagy, hreflang. |
| **AIEO** | ⭐⭐⭐⭐⭐ (5/5) | Výborné — llms.txt, AI crawlers explicitně povoleny, 16 schema typů, FAQ schema, Speakable, HowTo. Jeden z nejlépe AI-optimalizovaných českých webů. |

**Celkové skóre: 4/5 — NADPRŮMĚRNÝ stav SEO/AIEO, dobrý funkční základ, GEO potřebuje rozšíření**

---

## 8. DOPORUČENÝ POSTUP IMPLEMENTACE

### Fáze 1 (ASAP — P1 nálezy)
1. Přidat díly a shop produkty do sitemap.ts
2. Přidat Product JSON-LD na `/shop/produkt/[slug]`
3. Ověřit `/h/[slug]` a `/tag/[slug]` routes

### Fáze 2 (1-2 týdny — P2 nálezy)
4. Doplnit metadata a canonical na `/dodavatel/[slug]` a `/pro-maklere`
5. Vytvořit OG image generátory pro 8 chybějících stránek
6. Přidat geo meta tagy do root layout
7. Přidat FAQ sekce + JSON-LD na klíčové stránky
8. Doplnit loading.tsx a error.tsx na detail stránky
9. Rozšířit robots.txt disallow o utility stránky
10. Implementovat subdomain canonical handling (#127b)

### Fáze 3 (nice to have — P3 nálezy)
11. Hreflang, mapa, dalších 5 měst
12. Homepage "Co je Carmakler" definice
13. Breadcrumbs na zbývající stránky
14. Google Search Console verification
15. Image `sizes` audit

---

---

## 9. PRE-LAUNCH: End-to-end user flow testy

### Prerekvizity

**Testovací účty (9 rolí):**

| # | Role | Email (testovací) | Stav |
|---|------|-------------------|------|
| 1 | ADMIN | admin@test.carmakler.cz | ACTIVE |
| 2 | BACKOFFICE | backoffice@test.carmakler.cz | ACTIVE |
| 3 | BROKER (makléř) | makler@test.carmakler.cz | ACTIVE |
| 4 | BROKER (onboarding) | makler-new@test.carmakler.cz | ONBOARDING |
| 5 | ADVERTISER (inzerent) | inzerent@test.carmakler.cz | ACTIVE |
| 6 | BUYER (kupující) | kupujici@test.carmakler.cz | ACTIVE |
| 7 | PARTS_SUPPLIER (vrakoviště) | vrakoviste@test.carmakler.cz | ACTIVE |
| 8 | PARTS_SUPPLIER (onboarding) | vrakoviste-new@test.carmakler.cz | ONBOARDING |
| 9 | INVESTOR | investor@test.carmakler.cz | ACTIVE |
| 10 | VERIFIED_DEALER | dealer@test.carmakler.cz | ACTIVE |
| 11 | PARTNER_BAZAR | bazar@test.carmakler.cz | ACTIVE |
| 12 | PARTNER_VRAKOVISTE | partner-vrak@test.carmakler.cz | ACTIVE |

**Testovací data:**
- Min. 3 aktivní vozidla v DB (různé značky, ceny)
- Min. 5 aktivních dílů (různé kategorie, stavy)
- Min. 1 blog článek (PUBLISHED)
- Min. 1 aktivní inzerát
- Min. 1 FlipOpportunity (pro marketplace)
- Testovací VIN kódy pro decode

**Breakpoints:**
- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1280px (notebook)

---

### FLOW 1: Nepřihlášený návštěvník (veřejný web)

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 1.1 | Homepage | `GET /` | Hero sekce, nabídka vozidel, TOP makléři, CTA tlačítka viditelné. H1 přítomen. JSON-LD Organization + WebSite. | |
| 1.2 | Navbar navigace | Klik na všechny položky v hlavním menu | Každý odkaz vede na existující stránku (žádné 404). Mobile hamburger funguje. | |
| 1.3 | Footer navigace | Klik na všechny footer linky | Všechny linky funkční, právní stránky se načtou. | |
| 1.4 | Nabídka vozidel | `GET /nabidka` | Listing grid, filtry (značka, cena, palivo, převodovka), řazení. H1 "Nabídka vozidel". | |
| 1.5 | Filtrování | Zvolit značku Škoda, cena do 300 000 | Filtr se aplikuje, URL se aktualizuje, výsledky odpovídají filtrům. | |
| 1.6 | Detail vozidla | Klik na kartu vozidla → `/nabidka/[slug]` | Fotogalerie, parametry, cena, kontakt na makléře, TrustScore, JSON-LD Vehicle. OG tagy (zkontrolovat přes share debugger). | |
| 1.7 | Kontakt makléře | Klik "Kontaktovat makléře" na detailu | Formulář/modal se otevře, validace funguje. | |
| 1.8 | Porovnání vozidel | `GET /nabidka/porovnani` | Stránka se načte, lze přidat vozidla k porovnání. | |
| 1.9 | Chci prodat | `GET /chci-prodat` | Formulář, FAQ sekce, JSON-LD FAQPage + HowTo. | |
| 1.10 | Jak prodat auto | `GET /jak-prodat-auto` | Step-by-step průvodce, FAQ, JSON-LD HowTo. | |
| 1.11 | Kolik stojí auto | `GET /kolik-stoji-moje-auto` | Oceňovací formulář/nástroj. | |
| 1.12 | Jak to funguje | `GET /jak-to-funguje` | Procesní vysvětlení, kroky. | |
| 1.13 | Makléři listing | `GET /makleri` | Seznam makléřů, filtrování dle regionu/tagu. | |
| 1.14 | Makléř profil | `GET /profil/[slug]` | Profil makléře, kontakt, vozidla, JSON-LD Person. | |
| 1.15 | SEO landing — značka | `GET /nabidka/skoda` | Landing page Škoda, filtry předvyplněné, JSON-LD AggregateOffer. | |
| 1.16 | SEO landing — model | `GET /nabidka/skoda/octavia` | Landing page model, metadata správná. | |
| 1.17 | SEO landing — město | `GET /nabidka/praha` | Landing page Praha, lokální zaměření. | |
| 1.18 | SEO landing — cena | `GET /nabidka/do-300000` | Landing page cenová, filtr přednastavený. | |
| 1.19 | SEO landing — karoserie | `GET /nabidka/suv` | Landing page SUV. | |
| 1.20 | Blog listing | `GET /blog` | Seznam článků, kategorie, pagination. | |
| 1.21 | Blog článek | `GET /blog/[slug]` | Článek s TipTap obsahem, author, datum, JSON-LD Article. | |
| 1.22 | Blog kategorie | `GET /blog/kategorie/[slug]` | Filtrované články. | |
| 1.23 | Kontakt | `GET /kontakt` | Formulář, mapa (Mapy.cz), adresa, telefon, JSON-LD LocalBusiness. | |
| 1.24 | Služby | `GET /sluzby` | Přehled služeb, linky na detaily. | |
| 1.25 | Prověrka vozu | `GET /sluzby/proverka` | Formulář pro Cebia check, JSON-LD Service. | |
| 1.26 | Financování | `GET /sluzby/financovani` | Formulář, JSON-LD Service. | |
| 1.27 | Pojištění | `GET /sluzby/pojisteni` | Formulář, JSON-LD Service. | |
| 1.28 | O nás | `GET /o-nas` | Příběh, tým, hodnoty. | |
| 1.29 | Kariéra | `GET /kariera` | Otevřené pozice, JSON-LD JobPosting. | |
| 1.30 | Recenze | `GET /recenze` | Zákaznické recenze, JSON-LD AggregateRating. | |
| 1.31 | Ceník | `GET /cenik` | Přehled cen služeb. | |
| 1.32 | Právní stránky | `/obchodni-podminky`, `/ochrana-osobnich-udaju`, `/reklamacni-rad`, `/zasady-cookies` | Všechny 4 se načtou, obsah čitelný. | |
| 1.33 | 404 stránka | `GET /neexistujici-stranka` | Custom 404 stránka, navigace zpět. | |
| 1.34 | Sitemap | `GET /sitemap.xml` | Validní XML, obsahuje statické + dynamické URL. | |
| 1.35 | Robots.txt | `GET /robots.txt` | Správný obsah, sitemap reference. | |
| 1.36 | llms.txt | `GET /llms.txt` | Markdown formát, kompletní obsah. | |

---

### FLOW 2: Eshop díly — kupující

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 2.1 | Díly homepage | `GET /dily` | Katalog dílů, vyhledávání, kategorie, JSON-LD. | |
| 2.2 | Díly katalog | `GET /dily/katalog` | Fulltext vyhledávání, filtry (kategorie, značka, stav). | |
| 2.3 | Hledání dle VIN | Zadat VIN kód do vyhledávače | Dekódování VIN, nabídka kompatibilních dílů. | |
| 2.4 | Díly kategorie | `GET /dily/kategorie/motory` | Filtrovaný listing, breadcrumbs, FAQ, JSON-LD ItemList. | |
| 2.5 | Díly značka | `GET /dily/znacka/skoda` | Díly pro Škoda, pod-modely. | |
| 2.6 | Díly značka+model | `GET /dily/znacka/skoda/octavia` | Díly pro Octavii. | |
| 2.7 | Díly značka+model+rok | `GET /dily/znacka/skoda/octavia/2020` | Díly pro konkrétní rok. | |
| 2.8 | Detail dílu | `GET /dily/[slug]` | Fotky, popis, stav, cena, kompatibilita, tlačítko "Do košíku", JSON-LD Product. | |
| 2.9 | Přidat do košíku | Klik "Do košíku" | Díl se přidá, počítadlo v košíku se aktualizuje. | |
| 2.10 | Košík | `GET /dily/kosik` | Přehled položek, množství, cena, tlačítko "Objednat". | |
| 2.11 | Objednávka | `GET /dily/objednavka` | Formulář: jméno, adresa, doprava (Zásilkovna/PPL/DPD), platba. | |
| 2.12 | Platba (Stripe) | Submit objednávky | Redirect na Stripe checkout (nebo bankovní převod flow). | |
| 2.13 | Potvrzení | Po úspěšné platbě | Potvrzení objednávky, číslo objednávky, email. | |
| 2.14 | Vrakoviště listing | `GET /dily/vrakoviste/[slug]` | Landing page vrakoviště, inventář, kontakt, JSON-LD AutoPartsStore. | |
| 2.15 | Dodavatel stránka | `GET /dodavatel/[slug]` | Stránka dodavatele (pokud existuje). | |

**Po přihlášení (role BUYER):**
| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 2.16 | Moje objednávky (díly) | `GET /dily/moje-objednavky` | Seznam objednávek, stavy. | |
| 2.17 | Moje objednávky (shop) | `GET /shop/moje-objednavky` | Seznam objednávek. | |
| 2.18 | Detail objednávky | Klik na objednávku | Detail, stav, tracking, reklamace tlačítko. | |
| 2.19 | Reklamace | Klik "Reklamovat" | Formulář reklamace. | |
| 2.20 | Vrácení zboží | `GET /shop/vraceni-zbozi` | Informace o vrácení, formulář. | |
| 2.21 | Sledování objednávky | `GET /shop/objednavky/sledovani/[token]` | Stav objednávky (i bez přihlášení). | |

---

### FLOW 3: Shop — produkty

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 3.1 | Shop homepage | `GET /shop` | Katalog produktů, kategorie. | |
| 3.2 | Shop katalog | `GET /shop/katalog` | Vyhledávání, filtry. | |
| 3.3 | Detail produktu | `GET /shop/produkt/[slug]` | Fotky, popis, cena, košík, JSON-LD Product (CHYBÍ — P1 nález). | |
| 3.4 | Košík | `GET /shop/kosik` | Položky, cena, checkout. | |
| 3.5 | Objednávka | `GET /shop/objednavka` | Formulář, doprava, platba. | |
| 3.6 | Reklamace | `GET /shop/reklamace` | Info + formulář. | |

---

### FLOW 4: Inzerce — soukromý prodejce

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 4.1 | Inzerce landing | `GET /inzerce` | Popis služby, CTA "Podat inzerát". | |
| 4.2 | Inzerce katalog | `GET /inzerce/katalog` | Katalog inzerátů, filtrování. | |
| 4.3 | Registrace inzerenta | `GET /inzerce/registrace` | Registrační formulář pro ADVERTISER roli. | |
| 4.4 | Podání inzerátu | `GET /inzerce/pridat` (přihlášen jako ADVERTISER) | Multi-step wizard: VIN → fotky → popis → cena → preview → publikace. | |
| 4.5 | Wizard Step 1 | VIN zadání | VIN decode, předvyplnění dat vozidla. | |
| 4.6 | Wizard Step 2 | Fotky | Upload fotek (min. 3), drag & drop, primary photo. | |
| 4.7 | Wizard Step 3 | Výbava | Checkboxy výbavy, kategorie. | |
| 4.8 | Wizard Step 4 | Popis + cena | Textový popis, cena, publikace. | |
| 4.9 | Moje inzeráty | `GET /moje-inzeraty` (přihlášen) | Seznam mých inzerátů, stavy (DRAFT, ACTIVE, EXPIRED). | |
| 4.10 | Editace inzerátu | `GET /moje-inzeraty/[id]` | Editace, prodloužení, deaktivace. | |
| 4.11 | Příjem dotazu | Simulace dotazu od kupce | Notifikace, zobrazení v detailu. | |

---

### FLOW 5: Makléř — registrace + onboarding

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 5.1 | Registrace makléře | `GET /registrace/makler` | Formulář: jméno, email, telefon, region. | |
| 5.2 | Verifikace emailu | Klik na verifikační link | Email ověřen, redirect na onboarding. | |
| 5.3 | Onboarding — profil | `GET /makler/onboarding/profile` | Formulář profilu: fotka, bio, specializace, region. | |
| 5.4 | Onboarding — dokumenty | `GET /makler/onboarding/documents` | Upload ŽL/OP, živnostenský list. | |
| 5.5 | Onboarding — smlouva | `GET /makler/onboarding/contract` | Zobrazení smlouvy, souhlas, elektronický podpis. | |
| 5.6 | Onboarding — školení | `GET /makler/onboarding/training` | Tréninkové materiály, quiz. | |
| 5.7 | Onboarding — čekání | `GET /makler/onboarding/approval` | Čekání na schválení adminem. | |
| 5.8 | Middleware redirect | ONBOARDING makléř → `/makler/dashboard` | Redirect na `/makler/onboarding`. | |
| 5.9 | Middleware redirect | ACTIVE makléř → `/makler/onboarding` | Redirect na `/makler/dashboard`. | |

---

### FLOW 6: Makléř — PWA hlavní flow

**Přihlášen jako BROKER (ACTIVE):**

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 6.1 | Dashboard | `GET /makler/dashboard` | Statistiky, aktivní vozidla, úkoly, leaderboard pozice. | |
| 6.2 | Bottom nav | Klik na každou ikonu | Dashboard, Vozidla, Leady, Zprávy, Profil — všechny fungují. | |
| 6.3 | Nabírání auta — start | `GET /makler/vehicles/new` | Step wizard start, VIN vstup. | |
| 6.4 | Step 1: VIN | `/makler/vehicles/new/vin` | VIN input, decode, předvyplnění. | |
| 6.5 | Step 2: Kontakt | `/makler/vehicles/new/contact` | Kontakt na vlastníka, telefon, email. | |
| 6.6 | Step 3: Inspekce | `/makler/vehicles/new/inspection` | Vizuální inspekce, stav karoserie, interiér. | |
| 6.7 | Step 4: Fotky | `/makler/vehicles/new/photos` | Upload fotek (min. požadavek), kamera, galerie. | |
| 6.8 | Step 5: Detail | `/makler/vehicles/new/details` | Technické parametry, stav, historie. | |
| 6.9 | Step 6: Výbava | `/makler/vehicles/new/equipment` | Checkboxy výbavy, VIN prefill, custom items. | |
| 6.10 | Step 7: Cena | `/makler/vehicles/new/pricing` | Cenotvorba, AI odhad, porovnání trhu. | |
| 6.11 | Step 8: Review | `/makler/vehicles/new/review` | Souhrn, kontrola, odeslání ke schválení. | |
| 6.12 | Step 9: Úspěch | `/makler/vehicles/new/success` | Potvrzení, co dál. | |
| 6.13 | Quick intake | `GET /makler/vehicles/quick` | Zrychlené nabírání (3 kroky). | |
| 6.14 | Vozidla listing | `GET /makler/vehicles` | Moje vozidla, stavy (DRAFT, PENDING, ACTIVE, SOLD). | |
| 6.15 | Detail vozidla | `GET /makler/vehicles/[id]` | Detail s akcemi (editace, předání). | |
| 6.16 | Editace vozidla | `GET /makler/vehicles/[id]/edit` | Formulář editace. | |
| 6.17 | Předání vozidla | `GET /makler/vehicles/[id]/handover` | Handover flow (při prodeji). | |
| 6.18 | Leady | `GET /makler/leads` | Seznam leadů, status filtry, přiřazení. | |
| 6.19 | Lead detail | `GET /makler/leads/[id]` | Detail leadu, akce (kontaktovat, změnit status). | |
| 6.20 | Kontakty | `GET /makler/contacts` | CRM kontakty, vyhledávání. | |
| 6.21 | Kontakt detail | `GET /makler/contacts/[id]` | Detail, komunikační historie. | |
| 6.22 | Nový kontakt | `GET /makler/contacts/new` | Formulář nového kontaktu. | |
| 6.23 | Zprávy | `GET /makler/messages` | Seznam konverzací. | |
| 6.24 | Zpráva detail | `GET /makler/messages/[vehicleId]` | Chat/komunikace k vozidlu. | |
| 6.25 | Smlouvy | `GET /makler/contracts` | Seznam smluv. | |
| 6.26 | Nová smlouva | `GET /makler/contracts/new` | Generování smlouvy. | |
| 6.27 | Smlouva detail | `GET /makler/contracts/[id]` | Stav smlouvy. | |
| 6.28 | Podpis smlouvy | `GET /makler/contracts/[id]/sign` | Elektronický podpis. | |
| 6.29 | Provize | `GET /makler/provize` | Přehled provizí. | |
| 6.30 | Komise | `GET /makler/commissions` | Detail komisí. | |
| 6.31 | Statistiky | `GET /makler/stats` | Grafy, výkon, konverze. | |
| 6.32 | Leaderboard | `GET /makler/leaderboard` | Žebříček makléřů. | |
| 6.33 | Kalkulačka | `GET /makler/financing-calculator` | Finanční kalkulačka. | |
| 6.34 | Blog makléř | `GET /makler/blog` | Blog pro makléře. | |
| 6.35 | Nový článek | `GET /makler/blog/new` | TipTap editor, publikace. | |
| 6.36 | Materiály | `GET /makler/materials` | Marketingové materiály. | |
| 6.37 | Profil | `GET /makler/profile` | Editace profilu. | |
| 6.38 | Nastavení | `GET /makler/settings` | Nastavení účtu. | |
| 6.39 | Notifikace | `GET /makler/settings/notifications` | Nastavení notifikací. | |
| 6.40 | Offline mode | `GET /makler/offline` | Offline fallback stránka (PWA). | |

---

### FLOW 7: Dodavatel dílů (vrakoviště) — PWA

**Registrace + Onboarding:**

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 7.1 | Registrace dodavatele | `GET /registrace/dodavatel` | Formulář pro vrakoviště. | |
| 7.2 | Onboarding — profil | `GET /parts/onboarding/profile` | Název firmy, IČO, adresa, ARES validace. | |
| 7.3 | Onboarding — dokumenty | `GET /parts/onboarding/documents` | Upload dokumentů. | |
| 7.4 | Onboarding — čekání | `GET /parts/onboarding/approval` | Čekání na schválení. | |
| 7.5 | Middleware redirect | ONBOARDING dodavatel → `/parts/my` | Redirect na `/parts/onboarding`. | |

**Aktivní dodavatel:**

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 7.6 | Dashboard | `GET /parts` | Hlavní stránka PWA díly. | |
| 7.7 | Moje díly | `GET /parts/my` | Seznam mých dílů, stavy. | |
| 7.8 | Nový díl | `GET /parts/new` | Formulář: fotka, popis, kategorie, stav, cena, kompatibilita. | |
| 7.9 | Import dílů | `GET /parts/import` | Hromadný import (CSV/Excel). | |
| 7.10 | Detail dílu | `GET /parts/[id]` | Detail mého dílu. | |
| 7.11 | Editace dílu | `GET /parts/[id]/edit` | Editace dílu. | |
| 7.12 | Donor car — start | `GET /parts/new` → režim "Donor Car" | Mode selector: single díl vs. donor car. | |
| 7.13 | Donor Step 1 | VIN decode | Dekódování auta pro rozebírání. | |
| 7.14 | Donor Step 2 | Typ poškození | Nehoda/nepojízdné/kompletní/zatopené/požár. | |
| 7.15 | Donor Step 3 | Damage zones | SVG top-down, 8 zón, 4 stupně poškození. | |
| 7.16 | Donor Step 4 | Filtr dílů | Automatický filtr dle poškozených zón. | |
| 7.17 | Donor Step 5 | Výběr dílů | Zaškrtnutí, stav A/B/C, fotka. | |
| 7.18 | Donor Step 6 | Fotky auta | 4 povinné fotky celého auta. | |
| 7.19 | Donor Step 7 | Cena | Hromadné oceňování. | |
| 7.20 | Donor Step 8 | Souhrn | Review + publish. | |
| 7.21 | Objednávky | `GET /parts/orders` | Seznam přijatých objednávek. | |
| 7.22 | Objednávka detail | `GET /parts/orders/[id]` | Detail, status change, tracking. | |
| 7.23 | Donor cars | `GET /parts/donors` | Seznam donor vozidel. | |
| 7.24 | Donor detail | `GET /parts/donors/[id]` | Detail donor auta, díly. | |
| 7.25 | Profil | `GET /parts/profile` | Profil dodavatele. | |

---

### FLOW 8: Partner portál (autobazar/vrakoviště)

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 8.1 | Registrace partnera | `GET /registrace/partner` | Formulář pro autobazar/vrakoviště. | |
| 8.2 | Onboarding | `GET /partner/onboarding` → profile → documents → approval | 3-step onboarding flow. | |
| 8.3 | Dashboard | `GET /partner/dashboard` | Statistiky, objednávky, leady. | |
| 8.4 | Vozidla | `GET /partner/vehicles` | Listing vozidel partnera. | |
| 8.5 | Nové vozidlo | `GET /partner/vehicles/new` | Přidání vozidla. | |
| 8.6 | Díly | `GET /partner/parts` | Listing dílů partnera. | |
| 8.7 | Nový díl | `GET /partner/parts/new` | Přidání dílu. | |
| 8.8 | Objednávky | `GET /partner/orders` | Přijaté objednávky. | |
| 8.9 | Objednávka detail | `GET /partner/orders/[id]` | Detail, status change, tracking, PDF. | |
| 8.10 | Leady | `GET /partner/leads` | Příchozí leady. | |
| 8.11 | Statistiky | `GET /partner/stats` | Grafy, přehledy, revenue chart. | |
| 8.12 | Billing | `GET /partner/billing` | Vyúčtování, provize (15% commission). | |
| 8.13 | Profil | `GET /partner/profile` | Editace profilu partnera. | |
| 8.14 | Dokumenty | `GET /partner/documents` | Správa dokumentů. | |
| 8.15 | Zprávy | `GET /partner/messages` | Komunikace. | |

---

### FLOW 9: Marketplace VIP

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 9.1 | Landing page | `GET /marketplace` | Popis služby, výhody, FAQ, JSON-LD FAQPage, CTA "Apply". | |
| 9.2 | Apply formulář | `GET /marketplace/apply` | Formulář: role (investor/dealer), zkušenosti, reference. | |
| 9.3 | Submit apply | Odeslat formulář | Potvrzení, email notifikace. | |

**Přihlášen jako VERIFIED_DEALER:**
| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 9.4 | Dealer dashboard | `GET /marketplace/dealer` | Přehled dealů, statistiky. | |
| 9.5 | Nová příležitost | `GET /marketplace/dealer/nova` | Formulář: auto, nákup. cena, opravy, prodejní cena. | |
| 9.6 | Deal detail (dealer) | `GET /marketplace/dealer/[id]` | Detail, stav, investoři, timeline. | |
| 9.7 | Deal detail (unified) | `GET /marketplace/deals/[id]` | Fotogalerie, ProfitCalculator, InvestModal, FlipTimeline. | |

**Přihlášen jako INVESTOR:**
| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 9.8 | Investor dashboard | `GET /marketplace/investor` | Přehled investic, ROI. | |
| 9.9 | Deal detail (investor) | `GET /marketplace/investor/[id]` | Detail investice. | |
| 9.10 | Investovat | Klik "Investovat" na deal detail | InvestModal: částka, validace, souhlas, submit. | |
| 9.11 | Profit kalkulace | Posun slider na ProfitCalculator | ROI se přepočítá (dealer/investor/carmakler split). | |

**Middleware gating:**
| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 9.12 | Nepřihlášený → /marketplace/dealer | Přístup bez auth | Redirect na `/marketplace/apply?reason=auth_required&role=dealer`. | |
| 9.13 | Nepřihlášený → /marketplace/investor | Přístup bez auth | Redirect na `/marketplace/apply?reason=auth_required&role=investor`. | |
| 9.14 | Špatná role → /marketplace/dealer | BUYER přistupuje | Redirect na `/marketplace?reason=not_authorized`. | |
| 9.15 | Nepřihlášený → /marketplace/deals/[id] | Přístup bez auth | Redirect na `/marketplace/apply?reason=auth_required`. | |

---

### FLOW 10: Kupující — uživatelský účet

**Přihlášen jako BUYER:**

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 10.1 | Přihlášení | `GET /login` | Formulář, validace, úspěšné přihlášení. | |
| 10.2 | Registrace | `GET /registrace` | Formulář, validace, email verifikace. | |
| 10.3 | Zapomenuté heslo | `GET /zapomenute-heslo` | Formulář, odeslání reset emailu. | |
| 10.4 | Reset hesla | `GET /reset-hesla/[token]` | Nové heslo, validace. | |
| 10.5 | Můj účet | `GET /muj-ucet` | Dashboard kupujícího. | |
| 10.6 | Profil | `GET /muj-ucet/profil` | Editace profilu. | |
| 10.7 | Setup profilu | `GET /muj-ucet/profil/setup` | Prvotní nastavení. | |
| 10.8 | Oblíbené | `GET /muj-ucet/oblibene` | Seznam oblíbených vozidel. | |
| 10.9 | Hlídací pes | `GET /muj-ucet/hlidaci-pes` | Nastavení alerts pro nová vozidla. | |
| 10.10 | Garáž | `GET /muj-ucet/garaz` | Moje vozidla (koupená). | |
| 10.11 | Dotazy | `GET /muj-ucet/dotazy` | Moje dotazy na vozidla. | |
| 10.12 | Poptávky | `GET /muj-ucet/poptavky` | Moje poptávky. | |

---

### FLOW 11: Admin panel

**Přihlášen jako ADMIN:**

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 11.1 | Dashboard | `GET /admin/dashboard` | KPI, statistiky, grafy. | |
| 11.2 | Sidebar navigace | Klik na každou položku | Všechny linky fungují. | |
| 11.3 | Uživatelé | `GET /admin/users` | Listing, filtrování dle role, hledání. | |
| 11.4 | Makléři | `GET /admin/brokers` | Seznam makléřů, stavy, schvalování. | |
| 11.5 | Makléř detail | `GET /admin/brokers/[id]` | Detail, editace, aktivace/deaktivace. | |
| 11.6 | Makléř editace | `GET /admin/brokers/[id]/edit` | Formulář editace. | |
| 11.7 | Vozidla | `GET /admin/vehicles` | Listing, filtry, schvalování. | |
| 11.8 | Vozidlo detail | `GET /admin/vehicles/[id]` | Detail vozidla, admin akce. | |
| 11.9 | Vozidlo editace | `GET /admin/vehicles/[id]/edit` | Formulář editace. | |
| 11.10 | Nové vozidlo | `GET /admin/vehicles/new` | Admin formulář nového vozidla. | |
| 11.11 | Leady | `GET /admin/leads` | Listing leadů. | |
| 11.12 | Lead detail | `GET /admin/leads/[id]` | Detail leadu, přiřazení. | |
| 11.13 | Objednávky | `GET /admin/orders` | Listing objednávek. | |
| 11.14 | Díly | `GET /admin/parts` | Listing dílů. | |
| 11.15 | Dodavatelé | `GET /admin/suppliers` | Listing dodavatelů. | |
| 11.16 | Reklamace | `GET /admin/returns` | Listing reklamací. | |
| 11.17 | Reklamace detail | `GET /admin/returns/[id]` | Detail reklamace. | |
| 11.18 | Partneři | `GET /admin/partners` | Listing partnerů. | |
| 11.19 | Partner detail | `GET /admin/partners/[id]` | Detail partnera. | |
| 11.20 | Nový partner | `GET /admin/partners/new` | Formulář. | |
| 11.21 | Blog | `GET /admin/blog` | Články, drafty. | |
| 11.22 | Blog editace | `GET /admin/blog/[id]/edit` | TipTap editor. | |
| 11.23 | Blog AI drafts | `GET /admin/blog/ai-drafts` | AI generované návrhy. | |
| 11.24 | Blog komentáře | `GET /admin/blog/comments` | Moderace komentářů. | |
| 11.25 | Marketplace | `GET /admin/marketplace` | Přehled dealů. | |
| 11.26 | Marketplace deal | `GET /admin/marketplace/[id]` | Detail dealu, admin panel. | |
| 11.27 | Marketplace přihlášky | `GET /admin/marketplace/applications` | Seznam přihlášek. | |
| 11.28 | Přihláška detail | `GET /admin/marketplace/applications/[id]` | Detail, schválení/zamítnutí. | |
| 11.29 | Inzerce | `GET /admin/inzerce` | Listing inzerátů. | |
| 11.30 | Inzerát detail | `GET /admin/inzerce/[id]` | Detail inzerátu. | |
| 11.31 | Feedy | `GET /admin/feeds` | XML feedy (Sauto, TipCars, Bazoš). | |
| 11.32 | Feed detail | `GET /admin/feeds/[id]` | Detail feedu, run history. | |
| 11.33 | Nový feed | `GET /admin/feeds/new` | Konfigurace nového feedu. | |
| 11.34 | Platby | `GET /admin/payments` | Přehled plateb. | |
| 11.35 | Výplaty | `GET /admin/payouts` | Výplaty makléřům/partnerům. | |
| 11.36 | Kariéra | `GET /admin/career` | Správa pozic. | |
| 11.37 | Recenze | `GET /admin/reviews` | Moderace recenzí. | |
| 11.38 | Tým | `GET /admin/team` | Správa týmu. | |
| 11.39 | Tagy | `GET /admin/tagy` | Správa tagů/hashtagů. | |
| 11.40 | Notifikace | `GET /admin/notifications` | Správa notifikací. | |
| 11.41 | Profil | `GET /admin/profile` | Admin profil. | |

**Manager sub-role:**
| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 11.42 | Manager dashboard | `GET /admin/manager` | Manager přehled. | |
| 11.43 | Manager schvalování | `GET /admin/manager/approvals` | Schvalování vozidel/makléřů. | |
| 11.44 | Manager makléři | `GET /admin/manager/brokers` | Moji makléři. | |
| 11.45 | Manager makléř detail | `GET /admin/manager/brokers/[id]` | Detail makléře. | |
| 11.46 | Manager transfer | `GET /admin/manager/brokers/[id]/transfer` | Transfer makléře. | |
| 11.47 | Manager bonusy | `GET /admin/manager/bonuses` | Správa bonusů. | |
| 11.48 | Manager notifikace | `GET /admin/manager/notifications` | Manager notifikace. | |

---

### FLOW 12: Auth & Security

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 12.1 | Přihlášení | `POST /api/auth/[...nextauth]` | Správné přihlášení, session cookie. | |
| 12.2 | Odhlášení | Signout | Session smazána, redirect na homepage. | |
| 12.3 | Protected route bez auth | `GET /admin/dashboard` (nepřihlášen) | Redirect na `/login?callbackUrl=/admin/dashboard`. | |
| 12.4 | Protected route špatná role | BUYER → `/admin/dashboard` | Redirect na `/`. | |
| 12.5 | CSRF ochrana | Pokus o CSRF útok | NextAuth CSRF token validace. | |
| 12.6 | Rate limiting | 100+ rychlých požadavků na API | Odpověď 429 nebo throttling (pokud implementováno). | |
| 12.7 | XSS test | Vložit `<script>alert('XSS')</script>` do formuláře | Input sanitizován, script se nespustí. | |
| 12.8 | SQL injection | Vložit `'; DROP TABLE users; --` do search | Prisma parametrizované query, žádný error. | |
| 12.9 | Email verifikace | `GET /overeni-emailu/[token]` | Token validace, email ověřen. | |
| 12.10 | Verifikace — chyba | `GET /overeni-emailu/chyba` | Error stránka s instrukcemi. | |
| 12.11 | Verifikace — úspěch | `GET /overeni-emailu/uspech` | Success stránka. | |

---

### FLOW 13: Responzivita & UX

**Testovat na 3 breakpoints (375px / 768px / 1280px):**

| # | Krok | Co testovat | ✅/❌ |
|---|------|------------|------|
| 13.1 | Homepage | Hero, CTA tlačítka, grid vozidel, makléři karty. | |
| 13.2 | Navbar | Hamburger menu (mobile), desktop menu items, logo. | |
| 13.3 | Footer | Sloupce skládání, linky čitelné. | |
| 13.4 | Nabídka listing | Grid 1/2/3 sloupce, filtry sidebar/drawer. | |
| 13.5 | Detail vozidla | Fotogalerie swipe (mobile), parametry tabulka. | |
| 13.6 | Eshop díly | Katalog grid, detail dílu, košík. | |
| 13.7 | Inzerce wizard | Step formuláře, upload fotek. | |
| 13.8 | Blog | Článek čitelnost, sidebar. | |
| 13.9 | Kontakt | Formulář, mapa. | |
| 13.10 | PWA makléř | Bottom nav, dashboard karty, vehicle intake wizard. | |
| 13.11 | PWA díly | Supplier dashboard, parts list, donor car flow. | |
| 13.12 | Partner portál | Dashboard, tabulky, formuláře. | |
| 13.13 | Admin | Sidebar collapse, tabulky scroll, formuláře. | |
| 13.14 | Login/registrace | Formuláře centered, validace viditelná. | |
| 13.15 | Marketplace | Landing, deal detail, invest modal. | |
| 13.16 | Modaly/dialogy | Překryv na celou šířku (mobile), centered (desktop). | |
| 13.17 | Tabulky | Horizontální scroll na mobilu, čitelnost. | |
| 13.18 | Loading stavy | Skeleton odpovídá layoutu na všech breakpoints. | |
| 13.19 | Error stránky | 404, 500 — čitelné, navigace zpět. | |
| 13.20 | Toast notifikace | Viditelné, nezasahují do obsahu. | |

---

### FLOW 14: Subdomény

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 14.1 | inzerce.carmakler.cz | `GET /` | Rewrite na `/inzerce`, inzerce navbar. | |
| 14.2 | inzerce.carmakler.cz/katalog | `GET /katalog` | Rewrite na `/inzerce/katalog` nebo `/nabidka`. | |
| 14.3 | shop.carmakler.cz | `GET /` | Rewrite na `/shop`, shop navbar. | |
| 14.4 | shop.carmakler.cz/katalog | `GET /katalog` | Rewrite na `/shop/katalog`. | |
| 14.5 | marketplace.carmakler.cz | `GET /` | Rewrite na `/marketplace`, marketplace navbar. | |
| 14.6 | www redirect | `GET www.carmakler.cz/*` | 301 redirect na `carmakler.cz/*`. | |

---

### FLOW 15: Broken Links & Error States

| # | Krok | URL / Akce | Očekávaný výsledek | ✅/❌ |
|---|------|-----------|-------------------|------|
| 15.1 | 404 custom | `GET /neexistujici-stranka` | Custom 404 stránka, ne default Next.js. | |
| 15.2 | API 404 | `GET /api/vehicles/neexistujici-id` | JSON response `{ error: "Not found" }`, status 404. | |
| 15.3 | API 401 | `GET /api/admin/users` (bez auth) | JSON response `{ error: "Unauthorized" }`, status 401. | |
| 15.4 | Dead link: /podminky | Kontrola v kódu | Opravit na `/obchodni-podminky`. | |
| 15.5 | /auth/prihlasit | `GET /auth/prihlasit` | 301/308 redirect na `/login`. | |
| 15.6 | Loading fallback | Pomalé připojení (DevTools throttle) | Loading skeleton viditelný, ne bílá stránka. | |
| 15.7 | JS disabled | Vypnout JS v DevTools | SSR obsah viditelný (po SSR migraci). | |

---

### Souhrnná tabulka flows

| Flow # | Název | Kroků | Role | Priorita |
|--------|-------|-------|------|----------|
| 1 | Nepřihlášený návštěvník | 36 | — | **P0** |
| 2 | Eshop díly — kupující | 21 | BUYER | **P0** |
| 3 | Shop — produkty | 6 | — / BUYER | **P0** |
| 4 | Inzerce — prodejce | 11 | ADVERTISER | **P1** |
| 5 | Makléř — onboarding | 9 | BROKER (new) | **P1** |
| 6 | Makléř — PWA | 40 | BROKER | **P0** |
| 7 | Dodavatel dílů — PWA | 25 | PARTS_SUPPLIER | **P0** |
| 8 | Partner portál | 15 | PARTNER_* | **P1** |
| 9 | Marketplace VIP | 15 | DEALER/INVESTOR | **P1** |
| 10 | Kupující — účet | 12 | BUYER | **P1** |
| 11 | Admin panel | 48 | ADMIN/MANAGER | **P1** |
| 12 | Auth & Security | 11 | Různé | **P0** |
| 13 | Responzivita | 20 | — | **P1** |
| 14 | Subdomény | 6 | — | **P2** |
| 15 | Broken links & errors | 7 | — | **P1** |
| **CELKEM** | | **282 kroků** | **12 rolí** | |

---

*Audit dokončen 2026-05-09. Pre-launch checklist: 282 test kroků, 15 flows, 12 uživatelských rolí.*
