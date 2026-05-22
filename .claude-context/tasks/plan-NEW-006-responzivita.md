# TASK-NEW-006: Responzivita — Kompletní testovací plán

**Datum:** 2026-05-08
**Základ:** Aktualizace plan-task-new-006-responzivita.md (2026-05-05)
**Breakpointy:** 375px (iPhone SE), 768px (iPad), 1280px (desktop)
**Nástroj:** Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)

---

## Přehled architektury

Platforma má 8 sekcí s různými layout patterny:

| Sekce | Route group | Layout pattern | Nav | Responsive approach |
|-------|-------------|---------------|-----|---------------------|
| **Hlavní web** | `(web)` | Navbar + Footer | `MainNavbar` + `MobileMenu` (hamburger) | Mobile-first, `md:` / `lg:` breakpoints |
| **Inzerce** | `(web)/inzerce` | Navbar + Footer | `InzerceNavbar` | Shared layout |
| **Eshop díly** | `(web)/dily` + `(web)/shop` | Navbar + Footer | `ShopNavbar` | Shared layout |
| **Marketplace** | `(web)/marketplace` | Navbar + Footer | `MarketplaceNavbar` | Shared layout |
| **Admin** | `(admin)` | Sidebar (280px fixed) + Header | `AdminSidebar` (skrytý <lg) + `AdminHeader` (hamburger) | `lg:ml-[280px]`, mobile overlay sidebar |
| **PWA Makléř** | `(pwa)` | TopBar + BottomNav | `TopBar` + `BottomNav` (fixed bottom) | Mobile-only design, `pb-20` |
| **PWA Díly** | `(pwa-parts)` | SupplierTopBar + SupplierBottomNav | Similar to PWA | Mobile-only design |
| **Partner portál** | `(partner)` | Sidebar (260px) + BottomNav (mobile) | `PartnerLayout` — sidebar <lg hidden, bottomnav <lg visible | Hybrid sidebar/bottom nav |

---

## Globální testovací kritéria (platí pro KAŽDOU stránku)

### Pass kritéria:
- [ ] Žádný horizontální scroll (overflow-x)
- [ ] Text čitelný (min. 14px na mobile)
- [ ] Tlačítka/linky tapovatelné (min. 44x44px touch target)
- [ ] Obrázky se škálují správně (`max-w-full`)
- [ ] Formuláře použitelné (labels viditelné, inputy full-width na mobile)
- [ ] Tabulky nepřetečou nebo mají `overflow-x-auto` wrapper
- [ ] Modály/overlaye nepřetečou viewport
- [ ] Navigace funkční (hamburger, sidebar toggle, bottom nav)

### Fail severity:
- **P1 — CRITICAL** = Nelze použít (broken layout, překrytý obsah, neviditelné CTA, nefunkční navigace)
- **P2 — MAJOR** = Zhoršený UX (neoptimální layout, ale funkční)
- **P3 — MINOR** = Kosmetické (spacing, alignment, whitespace)

### Výstup pro každý nález:
```
| FAIL | #číslo | URL | Breakpoint | Popis problému | Severity |
```

---

## FÁZE 1 — VYSOKÉ RIZIKO (testovat PRVNĚ)

**Odhadovaný čas: 30 min**

Tyto stránky mají nejvyšší pravděpodobnost responzivních problémů kvůli komplexním layoutům:

