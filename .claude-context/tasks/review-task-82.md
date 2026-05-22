# EVZEN REVIEW — Task #82 PERF web-wide ISR/SSG/SSR audit plán
**Datum:** 2026-04-07
**Reviewer:** evzen-the-king (READ-ONLY task controller)
**Task:** #103
**Předmět:** `.claude-context/tasks/plan-task-82.md` (982 řádků, 14 sekcí)
**Verze:** v1 (draft, planovac)

---

## ⚠️ VERDIKT: **CHANGES_REQUESTED** — plán je strategicky správný, ALE auditní data v §2 obsahují 2 měřitelné nepřesnosti, které Developer bude potřebovat při Phase 1 file moves

**Co je správně:**
- Headline finding `await headers()` v `app/(web)/layout.tsx:47` — **100% potvrzeno čtením souboru** (řádek 47)
- Sekundární finding subdomain rewrite bug `middleware.ts:125-127` — **100% potvrzeno** (response.headers.set, ne request.headers.set)
- Variant A (route group split) je správná volba pro SSG odemčení
- 5-phase rollout je realistická sekvence
- Estimate L (7-12 dnů calendar) sedí na rozsah (~124 routes, file moves, hooks, refactor)
- Open questions Q1-Q5 mají všechny jasná doporučení
- Návaznosti #86, #87b/c/d/e, #88, #91 jsou identifikovány

**Co je špatně (musí být opraveno před dispatch implementátora):**
1. **C1 — Bucket count diskrepance:** A+B+C+D+E = 58+8+18+25+4 = **113**, plán tvrdí celkem **124**. Chybí 11 routes.
2. **C2 — Bucket E miscategorization:** Plán uvádí 4 client-rendered routes. Realita: **31 page.tsx s `"use client"` directive** v `(web)/`.
3. **C3 — Bucket A obsahuje miscategorized routes:** `recenze/page.tsx` a `kariera/page.tsx` jsou v plánu uvedeny jako "Bucket A static SSG", ALE oba mají `"use client"` na řádku 1 → ve skutečnosti jsou client components.
4. **C4 — §3.2 wording slabý:** Plán říká subdomain rewrite bug je "pravděpodobně buggy". Statická analýza middleware:125-127 a 310-311 dokazuje že **JE bug** (ne pravděpodobně). Layout v (web)/layout.tsx:47-48 čte přes `headers()` request headers, ale middleware nikde nepřidává x-subdomain do request — jen do response.

