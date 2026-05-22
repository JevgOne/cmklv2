# Kompletni analyza projektu Carmakler

**Datum:** 2026-04-05
**Autor:** Planovac (agent team)
**Status:** Hotovo

---

## 1. Prehled struktury projektu

### Route Groups (App Router)
| Skupina | Ucel | Pocet stranek |
|---------|-------|--------------|
| `app/(web)/` | Verejny web — katalog, sluzby, landing pages | ~100+ stranek |
| `app/(pwa)/makler/` | PWA pro maklere — dashboard, vozidla, smlouvy, leady | 45 stranek |
| `app/(pwa-parts)/parts/` | PWA pro dodavatele dilu — katalog, objednavky | 7 stranek |
| `app/(admin)/admin/` | BackOffice admin panel | 24 stranek |
| `app/(partner)/partner/` | Partnersky modul (bazary, vrakoviste) | 12 stranek |
| `app/prezentace/` | Prezentacni stranka | 1 stranka |
| `app/api/` | API routes | 100+ endpointu |

### Tech Stack (overeno z package.json)
- Next.js **16.1.7** (App Router) + React **19.2.3**
- Prisma **7.5.0** + PostgreSQL
- Tailwind CSS 4 + Outfit font
- NextAuth.js 4.24 (role-based auth)
- Serwist 9.5.7 (PWA/Service Worker)
- Stripe 20.4.1 (platby)
- Zod 4.3.6 (validace)
- Sentry 10.47 (error tracking)
- Resend 6.9.4 (emaily)
- Claude API (AI asistent)
- Playwright 1.59 (E2E testy)
- Vitest 4.1 (unit testy)

---

## 2. Stav 4 produktu

### 2.1 Maklersksa sit (HLAVNI PRODUKT) — KOMPLETNI ✅
**Stranky:**
- ✅ Dashboard (`/makler/dashboard`)
- ✅ Vozidla — seznam, detail, editace, nove vozidlo (8-krokovy wizard + quick mode)
- ✅ Smlouvy — seznam, nova, detail, podpis
- ✅ Kontakty/CRM — seznam, detail, novy
- ✅ Leady — seznam, detail
- ✅ Zpravy/dotazy — seznam, detail
- ✅ Provize a komisiony
- ✅ Statistiky
- ✅ Leaderboard + gamifikace
- ✅ Onboarding (5 kroku: profil, skoleni, dokumenty, smlouva, schvaleni)
- ✅ Profil, nastaveni, notifikace
- ✅ Offline mode stranka
- ✅ Financni kalkulacka

**API routes:**
- ✅ `/api/vehicles/` — CRUD, status, obrazky, inspekce, rezervace, handover
- ✅ `/api/broker/` — profil, statistiky, provize, leaderboard, notifikace
- ✅ `/api/contracts/` — CRUD, podpis, PDF, odeslani
- ✅ `/api/contacts/` — CRUD, komunikace, vyhledavani, sync
- ✅ `/api/leads/` — CRUD, prirazeni, status, externi
- ✅ `/api/assistant/` — AI chat, generovani popisu
- ✅ `/api/onboarding/` — profil, dokumenty, kviz, smlouva
- ✅ `/api/escalations/` — CRUD
- ✅ `/api/emails/` — odeslani, historie, sablony, nahled

**Hodnoceni:** 95% hotovo. Plne funkcni maklersky workflow.

---

### 2.2 Inzertni platforma — KOMPLETNI ✅
**Stranky:**
- ✅ Landing `/inzerce`
- ✅ Katalog `/inzerce/katalog`
- ✅ Pridat inzerat `/inzerce/pridat` (6-krokovy wizard)
- ✅ Registrace inzerenta `/inzerce/registrace`
- ✅ Moje inzeraty `/moje-inzeraty` + detail
- ✅ Detail nabidky `/nabidka/[slug]`
- ✅ Platba + uspech `/nabidka/[slug]/platba`
- ✅ Porovnani `/nabidka/porovnani`
- ✅ SEO landing pages — znacky, modely, mesta, cenove rozsahy, typy karoserie (~50 stranek)
- ✅ Hlidaci pes `/muj-ucet/hlidaci-pes`
- ✅ Oblibene `/muj-ucet/oblibene`
- ✅ Dotazy `/muj-ucet/dotazy`

**API routes:**
- ✅ `/api/listings/` — CRUD, obrazky, dotazy, flagovani, promovani, prodluzeni, rezervace
- ✅ `/api/watchdog/` — CRUD, emailovy watchdog
- ✅ `/api/favorites/` — toggle
- ✅ `/api/inzerce/` — podani inzeratu
- ✅ `/api/feeds/` — XML exporty (Sauto, TipCars, Bazos), import config
- ✅ `/api/cebia/` — overeni VIN

