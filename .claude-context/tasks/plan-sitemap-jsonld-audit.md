# Audit — Sitemap & JSON-LD Structured Data

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Status:** ČEKÁ NA SCHVÁLENÍ LEADEM

---

## 1. Sitemap (`app/sitemap.ts`) — Analýza kompletnosti

### Co JE v sitemap (20 statických + ~168 dynamických/SEO)

**Statické stránky (20):**
homepage, /nabidka, /chci-prodat, /makleri, /inzerce, /shop, /sluzby/proverka, /sluzby/financovani, /sluzby/pojisteni, /recenze, /o-nas, /kariera, /blog, /kontakt, /jak-prodat-auto, /kolik-stoji-moje-auto, /obchodni-podminky, /ochrana-osobnich-udaju, /reklamacni-rad, /zasady-cookies

**SEO landing pages (~128):**
- 16 značek (`/nabidka/{brand}`)
- 12 modelů (`/nabidka/{brand}/{model}`)
- 7 karoserií (`/nabidka/{bodyType}`)
- 5 cenových rozsahů (`/nabidka/do-{price}`)
- 8 měst (`/nabidka/{city}`)
- 11 kategorií dílů (`/dily/kategorie/{slug}`)
- 8 značek dílů (`/dily/znacka/{brand}`)
- ~24 značka+model dílů (`/dily/znacka/{brand}/{model}`)
- ~72 značka+model+rok dílů (`/dily/znacka/{brand}/{model}/{rok}`)

**Dynamické (z DB):**
- Vozidla (`/nabidka/{slug}`) — ACTIVE
- Makléři (`/profil/{slug}`) — ACTIVE BROKER
- Tagy (`/makleri/{slug}`) — tags s >=2 brokery
- Vrakoviště (`/dily/vrakoviste/{slug}`) — AKTIVNI_PARTNER
- Blog články (`/blog/{slug}`) — PUBLISHED

### CHYBÍ v sitemap (14 stránek/skupin)

| # | Stránka | Priorita | Důvod přidání |
|---|---------|----------|---------------|
| 1 | `/jak-to-funguje` | **VYSOKÁ** | Informační SEO stránka, existuje, má JSON-LD, chybí v sitemap! |
| 2 | `/marketplace` | **VYSOKÁ** | Landing page marketplace produktu, veřejná |
| 3 | `/marketplace/apply` | STŘEDNÍ | Veřejný formulář pro přihlášení dealerů/investorů |
| 4 | `/inzerce/katalog` | **VYSOKÁ** | Katalog inzerátů — klíčová veřejná stránka |
| 5 | `/shop/katalog` | **VYSOKÁ** | Katalog eshop produktů |
| 6 | `/dily/katalog` | **VYSOKÁ** | Katalog dílů — duplicitní ke shop/katalog? Ověřit |
| 7 | `/nabidka/porovnani` | NÍZKÁ | Porovnání vozidel — utility stránka |
| 8 | `/shop/vraceni-zbozi` | STŘEDNÍ | Právní stránka (má JSON-LD, chybí v sitemap) |
| 9 | `/shop/reklamace` | STŘEDNÍ | Právní stránka (má JSON-LD, chybí v sitemap) |
| 10 | `/bazar/[slug]` | **VYSOKÁ** | Dynamické — inzeráty z bazaru (pokud veřejné) |
| 11 | `/makler/[slug]` | STŘEDNÍ | Veřejné profily makléřů (pokud odlišné od /profil/) |
| 12 | `/dodavatel/[slug]` | STŘEDNÍ | Veřejné profily dodavatelů dílů |
| 13 | `/h/[slug]` | STŘEDNÍ | Hashtag landing pages (podobné jako /makleri/tag) |
| 14 | `/tag/[slug]` | STŘEDNÍ | Tag landing pages |

### Stránky SPRÁVNĚ mimo sitemap (auth-only)
- `/muj-ucet/*` — vyžaduje přihlášení
- `/prihlaseni`, `/login`, `/registrace/*` — auth flow
- `/zapomenute-heslo`, `/reset-hesla/*`, `/overeni-emailu/*` — auth flow
- `/moje-inzeraty/*` — vyžaduje přihlášení
- `/notifikace/*` — ephemeral
- `/marketplace/dealer/*`, `/marketplace/investor/*` — dashboardy za auth
- `/inzerce/pridat`, `/inzerce/registrace` — behind auth
- `/nabidka/[slug]/platba/*` — platební flow
- `/shop/moje-objednavky/*`, `/dily/moje-objednavky/*` — auth
- `/shop/kosik`, `/dily/kosik` — ephemeral cart
- `/shop/objednavka/*`, `/dily/objednavka/*` — checkout flow

---

## 2. JSON-LD (`lib/seo.ts`) — Existující generátory

### 17 generátorů v lib/seo.ts:

