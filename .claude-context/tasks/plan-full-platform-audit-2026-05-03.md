# Carmakler — Kompletni audit plan platformy
> Datum: 2026-05-03
> Autor: Planovac
> Ucet: 275 stranek, 293 API endpointu, 85 Prisma modelu, 5 route groups

---

## 1. PREHLED ARCHITEKTURY

### Route Groups
| Group | Prefix | Ucel | Auth |
|-------|--------|------|------|
| `(web)` | `/` | Verejny web — katalog, landing pages, eshop, inzerce, marketplace | Castecne (muj-ucet, moje-inzeraty, objednavky) |
| `(admin)` | `/admin` | BackOffice admin panel | ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR |
| `(pwa)` | `/makler` | PWA pro maklere | BROKER, MANAGER, REGIONAL_DIRECTOR, ADMIN |
| `(pwa-parts)` | `/parts` | PWA pro dodavatele dilu | PARTS_SUPPLIER, WHOLESALE_SUPPLIER, PARTNER_VRAKOVISTE, ADMIN |
| `(partner)` | `/partner` | Portal pro bazary a vrakoviste | PARTNER_BAZAR, PARTNER_VRAKOVISTE, ADMIN |

### Subdomeny
- `carmakler.cz` — hlavni web (maklerska sit)
- `inzerce.carmakler.cz` — inzertni platforma
- `shop.carmakler.cz` — eshop autodily
- `marketplace.carmakler.cz` — VIP marketplace

---

## 2. VSECHNY STRANKY/ROUTES (275 pages)

### 2.1 Verejny web — (web) — ~175 stranek

#### Homepage & informacni stranky
- [ ] `/` — Homepage (hero, doporucena vozidla, makleri, CTA)
- [ ] `/o-nas` — O nas
- [ ] `/jak-to-funguje` — Jak to funguje (3 kroky)
- [ ] `/jak-prodat-auto` — Jak prodat auto
- [ ] `/chci-prodat` — Landing "Chci prodat" + sell-request formular
- [ ] `/cenik` — Cenik sluzeb
- [ ] `/kontakt` — Kontaktni stranka
- [ ] `/kariera` — Kariera / prace u Carmakler
- [ ] `/recenze` — Recenze zakazniku
- [ ] `/pro-maklere` — Landing pro maklere
- [ ] `/kolik-stoji-moje-auto` — AI odhad ceny vozu
- [ ] `/obchodni-podminky` — Obchodni podminky
- [ ] `/ochrana-osobnich-udaju` — GDPR
- [ ] `/zasady-cookies` — Cookies policy
- [ ] `/reklamacni-rad` — Reklamacni rad
- [ ] `/prezentace` — Prezentacni stranka

#### Nabidka vozidel (maklerska sit)
- [ ] `/nabidka` — Katalog vozidel s filtry a razenim
- [ ] `/nabidka/[slug]` — Detail vozu (galerie, specs, kontakt na maklere)
- [ ] `/nabidka/[slug]/platba` — Platba za vuz
- [ ] `/nabidka/[slug]/platba/uspech` — Uspesna platba
- [ ] `/nabidka/porovnani` — Porovnani vozidel
- [ ] `/bazar/[slug]` — Alternativni URL pro detail vozu

#### SEO landing pages nabidka (~40 stranek)
- [ ] `/nabidka/skoda`, `/nabidka/skoda/octavia`, `/nabidka/skoda/fabia`, `/nabidka/skoda/superb`, `/nabidka/skoda/kodiaq`
- [ ] `/nabidka/bmw`, `/nabidka/bmw/3-series`
- [ ] `/nabidka/volkswagen`, `/nabidka/volkswagen/golf`, `/nabidka/volkswagen/passat`
- [ ] `/nabidka/audi`, `/nabidka/audi/a4`
- [ ] `/nabidka/ford`, `/nabidka/ford/focus`
- [ ] `/nabidka/hyundai`, `/nabidka/hyundai/i30`
- [ ] `/nabidka/kia`, `/nabidka/kia/ceed`
- [ ] `/nabidka/toyota`, `/nabidka/toyota/yaris`
- [ ] `/nabidka/mercedes-benz`, `/nabidka/peugeot`, `/nabidka/renault`, `/nabidka/seat`, `/nabidka/opel`, `/nabidka/citroen`, `/nabidka/dacia`, `/nabidka/mazda`
- [ ] `/nabidka/praha`, `/nabidka/brno`, `/nabidka/ostrava`, `/nabidka/plzen`, `/nabidka/olomouc`, `/nabidka/liberec`, `/nabidka/hradec-kralove`, `/nabidka/ceske-budejovice`
- [ ] `/nabidka/do-100000`, `/nabidka/do-200000`, `/nabidka/do-300000`, `/nabidka/do-500000`, `/nabidka/do-1000000`
- [ ] `/nabidka/suv`, `/nabidka/sedan`, `/nabidka/kombi`, `/nabidka/hatchback`, `/nabidka/kabriolet`
- [ ] `/nabidka/elektromobily`, `/nabidka/hybrid`

#### Makleri
- [ ] `/makleri` — Seznam vsech makleru
- [ ] `/makleri/[slug]` — Verejny profil maklere
- [ ] `/makler/[slug]` — Alternativni URL profilu maklere

#### Sluzby
- [ ] `/sluzby` — Prehled sluzeb
- [ ] `/sluzby/proverka` — Proverka vozu (CEBIA)
- [ ] `/sluzby/financovani` — Financovani
- [ ] `/sluzby/pojisteni` — Pojisteni

#### Auth & ucet
- [ ] `/prihlaseni` — Prihlaseni
- [ ] `/login` — Login (alternativni)
- [ ] `/registrace` — Registrace (rozdeleni dle role)
- [ ] `/registrace/makler` — Registrace maklere
- [ ] `/registrace/dodavatel` — Registrace dodavatele dilu
- [ ] `/registrace/partner` — Registrace partnera (bazar/vrakoviste)
- [ ] `/zapomenute-heslo` — Zapomenute heslo
- [ ] `/reset-hesla/[token]` — Reset hesla
- [ ] `/overeni-emailu/[token]` — Overeni emailu
- [ ] `/overeni-emailu/uspech` — Uspech overeni
- [ ] `/overeni-emailu/chyba` — Chyba overeni

#### Muj ucet (prihlaseny uzivatel)
- [ ] `/muj-ucet` — Dashboard uzivatele
- [ ] `/muj-ucet/profil` — Profil uzivatele
- [ ] `/muj-ucet/profil/setup` — Prvni nastaveni profilu
- [ ] `/muj-ucet/oblibene` — Oblibene vozy
- [ ] `/muj-ucet/dotazy` — Moje dotazy
- [ ] `/muj-ucet/garaz` — Moje garaz (ulozena auta)
- [ ] `/muj-ucet/hlidaci-pes` — Watchdog notifikace
- [ ] `/muj-ucet/poptavky` — Poptavky na dily
- [ ] `/profil/[slug]` — Verejny profil uzivatele

#### Notifikace
- [ ] `/notifikace/[token]` — Notifikacni preference (email unsubscribe)

#### Blog/Magazin
- [ ] `/blog` — Seznam clanku
- [ ] `/blog/[slug]` — Detail clanku
- [ ] `/blog/kategorie/[slug]` — Clanky dle kategorie

#### Tagy & hashtagy
- [ ] `/tag/[slug]` — Stranky dle tagu
- [ ] `/h/[slug]` — Hashtag stranky

#### Inzertni platforma
- [ ] `/inzerce` — Landing inzercni platformy
- [ ] `/inzerce/katalog` — Katalog inzeratu
- [ ] `/inzerce/pridat` — Pridat inzerat
- [ ] `/inzerce/registrace` — Registrace inzerenta
- [ ] `/moje-inzeraty` — Moje inzeraty (seznam)
- [ ] `/moje-inzeraty/[id]` — Detail meho inzeratu
- [ ] `/dodavatel/[slug]` — Profil dodavatele/inzerenta

