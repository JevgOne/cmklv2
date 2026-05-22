# EVZEN REVIEW — Task #76v2 AI Part Scanner plán
**Datum:** 2026-04-06
**Reviewer:** evzen-the-king (READ-ONLY task controller)
**Task:** #84
**Předmět:** `.claude-context/tasks/plan-task-76.md` (2331 řádků, 27 sekcí)
**Verzia:** v2 (po user decisions z 2026-04-06)

---

## ✅ VERDIKT: **APPROVED** — OK K PREZENTACI UŽIVATELI

Plán v2 doslova reflektuje všech 7 uživatelských rozhodnutí. Wolt 1:1 model (§0) je kompletní, voice input vrácen do MVP (§6.6), Launch Readiness Checklist (§24) má 25 kritérií + GO/NO-GO matrix, Pilot Phase (§25) má 3-phase rollout přesně podle uživatelovy formulace.

**Žádné CHANGES_REQUESTED. Žádné blocking findings.**

---

## 1) Doslovný check — 7 uživatelských rozhodnutí

| # | Uživatelovo rozhodnutí (doslova) | Sekce v plánu | Match | Evidence |
|---|----------------------------------|---------------|-------|----------|
| Q1 | *"ja bych dal 12-20% s tím že podle domluvy se to nastaví v admin panelu pro vrakoviste"* | §0.1, §0.2, §0.3, §0.4 | ✅ | Range 12-20% validated, default 15%, `Partner.commissionRate Decimal @default(15.00) @db.Decimal(4,2)`, admin slider `CommissionRateSlider.tsx`, per-vrakoviště override, `PartnerCommissionLog` audit (oldRate, newRate, reason, changedById, changedAt), Stripe Connect dynamic split via webhook se snapshot fields v `OrderItem` |
| Q2 | *"díly drzi vrakoviste"* | §0.7 | ✅ | Žádný centrální sklad. Vrakoviště drží díl, balí, předává Zásilkovně. Carmakler = pouze marketplace + payment processor. |
| Q3 | *"fakturovat asi musíme my a vrakoviste nám"* | §0.6 | ✅ | Komisionářská fakturace, plán explicitně označuje jako **blocked by #80 LEGAL** (DPH model + komisionářská smlouva) — production launch nesmí proběhnout bez LEGAL approval. |
| Q4 | *"priorita je objet nejvíce vrakovišt"* (= Cloudflare odloženo) | §20 | ✅ | Cloudflare R2 / image proxy explicitně **deferred to Q4+ 2026** v out-of-scope sekci. MVP používá Cloudinary. |
| Q5 | *"oni to budou asi delat v kanceláři takze to vioce je dobry podle me. Voice necháme"* | §6.6 | ✅ | Voice input **vrácen do MVP** (odstraněn z out-of-scope §20). 2-tier strategie: Whisper API (server-side, $0.006/min, ~$0.001 per 10s description) + Web Speech API (Chrome browser fallback). Endpoint `/api/parts/transcribe` s rate limit 50/day/user. ENV `OPENAI_API_KEY`, npm dep `openai`. UI komponenta `VoiceDescriptionInput.tsx`. |
| Q6 | *"já jako majitel, pak pujdeme dal jak budeme mít regionalní manazery tak to budou mít na starost oni, popřípade na to dáme také zvlášt maklere"* | §25.2, §25.3, §25.4 | ✅ | 3-phase rollout doslova: **Phase 1 (M1-M3)** Owner-led field sales (80h/měsíc, budget 50k Kč), **Phase 2 (M4-M6)** Regional managers (2× 30k Kč × 3 měsíce = 180k Kč, target 80+ vrakovišť), **Phase 3 (M7-M12)** Broker overflow (5% referral commission, target 200+ vrakovišť). |
| Q8 | *"Praha a v okoli praha"* | §25.1 | ✅ | Pilot region: **Praha + Středočeský kraj 50 km radius**. M1-M3 pilot, M4-M6 expansion, M7-M12 scale. Target 30+ vrakovišť + 1000+ parts by M3. |

**Score: 7/7 PASS** ✅

---

## 2) Control points (7 z task assignmentu)

| # | Control point | Sekce | Match | Poznámka |
|---|---------------|-------|-------|----------|
| 1 | Wolt 1:1 model kompletní (commission slider, audit log, Stripe Connect split, fakturace) | §0.1 – §0.8 | ✅ | Schema, admin UI, payment flow, fakturace plus Wolt model implications table v §0.8 |
| 2 | Voice input v MVP (ne out-of-scope) | §6.6 | ✅ | Whisper API + Web Speech fallback, kompletní spec |
| 3 | Launch Readiness Checklist s GO/NO-GO matrix | §24 | ✅ | 25 kritérií / 6 kategorií (Supply 5, Inventory 5, Demand 4, Tech 6, Business 5) + GO/NO-GO: 20+/25 = GO, 15-19 = SOFT LAUNCH, <15 = NO-GO |
| 4 | Pilot Phase Praha + 3-phase rollout | §25.1 – §25.7 | ✅ | Region, 3 phases, Founding Member program (gold badge, 0% komise 3 měsíce, 8% next 9 měsíců, direct line to owner), feedback collection, acceptance criteria → trigger §24 |
| 5 | Touch targets 56px (NE 44px WCAG default) | §11.1 | ✅ | 56px explicitně, primary CTA 64px, reasoning: vrakoviště works in oily environment, gloves, sun, age 55+ |
| 6 | Out-of-scope WITHOUT voice (přesun do MVP) | §20 | ✅ | Voice odstraněn z §20, Cloudflare R2 zůstává deferred, ostatní out-of-scope položky neměněny |
| 7 | Carmakler rules preserved (no skrývání, no UI shortcuts, dispatch-ready) | celý plán | ✅ | Žádné skryté stránky, žádné UI zkratky, plán explicitně hlídá #80 LEGAL blocker, #46 PWA install gating, dispatch flow ready |