| # | URL | Rizikový element | 375px | 768px | 1280px |
|---|-----|-------------------|-------|-------|--------|
| HR-1 | `/admin/vehicles` | DataTable s mnoha sloupci | | | |
| HR-2 | `/nabidka` | Sidebar filtry + grid katalog | | | |
| HR-3 | `/nabidka/porovnani` | Široká porovnávací tabulka | | | |
| HR-4 | `/shop/kosik` | Tabulka položek + summary | | | |
| HR-5 | `/dily/kosik` | Tabulka položek + summary | | | |
| HR-6 | `/dily/objednavka` | Multi-field checkout formulář | | | |
| HR-7 | `/makler/vehicles/new/photos` | PhotoGuide, PhotoPositionDiagram | | | |
| HR-8 | `/makler/contracts/[id]/sign` | SignatureCanvas na malém viewport | | | |
| HR-9 | `/admin/dashboard` | KPI karty, grafy, sidebar toggle | | | |
| HR-10 | `/` (homepage) | Hero, CTA, "Jak to funguje", testimonials | | | |
| HR-11 | `/blog/[slug]` | Článek s obrázky, embedded media | | | |
| HR-12 | `/marketplace/deals/[id]` | DealDetail — fotogalerie, ProfitCalculator, tabs | | | |

---

## FÁZE 2 — HLAVNÍ WEB (45 min)

### 2.1 Navigace & Patička (společné)
| # | Co testovat | 375px | 768px | 1280px |
|---|-------------|-------|-------|--------|
| W-1 | MainNavbar — logo, hamburger viditelný na mobile | | | |
| W-2 | MobileMenu — plynulé otevření/zavření, žádný overflow | | | |
| W-3 | Desktop nav — dropdown menu "Služby", "O nás" | | | |
| W-4 | PlatformSwitcher (přepínač produktů) | | | |
| W-5 | AuthButton — login/profil tlačítko | | | |
| W-6 | Footer — sloupcové layouty na desktopu, stacked na mobile | | | |
| W-7 | CookieConsent — nepřekrývá obsah, tlačítka tapovatelná | | | |

### 2.2 Landing & Informační stránky
| # | URL | Co sledovat | 375px | 768px | 1280px |
|---|-----|-------------|-------|-------|--------|
| W-8 | `/` | Hero, CTA, "Jak to funguje", testimonials | | | |
| W-9 | `/o-nas` | Tým grid, statistiky | | | |
| W-10 | `/jak-to-funguje` | Steps/timeline layout | | | |
| W-11 | `/kontakt` | Kontaktní formulář, mapa, info bloky | | | |
| W-12 | `/cenik` | Cenové karty/tabulka | | | |
| W-13 | `/chci-prodat` | Formulář/CTA sekce | | | |
| W-14 | `/jak-prodat-auto` | Content page, stepper | | | |
| W-15 | `/kolik-stoji-moje-auto` | Valuace formulář | | | |
| W-16 | `/pro-maklere` | Landing pro makléře — CTA, features | | | |
| W-17 | `/recenze` | Review karty grid | | | |
| W-18 | `/kariera` | Pozice grid | | | |
| W-19 | `/sluzby` | Karty služeb | | | |
| W-20 | `/sluzby/proverka` | Detail služby | | | |
| W-21 | `/sluzby/financovani` | Kalkulačka/formulář | | | |
| W-22 | `/sluzby/pojisteni` | Detail služby | | | |

### 2.3 Blog
| # | URL | Co sledovat | 375px | 768px | 1280px |
|---|-----|-------------|-------|-------|--------|
| W-23 | `/blog` | Článek karty grid | | | |
| W-24 | `/blog/[slug]` | Článek detail, TipTap obsah, obrázky, komentáře | | | |
| W-25 | `/blog/kategorie/[slug]` | Filtr + grid | | | |

### 2.4 Makléři
| # | URL | Co sledovat | 375px | 768px | 1280px |
|---|-----|-------------|-------|-------|--------|
| W-26 | `/makleri` | Makléř karty grid | | | |
| W-27 | `/makler/[slug]` | Profil makléře, statistiky, recenze | | | |

