# AUDIT: Kompletní SEO analýza Carmakler platformy

**Datum:** 2026-05-24
**Autor:** Plánovač
**Status:** DRAFT — čeká na schválení leada

---

## EXECUTIVE SUMMARY

Carmakler má **nadprůměrně propracovanou SEO infrastrukturu** pro český startup. Existuje centralizovaný systém pro canonical URLs, 20+ JSON-LD generátorů, 25 dynamických OG obrázků, obsáhlá sitemap se všemi dynamickými entitami a AI/GEO-ready robots.txt. Hlavní mezery jsou v **chybějících canonical na ~30 stránkách**, **nekonzistentním JSON-LD pokrytí** (33/80 stránek), **absenci hreflang** a **chybějícím sitemap indexu** pro velké datasety.

**Celkové skóre: 7.5/10** — solidní základ, potřeba dokončit pokrytí a optimalizovat technické detaily.

---

## 1. URL STRUKTURA

### 1.1 Přehled sekcí

| Sekce | URL pattern | Typ | SEO kvalita |
|-------|-----------|-----|-------------|
| **Vozidla** | `/nabidka`, `/nabidka/{slug}` | Katalog + detail | ✅ Výborné |
| **Značky** | `/nabidka/{brand}` | Programatické LP | ✅ Výborné |
| **Modely** | `/nabidka/{brand}/{model}` | Programatické LP | ✅ Výborné |
| **Karoserie** | `/nabidka/{bodytype}` | Programatické LP | ✅ Výborné |
| **Ceny** | `/nabidka/do-{price}` | Programatické LP | ✅ Výborné |
| **Města** | `/nabidka/{city}` | Programatické LP | ✅ Výborné |
| **Makléři** | `/makleri`, `/profil/{slug}` | Seznam + profil | ✅ Výborné |
| **Blog** | `/blog`, `/blog/{slug}` | Blog + článek | ✅ Výborné |
| **Díly** | `/dily`, `/dily/{slug}`, `/dily/znacka/{brand}[/{model}[/{rok}]]` | Katalog + detail + LP | ✅ Výborné |
| **Díly kategorie** | `/dily/kategorie/{slug}` | Programatické LP | ✅ Výborné |
| **Vrakoviště** | `/dily/vrakoviste/{slug}` | Partner LP | ✅ Výborné |
| **Shop** | `/shop`, `/shop/produkt/{slug}` | Eshop + detail | ✅ Dobré |
| **Inzerce** | `/inzerce`, `/inzerce/katalog` | Inzertní platforma | ✅ Dobré |
| **STK** | `/stk`, `/stk/{slug}`, `/stk/mesto/{city}` | Katalog + detail + geo | ✅ Výborné |
| **Autoservisy** | `/autoservisy`, `/autoservisy/{slug}` | Katalog + detail | ✅ Výborné |
| **Autobazary** | `/bazar/{slug}` | Partner LP | ✅ Dobré |
| **Marketplace** | `/marketplace`, `/marketplace/apply` | Landing + apply | ✅ Dobré |
| **Služby** | `/sluzby/*` | Info stránky | ✅ Výborné |
| **Info** | `/jak-prodat-auto`, `/kolik-stoji-moje-auto`, `/jak-to-funguje` | SEO content | ✅ Výborné |
| **Právní** | `/obchodni-podminky`, `/ochrana-osobnich-udaju`, `/zasady-cookies`, `/reklamacni-rad` | Legal | ✅ OK |
| **Kariéra** | `/kariera` | Jobs | ✅ Dobré |

### 1.2 Hodnocení URL struktury

**Pozitiva:**
- Čisté, česky lokalizované URL slugy (`/nabidka`, `/makleri`, `/dily`)
- Hierarchická struktura (`/dily/znacka/{brand}/{model}/{rok}`)
- Programatické landing pages pro long-tail keywords
- Diakritika alias handling v middleware.ts (301 redirect `škoda` → `skoda`)

