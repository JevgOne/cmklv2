# Plan: FIX M7+M8+M11 — Eshop visual search + checkout error + shipping label

**Task:** #29
**Issue IDs:** M7, M8, M11 z audit-deep-stubs-broken-20260424.md
**Autor:** Plánovač
**Datum:** 2026-04-24

---

## ANALÝZA

### M7 — Visual search API stub

**Soubor:** `app/api/parts/visual-search/route.ts:19-24`

Stávající stav:
```ts
if (!anthropicKey) {
  return NextResponse.json({
    recognized: false,
    message: "Vizuální vyhledávání je ve vývoji. Zkuste popsat díl textově.",
    suggestions: [],
  });
}
```

**Klíčové zjištění:** API route existuje a je plně implementovaná (Claude Vision → Prisma search). Problém je **jen chybějící `ANTHROPIC_API_KEY`** v env.

**UI tlačítko:** Grep nenašel žádný komponent v `app/(web)/dily/`, `app/(web)/shop/` ani `components/web/` který by volal `/api/parts/visual-search`. Buď:
- Tlačítko bylo odstraněno/nikdy přidáno do UI
- Je v komponentu pod jiným názvem

**Rozhodnutí:** Pokud UI tlačítko neexistuje, API je "mrtvý kód" — funkční ale nedostupný uživateli. Fix: Přidat `ANTHROPIC_API_KEY` do env (už je v projektu — AI asistent pro makléře ho používá) a API je ihned funkční. Pokud se UI tlačítko nenajde, vytvořit plan na UI integraci jako follow-up.

**POZNÁMKA PRO IMPLEMENTÁTORA:** Zkontrolovat jestli `ANTHROPIC_API_KEY` je v produkčním `.env`. Pokud ano → API funguje automaticky. Pokud ne → přidat. Pokud UI tlačítko skutečně neexistuje → nahlásit leadovi jako nový task (UI component pro visual search).

---

### M8 — Checkout error tiše přesměruje na "demo" potvrzení

**Soubor:** `app/(web)/shop/objednavka/page.tsx:119-130`

Stávající stav — **DVĚ kritické chyby:**

**Chyba 1 (ř. 119-124):** Pokud API vrátí error (non-200):
```ts
} else {
  const errData = await res.json().catch(() => null);
  console.error("Order error:", errData);
  // Fallback: demo mode
  clearCart();
  router.push("/shop/objednavka/potvrzeni?id=demo-" + Date.now());
}
```
→ Vymaže košík a přesměruje na falešné potvrzení! Uživatel si myslí že objednal, ale nic se nestalo.

**Chyba 2 (ř. 126-129):** Network error:
```ts
} catch {
  // Fallback: demo mode
  clearCart();
  router.push("/shop/objednavka/potvrzeni?id=demo-" + Date.now());
}
```
→ Totéž — tiché smazání košíku + falešné potvrzení.

**Toto je potenciálně nejzávažnější bug v celém auditu.** Zákazník "odešle" objednávku, vidí potvrzení, ale objednávka neexistuje.

---

### M11 — Shipping label "(nedostupné)"

**Soubor:** `components/pwa-parts/orders/ShippingLabelCard.tsx:247-254`

Stávající stav (Variant 3 — label not ready):
```tsx
<Button variant="outline" size="lg" className="w-full mt-4" disabled>
  🖨️ Stáhnout štítek (nedostupné)
</Button>
```

**Kontext:** Toto se zobrazuje POUZE v Variant 3 (`!shippingLabelUrl`) — tj. čekání na platbu. Tlačítko je disabled s "(nedostupné)" — technicky korektní (štítek se vygeneruje po platbě), ale UX je nejasný.

**Pozor:** Varianty 4+5 (label ready) mají funkční stahování. Variant 1 (PICKUP) a 2 (shipped) jsou OK. Problém je jen textace a vizuální komunikace stavu ve Variant 3.

---

## IMPLEMENTAČNÍ PLÁN (3 kroky)

### Krok 1: FIX M8 — Checkout error zobrazit uživateli

**Soubor:** `app/(web)/shop/objednavka/page.tsx`

**KRITICKÉ:** Odstranit "demo mode" fallback — NIKDY nesmí clearCart() + fake redirect při chybě.

**Přidat state (za ř. 30):**
```ts
const [submitError, setSubmitError] = useState<string | null>(null);
```

**Nahradit ř. 119-130 (else + catch bloky):**

