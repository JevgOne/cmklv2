# Plan: Fix STK ceník — lepší vizuál a přehlednost

**Task:** #43
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** UI/UX redesign
**Závažnost:** MEDIUM — UX improvement, user-facing

---

## PROBLÉM

Uživatel říká: "ten ceník v tom STK stanice je hroznej dole nepřehledný"

### Aktuální stav

**2 komponenty:**
1. `StkPriceCalc.tsx` — interaktivní kalkulačka (dropdown + cena) → **OK, funguje dobře**
2. `StkPriceTable.tsx` — referenční tabulka 13 řádků → **PROBLEMATICKÁ**

**Kde se zobrazují:**
- `/stk` (list page) — obě v pravém sidebaru
- `/stk/[slug]` (detail) — jen StkPriceCalc v sidebaru
- `/stk/mesto/[city]` — jen StkPriceCalc

### Identifikované problémy s StkPriceTable

| # | Problém | Závažnost |
|---|---------|-----------|
| 1 | **Mobile: horizontální scrollování** — tabulka používá `overflow-x-auto`, na mobilu špatně čitelná | HIGH |
| 2 | **Žádné vizuální groupování** — 13 řádků bez rozlišení (osobní/nákladní/přívěsy) | HIGH |
| 3 | **Kódy kategorií matou** — M1, N2, O3 nic neříkají běžnému uživateli | MEDIUM |
| 4 | **Sloupec "Emise" matoucí** — "—" vypadá jako chyba, ne jako "neaplikuje se" | MEDIUM |
| 5 | **Žádné ikony** — chybí vizuální rozlišení typů vozidel | LOW |
| 6 | **Žádné zvýraznění nejčastější kategorie** — M1 má jen slabý bg-orange ale málo viditelný | LOW |
| 7 | **Tabulka je příliš dlouhá** — 13 řádků najednou, bez filtrování/collapsed sekcí | MEDIUM |

---

## NAVRHOVANÉ ŘEŠENÍ

### Varianta A: Grouped Cards (DOPORUČENÁ)

Místo jedné dlouhé tabulky — **4 skupiny karet** s vizuálním rozlišením:

```
┌─────────────────────────────────────────────┐
│ 🚗 Ceník STK prohlídek                     │
│ Ceny regulované státem (vyhl. 302/2001 Sb.) │
├─────────────────────────────────────────────┤
│                                             │
│ 🚗 Osobní automobily                        │
│ ┌─────────────────────────────────────────┐ │
│ │ Osobní automobil (M1)                   │ │
│ │ STK: 800 Kč · Emise: 400 Kč            │ │
│ │                         Celkem 1 200 Kč │ │ ← Zvýrazněný (nejčastější)
│ ├─────────────────────────────────────────┤ │
│ │ Terénní osobní (M1G)                    │ │
│ │ STK: 800 Kč · Emise: 400 Kč            │ │
│ │                         Celkem 1 200 Kč │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ 🏍️ Motocykly                               │
│ ┌─────────────────────────────────────────┐ │
│ │ Motocykl (L)                            │ │
│ │ STK: 400 Kč · Emise: 200 Kč            │ │
│ │                           Celkem 600 Kč │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ 🚛 Nákladní a autobusy                      │
│ ┌─────────────────────────────────────────┐ │
│ │ Nákladní do 3,5 t (N1)    Celkem 1 200  │ │
│ │ Nákladní 3,5–12 t (N2)    Celkem 1 500  │ │
│ │ Nákladní nad 12 t (N3)    Celkem 2 100  │ │
│ │ Autobus do 5 t (M2)       Celkem 1 500  │ │
│ │ Autobus nad 5 t (M3)      Celkem 2 100  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ 🚜 Přívěsy a traktory                      │
│ ┌─────────────────────────────────────────┐ │
│ │ Přívěs do 750 kg (O1)      400 Kč      │ │
│ │ Přívěs 750–3 500 kg (O2)   500 Kč      │ │
│ │ Přívěs 3,5–10 t (O3)       700 Kč      │ │
│ │ Přívěs nad 10 t (O4)       900 Kč      │ │
│ │ Traktor (T)                 800 Kč      │ │
│ │                                         │ │
│ │ ℹ️ Přívěsy nepodléhají emisní kontrole  │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Klíčové designové principy:

1. **4 skupiny** místo 13 nerozlišených řádků:
   - 🚗 Osobní automobily (M1, M1G)
   - 🏍️ Motocykly (L)
   - 🚛 Nákladní a autobusy (N1, N2, N3, M2, M3)
   - 🚜 Přívěsy a traktory (O1-O4, T)

2. **Nejčastější kategorie zvýrazněná** — M1 (osobní auto) s orange border/background + badge "Nejčastější"

3. **Mobile-first layout** — žádná tabulka, jen stacked karty:
   - Každá karta: název + kód v závorce
   - Cena breakdown: STK · Emise (inline, ne sloupce)
   - Celkem bold na pravé straně

4. **Přívěsy bez emise** — místo "—" jasné vysvětlení: "Přívěsy nepodléhají emisní kontrole"

5. **Kódy kategorií jako secondary info** — v závorce za názvem, ne jako primární identifikátor

---

## IMPLEMENTACE

### Soubory k editaci

| # | Soubor | Typ | Akce |
|---|--------|-----|------|
| 1 | `components/web/StkPriceTable.tsx` | EDIT | Kompletní redesign → grouped cards |
| 2 | `lib/stk-pricing.ts` | EDIT | Přidat `group` field pro groupování |

### Změny v `lib/stk-pricing.ts`

```typescript
export type StkPriceGroup = "personal" | "motorcycle" | "commercial" | "trailer";

