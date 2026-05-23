# TEST REPORT: Chrome test OG obrázků

**Datum:** 2026-05-22  
**Task:** #5  
**Tester:** test-chrome agent

---

## Výsledek: ✅ PASS — Všechny OG obrázky fungují a vypadají výborně

---

## Technický test (HTTP + Content-Type)

| Stránka | URL | HTTP | Content-Type |
|---------|-----|------|--------------|
| Homepage | `/opengraph-image-xgl6v7?...` | ✅ 200 | ✅ image/png |
| Makléři | `/makleri/opengraph-image-1wne8e?...` | ✅ 200 | ✅ image/png |
| Inzerce | `/inzerce/opengraph-image-1qy8eb?...` | ✅ 200 | ✅ image/png |
| Autodíly | `/dily/opengraph-image-hq2ohw?...` | ✅ 200 | ✅ image/png |
| Blog | `/blog/opengraph-image-hq17me?...` | ✅ 200 | ✅ image/png |
| O nás | `/o-nas/opengraph-image-gu1fow?...` | ✅ 200 | ✅ image/png |
| Kontakt | `/kontakt/opengraph-image-z22kni?...` | ✅ 200 | ✅ image/png |
| Nabídka-Škoda | `/nabidka/.../opengraph-image-dsua1q?...` | ✅ 200 | ✅ image/png |

**Pozn.:** Next.js OG routes mají hash suffix v URL (opengraph-image-{hash}?{content-hash}). Správné URL jsou vždy v `<meta property="og:image">` v HTML stránky.

---

## Vizuální hodnocení

### ✅ Ostrost (sharpness)
Všechny obrázky jsou **crisp a ostré** — žádná rozmazanost. Text je anti-aliased, pixel-perfect při 1200×630px. Fix byl úspěšný.

### ✅ Font Outfit
Rozpoznatelný geometrický rounded sans-serif ve všech obrázcích — font Outfit správně načten z `public/fonts/Outfit-{Regular,Bold,ExtraBold}.ttf`.

### ✅ Diakritika (všechny testované znaky)
Komplexní česká diakritika renderuje bezchybně:
- `í` — "Kompletní", "Certifikovaní", "Autodíly", "Použité"
- `é` — "CarMakléř" (ve všech)
- `ř` — "makléři", "CarMakléř"
- `š`, `ť` — "vrakovišť" (nejtěžší test!)
- `ě` — "osobně", "zprostředkování"
- `á`, `ú` — "automobilová", "Průvodci"
- `Š` — "Škoda" (velké písmeno s háčkem ✅)
- `Č` — "celé ČR", "po celé ČR"

### ✅ Barvy — brand identity
- **Orange #F97316** — konzistentně aplikován na druhé/akcentní slovo v každém titulku
- **Dark gradient background** — tmavý modrý přechod (navy → dark blue)
- **Bílý text** — hlavní text, logo
- **Logo** CarMakléř (štít + text) — přítomno ve všech
- **Watermark** `www.carmakler.cz` — bottom right, light

---

## Detailní vizuální popis

### 1. Homepage — "Kompletní automobilová **platforma**"
- Titulek: "Kompletní automobilová" (bílá) + "platforma" (orange)
- Subtitle: "Prodej aut · Inzerce · Autodíly · Marketplace"
- Velikost: ~78 KB

### 2. Makléři — "Certifikovaní **makléři**"
- Titulek: "Certifikovaní" (bílá) + "makléři" (orange)
- Subtitle: "Profesionální zprostředkování prodeje vozidel po celé ČR"
- Diakritika: í, ř, ě, á — perfektní

### 3. Inzerce — "Inzerce **vozidel**"
- Titulek: "Inzerce" (bílá) + "vozidel" (orange)
- Subtitle: "Podejte inzerát zdarma · Oslovte tisíce kupujících · AI generování popisů"
- Diakritika: á, í, ů — perfektní

### 4. Autodíly — "Autodíly od **vrakovišť**"
- **Nejlepší diacritic test:** í, š, ť — vše perfektně
- Titulek: "Autodíly od" (bílá) + "vrakovišť" (orange)
- Subtitle: "Použité i nové díly · Hledání podle VIN · Doručení po celé ČR"

