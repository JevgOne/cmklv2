# SEO Kompletní Implementace — Per-Page Checklist & Akční plán

**Task:** #35 (rozšíření)
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** Implementační plán s detailním checklistem
**Závažnost:** HIGH — kompletní SEO pokrytí celé platformy

---

## EXECUTIVE SUMMARY

Audit odhalil **101 page.tsx souborů**, z toho **~55 veřejných stránek** potřebujících SEO. Platforma má silný základ (19 OG images, 20 JSON-LD generátorů, dynamický sitemap), ale existují systematické mezery:

| Metrika | Aktuální | Cíl | Gap |
|---------|----------|-----|-----|
| Stránky s generateMetadata | 24/101 (24%) | 55/55 public (100%) | 31 stránek |
| Stránky s JSON-LD | ~35/55 public (64%) | 55/55 (100%) | 20 stránek |
| JSON-LD generátory použité | 14/20 (70%) | 20/20 (100%) | 6 nepoužitých |
| OG images | 19 (97% coverage) | 100% | 4 stránky |
| Stránky s canonical | ~40/55 | 55/55 | ~15 stránek |
| Stránky s noindex (private) | 2 | ~15 | 13 stránek |
| Breadcrumb JSON-LD | 22 stránek | 45+ | 23 stránek |
| FAQ JSON-LD | 22 stránek | 30+ | 8 stránek |
| error.tsx pokrytí | ~35 | 55+ | 20 stránek |

---

## ČÁST A: PER-PAGE CHECKLIST — VEŘEJNÉ STRÁNKY

### Legenda:
- ✅ = Existuje a je OK
- ⚠️ = Existuje ale potřebuje opravu/doplnění
- ❌ = Chybí — MUSÍ se přidat
- ➖ = Neaplikuje se (private/redirect stránka)
- 🔶 = Inherited (dědí z parent directory)

---

### A1. HLAVNÍ STRÁNKY (Homepage + Core)

| # | Stránka | URL | Meta title | Meta desc | OG image | Canonical | JSON-LD | Breadcrumbs | FAQ | noindex | loading | error |
|---|---------|-----|-----------|-----------|----------|-----------|---------|-------------|-----|---------|---------|-------|
| 1 | **Homepage** | `/` | ✅ layout | ✅ layout | ✅ own | ✅ | ⚠️ inline Org (chybí WebSite) | ➖ | ❌ | ➖ | ✅ | ✅ |
| 2 | **Nabídka** | `/nabidka` | ✅ | ✅ | 🔶 root | ✅ | ✅ ItemList | ➖ | ❌ | ➖ | ✅ | ✅ |
| 3 | **Chci prodat** | `/chci-prodat` | ✅ | ✅ | ✅ own | ✅ | ⚠️ inline | ✅ | ❌ | ➖ | ✅ | ❌ |
| 4 | **Jak to funguje** | `/jak-to-funguje` | ✅ | ✅ | 🔶 root | ✅ | ⚠️ inline | ✅ | ✅ | ➖ | ❌ | ❌ |
| 5 | **Jak prodat auto** | `/jak-prodat-auto` | ✅ | ✅ | 🔶 root | ✅ | ✅ Breadcrumb+FAQ+Article+HowTo | ✅ | ✅ | ➖ | ✅ | ✅ |
| 6 | **Kolik stojí auto** | `/kolik-stoji-moje-auto` | ✅ | ✅ | 🔶 root | ✅ | ✅ Breadcrumb | ✅ | ❌ | ➖ | ✅ | ✅ |
| 7 | **Hledat** | `/hledat` | ❌ | ❌ | 🔶 root | ❌ | ❌ | ❌ | ➖ | ❌ musí být noindex | ✅ | ❌ |

