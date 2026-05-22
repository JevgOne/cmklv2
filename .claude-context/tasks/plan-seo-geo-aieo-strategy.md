# SEO + GEO + AIEO Strategie — Carmakler

**Datum auditu:** 2026-04-29
**Autor:** Marketolog (SEO/GEO/AIEO specialista)
**Status:** PLÁN K IMPLEMENTACI

---

## 1. AUDIT SOUČASNÉHO STAVU

### 1.1 Co funguje dobře (silné stránky)

| Oblast | Stav | Detaily |
|--------|------|---------|
| Root metadata | ✅ OK | `metadataBase`, title template `%s \| CarMakléř`, keywords, OG, Twitter cards |
| Canonical URLs | ✅ OK | Systém `pageCanonical()` v `lib/canonical.ts`, fix bugu #127 |
| Sitemap | ✅ Výborný | 200+ URL: statické + dynamické (vehicles, brokers, tags, partners, bazars, listings, blog, SEO landing pages) |
| Robots.txt | ✅ OK | Správně blokuje interní sekce (`/admin/`, `/makler/`, `/partner/`, `/api/`) |
| JSON-LD coverage | ✅ Dobrý základ | 51 souborů s JSON-LD: Organization, Vehicle, Article, Blog, FAQPage, ItemList, BreadcrumbList, Product, Service, HowTo, WebPage, Person, JobPosting, Store atd. |
| OG images | ✅ Základ | Dynamické OG pro: homepage, vehicle detail (s fotkou auta), profil makléře |
| SEO landing pages | ✅ Výborný | 16 značek, 12 modelů, 7 karoserií, 5 cenových rozsahů, 8 měst, 11 kategorií dílů, 8 značek dílů, ~24 modelů dílů, ~72 rok+model stránek |
| GEO: Brand pages | ✅ Základ | `aiSnippet`, `quickFacts`, `avgPriceRange` v `lib/seo-data.ts` |
| lib/seo.ts | ✅ Výborný | 20+ JSON-LD generátorů připravených k použití |
| Breadcrumbs UI | ✅ Přítomné | Komponenta `<Breadcrumbs>` na většině stránek |
| Internal linking | ✅ Základ | Cross-linking sekce na nabídka, makléři, o-nás |
| `lang="cs"` | ✅ OK | Správně nastaveno v root layout |
| Font optimization | ✅ OK | Outfit s `display: "swap"`, latin-ext subset |

### 1.2 Kritické mezery (ČERVENÉ)

| # | Problém | Priorita | Stránky |
|---|---------|----------|---------|
| C1 | **llms.txt neexistuje** — AI crawlers nemají structured info o webu | P0 | `/public/llms.txt` |
| C2 | **robots.txt nepovoluje AI crawlers explicitně** — chybí GPTBot, CCBot, ClaudeBot, PerplexityBot | P0 | `app/robots.ts` |
| C3 | **`/recenze` — ZERO metadata** — žádný title, description, canonical, OG, JSON-LD | P1 | `app/(web)/recenze/page.tsx` |
| C4 | **`/kariera` — "use client", žádné metadata** — SSR metadata nemožné, SEO=0 | P1 | `app/(web)/kariera/page.tsx` |
| C5 | **WebSite JSON-LD s SearchAction chybí na homepage** — generátor existuje v `lib/seo.ts` ale není použit | P1 | `app/(web)/page.tsx` |
| C6 | **BreadcrumbList JSON-LD jen na 1 stránce** — vehicle detail, na zbytku chybí | P1 | Sitewide |
| C7 | **Product JSON-LD na /dily/[slug] a /shop/produkt/[slug]** — ZCELA chybí | P1 | Part detail pages |

### 1.3 Střední mezery (ORANŽOVÉ)

