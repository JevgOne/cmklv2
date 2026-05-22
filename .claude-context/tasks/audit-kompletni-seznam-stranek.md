# Audit: Kompletní seznam všech stránek a funkcí k otestování

**Datum:** 2026-04-24
**Účel:** QA checklist pro systematické otestování celé platformy CarMakléř

---

## SOUHRN

| Sekce | Počet stránek | Stav |
|-------|---------------|------|
| Veřejný web (core) | 28 | Většina funkční |
| Nabídka (katalog + SEO landing pages) | 55+ | Funkční + SEO pages |
| Inzerce (inzertní platforma) | 6 | Funkční |
| Eshop dílů (web) | 13 | Funkční |
| Shop (e-commerce) | 11 | Funkční |
| Marketplace VIP | 7 | Funkční |
| PWA Makléře | 49 | Funkční |
| PWA Parts (dodavatelé) | 13 | Funkční |
| Admin panel | 35 | Funkční |
| API routes | 270+ | Funkční |
| **CELKEM** | **~290 stránek + 270 API** | |

---

## 1. VEŘEJNÝ WEB — CORE STRÁNKY

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 1 | `/` | Homepage — hero, makléři, nabídka aut, statistiky | Ne | ✅ Funkční |
| 2 | `/jak-to-funguje` | Jak platforma funguje — prodej, nákup, marketplace, díly | Ne | ✅ Funkční |
| 3 | `/chci-prodat` | Chci prodat auto — formulář, FAQ, výhody | Ne | ✅ Funkční |
| 4 | `/jak-prodat-auto` | Detailní průvodce prodejem auta | Ne | ✅ Funkční |
| 5 | `/makleri` | Seznam ověřených makléřů s filtry | Ne | ✅ Funkční |
| 6 | `/makleri/[slug]` | Profil makléře — statistiky, inzeráty, kontakt | Ne | ✅ Funkční |
| 7 | `/makler/[slug]` | Alternativní profil makléře (legacy route) | Ne | ⚠️ Legacy |
| 8 | `/kolik-stoji-moje-auto` | Cenová kalkulačka vozidla | Ne | ✅ Funkční |
| 9 | `/o-nas` | O nás — statistiky firmy, makléři | Ne | ✅ Funkční |
| 10 | `/kontakt` | Kontaktní formulář + firemní údaje | Ne | ✅ Funkční |
| 11 | `/recenze` | Recenze a reference | Ne | ✅ Funkční |
| 12 | `/kariera` | Kariéra — pracovní nabídky + formulář | Ne | ✅ Funkční |
| 13 | `/obchodni-podminky` | Obchodní podmínky | Ne | ✅ Funkční |
| 14 | `/ochrana-osobnich-udaju` | GDPR / ochrana osobních údajů | Ne | ✅ Funkční |
| 15 | `/zasady-cookies` | Cookie policy | Ne | ✅ Funkční |
| 16 | `/reklamacni-rad` | Reklamační řád | Ne | ✅ Funkční |

### Služby

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 17 | `/sluzby/financovani` | Financování auta — kalkulačka | Ne | ✅ Funkční |
| 18 | `/sluzby/pojisteni` | Pojištění — porovnání nabídek | Ne | ✅ Funkční |
| 19 | `/sluzby/proverka` | Prověrka vozidla (CEBIA) | Ne | ✅ Funkční |

### Auth & uživatelský účet

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 20 | `/prihlaseni` | Přihlášení | Ne | ✅ Funkční |
| 21 | `/login` | Přihlášení (alternativní route) | Ne | ✅ Funkční |
| 22 | `/registrace` | Výběr typu registrace | Ne | ✅ Funkční |
| 23 | `/registrace/makler` | Registrace makléře | Ne | ✅ Funkční |
| 24 | `/registrace/dodavatel` | Registrace dodavatele dílů | Ne | ✅ Funkční |
| 25 | `/registrace/partner` | Registrace partnera | Ne | ✅ Funkční |
| 26 | `/zapomenute-heslo` | Zapomenuté heslo — reset formulář | Ne | ✅ Funkční |
| 27 | `/reset-hesla/[token]` | Reset hesla přes token z emailu | Ne | ✅ Funkční |
| 28 | `/overeni-emailu/[token]` | Ověření emailové adresy | Ne | ✅ Funkční |
| 29 | `/overeni-emailu/uspech` | Potvrzení úspěšného ověření | Ne | ✅ Funkční |
| 30 | `/overeni-emailu/chyba` | Chyba při ověření emailu | Ne | ✅ Funkční |

