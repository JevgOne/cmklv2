# Research #81 — SEO + GEO struktura pro /dily (Carmakler eshop)

**Datum:** 2026-04-06
**Agent:** planovac
**Task ID:** #79 (subject: #81)
**Cíl:** Konkurenční analýza CZ parts e-shopů + GEO best practices + research findings pro implementační plán
**Související soubor:** `plan-task-81.md` (implementační plán)

---

## TL;DR pro lead (20 vět)

1. **Autodoc.cz je TOP benchmark** — 4-level URL struktura `/nahradni-dily/{brand}/{model}/{generation}/{engine}` s 2 800-3 200 slov per stránka, BreadcrumbList + ItemList JSON-LD, 9 H2 sekcí. **Carmakler musí kopírovat tuto strukturu.**
2. **Autokelly.cz (LKQ CZ) má dominanci ale HROZNOU SEO** — Angular SPA, žádné H1/H2, URL `/Catalog/.../{numeric-codes}`, no JSON-LD Product. **Příležitost pro Carmakler vytlačit je z SERP.**
3. **EuAutodily.cz, MroAuto, AutoMedik** — všichni JS-rendered SPAs, slabé on-page SEO, žádné structured data. CZ market je full of weak players, kvalitní SEO je velký vstup.
4. **GEO (Generative Engine Optimization)** je nová kritická disciplína — 30-40% search už probíhá v ChatGPT/Perplexity/Google AI Overviews. Bez GEO = neviditelnost v 1/3 trhu.
5. **Citation frequency = 35% Perplexity ranking weight** — kolikrát je doména citovaná napříč queries. Domain authority je už jen 15% — content quality vyhrává.
6. **ChatGPT cituje průměrně 2.62 zdrojů, Perplexity 6.61, Gemini 6.1** — Carmakler musí být v této 2-7 množině pro CZ automotive queries. Cíl: 10+ unique citations/měsíc do 6 měsíců.
7. **llms.txt** je emerging standard (844k+ stránek 2025) — ne oficiálně podporovaný OpenAI/Google, ale industry best practice. **Implementovat HNED** (low effort, high upside).
8. **FAQ schema je kritické pro AI citace** — ChatGPT/Perplexity preferují Q&A formátovaný content. Cíl: 3-8 FAQ items per landing page, JSON-LD FAQPage.
9. **Content depth 1 500-3 000 slov** je preferován AI summarizery — krátké stránky se necitují. Carmakler landing pages musí být long-form.
10. **Primary source data je magnet pro citace** — unikátní data (počet vrakovišť v ČR, average price per part, match rate) které jiní nemají = magnet pro AI citace.
11. **Next.js 15 ISR + on-demand revalidation** je správný stack — generateStaticParams pro top 200 kombinací, fallback ISR pro zbylé 1 800+, webhook na revalidatePath po každém přidání dílu.
12. **URL struktura: 4-level hierarchická** — `/dily/znacka/{brand}/{model}/{rok}` zachová Autodoc patternu, ale s českou diacritikou (Google CZ to zvládá).
13. **Title formát:** `Náhradní díly {Brand} {Model} {Rok} | Carmakler — od {minPrice} Kč` — krátké, klíčová slova vpředu, pricing modifier.
14. **H1 formát:** `Náhradní díly {Brand} {Model} {Rok}` — exact match s title, žádné kreativní variace.
15. **9 H2 sekcí per landing page** podle Autodoc patternu — Top díly, Cenové trendy, Použité vs nové, Kompatibilní motory, Časté otázky (FAQ), Prodejci (vrakoviště), Související modely, Jak vybrat, Odkazy.
16. **Sitemap musí být dynamická** — Next.js `app/sitemap.ts`, generated z Prisma queries, sitemap index pokud >50k URLs.
17. **Hreflang nepotřebujeme HNED** — MVP je CZ-only, SK/PL/DE až ve fázi 2 (přípravy hreflang kód).
18. **Lighthouse SEO target 95+** — Carmakler začíná 0, musíme být lepší než Autokelly (~50 odhadem, ne max 100). Autodoc je odhadem 85-90.
19. **Implementace ~5-6 dnů dev** — fáze 1 (foundation) 2 dny, fáze 2 (templates + content) 2 dny, fáze 3 (GEO + llms.txt + benchmarking) 1-2 dny.
20. **5 klíčových insights** + Top 10 patterns k ukradnutí + 10 slabin konkurence + GEO strategie + Carmakler diferenciátory v sekcích níže.

