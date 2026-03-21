# FRONTA ÚKOLŮ (TASK QUEUE)

> Úkoly se zpracovávají shora dolů podle priority.
> Stav: hotovo | zpracovává se | hotovo | chyba
> Nové úkoly přidávej na konec — lead je seřadí podle priority.
> REFERENČNÍ SOUBOR: `carmakler-design-system.html` v kořenu projektu obsahuje kompletní vizuální design systém se všemi komponentami.

---

## TASK-001: UI Component Library — základní sdílené komponenty
Priorita: 1
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Vytvoř kompletní knihovnu UI komponent v `components/ui/` podle design systému v souboru `carmakler-design-system.html`. Každá komponenta musí být React Server Component kde je to možné, nebo "use client" jen když je nutná interaktivita. Používej Tailwind CSS 4 třídy mapované na existující CSS variables v `globals.css`. Kde chybí proměnné, doplň je do `globals.css`.

**Komponenty k vytvoření:**

1. **Button** (`components/ui/Button.tsx`)
   - Varianty: `primary` (orange gradient), `secondary` (gray-900), `outline` (bílý s borderem), `ghost` (průhledný), `success` (zelený), `danger` (červený)
   - Velikosti: `sm` (8px 16px, 13px font), `default` (12px 24px, 15px font), `lg` (16px 32px, 17px font)
   - Icon button varianta: čtvercový 44x44px, border-radius-lg
   - Props: `variant`, `size`, `disabled`, `children`, `className`, `asChild` (pro link), `icon` (boolean)
   - Hover efekty: primary má translateY(-2px) + větší shadow, secondary translateY(-2px)
   - Disabled: opacity 0.5, cursor not-allowed, žádný transform
   - Všechny buttony mají `border-radius: 9999px` (full), font-weight 600, transition 0.2s
   - Primary button má `box-shadow: 0 20px 40px -10px rgba(249,115,22,0.35)`

2. **Badge** (`components/ui/Badge.tsx`)
   - Varianty: `verified` (zelené pozadí), `top` (orange gradient, bílý text), `live` (černé pozadí + pulzující červená tečka), `new` (modré), `pending` (žluté), `rejected` (červené), `default` (šedé)
   - Padding 6px 12px, border-radius 10px, font 12px weight 700
   - Live varianta má animovanou tečku (pulse-dot keyframe: 0%,100% opacity 1 scale 1; 50% opacity 0.5 scale 1.2)

3. **StatusPill** (`components/ui/StatusPill.tsx`)
   - Varianty: `active` (zelené), `pending` (žluté), `rejected` (červené), `draft` (šedé), `sold` (modré)
   - Každý má barevnou tečku (6x6px circle) + text
   - Border-radius full (pill shape), padding 6px 12px, font 12px weight 600

4. **TrustScore** (`components/ui/TrustScore.tsx`)
   - Props: `value` (číslo)
   - Bílé pozadí, padding 10px 14px, border-radius-xl, shadow-lg
   - Číslo: 24px font weight 800, orange gradient text (background-clip text)
   - Label: "Trust Score" 10px font weight 600, gray-500

5. **Input** (`components/ui/Input.tsx`)
   - Kompletní form input: padding 14px 18px, font 15px weight 500
   - Background gray-50, border 2px transparent, border-radius-lg
   - Hover: background gray-100
   - Focus: background white, border orange-500, box-shadow 0 0 0 4px orange-100
   - Error stav: border red-500
   - S labelem (13px, weight 600, uppercase, letter-spacing 0.5px, gray-700)
   - S error message (13px, red-500)

6. **Select** (`components/ui/Select.tsx`)
   - Stejné styly jako Input + custom dropdown šipka (SVG)
   - Cursor pointer, appearance none
   - Background-image: chevron SVG right 14px center, size 20px
   - Padding-right 48px (prostor pro šipku)

7. **Textarea** (`components/ui/Textarea.tsx`)
   - Stejné styly jako Input
   - Min-height 120px, resize vertical

8. **Toggle** (`components/ui/Toggle.tsx`) — "use client"
   - Switch/toggle prvek: šířka 48px, výška 28px
   - Slider: gray-300 pozadí, border-radius full
   - Knob: 22px bílý kruh, 3px od kraje, shadow-sm
   - Checked: slider zelený (success-500), knob translateX(20px)
   - Transition 0.3s na obojí

9. **Card** (`components/ui/Card.tsx`)
   - Base card: white background, border-radius-2xl, shadow-card (0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.05), 0 12px 24px rgba(0,0,0,0.05))
   - Hover varianta: translateY(-4px) + silnější shadow
   - Overflow hidden, transition 0.3s

10. **StatCard** (`components/ui/StatCard.tsx`)
    - Props: `icon`, `iconColor` (orange/green/blue/red), `value`, `label`, `trend` (up/down), `trendValue`
    - Icon: 48x48px, border-radius-lg, barevné pozadí (orange-100/success-50/info-50/error-50)
    - Trend: 13px weight 600, zelený pro up, červený pro down, se šipkou ↑/↓
    - Value: 32px weight 800, gray-900
    - Label: 14px, gray-500

11. **Alert** (`components/ui/Alert.tsx`)
    - Varianty: `success`, `error`, `warning`, `info`
    - Flex row, gap 12px, padding 16px, border-radius-lg
    - Každá varianta má své pozadí (-50 shade) a barvu textu (-600 shade)

12. **Modal** (`components/ui/Modal.tsx`) — "use client"
    - Overlay: fixed inset 0, black/50% pozadí, flex center, z-index 200, padding 24px
    - Modal: white, border-radius-2xl, max-width 500px, max-height 90vh, overflow auto
    - Header: padding 24px, border-bottom gray-200, flex between, title 20px weight 700
    - Close button: 36x36px, gray-100 bg, border-radius-md
    - Body: padding 24px
    - Footer: padding 16px 24px, border-top gray-200, flex end, gap 12px

13. **Tabs** (`components/ui/Tabs.tsx`) — "use client"
    - Container: flex, gap 4px, gray-100 bg, padding 4px, border-radius-lg
    - Tab button: padding 10px 20px, transparent bg, 14px weight 600, gray-600, border-radius-md
    - Active tab: white bg, gray-900 text, shadow-sm
    - Hover: gray-900 text

14. **Pagination** (`components/ui/Pagination.tsx`) — "use client"
    - Flex center, gap 8px
    - Buttons: 40x40px, border gray-200, white bg, border-radius-md, 14px weight 600
    - Active: gray-900 bg, white text
    - Hover: gray-50 bg, gray-300 border

15. **Dropdown** (`components/ui/Dropdown.tsx`) — "use client"
    - Trigger: libovolný children element
    - Menu: absolute, top calc(100% + 8px), right 0, min-width 200px, white bg, border-radius-lg, shadow-xl, border gray-200, padding 8px, z-index 100
    - Item: flex, gap 10px, padding 10px 12px, border-radius-md, 14px weight 500, gray-700
    - Item hover: gray-100 bg, gray-900 text
    - Danger item: red text, red-50 bg on hover
    - Divider: 1px gray-200 line, margin 8px 0

16. **ProgressBar** (`components/ui/ProgressBar.tsx`)
    - Container: height 8px, gray-200 bg, border-radius full
    - Bar: height 100%, orange gradient, border-radius full, transition width 0.3s
    - Varianty barev: default (orange), green, blue

17. **Checkbox** (`components/ui/Checkbox.tsx`)
    - Flex row, gap 12px, cursor pointer
    - Input: 20x20px, accent-color orange-500

**Důležité:**
- Použij helper `cn()` z `lib/utils.ts` pro merge class names
- Exportuj všechny komponenty z `components/ui/index.ts` barrel file
- Každá komponenta musí mít TypeScript props interface
- Inspiruj se PŘESNĚ vizuálem v `carmakler-design-system.html` — otevři ho v prohlížeči jako referenci
- Font Outfit je už nastavený v root layout

### Kontext:
- Existující CSS variables: `app/globals.css` — chybí tam shadows, radii a některé barvy z design systému, doplň je
- Utility helper: `lib/utils.ts` obsahuje `cn()` (clsx + tailwind-merge)
- Tailwind 4 theme mapping: `@theme inline` blok v globals.css
- Framer Motion je k dispozici pro animace (hover efekty, modal transitions)

### Očekávaný výsledek:
- 17 komponent v `components/ui/`, každá plně funkční a vizuálně odpovídající design systému
- Barrel export `components/ui/index.ts`
- Doplněné CSS variables v `globals.css` (shadows, radii, gradient, chybějící barvy)
- Všechny komponenty typově bezpečné s TypeScript interfaces

---

## TASK-002: Web Layout — Navbar, Footer, základní layout veřejného webu
Priorita: 1
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Vytvoř layout pro veřejný web `(web)` route group — navbar a footer. Styl podle design systému.

**Navbar** (`components/web/Navbar.tsx`):
- Sticky top, white background, border-bottom gray-200, height cca 72px
- Levá strana: Logo CARMAKLER — ikona "C" v orange gradient čtverci (border-radius-lg) + text "CARMAKLER" 20px weight 800
- Střed: navigační linky (Vozidla, Makléři, Jak to funguje, Ceník) — 14px weight 500, gray-600, hover gray-900
- Pravá strana: search icon button (44x44, gray-100 bg, border-radius-lg) + "Přihlásit se" outline button + "Nabídnout vůz" primary button
- Mobilní verze: hamburger menu, slide-in navigation
- Z-index 50

**Footer** (`components/web/Footer.tsx`):
- Dark background (gray-950), white text
- 4 sloupce: O nás, Pro makléře, Podpora, Kontakt
- Spodní řádek: copyright + odkazy na privacy policy, podmínky
- Logo + krátký popis vlevo nahoře
- Sociální sítě ikonky

**Layout update** (`app/(web)/layout.tsx`):
- Obalí children do Navbar + main + Footer
- Main má min-height pro push-down footer

### Kontext:
- Aktuální layout v `app/(web)/layout.tsx` je prázdný wrapper
- Navbar bude Server Component (žádná interaktivita kromě mobile menu)
- Mobile menu bude "use client" část
- Použij Button a další UI komponenty z TASK-001

### Očekávaný výsledek:
- Funkční responzivní navbar s mobile hamburger menu
- Footer se 4 sloupci, responzivní
- Layout.tsx správně obaluje stránky
- Smooth scroll, sticky navbar

---

## TASK-003: Web Homepage — kompletní úvodní stránka
Priorita: 1
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Vytvoř kompletní homepage pro veřejný web podle design systému. Stránka v `app/(web)/page.tsx`.