| # | Funkce | Schema.org typ | Použito na |
|---|--------|----------------|------------|
| 1 | `generateBreadcrumbJsonLd` | BreadcrumbList | Breadcrumbs.tsx, PartsBreadcrumbs.tsx |
| 2 | `generateFaqJsonLd` | FAQPage | jak-prodat-auto, kolik-stoji-moje-auto, chci-prodat |
| 3 | `generateItemListJsonLd` | ItemList | nabidka/page.tsx |
| 4 | `generatePartsItemListJsonLd` | ItemList (parts) | dily/kategorie/[slug] |
| 5 | `generateFaqPageJsonLd` | FAQPage (alias) | jak-to-funguje |
| 6 | `generateVehicleJsonLd` | Vehicle + Offer | nabidka/[slug] |
| 7 | `generateServiceJsonLd` | Service | **NEPOUŽITO na žádné stránce!** |
| 8 | `generateArticleJsonLd` | Article | blog/[slug] |
| 9 | `generateHowToJsonLd` | HowTo | jak-prodat-auto, kolik-stoji-moje-auto |
| 10 | `generateWebApplicationJsonLd` | WebApplication | ? |
| 11 | `generateWebPageJsonLd` | WebPage | o-nas, kontakt, obchodni-podminky, ochrana-osobnich-udaju, reklamacni-rad, shop/vraceni-zbozi, shop/reklamace |
| 12 | `generateBrandItemListJsonLd` | ItemList (brand) | VehicleLandingPage.tsx (20 SEO landing pages) |
| 13 | `generateAggregateOfferJsonLd` | Product + AggregateOffer | VehicleLandingPage.tsx |
| 14 | `generateOrganizationJsonLd` | Organization | homepage (page.tsx) |
| 15 | `generateWebSiteJsonLd` | WebSite + SearchAction | homepage (page.tsx) |
| 16 | `generatePartProductJsonLd` | Product (part) | dily/znacka/* stránky |
| 17 | `generateStoreJsonLd` | AutoPartsStore | dily/vrakoviste/[slug] |

---

## 3. Stránky BEZ JSON-LD (které by měly mít)

### Vysoká priorita (SEO dopad)

| # | Stránka | Chybějící JSON-LD typ | Generátor |
|---|---------|----------------------|-----------|
| 1 | `/sluzby/proverka` | **Service** | `generateServiceJsonLd` EXISTUJE, jen není napojený! |
| 2 | `/sluzby/financovani` | **Service** | `generateServiceJsonLd` EXISTUJE |
| 3 | `/sluzby/pojisteni` | **Service** | `generateServiceJsonLd` EXISTUJE |
| 4 | `/kariera` | **JobPosting** | Nový generátor potřeba |
| 5 | `/recenze` (page.tsx) | **AggregateRating** | Nový generátor potřeba (layout má jen WebPage) |
| 6 | `/inzerce` | **WebPage** + CollectionPage | `generateWebPageJsonLd` existuje |
| 7 | `/inzerce/katalog` | **ItemList** | `generateItemListJsonLd` adaptovat |
| 8 | `/shop` (page.tsx) | **WebPage** + Store | `generateStoreJsonLd` adaptovat |
| 9 | `/shop/katalog` | **ItemList** (products) | `generatePartsItemListJsonLd` adaptovat |
| 10 | `/dily/katalog` | **ItemList** (parts) | `generatePartsItemListJsonLd` adaptovat |

### Střední priorita

| # | Stránka | Chybějící JSON-LD typ | Poznámka |
|---|---------|----------------------|----------|
| 11 | `/marketplace` | WebPage | Už má JSON-LD ✓ — OK |
| 12 | `/bazar/[slug]` | Vehicle + Offer | Reuse `generateVehicleJsonLd` |
| 13 | `/makler/[slug]` | Person / ProfilePage | Nový generátor |
| 14 | `/dodavatel/[slug]` | LocalBusiness | Nový generátor |
| 15 | `/h/[slug]` | ItemList | Reuse `generateItemListJsonLd` |
| 16 | `/tag/[slug]` | ItemList | Reuse `generateItemListJsonLd` |
| 17 | `/blog` (page.tsx) | CollectionPage + ItemList | Blog listing page |
| 18 | `/makleri` (hlavní page) | Ověřit — je v sitemap ale nemá JSON-LD? | Potřeba zkontrolovat |

### Nízká priorita

| # | Stránka | Poznámka |
|---|---------|----------|
| 19 | `/nabidka/porovnani` | Utility stránka, JSON-LD optional |
| 20 | `/marketplace/apply` | Formulář, JSON-LD optional |
| 21 | `/zasady-cookies` | Právní, WebPage by stačilo |

---

## 4. Chybějící JSON-LD typy (nové generátory)

| # | Schema.org typ | Použití | Priorita |
|---|---------------|---------|----------|
| 1 | **LocalBusiness / AutomotiveBusiness** | /kontakt (rozšíření), /dodavatel/[slug] | **VYSOKÁ** — Google Business Profile propojení |
| 2 | **AggregateRating** | /recenze — celkové hodnocení Carmakler | **VYSOKÁ** — hvězdičky v SERP |
| 3 | **Review** | /recenze — jednotlivé recenze | **VYSOKÁ** — rich snippets |
| 4 | **JobPosting** | /kariera — pracovní nabídky | STŘEDNÍ — Google for Jobs |
| 5 | **Person / ProfilePage** | /profil/[slug], /makler/[slug] | STŘEDNÍ — knowledge panel |
| 6 | **CollectionPage** | katalogové stránky (inzerce, shop, dily) | NÍZKÁ — semantic correctness |
| 7 | **VideoObject** | pokud budou video obsah (onboarding, blog) | NÍZKÁ — zatím nemáme videa |

---

## 5. Implementační plán

### FÁZE 1: Quick wins — napojit existující generátory (~30 min)

**3 soubory k úpravě:**

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `app/(web)/sluzby/proverka/page.tsx` | Přidat `<script type="application/ld+json">` s `generateServiceJsonLd` |
| 2 | `app/(web)/sluzby/financovani/page.tsx` | Přidat `generateServiceJsonLd` |
| 3 | `app/(web)/sluzby/pojisteni/page.tsx` | Přidat `generateServiceJsonLd` |

### FÁZE 2: Sitemap doplnění (~30 min)

**1 soubor k úpravě:**

| Soubor | Změna |
|--------|-------|
| `app/sitemap.ts` | Přidat: jak-to-funguje, marketplace, inzerce/katalog, shop/katalog, dily/katalog, shop/vraceni-zbozi, shop/reklamace + dynamické: bazar/[slug], dodavatel/[slug], h/[slug], tag/[slug] |

### FÁZE 3: Nové generátory + napojení (~2h)

**lib/seo.ts — přidat 4 nové generátory:**

| # | Generátor | Typ | Pro stránky |
|---|-----------|-----|-------------|
| 1 | `generateLocalBusinessJsonLd` | LocalBusiness | /kontakt, /dodavatel/[slug] |
| 2 | `generateAggregateRatingJsonLd` | AggregateRating + Review[] | /recenze |
| 3 | `generateJobPostingJsonLd` | JobPosting | /kariera |
| 4 | `generatePersonJsonLd` | Person | /profil/[slug], /makler/[slug] |

**Stránky k úpravě (napojení):**

| # | Soubor | JSON-LD |
|---|--------|---------|
| 1 | `app/(web)/kariera/page.tsx` | JobPosting |
| 2 | `app/(web)/recenze/page.tsx` | AggregateRating |
| 3 | `app/(web)/inzerce/page.tsx` | WebPage |
| 4 | `app/(web)/inzerce/katalog/page.tsx` | ItemList |
| 5 | `app/(web)/shop/page.tsx` | WebPage + Store |
| 6 | `app/(web)/shop/katalog/page.tsx` | ItemList |
| 7 | `app/(web)/dily/katalog/page.tsx` | ItemList |
| 8 | `app/(web)/dodavatel/[slug]/page.tsx` | LocalBusiness |
| 9 | `app/(web)/makler/[slug]/page.tsx` | Person |
| 10 | `app/(web)/zasady-cookies/page.tsx` | WebPage |

### FÁZE 4: Pokročilé (volitelné)

- `/bazar/[slug]` — Vehicle JSON-LD (reuse)
- `/h/[slug]`, `/tag/[slug]` — ItemList
- `/blog/page.tsx` — CollectionPage + ItemList článků
- VideoObject generátor (až budou videa)

---

## 6. STOP kritéria

1. Sitemap obsahuje **všechny veřejné stránky** (min. +10 nových URL)
2. `/sluzby/*` stránky mají Service JSON-LD
3. `/kariera` má JobPosting JSON-LD
4. `/recenze` má AggregateRating JSON-LD
5. `/inzerce`, `/shop`, `/dily/katalog` mají WebPage/ItemList JSON-LD
6. `lib/seo.ts` má min. 4 nové generátory (LocalBusiness, AggregateRating, JobPosting, Person)
7. `npm run build` projde bez chyb
8. Žádné stránky v sitemap, které vyžadují auth

---

## 7. Souhrnná čísla

| Metrika | Aktuální stav | Po implementaci |
|---------|--------------|-----------------|
| Stránky v sitemap (statické) | 20 | **31** (+11) |
| Dynamické skupiny v sitemap | 5 | **9** (+4: bazar, dodavatel, h, tag) |
| Stránky s JSON-LD | 24 + 20 via component = **44** | **~58** (+14) |
| JSON-LD generátory v lib/seo.ts | 17 | **21** (+4) |
| Nepoužité generátory | 1 (generateServiceJsonLd) | **0** |

---

## 8. Rizika

| Riziko | Pravděpodobnost | Mitigace |
|--------|----------------|----------|
| `/bazar/[slug]` může být alias pro `/nabidka/[slug]` | Střední | Ověřit zda jde o odlišný model dat |
| `/makler/[slug]` vs `/profil/[slug]` duplikace | Střední | Ověřit zda jsou odlišné routes, canonicalizovat |
| AggregateRating bez reálných dat | Jistá | Použít data z DB (reviews tabulka), nebo placeholder s poznámkou |
| JobPosting bez reálných pracovních nabídek | Vysoká | Generovat jen když existují aktivní pozice v DB |
| Velký sitemap (100+ dynamických dílů URL) | Nízká | Sitemap index split pokud >50k URL |

---

*Plán připraven: 2026-04-26*  
*Čeká na schválení team leadem*
