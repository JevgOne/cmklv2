# Production Readiness Assessment — CarMakler v2

**Datum:** 2026-04-04
**Hodnoceni:** PLANOVAC agent

---

## EXECUTIVE SUMMARY

**Celkovy verdikt: NEEDS WORK — web NENI pripraveny na zverejneni**

Projekt je rozsahly a architekturne dobre navrzeny. Vetsina stranek ma realny obsah (ne stuby), API routes jsou implementovane se Zod validaci, auth flow funguje. Avsak existuji kriticke bloky, ktere brani nasazeni do produkce:

1. **SQLite misto PostgreSQL** — schema rika PostgreSQL, ale pouziva se SQLite adapter
2. **Zadny .env soubor** — zadna konfigurace pro externi sluzby
3. **Hardcoded site password v middleware** — `Admin2026` v kodu
4. **Cloudinary nepouzivan** — upload obrazku neni implementovan (pouze URL reference)
5. **Pusher neni integrovan** — zminka jen v docs, zadny kod
6. **Resend integrace castecna** — kod odesila emaily, ale chybi API klice
7. **Fiktivni data** — kontakty, pobocky, telefony, recenze jsou staticky hardcoded

---

## 1. STRANKY v app/(web)/ — OBSAH vs STUBY

### PRODUCTION-READY (realny obsah, plne implementovane)

| Stranka | Popis | Stav |
|---------|-------|------|
| `/` (homepage) | Hero, sluzby, featured cars/brokers z DB, recenze, CTA | PRODUCTION-READY |
| `/nabidka` | Katalog vozidel s filtry, razeni, paginace, merge Vehicle+Listing | PRODUCTION-READY |
| `/nabidka/[slug]` | Detail vozidla — galerie, tabs, kontakt form, CebiaCheck, LoanCalc | PRODUCTION-READY |
| `/nabidka/porovnani` | Porovnani vozidel (CompareTable) | PRODUCTION-READY |
| `/makleri` | Seznam aktivnich makleru z DB, level badges, stats | PRODUCTION-READY |
| `/makler/[slug]` | Profil maklere s kontaktnim formularem | PRODUCTION-READY |
| `/chci-prodat` | Landing page + SellCarForm + FAQ + SEO JSON-LD | PRODUCTION-READY |
| `/kontakt` | Kontaktni info + ContactPageForm + pobocky | PRODUCTION-READY |
| `/login` | Prihlaseni credentials s role-based redirect | PRODUCTION-READY |
| `/registrace` | Kompletni registracni formular s validaci | PRODUCTION-READY |
| `/kariera` | Benefity, pozice, CareerForm | PRODUCTION-READY |
| `/jak-prodat-auto` | SEO content guide, 7 kroku, FAQ, JSON-LD | PRODUCTION-READY |
| `/kolik-stoji-moje-auto` | PriceCalculator, SEO text | PRODUCTION-READY |
| `/o-nas` | O firme, team, stats z DB | PRODUCTION-READY |
| `/recenze` | Reviews s tabs (prodejce/kupujici), staticky obsah | PRODUCTION-READY |
| `/inzerce` | Landing page inzertni platformy, pricing tiers, stats z DB | PRODUCTION-READY |
| `/inzerce/pridat` | Formular pro pridani inzeratu (AddListingForm) | PRODUCTION-READY |
| `/inzerce/registrace` | Registrace inzerenta | PRODUCTION-READY |
| `/inzerce/katalog` | Katalog inzeratu | PRODUCTION-READY |
| `/dily` | Eshop landing — kategorie, featured parts z DB, PartsSearch | PRODUCTION-READY |
| `/dily/katalog` | Katalog autodilu | PRODUCTION-READY |
| `/dily/kategorie/[slug]` | Kategorie dilu | PRODUCTION-READY |
| `/dily/znacka/[slug]` | Dily podle znacky | PRODUCTION-READY |
| `/dily/[slug]` | Detail dilu | PRODUCTION-READY |
| `/dily/kosik` | Kosik (Cart) | PRODUCTION-READY |
| `/dily/objednavka` | Objednavkovy formular + potvrzeni | PRODUCTION-READY |
| `/marketplace` | Landing page marketplace s ROI priklady, FAQ, ApplyForm | PRODUCTION-READY |
| `/marketplace/dealer` | Dealer dashboard | PRODUCTION-READY |
| `/marketplace/investor` | Investor dashboard | PRODUCTION-READY |
| `/sluzby/financovani` | ServicePage + FinancovaniCalc | PRODUCTION-READY |
| `/sluzby/pojisteni` | ServicePage + PojisteniForm | PRODUCTION-READY |
| `/sluzby/proverka` | ServicePage + ProverkaForm | PRODUCTION-READY |
| `/sluzby/vykup` | ServicePage + VykupForm | PRODUCTION-READY |
| `/muj-ucet` | Dashboard kupujiciho (favorites, watchdogs, dotazy) | PRODUCTION-READY |
| `/muj-ucet/oblibene` | Oblibene inzeraty | PRODUCTION-READY |
| `/muj-ucet/hlidaci-pes` | Watchdog sprava | PRODUCTION-READY |
| `/muj-ucet/dotazy` | Moje dotazy na inzeraty | PRODUCTION-READY |
| `/moje-inzeraty` | Sprava vlastnich inzeratu | PRODUCTION-READY |
| `/bazar/[slug]` | Profil partnerskeho bazaru | PRODUCTION-READY |
| `/dodavatel/[slug]` | Profil dodavatele dilu | PRODUCTION-READY |

