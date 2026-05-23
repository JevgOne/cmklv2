# SEO / GEO / AIEO Master Audit — CarMakléř platforma

**Task:** #35
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** Audit + Akční plán
**Závažnost:** HIGH — SEO je primární acquisition channel

---

## EXECUTIVE SUMMARY

CarMakléř má **nadprůměrně silnou SEO infrastrukturu** — dynamický sitemap (500+ URL), 16 typů JSON-LD, AI-optimalizované robots.txt, geo meta tagy, 19 OG image generátorů. Existují ale konkrétní mezery, které brání plnému potenciálu.

### Skóre dle kategorií:

| Oblast | Skóre | Komentář |
|--------|-------|----------|
| Technické SEO | **8/10** | Sitemap, robots, canonical, middleware — výborné |
| On-page SEO | **7/10** | Meta tagy dobré, ale JSON-LD jen na 7% stránek |
| GEO (lokální SEO) | **6/10** | Geo meta tagy ano, ale chybí Google Business Profile, NAP |
| AIEO (AI optimalizace) | **7/10** | AI crawlers povoleni, aiSnippets existují, chybí llms.txt |
| Content SEO | **6/10** | Landing pages existují, ale content gaps v blogu |
| Interní prolinkování | **7/10** | Vehicle↔Parts dobré, ale blog↔služby chybí |
| Competitive positioning | **5/10** | Sauto 5.7M visits vs CarMakléř — huge gap to close |

---

## 1. TECHNICKÉ SEO

### 1.1 Co funguje VÝBORNĚ:

**Sitemap** (`app/sitemap.ts`, 467 řádků) — ✅ EXCELENTNÍ
- Dynamický, generovaný z Prisma DB
- 44 statických URL + 348+ generovaných landing pages + dynamické entity
- Vozidla, díly, makléři, články, bazary, vrakoviště, hashtag landing pages
- Prioritizace: vehicles 0.8 daily, articles 0.7 weekly, profiles 0.6 weekly
- Graceful fallback při DB nedostupnosti

**Robots.txt** (`app/robots.ts`) — ✅ VÝBORNÉ + AIEO
- Správné disallow: `/api/`, `/admin/`, `/makler/`, `/partner/`, `/login` etc.
- **AI crawlers explicitně povoleni:** GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Applebot-Extended, CCBot, GoogleOther
- Sitemap reference: `https://carmakler.cz/sitemap.xml`

**Canonical URLs** (`lib/canonical.ts`) — ✅ DOBRÉ
- `pageCanonical()` helper → absolutní URL, strip query/hash, no trailing slash
- Používáno na 93 stránkách
- Bug #127 dokumentován a obejitý (root layout nemá canonical záměrně)

**Middleware SEO** (`middleware.ts`) — ✅ VÝBORNÉ
- 301 redirect pro české diakritiky (Škoda → skoda)
- Subdomain rewrite (inzerce/shop/marketplace)
- Bez redirect flicker (rewrite, ne redirect)

**OG Images** — ✅ KOMPLETNÍ
- 19 generátorů (Satori/next-og)
- Dynamické pro vozidla, makléře, články
- Outfit font, orange branding, 1200×630

### 1.2 Problémy k řešení:

#### P1 (CRITICAL): Canonical URL chybí na dynamických stránkách

| Stránka | Problém |
|---------|---------|
| `/dily/[slug]` | Chybí `alternates: pageCanonical()` |
| `/autoservisy/[slug]` | Chybí canonical |
| `/stk/[slug]` | Chybí canonical |
| `/profil/[slug]` | Chybí canonical |

**Dopad:** Duplicate content issues, ztráta link equity.
**Fix:** 4 soubory, přidat `pageCanonical()` — ~30 min práce.

#### P2 (HIGH): User account stránky nemají `noindex`

Tyto stránky jsou veřejně crawlovatelné ale nemají `robots: { index: false }`:
- `/shop/kosik`, `/shop/objednavka`, `/shop/moje-objednavky/*`
- `/dily/objednavka/*`, `/dily/kosik/*`
- `/moje-inzeraty/*`, `/muj-ucet/*`
- `/overeni-emailu/*`, `/reset-hesla/*`, `/notifikace/*`

**Dopad:** Google indexuje přihlašovací a košíkové stránky → crawl budget waste.
**Fix:** Přidat `robots: { index: false, follow: true }` do layoutů.

#### P3 (MEDIUM): Chybí www → non-www redirect

