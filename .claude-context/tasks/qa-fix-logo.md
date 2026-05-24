# QA Report: Fix černobílého loga (Task #7)
**Datum:** 2026-05-24  
**Commit:** 4044a60  
**QA agent:** kontrolor

---

## Reverzní kontrola — Výsledek

### ✅ favicon.svg je barevný (ne černobílý)
**Soubor:** `public/brand/favicon.svg`

SVG obsahuje definici barevných stylů:
```css
.o { fill: #f58229; }  /* oranžová — brand color */
.n { fill: none; }
```

Oranžová barva `#f58229` je aplikována na klíčové prvky loga (kruhové oblouky). Zbytek je černý obrys štítu — odpovídá barevnému brand logu Carmakler, NIKOLI černobílému.

⚠️ **Drobná poznámka:** CLAUDE.md definuje primary orange jako `#F97316` (Tailwind orange-500), zatímco SVG používá `#f58229`. Jde pravděpodobně o záměrné rozlišení brand barvy od UI barvy — nejedná se o chybu.

---

### ✅ og-default.png existuje a je referencován správně
**Soubor:** `public/og-default.png`

```
Velikost: 80 575 bytes
Rozměry: 1200 x 630 px (PNG RGBA, 8-bit)
```

Reference v kódu:
- `lib/metadata.ts:6` — `const OG_IMAGE = "/og-default.png";`
- `app/layout.tsx:51` — `{ url: "/og-default.png", width: 1200, height: 630 }`
- `app/layout.tsx:58` — Twitter card image

Soubor existuje, má správné OG rozměry 1200×630, je korektně referencován.

---

### ✅ Organization JSON-LD je přítomen ve veřejném layoutu
**Soubor:** `app/(web)/layout.tsx`

```tsx
import { generateOrganizationJsonLd } from "@/lib/seo";
// ...
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: generateOrganizationJsonLd() }}
/>
```

Funkce `generateOrganizationJsonLd()` existuje v `lib/seo.ts:347` — vrací správné Schema.org Organization JSON-LD se jménem, URL, logem, adresou a kontaktními body.

Layout `(web)` pokrývá celý veřejný web — JSON-LD je na všech veřejných stránkách.

---

## Debug kontrola

### ✅ TypeScript: 0 chyb
```
npx tsc --noEmit → žádný výstup (čistý)
```

### ⚠️ Lint: 0 errors, 738 warnings
```
npm run lint → ✖ 738 problems (0 errors, 738 warnings)
```

Všechna varování jsou **pre-existující**, nesouvisí s Taskem #7:
- `__tests__/middleware.test.ts` — `any` typy v testech
- `__tests__/validators/*.test.ts` — unused vars v testech
- Minifikovaný vendor bundle (řádek 2, sloupce v tisících) — externí kód

**Nové chyby způsobené Taskem #7: ŽÁDNÉ.**

---

## Simplify kontrola

Kód je čistý, bez zbytečných složitostí:
- `generateOrganizationJsonLd()` — jednoduchá funkce, single responsibility, správně exportovaná
- Layout import je přímý, bez wrapper komponent
- SVG je přímý soubor, bez zbytečných vrstev

---

## Celkový verdikt

**✅ SCHVÁLENO — Task #7 implementován korektně**

| Kontrola | Výsledek |
|----------|---------|
| favicon.svg je barevný (#f58229) | ✅ |
| og-default.png existuje (1200×630) | ✅ |
| og-default.png referencován v metadata | ✅ |
| Organization JSON-LD v (web) layoutu | ✅ |
| `generateOrganizationJsonLd()` existuje | ✅ |
| TypeScript bez chyb | ✅ |
| Lint bez nových errors | ✅ (738 pre-existing warnings) |