### 2.5 Nabídka vozidel (katalog)
| # | URL | Co sledovat | 375px | 768px | 1280px |
|---|-----|-------------|-------|-------|--------|
| W-28 | `/nabidka` | Filter sidebar + vehicle grid + CompareBar | | | |
| W-29 | `/nabidka/[slug]` | Detail vozu — galerie, specs tabulka, CTA, sdílení | | | |
| W-30 | `/nabidka/[slug]/platba` | Platební formulář | | | |
| W-31 | `/nabidka/[slug]/platba/uspech` | Potvrzení platby | | | |
| W-32 | `/nabidka/porovnani` | Porovnávací tabulka (kritické!) | | | |
| W-33 | `/nabidka/skoda/octavia` | SEO landing — filtr + výpis (vzorek) | | | |
| W-34 | `/nabidka/do-300000` | Cenové SEO landing (vzorek) | | | |
| W-35 | `/nabidka/praha` | Lokální SEO landing (vzorek) | | | |
| W-36 | `/nabidka/elektromobily` | Typ SEO landing (vzorek) | | | |

**Poznámka:** SEO stránky (`/nabidka/{brand}`, `/nabidka/{city}`, `/nabidka/do-{cena}`, `/nabidka/{bodytype}`) sdílejí stejný layout → stačí otestovat 1 vzorek z každého typu.

### 2.6 Auth & Uživatelský účet
| # | URL | Co sledovat | 375px | 768px | 1280px |
|---|-----|-------------|-------|-------|--------|
| W-37 | `/login` | Login formulář | | | |
| W-38 | `/registrace` | Registrační formulář (role selector) | | | |
| W-39 | `/registrace/makler` | Makléř registrace | | | |
| W-40 | `/registrace/partner` | Partner registrace | | | |
| W-41 | `/registrace/dodavatel` | Dodavatel registrace | | | |
| W-42 | `/zapomenute-heslo` | Reset formulář | | | |
| W-43 | `/reset-hesla/[token]` | Nové heslo formulář | | | |
| W-44 | `/overeni-emailu/[token]` | Ověření emailu | | | |
| W-45 | `/overeni-emailu/uspech` | Potvrzení ověření | | | |
| W-46 | `/muj-ucet` | Dashboard uživatele | | | |
| W-47 | `/muj-ucet/profil` | Profil editace | | | |
| W-48 | `/muj-ucet/profil/setup` | Nastavení profilu (nový uživatel) | | | |
| W-49 | `/muj-ucet/oblibene` | Oblíbená — grid/list | | | |
| W-50 | `/muj-ucet/garaz` | Garáž — grid | | | |
| W-51 | `/muj-ucet/hlidaci-pes` | Hlídací pes nastavení | | | |
| W-52 | `/muj-ucet/dotazy` | Dotazy seznam | | | |
| W-53 | `/muj-ucet/poptavky` | Poptávky seznam | | | |

### 2.7 Veřejné profily & Utility stránky
| # | URL | Co sledovat | 375px | 768px | 1280px |
|---|-----|-------------|-------|-------|--------|
| W-54 | `/profil/[slug]` | Veřejný profil uživatele | | | |
| W-55 | `/dodavatel/[slug]` | Profil dodavatele dílů | | | |
| W-56 | `/h/[slug]` | Nápověda / help page | | | |
| W-57 | `/tag/[slug]` | Tag stránka — výpis dle tagu | | | |
| W-58 | `/notifikace/[token]` | Notifikace handling | | | |

---

## FÁZE 3 — INZERCE (15 min)

| # | URL | Co sledovat | 375px | 768px | 1280px |
|---|-----|-------------|-------|-------|--------|
| I-1 | `/inzerce` | Landing — hero, CTA, features | | | |
| I-2 | `/inzerce/katalog` | Výpis inzerátů + filtry | | | |
| I-3 | `/inzerce/registrace` | Registrační formulář inzerenta | | | |
| I-4 | `/inzerce/pridat` | Multi-step formulář (6 kroků) — ListingFormWizard | | | |
| I-5 | `/moje-inzeraty` | Seznam inzerátů uživatele | | | |
| I-6 | `/moje-inzeraty/[id]` | Detail inzerátu, editace | | | |

---

## FÁZE 4 — ESHOP DÍLY (30 min)

