# Audit #208 — Celkové zhodnocení carmakler.cz

**Datum:** 2026-04-11
**Auditor:** planovac (READ-ONLY)
**Commit:** `00f05ac` (HEAD on main)

---

## §0 Codebase v cislech

| Metrika | Hodnota |
|---------|---------|
| LOC (app+components+lib) | ~114 700 |
| Soubory (.ts/.tsx) | 1 073 |
| Pages (page.tsx) | 216 |
| API routes (route.ts) | 201 |
| Components (.tsx) | 245 |
| Prisma modely | 52 |
| Migrace | 9 |
| Seed (prisma/seed.ts) | 2 847 lines |
| loading.tsx | 137 |
| error.tsx | 125 |
| UI komponenty (components/ui/) | 22 |
| E2E spec files | 30 |
| Commity celkem | 121 |
| Commity od 2026-03-01 | 121 (veskera historie) |

---

## §1 Stav 4 produktu

### 1.1 Maklarska sit (CORE produkt)

**Stav: 85% HOTOVO — funkcni MVP, chybi real data + external integrace**

**Co funguje:**
- Homepage (662 lines) s featured cars, brokers, trust scores, statistikami
- Katalog `/nabidka` s filtraci (znacka, model, cena, palivo, lokace)
- 40+ SEO landing pages (znacky, modely, karoserie, cenove rozsahy, mesta)
- Detail vozidla `/nabidka/[slug]` s galerii, parametry, kontaktem
- Porovnani vozidel `/nabidka/porovnani`
- Maklerska PWA (`/makler/`) — dashboard, vehicles, contacts, contracts, leads, messages, stats, leaderboard, provize, settings
- Vehicle wizard (7-step: VIN → details → photos → inspection → pricing → contact → review)
- Quick vehicle entry (3-step zrychleny flow)
- Contract flow s digitalnim podpisem
- Onboarding flow (5 kroku: profil → dokumenty → trening → smlouva → schvaleni)
- AI asistent (komponenta existuje, API route existuje, ale BEZ Anthropic API klice)
- Offline mode (Service Worker + IndexedDB via `idb`)
- Admin panel — dashboard, vehicles, brokers, leads, manager panel (approvals, bonuses, transfers)
- Commission calculator, financing calculator
- Gamification (achievements) system
- Lead management + escalation system
- Seller notifications + communication tracking
- VIN decoder integrace (klientsky kod existuje, bez API klice)
- CEBIA proverka (klientsky kod existuje, bez API klice)

**Co chybi / nefunguje:**
- AI asistent — `ANTHROPIC_API_KEY` neni nastaveny, knowledge-base.ts existuje ale Claude SDK neni v lib/
- Real-time notifikace — Pusher je v tech stacku ale **NENI implementovany** (0 souboru s Pusher importem)
- Cloudinary — upload infrastruktura existuje, `CLOUDINARY_*` env vars prazdne
- SMS notifikace — GoSMS/Twilio implementace v `lib/sms.ts`, ale BEZ API klicu
- Email — Resend integrace v `lib/resend.ts`, ale `RESEND_API_KEY` prazdny
- VIN decoder — `lib/vin-decoder.ts` existuje, `VINDECODER_*` prazdne
- CEBIA — `lib/cebia.ts` existuje, `CEBIA_API_KEY` prazdny
- Analytics — Plausible script neni v layout.tsx, GA4 taky ne
- Sentry — konfigurace v `next.config.ts` ale `SENTRY_*` prazdne
- Skutecna data — v DB jen 11 seed vozidel, 7 seed brokeru, 0 reálných dat

### 1.2 Inzertni platforma

**Stav: 60% HOTOVO — zakladni flow existuje, chybi placeni + feed integrace**

**Co funguje:**
- Landing page `/inzerce` s kategoriemi
- Registrace inzerenta `/inzerce/registrace`
- Pridani inzeratu `/inzerce/pridat` (formular)
- Katalog inzeratu `/inzerce/katalog`
- Moje inzeraty `/moje-inzeraty` (sprava, editace, deaktivace)
- Muj ucet `/muj-ucet` (profil, nastaveni, faktury, heslo)
- Admin panel pro inzeraty `/admin/inzerce`
- Watchdog (notifikace na nove inzeraty matujici kriteria)
- Oblibene vozidla (favorites)
- Feed import system (`lib/feed-import.ts`, `lib/listing-import.ts`) — XML/JSON parsery pro autobazary
- Feed admin `/admin/feeds` (konfigurace, import log)
- Listing promote/extend API (Stripe platby za zvyrazneni)
- SLA system (listing-sla.ts)
- Quick filters (listing-quick-filters.ts)
- Listing flagging (nahlaseni nevhodnych inzeratu)

