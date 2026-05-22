# Evžen report — TASK-042 PDF prezentace (commit `0d27c7b`)

**Datum:** 2026-04-16
**Kontrolor:** Evžen the King
**Task ID:** #4
**Artefakty:**
- Commit `0d27c7b` — chore: mark TASK-020 and TASK-042 as done + generate presentation PDFs
- Impl report: `.claude-context/tasks/impl-generate-pdfs-20260416.md`
- 8 HTML šablon v `docs/presentations/`
- 8 PDF v `~/Desktop/CarMakler-*.pdf` (mimo repo)

---

## VERDIKT: ❌ ZAMÍTNUTO — s výhradami

**Důvody (seřazeno dle priority):**
1. TASK-019 anomálie — uncommited mutace TASK-QUEUE.md bez autorství ani schválení (Rule 4, Rule 6).
2. Rule 1 porušení — zkratky v UI (FO/PO/OP/OR/MS) v `marketplace-investori.html` a `faktura-sablona.html`.
3. Nekonzistentní název firmy ve `faktura-sablona.html` ("CarMakler s.r.o." vs "CAR makler, s.r.o.").
4. Nereflektovaná nesrovnalost v zadání — 4 "existující" šablony uváděné v TASK-042 neexistují v repu; implementator tento fakt neflagl.
5. Plošné stripování diakritiky napříč všemi 8 šablonami (zejména ruší bod 5 Očekávaného výsledku: "profesionální obchodní materiály").

**Co je v pořádku:** 6 nových HTML šablon dle bodu 1 Očekávaného výsledku je skutečně vytvořeno. Žádné delete v commitu. Script `generate-pdf.mjs` proběhl čistě, PDF vygenerovány.

---

## §1 — Shoda s TASK-042 (ř. 6205-6293)

### §1.1 Nové šablony (Očekávaný výsledek bod 1: "6 nových HTML šablon")

| # | Požadavek (zadání) | Soubor v repu | Stav |
|---|---|---|---|
| 1 | Landing page šablona (wireframe) | `docs/presentations/landing-page-sablona.html` (494 ř.) | ✅ vytvořeno |
| 2 | Obchodní prezentace pro klienty | `docs/presentations/obchodni-prezentace.html` (663 ř.) | ✅ vytvořeno |
| 3 | Prezentace pro investory (Marketplace) | `docs/presentations/marketplace-investori.html` (608 ř.) | ✅ vytvořeno |
| 4 | Onboarding makléře | `docs/presentations/onboarding-makler.html` (668 ř.) | ✅ vytvořeno |
| 5 | Ceník služeb | `docs/presentations/cenik-sluzeb.html` (521 ř.) | ✅ vytvořeno |
| 6 | Šablona faktury (A4 portrait) | `docs/presentations/faktura-sablona.html` (354 ř.) | ✅ vytvořeno |

→ **Deliverable #1 splněn.**

### §1.2 "Existující šablony" dle TASK-042 (ř. 6214-6221) — diskrepance

Zadání cituje:
> Existující šablony v `docs/presentations/`:
> - carmakler-pro-autobazary.html
> - carmakler-pro-vrakoviste.html
> - **kroky-prodeje-v2.html**
> - **skoleni-makleru.html**
> - **uvodni-strana.html**
> - **zprostredkovatelska-smlouva.html**
> - generate-pdf.mjs

**Fakt:** `git log --all --diff-filter=A -- 'docs/presentations/...'` pro ty 4 tučné soubory → **0 výskytů** v historii. Nikdy v repu nebyly.

**Pravděpodobné vysvětlení:** zadání bylo napsáno s ohledem na jiný project path (`Projekt: /Users/lunagroup/carmakler` — řádek 6208), který není aktuální working directory.