Pokud je `www.carmakler.cz` dostupný, chybí 301 redirect na `carmakler.cz`.
**Fix:** Přidat do middleware nebo DNS.

#### P4 (LOW): Chybí RSS/Atom feed

Žádný veřejný blog feed (`/blog/feed.xml`) ani vehicle feed.
**Fix:** `app/api/blog/feed/route.ts` — RSS 2.0 s posledními články.

---

## 2. ON-PAGE SEO

### 2.1 Metadata pokrytí:

| Metrika | Hodnota | Hodnocení |
|---------|---------|-----------|
| Stránky s title | ~95% | ✅ |
| Stránky s description | ~95% | ✅ |
| Stránky s OpenGraph | ~70% | ⚠️ |
| Stránky s canonical | 58% (93/160) | ⚠️ |
| Stránky s JSON-LD | 7% (11/160) | ❌ |
| Stránky s noindex | 1% (jen /hledat) | ❌ |

### 2.2 JSON-LD — existuje ale je NEVYUŽITÝ

**16 generátorových funkcí v `lib/seo.ts`** — výborný základ, ale jen 11 stránek je používá!

| Schema typ | Funkce | Použito na | Chybí na |
|-----------|--------|------------|----------|
| Organization | `generateOrganizationJsonLd()` | Homepage | — |
| WebSite + SearchAction | `generateWebSiteJsonLd()` | Homepage | — |
| Vehicle | `generateVehicleJsonLd()` | `/nabidka/[slug]` | — |
| Product (Part) | `generatePartProductJsonLd()` | — | `/dily/[slug]` ❌ |
| Article | `generateArticleJsonLd()` | — | `/blog/[slug]` ❌ |
| Service | `generateServiceJsonLd()` | — | `/sluzby/*` ❌ (importováno ale nepoužito!) |
| LocalBusiness | `generateLocalBusinessJsonLd()` | `/kontakt` | `/autoservisy`, `/stk` list ❌ |
| AggregateRating | `generateAggregateRatingJsonLd()` | — | `/recenze` ❌ |
| Person | `generatePersonJsonLd()` | `/profil/[slug]` | — |
| JobPosting | `generateJobPostingJsonLd()` | — | `/kariera` ❌ |
| HowTo | `generateHowToJsonLd()` | `/jak-prodat-auto` | — |
| FAQPage | `generateFaqJsonLd()` | Landing pages | — |
| Store | `generateStoreJsonLd()` | Vrakoviště | — |
| BreadcrumbList | `generateBreadcrumbJsonLd()` | 30+ stránek | — |

**Kritické chybějící JSON-LD:**

| Stránka | Chybějící schema | Priorita | Dopad |
|---------|-----------------|----------|-------|
| `/blog/[slug]` | Article | HIGH | Google News, rich snippets |
| `/sluzby/financovani` | Service | HIGH | Rich snippets "služby" |
| `/sluzby/proverka` | Service | HIGH | Rich snippets "služby" |
| `/sluzby/pojisteni` | Service | HIGH | Rich snippets "služby" |
| `/dily/[slug]` | Product | HIGH | Google Shopping, rich results |
| `/recenze` | AggregateRating + Review | MEDIUM | Star rating ve výsledcích |
| `/kariera` | JobPosting | MEDIUM | Google for Jobs |
| `/autoservisy` (list) | ItemList + LocalBusiness | MEDIUM | Local pack |
| `/stk` (list) | ItemList | MEDIUM | Local pack |

**Fix:** Většina funkcí UŽ EXISTUJE — stačí je zavolat v příslušných page.tsx. ~2-4h práce.

### 2.3 Stránky bez metadata (musí přidat nebo noindex):

**Public (přidat metadata):**
- `/blog/kategorie/[slug]` — blog category pages
- `/inzerce/katalog` — inzerce listing page
- `/marketplace/dealer/[id]`, `/marketplace/investor/[id]`

**Private (přidat noindex):**
- Viz P2 výše — všechny user account/checkout stránky

---

## 3. GEO SEO (Lokální SEO)

### 3.1 Co existuje:

**Geo meta tagy** (root layout) — ✅
```html
<meta name="geo.region" content="CZ">
<meta name="geo.placename" content="Praha, Česká republika">
<meta name="geo.position" content="50.0755;14.4378">
<meta name="ICBM" content="50.0755, 14.4378">
```