### Můj účet (kupující)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 31 | `/muj-ucet` | Dashboard — statistiky, oblíbené, hlídání | Ano | ✅ Funkční |
| 32 | `/muj-ucet/profil` | Editace profilu (avatar, bio, město, sociální sítě) | Ano | ✅ Funkční |
| 33 | `/muj-ucet/profil/setup` | Úvodní nastavení profilu (onboarding) | Ano | ✅ Funkční |
| 34 | `/muj-ucet/oblibene` | Oblíbené inzeráty | Ano | ✅ Funkční |
| 35 | `/muj-ucet/hlidaci-pes` | Hlídací pes — uložená vyhledávání s notifikacemi | Ano | ✅ Funkční |
| 36 | `/muj-ucet/poptavky` | Poptávky na díly (RFQ) | Ano | ✅ Funkční |
| 37 | `/muj-ucet/garaz` | Moje garáž — uložená vozidla (VIN, značka, model) | Ano | ✅ Funkční |
| 38 | `/muj-ucet/dotazy` | Moje dotazy na inzeráty | Ano | ✅ Funkční |

### Veřejné profily & tagy

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 39 | `/profil/[slug]` | Veřejný profil uživatele | Ne | ✅ Funkční |
| 40 | `/dodavatel/[slug]` | Profil dodavatele dílů | Ne | ✅ Funkční |
| 41 | `/bazar/[slug]` | Profil bazaru/vrakoviště | Ne | ✅ Funkční |
| 42 | `/h/[slug]` | Hashtag stránka | Ne | ✅ Funkční |
| 43 | `/tag/[slug]` | Tag stránka | Ne | ✅ Funkční |
| 44 | `/notifikace/[token]` | Správa notifikačních preferencí | Ne | ✅ Funkční |

---

## 2. NABÍDKA — KATALOG VOZIDEL

### Hlavní stránky

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 45 | `/nabidka` | Hlavní katalog — filtry, řazení, paginace | Ne | ✅ Funkční |
| 46 | `/nabidka/[slug]` | Detail vozidla — galerie, specifikace, kontakt, rezervace | Ne | ✅ Funkční |
| 47 | `/nabidka/[slug]/platba` | Platba / rezervace vozidla (Stripe) | Ne | ✅ Funkční |
| 48 | `/nabidka/[slug]/platba/uspech` | Potvrzení úspěšné platby | Ne | ✅ Funkční |
| 49 | `/nabidka/porovnani` | Porovnání vybraných vozidel | Ne | ✅ Funkční |

### SEO landing pages — značky (18 značek)

| # | URL | Značka |
|---|-----|--------|
| 50 | `/nabidka/skoda` | Škoda |
| 51 | `/nabidka/skoda/octavia` | Škoda Octavia |
| 52 | `/nabidka/skoda/fabia` | Škoda Fabia |
| 53 | `/nabidka/skoda/superb` | Škoda Superb |
| 54 | `/nabidka/skoda/kodiaq` | Škoda Kodiaq |
| 55 | `/nabidka/volkswagen` | Volkswagen |
| 56 | `/nabidka/volkswagen/golf` | VW Golf |
| 57 | `/nabidka/volkswagen/passat` | VW Passat |
| 58 | `/nabidka/bmw` | BMW |
| 59 | `/nabidka/bmw/3-series` | BMW 3-series |
| 60 | `/nabidka/audi` | Audi |
| 61 | `/nabidka/audi/a4` | Audi A4 |
| 62 | `/nabidka/ford` | Ford |
| 63 | `/nabidka/ford/focus` | Ford Focus |
| 64 | `/nabidka/kia` | Kia |
| 65 | `/nabidka/kia/ceed` | Kia Ceed |
| 66 | `/nabidka/hyundai` | Hyundai |
| 67 | `/nabidka/hyundai/i30` | Hyundai i30 |
| 68 | `/nabidka/toyota` | Toyota |
| 69 | `/nabidka/toyota/yaris` | Toyota Yaris |
| 70 | `/nabidka/mazda` | Mazda |
| 71 | `/nabidka/mercedes-benz` | Mercedes-Benz |
| 72 | `/nabidka/opel` | Opel |
| 73 | `/nabidka/peugeot` | Peugeot |
| 74 | `/nabidka/renault` | Renault |
| 75 | `/nabidka/seat` | Seat |
| 76 | `/nabidka/citroen` | Citroën |
| 77 | `/nabidka/dacia` | Dacia |