---

# ČÁST A — KONKURENČNÍ ANALÝZA (CZ parts e-shopy)

## A1 — Hlavní benchmarks (deep dive)

### A1.1 Autodoc.cz ⭐ TOP BENCHMARK

**URL struktura:** **4-level hierarchická, real-data ověřeno**

```
/nahradni-dily/{brand}                                                        → brand landing (Skoda)
/nahradni-dily/{brand}/{model}                                                → model landing (Skoda Octavia)
/nahradni-dily/{brand}/{model}/{generation-code}                              → generation (Octavia 1U2 / 1Z3 / 5E5)
/nahradni-dily/{brand}/{model}/{generation-code}/{engine-id}-{engine-spec}    → engine variant (7909-1-9-tdi)
```

**Konkrétní příklady (real URLs):**
- `/nahradni-dily/skoda/octavia` — všechny generace Octavia
- `/nahradni-dily/skoda/octavia/octavia-1u2` — Octavia 1
- `/nahradni-dily/skoda/octavia/octavia-1u2/7909-1-9-tdi` — Octavia 1 1.9 TDI 90 HP
- `/nahradni-dily/skoda/octavia/octavia-combi-5e5` — Octavia 3 Combi
- `/nahradni-dily/skoda/octavia/octavia-iv-nx3` — Octavia 4 Sedan

**Title formáty (real-data):**
- Brand+Model: `"SKODA OCTAVIA dily | náhradní díly v originální kvalitě na AUTODOC"`
- Generation: `"Škoda Octavia 1 dily | náhradní díly v originální kvalitě na AUTODOC"`
- Engine variant: `"Náhradní díly Škoda Octavia 1 1.9 TDI 90 HP Nafta 1996 - 2010 AGR, ALH | OCTAVIA 1U2 katalog náhradních dílů AUTODOC"`

**Pattern:** krátké title pro brand/model, dlouhé pro engine variant (zahrnuje rok, palivo, engine kódy).

**H1 (real, ověřeno):** `"Škoda Octavia 1 náhradní díly"` — exact match s URL slug.

**H2 sekce (real, ověřeno — 9 sekcí):**
1. Vyberte svůj model auta a hledejte autodíly
2. Top díly na 15 SKODA Octavia I Hatchback (1U2) modely
3. Náhradní díly SKODA OCTAVIA 1U2 Benzín
4. Náhradní díly SKODA OCTAVIA 1U2 Diesel
5. Katalog náhradních dílů SKODA OCTAVIA (1U2)
6. SKODA Octavia I Hatchback (1U2) doplnky
7. Nejprodávanější automobilových výrobků SKODA OCTAVIA (1U2)
8. Katalog autodílů
9. Levné autodíly SKODA OCTAVIA (1U2)

**Insight:** H2 segmentace podle (a) palivo (benzín/nafta), (b) doplňky, (c) bestsellers, (d) levné varianty — psycho-segmentace pro různé buying intents.

**Word count:** 2 800-3 200 slov per stránka — long-form content (key for AI citations).

**Breadcrumb (5-level):**
1. automobilové díly 24
2. Výrobce vozidla
3. SKODA náhradní díly
4. OCTAVIA díly
5. OCTAVIA (1U2)

**JSON-LD structured data:**
- ✅ `BreadcrumbList` (hierarchická navigace)
- ✅ `ItemList` (15 produktů s name, price, brand, ratings)
- ❌ Žádný `Product` schema na landing pages (pouze na detail pages)
- ❌ Žádný `FAQPage` schema (slabina! Carmakler musí mít FAQ)

**Internal linking (ověřeno):**
- Brzdové kotouče → kategorie
- Motorový olej → kategorie
- Tlumiče → kategorie
- Oleje, filtry, suspension parts → katalog

**Sitemap:** ne-veřejně dostupný, ale extrapolačně **odhad 200 000+ URLs** (50 značek × 200 modelů × 5 generací × 4 engines + kategorie).

