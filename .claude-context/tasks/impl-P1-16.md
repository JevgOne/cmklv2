# Implementace P1-16: Performance optimalizace

**Status:** HOTOVO
**Datum:** 2026-04-05
**Implementoval:** implementator agent

---

## Provedene zmeny

### 1. Font loading optimalizace — `app/layout.tsx`
- Uz bylo implementovano: weight ["400", "500", "600", "700", "800"] + display: "swap"
- Rezy 300 (nepouzivany) a 900 (nepouzivany) uz odebrane
- Rez 800 (font-extrabold) zachovan — pouzivan ve 191 souborech
- Overeno spravnost

### 2. next/dynamic pro tezke komponenty
- Uz bylo implementovano: PriceHistory (recharts ~80KB) pouziva `next/dynamic` s `ssr: false`
- Overeno v `app/(web)/nabidka/[slug]/page.tsx`

### 3. img → next/image migrace (sdileno s P1-15)
- Vsechny `<img>` tagy migrovany na `<Image>` z next/image
- Vcetne OpportunityCard a RecommendedParts (nalezeny pri memo auditu)
- Celkem 0 zbyvajicich `<img>` tagu v projektu

### 4. Cloudinary URL optimalizace — `lib/cloudinary.ts`
- Uz bylo implementovano: `getOptimizedUrl()` export existuje
- Podporuje w_, q_auto, f_auto, c_fill transformace

### 5. ISR pro katalogove stranky
- `app/(web)/nabidka/page.tsx` — pridano `revalidate = 300` (5 minut)
- `app/(web)/nabidka/[slug]/page.tsx` — pridano `revalidate = 600` (10 minut)
- `app/(web)/shop/produkt/[slug]/page.tsx` — pridano `revalidate = 600` (10 minut)
- Uz existovaly: marketplace (3600), chci-prodat (3600), makleri (3600)
- shop/katalog a dily/katalog jsou client components — ISR neaplikovatelne

### 6. Cache-Control hlavicky na verejne GET API
- Uz byly implementovany: vehicles, listings, parts — vsechny maji
  `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`

### 7. Bundle analyzer — `next.config.ts` + `package.json`
- Uz bylo implementovano: `@next/bundle-analyzer` + `withBundleAnalyzer` wrapper
- Script `"analyze": "ANALYZE=true next build --webpack"` existuje

### 8. React.memo na list itemech
- `components/web/VehicleCard.tsx` — uz melo memo (overeno)
- `components/web/ProductCard.tsx` — uz melo memo (overeno)
- `components/pwa-parts/parts/PartCard.tsx` — PRIDANO memo
- `components/web/marketplace/OpportunityCard.tsx` — PRIDANO memo + Image migrace
- `components/web/RecommendedParts.tsx` — PRIDANO memo + Image migrace

## Overeni

- [x] Font: Outfit nacita 5 rezu (400-800), ma display:swap
- [x] PriceHistory pouziva next/dynamic s ssr:false
- [x] Zadny surovy `<img>` tag — vsude `<Image>` z next/image
- [x] Cloudinary getOptimizedUrl existuje
- [x] Katalogove stranky maji revalidate (nabidka 300, detail 600, makleri/marketplace 3600)
- [x] Verejne GET API maji Cache-Control hlavicky
- [x] Bundle analyzer nakonfigurovany (`npm run analyze`)
- [x] VehicleCard, ProductCard, PartCard, OpportunityCard, RecommendedParts pouzivaji memo
- [x] Typecheck prochazi
- [x] Unit testy prochazi (141/141)
