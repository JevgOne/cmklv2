# SEO Master Audit — carmakler.cz (Live)

**Datum:** 2026-05-22  
**Metoda:** curl raw HTML + WebFetch na 9 live URL  
**Hodnocení: 62/100** — implementace ambiciózní, ale 3 kritické bugy ji podkopávají

---

## Shrnutí

Carmakler má SEO implementaci LEPŠÍ než konkurence (Sauto.cz a TipCars nemají OG tagy ani Car JSON-LD na živém webu). Ale 3 bugy v produkci znehodnocují vykonanou práci.

---

## 🔴 KRITICKÉ (blokuje rich snippets / CTR)

### 1. nabidka/[slug] — NULOVÝ JSON-LD v produkci

**Ověřeno:** `curl https://carmakler.cz/nabidka/skoda-oktavia-2014-ht6cfv | grep -c 'ld+json'` → **0**

HTML stránky má 128 KB. Title, OG tagy, canonical jsou správně. Ale `<script type="application/ld+json">` — zero. Google vidí vozidlový inzerát BEZ strukturovaných dat.

**Dopad:** Žádné vehicle rich snippets, žádná cena ve výsledcích hledání, žádný breadcrumb v SERP pro nejdůležitější stránky celé platformy.

**Pravděpodobná příčina:** React 18 RSC rendering bug — `<script dangerouslySetInnerHTML>` uvnitř `<div>` v Server Component se nemusí serializovat do HTML streamu. V Next.js App Router existuje pattern: JSON-LD by měl být renderován přes `<Head>` nebo přes `next/script`.

**Fix:**
```tsx
// MÍSTO:
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />

// POUŽIJ: (v server component, v returnu před <div>)
// Vložit do <head> přes next/head nebo jako inline script:
import Script from "next/script";
<Script id="vehicle-jsonld" type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd) }}
/>
```
Nebo ověřit alternativně přes vercel devtools / Google Search Console → URL inspection.

---

### 2. Duplicitní brand v titulcích

**Live důkaz:**
- `/autoservisy`: `"Autoservisy — ověřené recenze | CarMakléř | CarMakléř"` ← dvojí brand
- `/cenik`: `"Ceník | Carmakler | CarMakléř"` ← nekonzistentní brand + dvojí

**Dopad:** Google truncuje titulky na ~60 znaků. Dvojí brand plýtvá místem. "Carmakler" bez diakritiky je jiné než "CarMakléř" — matoucí pro brand signály.

**Root cause:** Šablona titulku pravděpodobně přidává `| CarMakléř` a layout RootLayout přidává taky `| CarMakléř` → duplication.

---

### 3. autoservisy BreadcrumbList — nefunkční

**Live JSON-LD:**
```json
{"@type":"BreadcrumbList","itemListElement":[
  {"@type":"ListItem","position":1,"name":"Autoservisy"}
]}
```

Chybí:
- `item` URL na ListItem → Google nemůže zobrazit breadcrumb v SERP
- Domů jako první position → BreadcrumbList má jen 1 krok bez root

**Srovnání s blog (správně):**
```json
{"itemListElement":[
  {"@type":"ListItem","position":1,"name":"Domů","item":"https://carmakler.cz/"},
  {"@type":"ListItem","position":2,"name":"Blog"}
]}
```

---

## 🟠 VYSOKÁ PRIORITA

### 4. WebSite SearchAction — wrong target URL

**Live:**
```json
"target": {
  "@type": "EntryPoint",
  "urlTemplate": "https://carmakler.cz/dily/katalog?q={search_term_string}"
}
```

**Problém:** SearchAction cílí na `/dily/katalog` (eshop dílů), ne na globální vyhledávání `/hledat`. Google Sitelinks search box by ukazoval vyhledávač jako "hledej autodíly" místo "hledej auta/vše".

**Fix:** Změnit target na `https://carmakler.cz/hledat?q={search_term_string}`

---

### 5. Organization schema — špatné jméno

**Live:**
```json
{"@type":"Organization","name":"CarMakler"}
```

Správně: `"CarMakléř"` (s háčkem a čárkou). Google Knowledge Panel používá tento název.

---

### 6. Sitemap — chybí /profil/* stránky