**Stav:** ✅ Všechny generované SEO pages, metadata ano

### SEO landing pages — typ karoserie (5)

| # | URL | Typ |
|---|-----|-----|
| 78 | `/nabidka/hatchback` | Hatchback |
| 79 | `/nabidka/sedan` | Sedan |
| 80 | `/nabidka/kombi` | Kombi |
| 81 | `/nabidka/kabriolet` | Kabriolet |
| 82 | `/nabidka/suv` | SUV |

### SEO landing pages — cenové rozmezí (5)

| # | URL | Rozmezí |
|---|-----|---------|
| 83 | `/nabidka/do-100000` | Do 100 000 Kč |
| 84 | `/nabidka/do-200000` | Do 200 000 Kč |
| 85 | `/nabidka/do-300000` | Do 300 000 Kč |
| 86 | `/nabidka/do-500000` | Do 500 000 Kč |
| 87 | `/nabidka/do-1000000` | Do 1 000 000 Kč |

### SEO landing pages — palivo (2)

| # | URL | Palivo |
|---|-----|--------|
| 88 | `/nabidka/hybrid` | Hybrid |
| 89 | `/nabidka/elektromobily` | Elektromobily |

### SEO landing pages — město (8)

| # | URL | Město |
|---|-----|-------|
| 90 | `/nabidka/praha` | Praha |
| 91 | `/nabidka/brno` | Brno |
| 92 | `/nabidka/ostrava` | Ostrava |
| 93 | `/nabidka/plzen` | Plzeň |
| 94 | `/nabidka/liberec` | Liberec |
| 95 | `/nabidka/ceske-budejovice` | České Budějovice |
| 96 | `/nabidka/olomouc` | Olomouc |
| 97 | `/nabidka/hradec-kralove` | Hradec Králové |

---

## 3. INZERCE — INZERTNÍ PLATFORMA

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 98 | `/inzerce` | Landing page — pricing tiers, výhody, poslední inzeráty | Ne | ✅ Funkční |
| 99 | `/inzerce/pridat` | 6-krokový wizard: VIN→Detaily→Výbava→Fotky→Cena+Kontakt→Náhled | Ne (i bez účtu) | ✅ Funkční |
| 100 | `/inzerce/katalog` | Redirect na `/nabidka` | Ne | ✅ Redirect |
| 101 | `/inzerce/registrace` | Registrace inzerenta (Soukromý/Bazar/Dealer/Kupující) | Ne | ✅ Funkční |
| 102 | `/moje-inzeraty` | Dashboard — seznam inzerátů, taby, statistiky, správa | Ano (ADVERTISER) | ✅ Funkční |
| 103 | `/moje-inzeraty/[id]` | Detail inzerátu — editace, poptávky, odpovědi, propagace | Ano (ADVERTISER) | ✅ Funkční |

---

## 4. ESHOP DÍLŮ (web)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 104 | `/dily` | Landing page — kategorie, vyhledávání, doporučené díly | Ne | ✅ Funkční |
| 105 | `/dily/katalog` | Katalog dílů — filtry, řazení, paginace | Ne | ✅ Funkční |
| 106 | `/dily/[slug]` | Detail dílu — galerie, specifikace, kompatibilita, dodavatel | Ne | ✅ Funkční |
| 107 | `/dily/kategorie/[slug]` | Kategorie dílů (ENGINE, BRAKES, BODY...) | Ne | ✅ Funkční |
| 108 | `/dily/znacka/[brand]` | Díly dle značky vozu | Ne | ✅ Funkční |
| 109 | `/dily/znacka/[brand]/[model]` | Díly dle značky + modelu | Ne | ✅ Funkční |
| 110 | `/dily/znacka/[brand]/[model]/[rok]` | Díly dle značky + modelu + roku | Ne | ✅ Funkční |
| 111 | `/dily/vrakoviste/[slug]` | Profil vrakoviště — inventář, recenze, kontakt | Ne | ✅ Funkční |
| 112 | `/dily/kosik` | Košík — položky, množství, celková cena | Ne | ✅ Funkční |
| 113 | `/dily/objednavka` | Checkout — doručení, platba, potvrzení (Zásilkovna widget) | Ne | ✅ Funkční |
| 114 | `/dily/objednavka/potvrzeni` | Potvrzení objednávky — číslo, tracking link | Ne | ✅ Funkční |
| 115 | `/dily/moje-objednavky` | Moje objednávky dílů — status, tracking | Ano | ✅ Funkční |

