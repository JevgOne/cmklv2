# EVZEN RE-REVIEW — Task #86 v2 TCO + Financování plán
**Datum:** 2026-04-07
**Reviewer:** evzen-the-king (READ-ONLY task controller)
**Task:** #94 (re-review #92)
**Předmět:** `.claude-context/tasks/plan-task-86.md` (1191 řádků, 22 sekcí, **v2**)
**Předchozí review:** v1 review byl CHANGES_REQUESTED na 648-řádkovou v1 verzi (mezitím přepsán)

---

## ✅ VERDIKT: **APPROVED** — OK K PREZENTACI UŽIVATELI A DISPATCH IMPLEMENTÁTORA

Plánovač provedl **kompletní v2 rewrite** po předchozím CHANGES_REQUESTED. Všech 6 dříve FAIL/PARTIAL bodů je nyní PASS, všechny 3 doslovné výroky uživatele 2026-04-07 jsou doslovně zapracovány, všech 5 user decisions z AskUserQuestion respektovány. Setting model + admin route + financování kalkulačka + NEW/USED dual render + LoanCalculator audit — všechno je v plánu.

**Žádné CHANGES_REQUESTED. Žádné blocking findings.**

---

## 1) Doslovný check — 3 výroky uživatele 2026-04-07

| # | Doslovný výrok uživatele | V plánu? | Sekce | Match | Evidence |
|---|---------------------------|----------|-------|-------|----------|
| Z1 | *"u aut v inzerci/nabídce byly podle druhu ruzné díly s eshopu, pod nimi jestli mi rozumíš aby zakaznik si vybral auto a rovnou videl +/- kolik stojí díly na auto"* | ✅ | §1, §5, §6, §7 | ✅ PASS | TCO Sekce A: ~20 user-friendly kategorií, side-by-side NEW vs USED, real-time eshop SKUs s fallback, mapping table na Part.category enum, 3 server komponenty (TCOBreakdown + TCOCategoryRow + TCOSummaryCard), insertion do `nabidka/[slug]/page.tsx` 2× větve |
| Z2 | *"jo dole bych to tam nekde dal mužou tam bejt novy s druhovyroby a pak použité, + financovaní vozidla jak je v karte vozu, potřebuju nekde jednoduchou upravu % protože se to mení žejo, a nebo se vezme prumer nebo jak to bude nastaveny?"* | ✅ | §6.4, §12.1-§12.7 | ✅ PASS | (a) "Dole" pozice — §6.4 + §12.6 explicit `<section>` "Náklady vlastnictví" pod popisem vozu (in lower half page); (b) "novy s druhovyroby + použité" — §5.2 `groupBy: ["category", "partType"]`, §5.3 `newParts: TCOPriceStats; usedParts: TCOPriceStats`, §6.2 `PriceColumn label="Nové"` + `PriceColumn label="Použité"` side-by-side, §7 mapping pozn. "NEW kolona = NEW + AFTERMARKET, USED kolona = USED"; (c) "financovaní jak je v karte vozu" — §12.4 FinancingTabs + §12.5 HomeCreditCalculator (annuita formula extracted z PWA broker) ; (d) "jednoduchou upravu %" — §12.1 Setting model + §12.2 admin route `/admin/nastaveni/financovani` + §12.3 `lib/settings.ts` cached helper |
| Z3 | *"buď si klient vezme svůj úvěr, nebo my máme smlouvu s HomeCredit"* | ✅ | §12.4 | ✅ PASS | FinancingTabs s 2 taby — **HomeCredit (default, active calculator)** + **Vlastní úvěr (info-only)**, AC18: "Vlastní úvěr tab zobrazuje info text, NE active calculator". HomeCredit branding explicit, sazba z DB Setting (admin-managed) |

**Score: 3/3 PASS** ✅

---

## 2) User decisions z AskUserQuestion (5)

