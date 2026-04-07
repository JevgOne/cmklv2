# Task #135 — Canonical URL Fix (#127) — Implementation Report

**Status:** ✅ Completed
**Plan reference:** `.claude-context/tasks/plan-task-127-canonical-fix.md`
**Scope:** Fix global SEO bug where Next.js metadata API shallow-merges
`alternates.canonical` from root layout into all child pages, causing every
indexable page to advertise the homepage URL as its canonical.

---

## Strategy

**Phase 1 (Helper):** New `lib/canonical.ts` exporting `pageCanonical(path)`
that returns `{ canonical: \`${BASE_URL}${path}\` }` with defensive validation,
query/hash stripping, trailing-slash normalization, and clear error messages.

**Phase 2 (Refactor):** Remove `alternates.canonical` from `app/layout.tsx`
(keep `metadataBase`). Add `alternates: pageCanonical("/path")` to every
indexable page's metadata export. For gated/private pages use
`robots: { index: false, follow: false }` instead.

**Phase 3 (Verification):** Build, lint, TSC, vitest, code review.

---

## Files changed (92)

### Helper + tests (2)
- `lib/canonical.ts` (NEW) — 76-line helper with JSDoc + 4 inline guards
- `__tests__/lib/canonical.test.ts` (NEW) — 14 tests, all passing

### Root layout (1)
- `app/layout.tsx` — removed `alternates.canonical: BASE_URL`, kept
  `metadataBase`, added explanatory comment block

### Indexable pages with `pageCanonical()` (84)
**Static metadata (Group A — 18):** `/`, `/nabidka`, `/marketplace`,
`/marketplace/apply`, `/marketplace/dealer`, `/marketplace/dealer/nova`,
`/marketplace/investor`, `/dily`, `/inzerce`, `/kontakt`, `/makleri`,
`/chci-prodat`, `/o-nas`, `/sluzby/proverka`, `/sluzby/pojisteni`,
`/sluzby/financovani`, `/shop`, `/kolik-stoji-moje-auto`, `/jak-prodat-auto`

**Static metadata (Group F — 7):** `/jak-to-funguje`,
`/ochrana-osobnich-udaju`, `/obchodni-podminky`, `/shop/reklamace`,
`/shop/vraceni-zbozi`, `/zasady-cookies`, `/reklamacni-rad`

**Nabídka brand/model/city/price-range (Group C — 48):** all
`/nabidka/{brand,brand/model,bodyType,city,price-range}` pages

**Dynamic `generateMetadata` (Group E — 5):** `/nabidka/[slug]`,
`/dodavatel/[slug]`, `/bazar/[slug]`, `/makler/[slug]`,
`/dily/kategorie/[slug]`

**Dynamic Group F (4):** `/dily/znacka/[brand]`,
`/dily/znacka/[brand]/[model]`, `/dily/znacka/[brand]/[model]/[rok]`,
`/dily/vrakoviste/[slug]`

**Layout-level canonical (controlled Q5 exception — 2):** `/kariera/layout`,
`/recenze/layout` — both child `page.tsx` are client components and cannot
export own metadata. Single-page subtrees, no inheritance leak risk.

### Robots noindex (3 — gated/private, no canonical)
- `app/(web)/marketplace/dealer/[id]/page.tsx` — VIP gated content
- `app/(web)/notifikace/[token]/page.tsx` — token-based private
- `app/(web)/nabidka/[slug]/platba/page.tsx` — payment page

### Layouts kept as-is (already noindex or child has own canonical)
- `registrace/layout.tsx` — already `robots: { index: false, follow: true }`
- `login/layout.tsx` — already `robots: { index: false, follow: false }`
- `makleri/layout.tsx` — child `page.tsx` got own canonical via Group A

---

## Quality gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | ✅ pass (0 errors) |
| `npm run lint` | ✅ pass (0 errors, 543 warnings — baseline +1, all in `public/sw.js` minified output, unrelated) |
| `npx vitest run __tests__/lib/canonical.test.ts` | ✅ 14/14 pass |
| `npm run build` | ✅ pass (DATABASE_URL=dummy, expected prisma errors during prerender are SSR-time, build artifact OK) |

---

## Acceptance criteria

| AC | Description | Status |
|---|---|---|
| AC1 | `lib/canonical.ts` exports `pageCanonical(path)` | ✅ |
| AC2 | Returns `{ canonical: string }` shape matching `Metadata.alternates` | ✅ |
| AC3 | Validates path starts with `/`, throws clear error otherwise | ✅ |
| AC4 | Strips query string from path | ✅ test |
| AC5 | Strips hash fragment from path | ✅ test |
| AC6 | Normalizes trailing slash (preserves root `/`) | ✅ test |
| AC7 | Root path `/` returns bare `BASE_URL` (no trailing slash) | ✅ test |
| AC8 | Imports `BASE_URL` from `lib/seo-data` (single source of truth) | ✅ |
| AC9 | Unit tests cover happy path + edge cases + error paths | ✅ 14 tests |
| AC10 | `app/layout.tsx` no longer exports `alternates.canonical` | ✅ |
| AC11 | `app/layout.tsx` keeps `metadataBase` (used by openGraph.images) | ✅ |
| AC12 | Root layout has comment explaining WHY canonical was removed | ✅ |
| AC13 | All static indexable pages export own `alternates: pageCanonical()` | ✅ |
| AC14 | All dynamic `generateMetadata` exporters return `alternates: pageCanonical()` | ✅ 5 files |
| AC15 | Gated/private pages use `robots: { index: false, follow: false }` instead | ✅ 3 files |
| AC16 | Layout-level canonical only for client-component-child single-page subtrees | ✅ 2 files (`/kariera`, `/recenze`) |
| AC17 | `dily/znacka/[brand]` has own canonical | ✅ |
| AC18 | `dily/znacka/[brand]/[model]` has own canonical | ✅ |
| AC19 | `dily/znacka/[brand]/[model]/[rok]` has own canonical | ✅ |
| AC20 | Build passes (no TS errors) | ✅ |
| AC21 | Lint passes (0 errors) | ✅ |
| AC22 | All canonical-related unit tests pass | ✅ 14/14 |
| AC23 | Zero hardcoded `canonical: \`${BASE_URL}` patterns remain in `app/` | ✅ grep verified |

---

## Code review (`/simplify`)

Three review agents (reuse, quality, efficiency) ran in parallel.

**Reuse:** No duplication. `BASE_URL` import correct. Next.js native
alternative via `metadataBase` + relative `canonical: "/path"` exists, but
helper retains value via validation/normalization.

**Quality:** Found 2 real issues in test file:
- Duplicate test (root path tested twice) → **deleted**
- Misleading "diakritika" test using ASCII path → **rewritten** with real
  diacritic input `/dily/značka/škoda`

All other comments and structure justified (load-bearing WHY, not WHAT).

**Efficiency:** Ship as-is. No hot-path bloat. The two `pageCanonical()`
calls in `nabidka/[slug]/page.tsx` (vehicle vs listing branches) are
mutually exclusive — hoisting would compute on the `notFound()` path.

---

## Out of scope (deferred)

- **#127b — Subdomain canonical handling** (`shop.carmakler.cz/...`,
  `inzerce.carmakler.cz/...`). Phase 1 covers apex domain only. Subdomain
  pages will need own helper variant or `lib/urls.ts` integration.
- **Pre-existing duplicate `BASE_URL`** at `app/layout.tsx:14` vs
  `lib/seo-data.ts` — predates #127, separate cleanup ticket.
- **Sequential prisma queries** in `nabidka/[slug]/page.tsx:42-65` — perf
  optimization, separate ticket.
