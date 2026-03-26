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
Stav: hotovo
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

## TASK-016: PWA Nabrat auto — 7-krokový flow + post-submission + editace
Priorita: 1
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Implementovat kompletní 7-krokový flow "Nabrat auto" v `app/(pwa)/vehicles/new/`. Makléř projde kroky od kontaktu na prodejce po odeslání ke schválení. Celý flow funguje offline (data v IndexedDB z TASK-015), na každém kroku lze uložit draft a pokračovat později.

**Společné prvky pro všechny kroky:**
- **Progress bar** nahoře — "Step X / 7" + vizuální progress bar (oranžový)
- **Navigace** — šipka zpět (předchozí krok), křížek vpravo (uložit draft a odejít na Dashboard)
- **Tlačítko "Uložit draft"** dole na každém kroku — uloží aktuální stav do IndexedDB
- **Auto-save** — při odchodu z kroku se data automaticky uloží do draftu
- **Validace** — povinná pole označena *, validace při přechodu na další krok, ale neblokuje uložení draftu
- Všechny kroky sdílí jeden objekt draftu v IndexedDB, každý krok zapisuje do své sekce

**Struktura routování:**
```
/app/vehicles/new                 → Přehled kroků (rozcestník)
/app/vehicles/new/contact         → Step 1: Kontakt + navigace
/app/vehicles/new/inspection      → Step 2: Prohlídka vozu
/app/vehicles/new/vin             → Step 3: VIN zadání + dekódování
/app/vehicles/new/photos          → Step 4: Fotodokumentace
/app/vehicles/new/details         → Step 5: Údaje a výbava
/app/vehicles/new/pricing         → Step 6: Cena, provize a lokace
/app/vehicles/new/review          → Step 7: Kontrola a odeslání
/app/vehicles/new/success         → Potvrzení odeslání
```

---

**Step 1: Kontakt na prodejce + navigace (`/app/vehicles/new/contact`)**

Sloučený krok — kontaktní údaje, info o autě předem, navigace na místo a příjezd.

- **Zdroj leadu** — select: Vlastní kontakt / Inzerát (odkaz) / Lead z webu Carmakler / Doporučení / Jiné
  - Pokud "Inzerát" → zobrazit URL pole pro odkaz na původní inzerát (Sauto, Bazoš, FB Marketplace...)
  - Pokud "Lead z webu" → automaticky předvyplnit data z leadu (jméno, telefon, info o autě)
- **Kontaktní údaje prodejce:**
  - Jméno prodejce * (text input)
  - Telefon * (tel input, formát +420 XXX XXX XXX)
  - Akční tlačítka u telefonu: 📞 Zavolat (tel: link), 💬 SMS (sms: link), 📱 WhatsApp (wa.me link) — otevřou příslušnou appku
  - Email (email input, volitelné)
  - "Najít v kontaktech" — modální okno s hledáním v IndexedDB store `contacts`, pokud nalezeno → předvyplnit formulář
- **Předběžné info o autě** (co prodejce řekl po telefonu):
  - Značka + model (text nebo select, volitelné)
  - Rok (number, volitelné)
  - Přibližný nájezd km (number, volitelné)
  - Očekávaná cena prodejce (number, volitelné)
  - Poznámka (textarea — "říkal že 1. majitel, servis u Škodovky, drobná škrábka na dveřích")
- **Adresa a navigace:**
  - Adresa pro prohlídku * (text input)
  - Tlačítko "📍 Použít aktuální polohu" — Geolocation API, reverse geocoding na adresu
  - Poznámka k místu (textarea, volitelné, placeholder "Parkoviště za domem, vůz je stříbrná Octavia")
  - Termín schůzky — date picker + time picker
  - Tlačítka navigace: "🗺️ Otevřít v Mapy.cz", "🗺️ Google Maps" (intent linky s adresou)
  - Tlačítko "💬 Jsem na cestě" — otevře SMS s předpřipraveným textem: "Dobrý den, jsem na cestě. Budu u Vás přibližně za X minut."
- **Checklist před odjezdem** (skrytý po prvním použití, odkaz "Zobrazit checklist", stav v localStorage):
  - [ ] Mám nabitý telefon
  - [ ] Mám baterku (pro kontrolu podvozku)
  - [ ] Mám OBD čtečku (volitelné)
  - [ ] Prodejce potvrdil schůzku
- Tlačítko "✅ Jsem na místě — pokračovat na prohlídku" → Step 2

---

**Step 2: Prohlídka vozu (`/app/vehicles/new/inspection`)**

Kompletní profesionální prohlídka s checklistem a možností odmítnutí vozu.

- Text nahoře: "Projděte checklist a zaznamenejte stav vozu. Můžete přeskočit a vrátit se později."

- Sekce **Dokumenty** — checkboxy:
  - [ ] Velký technický průkaz
  - [ ] Malý technický průkaz (osvědčení)
  - [ ] Servisní kniha
  - [ ] Doklad o poslední STK
  - [ ] Doklad o měření emisí
  - [ ] Počet klíčů: input (1/2/3) — **1 klíč = zobrazit varování "Pouze 1 klíč — může indikovat problém (ztráta, krádež)"**

- Sekce **Exteriér** — vizuální kontrola:
  - Stav laku — 4 tlačítka (Výborný 😊 / Dobrý 😐 / Horší 😕 / Špatný 😢), jedno aktivní
  - Checkboxy:
    - [ ] Bez viditelných škrábanců a promáčklin
    - [ ] Bez koroze
    - [ ] Všechna skla bez prasklin
    - [ ] Světla funkční a nepoškozené
    - [ ] Pneumatiky v dobrém stavu (vzorek 4mm+)
    - [ ] Disky bez poškození
    - [ ] **Rovnoměrné spáry mezi panely** (nerovnoměrné = možná bouraná)
    - [ ] **Barva laku konzistentní** (odlišný odstín = přelakováno/opraveno)
    - [ ] Náhradní kolo / sada na opravu v kufru
  - "Přidat defekt s fotkou" — otevře kameru, po vyfocení dialog pro popis defektu (text input + select závažnosti: kosmetický/funkční/vážný), fotka + popis se uloží k draftu

- Sekce **Interiér**:
  - Stav interiéru — 4 tlačítka (stejné emoji)
  - Checkboxy:
    - [ ] Sedadla bez poškození
    - [ ] Čalounění/kůže v dobrém stavu
    - [ ] Palubní deska bez prasklin
    - [ ] Volant bez opotřebení
    - [ ] Vůně OK (nekuřácké, bez plísně)
    - [ ] Klimatizace funguje (foukání, chlazení)
    - [ ] Všechny ovládací prvky funkční
    - [ ] **Bez známek vytopení** (vlhkost pod koberci, zápach, mlžení skel, bílé fleky na čalounění)

- Sekce **Motor a technika** (statická kontrola):
  - Checkboxy:
    - [ ] Motor startuje bez problémů
    - [ ] Žádné neobvyklé zvuky při startu
    - [ ] Bez úniků oleje/kapalin pod vozem
    - [ ] Výfuk — kouř normální (ne bílý/modrý/černý)
    - [ ] Kontrolky na palubce OK (žádné varovné)
    - [ ] **Stav kapalin OK** (olej, chladicí, brzdová)
    - [ ] **Motorový prostor bez koroze** (blatníky zevnitř)
  - Tlačítko "Připojit OBD čtečku" — **fáze 2, v MVP neaktivní** s textem "Již brzy"

- Sekce **Testovací jízda** (volitelná ale doporučená):
  - Checkbox "Testovací jízda provedena" — pokud zaškrtnuto, rozbalí se:
    - [ ] Jízda plynulá, bez vibrací
    - [ ] Brzdy reagují správně, bez pulsování
    - [ ] Řízení přesné, bez vůle
    - [ ] Převodovka řadí plynule (manuál/automat)
    - [ ] Žádné klepání/rány z podvozku
    - [ ] Podvozek tichý (žádné skřípání v zatáčkách)
    - [ ] Auto jede rovně (neuhýbá do strany)
    - [ ] Klimatizace chladí i za jízdy
  - Pokud nebyla provedena → v kroku 7 (kontrola) zobrazit upozornění "Testovací jízda nebyla provedena"

- **Poznámky z prohlídky** — textarea, volný text
- **Celkový dojem** — 5 hvězdiček (klikací)

- **Odmítnutí vozu** — tlačítko "❌ Odmítnout vůz" (červený outline button):
  - Otevře modální okno:
    - Důvod odmítnutí — select: Špatný technický stav / Podezření na stočený tachometr / Podezření na nehodu / Nereálná cena prodejce / Chybějící dokumenty / Nespolehlivý prodejce / Jiné
    - Poznámka (textarea, volitelné)
  - Po potvrzení: draft se uloží se statusem "REJECTED_BY_BROKER", kontakt prodejce se uloží do CRM s poznámkou
  - Přesměrování na Dashboard s hláškou "Vůz odmítnut — důvod zaznamenán"
  - Důležité pro statistiky: kolik % vozů makléř odmítne a proč

- Tlačítko "Pokračovat na VIN" → Step 3

---

**Step 3: VIN zadání + dekódování (`/app/vehicles/new/vin`)**
- Nápověda "VIN najdete:" s 3 ikonkami/obrázky: dveře řidiče, palubka, technický průkaz
- **Ruční zadání VIN**:
  - Input pole, uppercase, max 17 znaků
  - Validace v reálném čase: povolené znaky (A-HJ-NPR-Z0-9), počet znaků, vizuální feedback (červená/zelená)
  - Po zadání 17 validních znaků → aktivuje se tlačítko "Dekódovat"
- Tlačítko "📷 Skenovat kamerou" — **neaktivní v MVP**, šedé s textem "Již brzy"
- Varování: "⚠️ VIN nelze po uložení změnit!"
- **VIN duplikát check** — po zadání VIN okamžitě ověřit přes API `/api/vin/check-duplicate`:
  - Pokud VIN už existuje v systému → zobrazit varování: "⚠️ Tento VIN je již v systému! Makléř: {jméno}, zadáno: {datum}, stav: {status}." Blokovat pokračování — makléř musí kontaktovat BackOffice.
  - Pokud neexistuje → pokračovat normálně
  - Offline: duplikát check přeskočit, provést při sync
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
- Tlačítko "Pokračovat na fotky" → Step 4

---

**Step 4: Fotodokumentace (`/app/vehicles/new/photos`)**
- Text: "Nafoťte vůz podle průvodce. Minimum 12 fotek, doporučeno 15-20."
- **Kategorie fotek** — každá s miniaturami (grid 4 sloupce):
  - **Exteriér** (min. 8): přední 3/4, zadní 3/4, levý bok, pravý bok, přední pohled, zadní pohled, detail světel, kola/pneumatiky detail
  - **Interiér** (min. 4): palubka, přední sedadla, zadní sedadla, kufr/zavazadlový prostor
  - **Motor** (min. 1): motorový prostor
  - **Důkazní fotky** (povinné):
    - 📸 **Tachometr/budíky** (povinná! — důkaz stavu km)
    - 📸 **VIN štítek** (povinná — důkaz že VIN souhlasí s vozem)
    - 📸 **Klíče** (kolik jich je — důkaz počtu klíčů)
  - **Doklady** (volitelné): TP, servisní kniha
  - **Defekty**: fotky nalezených defektů z kroku 2 + tlačítko "Přidat další"
- Každý slot: prázdný (šedý placeholder s názvem + ikonka fotoaparátu) nebo vyplněný (miniatura fotky s checkmark)
- Kliknutí na prázdný slot → **průvodce focením**:
  - Fullscreen kamera (MediaDevices API, facingMode: environment)
  - Overlay s obrysem auta v požadovaném úhlu (SVG/PNG overlay přes video stream)
  - Název pozice nahoře ("PŘEDNÍ 3/4 POHLED")
  - Tip dole (kontextový — u exteriéru: "Foťte za denního světla, vůz by měl být čistý", u tachometru: "Zapalte zapalování aby svítily budíky", u VIN: "Zaostřete na štítek, musí být čitelný")
  - Tlačítko vyfotit (velký kruh dole uprostřed)
  - Tlačítko přeskočit (vpravo dole) — NE u povinných fotek
  - Counter: "Fotka 1 / 8 (Exteriér)"
  - Po vyfocení: preview s možností "Použít" nebo "Vyfotit znovu"
- **Zpracování fotky při pořízení**:
  - Resize na max 1920px šířka
  - Kvalita JPEG 80%
  - Max velikost 2 MB
  - Uložení do IndexedDB store `images` jako blob
  - Vygenerování thumbnailů (200px) pro náhledy v UI
- **Progress bar** dole: "8 / 12 (minimum)" + vizuální bar
- Drag & drop pro změnu pořadí fotek (long press + drag na mobilu)
- Tap na existující fotku → možnosti: zobrazit fullscreen, smazat, označit jako hlavní
- Tlačítko "Pokračovat na údaje" (aktivní jen pokud min. 12 fotek včetně 3 povinných důkazních) → Step 5

---

**Step 5: Údaje a výbava (`/app/vehicles/new/details`)**
- **Základní údaje z VIN** (zobrazit jen pokud VIN byl dekódován, needitovatelné, 🔒):
  - Značka, Model, Varianta, Rok, Karoserie
  - Pokud VIN nebyl dekódován → tyto pole zobrazit jako editovatelné:
    - Značka * — select (Škoda, VW, BMW, Audi, Mercedes, Ford, Toyota, Hyundai, Kia, Renault, Peugeot, Citroën, Opel, Seat, Fiat, Dacia, Mazda, Honda, Volvo, Jeep, Land Rover, Porsche, Tesla, ostatní...)
    - Model * — text input (nebo select filtrovaný podle značky)
    - Varianta — text input (RS, GTI, M Sport, S-line...)
    - Rok výroby * — number (1990-2026)
    - Karoserie * — select: Sedan, Kombi, Hatchback, SUV, Liftback, Kupé, Kabriolet, MPV, Pick-up, Dodávka
- **Technické údaje** (z VIN pokud dostupné, jinak makléř vyplní):
  - Palivo * — select: Benzín / Nafta / LPG / CNG / Hybrid (HEV) / Plug-in hybrid (PHEV) / Elektro
  - Objem motoru — number input (ccm), např. 1984
  - Výkon * — number input (kW) + automatický přepočet na PS vedle ("= 180 kW / 245 PS")
  - Převodovka * — select: Manuální / Automatická / DSG / CVT
  - Pohon — select: Přední / Zadní / 4x4 (AWD)
  - Barva * — select: Bílá, Černá, Šedá/Stříbrná, Modrá, Červená, Zelená, Hnědá/Béžová, Zlatá/Champagne, Oranžová, Žlutá, Fialová, Jiná
  - Počet dveří — select: 3 / 5
  - Počet míst — select: 2 / 4 / 5 / 7 / 9
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
  - Předdefinované: 1. majitel, Servis u autorizovaného, Nekuřácké, Garážované, Nehavarované, Nový rozvod, Nové brzdy, Zimní pneu, Druhá sada kol, Nezávislé topení, Tažné zařízení
  - Kliknutím přidat/odebrat, zobrazené jako chips/tagy
  - "Přidat vlastní" — text input
- Tlačítko "Pokračovat" → Step 6

---

**Step 6: Cena, provize a lokace (`/app/vehicles/new/pricing`)**
- **Prodejní cena**:
  - Požadovaná cena * — number input, formátování s mezerami, suffix "Kč"
  - Checkbox "Cena k jednání"
  - **DPH** — radio: "Cena včetně DPH" / "Cena bez DPH (plátce)" / "Není plátce DPH"
    - Pokud "bez DPH" → zobrazit dopočítanou cenu s DPH: "= XXX Kč včetně DPH"
- **Provize makléře** (automatický výpočet, readonly zobrazení):
  - Vzorec: **5% z prodejní ceny, minimálně 25 000 Kč**
  - Zobrazení: "💰 Vaše provize: {vypočtená částka} Kč" (zelený box)
  - Příklady:
    - Cena 300 000 Kč → provize 25 000 Kč (5% = 15 000 < minimum)
    - Cena 750 000 Kč → provize 37 500 Kč (5%)
    - Cena 1 500 000 Kč → provize 75 000 Kč (5%)
  - Přepočítává se live při změně ceny
- **Lokace vozu**:
  - Město * — select s autocomplete (seznam českých měst) nebo text input
  - Městská část — text input (volitelné)
  - Přesná adresa — text input, label "pouze interně, nezobrazuje se veřejně"
- **Popis inzerátu**:
  - Textarea, min 50 znaků, placeholder s příkladem
  - Tlačítko "🤖 Vygenerovat popis AI" — volá API `/api/assistant/generate-description` s daty vozu (značka, model, rok, km, výbava, stav, přednosti), vrátí vygenerovaný text, makléř může upravit
  - (AI generování závisí na TASK-018, pokud není hotový → tlačítko neaktivní s textem "Již brzy")
- **Zdroj vozu** — radio: Soukromý prodejce / Autobazar / Dovoz
- **Možnost financování** — checkbox "Nabídnout financování kupujícímu" (pokud Carmakler spolupracuje s leasingovou společností — fáze 2, v MVP jen checkbox, bez integrace)
- Tlačítko "Pokračovat na kontrolu" → Step 7

---

**Step 7: Kontrola a odeslání (`/app/vehicles/new/review`)**
- **Náhled inzerátu** — vizuální preview jak bude vypadat na webu:
  - Hlavní fotka (carousel pokud víc fotek)
  - Název: ZNAČKA MODEL VARIANTA KAROSERIE
  - Parametry: motor výkon | převodovka | pohon
  - Rok • km • palivo
  - Cena (velký font) + "k jednání" badge pokud zaškrtnuto
  - Lokace
- **Checklist kompletnosti** — automaticky vyhodnotit:
  - ✅/❌ VIN zadán a dekódován
  - ✅/❌ Základní údaje kompletní (značka, model, rok, km, palivo, výkon, barva, stav, STK)
  - ✅/❌ Výbava vybrána (alespoň 1 položka)
  - ✅/❌ Fotografie (min. 12 nahrány, včetně tachometr + VIN štítek + klíče)
  - ✅/❌ Cena vyplněna
  - ✅/❌ Lokace vyplněna
  - ✅/❌ Popis napsán (min. 50 znaků)
  - ⚠️ Upozornění (nefatální): "Testovací jízda nebyla provedena" (pokud v kroku 2 nebyla zaškrtnuta)
  - Nesplněné položky červeně, kliknutí → navigace na příslušný krok
  - Tlačítko "Odeslat" aktivní jen pokud všechny ✅ jsou splněny (upozornění ⚠️ neblokují)
- **Shrnutí** — tabulka s klíčovými údaji:
  - Vozidlo, VIN, km, cena, DPH info
  - Provize makléře (zvýrazněně)
  - Počet fotek, počet položek výbavy
  - Lokace, prodejce, zdroj leadu
- **Dvě akce**:
  - "Uložit jako draft" (sekundární button) — uloží do IndexedDB, přesměruje na Dashboard
  - "Odeslat ke schválení" (primární button, oranžový) — online: POST na API `/api/vehicles` s kompletními daty + upload fotek na Cloudinary → po úspěchu přesměrování na potvrzení. Offline: uloží jako draft se syncStatus 'pending', registruje background sync, přesměruje na potvrzení s textem "Bude odesláno po připojení"

---

**Post-submission flow:**
- **Potvrzovací obrazovka** (`/app/vehicles/new/success`):
  - Ikona ✅, text "Odesláno ke schválení!"
  - "BackOffice zkontroluje váš inzerát. Obvykle do 24 hodin."
  - Zobrazení provize: "Při prodeji vyděláte: {provize} Kč"
  - Tlačítka: "Zpět na Dashboard", "Nabrat další auto"
- **V seznamu "Moje vozy"**: stav "Ke schválení" (žlutý badge)
- **Při schválení BackOffice**: push notifikace "Inzerát schválen: Škoda Octavia RS", stav se změní na "Aktivní" (zelený badge)
- **Při zamítnutí**: push notifikace "Inzerát zamítnut: Škoda Octavia RS", stav "Zamítnuto" (červený badge), v detailu vozu zobrazit:
  - Důvod zamítnutí (text od BackOffice)
  - Tlačítko "Opravit a odeslat znovu" → otevře editační flow s předvyplněnými daty

---

**Editace vozu (`/app/vehicles/[id]/edit`)**

- Otevře se jako **stejný 7-krokový flow** ale s předvyplněnými daty z databáze
- **Co lze editovat závisí na stavu vozu:**
  - **DRAFT** — vše editovatelné (kromě VIN pokud byl uložen)
  - **REJECTED** (zamítnutý) — vše editovatelné kromě VIN, zobrazit důvod zamítnutí nahoře s červeným bannerem
  - **PENDING** (ke schválení) — nelze editovat, zobrazit info "Čeká na schválení, nelze editovat"
  - **ACTIVE** (aktivní/publikovaný) — editovatelné: cena, popis, fotky (přidat/odebrat), výbava, lokace. Needitovatelné: VIN, značka, model, rok, km. Změny jdou znovu ke schválení.
  - **SOLD** (prodáno) — nelze editovat
- **VIN je VŽDY needitovatelný** po prvním uložení (🔒)
- Po odeslání editace: stejný post-submission flow (ke schválení → schváleno/zamítnuto)

---

### Kontext:
- Závisí na: TASK-015 (layout, offline infrastruktura, IndexedDB)
- Layout: `app/(pwa)/layout.tsx` s bottom nav
- Offline storage: `lib/offline-storage.ts` (třída OfflineStorage)
- Vehicle API: z TASK-014 (POST/PUT /api/vehicles), rozšířit o nová pole (palivo, výkon, barva, dveře, místa, DPH, zdroj leadu)
- VIN dekodér: implementovat `lib/vin-decoder.ts` + API route `/api/vin/decode`
- VIN duplikát check: API route `/api/vin/check-duplicate`
- Provize: výpočet na frontendu (5% z ceny, min 25 000 Kč), uložení do draftu
- Fotky: MediaDevices API pro kameru, canvas pro resize/kompresi, IndexedDB pro offline, Cloudinary pro upload
- Geolokace: navigator.geolocation pro aktuální polohu
- Auth: NextAuth session (role BROKER)
- AI generování popisu: závisí na TASK-018, pokud není → tlačítko neaktivní

