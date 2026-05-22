# QA Report — TASK-042 PDF šablony a prezentace

**Datum:** 2026-04-11
**Agent:** KONTROLOR
**Task:** #25 QA review TASK-042 — 6 PDF šablon
**Plán:** `.claude-context/tasks/plan-TASK-042-pdf-templates.md`
**Zadání:** TASK-QUEUE.md řádky 6205-6293
**Typ:** Reverzní kontrola + Simplify

---

## VERDICT: ✅ SCHVÁLENO — 0 blockerů, 0 bugs

---

## 1. EXISTENCE SOUBORŮ

| Soubor | Stav |
|---|---|
| `docs/presentations/landing-page-sablona.html` | ✅ exists |
| `docs/presentations/obchodni-prezentace.html` | ✅ exists |
| `docs/presentations/marketplace-investori.html` | ✅ exists |
| `docs/presentations/onboarding-makler.html` | ✅ exists |
| `docs/presentations/cenik-sluzeb.html` | ✅ exists |
| `docs/presentations/faktura-sablona.html` | ✅ exists |
| `docs/presentations/generate-pdf.mjs` | ✅ updated |
| Logo `public/brand/logo-color.png` | ✅ exists (STOP-1 ✅) |
| Logo `public/brand/logo-white.png` | ✅ exists (STOP-1 ✅) |

---

## 2. REVERZNÍ KONTROLA — §7 Acceptance Criteria