#### Eshop autodily (shop)
- [ ] `/shop` — Landing eshop
- [ ] `/shop/katalog` — Katalog produktu
- [ ] `/shop/produkt/[slug]` — Detail produktu
- [ ] `/shop/kosik` — Kosik
- [ ] `/shop/objednavka` — Objednavka (checkout)
- [ ] `/shop/objednavka/potvrzeni` — Potvrzeni objednavky
- [ ] `/shop/moje-objednavky` — Moje objednavky
- [ ] `/shop/moje-objednavky/[id]/reklamace` — Reklamace
- [ ] `/shop/moje-objednavky/[id]/vraceni` — Vraceni zbozi
- [ ] `/shop/objednavky/sledovani/[token]` — Sledovani zasilky
- [ ] `/shop/reklamace` — Info o reklamaci
- [ ] `/shop/vraceni-zbozi` — Info o vraceni zbozi

#### Dily (alternativni cesty pro eshop)
- [ ] `/dily` — Landing dily
- [ ] `/dily/[slug]` — Detail dilu
- [ ] `/dily/katalog` — Katalog dilu
- [ ] `/dily/kategorie/[slug]` — Dily dle kategorie
- [ ] `/dily/kosik` — Kosik dilu
- [ ] `/dily/objednavka` — Objednavka dilu
- [ ] `/dily/objednavka/potvrzeni` — Potvrzeni objednavky
- [ ] `/dily/moje-objednavky` — Moje objednavky dilu
- [ ] `/dily/vrakoviste/[slug]` — Profil vrakoviste
- [ ] `/dily/znacka/[brand]` — Dily dle znacky
- [ ] `/dily/znacka/[brand]/[model]` — Dily dle modelu
- [ ] `/dily/znacka/[brand]/[model]/[rok]` — Dily dle rocniku

#### Marketplace VIP
- [ ] `/marketplace` — Landing marketplace
- [ ] `/marketplace/apply` — Zadost o pristup
- [ ] `/marketplace/dealer` — Dealer dashboard
- [ ] `/marketplace/dealer/[id]` — Detail dealu (dealer)
- [ ] `/marketplace/dealer/nova` — Novy deal (dealer)
- [ ] `/marketplace/investor` — Investor dashboard
- [ ] `/marketplace/investor/[id]` — Detail investice
- [ ] `/marketplace/deals/[id]` — Sjednoceny detail dealu

### 2.2 Admin panel — (admin) — 49 stranek

#### Zakladni admin
- [ ] `/admin/dashboard` — Hlavni dashboard
- [ ] `/admin/vehicles` — Seznam vozidel
- [ ] `/admin/vehicles/new` — Pridat vozidlo
- [ ] `/admin/vehicles/[id]` — Detail vozidla
- [ ] `/admin/vehicles/[id]/edit` — Editace vozidla
- [ ] `/admin/brokers` — Seznam makleru
- [ ] `/admin/brokers/[id]` — Detail maklere
- [ ] `/admin/brokers/[id]/edit` — Editace maklere
- [ ] `/admin/users` — Sprava uzivatelu
- [ ] `/admin/team` — Tym
- [ ] `/admin/profile` — Profil admina
- [ ] `/admin/notifications` — Notifikace
- [ ] `/admin/payments` — Platby
- [ ] `/admin/payouts` — Vyplaty

#### Inzerce admin
- [ ] `/admin/inzerce` — Sprava inzeratu
- [ ] `/admin/inzerce/[id]` — Detail inzeratu

#### Eshop admin
- [ ] `/admin/orders` — Objednavky
- [ ] `/admin/parts` — Dily
- [ ] `/admin/suppliers` — Dodavatele
- [ ] `/admin/returns` — Vraceni
- [ ] `/admin/returns/[id]` — Detail vraceni
- [ ] `/admin/tagy` — Sprava tagu

#### Feeds
- [ ] `/admin/feeds` — XML feedy
- [ ] `/admin/feeds/new` — Novy feed
- [ ] `/admin/feeds/[id]` — Detail feedu

#### Leads
- [ ] `/admin/leads` — Seznam leadu
- [ ] `/admin/leads/[id]` — Detail leadu

#### Partners
- [ ] `/admin/partners` — Seznam partneru
- [ ] `/admin/partners/new` — Novy partner
- [ ] `/admin/partners/[id]` — Detail partnera

#### Marketplace admin
- [ ] `/admin/marketplace` — Marketplace prehled
- [ ] `/admin/marketplace/[id]` — Detail opportunity
- [ ] `/admin/marketplace/applications` — Zadosti
- [ ] `/admin/marketplace/applications/[id]` — Detail zadosti

#### Blog admin
- [ ] `/admin/blog` — Clanky
- [ ] `/admin/blog/[id]/edit` — Editace clanku
- [ ] `/admin/blog/ai-drafts` — AI navrhy
- [ ] `/admin/blog/comments` — Komentare

#### Dalsich admin
- [ ] `/admin/career` — Karierni system
- [ ] `/admin/reviews` — Recenze

#### Manager
- [ ] `/admin/manager` — Manager dashboard
- [ ] `/admin/manager/approvals` — Schvalovani
- [ ] `/admin/manager/bonuses` — Bonusy
- [ ] `/admin/manager/brokers` — Makleri managera
- [ ] `/admin/manager/brokers/[id]` — Detail maklere
- [ ] `/admin/manager/brokers/[id]/transfer` — Prenos maklere
- [ ] `/admin/manager/notifications` — Notifikace
- [ ] `/admin/manager/vehicles/[id]/edit` — Editace vozidla

### 2.3 PWA Makler — (pwa) — 38 stranek

#### Dashboard & zakladni
- [ ] `/makler` — Redirect/landing
- [ ] `/makler/dashboard` — Hlavni dashboard
- [ ] `/makler/profile` — Profil maklere
- [ ] `/makler/stats` — Statistiky
- [ ] `/makler/leaderboard` — Zebricek makleru
- [ ] `/makler/materials` — Marketingove materialy
- [ ] `/makler/offline` — Offline stranka

#### Vozidla
- [ ] `/makler/vehicles` — Seznam vozidel
- [ ] `/makler/vehicles/[id]` — Detail vozidla
- [ ] `/makler/vehicles/[id]/edit` — Editace vozidla
- [ ] `/makler/vehicles/[id]/handover` — Predani vozu

#### Nabrat auto (7-krokovy flow)
- [ ] `/makler/vehicles/new` — Start (VIN vstup)
- [ ] `/makler/vehicles/new/vin` — VIN dekodovani
- [ ] `/makler/vehicles/new/details` — Zakladni udaje
- [ ] `/makler/vehicles/new/equipment` — Vybava
- [ ] `/makler/vehicles/new/inspection` — Stav vozu
- [ ] `/makler/vehicles/new/photos` — Fotografie
- [ ] `/makler/vehicles/new/pricing` — Cena
- [ ] `/makler/vehicles/new/contact` — Kontakt na prodejce
- [ ] `/makler/vehicles/new/review` — Rekapitulace
- [ ] `/makler/vehicles/new/success` — Uspech

#### Rychle nabirani (3-krokovy flow)
- [ ] `/makler/vehicles/quick` — Start
- [ ] `/makler/vehicles/quick/step1` — Krok 1
- [ ] `/makler/vehicles/quick/step2` — Krok 2
- [ ] `/makler/vehicles/quick/step3` — Krok 3
- [ ] `/makler/vehicles/quick/success` — Uspech

#### Smlouvy
- [ ] `/makler/contracts` — Seznam smluv
- [ ] `/makler/contracts/new` — Nova smlouva
- [ ] `/makler/contracts/[id]` — Detail smlouvy
- [ ] `/makler/contracts/[id]/sign` — Digitalni podpis

#### Provize & finance
- [ ] `/makler/commissions` — Provize
- [ ] `/makler/provize` — Provize (alternativni)
- [ ] `/makler/financing-calculator` — Kalkulator financovani

