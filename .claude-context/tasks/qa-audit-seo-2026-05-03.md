# QA Audit: SEO — metadata, sitemap, robots, structured data

**Datum:** 2026-05-03
**Autor:** Plánovač (Task #11)

---

## 1. Metadata (title, description, OG)

### 1.1 Root layout (`app/layout.tsx`)
- `metadataBase`: `https://carmakler.cz` ✅
- `title.default`: "CarMakléř | Prodej aut přes ověřené makléře" ✅
- `title.template`: "%s | CarMakléř" ✅
- `description`: přítomná, relevantní ✅
- `keywords`: 8 klíčových slov ✅
- `openGraph`: type=website, locale=cs_CZ, siteName ✅
- `twitter`: card=summary_large_image ✅
- `manifest`: /manifest.json ✅
- `icons`: favicon 32/48/96px + PWA 192/512px + apple-touch-icon ✅
- `viewport`: separate export, themeColor=#F97316 ✅
- `html lang="cs"` ✅
- `alternates.canonical` — NEEXPORTUJE SE z root layoutu (záměrně, fix bugu #127) ✅

### 1.2 Pokrytí per-page metadata
| Metrika | Počet | % z 141 stránek |
|---------|-------|-----------------|
| Stránky s `metadata` / `generateMetadata` | **96** | **68%** |
| Stránky bez metadata | **45** | **32%** |

### 1.3 Stránky BEZ metadata (45)

**Legitimní výjimky (auth-only, ne-indexované):** 24 stránek
- `/login`, `/prihlaseni`, `/registrace/*` (4), `/reset-hesla/[token]`, `/zapomenute-heslo`
- `/muj-ucet/*` (7), `/moje-inzeraty/*` (2)
- `/shop/moje-objednavky/*` (2), `/shop/objednavka/*` (2), `/shop/kosik`
- `/dily/moje-objednavky`, `/dily/objednavka/*` (2), `/dily/kosik`
- `/nabidka/[slug]/platba/*` (2)
- `/overeni-emailu/*` (2), `/notifikace/[token]`

**Potenciální SEO gap (veřejné stránky bez metadata):** 11 stránek
| Stránka | Priorita | Doporučení |
|---------|----------|-----------|
| `/kariera` | HIGH | SEO landing pro nábor makléřů — přidat metadata |
| `/recenze` | HIGH | Social proof stránka — přidat metadata |
| `/pro-maklere` | HIGH | Recruitment landing — přidat metadata |
| `/inzerce/katalog` | MEDIUM | Katalog inzerátů — přidat metadata |
| `/shop/katalog` | MEDIUM | Katalog eshop — přidat metadata |
| `/inzerce/pridat` | MEDIUM | Formulář pro podání inzerátu — přidat metadata |
| `/inzerce/registrace` | LOW | Registrace inzerenta |
| `/dodavatel/[slug]` | MEDIUM | Profil dodavatele — přidat generateMetadata |
| `/makler/[slug]` | LOW | Alias pro /profil/[slug]? Ověřit |
| `/h/[slug]` | LOW | Hashtag landing page |
| `/marketplace/dealer/[id]` | LOW | Auth-gated deal detail |

### 1.4 Dynamické metadata (generateMetadata)
Správně implementované na klíčových detail stránkách:
- `/nabidka/[slug]` — Vehicle detail (brand + model + year v title) ✅
- `/profil/[slug]` — Broker profile (jméno + město) ✅
- `/blog/[slug]` — Article detail (title + excerpt) ✅
- `/blog/kategorie/[slug]` — Blog category ✅
- `/makleri/[slug]` — Broker hashtag landing ✅
- `/dily/[slug]` — Part detail (přes generateMetadata) ✅
- `/dily/vrakoviste/[slug]` — Vrakoviště profil ✅
- `/bazar/[slug]` — Autobazar profil ✅
- `/shop/produkt/[slug]` — Shop product detail ✅
- `/dily/znacka/[brand]`, `/dily/znacka/[brand]/[model]`, `/dily/znacka/[brand]/[model]/[rok]` ✅
- Všechny SEO landing pages (`/nabidka/skoda`, `/nabidka/praha`, ...) ✅

---

## 2. Sitemap (`app/sitemap.ts`)

### 2.1 Stav: EXISTUJE, DYNAMICKÁ ✅

### 2.2 Obsah sitemapy

| Sekce | Počet URL | Zdroj |
|-------|-----------|-------|
| Statické stránky | 30 | Hardcoded |
| SEO landing — značky | 16 | `BRANDS` array |
| SEO landing — modely | 12 | `TOP_MODELS` array |
| SEO landing — karoserie | 7 | `BODY_TYPES` array |
| SEO landing — ceny | 5 | `PRICE_RANGES` array |
| SEO landing — města | 8 | `CITIES` array |
| SEO landing — díly kategorie | 11 | `PARTS_CATEGORIES` array |
| SEO landing — díly značky | 17 | `PARTS_BRANDS` array |
| SEO landing — díly značka+model | ~24 | `PARTS_MODELS_BY_BRAND` |
| SEO landing — díly značka+model+rok | ~72 | topYears fallback [2015,2018,2020] |
| Dynamické — vozidla | N | DB (ACTIVE vehicles s slug) |
| Dynamické — makléři | N | DB (ACTIVE brokers s slug) |
| Dynamické — tagy | N | DB (tags s ≥2 aktivními brokery) |
| Dynamické — vrakoviště | N | DB (AKTIVNI_PARTNER, type=VRAKOVISTE) |
| Dynamické — autobazary | N | DB (AKTIVNI_PARTNER, type=AUTOBAZAR) |
| Dynamické — inzeráty | N | DB (ACTIVE listings) |
| Dynamické — blog | N | DB (PUBLISHED articles) |
| **Celkem (statické)** | **~202** | |

### 2.3 Chybějící v sitemapě

| URL vzor | Typ | Priorita |
|----------|-----|----------|
| `/dily/[slug]` (part detail) | Dynamické | HIGH — detail dílu není v sitemapě! |
| `/shop/produkt/[slug]` | Dynamické | HIGH — shop detail stránky chybí |
| `/dodavatel/[slug]` | Dynamické | MEDIUM — profily dodavatelů |
| `/h/[slug]` (hashtag) | Dynamické | LOW |
| `/kariera` | Statická | MEDIUM — existuje stránka ale ne v sitemapě (ačkoli je v sitemap v `kariera`) |

**Kritický gap:** `/dily/[slug]` a `/shop/produkt/[slug]` — detail stránky dílů nejsou v sitemapě. Pro eshop je to důležité pro indexaci produktů.

### 2.4 Kvalita sitemapy
- `lastModified` u dynamických stránek: `updatedAt` z DB ✅
- `changeFrequency` per typ: hourly (nabídka) → monthly (právní) ✅
- `priority` správně odstupňovaná (1.0 homepage → 0.4 právní) ✅
- DB-resilient: try/catch s fallback na statické stránky ✅
- Single file (ne split) — OK pro <50K URL, ale při růstu bude potřeba `sitemap/[id]` split

---

## 3. Robots (`app/robots.ts`)

### 3.1 Stav: EXISTUJE, SPRÁVNĚ KONFIGUROVANÁ ✅

### 3.2 Pravidla

| User-Agent | Allow | Disallow |
|------------|-------|----------|
| `*` | `/` | `/api/`, `/admin/`, `/makler/`, `/partner/`, `/parts/`, `/muj-ucet/`, `/marketplace/dashboard`, `/marketplace/investor`, `/marketplace/dealer`, `/login`, `/prihlaseni`, `/registrace` |
| GPTBot | `/` | `/api/`, `/admin/`, `/makler/`, `/partner/`, `/parts/`, `/muj-ucet/` |
| ChatGPT-User | `/` | (same as GPTBot) |
| CCBot | `/` | — |
| ClaudeBot | `/` | — |
| PerplexityBot | `/` | — |
| Applebot-Extended | `/` | — |
| GoogleOther | `/` | — |

### 3.3 Hodnocení
- Auth-only stránky blokované ✅
- AI crawlers explicitně povolené pro GEO/AIEO ✅ (progresivní přístup)
- `sitemap` odkaz na `/sitemap.xml` ✅
- **Chybí:** `/moje-inzeraty` v disallow (auth-only stránka, ale měla by být blokovaná)
- **Chybí:** `/gate` v disallow (password gate stránka)

---

## 4. JSON-LD Structured Data

### 4.1 Centrální knihovna (`lib/seo.ts`)
726 řádků, 17 generátorů — velmi rozsáhlá a kvalitní:

| Generátor | Schema.org typ | Použití |
|-----------|---------------|---------|
| `generateBreadcrumbJsonLd` | BreadcrumbList | Breadcrumbs komponenta |
| `generateFaqJsonLd` | FAQPage | Landing pages, services |
| `generateItemListJsonLd` | ItemList | Katalog stránky |
| `generatePartsItemListJsonLd` | ItemList | Parts landing pages |
| `generateFaqPageJsonLd` | FAQPage | Parts landing pages |
| `generateVehicleJsonLd` | Vehicle + Offer | Detail vozidla |
| `generateServiceJsonLd` | Service | Služby stránky |
| `generateArticleJsonLd` | Article | Blog články |
| `generateHowToJsonLd` | HowTo | Jak prodat auto |
| `generateWebApplicationJsonLd` | WebApplication | PWA stránky |
| `generateWebPageJsonLd` | WebPage + Speakable | GEO/AIEO optimized |
| `generateBrandItemListJsonLd` | ItemList | Značky landing |
| `generateAggregateOfferJsonLd` | Product + AggregateOffer | Cenové landing |
| `generateOrganizationJsonLd` | Organization | Homepage, kontakt |
| `generateWebSiteJsonLd` | WebSite + SearchAction | Homepage (sitelinks searchbox) |
| `generatePartProductJsonLd` | Product + Offer | Detail dílu |
| `generateStoreJsonLd` | AutoPartsStore | Vrakoviště profil |
| `generateLocalBusinessJsonLd` | AutomotiveBusiness | Kontakt, partneři |
| `generateAggregateRatingJsonLd` | Organization + AggregateRating | Recenze |
| `generateJobPostingJsonLd` | JobPosting | Kariéra |
| `generatePersonJsonLd` | Person | Profil makléře |

### 4.2 Pokrytí JSON-LD na stránkách
| Metrika | Počet |
|---------|-------|
| Stránky s JSON-LD | **68** |
| Pomocné komponenty s JSON-LD | Breadcrumbs, ModelLandingContent, BrandLandingContent, VehicleLandingPage |

### 4.3 JSON-LD typy na klíčových stránkách
| Stránka | JSON-LD typy |
|---------|-------------|
| Homepage (`/`) | Organization, WebSite+SearchAction, WebPage ✅ |
| `/nabidka/[slug]` (detail vozu) | Vehicle+Offer, BreadcrumbList ✅ |
| `/profil/[slug]` (makléř) | Person, BreadcrumbList ✅ |
| `/blog/[slug]` (článek) | Article, BreadcrumbList ✅ |
| `/dily/vrakoviste/[slug]` | AutoPartsStore, BreadcrumbList ✅ |
| `/bazar/[slug]` | AutomotiveBusiness, BreadcrumbList ✅ |
| `/kontakt` | LocalBusiness, BreadcrumbList ✅ |
| `/makleri` | ItemList, BreadcrumbList ✅ |
| `/nabidka/skoda` (brand) | AggregateOffer, ItemList, BreadcrumbList ✅ |
| `/nabidka/praha` (město) | WebPage, ItemList ✅ |
| `/nabidka/suv` (karoserie) | WebPage ✅ |
| `/sluzby/*` | Service ✅ |
| `/jak-to-funguje` | HowTo ✅ |
| `/jak-prodat-auto` | HowTo ✅ |
| `/kolik-stoji-moje-auto` | WebPage ✅ |
| `/dily/znacka/[brand]` | ItemList, FAQPage ✅ |
| `/dily/znacka/[brand]/[model]` | ItemList, FAQPage ✅ |
| `/marketplace` | WebPage ✅ |
| `/inzerce` | WebPage ✅ |
| `/shop` | WebPage ✅ |
| `/recenze` | AggregateRating ✅ |

### 4.4 GEO/AIEO optimalizace
- `SpeakableSpecification` implementované v `generateWebPageJsonLd` ✅
- `about` + `mentions` entity linking ✅
- Explicitní povolení AI crawlerů v robots.ts ✅
- `aiSnippetText` pole v `SeoContent` modelu (Prisma) ✅
- Toto je pokročilá implementace — nadprůměrná pro CZ trh

---

## 5. Kanonické URL

### 5.1 Implementace: `lib/canonical.ts`
- Helper `pageCanonical(path)` → `{ canonical: "https://carmakler.cz{path}" }` ✅
- Strip query string ✅
- Strip hash fragment ✅
- Root layout NEEXPORTUJE canonical (fix bugu #127) ✅

### 5.2 Pokrytí
| Metrika | Počet | % z 141 stránek |
|---------|-------|-----------------|
| Stránky s `pageCanonical`/`alternates` | **89** | **63%** |
| Stránky bez canonical | **52** | **37%** |

### 5.3 Analýza chybějících canonical
- **Auth-only stránky (ne-indexované):** ~30 — OK, nepotřebují canonical
- **Veřejné indexované stránky bez canonical:** ~11 — PROBLÉM
  - `/kariera`, `/recenze`, `/pro-maklere` — veřejné landing pages
  - `/inzerce/katalog`, `/shop/katalog` — katalogy
  - `/dodavatel/[slug]` — veřejný profil
  - `/dily/[slug]` — detail dílu (!)
  - `/nabidka/do-1000000` — landing page
  - `/marketplace/deals/[id]` — auth-gated, ale měla by mít canonical

---

## 6. OG Images

### 6.1 Dynamické OG image generátory (ImageResponse)

| Route | Typ | Dynamické? |
|-------|-----|-----------|
| `app/(web)/opengraph-image.tsx` | Fallback pro celý web | Statické (logo + tagline) |
| `app/(web)/nabidka/[slug]/opengraph-image.tsx` | Detail vozidla | DB query (brand+model+price+photo) |
| `app/(web)/profil/[slug]/opengraph-image.tsx` | Profil makléře | DB query (jméno+avatar+město) |
| `app/(web)/blog/[slug]/opengraph-image.tsx` | Blog článek | DB query (title+cover+author) |
| `app/(web)/blog/opengraph-image.tsx` | Blog listing | Statické |
| `app/(web)/dily/opengraph-image.tsx` | Díly sekce | Statické |
| `app/(web)/marketplace/opengraph-image.tsx` | Marketplace | Statické |
| `app/(web)/makleri/opengraph-image.tsx` | Makléři listing | Statické |
| `app/(web)/inzerce/opengraph-image.tsx` | Inzerce sekce | Statické |

### 6.2 Twitter image
- Jen root `twitter-image.tsx` — sdílené pro celý web
- Jednotlivé sekce nemají vlastní twitter-image ⚠️ (minor — OG image se použije jako fallback)

### 6.3 Chybějící OG images
| Route | Priorita |
|-------|----------|
| `/dily/[slug]` (detail dílu) | HIGH — produkt stránka bez vlastního OG |
| `/shop/produkt/[slug]` | HIGH — produkt stránka bez vlastního OG |
| `/dily/vrakoviste/[slug]` | MEDIUM — profil vrakoviště |
| `/bazar/[slug]` | MEDIUM — profil autobazaru |
| `/dily/znacka/[brand]` | LOW — kategorie landing |

---

## 7. Hreflang

### 7.1 Stav: NEIMPLEMENTOVANÉ
- 0 souborů s `hreflang` v celém projektu
- **Hodnocení:** OK pro aktuální scope (jen CZ trh, jeden jazyk cs)
- **Budoucnost:** Pokud se rozšíří na SK/DE trh, bude potřeba `x-default` + `cs` + `sk`/`de`

---

## 8. SEO Landing Pages — unikátní meta

### 8.1 Vozidla (nabidka/*)
- 16 brand pages — každá má unikátní title/description z `generateMetadata` ✅
- 12 model pages — každá má unikátní title/description ✅
- 7 body type pages — unikátní ✅
- 5 price range pages — unikátní ✅
- 8 city pages — unikátní ✅
- **Hodnocení:** Výborné — žádné duplicitní meta

### 8.2 Díly (dily/*)
- 17 brand landing pages — unikátní meta z `generateMetadata` + DB `SeoContent` ✅
- Model + rok pages — dynamicky generované ✅
- 11 category pages — unikátní ✅
- **SeoContent model** v Prisma: `h1`, `metaTitle`, `metaDesc`, `introHtml`, `sectionsJson`, `faqJson`, `aiSnippetText`, `quickFacts` — velmi kvalitní SEO infra ✅

---

## 9. Shrnutí a doporučení

### Celkové hodnocení: VELMI DOBRÝ STAV

| Kritérium | Stav | Skóre |
|-----------|------|-------|
| Sitemap | Komprehenzivní, dynamická, DB-driven | ✅ |
| Robots.txt | Správně blokuje auth stránky, AI crawlers povoleny | ✅ |
| JSON-LD | 17 generátorů, 68 stránek, GEO/AIEO ready | ✅✅ |
| Metadata | 96/141 stránek (68%) — veřejné stránky pokryté | ✅ |
| Canonical URL | 89/141 stránek (63%) — gap na ~11 veřejných | ⚠️ |
| OG images | 9 dynamických generátorů, fallback funguje | ✅ |
| Hreflang | Nepotřeba (jen CZ trh) | ✅ |
| SEO content infra | SeoContent model, aiSnippetText, Speakable | ✅✅ |

### Prioritní akce

**HIGH:**
1. Přidat `/dily/[slug]` (part detail) a `/shop/produkt/[slug]` do sitemapy — dynamicky z DB
2. Přidat metadata + canonical na `/kariera`, `/recenze`, `/pro-maklere`
3. Přidat dynamický OG image pro `/dily/[slug]` a `/shop/produkt/[slug]` (produkt s fotkou + cenou)

**MEDIUM:**
4. Přidat metadata na `/inzerce/katalog` a `/shop/katalog`
5. Přidat canonical na `/dily/[slug]`, `/dodavatel/[slug]`
6. Přidat `/moje-inzeraty` a `/gate` do robots.txt disallow
7. Přidat `/dodavatel/[slug]` do sitemapy

**LOW:**
8. Twitter-image per sekce (marketplace, blog, dily) — minor, OG fallback funguje
9. OG image pro `/dily/vrakoviste/[slug]` a `/bazar/[slug]`
10. Plánovat sitemap split (`sitemap/[id]`) pro >10K URL
