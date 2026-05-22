---
name: Review #79 (#83) — SEO+GEO plán pro /dily proti doslovnému zadání uživatele
description: EVZEN-THE-KING bod-po-bodu kontrola research-task-81 + plan-task-81 proti chronologickému zadání uživatele 2026-04-06
type: review
---

# Review #83 — SEO+GEO plán pro /dily proti doslovnému zadání

**Datum:** 2026-04-06
**Reviewer:** EVZEN THE KING (read-only)
**Task ID:** #82 (review of task #79, plánovač output #81)
**Soubory k review:**
- `.claude-context/tasks/research-task-81.md` (519 řádků)
- `.claude-context/tasks/plan-task-81.md` (1 302 řádků)

---

## VERDIKT

# ✅ APPROVED WITH 1 MINOR NOTE

**Plán pokrývá všech 6 kontrolních bodů uživatelova zadání. Doporučení k drobné kosmetické úpravě (terminologie label v D1 tabulce) — neblokuje implementaci.**

# **OK K PREZENTACI UŽIVATELI**

---

## 1. Doslovné zadání uživatele (chronologicky)

| # | Citát | Extrahovaný požadavek |
|---|---|---|
| 1 | *"SEO landing je hodne duležité no, to jsem zvedavej jak ho chces zakomponovat do shopu + ISR nebo SSR"* | SEO landing **do shopu** (eshop /dily), tech stack **ISR nebo SSR** |
| 2 | *"musíme udelat ISR a nebo SSR na celym webu + teda kouknout na to SEO ale to bych delal potom na konci ne seo?"* | **ISR/SSR celý web**, SEO původně chtěl odložit |
| 3 | *"tak seo strukturu pro shop udelej ted, vem si jak to ma treba autokelly atd udelej analyzu a koukni na to jde nam i o to aby jsme byly videt v chatgpt atd a používat SSR nebo ISR!"* | SEO **HNED**, **konkurenční analýza Autokelly**, **viditelnost v ChatGPT**, **ISR nebo SSR** (znovu zdůrazněno) |

**Extrahované finální požadavky (5 bodů):**
1. ✅ SEO struktura pro `/dily` (shop) — udělat **HNED**, ne na konci
2. ✅ Konkurenční analýza — **Autokelly atd.**
3. ✅ **Viditelnost v ChatGPT** (a dalších AI vyhledávačích)
4. ✅ **ISR nebo SSR** (explicitní exclusion čistého SSG)
5. ✅ Zakomponovat do eshopu /dily (ne separátní web)

---

## 2. Doslovný check tabulka (požadavek → match → evidence)

