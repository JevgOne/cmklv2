# Plan Task #063 — Vizualni redesign hashtag landing pages `/makleri/[slug]`

**Datum:** 2026-04-16
**Planovac:** Claude Opus 4.6
**Zdroj:** Uzivatel — "urcite to jde udelat vizualne o dost lip" + "uprav to nemen nic" (= jen vizualni polish, zadna nova funkcionalita)

---

## 1. Kontext (overeno)

Strana `/makleri/[slug]` se sklada z 6 sekci:
1. `<Breadcrumbs>` — OK, ponechat
2. `<LandingHero>` — obrovsky oranzmovy blok, stat chipsy s nulami
3. `<BrokerGrid>` — sort taby (filled pills) + grid karet (`BrokerCard` s featured variant)
4. `<RelatedHashtags>` — gray pills
5. Recent deals / CTA / FAQ / Siblings — vizualne v poradku
6. Bottom `<CTABlock>` — OK

### Soubory k uprave

| Soubor | Radky | Co |
|---|---|---|
| `components/web/LandingHero.tsx` | 1-108 | Hero sekce — gradient, chipsy s nulami, spacing |
| `components/web/BrokerGrid.tsx` | 1-101 | Sort taby (filled → underline), featured prop |
| `components/web/BrokerCard.tsx` | 1-151 | Featured variant (col-span-2), layout karet |

---

## 2. Zmeny — Hero (`LandingHero.tsx`)

### 2.1 Gradient: solid orange → automotive gradient

**Radek 35 — aktualni:**
```tsx
className="bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 py-14 sm:py-20 md:py-28"
```

**Novy:**
```tsx
className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 sm:py-16 md:py-20 relative overflow-hidden"
```

Plus dekorativni element (geometric automotive pattern) — jemny oranzmovy accent:
```tsx
{/* Dekorativni gradient accent */}
<div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/5 pointer-events-none" aria-hidden="true" />
<div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400" aria-hidden="true" />
```

**Efekt:** Tmava (dark) hero s jemnym oranzmovym akcentem — profesionalni automotive look, text bile zustava.

### 2.2 Skryt statistiky s hodnotou 0

**Radky 27-33 — aktualni:**
```tsx
const chips = [
  `${stats.count} makleru`,
  `${stats.totalSoldVehicles} uspesnych prodeju`,
  `${stats.topLevelCount} TOP makleru`,
  `${stats.activeVehicles} aktivnich vozidel`,
];
```

**Novy:**
```tsx
const chips: string[] = [];
if (stats.count > 0) chips.push(`${stats.count} makleru`);
if (stats.totalSoldVehicles > 0) chips.push(`${stats.totalSoldVehicles} uspesnych prodeju`);
if (stats.topLevelCount > 0) chips.push(`${stats.topLevelCount} TOP makleru`);
if (stats.activeVehicles > 0) chips.push(`${stats.activeVehicles} aktivnich vozidel`);
```

### 2.3 Zmensit hero padding (je prilis velky)

Uz reseno v 2.1: `py-14 sm:py-20 md:py-28` → `py-12 sm:py-16 md:py-20` (cca -30% vertikalni prostor).

### 2.4 Chip styling update (pro tmave pozadi)

**Radek 52 — aktualni:**
```tsx
className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium"
```

**Novy:**
```tsx
className="bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium"
```

### 2.5 CTA tlacitka — zachovat styl (uz je jedno plne, jedno outline)

Aktualni styl je uz spravny: bile plne + bile outline. Pouze update hover pro tmave pozadi:
- Primary (radek 63): `bg-white text-orange-600 hover:bg-orange-50` → `bg-orange-500 text-white hover:bg-orange-600` (vice kontrastni na tmavem)
- Secondary (radek 69): zachovat bile outline — na tmavem pozadi uz vypada dobre

### 2.6 Avatar stack — update ring color pro tmavy background

**Radek 83:** `ring-2 ring-white` → `ring-2 ring-white/80` (jemnejsi na tmavem)

---

## 3. Zmeny — Sort taby (`BrokerGrid.tsx`)

### 3.1 Filled pills → Underline taby

**Radky 54-68 — aktualni sortButton:**
```tsx
className={cn(
  "px-4 py-2 rounded-full text-sm font-semibold transition-colors border",
  sort === key
    ? "bg-orange-500 text-white border-orange-500"
    : "bg-white text-gray-700 border-gray-200 hover:border-orange-300"
)}
```

**Novy:**
```tsx
className={cn(
  "px-4 py-2 text-sm font-semibold transition-colors border-b-2",
  sort === key
    ? "text-orange-600 border-orange-500"
    : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
)}
```