### Očekávaný výsledek:
- Kompletní 7-krokový flow od kontaktu po odeslání
- Každý krok ukládá data do jednoho sdíleného draftu v IndexedDB
- Funkční offline — všechny kroky fungují bez internetu (kromě VIN dekódování, duplikát check a AI popisu)
- Zdroj leadu + předběžné info o autě pro tracking
- Profesionální prohlídka s testovací jízdou, kontrolou spár, vytopení, počtem klíčů
- Možnost odmítnutí vozu s důvodem
- VIN ruční zadání s validací + dekódování + duplikát check
- Povinné důkazní fotky: tachometr, VIN štítek, klíče
- Kompletní technické údaje: palivo, výkon, barva, dveře, místa
- Provize 5% min 25 000 Kč s live výpočtem
- DPH info pro firemní vozy
- Post-submission: stavy schvalování, zamítnutí s důvodem, oprava
- Editace vozu s pravidly podle stavu
- Background sync pro offline odeslání

---

## TASK-017: PWA Smlouvy — generování, předvyplnění, digitální podpis
Priorita: 2
Stav: hotovo
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
Stav: hotovo
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

## TASK-019: Inzertní platforma — kompletní digitální inzerce vozidel
Priorita: 2
Stav: zpracovává se
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Digitální inzertní platforma pro prodej vozidel — veřejný portál kde inzerují makléři Carmakler, partnerské autobazary (TASK-031) i soukromí prodejci. Inzerce je **marketingový nástroj** — přitahuje traffic na platformu a konvertuje soukromé inzerenty do makléřského modelu (upsell). Veškerá komunikace u soukromých inzerátů probíhá přes Carmakler. Partnerské bazary mají přímý kontakt.

Kompletní specifikace je v sekci "Očekávaný výsledek" níže. Detailní zadání obsahuje:

- **3 úrovně inzerce:** Soukromý (1 zdarma/60 dní), Bazar ADVERTISER (10 zdarma), Partner (TASK-031, neomezeno + badge + TOP v ceně)
- **Hybridní kontakt:** soukromé přes Carmakler formulář, partneři přímý kontakt (telefon, adresa)
- **6-krokový flow:** VIN → údaje → výbava → fotky → cena+popis → preview (sdílená logika s TASK-016)
- **Portál inzerenta** (`/moje-inzeraty`): dashboard, správa, dotazy, zprávy, statistiky
- **Kupující funkce:** oblíbené ❤️, hlídací pes (i bez registrace email-only), quick questions, historie dotazů, porovnání (TASK-028)
- **Inteligentní makléřský upsell:** dynamické bannery (14/30/45 dní bez prodeje), follow-up emaily, case studies
- **Badge systém:** 🟠 Ověřeno makléřem > 🔵 Ověřený partner > ⚪ Soukromý, + ⭐ TOP, 🏷️ Zlevněno, ✅ STK
- **Kalkulačka splátek** na detailu vozu (affiliate monetizace financování)
- **CEBIA prověrka historie** na detailu (499 Kč/report, marže ~200 Kč, makléřská auta zdarma)
- **Kauční rezervace** (5 000 Kč, 48h, Stripe, jen makléřská/partnerská)
- **XML/CSV import** pro bazary (Sauto/TipCars/vlastní formát, cron auto-sync)
- **XML export** na Sauto/TipCars/Bazoš (generované feedy)
- **Quick filtry:** "SUV do 500k", "Elektro", "Pro rodinu", "První auto do 200k"
- **Flagování:** podezřele nízká cena, duplicitní VIN, fotky bez EXIF, klíčová slova
- **Response SLA:** 48h odpověď, auto-deaktivace po 7 dnech nereagování
- **Moderace:** soukromé auto-schválení (ex-post), flagované → BackOffice, nahlášení kupujícím
- **Monetizace:** TOP 199 Kč/7d, prodloužení 99 Kč/30d, balíček 1990 Kč/30 inz., CEBIA 499 Kč, affiliate, partnerství 4990 Kč/měs.
- **Role:** ADVERTISER (soukromý/bazar s IČO), BUYER (registrovaný kupující)
- **Modely:** Listing, ListingImage, Inquiry (se statusy NEW/READ/REPLIED/CLOSED), Watchdog (i bez userId — email-only), Favorite, Reservation, CebiaReport, ListingFeedConfig, ListingImportLog
- **30+ API routes** pro kompletní platformu (listings CRUD, inquiries, favorites, watchdogs, reservations, CEBIA, feeds import/export)

### Kontext:
- Závisí na: TASK-002 (web layout), TASK-007 (katalog — rozšířit filtry), TASK-008 (detail vozu — rozšířit), TASK-013 (auth — nové role ADVERTISER, BUYER), TASK-028 (cenová historie, podobné vozy, porovnání, timeline), TASK-031 (partneři — badge, profil)
- Auth: rozšířit NextAuth o role ADVERTISER a BUYER, middleware pro `/moje-inzeraty/*` a `/muj-ucet/*`
- VIN dekodér: sdílený `lib/vin-decoder.ts`
- Fotky: Cloudinary upload, EXIF check pro flagování
- Platby: Stripe (TOP, prodloužení, kauce, CEBIA report)
- Email: Resend (dotazy, hlídací pes, follow-up upsell, response SLA remindery)
- CEBIA API: B2B přístup pro prověrku historie vozu
- ARES API: ověření IČO autobazarů (`https://ares.gov.cz/`)
- Feed import: `lib/listing-import.ts` (Sauto XML, TipCars XML, vlastní CSV)
- Feed export: XML generátory `/api/feeds/sauto.xml`, `/api/feeds/tipcars.xml`
- Cron: watchdog matching, reservation expiry (48h), listing expiry (60 dní), upsell follow-up (14/30/45 dní), response SLA check

### Očekávaný výsledek:
- 3 úrovně inzerce (soukromý 1 zdarma/60 dní, bazar 10 zdarma, partner neomezeno)
- 6-krokový flow podání inzerátu s VIN dekódováním a AI popisem
- Hybridní kontakt (přes Carmakler pro soukromé, přímý pro partnery/bazary)
- Inteligentní makléřský upsell (dynamické bannery po 14/30/45 dnech + follow-up emaily)
- Portál inzerenta (dashboard, správa, dotazy, zprávy, statistiky)
- Funkce pro kupující (oblíbené ❤️, hlídací pes, quick questions, historie dotazů)
- Badge systém (makléř 🟠 / partner 🔵 / soukromý ⚪ / TOP ⭐ / zlevněno 🏷️ / STK ✅)
- Quick filtry ("SUV do 500k", "Elektro", "Pro rodinu")
- Kalkulačka splátek na detailu vozu (affiliate monetizace)
- CEBIA prověrka historie vozu (monetizace 499 Kč/report, marže ~200 Kč)
- Kauční rezervace (5 000 Kč, 48h, Stripe, jen makléřská/partnerská auta)
- XML/CSV import inzerátů pro bazary (feed config, cron auto-sync)
- XML export na Sauto/TipCars/Bazoš (generované feedy)
- Automatické flagování podezřelých inzerátů (nízká cena, duplicita VIN, fotky bez EXIF)
- Response time SLA (48h, auto-deaktivace po 7 dnech nereagování)
- Monetizace: TOP 199 Kč/7d, prodloužení 99 Kč/30d, balíček 1990 Kč/30 inz., CEBIA 499 Kč, affiliate financování/pojištění
- Registrace ADVERTISER (soukromý/bazar s IČO/ARES) a BUYER (oblíbené, hlídací pes)
- Nové modely: Listing, ListingImage, Inquiry, Watchdog, Favorite, Reservation, CebiaReport, ListingFeedConfig, ListingImportLog
- 30+ API routes pro kompletní inzertní platformu

---

## TASK-020: Eshop autodíly — e-shop s použitými a aftermarket díly
Priorita: 3
Stav: zpracovává se
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Vytvořit e-shop s autodíly integrovaný do platformy Carmakler. Tři zdroje dílů: (1) použité díly z vrakovišť (partneři přidávají přes partnerský portál TASK-031 nebo jednoduchou PWA), (2) nové aftermarket/druhovýrobní díly od velkých dodavatelů (katalogový import XML/CSV feed) a (3) manuálně přidané díly. Zákazník najde díl podle vozu (VIN nebo výběr značka/model/rok), objedná a nechá doručit.

**1. Struktura eshopu (`app/(web)/dily/`):**

- **Homepage eshopu** (`/dily`):
  - Vyhledávání: "Zadejte VIN nebo vyberte vůz" → filtruje kompatibilní díly
  - Rychlý výběr: Značka → Model → Rok → Motorizace (kaskádové selecty)
  - Kategorie dílů: Motor, Převodovka, Karoserie, Interiér, Elektro, Podvozek, Brzdy, Výfuk, Klimatizace, Osvětlení, Ostatní
  - Akční nabídky / nejprodávanější / nově přidané
  - Banner: "Máte vrakoviště? Přidávejte díly přes naši aplikaci" → odkaz na registraci dodavatele

- **Katalog dílů** (`/dily/katalog`):
  - Filtrování: kategorie, značka vozu, model, rok, cena od-do, stav (použitý/nový/aftermarket), dostupnost, lokalita dodavatele
  - Řazení: cena, datum přidání, relevance
  - Karta dílu: fotka, název, kompatibilita (pro jaký vůz), cena, stav (Použitý/Nový/Aftermarket badge), dodavatel, dostupnost

- **Detail dílu** (`/dily/[slug]`):
  - Galerie fotek
  - Název, popis, stav (detailní — "demontováno z vozu s 85 000 km, plně funkční")
  - Kompatibilita: seznam vozů se kterými je díl kompatibilní (značka + model + rok od-do)
  - Cena + DPH info
  - Dodavatel: jméno/firma, lokalita, hodnocení, počet prodaných dílů
  - Dostupnost: skladem / na objednávku / rezervováno
  - Tlačítka: "Přidat do košíku", "Kontaktovat dodavatele" (dotaz)
  - Podobné díly / další díly od tohoto dodavatele

- **Košík a objednávka:**
  - Košík: seznam dílů, množství, celková cena
  - Objednávkový flow:
    1. Košík (kontrola)
    2. Doručení: osobní odběr u dodavatele / zásilkovna / PPL / Česká pošta
    3. Platba: bankovní převod / kartou (Stripe) / dobírka
    4. Potvrzení objednávky
  - Po objednávce: email potvrzení, notifikace dodavateli
  - Sledování stavu objednávky (přijata → zpracovává se → odesláno → doručeno)

**2. PWA pro vrakoviště/dodavatele (`app/(pwa-parts)/`):**

Jednoduchá mobilní aplikace pro dodavatele dílů — co nejrychlejší přidání dílu.

- **Registrace dodavatele:**
  - Nová role: PARTS_SUPPLIER
  - Registrace: firma/jméno, IČO (ověření ARES), telefon, email, adresa (lokace vrakoviště/skladu)
  - Ověření: BackOffice schvaluje nové dodavatele

- **Dashboard dodavatele** (`/parts/`):
  - Statistiky: aktivní díly, prodané tento měsíc, tržby, průměrná cena
  - Rychlé přidání dílu (velké CTA tlačítko)
  - Objednávky k vyřízení (nové, balení, odeslané)
  - Moje díly (seznam s filtry)

- **Přidání dílu — maximálně jednoduché (3 kroky):**

  **Krok 1: Fotka + rozpoznání**
  - Otevře kameru → makléř/dodavatel vyfotí díl
  - Min. 1 fotka, doporučeno 3-5
  - (Fáze 2: AI rozpoznání dílu z fotky → automatický návrh kategorie a názvu)

  **Krok 2: Údaje**
  - Název dílu * (text, nebo select z katalogu běžných dílů: "Přední nárazník", "Alternátor", "Levé zpětné zrcátko"...)
  - Kategorie * (select: Motor, Karoserie, Interiér, Elektro, Podvozek, Brzdy...)
  - Stav * — select: Plně funkční / Funkční s vadou (popsat) / Na díly (nefunkční)
  - Kompatibilita *:
    - Značka (select) → Model (select) → Rok od-do (range input)
    - Možnost přidat víc kompatibilních vozů (+ Přidat další vůz)
    - Nebo: VIN zdrojového vozu (z kterého byl díl demontován) → systém doplní kompatibilitu
  - Popis (textarea — "Demontováno z vozu s 85 000 km, bez poškození, plně funkční")
  - OEM číslo dílu (volitelné, text — pro přesnou identifikaci)

  **Krok 3: Cena a publikace**
  - Cena * (number, Kč)
  - DPH: s DPH / bez DPH
  - Množství na skladě (number, default 1)
  - Doručení: osobní odběr / zásilkovna / PPL / všechny možnosti
  - Preview → Publikovat

- **Hromadné přidání** (pro větší vrakoviště):
  - Import z Excel/CSV: název, kategorie, cena, kompatibilita, popis
  - Šablona ke stažení

**3. Velcí dodavatelé aftermarket dílů — katalogový import:**

Eshop musí umožnit napojení na velké velkoobchody s náhradními díly (Auto Kelly, Elit, StAHL, APM Automotive, AD Partner atd.) kteří dodávají tisíce SKU nových aftermarket/druhovýrobních dílů.

- **Nová role: WHOLESALE_SUPPLIER** (velkoobchodní dodavatel)
  - Schvaluje BackOffice/Admin
  - Jiný flow než vrakoviště — nepřidává díly ručně, ale importuje katalog

- **Katalogový feed — import:**
  - Podpora formátů: XML (TecDoc standard, vlastní formáty), CSV, JSON
  - Konfigurace feedu v admin panelu:
    - URL feedu (odkud stahovat)
    - Formát (XML/CSV/JSON)
    - Mapování polí (název → name, cena → price, číslo dílu → oemNumber...)
    - Frekvence aktualizace: denně / týdně / ručně
    - Markup/přirážka: +X% nebo +X Kč na cenu od dodavatele (marže Carmakler)
  - **Import worker** (`lib/feed-import.ts`):
    - Stáhne feed z URL
    - Parsuje podle konfigurace
    - Pro každý díl:
      - Vytvoří/aktualizuje Part záznam
      - partType = NEW nebo AFTERMARKET
      - supplierId = velkoobchodní dodavatel
      - Kompatibilitu mapuje přes TecDoc čísla nebo OEM čísla na vozidla
      - Stav: ACTIVE pokud skladem, INACTIVE pokud nedostupný
    - Logování: kolik dílů přidáno/aktualizováno/deaktivováno/chyba
  - **Cron job:** automatický import podle nastavené frekvence (Vercel Cron)
  - **Ruční spuštění:** tlačítko "Importovat nyní" v admin panelu

- **TecDoc kompatibilita:**
  - TecDoc je standard pro identifikaci autodílů a kompatibility s vozy
  - Číslo dílu (OEM/aftermarket) → seznam kompatibilních vozů
  - Fáze 1: jednoduchá kompatibilita přes OEM číslo + manuální mapování značka/model/rok
  - Fáze 2: integrace TecDoc API pro přesnou kompatibilitu (placená licence)

- **Cenotvorba a marže:**
  - Nákupní cena od dodavatele (z feedu)
  - Prodejní cena = nákupní + markup (nastavitelný per dodavatel nebo per kategorie)
  - Markup konfigurace v admin panelu:
    - Globální default: +25%
    - Per dodavatel: přepsat (Auto Kelly +20%, Elit +30%)
    - Per kategorie: přepsat (brzdy +15%, karoserie +35%)
    - Priorita: kategorie > dodavatel > globální

- **Zobrazení v eshopu:**
  - Aftermarket díly se zobrazují společně s použitými díly v katalogu
  - Badge: "Nový díl" (zelený) vs "Použitý" (šedý) vs "Aftermarket" (modrý)
  - Filtr: stav = Použitý / Nový / Aftermarket / Vše
  - U aftermarket dílů: OEM číslo, výrobce dílu, záruka
  - Dodavatel: zobrazit jako "Carmakler Shop" (ne jméno velkoobchodu — zákazník nemusí vědět)

- **Objednávka aftermarket dílů:**
  - Zákazník objedná přes eshop (stejný flow jako u použitých dílů)
  - Systém automaticky přepošle objednávku velkoobchodnímu dodavateli (email nebo API)
  - Dodavatel pošle díl přímo zákazníkovi (drop-shipping) nebo na sklad Carmakler
  - Alternativně: Carmakler objedná u dodavatele → přebalí → pošle zákazníkovi

- **Admin panel — správa dodavatelů feedů (`/admin/feeds`):**
  - Seznam napojených dodavatelů
  - Konfigurace feedu (URL, formát, mapování, frekvence, markup)
  - Poslední import: datum, počet dílů, chyby
  - Tlačítko "Importovat nyní"
  - Log importů (historie)

- **Nové Prisma modely / rozšíření:**
```
model FeedConfig {
  id              String   @id @default(cuid())
  supplierId      String
  supplier        User     @relation(fields: [supplierId], references: [id])
  name            String                    // "Auto Kelly katalog"
  feedUrl         String                    // URL feedu
  feedFormat      FeedFormat                // XML, CSV, JSON
  fieldMapping    Json                      // { name: "nazev", price: "cena_s_dph", ... }
  updateFrequency FeedFrequency             // DAILY, WEEKLY, MANUAL
  markupType      String @default("PERCENT") // PERCENT nebo FIXED
  markupValue     Float @default(25)         // 25% nebo 25 Kč
  isActive        Boolean @default(true)
  lastImportAt    DateTime?
  lastImportCount Int?
  lastImportErrors Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model FeedImportLog {
  id          String   @id @default(cuid())
  feedConfigId String
  feedConfig  FeedConfig @relation(fields: [feedConfigId], references: [id])
  status      String    // SUCCESS, PARTIAL, FAILED
  totalItems  Int
  created     Int       // Nově přidané
  updated     Int       // Aktualizované
  deactivated Int       // Deaktivované (už nejsou ve feedu)
  errors      Int
  errorDetails Json?    // [{ line, error }]
  duration    Int       // Doba importu v ms
  createdAt   DateTime @default(now())
}

enum FeedFormat {
  XML
  CSV
  JSON
}

enum FeedFrequency {
  DAILY
  WEEKLY
  MANUAL
}
```

Rozšíření Part modelu:
- Přidat pole `wholesalePrice` (Int?) — nákupní cena od velkoobchodu
- Přidat pole `feedConfigId` (String?) — odkaz na feed ze kterého díl přišel
- Přidat pole `externalId` (String?) — ID dílu v systému dodavatele
- Přidat pole `manufacturer` (String?) — výrobce dílu (TRW, Bosch, LUK...)
- Přidat pole `warranty` (String?) — záruka ("24 měsíců")

- **Nové API routes:**
  - `POST /api/feeds` — vytvoření feed konfigurace (admin)
  - `GET /api/feeds` — seznam feedů (admin)
  - `PUT /api/feeds/[id]` — editace konfigurace
  - `POST /api/feeds/[id]/import` — spustit import ručně
  - `GET /api/feeds/[id]/logs` — log importů
  - `POST /api/cron/feed-import` — automatický import (cron)

- **Správa objednávek:**
  - Seznam objednávek: nové (zvýrazněné), zpracovávané, odeslané, dokončené
  - Detail objednávky: díl, kupující, doručení, platba
  - Akce: potvrdit objednávku → zabalit → odeslat (zadat tracking číslo) → hotovo
  - Push notifikace na novou objednávku

- **Offline podpora:**
  - Přidání dílu funguje offline (fotky + údaje do IndexedDB)
  - Sync po připojení

**3. Nové Prisma modely:**
```
model Part {
  id            String   @id @default(cuid())
  supplierId    String
  supplier      User     @relation(fields: [supplierId], references: [id])

  name          String       // "Přední nárazník"
  category      PartCategory // MOTOR, BODYWORK, INTERIOR, ELECTRO, SUSPENSION, BRAKES, EXHAUST, AC, LIGHTS, OTHER
  description   String?
  oemNumber     String?      // OEM číslo dílu

  condition     PartCondition // FUNCTIONAL, FUNCTIONAL_WITH_DEFECT, FOR_PARTS
  conditionNote String?       // Popis vady pokud FUNCTIONAL_WITH_DEFECT

  // Kompatibilita
  compatibility Json          // [{ brand, model, yearFrom, yearTo }]
  sourceVin     String?       // VIN vozu ze kterého byl demontován

  // Cena
  price         Int
  vatIncluded   Boolean @default(true)
  quantity      Int @default(1)

  // Doručení
  deliveryOptions Json       // ["PICKUP", "ZASILKOVNA", "PPL", "CESKA_POSTA"]

  // Typ
  partType      PartType     // USED, NEW, AFTERMARKET

  // Stav
  status        PartStatus   // ACTIVE, INACTIVE, SOLD, RESERVED
  views         Int @default(0)

  images        PartImage[]
  orders        OrderItem[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model PartImage {
  id      String @id @default(cuid())
  partId  String
  part    Part   @relation(fields: [partId], references: [id])
  url     String
  order   Int
}

model Order {
  id            String   @id @default(cuid())
  buyerId       String
  buyer         User     @relation(fields: [buyerId], references: [id])

  items         OrderItem[]

  // Doručení
  deliveryMethod String   // PICKUP, ZASILKOVNA, PPL, CESKA_POSTA
  deliveryAddress String?
  trackingNumber String?

  // Platba
  paymentMethod  String   // BANK_TRANSFER, CARD, COD
  paymentStatus  PaymentStatus // PENDING, PAID, REFUNDED

  // Stav
  status        OrderStatus  // NEW, CONFIRMED, PACKING, SHIPPED, DELIVERED, CANCELLED

  totalPrice    Int
  note          String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model OrderItem {
  id      String @id @default(cuid())
  orderId String
  order   Order  @relation(fields: [orderId], references: [id])
  partId  String
  part    Part   @relation(fields: [partId], references: [id])
  quantity Int
  price   Int
}

enum PartCategory {
  MOTOR
  TRANSMISSION
  BODYWORK
  INTERIOR
  ELECTRO
  SUSPENSION
  BRAKES
  EXHAUST
  AC
  LIGHTS
  OTHER
}

enum PartCondition {
  FUNCTIONAL
  FUNCTIONAL_WITH_DEFECT
  FOR_PARTS
}

enum PartType {
  USED
  NEW
  AFTERMARKET
}

enum PartStatus {
  ACTIVE
  INACTIVE
  SOLD
  RESERVED
}

enum OrderStatus {
  NEW
  CONFIRMED
  PACKING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
}
```

