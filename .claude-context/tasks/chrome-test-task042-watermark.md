# Task #28 — TASK-042 PDF Šablony: Vizuální Chrome Test Report

**Datum:** 2026-04-11  
**Runner:** TEST-CHROME agent (claude-sonnet-4-6)  
**Metoda:** Playwright headed Chrome + `open -a "Google Chrome"` přímé otevření HTML souborů  
**Spec:** `e2e/chrome-test-task042-templates.spec.ts` (9 tests, --project=chromium)  
**Verdict:** GREEN ✅ — 9/9 PASS + vizuální kontrola OK  

> **Poznámka:** Vodoznak (Cloudinary server-side) nelze testovat v Chrome — SKIP (dle zadání).

---

## Vizuální kontrola — 6 šablon

### 1. `landing-page-sablona.html` — SEO Landing Page Wireframe

**Viewport:** 1280×900  
**Screenshot:** `test-results/t042-landing-page-sablona.png`

| Kritérium | Výsledek | Detail |
|-----------|---------|--------|
| Layout | ✅ | 4 sekce na bílém pozadí, oddělené oranžovými akcenty |
| Barvy | ✅ | Orange #F97316 headings, dark navy sekce, světlé sekundární sekce |
| Font | ✅ | Outfit načten — čisté bold headings |
| Obsah | ✅ | Značková LP (Škoda) + Modelová LP (Octavia) + Cenová/Lokální LP + Mobile wireframe |
| Print | ✅ | @page + print-color-adjust: exact |
| JS errors | 0 | |

**Vizuální pozorování:** Wireframe ukazuje přesnou strukturu SEO landing pages — JSON-LD schema panely, SEO sloty (H1/title/description), mobilní vs. desktopovou verzi. Profesionální a informativní. ✅

---

### 2. `obchodni-prezentace.html` — Obchodní Prezentace

**Viewport:** 1200×850 (A4 landscape)  
**Screenshot:** `test-results/t042-obchodni-prezentace.png`  
**Slajdů:** 25

| Kritérium | Výsledek | Detail |
|-----------|---------|--------|
| Layout | ✅ | Dark hero slide + světlé content slides, konzistentní |
| Barvy | ✅ | #F97316 orange headings, #1a1a2e dark bg na hero, oranžové akcenty |
| Font | ✅ | Outfit, různé váhy (800 pro hero, 600 pro subheadings) |
| Obsah | ✅ | Kdo jsme → 4 produkty → Statistiky (1247 makléřů, 186 prodáno, 4.8★) → Ceník → Reference → Srovnávací tabulka → CTA |
| Srovnávací tabulka | ✅ | CarMakler vs konkurence — checkmarks a × |
| Print | ✅ | A4 landscape |
| JS errors | 0 | |

**Vizuální pozorování:** Kompletní prodejní prezentace. Statistiky jsou vizuálně výrazné (velká čísla v orange). Slide "4 produkty, jedna platforma" má 4 ikonové karty. Slide "Ceník služeb" ukazuje Provize 5%, Inzerce 0Kč, Prověrka 499Kč. Reference slide má 3 citace klientů. ✅

---

### 3. `marketplace-investori.html` — Marketplace Investor Pitch

**Viewport:** 1200×850 (A4 landscape)  
**Screenshot:** `test-results/t042-marketplace-investori.png`  
**Slajdů:** 22

| Kritérium | Výsledek | Detail |
|-----------|---------|--------|
| Layout | ✅ | Dark hero + světlé slides |
| Barvy | ✅ | Orange, dark navy, zelené/červené akcenty pro ROI |
| Font | ✅ | Outfit |
| Obsah | ✅ | Co je Marketplace → 40/40/20 model → Jak to funguje → Historické výnosy → Řízení rizik → Registrace |
| 40/40/20 model | ✅ | 3 sloupce: 40% Investor / 40% Dealer / 20% CarMakler, vizuálně jasné |
| Historické výnosy | ✅ | "15–25%" ROI, "45 dní" průměrná délka, "100k+" — velká čísla |
| Příklad dealu | ✅ | Tabulka s nákupem/opravou/prodejem + výpočet zisku |
| Print | ✅ | A4 landscape |
| JS errors | 0 | |

