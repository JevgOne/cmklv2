# Plan TASK-042 — PDF šablony a prezentace

**Datum:** 2026-04-11
**Agent:** Plánovač
**Zdroj:** TASK-QUEUE.md řádky 6205-6293, existující šablony v `docs/presentations/`
**Effort:** ~10h (6 šablon, každá ~1.5-2h)
**DB migrace:** ŽÁDNÁ
**Nové dependencies:** ŽÁDNÉ (Playwright pro PDF generaci v generate-pdf.mjs)

---

## §0 Executive summary

TASK-042 požaduje 6 nových HTML šablon v `docs/presentations/`. Existující šablony (`carmakler-pro-autobazary.html`, `carmakler-pro-vrakoviste.html`) definují kompletní design systém:

**Design pattern (z existujících šablon):**
- Font: Outfit (Google Fonts), weights 300-900
- Primární: `#F97316` (orange), Tmavá: `#1a1a2e`
- A4 landscape slides (297mm × 210mm), `page-break-after: always`
- Print-ready: `-webkit-print-color-adjust: exact`, `@page { size: A4 landscape; margin: 0 }`
- Slide structure: `.slide` container → `.slide-header` (h2 + logo) → content → `.slide-footer` (orange gradient bar)
- Title slide: dark gradient background, centered logo + h1 + subtitle
- CTA slide: dark gradient, centered heading + contact grid
- Components: `.feature-card`, `.pricing-card`, `.stat-box`, `.step`, `.highlight`, `.dark-box`, comparison table
- Logo refs: `../../public/brand/logo-white.png`, `../../public/brand/logo-color.png`

**Stav:** TASK-QUEUE uvádí 6 existujících šablon, ale v `docs/presentations/` existují jen 2 HTML + 1 MJS. Ostatní 4 (kroky-prodeje-v2, skoleni-makleru, uvodni-strana, zprostredkovatelska-smlouva) neexistují — buď byly smazány nebo nikdy vytvořeny.

**Poznámka k TASK-042 vs TASK-QUEUE:** Spec v TASK-QUEUE uvádí 4 existující šablony, které chybí. Tento plán se soustředí na **6 nových šablon** dle zadání + aktualizaci `generate-pdf.mjs`.

---

## §1 Sdílený CSS základ

Všech 6 šablon sdílí identický CSS základ. Aby se předešlo duplikaci (~200 řádků CSS v každém souboru), doporučuji:

**Option A (jednodušší, doporučeno):** Každá šablona má svůj inline CSS — copy-paste z existujících šablon. Toto je současný pattern a zajišťuje že každý HTML je self-contained (otevřitelný bez serveru).

**Option B (DRY ale vyžaduje server):** Extrahovat `docs/presentations/shared-styles.css` a linkovat přes `<link rel="stylesheet">`. Problém: `file://` protokol blokuje cross-file CSS v některých browserech.

**Rozhodnutí:** Option A — self-contained HTML soubory, konzistentní s existujícím patternem.

---

## §2 Šablony k vytvoření

### 2.1 `docs/presentations/landing-page-sablona.html` — LP wireframe

**Formát:** A4 landscape, 4-5 slidů
**Účel:** Vizuální wireframe ukazující jak mají vypadat SEO landing pages

**Slidy:**
1. **Title slide:** "Struktura SEO Landing Pages — CarMakler"
2. **Značková LP (Škoda):** Wireframe s označenými sekcemi:
   - Hero: H1 "Škoda — prodej a výkup", breadcrumbs, rychlá fakta box
   - Katalog: Grid vozidel s filtry
   - Srovnávací tabulka: Škoda modely × cena × rok
   - FAQ: 5-8 otázek accordion
   - CTA: "Nabídněte své auto" + kontakt
   - JSON-LD pozice (overlay markers: `<script type="application/ld+json">`)
3. **Modelová LP (Octavia):** Variace wireframu pro specifický model
   - H1 "Škoda Octavia — výkup, prodej, ceny"
   - Cenová historie (graf placeholder)
   - Srovnání generací (I, II, III, IV)
   - Technické parametry tabulka
4. **Cenová + lokální LP:** Dvě mini-wireframy vedle sebe:
   - Cenová: "Auta do 200 000 Kč" — filtr grid + statistiky
   - Lokální: "Autobazar Praha" — mapa + regionální nabídka