**Město landing pages** — ✅
- `/nabidka/praha`, `/nabidka/brno`, `/nabidka/ostrava` etc. (8 měst v sitemap)
- `/autoservisy` s city filtrem
- `/stk/mesto/[city]` — STK po městech

**LocalBusiness JSON-LD** — ✅ na `/kontakt`

### 3.2 Co CHYBÍ:

#### G1 (HIGH): Google Business Profile (GBP)

CarMakléř potřebuje aktivní Google Business Profile:
- Název: "CarMakléř s.r.o."
- Kategorie: "Car Dealer" + "Auto Broker"
- Adresa: Praha (sídlo)
- Hodiny: Kontaktní hodiny
- Fotky: Kancelář, tým, loga
- Recenze: Sbírat Google recenze

**Dopad:** Bez GBP se CarMakléř nezobrazuje v Google Maps a Local Pack.

#### G2 (MEDIUM): NAP konzistence

NAP (Name, Address, Phone) musí být **identické** na:
- Website (kontakt stránka)
- Google Business Profile
- Firmy.cz
- Mapy.cz
- Social media profily

**Aktuální stav:** Ověřit konzistenci — `lib/seo.ts` má adresu v `generateOrganizationJsonLd()`.

#### G3 (MEDIUM): Schema pro lokální pobočky

Pokud CarMakléř má pobočky/makléře v různých městech:
- Každý makléř = `Person` schema s `workLocation`
- Město stránky (`/nabidka/praha`) = `WebPage` s `about: { "@type": "City", "name": "Praha" }`

#### G4 (LOW): Lokální citace

Registrace na českých adresářích:
- Firmy.cz
- Zivefirmy.cz
- Najisto.centrum.cz
- Firmy.abc.cz
- Heureka.cz (pro eshop)

---

## 4. AIEO (AI Engine Optimization)

### 4.1 Co existuje (VÝBORNÝ základ):

**robots.txt AI crawlers** — ✅
- GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Applebot-Extended — explicitně Allow

**AI snippets v seo-data.ts** — ✅
```typescript
// Každá brand/landing page má:
aiSnippet: "2-3 sentence direct answer for AI featured snippets"
quickFacts: ["CarMakléř nabízí 150+ ojetých Škod...", "Cena od 80 000 Kč"]
```

**Speakable CSS selectors** — ✅
```json
"speakableCssSelectors": ["[data-speakable]"]
```

**WebPage schema s `about` + `mentions`** — ✅
- Strukturované entity references pro AI systémy

### 4.2 Co CHYBÍ / ZLEPŠIT:

#### A1 (MEDIUM): llms.txt

**Stav 2026:** llms.txt má minimální adopci u AI search (GPTBot, PerplexityBot ho ignorují). ALE je používán agentickými nástroji (Cursor, Claude Code, Copilot).

**Doporučení:** Vytvořit `/public/llms.txt` — low effort, potenciální benefit:

```markdown
# CarMakléř

> CarMakléř je česká platforma pro prodej a nákup ojetých vozidel přes síť certifikovaných makléřů. Provozuje 4 produkty: makléřskou síť, inzertní platformu, eshop autodílů a investiční marketplace.

## Hlavní stránky
- [Nabídka vozidel](/nabidka): Katalog ojetých vozidel s filtry
- [Autodíly](/dily): E-shop s novými a použitými díly
- [Makléři](/makleri): Adresář certifikovaných makléřů
- [Autoservisy](/autoservisy): Adresář autoservisů s recenzemi
- [STK stanice](/stk): Adresář STK stanic s cenami
- [Blog](/blog): Články o autech, údržbě, financování

## Služby
- [Prověrka vozidla](/sluzby/proverka): Kompletní kontrola historie vozu
- [Financování](/sluzby/financovani): Kalkulačka financování auta
- [Pojištění](/sluzby/pojisteni): Srovnání pojištění s kalkulačkou

## API
- [Sitemap](/sitemap.xml): Kompletní mapa stránek
```

#### A2 (HIGH): FAQ schema na klíčových stránkách

FAQ schema (`generateFaqJsonLd()`) existuje ale je jen na vehicle landing pages. Přidat na:
- `/sluzby/financovani` — "Kolik stojí financování?", "Jaký je úrok?"
- `/sluzby/pojisteni` — "Kolik stojí povinné ručení?", "Jak sjednat online?"
- `/stk` — "Kolik stojí STK?", "Jak často na STK?"
- `/autoservisy` — "Jak vybrat autoservis?"

