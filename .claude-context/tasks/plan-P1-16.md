# Plan P1-16: Performance Audit — Bundle, Images, Caching, SSG

**Priorita:** P1
**Slozitost:** L (4-6 hodin)
**Zavislosti:** P1-04 (Cloudinary) pro obrazkove transformace, P0-08 (PostgreSQL) pro ISR
**Batch:** 3

---

## Cil

Optimalizovat vykon aplikace: snizit bundle size pres lazy loading, migrovat na next/image, implementovat ISR/SSG pro katalogove stranky, optimalizovat font loading a API caching.

---

## Analyza aktualniho stavu

### 1. Client Components — VYSSÍ NEZ NUTNE

**72 "use client" souboru v app/(web)/** z celkem ~100 stranek. Mnohe z nich pouzivaji jen `useState`/`useEffect` a mohly by byt rozdeleny na server + client cast.

**Celkem 212 vyskytu useState/useEffect v app/(web)/** — kazdy znamena client bundle.

### 2. Lazy Loading — NULOVE

**ZERO pouziti `next/dynamic`** v celem projektu. Vsechny komponenty importovany staticky, vcetne tezkych zavislosti.

**ZERO pouziti `React.lazy`** — vse v initial bundle.

### 3. Tezke zavislosti v klientskem bundlu

| Zavislost | Odhad (gzip) | Soubory kde se pouziva | Lazy? |
|-----------|-------------|------------------------|-------|
| recharts 3.8.1 | ~80KB | `components/web/PriceHistory.tsx` (1 soubor!) | NE |
| framer-motion 12.38.0 | ~60KB | `app/prezentace/page.tsx`, `components/pwa/OfflineBanner.tsx`, `components/pwa/AiAssistant.tsx` (3 soubory) | NE |
| @anthropic-ai/sdk | ~500KB unpacked | `app/api/assistant/chat/route.ts`, `app/api/assistant/generate-description/route.ts` (server only) | N/A (server) |
| stripe | server | `lib/stripe.ts` (1 soubor, server only) | N/A |

**Pozn.:** @anthropic-ai/sdk a stripe jsou server-only — neovlivnuji klientsky bundle. Recharts a framer-motion ANO.

### 4. Obrazky — NEOPTIMALIZOVANE

**22 souboru s nativnim `<img>` tagem** (viz plan-P1-15 pro kompletni seznam).

**Pouze 6 souboru** pouzivaji `import Image from "next/image"` — vsechny v PWA casti.

**next.config.ts** ma `remotePatterns` pro `res.cloudinary.com` — Image component je pripraven k pouziti.

**Cloudinary URL transformace CHYBI:** `lib/cloudinary.ts` uploaduje obrazky, ale NEGENERUJE optimalizovane URL s `w_`, `q_`, `f_auto`. Obrazky se stahuji v plne velikosti.

### 5. ISR/SSG — MINIMÁLNÍ

**Pouze 2 stranky s `revalidate`:**
- `app/(web)/marketplace/page.tsx` — `revalidate = 3600`
- `app/(web)/chci-prodat/page.tsx` — `revalidate = 3600`

**Pouze 2 stranky s `generateStaticParams`:**
- `app/(web)/dily/znacka/[slug]/page.tsx`
- `app/(web)/dily/kategorie/[slug]/page.tsx`

**Hlavni katalogove stranky NEMAJI ISR:**
- `app/(web)/nabidka/page.tsx` — plne dynamicka, kazdy request = DB query
- `app/(web)/inzerce/katalog/page.tsx` — plne dynamicka
- `app/(web)/shop/katalog/page.tsx` — plne dynamicka
- `app/(web)/dily/katalog/page.tsx` — plne dynamicka

### 6. Font Loading — PRILIS MNOHO REZU

**Soubor:** `app/layout.tsx` (radky 7-11)
```ts
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});
```

**7 vahovych rezu** = zbytecna velikost (~10-15KB per rez).

**Audit pouziti:**
- `font-light` (300): **0 vyskytu v app/** — NEPOUZIVA SE
- `font-extrabold` (800): **364 vyskytu v 191 souborech** — MASIVNE POUZIVANO
- `font-black` (900): **0 vyskytu v app/** — NEPOUZIVA SE

**Zaver:** Rezy 300 a 900 lze bezpecne odebrat. Rez 800 MUSI zustat.

**Chybi `display: "swap"`** — muze zpusobit FOIT (Flash of Invisible Text).

### 7. Loading.tsx — DOBRE POKRYTO

Loading skeletony existuji pro:
- admin: 22 souboru
- pwa: 38 souboru
- pwa-parts: 5 souboru
- web: 15+ souboru (nabidka, shop, dily, makleri, atd.)

**Chybi loading.tsx u nekterych web stranek** — ale pokryti je nadprumerne.

### 8. Suspense — NEPOUZIVA SE

**0 vyskytu `<Suspense>`** v app/(web)/. Streaming SSR neni vyuzivan pro postupne nacitani obsahu.

### 9. API Cache hlavicky — CHYBI

Verejne GET API endpointy nemaji `Cache-Control` hlavicky. Jediny vyjimky jsou feed endpointy (bazos.xml, sauto.xml) s `max-age=3600`.

### 10. Bundle Analyzer — NENI NAINSTALOVAN

`@next/bundle-analyzer` neni v devDependencies. Neni mozne merit presnou velikost bundlu.

---

## Kroky implementace

### Krok 1: Font loading optimalizace

**Soubor:** `app/layout.tsx`

```diff
 const outfit = Outfit({
   variable: "--font-outfit",
   subsets: ["latin", "latin-ext"],
-  weight: ["300", "400", "500", "600", "700", "800", "900"],
+  weight: ["400", "500", "600", "700", "800"],
+  display: "swap",
 });
```

**Uspeche:**
- Odebrani rezu 300 (nepouzivany) a 900 (nepouzivany) = ~20-30KB uspora
- `display: "swap"` = okamzite zobrazeni textu (system font → Outfit swap)

**Pozn.:** Rez 800 MUSI zustat — `font-extrabold` je pouzivan ve 191 souborech!

### Krok 2: next/dynamic pro tezke komponenty

**A) PriceHistory (recharts ~80KB):**

```ts
// Najdi soubor ktery importuje PriceHistory a zmen import:
import dynamic from "next/dynamic";
const PriceHistory = dynamic(
  () => import("@/components/web/PriceHistory").then((m) => ({ default: m.PriceHistory })),
  {
    loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-lg" />,
    ssr: false,
  }
);
```

**B) Framer-motion komponenty (60KB):**

AiAssistant a OfflineBanner jsou PWA-only — mensi priorita pro web performance.
Prezentace page je specialni stranka — nemenit.

**C) jsPDF a QRCode (pokud existuji v client bundlu):**

Pouzit dynamic import pri pouziti:
```ts
const generatePdf = async () => {
  const { jsPDF } = await import("jspdf");
  // ...
};
```

**Pozn.:** jsPDF se aktualne NEIMPORTUJE nikde v projektu (grep nasiel 0 vyskytu import). Muze byt pripraveno pro budouci pouziti.

### Krok 3: img → next/image migrace

**Viz plan-P1-15, Krok 8** pro kompletni seznam souboru a diffu.

Klicove zmeny pro performance:
- `VehicleCard.tsx` — pridat `sizes` prop pro responsive srcset
- Logo images — pridat `priority` na above-the-fold loga v navbarech
- Content images — pouzit `fill` layout s `sizes` pro responsive

### Krok 4: Cloudinary URL optimalizace

**Soubor:** `lib/cloudinary.ts` — pridat export:

```ts
/**
 * Transformuje Cloudinary URL na optimalizovanou verzi
 * Input:  https://res.cloudinary.com/xxx/image/upload/v123/photo.jpg
 * Output: https://res.cloudinary.com/xxx/image/upload/w_800,q_auto,f_auto/v123/photo.jpg
 */