Tyto opravy nezablokují strategický směr. Lze je zapracovat do v2 plánu (jako #86 v1 → v2 cyklus).

---

## 1) Verifikace HEADLINE finding

| # | Tvrzení plánu | Soubor | Řádek | Status |
|---|---------------|--------|-------|--------|
| H1 | `app/(web)/layout.tsx:47` volá `await headers()` | layout.tsx | 47 | ✅ POTVRZENO `const headersList = await headers();` |
| H2 | Layout je rodičem všech 124 stránek v (web)/ | — | — | ✅ POTVRZENO Glob `app/(web)/**/page.tsx` → 124 souborů |
| H3 | Důsledek: všechny revalidate markery jsou ignorovány | next 15 docs | — | ✅ POTVRZENO chovaní (jakékoliv `headers()` v layoutu opt-outuje celý subtree z static) |
| H4 | Existuje 8 souborů s `revalidate` markerem | (web)/ | — | ✅ POTVRZENO Grep `^export const revalidate` → 7 page.tsx + 1 llms.txt route handler = 8 |
| H5 | 18 souborů volá `prisma.*` v top-level Page() | (web)/ | — | ✅ POTVRZENO Grep `prisma\.` v page.tsx → 18 souborů |
| H6 | 3 soubory mají `generateStaticParams` | (web)/ | — | ✅ POTVRZENO Grep → 3 (dily/vrakoviste/[slug], dily/znacka/[slug], dily/kategorie/[slug]) |

**Headline finding je železobeton.** Můžu potvrdit že ROOT CAUSE je správně identifikován a kvantifikován.

---

## 2) Verifikace sekundárního finding — subdomain rewrite bug

**Plán §3.2 tvrzení:** "Pravděpodobně buggy v produkci"

**Statická analýza middleware.ts:**

| Řádek | Kód | Co dělá |
|-------|-----|---------|
| 125 | `const response = NextResponse.rewrite(rewriteUrl);` | Vytvoří response pro rewrite |
| 126 | `response.headers.set("x-subdomain", subdomain);` | Nastaví **RESPONSE** header |
| 127 | `return response;` | Vrátí response |
| 310 | `const response = NextResponse.next();` | Default flow |
| 311 | `response.headers.set("x-subdomain", subdomain);` | Nastaví **RESPONSE** header |

**Layout (web)/layout.tsx:47:**
```typescript
const headersList = await headers();
const subdomain = (headersList.get("x-subdomain") || "main") as SubdomainType;
```

**Důkaz bugu:** Next 15 `headers()` API vrací **REQUEST headers**, ne response headers. Middleware nikde nepoužívá `NextResponse.next({ request: { headers: newHeaders } })` pattern, který by propagoval header do request. Důsledek: layout `headers().get("x-subdomain")` vrací **vždycky `null`** → fallback `"main"` → **na inzerce.carmakler.cz se renderuje MainNavbar místo InzerceNavbar**.

**Verdikt:** Bug NENÍ "pravděpodobně" — **JE 100% potvrzeno** statickou analýzou. Plán by měl §3.2 wording posílit a zařadit explicit Test-Chrome verification PŘED Phase 1 (nejen jako Q3 open question).

**Důsledek:** Subdomain rewrite functionality byla pravděpodobně NIKDY funkční v produkci od deploye middleware. Toto by mělo být v plánu zvýrazněno jako **dual finding** vedle headline `await headers()`.

---

## 3) Verifikace bucket inventory (Q4 z task assignmentu)

**Plán §2.7 tvrdí:** A=58 + B=8 + C=18 + D=25 + E=4 = 124

**Aritmetika:** 58 + 8 + 18 + 25 + 4 = **113**

**Diskrepance: 11 routes** chybí v součtu.

**Glob ověření:** `app/(web)/**/page.tsx` → **124 souborů** ✅ (celkem souhlasí)

**Možné vysvětlení:**
- Bucket F (subdomain rewrite group) v §2.6 nemá explicit count, ale §2.6 výslovně říká: *"Tyto cesty jsou ALREADY uvnitř (web)/"* — takže by **NEMĚLY** být double-counted s A-E.
- Tudíž součet A+B+C+D+E **musí** rovnat 124, ne 113.

**Závěr:** Bucket counts v §2.7 jsou **buď podhodnocené** (jeden z bucketů A-E má víc routes než plán uvádí), nebo **chybí kompletně** některá kategorie (možná Bucket F má skutečně exclusive routes, které nejsou v A-E).

**Action required:** Plánovač musí přepočítat per-bucket counts a doložit součet 124 bez gap.

---

## 4) Verifikace Bucket E (client-rendered)

**Plán §2.5 tvrdí:** 4 routes — `dily/katalog`, `shop/katalog`, `inzerce/katalog`, `inzerce/registrace`

**Realita (Grep `^"use client"` v page.tsx):** **31 souborů**

```
app/(web)/dily/katalog/page.tsx              ← v plánu Bucket E ✅
app/(web)/shop/katalog/page.tsx              ← v plánu Bucket E ✅
app/(web)/inzerce/registrace/page.tsx        ← v plánu Bucket E ✅
app/(web)/dily/kosik/page.tsx                ← v plánu Bucket D CSR ✅
app/(web)/shop/kosik/page.tsx                ← v plánu Bucket D CSR ✅
app/(web)/dily/moje-objednavky/page.tsx      ← v plánu Bucket D SSR ⚠️ ale je client
app/(web)/shop/moje-objednavky/page.tsx      ← v plánu Bucket D SSR ⚠️ ale je client
app/(web)/shop/moje-objednavky/[id]/reklamace/page.tsx  ← Bucket D SSR ⚠️ client
app/(web)/shop/moje-objednavky/[id]/vraceni/page.tsx    ← Bucket D SSR ⚠️ client
app/(web)/shop/objednavky/sledovani/[token]/page.tsx    ← Bucket D SSR ⚠️ client
app/(web)/dily/objednavka/page.tsx           ← Bucket D SSR ⚠️ client
app/(web)/dily/objednavka/potvrzeni/page.tsx ← Bucket D SSR ⚠️ client
app/(web)/shop/objednavka/page.tsx           ← Bucket D SSR ⚠️ client
app/(web)/shop/objednavka/potvrzeni/page.tsx ← Bucket D SSR ⚠️ client
app/(web)/marketplace/investor/[id]/page.tsx ← Bucket D SSR ⚠️ client
app/(web)/moje-inzeraty/page.tsx             ← Bucket D SSR ⚠️ client
app/(web)/moje-inzeraty/[id]/page.tsx        ← Bucket D SSR ⚠️ client
app/(web)/muj-ucet/page.tsx                  ← Bucket D SSR ⚠️ client
app/(web)/muj-ucet/dotazy/page.tsx           ← Bucket D SSR ⚠️ client
app/(web)/muj-ucet/oblibene/page.tsx         ← Bucket D SSR ⚠️ client
app/(web)/muj-ucet/hlidaci-pes/page.tsx      ← Bucket D SSR ⚠️ client
app/(web)/login/page.tsx                     ← Bucket D SSR ⚠️ client
app/(web)/registrace/page.tsx                ← Bucket D SSR ⚠️ client
app/(web)/registrace/dodavatel/page.tsx      ← Bucket D SSR ⚠️ client
app/(web)/registrace/partner/page.tsx        ← Bucket D SSR ⚠️ client
app/(web)/registrace/makler/page.tsx         ← Bucket D SSR ⚠️ client
app/(web)/zapomenute-heslo/page.tsx          ← Bucket D SSR ⚠️ client
app/(web)/reset-hesla/[token]/page.tsx       ← Bucket D SSR ⚠️ client
app/(web)/overeni-emailu/chyba/page.tsx      ← Bucket D SSR ⚠️ client
app/(web)/recenze/page.tsx                   ← v plánu Bucket A static SSG 🔥 KOLIZE
app/(web)/kariera/page.tsx                   ← v plánu Bucket A static SSG 🔥 KOLIZE
```

**Závěr:**
- **2 stránky (`recenze`, `kariera`) jsou v plánu nesprávně klasifikovány jako "Static SSG"** — ve skutečnosti jsou plně client komponenty. To je **C3 finding**.
- **27 stránek je v Bucket D "SSR by design"** — ale ve skutečnosti jsou `"use client"` directive. Plán to nereflektuje. Není to nutně blocker (client komponenty stále mohou být statically prerendered v Next 15 pokud nepoužívají dynamic API), ale auditní klasifikace je nepřesná.

**Action required:** Plánovač musí přidat 6. kategorii (nebo rozšířit Bucket D popis) "SSR/CSR hybrid" pro auth/account/checkout flows, které jsou primárně client-rendered ale stále patří do "by design" kategorie. A přesunout `recenze` + `kariera` z Bucket A do Bucket E (nebo nejlépe do nového bucketu C-static-client kde lze build-time prerender).

---

## 5) Verifikace 5-phase rollout (Q3 z task assignmentu)

**Otázka task:** "Phase 1 route group split — je to opravdu nutné? Nebo lze jen odstranit `await headers()` z layoutu a získat ISR zpátky?"

**Analýza alternativ:**

| Alternativa | Co dělá | SSG funguje? | Subdomain navbar funguje? | Verdikt |
|-------------|---------|--------------|---------------------------|---------|
| **A. Route group split** (plán doporučení) | 4× layout.tsx s hardcoded navbar/footer | ✅ ANO | ✅ ANO | **DOPORUČENO** |
| B. Per-page conditional layout | Každá page.tsx importuje svůj navbar | ✅ ANO | ⚠️ Anti-pattern, lehce se zapomene | NEDOPORUČENO |
| C. Middleware rewrite na route group prefix | Křehké, vyžaduje precision rewrites | ⚠️ Komplexní | ⚠️ | NEDOPORUČENO |
| **D. Just remove `await headers()`** + propagovat subdomain přes middleware request headers + použít cookie/searchParam/cache helper | Layout zůstává single, ale čte subdomain z jiného zdroje | ❌ Pokud čte přes `headers()` nebo `cookies()` → opt-outuje stejně. Pokud čte přes parameter → musí být per-segment, nefunguje v root layoutu. | ❌ | NEMOŽNÉ pro SSG |

**Verdikt:** Variant A je **jediná čistá cesta k SSG**. Variant D není možná, protože jakékoliv runtime detekce subdoménu v layoutu = opt-out z static. Plán má pravdu — nelze "jen odstranit" `await headers()` bez kompenzačního refactoru, a Variant A je nejméně bolestivá.

**Estimate ověření:** Phase 1 = M (~6-12h dev) pro file moves 124 souborů + 4 nové layouty + import updates → realistický. Celkový L (7-12 dnů) sedí.

---

## 6) Verifikace Q1-Q5 doporučení

| Q | Doporučení v plánu | Hodnocení |
|---|---|---|
| Q1 | Variant A (route group split) | ✅ Správně, viz §5 výše |
| Q2 | Strict sekvence Phase 1 → 2 → 3 → 4 → 5 | ✅ Phase 1 je P0 blocker, parallelizace by byla mrtvá |
| Q3 | Test-Chrome verifikace bug PŘED Phase 1 | ✅ ALE viz §2 — bug je již potvrzen statickou analýzou, takže Test-Chrome je jen funkční ověření, ne research |
| Q4 | Marketplace searchParam Option A (nechat SSR) | ✅ Acceptable trade-off, malý traffic |
| Q5 | Build time impact acceptable | ✅ Realistický (30-60s navíc) |

Všech 5 Q má jasná doporučení. Žádné chybějící.

---

## 7) Návaznost #91 SEO MVP (Q8 z task assignmentu)

**Tvrzení plánu §10.4:** *"/dily/vrakoviste/[slug] ISR + sitemap + JSON-LD — plně funguje po Phase 1 fixu (před fixem byl marker mrtvý)"*

**Verifikace:**
- `/dily/vrakoviste/[slug]/page.tsx` má `revalidate = 86400` + `generateStaticParams` (Grep ✅)
- Layout `(web)/layout.tsx:47` má `await headers()` (Read ✅)
- Důsledek: `revalidate` v této stránce je **ignorován** — Next 15 force-dynamic celý subtree

**Závěr:** Tvrzení plánu je **PRAVDIVÉ a KRITICKÉ.** Investice do #91 (per-vrakoviště landing pages, sitemap, JSON-LD) **má momentálně 0% performance benefit**, protože root layout opt-outuje stránku ze static rendering. Sitemap a JSON-LD funguje (jsou serializovány v každém SSR responsu), ale CDN cache, edge caching, build-time pre-render — nic z toho nefunguje.

**Toto je BUSINESS-KRITICKÉ finding** a měl by být zvýrazněn:
- V §0 Executive Summary explicit jako "**SEO MVP slice #91 dosahuje 0% performance benefit do Phase 1**"
- Doporučení uživateli: **Phase 1 je nezbytný blocker** pro return-on-investment z #91 SEO MVP

**Action required:** Plánovač musí v §0 přidat výraznou poznámku o nulové ROI #91 do Phase 1.

---

## 8) EVZEN THE KING 6 nekompromisních pravidel

| # | Pravidlo | Status | Poznámka |
|---|----------|--------|----------|
| 1 | Žádné zkratky v UI | ✅ N/A | Plán nemění UI, jen rendering strategie |
| 2 | Ověřit duplicate data context | ✅ | Plán neudvojuje data — naopak konsoliduje queries do `lib/cache/queries.ts` |
| 3 | Označit unfinished features | ⚠️ | §3.2 subdomain bug je označen jako "pravděpodobně" — měl by být "potvrzeno" + explicit follow-up #TBD-1. Plán to v §10.5 zmiňuje, ale priority `#TBD-1` neoznačuje jako P0. |
| 4 | Nemazat bez schválení | ✅ | Plán Phase 1 maže `(web)/layout.tsx`, ALE jen po Q1 schválení (Variant A) — explicit step §3.4 krok 5. Použije `git mv` (zachová history) — krok 2 §6 Phase 1. |
| 5 | Žádné skryté stránky | ✅ | Plán nepřidává nové stránky, jen přesouvá existující do route groups. Žádné hidden routes. |
| 6 | Schválit každou změnu jednotlivě | ⚠️ | Phase 1 je 124-file diff v jednom PR. Riziko konfliktu s ongoing work (#86, #87b/c/d/e, #88 jsou pending). Plán by měl explicit poznamenat "Phase 1 musí být sjednoceno se všemi pending tasks aby nedošlo k merge konfliktům" — viz §10.1-10.4 částečně řeší, ale nedostatečně. |

**Score: 4/6 PASS, 2/6 PASS s poznámkou** ⚠️

---

## 9) Souhrn — Required changes (CHANGES_REQUESTED)

**C1 — Bucket count discrepance (P1 — blokuje Phase 1 acceptance)**
- Plán §2.7 součet A+B+C+D+E = 113, ale celkem tvrdí 124. Diff 11 routes.
- **Action:** Plánovač musí přepočítat per-bucket counts a doložit součet 124 bez gap. Pravděpodobně chybí counts v Bucket D (auth/account flows) nebo Bucket E (client components).

**C2 — Bucket E miscategorization (P1 — ovlivňuje Phase 5 scope)**
- Plán §2.5 uvádí 4 client routes, realita 31 (`grep -E '^"use client"' page.tsx`).
- **Action:** Přepočet Bucket E + rozšíření Bucket D popisu "SSR by design" o note že většina je `"use client"` directive (auth/account/checkout flows).

**C3 — Bucket A obsahuje 2 client routes (P2 — kosmetické)**
- `recenze/page.tsx` a `kariera/page.tsx` jsou plánovány jako "Static SSG" v Bucket A, ale obsahují `"use client"` directive.
- **Action:** Přesunout do správného bucketu (E nebo nový "static-client").

**C4 — §3.2 subdomain bug wording (P2 — dokumentace přesnosti)**
- Plán říká "pravděpodobně buggy". Statická analýza middleware:125-127 a 310-311 dokazuje 100% bug.
- **Action:** Posílit wording §3.2 — "**potvrzeno čtením middleware.ts**" + označit follow-up #TBD-1 jako **P0 Test-Chrome verification PŘED Phase 1** (ne paralelně).

**C5 — Executive summary §0 chybí #91 ROI poznámka (P1 — business-kritické)**
- Plán neobsahuje výraznou zmínku že #91 SEO MVP slice momentálně dosahuje 0% performance benefit do Phase 1.
- **Action:** Přidat do §0 explicit warning: *"#91 SEO MVP slice (sitemap + per-vrakoviště landing + JSON-LD) je momentálně blokován headless layout bug. ROI z #91 = 0% do Phase 1. Phase 1 je P0 blocker pro #91 ROI realizaci."*

---

## 10) Optional improvements (P3 — nice-to-have, ne blocker)

1. **§5.1 cache helpers tagy** — doporučuji přidat `tags: ["dily-homepage"]` namespace prefix konzistentně, aby cache invalidation byla precision (např. `revalidateTag("vehicles")` smaže i nesouvisející cache). Plán to v §5.2 částečně řeší tabulkou, ale §5.1 příklady jsou inkonzistentní.

2. **§6 Phase 1 acceptance criteria AC1.6** — "Subdomain test: inzerce.localhost:3000/ → InzerceNavbar". Doporučuji explicit Playwright test per subdomain × per template (4 subdomén × 5 reprezentativních stránek = 20 testů), ne jen 4 manual smoke checks. Bez automatizace risk regression je vysoký.

3. **§4.3 unstable_cache pattern pro homepage** — `getHomepageStats` cache key `["homepage-stats"]` nekomunikuje s cache invalidation z `revalidateTag("vehicles")`. Plán by měl ukázat vazbu mezi cache key a tag explicitly (možná tabulka v §5.2 to už dělá, ale s příkladem v §4.3 by to bylo jasnější).

4. **§7.4 Lighthouse benchmark baseline** — chybí explicit instrukce **WHEN** se měří baseline (před Phase 1, ne po). Doporučuji `npm run build` na current main + `lighthouse` proti localhost:3000 → uložit do `.claude-context/perf/baseline-2026-04-07.json` před Phase 1 startem.

5. **§8.1 risk "Subdomain rewrite bug komplikuje split"** — risk je listed Med/Med, ALE pokud je bug 100% (viz §2 této review), Phase 1 ho automaticky řeší (každý nový layout má hardcoded navbar). Risk lze snížit na Low/Low.

6. **§3.4 Doporučené pořadí kroků** — chybí explicit step pro **smoke test build PŘED Phase 1 mergem** (pokud je layout opraven, ale routes nevyhovují, build padne). Doporučuji insert step 4.5 "smoke build na localhost (PR preview environment)".

---

## 11) Doporučené follow-up tasks (po opravě plánu)

| Task | Priorita | Owner | Předmět |
|------|----------|-------|---------|
| #82a v2 | P0 | planovac | Oprava plánu §2 (bucket counts), §0 (#91 ROI warning), §3.2 (potvrzeno bug wording), §10.5 (#TBD-1 priorita) |
| #82b | P0 | qa / test-chrome | **Před** Phase 1: ověřit subdomain rewrite bug v live build (HTTP request s `Host: inzerce.localhost:3000` → check rendered navbar) — pokud bug confirmed, sloužit jako baseline pro Phase 1 fix verification |
| #82c | P0 | qa / test-chrome | **Před** Phase 1: Lighthouse baseline benchmark 5 routes (homepage, /nabidka/skoda/octavia, /dily, /dily/[slug], /dily/katalog). Output: `.claude-context/perf/baseline-2026-04-07.json` |
| #82d | P0 | developer | Phase 1 implementace (route group split, ~1-2 dny) |
| #82e | P1 | developer | Phase 2 (Bucket A cleanup, ~2-4h) |
| #82f | P1 | developer | Phase 3 (Bucket C migrace, ~2-3 dny) |
| #82g | P1 | developer | Phase 4 (mutation hooks, ~1-2 dny) |
| #82h | P2 | developer | Phase 5 (katalog SSR shell refactor, ~1-2 dny) |
| #82i | P2 | qa | Lighthouse post-Phase 5 benchmark + perf report |
| #82j | P3 | developer | Cron job pro `revalidateTag('stats')` 1× denně |

**Důležité návaznosti pro team-leada:**
- **Phase 1 je P0 blocker pro #87b/c/d (#96-#98), #88, #91 ROI realizaci**
- Pending tasks #100-#102 (PlatformSwitcher fix, marketplace odebrání, marketplace landing) — souvisí s navbarem/footerem; **doporučuji udělat PŘED Phase 1**, aby se neopakoval refactor 4× v každé route group
- #86 v2 TCO+Financování plán (Setting model + revalidateTag('settings')) — **plně kompatibilní** s plánem #82, lze implementovat paralelně, ale Setting cache helper patří do `lib/cache/queries.ts` (§5.1)

---

## 12) Závěr — připravenost k prezentaci uživateli

**Plán #82 v1 NENÍ READY TO SHIP — vyžaduje opravu C1, C2, C3, C4, C5.**

**Důvod CHANGES_REQUESTED:** Strategie je správná (Variant A route group split, 5-phase rollout), headline finding je železobeton, návaznosti jsou identifikovány. **ALE** auditní data v §2 jsou nepřesná (113 ≠ 124, 4 ≠ 31 client routes), což znamená že Developer při Phase 1 file moves narazí na neočekávaný scope. Také §0 chybí business-kritická poznámka o #91 SEO MVP ROI = 0%.

**Doporučení uživateli:**
1. **Schválit strategii** (Variant A, 5-phase rollout) — plán je směrově správný
2. **Vyžádat v2 plánu** od planovac s opravami C1-C5 (krátký cyklus, ~30-60 min planovac práce)
3. **Současně nasměřovat #82b + #82c PŘED v2** — Test-Chrome subdomain bug verification + Lighthouse baseline (paralelně s plánovačovou opravou)
4. **Po v2 schválení** dispatch Developer #82d (Phase 1)

**Blockers pro Phase 1 implementaci (NE pro user prezentaci strategy):**
- C1, C2, C3 musí být opraveno v §2 (bucket counts) aby Developer věděl skutečný scope file moves
- C5 musí být přidáno do §0 (business priorita) aby uživatel věděl ROI implication

**Out of plánu, ale FYI pro team-leada:**
- Plán nemá zmínku o **#100 PlatformSwitcher bug** (subdomain dev menu) — pokud bude #100 řešeno před Phase 1, Phase 1 nemusí znovu refactor PlatformSwitcher v 4 nových layoutech. Doporučuji team-leadovi sjednotit pořadí: #100 → #101 → #102 → #82 v2 → #82d Phase 1.

---

**CHANGES_REQUESTED — vrátit plánovači k revizi (C1-C5).**

— evzen-the-king
