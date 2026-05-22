# MASTER AUDIT REPORT — Carmakler Platform

**Datum:** 2026-05-03  
**Autor:** Plánovač (kompilace z 13 dílčích auditů)  
**Rozsah:** Celá platforma — build, web, admin/PWA, auth, API, DB schema, DB queries, komponenty, security, SEO, PWA/performance, dev server, vizuální test

---

## 1. EXECUTIVE SUMMARY

Platforma Carmakler je v **solidním produkčním stavu** — build prochází bez chyb, všech 275 stránek renderuje, vizuální test v Chrome potvrzuje 11/13 stránek bez chyb, auth middleware chrání všechny chráněné route skupiny a 87% API endpointů má autorizaci. Žádné N+1 queries, správné použití `select` vs `include`.

Existuje **8 kritických nálezů**: 3 bezpečnostní (XSS×2, chybějící rate limiting), 2 bundle (jspdf 29MB, tesseract.js dead dependency), 2 databázové (4 endpointy bez `take` limitu = full table scans), a nedostatek lazy loadingu (jen 1 `dynamic()` import pro heavy komponenty). 44% stránek nemá `loading.tsx`, 3 ze 4 background sync handlerů jsou prázdné stuby. CSP `frame-src` neobsahuje mapy.cz — mapa na /kontakt se rozbije při přepnutí z report-only na enforcement.

Architektura je čistá, kódová základna konzistentní, žádné broken importy, N+1 queries ani cyklické závislosti. Offline podpora (IDB 8 stores, typed schema) je dobře navržená.

---

## 2. CELKOVÉ SKÓRE

| Kategorie | Skóre | Odůvodnění |
|-----------|-------|------------|
| **Build & Lint** | **A-** | 0 chyb, build OK, ale 683 ESLint warnings |
| **Web stránky** | **A** | 130 stránek, 0 stubů, všechny renderují, 96/141 s metadata |
| **Admin/PWA/Partner** | **A-** | 132 stránek, 0 stubů, ale PWA Díly chybí 93% loading/error |
| **Auth & Middleware** | **A-** | Robustní middleware, fragile explicit makler paths pattern |
| **API Endpoints** | **B+** | 293 routes, 87.4% auth, ale 46.4% bez Zod validace |
| **Prisma Schema** | **A** | 81 modelů, konzistentní relace, dobré indexy, 3 unused modely |
| **Prisma Queries** | **B+** | 0 N+1, správný select/include, ale 4 endpointy bez `take` limitu |
| **Komponenty** | **A** | 314 komponent, 0 broken importů, 4 nepoužívané, správný split |
| **Security** | **B-** | 3 CRITICAL (XSS×2, rate limit), 9 warnings |
| **SEO** | **A-** | 17 JSON-LD generátorů, AIEO/GEO, ale parts chybí v sitemap |
| **PWA & Performance** | **B** | SW OK, IDB dobré, ale jspdf 29MB, no lazy loading, 44% bez loading.tsx |
| **Dev Server** | **A** | Všechny stránky HTTP 200, auth redirecty OK, 87-644ms |
| **Vizuální test (Chrome)** | **A-** | 11/13 stránek čistých, CSP frame-src + broken Unsplash img |

**Celkové skóre: B+** — Dobrý produkční stav, nutná oprava 8 critical issues.

---

## 3. KRITICKÉ NÁLEZY (musí se opravit)