**Co chybi:**
- Stripe integrace prazdna (platby za zvyrazneni, prodlouzeni)
- Feed import nemá zadny aktivni feed (0 konfigurovanych fedu v DB)
- Subdomenove routovani (`inzerce.carmakler.cz`) pripravene v middleware ale ne aktivni
- 4 seed inzeraty, 0 realnych
- Listing export (Sauto XML feed) — `lib/listing-export.ts` existuje ale neovereny

### 1.3 Eshop autodily

**Stav: 70% HOTOVO — katalog + objednavky fungují, chybí platební a logistický backend**

**Co funguje:**
- Landing page `/dily` se smart search, kategoriemi, benefity
- Katalog `/dily/katalog` s filtry (kategorie, znacka, model, rok, cena, stav)
- 3-segment SEO routing `/dily/znacka/[brand]/[model]/[rok]` (104 SSG pages)
- Diakritika redirect middleware (skoda → škoda 301)
- Detail dilu `/dily/[slug]` s manufacturer, warranty, parametry
- Kategorie `/dily/kategorie/[slug]`
- Vrakoviste profily `/dily/vrakoviste/[slug]`
- Kosik `/dily/kosik` (CartContext, cart.ts)
- Objednavka `/dily/objednavka` + potvrzeni
- Moje objednavky `/dily/moje-objednavky`
- Parts supplier PWA (`/parts/`) — my, new (wizard s foto), profile, import, orders
- Wholesale supplier role + redirect (commit 059f6a2)
- Manufacturer + warranty fields on parts
- Parts feed import system (PartsFeedConfig, PartsFeedImportLog)
- Shipping infrastructure (`lib/shipping/`) — Zasilkovna, DPD, PPL, GLS, Ceska Posta dispatchers
- Order tracking API
- Return/reklamace system (ReturnRequest model, UI at /shop/reklamace, /shop/vraceni-zbozi)

**Co chybi:**
- Stripe checkout prazdny — `STRIPE_*` env vars prazdne, pricemz API routes (`/api/payments/create-checkout`) existuji
- Shipping API klice — vsech 5 dopravcu (Zasilkovna, DPD, PPL, GLS, CP) bez klicu → dry-run mode
- Zasilkovna widget — `NEXT_PUBLIC_ZASILKOVNA_API_KEY` prazdny
- Partner (vrakoviste) system — 0 registrovanych partneru, 0 aktivnich fedu
- Seed data: 11 dilu (3 wholesale TRW/Bosch/Sachs + 8 base), 3 objednavky
- Wolt model provize — logika v `lib/commission-calculator.ts` + partner commission slider, ale 0 partneru na kterych aplikovat

### 1.4 Marketplace VIP

**Stav: 55% HOTOVO — landing + gated dashboardy existuji, chybi transakcni jadro**

**Co funguje:**
- Public landing `/marketplace` s how-it-works, statistiky, CTA
- Apply formular `/marketplace/apply` (registrace dealer/investor)
- Dealer dashboard `/marketplace/dealer` — seznam flip prilezitosti, nova prilezitost
- Dealer detail `/marketplace/dealer/[id]` — detail flip opportunity
- Investor dashboard `/marketplace/investor` — portfolio, investice
- Investor detail `/marketplace/investor/[id]` — detail investice
- Admin marketplace `/admin/marketplace/[id]` — schvalovani
- Role-based middleware gating (VERIFIED_DEALER, INVESTOR, ADMIN)
- Smart redirect pro neauth uzivatele → apply flow s predvyplnenou roli
- FlipOpportunity + Investment Prisma modely
- ProfitCalculator komponenta
- Seed data: 4 flip opportunities, 6 investments, 2 dealers, 3 investors

**Co chybi:**
- 0 marketplace applications (nikdo se neprihlasil)
- Transakcni flow (nakup auta pres firmu Carmakler) — neni implementovany
- Escrow/platby — Stripe existuje ale bez klicu
- Deleni zisku (40/40/20) — model definovany ale bez Stripe implementace
- Komunikace dealer/investor — bez Pusher (real-time neni implementovany)
- Document management (smlouvy, faktury pro investice) — neni
- Due diligence workflow — neni
- KYC/AML — neni
- Minimum investment enforcement — jen v UI (10 000 Kc), ne v API validaci

---

## §2 Infrastruktura a bezpecnost

### Pozitiva
- **CSP headers** — kompletni Content-Security-Policy (zatim report-only mode)
- **Security headers** — X-Frame-Options DENY, HSTS preload, X-Content-Type-Options, Referrer-Policy
- **Middleware auth** — role-based gating na vsech chranenych cestach (admin, makler, parts, marketplace, partner)
- **Zod validace** — input validace na API routes
- **Rate limiting** — `lib/rate-limit.ts` existuje
- **Prisma singleton** — `lib/prisma.ts`
- **Service Worker** — Serwist PWA s offline support
- **Email verification** — soft enforcement flow (overeni-emailu, resend)
- **Password reset** — zapomenute-heslo + reset-hesla flow
- **www redirect** — 301 www.carmakler.cz → carmakler.cz v next.config.ts
- **Subdomain routing** — infrastruktura pro inzerce/shop/marketplace subdomeny pripravena

