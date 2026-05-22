# Plan: Fix "Nejoblíbenější" badge viditelnost na inzerce pricing cards

**Task:** #5
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** Bugfix (UI)
**Závažnost:** LOW — 1 soubor, 1 řádek změna

---

## 1. Root cause

**`components/ui/Card.tsx` řádek 13:**
```tsx
"bg-white rounded-2xl shadow-card overflow-hidden transition-all duration-300"
```

**`app/(web)/inzerce/page.tsx` řádky 314-319:**
```tsx
<Card hover className="p-8 relative ring-2 ring-orange-500">
  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
      Nejoblíbenější
    </span>
  </div>
```

Badge používá `absolute -top-3` (12px nad horní hranou karty). Card má `overflow-hidden` → badge je oříznutý a neviditelný.

---

## 2. Řešení

### Varianta A: Override overflow na konkrétní kartě (DOPORUČENÁ)

Přidat `overflow-visible` do className prop Bazar karty. Tailwind CSS: pozdější třída přepíše `overflow-hidden` z Card base.

**`app/(web)/inzerce/page.tsx` řádek 314:**
```tsx
// PŘED:
<Card hover className="p-8 relative ring-2 ring-orange-500">

// PO:
<Card hover className="p-8 relative ring-2 ring-orange-500 overflow-visible">
```

**Proč je to bezpečné:** Bazar karta nemá obrázky ani jiný obsah, který by vyžadoval overflow clipping. `overflow-hidden` na Card slouží primárně pro zaoblené rohy obrázků (např. v listing kartách) — tady žádné obrázky nejsou.

**POZOR:** Tailwind CSS 4 respektuje pořadí tříd v className stringu pro specifičnost. `overflow-visible` v className prop se sloučí přes `cn()` (clsx/twMerge) → `overflow-visible` přepíše `overflow-hidden`.

---

### Varianta B: Wrapper div (alternativa, bezpečnější ale víc kódu)

Obalit Card wrapperem a badge umístit na wrapper:

```tsx
<div className="relative">
  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
      Nejoblíbenější
    </span>
  </div>
  <Card hover className="p-8 ring-2 ring-orange-500">
    {/* ... obsah bez badge div ... */}
  </Card>
</div>
```

Výhoda: Card zůstane nedotčená, overflow-hidden se neřeší.
Nevýhoda: Více kódu, přesun badge mimo Card mění strukturu.

---

## 3. Doporučení

**Varianta A** — nejjednodušší, 1 řádek změna, `cn()` utility (tw-merge) správně resolvne overflow conflict.

Pokud `cn()` neresolvne overflow správně (záleží na implementaci tw-merge) → fallback na **Variantu B**.

---

## 4. Ověření `cn()` implementace

Zkontrolovat `lib/utils.ts` — pokud používá `twMerge` z `tailwind-merge`, pak Varianta A funguje spolehlivě (twMerge resolvne `overflow-hidden` + `overflow-visible` → `overflow-visible`).

Pokud `cn()` je jen `clsx()` bez twMerge, pak obě třídy zůstanou v outputu a výsledek závisí na CSS source order — v Tailwind CSS 4 je to nedeterministické → použít Variantu B.

---

## 5. Soubory k úpravě

| Soubor | Typ změny | Řádky |
|--------|-----------|-------|
| `app/(web)/inzerce/page.tsx` | EDIT className (Var. A) NEBO wrap+move badge (Var. B) | ř. 314 |

**Celkem:** 1 soubor, 1 řádek (Var. A) nebo ~8 řádků (Var. B).

---

## 6. STOP pravidla

- **STOP-1:** Ověřit `cn()` implementaci v `lib/utils.ts` — pokud NEMÁ `twMerge`, přejít na Variantu B
- **STOP-2:** Po změně ověřit vizuálně, že badge je plně viditelný A zaoblené rohy karty stále fungují
- **STOP-3:** Zkontrolovat, že `ring-2 ring-orange-500` obrys karty nepřekrývá badge (z-index)

---

## 7. Testování

1. `npm run dev` → navštívit `http://localhost:3000/inzerce`
2. Scroll na pricing karty sekci
3. Ověřit: badge "Nejoblíbenější" je plně viditelný nad Bazar kartou
4. Ověřit: oranžový ring kolem karty nepřekrývá badge
5. Ověřit: ostatní karty (Soukromý, Dealer) nejsou vizuálně ovlivněné
6. Mobile: Ověřit na malém viewportu — badge stále viditelný

---

## 8. Acceptance Criteria

- [ ] Badge "Nejoblíbenější" je plně viditelný nad Bazar pricing kartou
- [ ] Badge text je čitelný (bílý text na oranžovém pozadí)
- [ ] Zaoblené rohy karty stále fungují
- [ ] Ring obrys (ring-2 ring-orange-500) nepřekrývá badge
- [ ] Ostatní pricing karty nejsou vizuálně ovlivněné
- [ ] Mobile responsive — badge viditelný na všech viewportech