| # | Nález | Zdroj | Dopad | Oprava |
|---|-------|-------|-------|--------|
| C-1 | **XSS v blog článcích** — `article.content` renderován přes `dangerouslySetInnerHTML` bez DOMPurify | Security | Útočník může vložit škodlivý script | Přidat `DOMPurify.sanitize()` před render |
| C-2 | **XSS v AI generovaném obsahu** — AI draft content renderován bez sanitizace | Security | AI model může generovat nebezpečný HTML | Sanitizovat AI output přes DOMPurify |
| C-3 | **Login bez rate limitingu** — `/api/auth/[...nextauth]` nemá rate limiting | Security | Brute-force útoky na hesla | Přidat rate limiting (in-memory nebo Redis) |
| C-4 | **jspdf 29 MB** — enormní závislost, importován z 1 souboru (`lib/pdf/partner-documents.ts`), potenciálně v client bundle | PWA/Perf | Nafouknutý bundle, pomalé načítání | `dynamic()` import nebo přesun do server-only |
| C-5 | **tesseract.js dead dependency** — v `package.json` ale **0 importů v kódu** | PWA/Perf | 1.6 MB zbytečně v node_modules | Odstranit z `package.json` |
| C-6 | **4 API endpointy bez `take` limitu** — full table scans při každém požadavku | Prisma Queries | `/api/admin/vehicles` (celá tabulka!), `/api/payments`, `/api/broker/detailed-stats` (všechna SOLD vozidla), `/api/broker/vehicles` | Přidat `take` cap + server-side pagination |
| C-7 | **Jen 1 `dynamic()` import** — heavy komponenty (TipTap 6.6MB, Recharts 8.5MB, jsPDF 29MB) nejsou lazy-loaded | PWA/Perf | Zbytečně velký client bundle | Přidat `dynamic()` pro TipTap, Recharts, jsPDF |
| C-8 | **3/4 background sync handlery jsou prázdné stuby** — `sync-vehicles`, `sync-images`, `sync-contracts` = jen `console.log()` | PWA/Perf | Offline data se nikdy nesynchronizují | Implementovat nebo odstranit registraci |

---

## 4. VYSOKÁ PRIORITA (mělo by se opravit)

| # | Nález | Zdroj |
|---|-------|-------|
| H-1 | **7 API routes s chybějícími HTTP metodami** — GET/POST existuje ale chybí PUT/DELETE nebo naopak | API audit |
| H-2 | **Makler paths fragile pattern** — middleware.ts má hardcoded seznam `/makler/*` paths místo prefix matche | Auth audit |
| H-3 | **14 API routes bez try/catch** — 4.8% endpointů nemá error handling | API audit |
| H-4 | **37 API routes bez auth checku** — 12.6% endpointů bez autorizace (některé záměrně public) | API audit |
| H-5 | **CSP frame-src chybí mapy.cz** — `/kontakt` mapa se rozbije při přepnutí CSP z report-only na enforcement | Chrome test |
| H-6 | **2 tabulky chybí v dev DB** — Review a TeamMember nejsou migrovány lokálně | Prisma audit |
| H-7 | **Admin client-side pagination** — `VehiclesPageContent`, `BrokersPageContent` fetchují celou tabulku, stránkují v JS | Prisma Queries |

---

## 5. STŘEDNÍ PRIORITA (nice to have)

| # | Nález | Zdroj |
|---|-------|-------|
| M-1 | **41 POST/PATCH endpointů bez Zod validace** — 46.4% POST/PATCH nemá input validaci | API audit |
| M-2 | **/dily/[slug] chybí v sitemap.ts** — detail stránky dílů nejsou indexované | SEO audit |
| M-3 | **5 web stránek bez SEO metadata** — /kontakt, /cookies, /gdpr, /podminky, /faq | Web audit |
| M-4 | **45 stránek bez metadata export** — 11 reálných mezer (zbytek admin/PWA = OK) | SEO audit |
| M-5 | **/moje-inzeraty a /gate chybí v robots.ts disallow** — auth-only routes viditelné pro crawlery | SEO audit |
| M-6 | **683 ESLint warnings** — převážně `@typescript-eslint/no-unused-vars` a `react/no-unescaped-entities` | Build audit |
| M-7 | **Impure render functions ve 4 komponentách** — `new Date()` / `Math.random()` v renderech | Components audit |
| M-8 | **Admin — 29% chybí error.tsx** — 5/17 admin route groups bez error boundary | Admin/PWA audit |
| M-9 | **44% stránek (120/275) nemá loading.tsx** — prázdná stránka při navigaci místo skeleton | PWA/Perf audit |
| M-10 | **Jen 6 Suspense boundaries** — streaming SSR se téměř nevyužívá | PWA/Perf audit |
| M-11 | **/nabidka suboptimální pagination** — cursor drift, stránka 10 = 396 záznamů z DB pro 18 zobrazených | Prisma Queries |
| M-12 | **Broken Unsplash obrázek na /blog** — 1 článek má nefunkční thumbnail | Chrome test |