---

## 5. SHOP (e-commerce — příslušenství)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 116 | `/shop` | Shop landing — produkty, kategorie | Ne | ✅ Funkční |
| 117 | `/shop/katalog` | Katalog produktů — filtry, řazení | Ne | ✅ Funkční |
| 118 | `/shop/produkt/[slug]` | Detail produktu | Ne | ✅ Funkční |
| 119 | `/shop/kosik` | Košík | Ne | ✅ Funkční |
| 120 | `/shop/objednavka` | Checkout | Ne | ✅ Funkční |
| 121 | `/shop/objednavka/potvrzeni` | Potvrzení objednávky | Ne | ✅ Funkční |
| 122 | `/shop/objednavky/sledovani/[token]` | Sledování objednávky (guest, token) | Ne | ✅ Funkční |
| 123 | `/shop/moje-objednavky` | Moje objednávky | Ano | ✅ Funkční |
| 124 | `/shop/moje-objednavky/[id]/vraceni` | Vrácení zboží | Ano | ✅ Funkční |
| 125 | `/shop/moje-objednavky/[id]/reklamace` | Reklamace | Ano | ✅ Funkční |
| 126 | `/shop/vraceni-zbozi` | Podmínky vrácení zboží | Ne | ✅ Funkční |
| 127 | `/shop/reklamace` | Reklamační formulář | Ne | ✅ Funkční |

---

## 6. MARKETPLACE VIP

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 128 | `/marketplace` | Landing page — hero, ROI příklady, bezpečnost, FAQ | Ne | ✅ Funkční |
| 129 | `/marketplace/apply` | Žádost o přístup (Investor/Realizátor) | Ne | ✅ Funkční |
| 130 | `/marketplace/dealer` | Dashboard realizátora — statistiky, příležitosti | VERIFIED_DEALER | ✅ Funkční |
| 131 | `/marketplace/dealer/nova` | Nová příležitost — 4-krokový wizard | VERIFIED_DEALER | ✅ Funkční |
| 132 | `/marketplace/dealer/[id]` | Detail flipu (pohled dealera) | VERIFIED_DEALER | ✅ Funkční |
| 133 | `/marketplace/investor` | Dashboard investora — portfolio, dostupné příležitosti | INVESTOR | ✅ Funkční |
| 134 | `/marketplace/investor/[id]` | Detail příležitosti — timeline, kalkulačka, investiční modal | INVESTOR | ✅ Funkční |

---

## 7. PWA MAKLÉŘE

### Dashboard & navigace

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 135 | `/makler` | Redirect na `/makler/dashboard` | BROKER | ✅ Funkční |
| 136 | `/makler/dashboard` | Dashboard — statistiky, CTA, úkoly, drafty, notifikace | BROKER | ✅ Funkční |

### Vozidla — kompletní flow (14 stránek)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 137 | `/makler/vehicles` | Seznam všech vozidel makléře | BROKER | ✅ Funkční |
| 138 | `/makler/vehicles/[id]` | Detail vozidla — fotky, dotazy, smlouvy, changelog | BROKER | ✅ Funkční |
| 139 | `/makler/vehicles/[id]/edit` | Editace vozidla (načte do draftu) | BROKER | ✅ Funkční |
| 140 | `/makler/vehicles/[id]/handover` | Předávací checklist (pro rezervovaná auta) | BROKER | ✅ Funkční |
| 141 | `/makler/vehicles/new` | Nové vozidlo — výběr draftu nebo nový | BROKER | ✅ Funkční |
| 142 | `/makler/vehicles/new/contact` | Krok 1: Kontakt prodejce | BROKER | ✅ Funkční |
| 143 | `/makler/vehicles/new/vin` | Krok 2: VIN sken/zadání + dekódování | BROKER | ✅ Funkční |
| 144 | `/makler/vehicles/new/inspection` | Krok 3: Inspekce stavu | BROKER | ✅ Funkční |
| 145 | `/makler/vehicles/new/photos` | Krok 4: Fotografie | BROKER | ✅ Funkční |
| 146 | `/makler/vehicles/new/details` | Krok 5: Detaily + výbava | BROKER | ✅ Funkční |
| 147 | `/makler/vehicles/new/pricing` | Krok 6: Cena + AI popis | BROKER | ✅ Funkční |
| 148 | `/makler/vehicles/new/review` | Krok 7: Kontrola + odeslání | BROKER | ✅ Funkční |
| 149 | `/makler/vehicles/new/success` | Úspěšné odeslání | BROKER | ✅ Funkční |