### Problemy
- **Production za SITE_PASSWORD** (401 na vsechny requesty) — web neni verejne pristupny
- **CSP v report-only** — Report-Only nechrani, jen loguje. Mel by byt enforce mode pred spustenim
- **0 external sluzeb nakonfigurovanych v dev** — .env.local ma jen 3 vars (DB, NextAuth secret, URL)
- **Pusher NENI implementovany** — tech stack rika "Real-time: Pusher" ale 0 kodu
- **Sentry nenakonfigurovany** — error tracking nefunguje
- **Analytics nenakonfigurovane** — Plausible/GA4 env vars prazdne, script neni v layout

---

## §3 SEO stav

### Pozitiva
- Sitemap.ts generuje 100+ URL (staticke + dynamicke z DB)
- 16 znackovych landing pages s AI snippets, FAQ schema, quick facts (GEO optimized)
- 12 modelovych landing pages
- 7 karoseriovych, 5 cenovych, 8 mestskych landing pages
- 104 SSG pages pro dily (znacka/model/rok routing)
- SeoContent Prisma model pro dynamicky generovany SEO obsah
- Canonical URL helper (`lib/canonical.ts`)
- OpenGraph metadata na vsech hlavnich strankach
- Diakritika 301 redirecty (skoda → škoda)
- Breadcrumbs komponenta
- On-demand revalidation API (`/api/revalidate/parts`)

### Problemy
- **robots.txt** — nelze overit (401 na produkci). Pokud chybi nebo zakazuje indexing, SEO je mrtve.
- **Production je za heslem** → Google NEMUZE indexovat. SEO investice (tisice LOC v seo-data.ts) je momentalne k nicemu.
- Sitemap referencuje URL jako `/shop`, `/sluzby/proverka`, `/sluzby/financovani`, `/sluzby/pojisteni`, `/recenze` — nektere mohou byt ghost pages (nutno overit)
- `lib/seo-data.ts` je masivni soubor (~5000+ lines) s hardcoded SEO texty. Nelze updatovat bez deploye.

---

## §4 UX/Design konzistence