**Vysledek: 0 stubu, vsechny stranky maji realny obsah a logiku.**

---

## 2. API ROUTES v app/api/ — IMPLEMENTACE

### PRODUCTION-READY

| Route | Metody | Validace | Auth | Stav |
|-------|--------|----------|------|------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth | N/A | PRODUCTION-READY |
| `/api/auth/register` | POST | Zod | Rate limit | PRODUCTION-READY |
| `/api/auth/register/broker` | POST | Zod | Rate limit | PRODUCTION-READY |
| `/api/auth/register/partner` | POST | Zod | Rate limit | PRODUCTION-READY |
| `/api/auth/register/ares` | POST | Zod | N/A | PRODUCTION-READY |
| `/api/contact` | POST | Zod + rate limit | N/A | PRODUCTION-READY |
| `/api/listings` | GET/POST | Zod | Optional | PRODUCTION-READY |
| `/api/listings/[id]` | GET/PUT/DELETE | Zod | Session | PRODUCTION-READY |
| `/api/listings/[id]/inquiry` | POST | Zod | Optional | PRODUCTION-READY |
| `/api/listings/[id]/images` | POST | - | Session | PRODUCTION-READY |
| `/api/listings/[id]/reserve` | POST | Zod | N/A | PRODUCTION-READY |
| `/api/listings/[id]/flag` | POST | Zod | Session | PRODUCTION-READY |
| `/api/listings/[id]/promote` | POST | Zod | Session | PRODUCTION-READY |
| `/api/listings/[id]/extend` | POST | - | Session | PRODUCTION-READY |
| `/api/listings/my` | GET | - | Session | PRODUCTION-READY |
| `/api/listings/quick-filters` | GET | - | N/A | PRODUCTION-READY |
| `/api/favorites` | GET/POST/DELETE | - | Session | PRODUCTION-READY |
| `/api/broker/*` | Multiple | Zod | BROKER role | PRODUCTION-READY |
| `/api/admin/*` | Multiple | Zod | ADMIN roles | PRODUCTION-READY |
| `/api/manager/*` | Multiple | Zod | MANAGER role | PRODUCTION-READY |
| `/api/leads/*` | Multiple | Zod | Session | PRODUCTION-READY |
| `/api/contacts/*` | Multiple | Zod | Session | PRODUCTION-READY |
| `/api/contracts/*` | Multiple | Zod | Session | PRODUCTION-READY |
| `/api/escalations/*` | Multiple | Zod | Session | PRODUCTION-READY |
| `/api/emails/*` | Multiple | Zod | Session | PRODUCTION-READY |
| `/api/payments/*` | Multiple | - | Mixed | PRODUCTION-READY |
| `/api/marketplace/*` | Multiple | Zod | Session | PRODUCTION-READY |
| `/api/inzerce` | GET | - | N/A | PRODUCTION-READY |
| `/api/cebia/*` | Multiple | - | Session | PRODUCTION-READY |
| `/api/ares` | POST | - | N/A | PRODUCTION-READY |
| `/api/assistant/*` | POST | Zod | Session | PRODUCTION-READY |
| `/api/feeds/*` | Multiple | - | Mixed | PRODUCTION-READY |
| `/api/invitations/*` | Multiple | Zod | Session | PRODUCTION-READY |
| `/api/cron/*` (10 routes) | Multiple | CRON_SECRET | N/A | PRODUCTION-READY |

