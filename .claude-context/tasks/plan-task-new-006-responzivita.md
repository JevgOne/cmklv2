# TASK-NEW-006: Plán testování responzivity celého webu

**Datum:** 2026-05-20
**Autor:** Plánovač
**Status:** HOTOVO

---

## Přehled

Detailní manuální test plán pro ověření responzivity všech stránek platformy Carmakler.

### Breakpointy

| Breakpoint | Šířka | Zařízení | Tailwind prefix |
|-----------|-------|----------|-----------------|
| **Mobile** | 375px | iPhone SE / 13 Mini | (default) |
| **Tablet** | 768px | iPad Mini / Air | `md:` |
| **Desktop** | 1280px | Notebook / Monitor | `lg:` / `xl:` |

### Jak testovat
- Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
- Responsive mode → nastavit šířku na 375 / 768 / 1280
- Testovat i landscape orientaci na mobile/tablet (667px / 1024px)

### Obecná kritéria (platí pro VŠECHNY stránky)
- [ ] Žádný horizontální scroll (overflow-x)
- [ ] Text je čitelný bez zoomování (min 14px na mobile)
- [ ] Tlačítka/linky mají dostatečnou touch target oblast (min 44x44px)
- [ ] Obrázky se přizpůsobují šířce kontejneru
- [ ] Formuláře jsou použitelné (inputy nezasahují mimo viewport)
- [ ] Modaly/dialogy se vejdou na obrazovku
- [ ] Sticky/fixed elementy neblokují obsah

---

## 1. HLAVNÍ WEB (carmakler.cz)

### 1.1 Navigace & Layout

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/` (layout) | MainNavbar | Hamburger menu, logo vlevo, cart icon | Hamburger nebo partial menu | Plný horizontální navbar s dropdowny |
| `/` (layout) | MainFooter | Stacked columns (1 col) | 2 columns | 4 columns, plná šířka |
| `/` (layout) | CookieConsent | Full-width banner, stack buttons | Inline buttons | Inline buttons |
| `/` (layout) | PlatformSwitcher | Zkontrolovat viditelnost/schování | Viditelný | Viditelný |

### 1.2 Hlavní stránky

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/` | Hero sekce, CTA, featured vozidla | Full-width hero, stacked karty (1 col) | Karty 2 col grid | Karty 3-4 col grid |
| `/o-nas` | Textový obsah, obrázky týmu | Single column | 2 col layout | 2-3 col s obrázky po stranách |
| `/kontakt` | Kontaktní formulář, mapa | Stacked form + mapa | Side-by-side nebo stacked | Side-by-side form + mapa |
| `/cenik` | Pricing tabulka/karty | Stacked karty, horizontální scroll tabulky | Grid karty 2 col | Grid karty 3 col |
| `/jak-prodat-auto` | Steps/guide layout | Vertikální steps | 2 col | Multi-col s ilustracemi |
| `/pro-maklere` | Landing page, CTA | Stacked sekce | 2 col grid | Full hero + multi-col |
| `/kolik-stoji-moje-auto` | Valuace formulář | Full-width form | Centered form | Centered form s max-width |
| `/chci-prodat` | Prodejní formulář/landing | Full-width stacked | Centered layout | Centered s sidebarem |
| `/kariera` | Job listings | Stacked karty | 2 col grid | 2-3 col grid |
| `/recenze` | Review karty | 1 col seznam | 2 col grid | 3 col grid |