**4. API routes:**
- `POST /api/parts` — přidání dílu
- `GET /api/parts` — katalog s filtrací
- `GET /api/parts/[id]` — detail dílu
- `PUT /api/parts/[id]` — editace
- `DELETE /api/parts/[id]` — smazání
- `GET /api/parts/compatible?vin=XXX` — díly kompatibilní s VIN
- `POST /api/orders` — vytvoření objednávky
- `GET /api/orders` — seznam objednávek (kupující/dodavatel)
- `PUT /api/orders/[id]/status` — změna stavu objednávky
- `POST /api/parts/import` — hromadný import z CSV

**DOPLNĚNO — Kritické funkce které v původním zadání chyběly:**

**0) Propracovaný vyhledávací systém:**

Eshop musí mít víc než jen filtry — potřebujeme chytrý, intuitivní search.

**Smart Search — "piš jak mluvíš":**
- Zákazník napíše přirozeně: "brzdové destičky octavia 2017 přední"
- Systém parsuje na: kategorie=brzdy, značka=Škoda, model=Octavia, rok=2017, pozice=přední
- Implementace: tokenizace + slovník synonym (destičky = brzdové destičky, okýnko = boční sklo...) + fuzzy matching
- Fallback: pokud neparsuje → fulltext search přes název + popis + OEM čísla

**Autocomplete s náhledy (instant results):**
- Při psaní do searchbaru (debounce 200ms, min 2 znaky) okamžitě zobrazí dropdown:
  - **Díly:** miniatura + název + cena ("Brzdový kotouč TRW DF4276 — 890 Kč")
  - **Kategorie:** "Brzdy pro Škoda Octavia (45 dílů)"
  - **Vozy:** "Škoda Octavia III 2017 — 234 dílů skladem"
  - **OEM čísla:** "1K0615301AC — 3 alternativy od 350 Kč"
- Max 3 výsledky per sekce, celkem max 12 řádků
- Klávesnice: šipky pro navigaci, Enter pro výběr
- API: `GET /api/parts/autocomplete?q=XXX`

**Vizuální výběr dílu (klikací auto):**
- Na homepage eshopu a stránce kategorie: interaktivní obrázek auta
- SVG/canvas s klikatelnými zónami (kapota, dveře, světla, nárazník, kola, interiér, motor...)
- Zákazník klikne na část auta → přesměruje na kategorii dílů pro tu část
- 3 pohledy: zepředu, zboku, zezadu (tabs nebo swipe)
- Pokud má zákazník vybraný vůz (garáž nebo filtr) → zobrazí obrys jeho auta
- Mobile-friendly: dostatečně velké touch zóny

**Foto vyhledávání (fáze 2 — AI):**
- Tlačítko "📷 Vyfotit díl" vedle searchbaru
- Zákazník vyfotí starý/poškozený díl
- AI (Claude Vision nebo Google Cloud Vision) rozpozná:
  - Typ dílu (nárazník, světlo, zrcátko...)
  - Pokud viditelné: OEM číslo, výrobce
- Nabídne kompatibilní díly z katalogu
- Fallback: "Nepodařilo se rozpoznat. Zkuste popsat díl textově."
- API: `POST /api/parts/visual-search` (upload foto → AI → results)

**"Nenašli jste díl?" poptávka (burza dílů):**
- Na stránce výsledků pokud 0 nálezů: prominent CTA "Nenašli jste? Poptejte u vrakovišť"
- Formulář:
  - Co hledáte * (text — "Přední nárazník")
  - Pro jaký vůz * (značka/model/rok nebo VIN)
  - Popis (volitelné — barva, stav, poznámka)
  - Kontakt (email *, telefon)
- Po odeslání:
  - Systém rozešle poptávku všem aktivním vrakovištím (push + email)
  - Vrakoviště vidí poptávku v portálu → může nabídnout díl + cenu + fotku
  - Zákazník dostane email s nabídkami → vybere si → objedná
- Prisma model:
```
model PartRequest {
  id          String @id @default(cuid())
  description String
  vehicleBrand String?
  vehicleModel String?
  vehicleYear  Int?
  vin          String?
  buyerEmail   String
  buyerPhone   String?
  buyerName    String?
  status       PartRequestStatus // OPEN, OFFERS_RECEIVED, ORDERED, CLOSED, EXPIRED
  offers       PartRequestOffer[]
  expiresAt    DateTime  // +14 dní
  createdAt    DateTime @default(now())
}

model PartRequestOffer {
  id          String @id @default(cuid())
  requestId   String
  request     PartRequest @relation(fields: [requestId], references: [id])
  supplierId  String
  supplier    User @relation(fields: [supplierId], references: [id])
  partName    String
  price       Int
  condition   String    // FUNCTIONAL, WITH_DEFECT
  description String?
  imageUrl    String?
  status      String    // OFFERED, ACCEPTED, REJECTED
  createdAt   DateTime @default(now())
}

enum PartRequestStatus { OPEN OFFERS_RECEIVED ORDERED CLOSED EXPIRED }
```

**Srovnání alternativ:**
- Když zákazník hledá konkrétní díl (např. "brzdový kotouč Octavia") → nad výsledky sekce "Porovnání alternativ":
  - Tabulka: Originál | Aftermarket A | Aftermarket B | Použitý
  - Řádky: Cena, Výrobce, Záruka, Stav, Hodnocení, Dostupnost
  - Zvýraznění: nejlevnější (zelená cena), nejlepší hodnocení (hvězdičky)
- Automaticky seskupené přes křížové reference (OEM číslo → všechny alternativy)

**Historie hledání + "Hledali jste naposledy":**
- Pro přihlášené: uložit posledních 10 hledání (v DB)
- Pro nepřihlášené: localStorage posledních 5
- Na homepage eshopu po přihlášení: sekce "Hledali jste naposledy" s rychlými linky
- V searchbaru: při focus (prázdný input) zobrazit poslední hledání jako suggestions

**Cross-sell: Díly na detailu vozu v katalogu (/nabidka/[slug]):**
- Na detailu vozu v katalogu aut (ne eshopu) dole sekce: **"Díly pro tento vůz skladem"**
- Systém automaticky matchne značka+model+rok vozu → kompatibilní díly z eshopu
- Zobrazí 4-6 dílů (nejpopulárnější kategorie: brzdy, filtry, světla, karoserie)
- Karta dílu: fotka, název, cena, badge (Nový/Použitý), dostupnost
- CTA: "Zobrazit všech {X} dílů pro tento vůz →" (link na `/dily/[značka]/[model]/[rok]`)
- Funguje pro makléřské, partnerské i soukromé inzeráty
- **Proč:** kupující vidí že díly jsou dostupné → menší strach z údržby → vyšší konverze prodeje auta + traffic z katalogu do eshopu zdarma

API routes pro vyhledávání:
```
GET  /api/parts/autocomplete?q=XXX     — instant autocomplete (díly, kategorie, vozy, OEM)
GET  /api/parts/smart-search?q=XXX     — smart search (parsování přirozeného jazyka)
POST /api/parts/visual-search          — foto vyhledávání (upload → AI → results)
POST /api/part-requests                — poptávka dílu (burza)
GET  /api/part-requests                — seznam poptávek (dodavatel)
POST /api/part-requests/[id]/offer     — nabídka na poptávku (dodavatel)
GET  /api/parts/compare?oemNumber=XXX  — srovnání alternativ přes OEM
GET  /api/parts/for-vehicle?brand=X&model=Y&year=Z — díly pro konkrétní vůz (cross-sell)
```

---

**A) Split objednávky podle dodavatele (SubOrder):**

Zákazník může mít v košíku díly od 3 různých dodavatelů — každý s jiným doručením. Jeden Order se rozpadne na SubOrders per dodavatel.

```
Order (zákazník vidí jednu objednávku)
├── orderNumber: "CM-2026-00123"
├── buyerEmail, buyerName, buyerPhone (guest nebo BUYER)
├── buyerAddress
├── paymentMethod: CARD | TRANSFER | COD
├── paymentStatus, totalPrice, stripePaymentIntentId
├── guestToken (pro guest sledování)
│
├── SubOrder A (vrakoviště Brno — osobní odběr)
│   ├── supplierId, deliveryMethod: PICKUP, deliveryPrice: 0
│   ├── status: NEW → CONFIRMED → READY_FOR_PICKUP → COMPLETED
│   ├── items: [OrderItem: přední nárazník, 3 200 Kč]
│   └── supplierPayout: 3 200 * 0.85 = 2 720 Kč (po 15% provizi)
│
├── SubOrder B (Carmakler Shop = aftermarket Auto Kelly — zásilkovna)
│   ├── deliveryMethod: ZASILKOVNA, deliveryPrice: 89 Kč
│   ├── trackingNumber, zasilkovnaPointId
│   ├── status: NEW → CONFIRMED → SHIPPED → DELIVERED
│   ├── items: [OrderItem: brzdový kotouč TRW, 1 890 Kč]
│   └── supplierPayout: N/A (Carmakler sám prodává, marže v ceně)
│
└── SubOrder C (vrakoviště Praha — PPL)
    ├── deliveryMethod: PPL, deliveryPrice: 149 Kč
    ├── trackingNumber
    ├── items: [OrderItem: zpětné zrcátko, 1 120 Kč]
    └── supplierPayout: 1 120 * 0.85 = 952 Kč
```

Pravidla:
- Jeden checkout, jedna platba, více doručení (zákazník vybírá dopravu per dodavatel)
- Každý SubOrder má vlastní stav (nezávislý fulfillment)
- Stav Order = nejhorší stav SubOrders
- Aftermarket díly = Carmakler je prodejce (zákazník nekomunikuje s Auto Kelly)
- Použité díly = vrakoviště je prodejce, Carmakler zprostředkovatel (15% provize)

**B) Guest checkout (bez registrace — P0):**

- Zákazník NEMUSÍ vytvářet účet pro objednání
- Zadá jen: email, telefon, jméno, adresa doručení
- Po objednávce dostane email s unikátním odkazem na sledování (`/objednavky/sledovani/[token]`)
- Po objednávce nabídka: "Chcete sledovat budoucí objednávky? Vytvořte si účet." (volitelné)
- Registrovaný zákazník = sdílená role BUYER z TASK-019

**C) Rezervace unikátních dílů při checkoutu:**

Použité díly jsou unikáty (quantity=1). Bez rezervace dva zákazníci objednají totéž.

- Díl se rezervuje při **zahájení checkoutu** (ne při přidání do košíku)
- Rezervace trvá **30 minut**
- Po zaplacení → SOLD (definitivní)
- Po 30 min bez platby → automaticky uvolněno (cron/background job)
- Databázová transakce s optimistickým zamykáním (race condition prevence)
- Pokud je díl RESERVED a jiný zákazník chce přidat → "Díl je dočasně rezervován"

**D) Vrácení a reklamace (zákonná povinnost):**

- **Odstoupení od smlouvy (14 dní):** zákonný nárok u distančního prodeje
  - Platí jen pro díly s doručením (ne osobní odběr)
  - Použité díly: vracení pokud nebyl namontován/změněn
  - Náklady na zpětné zaslání nese zákazník
  - Flow: zákazník klikne "Chci vrátit" → vybere důvod → systém generuje RMA číslo → zákazník odešle zpět → dodavatel zkontroluje → schválí → Stripe refund

- **Reklamace (12-24 měsíců záruky):**
  - Nové díly: 24 měsíců
  - Použité díly: 12 měsíců (zákon pro e-shop)
  - Flow: zákazník klikne "Reklamovat" → fotky závady + popis → dodavatel + Carmakler BackOffice řeší → 30 dní na vyřízení

```
model Return {
  id          String @id @default(cuid())
  subOrderId  String
  subOrder    SubOrder @relation(fields: [subOrderId], references: [id])
  type        ReturnType   // WITHDRAWAL (odstoupení) | COMPLAINT (reklamace)
  reason      String
  description String?
  images      Json?        // URLs fotek
  rmaNumber   String @unique
  status      ReturnStatus // REQUESTED → SHIPPED_BACK → RECEIVED → APPROVED → REFUNDED | REJECTED
  refundAmount Int?
  resolution  String?
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum ReturnType { WITHDRAWAL COMPLAINT }
enum ReturnStatus { REQUESTED SHIPPED_BACK RECEIVED APPROVED REFUNDED REJECTED }
```

**E) Výpočet dopravy podle rozměrů/hmotnosti:**

- Přidat do Part modelu: `weight` (Int? v gramech), `dimensions` (Json? — délka/šířka/výška v cm)
- Velké díly (>30 kg nebo >120 cm) → zásilkovna nedostupná, jen PPL/ČP nebo osobní odběr
- Dopravné se počítá per SubOrder (ne per díl)
- Integrace API: Zásilkovna widget (výběr výdejního místa), PPL/ČP paušální sazby

**F) Vyhledávání podle OEM čísla + křížové reference:**

Zákazník často zná OEM číslo dílu. Zadá "1K0615301AC" → vidí originální díl + levnější aftermarket alternativy.

```
model PartCrossReference {
  id                String @id @default(cuid())
  oemNumber         String       // Originální OEM číslo
  aftermarketNumber String       // Aftermarket číslo
  manufacturer      String       // Výrobce (TRW, Bosch, LUK...)
  partId            String?      // Propojení na Part pokud existuje
  part              Part?        @relation(fields: [partId], references: [id])
  @@index([oemNumber])
  @@index([aftermarketNumber])
}
```

- Feed import automaticky plní křížové reference
- Na detailu dílu sekce "Alternativní čísla dílu"
- Vyhledávání hledá přes OEM i aftermarket čísla

**G) Stripe Connect pro marketplace platby (fáze 2):**

- Carmakler = Stripe Connect platform
- Vrakoviště = connected accounts
- Zákazník platí Carmakler → po DELIVERED se automaticky vytvoří Stripe Transfer na vrakoviště (minus 15%)
- Aftermarket díly: Carmakler sám nakupuje a prodává (žádný Transfer, marže je v ceně)

**H) SEO struktura:**

URL:
```
/dily                                    → hlavní landing
/dily/motor                              → kategorie
/dily/skoda                              → značka
/dily/skoda/octavia                      → značka + model
/dily/skoda/octavia/2017                 → značka + model + rok
/dily/predni-naraznik-skoda-octavia-abc  → detail dílu (slug)
```

- Title, meta description, H1 optimalizované per stránka
- JSON-LD Product schema na detailu dílu (name, image, price, availability, brand, sku)
- Dynamická sitemap.xml se všemi díly a kategoriemi
- Breadcrumbs (JSON-LD BreadcrumbList)
- Automatické alt texty fotek: "Přední nárazník Škoda Octavia III 2017 - použitý, funkční"
- FAQ sekce na kategoriích (FAQ schema markup)

**I) Zákaznický účet (sdílený BUYER z TASK-019):**

- Historie objednávek
- Sledování stavu objednávek
- Uložené adresy (doručení, fakturační)
- **"Moje garáž"** — zákazník uloží své auto (VIN nebo značka/model/rok) → při návštěvě vidí jen kompatibilní díly
- Oblíbené díly (wishlist)
- Notifikace "opět skladem"
- Hodnocení dílů/dodavatelů (jen po nákupu, 1-5 hvězd + text)

**J) Rozšíření Prisma modelů:**

Nové modely:
- `SubOrder` — dílčí objednávka per dodavatel
- `Return` + `ReturnImage` — vrácení a reklamace
- `PartCrossReference` — křížové reference OEM čísel
- `SupplierReview` — hodnocení dodavatelů
- `CustomerGarage` — uložené auto zákazníka

Rozšíření Part:
- `weight` Int? (gramy), `dimensions` Json? (cm), `slug` String unique
- `wholesalePrice` Int?, `feedConfigId` String?, `externalId` String?, `manufacturer` String?, `warranty` String?

Rozšíření Order:
- `orderNumber` String unique, `guestEmail`, `guestName`, `guestPhone`, `guestToken` String unique
- `buyerId` optional (guest checkout)

**K) Rozšířené API routes:**

```
// Díly
GET    /api/parts/search?q=OEM_CISLO    — vyhledávání OEM + křížové reference
GET    /api/parts/[id]/alternatives     — aftermarket alternativy

// Objednávky (rozšíření)
GET    /api/orders/track/[token]        — sledování pro guest (bez auth)
POST   /api/orders/[id]/returns         — žádost o vrácení/reklamaci
GET    /api/orders/[id]/returns         — stav vrácení

// SubOrders
PUT    /api/suborders/[id]/status       — změna stavu (dodavatel)
PUT    /api/suborders/[id]/tracking     — zadání tracking čísla

// Doprava
POST   /api/shipping/calculate          — výpočet dopravného per SubOrder
GET    /api/shipping/zasilkovna-points  — proxy na Zásilkovna API

// Zákaznický účet
POST   /api/garage                      — uložení auta do garáže
GET    /api/garage                      — moje auta
POST   /api/parts/[id]/notify-stock     — notifikace "opět skladem"
POST   /api/suppliers/[id]/review       — hodnocení dodavatele

// Stripe Connect
POST   /api/stripe/connect/onboard     — onboarding dodavatele na Stripe Connect
POST   /api/stripe/connect/payout      — výplata dodavateli
```

### Kontext:
- Závisí na: TASK-013 (auth — sdílená role BUYER), TASK-019 (kupující účet — sdílený), TASK-031 (partneři vrakoviště = dodavatelé dílů)
- Stripe Connect: Carmakler = platform, vrakoviště = connected accounts
- Zásilkovna API: widget pro výběr výdejního místa + API pro generování zásilek
- VIN dekodér: sdílený pro filtrování kompatibilních dílů
- Fotky: Cloudinary
- Email: Resend (potvrzení, stav, tracking, vrácení, hodnocení)
- SEO: next/metadata, JSON-LD, sitemap.xml
- Cron: expirace rezervací (30 min), feed import, notifikace "opět skladem"

### Očekávaný výsledek:
- Veřejný eshop s autodíly (katalog, filtrování, detail, košík, checkout)
- **3 zdroje dílů:** použité (vrakoviště), nové aftermarket (feed import), manuální
- **Guest checkout** bez registrace (P0)
- **Split objednávky** per dodavatel (SubOrder) s nezávislým fulfillmentem
- **Rezervace unikátních dílů** (30 min timeout při checkoutu)
- **Vrácení/reklamace** (14 dní odstoupení, 12-24 měsíců záruka)
- VIN kompatibilita + OEM vyhledávání + křížové reference
- **Výpočet dopravy** podle rozměrů/hmotnosti + Zásilkovna widget
- Stripe Connect pro automatické výplaty dodavatelům (minus 15%)
- SEO optimalizace (URL struktura, JSON-LD, sitemap, meta)
- "Moje garáž" — uložené auto zákazníka pro filtrování
- Hodnocení dodavatelů (po nákupu)
- Hromadný import CSV + XML feed import od velkoobchodů (Auto Kelly, Elit...)
- Partnerský portál pro vrakoviště (TASK-031) + PWA pro rychlé přidání dílů
- Offline přidávání dílů
- 25+ API routes

---

## TASK-021: Marketplace — investiční platforma pro flipping aut (VIP)
Priorita: 3
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Vytvořit uzavřenou VIP investiční platformu uvnitř Carmakler. Ověření dealeři (autoservisy, dovozci) nabízí investiční příležitosti — auta k nákupu a opravě se ziskovým potenciálem. Ověření investoři financují tyto příležitosti. Carmakler zajišťuje celý proces: auto koupí na svou firmu, dealer opraví, Carmakler prodá a vyplatí podíly.

**Byznys model:**
- Dealer najde auto k flipu (např. koupě 200k, oprava 80k, prodej 350k = zisk 70k)
- Investoři (jeden nebo víc) zainvestují nákup + opravu
- Auto se koupí na firmu Carmakler (bezpečnost pro investora)
- Dealer auto opraví ve svém servisu
- Auto se prodá přes Carmakler platformu
- **Dělení zisku: 40% investor, 40% dealer, 20% Carmakler**
- Pokud víc investorů → výnos poměrově podle vkladu (kdo dal 60% kapitálu, dostane 60% z investorského podílu = 24% celkového zisku)

**1. Přístup a ověřování:**

- **Uzavřená platforma** — přístupná pouze po schválení:
  - Nová role: INVESTOR, VERIFIED_DEALER
  - Na webu: landing page "Carmakler Marketplace" s vysvětlením konceptu + tlačítko "Požádat o přístup"

- **Žádost o přístup — Dealer:**
  - Formulář: firma, IČO, DIČ, adresa servisu, popis činnosti, reference (kolik aut ročně opraví/prodá), fotky servisu
  - Ověření BackOffice: kontrola IČO (ARES), osobní návštěva/videocall, prověrka referencí
  - Po schválení: přístup do dealer dashboardu

- **Žádost o přístup — Investor:**
  - Formulář: jméno, email, telefon, proč chce investovat, zkušenosti s investováním, plánovaný objem investice
  - KYC (Know Your Customer): občanský průkaz (upload), adresa, datum narození
  - Souhlas s podmínkami investování (právní dokument)
  - Po schválení BackOffice: přístup do investor dashboardu

**2. Dealer Dashboard (`app/(web)/marketplace/dealer/`):**

- **Moje příležitosti** — seznam nabídek k investování:
  - Aktivní (čeká na investory)
  - Plně financované (investoři se složili)
  - V opravě (auto koupeno, dealer opravuje)
  - Na prodej (opraveno, inzerováno)
  - Prodáno (dokončeno, výplata)
