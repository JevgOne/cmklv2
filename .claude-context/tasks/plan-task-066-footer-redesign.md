# TASK-066 — Footer Redesign (vizualni pouze)

**Status:** PLANNED
**Soubory k editaci:** `components/common/FooterBase.tsx`, `components/ui/PlatformSwitcher.tsx` (footer variant)
**Typ:** CSS/layout only, zero new functionality

---

## Analyza soucasneho stavu

Footer (`FooterBase.tsx`) je sdileny pro 4 platformy. Pouziva `bg-gray-950 text-white`.
Aktualni problemy:
1. Social ikony prilis male (`w-5 h-5`) a bez vizualniho duvodu
2. Platformy sekce je oddelena od hlavniho gridu — osamela, nevyrazna
3. Zadny oranovy accent — footer se vizualne nelisi
4. Typografie uniformni — zadna hierarchie
5. Logo male, tagline nevyrazny
6. Bottom bar vizualne slivy s hlavnim obsahem

---

## Plan zmen

### 1. Oranovy accent pruh nahore (top border)
**Kde:** `<footer>` element
**Zmena:**
```
// PRED
<footer className="bg-gray-950 text-white">

// PO
<footer className="bg-gray-950 text-white border-t-4 border-orange-500">
```
Efekt: Jasna vizualni demarkace footer vs obsah.

### 2. Vetsi logo + stylizovany tagline
**Kde:** Sloupec 1
**Zmeny:**
- Logo: `h-10` -> `h-12` (vetsi)
- Tagline: `text-sm text-gray-500` -> `text-sm text-gray-400 leading-relaxed` (svetlejsi)
- Pridani `mb-8` na logo wrapper pro vetsi mezeru

### 3. Vetsi social ikony + hover kruhy
**Kde:** Social sekce ve Sloupci 1
**Zmeny:**
```
// PRED
<div className="flex items-center gap-3">
  ... <FacebookIcon className="w-5 h-5" />

// PO
<div className="flex items-center gap-4">
  ... className="text-gray-400 hover:text-orange-400 hover:bg-orange-400/10
       rounded-full p-2 transition-all duration-200"
  ... <FacebookIcon className="w-6 h-6" />
```
Efekt: Ikony 20% vetsi, hover stav ma jemne oranove pozadi (kruhy).

### 4. Platformy integrovany do hlavniho gridu
**Kde:** Sekce "PLATFORM SWITCHER" pod gridem
**Zmena:** Misto oddelene sekce pod gridem → presunut do 5. sloupce v gridu, nebo na mobilu pod sloupci ale vizualne vyraznejsi.
```
// PRED: grid-cols-4, pak oddelena sekce
// PO Varianta A: Platformy jako BADGE STRIP
//   - Horizontalni flex s badge-style linky (bg-gray-800/50 rounded-lg px-4 py-2)
//   - Zobrazit inline v platformy sekci misto ul-listu
```
**Konkretni implementace:**
- Ponechat pod gridem (nezasahovat do 4-col layoutu)
- Zmenit `PlatformSwitcher` footer variant: z plain `<ul>` na horizontalni flex badges
- Badges: `inline-flex items-center gap-2 bg-gray-800/50 rounded-lg px-4 py-2.5 text-sm`
- Current badge: `bg-orange-500/15 text-orange-400 border border-orange-500/30`
- Other badges: `text-gray-400 hover:text-white hover:bg-gray-800`

### 5. Sloupkove nadpisy - silnejsi vizualni hierarchie
**Kde:** `<h3>` elementy ve sloupcich 2, 3, 4
**Zmena:**
```
// PRED
<h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">

// PO
<h3 className="text-xs font-bold uppercase tracking-widest text-orange-400/80 mb-5">
```
Efekt: Oranove nadpisy vytvari vizualni propojeni s brandem.

### 6. Bottom bar - vizualni oddeleni
**Kde:** Bottom bar sekce
**Zmeny:**
- Oddelovat `border-white/10` -> `border-gray-700/50` (viditelnejsi carka)
- Copyright text: pridat `text-gray-600` (tmavsi, ustoupi)
- Legal nav linky: `hover:text-orange-400` misto `hover:text-white`

### 7. Celkove spacing
**Kde:** Hlavni container
**Zmeny:**
- `py-12 lg:py-16` -> `py-14 lg:py-20` (vice prostoru)
- Grid gap: `gap-8 lg:gap-10` -> `gap-10 lg:gap-12`
- Platformy sekce: `mt-10 pt-6` -> `mt-12 pt-8`

---

## Sketch noveho layoutu

```
+=====================================================+
|  ████ ORANGE TOP BORDER (4px) ████████████████████  |
|                                                     |
|  [LOGO h-12]  SLUZBY         PODPORA       FIRMA   |
|  [badge?]     (orange h3)    (orange h3)   (orang)  |
|               Nabidka        Telefon       Legal     |
|  Tagline      Prodat         Email         ICO/DIC   |
|  (gray-400)   Jak to fun...  Hodiny        Adresa   |
|               Stan se...     FAQ           O nas    |
|  ( FB  IG  YT )              Kontakt f.    Kariera  |
|  (w-6, rounded hover)        Reklamacni r            |
|                                                     |
|  ─────────────────────────────────────────────────  |
|  PLATFORMY CARMAKLER                                |
|  [ CarMakler ]  [ Inzerce ]  [ Shop ]               |
|   ^badge active  ^badge       ^badge                |
|                                                     |
|  ─────────────────────────────────────────────────  |
|  (c) 2026 ... ICO ... DIC       OchOÚ  OP  Cookies |
+=====================================================+
```

---

## FLAG: Newsletter signup

Uzivatel na landing pages rikal "nemen nic". Footer je ale jiny kontext (persistent UI element, ne landing page). Newsletter input by vizualne footer obohatil. **Doporucuji neimplementovat v teto fazi** — je to nova funkcionalita, ne vizualni zmena. Oznacuji jako potencialni follow-up task.

---

## Akceptacni kriteria

1. **AC-1:** Footer ma viditelny oranovy accent (border-t-4 orange) — vizualne odliseny od obsahu
2. **AC-2:** Social ikony jsou vetsi (w-6 h-6), maji hover efekt s background kruhem
3. **AC-3:** Platformy sekce zobrazena jako horizontalni badges (ne plain text list)
4. **AC-4:** Sloupkove nadpisy pouzivaji oranovy odsten (orange-400/80) pro vizualni hierarchii
5. **AC-5:** Celkove spacing zvetseno (py-14/py-20 hlavni padding, gap-10/gap-12 grid)

---

## STOP prahy

- **STOP-1:** Zmena struktury FooterBase props (interface) → eskalace (meni API pro 4 platform wrappery)
- **STOP-2:** Pridani noveho obsahu (newsletter, novy sloupec) → eskalace (zadani rika "jen vizualni")
- **STOP-3:** Zmena PlatformSwitcher pro non-footer varianty → eskalace (muze ovlivnit navbar)

---

## Rozsah prace

- **Soubory:** 2 (FooterBase.tsx, PlatformSwitcher.tsx)
- **Typ zmen:** Tailwind classes only
- **Odhadovany cas:** 15-20 min implementace
- **Riziko:** Nizke (CSS only, zadna logika)