### 1.3 Nabídka vozidel (katalog)

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/nabidka` | Katalog + filtry + grid | Filtry schované v drawer/modal, karty 1 col | Filtry sidebar nebo drawer, karty 2 col | Filtry sidebar vlevo, karty 3 col |
| `/nabidka/[slug]` | Detail vozidla (galerie, info, CTA) | Galerie full-width swiper, info stacked | Side-by-side galerie + info | Galerie vlevo, info vpravo |
| `/nabidka/[slug]/platba` | Platební formulář | Stacked form | 2 col form | 2 col form s order summary |
| `/nabidka/[slug]/platba/uspech` | Success page | Centered content | Centered | Centered s max-width |
| `/nabidka/porovnani` | Porovnávací tabulka | Horizontal scroll tabulka nebo stacked karty | Tabulka 2-3 sloupce | Plná tabulka 3-4 sloupce |
| `/nabidka/skoda` | SEO landing značka | Hero + katalog grid | 2 col grid | 3 col grid |
| `/nabidka/skoda/octavia` | SEO landing model | Hero + katalog grid | 2 col grid | 3 col grid |
| `/nabidka/praha` | SEO landing město | Hero + katalog grid | 2 col grid | 3 col grid |
| `/nabidka/do-300000` | SEO landing cenová | Hero + katalog grid | 2 col grid | 3 col grid |
| `/nabidka/suv` | SEO landing typ karoserie | Hero + katalog grid | 2 col grid | 3 col grid |
| `/nabidka/elektromobily` | SEO landing palivo | Hero + katalog grid | 2 col grid | 3 col grid |
| `/nabidka/hybrid` | SEO landing hybrid | Hero + katalog grid | 2 col grid | 3 col grid |
| `/nabidka/sedan` | SEO landing sedan | Hero + katalog grid | 2 col grid | 3 col grid |
| `/nabidka/kombi` | SEO landing kombi | Hero + katalog grid | 2 col grid | 3 col grid |
| `/nabidka/hatchback` | SEO landing hatchback | Hero + katalog grid | 2 col grid | 3 col grid |
| `/nabidka/kabriolet` | SEO landing kabriolet | Hero + katalog grid | 2 col grid | 3 col grid |

**CompareBar** (sticky floating):
- [ ] Mobile: Fixed bottom bar, neblokuje BottomNav (pokud existuje)
- [ ] Tablet: Fixed bottom bar
- [ ] Desktop: Fixed bottom bar, tlačítko "Porovnat" viditelné

### 1.4 Makléři

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/makleri` | Seznam makléřů | 1 col stacked karty | 2 col grid | 3-4 col grid |
| `/makleri/[slug]` | Profil makléře, jeho vozidla | Stacked: foto, bio, vozidla 1 col | 2 col layout | Sidebar profil + vozidla grid |
| `/makler/[slug]` | Veřejný profil makléře | Stacked layout | 2 col | Sidebar + content |

### 1.5 Blog

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/blog` | Seznam článků | 1 col, featured nahoře | 2 col grid | 3 col grid, featured wide |
| `/blog/[slug]` | Článek - prose/typography | Full-width text, obrázky responsive | Centered prose max-width ~700px | Centered prose, TOC sidebar? |
| `/blog/kategorie/[slug]` | Filtrované články | 1 col | 2 col | 3 col |

### 1.6 Služby

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/sluzby` | Přehled služeb | Stacked karty | 2 col grid | 3 col grid |
| `/sluzby/proverka` | Prověrka vozidla | Stacked sekce | 2 col | Hero + content layout |
| `/sluzby/financovani` | Financování | Stacked sekce | 2 col | Hero + content layout |
| `/sluzby/pojisteni` | Pojištění | Stacked sekce | 2 col | Hero + content layout |

### 1.7 Auth & Registrace

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/login` | Login formulář | Full-width centered form | Centered card | Centered card s max-width |
| `/prihlaseni` | Login alternativa | Full-width centered form | Centered card | Centered card |
| `/registrace` | Výběr typu registrace | Stacked karty | 2 col | 3-4 col grid |
| `/registrace/makler` | Registrace makléře | Full-width form | Centered form | Centered form |
| `/registrace/partner` | Registrace partnera | Full-width form | Centered form | Centered form |
| `/registrace/dodavatel` | Registrace dodavatele | Full-width form | Centered form | Centered form |
| `/zapomenute-heslo` | Reset hesla | Centered form | Centered card | Centered card |
| `/reset-hesla/[token]` | Nové heslo | Centered form | Centered card | Centered card |
| `/overeni-emailu/[token]` | Email verification | Centered message | Centered card | Centered card |

### 1.8 Uživatelský účet

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/muj-ucet` | Dashboard | Stacked cards | 2 col | Sidebar nav + content |
| `/muj-ucet/profil` | Profil formulář | Stacked form | Centered form | Sidebar + form |
| `/muj-ucet/profil/setup` | První nastavení | Step wizard full-width | Centered wizard | Centered wizard |
| `/muj-ucet/oblibene` | Oblíbená vozidla | 1 col seznam | 2 col grid | 3 col grid |
| `/muj-ucet/garaz` | Moje garáž | 1 col | 2 col | 3 col grid |
| `/muj-ucet/hlidaci-pes` | Watchdog nastavení | Stacked form | Centered form | Sidebar + form |
| `/muj-ucet/dotazy` | Moje dotazy | 1 col seznam | Seznam s preview | Seznam + detail side |
| `/muj-ucet/poptavky` | Moje poptávky | 1 col seznam | 2 col | Tabulka |

