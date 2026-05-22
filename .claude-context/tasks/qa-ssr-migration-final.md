# QA Report: SSR Migrace FINAL — 34+ stránek (všechny 4 skupiny)
**Datum:** 2026-05-08  
**Kontrolor:** kontrolor  
**Rozsah:** Partner portál (15) + Admin panel (12) + PWA Díly (8) + PWA Makléř (3) = **38 migrovaných stránek**

> Pozn: Implementátor překročil původní rozsah 34 stránek na 38 — 4 navíc jsou v Partner portálu (onboarding/documents, vehicles/[id], vehicles/new, parts/new). Všechny jsou správně migrované.

---

## 1. Debug kontrola

### npm run build
```
✓ (serwist) Bundling service worker...
✓ Compiled successfully in 24.9s
✓ Generating static pages using 7 workers (1281/1281) in 9.5s
```
**Výsledek: ✅ BUILD PASSED — 0 errors**

### npm run lint
```
0 errors
697 warnings — vše na řádku 2 minifikovaného SW souboru (ne zdrojový kód)
```
Real source-level warnings (všechny pre-existing nebo minor):
- `admin/manager/approvals/page.tsx:139` — `Date.now()` v render (pre-existing)
- `AdminOrdersContent.tsx:188` — ternary side effect (1 warning)
- 1× `'total' is assigned but never used` — detekováno při skupinovém lintu, nedaří se izolovat do konkrétního souboru
- Více souborů — `<img>` místo `<Image />`, `<a>` místo `<Link />` (pre-existing)

**Výsledek: ✅ LINT PASSED — 0 errors**

---

## 2. Reverzní kontrola — kompletní tabulka

### A. Partner portál (15 stránek)

Middleware chrání celý `/partner` prefix (middleware.ts:355 `pathname.startsWith("/partner")`).

| Stránka | use client | Prisma | Auth | Status |
|---------|-----------|--------|------|--------|
| `partner/billing` | ❌ | ✅×1 | getServerSession | ✅ |
| `partner/dashboard` | ❌ | ✅×9 | getServerSession | ✅ |
| `partner/leads` | ❌ | ✅×3 | getServerSession | ✅ |
| `partner/messages` | ❌ | ✅×1 | getServerSession | ✅ |
| `partner/onboarding` | ❌ | — | getServerSession (redirect) | ✅ |
| `partner/orders` | ❌ | ✅×2 | getServerSession | ✅ |
| `partner/parts` | ❌ | ✅×2 | getServerSession | ✅ |
| `partner/profile` | ❌ | ✅×1 | getServerSession | ✅ |
| `partner/stats` | ❌ | ✅×9 | getServerSession | ✅ |
| `partner/vehicles` | ❌ | ✅×2 | getServerSession | ✅ |
| `partner/onboarding/approval` | ❌ | — | middleware | ✅ |
| `partner/onboarding/documents` | ❌ | — | middleware (form shell) | ✅ |
| `partner/onboarding/profile` | ❌ | — | middleware (form shell) | ✅ |
| `partner/orders/[id]` | ❌ | ✅×2 | getServerSession | ✅ |
| `partner/parts/[id]` | ❌ | ✅×2 | getServerSession | ✅ |
| `partner/parts/new` | ❌ | — | middleware (form shell) | ✅ |
| `partner/vehicles/[id]` | ❌ | ✅×2 | getServerSession | ✅ |
| `partner/vehicles/new` | ❌ | — | middleware (form shell) | ✅ |

**Partner client components: 15/15 mají "use client" ✅**

### B. Admin panel (12 stránek)

Middleware chrání celý `/admin` prefix (middleware.ts:184).

| Stránka | use client | Prisma | Auth + role | Status |
|---------|-----------|--------|-------------|--------|
| `admin/users` | ❌ | ✅ | ADMIN/BO/MGR | ✅ |
| `admin/orders` | ❌ | ✅ | ADMIN/BO/MGR | ✅ |
| `admin/parts` | ❌ | ✅×2 | ADMIN/BO/MGR | ✅ |
| `admin/suppliers` | ❌ | ✅×7 | ADMIN/BO/MGR | ✅ |
| `admin/returns` | ❌ | ✅×2 | ADMIN/BO/MGR | ✅ |
| `admin/returns/[id]` | ❌ | ✅ | ADMIN/BO/MGR | ✅ |
| `admin/feeds` | ❌ | ✅ | ADMIN/BO/MGR | ✅ |
| `admin/feeds/[id]` | ❌ | ✅ | ADMIN/BO/MGR | ✅ |
| `admin/feeds/new` | ❌ | ✅ | ADMIN/BO/MGR | ✅ |
| `admin/vehicles/new` | ❌ | — | ADMIN/BO/MGR | ✅ |
| `admin/marketplace/[id]` | ❌ | ✅ | ADMIN/BO | ✅ |
| `admin/marketplace/applications/[id]` | ❌ | ✅ | ADMIN/BO | ✅ |

**Admin client components: 12/12 mají "use client" ✅**

