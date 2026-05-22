# Chrome Test Report: TASK-042 — 8 CarMakler PDF prezentací
**Datum:** 2026-04-16  
**Tester:** TEST-CHROME  
**Commit:** 0d27c7b  
**Verdict: ❌ TEST FAILED**

---

## 1. Fyzická existence souborů ✅

Všechny 8 PDF souborů existují na `~/Desktop/`:

| Soubor | Velikost | Stránky |
|--------|----------|---------|
| CarMakler-pro-autobazary.pdf | 848K | 8 |
| CarMakler-pro-vrakoviste.pdf | 864K | 8 |
| CarMakler-cenik-sluzeb.pdf | 750K | 6 |
| CarMakler-landing-page-sablona.pdf | 747K | 5 |
| CarMakler-obchodni-prezentace.pdf | 815K | 9 |
| CarMakler-onboarding-makler.pdf | 856K | 9 |
| CarMakler-marketplace-investori.pdf | 694K | 8 |
| CarMakler-faktura-sablona.pdf | 304K | 1 |
| **CELKEM** | **~5.74 MB** | **54** |

✅ Celkový počet stran: **54** (shoduje s impl reportem)  
✅ Celková velikost: **~5.74 MB** (shoduje s impl reportem)  
✅ Všechny PDF mají platný header `%PDF-` (soubory nejsou corrupted)  
✅ 0 warnings při generování (dle impl reportu)

---

## 2. Technická validita ✅

| Check | Výsledek |
|-------|----------|
| PDF header (`%PDF-`) | ✅ VŠECHNY platné |
| 7× landscape A4 (842×596 pts = 297×210mm) | ✅ |
| 1× portrait A4 (faktura-sablona) | ✅ |
| Soubory otevřeny v Preview viditelně | ✅ |

---

## 3. Design a branding ✅

| Check | Výsledek |
|-------|----------|
| Orange branding `#F97316` | ✅ přítomno 22–38× v každém HTML |
| Font Outfit | ✅ importován ve všech souborech |
| CarMakler logo/brand | ✅ přítomno ve všech souborech |
| Dark navy `#1a1a2e` jako sekundární barva | ✅ |

---

## 4. Klíčová obchodní čísla ✅/⚠️

| Check | Výsledek |
|-------|----------|
| Provize 5%, min 25 000 | ✅ přítomno v obchodni-prezentace |
| 40/40/20 split (marketplace) | ✅ přítomno v marketplace-investori |
| ROI komunikace | ✅ přítomno (3× v marketplace-investori) |
| Měna "Kč" | ⚠️ psáno jako "Kc" (chybí háček) |

---

## 5. ❌ KRITICKÝ BUG: Chybí česká diakritika

**ZÁVAŽNOST: Vysoká** — Prezentace jsou pro zákazníky/investory, bez diakritiky působí neprofesionálně.

### Nalezené příklady chybějící diakritiky:

| V PDF/HTML | Správně má být |
|-----------|----------------|
| `Obchodni prezentace` | `Obchodní prezentace` |
| `Maklerska sit` | `Makléřská síť` |
| `bezpecnejsi, rychlejsi a transparentnejsi` | `bezpečnější, rychlejší a transparentnější` |
| `technologicka firma` | `technologická firma` |
| `Inzertni platforma` | `Inzertní platforma` |
| `Certifikovani makleri` | `Certifikovaní makléři` |
| `Zprostredkovani prodeje` | `Zprostředkování prodeje` |
| `Eshop dilu` | `Eshop dílů` |
| `Odberatel` | `Odběratel` |
| `Zaklad dane (21%)` | `Základ daně (21%)` |
| `Celkem k uhrade` | `Celkem k úhradě` |
| `Zprostredkovatelska provize` | `Zprostředkovatelská provize` |
| `Platebni udaje` | `Platební údaje` |
| `25 000 Kc` | `25 000 Kč` |
| `Faktura sablona` | `Faktura šablona` |

### Rozsah problému:
- Postihuje **VŠECHNY 8 HTML zdrojů** → tedy i všechny PDF
- Pouze 0–3 výskyty správné diakritiky na soubor (náhodné exceptions)
- Zbylý text systematicky postrádá háčky a čárky

### Pravděpodobná příčina:
HTML zdroje byly nejspíše generovány/psány bez správného UTF-8 nebo s ASCII-only texty. Problém je v **zdrojových HTML souborech**, ne v PDF generátoru.

---

## 6. Speciální checksty

### obchodni-prezentace.pdf
- ✅ Provize 5%, min 25 000 Kč přítomno
- ✅ Orange branding konzistentní (38 výskytů)
- ❌ Název souboru "Obchodni prezentace" bez diakritiky
- ❌ "Maklerska sit" místo "Makléřská síť"

### marketplace-investori.pdf  
- ✅ 40/40/20 split přítomno
- ✅ ROI komunikace přítomna (3× výskyt)
- ✅ Investor role popsána
- ❌ "VIP" klíčové slovo NENALEZENO (0 výskytů v HTML)
- ❌ Nedostatečný "VIP tone" — text bez diakritiky snižuje profesionalitu

---

## 7. Celkový verdikt

| Oblast | Výsledek |
|--------|---------|
| Fyzická existence (8/8) | ✅ |
| Validita PDF (0 corrupted) | ✅ |
| Celkový počet stran (54) | ✅ |
| Celková velikost (~5.74MB) | ✅ |
| Landscape A4 (7 souborů) | ✅ |
| Portrait A4 (faktura) | ✅ |
| Orange branding | ✅ |
| Outfit font | ✅ |
| Klíčová obchodní čísla | ✅ |
| **Česká diakritika** | **❌ KRITICKÝ BUG** |
| **VIP tone v marketplace** | **❌ CHYBÍ VIP keyword** |

**CELKOVÝ VÝSLEDEK: ❌ TEST FAILED**

### Nutné opravy před schválením:
1. **MUST FIX:** Opravit českou diakritiku ve VŠECH 8 HTML zdrojích (háčky, čárky, Kč)
2. **SHOULD FIX:** Přidat "VIP" tón/klíčové slovo do marketplace-investori HTML
3. Po opravě HTML: re-generovat všechny PDF