### 1.9 Inzerce

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/inzerce` | Landing page inzerce | Full-width hero, stacked | 2 col | Multi-col hero + CTA |
| `/inzerce/katalog` | Katalog inzerátů | Filtry drawer, 1 col karty | Filtry sidebar, 2 col | Sidebar + 3 col |
| `/inzerce/pridat` | Podání inzerátu (multi-step) | Full-width wizard | Centered wizard | Centered s max-width |
| `/inzerce/registrace` | Registrace inzerenta | Full-width form | Centered form | Centered form |
| `/moje-inzeraty` | Seznam mých inzerátů | 1 col karty | 2 col | Tabulka/list |
| `/moje-inzeraty/[id]` | Detail inzerátu | Stacked | 2 col | Multi-col detail |

### 1.10 Právní stránky

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/obchodni-podminky` | Prose text | Full-width text | Centered prose | Centered prose max-width |
| `/ochrana-osobnich-udaju` | GDPR | Full-width text | Centered prose | Centered prose |
| `/zasady-cookies` | Cookies | Full-width text | Centered prose | Centered prose |
| `/reklamacni-rad` | Reklamační řád | Full-width text | Centered prose | Centered prose |

### 1.11 Ostatní

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/profil/[slug]` | Veřejný profil uživatele | Stacked | 2 col | Sidebar + content |
| `/dodavatel/[slug]` | Profil dodavatele | Stacked | 2 col | Sidebar + content |
| `/bazar/[slug]` | Profil autobazaru | Stacked | 2 col | Sidebar + nabídka grid |
| `/tag/[slug]` | Tag stránka | 1 col seznam | 2 col | 3 col |
| `/h/[slug]` | Help/guide stránka | Prose text | Centered prose | Centered prose |
| `/notifikace/[token]` | Notification action | Centered content | Centered | Centered |

---

## 2. ESHOP AUTODÍLY (dily.carmakler.cz)

### 2.1 Navigace

| Element | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|---------|---------------|--------------------------|--------------------------|---------------------------|
| ShopNavbar | Hamburger, kategorie, košík | Hamburger menu, košík icon | Partial menu / hamburger | Plný navbar s kategoriemi |
| ShopFooter | Patička | Stacked 1 col | 2 col | 4 col |

### 2.2 Stránky — /dily/*

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/dily` | Landing page | Hero + kategorie stacked | 2 col kategorie | 3-4 col kategorie grid |
| `/dily/katalog` | Katalog dílů + filtry | Filtry drawer, 1 col karty | Filtry sidebar, 2 col | Sidebar + 3 col grid |
| `/dily/[slug]` | Detail dílu | Stacked: foto, info, CTA | 2 col: foto + info | Galerie vlevo + info vpravo |
| `/dily/kategorie/[slug]` | Kategorie dílů | 1 col grid | 2 col | 3 col |
| `/dily/znacka/[brand]` | Díly podle značky | 1 col | 2 col | 3 col |
| `/dily/znacka/[brand]/[model]` | Díly podle modelu | 1 col | 2 col | 3 col |
| `/dily/znacka/[brand]/[model]/[rok]` | Díly podle roku | 1 col | 2 col | 3 col |
| `/dily/vrakoviste/[slug]` | Profil vrakoviště | Stacked | 2 col | Sidebar + díly grid |
| `/dily/kosik` | Košík | Stacked items, CTA full-width | 2 col: items + summary | Items vlevo, summary vpravo |
| `/dily/objednavka` | Checkout form | Stacked form | 2 col form | 2 col: form + order summary |
| `/dily/objednavka/potvrzeni` | Potvrzení objednávky | Centered | Centered | Centered s max-width |
| `/dily/moje-objednavky` | Seznam objednávek | 1 col karty | Tabulka | Tabulka plná šířka |