export function getOptimizedUrl(
  url: string,
  width: number = 800,
  quality: string = "auto"
): string {
  if (!url.includes("res.cloudinary.com")) return url;
  return url.replace(
    "/image/upload/",
    `/image/upload/w_${width},q_${quality},f_auto,c_fill/`
  );
}
```

**Pouziti vsude kde se zobrazuji Cloudinary URL:**
- `VehicleCard.tsx` — `getOptimizedUrl(car.photo, 400)`
- `VehicleGallery.tsx` — thumbnail: `getOptimizedUrl(url, 200)`, fullsize: `getOptimizedUrl(url, 1200)`
- `PartCard.tsx` — `getOptimizedUrl(image, 300)`
- `ProductCard.tsx` — `getOptimizedUrl(image, 300)`

**Ocekavany dopad:** Obrazky 2-5x mensi (napr. 2MB → 100KB), vyrazne rychlejsi LCP.

### Krok 5: ISR pro katalogove stranky

**Soubory:**

```ts
// app/(web)/nabidka/page.tsx — katalog vozidel
export const revalidate = 300; // 5 minut

// app/(web)/inzerce/katalog/page.tsx — inzeraty
export const revalidate = 300;

// app/(web)/shop/katalog/page.tsx — e-shop
export const revalidate = 300;