| # | Požadavek | Match | Evidence v plánu |
|---|---|---|---|
| 1 | **SEO struktura pro /dily HNED, ne na konci** | ✅ PASS | `plan-task-81.md` Executive summary: "3-vrstvý SEO+GEO systém pro /dily eshop"; ČÁST C celá. Effort 5-6 dnů. **Žádné odložení na konec.** |
| 2 | **Celý /dily flow** (root → kategorie → značka → model → rok → detail) | ✅ PASS | C1: 7 URL typů zdokumentováno: `/dily`, `/dily/kategorie/{slug}`, `/dily/znacka/{brand}`, `/dily/znacka/{brand}/{model}` (NOVÉ), `/dily/znacka/{brand}/{model}/{rok}` (NOVÉ), `/dily/{slug}`, `/dily/vrakoviste/{slug}` (fáze 2). Tabulka D2.1 ukazuje schema matrix per page type. |
| 3 | **3-level hierarchie** (vs Autodoc 4-level) | ✅ PASS | C1.1 explicitně zdůvodňuje proč 3-level: "Carmakler nemá engine-level data od vrakovišť". Engine filter zůstane jako query param `?motor=2.0-tdi`. Engine-level URL je v Out of scope #1 jako čekající na #76 AI Part Scanner. **Není skryté, je explicitně označené.** |
| 4 | **Konkurenční analýza Autokelly jmenovitě** | ✅ PASS | `research-task-81.md` A1.2: **Autokelly.cz (LKQ CZ)** — deep dive s real URL `/Catalog/osobni-automobil-nahradni-dily/39849642;39850140`, real title (numerický ID v title), Angular SPA detection, Lighthouse SEO odhad 45-55, hodnotící tabulka 7 metrik. |
| 5 | **Konkurenční analýza dalších CZ shops** | ✅ PASS | A1.1 **Autodoc.cz** (TOP benchmark, 4-level URL, 9 H2, 2 800-3 200 slov, 5-level breadcrumb, real H1/H2 ověřené); A1.3 **EuAutodily.cz**; A1.4 **MroAuto, AutoMedik, CarsShop, Voton**; A1.5 **Bazoš.cz**; A1.6 **TipCars.com**. Real URL data, ne general best practices. |
| 6 | **Konkurenční analýza obsahuje konkrétní čísla, URL vzory, slabiny/silnosti** | ✅ PASS | A2 (10 patterns k ukradnutí) + A3 (10 slabin konkurence = Carmakler diferenciátory). Word counts (2 800-3 200), Lighthouse skóre (45-55 Autokelly, 85-90 Autodoc), URL vzory (real-data ověřené), JSON-LD detection per konkurent. |
| 7 | **ChatGPT viditelnost — konkrétní strategie** | ✅ PASS | ČÁST B celá (sekce B1-B3): GEO definice, Perplexity ranking factors (35% citation frequency), what AI cites (10 patterns), llms.txt protokol, B2 test queries (10 reálných CZ queries), B3 Carmakler GEO strategie (content pillars + schema priority + writing guidelines + KPIs). |
| 8 | **llms.txt implementace** | ✅ PASS | D4 v plánu: full TypeScript implementace `/llms.txt/route.ts` s real-time stats z DB (active parts count, avg price, supplier count), dynamic content z PARTS_BRANDS, response headers Content-Type text/markdown, revalidate 24h. **Konkrétní implementace, ne placeholder.** |
| 9 | **FAQPage schema** | ✅ PASS | D2.1 schema matrix: FAQPage na všech landing pages (/dily, brand, model, model+year, kategorie). D2.3 popisuje 3 universal FAQs + brand-specific + model-specific FAQ generation. E1.2 ukazuje konkrétní FAQ items pro Škoda Octavia (3 příklady). |
| 10 | **AI snippet formátování** | ✅ PASS | C2.1 plánuje `lib/seo/aiSnippet.ts` jako samostatný helper. SeoContent model má pole `aiSnippetText` (2-3 věty pro AI featured snippet). B3.3 obsahuje DO/DON'T guidelines pro AI-friendly content (Q&A H2/H3, factual density, bullet points, internal links). |
| 11 | **ISR nebo SSR (NE čisté SSG)** | ✅ PASS s nálezem | D1 tabulka strategy per URL type: většina ISR (24h), `/dily` root **label "SSG" ale technicky ISR** (revalidate=1h, viz minor note níže), `/dily/katalog` (search) SSR, `/dily/kosik` SSR. D1.1 ukazuje konkrétní `dynamic = "force-static"` + `dynamicParams = true` + `revalidate = 86400`. **Žádný `revalidate: false` nikde** = žádné čisté SSG. |
| 12 | **On-demand revalidation** (po přidání dílu) | ✅ PASS | D1.2: `/api/revalidate/parts/route.ts` s `revalidatePath()` per hierarchie (brand → model → year). D1.2 také ukazuje volání z `app/api/parts/route.ts` POST handler po `prisma.part.create()`. **Konkrétní integrace, ne abstraktní.** |
| 13 | **Žádné TBD/skryté sekce** | ✅ PASS | Každá důležitá volba rozhodnutá: URL pattern (3-level zdůvodněno), component structure (8 komponent v `components/web/dily/`), Prisma model `SeoContent` (full schema s 13 poli), revalidation strategy, content pipeline (template MVP + Claude API fáze 1.5), JSON-LD generators. **Out of scope** sekce (E8) má 10 explicitních položek s důvodem proč ne v MVP. |
| 14 | **URL stability — žádné breaking changes** | ✅ PASS | C2.3 popisuje routing rename `[slug]` → `[brand]` s explicitním pravidlem: "slugy se nemění (skoda, volkswagen, bmw...), URL identical, žádný redirect needed". E6 risk register: "Routing rename rozbije linky" Probability=Low, mitigation=test all `Link href`. |
| 15 | **České UI texty + anglický kód** | ✅ PASS | Title formáty a meta descriptions všechny v češtině ("Náhradní díly {Brand} — od {minPrice} Kč"); FAQ items v češtině; H1/H2 sekce v češtině. Code identifiers v EN (`generatePartsLanding`, `getPartsStatsForBrand`, `aiSnippet.ts`, `pageType: "BRAND"`). |
| 16 | **Next.js 15 App Router konvence** | ✅ PASS | `generateStaticParams()` async, `params: Promise<{...}>` (Next 15 pattern), `dynamic = "force-static"`, `dynamicParams = true`, `revalidate` v sekundách, `app/sitemap.ts` extension, `app/llms.txt/route.ts` route handler. |
| 17 | **Prisma queries přes lib/prisma.ts singleton** | ✅ PASS | Všechny code stuby používají `import { prisma } from "@/lib/prisma"` (D1.2, D4, E1.4, E2.2). **Zero direct PrismaClient instantiation.** |