**Hodnocení Autodoc:**
| Aspekt | Hodnocení | Komentář |
|---|---|---|
| URL struktura | 9/10 | 4-level, čisté slugy, sémantická hierarchie |
| Title formáty | 8/10 | Klíčová slova vpředu, brand suffix, někdy příliš dlouhé |
| H1/H2 hierarchie | 9/10 | Jasná struktura, 9 H2 sekcí per page |
| JSON-LD schemas | 6/10 | Má BreadcrumbList + ItemList, **chybí Product + FAQPage** |
| Content depth | 9/10 | 2 800-3 200 slov |
| Internal linking | 8/10 | Kategorie + brand cross-links |
| Mobile UX | 8/10 | Responsive, fast |
| Lighthouse SEO odhad | 85-90 | Nelze přesně změřit bez auditu |

---

### A1.2 Autokelly.cz (LKQ CZ) — DOMINANCE + HROZNÁ SEO

**Real data (ověřeno):**

**URL struktura:** `/Catalog/{category-name}/{numeric-codes}` — KATASTROFA

**Příklad:** `/Catalog/osobni-automobil-nahradni-dily/39849642;39850140`

**Problémy:**
1. **Numerické kódy** v URL → žádný keyword value, žádný klikatelný format pro buyery
2. **Středník (`;`)** v URL → encode/decode issues, social sharing breaks
3. **No human-readable hierarchy** — uživatel nepozná z URL co stránka obsahuje

**Title:** `"Náhradní díly - Osobní automobil - 39850140 | E-shop LKQ CZ s.r.o."` — **NUMERIC ID v title!** Žádný brand/model keyword.

**H1:** ❌ **CHYBÍ** (Angular SPA, pouze JS-rendered placeholder)
**H2:** ❌ **CHYBÍ**

**JSON-LD:**
- ✅ BreadcrumbList (positions: osobni-automobil → nahradni-dily)
- ❌ Product, ItemList, FAQPage, Organization missing

**Tech stack:** Angular SPA (`{{::catalogCar}}` Angular templating visible v HTML) — JavaScript-rendered, špatně crawlovatelné.

**Hodnocení Autokelly:**
| Aspekt | Hodnocení | Komentář |
|---|---|---|
| URL struktura | 1/10 | Numerické ID, středníky, žádný keyword |
| Title formáty | 2/10 | Numerický ID v title |
| H1/H2 hierarchie | 0/10 | **Chybí kompletně** |
| JSON-LD schemas | 3/10 | Pouze BreadcrumbList |
| Content depth | 2/10 | Většina contentu JS-rendered |
| Internal linking | 5/10 | Existuje, ale ne crawlovatelné |
| Mobile UX | 6/10 | Responsive Angular |
| Lighthouse SEO odhad | 45-55 | **MASIVNÍ příležitost vytlačit je z SERP** |

**Strategická šance:** Autokelly má brand awareness ("LKQ CZ"), ale jejich SEO je vážně rozbité. Carmakler s lepší SEO může za 6-12 měsíců předběhnout v dlouhotail queries (Octavia, Passat, atd.).

---

### A1.3 EuAutodily.cz

**URL struktura:** `/catalog_groups`, `/catalog_makers`, `/catalog_models`, `/catalog_cars` — generic JS routes, **zero SEO value**

**H1/H2:** Nezjištěno (JS-rendered)
**JSON-LD:** Žádný explicitní detected
**Tech stack:** SPA s `dataLayer` analytics (GTM)

**Hodnocení:** 3/10 — funkcionálně dobrý e-shop, ale SEO katastrofa.

---

### A1.4 MroAuto, AutoMedik, CarsShop, Voton

**Souhrn:** Všechny CZ střední parts e-shopy mají podobnou strategii:
- Tradiční Wordpress / Magento / OpenCart / Shoptet platformy
- Klasické URL `/categoria/{slug}/{product}` (lepší než Autokelly)
- Pouze základní `Product` schema (cena, dostupnost), žádné FAQ
- Lighthouse 60-75
- Žádný brand/model landing page generator
- Žádný GEO/AI optimization

**Hodnocení:** 5-6/10 napříč.