| # | Problém | Priorita | Stránky |
|---|---------|----------|---------|
| M1 | OG images chybí pro: blog, dily, marketplace, inzerce, makleri, shop | P2 | 6+ route segmentů |
| M2 | `/dily` landing — žádný JSON-LD (ani Organization, ani ItemList) | P2 | `app/(web)/dily/page.tsx` |
| M3 | `/cenik` — žádný structured data | P2 | `app/(web)/cenik/page.tsx` |
| M4 | `/sluzby` — žádný Service JSON-LD | P2 | `app/(web)/sluzby/page.tsx` |
| M5 | `/kontakt` — chybí LocalBusiness JSON-LD | P2 | `app/(web)/kontakt/page.tsx` |
| M6 | Chybí hreflang tag `cs-CZ` | P2 | Root layout |
| M7 | Missing canonical na `/shop/produkt/[slug]` a `/dily/[slug]` | P2 | Detail pages |
| M8 | Blog articles nemají dedikované OG images (spoléhají na coverImage) | P2 | `app/(web)/blog/[slug]/` |
| M9 | Homepage hero image je z Unsplash — nelze optimalizovat alt text SEO | P3 | Homepage |

### 1.4 GEO/AIEO mezery (FIALOVÉ)

| # | Problém | Priorita |
|---|---------|----------|
| G1 | Žádný `llms.txt` — AI bots nemají metadata o platformě | P0 |
| G2 | Content nemá answer-first strukturu (kromě brand pages) | P2 |
| G3 | Chybí FAQ sekce na klíčových konverzních stránkách (homepage, cenik, chci-prodat) | P2 |
| G4 | Blog nemá Topic Clusters strategii | P3 |
| G5 | Chybí Author schema s profileLink na blog article JSON-LD | P2 |
| G6 | Entity consistency — "CarMakléř" vs "Carmakler" vs "CarMakler" v JSON-LD | P2 |
| G7 | Missing SpeakableSpecification na klíčových landing pages | P3 |
| G8 | Missing `sameAs` na homepage Organization JSON-LD (sociální sítě) | P2 |

---

## 2. IMPLEMENTAČNÍ PLÁN

### FÁZE 1: AIEO Foundation (P0) — Estimace: 2-3h

#### 1.1 Vytvořit `public/llms.txt`

**Soubor:** `public/llms.txt`

```
# Carmakler — Automobilová platforma
> Carmakler je česká automobilová platforma se 4 produkty: makléřská síť pro prodej aut, inzertní platforma, eshop autodílů z vrakovišť a investiční marketplace pro flipping aut.

## Klíčové produkty

### Makléřská síť
Síť certifikovaných automakléřů po celé ČR. Makléř zajistí fotky, inzerci, prohlídky i smlouvu. Provize 5% z prodejní ceny, minimum 25 000 Kč.
- URL: https://carmakler.cz/chci-prodat
- Makléři: https://carmakler.cz/makleri
- Nabídka vozidel: https://carmakler.cz/nabidka

### Inzertní platforma
Inzerce aut zdarma pro soukromé prodejce, autobazary a dealery.
- URL: https://carmakler.cz/inzerce
- Katalog: https://carmakler.cz/inzerce/katalog

### Eshop autodílů
Použité originální díly z vrakovišť + aftermarket díly. Záruka 6 měsíců.
- URL: https://carmakler.cz/dily
- Katalog: https://carmakler.cz/dily/katalog

### Marketplace (Investiční platforma)
Uzavřená platforma pro flipping aut. Ověření realizátoři + investoři.
- URL: https://carmakler.cz/marketplace

## Služby
- Prověrka vozidla: https://carmakler.cz/sluzby/proverka
- Financování: https://carmakler.cz/sluzby/financovani
- Pojištění: https://carmakler.cz/sluzby/pojisteni

## Firemní údaje
- Název: CAR makléř, s.r.o.
- IČO: 21957151
- Sídlo: Školská 660/3, 110 00 Praha
- Web: https://carmakler.cz
- Email: info@carmakler.cz
- Telefon: +420 733 179 199

## Blog
Automobilový magazín s radami pro nákup a prodej aut: https://carmakler.cz/blog

## Pro developery
- Tech: Next.js 15, TypeScript, PostgreSQL
- API: /api/ (interní, není veřejné)
```

#### 1.2 Aktualizovat robots.txt — povolit AI crawlers

**Soubor:** `app/robots.ts`

Přidat explicitní pravidla pro AI crawlery:

```typescript
rules: [
  {
    userAgent: "*",
    allow: "/",
    disallow: ["/api/", "/admin/", "/makler/", ...],
  },
  // AI crawlers — explicitně povolené
  {
    userAgent: "GPTBot",
    allow: "/",
    disallow: ["/api/", "/admin/", "/makler/", "/partner/", "/parts/", "/muj-ucet/"],
  },
  {
    userAgent: "ChatGPT-User",
    allow: "/",
    disallow: ["/api/", "/admin/", "/makler/", "/partner/", "/parts/", "/muj-ucet/"],
  },
  {
    userAgent: "CCBot",
    allow: "/",
  },
  {
    userAgent: "ClaudeBot",
    allow: "/",
  },
  {
    userAgent: "PerplexityBot",
    allow: "/",
  },
  {
    userAgent: "Applebot-Extended",
    allow: "/",
  },
  {
    userAgent: "GoogleOther",
    allow: "/",
  },
],
```

---

### FÁZE 2: Kritické SEO fixy (P1) — Estimace: 4-5h

#### 2.1 Fix `/recenze` — přidat kompletní SEO

**Soubor:** `app/(web)/recenze/page.tsx`

- Exportovat `metadata: Metadata` s title, description, OG, canonical
- Přidat AggregateRating JSON-LD (generátor už existuje v `lib/seo.ts`)
- Přidat Review JSON-LD pro featured recenze

```typescript
export const metadata: Metadata = {
  title: "Recenze klientů — hodnocení služeb CarMakléř",
  description: "Přečtěte si recenze klientů, kteří prodali nebo koupili auto přes CarMakléř. Průměrné hodnocení X.X z 5.",
  openGraph: { title: "Recenze | CarMakléř", description: "..." },
  alternates: pageCanonical("/recenze"),
};
```

JSON-LD: `generateAggregateRatingJsonLd()` s reálnými daty z DB.

#### 2.2 Fix `/kariera` — extrahovat metadata do Server Component

**Soubor:** `app/(web)/kariera/page.tsx`

Problém: Celá stránka je `"use client"` → nemůže exportovat metadata.

Řešení:
1. Přesunout metadata do `app/(web)/kariera/layout.tsx` (nový soubor)
2. NEBO refaktorovat stránku na Server Component wrapper + Client Component children

```typescript
// app/(web)/kariera/layout.tsx (nový)
export const metadata: Metadata = {
  title: "Kariéra — staňte se automakléřem",
  description: "Flexibilní úvazek, výdělek bez stropu. Průměrný makléř vydělá 40–80 000 Kč měsíčně. Školení zdarma, bez předchozích zkušeností.",
  openGraph: { ... },
  alternates: pageCanonical("/kariera"),
};
```

#### 2.3 Přidat WebSite JSON-LD na homepage

**Soubor:** `app/(web)/page.tsx`

Generátor `generateWebSiteJsonLd()` již existuje v `lib/seo.ts` — obsahuje SearchAction.
Přidat druhý `<script type="application/ld+json">` vedle existujícího Organization.

Navíc doplnit do Organization JSON-LD:
- `sameAs` s odkazy na Facebook, Instagram, YouTube (z `companyInfo.social`)

#### 2.4 BreadcrumbList JSON-LD — sitewide

**Přístup:** Vytvořit komponentu `BreadcrumbJsonLd` která generuje JSON-LD z `Breadcrumbs` props.

**Soubor:** `components/web/BreadcrumbJsonLd.tsx` (nový)

Použití: Přidat na VŠECHNY stránky, které mají `<Breadcrumbs>` komponentu:
- `/o-nas`, `/blog`, `/blog/[slug]`, `/makleri`, `/makleri/[slug]`, `/marketplace`, `/sluzby`, `/kontakt`, `/inzerce`, `/dily`, `/dily/[slug]`, `/cenik`, `/recenze`, `/kariera`

Alternativa: Integrovat JSON-LD přímo do existující `<Breadcrumbs>` komponenty.

#### 2.5 Product JSON-LD na part detail pages

