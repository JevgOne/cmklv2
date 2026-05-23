# Evžen THE KING — Verdikt: Fáze 2, 3, 4, 5 Vehicle Onboarding

**Task:** #81 (kontrola)
**Datum:** 2026-05-23
**Verdikt:** ✅ SCHVÁLENO (s 1 přetrvávající poznámkou z Fáze 1)

---

## Zadání uživatele (doslovně)

> "Makléř zadá VIN vozidla. Pokud už vozidlo existuje v naší databázi, použijí se naše interní data. Pokud ne, systém načte dostupné informace přes Cebia. Aplikace následně zobrazí pouze doplňující informace, které chybí nebo je potřeba potvrdit/doplnit. Důležité je, aby makléř nevyplňoval zbytečně údaje, které už systém správně načetl. Formulář musí být dynamický, chytrý a přizpůsobený konkrétnímu vozidlu."

**Klíčové požadavky z plánu:** guided photo mode, quality scoring, composition overlays, consistency checks, template-based description, onboarding walkthrough.

**Commity:**
- `c55fed9` — Fáze 3 (Photo Standard)
- `9c304dc` — Fáze 2 + 4 + 5 (Smart Form, Quality Gate, UX Polish)

---

## FÁZE 2: Dynamic Smart Form ✅

### DetailsStep.tsx — dynamický formulář

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| 3 stavy polí: locked / prefilled / missing | ✅ | `DetailsStep.tsx:155-161` — `fieldState()` helper |
| Locked = high confidence → read-only s source badge | ✅ | `LockedField` komponenta (`:625-668`) — zelený check, zdroj, unlock tlačítko |
| Prefilled = medium confidence → editovatelné, vyžaduje potvrzení | ✅ | `PrefilledField` komponenta (`:670-703`) — modrý border, "Zkontrolujte" + "Potvrdit" |
| Missing = chybí → oranžový highlight, "Doplňte" | ✅ | `MissingField` komponenta (`:705+`) — oranžová dashed border |
| Batch confirm ("Potvrdit vše") | ✅ | `:307-316` — banner s počtem polí čekajících na potvrzení |
| Smart lookup data jako initial values | ✅ | `:127-149` — draft ?? smartValue ?? default |
| Source labels (Z naší DB, CEBIA, VIN dekodér, NHTSA) | ✅ | `:93-98` — `SOURCE_LABELS` |
| 16 polí pokryto (brand→ownerCount) | ✅ | `:319-609` |
| Unlock locked field pro editaci | ✅ | `LockedField.onUnlock` → odstraní z overrides |

**Odpovídá zadání "zobrazí pouze doplňující informace, které chybí nebo je potřeba potvrdit"?** ANO — pole z VIN dekoce jsou locked (zelené, read-only), chybějící mají oranžový highlight "Doplňte", medium confidence vyžaduje potvrzení.

**Odpovídá "aby makléř nevyplňoval zbytečně údaje"?** ANO — locked pole nelze editovat (jen přes unlock), prefilled pole mají hodnotu a jen čekají na potvrzení.

**Odpovídá "formulář musí být dynamický, chytrý a přizpůsobený"?** ANO — formulář se adaptuje podle výsledku smart lookup — jiná vizuální prezentace pro locked/prefilled/missing.

### InspectionStep.tsx — nová pole

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| Počet klíčů (1-4 toggle) | ✅ | `:383` — `update({ keyCount: count })` |
| Stav pneumatik detailně (typ, značka, hloubka dezénu, DOT, druhá sada) | ✅ | `:400-486` — `tiresData` objekt s type/brand/treadDepth/dotYear/secondSet |
| Lokální specifikace (CZ homologace, počet registrací v ČR) | ✅ | `:505-513` — `localSpecs.czHomologation`, `registrationCountCZ` |

### PricingStep.tsx — template-based popis

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| Template sekce (TECHNICKÉ PARAMETRY, STAV VOZIDLA, VÝBAVA) | ✅ | `description-template.ts:67-120` — auto-generated z dat |
| AI generuje POUZE intro + outro | ✅ | `description-template.ts:1-4` — komentář + architektura |
| Sekce auto-filled z draft dat (non-editable) | ✅ | `TemplateSection.editable: false` pro tech/state/equipment |
| Popis přesunut z DetailsStep do PricingStep | ✅ | DetailsStep nemá textarea na popis |
| Label mapy s českou diakritikou | ✅ | `description-template.ts:10-37` — benzín, diesel, manuální, přední... |
| formatMileage cs-CZ, formatPower kW (k), formatCapacity l | ✅ | `:44-55` |