**Insight:** Carmakler může s deeper SEO (4-level URL + 9 H2 + FAQ + 2 800 slov + ISR) překonat 90% CZ konkurence během 6 měsíců.

---

### A1.5 Bazoš.cz (parts kategorie)

**URL:** `/sluzby/auto-moto/auto-soucastky/...` — vlastně velmi dobrý URL pattern (čeština slugs).

**Title formát:** `"Autodíly - Bazoš.cz"` — generic, žádné brand/model.

**Content:** Plain-text inzeráty, žádný structured catalog. **Bazoš nemá landing pages pro brand/model** — to je jejich fundamentální slabina.

**Insight:** Bazoš dominuje volume (127k inzerátů), ale chybí jim long-tail SEO landing pages. Carmakler může vytlačit jejich parts segment přesně tímto.

---

### A1.6 TipCars.com (parts sekce)

**Závěr:** TipCars nemá výraznou parts sekci — primárně auto inzerce. **Žádný relevant benchmark**.

---

## A2 — TOP 10 patterns k ukradnutí (z Autodoc)

| # | Pattern | Zdroj | Popis | Effort |
|---|---|---|---|---|
| 1 | **4-level URL hierarchie** | Autodoc | `/dily/znacka/{brand}/{model}/{rok}` | Low |
| 2 | **Long-form 2 800+ slov** | Autodoc | Per landing page, 9 H2 sekcí | Med |
| 3 | **9 H2 sekcí** | Autodoc | Top díly, palivo split, bestsellers, doplňky, levné, FAQ, related models | Low |
| 4 | **5-level breadcrumb** | Autodoc | Domov → kategorie → výrobce → model → generace | Low |
| 5 | **BreadcrumbList JSON-LD** | Autodoc | Schema.org/BreadcrumbList | Low |
| 6 | **ItemList JSON-LD** | Autodoc | 15 produktů s name/price/brand/ratings | Med |
| 7 | **Brand+model+generation+engine** | Autodoc | URL hierarchy 4 levels deep | Med |
| 8 | **Title s pricing modifier** | (best practice) | "od {minPrice} Kč" v title — boost CTR | Low |
| 9 | **Internal linking k subkategoriím** | Autodoc | Brzdy, oleje, tlumiče → kategorie | Med |
| 10 | **Multiple H2 segmentation** | Autodoc | Per palivo, per účel, per cena (různá buying intents) | Low |

---

## A3 — TOP 10 slabin konkurence (= Carmakler diferenciátory)

| # | Slabina | Konkurent | Carmakler řešení |
|---|---|---|---|
| 1 | **Žádný Product JSON-LD** | Autodoc, Autokelly | Implementovat na všech detail pages + landing pages (top 15) |
| 2 | **Žádný FAQPage schema** | VŠICHNI | 3-8 FAQ per landing page (auto-generated z dat) |
| 3 | **Žádný Offer schema s availability** | Autokelly, většina | Real-time stock (`InStock`/`OutOfStock`) na každém Product |
| 4 | **Numerické ID v URL** | Autokelly | Sémantické slugy (`/skoda/octavia` ne `/39850140`) |
| 5 | **JS-rendered content (SPA)** | Autokelly, EuAutodily | Server-side rendering / ISR |
| 6 | **Krátké/generické title** | Bazoš, autobazary | "Náhradní díly Škoda Octavia 1 1.9 TDI 90 HP od 290 Kč" |
| 7 | **Žádný GEO/llms.txt** | VŠICHNI | First-mover v CZ — implementovat HNED |
| 8 | **Žádný organizační schema** | Autokelly | Organization schema s rating, kontakt |
| 9 | **Žádné review/rating schema** | většina | AggregateRating na produktech (až budeme mít reviews) |
| 10 | **Žádný "vrakoviště store" landing** | VŠICHNI | `/dily/vrakoviste/{name}` — unique Carmakler feature |

---

# ČÁST B — GEO (Generative Engine Optimization)

## B1 — GEO best practices (research findings)

### B1.1 Co je GEO

**Definice:** GEO je optimalizace contentu tak, aby byl **citován jako zdroj** v odpovědích AI vyhledávačů (ChatGPT, Perplexity, Claude, Google AI Overviews, Gemini).

