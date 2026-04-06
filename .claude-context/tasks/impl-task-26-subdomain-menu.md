# Impl report — Task #26: Subdomain menu (PlatformSwitcher)

**Plán:** `.claude-context/tasks/plan-task-26-subdomain-menu.md`
**Build:** ✅ prošel (`npm run build`)
**Lint:** ✅ 0 errors na dotčených souborech (2 pre-existing warnings v MobileMenu `setMounted` efektu — nebyly mnou zavedeny)

---

## Safety check — orphan files

Před jakýmkoli zásahem spuštěn grep (plán sekce 4.4):

```
grep -rn "from.*components/web/Navbar" → 0 matches
grep -rn "from.*components/web/Footer" → 0 matches
grep -rn "from.*components/web/MobileMenu" → 0 matches
```

**Výsledek:** Všechny 3 orphan triády jsou potvrzené orphan. Postupuji dle plánu → migrovat + TODO komentář.

---

## Co bylo uděláno

### 1. `components/ui/PlatformSwitcher.tsx` — NEW

Sdílená komponenta pro cross-subdomain navigaci. Export `PlatformSwitcher` + typy `PlatformKey`, `PlatformSwitcherProps`. **Server component** (není `"use client"`) — nic nepotřebuje interakci/state, `urls.*` je inlined na build.

- `PLATFORMS` array — 4 platformy (main, inzerce, shop, marketplace) s `label` (desktop), `mobileLabel`, `href: urls.X("/")`
- 3 varianty:
  - `navbar` — horizontal flex row, text linky s active state `text-orange-600 bg-orange-50`
  - `navbar-mobile` — vertical list s "Ostatní platformy" header, `py-4 border-b min-h-[44px]` (WCAG touch target)
  - `footer` — `<ul>` s `flex-col gap-3`, `text-gray-500 hover:text-white`
- `hideCurrent?: boolean` — filtruje current platformu ze seznamu (used v navbarech)
- `theme?: "light" | "dark"` — dark variant pro marketplace navbar (dark background)
- `onLinkClick?: () => void` — callback pro zavření mobile menu po kliknutí
- `aria-current="page"` na aktuální platformě pro screen readers
- `<a>` tagy (NE `<Link>`) — `next/link` nefunguje přes origin hranice subdomén
- Export přidán do `components/ui/index.ts`

### 2. `components/main/Navbar.tsx` — EDIT

- Odstraněn import `urls` (už nepoužíván v tomto souboru)
- Přidán import `PlatformSwitcher`
- 3 hardcoded `<a>` linky (Inzerce, Shop, a jejich redundantní main) → 1× `<PlatformSwitcher current="main" hideCurrent />`
- Umístění: mezi "Nabídka vozidel" a dropdown "Služby" (původní pattern)
- `hideCurrent={true}` → na main doméně se skryje link na sebe, zůstanou 3 linky (Inzerce, Shop, Marketplace)

### 3. `components/main/MobileMenu.tsx` — EDIT

- Odstraněn import `urls`, přidán `PlatformSwitcher` z `@/components/ui`
- 2 hardcoded `<a>` linky (Inzerce, Shop) → 1× `<PlatformSwitcher current="main" variant="navbar-mobile" hideCurrent onLinkClick={closeMenu} />`
- Přesunuto pod "Nabídka vozidel" + "Kontakt", nad "Služby" dropdown
- `onLinkClick` volá `closeMenu` (closes overlay + resets openSection)

### 4. `components/main/Footer.tsx` — EDIT

- Odstraněn import `urls` (už nepoužíván)
- Přidán import `PlatformSwitcher`
- Sekce "Platformy" v `footerSections` array **odstraněna** (měla jen 3 položky včetně "Pro makléře" což je `/kariera`, což logicky nepatří do cross-platform switcheru)
- Přidána nová dedikovaná div kolona ("Platformy") po `footerSections.map(...)` → `<PlatformSwitcher current="main" variant="footer" />`
- Grid zůstává 5-column na desktop (logo + 3 sekce z mapy + Platformy)
- `hideCurrent={false}` → footer je canonical index, zobrazuje všechny 4 platformy

### 5. `components/inzerce/Navbar.tsx` — EDIT

