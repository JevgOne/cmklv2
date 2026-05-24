# QA Report: Fáze 1 SEO ekosystému (6 commitů)
**Datum:** 2026-05-24  
**Commity:** 0b75e7a, 54c8619, 46c97fc, 316403e, 3592f30, 0da4b38, 5874f1a  
**QA agent:** kontrolor  
**Reference:** plan-seo-ecosystem.md §4, §6.2.1, §7, §9.2.1

---

## Reverzní kontrola — Výsledek

### ✅ Sitemap index s 9 sub-sitemaps (§7.1)

`app/sitemap.ts` implementuje `generateSitemaps()`:
```typescript
const SITEMAP_IDS = ["static","vehicles","listings","parts","brokers","blog","services","partners","landing-pages"]
export async function generateSitemaps() {
  return SITEMAP_IDS.map((_, i) => ({ id: i })); // → 9 sub-sitemaps
}
```
Všechny switch case větve pokrývají 9 typů. STOP-5 fix (§7.5): `STATIC_LAST_MODIFIED = new Date("2026-05-01")` ✅

⚠️ **Drobná odchylka:** Plán navrhuje string IDs (`{ id: "static" }`), implementace používá numerické IDs (0-8) mapované přes SITEMAP_IDS pole. Funkčně ekvivalentní, Next.js sitemap API akceptuje obojí.

---

### ✅ Canonical na blog/kategorie, stk/mesto, shop/produkt (§7.2)

| Stránka | Soubor | Výsledek |
|---------|--------|---------|
| `/blog/kategorie/{slug}` | `blog/kategorie/[slug]/page.tsx:31` | `pageCanonical(/blog/kategorie/${slug})` ✅ |
| `/stk/mesto/{city}` | `stk/mesto/[city]/page.tsx:25` | `pageCanonical(/stk/mesto/${city})` ✅ |
| `/shop/produkt/{slug}` | `shop/produkt/[slug]/page.tsx:34` | `pageCanonical(/dily/${slug})` ✅ (správná kanonická verze) |

---

### ✅ Filter URL noindex na /nabidka (§7.4)

`app/(web)/nabidka/page.tsx:28-43`:
```typescript
const hasFilters = Object.keys(params).length > 0;
return {
  title: hasFilters ? "Filtrovaná nabídka vozidel" : "Ojetá vozidla na prodej...",
  alternates: pageCanonical("/nabidka"),  // vždy base URL
  ...(hasFilters && { robots: { index: false, follow: true } }),
};
```
Filtrované URL jsou noindex, canonical vždy na `/nabidka` ✅

---

### ✅ Robots.txt doplněn (§7.6)

`app/robots.ts` — nové disallow záznamy:
- `/moje-inzeraty/` ✅
- `/shop/moje-objednavky/` ✅
- `/dily/moje-objednavky/` ✅
- `/hledat` ✅
- AI crawlery (GPTBot, ClaudeBot, PerplexityBot, Applebot-Extended, GoogleOther, OAI-SearchBot, CCBot, ChatGPT-User, Claude-SearchBot, Claude-User) — 10 pravidel ✅

---

### ✅ SeoPageMeta model + getPageMeta() (§4)

**DB model** — `prisma/schema.prisma:1175` — přesně odpovídá plánu:
- `pagePath @unique`, `pageType`, `section`, `title?`, `description?`, `canonical?`, `noIndex`, `ogTitle?`, `ogDescription?`, `ogImageUrl?`, `schemaTypesJson?`, audit fields ✅

**Migration** — `prisma/migrations/20260524100000_add_seo_page_meta/migration.sql` existuje ✅
- `CREATE TABLE "seo_page_meta"` s plnou definicí ✅
- 3 indexy: `section`, `pageType`, `auditStatus` ✅

**`lib/seo-meta.ts`** — `getPageMeta()` funkce:
- DB override nebo code default fallback ✅
- `try/catch` — DB unavailable → použije hardcoded defaults ✅
- `canonical override` + `noIndex` + `ogImageUrl` override ✅

---

### ✅ 6 nových JSON-LD schemas na list stránkách (§7.3)

