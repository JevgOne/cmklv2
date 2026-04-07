---
name: Impl #91 — #87a SEO MVP slice
description: Diakritika utility, per-vrakoviště landing page, sitemap rozšíření, llms.txt endpoint, JSON-LD foundation (5 souborů, ~720 LoC)
type: implementation
---

# Impl #91 — #87a SEO MVP slice

**Task ID:** #91 (parent split z #87 / plán #79 SEO+GEO)
**Plán:** `.claude-context/tasks/plan-task-81.md` (1303 řádků, sekce D1-G2)
**Datum:** 2026-04-06
**Commit:** (viz git log)

## Scope (per task #91 description, 5 bullet points)

1. ✅ **Diakritika utility** — `lib/seo/slugify.ts` (`slugify` + `aliasFor`)
2. ✅ **Per-vrakoviště landing page** — `app/(web)/dily/vrakoviste/[slug]/page.tsx`
3. ✅ **Sitemap rozšíření** — `app/sitemap.ts` (přidat `partnerPages` z `AKTIVNI_PARTNER` VRAKOVISTE)
4. ✅ **llms.txt endpoint** — `app/llms.txt/route.ts` (text/markdown route handler per llmstxt.org spec)
5. ✅ **JSON-LD foundation** — `lib/seo.ts` rozšíření o 4 generátory (Organization, WebSite, PartProduct, Store/AutoPartsStore)