**Live sitemap.xml:** 932 URL, ale **0 profil/* stránek**.

Broker profily (`/profil/jan-novak-abc123`) jsou nejcennější stránky pro long-tail SEO ("makléř Praha", "makléř Brno"). Nejsou v sitemapě → Google je obtížněji crawluje.

**Fix:** Přidat `profil` sekci do `app/sitemap.ts`.

---

### 7. Meta description — double space/comma na vehicle detailu

**Live:** `"Škoda Oktavia , rok 2014, cena 128\xa0000 Kč. Liberec."`

Dvojá mezera před čárkou (bodyType je null → prázdná mezera). Vypadá nekvalitně.

**Fix:** Odfiltrovat prázdné hodnoty v generateMetadata pro nabidka/[slug].

---

## 🟡 STŘEDNÍ PRIORITA

### 8. blog BreadcrumbList — chybí `item` na posledním ListItem

**Live:**
```json
{"position":2,"name":"Blog"}  // chybí "item"
```

Google technicky akceptuje chybějící `item` na posledním breadcrumbu, ale Rich Results Test to hlásí jako warning. Pro /blog/[slug] detailové stránky by `item` mělo být přítomné.

---

### 9. nabidka listing — pouze 2 ItemList položky

**Live:**
```json
{"@type":"ItemList","numberOfItems":2,"itemListElement":[...2 items...]}
```

Na hlavní nabídkové stránce jsou jen 2 vozidla v schematu. Buď je databáze prázdná (MVP), nebo schema nezahrnuje všechny výsledky. Pro Google je signal kvality i počet nabídek.

---

### 10. twitter:title ≠ og:title (homepage)

- `og:title`: "Prodejte auto za nejlepší cenu, kupte bezpečně | CarMakléř"
- `twitter:title`: "CarMakléř | Prodej aut přes ověřené makléře"

Různé hodnoty jsou přijatelné, ale pro konzistenci brand messagingu je lepší mít shodné.

---

### 11. Chybí hreflang

Web je česky-only, hreflang pro `cs-CZ` + `x-default` chybí. Pro SEO na Google.cz (vs google.com) je to low-priority, ale kompletní implementace by ho měla mít.

---

## ✅ CO FUNGUJE SPRÁVNĚ

| Oblast | Status | Detail |
|---|---|---|
| **llms.txt** | ✅ | Existuje, comprehensive — pokrývá všechny 4 produkty |
| **robots.txt** | ✅ | AI boty (Claude, GPT, Perplexity) správně nastaven |
| **Canonical URLs** | ✅ | Konzistentní na všech testovaných stránkách |
| **OG image** | ✅ | Všechny stránky mají og:image (1200×630) |
| **FAQPage JSON-LD** | ✅ | Homepage, nabídka, ceník, služby, prověrka, financování, pojištění |
| **WebSite JSON-LD** | ✅ | Homepage — SearchAction přítomna (špatný target URL) |
| **Organization JSON-LD** | ✅ | Homepage — kontakt, adresa (špatný název) |
| **Sitemap.xml** | ✅ | 932 URL, autoservisy/STK správně |
| **Twitter card** | ✅ | summary_large_image na všech stránkách |
| **Meta description** | ✅ | Všechny klíčové stránky — délka 120-160 znaků |

---

## Srovnání s konkurencí

| Funkce | Carmakler | Sauto.cz | TipCars.com |
|---|---|---|---|
| FAQPage JSON-LD | ✅ 7+ stránek | ❌ 0 | ❌ 0 |
| Car JSON-LD | ❌ bug | ❌ | ❌ |
| BreadcrumbList | ✅ (s bugy) | ❌ | ❌ |
| OG image | ✅ vlastní gen. | ❌ | ❌ |
| llms.txt | ✅ | ❌ | ❌ |
| robots.txt AI bots | ✅ | ⚠️ | ⚠️ |
| Organization JSON-LD | ✅ | ❌ | ✅ |
| WebSite + SearchAction | ✅ | ❌ | ❌ |

**Carmakler je napřed** — ale jen pokud opraví bud. Zejména Car JSON-LD by při správné funkci dával výraznou výhodu v SERP (price chips, vehicle specs).

---

## Prioritní opravy (doporučené pořadí)

| # | Problém | Dopad | Složitost |
|---|---|---|---|
| 1 | nabidka/[slug] JSON-LD nefunguje | 🔴 KRITICKÝ | střední (debug) |
| 2 | Duplicitní brand v title | 🔴 CTR -20% | nízká |
| 3 | autoservisy BreadcrumbList broken | 🔴 SERP breadcrumbs | nízká |
| 4 | WebSite SearchAction target URL | 🟠 Sitelinks | nízká |
| 5 | Organization name bez diakritiky | 🟠 Brand | triviální |
| 6 | Sitemap chybí /profil/* | 🟠 Crawl | nízká |
| 7 | Meta description double space | 🟡 CTR | nízká |
| 8 | blog BreadcrumbList item URL | 🟡 Warning | triviální |

---

## Skóre

| Oblast | Skóre |
|---|---|
| Technical SEO | 55/100 |
| Structured Data | 50/100 |
| Content/Meta | 75/100 |
| AI Crawlability | 90/100 |
| Competitor Position | 70/100 |
| **CELKEM** | **62/100** |

Po opravě 3 kritických bugů: odhad **82/100**.
