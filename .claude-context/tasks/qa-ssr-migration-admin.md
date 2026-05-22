# QA Report: SSR Migrace — Admin panel (Task #6)
**Datum:** 2026-05-08  
**Kontrolor:** kontrolor  
**Rozsah:** 12 admin stránek + 12 nových client island komponent

---

## 1. Debug kontrola

### "use client" check — page.tsx souborů
Všech 12 page.tsx: **0× "use client"** ✅

### Lint — nové soubory
```
0 errors, 1 warning
AdminOrdersContent.tsx:188 — ternary expression used for side effects (Set.delete/Set.add)
```
**Výsledek: ✅ 0 ERRORS**

---

## 2. Reverzní kontrola — 12 stránek

| Stránka | use client | Prisma | Auth + role | async | Status |
|---------|-----------|--------|-------------|-------|--------|
| `/admin/users` | ❌ | ✅ | ✅ ADMIN/BO/MGR | ✅ | ✅ |
| `/admin/orders` | ❌ | ✅ | ✅ ADMIN/BO/MGR | ✅ | ✅ |
| `/admin/parts` | ❌ | ✅×2 | ✅ ADMIN/BO/MGR | ✅ | ✅ |
| `/admin/suppliers` | ❌ | ✅×7 | ✅ ADMIN/BO/MGR | ✅ | ✅ |
| `/admin/returns` | ❌ | ✅×2 | ✅ ADMIN/BO/MGR | ✅ | ✅ |
| `/admin/returns/[id]` | ❌ | ✅ | ✅ ADMIN/BO/MGR | ✅ | ✅ |
| `/admin/feeds` | ❌ | ✅ | ✅ ADMIN/BO/MGR | ✅ | ✅ |
| `/admin/feeds/[id]` | ❌ | ✅ | ✅ ADMIN/BO/MGR | ✅ | ✅ |
| `/admin/feeds/new` | ❌ | ✅ | ✅ ADMIN/BO/MGR | ✅ | ✅ |
| `/admin/vehicles/new` | ❌ | — | ✅ ADMIN/BO/MGR | ✅ | ✅ |
| `/admin/marketplace/[id]` | ❌ | ✅ | ✅ ADMIN/BO | ✅ | ✅ |
| `/admin/marketplace/applications/[id]` | ❌ | ✅ | ✅ ADMIN/BO | ✅ | ✅ |

### Client components — "use client" přítomen
Všech 12 nových komponent (`AdminXxxContent.tsx`): ✅ "use client" na řádku 1

### Pattern quality
- `export const dynamic = "force-dynamic"` — ✅ na všech stránkách
- `await params` (Next.js 15 async params) — ✅ správně v detail stránkách
- `notFound()` v detail stránkách — ✅ importováno a použito
- Serialization Date → `.toISOString()` — ✅

**Výsledek reverzní kontroly: 12/12 ✅**

---

## 3. Simplify kontrola

### ⚠️ Metadata titles — chybí diakritika

Všechny nové page.tsx mají metadata tituly bez háčků/čárek (pravděpodobně vygenerovány bez UTF-8):

| Soubor | Aktuální | Správně |
|--------|---------|---------|
| `users/page.tsx:9` | "Uzivatele \| Carmakler Admin" | "Uživatelé \| Carmakléř Admin" |
| `orders/page.tsx:9` | "Objednavky \| Carmakler Admin" | "Objednávky \| Carmakléř Admin" |
| `parts/page.tsx:9` | "Dily \| Carmakler Admin" | "Díly \| Carmakléř Admin" |
| `suppliers/page.tsx:9` | "Dodavatele \| Carmakler Admin" | "Dodavatelé \| Carmakléř Admin" |
| `returns/page.tsx` | "Reklamace \| Carmakler Admin" | "Reklamace \| Carmakléř Admin" |
| `feeds/page.tsx` | "Feed importy \| Carmakler Admin" | OK (bez diakritiky) |

**Dopad:** Browser tab a SEO metadata — malý, admin sekce není indexována.  
**Blocker:** Ne — funkčnost neovlivněno.

### ⚠️ Lint warning — ternary pro side effects

`AdminOrdersContent.tsx:188`:
```typescript
// STÁVAJÍCÍ (lint warning):
next.has(order.id) ? next.delete(order.id) : next.add(order.id);

// SPRÁVNĚ:
if (next.has(order.id)) next.delete(order.id);
else next.add(order.id);
```

### ✅ Bez problémů
- `suppliers/page.tsx` — 7× Prisma je oprávněných (suppliers+count v Promise.all, payoutAggregations, stats per supplier) — žádná duplikace
- `parts/page.tsx` — 2× Prisma (parts + count paginated) — správně v Promise.all
- Client components jsou thin wrappers, neobsahují Prisma ani fetch logiku

---

## Souhrn

| Kontrola | Výsledek |
|----------|----------|
| Žádné "use client" v page.tsx | ✅ 12/12 |
| Client components mají "use client" | ✅ 12/12 |
| Auth + role check | ✅ 12/12 |
| Přímé Prisma queries | ✅ 11/12 (vehicles/new je pure form) |
| async page function | ✅ 12/12 |
| force-dynamic | ✅ 12/12 |
| Lint errors | ✅ 0 errors |

### Nálezy
- **Non-blocking ⚠️:** Metadata tituly bez diakritiky (kosmetické, admin není indexován)  
- **Non-blocking ⚠️:** 1 lint warning v AdminOrdersContent.tsx:188 (ternary side effect)

### Verdikt
**✅ MIGRACE PROŠLA — žádný blocker. Produkčně nasaditelné.**
