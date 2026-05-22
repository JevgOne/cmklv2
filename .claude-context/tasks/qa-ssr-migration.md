# QA Report: SSR Migrace — 41 stránek
**Datum:** 2026-05-08  
**Kontrolor:** kontrolor  
**Rozsah:** 41 migrovaných page.tsx souborů (commits 2b81c9d → 0d14f0e)

---

## 1. Debug kontrola

### npm run build
```
✓ Compiled successfully in 29.5s
✓ Running TypeScript (clean — 0 errors)
✓ Generating static pages using 7 workers (1302/1302) in 41s
```
**Výsledek: ✅ BUILD PASSED**

### npm run lint
```
0 errors, 697 warnings
```
697 warnings = vše na řádku 2 minifikovaného souboru (service worker JS) — **ne zdrojový kód**.

Reálné source-level warnings (pre-existing, NESOUVISÍ se SSR migrací):
- `admin/manager/approvals/page.tsx:139` — `Date.now()` v JSX render (impure function, React rule)
- `partner/profile/page.tsx:13` — unused variable `partner`
- Více souborů — `<img>` místo `<Image />` z next/image
- Více souborů — `<a>` místo `<Link />` z next/link

**Výsledek: ✅ LINT PASSED (0 errors)**

---

## 2. Reverzní kontrola — bod po bodu

### Kritéria:
- ✅ Žádný `"use client"` v migrovaných page.tsx
- ✅ Přímé Prisma query (tam kde data potřeba)
- ✅ Správný auth check (getServerSession nebo middleware)

### Výsledky (41 souborů):

| Stránka | use client | Prisma | Auth | Status |
|---------|-----------|--------|------|--------|
| `(admin)/admin/reviews/page.tsx` | ❌ | ✅ | middleware.ts | ✅ |
| `(admin)/admin/team/page.tsx` | ❌ | ✅ | middleware.ts | ✅ |
| `(pwa)/makler/vehicles/new/contact/page.tsx` | ❌ | — | middleware.ts | ✅ |
| `(pwa)/makler/vehicles/new/details/page.tsx` | ❌ | — | middleware.ts | ✅ |
| `(pwa)/makler/vehicles/new/equipment/page.tsx` | ❌ | — | middleware.ts | ✅ |
| `(pwa)/makler/vehicles/new/inspection/page.tsx` | ❌ | — | middleware.ts | ✅ |
| `(pwa)/makler/vehicles/new/photos/page.tsx` | ❌ | — | middleware.ts | ✅ |
| `(pwa)/makler/vehicles/new/pricing/page.tsx` | ❌ | — | middleware.ts | ✅ |
| `(pwa)/makler/vehicles/new/review/page.tsx` | ❌ | — | middleware.ts | ✅ |
| `(pwa)/makler/vehicles/new/success/page.tsx` | ❌ | — | middleware.ts | ✅ |
| `(pwa)/makler/vehicles/new/vin/page.tsx` | ❌ | — | middleware.ts | ✅ |
| `(pwa)/makler/vehicles/quick/success/page.tsx` | ❌ | — | middleware.ts | ✅ |
| `(web)/dily/katalog/page.tsx` | ❌ | ✅×2 | veřejné | ✅ |
| `(web)/dily/moje-objednavky/page.tsx` | ❌ | ✅ | getServerSession | ✅ |
| `(web)/dily/objednavka/potvrzeni/page.tsx` | ❌ | — | veřejné (URL params) | ✅ |
| `(web)/kariera/page.tsx` | ❌ | — | veřejné (statická) | ✅ |
| `(web)/login/page.tsx` | ❌ | — | veřejné (form) | ✅ |
| `(web)/moje-inzeraty/[id]/page.tsx` | ❌ | ✅ | getServerSession | ✅ |
| `(web)/moje-inzeraty/page.tsx` | ❌ | ✅×2 | getServerSession | ✅ |
| `(web)/muj-ucet/dotazy/page.tsx` | ❌ | ✅ | getServerSession | ✅ |
| `(web)/muj-ucet/garaz/page.tsx` | ❌ | ✅ | getServerSession | ✅ |
| `(web)/muj-ucet/hlidaci-pes/page.tsx` | ❌ | ✅ | getServerSession | ✅ |
| `(web)/muj-ucet/oblibene/page.tsx` | ❌ | ✅ | getServerSession | ✅ |
| `(web)/muj-ucet/page.tsx` | ❌ | ✅×4 Promise.all | getServerSession | ✅ |
| `(web)/muj-ucet/poptavky/page.tsx` | ❌ | ✅ | getServerSession | ✅ |
| `(web)/muj-ucet/profil/page.tsx` | ❌ | ✅×2 (!) | getServerSession | ⚠️ |
| `(web)/muj-ucet/profil/setup/page.tsx` | ❌ | — | getServerSession | ✅ |
| `(web)/overeni-emailu/chyba/page.tsx` | ❌ | — | veřejné | ✅ |
| `(web)/registrace/dodavatel/page.tsx` | ❌ | — | veřejné (form) | ✅ |
| `(web)/registrace/makler/page.tsx` | ❌ | — | veřejné (form) | ✅ |
| `(web)/registrace/page.tsx` | ❌ | — | veřejné (form) | ✅ |
| `(web)/registrace/partner/page.tsx` | ❌ | — | veřejné (form) | ✅ |
| `(web)/reset-hesla/[token]/page.tsx` | ❌ | — | veřejné (form) | ✅ |
| `(web)/shop/katalog/page.tsx` | ❌ | ✅×2 | veřejné | ✅ |
| `(web)/shop/moje-objednavky/[id]/reklamace/page.tsx` | ❌ | ✅ | getServerSession | ✅ |
| `(web)/shop/moje-objednavky/[id]/vraceni/page.tsx` | ❌ | ✅ | getServerSession | ✅ |
| `(web)/shop/moje-objednavky/page.tsx` | ❌ | ✅ | getServerSession | ✅ |
| `(web)/shop/objednavka/potvrzeni/page.tsx` | ❌ | — | veřejné (URL params) | ✅ |
| `(web)/shop/objednavky/sledovani/[token]/page.tsx` | ❌ | ✅ | veřejné (token) | ✅ |
| `(web)/zapomenute-heslo/page.tsx` | ❌ | — | veřejné (form) | ✅ |
| `prezentace/page.tsx` | ❌ | — | veřejné (statická) | ✅ |

