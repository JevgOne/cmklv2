# IMPL: SSR migrace Fáze 5 — Katalogy s filtry (2 stránky)

**Datum:** 2026-05-07
**Commit:** `5c12543`
**Status:** HOTOVO

## Změny

### Nový client component (components/web/)
| Soubor | Export | Důvod client |
|--------|--------|-------------|
| `PartsFilters.tsx` | `PartsFilters` | `useSearchParams` + `useRouter` + `router.push()` pro URL-based filtry |

### Migrované stránky
| Soubor | Typ | Změny |
|--------|-----|-------|
| `(web)/shop/katalog/page.tsx` | Page → SSR | Odebráno "use client", 8x useState, useEffect, useCallback, fetchParts(). Prisma `part.findMany` + `part.count`. Metadata + JSON-LD + ISR. Link-based paginace. |
| `(web)/dily/katalog/page.tsx` | Page → SSR | Odebráno "use client", Suspense wrapper, KatalogFallback, 9x useState, useEffect, useCallback, fetchParts(). Prisma query s extra filtry (partType, manufacturer). PartRequestForm zachován v empty state. |

### Stránky BEZ ZMĚNY (dle plánu)
- `inzerce/katalog` — již SSR (redirect na /nabidka)

### Klíčové technické detaily
- **Sdílený client component:** `PartsFilters` s `variant` prop ("shop" | "dily") — shop zobrazuje `condition` select, dily zobrazuje `partType` select + `manufacturer` input
- **URL-driven filtry:** `updateParam()` → `router.push()` → server re-render. Každá změna filtru vytvoří novou URL, page param se resetuje
- **Prisma query pattern:** Identický s `/api/parts` GET handler — `part.findMany` s where clause + count + paralelní Promise.all
- **ISR:** `revalidate = 300` (5 min) — shodné s nabidka/page.tsx
- **Link-based paginace:** Nahrazena button onClick → `<Link href>` (SEO-crawlable)
- **SEO:** `export const metadata` (title, description, openGraph, alternates), JSON-LD `ItemList` schema
- **Grid layout:** shop lg:grid-cols-5, dily lg:grid-cols-7 (dynamický via `cn()`)
- **Suspense odstraněna:** Server renderuje kompletní HTML, skeleton nepotřeba
- **PartRequestForm:** Zachován v dily/katalog empty state s `prefillQuery={params.q}`
- **Diakritika:** Zachována přesně dle originálů (Škoda, Použité, Řazení atd.)

### Rozdíly shop vs dily
| Aspekt | shop/katalog | dily/katalog |
|--------|-------------|-------------|
| Filtry | category, brand, condition, price, sort, inStock | category, brand, **partType**, **manufacturer**, price, sort, inStock |
| Grid cols | lg:grid-cols-5 | lg:grid-cols-7 |
| Empty state | Jednoduchý text | Text + **PartRequestForm** (client island) |
| basePath | default (/shop) | `/dily` |
| JSON-LD URL | `/shop/{slug}` | `/dily/{slug}` |

## Statistiky
- **3 soubory změněno** (2 page.tsx + 1 nový client component)
- **474 insertions, 562 deletions**
- **1 nový client island soubor**
- **0 stránek 100% SSR** (obě mají PartsFilters client island)

## Ověření
- **Build:** OK (0 errors, compiled in 23.6s)
- **Lint:** OK (0 errors, 683 warnings — 2 méně než před migrací)