**Problémy:**
- ⚠️ **Duplikace obsahu:** `/dily/{slug}` a `/shop/produkt/{slug}` zobrazují stejný díl — rozdíl jen v layoutu. Chybí `rel=canonical` pointing na jednu verzi.
- ⚠️ **Filter URLs:** `/nabidka?brand=skoda&fuelType=DIESEL` — filter parametry generují neomezený počet URL. Chybí `robots: { index: false }` nebo canonical na base URL.
- ⚠️ **Subdomain handling:** `inzerce.carmakler.cz` rewrituje na `/inzerce/*`, ale canonical URLs vždy ukazují na `carmakler.cz`. Subdomain SEO strategie není jasná.

---

## 2. METADATA (TITLE + DESCRIPTION)

### 2.1 Pokrytí

| Oblast | Stránek | S metadata | % |
|--------|---------|-----------|---|
| Veřejné stránky `(web)` | ~80 | ~80 | **100%** ✅ |
| PWA stránky | ~40 | ~5 | 12% (OK — noindex) |
| Admin stránky | ~30 | 0 | 0% (OK — noindex) |

**Výsledek:** Všech ~80 veřejných stránek má exportované `metadata` nebo `generateMetadata`. ✅

### 2.2 Kvalita metadata

**Vzorové příklady (dobré):**

| Stránka | Title | Description |
|---------|-------|-------------|
| Homepage | "Prodejte auto za nejlepší cenu, kupte bezpečně \| CarMakléř" | "Pomáháme lidem prodat auto za nejvyšší cenu a koupit bezpečně..." |
| Nabídka | "Nabídka vozidel" | "Prohlédněte si nabídku prověřených ojetých vozidel..." |
| Vehicle detail | "{Brand} {Model} ({Year}) — {Price} Kč" | Dynamic description s městem |
| Blog article | Custom seoTitle or article.title | Custom seoDescription or excerpt |
| STK | "STK stanice — najděte nejbližší stanici technické kontroly" | Relevantní popis |

**Problémy:**

| Problém | Dopad | Priorita |
|---------|-------|----------|
| ⚠️ Nabídka title "Nabídka vozidel" je příliš generické | Nízký CTR v SERP | P1 |
| ⚠️ Některé descriptions jsou > 160 znaků (brand landing pages) | Truncation v SERP | P2 |
| ⚠️ Title template `%s \| CarMakléř` — brand suffix zkracuje dostupný prostor | Ztracené info | P3 |
| ⚠️ Search page (`/hledat`) má `noindex` → ✅ SPRÁVNĚ | — | — |

---

## 3. CANONICAL URLs

### 3.1 Systém

**Helper:** `lib/canonical.ts` → `pageCanonical("/path")` vrací `{ canonical: "https://carmakler.cz/path" }`

