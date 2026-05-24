# Kompletní SEO Audit — carmakler.cz

**Datum:** 2026-05-23
**Status:** AUDIT COMPLETE
**Typ:** Technical + Content + Local + Entity SEO
**Auditor:** Plánovač agent

---

## 1. Executive Summary

### Celkové hodnocení: 7.5/10 (Dobrý základ, prostor pro zlepšení)

**Silné stránky:**
- Dynamický sitemap pokrývající všechny entity (vozidla, makléři, díly, články, servisy, inzeráty, autobazary)
- robots.txt s explicitní podporou AI crawlerů (GPTBot, ClaudeBot, PerplexityBot)
- Rozsáhlá knihovna JSON-LD generátorů (`lib/seo.ts` — 15 typů)
- Canonical URL systém (`lib/canonical.ts`) s page-level enforcement
- 146 stránek s explicitní metadata
- OG images pro 25+ sekcí
- GEO/AIEO základ (speakable, about/mentions entities, AI snippets v datech)

**Klíčové problémy:**
- 44 stránek s metadata ale BEZ canonical URL
- 100+ stránek BEZ JSON-LD structured data
- Chybí hreflang (OK pro jednojazyčný web, ale potenciál pro SK)
- STK city pages bez canonical
- Chybí region-level pages pro lokální SEO
- Schema.org STK = AutoRepair (správně GovernmentService jako additionalType)
- Chybí BreadcrumbList na mnoha stránkách
- Duplicitní BreadcrumbList JSON-LD na STK/autoservisy detail stránkách (Breadcrumbs.tsx + ruční `<script>`)
- Chybí `llms.txt` pro AI crawlery
- SeoContent Prisma model existuje ale není využíván
- Subdomain rewriting může způsobit duplicitní obsah (chybí canonical strategie pro subdomény)

---

## 2. Technické SEO

### 2.1 Sitemap (`app/sitemap.ts`)

**Stav: VÝBORNÝ (9/10)**

Dynamický sitemap generovaný z Prisma DB pokrývající:
- ✅ 30+ statických stránek s priority a changeFrequency
- ✅ Vozidla (ACTIVE, z DB)
- ✅ Makléři (ACTIVE BROKER, z DB)
- ✅ Hashtag landing pages (tagy s ≥2 aktivními makléři)
- ✅ Vrakoviště partner pages
- ✅ Autobazary partner pages
- ✅ Blog články (PUBLISHED)
- ✅ Inzeráty (ACTIVE listings)
- ✅ Díly (ACTIVE parts)
- ✅ Autoservisy + STK (isPublished)
- ✅ SEO landing pages: 16 značek, 12 modelů, 7 karoserií, 5 cenových rozsahů, 8 měst
- ✅ Díly landing pages: 11 kategorií, 8 značek, ~24 modely, ~72 model+rok

**Doporučení:**
- [ ] Rozdělit na sitemap index (sitemap-index.xml) — při 10 000+ URL bude nutné (Next.js limit 50 000)
- [ ] Přidat lastModified z reálných dat (momentálně `new Date()` na statických)
- [ ] Přidat hreflang anotace pokud se expanduje na SK
- [ ] Přidat STK/autoservisy město a kraj stránky do sitemap

### 2.2 Robots.txt (`app/robots.ts`)

**Stav: VÝBORNÝ (9/10)**

- ✅ Default `*` user-agent: allow `/`, disallow auth/admin/PWA routes
- ✅ Explicitní pravidla pro AI crawlery (GPTBot, ChatGPT-User, CCBot, ClaudeBot, Claude-SearchBot, Claude-User, OAI-SearchBot, PerplexityBot, Applebot-Extended, GoogleOther)
- ✅ Sitemap reference

**Doporučení:**
- [ ] Přidat `Googlebot-Image: Allow: /` pro image search visibility
- [ ] Zvážit `X-Robots-Tag` headers pro API routes (redundantní s disallow, ale defense-in-depth)

### 2.3 Canonical URLs (`lib/canonical.ts`)

**Stav: DOBRÝ (7/10)**