---

## 6. NÍZKÁ PRIORITA (tech debt)

| # | Nález | Zdroj |
|---|-------|-------|
| L-1 | **4 nepoužívané komponenty** — CommentSection (212ř), InstallPrompt, FeatureGate, LiveRegion | Components audit |
| L-2 | **3 nepoužívané Prisma modely** — DealComment, ListingFeedConfig, ListingImportLog | Prisma audit |
| L-3 | **Navbar nemá sdílenou NavbarBase** — 4 subdomain navbary bez společné kostry | Components audit |
| L-4 | **NotificationBell — 3 podobné implementace** — admin, pwa, marketplace bez sdílené báze | Components audit |
| L-5 | **Sentry deprecated API** — `Sentry.init` místo nového `@sentry/nextjs` setupu | Build audit |
| L-6 | **String-based enums** — Prisma nepoužívá nativní enum typy, vše přes String + validace | Prisma audit |
| L-7 | **tsvector drift** — `migrate dev` v dev prostředí selhává s tsvector/trgm drift | Prisma audit |
| L-8 | **vinCache v IDB nemá TTL/cleanup** — může neomezeně růst | PWA/Perf audit |
| L-9 | **pendingActions.retries field není enforced** — žádný maxRetries check | PWA/Perf audit |
| L-10 | **Parts supplier PWA nemá vlastní manifest** — sdílí makléřský start_url `/makler/dashboard` | PWA/Perf audit |
| L-11 | **Manifest chybí `screenshots` a `shortcuts`** — horší install prompt na Androidu | PWA/Perf audit |
| L-12 | **DealDetailClient.tsx používá raw `<img>`** — veřejná stránka bez next/image optimizace | PWA/Perf audit |
| L-13 | **Login formulář bez custom validation messages** — spoléhá na browser-native HTML5 validaci | Chrome test |

---

## 7. STATISTIKY

### Stránky & Build

| Metrika | Hodnota |
|---------|---------|
| **Stránky celkem** | 275 (130 web + 132 admin/PWA/partner + 13 dalších) |
| **Build pages** | 1 305 (staticky generovaných + SSR) |
| **S loading.tsx** | 155 (56%) |
| **S error.tsx** | 137 (50%) |
| **Suspense boundaries** | 6 |
| **Build warnings** | 683 ESLint |
| **Build errors** | 0 |

### API & Databáze

| Metrika | Hodnota |
|---------|---------|
| **API Endpoints** | 293 routes |
| **s Auth checkem** | 256 (87.4%) |
| **s Zod validací** | 157 (53.6%) |
| **s Try/Catch** | 279 (95.2%) |
| **Prisma modely** | 81 |
| **Prisma indexy** | ~130 |
| **N+1 queries** | 0 ✅ |
| **Unbounded findMany** | 4 (C-6) |

### Komponenty & Bundle

| Metrika | Hodnota |
|---------|---------|
| **TSX komponenty** | 314 |
| **"use client"** | 250 (z ~550+ souborů) |
| **Server Components** | default (správný pattern) |
| **dynamic() imports** | 1 (kriticky málo) |
| **Produkční deps** | 40 |
| **Dev deps** | 14 |
| **next/image vs raw img** | 88% : 12% |

### SEO & PWA

| Metrika | Hodnota |
|---------|---------|
| **JSON-LD generátory** | 17 typů |
| **Sitemap URLs** | ~202 statických + dynamické z DB |
| **Auth role** | 13 (ADMIN → VERIFIED_DEALER) |
| **IDB object stores** | 8 |
| **Background sync implementováno** | 1/4 (contacts) |
| **PWA ikony** | 4 (regular + maskable, 192 + 512) |

### Runtime