**Dopad:** FAQ schema = Google Featured Snippets + People Also Ask + AI citations.

#### A3 (MEDIUM): `data-speakable` atributy v komponentách

JSON-LD deklaruje `speakableCssSelectors: ["[data-speakable]"]` ale **není ověřeno, zda komponenty skutečně mají `data-speakable` atribut**.

**Fix:** Přidat `data-speakable` na klíčové content bloky:
- Nadpisy stránek (`<h1 data-speakable>`)
- Popisky služeb
- FAQ odpovědi
- Ceníkové informace

#### A4 (LOW): Structured citations pro AI

Přidat `citation` / `isBasedOn` do Article schema pro blog články — AI systémy upřednostňují obsah s citacemi.

---

## 5. CONTENT SEO

### 5.1 Landing pages — ✅ SILNÉ

**Existující landing pages (v sitemap):**
- 16 brandů × top modely = ~192 URL (`/nabidka/skoda`, `/nabidka/skoda/octavia`)
- 7 body types (`/nabidka/sedan`, `/nabidka/suv`)
- 5 cenových rozsahů (`/nabidka/do-100000`)
- 8 měst (`/nabidka/praha`)
- 11 kategorií dílů + 8 brandů + 24 model combos + 72 year combos

**Každá landing page má:**
- Unikátní SEO text (description)
- FAQ items → FAQPage schema
- AI snippet + quick facts
- Breadcrumbs
- Cross-links (vehicle ↔ parts)

### 5.2 Content gaps:

#### C1 (HIGH): Blog content strategy

Blog existuje (`/blog`) ale potřebuje cílenou keyword strategii:

**Target keywords s vysokým objemem (česky):**

| Keyword | Est. volume/měs | Priorita | Typ článku |
|---------|----------------|----------|------------|
| "kolik stojí STK" | 1 300 | HIGH | Guide + kalkulátor |
| "STK cena" | 1 600 | HIGH | Ceníková stránka (existuje) |
| "jak prodat auto" | 2 400 | HIGH | Existuje ✅ |
| "povinné ručení kalkulačka" | 3 200 | HIGH | Existuje (PojisteniCalc) |
| "ojetý auto kontrola" | 1 100 | HIGH | `/sluzby/proverka` |
| "financování auta" | 1 800 | MEDIUM | Existuje (FinancovaniCalc) |
| "auto na splátky" | 2 100 | MEDIUM | Blog article |
| "jak vybrat ojeté auto" | 1 500 | MEDIUM | Blog article |
| "servisní kniha auto" | 800 | MEDIUM | Blog article |
| "přepis auta postup" | 1 200 | MEDIUM | Blog article |
| "technický průkaz" | 900 | LOW | Blog article |
| "ekologická daň auto" | 700 | LOW | Blog article |

#### C2 (MEDIUM): Služby stránky — thin content

`/sluzby/financovani`, `/sluzby/pojisteni`, `/sluzby/proverka` mají ServicePage layout (hero, steps, benefits, FAQ, CTA) ale mohou být "thin" z pohledu Google.

**Doporučení:** Přidat delší SEO text (500+ slov) pod kalkulačku/CTA — odpovědi na FAQ inline, case studies, statistiky.

#### C3 (LOW): Autoservisy/STK city pages

`/autoservisy/mesto/[city]` a `/stk/mesto/[city]` existují ale nemají unikátní SEO text per město.

**Doporučení:** Přidat město-specifický text: "Nejlepší autoservisy v Praze — 23 ověřených servisů..."

---

## 6. INTERNÍ PROLINKOVÁNÍ

### 6.1 Co funguje:

| Cross-link | Stav | Implementace |
|-----------|------|--------------|
| Vehicle → Parts | ✅ | `RecommendedParts` + `seo-crosslinks.ts` |
| Parts → Vehicle | ✅ | `seo-crosslinks.ts` |
| Vehicle → Services | ✅ | "Doplňkové služby" sekce na detailu |
| Vehicle → Broker | ✅ | BrokerBox na detailu |
| Vehicle → Similar | ✅ | "Podobná vozidla" multi-tier matching |
| Platform ↔ Platform | ✅ | PlatformSwitcher v navbar + footer |
| Breadcrumbs | ✅ | 30+ stránek |

### 6.2 Chybějící cross-links:

| Odkud | Kam | Priorita | Popis |
|-------|-----|----------|-------|
| Blog články | Služby, Vozidla | HIGH | Kontextové CTA v článcích |
| Autoservisy | Vozidla | MEDIUM | "Hledáte auto? Podívejte se na nabídku" |
| STK | Vozidla | MEDIUM | "Po STK hledáte nové auto?" |
| Homepage | Autoservisy, STK | MEDIUM | Přidat do services sekce |
| Footer | Autoservisy, STK, Blog | MEDIUM | Chybí v hlavním footeru |
| Služby | Blog články | LOW | "Přečtěte si více o financování" |

---

## 7. COMPETITIVE ANALYSIS

### 7.1 Traffic srovnání (březen 2026):

| Platforma | Visits/měs | Pozice |
|-----------|-----------|--------|
| **Sauto.cz** | 5 700 000 | #1 |
| **AAA Auto** | 1 300 000 | #2 |
| **TipCars.com** | 868 000 | #3 |
| **Auto.Bazos.cz** | ~2 000 000 | #2-3 |
| **CarMakléř** | ? (nový) | — |

### 7.2 SEO vzory konkurence:

**Sauto.cz (Seznam):**
- Massive domain authority (Seznam vlastní)
- Tisíce landing pages per brand/model/city
- Integrace se Seznam Mapy (lokální SEO)
- Vehicle structured data (Schema.org/Vehicle)

**AAA Auto:**
- Silný brand (offline + online)
- Google Business Profile pro každou pobočku
- Vehicle schema + AggregateOffer
- Blog s SEO obsahem

**TipCars.com:**
- 400 000 inzerátů (březen 2026)
- Cenová strategie: snížili ceny pro soukromé prodejce o 75%
- Silné backlinky (Vltava Labe Media network)

### 7.3 CarMakléř competitive advantages:

1. **4-in-1 platforma** — žádný konkurent nemá vozidla + díly + servisy + marketplace
2. **AI optimalizace** — aiSnippets, AI crawler whitelisting (konkurence tohle nemá)
3. **Makléřský model** — unikátní UVP (unique value proposition)
4. **JSON-LD coverage** — 16 schema typů (víc než většina konkurentů)
5. **Cross-linking** — vehicle ↔ parts ↔ services (ekosystém)

### 7.4 Kde CarMakléř zaostává:

1. **Domain authority** — nový web vs established domains
2. **Content volume** — potřebuje 50+ blog článků pro keyword coverage
3. **Backlinks** — potřebuje link building strategii
4. **Google Business Profile** — chybí (viz G1)
5. **Objem inzerátů** — TipCars má 400K, CarMakléř má stovky

---

## 8. PRIORITIZOVANÝ AKČNÍ PLÁN

### Fáze 1 — Quick Wins (1-2 dny, HIGH impact):

| # | Akce | Soubory | Effort | Impact |
|---|------|---------|--------|--------|
| 1 | Přidat canonical na 4 dynamické stránky | 4× page.tsx | 30 min | HIGH |
| 2 | Přidat JSON-LD na `/blog/[slug]` (Article) | 1× page.tsx | 30 min | HIGH |
| 3 | Aktivovat Service schema na `/sluzby/*` | 3× page.tsx | 30 min | HIGH |
| 4 | Přidat Product schema na `/dily/[slug]` | 1× page.tsx | 30 min | HIGH |
| 5 | Přidat noindex na checkout/account stránky | 5+ layoutů | 1h | MEDIUM |
| 6 | Přidat FAQ schema na STK, autoservisy, služby | 4× page.tsx | 1h | HIGH |

### Fáze 2 — Medium Effort (1 týden):

| # | Akce | Soubory | Effort | Impact |
|---|------|---------|--------|--------|
| 7 | Vytvořit `/public/llms.txt` | 1 soubor | 30 min | LOW-MEDIUM |
| 8 | Přidat AggregateRating schema na `/recenze` | 1× page.tsx | 30 min | MEDIUM |
| 9 | Přidat JobPosting schema na `/kariera` | 1× page.tsx | 30 min | MEDIUM |
| 10 | Přidat `data-speakable` atributy | 10+ komponent | 2h | MEDIUM |
| 11 | Vytvořit RSS feed pro blog | 1 API route | 1h | LOW |
| 12 | Přidat metadata na stránky bez metadata | 5+ stránek | 2h | MEDIUM |
| 13 | Přidat footer linky (autoservisy, STK) | Footer.tsx | 30 min | MEDIUM |

### Fáze 3 — Strategic (2-4 týdny):