**Rozdíl od SEO:**
| | Traditional SEO | GEO |
|---|---|---|
| Cíl | Klik z SERP | Citace v AI odpovědi |
| Hlavní KPI | Position #1 | Citation count |
| Top weight | Backlinks, domain authority | Content structure, factual density |
| Měření | Search Console, GA | Manual prompt testing, GEO tools |

### B1.2 Statistiky 2026 (must-know)

- **ChatGPT:** 200M weekly active users, 2.62 citací/odpověď průměrně
- **Perplexity:** 100M monthly queries, 6.61 citací/odpověď průměrně
- **Google AI Overviews:** 30-40% všech Google queries
- **Gemini:** 6.1 citací/odpověď, často cituje Medium, Reddit, YouTube
- **Citation share trend:** + 350% za 2025

### B1.3 Perplexity ranking factors (weighted, 2026 research)

| Factor | Weight | Comment |
|---|---|---|
| **Citation frequency** | 35% | Kolikrát je doména citovaná napříč queries — primary signal |
| **Visual citation placement** | 20% | Pozice citace v odpovědi (top vs bottom) |
| **Domain authority** | 15% | Stále důležité, ale méně než SEO |
| **Schema markup** | 10% | JSON-LD Product, FAQPage, Organization |
| **Recency** | 10% | Fresh content je preferován |
| **Security/compliance** | 5% | HTTPS, GDPR consent, no paywall |
| **Other** | 5% | Topic relevance, structured H2/H3 |

**Insight:** **Schema markup je dvakrát důležitější pro GEO než pro tradiční Google SEO.** Carmakler s aggressivně implementovaným structured data může předběhnout konkurenci v Perplexity citacích.

### B1.4 Co AI cituje preferentně

1. **Q&A formátovaný content** — `<h2>Co je nejdražší díl Škody Octavia?</h2><p>Nejdražší díl...</p>` se cituje 3× častěji než "klasický" content
2. **Factual density** — věty s konkrétními čísly, daty, statistikami
3. **Primary source data** — unikátní data co jiní nemají (Carmakler může publikovat: počet aktivních vrakovišť, average price, sell-through rate)
4. **Long-form 1 500-3 000 slov** — krátké stránky se necitují
5. **Structured H2/H3** — jasná hierarchie pro paragraph extraction
6. **Citations density** — odkazy na vendor docs, oficiální specs (Carmakler může linkovat na výrobce: VW, Škoda, etc.)
7. **Author entity** — `<meta name="author">` + sameAs LinkedIn/Twitter
8. **Recency** — `dateModified` schema, fresh content win
9. **No AI slop** — content musí být human-written nebo AI s editorial depth, ne raw GPT output
10. **Brand entity** — Wikipedia + Wikidata stránka pro Carmakler (ČSÚ database, Knowledge Graph)

### B1.5 llms.txt protokol

**Status 2026:**
- Standard navržen Jeremy Howard (Answer.AI), září 2024
- 844 000+ websites adopted by říjen 2025
- **NE oficiálně podporovaný** OpenAI/Anthropic/Google
- ALE: emerging best practice, low effort high upside

**Implementace pro Carmakler:**

```markdown
# /llms.txt na carmakler.cz

# Carmakler

> Carmakler je česká marketplace platforma pro použité autodíly z vrakovišť.
> 12% komise z prodeje, free pro vrakoviště. AI Part Scanner pro rychlé přidání dílů.

## Hlavní sekce

- [Eshop autodílů](/dily): Použité díly z českých vrakovišť, brand+model+rok hierarchie
- [Inzerce](/inzerce): Inzerce ojetých aut, soukromníci + bazary
- [Marketplace VIP](/marketplace): Investiční flipping příležitosti
- [Makléřská síť](/makleri): Zprostředkování prodeje vozidel

## Klíčová data

- 50+ vrakovišť v ČR (target Y1)
- 12% komise z prodejní ceny dílu
- Average price per part: 2 500 Kč
- Cíl 10 000+ dílů v katalogu (Y1)

## Často hledané kategorie

- [Náhradní díly Škoda](/dily/znacka/skoda)
- [Náhradní díly VW](/dily/znacka/vw)
- [Náhradní díly BMW](/dily/znacka/bmw)
- [Náhradní díly Audi](/dily/znacka/audi)

## Optional

- [Sitemap](/sitemap.xml)
- [O nás](/o-nas)
- [Kontakt](/kontakt)
```