#### Komunikace
- [ ] `/makler/leads` — Seznam leadu
- [ ] `/makler/leads/[id]` — Detail leadu
- [ ] `/makler/messages` — Zpravy
- [ ] `/makler/messages/[vehicleId]` — Konverzace k vozidlu
- [ ] `/makler/contacts` — Kontakty CRM
- [ ] `/makler/contacts/[id]` — Detail kontaktu
- [ ] `/makler/contacts/new` — Novy kontakt

#### Blog (makler)
- [ ] `/makler/blog` — Clanky maklere
- [ ] `/makler/blog/new` — Novy clanek
- [ ] `/makler/blog/[id]/edit` — Editace clanku

#### Nastaveni
- [ ] `/makler/settings` — Nastaveni
- [ ] `/makler/settings/notifications` — Notifikacni preference

#### Onboarding (6 kroku)
- [ ] `/makler/onboarding` — Start onboardingu
- [ ] `/makler/onboarding/profile` — Profil
- [ ] `/makler/onboarding/documents` — Dokumenty
- [ ] `/makler/onboarding/training` — Skoleni/kviz
- [ ] `/makler/onboarding/contract` — Smlouva s Carmakler
- [ ] `/makler/onboarding/approval` — Ceka na schvaleni

### 2.4 PWA Dily (dodavatel) — (pwa-parts) — 14 stranek

- [ ] `/parts` — Dashboard dodavatele
- [ ] `/parts/new` — Pridat dil
- [ ] `/parts/my` — Moje dily
- [ ] `/parts/[id]` — Detail dilu
- [ ] `/parts/[id]/edit` — Editace dilu
- [ ] `/parts/import` — Hromadny import
- [ ] `/parts/profile` — Profil dodavatele
- [ ] `/parts/orders` — Objednavky
- [ ] `/parts/orders/[id]` — Detail objednavky
- [ ] `/parts/donors` — Donor vozidla
- [ ] `/parts/donors/[id]` — Detail donor vozidla
- [ ] `/parts/onboarding` — Start onboardingu
- [ ] `/parts/onboarding/profile` — Profil
- [ ] `/parts/onboarding/documents` — Dokumenty
- [ ] `/parts/onboarding/approval` — Schvaleni

### 2.5 Partnersky portal — (partner) — 18 stranek

- [ ] `/partner/dashboard` — Dashboard
- [ ] `/partner/vehicles` — Vozidla partnera
- [ ] `/partner/vehicles/new` — Pridat vozidlo
- [ ] `/partner/vehicles/[id]` — Detail vozidla
- [ ] `/partner/parts` — Dily partnera
- [ ] `/partner/parts/new` — Pridat dil
- [ ] `/partner/parts/[id]` — Detail dilu
- [ ] `/partner/orders` — Objednavky
- [ ] `/partner/orders/[id]` — Detail objednavky
- [ ] `/partner/leads` — Leady
- [ ] `/partner/messages` — Zpravy
- [ ] `/partner/billing` — Fakturace
- [ ] `/partner/stats` — Statistiky
- [ ] `/partner/profile` — Profil
- [ ] `/partner/documents` — Dokumenty
- [ ] `/partner/onboarding` — Start
- [ ] `/partner/onboarding/profile` — Profil
- [ ] `/partner/onboarding/documents` — Dokumenty
- [ ] `/partner/onboarding/approval` — Schvaleni

---

## 3. VSECHNY API ENDPOINTY (293 routes)

### 3.1 Auth (11 routes)
- [ ] `POST /api/auth/[...nextauth]` — NextAuth.js (login, session, callback)
- [ ] `POST /api/auth/register` — Registrace uzivatele
- [ ] `POST /api/auth/register/broker` — Registrace maklere
- [ ] `POST /api/auth/register/partner` — Registrace partnera
- [ ] `GET /api/auth/register/ares` — ARES lookup pri registraci
- [ ] `POST /api/auth/forgot-password` — Zapomenute heslo
- [ ] `POST /api/auth/reset-password` — Reset hesla
- [ ] `POST /api/auth/resend-verification` — Znovu odeslat overovaci email
- [ ] `GET /api/auth/verify-email/[token]` — Overeni emailu
- [ ] `POST /api/auth/partner-onboarding` — Partner onboarding
- [ ] `POST /api/auth/supplier-onboarding` — Supplier onboarding

### 3.2 Vehicles (25+ routes)
- [ ] `GET/POST /api/vehicles` — Seznam/vytvoreni vozidel
- [ ] `GET/PATCH/DELETE /api/vehicles/[id]` — Detail/editace/smazani
- [ ] `GET /api/vehicles/[id]/full` — Plny detail vozidla
- [ ] `POST /api/vehicles/[id]/images` — Upload obrazku
- [ ] `GET /api/vehicles/[id]/similar` — Podobna vozidla
- [ ] `GET /api/vehicles/[id]/price-history` — Cenova historie
- [ ] `POST /api/vehicles/[id]/price-reduction` — Snizeni ceny
- [ ] `POST /api/vehicles/[id]/price-reduction/[reductionId]/respond` — Reakce na snizeni
- [ ] `POST /api/vehicles/[id]/reserve` — Rezervace vozu
- [ ] `PATCH /api/vehicles/[id]/status` — Zmena statusu
- [ ] `GET /api/vehicles/[id]/timeline` — Casova osa
- [ ] `PATCH /api/vehicles/[id]/workflow` — Workflow akce
- [ ] `POST /api/vehicles/[id]/flag` — Nahlaseni
- [ ] `POST /api/vehicles/[id]/report-violation` — Poruseni
- [ ] `GET /api/vehicles/[id]/cebia` — CEBIA check
- [ ] `POST /api/vehicles/[id]/damage` — Hlaseni poskozeni
- [ ] `POST /api/vehicles/[id]/damage/[damageId]/repair` — Oprava poskozeni
- [ ] `GET /api/vehicles/[id]/exclusive-status` — Exkluzivni status
- [ ] `POST /api/vehicles/[id]/extend-exclusive` — Prodlouzeni exkl.
- [ ] `POST /api/vehicles/[id]/terminate-exclusive` — Ukonceni exkl.
- [ ] `POST /api/vehicles/[id]/handover` — Predani vozu
- [ ] `GET /api/vehicles/[id]/inquiries` — Dotazy na vozidlo
- [ ] `PATCH /api/vehicles/[id]/inquiries/[inquiryId]` — Akce na dotaz
- [ ] `POST /api/vehicles/quick` — Rychle nabirani

### 3.3 Broker (8 routes)
- [ ] `GET /api/broker/stats` — Statistiky maklere
- [ ] `GET /api/broker/detailed-stats` — Detailni statistiky
- [ ] `GET /api/broker/commissions` — Provize
- [ ] `GET /api/broker/vehicles` — Vozidla maklere
- [ ] `GET /api/broker/achievements` — Achievements
- [ ] `GET/PATCH /api/broker/profile` — Profil
- [ ] `GET /api/broker/leaderboard` — Zebricek
- [ ] `GET /api/broker/notifications` — Notifikace
- [ ] `POST /api/broker/tour-complete` — Dokonceni pruvdce

### 3.4 Contacts CRM (5 routes)
- [ ] `GET/POST /api/contacts` — Seznam/vytvoreni kontaktu
- [ ] `GET/PATCH/DELETE /api/contacts/[id]` — Detail/editace/smazani
- [ ] `GET /api/contacts/[id]/communications` — Komunikace
- [ ] `GET /api/contacts/search` — Vyhledavani kontaktu
- [ ] `POST /api/contacts/sync` — Synchronizace

### 3.5 Contracts (5 routes)
- [ ] `GET/POST /api/contracts` — Seznam/vytvoreni
- [ ] `GET/PATCH /api/contracts/[id]` — Detail/editace
- [ ] `POST /api/contracts/[id]/sign` — Digitalni podpis
- [ ] `GET /api/contracts/[id]/pdf` — PDF smlouvy
- [ ] `POST /api/contracts/[id]/send` — Odeslani smlouvy

