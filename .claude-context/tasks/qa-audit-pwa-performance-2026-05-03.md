# QA Audit: PWA Offline + Performance + Bundle

**Autor:** Evžen (READ-ONLY verifikační agent)
**Datum:** 2026-05-03
**Task:** #13

---

## 1. Service Worker (Serwist)

**Soubor:** `app/sw.ts`

| Aspekt | Stav | Poznámka |
|--------|------|----------|
| Precaching | ✅ OK | `self.__SW_MANIFEST` — Serwist automaticky generuje manifest |
| skipWaiting | ✅ OK | Okamžitá aktivace nové verze SW |
| clientsClaim | ✅ OK | Nový SW převezme všechny klienty |
| navigationPreload | ✅ OK | Zrychlení navigation requests |
| Runtime caching | ✅ OK | `defaultCache` z @serwist/next/worker |
| Background Sync: contacts | ✅ OK | Plně implementováno — čte pendingActions z IDB, POSTuje na /api/contacts/sync, maže po úspěchu |
| Background Sync: vehicles | ⚠️ STUB | Jen `console.log("[SW] Background sync: vehicles")` — žádná implementace |
| Background Sync: images | ⚠️ STUB | Jen `console.log("[SW] Background sync: images")` — žádná implementace |
| Background Sync: contracts | ⚠️ STUB | Jen `console.log("[SW] Background sync: contracts")` — žádná implementace |
| SW disable v dev | ✅ OK | `disable: process.env.NODE_ENV === "development"` v next.config.ts |

### Findings:

- **⚠️ WARNING-1:** 3 ze 4 background sync handlerů (`sync-vehicles`, `sync-images`, `sync-contracts`) jsou prázdné stuby — jen console.log. Pokud PWA registruje tyto sync taky, data se nikdy nesynchornizují.
- **✅ GOOD:** syncContacts() je korektně implementován — otevírá IDB přímo (bez idb wrapperu, správně pro SW kontext), čte pending actions, POSTuje, maže po úspěchu, error handling přes try/catch.

---

## 2. Offline podpora (IndexedDB)

**Soubor:** `lib/offline/db.ts`

| Store | KeyPath | Indexy | Účel |
|-------|---------|--------|------|
| drafts | id | by-updatedAt | Offline rozpracovaná vozidla |
| vehicles | id | by-syncedAt | Lokální cache vozidel |
| pendingActions | id | by-type, by-createdAt | Fronta pro background sync |
| images | id | by-draftId | Offline fotky k draftům |
| contacts | id | by-name, by-phone, by-nextFollowUp | Offline kontakty makléře |
| vinCache | vin | (žádné) | Cache VIN dekódování |
| equipmentCatalog | id | by-category | Katalog výbavy |
| contracts | id | by-vehicleId, by-status | Offline smlouvy |

### Findings:

- **✅ GOOD:** 8 object stores s rozumnými indexy pro offline-first workflow
- **✅ GOOD:** DB verze 3 s korektním upgrade path (kontroluje oldVersion < 3)
- **✅ GOOD:** Singleton pattern (`dbPromise`) — žádné duplicitní otevírání
- **✅ GOOD:** Typed schema (CarmaklerDB extends DBSchema) — type-safe přístup
- **⚠️ WARNING-2:** Žádný TTL/cleanup mechanismus pro vinCache — může neomezeně růst
- **⚠️ WARNING-3:** pendingActions store nemá `maxRetries` enforcement — retries field existuje, ale žádný kód nekontroluje limit

---

## 3. PWA Manifest

**Soubor:** `public/manifest.json`

| Pole | Hodnota | Stav |
|------|---------|------|
| name | "CarMakléř Pro" | ✅ OK |
| short_name | "CarMakléř" | ✅ OK |
| start_url | "/makler/dashboard" | ✅ OK |
| display | "standalone" | ✅ OK |
| background_color | "#F9FAFB" | ✅ OK |
| theme_color | "#F97316" | ✅ OK (brand orange) |
| orientation | "portrait" | ✅ OK |
| scope | "/" | ✅ OK (celá app) |
| lang | "cs" | ✅ OK |
| icons 192 | /icons/icon-192.png | ✅ EXISTS (6.3 KB) |
| icons 512 | /icons/icon-512.png | ✅ EXISTS (29.4 KB) |
| icons maskable 192 | /icons/icon-maskable-192.png | ✅ EXISTS (6.3 KB) |
| icons maskable 512 | /icons/icon-maskable-512.png | ✅ EXISTS (29.4 KB) |
| categories | ["business", "lifestyle"] | ✅ OK |

### Findings:

- **✅ GOOD:** Kompletní manifest se všemi povinnými poli
- **✅ GOOD:** 4 ikony — regular + maskable v 192 a 512
- **⚠️ INFO-1:** Chybí `screenshots` pole — doporučené pro lepší install prompt na Androidu (richer install UI)
- **⚠️ INFO-2:** Chybí `shortcuts` pole — umožňuje quick actions z home screen (např. "Nové vozidlo", "Kontakty")
- **⚠️ INFO-3:** Manifest je jen pro makléřskou PWA. Parts supplier PWA (`/parts/`) nemá vlastní manifest — sdílí stejný start_url "/makler/dashboard"