### 2.3 Stránky — /shop/*

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/shop` | Shop landing | Stacked | 2 col | Multi-col |
| `/shop/katalog` | Katalog | Filtry drawer, 1 col | Sidebar, 2 col | Sidebar + 3 col |
| `/shop/produkt/[slug]` | Detail produktu | Stacked | 2 col | Galerie + info |
| `/shop/kosik` | Košík | Stacked | 2 col | Items + summary |
| `/shop/objednavka` | Checkout | Stacked form | 2 col | Form + summary |
| `/shop/objednavka/potvrzeni` | Potvrzení | Centered | Centered | Centered |
| `/shop/moje-objednavky` | Objednávky | 1 col | Tabulka | Tabulka |
| `/shop/moje-objednavky/[id]/reklamace` | Reklamace form | Full-width form | Centered form | Centered form |
| `/shop/moje-objednavky/[id]/vraceni` | Vrácení form | Full-width form | Centered form | Centered form |
| `/shop/objednavky/sledovani/[token]` | Sledování zásilky | Centered status | Centered | Centered |
| `/shop/reklamace` | Reklamace landing | Stacked | 2 col | Centered |
| `/shop/vraceni-zbozi` | Vrácení zboží info | Prose text | Centered | Centered |

---

## 3. INZERTNÍ PLATFORMA (inzerce.carmakler.cz)

Navigace: `InzerceNavbar` + `InzerceFooter`

| Element | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|---------|--------------------------|--------------------------|---------------------------|
| InzerceNavbar | Hamburger, logo | Partial menu | Full navbar |
| InzerceFooter | 1 col stacked | 2 col | 4 col |

Stránky sdílené s hlavním webem — viz sekce 1.9 (Inzerce).

---

## 4. MARKETPLACE (marketplace.carmakler.cz)

### 4.1 Navigace

| Element | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|---------|--------------------------|--------------------------|---------------------------|
| MarketplaceNavbar | Hamburger, logo | Partial/full menu | Full navbar |
| MarketplaceFooter | 1 col | 2 col | 4 col |

### 4.2 Veřejné stránky

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/marketplace` | Landing page (public) | Stacked hero + features | 2 col features | Multi-col hero + features |
| `/marketplace/apply` | Aplikační formulář | Full-width form | Centered form | Centered form s max-width |
| `/marketplace/deals/[id]` | Detail dealu | Stacked | 2 col | Galerie + info sidebar |

### 4.3 Dealer dashboard

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/marketplace/dealer` | Dealer dashboard | Stacked cards, bottom nav | 2 col cards | Sidebar nav + content |
| `/marketplace/dealer/[id]` | Detail nabídky | Stacked | 2 col | Multi-col detail |
| `/marketplace/dealer/nova` | Nová nabídka form | Full-width wizard | Centered wizard | Centered wizard |

### 4.4 Investor dashboard

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/marketplace/investor` | Investor dashboard | Stacked cards | 2 col | Sidebar nav + content |
| `/marketplace/investor/[id]` | Detail investice | Stacked | 2 col | Multi-col detail |

---

## 5. ADMIN PANEL (/admin)

**Layout:** `AdminLayout` = `AdminSidebar` (280px, collapsible) + `AdminHeader` + content (`p-4 sm:p-6 lg:p-8`)

### 5.1 Navigace & Layout

| Breakpoint | Expected behavior |
|-----------|-------------------|
| Mobile (375px) | Sidebar schovaný, otevírá se přes hamburger overlay. Header full-width. Content `p-4`. |
| Tablet (768px) | Sidebar schovaný/collapsible, `p-6` padding. |
| Desktop (1280px) | Sidebar permanentně vlevo (280px), content `lg:ml-[280px]`, `p-8` padding. |