**Skóre: 17/17 PASS** (1 minor note u bodu 11 — viz sekce 4 níže)

---

## 3. Pravidla EVZEN THE KING — kompletní check

| # | Pravidlo | Stav | Důvod |
|---|---|---|---|
| 1 | **Žádné zkratky v UI** | ✅ | Title, H1, FAQ items, meta descriptions všechny celá česká slova (Náhradní díly, Originální použité díly, Nejprodávanější, Náhradní díly Škoda Octavia 2018). Zero abreviace ("ND" / "Auto" apod.). |
| 2 | **Duplicate data ověřit kontext** | ✅ | Plán SeoContent model je jediný source of truth pro pre-rendered content (úmyslně cache). Stávající `lib/seo-data.ts` je extension (+ PARTS_MODELS_BY_BRAND), nepřepisuje. Žádné konfliktní duplikace. |
| 3 | **Unfinished features OZNAČENY** | ✅ | E8 Out of scope: 10 explicitních položek (engine-level URL, vrakoviště store, blog, comparison pages, Wikipedia, YouTube/Medium, hreflang, AggregateRating, sitemap-index split, Claude API enhancement). Každá s důvodem. **Žádné skryté TBD.** |
| 4 | **Nic nemazat bez schválení** | ✅ | Plán je 100% additive: rename folder (zachová slugy), rozšířit existující page, přidat nové soubory. **Žádné delete operace** v Files list (C2.1 Nové soubory + C2.2 Modifikované). Risk register E6 ošetřuje rename jako Low risk. |
| 5 | **Skryté stránky = ŠPATNĚ** | ✅ | Všechny nové URL v sitemap (D3) + llms.txt (D4) + breadcrumbs + internal linking. Zero noindex/nofollow na landing pages. Pouze `/dily/katalog` (search) bude noindex (uvnitř plánu pochopeno jako search results). |
| 6 | **Každá změna se schvaluje jednotlivě** | ✅ | E4 Dependencies graf ukazuje 3 fáze (Foundation → Templates → GEO/Tooling) s explicitními kroky E1.1-E1.4, E2.1-E2.4, E3.1-E3.6. Každý krok má odhad hodin a popis. **Lze rozdělit do 13 jednotlivých commitů.** |

**Score 6/6 — všechna nekompromisní pravidla EVZEN THE KING splněna.**

---

## 4. Specific concerns (1 minor)

### MINOR #1 — Terminologická nepřesnost: "SSG" label v D1 tabulce

**Lokace:** `plan-task-81.md` D1 — Render strategy per URL type, řádek 377

**Problém:**
```
| `/dily` (root) | **SSG** | 1 hour | Static, fast |
```

Label "SSG" je terminologicky nesprávný. SSG (Static Site Generation) implikuje `revalidate: false` = build-time only, žádná revalidace. Plán však uvádí "1 hour" revalidate, což je **technicky ISR** (Incremental Static Regeneration).

**Proč to pohlídat:** Uživatel explicitně řekl *"používat SSR nebo ISR"* — vyloučil čisté SSG. Pokud někdo plán čte rychle a vidí "SSG" label, mohlo by to vyvolat námitku.

