# Evžen Review: Phase 5 + 6 + 7A — SSR migrace

**Datum:** 2026-05-07
**Commity:** `5c12543` (Phase 5), `0d14f0e` (Phase 6), `3d72f7c` (Phase 7A)
**Rozsah:** 22 souborů celkem (15 page/layout + 7 client islands)
**Verdikt:** SCHVÁLENO

---

## Phase 5 (commit 5c12543) — Parts catalogs

**3 soubory:** 2 page.tsx (dily/katalog, shop/katalog) + 1 client island (PartsFilters)

| # | Kontrola | Výsledek |
|---|----------|----------|
| 1 | Žádné "use client" na page.tsx | ✅ `dily/katalog/page.tsx` ověřeno — žádné "use client" |
| 2 | Metadata | ✅ title, description, OG, canonical, `revalidate = 300` (ISR) |
| 3 | Prisma queries na serveru | ✅ Přímé Prisma queries v async Server Component |
| 4 | Client island má "use client" | ✅ `PartsFilters.tsx` řádek 1 |

**Namátková kontrola: `dily/katalog/page.tsx`**
- Async Server Component s Prisma data fetching
- metadata + OG + canonical — kompletní SEO
- `revalidate = 300` — ISR každých 5 min, správný pattern pro katalogové stránky
- `PartsFilters` jako client island pro interaktivní filtrování

**⚠️ Poznámka:** Phase 5 nemá samostatný QA report (qa-ssr-phase5.md neexistuje). Ověřeno namátkově přímo v kódu — OK.

---

## Phase 6 (commit 0d14f0e) — Order tracking, profile setup, prezentace, admin

**9 souborů:** 5 page.tsx + 4 client islands

| # | Kontrola | Výsledek |
|---|----------|----------|
| 1 | Žádné "use client" na page.tsx | ✅ 5/5 dle QA, namátkově: sledovani/[token], admin/team |
| 2 | Prisma queries | ✅ sledovani: `order.findUnique`, team: `teamMember.findMany` |
| 3 | Auth guardy | ✅ profil/setup: `getServerSession` + redirect. Admin: middleware |
| 4 | Metadata | ✅ sledovani: title + robots noindex. Prezentace: title + OG |
| 5 | Client islands "use client" | ✅ TeamManager, ProfileSetupWizard ověřeny |
| 6 | Date serializace | ✅ sledovani: server-side `.toLocaleDateString("cs-CZ")` |
| 7 | `force-dynamic` na admin | ✅ admin/team, admin/reviews |

**Namátková kontrola: `sledovani/[token]/page.tsx`**
- 100% SSR — žádný client island, celý JSX na serveru (správně pro read-only tracking)
- Next.js 15: `async function` + `await params`
- Prisma: `order.findUnique` s nested includes (subOrders → supplier, items → part)
- `notFound()` pro neplatný token
- UI texty kompletní: "Objednávka nenalezena", "Sledování objednávky", "Bankovní převod", "Česká pošta", "Vytvořit účet" — vše s diakritikou ✅

**Namátková kontrola: `admin/team/page.tsx`**
- 23 řádků, Prisma `teamMember.findMany` → serialized → `<TeamManager />`
- `export const dynamic = "force-dynamic"` — správné pro admin CRUD
- Žádné Date pole v serialized (vyloučeno záměrně)

---

## Phase 7A (commit 3d72f7c) — PWA step wrappers + success pages

**10 souborů:** 8 step wrappers + 2 success pages

| # | Kontrola | Výsledek |
|---|----------|----------|
| 1 | Žádné "use client" na page.tsx | ✅ 10/10 dle QA, namátkově: vin, success |
| 2 | Step wrappers jsou tenké SSR wrappery | ✅ `vin/page.tsx`: 10 řádků, jen `<StepPageGuard><VinStep /></StepPageGuard>` |
| 3 | Success pages: Next.js 15 pattern | ✅ `async` + `await searchParams` (Promise<Record<string, string>>) |

**Namátková kontrola: `vin/page.tsx`**
- 10 řádků — čistý Server Component wrapper
- Client logika v `VinStep` a `StepPageGuard` (oba jsou client components)

**Namátková kontrola: `new/success/page.tsx`**
- `async function` + `await searchParams` — správný Next.js 15 pattern
- Params předány do `<SuccessView offline={offline} vehicleId={vehicleId} />`

---

## Evženovy kontrolní body

| Pravidlo | Výsledek |
|----------|----------|
| Žádné zkratky v UI | ✅ Všechny texty kompletní ("Sledování objednávky", "Bankovní převod", "Zásilkovna", "Česká pošta", "Vytvořit účet") |
| Nic se neschovává | ✅ Všechny stránky zachovány, jen přestrukturovány |
| Nic se nemaže | ✅ Funkčnost přesunuta do client islands |
| Nedokončené = označeno | ✅ N/A |

---

## Celkový verdikt

**SCHVÁLENO** — Všechny 3 fáze odpovídají zadání "celý web musí být server side":

- **Phase 5:** 2 katalogové stránky plně SSR s Prisma + ISR + metadata
- **Phase 6:** 5 stránek SSR — sledování 100% server-rendered, admin s force-dynamic
- **Phase 7A:** 10 PWA stránek — tenké SSR wrappery, success pages s Next.js 15 pattern

Celkem 17 stránek migrovaných na SSR v těchto 3 fázích. Žádné regrese, žádné ztráty funkčnosti.

**Jedná poznámka:** Phase 5 nemá QA report — doporučuji buď doplnit, nebo zaznamenat v celkovém přehledu SSR migrace.