**Soubory:**
- `app/(web)/dily/[slug]/page.tsx`
- `app/(web)/shop/produkt/[slug]/page.tsx`

Generátor `generatePartProductJsonLd()` existuje v `lib/seo.ts`.
Přidat `<script type="application/ld+json">` s Product schema včetně:
- name, description, image, sku, brand, price, condition, availability

Doplnit i `pageCanonical()` pro obě stránky.

---

### FÁZE 3: OG Images (P2) — Estimace: 4-6h

Vytvořit dynamické `opengraph-image.tsx` pro route segmenty kde chybí:

#### 3.1 Blog OG Image — `app/(web)/blog/[slug]/opengraph-image.tsx`

Design: Gradient background + title článku + autor + kategorie badge + CarMakléř logo
Data: Načíst article.title, article.category, article.author z Prisma

#### 3.2 Blog index OG Image — `app/(web)/blog/opengraph-image.tsx`

Statický design: "Blog & Magazín — rady, tipy a analýzy"

#### 3.3 Díly OG Image — `app/(web)/dily/opengraph-image.tsx`

Statický design: "Autodíly levněji, s zárukou — CarMakléř"

#### 3.4 Marketplace OG Image — `app/(web)/marketplace/opengraph-image.tsx`

Statický design: "Investiční platforma pro flipping aut — 15-25% ROI"

#### 3.5 Inzerce OG Image — `app/(web)/inzerce/opengraph-image.tsx`

Statický design: "Inzerce aut zdarma — CarMakléř"

#### 3.6 Makléři OG Image — `app/(web)/makleri/opengraph-image.tsx`

Statický design: "Ověření automakléři po celé ČR"

#### 3.7 Shop OG Image — `app/(web)/shop/opengraph-image.tsx`

Statický design: "Eshop autodílů — originální i aftermarket"

Všechny OG images používají sdílený `OgLayout` z `lib/og-image.ts` (konzistentní brand).

---

### FÁZE 4: Structured Data doplnění (P2) — Estimace: 3-4h

#### 4.1 `/dily` landing — ItemList + Organization JSON-LD

Přidat ItemList pro featured produkty + Organization pro eshop.

#### 4.2 `/cenik` — Service + Offer JSON-LD

```json
{
  "@type": "Service",
  "name": "Prodej auta přes makléře",
  "offers": {
    "@type": "Offer",
    "price": "5",
    "priceCurrency": "CZK",
    "description": "Provize 5% z prodejní ceny, minimum 25 000 Kč"
  }
}
```

#### 4.3 `/sluzby` — Service JSON-LD pro každou službu

Generátor `generateServiceJsonLd()` existuje — použít pro financování, pojištění, prověrku.

#### 4.4 `/kontakt` — LocalBusiness JSON-LD

Generátor `generateLocalBusinessJsonLd()` existuje. Použít s `companyInfo` daty.

#### 4.5 Fix entity consistency v JSON-LD

Sjednotit název organizace na **"CarMakléř"** (s háčkem) ve všech JSON-LD:
- Homepage: `companyInfo.name` = "CarMakler" → OK pro strojové zpracování
- Ale `name` v JSON-LD by měl být konzistentní: "CarMakléř" všude
- Aktuálně mix: "CarMakler", "Carmakler", "CarMakléř"

Pravidlo: JSON-LD `name` = "CarMakléř", URL/slug = "carmakler"

#### 4.6 Doplnit `sameAs` na homepage Organization

Přidat sociální sítě z `companyInfo.social`:
```json
"sameAs": [
  "https://facebook.com/carmakler",
  "https://instagram.com/carmakler",
  "https://youtube.com/@carmakler"
]
```

---

### FÁZE 5: GEO Optimalizace (P2-P3) — Estimace: 6-8h

#### 5.1 Answer-First Content Structure

Princip: Na KAŽDÉ klíčové stránce by měl být **první odstavec přímá odpověď** na otázku, kterou si uživatel klade.