**Akce Homepage (#1):**
- Přidat `generateWebSiteJsonLd()` vedle Organization — umožní Sitelinks searchbox
- Přidat FAQ schema s 5-6 otázkami ("Jak CarMakléř funguje?", "Kolik stojí prodej přes makléře?")

**Akce Hledat (#7):**
- Přidat metadata: title "Hledat | CarMakléř", description
- Přidat `robots: { index: false, follow: true }` — search results nemají být indexovány
- Chybí v sitemap — SPRÁVNĚ (noindex stránka)

---

### A2. NABÍDKA VOZIDEL

| # | Stránka | URL | Meta | OG | Canonical | JSON-LD | Breadcrumbs | FAQ |
|---|---------|-----|------|-----|-----------|---------|-------------|-----|
| 8 | **Detail vozidla** | `/nabidka/[slug]` | ✅ generateMetadata | ✅ own | ✅ | ⚠️ Breadcrumb only (chybí Vehicle!) | ✅ | ➖ |
| 9 | **Porovnání** | `/nabidka/porovnani` | ✅ | 🔶 root | ✅ | ❌ | ❌ | ➖ |
| 10 | **Platba** | `/nabidka/[slug]/platba` | ✅ | 🔶 root | ➖ | ➖ | ➖ | ➖ |
| 11 | **Platba úspěch** | `/nabidka/[slug]/platba/uspech` | ❌ | 🔶 root | ➖ | ➖ | ➖ | ➖ |

**Akce Detail vozidla (#8) — CRITICAL:**
- Přidat `generateVehicleJsonLd()` — funkce existuje ale NENÍ NIKDE POUŽITA!
- Toto je nejdůležitější structured data na celém webu (Google Vehicle rich results)

**Akce Platba úspěch (#11):**
- Přidat noindex metadata

#### A2a. Brand Landing Pages (16 stránek)

| # | Stránka | URL | Meta | OG | Canonical | JSON-LD | Breadcrumbs | FAQ | WebPage |
|---|---------|-----|------|-----|-----------|---------|-------------|-----|---------|
| 12 | Škoda | `/nabidka/skoda` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 13 | Volkswagen | `/nabidka/volkswagen` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 14 | BMW | `/nabidka/bmw` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 15 | Audi | `/nabidka/audi` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 16 | Ford | `/nabidka/ford` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 17 | Toyota | `/nabidka/toyota` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 18 | Renault | `/nabidka/renault` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 19 | Kia | `/nabidka/kia` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 20 | Hyundai | `/nabidka/hyundai` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 21 | Citroën | `/nabidka/citroen` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 22 | Dacia | `/nabidka/dacia` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 23 | Mazda | `/nabidka/mazda` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 24 | Peugeot | `/nabidka/peugeot` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 25 | Seat | `/nabidka/seat` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 26 | Mercedes | `/nabidka/mercedes-benz` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |
| 27 | Opel | `/nabidka/opel` | ❌ | 🔶 root | ❌ | ❌ | ❌ | ❌ | ❌ |

**CRITICAL: Všech 16 brand stránek nemá ŽÁDNOU metadata!**

**Akce (všechny brand pages):**
- Tyto stránky PRAVDĚPODOBNĚ generují metadata dynamicky z `seo-data.ts` — NUTNO OVĚŘIT
- Pokud ne, přidat `generateMetadata` s dynamickým title/description per brand
- Přidat `generateBreadcrumbJsonLd` + `generateFaqJsonLd` + `generateWebPageJsonLd` (vzor: existující city/bodytype pages)
- Přidat `generateBrandItemListJsonLd()` — funkce existuje ale NEPOUŽÍVÁ SE
- Přidat `generateAggregateOfferJsonLd()` — price range per brand

**POZNÁMKA:** Tyto stránky mohou sdílet page.tsx s dynamickým routingem. Audit zjistil že existují statické `page.tsx` pro každý brand ale bez metadata. Implementátor musí ověřit jak jsou strukturované.

#### A2b. Model Landing Pages (12 stránek)

| # | URL příklad | Meta | JSON-LD | Status |
|---|-------------|------|---------|--------|
| 28 | `/nabidka/skoda/octavia` | ❌ | ❌ | Stejný problém jako brand pages |
| 29 | `/nabidka/skoda/fabia` | ❌ | ❌ | Stejný problém |
| 30 | `/nabidka/volkswagen/golf` | ❌ | ❌ | Stejný problém |

**Akce:** Stejná jako brand pages — generateMetadata + BreadcrumbList + FAQ + AggregateOffer

#### A2c. Body Type Landing Pages (7 stránek)

| # | URL | Meta | JSON-LD | Breadcrumbs | FAQ | WebPage |
|---|-----|------|---------|-------------|-----|---------|
| 31 | `/nabidka/sedan` | ❌ | ✅ | ✅ | ✅ | ✅ |
| 32 | `/nabidka/suv` | ❌ | ✅ | ✅ | ✅ | ✅ |
| 33 | `/nabidka/kombi` | ❌ | ✅ | ✅ | ✅ | ✅ |
| 34 | `/nabidka/hatchback` | ❌ | ✅ | ✅ | ✅ | ✅ |
| 35 | `/nabidka/kabriolet` | ❌ | ✅ | ✅ | ✅ | ✅ |
| 36 | `/nabidka/elektromobily` | ❌ | ✅ | ✅ | ✅ | ✅ |
| 37 | `/nabidka/hybrid` | ❌ | ✅ | ✅ | ✅ | ✅ |

**Status:** JSON-LD je OK (Breadcrumb + FAQ + WebPage), ale chybí generateMetadata!

**Akce:** Přidat `generateMetadata` s dynamickým title/description

#### A2d. Price Range Landing Pages (5 stránek)

| # | URL | Meta | JSON-LD | Breadcrumbs | FAQ | WebPage |
|---|-----|------|---------|-------------|-----|---------|
| 38 | `/nabidka/do-100000` | ❌ | ✅ | ✅ | ✅ | ✅ |
| 39 | `/nabidka/do-200000` | ❌ | ✅ | ✅ | ✅ | ✅ |
| 40 | `/nabidka/do-300000` | ❌ | ✅ | ✅ | ✅ | ✅ |
| 41 | `/nabidka/do-500000` | ❌ | ✅ | ✅ | ✅ | ✅ |
| 42 | `/nabidka/do-1000000` | ❌ | ✅ | ✅ | ✅ | ✅ |

**Akce:** Přidat `generateMetadata` — JSON-LD je OK

#### A2e. City Landing Pages (8 stránek)

| # | URL | Meta | JSON-LD | Breadcrumbs | FAQ |
|---|-----|------|---------|-------------|-----|
| 43 | `/nabidka/praha` | ❌ | ✅ | ✅ | ✅ |
| 44 | `/nabidka/brno` | ❌ | ✅ | ✅ | ✅ |
| 45 | `/nabidka/ostrava` | ❌ | ✅ | ✅ | ✅ |
| 46 | `/nabidka/plzen` | ❌ | ✅ | ✅ | ✅ |
| 47 | `/nabidka/ceske-budejovice` | ❌ | ✅ | ✅ | ✅ |
| 48 | `/nabidka/liberec` | ❌ | ✅ | ✅ | ✅ |
| 49 | `/nabidka/olomouc` | ❌ | ✅ | ✅ | ✅ |
| 50 | `/nabidka/hradec-kralove` | ❌ | ✅ | ✅ | ✅ |

**Akce:** Přidat `generateMetadata` — JSON-LD je OK

---

### A3. SLUŽBY

| # | Stránka | URL | Meta | OG | Canonical | JSON-LD | Breadcrumbs | FAQ |
|---|---------|-----|------|-----|-----------|---------|-------------|-----|
| 51 | **Služby overview** | `/sluzby` | ✅ | ✅ own | ✅ | ❌ | ❌ | ❌ |
| 52 | **Prověrka** | `/sluzby/proverka` | ✅ | 🔶 sluzby | ✅ | ✅ Service | ❌ | ❌ |
| 53 | **Financování** | `/sluzby/financovani` | ✅ | 🔶 sluzby | ✅ | ✅ Service | ❌ | ❌ |
| 54 | **Pojištění** | `/sluzby/pojisteni` | ✅ | 🔶 sluzby | ✅ | ✅ Service | ❌ | ❌ |

**Akce:**
- #51: Přidat WebPage JSON-LD, BreadcrumbList, FAQ schema
- #52-54: Přidat BreadcrumbList, FAQ schema (otázky o cenách, postupu)
- Služby stránky mají Service JSON-LD ✅ ale chybí FAQ a Breadcrumbs

---

### A4. BLOG

| # | Stránka | URL | Meta | OG | Canonical | JSON-LD | Breadcrumbs |
|---|---------|-----|------|-----|-----------|---------|-------------|
| 55 | **Blog list** | `/blog` | ✅ | ✅ own | ✅ | ⚠️ inline Blog | ❌ |
| 56 | **Blog článek** | `/blog/[slug]` | ✅ generateMetadata | ✅ own | ✅ | ⚠️ inline (ne helper) | ❌ |

**Akce:**
- #55: Nahradit inline JSON-LD za `generateWebPageJsonLd()` + přidat BreadcrumbList
- #56: Nahradit inline za `generateArticleJsonLd()` — funkce existuje! Přidat BreadcrumbList
- Přidat `error.tsx` — chybí!

---

### A5. AUTODÍLY

| # | Stránka | URL | Meta | OG | Canonical | JSON-LD | Breadcrumbs | FAQ |
|---|---------|-----|------|-----|-----------|---------|-------------|-----|
| 57 | **Díly home** | `/dily` | ✅ | ✅ own | ✅ | ⚠️ inline FAQ | ❌ | ✅ |
| 58 | **Díly katalog** | `/dily/katalog` | ✅ | 🔶 dily | ✅ | ⚠️ inline | ❌ | ❌ |
| 59 | **Detail dílu** | `/dily/[slug]` | ✅ generateMetadata | 🔶 dily | ⚠️ chybí | ⚠️ inline (ne helper) | ❌ | ➖ |
| 60 | **Kategorie** | `/dily/kategorie/[slug]` | ✅ generateMetadata | 🔶 dily | ✅ | ✅ Breadcrumb+FAQ | ✅ | ✅ |
| 61 | **Brand** | `/dily/znacka/[brand]` | ✅ generateMetadata | 🔶 dily | ✅ | ✅ Org+ItemList+FAQ | ❌ | ✅ |
| 62 | **Brand+Model** | `/dily/znacka/[brand]/[model]` | ✅ generateMetadata | 🔶 dily | ✅ | ✅ Org+ItemList+FAQ | ❌ | ✅ |
| 63 | **Brand+Model+Rok** | `/dily/znacka/.../[rok]` | ✅ generateMetadata | 🔶 dily | ✅ | ✅ Org+ItemList+FAQ | ❌ | ✅ |
| 64 | **Vrakoviště** | `/dily/vrakoviste/[slug]` | ✅ generateMetadata | 🔶 dily | ✅ | ✅ Breadcrumb+Store+ItemList+Org | ✅ | ❌ |
| 65 | **Košík** | `/dily/kosik` | ❌ | 🔶 dily | ➖ | ➖ | ➖ | ➖ |
| 66 | **Objednávka** | `/dily/objednavka` | ❌ | 🔶 dily | ➖ | ➖ | ➖ | ➖ |
| 67 | **Objednávka potvrzení** | `/dily/objednavka/potvrzeni` | ❌ | 🔶 dily | ➖ | ➖ | ➖ | ➖ |
| 68 | **Moje objednávky** | `/dily/moje-objednavky` | ❌ | 🔶 dily | ➖ | ➖ | ➖ | ➖ |

**Akce:**
- #59: CRITICAL — Přidat `generatePartProductJsonLd()` (funkce existuje, NEPOUŽÍVÁ SE!) + přidat canonical
- #61-63: Přidat `generateBreadcrumbJsonLd`
- #65-68: Přidat noindex metadata — checkout/account stránky

---

### A6. SHOP (Eshop)

| # | Stránka | URL | Meta | OG | Canonical | JSON-LD | noindex |
|---|---------|-----|------|-----|-----------|---------|---------|
| 69 | **Shop home** | `/shop` | ✅ | ✅ own | ✅ | ✅ WebPage | ➖ |
| 70 | **Katalog** | `/shop/katalog` | ✅ | 🔶 shop | ✅ | ⚠️ inline | ➖ |
| 71 | **Produkt** | `/shop/produkt/[slug]` | ✅ generateMetadata | 🔶 shop | ✅ | ⚠️ inline | ➖ |
| 72 | **Košík** | `/shop/kosik` | ❌ | 🔶 shop | ➖ | ➖ | ❌ needs noindex |
| 73 | **Objednávka** | `/shop/objednavka` | ❌ | 🔶 shop | ➖ | ➖ | ❌ needs noindex |
| 74 | **Objednávka potvrzení** | `/shop/objednavka/potvrzeni` | ❌ | 🔶 shop | ➖ | ➖ | ❌ needs noindex |
| 75 | **Moje objednávky** | `/shop/moje-objednavky` | ❌ | 🔶 shop | ➖ | ➖ | ❌ needs noindex |
| 76 | **Sledování** | `/shop/objednavky/sledovani/[token]` | ❌ | 🔶 shop | ➖ | ➖ | ❌ needs noindex |
| 77 | **Reklamace** | `/shop/reklamace` | ✅ | 🔶 shop | ✅ | ⚠️ inline | ➖ |
| 78 | **Vrácení zboží** | `/shop/vraceni-zbozi` | ✅ | 🔶 shop | ✅ | ✅ WebPage | ➖ |
| 79 | **Reklamace detail** | `/shop/moje-objednavky/[id]/reklamace` | ❌ | 🔶 shop | ➖ | ➖ | ❌ needs noindex |
| 80 | **Vrácení detail** | `/shop/moje-objednavky/[id]/vraceni` | ❌ | 🔶 shop | ➖ | ➖ | ❌ needs noindex |

**Akce:**
- #71: Přidat Product JSON-LD (inline → helper)
- #72-76, #79-80: Přidat noindex — checkout/account stránky

---

### A7. AUTOSERVISY & STK

| # | Stránka | URL | Meta | OG | Canonical | JSON-LD | Breadcrumbs | FAQ |
|---|---------|-----|------|-----|-----------|---------|-------------|-----|
| 81 | **Autoservisy list** | `/autoservisy` | ✅ | ✅ own | ✅ | ❌ | ❌ | ❌ |
| 82 | **Autoservis detail** | `/autoservisy/[slug]` | ✅ generateMetadata | 🔶 autoservisy | ⚠️ chybí | ⚠️ inline (ne LocalBusiness helper) | ❌ | ➖ |
| 83 | **STK list** | `/stk` | ✅ | ✅ own | ✅ | ❌ | ❌ | ❌ |
| 84 | **STK detail** | `/stk/[slug]` | ✅ generateMetadata | 🔶 stk | ⚠️ chybí | ⚠️ inline | ❌ | ➖ |

**Akce:**
- #81: Přidat ItemList + FAQ JSON-LD ("Jak vybrat autoservis?", "Kolik stojí servis?")
- #82: Přidat `generateLocalBusinessJsonLd()` + canonical + BreadcrumbList
- #83: Přidat ItemList + FAQ JSON-LD ("Kolik stojí STK?", "Jak často na STK?", "Co je potřeba na STK?")
- #84: Přidat LocalBusiness JSON-LD + canonical + BreadcrumbList
- Oba: Přidat `error.tsx`

---

### A8. MAKLÉŘI & PROFILY

| # | Stránka | URL | Meta | OG | Canonical | JSON-LD | Breadcrumbs |
|---|---------|-----|------|-----|-----------|---------|-------------|
| 85 | **Makléři list** | `/makleri` | ✅ | ✅ own | ✅ | ✅ ItemList | ❌ |
| 86 | **Makléř tag** | `/makleri/[slug]` | ✅ generateMetadata | 🔶 makleri | ✅ | ❌ | ❌ |
| 87 | **Profil makléře** | `/profil/[slug]` | ✅ generateMetadata | ✅ own | ✅ | ✅ Person | ❌ |

**Akce:**
- #85-86: Přidat BreadcrumbList
- #87: Přidat BreadcrumbList + error.tsx

---

### A9. INZERCE

| # | Stránka | URL | Meta | OG | Canonical | JSON-LD | noindex |
|---|---------|-----|------|-----|-----------|---------|---------|
| 88 | **Inzerce home** | `/inzerce` | ✅ | ✅ own | ✅ | ✅ WebPage | ➖ |
| 89 | **Inzerce katalog** | `/inzerce/katalog` | ⚠️ redirect | 🔶 | ➖ | ➖ | ➖ |
| 90 | **Přidat inzerát** | `/inzerce/pridat` | ❌ | 🔶 inzerce | ❌ | ❌ | ❌ needs noindex |
| 91 | **Registrace** | `/inzerce/registrace` | ❌ | 🔶 inzerce | ❌ | ❌ | ❌ needs noindex |

**Akce:**
- #90-91: Přidat noindex

---

### A10. MARKETPLACE

| # | Stránka | URL | Meta | OG | Canonical | JSON-LD | noindex |
|---|---------|-----|------|-----|-----------|---------|---------|
| 92 | **Marketplace home** | `/marketplace` | ✅ | ✅ own | ✅ | ⚠️ inline | ➖ |
| 93 | **Apply** | `/marketplace/apply` | ✅ | 🔶 marketplace | ✅ | ❌ | ➖ |
| 94 | **Investor dashboard** | `/marketplace/investor/*` | ❌ | 🔶 | ➖ | ➖ | ❌ needs noindex |
| 95 | **Dealer dashboard** | `/marketplace/dealer/*` | ❌ | 🔶 | ➖ | ➖ | ❌ needs noindex |

**Akce:**
- #94-95: Přidat noindex (already blocked in robots.txt but belt-and-suspenders)

---

### A11. INFORMAČNÍ STRÁNKY

| # | Stránka | URL | Meta | OG | Canonical | JSON-LD | Breadcrumbs |
|---|---------|-----|------|-----|-----------|---------|-------------|
| 96 | **O nás** | `/o-nas` | ✅ | ✅ own | ✅ | ⚠️ inline | ❌ |
| 97 | **Kontakt** | `/kontakt` | ✅ | ✅ own | ✅ | ⚠️ inline | ❌ |
| 98 | **Ceník** | `/cenik` | ✅ | ✅ own | ✅ | ❌ | ❌ |
| 99 | **Recenze** | `/recenze` | ✅ | ✅ own | ✅ | ✅ AggregateRating (layout) | ❌ |
| 100 | **Kariéra** | `/kariera` | ✅ | ✅ own | ✅ | ✅ JobPosting (layout) | ❌ |
| 101 | **Pro makléře** | `/pro-maklere` | ✅ | 🔶 root | ✅ | ❌ | ❌ |
| 102 | **Bazar detail** | `/bazar/[slug]` | ✅ generateMetadata | 🔶 root | ✅ | ✅ LocalBusiness | ❌ |

**Akce:**
- #96: Přidat BreadcrumbList, nahradit inline → helper
- #97: Přidat BreadcrumbList, ověřit LocalBusiness JSON-LD
- #98: Přidat FAQ JSON-LD ("Kolik stojí prodej?", "Jaká je provize?"), BreadcrumbList — CHYBÍ V SITEMAP!
- #99: Přidat BreadcrumbList
- #100: Přidat BreadcrumbList
- #101: Přidat BreadcrumbList, WebPage JSON-LD

---

### A12. PRÁVNÍ STRÁNKY

| # | Stránka | URL | Meta | OG | Canonical | JSON-LD |
|---|---------|-----|------|-----|-----------|---------|
| 103 | **Obch. podmínky** | `/obchodni-podminky` | ✅ | 🔶 root | ✅ | ⚠️ inline |
| 104 | **Ochrana OÚ** | `/ochrana-osobnich-udaju` | ✅ | 🔶 root | ✅ | ✅ WebPage |
| 105 | **Reklamační řád** | `/reklamacni-rad` | ✅ | ❌ CHYBÍ OG | ✅ | ✅ WebPage |
| 106 | **Cookies** | `/zasady-cookies` | ✅ | 🔶 root | ✅ | ❌ |

**Akce:**
- #105: Přidat opengraph-image.tsx (1 ze 4 stránek bez OG)
- #106: Přidat WebPage JSON-LD

---

### A13. AUTH & ACCOUNT STRÁNKY (musí mít noindex)

| # | Stránka | URL | noindex | Status |
|---|---------|-----|---------|--------|
| 107 | Login | `/login` | ❌ | Přidat noindex |
| 108 | Registrace | `/registrace` | ❌ | Přidat noindex |
| 109 | Zapomenuté heslo | `/zapomenute-heslo` | ❌ | Přidat noindex |
| 110 | Reset hesla | `/reset-hesla/[token]` | ❌ | Přidat noindex |
| 111 | Ověření emailu | `/overeni-emailu/*` | ❌ | Přidat noindex (3 stránky) |
| 112 | Notifikace | `/notifikace/[token]` | ✅ | OK |
| 113 | Můj účet | `/muj-ucet/*` | ❌ | Přidat noindex |
| 114 | Moje inzeráty | `/moje-inzeraty/*` | ❌ | Přidat noindex |

---

## ČÁST B: NEPOUŽITÉ JSON-LD GENERÁTORY

| # | Funkce | Schema typ | Kde MUSÍ být použita | Priorita |
|---|--------|------------|---------------------|----------|
| 1 | `generateVehicleJsonLd()` | Vehicle | `/nabidka/[slug]` — detail vozidla | **CRITICAL** |
| 2 | `generatePartProductJsonLd()` | Product | `/dily/[slug]` — detail dílu | **HIGH** |
| 3 | `generateBrandItemListJsonLd()` | ItemList | `/nabidka/{brand}` — brand pages (16) | **HIGH** |
| 4 | `generateAggregateOfferJsonLd()` | Product+AggregateOffer | `/nabidka/{brand}/{model}` — price ranges | **MEDIUM** |
| 5 | `generateWebSiteJsonLd()` | WebSite+SearchAction | Root layout / homepage | **HIGH** |
| 6 | `generateWebApplicationJsonLd()` | WebApplication | Nikde — nepotřebné | **SKIP** |

---

## ČÁST C: INLINE JSON-LD → HELPER MIGRACE

13 stránek má inline, ručně psané JSON-LD místo helperů z `lib/seo.ts`:

| # | Stránka | Aktuální inline schema | Nahradit za helper |
|---|---------|----------------------|-------------------|
| 1 | `/` (homepage) | Organization | `generateOrganizationJsonLd()` + `generateWebSiteJsonLd()` |
| 2 | `/nabidka` | ItemList | `generateItemListJsonLd()` (už používá?) |
| 3 | `/dily` | FAQPage | `generateFaqJsonLd()` |
| 4 | `/blog` | Blog | `generateWebPageJsonLd()` |
| 5 | `/chci-prodat` | custom | `generateWebPageJsonLd()` |
| 6 | `/jak-to-funguje` | custom | `generateWebPageJsonLd()` + FAQ |
| 7 | `/kontakt` | custom | `generateLocalBusinessJsonLd()` |
| 8 | `/marketplace` | custom | `generateWebPageJsonLd()` |
| 9 | `/o-nas` | custom | `generateWebPageJsonLd()` |
| 10 | `/obchodni-podminky` | custom | `generateWebPageJsonLd()` |
| 11 | `/autoservisy/[slug]` | inline | `generateLocalBusinessJsonLd()` |
| 12 | `/blog/[slug]` | inline | `generateArticleJsonLd()` |
| 13 | `/dily/[slug]` | inline | `generatePartProductJsonLd()` |

---

## ČÁST D: OG IMAGE GAPS

| # | Stránka | Status | Akce |
|---|---------|--------|------|
| 1 | `/overeni-emailu/[token]` | ❌ Chybí | Nepotřebuje (noindex stránka) |
| 2 | `/overeni-emailu/chyba` | ❌ Chybí | Nepotřebuje (noindex stránka) |
| 3 | `/overeni-emailu/uspech` | ❌ Chybí | Nepotřebuje (noindex stránka) |
| 4 | `/reklamacni-rad` | ❌ Chybí | **PŘIDAT** — veřejná stránka |

**Celkové OG pokrytí: 19/19 potřebných** (jen 1 reálná mezera — reklamacni-rad)

---

## ČÁST E: SITEMAP GAPS

| # | Chybějící URL | Priorita | Akce |
|---|---------------|----------|------|
| 1 | `/cenik` | HIGH | Přidat do statických URL v sitemap.ts |
| 2 | `/autoservisy` | MEDIUM | Ověřit — možná v dynamických |
| 3 | `/stk` | MEDIUM | Ověřit — možná v dynamických |
| 4 | `/autoservisy/[slug]` | MEDIUM | Ověřit dynamické generování |
| 5 | `/stk/[slug]` | MEDIUM | Ověřit dynamické generování |

**NESMÍ být v sitemap (noindex stránky):**
- `/hledat`, checkout, account, auth stránky

---

## ČÁST F: NOINDEX STRÁNKY — KOMPLETNÍ SEZNAM

Všechny tyto stránky MUSÍ mít `robots: { index: false, follow: true }`:

| # | Stránka | Důvod |
|---|---------|-------|
| 1 | `/hledat` | Search results — duplicate content |
| 2 | `/login` | Auth stránka |
| 3 | `/registrace` | Auth stránka |
| 4 | `/zapomenute-heslo` | Auth stránka |
| 5 | `/reset-hesla/[token]` | Auth stránka |
| 6 | `/overeni-emailu/*` (3 stránky) | Auth stránka |
| 7 | `/muj-ucet/*` | User account |
| 8 | `/moje-inzeraty/*` | User account |
| 9 | `/shop/kosik` | Checkout |
| 10 | `/shop/objednavka` | Checkout |
| 11 | `/shop/objednavka/potvrzeni` | Checkout |
| 12 | `/shop/moje-objednavky` | User account |
| 13 | `/shop/moje-objednavky/[id]/*` | User account |
| 14 | `/shop/objednavky/sledovani/[token]` | User account |
| 15 | `/dily/kosik` | Checkout |
| 16 | `/dily/objednavka` | Checkout |
| 17 | `/dily/objednavka/potvrzeni` | Checkout |
| 18 | `/dily/moje-objednavky` | User account |
| 19 | `/inzerce/pridat` | User action |
| 20 | `/inzerce/registrace` | Auth stránka |
| 21 | `/nabidka/[slug]/platba/uspech` | Transaction |
| 22 | `/marketplace/investor/*` | Protected dashboard |
| 23 | `/marketplace/dealer/*` | Protected dashboard |

**Nejlepší přístup:** Přidat noindex do **layout.tsx** pro celé skupiny:
- `app/(web)/shop/kosik/layout.tsx` nebo parent layout
- `app/(web)/dily/kosik/layout.tsx` nebo parent layout
- Auth stránky — middleware nebo layout

---

## ČÁST G: llms.txt

Vytvořit `/public/llms.txt`:

```markdown
# CarMakléř

> CarMakléř je česká platforma pro prodej a nákup ojetých vozidel přes síť certifikovaných makléřů. Nabízí 4 propojené služby: makléřskou síť, inzertní platformu, eshop s autodíly a investiční marketplace.

## Hlavní stránky
- [Nabídka vozidel](https://carmakler.cz/nabidka): Katalog ojetých vozidel s filtry podle značky, modelu, ceny a lokality
- [Chci prodat auto](https://carmakler.cz/chci-prodat): Prodej vozu přes ověřeného makléře — provize 5%, min. 25 000 Kč
- [Makléři](https://carmakler.cz/makleri): Adresář certifikovaných automakléřů s hodnocením a specializací
- [Autodíly](https://carmakler.cz/dily): E-shop s novými a použitými díly z ověřených vrakovišť
- [Autoservisy](https://carmakler.cz/autoservisy): Adresář autoservisů s recenzemi zákazníků
- [STK stanice](https://carmakler.cz/stk): Adresář STK stanic s cenami a hodnocením
- [Blog](https://carmakler.cz/blog): Články o prodeji/nákupu aut, údržbě, financování a pojištění

## Služby
- [Prověrka vozidla](https://carmakler.cz/sluzby/proverka): Kompletní kontrola historie a technického stavu vozu
- [Financování](https://carmakler.cz/sluzby/financovani): Kalkulačka financování s porovnáním nabídek
- [Pojištění](https://carmakler.cz/sluzby/pojisteni): Srovnání povinného ručení a havarijního pojištění

## Jak to funguje
- [Jak prodat auto](https://carmakler.cz/jak-prodat-auto): Průvodce prodejem auta přes CarMakléř
- [Kolik stojí moje auto](https://carmakler.cz/kolik-stoji-moje-auto): AI odhad tržní ceny vozidla
- [Ceník](https://carmakler.cz/cenik): Transparentní ceník služeb

## O nás
- [O společnosti](https://carmakler.cz/o-nas): Příběh a hodnoty CarMakléř
- [Recenze](https://carmakler.cz/recenze): Hodnocení od zákazníků
- [Kontakt](https://carmakler.cz/kontakt): Kontaktní údaje a formulář
- [Kariéra](https://carmakler.cz/kariera): Volné pozice — staň se makléřem

## Optional
- [Sitemap](https://carmakler.cz/sitemap.xml)
```

---

## ČÁST H: BREADCRUMB POKRYTÍ

### Stránky které MUSÍ mít BreadcrumbList JSON-LD:

| # | Stránka | Breadcrumb path | Status |
|---|---------|----------------|--------|
| 1 | `/nabidka/[slug]` | Domů → Nabídka → {Značka} → {Model} | ✅ |
| 2 | `/nabidka/{brand}` | Domů → Nabídka → {Značka} | ❌ |
| 3 | `/nabidka/{brand}/{model}` | Domů → Nabídka → {Značka} → {Model} | ❌ |
| 4 | `/nabidka/{bodytype}` | Domů → Nabídka → {Typ karoserie} | ✅ |
| 5 | `/nabidka/{price}` | Domů → Nabídka → {Cenová kategorie} | ✅ |
| 6 | `/nabidka/{city}` | Domů → Nabídka → {Město} | ✅ |
| 7 | `/dily/[slug]` | Domů → Díly → {Kategorie} → {Díl} | ❌ |
| 8 | `/dily/kategorie/[slug]` | Domů → Díly → {Kategorie} | ✅ |
| 9 | `/dily/znacka/[brand]` | Domů → Díly → {Značka} | ❌ |
| 10 | `/dily/znacka/[brand]/[model]` | Domů → Díly → {Značka} → {Model} | ❌ |
| 11 | `/dily/znacka/.../[rok]` | Domů → Díly → {Značka} → {Model} → {Rok} | ❌ |
| 12 | `/dily/vrakoviste/[slug]` | Domů → Díly → Vrakoviště → {Název} | ✅ |
| 13 | `/blog/[slug]` | Domů → Blog → {Článek} | ❌ |
| 14 | `/autoservisy/[slug]` | Domů → Autoservisy → {Název} | ❌ |
| 15 | `/stk/[slug]` | Domů → STK → {Název} | ❌ |
| 16 | `/profil/[slug]` | Domů → Makléři → {Jméno} | ❌ |
| 17 | `/bazar/[slug]` | Domů → Bazary → {Název} | ❌ |
| 18 | `/sluzby/proverka` | Domů → Služby → Prověrka | ❌ |
| 19 | `/sluzby/financovani` | Domů → Služby → Financování | ❌ |
| 20 | `/sluzby/pojisteni` | Domů → Služby → Pojištění | ❌ |
| 21 | `/shop/produkt/[slug]` | Domů → Shop → {Produkt} | ❌ |
| 22 | `/shop/katalog` | Domů → Shop → Katalog | ❌ |

**Celkem: 8 OK, 14 chybí**

---

## ČÁST I: FAQ SCHEMA — NOVÉ FAQ

### Stránky které potřebují FAQ schema:

#### 1. `/cenik` — Ceník
```json
[
  {"q": "Kolik stojí prodej auta přes CarMakléř?", "a": "Provize je 5% z prodejní ceny, minimálně 25 000 Kč. Cena je all-inclusive — žádné skryté poplatky."},
  {"q": "Platím něco předem?", "a": "Ne, provizi platíte až po úspěšném prodeji vozidla."},
  {"q": "Kolik stojí inzerát na CarMakléř?", "a": "Základní inzerát je zdarma. Zvýrazněné inzeráty mají příplatek."},
  {"q": "Jsou nějaké měsíční poplatky?", "a": "Ne, CarMakléř neúčtuje žádné měsíční poplatky ani předplatné."}
]
```

#### 2. `/autoservisy` — Autoservisy
```json
[
  {"q": "Jak vybrat spolehlivý autoservis?", "a": "Porovnejte hodnocení zákazníků, specializaci servisu a ceny. Na CarMakléř najdete ověřené servisy s recenzemi."},
  {"q": "Kolik stojí běžný servis auta?", "a": "Cena závisí na typu vozu a servisu. Orientační ceny najdete u každého servisu v katalogu."},
  {"q": "Jak napsat recenzi na autoservis?", "a": "U každého servisu najdete tlačítko 'Napsat recenzi'. Recenze je po schválení zveřejněna."}
]
```

#### 3. `/stk` — STK
```json
[
  {"q": "Kolik stojí STK v roce 2026?", "a": "Cena STK se liší podle stanice, orientačně 700-1 500 Kč. Aktuální ceny najdete u každé stanice."},
  {"q": "Jak často musím na STK?", "a": "Nové auto po 4 letech, pak každé 2 roky. Vozidla starší 10 let musí na STK každý rok."},
  {"q": "Co potřebuji na STK?", "a": "Technický průkaz, osvědčení o registraci, doklad o pojištění a platnou emisní kontrolu."},
  {"q": "Co když auto neprojde STK?", "a": "Máte 30 dní na opravu závad a opakovanou kontrolu za sníženou cenu."}
]
```

#### 4. `/sluzby` — Služby overview
```json
[
  {"q": "Jaké služby CarMakléř nabízí?", "a": "Prověrku vozidla, financování, pojištění a zprostředkování prodeje přes certifikované makléře."},
  {"q": "Jsou služby zdarma?", "a": "Většina služeb je součástí provize za prodej. Individuální služby mají vlastní ceník."}
]
```

#### 5. `/nabidka` — Nabídka vozidel
```json
[
  {"q": "Jak nakoupit auto přes CarMakléř?", "a": "Vyberte si auto z nabídky, kontaktujte makléře a domluvte si prohlídku. Makléř zajistí vše od prověrky po převod."},
  {"q": "Jsou auta na CarMakléř prověřená?", "a": "Ano, každé vozidlo prochází prověrkou historie, technického stavu a právní čistoty."},
  {"q": "Mohu auto financovat?", "a": "Ano, nabízíme financování s výhodným úrokem. Kalkulačku najdete u každého vozidla."}
]
```

#### 6. Homepage `/`
```json
[
  {"q": "Co je CarMakléř?", "a": "CarMakléř je česká platforma pro bezpečný prodej a nákup ojetých vozidel přes síť certifikovaných makléřů."},
  {"q": "Jak CarMakléř funguje?", "a": "Makléř nabere vaše auto, vytvoří profesionální inzerát, zajistí prověrku a zprostředkuje prodej. Vy platíte provizi 5% až po prodeji."},
  {"q": "Je CarMakléř zdarma?", "a": "Ano, služba je bez poplatků předem. Provizi 5% (min. 25 000 Kč) platíte až po úspěšném prodeji."}
]
```

---

## ČÁST J: INTERNAL LINKING GAPS

### Chybějící cross-links:

| # | Odkud | Kam | Typ | Priorita |
|---|-------|-----|-----|----------|
| 1 | Blog články | Služby stránky | Kontextové CTA v článcích | HIGH |
| 2 | Blog články | Relevantní vozidla | "Hledáte {značka}? Podívejte se na nabídku" | HIGH |
| 3 | Autoservisy | Nabídka vozidel | "Hledáte auto? Podívejte se na nabídku" | MEDIUM |
| 4 | STK | Nabídka vozidel | "Po STK hledáte nové auto?" | MEDIUM |
| 5 | Footer (hlavní) | Autoservisy, STK | Přidat do "Služby" sloupce | MEDIUM |
| 6 | Služby stránky | Blog články | "Přečtěte si více o {téma}" | LOW |
| 7 | Ceník | Služby | Link na jednotlivé služby | MEDIUM |

### Akce pro Footer:
Přidat do MainFooter, sloupec "Služby":
```
+ /autoservisy — Autoservisy
+ /stk — STK stanice
```

---

## ČÁST K: error.tsx + loading.tsx GAPS

### Veřejné stránky bez error.tsx:

| # | Stránka | loading.tsx | error.tsx | Akce |
|---|---------|-----------|----------|------|
| 1 | `/blog` | ❌ | ❌ | Přidat oba |
| 2 | `/blog/[slug]` | ✅ | ❌ | Přidat error.tsx |
| 3 | `/autoservisy` | ✅ | ❌ | Přidat error.tsx |
| 4 | `/autoservisy/[slug]` | ✅ | ❌ | Přidat error.tsx |
| 5 | `/cenik` | ❌ | ❌ | Přidat oba |
| 6 | `/hledat` | ✅ | ❌ | Přidat error.tsx |
| 7 | `/chci-prodat` | ✅ | ❌ | Přidat error.tsx |
| 8 | `/kariera` | ✅ | ❌ | Přidat error.tsx |
| 9 | `/makleri` | ✅ | ❌ | Přidat error.tsx |
| 10 | `/recenze` | ✅ | ❌ | Přidat error.tsx |
| 11 | `/stk` | ✅ | ❌ | Přidat error.tsx |
| 12 | `/stk/[slug]` | ✅ | ❌ | Přidat error.tsx |
| 13 | `/profil/[slug]` | ✅ | ❌ | Přidat error.tsx |
| 14 | `/jak-to-funguje` | ❌ | ❌ | Přidat oba |
| 15 | `/pro-maklere` | ❌ | ❌ | Přidat oba |

---

## IMPLEMENTAČNÍ PLÁN — FÁZOVÁNÍ

### Fáze 1: CRITICAL (1-2 dny) — Nejvyšší SEO dopad

| # | Akce | Soubory | Effort |
|---|------|---------|--------|
| 1.1 | Vehicle JSON-LD (plný `Car` schema) na `/nabidka/[slug]` | `app/(web)/nabidka/[slug]/page.tsx` + `lib/seo.ts` | 1h |
| 1.2 | Part Product JSON-LD na `/dily/[slug]` | `app/(web)/dily/[slug]/page.tsx` | 30 min |
| 1.3 | WebSite JSON-LD na homepage | `app/(web)/page.tsx` nebo layout | 15 min |
| 1.4 | Article JSON-LD na `/blog/[slug]` (inline → helper) | `app/(web)/blog/[slug]/page.tsx` | 30 min |
| 1.5 | Canonical na autoservisy/stk detail | 2× page.tsx | 15 min |
| 1.6 | noindex na 23 private stránek | 5-8 layout.tsx | 1h |
| 1.7 | FAQ na homepage, nabídka, ceník, STK, autoservisy | 5× page.tsx | 2h |
| 1.8 | llms.txt | `public/llms.txt` | 30 min |
| 1.9 | Fix shop/produkt canonical (hardcoded → pageCanonical) | `app/(web)/shop/produkt/[slug]/page.tsx` | 5 min |
| 1.10 | Fix blog author link `/makler/` → `/profil/` | `app/(web)/blog/[slug]/page.tsx` | 5 min |
| 1.11 | Přidat OAI-SearchBot, Claude-User, Claude-SearchBot do robots.ts | `app/robots.ts` | 15 min |
| 1.12 | Bing Webmaster Tools registrace (manuální) | — | 30 min |

### Fáze 2: HIGH (2-3 dny) — Breadcrumbs + metadata + linking

| # | Akce | Soubory | Effort |
|---|------|---------|--------|
| 2.1 | generateMetadata na brand pages (16) | 16× page.tsx (nebo 1 dynamic) | 2h |
| 2.2 | generateMetadata na bodytype pages (7) | 7× page.tsx (nebo 1 dynamic) | 1h |
| 2.3 | generateMetadata na price pages (5) | 5× page.tsx (nebo 1 dynamic) | 30 min |
| 2.4 | generateMetadata na city pages (8) | 8× page.tsx (nebo 1 dynamic) | 1h |
| 2.5 | BreadcrumbList na 14 chybějících stránek | 14× page.tsx | 2h |
| 2.6 | BrandItemList + AggregateOffer na brand pages | 16× page.tsx | 2h |
| 2.7 | LocalBusiness na autoservisy/stk detail (inline → helper) | 2× page.tsx | 1h |
| 2.8 | Inline → helper migrace (13 stránek) | 13× page.tsx | 3h |
| 2.9 | OG metadata na dynamic pages (Part, AutoServis, STK, Shop, Bazar) | 5× page.tsx | 1h |
| 2.10 | Footer: přidat Autoservisy + STK | `components/main/Footer.tsx` | 15 min |
| 2.11 | Navbar: přidat Autoservisy + STK do dropdown Služby | `components/main/Navbar.tsx` | 15 min |
| 2.12 | Blog: BlogCrossLinks komponentu (→ služby, vozidla) | NEW component + blog page | 1h |
| 2.13 | "Answer-first" paragrafy na top 10 stránek | 10× page.tsx | 2h |

### Fáze 3: MEDIUM (2-3 dny) — 404, linking, polishing

| # | Akce | Soubory | Effort |
|---|------|---------|--------|
| 3.1 | FAQ na služby stránky (3) | 3× page.tsx | 1h |
| 3.2 | error.tsx na 15 stránek | 15× error.tsx | 2h |
| 3.3 | loading.tsx na 5 stránek | 5× loading.tsx | 1h |
| 3.4 | OG image na `/reklamacni-rad` | 1× opengraph-image.tsx | 30 min |
| 3.5 | 7× not-found.tsx s helpful content | 7× not-found.tsx | 2h |
| 3.6 | Přidat `/cenik` do sitemap | sitemap.ts | 15 min |
| 3.7 | WebPage JSON-LD na zbývající stránky | 5× page.tsx | 1h |
| 3.8 | `data-speakable` atributy na klíčové elementy | 10+ komponent | 1h |
| 3.9 | Vehicle detail: "Servisy v okolí" sekce | nabidka/[slug]/page.tsx | 1h |
| 3.10 | Service pages: kontextové linky | 3× sluzby/*/page.tsx | 1h |
| 3.11 | Parts detail: PartsToVehicleBridge | dily/[slug]/page.tsx | 30 min |
| 3.12 | Homepage: Autoservisy/STK sekce | page.tsx | 1h |
| 3.13 | Root not-found.tsx vylepšení (search + doporučení) | app/not-found.tsx | 30 min |
| 3.14 | Fix soft 404 overeni-emailu | overeni-emailu/[token]/page.tsx | 15 min |
| 3.15 | Fact density — statistiky na landing pages | 5+ stránek | 2h |
| 3.16 | `llms-full.txt` pro služby sekce | `public/llms-full.txt` | 1h |
| 3.17 | Audit INP přes PageSpeed Insights | — | 1h |

### Fáze 4: STRATEGIC (ongoing)

| # | Akce | Effort | Priorita |
|---|------|--------|----------|
| 4.1 | Blog content strategy — 10 článků na target keywords | 20h | HIGH |
| 4.2 | Google Business Profile setup (manuální) | 2h | HIGH |
| 4.3 | NAP konzistence audit | 2h | MEDIUM |
| 4.4 | Lokální citace (Firmy.cz, Mapy.cz) | 3h | MEDIUM |
| 4.5 | Google Search Console monitoring | 1h | HIGH |
| 4.6 | Srovnávací content ("Nejlepší SUV 2026", "EV vs diesel TCO") | 10h | MEDIUM |
| 4.7 | Reddit/forum presence pro automotive témata | Ongoing | MEDIUM |
| 4.8 | Blog pipeline (2 články/týden) | Ongoing | HIGH |
| 4.9 | Core Web Vitals monitoring | Setup 1h | MEDIUM |
| 4.10 | Competitive keyword monitoring | Setup 1h | MEDIUM |

---

## ČÁST L: REDIRECTY, 404 & NOT-FOUND HANDLING

### L1. Existující not-found.tsx soubory (4)

| # | Soubor | Co zobrazuje | Linky | Status |
|---|--------|-------------|-------|--------|
| 1 | `app/not-found.tsx` | "Stránka nenalezena" (404) | Hlavní stránka + Nabídka | ✅ OK |
| 2 | `app/(web)/makleri/[slug]/not-found.tsx` | "Tento hashtag nemá makléře" | Všichni makléři + Domů | ✅ OK |
| 3 | `app/(web)/autoservisy/[slug]/not-found.tsx` | "Servis nenalezen" | Zpět na servisy | ✅ OK |
| 4 | `app/(web)/stk/[slug]/not-found.tsx` | "STK stanice nenalezena" | Zpět na STK | ✅ OK |
| 5 | `app/(web)/marketplace/deals/[id]/not-found.tsx` | "Flip nenalezen" | Zpět na Marketplace | ✅ OK |

### L2. Chybějící not-found.tsx (potřeba přidat)

| # | Route | Proč potřebuje | Breadcrumb v 404 |
|---|-------|---------------|-----------------|
| 1 | `app/(web)/nabidka/[slug]/not-found.tsx` | Prodané/smazané vozidlo | Nabídka → "Vozidlo nenalezeno" + podobná vozidla |
| 2 | `app/(web)/dily/[slug]/not-found.tsx` | Vyprodaný díl | Díly → "Díl nenalezen" + podobné díly |
| 3 | `app/(web)/blog/[slug]/not-found.tsx` | Smazaný článek | Blog → "Článek nenalezen" + nejnovější články |
| 4 | `app/(web)/profil/[slug]/not-found.tsx` | Neaktivní makléř | Makléři → "Profil nenalezen" + ostatní makléři |
| 5 | `app/(web)/shop/produkt/[slug]/not-found.tsx` | Vyprodaný produkt | Shop → "Produkt nenalezen" + podobné produkty |
| 6 | `app/(web)/bazar/[slug]/not-found.tsx` | Neaktivní bazar | "Bazar nenalezen" + seznam bazarů |
| 7 | `app/(web)/dily/vrakoviste/[slug]/not-found.tsx` | Neaktivní vrakoviště | Díly → "Vrakoviště nenalezeno" |

**Vzor pro helpful 404 stránky:**
```tsx
// Každá not-found.tsx MUSÍ obsahovat:
// 1. Jasný nadpis ("Vozidlo nenalezeno")
// 2. Vysvětlení ("Toto vozidlo bylo pravděpodobně prodáno")
// 3. CTA zpět na seznam
// 4. "Podobné položky" sekce (3-6 alternativ)
// 5. Search bar (pokud dostupný)
```

### L3. Existující redirecty

**next.config.ts (2 redirecty):**
| # | Source | Destination | Status | Poznámka |
|---|--------|-------------|--------|----------|
| 1 | `www.carmakler.cz/:path*` | `carmakler.cz/:path*` | 301 | Canonical domain ✅ |
| 2 | `/auth/prihlasit` | `/login` | 301 | Legacy URL ✅ |

**middleware.ts redirecty:**
| # | Typ | Popis | Status |
|---|-----|-------|--------|
| 1 | Diacritic 301 | `/dily/znacka/škoda` → `/dily/znacka/skoda` | ✅ OK |
| 2 | Auth redirect | Protected routes → `/login` | ✅ OK |
| 3 | Subdomain rewrite | `inzerce.*` → `/inzerce/*` (internal) | ✅ OK |
| 4 | Site password | → `/gate` if password set | ✅ OK |

**Page-level redirecty (permanentRedirect):**
| # | Source | Destination | Poznámka |
|---|--------|-------------|----------|
| 1 | `/dodavatel/[slug]` | Permanent redirect | Legacy route |
| 2 | `/makler/[slug]` | Permanent redirect | Legacy route |
| 3 | `/h/[slug]` | Permanent redirect | Alias |
| 4 | `/tag/[slug]` | Permanent redirect | Alias |
| 5 | `/prihlaseni` | Permanent redirect | Legacy |
| 6 | `/inzerce/katalog` | `/nabidka` redirect | Consolidation |

### L4. notFound() pokrytí (stav)

**Všechny dynamické detail stránky volají `notFound()`:** ✅
- `/nabidka/[slug]` — ano (line 81)
- `/dily/[slug]` — ano (line 114)
- `/autoservisy/[slug]` — ano (line 63)
- `/stk/[slug]` — ano (line 51)
- `/profil/[slug]` — ano (line 313)
- `/blog/[slug]` — ano (line 89)
- `/shop/produkt/[slug]` — ano (line 105)
- `/bazar/[slug]` — ano (line 37)
- `/marketplace/deals/[id]` — ano (line 63)

### L5. Soft 404 problémy

| # | Stránka | Problém | Fix |
|---|---------|---------|-----|
| 1 | `/overeni-emailu/[token]` | Neplatný token vrací 200 s error UI | Volat `notFound()` pro expirované tokeny |

### L6. Akční plán — Redirecty & 404

| # | Akce | Soubory | Fáze | Effort |
|---|------|---------|------|--------|
| 1 | Vytvořit 7× not-found.tsx s helpful content | 7× not-found.tsx | 3 | 2h |
| 2 | Fix soft 404 na overeni-emailu | 1× page.tsx | 3 | 15 min |
| 3 | Vylepšit root not-found.tsx — přidat search + alternativy | 1× not-found.tsx | 3 | 30 min |

---

## ČÁST M: AUTOMATICKÉ SEO PRO DYNAMICKÉ STRÁNKY

### M1. Aktuální stav — co se generuje automaticky per entity typ

#### Vozidla (`/nabidka/[slug]`)
| Pole | Template | Zdroj dat | Status |
|------|----------|-----------|--------|
| **Title** | `{brand} {model} {variant} ({year}) — {price} Kč` | Vehicle/Listing | ✅ OK |
| **Description** | `{name}, rok {year}, cena {price} Kč. {city}. Prověřené vozidlo na CarMakléř.` | Vehicle/Listing | ✅ OK |
| **OG title** | `{name} — {price} Kč` | Vehicle/Listing | ✅ OK |
| **OG description** | `{name}, rok {year}. Prověřené vozidlo od makléře.` | Vehicle/Listing | ✅ OK |
| **OG image** | Dynamický opengraph-image.tsx s fotkou auta | Vehicle images | ✅ OK |
| **Canonical** | `pageCanonical(/nabidka/{slug})` | slug | ✅ OK |
| **JSON-LD Vehicle** | Vehicle schema (make, model, year, mileage, fuel, transmission, color, offers) | Vehicle fields | ✅ ALE nepoužívá se! |
| **JSON-LD Breadcrumb** | Domů → Nabídka → {Vozidlo} | — | ✅ OK |
| **notFound()** | Ano, line 81 | — | ✅ OK |

**GAP:** `generateVehicleJsonLd()` existuje a je volaná v page.tsx, ale audit zjistil rozpor — OVĚŘIT zda se skutečně renderuje v HTML.

#### Díly (`/dily/[slug]`)
| Pole | Template | Zdroj dat | Status |
|------|----------|-----------|--------|
| **Title** | `{name} — {price} Kč | Díly CarMakléř` | Part | ✅ OK |
| **Description** | `{description.slice(0,155)}` nebo `Kupte {name} za {price} Kč...` | Part | ✅ OK |
| **OG** | ❌ CHYBÍ v metadata objektu | — | ❌ PŘIDAT |
| **OG image** | 🔶 Dědí z `/dily/opengraph-image.tsx` (generický) | — | ⚠️ Ideálně vlastní |
| **Canonical** | `pageCanonical(/dily/{slug})` | slug | ✅ OK |
| **JSON-LD Product** | Product + Offer (name, price, sku, mpn, brand, condition, availability) | Part fields | ✅ OK |
| **JSON-LD Breadcrumb** | ❌ CHYBÍ | — | ❌ PŘIDAT |
| **notFound()** | Ano, line 114 | — | ✅ OK |

#### Autoservisy (`/autoservisy/[slug]`)
| Pole | Template | Zdroj dat | Status |
|------|----------|-----------|--------|
| **Title** | `{name} — autoservis {city} | CarMakléř` | AutoServis | ✅ OK |
| **Description** | `{description.slice(0,160)}` nebo `{name} — {city}. {reviewCount} recenzí...` | AutoServis | ✅ OK |
| **OG** | ❌ CHYBÍ v metadata objektu | — | ❌ PŘIDAT |
| **OG image** | 🔶 Dědí z `/autoservisy/opengraph-image.tsx` | — | ⚠️ OK pro list |
| **Canonical** | `pageCanonical(/autoservisy/{slug})` | slug | ✅ OK |
| **JSON-LD** | AutoRepair + AggregateRating (inline, ne helper) | AutoServis | ⚠️ MIGROVAT na helper |
| **JSON-LD Breadcrumb** | ❌ CHYBÍ | — | ❌ PŘIDAT |
| **notFound()** | Ano, line 63 | — | ✅ OK |

**GAPS:** Chybí opening hours v JSON-LD, chybí categories v JSON-LD, chybí OG v metadata.

#### STK (`/stk/[slug]`)
| Pole | Template | Zdroj dat | Status |
|------|----------|-----------|--------|
| **Title** | `{name} — STK stanice {city} | CarMakléř` | AutoServis | ✅ OK |
| **Description** | `{name} — STK stanice {city}. {reviewCount} recenzí, {averageRating}★, čekací doba {stkWaitDays} dní.` | AutoServis | ✅ OK |
| **OG** | ❌ CHYBÍ v metadata | — | ❌ PŘIDAT |
| **Canonical** | `pageCanonical(/stk/{slug})` | slug | ✅ OK |
| **JSON-LD** | AutoRepair (inline, additionalType: STK) | AutoServis | ⚠️ MIGROVAT |
| **JSON-LD Breadcrumb** | ❌ CHYBÍ | — | ❌ PŘIDAT |
| **notFound()** | Ano, line 51 | — | ✅ OK |

#### Profil makléře (`/profil/[slug]`)
| Pole | Template | Zdroj dat | Status |
|------|----------|-----------|--------|
| **Title** | `{firstName} {lastName} — {roleLabel}` | User | ✅ OK |
| **Description** | `{bio.slice(0,155)}` nebo `Profil {roleLabel} {fullName} z {city}...` | User | ✅ OK |
| **OG** | ✅ title, description, url, type="profile" | User | ✅ OK |
| **OG image** | ✅ Vlastní opengraph-image.tsx | — | ✅ OK |
| **Canonical** | `pageCanonical(/profil/{slug})` | slug | ✅ OK |
| **JSON-LD Person** | Person (name, url, image, jobTitle, address, aggregateRating) | User | ✅ OK |
| **JSON-LD Breadcrumb** | ❌ CHYBÍ | — | ❌ PŘIDAT |
| **notFound()** | Ano, line 313 | — | ✅ OK |

#### Blog článek (`/blog/[slug]`)
| Pole | Template | Zdroj dat | Status |
|------|----------|-----------|--------|
| **Title** | `{seoTitle \|\| title}` | Article | ✅ OK |
| **Description** | `{seoDescription \|\| excerpt}` | Article | ✅ OK |
| **OG** | ✅ title, description | Article | ✅ OK |
| **OG image** | ✅ Vlastní opengraph-image.tsx | — | ✅ OK |
| **Canonical** | `pageCanonical(/blog/{slug})` | slug | ✅ OK |
| **JSON-LD Article** | Article (headline, description, datePublished, dateModified, author, publisher, image) | Article | ✅ OK (inline) |
| **JSON-LD Breadcrumb** | ❌ CHYBÍ | — | ❌ PŘIDAT |
| **notFound()** | Ano, line 89 | — | ✅ OK |

#### Shop produkt (`/shop/produkt/[slug]`)
| Pole | Template | Zdroj dat | Status |
|------|----------|-----------|--------|
| **Title** | `{name} — {price} Kč | Shop CarMakléř` | Part | ✅ OK |
| **Description** | `{description.slice(0,155)}` nebo fallback | Part | ✅ OK |
| **OG** | ❌ CHYBÍ | — | ❌ PŘIDAT |
| **Canonical** | ⚠️ Hardcoded `https://carmakler.cz/dily/{slug}` (ne helper!) | — | ⚠️ FIX na pageCanonical |
| **JSON-LD Product** | Product + Offer | Part | ✅ OK |
| **JSON-LD Breadcrumb** | ❌ CHYBÍ | — | ❌ PŘIDAT |
| **notFound()** | Ano, line 105 | — | ✅ OK |

**BUG:** Canonical URL je hardcoded místo `pageCanonical()` — opravit!

#### Bazar/Dealer (`/bazar/[slug]`)
| Pole | Template | Zdroj dat | Status |
|------|----------|-----------|--------|
| **Title** | `{name} | Ověřený partner CarMakléř` | Partner | ✅ OK |
| **Description** | `{description}` nebo `Autobazar {name} v {city}...` | Partner | ✅ OK |
| **OG** | ❌ CHYBÍ | — | ❌ PŘIDAT |
| **Canonical** | `pageCanonical(/bazar/{slug})` | slug | ✅ OK |
| **JSON-LD LocalBusiness** | LocalBusiness (name, description, url, telephone, address, geo) | Partner | ✅ OK (helper) |
| **JSON-LD Breadcrumb** | ❌ CHYBÍ | — | ❌ PŘIDAT |
| **notFound()** | Ano, line 37 | — | ✅ OK |

#### Vrakoviště (`/dily/vrakoviste/[slug]`)
| Pole | Template | Zdroj dat | Status |
|------|----------|-----------|--------|
| **Title** | `Díly z {name} — Carmakler` | Partner | ✅ OK |
| **Description** | `{partsCount} dílů od ověřeného vrakoviště {name} ({region})...` | Partner+Parts | ✅ OK |
| **OG** | ✅ title, description, url, images | Partner | ✅ OK |
| **Canonical** | `pageCanonical(/dily/vrakoviste/{slug})` | slug | ✅ OK |
| **JSON-LD** | 4 typy: BreadcrumbList + Store + ItemList + Organization | Partner | ✅ NEJLEPŠÍ impl |
| **notFound()** | Ano | — | ✅ OK |

### M2. Souhrnná matice dynamických stránek

| Entity | Title | Desc | OG | OG img | Canon | JSON-LD | Bread | notFound |
|--------|-------|------|-----|--------|-------|---------|-------|----------|
| Vehicle | ✅ | ✅ | ✅ | ✅ own | ✅ | ⚠️ ověřit | ✅ | ✅ |
| Part | ✅ | ✅ | ❌ | 🔶 | ✅ | ✅ Product | ❌ | ✅ |
| AutoServis | ✅ | ✅ | ❌ | 🔶 | ✅ | ⚠️ inline | ❌ | ✅ |
| STK | ✅ | ✅ | ❌ | 🔶 | ✅ | ⚠️ inline | ❌ | ✅ |
| Profil | ✅ | ✅ | ✅ | ✅ own | ✅ | ✅ Person | ❌ | ✅ |
| Blog | ✅ | ✅ | ✅ | ✅ own | ✅ | ⚠️ inline | ❌ | ✅ |
| Shop | ✅ | ✅ | ❌ | 🔶 | ⚠️ bug | ✅ Product | ❌ | ✅ |
| Bazar | ✅ | ✅ | ❌ | 🔶 | ✅ | ✅ Local | ❌ | ✅ |
| Vrakoviště | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 4 typy | ✅ | ✅ |

### M3. Akce pro dynamické stránky

| # | Akce | Entity | Fáze |
|---|------|--------|------|
| 1 | Přidat OG metadata do generateMetadata | Part, AutoServis, STK, Shop, Bazar | 2 |
| 2 | Přidat BreadcrumbList JSON-LD | Part, AutoServis, STK, Profil, Blog, Shop, Bazar | 2 |
| 3 | Migrovat inline JSON-LD → helper | AutoServis, STK, Blog | 2 |
| 4 | Fix hardcoded canonical na Shop produkt | Shop | 1 |
| 5 | Ověřit Vehicle JSON-LD se skutečně renderuje | Vehicle | 1 |

---

## ČÁST N: INTERNÍ LINKING — KOMPLETNÍ STRATEGIE

### N1. Aktuální stav cross-linků

| Odkud | Kam | Implementace | Status |
|-------|-----|-------------|--------|
| Vehicle → Parts | RecommendedParts component | `seo-crosslinks.ts` | ✅ OK |
| Vehicle → Services | "Doplňkové služby" sekce | Hardcoded links | ✅ OK |
| Vehicle → Similar | SimilarVehicles component | Multi-tier matching | ✅ OK |
| Vehicle → Broker | BrokerBox component | Direct link | ✅ OK |
| Parts → Vehicles | seo-crosslinks.ts bridge | Automatic by brand/model | ✅ OK |
| Homepage → Vehicles | Featured vehicles | DB query | ✅ OK |
| Homepage → Brokers | Featured brokers | DB query | ✅ OK |
| Homepage → Services | Service cards | Hardcoded | ✅ OK |
| Navbar → Services | Dropdown menu | Hardcoded | ✅ OK |
| Navbar → About | Dropdown menu | Hardcoded | ✅ OK |
| Footer → Services | Column links | Hardcoded | ✅ OK |
| Footer → Info | Column links | Hardcoded | ✅ OK |
| Blog → Related | Related articles component | Tag-based | ✅ OK |
| Vrakoviště → Parts | ItemList links | DB query | ✅ OK |

### N2. KRITICKÉ MEZERY v interním prolinkování

#### GAP 1: Blog je IZOLOVANÝ od komerce ❌ (HIGH)
**Problém:** Blog články neodkazují na vozidla, služby ani díly.
**Fix:** Přidat `RelatedServicesBlock` komponentu do blog článků:
```
// Na konci každého článku:
// - "Hledáte auto? Prohlédněte si naši nabídku" → /nabidka
// - "Potřebujete prověrku?" → /sluzby/proverka
// - Kontextové CTA dle kategorie článku
```
**Soubory:** `app/(web)/blog/[slug]/page.tsx`, nová komponenta `components/web/blog/BlogCrossLinks.tsx`

#### GAP 2: Autoservisy NEMAJÍ žádné incoming linky ❌ (HIGH)
**Problém:** `/autoservisy` není v navbar, footer, ani na homepage.
**Fix:**
1. Přidat do MainFooter → sloupec "Služby": `/autoservisy` a `/stk`
2. Přidat do navbar dropdown "Služby": Autoservisy, STK
3. Přidat na vehicle detail: "Servisy v okolí {city}"
4. Přidat na homepage: sekce "Najděte servis"

**Soubory:** `components/main/Footer.tsx`, `components/main/Navbar.tsx`, `app/(web)/page.tsx`

#### GAP 3: STK je pod-propagované ❌ (MEDIUM)
**Problém:** STK stránky nemají dostatek incoming linků.
**Fix:**
1. Footer + Navbar (stejně jako autoservisy)
2. Vehicle detail: "Kdy je STK? Najděte nejbližší stanici" → /stk
3. Blog: Článek "Kdy na STK" s linkem

#### GAP 4: Služby stránky neodkazují zpět ❌ (MEDIUM)
**Problém:** `/sluzby/proverka`, `/financovani`, `/pojisteni` nemají kontextové linky.
**Fix:** Přidat na každou service stránku:
- "Prohlédněte si naši nabídku vozidel" → /nabidka
- "Přečtěte si na blogu" → relevantní blog článek
- "Najděte makléře ve vašem městě" → /makleri

#### GAP 5: Parts detail neodkazuje na kompatibilní vozidla ❌ (MEDIUM)
**Problém:** `/dily/[slug]` nemá link na vozidla kde se díl hodí.
**Fix:** Přidat `PartsToVehicleBridge` komponentu (pattern z `seo-crosslinks.ts`)

#### GAP 6: Broker profil nezvýrazňuje vozidla ⚠️ (LOW)
**Problém:** Profil makléře sice zobrazuje vozidla v tabech, ale chybí prominent CTA.
**Fix:** ProfileClient.tsx — přidat výrazný "Vozidla tohoto makléře" section

#### GAP 7: Blog author link je BROKEN ❌ (BUG)
**Problém:** Blog článek linkuje autora na `/makler/[slug]` místo `/profil/[slug]`
**Fix:** Opravit v `app/(web)/blog/[slug]/page.tsx`

### N3. Cílový stav — Interní linking mapa

```
Homepage ─┬─→ Nabídka (featured vehicles)
          ├─→ Služby (prověrka, financování, pojištění)
          ├─→ Makléři (featured brokers)
          ├─→ Blog (nejnovější články)
          ├─→ Autoservisy (NEW)
          ├─→ STK (NEW)
          └─→ Jak to funguje

Vehicle ──┬─→ Podobná vozidla
          ├─→ Doporučené díly (RecommendedParts)
          ├─→ Služby (prověrka, financování, pojištění)
          ├─→ Makléř profil
          ├─→ Servisy v okolí {city} (NEW)
          └─→ STK v okolí (NEW)

Part ─────┬─→ Kompatibilní vozidla (NEW, partsToVehicleBridge)
          ├─→ Podobné díly
          └─→ Servisy co montují (NEW, future)

Blog ─────┬─→ Související články
          ├─→ Relevantní služby (NEW)
          ├─→ Relevantní vozidla (NEW)
          └─→ Autor profil (FIX: /profil/ ne /makler/)

Servis ───┬─→ STK v okolí (NEW)
          ├─→ Pojištění kalkulačka (NEW)
          └─→ Blog články o údržbě (NEW)

STK ──────┬─→ Servisy v okolí (NEW)
          ├─→ Pojištění (NEW)
          └─→ Blog (NEW)

Služby ───┬─→ Nabídka vozidel (NEW)
          ├─→ Blog články (NEW)
          └─→ Makléři (NEW)

Footer ───┬─→ + Autoservisy (NEW)
          ├─→ + STK (NEW)
          └─→ (stávající linky zachovat)

Navbar ───┬─→ + Autoservisy v dropdown Služby (NEW)
          └─→ + STK v dropdown Služby (NEW)
```

### N4. Related Content komponenta

Vytvořit univerzální `RelatedContentBlock` komponentu:

```tsx
// components/web/RelatedContentBlock.tsx
// Props: type ("vehicle" | "part" | "service" | "blog" | "servis" | "stk")
// Dynamicky generuje related linky dle typu stránky
// Vždy 3-6 linků
// Responsive grid (1 col mobile, 3 col desktop)
```

### N5. Akční plán — Internal Linking

| # | Akce | Soubory | Fáze | Effort |
|---|------|---------|------|--------|
| 1 | Footer: přidat Autoservisy + STK | `components/main/Footer.tsx` | 2 | 15 min |
| 2 | Navbar: přidat Autoservisy + STK do dropdown | `components/main/Navbar.tsx` | 2 | 15 min |
| 3 | Blog: přidat BlogCrossLinks komponentu | NEW + blog/[slug]/page.tsx | 2 | 1h |
| 4 | Blog: fix author link /makler/ → /profil/ | blog/[slug]/page.tsx | 1 | 5 min |
| 5 | Vehicle: přidat "Servisy v okolí" | nabidka/[slug]/page.tsx | 3 | 1h |
| 6 | Service pages: přidat kontextové linky | 3× sluzby/*/page.tsx | 3 | 1h |
| 7 | Parts: přidat PartsToVehicleBridge | dily/[slug]/page.tsx | 3 | 30 min |
| 8 | Homepage: přidat sekci Autoservisy/STK | page.tsx | 3 | 1h |

---

## ČÁST O: SEO/GEO/AIEO TRENDY 2025-2026 (Z VÝZKUMU)

### O1. Klíčové změny v SEO 2025-2026

1. **JSON-LD = AI viditelnost** — Stránky s validním structured data mají **2.3× vyšší šanci** objevit se v Google AI Overviews. JSON-LD už není jen o rich snippets, ale o AI citacích.

2. **Google zrušil Vehicle Listing structured data** (červen 2025) — Ale obecný `Vehicle`/`Car` + `Product` + `Offer` schema z schema.org funguje dál. Markup nezpůsobuje chyby.

3. **60%+ vyhledávání přes AI** — K Q1 2026 generativní AI tvoří přes 60% information retrieval. ~25% search queries migruje z konvenčních vyhledávačů na AI chatboty.

4. **44% kupujících aut používá AI** — AI nástroje při výzkumu vozidel. Carmakler MUSÍ být viditelný pro AI systémy.

5. **Bing index je kritický** — ChatGPT, Copilot i Perplexity používají Bing index. Registrace na Bing Webmaster Tools je nutnost.

### O2. GEO (Generative Engine Optimization) — Klíčové principy

1. **"Answer-first" content** — AI motory extrahují pasáže, ne celé stránky. Každá stránka MUSÍ mít na začátku **přímou odpověď v 40-60 slovech** před jakýmkoli preambulem.

2. **Fact density** — Stránky se statistikami, citacemi, originálními daty mají **30-40% vyšší AI viditelnost** (Princeton GEO studie). Pro Carmakler: cenové rozpětí, průměrné nájezdy, amortizační křivky.

3. **Atomický obsah** — Strukturovat jako modulární bloky: seznamy, tabulky, FAQ, srovnávací tabulky, definice. AI extrahuje paragrafy, ne celé stránky.

4. **Third-party mentions > vlastní obsah** — AI motory silně preferují earned media. Být zmíněn na:
   - Reddit (automotive fóra)
   - Recenzní platformy
   - Lokální média

5. **Entity konzistence** — Konzistentní reprezentace entity (business name, brand, adresy) na všech platformách.

### O3. AI Crawler konfigurace (aktualizace robots.txt)

| Bot | Účel | Doporučení |
|-----|------|------------|
| `GPTBot` | OpenAI training | ✅ Allow (AI viditelnost) |
| `OAI-SearchBot` | ChatGPT search | ✅ Allow (NOVÝ — přidat!) |
| `ChatGPT-User` | User-initiated | ✅ Allow |
| `ClaudeBot` | Anthropic training | ✅ Allow |
| `Claude-User` | User-initiated | ✅ Allow (NOVÝ — přidat!) |
| `Claude-SearchBot` | Claude search | ✅ Allow (NOVÝ — přidat!) |
| `PerplexityBot` | Perplexity | ✅ Allow |
| `Applebot-Extended` | Apple Intelligence | ✅ Allow |
| `GoogleOther` | Gemini | ✅ Allow |
| `Bytespider` | ByteDance | ❌ Block (ignoruje robots.txt) |
| `CCBot` | Common Crawl | ⚠️ Optional |

**Akce:** Přidat `OAI-SearchBot`, `Claude-User`, `Claude-SearchBot` do robots.ts

### O4. Schema.org pro automotive (aktualizace)

Pro `/nabidka/[slug]` použít plný `Car` schema (subtype Vehicle):
```json
{
  "@type": "Car",
  "vehicleIdentificationNumber": "VIN",
  "mileageFromOdometer": {"@type": "QuantitativeValue", "value": 85000, "unitCode": "KMT"},
  "bodyType": "SUV",
  "fuelType": "Diesel",
  "vehicleTransmission": "Manual",
  "driveWheelConfiguration": "FWD",
  "numberOfDoors": 5,
  "vehicleEngine": {"@type": "EngineSpecification", "engineDisplacement": "2.0", "fuelType": "Diesel"},
  "dateVehicleFirstRegistered": "2019-03",
  "numberOfPreviousOwners": 2,
  "knownVehicleDamages": "None",
  "vehicleInteriorColor": "Black",
  "color": "White",
  "offers": {"@type": "Offer", "price": 450000, "priceCurrency": "CZK", "availability": "InStock", "itemCondition": "UsedCondition"}
}
```

### O5. llms.txt (aktualizovaná specifikace)

**Stav 2026:** 844 000+ webů implementovalo llms.txt. Major adopters: Anthropic, Cloudflare, Stripe.

**Pravidla:**
- 1× H1 s brand name
- Blockquote summary (1-2 věty)
- 4-7 H2 sekcí s 20-50 celkových linků
- Formát linků: `- [Title](URL): One-sentence description.`
- Aktualizovat minimálně kvartálně
- Zvážit `llms-full.txt` pro detailní dokumentaci

### O6. Core Web Vitals 2025-2026

| Metrika | Threshold | Carmakler status |
|---------|-----------|-----------------|
| LCP | < 2.5s | ✅ Server Components + streaming |
| INP | < 200ms (nahradilo FID) | ⚠️ Ověřit |
| CLS | < 0.1 | ⚠️ Ověřit |

**INP optimalizace pro Next.js:**
1. Server Components default (Carmakler už dělá ✅)
2. `next/dynamic` pro heavy komponenty (galerie, mapy, AI chat)
3. `<Suspense>` boundaries pro data-heavy sekce
4. `next/image` s `priority` pro above-the-fold
5. `next/font/google` s Outfit font, `display: swap` ✅

### O7. Nové akce z výzkumu

| # | Akce | Priorita | Fáze | Effort |
|---|------|----------|------|--------|
| 1 | Registrace Bing Webmaster Tools | HIGH | 1 | 30 min (manuální) |
| 2 | Přidat OAI-SearchBot, Claude-User, Claude-SearchBot do robots.ts | HIGH | 1 | 15 min |
| 3 | Přidat "answer-first" paragraf na top 10 stránek | HIGH | 2 | 2h |
| 4 | Rozšířit Vehicle JSON-LD na plný `Car` schema | HIGH | 1 | 1h |
| 5 | Přidat fact density (statistiky, čísla) na landing pages | MEDIUM | 3 | 3h |
| 6 | Vytvořit srovnávací content ("Nejlepší SUV 2026", "EV vs diesel") | MEDIUM | 4 | 10h |
| 7 | Implementovat `llms-full.txt` pro služby sekce | LOW | 3 | 1h |
| 8 | Audit INP přes PageSpeed Insights | MEDIUM | 3 | 1h |

---

## STOP PRAVIDLA

- **STOP-1:** NESMÍ se měnit existující sitemap.ts logika — jen přidávat nové statické URL.
- **STOP-2:** NESMÍ se přidávat canonical na stránky které mají být noindex.
- **STOP-3:** NESMÍ se kopírovat competitive data ze Sauto/TipCars (memory: žádný scraping).
- **STOP-4:** JSON-LD musí být validní — testovat přes Google Rich Results Test.
- **STOP-5:** `llms.txt` nesmí obsahovat citlivé URL (/api, /admin, /makler).
- **STOP-6:** FAQ schema musí mít reálné otázky — ne generovaný spam (Google penalizuje).
- **STOP-7:** Google Business Profile setup je MANUÁLNÍ — nelze automatizovat.
- **STOP-8:** NEMĚNIT existující JSON-LD na stránkách kde funguje — jen přidávat chybějící.
- **STOP-9:** Brand/model/city/bodytype/price stránky mohou sdílet dynamický routing — ověřit strukturu PŘED implementací.
- **STOP-10:** Private stránky (admin, pwa, pwa-parts, partner) NEPOTŘEBUJÍ SEO — neplýtvat časem.
- **STOP-11:** Při přidávání noindex vždy zachovat `follow: true` — aby Google sledoval interní linky.
- **STOP-12:** Max 1 commit per fázi — ne 50 commitů na 50 souborů.
- **STOP-13:** not-found.tsx MUSÍ mít helpful content (alternativy, search, CTA) — ne jen "Nenalezeno".
- **STOP-14:** Cross-linky NESMÍ být spam — max 3-6 relevantních linků per sekce, kontextově vázané.
- **STOP-15:** Blog author link MUSÍ být `/profil/[slug]`, NIKDY `/makler/[slug]` (broken route).
- **STOP-16:** `Car` schema MUSÍ mít validní `mileageFromOdometer` s `QuantitativeValue` + `unitCode: "KMT"`.
- **STOP-17:** Bing Webmaster Tools registrace je MANUÁLNÍ krok — nelze automatizovat.

---

## ACCEPTANCE CRITERIA

### Fáze 1:
- [ ] `/nabidka/[slug]` má Vehicle JSON-LD s cenou, nájezdem, značkou, modelem
- [ ] `/dily/[slug]` má Product JSON-LD s cenou, stavem, SKU
- [ ] Homepage má WebSite JSON-LD se SearchAction
- [ ] `/blog/[slug]` má Article JSON-LD
- [ ] 23 private stránek má noindex
- [ ] 5+ stránek má FAQ schema
- [ ] `/public/llms.txt` existuje a je validní
- [ ] `npm run build` projde
- [ ] Google Rich Results Test validuje JSON-LD na 5 testovacích stránkách

### Fáze 2:
- [ ] Všech 36 landing pages (brand+model+city+bodytype+price) má generateMetadata
- [ ] 14+ stránek má BreadcrumbList JSON-LD
- [ ] Brand pages mají BrandItemList + AggregateOffer
- [ ] 13 inline JSON-LD migrováno na helpery
- [ ] Autoservisy/STK detail mají LocalBusiness + canonical

### Fáze 3:
- [ ] 15 stránek má error.tsx
- [ ] 5 stránek má loading.tsx
- [ ] Footer obsahuje linky na autoservisy + STK
- [ ] `/cenik` je v sitemap
- [ ] OG image existuje pro `/reklamacni-rad`

### Redirecty & 404:
- [ ] 7 nových not-found.tsx s helpful content (alternativy + CTA)
- [ ] Root not-found.tsx vylepšen o search + doporučení
- [ ] Soft 404 na overeni-emailu opravena
- [ ] Všechny not-found.tsx mají breadcrumb zpět na parent

### Internal Linking:
- [ ] Footer obsahuje Autoservisy + STK
- [ ] Navbar dropdown Služby obsahuje Autoservisy + STK
- [ ] Blog články mají BlogCrossLinks komponentu (→ služby, vozidla)
- [ ] Blog author link opraven na `/profil/[slug]`
- [ ] Vehicle detail má "Servisy v okolí" sekci
- [ ] Service pages mají kontextové linky (→ nabídka, blog, makléři)

### Dynamické stránky:
- [ ] Všechny dynamic detail pages mají OG metadata v generateMetadata
- [ ] Všechny dynamic detail pages mají BreadcrumbList JSON-LD
- [ ] Shop produkt canonical opraven (hardcoded → pageCanonical)
- [ ] AutoServis/STK inline JSON-LD migrován na helper

### AI/GEO optimalizace:
- [ ] robots.ts obsahuje OAI-SearchBot, Claude-User, Claude-SearchBot
- [ ] Vehicle JSON-LD rozšířen na plný `Car` schema
- [ ] Top 10 stránek má "answer-first" paragraf (40-60 slov)
- [ ] Bing Webmaster Tools registrován (manuální)

### Celkové cíle:
- [ ] 100% veřejných stránek má generateMetadata
- [ ] 100% veřejných stránek má JSON-LD (minimálně WebPage)
- [ ] 100% hierarchických stránek má BreadcrumbList
- [ ] 100% private stránek má noindex
- [ ] 100% dynamických detail stránek má OG metadata
- [ ] 100% dynamických stránek má not-found.tsx s helpful content
- [ ] 0 nepoužitých JSON-LD generátorů (kromě WebApplication)
- [ ] 0 inline JSON-LD — vše přes helpery
- [ ] 0 broken interních linků
- [ ] Footer + Navbar pokrývají VŠECHNY hlavní sekce
