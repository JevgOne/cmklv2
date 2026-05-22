# QA Report: SSR migrace Fáze 4 — eshop (commit 11abcb3)

**Datum:** 2026-05-07  
**Reviewer:** kontrolor  
**Commit:** `11abcb3d8f26f5a76b14794850bd77cc1c28ced4`  
**Rozsah:** 8 souborů — 5 page.tsx + 3 nové client islands

---

## A) Simplify kontrola

✅ **ČISTÝ REFACTOR**

- `hlidaci-pes/page.tsx` — tenkný SSR wrapper (34 řádků), logika v `WatchdogManager`
- `reklamace/page.tsx` — SSR + business logic guard (status !== "DELIVERED")
- `vraceni/page.tsx` — SSR + guard + proper serialization
- `potvrzeni` stránky (dily + shop) — správně `async` kvůli `await searchParams` (Next.js 15)
- 3 nové client islands úzce zaměřené

**Drobná poznámka (nekritická):** `dily/objednavka/potvrzeni/page.tsx` obsahuje několik textů bez diakritiky (řádky 43-51: "Ulozte si tento odkaz", "Sledovat objednavku", "Vytvorit ucet"). Není bloker, ale UI copy by měla být opravena.

---

## B) Debug kontrola

**npm run build:** ✅ exit 0, 0 errors  
**npm run lint:** ✅ 0 errors, 683 warnings (ext. deps)

---

## C) Reverzní kontrola

### 1. Žádný "use client" na page.tsx (5/5)

| Stránka | "use client"? |
|---------|--------------|
| `dily/objednavka/potvrzeni/page.tsx` | ✅ NE |
| `muj-ucet/hlidaci-pes/page.tsx` | ✅ NE |
| `shop/moje-objednavky/[id]/reklamace/page.tsx` | ✅ NE |
| `shop/moje-objednavky/[id]/vraceni/page.tsx` | ✅ NE |
| `shop/objednavka/potvrzeni/page.tsx` | ✅ NE |

### 2. Client islands mají "use client" (3/3)

- `ClaimForm.tsx` ✅
- `ReturnForm.tsx` ✅
- `WatchdogManager.tsx` ✅

### 3. Prisma queries na serveru

| Stránka | Prisma? | Auth? |
|---------|---------|-------|
| `dily/objednavka/potvrzeni` | — (searchParams only, žádný DB) | — |
| `hlidaci-pes` | ✅ `watchdog.findMany` | ✅ getServerSession + redirect |
| `reklamace` | ✅ `order.findFirst` + `notFound()` | ✅ getServerSession + redirect |
| `vraceni` | ✅ `order.findFirst` | ✅ getServerSession + redirect |
| `shop/objednavka/potvrzeni` | — (searchParams only) | — |

### 4. Date serializace

| Stránka | Date handling | Status |
|---------|---------------|--------|
| `hlidaci-pes` | `wd.createdAt.toISOString()` → WatchdogManager | ✅ |
| `reklamace` | select bez Date polí (no dates in select) → ClaimForm | ✅ |
| `vraceni` | `order.deliveredAt?.toISOString() ?? null` → ReturnForm | ✅ |
| `potvrzeni` stránky | No DB, searchParams as strings | ✅ |

### 5. Next.js 15 searchParams pattern

Obě `potvrzeni` stránky správně používají `async` funkci s `await searchParams` (Promise<> pattern):
```tsx
searchParams: Promise<{ id?: string; tracking?: string }>
const { id, tracking } = await searchParams;
```
✅ Správný Next.js 15 pattern.

---

## Výsledek

✅ **SCHVÁLENO — všechna kritéria splněna na 5/5 stránkách.**

Drobná nekritická poznámka: texty bez diakritiky v `dily/objednavka/potvrzeni/page.tsx` (řádky 43, 49, 57, 62, 69).