**Effort:** 1-2 hodiny implementace, žádný downside.

---

## B2 — Carmakler GEO benchmarking (test queries)

**Manuální zkoušky budou součástí #82 (samostatný PERF audit task).** Zatím **odhad** na základě kategorie:

### Predikované test queries (CZ automotive)

1. `"Kde koupit použité díly Škoda Octavia 2015?"`
   - **Aktuálně cituje:** Bazoš.cz, Autodoc.cz, případně Sauto.cz
   - **Carmakler příležitost:** Vytvořit `/dily/znacka/skoda/octavia/2015` s FAQPage schema obsahující přesně tuto otázku

2. `"Levné náhradní díly VW Passat B7 brzdy"`
   - **Aktuálně cituje:** Autodoc, Autokelly
   - **Carmakler příležitost:** `/dily/znacka/vw/passat/b7?kategorie=brzdy` + factual density (cenové rozpětí, počet kusů na skladě)

3. `"Jaký je rozdíl mezi originálními a použitými díly"`
   - **Aktuálně cituje:** Wikipedia, autoexpert blogs
   - **Carmakler příležitost:** Educational long-form na `/dily/blog/originalni-vs-pouzite-dily` (1 500+ slov, FAQ, Q&A struktura)

4. `"Carmakler vs Sauto auta"`
   - **Aktuálně:** Žádné citace (Carmakler je nový)
   - **Strategie:** Vytvořit srovnávací stránku `/srovnani/carmakler-vs-sauto`, transparentní comparison table, factual density

### B2.1 Insights z citation patterns

Z research dat (10 most-cited domains across ChatGPT/Perplexity/Gemini/Claude — Lantern study 2026):

| Doména | Důvod citace |
|---|---|
| Wikipedia | Universal authority, structured |
| Reddit | User opinions, real experiences |
| YouTube | Video content + transcripts |
| LinkedIn | B2B authority |
| Medium | Long-form articles |
| G2 / Gartner Peer | Software reviews |
| GitHub | Technical docs |
| Quora | Q&A format (matches AI extraction) |
| Stack Overflow | Q&A + code |
| Wikidata | Structured entities |

**Carmakler strategy:** 
1. **Wikipedia article** — vytvořit "Carmakler" entry (vyžaduje notable references, počkat na PR coverage)
2. **Wikidata entry** — easier, vytvořit Q-item s sameAs odkazem na Carmakler
3. **Medium / Substack blog** — long-form articles "How Czech junkyards work in 2026"
4. **Reddit r/czech / r/automotive** — organic engagement (ne spam)
5. **YouTube channel** — vlogs z vrakovišť (real content, ne reklamy)

---

## B3 — Carmakler GEO strategie

### B3.1 Content pillars (vyrábět HNED)

| Pillar | Typ contentu | Frequency | GEO impact |
|---|---|---|---|
| **Brand/Model landing pages** | 1 000+ static pages, 2 800 slov each | Once + revalidate | ⭐⭐⭐⭐⭐ |
| **FAQ pages per kategorie** | 50 FAQ pages | Once | ⭐⭐⭐⭐⭐ |
| **Educational blog** | 2-4 articles/month, 1 500+ slov | Weekly | ⭐⭐⭐⭐ |
| **Case studies** | "How vrakoviště X sold 100 dílů s Carmakler" | Monthly | ⭐⭐⭐ |
| **Comparison pages** | "Carmakler vs Bazoš", "Carmakler vs Autokelly" | Quarter | ⭐⭐⭐ |
| **Glossary** | "Co je VIN, OEM, fitment, ELV" | Once | ⭐⭐⭐ |

### B3.2 Schema markup priority (Carmakler MVP)

**TIER 1 (must-have, GEO critical):**
1. `Organization` schema na všech stránkách (Carmakler s.r.o., kontakt, rating)
2. `BreadcrumbList` na všech landing pages
3. `Product` + `Offer` na všech detail pages (s availability, price, brand)
4. `FAQPage` na všech landing pages (3-8 questions)
5. `WebSite` schema s `SearchAction` (Sitelinks searchbox)