export interface StkPriceRow {
  category: string;
  label: string;
  stk: number;
  emise: number | null;
  total: number;
  group: StkPriceGroup;      // NOVÉ
  highlight?: boolean;        // NOVÉ — pro M1 "nejčastější"
}

export const STK_PRICE_GROUPS: Record<StkPriceGroup, { label: string; icon: string }> = {
  personal: { label: "Osobní automobily", icon: "🚗" },
  motorcycle: { label: "Motocykly", icon: "🏍️" },
  commercial: { label: "Nákladní a autobusy", icon: "🚛" },
  trailer: { label: "Přívěsy a traktory", icon: "🚜" },
};
```

### Změny v `StkPriceTable.tsx`

**Z:**
- `<table>` s `overflow-x-auto`
- 13 nerozlišených řádků
- Horizontální scrollování na mobilu

**Na:**
- Grouped `<div>` sekce
- Každá skupina má nadpis + ikonu
- Stacked layout (mobile-first)
- M1 zvýrazněný s badge "Nejčastější"
- Info box u přívěsů: "Přívěsy nepodléhají emisní kontrole"

### Tailwind styling

```
Skupina header: text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2
Skupina container: bg-gray-50 rounded-lg divide-y divide-gray-100
Řádek: px-4 py-3 flex items-center justify-between
Řádek highlight: bg-orange-50 border-l-4 border-orange-400
Název: text-sm text-gray-900 font-medium
Kód: text-xs text-gray-400 ml-1
Cena detail: text-xs text-gray-500
Celkem: text-sm font-bold text-gray-900
Badge "Nejčastější": text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full
Info box: text-xs text-gray-500 italic bg-blue-50 px-3 py-2 rounded mt-1
```

---

## STOP PRAVIDLA

- **STOP-1:** NEMĚNIT `StkPriceCalc.tsx` — ten funguje dobře, jde jen o tabulku.
- **STOP-2:** NEMĚNIT ceny — jsou regulované státem. Pokud se změní vyhláška, aktualizovat `lib/stk-pricing.ts`.
- **STOP-3:** NEODSTRAŇOVAT kódy kategorií (M1, N2, O3) — jsou užitečné pro technicky zdatné uživatele. Jen posunout do závorky.
- **STOP-4:** Ikony (emoji) jsou OK pro groupy, ale NE animované SVG — zachovat jednoduchost.
- **STOP-5:** Zachovat regulační disclaimer "Ceny jsou regulované státem (vyhl. 302/2001 Sb.)"

---

## ACCEPTANCE CRITERIA

- [ ] Tabulka je čitelná na mobilu BEZ horizontálního scrollování
- [ ] Kategorie jsou vizuálně seskupené do 4 skupin
- [ ] Osobní automobil (M1) je zvýrazněný jako "Nejčastější"
- [ ] Přívěsy mají vysvětlení proč nemají emise (místo "—")
- [ ] Kódy kategorií jsou viditelné ale sekundární (v závorce)
- [ ] Regulatory disclaimer zachován
- [ ] `npm run build` projde
- [ ] Vizuálně konzistentní s rest designu (Card, orange accent, Outfit font)