### 5.2 Stránky

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/admin/dashboard` | Dashboard karty, grafy | Stacked karty, grafy full-width | 2 col grid | 3-4 col grid, grafy side-by-side |
| `/admin/vehicles` | Seznam vozidel | Horizontal scroll tabulka nebo karty | Tabulka s méně sloupci | Plná tabulka |
| `/admin/vehicles/[id]` | Detail vozidla | Stacked | 2 col | Multi-col |
| `/admin/vehicles/[id]/edit` | Editace vozidla | Stacked form | 2 col form | 2-3 col form |
| `/admin/vehicles/new` | Nové vozidlo | Stacked form | Centered form | Centered form |
| `/admin/brokers` | Seznam makléřů | Scroll tabulka / karty | Tabulka | Plná tabulka |
| `/admin/brokers/[id]` | Detail makléře | Stacked | 2 col | Multi-col |
| `/admin/brokers/[id]/edit` | Editace makléře | Stacked form | Centered form | Centered form |
| `/admin/inzerce` | Seznam inzerátů | Tabulka / karty | Tabulka | Plná tabulka |
| `/admin/inzerce/[id]` | Detail inzerátu | Stacked | 2 col | Multi-col |
| `/admin/partners` | Seznam partnerů | Tabulka / karty | Tabulka | Plná tabulka |
| `/admin/partners/[id]` | Detail partnera | Stacked | 2 col | Multi-col |
| `/admin/partners/new` | Nový partner | Form | Centered form | Centered form |
| `/admin/payments` | Platby | Scroll tabulka | Tabulka | Plná tabulka |
| `/admin/payouts` | Výplaty | Scroll tabulka | Tabulka | Plná tabulka |
| `/admin/orders` | Objednávky | Scroll tabulka | Tabulka | Plná tabulka |
| `/admin/parts` | Díly | Tabulka / karty | Tabulka | Plná tabulka |
| `/admin/suppliers` | Dodavatelé | Tabulka | Tabulka | Plná tabulka |
| `/admin/returns` | Vrácení | Tabulka | Tabulka | Plná tabulka |
| `/admin/returns/[id]` | Detail vrácení | Stacked | 2 col | Multi-col |
| `/admin/leads` | Leady | Tabulka | Tabulka | Plná tabulka |
| `/admin/leads/[id]` | Detail leadu | Stacked | 2 col | Multi-col |
| `/admin/scout-leads` | Scout leady | Tabulka | Tabulka | Plná tabulka |
| `/admin/scout-leads/[id]` | Detail scout leadu | Stacked | 2 col | Multi-col |
| `/admin/marketplace` | Marketplace deals | Tabulka | Tabulka | Plná tabulka |
| `/admin/marketplace/[id]` | Detail dealu | Stacked | 2 col | Multi-col |
| `/admin/marketplace/applications` | Aplikace | Tabulka | Tabulka | Plná tabulka |
| `/admin/marketplace/applications/[id]` | Detail aplikace | Stacked | 2 col | Multi-col |
| `/admin/blog` | Blog správa | Tabulka | Tabulka | Plná tabulka |
| `/admin/blog/[id]/edit` | Editace článku | Rich text editor, full-width | Editor | Editor s preview |
| `/admin/blog/ai-drafts` | AI drafts | Karty | 2 col | 3 col |
| `/admin/blog/comments` | Komentáře | Seznam | Tabulka | Tabulka |
| `/admin/feeds` | XML feedy | Tabulka | Tabulka | Plná tabulka |
| `/admin/feeds/[id]` | Detail feedu | Stacked | 2 col | Multi-col |
| `/admin/feeds/new` | Nový feed | Form | Centered form | Centered form |
| `/admin/tagy` | Správa tagů | Tabulka/grid | Tabulka | Tabulka |
| `/admin/notifications` | Notifikace | Seznam | Tabulka | Tabulka |
| `/admin/users` | Uživatelé | Tabulka | Tabulka | Plná tabulka |
| `/admin/team` | Tým | Karty | 2 col grid | 3 col grid |
| `/admin/career` | Kariéra | Tabulka | Tabulka | Tabulka |
| `/admin/reviews` | Recenze | Tabulka | Tabulka | Tabulka |
| `/admin/profile` | Profil admina | Form | Centered form | Centered form |
| `/admin/manager` | Manager dashboard | Stacked cards | 2 col | Multi-col |
| `/admin/manager/brokers` | Makléři managera | Tabulka | Tabulka | Tabulka |
| `/admin/manager/brokers/[id]` | Detail makléře | Stacked | 2 col | Multi-col |
| `/admin/manager/brokers/[id]/transfer` | Převod makléře | Form | Centered form | Centered form |
| `/admin/manager/approvals` | Schvalování | Karty | 2 col | Tabulka |
| `/admin/manager/bonuses` | Bonusy | Tabulka | Tabulka | Tabulka |
| `/admin/manager/vehicles/[id]/edit` | Editace vozidla | Stacked form | 2 col form | 2 col form |
| `/admin/manager/notifications` | Notifikace | Seznam | Tabulka | Tabulka |

---

## 6. PWA MAKLÉŘ (/makler)

**Layout:** Mobile-first PWA. `BottomNav` na mobile. Žádný sidebar.

### 6.1 Navigace

| Breakpoint | Expected behavior |
|-----------|-------------------|
| Mobile (375px) | BottomNav (fixed bottom), header s logem a profilem. **HLAVNÍ CÍLOVÝ BREAKPOINT.** |
| Tablet (768px) | BottomNav nebo sidebar, rozšířený layout. |
| Desktop (1280px) | Sidebar nav, plný layout (méně prioritní — PWA je mobile-first). |

### 6.2 Stránky

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/makler` | Hlavní redirect/landing | Redirect na dashboard | — | — |
| `/makler/dashboard` | Dashboard — stats, karty | Stacked KPI karty, quick actions | 2 col grid | 3 col grid |
| `/makler/vehicles` | Seznam vozidel | 1 col karty se swipe actions | 2 col grid | Tabulka/3 col |
| `/makler/vehicles/[id]` | Detail vozidla | Full-width galerie, stacked info | 2 col | Multi-col |
| `/makler/vehicles/[id]/edit` | Editace | Full-width form | 2 col form | 2 col form |
| `/makler/vehicles/[id]/handover` | Předání vozidla | Step wizard full-width | Centered wizard | Centered |
| `/makler/vehicles/new` | Nové vozidlo (start) | Full-width | Centered | Centered |
| `/makler/vehicles/new/vin` | Step: VIN | Full-width input + scan button | Centered | Centered |
| `/makler/vehicles/new/contact` | Step: Kontakt | Full-width form | Centered form | Centered |
| `/makler/vehicles/new/inspection` | Step: Inspekce | Full-width checklisty | 2 col checklists | 2 col |
| `/makler/vehicles/new/photos` | Step: Fotky | Grid fotek, upload button | Větší grid | Multi-col grid |
| `/makler/vehicles/new/details` | Step: Detaily | Full-width form | 2 col | 2 col |
| `/makler/vehicles/new/equipment` | Step: Výbava | Checkbox grid | 2-3 col checkbox | 3-4 col |
| `/makler/vehicles/new/pricing` | Step: Cena | Full-width form | Centered | Centered |
| `/makler/vehicles/new/review` | Step: Shrnutí | Stacked review | 2 col | 2 col |
| `/makler/vehicles/new/success` | Úspěch | Centered | Centered | Centered |
| `/makler/vehicles/quick` | Rychlé nabírání | Full-width | Centered | Centered |
| `/makler/vehicles/quick/step1` | Quick step 1 | Full-width form | Centered | Centered |
| `/makler/vehicles/quick/step2` | Quick step 2 | Full-width form | Centered | Centered |
| `/makler/vehicles/quick/step3` | Quick step 3 | Full-width form | Centered | Centered |
| `/makler/vehicles/quick/success` | Quick success | Centered | Centered | Centered |
| `/makler/contracts` | Seznam smluv | 1 col karty | 2 col | Tabulka |
| `/makler/contracts/[id]` | Detail smlouvy | Full-width | 2 col | Multi-col |
| `/makler/contracts/[id]/sign` | Podpis smlouvy | Full-width canvas (podpis prstem) | Větší canvas | Canvas + preview |
| `/makler/contracts/new` | Nová smlouva | Step wizard | Centered wizard | Centered |
| `/makler/leads` | Leady | 1 col karty | 2 col | Tabulka |
| `/makler/leads/[id]` | Detail leadu | Stacked | 2 col | Multi-col |
| `/makler/messages` | Zprávy | 1 col konverzace | 2 panel: list + chat | 2 panel layout |
| `/makler/messages/[vehicleId]` | Chat konverzace | Full-width chat | Chat centered | Chat s sidebarem |
| `/makler/contacts` | Kontakty | 1 col seznam | 2 col | Tabulka |
| `/makler/contacts/[id]` | Detail kontaktu | Stacked | 2 col | Multi-col |
| `/makler/contacts/new` | Nový kontakt | Full-width form | Centered form | Centered |
| `/makler/commissions` | Provize | 1 col karty | Tabulka | Tabulka |
| `/makler/provize` | Provize (alt) | 1 col | Tabulka | Tabulka |
| `/makler/financing-calculator` | Kalkulačka financování | Full-width form + výsledek | 2 col | 2 col |
| `/makler/leaderboard` | Žebříček | 1 col tabulka | Tabulka | Plná tabulka |
| `/makler/stats` | Statistiky | Stacked grafy | 2 col | Multi-col grafy |
| `/makler/profile` | Profil | Stacked form | Centered form | Centered |
| `/makler/settings` | Nastavení | Stacked options | 2 col | Sidebar + options |
| `/makler/settings/notifications` | Notifikace nastavení | Toggle list | 2 col toggles | 2 col |
| `/makler/materials` | Materiály/docs | 1 col seznam | 2 col | 3 col |
| `/makler/blog` | Blog makléře | 1 col | 2 col | 3 col |
| `/makler/blog/new` | Nový článek | Rich editor | Editor | Editor + preview |
| `/makler/blog/[id]/edit` | Editace článku | Rich editor | Editor | Editor + preview |
| `/makler/offline` | Offline fallback | Centered message + cached data | Centered | Centered |

