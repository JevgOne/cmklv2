# Plan: Fix OG obrázky — Outfit font + rozmazanost

**Task:** #1 / #2
**Status:** PLAN READY (v2 — rozšířeno o fix rozmazanosti)
**Datum:** 2026-05-22
**Typ:** Bugfix (branding + quality)
**Závažnost:** HIGH — VŠECH 17 OG obrázků je postiženo

---

## 1. Analýza problému

### Nalezené příčiny rozmazanosti:

#### PŘÍČINA A: 5 souborů NEPŘEDÁVÁ fonty do ImageResponse (CRITICAL)

Centrální `lib/og-image.tsx` má `ogImageOptions()` který vrací `{ width: 1200, height: 630, fonts: [...] }`. Ale **5 souborů** používá `{ ...size }` místo `options` — předává POUZE rozměry BEZ fontů:

| Soubor | Řádek | Import ogImageOptions? | Problém |
|--------|-------|----------------------|---------|
| `kariera/opengraph-image.tsx` | 24 | NE | Úplně chybí import |
| `recenze/opengraph-image.tsx` | 24 | NE | Úplně chybí import |
| `nabidka/[slug]/opengraph-image.tsx` | 95 | ANO (ale nepoužit) | Fallback (ř. 59) OK, hlavní render (ř. 95) BEZ fontů |
| `profil/[slug]/opengraph-image.tsx` | 137 | ANO (ale nepoužit) | Fallback (ř. 54) OK, hlavní render (ř. 137) BEZ fontů |
| `blog/[slug]/opengraph-image.tsx` | 275 | ANO (ale nepoužit) | Fallback (ř. 33) OK, hlavní render (ř. 275) BEZ fontů |

**Důsledek:** Satori nemá registrovaný font "Outfit". `fontFamily: "Outfit, sans-serif"` v OgLayout → font "Outfit" nenalezen → fallback na Satori built-in Noto Sans → jiný font, jiné renderování, rozmazaný/nekonsistentní text.

#### PŘÍČINA B: blog/[slug] nepoužívá OgLayout a nemá fontFamily "Outfit"

`blog/[slug]/opengraph-image.tsx` má vlastní layout (NEPOUŽÍVÁ `OgLayout`). V root div (ř. 58) má `fontFamily: "Outfit, sans-serif"` — ale protože hlavní render nepředává fonty (viz příčina A), font se nenajde a text se renderuje fallbackem.

#### PŘÍČINA C: 1200x630 @ 1x DPI (NICE-TO-HAVE)

`ImageResponse` z `next/og` renderuje přes Satori→Resvg pipeline na přesně 1200x630 px @ 96 DPI. Na retina (2x) displejích je obraz interpolován nahoru → text vypadá mírně rozmazaně.

**Standardní chování** — 1200x630 je doporučená velikost od Facebook/Twitter/LinkedIn. Většina webů to tak má. Ale pro premium branding můžeme renderovat na 2x (2400x1260) a nechat platformy downscale.

#### PŘÍČINA D: Logo je OK (vyloučeno)

`public/brand/logo-white.png` je dostatečně velký (~1500px wide). Renderuje se na `height: 64px` = downscale → ostrý. **Není příčina.**

#### PŘÍČINA E: contentType je OK (vyloučeno)

Všech 17 souborů má `contentType = "image/png"` (lossless). **Není příčina.**

---

## 2. Aktuální stav kódu (po předchozích změnách)

### Co je HOTOVÉ:
- `lib/og-image.tsx` — má `getOutfitFonts()`, `ogImageOptions()`, `fontFamily: "Outfit, sans-serif"` v OgLayout ✅
- Font soubory existují: `public/fonts/Outfit-Regular.ttf`, `Outfit-Bold.ttf`, `Outfit-ExtraBold.ttf` ✅
- 12 ze 17 souborů správně používá `options` z `ogImageOptions()` ✅

### Co NENÍ HOTOVÉ (musí se opravit):
- 5 souborů používá `{ ...size }` místo `options` → MUSÍ se opravit ❌
- `blog/[slug]` vlastní layout nepředává fonty ❌

---

## 3. Implementační plán

### Krok 1: Fix 5 souborů — použít `options` místo `{ ...size }`

#### 1a. `kariera/opengraph-image.tsx`