- **Přidat příležitost:**
  - Krok 1: **Auto k nákupu**
    - Odkud (odkaz na inzerát, aukci, nebo popis)
    - Značka, model, rok, km, stav, VIN (pokud známý)
    - Fotky současného stavu (min. 5)
    - Nákupní cena *
  - Krok 2: **Plán opravy**
    - Seznam plánovaných oprav (textarea nebo strukturovaný seznam):
      - Položka opravy, odhadovaná cena, doba trvání
      - Např.: "Výměna rozvodů — 15 000 Kč — 1 den"
      - "Lakování předních dveří — 8 000 Kč — 2 dny"
    - Celkové náklady na opravu (automatický součet)
    - Odhadovaná doba opravy (dny/týdny)
  - Krok 3: **Prodejní odhad**
    - Odhadovaná prodejní cena po opravě *
    - Zdůvodnění (srovnání s trhem, odkaz na podobné inzeráty)
    - Automatický výpočet:
      - Celková investice: nákup + oprava = X Kč
      - Očekávaný zisk: prodej - investice = Y Kč
      - ROI: Y/X * 100 = Z%
      - **Dělení zisku:**
        - Investoři (40%): Y * 0.4 = ... Kč
        - Dealer (40%): Y * 0.4 = ... Kč
        - Carmakler (20%): Y * 0.2 = ... Kč
  - Krok 4: **Odeslání ke schválení** — BackOffice prověří odhady, schválí/zamítne

- **Správa probíhajícího flipu:**
  - Timeline/progress: Financováno → Koupeno → V opravě → Opraveno → Na prodej → Prodáno → Vyplaceno
  - Fotky průběhu opravy (dealer uploaduje fotky jak auto opravuje — budování důvěry investorů)
  - Reporting: skutečné náklady vs odhad
  - Po prodeji: finální kalkulace, potvrzení výplaty

**3. Investor Dashboard (`app/(web)/marketplace/investor/`):**

- **Dostupné příležitosti** — seznam schválených investičních příležitostí:
  - Karta příležitosti:
    - Fotky auta (před)
    - Značka, model, rok
    - Nákupní cena, náklady na opravu, odhadovaná prodejní cena
    - **Očekávaný ROI** (zvýrazněně)
    - **Očekávaný výnos pro investora** (zvýrazněně)
    - Dealer: jméno, hodnocení, počet dokončených flipů, úspěšnost
    - Stav financování: "Financováno 120 000 / 280 000 Kč (43%)" + progress bar
    - Počet investorů: "2 investoři"
    - Tlačítko "Investovat"
  - Filtrování: ROI, cena investice, značka, dealer

- **Investování do příležitosti:**
  - Kliknutí na "Investovat" → modal:
    - Shrnutí příležitosti
    - Celková potřebná investice: X Kč
    - Už financováno: Y Kč (Z%)
    - Zbývá: X - Y Kč
    - **Kolik chcete investovat:** number input (min. 10 000 Kč, max. zbývající částka)
    - Automatický výpočet: "Při prodeji za odhadovanou cenu vyděláte: {výnos} Kč ({ROI}%)"
    - Pokyny k platbě: bankovní převod na účet Carmakler s variabilním symbolem
    - Checkbox: "Souhlasím s podmínkami investování"
    - Tlačítko "Potvrdit investici"
  - Po potvrzení platby (BackOffice ověří příchod peněz): investice se zobrazí v portfoliu

- **Moje portfolio:**
  - Aktivní investice — seznam investovaných příležitostí s aktuálním stavem:
    - Auto, dealer, investováno (Kč), podíl (%), stav (koupeno/v opravě/na prodej)
    - Fotky průběhu opravy (od dealera)
    - Očekávaný výnos
  - Dokončené investice — historie:
    - Auto, dealer, investováno, výnos, ROI, doba trvání
  - **Statistiky:**
    - Celkem investováno (Kč)
    - Celkem vyděláno (Kč)
    - Průměrné ROI (%)
    - Počet dokončených flipů
    - Peníze aktuálně v oběhu (investované, čeká na prodej)

- **Výplata:**
  - Po prodeji auta: BackOffice provede finální kalkulaci
  - Investor vidí: skutečná prodejní cena, skutečné náklady, skutečný zisk, jeho podíl
  - Výplata na bankovní účet investora (ten zadal při registraci)
  - Stav: Čeká na výplatu → Vyplaceno + datum

**4. BackOffice správa marketplace (`app/(admin)/marketplace/`):**

- Schvalování žádostí o přístup (dealeři, investoři)
- Schvalování investičních příležitostí
- Správa probíhajících flipů (timeline, finance)
- Potvrzení příchozích plateb od investorů
- Finální kalkulace po prodeji
- Výplata podílů
- Přehled: celkový objem investic, aktivní flipy, průměrné ROI, úspěšnost

**5. Landing page marketplace (`app/(web)/marketplace/`):**

- **Veřejná stránka** (pro neregistrované):
  - Hero: "Investujte do aut s ověřeným výnosem"
  - Jak to funguje (3-4 kroky s ikonkami):
    1. Ověřený dealer najde výhodné auto
    2. Vy zainvestujete nákup a opravu
    3. Dealer auto profesionálně opraví
    4. Auto se prodá, vy dostanete podíl na zisku
  - Statistiky: "Průměrné ROI 18%", "23 dokončených flipů", "98% úspěšnost"
  - Sekce pro dealery: "Máte autoservis? Přidejte se"
  - Sekce pro investory: "Chcete aby vaše peníze pracovaly?"
  - FAQ: nejčastější dotazy
  - CTA: "Požádat o přístup"

**6. Nové Prisma modely:**
```
model FlipOpportunity {
  id            String   @id @default(cuid())
  dealerId      String
  dealer        User     @relation("DealerFlips", fields: [dealerId], references: [id])

  // Auto
  brand         String
  model         String
  year          Int
  mileage       Int?
  vin           String?
  currentCondition String  // Popis současného stavu
  sourceUrl     String?    // Odkaz na inzerát/aukci

  // Finance
  purchasePrice   Int      // Nákupní cena
  repairCost      Int      // Odhadované náklady na opravu
  estimatedSalePrice Int   // Odhadovaná prodejní cena
  actualSalePrice Int?     // Skutečná prodejní cena (po prodeji)
  actualRepairCost Int?    // Skutečné náklady na opravu

  // Oprava
  repairPlan    Json       // [{ item, cost, duration }]
  repairDuration Int?      // Odhadovaná doba opravy (dny)

  // Stav
  status        FlipStatus // PENDING_APPROVAL, APPROVED, FUNDING, FUNDED, PURCHASED, IN_REPAIR, REPAIRED, FOR_SALE, SOLD, PAYOUT_PENDING, COMPLETED, REJECTED

  // Investice
  investments   Investment[]
  totalFunded   Int @default(0)
  totalNeeded   Int        // purchasePrice + repairCost

  // Fotky
  beforeImages  Json       // URLs fotek před opravou
  repairImages  Json?      // URLs fotek průběhu opravy
  afterImages   Json?      // URLs fotek po opravě

  // Propojení s prodejem
  vehicleId     String?    // Propojení s Vehicle po nákupu
  listingId     String?    // Propojení s Listing při prodeji

  // Timeline
  approvedAt    DateTime?
  fundedAt      DateTime?
  purchasedAt   DateTime?
  repairStartAt DateTime?
  repairEndAt   DateTime?
  listedAt      DateTime?
  soldAt        DateTime?
  payoutAt      DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Investment {
  id              String   @id @default(cuid())
  investorId      String
  investor        User     @relation(fields: [investorId], references: [id])
  opportunityId   String
  opportunity     FlipOpportunity @relation(fields: [opportunityId], references: [id])

  amount          Int      // Investovaná částka
  sharePercent    Float    // Podíl na investorské části (automaticky vypočtený)

  // Výplata
  expectedReturn  Int?     // Očekávaný výnos
  actualReturn    Int?     // Skutečný výnos
  paidOut         Boolean @default(false)
  paidOutAt       DateTime?

  // Platba
  paymentReference String? // Variabilní symbol
  paymentConfirmed Boolean @default(false)
  paymentConfirmedAt DateTime?

  status          InvestmentStatus // PLEDGED, PAID, ACTIVE, PAYOUT_PENDING, COMPLETED, CANCELLED

  createdAt       DateTime @default(now())
}

enum FlipStatus {
  PENDING_APPROVAL
  APPROVED
  FUNDING
  FUNDED
  PURCHASED
  IN_REPAIR
  REPAIRED
  FOR_SALE
  SOLD
  PAYOUT_PENDING
  COMPLETED
  REJECTED
}

enum InvestmentStatus {
  PLEDGED       // Investor řekl že investuje
  PAID          // Platba přijata
  ACTIVE        // Auto v procesu
  PAYOUT_PENDING // Čeká na výplatu
  COMPLETED     // Vyplaceno
  CANCELLED     // Zrušeno
}
```

**7. API routes:**
- `POST /api/marketplace/opportunities` — vytvoření příležitosti (dealer)
- `GET /api/marketplace/opportunities` — seznam příležitostí (filtry: status, ROI, cena)
- `GET /api/marketplace/opportunities/[id]` — detail
- `PUT /api/marketplace/opportunities/[id]` — aktualizace (stav, fotky opravy)
- `POST /api/marketplace/opportunities/[id]/approve` — schválení (admin)
- `POST /api/marketplace/investments` — investice do příležitosti
- `GET /api/marketplace/investments` — moje investice (investor)
- `PUT /api/marketplace/investments/[id]/confirm-payment` — potvrzení platby (admin)
- `POST /api/marketplace/opportunities/[id]/payout` — výplata podílů (admin)
- `GET /api/marketplace/stats` — statistiky (admin, dealer, investor)
- `POST /api/marketplace/apply` — žádost o přístup

**8. Právní poznámky:**
- Celý marketplace musí být konzultován s právníkem — může spadat pod regulaci ČNB (investiční platformy)
- Na webu NESLIBOVAT konkrétní výnosy — používat formulace "očekávaný", "odhadovaný"
- Podmínky investování: disclaimer o riziku (i když auto je reálné aktivum s hodnotou)
- GDPR: KYC dokumenty šifrovat, ukládat bezpečně
- Smlouvy: investiční smlouva mezi investorem a Carmakler s.r.o.

### Kontext:
- Uzavřená sekce, přístupná jen po ověření
- Auth: nové role INVESTOR, VERIFIED_DEALER v NextAuth
- Platby: bankovní převod (v MVP), Stripe (fáze 2)
- Propojení s Vehicle/Listing modely pro prodej flipnutého auta
- Email: Resend (notifikace o stavech, výplatách)
- Admin panel: rozšířit o marketplace správu

### Očekávaný výsledek:
- Landing page marketplace s vysvětlením konceptu
- Registrace a ověřování dealerů a investorů
- Dealer dashboard: přidání příležitosti (4 kroky), správa flipů, fotky průběhu
- Investor dashboard: dostupné příležitosti, investování, portfolio, statistiky, výplaty
- BackOffice správa: schvalování, potvrzení plateb, finální kalkulace, výplaty
- Dělení zisku 40/40/20 s podporou více investorů na jednu příležitost
- Timeline/progress tracking celého flipu
- Právní framework (disclaimery, podmínky, smlouvy)

---

## TASK-022: Onboarding makléře — pozvánkový link, registrace, školení
Priorita: 1
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Implementovat kompletní onboarding nového makléře — od pozvánky manažerem po aktivaci účtu.

**1. Pozvánkový systém:**

- **Manažer v admin panelu** klikne "Pozvat makléře" → formulář:
  - Email makléře * (validace)
  - Jméno (volitelné, pro personalizaci emailu)
- Systém vygeneruje **unikátní pozvánkový token** (UUID), platný 7 dní
- Odešle email přes Resend:
  - Předmět: "Pozvánka do týmu Carmakler"
  - Obsah: "Ahoj {jméno}, {manažer} tě zve do týmu Carmakler. Klikni sem pro registraci."
  - CTA tlačítko → `carmakler.cz/registrace?token=XXX`
- Pozvánka se uloží do DB:
  - Token, email, managerId, regionId, status (PENDING/USED/EXPIRED), expiresAt, createdAt

**2. Registrační flow přes pozvánku:**

- Makléř klikne na link → stránka `/registrace?token=XXX`:
  - Ověření tokenu (platný, nepoužitý, neexpirovaný)
  - Neplatný token → "Pozvánka vypršela nebo byla již použita. Kontaktujte svého manažera."
  - Platný token → registrační formulář:
    - Email (předvyplněný z pozvánky, readonly)
    - Heslo * + potvrzení hesla
    - Jméno * + příjmení *
    - Telefon *
    - IČO * (makléři jsou na živnostenský list)
    - Souhlas s podmínkami (checkbox)
- Po registraci:
  - User se vytvoří s rolí BROKER, status ONBOARDING
  - Automaticky se přiřadí pod manažera z pozvánky
  - Automaticky se zařadí do regionu manažera
  - Token se označí jako USED
  - Přesměrování na onboarding flow

**3. Onboarding flow (`/app/onboarding`):**

Nový makléř po registraci musí projít onboardingem. Dokud nedokončí, nemůže nabírat auta (routes chráněné middleware — status ONBOARDING → redirect na onboarding).

- **Krok 1: Profil** — vyplnit:
  - Profilová fotka * (upload nebo kamera)
  - Bio (textarea, krátké představení)
  - Specializace — checkboxy: Osobní vozy, SUV, Dodávky, Luxusní vozy, Elektromobily
  - Města kde působím — multi-select nebo tagy
  - Bankovní účet pro výplatu provizí * (IBAN)

- **Krok 2: Dokumenty** — nahrát:
  - Živnostenský list nebo výpis z ARES (PDF/foto)
  - Občanský průkaz (foto přední + zadní strana) — pro ověření identity
  - (Smlouva s Carmakler — tu dodá systém k podpisu v kroku 4)

- **Krok 3: Školení** — interaktivní průvodce (série karet/slidů):
  - **Jak funguje Carmakler** (5 slidů) — co děláme, jak funguje provize, exkluzivní smlouva
  - **Jak nabrat auto** (5 slidů) — 7 kroků, co kontrolovat, jak fotit
  - **Jak jednat s prodejcem** (3 slidy) — tipy, red flags, komunikace
  - **Právní minimum** (3 slidy) — exkluzivita, odpovědnost, GDPR
  - Na konci: **Kvíz** (5-10 otázek, multiple choice):
    - "Kolik je minimální provize?" → 25 000 Kč
    - "Co znamená exkluzivní smlouva?" → prodejce nesmí prodávat jinde
    - "Kolik fotek je minimum?" → 12
    - "Může prodejce auto používat během inzerce?" → Ano
    - "Co uděláte když zjistíte stočený tachometr?" → Odmítnout vůz
  - Musí odpovědět správně min. 80% → jinak opakování
  - Obsah školení bere z AI knowledge base (docs/knowledge-base/)

- **Krok 4: Smlouva s Carmakler** — digitální podpis:
  - Zobrazí se smlouva o spolupráci (Carmakler ↔ makléř na IČO)
  - Makléř podepíše prstem na displeji (stejný mechanismus jako TASK-017)
  - PDF se vygeneruje a uloží

- **Krok 5: Čeká na schválení**
  - Status makléře: ONBOARDING → PENDING
  - Manažer dostane notifikaci: "Nový makléř {jméno} dokončil onboarding, čeká na schválení"
  - Manažer v admin panelu zkontroluje profil, dokumenty, kvíz → schválí
  - Po schválení: status PENDING → ACTIVE
  - Makléř dostane push + email: "Váš účet byl aktivován! Můžete začít nabírat auta."

**4. Nové Prisma modely:**
```
model Invitation {
  id          String   @id @default(cuid())
  email       String
  name        String?
  token       String   @unique
  managerId   String
  manager     User     @relation("ManagerInvitations", fields: [managerId], references: [id])
  regionId    String
  region      Region   @relation(fields: [regionId], references: [id])
  status      InvitationStatus  // PENDING, USED, EXPIRED
  expiresAt   DateTime
  createdAt   DateTime @default(now())
}

enum InvitationStatus {
  PENDING
  USED
  EXPIRED
}
```

- Rozšíření User modelu: přidat status ONBOARDING, pole `icoNumber`, `bankAccount`, `documents` (Json — URLs nahraných dokumentů), `onboardingCompleted` (Boolean), `quizScore` (Int)

**5. API routes:**
- `POST /api/invitations` — vytvoření pozvánky (manažer/admin)
- `GET /api/invitations/[token]` — ověření tokenu
- `GET /api/invitations` — seznam pozvánek manažera
- `PUT /api/onboarding/profile` — uložení profilu
- `POST /api/onboarding/documents` — upload dokumentů
- `POST /api/onboarding/quiz` — odeslání kvízu, vyhodnocení
- `POST /api/onboarding/contract` — podpis smlouvy
- `PUT /api/admin/brokers/[id]/activate` — aktivace makléře (manažer/admin)

### Kontext:
- Závisí na: TASK-013 (auth), TASK-015 (PWA layout), TASK-017 (podpis smlouvy — sdílený mechanismus)
- Email: Resend pro odesílání pozvánek
- Middleware: rozšířit o status ONBOARDING → redirect na /app/onboarding
- Knowledge base: docs/knowledge-base/ z TASK-018 pro školení
- Dokumenty: upload na Cloudinary

### Očekávaný výsledek:
- Manažer může pozvat makléře přes email
- Makléř se zaregistruje přes pozvánkový link, automaticky pod manažerem a v regionu
- 5-krokový onboarding: profil → dokumenty → školení s kvízem → smlouva → schválení
- Makléř nemůže nabírat auta dokud nedokončí onboarding a není schválen
- Manažer schvaluje nové makléře

---

## TASK-023: Manažerský dashboard — správa makléřů, schvalování, statistiky
Priorita: 1
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Implementovat manažerský pohled v admin panelu — manažer vidí a spravuje jen své makléře, schvaluje jejich inzeráty, sleduje statistiky a výkon.

**1. Manažerský dashboard (`app/(admin)/manager/page.tsx`):**

- **Přehled týmu:**
  - Počet makléřů pod manažerem
  - Celkové provize týmu tento měsíc
  - Celkem aktivních vozů týmu
  - Celkem prodejů týmu tento měsíc
- **TOP makléři** — žebříček: jméno, počet prodejů, provize, konverzní poměr
- **Čeká na schválení** — počet inzerátů ke schválení (badge)
- **Novinky** — poslední aktivity makléřů (kdo co nabral, prodal, odmítl)

**2. Seznam makléřů manažera (`app/(admin)/manager/brokers/page.tsx`):**

- Tabulka: jméno, foto, telefon, počet aktivních aut, prodeje tento měsíc, provize, stav (active/pending/onboarding)
- Proklik na detail makléře:
  - Profil (editovatelný manažerem)
  - Vozidla makléře (seznam s filtry)
  - Provize (historie)
  - Aktivita (timeline: co kdy udělal)
  - Statistiky: průměrná doba prodeje, konverze, oblíbené značky
- **Pozvat makléře** — tlačítko, formulář s emailem
- **Deaktivovat makléře** — se záznamem důvodu, jeho auta se přeřadí (na manažera nebo jiného makléře)

**3. Schvalování inzerátů (`app/(admin)/manager/approvals/page.tsx`):**

Manažer schvaluje inzeráty svých makléřů. BackOffice schvaluje inzeráty manažerů.

- **Fronta ke schválení** — seznam inzerátů se stavem PENDING od makléřů pod tímto manažerem
- Každý inzerát zobrazí:
  - Náhled (foto, název, cena)
  - Kdo zadal a kdy
  - Checklist kvality:
    - ✅/❌ VIN dekódován
    - ✅/❌ Min. 12 fotek (včetně tachometr, VIN, klíče)
    - ✅/❌ Prohlídka provedena (celkový dojem 3+)
    - ✅/❌ Testovací jízda provedena
    - ✅/❌ Cena odpovídá trhu (± 15% od průměru podobných)
    - ✅/❌ Popis min. 50 znaků
    - ✅/❌ Exkluzivní smlouva podepsána
  - Proklik na plný detail vozu
- **Akce:**
  - ✅ **Schválit** → stav PENDING → ACTIVE, publikace na web, notifikace makléři
  - ❌ **Vrátit k dopracování** — s poznámkou (textarea): "Doplň fotku motoru" / "Cena je moc vysoká" → stav zůstane PENDING, makléř dostane notifikaci s důvodem
  - 🚫 **Zamítnout** — s důvodem → stav REJECTED, makléř dostane notifikaci
- **Schvalovací flow (hierarchie):**
  - Makléřův inzerát → schvaluje jeho Manažer
  - Manažerův inzerát → schvaluje BackOffice
  - BackOffice/Admin → automaticky schváleno (nebo vzájemně)

**4. Editace inzerátů makléřů:**

- Manažer může editovat inzeráty svých makléřů:
  - Úprava ceny (s důvodem → change log)
  - Úprava popisu
  - Přidání/odebrání fotek
  - Úprava výbavy
  - Změna stavu (aktivní → neaktivní)
- Každá změna se loguje do VehicleChangeLog s tím, kdo změnil (manažer)

**5. Notifikace pro manažera:**
- Nový makléř dokončil onboarding → schválit
- Makléř odeslal inzerát ke schválení
- Makléř odmítl vůz při prohlídce (s důvodem)
- Makléř označil auto jako prodané
- Auto se neprodalo 30 dní (automatický alert)
- Nový lead přiřazen do regionu

**6. Manažerský bonus:**
- Manažer dostává **2 500 Kč z každého prodeje jeho makléře** (bude upřesněno)
- V dashboardu zobrazit: "Bonusy tento měsíc: X Kč (Y prodejů)"
- Historie bonusů s výplatami

**7. Middleware / přístupová práva:**
- Manažer vidí POUZE data svých makléřů (filtr podle managerId v DB)
- Nesmí vidět makléře jiného manažera
- Admin/BackOffice vidí vše

