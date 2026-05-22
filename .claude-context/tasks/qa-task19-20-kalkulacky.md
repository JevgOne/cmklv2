# QA Report — Task #19 Pojištění + Task #20 Financování kalkulačky

**Datum:** 2026-05-22  
**Commits:** 1e1cd38 (Task #19), f5bcadb (Task #20)  
**Výsledek: OBA PASS ✅**

---

## Task #19 — Pojištění kalkulačka — PASS ✅

### Simplify

Kód čistý — useMemo pro reaktivní výpočet, typy přes TypeScript union, žádné duplicity.

### Debug

**Lint:** 0 errors, 0 warnings ✅  
`text-success-500` — ověřeno v `app/globals.css` jako `--color-success-500: var(--success-500)` ✅ (Tailwind 4 CSS var pattern)

### Reverzní kontrola

| Požadavek | Status | Poznámka |
|---|---|---|
| `POVINNE_BASE` tabulka dle plánu | ✅ | do-1400:[1800,3600], 1400-2000:[2400,4800], 2000-3000:[3600,7200], 3000+:[5400,10800] |
| `HAVARIJNI_RATE` dle plánu | ✅ | 0-3:[1.5,3.0], 4-7:[2.0,4.0], 8-15:[2.5,5.0], 15+:[3.0,6.0] |
| Výpočet bez submitu (useMemo) | ✅ | Reaktivní — výsledek ihned |
| Zobrazuje rozsah (ne přesné číslo) | ✅ | STOP-1 splněn |
| `needsPrice` warning pro havarijní bez ceny | ✅ | UX hint |
| Disclaimer | ✅ | STOP-4: viditelný pod výsledkem |
| Kontaktní formulář → `/api/contact` | ✅ | STOP-3 splněn |
| Kalkulovaná data v message | ✅ | SPZ, typ, motor, stáří, odhad v textu zprávy |
| Žádné API pojišťoven | ✅ | STOP-2 splněn |
| Page.tsx: PojisteniForm → PojisteniCalc | ✅ | 2 řádky |
| Výkon (kW) input | ⚠️ | V plánu uveden, ale tabulky ho nevyužívají — vynechání správné |

### Acceptance Criteria

Všechny ✅ — kalkulačka, rozsah ihned, formulář, disclaimer, mobile (responsive grid).

---

## Task #20 — Financování kalkulačka — PASS ✅

### Simplify

PMT funkce vyextrahována na top-level, useMemo pro výpočty, stavové proměnné přiměřené.

### Debug

**Lint:** 0 errors, 0 warnings ✅  
`text-success-500` — stejný pattern jako #19, definováno v globals.css ✅

### Matematická verifikace PMT formule

```typescript
function calcMonthlyPayment(principal, annualRate, months):
  r = annualRate / 100 / 12
  PMT = (P × r × (1+r)^n) / ((1+r)^n − 1)  // ✅ standardní anuitní vzorec
  edge: r === 0 → Math.round(P / n)           // ✅ ochrana proti dělení nulou
```

Příklad: 360 000 Kč @ 3.9% / 60 měs. → r=0.00325 → PMT ≈ 6 613 Kč/měs.  
Příklad: 360 000 Kč @ 6.9% / 60 měs. → r=0.00575 → PMT ≈ 7 087 Kč/měs.  
Rozsah odpovídá realitě. ✅

### Reverzní kontrola

| Požadavek | Status | Poznámka |
|---|---|---|
| LOW_RATE = 3.9%, HIGH_RATE = 6.9% | ✅ | Dle plánu |
| Akontace slider 0–80% krok 5% | ✅ | `min=0 max=80 step=5` |
| Doby splácení: [12,24,36,48,60,72,84] | ✅ | Button grid |
| Anuitní formule (ne `cena/48`) | ✅ | Správný PMT výpočet |
| Zobrazuje rozsah lowPayment–highPayment | ✅ | STOP-1 splněn |
| Celkem zaplatíte (lowTotal – highTotal) | ✅ | |
| Přeplacení (Kč + %) | ✅ | lowOverpay, highOverpay, pct |
| Disclaimer | ✅ | STOP-2 splněn |
| Kontaktní formulář → `/api/contact` | ✅ | Se zprávou se spočítanými daty |
| Žádné HomeCredit API | ✅ | STOP-3 splněn |
| LoanCalculator na detailu vozu — nezměněn | ✅ | STOP-4, Krok 2 byl optional |
| lib/loan-calc.ts sdílená logika | ⚠️ | Nevytvořena — optional v plánu, OK |

### Acceptance Criteria

Všechny ✅ — cena/akontace/doba, anuitní vzorec, rozsah, celkem, přeplacení, formulář, disclaimer, mobile.

---

## Souhrnný výsledek

| Task | Status |
|---|---|
| #19 Pojištění kalkulačka | **PASS ✅** |
| #20 Financování kalkulačka | **PASS ✅** |