```tsx
// PŘED (řádek 2):
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE } from "@/lib/og-image";

// PO:
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE, ogImageOptions } from "@/lib/og-image";
```

```tsx
// PŘED (řádek 10):
const logo = await getLogoBase64();

// PO:
const logo = await getLogoBase64();
const options = await ogImageOptions();
```

```tsx
// PŘED (řádek 24):
    { ...size },

// PO:
    options,
```

#### 1b. `recenze/opengraph-image.tsx`

Identická změna jako kariera — přidat import `ogImageOptions`, přidat `const options`, nahradit `{ ...size }` → `options`.

#### 1c. `nabidka/[slug]/opengraph-image.tsx`

```tsx
// PŘED (řádek 95):
    { ...size },

// PO:
    options,
```

(Import a `const options` už existují na ř. 2 a 17.)

#### 1d. `profil/[slug]/opengraph-image.tsx`

```tsx
// PŘED (řádek 137):
    { ...size },

// PO:
    options,
```

(Import a `const options` už existují na ř. 2 a 31.)

#### 1e. `blog/[slug]/opengraph-image.tsx`

```tsx
// PŘED (řádek 275):
    { ...size },

// PO:
    options,
```

(Import a `const options` už existují na ř. 2 a 17.)

---

### Krok 2 (OPTIONAL — jen pokud po Kroku 1 stále rozmazané): 2x rendering

Pokud uživatel po fixu fontů stále vidí rozmazanost, implementovat 2x rendering:

#### 2a. Změnit `lib/og-image.tsx`:

```tsx
// Rozměry pro meta tagy (og:image:width/height)
export const OG_SIZE = { width: 1200, height: 630 };

// Rozměry pro rendering (2x pro ostřejší text)
export const OG_RENDER_SIZE = { width: 2400, height: 1260 };
```

#### 2b. Upravit `ogImageOptions()`:

```tsx
export async function ogImageOptions() {
  const fonts = await getOutfitFonts();
  return { ...OG_RENDER_SIZE, fonts };
}
```

#### 2c. Upravit `OgLayout` — všechny pixel hodnoty ×2:

| Property | 1x (současné) | 2x (nové) |
|----------|---------------|-----------|
| Logo height | 64 | 128 |
| Logo marginBottom | 24 | 48 |
| Accent line width | 50 | 100 |
| Accent line height | 3 | 6 |
| Accent marginBottom | 24 | 48 |
| Content maxWidth | 900 | 1800 |
| Content padding | 0 40px | 0 80px |
| Bottom bar height | 4 | 8 |
| URL fontSize | 14 | 28 |
| URL bottom | 20 | 40 |
| URL right | 40 | 80 |
| Decorative orb top/right | -80 | -160 |
| Decorative orb size | 400 | 800 |

#### 2d. Upravit KAŽDÝ OG soubor — font sizes ×2:

| Typický element | 1x | 2x |
|----------------|----|----|
| Hlavní nadpis | fontSize: 48 | fontSize: 96 |
| Podnadpis | fontSize: 22 | fontSize: 44 |
| Detaily | fontSize: 20 | fontSize: 40 |
| marginTop subtitle | 20 | 40 |
| marginLeft span | 14 | 28 |
| gap | 32 | 64 |

**POZOR:** `export const size = OG_SIZE` v každém souboru ZŮSTÁVÁ 1200×630 — to je pro meta tagy. Pouze rendering je 2x.

**Rozsah:** 22 souborů, ~200 řádků změn. Mechanická práce.

#### 2e. ALTERNATIVA k 2x: CSS-in-Satori scale

Satori NEPODPORUJE `transform: scale()` ani `zoom`. Takže ruční 2x je jediná cesta.

---

## 4. Kompletní seznam souborů k úpravě

### Krok 1 (POVINNÝ — fix fontů):

| Soubor | Typ změny | Detail |
|--------|-----------|--------|
| `app/(web)/kariera/opengraph-image.tsx` | FIX | +import ogImageOptions, +const options, { ...size } → options |
| `app/(web)/recenze/opengraph-image.tsx` | FIX | +import ogImageOptions, +const options, { ...size } → options |
| `app/(web)/nabidka/[slug]/opengraph-image.tsx` | FIX | { ...size } → options (ř. 95) |
| `app/(web)/profil/[slug]/opengraph-image.tsx` | FIX | { ...size } → options (ř. 137) |
| `app/(web)/blog/[slug]/opengraph-image.tsx` | FIX | { ...size } → options (ř. 275) |