### 6.3 Onboarding

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/makler/onboarding` | Start onboarding | Full-width steps | Centered | Centered |
| `/makler/onboarding/profile` | Profil step | Full-width form | Centered | Centered |
| `/makler/onboarding/documents` | Dokumenty upload | Full-width upload zones | Centered | Centered |
| `/makler/onboarding/contract` | Smlouva | Full-width | Centered | Centered |
| `/makler/onboarding/training` | Training | Full-width video/content | Centered | Centered |
| `/makler/onboarding/approval` | Čekání na schválení | Centered status | Centered | Centered |

---

## 7. PWA DODAVATEL DÍLŮ (/parts)

**Layout:** Mobile-first PWA. `SupplierBottomNav` na mobile.

### 7.1 Navigace

| Breakpoint | Expected behavior |
|-----------|-------------------|
| Mobile (375px) | SupplierBottomNav (fixed bottom), jednoduchý header. **HLAVNÍ CÍLOVÝ BREAKPOINT.** |
| Tablet (768px) | BottomNav nebo sidebar. |
| Desktop (1280px) | Sidebar, plný layout. |

### 7.2 Stránky

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/parts` | Dashboard | Stacked karty, quick actions | 2 col | Multi-col |
| `/parts/my` | Moje díly | 1 col karty | 2 col grid | Tabulka |
| `/parts/[id]` | Detail dílu | Stacked | 2 col | Multi-col |
| `/parts/[id]/edit` | Editace dílu | Full-width form | Centered form | Centered |
| `/parts/new` | Nový díl (form + foto) | Full-width form, camera button | Centered | Centered |
| `/parts/import` | Hromadný import | Full-width upload + mapping | 2 col | Multi-col |
| `/parts/orders` | Objednávky | 1 col karty | Tabulka | Tabulka |
| `/parts/orders/[id]` | Detail objednávky | Stacked | 2 col | Multi-col |
| `/parts/donors` | Donor cars | 1 col karty | 2 col | 3 col |
| `/parts/donors/[id]` | Detail donor car | Stacked | 2 col | Multi-col |
| `/parts/profile` | Profil | Stacked form | Centered form | Centered |