**Cron joby:**
- ✅ listing-expiry, reservation-expiry, sla-check, upsell-check, watchdog-match, feed-import

**Hodnoceni:** 95% hotovo. Kompletni inzertni flow.

---

### 2.3 Eshop autodily — KOMPLETNI ✅
**Stranky:**
- ✅ Landing `/dily` + `/shop`
- ✅ Katalog `/dily/katalog` + `/shop/katalog`
- ✅ Detail dilu `/dily/[slug]` + `/shop/produkt/[slug]`
- ✅ Kategorie `/dily/kategorie/[slug]`
- ✅ Znacka `/dily/znacka/[slug]`
- ✅ Kosik `/dily/kosik` + `/shop/kosik`
- ✅ Objednavka `/dily/objednavka` + `/shop/objednavka`
- ✅ Potvrzeni objednavky
- ✅ Moje objednavky + vraceni + reklamace
- ✅ Sledovani objednavky (guest token) `/shop/objednavky/sledovani/[token]`
- ✅ Dodavatel profil `/dodavatel/[slug]`

**PWA dodavatele:**
- ✅ Dashboard `/parts`
- ✅ Moje dily `/parts/my`
- ✅ Novy dil `/parts/new`
- ✅ Import dilu `/parts/import`
- ✅ Objednavky `/parts/orders` + detail
- ✅ Profil `/parts/profile`

**API routes:**
- ✅ `/api/parts/` — CRUD, for-vehicle, import
- ✅ `/api/orders/` — CRUD, status, vraceni
- ✅ `/api/admin/returns/` — sprava reklamaci

**Hodnoceni:** 90% hotovo. Funkcni eshop s objednavkami.

---

### 2.4 Marketplace (VIP investicni platforma) — KOMPLETNI ✅
**Stranky:**
- ✅ Landing `/marketplace`
- ✅ Dealer dashboard `/marketplace/dealer`
- ✅ Nova prilezitost `/marketplace/dealer/nova`
- ✅ Detail prilezitosti `/marketplace/dealer/[id]`
- ✅ Investor dashboard `/marketplace/investor`
- ✅ Detail investice `/marketplace/investor/[id]`

**API routes:**
- ✅ `/api/marketplace/opportunities/` — CRUD, schvaleni, vyplata
- ✅ `/api/marketplace/investments/` — CRUD, potvrzeni platby
- ✅ `/api/marketplace/apply/` — zadost o pristup
- ✅ `/api/marketplace/stats/` — statistiky

**Admin:**
- ✅ `/admin/marketplace` — sprava prilezitosti + detail

**Hodnoceni:** 90% hotovo. Zakladni investment flow existuje.

---

## 3. Chybejici loading.tsx / error.tsx

### ❌ Stranky BEZ loading.tsx:
| Stranka | Chybi |
|---------|-------|
| `app/(web)/nabidka/{znacka}/{model}/` | ~25 brand/model SEO stranek (audi/a4, bmw/3-series, ...) |
| `app/(web)/nabidka/{mesto}/` | ~10 city SEO stranek (praha, brno, ostrava, ...) |
| `app/(web)/nabidka/{cena}/` | 5 price range stranek (do-100000, do-200000, ...) |
| `app/(web)/nabidka/{typ}/` | ~8 type stranek (suv, sedan, hatchback, ...) |
| `app/(web)/nabidka/[slug]/platba/uspech/` | Loading chybi |
| `app/(web)/dily/[slug]/` | Detail dilu — loading chybi |
| `app/(web)/dily/kosik/` | Kosik dily — loading chybi |
| `app/(web)/dily/objednavka/` | Objednavka — loading chybi |
| `app/(web)/dily/objednavka/potvrzeni/` | Potvrzeni — loading chybi |
| `app/(web)/dily/moje-objednavky/` | Objednavky — loading chybi |
| `app/(web)/shop/produkt/[slug]/` | Produkt detail — loading chybi |
| `app/(web)/shop/moje-objednavky/[id]/vraceni/` | Vraceni — loading chybi |
| `app/(web)/shop/moje-objednavky/[id]/reklamace/` | Reklamace — loading chybi |
| `app/(web)/bazar/[slug]/` | Ma loading ✅ |
| `app/(web)/dodavatel/[slug]/` | Loading chybi |
| `app/(web)/jak-prodat-auto/` | Loading chybi |
| `app/(web)/jak-to-funguje/` | Loading chybi |
| `app/(web)/obchodni-podminky/` | Loading chybi |
| `app/(web)/ochrana-osobnich-udaju/` | Loading chybi |
| `app/(web)/prihlaseni/` | Loading chybi |
| `app/(web)/registrace/partner/` | Loading chybi |
| `app/(web)/zapomenute-heslo/` | Loading chybi |
| `app/(web)/reset-hesla/[token]/` | Loading chybi |
| `app/(web)/overeni-emailu/*/` | 3 stranky — loading chybi |
| `app/(admin)/admin/payouts/` | Loading chybi |
| `app/(pwa)/makler/onboarding/` (root) | Loading chybi |
| `app/(pwa)/makler/vehicles/[id]/edit/` | Loading chybi |

