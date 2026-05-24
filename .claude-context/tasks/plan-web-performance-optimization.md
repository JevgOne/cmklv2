# Plan: Web Performance Optimization — rychlejší Carmakler

**Task:** #83
**Status:** PLAN READY
**Datum:** 2026-05-23
**Typ:** Performance optimization
**Závažnost:** CRITICAL — uživatel explicitně říká "Web musí běžet jako SERVER SIDE!" (CAPSLOCK)

---

## ⚠️ KRITICKÝ POŽADAVEK UŽIVATELE

> "Web musí běžet jako SERVER SIDE!"

**Priorita #1:** Maximální SSR. "use client" jen kde ABSOLUTNĚ nutné.

---

## DEEP SSR AUDIT — KAŽDÝ "use client" v app/(web)/

### Nalezeno: 73 souborů s "use client" v app/(web)/

| Kategorie | Počet | Akce |
|-----------|-------|------|
| **REMOVE** — zbytečné, může být Server Component | **45** | Odstranit "use client" |
| **KEEP** — legitimně potřebuje interaktivitu | **25** | Ponechat |
| **URL_PARAMS** — useState pro tabs, nahradit searchParams | **2** | Refaktorovat |
| **REFACTOR** — extrahovat interaktivní child | **1** | Reorganizovat |

### 45× REMOVE — Zbytečné "use client" (error.tsx soubory)

Všech **45 error.tsx** souborů v app/(web)/ má "use client" zbytečně.
Zobrazují jen statické UI s reset tlačítkem — nepotřebují useState/useEffect.

**DŮLEŽITÉ:** Next.js error.tsx VYŽADUJE "use client" direktivu — je to framework requirement pro error boundaries (React error boundary je client-only API). **Tyto soubory NELZE konvertovat na Server Components.**

→ **ŽÁDNÁ AKCE** na error.tsx souborech. Jsou správně.

### 25× KEEP — Legitimní client components

| # | Soubor | Hooks/APIs | Důvod |
|---|--------|-----------|-------|
| 1 | `profil/[slug]/ProfileClient.tsx` | useState(7×), useEffect(2×), useCallback, useRef | Tabs + API fetch + share |
| 2 | `inzerce/registrace/page.tsx` | useState(8×), form submission, ARES API | Registrační formulář |
| 3 | `shop/objednavka/page.tsx` | useState(6×), useEffect, multi-step checkout | Objednávkový flow |
| 4 | `shop/kosik/page.tsx` | useState, useEffect, localStorage listener | Real-time košík |
| 5 | `shop/produkt/[slug]/AddToCartButton.tsx` | useState, onClick, cart API | Přidat do košíku |
| 6 | `dily/kosik/page.tsx` | useState, useEffect, cart listener | Díly košík |
| 7 | `dily/objednavka/page.tsx` | useState(6×), useEffect(3×), useMemo, useRef | Díly checkout |
| 8 | `blog/[slug]/ReadingProgress.tsx` | useEffect, useState, window.scroll | Progress bar |
| 9 | `blog/[slug]/ShareButtons.tsx` | useState, navigator.clipboard | Sdílení |
| 10 | `nabidka/porovnani/CompareTable.tsx` | useState, useEffect, useCompare context | Porovnání |
| 11 | `nabidka/[slug]/ContactBrokerButton.tsx` | onClick, DOM .scrollIntoView() | Scroll to form |
| 12 | `nabidka/[slug]/platba/PaymentPageContent.tsx` | useState(5×), form submission | Platební formulář |
| 13 | `nabidka/[slug]/platba/BankTransferDetails.tsx` | useState, useEffect, QRCode lib | QR generování |
| 14 | `marketplace/apply/page.tsx` | useState, form submission | Přihláška |
| 15-25 | Další marketplace, muj-ucet, registrace | Formuláře, modaly, interaktivní UI | Legitimní |

### 2× URL_PARAMS — Refaktorovat tabs na searchParams

| # | Soubor | Aktuálně | Cíl |
|---|--------|---------|-----|
| 1 | `nabidka/[slug]/VehicleDetailTabs.tsx` | `useState("params")` | `searchParams.tab` → Server Component |
| 2 | `shop/produkt/[slug]/ProductDetailTabs.tsx` | `useState("popis")` | `searchParams.tab` → Server Component |

