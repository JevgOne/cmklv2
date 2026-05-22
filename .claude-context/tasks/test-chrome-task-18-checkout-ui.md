# Chrome Browser Test — Task #18 Checkout UI (6 dopravců)
**Datum:** 2026-04-06  
**Tester:** TEST-CHROME agent  
**Commit:** a1e0985  
**Playwright:** headed Chromium 1280×900

---

## Výsledek: ✅ PASS — Checkout UI funguje správně

---

## User Journey — Krok za krokem

### 1. Shop → Katalog → Přidání do košíku

| Krok | Status | Detail |
|------|--------|--------|
| `/dily/katalog?category=ENGINE` se načte | ✅ | H1: "Katalog dílů a příslušenství" |
| "Do košíku" tlačítko viditelné | ✅ | Na každé kartě produktu |
| Klik → produkt přidán | ✅ | Motor 2.0 TDI DFGA komplet |
| Košík badge se aktualizuje | ✅ | Zobrazí "1" v navbaru |

### 2. Košík `/shop/kosik`

| Krok | Status | Detail |
|------|--------|--------|
| H1: "Košík" | ✅ | Stránka se načte |
| Produkt v košíku | ✅ | Motor 2.0 TDI DFGA komplet, 45 000 Kč |
| Souhrn objednávky | ✅ | Mezisoučet 45 000 Kč, Doprava "dle výběru" |
| "Pokračovat k objednávce" btn | ✅ | href="/shop/objednavka" |

### 3. Checkout Step 1 — Doručení `/shop/objednavka`

| Krok | Status | Detail |
|------|--------|--------|
| Wizard 3 kroků (1→2→3) | ✅ | Doručení → Platba → Potvrzení |
| Formulář — 7 polí | ✅ | Jméno, Příjmení, Email, Telefon, Ulice, Město, PSČ |
| Validace prázdných polí | ✅ | "Vyplňte jméno/příjmení/ulici..." zprávy |
| Vyplnění formuláře | ✅ | Všechna pole přijímají vstup (placeholder-based) |

**6 dopravců — KLÍČOVÝ TEST:**

| Dopravce | Cena | Emoji | Popis | Status |
|----------|------|-------|-------|--------|
| Zásilkovna | 79 Kč | 📦 | Vyzvednutí na jednom z 8 000+ výdejních míst | ✅ |
| PPL | 99 Kč | 🚚 | Doručení kurýrem na uvedenou adresu, 1–2 prac. dny | ✅ |
| DPD | 109 Kč | 🚚 | Doručení kurýrem na uvedenou adresu, 1–2 prac. dny | ✅ |
| GLS | 109 Kč | 🚚 | Doručení kurýrem na uvedenou adresu | ✅ |
| Česká pošta | 129 Kč | 🚚 | Doručení | ✅ |
| PICKUP (Osobní odběr) | Zdarma | 🏪 | Info box o vyzvednutí v sídle | ✅ |

- **6 radio buttons** (`name="deliveryMethod"`) přítomno ✅
- **Orange highlight** vybrané karty: ✅ (`[class*="orange"]` nebo `[class*="selected"]`)

**Zásilkovna interakce:**
- Kliknutí → Packeta text "Vybrat výdejní místo" se zobrazí ✅
- Text "8 000+ míst po celé ČR" přítomen ✅

**PICKUP interakce:**
- Kliknutí → info box s "Zdarma" + info o vyzvednutí ✅

### 4. Checkout Step 2 — Platba

| Platební metoda | Status | Detail |
|-----------------|--------|--------|
| Bankovní převod | ✅ | "Platba předem na účet" |
| Dobírka | ✅ | "Platba při převzetí (+39 Kč)" |
| Platba kartou | ✅ | "Okamžitá platba přes Stripe" |
| 3 radio buttons | ✅ | Správný počet |

**Souhrn ceny na step 2:**

| Položka | Hodnota | Status |
|---------|---------|--------|
| Motor 2.0 TDI x1 | 45 000 Kč | ✅ |
| Mezisoučet | 45 000 Kč | ✅ |
| Doprava (DPD) | 109 Kč | ✅ |
| **Celkem** | **45 109 Kč** | ✅ |

Cena = zboží + dopravce ✅ — kalkulace správná.

### 5. Checkout Step 3 — Potvrzení (Shrnutí)

| Sekce | Status | Detail |
|-------|--------|--------|
| Nadpis "Shrnutí objednávky" | ✅ | |
| Doručovací adresa | ✅ | Jméno, ulice, PSČ, město, email, telefon |
| Způsob platby | ✅ | "Bankovní převod" |
| Položky | ✅ | Motor 2.0 TDI DFGA komplet x 1 — 45 000 Kč |
| Celkový souhrn (pravý panel) | ✅ | Mezisoučet 45 000 Kč, Doprava 109 Kč, Celkem 45 109 Kč |
| Submit btn "Odeslat objednávku" | ✅ | Přítomen v obsahu stránky |

### 6. Stripe Redirect

| Test | Status | Detail |
|------|--------|--------|
| "Platba kartou" label visible | ✅ | |
| Pokračování na step 3 s Karta | ✅ | Shrnutí ukazuje "Platba kartou" |
| Stripe redirect | ⚠️ | Neprovedeno — bez `STRIPE_SECRET_KEY` v dev (očekávané chování) |

---

## Mirror Page `/dily/objednavka`

| Test | Status | Detail |
|------|--------|--------|
| Stránka se načte (ne 404) | ✅ | |
| Prázdný košík zpráva | ✅ | "Košík je prázdný — Nejdříve přidejte díly do košíku" |
| Stejná funkčnost jako /shop/ | ✅ | Identické UI (košík je state-based per session) |

---

## Nalezené problémy

### ✅ Žádné kritické bugy

### 🟡 Minor observations

1. **Formulářové inputy nemají `name` atribut** — fungují přes React state (placeholder-based selektory). UI funguje správně, jen Playwright selektory musí být přes placeholder.

2. **Stripe redirect bez klíčů** — očekávané chování v dev prostředí. Task description to explicitně uvádí jako non-requirement.

3. **`[DOPLNIT TELEFON]`** ve footeru — pre-existing issue.

---

## Celkové skóre

| Oblast | Pass | Fail |
|--------|------|------|
| Přidání do košíku | 4 | 0 |
| Košík zobrazení | 3 | 0 |
| Step 1 — formulář | 4 | 0 |
| Step 1 — 6 dopravců | 6 | 0 |
| Step 1 — Zásilkovna/Packeta | 2 | 0 |
| Step 1 — PICKUP info | 1 | 0 |
| Step 1 — Orange highlight | 1 | 0 |
| Step 2 — 3 platební metody | 3 | 0 |
| Step 2 — Souhrn s cenou | 4 | 0 |
| Step 3 — Shrnutí objednávky | 5 | 0 |
| Mirror /dily/ | 2 | 0 |
| **CELKEM** | **35** | **0** |

---

## Závěr

**Task #18 Checkout UI — ✅ PASS**

Všech 6 dopravců správně zobrazeno s cenami a popisy. 3-krokový wizard funguje. Zásilkovna/Packeta widget, PICKUP info box, orange highlight, kalkulace cen — vše funguje dle zadání. Stripe redirect neotestován (bez dev klíčů, dle zadání OK).
