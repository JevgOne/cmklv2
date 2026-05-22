# Audit PRODUKCE: Marketplace + SEO Landing Pages

**Datum:** 2026-04-23
**Prostředí:** PRODUKCE — https://carmakler.cz (IP 91.98.203.239)
**Tester:** QA agent (Playwright/Chromium + curl)

---

## Souhrn výsledků

| Metrika | Hodnota |
|---|---|
| Celkem otestováno | 18 stránek + 7 bonus body-type |
| HTTP 200 OK | 17/18 (stabílně), 1 transientní 500 |
| Kritické bugy | 2 (H1 text na body-type stránkách) |
| Závažné varování | 1 (transientní 500 na /nabidka/kombi) |
| Minor problémy | 5 dalších body-type stránek se špatnou H1 šablonou |
| Technické soubory | 3/3 ✅ |

---

## MARKETPLACE

### ✅ /marketplace — Investiční landing page

- **HTTP:** 200
- **H1:** "Investujte do aut, vydělejte 15-25 % ročně" ✅
- **Title:** "Marketplace | Investiční platforma pro flipping aut | CarMakléř" ✅
- **Investiční pitch:** Ano — 15-25% výnos ročně, min. investice 10 000 Kč, flip 30-90 dní ✅
- **Footer weblyx.cz:** ✅
- **Logo:** ✅
- **Breadcrumbs:** ❌ (landing page — akceptovatelné)
- **Cross-links:** ✅

---

### ✅ /marketplace/apply — Žádost o přístup (veřejná)

- **HTTP:** 200
- **H1:** "Žádost o přístup" ✅
- Veřejně přístupná bez auth ✅

---

### ✅ /marketplace/dealer — Dealer dashboard

- **HTTP:** 200
- **H1:** "Žádost o přístup"
- Auth gate funguje správně — neautentizovaný uživatel vidí access-request form ✅

---

### ✅ /marketplace/investor — Investor dashboard

- **HTTP:** 200
- **H1:** "Žádost o přístup"
- Auth gate funguje správně ✅

---

## SEO LANDING PAGES

### ✅ /nabidka/skoda

- **HTTP:** 200 | **H1:** "Ojeté vozy Škoda" ✅
- **Title:** "Škoda bazar | Ojeté vozy Škoda — CarMakler | CarMakléř" ✅
- Breadcrumbs, cross-links, footer — vše OK ✅

---

### ✅ /nabidka/skoda/octavia

- **HTTP:** 200 | **H1:** "Škoda Octavia — ojeté vozy v nabídce" ✅

---

### ✅ /nabidka/bmw

- **HTTP:** 200 | **H1:** "Ojeté vozy BMW" ✅
- Pozn.: Při prvním Playwright běhu timeout (45s) — transientní síťový problém. Curl i opakovaný Playwright test vracejí 200 konzistentně.

---

### ✅ /nabidka/volkswagen/golf

- **HTTP:** 200 | **H1:** "Volkswagen Golf — ojeté vozy v nabídce" ✅

---

### ✅ /nabidka/praha

- **HTTP:** 200 | **H1:** "Ojeté vozy v Praze" ✅

---

### ✅ /nabidka/brno

- **HTTP:** 200 | **H1:** "Ojeté vozy v Brně" ✅

---

### ✅ /nabidka/do-100000

- **HTTP:** 200 | **H1:** "Ojeté vozy do 100 000 Kč" ✅

---

### ✅ /nabidka/do-500000

- **HTTP:** 200 | **H1:** "Ojeté vozy do 500 000 Kč" ✅

---

### ❌ /nabidka/suv — BUG: Lowercase zkratka v H1

- **HTTP:** 200
- **H1:** "Ojeté **suv** vozy" ❌ — správně: "Ojeté **SUV**" nebo "Ojeté vozy SUV"
- **Title:** "SUV bazar | Ojeté **suv** vozy — CarMakler | CarMakléř" ❌
- **Dopad:** SEO — Google indexuje "suv" místo "SUV". Acronymy musí být uppercase.

---

### ⚠️ /nabidka/kombi — Transientní 500 na produkci

- **HTTP:** 500 (při prvním testu — curl i Playwright) → **200 (opakovaný test)** ✅
- **H1:** "Ojeté kombi vozy" ✅ (akceptovatelné)
- **VAROVÁNÍ:** Produkce jednou vrátila 500. Příčina nejasná — pravděpodobně PM2 worker restart nebo memory pressure. **Doporučeno: ověřit server logy** (`pm2 logs`) a monitoring.

---

### ❌ /nabidka/elektromobily — BUG: Gramaticky nesprávné H1

- **HTTP:** 200
- **H1:** "Ojeté **elektromobily vozy**" ❌ — správně: "Ojeté **elektromobily**"
- **Title:** "Elektromobily bazar | Ojeté **elektromobily vozy**" ❌
- **Dopad:** "elektromobily" = elektrická vozidla, přidání "vozy" = pleonasmus. Nesprávná čeština snižuje důvěryhodnost.

---

## TECHNICKÉ SOUBORY

### ✅ /sitemap.xml — HTTP 200, validní XML

Obsahuje klíčové URL (/, /nabidka, /chci-prodat, /makleri, /inzerce, /marketplace...). Priority a changefreq správně nastaveny. lastmod = dnešní datum (dynamicky generovaný).