### Rychlý vstup (4 stránky)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 150 | `/makler/vehicles/quick` | Redirect do kroku 1 | BROKER | ✅ Funkční |
| 151 | `/makler/vehicles/quick/step1` | Rychlý vstup: základní info | BROKER | ✅ Funkční |
| 152 | `/makler/vehicles/quick/step2` | Rychlý vstup: fotky | BROKER | ✅ Funkční |
| 153 | `/makler/vehicles/quick/step3` | Rychlý vstup: kontrola + odeslání | BROKER | ✅ Funkční |
| 154 | `/makler/vehicles/quick/success` | Úspěch — 48h na dokončení | BROKER | ✅ Funkční |

### Smlouvy (4 stránky)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 155 | `/makler/contracts` | Seznam smluv | BROKER | ✅ Funkční |
| 156 | `/makler/contracts/new` | Nová smlouva — wizard | BROKER | ✅ Funkční |
| 157 | `/makler/contracts/[id]` | Detail smlouvy — náhled, akce | BROKER | ✅ Funkční |
| 158 | `/makler/contracts/[id]/sign` | Podpis smlouvy (prodejce + makléř) | BROKER | ✅ Funkční |

### Zprávy & komunikace (2 stránky)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 159 | `/makler/messages` | Přehled poptávek dle vozidla | BROKER | ✅ Funkční |
| 160 | `/makler/messages/[vehicleId]` | Poptávky pro konkrétní vozidlo | BROKER | ✅ Funkční |

### Kontakty — CRM (3 stránky)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 161 | `/makler/contacts` | Seznam kontaktů (prodejci) | BROKER | ✅ Funkční |
| 162 | `/makler/contacts/new` | Nový kontakt | BROKER | ✅ Funkční |
| 163 | `/makler/contacts/[id]` | Detail kontaktu — komunikace, vozidla, statistiky | BROKER | ✅ Funkční |

### Provize & výplaty (3 stránky)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 164 | `/makler/commissions` | Provize za měsíc | BROKER | ✅ Funkční |
| 165 | `/makler/provize` | Historie výplat | BROKER | ✅ Funkční |
| 166 | `/makler/leads` | Správa leadů (NEW→CONTACTED→MEETING) | BROKER | ✅ Funkční |
| 167 | `/makler/leads/[id]` | Detail leadu | BROKER | ✅ Funkční |

### Statistiky & gamifikace (2 stránky)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 168 | `/makler/stats` | Statistiky + achievementy + level | BROKER | ✅ Funkční |
| 169 | `/makler/leaderboard` | Žebříček TOP 10 makléřů | BROKER | ✅ Funkční |

### Nástroje (1 stránka)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 170 | `/makler/financing-calculator` | Kalkulačka financování pro kupující | BROKER | ✅ Funkční |

### Profil & nastavení (3 stránky)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 171 | `/makler/profile` | Profil makléře — avatar, statistiky, formulář | BROKER | ✅ Funkční |
| 172 | `/makler/settings` | Nastavení účtu (email, IČO, banka) | BROKER | ✅ Funkční |
| 173 | `/makler/settings/notifications` | Notifikační preference | BROKER | ✅ Funkční |

### Onboarding (5 stránek)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 174 | `/makler/onboarding` | Router — přesměruje na aktuální krok | BROKER | ✅ Funkční |
| 175 | `/makler/onboarding/profile` | Krok 1: Osobní údaje | BROKER | ✅ Funkční |
| 176 | `/makler/onboarding/documents` | Krok 2: Upload dokumentů | BROKER | ✅ Funkční |
| 177 | `/makler/onboarding/training` | Krok 3: Školení + kvíz (10 otázek, 80 % pass) | BROKER | ✅ Funkční |
| 178 | `/makler/onboarding/contract` | Krok 4: Podpis spolupráce | BROKER | ✅ Funkční |
| 179 | `/makler/onboarding/approval` | Krok 5: Čekání na schválení | BROKER | ✅ Funkční |

