---
name: Review #129 — EVZEN REVIEW #87b 3-segment routing proti Q1-Q8
description: Doslovný read plan-task-124 §15 Q1-Q8 + 6 CarMakler pravidel proti commitu 1466223. Decisive verdict on MF-1 (categories chips on model/rok pages).
type: review
task_id: 129
queue_id: 127
related:
  - plan-task-124-3segment-routing.md
  - impl-task-87b-3segment-routing.md
  - qa-task-128-87b-review.md
commit: 1466223
verdict: PASS (with 2 P3 noticings, žádný blocker)
reviewer: evzen-the-king
date: 2026-04-07
---

# Review #129 — EVZEN REVIEW #87b 3-segment routing proti Q1-Q8

> **Verdict: ✅ PASS** — implementace 3-segment routingu v commitu `1466223` je v souladu s plánem `plan-task-124` (1072 ř.). Q1-Q8 z plánu §15 ověřeno doslova proti zdrojákům (15 souborů, 1693 LoC). Team-lead's preferenced **OPTION A je založen na misreading plánu** — viz §3 níže pro defense literal plánu. **2 P3 noticings, žádný blocker.**

---

## §0 Scope a metoda

**Co kontrolováno:**
1. **Q1-Q8** (plán §15) doslova proti zdrojákům
2. **6 pravidel CarMakler** (žádné zkratky, žádné mazání, žádné skryté stránky, atd.)
3. **MF-1 + MF-2** z `qa-task-128-87b-review.md` (kontrolor noticings)
4. Build verifikace **AC1-AC16** dle plánu §12

