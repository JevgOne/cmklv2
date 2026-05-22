# QA — JSON-LD + Sitemap + Footer (Task #24)
**Datum:** 2026-04-26
**Kontrolor:** kontrolor

---

## Výsledky bod po bodu

| # | Co | Soubor | Stav | Poznámka |
|---|-----|--------|------|----------|
| 1 | 4 nové generátory v lib/seo.ts | `lib/seo.ts` | ✅ PASS | generateLocalBusinessJsonLd:536, generateAggregateRatingJsonLd:593, generateJobPostingJsonLd:639, generatePersonJsonLd:694 |
| 2 | +9 statických URL v sitemap.ts | `app/sitemap.ts` | ✅ PASS | jak-to-funguje, marketplace, marketplace/apply, inzerce/katalog, shop/katalog, dily/katalog, shop/vraceni-zbozi, shop/reklamace, nabidka/porovnani — vše ověřeno |
| 2b | bazarPages (Partner/AUTOBAZAR) | `app/sitemap.ts:374` | ✅ PASS | Dynamická skupina, ošetřena try/catch |
| 2c | listingPages (Listing/ACTIVE) | `app/sitemap.ts:392` | ✅ PASS | Dynamická skupina, ošetřena try/catch |
| 3a | Service JSON-LD /sluzby/proverka | `sluzby/proverka/page.tsx:4` | ✅ PASS | importuje `generateServiceJsonLd` |
| 3b | Service JSON-LD /sluzby/financovani | `sluzby/financovani/page.tsx:4` | ✅ PASS | importuje `generateServiceJsonLd` |
| 3c | Service JSON-LD /sluzby/pojisteni | `sluzby/pojisteni/page.tsx:4` | ✅ PASS | importuje `generateServiceJsonLd` |
| 4 | kariera/layout.tsx — 3× JobPosting | `kariera/layout.tsx` | ✅ PASS | positions.map() → 3 pozice (Praha, Brno, Celá ČR) |
| 5 | recenze/layout.tsx — AggregateRating | `recenze/layout.tsx` | ✅ PASS | nahrazeno inline JSON-LD za `generateAggregateRatingJsonLd` |
| 6a | inzerce/page.tsx — WebPage JSON-LD | `inzerce/page.tsx:7` | ✅ PASS | importuje `generateWebPageJsonLd` |
| 6b | shop/page.tsx — WebPage JSON-LD | `shop/page.tsx:9` | ✅ PASS | importuje `generateWebPageJsonLd` |
| 7 | bazar/[slug]/page.tsx — LocalBusiness | `bazar/[slug]/page.tsx:7` | ✅ PASS | importuje `generateLocalBusinessJsonLd` |
| 8 | makleri/page.tsx — ItemList JSON-LD | `makleri/page.tsx:7` | ✅ PASS | `generateItemListJsonLd(brokers.map(b => url))` |
| 9 | profil/[slug]/page.tsx — Person JSON-LD | `profil/[slug]/page.tsx:295` | ✅ PASS* | Existuje — ale jako INLINE implementace, ne přes `generatePersonJsonLd` |
| 10 | FooterBase — 3 sloupce místo 4 | `FooterBase.tsx:60` | ✅ PASS | `sm:grid-cols-3` ✅, FIRMA odstraněna ✅, O nás + Kariéra v Podpora ✅ |
| 11 | npm run build projde | — | ✅ PASS | 1281/1281 stránek (clean build) |

---

## Nalezené problémy

### P1 — FooterBase: duplikátní copyright

**Soubor:** `components/common/FooterBase.tsx:224` a `:257`

Footer zobrazuje copyright **dvakrát**:
```
Řádek 224: © 2026 [companyInfo.legalName] · IČO: ...
Řádek 257: © 2026 CarMakléř | weblyx.cz
```

Řádek 257 je zbytkem z dřívější verze, který nebyl odstraněn. Uživatel vidí copyright dvakrát v bottom baru.

**Fix:** smazat celý `<div>` na řádcích 256–266 (weblyx.cz odkaz), nebo sloučit do jednoho řádku.

---

### P2 — FooterBase: stale komentář

**Soubor:** `components/common/FooterBase.tsx:9`

Komentář stále říká `"4-col grid: O nás + social | Produkt | Podpora | Firma"` — ale FIRMA byla odstraněna, grid je 3-sloupcový. Stale dokumentace.

**Fix:** Aktualizovat komentář na `"3-col grid: O nás + social | Produkt | Podpora"`.

---

### P2 — profil/[slug]: Person JSON-LD inline, ne přes generator

**Soubor:** `profil/[slug]/page.tsx:295–318`

Person JSON-LD existuje a funguje správně, ale je implementováno inline místo použití `generatePersonJsonLd` z lib/seo.ts. Navíc inline verze je bohatší — obsahuje `sameAs` (social links), které `generatePersonJsonLd` nepodporuje.

**Výsledek:** Funkčnost OK, ale generator `generatePersonJsonLd` je dead code (nikde nepoužit).

---

### P2 — lib/seo.ts: generateFaqPageJsonLd je duplicita

**Soubor:** `lib/seo.ts:83`

`generateFaqPageJsonLd` je funkcionálně totožná s `generateFaqJsonLd` (řádek 27). Nikde neimportována. Dead code.

---

## Simplify

- **FooterBase.tsx:** P1 duplicitní copyright — nutno opravit před deployem (UX defekt viditelný uživateli)
- **lib/seo.ts:** `generateFaqPageJsonLd` = dead code (nikde nepoužita)
- **lib/seo.ts:** `generatePersonJsonLd` = dead code (nikde neimportována — profil má vlastní inline)

---

## Debug

- TypeScript: ✅ 0 chyb ve všech dotčených souborech
- Build: ✅ 1281/1281 stránek

---

## Verdikt

**PODMÍNĚNĚ SCHVÁLENO ⚠️**

- 10/11 bodů: ✅ PASS
- Blokující pro deploy: **P1 — duplikátní copyright ve FooterBase** (viditelný UX defekt)
- Neblokující: P2 problémy (dead code, stale komentář)

**Implementátor musí opravit FooterBase:257 před commitem.**