### ❌ Stranky BEZ error.tsx:
| Stranka | Chybi |
|---------|-------|
| Vsechny SEO landing pages pod `/nabidka/` | ~43 stranek bez vlastniho error.tsx (spadne na `/nabidka/error.tsx` parent) |
| `app/(web)/kariera/` | Error chybi |
| `app/(web)/makleri/` | Error chybi |
| `app/(web)/prihlaseni/` | Error chybi |
| `app/(web)/recenze/` | Error chybi |
| `app/(web)/chci-prodat/` | Error chybi |
| `app/(web)/jak-prodat-auto/` | Error chybi |
| `app/(web)/jak-to-funguje/` | Error chybi |
| `app/(web)/obchodni-podminky/` | Error chybi |
| `app/(web)/ochrana-osobnich-udaju/` | Error chybi |
| `app/(web)/registrace/` (root) | Error chybi |
| `app/(web)/registrace/partner/` | Error chybi |
| `app/(web)/shop/` (root) | Error chybi (ale deti maji) |
| `app/(web)/zapomenute-heslo/` | Error chybi |
| `app/(web)/reset-hesla/[token]/` | Error chybi |
| `app/(web)/overeni-emailu/*/` | Error chybi |
| `app/(admin)/admin/payouts/` | Error chybi |
| `app/(web)/marketplace/investor/` (list) | Error chybi |

**Poznamka:** SEO landing pages pod `/nabidka/` (znacky, mesta, ceny, typy) nemaji vlastni loading/error, ale deji parent boundary `/nabidka/loading.tsx` a `/nabidka/error.tsx`. To je akceptovatelne pro staticke/ISR stranky.

---

## 4. Git status — rozpracovane zmeny

### Modifikovane soubory (unstaged):
- **Admin:** `admin/marketplace/[id]/page.tsx`
- **PWA:** 9 stranek (dashboard, leads, messages, onboarding, stats) — pravdepodobne update UI/logiky
- **Web:** marketplace (dealer, investor), sitemap, sluzby/vykup (**smazano**)
- **Komponenty:** Navbar, Footer, MobileMenu (web + main), TopBar, VehicleFilters, ApplyForm, ProfitCalculator
- **Konfigurace:** `next.config.ts`, `lib/seo-data.ts`
- **Testy:** `e2e/headed-all-flows.spec.ts`
- **PWA:** `public/sw.js`

### Smazane soubory:
- ❌ `app/(web)/sluzby/vykup/loading.tsx` — smazano
- ❌ `app/(web)/sluzby/vykup/page.tsx` — smazano
- ❌ `components/web/VykupForm.tsx` — smazano

**→ Sekce "Vykup vozidel" byla zrusena/odebrana.**

### Nove soubory (untracked):
- `.claude-context/` — agent team kontext
- `e2e/debug-login.spec.ts`, `debug-login2.spec.ts`, `debug-login3.spec.ts` — debug testy (smazat pred deployem!)
- `e2e/marketplace-flows.spec.ts`, `pwa-flows.spec.ts` — nove E2E testy
- `e2e/registration-real.spec.ts` — registracni test

**⚠️ VAROVANI:** 3 debug-login spec soubory by nemely byt commitnuty do repa.

---

## 5. API routes — analyza

### Celkovy stav:
- **100+ API endpointu** — velmi robustni API vrstva
- **77 routes s Zod importem** — solidni validace
- **~17 routes BEZ Zod validace na vstupu**