### Offline (1 stránka)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 180 | `/makler/offline` | Offline sync manager — čekající drafty, sync status | BROKER | ✅ Funkční |

---

## 8. PWA PARTS (dodavatelé dílů)

### Dashboard & správa dílů

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 181 | `/parts` | Dashboard — statistiky, čekající objednávky, CTA | PARTS_SUPPLIER | ✅ Funkční |
| 182 | `/parts/new` | Nový díl — 3-krokový wizard (fotky→detaily→cena) | PARTS_SUPPLIER | ✅ Funkční |
| 183 | `/parts/my` | Moje díly — seznam, filtry, statistiky | PARTS_SUPPLIER | ✅ Funkční |
| 184 | `/parts/[id]` | Detail dílu — galerie, specifikace, editace/smazání | PARTS_SUPPLIER | ✅ Funkční |
| 185 | `/parts/[id]/edit` | Editace dílu (stejný wizard) | PARTS_SUPPLIER | ✅ Funkční |
| 186 | `/parts/import` | Hromadný CSV import | PARTS_SUPPLIER | ✅ Funkční |

### Objednávky

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 187 | `/parts/orders` | Objednávky — taby (nové, k odeslání, aktivní, hotovo) | PARTS_SUPPLIER | ✅ Funkční |
| 188 | `/parts/orders/[id]` | Detail objednávky — kupující, položky, štítek, tracking | PARTS_SUPPLIER | ✅ Funkční |

### Onboarding (3 kroky)

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 189 | `/parts/onboarding` | Router — přesměruje na aktuální krok | PARTS_SUPPLIER | ✅ Funkční |
| 190 | `/parts/onboarding/profile` | Krok 1: Údaje firmy (název, IČO, telefon, adresa) | PARTS_SUPPLIER | ✅ Funkční |
| 191 | `/parts/onboarding/documents` | Krok 2: Upload dokumentů (ŽL, OP) | PARTS_SUPPLIER | ✅ Funkční |
| 192 | `/parts/onboarding/approval` | Krok 3: Čekání na schválení (~24h) | PARTS_SUPPLIER | ✅ Funkční |

### Profil

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 193 | `/parts/profile` | Profil dodavatele — editace, Stripe Connect napojení | PARTS_SUPPLIER | ✅ Funkční |

---

## 9. ADMIN PANEL

### Core

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 194 | `/admin/dashboard` | Dashboard — KPI, grafy, aktivita, čekající schválení | ADMIN, BACKOFFICE, MANAGER | ✅ Funkční |
| 195 | `/admin/profile` | Profil admina (jméno, email, telefon, role) | ADMIN, BACKOFFICE, MANAGER | ✅ Funkční |

### Uživatelé & makléři

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 196 | `/admin/users` | Správa uživatelů — role, status, blokování | ADMIN, BACKOFFICE | ✅ Funkční |
| 197 | `/admin/brokers` | Seznam makléřů + onboarding | ADMIN, BACKOFFICE | ✅ Funkční |

### Vozidla

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 198 | `/admin/vehicles` | Seznam vozidel — schvalování, VIN, filtry | ADMIN, BACKOFFICE, MANAGER | ✅ Funkční |
| 199 | `/admin/vehicles/[id]` | Detail vozidla — VIN, specs, fotky, trust score | ADMIN, BACKOFFICE, MANAGER | ✅ Funkční |
| 200 | `/admin/vehicles/[id]/edit` | Editace vozidla (cena, popis, výbava, stav) | ADMIN, BACKOFFICE, MANAGER | ✅ Funkční |

### Objednávky & díly

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 201 | `/admin/orders` | Všechny objednávky — status, sub-objednávky | ADMIN, BACKOFFICE, MANAGER | ✅ Funkční |
| 202 | `/admin/parts` | Správa dílů — filtry, bulk editace | ADMIN, BACKOFFICE | ✅ Funkční |
| 203 | `/admin/payments` | Správa plateb | ADMIN | ✅ Funkční |
| 204 | `/admin/payouts` | Správa výplat | ADMIN | ✅ Funkční |