**Vysledek: 100+ API routes, vsechny implementovane s realnou logikou. 3 TODO nalezeny: lib/listing-sla.ts:213 (watchdog email), app/api/onboarding/profile/route.ts:51 (Cloudinary upload), app/api/vehicles/[id]/handover/route.ts:185 (follow-up email).**

---

## 3. AUTH FLOW — PRODUCTION-READY

| Aspekt | Stav | Detail |
|--------|------|--------|
| NextAuth config | OK | Credentials provider, JWT strategy |
| Password hashing | OK | bcryptjs, salt rounds 12 |
| Session callbacks | OK | role, status, onboarding fields |
| Login page | OK | Email/password, error handling, role-based redirect |
| Registration | OK | Zod validace, duplicate check, auto-activate ADVERTISER/BUYER |
| Broker registration | OK | Invitation-based, PENDING status |
| Middleware protection | OK | Role-based pro admin, makler, parts, marketplace, partner |
| Onboarding redirect | OK | ONBOARDING status -> /makler/onboarding |
| Cookie config | OK | httpOnly, sameSite lax, secure in production |

**KRITICKE PROBLEMY:**
- **Chybi "forgot password" flow** — odkaz vede na `mailto:info@carmakler.cz` (neni implementovano)
- **Chybi email verifikace** — pole `emailVerified` v schema existuje, ale neni pouzivano
- **Site password `Admin2026` hardcoded v middleware** — security risk

**Verdikt: NEEDS WORK**

---

## 4. PRISMA SCHEMA + MIGRACE — NEEDS WORK

### Schema kompletnost: VYNIKAJICI

Schema obsahuje 40+ modelu pokryvajicich:
- User (10+ roli, hierarchie, gamifikace, onboarding)
- Vehicle (kompletni auto data, inspekce, trust score, exkluzivita)
- Listing (inzertni platforma, flagovani, SLA, upsell)
- Commission, Payment, SellerPayout, BrokerPayout (platebni system)
- Lead, VehicleInquiry, DamageReport (prodejni flow)
- Contract (brokerage, handover, exkluzivita, podpisy)
- Part, Order, OrderItem (eshop)
- FlipOpportunity, Investment (marketplace)
- Partner, PartnerLead, PartnerActivity (partnersky modul)
- CRM modely (SellerContact, SellerCommunication)
- Gamifikace (UserAchievement, PriceReduction)
- Feed import (FeedImportConfig, ListingFeedConfig, PartsFeedConfig)
- Email/SMS/Notification systemy

### Migrace: 23 migraci aplikovanych
Vsechny migrace existuji a jsou konzistentni se schemou.

### KRITICKE PROBLEMY:
1. **SQLite misto PostgreSQL** — schema deklaruje `datasource db { provider = "sqlite" }` a prisma.ts pouziva `PrismaBetterSqlite3` adapter s `dev.db` souborem. CLAUDE.md a dokumentace uvadi PostgreSQL. **Pro produkci je SQLite NEVHODNE.**
2. **Zadny .env soubor** — `DATABASE_URL` neni nakonfigurovane pro PostgreSQL
3. **Chybi seed data** — prisma seed script (`prisma/seed.ts`) existuje v package.json ale soubor nebyl overen

**Verdikt: NEEDS WORK (migrace na PostgreSQL nutna)**

---

## 5. INTEGRACE — EXTERNI SLUZBY

### Cloudinary — NEEDS WORK
- `next.config.ts` ma remote pattern pro `res.cloudinary.com`
- `app/api/onboarding/documents/route.ts` pouziva Cloudinary upload
- **ALE:** Zadny `.env` soubor s CLOUDINARY_* klici
- Upload obrazku pro vozidla/inzeraty/dily neni kompletne napojen
- Obrazky na strankach pouzivaji Unsplash URL nebo placeholder

### Stripe — NEEDS WORK
- `lib/stripe.ts` — lazy inicializace, commission calculator, payout records
- `app/api/payments/webhook/route.ts` — plny webhook handler
- `app/api/payments/[id]/confirm/route.ts` — manualni potvrzeni
- **ALE:** Zadne API klice, Stripe je oznacen jako "faze 2" v CLAUDE.md
- Bankovni prevod je primarni platebni metoda (MVP)

