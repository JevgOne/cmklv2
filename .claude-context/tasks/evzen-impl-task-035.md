# Evžen review — TASK-035 implementace (88ab61f)

## Check 1 — duplicita smazána
✅ — `ls components/web/FaqSection.tsx` → No such file. `grep "FaqSection"` v components/ + app/ → 0 hitů. Soubor skutečně pryč (diff: `-83 řádků`).

## Check 2 — rename typu
✅ — `grep "FaqSectionItem"` → 0 hitů. VehicleLandingPage.tsx používá `FAQItem` (ř. 2, 22). Plán §6 řádek 2c splněn.

## Check 3 — UI bez zkratek
✅ — všechny 4 migrované usery mají `title="Často kladené otázky"`:
- PriceCalculator.tsx:220, VehicleLandingPage.tsx:166, jak-prodat-auto/page.tsx:229, dily/kategorie/[slug]/page.tsx:122
- Žádné "FAQ", "Č.k.o." ani jiné zkratky jako heading. "FAQ" jen v komentářích `{/* FAQ */}` (neviditelné pro uživatele) a v názvu komponenty (code, OK).

## Check 4 — 1 commit
✅ — `git log 07fb6d7..HEAD` = 6 commits. Plán byl "1 commit pro Vlna 2" → `88ab61f refactor(faq): merge FAQ.tsx + FaqSection.tsx` = přesně 1 commit pro TASK-035. Vlna 1 (4a9cf5f + adf4880 + 464d8fd + f48d445 + 995b8b6 = 5) + Vlna 2 (1) = 6 celkem. Mírná odchylka od očekávání (5), ale plán TASK-035 měl "1 commit" a ten sedí.

## Check 5 — plán = impl
✅ — `git show 88ab61f --stat` = 6 souborů: 5 změněných + 1 smazaný (FaqSection.tsx, -83 ř.). Přesně sedí s plánem §6 tabulkou:
- FAQ.tsx (+45/-12) — rozšířeno o `title?` + `variant` dle §5
- PriceCalculator.tsx, VehicleLandingPage.tsx, jak-prodat-auto, dily/kategorie — 4 migrace dle §6
- FaqSection.tsx smazán dle §7.3
- FAQ.tsx implementace obsahuje empty guard (`if items.length===0 return null`), `variant="card"` default, `title` větev s `<section>+<h2>+max-w-3xl` wrapper — vše dle §5

## Verdikt
✅ APPROVED

Pozn.: Commit count 6 místo očekávaných 5 z toho review zadání — ale plán TASK-035 sám měl "1 commit" a ten dodržel. Vlna 1 měla 5 commits (nikoli 4 jak uvedeno v zadání), takže 5+1=6. Neblokuje.