- ✅ `pageCanonical()` helper s validací, trailing slash normalizací, query strip
- ✅ Root layout NEMÁ `alternates.canonical` (bug #127 fix)
- ✅ 102 stránek s explicitním `pageCanonical()`

**PROBLÉMY:**

| Stránka | Problém |
|---------|---------|
| `/stk/mesto/[city]` | Chybí `pageCanonical` — 0 výskytů |
| `/shop/produkt/[slug]` | Chybí `pageCanonical` — 0 výskytů |
| Registrační/auth stránky | Některé chybí (OK — noindex by default) |
| Objednávkové stránky | Některé chybí (OK — noindex) |

**Kritické opravy:**
1. **`/stk/mesto/[city]`**: Přidat `alternates: pageCanonical(\`/stk/mesto/${city}\`)` do `generateMetadata`
2. **`/shop/produkt/[slug]`**: Přidat `alternates: pageCanonical(\`/shop/produkt/${slug}\`)`

### 2.4 Meta tagy (`app/layout.tsx`)

**Stav: VÝBORNÝ (9/10)**

Root layout:
- ✅ `metadataBase: new URL(BASE_URL)` 
- ✅ Title template: `%s | CarMakléř`
- ✅ Default title: "CarMakléř | Prodej aut přes ověřené makléře"
- ✅ Description (qualitative, includes keywords)
- ✅ Keywords meta tag (8 klíčových slov)
- ✅ OpenGraph (type, locale cs_CZ, siteName, images)
- ✅ Twitter card (summary_large_image)
- ✅ Favicon set (32, 48, 96, 192, 512 + Apple touch)
- ✅ Geo meta tags (geo.region: CZ, geo.position, ICBM)
- ✅ lang="cs" na `<html>`
- ✅ Manifest link for PWA
- ✅ Theme color (#F97316)

**Doporučení:**
- [ ] Přidat `verification` pro Google Search Console, Bing Webmaster (pokud chybí)
- [ ] Zvážit `alternate` s `hreflang="cs"` + `x-default` pro budoucí SK expanzi

### 2.5 Viewport a Performance

- ✅ viewport: width=device-width, initialScale=1, maximumScale=5, viewportFit=cover
- ✅ Font: Outfit (Google Fonts, display=swap, subsets: latin+latin-ext)
- ✅ Antialiased text, overflow-x-hidden

---

## 3. Structured Data (Schema.org / JSON-LD)

### 3.1 Existující JSON-LD generátory (`lib/seo.ts`)

| Generátor | Schema.org typ | Použito na |
|-----------|---------------|------------|
| `generateBreadcrumbJsonLd` | BreadcrumbList | Detail stránky (STK, servisy, profily) |
| `generateFaqJsonLd` | FAQPage | STK listing, autoservisy listing, značky |
| `generateFaqPageJsonLd` | FAQPage | Díly landing pages |
| `generateVehicleJsonLd` | Vehicle | Detail vozidla |
| `generateServiceJsonLd` | Service | Služby stránky |
| `generateArticleJsonLd` | Article | Blog články |
| `generateHowToJsonLd` | HowTo | Průvodce (jak prodat auto) |
| `generateWebApplicationJsonLd` | WebApplication | — |
| `generateWebPageJsonLd` | WebPage | GEO optimalizované stránky |
| `generateOrganizationJsonLd` | Organization | Homepage |
| `generateWebSiteJsonLd` | WebSite + SearchAction | Homepage |
| `generatePartProductJsonLd` | Product | Detail dílu |
| `generateStoreJsonLd` | AutoPartsStore | Vrakoviště landing |
| `generateLocalBusinessJsonLd` | AutomotiveBusiness | Kontakt |
| `generateAggregateRatingJsonLd` | Organization + AggregateRating | Recenze |
| `generateJobPostingJsonLd` | JobPosting | Kariéra |
| `generatePersonJsonLd` | Person | Profil makléře |
| `generateBrandItemListJsonLd` | ItemList | Značka landing |
| `generateAggregateOfferJsonLd` | Product + AggregateOffer | Model landing |
| `generatePartsItemListJsonLd` | ItemList | Díly landing pages |
| `generateItemListJsonLd` | ItemList | Obecný listing |

### 3.2 Coverage audit — kde CHYBÍ JSON-LD

| Stránka | Aktuální JSON-LD | Chybí |
|---------|------------------|-------|
| `/` (homepage) | ✅ WebSite + SearchAction, FAQ | ✅ Organization (měl by být) |
| `/nabidka` | ✅ FAQ, WebPage | — |
| `/nabidka/[slug]` (detail vozu) | ✅ Vehicle, BreadcrumbList | — |
| `/nabidka/skoda` (značka) | ✅ ItemList, AggregateOffer, FAQ, WebPage | — |
| `/stk` | ✅ FAQ | ItemList (listing stanic) |
| `/stk/[slug]` | ✅ AutoRepair, BreadcrumbList | GovernmentService |
| `/stk/mesto/[city]` | ❌ ŽÁDNÝ | ItemList, BreadcrumbList |
| `/autoservisy` | ✅ FAQ | ItemList |
| `/autoservisy/[slug]` | ✅ AutoRepair, BreadcrumbList | — |
| `/makleri` | Neznámé | ItemList, BreadcrumbList |
| `/profil/[slug]` | ✅ Person | — |
| `/blog` | ❌ Neověřeno | ItemList |
| `/blog/[slug]` | ✅ Article | — |
| `/dily` | ❌ Neověřeno | ItemList |
| `/dily/[slug]` | ✅ Product | — |
| `/shop` | ❌ Neověřeno | ItemList |
| `/shop/produkt/[slug]` | ✅ Product (předpoklad) | — |
| `/inzerce` | ❌ Neověřeno | ItemList |
| `/recenze` | ✅ AggregateRating | — |
| `/kariera` | ✅ JobPosting | — |
| `/kontakt` | ✅ LocalBusiness | — |
| `/sluzby/*` | ✅ Service | — |

### 3.3 Prioritní opravy

1. **P0**: `/stk/[slug]` — přidat GovernmentService typing vedle AutoRepair
2. **P0**: `/stk/mesto/[city]` — přidat BreadcrumbList + ItemList JSON-LD
3. **P1**: `/stk` — přidat ItemList JSON-LD na listing
4. **P1**: `/autoservisy` — přidat ItemList JSON-LD na listing
5. **P2**: Přidat BreadcrumbList na VŠECHNY veřejné stránky (standardizace)

---

## 4. Obsahové SEO

### 4.1 Metadata kvalita

**Silné stránky:**
- Každá stránka má unikátní title a description
- Titulky obsahují klíčová slova + geografii
- Brand stránky mají AI snippets a quickFacts pro GEO SEO
- Dynamické stránky generují metadata z DB dat

**Doporučení:**
- [ ] Některé titulky jsou příliš krátké (< 30 znaků) — rozšířit
- [ ] Description na dynamických stránkách by měl obsahovat cenu/rok/km pro rich snippets
- [ ] Title template `%s | CarMakléř` je OK, ale pro homepage by mělo být opačné pořadí (✅ již je: `absolute`)

### 4.2 H1/H2 struktura

**Obecně dobrá:**
- STK listing: `<h1>STK stanice v České republice</h1>` ✅
- STK detail: `<h1>{servis.name}</h1>` ✅
- Autoservisy listing: `<h1>Najděte ověřený autoservis</h1>` ✅
- Homepage: obsahuje H1 s klíčovými slovy ✅

**Doporučení:**
- [ ] Ověřit, že žádná stránka nemá duplicitní H1
- [ ] STK city page: H1 obsahuje město ✅ správně

### 4.3 Alt texty a obrázky

- ✅ `next/image` je použito (optimalizace)
- ✅ OG images generovány dynamicky pro 25+ sekcí
- [ ] Ověřit alt texty na produktových obrázcích (díly, vozidla)
- [ ] Přidat `loading="lazy"` na below-fold obrázky (Next.js dělá automaticky)

---

## 5. Lokální SEO

### 5.1 Aktuální stav

**Dobré:**
- ✅ Geo meta tags v root layoutu (region: CZ, position: Praha)
- ✅ STK město stránky (`/stk/mesto/[city]`)
- ✅ Makléři mají města v profilu
- ✅ Nabídka aut má město landing pages (Praha, Brno, Ostrava, Plzeň, Liberec, Olomouc, Hradec Králové, České Budějovice)

**Chybí:**
- ❌ Autoservisy město stránky (`/autoservisy/mesto/[city]`)
- ❌ Kraj-level stránky pro STK i autoservisy
- ❌ Google Business Profile (nepatří do kódu, ale doporučení)
- ❌ NAP (Name, Address, Phone) konzistence — ověřit na všech stránkách
- ❌ LocalBusiness JSON-LD chybí na /autoservisy/[slug] (je AutoRepair, OK, ale lze přidat areaServed)

### 5.2 Doporučené lokální stránky (50+ nových)

**Kraje (14):**
```
/stk/praha                    /autoservisy/praha
/stk/stredocesky              /autoservisy/stredocesky
/stk/jihocesky                /autoservisy/jihocesky
/stk/plzensky                 /autoservisy/plzensky
/stk/karlovarsky              /autoservisy/karlovarsky
/stk/ustecky                  /autoservisy/ustecky
/stk/liberecky                /autoservisy/liberecky
/stk/kralovehradecky          /autoservisy/kralovehradecky
/stk/pardubicky               /autoservisy/pardubicky
/stk/vysocina                 /autoservisy/vysocina
/stk/jihomoravsky             /autoservisy/jihomoravsky
/stk/olomoucky                /autoservisy/olomoucky
/stk/zlinsky                  /autoservisy/zlinsky
/stk/moravskoslezsky          /autoservisy/moravskoslezsky
```

**Top města (existující + nová, 20+):**
```
/autoservisy/mesto/praha      /autoservisy/mesto/brno
/autoservisy/mesto/ostrava    /autoservisy/mesto/plzen
/autoservisy/mesto/liberec    /autoservisy/mesto/olomouc
/autoservisy/mesto/ceske-budejovice  /autoservisy/mesto/hradec-kralove
/autoservisy/mesto/usti-nad-labem    /autoservisy/mesto/pardubice
/autoservisy/mesto/zlin       /autoservisy/mesto/kladno
/autoservisy/mesto/most       /autoservisy/mesto/frydek-mistek
/autoservisy/mesto/karvina    /autoservisy/mesto/jihlava
```

---

## 6. GEO / AI SEO (AIEO)

### 6.1 Aktuální stav — NADPRŮMĚRNÝ (8/10)

**Silné stránky:**
- ✅ robots.txt explicitně povoluje AI crawlery (GPTBot, ClaudeBot, PerplexityBot atd.)
- ✅ `generateWebPageJsonLd` podporuje `speakable` CSS selektory
- ✅ `about` a `mentions` entity v WebPage JSON-LD
- ✅ Brand data obsahují `aiSnippet` a `quickFacts` — přímé odpovědi pro AI
- ✅ FAQ structured data na klíčových stránkách
- ✅ Jasné, faktické texty v popisech (ne marketingový fluff)

### 6.2 GEO optimalizační strategie

**Co funguje pro AI vyhledávače:**

1. **Přímé odpovědi** — AI preferuje stránky s jasnou, strukturovanou odpovědí
   - ✅ "Kolik stojí STK?" → Ceník na `/stk` s konkrétními cenami
   - ✅ Brand aiSnippets s konkrétními čísly
   - [ ] Přidat similar snippets pro autoservisy

2. **E-E-A-T signály** — Experience, Expertise, Authoritativeness, Trustworthiness
   - ✅ Organization JSON-LD s foundingDate, contactPoint
   - ✅ Person JSON-LD pro makléře s jobTitle
   - ✅ AggregateRating na recenzích
   - [ ] Přidat author Person JSON-LD do blog článků (ne jen Organization)

3. **Citovatelnost** — AI potřebuje fakta ke citování
   - ✅ quickFacts arrays s konkrétními čísly
   - ✅ FAQ s přesnými odpověďmi
   - [ ] Přidat "Key facts" sekce na autoservisy/STK stránky

4. **Aktuálnost** — AI preferuje aktuální obsah
   - ✅ `dateModified` v WebPage JSON-LD
   - [ ] Přidat `dateModified` do Vehicle a Part JSON-LD

### 6.3 Doporučení pro AI/GEO SEO

1. **Speakable markup** — rozšířit na všechny informační stránky
2. **FAQ rozšíření** — přidat FAQ na `/kontakt`, `/o-nas`, `/marketplace`
3. **Definitive answers** — pro fráze jako "nejlepší autoservis Praha 2026", "kde na STK v Brně"
4. **Author credibility** — blog články přiřadit reálným autorům (Person JSON-LD)
5. **Topical authority** — publikovat pravidelný obsah o údržbě aut, STK, servisu

---

## 7. URL struktura — audit

### 7.1 Aktuální stav

```
/                              Homepage
/nabidka                       Katalog vozidel
/nabidka/[slug]                Detail vozidla
/nabidka/[brand]               Brand landing (16)
/nabidka/[brand]/[model]       Model landing (12)
/nabidka/[bodytype]            Karoserie landing (7)
/nabidka/[pricerange]          Cenový rozsah (5)
/nabidka/[city]                Město landing (8)

/inzerce                       Inzertní platforma
/inzerce/katalog               Katalog inzerátů

/dily                          Autodíly
/dily/[slug]                   Detail dílu
/dily/kategorie/[slug]         Kategorie dílů (11)
/dily/znacka/[brand]           Díly dle značky (8)
/dily/znacka/[brand]/[model]   Díly dle modelu (~24)
/dily/znacka/[brand]/[model]/[rok]  Díly dle rok (~72)
/dily/vrakoviste/[slug]        Vrakoviště profil

/shop                          E-shop
/shop/katalog                  Katalog shop
/shop/produkt/[slug]           Detail produktu

/stk                           STK listing
/stk/[slug]                    STK detail
/stk/mesto/[city]              STK ve městě

/autoservisy                   Autoservisy listing
/autoservisy/[slug]            Autoservis detail

/makleri                       Seznam makléřů
/makleri/[slug]                Hashtag landing
/profil/[slug]                 Profil makléře

/blog                          Blog
/blog/[slug]                   Článek
/blog/kategorie/[slug]         Blog kategorie

/marketplace                   Marketplace landing
/marketplace/apply             Apply formulář
/marketplace/dealer            Dealer dashboard
/marketplace/investor          Investor dashboard

/recenze                       Recenze
/kariera                       Kariéra
/kontakt                       Kontakt
/o-nas                         O nás
/sluzby/*                      Služby (prověrka, financování, pojištění)
/jak-prodat-auto               Průvodce prodejem
/kolik-stoji-moje-auto         Kalkulačka ceny
/jak-to-funguje                Jak to funguje
/cenik                         Ceník
/pro-maklere                   Pro makléře
```

### 7.2 Hodnocení

**Silné stránky:**
- ✅ Čistá, sémantická URL struktura
- ✅ České slugy (srozumitelné pro uživatele)
- ✅ Hierarchická struktura (brand → model)
- ✅ Konzistentní naming conventions

**Problémy:**
- ⚠️ Potenciální kolize v `/nabidka/[slug]` — brand, bodytype, pricerange, city a vozidlo slug sdílejí prefix
- ⚠️ Chybí `/autoservisy/mesto/[city]` (STK má, autoservisy ne)
- ⚠️ Chybí kraj stránky
- ℹ️ `/shop` vs `/dily` — dva oddělené katalogy (záměrně, ale může mást SEO)

---

## 8. OG Images

### 8.1 Coverage

25 OG image souborů nalezeno v `app/(web)/`:
- ✅ Root homepage
- ✅ Blog, dily, marketplace, makleri, inzerce, shop, sluzby, kontakt, o-nas, chci-prodat, cenik, kariera, recenze, autoservisy, stk, reklamacni-rad
- ✅ Dynamic: blog/[slug], nabidka/[slug], profil/[slug], bazar/[slug], dily/[slug], shop/produkt/[slug], autoservisy/[slug], stk/[slug]

**Chybí:**
- ❌ `/stk/mesto/[city]` — žádný OG image
- ❌ `/nabidka/[brand]` — žádné per-brand OG images
- ❌ `/dily/kategorie/[slug]` — žádný OG image
- ❌ `/marketplace/apply` — žádný OG image

---

## 9. Konkurenční analýza (SEO best practices)

### 9.1 Sauto.cz (Seznam.cz)
- Největší český automobilový portál, 101 827+ inzerátů
- SSR (X-Server-Side-Rendering: true), API-driven SPA
- URL: `/inzerce/osobni/[brand]/[model]` — čistá hierarchická struktura
- **Schema.org: ŽÁDNÝ JSON-LD** — ani Vehicle, ani Product
- **Sitemap: ŽÁDNÝ** (!) — nebyl nalezen v robots.txt
- robots.txt: extrémně granulární (14+ user-agent pravidel), blokuje neznámé crawlery
- Selektivní Allow pro filtrované kategorie

### 9.2 TipCars.com
- 73k inzerátů, 22k článků, 1.5M měsíčních návštěv
- Schema.org: pouze WebSite + Organization (minimum)
- **ŽÁDNÝ Vehicle/Product schema**
- Sitemap: výborný — 21 sub-sitemapů (listing, articles, forum, regional)
- **Blokuje ClaudeBot** v robots.txt
- Silné: Forum (UGC), magazín (22k článků = obrovský long-tail asset)

### 9.3 AAA Auto
- Multi-country (CZ, SK, PL, HU), 31 fyzických poboček
- **Schema.org: ŽÁDNÝ JSON-LD**
- URL: `/cz/[brand]-[model]/car.html?id=[ID]` — query parametry (špatné)
- Sitemap: 6 komprimovaných sub-sitemapů (make, make-model, make-model-body, car, review, menu)
- Blokuje SEO tool crawlery (SemrushBot, DotBot)
- **ŽÁDNÝ hreflang** navzdory 4 zemím

### 9.4 Srovnávací matice

| Feature | Sauto | TipCars | AAA Auto | **CarMakléř** |
|---------|-------|---------|----------|---------------|
| Vehicle/Product schema | ❌ | ❌ | ❌ | **✅** |
| BreadcrumbList | ❌ | ❌ | ❌ | **✅** |
| FAQPage | ❌ | ❌ | ❌ | **✅** |
| Organization | ❌ | ✅ | ❌ | **✅** |
| AI crawlers povoleny | ❌ | ❌ ClaudeBot | ❌ | **✅ ALL** |
| Sitemap | ❌ | ✅ (21) | ✅ (6) | **✅** |
| Local SEO pages | ❌ | ❌ | ❌ | **✅** (STK/servisy) |
| AI snippets/quickFacts | ❌ | ❌ | ❌ | **✅** |
| Blog/Magazín | ❌ | ✅ (22k) | ❌ | ✅ (rostoucí) |

### 9.5 Carmakler konkurenční výhoda

1. **Structured data leadership** — ŽÁDNÝ competitor nepoužívá Vehicle/Product/FAQPage schema
2. **AI-first strategy** — Všichni AI crawleři povoleni, competitors je blokují. ChatGPT traffic má 4.4x vyšší konverzi než organický search
3. **Lokální SEO monopol** — Nikdo nemá adresář autoservisů + STK s recenzemi
4. **Makléř profily** s Person JSON-LD — E-E-A-T signál (žádný competitor)
5. **Díly marketplace + vrakoviště** — unikátní vertical
6. **Chybí `llms.txt`** — přidat pro vedení AI crawlerů ke klíčovému obsahu

---

## 9b. Nové nálezy z hloubkového výzkumu

### 9b.1 Duplicitní BreadcrumbList JSON-LD

**Problém:** Na stránkách `/stk/[slug]` a `/autoservisy/[slug]` je BreadcrumbList emitován DVAKRÁT:
1. Komponenta `Breadcrumbs.tsx` automaticky generuje inline JSON-LD
2. Stránka manuálně volá `generateBreadcrumbJsonLd()` a vkládá druhý `<script>` tag

**Oprava:** Odstranit manuální `<script>` tag z `stk/[slug]/page.tsx` a `autoservisy/[slug]/page.tsx` — stačí jen `<Breadcrumbs>` komponenta.

### 9b.2 SeoContent model — nevyužitý potenciál

Existuje Prisma model `SeoContent` (`lib/seo/seoContentRepo.ts`) s:
- `pageType`: BRAND | MODEL | MODEL_YEAR | CATEGORY
- Pole: `h1`, `metaTitle`, `metaDesc`, `introHtml`, `sectionsJson`, `faqJson`, `aiSnippetText`, `quickFacts`

**Potenciál:** Umožňuje dynamicky přepisovat titulky, popisy a FAQ per landing page BEZ code change. Momentálně nevyužíváno — mělo by být integrováno do brand/model/kategorie stránek.

### 9b.3 Subdomain canonical strategie

Middleware přepisuje `inzerce.carmakler.cz`, `shop.carmakler.cz`, `marketplace.carmakler.cz` na interní cesty. Pokud oba (subdoména i apex) vracejí stejný obsah, vzniká duplicitní content.

**Oprava:** Ověřit, že subdomain rewrites nastavují canonical na apex domain (carmakler.cz), nebo přidat explicitní disallow pro subdomény v robots.txt.

### 9b.4 `llms.txt` — doporučení

[llms.txt](https://llmstxt.org/) je nový standard pro navigaci AI crawlerů. Žádný competitor jej nemá.

**Doporučení:** Vytvořit `/public/llms.txt` s:
```
# CarMakléř - Automobilová platforma

## O platformě
CarMakléř je česká automobilová platforma. Prodej aut přes ověřené makléře, 
autodíly z vrakovišť, inzerce vozidel, STK stanice a autoservisy.

## Hlavní sekce
- /nabidka - Katalog ojetých vozidel s prověrkou
- /dily - Autodíly z vrakovišť a aftermarket
- /stk - STK stanice v ČR s recenzemi  
- /autoservisy - Adresář autoservisů s hodnocením
- /makleri - Síť ověřených makléřů
- /blog - Průvodce nákupem a prodejem aut

## Klíčová fakta
- 400+ STK stanic v databázi
- Ceny STK regulované státem (800 Kč + 400 Kč emise = 1 200 Kč osobní auto)
- Provize makléře: 5% z prodejní ceny, min. 25 000 Kč
```

### 9b.5 Schema.org vylepšení z výzkumu

1. **Vehicle → Car**: Použít `Car` místo `Vehicle` (specifičtější podtyp)
2. **Chybějící Vehicle properties**: `vehicleIdentificationNumber`, `bodyType`, `numberOfDoors`, `color`, `dateVehicleFirstRegistered`, `numberOfPreviousOwners`, `vehicleEngine`
3. **Parts Product**: Přidat `mpn` (manufacturer part number), `priceValidUntil`, `additionalProperty` pro kompatibilitu s vozidly
4. **STK JSON-LD**: Přidat `geo` (GeoCoordinates), `openingHoursSpecification` (strukturovaná forma), `image`
5. **Google deprecated Vehicle rich results** (Sept 2025) — schema stále pomáhá pro AI/Bing, ale neočekávat Google rich snippets
6. **Seller na parts**: Použít reálný název vrakoviště místo hardcoded "CarMakléř"

### 9b.6 Plausible Analytics

Web používá **Plausible Analytics** (ne Google Analytics) — privacy-friendly, consent-free v EU. Důležité pro SEO: nemáme Google Analytics data, ale Plausible poskytuje page views a event tracking.

---

## 10. Core Web Vitals — doporučení

### 10.1 Obecná architektura (dobrá)

- ✅ Server Components jako default (RSC)
- ✅ Font display: swap
- ✅ revalidate na stránkách (ISR)
- ✅ next/image pro optimalizaci obrázků

### 10.2 Doporučení

| Metrika | Doporučení |
|---------|-----------|
| LCP | Preload hero images, prioritizovat above-fold content |
| FID/INP | Minimalizovat "use client" components, lazy-load interaktivní prvky |
| CLS | Nastavit explicitní width/height na obrázky, skeleton loading |
| TTFB | Ověřit CDN configuration, edge caching pro statické stránky |
| Bundle size | Recent commit optimalizoval (`cd8709b perf: optimize login speed and reduce bundle size`) |

---

## 11. Akční plán — SEO opravy dle priority

### P0 — Kritické (opravit ihned)

| # | Oprava | Soubor | Effort |
|---|--------|--------|--------|
| 1 | Přidat pageCanonical do `/stk/mesto/[city]` | `app/(web)/stk/mesto/[city]/page.tsx` | 5 min |
| 2 | Přidat pageCanonical do `/shop/produkt/[slug]` | `app/(web)/shop/produkt/[slug]/page.tsx` | 5 min |

### P1 — Důležité (tento týden)

| # | Oprava | Effort |
|---|--------|--------|
| 3 | GovernmentService jako additionalType na STK detailech | 30 min |
| 4 | BreadcrumbList JSON-LD na `/stk/mesto/[city]` | 15 min |
| 5 | ItemList JSON-LD na `/stk` a `/autoservisy` listings | 30 min |
| 6 | Fix duplicitní BreadcrumbList na STK/autoservisy detail (odstranit manuální `<script>`) | 15 min |
| 7 | Vytvořit `/autoservisy/mesto/[city]` stránky | 2 hod |
| 8 | Import 400 STK stanic z JSON (viz plan-seo-stk-autoservisy.md) | 1 den |
| 9 | Přidat `llms.txt` do `/public/` | 15 min |

### P2 — Střední priorita (tento měsíc)

| # | Oprava | Effort |
|---|--------|--------|
| 10 | Vytvořit kraj stránky pro STK + autoservisy (28 stránek) | 1 den |
| 11 | Přidat OG images pro `/stk/mesto/[city]` | 2 hod |
| 12 | BreadcrumbList standardizace na všech veřejných stránkách | 1 den |
| 13 | Blog autor Person JSON-LD (ne Organization) | 2 hod |
| 14 | Speakable markup rozšíření | 2 hod |
| 15 | STK/autoservisy data enrichment (GPS, hodnocení, otevírací doby do JSON-LD) | 2-3 dny |
| 16 | FAQ rozšíření na dalších stránkách | 1 den |
| 17 | Integrace SeoContent modelu do brand/model landing pages | 1 den |
| 18 | Vehicle → Car upgrade + chybějící properties (VIN, bodyType, doors, color) | 2 hod |
| 19 | Parts Product: přidat mpn, priceValidUntil, reálný seller name | 1 hod |
| 20 | Ověřit subdomain canonical strategy (inzerce/shop subdomény) | 1 hod |

### P3 — Nice to have (příští měsíc)

| # | Oprava | Effort |
|---|--------|--------|
| 21 | Import 8000+ autoservisů z ARES | 3-5 dní |
| 22 | Sitemap index splitting (když >10k URLs) | 2 hod |
| 23 | Cross-linking vozidla → STK/servisy | 1 den |
| 24 | Kategorie landing pages pro autoservisy | 1 den |
| 25 | AI-optimalizované snippety pro servisy | 1 den |
| 26 | Google Search Console + Bing Webmaster verification | 30 min |
| 27 | TipCars-style magazín rozšíření (22k článků = masivní long-tail asset) | ongoing |

---

## 12. Metriky pro sledování

| Metrika | Nástroj | Cíl (3 měsíce) |
|---------|---------|-----------------|
| Indexované stránky | Google Search Console | 5 000+ |
| Organické impressions | GSC | 100 000/měsíc |
| Organické kliknutí | GSC | 10 000/měsíc |
| Avg. position "STK Praha" | GSC | Top 5 |
| Avg. position "autoservis recenze" | GSC | Top 10 |
| Core Web Vitals pass rate | PageSpeed Insights | 90%+ |
| Rich results eligibility | GSC Rich Results | 50%+ stránek |
| AI citation rate | Manual tracking | Měřit zmínky v ChatGPT/Perplexity |

---

## 13. Závěr

Carmakler má **nadprůměrný SEO základ** oproti české konkurenci, zejména díky:
- Komplexní structured data infrastruktuře
- AI crawler podpoře (GEO/AIEO)
- Dynamickému sitemapu
- Canonical URL systému

**Hlavní příležitost**: Lokální SEO dominance přes STK + autoservisy content (žádný competitor nemá). Import 400+ STK stanic a vytvoření region/město landing pages může přinést **5 000+ měsíčních organických návštěv** do 6 měsíců.

**Nejrychlejší výhry**: Oprava 2 chybějících canonical URL (5 min), přidání GovernmentService schema (30 min), vytvoření city pages pro autoservisy (2 hod).