Stránky k úpravě:
- `/chci-prodat` → "Prodej auta přes CarMakléř trvá průměrně 20 dní. Makléř zajistí fotky, inzerci, prohlídky i smlouvu. Platíte jen 5% provizi z úspěšného prodeje."
- `/cenik` → "Prodej auta přes CarMakléř stojí 5% z prodejní ceny, minimum 25 000 Kč. Žádné skryté poplatky. Neprodá se? Neplatíte nic."
- `/jak-to-funguje` → "Stačí 3 kroky: kontaktujte makléře, makléř zajistí vše od fotek po přepis, vy inkasujete."

#### 5.2 FAQ sekce na klíčových stránkách

Přidat FAQ sekce (s FAQPage JSON-LD) na:

**`/cenik`:**
- Kolik stojí prodej auta přes makléře?
- Musím platit předem?
- Co když se auto neprodá?
- Jsou v provizi zahrnuty i fotky a inzerce?

**`/chci-prodat`:**
- Jak dlouho trvá prodej auta přes makléře?
- Kolik za prodej zaplatím?
- Musím dělat prohlídky sám?
- Jak probíhá přepis vozidla?

**Homepage:**
- Co je CarMakléř?
- Kolik stojí prodej auta přes makléře?
- Jak rychle se auto prodá?

**`/dily`:**
- Jaká je záruka na použité díly?
- Jak dlouho trvá doručení?
- Jak najdu díl pro svůj vůz?

#### 5.3 Evidence-Dense Writing Guidelines

Pro blog články a content pages — guidelines pro copywritery:

1. **Konkrétní čísla**: "Průměrně 20 dní" místo "rychle"
2. **Zdroje dat**: "Podle našich dat za rok 2025..."
3. **Srovnání**: "O 30% rychleji než průměr inzertních portálů"
4. **Aktuálnost**: Rok v textu — "v roce 2026"
5. **Ranges**: "180 000 – 550 000 Kč" místo "od 180 tisíc"

#### 5.4 Topic Clusters pro blog

Navrhnout 5 topic clusters:

**Cluster 1: Prodej auta**
- Pillar: "Kompletní průvodce prodejem auta v roce 2026"
- Články: Jak nafotit auto pro inzerci, Jak stanovit cenu, Co dělat před prodejem, Přepis auta krok za krokem, Prodej auta přes makléře vs. autobazar

**Cluster 2: Nákup ojetého auta**
- Pillar: "Jak koupit ojeté auto bezpečně"
- Články: Na co si dát pozor, Prověrka historie vozidla, Stočený tachometr — jak poznat, Zkušební jízda checklist

**Cluster 3: Financování**
- Pillar: "Financování auta — úvěr, leasing nebo hotovost?"
- Články: Porovnání úvěrů, Leasing vs. úvěr, Kalkulačka splátek, Refinancování auta

**Cluster 4: Autodíly**
- Pillar: "Originální vs. aftermarket díly — co se vyplatí?"
- Články: Jak najít díl podle VIN, Díly z vrakovišť, Výměna brzd svépomocí

**Cluster 5: Investice do aut**
- Pillar: "Flipping aut — jak investovat do ojetin"
- Články: Nejlepší auta pro flipping, ROI kalkulačka, Jak začít s investicí do aut

---

### FÁZE 6: AIEO Optimalizace (P2-P3) — Estimace: 4-5h

#### 6.1 Author Schema na blog články

**Soubor:** `app/(web)/blog/[slug]/page.tsx`

Aktuální Article JSON-LD má `author: { "@type": "Person", name: "..." }`.
Doplnit:
```json
"author": {
  "@type": "Person",
  "name": "Jan Novák",
  "url": "https://carmakler.cz/profil/jan-novak",
  "jobTitle": "Automakléř",
  "worksFor": {
    "@type": "Organization",
    "name": "CarMakléř"
  }
}
```

#### 6.2 Conversational Content Structure

Na blog článcích přidat:
- **TL;DR** na začátek (shrnutí ve 2-3 větách)
- **"Odpověď na otázku"** sekce — formátovat jako Q&A
- **Key takeaways** box na konci

#### 6.3 Entity Consistency Audit

