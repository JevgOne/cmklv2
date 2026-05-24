# ANALÝZA: Konkurenční SEO — automotive portály

**Datum:** 2026-05-24
**Autor:** Plánovač
**Status:** DRAFT — čeká na schválení leada
**DŮLEŽITÉ:** Pouze kompetitivní výzkum (čtení veřejně dostupných informací), žádný scraping dat!

---

## EXECUTIVE SUMMARY

Český automotive market má **překvapivě slabou SEO implementaci** u většiny hráčů. Sauto.cz, AAA Auto i Bazoš postrádají základní structured data. Jedinou výjimkou je TipCars s Organization + WebSite schema. Mezinárodní hráči (AutoScout24) jsou o krok napřed s BreadcrumbList a Car schema. Carmakler má **výrazně lepší SEO infrastrukturu** než všichni čeští konkurenti — 20+ JSON-LD generátorů, programatické LP, AI-ready obsah. Hlavní příležitost: **vyplnit mezery, které konkurence ignoruje** (Vehicle rich snippets, LocalBusiness, AggregateOffer).

---

## 1. ANALÝZA JEDNOTLIVÝCH KONKURENTŮ

### 1.1 Sauto.cz (Seznam.cz)

**Profil:** Největší český autobazar, součást Seznam.cz ekosystému

| Oblast | Implementace | Hodnocení |
|--------|-------------|-----------|
| **URL struktura** | `/inzerce/osobni/{manufacturer}/{model}` — sémantická, hierarchická | ✅ Dobrá |
| **Meta title/desc** | Přítomné, ale generované z templatu | ⚠️ Průměr |
| **Schema.org** | ❌ Nenalezeno — žádné JSON-LD | ❌ Špatné |
| **OG metadata** | ❌ Nenalezeno | ❌ Špatné |
| **Canonical** | ❌ Nenalezeno | ❌ Problém |
| **Sitemap** | ❌ XML sitemap nenalezen (dle externích auditu) | ❌ Kritické |
| **Breadcrumbs** | Implikované z URL hierarchie, bez schema | ⚠️ Částečné |
| **Interní linking** | 40+ links ve footer, 150+ značek v filtru | ✅ Dobrá |
| **Faceted navigation** | API-driven filtering, filter params v query string | ✅ Moderní |
| **GEO/AI SEO** | ❌ Žádné AI-specific optimalizace | ❌ Chybí |

**Silné stránky:** Regionální filtrování (české kraje), article integrace, 300+ filtrovatelných atributů.
**Slabiny:** Kompletně chybí structured data, OG tagy, sitemap, canonical. Těží z domény Seznam.cz a přímého trafficu.

### 1.2 TipCars.com (dříve TipCars.cz)

**Profil:** Druhý největší český autobazar, 73 000+ inzerátů

| Oblast | Implementace | Hodnocení |
|--------|-------------|-----------|
| **URL struktura** | `/hledam/ojete-vozy`, `/magazin` — čisté, české | ✅ Dobrá |
| **Meta title/desc** | Přítomné | ✅ OK |
| **Schema.org** | ✅ WebSite + Organization (logo, sameAs: FB, LinkedIn, IG) | ✅ Základní |
| **OG metadata** | ❌ Nenalezeno | ⚠️ Chybí |
| **Canonical** | Nezjištěno | — |
| **Breadcrumbs** | ❌ Nenalezeno | ⚠️ Chybí |
| **Interní linking** | 50+ interních linků, hierarchické kategorie | ✅ Dobrá |
| **Multilingual** | `lang="cs"`, `.com` doména (redirect z .cz) | ✅ OK |
| **Analytics** | Dual Google Tag Manager | ✅ Pokročilé |
| **GEO/AI SEO** | ❌ Žádné | ❌ Chybí |

**Silné stránky:** Jako jediný český konkurent má alespoň základní Schema.org. Content marketing přes magazín.
**Slabiny:** Jen 2 schema typy (WebSite, Organization). Žádné Vehicle schema na detailech. Chybí OG tagy a breadcrumby.