### generate-description API

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| Endpoint upraven pro template mode | ✅ | `route.ts` — `+14/-1` changes |

---

## FÁZE 3: Photo Standard & Quality ✅

### PhotosStep.tsx — guided mode

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| GUIDED_ORDER — 23 slotů (13 ext + 4 int + 1 eng + 2 doc + 3 evi) | ✅ | `:91-104` — evidence na konci |
| Guided / Free mode toggle | ✅ | `:130` — `photoMode: "guided" \| "free"` |
| Auto-advance po capture v guided mode | ✅ | `:243-257` — `findNextUnshot()` → `setActiveGuide(next)` |
| Evidence fotky vynuceny na konci guided flow | ✅ | `:91-104` — evidence je poslední v GUIDED_ORDER |
| 5 kategorií (Exteriér 13, Interiér 4, Motor 1, Důkazní 3, Doklady 2) | ✅ | `:31-85` — `PHOTO_CATEGORIES` |
| Slot tipy s konkrétními pokyny | ✅ | Každý slot má `tip` s detailním popisem |
| Min 13 regular + 3 evidence | ✅ | `:87-88` — `MIN_REGULAR_PHOTOS = 13`, `EVIDENCE_REQUIRED = 3` |
| Slot migration pro starší drafty | ✅ | `:133-136` — `SLOT_MIGRATION` |

### PhotoGuide.tsx — composition overlays

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| 4 typy overlayů (thirds, circle, frame, horizontal) | ✅ | `:24-29` — `getOverlayType()` |
| Exteriér = rule of thirds grid | ✅ | `:59-67` — 2 vodorovné + 2 svislé čáry |
| Detail (světla, kola, badge) = circle | ✅ | `:34-39` — kruhový dashed overlay |
| Evidence + docs = frame | ✅ | `:42-47` — obdélníkový dashed overlay |
| Interiér = horizontal guides | ✅ | `:50-56` — 2 vodorovné čáry |

### image-quality.ts — kvalitní kontroly

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| Blur detection (Laplacian variance) | ✅ | `:64-82` — `laplacianVariance()`, `BLUR_THRESHOLD = 100` |
| Brightness check (dark / overexposed) | ✅ | `:16-17` — `DARK_THRESHOLD = 50`, `BRIGHT_THRESHOLD = 220` |
| Orientation check (landscape vs portrait per slot) | ✅ | `:20-37` — `LANDSCAPE_SLOTS`, `PORTRAIT_SLOTS` |
| Performant (downscale to 160px) | ✅ | `:18` — `ANALYSIS_SIZE = 160` |
| QualityHint type s user-friendly messages | ✅ | `:6-9` — blur/dark/bright/orientation |
| Integrace v PhotoGuide | ✅ | `PhotoGuide.tsx:7` — `import { checkImageQuality }` |

---

## FÁZE 4: Quality Gate & Completeness ✅

### listing-quality.ts — scoring 0-100

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| 4 kategorie: Fotky (35), Data (30), Popis (20), Výbava (15) | ✅ | `:21-25` — `ScoreBreakdown` |
| Minimum 60 bodů pro odeslání | ✅ | `:42,66` — `MIN_SCORE = 60`, `canSubmit: total >= MIN_SCORE` |
| Fotky scoring: 13+=20, 20+=25, 25+=30, evidence=5, main=5 | ✅ | `:82-97` |
| Data scoring: basic 6 polí=15, extended 5 polí=10, inspection=5 | ✅ | `:104-133` |
| Description scoring: length>100=10, highlights>=3=5, AI=5 | ✅ | `:140-176` |
| Equipment scoring: 5+=5, 15+=10, 25+=15 | ✅ | `:182-195` |
| 7 consistency checks s penalty | ✅ | `:201-290` |
| Check: paint damage but no defect photos | ✅ | `:209-218` |
| Check: high mileage but excellent condition | ✅ | `:223-231` |
| Check: old car but single owner | ✅ | `:234-242` |
| Check: premium lights but damaged in inspection | ✅ | `:245-253` |
| Check: EV but no charging cable | ✅ | `:256-264` |
| Check: dents/scratches but excellent | ✅ | `:267-276` |
| Check: no test drive | ✅ | `:279-287` |
| Recommendations s body a link na krok | ✅ | `:296-370+` |

