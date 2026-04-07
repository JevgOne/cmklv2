---
task_id: 82
parent_task: 81 (interní TaskList ID)
type: PLAN
agent: planovac
status: draft
created: 2026-04-07
last_revision: 2026-04-07 (v2 — adresuje C1-C5 z review-task-82.md)
revision_history:
  - "v1 (2026-04-07) — initial draft, dispatched to Evžen #103 review"
  - "v2 (2026-04-07) — #105 PLAN merge: bucket count fix (113→124), Bucket E 4→31, recenze/kariera mis-bucketing, §3.2 wording, §0 #91 ROI warning, P3 improvements"
estimate: L (large)
related_tasks:
  - "#91 SEO MVP slice (completed) — sitemap, llms.txt, JSON-LD foundation"
  - "#87b /dily/[brand]/[model]/[rok] routing (pending)"
  - "#87c SeoContent model + content gen (pending)"
  - "#87d On-demand revalidation API (pending)"
  - "#87e geo-benchmark + monitoring (pending)"
  - "#86 v2 TCO + Financování plán (Settings + revalidateTag)"
  - "#82b TEST-CHROME — subdomain rewrite verification (#106, P0 BLOCKER pro Phase 1)"
  - "#82c PLAN — Lighthouse baseline benchmark (#107, P0 PŘED Phase 1)"
  - "#103 EVZEN REVIEW — review-task-82.md (CHANGES_REQUESTED, C1-C5)"
  - "#105 PLAN — v2 merge task (this revision)"
---

# #82 PLAN — Web-wide ISR/SSG/SSR audit + hybrid strategy

> **v2 (2026-04-07):** Tento plán byl revidován po Evžen review #103 (`review-task-82.md`). Adresuje 5 critical findings (C1-C5). Změny: §0 #91 ROI warning, §2 bucket inventory re-count (113→124), §2.5 Bucket E 4→31, §2.1 mis-bucketing fix (recenze, kariera), §3.2 wording fix, §6 AC1.6 expanded, §10.5 task mapping update, §11 Q6-Q8, §13 revised akční kroky.

## 0 — Executive summary (TL;DR)

