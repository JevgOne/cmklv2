# QA Report — Task #3: OG obrázky font fix

**Datum:** 2026-05-22  
**Commits:** `dd2bf02` (5 files) + `f024e7c` (twitter-image) + `c52e652` (zbývající)  
**Výsledek: PASS ✅**

---

## 1. Build

```
✓ Compiled successfully in 24.4s
✓ Generating static pages (1305/1305)
```

0 errors, 0 font-related warnings ✅

---

## 2. Pokrytí — všechny OG soubory

Celkem **20 souborů** (19 × opengraph-image.tsx + 1 × twitter-image.tsx):

| Soubor | ogImageOptions() | options jako 2. arg |
|---|---|---|
| app/(web)/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/twitter-image.tsx | ✅ | ✅ |
| app/(web)/inzerce/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/makleri/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/kontakt/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/sluzby/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/autoservisy/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/stk/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/recenze/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/marketplace/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/shop/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/blog/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/blog/[slug]/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/nabidka/[slug]/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/profil/[slug]/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/cenik/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/kariera/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/dily/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/o-nas/opengraph-image.tsx | ✅ | ✅ |
| app/(web)/chci-prodat/opengraph-image.tsx | ✅ | ✅ |

**Žádný soubor nepoužívá `{ ...size }` bez fontů.** ✅

---

## 3. Font loading — lib/og-image.tsx

### Mechanism

```typescript
export async function ogImageOptions() {
  const fonts = await getOutfitFonts();
  return { ...OG_SIZE, fonts };  // { width: 1200, height: 630, fonts: [...] }
}
```

`getOutfitFonts()` načítá z disku via `fs.readFile` a cachuje v module-level proměnné (nedochází k opakovanému disk I/O). ✅

### Font soubory

| Soubor | Velikost | Validita (magic bytes) |
|---|---|---|
| `public/fonts/Outfit-Regular.ttf` | 47 KB | ✅ TTF (0x00010000) |
| `public/fonts/Outfit-Bold.ttf` | 47 KB | ✅ TTF (0x00010000) |
| `public/fonts/Outfit-ExtraBold.ttf` | 47 KB | ✅ TTF (0x00010000) |

3 weightsloadovány (400, 700, 800) — Satori může renderovat `font-weight: 400/700/800` správně. ✅

---

## 4. Rozlišení

```typescript
export const OG_SIZE = { width: 1200, height: 630 };
```

1200×630 px — standardní OG rozlišení (Facebook/Twitter/LinkedIn doporučují). ✅  
Poměr stran 1.91:1 odpovídá specifikaci Open Graph. ✅

---

## 5. České diakritiky

Ověřeno via cmap tabulky Outfit-Regular.ttf (378 glyphů, Format 4 cmap):

| Znak | Unicode | Status |
|---|---|---|
| á | U+00E1 | ✅ (segment 0xAE–0x107) |
| í | U+00ED | ✅ (segment 0xAE–0x107) |
| ú | U+00FA | ✅ (segment 0xAE–0x107) |
| ě | U+011B | ✅ (dedikovaný segment) |
| š | U+0161 | ✅ (dedikovaný segment) |
| č | U+010D | ✅ |
| ř | U+0159 | ✅ |
| ž | U+017E | ✅ |
| ů | U+016F | ✅ |

Outfit Regular pokrývá Latin Extended-A — všechny české diakritiky správně renderovány. ✅

**Poznámka:** Vizuální ověření ostrosti (že texty nejsou rozmazané vs. výchozí fallback font) vyžaduje Chrome test (Task #5) — kód opravuje root cause (chybějící fonty → Satori fallback → rozmazanost).

---

## 6. Design konzistence (OgLayout)

`OgLayout` v `lib/og-image.tsx`:
- `fontFamily: "Outfit, sans-serif"` — všechny texty v Outfitu ✅
- Gradient background (#080818 → #1a1a2e → #16213e → #0f3460) ✅
- Orange accent (#F97316) ✅
- Logo watermark + URL watermark ✅
- `maxWidth: 900` pro obsah — texty se nezalomí příliš ✅

---

## Závěr

Fix kompletní. Všech 20 OG/twitter-image souborů předává Outfit font přes `ogImageOptions()`. Font soubory existují, jsou validní TTF, pokrývají všechny české diakritiky. Build prochází čistě. Root cause rozmazaných OG obrázků je odstraněn — vizuální verifikaci provede Task #5 (Chrome test).