5. **Mobile wireframe:** Responsivní verze (1 sloupec) vedle desktop verze

**Speciální CSS:** `.wireframe-box` (dashed border, labeled sections), `.json-ld-marker` (blue badge overlay), `.mobile-mockup` (phone frame)

---

### 2.2 `docs/presentations/obchodni-prezentace.html` — Obchodní prezentace

**Formát:** A4 landscape, 8-10 slidů
**Účel:** Klientská prezentace "Kdo jsme a co děláme"

**Slidy:**
1. **Title:** "CarMakler — Kompletní automobilová platforma"
2. **Kdo jsme:** Krátký pitch — technologická firma + síť makléřů + marketplace. Mise + vize.
3. **4 produkty (grid-4):**
   - Makléřská síť: ikona 🤝, 186 makléřů, bezpečný prodej
   - Inzertní platforma: ikona 📋, 1 247 inzerátů, hybridní model
   - Eshop autodíly: ikona 🔧, propojení vrakovišť, VIN matching
   - Marketplace VIP: ikona 💎, investment flipping, 40/40/20 split
4. **Jak to funguje — makléřská síť (3 kroky):** Vyberte vůz → Kontaktujte makléře → Bezpečný nákup
5. **Čísla a statistiky (stat-box grid):**
   - 1 247 vozidel
   - 186 makléřů
   - Průměr 14 dní do prodeje
   - 4.8 hodnocení
   - 98% úspěšnost
6. **Ceník služeb:** Pricing cards — Makléřská provize (5%, min 25k), Inzerce (zdarma/premium), Prověrka (499 Kč)
7. **Reference / recenze (grid-3):** 3 testimonial cards s citáty, jmény, fotkami (placeholder)
8. **Proč CarMakler (comparison table):** CarMakler vs Sauto vs Bazoš vs TipCars — funkce srovnání
9. **CTA slide:** "Pojďme spolupracovat" + kontakt grid (email, telefon, web)

---

### 2.3 `docs/presentations/marketplace-investori.html` — Marketplace pro investory

**Formát:** A4 landscape, 7-8 slidů
**Účel:** Prezentace investičního modelu pro potenciální investory

**Slidy:**
1. **Title:** "CarMakler Marketplace — Investiční příležitosti v automobilech"
2. **Co je Marketplace:** Uzavřená platforma — ověření dealeři nabízí investiční příležitosti (nákup + oprava + prodej). Auto na firmu Carmakler.
3. **Investiční model (feature-card):**
   - 40% investor
   - 40% dealer
   - 20% CarMakler (správa, garance, právní servis)
   - Vizualizace: 3 sloupce s progress bary nebo pie chart
4. **Jak to funguje (4 kroky):**
   1. Dealer najde příležitost → popis, fotky, kalkulace
   2. Investor schválí a financuje
   3. Dealer realizuje (nákup, oprava)
   4. Prodej → dělení zisku
5. **Historické výnosy / ROI:**
   - Stat boxes: průměrný ROI 15-25%, průměrná doba 45 dní, min. investice 100k Kč
   - Tabulka: 5 příkladů dealů (nákup → oprava → prodej → zisk → ROI%)
6. **Risk management:**
   - Auto na firmu CarMakler (právní ochrana)
   - Inspekce každého vozu
   - Pojištění odpovědnosti
   - Escrow platby přes Stripe
7. **Registrace + podmínky:**
   - Kdo se může registrovat (FO/PO, min. investice)
   - Verifikační proces (OP, výpis z OR, AML)
   - Jak začít: 3 kroky (registrace → verifikace → první deal)
8. **CTA:** "Začněte investovat" + kontakt

---

### 2.4 `docs/presentations/onboarding-makler.html` — Onboarding makléře

**Formát:** A4 landscape, 8-9 slidů
**Účel:** Vizuální průvodce novým makléřem

**Slidy:**
1. **Title:** "Průvodce novým makléřem — CarMakler"
2. **5 kroků onboardingu (step layout):**
   1. Vytvoření profilu (údaje, region, fotka)
   2. Nahrání dokumentů (ŽL, OP)
   3. Podpis smlouvy (digitálně v PWA)
   4. Absolvování kvízu (5 otázek)
   5. Aktivace — můžete nabírat auta
3. **PWA aplikace (mock screenshots):**
   - Dashboard (wireframe)
   - Nabrat auto — hlavní CTA
   - Smlouvy
   - AI Asistent
   - Kontakty