### 4.1 Shop (legacy flow)
| # | URL | Co sledovat | 375px | 768px | 1280px |
|---|-----|-------------|-------|-------|--------|
| S-1 | `/shop` | Landing eshop | | | |
| S-2 | `/shop/katalog` | Katalog dílů + filtry + grid | | | |
| S-3 | `/shop/produkt/[slug]` | Detail produktu, galerie, "do košíku" | | | |
| S-4 | `/shop/kosik` | Košík — tabulka položek, summary | | | |
| S-5 | `/shop/objednavka` | Checkout formulář | | | |
| S-6 | `/shop/objednavka/potvrzeni` | Potvrzení objednávky | | | |
| S-7 | `/shop/moje-objednavky` | Seznam objednávek | | | |
| S-8 | `/shop/moje-objednavky/[id]/reklamace` | Reklamační formulář | | | |
| S-9 | `/shop/moje-objednavky/[id]/vraceni` | Vrácení formulář | | | |
| S-10 | `/shop/objednavky/sledovani/[token]` | Sledování objednávky (public) | | | |
| S-11 | `/shop/reklamace` | Reklamace info | | | |
| S-12 | `/shop/vraceni-zbozi` | Vrácení zboží info | | | |

### 4.2 Díly (nový flow)
| # | URL | Co sledovat | 375px | 768px | 1280px |
|---|-----|-------------|-------|-------|--------|
| D-1 | `/dily` | Landing eshop dílů | | | |
| D-2 | `/dily/katalog` | Katalog + filtry (sidebar + grid) | | | |
| D-3 | `/dily/[slug]` | Detail dílu — galerie, specs, do košíku | | | |
| D-4 | `/dily/kategorie/[slug]` | Kategorie — filtr + grid | | | |
| D-5 | `/dily/znacka/[brand]` | Značka listing | | | |
| D-6 | `/dily/znacka/[brand]/[model]` | Model listing | | | |
| D-7 | `/dily/znacka/[brand]/[model]/[rok]` | Rok listing | | | |
| D-8 | `/dily/vrakoviste/[slug]` | Vrakoviště profil | | | |
| D-9 | `/dily/kosik` | Košík | | | |
| D-10 | `/dily/objednavka` | Checkout formulář (adresa, doprava, platba) | | | |
| D-11 | `/dily/objednavka/potvrzeni` | Potvrzení objednávky | | | |
| D-12 | `/dily/moje-objednavky` | Seznam objednávek | | | |

---

## FÁZE 5 — MARKETPLACE (15 min)

| # | URL | Co sledovat | 375px | 768px | 1280px |
|---|-----|-------------|-------|-------|--------|
| M-1 | `/marketplace` | Landing page — features, CTA, social proof | | | |
| M-2 | `/marketplace/apply` | Registrační formulář (dealer/investor) | | | |
| M-3 | `/marketplace/dealer` | Dealer dashboard (AUTH) — stats, příležitosti | | | |
| M-4 | `/marketplace/dealer/nova` | Nová nabídka formulář (AUTH) | | | |
| M-5 | `/marketplace/dealer/[id]` | Detail nabídky — DealerFlipDetail (AUTH) | | | |
| M-6 | `/marketplace/investor` | Investor dashboard (AUTH) — příležitosti grid | | | |
| M-7 | `/marketplace/investor/[id]` | Detail investiční příležitosti (AUTH) | | | |
| M-8 | `/marketplace/deals/[id]` | Deal detail — DealDetailClient, ProfitCalculator, InvestModal, tabs | | | |

---

## FÁZE 6 — ADMIN (45 min)

**Layout:** Sidebar 280px fixed (lg+), overlay na mobile. Content `p-4 sm:p-6 lg:p-8`.
**Auth:** ADMIN / BACKOFFICE / MANAGER