**Proč je to problém (Rule 4, Rule 6):**
- Implementator měl tuto diskrepanci explicitně označit v impl reportu. Neudělal to.
- `generate-pdf.mjs` generuje 8 PDF (2 staré + 6 nových) — což sedí na `Očekávaný výsledek`, ale 4 šablony, které user očekával jako "existující", chybí.
- Dokud user neschválí, že ty 4 jsou out-of-scope, nelze mít 100% jistotu, že TASK-042 je hotový.

### §1.3 Print-ready / PDF generace (body 2-3 Očekávaného výsledku)

Impl report §3 potvrzuje clean Playwright run, všech 8 PDF existuje v `~/Desktop/`. Ověřeno přes commit message a script.

→ Deliverable splněn, ale viz §2.2 diskrepance.

### §1.4 Landing page šablona — požadavek na obsah (ř. 6236-6241)

Zadání požaduje:
- Vizuální wireframe s hero, rychlá fakta, srovnávací tabulka, FAQ, CTA, breadcrumbs, JSON-LD pozice
- Příklady: **značková LP (Škoda), modelová LP (Octavia), cenová LP (do 200 000 Kč), lokální LP (Praha), mobilní + desktopová verze**

**Vzorek (landing-page-sablona.html ř. 201-246):**
- Obsahuje wireframe-box pro Hero, Breadcrumbs, Katalog vozidel, FAQ, CTA ✅
- Obsahuje Skoda, Octavia, Fabia ✅
- Slide 2 je "Znackova LP — Skoda" ✅

Nedoověřeno (Evžen pouze read-only): zda jsou přítomny cenová LP (do 200k Kč), lokální LP (Praha) a mobilní verze. Lze ověřit při manuální kontrole PDF nebo grep dalších slidů. Necítím se kompetentní toto ZAMÍTNOUT bez důkazu, jen zmiňuji jako "částečně ověřeno".

---

## §2 — 6 doslovných pravidel Evžena

### Rule 1: Žádné zkratky v UI ❌ PORUŠENO

**Nálezy (marketplace-investori.html):**
- ř. 533: `<h3>Fyzicka osoba (FO)</h3>` → zkratka "FO"
- ř. 542: `<h3>Pravnicka osoba (PO)</h3>` → zkratka "PO"
- ř. 544: `<li>Firma zapsana v OR</li>` → zkratka "OR" (Obchodní rejstřík) bez expanze
- ř. 564: `<p>Nahrajte OP (FO) nebo vypis z OR (PO)...</p>` → zkratky "OP", "FO", "OR", "PO"

**Nálezy (faktura-sablona.html):**
- ř. 349: `<span>CAR makler, s.r.o.</span> · ICO: 21957151 · Zapsana v OR u MS v Praze, oddil C, vlozka 408076` → zkratky "OR" (Obchodní rejstřík) a "MS" (Městský soud)

**Proč to je porušení:** Rule 1 říká doslova "Vždy celý název (např. 'Backoffice administrátor' ne 'BO admin')". FO/PO/OP/OR/MS jsou standardní české právní zkratky, ale zadání zkratek je striktní.

**Akceptovatelné řešení:** expandovat na první výskyt a pak používat plnou formu, NEBO plnou formu vždy.

### Rule 2: Nic se neschovává, nedokončené funkce se OZNAČUJÍ ⚠️ HRANIČNÍ

**Nález (faktura-sablona.html ř. 342-344):**
```html
<div class="qr-placeholder">
  QR platba<br>(vygenerovat)
</div>
```
- Je to placeholder (CSS class `.qr-placeholder` + viditelný text "QR platba (vygenerovat)")
- **Tohle je v pořádku** — funkce je explicitně označena jako "(vygenerovat)", uživatel ví, že je to hotspot pro budoucí QR. Neschovává se.

→ Rule 2 splněn.

### Rule 3: Nic smazáno bez schválení ✅ OK