### Kontext:
- Závisí na: TASK-013 (auth + role), TASK-004 (admin layout)
- Rozšíření admin panelu o manažerské routy
- Manažer používá admin panel (web), ne PWA
- Prisma: filtrování přes `where: { managerId: session.user.id }`
- Notifikace: rozšíření Notification modelu o typ APPROVAL_REQUEST
- Change log: VehicleChangeLog pro auditování manažerských editací

### Očekávaný výsledek:
- Manažerský dashboard se statistikami týmu
- Seznam makléřů s detaily, pozvánkami, deaktivací
- Schvalovací fronta s checklistem kvality
- Editace inzerátů makléřů s logováním změn
- Notifikace o aktivitách makléřů
- Manažerský bonus 2 500 Kč/prodej
- Přístupová práva — manažer vidí jen své makléře

---

## TASK-024: Lead management — příjem leadů, přiřazení, tracking
Priorita: 1
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Implementovat systém pro příjem a distribuci leadů — z externího systému přes API a z webového formuláře "Chci prodat auto".

**1. Lead model (Prisma):**
```
model Lead {
  id            String   @id @default(cuid())

  // Kontakt
  name          String
  phone         String
  email         String?

  // Auto
  brand         String?
  model         String?
  year          Int?
  mileage       Int?
  expectedPrice Int?
  description   String?

  // Zdroj
  source        LeadSource  // WEB_FORM, EXTERNAL_APP, MANUAL, REFERRAL
  externalId    String?     // ID z externího systému
  sourceDetail  String?     // Název externího systému

  // Lokace
  city          String?
  regionId      String?
  region        Region?     @relation(fields: [regionId], references: [id])

  // Přiřazení
  assignedToId  String?
  assignedTo    User?       @relation("AssignedLeads", fields: [assignedToId], references: [id])
  assignedById  String?
  assignedBy    User?       @relation("LeadAssigner", fields: [assignedById], references: [id])
  assignedAt    DateTime?

  // Stav
  status        LeadStatus  // NEW, ASSIGNED, CONTACTED, MEETING_SCHEDULED, VEHICLE_ADDED, REJECTED, EXPIRED
  rejectionReason String?

  // Propojení
  vehicleId     String?     // Propojení s Vehicle pokud makléř nabral auto
  vehicle       Vehicle?    @relation(fields: [vehicleId], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum LeadSource {
  WEB_FORM
  EXTERNAL_APP
  MANUAL
  REFERRAL
}

enum LeadStatus {
  NEW
  ASSIGNED
  CONTACTED
  MEETING_SCHEDULED
  VEHICLE_ADDED
  REJECTED
  EXPIRED
}
```

**2. Příjem leadů — 3 zdroje:**

- **Webový formulář** ("Chci prodat auto" — existující):
  - Stávající POST `/api/sell-request` → rozšířit o vytvoření Lead záznamu
  - Automatické přiřazení regionu podle města
  - Notifikace manažerovi regionu

- **Externí app (API)**:
  - Nový endpoint `POST /api/leads/external` s API key autentizací
  - Přijímá: name, phone, email, brand, model, year, mileage, city, externalId
  - API key v headeru: `X-API-Key: xxx` — klíč nastavitelný v admin panelu
  - Rate limiting: max 100 leadů/hodinu
  - Validace: Zod schema, duplicit check (telefon + značka + model za posledních 30 dní)
  - Response: { id, status } nebo { error }

- **Ruční vytvoření** (manažer/admin):
  - V admin panelu formulář "Přidat lead"
  - Manažer může přidat lead a rovnou přiřadit svému makléři

**3. Přiřazení leadů:**

- **Automatické** (default):
  - Lead přijde → systém najde region podle města
  - V regionu najde manažera
  - Manažer dostane notifikaci → v admin panelu přiřadí konkrétnímu makléři
  - Nebo: round-robin — systém přiřadí automaticky makléři s nejmenším počtem aktivních leadů v regionu (konfigurovatelné v nastavení)

- **Ruční** (manažer):
  - Manažer vidí nové leady ve svém regionu
  - Klikne na lead → vybere makléře ze svého týmu → přiřadí
  - Makléř dostane push notifikaci: "Nový lead: Škoda Octavia, Praha 2"

**4. Lead v PWA makléře:**

- **Dashboard** — sekce "Nové leady" (nad rozpracovanými drafty):
  - Badge s počtem nepřijatých leadů
  - Karta leadu: jméno prodejce, telefon, značka+model, město
  - Akce: "Přijmout" (stav → ASSIGNED), "Odmítnout" (s důvodem)
- **Přijatý lead** → makléř vidí kontakt, může:
  - Zavolat (tel: link)
  - Poslat SMS/WhatsApp
  - Poslat prezentaci emailem
  - Zaznamenat "Kontaktováno" (stav → CONTACTED)
  - Zaznamenat "Schůzka domluvena" (stav → MEETING_SCHEDULED) + datum
  - Spustit flow "Nabrat auto" → lead se propojí s vozidlem (stav → VEHICLE_ADDED)
  - Odmítnout (stav → REJECTED) s důvodem: nezvedá telefon, nechce prodávat, nereálná cena, mimo region

**5. Lead tracking v admin panelu:**

- **Seznam leadů** — tabulka s filtry: stav, region, zdroj, makléř, datum
- **Statistiky leadů:**
  - Celkem leadů / přiřazených / kontaktovaných / nabraných / odmítnutých
  - Konverzní poměr (lead → nabráno auto)
  - Průměrná doba od leadu po kontakt
  - Zdroj leadů (kolik z webu, kolik z externí app)
- **Automatická expirace:** lead bez aktivity 14 dní → stav EXPIRED, notifikace manažerovi

**6. API routes:**
- `POST /api/leads/external` — příjem z externí app (API key auth)
- `GET /api/leads` — seznam leadů (filtrovaný podle role: makléř své, manažer svého regionu, admin vše)
- `GET /api/leads/[id]` — detail leadu
- `PUT /api/leads/[id]/assign` — přiřazení makléři
- `PUT /api/leads/[id]/status` — změna stavu
- `GET /api/leads/stats` — statistiky

### Kontext:
- Závisí na: TASK-013 (auth), TASK-015 (PWA dashboard), TASK-022 (manažer přiřazuje leady)
- Stávající `/api/sell-request` rozšířit o Lead vytvoření
- Externí API key: uložit v env nebo v DB (admin nastavení)
- Push notifikace: na nový lead pro manažera + makléře
- Propojení: Lead → Vehicle (když makléř nabere auto z leadu)

### Očekávaný výsledek:
- Příjem leadů ze 3 zdrojů (web, externí API, ruční)
- Přiřazení leadům makléřům (automaticky nebo manažerem)
- Lead tracking v PWA makléře (přijetí, kontakt, schůzka, nabírání)
- Statistiky leadů v admin panelu
- Propojení leadu s vozidlem
- Automatická expirace

---

## TASK-025: Prodejní flow — od dotazu po předání vozu
Priorita: 1
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Implementovat kompletní prodejní flow — co se děje po publikaci inzerátu až po předání vozu kupujícímu. Makléř koordinuje celý proces a je přítomný při předání.

**1. Dotazy od kupujících:**

- **Kontaktní formulář na detailu vozu** (existující) → rozšířit:
  - Po odeslání se vytvoří záznam v DB (model Inquiry nebo rozšířit existující)
  - Makléř dostane push notifikaci + email: "Nový dotaz na {auto}: {zpráva}"
  - V PWA sekce "Zprávy" (`/app/messages`):
    - Seznam dotazů seskupený podle vozu
    - Každý dotaz: jméno, telefon, email, zpráva, datum
    - Akce: Odpovědět (email z appky), Zavolat (tel: link), Zaznamenat prohlídku

- **Odpověď makléře:**
  - Makléř odpoví emailem přímo z appky (textarea + odeslat)
  - Nebo zavolá → zaznamená výsledek hovoru (dropdown: "Zájem, domlouvám prohlídku" / "Jen se ptá" / "Nezájem")

**2. Prohlídka kupujícím:**

- Makléř domluví prohlídku → v appce zaznamená:
  - Datum a čas prohlídky
  - Jméno kupujícího
  - Kontakt na kupujícího
  - Místo (u prodejce — adresa je v systému)
- **Před prohlídkou:**
  - Makléř kontaktuje prodejce — potvrdí termín ("Přijede zájemce v sobotu v 10:00")
  - Tlačítko "Informovat prodejce" → předpřipravená SMS/email prodejci
- **Po prohlídce:**
  - Zaznamenat výsledek: "Zájem — jedná o ceně" / "Chce rozmýšlet" / "Bez zájmu"
  - Pokud zájem → pokračuje jednání

**3. Jednání o ceně:**

- Kupující nabídne jinou cenu → makléř zaznamená:
  - Požadovaná cena kupujícího
  - Reakce prodejce (souhlas / protinávrh / odmítnutí)
- Makléř vyjedná finální cenu → zaznamená do systému
- Změna ceny → VehicleChangeLog s důvodem "Dojednáno s kupujícím"

**4. Rezervace:**

- Kupující souhlasí → makléř označí auto jako **RESERVED**:
  - V PWA: tlačítko "Rezervovat" na detailu vozu
  - Vyplní: jméno kupujícího, kontakt, dohodnutá cena, plánované datum předání
  - Auto zmizí z veřejného katalogu (nebo se zobrazí s badge "Rezervováno")
  - Notifikace manažerovi: "Auto {název} rezervováno, cena {cena}"

**5. Předání vozu:**

Makléř je přítomný při předání. V appce zaznamená:

- **Předávací checklist** (`/app/vehicles/[id]/handover`):
  - [ ] Prodejce přítomen
  - [ ] Kupující přítomen
  - [ ] Velký TP předán
  - [ ] Malý TP předán
  - [ ] Klíče předány (počet: __)
  - [ ] Servisní kniha předána
  - [ ] Vůz ve sjednaném stavu (bez nových poškození)
  - [ ] Platba proběhla (jakým způsobem: hotovost / převod / financování)
  - [ ] Předávací protokol podepsán (link na TASK-017)

- **Generování předávacího protokolu** — TASK-017 (smlouvy):
  - Automaticky předvyplněný z dat vozu + kupující + prodejce
  - Podpis všech tří stran (prodejce, kupující, makléř)
  - PDF + email všem stranám

- **Označení jako PRODÁNO:**
  - Makléř potvrdí předání → stav RESERVED → SOLD
  - Zadá skutečnou prodejní cenu (může se lišit od inzerované)
  - Automatický výpočet provize:
    - 5% z prodejní ceny, min 25 000 Kč
    - 50% makléř, 50% firma
    - Manažerský bonus: 2 500 Kč (bude upřesněno)
  - Notifikace: makléři ("Provize: X Kč"), manažerovi ("Makléř {jméno} prodal {auto}"), BackOffice

**6. Po prodeji:**

- **Provize** se zobrazí v `/app/commissions` se stavem "Čeká na výplatu"
- **Nabídka doplňkových služeb** (automaticky po prodeji):
  - Email kupujícímu: nabídka pojištění (šablona)
  - Email kupujícímu: nabídka financování (pokud platil na splátky)
- **Follow-up** — automaticky 7 dní po prodeji:
  - Připomínka makléři: "Zavolej kupujícímu, zeptej se jestli je spokojený"
  - Po zavolání: zaznamenat spokojenost (1-5 hvězdek)
- **Recenze** — email kupujícímu 14 dní po prodeji:
  - "Jak jste spokojeni s makléřem {jméno}? Ohodnoťte."
  - Link na formulář recenze → zobrazí se na profilu makléře

**7. Záznam poškození vozu během inzerce:**

Auto zůstává u prodejce a může se poškodit. Makléř nebo prodejce nahlásí:

- **V detailu vozu** (`/app/vehicles/[id]`) tlačítko "Nahlásit poškození":
  - Popis poškození (textarea)
  - Fotky poškození (kamera)
  - Závažnost: Kosmetické / Funkční / Vážné
  - Akce po nahlášení:
    - Kosmetické → aktualizace popisu inzerátu, přidání fotek
    - Funkční → deaktivace inzerátu dokud se neopraví, notifikace manažerovi
    - Vážné → deaktivace inzerátu, notifikace manažerovi + BackOffice, přehodnocení ceny
- Záznam se uloží do VehicleChangeLog s typem DAMAGE_REPORT
- Po opravě: makléř zaznamená opravu + nové fotky → reaktivace inzerátu

**8. Nové Prisma modely / rozšíření:**
```
model VehicleInquiry {
  id          String   @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  brokerId    String
  broker      User     @relation(fields: [brokerId], references: [id])

  // Kupující
  buyerName   String
  buyerPhone  String
  buyerEmail  String?
  message     String

  // Stav
  status      InquiryStatus // NEW, REPLIED, VIEWING_SCHEDULED, NEGOTIATING, RESERVED, SOLD, NO_INTEREST
  reply       String?
  repliedAt   DateTime?

  // Prohlídka
  viewingDate     DateTime?
  viewingResult   String?   // INTERESTED, THINKING, NO_INTEREST

  // Jednání
  offeredPrice    Int?
  agreedPrice     Int?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model DamageReport {
  id          String   @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  reportedById String
  reportedBy  User     @relation(fields: [reportedById], references: [id])

  description String
  severity    DamageSeverity  // COSMETIC, FUNCTIONAL, SEVERE
  images      Json            // Array of image URLs
  repaired    Boolean @default(false)
  repairedAt  DateTime?
  repairNote  String?

  createdAt   DateTime @default(now())
}

enum InquiryStatus {
  NEW
  REPLIED
  VIEWING_SCHEDULED
  NEGOTIATING
  RESERVED
  SOLD
  NO_INTEREST
}

enum DamageSeverity {
  COSMETIC
  FUNCTIONAL
  SEVERE
}
```

- Rozšíření Vehicle modelu: přidat pole `reservedFor` (String?), `reservedAt` (DateTime?), `soldPrice` (Int?), `soldAt` (DateTime?), `handoverCompleted` (Boolean)

**9. API routes:**
- `GET /api/vehicles/[id]/inquiries` — dotazy na vůz
- `POST /api/vehicles/[id]/inquiries` — nový dotaz (z webu)
- `PUT /api/vehicles/[id]/inquiries/[inquiryId]` — odpověď, změna stavu
- `POST /api/vehicles/[id]/reserve` — rezervace
- `POST /api/vehicles/[id]/handover` — předání (checklist + prodej)
- `POST /api/vehicles/[id]/damage` — nahlášení poškození
- `PUT /api/vehicles/[id]/damage/[damageId]/repair` — záznam opravy

### Kontext:
- Závisí na: TASK-016 (vozidla v systému), TASK-017 (předávací protokol), TASK-015 (PWA zprávy)
- Propojení s TASK-017: předávací protokol se generuje jako smlouva s digitálním podpisem
- Provize: sdílená logika s provizním systémem (TASK-015 provize, upřesnit v separátním tasku)
- Email šablony: Resend (nabídka pojištění, financování, follow-up, recenze)
- Push notifikace: nový dotaz, rezervace, prodej

### Očekávaný výsledek:
- Dotazy od kupujících v PWA se stavem a odpovídáním
- Záznam prohlídek kupujícími
- Jednání o ceně s historií
- Rezervace vozu
- Předávací checklist s digitálním protokolem
- Automatický výpočet provize při prodeji
- Nabídka pojištění a financování po prodeji
- Follow-up a sběr recenzí
- Záznam poškození vozu během inzerce

---

## TASK-026: Email systém — šablony, personalizace, odesílání z PWA
Priorita: 2
Stav: hotovo
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Implementovat emailový systém s personalizovanými šablonami. Makléř odesílá emaily přímo z PWA. Každý email má šablonu s proměnnými, podpis makléře a preview před odesláním.

**1. Emailové šablony (7 typů):**

Každá šablona: HTML + text verze, responsive design, Carmakler branding (logo, barvy), personalizovatelné proměnné.

| # | Šablona | Proměnné | Kdy se posílá |
|---|---|---|---|
| 1 | **Prezentace Carmakler** | {prodejce_jmeno}, {makler_jmeno}, {makler_telefon}, {makler_foto}, {makler_podpis} | Před schůzkou s prodejcem |
| 2 | **Návrh smlouvy** | {prodejce_jmeno}, {auto_nazev}, {vin}, {cena} + PDF příloha | Po nabírání auta |
| 3 | **Follow-up po schůzce** | {prodejce_jmeno}, {auto_nazev}, {makler_jmeno} | Po nabírání — "auto jsem zadal, budu informovat" |
| 4 | **Nabídka pojištění** | {kupujici_jmeno}, {auto_nazev}, {auto_rok} | Po prodeji — kupujícímu |
| 5 | **Nabídka financování** | {kupujici_jmeno}, {auto_nazev}, {cena}, {splatka_mesicni} | Při zájmu o financování |
| 6 | **Doporučení snížení ceny** | {prodejce_jmeno}, {auto_nazev}, {aktualni_cena}, {nova_cena}, {duvod} | Když se auto neprodává |
| 7 | **Auto prodáno** | {prodejce_jmeno}, {auto_nazev}, {prodejni_cena} | Po prodeji — prodejci |

**2. Podpis makléře:**

- Každý email má na konci podpis makléře:
  ```
  S pozdravem,
  {jméno makléře}
  Makléř Carmakler
  📞 {telefon}
  📧 {email}
  🌐 carmakler.cz/makler/{slug}
  [Carmakler logo]
  ```
- Podpis se generuje automaticky z profilu makléře
- Volitelně: profilová fotka makléře v podpisu

**3. Odesílání z PWA:**

- V appce na různých místech tlačítko "Poslat email":
  - Detail vozu → "Poslat prodejci" (follow-up, změna ceny, prodáno)
  - Kontakt z kroku 1 flow → "Poslat prezentaci"
  - Smlouvy → "Poslat smlouvu" (PDF příloha)
  - Po prodeji → "Nabídnout pojištění", "Nabídnout financování"

- **Flow odeslání emailu:**
  1. Makléř klikne na typ emailu
  2. Systém předvyplní šablonu s daty z kontextu (jméno, auto, cena...)
  3. **Preview** — makléř vidí jak bude email vypadat
  4. Makléř může **upravit text** (editovatelná textarea nad šablonou)
  5. Tlačítko "Odeslat" → API → Resend
  6. Potvrzení: "Email odeslán na {email}"
  7. Záznam v historii emailů vozu

**4. Prezentační šablona "O nás":**

Speciální šablona — makléř posílá prodejci před schůzkou. Obsahuje:
- Logo Carmakler
- "Dobrý den, {prodejce_jmeno},"
- "Jmenuji se {makler_jmeno} a jsem certifikovaný makléř Carmakler."
- Jak Carmakler funguje (3-4 bodů s ikonkami):
  - ✅ Bezplatně nafotíme a zadáme vaše auto
  - ✅ Inzerujeme na předních portálech
  - ✅ Auto zůstává u vás, můžete ho používat
  - ✅ Platíte pouze provizi z úspěšného prodeje
- Proč Carmakler (trust):
  - Síť X makléřů po celé ČR
  - Průměrné hodnocení X.X hvězdiček
  - X prodaných aut
- Podpis makléře (foto, telefon, email)
- CTA: "Zavolejte mi nebo odpovězte na tento email"

**5. Technická implementace:**
- Backend: Resend API přes `POST /api/emails/send`
- Šablony: React Email (`@react-email/components`) nebo HTML šablony v `lib/email-templates/`
- Přílohy: PDF smlouvy (URL z Cloudinary)
- Tracking: uložit do DB každý odeslaný email (emailId, typ, příjemce, vehicleId, datum, status)
- Rate limiting: max 50 emailů/den na makléře

**6. API routes:**
- `POST /api/emails/send` — odeslání emailu (typ, příjemce, vehicleId, customText)
- `GET /api/emails/preview` — preview šablony s daty
- `GET /api/emails/history/[vehicleId]` — historie emailů k vozu
- `GET /api/emails/templates` — seznam dostupných šablon

**7. Nový Prisma model:**
```
model EmailLog {
  id          String   @id @default(cuid())
  type        String   // PRESENTATION, CONTRACT, FOLLOWUP, INSURANCE, FINANCING, PRICE_CHANGE, SOLD
  senderId    String
  sender      User     @relation(fields: [senderId], references: [id])
  vehicleId   String?
  vehicle     Vehicle? @relation(fields: [vehicleId], references: [id])
  recipientEmail String
  recipientName  String?
  subject     String
  status      String   // SENT, DELIVERED, OPENED, FAILED
  resendId    String?  // ID z Resend API
  createdAt   DateTime @default(now())
}
```

### Kontext:
- Závisí na: TASK-013 (auth — podpis z profilu), TASK-017 (smlouvy — PDF přílohy)
- Resend: API klíč v env RESEND_API_KEY, doména carmakler.cz ověřená
- React Email: pro HTML šablony s komponentami
- Přílohy: PDF smlouvy z Cloudinary URL
- Offline: emaily nelze posílat offline → zobrazit "Vyžaduje připojení"

### Očekávaný výsledek:
- 7 emailových šablon s personalizací a Carmakler brandingem
- Podpis makléře generovaný z profilu
- Odesílání přímo z PWA s preview a editací textu
- Prezentační šablona "O nás" pro prodejce
- Historie odeslaných emailů u každého vozu
- PDF přílohy (smlouvy)

---

## TASK-027: Gamifikace a statistiky makléřů
Priorita: 2
Stav: čeká
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Implementovat motivační systém pro makléře — úrovně, žebříček, achievementy, detailní statistiky a automatické notifikace.

**1. Úrovně makléřů:**

| Úroveň | Podmínka | Badge | Benefit |
|---|---|---|---|
| Junior makléř | 0-4 prodejů celkem | 🥉 Bronzový | — |
| Makléř | 5-19 prodejů | 🥈 Stříbrný | Zobrazení na webu |
| Senior makléř | 20-49 prodejů | 🥇 Zlatý | Prioritní leady |
| Top makléř | 50+ prodejů | 💎 Diamantový | TOP pozice na webu, speciální badge |