### 5. Blog — "CarMakléř **Blog**"
- Titulek: "CarMakléř" (bílá) + "Blog" (orange)
- Subtitle s ú: "Průvodci" — perfektní

### 6. O nás — "O **CarMakléř**"
- Bullet (●) + "CarMakléř" orange — jiný design accent, stále čitelné
- Subtitle: "Kompletní automobilová platforma pro ČR"

### 7. Kontakt — "Kontaktujte **nás**"
- Titulek: "Kontaktujte" (bílá) + "nás" (orange)
- Subtitle: "Jsme tu pro vás — telefon, email, osobně"
- Diakritika: á, ě — perfektní

### 8. Nabídka — "**Škoda Octavia RS Combi**" (dynamický)
- **Foto auta jako background** + dark overlay
- Název vozidla jako hlavní titulek (plná šírka)
- "2021 · 589 000 Kč · Praha" — info řádek
- Orange accent pruh na spodním okraji
- Velikost: 347 KB (obsahuje foto auta)

---

## Screenshoty
Uloženy v `/tmp/og-screenshots/`:
- `homepage.png`, `makl--i.png`, `inzerce.png`, `autod-ly.png`
- `blog.png`, `o-n-s.png`, `kontakt.png`
- `nab-dka--koda.png` (dynamický)
- `gallery-view.png`, `gallery-scroll.png`

---

## Závěr

**Všechny kritéria splněna:**
- ✅ 8/8 OG obrázků vrací HTTP 200 + image/png
- ✅ Ostrost — crisp, žádná rozmazanost (fix OG rozmazanosti byl úspěšný)
- ✅ Font Outfit — správně načten a renderován
- ✅ Diakritika — všechny české znaky (í, é, ě, ř, š, ť, á, ú, ů, Š, Č) OK
- ✅ Barvy — orange #F97316 brand color konzistentní
- ✅ Statické OG (7 stránek) — vše funguje
- ✅ Dynamický OG (nabídka/vozidlo) — foto + metadata funguje


---

## Dodatek: Kariéra + Profil makléře

### ✅ Kariéra OG image
- URL: `/kariera/opengraph-image-q2gkj5?e56afd47056fb64d`
- HTTP 200 + image/png ✅
- **Vizuál:** "Staňte se **makléřem**" — ✅ diakritika ň,é,ř perfektní, orange accent, Outfit font ostrý
- Screenshot: `/tmp/og-kari-ra.png`

### ❌ PROFIL MAKLÉŘE — OG image vůbec nedorazí na stránku (BUG)

**Symptom:** `<meta property="og:image">` chybí na `/profil/[slug]` stránkách.

**Příčina (kód):**
V `app/(web)/profil/[slug]/page.tsx` v `generateMetadata()` řádek 296–298:
```ts
openGraph: {
  images: user.avatar ? [{ url: user.avatar }] : undefined,
}
```

Když uživatel nemá avatar (všechny záznamy v DB mají `avatar = NULL`), vrátí se `images: undefined`. 
Next.js to interpretuje jako "žádné OG images" a **potlačí auto-discovery z `opengraph-image.tsx`**.

**Soubor `opengraph-image.tsx` existuje a funguje správně** — má `runtime`, `alt`, `size`, `contentType`, fallback na default-avatar.png — ale nikdy není zavolán kvůli override v generateMetadata.

**Důkaz:**
- og:title: "Petra Malá — CarMakléř" ✅ (funguje)
- og:description: "Specialistka na prémiové vozy..." ✅
- og:url: "https://carmakler.cz/profil/petra-mala-brno" ✅
- **og:image: CHYBÍ ❌**

**Fix (1 řádek):**
```ts
// PŘED (page.tsx:298):
images: user.avatar ? [{ url: user.avatar }] : undefined,

// PO — odebrat images z generateMetadata, nechat opengraph-image.tsx:
// (smazat celý řádek images: ...)
```

Nebo alternativně přidat absolutní URL z opengraph-image route.

**Závažnost:** MEDIUM — profily makléřů na sociálních sítích/Slacku zobrazí pouze text, ne vizuální kartu.