### 3.6 Leads (7 routes)
- [ ] `GET/POST /api/leads` — Seznam/vytvoreni
- [ ] `GET/PATCH /api/leads/[id]` — Detail/editace
- [ ] `POST /api/leads/[id]/assign` — Prirazeni makleri
- [ ] `PATCH /api/leads/[id]/status` — Zmena statusu
- [ ] `GET /api/leads/stats` — Statistiky leadu
- [ ] `POST /api/leads/external` — Externi lead

### 3.7 Listings / Inzerce (14 routes)
- [ ] `GET/POST /api/listings` — Seznam/vytvoreni inzeratu
- [ ] `GET /api/listings/my` — Moje inzeraty
- [ ] `GET/PATCH/DELETE /api/listings/[id]` — Detail/editace/smazani
- [ ] `POST /api/listings/[id]/images` — Upload obrazku
- [ ] `POST /api/listings/[id]/extend` — Prodlouzeni inzeratu
- [ ] `POST /api/listings/[id]/flag` — Nahlaseni
- [ ] `POST /api/listings/[id]/promote` — Propagace
- [ ] `POST /api/listings/[id]/reserve` — Rezervace
- [ ] `GET /api/listings/[id]/stats` — Statistiky
- [ ] `POST /api/listings/[id]/inquiry` — Dotaz na inzerat
- [ ] `POST /api/listings/[id]/inquiry/[inquiryId]/reply` — Odpoved
- [ ] `PATCH /api/listings/[id]/inquiry/[inquiryId]/status` — Status dotazu
- [ ] `GET /api/listings/quick-filters` — Rychle filtry
- [ ] `POST /api/inzerce` — Pridat inzerat (alternativni)

### 3.8 Parts / Dily (15 routes)
- [ ] `GET/POST /api/parts` — Seznam/vytvoreni
- [ ] `GET/PATCH/DELETE /api/parts/[id]` — Detail/editace/smazani
- [ ] `POST /api/parts/[id]/notify-stock` — Notifikace o naskladneni
- [ ] `GET /api/parts/for-vehicle` — Dily pro vozidlo
- [ ] `GET /api/parts/autocomplete` — Autocomplete hledani
- [ ] `GET /api/parts/compare` — Porovnani dilu
- [ ] `GET /api/parts/compatible` — Kompatibilni dily
- [ ] `POST /api/parts/import` — Hromadny import
- [ ] `GET /api/parts/my` — Moje dily
- [ ] `GET /api/parts/oem-lookup` — OEM vyhledavani
- [ ] `POST /api/parts/reserve` — Rezervace dilu
- [ ] `GET /api/parts/smart-search` — Chytre vyhledavani
- [ ] `GET /api/parts/supplier-stats` — Statistiky dodavatele
- [ ] `POST /api/parts/visual-search` — Vizualni vyhledavani

### 3.9 Orders (10 routes)
- [ ] `GET/POST /api/orders` — Seznam/vytvoreni objednavek
- [ ] `GET /api/orders/[id]` — Detail objednavky
- [ ] `PATCH /api/orders/[id]/status` — Zmena statusu
- [ ] `POST /api/orders/[id]/returns` — Vytvoreni vraceni
- [ ] `POST /api/orders/[id]/returns/[returnId]/ship-back` — Odeslani zpet
- [ ] `GET /api/orders/track/[token]` — Sledovani objednavky
- [ ] `GET/PATCH /api/suborders/[id]` — Subobjednavky
- [ ] `PATCH /api/suborders/[id]/status` — Status subobjednavky
- [ ] `PATCH /api/suborders/[id]/tracking` — Tracking cislo

### 3.10 Marketplace (14 routes)
- [ ] `POST /api/marketplace/apply` — Zadost o pristup
- [ ] `GET/POST /api/marketplace/opportunities` — Prehled/vytvoreni
- [ ] `GET/PATCH /api/marketplace/opportunities/[id]` — Detail/editace
- [ ] `POST /api/marketplace/opportunities/[id]/approve` — Schvaleni
- [ ] `POST /api/marketplace/opportunities/[id]/milestones` — Milniky
- [ ] `POST /api/marketplace/opportunities/[id]/payout` — Vyplata
- [ ] `GET/POST /api/marketplace/investments` — Investice
- [ ] `POST /api/marketplace/investments/[id]/confirm-payment` — Potvrzeni platby
- [ ] `GET/POST /api/marketplace/negotiations` — Vyjednavani
- [ ] `POST /api/marketplace/negotiations/[id]/respond` — Odpoved
- [ ] `GET /api/marketplace/notifications` — Notifikace
- [ ] `POST /api/marketplace/notifications/[id]/read` — Precteni
- [ ] `POST /api/marketplace/notifications/read-all` — Precist vse
- [ ] `GET /api/marketplace/stats` — Statistiky

### 3.11 Payments & Payouts (12 routes)
- [ ] `GET /api/payments` — Platby
- [ ] `POST /api/payments/create-checkout` — Vytvoreni checkout session
- [ ] `POST /api/payments/[id]/confirm` — Potvrzeni platby
- [ ] `POST /api/payments/webhook` — Stripe webhook
- [ ] `GET /api/payouts/broker` — Vyplaty makleru
- [ ] `POST /api/payouts/broker/generate` — Generovani vyplaty
- [ ] `POST /api/payouts/broker/[id]/approve` — Schvaleni vyplaty
- [ ] `POST /api/payouts/broker/[id]/upload-invoice` — Upload faktury
- [ ] `GET /api/payouts/seller` — Vyplaty prodejcum
- [ ] `POST /api/payouts/seller/[id]/process` — Zpracovani vyplaty
- [ ] `POST /api/stripe/webhook` — Stripe webhook
- [ ] `GET /api/stripe/connect/status` — Connect status
- [ ] `POST /api/stripe/connect/onboard-link` — Onboard link
- [ ] `GET /api/stripe/connect/dashboard-link` — Dashboard link

### 3.12 Admin API (42 routes)
- [ ] `GET /api/admin/brokers` — Seznam makleru
- [ ] `GET /api/admin/brokers/[id]` — Detail maklere
- [ ] `POST /api/admin/brokers/[id]/activate` — Aktivace
- [ ] `POST /api/admin/brokers/[id]/reject` — Zamitnuti
- [ ] `GET /api/admin/vehicles` — Vozidla
- [ ] `GET /api/admin/vehicles/[id]` — Detail
- [ ] `POST /api/admin/vehicles/[id]/approve` — Schvaleni vozu
- [ ] `GET /api/admin/listings` — Inzeraty
- [ ] `GET /api/admin/listings/[id]` — Detail inzeratu
- [ ] `POST /api/admin/listings/[id]/moderate` — Moderace
- [ ] `GET /api/admin/listings/flagged` — Nahlasene
- [ ] `GET /api/admin/orders` — Objednavky
- [ ] `GET /api/admin/parts` — Dily
- [ ] `GET /api/admin/suppliers` — Dodavatele
- [ ] `GET/POST /api/admin/returns` — Vraceni
- [ ] `PATCH /api/admin/returns/[id]` — Detail vraceni
- [ ] `GET /api/admin/reviews` — Recenze
- [ ] `PATCH /api/admin/reviews/[id]` — Editace recenze
- [ ] `GET /api/admin/users` — Uzivatele
- [ ] `GET/PATCH /api/admin/users/[id]` — Detail/editace uzivatele
- [ ] `PATCH /api/admin/users/[id]/password` — Zmena hesla
- [ ] `GET/POST /api/admin/team` — Tym
- [ ] `PATCH /api/admin/team/[id]` — Editace clena tymu
- [ ] `GET/PATCH /api/admin/profile` — Profil admina
- [ ] `PATCH /api/admin/profile/password` — Zmena hesla admina
- [ ] `GET /api/admin/feeds` — Feedy
- [ ] `GET/PATCH /api/admin/feeds/[id]` — Detail/editace feedu
- [ ] `POST /api/admin/feeds/[id]/import` — Spusteni importu
- [ ] `GET /api/admin/feeds/[id]/logs` — Import logy
- [ ] `GET /api/admin/feeds/suppliers` — Dodavatele pro feedy
- [ ] `POST /api/admin/notifications` — Odeslani notifikace
- [ ] `POST /api/admin/export` — Export dat
- [ ] `POST /api/admin/send-verification-emails` — Hromadne overovaci emaily
- [ ] `GET /api/admin/marketplace/applications` — Marketplace zadosti
- [ ] `PATCH /api/admin/marketplace/applications/[id]` — Schvaleni/zamitnuti
- [ ] `PATCH /api/admin/comments/[commentId]` — Moderace komentare
- [ ] `GET /api/admin/career` — Karierni system
- [ ] `PATCH /api/admin/career/[id]/level` — Zmena levelu
- [ ] `GET /api/admin/reports/commission-summary` — Report provizi
- [ ] `PATCH /api/admin/partners/[id]/commission` — Nastaveni provize partnera
- [ ] `GET /api/admin/partners/[id]/commission/history` — Historie provizi