// app/(web)/dily/katalog/page.tsx — dily
export const revalidate = 300;

// app/(web)/makleri/page.tsx — seznam makleru
export const revalidate = 3600; // 1 hodina

// app/(web)/recenze/page.tsx — recenze
export const revalidate = 3600;
```

**Detail stranky — generateStaticParams + ISR:**

```ts
// app/(web)/nabidka/[slug]/page.tsx
export const revalidate = 600; // 10 minut

export async function generateStaticParams() {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true },
    take: 100, // Pre-render top 100
    orderBy: { createdAt: "desc" },
  });
  return vehicles.map((v) => ({ slug: v.slug }));
}
```

Shodne pro:
- `app/(web)/shop/produkt/[slug]/page.tsx`
- `app/(web)/makler/[slug]/page.tsx`

**Pozn.:** Vyzaduje PostgreSQL (plan P0-08) — SQLite nezvladne concurrent reads pri ISR.

### Krok 6: Cache hlavicky na verejne GET API

**Vzor:**
```ts
return NextResponse.json(data, {
  headers: {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  },
});
```

**Endpointy k uprave:**

| Endpoint | s-maxage | stale-while-revalidate | Duvod |
|----------|----------|----------------------|-------|
| `api/vehicles` GET | 60 | 300 | Katalog, casty update |
| `api/listings` GET | 60 | 300 | Katalog |
| `api/parts` GET | 60 | 300 | Katalog |
| `api/parts/brands` GET | 3600 | 7200 | Staticka data |
| `api/parts/categories` GET | 3600 | 7200 | Staticka data |
| `api/brokers` GET | 300 | 600 | Zridka se meni |
| `api/reviews` GET | 300 | 600 | Zridka se meni |

**NEPRIDAVAT cache na:**
- POST/PUT/DELETE endpointy
- Endpointy vyzadujici session (uzivatelska data)
- `/api/auth/*`
- `/api/orders/*`
- `/api/admin/*`

### Krok 7: Bundle analyzer instalace

**Pridat devDependency:**
```bash
npm install -D @next/bundle-analyzer
```

**Soubor:** `next.config.ts` — pridat podmineny wrapper:

```ts
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyze = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// ...
export default withAnalyze(withSerwist(nextConfig));
```

**Soubor:** `package.json` — pridat script:
```json
"analyze": "ANALYZE=true next build --webpack"
```

### Krok 8: React.memo na list itemech

**Soubory:**

```diff
+ import { memo } from "react";

- export function VehicleCard({ car, className }: VehicleCardProps) {
+ export const VehicleCard = memo(function VehicleCard({ car, className }: VehicleCardProps) {
    // ...
- }
+ });
```

Kandidati:
- `components/web/VehicleCard.tsx` — renderovany v seznamu 20+ polozek
- `components/web/ProductCard.tsx` — renderovany v seznamu
- `components/pwa-parts/parts/PartCard.tsx`
- `components/web/marketplace/OpportunityCard.tsx`
- `components/web/RecommendedParts.tsx` (inner card)

### Krok 9: Suspense pro streaming SSR (volitelne, pokrocile)

**Vzor pro katalogovou stranku:**

```tsx
// app/(web)/nabidka/page.tsx
import { Suspense } from "react";

export default function NabidkaPage({ searchParams }) {
  return (
    <div>
      <h1>Nabidka vozidel</h1>
      {/* Filtry se renderuji okamzite */}
      <FilterBar searchParams={searchParams} />
      {/* Vysledky se streamuji */}
      <Suspense fallback={<VehicleListSkeleton />}>
        <VehicleList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