**Radek 72 — wrapper:** Pridat `border-b border-gray-200` na wrapper pro zakladni linku:
```tsx
<div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-0" role="group" aria-label="Razeni makleru">
```

Pozn.: `pb-0` protoze border-b-2 na tlacitku navazuje na border wrapper.

---

## 4. Zmeny — Broker karty (`BrokerCard.tsx`)

### 4.1 Zrusit featured variant (sjednotit karty)

**Problem:** `featured` prop zpusobuje `lg:col-span-2` → featured karta zabira 2/3 sirky, ostatni 1/3. Vysledek: nekonzistentni layout pri 2 maklerich.

**Reseni:** 
- **Smazat** featured-specificke vetve (radky 41-42, 46-51, 53-57, 122-129)
- **Smazat** prop `featured` z interface (radek 24)
- Vsechny karty = jednotny format

**Novy article className (radek 46-51):**
```tsx
className="rounded-xl p-5 transition-all flex flex-col h-full bg-white border border-gray-200 hover:border-orange-300 hover:shadow-md group"
```

**Smazat "Doporuceny" badge (radky 53-57)** — uz neni featured.

**Avatar:** jednotna velikost `w-20 h-20` (radek 41-42 — smazat featuredIf).

**Name:** jednotna velikost `text-lg` (radek 43).

### 4.2 Aktivni vozidla vzdy zobrazit (ne jen featured)

**Radky 117-130 — aktualni (footer):**
```tsx
<div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
  <div>
    <span className="font-bold text-gray-900">{broker.totalSales}</span> prodeju
  </div>
  {featured && (
    <div>
      <span className="font-bold text-gray-900">{broker.activeVehicles}</span> aktivnich vozidel
    </div>
  )}
</div>
```

**Novy:**
```tsx
<div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
  <div>
    <span className="font-bold text-gray-900">{broker.totalSales}</span> prodeju
  </div>
  {broker.activeVehicles > 0 && (
    <div>
      <span className="font-bold text-gray-900">{broker.activeVehicles}</span> aktivnich vozidel
    </div>
  )}
</div>
```

### 4.3 BrokerGrid — smazat `featured={idx === 0}` prop

**Radek 81 v BrokerGrid.tsx:**
```tsx
<BrokerCard key={broker.slug} broker={broker} featured={idx === 0} />
```

**Novy:**
```tsx
<BrokerCard key={broker.slug} broker={broker} />
```

Grid je jiz `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (radek 78), coz je spravne — nepotrebuje zmenu.

---

## 5. Soubory k uprave — souhrn

| Akce | Soubor | Radky | Popis |
|---|---|---|---|
| **Upravit** | `components/web/LandingHero.tsx` | 27-33, 35, 39, 52, 60-73, 83 | Dark gradient, skryt nuly, zmensit padding, CTA update |
| **Upravit** | `components/web/BrokerGrid.tsx` | 54-68, 72, 80-81 | Underline taby, smazat featured prop |
| **Upravit** | `components/web/BrokerCard.tsx` | 24, 34, 41-57, 117-130 | Sjednotit karty, smazat featured, vzdy zobrazit activeVehicles |

**Zadne nove soubory.** Zadne nove zavislosti. Zadna zmena logiky/dat.

---

## 6. Akceptacni kriteria

1. **Hero gradient:** Tmava (gray-900) hero s jemnym oranzmovym akcentem (gradient stripe dole), NE solid orange.
2. **Nulove statistiky:** Chipsy s hodnotou 0 se nezobrazuji (napr. "0 uspesnych prodeju" zmizi).
3. **Mensi hero:** Vertikalni padding snizeny o ~30% oproti aktualni verzi.
4. **Jednotne karty:** Vsechny broker karty maji stejnou velikost a layout (zadna featured/col-span-2 varianta).
5. **Underline sort taby:** Aktivni tab ma oranzmovy underline (ne filled pill).
6. **Aktivni vozidla:** Zobrazuji se na vsech kartach kde `activeVehicles > 0`, ne jen na featured.
7. **Beze zmeny funkcnosti:** SEO schema, FAQ, breadcrumbs, CTA, related tags — vse zachovano beze zmeny.

---

## 7. STOP & ESCALATE

- Pokud implementator zjisti, ze `LandingHero` se pouziva i jinde nez na `/makleri/[slug]` → STOP, overit dopad na dalsi stranky pred zmenou.
- Pokud `featured` prop na `BrokerCard` pouziva jina stranka nez `BrokerGrid` → STOP, resit zpetnou kompatibilitu.

---

## 8. Odhad

- Cas: 25-35 min (3 soubory, jen Tailwind + JSX zmeny)
- Riziko: nizke (isolated CSS/layout zmeny, fallback na stavajici styl, zadna datova zmena)