### 3.13 Manager API (7 routes)
- [ ] `GET /api/manager/stats` — Statistiky managera
- [ ] `GET /api/manager/brokers/[id]` — Detail maklere
- [ ] `POST /api/manager/brokers/[id]/deactivate` — Deaktivace
- [ ] `POST /api/manager/brokers/[id]/transfer-vehicles` — Prenos vozidel
- [ ] `GET /api/manager/vehicles/[id]` — Detail vozidla
- [ ] `POST /api/manager/vehicles/[id]/approve` — Schvaleni vozidla
- [ ] `POST /api/manager/bonuses` — Bonusy

### 3.14 Partner API (12 routes)
- [ ] `GET /api/partner/dashboard` — Partner dashboard
- [ ] `GET /api/partner/stats` — Statistiky
- [ ] `GET /api/partner/stats/charts` — Grafy
- [ ] `GET /api/partner/billing` — Fakturace
- [ ] `GET /api/partner/leads` — Leady
- [ ] `GET /api/partner/leads/[id]` — Detail leadu
- [ ] `GET /api/partner/profile` — Profil
- [ ] `GET /api/partner/parts` — Dily
- [ ] `GET /api/partner/vehicles` — Vozidla
- [ ] `GET /api/partner/search` — Vyhledavani
- [ ] `GET /api/partner/orders/[id]/pdf` — PDF objednavky
- [ ] `GET/POST /api/partners` — Seznam/vytvoreni partneru
- [ ] `GET/PATCH /api/partners/[id]` — Detail/editace
- [ ] `POST /api/partners/[id]/activate` — Aktivace
- [ ] `GET /api/partners/[id]/activities` — Aktivity
- [ ] `GET /api/partners/public/[slug]` — Verejny profil
- [ ] `POST /api/partners/create-with-account` — Vytvoreni s uctem

### 3.15 Blog (10 routes)
- [ ] `GET/POST /api/blog/articles` — Clanky
- [ ] `GET/PATCH/DELETE /api/blog/articles/[id]` — Detail/editace
- [ ] `POST /api/blog/articles/[id]/publish` — Publikovani
- [ ] `GET/POST /api/blog/articles/[id]/comments` — Komentare
- [ ] `DELETE /api/blog/articles/[id]/comments/[commentId]` — Smazani komentare
- [ ] `POST /api/blog/articles/[id]/reactions` — Reakce
- [ ] `GET /api/blog/categories` — Kategorie
- [ ] `POST /api/blog/ai-generate` — AI generovani clanku

### 3.16 Search (4 routes)
- [ ] `GET /api/search` — Globalni vyhledavani
- [ ] `GET /api/search/smart` — Chytre vyhledavani (NLP)
- [ ] `GET /api/search/history` — Historie hledani

### 3.17 Profile & Reputation (8 routes)
- [ ] `GET /api/profile/[slug]` — Verejny profil
- [ ] `GET /api/profile/[slug]/items` — Polozky profilu
- [ ] `POST /api/profile/edit` — Editace profilu
- [ ] `POST /api/profile/quick-mode` — Rychly mod
- [ ] `POST /api/profile/tags` — Profilove tagy
- [ ] `GET /api/reputation/[userId]/score` — Trust score
- [ ] `GET /api/reputation/[userId]/tags` — Skill tagy
- [ ] `POST /api/reputation/recalculate` — Prepocet reputace

### 3.18 Other APIs
- [ ] `POST /api/ai/generate-bio` — AI generovani bio
- [ ] `POST /api/assistant/chat` — AI asistent chat
- [ ] `POST /api/assistant/generate-description` — AI popis vozu
- [ ] `POST /api/assistant/price-estimate` — AI odhad ceny
- [ ] `GET /api/ares` — ARES lookup
- [ ] `POST /api/cebia/check` — CEBIA overeni
- [ ] `GET /api/cebia/report/[id]` — CEBIA report
- [ ] `POST /api/contact` — Kontaktni formular
- [ ] `POST /api/sell-request` — Zadost o prodej
- [ ] `POST /api/upload` — Upload souboru
- [ ] `GET /api/uploads/[...path]` — Staticke uploads
- [ ] `POST /api/vin/decode` — VIN dekodovani
- [ ] `POST /api/vin/check-duplicate` — Kontrola duplikatu VIN
- [ ] `GET /api/tecdoc/parts-for-vehicle` — TecDoc dily
- [ ] `GET /api/tecdoc/vin-to-ktype` — TecDoc VIN→KType
- [ ] `GET /api/tags` — Seznam tagu
- [ ] `POST /api/favorites` — Oblibene
- [ ] `POST /api/likes` — Lajky
- [ ] `GET/POST /api/garage` — Garaz
- [ ] `DELETE /api/garage/[id]` — Odebrani z garaze
- [ ] `GET/POST /api/watchdog` — Hllidaci pes
- [ ] `DELETE /api/watchdog/[id]` — Smazani watchdogu
- [ ] `POST /api/watchdog/email` — Watchdog email
- [ ] `GET/POST /api/reservations` — Rezervace
- [ ] `POST /api/reservations/[id]/cancel` — Zruseni rezervace
- [ ] `POST /api/comments` — Komentare
- [ ] `DELETE /api/comments/[id]` — Smazani komentare
- [ ] `GET /api/invitations` — Pozvanky
- [ ] `GET /api/invitations/[token]` — Detail pozvanky
- [ ] `POST /api/newsletter/subscribe` — Newsletter subscribe
- [ ] `GET /api/newsletter/confirm` — Newsletter confirm
- [ ] `POST /api/csp-report` — CSP report
- [ ] `POST /api/sms/opt-out` — SMS opt-out
- [ ] `GET /api/seller-notifications/[token]` — Notifikace prodejce
- [ ] `POST /api/buyer/inquiries` — Dotazy kupce
- [ ] `GET /api/buyer/stats` — Statistiky kupce
- [ ] `GET/POST /api/escalations` — Eskalace
- [ ] `PATCH /api/escalations/[id]` — Editace eskalace
- [ ] `POST /api/part-requests` — Poptavka na dily
- [ ] `POST /api/part-requests/[id]/offer` — Nabidka na poptavku
- [ ] `GET/POST /api/donor-vehicles` — Donor vozidla
- [ ] `GET/PATCH /api/donor-vehicles/[id]` — Detail donor vozidla
- [ ] `POST /api/revalidate/parts` — Revalidace cache dilu
- [ ] `GET /api/shipping/calculate` — Vypocet dopravy
- [ ] `GET /api/shipping/label/[trackingNumber]` — Stitek
- [ ] `GET /api/shipping/zasilkovna-points` — Body Zasilkovny
- [ ] `GET /api/suppliers/[id]/reviews` — Recenze dodavatele
- [ ] `POST /api/suppliers/[id]/review` — Pridat recenzi
- [ ] `GET /api/materials/business-card` — Vizitka
- [ ] `GET /api/materials/email-signature` — Emailovy podpis
- [ ] `GET /api/materials/sales-presentation` — Prezentace