| Metrika | Hodnota |
|---------|---------|
| **Dev server start** | ~12s |
| **Render time range** | 87ms (homepage) — 644ms (/nabidka) |
| **Chrome vizuální test** | 11/13 čistých |
| **JS errory na stránkách** | 0 (2× warning: CSP + 404 obrázek) |

---

## 8. DOPORUČENÝ POSTUP OPRAV

### Fáze 1 — OKAMŽITĚ (security + critical performance)
1. **C-1 + C-2:** Přidat DOMPurify sanitizaci na blog `article.content` a AI draft content
2. **C-3:** Implementovat rate limiting na login endpoint
3. **C-5:** Odstranit `tesseract.js` z `package.json` (dead dependency)
4. **C-6:** Přidat `take` limity na 4 unbounded endpointy (`/api/admin/vehicles`, `/api/payments`, `/api/broker/detailed-stats`, `/api/broker/vehicles`)
5. **H-2:** Refaktorovat makler paths v middleware na prefix match

### Fáze 2 — TENTO TÝDEN (high priority + bundle)
6. **C-4 + C-7:** Přidat `dynamic()` lazy loading pro jsPDF, TipTap, Recharts
7. **H-1:** Doplnit chybějící HTTP metody na 7 API routes
8. **H-3:** Přidat try/catch na 14 API routes bez error handlingu
9. **H-4:** Revize 37 routes bez auth — potvrdit které jsou záměrně public
10. **H-5:** Přidat mapy.cz domény do CSP `frame-src`
11. **H-7:** Přepsat admin VehiclesPageContent/BrokersPageContent na server-side pagination

### Fáze 3 — PŘÍŠTÍ TÝDEN (medium priority)
12. **M-1:** Přidat Zod validaci na nejvíce exponované POST/PATCH endpointy
13. **M-2 + M-5:** Aktualizovat sitemap.ts (přidat /dily/[slug]) a robots.ts
14. **M-3:** Přidat metadata export na /kontakt, /cookies, /gdpr, /podminky, /faq
15. **M-9 + M-8:** Doplnit loading.tsx a error.tsx (priorita: user-facing web routes)
16. **M-11:** Přidat hard cap na /nabidka fetchLimit (`Math.min(fetchLimit, 200)`)
17. **C-8:** Implementovat nebo odstranit stub background sync handlery

### Fáze 4 — BACKLOG (low priority, tech debt)
18. **L-1:** Smazat 4 nepoužívané komponenty
19. **L-2:** Smazat 3 nepoužívané Prisma modely + migrace
20. **L-3 + L-4:** Refaktorovat Navbar/NotificationBell na sdílenou bázi
21. **M-6:** Postupně řešit ESLint warnings (683 → 0)
22. **L-8 → L-13:** Drobné tech debt (vinCache TTL, manifest shortcuts, raw img, atd.)

---

## PŘÍLOHY — Zdrojové reporty

| # | Report | Soubor |
|---|--------|--------|
| 1 | Build & Lint | `qa-build-lint-2026-05-03.md` |
| 2 | Web Pages | `qa-audit-web-pages-2026-05-03.md` |
| 3 | Admin/PWA/Partner | `qa-audit-admin-pwa-partner-2026-05-03.md` |
| 4 | Auth & Middleware | `qa-audit-auth-middleware-2026-05-03.md` |
| 5 | API Endpoints | `qa-audit-api-endpoints-2026-05-03.md` |
| 6 | Prisma Schema | `qa-audit-prisma-schema-2026-05-03.md` |
| 7 | Prisma Queries | `qa-audit-prisma-queries-2026-05-03.md` |
| 8 | Components | `qa-audit-components-2026-05-03.md` |
| 9 | Security | `qa-audit-security-2026-05-03.md` |
| 10 | SEO | `qa-audit-seo-2026-05-03.md` |
| 11 | PWA & Performance | `qa-audit-pwa-performance-2026-05-03.md` |
| 12 | Dev Server | `qa-audit-devserver-2026-05-03.md` |
| 13 | Chrome Visual Test | `chrome-test-visual-2026-05-03.md` |