Sjednotit napříč celým webem:
- Brand name: **CarMakléř** (v textech), **Carmakler** (v URL/kódu)
- Legal name: **CAR makléř, s.r.o.**
- Produkty: "makléřská síť", "inzertní platforma", "eshop autodílů", "marketplace"
- Osoba: vždy `firstName lastName` + `jobTitle` + `worksFor`

#### 6.4 SpeakableSpecification na klíčových stránkách

Přidat do WebPage JSON-LD:
```json
"speakable": {
  "@type": "SpeakableSpecification",
  "cssSelector": ["h1", ".hero-description", ".answer-first"]
}
```

Stránky: homepage, chci-prodat, cenik, jak-to-funguje

---

### FÁZE 7: Technické SEO (P2-P3) — Estimace: 3-4h

#### 7.1 Hreflang tag

**Soubor:** `app/layout.tsx`

Přidat do metadata:
```typescript
alternates: {
  languages: {
    "cs-CZ": "https://carmakler.cz",
  },
},
```

Poznámka: Aktuálně web je jen v češtině, ale hreflang je best practice pro Google.

#### 7.2 Internal Linking Strategy

Aktuální stav: Cross-linking existuje na nabídka, makléři, o-nás.

Doplnit na:
- **Blog články** → automatický "Související služby" box (link na /chci-prodat, /sluzby/proverka atd. podle kategorie článku)
- **Díly detail** → link na související vozy v nabídce
- **Vehicle detail** → link na související blog články (podle značky/modelu)
- **Homepage** → blog preview sekce (top 3 články)

#### 7.3 Image Alt Text Audit

Priority:
- Homepage hero: nahradit Unsplash obrázek brand obrázkem s optimalizovaným alt textem
- Vehicle cards: alt = `{brand} {model} {year} — {price} Kč`
- Blog cover images: alt = article.title (už je implementováno ✅)
- Broker cards: alt = `{firstName} {lastName} — automakléř {city}`

#### 7.4 Core Web Vitals

Aktuální stav:
- Font Outfit s `display: "swap"` ✅
- Next/Image pro obrázky ✅ (blog, profily)
- ISR/revalidate na většině stránek ✅
- Dynamic imports pro heavy components (PriceHistory) ✅

Doporučení:
- Přidat `loading="lazy"` na below-fold obrázky
- Přidat `priority` na LCP obrázky (hero, first vehicle card)
- Verifikovat CWV přes PageSpeed Insights po deployi

---

## 3. PRIORITIZACE A ROADMAP

### Sprint 1 — "AIEO Foundation + Critical Fixes" (P0+P1)

| # | Úkol | Soubory | Effort |
|---|------|---------|--------|
| S1.1 | Vytvořit `public/llms.txt` | 1 nový soubor | 30min |
| S1.2 | Robots.txt — AI crawlers | `app/robots.ts` | 15min |
| S1.3 | Fix `/recenze` metadata + JSON-LD | `app/(web)/recenze/page.tsx` | 45min |
| S1.4 | Fix `/kariera` metadata (layout extraction) | `app/(web)/kariera/layout.tsx` (nový) | 30min |
| S1.5 | WebSite JSON-LD na homepage | `app/(web)/page.tsx` | 15min |
| S1.6 | Homepage Organization — doplnit `sameAs` | `app/(web)/page.tsx` | 10min |
| S1.7 | Product JSON-LD na part detail pages | 2 soubory | 45min |
| S1.8 | Canonical na part detail pages | 2 soubory | 15min |
| **Total Sprint 1** | | **~7 souborů** | **~3.5h** |

### Sprint 2 — "Structured Data + OG Images" (P2)

| # | Úkol | Soubory | Effort |
|---|------|---------|--------|
| S2.1 | BreadcrumbJsonLd komponenta + integrace | 1 nový + 14 úprav | 2h |
| S2.2 | OG images pro 7 route segmentů | 7 nových souborů | 3h |
| S2.3 | JSON-LD na /dily, /cenik, /sluzby, /kontakt | 4 úprav | 1.5h |
| S2.4 | Entity consistency fix v JSON-LD | ~10 souborů | 1h |
| S2.5 | Hreflang tag | `app/layout.tsx` | 10min |
| **Total Sprint 2** | | **~25 souborů** | **~7.5h** |