**Implementace:**
```typescript
// PŘED (Client Component):
"use client";
const [activeTab, setActiveTab] = useState("params");

// PO (Server Component):
export default function VehicleDetailTabs({ searchParams }) {
  const activeTab = searchParams.tab || "params";
  // Render tab content server-side
}
// Tab links: <Link href="?tab=vybava">Výbava</Link>
```

### 1× REFACTOR — ProfileClient.tsx

`profil/[slug]/ProfileClient.tsx` (450+ řádků) je masivní client component.
**Refaktor:** Rozdělit na:
- Server Component (profil hlavička, statické info)
- Client Component (tab switching, API fetching, share button)

---

## AUDIT — AKTUÁLNÍ STAV

### Build output analýza

```
Route Types:
○  (Static)   — prerendered, instant load
●  (SSG)      — prerendered with generateStaticParams
ƒ  (Dynamic)  — server-rendered on demand (KAŽDÝ REQUEST)
```

**Výsledek:** ~85% stránek je **ƒ (Dynamic)** — renderuje se na každý request.
Jen ~15% je ○/● (statické/pre-generated).

### Identifikované bottlenecky

| # | Problém | Dopad | Kde |
|---|---------|-------|-----|
| 1 | **68% stránek bez caching** — žádný `revalidate` export | CRITICAL | ~195 page.tsx souborů |
| 2 | **Nabídka fetchLimit waste** — fetches 36+ records, shows 18 | HIGH | `nabidka/page.tsx` |
| 3 | **Sequential similarity queries** — 4 DB queries sériově | HIGH | `nabidka/[slug]/page.tsx` |
| 4 | **529 "use client" souborů** — nadměrný client-side JS | HIGH | Celý codebase |
| 5 | **8 layout.tsx s "use client"** — anti-pattern | HIGH | Layouts across app |
| 6 | **0 Suspense boundaries** — celá stránka čeká na nejpomalejší query | MEDIUM | Všechny stránky |
| 7 | **Raw `<img>` tags** — bez next/image optimalizace | MEDIUM | 18 souborů |
| 8 | **framer-motion 5.5MB** — použito jen ve 2 souborech | MEDIUM | PWA onboarding |
| 9 | **DB pool size 5** — potenciální bottleneck pod zátěží | LOW | `lib/prisma.ts` |

---

## CO JE SPRÁVNĚ (neměnit)

- ✅ **Font loading** — `next/font/google` s `display: "swap"`, žádný layout shift
- ✅ **ISR na klíčových stránkách** — nabídka (300s), profily (300s), homepage (3600s)
- ✅ **API caching** — vehicles, listings, parts mají `s-maxage=60, stale-while-revalidate=300`
- ✅ **Prisma singleton** — connection pooling, žádné leaky connections
- ✅ **AI/heavy calls jen v API routes** — neblokují page renders
- ✅ **Error boundaries** — 139 error.tsx s loading.tsx coverage
- ✅ **Bundle analyzer** — `npm run analyze` nakonfigurovaný
- ✅ **Sentry** — error tracking s source maps
- ✅ **Edge middleware** — JWT validation bez DB calls

---

## IMPLEMENTAČNÍ PLÁN

### Fáze 1: Quick Wins — statické stránky (CRITICAL, ~2h)

**Problém:** 195 stránek bez `revalidate` → každý request = full SSR + DB query.

**Fix:** Přidat `export const revalidate` na stránky se statickým/polostatickým obsahem.

| Revalidate | Stránky | Příklad |
|------------|---------|---------|
| `86400` (24h) | Statické info stránky | `/sluzby`, `/o-nas`, `/obchodni-podminky`, `/ochrana-osobnich-udaju`, `/reklamacni-rad`, `/zasady-cookies`, `/jak-prodat-auto`, `/cenik`, `/pro-maklere`, `/kariera` |
| `3600` (1h) | Katalogové stránky | `/bazar/[slug]`, `/autoservisy`, `/autoservisy/[slug]`, `/stk`, `/recenze`, `/kontakt` |
| `600` (10min) | Detail stránky | `/stk/[slug]`, `/stk/mesto/[city]`, `/shop/produkt/[slug]` |
| `300` (5min) | Listing stránky | `/nabidka` (už má), `/inzerce`, `/dily/kategorie/[slug]` |