`git show 0d27c7b --stat` → 2 soubory changed: 1 modify (`TASK-QUEUE.md`), 1 new (`.claude-context/tasks/impl-generate-pdfs-20260416.md`). Žádné D (delete). Žádné unexpected renames.

→ Rule 3 splněn.

### Rule 4: Nic se nemění bez explicitního schválení uživatele ❌ PORUŠENO (TASK-019 anomálie)

Viz §3 níže — uncommitted change na TASK-019 status bez autorství a schválení.

### Rule 5: Skryté stránky N/A

Nerelevantní pro tento task (PDF šablony, nikoli navigace).

### Rule 6: Každá změna schvalována jednotlivě ❌ PORUŠENO (viz §3)

TASK-QUEUE.md má 3 status mutace (TASK-019, TASK-020, TASK-042), ale commit `0d27c7b` obsahuje pouze 2 (TASK-020, TASK-042). Třetí mutace (TASK-019) leží jako uncommitted unstaged change bez původu. To porušuje princip "každá změna = explicitní souhlas".

---

## §3 — TASK-019 anomálie (speciální požadavek lead)

### Fakta
```
$ git diff HEAD TASK-QUEUE.md
@@ -1671,7 +1671,7 @@ model AiConversation {
 ## TASK-019: Inzertní platforma — kompletní digitální inzerce vozidel
 Priorita: 2
-Stav: zpracovává se
+Stav: hotovo
 Projekt: /Users/lunagroup/carmakler
```

### Analýza

**Je TASK-019 hotový dle git evidence?**

`git log --oneline -- TASK-QUEUE.md` ukazuje historické commity:
- `2566785 feat: TASK-019 Listing platform — digital vehicle classifieds`
- `ea02ccc feat: TASK-019v2 + QA fixes — extended listing platform + functional audit`

→ **Ano, implementace TASK-019 v kódu existuje** (2 commity dedikované TASK-019).

**Tak co je špatně?**
1. TASK-QUEUE.md v commitu `ecd3bc9` (HEAD^) má TASK-019 jako `zpracovává se` — tj. status nebyl aktualizován, když se feature commit­oval.
2. Unstaged change `zpracovává se` → `hotovo` **existuje v working tree, ale není v žádném commitu**. Autorství = neznámé. Kontext = neznámý.
3. Implementator (commit `0d27c7b`) tento change **viděl** (impl report §5 obsahuje pouze TASK-020 a TASK-042), ale **neadresoval ho** — nevrátil ho, neflagl ho, nevysvětlil.

### Vyhodnocení vs. Rule 4 & Rule 6

- **Rule 4:** "Nic se nemění bez explicitního schválení uživatele" — user status TASK-019 explicitně neschválil.
- **Rule 6:** "Každá změna schvalována jednotlivě" — pokud je TASK-019 opravdu hotový, zaslouží si vlastní commit s evidencí (který QA proběhl, který datum, kdo). Nesmí být skrytě přilepen k jinému commitu ani ležet jako unstaged dirty change.

### Doporučení lead
1. **Nepushovat ani necommitovat** tuto unstaged mutaci dokud user/lead neřekne: "ano, TASK-019 je hotový, aktualizuj status."
2. Pokud ano → vlastní commit `chore: mark TASK-019 as done` s referencí na `2566785` a `ea02ccc` + QA evidence.
3. Pokud ne → `git checkout TASK-QUEUE.md` (pouze ř. 1674) a nechat status `zpracovává se`.

---

## §4 — Další nálezy (mimo 6 rules, ale worth flagging)

### §4.1 Stripování diakritiky ve VŠECH 8 PDF ⚠️

Napříč šablonami (spot-check):
- `marketplace-investori.html`: "Fyzicka osoba", "Pravnicka osoba", "Verifikace", "predstaveni" → bez háčků a čárek
- `faktura-sablona.html`: "Skolska", "Praha", "Zaklad dane", "Celkem k uhrade" → bez háčků a čárek
- `obchodni-prezentace.html`: "Prohlizejte nabidku overených vozidel v nasem katalogu. Kazde auto ma kompletni historii" → inkonzistentní (jedno slovo "overených" s čárkou, okolní text bez)