| # | Kritérium | Výsledek | Kde ověřeno |
|---|---|---|---|
| AC1 | 6 nových HTML souborů v `docs/presentations/` | ✅ | Glob — všech 6 přítomno |
| AC2 | Konzistentní vizuální styl (Outfit, orange #F97316, dark #1a1a2e) | ✅ | CSS `:1-23` všech šablon — identický základ |
| AC3 | Print-ready (`-webkit-print-color-adjust: exact`, `@page`) | ✅ | cenik-sluzeb:17, faktura:16-23 |
| AC4 | Faktura šablona je A4 portrait, ostatní landscape | ✅ | faktura:`@page { size: A4 portrait }` + `.invoice-page {width:210mm;height:297mm}` ✅; ostatní `A4 landscape`, `.slide {width:297mm;height:210mm}` ✅ |
| AC5 | Landing page šablona obsahuje wireframe boxy s labels | ✅ | 15+ `.wireframe-box` + `.wireframe-label`, `.json-ld-marker`, `.mobile-mockup` přítomno |
| AC6 | Obchodní prezentace pokrývá všechny 4 produkty | ✅ | `grid-4` slide: Maklerska sit, Inzerce, Eshop autodily (Wolt model), Marketplace VIP |
| AC7 | Marketplace prezentace má ROI tabulku s příklady | ✅ | ROI tabulka s příklady dealů, 15-25% ROI, 40/40/20 split vizualizace |
| AC8 | Onboarding průvodce má 7 kroků nabírání + gamifikace | ✅ | "7 kroku" slide: VIN sken → Zakladni udaje → ... → BackOffice; Gamifikace: Novacek/Profesional/Expert/Sampion |
| AC9 | Ceník pokrývá všechny produkty a služby | ✅ | Maklerska sit (5%, min 25k), Inzerce (pricing cards), Eshop Wolt model, Marketplace VIP (40/40/20) |
| AC10 | `generate-pdf.mjs` aktualizován o všechny nové soubory | ✅ | Všech 6 přidáno; `generatePortraitPDF()` funkce přidána pro faktura |
| AC11 | Otevření v browseru zobrazuje správně | ℹ️ | Runtime-only — layout správný staticky, CSS slide-based |
| AC12 | PDF export zachová barvy | ✅ | `-webkit-print-color-adjust: exact` ve všech šablonách |

**Celkem: 11/12 ✅, 1 ℹ️ (runtime-only)**

---

## 3. DETAIL OVĚŘENÍ

### 3.1 faktura-sablona.html — A4 portrait, 1 stránka

- `@page { size: A4 portrait; margin: 0; }` ✅ — STOP-3 OK
- `.invoice-page` (ne `.slide`) — bezkonfliktní s landscape CSS ✅
- Sekce: header + FAKTURA č. FV2026001, dodavatel/odběratel, tabulka položek, DPH součty, platební údaje, QR placeholder, footer ✅
- `[DOPLNIT]` placeholdery pro IČO/DIČ/banka/číslo účtu ✅
- Reálná čísla: CEBIA 499 Kč, TOP inzerát 199 Kč (konzistentní s CLAUDE.md) ✅

### 3.2 landing-page-sablona.html — wireframe

- Speciální CSS: `.wireframe-box`, `.wireframe-label`, `.json-ld-marker` (blue #3b82f6), `.mobile-mockup` ✅
- JSON-LD markers: Organization, BreadcrumbList, ItemList, FAQPage, LocalBusiness, Product, AggregateOffer, CollectionPage, GeoCoordinates ✅
- 4 varianty LP: Značková (Škoda), Modelová (Octavia), Cenová (do 200k), Lokální (Praha) ✅

### 3.3 marketplace-investori.html — investiční model

- 40% investor / 40% dealer / 20% CarMakler — progress bar vizualizace ✅
- ROI: 15-25% průměrný ROI, tabulka příkladů dealů s ROI sloupcem ✅
- 4 kroky procesu + risk management sekce ✅

### 3.4 onboarding-makler.html — průvodce makléřem

- 5 kroků k aktivaci (profil, dokumenty, smlouva, kvíz, aktivace) ✅
- 7 kroků nabírání auta (VIN → Základní údaje → Výbava → Stav → Fotky → Smlouva → Odeslání → BackOffice) ✅
- Quick Mode — 3 kroky ✅
- Gamifikace: 4 levely (Novacek 0-5, Profesional 6-20, Expert 21-50, Sampion 51+) + achievementy ✅

### 3.5 generate-pdf.mjs — aktualizace

- `generatePortraitPDF()` funkce přidána (210mm × 297mm) ✅
- Všech 5 landscape voláno přes `generatePDF()` ✅
- `faktura-sablona.html` volána přes `generatePortraitPDF()` ✅
- Existující soubory zachovány (autobazary, vrakoviste) ✅

---

## 4. SIMPLIFY KONTROLA

- Všech 6 šablon je self-contained HTML (Option A z plánu §1) — správně, bez závislosti na externím CSS ✅
- CSS základ je 1:1 kopie z `carmakler-pro-autobazary.html` — konzistentní, žádné inventované odchylky ✅
- Texty bez diakritiky — konzistentní s existujícím patternem (plan §6: vědomé rozhodnutí) ✅
- Logo cesty: `../../public/brand/logo-color.png` — relativní, soubory existují ✅

---

## 5. OBSERVATIONS

### OBS-1 — `onboarding-makler.html` má 9 slidů (plan říkal 8-9) ✅

Plán §2.4 definoval "8-9 slidů". Implementace má 9. V normě.

### OBS-2 — `generate-pdf.mjs` otevírá nový browser pro každý PDF

Každé volání `generatePDF` / `generatePortraitPDF` spouští nový Chromium proces. Pre-existing pattern z existujícího kódu — vědomé MVP rozhodnutí. Pro 8 souborů akceptovatelné. Non-blocker.

---

## 6. SOUHRN

| Kategorie | Výsledek |
|---|---|
| AC splněno | 11/12 ✅ (1 ℹ️ runtime-only) |
| Blokerů | 0 |
| Bugs | 0 |
| Nové soubory | 6/6 ✅ |
| generate-pdf.mjs | ✅ aktualizován |
| Logo soubory (STOP-1) | ✅ existují |
| Faktura portrait (STOP-3) | ✅ bez konfliktu |

---

## 7. AKCE

Žádné povinné akce. Implementace odpovídá zadání a plánu.