### 3.19 Settings (5 routes)
- [ ] `POST /api/settings/password` — Zmena hesla
- [ ] `POST /api/settings/bank-account` — Bankovni ucet
- [ ] `POST /api/settings/notifications` — Notifikacni pref.
- [ ] `POST /api/settings/export` — Export dat
- [ ] `DELETE /api/settings/delete-account` — Smazani uctu

### 3.20 Email System (4 routes)
- [ ] `GET /api/emails/history/[vehicleId]` — Historie emailu
- [ ] `POST /api/emails/preview` — Nahled emailu
- [ ] `POST /api/emails/send` — Odeslani emailu
- [ ] `GET /api/emails/templates` — Sablony

### 3.21 Onboarding (4 routes)
- [ ] `POST /api/onboarding/profile` — Profil onboarding
- [ ] `POST /api/onboarding/documents` — Dokumenty
- [ ] `POST /api/onboarding/contract` — Smlouva
- [ ] `POST /api/onboarding/quiz` — Kviz

### 3.22 Feeds (XML exports + import)
- [ ] `GET /api/feeds/sauto.xml` — Sauto XML feed
- [ ] `GET /api/feeds/bazos.xml` — Bazos XML feed
- [ ] `GET /api/feeds/tipcars.xml` — TipCars XML feed
- [ ] `GET/POST /api/feeds/import/config` — Import config
- [ ] `GET/PATCH /api/feeds/import/config/[id]` — Detail config
- [ ] `GET /api/feeds/import/logs` — Import logy
- [ ] `POST /api/feeds/import/run` — Spusteni importu

### 3.23 Cron Jobs (12 routes)
- [ ] `GET /api/cron/daily-summary` — Denni shruti
- [ ] `GET /api/cron/exclusive-expiry` — Expirace exkl. smluv
- [ ] `GET /api/cron/feed-import` — Automaticky import feedu
- [ ] `GET /api/cron/listing-expiry` — Expirace inzeratu
- [ ] `GET /api/cron/part-request-expiry` — Expirace poptavek
- [ ] `GET /api/cron/quick-draft-expiry` — Expirace draftu
- [ ] `GET /api/cron/reservation-expiry` — Expirace rezervaci
- [ ] `GET /api/cron/reservation-part-expiry` — Expirace rezervaci dilu
- [ ] `GET /api/cron/sla-check` — SLA kontrola
- [ ] `GET /api/cron/stale-vehicles` — Stara vozidla
- [ ] `GET /api/cron/stock-alerts` — Skladove alerty
- [ ] `GET /api/cron/upsell-check` — Upsell kontrola
- [ ] `GET /api/cron/watchdog-match` — Watchdog shody

---

## 4. HLAVNI FUNKCE A MODULY

### 4.1 Autentizace & autorizace
- [ ] Login (email + heslo)
- [ ] Registrace (dle role: buyer, advertiser, broker, supplier, partner)
- [ ] Zapomenute heslo + reset
- [ ] Overeni emailu (token)
- [ ] Role-based access (11 roli)
- [ ] Middleware route protection (admin, makler, parts, partner, marketplace, muj-ucet)
- [ ] Subdomena routing (inzerce, shop, marketplace)
- [ ] Site password gate (SITE_PASSWORD env)

### 4.2 Vehicle Management (Maklerska sit)
- [ ] VIN dekodovani (vindecoder.eu + NHTSA fallback)
- [ ] 7-krokovy flow nabirani auta (VIN → details → equipment → inspection → photos → pricing → contact → review)
- [ ] 3-krokove rychle nabirani
- [ ] Schvalovani vozidel (admin/manager)
- [ ] Galerie s drag-and-drop
- [ ] EXIF auto-rotace obrazku
- [ ] Exkluzivni smlouva flow (aktivace, expirace, ukonceni, poruseni)
- [ ] Cenove redukce + notifikace
- [ ] Predani vozu (handover)
- [ ] Cenova historie
- [ ] Podobna vozidla
- [ ] Porovnani vozu
- [ ] Vehicle timeline

### 4.3 Inzertni platforma
- [ ] Podani inzeratu (formular + upload obrazku)
- [ ] Katalog s filtry (znacka, model, cena, rok, km, palivo, karoserie)
- [ ] Detail inzeratu
- [ ] Sprava inzeratu (editace, prodlouzeni, deaktivace)
- [ ] Dotazy na inzerat + odpovedi
- [ ] Moderace (admin — schvaleni, nahlasene)
- [ ] Watchdog / hlidaci pes (email notifikace pri shode)
- [ ] XML export feedy (Sauto, Bazos, TipCars)
- [ ] Hromadny import (feed config + automaticky import)
- [ ] Quick filtry

### 4.4 Eshop autodily
- [ ] Katalog dilu s vyhledavanim
- [ ] Detail dilu
- [ ] Kosik + checkout
- [ ] Objednavkovy system (objednavka → subobjednavky → odeslani → doruceni)
- [ ] Sledovani zasilky (tracking token)
- [ ] Vraceni zbozi + reklamace
- [ ] Smart search (NLP)
- [ ] Visual search (AI foto→dil)
- [ ] OEM lookup
- [ ] Autocomplete
- [ ] Porovnani dilu
- [ ] Kompatibilni dily
- [ ] Rezervace dilu
- [ ] Hromadny import (CSV/feed)
- [ ] Donor car flow (cela bouraka → 20-30 dilu)
- [ ] Part request / burza dilu (poptavka → nabidky)
- [ ] Stock notifikace
- [ ] Doprava (Zasilkovna, vypocet)
- [ ] Recenze dodavatelu

### 4.5 Marketplace VIP
- [ ] Landing page + apply formular
- [ ] Role gating (INVESTOR, VERIFIED_DEALER, ADMIN)
- [ ] Dealer dashboard (pridani opportunity, milestones, payout)
- [ ] Investor dashboard (investice, tracking)
- [ ] Sjednoceny detail dealu
- [ ] Vyjednavani (negotiations)
- [ ] Notifikace
- [ ] Schvalovani (admin)
- [ ] Statistiky

### 4.6 Partnersky modul (Bazar/Vrakoviste)
- [ ] Onboarding (profil, dokumenty, schvaleni)
- [ ] Dashboard + statistiky
- [ ] Sprava vozidel/dilu
- [ ] Objednavky + fakturace
- [ ] Leady
- [ ] Zpravy
- [ ] Verejny profil partnera

### 4.7 CRM & Komunikace
- [ ] Kontakty maklere (CRUD + synchronizace)
- [ ] Historie komunikace
- [ ] Lead management (prijem, prirazeni, tracking, SLA)
- [ ] Email system (sablony, personalizace, odeslani z PWA, historie)
- [ ] SMS notifikace + opt-out
- [ ] Notifikacni centrum
- [ ] Seller notifikace (token-based)

### 4.8 Finance & Platby
- [ ] Stripe Checkout (platba za vozy, dily, inzeraty)
- [ ] Stripe Connect (dodavatele)
- [ ] Stripe webhooky
- [ ] Vyplaty makleru (generovani, faktura, schvaleni)
- [ ] Vyplaty prodejcum
- [ ] Komisni kalkulator (5% z ceny, min 25 000 Kc)
- [ ] Broker payout system

### 4.9 Gamifikace & Statistiky
- [ ] Karierni system (STAR_1 → STAR_5)
- [ ] Achievements / badges
- [ ] Bod system (transakce)
- [ ] Leaderboard / zebricek
- [ ] Detailni statistiky maklere
- [ ] Trust score / reputacni system
- [ ] Skill tagy
- [ ] Auto badges

### 4.10 AI funkce
- [ ] AI asistent chat (Claude API)
- [ ] AI generovani popisu vozu
- [ ] AI odhad ceny
- [ ] AI generovani bio
- [ ] AI generovani clanku (blog)