### 1.3 AAA Auto (aaaauto.cz)

**Profil:** Největší síť autobazarů ve střední Evropě, 31 poboček

| Oblast | Implementace | Hodnocení |
|--------|-------------|-----------|
| **URL struktura** | `/ojete-vozy/`, `/vykup-aut-za-hotove/`, `/financovani/` | ✅ Dobrá |
| **Meta title/desc** | Title přítomný, description nezjištěno | ⚠️ Částečné |
| **Schema.org** | ❌ Žádné JSON-LD — ani Organization, ani LocalBusiness | ❌ Kritické |
| **OG metadata** | ❌ Nenalezeno | ❌ Špatné |
| **Canonical** | ❌ Nenalezeno — riziko duplicit across .cz/.sk/.pl/.hu | ❌ Kritické |
| **Breadcrumbs** | ❌ Žádné | ❌ Chybí |
| **Interní linking** | Rozsáhlé — kategorie, značky, služby | ✅ Dobrá |
| **FAQ** | Má FAQ sekci, ale BEZ FAQPage schema | ⚠️ Zmeškaná šance |
| **LocalBusiness** | 31 poboček bez structured data | ❌ Kritické |
| **Hreflang** | ❌ Chybí — ale má 4 jazykové verze (.cz, .sk, .pl, .hu) | ❌ Kritické |

**Silné stránky:** Silný brand, 31 fyzických poboček (potenciál pro LocalBusiness schema).
**Slabiny:** Nejhorší SEO technická implementace ze všech analyzovaných. Heavy JS rendering. Žádné structured data pro 31 poboček = obrovská promarněná příležitost.

### 1.4 Bazoš.cz

**Profil:** Největší český inzertní portál (generalist, ne jen auto)

| Oblast | Implementace | Hodnocení |
|--------|-------------|-----------|
| **URL struktura** | `search.php?hledat=...` — query params, nečistá | ❌ Špatné |
| **Meta title/desc** | Title "bazar - Bazos.cz" — extrémně generické | ❌ Špatné |
| **Schema.org** | ❌ Žádné | ❌ Špatné |
| **OG metadata** | ❌ Nenalezeno | ❌ Špatné |
| **Canonical** | ❌ Nenalezeno | ❌ Špatné |
| **Breadcrumbs** | ✅ Přítomné (vizuální), bez schema | ⚠️ Částečné |
| **Interní linking** | Kategoriové linky, paginace | ⚠️ Základní |
| **GEO/AI SEO** | ❌ Žádné | ❌ Chybí |

**Silné stránky:** Masivní traffic díky brand recognition a obsahu. Rychlý load (minimální JS).
**Slabiny:** Nejstarší web design, žádné moderní SEO techniky. Těží čistě z objemu a domény.

### 1.5 AutoScout24 (autoscout24.com)

**Profil:** Největší evropská online automotive marketplace

| Oblast | Implementace | Hodnocení |
|--------|-------------|-----------|
| **URL struktura** | `/lst/{make}/{model}` — čistá, hierarchická | ✅ Výborná |
| **Meta title/desc** | "Used Volkswagen Golf for sale - AutoScout24" — keyword-rich | ✅ Dobrá |
| **Schema.org** | ✅ BreadcrumbList + Car schema (make, model) | ✅ Pokročilé |
| **OG metadata** | Nezjištěno v excerpu | — |
| **Canonical** | Nezjištěno v excerpu | — |
| **Breadcrumbs** | ✅ 4-úrovňové (Home > Search > Make > Model) s JSON-LD | ✅ Výborné |
| **Interní linking** | Rozsáhlé — navigace, filtry, "most wanted" sekce | ✅ Výborná |
| **Hreflang** | Pravděpodobně ano (18+ zemí) — nebylo viditelné v excerpu | Očekáváno ✅ |
| **Pagination** | ❌ Chybí rel="next/prev" | ⚠️ Mezera |
| **GEO/AI SEO** | Omezeně | ⚠️ Průměr |

