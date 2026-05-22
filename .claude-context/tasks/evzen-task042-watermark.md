# Evžen Review — TASK-042 PDF šablony + Vodoznak

**Datum:** 2026-04-11
**Reviewer:** Evžen THE KING
**Scope:** 2 features (commit 72773b3 + a49e1a2)

---

## VERDIKT: ✅ SCHVÁLENO — Obě implementace odpovídají zadání

---

## 1. TASK-042 — PDF šablony (commit 72773b3)

**Zadání:** TASK-QUEUE.md řádky 6205-6293
**Soubory:** 6 nových HTML + 1 edit generate-pdf.mjs (7 souborů, +3337 lines)

### Kontrola: 6 šablon vs spec

| # | Šablona | Soubor | Formát | Klíčové sekce (spec) | Verdikt |
|---|---|---|---|---|---|
| 1 | Landing page wireframe | `landing-page-sablona.html` | A4 landscape | Hero, breadcrumbs, FAQ, CTA, JSON-LD, Škoda brand LP, Octavia model LP, cenová LP "do 200 000 Kč", lokální LP "Praha", mobile wireframe (375px) | ✅ |
| 2 | Obchodní prezentace | `obchodni-prezentace.html` | A4 landscape | Kdo jsme, 4 produkty, čísla, ceník, reference, kontakt + CTA | ✅ |
| 3 | Marketplace investoři | `marketplace-investori.html` | A4 landscape | 40/40/20 dělení zisku, ROI, risk management, krokový postup, investorský segment | ✅ |
| 4 | Onboarding makléř | `onboarding-makler.html` | A4 landscape | 5 kroků onboardingu, provize a odměny, gamifikace (levely, achievementy) | ✅ |
| 5 | Ceník služeb | `cenik-sluzeb.html` | A4 landscape | 5% provize (min 25 000 Kč), inzerce (zdarma/premium/topování), marketplace poplatky | ✅ |
| 6 | Faktura šablona | `faktura-sablona.html` | **A4 portrait** | Tabulka položek, DPH 21%, bankovní údaje, QR platba placeholder | ✅ |

### Vizuální styl (spec: konzistentní s existujícími)

| Požadavek | Ověřeno | Kde |
|---|---|---|
| Font: Outfit (300-900) | ✅ | Každý soubor: `@import url('...Outfit...')`, `font-family: 'Outfit'` |
| Primární: #F97316 | ✅ | Ověřeno v obchodni-prezentace.html:69 a dalších |
| Print-ready CSS | ✅ | `print-color-adjust: exact` + `@page` v každé šabloně |
| Slide layout (297×210mm) | ✅ | `@page { size: A4 landscape }` (portrait pro fakturu) |

### generate-pdf.mjs aktualizace

- ✅ Přidána `generatePortraitPDF()` funkce pro A4 portrait (faktura)
- ✅ 5 nových landscape šablon přidáno do generátoru
- ✅ 1 portrait šablona (`faktura-sablona.html`) používá `generatePortraitPDF()`
- ✅ Existující šablony (autobazary, vrakoviště) zachovány

---

## 2. Vodoznak na fotkách (commit a49e1a2)

**Zadání:** Každá nahraná fotka (eshop/inzerce/nabídka) musí mít vodoznak CarMakler
**Soubory:** 4 (lib/cloudinary.ts, api/upload/route.ts, api/listings/[id]/images/route.ts, scripts/upload-watermark.ts)

### Architektura vodoznaku

**Cloudinary overlay transformation:**
```
l_carmakler:watermark,g_south_east,w_0.15,o_40,x_15,y_15,fl_relative/fl_layer_apply
```
- Pozice: pravý dolní roh (`g_south_east`)
- Velikost: 15% šířky obrázku, responzivní (`fl_relative`)
- Opacity: 40% — viditelný ale nerušivý
- Padding: 15px od rohu

### Pokrytí — kde se vodoznak aplikuje

| Upload preset | Folder | Watermark | Verdikt |
|---|---|---|---|
| `vehicles` | carmakler/vehicles | ✅ `watermark: true` | ✅ |
| `listings` | carmakler/listings | ✅ `watermark: true` | ✅ |
| `parts` | carmakler/parts | ✅ `watermark: true` | ✅ |
| `damages` | carmakler/damages | ✅ `watermark: true` | ✅ |
| `invoices` | carmakler/invoices | ❌ (záměr — dokumenty) | ✅ |
| `contracts` | carmakler/contracts | ❌ (záměr — dokumenty) | ✅ |

### Listings images route

- ✅ `app/api/listings/[id]/images/route.ts:5` — importuje `WATERMARK_TRANSFORMATION`
- ✅ `:77` — `transformation: WATERMARK_TRANSFORMATION` při uploadu

### Upload watermark script

- ✅ `scripts/upload-watermark.ts` — one-time script nahraje `public/brand/logo-white.png` jako `carmakler/watermark` do Cloudinary
- ✅ Používá signed upload s `overwrite: true`
- ✅ Spuštění: `npx tsx scripts/upload-watermark.ts`

### Kontrola: Dev mode

- ✅ `lib/cloudinary.ts:43-48` — Dev mode bez Cloudinary env vars vrací placeholder URL, žádný crash

---

## 3. Scope creep kontrola

- ✅ TASK-042: Pouze `docs/presentations/` — žádné dotčení app kódu
- ✅ Vodoznak: Minimální změny (12 lines lib + 10 lines upload route + 6 lines listings route + script)
- ✅ Žádné dotčení existujících šablon (autobazary, vrakoviště, kroky-prodeje, školení, úvodní, smlouva)
- ✅ Žádné protected systems dotčeny

---

## 4. Celkový souhrn

| Feature | Požadavky splněny | Soubory | Verdikt |
|---|---|---|---|
| TASK-042 (6 šablon) | 6/6 šablon + vizuální styl + print-ready + generate-pdf.mjs | 7 | ✅ |
| Vodoznak | 4/4 image presets + listings route + script | 4 | ✅ |
| **CELKEM** | **Vše splněno** | **11** | **✅ SCHVÁLENO** |

### ✅ SCHVÁLENO — Obě implementace připraveny k deploy