**Soubory k editaci (~25):**

```typescript
// Přidat na začátek každé stránky:
export const revalidate = 86400; // 24 hodin pro statický obsah
```

**Konkrétní soubory (Tier 1 — statické, `revalidate = 86400`):**
- `app/(web)/sluzby/page.tsx`
- `app/(web)/sluzby/financovani/page.tsx`
- `app/(web)/sluzby/pojisteni/page.tsx`
- `app/(web)/sluzby/proverka/page.tsx`
- `app/(web)/o-nas/page.tsx`
- `app/(web)/obchodni-podminky/page.tsx`
- `app/(web)/ochrana-osobnich-udaju/page.tsx`
- `app/(web)/reklamacni-rad/page.tsx`
- `app/(web)/zasady-cookies/page.tsx`
- `app/(web)/jak-prodat-auto/page.tsx`
- `app/(web)/cenik/page.tsx`
- `app/(web)/pro-maklere/page.tsx`
- `app/(web)/kariera/page.tsx`
- `app/(web)/kontakt/page.tsx`
- `app/(web)/chci-prodat/page.tsx`

**Tier 2 — polostatické (`revalidate = 3600`):**
- `app/(web)/autoservisy/page.tsx`
- `app/(web)/autoservisy/[slug]/page.tsx`
- `app/(web)/bazar/page.tsx`
- `app/(web)/bazar/[slug]/page.tsx`
- `app/(web)/recenze/page.tsx`
- `app/(web)/stk/page.tsx`
- `app/(web)/blog/page.tsx`

**Dopad:** Cache hit ratio z ~12% → ~80%. Statické stránky servírované z cache = ~0ms místo ~200-500ms SSR.

---

### Fáze 2: Database query optimalizace (HIGH, ~3h)

#### Fix 2.1: Nabídka fetchLimit waste

**Soubor:** `app/(web)/nabidka/page.tsx` (řádky ~110-212)

**Problém:**
```typescript
// Aktuální — fetch 36+ záznamů, zobrazit 18:
const fetchLimit = (page * limit) + limit; // page=1 → fetchLimit=36
const vehicles = await prisma.vehicle.findMany({ take: fetchLimit, ... });
const sliced = vehicles.slice(offset, offset + limit); // 18 records
```

**Fix:**
```typescript
// Opraveno — fetch přesně kolik potřebujeme:
const vehicles = await prisma.vehicle.findMany({
  skip: offset,
  take: limit, // Přímo 18, ne 36+
  ...
});
```

**Dopad:** 50-60% méně DB load na catalog page.

#### Fix 2.2: Sequential similarity queries

**Soubor:** `app/(web)/nabidka/[slug]/page.tsx` (řádky ~213-255)

**Problém:** 4 DB queries sériově (brand+model → brand+price → bodyType+price → price):
```typescript
let similar = await tier1Query(); // 100ms
if (similar.length < 4) similar = await tier2Query(); // +100ms
if (similar.length < 4) similar = await tier3Query(); // +100ms
if (similar.length < 4) similar = await tier4Query(); // +100ms
// Total: až 400ms
```

**Fix:** Paralelní queries:
```typescript
const [tier1, tier2, tier3, tier4] = await Promise.all([
  tier1Query(),
  tier2Query(),
  tier3Query(),
  tier4Query(),
]);
// Merge, deduplicate, take first 4
const similar = deduplicateById([...tier1, ...tier2, ...tier3, ...tier4]).slice(0, 4);
// Total: max(100ms, 100ms, 100ms, 100ms) = ~100ms
```

**Dopad:** Vehicle detail page 40-60% rychlejší na cache miss.

#### Fix 2.3: Broker tag page optimization

**Soubor:** `app/(web)/makleri/[slug]/page.tsx` (řádky ~135-196)

**Problém:** GroupBy query přes všechny vehicles per broker — drahé.