| # | URL | Co sledovat | 375px | 768px | 1280px |
|---|-----|-------------|-------|-------|--------|
| A-1 | `/admin/dashboard` | KPI karty, grafy, sidebar toggle | | | |
| A-2 | `/admin/vehicles` | DataTable — KRITICKÉ: tabulky na mobile | | | |
| A-3 | `/admin/vehicles/[id]` | Detail vozu | | | |
| A-4 | `/admin/vehicles/[id]/edit` | Edit formulář | | | |
| A-5 | `/admin/vehicles/new` | Nový vůz formulář | | | |
| A-6 | `/admin/brokers` | Tabulka makléřů | | | |
| A-7 | `/admin/brokers/[id]` | Detail makléře | | | |
| A-8 | `/admin/brokers/[id]/edit` | Edit makléře | | | |
| A-9 | `/admin/inzerce` | Tabulka inzerátů | | | |
| A-10 | `/admin/inzerce/[id]` | Detail inzerátu | | | |
| A-11 | `/admin/leads` | Tabulka leadů | | | |
| A-12 | `/admin/leads/[id]` | Detail leadu | | | |
| A-13 | `/admin/users` | Tabulka uživatelů | | | |
| A-14 | `/admin/payments` | Platby — tabulka + filtry | | | |
| A-15 | `/admin/payouts` | Výplaty — tabulka | | | |
| A-16 | `/admin/orders` | Objednávky — tabulka | | | |
| A-17 | `/admin/returns` | Reklamace — tabulka | | | |
| A-18 | `/admin/returns/[id]` | Detail reklamace | | | |
| A-19 | `/admin/parts` | Díly — tabulka | | | |
| A-20 | `/admin/suppliers` | Dodavatelé — tabulka | | | |
| A-21 | `/admin/feeds` | Feed importy — tabulka | | | |
| A-22 | `/admin/feeds/[id]` | Detail feedu | | | |
| A-23 | `/admin/feeds/new` | Nový feed formulář | | | |
| A-24 | `/admin/partners` | Partneři — tabulka | | | |
| A-25 | `/admin/partners/[id]` | Detail partnera | | | |
| A-26 | `/admin/partners/new` | Nový partner formulář | | | |
| A-27 | `/admin/marketplace` | Marketplace — tabulka | | | |
| A-28 | `/admin/marketplace/[id]` | Detail marketplace deal | | | |
| A-29 | `/admin/marketplace/applications` | Žádosti — tabulka | | | |
| A-30 | `/admin/marketplace/applications/[id]` | Detail žádosti | | | |
| A-31 | `/admin/blog` | Články — tabulka | | | |
| A-32 | `/admin/blog/[id]/edit` | Editor článku (TipTap!) | | | |
| A-33 | `/admin/blog/ai-drafts` | AI návrhy | | | |
| A-34 | `/admin/blog/comments` | Komentáře — tabulka | | | |
| A-35 | `/admin/reviews` | Recenze — tabulka | | | |
| A-36 | `/admin/team` | Tým — grid/tabulka | | | |
| A-37 | `/admin/career` | Kariérní systém | | | |
| A-38 | `/admin/tagy` | Tagy — tabulka | | | |
| A-39 | `/admin/notifications` | Notifikace | | | |
| A-40 | `/admin/profile` | Profil administrátora | | | |
| A-41 | `/admin/manager` | Manažer dashboard | | | |
| A-42 | `/admin/manager/brokers` | Moji makléři | | | |
| A-43 | `/admin/manager/brokers/[id]` | Detail makléře | | | |
| A-44 | `/admin/manager/brokers/[id]/transfer` | Transfer makléře | | | |
| A-45 | `/admin/manager/approvals` | Schvalování | | | |
| A-46 | `/admin/manager/bonuses` | Bonusy | | | |
| A-47 | `/admin/manager/notifications` | Manažer notifikace | | | |

---

## FÁZE 7 — PWA MAKLÉŘ (45 min)

**Layout:** TopBar (56px + safe-area), BottomNav fixed bottom, `pb-20`. Mobile-only design.
**Auth:** BROKER

