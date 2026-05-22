# Chrome Test — Task #42 Fake recenze → DB model
**Datum:** 2026-04-28  
**Tester:** test-chrome agent  
**Prostředí:** localhost:3000 (dev server)

---

## Výsledek: ❌ FAIL — 1 kritická chyba

---

## 1. HTTP Status Check

| Route | Local (dev) | Produkce |
|-------|------------|---------|
| `/` (homepage) | **500 ❌** | 200 ✅ |
| `/recenze` | 200 ✅ | 200 ✅ |
| `/chci-prodat` | 200 ✅ | 200 ✅ |
| `/admin/reviews` | 307 ✅ | 307 ✅ |
| `/api/admin/reviews` | 403 ✅ | 404* |

*Produkce 404 pro admin API je **EXPECTED** — Task #42 není commitnutý/nasazený na produkci.

---

## 2. Kritická chyba — Homepage 500

**Chyba:** `PrismaClientKnownRequestError: The table 'public.Review' does not exist in the current database.`

**Zdroj:** `app/(web)/page.tsx:195` — `const testimonials = await prisma.review.findMany(...)`

**Příčina:** Review tabulka NEEXISTUJE v lokální dev DB. Migration nebyla spuštěna lokálně.

**Stav Task #42 v gitu:** NENÍ commitnutý (pracovní strom, žádný commit pro tyto změny).

**Produkce:** Funguje — migration `20260427070000_carmarketplace_mvp_schema` tam byla aplikována, ale **Task #42 kód tam není** (produkce má stará hardcoded data).

**Fix potřebný:**
1. Spustit lokální migraci: `npx prisma migrate reset --force` (per recurring tsvector drift fix)
2. Přidat try/catch do `app/(web)/page.tsx:195` — defenzivní kód:
   ```ts
   const testimonials = await prisma.review.findMany({...}).catch(() => []);
   ```

---

## 3. Co funguje ✅

| Oblast | Stav |
|--------|------|
| Fake jména odstraněna (grep = 0 výsledků) | ✅ |
| `/recenze/page.tsx` — DB query, empty state | ✅ |
| `/chci-prodat/page.tsx` — DB query testimonial | ✅ |
| `components/web/ReviewList.tsx` — nová komponenta | ✅ |
| `AdminSidebar` — Recenze link přidán | ✅ |
| `app/api/admin/reviews/route.ts` — existuje | ✅ |
| `app/api/admin/reviews/[id]/route.ts` — existuje | ✅ |
| `admin/reviews` page — auth guard (307) | ✅ |
| TypeScript: 0 errors (potvrzeno implementatorem) | ✅ |

---

## Požadované akce

1. **BLOCKING:** Implementator spustí `npx prisma migrate reset --force` (nebo `prisma migrate dev`) na lokálním dev
2. **BLOCKING:** Přidat `.catch(() => [])` na `prisma.review.findMany()` v `app/(web)/page.tsx:195` — aby homepage nespadla při DB výpadku nebo chybějící tabulce
3. Po fixu odešle implementator HOTOVO → re-test

---

## Verdikt: ❌ FAIL — homepage 500 blokuje
