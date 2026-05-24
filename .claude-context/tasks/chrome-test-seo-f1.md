# TEST-CHROME: Ověření SEO Fáze 1 v prohlížeči

**Datum:** 2026-05-24  
**Tester:** test-chrome  
**Task ref:** #19  
**Nástroj:** Playwright headed Chromium + curl

---

## Výsledek: ❌ NEPROŠLO — 3 bugy nalezeny

---

## Detailní výsledky

### 1. `/sitemap.xml` (Sitemap index) — ❌ BUG: HTTP 404

**Očekáváno:** Sitemap index XML s odkazy na sub-sitemaps  
**Skutečnost:** 404 "Stránka nenalezena"  
**Screenshot:** Vizuálně potvrzen — stránka zobrazuje custom 404 page  

`robots.txt` odkazuje na `Sitemap: https://carmakler.cz/sitemap.xml` — ale route neexistuje!  
Toto je kritický SEO bug: Google nenajde žádné URL.

---

### 2. `/sitemap/0.xml`, `/sitemap/1.xml`, `/sitemap/2.xml` — ⚠️ BUG: Prázdné sitemaps

**HTTP status:** 200 OK  
**Obsah:** XML se správnou strukturou, ale 0 URL:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>
```

**Screenshot:** Vizuálně potvrzen — Chrome ukazuje prázdný `<urlset>` bez `<url>` elementů  
Sub-sitemaps existují (route funguje) ale negenerují žádné URL — pravděpodobně DB query vrací prázdný výsledek nebo sitemap generátor není napojen na data.

---

### 3. `/robots.txt` — ✅ PROŠLO

**HTTP status:** 200 OK  
**Screenshot:** Vizuálně potvrzen  

Obsah správný:
- ✅ `User-Agent: *` s `Allow: /`
- ✅ Disallow pro privátní routes: `/api/`, `/admin/`, `/makler/`, `/partner/`, `/parts/`, `/muj-ucet/`, `/marketplace/dashboard`, `/marketplace/investor`, `/marketplace/dealer`, `/login`, `/prihlaseni`, `/registrace`, `/gate`, `/overeni-emailu/`, `/reset-hesla/`, `/zapomenute-heslo`, `/notifikace/`, `/moje-inzeraty/`, `/shop/moje-objednavky/`, `/dily/moje-objednavky/`, `/hledat`
- ✅ AI crawler rules: GPTBot, ChatGPT-User, CCBot, ClaudeBot, Claude-SearchBot, Claude-User, OAI-SearchBot, PerplexityBot, Applebot-Extended, GoogleOther
- ✅ `Sitemap: https://carmakler.cz/sitemap.xml`

---

### 4. `/nabidka` JSON-LD — ✅ PROŠLO

**Nalezeno:** 3 JSON-LD skripty  

| Skript | @type | Status |
|--------|-------|--------|
| 1 | Organization | ✅ |
| 2 | CollectionPage + mainEntity: ItemList | ✅ |
| 3 | FAQPage | ✅ |

CollectionPage detail:
```json
{
  "@type": "CollectionPage",
  "name": "Nabídka vozidel — CarMakléř",
  "description": "Prověřená ojetá vozidla od ověřených makléřů i soukromých prodejců.",
  "mainEntity": { "@type": "ItemList" }
}
```
✅ Splňuje požadavek CollectionPage/ItemList.

---

### 5. `/nabidka?brand=skoda` noindex — ✅ PROŠLO

```html
<meta name="robots" content="noindex, follow"/>
```
✅ Filtrované stránky mají správný noindex meta tag.

---

### 6. `/nabidka` OG image — ❌ BUG: og:image CHYBÍ

**Nalezené OG tagy na `/nabidka`:**
```html
<meta property="og:title" content="Ojetá vozidla na prodej — prověřená auta od makléřů"/>
<meta property="og:description" content="..."/>
```

**Chybí:** `<meta property="og:image" content="..."/>`  

Stránka `/nabidka` nemá og:image tag. Při sdílení na sociálních sítích se nezobrazí žádný náhledový obrázek.

---

### 7. Homepage Organization JSON-LD — ✅ knowsAbout + areaServed přítomno / ⚠️ DUPLICITA

**Nalezeno:** 4 JSON-LD skripty na homepage:
1. Organization (s knowsAbout + areaServed) ✅
2. Organization (bez knowsAbout, bez areaServed) ⚠️ DUPLICITA
3. WebSite ✅
4. FAQPage ✅

První Organization JSON-LD je správný:
```json
{
  "@type": "Organization",
  "name": "CarMakléř",
  "logo": "https://carmakler.cz/brand/logo-color.png",
  "knowsAbout": ["ojetá vozidla", "prodej aut", "autodíly", "technická kontrola", "autoservisy", "financování vozide..."],
  "areaServed": { "@type": "Country", "name": "Česká republika" }
}
```

⚠️ **Ale existuje druhý Organization JSON-LD bez těchto polí** — duplicita může zmást Google.

---

## Shrnutí bugů

| # | Bug | Závažnost |
|---|-----|-----------|
| B1 | `/sitemap.xml` vrací 404 — Google nenajde sitemaps | 🔴 KRITICKÝ |
| B2 | Sub-sitemaps `/sitemap/N.xml` jsou prázdné (0 URL) | 🔴 KRITICKÝ |
| B3 | `/nabidka` nemá og:image tag | 🟡 STŘEDNÍ |
| W1 | Homepage má 2 Organization JSON-LD skripty (duplicita) | 🟡 STŘEDNÍ |

---

## Co funguje

| Kontrola | Výsledek |
|----------|----------|
| robots.txt — Disallow rules | ✅ |
| robots.txt — AI crawler rules | ✅ |
| robots.txt — Sitemap direktiva | ✅ |
| /nabidka — CollectionPage JSON-LD | ✅ |
| /nabidka — ItemList mainEntity | ✅ |
| /nabidka?brand=skoda — noindex | ✅ |
| Organization knowsAbout + areaServed | ✅ (1. skript) |

---

## Akce potřebná

1. **Opravit `/sitemap.xml` route** — chybí `app/sitemap.xml/route.ts` nebo `app/sitemap.ts` (sitemap index)
2. **Opravit generátor sub-sitemaps** — data z DB se nenačítají, URL seznam je prázdný
3. **Přidat og:image na `/nabidka`** — v `app/(web)/nabidka/page.tsx` metadata exportu
4. **Odebrat duplicitní Organization JSON-LD** na homepage