| Stránka | Schema typ | Soubor | Status |
|---------|-----------|--------|--------|
| `/nabidka` | CollectionPage + ItemList | `nabidka/page.tsx:228` | ✅ |
| `/bazar/{slug}` | AutoDealer | `bazar/[slug]/page.tsx:92` | ✅ `generateAutoDealerJsonLd()` |
| `/stk/mesto/{city}` | ItemList | `stk/mesto/[city]/page.tsx:56` | ✅ |
| `/blog` | Blog + ItemList | `blog/page.tsx:110` | ✅ |
| `/makleri` | ItemList | `makleri/page.tsx:91` | ✅ |
| `/dily` | ItemList | `dily/page.tsx:99` | ✅ |

Všechny 6 JSON-LD implementovány ✅

---

### ✅ Organization enrichment — knowsAbout, areaServed, sameAs (§9.2.1)

`lib/seo.ts:347` — `generateOrganizationJsonLd()`:
```typescript
sameAs: [
  "https://www.facebook.com/carmakler",
  "https://www.instagram.com/carmakler",   // ← nové
  "https://www.linkedin.com/company/carmakler",
  "https://www.youtube.com/@carmakler",    // ← nové
],
knowsAbout: ["ojetá vozidla", "prodej aut", "autodíly", "technická kontrola",
             "autoservisy", "financování vozidel", "pojištění aut"],  // ← nové
areaServed: { "@type": "Country", name: "Česká republika" },  // ← nové
```
Všechna 3 pole přidána, plně odpovídá §9.2.1 ✅

---

### ✅ OG SVG logo (§6.2.1)

`lib/og-image.tsx`:
```typescript
export const OG_SIZE = { width: 1200, height: 630 };  // ← explicitně přidáno ✅
const logoData = await readFile(join(process.cwd(), "public/brand/logo-white.svg"));
cachedLogo = `data:image/svg+xml;base64,...`;  // ← SVG (ne PNG) ✅
```
Logo přepnuto na SVG pro ostřejší rendering v OG obrázcích ✅

---

### ✅ Nabídka keyword-rich title (commit 5874f1a)

`app/(web)/nabidka/page.tsx:33`:
```typescript
title: "Ojetá vozidla na prodej — prověřená auta od makléřů"
```
Keyword-rich title bez filtrů ✅

---

## Debug kontrola

### ✅ TypeScript: 0 chyb
```
NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit → žádný výstup (čistý)
```

### ✅ Lint: 0 errors, 738 pre-existing warnings
```
npm run lint → ✖ 738 problems (0 errors, 738 warnings)
```
Všechna varování jsou **pre-existující** (test soubory + minifikovaný vendor bundle) — nesouvisí s Fází 1 SEO. Nové chyby: ŽÁDNÉ.

---

## Simplify kontrola

### Drobné nálezy (neblokující):

1. **`nabidka/page.tsx:233`** — `catalogJsonLd` hardcoduje `"https://carmakler.cz/nabidka"` místo BASE_URL konstanty. Ostatní soubory (blog, makleri) také hardcodují — konzistentní vzor, ale BASE_URL by bylo čistší.

2. **Sitemap numerické IDs** — funkčně OK, ale string IDs by byly čitelnější při debugování (`/sitemap/0.xml` vs `/sitemap/static.xml`). Ne bug.

3. **`makleri/page.tsx`** — ItemList inline (není exportovaná funkce). Konzistentní s ostatními pages, ale žádná sdílená generátor funkce.

**Žádná z výtek není blocker.** Kód je čistý, bez duplicit, správně strukturovaný.

---

## Celkový verdikt

**✅ FÁZE 1 SEO EKOSYSTÉMU SCHVÁLENA**

| Kontrola | Výsledek |
|----------|---------|
| Sitemap index s 9 sub-sitemaps | ✅ |
| Canonical na blog/kategorie, stk/mesto, shop/produkt | ✅ |
| Filter URL noindex na /nabidka | ✅ |
| Robots.txt doplněn (+4 disallow, 10 AI rules) | ✅ |
| SeoPageMeta model v schématu | ✅ |
| DB migrace pro seo_page_meta | ✅ |
| getPageMeta() v lib/seo-meta.ts | ✅ |
| 6 JSON-LD na list stránkách | ✅ |
| Organization: knowsAbout + areaServed + sameAs | ✅ |
| OG logo přepnuto na SVG | ✅ |
| Nabídka keyword-rich title | ✅ |
| TypeScript bez chyb | ✅ |
| Lint bez nových errors | ✅ |
