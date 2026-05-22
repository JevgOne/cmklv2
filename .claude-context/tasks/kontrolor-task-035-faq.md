# Kontrolor — TASK-035 FAQ merge

Commit: `88ab61f` — `refactor(faq): merge FAQ.tsx + FaqSection.tsx into single component`

## 1. Simplify

Kód `components/web/FAQ.tsx` (106 ř.) je čistý: ✅
- Jeden komponent, jeden `useState`, žádné duplicitní větve.
- Props pojmenovány smysluplně: `items`, `title?`, `variant?: "card" | "divider"` s defaultem `"card"`.
- `isDivider` flag zavedený jednou, používán přes `cn()` pro podmíněné třídy.
- Early return `items.length === 0 → null` zachován.
- `title` podmíněně obaluje do `<section><max-w-3xl><h2>` — jediná smysluplná divergence.
- Žádný mrtvý kód ani TODO.

## 2. Debug

- npm run build: ✅ (`Compiled successfully in 18.7s`, 1260 static pages vygenerováno)
- grep FaqSection (tsx/ts): 0 hits ✅
- grep FaqSectionItem (tsx/ts): 0 hits ✅
- Soubor `components/web/FaqSection.tsx`: smazán ✅

## 3. Reverzní kontrola

| # | Bod zadání | Status | Poznámka |
|---|------------|--------|----------|
| 1 | `title?` + `variant?: "card" \| "divider"` (default "card") | ✅ | Řádky 11-17 FAQ.tsx |
| 2 | Features FaqSection (section+h2+max-w-3xl; border-b; items===0→null; animace) | ✅ | Řádky 24, 28-89, 92-103 |
| 3 | Migrace 7 importů (4 změněné, 3 beze změny) | ✅ | Změněné: PriceCalculator, jak-prodat-auto, dily/kategorie/[slug], VehicleLandingPage; beze změny: ServicePage, chci-prodat, makleri/[slug] |
| 4 | Smazat `components/web/FaqSection.tsx` | ✅ | Diff `-83` ř. |
| 5 | Rename `FaqSectionItem` → `FAQItem` | ✅ | VehicleLandingPage.tsx ř. 2, 22 používá `FAQItem` |
| 6 | 1 commit | ✅ | `88ab61f` (6 souborů, +48 -99) |
| 7 | `npm run build` ✅ | ✅ | Compiled successfully, 0 errors |
| 8 | Žádné zkratky v UI ("Často kladené otázky") | ✅ | 4 call sites používají `title="Často kladené otázky"`, žádný "FAQ" v heading |

## Verdikt

✅ PASS — všech 8 bodů splněno, build zelený, grep čistý, kód simplify-friendly.
