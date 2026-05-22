# Plan: Financování kalkulačka (vylepšení)

**Task:** #16
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** Enhancement (vylepšení existující kalkulačky)
**Závažnost:** MEDIUM

---

## 1. Aktuální stav

### Co existuje:

**A) `components/web/FinancovaniCalc.tsx`** — na `/sluzby/financovani`:
- Velmi jednoduchý: `cena / 48 = splátka` (bez úroku!)
- Kontaktní formulář (jméno + telefon)
- Posílá na `/api/contact`
- **Problém:** Nepočítá úrok, nemá akontaci, nemá volbu doby splácení

**B) `components/web/LoanCalculator.tsx`** — na `/nabidka/[slug]` (detail vozidla):
- Pokročilejší: akontace slider (0-80%), doba (12-84 měsíců), úrok 6.9%
- Správný výpočet anuitní splátky (PMT formula)
- Ukazuje: splátka, celková platba, přeplacení
- **Ale:** Nemá kontaktní formulář, jen tlačítko "Chci financování"

### Závěr:

LoanCalculator je LEPŠÍ kalkulačka, ale chybí mu kontaktní formulář. FinancovaniCalc je slabý, ale má formulář. Potřebujeme SPOJIT obojí.

---

## 2. Návrh: Sloučit do jedné pokročilé kalkulačky

### Nový `FinancovaniCalc` = LoanCalculator + kontaktní formulář

**Vstupní parametry:**

| Parametr | Typ | Default | Rozsah |
|----------|-----|---------|--------|
| Cena vozidla | Number input | (prázdné) | 50 000 – 5 000 000 |
| Akontace | Slider | 20% | 0% – 80% (krok 5%) |
| Doba splácení | Slider/buttons | 60 měs. | 12 – 84 měsíců (krok 12) |
| Úroková sazba | Fixed display | 3,9% – 6,9% | (info, ne vstup) |

**Výstup:**

```
┌───────────────────────────────────────────┐
│  Orientační splátka                        │
│                                            │
│  Měsíční splátka:     8 450 Kč/měs.       │
│  ─────────────────────────────              │
│  Cena vozidla:       450 000 Kč            │
│  Akontace (20%):      90 000 Kč            │
│  Výše úvěru:         360 000 Kč            │
│  Celkem zaplatíte:   507 000 Kč            │
│  Přeplacení:          57 000 Kč (15,8%)    │
│                                            │
│  Úrok: 3,9% – 6,9% p.a. (dle schválení)  │
│  ─────────────────────────────              │
│  [Jméno] [Telefon]                         │
│  [Chci financování →]                      │
└───────────────────────────────────────────┘
```

### Výpočetní logika (anuitní splátka):

```typescript
// Zobrazit rozsah: low rate (3.9%) a high rate (6.9%)
const LOW_RATE = 3.9;
const HIGH_RATE = 6.9;

function calcMonthlyPayment(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.round(principal / months);
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

// Zobrazit: "8 450 – 9 200 Kč/měs."
const lowPayment = calcMonthlyPayment(loanAmount, LOW_RATE, months);
const highPayment = calcMonthlyPayment(loanAmount, HIGH_RATE, months);
```

---

## 3. Implementační plán

### Krok 1: Přepsat `FinancovaniCalc`

**Soubor:** `components/web/FinancovaniCalc.tsx` — přepsat na pokročilou kalkulačku.

Vzít logiku z `LoanCalculator.tsx`:
- Akontace slider
- Doba splácení (buttons 12/24/36/48/60/72/84)
- Anuitní výpočet
- Přidat: rozsah úroků (3.9% – 6.9%)
- Přidat: kontaktní formulář na konci
- Přidat: shrnutí (celkem zaplatíte, přeplacení)

### Krok 2 (OPTIONAL): Aktualizovat LoanCalculator

`LoanCalculator` na detailu vozidla by měl používat stejnou výpočetní logiku. Extrahovat výpočet do sdíleného utility:

```typescript
// lib/loan-calc.ts
export function calculateLoan(params: {
  vehiclePrice: number;
  downPaymentPercent: number;
  months: number;
  annualRate: number;
}) { ... }
```

### Krok 3 (OPTIONAL): HomeCredit branding

Pokud má CarMakléř partnerství s HomeCredit, přidat:
- Logo HomeCredit v kalkulačce
- "Partner: HomeCredit" badge
- Specifické úrokové sazby od HomeCredit

**POZOR:** Potřebujeme ověřit, zda je OK použít HomeCredit logo/branding. Zeptat se uživatele.

---

## 4. Seznam souborů

| Soubor | Typ | Detail |
|--------|-----|--------|
| `components/web/FinancovaniCalc.tsx` | REWRITE | Pokročilá kalkulačka + formulář |
| `lib/loan-calc.ts` | NEW (optional) | Sdílená výpočetní logika |
| `components/web/LoanCalculator.tsx` | EDIT (optional) | Použít sdílenou logiku |

---

## 5. STOP pravidla

- **STOP-1:** Kalkulačka je ORIENTAČNÍ. Vždy zobrazit rozsah (low/high rate), ne jedno číslo.
- **STOP-2:** Disclaimer: "Orientační výpočet. Skutečné podmínky závisí na schválení žádosti."
- **STOP-3:** Neintegrovat HomeCredit API — to je komplexní integrace. Stačí orientační výpočet + kontaktní formulář.
- **STOP-4:** Zachovat funkčnost stávající LoanCalculator na detailu vozidla — jen refactorovat logiku pokud potřeba.

---

## 6. Acceptance Criteria

- [ ] Kalkulačka na `/sluzby/financovani` má: cena, akontace slider, doba splácení
- [ ] Výpočet používá anuitní formuli (ne prosté dělení)
- [ ] Zobrazuje rozsah splátek (low/high rate)
- [ ] Zobrazuje celkovou platbu a přeplacení
- [ ] Po kalkulaci může odeslat kontaktní formulář
- [ ] Mobile-friendly (slidery, buttons)
- [ ] Disclaimer je viditelný
- [ ] `npm run build` projde