4. **Jak nabrat auto — 7 kroků:**
   1. VIN sken / zadání
   2. Základní údaje (značka, model, km)
   3. Výbava (checklisty)
   4. Stav vozu (hodnocení 1-5)
   5. Fotografie (min 15)
   6. Smlouva (digitální podpis)
   7. Odeslání → BackOffice schvaluje
5. **Quick Mode — 3 kroky:**
   - Zrychlený flow: VIN → Fotky → Smlouva
   - Pro zkušené makléře
6. **Provize a odměny:**
   - 5% z prodejní ceny, min 25 000 Kč
   - Bonusy za objem (10+ aut/měsíc → +0.5%)
   - Pricing table nebo stat boxes
7. **Gamifikace — levely a achievementy:**
   - Level 1: Nováček (0-5 prodejů)
   - Level 2: Profesionál (6-20)
   - Level 3: Expert (21-50)
   - Level 4: Šampion (51+)
   - Achievementy: První prodej, Rychlý makléř, Měsíční rekordman
8. **Často kladené otázky (FAQ):** 5-6 otázek
9. **CTA:** "Přidejte se k síti" + kontakt

---

### 2.5 `docs/presentations/cenik-sluzeb.html` — Ceník služeb

**Formát:** A4 landscape, 5-6 slidů
**Účel:** Kompletní přehled cen pro všechny 4 produkty

**Slidy:**
1. **Title:** "Ceník služeb — CarMakler"
2. **Makléřská síť — pricing cards (grid-3):**
   - Standardní provize: 5%, min 25 000 Kč
   - Exkluzivní smlouva: 4.5%, přednost v nabídce
   - Volume: 10+ aut/měsíc → individuální sazba
3. **Inzertní platforma — pricing cards (grid-3):**
   - Soukromý: 1 inzerát zdarma/60 dní
   - Premium: TOP 199 Kč/7 dní, Prodloužení 99 Kč/30 dní
   - Bazar balíček: 1 990 Kč/30 inzerátů
4. **Doplňkové služby — pricing table:**
   - CEBIA prověrka: 499 Kč (makléři zdarma)
   - Financování: zdarma kalkulace, provize od partnera
   - Pojištění: zdarma porovnání, provize od partnera
   - Kauční rezervace: 5 000 Kč (48h garance)
5. **Eshop autodíly — Wolt model:**
   - Dodavatel: registrace zdarma, provize z prodeje (default 15%)
   - Zákazník: cena dílu + doprava
   - Marketplace fee: zahrnutá v ceně
6. **Marketplace VIP:**
   - Dělení zisku: 40% investor / 40% dealer / 20% CarMakler
   - Registrace: verifikace zdarma
   - Minimální investice: od 100 000 Kč
7. **CTA:** "Kontaktujte nás pro individuální nabídku"

---

### 2.6 `docs/presentations/faktura-sablona.html` — Šablona faktury

**Formát:** A4 **portrait** (210mm × 297mm) — POZOR, jiný formát!
**Účel:** Fakturační šablona pro tisk/PDF

**Layout (1 stránka):**
```
┌──────────────────────────────────────┐
│ ┌────────┐       FAKTURA č. FV2026001│
│ │  LOGO  │       Datum vystavení:    │
│ └────────┘       Datum splatnosti:   │
│                                      │
│ DODAVATEL          ODBĚRATEL         │
│ CarMakler s.r.o.   [Jméno firmy]     │
│ IČO: [DOPLNIT]    IČO: [zákazník]   │
│ DIČ: [DOPLNIT]    DIČ: [zákazník]   │
│ Adresa...          Adresa...         │
│                                      │
│ ┌────┬──────────┬──┬──────┬─────────┐│
│ │ #  │ Položka  │Ks│Cena  │ Celkem  ││
│ ├────┼──────────┼──┼──────┼─────────┤│
│ │ 1  │ Provize  │ 1│25000 │ 25 000  ││
│ │ 2  │ ...      │  │      │         ││
│ ├────┴──────────┴──┴──────┼─────────┤│
│ │              Základ DPH │ 20 661  ││
│ │               DPH 21%  │  4 339  ││
│ │          CELKEM K ÚHRADĚ│ 25 000  ││
│ └─────────────────────────┴─────────┘│
│                                      │
│ PLATEBNÍ ÚDAJE                       │
│ Banka: [DOPLNIT]                     │
│ Číslo účtu: [DOPLNIT]               │
│ Variabilní symbol: FV2026001         │
│ ┌────────────┐                       │
│ │  QR PLATBA │ (placeholder box)     │
│ └────────────┘                       │
│                                      │
│ ──────────────────────────────────── │
│ CarMakler s.r.o. · carmakler.cz     │
└──────────────────────────────────────┘
```