**Proč to vadí:**
- `<html lang="cs">` deklaruje český jazyk
- Očekávaný výsledek bod 5: "Profesionální obchodní materiály připravené pro klienty, investory a makléře"
- Český text bez diakritiky vypadá jako ASCII fallback z 90. let → nesplňuje "profesionální"

**Kořenová příčina:** pravděpodobně problém s encoding při psaní šablon (ne @page CSS), nebo si model strip­oval diakritiku, aby se vyhnul mojibake.

### §4.2 Nekonzistentní název firmy ve faktuře

- `faktura-sablona.html` ř. 252: `<div class="name">CarMakler s.r.o.</div>` (header)
- `faktura-sablona.html` ř. 349: `<span>CAR makler, s.r.o.</span>` (footer)

Jedna šablona, dva různé oficiální názvy. Dle MEMORY.md + CLAUDE.md je brand "Carmakler" / "CarMakler". "CAR makler" se v repu nikde jinde nevyskytuje jako korektní forma.

### §4.3 Impl report §6 "Žádné odchylky od plánu" — ale odchylky existují

Implementator napsal: "**Žádné podstatné. Generátor běžel ~90s namísto očekávaných 15 min.**"

To je nepravdivé/nepřesné — reálné odchylky, které měly být v §6:
1. 4 "existující" šablony v TASK-042 zadání neexistují v repu (flagnutí diskrepance mezi zadáním a fakty)
2. TASK-019 unstaged change nalezen, neřešen, jen zmíněn mimo hlavní flow

Implementator tyto věci mohl/měl escalate­ovat lead-ovi **před** commitem, nikoli tiše je ignorovat.

---

## §5 — Co musí být opraveno před SCHVÁLENÍM

1. **TASK-019 anomálie** — explicitní rozhodnutí leadu/usera: buď commit + evidence, nebo revert unstaged change. (priorita 1, Rule 4+6)
2. **Rule 1 zkratky** v `marketplace-investori.html` (ř. 533, 542, 544, 564) + `faktura-sablona.html` (ř. 349) — expanze nebo konzistentní plné názvy. (priorita 2, Rule 1)
3. **Inkonzistence brandu** `faktura-sablona.html` ř. 349 "CAR makler, s.r.o." → sjednotit na "CarMakler s.r.o." (priorita 2)
4. **Diakritika** napříč 8 šablonami — doplnit české háčky a čárky (priorita 3, nepřímá violace bodu 5 Očekávaného výsledku)
5. **Rozhodnutí o 4 "existujících" šablonách** (kroky-prodeje-v2, skoleni-makleru, uvodni-strana, zprostredkovatelska-smlouva) — user explicitně potvrdí: out-of-scope / vytvořit také / ignorovat zadání. (priorita 3)

---

## §6 — Shrnutí pro lead

**Hlavní scope TASK-042 (6 nových šablon + print-ready):** ✅ dodán.
**Compliance s Evženovými pravidly:** ❌ Rule 1 + Rule 4/6 porušeny (zkratky + TASK-019 anomálie).
**Commit `0d27c7b` samotný:** bezpečný, žádné delete, pouze 2 řádky v TASK-QUEUE.md + nový impl report.
**Uncommitted stav working tree:** obsahuje neodsouhlasenou mutaci TASK-019, která musí být vyřešena dříve, než se cokoli dalšího commit­uje.

**Doporučení:** ZAMÍTNOUT → vrátit implementatorovi k opravě bodů §5.1–§5.3 (Rule 1 + TASK-019 + branding). Body §5.4 (diakritika) a §5.5 (4 "existující" šablony) eskalovat userovi k rozhodnutí — mimo autoritu Evžena.