### 7.3 Onboarding

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/parts/onboarding` | Start | Full-width | Centered | Centered |
| `/parts/onboarding/profile` | Profil | Full-width form | Centered | Centered |
| `/parts/onboarding/documents` | Dokumenty | Upload zones | Centered | Centered |
| `/parts/onboarding/approval` | Schválení | Centered status | Centered | Centered |

---

## 8. PARTNER DASHBOARD (/partner)

**Layout:** `PartnerLayout` s `PartnerBottomNav` na mobile.

### 8.1 Navigace

| Breakpoint | Expected behavior |
|-----------|-------------------|
| Mobile (375px) | PartnerBottomNav, jednoduchý header. |
| Tablet (768px) | BottomNav nebo sidebar. |
| Desktop (1280px) | Sidebar nav + content. |

### 8.2 Stránky

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/partner/dashboard` | Dashboard | Stacked KPI karty | 2 col | Multi-col |
| `/partner/vehicles` | Vozidla | 1 col karty | 2 col | Tabulka |
| `/partner/vehicles/[id]` | Detail | Stacked | 2 col | Multi-col |
| `/partner/vehicles/new` | Nové vozidlo | Full-width form | Centered | Centered |
| `/partner/parts` | Díly | 1 col | 2 col | Tabulka |
| `/partner/parts/[id]` | Detail dílu | Stacked | 2 col | Multi-col |
| `/partner/parts/new` | Nový díl | Full-width form | Centered | Centered |
| `/partner/orders` | Objednávky | 1 col | Tabulka | Tabulka |
| `/partner/orders/[id]` | Detail objednávky | Stacked | 2 col | Multi-col |
| `/partner/leads` | Leady | 1 col | 2 col | Tabulka |
| `/partner/messages` | Zprávy | 1 col konverzace | List + chat panel | 2 panel |
| `/partner/documents` | Dokumenty | 1 col seznam | 2 col | Tabulka |
| `/partner/stats` | Statistiky | Stacked grafy | 2 col | Multi-col |
| `/partner/billing` | Fakturace | 1 col | Tabulka | Tabulka |
| `/partner/profile` | Profil | Stacked form | Centered form | Centered |

