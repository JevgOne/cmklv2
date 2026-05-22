# Audit + Plán — Auto-generovaný popis vozidla z výbavy (AI)

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Status:** ČEKÁ NA SCHVÁLENÍ LEADEM

---

## Executive Summary

Funkcionalita **UŽ EXISTUJE a FUNGUJE**. API endpoint + UI tlačítko + prompt — vše je na místě. Popis se generuje z technických dat VČETNĚ výbavy a highlights. Problém je spíš v **discoverability** a **UX flow** — uživatel neví, že to existuje, nebo to nenajde ve správný okamžik.

---

## Současný stav — co už existuje

### 1. API endpoint: ✅ KOMPLETNÍ
**Soubor:** `app/api/assistant/generate-description/route.ts`

- **URL:** `POST /api/assistant/generate-description`
- **Auth:** session required (přihlášený uživatel)
- **Input (Zod validace):**
  - `brand`, `model`, `year`, `mileage`, `condition` (povinné)
  - `fuelType`, `transmission`, `enginePower`, `bodyType`, `color` (volitelné)
  - **`equipment: string[]`** (volitelné) ← výbava JE podporována
  - **`highlights: string[]`** (volitelné) ← hlavní přednosti JSOU podporovány
- **Model:** `claude-sonnet-4-20250514`
- **Output:** `{ description: string }` — 3-5 odstavců prodejního popisu v češtině

### 2. System prompt: ✅ KVALITNÍ
Prompt instruuje AI k:
- Profesionálnímu ale přátelskému tónu v češtině
- 3-5 odstavců (úvod → technický stav + výbava → výzva k akci)
- Konkrétní zmiňování výbavy a vlastností
- Zdůraznění highlights
- Žádné superlativy bez podkladu, žádné emoji

### 3. UI tlačítko v PricingStep (krok 6): ✅ EXISTUJE
**Soubor:** `components/pwa/vehicles/new/PricingStep.tsx:148-187, 448-469`

- Tlačítko "Vygenerovat popis AI" s ikonou sparkle
- Loading state: "Generuji popis..."
- Disabled když chybí brand/model
- **Posílá:** brand, model, year, mileage, condition, fuelType, transmission, enginePower, bodyType, color, **equipment**, **highlights**
- Výsledek se vloží do textarea pro popis

### 4. UI tlačítko v DetailsStep (krok 5): ✅ EXISTUJE
**Soubor:** `components/pwa/vehicles/new/DetailsStep.tsx:199-230, 686-695`

- Stejné tlačítko "Vygenerovat popis AI"
- Posílá: brand, model, variant, year, mileage, fuelType, transmission, enginePower, bodyType, condition, color, **equipment**, **highlights**
- Výsledek se uloží přes `updateField("description", data.description)`

### 5. Quick flow: ❌ NEMÁ generování popisu
**Soubor:** `components/pwa/vehicles/quick/QuickStep3.tsx`
- Quick flow (3 kroky pro STAR_2+ makléře) nemá AI generování popisu
- Quick flow vůbec nemá pole pro popis — zaměřuje se na rychlost

---

## Co NEFUNGUJE nebo CHYBÍ

### Problém 1: Popis se negeneruje AUTOMATICKY po vyplnění výbavy
**Aktuální flow:**
```
DetailsStep (krok 5):
  → Makléř vyplní výbavu (EquipmentSelector) + highlights
  → Makléř RUČNĚ klikne "Vygenerovat popis AI"
  → AI vygeneruje popis
  
PricingStep (krok 6):
  → Makléř ZNOVU vidí tlačítko "Vygenerovat popis AI"
  → Může znovu vygenerovat (pokud zapomněl v kroku 5)
```

**Problém:** Makléř musí vědět, že tlačítko existuje, a musí ho ručně kliknout. Pokud ho přehlédne, odešle vozidlo bez popisu nebo s ručně napsaným nekvalitním popisem.

### Problém 2: Tlačítko je vizuálně nenápadné
V PricingStep je tlačítko `bg-orange-50 text-orange-700` — jemný oranžový link-like styl. Není to prominentní CTA. Makléř ho může přehlédnout.

### Problém 3: Quick flow nemá popis vůbec
Quick flow je zrychlený 3-krokový flow pro zkušené makléře. Nemá ani pole pro popis, natož AI generování. To může být záměr (rychlost), ale vozidlo pak jde ke schválení bez popisu.

---

## Doporučené vylepšení

### Možnost A: Auto-generovat po vyplnění výbavy (DOPORUČENO)

**Kde:** DetailsStep (krok 5) — po výběru výbavy a highlights