### ✅ /robots.txt — HTTP 200

`Allow: /`, blokuje `/api/`, `/admin/`, `/makler/dashboard`, `/login`, `/registrace`. Odkaz na sitemap přítomen.

### ✅ /llms.txt — HTTP 200

Komprehenzivní popis platformy (4 produkty, API, klíčové vlastnosti). Správně odkazuje na carmakler.cz URL.

---

## BONUS: Všechny body-type stránky — H1 audit

Provedeno testování všech body-type SEO landing pages na produkci:

| Stránka | HTTP | H1 (produkce) | Hodnocení |
|---|---|---|---|
| /nabidka/suv | 200 | "Ojeté **suv** vozy" | ❌ lowercase zkratka |
| /nabidka/kombi | 200 | "Ojeté kombi vozy" | ✅ akceptovatelné |
| /nabidka/elektromobily | 200 | "Ojeté **elektromobily vozy**" | ❌ gramaticky špatně |
| /nabidka/sedan | 200 | "Ojeté sedan vozy" | ⚠️ "sedan vozy" — nevhodná čeština |
| /nabidka/hatchback | 200 | "Ojeté hatchback vozy" | ⚠️ "hatchback vozy" — nevhodná čeština |
| /nabidka/hybrid | 200 | "Ojeté hybrid vozy" | ❌ mělo by být "hybridní vozy" |
| /nabidka/kabriolet | 200 | "Ojeté kabriolet vozy" | ⚠️ "kabriolet vozy" — redundantní |

Brand stránky (správné): "Ojeté vozy Škoda", "Ojeté vozy BMW", "Ojeté vozy Audi" ✅
City stránky (správné): "Ojeté vozy v Praze", "Ojeté vozy v Brně" ✅

**Root cause:** Template `h1={\`Ojeté ${bodyType.name.toLowerCase()} vozy\`}` v page.tsx souborech. `.toLowerCase()` ničí zkratky, " vozy" je redundantní pro slova označující vozidla.

---

## Přehled bugů — seřazeno dle priority

| Priorita | Stránka | Bug | Dopad |
|---|---|---|---|
| 🔴 CRITICAL | `/nabidka/kombi` | Transientní HTTP 500 na produkci | Uživatel vidí chybovou stránku, SEO indexace selhává |
| 🔴 HIGH | `/nabidka/suv` | H1/title: "suv" místo "SUV" | SEO: lowercase zkratka, špatná relevance |
| 🔴 HIGH | `/nabidka/elektromobily` | H1/title: "elektromobily vozy" | Nesprávná čeština, špatná SEO |
| 🟡 MEDIUM | `/nabidka/hybrid` | H1: "hybrid vozy" místo "hybridní vozy" | Špatná čeština |
| 🟡 MEDIUM | `/nabidka/sedan`, `/nabidka/hatchback`, `/nabidka/kabriolet` | H1: nevhodný tvar ("sedan vozy" apod.) | Minor SEO |

---

## Doporučené opravy

### 1. Kombi 500 — server monitoring

```bash
ssh server "pm2 logs carmakler --lines 100 | grep -i 'kombi\|error\|500'"
```

Pokud 500 způsobuje runtime chyba, bude v logách. Pokud ne, je to pravděpodobně transientní síťový/worker problém.

### 2. Body-type H1 fix — všechny postižené stránky

**Přidat do `BODY_TYPES` v `lib/seo-data.ts` pole `h1Label`:**

```typescript
// lib/seo-data.ts — BODY_TYPES items
{ slug: "suv", name: "SUV", h1Label: "Ojeté vozy SUV", ... }
{ slug: "elektromobily", name: "Elektromobily", h1Label: "Ojeté elektromobily", ... }
{ slug: "hybrid", name: "Hybrid", h1Label: "Ojeté hybridní vozy", ... }
{ slug: "sedan", name: "Sedan", h1Label: "Ojeté sedany", ... }
{ slug: "hatchback", name: "Hatchback", h1Label: "Ojeté hatchbacky", ... }
{ slug: "kabriolet", name: "Kabriolet", h1Label: "Ojeté kabriolety", ... }
{ slug: "kombi", name: "Kombi", h1Label: "Ojeté kombi vozy", ... }
```

**Poté v každém page.tsx:**
```tsx
h1={bodyType.h1Label}
// místo:
h1={`Ojeté ${bodyType.name.toLowerCase()} vozy`}
```

---

## Závěr

**Marketplace** je funkční a správně implementovaná — veřejný landing, apply form, auth gate pro dealer/investor.

**Technické soubory** (sitemap.xml, robots.txt, llms.txt) jsou v pořádku.

**SEO landing pages** — brand stránky (Škoda, BMW, Audi...) a city stránky (Praha, Brno...) mají správné H1. Problematické jsou výhradně **body-type stránky** kvůli šabloně `Ojeté ${name.toLowerCase()} vozy`.

**Nejkritičtější nález:** `/nabidka/kombi` vrátila HTTP 500 v reálném čase testování — i když se po chvíli zotavila, toto je signál nestability produkce který vyžaduje investigaci logů.

---

*Audit PRODUKCE: https://carmakler.cz — 2026-04-23 — QA agent (Playwright/Chromium + curl)*
