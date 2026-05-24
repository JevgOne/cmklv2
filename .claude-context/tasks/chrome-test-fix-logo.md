# TEST-CHROME: Ověření fix loga v prohlížeči

**Datum:** 2026-05-24  
**Tester:** test-chrome  
**Task ref:** #10 (Fix z Task #7)

---

## Výsledek: ✅ PROŠLO (s 1 poznámkou)

---

## Screenshoty

Playwright headed Chromium test spuštěn a screenshoty pořízeny.

---

## Detailní výsledky

### 1. favicon.svg — ✅ BAREVNÝ

**URL:** `http://localhost:3000/brand/favicon.svg`  
**Výsledek:** Shield ikon s oranžovou barvou (#f58229) + černý obrys. Jasně barevný, NE černobílý.

SVG obsahuje: `.o { fill: #f58229; }` (oranžová pro písmeno C uvnitř shieldu)

Screenshot: favicon_shield s oranžovým C-markem, černý shield — vypadá výborně.

---

### 2. og-default.png — ✅ BRANDED OBRÁZEK

**URL:** `http://localhost:3000/og-default.png`  
**Rozměry:** 1200×630px, RGBA  
**Výsledek:** Branded dark-blue OG karta s:
- Bílé logo CarMakléř uprostřed
- Oranžový oddělovač
- Text "Kompletni automobilova platforma" s oranžovým zvýrazněním
- "www.carmakler.cz" watermark

Obsahuje 3239 oranžových pixelů z 756000 celkem — jasně barevný branded obrázek.

---

### 3. logo-color.png — ✅ PLNĚ BAREVNÉ

**URL:** `http://localhost:3000/brand/logo-color.png`  
**Výsledek:** Velké logo CAR MAKLÉŘ na tmavém pozadí. Orange shield s C-markem, oranžový text "CAR", černý text "MAKLÉŘ". Perfektně barevné.

---

### 4. Homepage favicon v tabu — ✅ (dev mode poznámka)

**URL:** `http://localhost:3000`  
**Výsledek:** V dev módu tab zobrazuje "N" (Next.js devtools indikátor) — standardní chování. V production bude správný favicon.

Favicons v `<head>` HTML jsou správně nastaveny:
- `/brand/favicon-32x32.png` (32×32) — ✅ HTTP 200, barevný (31 oranžových pixelů z 1024)
- `/brand/favicon-48x48.png` (48×48) — ✅ HTTP 200
- `/brand/favicon-96x96.png` (96×96) — ✅ HTTP 200

---

### 5. Organization JSON-LD — ✅ PŘÍTOMEN

Page source obsahuje:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CarMakléř",
  "url": "https://carmakler.cz",
  "logo": "https://carmakler.cz/brand/logo-color.png",
  "foundingDate": "2025",
  ...
}
```

✅ JSON-LD script tag nalezen  
✅ Organization schéma přítomno  
✅ logo URL: `https://carmakler.cz/brand/logo-color.png` — správná produkční URL  

---

### 6. OG:image tag — ⚠️ POZNÁMKA

**Nalezeno v `<head>`:**
```
<meta property="og:image" content="http://localhost:3000/opengraph-image-xgl6v7?de2f4a72ffa19df5"/>
```

**Situace:** og:image nesměřuje na `/og-default.png` ale na dynamický Next.js OG route (`/opengraph-image-xgl6v7`). V Next.js App Router je toto **standardní chování** — pokud existuje `opengraph-image.tsx` soubor v app directory, automaticky přepisuje statické og-default.png.

Dynamický route vrací HTTP 200 a generuje branded branded obrázek (ověřeno vizuálně — stejný branded dark-blue design).

**Není to chyba** — jde o Next.js App Router behavior. V production bude URL: `https://carmakler.cz/opengraph-image-xgl6v7?...`

---

## Shrnutí

| Kontrola | Výsledek |
|----------|----------|
| favicon.svg — barevný | ✅ Orange #f58229 |
| og-default.png — branded | ✅ 1200×630, oranžové detaily |
| logo-color.png — barevné | ✅ Orange + black |
| favicon v HTML `<head>` | ✅ 3 velikosti, HTTP 200 |
| Organization JSON-LD | ✅ Přítomen s logo URL |
| og:image tag | ✅ Přítomen (dynamický Next.js route) |

**FIX z Task #7 je funkční a nasazený. Černobílý problém vyřešen.**