```ts
} else {
  const errData = await res.json().catch(() => null);
  console.error("Order error:", errData);
  setSubmitError(
    errData?.error || "Objednávku se nepodařilo odeslat. Zkuste to prosím znovu."
  );
  // NESMÍ clearCart() — uživatel musí moci zkusit znovu!
}
} catch {
  setSubmitError("Chyba spojení. Zkontrolujte připojení k internetu a zkuste to znovu.");
  // NESMÍ clearCart()!
} finally {
  setSubmitting(false);
}
```

**Přidat error UI nad Submit button (ř. ~293):**
```tsx
{submitError && (
  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
    <p className="text-sm font-semibold text-red-700">{submitError}</p>
  </div>
)}
```

**Reset error při novém pokusu — na začátek handleSubmit:**
```ts
setSubmitError(null);
```

---

### Krok 2: FIX M7 — Visual search API key check

**Soubor:** `app/api/parts/visual-search/route.ts`

Minimální fix — vylepšit fallback response:

```ts
if (!anthropicKey) {
  return NextResponse.json({
    recognized: false,
    message: "Vizuální vyhledávání je momentálně nedostupné. Zkuste popsat díl textově.",
    suggestions: [],
    status: "unavailable",
  }, { status: 503 });
}
```

**Přidat HTTP 503** místo 200 — UI může reagovat na status code.

**DŮLEŽITÉ:** Hlavní fix je přidat `ANTHROPIC_API_KEY` do produkčního `.env`. API je plně funkční — jen chybí klíč. Implementátor MUSÍ ověřit env na produkci.

---

### Krok 3: FIX M11 — Shipping label UX vylepšení

**Soubor:** `components/pwa-parts/orders/ShippingLabelCard.tsx`

Nahradit Variant 3 disabled button (ř. 247-254) za jasnější messaging:

```tsx
<div className="mt-4 space-y-2">
  <Button variant="outline" size="lg" className="w-full" disabled>
    🖨️ Čekáme na vygenerování štítku
  </Button>
  <p className="text-xs text-center text-gray-400">
    Štítek se automaticky vygeneruje po přijetí platby.
  </p>
</div>
```

Tím:
1. Odstraníme matoucí "(nedostupné)" — zní jako by funkce neexistovala
2. Přidáme vysvětlení PROČ nelze stáhnout
3. Zachováme disabled state (korektní — nelze stáhnout co neexistuje)

---

## SOUBORY K EDITACI

| # | Soubor | Akce | Popis |
|---|--------|------|-------|
| 1 | `app/(web)/shop/objednavka/page.tsx` | EDIT ř.87-130 | Odstranit demo fallback, přidat error UI |
| 2 | `app/api/parts/visual-search/route.ts` | EDIT ř.19-24 | HTTP 503 + vylepšená zpráva |
| 3 | `components/pwa-parts/orders/ShippingLabelCard.tsx` | EDIT ř.247-254 | Jasnější UX pro čekání na štítek |

---

## ACCEPTANCE CRITERIA

- [ ] **M8 KRITICKÉ:** Checkout error NIKDY nevymaže košík
- [ ] **M8 KRITICKÉ:** Checkout error NIKDY nepřesměruje na falešné potvrzení
- [ ] M8: Při chybě objednávky se zobrazí červený alert s chybovou hláškou
- [ ] M8: Uživatel může zkusit odeslat znovu (košík zachován, step 3 zachován)
- [ ] M8: Error message zmizí při novém pokusu
- [ ] M7: API vrací HTTP 503 (ne 200) pokud chybí API key
- [ ] M7: Implementátor ověřil `ANTHROPIC_API_KEY` v produkčním `.env`
- [ ] M11: Shipping label tlačítko říká "Čekáme na vygenerování štítku" místo "(nedostupné)"
- [ ] M11: Pod tlačítkem je vysvětlení "po přijetí platby"
- [ ] TypeScript build OK

## STOP PRAVIDLA

- **STOP-1:** Pokud se zjistí, že "demo mode" v checkout je záměrný pro testování → konzultovat leada. Ale i tak nesmí být v produkci.
- **STOP-2:** Pokud `ANTHROPIC_API_KEY` není v produkčním env a lead nechce ho přidat → nechat API fallback ale přidat TODO komentář

## PRIORITA

**M8 je KRITICKÝ** — aktuálně může vést ke ztrátě objednávek zákazníků. Měl by být opravený jako první z tohoto batche.

## ODHAD

- **Složitost:** Nízká (3 soubory, ~20 řádků změn)
- **Risk:** M8 je nízký risk fix ale vysoký business impact; M7+M11 jsou kosmetické
