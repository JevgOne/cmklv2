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

<!-- Další úkoly přidávej pod tuto čáru ve stejném formátu -->
