# Plán: TASK-045 — Loga v PDF šablonách, smlouvách a dokumentech

**Datum:** 2026-04-25
**Autor:** Plánovač
**Priorita:** STŘEDNÍ
**Odhadovaný rozsah:** 4 soubory, ~80 řádků změn

---

## Kontext

Všechny PDF dokumenty a HTML šablony v projektu používají **textový placeholder** místo skutečného loga:
- jsPDF: `addText("CARMAKLER", 10, true)` — prostý text
- HTML: `<strong style="color: orange">CarMakléř</strong>` — stylizovaný text

Logo soubory **už existují** v `public/brand/`:
- `logo-color.png` / `logo-color.svg` — barevné logo
- `logo-dark.png` / `logo-dark.svg` — tmavé logo (pro světlé pozadí)
- `logo-white.png` / `logo-white.svg` — bílé logo (pro tmavé pozadí)
- `logo-white-vertical.png` — vertikální varianta
- `logo-symbol-dark.png` / `logo-symbol-white.png` — symbol (ikona)

## Dotčené soubory

| # | Soubor | Typ | Aktuální stav | Cílový stav |
|---|--------|-----|---------------|-------------|
| 1 | `app/api/contracts/[id]/pdf/route.ts` | jsPDF | Řádek 108: `addText("CARMAKLER", 10, true)` | Logo PNG jako `doc.addImage()` |
| 2 | `lib/pdf/partner-documents.ts` | jsPDF | Řádek 100: `addText(ctx, "CARMAKLER", 10, true)` | Logo PNG jako `doc.addImage()` |
| 3 | `lib/brand-styles.ts` | HTML | Řádek 207: `<strong style="color: orange">CarMakléř</strong>` | `<img>` tag s logem |
| 4 | `lib/brand-styles.ts` | HTML email | Řádek 241-243: `Car<span style="color: orange">Makléř</span>` | `<img>` tag s logem |

---

## Implementační kroky

### Fáze 1: Příprava logo assetu pro PDF (jsPDF)

**Krok 1 — Vytvořit logo base64 modul** (`lib/pdf/logo.ts`)

jsPDF `addImage()` na serveru (Node.js, bez DOM) vyžaduje base64-encoded PNG data. Nelze použít URL ani SVG.

```typescript
// lib/pdf/logo.ts
import { readFileSync } from "fs";
import path from "path";

let _logoBase64: string | null = null;

export function getLogoBase64(): string {
  if (!_logoBase64) {
    const logoPath = path.join(process.cwd(), "public/brand/logo-dark.png");
    const buffer = readFileSync(logoPath);
    _logoBase64 = `data:image/png;base64,${buffer.toString("base64")}`;
  }
  return _logoBase64;
}
```

**Proč `logo-dark.png`:** PDF má bílé pozadí → tmavé logo na bílé = nejlepší kontrast.

**Proč cache:** `readFileSync` je drahý, ale logo se nemění za runtime → singleton pattern.

**STOP-1:** Ověřit, že `logo-dark.png` existuje a má rozumnou velikost (< 100 KB). Pokud > 200 KB, optimalizovat nebo použít menší variantu.

---

### Fáze 2: Nasazení loga do jsPDF dokumentů

**Krok 2 — Contract PDF** (`app/api/contracts/[id]/pdf/route.ts`)

Současný kód (řádky 107-108):
```typescript
// Header
addText("CARMAKLER", 10, true);
```

Nahradit za:
```typescript
import { getLogoBase64 } from "@/lib/pdf/logo";

// Header — logo
const logoData = getLogoBase64();
const logoHeight = 12; // mm
const logoWidth = 40;  // mm (přizpůsobit poměru stran skutečného loga)
doc.addImage(logoData, "PNG", margin, y, logoWidth, logoHeight);
y += logoHeight + 2;
```

**Klíčové:**
- `doc.addImage()` už se v tomto souboru používá pro podpisy (řádky 156-163, 179-186) — vzor je ověřený
- Rozměry `logoWidth`/`logoHeight` je potřeba odladit podle skutečného poměru stran loga
- Logo se umístí vlevo nahoře, nad titulem smlouvy

**Krok 3 — Partner documents** (`lib/pdf/partner-documents.ts`)

Současný kód, funkce `addHeader()` (řádky 99-108):
```typescript
function addHeader(ctx: PdfContext, title: string, orderNumber: string, date: string) {
  addText(ctx, "CARMAKLER", 10, true);
  // ...
}
```

Nahradit textový řádek za:
```typescript
import { getLogoBase64 } from "@/lib/pdf/logo";

function addHeader(ctx: PdfContext, title: string, orderNumber: string, date: string) {
  const logoData = getLogoBase64();
  const logoHeight = 10;
  const logoWidth = 35;
  ctx.doc.addImage(logoData, "PNG", ctx.margin, ctx.y, logoWidth, logoHeight);
  ctx.y += logoHeight + 2;
  // ... zbytek headeru (title, orderNumber, date) beze změn
}
```

**STOP-2:** Po implementaci otestovat generování obou typů PDF (smlouva + dodací list + potvrzení objednávky). Logo musí být čitelné, správně zarovnané a nesmí přetékat mimo stránku.

