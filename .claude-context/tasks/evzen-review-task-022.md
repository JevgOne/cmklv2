# Evžen Review: TASK-022 — SSR migrace Fáze 2 (layouts + kariera)

**Datum:** 2026-05-07
**Commit:** b3af53d
**Rozsah:** 6 souborů (2 layout.tsx + 1 page.tsx + 3 client islands)
**Verdikt:** SCHVÁLENO

---

## 1. Kontrola vs zadání

| # | Kritérium | Výsledek |
|---|-----------|----------|
| 1 | Žádné "use client" na layout/page | ✅ 3/3 — odebráno z muj-ucet/layout, moje-inzeraty/layout, kariera/page |
| 2 | Client logika v oddělených komponentách | ✅ AccountSidebarNav, InzeratyNav, ScrollToFormButton |
| 3 | Client islands mají "use client" | ✅ Ověřeno: AccountSidebarNav.tsx, ScrollToFormButton.tsx |
| 4 | Metadata na kariera/page | ✅ title, description, openGraph, alternates/canonical |
| 5 | Suspense kde potřeba | ✅ N/A — `usePathname` nevyžaduje Suspense (správné chování) |
| 6 | min-w-0 na flex-1 content | ✅ Oba layouty mají `<div className="flex-1 min-w-0">` |
| 7 | Build OK | ✅ |
| 8 | Lint OK | ✅ |

---

## 2. Namátková kontrola

### muj-ucet/layout.tsx ✅
- Odebráno "use client", `usePathname`, navItems, Link, cn
- Vše přesunuto do `AccountSidebarNav` (ověřeno "use client" na řádku 1)
- Layout je čistý Server Component — HTML shell + `{children}`

### moje-inzeraty/layout.tsx ✅
- Stejný vzor — nav extrahována do `InzeratyNav`

### kariera/page.tsx ✅
- Odebráno "use client"
- Přidáno `metadata` s kompletním SEO (title, description, OG, canonical)
- `Button` s `onClick` extrahován do `ScrollToFormButton` — 18 řádků, úzce zaměřená komponenta
- Button text zachován: "Mám zájem" (celý název, žádná zkratka) ✅

### ScrollToFormButton.tsx ✅
- "use client" na řádku 1
- Přesně kopíruje původní onClick logiku: `document.getElementById("kariera-form")?.scrollIntoView(...)`
- Žádný ztracený kód

---

## 3. Evženovy kontrolní body

| Pravidlo | Výsledek |
|----------|----------|
| Žádné zkratky v UI | ✅ Texty zachovány: "Mám zájem", "Moje inzeráty", "Nový inzerát", nav items beze změn |
| Nic se neschovává | ✅ Všechny nav položky zachovány v client islands |
| Nic se nemaže | ✅ Kód přesunut, ne smazán |
| Nedokončené = označeno | ✅ N/A |

---

## 4. Verdikt

**SCHVÁLENO** — Fáze 2 SSR migrace odpovídá zadání. 2 layouty + 1 page jsou Server Components, client logika správně extrahována. Žádná funkčnost ztracena, žádné UI texty zkráceny.