### ReviewStep.tsx — quality display

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| Quality circle (velké číslo 0-100) | ✅ | `:483` — `QualityCircle` komponenta |
| 4 breakdown bars (Fotky/Data/Popis/Výbava) | ✅ | `:485-488` — `BreakdownBar` s barvami |
| Minimum warning (červený box, "60 bodů") | ✅ | `:492-498` |
| Listing preview s foto carousel | ✅ | `:503-555` — `PhotoCarousel`, title, price, tech params, location |
| Consistency warnings (amber, clickable → krok) | ✅ | `:604-630` — `-N bodů` badge |
| Recommendations (blue, clickable → krok, `+Nb`) | ✅ | `:633-655` |
| Submit disabled pokud `!canSubmit` | ✅ | `:688` — `disabled={!qualityResult?.canSubmit}` |
| Highlights, description, equipment, contact preview | ✅ | `:557-601` |

---

## FÁZE 5: UX Polish ✅

### StepProgressBar.tsx — clickable steps

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| 4 stavy: pending, in-progress, complete, warning | ✅ | `:6` — `StepStatus` type |
| Clickable completed steps | ✅ | `:32-39` — `isClickable()` |
| Visual states: green (complete), orange (current), yellow (warning), gray (pending) | ✅ | `:68-75` |
| Checkmark icon pro complete | ✅ | `:80-83` |
| ! icon pro warning | ✅ | `:84` |
| Step labels pod dots | ✅ | `:109-133` |
| Time estimates pro nové makléře | ✅ | `:4,128-129` — `STEP_TIMES` |
| Connector lines (green/orange/gray) | ✅ | `:92-102` |
| aria-label pro accessibility | ✅ | `:78` |

### StepLayout.tsx — auto-save indicator + offline badge

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| `SaveStatus: "idle" \| "saving" \| "saved" \| "offline"` | ✅ | `useDraft.ts:25` |
| Saving: pulsing orange dot + "Ukládám..." | ✅ | `StepLayout.tsx:96-105` |
| Saved: green dot + "Uloženo" | ✅ | `:107-113` |
| Offline: red dot + "Offline" | ✅ | `:115-120` |
| Clickable step navigation (visited steps only) | ✅ | `:68-79` — `handleStepClick`, `highestVisited` guard |
| Time estimates pro první 3 auta | ✅ | `:61-65` — `onboarding_vehicle_count < 3` |
| OnboardingTour integration | ✅ | `:8` — import, rendered in layout |

### OnboardingTour.tsx — 4-slide walkthrough

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| 4 slidy (Vítejte, VIN, Prohlídka+fotky, Zkontrolujte+odešlete) | ✅ | `:14-60` |
| Slide 1: "Vítejte v nabírání vozidel!" | ✅ | `:23` |
| Slide 2: "Zadejte VIN kód" — "systém automaticky vyplní" | ✅ | `:34` |
| Slide 3: "Prohlídka a fotky" — "povedeme vás krok za krokem" | ✅ | `:46` |
| Slide 4: "Zkontrolujte a odešlete" — "přibližně 25 minut" | ✅ | `:57` |
| Gradient headers s ikonami | ✅ | `:97` |
| Dot indicators (active=wide orange) | ✅ | `:110-119` |
| "Přeskočit" + "Další" / "Začít" | ✅ | `:124-135` |
| localStorage persistence (`onboarding_completed`) | ✅ | `:5,69-72,84` |
| Fullscreen overlay (z-[100], backdrop-blur) | ✅ | `:94` |
| Česká diakritika | ✅ | Všechny texty s diakritikou |

---

## DIAKRITIKA ✅ (Fáze 2-5) / ⚠️ (Fáze 1 přetrvává)

