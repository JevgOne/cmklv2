# Evžen review — TASK-035 FAQ merge

## Check 1 — úplnost migrace
✅ — grep `FaqSection\|from.*FAQ"` dává přesně 7 importů:
- FAQ (3): `app/(web)/chci-prodat/page.tsx:4`, `components/web/ServicePage.tsx:2`, `app/(web)/makleri/[slug]/page.tsx:12`
- FaqSection (4): `components/web/PriceCalculator.tsx:5`, `components/web/VehicleLandingPage.tsx:2-3` (+ typ `FaqSectionItem` na ř. 23), `app/(web)/jak-prodat-auto/page.tsx:3`, `app/(web)/dily/kategorie/[slug]/page.tsx:4`
- Plán §6 pokrývá všechny 4 FaqSection usery + typ import ve VehicleLandingPage. Nic neminul.

## Check 2 — kanonická komponenta
✅ — `wc -l` potvrzuje: FAQ.tsx=73 ř., FaqSection.tsx=83 ř. Read potvrzuje: FAQ exportuje `FAQItem` typ, FaqSection exportuje `FaqSectionItem`. Důvody v §4 logické — kratší name, typ už exportován, 3 usery beze změny = méně inline stylů.

## Check 3 — backward compat
✅ — 3 FAQ usery volají `<FAQ items={...} />` bez `variant`/`title`. Plán §5 definuje default `variant="card"` + bez `title` → raw `<div className="flex flex-col gap-3">` = identický output jako dnes. Žádná breaking change.
- Drobný detail: plán §5 přidává `items.length === 0 → return null` i do default card větve → 3 stávající usery by teď také vracely null místo prázdného divu. NÍZKÉ RIZIKO (prázdný div = prázdný UI, null = stejný visual). Neblokuje.

## Check 4 — nic se neschovává
✅ — plán §7.3 explicitně `git rm components/web/FaqSection.tsx`. Žádná "deprecated" složka. Nové API v §5 pokrývá VŠE co FaqSection uměla: `title?` prop, `variant` pro divider styling, empty guard (`return null`), section+h2+max-w-3xl wrapper. Typ `FaqSectionItem` je remapován na `FAQItem` v §6 řádek 2c. Nic se neztrácí.

## Check 5 — žádné zkratky
✅ — všechny examples v §6 používají plný `title="Často kladené otázky"`. Žádné `Č.k.o.` ani jiné zkratky. Commit message v §8 v pořádku.

## Check 6 — rozhodnost
✅ — plán je rozhodný: 1 commit (§3 header), 1 kanonický soubor (§4), druhý smazán (§7.3). §6 má konkrétní tabulku 7 diffů s řádkovými čísly. Žádné "mohli bychom" / "zvažit". AC §9 má 6 měřitelných bodů. Risk §10 má jasné STOP triggery.

## Verdikt
✅ APPROVED

Pozn.: Drobná nekonzistence v §5 — empty guard je teď global (platí i pro card variant). Pokud team-lead chce striktní backward compat, nastavit empty guard jen pro `title` větev. Neblokující — UX rozdíl je 0 (prázdný UI v obou případech).