| # | URL | Co sledovat | 375px | 768px | 1280px |
|---|-----|-------------|-------|-------|--------|
| P-1 | `/makler` | Redirect/landing | | | |
| P-2 | `/makler/dashboard` | Statistiky, CTA karty, follow-up, notifications | | | |
| P-3 | `/makler/vehicles` | Seznam vozidel, filtry, FAB | | | |
| P-4 | `/makler/vehicles/[id]` | Detail vozu — tabs, galerie, akce | | | |
| P-5 | `/makler/vehicles/[id]/edit` | Editace vozidla | | | |
| P-6 | `/makler/vehicles/[id]/handover` | Předávací checklist | | | |
| P-7 | `/makler/vehicles/new` | Step wizard start | | | |
| P-8 | `/makler/vehicles/new/vin` | VIN krok | | | |
| P-9 | `/makler/vehicles/new/contact` | Kontakt krok | | | |
| P-10 | `/makler/vehicles/new/inspection` | Inspekce krok | | | |
| P-11 | `/makler/vehicles/new/photos` | Fotky krok — PhotoGuide, PhotoPositionDiagram | | | |
| P-12 | `/makler/vehicles/new/details` | Detaily krok | | | |
| P-13 | `/makler/vehicles/new/equipment` | Výbava krok — EquipmentSelector | | | |
| P-14 | `/makler/vehicles/new/pricing` | Cenotvorba krok | | | |
| P-15 | `/makler/vehicles/new/review` | Review + submit | | | |
| P-16 | `/makler/vehicles/new/success` | Success stránka | | | |
| P-17 | `/makler/vehicles/quick/*` | Quick intake 3-step wizard | | | |
| P-18 | `/makler/vehicles/quick/success` | Quick success | | | |
| P-19 | `/makler/contracts` | Seznam smluv | | | |
| P-20 | `/makler/contracts/new` | Nová smlouva wizard | | | |
| P-21 | `/makler/contracts/[id]` | Detail smlouvy | | | |
| P-22 | `/makler/contracts/[id]/sign` | Podpis — SignatureCanvas | | | |
| P-23 | `/makler/contacts` | CRM kontakty | | | |
| P-24 | `/makler/contacts/[id]` | Detail kontaktu, timeline | | | |
| P-25 | `/makler/contacts/new` | Nový kontakt | | | |
| P-26 | `/makler/leads` | Leady seznam | | | |
| P-27 | `/makler/leads/[id]` | Detail leadu | | | |
| P-28 | `/makler/messages` | Zprávy | | | |
| P-29 | `/makler/messages/[vehicleId]` | Konverzace | | | |
| P-30 | `/makler/commissions` | Provize | | | |
| P-31 | `/makler/provize` | Provize (alt route) | | | |
| P-32 | `/makler/financing-calculator` | Kalkulačka financování | | | |
| P-33 | `/makler/leaderboard` | Žebříček | | | |
| P-34 | `/makler/stats` | Statistiky | | | |
| P-35 | `/makler/profile` | Profil | | | |
| P-36 | `/makler/settings` | Nastavení | | | |
| P-37 | `/makler/settings/notifications` | Notifikace nastavení | | | |
| P-38 | `/makler/materials` | Materiály ke stažení | | | |
| P-39 | `/makler/blog` | Blog | | | |
| P-40 | `/makler/blog/new` | Nový článek — TipTap editor | | | |
| P-41 | `/makler/blog/[id]/edit` | Edit článku — TipTap editor | | | |
| P-42 | `/makler/offline` | Offline stránka | | | |
| P-43 | `/makler/onboarding` | Onboarding start | | | |
| P-44 | `/makler/onboarding/profile` | Profil krok | | | |
| P-45 | `/makler/onboarding/documents` | Dokumenty krok | | | |
| P-46 | `/makler/onboarding/contract` | Smlouva krok | | | |
| P-47 | `/makler/onboarding/training` | Školení krok | | | |
| P-48 | `/makler/onboarding/approval` | Schválení krok | | | |

---

## FÁZE 8 — PWA DODAVATEL DÍLŮ (20 min)

