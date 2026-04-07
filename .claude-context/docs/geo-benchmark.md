# GEO Benchmark + SEO Monitoring — Carmakler

> **Verze:** 1.0 (#87e DOCS, 2026-04-07)
> **Vlastník:** Marketing manager (primary), Product Owner (backup), CTO (review)
> **Frekvence aktualizací:** Quarterly review, ad-hoc při GEO landscape change
> **Status:** Production-ready methodology, monitoring scripts deferred (post-#87e follow-up)

---

## Obsah

1. [Účel a kontext](#1-účel-a-kontext)
2. [GEO methodology](#2-geo-methodology)
3. [Manual benchmark workflow](#3-manual-benchmark-workflow)
4. [Test queries — 30 promptů, 5 kategorií](#4-test-queries)
5. [Citation tracking](#5-citation-tracking)
6. [Tool catalog (4-tier)](#6-tool-catalog-4-tier)
7. [Baseline metrics + Y1 cíle](#7-baseline-metrics--y1-cíle)
8. [Core SEO health monitoring](#8-core-seo-health-monitoring)
9. [Suggested cron schedule](#9-suggested-cron-schedule)
10. [Action playbooks](#10-action-playbooks)
11. [Reference & links](#11-reference--links)

**Appendices:**
- [A — Log template (CSV)](#appendix-a--log-template-csv)
- [B — Markdown table template pro výsledky](#appendix-b--markdown-table-template-pro-výsledky)
- [C — Glossary](#appendix-c--glossary)

---

## 1 — Účel a kontext

### 1.1 Proč GEO?

**Generative Engine Optimization (GEO)** je disciplína optimalizace obsahu pro **AI-driven discovery engines** — ChatGPT, Perplexity, Claude, Gemini a Google AI Overviews. Liší se od klasického SEO tím, že místo soutěže o pozici v SERP soutěží o **citaci v generativní odpovědi**.

Pro Carmakler je GEO strategicky kritický ze 3 důvodů:

1. **First-mover advantage v CZ parts vertikále** — žádný hlavní český konkurent (Sauto, TipCars, Bazoš, Autokelly, AutoESA) systematicky neoptimalizuje pro AI engines (stav 2026-Q2). Investice do GEO teď = etablovaná pozice v době, kdy LLM-driven discovery dosáhne mainstream adopce.
2. **Strukturovaný katalog s VIN data** — Carmakler nabízí přesně ten typ obsahu, který AI engines preferují: faktická data, jasné kategorie, porovnatelné ceny, detailní popis kompatibility. Šance citace je vyšší než u brand-content pages.
3. **Cross-product moat** — GEO citace pro `/dily/znacka/{brand}` driveuje traffic i pro adjacent produkty (inzerce, marketplace, makléř), protože uživatel je typicky v "research mode" před konkrétním rozhodnutím (koupit / prodat / financovat).

### 1.2 Co se měří

GEO měří **visibility v AI engine outputs**, ne ranking jako klasické SEO. Klíčové metriky:

- **Citation count** — kolikrát se URL nebo brand objeví v AI odpovědi za N queries
- **Citation rank** — pozice v rámci jedné odpovědi (1st citation > 5th citation, ~3-5× rozdíl v conversion)
- **Citation type** — linked (kliknutelný odkaz) vs textual mention (jen brand name)
- **Sentiment** — pozitivní / neutrální / negativní zmínka
- **Share of voice** — % zmínek Carmakler vs konkurenti (Sauto, TipCars, Bazoš, Autokelly, Mobile.de, AutoESA)

### 1.3 Pro koho je tento dokument

| Role | Use case |
|---|---|
| **Marketing manager** | Primary owner měření, čte §3-§5 (workflow + queries + tracking) |
| **Product Owner** | Vyhodnocuje §7 (Y1 cíle), rozhoduje o tool tier upgrade per §6.5 |
| **CTO / Tech lead** | Implementuje §8-§10 monitoring scripts (post-#87e follow-up), reaguje na alert thresholds |
| **Content / SEO copywriter** | Optimalizuje content podle §2 methodology + §4 query patterns |

### 1.4 Frekvence aktualizací tohoto dokumentu

- **GEO benchmark workflow (§3-§5):** review po každém měření (2× měsíčně), update jen pokud workflow změna
- **Tool catalog (§6):** quarterly review (každý kvartál) — GEO landscape se rychle mění
- **Y1 targets (§7):** quarterly retrospective — adjust thresholds podle reality
- **Monitoring metrics (§8-§10):** annual review — měnit jen po závažné technical migration

---

## 2 — GEO methodology

### 2.1 Co je generative engine optimization

GEO (alternativně **AEO** — Answer Engine Optimization) je optimalizace pro engines, které **generují odpověď** namísto vrácení seznamu odkazů. Klíčový rozdíl vs SEO:

| Aspekt | SEO | GEO |
|---|---|---|
| **Cílová odpověď** | Pozice v top 10 SERP | Citace v generativní odpovědi |
| **Optimalizační signál** | Backlinks, on-page, EAT | Strukturovaný obsah, schema, faktická hustota |
| **Měření** | Rank, impressions, CTR | Citation count, rank, sentiment |
| **Frekvence změn** | Algorithmické updates | Model updates + retraining cykly |
| **Nástroje** | Ahrefs, Semrush, GSC | Profound, Otterly, manuální prompt testing |

### 2.2 Klíčové metriky (detail)

**Citation count:**
- Celkový počet zmínek Carmakler napříč 30 testovacími queries × 5 engines = 150 measurement slots per benchmark
- Měří se per měření (1× za 2 týdny)
- Trend month-over-month je důležitější než absolutní hodnota

**Citation rank:**
- Score 5 = první citace v odpovědi (top of answer)
- Score 4 = 2. citace
- Score 3 = 3.-5. citace
- Score 2 = 6.-10. citace
- Score 1 = >10. citace ("deep citation")
- Score 0 = žádná citace

**Sentiment:**
- Pozitivní = explicitní doporučení ("Carmakler je dobrá volba pro...")
- Neutrální = factual mention bez evaluace ("Carmakler nabízí náhradní díly...")
- Negativní = warning / criticism ("Carmakler nemá dostatek skladu...")
- Většina měření bude **neutrální** (žádaný stav — fakta jsou neutrálnější než opinion)

**Share of voice:**
- (Carmakler citations) / (Total brand citations across all competitors) × 100 %
- Konkurenti pro tracking: **Sauto, TipCars, Bazoš, Autokelly, Mobile.de, AutoESA**
- Y1 target: ≥10 % share of voice v parts vertikále

### 2.3 Engine landscape (2026 Q2 stav)

| Engine | Tržní podíl CZ (estim.) | Citation style | API access | Notes |
|---|---|---|---|---|
| **ChatGPT** (OpenAI) | ~35-40 % | Web mode = linked, default = textual | Limited (Enterprise) | 700M+ users globally, browse module variabilní |
| **Perplexity** | ~10-15 % | Always linked, dedikovaný sources panel | Public API ($) | Best citation transparency, ideální pro tracking |
| **Claude** (Anthropic) | <5 % | Linked v search/web mode | API ($) | Web search v Claude.ai, brzy expansion |
| **Gemini** (Google) | ~15-20 % | Mixed (linked v deep mode) | Vertex AI ($) | Google search integration, AI Mode |
| **Google AI Overviews** | ~30 %+ z search queries | Mixed (linked sources card) | Search Console (read-only) | Inline v SERP, výrazný traffic dopad |

**Strategická poznámka:** Pro CZ trh prioritizuj v tomto pořadí:
1. **Google AI Overviews** (největší dopad — Google ovládá CZ search ~95 %)
2. **ChatGPT** (největší engagement, brand recall)
3. **Perplexity** (best citation transparency, easy benchmark)
4. **Gemini, Claude** (rostoucí, ale zatím nižší podíl)

### 2.4 Citation types

- **Linked citation:** AI odpověď obsahuje kliknutelný link na `carmakler.cz` (nebo subdoménu) — "hard win", driveuje traffic
- **Textual mention:** AI odpověď zmiňuje "Carmakler" bez linku — "soft win", brand awareness, driveuje branded search

**Měřit obě.** Linked je důležitější pro KPIs, textual signalizuje že engine "ví" o brandu (často krok 1 před linked citation).

### 2.5 Ranking interpretation

| Pozice | Score | Význam | Conversion impact |
|---|---|---|---|
| 1st citation | 5 | "Top recommendation" | 3-5× vyšší CTR vs deep |
| 2nd-3rd | 4-3 | "Notable mention" | 1.5-2× CTR vs deep |
| 4th-10th | 2-3 | "Listed source" | Baseline |
| >10th / "deep" | 1 | "Filler citation" | Marginální |

**Cíl:** Maximize 1st-3rd pozici. Deep citations jsou nice-to-have, ne primary KPI.

---

## 3 — Manual benchmark workflow

### 3.1 Předpoklady (checklist před měřením)

- [ ] **Browser:** Chrome incognito (žádné cookies, žádný cache)
- [ ] **Lokace:** ČR (pokud měříte ze zahraničí, použijte VPN s CZ exit nodem)
- [ ] **Account:** Nepřihlášený do žádného AI service (anonymous, žádný personalization bias)
- [ ] **Engines:** Zkontroluj že máš přístup k 5 enginům:
  - ChatGPT — `https://chatgpt.com` (login může být nutný — použij dedikovaný anonymous test account)
  - Perplexity — `https://perplexity.ai` (no login potřeba pro basic queries)
  - Claude — `https://claude.ai/new` (login nutný)
  - Gemini — `https://gemini.google.com` (Google account)
  - Google AI Overviews — `https://google.com/search?q={query}` → AI Overview se zobrazí inline (CZ region)
- [ ] **Časový blok:** Vyhraď ~90 min nepřerušeně (30 queries × 5 engines × ~30 sec/query + log writing)
- [ ] **Log spreadsheet:** Otevři master CSV (template v Appendix A)

### 3.2 Step-by-step měření per query × engine

```
1. Otevři incognito tab
2. Naviguj na engine URL (např. perplexity.ai)
3. Vlož query #N z §4 doslovně (copy-paste, nepřepisuj)
4. Stiskni Enter, počkej na full response (ne jen first sentence)
5. Zaznamenej do logu:
   a. carmakler_cited: TRUE / FALSE
   b. Pokud TRUE:
      - citation_rank: 1-5+ (kterou citaci v pořadí)
      - citation_type: linked / textual
      - linked_url: full URL (např. https://carmakler.cz/dily/znacka/skoda)
      - sentiment: positive / neutral / negative
   c. competitors_cited: list konkurentů (sauto.cz, tipcars.com, bazos.cz, autokelly.cz, mobile.de, autoesa.cz)
   d. notes: cokoli zajímavého (např. "engine doporučil VIN check")
6. (Volitelné) Screenshot pro audit trail
7. Repeat krok 3-6 pro každou query v §4 (1-30) per stejný engine
8. Repeat celý cyklus pro každý engine (5 engines)
```

**Estimated time per session:** ~90 min (30 queries × 5 engines = 150 measurements × ~30-40 sec per measurement + log writing).

### 3.3 Log template

Viz **Appendix A** pro CSV layout. Master log doporučuji v Google Sheets (sdílený access pro Marketing + PO + CTO) s 1 řádkem = 1 measurement (query × engine × date).

### 3.4 Frekvence měření

- **2× měsíčně:** 1. a 15. v měsíci (vždy stejný den, ±2 dny tolerance)
- **Důvod 2× měsíčně:** Trade-off mezi data freshness (rychlé reakce na regrese) a effort (90 min × 2 = 3 h/měsíc)
- **Důvod fixní data:** Eliminace bias z týdenních cyklů (pondělní queries vs pátky se mohou lišit)

### 3.5 Owner & escalation

- **Primary:** Marketing manager (executes měření, loguje, eskaluje anomálie)
- **Backup:** Product Owner (zajišťuje pokud Marketing OOO)
- **Reviewer:** CTO (sanity check 1× měsíčně — zkontroluje že čísla nejsou statistický šum)
- **Escalation trigger:** Citation count drop ≥20 % vs předchozí měření → okamžitá investigation

---

## 4 — Test queries

> **30 queries × 5 enginů = 150 měřících bodů per benchmark.** Queries jsou **uzamčeny pro Y1** — měnit pouze v Q1 následujícího roku, jinak se zničí trend (mid-quarter změny zničí porovnatelnost).

### 4.1 Brand discovery (6 queries)

Cíl: Ověřit, že Carmakler se cituje v "kde koupit X" queries pro hlavní značky.

1. `Kde koupit ojeté autodíly Škoda Octavia?`
2. `Levné originální díly Volkswagen Passat`
3. `Použité díly BMW 3 series F30`
4. `Originální díly Audi A4 B9 cena`
5. `Náhradní díly Ford Focus z vrakoviště`
6. `Hyundai i30 použité díly Praha`

### 4.2 Long-tail product (6 queries)

Cíl: Ověřit 3-segment routes (`/dily/znacka/{brand}/{model}/{rok}`) pro specifické díly.

7. `Brzdové destičky Škoda Fabia 2018 cena`
8. `Použitý motor 1.9 TDI Octavia 2`
9. `Tlumiče VW Golf 7 cena`
10. `Spojka BMW E90 320d kompletní`
11. `Světlomet Audi A4 B8 levý`
12. `Převodovka Hyundai i30 manuální`

### 4.3 Educational / informational (6 queries)

Cíl: Ověřit FAQ snippet sekce (univerzální FAQ + contextual FAQ na /dily landing pages).

13. `Jaký je rozdíl mezi originálními a aftermarket díly?`
14. `Jak ověřit kompatibilitu náhradního dílu podle VIN?`
15. `Záruka na použité autodíly v ČR`
16. `Kolik stojí výměna brzdových kotoučů Octavia 3?`
17. `Reklamace použitého dílu z vrakoviště — postup`
18. `Jak poznat kvalitní použitý díl z vrakoviště?`

### 4.4 Service / makléř (6 queries)

Cíl: Ověřit Carmakler makléřskou síť + související služby.

19. `Zprostředkovatel prodeje auta provize`
20. `Bezplatné ocenění ojetého auta online`
21. `Jak rychle prodat auto bez bazaru?`
22. `Carmakler nebo Sauto pro prodej auta?`
23. `Komisní prodej auta cena`
24. `Cebia prověření vozu cena`

### 4.5 Competitor benchmark (6 queries)

Cíl: Měřit share of voice vs hlavní konkurenti.

25. `Nejlepší online vrakoviště v ČR`
26. `Alternativy k Sauto.cz pro prodej auta`
27. `Marketplace pro investování do aut ČR`
28. `Eshop autodíly s VIN vyhledáváním`
29. `Inzerce ojetých aut srovnání`
30. `Carmakler recenze 2026`

---

## 5 — Citation tracking

### 5.1 Detection workflow

Pro každou measurement (query × engine):

1. **Text search:** `Cmd+F` → "carmakler" v AI response. Match = TRUE pro `carmakler_cited`.
2. **Link search:** Pro každý odkaz v response, hover → ověř že domain obsahuje `carmakler.cz`. Pokud ano = `citation_type: linked`.
3. **Source panel inspection:** V Perplexity klikni na "Sources" tab. V Gemini klikni na "Show sources". V Claude se zdroje zobrazují inline. V ChatGPT (web mode) jsou zdroje na konci odpovědi.
4. **Sentiment classification:** Přečti kontext kolem zmínky:
   - "Carmakler je doporučovaná možnost pro..." → positive
   - "Carmakler nabízí náhradní díly Škoda" → neutral
   - "Carmakler nemá dostatek skladu" → negative

### 5.2 Ranking heuristics (recap)

Viz §2.5 pro skóre tabulku. Implementace v logu: zaznamenej `citation_rank` jako integer (1-5+), pak post-process pro skóre.

### 5.3 False positive filter

- **"carmakler" je unikátní brand** v CZ — false positive risk je nízký
- **Pozor na typo "carmaker"** (anglické generic word "výrobce aut") — NELZE počítat jako citaci
- **Verify rule:** Linked citation musí obsahovat doménu `carmakler.cz` (root nebo subdoména: `inzerce.`, `dily.`). Cokoli jiného (např. `carmaker-magazine.com`) **NENÍ** Carmakler citace.
- **Brand mention bez linku:** OK počítat jako `textual` POKUD je v kontextu identifikovatelný (např. "v Česku služba Carmakler nabízí..." — clearly náš brand).

### 5.4 Tracking spreadsheet template

Viz **Appendix A** pro CSV layout (8 sloupců). Doporučení: Google Sheets s pivot table summary za "rolling 6 měsíců" pro snadné generování trendů.

---

## 6 — Tool catalog (4-tier)

### 6.1 Tier 1 — Enterprise ($500-2000+/měsíc)

> **Vhodné pro:** Carmakler ve fázi Scale (Q3 2027+), kdy GEO traffic >20 % z total a roční SEO budget >$50K. **Evaluate Y2+** — pro MVP/Growth fázi over-investment.

| Tool | Cena (orientačně) | Pokrývá | Best for |
|---|---|---|---|
| **Profound** | $1500-2000+/měsíc | Comprehensive GEO suite (citation tracking, sentiment, competitive analysis, share of voice across all major engines) | Market leader 2026, doporučená volba pokud rozpočet umožní |
| **Semrush Enterprise AIO** | $500-1500/měsíc (add-on) | Granular tracking ChatGPT/AI Mode/Perplexity, mentions/sentiment/share of voice integrated v Semrush dashboardu | Pokud Carmakler už platí Semrush Pro, upgrade na AIO je incremental |
| **SE Ranking** | $400-800/měsíc | Embedded GEO tracking v broader SEO stack, cost-effective vs Profound | Cost-conscious Tier 1 alternativa |

**Rozhodovací kritérium pro Tier 1:** ROI calculation — pokud GEO citation zvedá organic traffic o ≥X %, kde X × LTV > tool cost, tier 1 dává smysl.

### 6.2 Tier 2 — Mid-market ($20-200/měsíc)

> **Vhodné pro:** Carmakler ve fázi Growth (Q4 2026 — Q2 2027), kdy začíná měřit GEO impact systematicky. Doporučená cesta z MVP.

| Tool | Cena | Pokrývá | Best for |
|---|---|---|---|
| **Otterly.AI** | ~$29/měsíc | Best pro Google AI Overviews focus | Český trh přes Google = high relevance, doporučení #1 pro Carmakler Growth fázi |
| **Rankscale.ai** | ~$20/měsíc | Essential visibility monitoring napříč 5 enginy | Budget-friendly start, dostatečné pro Q4 2026 baseline |
| **Writesonic** | ~$50-100/měsíc | Content production angle — pomáhá engineerovat citation-friendly obsah | Komplementární k tracking, ne nahrazení |

### 6.3 Tier 3 — Budget / free (zdarma)

> **Vhodné pro:** Carmakler ve fázi MVP (now — Q3 2026). **Doporučená cesta pro #87e MVP** — žádný měsíční náklad, pouze čas marketing managera.

| Tool | Cena | Pokrývá | Best for |
|---|---|---|---|
| **Google Search Console** | Zdarma | Indexation, queries, click-through, AI Overviews impressions (omezeně) | Baseline core SEO health monitoring (§8) |
| **Manuální měření** | Zdarma | 100 % per §3-§5 workflow | Time-intensive (~3 h/měsíc), ale 100 % kontrola dat |
| **Bing Webmaster Tools** | Zdarma | Bing index data — Bing pohání ChatGPT search, takže Bing visibility = ChatGPT visibility proxy | Doporučení pro tracking ChatGPT-driven traffic source |

**Budget tier workflow pro Carmakler MVP:**
1. GSC → setup property pro `carmakler.cz`, submit sitemap, monitor indexation rate weekly
2. Bing Webmaster Tools → setup property, submit sitemap (Bing crawler je důležitý pro ChatGPT visibility)
3. Manuální měření per §3-§5 → 2× měsíčně, log do shared Google Sheets

### 6.4 Tier 4 — DIY custom (Node.js, future)

> **Status v #87e:** Pouze placeholder + research notes. **Implementace je separátní task post-#87e** (pokud bude poptávka po automatizaci).

**Concept:** Node.js script s headless Chrome (Puppeteer) → automatický probe ChatGPT/Perplexity API → log do JSON.

**Pseudo-architektura (FUTURE — NOT v #87e scope):**

```
scripts/geo-benchmark-cron.ts   ← FUTURE
  ├─ načti queries z config (.claude-context/docs/geo-queries.json)
  ├─ for each engine (chatgpt, perplexity, claude, gemini):
  │   ├─ POST query přes engine API (kde dostupné) nebo Puppeteer pro web UI
  │   ├─ parse response for "carmakler.cz" mentions
  │   ├─ score per §5.2
  │   └─ log do JSON / DB
  ├─ upsert do db.geo_benchmark_log table
  └─ alert webhook pokud score drop >20 % week-over-week
```

**Proč zatím odložit:**
- API access pro některé engines je rate-limited / paid (Perplexity, OpenAI Search)
- Maintenance overhead (engine UIs se mění, scrapers se rozbíjejí)
- Manual workflow per §3-§5 dává lepší kvalitu dat pro MVP fázi

### 6.5 Recommendation per Carmakler stage

| Stage | Doporučený tier | Měsíční náklad | Workflow |
|---|---|---|---|
| **MVP** (now — Q3 2026) | Tier 3 (manual + GSC + Bing) | $0 | Manuální měření 2×/měsíc, sledování GSC indexation |
| **Growth** (Q4 2026 — Q2 2027) | Tier 2 (Otterly.AI nebo Rankscale.ai) | $20-30 | Mid-tier tool + manuální spot checks |
| **Scale** (Q3 2027+) | Tier 1 (Profound nebo Semrush AIO) | $500+ | Pouze pokud GEO traffic ≥20 % z total — jinak držet Tier 2 |

**Kritérium pro upgrade:** Citation count >50 measurements/month → upgrade na Tier 2. Citation count >200 measurements/month → evaluate Tier 1.

---

## 7 — Baseline metrics + Y1 cíle

### 7.1 Initial baseline

Baseline měření **Q1 2026** je **prvním měřením po deploy #87b/#87c**, tj. ~2 týdny po `49f680e` (commit z 2026-04-07).

**Očekávaný baseline (vzhledem k tomu, že #87a/b/c jsou čerstvě deployed):**
- Citation count: **0-5** napříč 30 queries × 5 engines (cca 0-3 % citation rate)
- Engines mají indexed sitemap, ale ještě nemají dostatek "trust" signálů (backlinks, brand recognition) pro stabilní citace
- Většina queries vrátí citace pro etablované konkurenty (Sauto, TipCars, Autokelly)

**Záznam baseline:** První measurement session = řádek 1 v master log spreadsheet, označit `notes: "Q1 2026 BASELINE — post-#87c deploy"`.

### 7.2 Y1 targets (per kvartál)

| Metric | Q1 2026 (baseline) | Q2 2026 | Q3 2026 | Q4 2026 |
|---|---|---|---|---|
| **Citation count** (z 150 slots) | 0-5 | 10-20 | 25-40 | **50+** |
| **Citation rate** | <3 % | ~10 % | ~20 % | **33 %+** |
| **Top citation count** (rank 1) | 0 | 2-5 | 8-15 | **20+** |
| **Linked vs textual ratio** | n/a | 30 / 70 | 50 / 50 | **60 / 40** |
| **AI-driven traffic %** (z GA) | 0 % | 1-2 % | 3-5 % | **5-10 %** |
| **llms.txt monthly requests** | unknown | track baseline | 100+ | **500+** |
| **Share of voice vs konkurenti** | <2 % | 5 % | 8 % | **10 %+** |

### 7.3 KPIs vs warning signs

- ✅ **KPI green:** Citation count měsíc-over-měsíc growth ≥10 %
- ⚠️ **Warning yellow:** 2 consecutive months bez growth → review obsah, llms.txt, sitemap freshness
- 🚨 **Alert red:** Citation count drop ≥20 % → okamžitá investigation (možný technical regression — viz §10 playbooks)

---

## 8 — Core SEO health monitoring

> Tato sekce pokrývá **6 metrik**, které měří zdraví core SEO infrastruktury (oddělené od GEO citace v §7). Jsou prerekvizita pro GEO úspěch — pokud SSG count nebo canonical health klesá, GEO výkon se nutně zhorší.

### 8.1 Metric: SSG count

| Aspekt | Hodnota |
|---|---|
| **Definice** | Počet pre-rendered statických stránek z `npm run build` output |
| **How to measure** | `npm run build 2>&1 \| grep -E '○\|●' \| wc -l` |
| **Current baseline** (post-#87c, 2026-04-07) | ~764 SSG pages |
| **Alert threshold** | Drop ≥5 % week-over-week |
| **Action on alert** | `git log --since=1week --oneline` → identify commits affecting `generateStaticParams()` nebo `dynamicParams` |

### 8.2 Metric: Sitemap entries

| Aspekt | Hodnota |
|---|---|
| **Definice** | Počet `<loc>` elementů v `https://carmakler.cz/sitemap.xml` |
| **How to measure** | `curl -s https://carmakler.cz/sitemap.xml \| grep -c '<loc>'` |
| **Current baseline** (post-#87b/c) | ~764+ entries (sitemap obsahuje SSG + dynamic URLs) |
| **Alert threshold** | Drop ≥5 % week-over-week |
| **Action on alert** | Diff sitemap.xml proti baseline (`git show HEAD~7:public/sitemap.xml \| diff - sitemap.xml`), identify missing routes |

### 8.3 Metric: Canonical health

| Aspekt | Hodnota |
|---|---|
| **Definice** | % HTML pages s correct self-referential canonical tag |
| **How to measure (manual)** | Browser console script: `document.querySelector('link[rel=canonical]').href === window.location.href.split('?')[0].split('#')[0]` |
| **How to measure (semi-auto)** | Bash script: `for url in $(cat urls.txt); do curl -sL $url \| grep -oE '<link rel="canonical"[^>]*>' ; done` |
| **Current baseline** (post-#135, commit `542a084`) | Expected 100 % (cleanup #127/#135) |
| **Alert threshold** | <100 % (any canonical drift = bug — §10.2 playbook) |
| **Action on alert** | `grep -rL "pageCanonical" app/**/page.tsx \| grep -v "\\[" ` → identify pages bez `pageCanonical()` helper |

### 8.4 Metric: Indexation rate

| Aspekt | Hodnota |
|---|---|
| **Definice** | % submitted URLs (sitemap.xml), které jsou indexed v Google |
| **How to measure (manual)** | Google Search Console → Sitemaps → carmakler.cz sitemap → "Submitted: X / Indexed: Y" → ratio Y/X |
| **How to measure (API, future)** | `googleapis` Node.js client → `webmasters.sitemaps.get({ siteUrl, feedpath })` — implementace odložena post-#87e |
| **Current baseline** | Unknown (potřebuje first GSC verification po deploy) |
| **Target** | ≥80 % indexation rate |
| **Alert threshold** | <70 % indexation rate |
| **Action on alert** | GSC → URL Inspection per non-indexed URLs → debug crawlability (robots.txt, noindex, 4xx, redirect chains) |

### 8.5 Metric: GEO citations (cross-link na §4)

| Aspekt | Hodnota |
|---|---|
| **Definice** | Citation count z manuálního měření per §3-§5 |
| **How to measure** | Manual benchmark workflow §3 → log per Appendix A |
| **Frekvence** | 2× měsíčně (1. a 15.) |
| **Current baseline** | TBD (first měření po #87c deploy) |
| **Alert threshold** | 2 consecutive měsíce bez growth (per §7.3) NEBO drop ≥20 % vs předchozí měření |
| **Action on alert** | §10.4 playbook (citation drop diagnose) |

### 8.6 Metric: llms.txt requests

| Aspekt | Hodnota |
|---|---|
| **Definice** | Počet HTTP GET requests na `https://carmakler.cz/llms.txt` per měsíc |
| **How to measure** | Server log analysis — `grep "GET /llms.txt" /var/log/nginx/access.log \| wc -l` (na production serveru) |
| **Current baseline** | Unknown (track baseline first 30 days post-deploy) |
| **Target Y1** | 100+ requests/měsíc do Q3 2026, 500+ do Q4 2026 |
| **Alert threshold** | Sudden drop nebo dlouhodobá flat-line po jasném growth period |
| **Action on alert** | Verify file accessibility (`curl https://carmakler.cz/llms.txt`), check že Content-Type je správný (`text/markdown` nebo `text/plain`) |

---

## 9 — Suggested cron schedule

> **Status:** Pseudo-spec only. Skutečná cron implementace je odložena post-#87e (samostatný task pokud bude poptávka). Dokumentuje **kdy** by se měřilo, ne nutně **jak**.

### 9.1 Daily

```cron
# 02:00 — SSG count baseline (po nightly deploy / build)
0 2 * * *   cd /var/www/carmakler && npm run build 2>&1 | grep -cE '○|●' >> /var/log/carmakler/ssg-count.log

# 03:00 — canonical compliance lint (subset 50 random URLs)
0 3 * * *   /var/www/carmakler/scripts/lint-canonicals.sh   # FUTURE
```

### 9.2 Weekly

```cron
# Pondělí 09:00 — sitemap diff vs minulý týden
0 9 * * 1   /var/www/carmakler/scripts/sitemap-diff.sh   # FUTURE

# Pondělí 10:00 — GSC indexation API call (pokud implementováno)
0 10 * * 1  /var/www/carmakler/scripts/gsc-indexation.sh   # FUTURE
```

### 9.3 Bi-weekly (manuální, ne cron)

- **1. v měsíci a 15. v měsíci:** Marketing manager exekuuje manual GEO benchmark per §3-§4 (cca 90 min)
- **Reminder mechanism:** Calendar event v Google Calendar pro Marketing manager + reminder den předem

### 9.4 Monthly

```cron
# 1. v měsíci 08:00 — full report compilation (post-#87e implementace)
0 8 1 * *   /var/www/carmakler/scripts/monthly-seo-report.sh   # FUTURE
```

**Output:** PDF / markdown report s 6 metrik z §8 + GEO citation summary z §4 + Y1 cíle progress z §7.

---

## 10 — Action playbooks

### 10.1 SSG count drop

**Trigger:** SSG count klesl ≥5 % week-over-week (per §8.1 alert).

**Diagnose steps:**
1. `git log --since=1week --oneline` → identify commits to `app/**/page.tsx`, `lib/seo-data.ts`, `next.config.ts`
2. Check pro nové `dynamicParams = true` v page.tsx (= page přepnula z SSG na ISR/SSR)
3. Check pro empty `generateStaticParams()` returns (= nutí Next.js do dynamic rendering)
4. Check pro `force-dynamic` exports v page files (= explicitní opt-out z SSG)

**Fix:**
- Pokud regression je intentional (např. nový dynamic produkt), update §8.1 baseline
- Pokud regression je bug, revert nebo fix `generateStaticParams()` aby vrátila všechny očekávané paths

### 10.2 Canonical drift detected

**Trigger:** Canonical compliance <100 % (per §8.3 alert).

**Diagnose steps:**
1. `grep -rL "pageCanonical" app/**/page.tsx` → list pages bez `pageCanonical()` helper
2. Per page, ověř že `metadata.alternates.canonical` je správně nastavený nebo používá `pageCanonical()` z `lib/canonical.ts`
3. Manual check 5-10 affected URLs v incognito Chrome — view source, hledej `<link rel="canonical">`

**Fix:**
- Add `import { pageCanonical } from "@/lib/canonical"` + `alternates: pageCanonical("/path")` do problematic page
- Build local + verify v `.next/server/app/.../page.html`
- Reference: commit `a5dadb4` (#135 — pageCanonical helper introduction) jako pattern

### 10.3 Indexation rate <80 %

**Trigger:** GSC indexation rate <80 % (per §8.4 target).

**Diagnose steps:**
1. GSC → Sitemaps → carmakler.cz sitemap → klikni "View indexing report"
2. Check "Excluded" sekce — categorize:
   - "Discovered — currently not indexed" → Google ví o URL ale ještě necrawloval (může počkat)
   - "Crawled — currently not indexed" → Google crawloval, ale rozhodl se neindexovat (obsah quality issue)
   - "Page with redirect" → URL přesměrovává jinam (legit pro 301 cleanup)
   - "Duplicate without user-selected canonical" → canonical drift (escalate na §10.2)
   - "Soft 404" → page vrací 200 ale obsah vypadá jako error (content quality issue)
3. Identify top 10 problematic URLs, run URL Inspection per každou

**Fix:**
- Content quality issue → improve page obsah (více textu, lepší meta, odstranit thin content)
- Crawlability issue → check `robots.txt`, `meta robots`, redirect chains
- Duplicate canonical → fix per §10.2

### 10.4 GEO citations 0 ve 2 consecutive months

**Trigger:** GEO citation count = 0 nebo nezvedá se po 2 consecutive měřicích cyklech (per §7.3 warning).

**Diagnose steps:**
1. **Verify llms.txt accessibility:** `curl -I https://carmakler.cz/llms.txt` → musí vrátit 200 OK + správný Content-Type
2. **Verify sitemap freshness:** `curl https://carmakler.cz/sitemap.xml | head -5` → poslední `<lastmod>` musí být recent (≤7 dní)
3. **Verify content quality v top queries:** Manuálně otevři `https://carmakler.cz/dily/znacka/skoda` — má h1, intro, sections, FAQ, AI snippet (per #87c). Pokud chybí, regression.
4. **Verify canonical health per §8.3** — pokud kanonické URL ukazuje jinam, AI engine odkazuje na "wrong" domain
5. **Check Bing Webmaster Tools** — pokud Bing index je 0, ChatGPT (který pohání Bing) nemá data

**Fix podle root cause:**
- llms.txt 4xx/5xx → fix file accessibility
- Sitemap stale → check `app/sitemap.ts`, force rebuild
- Content thin → expand content per #87c template + add 9 H2 brand expansion (#87d v progress)
- Canonical drift → §10.2 playbook
- Bing index empty → submit sitemap do Bing Webmaster Tools manually

---

## 11 — Reference & links

### 11.1 Cross-links na plán-81 a related plans

- **`plan-task-81.md` §C3** — SEO struktura pro `/dily` (původní research, GEO landscape Q4 2025)
- **`plan-task-81.md` §D** — Architectural decisions (SSG vs ISR vs SSR)
- **`plan-task-81.md` §E3.5** — Original geo-benchmark stub (10 queries, basic methodology) — tento dokument je expansion
- **`plan-task-124-3segment-routing.md`** — #87b 3-segment routes (`/dily/znacka/{brand}/{model}/{rok}`)
- **`plan-task-127-canonical-fix.md`** — #135 canonical helper introduction
- **`plan-task-139-87c-seo-content.md`** — #87c SeoContent model + content gen
- **`plan-task-143-87d-revalidation.md`** — #87d on-demand revalidation + 9 H2 brand expansion (in_progress)

### 11.2 External references

- **Google Search Console API docs:** https://developers.google.com/webmaster-tools/v1/api_reference_index
- **Google Search Console (manual):** https://search.google.com/search-console
- **Bing Webmaster Tools:** https://www.bing.com/webmasters
- **Perplexity API docs:** https://docs.perplexity.ai/
- **OpenAI API docs:** https://platform.openai.com/docs

### 11.3 GEO tool research sources

- **Profound:** https://www.tryprofound.com/
- **Otterly.AI:** https://otterly.ai/
- **Rankscale.ai:** https://rankscale.ai/
- **Semrush AIO:** https://www.semrush.com/ (Enterprise plan)
- **SE Ranking:** https://seranking.com/

### 11.4 Internal architecture references

- **`lib/seo.ts`** — JSON-LD generators (Organization, ItemList, FAQPage, BreadcrumbList)
- **`lib/seo-data.ts`** — Brand/model static data, `BASE_URL`
- **`lib/canonical.ts`** — `pageCanonical()` helper (#135)
- **`lib/seo/loadPartsContent.ts`** — DB → template fallback for /dily/znacka pages (#87c)
- **`lib/seo/generatePartsLanding.ts`** — Template factory for SEO content (#87c)
- **`app/sitemap.ts`** — Next.js native sitemap generator
- **`app/llms.txt/route.ts`** — `/llms.txt` endpoint (86 lines, #87a)
- **`app/(web)/dily/znacka/[brand]/page.tsx`** — Brand SEO landing page
- **`app/(web)/dily/znacka/[brand]/[model]/page.tsx`** — Model SEO landing page
- **`app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx`** — Model+year SEO landing page
- **`prisma/schema.prisma`** — `SeoContent` model (#87c)

---

## Appendix A — Log template (CSV)

Master log v Google Sheets, jeden řádek = 1 measurement (query × engine × date).

```csv
date,query_id,query_text,engine,carmakler_cited,citation_rank,citation_type,linked_url,sentiment,competitors_cited,notes
2026-04-15,Q1,"Kde koupit ojeté autodíly Škoda Octavia?",chatgpt,FALSE,,,,neutral,sauto.cz;tipcars.com,not in top 5
2026-04-15,Q1,"Kde koupit ojeté autodíly Škoda Octavia?",perplexity,TRUE,2,linked,https://carmakler.cz/dily/znacka/skoda/octavia,neutral,sauto.cz,Source #2 in panel
2026-04-15,Q1,"Kde koupit ojeté autodíly Škoda Octavia?",claude,FALSE,,,,neutral,,No web search invoked
2026-04-15,Q1,"Kde koupit ojeté autodíly Škoda Octavia?",gemini,TRUE,4,textual,,positive,sauto.cz;autoesa.cz,"Doporučení textem, žádný link"
2026-04-15,Q1,"Kde koupit ojeté autodíly Škoda Octavia?",ai_overviews,FALSE,,,,neutral,sauto.cz,"AI Overview se zobrazil ale Carmakler nezmíněn"
2026-04-15,Q2,"Levné originální díly Volkswagen Passat",chatgpt,...
```

**Sloupce:**
- `date` — ISO format YYYY-MM-DD
- `query_id` — Q1-Q30 (per §4 numbering)
- `query_text` — verbatim query
- `engine` — chatgpt / perplexity / claude / gemini / ai_overviews
- `carmakler_cited` — TRUE / FALSE
- `citation_rank` — integer 1-99 nebo prázdné (pokud FALSE)
- `citation_type` — linked / textual / prázdné
- `linked_url` — full URL pokud linked, jinak prázdné
- `sentiment` — positive / neutral / negative
- `competitors_cited` — semicolon-separated list (sauto.cz;tipcars.com;...)
- `notes` — volný text (anomálie, observations)

---

## Appendix B — Markdown table template pro výsledky

Pro monthly summary report (§9.4) kompiluj z master CSV:

```markdown
## Měsíční GEO summary — {YYYY-MM}

### Citation count per engine

| Engine | Citations / 30 queries | Citation rate | Top citations (rank 1) | Linked / textual |
|---|---|---|---|---|
| ChatGPT | 0 / 30 | 0 % | 0 | 0 / 0 |
| Perplexity | 5 / 30 | 17 % | 2 | 4 / 1 |
| Claude | 0 / 30 | 0 % | 0 | 0 / 0 |
| Gemini | 2 / 30 | 7 % | 0 | 0 / 2 |
| AI Overviews | 1 / 30 | 3 % | 0 | 0 / 1 |
| **Total** | **8 / 150** | **5 %** | **2** | **4 / 4** |

### Citation per category

| Kategorie | Brand discovery | Long-tail | Educational | Service | Competitor |
|---|---|---|---|---|---|
| Citations | 3 | 2 | 1 | 1 | 1 |

### Share of voice (top 5 brands)

| Brand | Mentions | % share |
|---|---|---|
| Sauto.cz | 45 | 30 % |
| Autokelly.cz | 25 | 17 % |
| TipCars.com | 18 | 12 % |
| **Carmakler.cz** | **8** | **5 %** |
| Bazoš.cz | 7 | 5 % |

### Trend vs předchozí měření

| Metric | Předchozí | Aktuální | Δ |
|---|---|---|---|
| Total citations | 5 | 8 | +60 % ✅ |
| Top-1 citations | 1 | 2 | +100 % ✅ |
| Share of voice | 3 % | 5 % | +2 p.p. ✅ |

### Notable observations

- Perplexity začalo citovat `/dily/znacka/skoda/octavia` po 2 týdnech od deploye
- ChatGPT zatím zcela bez citation — zvážit Bing Webmaster Tools manual sitemap submission
- ...
```

---

## Appendix C — Glossary

| Termín | Definice |
|---|---|
| **GEO** | Generative Engine Optimization — optimalizace obsahu pro citaci v AI-generated odpovědích |
| **AEO** | Answer Engine Optimization — synonymum pro GEO, používá se zaměnitelně |
| **AI Overviews** | Google's AI-generated summary nad SERP (dříve "Search Generative Experience") |
| **Citation** | Zmínka brandu nebo URL v AI engine odpovědi (linked nebo textual) |
| **Linked citation** | Citace s kliknutelným odkazem na carmakler.cz |
| **Textual mention** | Zmínka brand name bez odkazu — slabší signal než linked, ale stále tracking-worthy |
| **Citation rank** | Pozice citace v rámci jedné odpovědi (1st = top, deep = >5th) |
| **Share of voice** | % zmínek brandu vs konkurenti v daném query setu |
| **Snippet** | Krátký textový extract, který AI engine zobrazí jako "summary" před zdrojem |
| **llms.txt** | Standard pro deklaraci LLM-friendly content (analog robots.txt pro AI engines) — `app/llms.txt/route.ts` |
| **SSG** | Static Site Generation — Next.js pre-rendering build-time (`generateStaticParams` + `dynamicParams=false`) |
| **ISR** | Incremental Static Regeneration — SSG s background revalidace (`revalidate = N`) |
| **Canonical drift** | Stav kdy `<link rel="canonical">` URL neodpovídá actual page URL → SEO bug, AI engines to penalizují |

---

**Konec dokumentu.** Pro otázky nebo updates kontaktuj Marketing manager nebo Product Owner.