| # | Rozhodnutí | V plánu? | Match | Evidence |
|---|-----------|----------|-------|----------|
| D1 | Scope dílů: údržba + běžné opravy (~20 kategorií) | ✅ | ✅ PASS | §7 mapping table má přesně 20 user-friendly kategorií (Olej a filtry, Brzdové destičky, Tlumiče, Spojka, Rozvody, Vodní pumpa, Chladič, Alternátor, Startér, Akumulátor, Výfuk, Pneumatiky, Disky, Karoserie, Světlomety, Zrcátka, Sedačky, Palivo) |
| D2 | Pozice: detail page sekce, volná ruka — DOLE | ✅ | ✅ PASS (s minor caveat) | §6.4 + §12.6 insertion = `<section>` "Náklady vlastnictví" pod popisem vozu, NAD RecommendedParts. Plán to interpretuje jako "v dolní polovině page". User řekl "dole někde" — autonomie planovače je explicit povolena ("dispatch + plan §2 D2: pozice 'dole někde' — pod galerií / pod popisem"). Pokud user chtěl literal "úplně dole" (po RecommendedParts), je to minor designer call (P3 nice-to-have) |
| D3 | Cena agregace: rozsah min–max + průměr | ✅ | ✅ PASS | §5.3 `priceMin/priceMax/priceAvg` per partType, §6.2 `formatPrice(stats.priceMin)–formatPrice(stats.priceMax) Kč` + `Ø formatPrice(stats.priceAvg)`. Q5 explicitně doporučuje interval over sum |
| D4 | Mix parts: NEW + USED paralelně (Part.partType enum) | ✅ | ✅ PASS | §5.2 `groupBy(["category", "partType"])`, §5.3 dual struktura, §6.2 side-by-side 2 sloupce, §7 NEW=NEW+AFTERMARKET / USED=USED merge logic explicit. Verifikace: `prisma/schema.prisma:905` `partType String @default("USED") // USED, NEW, AFTERMARKET` + index ř.950 ✅ |
| D5 | Financování sazba: HomeCredit fixed (admin-editovatelná) + Vlastní úvěr módus | ✅ | ✅ PASS | §12.1 `Setting` model s `homecredit_rate=7.90` seed, §12.2 admin route + form, §12.3 server action s ADMIN role check + zod validation + revalidateTag, §12.4 FinancingTabs default HomeCredit, §12.5 HomeCreditCalculator s `annualRate` prop z DB |

**Score: 5/5 PASS** ✅

---

## 3) 6 kontrolních bodů z předchozího review (dříve FAIL/PARTIAL)