- Úroveň se počítá automaticky z celkového počtu prodejů
- Badge se zobrazuje: v PWA profilu, na veřejném profilu makléře na webu, v detailu vozu vedle jména makléře
- Při dosažení nové úrovně: push notifikace + gratulace v dashboardu

**2. Měsíční žebříček:**

- **TOP 10 makléřů** tento měsíc (podle celkových provizí)
- Zobrazení v PWA dashboardu: pořadí, jméno, počet prodejů, provize
- Makléř vidí své pořadí i když není v TOP 10: "Vaše pozice: 15. z 48 makléřů"
- Na konci měsíce: notifikace s výsledky ("Tento měsíc jste byl 3. nejlepší makléř!")
- Manažer vidí žebříček svých makléřů

**3. Achievementy:**

| Achievement | Podmínka | Ikona |
|---|---|---|
| První nabírání | Nabral první auto | 🚗 |
| První prodej | Prodal první auto | 🎉 |
| Rychlý prodej | Auto prodáno do 7 dní | ⚡ |
| Pětka | 5 prodejů za měsíc | 🖐️ |
| Desítka | 10 prodejů za měsíc | 🔟 |
| Milionář | Celkové provize přes 1M Kč | 💰 |
| Foto profesionál | 20+ fotek u jednoho auta | 📸 |
| Perfekcionista | 5x schválení na první pokus (bez vrácení) | ✨ |
| Věrný klient | Prodejce přes něj prodal 2+ aut | 🤝 |

- Achievementy se zobrazují v profilu makléře (PWA + veřejný web)
- Při získání: push notifikace + animace v dashboardu
- Uložení v DB: `UserAchievement` (userId, achievementId, unlockedAt)

**4. Statistiky makléře (`/app/stats`):**

- **Přehled:**
  - Celkem nabraných aut / celkem prodaných / konverzní poměr
  - Průměrná doba prodeje (dny)
  - Průměrná provize
  - Celkové provize (all time)
- **Porovnání s průměrem:**
  - "Vaše průměrná doba prodeje: 18 dní (průměr všech: 25 dní)" — s vizuálním indikátorem (lepší/horší)
  - "Váš konverzní poměr: 78% (průměr: 65%)"
- **Grafy:**
  - Prodeje po měsících (bar chart, posledních 6 měsíců)
  - Provize po měsících (line chart)
- **Nejúspěšnější kategorie:**
  - Top značky (kolik aut jaké značky prodal)
  - Top cenový segment (do 300k / 300-600k / 600k-1M / nad 1M)

**5. Automatický návrh snížení ceny:**

- Auto je aktivní 30 dní bez prodeje → systém:
  - Spočítá průměrnou dobu prodeje podobných aut
  - Navrhne snížení ceny (např. -5% nebo -10%)
  - Pošle makléři notifikaci: "Auto {název} je v nabídce 30 dní. Doporučujeme snížit cenu z {cena} na {nova_cena}."
  - Makléř může: přijmout (cena se změní + notifikace prodejci) / zamítnout / upravit
- Po 60 dnech bez prodeje → notifikace manažerovi: "Auto {název} makléře {jméno} se neprodalo 60 dní"
- Po 90 dnech → zvážit deaktivaci, kontaktovat prodejce

**6. Kalkulačka financování (`/app/financing-calculator`):**

- Makléř zadá:
  - Cena vozu
  - Akontace (%, slider 0-50%)
  - Počet splátek (select: 12, 24, 36, 48, 60, 72 měsíců)
  - Úroková sazba (předvyplněná, editovatelná)
- Výpočet:
  - Měsíční splátka
  - Celkem zaplaceno
  - Přeplatek
- Tlačítko "Poslat nabídku kupujícímu" → email šablona č.5 (financování) s vyplněnými údaji
- Orientační výpočet — disclaimer: "Jedná se o orientační kalkulaci. Skutečnou nabídku poskytne leasingová společnost."

**7. Nové Prisma modely:**
```
model UserAchievement {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  achievementKey String  // FIRST_VEHICLE, FIRST_SALE, QUICK_SALE, etc.
  unlockedAt    DateTime @default(now())

  @@unique([userId, achievementKey])
}

model PriceReduction {
  id          String   @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  currentPrice Int
  suggestedPrice Int
  reason      String
  status      String   // PENDING, ACCEPTED, REJECTED, MODIFIED
  acceptedPrice Int?
  respondedAt DateTime?
  createdAt   DateTime @default(now())
}
```

- Rozšíření User modelu: `level` (String: JUNIOR, BROKER, SENIOR, TOP), `totalSales` (Int), `achievements` relation

### Kontext:
- Závisí na: TASK-015 (PWA dashboard — zobrazení statistik, žebříčku), TASK-025 (prodeje — data pro výpočty)
- Výpočty úrovní a achievementů: spouštět po každém prodeji (trigger v prodejním flow)
- Žebříček: API endpoint `GET /api/broker/leaderboard`
- Grafy: použít knihovnu Recharts nebo Chart.js (lightweight)
- Cron/scheduled: kontrola 30/60/90 dní bez prodeje (nebo při každém načtení dashboardu)

### Očekávaný výsledek:
- 4 úrovně makléřů s automatickým postupem a badges
- Měsíční žebříček TOP 10 s pozicí makléře
- 9 achievementů s notifikacemi
- Detailní statistiky s grafy a porovnáním
- Automatický návrh snížení ceny po 30 dnech
- Kalkulačka financování s odesláním nabídky emailem

---

## TASK-028: UX vylepšení — srovnání vozů, cenová historie, podobné vozy, transparentní timeline
Priorita: 2
Stav: čeká
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Implementovat 4 funkce které zvyšují hodnotu platformy pro kupující — srovnání vozů, cenová historie, doporučení podobných vozů a transparentní historie vozu.

**1. Srovnání vozů (max 3):**
- Tlačítko "Porovnat" na kartě vozu v katalogu (ikona vah, vedle ❤️)
- Porovnávací lišta (fixed bar dole): miniatura + název vybraných aut + "Porovnat (2)" tlačítko
- Max 3 vozy, uložení v localStorage
- Stránka `/nabidka/porovnani`:
  - 2-3 sloupce vedle sebe (mobil: horizontální scroll)
  - Sekce: Cena, Základní (rok/km/palivo), Motor (výkon/objem), Stav (STK/servis/majitelé), Trust Score
  - Zvýraznění nejlepší hodnoty zeleně (nejnižší cena, nejnižší km, nejvyšší výkon, nejnovější rok)
  - Výbava: ✅/❌ matice
  - Tlačítko "Kontaktovat makléře" u každého

**2. Cenová historie:**
- Na detailu vozu sekce "Cenová historie" (jen pokud existuje změna ceny)
- Line chart (Recharts): osa X čas, osa Y cena, bod = změna ceny
- Pod grafem textově: "Publikováno {datum} za {cena}" + seznam změn
- Zdroj: VehicleChangeLog kde field === 'price'
- API: `GET /api/vehicles/[id]/price-history`

**3. Podobné vozy:**
- Na detailu vozu sekce "Podobné vozy" (3-6 aut)
- Logika: (1) stejná značka+model, (2) stejná značka+podobná cena ±20%, (3) stejný segment+cena, (4) fallback stejná cenová kategorie
- Rok ±3 roky, jen ACTIVE, max 6 výsledků
- API: `GET /api/vehicles/[id]/similar?limit=6`

**4. Transparentní timeline vozu:**
- Na detailu vozu sekce "Historie na Carmakler" — vertikální timeline:
  - 🟢 Zadáno makléřem (datum, jméno makléře)
  - 🔍 Prohlídka (celkový dojem hvězdičky, testovací jízda ✅/❌)
  - ✅ Schváleno a publikováno (datum)
  - 👁 Zájem (počet zobrazení, počet dotazů)
  - 💰 Změna ceny (datum, z→na)
  - ⚠️ Aktualizace (datum)
- Nezobrazovat: jméno prodejce, důvod změny, interní poznámky, odmítnutí
- API: `GET /api/vehicles/[id]/timeline`

### Kontext:
- Závisí na: TASK-008 (detail vozu), TASK-007 (katalog)
- Recharts pro grafy, localStorage pro porovnání
- Žádné nové DB modely — čtení z existujících dat

### Očekávaný výsledek:
- Porovnání vozů s tabulkou a zvýrazněním
- Cenová historie jako graf
- Podobné vozy na detailu
- Transparentní timeline

---

## TASK-029: SMS notifikace + notifikační centrum + denní shrnutí
Priorita: 2
Stav: čeká
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

SMS notifikace pro prodejce, notifikační centrum s preferencemi pro všechny role, denní shrnutí pro makléře.

**1. SMS pro prodejce (5 typů):**
- Auto schváleno: "Carmakler: Váš vůz {auto} byl publikován. Makléř {jméno}, tel: {tel}"
- Nový zájemce: "O váš vůz {auto} se zajímá kupující. Makléř vás kontaktuje."
- Prohlídka domluvena: "Prohlídka {auto} domluvena na {datum} v {čas}."
- Auto prodáno: "Váš vůz {auto} byl prodán za {cena} Kč!"
- Návrh snížení ceny: "Doporučujeme snížit cenu {auto} z {stará} na {nová} Kč."
- Provider: GoSMS.cz nebo Twilio, `lib/sms.ts` wrapper
- Rate limiting: max 5 SMS/den na číslo, opt-out přes "STOP"
- Logging: SmsLog model (phone, message, status, cost, vehicleId)

**2. Notifikační centrum:**

Makléř (v PWA `/app/settings/notifications`) — toggle push/email per událost:
- Nový lead, nový dotaz, inzerát schválen/zamítnut, auto prodáno, denní shrnutí, auto 30 dní, achievement, žebříček

Prodejce — přes link v SMS/emailu (`/notifikace/{token}`, bez přihlášení):
- Toggle SMS ano/ne, Email ano/ne per událost

Manažer (v admin panelu):
- Onboarding dokončen, inzerát ke schválení, makléř odmítl vůz, prodej, 60 dní alert, nový lead, týdenní report

**3. Denní shrnutí pro makléře (7:00 ráno):**
- Push: "Včera: {zobrazení} zobrazení, {dotazy} dotazů, {leady} leadů"
- Email (detailní): TOP 3 nejprohlíženější auta, nové dotazy, čekající leady, auta blížící se 30 dnům
- Cron: Vercel Cron 7:00 → `POST /api/cron/daily-summary`
- Vypnutelné v nastavení

**4. Nové modely:**
```
model NotificationPreference {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  eventType   String
  pushEnabled Boolean  @default(true)
  emailEnabled Boolean @default(true)
  smsEnabled  Boolean  @default(false)
  @@unique([userId, eventType])
}
model SmsLog {
  id             String   @id @default(cuid())
  recipientPhone String
  message        String
  vehicleId      String?
  status         String   // SENT, DELIVERED, FAILED
  cost           Float?
  createdAt      DateTime @default(now())
}
```

### Kontext:
- Závisí na: TASK-015 (push), TASK-026 (email)
- GoSMS API klíč v env, Vercel Cron pro denní shrnutí

### Očekávaný výsledek:
- SMS prodejcům v 5 momentech
- Notifikační centrum pro makléře/prodejce/manažery
- Denní shrnutí 7:00 push+email
- Opt-out, rate limiting, logging

---

## TASK-030: Rychlé nabírání — zkrácený 3-krokový flow
Priorita: 2
Stav: čeká
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Zkrácená verze nabírání pro zkušené makléře. 3 kroky místo 7. Dostupné od úrovně Makléř (TASK-027).

**1. Aktivace:**
- Toggle v nastavení PWA: "Rychlý režim nabírání"
- Jen pro úroveň Makléř a výš (Junior ne — musí se učit plný flow)
- V dashboardu: "⚡ Rychle nabrat" + "📋 Kompletně"

**2. Rychlý flow — 3 kroky:**

Krok 1: VIN + kontakt (sloučené)
- VIN * (validace, duplikát check, dekódování)
- Telefon prodejce * + jméno *
- Geolokace (auto — "Použít aktuální polohu")

Krok 2: Fotky (min 5)
- Přední 3/4, zadní 3/4, interiér, tachometr, VIN štítek (všechny povinné)
- Tlačítko "Přidat další"

Krok 3: Cena + odeslání
- Najeto km *, cena *, stav vozidla *
- Live provize výpočet
- AI popis (volitelné)
- "⚡ Odeslat"

**3. Po rychlém nabírání:**
- Stav DRAFT_QUICK — ne PENDING
- Badge "⚡ Rychlý draft — doplnit údaje"
- 48h deadline na doplnění: prohlídka, výbava, barva/dveře, lokace, smlouva, další fotky (na 12)
- Po doplnění → PENDING → schválení manažerem
- 48h bez doplnění → notifikace, 72h → automatická deaktivace
- Manažer vidí "rychlý/kompletní" ve frontě

**4. Rozšíření:**
- Vehicle stav: DRAFT_QUICK
- User: `quickModeEnabled` (Boolean)

### Kontext:
- Závisí na: TASK-016 (sdílené komponenty), TASK-027 (úrovně)

### Očekávaný výsledek:
- 3-krokový flow pro zkušené makléře
- 48h deadline na doplnění
- Plynulý přechod do plného flow

---

## TASK-031: Partnerský modul — CRM akvizice, portál pro bazary a vrakoviště, veřejné profily
Priorita: 2
Stav: čeká
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Kompletní partnerský modul — CRM pro akvizici autobazarů a vrakovišť, partnerský portál pro správu aut/dílů, veřejné profily na webu, prezentace pro schůzky.

**Provizní model partnerství:**
- **Autobazar:** dává auta na platformu Carmakler, zákazník (kupující) platí provizi z prodeje. Pokud se auto prodá na úvěr/financování, Carmakler vyplatí provizi autobazaru ze zprostředkování financování.
- **Vrakoviště:** prodává díly přes eshop Carmakler, Carmakler si bere 15% provizi z prodeje dílů.

---

**1. Prisma schema — nové modely a role:**

Nové role do enum Role:
- `PARTNER_BAZAR` (autobazar)
- `PARTNER_VRAKOVISTE` (autovrakoviště)

```
model Partner {
  id              String   @id @default(cuid())
  name            String                           // Název firmy
  type            PartnerType                      // AUTOBAZAR | VRAKOVISTE
  ico             String?  @unique                 // IČO
  address         String?                          // Ulice + číslo
  city            String?                          // Město
  region          String?                          // Kraj
  zip             String?                          // PSČ
  latitude        Float?                           // GPS
  longitude       Float?                           // GPS
  phone           String?
  email           String?
  web             String?
  contactPerson   String?                          // Jméno kontaktní osoby
  estimatedSize   PartnerSize?                     // SMALL | MEDIUM | LARGE
  googleRating    Float?
  googleReviewCount Int?
  source          PartnerSource?                   // FIRMY_CZ | GOOGLE | SAUTO | TIPCARS | BAZOS | MANUAL
  notes           String?                          // Poznámky
  logo            String?                          // URL loga
  description     String?                          // Popis firmy
  openingHours    Json?                            // Otevírací doba
  slug            String   @unique                 // Pro veřejný profil

  // Akvizice
  status          PartnerStatus @default(NEOSLOVENY)
  score           Int @default(0)                  // Prioritizační skóre
  rejectionReason String?
  managerId       String?
  manager         User? @relation("PartnerManager", fields: [managerId], references: [id])

  // Partnerský účet (vytvořen při aktivaci)
  userId          String? @unique
  user            User? @relation("PartnerUser", fields: [userId], references: [id])

  activities      PartnerActivity[]
  leads           PartnerLead[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([type])
  @@index([status])
  @@index([managerId])
  @@index([city])
  @@index([region])
  @@index([score])
}

model PartnerActivity {
  id              String   @id @default(cuid())
  partnerId       String
  partner         Partner  @relation(fields: [partnerId], references: [id], onDelete: Cascade)
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  type            ActivityType  // POZNAMKA | NAVSTEVA | TELEFONAT | EMAIL | ZMENA_STAVU | SYSTEM
  title           String
  description     String?
  oldStatus       String?
  newStatus       String?
  nextContactDate DateTime?
  createdAt       DateTime @default(now())

  @@index([partnerId])
  @@index([createdAt])
}

model PartnerLead {
  id          String   @id @default(cuid())
  partnerId   String
  partner     Partner  @relation(fields: [partnerId], references: [id])
  vehicleId   String?
  vehicle     Vehicle? @relation(fields: [vehicleId], references: [id])
  name        String
  phone       String?
  email       String?
  message     String?
  status      PartnerLeadStatus @default(NOVY)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([partnerId])
  @@index([status])
}

enum PartnerType {
  AUTOBAZAR
  VRAKOVISTE
}

enum PartnerSize {
  SMALL    // < 20 aut
  MEDIUM   // 20-100 aut
  LARGE    // 100+ aut
}

enum PartnerSource {
  FIRMY_CZ
  GOOGLE
  SAUTO
  TIPCARS
  BAZOS
  MANUAL
}

enum PartnerStatus {
  NEOSLOVENY
  PRIRAZENY
  OSLOVEN
  JEDNAME
  AKTIVNI_PARTNER
  ODMITNUTO
  POZASTAVENO
}

enum ActivityType {
  POZNAMKA
  NAVSTEVA
  TELEFONAT
  EMAIL
  ZMENA_STAVU
  SYSTEM
}

enum PartnerLeadStatus {
  NOVY
  KONTAKTOVAN
  DOMLUVENO
  PRODANO
  NEZAJEM
}
```

Po úpravě schema: `npx prisma migrate dev --name add-partner-models`

---

**2. Seed script (`prisma/seed-partners.ts`):**

- Načte `prisma/data/partners-seed.json` — **289 reálných partnerů** (214 autobazarů + 75 vrakovišť) z celé ČR, GPS souřadnice u 72%. Data obsahují: name, ico, address, city, region, phone, email, website, type, size, lat, lng, source.
- **Idempotentní** — upsert podle IČO (pokud existuje) nebo name+city combo
- Pro každý záznam vytvoří Partner v DB
- Vypočítá score podle logiky:
  - +30 LARGE bazar, +20 MEDIUM, +5 SMALL
  - +15 Google rating > 4.0
  - +10 má web
  - +5 má email
  - +10 region kde ještě nemáme partnera
  - -10 Google rating < 3.0
- Vygeneruje slug z názvu (slugify)
- Všechny mají status NEOSLOVENY
- Spustitelný: `npx tsx prisma/seed-partners.ts`

---

**3. Admin panel — CRM partnerů (`app/(admin)/admin/partners/`):**

**Seznam partnerů (`/admin/partners/page.tsx`):**

- **Záložky nahoře:** Autobazary | Autovrakoviště | Všichni
- **Dashboard widgety:**
  - Celkem partnerů | Aktivních | Rozpracovaných | Nepřiřazených
  - Mini funnel: Neosloveno → Přiřazeno → Osloveno → Jednáme → Partner (s počty a vizuálním funnelem)
- **Mapa** (horní polovina stránky):
  - Mapbox GL JS (free tier) nebo Leaflet + OpenStreetMap
  - Piny s barvou podle stavu:
    - Šedá = NEOSLOVENY
    - Modrá = PRIRAZENY
    - Žlutá = OSLOVEN
    - Oranžová = JEDNAME
    - Zelená = AKTIVNI_PARTNER
    - Červená = ODMITNUTO
  - Klik na pin → popup: název, město, stav + odkaz na detail
  - Clustering při oddálení
  - Filtrování mapy reaguje na filtry tabulky
- **Filtry:** stav, kraj, přiřazený manažer, velikost (SMALL/MEDIUM/LARGE)
- **Tabulka** (spodní polovina):
  - Sloupce: Název | Typ | Město | Manažer | Stav (badge) | Score | Poslední kontakt
  - Řádek kliknutelný → detail
  - Hromadné akce: přiřadit manažerovi (select), změnit stav (select)
  - Řazení: default podle score DESC
  - Stránkování

**Detail partnera (`/admin/partners/[id]/page.tsx`):**

- **Levý sloupec:**
  - Všechny údaje partnera (editovatelné formulář)
  - Mapa s jedním pinem (adresa partnera)
  - Přiřazení manažera (select z User kde role = MANAGER)
  - Změna stavu (dropdown) — u ODMITNUTO povinná poznámka (modal s textarea)
  - Score badge (číslo + barevný indikátor)
  - Tlačítka:
    - "Aktivovat partnerství" → změní stav na AKTIVNI_PARTNER + vytvoří User účet s rolí PARTNER_BAZAR nebo PARTNER_VRAKOVISTE + odešle email s přihlašovacími údaji (heslo vygenerované, výzva ke změně)
    - "Odeslat prezentaci" → email s odkazem na /prezentace
    - "Otevřít prezentaci" → fullscreen pitch (pro tablet na schůzce)
- **Pravý sloupec — Timeline:**
  - Chronologický seznam PartnerActivity (nejnovější nahoře)
  - Ikony podle typu: 📝 poznámka, 🏢 návštěva, 📞 telefonát, 📧 email, 🔄 změna stavu
  - Formulář "Zaznamenat kontakt":
    - Typ: select (Návštěva / Telefonát / Email / Poznámka)
    - Popis (textarea)
    - Datum dalšího kontaktu (date picker, volitelné)
    - Tlačítko "Uložit"
  - Automatické záznamy: změna stavu, přiřazení manažera (typ SYSTEM/ZMENA_STAVU)

---

**4. Partnerský portál (`app/(partner)/`):**

Nová route group s vlastním layoutem. Přístup jen pro PARTNER_BAZAR a PARTNER_VRAKOVISTE.

**Layout (`components/partner/PartnerLayout.tsx`):**
- Sidebar s navigací (desktop: fixed, mobile: hamburger)
- Header: logo Carmakler + název partnera + notifikační zvoneček
- Responzivní — funguje na tabletu i mobilu

**Pro AUTOBAZAR (PARTNER_BAZAR):**

