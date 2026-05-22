---
name: Plán #142 — #87e DOCS geo-benchmark.md + monitoring
description: Implementační plán pro #87e (queue #99) — vytvoření `.claude-context/docs/geo-benchmark.md` (manuální metodika měření GEO/AI search visibility napříč ChatGPT/Perplexity/Claude/Gemini/AI Overviews) + monitoring sekce s metrikami k pravidelnému trackování (SSG count, sitemap entries, canonical health, indexation rate, GEO citations) včetně suggested cron schedule. Plán pokrývá obsahovou strukturu, query templates, tool recommendations a baseline metrics, ale samotný DOCS write je odpovědnost implementatora.
type: plan
task_id: 142
queue_id: 142
parent_plan: plan-task-81.md
related_plans:
  - plan-task-124-3segment-routing.md (#87b — 3-segment routing, completed)
  - plan-task-127-canonical-fix.md (#135 — canonical fix, completed)
  - plan-task-139-87c-seo-content.md (#97 — SeoContent model, in_progress)
related_followups:
  - "#87d IMPL (queue #98) — On-demand revalidation API + 9 H2 expansion (paralelní; #142 plán pro #87d nezávislý)"
revision_history:
  - 2026-04-07 — initial draft (planovac, dispatch #142)
  - 2026-04-07 — lead-approved Q1-Q6 (team-lead): Strategie all-in-one + interní docs location schválena. Q1 ✅ `.claude-context/docs/`, Q2 ✅ all-in-one, Q3 ✅ enterprise tier INCLUDE (mark jako "evaluate Y2+"), Q4 ✅ pseudo-spec only pro cron, Q5 ✅ 30 queries lock pro Y1 (+ dokumentovat "mid-quarter změny zničí trend"), Q6 ✅ defer GSC API post-#87e. #144 IMPL docs task vytvořen pending (#87e DOCS).
---

# Plán #142 — #87e DOCS geo-benchmark.md + monitoring

> **Cíl:** Konkretizovat plán-81 §E3.5 (původní geo-benchmark stub) do production-ready dokumentace + monitoring sekci, která dá Carmakler týmu **opakovatelný proces měření AI search visibility** v ekosystému LLM-driven discovery (ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews) + **automatizovanější metriky pro core SEO health** (SSG count, indexation rate, canonical compliance, sitemap entries). Doc-only task — žádný kód, žádné Prisma změny, žádné npm scripty.

---

## 0 — Executive summary (TL;DR)

**Co plán dodává:**
1. **`.claude-context/docs/geo-benchmark.md`** — ~600-800 řádků markdown:
   - GEO methodology (proč měřit, jak měřit, jak interpretovat)
   - Manuální query templates (3 kategorie × 10 queries = 30 testovacích promptů, CZ primary + EN backup)
   - 5 AI engine tracking sloty (ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews)
   - Citation detection methodology (textuální vs. linkovaná, ranking heuristics)
   - Tool catalog (research findings — 4 tier: enterprise / mid-market / budget / DIY)
   - Baseline metrics + Y1 cíle
   - Manual benchmark schedule (2× měsíčně) + log template
2. **Monitoring sekce** v geo-benchmark.md (nebo separátní `.claude-context/docs/seo-monitoring.md`) — ~150-200 řádků:
   - 6 core metrics k periodickému trackování (SSG count, sitemap entries, canonical health, indexation rate, GEO citations, llms.txt requests)
   - Suggested cron schedule + tooling (Google Search Console API + custom scripts placeholder)
   - Alert thresholds + action playbooks
3. **8-10 acceptance criteria** ověřující pokrytí všech sekcí + linting markdown + cross-link s plán-81

**Strategický klíč:** Tento DOCS task uzavírá #87 SEO chain (#87 → #87a → #87b → #87c → #87d → **#87e**). Po dokončení tým má:
- ✅ SSG infrastructure (#87a + #87b)
- ✅ Canonical compliance (#127/#135)
- ✅ Dynamic content layer (#87c — pending dispatch)
- ✅ On-demand revalidation (#87d — pending plán)
- ✅ **Měřitelný GEO methodology** (#87e — tento task)

**Co plán NEMĚNÍ:**
- ✅ Žádný production kód
- ✅ Žádný Prisma schema
- ✅ Žádný `app/sitemap.ts` / `app/llms.txt/route.ts` (oba existují z #87a, jen referenced v dokumentu)
- ✅ Žádný `package.json` script

**Co plán NEŘEŠÍ (out of scope):**
- ❌ Implementace monitoring scriptů jako kód → odložit do post-#87e follow-up
- ❌ Google Search Console API integration jako runtime endpoint → odložit (samostatný task pokud bude poptávka)
- ❌ Real-time GEO crawler / scraping nástroje → metrology document only
- ❌ A/B testing different llms.txt versions → mimo MVP
- ❌ AI agent simulation pro automated GEO testing → mimo scope, blocked by absence dedikovaného scrapers

---

## 1 — Analysis: current state

### 1.1 Co už existuje (post-#87a + #87b + #135)

**SEO infrastructure deployed LIVE na carmakler.cz:**

| Component | Lokace | Status |
|---|---|---|
| **`/llms.txt` endpoint** | `app/llms.txt/route.ts` (#87a) | ✅ LIVE — 86 řádků markdown s 4 produkty + služby + kontakty |
| **`app/sitemap.ts`** | Next.js native sitemap generator | ✅ LIVE — obsahuje 3-segment routes |
| **3-segment SSG routes** | `/dily/znacka/{brand}/{model}/{rok}` | ✅ LIVE (#87b commit `1466223`) |
| **Canonical helper** | `lib/canonical.ts` (`pageCanonical()`) | ✅ LIVE (#135 commit `a5dadb4` + `542a084`) |
| **JSON-LD generators** | `lib/seo.ts` (Organization, ItemList, FAQPage, BreadcrumbList) | ✅ LIVE od #87a |
| **Slugify + diacritics 301 redirect** | `lib/seo/slugify.ts` + `middleware.ts` (#132) | ✅ LIVE od `3666bad` |

**Co plán-81 §E3.5 specifikoval (pouze stub):**
- 10 manual test queries (3 brand-level + 4 long-tail + 3 educational)
- Měření tabulka (Query × ChatGPT/Perplexity/AI Overview/Gemini × Date)
- 3 Y1 cíle (50+ citations/month, 5-10% AI traffic, llms.txt request tracking)
- **Žádný tool catalog**, žádný citation detection workflow, žádný monitoring sekce

**Gap k vyřešení v #87e:**
- ❌ Žádný systematický tool catalog (plán-81 napsán Q4/2025, GEO landscape se výrazně rozšířil)
- ❌ Žádný **opakovatelný workflow** pro 1 měření (kdo měří, jak často, kam loguje)
- ❌ Žádný citation detection metodology (jak rozlišit "carmakler.cz citováno" vs. "carmakler zmíněno bez linku")
- ❌ Žádné monitoring metrics pro core SEO health (SSG count, canonical drift, indexation rate)

### 1.2 Co plán-81 §E3.5 obsahuje (verbatim)

> **Soubor:** `docs/geo-benchmark.md`
>
> Test queries (CZ): brand-level (4), long-tail (3), educational (3) = 10 queries
> Měření tabulka: Query × 4 engines × Date
> Y1 cíle: 50+/měsíc citations, 5-10% AI traffic, llms.txt request tracking

**Pozn:** plán-81 navrhoval `docs/geo-benchmark.md`, ale dispatch #142 explicit cestu **`.claude-context/docs/geo-benchmark.md`** (interní dokumentace, ne customer-facing). Implementator MUSÍ použít cestu z dispatche.

### 1.3 Adresářová struktura `.claude-context/`

```
.claude-context/
├── checklists/   (zatím prázdné nebo neexistuje — nutno ověřit)
├── tasks/        (existuje — 50+ plán souborů)
└── docs/         ← NOVÝ adresář (mkdir při #87e IMPL)
    └── geo-benchmark.md   ← NOVÝ
```

**Implementator action:** Pokud `.claude-context/docs/` neexistuje, vytvořit ho.

### 1.4 Verified facts (cross-check s codebase)

**`app/llms.txt/route.ts:1-86`** — verbatim obsahuje:
- 6 hlavních produktů (Eshop /dily, Vrakoviště, Nabídka aut, Chci prodat, Inzerce, Marketplace VIP)
- 3 služby (Cebia, Financování, Pojištění)
- 6 klíčových vlastností (verified vrakoviště, VIN compatibility, katalogizovaný inventář, doprava, záruka, B2C reklamace)
- Sekce pro vrakoviště (registrace + PWA)
- Kontakt (info@carmakler.cz, Praha)
- 4 právní dokumenty
- Sitemap link

**Implikace pro geo-benchmark.md:** AI engines mají dostatek strukturovaného kontextu o Carmakler ekosystému. Test queries by měly cílit na:
1. **Brand discovery queries** ("kde koupit ojeté autodíly Škoda") → ověření že /dily landing pages se citují
2. **Long-tail product queries** ("brzdové destičky Octavia 3 cena") → ověření 3-segment routes
3. **Service queries** ("zprostředkovatel prodeje auta provize") → ověření makléř landing pages
4. **Educational queries** ("rozdíl originál vs aftermarket") → ověření FAQ snippet sekcí
5. **Competitor benchmark queries** ("nejlepší vrakoviště ČR online") → market positioning

---

## 2 — Architecture: doc structure design

### 2.1 Volba: 1 soubor vs 2 soubory?

**Option A: All-in-one** — `.claude-context/docs/geo-benchmark.md` obsahuje BOTH GEO methodology AND core SEO monitoring
- ✅ Single source of truth, snazší údržba
- ✅ Jeden review cyklus
- ❌ ~800-1000 řádků = velký soubor

**Option B: Split** — `geo-benchmark.md` (GEO) + `seo-monitoring.md` (core SEO health)
- ✅ Logická separace (GEO = AI visibility, monitoring = core SEO infra health)
- ✅ Snazší linking z jiných docs
- ❌ 2 soubory na údržbu

**Doporučení:** **Option A (all-in-one)** pro #87e MVP. Pokud se monitoring sekce rozroste >300 řádků v budoucnu, refactor na split v separate task. Důvod: tým je malý, jeden soubor = jeden review.

### 2.2 Doc structure outline (per Option A)

```markdown
# GEO Benchmark + SEO Monitoring — Carmakler

## 1. Účel a kontext
   1.1 Proč GEO?
   1.2 Co se měří
   1.3 Pro koho je tento dokument
   1.4 Frekvence aktualizací

## 2. GEO methodology
   2.1 Co je generative engine optimization
   2.2 Klíčové metriky (citation count, sentiment, share of voice)
   2.3 Engine landscape (ChatGPT/Perplexity/Claude/Gemini/AI Overviews)
   2.4 Citation types (linked vs textual mention)
   2.5 Ranking interpretation (top citation vs deep citation)

## 3. Manual benchmark workflow
   3.1 Předpoklady (browser profile, anonymous mode, location)
   3.2 Step-by-step měření (jak otevřít, jak zaznamenat)
   3.3 Log template
   3.4 Frekvence (2× měsíčně, 1. a 15. v měsíci)
   3.5 Owner (kdo měří)

## 4. Test queries (30 queries — 5 kategorií × 6)
   4.1 Brand discovery (6)
   4.2 Long-tail product (6)
   4.3 Educational / informational (6)
   4.4 Service / makléř (6)
   4.5 Competitor benchmark (6)

## 5. Citation tracking
   5.1 Detection workflow (text search, link search)
   5.2 Ranking heuristics
   5.3 False positive filter (Carmakler vs ostatní brandy se slovem "Car")
   5.4 Tracking spreadsheet template (CSV layout)

## 6. Tool catalog (4-tier)
   6.1 Enterprise (Profound, Semrush Enterprise AIO, SE Ranking)
   6.2 Mid-market (Otterly.AI, Rankscale.ai, Writesonic)
   6.3 Budget (Google Search Console + manual verification)
   6.4 DIY (custom Node.js scripts placeholder)
   6.5 Recommendation per Carmakler stage (MVP / growth / scale)

## 7. Baseline metrics + Y1 cíle
   7.1 Initial baseline (kvartální měření)
   7.2 Y1 targets (Q1-Q4 2026)
   7.3 KPIs vs warning signs

## 8. Core SEO health monitoring
   8.1 Metric: SSG count (build output)
   8.2 Metric: Sitemap entries (sitemap.xml <loc> count)
   8.3 Metric: Canonical health (% pages s correct canonical)
   8.4 Metric: Indexation rate (Google Search Console API)
   8.5 Metric: GEO citations (cross-link na §4)
   8.6 Metric: llms.txt requests (server log analysis)

## 9. Suggested cron schedule
   9.1 Daily (build SSG count, lint canonical compliance)
   9.2 Weekly (sitemap diff, indexation API call)
   9.3 Bi-weekly (manual GEO benchmark per §3-§4)
   9.4 Monthly (full report compilation, baseline comparison)

## 10. Action playbooks
   10.1 SSG count drop → diagnose
   10.2 Canonical drift detected → diagnose + fix
   10.3 Indexation rate <80% → diagnose
   10.4 GEO citations 0 ve 2 consecutive months → escalation

## 11. Reference & links
   11.1 Cross-links na plán-81 §C3, §D, §E3.5
   11.2 Google Search Console API docs
   11.3 GEO tool research sources
   11.4 Internal architecture references (lib/seo.ts, app/sitemap.ts, app/llms.txt/route.ts)

## Appendix A — Log template (CSV)
## Appendix B — Markdown table template pro výsledky
## Appendix C — Glossary (GEO, AEO, AI Overviews, citation, snippet)
```

**Total estimated length:** 600-800 markdown řádků (per dispatch lower bound).

### 2.3 Strategie obsahu sekcí

| Sekce | Hloubka | Formát | Příklad |
|---|---|---|---|
| §1 Účel | High-level | Prózní text | "GEO měření zajišťuje, že..." |
| §2 Methodology | Vzdělávací | Bullet lists + tabulky | Engine landscape table |
| §3 Workflow | Akční | Numbered steps + checklisty | "1. Otevři incognito, 2. Set location na CZ..." |
| §4 Queries | Concrete | Bullet lists | 30 queries doslovně |
| §5 Citation tracking | Technický | Tabulky + screenshots placeholder | False positive examples |
| §6 Tool catalog | Reference | 4 sub-sekce s comparison tables | Pricing + features per tool |
| §7 Baseline metrics | Quantitative | Tabulky s Y1 cíli | Q1: 10 citations, Q2: 25, ... |
| §8 Monitoring metrics | Akční | Per-metric: definition + how-to-measure + alert threshold | "SSG count: `npm run build \| grep 'Generating'`, alert if drop >5%" |
| §9 Cron schedule | Akční | Cron expressions + script names placeholder | "0 9 * * 1 — weekly sitemap diff" |
| §10 Action playbooks | Akční | Numbered diagnose steps | "If canonical drift: 1. Run grep ..., 2. Diff ..." |
| §11 References | Reference | Bullet links | Links na external + internal |

---

## 3 — Detailed design per section

### 3.1 §1 Účel a kontext

**Obsah (cca 80-100 řádků):**

- **§1.1 Proč GEO?** Vysvětlení rozdílu SEO vs GEO, AI search disruption ekosystému, business case pro Carmakler (CZ first-mover v parts vertikále)
- **§1.2 Co se měří**: GEO = visibility v AI engine outputs (ne ranking jako SEO). Klíčové: citation count, citation rank, sentiment, share of voice vs konkurence
- **§1.3 Pro koho**: Marketing tým (čtenář), product owner (decisions), tech tým (monitoring scripts implementace post-#87e)
- **§1.4 Frekvence**: GEO benchmark 2× měsíčně, monitoring metrics daily/weekly per metrika

### 3.2 §2 GEO methodology

**Obsah (~120-150 řádků):**

- **§2.1 GEO definice** s odkazem na 2026 industry source (research findings)
- **§2.2 Klíčové metriky:**
  - Citation count (kolikrát se URL/brand objeví v AI odpovědi za N queries)
  - Citation rank (1st = top, deep = >5th pozice)
  - Sentiment (pozitivní / neutrální / negativní zmínka)
  - Share of voice (% zmínek vs. konkurenti — Sauto, TipCars, Bazoš, Mobile.de, Autokelly, AutoESA)
- **§2.3 Engine landscape table:**
  ```
  | Engine | Tržní podíl CZ | Citation style | API access | Notes |
  |---|---|---|---|---|
  | ChatGPT | ~35-40% | Web mode = linked, Default = textual | Search API limited | 700M+ users globally |
  | Perplexity | ~10-15% | Always linked, sources panel | Public API ($) | Best citation transparency |
  | Claude (Anthropic) | <5% | Linked v search mode | API access | Integrated in Claude.ai web |
  | Gemini (Google) | ~15-20% | Mixed | Vertex AI | Google search integration |
  | Google AI Overviews | ~30%+ | Mixed | Search API ($$) | Inline v SERP |
  ```
- **§2.4 Citation types:** linked (`[Carmakler](https://carmakler.cz)`) vs textual mention ("podle Carmakler, ojeté díly stojí..."). Linked je "hard win", textual je "brand awareness win". Měřit obě.
- **§2.5 Ranking interpretation:** Top citation = první zmínka v odpovědi, deep = >3. pozice. Top má 3-5× větší conversion rate.

### 3.3 §3 Manual benchmark workflow

**Obsah (~80-100 řádků):**

**§3.1 Předpoklady (přesný checklist):**
- Browser: Chrome incognito (žádné cookies)
- Lokace: CZ (VPN pokud měříte ze zahraničí)
- Account: nepřihlášený (anonymous, žádný personalization bias)
- Engines: ChatGPT (chatgpt.com), Perplexity (perplexity.ai), Claude (claude.ai/new), Gemini (gemini.google.com), Google (google.com/search → AI Overview activated)

**§3.2 Step-by-step měření per engine:**
```
1. Otevři incognito tab v Chrome
2. Nastav search engine na cílový (např. perplexity.ai)
3. Vlož query #N z §4 (např. "kde koupit ojeté autodíly Škoda Octavia")
4. Počkej na full response
5. Zaznamenej:
   - Carmakler citation: ANO/NE
   - Pokud ANO: pozice (1st/2nd/3rd/deep), typ (linked/textual)
   - Konkurenti zmíněni: list
   - Screenshot (volitelné)
6. Zapiš do log spreadsheet (Appendix A)
7. Repeat pro každou query v §4
8. Repeat pro každý engine v §2.3
```

**§3.3 Log template (cross-link na Appendix A):**

CSV layout per měření (jeden řádek = 1 query × 1 engine × 1 datum):
```
date,query_id,query_text,engine,carmakler_cited,citation_rank,citation_type,competitors_cited,notes
2026-04-15,Q1,"kde koupit ojeté autodíly Škoda",chatgpt,FALSE,,,sauto.cz;tipcars.com,not in top 5
2026-04-15,Q1,"kde koupit ojeté autodíly Škoda",perplexity,TRUE,2,linked,sauto.cz,carmakler.cz/dily/znacka/skoda
```

**§3.4 Frekvence:**
- 1. v měsíci (předchozí měření) + 15. v měsíci (mid-month) = 2× měsíčně
- 30 queries × 5 engines = 150 measurement rows per měření
- Estimated time: ~90 min per měření (s log writing)

**§3.5 Owner:**
- Primary: Marketing manager
- Backup: Product Owner
- Reviewer: CTO (sanity check anomálií)

### 3.4 §4 Test queries (30 queries — final list)

**Implementator MUSÍ do plánu zahrnout těchto 30 queries strukturovaných po 6 v 5 kategoriích:**

**§4.1 Brand discovery (6):**
1. "Kde koupit ojeté autodíly Škoda Octavia?"
2. "Levné originální díly Volkswagen Passat"
3. "Použité díly BMW 3 series F30"
4. "Originální díly Audi A4 B9 cena"
5. "Náhradní díly Ford Focus z vrakoviště"
6. "Hyundai i30 použité díly Praha"

**§4.2 Long-tail product (6):**
7. "Brzdové destičky Škoda Fabia 2018 cena"
8. "Použitý motor 1.9 TDI Octavia 2"
9. "Tlumiče VW Golf 7 cena"
10. "Spojka BMW E90 320d kompletní"
11. "Světlomet Audi A4 B8 levý"
12. "Převodovka Hyundai i30 manuální"

**§4.3 Educational / informational (6):**
13. "Jaký je rozdíl mezi originálními a aftermarket díly?"
14. "Jak ověřit kompatibilitu náhradního dílu podle VIN?"
15. "Záruka na použité autodíly v ČR"
16. "Kolik stojí výměna brzdových kotoučů Octavia 3?"
17. "Reklamace použitého dílu z vrakoviště — postup"
18. "Jak poznat kvalitní použitý díl z vrakoviště?"

**§4.4 Service / makléř (6):**
19. "Zprostředkovatel prodeje auta provize"
20. "Bezplatné ocenění ojetého auta online"
21. "Jak rychle prodat auto bez bazaru?"
22. "Carmakler nebo Sauto pro prodej auta?"
23. "Komisní prodej auta cena"
24. "Cebia prověření vozu cena"

**§4.5 Competitor benchmark (6):**
25. "Nejlepší online vrakoviště v ČR"
26. "Alternativy k Sauto.cz pro prodej auta"
27. "Marketplace pro investování do aut ČR"
28. "Eshop autodíly s VIN vyhledáváním"
29. "Inzerce ojetých aut srovnání"
30. "Carmakler recenze 2026"

**Pozn:** Plán-81 §E3.5 měl jen 10 queries. Tato expanze na 30 (3× scale) je odůvodněná: pokrytí hlavních produktů (parts, brokerage, marketplace) + edukační content + competitive intel.

### 3.5 §5 Citation tracking detail

**Obsah (~80-100 řádků):**

- **§5.1 Detection workflow:**
  - Text search: Cmd+F "carmakler" v AI response
  - Link search: hover přes každý odkaz, zkontroluj domain
  - Source panel inspection (Perplexity má dedikovaný sources tab)
- **§5.2 Ranking heuristics:**
  - 1st citation in response = score 5
  - 2nd = score 4
  - 3rd-5th = score 3
  - 6th-10th = score 2
  - >10th nebo "deep" = score 1
  - Žádná citation = score 0
- **§5.3 False positive filter:**
  - "carmakler" matchne i jiné brandy? Pravděpodobně ne (unique CZ brand). Ale pozor na typo "carmaker" (anglické generic word).
  - Vždy verify: link MUSÍ obsahovat `carmakler.cz` (root nebo subdoména)
- **§5.4 Tracking spreadsheet template** — viz Appendix A

### 3.6 §6 Tool catalog (4-tier)

**Obsah (~150-180 řádků) — most extensive section:**

#### §6.1 Tier 1 — Enterprise ($500-2000+/měsíc)
- **Profound** — Market leader 2026, comprehensive GEO suite (citation tracking, sentiment, competitive analysis). Použít pokud >$50K/year SEO budget.
- **Semrush Enterprise AIO** — Granular tracking ChatGPT/AI Mode/Perplexity, mentions/sentiment/share of voice. Pokud Carmakler už platí Semrush Pro, upgrade na AIO.
- **SE Ranking** — Embedded GEO tracking v broader SEO stack, cost-effective vs Profound.

#### §6.2 Tier 2 — Mid-market ($30-200/měsíc)
- **Otterly.AI** ($29/měsíc) — Best pro Google AI Overviews focus. Český trh přes Google = vysoká relevance.
- **Rankscale.ai** ($20/měsíc) — Essential visibility monitoring, budget-friendly start.
- **Writesonic** — Content production angle, helps engineer citation-friendly content (komplementární k tracking).

#### §6.3 Tier 3 — Budget / free (zdarma)
- **Google Search Console** (zdarma) — Indexation, queries, click-through. Žádné GEO direct, ale baseline.
- **Manuální měření per §3-§4** (zdarma) — Time-intensive, ale 100% kontrola.
- **Bing Webmaster Tools** (zdarma) — Bing pohání ChatGPT search → trackuje dopad.

#### §6.4 Tier 4 — DIY custom (Node.js placeholder)
- **Concept:** Node.js script s headless Chrome (Puppeteer) → automatický probe ChatGPT/Perplexity API → log do JSON
- **Status v #87e:** Pouze placeholder + research notes. Implementace je separátní task post-#87e (pokud bude poptávka).
- **Pseudo-architektura:**
  ```
  scripts/geo-benchmark-cron.ts (FUTURE — NOT v #87e scope)
    → načti queries z config
    → for each engine API:
       → POST query
       → parse response for "carmakler.cz" mentions
       → score per §5.2
    → upsert do db / json log
    → alert pokud score drop >20% week-over-week
  ```

#### §6.5 Recommendation per Carmakler stage:
- **MVP (now-Q3 2026):** Tier 3 (manual + GSC) — $0
- **Growth (Q4 2026-Q2 2027):** Tier 2 (Otterly.AI nebo Rankscale.ai) — $20-30/měsíc
- **Scale (Q3 2027+):** Tier 1 (Profound nebo Semrush AIO) — $500+/měsíc, pouze pokud GEO traffic >20% z total

### 3.7 §7 Baseline metrics + Y1 cíle

**Obsah (~80-100 řádků):**

**§7.1 Initial baseline (kvartální měření):**
- Q1 2026 baseline (tento sprint po deploy #87b/#87c): probably 0-5 citations across 30 queries × 5 engines = 0-3% citation rate
- Záznam baseline jako řádek 1 v master log spreadsheet

**§7.2 Y1 targets (per kvartál):**

| Metric | Q1 2026 (baseline) | Q2 2026 | Q3 2026 | Q4 2026 |
|---|---|---|---|---|
| Citation count (30 queries × 5 engines = 150 slots) | 0-5 | 10-20 | 25-40 | 50+ |
| Citation rate | <3% | ~10% | ~20% | 33%+ |
| Top citation count (rank 1) | 0 | 2-5 | 8-15 | 20+ |
| Linked vs textual ratio | n/a | 30/70 | 50/50 | 60/40 |
| AI-driven traffic % (z GA) | 0% | 1-2% | 3-5% | 5-10% |
| llms.txt monthly requests | unknown | track baseline | 100+ | 500+ |

**§7.3 KPIs vs warning signs:**
- ✅ KPI: Citation count měsíc-over-měsíc grow ≥10%
- ⚠️ Warning: 2 consecutive months bez growth
- 🚨 Alert: Citation count drop ≥20% (možný technical regression — test SSG, sitemap, llms.txt)

### 3.8 §8 Core SEO health monitoring metrics

**Obsah (~120-150 řádků) — second extensive section:**

**§8.1 Metric: SSG count**
- Definition: Počet pre-rendered statických stránek z `npm run build` output
- How to measure: `npm run build 2>&1 | grep -E '○|●' | wc -l` (or specific Next.js output parser)
- Current baseline (post-#87b): ~764 SSG pages
- Alert threshold: drop ≥5% week-over-week
- Action: Run `git log --since=1week`, identify recent commit affecting `generateStaticParams` nebo `dynamicParams`

**§8.2 Metric: Sitemap entries**
- Definition: Počet `<loc>` elementů v `https://carmakler.cz/sitemap.xml`
- How to measure: `curl -s https://carmakler.cz/sitemap.xml | grep -c '<loc>'`
- Current baseline (post-#87b): ~764+ entries (sitemap obsahuje SSG + dynamic URLs)
- Alert threshold: drop ≥5% week-over-week
- Action: Diff sitemap.xml proti baseline, identify missing routes

**§8.3 Metric: Canonical health**
- Definition: % HTML pages s correct self-referential canonical tag
- How to measure (manual): Run browser-side script per 50 random URLs, check `<link rel="canonical" href="...">` matches request URL (po stripping query/hash)
- How to measure (semi-automated): bash script s `curl -s URL | grep canonical` per URL list
- Current baseline (post-#135): expected 100% (cleanup commit `542a084`)
- Alert threshold: drop <100% (any canonical drift = bug)
- Action: Run grep `canonical:` in `app/**/page.tsx`, find pages bez `pageCanonical()` helper

**§8.4 Metric: Indexation rate**
- Definition: % of submitted URLs (sitemap.xml) které jsou skutečně indexed v Google
- How to measure:
  - **Manual:** Google Search Console → Sitemaps → carmakler.cz sitemap → "Submitted: X / Indexed: Y" → ratio Y/X
  - **API:** Google Search Console API endpoint `webmasters.sitemaps.get(siteUrl, feedpath)` (Node.js client `googleapis` package). Implementace odložena post-#87e.
- Current baseline: unknown (potřebuje first GSC verification)
- Target: ≥80% indexation rate
- Alert threshold: <70% indexation rate
- Action: Identify non-indexed URLs via GSC URL Inspection tool, debug crawlability

**§8.5 Metric: GEO citations** (cross-link na §4)
- Definition: Citation count z manuálního měření per §3-§5
- How to measure: Manual benchmark workflow (§3)
- Frekvence: 2× měsíčně
- Alert threshold: 2 consecutive měsíce bez growth (per §7.3)
- Action: Diagnose — content quality? llms.txt updates? technical regression?

**§8.6 Metric: llms.txt requests**
- Definition: Počet HTTP GET requests na `https://carmakler.cz/llms.txt` per měsíc
- How to measure: Server access log analysis
  - **Manual:** SSH `grep "GET /llms.txt" /var/log/nginx/access.log | wc -l`
  - **Automated:** Add log rotation + monthly cron summary
- Current baseline: unknown (potřebuje first server log check)
- Target Q3 2026: 100+ requests/měsíc
- Alert threshold: 0 requests in měsíc (broken endpoint nebo crawler block)
- Action: Verify endpoint live (`curl https://carmakler.cz/llms.txt`), check server log filter

### 3.9 §9 Suggested cron schedule

**Obsah (~50-70 řádků):**

**§9.1 Daily (např. 03:00 UTC):**
- Build SSG count snapshot — `npm run build` output → log JSON timestamp + count
- Lint canonical compliance — script grep `pageCanonical(` v `app/**/page.tsx`, expect ≥30 occurrences

**§9.2 Weekly (např. pondělí 09:00 UTC):**
- Sitemap entries count — `curl sitemap.xml | grep -c '<loc>'` → log
- Sitemap diff vs předchozí týden — alert pokud drop ≥5%
- Indexation API call (Google Search Console webmasters API) — log submitted/indexed counts
- Server log monthly partial — `grep llms.txt access.log`

**§9.3 Bi-weekly (1. a 15. v měsíci, 10:00 UTC):**
- Manual GEO benchmark per §3-§4 (owner: Marketing manager)
- Update master CSV log (Appendix A)
- Review log proti Y1 targets (§7.2)

**§9.4 Monthly (1. v měsíci, 14:00 UTC):**
- Full report compilation:
  - SSG count delta month-over-month
  - Sitemap delta
  - Indexation rate trend
  - Canonical health status
  - GEO citation total per kvartál target
  - llms.txt requests total
- Send report do team Slack/email
- Baseline comparison s Y1 targets, flag warnings (§7.3)

**Pozn:** Cron jobs jsou pseudo-spec. Implementace jako runtime scripts je separátní task post-#87e (pokud bude poptávka). Tento dokument popisuje **co** + **kdy** + **jak měřit**, ne **runnable cron entries**.

### 3.10 §10 Action playbooks

**Obsah (~80-100 řádků):**

**Šablona per playbook:**
```
## Playbook: <metric drop scenario>

**Trigger:** <condition>
**Severity:** P0/P1/P2/P3
**Owner:** <role>
**Diagnose steps (numbered):**
1. <step>
2. <step>
**Mitigation (numbered):**
1. <step>
**Verification:**
- <how to confirm fix>
**Escalation:**
- If not resolved in <X hours>: page <role>
```

**Concrete playbooks:**
- **§10.1 SSG count drop ≥5%** — Diagnose: git log --since=1week --oneline, find commit affecting generateStaticParams. Mitigation: revert nebo fix per case. Verify: re-run build, count restored.
- **§10.2 Canonical drift detected** — Diagnose: grep `pageCanonical(` v app/**/page.tsx, find page bez helperu. Mitigation: add `pageCanonical()` per pageCanonical pattern (#135). Verify: page metadata includes correct canonical.
- **§10.3 Indexation rate <80%** — Diagnose: GSC URL Inspection on top 10 non-indexed. Common causes: noindex meta, robots.txt block, server error, soft 404. Mitigation: per cause. Verify: GSC re-inspection po 2 týdnech.
- **§10.4 GEO citations 0 in 2 consecutive months** — Diagnose: ověř llms.txt endpoint, ověř content updates v posledních 30 dnech, ověř že content je crawlable. Escalation: P2, marketing manager → CTO consult.

### 3.11 §11 Reference & links

**Obsah (~30-50 řádků):**

- Cross-links na plán-81 §C3, §D, §E3.5 (původní GEO concept)
- Cross-link na plán-139 (#87c SeoContent)
- Google Search Console API docs (`developers.google.com/search/apis/indexing-api/v3/quickstart` — pozor, NEVKLÁDAT URL doslovně, jen reference jak k ní najít)
- GEO industry references (research findings — viz Sources sekce na konci tohoto plánu)
- Internal architecture references:
  - `lib/seo.ts` — JSON-LD generators
  - `app/sitemap.ts` — Next.js sitemap
  - `app/llms.txt/route.ts` — llms.txt endpoint
  - `lib/canonical.ts` — pageCanonical helper

### 3.12 Appendix A — Log template (CSV)

**Obsah (~30-40 řádků):**

CSV layout (jeden řádek = 1 query × 1 engine × 1 datum):
```csv
date,measurer,query_id,query_text,query_category,engine,carmakler_cited,citation_rank,citation_score,citation_type,competitors_cited,carmakler_url_cited,notes
2026-04-15,marketing-mgr,Q1,"kde koupit ojeté autodíly Škoda",brand_discovery,perplexity,TRUE,2,4,linked,sauto.cz;tipcars.com,https://carmakler.cz/dily/znacka/skoda,
2026-04-15,marketing-mgr,Q1,"kde koupit ojeté autodíly Škoda",brand_discovery,chatgpt,FALSE,,0,,sauto.cz,,not in top 10
```

### 3.13 Appendix B — Markdown table template

**Obsah (~20-30 řádků):**

Per měření aggregate summary table:
```markdown
## Měření 2026-04-15

| Engine | Total queries | Citations | Citation rate | Avg score | Top citations |
|---|---|---|---|---|---|
| ChatGPT | 30 | 2 | 6.7% | 0.13 | 0 |
| Perplexity | 30 | 8 | 26.7% | 1.2 | 2 |
| Claude | 30 | 1 | 3.3% | 0.07 | 0 |
| Gemini | 30 | 3 | 10% | 0.4 | 0 |
| AI Overviews | 30 | 4 | 13.3% | 0.6 | 1 |
| **Total** | **150** | **18** | **12%** | **0.48** | **3** |
```

### 3.14 Appendix C — Glossary

**Obsah (~30-50 řádků):**

Terminologie:
- **GEO** (Generative Engine Optimization) — discipline of optimizing brand presence in AI-generated answers
- **AEO** (Answer Engine Optimization) — synonym pro GEO, někdy užší focus na direct Q&A engines
- **AI Overviews** — Google feature embedding AI-generated summary v SERP
- **Citation** — explicit mention nebo link na zdroj v AI response
- **Linked citation** — clickable link na carmakler.cz
- **Textual citation** — brand mention bez linku ("podle Carmakler...")
- **Top citation** — 1st position in response sources
- **Deep citation** — >5th position
- **Share of voice** — % zmínek brand vs konkurence
- **llms.txt** — markdown spec endpoint per `llmstxt.org` for LLM crawler discovery
- **SSG** (Static Site Generation) — Next.js pre-render at build time
- **ISR** (Incremental Static Regeneration) — Next.js cache + revalidation
- **Indexation rate** — % submitted URLs že GSC actually indexed

---

## 4 — Affected files audit

### 4.1 Files to CREATE

| Soubor | LoC est. | Purpose |
|---|---|---|
| `.claude-context/docs/geo-benchmark.md` | **600-800 markdown řádků** | All-in-one GEO methodology + monitoring doc per §2.2 outline |

**Total: 1 NEW file**

### 4.2 Directories to CREATE

| Adresář | Status |
|---|---|
| `.claude-context/docs/` | Pravděpodobně neexistuje (verified `.claude-context/` má `checklists/` + `tasks/`, ale ne `docs/`). Implementator MUSÍ vytvořit. |

### 4.3 Files to MODIFY

**Žádné.** Plán je čistě additive — žádný production kód, žádný `package.json`, žádný `prisma/schema.prisma`, žádný existing markdown.

**Optional cross-link update (post-#87e):**
- `CLAUDE.md` (root) — možná přidat reference na `.claude-context/docs/geo-benchmark.md` v "Pravidla pro vývoj" sekci. **NE v #87e scope**, případný #87e-followup task.

### 4.4 Files referenced (read-only) v dokumentu

Implementator MUSÍ v geo-benchmark.md odkázat (jako cross-link / reference) na:
- `lib/seo.ts`
- `lib/seo/slugify.ts`
- `lib/seo/partsItemList.ts`
- `lib/canonical.ts`
- `app/sitemap.ts`
- `app/llms.txt/route.ts`
- `.claude-context/tasks/plan-task-81.md` (parent)
- `.claude-context/tasks/plan-task-139-87c-seo-content.md` (sister)

---

## 5 — Acceptance criteria (8 AC)

### AC1 — Soubor existuje na správné cestě
**Verify:** `ls -la .claude-context/docs/geo-benchmark.md` → soubor existuje, nenulová velikost.

### AC2 — Délka v target range
**Verify:** `wc -l .claude-context/docs/geo-benchmark.md` → output **mezi 600 a 900 řádků** (lower bound 600 per dispatch, upper 900 = headroom pro detailní obsah).

### AC3 — Pokrývá všech 11 hlavních sekcí + 3 appendices
**Verify:** `grep -c '^## ' .claude-context/docs/geo-benchmark.md` → ≥11 H2 headings (§1-§11). `grep -c '^## Appendix' .claude-context/docs/geo-benchmark.md` → ≥3 appendices (A, B, C).

### AC4 — Obsahuje 30 test queries v 5 kategoriích
**Verify:** Manual review §4 — všech 5 sub-sekcí (§4.1-§4.5) má přesně 6 očíslovaných queries. Total ≥30 queries.

### AC5 — Tool catalog 4-tier
**Verify:** §6 obsahuje §6.1-§6.5 (Enterprise, Mid-market, Budget, DIY, Recommendation per stage). Každá tier sub-sekce má alespoň 1 specific tool name.

### AC6 — 6 monitoring metrics dokumentováno
**Verify:** §8 obsahuje §8.1-§8.6 (SSG count, Sitemap entries, Canonical health, Indexation rate, GEO citations, llms.txt requests). Každá metrika má: definition + how-to-measure + alert threshold + action.

### AC7 — Cron schedule + 4 action playbooks
**Verify:** §9 obsahuje 4 schedule slots (daily/weekly/bi-weekly/monthly). §10 obsahuje ≥4 action playbooks (per §3.10 šablona).

### AC8 — Cross-links na existing infrastructure
**Verify:** `grep -E 'lib/seo|app/sitemap|app/llms.txt|lib/canonical|plan-task-81|plan-task-139' .claude-context/docs/geo-benchmark.md` → ≥6 distinct mentions.

### AC9 — Markdown lint clean
**Verify:** `npx markdownlint .claude-context/docs/geo-benchmark.md` → 0 errors. (Pokud `markdownlint` není globálně dostupný, manual review že každý heading má space, žádné trailing whitespace, žádné inconsistent list markers.)

### AC10 — TaskList #99 (#87e DOCS) → completed po commitu
**Verify:** `TaskGet 99` → status = completed. Commit message obsahuje `feat(seo): #87e geo-benchmark + monitoring docs`.

---

## 6 — Estimated effort

### Per phase

| Phase | Description | Time est. |
|---|---|---|
| **Phase 1** | Read references (plán-81 §E3.5, llms.txt route, sitemap.ts, this plán) | 30 min |
| **Phase 2** | Mkdir `.claude-context/docs/`, write §1-§3 (Účel, Methodology, Workflow) | 1.5 h |
| **Phase 3** | Write §4 (30 queries — tedious but mechanical) | 30 min |
| **Phase 4** | Write §5-§7 (Citation tracking, Tool catalog, Baseline) | 1.5 h |
| **Phase 5** | Write §8-§10 (Monitoring metrics, Cron, Playbooks) | 1.5 h |
| **Phase 6** | Write §11 + 3 Appendices | 30 min |
| **Phase 7** | Markdown lint + cross-link verification + final review | 30 min |
| **Phase 8** | Commit + TaskUpdate #99 → completed | 15 min |
| **Total** | | **~6.25 h** |

### Comparison s plán-81 §E3.5 estimate
plán-81 estimoval 2h pro celý geo-benchmark sekci. **Tento plán expanduje na 6 h** — důvod: scope je mnohem širší (30 queries místo 10, tool catalog 4-tier místo 0, monitoring sekce s 6 metrics, action playbooks). Hodnota delta: 4× hloubky obsahu pro 3× času.

---

## 7 — Risk analysis

| # | Risk | Severity | Probability | Mitigation |
|---|---|---|---|---|
| 1 | `.claude-context/docs/` neexistuje, implementator zapomene vytvořit | Low | Low | AC1 explicit verify |
| 2 | Tool research findings outdated do měření Q3 2026 | Medium | Medium | §6.5 doporučuje per-stage progression, nečekat statickou volbu |
| 3 | Markdown lint config strict vs relaxed mismatch | Low | Low | AC9 fallback na manual review |
| 4 | 30 queries nepokrývá long-tail enough | Medium | Low | §4.5 competitor benchmark přidává unique angle, §4.2 long-tail product je explicitní |
| 5 | Cron schedule pseudo-spec (žádné runnable scripts) | Low | High (intentional) | §9 explicit pozn — implementace post-#87e separate task |
| 6 | Indexation API integration odložena = manuální measure | Low | High (intentional) | §8.4 explicit fallback na GSC manual UI |
| 7 | Citation false positives v měření (Carmakler matchne typo "carmaker") | Low | Low | §5.3 false positive filter explicit |
| 8 | Marketing manager nedostane time slot pro 90min měření 2× měsíčně | Medium | Medium | §3.5 explicit owner + backup, eskalace na CTO pokud delays |
| 9 | Y1 targets v §7.2 příliš ambiciózní/málo ambiciózní | Medium | Medium | §7.3 KPI vs warning pattern umožňuje flex po Q1 baseline |
| 10 | Document drift — geo-benchmark.md neaktualizovaný po prvním commitu | High | Medium | §1.4 explicit aktualizační frekvence (1× kvartál revize obsahu) |

**Overall risk:** **Low-Medium**. Žádný production kód = žádný breaking change, žádný DB migration. Highest risk je **document drift** (#10) — mitigated by §1.4 quarterly review schedule.

---

## 8 — Open questions pro team-leada

> **STATUS: ✅ ALL LEAD-APPROVED (2026-04-07)** — team-lead schválil všechna doporučení v přímé message ("Plán #142 #87e DOCS schváleno, perfektní strukturace"). Plus explicit upřesnění na Q5 (30 queries jsou Y1 baseline, mid-quarter změny zničí trend). #144 IMPL docs task vytvořen.

### Q1 — Lokace souboru: `.claude-context/docs/` vs `docs/` v rootu?

**Doporučení:** **`.claude-context/docs/geo-benchmark.md`** per dispatch verbatim. Důvod: `.claude-context/` je interní AI agent context (plány, checklists), `docs/` v rootu by byl public-facing (např. README cross-link). GEO benchmark je interní marketing tool, nepatří public.

**Alternativa:** `docs/geo-benchmark.md` (root). Plus: standardní místo pro project docs. Mínus: smíchá interní (GEO) s veřejnými (README, CONTRIBUTING). NE doporučeno.

**✅ LEAD DECISION (2026-04-07):** `.claude-context/docs/` APPROVED. Team-lead verbatim: *"Q1: Lokace .claude-context/docs/ ✅ — interní AI agent context, ne public docs/. Doc je pro nás (lead/agenti), ne pro veřejnost."*

### Q2 — All-in-one vs split (geo-benchmark.md + seo-monitoring.md)?

**Doporučení:** **All-in-one** per §2.1 rozhodnutí. Důvod: malý tým, jeden review, single source of truth.

**Alternativa:** Split. Plus: cleaner separation. Mínus: 2 souborů údržba, lišní cross-links.

**✅ LEAD DECISION (2026-04-07):** All-in-one APPROVED. Team-lead verbatim: *"Q2: All-in-one ✅ — small team, single review surface, žádný split."*

### Q3 — Tool catalog: include nebo defer enterprise tier ($500+/měsíc) tools?

**Doporučení:** **Include all 4 tiers** v §6, ale §6.5 jasně doporučuje per-stage progression (MVP = $0, Growth = $30, Scale = $500+). Důvod: marketing decision-makers potřebují vědět full landscape, ne jen current affordable.

**Alternativa:** Skip Tier 1 (enterprise). Plus: shorter doc. Mínus: chybí context pro budoucí scale rozhodnutí.

**✅ LEAD DECISION (2026-04-07):** Enterprise tier INCLUDE APPROVED. Team-lead verbatim: *"Q3: Enterprise tier ANO include ✅ — pro reference (Profound, Semrush AIO). Mark jako 'evaluate Y2+' / 'not recommended for current scale', ale ať tam je. Ostatní tým ať vidí strop možností."* → **ADDITIONAL REQUIREMENT pro implementatora:** §6.1 enterprise tier MUSÍ mít explicitní label `[Evaluate Y2+]` nebo `[Not recommended for current scale]` u každého enterprise tool entry (Profound, Semrush Enterprise AIO, SE Ranking).

### Q4 — Cron schedule: pseudo-spec nebo runnable scripts?

**Doporučení:** **Pseudo-spec only v #87e**, runnable scripts = post-#87e separate task. Důvod: dispatch řekl "doc-only", runnable cron je code (porušení scope).

**Alternativa:** Include `scripts/cron-*.sh` placeholders s TODO komentáři. Plus: easier handoff. Mínus: false impression že kód je live.

**✅ LEAD DECISION (2026-04-07):** Pseudo-spec only APPROVED. Team-lead verbatim: *"Q4: Pseudo-spec only pro cron ✅ — žádný runnable kód v doc-only #87e. Pokud bude potřeba runnable cron, separate task."*

### Q5 — 30 queries: lock list nebo flexible per měření?

**Doporučení:** **Lock list pro Y1**. Důvod: konzistentní baseline = comparable trends. Po Y1 review (Q1 2027) možnost expand/swap queries.

**Alternativa:** Flexible per měření. Plus: rychlá adaptace na nové products. Mínus: ztráta longitudinal trend tracking.

**✅ LEAD DECISION (2026-04-07):** 30 queries JSOU Y1 BASELINE APPROVED, s nuance. Team-lead verbatim: *"Q5: 30 queries lock pro Y1 — flexible per měření lepší, ale lock baseline pro consistency. Take it as: 30 queries jsou Y1 baseline, můžeme přidávat/upravovat retrospektivně, ale baseline measurement scoreboard běží proti původním 30. Dokumentuj v §4 že 'queries lze upravit jen po quarterly review, mid-quarter změny zničí trend'."* → **ADDITIONAL REQUIREMENT pro implementatora:** §4 intro MUSÍ obsahovat explicit disclaimer: *"Tento seznam 30 queries je Y1 baseline a SMÍ být upraven POUZE po quarterly review (1× za 3 měsíce). Mid-quarter změny zničí longitudinal trend tracking. Přidávání nových queries je povoleno (additive), ale remove/rename existujících = breaks baseline scoreboard."*

### Q6 — Indexation rate měření: GSC API integration v post-#87e nebo never?

**Doporučení:** **Defer post-#87e jako optional**. Důvod: API setup vyžaduje service account + credentials + scheduled runner. ROI nejasný (manual GSC UI dostatečný pro Q3 2026 monthly review). Re-evaluate po Q3 2026 baseline.

**Alternativa:** Include GSC API integration v #87e. Plus: zero-touch automation. Mínus: ~4-6h dev (Node.js googleapis SDK + service account + cron) — porušení doc-only scope.

**✅ LEAD DECISION (2026-04-07):** Defer GSC API post-#87e APPROVED. Team-lead verbatim: *"Q6: Defer GSC API integration post-#87e ✅ — manual GSC UI dostatečný, automatizace později jako separate task."*

### §8a — Lead's additional implementator requirements (derived from Q3+Q5)

Implementator (dispatchnut jako #144 IMPL) MUSÍ při psaní `.claude-context/docs/geo-benchmark.md`:

1. **§6.1 Enterprise tier labels** — přidat `[Evaluate Y2+]` nebo `[Not recommended for current scale]` u Profound, Semrush Enterprise AIO, SE Ranking
2. **§4 Y1 baseline disclaimer** — explicit text o quarterly review gate pro query changes, warning "mid-quarter změny zničí trend"
3. **§6.5 Per-stage progression** — zdůraznit že MVP stage = Tier 3 ($0), upgrade na Tier 2 až po baseline proven, Tier 1 = future consideration only
4. **Žádný runnable kód** — §9 cron schedule je čistě dokumentační, žádné skutečné `.sh`/`.ts` script soubory v tomto task

---

## 9 — Implementation order (phases summary)

```
Phase 1: Read references (30 min)
   ↓
Phase 2: Mkdir + write §1-§3 (1.5h)
   ↓
Phase 3: Write §4 — 30 queries (30 min)
   ↓
Phase 4: Write §5-§7 (1.5h)
   ↓
Phase 5: Write §8-§10 (1.5h)
   ↓
Phase 6: Write §11 + Appendices (30 min)
   ↓
Phase 7: Lint + verify + review (30 min)
   ↓
Phase 8: Commit + TaskUpdate #99 (15 min)
```

**Critical path:** Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 sequentially.

**Parallelism:** Žádný — single doc file, single autor (implementator).

---

## 10 — Souhrn pro team-leada (TL;DR)

**Co plán dodává:**
- Konkretizace plán-81 §E3.5 (původní stub) na production-ready 600-800 řádků markdown doc
- 1 NEW soubor: `.claude-context/docs/geo-benchmark.md`
- 0 MODIFIED files (čistě additive)
- 0 production code changes
- 11 hlavních sekcí + 3 appendices
- 30 test queries v 5 kategoriích (3× scale plán-81)
- Tool catalog 4-tier (research findings — Profound, Semrush AIO, Otterly.AI, GSC, DIY)
- 6 monitoring metrics s definition + how-to-measure + threshold + action
- 4 action playbooks (SSG drop, canonical drift, indexation rate, GEO citations zero)
- Cron schedule (daily/weekly/bi-weekly/monthly) jako pseudo-spec
- Y1 targets per kvartál (Q1-Q4 2026)
- 8 acceptance criteria (AC1-AC10)

**Architektonický klíč:** All-in-one doc, no code changes, #87e uzavírá #87 SEO chain. Implementator může pracovat **paralelně s #87c IMPL** (#97) bez konfliktu — různé files, různé scope.

**Co plán NEMĚNÍ:**
- ✅ #87a llms.txt endpoint — beze změny
- ✅ #87b 3-segment routing — beze změny
- ✅ #135 canonical helper — beze změny
- ✅ Žádný production code

**Co plán NEŘEŠÍ (out of scope):**
- ❌ Implementace runnable monitoring scripts → post-#87e separate task
- ❌ Google Search Console API integration → defer
- ❌ Real-time GEO scraping bot → mimo MVP
- ❌ Public-facing docs (README, CONTRIBUTING) update → optional follow-up

**Effort:** ~6.25 h docs work (žádné dev). Žádné nové npm deps, žádné migration risks.

**Risk:** Low-Medium. Highest risk je document drift post-#87e — mitigated by §1.4 quarterly review schedule.

**Návaznost:**
- **Paralelní s #87c IMPL** (#97) — bez konfliktu
- **Nezávislé na #87d IMPL** (#98) — může běžet kdykoliv
- **Po #87e commit:** uzavírá #87 SEO chain (#87 → #87a → #87b → #87c → #87d → #87e)

**Rozhodovací bod pro team-leada:** ~~Schválit Q1-Q6 + dispatch implementator pro #87e DOCS write.~~ **✅ APPROVED 2026-04-07** — viz §8 audit trail. #144 IMPL task created pending dispatch.

---

**Sources (research findings použité v §6 tool catalog):**
- [Best Generative Engine Optimization (GEO) Tools in 2026 — Fingerlakes1.com](https://www.fingerlakes1.com/2026/03/08/best-generative-engine-optimization-geo-tools-in-2026-what-actually-use-to-track-ai-visibility/)
- [Leading Generative Engine Optimization (GEO) Tools for 2026 — SitePoint](https://www.sitepoint.com/best-generative-engine-optimization-tools/)
- [Generative engine optimization (GEO) — Search Engine Land](https://searchengineland.com/what-is-generative-engine-optimization-geo-444418)
- [Best GEO Tools 2026 — Stackmatix](https://www.stackmatix.com/blog/generative-engine-optimization-geo-tools)
- [The 7 best AEO/GEO tools for 2026 — Scrunch](https://scrunch.com/blog/best-answer-engine-optimization-aeo-generative-engine-optimization-geo-tools-2026)
- [Google Search Console API: Advanced Guide 2026 — Incremys](https://www.incremys.com/en/resources/blog/google-search-console-api)
- [Indexing API Quickstart — Google Search Central](https://developers.google.com/search/apis/indexing-api/v3/quickstart)
- [API Reference — Search Console API](https://developers.google.com/webmaster-tools/v1/api_reference_index)

---

**Next steps:**
1. Lead reviews + rozhoduje Q1-Q6
2. Po schválení: dispatch implementator (nebo dedicated docs writer) s odkazem na tento plán
3. Implementator čte plán → mkdir `.claude-context/docs/` → píše geo-benchmark.md per §3 detailed design
4. Post-write: markdown lint (AC9) → commit → TaskUpdate #99 → completed
5. Po commit: standby pro #87d follow-up nebo další docs tasks