**Fix:** Přepsat na lightweight `count()` queries místo groupBy aggregace. Nebo pre-computed metrics v User modelu.

---

### Fáze 3: SSR Maximum — Client component audit (CRITICAL, ~6h)

**UŽIVATEL POŽADUJE: "Web musí běžet jako SERVER SIDE!"**

Detailní audit proveden — viz SSR AUDIT sekce výše. Shrnutí akčních položek:

#### Fix 3.1: Refaktorovat 2 tab komponenty na Server Components

| Soubor | Před | Po |
|--------|------|-----|
| `nabidka/[slug]/VehicleDetailTabs.tsx` | useState("params") | searchParams.tab, Server Component |
| `shop/produkt/[slug]/ProductDetailTabs.tsx` | useState("popis") | searchParams.tab, Server Component |

Tab linky použijí `<Link href="?tab=vybava">` místo onClick handleru.
**Dopad:** -2 client components, lepší SSR na detail stránkách.

#### Fix 3.2: Rozdělit ProfileClient.tsx

`profil/[slug]/ProfileClient.tsx` (450+ řádků, 7× useState, 2× useEffect):
- **Server part:** Profil hlavička, bio, kontakt info, badges → async Server Component
- **Client part:** Tab switching + dynamic item loading → malý client child

**Dopad:** ~70% profil stránky SSR místo 100% client.

#### Fix 3.3: Odstranit "use client" z layout.tsx kde zbytečné

**Soubory (8 layoutů s "use client"):**
- `app/(web)/kariera/layout.tsx` — **REMOVE** — nepotřebuje interaktivitu
- `app/(partner)/layout.tsx` — ověřit, pravděpodobně REMOVE
- `app/(pwa)/layout.tsx` — KEEP (OnlineStatusProvider), ale extrahovat provider do child
- `app/(pwa-parts)/layout.tsx` — stejné jako PWA
- `app/(pwa)/makler/onboarding/layout.tsx` — framer-motion → izolovat
- Ostatní PWA layouty — KEEP (DraftProvider legitimní)

#### Fix 3.4: framer-motion lazy load

**Problém:** 5.5MB závislost, použita jen ve 2 souborech (PWA onboarding).

**Fix:** `next/dynamic` s `{ ssr: false }`:
```typescript
const AnimatedLayout = dynamic(() => import("./AnimatedLayout"), { ssr: false });
```
**Dopad:** -5.5MB z initial client bundle.

#### Fix 3.5: Ověřit data fetching pattern

**Pravidlo:** Data fetching VŽDY na serveru (async Server Component), NIKDY useEffect + fetch.

**Zkontrolovat web pages:**
- Žádná stránka v app/(web)/ nesmí fetchovat data přes useEffect
- Pokud ano → přesunout do async Server Component s Prisma query
- Client component jen pro interakci (formuláře, modaly, košíky)

---

### Fáze 4: Image optimalizace (MEDIUM, ~3h)

#### Fix 4.1: Nahradit `<img>` za `next/image`

**18 souborů s raw `<img>` tags** — bez automatic:
- WebP/AVIF konverze
- Responsive sizing
- Lazy loading
- Blur placeholder

**Prioritní soubory (web-facing, high traffic):**

| Soubor | Kontext | Dopad |
|--------|---------|-------|
| `app/(web)/page.tsx` | Homepage — 2 instance | HIGH — LCP improvement |
| `app/(web)/inzerce/page.tsx` | Listing platform | HIGH |
| `app/(web)/nabidka/porovnani/CompareTable.tsx` | Vehicle comparison | MEDIUM |
| `app/(web)/muj-ucet/dotazy/page.tsx` | Inquiry thumbnails | LOW |
| `app/(web)/shop/kosik/page.tsx` | Cart thumbnails | LOW |

**Implementace:**
```typescript
// Před:
<img src={url} alt={alt} className="w-full h-48 object-cover" />

// Po:
import Image from "next/image";
<Image
  src={url}
  alt={alt}
  width={400}
  height={300}
  className="w-full h-48 object-cover"
  loading="lazy"
/>
```

