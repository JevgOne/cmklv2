# TASK-061 — Favicon z loga CarMakler

## Stav: PLAN READY
**Datum:** 2026-04-16

---

## 1. Audit stavu

### Zdroje loga
| Soubor | Rozliseni | Popis |
|--------|-----------|-------|
| `public/brand/icon-color.jpg` | 1140x1600 (portrait!) | Brandova ikona — NEJLEPSI zdroj pro favicon |
| `public/brand/logo-color.png` | 5517x1172 | Horizontalni logo s textem — nevhodne pro favicon |
| `public/brand/logo-dark.png` | ~ | Tmave horizontalni logo |
| `public/brand/logo-white.png` | ~ | Bile horizontalni logo |

### Existujici ikony (BROKEN)
| Soubor | Deklarovano | Skutecnost |
|--------|-------------|-----------|
| `public/brand/favicon.ico` | Referencovano v layout.tsx | **NEEXISTUJE** (404) |
| `public/brand/apple-touch-icon.png` | Referencovano v layout.tsx | **NEEXISTUJE** (404) |
| `public/icons/icon-192.png` | 192x192 v manifest.json | **JE 16x16** (placeholder) |
| `public/icons/icon-512.png` | 512x512 v manifest.json | **JE 16x16** (placeholder) |
| `public/icons/icon-maskable-192.png` | 192x192 v manifest.json | **JE 16x16** (placeholder) |
| `public/icons/icon-maskable-512.png` | 512x512 v manifest.json | **JE 16x16** (placeholder) |
| `public/icons/icon-192.svg` | — | Generic "CM" text SVG, ne logo |
| `public/icons/icon-512.svg` | — | Generic "CM" text SVG, ne logo |

**Zaver:** Favicon je kompletne rozbitym — 2 soubory neexistuji, 4 PNG jsou 16x16 placeholdery, 2 SVG jsou genericky "CM" text (ne skutecne logo).

---

## 2. Strategie

**Strategie C** — Zdrojovy soubor je `public/brand/icon-color.jpg` (1140x1600 JPG).

Tento soubor je portrait orientace, takze je treba ho orezat na ctverec (1140x1140, centrovat vertikalne) a pak resizovat na vsechny potrebne velikosti.

### Nastroj
`sharp` (uz v projektu jako dependency Nextu) nebo `sips` (macOS nativni).
Doporuceni: pouzit **sharp** ve skriptu nebo **sips** primo z bash.

---

## 3. Soubory ke generovani

Z `public/brand/icon-color.jpg` (orez na ctverec 1140x1140):

| Cilovy soubor | Rozliseni | Format | Ucel |
|---------------|-----------|--------|------|
| `public/brand/favicon.ico` | 16x16 + 32x32 + 48x48 | ICO | Browser tab favicon |
| `public/brand/apple-touch-icon.png` | 180x180 | PNG | iOS homescreen |
| `public/icons/icon-192.png` | 192x192 | PNG | PWA manifest |
| `public/icons/icon-512.png` | 512x512 | PNG | PWA manifest / splash |
| `public/icons/icon-maskable-192.png` | 192x192 (s safe zone padding) | PNG | PWA maskable |
| `public/icons/icon-maskable-512.png` | 512x512 (s safe zone padding) | PNG | PWA maskable |

**Maskable ikony:** Vyzaduji 40% safe zone (obsah v centralnim 60% kruhu). Dodat padding 20% na kazdou stranu s orange (#F97316) pozadim.

---

## 4. Zmeny v kodu

### 4a. `app/layout.tsx` — metadata.icons (radek 67-70)
Aktualni:
```ts
icons: {
  icon: "/brand/favicon.ico",
  apple: "/brand/apple-touch-icon.png",
},
```
Rozsirti na:
```ts
icons: {
  icon: [
    { url: "/brand/favicon.ico", sizes: "48x48" },
    { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
  apple: [
    { url: "/brand/apple-touch-icon.png", sizes: "180x180" },
  ],
},
```

### 4b. `public/manifest.json` — icons pole (radek 11-35)
Uz ma spravnou strukturu, staci nahradit PNG soubory spravnym obsahem.
Zadne zmeny v JSON nejsou nutne.

### 4c. Smazat nepotrebne SVG placeholdery
- `public/icons/icon-192.svg` — smazat
- `public/icons/icon-512.svg` — smazat

---

## 5. Implementacni kroky

1. **Orez zdroje:** `icon-color.jpg` orezat na ctverec (centrovany crop 1140x1140)
2. **Generovat PNG:** Z orezu vyrobit 512x512, 192x192, 180x180 PNG
3. **Generovat ICO:** Z orezu vyrobit favicon.ico (multi-size: 16+32+48)
4. **Generovat maskable:** Z orezu pridat 20% padding s #F97316 pozadim, vyrobit 512x512 a 192x192
5. **Ulozit soubory** do `public/brand/` a `public/icons/`
6. **Update layout.tsx** — rozsirit metadata.icons
7. **Smazat** stare SVG placeholdery
8. **Build test** — `npm run build` musi projit

### Prikazy (bash s sips + magick/convert)
```bash
# Krok 1: Orez na ctverec (centrovany vertikalne)
# icon-color.jpg je 1140x1600 → crop 1140x1140 s offset Y=230
sips -c 1140 1140 --cropOffset 230 0 public/brand/icon-color.jpg --out /tmp/icon-square.png

# Krok 2: Resize na vsechny velikosti
sips -z 512 512 /tmp/icon-square.png --out public/icons/icon-512.png
sips -z 192 192 /tmp/icon-square.png --out public/icons/icon-192.png
sips -z 180 180 /tmp/icon-square.png --out public/brand/apple-touch-icon.png

# Krok 3: favicon.ico — pouzit ImageMagick nebo png2ico
# (pokud neni convert, lze pouzit npx sharp-cli nebo online tool)

# Krok 4: maskable — pridat padding s orange pozadim
# (canvas 640x640 orange, vlozit 384x384 logo doprostred → resize na 512/192)
```

**Poznamka:** Implementator musi zkontrolovat vizualni kvalitu orezu (jestli ikona neni uriznuta) a pripadne upravit crop offset. `icon-color.jpg` je treba prozkoumat vizualne pred orezem.

---

## 6. Akceptacni kriteria

- [ ] **AK-1:** `public/brand/favicon.ico` existuje a obsahuje multi-size ikonu (16+32+48px)
- [ ] **AK-2:** `public/brand/apple-touch-icon.png` existuje, je 180x180 PNG
- [ ] **AK-3:** `public/icons/icon-192.png` a `icon-512.png` maji spravne rozmery (ne 16x16 placeholder)
- [ ] **AK-4:** `public/icons/icon-maskable-192.png` a `icon-maskable-512.png` maji safe zone padding
- [ ] **AK-5:** V prohlizeci (DevTools > Application > Manifest) se zobrazuji vsechny ikony spravne, favicon je videt v browser tabu

---

## 7. STOP pravidla

- **STOP-1:** Pokud `icon-color.jpg` obsahuje text/logo ktere se spatne cte pod 48px → eskaluj, mozna bude treba zjednodusit ikonu
- **STOP-2:** Pokud `sips` nebo `convert` neni dostupny → eskaluj, navrhnout alternativu (sharp skript)
- **STOP-3:** Build fail po zmenach → opravit pred commitnutim

---

## Odhad

| Polozka | Cas |
|---------|-----|
| Generovani ikon | 15 min |
| Update layout.tsx | 5 min |
| Cleanup SVG | 2 min |
| Vizualni QA | 10 min |
| **Celkem** | **~30 min** |