// VehicleList je async Server Component
async function VehicleList({ searchParams }) {
  const vehicles = await prisma.vehicle.findMany(/* ... */);
  return <div>{vehicles.map(v => <VehicleCard key={v.id} car={v} />)}</div>;
}
```

Toto je pokrocily pattern — implementovat az po zakladnich optimalizacich (Kroky 1-8).

---

## Soubory k uprave/vytvoreni

| Soubor | Zmena | Narocnost |
|--------|-------|-----------|
| `app/layout.tsx` | Font: odebrat 300+900, pridat display:swap | XS |
| Import PriceHistory | next/dynamic lazy load | S |
| `lib/cloudinary.ts` | Pridat getOptimizedUrl export | XS |
| 22 souboru s `<img>` | Migrace na next/image (sdileno s P1-15) | L |
| `app/(web)/nabidka/page.tsx` | `revalidate = 300` | XS |
| `app/(web)/inzerce/katalog/page.tsx` | `revalidate = 300` | XS |
| `app/(web)/shop/katalog/page.tsx` | `revalidate = 300` | XS |
| `app/(web)/dily/katalog/page.tsx` | `revalidate = 300` | XS |
| `app/(web)/nabidka/[slug]/page.tsx` | `revalidate + generateStaticParams` | S |
| `app/(web)/shop/produkt/[slug]/page.tsx` | `revalidate + generateStaticParams` | S |
| 7+ API route souboru | Cache-Control hlavicky | S |
| `next.config.ts` | Bundle analyzer wrapper | XS |
| `package.json` | analyze script + @next/bundle-analyzer | XS |
| 5 card komponent | React.memo wrapping | S |

---

## Poradi implementace (podle dopadu na LCP/TTFB)

| Poradi | Krok | Ocekavany dopad | Narocnost |
|--------|------|-----------------|-----------|
| 1 | Font optimalizace | FCP -100-200ms, -20KB | XS |
| 2 | next/dynamic (recharts) | Initial JS -80KB | S |
| 3 | img → next/image | LCP -30-50%, CLS fix | L |
| 4 | Cloudinary URL transformace | Obrazky 2-5x mensi | S |
| 5 | ISR pro katalogy | TTFB -200-500ms | S |
| 6 | API cache hlavicky | Opakované req -80% | S |
| 7 | Bundle analyzer | Mereni (prerequisite dalsi optimalizace) | XS |
| 8 | React.memo | Render time -10-20% na seznamech | S |
| 9 | Suspense streaming | Progressivni rendering (pokrocile) | M |

---

## Overeni

- [ ] Font: Outfit nacita 5 rezu (400-800), ma display:swap
- [ ] PriceHistory (recharts) pouziva next/dynamic s ssr:false
- [ ] Zadny surovy `<img>` tag — vsude `<Image>` (nebo planovane)
- [ ] Cloudinary URL obsahuji transformace (w_, q_auto, f_auto)
- [ ] Katalogove stranky (nabidka, inzerce, shop, dily) maji `revalidate`
- [ ] Verejne GET API maji Cache-Control hlavicky
- [ ] VehicleCard, ProductCard pouzivaji React.memo
- [ ] `npm run analyze` funguje a ukazuje bundle composition
- [ ] Lighthouse Performance score ≥ 80 na hlavni strance
- [ ] Build prochazi
- [ ] Vizualne bez zmen (obrazky, fonty, layout)