**Fáze 2-5 soubory — VŠECHNY s českou diakritikou:**
- DetailsStep: "Značka", "Převodovka", "Výkon", "Karoserie", "Počet dveří" ✅
- InspectionStep: "Výborný", "Špatný stav pneumatik", "Hloubka dezénu" ✅
- PricingStep: přes description-template.ts — "benzín", "manuální", "přední" ✅
- ReviewStep: "Nájezd", "Převodovka", "Upozornění na nesrovnalosti" ✅
- StepProgressBar: "Prohlídka", "Výbava", "Cena & popis", "Shrnutí" ✅
- StepLayout: "Ukládám...", "Uloženo", "Pokračovat" ✅
- OnboardingTour: "Vítejte", "Prohlídka", "Zkontrolujte" ✅
- listing-quality.ts: "základ", "rozšířené", "bez inspekce", "kompletní" ✅

**VinStep.tsx (Fáze 1) — přetrvávající BLOCKER z `review-phase1-vin-pipeline.md`:**
~25 textů BEZ diakritiky (Nacitam, Znacka, Prevodovka atd.). Nebylo opraveno v commitu `9c304dc`. Toto je stále BLOCKER před deployem.

---

## KONZISTENCE MEZI FÁZEMI ✅

| Kontrola | Status |
|----------|--------|
| Smart lookup z VinStep → DetailsStep (přes draft.vin.smartLookupResult) | ✅ |
| Details → PricingStep template (přes draft.details) | ✅ |
| Inspection tires → description-template (pneumatiky, klíče) | ✅ |
| Photos → ReviewStep carousel (přes draft.photos.photos) | ✅ |
| All steps → listing-quality.ts scoring | ✅ |
| Quality gate → submit disabled | ✅ |
| Step numbering konzistentní (1-8) | ✅ |
| STEP_ROUTES matches step layout | ✅ |

---

## ŽÁDNÉ ZKRATKY V UI ✅

- "Odeslat ke schválení" — plný text
- "Uložit k odeslání (offline)" — plný text
- "Kontrola kompletnosti" → nahrazeno quality score systém
- "Upozornění na nesrovnalosti" — plný text
- "Jak získat více bodů" — plný text
- "Vítejte v nabírání vozidel!" — plná věta
- "Provedeme vás celým procesem krok za krokem" — plná věta
- "Zkontrolujte a odešlete" — plný text

---

## ŽÁDNÉ STUB FUNKCE ✅

| Soubor | Kontrola |
|--------|----------|
| listing-quality.ts | 445 řádků, 7 scoring funkcí, 7 consistency checks — plné implementace |
| description-template.ts | 238 řádků, 6 section builders, label maps — plné implementace |
| image-quality.ts | 154 řádků, Laplacian blur, brightness, orientation — plné implementace |
| OnboardingTour.tsx | 141 řádků, 4 slidy, localStorage — plná implementace |

---

## ZÁVĚR

Fáze 2-5 kompletně odpovídají zadání uživatele:

**Fáze 2 — Dynamic Smart Form:**
- Formulář JE dynamický — 3 stavy (locked/prefilled/missing)
- Makléř NEMUSÍ vyplňovat zbytečně — locked pole z VIN jsou read-only
- Medium confidence pole vyžadují jen potvrzení (ne přepisování)
- Batch confirm pro rychlý workflow
- Nová pole (klíče, pneumatiky, lokální spec) v InspectionStep
- Popis přesunut do PricingStep s template systémem

**Fáze 3 — Photo Standard:**
- 23 guided slotů s auto-advance
- 4 typy composition overlays
- Client-side quality checks (blur, brightness, orientation)
- Evidence vynuceny na konci flow

**Fáze 4 — Quality Gate:**
- Scoring 0-100 ve 4 kategoriích
- 7 consistency checks s body penaltou
- Min 60 pro submit
- Recommendations s linky na konkrétní kroky

**Fáze 5 — UX Polish:**
- Clickable step progress (4 vizuální stavy)
- Auto-save indicator (saving/saved/offline)
- 4-slide onboarding walkthrough
- Time estimates pro nové makléře

**Česká diakritika:** ✅ ve VŠECH souborech Fáze 2-5. VinStep.tsx (Fáze 1) stále chybí — přetrvávající BLOCKER.

**Commit `c55fed9`:** 4 soubory, +414/-10
**Commit `9c304dc`:** 12 souborů, +2467/-815

Fáze 2-5 jsou ready. Po opravě diakritiky ve VinStep.tsx je celý onboarding ready k deployi.
