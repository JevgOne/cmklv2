# Plan: STK stanice — adresář + recenze

**Task:** #17
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** New Feature (rozšíření autoservisy modelu)
**Závažnost:** LOW — bonus feature, závisí na #13 (autoservisy)

---

## 1. Klíčové rozhodnutí: Nový model vs rozšíření AutoServis

### Doporučení: ROZŠÍŘIT AutoServis (ne nový model)

**Důvody:**
1. STK stanice JE typ autoservisu — sdílí 90% datového modelu (název, adresa, GPS, telefon, recenze, rating)
2. AutoServis model už má `categories: String[]` kde `"stk-emise"` je jedna z 9 kategorií
3. Duplikace modelu = duplikace admin stránky, API routes, komponent, SEO logic
4. Uživatel hledající "STK Praha" chce stejný typ informací jako "autoservis Praha"

**Implementace:** STK stanice = AutoServis s `categories: ["stk-emise"]` + speciální SEO landing pages na `/stk/`.

### Specifická data pro STK (rozšíření):

Přidat do AutoServis model:

```prisma
// STK-specifická pole (nullable — jen pro STK stanice)
stkLine         Int?                     // Počet linek (1-5)
stkWaitDays     Int?                     // Průměrná čekací doba (dny)
stkOnlineBooking Boolean @default(false) // Umožňuje online rezervaci
stkEmissions    Boolean @default(true)   // Dělá i měření emisí
stkMotorcycles  Boolean @default(false)  // STK pro motorky
stkTrailers     Boolean @default(false)  // STK pro přívěsy
stkHeavy        Boolean @default(false)  // STK pro nákladní vozy
```

### Specifická data v ServisReview (rozšíření):

```prisma
// STK-specifické hodnocení
ratingWaitTime  Int?                     // Čekací doba (1-5)
ratingFairness  Int?                     // Férovost posouzení (1-5)
passedInspection Boolean?                // Prošel/neprošel STK
```

---

## 1b. Oficiální ceník STK (státem regulované ceny)

Ceny STK jsou v ČR **regulované státem** (vyhláška č. 302/2001 Sb.) — fixní podle kategorie vozidla. Toto je silný SEO/UX content: uživatel hledá "kolik stojí STK" → přesná odpověď.

### Ceník (platný 2026, ověřit aktuálnost):

```typescript
// lib/stk-pricing.ts

export const STK_PRICES = [
  { category: "L",   label: "Motocykl",                          stk: 400,  emise: 200,  total: 600  },
  { category: "M1",  label: "Osobní automobil (do 3,5 t)",       stk: 800,  emise: 400,  total: 1200 },
  { category: "M1G", label: "Osobní automobil — terénní",        stk: 800,  emise: 400,  total: 1200 },
  { category: "M2",  label: "Autobus (do 5 t)",                  stk: 1000, emise: 500,  total: 1500 },
  { category: "M3",  label: "Autobus (nad 5 t)",                 stk: 1400, emise: 700,  total: 2100 },
  { category: "N1",  label: "Nákladní (do 3,5 t)",               stk: 800,  emise: 400,  total: 1200 },
  { category: "N2",  label: "Nákladní (3,5–12 t)",               stk: 1000, emise: 500,  total: 1500 },
  { category: "N3",  label: "Nákladní (nad 12 t)",               stk: 1400, emise: 700,  total: 2100 },
  { category: "O1",  label: "Přívěs (do 750 kg)",                stk: 400,  emise: null, total: 400  },
  { category: "O2",  label: "Přívěs (750 kg – 3,5 t)",          stk: 500,  emise: null, total: 500  },
  { category: "O3",  label: "Přívěs (3,5–10 t)",                stk: 700,  emise: null, total: 700  },
  { category: "O4",  label: "Přívěs (nad 10 t)",                stk: 900,  emise: null, total: 900  },
  { category: "T",   label: "Traktor",                           stk: 500,  emise: 300,  total: 800  },
] as const;

// Poznámka: ceny jsou BEZ DPH (STK stanice nejsou plátci DPH u regulovaných cen)
// Emise = měření emisí (povinné u vozidel s motorem, ne u přívěsů)
```