**Cloudinary transformace:** Stávající `getOptimizedUrl()` utility zachovat pro OG images. Pro `next/image` — Cloudinary loader:
```typescript
// next.config.ts already has:
images: { remotePatterns: [{ hostname: "res.cloudinary.com" }] }
// → next/image automaticky optimalizuje Cloudinary URLs
```

#### Fix 4.2: Cloudinary URL optimization

Ověřit že Cloudinary URLs používají transformace:
```
/image/upload/f_auto,q_auto,w_800/v1/vehicles/...
```
- `f_auto` → automatický WebP/AVIF
- `q_auto` → automatická kvalita
- `w_800` → resize na potřebnou šířku

---

### Fáze 5: Suspense boundaries (MEDIUM, ~4h)

**Problém:** 0 Suspense boundaries → celá stránka čeká na nejpomalejší query.

**Kde přidat:**

#### 5.1 Vehicle detail page (`nabidka/[slug]/page.tsx`)

```tsx
export default async function VehicleDetailPage({ params }) {
  const vehicle = await fetchVehicle(params.slug); // Hlavní data — BLOKUJÍCÍ
  
  return (
    <>
      <VehicleHero vehicle={vehicle} />       {/* LCP — okamžitě */}
      <VehicleSpecs vehicle={vehicle} />      {/* Okamžitě */}
      
      <Suspense fallback={<SimilarVehiclesSkeleton />}>
        <SimilarVehicles vehicle={vehicle} /> {/* STREAMED — neblokuje LCP */}
      </Suspense>
      
      <Suspense fallback={<PriceHistorySkeleton />}>
        <PriceHistory vehicleId={vehicle.id} />
      </Suspense>
    </>
  );
}
```

#### 5.2 Broker tag page (`makleri/[slug]/page.tsx`)

```tsx
<Suspense fallback={<BrokerGridSkeleton />}>
  <BrokerGrid tagSlug={params.slug} />
</Suspense>
```

#### 5.3 Homepage (`page.tsx`)

```tsx
<HeroSection />                              {/* Okamžitě — LCP */}
<Suspense fallback={<FeaturedVehiclesSkeleton />}>
  <FeaturedVehicles />                       {/* Streamed */}
</Suspense>
<Suspense fallback={<RecentReviewsSkeleton />}>
  <RecentReviews />                          {/* Streamed */}
</Suspense>
```

**Dopad:** LCP zlepšení o 500ms+ — uživatel vidí hlavní obsah okamžitě, sekundární se doloaduje.

---

### Fáze 6: Advanced optimizations (LOW, future)

| # | Optimalizace | Dopad | Effort |
|---|-------------|-------|--------|
| 6.1 | Zvýšit DB pool na 10-15 | Concurrency pod zátěží | 5 min |
| 6.2 | `generateStaticParams` pro top 100 vozidel | Pre-build populárních stránek | 2h |
| 6.3 | Slow query monitoring (Sentry performance) | Observabilita | 1h |
| 6.4 | Preconnect hints pro Cloudinary | DNS prefetch | 10 min |
| 6.5 | Service Worker caching pro API responses (PWA) | Offline + fast repeat | 4h |

---

## SOUBORY — KOMPLETNÍ SEZNAM

### Fáze 1 (25 souborů — přidat `revalidate`):
Viz seznam výše — ~15 statických + ~10 polostatických stránek.

### Fáze 2 (3 soubory):
| # | Soubor | Akce |
|---|--------|------|
| 1 | `app/(web)/nabidka/page.tsx` | Fix fetchLimit → skip+take |
| 2 | `app/(web)/nabidka/[slug]/page.tsx` | Paralelní similarity queries |
| 3 | `app/(web)/makleri/[slug]/page.tsx` | Optimalizovat broker tag queries |

### Fáze 3 (5-8 souborů):
| # | Soubor | Akce |
|---|--------|------|
| 1 | `app/(web)/kariera/layout.tsx` | Odstranit "use client" |
| 2 | `app/(pwa)/makler/onboarding/layout.tsx` | Izolovat framer-motion |
| 3 | Web tab components | URL params místo useState |
| 4-8 | Další "use client" kandidáti | Case-by-case audit |