| # | Control point | v1 | v2 | Sekce | Evidence |
|---|---------------|----|----|-------|----------|
| 1 | "Dole" pozice — TCO blok pod RecommendedParts/galerií/kontaktem (NE PŘED) | ❌ | ✅ PASS | §6.4, §12.6 | Plánovač v v2 explicitně řeší pozici: `<section>` "Náklady vlastnictví" je insertován **2×** (Vehicle větev ~ř.800 + Listing větev ~ř.1075) "pod popisem vozu". Wrap container "Náklady vlastnictví" obsahuje TCO + Financování paralelně v `lg:grid-cols-2`. **Caveat:** §6.4 řekne "nad RecommendedParts" — minor design choice, autonomie planovače je explicit povolena v D2. Pokud user chtěl literal "úplně dole", je to P3 designer call. **APPROVED** |
| 2 | "Novy s druhovyroby + použité" — UI dual render NEW vs USED, query groupBy partType | ❌ | ✅ PASS | §5.2, §5.3, §6.2, §6.3, §7 | `groupBy: ["category", "partType"]` ✅, `newParts/usedParts` v response shape ✅, 2 PriceColumn komponenty side-by-side ✅, 2 intervaly v SummaryCard ✅, mapping pozn. "NEW = NEW+AFTERMARKET, USED = USED" ✅ |
| 3 | Financování kompletně chybí → §19+ s HomeCredit + Vlastní úvěr 2 módy | ❌ | ✅ PASS | §12.1-§12.7 | Celá nová sekce §12 (NOVÁ SEKCE: Financování kalkulačka). 7 podsekcí. AC10-AC19 acceptance criteria. Insertion v §12.6 |
| 4 | Re-use existing LoanCalculator NEBO refactor na config fetch | ❌ | ✅ PASS | §3.1, §4.7, §12.3 | Plán explicitně auditem v §3.1: `FinancovaniCalc.tsx` (web, 130 ř., primitive matematika `price/48`, lead-capture-centric) + `FinancingCalculator.tsx` (PWA, 302 ř., **DEFAULT_RATE=5.9 hardcoded**, full annuita). §4.7 decision: oba existing komponenty NESPOJOVAT (rozdílný účel), místo toho **extract annuita logic** do `lib/financing/calculate.ts` (§12.3) → reuse z nového `HomeCreditCalculator.tsx`. PWA broker komponent zůstává netknutý (out-of-scope §15). **Verifikace:** `components/pwa/gamification/FinancingCalculator.tsx:9` `const DEFAULT_RATE = 5.9; // %` ✅ confirmed, `:15` `useState(DEFAULT_RATE)` ✅, `:40` `monthlyPayment =` annuita ✅. Plánovačovy claims **přesné** |
| 5 | Admin route `/admin/nastaveni/financovani` editovatelná | ❌ | ✅ PASS | §12.2, §16 | `app/(admin)/admin/nastaveni/page.tsx` (landing) + `app/(admin)/admin/nastaveni/financovani/page.tsx` (server form) + `loading.tsx` + `error.tsx` + `app/api/admin/settings/route.ts` (POST action). ADMIN role check, zod validation min 0 max 30, server action `saveHomeCreditRate` + `revalidateTag("settings")`. AC13-AC14. **§16 Modified file: `app/(admin)/admin/layout.tsx` nebo sidebar — link "Nastavení"** — adresuje "skryté stránky = ŠPATNĚ" pravidlo |
| 6 | Setting model (Prisma) pro homecredit_rate | ❌ | ✅ PASS | §12.1 | Net-new generic key-value model: `Setting { key @id, value, type, category, description, updatedAt, updatedBy, @@index([category]) }`. Migrace `add_setting_model` v §16. Seed `homecredit_rate=7.90` v `prisma/seed.ts`. Q6 vyřešena team-leadem: jen `homecredit_rate` v MVP scope (no premature abstraction), generic shape umožňuje future tasks přidávat keys bez migrace. Verifikace: `model Setting` v `prisma/schema.prisma` zatím **NEEXISTUJE** (správně — bude přidán v implementaci) |

**Score: 6/6 PASS** ✅ — všech 6 dříve FAIL bodů je v v2 zapracovaných

---

## 4) 5 KRITICKÝCH NÁLEZŮ plánovače (zachované)

| # | Nález | Sekce | Match | Verifikace |
|---|-------|-------|-------|-----------|
| K1 | `compatibleBrands` JSON strings normalize helper + #87 tech debt | §4.1, QT1, §18 | ✅ | `lib/tco/normalize.ts` (alias map, lowercase, trim) v file list, #87 návrh follow-up task na schema migraci. Verifikace: `Part.compatibleBrands String?` JSON-encoded ✅ |
| K2 | `Part.category` 12 enum vs ~20 user-friendly mapping table | §4.2, §7, AC3 | ✅ | Mapping table 20 řádků, `lib/tco/categories.ts` exportovaná konstanta + helper `getCategoryWhere(userKey, partTypeFilter)`, AC24 vitest unit test |
| K3 | Dual render Vehicle vs Listing — TCO + Financování insert 2× | §4.3, §6.4, §12.6 | ✅ | Vehicle větev ~ř.800 + Listing větev ~ř.1075. **Verifikace v `nabidka/[slug]/page.tsx`:** `RecommendedParts` import ř.28, použito 2× (ř.799 + ř.1074), `renderListingDetail` definovaný ř.879 — plánovačovy claims přesné |
| K4 | TCO server component, Financování client — hybrid trade-off | §4.4, QT2 | ✅ | TCOBreakdown server (SEO + ISR cache + JSON-LD) explicit; FinancingTabs client (interaktivní sliders, tab state, real-time výpočet) — žádná alternativa. Hybrid pattern je odůvodněný |
| K5 | Cache klíč per (brand,model,year) NE per slug — `unstable_cache` setup | §4.5, §9.1, §9.2 | ✅ | `unstable_cache` `["tco-data-v1"]` + tag `tco` + revalidate 86400. **Plus K6 NOVÉ:** Setting cache (`["setting-v1"]` + tag `settings` + revalidate 3600 + admin save → revalidateTag instant flush). **K7 NOVÉ:** decision NESPOJOVAT existing 2 financing komponenty (justifikované) |

