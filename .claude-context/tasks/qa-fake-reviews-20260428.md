# QA Report — Task #42: Fake Recenze → DB Model

**Datum:** 2026-04-28  
**Autor:** Kontrolor  
**Status: ⚠️ SCHVÁLENO S BLOKEREM — 1 BUG musí být opraven**

---

## VERDICT

Architektura je správná. Model Review, migrace, admin API, admin UI, recenze/page.tsx, recenze/layout.tsx a chci-prodat/page.tsx jsou všechny implementovány správně. Fake jména smazána (grep = 0 výsledků).

**BLOKER:** `const testimonials` na řádku 195 v `app/(web)/page.tsx` je **module-level `await`** mimo komponentu — DB query se zavolá jednou při startu serveru a nikdy se neobnoví.

---

## 1. PŘEHLED KONTROL

### ✅ Fake jména odstraněna
```
grep "Jana K.\|Martin D.\|Tomáš H.\|Eva S.\|Pavel K.\|Marie L.\|Jiří N.\|Lucie V." app/ components/
→ 0 výsledků
```

### ✅ `app/(web)/recenze/page.tsx`
- Server component, `prisma.review.findMany({ where: { isPublished: true } })` ✅
- Empty state správný (ikona + email CTA) ✅
- Serialization: `createdAt.toISOString()` ✅
- ReviewList dostane správná data ✅

### ✅ `components/web/ReviewList.tsx`
- Tab filter (Všechny / Prodejci / Kupující) ✅
- Stars component (5 hvězd, oranžové/šedé) ✅
- Badge: SELLER → "Ověřený prodej", BUYER → "Ověřený nákup" ✅
- Empty state per tab ✅

### ✅ `app/(web)/recenze/layout.tsx`
- DB aggregate: `avgRating`, `reviewCount` z reálných dat ✅
- `generateAggregateRatingJsonLd()` — funkce existuje v `lib/seo.ts:593` ✅
- `reviews.length === 0` → `return <>{children}</>` — JSON-LD se nevykreslí pokud žádné recenze ✅
- Truncace textu na 200 znaků ✅

### ✅ `app/(web)/chci-prodat/page.tsx`
- `prisma.review.findFirst({ where: { isPublished: true, isFeatured: true, type: "SELLER" } })` uvnitř `Promise.all()` uvnitř `ChciProdatPage()` ✅
- Sekce se podmíněně renderuje dle výsledku ✅

### ✅ Admin API
- `GET /api/admin/reviews` — ADMIN/BACKOFFICE only, vrací všechny recenze ✅
- `POST /api/admin/reviews` — Zod validace (authorName min 2, text min 10, rating 1-5) ✅
- `PUT /api/admin/reviews/[id]` — partial update (všechna pole optional) ✅
- `DELETE /api/admin/reviews/[id]` — 404 safe catch ✅

### ✅ `app/(admin)/admin/reviews/page.tsx`
- CRUD: add, edit, delete ✅
- Toggle isPublished / isFeatured single click ✅
- Form validace: Zod na API straně, UI přijme error message ✅
- Loading/empty state ✅
- Sidebar link: `{ id: "reviews", href: "/admin/reviews", icon: "⭐", label: "Recenze" }` ✅

### ✅ Migrace
- `prisma/migrations/20260428060000_add_team_member/migration.sql` vytváří `"Review"` tabulku ✅
- Indexy: `Review_isPublished_idx`, `Review_isFeatured_idx` ✅
- Migrace deployuta na produkci (implementátor hlásí `prisma migrate deploy` SUCCESS) ✅

### ✅ Prisma schema
- `model Review` řádek 2490 s korektními fieldy ✅

---

## 2. BLOKER — module-level `await` v homepage

**Soubor:** `app/(web)/page.tsx:195-199`

```typescript
// ⚠️ BUGGY — module-level await mimo komponentu:
const testimonials = await prisma.review.findMany({
    where: { isPublished: true, isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
```

**Problém:** V Node.js ESM modul-level `await` způsobí, že hodnota `testimonials` se nastaví jednou při inicializaci modulu a pak je cachována v paměti. Revalidace (`export const revalidate = 3600`) obnoví výstup stránky, ALE `testimonials` se NEnačte znovu — bude stale od startu serveru.

Správné patterny z té samé stránky:
```typescript
// ✅ SPRÁVNĚ — async funkce nebo await uvnitř HomePage():
async function getFeaturedCars() { ... }
async function getFeaturedBrokers() { ... }

export default async function HomePage() {
  const cars = await getFeaturedCars();
  const brokers = await getFeaturedBrokers();
  // testimonials zde:
  const testimonials = await prisma.review.findMany({...});
}
```

**Fix (2 řádky):**
1. Odstranit `const testimonials = await ...` z module scope (řádek 195-199)
2. Přidat `const testimonials = await prisma.review.findMany({ where: { isPublished: true, isFeatured: true }, orderBy: { createdAt: "desc" }, take: 3 })` na řádek ~239 uvnitř `HomePage()` vedle `cars` a `brokers`

---

## ZÁVĚR

| Kontrola | Status |
|----------|--------|
| Fake jména odstraněna | ✅ |
| recenze/page.tsx | ✅ |
| recenze/layout.tsx | ✅ |
| ReviewList.tsx | ✅ |
| chci-prodat testimonial | ✅ |
| Admin API GET/POST | ✅ |
| Admin API PUT/DELETE | ✅ |
| Admin reviews page | ✅ |
| AdminSidebar link | ✅ |
| Prisma model | ✅ |
| Migrace | ✅ |
| **homepage testimonials** | **⚠️ BLOKER** |

**Status: ⚠️ SCHVÁLENO S BLOKEREM**

Jedno-řádkový fix (přesunout query do `HomePage()`). Po opravě → ✅ SCHVÁLENO.