**Realita:** Implementačně je to **správně ISR** — D1.1 ukazuje `dynamic = "force-static"` + `revalidate = 86400` což JE definice ISR (Next.js 15 docs). Nikde v code stub nevidím `revalidate: false`.

**Doporučení:** Plánovač přejmenovat sloupec label v D1 z "SSG" na "ISR" pro `/dily` root (a držet revalidate=1h). Žádná code change, jen vyčištění terminologie. **Není to blocker** — implementace je správná.

---

## 5. Required changes (RETURN to plánovač)

**ŽÁDNÉ.** Plán je schopen předat implementátorovi.

---

## 6. Optional improvements (APPROVED WITH NOTES)

### Note #1 — Fix terminology "SSG" → "ISR" v D1 tabulce
Viz Specific concerns výše. Blocker: Ne. Effort: 5 minut (1 word edit).

### Note #2 — E2.1 routing rename → před commitem grep všech `Link href="/dily/znacka/`
Risk register E6 uvádí "test all Link href", ale konkrétní příkaz chybí. Doporučit přidat krok:
```bash
grep -rn 'href="/dily/znacka/' app components | wc -l
# Po rename: znovu spustit, čísla musí být identická
```
Není blocker — risk je Low (slugy se nemění), ale extra safety.

### Note #3 — FAQ data manuální entry effort 4h může být under-estimated
E1.2 odhaduje 4h pro 32 model entries × 5 FAQ items = 160 FAQ Q&A pairs v češtině. Realisticky bude potřeba spíš 6-8h pokud chceme vysokou kvalitu. **Risk register E6** to označuje jako "Med probability, Med impact" s mitigací "Auto-generate from Part categories + DB stats". OK, ale doporučit explicitně označit jako "manual content debt".

### Note #4 — Diakritika OUT (`skoda` ne `škoda`) je rozhodnuto bez konzultace s uživatelem
Uživatel diakritiku v zadání nezmínil. Plán C1.2 rozhoduje "Diakritika OUT — Encoding issues, backwards compat". Toto rozhodnutí je technicky dobré (zachovává konzistenci se stávajícími slugy `skoda`, `volkswagen`), ale stojí za to při prezentaci uživateli zmínit jako explicitní volbu. Není blocker.

### Note #5 — Per-vrakoviště store pages v Out of scope může být brzká příležitost
E8 #2 odkládá `/dily/vrakoviste/{slug}` na fázi 2. Toto je v researchi A3 (slabina #10) označeno jako **unique Carmakler differentiator** — žádný konkurent to nemá. Doporučit při prezentaci uživateli zmínit jako "phase 2 quick win" pro motivaci.

---

## 7. Pozitivní zjištění (co plán dělá dobře)

1. **Real-data ověřená konkurenční analýza** — Autodoc URLs, Autokelly URL pattern, real H1/H2 ověřené (ne generic "best practices"). To je top-tier práce planovače.

2. **Schema matrix tabulka D2.1** — explicitní per-page-type JSON-LD volba (BreadcrumbList, Organization, WebSite, FAQPage, ItemList, Product, Offer). Žádný guesswork.

3. **`SeoContent` Prisma model** — clean compound unique constraint `[pageType, brand, model, year, category]`, separate `pageType` enum (BRAND/MODEL/MODEL_YEAR/CATEGORY), `generatedBy` audit field. Dobrá database design.

4. **GEO sekce B1.3** — Perplexity ranking weight tabulka (35% citation frequency, 20% visual placement, 15% domain authority, 10% schema markup, 10% recency, 5% security/compliance, 5% other) — zdroj: metehan.ai 59+ ranking patterns. Real research, ne hand-waving.

5. **5 klíčových insights v researchi** — každý má dopad na plán explicitně mapovaný. Insight #2 (Autokelly rozbitá SEO → příležitost vytlačit) je strategicky brilantní.

6. **Risk register E6** — 8 risks s probability + impact + mitigation. Včetně edge case "Prisma compatibleBrands JSON contains issue — High probability, Med impact, mitigace: normalize na relational PartCompatibility model fáze 2".