**Layout:** SupplierTopBar + SupplierBottomNav. Mobile-only design.
**Auth:** PARTS_SUPPLIER

| # | URL | Co sledovat | 375px | 768px | 1280px |
|---|-----|-------------|-------|-------|--------|
| PD-1 | `/parts` | Dashboard | | | |
| PD-2 | `/parts/my` | Moje díly — seznam | | | |
| PD-3 | `/parts/new` | Přidání dílu — ModeSelector → single/donor wizard | | | |
| PD-4 | `/parts/[id]` | Detail dílu | | | |
| PD-5 | `/parts/[id]/edit` | Editace dílu | | | |
| PD-6 | `/parts/import` | Import dílů (bulk) | | | |
| PD-7 | `/parts/orders` | Objednávky | | | |
| PD-8 | `/parts/orders/[id]` | Detail objednávky | | | |
| PD-9 | `/parts/donors` | Donor cars seznam | | | |
| PD-10 | `/parts/donors/[id]` | Detail donor car | | | |
| PD-11 | `/parts/profile` | Profil dodavatele | | | |
| PD-12 | `/parts/onboarding` | Onboarding start | | | |
| PD-13 | `/parts/onboarding/profile` | Profil krok | | | |
| PD-14 | `/parts/onboarding/documents` | Dokumenty krok | | | |
| PD-15 | `/parts/onboarding/approval` | Schválení krok | | | |

### Specifické testy donor car flow (na /parts/new v "donor" mode):
| # | Co testovat | 375px | 768px | 1280px |
|---|-------------|-------|-------|--------|
| PD-16 | DonorVehicleStep — VIN input + výsledek decode | | | |
| PD-17 | DisposalTypeStep — 5 typů poškození karty | | | |
| PD-18 | DamageZoneSelector — SVG car diagram + level selectory | | | |
| PD-19 | PartsFilterStep — seznam dílů + checkboxy + stav selector | | | |
| PD-20 | DonorPhotosStep — 4 foto upload grid | | | |
| PD-21 | BulkPricingStep — hromadné ceníky | | | |
| PD-22 | DonorSummaryStep — souhrn + publish | | | |

---

## FÁZE 9 — PARTNER PORTÁL (20 min)

**Layout:** Desktop sidebar (260px) + mobile bottom nav + mobile top bar.
**Auth:** PARTNER (autobazar/vrakoviště)
**Route group:** `(partner)`

| # | URL | Co sledovat | 375px | 768px | 1280px |
|---|-----|-------------|-------|-------|--------|
| PA-1 | `/partner/dashboard` | Dashboard KPI | | | |
| PA-2 | `/partner/vehicles` | Vozidla seznam (bazar) | | | |
| PA-3 | `/partner/vehicles/new` | Nové vozidlo formulář | | | |
| PA-4 | `/partner/vehicles/[id]` | Detail vozidla | | | |
| PA-5 | `/partner/parts` | Díly (vrakoviště) | | | |
| PA-6 | `/partner/parts/new` | Nový díl | | | |
| PA-7 | `/partner/parts/[id]` | Detail dílu | | | |
| PA-8 | `/partner/orders` | Objednávky | | | |
| PA-9 | `/partner/orders/[id]` | Detail objednávky | | | |
| PA-10 | `/partner/leads` | Zájemci | | | |
| PA-11 | `/partner/stats` | Statistiky | | | |
| PA-12 | `/partner/billing` | Vyúčtování | | | |
| PA-13 | `/partner/documents` | Dokumenty | | | |
| PA-14 | `/partner/messages` | Zprávy | | | |
| PA-15 | `/partner/profile` | Profil | | | |
| PA-16 | `/partner/onboarding` | Onboarding start | | | |
| PA-17 | `/partner/onboarding/profile` | Profil krok | | | |
| PA-18 | `/partner/onboarding/documents` | Dokumenty krok | | | |
| PA-19 | `/partner/onboarding/approval` | Schválení krok | | | |