**Score: 7/7 PASS** ✅

---

## 3) EVZEN THE KING 6 nekompromisních pravidel

| # | Pravidlo | Status | Poznámka |
|---|----------|--------|----------|
| 1 | Žádné zkratky v UI | ✅ | Plán dodržuje Carmakler design systém, plné labely v UI komponentách (CommissionRateSlider, VoiceDescriptionInput) |
| 2 | Ověřit duplicate data context | ✅ | `PartnerCommissionLog` audit log nezdvojuje data — má vlastní účel (audit trail), snapshot fields v `OrderItem` jsou nutné kvůli historické přesnosti (commission se mění v čase) |
| 3 | Označit unfinished features | ✅ | §0.6 fakturace explicitně **blocked by #80 LEGAL**, §20 Cloudflare R2 **deferred to Q4+ 2026**, §24 Launch Readiness s GO/NO-GO gate před public launch |
| 4 | Nemazat bez schválení | ✅ | Plán nic nemaže (jen rozšiřuje), pouze přesun voice z out-of-scope do MVP byl doslova schválen uživatelem (Q5) |
| 5 | Žádné skryté stránky | ✅ | Všechny nové stránky/komponenty jsou explicitně součástí navigace (admin commission UI, vrakoviště onboarding, scan flow) |
| 6 | Schválit každou změnu jednotlivě | ✅ | 7 user decisions doslova zapracováno; tento review je per-decision tabulka |

**Score: 6/6 PASS** ✅

---

## 4) Specific concerns

**Žádné.**

Sekce §0 (Wolt model) je technicky kompletní — Prisma schema, admin UI komponenty, Stripe Connect webhook flow s snapshot fields, fakturace blocker. §6.6 voice input má jasnou cost analysis ($0.006/min, ~$0.001 per description) a fallback strategy. §24 Launch Readiness Checklist je měřitelný (žádné vágní kritéria). §25 Pilot Phase má konkrétní rozpočty, target counts a timelines.

---

## 5) Required changes (CHANGES_REQUESTED)

**Žádné.** Plán je APPROVED bez výhrad.

---

## 6) Optional improvements (P3 — nice-to-have, ne blocker)

1. **§0.4 Stripe Connect snapshot fields** — Doporučuji v implementaci přidat `commissionRateChangedAt: DateTime?` do `OrderItem` pro audit case kdy se cena mění mid-order (race condition mezi admin slider change a checkout). Není blocker, MVP může používat čas vytvoření orderu.
2. **§24 Launch Readiness GO/NO-GO** — Zvážit přidání **time-bound check** (např. pokud SOFT LAUNCH zóna trvá >2 měsíce, escalate). Není blocker pro plán.
3. **§25.5 Founding Member program** — Doporučuji v implementaci přidat explicit kill-switch pro gold badge (pokud vrakoviště poruší T&C). Není blocker pro plán.

Tyto 3 body NEBLOKUJÍ schválení a nemusí být v plánu — mohou jít jako follow-up tasks v implementační fázi.

---

## 7) Doporučené follow-up tasks (po schválení uživatelem)

| Task | Priorita | Owner | Předmět |
|------|----------|-------|---------|
| #76a | P0 | developer | Phase 1 implementace §0 (Wolt model: Prisma schema + admin UI + Stripe Connect split webhook) |
| #76b | P0 | developer | Phase 2 implementace §1-§6 (Vision OCR scan flow + voice input) |
| #76c | P0 | developer | Phase 3 implementace §7-§13 (PWA, offline queue, dispatch flow) |
| #80 | **P0 BLOCKER** | **legal** | Komisionářská smlouva + DPH model — **MUSÍ být schváleno před production launch §24** |
| #76d | P1 | designer | UI mockupy pro §0.3 (CommissionRateSlider, CommissionHistoryList, CommissionEditDialog) |
| #76e | P1 | product-owner | §25 Pilot Phase — White Glove Onboarding playbook + Founding Member program T&C |
| #76f | P2 | qa | §24 Launch Readiness Checklist automation (které kritéria lze měřit programaticky vs. manuálně) |
| #76g | P3 | developer | Optional improvements P3 z této review (snapshot timing, kill-switches) |

---

## 8) Závěr — připravenost k prezentaci uživateli

**Plán #76v2 je READY TO SHIP do user-facing prezentace.**

Všech 7 uživatelských rozhodnutí (Q1-Q8) je v plánu doslova zapracováno s evidencí. Wolt 1:1 marketplace model je kompletní (§0), voice input je v MVP (§6.6), Launch Readiness má měřitelný GO/NO-GO gate (§24), Pilot Phase má 3-phase rollout přesně podle uživatelovy formulace (§25).

**Blockers pro production launch (NE pro schválení plánu):**
- #80 LEGAL — komisionářská smlouva + DPH model (§0.6)
- §24 GO/NO-GO matrix musí dosáhnout 20+/25 kritérií

**Doporučení uživateli:**
1. Schvalte plán a začněte Phase 1 implementaci (§0 Wolt model)
2. Paralelně zadejte #80 LEGAL k právníkovi (komisionářská smlouva + DPH)
3. Připravte se na White Glove Onboarding §25 — owner-led field sales v Praze + Středočeském kraji M1-M3
4. Po dosažení §24 GO threshold (20+/25) můžete pustit public launch; do té doby SOFT LAUNCH (invite-only beta)

---

**OK K PREZENTACI UŽIVATELI** ✅

— evzen-the-king