7. **Effort breakdown** — fáze 1 (14h) + fáze 2 (16h) + fáze 3 (10h) = 40h celkem, mapováno na 13 explicitních kroků E1.1-E3.6. Prioritization graf E4 ukazuje dependencies.

8. **Integrace s ostatními tasky** — E7 mapuje propojení s #76 (AI Scanner feed), #77 (Wolt liquidity model), #78 (inzerce SEO replikace), #82 (web-wide ISR audit). Plán nežije ve vakuu.

9. **Out of scope sekce E8** — 10 explicitně označených položek s důvodem. **Žádné věci skryté pod kobercem.**

10. **Cost analysis** — $0 MVP (template-based), $1.5 optional fáze 1.5 (Claude API enhancement). Konkrétní čísla.

---

## 8. Final summary

| Kritérium | Verdikt |
|---|---|
| **SEO struktura pro /dily — kompletní?** | ✅ ANO — 7 URL typů, brand→model→rok hierarchie, page templates per typ |
| **Konkurenční analýza Autokelly jmenovitě?** | ✅ ANO — A1.2 deep dive s real URL + 6 dalších CZ shops |
| **ChatGPT viditelnost (GEO) — konkrétní implementace?** | ✅ ANO — llms.txt + FAQPage + AI snippet helper + 10 test queries + KPIs |
| **ISR/SSR (ne čisté SSG) — dodrženo?** | ✅ ANO technicky (1 minor label fix doporučen) |
| **Žádné TBD/skryté sekce?** | ✅ ANO — Out of scope je explicitní |
| **Pravidla Carmakler (URL stability, CZ UI, EN code, Next.js 15, Prisma singleton)?** | ✅ ANO všech 5 |
| **6/6 EVZEN THE KING pravidel splněno?** | ✅ ANO |

**17/17 doslovných bodů uživatele PASS. 6/6 EVZEN pravidel splněno. 1 minor terminologická poznámka, neblokuje.**

---

## VERDIKT FINÁLNÍ

# ✅ APPROVED WITH 1 MINOR NOTE

**Plán dodává:**
1. Kompletní SEO strukturu pro /dily eshop (3-level URL hierarchie, 7 page types)
2. Konkurenční analýzu Autokelly + 6 dalších CZ shops s real-data
3. GEO strategii pro ChatGPT/Perplexity (llms.txt, FAQPage, AI snippet, KPIs)
4. ISR-based tech stack (žádné čisté SSG)
5. 5-6 dnů effort breakdown s 13 jednotlivými kroky
6. Risk register, integrace s ostatními tasky, out-of-scope explicitně

**Doporučení k drobné korekci (NEBLOKUJE):**
- Plánovač přejmenovat label "SSG" → "ISR" pro `/dily` root v D1 tabulce (5 minut, 1 word edit)

**Doporučení pro implementační fázi (až po schválení uživatelem):**
- E2.1 routing rename: před/po grep všech `Link href="/dily/znacka/`
- E1.2 FAQ manual entry: označit jako "manual content debt" v risk registru
- Při prezentaci uživateli: zmínit diakritika OUT volbu + per-vrakoviště pages jako phase 2 quick win

# **OK K PREZENTACI UŽIVATELI**

---

## Follow-up tasks (doporučení po schválení)

| Task | Popis | Priorita |
|---|---|---|
| #79a | Plánovač přejmenovat "SSG" → "ISR" label v D1 tabulce plan-task-81 | P3 |
| #79b | Po user approval — dispatch implementátor s plánem v 3 fázích (E1 → E2 → E3) | P0 |
| #79c | E5.2 E2E Playwright test `e2e/dily-seo.spec.ts` (6 test cases) | P1 |
| #79d | GEO benchmark první run (10 queries × 4 AI engines), uložit baseline | P2 |
| #79e | Per-vrakoviště store pages `/dily/vrakoviste/{slug}` (research A3 #10 — unique differentiator) | P2 |
| #79f | Educational blog `/dily/blog/{slug}` content marketing pipeline | P3 |
| #79g | Wikipedia + Wikidata Carmakler entry (vyžaduje notable references) | P3 |

---

**Konec review #83**
**Délka:** ~330 řádků
**Status:** READY — verdikt APPROVED, lze prezentovat uživateli