### Mini-kalkulátor "Kolik zaplatím za STK?"

**Komponenta:** `components/web/StkPriceCalc.tsx`

```
┌───────────────────────────────────────┐
│  Kolik zaplatím za STK?               │
│                                       │
│  Vyberte typ vozidla:                 │
│  [Osobní auto ▾]                      │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ STK prohlídka:        800 Kč   │  │
│  │ Měření emisí:         400 Kč   │  │
│  │ ────────────────────────────    │  │
│  │ Celkem:             1 200 Kč   │  │
│  └─────────────────────────────────┘  │
│                                       │
│  ℹ️ Ceny jsou regulované státem       │
│     (vyhláška č. 302/2001 Sb.)        │
└───────────────────────────────────────┘
```

**UX:** Select dropdown → okamžitý výsledek (žádný submit). Jednoduché, rychlé, přesné.

### Kde zobrazit ceník:

1. **`/stk` (seznam)** — ceníková tabulka nad seznamem stanic + mini-kalkulátor v sidebaru
2. **`/stk/[slug]` (detail)** — mini-kalkulátor v sidebaru detailu stanice
3. **SEO:** JSON-LD `Offer` s cenami pro každou kategorii → Google rich snippets "STK cena"

### Soubory pro ceník:

| Soubor | Typ | Detail |
|--------|-----|--------|
| `lib/stk-pricing.ts` | NEW | Statická data ceníku STK (regulované ceny) |
| `components/web/StkPriceCalc.tsx` | NEW | Mini-kalkulátor "Kolik zaplatím za STK?" |
| `components/web/StkPriceTable.tsx` | NEW | Kompletní ceníková tabulka všech kategorií |

---

## 2. URL struktura

```
/stk                           → Seznam STK stanic (= filtrovaný /autoservisy kde categories obsahuje "stk-emise")
/stk/[slug]                    → Detail STK stanice (redirect nebo alias na /autoservisy/[slug])
/stk/mesto/[city]              → SEO landing: "STK stanice Praha"
```

**Implementace:** `/stk` stránky jsou efektivně FILTRY nad autoservisy databází.

### Alternativa: Symlinky

```tsx
// app/(web)/stk/page.tsx
export default function StkPage() {
  return <AutoservisyPage defaultCategory="stk-emise" title="STK stanice" />;
}
```

Tím sdílíme logiku s autoservisy, jen s jiným filtrem a texty.

---

## 3. Implementační plán

### Předpoklad: Task #13 (Autoservisy) je implementován

STK stanice závisí na autoservisy feature. Implementovat PO autoservisech.

### Krok 1: Rozšířit AutoServis Prisma model

**Soubor:** `prisma/schema.prisma` — přidat STK-specifická pole do AutoServis

```prisma
// Přidat do model AutoServis:
stkLines          Int?
stkWaitDays       Int?
stkOnlineBooking  Boolean  @default(false)
stkEmissions      Boolean  @default(true)
stkMotorcycles    Boolean  @default(false)
stkTrailers       Boolean  @default(false)
stkHeavy          Boolean  @default(false)
```

**Migrace:** `npx prisma migrate dev --name add-stk-fields`

### Krok 2: STK landing pages

| Soubor | Popis |
|--------|-------|
| `app/(web)/stk/page.tsx` | Seznam STK stanic (filtrovaný autoservisy) |
| `app/(web)/stk/layout.tsx` | Layout |
| `app/(web)/stk/loading.tsx` | Loading |
| `app/(web)/stk/[slug]/page.tsx` | Detail STK stanice |
| `app/(web)/stk/mesto/[city]/page.tsx` | SEO landing "STK Praha" |
| `app/(web)/stk/opengraph-image.tsx` | OG obrázek |

### Krok 3: STK-specifické komponenty + ceník