### Partneři & CRM

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 205 | `/admin/partners` | Partner CRM — funnel vizualizace, akvizice | ADMIN, MANAGER | ✅ Funkční |
| 206 | `/admin/partners/[id]` | Detail partnera | ADMIN, MANAGER | ✅ Funkční |
| 207 | `/admin/suppliers` | Seznam dodavatelů dílů — role, status, tržby | ADMIN, BACKOFFICE | ✅ Funkční |

### Marketplace

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 208 | `/admin/marketplace` | Správa flipů — schvalování, platby | ADMIN | ✅ Funkční |
| 209 | `/admin/marketplace/[id]` | Detail flipu — timeline, investoři, akce | ADMIN | ✅ Funkční |

### Feedy

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 210 | `/admin/feeds` | Feed konfigurace — import, stav | ADMIN | ✅ Funkční |
| 211 | `/admin/feeds/new` | Nový feed (dodavatel, URL, formát, markup) | ADMIN | ✅ Funkční |
| 212 | `/admin/feeds/[id]` | Detail feedu — editace, historie importů | ADMIN | ✅ Funkční |

### Manager sekce

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 213 | `/admin/manager` | Manager dashboard — team KPI, top makléři | MANAGER | ✅ Funkční |
| 214 | `/admin/manager/brokers` | Makléři v týmu — provize, statistiky | MANAGER | ✅ Funkční |
| 215 | `/admin/manager/brokers/[id]` | Detail makléře — profil, vozidla, provize | MANAGER | ✅ Funkční |
| 216 | `/admin/manager/brokers/[id]/transfer` | Převod vozidel mezi makléři | MANAGER | ✅ Funkční |
| 217 | `/admin/manager/vehicles/[id]/edit` | Editace vozidla v týmu | MANAGER | ✅ Funkční |
| 218 | `/admin/manager/bonuses` | Bonusy managera (2 500 Kč/prodej) | MANAGER | ✅ Funkční |
| 219 | `/admin/manager/approvals` | Fronta ke schválení (draft/pending vozidla) | MANAGER | ✅ Funkční |
| 220 | `/admin/manager/notifications` | Notifikační preference managera | MANAGER | ✅ Funkční |

### Leady & notifikace

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 221 | `/admin/leads` | Správa leadů — konverze, regiony | ADMIN, MANAGER | ✅ Funkční |
| 222 | `/admin/leads/[id]` | Detail leadu — přiřazení, kontakt, vozidlo | ADMIN, MANAGER | ✅ Funkční |
| 223 | `/admin/notifications` | Inbox notifikací | Všechny admin role | ✅ Funkční |

### Inzerce & vrácení

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 224 | `/admin/inzerce` | Správa inzerátů — moderace, flagování | ADMIN | ✅ Funkční |
| 225 | `/admin/inzerce/[id]` | Detail inzerátu | ADMIN | ✅ Funkční |
| 226 | `/admin/returns` | Vrácení/reklamace — RMA, deadline, status | ADMIN, BACKOFFICE | ✅ Funkční |
| 227 | `/admin/returns/[id]` | Detail vrácení — fotky, položky, schválení | ADMIN, BACKOFFICE | ✅ Funkční |

### Systém

| # | URL | Co dělá | Auth | Stav |
|---|-----|---------|------|------|
| 228 | `/admin/tagy` | Správa tagů/hashtagů (read-only) | ADMIN | ✅ Funkční |

---

## 10. API ROUTES — SOUHRN

### Počet endpointů dle sekce

