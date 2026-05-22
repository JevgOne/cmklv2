# Chrome Test: TASK-062 — SEO Landing Pages Review
**Datum:** 2026-04-16
**Tester:** test-chrome agent

## 1. Hlavni SEO Landing Pages

| URL | HTTP | Title | Meta Description | H1 | Stav |
|-----|------|-------|------------------|----|------|
| `/` | 200 | CarMakler \| Prodej aut pres certifikovane maklere \| CarMakler | Prodejte nebo kupte auto bezpecne pres sit overenych makleru... | Vase auto prodame v prumeru do 20 dni | OK |
| `/nabidka` | 200 | Nabidka vozidel \| CarMakler | Prohlednete si nabidku proverenych ojetych vozidel... | Nabidka vozidel | OK |
| `/inzerce` | 200 | Inzerce — vlozte inzerat zdarma \| CarMakler | Vlozte inzerat na prodej auta zdarma za minutu... | Prodejte sve auto. Zdarma. | OK |
| `/dily` | 200 | Autodily — pouzite i nove nahradni dily \| CarMakler \| CarMakler | Pouzite autodily z vrakovist, aftermarket dily a autokosmetika... | Autodily a prislusenstvi | OK - duplicitni suffix v title |
| `/marketplace` | 200 | Marketplace \| Investicni platforma pro flipping aut \| CarMakler | Investujte do aut a vydelejte 15-25 % rocne... | Investujte do aut, vydelejte 15-25 % rocne | OK |
| `/makleri` | 200 | Nasi makleri — CarMakler \| CarMakler | Certifikovani automakeri po cele CR... | Nasi certifikovani makleri | OK - duplicitni suffix v title |

### Nalezene problemy:
- **BUG-1 (LOW):** `/dily` title obsahuje duplicitni suffix `| CarMakler | CarMakler`
- **BUG-2 (LOW):** `/makleri` title obsahuje duplicitni suffix `— CarMakler | CarMakler`
- Vsechny stranky maji OG title + OG description -- OK
- Vsechny stranky maji meta description -- OK

## 2. Hashtag Landing Pages (/tag/[slug])

Route `/tag/[slug]` existuje a provadi 301 redirect na `/makleri/[slug]`.

| URL | Redirect | Final HTTP | Title | H1 | Meta | FAQ Schema | ItemList Schema |
|-----|----------|------------|-------|----|------|-----------|----------------|
| `/tag/bmw` | `/makleri/bmw` | 200 | Specialiste na BMW — Carmakler | Specialiste na BMW | OK | YES | YES |
| `/tag/elektromobily` | `/makleri/elektromobily` | 200 | Specialiste: Elektromobily — Carmakler | Specialiste: Elektromobily | OK | YES | YES |
| `/tag/praha` | `/makleri/praha` | 200 | Makleri v Praze — Carmakler | Makleri v Praze | OK | YES | YES |

### Kvalita hashtag landing pages:
- Plne funkcni SEO landing pages s dynamickym obsahem
- Breadcrumbs navigace (Domu > Makleri > #tag)
- BrokerGrid s kartami makleru
- Related hashtags sekce
- Nedavne uspechy makleru sekce
- FAQ sekce s FAQPage structured data
- ItemList structured data pro maklere
- CTA bloky (auth-aware + bottom)
- Siblings sekce (dalsi tagy ve stejne kategorii)
- Meta tags, OG tags -- vse generovano dynamicky z DB

### Poznamka:
- Stranka `/makleri/[slug]` vola `notFound()` pokud tag neexistuje v DB nebo nema zadne brokery -- spravne chovani

## 3. Favicon Check

### HTML link tagy:
- `<link rel="icon" href="/favicon.ico" sizes="256x256">` -- HTTP 200 (Next.js generated)
- `<link rel="icon" href="/brand/favicon.ico" sizes="48x48">` -- HTTP 200 (1.9 KB)
- `<link rel="icon" href="/icons/icon-192.png" sizes="192x192">` -- HTTP 200 (5.5 KB)
- `<link rel="icon" href="/icons/icon-512.png" sizes="512x512">` -- HTTP 200 (24 KB)
- `<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" sizes="180x180">` -- HTTP 200 (5 KB)

### Manifest.json:
- Name: "CarMakler Pro"
- Theme color: #F97316 (orange)
- Icons: 192px, 512px, maskable varianty -- vse pritomno

### Vizualni kontrola v Chrome:
- Favicon viditelny v zalozce prohlizece -- CarMakler logo (oranzove)
- Ne genericky Next.js favicon

## Shruti

**Celkovy stav: PASS s 2 low-severity nalezy**

Vsech 6 hlavnich SEO landing pages funguje (HTTP 200), ma title, meta description, OG tags a H1.
Hashtag landing pages (`/tag/[slug]` -> `/makleri/[slug]`) jsou plne funkcni s rich SEO (structured data, FAQ, breadcrumbs).
Favicon je vlastni CarMakler logo, spravne nakonfigurovane vcetne PWA manifest.

### Nalezy k oprave:
1. Duplicitni `| CarMakler` suffix v title na `/dily` a `/makleri`
