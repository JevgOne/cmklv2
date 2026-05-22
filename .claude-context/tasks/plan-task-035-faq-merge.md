# Plán — TASK-035 FAQ merge

**Datum:** 2026-04-16 · **Autor:** PLANOVAČ · **Effort:** 30-40 min · **Risk:** STŘEDNÍ (7 importů) · **1 commit**

## §1 Ověřené cesty + velikosti
- `components/web/FAQ.tsx` — 73 ř., `"use client"`, props `{ items }`, **card variant** (rounded-xl border), **bez** section/title
- `components/web/FaqSection.tsx` — 83 ř., `"use client"`, props `{ items, title? }` default `"Často kladené otázky"`, **divider variant** (border-b), **se** section wrapperem + H2 + max-w-3xl + `items.length === 0 → null`
- Oba mají identickou SVG chevron + `grid-rows-[1fr|0fr]` animaci = 0 functional rozdíl, jen styling

## §2 Rozdíly (tabulka)
| Aspekt | FAQ.tsx | FaqSection.tsx |
|---|---|---|
| Wrapper | `<div className="flex flex-col gap-3">` | `<section py-12 md:py-16><div max-w-3xl mx-auto>` + `<h2 title>` |
| Item styling | card: `bg-white rounded-xl border` + mezery gap-3 | divider: `border-b border-gray-200` bez mezer |
| Answer padding | `px-4 sm:px-6 pb-4 sm:pb-5` | `pb-5` (žádné x-padding) |
| Empty guard | chybí | `if (items.length === 0) return null` |
| Title | NE | volitelný, default "Často kladené otázky" |

## §3 Použití (7 importů)
**FAQ (3):** `app/(web)/chci-prodat/page.tsx:4,254` · `components/web/ServicePage.tsx:2,144` · `app/(web)/makleri/[slug]/page.tsx:12,425`
**FaqSection (4):** `components/web/PriceCalculator.tsx:5,220` · `components/web/VehicleLandingPage.tsx:2,3,167` (importuje i `FaqSectionItem` typ) · `app/(web)/jak-prodat-auto/page.tsx:3,229` · `app/(web)/dily/kategorie/[slug]/page.tsx:4,122`

## §4 Kanonický = `FAQ.tsx` (ponechat), `FaqSection.tsx` smazat
**Důvody:** kratší name; `FAQItem` typ už exportován; FAQ je používáno v 3 stránkách = méně inline stylů k migraci; title variant je aditivní feature přidaná do FAQ.

## §5 Nové API `FAQ.tsx`
```tsx
export interface FAQItem { question: string; answer: string; }
export interface FAQProps {
  items: FAQItem[];
  title?: string;                    // pokud set → renderuje <section>+<h2>+max-w-3xl wrapper
  variant?: "card" | "divider";      // default "card"
}
```
**Chování:**
- `items.length === 0` → `return null` (převzato z FaqSection)
- Bez `title` → raw `<div className="flex flex-col gap-3">` (aktuální FAQ)
- S `title` → `<section className="py-12 md:py-16"><div max-w-3xl mx-auto><h2>{title}</h2>{accordion}</div></section>`
- `variant="card"` → item = `bg-white rounded-xl border-gray-200`, `flex flex-col gap-3` mezi itemy, answer `px-4 sm:px-6 pb-4 sm:pb-5`
- `variant="divider"` → item = `border-b border-gray-200` bez card, žádný gap, answer `pb-5`

## §6 Migrace — 7 diffs

| # | Soubor:řádek | Z | Na |
|---|---|---|---|
| 1 | `PriceCalculator.tsx:5` | `import { FaqSection } from "@/components/web/FaqSection";` | `import { FAQ } from "@/components/web/FAQ";` |
| 1b | `PriceCalculator.tsx:220` | `<FaqSection items={faqItems} />` | `<FAQ items={faqItems} variant="divider" title="Často kladené otázky" />` |
| 2 | `VehicleLandingPage.tsx:2-3` | `import { FaqSection } from "./FaqSection";` + `import type { FaqSectionItem } from "./FaqSection";` | `import { FAQ, type FAQItem } from "./FAQ";` |
| 2b | `VehicleLandingPage.tsx:167` | `<FaqSection items={faqItems} />` | `<FAQ items={faqItems} variant="divider" title="Často kladené otázky" />` |
| 2c | Uvnitř souboru, kde je `FaqSectionItem[]` typ | replace `FaqSectionItem` → `FAQItem` (grep v souboru) | — |
| 3 | `jak-prodat-auto/page.tsx:3,229` | stejně | `<FAQ items={faqItems} variant="divider" title="Často kladené otázky" />` |
| 4 | `dily/kategorie/[slug]/page.tsx:4,122` | stejně | `<FAQ items={category.faqItems} variant="divider" title="Často kladené otázky" />` |

FAQ.tsx 3 existující usery **beze změny** (ponechají default `variant="card"`, bez `title`).

## §7 Akce (krok za krokem)
1. Přepsat `components/web/FAQ.tsx` na nové API (§5) — ~100 ř.
2. Aplikovat 7 diffů z §6 (4 soubory pro FaqSection migraci).
3. `git rm components/web/FaqSection.tsx` (83 ř. pryč).
4. `npm run lint && npm run build`. Pokud TS error "FaqSectionItem not found" → opravit v VehicleLandingPage.tsx (zkontrolovat další vnitřní výskyty typu).
5. Chrome smoke test: `/chci-prodat`, `/makleri/marek-jezek`, `/jak-prodat-auto`, `/dily/kategorie/motor`, `/kolik-stoji-moje-auto`, `/sluzby/proverka` (ServicePage), brand landing (VehicleLandingPage).

## §8 Commit
```
refactor(faq): merge FAQ.tsx + FaqSection.tsx into single component (remove duplication)

- FAQ.tsx rozšířen o title? + variant "card"|"divider" props
- 4 FaqSection importy migrovány na FAQ s variant="divider" + title
- VehicleLandingPage: FaqSectionItem → FAQItem
- FaqSection.tsx smazán (83 ř.)
Task #35 / Vlna 2 z TASK-033
```

## §9 AC (6)
1. `npm run build` prochází bez error
2. `grep "FaqSection"` → 0 výskytů
3. 3 původní FAQ usery (chci-prodat/ServicePage/makleri) vizuálně beze změny
4. 4 migrované usery mají H2 "Často kladené otázky" + divider style (žádné cards)
5. Prázdné items → `<FAQ items={[]} />` vrací `null`
6. Accordion chevron + animace funguje stejně ve všech 7 místech

## §10 Risk / Escalate
- TS chyba v `VehicleLandingPage.tsx` kvůli `FaqSectionItem` → **STOP**, najdi všechny výskyty typu a přemap na `FAQItem`
- Vizuální regrese v některém z 7 míst → **STOP**, report team-leadovi screenshot
- Empty state `return null` change → zkontrolovat jestli nějaký user nepočítal s render vždy (pravděpodobně ne)