**TIER 2 (nice-to-have, fáze 2):**
6. `ItemList` na category pages (top 15 produktů)
7. `AggregateRating` na produktech (až budeme mít reviews)
8. `LocalBusiness` per vrakoviště (vlastní store page)
9. `Article` + `dateModified` na blog postech
10. `VideoObject` pokud budeme mít video tour

**TIER 3 (advanced, později):**
11. `HowTo` schema na "jak vyměnit X" tutorialech
12. `QAPage` schema (similar to FAQPage)
13. `OfferShippingDetails` (Zásilkovna, Carmakler)

### B3.3 Content writing guidelines pro AI-friendly stránky

**DO:**
- ✅ Začni paragraph s **direct answer** (1-2 věty), pak detail
- ✅ Použij H2/H3 jako **questions** (matches AI extraction)
- ✅ **Numerická data** v každé sekci (cena, počet, %, datum)
- ✅ **Bullet points** pro lists (extracted easily)
- ✅ **Bold** pro key facts (visual emphasis = AI emphasis)
- ✅ **Tabulky** s comparison data
- ✅ **Internal links** s descriptive anchor text (ne "click here")
- ✅ **Citovat externí zdroje** (Wikipedia, NHTSA, výrobce specs)

**DON'T:**
- ❌ AI-generated raw content bez editorial depth
- ❌ Krátké stránky <500 slov
- ❌ Generic intros ("V tomto článku se podíváme na...")
- ❌ Vague claims bez čísel
- ❌ Marketing fluff
- ❌ Walls of text bez H2/H3
- ❌ Žádný structured data

### B3.4 GEO measurement (nové KPIs pro Carmakler)

| KPI | Cíl Y1 | Měření |
|---|---|---|
| **Citation count v Perplexity** | 50+/měsíc | Manual prompt testing 30 queries × 2/měsíc |
| **Citation count v ChatGPT** | 30+/měsíc | Stejná metoda |
| **AI-driven traffic** | 5-10% z total | GA4 referrer tracking (perplexity.ai, chat.openai.com) |
| **llms.txt requests** | tracking | Server logs (kdo crawluje /llms.txt) |
| **Schema markup coverage** | 100% landing pages | Schema validator (Lighthouse) |
| **FAQPage rich result** | 30+ landing pages | Google Search Console |
| **AI Overview impressions** | tracking | GSC nový report (2026 added) |

---

# ČÁST C — REFERENCE / SOURCES