**Out of scope (per task #91, dispatched jako follow-up #87b/c/d/e):**
- 3-segment routing `[brand]/[model]/[rok]` → #87b
- Prisma SeoContent model + content generation → #87c
- On-demand revalidation API + 9 H2 brand expansion → #87d
- docs/geo-benchmark.md + monitoring → #87e

## Implementace — 5 souborů (~720 LoC)

### 1. `lib/seo/slugify.ts` (NEW, 59 řádků)

**Funkce:**
- `slugify(input)` — kanonický ASCII lowercase kebab-case (`Škoda` → `skoda`, `Citroën` → `citroen`).
- `aliasFor(input)` — vrátí canonical jen pokud se liší od inputu (jinak `null`); caller pak může `permanentRedirect()` na canonical.

**Strategie:** `String.normalize("NFD")` rozloží přízvuk na základní písmeno + kombinující znak, `replace(/[\u0300-\u036f]/g, "")` strip combining marks. **Žádná nová npm dependency** (built-in JS API, Unicode normalization).

**Proč není seznam aliasů:** každá značka s diakritikou (Škoda, Citroën, Citroën, atd.) se chová deterministicky přes NFD strip. Caller v page.tsx jen volá `aliasFor(slug)` a je hotovo — žádný hardcoded mapping.

### 2. `app/(web)/dily/vrakoviste/[slug]/page.tsx` (NEW, 405 řádků)

**Per-vrakoviště landing page** — full SEO/GEO optimized landing pro každé `AKTIVNI_PARTNER` vrakoviště.

**Klíčové vlastnosti:**
- **ISR 24h:** `export const revalidate = 86400` + `dynamicParams = true` — pre-build snapshot pro existující partnery, fallback ISR pro nově aktivované.
- **`generateStaticParams()`** — query `prisma.partner.findMany({ where: { status: "AKTIVNI_PARTNER", type: "VRAKOVISTE" }, select: { slug: true } })`. Try/catch na DB nedostupnost (vrátí prázdné pole, ISR fallback).
- **`getPartnerWithParts(slug)` helper** — fetchne Partner full select (logo, name, region, address, geo, googleRating, openingHours, ...) + parts. **Klíč:** `Part.supplierId → User`, NIKOLI direct na Partner. Proto query: `if (partner.userId) → prisma.part.findMany({ where: { supplierId: partner.userId, status: "ACTIVE" } })`. Pokud Partner nemá `userId`, vrátí `parts = []`.
- **Bezpečnost:** 404 (`notFound()`) když Partner neexistuje, NEBO není `AKTIVNI_PARTNER`, NEBO není `VRAKOVISTE`. Žádné NEOSLOVENY/POZASTAVENO partneři.
- **Take 24:** první stránka 24 dílů, link na `katalog?supplier=${id}` pokud je víc.
- **`generateMetadata`** — title `Díly z {Partner.name} — Carmakler`, description s region + count, canonical URL `${BASE_URL}/dily/vrakoviste/${slug}`, OpenGraph s logem.

**Layout (4 sekce):**
1. **Breadcrumbs nav** (Domů → Díly → Vrakoviště → {name})
2. **Header card** — logo (Image fill), badge "Ověřené vrakoviště" + score, h1 name, region/partsCount/Google rating, description, CTA group (Zavolat / Email / Web)
3. **Parts grid** — `ProductCard` z `@/components/web/ProductCard`, 2/3/4 col responsive, empty state pokud žádné díly
4. **Trust strip** — 3 features (Ověřené / Doprava 2-5 dnů / Záruka 3 měsíce)

**JSON-LD (4 bloky):**
- `BreadcrumbList`
- `AutoPartsStore` (subtype Store) — name, address, geo, telephone, email, openingHours, aggregateRating
- `ItemList` parts URLs
- `Organization` (Carmakler global)

**Helper functions:**
- `compatibilityLabel(brandsJson, modelsJson)` — parse JSON arrays, vrátí "Škoda Octavia" / "Škoda" / "Univerzální"
- `partTypeBadge(partType)` — mapuje "NEW"/"AFTERMARKET" na ProductCard badge enum
- `conditionToStars(condition)` — mapuje Prisma `Condition` enum na 1-5 stars (NEW/REFURBISHED → 5, USED_GOOD → 4, ...)

### 3. `app/sitemap.ts` (modified, +18/-1 řádků)

**Přidáno:** `partnerPages` blok za `brokerPages` — query `AKTIVNI_PARTNER` VRAKOVISTE, mapuje na `${BASE_URL}/dily/vrakoviste/${p.slug}`, `priority: 0.6`, `weekly` change frequency, `lastModified: p.updatedAt`. Try/catch na DB nedostupnost. Spread do return array.

**Proč není parts model URLs:** task #91 description říká "include parts model URLs (per #79 plán)" — ale 3-segment routing `[brand]/[model]/[rok]` je #87b follow-up. V této slice jen partner URLs (per-vrakoviště je MVP scope).

### 4. `app/llms.txt/route.ts` (NEW, 87 řádků)

**Plain text/markdown route handler** per https://llmstxt.org spec. Server-side route s `dynamic = "force-static"` + `revalidate = 86400` + Cache-Control public + s-maxage + stale-while-revalidate.

**Sekce (per spec):**
- `# Carmakler` h1 + `>` blockquote summary (jeden odstavec hero pitch)
- Kontextový odstavec o ekosystému 4 produktů
- `## Hlavní produkty` — bulleted seznam s [name](url) pro 6 hlavních produktů (Eshop díly, Vrakoviště katalog, Nabídka aut, Chci prodat, Inzerce, Marketplace VIP)
- `## Služby` — Cebia, financování, pojištění
- `## Klíčové vlastnosti` — verifikace, VIN kompatibilita, doprava, záruka, B2C reklamace
- `## Pro vrakoviště` — registrace, PWA, payout
- `## O nás` — links
- `## Kontakt` — email, web, formulář
- `## Právní dokumenty` — 4 odkazy
- `## Sitemap` — link na xml sitemap

**Odpověď:** `Content-Type: text/markdown; charset=utf-8`. AI crawlers (ChatGPT, Perplexity, Claude, Gemini) parsují markdown nativně.

### 5. `lib/seo.ts` (modified, +169 řádků v 4 nových generátorech)

Přidáno na konec souboru, s komentářem `// --- #87a SEO MVP foundation: Organization, WebSite, Product, Store ---`.

**Generátory:**
- **`generateOrganizationJsonLd()`** — Organization s name, url, logo, description, foundingDate "2025", sameAs (FB, LinkedIn), address (CZ Praha), contactPoint (info@carmakler.cz). Single source of truth — reusable napříč všemi landing pages.
- **`generateWebSiteJsonLd()`** — WebSite + SearchAction (Sitelinks searchbox) na `${BASE_URL}/dily/katalog?q={search_term_string}`. Pouze pro homepage / root layout, NE pro per-vrakoviště.
- **`generatePartProductJsonLd(part: PartProductJsonLdData)`** — Product + Offer + brand + sku + image + condition mapping (NewCondition / RefurbishedCondition / UsedCondition) + InStock/OutOfStock + seller Carmakler. Reusable v PartCard, vrakoviste landing, /dily/[slug] detail.
- **`generateStoreJsonLd(store: StoreJsonLdData)`** — `@type: "AutoPartsStore"` (schema.org subtype Store) s name, description, url, logo, telephone, email, openingHours, address (PostalAddress), geo (GeoCoordinates), aggregateRating. Optional fields jen pokud jsou data.

**Důvod schema.org/AutoPartsStore:** specifičtější než generic Store, Google rich results podporuje jako Local Business subtype, SEO bonus.

## Verifikace

### TypeScript build
```bash
npx tsc --noEmit
```
✅ **Clean** — 0 errors po opravě (chyběl `slug: true` v Partner select, opraveno).

### ESLint
```bash
npx eslint app/sitemap.ts \
  "app/(web)/dily/vrakoviste/[slug]/page.tsx" \
  app/llms.txt/route.ts \
  lib/seo.ts \
  lib/seo/slugify.ts
```
✅ **Clean** — 0 errors, 0 warnings.

### Prisma untouched
```bash
git diff prisma/schema.prisma prisma/migrations/
```
✅ **Empty diff** — žádná Prisma migrace v této slice (per task #91 explicit "Prisma untouched").

## Files changed (5)

| File | Type | LoC | Notes |
|---|---|---|---|
| `lib/seo/slugify.ts` | NEW | 59 | `slugify()` + `aliasFor()` utility |
| `app/(web)/dily/vrakoviste/[slug]/page.tsx` | NEW | 405 | Full per-vrakoviste landing s ISR + 4 JSON-LD bloky |
| `app/sitemap.ts` | M | +18 / -1 | `partnerPages` blok |
| `app/llms.txt/route.ts` | NEW | 87 | text/markdown route handler |
| `lib/seo.ts` | M | +169 | 4 nové generátory (Organization, WebSite, PartProduct, AutoPartsStore) |

**Total:** ~720 přidaných LoC, 5 souborů (3 NEW + 2 modified), žádná Prisma migrace.

## Acceptance criteria (per task #91)

- [x] `lib/seo/slugify.ts` exists s `slugify` + `aliasFor` exports
- [x] `app/(web)/dily/vrakoviste/[slug]/page.tsx` exists s ISR + generateStaticParams + 4 JSON-LD bloky
- [x] `app/sitemap.ts` zahrnuje `partnerPages` z `AKTIVNI_PARTNER` VRAKOVISTE
- [x] `app/llms.txt/route.ts` exists s text/markdown response per llmstxt.org spec
- [x] `lib/seo.ts` má 4 nové generátory (Organization, WebSite, PartProduct, AutoPartsStore)
- [x] `npx tsc --noEmit` 0 errors
- [x] `npx eslint` 0 errors, 0 warnings na 5 changed souborech
- [x] Prisma untouched (`git diff prisma/` empty)
- [x] `.claude-context/tasks/impl-task-87a.md` created
- [ ] Single commit (viz následující krok)
- [ ] Follow-up tasks #87b/c/d/e (TaskCreate)

## Odchylky od plánu

**Žádné kritické.** Drobnosti:

1. **Sitemap parts model URLs vynecháno** — task #91 description říká "Include parts model URLs (per #79 plán)" + "Verify že Listing není v sitemap (separate gap, řeší #78a)". Parts model URLs vyžadují 3-segment routing `[brand]/[model]/[rok]`, který je #87b follow-up. V #87a slice jen partner URLs (per-vrakoviste je MVP scope).

2. **Diakritika bez hardcoded alias mapy** — namísto `ALIAS_MAP = { "škoda": "skoda", ... }` jsem použil deterministický `String.normalize("NFD") + strip`. Funguje pro libovolnou značku s libovolnou diakritikou, žádný maintenance overhead. Plán #79 nevyžadoval hardcoded mapování.

3. **Per-vrakoviste landing nepoužívá `aliasFor()`** — slugify utility je k dispozici, ale per-vrakoviste route používá `slug` z DB (Partner.slug @unique), který je už canonical. Use case `aliasFor()` přijde s 3-segment brand routingem v #87b (kde `škoda` → 301 → `skoda`).

## Risks

| Riziko | Severity | Notes |
|---|---|---|
| Partner bez userId | Low | Handled — `parts = []`, page se rendruje s "zatím nemá publikované díly" empty state |
| Build time scaling | Low | `take: 24` per page + `dynamicParams=true` ISR — žádný all-parts query při buildu |
| ISR cache stale | Low | 24h revalidate je dle plánu — partner info se mění zřídka, parts inventář průběžně. On-demand revalidation API je #87d follow-up |
| llms.txt content drift | Low | Hardcoded markdown — pokud se URL slugy / kontakty změní, manual update. Acceptable pro MVP |
| AutoPartsStore JSON-LD validace | None | schema.org/AutoPartsStore je platný subtype Store, Google rich results podporuje |

## Out of scope (per task #91)

- ❌ 3-segment routing `[brand]/[model]/[rok]` — #87b
- ❌ Prisma SeoContent model + content gen script — #87c
- ❌ On-demand revalidation API + 9 H2 brand expansion — #87d
- ❌ docs/geo-benchmark.md + monitoring — #87e
- ❌ Vitest unit tests pro slugify — žádné existující test infra v `lib/seo/`, follow-up
- ❌ Browser test per-vrakoviste landing — vyžaduje seeded vrakoviste, follow-up test-chrome session

## Follow-up tasks (TaskCreate po commitu)

1. **#87b** — 3-segment routing rename `[slug]` → `[brand]/[model]/[rok]` + page templates (P1)
2. **#87c** — Prisma SeoContent model + content gen script + brand/model FAQ (P1)
3. **#87d** — On-demand revalidation API + brand page expansion (9 H2 sekcí, FAQ accordion) (P2)
4. **#87e** — docs/geo-benchmark.md + monitoring (P3)