**Score: 5/5 PASS + 2 nové K6/K7 nálezy** ✅

---

## 5) EVZEN THE KING 6 nekompromisních pravidel

| # | Pravidlo | Status | Poznámka |
|---|----------|--------|----------|
| 1 | Žádné zkratky v UI (české celé názvy) | ✅ | TCO labels česky ("Olej a filtry", "Brzdové destičky", "Brzdové kotouče", "Tlumiče", "Vodní pumpa"...), Financing taby ("HomeCredit", "Vlastní úvěr"), HomeCreditCalculator labels ("Akontace", "Počet splátek", "Měsíční splátka", "Celkem zaplaceno", "Přeplatek"). §7 mapping table 20 řádků čeština |
| 2 | Žádné skryté featury — wizard/JIT hints explicitní | ✅ | Celý plán explicitní, lead capture form explicitně out-of-scope (§15), Vlastní úvěr tab info-only (NE active calculator) explicit AC18 |
| 3 | Označit unfinished features | ✅ | §15 out of scope (12 položek), §14 7 open questions (Q1-Q7 vyřešené nebo s doporučením), §18 návaznost na #82 perf + #90 LEGAL + 2 follow-up tasks (Part schema migrace, Reverse cross-link) |
| 4 | Nemazat bez schválení | ✅ | §15 explicitně RecommendedParts.tsx, FinancovaniCalc.tsx, FinancingCalculator.tsx (PWA broker) **NETKNUTÉ**. Existing functionality preserved. AC27: "žádný regression v existujícím RecommendedParts nebo nabidka/[slug]/page.tsx SEO generateMetadata" |
| 5 | Skryté stránky = ŠPATNĚ (admin /nastaveni/financovani v nav) | ✅ | §16 modified files: **`app/(admin)/admin/layout.tsx` nebo sidebar — přidat link "Nastavení"**. Plán explicit adresuje skryté stránky pravidlo |
| 6 | Schvalovat každou změnu jednotlivě | ✅ | v2 doslova zapracovává všech 3 user statements + 5 user decisions + 6 dříve FAIL bodů. Each change traced k user decision (§2 tabulka + §11 ZMĚNA SCOPE V v2 changelog) |

**Score: 6/6 PASS** ✅

---

## 6) Specific concerns

**Žádné blocking concerns.**

Plán je technicky kompletní, codebase claims všechny verifikovatelné. Setting model design je správně generic (key-value pattern) ale scope limited (jen `homecredit_rate` v MVP — Q6 vyřešena). Annuita formula extraction (§12.3) je čistá refactor pattern, nezdvojuje data, neporušuje existing PWA broker komponent.

---

## 7) Required changes (CHANGES_REQUESTED)

**Žádné.** Plán je APPROVED bez výhrad.

---

## 8) Optional improvements (P3 — nice-to-have, ne blocker pro APPROVED)

1. **Pozice "úplně dole" alternativa** — §6.4 řekne "nad RecommendedParts". User řekl "dole někde". Pokud chce designer literal "úplně dole", insert order by být: galerie → popis → kontakt → RecommendedParts → "Náklady vlastnictví" sekce (TCO + Financování). Není blocker, autonomie planovače byla explicit povolena v D2, ale stojí za to zvážit user feedback po launch.

2. **AC25 unit test reference value** — `calculateMonthlyPayment(500000, 7.9, 60) ≈ 10 124 Kč` je v plánu jako AC25. Recommended: přidat 2-3 reference cases (např. 0% rate edge case = simple division, 30% max rate, 0 months edge case) pro robust formula coverage.

3. **Vlastní úvěr tab UX parity** — §12.4 Vlastní úvěr je info-only text. UX-wise by mohl mít aktivní calculator s custom rate input (uživatel si zadá svou banku rate), aby tab parity byla úplná. **NEZÁKLADNÍ POŽADAVEK** — user explicit řekl "buď si klient vezme svůj úvěr **nebo** my máme HomeCredit", což implikuje "vlastní úvěr = nedělej nic, jdi na svou banku". Plán to interpretuje správně. Optional polish.