**Sekce stránky (shora dolů):**

1. **Hero sekce**
   - Velký dark background (gradient-dark: linear-gradient 135deg, #18181B 0%, #09090B 100%)
   - Velký heading: "Najděte svůj vůz. Bezpečně." — 48px+ weight 800, bílý text
   - Podnadpis: "Síť certifikovaných makléřů po celé ČR" — 20px, white/60% opacity
   - Search bar: velký input s ikonou hledání + select pro značku + primary button "Hledat"
   - Statistiky pod search: "1 247 vozidel", "186 makléřů", "4.8 průměrné hodnocení" — bílý text, čísla velká weight 800

2. **Doporučená vozidla** (grid 3 sloupce)
   - Section title: "Doporučená vozidla" 28px weight 800 + "Zobrazit vše →" link vpravo
   - 6x Car Card komponent z TASK-001 s dummy daty
   - Karty: obrázek s aspect-ratio 4/3, badge verified/top, favorite button (srdíčko, opacity 0 → 1 on hover), trust score overlay
   - Pod obrázkem: název vozu (17px weight 700), specs (rok · km · palivo · převodovka), features tagy (město, HP), cena (22px weight 800) + "Detail →" button
   - Responsive: 3 sloupce → 2 → 1

3. **Jak to funguje** (3 kroky)
   - 3 karty v řadě, každá s ikonou, názvem a popisem
   - Krok 1: "Vyberte si vůz" — prohlédněte si nabídku ověřených vozidel
   - Krok 2: "Kontaktujte makléře" — domluvte si prohlídku
   - Krok 3: "Bezpečný nákup" — makléř zajistí vše od A do Z

4. **TOP Makléři** (grid 3 sloupce)
   - Broker Card z design systému: avatar (iniciály na orange gradient), jméno, region
   - Badges: TOP Makléř, Rychlá reakce
   - Stats: hodnocení (orange gradient text), počet prodejů, průměrný čas prodeje v dnech
   - Hover efekt: orange bar animace nahoře (scaleX 0 → 1)

5. **CTA sekce**
   - Dark/orange gradient background
   - "Jste makléř? Přidejte se k nám" heading
   - Popis benefitů
   - Dva buttony: "Registrovat se" primary + "Více informací" outline (white)

6. **Trust/statistiky sekce**
   - Stat Cards v řadě: počet vozidel, úspěšných prodejů, aktivních makléřů, průměrné hodnocení

**Dummy data:**
- Použij statická mock data přímo v page.tsx (žádné API volání)
- Obrázky aut: použij placeholder obrázky z Unsplash (auta) — URL ve formátu `https://images.unsplash.com/photo-XXX?w=600&q=80` (stejné jako v design systému)
- Makléři: Jan Novák (Praha), Petra Malá (Brno), Karel Dvořák (Ostrava)
- Vozy: Škoda Octavia RS, BMW 330i, VW Golf GTI, Mercedes C300, Audi A4, Hyundai Tucson

### Kontext:
- Stránka je v `app/(web)/page.tsx` — aktuálně jen placeholder
- Použij Car Card, Broker Card, StatCard, Button, Badge, TrustScore z TASK-001
- Server Component — žádné "use client" na celé stránce (jen pokud je nutné pro interaktivní search)
- Framer Motion pro scroll reveal animace (fade in, slide up)
- Mobile-first approach — začni mobilem, pak tablet, pak desktop

### Očekávaný výsledek:
- Plně responzivní homepage se všemi 6 sekcemi
- Vizuálně odpovídá design systému
- Smooth animace při scrollu
- Dummy data přímo ve stránce

---

## TASK-004: Admin Layout — Sidebar, Header, základní struktura admin panelu
Priorita: 2
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Vytvoř kompletní layout pro admin panel `(admin)` route group podle design systému — sidebar navigace + horní header + content area.

**Admin Sidebar** (`components/admin/AdminSidebar.tsx`):
- Šířka 280px, fixní pozice, celá výška
- Background: gray-950 (téměř černá), bílý text
- **Header:** logo CARMAKLER (ikona + text + "ADMIN" badge orange), padding 24px, border-bottom white/8%
- **Navigace** (seskupená do sekcí):
  - Sekce "HLAVNÍ": Dashboard (ikona 📊), Vozidla (🚗) s badge "23" (červený, počet čekajících), Makléři (👥), Schvalování (✅) s badge "5"
  - Sekce "SPRÁVA": Regiony (📍), Provize (💰), Uživatelé (🔧)
  - Sekce "SYSTÉM": Nastavení (⚙️), Logy (📋)
- **Link styl:** flex row, gap 12px, padding 12px 16px, border-radius-lg, gray-400 text, 14px weight 500
- **Link hover:** white/5% background, white text
- **Link active:** orange/15% background, orange-500 text
- **Footer:** user info — avatar (40px, orange gradient), jméno "Admin", role "Administrátor", padding 16px, border-top white/8%
- Mobilní: sidebar skrytá (translateX -100%), hamburger v headeru ji otevře

**Admin Header** (`components/admin/AdminHeader.tsx`):
- Sticky top, white background, border-bottom gray-200, height 72px
- Levá strana: Search bar — gray-100 bg, border-radius full, 320px šířka, ikona hledání + input "Hledat vozidla, makléře..." 14px
- Pravá strana: notifikační icon button (s červenou tečkou 8px), user avatar
- Z-index 50

**Admin Content wrapper:**
- Padding 32px
- Page header pattern: breadcrumb (13px, gray-500, s / oddělovači) + page title (28px weight 800) vlevo, action buttons vpravo

**Layout** (`app/(admin)/layout.tsx`):
- Flex row: sidebar + main (flex 1, margin-left 280px)
- Main obsahuje: header (sticky) + content area
- Background: gray-100

### Kontext:
- Aktuální admin layout je prázdný
- Sidebar bude "use client" kvůli mobilnímu toggle
- Header search bude "use client"
- CSS variable --sidebar-width: 280px a --header-height: 72px přidej do globals.css
- Sidebar navigace zatím nebude funkční routování — jen vizuální, linky na `/admin/dashboard`, `/admin/vehicles`, `/admin/brokers`, etc.

### Očekávaný výsledek:
- Kompletní admin layout se sidebar, header a content area
- Responzivní — na mobilu sidebar schovaný s hamburger toggle
- Vizuálně přesně odpovídá admin sekci design systému
- Breadcrumb + page title pattern připravený k použití

---

## TASK-005: Admin Dashboard — hlavní dashboard stránka
Priorita: 2
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Vytvoř kompletní admin dashboard stránku v `app/(admin)/admin/dashboard/page.tsx` podle design systému.

**Layout dashboardu:**

1. **Page header:**
   - Breadcrumb: "Admin / Dashboard"
   - Title: "Dashboard"
   - Vpravo: Select pro časové období (Tento měsíc / Tento týden / Dnes) + "Export" button (secondary)

2. **Stat Cards** (grid 4 sloupce):
   - Aktivních vozidel: 1,247 | ikona 🚗 orange bg | trend ↑ 12% zelený
   - Provize tento měsíc: 2.4M Kč | ikona 💰 green bg | trend ↑ 8% zelený
   - Aktivních makléřů: 186 | ikona 👥 blue bg | trend ↓ 3% červený
   - Čeká na schválení: 23 | ikona ⏳ red bg | žádný trend

3. **Charts row** (grid 2 sloupce):
   - Levý: "Prodeje za posledních 12 měsíců" — chart container s placeholder "📊 Graf prodejů" (šedý placeholder box 300px)
   - Pravý: "Provize podle regionů" — chart container s placeholder "📊 Graf provizí"
   - Každý chart má header s title + period selector (tabs: Týden/Měsíc/Rok)

4. **Spodní row** (grid 2 sloupce):

   **Levý — Poslední aktivita** (Activity Feed):
   - Seznam activity items s timeline designem
   - Každý item: orange tečka (10px) + text + čas
   - Příklady:
     - "**Jan Novák** přidal nové vozidlo Škoda Octavia RS" — před 5 min
     - "**Petra Malá** dokončila prodej BMW 330i" — před 15 min
     - "**Karel Dvořák** aktualizoval profil" — před 1 hod
     - "Nový makléř **Eva Svobodová** čeká na schválení" — před 2 hod

   **Pravý — Čekající schválení** (Approval Cards):
   - Seznam approval-card komponent
   - Každá karta: thumbnail (120x90px, šedý placeholder), info (název vozu, specs, makléř s mini avatarem), akční buttony (Schválit zelený, Zamítnout červený outline)
   - 3-4 dummy schválení

5. **Notifikace panel** (volitelné, pokud zbude čas):
   - Notification items: ikona + title + text + čas
   - Unread mají orange-50 pozadí

**Dummy data:** Všechna data statická/mock přímo ve stránce.

### Kontext:
- Aktuální dashboard stránka je prázdný placeholder
- Použij StatCard, Card, Button, Badge, StatusPill, Tabs z TASK-001
- Activity feed a approval cards budou vlastní admin komponenty v `components/admin/`
- Charts zatím jen placeholder boxy — reálné grafy se přidají později
- Server Component kde je to možné

### Očekávaný výsledek:
- Plně vizuální admin dashboard se všemi 5 sekcemi
- Responsive grid — 4 cols → 2 → 1 pro stat cards, 2 cols → 1 pro charts a spodní sekci
- Dummy data, žádné API
- Vizuálně odpovídá design systému

---

## TASK-006: Admin Tabulky — Makléři a Vozidla s filtrací a akcemi
Priorita: 2
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Vytvoř dvě admin stránky s datovými tabulkami podle design systému.

**Stránka 1: Seznam makléřů** (`app/(admin)/admin/brokers/page.tsx`)

- Page header: breadcrumb "Admin / Makléři", title "Makléři", akce: "Exportovat" outline button + "Přidat makléře" primary button
- Tabs: Všichni | Aktivní | Čekající | Pozastavení
- Tabulka makléřů:
  - Sloupce: Makléř (avatar + jméno + email), Region, Vozidla (počet), Provize (Kč), Status (StatusPill), Akce
  - Avatar: 40px čtverec, orange gradient, iniciály bílé, border-radius-lg
  - Jméno: weight 600, gray-900
  - Email: 13px, gray-500
  - Provize: bold
  - Status: active/pending/rejected pill
  - Akce: 3 icon buttons (👁 zobrazit, ✏️ upravit, 🗑 smazat — danger hover)
  - Action buttons: 36x36px, gray-100 bg, border-radius-md, hover gray-200
  - Danger hover: error-50 bg, error-500 text
  - Row hover: gray-50 bg
- Pagination pod tabulkou: ← 1 2 3 → buttons
- 5-8 řádků dummy dat

**Stránka 2: Seznam vozidel** (`app/(admin)/admin/vehicles/page.tsx`)

- Page header: breadcrumb "Admin / Vozidla", title "Vozidla", akce: "Filtrovat" outline + "Přidat vozidlo" primary
- Tabs: Všechna | Aktivní | Čekající | Zamítnutá | Prodaná
- Tabulka vozidel:
  - Sloupce: Vozidlo (mini foto + název + VIN), Makléř (avatar + jméno), Cena, Stav (StatusPill), Trust Score, Datum, Akce
  - Mini foto: 60x45px, border-radius-md, object-fit cover
  - Název vozu: weight 600
  - VIN: 13px, gray-500, monospace
  - Trust Score: malý TrustScore komponent
  - Datum: 14px, gray-500
- Pagination
- 5-8 řádků dummy dat

**Sdílená Table komponenta** (`components/admin/DataTable.tsx`):
- Reusable tabulka s headery (12px, weight 700, gray-500, uppercase, letter-spacing 0.5px, gray-50 bg, border-bottom gray-200)
- Buňky: padding 16px, border-bottom gray-100, 14px font
- Row hover: gray-50

**Empty State** (`components/ui/EmptyState.tsx`):
- Pokud by tabulka byla prázdná: ikona 80px v kruhu (gray-100 bg), title 20px weight 700, text gray-500, CTA button
- Text: "Žádná vozidla" / "Žádní makléři"

### Kontext:
- Routy `/admin/brokers` a `/admin/vehicles` zatím neexistují — vytvoř celou strukturu
- Sidebar linky z TASK-004 budou na tyto routy
- Dummy data statická přímo ve stránkách
- Tabs budou "use client" pro přepínání filtrů (zatím jen vizuální, ne reálné filtrování)
- Pagination vizuální (ne funkční)

### Očekávaný výsledek:
- Dvě kompletní admin stránky s tabulkami
- Reusable DataTable komponenta
- EmptyState komponenta
- Tabs filtrování (vizuální)
- Pagination (vizuální)
- Responsive — na mobilu horizontální scroll tabulky
- Dummy data, vizuálně odpovídá design systému

---

## TASK-007: Katalog vozidel — /nabidka s filtry a řazením
Priorita: 1
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Vytvoř stránku katalogu vozidel `/nabidka` — hlavní stránka kde si lidé prohlížejí auta. Musí být rychlejší a přehlednější než Autorro (oni mají pomalý WordPress s basic filtry).

**Stránka: `app/(web)/nabidka/page.tsx`**

1. **Hero strip** nahoře:
   - Nadpis "Nabídka vozidel" + počet "247 vozidel v nabídce"
   - Kompaktní, ne plná hero sekce

2. **Filtrová lišta** (sticky pod navbarem na desktopu):
   - Řada filtrů inline: Značka (select), Model (select, závislý na značce), Cena od-do (dva inputy), Rok od-do, Palivo (multiselect checkboxy), Převodovka, Typ karoserie
   - Tlačítko "Hledat" primary + "Resetovat filtry" ghost
   - Na mobilu: tlačítko "Filtry" otevře fullscreen modal s filtry
   - Pod filtry: počet výsledků + řazení (Nejnovější, Nejlevnější, Nejdražší, Nejmenší km)

3. **Grid vozidel**:
   - 3 sloupce desktop, 2 tablet, 1 mobil
   - Stejné Car Card jako na homepage (obrázek, badge, trust score, název, specs, features, cena, CTA)
   - Lazy loading — prvních 12, pak "Načíst další" button (ne infinite scroll)
   - Prázdný stav pokud žádné výsledky: EmptyState komponenta

4. **Sidebar na desktopu** (volitelné, alternativa k top filtrům):
   - Pokud je filtrů hodně, dej je do levého sidebaru (250px) a grid vpravo (3→2 sloupce)

**Dummy data:** 12 vozidel s různými parametry (mix značek, cen, paliv, stavů). Žádné API — statická data v page.tsx. Filtry budou "use client" ale zatím jen vizuální (nefiltrují reálně).

**Značky pro select:** Škoda, Volkswagen, BMW, Audi, Mercedes-Benz, Hyundai, Toyota, Ford, Kia, Peugeot, Renault, Opel

### Kontext:
- Referenční spec: docs/05-web-frontend.md
- Autorro má /ponuka-vozidiel/ — my to děláme lépe: rychlejší, hezčí karty, trust score
- Použij existující UI komponenty (Card, Badge, TrustScore, Button, Select, Input, Tabs)
- Filtry: vytvořit komponentu `components/web/VehicleFilters.tsx` ("use client")
- Car cards: vytvořit `components/web/VehicleCard.tsx` (reusable, použije se i na homepage)

### Očekávaný výsledek:
- Funkční stránka /nabidka s 12 dummy auty
- Filtrová lišta (vizuální, zatím nefunkční)
- Řazení (vizuální)
- Responsive grid
- VehicleCard a VehicleFilters reusable komponenty

---

## TASK-008: Detail vozu — /nabidka/[slug] s galerií a kontaktem
Priorita: 1
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Stránka detailu vozidla — nejdůležitější stránka pro konverzi. Musí být lepší než Autorro (oni mají basic gallery + seznam parametrů). My přidáme Trust Score, live viewers, makléřský profil a chytřejší layout.

**Stránka: `app/(web)/nabidka/[slug]/page.tsx`**

1. **Fotogalerie** (horní část):
   - Hlavní fotka velká (aspect 16/9 na desktop, 4/3 mobil)
   - Pod ní řada thumbnailů (6-8 fotek)
   - Klik na thumbnail = změna hlavní fotky
   - Lightbox na klik na hlavní fotku (fullscreen prohlížení)
   - Počet fotek badge "1/12"
   - Na mobilu: swipe carousel

2. **Info panel** (vedle galerie na desktopu, pod ní na mobilu):
   - Název vozu velký (24px font-extrabold)
   - Specs řádek: 2021 · 45 000 km · Benzín · DSG
   - Cena: velká (32px font-extrabold), "Kč" menší, pod ní "Cena k jednání" pokud negotiable
   - Trust Score badge (velký, prominentní)
   - Live viewers: "🔴 5 lidí si právě prohlíží" (zatím static dummy)
   - Dva CTA buttony: "Kontaktovat makléře" primary + "Zavolat" outline s telefonním číslem
   - Badge řada: Ověřeno ✓, Servisní knížka, STK platná do...

3. **Tabs sekce** pod galerií:
   - **Tab "Parametry"**: tabulka 2 sloupce — Značka, Model, Rok, Najeto, Palivo, Převodovka, Výkon, Objem, Karoserie, Barva, Počet dveří, Počet sedadel, VIN (částečně maskovaný: TMB****2345)
   - **Tab "Výbava"**: seznam výbavy v 3 sloupcích (checkmarky ✓): Klimatizace, Navigace, Parkovací senzory, Vyhřívaná sedadla, LED světla, Tempomat, etc.
   - **Tab "Popis"**: volný text od makléře o voze
   - **Tab "Historie"**: Change log — kdy byl inzerát vytvořen, změny ceny (s důvody)

4. **Makléř box** (pravý sidebar na desktopu):
   - Avatar (60px, orange gradient, iniciály)
   - Jméno + "Certifikovaný makléř"
   - Region (📍 Praha)
   - Hodnocení (⭐ 4.9 · 156 prodejů)
   - Tlačítka: "Napsat zprávu" + "Zavolat"
   - Link: "Zobrazit profil makléře →"

5. **Kontaktní formulář** (pod detailem):
   - Jméno, telefon, email, zpráva
   - Checkbox "Mám zájem o prohlídku"
   - "Odeslat poptávku" primary button
   - Poznámka: "Makléř vám odpoví do 30 minut v pracovní době"

6. **Sekce "Podobná vozidla"** (spodek):
   - 3 karty podobných vozidel (stejná značka nebo cenová kategorie)

7. **Lokace vozu**:
   - Město + městská část (ne přesná adresa)
   - Placeholder pro mapu (šedý box "📍 Praha 4 — Chodov")
   - Text: "Přesnou adresu sdělí makléř po domluvě"

**Dummy data:** Vytvoř 1 kompletní vůz se všemi parametry (Škoda Octavia RS), makléř Jan Novák, 12 dummy fotka URLs, kompletní výbava.

### Kontext:
- Spec: docs/05-web-frontend.md
- Galerie bude "use client" (carousel, lightbox)
- Tabs z UI komponent
- Formulář zatím neodesílá (jen vizuální)
- Vytvořit `components/web/VehicleGallery.tsx`, `components/web/BrokerBox.tsx`, `components/web/ContactForm.tsx`

### Očekávaný výsledek:
- Kompletní detail vozu se všemi 7 sekcemi
- Fotogalerie s thumbnaily a lightboxem
- Tabbed parametry/výbava/popis/historie
- Makléř sidebar
- Kontaktní formulář
- Podobná vozidla
- Responsive, premium feel

---

## TASK-009: Landing "Chci prodat auto" — /chci-prodat
Priorita: 1
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Landing page pro lidi kteří chtějí prodat auto přes Carmakler. Autorro má "Chcem predať vozidlo" — my to uděláme lépe s jasným value proposition a jednoduchým formulářem.

**Stránka: `app/(web)/chci-prodat/page.tsx`**

1. **Hero**:
   - Nadpis: "Prodáme vaše auto rychleji a za lepší cenu"
   - Podnadpis: "Nechte to na našem makléři. Vy se nemusíte o nic starat."
   - Ilustrace/fotka šťastného majitele s klíči nebo auto s "PRODÁNO" badge

2. **3 kroky**:
   - Krok 1: "Vyplňte formulář" — základní info o voze
   - Krok 2: "Makléř vás kontaktuje" — do 30 minut, domluví prohlídku
   - Krok 3: "Auto je prodané" — makléř zajistí vše, vy dostanete peníze

3. **Formulář "Chci prodat"** (hlavní CTA, uprostřed stránky):
   - Značka (select)
   - Model (select)
   - Rok výroby (select, 2000-2026)
   - Najeto km (input number)
   - Palivo (select)
   - Vaše jméno (input)
   - Telefon (input)
   - Email (input)
   - Poznámka (textarea, optional)
   - "Chci prodat auto" primary button velký
   - Pod formulářem: "Ozveme se do 30 minut" + "Žádné závazky, nezavazujete se k ničemu"

4. **Proč prodat přes Carmakler** (4 benefity):
   - ⏱️ "Průměrná doba prodeje 20 dní"
   - 💰 "Férová tržní cena — žádné podbízení"
   - 📸 "Profesionální inzerce na všech portálech"
   - 🛡️ "Kompletní servis — smlouvy, převod, vše"

5. **Testimonial**:
   - 1-2 citáty od prodejců kteří prodali přes Carmakler

6. **FAQ**:
   - "Kolik to stojí?" → Provize 5% z prodejní ceny, min. 25 000 Kč
   - "Jak dlouho trvá prodej?" → Průměrně 20 dní
   - "Musím řešit papíry?" → Ne, vše zajistí makléř
   - "Můžu si to rozmyslet?" → Ano, kdykoliv bez sankcí
   - Accordion styl (klik na otázku = rozbalí odpověď)

### Kontext:
- Toto je klíčová konverzní stránka — formulář musí být jednoduchý a rychlý
- Formulář zatím neodesílá (vizuální)
- FAQ accordion: "use client" komponenta
- Referenční spec: docs/05-web-frontend.md

### Očekávaný výsledek:
- Kompletní landing page se 6 sekcemi
- Formulář pro prodej auta
- FAQ accordion
- Responsive, CTA-focused design

---

## TASK-010: Služby stránky — Prověrka, Financování, Pojištění, Výkup
Priorita: 2
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Vytvoř 4 landing pages pro služby. Autorro má tyto jako jednoduché stránky — my uděláme každou s jasným CTA a profesionálním obsahem.

Všechny 4 stránky mají **stejnou strukturu** (template):
1. Hero s nadpisem + podnadpisem + CTA button
2. "Jak to funguje" — 3 kroky
3. Výhody/benefity — 3-4 body
4. CTA sekce s formulářem nebo kontaktem
5. FAQ (2-3 otázky)

**Stránky:**

### `/sluzby/proverka` — Prověrka vozidla
- Hero: "Kupte auto s jistotou" / "Kompletní prověrka historie a technického stavu vozidla"
- Kroky: Zadejte VIN → Prověříme historii → Dostanete report
- Co prověřujeme: Původ, nehody, servisní historie, počet majitelů, zástavy, odcizení, stav tachometru
- CTA: Input na VIN + "Prověřit vozidlo" button
- Cena: "od 490 Kč"

### `/sluzby/financovani` — Financování
- Hero: "Auto na splátky do 30 minut" / "Výhodné financování bez zbytečného papírování"
- Kroky: Vyberte auto → Spočítáme splátky → Schválení do 30 min
- Benefity: Bez zálohy, Nízký úrok od 3.9%, Schválení online, Pojištění v ceně
- CTA: Kalkulačka splátek (cena auta → měsíční splátka, dummy kalkulace)

### `/sluzby/pojisteni` — Pojištění
- Hero: "Povinné ručení i havarijní online" / "Porovnáme nabídky a najdeme tu nejlepší pro vás"
- Benefity: Srovnání pojišťoven, Online sjednání, Nejlepší cena garantována
- CTA: "Chci nabídku pojištění" formulář (jméno, tel, SPZ)

### `/sluzby/vykup` — Výkup vozidel
- Hero: "Vykoupíme vaše auto za hotové" / "Peníze na účtu do 24 hodin"
- Kroky: Pošlete info o voze → Nabídneme cenu → Vyplatíme do 24h
- Benefity: Férová cena, Platba ihned, Bez skrytých poplatků, Přepis na počkání
- CTA: Formulář (značka, model, rok, km, tel)

**Implementace:**
- Vytvořit shared template komponentu `components/web/ServicePage.tsx` — přijímá props pro hero, kroky, benefity, FAQ, CTA
- Každá stránka jen předá data do šablony
- FAQ reuse accordion z TASK-009

### Kontext:
- 4 nové routy: app/(web)/sluzby/proverka/page.tsx, financovani/page.tsx, pojisteni/page.tsx, vykup/page.tsx
- Reusable šablona = méně kódu, konzistentní look
- Formuláře zatím vizuální (neodesílají)
- Spec: docs/07-integrace-externi.md (pojištění, leasing)

### Očekávaný výsledek:
- 4 service landing pages
- Shared ServicePage šablona
- Každá stránka s unikátním obsahem
- CTA formuláře
- FAQ accordiony
- Responsive

---

## TASK-011: O nás, Recenze, Kariéra, Kontakt — informační stránky
Priorita: 2
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

4 informační stránky. Autorro má tyto dost basic — my to uděláme lépe s moderním designem.

### `/o-nas` — O Carmakler
- Hero: "Nová éra prodeje aut v Česku"
- Příběh firmy: kdo jsme, proč to děláme, co nás odlišuje
- Čísla: X makléřů, X prodaných aut, X spokojených klientů
- Tým: grid 4-6 lidí (avatar, jméno, pozice) — dummy data
- Hodnoty: Transparentnost, Bezpečnost, Rychlost, Profesionalita

### `/recenze` — Recenze
- Grid recenzí od klientů (Card, quote, stars, jméno, město, datum)
- Filtr: Všechny / Prodejci / Kupující
- 8-10 dummy recenzí
- Celkové hodnocení nahoře: "4.8 z 5 ⭐ · 247 recenzí"
- CTA: "Napište nám recenzi" button

### `/kariera` — Kariéra
- Hero: "Přidejte se k nám" / "Staňte se makléřem Carmakler"
- Benefity práce: Flexibilní úvazek, Neomezený výdělek, Moderní nástroje, Školení zdarma
- Otevřené pozice: 2-3 dummy pozice (Automakléř Praha, Automakléř Brno, Regionální manažer)
- Každá pozice: Card s názvem, městem, popisem, "Odeslat CV" button
- Formulář: Jméno, email, tel, město, motivace, upload CV

### `/kontakt` — Kontakt
- Mapa placeholder (šedý box s "📍 Praha")
- Kontaktní info: adresa, telefon, email, otevírací doba
- Kontaktní formulář: Jméno, email, předmět, zpráva, "Odeslat"
- Pobočky: grid 2-3 poboček (Praha, Brno, Ostrava) s adresou a telefonem

### Kontext:
- Všechny stránky statické, server components
- Formuláře vizuální
- Reuse Card, Button, Input, Textarea z UI

### Očekávaný výsledek:
- 4 kompletní informační stránky
- Každá s unikátním obsahem a layoutem
- Responsive

---

## TASK-012: Makléři — seznam + profil makléře
Priorita: 2
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Stránky makléřů — tohle Autorro nemá (oni nemají makléřskou síť). Toto je naše **konkurenční výhoda**.

### `/makleri` — Seznam makléřů
- Hero: "Naši certifikovaní makléři" + "186 makléřů po celé ČR"
- Filtr: město (select), specializace (select: osobní, SUV, užitkové, luxusní)
- Grid 3 sloupce: Broker Card (z homepage) — avatar, jméno, region, badges, stats
- 9 dummy makléřů z různých měst

### `/makler/[slug]` — Profil makléře (např. /makler/jan-novak-praha)
- Velký avatar (120px) + jméno + "Certifikovaný makléř Carmakler"
- Region, specializace, člen od (datum)
- Stats řada: Hodnocení 4.9, Prodejů 156, Průměrná doba 14 dní, Aktivních vozidel 8
- Bio text: pár vět o makléři
- **Vozidla makléře**: grid jeho aktivních vozidel (Car Card)
- **Recenze**: seznam recenzí od klientů (stars + text + jméno + datum)
- Kontaktní formulář: "Napište makléři" (jméno, tel, zpráva)
- CTA: "Zavolat" button s telefonním číslem

Dummy data: Jan Novák Praha (8 vozidel, 12 recenzí)

### Kontext:
- Spec: docs/03-profil-maklere-recenze.md
- URL pattern: /makler/jan-novak-praha (slug = jméno + město)
- Profil makléře je důležitý pro SEO i důvěru
- Reuse VehicleCard z TASK-007

### Očekávaný výsledek:
- Seznam makléřů s filtrem
- Detailní profil makléře se vším
- SEO-friendly URL
- Reusable komponenty

---

## TASK-013: Auth systém — NextAuth.js + login/registrace
Priorita: 1
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Implementuj kompletní autentizační systém pomocí NextAuth.js. Prisma schema už existuje (User model s rolemi).

**Co vytvořit:**

1. **NextAuth konfigurace** (`lib/auth.ts`):
   - Credentials provider (email + heslo)
   - Prisma adapter pro sessions
   - JWT strategy
   - Session callback — do session přidat: userId, role, firstName, lastName, avatar
   - Hashování hesel: bcrypt

2. **API route** (`app/api/auth/[...nextauth]/route.ts`):
   - NextAuth handler

3. **Registrace API** (`app/api/auth/register/route.ts`):
   - POST: email, password, firstName, lastName, phone
   - Validace Zod
   - Hash hesla bcrypt
   - Vytvoření uživatele s role BROKER, status PENDING
   - Response: user bez hesla

4. **Login stránka** (`app/(web)/login/page.tsx`):
   - Formulář: email + heslo
   - "Přihlásit se" button
   - Link "Nemáte účet? Registrujte se"
   - Link "Zapomenuté heslo"
   - Chybové hlášky
   - Po přihlášení redirect na /makler/dashboard (BROKER) nebo /admin/dashboard (ADMIN)

5. **Registrace stránka** (`app/(web)/registrace/page.tsx`):
   - Formulář: jméno, příjmení, email, telefon, heslo, potvrzení hesla
   - Validace na frontendu (Zod)
   - "Registrovat se" button
   - Po registraci: redirect na login s hláškou "Registrace úspěšná, čekejte na schválení"

6. **Auth middleware** (`middleware.ts`):
   - Chráněné routy: /admin/* (role ADMIN, BACKOFFICE), /makler/* (role BROKER, MANAGER)
   - Redirect na /login pokud nepřihlášen

7. **Auth context** pro klientské komponenty:
   - SessionProvider wrapper
   - Hook useCurrentUser()

### Kontext:
- Prisma schema: User model s rolemi existuje
- NextAuth.js 4.24.13 je v package.json
- @auth/prisma-adapter je v package.json
- bcrypt potřeba doinstalovat: `npm install bcryptjs @types/bcryptjs`
- Zod 4.3.6 je v package.json

### Očekávaný výsledek:
- Funkční login/registrace
- Session management
- Role-based middleware
- Chráněné admin a makléř routy

---

## TASK-014: Vehicle API — CRUD endpoints pro vozidla
Priorita: 1
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

API routes pro správu vozidel. Toto propojí frontend (katalog, detail, admin tabulky) s databází.

**Endpoints:**

1. **GET `/api/vehicles`** — Seznam vozidel
   - Query params: brand, model, minPrice, maxPrice, fuelType, transmission, bodyType, minYear, maxYear, status, brokerId, sort, page, limit
   - Response: { vehicles: Vehicle[], total: number, page: number, totalPages: number }
   - Defaultně pouze ACTIVE vozidla (admin vidí všechny)

2. **GET `/api/vehicles/[id]`** — Detail vozidla
   - Včetně images, broker info, changeLog
   - Increment viewCount

3. **POST `/api/vehicles`** — Vytvoření vozidla (vyžaduje auth, role BROKER+)
   - Zod validace
   - VIN kontrola unikátnosti
   - Automatický slug (brand-model-year-city)
   - Status: DRAFT
   - vinLocked: true po uložení

4. **PATCH `/api/vehicles/[id]`** — Editace vozidla
   - VIN NELZE změnit (pokud vinLocked)
   - Změna ceny/km/roku vyžaduje reason
   - Automatický zápis do VehicleChangeLog
   - Flagování podezřelých změn (sleva >20%, km dolů)

5. **PATCH `/api/vehicles/[id]/status`** — Změna statusu
   - DRAFT → PENDING (makléř odešle ke schválení)
   - PENDING → ACTIVE (admin schválí)
   - PENDING → REJECTED (admin zamítne, s důvodem)
   - ACTIVE → SOLD (makléř označí jako prodané)

6. **POST `/api/vehicles/[id]/images`** — Upload fotek
   - Cloudinary upload
   - Pořadí, isPrimary flag

### Kontext:
- Spec: docs/02-sprava-vozu-workflow.md
- Prisma: Vehicle, VehicleImage, VehicleChangeLog modely existují
- Validace: Zod na všech vstupech
- Auth: z TASK-013 (session check)

### Očekávaný výsledek:
- 6 funkčních API endpoints
- Zod validace
- VIN pravidlo (nelze změnit)
- Change log s flagováním
- Schvalovací workflow

---

## TASK-015: PWA Setup — layout, dashboard, offline infrastruktura
Priorita: 1
Stav: zpracovává se
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Vytvořit základ PWA aplikace v `app/(pwa)/` — technickou infrastrukturu, layout, dashboard a offline systém. Toto je fundament na kterém staví TASK-016, 017 a 018.

**1. PWA Setup (Serwist)**
- Nainstalovat a nakonfigurovat Serwist (next-pwa následník)
- Manifest: name "Carmakler Pro", short_name "Carmakler", start_url "/app", display standalone, orientation portrait, background_color #ffffff, theme_color #F97316
- Ikony: 192px, 512px, maskable 512px (placeholder ikony stačí, finální dodá designer)
- Shortcuts: "Přidat auto" → /app/vehicles/new, "Moje vozy" → /app/vehicles
- Service Worker strategie:
  - `/api/*` → NetworkFirst (fallback to cache)
  - `/api/vin/*` → NetworkOnly
  - `/static/*`, `/_next/static/*` → CacheFirst
  - `/images/vehicles/*` → StaleWhileRevalidate
  - `/app`, `/app/*` → Precache (app shell)
- **Install prompt** — při prvním otevření na mobilu zobrazit výzvu k instalaci na homescreen. Po odmítnutí znovu za 7 dní. Po instalaci nezobrazovat. Uložit stav do localStorage.

**2. Layout (`app/(pwa)/layout.tsx`)**
- **Bottom navigation** — 5 položek: Domů (/app), Vozy (/app/vehicles), Přidat (/app/vehicles/new), Provize (/app/commissions), Profil (/app/profile)
- Tlačítko "Přidat" (prostřední) vizuálně odlišené — větší, oranžové (#F97316), mírně vystouplé nad lištu (negative margin top), border-radius full
- Aktivní položka zvýrazněna oranžovou barvou, neaktivní šedá
- Bottom nav fixní dole, vždy viditelný, z-index nad obsahem
- **Top bar** — fixní nahoře:
  - Vlevo: hamburger menu (budoucí rozšíření, zatím jen placeholder)
  - Střed: logo text "Carmakler Pro" (Outfit font, weight 700)
  - Vpravo: online/offline indikátor (zelená/červená tečka + text), notifikační zvoneček s červeným badge počtem, avatar uživatele (kulatý, 32px)
- **Offline banner** — žlutý pruh pod top barem, text "Jste offline — změny budou synchronizovány po připojení", zobrazit jen když navigator.onLine === false, animovaný slide-down
- Obsah stránky mezi top bar a bottom nav, scroll within
- Safe area padding pro notch (env(safe-area-inset-top), env(safe-area-inset-bottom))
- Celý layout mobile-first, max-width žádný (fullscreen na mobilu)

**3. Dashboard (`app/(pwa)/page.tsx` nebo `app/(pwa)/dashboard/page.tsx`)**
- **Pozdrav** — "Ahoj, {křestní jméno}!" (z NextAuth session)
- **Statistiky měsíce** — 3 karty v řadě (horizontální scroll na malém displeji):
  - Celková provize (Kč) — číslo velkým fontem, label "provize" pod tím
  - Počet prodejů — číslo + label "prodeje"
  - Počet aktivních vozů — číslo + label "aktivních vozů"
  - Data z API `/api/broker/stats`
- **CTA "Nabrat nové auto"** — velký button, celá šířka, oranžový gradient, ikona auta, text "Nabrat nové auto" + subtext "Přidat vůz do portfolia", link na /app/vehicles/new
- **Rozpracované drafty** — seznam z IndexedDB (offline) + API (online). Každý draft zobrazí:
  - Značka + model (nebo "Neznámé vozidlo" pokud ještě nezadáno)
  - Status indikátor: co je hotové, co chybí ("VIN načten • Chybí fotky")
  - Pokud offline draft: badge "Offline • Čeká na sync"
  - Čas poslední úpravy ("dnes 14:30", "včera 18:45")
  - Tlačítko "Pokračovat" → otevře flow na posledním rozpracovaném kroku
- **Notifikace** — posledních 5 notifikací z API `/api/broker/notifications`:
  - Ikona podle typu (✅ schváleno, 💬 dotaz, 🆕 nový lead, ❌ zamítnuto)
  - Titulek + krátký popis
  - Čas (relativní: "před 1h", "před 2h")
  - Kliknutí → navigace na relevantní stránku

**4. Offline infrastruktura (`lib/offline-storage.ts`)**
- IndexedDB databáze "carmakler-offline", verze 2, pomocí knihovny `idb`
- Stores:
  - `drafts` — rozpracované inzeráty (keyPath: localId, indexy: status, updatedAt, syncStatus)
  - `vehicles` — cache mých vozů ze serveru (keyPath: id, indexy: status, updatedAt)
  - `pendingActions` — fronta akcí k synchronizaci (keyPath: id autoIncrement, indexy: type, createdAt)
  - `images` — offline fotky jako blob (keyPath: localId, indexy: vehicleLocalId, uploaded)
  - `contacts` — kontakty prodejců (keyPath: id, indexy: phone, lastContact)
  - `vinCache` — cache VIN dekódování (keyPath: vin, indexy: decodedAt)
  - `equipmentCatalog` — katalog výbavy pro offline (keyPath: id, indexy: category, popular)
  - `contracts` — offline smlouvy (keyPath: localId, indexy: vehicleId, status, syncStatus)
- Třída `OfflineStorage` s metodami:
  - `saveDraft(draft)` — uloží draft, nastaví syncStatus: 'pending', updatedAt: now
  - `getDrafts()` — vrátí všechny drafty
  - `getDraft(localId)` — vrátí jeden draft
  - `deleteDraft(localId)` — smaže draft
  - `saveImage(image)` — uloží fotku (blob)
  - `getImages(vehicleLocalId)` — vrátí fotky draftu
  - `getPendingActions()` — vrátí nesynchronizované akce
  - `addPendingAction(action)` — přidá akci do fronty
  - `cacheVin(vin, data)` — uloží VIN dekódování
  - `getCachedVin(vin)` — vrátí cachovaný VIN nebo null
- Background Sync registrace:
  - Po uložení draftu registrovat `sync-vehicles`
  - Po uložení fotky registrovat `sync-images`
  - Po uložení smlouvy registrovat `sync-contracts`
- Service Worker sync handler:
  - `sync-vehicles` → projít drafty se syncStatus 'pending', uploadnout na server, změnit syncStatus na 'synced'
  - `sync-images` → projít fotky s uploaded: false, uploadnout na Cloudinary, změnit uploaded: true
  - `sync-contracts` → projít smlouvy se syncStatus 'pending', uploadnout na server
  - Po úspěchu: zobrazit lokální notifikaci "Data byla synchronizována"
- Online/offline detekce: listener na `navigator.onLine`, events `online`/`offline`, React context `useOnlineStatus()`

**5. Stránka offline draftů (`app/(pwa)/offline/page.tsx`)**
- Seznam všeho co čeká na synchronizaci:
  - Drafty vozů (název, počet fotek, stav)
  - Fotky čekající na upload (počet, velikost)
  - Smlouvy čekající na sync
  - Změny (editace ceny apod.)
- U každé položky: stav (čeká / synchronizuji / chyba)
- Tlačítko "Synchronizovat nyní" (pokud online)
- Progress bar při synchronizaci
- Chybové stavy: co se nepodařilo a proč, tlačítko "Zkusit znovu"

**6. Moje vozy (`app/(pwa)/vehicles/page.tsx`)**
- Filtry nahoře (horizontální scroll): Všechny, Aktivní, Draft, Ke schválení, Prodané
- Seznam vozů — karta pro každý vůz:
  - Miniatura hlavní fotky (nebo placeholder ikona auta pokud žádná)
  - Název: "Škoda Octavia RS" (značka + model + varianta)
  - Parametry: rok • km • palivo
  - Cena (velký font, bold)
  - Status badge: Aktivní (zelený), Draft (žlutý), Ke schválení (žlutý), Zamítnuto (červený), Prodáno (modrý)
  - U aktivních: počet zobrazení (👁), počet dotazů (💬)
  - U draftů: indikace co chybí + tlačítko "Pokračovat"
  - U offline draftů: badge "Čeká na sync"
- Proklik → detail vozu /app/vehicles/[id]
- Tlačítko "+ Nabrat" v top baru vpravo

**7. Provize (`app/(pwa)/commissions/page.tsx`)**
- **Statistika měsíce** (kartička nahoře):
  - Celkem vyděláno (velké číslo, Kč)
  - Počet prodejů
  - Rozdělení: "K výplatě: XX Kč" (zelená), "Čeká na platbu: XX Kč" (žlutá)
- **Historie prodejů** — seznam karet:
  - Název vozu
  - Prodejní cena
  - Datum prodeje
  - Výše provize (zvýrazněné)
  - Stav: Vyplaceno (zelený badge) / Čeká (žlutý badge)
- Filtr po měsících (select/dropdown)
- Data z API `/api/broker/commissions`

**8. Profil (`app/(pwa)/profile/page.tsx`)**
- Jméno, foto (editovatelné), telefon, email, region
- Trust Score (komponenta z UI knihovny)
- Statistiky: celkem nabraných vozů, celkem prodaných, průměrná doba prodeje
- Nastavení notifikací — toggles pro jednotlivé typy (nový lead, schválení, dotaz, provize)
- Odkaz na nastavení (/app/settings)

### Kontext:
- Stávající UI komponenty: `components/ui/` (Button, Badge, StatusPill, TrustScore, Input, Card...)
- Auth: z TASK-013 (NextAuth, role BROKER), session pro získání uživatelských dat
- Prisma modely: User, Vehicle, VehicleImage — existující
- Nové Prisma modely potřeba: Commission, Notification (nebo rozšířit existující)
- Knihovny k instalaci: serwist, idb
- Font: Outfit (už nakonfigurován)
- Styling: Tailwind CSS 4 + existující CSS variables z globals.css

### Očekávaný výsledek:
- PWA instalovatelná na mobil s manifestem a service workerem
- Funkční layout s bottom nav, top barem a offline indikátorem
- Dashboard s reálnými daty (statistiky, drafty, notifikace)
- Kompletní IndexedDB infrastruktura pro offline práci
- Stránka offline draftů se synchronizací
- Seznam vozů s filtry a stavy
- Provize s historií
- Profil makléře
- Online/offline detekce s automatickým přepínáním UI

---

## TASK-016: PWA Nabrat auto — 8-krokový flow + post-submission
Priorita: 1
Stav: čeká
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Implementovat kompletní 8-krokový flow "Nabrat auto" v `app/(pwa)/vehicles/new/`. Makléř projde kroky od kontaktu na prodejce po odeslání ke schválení. Celý flow funguje offline (data v IndexedDB z TASK-015), na každém kroku lze uložit draft a pokračovat později.

**Společné prvky pro všechny kroky:**
- **Progress bar** nahoře — "Step X / 8" + vizuální progress bar (oranžový)
- **Navigace** — šipka zpět (předchozí krok), křížek vpravo (uložit draft a odejít na Dashboard)
- **Tlačítko "Uložit draft"** dole na každém kroku — uloží aktuální stav do IndexedDB
- **Auto-save** — při odchodu z kroku se data automaticky uloží do draftu
- **Validace** — povinná pole označena *, validace při přechodu na další krok, ale neblokuje uložení draftu
- Všechny kroky sdílí jeden objekt draftu v IndexedDB, každý krok zapisuje do své sekce

**Step 1: Kontakt na prodejce (`/app/vehicles/new/contact`)**
- Formulář:
  - Jméno prodejce * (text input)
  - Telefon * (tel input, formát +420 XXX XXX XXX)
  - Akční tlačítka u telefonu: 📞 Zavolat (tel: link), 💬 SMS (sms: link), 📱 WhatsApp (wa.me link) — otevřou příslušnou appku
  - Email (email input, volitelné)
- Adresa pro prohlídku:
  - Adresa * (text input)
  - Tlačítko "📍 Použít aktuální polohu" — Geolocation API, reverse geocoding na adresu
  - Poznámka k místu (textarea, volitelné, placeholder "Parkoviště za domem, vůz je stříbrná Octavia")
- Termín schůzky — date picker + time picker
- "Najít v kontaktech" — modální okno s hledáním v IndexedDB store `contacts`, pokud nalezeno → předvyplnit formulář
- Tlačítko "Navigovat na místo" — otevře Mapy.cz nebo Google Maps s adresou (intent link)
- Tlačítko "Pokračovat" → Step 2

**Step 2: Příjezd na místo (`/app/vehicles/new/arrival`)**
- Mapa — statický obrázek mapy s pinem na adresu (Mapy.cz Static API nebo placeholder) nebo odkaz na otevření mapy
- Info: adresa, vzdálenost z aktuální polohy (Geolocation), odhadovaný čas dojezdu
- Tlačítka: "Otevřít v Mapy.cz", "Google Maps" (intent linky)
- Info o prodejci: jméno, telefon, tlačítka Zavolat / "Jsem na cestě" (předpřipravená SMS "Dobrý den, jsem na cestě. Budu u Vás přibližně za X minut.")
- Poznámka k místu (readonly, z kroku 1)
- Checklist před odjezdem — checkboxy:
  - Mám nabitý telefon
  - Mám baterku (pro kontrolu podvozku)
  - Mám OBD čtečku (volitelné)
  - Prodejce potvrdil schůzku
  - **Zobrazení checklistu**: při prvním použití zobrazit automaticky. Při dalším použití skrýt, zobrazit jen odkaz "Zobrazit checklist". Stav uložit do localStorage.
- Tlačítko "✅ Jsem na místě" → Step 3

**Step 3: Prohlídka vozu (`/app/vehicles/new/inspection`)**
- Text nahoře: "Projděte checklist a zaznamenejte stav vozu. Můžete přeskočit a vrátit se později."
- Sekce **Dokumenty** — checkboxy:
  - Velký technický průkaz
  - Malý technický průkaz (osvědčení)
  - Servisní kniha
  - Doklad o poslední STK
  - Doklad o měření emisí
- Sekce **Exteriér**:
  - Stav laku — 4 tlačítka (Výborný 😊 / Dobrý 😐 / Horší 😕 / Špatný 😢), jedno aktivní
  - Checkboxy: bez škrábanců, bez koroze, skla OK, světla OK, pneumatiky OK (4mm+), disky OK
  - "Přidat defekt s fotkou" — otevře kameru, po vyfocení dialog pro popis defektu (text input), fotka + popis se uloží k draftu
- Sekce **Interiér**:
  - Stav interiéru — 4 tlačítka (stejné emoji)
  - Checkboxy: sedadla, čalounění/kůže, palubka, volant, vůně, klimatizace, ovládací prvky
- Sekce **Motor a technika**:
  - Checkboxy: start OK, žádné zvuky, bez úniků, výfuk OK, kontrolky OK, převodovka OK
  - Tlačítko "Připojit OBD čtečku" — **fáze 2, v MVP neaktivní** s textem "Již brzy"
- **Poznámky z prohlídky** — textarea, volný text
- **Celkový dojem** — 5 hvězdiček (klikací)
- Tlačítko "Pokračovat na VIN" → Step 4

**Step 4: VIN zadání + dekódování (`/app/vehicles/new/vin`)**
- Nápověda "VIN najdete:" s 3 ikonkami/obrázky: dveře řidiče, palubka, technický průkaz
- **Ruční zadání VIN**:
  - Input pole, uppercase, max 17 znaků
  - Validace v reálném čase: povolené znaky (A-HJ-NPR-Z0-9), počet znaků, vizuální feedback (červená/zelená)
  - Po zadání 17 validních znaků → aktivuje se tlačítko "Dekódovat"
- Tlačítko "📷 Skenovat kamerou" — **neaktivní v MVP**, šedé s textem "Již brzy"
- Varování: "⚠️ VIN nelze po uložení změnit!"
- **Online flow** (po kliknutí "Dekódovat"):
  - Loading stav: spinner + "Dekóduji VIN... Načítám data o vozidle"
  - Volání API `/api/vin/decode?vin=XXX`
  - Backend: `lib/vin-decoder.ts` — volá vindecoder.eu API (nebo NHTSA jako fallback), vrací strukturovaná data
  - Úspěch → zobrazení:
    - Identifikace: značka, model, varianta, generace, rok výroby, místo výroby
    - Motor a pohon: typ, kód, výkon kW/PS, točivý moment, objem ccm, palivo, emise, převodovka, pohon
    - Barvy (pokud API vrátí): exteriér, interiér
    - VIN se zamkne (🔒 ikona, readonly)
  - Chyba → "VIN se nepodařilo dekódovat. Zkontrolujte správnost nebo pokračujte s ručním zadáním."
  - Cache: úspěšné dekódování uložit do IndexedDB `vinCache`
- **Offline flow**:
  - Nejdřív zkusit IndexedDB `vinCache` — pokud tam VIN je, zobrazit cached data
  - Pokud ne: zobrazit "📴 Nejste připojeni k internetu. VIN byl uložen a bude dekódován po připojení."
  - Dvě možnosti: "Pokračovat offline (ruční zadání údajů)" nebo "Uložit a dokončit později"
- Tlačítko "Pokračovat na fotky" → Step 5

**Step 5: Fotodokumentace (`/app/vehicles/new/photos`)**
- Text: "Nafoťte vůz podle průvodce. Minimum 10 fotek, doporučeno 15-20."
- **Kategorie fotek** — každá s miniaturami (grid 4 sloupce):
  - Exteriér (min. 8): přední 3/4, zadní 3/4, levý bok, pravý bok, přední pohled, zadní pohled, detail světel, kola
  - Interiér (min. 4): palubka, přední sedadla, zadní sedadla, kufr
  - Motor (min. 1): motorový prostor
  - Doklady (volitelné): TP, servisní kniha
  - Defekty: fotky z kroku 3 + tlačítko "Přidat další"
- Každý slot: prázdný (šedý placeholder s názvem + ikonka fotoaparátu) nebo vyplněný (miniatura fotky s checkmark)
- Kliknutí na prázdný slot → **průvodce focením**:
  - Fullscreen kamera (MediaDevices API, facingMode: environment)
  - Overlay s obrysem auta v požadovaném úhlu (SVG/PNG overlay přes video stream)
  - Název pozice nahoře ("PŘEDNÍ 3/4 POHLED")
  - Tip dole ("Foťte za denního světla, vůz by měl být čistý")
  - Tlačítko vyfotit (velký kruh dole uprostřed)
  - Tlačítko přeskočit (vpravo dole)
  - Counter: "Fotka 1 / 8 (Exteriér)"
  - Po vyfocení: preview s možností "Použít" nebo "Vyfotit znovu"
- **Zpracování fotky při pořízení**:
  - Resize na max 1920px šířka
  - Kvalita JPEG 80%
  - Max velikost 2 MB
  - Uložení do IndexedDB store `images` jako blob
  - Vygenerování thumbnailů (200px) pro náhledy v UI
- **Progress bar** dole: "5 / 10 (minimum)" + vizuální bar
- Drag & drop pro změnu pořadí fotek (long press + drag na mobilu)
- Tap na existující fotku → možnosti: zobrazit fullscreen, smazat, označit jako hlavní
- Tlačítko "Pokračovat na údaje" (aktivní jen pokud min. 10 fotek) → Step 6

**Step 6: Údaje a výbava (`/app/vehicles/new/details`)**
- **Základní údaje z VIN** (zobrazit jen pokud VIN byl dekódován, needitovatelné, 🔒):
  - Značka, Model, Varianta, Rok, Karoserie
  - Pokud VIN nebyl dekódován → tyto pole zobrazit jako editovatelné (select pro značku/model, input pro rok)
- **Stav vozu** (makléř vyplní):
  - Najeto km * — number input s formátováním (mezery po tisících)
  - Stav tachometru — radio: Originál / Nelze ověřit / Stočeno
  - Stav vozidla * — select: Výborný / Dobrý / Horší / Špatný
  - Počet majitelů v ČR — number input (1-10)
  - STK platná do * — month/year picker
  - Servisní kniha — radio: Kompletní / Částečná / Chybí
  - Země původu — select (Česká republika, Slovensko, Německo, Rakousko, Francie, Itálie, ostatní...), default ČR
- **Výbava z VIN** (pokud byla načtena):
  - Zobrazit jako checkboxy, předvyplněné (checked), makléř může odškrtnout co vozidlo reálně nemá
  - Seskupené do kategorií (podle toho co vrátil dekodér)
  - "Zobrazit vše" / "Skrýt" toggle
- **Katalog výbavy** — makléř vybere manuálně co VIN nezachytil:
  - Kategorie: Comfort, Safety, Infotainment, Exteriér, Interiér, Asistence, Světla, Další
  - Každá kategorie: seznam checkboxů s nejčastějšími položkami (Climatronic, vyhřívaná sedadla, tempomat, parkovací senzory, navigace, kožené sedačky, panorama střecha, tažné zařízení, LED světla, atd.)
  - Nejpopulárnější položky nahoře (podle indexu `popular` z IndexedDB `equipmentCatalog`)
  - "Přidat vlastní položku" — text input pro free-text výbavu
  - Katalog se cachuje v IndexedDB pro offline přístup
- **Hlavní přednosti** (tagy):
  - Předdefinované: 1. majitel, Servis u autorizovaného, Nekuřácké, Garážované, Nehavarované, Nový rozvod, Nové brzdy, Zimní pneu, Druhá sada kol
  - Kliknutím přidat/odebrat, zobrazené jako chips/tagy
  - "Přidat vlastní" — text input
- Tlačítko "Pokračovat" → Step 7

**Step 7: Cena a lokace (`/app/vehicles/new/pricing`)**
- **Prodejní cena**:
  - Požadovaná cena * — number input, formátování s mezerami, suffix "Kč"
  - Checkbox "Cena k jednání"
  - (Bez tržního odhadu — Cebia není integrováno)
- **Lokace vozu**:
  - Město * — select s autocomplete (seznam českých měst) nebo text input
  - Městská část — text input (volitelné)
  - Přesná adresa — text input, label "pouze interně, nezobrazuje se veřejně"
- **Popis inzerátu**:
  - Textarea, min 50 znaků, placeholder s příkladem
  - Tlačítko "🤖 Vygenerovat popis AI" — volá API `/api/assistant/generate-description` s daty vozu (značka, model, rok, km, výbava, stav, přednosti), vrátí vygenerovaný text, makléř může upravit
  - (AI generování závisí na TASK-018, pokud není hotový → tlačítko neaktivní s textem "Již brzy")
- **Zdroj vozu** — radio: Soukromý prodejce / Autobazar / Dovoz
- Tlačítko "Pokračovat na kontrolu" → Step 8

**Step 8: Kontrola a odeslání (`/app/vehicles/new/review`)**
- **Náhled inzerátu** — vizuální preview:
  - Hlavní fotka (carousel pokud víc fotek)
  - Název: ZNAČKA MODEL VARIANTA KAROSERIE
  - Parametry: motor výkon | převodovka | pohon
  - Rok • km • palivo
  - Cena (velký font) + "k jednání" badge pokud zaškrtnuto
  - Lokace
- **Checklist kompletnosti** — automaticky vyhodnotit:
  - ✅/❌ VIN zadán a dekódován
  - ✅/❌ Základní údaje kompletní (km, stav, STK)
  - ✅/❌ Výbava vybrána (alespoň 1 položka)
  - ✅/❌ Fotografie (min. 10 nahrány)
  - ✅/❌ Cena vyplněna
  - ✅/❌ Lokace vyplněna
  - ✅/❌ Popis napsán (min. 50 znaků)
  - Nesplněné položky červeně, kliknutí → navigace na příslušný krok
  - Tlačítko "Odeslat" aktivní jen pokud vše ✅
- **Shrnutí** — tabulka s klíčovými údaji: vozidlo, VIN, km, cena, počet fotek, počet položek výbavy, lokace, prodejce
- **Dvě akce**:
  - "Uložit jako draft" (sekundární button) — uloží do IndexedDB, přesměruje na Dashboard
  - "Odeslat ke schválení" (primární button, oranžový) — online: POST na API `/api/vehicles` s kompletními daty + upload fotek na Cloudinary → po úspěchu přesměrování na potvrzení. Offline: uloží jako draft se syncStatus 'pending', registruje background sync, přesměruje na potvrzení s textem "Bude odesláno po připojení"

**Post-submission flow:**
- **Potvrzovací obrazovka** (`/app/vehicles/new/success`):
  - Ikona ✅, text "Odesláno ke schválení!"
  - "BackOffice zkontroluje váš inzerát. Obvykle do 24 hodin."
  - Tlačítka: "Zpět na Dashboard", "Nabrat další auto"
- **V seznamu "Moje vozy"**: stav "Ke schválení" (žlutý badge)
- **Při schválení BackOffice**: push notifikace "Inzerát schválen: Škoda Octavia RS", stav se změní na "Aktivní" (zelený badge)
- **Při zamítnutí**: push notifikace "Inzerát zamítnut: Škoda Octavia RS", stav "Zamítnuto" (červený badge), v detailu vozu zobrazit:
  - Důvod zamítnutí (text od BackOffice)
  - Tlačítko "Opravit a odeslat znovu" → otevře editační flow (`/app/vehicles/[id]/edit`) s předvyplněnými daty, makléř opraví a znovu odešle

### Kontext:
- Závisí na: TASK-015 (layout, offline infrastruktura, IndexedDB)
- Layout: `app/(pwa)/layout.tsx` s bottom nav
- Offline storage: `lib/offline-storage.ts` (třída OfflineStorage)
- Vehicle API: z TASK-014 (POST/PUT /api/vehicles)
- VIN dekodér: implementovat `lib/vin-decoder.ts` + API route `/api/vin/decode`
- Fotky: MediaDevices API pro kameru, canvas pro resize/kompresi, IndexedDB pro offline, Cloudinary pro upload
- Geolokace: navigator.geolocation pro aktuální polohu
- Auth: NextAuth session (role BROKER)
- AI generování popisu: závisí na TASK-018, pokud není → tlačítko neaktivní

### Očekávaný výsledek:
- Kompletní 8-krokový flow od kontaktu po odeslání
- Každý krok ukládá data do jednoho sdíleného draftu v IndexedDB
- Funkční offline — všechny kroky fungují bez internetu (kromě VIN dekódování a AI popisu)
- VIN ruční zadání s validací + dekódování přes API + cache
- Fotodokumentace s průvodcem, overlay, kompresí, min. 10 fotek
- Výbava: dvouvrstvě (z VIN + ruční výběr z katalogu)
- Post-submission: stavy schvalování, zamítnutí s důvodem, oprava
- Background sync pro offline odeslání

---

## TASK-017: PWA Smlouvy — generování, předvyplnění, digitální podpis
Priorita: 2
Stav: čeká
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Implementovat modul smluv v PWA — makléř může na místě u prodejce vygenerovat smlouvu předvyplněnou z dat v systému, dát ji podepsat prstem na displeji a odeslat jako PDF.

**1. Nové Prisma modely:**
```
model Contract {
  id            String   @id @default(cuid())
  type          ContractType  // BROKERAGE (zprostředkovatelská), HANDOVER (předávací protokol)
  vehicleId     String?
  vehicle       Vehicle? @relation(fields: [vehicleId], references: [id])
  brokerId      String
  broker        User     @relation(fields: [brokerId], references: [id])

  // Prodejce
  sellerName    String
  sellerPhone   String
  sellerEmail   String?
  sellerAddress String?
  sellerIdNumber String?   // Rodné číslo
  sellerIdCard  String?    // Číslo OP
  sellerBankAccount String?

  // Obsah smlouvy
  content       Json       // Strukturovaná data smlouvy
  price         Int?       // Dohodnutá cena
  commission    Int?       // Provize

  // Podpisy
  sellerSignature  String?  // Base64 SVG/PNG podpisu
  brokerSignature  String?  // Base64 SVG/PNG podpisu
  signedAt         DateTime?
  signedLocation   String?  // GPS souřadnice při podpisu

  // PDF
  pdfUrl        String?    // URL vygenerovaného PDF (Cloudinary nebo S3)

  // Stav
  status        ContractStatus  // DRAFT, SIGNED, SENT, ARCHIVED
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum ContractType {
  BROKERAGE   // Zprostředkovatelská smlouva
  HANDOVER    // Předávací protokol
}

enum ContractStatus {
  DRAFT
  SIGNED
  SENT
  ARCHIVED
}
```

**2. Seznam smluv (`app/(pwa)/contracts/page.tsx`)**
- Filtry: Všechny, Drafty, Podepsané, Odeslané
- Karta smlouvy: typ (ikona), název vozu, jméno prodejce, datum, stav (badge)
- Tlačítko "+ Nová smlouva"

**3. Generování smlouvy (`app/(pwa)/contracts/new/page.tsx`)**
- Krok 1 — Výběr typu: Zprostředkovatelská smlouva / Předávací protokol (dvě velké karty s popisem)
- Krok 2 — Výběr vozidla: seznam vozů makléře (aktivní + drafty), kliknutím vybrat
- Krok 3 — Kontrola údajů: formulář předvyplněný z dat vozu a kontaktu:
  - **Automaticky předvyplněno** (z dat vozu/kontaktu):
    - Jméno prodejce, telefon, email, adresa
    - VIN, značka, model, rok, km
    - Cena
    - Jméno makléře (z session)
  - **Makléř doplní** (pokud chybí):
    - Rodné číslo prodejce
    - Číslo občanského průkazu
    - Číslo bankovního účtu
    - Provize (předvyplněná podle tarifu, editovatelná)
  - Validace: povinné pole pro podpis = jméno, VIN, cena
- Krok 4 — Preview: smlouva zobrazená jako formátovaný dokument (HTML rendered):
  - Hlavička: logo Carmakler, číslo smlouvy, datum
  - Smluvní strany: Carmakler (makléř) a prodejce
  - Předmět: vozidlo (VIN, značka, model, rok, km, stav)
  - Cena a provize
  - Podmínky (standardní text z šablony)
  - Místa pro podpisy
- Tlačítko "Pokračovat k podpisu"

**4. Digitální podpis (`app/(pwa)/contracts/[id]/sign/page.tsx`)**
- **Canvas pro podpis** — HTML5 Canvas, reagující na touch (finger drawing):
  - Bílé pozadí, černý tah, tloušťka 2-3px
  - Smooth drawing (interpolace bodů pro plynulé čáry)
  - Tlačítka: "Vymazat" (smaže canvas), "Potvrdit"
- **Flow podpisu**:
  1. "Podpis prodejce" — canvas + jméno pod ním + checkbox "Souhlasím s podmínkami smlouvy"
  2. Po potvrzení → "Podpis makléře" — stejný canvas
  3. Po obou podpisech → smlouva se uzamkne
- **Uložení podpisu**: canvas.toDataURL('image/png') → base64 string → uložit do databáze
- **Geolokace při podpisu**: zaznamenat GPS souřadnice (navigator.geolocation)
- **Timestamp**: datum a čas podpisu

**5. PDF generování**
- Po podpisu vygenerovat PDF smlouvy:
  - Použít knihovnu `@react-pdf/renderer` nebo `puppeteer` (na serveru) nebo `jspdf`
  - PDF obsahuje: kompletní text smlouvy + oba podpisy (jako obrázky) + datum + místo
  - Upload PDF na Cloudinary (nebo S3)
  - URL uložit do databáze
- Tlačítko "Odeslat emailem prodejci" — Resend API, příloha PDF
- Tlačítko "Stáhnout PDF"

**6. Offline podpora**
- Smlouvu lze vygenerovat a podepsat offline
- Data se uloží do IndexedDB store `contracts`
- PDF se vygeneruje a uploadne po připojení (background sync tag `sync-contracts`)
- V offline seznamu zobrazit "Čeká na sync"

**7. API routes**
- `POST /api/contracts` — vytvoření smlouvy
- `GET /api/contracts` — seznam smluv makléře
- `GET /api/contracts/[id]` — detail smlouvy
- `PUT /api/contracts/[id]/sign` — uložení podpisů
- `POST /api/contracts/[id]/pdf` — generování PDF
- `POST /api/contracts/[id]/send` — odeslání emailem

### Kontext:
- Závisí na: TASK-015 (layout, offline), TASK-016 (data vozů a kontaktů)
- Šablony smluv: vytvořit v `lib/contract-templates/` — TypeScript funkce vracející strukturovaný obsah smlouvy
- Právní texty smluv: placeholder texty, finální verze dodá právník
- Podpis: čistý HTML5 Canvas, žádná externí knihovna (nebo signature_pad pokud potřeba smooth drawing)
- PDF: preferovat serverové generování (API route) pro konzistentní výstup

### Očekávaný výsledek:
- Seznam smluv s filtry
- 4-krokové generování smlouvy (typ → vozidlo → údaje → preview)
- Digitální podpis prstem na displeji (prodejce + makléř)
- PDF generování s podpisy
- Odeslání emailem prodejci
- Offline: generování a podpis bez internetu, sync po připojení

---

## TASK-018: PWA AI Asistent — chat, knowledge base, kontextová nápověda
Priorita: 2
Stav: čeká
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Implementovat AI asistenta v PWA — plovoucí chat bubble dostupný z celé aplikace, natrénovaný na interní dokumenty Carmakler. Asistent pomáhá makléřům s jakýmkoliv dotazem v kontextu jejich práce.

**1. Plovoucí chat bubble (`components/pwa/AiAssistant.tsx`)**
- **Pozice**: pravý dolní roh, 16px od okraje, nad bottom navigation (bottom: cca 80px)
- **Vzhled**: kruhové tlačítko 56px, oranžový gradient (#F97316), ikona robota nebo chat bubliny (bílá), box-shadow
- **Animace**: subtle pulse animace když má AI novou odpověď nebo tip
- **Badge**: červená tečka pokud jsou nepřečtené zprávy/tipy
- Po kliknutí → otevře chat panel

**2. Chat panel**
- **Sliding panel** zdola (mobile-native feel), výška 85vh, border-radius nahoře
- **Nebo** fullscreen navigace na `/app/assistant`
- **Header**: "AI Asistent" + tlačítko zavřít (×) + tlačítko "Nová konverzace"
- **Chat UI**:
  - Zprávy makléře: bubliny vpravo, šedé pozadí
  - Zprávy AI: bubliny vlevo, bílé pozadí s oranžovým okrajem
  - Typing indicator (3 animované tečky) když AI generuje odpověď
  - Markdown rendering v odpovědích (tučné, seznamy, odkazy)
  - Auto-scroll na poslední zprávu
- **Input**: text input dole + tlačítko odeslat, placeholder "Zeptejte se na cokoliv..."
- **Quick actions** (nad inputem, horizontální scroll s chip tlačítky):
  - "Jak fotit auto?" / "Na co si dát pozor při prohlídce?" / "Jak poznat stočený tacho?" / "Jakou smlouvu použít?"
  - Quick actions se mění podle kontextu (na jakém kroku flow se makléř nachází)

**3. Knowledge base (`docs/knowledge-base/`)**
- Markdown soubory s interním know-how:
  - `smlouvy.md` — typy smluv, kdy kterou použít, povinné náležitosti, právní minimum
  - `foceni.md` — jak správně fotit auto pro inzerát, úhly, světlo, pozadí, nejčastější chyby, příklady
  - `prohlidka.md` — kompletní průvodce prohlídkou vozu, na co se zaměřit, red flags, jak poznat přetočený tachometr, stopy po havárii, přelakování
  - `cenotvorba.md` — co ovlivňuje cenu, jak odhadnout reálnou cenu, srovnání s trhem, tipy pro jednání s prodejcem
  - `pravni.md` — přepis vozu, STK, emise, ručení za vady, záruky, pojištění, DPH u ojetin
  - `procesy.md` — jak funguje Carmakler, schvalovací proces, provize, eskalace, pravidla, tipy pro úspěšné makléřování
- **Obsah**: placeholder texty (reálný obsah dodá tým), ale strukturované tak aby AI z nich mohl smysluplně odpovídat
- Každý soubor: nadpisy, sekce, konkrétní rady, příklady, FAQ formát

**4. API route (`app/api/assistant/chat/route.ts`)**
- POST endpoint: přijímá `{ message: string, context?: { step?: string, vehicleData?: object }, conversationId?: string }`
- **System prompt**: obsahuje roli ("Jsi AI asistent pro makléře Carmakler..."), pravidla (odpovídej česky, stručně, prakticky), a celý knowledge base (obsah markdown souborů)
- **Kontextové chování**: pokud je poslaný `context.step` (např. "inspection"), AI automaticky přizpůsobí odpověď danému kroku
- **Volání Claude API**: `@anthropic-ai/sdk`, model claude-sonnet (pro rychlost a cenu), max_tokens 1000
- **Konverzační paměť**: ukládat historii do databáze (nebo session), posílat posledních 10 zpráv jako kontext
- **Rate limiting**: max 50 zpráv/hodinu na makléře

**5. Generování popisu inzerátu (`app/api/assistant/generate-description/route.ts`)**
- POST endpoint: přijímá data vozu (značka, model, rok, km, stav, výbava, přednosti, prohlídka)
- System prompt: "Napiš atraktivní popis inzerátu pro auto portál. Česky, 3-5 odstavců, zdůrazni přednosti, profesionální ale přátelský tón."
- Vrací vygenerovaný text
- Napojeno na tlačítko "Vygenerovat popis AI" v Step 7 flow nabírání

**6. Nový Prisma model:**
```
model AiConversation {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  messages   Json     // Array of { role: 'user'|'assistant', content: string, timestamp: DateTime }
  context    Json?    // { step?: string, vehicleId?: string }
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

**7. Offline chování**
- Když je makléř offline: zobrazit v chatu zprávu "AI asistent potřebuje připojení k internetu. Připojte se a zkuste to znovu."
- Chat bubble zobrazit i offline (ale po kliknutí info o nutnosti připojení)
- Quick actions skrýt offline

### Kontext:
- Závisí na: TASK-015 (layout — plovoucí bubble musí být v layoutu)
- Claude API: `@anthropic-ai/sdk` — API klíč v env ANTHROPIC_API_KEY
- Knowledge base soubory: vytvořit `docs/knowledge-base/` s placeholder obsahem
- Generování popisu: napojit na Step 7 v TASK-016 (tlačítko "Vygenerovat popis AI")
- Chat panel: "use client" komponenta, streaming odpovědí (volitelné, nice-to-have)

### Očekávaný výsledek:
- Plovoucí chat bubble v celé PWA
- Chat rozhraní s AI asistentem (sliding panel nebo fullscreen)
- AI odpovídá na základě knowledge base (smlouvy, focení, prohlídky, právo, procesy)
- Kontextové odpovědi podle kroku ve flow
- Quick actions s nejčastějšími dotazy
- Generování popisů inzerátů z dat vozu
- Offline: informace o nutnosti připojení
- Knowledge base soubory s placeholder obsahem

---

<!-- Další úkoly přidávej pod tuto čáru ve stejném formátu -->