**Silné stránky:** Nejlepší structured data z analyzovaných (BreadcrumbList + Car). Čistá URL hierarchie. 20% nárůst Share of Voice po SEO redesignu (Semrush case study).
**Slabiny:** Stále chybí Product/Offer schema na vozidlech, AggregateRating, FAQPage.

### 1.6 Mobile.de

**Profil:** Největší německá automotive marketplace (eBay Group)

| Oblast | Implementace | Hodnocení |
|--------|-------------|-----------|
| **Přístup** | Blokováno (403) — agresivní anti-bot ochrana | — |

**Poznámka:** Mobile.de aktivně blokuje automatizované requesty. Z externích zdrojů známo, že používá podobný stack jako AutoScout24 s důrazem na německý trh.

---

## 2. SROVNÁVACÍ MATICE

### 2.1 Technické SEO

| Feature | Carmakler | Sauto | TipCars | AAA Auto | Bazoš | AutoScout24 |
|---------|-----------|-------|---------|----------|-------|-------------|
| Clean URLs | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Meta title | ✅ | ✅ | ✅ | ⚠️ | ❌ | ✅ |
| Meta description | ✅ | ⚠️ | ✅ | ❌ | ❌ | ✅ |
| Canonical | ✅ (50+) | ❌ | ❌ | ❌ | ❌ | — |
| XML Sitemap | ✅ | ❌ | — | — | — | ✅ |
| robots.txt | ✅ | ✅ | — | — | — | ✅ |
| Hreflang | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| ISR/SSR | ✅ | ❌ (SPA) | ⚠️ | ❌ | SSR | SSR |

### 2.2 Structured Data

| Schema type | Carmakler | Sauto | TipCars | AAA Auto | Bazoš | AutoScout24 |
|-------------|-----------|-------|---------|----------|-------|-------------|
| Organization | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| WebSite + SearchAction | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Vehicle | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (Car) |
| Product (parts) | ✅ | N/A | N/A | N/A | ❌ | N/A |
| BreadcrumbList | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| FAQPage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| LocalBusiness | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Person | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Article | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| HowTo | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| JobPosting | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AggregateOffer | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AutoPartsStore | ✅ | N/A | N/A | N/A | ❌ | N/A |
| AggregateRating | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Celkem typů** | **14+** | **0** | **2** | **0** | **0** | **2** |

### 2.3 OG / Social

| Feature | Carmakler | Sauto | TipCars | AAA Auto | Bazoš | AutoScout24 |
|---------|-----------|-------|---------|----------|-------|-------------|
| OG title+desc | ✅ | ❌ | ❌ | ❌ | ❌ | — |
| Dynamic OG images | ✅ (25) | ❌ | ❌ | ❌ | ❌ | — |
| Twitter cards | ✅ | ❌ | ❌ | ❌ | ❌ | — |

### 2.4 Content SEO

| Feature | Carmakler | Sauto | TipCars | AAA Auto | Bazoš | AutoScout24 |
|---------|-----------|-------|---------|----------|-------|-------------|
| Programatické LP | ✅ (100+) | ⚠️ | ❌ | ⚠️ | ❌ | ✅ |
| FAQ content | ✅ | ❌ | ❌ | ✅ (bez schema) | ❌ | ❌ |
| Blog/magazín | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| AI snippets | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cross-linking | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ | ✅ |

### 2.5 GEO / AI SEO

| Feature | Carmakler | Sauto | TipCars | AAA Auto | Bazoš | AutoScout24 |
|---------|-----------|-------|---------|----------|-------|-------------|
| AI crawler access | ✅ (explicit) | ❌ | ❌ | ❌ | ❌ | — |
| Speakable markup | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Entity SEO (about/mentions) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Geo meta tags | ✅ | ❌ | ❌ | ❌ | ❌ | — |
| Quick facts (AI-citable) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3. INDUSTRY BEST PRACTICES (2025-2026)