a) **Dashboard** (`/partner/dashboard`):
- Stat karty: Vozidla v systému | Zájemci tento měsíc | Prodáno přes Carmakler | Celkový výdělek
- Graf: aktivita za posledních 12 měsíců (zobrazení, zájemci, prodeje) — Recharts bar/line chart
- Poslední zájemci (quick list, max 5)
- Tlačítko "Přidat vozidlo"

b) **Moje vozidla** (`/partner/vehicles`):
- Seznam aut přidaných do Carmakler
- Filtry: stav (DRAFT, PENDING, ACTIVE, RESERVED, SOLD)
- Karta: foto, název, cena, stav badge, počet zobrazení, počet zájemců
- **Přidání vozidla** (`/partner/vehicles/new`) — zjednodušený flow (oproti makléři: BEZ inspekce, BEZ exkluzivní smlouvy, BEZ testovací jízdy):
  - Krok 1: VIN zadání + dekódování (stejná logika)
  - Krok 2: Fotky (min 5, bez guided overlay — jednoduchý upload z galerie/kamery)
  - Krok 3: Údaje + výbava (z VIN předvyplněné + ruční doplnění, km, stav, barva)
  - Krok 4: Cena + popis + odeslání
  - Po odeslání: stav PENDING → BackOffice schválí
- Editace a smazání vlastních aut
- Statistiky u každého auta: zobrazení, dotazy

c) **Zájemci** (`/partner/leads`):
- Seznam PartnerLead (kupující co se ozvali přes Carmakler)
- Filtry: stav (NOVY, KONTAKTOVAN, DOMLUVENO, PRODANO, NEZAJEM)
- Detail: jméno, telefon, email, na jaké auto, zpráva
- Akce: změna stavu (dropdown), přidání poznámky (textarea)
- Push + email notifikace při novém leadu

d) **Statistiky** (`/partner/stats`):
- Funnel: Zobrazení → Zájemci → Prodeje (vizuální funnel chart)
- Porovnání s průměrem sítě ("Vaše konverze: 8%, průměr partnerů: 5%")
- Nejúspěšnější vozidla (top 5 podle zobrazení/zájemců)
- Měsíční přehled (tabulka: měsíc, počet aut, zobrazení, zájemci, prodeje)

e) **Profil** (`/partner/profile`):
- Editace veřejného profilu: logo (upload), popis (textarea), otevírací doba (JSON editor nebo strukturovaný formulář po-ne), fotky provozovny (upload, max 10)
- Náhled jak vypadá `carmakler.cz/bazar/[slug]`
- Kontaktní údaje (telefon, email, adresa)

f) **Dokumenty** (`/partner/documents`):
- Partnerská smlouva (PDF ke stažení)
- Měsíční vyúčtování (PDF, generované systémem)
- Obchodní podmínky (PDF)

g) **Zprávy** (`/partner/messages`):
- Jednoduchý chat s přiřazeným manažerem Carmakler
- Systémová oznámení (schválení auta, nový lead, výplata)

**Pro AUTOVRAKOVIŠTĚ (PARTNER_VRAKOVISTE):**

a) **Dashboard** (`/partner/dashboard`):
- Stat karty: Díly v systému | Objednávky tento měsíc | Celkový obrat
- Poslední objednávky (quick list, max 5)
- Tlačítko "Přidat díl"

b) **Moje díly** (`/partner/parts`):
- Seznam dílů v eshopu
- Přidání dílu — 3 kroky (stejné jako TASK-020 PWA pro vrakoviště):
  - Fotka (kamera/upload, min 1)
  - Údaje (název, kategorie, stav, kompatibilita = značka+model+rok nebo VIN zdroje, OEM číslo)
  - Cena + DPH + množství + doručení → publikovat
- Stav: SKLADEM | REZERVOVANO | PRODANO | NEDOSTUPNE
- Hromadný import z CSV (šablona ke stažení)
- Mobile-friendly (fotit telefonem)

c) **Objednávky** (`/partner/orders`):
- Seznam objednávek z eshopu
- Stav: NOVA | POTVRZENA | ODESLANA | DORUCENA
- Detail: co (díl + foto), komu (jméno, adresa), kam (doručení), za kolik
- Akce: potvrdit → zabalit → odeslat (zadat tracking číslo)
- Push notifikace na novou objednávku

d) **Profil** (`/partner/profile`):
- Stejné jako u bazaru, ale pro `carmakler.cz/dodavatel/[slug]`

e) **Vyúčtování** (`/partner/billing`):
- Přehled plateb: Carmakler vyplácí po odečtu 15% provize
- Měsíční tabulka: obrat, provize Carmakler (15%), výplata partnerovi (85%)
- Stav výplaty: Čeká | Vyplaceno + datum
- Detail: seznam prodaných dílů za období

---

**5. Veřejné profily:**

**Autobazar** (`app/(web)/bazar/[slug]/page.tsx`):
- Název, logo, popis, otevírací doba
- Adresa + mapa (embed)
- Badge "Ověřený partner Carmakler" (oranžový)
- Seznam jejich vozidel na platformě (grid karet)
- Google hodnocení (pokud dostupné)
- Kontaktní formulář
- Statistiky: "Na Carmakler od {datum}" + "X prodaných aut"

**Vrakoviště** (`app/(web)/dodavatel/[slug]/page.tsx`):
- Analogicky — název, popis, adresa + mapa
- Badge "Ověřený dodavatel"
- Seznam jejich dílů v eshopu
- Kontaktní formulář

---

**6. Prezentace / Pitch deck (`app/(web)/prezentace/page.tsx`):**

Fullscreen stránka BEZ navigace (navbar/footer skryté). Pro tablet na schůzce. Swipe/click mezi sekcemi.

8 sekcí (celá šířka, celá výška, jedna za druhou):
1. **Kdo jsme** — Carmakler logo (velké, uprostřed), "Jsme síť certifikovaných automakléřů", čísla: X makléřů, X prodaných aut, X partnerů
2. **Jak to funguje** — 3 kroky vizuálně s ikonkami (nabírání → inzerce → prodej)
3. **Pro autobazary** — co z toho mají: leads od kupujících, větší viditelnost, badge "Ověřený partner", žádné náklady na start, provize jen z úspěšného prodeje
4. **Pro vrakoviště** — co z toho mají: online prodej dílů bez vlastního eshopu, objednávkový systém, platby za vás
5. **Provizní model** — transparentní přehled: bazary (provize z prodeje platí kupující, bonus za financování), vrakoviště (15% z prodeje dílů, 85% pro vás)
6. **Naši partneři** — mapa partnerů s piny + čísla (X partnerů v Y krajích)
7. **Další kroky** — "1. Podepíšeme smlouvu → 2. Nastavíme profil → 3. Do týdne jste online"
8. **Kontakt** — dynamicky jméno manažera (z URL parametru `?manager=slug` nebo z session) + telefon + email + QR kód (odkaz na registraci/kontakt)