### Pozitiva
- Design system s 22 shared UI komponentami (Button, Card, Badge, Modal, Input, Select, etc.)
- Primary color Orange (#F97316) konzistentne
- Outfit font (Google Fonts)
- Mobile-first pristup (responsive)
- Tailwind CSS 4
- Framer Motion animace
- Cookie consent komponenta
- Separate Navbar/Footer pro web vs PWA

### K provereni (beyond scope READ-ONLY auditu)
- Responzivita na ruznych zarizeni — nutny vizualni test
- Dark mode — nenalezen (pravdepodobne neni implementovan)
- A11y (WCAG 2.1 AA) — commit `87cac2f` zminuje accessibility, ale rozsah neoveren
- Loading states konzistence (137 loading.tsx existuji)

---

## §5 DB stav — jen seed data

| Entita | Pocet | Poznamka |
|--------|-------|----------|
| Users | 20 | 10 roli, 7 BROKER, seed-only |
| Vehicles | 12 | 11 ACTIVE, 1 PENDING |
| Parts | 11 | 3 wholesale (TRW/Bosch/Sachs) + 8 base |
| Listings | 4-5 | Seed inzeraty |
| Orders | 3 | Seed objednavky |
| FlipOpportunities | 4 | Seed marketplace |
| Investments | 6 | Seed investice |
| Partners | 0 | Zadne vrakoviste registrovane |
| MarketplaceApplications | 0 | Zadny dealer/investor se neprihlasil |

**Vyznam:** Cely ekosystem bezi na seed datech. Zadny realny uzivatel, zadne realne auto, zadna realna transakce.

---

## §6 External integrace — stav pripravenosti

| Sluzba | Kod existuje | API klic dev | API klic prod | Stav |
|--------|-------------|--------------|---------------|------|
| Stripe | ✅ 13 files | ❌ | ❓ neovereno | Kod hotov, nutno nakonfigurovat |
| Stripe Connect | ✅ 4 API routes | ❌ | ❓ | Onboarding UI + backend hotov |
| Resend (email) | ✅ lib/resend.ts | ❌ | ❓ | Templates existuji |
| Cloudinary | ✅ lib/cloudinary.ts | ❌ | ❓ | Upload logika hotova |
| VIN Decoder | ✅ lib/vin-decoder.ts | ❌ | ❓ | vindecoder.eu + NHTSA |
| CEBIA | ✅ lib/cebia.ts | ❌ | ❓ | B2B API v1 |
| Anthropic AI | ❌ neni v lib/ | ❌ | ❓ | knowledge-base.ts existuje, SDK chybi |
| Pusher | ❌ 0 kodu | ❌ | ❌ | NEIMPLEMENTOVANO |
| Plausible | ✅ v CSP | ❌ | ❓ | Script neni v layout |
| Sentry | ✅ next.config.ts | ❌ | ❓ | Plugin nakonfigurovan |
| GoSMS/Twilio | ✅ lib/sms.ts | ❌ | ❓ | Oba provideri |
| Zasilkovna | ✅ lib/shipping/ | ❌ | ❓ | Widget + API |
| DPD/PPL/GLS/CP | ✅ lib/shipping/ | ❌ | ❓ | 5 dopravcu |

**Verdikt:** Veskery integracni kod existuje, ale v dev prostredi je VSECHNO v dry-run mode (0 API klicu). Stav produkce neoveren (401).

---

## §7 TOP priority pro dalsi praci

Serazeno podle business impact (vyssi = dulezitejsi):

### TIER 1 — BLOCKER pro spusteni (bez tohoto nejde otevrit verejnosti)

| # | Priorita | Popis | Impact | Effort |
|---|----------|-------|--------|--------|
| P1 | **Odstranit SITE_PASSWORD** | Produkce vraci 401 na vsechno. Dokud je heslo, web je neviditelny. | CRITICAL | 5 min |
| P2 | **Nakonfigurovat produkci env vars** | Stripe, Cloudinary, Resend, Sentry, Plausible — bez techto neni web funkcni. | CRITICAL | 2-4h |
| P3 | **CSP z report-only na enforce** | Bezpecnostni dira — zatim jen loguje, nechrani. | HIGH | 30 min |
| P4 | **Realna data / content** | 11 seed aut, 11 seed dilu, 5 inzeratu. Web bude pusobit prazdne. Potreba minimalne 50+ vozidel, 100+ dilu. | CRITICAL | Ongoing |
| P5 | **robots.txt + overit sitemap na produkci** | Pokud robots.txt chybi nebo je spatne, Google neindexuje ani po odstranebi hesla. | HIGH | 30 min |

### TIER 2 — HIGH VALUE (velky business dopad, relativne nizky effort)

| # | Priorita | Popis | Impact | Effort |
|---|----------|-------|--------|--------|
| P6 | **Plausible/GA4 analytics** | Bez analytiky neni mozne merit traffic, konverze, user behavior. Slepota. | HIGH | 1h |
| P7 | **Sentry error tracking** | Bez Sentry se o chybach na produkci dozvite az od uzivatelu. | HIGH | 1h |
| P8 | **Email notifikace (Resend)** | Registrace, overeni emailu, objednavky, kontaktni formulare — vsechno potrebuje email. | HIGH | 2h (konfigurace) |
| P9 | **Cloudinary image upload** | Makler nemuze nahravat fotky aut, supplier nemuze nahravat fotky dilu. Core flow broken. | HIGH | 1h |
| P10 | **Stripe platby** | Eshop objednavky, inzertni promote/extend, marketplace investice — vsechno ceka na Stripe. | HIGH | 4h |

### TIER 3 — MEDIUM VALUE (dulezite pro rust, ale ne pro MVP launch)

| # | Priorita | Popis | Impact | Effort |
|---|----------|-------|--------|--------|
| P11 | **Partner (vrakoviste) onboarding** | 0 partneru. Bez vrakovist neni eshop autodilu funkcni (Wolt model). | MEDIUM | 8h |
| P12 | **Marketplace transakcni jadro** | Escrow, deleni zisku, document management — bez tohoto je marketplace jen prezentace. | MEDIUM | 40h+ |
| P13 | **AI asistent (Claude)** | Diferenciator pro maklere. SDK integrace + knowledge base. | MEDIUM | 8h |
| P14 | **VIN decoder + CEBIA** | Kriticky pro duveryhodnost — overeni historie vozidla. | MEDIUM | 2h (konfig) |
| P15 | **Feed import** | Automaticky import inzeratu z autobazaru. Klicove pro obsah. | MEDIUM | 8h |
| P16 | **Pusher real-time** | Chat makler-klient, live notifikace, auction timer. | MEDIUM | 16h+ |
| P17 | **SMS notifikace** | Alternativni kanal pro urgentni notifikace (lead alert, objednavka). | LOW | 2h (konfig) |

### TIER 4 — NICE TO HAVE

| # | Priorita | Popis |
|---|----------|-------|
| P18 | Dark mode | Neni implementovany |
| P19 | Donor car flow | Plan existuje (#156) ale neni implementovany |
| P20 | Multi-language | Jen cestina |
| P21 | Mobile app (native) | Jen PWA |

---

## §8 Doporuceni — cesta ke spusteni

### Faze A — "Soft launch" (1-2 tydny)

**Cil:** Otevrit web verejnosti s maklerskou siti jako hlavnim produktem.

1. Nakonfigurovat produkci env vars (P2)
2. Odstranit SITE_PASSWORD (P1)
3. Enforce CSP (P3)
4. Zapnout Plausible + Sentry (P6, P7)
5. Nakonfigurovat Resend (P8) + Cloudinary (P9)
6. Overit robots.txt + sitemap (P5)
7. Naseed/nasazdit 50+ realnych vozidel (P4)
8. Manualni smoke test vsech verejnych flows

**Vysledek:** Maklerska sit funkcni, verejny katalog s realnymy auty, SEO indexace zacne.

### Faze B — "Monetizace" (2-4 tydny)

1. Stripe platby (P10) — eshop checkout, inzertni promote
2. Stripe Connect — partner payouts
3. VIN + CEBIA (P14)
4. Partner onboarding (P11) — ziskat 3-5 vrakovist

**Vysledek:** Eshop generuje prijem, inzerce monetizovana, dily maji realne dodavatele.

### Faze C — "Scale" (1-3 mesice)

1. Feed import (P15) — automaticky obsah
2. AI asistent (P13)
3. Marketplace transakcni jadro (P12)
4. Pusher real-time (P16)
5. SMS (P17)

**Vysledek:** Plne funkcni ekosystem 4 produktu.

---

## §9 Rizika a varovani

1. **Jediny vyvojar (AI-driven)** — 121 commitu, vsechny od agentoveho teamu. Zadny human code review mimo agentovy system. Riziko: nizka institutional knowledge, nikdo krome AI nevi proc neco je tak jak je.

2. **Masivni codebase vs 0 realnych uzivatelu** — 115K LOC, 216 pages, 201 API routes ale 0 prodeje, 0 realnych uzivatelu. Riziko: over-engineering pred product-market fit.

3. **Seed-only DB** — Vsechna "data" jsou synteticka. Prvni real uzivatel bude de-facto beta tester.

4. **External sluzby untested na produkci** — Stripe, Cloudinary, Resend, atd. nemaji zadny production track record v tomto projektu. Kazda integrace je "den D" pri zapnuti.

5. **Nema CI/CD pipeline** — Zadny GitHub Actions, zadny automaticky deploy. Manualni 7-step deploy flow (ssh server, pull, migrate, build, pm2).

6. **E2E testy ad-hoc** — 30 spec souboru, ale vetsina jsou jednoucelove chrome-test-NNN.spec.ts svedci predchozich fixu. Chybi stabilni regression suite.

---

## §10 DEEP DIVE — PWA Dily/Vrakoviste vs PWA Partner (Autobazar)

Porovnani s referencnim vzorem **PWA Makler** (46 pages, 96 komponent, kompletni offline-first PWA).

---

### §10.1 PWA Dily / Vrakoviste (`app/(pwa-parts)/parts/*`)

**Route group:** `(pwa-parts)` | **Layout:** SupplierTopBar + SupplierBottomNav + OnlineStatusProvider + OfflineBanner
**Celkem:** 7 pages, 15 komponent

| Stranka | Route | Stav | Poznamka |
|---------|-------|------|----------|
| Dashboard | `/parts` (page.tsx) | **FUNKCNI** | SupplierStats + PendingOrders + CTA "Pridat novy dil" |
| Moje dily | `/parts/my` | **FUNKCNI** | Fetch `/api/parts?limit=100`, filtry (all/ACTIVE/SOLD/INACTIVE), PartCard, link na CSV import |
| Pridat dil (wizard) | `/parts/new` | **FUNKCNI** | 3-step wizard: PhotoStep → DetailsStep (manufacturer, warranty, compatibility, OEM) → PricingStep. POST `/api/parts` |
| CSV import | `/parts/import` | **FUNKCNI** | CsvImport komponenta. Hromadny import dilu |
| Objednavky (list) | `/parts/orders` | **FUNKCNI** | Fetch `/api/orders?role=supplier`, Tabs (Vse/Nove/K odeslani/Aktivni/Dokoncene), OrderCard |
| Objednavka (detail) | `/parts/orders/[id]` | **FUNKCNI** | Full detail: kupujici, polozky, doruceni, platba, poznamka, ShippingLabelCard + OrderActions (status change) |
| Profil | `/parts/profile` | **FUNKCNI** | Session info, SupplierStripeCard (Stripe Connect self-service), verejny profil editor, logout |

**API backend:** Plne pokryty
- `GET/POST /api/parts` — CRUD dilu
- `GET /api/parts/[id]` — detail
- `POST /api/parts/import` — CSV import
- `GET /api/parts/supplier-stats` — statistiky dodavatele
- `GET /api/parts/compatible` — kompatibilni dily
- `GET /api/parts/for-vehicle` — dily pro vozidlo
- `GET /api/orders?role=supplier` — objednavky pro dodavatele
- `GET /api/orders/[id]` — detail objednavky
- `PUT /api/orders/[id]/status` — zmena statusu
- `GET/PUT /api/partner/profile` — profil dodavatele

**Komponenty (15):**
- Layout: `SupplierTopBar.tsx`, `SupplierBottomNav.tsx`
- Dashboard: `SupplierStats.tsx`, `PendingOrders.tsx`
- Parts: `AddPartWizard.tsx`, `PhotoStep.tsx`, `DetailsStep.tsx`, `PricingStep.tsx`, `PartCard.tsx`, `PartFilters.tsx`, `CompatibilitySelector.tsx`
- Orders: `OrderCard.tsx`, `OrderActions.tsx`, `ShippingLabelCard.tsx`
- Profile: `SupplierStripeCard.tsx`
- Shared: `CsvImport.tsx`

**VERDICT: 85% KOMPLETNI — funkcni PWA s plnym CRUD + order management**

**Co chybi vs Makler PWA (reference):**

| Feature | Makler PWA | PWA Dily | Gap |
|---------|-----------|----------|-----|
| Pages count | 46 | 7 | Makler ma 6.5x vic stranek |
| Components | 96 | 15 | Makler ma 6.4x vic komponent |
| Onboarding flow | 5-step (profil→dokumenty→trening→smlouva→schvaleni) | **CHYBI** | Neni onboarding pro noveho dodavatele |
| Offline mode | IndexedDB + background sync | Layout has OfflineBanner | Jen banner, ne full offline CRUD |
| Settings | Notifikace, theme, jazyk | **CHYBI** | Zadne nastaveni |
| Edit existujiciho dilu | N/A | **CHYBI** | Jen pridani noveho, ne editace |
| Smazani dilu | N/A | **CHYBI** | Neni mozne smazat/deaktivovat dil z UI |
| Notifikace push | Firebase/Pusher | **CHYBI** | Zadne push notifikace |
| Galerie fotek dilu | Upload v wizardu | PhotoStep existuje | Ale bez Cloudinary klice = nefunkcni |
| Komunikace s kupujicim | Messages (real-time) | **CHYBI** | Supplier nevi kdo kupil bez kontaktu |
| Shipping label gen | ShippingLabelCard existuje | **EXISTUJE** | Ale shipping API klice prazdne → dry-run |
| Search/sort dilu | N/A | **CHYBI** | Jen zakladni tab filtr (status) |
| Bulk actions | N/A | **CHYBI** | Neni hromadna deaktivace/smazani |
| Dashboard grafy | Charts, trendy | **CHYBI** | Jen StatCards, zadne grafy |
| Gamification | Achievements, leaderboard | **CHYBI** | Zadna motivace pro dodavatele |

**TOP 5 gapu pro PWA Dily:**
1. **Onboarding flow** — novy dodavatel nema jak projit registraci/schvalenim
2. **Edit/delete dilu** — CRUD je jen Create + Read, chybi Update + Delete
3. **Fotky (Cloudinary)** — PhotoStep existuje ale bez API klice
4. **Notifikace o novych objednavkach** — dodavatel se o objednavce dozvi jen kdyz sam refreshne stranku
5. **Komunikace s kupujicim** — zadny messaging

---

### §10.2 PWA Partner / Autobazar (`app/(partner)/partner/*`)

**Route group:** `(partner)` | **Layout:** PartnerLayout (sidebar + mobile hamburger, ne bottom nav)
**Celkem:** 12 pages, 1 komponenta (PartnerLayout.tsx)

| Stranka | Route | Stav | Poznamka |
|---------|-------|------|----------|
| Dashboard | `/partner/dashboard` | **FUNKCNI** | Dual-mode (bazar=vozidla stats, vrakoviste=dily stats). Fetch `/api/partner/dashboard`, recentLeads. |
| Moje vozidla | `/partner/vehicles` | **FUNKCNI** | Fetch `/api/partner/vehicles`, status tabs, paginace, vehicle cards s fotkou + inquiry count |
| Pridat vozidlo | `/partner/vehicles/new` | **FUNKCNI** | Formular (znacka, model, rok, km, cena, palivo, prevodovka, VIN, mesto). POST `/api/partner/vehicles` |
| Moje dily | `/partner/parts` | **FUNKCNI** | Fetch `/api/partner/parts`, paginace, status badge, cena, skladem |
| Pridat dil | `/partner/parts/new` | **FUNKCNI** | Formular (nazev, kategorie, stav, cena, ks, znacka, model, OEM, popis). POST `/api/partner/parts` |
| Objednavky | `/partner/orders` | **FUNKCNI** | Fetch `/api/orders?role=supplier`, status badge, paginace |
| Zajemci (leads) | `/partner/leads` | **FUNKCNI** | Status tabs (Novy→Kontaktovan→Domluveno→Prodano→Nezajem), inline status change, kontaktni udaje |
| Zpravy | `/partner/messages` | **SEMI-FUNKCNI** | Server component, cte z Notification tabulky. Ale pise: "Plna komunikace bude brzy k dispozici." |
| Dokumenty | `/partner/documents` | **PLACEHOLDER** | 3 hardcoded dokumenty (partnerska smlouva, OP, mesicni vyuctovani). PDF linky na `/documents/*.pdf` — PDF soubory pravdepodobne neexistuji. |
| Profil | `/partner/profile` | **FUNKCNI** | Dual-mode (bazar/vrakoviste label). Fetch/PUT `/api/partner/profile`. Oteviraci doba: "Editor bude brzy k dispozici." |
| Statistiky | `/partner/stats` | **FUNKCNI** | Dual-mode: bazar=konverzni funnel (views→leads→sold) + bar chart. Vrakoviste=dily/objednavky stat cards. |
| Vyuctovani | `/partner/billing` | **FUNKCNI** | Fetch `/api/partner/billing`. Revenue/commission/payout stat cards + prodane dily tabulka. |

**API backend:** Plne pokryty (8 route souboru)
- `GET /api/partner/dashboard` — dashboard data
- `GET/PUT /api/partner/profile` — profil partnera
- `GET /api/partner/vehicles` + `POST` — CRUD vozidel
- `GET /api/partner/parts` + `POST` — CRUD dilu
- `GET /api/partner/leads` — zajemci
- `PATCH /api/partner/leads/[id]` — zmena statusu leadu
- `GET /api/partner/stats` — statistiky
- `GET /api/partner/billing` — vyuctovani

**Komponenty (1):**
- `PartnerLayout.tsx` — sidebar nav s dual-mode (bazar vs vrakoviste navigace), mobile hamburger, logout

**VERDICT: 70% KOMPLETNI — solidni desktop-first dashboard, ale chybi klicove PWA vlastnosti**

**Co chybi vs Makler PWA (reference) a vs PWA Dily:**

| Feature | Makler PWA | PWA Dily | PWA Partner | Gap |
|---------|-----------|----------|-------------|-----|
| Layout pattern | TopBar + BottomNav (mobile-first) | TopBar + BottomNav | Sidebar (desktop-first) | **Partner neni mobile-optimized** — sidebar layout je desktop, hamburger je fallback. Makler + Dily maji native BottomNav. |
| Onboarding | 5-step | Chybi | **CHYBI** | Zadny registracni/schvalovaci flow pro partnera |
| Edit vozidla/dilu | Edit page existuje | Chybi | **CHYBI** | Jen pridani, ne editace/smazani |
| Fotky upload | Cloudinary integ | PhotoStep | **CHYBI** | Partner nema foto upload pri pridani vozidla/dilu |
| Offline | Full (IndexedDB) | OfflineBanner | **CHYBI** | Zadny offline support — ani banner |
| Push notifikace | Badge + alert | Chybi | **CHYBI** | Zadne |
| Order detail | N/A | Plny detail + actions | **CHYBI** | Jen list, ne detail objednavky |
| Order status change | N/A | OrderActions | **CHYBI** | Partner nemuze menit status objednavek |
| Shipping | N/A | ShippingLabelCard | **CHYBI** | Partner nema shipping management |
| Komunikace | Messages (list + thread) | Chybi | Notification-only | Jen systemove notifikace, ne real-time chat |
| Stripe Connect | N/A | SupplierStripeCard | **CHYBI** | Partner nema Stripe self-service |
| Registrace partnera | N/A | N/A | **CHYBI** | `/registrace/partner` existuje ale neni propojeny s onboardingem |
| Settings | Notifikace, theme | Chybi | **CHYBI** | Zadne nastaveni |
| Search | GlobalSearch | Chybi | **CHYBI** | Zadne vyhledavani |
| Gamification | Achievements | Chybi | **CHYBI** | Zadna motivace |
| Oteviraci doba | N/A | N/A | "Bude brzy" placeholder | Neni implementovano |
| PDF dokumenty | N/A | N/A | Linky existuji | Realne PDF soubory pravdepodobne neexistuji v /public/documents/ |

**TOP 5 gapu pro PWA Partner:**
1. **Mobile-first layout** — prechod ze sidebar na BottomNav (jako Makler/Dily PWA vzor)
2. **Onboarding flow** — registrace + schvaleni partnera (bazar i vrakoviste)
3. **Foto upload** — pri pridani vozidla/dilu
4. **Order detail + shipping** — prevzit OrderActions + ShippingLabelCard z PWA Dily
5. **Offline support** — minimalne OfflineBanner + OnlineStatusProvider z PWA Dily

---

### §10.3 Porovnavaci matice — 3 PWA

| Dimenze | PWA Makler (reference) | PWA Dily | PWA Partner |
|---------|----------------------|----------|-------------|
| **Pages** | 46 | 7 | 12 |
| **Komponenty** | 96 | 15 | 1 |
| **Layout** | TopBar + BottomNav (mobile) | TopBar + BottomNav (mobile) | Sidebar (desktop) |
| **Offline** | Full (IndexedDB + sync) | OfflineBanner only | Zadny |
| **Onboarding** | 5-step flow | Chybi | Chybi |
| **CRUD** | Full (Create+Read+Update+Delete) | Create+Read only | Create+Read only |
| **Foto upload** | Cloudinary wizard | PhotoStep (bez API klice) | Chybi uplne |
| **Real-time** | Messages (planned) | Chybi | Notification-only |
| **Stripe** | N/A (provize system) | SupplierStripeCard | Chybi |
| **Push notif** | Badge system | Chybi | Chybi |
| **Search** | GlobalSearch | Chybi | Chybi |
| **Settings** | Notif preferences | Chybi | Chybi |
| **Gamification** | Achievements + leaderboard | Chybi | Chybi |
| **Hotovost** | **85%** | **85% (zakladni flow)** | **70% (desktop ok, mobile weak)** |

---

### §10.4 Doporuceny plan dodelani obou PWA

**Faze 1 — Zakladni parity (1 tyden):**

| # | Task | PWA | Effort | Popis |
|---|------|-----|--------|-------|
| D1 | Edit/delete dilu | Dily | 4h | PUT/DELETE `/api/parts/[id]` + edit page + delete button |
| D2 | Edit/delete dilu | Partner | 4h | PUT/DELETE `/api/partner/parts/[id]` + edit page |
| D3 | Edit/delete vozidla | Partner | 4h | PUT/DELETE `/api/partner/vehicles/[id]` + edit page |
| D4 | Order detail + actions | Partner | 3h | Prevzit OrderActions + ShippingLabelCard z PWA Dily |
| D5 | Mobile layout refaktor | Partner | 6h | BottomNav + TopBar misto sidebar (Makler/Dily vzor) |

**Faze 2 — Kriticke features (1-2 tydny):**

| # | Task | PWA | Effort | Popis |
|---|------|-----|--------|-------|
| D6 | Onboarding flow | Obe | 8h | Registrace → verifikace → schvaleni adminem → aktivace |
| D7 | Foto upload (Cloudinary) | Obe | 4h | Cloudinary widget v add part/vehicle formu (zavislost: P9 Cloudinary API klic) |
| D8 | Stripe Connect | Partner | 4h | Prevzit SupplierStripeCard z PWA Dily |
| D9 | Offline support | Partner | 4h | Prevzit OnlineStatusProvider + OfflineBanner z PWA Dily |
| D10 | Settings page | Obe | 3h | Notif preferences, profil nastaveni |

**Faze 3 — Nice to have (2-4 tydny):**

| # | Task | PWA | Effort | Popis |
|---|------|-----|--------|-------|
| D11 | Search | Obe | 4h | Prevzit GlobalSearch z Makler PWA |
| D12 | Push notifikace | Obe | 8h | Novy order/lead notification (zavislost: Pusher nebo Web Push) |
| D13 | Dashboard grafy | Obe | 6h | Trendy, revenue chart, mesicni prehled |
| D14 | Komunikace/chat | Obe | 16h | Kupujici ↔ dodavatel messaging (zavislost: Pusher) |
| D15 | Oteviraci doba editor | Partner | 3h | UI editor + API endpoint |
| D16 | PDF dokumenty | Partner | 2h | Generovani reálnych PDF (smlouva, OP) |

**Celkovy effort odhad:** Faze 1 (~21h) + Faze 2 (~23h) + Faze 3 (~39h) = **~83 hodin** na plnou paritu s Makler PWA.

---

## §11 Celkovy verdikt

**Carmakler je technicky impresivni MVP s solidni architekturou, ale neni pripraveny na real uzivatele.**
**Obe PWA (Dily + Partner) jsou funkcni pro zakladni happy path, ale chybi CRUD Update/Delete, onboarding, foto upload, a partner PWA neni mobile-optimized.**

Silne stranky:
- Komplexni aplikace pokryvajici 4 propojene produkty
- Solidni auth/middleware/role system
- Dobre SEO zaklady (100+ landing pages, structured data)
- PWA offline support
- Security headers + CSP infrastruktura
- Subdomain routing pripraveny

Slabe stranky:
- Vsechno bezi na seed datech
- 0 external sluzeb nakonfigurovanych
- Web je za heslem (neviditelny pro Google i uzivatele)
- Zadne analytics/monitoring
- Chybi CI/CD
- Real-time (Pusher) slibovany ale neexistujici

**Nejdulezitejsi krok:** P1+P2+P4 — otevrit web, nakonfigurovat sluzby, naplnit realnym obsahem. Vsechno ostatni je sekundarni.