### 3.1 Vehicle Listings

Z výzkumu (Dealer Authority, Full Throttle SEO, Searcle AI):

| Best Practice | Carmakler | Industrie průměr |
|--------------|-----------|------------------|
| Vehicle schema na každém VDP | ✅ | < 40% dealerů |
| Product+Offer schema na dílech | ✅ | < 20% |
| Unikátní popis 150+ slov per listing | ⚠️ Částečně | Doporučeno |
| Make→Model→Year→Part hierarchy | ✅ | Best practice |
| Canonical na filtrovaných URL | ❌ | Kritické |
| Sitemap index pro velké datasety | ❌ | Doporučeno |
| Fitment-aware kategorie (rok+model→díl) | ✅ | Pokročilé |

### 3.2 Schema.org — co se nejvíc vyplatí (2026)

Dle výzkumu (Search Engine Land, SE Ranking):
- **65% stránek citovaných AI Mode** používá schema markup
- **71% stránek citovaných ChatGPT** používá schema markup
- Listings se schema jsou **30% pravděpodobnější** v rich snippets

**Top 5 schema typů pro automotive (2026):**
1. Vehicle/Car + Offer (VDP)
2. Product + Offer (parts)
3. LocalBusiness/AutoDealer (pobočky)
4. FAQPage (buying guides)
5. BreadcrumbList (navigace)

### 3.3 Parts E-commerce SEO

Z výzkumu (SCube Marketing, PDM Automotive):
- **Fitment hierarchy:** Make→Model→Year→Part Type→Product
- **Long-tail keywords:** "2015-2020 Subaru Outback roof rack" > "roof rack"
- **MPN/SKU v schema:** Pomáhá Google porozumět konkrétním dílům
- **Canonical na filtrech:** Prevence index bloat
- **Compatibility data:** VIN/fitment data zvyšují konverze i SEO

---

## 4. CARMAKLER vs KONKURENCE — SWOT

### Silné stránky (vs konkurence)

| Oblast | Carmakler výhoda | Konkurence |
|--------|-----------------|-----------|
| Structured data | 14+ schema typů | Max 2 (TipCars) |
| OG images | 25 dynamických | 0 u všech CZ konkurentů |
| Programatické LP | 100+ s unikátním obsahem | Sauto částečně |
| AI/GEO SEO | Speakable, aiSnippet, quickFacts | Nikdo |
| Cross-linking | Systematický (vehicle↔parts) | Ad-hoc |
| Canonical system | Centralizovaný helper | Nikdo |
| ISR/SSR | Next.js Server Components | Většina SPA |
| Content quality | FAQ, HowTo, AI-optimalizované | Generické |

### Slabé stránky (vs konkurence)

| Oblast | Carmakler slabina | Kdo je lepší |
|--------|-------------------|-------------|
| Domain authority | Nový doména | Sauto, Bazoš (dekády) |
| Traffic volume | Startup | Všichni |
| Content volume | Menší katalog | Sauto (100K+ inzerátů) |
| Sitemap scalability | Single file | AutoScout24 (sitemap index) |
| Filter URL handling | Bez noindex | AutoScout24 |
| Hreflang | Chybí | AutoScout24 |

### Příležitosti

| Příležitost | Popis | Priorita |
|-------------|-------|----------|
| **Vehicle rich snippets** | Konkurence nemá → první v CZ SERPech s cenou, rokem, km | P0 |
| **LocalBusiness pro STK/servisy** | AAA Auto má 31 poboček bez schema → Carmakler může vlastnit local SERP | P1 |
| **AI Overview citace** | Žádný CZ competitor nemá AI-ready obsah | P0 |
| **Parts Product rich results** | Bazoš a Sauto nemají schema → rich snippets pro díly | P1 |
| **FAQ rich results** | AAA Auto má FAQ bez schema → Carmakler má FAQPage | ✅ Již |
| **Blog + Article schema** | Content marketing s proper schema → topical authority | P1 |
| **Sitemap index** | Lepší crawl budget management než konkurence | P1 |

