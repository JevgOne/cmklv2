# Plan: Pojištění kalkulačka

**Task:** #15
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** Enhancement (rozšíření existující stránky)
**Závažnost:** MEDIUM

---

## 1. Aktuální stav

### Co existuje:
- **`app/(web)/sluzby/pojisteni/page.tsx`** — landing page s popisem služby, kroky, výhodami, FAQ
- **`components/web/PojisteniForm.tsx`** — kontaktní formulář (SPZ + jméno + telefon), posílá na `/api/contact`
- **`components/web/ServicePage.tsx`** — sdílený layout pro služby (hero, steps, benefits, CTA, FAQ)

### Co CHYBÍ:
- **Žádná kalkulačka** — formulář jen sbírá kontakt, nepočítá nic
- Uživatel zadá SPZ → nic se nestane → čeká na telefon od specialisty
- **Žádné srovnání pojišťoven** — stránka slibuje "porovnáme všechny pojišťovny" ale nic neporovnává

---

## 2. Návrh kalkulačky

### Koncept: Orientační cenová kalkulačka

**DŮLEŽITÉ:** Reálné pojistné závisí na desítkách faktorů (bezeškodný průběh, PSČ, stáří řidiče, bonus/malus). CarMakléř NEMŮŽE počítat přesné pojistné bez API napojení na pojišťovny.

**Řešení:** Orientační kalkulačka s odhadovými rozsahy + CTA "Chci přesnou nabídku" (kontaktní formulář).

### Vstupní parametry:

| Parametr | Typ | Příklad |
|----------|-----|---------|
| Typ pojištění | Radio | Povinné ručení / Havarijní / Obojí |
| Objem motoru | Select | do 1.4L / 1.4-2.0L / 2.0-3.0L / 3.0L+ |
| Stáří vozu | Select | Nové (0-3) / 4-7 let / 8-15 let / 15+ let |
| Výkon (kW) | Number input | 85 |
| Cena vozu (jen havarijní) | Number input | 450 000 |

### Výstup:

```
┌─────────────────────────────────────────────┐
│  Orientační roční pojistné                   │
│                                              │
│  Povinné ručení:    2 400 – 4 800 Kč/rok    │
│  Havarijní:         6 200 – 12 400 Kč/rok   │
│  ─────────────────────────────────           │
│  Celkem:            8 600 – 17 200 Kč/rok   │
│                                              │
│  [Chci přesnou nabídku →]                    │
└─────────────────────────────────────────────┘
```

### Výpočetní logika:

Orientační tabulka (fixní rozsahy, ne API):

```typescript
const POVNNE_BASE: Record<string, [number, number]> = {
  // [min, max] roční sazba
  "do-1400":   [1800, 3600],
  "1400-2000": [2400, 4800],
  "2000-3000": [3600, 7200],
  "3000+":     [5400, 10800],
};

const HAVARIJNI_RATE: Record<string, [number, number]> = {
  // % z ceny vozu [min%, max%]
  "0-3":  [1.5, 3.0],   // nové vozy
  "4-7":  [2.0, 4.0],   // střední stáří
  "8-15": [2.5, 5.0],   // starší
  "15+":  [3.0, 6.0],   // staré (pokud vůbec pojistitelné)
};
```

**Disclaimer:** "Orientační výpočet. Skutečné pojistné závisí na bezeškodném průběhu, regionu a dalších faktorech."

---

## 3. Implementační plán

### Krok 1: Nová komponenta `PojisteniCalc`

**Soubor:** `components/web/PojisteniCalc.tsx` (nahradí PojisteniForm)

**Chování:**
1. Uživatel vybere typ pojištění, objem, stáří, výkon, cenu
2. Kalkulačka OKAMŽITĚ zobrazí orientační rozsah (bez submitu)
3. Pod výsledkem: "Chci přesnou nabídku" formulář (jméno + telefon + SPZ)
4. Submit → `/api/contact` s kalkulovanými daty

### Krok 2: Nahradit PojisteniForm za PojisteniCalc

**Soubor:** `app/(web)/sluzby/pojisteni/page.tsx`

```tsx
// PŘED:
import { PojisteniForm } from "@/components/web/PojisteniForm";
cta={<PojisteniForm />}

// PO:
import { PojisteniCalc } from "@/components/web/PojisteniCalc";
cta={<PojisteniCalc />}
```

### Krok 3 (OPTIONAL): Srovnávací tabulka pojišťoven

Statická tabulka hlavních pojišťoven:

```
| Pojišťovna     | Povinné ručení od | Havarijní od | Asistenční služba |
|----------------|-------------------|-------------|-------------------|
| Česká pojišťovna| 1 999 Kč/rok      | od 1,5 %    | Zdarma v tarifu   |
| Allianz         | 2 199 Kč/rok      | od 1,8 %    | Příplatek         |
| Generali        | 1 899 Kč/rok      | od 1,6 %    | Zdarma             |
| ČSOB            | 2 099 Kč/rok      | od 1,7 %    | Zdarma v Premium   |
| Kooperativa     | 2 299 Kč/rok      | od 1,9 %    | Příplatek         |
```

**POZOR:** Ceny se mění — udržovat aktuální, nebo přidat "orientační ceny, květen 2026".

---

## 4. Seznam souborů

| Soubor | Typ | Detail |
|--------|-----|--------|
| `components/web/PojisteniCalc.tsx` | NEW | Kalkulačka + kontaktní formulář |
| `app/(web)/sluzby/pojisteni/page.tsx` | EDIT | Import PojisteniCalc místo PojisteniForm |
| `components/web/PojisteniForm.tsx` | KEEP | Nemazat — může být potřeba jinde |

---

## 5. STOP pravidla

- **STOP-1:** Kalkulačka je ORIENTAČNÍ, ne přesná. Nikdy neuvádět přesné číslo, vždy rozsah.
- **STOP-2:** Nepřipojovat API pojišťoven — to je komplexní integrace (API klíče, smlouvy). Stačí statické tabulky.
- **STOP-3:** Zachovat stávající kontaktní formulář flow — kalkulačka ho rozšiřuje, nenahrazuje.
- **STOP-4:** Disclaimer je POVINNÝ: "Orientační výpočet. Skutečné pojistné závisí na individuálních faktorech."

---

## 6. Acceptance Criteria

- [ ] Kalkulačka na `/sluzby/pojisteni` počítá orientační pojistné
- [ ] Uživatel vidí rozsah cen ihned po zadání parametrů (bez submitu)
- [ ] Po kalkulaci může odeslat kontaktní formulář
- [ ] Formulář posílá kalkulovaná data do `/api/contact`
- [ ] Disclaimer je viditelný
- [ ] Mobile-friendly (responsive)
- [ ] `npm run build` projde