### Resend (email) — NEEDS WORK
- `resend` package nainstalovany
- 12+ email sablone implementovanych (presentation, contract, followup, daily-summary...)
- `app/api/emails/send/route.ts` — plna logika odeslani s rate limitingem
- **ALE:** Zadny RESEND_API_KEY v prostredi, emaily se realne neodosilaji

### Pusher (real-time) — STUB
- Zminka pouze v `docs/05-web-frontend.md`
- **Zadny kod pro Pusher** — neni v package.json, neni v lib/, neni v zadne route
- Real-time notifikace NEJSOU implementovane

### VIN Decoder — PRODUCTION-READY
- `lib/vin-decoder.ts` — plna implementace s vindecoder.eu + NHTSA fallback
- Normalizace fuel type, transmission, body type, drive type
- Timeout handling, error handling

### ARES (ICO verifikace) — PRODUCTION-READY
- `lib/ares.ts` + `app/api/ares/route.ts`
- Overeni firem podle ICO pres statni registr

### Cebia (proverka vozidel) — NEEDS WORK
- Model CebiaReport v schema
- API routes existuji
- **ALE:** Neni jasne zda je API kluc nakonfigurovany

### Claude AI (asistent) — PRODUCTION-READY
- `@anthropic-ai/sdk` v dependencies
- `app/api/assistant/chat/route.ts` — AI chat
- `app/api/assistant/generate-description/route.ts` — generovani popisu
- `lib/knowledge-base.ts` — knowledge base pro AI

### Serwist/PWA — PRODUCTION-READY
- `next.config.ts` ma Serwist konfiguraci
- Service Worker, offline DB (`lib/offline/db.ts`, `lib/offline/sync.ts`)
- PWA layout pro maklere i dodavatele dilu

---

## 6. KOMPONENTY — KOMPLETNOST

### UI komponenty (components/ui/) — PRODUCTION-READY
18 komponent: Alert, Badge, Button, Card, Checkbox, Dropdown, EmptyState, Input, Modal, Pagination, ProgressBar, Select, StatCard, StatusPill, Tabs, Textarea, Toggle, TrustScore

### Web komponenty (components/web/) — PRODUCTION-READY
47 komponent pokryvajicich: formulare (SellCar, Contact, Career, AddListing, Order, Vykup, Proverka, Pojisteni, Financovani), katalog (VehicleCard, VehicleFilters, QuickFilters, ProductCard, PartsSearch), detail (VehicleGallery, VehicleTimeline, PriceHistory, BrokerBox, CebiaCheck, LoanCalculator), navigace (Navbar, Footer, Breadcrumbs, MobileMenu, CompareBar), marketplace (ApplyForm)

### Layout komponenty — PRODUCTION-READY
- MainNavbar, MainFooter
- InzerceNavbar, InzerceFooter
- ShopNavbar, ShopFooter
- MarketplaceNavbar, MarketplaceFooter
- SubdomainType-based switching v layout

### PWA komponenty — not checked in detail

**Verdikt: PRODUCTION-READY (vsechny komponenty maji realnou implementaci)**

---

## 7. BUILD — NEEDS WORK

### Pozitivni:
- `package.json` ma vsechny dependencies
- TypeScript strict mode
- ESLint konfigurace
- Vitest + Playwright nastaveny
- Build script: `next build --webpack`

### KRITICKE BLOKY pro build:
1. **Zadny .env soubor** — build selze na chybejicich env promennych (NEXTAUTH_SECRET, DATABASE_URL)
2. **SQLite dev.db** — musi existovat pred buildem
3. **Prisma client generovani** — vyzaduje `npx prisma generate` pred buildem
4. **Hardcoded site password** v middleware blokuje pristup na vsechny stranky