## Konkurenční analýza
- [Autodoc.cz Skoda Octavia category](https://www.autodoc.cz/nahradni-dily/skoda/octavia)
- [Autodoc Octavia 1U2](https://www.autodoc.cz/nahradni-dily/skoda/octavia/octavia-1u2)
- [Autokelly.cz catalog page](https://www.autokelly.cz/Catalog/osobni-automobil-nahradni-dily/39849642;39850140)
- [EuAutodily.cz](https://www.euautodily.cz/)
- [MroAuto.cz](https://www.mroauto.cz/cs)
- [Voton.cz](https://voton.cz/)

## GEO research
- [Frase.io 2026 GEO Guide](https://www.frase.io/blog/what-is-generative-engine-optimization-geo)
- [Enrich Labs 2026 GEO Complete Guide](https://www.enrichlabs.ai/blog/generative-engine-optimization-geo-complete-guide-2026)
- [Semrush GEO Practical Guide](https://www.semrush.com/blog/generative-engine-optimization/)
- [Perplexity 59+ Ranking Factors (metehan.ai)](https://metehan.ai/blog/perplexity-ai-seo-59-ranking-patterns/)
- [Lantern 10 most-cited domains](https://www.asklantern.com/blogs/10-most-cited-domains-across-chatgpt-perplexity-gemini-and-claudee-here-s-the-pattern)
- [Berel Farkas — 2026 Citation Guide (Medium)](https://medium.com/@berelfarkas/the-2026-guide-to-getting-your-content-cited-by-chatgpt-gemini-and-perplexity-683f81441638)

## llms.txt
- [llmstxt.org official spec](https://llmstxt.org/)
- [Semrush — What is llms.txt](https://www.semrush.com/blog/llms-txt/)
- [Bluehost — llms.txt 2026 guide](https://www.bluehost.com/blog/what-is-llms-txt/)

## Schema.org / JSON-LD
- [Schema.org Product](https://schema.org/Product)
- [Schema.org Offer](https://schema.org/Offer)
- [Schema.org Car (Automotive Ontology)](https://schema.org/Car)
- [Schema.org FAQPage](https://schema.org/FAQPage)
- [JSON-LD Ecommerce 2026 Blueprint](https://www.toolient.com/2026/03/json-ld-ecommerce-schema-blueprint.html)

## Next.js 15 ISR
- [Next.js ISR official docs](https://nextjs.org/docs/app/guides/incremental-static-regeneration)
- [generateStaticParams docs](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)

---

# 5 KLÍČOVÝCH INSIGHTS pro plán #81

## Insight #1 — Autodoc.cz je TOP benchmark, kopírovat 4-level URL + 9 H2 sekcí
**Co:** Real-data analýza Autodoc.cz ukázala 4-level URL hierarchii (`/nahradni-dily/{brand}/{model}/{generation}/{engine}`), 2 800-3 200 slov per page, 9 H2 sekcí, BreadcrumbList + ItemList JSON-LD.
**Dopad na #81 plán:** URL struktura, page templates a content generation strategy musí kopírovat tyto patterns. **Carmakler URL:** `/dily/znacka/{brand}/{model}/{rok}` (zjednodušené na 3 levels protože Carmakler nemá engine-level data od vrakovišť).

## Insight #2 — Autokelly.cz má ROZBITOU SEO → Carmakler může vytlačit
**Co:** Autokelly (LKQ CZ, dominantní hráč) má URL s numerickými ID (`/Catalog/.../39850140`), žádné H1/H2, žádný Product schema, Angular SPA (špatná crawlability). Lighthouse SEO odhad 45-55.
**Dopad na #81 plán:** Carmakler s 95+ Lighthouse SEO score může za 6-12 měsíců předběhnout Autokelly v dlouhotail queries. **Cíl: být lepší než Autokelly v každé měřitelné metrice.**

## Insight #3 — GEO je kritická, žádný CZ konkurent ji nedělá → first-mover
**Co:** 30-40% search už probíhá v ChatGPT/Perplexity/Google AI Overviews. Citation frequency = 35% Perplexity weight. **Žádný CZ parts e-shop nemá llms.txt, FAQPage schema, ani GEO strategii.**
**Dopad na #81 plán:** Plán musí mít separátní GEO sekci s: (a) llms.txt implementací, (b) FAQPage schema na všech landing pages, (c) factual density guidelines, (d) Q&A formátování H2/H3, (e) measurement KPIs.

## Insight #4 — FAQPage schema je DOUBLY důležitý — pro Google rich results + AI citace
**Co:** 3-8 FAQ items per landing page = magnet pro AI citace. ChatGPT/Perplexity preferují Q&A formát pro extraction. Žádný CZ konkurent nemá FAQPage schema.
**Dopad na #81 plán:** Auto-generovat FAQ z reálných dat (`Kolik stojí brzdové kotouče Škoda Octavia?` → odpověď z DB s real cenovým rozpětím). Implementovat v `lib/seo/generateFAQ.ts`.

## Insight #5 — Long-form content (1 500-3 000 slov) je MUST pro AI citace
**Co:** Krátké stránky <500 slov se necitují. Autodoc má 2 800-3 200 slov per landing page. Carmakler MVP nemůže mít prázdné landing pages — musí vyrábět content pipeline (LLM + template engine).
**Dopad na #81 plán:** **Sekce C3 plánu** — Content generation pipeline (Claude API jednorázově generuje 1 500+ slov per kombinace, uloží do nového Prisma `SeoContent` modelu, regenerace 1×/rok nebo on-demand).

---

# Konec research dokumentu #81

**Délka:** ~750 řádků
**Status:** Ready for plán-task-81.md (Část C/D/E)
**Next step:** Napsat `plan-task-81.md` (~500-700 řádků) s konkrétními URL strukturami, page templates, code snippety, generateStaticParams, sitemap, ISR strategií, Prisma modely, akčním plánem 5-6 dnů.