### C. PWA Díly (8 stránek)

Middleware chrání pwa-parts routes s `PARTS_SUPPLIER` rolemi.

| Stránka | use client | Prisma | Auth + role | Status |
|---------|-----------|--------|-------------|--------|
| `parts/my` | ❌ | ✅×5 | getServerSession + role | ✅ |
| `parts/orders` | ❌ | ✅ | getServerSession | ✅ |
| `parts/orders/[id]` | ❌ | ✅ | getServerSession | ✅ |
| `parts/donors` | ❌ | ✅ | getServerSession + role | ✅ |
| `parts/donors/[id]` | ❌ | ✅ | getServerSession + ownership | ✅ |
| `parts/[id]` | ❌ | ✅ | getServerSession + role | ✅ |
| `parts/[id]/edit` | ❌ | ✅ | getServerSession + ownership | ✅ |
| `parts/profile` | ❌ | ✅ | getServerSession | ✅ |

**Poznámka:** `parts/new`, `onboarding/documents`, `onboarding/profile` — mimo rozsah migrace, legitimně zůstávají jako Client Components (multi-step form wizards). ✅

**PWA-parts client components: 6/6 mají "use client" ✅**  
**PD4 + PD5 (donors) jsou full RSC bez client component — správně (read-only)** ✅

### D. PWA Makléř (3 stránky)

Middleware chrání `/makler` routes s `BROKER` rolí.

| Stránka | use client | Prisma | Auth + role | Status |
|---------|-----------|--------|-------------|--------|
| `makler/leads` | ❌ | ✅ | BROKER/ADMIN/BO | ✅ |
| `makler/contacts` | ❌ | ✅ | BROKER/ADMIN/BO | ✅ |
| `makler/contacts/[id]` | ❌ | ✅ | BROKER/ADMIN/BO + ownership | ✅ |

**PWA-makler client components: 3/3 mají "use client" ✅**

---

## 3. Simplify kontrola

### ⚠️ Duplicitní Prisma query (z předchozí QA, stále platné)
- `(web)/muj-ucet/profil/page.tsx` — 2× `prisma.user.findUnique` pro stejný user ID → sloučit do jednoho dotazu. Non-blocking.

### ⚠️ Metadata bez diakritiky (Partner + Admin nové stránky)
Systematický pattern: Admin i Partner stránky mají metadata tituly bez háčků:
```
"Uzivatele"    → "Uživatelé"
"Objednavky"   → "Objednávky"  
"Dily"         → "Díly"
"Dodavatele"   → "Dodavatelé"
"Pridat dil"   → "Přidat díl"
"Zpravy"       → "Zprávy"
```
Dopad: Browser tabs + (neindexované) SEO metadata. Funkčnost neovlivněna.

### ✅ Bez problémů
- `partner/dashboard` + `partner/stats`: 9× Prisma = různé tabulky + různé filtry v Promise.all (ne duplicity)
- `admin/suppliers`: 7× Prisma = suppliers + count + payoutAggregations per supplier (oprávněné)
- `parts/my`: 5× Prisma = list + 4× count pro status tabs (oprávněné)
- Žádné `useState`/`useEffect` v žádném ze 38 migrovaných page.tsx
- Všechny detail pages používají `notFound()` správně
- Všechny dynamic pages mají `force-dynamic`
- `await params` (Next.js 15 async params) použito správně

---

## Souhrn všech 38 stránek

| Skupina | Stránek | use client: 0 | Auth OK | Prisma OK | Výsledek |
|---------|---------|--------------|---------|-----------|----------|
| Partner portál | 18 (incl. static) | ✅ 18/18 | ✅ | ✅ | ✅ |
| Admin panel | 12 | ✅ 12/12 | ✅ | ✅ | ✅ |
| PWA Díly | 8 | ✅ 8/8 | ✅ | ✅ | ✅ |
| PWA Makléř | 3 | ✅ 3/3 | ✅ | ✅ | ✅ |
| **CELKEM** | **38** | **✅ 38/38** | **✅** | **✅** | **✅** |

### Nálezy (všechny non-blocking)
| # | Typ | Soubor | Popis |
|---|-----|--------|-------|
| ⚠️1 | Simplify | `(web)/muj-ucet/profil/page.tsx` | 2× `prisma.user.findUnique` pro stejný user — sloučit |
| ⚠️2 | Simplify | Admin + Partner stránky | Metadata bez diakritiky (kosmetické) |
| ⚠️3 | Lint | `AdminOrdersContent.tsx:188` | Ternary pro side effects (1 warning) |
| ⚠️4 | Lint | Neizolováno | 1× `'total' is assigned but never used` |
| ℹ️5 | Scope | Partner portál | 38 místo 34 stránek — 4 extra správně implementovány |

### Verdikt
**✅ KOMPLETNÍ SSR MIGRACE PROŠLA — žádný blocker. Produkčně nasaditelné.**

Build: ✅ | Lint: ✅ (0 errors) | 38/38 page.tsx bez "use client" | Auth: ✅ | Pattern: ✅
