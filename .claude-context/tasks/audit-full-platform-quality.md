# Audit kvality — Carmakler platforma

**Datum:** 2026-05-23  
**Metoda:** `npm run build`, Glob error.tsx/loading.tsx, Grep anti-patterns, Read klíčových souborů  
**Build výsledek:** ❌ SELHÁNÍ (TypeScript error v `lib/validators/workflow.ts`)

---

## CRITICAL

### 1. BUILD SELHAL — `lib/validators/workflow.ts:16`

```
Type error: Expected 2-3 arguments, but got 1.
  metadata: z.record(z.unknown()).optional(),
```

**Příčina:** Zod v4 (`^4.3.6`) vyžaduje 2 argumenty pro `z.record()` — `z.record(keyType, valueType)`.  
Stávající kód: `z.record(z.unknown())` — 1 argument → TypeScript error, build padá.

**Fix:** `z.record(z.string(), z.unknown())` na řádku 16.

> Toto je jediný build-breaking problém. Jinak by build prošel.

---

## HIGH — Chybějící error.tsx (dynamic routes)

Všechny dynamic slug/id routes by měly mít vlastní `error.tsx` pro UX — bez ní se chyba propaguje až k `app/(web)/error.tsx` (generická stránka).

| Route | error.tsx | loading.tsx |
|---|---|---|
| `app/(web)/nabidka/[slug]/` | ❌ CHYBÍ | ✅ |
| `app/(web)/shop/produkt/[slug]/` | ❌ CHYBÍ | ❌ CHYBÍ |
| `app/(web)/profil/[slug]/` | ❌ CHYBÍ | ✅ |
| `app/(web)/makleri/[slug]/` | ❌ CHYBÍ | ✅ |
| `app/(web)/autoservisy/[slug]/` | ❌ CHYBÍ | ✅ |
| `app/(web)/stk/[slug]/` | ❌ CHYBÍ | ✅ |
| `app/(web)/bazar/[slug]/` | ❌ CHYBÍ | ✅ |
| `app/(web)/marketplace/deals/[id]/` | ❌ CHYBÍ | ✅ |

**Nejvyšší priorita:** `/nabidka/[slug]/` (core funnel vozidel) a `/shop/produkt/[slug]/` (chybí navíc i loading.tsx).

---

### `alert()` v admin panelu — 4 výskyty

Neprofesionální browser dialogy v produkci:

| Soubor | Řádek | Text |
|---|---|---|
| `app/(admin)/admin/blog/BlogArticlesTable.tsx` | 57 | `alert("Chyba při publikování")` |
| `app/(admin)/admin/blog/BlogArticlesTable.tsx` | 69 | `alert("Chyba při mazání")` |
| `app/(admin)/admin/blog/BlogArticlesTable.tsx` | 84 | `alert("Chyba při archivaci")` |
| `app/(admin)/admin/dashboard/ExportButton.tsx` | 42 | `alert("Export se nezdařil. Zkuste to znovu.")` |

Nahradit toast notifikacemi nebo inline error stavy.

---

## MEDIUM

### Chybějící error.tsx (ostatní stránky)

| Route | error.tsx | loading.tsx |
|---|---|---|
| `app/(web)/hledat/` | ❌ CHYBÍ | ✅ |
| `app/(web)/recenze/` | ❌ CHYBÍ | ✅ |
| `app/(web)/kariera/` | ❌ CHYBÍ | ✅ |
| `app/(web)/chci-prodat/` | ❌ CHYBÍ | ✅ |
| `app/(pwa)/makler/vehicles/new/equipment/` | ❌ CHYBÍ | — |

Poznámka: `/equipment/` je jediný wizard krok bez `error.tsx` — všechny ostatní kroky (vin, contact, inspection, photos, details, pricing, review) ho mají.

---

### `console.log` v produkčním PWA komponentu

`components/pwa/OnlineSync.tsx:55,143`

```typescript
// Řádek 55:
console.log(`[OnlineSync] VIN duplicate, removing action ${action.id}`);
// Řádek 143:
console.log(`[OnlineSync] Vehicle synced: ${vehicleId}`);
```

Ladicí logy v produkčním kódu — viditelné v konzoli na makléřových zařízeních.

---

## LOW

- **`app/(web)/nabidka/[slug]/`** — Lokace vozidla zobrazuje jen text s ikonou 📍, bez mapové integrace. Mapy.cz iframe existuje na `/kontakt`, ale zde chybí.

---

## Co je správně ✅

| Oblast | Status |
|---|---|
| No TODO/FIXME/placeholder texts | ✅ |
| No broken links (href="#") | ✅ |
| No @ts-ignore / @ts-nocheck | ✅ |
| No hardcoded localhost URLs | ✅ |
| Metadata na blog, cenik, shop produktech | ✅ |
| VehicleDetailTabs — Server Component (bez "use client") | ✅ |
| ProductDetailTabs — Server Component (bez "use client") | ✅ |
| Console.log v web/admin komponentech | ✅ žádné |
| PWA wizard error.tsx (7/8 kroků) | ✅ |
| Admin error.tsx coverage | ✅ kompletní |
| PWA error.tsx coverage | ✅ kompletní |
| Diakritika v UI textech | ✅ |

---

## Akční plán (prioritizováno)

### P1 — IHNED (build broken)
- [ ] `lib/validators/workflow.ts:16` — `z.record(z.unknown())` → `z.record(z.string(), z.unknown())`

### P2 — HIGH (UX/production issues)
- [ ] Přidat `error.tsx` + `loading.tsx` do `app/(web)/shop/produkt/[slug]/`
- [ ] Přidat `error.tsx` do `app/(web)/nabidka/[slug]/`
- [ ] Přidat `error.tsx` do ostatních dynamic routes (profil, makleri, autoservisy, stk, bazar, deals)
- [ ] Nahradit `alert()` toasty v admin panelu (4 výskyty)

### P3 — MEDIUM
- [ ] Přidat `error.tsx` do hledat, recenze, kariera, chci-prodat
- [ ] Přidat `error.tsx` do `/makler/vehicles/new/equipment/`
- [ ] Odstranit `console.log` z `components/pwa/OnlineSync.tsx`

### P4 — LOW
- [ ] Zvážit mapovou integraci na detailu vozidla
