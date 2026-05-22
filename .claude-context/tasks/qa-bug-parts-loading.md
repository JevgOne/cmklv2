# QA Bug Report: Parent loading.tsx blokuje SSR obsah
**Datum:** 2026-05-08  
**Závažnost:** ⚠️ Medium — 2 stránky bez JS prázdné  
**Nalezl:** test-chrome, potvrdil: kontrolor

---

## Problém

`/parts/my` a `/parts/orders` se zobrazují prázdné bez JS navzdory SSR migraci.

## Root cause

`app/(pwa-parts)/parts/loading.tsx` **STÁLE EXISTUJE** a dle Next.js App Router pravidel vytváří Suspense boundary pro **daný segment A VŠECHNY JEHO POTOMKY** (`loading.js creates a loading UI for a segment AND ITS CHILDREN`).

```
app/(pwa-parts)/parts/
├── loading.tsx          ← ⚠️ PARENT SUSPENSE BOUNDARY (pro /parts/* vč. children)
├── my/
│   └── page.tsx         ← ❌ chybí my/loading.tsx → bubbluje na parent
├── orders/
│   └── page.tsx         ← ❌ chybí orders/loading.tsx → bubbluje na parent
└── page.tsx             ← ✅ má svůj loading (parts/loading.tsx)
```

Výsledek: SSR obsah `/parts/my` a `/parts/orders` je v `<div hidden id="S:0">` a bez JS zůstává neviditelný — spinner fallback z parent `loading.tsx` je zobrazen místo dat.

## Verifikace

```bash
$ cat app/(pwa-parts)/parts/loading.tsx
export default function SupplierDashboardLoading() { ... skeleton ... }

$ ls app/(pwa-parts)/parts/my/loading.tsx
# FILE NOT FOUND

$ ls app/(pwa-parts)/parts/orders/loading.tsx  
# FILE NOT FOUND
```

## Řešení — 2 možnosti

### Varianta A (doporučeno): Smazat parent loading.tsx
```bash
rm app/(pwa-parts)/parts/loading.tsx
```
**Pro:** Jednoduchá, okamžitá oprava.  
**Proti:** `/parts` root stránka ztratí loading skeleton (ale `/parts/page.tsx` je jen redirect na `/parts/my`, takže dopad minimální — ověřit!).

### Varianta B: Vytvořit loading.tsx pro každý child
Vytvořit `app/(pwa-parts)/parts/my/loading.tsx` a `app/(pwa-parts)/parts/orders/loading.tsx` s příslušnými skeletonami. Zachová loading state pro root page.

## Ověření po opravě

```bash
npx playwright test e2e/chrome-demo-no-js-fixed.spec.ts --headed --project=chromium --workers=1
```

Očekávané výsledky:
- `/parts/my` → obsah viditelný bez JS ✅
- `/parts/orders` → obsah viditelný bez JS ✅