**Celkem:** 5 souborů, ~15 řádků změn.

### Krok 2 (VOLITELNÝ — 2x rendering):

| Soubor | Typ změny |
|--------|-----------|
| `lib/og-image.tsx` | ADD OG_RENDER_SIZE, update ogImageOptions(), 2x all OgLayout values |
| Všech 17 OG souborů | 2x font sizes a spacing |

**Celkem:** 18 souborů, ~200 řádků změn.

---

## 5. STOP pravidla

- **STOP-1:** Po Kroku 1 VŽDY otestovat `/makleri/opengraph-image` v browseru — musí být ostrý Outfit font. Pokud stále rozmazané → pokračovat Krokem 2.
- **STOP-2:** Font soubory existují (`public/fonts/Outfit-Regular.ttf`, `Bold.ttf`, `ExtraBold.ttf`). NESTAHOVAT znovu. Pokud chybí `SemiBold.ttf`, je to OK — `ogImageOptions()` loaduje jen Regular, Bold, ExtraBold.
- **STOP-3:** `blog/[slug]/opengraph-image.tsx` má VLASTNÍ layout. Při Kroku 2 (2x) je potřeba zdvojit hodnoty I v tomto vlastním layoutu (48→96, 20→40, atd.).
- **STOP-4:** `export const size = OG_SIZE` v každém souboru NESMÍ se měnit na 2x — zůstává 1200×630 pro meta tagy. Pouze `ImageResponse` options mají 2x rozměry.
- **STOP-5:** Po implementaci NESMÍ zůstat žádný soubor s `{ ...size }` v `ImageResponse` — VŠECHNY musí používat `options` z `ogImageOptions()`.

---

## 6. Testování

### Po Kroku 1:
1. `npm run dev`
2. Otevřít `http://localhost:3000/kariera/opengraph-image` — dříve bez fontů, teď musí mít Outfit
3. Otevřít `http://localhost:3000/nabidka/test-slug/opengraph-image` — dříve bez fontů pro reálné vozidlo
4. Porovnat s `http://localhost:3000/makleri/opengraph-image` — oba musí mít identický font
5. Ověřit české znaky: "Certifikovaní makléři", "zákazníků", "Staňte se makléřem"

### Po Kroku 2 (pokud implementován):
1. Stáhnout OG obrázek a zkontrolovat rozměry — musí být 2400×1260 px
2. Porovnat ostrost textu s 1x verzí — 2x musí být výrazně ostřejší
3. Ověřit na Facebook OG debuggeru — musí správně načíst a zobrazit

---

## 7. Acceptance Criteria

### Krok 1 (POVINNÝ):
- [ ] Všech 17 OG souborů předává `options` (s fonty) do `ImageResponse`
- [ ] Žádný soubor nepoužívá `{ ...size }` v `ImageResponse`
- [ ] `kariera` a `recenze` importují `ogImageOptions`
- [ ] OG obrázek `/kariera` zobrazuje Outfit font (ne fallback)
- [ ] OG obrázek `/nabidka/[slug]` (s reálným vozidlem) zobrazuje Outfit font
- [ ] České diakritiky se renderují správně (ě, š, č, ř, ž, ú)
- [ ] `npm run build` projde bez chyb

### Krok 2 (VOLITELNÝ):
- [ ] OG obrázky se renderují na 2400×1260 px
- [ ] `export const size` zůstává 1200×630 ve všech souborech
- [ ] Text je vizuálně ostřejší než 1x verze
- [ ] Všechny OG obrázky se renderují bez chyb

---

## 8. Doporučený postup

1. **NEJPRVE implementovat Krok 1** (5 souborů, ~15 řádků) — to opraví fontový problém
2. **Otestovat** — podívat se na OG obrázky v browseru
3. **Pokud stále rozmazané** → implementovat Krok 2 (2x rendering)
4. **Pokud po Kroku 1 ostré** → Krok 2 je zbytečný, neplýtvat časem

**Priorita: Krok 1 je MUST, Krok 2 je SHOULD.**