### Routes chybejici Zod validaci:
1. `app/api/csp-report/route.ts` — (akceptovatelne, CSP report)
2. `app/api/admin/send-verification-emails/route.ts`
3. `app/api/stripe/webhook/route.ts` — (akceptovatelne, Stripe signature)
4. `app/api/payments/webhook/route.ts` — (akceptovatelne, Stripe signature)
5. `app/api/upload/route.ts` — manualni validace (idealne Zod)
6. `app/api/contracts/[id]/pdf/route.ts`
7. `app/api/listings/[id]/images/route.ts` — manualni validace
8. `app/api/cron/daily-summary/route.ts` — (akceptovatelne, cron)
9. `app/api/onboarding/profile/route.ts` — manualni validace
10. `app/api/onboarding/documents/route.ts` — manualni validace
11. `app/api/settings/delete-account/route.ts`
12. `app/api/reservations/[id]/cancel/route.ts`
13. `app/api/payouts/broker/[id]/approve/route.ts`
14. `app/api/partner/vehicles/route.ts` — manualni validace
15. `app/api/partner/profile/route.ts` — manualni validace
16. `app/api/partner/parts/route.ts` — manualni validace
17. `app/api/contracts/[id]/send/route.ts`

**Kriticke (meli by mit Zod):** #2, #6, #9, #10, #11, #12, #13, #14, #15, #16, #17
**Akceptovatelne bez Zod:** #1 (CSP), #3 (Stripe), #4 (Stripe), #8 (cron)
**Idealne pridat Zod:** #5, #7 (maji manualni validaci)

### Cron joby (vsechny existuji):
- ✅ exclusive-expiry
- ✅ feed-import
- ✅ listing-expiry
- ✅ quick-draft-expiry
- ✅ reservation-expiry
- ✅ sla-check
- ✅ stale-vehicles
- ✅ upsell-check
- ✅ watchdog-match
- ✅ daily-summary

---

## 6. Komponenty — analyza

### Sdilene UI komponenty (19 ks):
Alert, Badge, Button, Card, Checkbox, Dropdown, EmptyState, Input, LiveRegion, Modal, Pagination, ProgressBar, Select, StatCard, StatusPill, Tabs, Textarea, Toggle, TrustScore

### Web komponenty (65+ ks):
- Marketplace: ApplyForm, DealerStats, FlipTimeline, InvestModal, InvestorPortfolio, OpportunityCard, OpportunityWizard, ProfitCalculator
- Listing form: 6-krokovy wizard (Step1Vin → Step6Preview)
- Katalog: VehicleCard, ProductCard, VehicleFilters, QuickFilters, SmartSearchBar
- Sluzby: FinancovaniCalc, PojisteniForm, ProverkaForm, CebiaCheck, LoanCalculator
- E-commerce: Cart, CartIcon, CompareBar, CompareButton, OrderForm, OrderTracker, RecommendedParts, ZasilkovnaWidget
- SEO: BrandLandingContent, ModelLandingContent, VehicleLandingPage
- Ostatni: CookieConsent, Analytics, ContactForm, FAQ, Breadcrumbs, etc.

### PWA komponenty (80+ ks):
- Dashboard: StatsRow, AddVehicleCTA, DraftsList, FollowUpSection, NewLeadsSection, NotificationsList
- Vehicles: VehicleFilters, VehicleStatus, VehicleCard, HandoverChecklist, DamageReportButton, ExclusiveSection
- Contracts: ContractWizard (4 kroky), SignatureFlow, ContractPdfButton, etc.
- CRM: ContactCard, CommunicationForm, CommunicationTimeline, SmsTemplates
- Gamifikace: AchievementCard, LeaderboardTable, LevelBadge, FinancingCalculator
- Onboarding: OnboardingProgress, QuizForm, TrainingSlides, DocumentUpload, ContractSign
- Email: EmailButton, EmailHistory, EmailSendModal
- Offline: PendingItem, SyncButton

### Admin komponenty (24 ks):
DataTable, BrokersPageContent, VehiclesPageContent, PaymentsPageContent, etc.

### PWA-Parts komponenty (11 ks):
CsvImport, AddPartWizard (3 kroky), PartFilters, OrderCard, OrderActions, etc.

### Potencialni duplicity:
| Komponenta | Lokace 1 | Lokace 2 | Poznamka |
|-----------|----------|----------|----------|
| Navbar | `components/web/Navbar.tsx` | `components/main/Navbar.tsx` | 2 verze! |
| Footer | `components/web/Footer.tsx` | `components/main/Footer.tsx` | 2 verze! |
| MobileMenu | `components/web/MobileMenu.tsx` | `components/main/MobileMenu.tsx` | 2 verze! |
| VehicleFilters | `components/web/VehicleFilters.tsx` | `components/pwa/vehicles/VehicleFilters.tsx` | Ruzny kontext, OK |

**⚠️ Navbar/Footer/MobileMenu existuji v `components/web/` i `components/main/` — potreba overit, ktera verze se kde pouziva a sjednotit.**