**Vizuální pozorování:** Profesionální investorský pitch. Sekce "Řízení rizik" má 4 body (pojištění, inspekce, zálohy, escrow). Registrace má 3 kroky s oranžovými numbered kroky. ✅

---

### 4. `onboarding-makler.html` — Onboarding Průvodce Makléře

**Viewport:** 1200×850 (A4 landscape)  
**Screenshot:** `test-results/t042-onboarding-makler.png`  
**Slajdů:** 25

| Kritérium | Výsledek | Detail |
|-----------|---------|--------|
| Layout | ✅ | Konzistentní struktura, oranžové numbered kroky |
| Barvy | ✅ | Orange akcenty, světlé karty na bílém |
| Font | ✅ | Outfit |
| 5 kroků k aktivaci | ✅ | 1. Profil → 2. Dokumenty → 3. Smlouva → 4. Quiz → 5. Aktivace |
| PWA screenshoty | ✅ | Dashboard, Nabídnout auto, Zakázky, AI Asistent, Klienti |
| 7 kroků nabírání | ✅ | VIN → Foto → Popis → Odhad ceny → Smlouva → Podpis → Odeslání |
| Quick Mode | ✅ | 3 kroky s porovnáním Standard vs Quick |
| Provize 5% | ✅ | Tabulka provizí (do 200k: 10 000 Kč, 200-500k: 20 000 Kč, 500k+: 100 000 Kč) |
| Levely | ✅ | Nováček → Profesionál → Expert → Šampión |
| Achievementy | ✅ | Rychlý starter, Fotograf, Pilný makléř, Chmač |
| Print | ✅ | A4 landscape |
| JS errors | 0 | |

**Vizuální pozorování:** Nejbohatší obsah ze všech šablon. FAQ sekce na konci. ✅

---

### 5. `cenik-sluzeb.html` — Ceník Služeb

**Viewport:** 1200×850 (A4 landscape)  
**Screenshot:** `test-results/t042-cenik-sluzeb.png`  
**Slajdů:** 16

| Kritérium | Výsledek | Detail |
|-----------|---------|--------|
| Layout | ✅ | Pricing cards s highlighted variantou |
| Barvy | ✅ | Orange "doporučeno" badge, oranžová cena pro zvýrazněnou variantu |
| Font | ✅ | Outfit |
| Makléřská síť | ✅ | Standardní 5% / Exkluzivní 4.5% (highlighted) / Individuální |
| Inzertní platforma | ✅ | Soukromý 0Kč / Premium 199Kč (highlighted) / Bazar balíček 1990Kč |
| Doplňkové služby | ✅ | CEBIA 499Kč, Předfinancování, Pojistné, Doprava, Prodloužená záruka, Technická prohlídka |
| Finanční služby | ✅ | Zprostředkování financování, Sjednání financování, Správa pojistné události |
| Eshop & Marketplace | ✅ | Wolt model — provize, Marketplace VIP tabulka |
| Print | ✅ | A4 landscape |
| JS errors | 0 | |

**Vizuální pozorování:** Přehledný, prodejní layout. Highlighted varianty mají oranžový border a badge "Doporučeno". CTA na posledním slajdu. ✅

---

### 6. `faktura-sablona.html` — Faktura Šablona

**Viewport:** 794×1123 (A4 portrait)  
**Screenshot:** `test-results/t042-faktura-sablona.png`