**Logika:**
```typescript
// V DetailsStep — useEffect po změně equipment/highlights:
useEffect(() => {
  // Auto-generovat pouze pokud:
  // 1. Uživatel vyplnil alespoň 3 položky výbavy
  // 2. Popis je prázdný (nikdy nebyl generován ani ručně napsán)
  // 3. Máme povinná data (brand, model, year, mileage, condition)
  if (
    form.equipment?.length >= 3 &&
    !form.description &&
    form.brand && form.model && form.year && form.mileage && form.condition
  ) {
    handleGenerateDescription();
  }
}, [form.equipment?.length, form.highlights?.length]);
```

**Výhody:**
- Zero-effort pro makléře — popis se objeví "magicky"
- Makléř může editovat výsledek
- Netlačí na API pokud je popis už vyplněný

**Rizika:**
- API call při každé změně výbavy by byl moc — potřeba debounce
- Makléř může být překvapen, že se popis přepsal

**Mitigace:**
- Generovat jen jednou (když popis je prázdný)
- Toast notifikace: "AI vygenerovalo popis z vaší výbavy"
- Tlačítko "Regenerovat" zůstane pro ruční trigger

### Možnost B: Prominentnější CTA + tooltip (JEDNODUŠŠÍ)

**Kde:** DetailsStep — po sekci výbavy/highlights

**Změna:**
1. Zvětšit tlačítko — `variant="primary"` místo jemného link stylu
2. Přidat tooltip/hint: "Tip: AI vygeneruje prodejní popis z vaší výbavy a technických dat"
3. Pokud je popis prázdný a výbava vyplněná → animovaný pulse efekt na tlačítku

**Cílový počet řádků změn:** ~10-15

### Možnost C: Prompt sheet po vyplnění výbavy (STŘEDNÍ)

Po uložení výbavy v DetailsStep ukázat prompt/sheet:
```
┌──────────────────────────────────────┐
│  ✨ Chcete vygenerovat popis AI?     │
│                                      │
│  Na základě výbavy a parametrů       │
│  vytvoříme profesionální popis.      │
│                                      │
│  [Vygenerovat]     [Napíšu sám]     │
└──────────────────────────────────────┘
```

---

## Doporučený plán implementace

**Doporučuji kombinaci Možností A + B:**

### KROK 1: Vylepšit CTA v DetailsStep (~15 řádků)
- Zvětšit tlačítko "Vygenerovat popis AI" na full-width primary button
- Přidat podnázev: "Vytvoří prodejní popis z technických dat a výbavy"
- Podmíněné zobrazení: jen když je popis prázdný

### KROK 2: Auto-generovat při prázdném popisu (~20 řádků)
- V DetailsStep přidat `useEffect` s debounce (2s)
- Trigger: `equipment.length >= 3 && !description && hasRequiredData`
- Jednou generovat, pak nechat makléři kontrolu
- Loading state v textarea: "AI generuje popis..."

### KROK 3: Toast notifikace (~5 řádků)
- Po úspěšném auto-generování: "Popis vygenerován z výbavy. Můžete ho upravit."

### KROK 4 (volitelné): Quick flow description field (~30 řádků)
- Přidat textarea pro popis do QuickStep3
- Auto-generovat z dat co má quick flow (VIN decoded → brand/model/year + výbava)

---

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `components/pwa/vehicles/new/DetailsStep.tsx` | Zvětšit CTA, přidat auto-generate useEffect s debounce |
| 2 | `components/pwa/vehicles/new/PricingStep.tsx` | Skrýt generate button pokud popis už existuje (aby makléř nemusel vidět 2x) |
| 3 | `components/pwa/vehicles/quick/QuickStep3.tsx` | (volitelné) Přidat description field + auto-generate |

**Žádné nové soubory. Žádné API změny.** Endpoint + prompt jsou připraveny.

---

## STOP kritéria

1. Po vyplnění 3+ položek výbavy a odchodu z výbavy sekce se auto-vygeneruje popis (pokud byl prázdný)
2. Makléř vidí toast "Popis vygenerován"
3. Makléř může popis editovat po auto-generování
4. Ruční tlačítko "Regenerovat popis" stále funguje
5. Pokud makléř napsal vlastní popis, auto-generate se nespustí
6. `npm run build` projde bez chyb

---

## Rizika

| Riziko | Pravděpodobnost | Mitigace |
|--------|----------------|----------|
| API rate limit (Claude) | Nízká | Generovat max 1x za session, debounce 2s |
| Makléř nechce AI popis | Střední | Auto-gen jen když prázdný, vždy editovatelný |
| Pomalé generování (3-5s) | Střední | Loading state v textarea, non-blocking UX |
| Quick flow bez popisu | Nízká | Volitelné — quick flow je záměrně minimální |

---

*Plán připraven: 2026-04-26*  
*Čeká na schválení team leadem*