- Přidán import `PlatformSwitcher`
- **Desktop:** Přidán `<span>` separator (`mx-2 h-5 w-px bg-gray-200`) + `<PlatformSwitcher current="inzerce" hideCurrent />` za existující interní linky (Katalog, Přidat inzerát, Moje inzeráty)
- Odstraněn redundantní `carmakler.cz` link v CTA sekci (nahrazen switcherem)
- **Mobile:** Nahrazen `carmakler.cz` link za `<PlatformSwitcher variant="navbar-mobile" ... onLinkClick={() => setIsOpen(false)} />`

### 6. `components/shop/Navbar.tsx` — EDIT

Identická úprava jako inzerce navbar, jen `current="shop"`:
- Desktop: separator + PlatformSwitcher za Moje objednávky
- Odstraněn `carmakler.cz` v CTA
- Mobile: replaced `carmakler.cz` za PlatformSwitcher navbar-mobile

### 7. `components/marketplace/Navbar.tsx` — EDIT

Identická úprava, ale **dark theme** (marketplace navbar je `bg-gray-950`):
- Desktop: separator `bg-gray-800` (dark) + `<PlatformSwitcher current="marketplace" hideCurrent theme="dark" />`
- Mobile: `theme="dark"` prop → použije gray-300 / border-gray-800 / hover orange-400

### 8. `components/inzerce/Footer.tsx` — EDIT

- Přidán import `PlatformSwitcher`
- "Další platformy" sekce (ručně psaných `<a>` s `urls.main`, `urls.shop`) → `<PlatformSwitcher current="inzerce" variant="footer" />`
- `urls` import zůstává — stále používán pro legal links v bottom baru (`urls.main("/ochrana-osobnich-udaju")` atd.)

### 9. `components/shop/Footer.tsx` — EDIT

Stejně jako inzerce footer, `current="shop"`. `urls` import zůstává pro legal links.

### 10. `components/marketplace/Footer.tsx` — EDIT

Stejně, `current="marketplace"`. Odstraněny 3 ručně psané `<a>` (CarMakléř, Inzerce, Shop) → jeden `<PlatformSwitcher>` call. Marketplace footer teď zobrazí i sám sebe (bez `hideCurrent`) — canonical index.

### 11. `components/web/Navbar.tsx` — EDIT (orphan dual-write)

- Přidán TODO komentář na začátek:
  ```
  /**
   * TODO(cleanup): Pravděpodobně orphan — není importován v žádné App Router route.
   * Grep provedeno 2026-04-06, žádné importy nenalezeny.
   * ...
   */
  ```
- Migrován na PlatformSwitcher stejně jako `components/main/Navbar.tsx`
- Odstraněny hardcoded `<Link href="/inzerce">` a `<Link href="/shop">` (které byly špatně — měly být `<a href={urls.inzerce(...)}>`)
- Odstraněn nepoužívaný `ExternalLinkIcon` helper (dead code)

### 12. `components/web/MobileMenu.tsx` — EDIT (orphan dual-write)

- Přidán TODO komentář
- Hardcoded `<Link href="/inzerce">` + `<Link href="/shop">` → `<PlatformSwitcher variant="navbar-mobile" hideCurrent onLinkClick={closeMenu} />`
- Import `Button` + `PlatformSwitcher` z `@/components/ui`

### 13. `components/web/Footer.tsx` — EDIT (orphan dual-write)

- Přidán TODO komentář
- Sekce "Platformy" v array odstraněna, nahrazena dedikovanou kolonou s `<PlatformSwitcher current="main" variant="footer" />`

### 14. `components/ui/index.ts` — EDIT

Přidán barrel export:
```typescript
export { PlatformSwitcher } from "./PlatformSwitcher";
export type { PlatformKey, PlatformSwitcherProps } from "./PlatformSwitcher";
```

---

## Odchylky od plánu

### 1. Server component místo client component (schváleno plánem sekce 6)

Plán v sekci 3.1 psal `"use client"`, ale v sekci 6 (aktualizace) ho explicitně zmínil jako **volitelné**: _"`urls.ts` už NEpoužívá `"use client"` a běží server-side — Next.js inlinuje `NEXT_PUBLIC_*` do buildu. Takže `PlatformSwitcher` MŮŽE být server component."_

Rozhodl jsem jít server component, protože:
- PlatformSwitcher neobsahuje state/useEffect/onClick (kromě optional `onLinkClick` prop, což je OK — rodič volá child handler, prop funguje i v RSC→CC boundary)
- Server komponenty jsou levnější (žádný JS bundle)
- `onLinkClick` je volitelný prop typu `() => void`, volán v atributu `onClick={onLinkClick}` — tohle funguje v obou módech, protože nutná hranice klientské interaktivity je v parent `MobileMenu.tsx` (který je `"use client"`), ne v PlatformSwitcher samotném