| Kritérium | Výsledek | Detail |
|-----------|---------|--------|
| Layout | ✅ | Čisté A4 portrait, bílé pozadí, profesinoální |
| Barvy | ✅ | Orange "FAKTURA c. FV2026001" heading, oranžová Celkem k úhradě |
| Font | ✅ | Outfit — čisté a moderní |
| Hlavička | ✅ | CarMakler logo vlevo, FAKTURA číslo + data vpravo |
| Dodavatel / Odběratel | ✅ | Dvousloupcový layout, Odběratel má highlighted box |
| Tabulka položek | ✅ | #, Položka, MN., MJ., CENA/KS, CELKEM — tmavá hlavička |
| Vzorové položky | ✅ | Zprostředkovatelská provize 25 000 Kč + CEBIA 499 Kč + TOP zvýraznění 2×199 Kč |
| DPH výpočet | ✅ | Základ daně (21%) 21 402 Kč + DPH 21% 4 495 Kč = **25 897 Kč** |
| Platební údaje | ✅ | Banka, Číslo účtu, IBAN, Variabilní symbol, Způsob úhrady |
| QR platba | ✅ | Placeholder "QR platba (vygenerovat)" — ready pro implementaci |
| Patička | ✅ | CarMakler s.r.o. · ICO · Zapsána v OR · www.carmakler.cz |
| Print | ✅ | A4 portrait, print-color-adjust: exact |
| JS errors | 0 | |

**Vizuální pozorování:** Nejčistší a nejprofesionálnější šablona. Vzorová čísla jsou konzistentní (součet dává 25 897 Kč). Připravena pro dynamické generování. ✅

---

## Print CSS Audit — všechny šablony

| Šablona | @page | Velikost | print-color-adjust |
|---------|-------|----------|--------------------|
| landing-page-sablona.html | ✅ | — | ✅ |
| obchodni-prezentace.html | ✅ | A4 landscape | ✅ |
| marketplace-investori.html | ✅ | A4 landscape | ✅ |
| onboarding-makler.html | ✅ | A4 landscape | ✅ |
| cenik-sluzeb.html | ✅ | A4 landscape | ✅ |
| faktura-sablona.html | ✅ | A4 portrait | ✅ |

Ctrl+P print preview: všechny šablony mají `@page { margin: 0 }` a `-webkit-print-color-adjust: exact` → barvy se zachovají při tisku do PDF. ✅

---

## Shoda s TASK-042 specifikací

| Požadavek | Status | Detail |
|-----------|--------|--------|
| 6 nových šablon v `docs/presentations/` | ✅ | Všechny přítomny |
| Konzistentní vizuální styl (Outfit, orange, dark) | ✅ | 100% konzistence |
| Print-ready (exportovatelné do PDF) | ✅ | @page + print-color-adjust |
| Landing page šablona — wireframe se sekcemi | ✅ | 4 typy LP + mobilní verze |
| Obchodní prezentace — 4 produkty, ceník, reference | ✅ | 25 slajdů |
| Marketplace investoři — 40/40/20 model, výnosy | ✅ | 22 slajdů |
| Onboarding makléře — 5 kroků, gamifikace | ✅ | 25 slajdů |
| Ceník služeb — všechny produkty | ✅ | 16 slajdů |
| Faktura — A4 portrait, tabulka, DPH, QR | ✅ | 1 stránka |

---

## Verdict

**GREEN ✅ — všech 6 šablon vizuálně OK.**

- Layout: čitelný, správné proporce, slide-based pro prezentace, A4 pro fakturu
- Barvy: #F97316 orange a #1a1a2e dark konzistentně aplikovány
- Font: Outfit (Google Fonts) načten ve všech šablonách
- Print: Ctrl+P ready — @page rules správně nastaveny
- Obsah: texty dávají smysl, čísla konzistentní, žádné rozbité CSS
- Faktura: A4 portrait ✅, ostatní A4 landscape ✅
- Vodoznak: SKIP — Cloudinary server-side (dle zadání)

**TASK-042 je production-ready.**