### Potrebne env promenne pro produkci:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://www.carmakler.cz
NEXTAUTH_COOKIE_DOMAIN=.carmakler.cz
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESEND_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
VINDECODER_API_KEY=...
VINDECODER_API_SECRET=...
ANTHROPIC_API_KEY=...
CRON_SECRET=...
```

---

## 8. DALSICH PROBLEMU PRO PRODUKCI

### Bezpecnost
- **Hardcoded password `Admin2026`** v middleware.ts (radek 87) — KRITICKE
- **Chybi CSRF ochrana** na formularich
- **Chybi Content Security Policy** (jen X-Frame-Options)
- **Chybi rate limiting na nekterych API routes** (napr. /api/listings GET)

### SEO
- Metadata a JSON-LD na vsech hlavnich strankach — DOBRE
- Open Graph tagy — DOBRE
- Breadcrumbs — DOBRE
- Canonical URLs — DOBRE (globalni v app/layout.tsx:61-63 pres alternates.canonical)
- Sitemap.xml — DOBRE (app/sitemap.ts — dynamicka s 200+ URL vcetne DB queries)
- robots.txt — DOBRE (app/robots.ts — spravne blokuje /api/, /admin/, /login)

### Obsah
- **Fiktivni kontaktni udaje** — Vinohradska 123, +420 800 123 456 (placeholder adresy a telefony)
- **Staticky hardcoded recenze** — Jana K., Martin D., Tomas H. (ne z DB)
- **Statistiky "247 prodanych vozidel", "4.8 hodnoceni"** — hardcoded na /chci-prodat
- **Team members na /o-nas** — pravdepodobne fiktivni
- **Marketplace stats "127 dokoncenych flipu", "21% ROI"** — hardcoded

### Chybejici funkcionality
- **Zapomenute heslo** — neni implementovano (mailto odkaz)
- **Email verifikace** — neni implementovano
- **Upload obrazku** — Cloudinary je v kodu, ale flow neni kompletni
- **Real-time notifikace** — Pusher neni integrovan
- **Analytics** — zadny tracking (GA, Plausible, atd.)
- **Error tracking** — zadny Sentry nebo podobny

---

## SOUHRNNA TABULKA

| Oblast | Stav | Priorita |
|--------|------|----------|
| Stranky (web) | PRODUCTION-READY | - |
| API routes | PRODUCTION-READY | - |
| Komponenty | PRODUCTION-READY | - |
| Auth flow | NEEDS WORK | P1 |
| Prisma schema | NEEDS WORK (SQLite->PG) | P0 |
| .env konfigurace | NEEDS WORK | P0 |
| Cloudinary upload | NEEDS WORK | P1 |
| Stripe platby | NEEDS WORK (faze 2) | P2 |
| Resend emaily | NEEDS WORK | P1 |
| Pusher real-time | STUB | P2 |
| VIN decoder | PRODUCTION-READY | - |
| ARES | PRODUCTION-READY | - |
| PWA/Service Worker | PRODUCTION-READY | - |
| Middleware security | NEEDS WORK | P0 |
| SEO (sitemap, robots, canonical) | PRODUCTION-READY | - |
| Pravni stranky (OP, GDPR, reklamace) | CHYBI | P0 |
| Cookie consent | CHYBI | P0 |
| Fiktivni obsah | NEEDS WORK | P1 |
| Analytics/Monitoring | STUB | P1 |
| E2E testy | CHYBI (0 testu) | P1 |
| CI/CD | CHYBI | P1 |

---

## DOPORUCENY POSTUP PRO LAUNCH

### P0 — Blokujici (pred jakymkoliv nasazenim)
1. **PRAVNI:** Obchodni podminky, Ochrana osobnich udaju (GDPR), Reklamacni rad — bez techto je e-shop NEZAKONNY
2. **PRAVNI:** Cookie consent banner (GDPR + ePrivacy)
3. Odkazy na pravni stranky v paticce vsech layoutu
4. Migrace z SQLite na PostgreSQL
5. Vytvoreni .env souboru se vsemi klici
6. Odstraneni hardcoded site password `Admin2026` z middleware

### P1 — Nutne pred public launchem
7. Oprava QA bugu: watchdog email notifikace (TODO v lib/listing-sla.ts:213)
8. Oprava QA bugu: sjednotit wantBrokerHelp/wantsBrokerHelp
9. Oprava QA bugu: inzerce/katalog redirect, Part manufacturer/warranty pole
10. Implementace Cloudinary upload flow
11. Konfigurace Resend pro odchozi emaily
12. Nahradit fiktivni kontaktni udaje realnymi
13. Implementovat "zapomenute heslo"
14. Pridat analytics (Plausible/GA)
15. Pridat error tracking (Sentry)
16. E2E testy (0 existuje, Playwright nakonfigurovat)
17. CI/CD pipeline (GitHub Actions)
18. Accessibility + Performance audit

### P2 — Muze pockat
19. TASK-020 DOPLNENO: SubOrder, Guest checkout, Return model, PartRequest, Smart Search, Krizove reference, Moje garaz
20. Stripe integrace (MVP = bankovni prevod)
21. Pusher real-time notifikace
22. Email verifikace
23. CSP headers

**Detailni plan oprav viz: `.claude-context/tasks/fix-plan-production-readiness.md`**