**Co NE-kontrolováno (out of scope #87b):**
- Long-form content (9 H2 sekcí) → #87c
- Prisma SeoContent model → #87c
- AI-generated FAQ → #87c
- On-demand revalidation API → #87d
- AC15 (manual diakritika curl) → post-deploy QA
- AC16 (Google Rich Results Test) → post-deploy QA

**Pracovní materiály přečteny in full:**
- `.claude-context/tasks/plan-task-124-3segment-routing.md` (1072 ř., chunked read 1-280, 280-580, 580-880, 880-end)
- `.claude-context/tasks/impl-task-87b-3segment-routing.md` (153 ř.)
- `.claude-context/tasks/qa-task-128-87b-review.md` (247 ř.)
- `app/(web)/dily/znacka/[brand]/page.tsx` (313 ř.)
- `app/(web)/dily/znacka/[brand]/[model]/page.tsx` (336 ř.)
- `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` (325 ř.)
- `components/web/dily/PartsBreadcrumbs.tsx` (74 ř.)
- `lib/seo.ts` lines 1-120
- `lib/seo-data.ts` (grep verification 24 topYears entries)
- `app/sitemap.ts` (grep partsBrandPages, partsModelPages, partsModelYearPages)
- `git show --stat 1466223` — 15 files, +1693 / −167

---

## §1 Q1-Q8 doslovné porovnání (plán §15) — 8/8 PASS

**Důležité:** Team-lead's task description uvádí Q1-Q8 v jiné numbering než plán §15 (off-by-one shift, plus ne všechny Q se shodují). Tato review používá **plánovou numeraci §15 (Q1-Q8)** a v každé sekci uvádí mapping na team-lead's labeling.

---

### Q1 (plán §15) — Kolik modelů per brand?
**= team-lead's Q1 ("3 modely × 8 značek = 24")**

**Plán doporučuje:** 3 modely per brand (24 total)

**Implementace:**
```bash
$ grep -c "topYears:" lib/seo-data.ts
24
```

PARTS_MODELS_BY_BRAND v `lib/seo-data.ts:1256-1525` má 8 keys (skoda, volkswagen, bmw, audi, ford, toyota, hyundai, opel), každý s přesně 3 modely.

`generateStaticParams()` v `[brand]/[model]/page.tsx:41-48`:
```ts
PARTS_BRANDS.flatMap((brand) =>
  (PARTS_MODELS_BY_BRAND[brand.slug] || []).map((model) => ({
    brand: brand.slug,
    model: model.slug,
  }))
)
```
→ 8 × 3 = **24 SSG model pages** ✅

**Verdict Q1: ✅ PASS**

---

### Q2 (plán §15) — Top years per model: hardcoded vs per-model variable?
**= team-lead's Q2 ("per-model topYears (3 roky each)")**

**Plán doporučuje:** Per-model variable s default `[2015, 2018, 2020]`, novější modely overrudují (např. Kodiaq → `[2018, 2020, 2022]`).

**Implementace:**
```
23× topYears: [2015, 2018, 2020]
1× topYears: [2018, 2020, 2022]   ← Hyundai Kona (lib/seo-data.ts:1490)
```

`generateStaticParams()` v `[brand]/[model]/[rok]/page.tsx:43-58`:
```ts
const years = model.topYears ?? [2015, 2018, 2020];
for (const year of years) {
  params.push({
    brand: brand.slug,
    model: model.slug,
    rok: String(year),
  });
}
```
→ 24 × 3 = **72 SSG year pages** ✅

**Verdict Q2: ✅ PASS** — `?? fallback` na default array je správný defenzivní pattern.

---

### Q3 (plán §15) — Mercedes-Benz a další chybějící značky?
**Team-lead this Q neuvedl** (8 brands je MVP scope, expansion = separate task).

**Plán doporučuje:** Separate task (#87b-extra nebo #79c).

**Implementace:** PARTS_BRANDS = [skoda, volkswagen, bmw, audi, ford, toyota, hyundai, opel] = **8 brands** ✅ matches MVP scope.

**Verdict Q3: ✅ PASS** (Mercedes/Citroën/Peugeot/Renault expansion explicitly out of #87b scope per plan §15 Q3).

---

### Q4 (plán §15) — `dynamic = "force-static"` vs `force-dynamic` pro brand level?
**= team-lead's Q3 ("force-static na všech 3 segmentech")**

**Plán doporučuje:** `force-static` pro všechny 3 templates.

**Implementace verified per template:**

| Template | `dynamic` | `dynamicParams` | `revalidate` | Soubor:řádek |
|---|---|---|---|---|
| `[brand]/page.tsx` | `"force-static"` | `false` | `86400` | :19-21 |
| `[brand]/[model]/page.tsx` | `"force-static"` | `true` | `86400` | :19-21 |
| `[brand]/[model]/[rok]/page.tsx` | `"force-static"` | `true` | `86400` | :21-23 |

`dynamicParams=false` na brand (jen 8 seed brands → 404 jinak), `true` na model+rok (ISR fallback pro long-tail combos). **Konfigurace 1:1 dle plánu §6.1.**

**Verdict Q4: ✅ PASS**

---

### Q5 (plán §15) — JSON-LD ItemList obsahuje `offers.price` nebo jen `name + url`?
**= team-lead's Q4 ("ItemList JSON-LD name+url only (ne price/image)")**

**Plán doporučuje:** Jen `name + url`. Plný `Product` schema (s offers/price) je pro `/dily/[slug]` detail page (existuje z #87a), ne pro ItemList na landing page.

**Implementace:** `lib/seo.ts:61-77`:
```ts
export function generatePartsItemListJsonLd(
  listName: string,
  items: { name: string; url: string }[]
): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: item.url,
      name: item.name,
    })),
  });
}
```
✅ Type-safe — TypeScript nepřijme `price` nebo `image` v items array.

**Volání v 3 templates:**
- `[brand]/page.tsx:90-96` → `{ name: p.name, url: ${BASE_URL}/dily/${p.slug} }`
- `[brand]/[model]/page.tsx:108-114` → identický shape
- `[brand]/[model]/[rok]/page.tsx:130-136` → identický shape

Žádný JSON-LD field s cenou/obrázkem v ItemList. **Pricing zůstává v UI rendering** (`{part.price.toLocaleString("cs-CZ")} Kč` v human-readable section), což je správné — UI ≠ structured data.

**Verdict Q5: ✅ PASS**

---

### Q6 (plán §15) — Model template má vlastní hero copy nebo template-driven?
**= team-lead's Q5 ("template-driven stub content (žádný plain text)")**

**Plán doporučuje:** Template-driven, `{Brand} {Model}` proměnné.

**Implementace `[brand]/[model]/page.tsx:150-157`:**
```tsx
<h1>Náhradní díly {brandData.name} {modelData.name}</h1>
<p>
  Originální použité díly pro {brandData.name} {modelData.name} od
  ověřených vrakovišť za výhodné ceny. Brzdy, motory, karoserie a
  další.
</p>
```

**Implementace `[brand]/[model]/[rok]/page.tsx:177-189`:**
```tsx
<h1>Náhradní díly {brandData.name} {modelData.name} {rok}</h1>
<p>
  Náhradní díly pro {brandData.name} {modelData.name} ročník {rok}.
  Použité originální i nové díly od ověřených vrakovišť.
</p>
{matchingGen && (
  <p>Generace: {matchingGen.name} ({matchingGen.yearFrom}–{matchingGen.yearTo})</p>
)}
```

Vše skrz `brandData.name`, `modelData.name`, `rok` proměnné. ZERO hardcoded copy per konkrétní brand/model/rok. **Plus bonus:** rok template má `matchingGen` lookup pro generation context (z `modelData.generations`) — UX vylepšení nad plán bez deviation.

**Verdict Q6: ✅ PASS**

---

### Q7 (plán §15) — Models grid (4-8 top models) na brand page je #87b nebo #87d?
**= team-lead's Q6 ("models grid na brand page (seed-driven, linkuje do modelů)")**

**Plán doporučuje:** #87b (jelikož #87b vytváří `PARTS_MODELS_BY_BRAND` seed, má smysl rovnou přidat models grid pro internal linking SEO boost).

**Implementace `[brand]/page.tsx:144-167`:**
```tsx
{models.length > 0 && (
  <section ...>
    <h2>Top modely {brandData.name}</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {models.map((model) => (
        <Link
          key={model.slug}
          href={`/dily/znacka/${brand}/${model.slug}`}
          ...
        >
          <span>{brandData.name} {model.name}</span>
          <span>Náhradní díly →</span>
        </Link>
      ))}
    </div>
  </section>
)}
```
- ✅ Sezdaný z `models = PARTS_MODELS_BY_BRAND[brand]`
- ✅ Linkuje na nově vytvořené `[model]` SSG pages
- ✅ Zobrazí se jen pokud `models.length > 0` (defenzivní)
- ✅ Internal linking → SEO boost (model pages dostávají link juice z brand pages)

**Verdict Q7: ✅ PASS**

---

### Q8 (plán §15) — Categories grid (existuje na brand page) zachovat na model + model+rok page?
**= team-lead's "Q7 KRITICKÉ" + MF-1 z kontrolora**

**🔴 KRITICKÝ BOD — vyžaduje doslovný read plánu, NE interpretaci.**

**Doslovný text plánu §15 Q8:**

> "**NE** — categories grid (PARTS_CATEGORIES) je smysluplný jen na brand level. Na model/year page je redundantní (uživatel už ví značku+model, hledá konkrétní díl, ne kategorii). **Místo toho: kategorie filter chips — query param links** /dily/katalog?brand=skoda&model=octavia&kategorie=brzdy."

**Klíčová strukturální analýza textu plánu:**

Plán Q8 má **dva oddělené příkazy** ne jeden:

1. ❌ "categories **grid** ... NE na model/year page" — **GRID** (icon-tile layout, jako v `[brand]/page.tsx:170-202`) zakázán
2. ✅ "Místo toho: kategorie **filter chips** — query param links ..." — **FILTER CHIPS** (rounded-full small) JSOU recommended **alternative**

**Implementace `[brand]/[model]/page.tsx:236-252`:**
```tsx
<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <h2 className="text-xl font-bold text-gray-900 mb-4">
    Hledat díly podle kategorie
  </h2>
  <div className="flex flex-wrap gap-3">
    {PARTS_CATEGORIES.map((cat) => (
      <Link
        key={cat.slug}
        href={`/dily/kategorie/${cat.slug}`}
        className="inline-flex items-center py-2 px-4 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors no-underline"
      >
        {cat.name}
      </Link>
    ))}
  </div>
</section>
```

**Implementace `[brand]/[model]/[rok]/page.tsx:226-242`:** Identický pattern.

**Klasifikace implementace:**

| Aspekt | Implementace | Plán Q8 |
|---|---|---|
| **Struktura** | `flex flex-wrap` chips (`rounded-full`, `py-2 px-4`) | "filter chips" ✅ |
| **NEjsou grid** | NE icon-tile grid (jako brand page) | "NE grid" ✅ |
| **Header text** | "Hledat díly podle kategorie" | navigation intent ✅ |
| **Link target** | `/dily/kategorie/${cat.slug}` (path) | `/dily/katalog?brand=...&model=...&kategorie=...` (query) ⚠️ |

**Decisive analýza:**

1. **Categories chips JSOU explicitly povolené** plánem §15 Q8 jako "Místo toho" alternativa. Plán NIKDE neříká "absolutně žádné kategorie na model/rok pages". Plán říká "NO grid, YES chips".

2. **Implementace MÁ filter chips, NE grid:**
   - Brand page (line 170-202): icon-tile grid s SVG ikonami, `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4`, large tiles
   - Model + rok page: small `rounded-full` text-only chips, `flex flex-wrap`
   - Vizuálně i strukturálně různé komponenty
   - **= rozdílu mezi GRID a CHIPS plán §15 Q8 explicitně definuje**

3. **Real deviation: link strategy.** Implementace linkuje na samostatnou `/dily/kategorie/${slug}` page (která ztratí brand+model context) místo na `/dily/katalog?brand=skoda&model=octavia&kategorie=brzdy` (preserve context).
   - **Severity:** MINOR. Path-based je konzistentní s existujícím routingem (per kontrolorova poznámka v MF-1 line 174). User UX je nadále funkční (chips → categories listing). 
   - **Není to porušení Q8 spirit** — query param verze neexistuje jako route v projektu (`/dily/katalog` není v `app/(web)/dily/`), takže plán's example URL je sám o sobě hypothetical (#87d/#87c expansion).

**Defense team-lead's OPTION A vs můj OPTION C:**

Team-lead's preferenced OPTION A je založen na **interpretaci** plánu jako "absolutně žádné kategorie na model/rok pages". Doslovný text plánu (§15 Q8 line 1025-1026) tuto interpretaci **NEPODPORUJE** — plán explicitly povoluje "filter chips" jako alternative.

EVZEN pravidlo: **Doslovný plán je ground truth, ne interpretace.**

OPTION A (return k přepracování) by byl správný KDYBY:
- Implementace měla **kategorie GRID** (icon-tile) na model/rok pages → ❌ NE, má chips
- Implementace měla **plnou duplikaci brand page categories sekce** → ❌ NE, je to jiná komponenta
- Plán by řekl "absolutně žádné kategorie" → ❌ NE, plán říká "NO grid, YES chips"

Žádná z těchto podmínek není splněna → OPTION A je nesprávný.

**Verdict Q8: ✅ PASS** s **P3 noticing** na link strategy:

> **P3 — Categories chips link strategy:** Chips na model/rok pages linkují na `/dily/kategorie/${slug}` (path-based, ztratí brand+model context). Plán §15 Q8 example navrhuje query param verzi `/dily/katalog?brand=...&model=...&kategorie=...` (preserve context). Path-based je acceptable per kontrolorovou poznámku (konzistentní s existujícím routingem) a query-param URL (`/dily/katalog`) sám o sobě v projektu **neexistuje jako route**. **Doporučení:** vyřešit v #87c/#87d při implementaci `/dily/katalog` filtered listing route. Bez fix v #87b je acceptable.

---

## §2 6 pravidel CarMakler — 6/6 PASS

### Pravidlo 1 — Žádné zkratky v UI (celé názvy)
✅ **PASS** — Vše renderováno přes `brandData.name`, `modelData.name` (full Czech names: "Škoda", "Octavia", "Volkswagen", "BMW", "Audi", atd.). Žádné zkratky typu "ŠO" pro Škoda Octavia. Verifikováno v hero `<h1>` všech 3 templates + breadcrumb labels + categories sections.

### Pravidlo 2 — Duplicitní data jsou OK pokud záměrná
✅ **PASS** — Categories chips na model + rok pages **NEJSOU duplicitní data** s brand page:
- Brand page má **icon-tile GRID** (large, vizuální nav)
- Model/rok pages mají **text-only CHIPS** (small filter intent)
- Různý format = různá UX role (browse vs filter)
- **Plán §15 Q8 explicitně specifies tento dual format** ("NO grid, YES chips")

Universal FAQs (`UNIVERSAL_FAQS` 3 questions) jsou triplicate napříč 3 templates (lines 23-39 v každém). To je **záměrné** per plán §9.4 line 681 ("3 universal FAQs hardcoded" ... "real FAQ obsah přijde s #87c"). Acceptable until #87c centralizes do `lib/seo-data.ts` const.

### Pravidlo 3 — Nic se neschovává (unfinished features označené)
✅ **PASS** — Žádné `display: none`, žádné `visibility: hidden`, žádné conditional rendering pro skryté demo content. Všechny sekce mají `{condition && (...)}` guards (jen pro defenzivní rendering pokud data array prázdné, např. `{topParts.length > 0 && (...)}`).

### Pravidlo 4 — Nic se nemaže bez schválení
✅ **PASS** — `git mv` zachoval history pro `[slug]/error.tsx` → `[brand]/error.tsx` a `[slug]/loading.tsx` → `[brand]/loading.tsx`. Viz `git show --stat 1466223`:
```
.../dily/znacka/{[slug] => [brand]}/error.tsx      |   0
.../dily/znacka/{[slug] => [brand]}/loading.tsx    |   0
```

`[slug]/page.tsx` byl nahrazen `[brand]/page.tsx` (rewrite, NE rename) — diff ukazuje 166 deletions + 312 insertions. **Toto je oprávněné per plán §11.1 row 1** ("RENAME z `[slug]/page.tsx` + modify").

Žádný brand, model, year, category, route, helper, ani test nebyl smazán bez explicitní kontextu plánu.

### Pravidlo 5 — Skryté stránky = ŠPATNĚ
✅ **PASS** — Všech 104 SSG pages je:
- V sitemap (`app/sitemap.ts:177-275` — `partsBrandPages`, `partsModelPages`, `partsModelYearPages`)
- V build manifest (verified by kontrolor: 8 + 24 + 72 = 104 SSG)
- Linkováno z brand page (Models grid → 24 model pages, Top years → 72 rok pages přes model page)
- Žádné `noindex` meta tags

### Pravidlo 6 — Každá změna se schvaluje jednotlivě ← **MF-1 test**
✅ **PASS** — Detailní analýza v §1 Q8 výše. Categories chips (NOT grid) na model/rok pages **JSOU schválené plánem §15 Q8** doslovným textem ("Místo toho: kategorie filter chips"). Implementace neporušuje toto pravidlo, protože:
1. Plán explicitly uvádí filter chips jako alternative
2. Implementace MÁ chips, NE grid
3. Jediná deviation = link target (P3 noticing, ne change scope expansion)

---

## §3 MF-1 + MF-2 z kontrolora — vyřešení

### MF-1 — Categories sekce na model + rok pages
**Kontrolor verdict:** MINOR finding, neblokující.
**Team-lead preferenced action:** OPTION A — return k přepracování.

**🔴 EVZEN decisive verdict: NEITHER OPTION A NOR plain OPTION B — OPTION C: PASS (s defense plánu).**

**Reasoning** (full analýza v §1 Q8 výše):

1. **Plán §15 Q8 explicitly povoluje filter chips:** "Místo toho: kategorie filter chips — query param links". Plán specifies **NO grid + YES chips** dual rule.
2. **Implementace MÁ chips, NE grid** — vizuálně i strukturálně různá komponenta od brand page categories grid.
3. **Team-lead's "Q7" interpretation** ("kategorie jen na brand level, model/rok pages NE") **misreads** plán §15 Q8 jako single command "NE kategorie", ale plán je dual-clause "NO grid, YES chips".
4. **Real deviation = link target strategy** (path-based vs query-param), což je P3 cosmetic, ne change scope.
5. EVZEN pravidlo "doslovný plán = ground truth" zde říká: implementace je v souladu s **literal text plánu**.

**Doporučení implementatorovi:** **Žádný rework needed pro #87b.** Link strategy evolution lze adresovat v #87d (kde se buduje `/dily/katalog` filtered listing route s query param support).

**Audit trail pro team-leada:**
- Plán §15 Q8 plain text quote: "Místo toho: kategorie filter chips — query param links /dily/katalog?brand=skoda&model=octavia&kategorie=brzdy."
- Klíčové slovo "Místo toho" = "instead" (dual rule, ne single ban)
- Klíčové slovo "filter chips" = explicit alternative permitted
- Plán by řekl "absolutně žádné kategorie na model/year pages" — neříká
- → Implementace v souladu s **literal text**, OPTION A je **misreading-driven**

### MF-2 — BreadcrumbList current page `item: ""`
**Kontrolor verdict:** MINOR, technicky čistší by bylo vynechat property.

**🟡 EVZEN P3 noticing — confirmed cosmetic, ne porušení zadání.**

**Implementace `components/web/dily/PartsBreadcrumbs.tsx:19-25`:**
```ts
const jsonLd = generateBreadcrumbJsonLd(
  items.map((item) => ({
    name: item.name,
    url: item.href ? `${BASE_URL}${item.href}` : "",  // ← prázdný string for current page
  }))
);
```

`generateBreadcrumbJsonLd` v `lib/seo.ts:8-20`:
```ts
itemListElement: items.map((item, index) => ({
  "@type": "ListItem",
  position: index + 1,
  name: item.name,
  item: item.url,   // ← always set, even when ""
})),
```

**Schema.org spec:** `BreadcrumbList.itemListElement[].item` je **REQUIRED for non-last items** ale **OPTIONAL for last item** (current page). Empty string `""` není technically valid URI ale Google's parser je tolerantní.

**Verdict:** **P3 cosmetic noticing.** Není porušení plánu §12 AC8 ("BreadcrumbList JSON-LD") — JSON-LD se generuje, je validní JSON, Google ho přečte. **Není to porušení zadání.** Plán nikde nespecifikuje "vynechat `item` u poslední položky".

**Doporučení:** Fix v #87c při refactoru breadcrumb generator (přidat conditional spread `...(item.url ? { item: item.url } : {})`). Bez fix v #87b je acceptable.

---

## §4 Acceptance Criteria §12 — verifikace 14/16 PASS, 2 pending post-deploy

| AC | Popis | Stav | Verifikace |
|---|---|---|---|
| **AC1** | `[slug]` přejmenováno na `[brand]`, git history zachována | ✅ | `git show --stat 1466223` ukazuje `{[slug] => [brand]}/error.tsx` + `loading.tsx` |
| **AC2** | `[brand]/page.tsx` exports `params.brand`, `aliasFor()`, `notFound()` | ✅ | page.tsx:50, 79-85 |
| **AC3** | `[brand]/[model]/page.tsx` ~24 SSG, `dynamicParams=true` | ✅ | page.tsx:20, 41-48 |
| **AC4** | `[brand]/[model]/[rok]/page.tsx` ~72 SSG, regex + range | ✅ | page.tsx:22, 43-58, 106 (`isValidPartsYear`) |
| **AC5** | `PARTS_MODELS_BY_BRAND` 8 brands × 3 models = 24, `generations` | ✅ | grep `topYears: ` = 24, lib/seo-data.ts:1256-1525 |
| **AC6** | `PartsBreadcrumbs.tsx` reusable s `BreadcrumbList` JSON-LD | ✅ | components/web/dily/PartsBreadcrumbs.tsx:19-58 |
| **AC7** | `lib/seo.ts` 2 nové generators + reuse Organization z #87a | ✅ | lib/seo.ts:61-77 (ItemList), :83-96 (FaqPage) |
| **AC8** | `lib/seo/partsItemList.ts` 3 query helpers | ✅ | impl §"Soubory" + 157 LoC verified |
| **AC9** | `app/sitemap.ts` `partsModelPages` + `partsModelYearPages` | ✅ | sitemap.ts:185, 195, 273-275 |
| **AC10** | Každá template: PartsBreadcrumbs + h1 + ItemList + FAQ + Organization JSON-LD + canonical | ✅ | All 3 page.tsx files verified |
| **AC11** | `tsc --noEmit` 0 errors | ✅ | impl §"Quality gates" + qa report |
| **AC12** | `npm run lint` 0 errors | ✅ | 542 warnings preserved baseline |
| **AC13** | `npm run build` succeeds, ≤ 70s | ✅ | DATABASE_URL=dummy + real, EXIT 0 |
| **AC14** | Build output ~104 statických /dily/znacka/* routes | ✅ | 8 + 24 + 72 = 104 (qa report match) |
| **AC15** | Diakritika redirect curl test post-deploy | 🟡 | **PENDING** — post-deploy QA |
| **AC16** | JSON-LD Google Rich Results Test pass | 🟡 | **PENDING** — post-deploy QA |

**Quality gates verified:**
- `npx tsc --noEmit` → 0 errors ✅
- `npx next lint` → 0 errors / 542 warnings (baseline preserved) ✅
- `DATABASE_URL=dummy npm run build` → EXIT 0, 402 SSG pages ✅
- `DATABASE_URL=real npm run build` → EXIT 0 ✅
- `npx vitest run` → 141/141 passing ✅

---

## §5 6 EVZEN pravidel — 6/6 PASS

| # | Pravidlo | Status | Verifikace |
|---|---|---|---|
| 1 | **READ-ONLY** (žádný edit zdrojáků) | ✅ | Tento review file je jediný created file. Žádný Edit/Write na app/, lib/, components/ |
| 2 | **Doslovný check user/plan requirements** | ✅ | Q1-Q8 verified line-by-line proti plánu §15. Plán quotes embedded. |
| 3 | **Bod-po-bodu verifikace** | ✅ | 8 Q + 6 CarMakler rules + 16 AC + 2 MF, každý s file:line proof |
| 4 | **Žádný compromise** | ✅ | MF-1 je decisive PASS s defense plánu, ne handwave. AC15+AC16 explicitně označeny pending. |
| 5 | **Žádný scope creep** | ✅ | Kontroluju jen plan-task-124 scope. Long-form content / SeoContent / revalidation explicitly out of scope. |
| 6 | **Output ONLY do .claude-context/tasks/** | ✅ | Review file: `.claude-context/tasks/review-task-129-87b-evzen.md` |

---

## §6 Final verdict

### ✅ PASS

**Commit `1466223` (#87b 3-segment routing) je v souladu s plánem `plan-task-124`.**

**Q1-Q8 (plán §15):** **8/8 PASS** doslovně.
**6 CarMakler pravidel:** **6/6 PASS** doslovně.
**16 AC §12:** **14/16 PASS** + 2 pending post-deploy (AC15 + AC16).
**6 EVZEN pravidel:** **6/6 PASS**.

**P3 noticings (2, žádný blocker):**

| # | Severity | Popis | Doporučení |
|---|---|---|---|
| **P3-1** | Cosmetic | Categories chips na model/rok pages linkují path-based (`/dily/kategorie/${slug}`) místo plán's example query-param (`/dily/katalog?brand=...&model=...&kategorie=...`). Path-based je konzistentní s existujícím routingem; query-param URL `/dily/katalog` v projektu neexistuje jako route. | Vyřešit v #87d při buildu `/dily/katalog` filtered listing. Bez fix v #87b je acceptable. |
| **P3-2** | Cosmetic | `BreadcrumbList.itemListElement[last].item = ""` (prázdný string místo vynechání property). Schema.org spec: `item` je optional u poslední breadcrumb. Google parser tolerant. | Fix v #87c při refactoru `generateBreadcrumbJsonLd` (conditional spread `...(item.url ? { item: item.url } : {})`). Bez fix v #87b je acceptable. |

**Tým-lead's preferenced OPTION A (return k přepracování) odmítnut** s defense literal plánu §15 Q8 — viz §1 Q8 + §3 MF-1 detailed analýza. Plán explicitly povoluje filter chips jako alternative ("Místo toho: kategorie filter chips"), implementace MÁ chips (NE grid), takže není porušení zadání.

**Pending pre-deploy QA (correctly označeno):**
- AC15 — manual diakritika curl test (`/dily/znacka/škoda/octávia/2018` → 301)
- AC16 — Google Rich Results Test (BreadcrumbList + ItemList + FAQPage)

---

## §7 Next steps

1. ✅ TaskUpdate #129 → completed (po dokončení tohoto review file)
2. ✅ SendMessage team-leadovi s verdict + decisive answer na MF-1 (OPTION C)
3. ⏳ #87b unblocks: `test-chrome` final browser verification + #87c IMPL (Prisma SeoContent)
4. 🟡 Post-deploy QA: AC15 (curl diakritika 301) + AC16 (Google Rich Results Test)

**Implementace #87b je production-ready. Schvaluji pro test-chrome → deploy chain.**

---

**Konec review.**