### Hrozby

| Hrozba | Popis | Mitigace |
|--------|-------|----------|
| Sauto implementuje schema | Seznam.cz zdroje → mohli by rychle | Udržovat náskok, rozšiřovat pokrytí |
| AAA Auto SEO redesign | Mají budget na kompletní přepis | Content quality > tech debt |
| Google mění rich results | Vehicle rich results deprecated 06/2025 | Diverzifikovat schema typy |
| AI search cannibalization | Méně kliků z SERP | AI-citable obsah → brand mentions |

---

## 5. KONKRÉTNÍ DOPORUČENÍ PRO CARMAKLER

### 5.1 Okamžité výhody (co dělat hned)

| # | Akce | Důvod | Soubor |
|---|------|-------|--------|
| 1 | **Sitemap index** | Jediny CZ competitor nemá problém — buďte první s čistým řešením | `app/sitemap.ts` → split |
| 2 | **Filter URL canonical** | AutoScout24 řeší, CZ nikdo — předběhněte | `middleware.ts` nebo page-level |
| 3 | **Vehicle rich snippets** | Máte Vehicle schema, ale Google deprecated Vehicle rich results 06/2025 → přejít na Product+Offer | `lib/seo.ts` |
| 4 | **AggregateOffer na brand LP** | Už máte generátor, jen rozšířit pokrytí | Brand LP pages |

### 5.2 Střednědobé (do 1 měsíce)

| # | Akce | Důvod |
|---|------|-------|
| 5 | **JSON-LD na všech list stránkách** | Rozšířit ze 41% → 80% pokrytí |
| 6 | **Blog cross-linking na brand LP** | Content → commercial page linkjuice |
| 7 | **STK město LP optimalizace** | Canonical + JSON-LD + sitemap inclusion |
| 8 | **MPN/SKU v parts Product schema** | Rozlišení od generických dílů |
| 9 | **AutoDealer schema na /bazar/{slug}** | Žádný CZ competitor nemá |

### 5.3 Dlouhodobé (1-3 měsíce)

| # | Akce | Důvod |
|---|------|-------|
| 10 | **Hreflang příprava** (pokud SK expanze) | Nikdo v CZ automotive nemá správně |
| 11 | **Video schema** na vozidlech (když přibude video obsah) | Rich media snippets |
| 12 | **Review snippet** na brokersích | Konkurence nemá |
| 13 | **Event schema** na speciální akce | Job fairs, meetupy |
| 14 | **SpeakableSpecification** audit | Ověřit CSS selektory |

---

## 6. ZÁVĚR

**Carmakler má 3-5letý technický SEO náskok** před českými konkurenty (Sauto, TipCars, AAA Auto, Bazoš) a je **na úrovni AutoScout24** v structured data implementaci, v některých oblastech (AI SEO, OG images, entity SEO) ho dokonce překonává.

**Hlavní výzva není technická, ale obsahová** — konkurenti mají řádově více obsahu (Sauto: 100K+ inzerátů, Bazoš: miliony inzerátů). Carmakler musí kompenzovat:
1. **Kvalitou nad kvantitou** — každý listing s unikátním popisem, schema, OG
2. **AI-ready obsahem** — jako jediný v CZ, citovatelný v AI Overviews
3. **Programatickými LP** — long-tail keywords kde velcí neinvestují
4. **Local SEO** — STK, servisy, bazary = local SERP dominance

**Klíčová metriky ke sledování:**
- Rich snippet visibility v Google SERP
- AI Overview mentions/citations
- Organic traffic na programatických LP
- Click-through rate z SERP (vs konkurence)

---

*Tato analýza slouží jako vstup pro Task #4 (SEO ekosystém + SEO centrum v admin panelu).*
