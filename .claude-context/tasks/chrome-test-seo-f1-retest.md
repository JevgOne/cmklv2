# RE-TEST: SEO Fáze 1 — Ověření fixů 4 bugů

**Datum:** 2026-05-24  
**Tester:** test-chrome  
**Task ref:** #21  
**Nástroj:** Python urllib (server-side) — Playwright headless na /nabidka crashoval server

---

## Výsledek: ✅ 3/4 bugů opraveny, 1 zůstává (nový)

---

## B1: Sub-sitemaps `/sitemap/N.xml` — ✅ OPRAVENO

Všechny sitemaps 0-8 vrací HTTP 200 s platným XML:

| Sitemap | HTTP | URLs | Obsah |
|---------|------|------|-------|
| sitemap/0.xml | 200 | 34 | Static pages (carmakler.cz, /nabidka, ...) |
| sitemap/1.xml | 200 | 19 | Vehicle pages |
| sitemap/2.xml | 200 | 9 | Listing pages |
| sitemap/3.xml | 200 | 35 | Parts pages |
| sitemap/4.xml | 200 | 16 | Broker profiles |
| sitemap/5.xml | 200 | 11 | Blog articles |
| sitemap/6.xml | 200 | 45 | Autoservisy + STK |
| sitemap/7.xml | 200 | 0 | Partners — prázdné (žádná data v dev DB, očekáváno) |
| sitemap/8.xml | 200 | 280 | Landing pages |

**Celkem: 449 URLs indexovaných**

---

## B2: `/sitemap/8.xml` (landing-pages) má URL záznamy — ✅ OPRAVENO

280 URL záznamů včetně:
- Značky: `https://carmakler.cz/nabidka/skoda`
- Modely: `https://carmakler.cz/nabidka/skoda-octavia-rs-combi`
- Dily: `https://carmakler.cz/dily/kategorie/...`, `https://carmakler.cz/dily/znacka/...`

---

## B3: `/nabidka` — og:image — ✅ OPRAVENO

Nalezeny OG meta tagy:
```html
<meta property="og:image:alt" content="Ojetá vozidla na prodej — prověřená auta od makléřů"/>
<meta property="og:image:type" content="image/png"/>
<meta property="og:image" content="http://localhost:3000/nabidka/opengraph-image-isrpq4?..."/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
```
✅ Dynamický Next.js OG image route — správné řešení.

---

## W1: Homepage Organization JSON-LD — ✅ OPRAVENO (duplicita odstraněna)

Homepage nyní má pouze **1× Organization JSON-LD** (dříve 2×):
```json
{ "@type": "Organization", "knowsAbout": [...], "areaServed": {"@type": "Country", "name": "Česká republika"} }
```

JSON-LD typy na homepage: `['Organization', 'WebSite', 'FAQPage']`  
✅ Duplicita odstraněna.

---

## Nový problém: `/sitemap.xml` index — ❌ STÁLE 404

`/sitemap.xml` vrací HTTP 404 — sitemap index neexistuje.

`robots.txt` stále odkazuje: `Sitemap: https://carmakler.cz/sitemap.xml`

**Dopad:** Google crawlbot nenajde žádné sub-sitemaps bez index souboru.  
**Příčina:** `app/sitemap.ts` používá `generateSitemaps()` pattern, který by měl automaticky generovat index na `/sitemap.xml` — ale Next.js 15 dev server ho neserviruje.

> **Poznámka:** V Next.js 15, `generateSitemaps()` + `export default sitemap()` vytváří:
> - Indexový soubor na `/sitemap.xml` automaticky  
> - Sub-sitemaps na `/sitemap/[id].xml`
> 
> Pokud `/sitemap.xml` vrací 404, může jít o Turbopack bug v dev módu nebo chybí `unstable_noStore()` import. V production buildu pravděpodobně funguje.

---

## Vedlejší poznámka: Dev server instabilita při prvním requestu na sitemaps

Při cold-start (první požadavek na sitemap route):
- Server na první request neodpoví ~45s+ (Turbopack kompilace)
- Při paralelním přístupu více klientů (Playwright + curl) server crashuje

**Doporučení:** Po restartu nejprve zahřát homepage, pak sitemaps.

---

## Shrnutí

| Bug | Status | Poznámka |
|-----|--------|----------|
| B1: Sub-sitemaps vrací XML | ✅ OPRAVENO | 449 URLs celkem |
| B2: sitemap/8 má URL záznamy | ✅ OPRAVENO | 280 landing pages |
| B3: /nabidka og:image | ✅ OPRAVENO | Dynamic OG route |
| W1: Organization JSON-LD duplicita | ✅ OPRAVENO | 1× Organization |
| `/sitemap.xml` index 404 | ❌ NOVÝ BUG | Google nenajde sitemaps |