### 4.11 Blog / Magazin
- [ ] Seznam clanku + kategorie
- [ ] Detail clanku
- [ ] Komentare (anonymni + prihlaseni, anti-spam honeypot)
- [ ] Reakce (like/love/etc)
- [ ] AI drafty
- [ ] OG images (dynamic)
- [ ] Clanky makleru (PWA)

### 4.12 SEO & Marketing
- [ ] Sitemap.ts (dynamicky)
- [ ] Robots.ts
- [ ] OG images (dynamic per article)
- [ ] SEO landing pages (znacky, modely, mesta, cenove rozsahy, karoserie)
- [ ] Crosslinking
- [ ] llms.txt
- [ ] Diakritika 301 redirecty (/dily/znacka/*)

### 4.13 PWA & Offline
- [ ] Service Worker (sw.ts)
- [ ] Manifest
- [ ] Offline stranka
- [ ] Background sync (IndexedDB + idb)

### 4.14 Onboarding
- [ ] Makler onboarding (6 kroku: profil, dokumenty, skoleni/kviz, smlouva, schvaleni)
- [ ] Supplier onboarding (3 kroky: profil, dokumenty, schvaleni)
- [ ] Partner onboarding (3 kroky: profil, dokumenty, schvaleni)
- [ ] Tour / pruvodce systemem

---

## 5. TASK-QUEUE.md — PREHLED HOTOVYCH TASKU (42+)

### Vsechny tasky a jejich stav:
| # | Nazev | Stav |
|---|-------|------|
| TASK-001 | UI Component Library | hotovo |
| TASK-002 | Web Layout (Navbar, Footer) | hotovo |
| TASK-003 | Web Homepage | hotovo |
| TASK-004 | Admin Layout | hotovo |
| TASK-005 | Admin Dashboard | hotovo |
| TASK-006 | Admin Tabulky (Makleri, Vozidla) | hotovo |
| TASK-007 | Katalog vozidel (/nabidka) | hotovo |
| TASK-008 | Detail vozu (/nabidka/[slug]) | hotovo |
| TASK-009 | Landing "Chci prodat" | hotovo |
| TASK-010 | Sluzby stranky (Proverka, Financovani, Pojisteni) | hotovo |
| TASK-011 | O nas, Recenze, Kariera, Kontakt | hotovo |
| TASK-012 | Makleri — seznam + profil | hotovo |
| TASK-013 | Auth system (NextAuth.js) | hotovo |
| TASK-014 | Vehicle API — CRUD | hotovo |
| TASK-015 | PWA Setup (layout, dashboard, offline) | hotovo |
| TASK-016 | PWA Nabrat auto (7-krokovy flow) | hotovo |
| TASK-017 | PWA Smlouvy (generovani, podpis) | hotovo |
| TASK-018 | PWA AI Asistent | hotovo |
| TASK-019 | Inzertni platforma | hotovo |
| TASK-020 | Eshop autodily | hotovo |
| TASK-021 | Marketplace VIP | hotovo |
| TASK-022 | Onboarding maklere | hotovo |
| TASK-023 | Manazersky dashboard | hotovo |
| TASK-024 | Lead management | hotovo |
| TASK-025 | Prodejni flow (dotaz → predani) | hotovo |
| TASK-026 | Email system | hotovo |
| TASK-027 | Gamifikace a statistiky | hotovo |
| TASK-028 | UX vylepseni (srovnani, historie, timeline) | hotovo |
| TASK-029 | SMS notifikace + notif. centrum | hotovo |
| TASK-030 | Rychle nabirani (3 kroky) | hotovo |
| TASK-031 | Partnersky modul (CRM, portal, profily) | hotovo |
| TASK-032 | Platebni system (Stripe) | hotovo |
| TASK-033 | Exkluzivni smlouva flow | hotovo |
| TASK-034 | CRM prodejcu | hotovo |
| TASK-035 | Detail vozu v PWA | hotovo |
| TASK-036 | Nastaveni maklere, vyhledavani, eskalace | hotovo |
| TASK-037 | Deployment | hotovo |
| TASK-037b | QA audit + opravy | hotovo |
| TASK-038 | Hluboke funkcni testovani | hotovo |
| TASK-039 | Rozdeleni na subdomeny | hotovo |
| TASK-040 | Brutalni retest cele platformy | hotovo |
| TASK-041 | SEO/GEO/AIEO landing pages | hotovo |
| TASK-042 | PDF sablony a prezentace | hotovo |
| TASK-043 | Blog/Magazin | backlog |
| TASK-NEW-001 | Vehicle Equipment Checkboxes | zpracovava se |
| TASK-NEW-002 | Donor Car Flow (PWA Parts) | zpracovava se |
| TASK-NEW-003 | Blog Rich Text Editor | zpracovava se |
| TASK-NEW-004 | Redirect /auth/prihlasit → /login | zpracovava se |
| TASK-NEW-005 | Marketplace VIP Detail Page | zpracovava se |
| TASK-NEW-006 | Responzivita — Manualni Test | ceka |
| TASK-NEW-007 | TecDoc Setup | ceka na API klice |

---

## 6. AUDIT TEST PLAN — CHECKLIST PRO TESTOVANI

### 6.1 Auth & Security
- [ ] Login s email/heslo → spravny redirect dle role
- [ ] Registrace buyer → email verifikace → login
- [ ] Registrace makler → onboarding flow → ceka na schvaleni
- [ ] Registrace dodavatel → supplier onboarding → schvaleni
- [ ] Registrace partner → partner onboarding → schvaleni
- [ ] Zapomenute heslo → email → reset → login
- [ ] Middleware blokuje neauth pristup na /admin, /makler, /parts, /partner
- [ ] Middleware blokuje spatnou roli (buyer → /admin = redirect)
- [ ] Marketplace gating: neprihlaseny → /marketplace/apply, spatna role → /marketplace?reason=not_authorized
- [ ] SITE_PASSWORD gate funguje (cookie-based)
- [ ] Session expirace a refresh
- [ ] CSRF ochrana (NextAuth)
- [ ] API routes overuji session/role
- [ ] Subdomeny routing funguje spravne

### 6.2 Verejny web — Vizualni & funkcni
- [ ] Homepage: vsechny sekce renderuji, responsive, animace
- [ ] Navbar: sticky, mobilni hamburger, auth stav (prihlasit/odhlasit)
- [ ] Footer: vsechny linky funkci, responzivni
- [ ] Katalog /nabidka: filtry fungji, razeni, pagination, responsive
- [ ] Detail vozu /nabidka/[slug]: galerie, specs, kontakt, podobna, cenova historie
- [ ] Porovnani vozu /nabidka/porovnani
- [ ] SEO landing pages (nahodne 5 zkontrolovat): meta tagy, h1, obsah, crosslinky
- [ ] Makleri seznam + detail profilu
- [ ] Sluzby stranky (proverka, financovani, pojisteni)
- [ ] Informacni stranky (o-nas, kontakt, cenik, jak-to-funguje, kariera, recenze)
- [ ] Pravni stranky (obchodni-podminky, ochrana-udaju, cookies, reklamacni-rad)
- [ ] Blog: seznam, detail, komentare, reakce
- [ ] Chci prodat: formular sell-request
- [ ] Kolik stoji moje auto: AI odhad

### 6.3 Inzertni platforma
- [ ] Landing /inzerce
- [ ] Katalog /inzerce/katalog: filtry, razeni, pagination
- [ ] Pridat inzerat /inzerce/pridat: formular, upload obrazku, preview
- [ ] Moje inzeraty /moje-inzeraty: seznam, editace, prodlouzeni, deaktivace
- [ ] Detail inzeratu /moje-inzeraty/[id]: statistiky, dotazy
- [ ] Dotaz na inzerat + odpoved
- [ ] Watchdog / hlidaci pes: vytvoreni, notifikace
- [ ] Admin moderace inzeratu

### 6.4 Eshop autodily
- [ ] Landing /dily + /shop
- [ ] Katalog /dily/katalog: filtry, vyhledavani, smart search
- [ ] Detail dilu /dily/[slug]
- [ ] Kosik: pridani, odebrani, zmena mnozstvi
- [ ] Checkout: adresa, doprava, platba
- [ ] Potvrzeni objednavky
- [ ] Moje objednavky: seznam, detail, sledovani
- [ ] Vraceni zbozi + reklamace
- [ ] Dily dle znacky/modelu/roku
- [ ] Dily dle kategorie
- [ ] Profil vrakoviste /dily/vrakoviste/[slug]
- [ ] Porovnani dilu
- [ ] Stock notifikace

### 6.5 Marketplace VIP
- [ ] Landing /marketplace: verejne info
- [ ] Apply formular /marketplace/apply
- [ ] Gating: neprihlaseny redirect, spatna role redirect
- [ ] Dealer dashboard: seznam deals, statistiky
- [ ] Nova opportunity: formular, milestones
- [ ] Detail dealu /marketplace/deals/[id]
- [ ] Investor dashboard: seznam investic
- [ ] Investice do dealu
- [ ] Vyjednavani (negotiations)
- [ ] Admin schvalovani deals
- [ ] Notifikace marketplace

### 6.6 PWA Makler
- [ ] Dashboard: stat cards, posledni aktivita, cekajici schvaleni
- [ ] Nabrat auto (7 kroku): VIN → detail → vybava → stav → foto → cena → kontakt → rekapitulace → uspech
- [ ] Rychle nabirani (3 kroky)
- [ ] Vozidla: seznam, detail, editace, handover
- [ ] Smlouvy: seznam, nova, detail, podpis, PDF
- [ ] Provize: prehled, kalkulator
- [ ] Leady: seznam, detail, zmena statusu
- [ ] Zpravy: seznam konverzaci, detail
- [ ] Kontakty CRM: CRUD, komunikace, synchronizace
- [ ] Statistiky: detailni, leaderboard
- [ ] AI asistent: chat, generovani popisu, odhad ceny
- [ ] Materials: vizitka, emailovy podpis, prezentace
- [ ] Blog: clanky maklere, novy clanek
- [ ] Nastaveni: profil, notifikace
- [ ] Onboarding: vsech 6 kroku
- [ ] Offline stranka

### 6.7 PWA Dodavatel dilu
- [ ] Dashboard /parts
- [ ] Pridat dil /parts/new
- [ ] Moje dily /parts/my: seznam, editace
- [ ] Import /parts/import: CSV upload
- [ ] Objednavky /parts/orders: seznam, detail, zmena statusu
- [ ] Donor vozidla /parts/donors: seznam, detail
- [ ] Profil /parts/profile
- [ ] Onboarding: 3 kroky

### 6.8 Partnersky portal
- [ ] Dashboard /partner/dashboard
- [ ] Vozidla: seznam, pridat, detail
- [ ] Dily: seznam, pridat, detail
- [ ] Objednavky: seznam, detail
- [ ] Leady
- [ ] Zpravy
- [ ] Fakturace /partner/billing
- [ ] Statistiky
- [ ] Profil
- [ ] Dokumenty
- [ ] Onboarding: 3 kroky

### 6.9 Admin panel
- [ ] Dashboard: stat cards, grafy, aktivita, schvalovani
- [ ] Vozidla: CRUD, schvalovani, filtrace
- [ ] Makleri: CRUD, aktivace/zamitnuti, filtrace
- [ ] Uzivatele: seznam, editace role/statusu, zmena hesla
- [ ] Inzeraty: moderace, nahlasene
- [ ] Objednavky: prehled, detail
- [ ] Dily: prehled
- [ ] Dodavatele: seznam
- [ ] Vraceni: seznam, zpracovani
- [ ] Platby: prehled
- [ ] Vyplaty: generovani, schvalovani, faktura
- [ ] Leady: seznam, prirazeni, detail
- [ ] Partners: seznam, detail, aktivace, provize
- [ ] Marketplace: applications, schvalovani, prehled deals
- [ ] Blog: clanky, editace, komentare, AI drafty
- [ ] Feedy: konfigurace, import, logy
- [ ] Karriera: levely makleru
- [ ] Notifikace: hromadne odeslani
- [ ] Reviews: moderace
- [ ] Tagy: sprava
- [ ] Tym: sprava clenu
- [ ] Export: data export
- [ ] Profil admina + zmena hesla

### 6.10 Manager sekce
- [ ] Manager dashboard /admin/manager
- [ ] Schvalovani vozidel
- [ ] Sprava makleru (aktivace, deaktivace, transfer)
- [ ] Prenos vozidel
- [ ] Bonusy
- [ ] Notifikace

### 6.11 API validace
- [ ] Vsechny POST/PATCH routes maji Zod validaci
- [ ] Auth check na protected routes
- [ ] Rate limiting
- [ ] Error handling (proper HTTP codes)
- [ ] CORS nastaveni

### 6.12 SEO & Performance
- [ ] Sitemap.ts generuje spravne URL
- [ ] Robots.ts povoluje/blokuje spravne cesty
- [ ] Meta tagy na vsech verejnych strankach
- [ ] OG images generovani
- [ ] Diakritika 301 redirecty
- [ ] Subdomena rewrite v middleware
- [ ] Loading.tsx pro vsechny stranky
- [ ] Error.tsx pro vsechny stranky

### 6.13 Cron joby
- [ ] daily-summary: denni email shruti
- [ ] exclusive-expiry: expirace exkluzivnich smluv
- [ ] feed-import: automaticky import feedu
- [ ] listing-expiry: expirace inzeratu
- [ ] reservation-expiry: expirace rezervaci
- [ ] sla-check: SLA kontrola leadu
- [ ] stale-vehicles: upozorneni na stara vozidla
- [ ] watchdog-match: matchovani watchdogu
- [ ] stock-alerts: skladove alerty
- [ ] upsell-check: upsell kontrola

### 6.14 Responzivita
- [ ] Mobile (375px): vsechny stranky
- [ ] Tablet (768px): vsechny stranky
- [ ] Desktop (1280px+): vsechny stranky
- [ ] PWA mobile-first: dashboard, formulare, seznamy

### 6.15 Datovy model (85 Prisma modelu)
Klicove modely:
- User (11 roli, hierarchie, gamifikace, profil)
- Vehicle (vozidla maklerske site)
- Listing (inzeraty)
- Part (dily)
- Order/SubOrder/OrderItem (objednavky)
- Contract (smlouvy)
- Lead (leady)
- Commission (provize)
- FlipOpportunity/Investment (marketplace)
- Partner (partnersky modul)
- Article (blog)
- DonorVehicle (donor cars)

---

## 7. DOPORUCENY POSTUP AUDITU

### Faze 1: Build & Lint (Kontrolor)
1. `npm run build` — kompiluje se?
2. `npm run lint` — nejake errory?
3. TypeScript errory?

### Faze 2: Smoke test — kazda stranka se nacte
1. Systematicky projet vsechny stranky (275) — HTTP 200?
2. Konzolove errory? Broken imports?
3. Loading/error boundary stranky existuji?

### Faze 3: Funkcni testovani po sekcich
1. Auth flow (registrace, login, reset, overeni)
2. Vehicle flow (nabrat, schvalit, prodat)
3. Inzerce flow (pridat, moderovat, dotaz)
4. Eshop flow (kosik, objednavka, vraceni)
5. Marketplace flow (apply, deal, investice)
6. Partner flow (onboarding, sprava)
7. CRM flow (kontakty, leady, emaily)
8. Finance flow (platby, vyplaty)

### Faze 4: Cross-cutting concerns
1. Responzivita (mobile, tablet, desktop)
2. SEO (meta, sitemap, OG)
3. Security (auth, CSRF, XSS, SQL injection)
4. Performance (loading, caching)
5. Accessibility (keyboard nav, screen reader)
6. PWA (offline, sync, install)

---

*Plan vygenerovan: 2026-05-03*
*Celkovy rozsah: 275 stranek, 293 API routes, 85 DB modelu, 50+ tasku*