### 8.3 Onboarding

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/partner/onboarding` | Start | Full-width | Centered | Centered |
| `/partner/onboarding/profile` | Profil | Full-width form | Centered | Centered |
| `/partner/onboarding/documents` | Dokumenty | Upload zones | Centered | Centered |
| `/partner/onboarding/approval` | Schválení | Centered status | Centered | Centered |

---

## 9. PREZENTACE

| URL | Co kontrolovat | Expected: Mobile (375px) | Expected: Tablet (768px) | Expected: Desktop (1280px) |
|-----|---------------|--------------------------|--------------------------|---------------------------|
| `/prezentace` | Prezentační stránka | Full-width slides | Centered | Centered/fullscreen |

---

## 10. CROSS-CUTTING KOMPONENTY

Tyto komponenty se objevují na více stránkách a musí být testovány samostatně:

| Komponenta | Kde se objevuje | Mobile (375px) | Tablet (768px) | Desktop (1280px) |
|-----------|----------------|----------------|-----------------|-------------------|
| **CompareBar** | Katalog nabídka | Fixed bottom, 2 mini karty max | 3 mini karty | 4 karty + tlačítko |
| **CookieConsent** | Všude (web) | Full-width, stacked buttons | Inline buttons | Inline |
| **CartIcon** | Navbar (shop/dily) | Badge s počtem | Badge | Badge |
| **AuthButton** | Navbar | Icon only | Icon + "Přihlásit" | Plný button |
| **PlatformSwitcher** | Navbar | Dropdown/hamburger | Tabs | Tabs |
| **Modal/Dialog** | Různé akce | Full-screen sheet (bottom) | Centered modal | Centered modal |
| **Toast/Notification** | Akce feedback | Full-width top/bottom | Top-right | Top-right |
| **DataTable** | Admin, lists | Horizontal scroll | Viditelné sloupce | Plná tabulka |
| **Form components** | Všechny formuláře | Full-width inputs | Constrained width | Constrained |
| **Image gallery** | Detail vozidla/dílu | Swiper full-width | Thumbnail grid | Side gallery |
| **BottomNav** | PWA makléř | 5 icon tabs, fixed bottom | 5 tabs wider | Hidden (sidebar) |
| **SupplierBottomNav** | PWA parts | Icon tabs, fixed bottom | Wider tabs | Hidden (sidebar) |
| **PartnerBottomNav** | Partner dashboard | Icon tabs, fixed bottom | Wider tabs | Hidden (sidebar) |
| **AdminSidebar** | Admin panel | Hidden (hamburger overlay) | Hidden/collapsible | Permanent 280px |
| **AdminHeader** | Admin panel | Full-width, hamburger | Full-width | Full-width, no hamburger |

---

## 11. PRIORITIZACE TESTOVÁNÍ

### P0 — Kritické (testovat jako první)
1. `/` — Homepage
2. `/nabidka` — Katalog vozidel
3. `/nabidka/[slug]` — Detail vozidla
4. `/makler/dashboard` — PWA dashboard
5. `/makler/vehicles/new/*` — Flow nabírání auta (všechny kroky)
6. `/dily` + `/dily/katalog` — Eshop landing + katalog
7. `/login` + `/registrace` — Auth flow
8. Navigace (MainNavbar, BottomNav, AdminSidebar) na všech breakpointech

### P1 — Důležité
9. `/admin/dashboard` + admin tabulky (vehicles, brokers, orders)
10. `/marketplace` — Landing + dealer/investor dashboard
11. `/inzerce/katalog` + `/inzerce/pridat`
12. `/parts` — PWA dodavatele (dashboard + new part)
13. Checkout flows (košík → objednávka → potvrzení) pro dily i shop
14. `/muj-ucet/*` — Uživatelský účet

### P2 — Standardní
15. SEO landing pages (`/nabidka/skoda`, `/nabidka/praha`, atd.)
16. Blog, služby, právní stránky
17. Partner dashboard
18. Onboarding flows (makléř, dodavatel, partner)
19. Makléř contracts, messages, contacts

### P3 — Nízká priorita
20. Prezentace
21. Statické právní stránky
22. Notifikace/token stránky
23. Admin manager sub-pages

---

## 12. ACCEPTANCE CRITERIA

Test je úspěšný pokud:

- [ ] **100% P0 stránek** prošlo na všech 3 breakpointech bez kritických bugů
- [ ] **90%+ P1 stránek** prošlo na všech 3 breakpointech
- [ ] Žádná stránka nemá horizontální overflow na mobile (375px)
- [ ] Všechny formuláře jsou vyplnitelné na mobile
- [ ] Navigace (navbar, sidebar, bottom nav) funguje korektně na všech breakpointech
- [ ] Tabulky mají horizontal scroll na mobile (ne broken layout)
- [ ] Obrázky/galerie se správně škálují
- [ ] Touch targets min 44x44px na mobile
- [ ] Modaly/dialogy se vejdou na viewport na všech breakpointech
- [ ] PWA (makléř + parts) je plně použitelná na 375px — to je primární use case

---

## 13. NÁSTROJE PRO TESTOVÁNÍ

1. **Chrome DevTools** — Responsive mode, device presets
2. **Device presets:**
   - iPhone SE (375×667)
   - iPhone 14 Pro (393×852)
   - iPad Mini (768×1024)
   - iPad Air (820×1180)
   - Laptop (1280×800)
   - Desktop (1920×1080)
3. **Lighthouse** — Performance + Accessibility audit na každém breakpointu
4. **Axe DevTools** — Accessibility check (touch targets, contrast)

---

*Celkem stránek k testování: ~180+ unikátních URL patterns*
*Odhadovaný počet test cases: ~540+ (180 stránek × 3 breakpointy)*