**Speciální CSS:**
- `@page { size: A4 portrait; margin: 0; }` — ODLIŠNÉ od ostatních šablon!
- `.invoice-page` místo `.slide` (210mm × 297mm)
- Tabulka: `.invoice-table` s DPH řádky
- QR placeholder: `.qr-placeholder` (120×120px border box)
- Logo menší (height: 50px)
- Firemní údaje z `lib/company-info.ts` pattern — použít `[DOPLNIT]` placeholdery

---

## §3 Úprava existujícího souboru

### 3.1 `docs/presentations/generate-pdf.mjs` — přidat nové šablony

**Aktuální kód** generuje PDF jen pro 2 soubory. Rozšířit o všech 6 nových:

```javascript
// Existující
await generatePDF('carmakler-pro-autobazary.html', path.join(desktop, 'CarMakler-pro-autobazary.pdf'));
await generatePDF('carmakler-pro-vrakoviste.html', path.join(desktop, 'CarMakler-pro-vrakoviste.pdf'));

// Nové — landscape
await generatePDF('landing-page-sablona.html', path.join(desktop, 'CarMakler-landing-page-sablona.pdf'));
await generatePDF('obchodni-prezentace.html', path.join(desktop, 'CarMakler-obchodni-prezentace.pdf'));
await generatePDF('marketplace-investori.html', path.join(desktop, 'CarMakler-marketplace-investori.pdf'));
await generatePDF('onboarding-makler.html', path.join(desktop, 'CarMakler-onboarding-makler.pdf'));
await generatePDF('cenik-sluzeb.html', path.join(desktop, 'CarMakler-cenik-sluzeb.pdf'));

// Nové — PORTRAIT (jiný formát!)
await generatePortraitPDF('faktura-sablona.html', path.join(desktop, 'CarMakler-faktura-sablona.pdf'));
```

**Přidat portrait variantu:**

```javascript
async function generatePortraitPDF(htmlFile, pdfOutput) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const filePath = path.resolve(__dirname, htmlFile);
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.pdf({
    path: pdfOutput,
    width: '210mm',
    height: '297mm',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log(`Generated: ${pdfOutput}`);
  await browser.close();
}
```

---

## §4 Implementation order

Doporučené pořadí (od nejjednoduššího po nejsložitější):

| # | Šablona | Slides | Effort | Poznámka |
|---|---------|--------|--------|----------|
| 1 | `faktura-sablona.html` | 1 | ~1h | Portrait, 1 stránka, jednoduchý layout |
| 2 | `cenik-sluzeb.html` | 6 | ~1.5h | Hlavně pricing cards + tabulky |
| 3 | `landing-page-sablona.html` | 5 | ~2h | Wireframe boxes, speciální CSS |
| 4 | `obchodni-prezentace.html` | 9 | ~2h | Nejvíce obsahu, ale standard layout |
| 5 | `onboarding-makler.html` | 9 | ~2h | Hodně kroků + gamifikace vizualizace |
| 6 | `marketplace-investori.html` | 8 | ~1.5h | ROI tabulky + risk management |
| 7 | `generate-pdf.mjs` update | — | ~15min | Přidat nové soubory + portrait fn |

**Paralelizace:** Všechny šablony jsou nezávislé a mohou se implementovat paralelně. Jediná závislost: `generate-pdf.mjs` update po dokončení všech šablon.

---

## §5 CSS componenty k reuse (z existujících šablon)

Implementator MUSÍ zkopírovat tyto CSS bloky z `carmakler-pro-autobazary.html` do každé nové šablony:

| CSS class | Řádky | Účel |
|-----------|-------|------|
| `body`, `@page`, `.slide` | 10-38 | Base print-ready layout |
| `.slide-title` + `::before/after` | 41-73 | Title slide (dark gradient + circles) |
| `.slide-header` | 76-85 | Common slide header (h2 + logo) |
| `.orange`, `.highlight`, `.dark-box` | 87-89 | Utility classes |
| `.grid-2/3/4` | 92-94 | Grid layouts |
| `.feature-card` | 97-119 | Feature card component |
| `.pricing-card` | 122-153 | Pricing card component |
| `.stat-box` | 156-164 | Statistics box |
| `.step` + `.step-num` | 167-187 | Step indicator |
| Comparison table | 190-198 | Table with check/cross/partial |
| `.slide-cta` | 202-215 | CTA slide |
| `.slide-footer` | 218-225 | Bottom orange gradient bar |
| `@media print/screen` | 227-237 | Print/screen modes |

**NOVÉ CSS (jen pro specifické šablony):**

Pro **landing-page-sablona.html:**
```css
.wireframe-box { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px; position: relative; }
.wireframe-label { position: absolute; top: -10px; left: 16px; background: white; padding: 0 8px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.json-ld-marker { display: inline-block; background: #3b82f6; color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.mobile-mockup { border: 3px solid #1a1a2e; border-radius: 24px; padding: 8px; width: 180px; }
```

Pro **faktura-sablona.html:**
```css
@page { size: A4 portrait; margin: 0; }
.invoice-page { width: 210mm; height: 297mm; padding: 30px 40px; background: white; }
.invoice-table { width: 100%; border-collapse: collapse; }
.invoice-table th { background: #1a1a2e; color: white; padding: 10px 14px; font-size: 13px; }
.invoice-table td { padding: 8px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
.invoice-total { font-size: 18px; font-weight: 800; color: #F97316; }
.qr-placeholder { width: 120px; height: 120px; border: 2px dashed #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #94a3b8; }
```

---

## §6 Obsahové poznámky

**Texty BEZ diakritiky** — konzistentní s existujícími šablonami (`carmakler-pro-autobazary.html` nepoužívá háčky/čárky). Toto je vědomé rozhodnutí pro kompatibilitu s PDF renderingem.

**Logo cesty:** `../../public/brand/logo-white.png` a `../../public/brand/logo-color.png` — relativní k `docs/presentations/`.

**Placeholder data:** Statistiky (1 247 vozidel, 186 makléřů atd.) jsou marketingová — nemusí odpovídat reálným datům. Faktura používá `[DOPLNIT]` placeholdery konzistentní s `lib/company-info.ts`.

**Čísla z CLAUDE.md:**
- Provize makléř: 5% z prodejní ceny, min. 25 000 Kč
- Marketplace split: 40% investor / 40% dealer / 20% CarMakler
- TOP inzerát: 199 Kč/7 dní
- Prodloužení: 99 Kč/30 dní
- Bazar balíček: 1 990 Kč/30 inzerátů
- CEBIA prověrka: 499 Kč
- Kauční rezervace: 5 000 Kč

---

## §7 Acceptance criteria

- [ ] 6 nových HTML souborů v `docs/presentations/`
- [ ] Konzistentní vizuální styl s existujícími šablonami (font Outfit, orange #F97316, dark #1a1a2e)
- [ ] Print-ready — exportovatelné do PDF přes Ctrl+P nebo `generate-pdf.mjs`
- [ ] Faktura šablona je A4 portrait (ostatní landscape)
- [ ] Landing page šablona obsahuje wireframe boxy s labels
- [ ] Obchodní prezentace pokrývá všechny 4 produkty
- [ ] Marketplace prezentace má ROI tabulku s příklady
- [ ] Onboarding průvodce má 7 kroků nabírání + gamifikace
- [ ] Ceník pokrývá všechny produkty a služby
- [ ] `generate-pdf.mjs` aktualizován o všechny nové soubory
- [ ] Otevření v browseru zobrazuje správně (slide layout)
- [ ] PDF export zachová barvy a layout

## §8 STOP kritéria

- **STOP-1:** Logo soubory neexistují na cestě `../../public/brand/` → ověř existenci, fallback na text "CARMAKLER" s CSS styling
- **STOP-2:** Outfit font se nenačte offline → font je importovaný přes Google Fonts CDN, pro offline generaci přes generate-pdf.mjs to funguje (Playwright má network přístup). Pro úplně offline: embed font jako base64.
- **STOP-3:** Faktura portrait se tiskne jako landscape → ověř že `@page { size: A4 portrait; }` je v `.invoice-page` šabloně a NE v base `.slide` CSS.
