# QA Report: SSR migrace Fáze 2 — layouts + kariera (commit b3af53d)

**Datum:** 2026-05-07  
**Reviewer:** kontrolor  
**Commit:** `b3af53d1e039a2acc6b8b65329a2cb47d6dcd34d`  
**Rozsah:** 6 souborů — 2 layout.tsx + 1 page.tsx + 3 nové client islands

---

## A) Simplify kontrola

✅ **ČISTÝ REFACTOR**

- `muj-ucet/layout.tsx` redukován na 22 řádků — sidebar navigation extrahována do `AccountSidebarNav`
- `moje-inzeraty/layout.tsx` redukován na 22 řádků — nav extrahována do `InzeratyNav`
- `kariera/page.tsx` zachovává plný obsah jako Server Component, přidána pouze extrakce `ScrollToFormButton`
- 3 nové client islands jsou úzce zaměřené (jednoúčelové komponenty)
- Žádné duplicity, žádný mrtvý kód

---

## B) Debug kontrola

**npm run build:**
- ✅ exit code 0, 0 errors

**npm run lint:**
- ✅ 0 errors
- ⚠️ 684 warnings (stejné jako dříve — ext. deps, ne projekt kód)

---

## C) Reverzní kontrola

### 1. muj-ucet/layout.tsx — SSR, AccountSidebarNav client island

| Kritérium | Status | Poznámka |
|-----------|--------|----------|
| Žádné "use client" na layout | ✅ | První řádek: import |
| AccountSidebarNav extrahován | ✅ | `components/web/AccountSidebarNav.tsx` |
| AccountSidebarNav má "use client" | ✅ | Správně — používá `usePathname` |
| Suspense kolem AccountSidebarNav? | ℹ️ | Není — nepotřeba (`usePathname` nevyžaduje Suspense) |
| `min-w-0` na flex-1 obsah | ✅ | `<div className="flex-1 min-w-0">` — správná CSS praxe |

### 2. moje-inzeraty/layout.tsx — SSR, InzeratyNav client island

| Kritérium | Status | Poznámka |
|-----------|--------|----------|
| Žádné "use client" na layout | ✅ | První řádek: import |
| InzeratyNav extrahována | ✅ | `components/web/InzeratyNav.tsx` |
| InzeratyNav má "use client" | ✅ | Správně — používá `usePathname` |
| Suspense kolem InzeratyNav? | ℹ️ | Není — nepotřeba (`usePathname` nevyžaduje Suspense) |
| `min-w-0` na flex-1 obsah | ✅ | `<div className="flex-1 min-w-0">` |

### 3. kariera/page.tsx — SSR, metadata, ScrollToFormButton

| Kritérium | Status | Poznámka |
|-----------|--------|----------|
| Žádné "use client" na page | ✅ | |
| export const metadata | ✅ | title, description, openGraph, alternates/canonical |
| ScrollToFormButton extrahován | ✅ | `components/web/ScrollToFormButton.tsx` |
| ScrollToFormButton má "use client" | ✅ | Správně — onClick handler |
| CareerForm (existující) | ✅ | Pouze `useState` — nevyžaduje Suspense |
| Stránka renderuje HTML shell bez JS | ✅ | Hero, Benefits, Positions, Cross-links jsou v SSC |

### Poznámka k Suspense

`usePathname` (Next.js) **nevyžaduje Suspense** — na rozdíl od `useSearchParams`. Layouts správně neobsahují Suspense boundary pro nav komponenty. Toto je technicky správné chování.

---

## Výsledek

✅ **SCHVÁLENO — všechna kritéria splněna na 3/3 souborech.**

Layouts jsou čisté Server Components, client islands jsou správně označeny "use client", kariera stránka má kompletní metadata včetně OpenGraph a canonical.