---

### Fáze 3: Nasazení loga do HTML šablon

**Krok 4 — Document HTML header** (`lib/brand-styles.ts`, řádky 206-210)

Současný kód:
```html
<div class="meta">
  <strong style="color: ${brand.colors.orange}; font-size: 14pt;">CarMakléř</strong><br />
  ${brand.company.web}<br />
  ${brand.company.email}
</div>
```

Nahradit za:
```html
<div class="meta">
  <img src="/brand/logo-dark.png" alt="CarMakléř" class="logo" style="height: 40px; margin-bottom: 4px;" /><br />
  ${brand.company.web}<br />
  ${brand.company.email}
</div>
```

**Poznámka:** CSS třída `.doc-header .logo { height: 40px; }` už v `documentCSS()` existuje (řádek 63) — byla připravena ale dosud nepoužita.

**Pozor na kontext použití:** Pokud se `documentHTML()` používá i pro server-side PDF rendering (Puppeteer/Playwright), `/brand/logo-dark.png` může být nedostupné. V tom případě použít:
- absolutní URL: `https://carmakler.cz/brand/logo-dark.png`
- nebo base64 inline: `data:image/png;base64,...`

Prověřit, kde se `documentHTML()` volá — grep pro `documentHTML` v celém projektu.

**Krok 5 — Email HTML header** (`lib/brand-styles.ts`, řádky 241-243)

Současný kód:
```html
<h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
  Car<span style="color: ${brand.colors.orange};">Makléř</span>
</h1>
```

Nahradit za:
```html
<img src="https://carmakler.cz/brand/logo-white.png" alt="CarMakléř" 
     style="height: 40px; display: block; margin: 0 auto;" />
```

**Proč `logo-white.png`:** Email header má tmavé pozadí (`${brand.colors.dark}` = `#1a1a2e`) → bílé logo.

**Proč absolutní URL:** Emailoví klienti (Gmail, Outlook) nepodporují relativní cesty ani base64 v `<img>` src. Musí být absolutní HTTPS URL.

**STOP-3:** Pokud produkční doména ještě neexistuje nebo se liší od `carmakler.cz`, přidat konfiguraci:
```typescript
// v brand objekt
baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://carmakler.cz",
```
A v emailu použít `${brand.baseUrl}/brand/logo-white.png`.

---

### Fáze 4: Přidání brand konstant

**Krok 6 — Rozšířit brand objekt** (`lib/brand-styles.ts`)

Přidat do `brand` objektu:
```typescript
export const brand = {
  // ... stávající
  logo: {
    dark: "/brand/logo-dark.png",      // pro světlé pozadí (PDF, dokumenty)
    white: "/brand/logo-white.png",     // pro tmavé pozadí (emaily)
    color: "/brand/logo-color.png",     // barevná varianta
    symbol: "/brand/logo-symbol-dark.png", // jen symbol/ikona
  },
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://carmakler.cz",
};
```

Toto centralizuje cesty k logům a umožní je měnit na jednom místě.

---

## Přehled změn

| Soubor | Co se mění | Řádky |
|--------|-----------|-------|
| `lib/pdf/logo.ts` | **NOVÝ** — base64 logo loader pro jsPDF | ~15 řádků |
| `app/api/contracts/[id]/pdf/route.ts` | Text → `addImage()` v headeru | Řádky 107-108 |
| `lib/pdf/partner-documents.ts` | Text → `addImage()` ve funkci `addHeader()` | Řádky 99-101 |
| `lib/brand-styles.ts` | 1) brand.logo + baseUrl, 2) doc HTML `<img>`, 3) email HTML `<img>` | Řádky 9+, 206-210, 241-243 |

## STOP pravidla

| # | Podmínka | Akce |
|---|----------|------|
| STOP-1 | `logo-dark.png` neexistuje nebo > 200 KB | Eskalovat — optimalizovat/nahradit |
| STOP-2 | PDF s logem nečitelné/rozlámané | Odladit rozměry `logoWidth`/`logoHeight` |
| STOP-3 | Produkční doména != `carmakler.cz` | Přidat `NEXT_PUBLIC_BASE_URL` env var |

## Acceptance criteria

1. ✅ Contract PDF (`/api/contracts/[id]/pdf`) zobrazuje logo místo textu "CARMAKLER"
2. ✅ Dodací list (`generateDeliveryNote`) zobrazuje logo místo textu
3. ✅ Potvrzení objednávky (`generateOrderConfirmation`) zobrazuje logo místo textu
4. ✅ HTML dokumenty (`documentHTML()`) zobrazují `<img>` logo místo stylizovaného textu
5. ✅ Emaily (`emailLayoutHTML()`) zobrazují logo přes absolutní URL
6. ✅ Logo cesty centralizované v `brand.logo` objektu
7. ✅ Žádné regrese v existujících PDF/email funkcích

## Závislosti

- Žádné nové npm balíčky
- `fs.readFileSync` je Node.js built-in (pouze server-side, což PDF generace je)
- Logo soubory už existují v `public/brand/`
