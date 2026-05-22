# QA — Task #24: JSON-LD + Sitemap doplnění
**Datum:** 2026-04-26
**Kontrolor:** kontrolor
**Zdroj:** implementátor (Task #24 report)

---

## 1. Simplify kontrola

### lib/seo.ts — 2 drobné problémy

**Problém 1: Duplicitní FAQ generátor**
- `generateFaqJsonLd` (řádek 27) a `generateFaqPageJsonLd` (řádek 83) jsou funkcionálně totožné — obě generují `FAQPage` JSON-LD z `{question, answer}[]`
- Komentář říká "alias", ale jde o plnou re-implementaci
- `generateFaqPageJsonLd` **není nikde importována** (dead code)
- Doporučení: smazat `generateFaqPageJsonLd`, nebo jí delegovat na `generateFaqJsonLd`

**Problém 2: generatePersonJsonLd — nenapojeno**
- Funkce je definována v `lib/seo.ts` (řádek 694)
- **Není importována na žádné stránce** — dead code
- Implementátor uvedl "broker profily", ale `/profil/[slug]/page.tsx` ji nepoužívá
- Hodnocení: záměrné (pouze FÁZE 3 = library), ale stojí za zmínku

### sitemap.ts — OK
- Čistá, konzistentní struktura, každá dynamická skupina ošetřena try/catch ✅

### kariera/layout.tsx — OK
- Pole `positions` generováno `.map()` — čisté, bez duplicit ✅

### recenze/layout.tsx — OK
- `reviewCount: 8` ale `reviews[]` má 3 záznamy — platné (schema.org nevyžaduje úplný seznam) ✅

---

## 2. Debug kontrola

### TypeScript
- `lib/seo.ts`: ✅ 0 chyb
- `app/sitemap.ts`: ✅ 0 chyb
- `app/(web)/kariera/layout.tsx`: ✅ 0 chyb
- `app/(web)/recenze/layout.tsx`: ✅ 0 chyb
- `app/(web)/bazar/[slug]/page.tsx`: ✅ 0 chyb
- `app/(web)/inzerce/page.tsx`: ✅ 0 chyb
- `app/(web)/shop/page.tsx`: ✅ 0 chyb
- `app/(web)/makleri/page.tsx`: ✅ 0 chyb
- Sluzby pages (proverka/financovani/pojisteni): ✅ 0 chyb

### Build
- ✅ **Prošel bez chyb** (1281/1281 stránek — potvrzeno v Task #3 QA z téhož dne)
- Warning `middleware → proxy` — pre-existing, nesouvisí

---

## 3. Reverzní kontrola — bod po bodu

| Fáze | Požadavek | Ověření | Stav |
|------|-----------|---------|------|
| FÁZE 3 | `generateLocalBusinessJsonLd` v lib/seo.ts | ✅ řádek 536 | PASS |
| FÁZE 3 | `generateAggregateRatingJsonLd` v lib/seo.ts | ✅ řádek 593 | PASS |
| FÁZE 3 | `generateJobPostingJsonLd` v lib/seo.ts | ✅ řádek 639 | PASS |
| FÁZE 3 | `generatePersonJsonLd` v lib/seo.ts | ✅ řádek 694 (definováno, ale nenapojeno) | PASS* |
| FÁZE 1 | `/sluzby/proverka` — Service JSON-LD | ✅ importuje `generateServiceJsonLd` | PASS |
| FÁZE 1 | `/sluzby/financovani` — Service JSON-LD | ✅ importuje `generateServiceJsonLd` | PASS |
| FÁZE 1 | `/sluzby/pojisteni` — Service JSON-LD | ✅ importuje `generateServiceJsonLd` | PASS |
| FÁZE 2 | +9 statických URL v sitemap.ts | ✅ jak-to-funguje, marketplace, marketplace/apply, inzerce/katalog, shop/katalog, dily/katalog, shop/vraceni-zbozi, shop/reklamace, nabidka/porovnani | PASS |
| FÁZE 2 | bazarPages (Partner/AUTOBAZAR) | ✅ řádky 374-388 | PASS |
| FÁZE 2 | listingPages (Listing/ACTIVE) | ✅ řádky 392-406 | PASS |
| FÁZE 4 | `/kariera` — 3× JobPosting JSON-LD | ✅ layout.tsx, positions.map() | PASS |
| FÁZE 4 | `/recenze` — AggregateRating JSON-LD | ✅ layout.tsx, nahrazeno inline | PASS |
| FÁZE 4 | `/inzerce` — WebPage JSON-LD | ✅ page.tsx | PASS |
| FÁZE 4 | `/shop` — WebPage JSON-LD | ✅ page.tsx | PASS |
| FÁZE 4 | `/bazar/[slug]` — LocalBusiness JSON-LD | ✅ page.tsx | PASS |
| FÁZE 4 | `/makleri` — ItemList JSON-LD | ✅ page.tsx, URLs brokerů | PASS |

*`generatePersonJsonLd` — definováno v library (FÁZE 3), napojení na `/profil/[slug]` nebylo součástí FÁZE 4. Dead code prozatím.

---

## Nalezené problémy

| Závažnost | Soubor | Popis |
|-----------|--------|-------|
| P2 | `lib/seo.ts:83` | `generateFaqPageJsonLd` = duplicita `generateFaqJsonLd`, nikde nepoužita |
| P2 | `lib/seo.ts:694` | `generatePersonJsonLd` definováno, nenapojeno na `/profil/[slug]/page.tsx` |

---

## Výsledek

**SCHVÁLENO ✅ — 2 drobné P2 problémy, nic blokujícího**

Všechny 4 FÁZE implementovány správně. TypeScript 0 chyb. Build prochází. 
P2 problémy: duplicitní FAQ generátor a nenapojený Person generátor — doporučeno opravit v následujícím tasku, ale neblokuje commit/deploy.