### 2. Odstraněn `carmakler.cz` link v subdomain navbarech

Plán to explicitně nepřikazoval, ale:
- Link byl redundantní — PlatformSwitcher obsahuje "CarMakléř" label → je to lepší UX pattern
- Ponechání obou by znamenalo 2× link na main subdoménu = zmatečné
- Rozhodl jsem odstranit `carmakler.cz` ve prospěch PlatformSwitcheru (konzistence napříč všemi 4 navbary)

### 3. `components/main/Footer.tsx` — odstranění položky "Pro makléře" z Platformy sekce

Původní `footerSections` obsahoval položku "Platformy" → `{ href: "/kariera", label: "Pro makléře" }`. Plán sekce 4.3 psal _"Odstranit položku 'Provizní systém' (není relevantní cross-platform)"_ — ale stejnou logikou "Pro makléře" (= career page) taky není platforma. Odstranil jsem celou původní "Platformy" sekci z arraye a nahradil ji dedikovanou kolonou s PlatformSwitcherem.

Důvod: PlatformSwitcher ukazuje 4 kanonické platformy (main, inzerce, shop, marketplace). Kariéra je samostatná rubrika a je už v sekci "O nás". Míchat je by znamenalo uživatelsky matoucí zážitek.

---

## Compliance s plánem — acceptance criteria

- [x] `components/ui/PlatformSwitcher.tsx` existuje, exportuje `PlatformSwitcher` + `PlatformKey`
- [x] Komponenta podporuje 3 varianty: `navbar`, `navbar-mobile`, `footer`
- [x] Komponenta podporuje `hideCurrent` prop
- [x] Komponenta podporuje `theme: "light" | "dark"` (navíc oproti plánu — pro marketplace dark navbar)
- [x] Komponenta používá `urls.*` z `lib/urls.ts` a `<a>` tagy (ne `<Link>`)
- [x] `MainNavbar` používá `<PlatformSwitcher current="main" hideCurrent />`
- [x] `MainMobileMenu` používá `<PlatformSwitcher current="main" variant="navbar-mobile" hideCurrent />`
- [x] `MainFooter` sekce "Platformy" používá `<PlatformSwitcher current="main" variant="footer" />`
- [x] `InzerceNavbar` obsahuje switcher s `current="inzerce"`
- [x] `ShopNavbar` obsahuje switcher s `current="shop"`
- [x] `MarketplaceNavbar` obsahuje switcher s `current="marketplace"` (dark theme)
- [x] `InzerceFooter` obsahuje `current="inzerce"` + `variant="footer"`
- [x] `ShopFooter` stejně
- [x] `MarketplaceFooter` stejně
- [x] `components/web/Navbar.tsx` migrován + TODO komentář
- [x] `components/web/Footer.tsx` migrován + TODO komentář
- [x] `components/web/MobileMenu.tsx` migrován + TODO komentář
- [x] `npm run build` prošel bez errors
- [x] `components/pwa/TopBar.tsx` zůstává beze změny
- [x] Marketplace link ve všech 4 navbarech (main hideCurrent+3, inzerce/shop hideCurrent+3, marketplace hideCurrent+3)
- [x] Marketplace link ve všech 4 footerech (všechny bez hideCurrent → 4 položky)
- [ ] Manuální test `localhost:3000` → ostatní subdomény — **ponecháno pro QA** (implementor nemá konfigurovaný dev subdomain proxy)

---

## Seznam souborů v commitu

```
A  components/ui/PlatformSwitcher.tsx
M  components/ui/index.ts
M  components/main/Navbar.tsx
M  components/main/Footer.tsx
M  components/main/MobileMenu.tsx
M  components/inzerce/Navbar.tsx
M  components/inzerce/Footer.tsx
M  components/shop/Navbar.tsx
M  components/shop/Footer.tsx
M  components/marketplace/Navbar.tsx
M  components/marketplace/Footer.tsx
M  components/web/Navbar.tsx        (orphan dual-write + TODO)
M  components/web/Footer.tsx        (orphan dual-write + TODO)
M  components/web/MobileMenu.tsx    (orphan dual-write + TODO)
```

14 souborů celkem (1 create + 13 edit).