### Sprint 3 — "GEO + AIEO Content" (P2-P3)

| # | Úkol | Soubory | Effort |
|---|------|---------|--------|
| S3.1 | FAQ sekce na cenik, chci-prodat, homepage, dily | 4 úprav | 3h |
| S3.2 | Answer-first rewrite na klíčových stránkách | 3 úprav | 2h |
| S3.3 | Author schema rozšíření na blog | 1 úprav | 30min |
| S3.4 | SpeakableSpecification na 4 stránkách | 4 úprav | 30min |
| S3.5 | Internal linking rozšíření | 3-4 úprav | 2h |
| S3.6 | Topic clusters plán pro blog content team | Dokument | 1h |
| **Total Sprint 3** | | **~15 souborů** | **~9h** |

---

## 4. MĚŘENÍ ÚSPĚŠNOSTI

### KPIs po implementaci

| Metrika | Baseline (odhadovaný) | Cíl za 3 měsíce |
|---------|----------------------|-------------------|
| Indexované stránky v Google | ? (ověřit v GSC) | +30% |
| Rich results v Google | Vehicles only | + FAQ, Product, Review, Job |
| AI citace (ChatGPT, Perplexity) | 0 | Měřitelné mentions |
| Organic traffic | Baseline po 1. měsíci | +20% MoM |
| Click-through rate z SERP | ? | +15% díky rich snippets |
| Core Web Vitals | ? (ověřit) | All green |

### Nástroje pro měření

- **Google Search Console** — indexace, CTR, pozice, rich results
- **Google Analytics / Vercel Analytics** — traffic, bounce rate, konverze
- **Schema Markup Validator** — validace JSON-LD po deployi
- **PageSpeed Insights** — CWV skóre
- **Ahrefs/Semrush** — keyword tracking (volitelné)

---

## 5. TECHNICKÉ POZNÁMKY

### Existující infrastruktura (znovupoužít)

| Soubor | Co obsahuje | Kde použít |
|--------|-------------|------------|
| `lib/seo.ts` | 20+ JSON-LD generátorů | Většina úkolů Fáze 2-4 |
| `lib/canonical.ts` | `pageCanonical()` helper | Všechny stránky bez canonical |
| `lib/company-info.ts` | Centrální firemní data | JSON-LD Organization, LocalBusiness |
| `lib/seo-data.ts` | Brand/model/city data + `aiSnippet` | GEO optimalizace |
| `lib/og-image.ts` | `OgLayout` + helpers | Nové OG images |
| `components/web/Breadcrumbs.tsx` | UI breadcrumbs | Základ pro BreadcrumbJsonLd |

### Pravidla implementace

1. **JSON-LD vždy v Server Component** — ne v "use client"
2. **Používat existující generátory** z `lib/seo.ts` — nepsat duplicitní kód
3. **Canonical na KAŽDÉ indexované stránce** — přes `pageCanonical()`
4. **Metadata NEMŮŽE být v "use client"** — použít layout.tsx pro client pages
5. **OG images** — používat sdílený `OgLayout` pro brand konzistenci
6. **Testovat JSON-LD** přes Schema.org Validator po každém deployi

---

## 6. SHRNUTÍ

### Co Carmakler dělá dobře:
- Výborný sitemap s 200+ URL
- Solidní základ JSON-LD na klíčových stránkách
- SEO landing pages pro značky, modely, města, ceny, díly
- Canonical URL systém, který řeší deduplifikaci
- GEO-ready data (aiSnippet, quickFacts) na brand pages

### Co urgentně chybí:
1. **llms.txt** — nulová AIEO viditelnost
2. **AI crawlers v robots.txt** — potenciálně blokované
3. **2 stránky bez jakéhokoliv SEO** (/recenze, /kariera)
4. **Product JSON-LD na eshop detail stránkách** — ztracené rich results
5. **BreadcrumbList JSON-LD** — jen na 1 z 50+ stránek

### Celkový effort: ~20 hodin práce ve 3 sprintech
### Očekávaný impact: +20-30% organic traffic za 3 měsíce, rich results pro Products, FAQ, Reviews, Jobs