Root layout **NEEXPORTUJE** `alternates.canonical` (fix pro bug #127 — child dědění homepage URL).

### 3.2 Pokrytí

Celkem nalezeno **102 výskytů `pageCanonical`** across **50+ souborů** ve veřejných stránkách.

**Stránky BEZ canonical (problém):**

| Stránka | URL | Riziko |
|---------|-----|--------|
| `/hledat` | Search results | OK (noindex) |
| `/registrace/*` | Registration | Nízké (non-SEO) |
| `/login` | Login | Nízké (noindex v robots) |
| `/zapomenute-heslo` | Password reset | Nízké (noindex) |
| `/overeni-emailu/*` | Email verification | Nízké (noindex) |
| `/moj-ucet/*` | User account | Nízké (noindex) |
| `/moje-inzeraty/*` | My listings | Nízké (noindex) |
| `/nabidka/{slug}/platba/uspech` | Payment success | Nízké (noindex) |
| `/blog/kategorie/{slug}` | Blog categories | **P1** — indexovatelné! |
| `/marketplace/deals/{id}` | Marketplace deals | OK (za auth gate) |
| `/marketplace/dealer/*` | Dealer dashboard | OK (za auth gate) |
| `/shop/produkt/{slug}` | Shop product detail | **P1** — duplikát `/dily/{slug}`! |
| `/stk/mesto/{city}` | STK by city | **P1** — GEO landing page! |
| `/nabidka/porovnani` | Vehicle comparison | **P2** — v sitemap, ale bez canonical |

**Kritické nálezy:**
1. **`/blog/kategorie/{slug}`** — indexovatelné bez canonical
2. **`/shop/produkt/{slug}`** — duplicitní obsah s `/dily/{slug}`, obě mají canonical na RŮZNÉ URL
3. **`/stk/mesto/{city}`** — GEO landing page v sitemap ale bez canonical

### 3.3 Nekonzistentní canonical pattern

`shop/produkt/[slug]/page.tsx` používá inline `alternates: { canonical: "https://carmakler.cz/dily/${slug}" }` místo `pageCanonical()`. Funguje, ale obchází centrální helper.

---

## 4. OG METADATA + OG OBRÁZKY

### 4.1 OG metadata pokrytí

| Oblast | OG title+description | OG image |
|--------|---------------------|----------|
| Homepage | ✅ | ✅ (dynamický) |
| Vehicle detail | ✅ | ✅ (fotka auta) |
| Blog article | ✅ | ✅ (cover image) |
| Broker profile | ✅ | ✅ (avatar) |
| Díl detail | Částečně | ✅ (dynamický) |
| Autoservis detail | ✅ | ✅ (dynamický) |
| STK detail | ✅ | ✅ (dynamický) |
| Bazar detail | ✅ | ✅ (dynamický) |
| Shop produkt | Částečně | Nějak (přes /dily/) |
| Landing pages (brand) | ✅ | ✅ Fallback na sekci |
| Právní stránky | Částečně | ✅ Fallback |

### 4.2 Dynamické OG obrázky

**25 OG image generátorů** ve formátu `opengraph-image.tsx`:

| Typ | Počet | Popis |
|-----|-------|-------|
| Sekce root | 15 | Fallback pro podsekce (/blog, /dily, /shop...) |
| Dynamic detail | 10 | Per-entita (vehicle, blog, broker, STK, autoservis, bazar, díl...) |

**Implementace:** `lib/og-image.tsx` — centralizovaný `OgLayout` s branding (logo, gradient, Outfit font). Vehicle detail OG používá fotku auta jako background. ✅ Výborné.

**Rozměry:** 1200x630 — standard pro Facebook/LinkedIn/Twitter. ✅

### 4.3 Problémy

| Problém | Dopad | Priorita |
|---------|-------|----------|
| ⚠️ Chybí OG image pro `/kariera` | Sdílení kariéra stránky | P3 |
| ⚠️ Chybí OG image pro `/nabidka` (list) | Sdílení katalogu | P2 |
| ⚠️ `/hledat` nemá OG | OK (noindex) | — |
| ⚠️ Programatické LP (`/nabidka/skoda`) dědí z parent OG | Generické OG | P2 |

---

## 5. SITEMAP

### 5.1 Implementace

**Soubor:** `app/sitemap.ts` — single dynamic sitemap

**Obsah:**

| Sekce | Zdroj | Počet (odhad) |
|-------|-------|---------------|
| Statické stránky | Hardcoded | 31 |
| Značky (nabídka) | `BRANDS` array | 16 |
| Modely (nabídka) | `TOP_MODELS` array | 12 |
| Karoserie | `BODY_TYPES` array | 7 |
| Cenové rozsahy | `PRICE_RANGES` array | 5 |
| Města | `CITIES` array | 8 |
| Díly kategorie | `PARTS_CATEGORIES` | 11 |
| Díly značky | `PARTS_BRANDS` | 8 |
| Díly model | `PARTS_MODELS_BY_BRAND` | ~24 |
| Díly model+rok | model × topYears | ~72 |
| Vozidla | DB query (ACTIVE) | Dynamic |
| Makléři | DB query (ACTIVE + slug) | Dynamic |
| Hashtag tagy | DB query (≥2 brokers) | Dynamic |
| Partner vrakoviště | DB query (AKTIVNI_PARTNER) | Dynamic |
| Partner autobazary | DB query (AKTIVNI_PARTNER) | Dynamic |
| Blog články | DB query (PUBLISHED) | Dynamic |
| Díly | DB query (ACTIVE + slug) | Dynamic |
| Inzeráty | DB query (ACTIVE) | Dynamic |
| Autoservisy + STK | DB query (isPublished) | Dynamic |

### 5.2 Problémy

| Problém | Dopad | Priorita |
|---------|-------|----------|
| ❌ **Single sitemap** — s rostoucí DB může překročit 50 000 URL limit / 50MB limit | Google ignoruje URL | **P0** |
| ❌ **Chybí sitemap index** — Google doporučuje max 50 000 URL per sitemap | Crawl budget | **P0** |
| ⚠️ **Chybějící URL v sitemap:** `/stk/mesto/{city}`, `/blog/kategorie/{slug}`, `/nabidka/porovnani` je tam ale stránka chybí | Nezaindexované | P1 |
| ⚠️ **`lastModified: new Date()`** na statických stránkách — vždy aktuální timestamp, nesprávné | Crawl priority confusion | P2 |
| ⚠️ **Chybí `images` sitemap extension** — Google image sitemap | Image search traffic | P2 |

### 5.3 Doporučení

Přejít na **sitemap index** s podřízenými sitemapami:
```
/sitemap.xml → sitemap index
  /sitemap-static.xml → statické stránky (31)
  /sitemap-vehicles.xml → vozidla (dynamic)
  /sitemap-listings.xml → inzeráty (dynamic)
  /sitemap-parts.xml → díly (dynamic)
  /sitemap-brokers.xml → makléři (dynamic)
  /sitemap-blog.xml → blog články
  /sitemap-services.xml → autoservisy + STK
  /sitemap-partners.xml → partneři (bazary + vrakoviště)
  /sitemap-landing.xml → programatické LP (brands, models, cities...)
```

---

## 6. SCHEMA.ORG / STRUCTURED DATA

### 6.1 Generátory (lib/seo.ts)

**20+ JSON-LD generátorů** — velmi propracované:

| Generátor | Schema.org type | Použití |
|-----------|----------------|---------|
| `generateBreadcrumbJsonLd` | BreadcrumbList | Většina stránek |
| `generateFaqJsonLd` / `generateFaqPageJsonLd` | FAQPage | Brand LP, STK, díly LP |
| `generateItemListJsonLd` | ItemList | Katalogové stránky |
| `generatePartsItemListJsonLd` | ItemList (named) | Díly landing pages |
| `generateVehicleJsonLd` | Vehicle + Offer | Vehicle detail |
| `generateServiceJsonLd` | Service | Služby stránky |
| `generateArticleJsonLd` | Article | Blog články |
| `generateHowToJsonLd` | HowTo | Jak prodat auto |
| `generateWebApplicationJsonLd` | WebApplication | Kalkulačky |
| `generateWebPageJsonLd` | WebPage (+ speakable, about, mentions) | GEO/AIEO stránky |
| `generateBrandItemListJsonLd` | ItemList (brand + models) | Brand LP |
| `generateAggregateOfferJsonLd` | Product + AggregateOffer | Brand LP |
| `generateOrganizationJsonLd` | Organization | Homepage, globální |
| `generateWebSiteJsonLd` | WebSite + SearchAction | Homepage (sitelinks searchbox) |
| `generatePartProductJsonLd` | Product + Offer | Díl detail |
| `generateStoreJsonLd` | AutoPartsStore | Vrakoviště LP |
| `generateLocalBusinessJsonLd` | AutomotiveBusiness | Kontakt, partneři |
| `generateAggregateRatingJsonLd` | Organization + AggregateRating | Recenze |
| `generateJobPostingJsonLd` | JobPosting | Kariéra |
| `generatePersonJsonLd` | Person | Broker profil |

### 6.2 Pokrytí

**JSON-LD nalezeno na 33 z ~80 veřejných stránek** (41%).

| Stránka | JSON-LD typy | Status |
|---------|-------------|--------|
| Homepage (`/`) | WebSite, Organization, FAQPage | ✅ Výborné |
| `/nabidka/{slug}` (vehicle) | Vehicle, BreadcrumbList | ✅ |
| `/profil/{slug}` (broker) | Person, BreadcrumbList | ✅ |
| `/blog/{slug}` (article) | Article, BreadcrumbList | ✅ |
| `/dily/{slug}` (part) | Product, BreadcrumbList | ✅ |
| `/shop/produkt/{slug}` | Product, BreadcrumbList | ✅ |
| `/kariera` | JobPosting | ✅ |
| `/recenze` | AggregateRating | ✅ |
| `/kontakt` | LocalBusiness | ✅ |
| `/nabidka/skoda` (brand LP) | WebPage, FAQPage, AggregateOffer, ItemList | ✅ Výborné |
| `/dily/znacka/{brand}` | ItemList, FAQPage | ✅ |
| `/dily/vrakoviste/{slug}` | AutoPartsStore | ✅ |
| `/stk/{slug}` | LocalBusiness | ✅ |
| `/autoservisy/{slug}` | LocalBusiness | ✅ |
| `/jak-prodat-auto` | HowTo | ✅ |
| `/kolik-stoji-moje-auto` | WebApplication | ✅ |

### 6.3 Chybějící JSON-LD (mezery)

| Stránka | Doporučený typ | Priorita |
|---------|----------------|----------|
| `/nabidka` (list) | ItemList + CollectionPage | P1 |
| `/makleri` (list) | ItemList (brokers) | P2 |
| `/bazar/{slug}` | AutoDealer/LocalBusiness | P1 |
| `/dily` (katalog root) | ItemList | P2 |
| `/stk` (list) | ItemList + WebPage | P2 |
| `/autoservisy` (list) | ItemList + WebPage | P2 |
| `/inzerce` | WebPage | P3 |
| `/marketplace` | WebPage | P3 |
| `/o-nas` | Organization (detailed) | P2 |
| `/cenik` | WebPage / PriceSpecification | P3 |
| `/stk/mesto/{city}` | ItemList + LocalBusiness | P1 |
| `/blog` (list) | Blog + ItemList | P2 |
| `/blog/kategorie/{slug}` | CollectionPage | P2 |

---

## 7. INTERNÍ LINKING

### 7.1 Cross-linking systém

**`lib/seo-crosslinks.ts`** — Bridge links mezi sekcemi:
- `getVehicleToPartsBridge()` — z nabídky auta → díly pro tuto značku/model
- `getPartsToVehicleBridge()` — z dílu → ojetá auta této značky/modelu
- `SERVICE_CROSS_LINKS` — statické linky na služby (prověrka, financování, pojištění)

### 7.2 Hodnocení

**Pozitiva:**
- ✅ Breadcrumbs na většině stránek (+ BreadcrumbList JSON-LD)
- ✅ Cross-linking vehicles ↔ parts (díky `seo-crosslinks.ts`)
- ✅ Related vehicles na vehicle detail
- ✅ "Podobné díly" na parts detail
- ✅ FAQ sekce s interními odkazy na brand landing pages

**Problémy:**

| Problém | Dopad | Priorita |
|---------|-------|----------|
| ⚠️ Chybí cross-link: Vehicle → STK stanice v regionu | Missed GEO signals | P2 |
| ⚠️ Chybí cross-link: Autoservis → Nabídka aut v regionu | Missed linkjuice | P2 |
| ⚠️ Chybí cross-link: Blog článek → Relevantní brand LP | Missed topical authority | P1 |
| ⚠️ Chybí footer sitemap links (HTML sitemap) | Crawlability | P3 |
| ⚠️ Breadcrumbs chybí na některých stránkách (/inzerce, /marketplace) | Navigation + schema | P2 |

---

## 8. TECHNICKÉ SEO

### 8.1 Robots.txt

**Soubor:** `app/robots.ts`

**Pozitiva:**
- ✅ Blokuje admin, PWA, user account routy
- ✅ Explicitně povoluje AI crawlery (GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Applebot-Extended)
- ✅ Sitemap reference

**Problémy:**
| Problém | Dopad | Priorita |
|---------|-------|----------|
| ⚠️ Neblokuje `/moje-inzeraty/` (v SKIP_REWRITE ale ne v robots) | LÉPE: je v disallow `/moje-inzeraty` potřeba zkontrolovat | P3 |
| ⚠️ Neblokuje `/shop/moje-objednavky/` | User-specific pages indexovatelné | P2 |
| ⚠️ Neblokuje `/dily/moje-objednavky/` | User-specific pages indexovatelné | P2 |

### 8.2 Security Headers (SEO relevantní)

**Z `next.config.ts`:**
- ✅ `X-Frame-Options: DENY` — prevence clickjacking
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin` — zachovává referrer data pro analytics
- ✅ HSTS s preload

### 8.3 ISR / Revalidation

| Stránka | `revalidate` | Hodnocení |
|---------|-------------|-----------|
| Homepage | 3600 (1h) | ✅ OK |
| Vehicle list | 300 (5min) | ✅ Správně — dynamický obsah |
| Vehicle detail | 600 (10min) | ✅ OK |
| Blog article | 86400 (24h) | ✅ OK |
| STK list | 3600 (1h) | ✅ OK |
| Parts detail | 86400 (24h) | ✅ OK |
| Brand LP | varies | ✅ OK |

### 8.4 Hreflang

❌ **CHYBÍ KOMPLETNĚ.** Žádný hreflang tag, žádné alternates.languages.

**Dopad:** Nízký — Carmakler je CZ-only platforma. Hreflang by byl potřeba až při expanzi na SK/DE trhy.

### 8.5 Canonical — viz §3

### 8.6 Mobile

- ✅ Viewport meta tag správně
- ✅ `themeColor: "#F97316"` pro PWA
- ✅ Mobile-first design (Tailwind)
- ✅ `font-display: swap` (Outfit font)

---

## 9. PROGRAMATICKÉ SEO

### 9.1 Landing pages

**Carmakler má rozsáhlý systém programatických LP:**

| Typ | Příklad | Počet | Template |
|-----|---------|-------|----------|
| Brand | `/nabidka/skoda` | 16 | Individuální stránky s unikátním content |
| Model | `/nabidka/skoda/octavia` | 12+ | Individuální stránky |
| Karoserie | `/nabidka/suv`, `/nabidka/sedan` | 7 | Individuální stránky |
| Cenový rozsah | `/nabidka/do-200000` | 5 | Individuální stránky |
| Město | `/nabidka/praha`, `/nabidka/brno` | 8 | Individuální stránky |
| Díly značka | `/dily/znacka/skoda` | 8 | Dynamic `[brand]/page.tsx` |
| Díly model | `/dily/znacka/skoda/octavia` | ~24 | Dynamic `[brand]/[model]/page.tsx` |
| Díly model+rok | `/dily/znacka/skoda/octavia/2020` | ~72 | Dynamic `[brand]/[model]/[rok]/page.tsx` |
| Díly kategorie | `/dily/kategorie/motor` | 11 | Dynamic `[slug]/page.tsx` |
| STK město | `/stk/mesto/praha` | Dynamic | `[city]/page.tsx` |

### 9.2 SEO data (`lib/seo-data.ts`)

**Obsáhlý dataset** s:
- `aiSnippet` — 2-3 věty optimalizované pro AI featured snippets
- `quickFacts` — konkrétní čísla pro AI citovatelnost
- `avgPriceRange` — cenový rozsah pro citovatelnost
- `faqItems` — FAQ s unikátními odpověďmi per brand
- `description` — 3-5 vět unique content per brand

### 9.3 GEO/AI SEO readiness

**Pozitiva (pokročilé):**
- ✅ `WebPage` JSON-LD s `speakable`, `about`, `mentions` properties
- ✅ AI crawlery explicitně povoleny v robots.txt
- ✅ `aiSnippet` + `quickFacts` optimalizované pro LLM extraction
- ✅ Konkrétní čísla a data (ceny, procenta, doby prodeje)
- ✅ Geo meta tagy v root layout (`geo.region`, `geo.placename`, `geo.position`, `ICBM`)

**Problémy:**
| Problém | Dopad | Priorita |
|---------|-------|----------|
| ⚠️ `speakable` CSS selektory mohou být neaktuální | AI voice search | P3 |
| ⚠️ Chybí `sameAs` na Wikipedia/Wikidata v Organization | Entity disambiguation | P2 |
| ⚠️ Chybí `knowsAbout` v Organization JSON-LD | Topical authority | P3 |

---

## 10. CORE WEB VITALS

### 10.1 Optimalizace v kódu

| Technika | Implementace | Status |
|----------|-------------|--------|
| **Image optimization** | Next.js `<Image>` + Cloudinary | ✅ |
| **Font optimization** | `font-display: swap`, Google Fonts via `next/font` | ✅ |
| **Code splitting** | `dynamic()` imports (PriceHistory, ArticleReactions...) | ✅ |
| **ISR** | `revalidate` na všech stránkách | ✅ |
| **Package optimization** | `optimizePackageImports` v next.config | ✅ |
| **Turbopack** | Enabled pro dev | ✅ |
| **Server Components** | Default RSC, "use client" jen kde nutné | ✅ |

### 10.2 Potenciální problémy

| Problém | Metrika | Priorita |
|---------|---------|----------|
| ⚠️ Leaflet maps (client-side rendering) | LCP delay | P2 |
| ⚠️ Recharts (heavy bundle) — in optimizePackageImports | Bundle size | P3 |
| ⚠️ Chybí `loading.tsx` pro `/nabidka` (root) — ale je pro `/nabidka/[slug]` | CLS shift | P3 |
| ⚠️ Service Worker (Serwist) může zpomalit FCP na prvním loadu | FCP | P3 |

---

## 11. ANALYTICS

### 11.1 Současný stav

- **Plausible Analytics** — privacy-first, lightweight (~1KB script)
- Custom event tracking v `lib/analytics.ts`
- Cookie consent banner (`CookieConsent.tsx`)

### 11.2 SEO-relevantní problémy

| Problém | Dopad | Priorita |
|---------|-------|----------|
| ⚠️ Chybí Google Search Console integrace (v kódu) | GSC data | Info |
| ⚠️ Chybí Google Analytics 4 (záměrně — Plausible) | GA4 ecommerce tracking | Info |

---

## 12. KOMPLETNÍ PRIORITY MATRIX

### P0 — Kritické (okamžitě)

| # | Nález | Soubor/Oblast | Dopad |
|---|-------|--------------|-------|
| 1 | Sitemap překročí 50K URL limit | `app/sitemap.ts` | Google přestane indexovat |
| 2 | Potřeba sitemap index | `app/sitemap.ts` | Crawl budget |

### P1 — Vysoká priorita (do 2 týdnů)

| # | Nález | Soubor/Oblast | Dopad |
|---|-------|--------------|-------|
| 3 | Chybí canonical na `/blog/kategorie/{slug}` | `app/(web)/blog/kategorie/[slug]/page.tsx` | Duplicate content |
| 4 | Chybí canonical na `/stk/mesto/{city}` | `app/(web)/stk/mesto/[city]/page.tsx` | GEO LP bez canonical |
| 5 | Duplikace `/dily/{slug}` vs `/shop/produkt/{slug}` | Oba page.tsx | Duplicate content |
| 6 | Nabídka title příliš generické | `app/(web)/nabidka/page.tsx` | Nízký CTR |
| 7 | `/stk/mesto/{city}` chybí v sitemap | `app/sitemap.ts` | Nezaindexované GEO LP |
| 8 | Filter URLs bez noindex/canonical | `/nabidka?brand=...` | Crawl budget waste |
| 9 | Chybí JSON-LD na `/bazar/{slug}` | `app/(web)/bazar/[slug]/page.tsx` | AutoDealer schema |
| 10 | Blog → brand LP cross-linking | Celá blog sekce | Topical authority |

### P2 — Střední priorita (do měsíce)

| # | Nález | Soubor/Oblast | Dopad |
|---|-------|--------------|-------|
| 11 | Robots.txt: přidat `/shop/moje-objednavky/`, `/dily/moje-objednavky/` | `app/robots.ts` | User pages crawled |
| 12 | `lastModified: new Date()` na statických stránkách | `app/sitemap.ts` | Crawl confusion |
| 13 | Programatické LP dědí generické OG obrázky | OG images | Social sharing |
| 14 | Chybí JSON-LD na list stránkách (nabídka, makleri, STK list...) | Multiple pages | Rich results |
| 15 | Cross-link: Vehicle → STK v regionu | Interní linking | GEO signals |
| 16 | Cross-link: Autoservis → Nabídka aut v regionu | Interní linking | Linkjuice |
| 17 | Breadcrumbs na /inzerce, /marketplace | Missing | Navigation schema |
| 18 | Sitemap images extension | `app/sitemap.ts` | Image search |
| 19 | sameAs na Wikipedia/Wikidata | `lib/seo.ts` | Entity SEO |

### P3 — Nízká priorita (backlog)

| # | Nález | Dopad |
|---|-------|-------|
| 20 | Descriptions > 160 znaků | SERP truncation |
| 21 | Hreflang (pro budoucí SK expanzi) | Multilingual |
| 22 | HTML sitemap v footer | Crawlability |
| 23 | OG image pro /kariera | Social sharing |
| 24 | knowsAbout v Organization | Topical authority |
| 25 | Speakable CSS selektory audit | Voice search |

---

## 13. CELKOVÉ HODNOCENÍ

| Oblast | Skóre | Komentář |
|--------|-------|----------|
| URL struktura | 9/10 | Výborná hierarchie, české slugy, programatické LP |
| Metadata (title+desc) | 8/10 | 100% pokrytí, kvalitní, pár generických titulů |
| Canonical | 7/10 | Centrální systém existuje, ~30 stránek bez canonical |
| OG metadata + images | 9/10 | 25 dynamických OG, branded layout, velmi dobré |
| Sitemap | 6/10 | Obsáhlá, ale single file — potřeba index |
| Schema.org | 8/10 | 20+ generátorů, pokrývá 41% stránek — potřeba rozšířit |
| Interní linking | 7/10 | Cross-link systém existuje, potřeba rozšířit |
| Technical SEO | 8/10 | ISR, RSC, image opt, font opt — solidní |
| GEO/AI SEO | 9/10 | aiSnippet, quickFacts, AI crawlers — pokročilé |
| Core Web Vitals | 7/10 | Optimalizace v kódu, ale bez real-world měření |

**Celkové skóre: 7.8/10**

---

*Tento audit slouží jako vstup pro Task #4 (SEO ekosystém + SEO centrum) a Task #5 (STK + Autoservisy). Priority P0 a P1 by měly být řešeny nezávisle na dalších plánech.*