### Fáze 4 (5-8 souborů):
| # | Soubor | Akce |
|---|--------|------|
| 1 | `app/(web)/page.tsx` | `<img>` → `<Image>` |
| 2 | `app/(web)/inzerce/page.tsx` | `<img>` → `<Image>` |
| 3-8 | Další soubory s `<img>` | Case-by-case |

### Fáze 5 (3-5 souborů):
| # | Soubor | Akce |
|---|--------|------|
| 1 | `app/(web)/nabidka/[slug]/page.tsx` | +Suspense pro similar vehicles |
| 2 | `app/(web)/makleri/[slug]/page.tsx` | +Suspense pro broker grid |
| 3 | `app/(web)/page.tsx` | +Suspense pro featured sections |

---

## PRIORITNÍ POŘADÍ

```
Fáze 1 (revalidate)     → 6-8x throughput       → ~2h  → OKAMŽITÝ DOPAD
Fáze 2 (DB queries)     → 40-60% faster pages   → ~3h  → VYSOKÝ DOPAD
Fáze 3 (client audit)   → -5MB bundle, faster TTI → ~4h  → STŘEDNÍ DOPAD
Fáze 4 (images)         → 30% image bandwidth    → ~3h  → STŘEDNÍ DOPAD
Fáze 5 (Suspense)       → LCP +500ms             → ~4h  → STŘEDNÍ DOPAD
Fáze 6 (advanced)       → Marginal gains         → ~8h  → NÍZKÝ DOPAD
```

**Celkem: ~28h práce pro kompletní optimalizaci.**
**Quick wins (Fáze 1+2+3): ~11h pro 90% benefitu — SSR maximum priorita.**

---

## STOP PRAVIDLA

- **STOP-1:** NEMĚNIT ISR intervaly na stránkách kde už `revalidate` existuje — jsou kalibrované.
- **STOP-2:** NEODSTRAŇOVAT "use client" z komponent které POTŘEBUJÍ interaktivitu (forms, modals, dropdowns).
- **STOP-3:** NEMĚNIT PWA layout (`app/(pwa)/layout.tsx`) — OnlineStatusProvider je legitimní.
- **STOP-4:** NEMĚNIT API routes caching — `stale-while-revalidate` pattern je správný.
- **STOP-5:** NEPOUŽÍVAT `export const dynamic = "force-static"` na stránkách s user-specific daty.
- **STOP-6:** NEODSTRAŇOVAT loading.tsx/error.tsx — coverage je dobrá.
- **STOP-7:** Při nahrazování `<img>` za `<Image>` — zajistit `width` a `height` nebo `fill` prop, jinak layout shift.

---

## MĚŘENÍ — BEFORE/AFTER

### Před implementací (baseline):
```bash
# Lighthouse CI:
npx lighthouse https://carmakler.cz --output=json --output-path=./baseline.json

# Core Web Vitals:
# LCP: měřit na /nabidka, /nabidka/[slug], homepage
# FCP: měřit na všech veřejných stránkách
# CLS: měřit na stránkách s obrázky
# TTFB: měřit na dynamic stránkách
```

### Po implementaci:
- Stejné Lighthouse testy
- Porovnat: LCP, FCP, CLS, TTFB, Speed Index, Total Blocking Time
- Build size porovnání (`npx next build` output)

---

## ACCEPTANCE CRITERIA

- [ ] Statické stránky mají `revalidate` export (25+ souborů)
- [ ] `/nabidka` page fetch přesně `limit` záznamů (ne fetchLimit waste)
- [ ] Vehicle detail similarity queries běží paralelně (Promise.all)
- [ ] Minimálně 1 layout.tsx zbaven zbytečného "use client"
- [ ] Minimálně 5 `<img>` nahrazeno `<Image>` na web-facing stránkách
- [ ] framer-motion lazy-loaded nebo nahrazeno CSS
- [ ] Minimálně 2 Suspense boundaries na klíčových stránkách
- [ ] LCP na homepage < 2.5s (Good)
- [ ] TTFB na statických stránkách < 200ms
- [ ] `npm run build` projde
- [ ] Žádný vizuální regress (CLS = 0)