| Soubor | Popis |
|--------|-------|
| `lib/stk-pricing.ts` | Statická data ceníku STK (regulované ceny dle vyhlášky) |
| `components/web/StkPriceCalc.tsx` | Mini-kalkulátor "Kolik zaplatím za STK?" (select → cena) |
| `components/web/StkPriceTable.tsx` | Kompletní ceníková tabulka všech kategorií vozidel |
| `components/web/StkInfoCard.tsx` | Karta s STK specifickými info (linky, čekací doba, typy STK) |
| `components/web/StkReviewExtras.tsx` | Extra pole v recenzi (čekací doba, férovost, prošel/neprošel) |

### Krok 4: SEO

**JSON-LD:** `GovernmentService` nebo `AutoRepair` s `additionalType: "STK"` 

**Meta tagy:**
- Seznam: "STK stanice v {městě} — recenze, čekací doby | CarMakléř"
- Detail: "{name} STK — {city} | {rating}★, čekací doba {days} dní | CarMakléř"

**Target keywords:**
| Query | Měsíční objem |
|-------|---------------|
| STK Praha | 2 400 |
| STK Brno | 1 200 |
| STK stanice | 880 |
| STK cena | 1 600 |
| Kolik stojí STK | 1 300 |
| STK [město] | 200-800 |
| Kde na STK | 590 |

**Ceníkové SEO:** Stránka `/stk` s ceníkem cílí na "STK cena" a "kolik stojí STK" (celkem ~2 900 searches/měsíc). Regulované ceny = přesná odpověď = Google Featured Snippet potenciál.

### Krok 5: Cross-linking

- `/nabidka/[slug]` → "Kde na STK v {city}?" link
- `/autoservisy/[slug]` → "Tato stanice provádí i STK" badge (pokud má kategorii)
- Footer → "STK stanice" link
- Homepage → card v sekci služeb

---

## 4. Seznam souborů

| Soubor | Typ | Detail |
|--------|-----|--------|
| `prisma/schema.prisma` | EDIT | +STK pole v AutoServis |
| `app/(web)/stk/page.tsx` | NEW | Seznam STK stanic |
| `app/(web)/stk/layout.tsx` | NEW | Layout |
| `app/(web)/stk/loading.tsx` | NEW | Loading |
| `app/(web)/stk/[slug]/page.tsx` | NEW | Detail STK |
| `app/(web)/stk/mesto/[city]/page.tsx` | NEW | SEO město landing |
| `app/(web)/stk/opengraph-image.tsx` | NEW | OG |
| `lib/stk-pricing.ts` | NEW | Statická data ceníku STK |
| `components/web/StkPriceCalc.tsx` | NEW | Mini-kalkulátor "Kolik zaplatím?" |
| `components/web/StkPriceTable.tsx` | NEW | Ceníková tabulka |
| `components/web/StkInfoCard.tsx` | NEW | STK specifická info karta |
| `components/web/StkReviewExtras.tsx` | NEW | Extra review pole |

---

## 5. STOP pravidla

- **STOP-1:** NESMÍ existovat bez autoservisů (Task #13). STK = filtr nad autoservisy. Implementovat AŽ PO #13.
- **STOP-2:** Netvořit nový Prisma model. Rozšířit AutoServis. Duplikace = zbytečná práce.
- **STOP-3:** STK slug MUSÍ být unikátní v rámci AutoServis (sdílený slug space). Pattern: `stk-{name}-{city}`.
- **STOP-4:** Detail STK stanice na `/stk/[slug]` by měl sdílet layout s `/autoservisy/[slug]` — ne duplikovat.
- **STOP-5:** Čekací doby jsou USER-REPORTED data, ne oficiální. Uvádět "průměrná čekací doba dle recenzí".

---

## 6. Acceptance Criteria

- [ ] STK pole přidána do AutoServis modelu
- [ ] `/stk` zobrazuje pouze autoservisy s kategorií "stk-emise"
- [ ] `/stk/[slug]` zobrazuje detail STK stanice s extra info
- [ ] `/stk/mesto/[city]` funguje jako SEO landing
- [ ] Recenze STK mají extra pole (čekací doba, férovost, prošel/neprošel)
- [ ] JSON-LD structured data na detail stránce
- [ ] Cross-linking z nabídky vozidel na STK
- [ ] OG obrázek
- [ ] `npm run build` projde