| Sekce | Počet routes | Klíčové endpointy |
|-------|-------------|-------------------|
| Auth & registrace | 11 | register, login, forgot-password, verify-email, ARES |
| Vehicles | 26 | CRUD, images, status, cebia, reserve, inquiries, price-history, timeline, handover |
| VIN | 4 | decode, check-duplicate, cebia check/report |
| Listings (inzerce) | 17 | CRUD, images, inquiry, promote, extend, reserve, stats |
| Contacts & CRM | 8 | CRUD, search, communications, sync |
| Contracts | 6 | CRUD, sign, send, PDF |
| Parts | 17 | CRUD, autocomplete, compatible, compare, oem-lookup, smart-search, visual-search, import, reserve |
| Orders & suborders | 10 | create, status, returns, tracking, guest-track |
| Payments & Stripe | 8 | checkout, confirm, webhook, connect onboard/dashboard/status |
| Payouts | 6 | broker payouts, seller payouts, approve, invoice |
| Broker dashboard | 8 | profile, vehicles, stats, commissions, achievements, leaderboard, notifications |
| Buyer | 2 | inquiries, stats |
| Partners | 16 | CRUD, activate, activities, public profile, dashboard, vehicles, parts, leads, billing, stats |
| Manager | 8 | brokers CRUD, transfer, approve, stats, bonuses |
| Admin | 23 | users, vehicles, listings, parts, orders, returns, suppliers, feeds, reports |
| AI assistant | 3 | chat, generate-description, price-estimate |
| Marketplace | 8 | opportunities CRUD, approve, payout, investments, apply, stats |
| Onboarding | 4 | profile, documents, quiz, contract |
| Profile & settings | 10 | edit, password, bank, notifications, export, delete-account |
| Search | 3 | global, smart, history |
| Watchdog & leads | 9 | CRUD, email, leads CRUD, assign, external, stats |
| Favorites & social | 4 | favorites, likes, comments |
| Feeds export/import | 8 | bazos.xml, sauto.xml, tipcars.xml, config, logs, run |
| Email & notifications | 7 | templates, preview, send, history, contact form, seller-notifications |
| Shipping | 3 | calculate, label, zasilkovna-points |
| Garage & reservations | 4 | CRUD, cancel reservation |
| Invitations | 2 | send, validate |
| Cron jobs | 10 | listing-expiry, exclusive-expiry, reservation-expiry, part-request-expiry, quick-draft-expiry, stale-vehicles, stock-alerts, upsell-check, sla-check, watchdog-match |
| Utility | 5 | upload, ares, tags, csp-report, revalidate |
| **CELKEM** | **~270** | |

---

## 11. ZNÁMÉ ISSUES & STUBY

| # | Issue | Kde | Priorita |
|---|-------|-----|----------|
| 1 | VIN kamerový sken — stub tlačítko "Již brzy" | `/makler/vehicles/new/vin` | Střední |
| 2 | AI cenový odhad — CHYBÍ (jen manuální cena) | `/makler/vehicles/new/pricing` | Střední |
| 3 | Admin "Přidat vozidlo" — disabled button | `/admin/vehicles` | Nízká |
| 4 | Admin sidebar badge — overflow při 280px | `/admin/*` | Nízká |
| 5 | Admin notifikační zvon — statický, žádný handler | `/admin/*` | Střední |
| 6 | Admin profil — chybí stránka (nově přidána #195) | `/admin/profile` | Nízká |
| 7 | Notification badge v PWA Parts — hardcoded "2" | `/parts/*` | Nízká |
| 8 | Fotky příležitostí v Marketplace — UI dropzone bez handleru | `/marketplace/dealer/nova` | Střední |
| 9 | Dealer profil/historie v Marketplace — UI zmíněn, ne implementován | `/marketplace/*` | Nízká |
| 10 | Cron job listing-expiry — endpoint existuje, automatizace TBD | `/api/cron/listing-expiry` | Střední |

---

## 12. TESTOVACÍ PRIORITY

### P1 — Kritické (core business flows)

1. **Registrace + login** (všechny role)
2. **Makléř: nabírání auta** (7-krokový wizard end-to-end)
3. **Makléř: smlouvy** (vytvoření → podpis → PDF → email)
4. **Dodavatel: přidání dílu** (3-krokový wizard)
5. **Dodavatel: objednávka** (příjem → potvrzení → štítek → odeslání)
6. **Kupující: nákup dílu** (katalog → košík → checkout → platba)
7. **Inzerent: podání inzerátu** (6 kroků, i bez registrace)
8. **Marketplace: investiční flow** (přihlášení → příležitost → investice)

### P2 — Důležité (supporting features)

9. **VIN dekódování** (vindecoder.eu + NHTSA fallback)
10. **AI generování popisu** (Claude API)
11. **Dashboard statistiky** (makléř, dodavatel, admin)
12. **Stripe platby** (TOP propagace, checkout, Connect)
13. **Onboarding** (makléř 5 kroků, dodavatel 3 kroky)
14. **Admin schvalování** (vozidla, makléři, partneři)

### P3 — Doplňkové

15. **SEO landing pages** (metadata, canonical, structured data)
16. **Offline PWA** (service worker, IndexedDB, sync)
17. **Hlídací pes** (notifikace, watchdog matching)
18. **Gamifikace** (level, leaderboard, achievements)
19. **CSV import dílů**
20. **Feed export** (Bazoš, Sauto, TipCars XML)