| # | Akce | Effort | Impact |
|---|------|--------|--------|
| 14 | Google Business Profile setup | 2h (manuální) | HIGH |
| 15 | NAP konzistence audit + opravy | 2h | MEDIUM |
| 16 | Content strategy: 10 blog článků na top keywords | 20h | HIGH |
| 17 | Blog → služby cross-linking | 2h | MEDIUM |
| 18 | Autoservisy/STK city page SEO texty | 4h | MEDIUM |
| 19 | www → non-www redirect | 30 min | LOW |
| 20 | Lokální citace (Firmy.cz, Mapy.cz) | 3h (manuální) | MEDIUM |

### Fáze 4 — Long-term (ongoing):

| # | Akce | Effort | Impact |
|---|------|--------|--------|
| 21 | Link building strategy | Ongoing | HIGH |
| 22 | Blog content pipeline (2 články/týden) | Ongoing | HIGH |
| 23 | Core Web Vitals monitoring | Setup 1h | MEDIUM |
| 24 | Competitive keyword monitoring | Setup 1h | MEDIUM |
| 25 | Google Search Console monitoring | Setup 30 min | HIGH |

---

## 9. Seznam souborů pro Fázi 1:

| Soubor | Typ | Akce |
|--------|-----|------|
| `app/(web)/dily/[slug]/page.tsx` | EDIT | +`alternates: pageCanonical()` |
| `app/(web)/autoservisy/[slug]/page.tsx` | EDIT | +`alternates: pageCanonical()` |
| `app/(web)/stk/[slug]/page.tsx` | EDIT | +`alternates: pageCanonical()` |
| `app/(web)/profil/[slug]/page.tsx` | EDIT | +`alternates: pageCanonical()` |
| `app/(web)/blog/[slug]/page.tsx` | EDIT | +Article JSON-LD |
| `app/(web)/sluzby/financovani/page.tsx` | EDIT | Aktivovat Service JSON-LD |
| `app/(web)/sluzby/proverka/page.tsx` | EDIT | Aktivovat Service JSON-LD |
| `app/(web)/sluzby/pojisteni/page.tsx` | EDIT | Aktivovat Service JSON-LD |
| `app/(web)/dily/[slug]/page.tsx` | EDIT | +Product JSON-LD |
| `app/(web)/stk/page.tsx` | EDIT | +FAQ JSON-LD |
| `app/(web)/autoservisy/page.tsx` | EDIT | +FAQ JSON-LD |
| `app/(web)/recenze/page.tsx` | EDIT | +AggregateRating JSON-LD |
| `public/llms.txt` | NEW | AI optimization file |

---

## 10. STOP pravidla

- **STOP-1:** NESMÍ se měnit existující sitemap.ts logika — jen přidávat nové entity.
- **STOP-2:** NESMÍ se přidávat canonical na stránky které mají být noindex (checkout, account).
- **STOP-3:** NESMÍ se kopírovat competitive data ze Sauto/TipCars — jen SEO vzory (viz memory: žádný scraping konkurence).
- **STOP-4:** JSON-LD musí být validní — testovat přes Google Rich Results Test před deployem.
- **STOP-5:** `llms.txt` nesmí obsahovat citlivé URL (/api, /admin, /makler).
- **STOP-6:** FAQ schema musí mít reálné otázky a odpovědi, ne generovaný spam — Google penalizuje fake FAQ.
- **STOP-7:** Google Business Profile setup je MANUÁLNÍ krok — nelze automatizovat.

---

## 11. Acceptance Criteria

### Fáze 1:
- [ ] Všechny dynamické detail stránky mají canonical URL
- [ ] `/blog/[slug]` má Article JSON-LD
- [ ] `/sluzby/*` mají Service JSON-LD
- [ ] `/dily/[slug]` má Product JSON-LD
- [ ] Checkout/account stránky mají noindex
- [ ] FAQ schema na STK, autoservisy, služby stránkách
- [ ] Google Rich Results Test validuje všechna JSON-LD
- [ ] `npm run build` projde

### Fáze 2:
- [ ] `/public/llms.txt` existuje a je validní
- [ ] AggregateRating na `/recenze`
- [ ] JobPosting na `/kariera`
- [ ] Blog RSS feed funguje
- [ ] Footer obsahuje linky na autoservisy, STK

### Fáze 3:
- [ ] Google Business Profile aktivní a ověřený
- [ ] NAP konzistentní na všech platformách
- [ ] 10+ nových blog článků na target keywords