4. **HomeCredit smluvní podmínky guard** — §12.7 disclaimer. Recommended: po obdržení #90 LEGAL output, přidat HomeCredit-specific compliance text (APR disclosure, RPSN výpočet, contract reference). Plán to už řeší v §18 návaznost.

5. **Setting model migration safety** — §12.1 migrace je net-new model, žádné breaking changes. Recommended: v migraci přidat `prisma db seed` step nebo guard "if Setting table exists, upsert; else skip" — aby first deploy nepůsobil error. Plán to nezmiňuje, ale je to standard Prisma pattern.

Tyto 5 bodů NEBLOKUJÍ APPROVED — mohou jít jako follow-up tasks v implementační fázi.

---

## 9) Doporučené follow-up tasks (po APPROVED, dispatch implementatorovi)

| Task | Priorita | Owner | Předmět |
|------|----------|-------|---------|
| #86a | P0 | developer | Phase 1 implementace TCO sekce (§§5-11 + AC1-AC9) |
| #86b | P0 | developer | Phase 2 implementace Financování + Setting model (§§12 + AC10-AC19) |
| #86c | P0 | developer | Phase 3 integration + tests + admin nav link (§§13.AC20-AC27 + §16 modified files) |
| #87 (TBD) | P1 | plánovač | Tech debt: `Part.compatibleBrands` JSON → Postgres array migration (separate research + plan) |
| #88 (TBD) | P2 | plánovač | Reverse cross-link eshop Part → kompatibilní inzeráty (Q7 odložen do follow-up) |
| #82 | P1 | qa/perf | TCO endpoint do perf auditu (groupBy Part benchmark + Setting cache layer) |
| #86d | P3 | designer | UX polish: pozice "úplně dole" experiment, Vlastní úvěr tab UX parity, ConfidenceBadge visual spec |

---

## 10) Závěr — připravenost k prezentaci uživateli

**Plán #86 v2 je READY TO SHIP do user-facing prezentace a dispatch implementatorovi.**

Všechny 3 doslovné výroky uživatele 2026-04-07 (Z1-Z3) jsou v plánu doslova zapracovány s evidencí. Všech 5 user decisions (D1-D5) respektovány. Všech 6 dříve FAIL bodů z #92 review je nyní PASS. Všech 5 kritických nálezů plánovače zachované + 2 nové (Setting cache, no-merge financing components decision). Všech 6 EVZEN pravidel respektováno — žádné zkratky, žádné skryté featury, žádné mazání, admin route v nav, každá user změna doslova zapracována.

**Co je v plánu silné:**
- Hybrid architecture (TCO server + Financování client) odůvodněný SEO + interaktivita
- Setting model je generic shape (no premature abstraction, ale ready pro budoucí keys)
- Re-use annuita logic přes `lib/financing/calculate.ts` extract — žádný code duplication
- 27 acceptance criteria pokrývající TCO + Financování + Integration + Quality
- Codebase audit obsahuje konkrétní řádky existing kódu (RecommendedParts ř.28/799/1074, FinancingCalculator DEFAULT_RATE = 5.9 ř.9) — vše verifikované přesné

**Blockers pro production launch (NE pro schválení plánu):**
- #90 LEGAL output (completed) → wording disclaimer pro TCO + HomeCredit (§18)
- #82 PERF audit → TCO endpoint benchmark + Setting cache layer

**Doporučení uživateli:**
1. **Schvalte plán v2** a dispatchujte implementatorovi (#86a → #86b → #86c)
2. Po implementaci re-run #82 PERF na TCO endpoint
3. Po launch monitorujte adoption metrics (TCO views, financing tab switches, eshop transition rate)
4. Na základě user feedbacku po launch zvážit P3 improvements (pozice úplně dole, Vlastní úvěr UX parity, reverse cross-link follow-up)

---

**OK K PREZENTACI UŽIVATELI** ✅ — APPROVED, dispatch developer

— evzen-the-king
