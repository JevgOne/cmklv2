# EVZEN REVIEW — Task #78 Inzerce Research
**Datum:** 2026-04-06
**Reviewer:** evzen-the-king (READ-ONLY task controller)
**Task:** #85
**Předmět:** `.claude-context/tasks/research-task-78.md` (790 řádků, 12 sekcí)

---

## ✅ VERDIKT: **APPROVED** — OK K PREZENTACI UŽIVATELI

Research kompletně pokrývá oba uživatelovy doslovné výroky, všechny kontrolní body z task assignmentu i 8 codebase gaps. 60+ ověřitelných zdrojů s daty, žádný "fake fact". Honest limitations sekce explicitně přiznává 7 oblastí, kde data nebyla dostupná. Žádné CHANGES_REQUESTED.

**Score: 2/2 user statements PASS, 13/13 control points PASS, 8/8 codebase gaps PASS, 6/6 EVZEN rules PASS**

---

## 1) Doslovný check — 2 uživatelské výroky

| # | Uživatelův výrok (doslova) | Sekce v researchi | Match | Evidence |
|---|----------------------------|-------------------|-------|----------|
| 1 | *"inzerce taky neco jako sauto bazary/soukromníci"* — scope všech 3 supply skupin | §1.1, §1.2, §1.3, §1.4, §1.5, §1.6 | ✅ | **Sauto-style klasifieds:** §1.1 Sauto.cz + §1.2 TipCars.com (oba paid marketplaces). **Bazary/dealers:** §1.4 AAAuto.cz (AURES Holdings, 8k stock), §1.5 Auto ESA (6k stock), §1.6 Aukro. **Soukromníci/C2C:** §1.3 Bazoš.cz (FREE, 426k listings, #1 v CZ vehicles category) |
| 2 | *"potřebujeme co nejvic inzeratu musíme mít neco top neco navíc co nema sauto,tipcars atd"* — liquidity + diferenciace | §4, §5, §6, §10 | ✅ | **Liquidity:** §6.1 Liquidity-First model + §10 #3 Free private listings forever (Bazoš killer pattern). **Diferenciace:** §5.1 GAP "No AI features anywhere in CZ", §5.3 GAP "No DE→CZ bridge", §5.4 GAP "No mobile-first/video", §5.5 GAP "No verified trust layer". §4 5 features to copy (AI descriptions, AI valuation, image enhancement, cross-border, Deal Builder). §10 TOP 10 differentiators matrix s impact×effort scoring |

**Score: 2/2 PASS** ✅

---

## 2) Kontrolní body z task assignmentu (13 položek)

| # | Control point | Sekce | Match | Poznámka |
|---|---------------|-------|-------|----------|
| 1 | Sauto.cz benchmark JMENOVITĚ (URL, pricing, listing count, trust signals, features) | §1.1 | ✅ | URL https://www.sauto.cz, pricing 89-119 Kč/7-14d (verified z promo-vkladani), ~80k listings, 1376-1448 dealers, 5.9M monthly visits, Sbazar cross-posting moat, 8 features + 5 weaknesses |
| 2 | TipCars benchmark JMENOVITĚ | §1.2 | ✅ | URL tipcars.eu, pricing 249/499 Kč (cut 75% March 2026), 340k-400k cumulative listings (79k live), 1500+ dealers, 1.4M visits, multilang, crashed cars, magazine, forum |
| 3 | Autobazar / dealer segment benchmark | §1.4 + §1.5 + §1.6 | ✅ | AAAuto.cz (8k stock, AURES Holdings €220M acquisition 2014, 4 countries), Auto ESA (6k stock, premium sub-brand), Aukro (auction model marginal v autech) |
| 4 | Bazoš / soukromníci benchmark | §1.3 | ✅ | auto.bazos.cz, 426k listings, ~5.8M visits, **#1 v CZ vehicles by listings**, FREE model, display ads monetization, brutally outdated UX (opportunity flag) |
| 5 | EU benchmarks (Mobile.de, AutoScout24, Leboncoin, Auto Trader) | §2.1, §2.2, §2.3, §2.4 | ✅ | **Mobile.de** 1.6M listings, 4 dealer tiers Bronze/Silver/Gold/Platinum, AI fraud + valuation + descriptions; **AutoScout24** 2.5M listings 18 countries, smyle delivery; **Leboncoin** privát-first, EUR pricing fees zveřejněné; **Auto Trader UK** 449k cars, 64M visitors, **Co-Driver AI suite** s 96% acceptance rate na 285k+ descriptions |
| 6 | TOP diferenciátory s impact×effort matrix | §10 | ✅ | Tabulka 10 řádků × 7 sloupců (Feature/Impact/Effort/Ratio/Stav/Verdict), §10.1 Sprint 1-3 Quick Win Bundle (8 týdnů), §10.2 Co NEDOPORUČUJI (5 anti-patterns s důvodem) |
| 7 | Monetization model navržený s Wolt alignment | §5.2, §6.1, §6.5, §10 #3, #10 | ✅ | §5.2 explicitně flagne Wolt model, §6.1 Liquidity-First (free private + commission via broker + premium upsell), §6.5 Pricing position tabulka vs Sauto/TipCars, §10 #3 free private listings forever, §10 #10 subscription tier pro DEALER/BAZAAR |
| 8 | Cross-produktové hooks (parts eshop, broker, marketplace VIP) | §9.6, §10 #8, §10.2 | ✅ | §9.6 mapping "Cross-sell na parts eshop ✅ shipped — `RecommendedParts.tsx` na detail page", "Broker integration ✅ shipped — wantsBrokerHelp flag + vehicleId link". §10 #8 "Carmakler Verified" trust badge tie-in. §10.2 marketplace VIP distressed flips zmíněno (drobně, mohlo by být explicitnější — viz Note 1 níže) |
| 9 | Codebase inventář (existing /inzerat flow) | §9 (celá) | ✅ | §9.1 Routes (6 routes), §9.2 ListingFormWizard 6 steps detailně, §9.3 Listing model 50+ fields s prefix `prisma/schema.prisma:596-705`, §9.4 17 API routes, §9.5 Stripe pricing (TOP 199 Kč, EXTEND 99 Kč, BUNDLE 1990 Kč, RESERVATION 5000 Kč, CEBIA 499 Kč, BROKER 5%), §9.6 mapping research → existing kód, §9.7 8 critical gaps |
| 10 | 5 open questions pro uživatele | §11 | ✅ | Q1 liquidity vs monetization primární cíl, Q2 legal scope scrapování, Q3 free listing limit 1/60d, Q4 target persona (private vs dealer vs broker), Q5 AI error tolerance |
| 11 | Honest limitations uznané | §7 | ✅ | 7 explicit bullet points: Sauto exact fees unknown (PDF binary inaccessible), Mobile.de 403 forbidden, AutoScout24 country-specific pricing, Auto Trader individual pricing private, Bazoš revenue (privately held), TipCars cumulative vs live discrepancy, Czech autobazar count |
| 12 | Žádné věci skryté, nic mazáno | celý research | ✅ | Žádné `// removed`, žádný hidden flag, §10.2 anti-patterns explicitní namísto skryté. §9 codebase audit explicitně listne **shipped** features (ne odebráno). Žádné delete |
| 13 | Research-ready (konkrétní findings, ne polovinatá) | celý research | ✅ | 790 řádků, 12 sekcí, 60+ ověřitelných zdrojů, exact numbers (Mobile.de 1.6M, Auto Trader 96% acceptance, Sauto 89 Kč), exact source URLs a dates (April 2026 pro live fetches) |

**Score: 13/13 PASS** ✅

---

## 3) 8 codebase gaps z §9.7 — verifikace explicitní zmínky

| # | Gap | Sekce | Match | Evidence |
|---|-----|-------|-------|----------|
| 1 | Listing details NOT in sitemap | §9.7 #1 | ✅ | "`app/sitemap.ts` zahrnuje pouze `Vehicle` model (broker inventory), NE `Listing`. Statisíce klasických inzerátů (až 70-90% obsahu) jsou pro Google neviditelné." |
| 2 | No JSON-LD na `/nabidka/[slug]` | §9.7 #2 | ✅ | "chybí `schema.org/Vehicle` nebo `schema.org/Product`. Bez toho žádné rich results, žádné Google Vehicle listings." |
| 3 | No AI features anywhere | §9.7 #3 | ✅ | "žádný description generator, žádný price evaluation, žádné image AI. Claude SDK je připojený ale nevyužitý pro inzerci (pouze pro #76 Part Scanner)." |
| 4 | No subscription/recurring billing | §9.7 #4 | ✅ | "žádný `Plan` ani `Subscription` model. Vše per-listing nebo deposit. Pro DEALER/BAZAAR škálu (10+ aut) chybí měsíční flat fee." |
| 5 | No advanced search UI | §9.7 #5 | ✅ | "frontend má jen 6 quick filters, žádný 'Find your car' advanced filter form (Mobile.de má 30+ filtrů)." |
| 6 | No bulk XML import | §9.7 #6 | ✅ | "žádný bulk edit/delete/import z XML feed (Sauto/TipCars dealers očekávají XML import)." |
| 7 | Minimal e2e coverage | §9.7 #7 | ✅ | "`e2e/listing.spec.ts` má jen 1 smoke test, nepokrývá form wizard ani Stripe flows." |
| 8 | searchVector update on edit | §9.7 #8 | ✅ | "Explore agent flagged: nikde není vidět trigger nebo manuální update. Pokud uživatel edituje listing, fulltext index může být stale. **Verify needed.**" |

**Score: 8/8 PASS** ✅

Všech 8 gaps je explicitně listed s důvodem a impact assessment. Plánovač má kritická data k dispatch planning sprints 1-7.

---

## 4) EVZEN THE KING 6 nekompromisních pravidel

| # | Pravidlo | Status | Poznámka |
|---|----------|--------|----------|
| 1 | Žádné zkratky v UI | N/A | Research, ne UI design — pravidlo se nevztahuje |
| 2 | Ověřit duplicate data context | ✅ | Research explicitně rozlišuje "annual cumulative" vs "concurrent live" listings (TipCars 340k vs 79k live), nezdvojuje data |
| 3 | Označit unfinished features | ✅ | §9.7 explicit list 8 gaps s impact, §11 Q1-Q5 open questions, §7 honest limitations |
| 4 | Nemazat bez schválení | ✅ | §10.2 "Co NEDOPORUČUJI" je transparentní opt-out s důvodem, ne skryté smazání. Žádné delete operace |
| 5 | Žádné skryté stránky | ✅ | §9.1 Routes explicitně listne všechny shipped routes (`/inzerce`, `/inzerce/pridat`, `/inzerce/registrace`, `/nabidka/[slug]`, `/moje-inzeraty/*`). Žádné skryté |
| 6 | Schválit každou změnu jednotlivě | ✅ | Research nenavrhuje žádnou změnu — pouze poskytuje data pro plán. §10 differentiators jsou doporučení, ne implementační rozhodnutí. §11 explicitně řídí změny přes user approval |

**Score: 6/6 PASS** (5 applicable, 1 N/A) ✅

---

## 5) Specific concerns

**Žádné blocking concerns.**

Research je technicky kompletní a metodicky správný. Sources jsou ověřitelné s daty (60+ URLs, většina s timestamp April 2026 pro live fetches). Honest limitations sekce přiznává mezery, neskrývá je. Pricing data jsou specifická a citovaná.

---

## 6) Required changes (CHANGES_REQUESTED)

**Žádné.** Research je APPROVED bez výhrad.

---

## 7) Optional improvements (P3 — nice-to-have, ne blocker)

1. **Cross-produktové hook na marketplace VIP** — §10.2 zmiňuje "možná pro marketplace VIP distressed flips" implicitně, ale není explicit hook v §9.6 mapping table. Research má jeden Note: "Tie this to the **broker network**" v §4.5, ale **inzerce → marketplace VIP** flow chybí. Plánovač by mohl v plan-task-NN explicitně přidat row do mapping tabulky: "Verified listing s `flagReasons` flagged jako 'distress sale' → automatic candidate pro marketplace VIP review". Ne blocker — research je o competitive analysis, ne o internal product wiring.

2. **Internal inkonzistence — research má opinion vs Q1/Q3 jsou open** — Research jasně doporučuje "Liquidity-first" v §6.1 a "Free private listings forever" v §10 #3, ale §11 Q1 a Q3 to nechává jako open question pro uživatele. Toto je intentional research style (autor má názor ale finální call nechává user), ale plánovač by měl při dispatchi #76a/#78a explicitně navázat: "Pokud user odpoví Q1=A liquidity, pak Sprint 1 ship #2+#3+#1. Pokud Q1=B monetization, pak Sprint 1 přeplánovat na #10 subscription tier first." Ne blocker — to je decision tree pro plánovače, ne pro reviewera.

3. **§9.5 Stripe pricing — TOP 199 Kč/7d srovnání** — Research říká: "Carmakler nemá ekvivalentní 'základní paid' listing, jen FREE → TOP přechod" (§9.5 quote). Toto je dobrá observation ale chybí data point: kolik % current Carmakler users používá TOP boost? Pokud >0%, Carmakler **už má** levnější paid listing než Sauto (199 Kč/7d vs Sauto 89 Kč/7d je 2.2× drahší — ale Sauto's 89 Kč je zákl listing, Carmakler's 199 Kč je boost on top of free). Plánovač by měl získat actual usage data před spuštěním Sprint 1 #3 (free private forever) — pokud TOP boost adopce je <5%, free model nezpůsobí revenue impact. Ne blocker — toto je analytics task, ne research gap.

Tyto 3 body NEBLOKUJÍ schválení a nemusí být v researchi — mohou jít jako follow-up úkoly pro plánovače.

---

## 8) Doporučené follow-up tasks

| Task | Priorita | Owner | Předmět |
|------|----------|-------|---------|
| #78a | P0 | plánovač | plan-task-78a — implementační plán Sprint 1 (3 quick wins): JSON-LD schema.org/Vehicle + sitemap rozšíření o Listing, Free private listings forever (zrušit 1/60d limit), AI description generator MVP s Claude API |
| #78b | P0 | uživatel/owner | Odpovědět na §11 Q1-Q5 (5 open questions) — bez Q1 a Q4 odpovědí nelze dispatch plán Sprint 1 |
| #80 | **P0 BLOCKER** | legal | Komisionářská smlouva + DPH model (sdílený s #76v2) + **PLUS: legal review scrapování CZ konkurence (Sauto/TipCars) pro AI Price Valuation training data + Mobile.de ToS pro DE→CZ Bridge** (§11 Q2) |
| #78c | P1 | plánovač | plan-task-78c — Sprint 2-3 (AI image enhancement #5 + Verified badge #8) |
| #78d | P1 | qa/analytics | Měřit current TOP boost adopce % — input pro Sprint 1 #3 free model decision |
| #78e | P2 | plánovač | plan-task-78e — Q3 sprint 4-6 (vertical video PWA #7, AI Price Valuation #4, XML import #9, subscription tier #10) |
| #78f | P3 | plánovač | plan-task-78f — Q4 strategic bet DE→CZ Bridge #6 (po legal approval z #80) |
| #78g | P1 | plánovač | Při dispatch #78a explicitně přidat cross-link inzerce → marketplace VIP flow do mapping tabulky (Optional improvement #1 výše) |

---

## 9) Závěr — připravenost k prezentaci uživateli

**Research #78 je READY TO SHIP do user-facing prezentace.**

Oba uživatelovy doslovné výroky jsou pokryté s evidencí:
1. **"sauto bazary/soukromníci"** → 6 CZ players (Sauto, TipCars, Bazoš, AAAuto, Auto ESA, Aukro) + 4 EU benchmarks (Mobile.de, AutoScout24, Leboncoin, Auto Trader UK)
2. **"co nejvic inzeratu, něco navíc"** → §10 TOP 10 differentiators matrix + §6.1 Liquidity-First model + §5 5 GAPS v CZ trhu

**Klíčové strategické insighty pro uživatele:**
- **AI moat** — žádný CZ player nemá AI features. Auto Trader UK má 96% acceptance rate na 285k+ AI descriptions. Carmakler má Claude SDK ready (#76 leverage).
- **Liquidity wedge** — Bazoš má 5.3× více listings než Sauto (426k vs 80k) protože je FREE. Bazoš UX je z roku 2003 — "Bazoš but not ugly" je clear opportunity.
- **DE→CZ Bridge** — 50%+ CZ used car imports z Německa, žádný CZ player nemá. Strategic Q4 bet (legal blocker).
- **Verified trust layer** — AAAuto/Auto ESA dokazují, že Češi platí za trust. Carmakler může zkombinovat AAAuto trust + Sauto scale skrze broker síť.
- **Codebase už má 70%** — `ListingFormWizard` (6 steps), Listing model (50+ fields), 17 API routes, Stripe (TOP/EXTEND/BUNDLE/RESERVATION/CEBIA), broker integration (`wantsBrokerHelp` + `vehicleId`). **Sprint 1 = 8 týdnů, ne 8 měsíců.**
- **Critical 8 gaps** — sitemap missing Listings, no JSON-LD, no AI, no subscription, no advanced search, no XML import, minimal e2e, searchVector update?. Plánovač má jasný backlog.

**Blockers (NE pro schválení researche):**
1. **§11 Q1-Q5 — 5 open questions** uživatelovi (zejména Q1 cíl + Q4 persona)
2. **#80 LEGAL** — scrapování CZ konkurence + Mobile.de partnership (P0 blocker pro Sprint 4 #4 a Q4 #6)

**Doporučení uživateli:**
1. Schvalte research jako baseline pro #78a plánování
2. Odpovězte na §11 Q1-Q5 (zejména Q1 a Q4 jsou kritické)
3. Paralelně rozšiřte #80 LEGAL scope o §11 Q2 (scrapování + DE bridge legal review)
4. Dispatch plánovače na #78a Sprint 1 plan jakmile máme Q1+Q4+Q3 odpovědi

---

**OK K PREZENTACI UŽIVATELI** ✅

— evzen-the-king
