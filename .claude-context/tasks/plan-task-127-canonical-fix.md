---
name: Plán #127 — Fix canonical = root SEO bug
description: Sub-pages dostávají homepage canonical (https://carmakler.cz) místo page-specific URL. Root cause v app/layout.tsx — `alternates.canonical: BASE_URL` je inheritován všemi child pages bez vlastního override. Fix: per-page canonical export pattern + audit ~83 metadata-exporting (web) souborů.
type: plan
task_id: 127
queue_id: 125
related_test: "#125 TEST-CHROME (zjistil bug curl -s `dily/katalog` → canonical=https://carmakler.cz)"
related_files:
  - app/layout.tsx (root cause)
  - app/(web)/jak-to-funguje/page.tsx (existing correct pattern)
  - app/(web)/dily/znacka/[brand]/page.tsx (existing correct pattern dynamic)
revision_history:
  - 2026-04-07 — initial draft (planovac, dispatch #127)
  - 2026-04-07 — lead-approved Q1-Q5 (team-lead): Strategie A schválena. Q1 apex domain only (subdomain canonical defer to #127b). Q2 token pages noindex. Q3 cleanup follow-up #127a. Q4 layouts NO canonical (root cause). Q5 dynamic SEO routes verify-only. Sekvence: dispatch #133 IMPL #127 AŽ PO #132 commitu (shared scope).
---

# Plán #127 — Fix canonical = root SEO bug

> **Cíl:** Opravit globální SEO bug — všechny sub-pages dostávají `<link rel="canonical" href="https://carmakler.cz">` místo page-specific URL. Plán definuje fix pattern + identifikuje **~83 affected (web) souborů** + acceptance criteria.

---

## 0 — Executive summary (TL;DR)

**Bug:** Test-chrome #125 zjistil:
```
curl -s https://carmakler.cz/dily/katalog | grep -i canonical
→ <link rel="canonical" href="https://carmakler.cz"/>   ❌
```
Místo očekávaného `<link rel="canonical" href="https://carmakler.cz/dily/katalog"/>`.

**Scope bugu:** GLOBAL — všechny stránky napříč route groups (web, subdomain, dynamic) bez page-specific canonical override sdílejí root URL.

**Root cause:** `app/layout.tsx:63-65` exportuje:
```ts
alternates: {
  canonical: BASE_URL,  // = "https://carmakler.cz"
},
```
Tato hodnota je **shallow-merged** na všechny child pages, které samy `alternates` neexportují. Kvůli Next.js 15 metadata inheritance je root canonical absolute URL → uchovává se jako-je → 83 (web) souborů sdílí stejný canonical.

**Fix strategie (3-step pattern):**
1. **Odstranit `alternates.canonical: BASE_URL` z `app/layout.tsx`** (eliminuje vadný fallback)
2. **Vytvořit `pageCanonical()` helper v `lib/seo.ts`** pro konzistentní pattern
3. **Per-page canonical export** v 83 (web) souborech (1-3 řádky each)

**Effort:** ~3-5 h dev (mostly mechanical edits) + 0.5h verify (build + curl + tests). 0 nových npm deps. Žádný DB change. Žádný visual regress.

**Affected files:** 83 (web) page.tsx/layout.tsx souborů které exportují metadata bez alternates. Detailní seznam v §4.

**Risk:** Nízký — všechny změny additive (přidání alternates pole), žádný impact na rendering. SEO improvement (correct canonical per page).

---

## 1 — Reproduction

### Bug verification commands

```bash
# Spustit dev server
npm run dev

# Test 1 — homepage canonical (správný, jen pro baseline)
curl -s http://localhost:3000/ | grep -i 'rel="canonical"'
# AKTUÁLNĚ:  <link rel="canonical" href="http://localhost:3000"/>
# OČEKÁVÁNO: <link rel="canonical" href="http://localhost:3000"/>  ✅ (homepage)

# Test 2 — Parts catalog (BUG)
curl -s http://localhost:3000/dily | grep -i 'rel="canonical"'
# AKTUÁLNĚ:  <link rel="canonical" href="http://localhost:3000"/>   ❌
# OČEKÁVÁNO: <link rel="canonical" href="http://localhost:3000/dily"/>

# Test 3 — Inzerce landing (BUG)
curl -s http://localhost:3000/inzerce | grep -i 'rel="canonical"'
# AKTUÁLNĚ:  <link rel="canonical" href="http://localhost:3000"/>   ❌
# OČEKÁVÁNO: <link rel="canonical" href="http://localhost:3000/inzerce"/>

# Test 4 — Marketplace landing (BUG)
curl -s http://localhost:3000/marketplace | grep -i 'rel="canonical"'
# AKTUÁLNĚ:  <link rel="canonical" href="http://localhost:3000"/>   ❌
# OČEKÁVÁNO: <link rel="canonical" href="http://localhost:3000/marketplace"/>

# Test 5 — Static page (BUG)
curl -s http://localhost:3000/o-nas | grep -i 'rel="canonical"'
# AKTUÁLNĚ:  <link rel="canonical" href="http://localhost:3000"/>   ❌
# OČEKÁVÁNO: <link rel="canonical" href="http://localhost:3000/o-nas"/>

# Test 6 — Dynamic page with override (CORRECT, baseline)
curl -s http://localhost:3000/jak-to-funguje | grep -i 'rel="canonical"'
# AKTUÁLNĚ:  <link rel="canonical" href="http://localhost:3000/jak-to-funguje"/>  ✅
# (this page has explicit override — proves the pattern works)

# Test 7 — Subdomain test (shop)
curl -s -H "Host: shop.localhost:3000" http://localhost:3000/dily/katalog | grep -i 'rel="canonical"'
# AKTUÁLNĚ:  <link rel="canonical" href="http://localhost:3000"/>   ❌
# OČEKÁVÁNO: <link rel="canonical" href="http://localhost:3000/dily/katalog"/>
```

**Conclusion:** 5 z 7 testů selhává. Pattern je deterministický — stránky bez vlastního `alternates.canonical` inherituje root.

### Verify-after-fix commands

Po fixu všechny URL musí mít canonical odpovídající jejich pathname:

```bash
# Static pages
for path in "/" "/dily" "/inzerce" "/marketplace" "/o-nas" "/kontakt" "/jak-to-funguje" \
            "/jak-prodat-auto" "/kolik-stoji-moje-auto" "/chci-prodat" \
            "/sluzby/financovani" "/sluzby/pojisteni" "/sluzby/proverka" \
            "/zasady-cookies" "/ochrana-osobnich-udaju" "/obchodni-podminky" "/reklamacni-rad"; do
  echo -n "$path: "
  curl -s "http://localhost:3000$path" | grep -oP 'rel="canonical" href="\K[^"]+'
done
# Each line musí mít canonical = http://localhost:3000{path}

# Dynamic pages — sample
curl -s http://localhost:3000/dily/znacka/skoda | grep -oP 'rel="canonical" href="\K[^"]+'
# Expected: http://localhost:3000/dily/znacka/skoda

curl -s http://localhost:3000/dily/znacka/skoda/octavia/2018 | grep -oP 'rel="canonical" href="\K[^"]+'
# Expected: http://localhost:3000/dily/znacka/skoda/octavia/2018
```

---

## 2 — Root cause analysis

### 2.1 Kde se canonical generuje

**Soubor:** `app/layout.tsx:63-65`

```ts
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  // ... title, description, openGraph, twitter, icons ...
  alternates: {
    canonical: BASE_URL,  // ❌ ROOT CAUSE — absolute URL inherited as-is
  },
};
```

### 2.2 Mechanismus selhání (Next.js 15 metadata flow)

Per [Next.js generateMetadata docs](https://nextjs.org/docs/app/api-reference/functions/generate-metadata):

> "Exported Metadata objects are shallowly merged together, starting from the root segment down to the segment closest to the final `page.tsx`."

**Co to znamená pro `alternates`:**
- `alternates` je top-level pole metadata objektu
- Při shallow merge: pokud child page **NEEXPORTUJE** `alternates`, parent's `alternates` zůstává
- Pokud child page exportuje `alternates: { ... cokoli jinéo ... }` BEZ `canonical`, parent's `canonical` SE NEDĚDÍ (shallow merge replace)
- Pokud child page exportuje `alternates: { canonical: "..." }`, parent's `canonical` je override

**Aplikováno na náš case:**
- Root layout: `metadata.alternates.canonical = "https://carmakler.cz"`
- 11 (web) souborů má vlastní `alternates: { canonical: ... }` → správně overridují
- ~83 (web) souborů exportuje metadata bez `alternates` field → DĚDÍ root canonical → BUG

**Důkaz:** `app/(web)/jak-to-funguje/page.tsx:18-20` má explicit override:
```ts
alternates: {
  canonical: `${BASE_URL}/jak-to-funguje`,
},
```
Test 6 v §1 potvrzuje, že tato stránka MÁ správnou canonical → pattern funguje, problém je nedostatek aplikace.

### 2.3 Sub-bug: subdomain canonical handling

**Problém:** Na subdomain rewrite (např. `shop.carmakler.cz/dily/katalog`), middleware rewriting na `/shop/dily/katalog` interně, ale browser URL bar zobrazuje `shop.carmakler.cz/dily/katalog`. Co má být canonical?

**Současný stav:** Page rendering se děje na rewritten path, takže `canonical: BASE_URL` (z root) → neutrální (špatně oba way).

**SEO best practice:** Canonical má ukazovat na **canonical URL pro indexaci**. Pro subdomain rewrites Carmakler:
- `shop.carmakler.cz/dily/katalog` → měl by canonical ukazovat na `https://carmakler.cz/dily/katalog` (main domain) NEBO na `https://shop.carmakler.cz/dily/katalog` (subdomain)?
- **Doporučení:** Subdomain canonical = subdomain URL (preserve subdomain). Důvod: shop.carmakler.cz je primary brand pro shop content, dedupe by main domain by ztratil subdomain SEO authority.

**Implementační dopad:** `pageCanonical()` helper musí umět dekódovat current host (přes `headers()`) a rekonstruovat canonical s subdomain prefixem.

**Out of scope #127:** Sub-bug subdomain canonical handling řešíme **v Phase 2** (#127b). #127a (tento plán) řeší POUZE main domain canonical fix. Pro shop/inzerce/marketplace subdomains canonical zůstane main domain `https://carmakler.cz/{path}` jako bezpečný default — to je STILL BETTER než current state (root URL pro vše).

---

## 3 — Fix strategy

### 3.1 Strategie A — RECOMMENDED (per-page canonical + helper)

**Tři kroky:**

#### Krok 1: Odstranit `alternates.canonical` z `app/layout.tsx`

**Diff:**

```diff
 export const metadata: Metadata = {
   metadataBase: new URL(BASE_URL),
   title: { default: ..., template: ... },
   description: ...,
   keywords: [...],
   manifest: "/manifest.json",
   openGraph: { ... },
   twitter: { ... },
   icons: { ... },
-  alternates: {
-    canonical: BASE_URL,
-  },
 };
```

**Proč:** Eliminuje vadný fallback. Po této změně **homepage** (`app/(web)/page.tsx`) také ztratí canonical → musí být fixed v Kroku 3 explicitně.

**Pozn. metadataBase:** ZACHOVAT — používá se pro resolve relative URLs v openGraph + canonical (např. `canonical: "/path"` → `https://carmakler.cz/path`).

#### Krok 2: Vytvořit `pageCanonical()` helper v `lib/seo.ts`

**Nový helper na konec `lib/seo.ts`:**

```ts
import { BASE_URL } from "@/lib/seo-data";

/**
 * Pomocný helper pro generování canonical URL v page metadata exports.
 *
 * Pattern:
 * ```ts
 * export const metadata: Metadata = {
 *   title: "...",
 *   description: "...",
 *   alternates: pageCanonical("/dily/katalog"),
 * };
 * ```
 *
 * @param path Pathname (musí začínat `/`)
 * @returns `{ canonical: "https://carmakler.cz/{path}" }` ready pro `metadata.alternates`
 */
export function pageCanonical(path: string): { canonical: string } {
  if (!path.startsWith("/")) {
    throw new Error(`pageCanonical(): path must start with /, got: "${path}"`);
  }
  return { canonical: `${BASE_URL}${path}` };
}
```

**Proč helper místo přímého `${BASE_URL}/path`:**
- DRY — central source of truth pro canonical pattern
- Type safety — runtime check `path.startsWith("/")` zachytí bug v PR
- Snadno rozšiřitelný — pokud někdy potřebujeme custom logiku (např. lowercase, trailing slash), je 1 místo
- Konzistence — všechny canonical exports vypadají stejně, snadno auditable

#### Krok 3: Per-page canonical export v 83 (web) souborech

**3a. Static metadata (79 souborů):**

```diff
+import { pageCanonical } from "@/lib/seo";
 import type { Metadata } from "next";

 export const metadata: Metadata = {
   title: "...",
   description: "...",
   openGraph: { ... },
+  alternates: pageCanonical("/o-nas"),
 };
```

**3b. Dynamic metadata via `generateMetadata` (4 souborů):**

```diff
+import { pageCanonical } from "@/lib/seo";
 import type { Metadata } from "next";

 export async function generateMetadata({ params }: Props): Promise<Metadata> {
   const { slug } = await params;
   const data = await fetchData(slug);
   return {
     title: data.title,
     description: data.description,
+    alternates: pageCanonical(`/dodavatel/${slug}`),
   };
 }
```

#### Krok 4 (volitelný): Existing canonical pattern cleanup (11 souborů)

11 souborů které už mají canonical override používají různé patterns:
- `${BASE_URL}/path` (absolute string interpolation)
- `${BASE_URL}` (bare BASE_URL, jako root layout)

Pro konzistenci doporučení převést na `pageCanonical()` helper:

```diff
-alternates: {
-  canonical: `${BASE_URL}/jak-to-funguje`,
-},
+alternates: pageCanonical("/jak-to-funguje"),
```

**Volitelné** — funkčně ekvivalent, jen DRY/style cleanup. Lze nechat na pozdější PR.

### 3.2 Strategie B — NOT RECOMMENDED (relative canonical via "./")

**Princip:** Per Next.js docs, `alternates: { canonical: "./" }` automaticky vyplní current pathname. Žádný helper, žádná cesta jako string parameter.

**Pros:**
- Žero typing — copy-paste `"./"` na všechny stránky
- Žádný path mismatch risk

**Cons:**
- **NEFUNGUJE pro dynamic routes** — `"./"` se vyhodnotí na build time podle staticParams, pro on-demand ISR může dát špatnou hodnotu
- **NEFUNGUJE pro subdomain rewrites** — middleware rewrite na `/shop/dily/katalog` znamená Next.js rendering vidí path `/shop/dily/katalog`, NE `/dily/katalog` (browser URL)
- Méně explicitní — code reviewer nevidí cílový canonical
- Méně testovatelné — nemůže být unit-tested per-page

### 3.3 Strategie C — NOT RECOMMENDED (root layout dynamic canonical via headers())

**Princip:** Nechat root layout vyplnit canonical dynamically via `headers()` reading current pathname.

**Pros:**
- Single source of truth (root layout)
- Žero changes v 83 souborech

**Cons:**
- **`headers()` nelze použít v static metadata exports** — Next.js builds static pages bez request context
- Nutno převést všechny static pages na `force-dynamic` → masivní perf regress
- Anti-pattern — Next.js metadata is designed pro per-route resolution

### 3.4 Doporučení

**Strategie A** (per-page export + helper) — pragmatic, explicit, type-safe, scaletvalbe. ~4h mechanical work, žádný runtime cost.

---

## 4 — Affected files

### 4.1 Audit metodologie

Pomocí grep:
```bash
# Files exporting metadata (94 found):
grep -rl "export const metadata\|export function generateMetadata\|export async function generateMetadata" app/(web)

# Files with proper canonical override (11 found):
grep -rl "canonical:" app/(web)
```

**Result:** 94 metadata exporters - 11 s canonical = **83 souborů potřebuje fix**.

**Audit z grep #1 (sourced earlier):**

### 4.2 Files needing fix — full list (83 files)

#### Group A — Top-level static pages (16 files)

| File | Path | Canonical to add |
|------|------|------------------|
| `app/(web)/page.tsx` | `/` | `pageCanonical("/")` |
| `app/(web)/dily/page.tsx` | `/dily` | `pageCanonical("/dily")` |
| `app/(web)/inzerce/page.tsx` | `/inzerce` | `pageCanonical("/inzerce")` |
| `app/(web)/marketplace/page.tsx` | `/marketplace` | `pageCanonical("/marketplace")` |
| `app/(web)/marketplace/apply/page.tsx` | `/marketplace/apply` | `pageCanonical("/marketplace/apply")` |
| `app/(web)/marketplace/dealer/page.tsx` | `/marketplace/dealer` | `pageCanonical("/marketplace/dealer")` |
| `app/(web)/marketplace/dealer/nova/page.tsx` | `/marketplace/dealer/nova` | `pageCanonical("/marketplace/dealer/nova")` |
| `app/(web)/marketplace/investor/page.tsx` | `/marketplace/investor` | `pageCanonical("/marketplace/investor")` |
| `app/(web)/shop/page.tsx` | `/shop` | `pageCanonical("/shop")` |
| `app/(web)/kontakt/page.tsx` | `/kontakt` | `pageCanonical("/kontakt")` |
| `app/(web)/o-nas/page.tsx` | `/o-nas` | `pageCanonical("/o-nas")` |
| `app/(web)/makleri/page.tsx` | `/makleri` | `pageCanonical("/makleri")` |
| `app/(web)/chci-prodat/page.tsx` | `/chci-prodat` | `pageCanonical("/chci-prodat")` |
| `app/(web)/jak-prodat-auto/page.tsx` | `/jak-prodat-auto` | `pageCanonical("/jak-prodat-auto")` |
| `app/(web)/kolik-stoji-moje-auto/page.tsx` | `/kolik-stoji-moje-auto` | `pageCanonical("/kolik-stoji-moje-auto")` |
| `app/(web)/sluzby/proverka/page.tsx` | `/sluzby/proverka` | `pageCanonical("/sluzby/proverka")` |
| `app/(web)/sluzby/pojisteni/page.tsx` | `/sluzby/pojisteni` | `pageCanonical("/sluzby/pojisteni")` |
| `app/(web)/sluzby/financovani/page.tsx` | `/sluzby/financovani` | `pageCanonical("/sluzby/financovani")` |

#### Group B — Layouts (5 files)

| File | Pathname | Pozn. |
|------|----------|-------|
| `app/(web)/registrace/layout.tsx` | `/registrace` | Layout — canonical aplikuje na všechny child pages |
| `app/(web)/recenze/layout.tsx` | `/recenze` | Layout |
| `app/(web)/login/layout.tsx` | `/login` | Layout — auth flow, canonical OK |
| `app/(web)/makleri/layout.tsx` | `/makleri` | Layout |
| `app/(web)/kariera/layout.tsx` | `/kariera` | Layout |

**Pozor:** Layout canonical je inherited child pages bez override. Pokud child má vlastní canonical, layout se override-ne. Pokud nemá, layout se použije.

#### Group C — Nabídka (used cars catalog) — 51 files

Tyto jsou nejvíc affected — všech 51 sub-pages katalogu dědí špatnou canonical z root.

**Static (49 files):**

```
app/(web)/nabidka/page.tsx                           → "/nabidka"
app/(web)/nabidka/audi/page.tsx                      → "/nabidka/audi"
app/(web)/nabidka/audi/a4/page.tsx                   → "/nabidka/audi/a4"
app/(web)/nabidka/bmw/page.tsx                       → "/nabidka/bmw"
app/(web)/nabidka/bmw/3-series/page.tsx              → "/nabidka/bmw/3-series"
app/(web)/nabidka/citroen/page.tsx                   → "/nabidka/citroen"
app/(web)/nabidka/dacia/page.tsx                     → "/nabidka/dacia"
app/(web)/nabidka/ford/page.tsx                      → "/nabidka/ford"
app/(web)/nabidka/ford/focus/page.tsx                → "/nabidka/ford/focus"
app/(web)/nabidka/hyundai/page.tsx                   → "/nabidka/hyundai"
app/(web)/nabidka/hyundai/i30/page.tsx               → "/nabidka/hyundai/i30"
app/(web)/nabidka/kia/page.tsx                       → "/nabidka/kia"
app/(web)/nabidka/kia/ceed/page.tsx                  → "/nabidka/kia/ceed"
app/(web)/nabidka/mazda/page.tsx                     → "/nabidka/mazda"
app/(web)/nabidka/mercedes-benz/page.tsx             → "/nabidka/mercedes-benz"
app/(web)/nabidka/opel/page.tsx                      → "/nabidka/opel"
app/(web)/nabidka/peugeot/page.tsx                   → "/nabidka/peugeot"
app/(web)/nabidka/renault/page.tsx                   → "/nabidka/renault"
app/(web)/nabidka/seat/page.tsx                      → "/nabidka/seat"
app/(web)/nabidka/skoda/page.tsx                     → "/nabidka/skoda"
app/(web)/nabidka/skoda/fabia/page.tsx               → "/nabidka/skoda/fabia"
app/(web)/nabidka/skoda/kodiaq/page.tsx              → "/nabidka/skoda/kodiaq"
app/(web)/nabidka/skoda/octavia/page.tsx             → "/nabidka/skoda/octavia"
app/(web)/nabidka/skoda/superb/page.tsx              → "/nabidka/skoda/superb"
app/(web)/nabidka/toyota/page.tsx                    → "/nabidka/toyota"
app/(web)/nabidka/toyota/yaris/page.tsx              → "/nabidka/toyota/yaris"
app/(web)/nabidka/volkswagen/page.tsx                → "/nabidka/volkswagen"
app/(web)/nabidka/volkswagen/golf/page.tsx           → "/nabidka/volkswagen/golf"
app/(web)/nabidka/volkswagen/passat/page.tsx         → "/nabidka/volkswagen/passat"
app/(web)/nabidka/sedan/page.tsx                     → "/nabidka/sedan"
app/(web)/nabidka/suv/page.tsx                       → "/nabidka/suv"
app/(web)/nabidka/kombi/page.tsx                     → "/nabidka/kombi"
app/(web)/nabidka/hatchback/page.tsx                 → "/nabidka/hatchback"
app/(web)/nabidka/kabriolet/page.tsx                 → "/nabidka/kabriolet"
app/(web)/nabidka/elektromobily/page.tsx             → "/nabidka/elektromobily"
app/(web)/nabidka/hybrid/page.tsx                    → "/nabidka/hybrid"
app/(web)/nabidka/do-100000/page.tsx                 → "/nabidka/do-100000"
app/(web)/nabidka/do-200000/page.tsx                 → "/nabidka/do-200000"
app/(web)/nabidka/do-300000/page.tsx                 → "/nabidka/do-300000"
app/(web)/nabidka/do-500000/page.tsx                 → "/nabidka/do-500000"
app/(web)/nabidka/do-1000000/page.tsx                → "/nabidka/do-1000000"
app/(web)/nabidka/praha/page.tsx                     → "/nabidka/praha"
app/(web)/nabidka/brno/page.tsx                      → "/nabidka/brno"
app/(web)/nabidka/ostrava/page.tsx                   → "/nabidka/ostrava"
app/(web)/nabidka/plzen/page.tsx                     → "/nabidka/plzen"
app/(web)/nabidka/liberec/page.tsx                   → "/nabidka/liberec"
app/(web)/nabidka/olomouc/page.tsx                   → "/nabidka/olomouc"
app/(web)/nabidka/hradec-kralove/page.tsx            → "/nabidka/hradec-kralove"
app/(web)/nabidka/ceske-budejovice/page.tsx          → "/nabidka/ceske-budejovice"
app/(web)/nabidka/porovnani/page.tsx                 → "/nabidka/porovnani"
```

**Dynamic (2 files — generateMetadata):**

```
app/(web)/nabidka/[slug]/page.tsx                    → `pageCanonical(`/nabidka/${slug}`)`
app/(web)/nabidka/[slug]/platba/page.tsx             → `pageCanonical(`/nabidka/${slug}/platba`)`
```

#### Group D — Auth/transactional (5 files)

```
app/(web)/overeni-emailu/uspech/page.tsx             → "/overeni-emailu/uspech"
app/(web)/overeni-emailu/[token]/page.tsx            → `pageCanonical("/overeni-emailu/${token}")` … POZOR §4.3
app/(web)/notifikace/[token]/page.tsx                → POZOR §4.3
app/(web)/marketplace/dealer/[id]/page.tsx           → `pageCanonical(`/marketplace/dealer/${id}`)`
app/(web)/dily/kategorie/[slug]/page.tsx             → `pageCanonical(`/dily/kategorie/${slug}`)`
```

#### Group E — Public detail pages (3 files dynamic)

```
app/(web)/dodavatel/[slug]/page.tsx                  → `pageCanonical(`/dodavatel/${slug}`)`
app/(web)/bazar/[slug]/page.tsx                      → `pageCanonical(`/bazar/${slug}`)`
app/(web)/makler/[slug]/page.tsx                     → `pageCanonical(`/makler/${slug}`)`
```

### 4.3 Edge cases — pages WITHOUT canonical (intentionally)

**Tyto soubory by canonical NEMĚLY mít** (kvůli noindex / dynamic per-token / private):

| File | Důvod |
|------|-------|
| `app/(web)/overeni-emailu/[token]/page.tsx` | Token-based, never indexable, **přidat `noindex` místo canonical** |
| `app/(web)/notifikace/[token]/page.tsx` | Token-based, never indexable, **přidat `noindex` místo canonical** |
| `app/(web)/login/layout.tsx` | Auth flow — canonical OK ale alternativa: noindex |
| `app/(web)/registrace/layout.tsx` | Auth flow — canonical OK |

**Doporučení:** Pro token-based stránky přidat `robots: { index: false, follow: false }` místo canonical:

```ts
export const metadata: Metadata = {
  title: "Ověření emailu",
  robots: { index: false, follow: false },
};
```

### 4.4 Files NOT affected (out of scope)

| Route group | Důvod | Akce |
|-------------|-------|------|
| `(pwa)/*` (makléři) | Auth-gated, never indexed | None |
| `(pwa-parts)/*` (vrakoviště) | Auth-gated | None |
| `(admin)/*` (BackOffice) | Auth-gated | None |
| `(partner)/*` (partner portál) | Auth-gated | None |
| `app/api/*` | API routes, no metadata | None |
| `app/not-found.tsx` | 404 page, no canonical | None (volitelně noindex) |

**Total NOT affected:** ~50+ files (out of scope of #127a).

### 4.5 Subdomain rewrite handling (out of scope #127a → #127b)

**Pages affected by subdomain rewrite:**
- `(web)/inzerce/*` — accessible via `inzerce.carmakler.cz/*` (rewrite z `/inzerce/*`)
- `(web)/shop/*` + `(web)/dily/*` — accessible via `shop.carmakler.cz/*`
- `(web)/marketplace/*` — accessible via `marketplace.carmakler.cz/*`

**Current state po #127a fix:** Tyto stránky budou mít canonical = `https://carmakler.cz/inzerce/...` (main domain).

**Phase 2 (#127b plán) — possible improvements:**
- Detect subdomain via `headers().get("x-subdomain")` v `generateMetadata`
- Construct canonical s subdomain: `https://shop.carmakler.cz/dily/katalog`
- Vyžaduje async generateMetadata, headers() context, complexnější helper

**Doporučení:** #127a šlape přímou cestou (main domain canonical pro vše) — to už je BIG SEO improvement vs current state. #127b sub-bug subdomain canonical řešíme po #127a deploy + měření Search Console index coverage report.

### 4.6 Total changes summary

| Skupina | Soubory | Type |
|---------|---------|------|
| A — Top-level static pages | 16 | static metadata |
| B — Layouts | 5 | static metadata |
| C — Nabídka | 51 (49 static + 2 dynamic) | mostly static |
| D — Auth/transactional | 5 (3 dynamic, 2 noindex) | mixed |
| E — Public detail dynamic | 3 | generateMetadata |
| **Total fix** | **80 files** | **~75 static + 5 dynamic** |
| Skip (noindex preference) | 2 (token pages) | metadata.robots |
| **Audit-confirmed total** | **82 files** | — |

**Pozn.:** Plus 1 file `app/layout.tsx` (root cleanup) = **83 file edits** total. Plus 1 file `lib/seo.ts` (helper add) = **84 file edits**.

---

## 5 — Acceptance criteria

| AC | Criterion | Test/verify |
|----|-----------|------------|
| **AC1** | `app/layout.tsx` neeobsahuje `alternates.canonical` | grep file |
| **AC2** | `lib/seo.ts` exportuje `pageCanonical(path: string)` helper | grep + import test |
| **AC3** | `pageCanonical()` validates path startsWith `/` (throws jinak) | unit test (volitelné) |
| **AC4** | `app/(web)/page.tsx` (homepage) má `alternates: pageCanonical("/")` | grep file |
| **AC5** | `app/(web)/dily/page.tsx` má `alternates: pageCanonical("/dily")` | grep file |
| **AC6** | Všech 16 souborů Group A má canonical export | grep batch |
| **AC7** | Všech 5 layoutů Group B má canonical export | grep batch |
| **AC8** | Všech 51 souborů Group C (nabídka) má canonical export | grep batch |
| **AC9** | Všech 8 souborů Group D + E má canonical export | grep batch |
| **AC10** | 2 token-based pages mají `robots: { index: false }` místo canonical | grep |
| **AC11** | 11 stávajících canonical patterns je převedeno na `pageCanonical()` (volitelné cleanup) | grep |
| **AC12** | `npm run build` PASS | build log clean |
| **AC13** | `npx tsc --noEmit` PASS | TS check |
| **AC14** | `npm run lint` PASS | lint clean |
| **AC15** | `curl -s http://localhost:3000/ \| grep canonical` vrátí `http://localhost:3000` | curl manual |
| **AC16** | `curl -s http://localhost:3000/dily \| grep canonical` vrátí `http://localhost:3000/dily` | curl manual |
| **AC17** | `curl -s http://localhost:3000/inzerce \| grep canonical` vrátí `http://localhost:3000/inzerce` | curl manual |
| **AC18** | `curl -s http://localhost:3000/marketplace \| grep canonical` vrátí `http://localhost:3000/marketplace` | curl manual |
| **AC19** | `curl -s http://localhost:3000/o-nas \| grep canonical` vrátí `http://localhost:3000/o-nas` | curl manual |
| **AC20** | `curl -s http://localhost:3000/dily/znacka/skoda/octavia/2018 \| grep canonical` vrátí `http://localhost:3000/dily/znacka/skoda/octavia/2018` | curl manual |
| **AC21** | Test-chrome retest #127: 0/0 canonical errors napříč 10+ sample URLs | test-chrome agent dispatch |
| **AC22** | Žádný visual regress — UI rendering nezměněn (jen `<head>` element) | manual browser smoke |
| **AC23** | Žádný OG/Twitter regress — meta og:url, twitter:url stále funguje | curl + grep |

---

## 6 — Estimated effort

**Total:** ~3.5-5h dev + 1h verify (build + lint + tests + curl + test-chrome).

| Krok | Effort | Pozn. |
|------|--------|-------|
| 1. Read 5 sample files (orientation) | 5 min | — |
| 2. Edit `app/layout.tsx` (remove canonical) | 2 min | — |
| 3. Add `pageCanonical()` helper to `lib/seo.ts` | 5 min | — |
| 4. Edit Group A — 16 top-level static pages | 30 min | ~2 min/file |
| 5. Edit Group B — 5 layouts | 10 min | — |
| 6. Edit Group C — 51 nabídka pages | **90-120 min** | bulk mechanical edits, lze parallelizovat / scriptovat |
| 7. Edit Group D — 5 auth/transactional pages | 15 min | 3 dynamic + 2 noindex |
| 8. Edit Group E — 3 public detail dynamic | 10 min | — |
| 9. Edit Group F — convert 11 existing patterns to helper (volitelné) | 15 min | — |
| 10. `npm run build` verify | 5 min (build ~3-5 min) | — |
| 11. `npm run lint` + `npx tsc --noEmit` | 3 min | — |
| 12. Manual curl tests AC15-AC20 | 10 min | — |
| 13. Test-chrome retest dispatch + wait | 15 min | — |
| 14. Commit + push | 5 min | — |

**Total dev:** ~3.5h. **Total + verify:** ~5h.

**Optimization tip:** Group C (nabídka 51 files) může implementator zautomatizovat scriptem který:
1. Reads file
2. Computes path z file location (`app/(web)/nabidka/skoda/octavia/page.tsx` → `/nabidka/skoda/octavia`)
3. Adds `import { pageCanonical } from "@/lib/seo"` if not present
4. Inserts `alternates: pageCanonical("/path"),` před `};` end metadata

To by snížilo Group C effort z 90-120 min na 20 min + 30 min review.

---

## 7 — Risk analysis

| Risk | Pravděpodobnost | Dopad | Mitigation |
|------|-----------------|-------|------------|
| Mass-edit chyba — wrong path inferred z file location | Středně | Středně | AC15-AC20 pokrývá sample URLs. Test-chrome AC21 verify 10+ pages. |
| Forgotten file (out of grep audit) | Nízká | Nízká | Audit re-check po IMPL: `find app/(web) -name "page.tsx" -exec grep -L canonical {} \;` |
| Edge case — dynamic route s undefined params (404 page render) | Nízká | Nízká | Existing pattern `if (!data) return {}` zajistí valid metadata return |
| Helper `BASE_URL` mismatch (env var) | Nízká | Středně | `pageCanonical` používá same BASE_URL z `lib/seo-data.ts` jako rest of codebase |
| Token-based pages dostávají canonical (SEO leak) | Nízká | Středně | AC10 explicitně check noindex pro 2 token files |
| Subdomain canonical zůstává main domain (suboptimal) | Vysoká | Nízká | Documented in §4.5 jako out of scope #127a, řešíme v #127b. Stále lepší než current state. |
| Build breakage z import cycle | Nízká | Nízká | `pageCanonical` importuje BASE_URL z `seo-data` (existing import chain), žádný cycle risk |

---

## 8 — Open questions pro team-leada

### Q1 — Subdomain canonical handling — Phase 1 (#127a) main domain only nebo Phase 2 (#127b) detect-subdomain?

**Doporučení:** **Phase 1 only.** #127a opraví všech 83 souborů s main domain canonical. #127b (subdomain detect) je oddělený task po deploy + měření impact v Search Console.

**Důvod:** Main domain canonical je STILL BETTER než current state (root URL pro vše). Subdomain detection vyžaduje async generateMetadata všude, headers() context, complexity. Lepší inkrementální deploy.

**✅ LEAD DECISION 2026-04-07:** **APPROVED.** "Apex domain pro všechny canonicaly. #127b Phase 2 je correct defer. Cross-subdomain canonical chceme až když budeme fakt řešit rel-alternate + geo-targeting."

### Q2 — Edge case: token-based pages (overeni-emailu, notifikace) — canonical nebo noindex?

**Doporučení:** **noindex** přes `metadata.robots: { index: false, follow: false }`. Token-based stránky se nikdy neindexují, canonical je sémanticky nesprávný.

**✅ LEAD DECISION 2026-04-07:** **APPROVED.** "`robots: { index: false, follow: false }`, NO canonical. Token URLs musí být invisible pro Google."

### Q3 — Cleanup existing 11 canonical patterns na pageCanonical helper?

**Doporučení:** **Volitelné** — provést v stejném PR pokud čas dovolí, jinak follow-up PR. Nemá funkční impact, jen DRY/style.

**✅ LEAD DECISION 2026-04-07:** **APPROVED follow-up #127a.** "Neblokuje fix, scope-keeping je správný. Vytvořím #127a po commit #127." → Implementator: NEDĚLAT cleanup v rámci #133, je to budoucí samostatný task.

### Q4 — Mass-edit Group C (51 nabídka) — script-driven nebo manual?

**Doporučení:** **Implementator-decision.** Script-driven šetří 70 min ale risk wrong path inference. Manual je explicitní ale 90-120 min mechanical work. **Doporučení:** Script + spot check 5 random files.

**Pozn:** Tato Q4 NEBYLA explicitně schvalována team-leadem (jeho Q4 odpověď se týkala layouts canonical — viz Q5 níže). Implementator si sám rozhodne podle své preference; doporučení planovacě zůstává: script + spot check.

### Q5 — Layout canonical inheritance — chceme kanonický URL z parent layoutu?

**Pozadí:** 5 layouts (Group B) exportuje metadata. Layout canonical se inherituje na child pages bez vlastního canonical. Pokud máme layout canonical, child pages inherituje layout pathname (např. `/registrace`), což může být BAD pro nested routes (`/registrace/makler` by dostal `/registrace`).

**Doporučení:** **Layouts NENECHAT canonical.** Místo toho přidat per-page canonical na všechny page.tsx pod layoutem. Layout exportuje jen title template + description.

**✅ LEAD DECISION 2026-04-07 (původně označeno jako Q4 v jeho zprávě, ale věcně se týká layouts canonical = Q5):** **APPROVED — NE.** "Layouts nemají vlastní URL, je to exactly root cause bugy. Zachovat šíření jen přes page-level `alternates` export."

**Lead's bonus Q5 rozhodnutí (dynamic SEO routes verify-only):** ✅ **APPROVED.** "Smoke test curl stačí. #87a/b už mají správný canonical pattern (ověřeno test-chrome #130)." → Implementator: u dynamic routes (`/dily/znacka/[brand]`, `[model]`, `[rok]`) jen smoke-test curl, NE refactoring na nový helper.

---

### Lead's sekvencování decision (2026-04-07)

Team-lead schválil planovac doporučení: **dispatch #133 IMPL #127 AŽ PO #132 commitu**.

**Důvod:** Oba dotýkají stejného scope (metadata exports na `/dily/znacka/*` stránkách). Sequenční dispatch ušetří merge konflikty.

**Plán sekvence:**
1. ✅ Implementator běží na #132 (IMPL runtime bugs) — priorita 1
2. 🔄 Po #132 commit → dispatch #133 IMPL #127 canonical fix
3. Jeden test-chrome retest pokryje oba (diakritika + year 404 + canonical na 5-10 sample pages)
4. Deploy unblock

---

## 9 — Implementation order (phases)

**Doporučená sekvence pro implementator:**

### Phase 1 — Foundation (15 min)
1. Edit `app/layout.tsx` — odstranit `alternates.canonical`
2. Edit `lib/seo.ts` — přidat `pageCanonical()` helper
3. `npm run build` — verify clean (homepage canonical bude broken, viz Phase 2)

### Phase 2 — Critical pages (30 min)
4. Edit homepage `app/(web)/page.tsx` + Group A 15 dalších top-level static
5. Curl test AC15-AC19
6. Verify build clean

### Phase 3 — Bulk edit nabídka (90 min)
7. Edit Group C 51 nabídka pages (script-driven recommended)
8. Spot check 5 random files
9. Verify build + lint clean

### Phase 4 — Dynamic + edge cases (45 min)
10. Edit Group D + E (8 dynamic pages)
11. Add noindex to 2 token pages
12. Edit Group B (5 layouts) — REMOVE canonical, KEEP title/description

### Phase 5 — Optional cleanup (15 min)
13. Convert existing 11 canonical patterns to `pageCanonical()` helper

### Phase 6 — Final verify (45 min)
14. Full curl AC15-AC20
15. `npm run build && npm run lint && npx tsc --noEmit && npm run test:run`
16. Test-chrome retest #127 dispatch
17. Commit + push

---

## 10 — Souhrn pro team-leada

**Co plán řeší:**
- Globální SEO bug — 83 (web) souborů sdílí root canonical URL místo page-specific
- Per-page canonical export pattern přes `pageCanonical()` helper
- 2 token-based pages konvertovat na noindex (správnější sémantika)

**Co plán NEŘEŠÍ (out of scope #127a):**
- Subdomain canonical handling (shop.carmakler.cz/dily → main domain) — řešíme v #127b po měření
- (pwa), (admin), (partner) routes — auth-gated, never indexed, irrelevant
- Sitemap.ts canonical (sitemap má vlastní URL generaci, není affected by metadata)

**Klíčové open questions:** §8 Q1-Q5, zejména Q1 (Phase 1 only) a Q5 (layouts NENECHAT canonical).

**Effort:** ~3.5-5h dev (mass mechanical edits možno scriptovat). Žádné nové deps, žádný DB change, žádný runtime cost.

**Risk:** Nízký. Všechny změny additive. Žádný visual/functional regress.

**Návaznost:** #127a je samostatný hotfix. Po IMPL → test-chrome retest → 23/23 AC PASS → deploy. Unblockuje Search Console index coverage improvement (Google bude správně dedupovat duplicates a indexovat per-page canonical).

**Rozhodovací bod pro team-leada:** Schválit Strategii A (recommended) + Q1-Q5 rozhodnutí. Pak dispatch #127 IMPL na developera.