---

## 7. Prisma schema — modely (49 modelu)

### Zakladni:
User, Region, Invitation, Vehicle, VehicleImage, VehicleChangeLog

### Prodejni flow:
VehicleInquiry, DamageReport, Commission, Notification, Contract, AiConversation

### Lead management:
Lead

### Inzertni platforma:
Listing, ListingImage, Inquiry, Watchdog, Favorite, Reservation, CebiaReport, ListingFeedConfig, ListingImportLog

### Eshop autodily:
Part, PartImage, Order, OrderItem, ReturnRequest, PartsFeedConfig, PartsFeedImportLog

### Marketplace:
FlipOpportunity, Investment

### Platby:
Payment, SellerPayout, BrokerPayout

### CRM:
SellerContact, SellerCommunication, SellerNotificationPreference

### Gamifikace:
UserAchievement, PriceReduction, Escalation

### Komunikace:
EmailLog, NotificationPreference, SmsLog

### Feed import:
FeedImportConfig, FeedImportLog

### Partnersky modul:
Partner, PartnerActivity, PartnerLead

### Auth:
PasswordResetToken, EmailVerificationToken

---

## 8. Middleware a bezpecnost

### Role-based auth (middleware.ts):
- ✅ ADMIN_ROLES, MAKLER_ROLES, INZERENT_ROLES, BUYER_ROLES
- ✅ PARTS_SUPPLIER_ROLES, MARKETPLACE_DEALER_ROLES, MARKETPLACE_INVESTOR_ROLES
- ✅ PARTNER_ROLES
- ✅ Subdomenove rewrite (inzerce, shop, marketplace)

### CSP (next.config.ts):
- ✅ Plna Content Security Policy s report-uri
- ✅ Script-src, style-src, img-src, connect-src, frame-src spravne nastaveny
- ✅ Stripe, Cloudinary, Google Fonts, Packeta, Plausible povoleny
- ✅ Sentry integrace

---

## 9. Testovaaci pokryti

### E2E testy (Playwright):
- ✅ `auth.spec.ts` — autentifikace
- ✅ `homepage.spec.ts` — homepage
- ✅ `catalog.spec.ts` — katalog
- ✅ `listing.spec.ts` — inzeraty
- ✅ `shop.spec.ts` — eshop
- ✅ `contact.spec.ts` — kontakt
- ✅ `responsive.spec.ts` — responzivita
- ✅ `comprehensive-batch-test.spec.ts` — komprehenzivni batch
- ✅ `headed-all-flows.spec.ts` — vsechny flows
- ✅ `marketplace-flows.spec.ts` — marketplace (NOVY)
- ✅ `pwa-flows.spec.ts` — PWA (NOVY)
- ✅ `registration-real.spec.ts` — registrace (NOVY)
- ⚠️ `debug-login*.spec.ts` — 3 debug soubory (SMAZAT!)

---

## 10. Souhrn problemu a doporuceni

### 🔴 KRITICKE:
1. **3x debug-login spec soubory** — smazat pred deployem
2. **~11 API routes bez validace vstupu** — pridatvZod validaci

### 🟡 DULEZITE:
3. **Duplicitni Navbar/Footer/MobileMenu** — `components/web/` vs `components/main/` — sjednotit
4. **~25 stranek bez loading.tsx** — predevsim dily/, shop/ podstranky, auth stranky
5. **~15 stranek bez error.tsx** — predevsim informacni stranky, auth stranky
6. **Smazany sluzby/vykup** — overit, ze odstraneni je zamerne a ze navbaruvedene odkazy jsou aktualizovany

### 🟢 NICE-TO-HAVE:
7. **SEO landing pages** — nemaji vlastni loading/error (ale maji parent boundary — akceptovatelne)
8. **Partner/parts manualni validace** — nahradit Zod pro konzistenci
9. **`app/(admin)/admin/payouts/`** — chybi loading.tsx a error.tsx

### ✅ CO JE V PORADKU:
- Vsechny 4 produkty jsou implementovany a kompletni
- 49 Prisma modelu pokryva vsechny business domeny
- 100+ API endpointu s prevahou Zod validace
- Middleware spravne chranu vsechny chranene cesty
- CSP politika je dobre nakonfigurovana
- E2E testy pokryvaji hlavni flows
- PWA s offline podporou funguje
- Gamifikace, CRM, email system, feed import — vse implementovano
- Subdomenovy routing (inzerce, shop, marketplace) funguje
- Stripe integrace vcetne webhooku
- Sentry error tracking