---

## 4. Bundle Size & Dependencies

### Dependency count
- **Production:** 40 závislostí
- **Dev:** 14 závislostí

### Heavy dependencies (node_modules size)

| Dependency | Velikost | Typ | Concern |
|------------|----------|-----|---------|
| **jspdf** | **29 MB** | PDF generování | 🔴 CRITICAL — enormní, jen 1 soubor ho importuje (lib/pdf/partner-documents.ts) |
| **@sentry/nextjs** | **67 MB** | Error tracking | ⚠️ Velký, ale tree-shakeable + webpack plugin |
| **recharts** | **8.5 MB** | Grafy | ⚠️ Použit ve 3 komponentách (charts + PriceHistory) |
| **@tiptap/*** | **6.6 MB** | Rich text editor | ⚠️ Použit v 1 souboru (RichTextEditor.tsx) |
| **framer-motion** | **5.5 MB** | Animace | ⚠️ Importován v ~13 komponentách (převážně PWA) |
| **@anthropic-ai/sdk** | **5.1 MB** | AI API | ✅ Server-only, nepřidává do client bundle |
| **tesseract.js** | **1.6 MB** | OCR | ⚠️ V package.json ale NULOVÝ import v kódu! |
| **@stripe/stripe-js** | **1.3 MB** | Platby | ✅ Lazy-loaded přes Stripe.js |
| **sharp** | **860 KB** | Image processing | ✅ Server-only |

### Findings:

- **🔴 CRITICAL-1:** `jspdf` (29 MB) je v `dependencies` ale importován jen z 1 server-side souboru. Pokud se importuje v client componentě, celý 29 MB balík se bundluje do client JS.
- **🔴 CRITICAL-2:** `tesseract.js` (1.6 MB) je v `dependencies` ale **žádný soubor ho neimportuje** (`grep "tesseract" → 0 matches v .ts/.tsx`). Dead dependency.
- **⚠️ WARNING-4:** `@tiptap/*` (7 balíků, 6.6 MB) importován jen z 1 souboru (`components/ui/RichTextEditor.tsx`). Měl by být lazy-loaded přes `dynamic()`.
- **⚠️ WARNING-5:** `recharts` (8.5 MB) importován ve 3 komponentách bez `dynamic()` lazy loading.
- **⚠️ WARNING-6:** Celý projekt má **jen 1 `dynamic()` import** (`app/(web)/nabidka/[slug]/page.tsx` → PriceHistory). Heavy komponenty jako TipTap, Recharts, jsPDF by měly být dynamicky importovány.

---

## 5. Image Optimization

### next/image vs raw `<img>`

| Typ | Počet | Podíl |
|-----|-------|-------|
| `next/image` (Image) | 44 souborů | **88%** |
| Raw `<img>` | 6 výskytů v 5 souborech | **12%** |

### Raw `<img>` výskyty:

| Soubor | Concern |
|--------|---------|
| `app/(admin)/admin/vehicles/[id]/page.tsx` | ⚠️ Admin — nižší priorita |
| `app/prezentace/page.tsx` | ⚠️ Interní prezentace |
| `app/(admin)/admin/brokers/[id]/page.tsx` (2x) | ⚠️ Admin — nižší priorita |
| `components/web/marketplace/DealDetailClient.tsx` | ⚠️ Veřejná stránka — měl by být next/image |
| `app/(web)/blog/[slug]/opengraph-image.tsx` | ✅ OK — OG image generování (ImageResponse API) |

### Upload pipeline (lib/upload.ts)

- **✅ GOOD:** Auto-resize na max 1920px šířky
- **✅ GOOD:** WebP konverze (quality 85)
- **✅ GOOD:** EXIF auto-rotate (`.rotate()`)
- **✅ GOOD:** Max file size 10 MB
- **✅ GOOD:** Hash-based filenames (bez user inputu v názvu)
- **✅ GOOD:** Watermark overlay pro veřejné fotky

### Findings:

- **✅ GOOD:** 88% komponent používá next/image → automatická optimalizace, lazy loading, srcset
- **⚠️ WARNING-7:** `DealDetailClient.tsx` (veřejná marketplace stránka) používá raw `<img>` místo next/image — chybí lazy loading a responsivní formáty

---

## 6. Loading Performance

### loading.tsx pokrytí

| Metrika | Počet |
|---------|-------|
| Celkem page.tsx | **275** |
| S loading.tsx | **155** (56%) |
| **Bez loading.tsx** | **120** (44%) |

### Chybějící loading.tsx — Notable:

| Skupina | Chybějících | Příklady |
|---------|-------------|----------|
| **(admin)** | ~18 | blog, blog/[id]/edit, blog/ai-drafts, blog/comments, brokers/[id], career, orders, users, team |
| **(web)** | ~45 | blog, blog/[slug], dily/[slug], dily/katalog, dily/kosik, nabidka/*, profil/*, shop/* |
| **(pwa)** | ~10 | makler root, blog/new, materials, vehicles/[id]/edit, vehicles/new/equipment |
| **(partner)** | ~6 | onboarding/*, parts/new, vehicles/new |
| **(pwa-parts)** | ~8 | donors/*, onboarding/*, profile |

### Suspense boundaries

| Metrika | Počet |
|---------|-------|
| `<Suspense>` v kódu | **6** (ve 6 souborech, bez .claude-context) |

### error.tsx pokrytí

| Metrika | Počet |
|---------|-------|
| Celkem error.tsx | **137** (50% pokrytí) |

### "use client" direktivy

| Metrika | Počet |
|---------|-------|
| `"use client"` souborů | **250** |

### Findings:

- **⚠️ WARNING-8:** 44% stránek (120/275) nemá loading.tsx — uživatel uvidí prázdnou stránku při navigaci místo skeleton/spinner
- **⚠️ WARNING-9:** Jen 6 Suspense boundaries v celém projektu — streaming SSR se téměř nevyužívá
- **✅ GOOD:** 250 "use client" souborů z ~550+ celkových — Server Components jsou default (správný Next.js pattern)

---

## 7. External Dependencies & Tree Shaking

### Pusher.js
- **NENÍ INSTALOVÁN** v node_modules (přestože je v tech stacku v CLAUDE.md)
- Žádný import `from "pusher-js"` v kódu
- Real-time messaging pravděpodobně ještě neimplementován

### Barrel exports check
- Projekt nepoužívá barrel `index.ts` re-exporty v components/ — každý soubor importuje přímo → ✅ good for tree shaking

### `dynamic()` lazy loading

| Soubor | Import |
|--------|--------|
| `app/(web)/nabidka/[slug]/page.tsx` | `const PriceHistory = dynamic(...)` |

**Jen 1 dynamic import v celém projektu.** Kandidáti pro dynamic():

| Komponenta | Důvod |
|------------|-------|
| `RichTextEditor.tsx` (@tiptap) | 6.6 MB deps, jen admin/blog |
| Recharts grafy (3 komponenty) | 8.5 MB dep, jen dashboardy |
| `AiDraftGenerator.tsx` | @anthropic-ai/sdk, jen admin |
| `jsPDF` (lib/pdf) | 29 MB dep, jen partner documents |
| `CsvImport.tsx` | CSV parsing, jen supplier import |

---

## Souhrn

### 🔴 CRITICAL (2)

| # | Finding | Soubor |
|---|---------|--------|
| C-1 | `jspdf` (29 MB) — obrovská závislost, potenciálně v client bundle | package.json |
| C-2 | `tesseract.js` — dead dependency, nikde neimportováno | package.json |

### ⚠️ WARNING (9)

| # | Finding | Soubor |
|---|---------|--------|
| W-1 | 3/4 background sync handlerů jsou prázdné stuby (vehicles, images, contracts) | app/sw.ts:22-29 |
| W-2 | vinCache v IDB nemá TTL/cleanup — neomezený růst | lib/offline/db.ts |
| W-3 | pendingActions.retries field existuje ale není enforced (žádný maxRetries) | lib/offline/db.ts |
| W-4 | @tiptap (6.6 MB) importován jen z 1 souboru bez dynamic() | components/ui/RichTextEditor.tsx |
| W-5 | recharts (8.5 MB) ve 3 komponentách bez dynamic() | components/ui/charts/*.tsx |
| W-6 | Celkem jen 1 dynamic() import — heavy komponenty nejsou lazy-loaded | app-wide |
| W-7 | DealDetailClient.tsx (veřejná stránka) používá raw `<img>` místo next/image | components/web/marketplace/DealDetailClient.tsx |
| W-8 | 44% stránek (120/275) nemá loading.tsx | app-wide |
| W-9 | Jen 6 Suspense boundaries — streaming SSR se téměř nevyužívá | app-wide |

### ℹ️ INFO (3)

| # | Finding |
|---|---------|
| I-1 | Manifest chybí `screenshots` pole (richer install UI na Androidu) |
| I-2 | Manifest chybí `shortcuts` pole (quick actions z home screen) |
| I-3 | Parts supplier PWA nemá vlastní manifest (sdílí makléřský start_url) |

### ✅ GOOD (pozitiva)

- Service Worker správně nakonfigurován (Serwist + precaching + runtime caching + navigation preload)
- syncContacts() plně implementován s korektním IDB přístupem v SW kontextu
- IndexedDB: 8 stores s typed schema, singleton pattern, upgrade path
- PWA manifest kompletní se 4 ikonami (regular + maskable)
- 88% komponent používá next/image
- Upload pipeline: auto-resize, WebP, EXIF rotate, hash filenames
- Server Components jako default (250 "use client" z 550+ souborů)
- Žádné barrel exports → dobrý tree shaking
- Bundle analyzer dostupný (`ANALYZE=true`)