**Poznámka:** Testovat OBA typy partnera — autobazar (bazarNav) i vrakoviště (vrakovisteNav), mají jiné navigační položky.

---

## FÁZE 10 — PRÁVNÍ STRÁNKY (5 min)

| # | URL | 375px | 768px | 1280px |
|---|-----|-------|-------|--------|
| L-1 | `/obchodni-podminky` | | | |
| L-2 | `/ochrana-osobnich-udaju` | | | |
| L-3 | `/reklamacni-rad` | | | |
| L-4 | `/zasady-cookies` | | | |

---

## Celkový souhrn

| Fáze | Sekce | Počet testů | Čas |
|------|-------|-------------|-----|
| 1 | Vysoké riziko | 12 | 30 min |
| 2 | Hlavní web | 58 | 45 min |
| 3 | Inzerce | 6 | 15 min |
| 4 | Eshop díly | 24 | 30 min |
| 5 | Marketplace | 8 | 15 min |
| 6 | Admin | 47 | 45 min |
| 7 | PWA Makléř | 48 | 45 min |
| 8 | PWA Díly | 22 | 20 min |
| 9 | Partner portál | 19 | 20 min |
| 10 | Právní | 4 | 5 min |
| **CELKEM** | | **~248** | **~4.5 hod** |

(Fáze 1 se překrývá s dalšími fázemi — reálný počet unikátních stránek je ~210)

---

## Prerekvizity

### Testovací účty (nutné před zahájením):
| Role | Kde se přihlásit | Přístup k sekcím |
|------|-------------------|-----------------|
| ADMIN | `/login` | Admin panel, vše |
| BACKOFFICE | `/login` | Admin panel |
| BROKER | `/login` | PWA Makléř |
| PARTS_SUPPLIER | `/login` | PWA Díly |
| PARTNER (bazar) | `/login` | Partner portál (bazar nav) |
| PARTNER (vrakoviště) | `/login` | Partner portál (vrakoviště nav) |
| INVESTOR | `/login` | Marketplace investor |
| VERIFIED_DEALER | `/login` | Marketplace dealer |
| USER (běžný) | `/login` | Můj účet, inzerce, eshop |

### Testovací data:
- Min. 3 vozidla v nabídce (pro katalog/detail)
- Min. 1 díl v eshopu (pro košík/checkout flow)
- Min. 1 marketplace deal (pro deal detail)
- Min. 1 blog článek (pro blog detail)
- Min. 1 draft vehicle (pro intake wizard)
- Min. 1 smlouva (pro contract detail/sign)

### Chrome DevTools nastavení:
- Throttling: **No throttling** (testujeme layout, ne performance)
- User agent: default
- Touch simulation: ON pro 375px a 768px

---

## Poznámky pro testera

1. **Subdomain routing:** Hlavní web/Inzerce/Shop/Marketplace používají různé navbary dle subdomény (header `x-subdomain`). Na localhost testovat s odpovídající subdomain konfigurací nebo testovat v produkci.
2. **PWA stránky (makléř + díly):** Primárně mobile design — na 1280px bude hodně whitespace. To je **OK a PASS** — nejsou na desktop designované.
3. **Safe-area-inset:** PWA layouts používají `env(safe-area-inset-top)` — na Chrome DevTools nebude vidět efekt. Reálný test vyžaduje fyzické zařízení.
4. **Dynamické stránky:** Pro `[slug]`/`[id]` routy potřebujete existující data v DB. Použijte seed data nebo produkční prostředí.
5. **Formuláře:** Testovat i validační chyby (submit prázdný) — chybové zprávy nesmí rozbít layout.
6. **Modály:** Otevřít a zavřít na každém breakpointu — InvestModal, SignatureCanvas, DeleteDialog, atd.

---

## Závislosti

- Žádné kódové změny nutné pro spuštění testu
- Nutný přístup k running instance (localhost:3000 nebo produkce)
- Nutné seedované testovací data
- Nutné testovací účty všech rolí
