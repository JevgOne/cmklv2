# Plán TASK-042 — PDF šablony a prezentace

**Datum:** 2026-04-13
**Autor:** Plánovač

---

## ⚠️ DŮLEŽITÉ ZJIŠTĚNÍ

**Všech 6 požadovaných šablon JIŽ EXISTUJE v `docs/presentations/`:**

| # | Požadovaná šablona | Existující soubor | Stav |
|---|-------------------|-------------------|------|
| 1 | landing-page-sablona.html | ✅ `docs/presentations/landing-page-sablona.html` | Existuje |
| 2 | obchodni-prezentace.html | ✅ `docs/presentations/obchodni-prezentace.html` | Existuje |
| 3 | marketplace-investori.html | ✅ `docs/presentations/marketplace-investori.html` | Existuje |
| 4 | onboarding-makler.html | ✅ `docs/presentations/onboarding-makler.html` | Existuje |
| 5 | cenik-sluzeb.html | ✅ `docs/presentations/cenik-sluzeb.html` | Existuje |
| 6 | faktura-sablona.html | ✅ `docs/presentations/faktura-sablona.html` | Existuje |

**Další existující šablony:**
- `carmakler-pro-autobazary.html` — prezentace pro autobazary
- `carmakler-pro-vrakoviste.html` — prezentace pro vrakoviště
- `generate-pdf.mjs` — Playwright skript pro generování PDF

### Rozhodnutí pro leada:
**Varianta A:** Pokud je cílem VYTVOŘIT tyto šablony → **úkol je HOTOVÝ**, šablony existují.
**Varianta B:** Pokud je cílem AKTUALIZOVAT/VYLEPŠIT existující šablony → pokračuj čtením plánu níže.

---

## Existující vizuální styl (reference pro konzistenci)

### Společný vzor všech šablon:

**Typografie:**
- Font: Outfit (Google Fonts CDN) — váhy 300–900
- Import: `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900`

**Barvy:**
- Primary orange: `#F97316` (hover: `#ea580c`)
- Orange background: `#FFF7ED`, `#FFEDD5`
- Dark: `#1a1a2e`, `#16213e`, `#0f3460` (gradienty)
- Grays: `#f8fafc`, `#e2e8f0`, `#94a3b8`, `#64748b`, `#475569`
- Success: `#22c55e`, Error: `#ef4444`, Warning: `#f59e0b`, Info: `#3b82f6`

**Layout:**
- A4 landscape: 297mm × 210mm (prezentace)
- A4 portrait: 210mm × 297mm (faktura)
- Padding: 40px 60px (landscape), 30px 40px (portrait)
- Flexbox column layout

**Print/PDF:**
- `-webkit-print-color-adjust: exact`
- `@page { size: A4 landscape/portrait; margin: 0; }`
- `page-break-after: always` mezi slidy

**Logo:**
- Dark bg: `../../public/brand/logo-white.png` (80px title, 36px header)
- Light bg: `../../public/brand/logo-color.png`

### CSS komponenty (znovupoužitelné):
| Třída | Funkce |
|-------|--------|
| `.slide` | Hlavní kontejner (bílé pozadí, page-break) |
| `.slide-title` | Titulní slide (tmavý gradient) |
| `.slide-header` | Hlavička sekce (orange border-bottom 3px) |
| `.grid-2` až `.grid-5` | Layout mřížky |
| `.feature-card` | Karty funkcí (#f8fafc bg, orange ikona) |
| `.pricing-card` | Cenové karty + `.popular` varianta |
| `.stat-box` | Statistiky (orange čísla) |
| `.step` / `.step-num` | Kroky (orange kruhové číslo) |
| `.highlight` | Highlight box (gradient FFF7ED→FFEDD5) |
| `.dark-box` | Tmavý box (#1a1a2e) |
| `.testimonial` | Citace s avatarem |
| `.slide-cta` | CTA slide (tmavý gradient) |
| `.slide-footer` | Orange gradient linka (4px) |
| `table` | Dark header + alternating rows |

---

## Implementační plán (pokud Varianta B — aktualizace)

### Krok 1: Audit obsahu existujících šablon
**Soubory:** Všech 6 v `docs/presentations/`
**Akce:** Přečíst obsah, porovnat s aktuálním stavem projektu (ceny, služby, produkty)
**Výstup:** Seznam zastaralých informací

### Krok 2: Aktualizace obsahu
Pro každou šablonu:

#### 2.1 `landing-page-sablona.html`
- Wireframe SEO landing pages pro Carmakler
- Zkontrolovat: aktuální produkty (4 produkty), USP, CTA
- Doplnit: eshop autodíly sekci (pokud chybí)

#### 2.2 `obchodni-prezentace.html`
- Obchodní prezentace pro klienty
- Zkontrolovat: business model, provize, cenové modely
- Aktualizovat: aktuální počty makléřů, statistiky, reference

#### 2.3 `marketplace-investori.html`
- Prezentace pro investory Marketplace VIP
- Zkontrolovat: revenue split (40/40/20), ROI kalkulace
- Aktualizovat: pipeline, traction, projekce

#### 2.4 `onboarding-makler.html`
- Vizuální průvodce onboardingem nového makléře
- Zkontrolovat: odpovídá aktuálnímu 7-step flow v PWA?
- Aktualizovat: screenshoty, kroky, požadavky

#### 2.5 `cenik-sluzeb.html`
- Ceník všech služeb Carmakler
- Zkontrolovat: aktuální ceny všech 4 produktů
- Aktualizovat: nové služby, balíčky, provize

#### 2.6 `faktura-sablona.html`
- Šablona faktury (A4 portrait)
- Zkontrolovat: IČO, DIČ, bankovní údaje, právní texty
- Aktualizovat: dle aktuálních firemních údajů

### Krok 3: Vizuální konzistence
- Ověřit že všechny šablony používají stejné CSS proměnné
- Sjednotit spacing, font sizes, barvy
- Zkontrolovat loga (správné cesty k `../../public/brand/`)

### Krok 4: PDF generování
- Ověřit `generate-pdf.mjs` generuje všech 8 šablon
- Testovat v Playwright/Chromium
- Zkontrolovat print layout (žádné ořezání obsahu)

### Krok 5: Nové šablony (pokud je potřeba rozšířit)
Pokud lead chce DALŠÍ šablony nad rámec existujících:
- Použít existující CSS třídy a layout
- Dodržet vzor: title slide → content slides → CTA slide → footer
- Přidat do `generate-pdf.mjs` array

---

## Závislosti
- Žádné kódové závislosti — šablony jsou standalone HTML
- Playwright pro generování PDF (`docs/presentations/generate-pdf.mjs`)
- Logo soubory v `public/brand/` (existují)

## Odhad práce
- **Varianta A (hotovo):** 0 — šablony existují
- **Varianta B (aktualizace):** ~2-3h na aktualizaci obsahu + testování PDF
- **Nové šablony:** ~1h na šablonu (kopie existující + nový obsah)