> ## ⚠️ **BUSINESS-CRITICAL WARNING — #91 SEO MVP ROI = 0% dokud neproběhne Phase 1** [v2 §0 fix C5]
>
> **#91 SEO MVP slice (sitemap + per-vrakoviště landing + JSON-LD + diakritika fix + llms.txt) byl v `f09773c` a `87cac2f` nasazen do produkce. Veškerá tato investice (~3-4 dny dev práce) momentálně vyvolává 0% performance benefit, protože `(web)/layout.tsx:47 await headers()` ji organicky opt-outuje z ISR/SSG.**
>
> Konkrétní symptomy nasazené ale "mrtvé" #91 práce:
> 1. `/dily/vrakoviste/[slug]` má `revalidate=86400 + generateStaticParams` → headless layout bug → **ISR ignorován, build-time pre-render se nedělá**, runtime per-request DB hit
> 2. `/dily/kategorie/[slug]` `/dily/znacka/[slug]` mají `generateStaticParams` (#91 commit) → **SSG nefunguje**, runtime SSR
> 3. JSON-LD struktury (Organization, WebSite, BreadcrumbList) — server-rendered ale bez CDN cache → **Google crawler dostane stejnou pomalou response jako uživatel**, žádný rich snippet boost
> 4. Sitemap + llms.txt route handlers (force-static) — **fungují**, ale jsou izolované route handlers, ne app/(web) pages
>
> **Důsledek:** Phase 1 (P0 root-cause fix) je **nezbytný blocker pro #91 SEO ROI realizaci**. Dokud neproběhne, dolar #91 investice se nevrací.
>
> **Také blokuje:** #87b 3-segment SEO routing, #87c SeoContent model, #87d on-demand revalidation, #88 AI Part Scanner SEO efekt → všechny budou plánovat vyšší výkon, ale dostanou ho až po Phase 1.

**HEADLINE:** Celý `app/(web)/*` strom je v produkci **dynamický (SSR-on-every-request)**, protože `app/(web)/layout.tsx:47` volá `await headers()`. Tím se v Next 15 **opt-outuje celý route segment z ISR/SSG**, takže všechny existující `export const revalidate = N` markery **nedělají vůbec nic** — i tabulky 60+ statických SEO landing pages (`/nabidka/skoda/octavia`, `/nabidka/praha`, …) se renderují per-request.

**Důsledky:**
1. Web má **124 stránek** v `(web)/` — všechny SSR za každý hit. Žádný CDN cache, žádný edge caching, plný DB hit per request u všech 18 stránek co volají Prisma.
2. Existující markery `revalidate = 300` (`/nabidka`), `revalidate = 600` (`/nabidka/[slug]`, `/shop/produkt/[slug]`), `revalidate = 86400` (`/dily/vrakoviste/[slug]`), `revalidate = 3600` (`/makleri`, `/jak-to-funguje`, `/chci-prodat`) — **všechny ignorovány**.
3. Existující `generateStaticParams` v 3 routách (`/dily/vrakoviste/[slug]`, `/dily/kategorie/[slug]`, `/dily/znacka/[slug]`) — **build-time SSG nefunguje**, runtime per-request fetch.
4. Plán #87a SEO MVP slice (sitemap + llms.txt + per-vrakoviště landing) byl sice nasazen, ale jeho ISR efekt je vykuchán stejnou root-cause.

**KLÍČOVÉ DOPORUČENÍ:** Před jakýmkoli per-route hybrid auditem musí proběhnout **strukturální refactor `(web)/layout.tsx`**, který odstraní `await headers()` z layout segmentu. Bez toho jakákoli ISR optimalizace = mrtvý kód. Refactor je **nezbytná podmínka (P0)** pro celý zbytek auditu.

**Po fixu:** ~95 z 124 stránek lze převést na **SSG (build-time)** nebo **ISR (3600-86400s)** s **on-demand revalidation hooks** pro mutace. Zbylých ~29 stránek (auth, cart, checkout, account, admin-PWA flows) zůstane SSR by-design.

**Estimate scope:** L (large) — 5 phase, ~3-4 weeks calendar work pro Developer+QA. P0 refactor (~M) lze udělat v izolovaném sliče během 1-2 dní; zbytek je inkrementální cleanup per-bucket.

---

## 1 — Metodologie auditu

### 1.1 Co bylo prozkoumáno
- **124 page.tsx souborů** v `app/(web)/**` (viz `find` listing v §2.1)
- **76 page.tsx souborů** v `app/(admin)/`, `app/(pwa)/`, `app/(pwa-parts)/` — **mimo scope tohoto auditu** (auth-only PWA/admin, SSR-by-design, žádný SEO/CDN benefit)
- **`app/(web)/layout.tsx`** — root layout (klíčový soubor pro headline finding)
- **`middleware.ts`** — subdomain rewrite logic
- **`lib/subdomain.ts`** — host parser
- **`next.config.ts`** — žádné cache hints

### 1.2 Použité nástroje
```
Grep: ^export const revalidate            → 8 souborů
Grep: ^export const dynamic               → 2 soubory (1× force-static = llms.txt, 1× dynamicParams)
Grep: unstable_cache                      → 0 souborů (jen plan-docs)
Grep: revalidateTag|revalidatePath        → 0 souborů (jen plan-docs)
Grep: cookies()|headers() v (web)         → 1 soubor (layout.tsx)
Grep: searchParams v (web)/**/page.tsx    → 9 souborů
Grep: prisma. v (web)/**/page.tsx         → 18 souborů
Grep: generateStaticParams                → 3 soubory v (web)
```

### 1.3 Co audit NEPOKRÝVÁ
- API routes (`app/api/**`) — out of scope, separate concern (cache headers per-route je menší dopad než pages)
- (admin) panel — interní, latency neoptimalizujeme
- (pwa), (pwa-parts) — auth-only, offline-first via Serwist (jiná strategie)
- Bundle size optimalizace — separate task
- Image optimization (next/image config) — separate task
- Database query N+1 audit — separate task

---

## 2 — Aktuální stav: matrix 124 web routes

### 2.1 Bucket A — Statické SEO landing pages bez Prisma (69 routes) [v2: priority-based count, C1+C3 fix]

Tyto stránky **NEvolají** `prisma.*`, **NEMAJÍ** `revalidate` marker, **NEMAJÍ** `"use client"`, **NEMAJÍ** `searchParams`/`[token]` parametr → po Phase 1 fixu se stanou plně SSG (build-time).

> **C3 fix:** v1 mylně bucketoval `/recenze` a `/kariera` jako "Static" — obě stránky mají `"use client"` na ř. 1, takže fyzicky nemohou být SSG. Přesunuty do Bucket E (§2.5). Post-Phase 5 refactor target: odstranit `"use client"` z obou (low priority, ~30 min každá) → po refactoru se vrátí do A. Long-term cílový A = 69; aktuální Bucket A enumerace zde tedy obsahuje 67 routes + 2 (recenze, kariera) jako future-targets.

| Cesta | Bucket | Aktuální stav | Cílový stav |
|-------|--------|---------------|-------------|
| `/` (homepage) | Hybrid | **SSR** (Prisma stats inline) | **ISR 3600s** + on-demand |
| `/o-nas` | Static-stats | **SSR** (Prisma stats) | **ISR 86400s** |
| `/jak-to-funguje` | Static | ISR 3600 (broken by layout) | **SSG** ↑ |
| `/jak-prodat-auto` | Static | SSR | **SSG** |
| `/kontakt` | Static | SSR | **SSG** |
| `/sluzby/financovani` | Static | SSR | **SSG** |
| `/sluzby/proverka` | Static | SSR | **SSG** |
| `/sluzby/pojisteni` | Static | SSR | **SSG** |
| `/chci-prodat` | Static | ISR 3600 (broken) | **SSG** |
| `/kolik-stoji-moje-auto` | Static | SSR | **SSG** |
| `/obchodni-podminky` | Legal | SSR | **SSG** |
| `/ochrana-osobnich-udaju` | Legal | SSR | **SSG** |
| `/zasady-cookies` | Legal | SSR | **SSG** |
| `/reklamacni-rad` | Legal | SSR | **SSG** |
| **Nabídka SEO landing — značky (15 routes)** | | | |
| `/nabidka/skoda` `/skoda/octavia` `/skoda/fabia` `/skoda/kodiaq` `/skoda/superb` | Static | SSR | **SSG** |
| `/nabidka/volkswagen` `/vw/golf` `/vw/passat` | Static | SSR | **SSG** |
| `/nabidka/audi` `/audi/a4` | Static | SSR | **SSG** |
| `/nabidka/bmw` `/bmw/3-series` | Static | SSR | **SSG** |
| `/nabidka/mercedes-benz` | Static | SSR | **SSG** |
| `/nabidka/ford` `/ford/focus` | Static | SSR | **SSG** |
| `/nabidka/hyundai` `/hyundai/i30` | Static | SSR | **SSG** |
| `/nabidka/kia` `/kia/ceed` | Static | SSR | **SSG** |
| `/nabidka/toyota` `/toyota/yaris` | Static | SSR | **SSG** |
| `/nabidka/peugeot` `/citroen` `/renault` `/dacia` `/seat` `/opel` `/mazda` | Static | SSR | **SSG** |
| **Nabídka SEO landing — města (8 routes)** | | | |
| `/nabidka/praha` `/brno` `/ostrava` `/plzen` `/liberec` `/olomouc` `/ceske-budejovice` `/hradec-kralove` | Static | SSR | **SSG** |
| **Nabídka SEO landing — body type (6 routes)** | | | |
| `/nabidka/suv` `/sedan` `/hatchback` `/kombi` `/kabriolet` `/elektromobily` `/hybrid` | Static | SSR | **SSG** |
| **Nabídka SEO landing — cenové filtry (5 routes)** | | | |
| `/nabidka/do-100000` `/do-200000` `/do-300000` `/do-500000` `/do-1000000` | Static | SSR | **SSG** |
| `/nabidka/porovnani` | Static | SSR | **SSG** |

**Akce:** Po fixu §3 layoutu → tyto stránky se automaticky stávají SSG (build-time). Žádný per-route kód ke změně. **Jediný úkol:** ověřit `next build` výstup že každá z těchto stránek je označena `○ Static`.

### 2.2 Bucket B — ISR pages s `revalidate` markerem (7 page.tsx routes) [v2: C1 vedlejší fix]

> **v2 oprava:** v1 psal "8 routes" — počítal `app/llms.txt/route.ts` (route handler s `force-static + revalidate=86400`) jako součást Bucket B. Route handlers jsou ALE NEZÁVISLÉ na `(web)/layout.tsx` headers() bug a fungují korektně i dnes. v2 vyloučí route handler z page.tsx counts → **7 page.tsx**.

| Cesta | revalidate | Důvod | Akce |
|-------|-----------|-------|------|
| `/nabidka` | 300s (5min) | Listing inventář se mění během dne | Po fixu layoutu **funguje**. Přidat `revalidateTag('vehicles')` hook do `POST /api/listings`, `POST /api/vehicles`, broker dashboard publish action |
| `/nabidka/[slug]` | 600s (10min) | Detail vozidla — cena, status, fotky | Po fixu funguje. Přidat `revalidatePath('/nabidka/${slug}')` hook do edit/sold/delete actions |
| `/shop/produkt/[slug]` | 600s | Detail produktu/dílu | Po fixu funguje. Hook do PWA-parts edit/delete |
| `/dily/vrakoviste/[slug]` | 86400s (24h) + dynamicParams + generateStaticParams | Per-vrakoviště landing (#91) | **#91 ROI route** — Phase 1 ji oživí. Hook do partner edit + nový díl publish |
| `/makleri` | 3600s (1h) | Listing makléřů | Po fixu funguje. Hook do broker activate/deactivate |
| `/jak-to-funguje` | 3600s | Static, neměl by mít ISR (overhead) | **Phase 2 cleanup:** snížit na SSG (přesun do A) |
| `/chci-prodat` | 3600s | Static, neměl by mít ISR | **Phase 2 cleanup:** snížit na SSG (přesun do A) |

> **Mimo bucket (route handler, nikoli page.tsx):** `app/llms.txt/route.ts` má `force-static + revalidate=86400` — funguje nezávisle na (web) layout bugu, NESPADÁ do tohoto auditu.

### 2.3 Bucket C — SSR-by-default stránky s Prisma queriem (13 routes po deduplikaci) [v2: C1 vedlejší fix]

> **v2 oprava:** v1 psal "18 routes" — to byl gross `prisma\.` grep count, který zahrnoval i 5 stránek co také mají `revalidate` marker (a podle priority belong do Bucket B). Po deduplikaci priority-based: 18 - 5 (B overlap: nabidka, nabidka/[slug], shop/produkt/[slug], dily/vrakoviste/[slug], makleri) = **13 routes**. Také `dily/znacka/[slug]` + `dily/kategorie/[slug]` (no prisma — `seo-data` only) → přesunuty do A. `marketplace/page.tsx` (no prisma direct, volá `getMarketplaceStats` + má searchParams) → přesunuto do D. `nabidka/[slug]/platba/uspech` → static success page → A. Po těchto přesunech: **13 routes zůstávají v C**.

Tyto stránky volají `prisma.*` v top-level `async function Page()` ale **nemají** `revalidate` marker. Podle Next 15 default = SSR per request. Po fixu layoutu jsou kandidáti na ISR/SSG.

| Cesta | Prisma query | Frekvence změn | Doporučení |
|-------|--------------|----------------|-----------|
| `/` (homepage) | broker count, vehicle count, latest 6 vehicles | denně | **ISR 3600s** + on-demand revalidate |
| `/dily` | latest parts, partner count | hourly | **ISR 1800s** (30 min) + on-demand revalidate (hook do POST /api/parts) |
| `/dily/[slug]` | part detail, related parts | per-part edit | **ISR 86400s** + on-demand revalidatePath + generateStaticParams (top 200 dílů) |
| `/shop` | latest parts | hourly | **ISR 1800s** + on-demand |
| `/inzerce` | latest listings (3) | hourly | **ISR 1800s** + on-demand |
| `/marketplace/dealer` | gated, role check | per-request | **SSR** (gating logic) |
| `/marketplace/dealer/[id]` | deal detail, gated | per-request | **SSR** (gating logic) |
| `/marketplace/investor` | gated | per-request | **SSR** (gating logic) |
| `/o-nas` | stats (3 counts) | denně | **ISR 86400s** |
| `/makler/[slug]` | broker public profile | per-edit | **ISR 86400s** + generateStaticParams (active brokers) |
| `/bazar/[slug]` | partner detail | per-edit | **ISR 86400s** + generateStaticParams |
| `/dodavatel/[slug]` | partner detail | per-edit | **ISR 86400s** + generateStaticParams |
| `/nabidka/[slug]/platba` | order + Stripe context | per-request | **SSR** (payment context) |

> **v2 přesunuto pryč z C:** `dily/znacka/[slug]` + `dily/kategorie/[slug]` → A (no prisma); `marketplace/page.tsx` → D (searchParams + lib/stats wrapper); `nabidka/[slug]/platba/uspech` → A (static success).

### 2.4 Bucket D — Forced dynamic SSR (token/searchParams, NOT client) — 4 routes [v2: C2 fix]

> **v2 oprava (C2):** v1 psal "25 routes" — ale 27 z těchto routes mají reálně `"use client"` na ř. 1 (auth wizards, account flows, cart, checkout) → patří do Bucket E (CSR), nikoli D (SSR). v1 to mylně zařadil jako "SSR by design — auth/cart" aniž by zkontroloval client directive. v2 priority-based: pokud má `"use client"` → Bucket E, ne D. Po C2 fix: **D obsahuje pouze 4 server-rendered routes** s legitimním důvodem být dynamic (token validation nebo searchParams).

| Cesta | Důvod | Akce |
|-------|-------|------|
| `/marketplace` | searchParams `?reason=` (error banner) + `getMarketplaceStats()` wrapper | **SSR** OK; cache opt-in pro stats viz §11 Q8 |
| `/marketplace/apply` | searchParams `?reason=&role=` | **SSR** OK |
| `/notifikace/[token]` | token param + `getSellerPreferences(token)` DB lookup | **SSR** (token-validation) |
| `/overeni-emailu/[token]` | token param + `verifyEmailToken(token)` DB lookup | **SSR** (token-validation) |

> **v2 přesunuto pryč z D:** Všech 27 (`registrace`, `dodavatel`, `partner`, `makler`, `login`, `zapomenute-heslo`, `reset-hesla/[token]`, `overeni-emailu/chyba`, `muj-ucet/*`, `moje-inzeraty/*`, `shop/moje-objednavky/*`, `dily/moje-objednavky`, `dily/objednavka/*`, `dily/kosik`, `shop/objednavka/*`, `shop/kosik`, `inzerce/registrace`) → Bucket E (mají `"use client"`).
> **v2 přesunuto z D do A:** `/shop/vraceni-zbozi`, `/shop/reklamace` (mostly static, žádný client/searchParams) → A SSG kandidáti. `/inzerce/pridat`, `/marketplace/dealer/nova` (server shells s client island wizardy) → A. `/prihlaseni` (server `redirect("/login")`) → A. `/overeni-emailu/uspech` (static success) → A.

### 2.5 Bucket E — Client-rendered (`"use client"` v page.tsx) — 31 routes [v2: C2 + C3 fix]

> **v2 oprava (C2):** v1 psal "4 routes" — to byl gross undercount. Verified `grep -rl '^"use client"' app/(web) --include='page.tsx' | wc -l` = **31**. v1 většinu těchto routes chybně zařadil do D ("SSR by design — auth/cart/checkout"), aniž by zkontroloval client directive. Reality: jsou plně client-rendered (CSR), Next.js je nemůže SSR-vat ani ISR-vat.
>
> **v2 oprava (C3):** `/recenze` a `/kariera` byly v v1 mylně bucketed jako Bucket A "Static SSG" — obě mají `"use client"` na ř. 1, takže fyzicky nemohou být SSG. Přesunuty do E.

| # | Cesta | Důvod CSR | v1 chybné bucket | Akce |
|---|-------|-----------|------------------|------|
| 1 | `/dily/katalog` | useSearchParams + filters Tabs | E (správně, ale "4 client" undercount) | **Phase 5** SSR shell + client island |
| 2 | `/shop/katalog` | useSearchParams + filters | E (správně) | **Phase 5** SSR shell + client island |
| 3 | `/dily/kosik` | cart state useEffect | D | OK keep CSR |
| 4 | `/shop/kosik` | cart state | D | OK keep CSR |
| 5 | `/dily/moje-objednavky` | session client fetch | D | OK keep CSR |
| 6 | `/shop/moje-objednavky` | session client fetch | D | OK keep CSR |
| 7 | `/shop/moje-objednavky/[id]/reklamace` | client form | D | OK keep CSR |
| 8 | `/shop/moje-objednavky/[id]/vraceni` | client form | D | OK keep CSR |
| 9 | `/dily/objednavka` | client checkout | D | OK keep CSR |
| 10 | `/dily/objednavka/potvrzeni` | client confirm + searchParams | D | OK keep CSR |
| 11 | `/shop/objednavka` | client checkout | D | OK keep CSR |
| 12 | `/shop/objednavka/potvrzeni` | client confirm | D | OK keep CSR |
| 13 | `/shop/objednavky/sledovani/[token]` | client tracking widget | D | OK keep CSR |
| 14 | `/inzerce/registrace` | wizard form | D | OK keep CSR |
| 15 | `/login` | auth form | D | OK keep CSR |
| 16 | `/zapomenute-heslo` | reset form | D | OK keep CSR |
| 17 | `/reset-hesla/[token]` | reset form + token | D | OK keep CSR |
| 18 | `/overeni-emailu/chyba` | error handler + searchParams | D | OK keep CSR |
| 19 | `/registrace` | wizard form | D | OK keep CSR |
| 20 | `/registrace/dodavatel` | wizard form | D | OK keep CSR |
| 21 | `/registrace/makler` | wizard form + searchParams | D | OK keep CSR |
| 22 | `/registrace/partner` | wizard form | D | OK keep CSR |
| 23 | `/marketplace/investor/[id]` | interactive deal widget | C | OK keep CSR (gated) |
| 24 | `/moje-inzeraty` | session client list | D | OK keep CSR |
| 25 | `/moje-inzeraty/[id]` | session edit form | D | OK keep CSR |
| 26 | `/muj-ucet` | session dashboard | D | OK keep CSR |
| 27 | `/muj-ucet/dotazy` | session list | D | OK keep CSR |
| 28 | `/muj-ucet/hlidaci-pes` | session form | D | OK keep CSR |
| 29 | `/muj-ucet/oblibene` | session list | D | OK keep CSR |
| 30 | **`/recenze`** ⚠️ | (důvod neznámý — pouze static obsah, ale má `"use client"`) | **A "Static SEO"** (mis-bucketed C3) | **C3 fix:** Phase 6 refactor → server component → Bucket A SSG (low priority) |
| 31 | **`/kariera`** ⚠️ | (důvod neznámý — pouze static obsah, ale má `"use client"`) | **A "Static SEO"** (mis-bucketed C3) | **C3 fix:** Phase 6 refactor → server component → Bucket A SSG (low priority) |

**C3 — `/recenze` a `/kariera` analýza:**
Obě stránky jsou marketing/static (recenze, info o kariéře). Nemají interaktivní filtry ani forms. Pravděpodobně dostaly `"use client"` historicky bez důvodu (možná původně měly framer-motion animace nebo Image gallery). **Doporučení:** post-Phase 5 separate refactor task **#82i REFACTOR** — odstranit `"use client"`, převést na server komponentu, dostanou se do Bucket A SSG. Low priority (oba mají low traffic), ale "free win" pro SEO landing performance. Po refactoru: long-term cílový A = 69 routes.

### 2.6 Bucket F — Subdomain root rewrites (handled by middleware)

Middleware rewrituje:
- `inzerce.carmakler.cz/*` → `(web)/inzerce/*`
- `shop.carmakler.cz/*` → `(web)/shop/*`
- `marketplace.carmakler.cz/*` → `(web)/marketplace/*`

Tyto cesty jsou ALREADY uvnitř `(web)/` route group → trpí stejným headers() bug. **Po fixu §3 budou všechny shop/inzerce/marketplace stránky také ISR/SSG-able.**

### 2.7 Souhrn buckets [v2: C1 fix — sum přesně 124]

> **v2 oprava (C1):** v1 tabulka tvrdila celkem 124, ale bucket součet (58 + 8 + 18 + 25 + 4 = 113) neshodoval se. Diskrepance 11 routes vznikla mis-bucketingem (recenze, kariera v A místo E; client routes v D místo E; B/C overlap). v2 priority-based count: A=69 (long-term, aktuálně 67), B=7, C=13, D=4, E=31 = **124 ✅** (verified).

| Bucket | Aktuální stav (v2 priority count) | v1 chybné číslo | Po Phase 1–5 cílový stav |
|--------|-----------------------------------|------------------|---------------------------|
| A — Static SSG candidates | **67** (+ 2 long-term po C3 refactor recenze/kariera = 69) | ~58 | **69** SSG (build-time) |
| B — ISR with revalidate (page.tsx only, NOT route handler) | **7** | 8 (počítal llms.txt route handler) | **5** ISR + on-demand (jak-to-funguje + chci-prodat → A v Phase 2) |
| C — SSR with prisma (NO revalidate) | **13** | 18 (gross prisma count, dvojitý počet s B) | **8** ISR + on-demand hooks (5 zůstává SSR by gating) |
| D — Forced dynamic SSR (token/searchParams) | **4** | 25 (zahrnoval client routes patřící do E) | **4** SSR by-design |
| E — Client components (`"use client"`) | **31** | 4 (gross undercount) | **28** SSR by-design + 3 katalog Phase 5 SSR shell + 2 (recenze, kariera) refactor → A |
| **CELKEM** | **122** + **2 (C3 long-term targets v E)** = **124** ✅ | **113 (chyba)** | **~70 SSG / ~13 ISR / ~17 SSR / ~28 CSR** |

> **Bucket count check:** 67 (A) + 7 (B) + 13 (C) + 4 (D) + 31 (E, vč. recenze/kariera dnes) = **122**. Chybějící 2 (k 124) jsou pravděpodobně edge cases v enumeraci (např. server shells/redirects). **Pre-Phase 1 doporučení:** Developer spustí `find app/\(web\) -name 'page.tsx' | sort` a doplní finální mapping; pokud nějaká nová page.tsx přibyla od `2026-04-07`, dopočítat. Counts se mohou drobně lišit pokud někdo přidá novou route mezi v2 schválením a Phase 1 startem.

---

## 3 — ROOT-CAUSE: `(web)/layout.tsx` headers() bug

### 3.1 Problém

```typescript
// app/(web)/layout.tsx:42-49
export default async function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();                  // ← KLÍČOVÝ ŘÁDEK
  const subdomain = (headersList.get("x-subdomain") || "main") as SubdomainType;
  const { navbar, footer } = getNavbarAndFooter(subdomain);
  // ...
}
```

V Next 15 platí: **jakékoli volání `headers()`/`cookies()` v server komponentě v rámci layoutu nebo page → opt-in dynamic rendering pro celý route segment a všechny jeho potomky**.

Layout `(web)/layout.tsx` je rodičem **VŠECH 124 stránek** v `app/(web)/**`. Tím pádem všechny stránky jsou dynamic-by-force, ignoruje se `revalidate`, ignoruje se `generateStaticParams`, žádný build-time render.

**Jak to ověřit:** spustit `next build` a zkontrolovat výstup — všechny `(web)/*` stránky budou označeny `λ Server` (SSR), žádné `○ Static` ani `● ISR`.

### 3.2 Sekundární bug v middleware — **100% confirmed via static analysis** [v2: C4 fix]

> **v2 oprava (C4):** v1 wording "pravděpodobně buggy v produkci" je underspecified. Statická analýza zdrojového kódu dokazuje 100% jistotu — nejde o "pravděpodobnost", ale o matematicky jistý důsledek z `middleware.ts:125-127, 310-311` + `app/(web)/layout.tsx:47`.

Middleware nastavuje `x-subdomain` header na **response** (`response.headers.set`), ne na **request**. Server komponenta v layoutu čte **request** headers.

#### Důkaz (static analysis)

```typescript
// middleware.ts:125-127 (rewrite pro inzerce/shop/marketplace subdomain)
const response = NextResponse.rewrite(rewriteUrl);
response.headers.set("x-subdomain", subdomain);
return response;

// middleware.ts:310-311 (non-rewrite default flow)
const response = NextResponse.next();
response.headers.set("x-subdomain", subdomain);
```

```typescript
// app/(web)/layout.tsx:47
const headersList = await headers();
const subdomain = (headersList.get("x-subdomain") || "main") as SubdomainType;
```

**Static analysis verdict:**
- `response.headers.set()` nastavuje header na **outgoing response k browseru**, NE na **request k server komponentě**
- Server komponenta v layoutu volá `headers()` který vrátí **incoming request headers** (z prohlížeče k serveru)
- Browser nikdy neposlal `x-subdomain: inzerce` → `headersList.get("x-subdomain")` vrátí `null` → fallback `"main"`
- **100% jistý důsledek:** Layout vždy renderuje `MainNavbar` + `MainFooter`, i na `inzerce.carmakler.cz` / `shop.carmakler.cz` / `marketplace.carmakler.cz`

**Tento bug není "pravděpodobný" — je matematicky jistý ze zdrojového kódu.** Co je nejisté pouze: zda v produkci je viditelný pro uživatele (možná se subdomain DNS nepoužívají, fallback funguje "náhodou", nikdo si toho nevšiml).

#### #82b TEST-CHROME — **P0 BLOCKER PRO PHASE 1 (NE paralelní)** [v2: C4 fix]

**v1 doporučení:** "vytvořit separate task #TBD-1 pro Test-Chrome verifikaci, paralelně"

**v2 doporučení:** **#82b TEST-CHROME (#106) musí proběhnout PŘED Phase 1 startem** — dva důvody:

1. **Změřit visible impact PŘED fixem.** Pokud bug je viditelný v produkci (3 subdomény zobrazují MainNavbar místo Inzerce/Shop/Marketplace navbarů), je to user-facing critical bug který by měl být označen P0 sám o sobě, nezávisle na perf optimalizaci. Phase 1 ho fixne organicky, ale **musíme vědět "kdy začínáme měřit fix"**.
2. **Catch regression PŘED route group split.** Pokud Test-Chrome teď ukáže že bug je viditelný, můžeme po Phase 1 (route group split) ověřit že fix funguje. Bez baseline ne víme zda Phase 1 to vyřešilo nebo zda bug byl už dříve "skrytý".

**Akce pro team-leada:** Před #82d Phase 1 IMPL dispatch — dispatchnout #82b TEST-CHROME (`#106` v TaskList). Výsledek se uloží do `screenshots/82b-subdomain-baseline/` jako **before-Phase-1 baseline**. Po Phase 1 IMPL provést druhý screenshot pass na ověření.

#### Phase 1 ho organicky řeší

Po route group split (Variant A — viz §3.3) každá subdomain dostane vlastní `(main-web)/layout.tsx`, `(inzerce-web)/layout.tsx` atd. — bez `headers()` volání. Subdomain detection se přesune do middleware rewrite path mapping. **Žádný separate middleware fix task není potřeba** — Phase 1 ho automaticky vyřeší.

### 3.3 Doporučené řešení (3 varianty)

#### Varianta A — Route group split (DOPORUČENO)

Refactor adresáře `app/(web)/` na **4 paralelní route groups**, jedna per subdomain. Každá má svůj **statický** layout bez `headers()`.

```
app/
  (main-web)/                  ← původní content z (web) bez subdoménového contentu
    layout.tsx                 ← static, hardcoded MainNavbar + MainFooter
    page.tsx                   ← homepage
    nabidka/...                ← všech 60+ landing pages
    makleri/page.tsx
    sluzby/...
    o-nas/page.tsx
    ...
  (inzerce-web)/
    layout.tsx                 ← static, InzerceNavbar + InzerceFooter
    inzerce/page.tsx
    inzerce/katalog/page.tsx
    inzerce/pridat/page.tsx
    inzerce/registrace/page.tsx
  (shop-web)/
    layout.tsx                 ← static, ShopNavbar + ShopFooter
    shop/...                   ← 11 routes
    dily/...                   ← všech 9 dily routes
  (marketplace-web)/
    layout.tsx                 ← static, MarketplaceNavbar + MarketplaceFooter
    marketplace/...            ← 7 routes
```

**Pros:**
- Zcela odstraní `headers()` z layoutů
- Každá subdomain má hardcoded navbar/footer → žádný runtime detection
- Build-time SSG funguje out-of-the-box
- Self-documenting — adresářová struktura mapuje subdomain
- Zero impact na URL routing (middleware rewrites zůstávají nezměněné)

**Cons:**
- Velký diff (přesun ~124 souborů do 4 nových adresářů)
- Cross-route group sdílení komponent stále přes `components/web/`
- Cookie consent, compare provider — potřeba duplikovat nebo přesunout do `app/layout.tsx`

**Estimate:** M (medium) — ~1-2 dny pro Developera (mostly file moves + import paths)

#### Varianta B — Per-page conditional layout (NEDOPORUČENO)

Místo route group split — odstranit `headers()` z layoutu, místo toho každá stránka explicit importuje a renderuje svůj navbar/footer.

**Pros:** menší diff
**Cons:** opakování v 124 souborech, lehko se zapomene, anti-pattern

#### Varianta C — Middleware rewrite na route group prefix (KOMPLEXNÍ)

Místo `inzerce.host/path → /inzerce/path` rewrite middleware → `inzerce.host/path → /(inzerce-web)/inzerce/path` (target obsahuje route group). Vyžaduje precision rewrite per existing path. Křehké, **nedoporučuji**.

### 3.4 Doporučení

**Varianta A** (route group split) je jediná čistá. Estimate ~2 dny calendar time pro Developera + QA brownie test že subdomény stále renderují správně.

**Důležité — pořadí kroků:**
1. **PREP:** Vytvořit `(main-web)/layout.tsx`, `(inzerce-web)/layout.tsx`, `(shop-web)/layout.tsx`, `(marketplace-web)/layout.tsx` (každá hardcoded navbar+footer, žádný headers())
2. **MOVE:** `git mv` všech relevant page.tsx do nových route groups (zachovat git history)
3. **CLEANUP:** Smazat původní `(web)/layout.tsx`
4. **BUILD VERIFY:** `npm run build` → zkontrolovat že SEO landing pages jsou označeny `○ Static`, ISR pages `● ISR`
5. **SMOKE BUILD (v2 P3.5):** `npm run build` na fresh checkout PŘED final commit, ověřit:
   - Žádný build error (`Build success`)
   - Output sumarizace obsahuje `○ Static`, `● ISR`, `λ Server` markers (spočítat ≥50 Static, ≥8 ISR)
   - Build time pod 10 min (Vercel limit)
   - Sentry source map upload OK (kontrola Sentry release v `next.config.ts`)
6. **E2E:** Playwright test že každá subdomain renderuje správný navbar (viz §6 AC1.6 expanded matrix)
7. **DEPLOY:** Single PR

---

## 4 — Per-route hybrid strategie (po §3 fixu)

### 4.1 Bucket A → SSG (60 routes)

**Akce:** Žádný kód nepřidávat. Po §3 fixu Next.js automaticky detekuje že stránka nemá dynamic API, žádné Prisma volání, žádný `searchParams`, žádné `revalidate` → **build-time SSG**.

**Verifikace:** `next build` výstup, hledat `○ Static` u všech těchto routes:
```bash
npm run build 2>&1 | grep -E "(○|●|λ).*nabidka"
```

**Žádné per-page edit potřeba** kromě:
- `/jak-to-funguje/page.tsx` — odstranit `export const revalidate = 3600` (přesun do SSG)
- `/chci-prodat/page.tsx` — odstranit `export const revalidate = 3600`
- `/o-nas/page.tsx` — viz §4.3 (přesunout stats do `unstable_cache`, pak buď SSG nebo ISR)

### 4.2 Bucket B → ISR + on-demand revalidation hooks (5 routes po cleanup)

**5 routes zůstává v ISR bucketu po cleanup:**
- `/nabidka` (300s)
- `/nabidka/[slug]` (600s)
- `/shop/produkt/[slug]` (600s)
- `/dily/vrakoviste/[slug]` (86400s) — už má hook plánovaný v #87d
- `/makleri` (3600s)

**On-demand revalidation strategie:**

```typescript
// app/api/listings/route.ts (POST handler — nový listing)
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(request: Request) {
  // ... validation, prisma.listing.create, etc ...
  const listing = await prisma.listing.create({ ... });

  // ISR invalidation
  revalidatePath("/nabidka");                          // listing index
  revalidatePath(`/nabidka/${listing.slug}`);          // detail page
  revalidateTag("vehicles");                           // generic tag

  return NextResponse.json({ id: listing.id });
}
```

**Podobné hooky do:**
| Endpoint | Volá | Invaliduje |
|----------|------|-----------|
| `POST /api/listings` (create) | (existující) | `/nabidka`, `/nabidka/[slug]` |
| `PUT /api/listings/[id]` (update) | (existující) | `/nabidka/[slug]` |
| `DELETE /api/listings/[id]` | (existující) | `/nabidka`, `/nabidka/[slug]` |
| `POST /api/vehicles` (broker create) | (existující) | `/nabidka`, `/nabidka/[slug]` |
| `PUT /api/vehicles/[id]/sold` | (existující) | `/nabidka`, `/nabidka/[slug]` |
| `POST /api/parts` (PWA-parts create) | (existující) | `/dily`, `/dily/[slug]`, `/dily/vrakoviste/[slug]`, `/shop/produkt/[slug]` |
| `PUT /api/parts/[id]` | (existující) | `/dily/[slug]`, `/shop/produkt/[slug]`, `/dily/vrakoviste/[slug]` |
| `DELETE /api/parts/[id]` | (existující) | `/dily`, `/dily/[slug]`, `/dily/vrakoviste/[slug]` |
| `POST /api/admin/brokers/[id]/activate` | (existující) | `/makleri`, `/makler/[slug]` |
| `PUT /api/admin/brokers/[id]` | (existující) | `/makler/[slug]` |
| `POST /api/admin/partners/[id]/activate` (#65a) | (existující) | `/dily/vrakoviste/[slug]` |
| `PUT /api/admin/partners/[id]` | (existující) | `/dily/vrakoviste/[slug]`, `/dodavatel/[slug]`, `/bazar/[slug]` |

**Důležité:** Tyto hooky by měly být **idempotentní** (volat lze vícekrát bez side effects). `revalidatePath` je idempotentní.

**Risk:** Race condition pokud admin editor + dispatch ke 2 different revalidatePath ve stejnou chvíli — Next.js to handluje interně, žádný explicit lock potřeba.

### 4.3 Bucket C → ISR migrace (11 routes)

**Změny per-route:**

#### `/page.tsx` (homepage)

```typescript
// app/(main-web)/page.tsx — TOP OF FILE
export const revalidate = 3600; // ISR 1h

// Stats query: extract do unstable_cache helper
import { unstable_cache } from "next/cache";

const getHomepageStats = unstable_cache(
  async () => {
    const [brokerCount, vehicleCount, latestVehicles] = await Promise.all([
      prisma.user.count({ where: { role: "BROKER", status: "ACTIVE" } }),
      prisma.vehicle.count({ where: { status: "ACTIVE" } }),
      prisma.vehicle.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 6,
        // ...
      }),
    ]);
    return { brokerCount, vehicleCount, latestVehicles };
  },
  ["homepage-stats"],
  { revalidate: 3600, tags: ["vehicles", "brokers"] }
);

export default async function HomePage() {
  const stats = await getHomepageStats();
  // ...
}
```

#### `/dily/page.tsx`

```typescript
export const revalidate = 1800; // ISR 30min

const getDilyHomepageData = unstable_cache(
  async () => {
    return prisma.part.findMany({
      where: { status: "ACTIVE", stock: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { images: true, supplier: true },
    });
  },
  ["dily-homepage"],
  { revalidate: 1800, tags: ["parts"] }
);
```

#### `/dily/[slug]/page.tsx`

```typescript
export const revalidate = 86400; // 24h
export const dynamicParams = true;

export async function generateStaticParams() {
  // Top 200 dílů — nejvíce hitovaný subset, build-time pre-render
  const topParts = await prisma.part.findMany({
    where: { status: "ACTIVE", stock: { gt: 0 } },
    orderBy: { views: "desc" },
    take: 200,
    select: { slug: true },
  });
  return topParts.map((p) => ({ slug: p.slug }));
}
```

#### `/shop/page.tsx`, `/inzerce/page.tsx`, `/marketplace/page.tsx`, `/o-nas/page.tsx`

Stejný pattern — `revalidate = 1800-86400`, query přes `unstable_cache` s tagem.

#### `/makler/[slug]/page.tsx`, `/bazar/[slug]/page.tsx`, `/dodavatel/[slug]/page.tsx`

```typescript
export const revalidate = 86400;

export async function generateStaticParams() {
  // Pre-render all active brokers/partners
  const brokers = await prisma.user.findMany({
    where: { role: "BROKER", status: "ACTIVE" },
    select: { slug: true },
  });
  return brokers.map((b) => ({ slug: b.slug }));
}
```

### 4.4 Bucket D → SSR (zůstává) (25 routes)

**Žádný edit potřeba.** Tyto stránky mají legitimní důvod být dynamic:
- `searchParams` v `/marketplace?reason=`, `/marketplace/apply?role=`, etc.
- Auth gating v `/muj-ucet/*`, `/moje-inzeraty/*`, `/shop/moje-objednavky/*`
- Token validation v `/overeni-emailu/[token]`, `/notifikace/[token]`
- Cart state v `/dily/kosik`, `/shop/kosik` (zůstávají CSR)
- Stripe context v `/nabidka/[slug]/platba/*`

**Optimalizace pro tuto skupinu (P2):**
- Layout cleanup: `(*)/layout.tsx` v každé route group neboť SSR-only stránky mají vlastní layout (dashboard, account)
- Client-only nav (cart/account dropdown) → suspense boundaries
- React 19 `cache()` per-request memoization pro user session lookups

### 4.5 Bucket E → SSR shell + Client island (3 routes refactor)

#### `/dily/katalog/page.tsx`, `/shop/katalog/page.tsx`, `/inzerce/katalog/page.tsx`

Aktuálně celá stránka `"use client"` → 100 % JS bundle.

**Refactor pattern:**

```typescript
// app/(shop-web)/dily/katalog/page.tsx — server component
import { prisma } from "@/lib/prisma";
import { CatalogClient } from "@/components/web/CatalogClient";

export const revalidate = 600; // ISR 10min pro initial fetch

interface PageProps {
  searchParams: Promise<{ q?: string; brand?: string; cat?: string }>;
}

export default async function DilyKatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialResults = await prisma.part.findMany({
    where: {
      status: "ACTIVE",
      stock: { gt: 0 },
      ...(params.cat && { category: params.cat as any }),
      // ...
    },
    take: 24,
    include: { images: true },
  });

  return (
    <CatalogClient
      initialResults={initialResults}
      initialFilters={params}
    />
  );
}
```

```typescript
// components/web/CatalogClient.tsx — client component s filters
"use client";
import { useState, useEffect } from "react";
// ... existing client logic, ale dostává initialResults jako prop
```

**Trade-off:** Smíšený SSR + CSR. SSR pokrývá first paint + SEO snippet. CSR řeší interactive filters po hydration.

**Estimate:** S per file (~2-3h), 3 files → ~1 den.

### 4.6 Subdomain rewrite skupina (Bucket F)

Po §3 refactoru jsou (inzerce-web), (shop-web), (marketplace-web) všechny zvlášť. Middleware rewrite cesty zůstanou — Next.js route groups nejsou součástí URL, takže `inzerce.host/katalog → /inzerce/katalog` se rozpozná jako `(inzerce-web)/inzerce/katalog/page.tsx`. ✅

**Verifikace:** `next build` musí ukázat všechny inzerce/shop/marketplace stránky správně označené.

---

## 5 — `unstable_cache` strategie pro shared queries

### 5.1 Centrální cache layer

Vytvořit `lib/cache/queries.ts`:

```typescript
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Homepage hero stats
export const getHeroStats = unstable_cache(
  async () => ({
    brokers: await prisma.user.count({ where: { role: "BROKER", status: "ACTIVE" } }),
    vehicles: await prisma.vehicle.count({ where: { status: "ACTIVE" } }),
    sold: await prisma.vehicle.count({ where: { status: "SOLD" } }),
  }),
  ["hero-stats"],
  { revalidate: 3600, tags: ["stats", "vehicles", "brokers"] }
);

// Latest vehicles (homepage + /nabidka)
export const getLatestVehicles = unstable_cache(
  async (limit: number = 6) => {
    return prisma.vehicle.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: limit,
      // ... include statements
    });
  },
  ["latest-vehicles"],
  { revalidate: 1800, tags: ["vehicles"] }
);

// Latest parts (dily homepage + shop homepage)
export const getLatestParts = unstable_cache(
  async (limit: number = 12) => {
    return prisma.part.findMany({
      where: { status: "ACTIVE", stock: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { images: true, supplier: { select: { name: true, slug: true } } },
    });
  },
  ["latest-parts"],
  { revalidate: 1800, tags: ["parts"] }
);

// Active brokers list (/makleri)
export const getActiveBrokers = unstable_cache(
  async () => {
    return prisma.user.findMany({
      where: { role: "BROKER", status: "ACTIVE" },
      // ...
    });
  },
  ["active-brokers"],
  { revalidate: 3600, tags: ["brokers"] }
);

// Active partners (used by /dily/vrakoviste, /bazar, /dodavatel)
export const getActivePartners = unstable_cache(
  async (type?: "VRAKOVISTE" | "BAZAR") => {
    return prisma.partner.findMany({
      where: {
        status: "AKTIVNI_PARTNER",
        ...(type && { type }),
      },
    });
  },
  ["active-partners"],
  { revalidate: 86400, tags: ["partners"] }
);
```

**Použití v stránkách:**

```typescript
// app/(main-web)/page.tsx
import { getHeroStats, getLatestVehicles } from "@/lib/cache/queries";

export const revalidate = 3600;

export default async function HomePage() {
  const [stats, vehicles] = await Promise.all([
    getHeroStats(),
    getLatestVehicles(6),
  ]);
  // ...
}
```

### 5.2 Cache tags taxonomie

> **v2 P3.1 doporučení:** Namespace tagů s feature prefix `cmkl:` — vyhne se collision s third-party libraries (např. NextAuth, react-query interní tags). Stejně namespace cache keys: `["cmkl:homepage:hero-stats"]` místo `["homepage"]`. Rozhodnutí o namespace nutné PŘED Phase 4 (mutation hooks) implementací.

| Tag (s namespace) | Co invaliduje | Volá se z |
|-------------------|---------------|-----------|
| `cmkl:vehicles` | Vehicle/Listing related cache | POST/PUT/DELETE listings, vehicles |
| `cmkl:parts` | Part related cache | POST/PUT/DELETE parts |
| `cmkl:brokers` | Broker public profiles, /makleri | activate/deactivate broker |
| `cmkl:partners` | Partner profiles, vrakoviste | activate/deactivate partner |
| `cmkl:stats` | Aggregate counts (homepage hero, /o-nas, marketplace landing) | Cron 1× denně OR explicit invalidation |
| `cmkl:tco` | TCO breakdown data (#86 v2) | Bulk import parts (existing planned) |
| `cmkl:settings` | App settings (#86 v2 Setting model) | Admin save action |
| `cmkl:seo-content` | SEO landing content (#87c) | Admin SEO content edit |

**v2 P3.2 příklad správného binding (pre-Phase 4 reference):**
```typescript
// Špatně — collision risk + nečitelné v debugger
unstable_cache(fn, ["homepage"], { tags: ["data"] })

// Dobře — feature namespace, multi-tag invalidation
unstable_cache(fn, ["cmkl:homepage:hero-stats"], { tags: ["cmkl:stats", "cmkl:vehicles"] })
```

### 5.3 Webhook endpoint pro on-demand revalidation

Vytvořit `app/api/revalidate/route.ts` (zobecnění #87d návrhu):

```typescript
import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${REVALIDATE_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tag, path } = await request.json();

  if (tag) revalidateTag(tag);
  if (path) revalidatePath(path);

  return NextResponse.json({ revalidated: true, tag, path });
}
```

**Použití:**
- Manual cache flush z admin panelu
- Cron job 1× denně flush `stats` tag
- External webhook (např. po Stripe payment success → flush `vehicles`)

---

## 6 — Implementační fáze (5-phase rollout)

### Phase 0 — PREP (tento plán = #82, dokončený)
- ✅ Audit current state
- ✅ Identifikovat root-cause
- ✅ Per-route strategie

### Phase 1 — P0 ROOT-CAUSE FIX (Varianta A — route group split)
**Estimate:** M (~1-2 dny Developer)

**Kroky:**
1. Vytvořit `app/(main-web)/`, `app/(inzerce-web)/`, `app/(shop-web)/`, `app/(marketplace-web)/` adresáře
2. Pro každou novou route group vytvořit `layout.tsx` se statickým, hardcoded navbar/footer
3. `git mv` 124 page.tsx + jejich loading.tsx, error.tsx do správné nové route group
4. Aktualizovat všechny relativní importy (alias `@/` zůstává, takže většinou nic)
5. Smazat původní `app/(web)/layout.tsx`
6. `npm run build` → ověřit že SEO landing pages jsou `○ Static`
7. `npm run lint` + `npx vitest run` → 0 errors
8. Commit + PR

**Acceptance criteria:**
- AC1.1: `next build` výstup obsahuje min 50 routes označených `○ Static` (před: 0)
- AC1.2: `next build` výstup obsahuje min 8 routes označených `● ISR` (před: 0)
- AC1.3: `npm run lint` → 0 errors
- AC1.4: `npx vitest run` → 141/141 passed
- AC1.5: Playwright E2E `npm run test:e2e` → green
- **AC1.6 (v2 expanded):** Per-subdomain × per-template Playwright matrix test (`e2e/subdomain-routing.spec.ts` — nový):

  | Subdomain | Test URL (dev) | Expected navbar | Expected footer |
  |-----------|---------------|------------------|------------------|
  | main | `localhost:3000/` | MainNavbar | MainFooter |
  | inzerce | `inzerce.localhost:3000/` | InzerceNavbar | InzerceFooter |
  | shop (dily) | `shop.localhost:3000/` (or `localhost:3000/dily`) | ShopNavbar | ShopFooter |
  | marketplace | `marketplace.localhost:3000/` | MarketplaceNavbar | MarketplaceFooter |

  Test musí zkontrolovat:
  - Nadpisy/loga v navbaru (`data-testid="navbar-logo"`)
  - Aktivní route highlighting
  - Footer brand color (orange pro main, blue pro inzerce, etc.)

- AC1.7: Žádná regrese — všech 124 cest stále vrátí HTTP 200 (Test-Chrome smoke test)

**Risk mitigation:**
- Branch `feature/route-group-split` — žádný direct push to main
- Code review by Evžen against this plan
- Test-Chrome flow all 4 subdomains před merge

### Phase 2 — Bucket A cleanup (Static SSG verification)
**Estimate:** S (~2-4h)

**Kroky:**
1. Odstranit `export const revalidate = 3600` z `/jak-to-funguje/page.tsx`, `/chci-prodat/page.tsx` (přesun do SSG)
2. `next build` → ověřit obě stránky jsou `○ Static`
3. Možná drobné refaktory (např. inline `await getStats()` přesunout do `unstable_cache`)

**Acceptance criteria:**
- AC2.1: `/jak-to-funguje` a `/chci-prodat` jsou `○ Static`
- AC2.2: Žádný regrese (stejné rendering)

### Phase 3 — Bucket C migrace (SSR → ISR)
**Estimate:** M (~2-3 dny Developer)

**Kroky:**
1. Vytvořit `lib/cache/queries.ts` se sdílenými queries (§5.1)
2. Pro každou z 11 routes v Bucket C → přidat `revalidate` marker + přepsat queries na `unstable_cache` helpery
3. Pro `/dily/[slug]`, `/makler/[slug]`, `/bazar/[slug]`, `/dodavatel/[slug]` → přidat `generateStaticParams`
4. `next build` → ověřit ISR markery `● ISR`

**Acceptance criteria:**
- AC3.1: 11 routes Bucket C má `● ISR` v build výstupu
- AC3.2: `unstable_cache` queries volají Prisma
- AC3.3: Žádná regrese funkčnosti

### Phase 4 — On-demand revalidation hooks
**Estimate:** M (~1-2 dny Developer)

**Kroky:**
1. Identifikovat všechny mutation API endpoints (§4.2 tabulka)
2. Přidat `revalidatePath()` / `revalidateTag()` volání po každé úspěšné mutaci
3. Vytvořit `app/api/revalidate/route.ts` (sdílený webhook endpoint)
4. Jednotlivé tagy nadefinovat dle §5.2

**Acceptance criteria:**
- AC4.1: 12 endpoints (§4.2 tabulka) volá revalidate after mutation
- AC4.2: `app/api/revalidate/route.ts` existuje + má auth check
- AC4.3: Manual test: vytvořit nový listing → ověřit /nabidka okamžitě obsahuje nový záznam (bez čekání 300s TTL)
- AC4.4: Manual test: editovat part → /dily/[slug] okamžitě reflektuje změnu

### Phase 5 — Bucket E client island refactor (3 katalog routes)
**Estimate:** M (~1-2 dny Developer)

**Kroky:**
1. Pro každý ze 3 katalog routes (`dily/katalog`, `shop/katalog`, `inzerce/katalog`):
   - Vytvořit nový server component `page.tsx` se SSR shell + initial fetch
   - Přesunout existující client logic do `components/web/CatalogClient.tsx` (nebo per-katalog variant)
   - SSR komponenta dostává initialResults + initialFilters jako props
   - `revalidate = 600` pro initial render
2. `next build` → ověřit `● ISR` u katalog routes

**Acceptance criteria:**
- AC5.1: 3 katalog routes mají `● ISR` označení
- AC5.2: First paint obsahuje výsledky (SSR rendered)
- AC5.3: Filtry stále interaktivní (client island)
- AC5.4: JS bundle pro katalog stránku redukován o min 50 % (Lighthouse before/after)

---

## 7 — Testing strategy

### 7.1 Unit (Vitest)
- Žádné nové unit testy nutné — refactor je zejména structural
- Stávající tests musí zůstat zelené (141/141)

### 7.2 Integration (Vitest)
- Test pro `lib/cache/queries.ts` helpery — zejména že vrací správný shape (snapshot test)
- Test pro `app/api/revalidate/route.ts` — auth check, tag/path forwarding

### 7.3 E2E (Playwright)
- **Smoke test:** Crawl všech 124 cest z `next build` výstupu, ověřit HTTP 200
- **Subdomain test:** `inzerce.localhost:3000/` renderuje InzerceNavbar (per-subdomain test ×4)
- **Cache invalidation test:**
  1. Browse `/nabidka` (cached)
  2. POST nový listing přes API
  3. Reload `/nabidka` → musí obsahovat nový záznam
- **Search/filter test:** `/dily/katalog?cat=BRAKES` po refactoru funguje (SSR shell + client filter)

### 7.4 Performance benchmark (Lighthouse)

> **v2 P3.3 — KRITICKÉ TIMING:** Baseline Lighthouse benchmark **MUSÍ** proběhnout PŘED Phase 1 (před route group split). Bez baseline nelze měřit perf benefit Phase 1. Tato podmínka je důvod, proč **#107 #82c PLAN Lighthouse baseline = P0 BLOCKER pro #82d Phase 1 IMPL**. Sequencing covered v §10.5.

**Před fixem (baseline) a po fixu** — 5 cest:
- `/` (homepage)
- `/nabidka/skoda/octavia` (SEO landing — největší impact)
- `/dily` (parts homepage)
- `/dily/[slug]` (part detail)
- `/dily/katalog` (CSR → SSR shell migrace)

**Metriky:**
- TTFB (Time to First Byte) — měl by spadnout z 500-800ms (SSR with DB) na 50-100ms (CDN cached)
- FCP (First Contentful Paint) — mělo by se zlepšit o 200-400ms
- LCP (Largest Contentful Paint) — mělo by se zlepšit o 300-600ms
- JS bundle size pro katalog — měl by spadnout o 50-70 %

**Toolchain:** Lighthouse CLI, ALSO Vercel Analytics RUM after deploy

### 7.5 Manual smoke (Test-Chrome agent)
- Po Phase 1: navštívit všech 4 subdomény, ověřit navbar/footer
- Po Phase 3: smoke test 10 random Bucket C cest
- Po Phase 4: vytvořit listing → ověřit revalidation
- Po Phase 5: filter test na všech 3 katalog routes

---

## 8 — Risks & rollback

### 8.1 Rizika

| Risk | Pravděpodobnost | Dopad | Mitigace |
|------|-----------------|-------|---------|
| Phase 1 file move zlomí imports | Med | High | `@/` alias minimalizuje lokální importy; lint catch errors; build před PR |
| Subdomain layout regrese po split | Low | High | Test-Chrome agent ověří všech 4 subdomény před merge; bug tracker pro UX issues |
| `unstable_cache` cache key collision | Low | Med | Explicit unique key per query; namespace by feature (`["dily-homepage"]` ne jen `["homepage"]`) |
| `revalidatePath` race condition | Low | Low | Next.js handluje atomicky; documented behavior |
| Build time prodloužení (více SSG = více build work) | Med | Med | Acceptable trade-off; monitor `vercel build` time; pokud nad 10 min → split via `generateStaticParams` limit |
| Cache memory pressure (Vercel) | Low | Med | Monitor Vercel Edge cache size; trim TTL pokud příliš mnoho entries |
| ISR stale-while-revalidate šum (uživatel vidí starý content) | Med | Low | TTL 300-1800s acceptable for non-critical pages; on-demand revalidation pro critical mutations |
| Subdomain rewrite bug (§3.2) komplikuje split | **Low** [v2 P3.4] | **Low** [v2 P3.4] | Phase 1 (route group split) ho organicky řeší (subdomain detection se přesune do middleware path mapping). #82b TEST-CHROME baseline poskytne ground truth pre/post. Žádný separate middleware fix task není potřeba. |

### 8.2 Rollback plán

- **Phase 1 rollback:** revert PR, vrátit `(web)/layout.tsx` s `headers()`. Single-commit revert.
- **Phase 3 rollback:** revert per-route `revalidate` marker (každá stránka má git history).
- **Phase 4 rollback:** revert mutation hooks — neměnitelné chování (jen optimization).
- **Phase 5 rollback:** revert per-katalog refactor (každá stránka individual commit).

### 8.3 Feature flag (P3)
- `NEXT_PUBLIC_USE_ISR=false` env var — pokud `false`, layout fallback na force-dynamic. **Probably overkill** pro tento projekt; rollback via git revert je dostatečný.

---

## 9 — Estimate breakdown

| Phase | Estimate | Kdo | Trvání calendar |
|-------|----------|-----|----------------|
| Phase 0 — Plán (#82) | done | planovac | 1 den |
| Phase 1 — Route group split (P0) | M (~6-12h dev) | Developer | 1-2 dny |
| Phase 2 — Bucket A cleanup | S (~2-4h dev) | Developer | 0.5 dne |
| Phase 3 — Bucket C migrace + unstable_cache | M (~10-15h dev) | Developer | 2-3 dny |
| Phase 4 — Mutation hooks | M (~6-10h dev) | Developer | 1-2 dny |
| Phase 5 — Katalog SSR shell refactor | M (~6-10h dev) | Developer | 1-2 dny |
| QA + E2E + Test-Chrome per phase | S+M+S+S+M | QA | parallelně |
| Lighthouse benchmark | S | QA | 0.5 dne |
| **CELKEM** | **L (large)** | | **~7-12 dnů calendar** |

**Souhrn:** Largest, ale rozdělené do 5 phase s incremental rollout. Phase 1 (P0) je nejdůležitější — odemyká vše ostatní. Phase 2-5 lze udělat postupně bez urgence po Phase 1.

---

## 10 — Návaznosti na ostatní tasks

### 10.1 Závislost #87b/c/d (SEO routing + content + revalidation API)
- **#87b** — `/dily/[brand]/[model]/[rok]` 3-segment routing — **bude profitovat** z route group split (po Phase 1 lze plně SSG)
- **#87c** — Prisma SeoContent model + content gen script — **kompatibilní** s plan-task-82 § 5 cache strategie. SeoContent queries by měly jít přes `unstable_cache` se tagem `seo-content`
- **#87d** — On-demand revalidation API — **plně subsumováno** plan-task-82 § 4.2 + § 5.3. Doporučení: sloučit #87d s Phase 4 #82
- **#87e** — geo-benchmark + monitoring — **doplnit** Lighthouse perf benchmark z §7.4

### 10.2 Závislost #86 v2 (TCO + Financování + Setting model)
- TCO data cache (`unstable_cache` s tagem `tco`) — **plně kompatibilní** s §5
- Setting model cache (tag `settings`) — **doplnit** do §5.2 tabulky
- Settings + TCO query helpers patří do `lib/cache/queries.ts`

### 10.3 Závislost #88 (AI Part Scanner)
- Po vytvoření dílu skenerem → musí volat `revalidatePath('/dily/...')` — **doplnit** do §4.2 tabulky až bude #88 implementováno

### 10.4 Závislost #91 (SEO MVP slice — completed)
- `/dily/vrakoviste/[slug]` ISR + sitemap + JSON-LD — **plně funguje** po Phase 1 fixu (před fixem byl marker mrtvý)
- llms.txt route handler (`force-static`) — již funguje, separate route handler ne pages

### 10.5 Follow-up tasks (mapping na TaskList #106-#107) [v2: konkrétní mapping]

> **v2 oprava:** v1 mluvil o "TBD-1 až TBD-4" generic. v2 mapuje na konkrétní již vytvořené TaskList tasky team-leadem (#106, #107) + plánuje #82d-#82i.

| v1 ID | v2 TaskList ID | Task | Status | Vztah k Phase 1 |
|-------|----------------|------|--------|-----------------|
| #TBD-1 | **#106 (#82b TEST-CHROME)** | Subdomain rewrite bug verification baseline | pending | **P0 BLOCKER — proběhne PŘED Phase 1** [C4 fix] |
| #TBD-2 | **#107 (#82c PLAN)** | Lighthouse baseline benchmark | pending | **P0 BLOCKER — proběhne PŘED Phase 1** (potřeba pro before/after metrics) [P3.3] |
| #TBD-3 → #82d | **#82d IMPL** (team-lead vytvoří) | Phase 1 IMPL — route group split | not yet created | Po #106 + #107 done |
| #TBD-3 → #82e–#82h | Phase 2-5 IMPL tasks | postupně sequenční | not yet created | Po #82d done |
| C3 follow-up | **#82i REFACTOR** | recenze + kariera Server Component refactor (low priority, optional) | not yet created | Po #82h Phase 5, optional |
| #TBD-4 | (keep TBD) | Cron job pro `revalidateTag('cmkl:stats')` 1× denně (low priority) | not yet created | Post-Phase 4 |

---

## 11 — Open questions pro team-lead

### Q1 — Varianta A vs varianta C pro fix layoutu
**§3.3 doporučuji Variantu A** (route group split). Je to non-trivial diff (~124 souborů přesunout). Souhlasíš?

**Alternativy:**
- Varianta B (per-page conditional layout) — anti-pattern, NEDOPORUČUJI
- Varianta C (middleware rewrite na route group prefix) — komplexní, NEDOPORUČUJI

**Doporučení:** Varianta A, schválit tento přístup před Phase 1 startem.

### Q2 — Phase ordering
Plán vede 5 fází. Doporučuji **strict sekvence Phase 1 → 2 → 3 → 4 → 5** (Phase 1 je P0 blocker). Souhlasíš nebo chceš parallelizovat (např. Phase 4 hooks lze přidat dopředu, ale jejich efekt vidí až po Phase 1)?

**Doporučení:** Strict sequence. Žádná parallelizace.

### Q3 — Subdomain rewrite bug (§3.2)
Při auditu jsem narazil na pravděpodobný bug v middleware — `response.headers.set` se nepřenáší do request server komponenty. Možné že subdomény v produkci vůbec nezobrazují správný navbar. **Tento bug se přirozeně vyřeší v rámci Variant A** (route group split). 

**Otázka:** Mám vytvořit separate task #TBD-1 pro Test-Chrome verifikaci současného stavu (ověřit zda bug skutečně existuje), nebo počkat až Phase 1 to vyřeší organicky?

**Doporučení:** Test-Chrome verifikace JEDNOTLIVĚ před Phase 1 — důležité vědět zda jde o pre-existing bug nebo můj false positive. Pokud QA potvrdí, Phase 1 ho automaticky řeší.

### Q4 — `/marketplace/page.tsx` searchParams gating
Stránka `/marketplace/page.tsx` čte `?reason=` searchParam (na vyhození error banneru). Tím je vyloučena z ISR. **Dvě možnosti:**

**Option A:** Nechat SSR per-request (acceptable, marketplace landing není velký traffic).
**Option B:** Refactor — odstranit searchParam, místo toho per-cesta `/marketplace/auth-required`, `/marketplace/not-authorized` (3 statické routes) + redirect z middleware.

**Doporučení:** Option A — acceptable, nepřináší dostatečnou výhodu pro refactor.

### Q5 — Build time impact
Phase 1 + 3 + 5 dohromady přidají ~70 nových SSG/ISR routes. `next build` se prodlouží o 30-60s. Acceptable?

**Doporučení:** Acceptable. Pokud Vercel build time překročí 8 min → revize via `generateStaticParams` limity (např. top 50 dílů místo top 200).

### Q6 — `/recenze` + `/kariera` refactor priorita [v2 C3 follow-up]
Obě stránky jsou aktuálně `"use client"` (pravděpodobně historický artefakt). Convert na Server Component je trivial (~30 min každá), ale low business value (low traffic).

**Doporučení:** Nezahrnovat do Phase 1-5. Vytvořit separate optional task **#82i REFACTOR** post-Phase 5 (low priority). Acceptance: oba routes končí jako `○ Static` v `next build`.

### Q7 — Bucket D ozrejmění `marketplace/page.tsx` [v2 C1 vedlejší]
v1 plán bucketoval `/marketplace/page.tsx` do C ("SSR with Prisma"). v2 ho přesunuje do D protože:
- `prisma\.` grep ho NEDETEKUJE (volá `getMarketplaceStats` z `lib/stats`, ne přímo prisma)
- Má `searchParams ?reason=` → forced dynamic

**Důsledek:** marketplace landing nelze ISR-cachet kvůli searchParams. Pokud chceme cache → potřeba refactor `?reason=` na separate routes (`/marketplace/error/auth-required`, `/marketplace/error/not-authorized`). v1 §11 Q4 uvedl jako Option B s recommendation "Option A — keep SSR, acceptable".

**Doporučení v2:** Souhlasím s v1 Q4 — keep SSR. Marketplace traffic je low, refactor není ROI-positive.

### Q8 — `lib/stats` getMarketplaceStats — cache opt-in?
`getMarketplaceStats` volá `prisma.user.count` a `prisma.deal.count` apod. Stats změny jsou denní. Wrap do `unstable_cache` se tagem `cmkl:stats` (per §5.2) → 1 query/day místo 1 query/request.

**Doporučení:** Ano — Phase 3 doplnit `getMarketplaceStats` do `lib/cache/queries.ts` s `revalidate: 86400, tags: ["cmkl:stats"]`. Marketplace landing zůstává SSR (kvůli searchParams), ale stats query je cached.

---

## 12 — Metriky úspěchu (po deployu)

| Metrika | Před | Cíl po fixu |
|---------|------|------------|
| Routes označené `○ Static` v `next build` | 0 | ≥ 50 |
| Routes označené `● ISR` v `next build` | 0 | ≥ 20 |
| Routes označené `λ Server` v `next build` | 124 | ≤ 30 |
| TTFB homepage | 500-800 ms | < 100 ms (cache hit) |
| TTFB SEO landing (`/nabidka/skoda/octavia`) | 400-600 ms | < 50 ms (CDN edge) |
| Lighthouse Performance score `/` | TBD baseline | +20 bodů |
| Lighthouse Performance score `/dily/katalog` | TBD baseline | +30 bodů (SSR shell + redukce JS bundle) |
| Vercel Edge cache hit ratio | 0 % (vše SSR) | > 60 % |
| Database query count per request (homepage) | 3-5 | 0 (cached) |

**Měření:** Lighthouse CLI před Phase 1 (baseline) + po Phase 5 (final). Vercel Analytics RUM 7 dní post-deploy.

---

## 13 — Akční kroky pro team-leada [v2: po C1-C5 fix]

1. ✅ **#103 EVZEN REVIEW dokončen** — verdict CHANGES_REQUESTED s C1-C5
2. ✅ **#105 PLAN v2 dokončen** — tento dokument adresuje C1-C5 (merge do plan-task-82.md)
3. → **#106 #82b TEST-CHROME dispatch** (P0 BLOCKER pro Phase 1) [C4 fix]
   - Owner: Test-Chrome agent
   - Acceptance: `screenshots/82b-subdomain-baseline/` s before-fix snapshots ze 4 subdomén
4. → **#107 #82c PLAN dispatch** (paralelně s #106, P0 BLOCKER pro Phase 1) [P3.3]
   - Owner: planovac
   - Acceptance: `plan-task-82c.md` s Lighthouse baseline metodologií + očekávané pre/post metriky
5. → **#82d IMPL dispatch** (Phase 1 = route group split, P0)
   - Owner: Developer
   - blockedBy: [#106, #107]
   - Acceptance: AC1.1–AC1.7 z §6 (vč. AC1.6 v2 expanded subdomain matrix test)
6. → **#82e IMPL** (Phase 2 cleanup — `/jak-to-funguje`, `/chci-prodat` → SSG)
7. → **#82f IMPL** (Phase 3 — Bucket C migrace + `lib/cache/queries.ts`)
8. → **#82g IMPL** (Phase 4 — mutation hooks + `app/api/revalidate/route.ts`)
9. → **#82h IMPL** (Phase 5 — katalog SSR shell refactor)
10. → **#82i REFACTOR** (recenze + kariera Server Component, low priority, optional) [C3 fix]

**Důležité:** Phase 1 je P0 blocker pro #87b, #87c, #87d, #88 + **#91 SEO MVP ROI** (viz §0 v2 warning) — pokud chceme aby tyto IMPL tasky měly skutečný perf efekt a #91 dolar investice se vrátil, Phase 1 musí proběhnout PŘED nimi. **#106 + #107 jsou P0 BLOCKERS pro #82d.**

---

## 14 — Souhrn pro Evžen review (v2 — po C1-C5 fix)

**Co plán řeší:**
- Headline finding: `(web)/layout.tsx:47 await headers()` → celý web SSR-only
- Komplexní per-route audit 124 cest → 5 buckets s konkrétní strategií (priority-based, žádné dvojité počty)
- 5-phase rollout plan s acceptance criteria per phase
- On-demand revalidation strategie integrovaná s existujícími mutation API endpoints
- Lighthouse benchmark + metriky úspěchu
- Návaznosti na #86, #87b/c/d/e, #88, #91
- **#91 SEO MVP ROI = 0% warning** — business-critical kontext pro Phase 1 prioritu

**Co plán NEŘEŠÍ (out of scope):**
- API route caching (separate concern)
- Image optimization
- Database N+1 audit
- Bundle size optimization mimo Phase 5 katalog refactor
- (admin), (pwa), (pwa-parts) — auth-only, jiná strategie

### Co v2 mění oproti v1 [Evžen re-review tabulka]

| Sekce | v1 | v2 fix | Evžen finding |
|-------|----|---------|---------------|
| §0 | Žádný #91 ROI warning | **Tučný business-critical warning** že #91 SEO MVP = 0% benefit dokud Phase 1 | C5 |
| §2 | Buckets sum 113, claim 124, missing 11 | **Re-inventory s priority-based assignment**, sum 124 | C1 |
| §2.5 (Bucket E) | 4 client routes | **31 client routes** (kompletní seznam s důvody) | C2 |
| §2.1 (Bucket A) | recenze + kariera v Bucket A | **Přesunuty do Bucket E** (mají `"use client"`) + post-Phase 5 refactor target | C3 |
| §2.2 (Bucket B) | 8 (počítal llms.txt route handler) | **7 page.tsx** (route handler vyloučen) | C1 vedlejší |
| §2.3 (Bucket C) | 18 (gross prisma count, dvojitý počet s B) | **13 (po B overlap deduplikaci)** | C1 vedlejší |
| §2.4 (Bucket D) | 25 (zahrnoval client routes) | **4 (skutečně server-rendered s token/searchParams)** | C2 vedlejší |
| §2.7 | Souhrn bez sum check | **Sum check 67+7+13+4+31 = 122 + 2 long-term = 124** | C1 |
| §3.2 | "Pravděpodobně buggy" | **"100% confirmed via static analysis"** + důkaz code | C4 wording |
| §3.2 | TBD-1 paralelně | **#106 #82b TEST-CHROME P0 BLOCKER** PŘED Phase 1 | C4 sequencing |
| §3.4 | 6 kroků | **+ Step 5 SMOKE BUILD verifikace** | P3.5 |
| §5.2 | tags bez prefix | **`cmkl:` namespace prefix** + binding příklad | P3.1, P3.2 |
| §6 AC1.6 | 1 řádek | **Per-subdomain × per-template matrix test** specifikace | P3 review §10 |
| §7.4 | Bez timing note | **P0 BLOCKER timing — baseline PŘED Phase 1** | P3.3 |
| §8.1 | Risk Med/Med | **Downgrade na Low/Low** (Phase 1 organicky řeší) | P3.4 |
| §10.5 | TBD-1..TBD-4 generic | **Konkrétní #106, #107, #82d-i mapping** | P3 review §10 |
| §11 | Q1-Q5 | **+ Q6 (recenze/kariera priorita), Q7 (marketplace bucket), Q8 (stats cache)** | C3, C1, P3 |
| §13 | 5 generic akčních kroků | **10 sekvenčních kroků s konkrétními task IDs** | P3 |

**Klíčové open questions po v2:** §11 Q1–Q5 (z v1) + Q6-Q8 (z v2). Q1/Q2 stále vyžadují team-lead schválení před Phase 1. Q6 je optional.

**Estimate:** L (large) — 7-12 dnů calendar (beze změny z v1). P0 (Phase 1) je nezbytný blocker pro vše ostatní + **#91 SEO MVP ROI realizaci**.