Design: oranžová (#F97316) + bílá + tmavá (gray-900), velké fonty (Outfit), málo textu, hodně vizuálů, animace přechodů mezi sekcemi (Framer Motion fade/slide).

---

**7. API routes:**

```
// Admin CRM
POST   /api/partners              — vytvořit partnera (admin/backoffice)
GET    /api/partners              — seznam s filtry, stránkování (admin/backoffice/manager)
GET    /api/partners/[id]         — detail (admin/backoffice/manager)
PATCH  /api/partners/[id]         — update (admin/backoffice/manager svých)
DELETE /api/partners/[id]         — smazat (admin)

POST   /api/partners/[id]/activities  — přidat aktivitu (admin/backoffice/manager)
GET    /api/partners/[id]/activities  — seznam aktivit

POST   /api/partners/[id]/activate   — aktivovat partnerství (admin/backoffice)
                                       → vytvoří User účet + odešle email s credentials

// Partnerský portál
GET    /api/partner/dashboard     — dashboard data pro přihlášeného partnera
GET    /api/partner/vehicles      — vozidla partnera (jen PARTNER_BAZAR)
POST   /api/partner/vehicles      — přidat vozidlo (zjednodušená validace)
GET    /api/partner/parts         — díly partnera (jen PARTNER_VRAKOVISTE)
POST   /api/partner/parts         — přidat díl
GET    /api/partner/leads         — zájemci
PATCH  /api/partner/leads/[id]    — update stavu leadu
GET    /api/partner/orders        — objednávky (vrakoviště)
PATCH  /api/partner/orders/[id]   — update stavu objednávky
GET    /api/partner/billing       — vyúčtování
GET    /api/partner/stats         — statistiky

// Veřejné
GET    /api/partners/public/[slug] — veřejný profil partnera
```

Všechny routes: Zod validace na vstupu, auth check, role check.

---

**8. Navigace a middleware:**

Admin sidebar — přidat sekci:
```
PARTNEŘI
├── 🏢 Autobazary (/admin/partners?type=AUTOBAZAR)
├── 🔧 Vrakoviště (/admin/partners?type=VRAKOVISTE)
└── 📊 Mapa partnerů (/admin/partners)
```

Middleware — updatovat:
- `/admin/*` → jen ADMIN, BACKOFFICE
- `/partner/*` → jen PARTNER_BAZAR, PARTNER_VRAKOVISTE
- `/app/*` (PWA) → jen BROKER, MANAGER (stávající)

---

**9. Pořadí implementace:**

1. Prisma schema + migrace
2. Seed script (bez scrapingu — data se připraví zvlášť)
3. API routes (CRUD partnerů + aktivit)
4. Admin stránka /admin/partners (seznam + mapa + filtry)
5. Admin detail partnera /admin/partners/[id] (editace + timeline)
6. Sidebar navigace update
7. Partnerský portál layout + dashboard
8. Partner bazar: vozidla správa + přidání
9. Partner vrakoviště: díly správa + objednávky
10. Partner: leads, zprávy, statistiky, profil, dokumenty, vyúčtování
11. Prezentace/pitch stránka
12. Veřejné profily (/bazar/[slug], /dodavatel/[slug])
13. Middleware + auth update

### Kontext:
- Závisí na: TASK-013 (auth — nové role), TASK-014 (vehicle API — sdílené pro partnery), TASK-020 (eshop — díly logika sdílená s vrakovišti)
- Mapa: Mapbox GL JS (free tier) nebo Leaflet + OpenStreetMap
- Grafy: Recharts
- Email: Resend (pozvánka, credentials, notifikace)
- Data partnerů: seed z JSON souboru, reálná data se připraví zvlášť (scraping mimo scope)
- Partnerský portál sdílí komponenty s admin panelem (DataTable, Card, Badge...)

### Očekávaný výsledek:
- CRM pipeline pro akvizici partnerů v admin panelu (mapa + tabulka + detail s timeline)
- Scoring a prioritizace partnerů
- Aktivace partnerství jedním kliknutím (vytvoření účtu + email)
- Partnerský portál pro autobazary (vozidla, zájemci, statistiky, profil, dokumenty)
- Partnerský portál pro vrakoviště (díly, objednávky, vyúčtování 85/15)
- Veřejné profily partnerů na webu s badge "Ověřený partner"
- Prezentace/pitch deck pro schůzky (fullscreen, 8 sekcí)
- 2 nové role (PARTNER_BAZAR, PARTNER_VRAKOVISTE) s middleware ochranou

---

## TASK-032: Platební systém — Stripe, platba přes Carmakler, výplaty prodejcům a makléřům
Priorita: 1
Stav: čeká
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Carmakler funguje jako prostředník plateb. Kupující zaplatí Carmakler (Stripe nebo převodem), Carmakler strhne provizi a pošle zbytek prodejci. Makléř fakturuje Carmakler za svou polovinu provize.

**1. Platební flow při prodeji vozu:**

```
Kupující zaplatí ──→ Účet Carmakler (Stripe/převod)
                         │
                         ├── Provize 5% (min 25k) → zůstává Carmakler
                         │     ├── 50% makléř (fakturuje Carmakler)
                         │     ├── Manažerský bonus 2 500 Kč
                         │     └── Zbytek = firma Carmakler
                         │
                         └── Zbylá částka → výplata prodejci na účet
```

**2. Stripe integrace:**

- **Stripe Connect** — Carmakler jako platforma, prodejci jako connected accounts (nebo jednodušeji: vše na účet Carmakler, manuální výplaty)
- **Platební metody:**
  - Platba kartou (Stripe Checkout nebo Payment Intent)
  - Bankovní převod na účet Carmakler (s variabilním symbolem = ID vozidla)
  - Financování/leasing (platba od leasingové společnosti na účet Carmakler)
- **Stripe fee:** ~1.4% + 3.50 Kč za transakci — kdo platí? (Carmakler absorbuje, nebo přidá kupujícímu?)

**3. Flow platby v aplikaci:**

**Kupující (web):**
- Na detailu vozu stav "Rezervováno" → tlačítko "Zaplatit"
- Platební stránka (`/nabidka/[slug]/platba`):
  - Shrnutí: auto, cena, prodejce, makléř
  - Výběr platby: Kartou (Stripe Checkout) / Bankovním převodem
  - Kartou → Stripe Checkout session → po úspěchu redirect na potvrzení
  - Převodem → zobrazí číslo účtu + variabilní symbol + částku + QR kód pro platbu
- Po připsání platby: stav RESERVED → PAID (nový stav)

**Makléř (PWA):**
- V detailu vozu vidí stav platby: "Čeká na platbu" / "Zaplaceno kartou" / "Zaplaceno převodem"
- Po potvrzení platby (automaticky Stripe webhook, nebo BackOffice ručně u převodu):
  - Notifikace makléři: "Platba přijata, domluvte předání"
  - Makléř domluví předání → předávací protokol (TASK-025)
  - Po předání → stav SOLD

**BackOffice (admin):**
- Přehled plateb: seznam všech transakcí (auto, kupující, částka, metoda, stav, datum)
- U převodů: ruční potvrzení "Platba přišla" (po kontrole výpisu)
- Generování výplat prodejcům
- Generování provizních výplat makléřům

**4. Výplata prodejci:**

- Po úspěšném předání (stav SOLD + handoverCompleted):
  - Systém vypočítá: prodejní cena - provize = částka k výplatě
  - Výplata na bankovní účet prodejce (zadaný ve smlouvě / kontaktu)
  - **Lhůta: do 5 pracovních dní** po připsání platby na účet Carmakler
  - Stav výplaty: Čeká → Zpracovává se → Vyplaceno
  - Email prodejci: "Částka {X} Kč byla odeslána na váš účet"
  - SMS prodejci (TASK-029)

**5. Provize makléře — fakturace:**

- Makléř je na IČO → **vystavuje fakturu Carmakler** za svou polovinu provize
- **Dva režimy** (nastavitelné):
  - **Automatická fakturace:** systém vygeneruje fakturu za makléře (self-billing) → makléř potvrdí
  - **Ruční fakturace:** makléř nahraje vlastní fakturu → BackOffice schválí
- **Výplata provize makléři:**
  - Měsíční uzávěrka: 1. v měsíci se spočítají provize za předchozí měsíc
  - Makléř vidí v PWA: "Provize za únor: 45 500 Kč — k fakturaci"
  - Po nahrání/potvrzení faktury → výplata do 14 dní
  - Stav: K fakturaci → Faktura nahrána → Schváleno → Vyplaceno

**6. Manažerský bonus:**

- 2 500 Kč za každý prodej jeho makléře (upřesnit)
- Počítá se automaticky při prodeji
- Manažer je taky na IČO? Nebo zaměstnanec? → ovlivňuje fakturaci
- Zobrazení v manažerském dashboardu (TASK-023)

**7. Nové Prisma modely:**
```
model Payment {
  id              String   @id @default(cuid())
  vehicleId       String
  vehicle         Vehicle  @relation(fields: [vehicleId], references: [id])

  // Kupující
  buyerName       String
  buyerEmail      String
  buyerPhone      String?

  // Platba
  amount          Int           // Celková částka (prodejní cena)
  method          PaymentMethod // CARD, BANK_TRANSFER, FINANCING
  status          PaymentStatus // PENDING, PROCESSING, PAID, FAILED, REFUNDED

  // Stripe
  stripeSessionId    String?   // Stripe Checkout Session ID
  stripePaymentIntent String?  // Payment Intent ID
  variableSymbol     String?   // Variabilní symbol (pro převody)

  // Potvrzení
  confirmedAt     DateTime?
  confirmedById   String?      // Kdo potvrdil (u převodu BackOffice)
  confirmedBy     User?        @relation("PaymentConfirmer", fields: [confirmedById], references: [id])

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model SellerPayout {
  id              String   @id @default(cuid())
  vehicleId       String
  vehicle         Vehicle  @relation(fields: [vehicleId], references: [id])
  paymentId       String
  payment         Payment  @relation(fields: [paymentId], references: [id])

  sellerName      String
  sellerBankAccount String
  amount          Int           // Prodejní cena - provize
  commissionAmount Int          // Stržená provize

  status          PayoutStatus  // PENDING, PROCESSING, PAID, FAILED
  paidAt          DateTime?
  bankReference   String?       // Reference bankovního převodu

  createdAt       DateTime @default(now())
}

model BrokerPayout {
  id              String   @id @default(cuid())
  brokerId        String
  broker          User     @relation(fields: [brokerId], references: [id])
  period          String         // "2026-03" (rok-měsíc)

  commissions     Commission[]   // Provize zahrnuté v této výplatě
  totalAmount     Int            // Celková částka k výplatě (50% z provizí)
  invoiceUrl      String?        // URL nahrané faktury od makléře
  invoiceNumber   String?        // Číslo faktury

  status          PayoutStatus   // PENDING_INVOICE, INVOICE_UPLOADED, APPROVED, PAID
  approvedById    String?
  approvedBy      User?          @relation("PayoutApprover", fields: [approvedById], references: [id])
  paidAt          DateTime?

  createdAt       DateTime @default(now())
}

enum PaymentMethod {
  CARD
  BANK_TRANSFER
  FINANCING
}

// PaymentStatus a PayoutStatus — rozšířit existující nebo vytvořit nové
enum PayoutStatus {
  PENDING
  PENDING_INVOICE
  INVOICE_UPLOADED
  APPROVED
  PROCESSING
  PAID
  FAILED
}
```

Rozšíření Commission modelu:
- `brokerShare` Int — 50% provize (makléřova část)
- `companyShare` Int — 50% provize (firemní část)
- `managerBonus` Int — bonus manažera (2 500 Kč)
- `payoutId` String? — propojení na BrokerPayout
- `sellerPayoutId` String? — propojení na SellerPayout

**8. API routes:**
- `POST /api/payments/create-checkout` — vytvoření Stripe Checkout session
- `POST /api/payments/webhook` — Stripe webhook (payment_intent.succeeded)
- `GET /api/payments` — seznam plateb (admin)
- `PUT /api/payments/[id]/confirm` — ruční potvrzení převodu (BackOffice)
- `GET /api/payouts/seller` — výplaty prodejcům (admin)
- `POST /api/payouts/seller/[id]/process` — zpracovat výplatu prodejci
- `GET /api/payouts/broker` — výplaty makléřům (admin + makléř své)
- `POST /api/payouts/broker/[id]/upload-invoice` — nahrání faktury
- `PUT /api/payouts/broker/[id]/approve` — schválení faktury (BackOffice)
- `POST /api/payouts/broker/generate` — generování měsíční uzávěrky (admin/cron)

**9. Stripe konfigurace:**
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` v env
- Webhook endpoint: `/api/payments/webhook`
- Eventy: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- Měna: CZK

### Kontext:
- Závisí na: TASK-025 (prodejní flow — napojení platby na předání), TASK-017 (smlouvy — bankovní účet prodejce)
- Stripe: npm install stripe @stripe/stripe-js
- Webhook: ověření podpisu stripe.webhooks.constructEvent()
- QR kód pro platbu převodem: knihovna `qrcode` — generování QR s platebními údaji (IBAN, částka, VS)

### Očekávaný výsledek:
- Platba kartou (Stripe Checkout) a převodem (s QR kódem)
- Automatické potvrzení platby kartou (webhook), ruční u převodu
- Výplata prodejci po předání (do 5 prac. dní)
- Měsíční uzávěrka provizí makléřů s fakturací
- Manažerský bonus
- Přehled plateb a výplat v admin panelu

---

## TASK-033: Exkluzivní smlouva — flow, expirace, ukončení, porušení
Priorita: 1
Stav: čeká
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Exkluzivní zprostředkovatelská smlouva je jádro businessu — prodejce se zavazuje že nebude prodávat jinde po dobu platnosti smlouvy. Tento task řeší celý životní cyklus exkluzivity.

**1. Rozšíření modelu Vehicle:**
- `exclusiveUntil` DateTime? — datum konce exkluzivity
- `exclusiveContractId` String? — propojení na Contract

**2. Rozšíření modelu Contract (TASK-017):**
- `exclusiveDuration` Int — doba exkluzivity v měsících (default 3)
- `exclusiveStartDate` DateTime — začátek exkluzivity (datum podpisu)
- `exclusiveEndDate` DateTime — konec exkluzivity (automaticky = start + duration)
- `earlyTermination` Boolean @default(false) — předčasné ukončení
- `terminationReason` String? — důvod ukončení
- `terminationDate` DateTime? — datum ukončení
- `violationReported` Boolean @default(false) — porušení exkluzivity
- `violationDetails` String? — popis porušení
- `penaltyAmount` Int? — smluvní pokuta (pokud v podmínkách)

**3. Podpis exkluzivní smlouvy:**

- Po nabírání auta (TASK-016, krok 7 — review) → **před odesláním ke schválení musí být podepsána exkluzivní smlouva**
  - Tlačítko "Odeslat ke schválení" je neaktivní dokud není smlouva podepsána
  - Alternativně: po odeslání systém nabídne "Podepsat smlouvu nyní" → přesměruje na TASK-017 flow
- Ve smlouvě:
  - Doba exkluzivity: select 1 / 2 / 3 / 6 měsíců (default 3)
  - Automaticky se spočítá datum konce
  - Podmínky: "Prodávající se zavazuje, že po dobu platnosti této smlouvy nebude vozidlo nabízet k prodeji prostřednictvím jiných zprostředkovatelů ani soukromě."
  - Smluvní pokuta za porušení (volitelné pole, nastavitelné)

**4. Upozornění na blížící se konec exkluzivity:**

| Kdy | Komu | Typ | Zpráva |
|---|---|---|---|
| 14 dní před koncem | Makléř | Push + email | "Exkluzivita na {auto} končí za 14 dní ({datum}). Doporučujeme kontaktovat prodejce." |
| 7 dní před koncem | Makléř + manažer | Push + email | "Exkluzivita na {auto} končí za 7 dní. Prodloužit nebo snížit cenu?" |
| Den konce | Makléř + manažer | Push + email | "Exkluzivita na {auto} dnes končí!" |
| Po vypršení | Systém | Automaticky | Stav smlouvy → EXPIRED, inzerát zůstává aktivní ale bez exkluzivity |

- Cron job: denně kontrola blížících se expirace

**5. Prodloužení exkluzivity:**

- Makléř kontaktuje prodejce → domluví prodloužení
- V PWA: tlačítko "Prodloužit exkluzivitu" na detailu vozu:
  - Nová doba: select 1/2/3/6 měsíců
  - Generuje se dodatek ke smlouvě (nebo nová smlouva)
  - Podpis prodejce (digitální — stejný mechanismus jako TASK-017)
  - Po podpisu: `exclusiveUntil` se aktualizuje

**6. Ukončení smlouvy (prodejce chce auto stáhnout):**

- Prodejce zavolá makléři → chce auto stáhnout
- Makléř v PWA: tlačítko "Ukončit smlouvu" na detailu vozu:
  - Důvod: select — Prodejce si to rozmyslel / Prodejce prodal sám / Auto nepojízdné / Jiný důvod
  - Poznámka (textarea)
  - Pokud je ve smlouvě smluvní pokuta a prodejce porušil exkluzivitu → zobrazit: "Pozor: smluvní pokuta {částka} Kč dle smlouvy"
- Po ukončení:
  - Smlouva: status TERMINATED, earlyTermination = true
  - Vehicle: status ACTIVE → ARCHIVED
  - Inzerát se stáhne z webu
  - Notifikace manažerovi
  - Záznam v change log

**7. Porušení exkluzivity (prodejce prodává jinde):**

- Makléř zjistí že prodejce inzeruje auto na Bazos/Sauto/FB:
  - V PWA: tlačítko "Nahlásit porušení" na detailu vozu:
    - Popis porušení (textarea)
    - Důkaz (screenshot — fotka/upload)
    - URL kde je auto inzerováno (volitelné)
  - Notifikace manažerovi + BackOffice
  - Manažer rozhodne: kontaktovat prodejce → buď stáhne jiný inzerát, nebo se řeší smluvní pokuta
  - Záznam: violationReported = true, violationDetails

**8. Zobrazení v PWA:**

- **Detail vozu** — sekce "Exkluzivní smlouva":
  - Stav: Aktivní (zelená) / Brzy vyprší (žlutá, <14 dní) / Vypršela (červená) / Ukončena (šedá)
  - Datum do: "Exkluzivita do {datum} (zbývá {dní} dní)"
  - Tlačítka: Prodloužit / Ukončit / Nahlásit porušení
  - Odkaz na podepsanou smlouvu (PDF)

- **Dashboard** — upozornění:
  - "⚠️ 2 smlouvy vyprší tento týden" (s prokliky)

- **Moje vozy** — badge:
  - U každého vozu: "Exkl. do {datum}" nebo "⚠️ Exkl. vyprší za 5 dní"

### Kontext:
- Závisí na: TASK-017 (smlouvy — sdílený podpisový mechanismus), TASK-016 (nabírání — vynucení podpisu)
- Právní text smlouvy: placeholder, finální verzi dodá právník
- Smluvní pokuta: konfigurovatelná v admin nastavení (default: žádná nebo X Kč)

### Očekávaný výsledek:
- Exkluzivní smlouva povinná před odesláním ke schválení
- Volitelná doba exkluzivity (1-6 měsíců)
- Automatická upozornění před koncem (14/7/1 den)
- Prodloužení exkluzivity s digitálním podpisem
- Ukončení smlouvy prodejcem s důvodem
- Nahlášení porušení exkluzivity s důkazem
- Zobrazení stavu exkluzivity v celé PWA

---

## TASK-034: CRM prodejců — kontakty, historie komunikace, synchronizace
Priorita: 1
Stav: čeká
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

CRM modul pro makléře — správa kontaktů na prodejce s historií komunikace, propojení s vozidly a synchronizace mezi offline (IndexedDB) a serverem.

**1. Prisma model:**
```
model SellerContact {
  id              String   @id @default(cuid())
  brokerId        String
  broker          User     @relation(fields: [brokerId], references: [id])

  name            String
  phone           String
  email           String?
  address         String?
  city            String?
  note            String?

  // Propojení s vozidly
  vehicles        Vehicle[]  // Auta tohoto prodejce

  // Statistiky
  totalVehicles   Int @default(0)   // Kolik aut přes něj nabráno
  totalSold       Int @default(0)   // Kolik prodáno
  lastContactAt   DateTime?

  // Follow-up
  nextFollowUp    DateTime?
  followUpNote    String?

  // Komunikace
  communications  SellerCommunication[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([brokerId])
  @@index([phone])
  @@index([nextFollowUp])
}

model SellerCommunication {
  id          String   @id @default(cuid())
  contactId   String
  contact     SellerContact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  brokerId    String
  broker      User     @relation(fields: [brokerId], references: [id])

  type        CommunicationType  // CALL, SMS, EMAIL, MEETING, NOTE
  direction   String?            // OUTGOING, INCOMING (u volání/SMS)
  summary     String             // Stručný popis ("Domluvena schůzka na pátek")
  duration    Int?               // Délka hovoru v sekundách (volitelné)
  result      String?            // Výsledek: INTERESTED, NOT_NOW, REJECTED, FOLLOW_UP

  createdAt   DateTime @default(now())
}

enum CommunicationType {
  CALL
  SMS
  EMAIL
  MEETING
  NOTE
}
```

Rozšíření Vehicle modelu:
- `sellerContactId` String? — propojení na SellerContact

**2. PWA obrazovka — Kontakty (`/app/contacts`):**

- **Seznam kontaktů:**
  - Vyhledávání (jméno, telefon)
  - Filtry: Všechny / S vozem / Bez vozu / K follow-upu (nextFollowUp <= dnes)
  - Karta kontaktu: jméno, telefon, počet aut, poslední kontakt, follow-up datum
  - Badge "Follow-up dnes" (červený) u kontaktů kde nextFollowUp <= dnes

- **Detail kontaktu (`/app/contacts/[id]`):**
  - Jméno, telefon (s tlačítky: Zavolat, SMS, WhatsApp), email, adresa, poznámka
  - **Vozidla tohoto prodejce:** seznam aut (s proklikem na detail vozu)
  - **Statistiky:** celkem nabráno aut, celkem prodáno, úspěšnost
  - **Follow-up:** datum příštího kontaktu + poznámka, tlačítko "Nastavit follow-up"
  - **Timeline komunikace:**
    - Chronologický seznam (nejnovější nahoře)
    - Ikony: 📞 hovor, 💬 SMS, 📧 email, 🤝 schůzka, 📝 poznámka
    - Každý záznam: typ, datum, popis, výsledek
  - **Přidat komunikaci:** tlačítko → formulář:
    - Typ: select (Hovor / SMS / Email / Schůzka / Poznámka)
    - Směr: Odchozí / Příchozí (u hovoru/SMS)
    - Popis (textarea)
    - Výsledek: Zájem / Teď ne / Odmítnutí / Follow-up
    - Datum dalšího kontaktu (pokud Follow-up)

- **Přidání kontaktu (`/app/contacts/new`):**
  - Jméno, telefon, email, adresa, poznámka
  - Nebo: automaticky při nabírání auta (Step 1 kontakt se uloží jako SellerContact)

**3. Propojení s nabíráním (TASK-016):**

- Step 1 (Kontakt): "Najít v kontaktech" → hledá v SellerContact
- Po nabírání: kontakt se automaticky vytvoří/aktualizuje v SellerContact
- Při dalším nabírání od stejného prodejce → data předvyplněná

**4. Synchronizace offline ↔ server:**

- IndexedDB store `contacts` (existující z TASK-015) se synchronizuje s Prisma SellerContact
- **Strategie:** server-authoritative s offline cache
  - Při online: čtení ze serveru, ukládání na server + lokální cache
  - Při offline: čtení/ukládání do IndexedDB
  - Při reconnect: sync pending changes na server (Background Sync tag `sync-contacts`)
- **Conflict resolution:** last-write-wins s timestampem (updatedAt)
- Kontakty jsou **per makléř** — makléř vidí jen své kontakty

**5. Dashboard integrace:**
- Na dashboardu sekce "K follow-upu dnes" (max 3 kontakty kde nextFollowUp <= dnes)
- Badge v bottom nav u "Kontakty" pokud jsou nevyřízené follow-upy

**6. SMS šablony pro prodejce:**

Předpřipravené SMS šablony dostupné z detailu kontaktu:
- "Dobrý den, {jméno}. Jsem {makléř} z Carmakler. Zavolám vám ohledně prodeje vašeho vozu."
- "Mám pro vaše auto zájemce, zavolám vám zítra s detaily."
- "Jak jste spokojeni? Jsme stále v kontaktu, kdybyste potřebovali cokoliv."
- "Doporučujeme snížit cenu vašeho vozu na {cena} Kč pro rychlejší prodej."
- Makléř vybere šablonu → upraví → odešle (otevře SMS appku s předvyplněným textem)

**7. API routes:**
- `GET /api/contacts` — seznam kontaktů makléře
- `POST /api/contacts` — vytvoření kontaktu
- `GET /api/contacts/[id]` — detail
- `PUT /api/contacts/[id]` — editace
- `DELETE /api/contacts/[id]` — smazání
- `POST /api/contacts/[id]/communications` — přidání komunikace
- `GET /api/contacts/[id]/communications` — seznam komunikací
- `GET /api/contacts/search?q=XXX` — vyhledávání (jméno, telefon)
- `POST /api/contacts/sync` — sync offline změn

### Kontext:
- Závisí na: TASK-015 (IndexedDB store contacts), TASK-016 (propojení s nabíráním Step 1)
- Kontakty jsou per makléř — API filtruje přes brokerId z session
- Offline sync: rozšíření Background Sync z TASK-015

### Očekávaný výsledek:
- CRM obrazovka v PWA se seznamem kontaktů, vyhledáváním, filtry
- Detail kontaktu s historií komunikace (timeline)
- Follow-up systém s upozorněním na dashboardu
- Automatické vytváření kontaktů při nabírání
- SMS šablony pro komunikaci s prodejci
- Offline/online synchronizace kontaktů
- Propojení kontaktů s vozidly

---

## TASK-035: Detail vozu v PWA — kompletní specifikace obrazovky
Priorita: 1
Stav: čeká
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Specifikace obrazovky detailu vozu v PWA (`/app/vehicles/[id]`) — centrální místo odkud makléř spravuje vše kolem konkrétního auta.

**Layout:**
- Top bar: šipka zpět + název vozu ("Škoda Octavia RS") + stav badge
- Scrollovatelný obsah
- Bottom: akční tlačítka (kontextová podle stavu)

**Obsah — sekce shora dolů:**

**1. Hlavička:**
- Hlavní fotka (carousel swipe pro další)
- Název: ZNAČKA MODEL VARIANTA ROK
- Parametry: motor • výkon • převodovka • pohon
- Cena (velká) + "k jednání" badge
- Stav: badge (Draft / Ke schválení / Aktivní / Rezervováno / Prodáno / Zamítnuto / Archivováno)
- Provize: "💰 Vaše provize: {částka} Kč" (jen u aktivních/prodaných)

**2. Exkluzivní smlouva (TASK-033):**
- Stav exkluzivity: Aktivní (zelená) / Brzy vyprší (žlutá) / Vypršela (červená)
- Datum do: "Do {datum} (zbývá {dní} dní)"
- Tlačítka: Prodloužit / Ukončit / Nahlásit porušení / Zobrazit smlouvu (PDF)

**3. Prodejce:**
- Jméno, telefon (tlačítka: 📞 Zavolat, 💬 SMS, 📱 WhatsApp)
- Email (tlačítko: 📧 Poslat email)
- Adresa
- Odkaz na kontakt v CRM (TASK-034)

**4. Akce s emailem:**
- Tlačítka pro rychlé odeslání emailu (TASK-026):
  - "Poslat follow-up" / "Navrhnout snížení ceny" / "Oznámit prodej" (kontextové podle stavu)

**5. Dotazy kupujících (TASK-025):**
- Počet dotazů (badge)
- Seznam dotazů: jméno, zpráva, datum, stav (nový/odpovězeno/prohlídka/...)
- Tlačítko "Odpovědět" u každého dotazu
- Tlačítko "Zavolat" u každého dotazu

**6. Prohlídky:**
- Seznam domluvených prohlídek (datum, kupující, stav)
- Tlačítko "Naplánovat prohlídku"

**7. Statistiky:**
- Zobrazení celkem / tento týden
- Dotazy celkem
- Dní na platformě
- Odkaz na veřejný inzerát (otevře web)

**8. Údaje vozu (accordion/tabs):**
- Základní: VIN (🔒), značka, model, rok, km, palivo, výkon, barva, karoserie, dveře, místa
- Stav: stav vozu, STK, servisní kniha, počet majitelů, země původu
- Výbava: seznam výbavy (checkboxy, readonly)
- Prohlídka: výsledky z checklistu (Step 2), celkový dojem, testovací jízda
- Popis: text inzerátu

**9. Fotky:**
- Grid fotek (thumbnail klikatelný → fullscreen)
- Počet fotek
- Tlačítko "Přidat fotky" / "Upravit fotky" (jen u Draft/Active)

**10. Poškození (TASK-025):**
- Seznam nahlášených poškození (pokud existují): popis, závažnost, fotky, stav (nahlášeno/opraveno)
- Tlačítko "Nahlásit poškození"

**11. Cenová historie (TASK-028):**
- Mini graf nebo textový seznam změn ceny

**12. Timeline / historie (TASK-028):**
- Vertikální timeline: vytvořeno → prohlídka → schváleno → publikováno → dotazy → změna ceny → ...
- Včetně interních záznamů (jen pro makléře, ne veřejné)

**13. Smlouvy:**
- Seznam smluv k vozu (zprostředkovatelská, předávací protokol)
- Stav: draft / podepsaná / odeslaná
- Tlačítko "Nová smlouva"
- Odkaz na PDF

**14. Emaily:**
- Historie odeslaných emailů k tomuto vozu (TASK-026)
- Typ, příjemce, datum, stav

**Akční tlačítka (kontextová podle stavu):**

| Stav | Tlačítka |
|---|---|
| DRAFT | Pokračovat v editaci, Smazat draft |
| DRAFT_QUICK | Doplnit údaje, Smazat |
| PENDING | Čeká na schválení (readonly info) |
| REJECTED | Důvod zamítnutí + Opravit a odeslat znovu |
| ACTIVE | Editovat, Změnit cenu, Rezervovat, Nahlásit poškození, Stáhnout z nabídky |
| RESERVED | Info o kupujícím + Zrušit rezervaci, Zaplatit (odkaz na platbu), Předat (checklist) |
| PAID | Domluv předání, Předávací checklist |
| SOLD | Info o prodeji, provize, Hodnocení kupujícího |
| ARCHIVED | Znovu aktivovat (pokud exkluzivita platí) |

**Práva:**
- Makléř: vidí jen své vozy, plný přístup
- Manažer: vidí vozy svých makléřů, může editovat, schvalovat
- BackOffice/Admin: vidí vše

### Kontext:
- Závisí na: TASK-015 (layout), TASK-016 (data vozu), TASK-017 (smlouvy), TASK-025 (dotazy, prohlídky, poškození), TASK-026 (emaily), TASK-028 (cenová historie, timeline), TASK-033 (exkluzivita), TASK-034 (kontakt prodejce CRM)
- Tato obrazovka je HUB — propojuje téměř všechny tasky dohromady
- Offline: základní údaje cachované v IndexedDB, detailní data (dotazy, emaily) jen online

### Očekávaný výsledek:
- Kompletní detail vozu se všemi informacemi a akcemi
- Kontextová akční tlačítka podle stavu vozu
- Propojení na smlouvy, dotazy, emaily, CRM kontakt, poškození, statistiky
- Práva: makléř své, manažer svých makléřů, admin vše

---

## TASK-036: Nastavení makléře, vyhledávání v PWA, eskalace, přenos vozů
Priorita: 2
Stav: čeká
Projekt: /Users/lunagroup/carmakler

### Kompletní zadání:

Doplňující funkce PWA které vyplynuly z analýzy — nastavení, globální vyhledávání, eskalace problémů a přenos vozů.

**1. Nastavení makléře (`/app/settings`):**

- **Účet:**
  - Změna hesla (staré heslo + nové + potvrzení)
  - Email (readonly — zobrazit, ne editovat)
  - IČO (readonly po registraci)
  - Bankovní účet pro výplatu provizí (IBAN, editovatelný)

- **Notifikace** (TASK-029 — ale potřebuje vlastní obrazovku):
  - Toggle push/email per událost (viz TASK-029)

- **Režim nabírání:**
  - Toggle "Rychlý režim" (TASK-030) — jen pro úroveň Makléř+
  - Info: "Zjednodušený 3-krokový flow"

- **Podpis:**
  - Nastavit defaultní podpis pro emaily (jméno, telefon, foto)
  - Preview podpisu

- **Data a soukromí:**
  - "Exportovat moje data" → generování ZIP s vozy, kontakty, provizemi (GDPR)
  - "Smazat účet" → žádost o smazání → BackOffice zpracuje

- **O aplikaci:**
  - Verze, odkaz na podmínky, odkaz na podporu

**2. Globální vyhledávání v PWA:**

- **Search bar** v top baru (ikona lupy → rozbalí se input)
- Hledá napříč:
  - Vozidla: VIN, značka, model (makléřova)
  - Kontakty: jméno, telefon
  - Smlouvy: číslo smlouvy, jméno prodejce
- Výsledky seskupené: "Vozidla (3)" / "Kontakty (1)" / "Smlouvy (0)"
- Proklik na detail
- Debounce 300ms, min 2 znaky
- Offline: hledá v IndexedDB (vozidla, kontakty)
- Online: API `GET /api/search?q=XXX` (filtrované podle brokerId)

**3. Eskalace problému na manažera:**

- Tlačítko "Eskalovat" dostupné v:
  - Detail vozu (problém s autem/prodejcem)
  - Detail kontaktu (problém s prodejcem)
  - Obecně (menu → "Nahlásit problém")
- **Formulář eskalace:**
  - Typ: Problém s prodejcem / Podezření na podvod / Technický problém / Porušení exkluzivity / Jiné
  - Popis (textarea)
  - Přílohy (fotky/screenshoty — upload)
  - Propojení: s vozidlem (select) a/nebo kontaktem (select)
  - Urgence: Normální / Urgentní
- Po odeslání:
  - Notifikace manažerovi (push + email)
  - U urgentních: notifikace i BackOffice
  - Makléř vidí stav eskalace: Odesláno → Řeší se → Vyřešeno
- **Prisma model:**
```
model Escalation {
  id          String   @id @default(cuid())
  brokerId    String
  broker      User     @relation(fields: [brokerId], references: [id])
  managerId   String?
  manager     User?    @relation(fields: [managerId], references: [id])
  vehicleId   String?
  vehicle     Vehicle? @relation(fields: [vehicleId], references: [id])
  contactId   String?

  type        String   // SELLER_ISSUE, FRAUD_SUSPICION, TECHNICAL, EXCLUSIVITY_VIOLATION, OTHER
  urgency     String   // NORMAL, URGENT
  description String
  attachments Json?    // URLs
  status      String   // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  resolution  String?  // Popis řešení

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**4. Přenos vozů na jiného makléře:**

Když makléř onemocní, odejde, nebo se změní region:

- **Manažer v admin panelu:**
  - Detail makléře → tlačítko "Přenést vozy"
  - Výběr: všechny vozy / vybrané vozy (checkboxy)
  - Cílový makléř: select (z makléřů pod stejným manažerem)
  - Po přenosu:
    - Vehicle.brokerId se změní na nového makléře
    - Záznam v change log: "Přeneseno z {starý} na {nový}, důvod: {důvod}"
    - Notifikace novému makléři: "Byly vám přeneseny vozy od {jméno}"
    - Smlouvy zůstávají platné (Carmakler je strana, ne konkrétní makléř)
    - Kontakt prodejce: nový makléř by měl zavolat a představit se

- **Hromadná deaktivace makléře:**
  - Manažer deaktivuje makléře → systém nabídne: "Makléř má {X} aktivních vozů. Přenést na:" + select
  - Pokud nepřenese → vozy se automaticky přiřadí manažerovi (dočasně)

**5. API routes:**
- `GET /api/search?q=XXX` — globální vyhledávání
- `PUT /api/settings/password` — změna hesla
- `PUT /api/settings/bank-account` — změna bankovního účtu
- `GET /api/settings/export` — export dat (GDPR)
- `POST /api/escalations` — vytvoření eskalace
- `GET /api/escalations` — seznam eskalací (makléř své, manažer svých makléřů)
- `PUT /api/escalations/[id]` — aktualizace stavu (manažer)
- `POST /api/admin/brokers/[id]/transfer-vehicles` — přenos vozů

### Kontext:
- Závisí na: TASK-015 (layout — search bar v top baru), TASK-023 (manažer — přenos vozů)
- Search: Prisma full-text search nebo LIKE query
- GDPR export: generovat async, notifikovat makléře emailem s download linkem

### Očekávaný výsledek:
- Kompletní nastavení makléře (heslo, účet, notifikace, podpis, data export)
- Globální vyhledávání (vozy, kontakty, smlouvy)
- Eskalace problémů na manažera s tracking stavů
- Přenos vozů mezi makléři (jednotlivě nebo hromadně)

---

<!-- Další úkoly přidávej pod tuto čáru ve stejném formátu -->