**Výsledek reverzní kontroly: 40/41 ✅ | 1 ⚠️**

---

## 3. Simplify kontrola

### ⚠️ NALEZENO: Duplicitní Prisma query

**Soubor:** `app/(web)/muj-ucet/profil/page.tsx` (řádky 11–46)

```typescript
// PROBLÉM: 2× prisma.user.findUnique pro stejný session.user.id
const [user, tagRecords] = await Promise.all([
  prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id, firstName, ... }, // 20 polí
  }),
  prisma.user.findUnique({          // ← REDUNDANTNÍ druhý dotaz
    where: { id: session.user.id }, // ← stejné where
    select: { tags: { ... } },
  }),
]);
```

**Oprava:** sloučit do jednoho dotazu:
```typescript
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: {
    id: true, firstName: true, ... // všechna pole z prvního dotazu
    tags: { select: { slug: true, label: true }, orderBy: { label: "asc" } },
  },
});
const initialTags = user?.tags ?? [];
```
Ušetří 1 DB round-trip při každém zobrazení stránky profilu.

### ✅ Bez problémů
- `muj-ucet/page.tsx` — 4× Prisma v `Promise.all` pro různé tabulky → správně (paralelní)
- Žádné `useState`/`useEffect`/`useRouter` ve všech 41 stránkách
- Žádné zbytečné `"use client"` přidány

---

## 4. Legitimní "use client" (NESOUVISÍ s migrací)

Tyto soubory správně ZůSTÁVAJÍ jako Client Components:
- Všechny `error.tsx` — Next.js vyžaduje error boundaries jako CC
- `dily/kosik/page.tsx`, `shop/kosik/page.tsx` — košík, potřebuje state
- `dily/objednavka/page.tsx`, `shop/objednavka/page.tsx` — checkout, potřebuje state
- `shop/produkt/[slug]/AddToCartButton.tsx`, `ProductDetailTabs.tsx` — interakce
- `(pwa)/makler/vehicles/quick/step1,2,3/page.tsx` — multi-step form state
- `(pwa)/makler/vehicles/[id]/edit/page.tsx` — edit form
- `(pwa)/makler/vehicles/new/layout.tsx` — multi-step form layout

---

## Souhrn

| Kontrola | Výsledek |
|----------|----------|
| Build | ✅ PASS — compiled, TypeScript clean |
| Lint | ✅ PASS — 0 errors |
| "use client" check | ✅ 41/41 page.tsx souborů bez "use client" |
| Auth check | ✅ Všechny chráněné stránky mají auth (getServerSession nebo middleware) |
| Přímé Prisma queries | ✅ Všude kde potřeba |
| React hooks v SSR | ✅ Žádné (useState/useEffect) |
| Simplify | ⚠️ 1 issue: duplicitní Prisma query v profil/page.tsx |

### Doporučení
- **Blocker:** ❌ Žádný — migrace je funkční a build prochází
- **Opravit:** `muj-ucet/profil/page.tsx` sloučit 2× `prisma.user.findUnique` do jednoho (minor optimization)
- **Pre-existing (mimo scope):** `Date.now()` v admin/manager/approvals/page.tsx, `<img>` místo `<Image />` v různých souborech
