# Marketplace VIP — Kompletní audit implementace

**Datum:** 2026-04-26
**Autor:** Plánovač
**Stav:** DOKONČENO

---

## 1. PŘEHLED ARCHITEKTURY

### Databázové modely (Prisma)

| Model | Stav | Řádky schema | Poznámka |
|-------|------|--------------|----------|
| `FlipOpportunity` | ✅ Kompletní | 1307–1350 | Auto, finance, opravy, prodej, status, timestamps, indexy |
| `Investment` | ✅ Kompletní | 1352–1374 | Investor relace, částka, paymentStatus, returnAmount, paidOutAt |
| `MarketplaceApplication` | ✅ Kompletní | 1377–1418 | Contact, role, admin workflow, anti-spam metadata, indexy |
| User relace | ✅ OK | 130–133 | dealerFlips, investments, applicationReviewer, applicationConverted |

**Stav DB modelů:** Všechny 3 modely jsou kompletní s indexy, relacemi a správnými defaults.

---

## 2. API ROUTES

### `/api/marketplace/apply` — POST
- **Stav:** ✅ Plně funkční, kvalitní kód
- Rate limiting (5 req/15min/IP)
- Honeypot anti-spam (silent 200 na bot)
- Zod validace (`applySchema`)
- Anti-duplicate check (email + NEW + 24h)
- Admin email notifikace (Resend)
- Confirmation email žadateli
- DB notification pro adminy
- **Chybí:** Admin API pro správu žádostí (GET list, PUT approve/reject, user creation)

### `/api/marketplace/opportunities` — POST + GET
- **Stav:** ✅ Plně funkční
- POST: Auth + DEALER role check, Zod validace, vytvoření s PENDING_APPROVAL
- GET: Auth + role-based filtering (dealer=svoje, investor=FUNDING+, admin=vše), pagination, sort, filter
- **Bug potenciál:** GET `where` objekt používá `Record<string, unknown>` — může dojít k přepsání `status` filtru (line 97+111)

### `/api/marketplace/opportunities/[id]` — GET + PUT
- **Stav:** ✅ Plně funkční, dobře zabezpečený
- GET: Role-based access (dealer jen svoje, investor ne PENDING_APPROVAL, admin vše), filtrování investic investora
- PUT: Komplexní přístupová logika — dealer editable v PENDING/IN_REPAIR/FOR_SALE s omezenými poli, admin vždy
- Dealer status transition: IN_REPAIR → FOR_SALE

### `/api/marketplace/opportunities/[id]/approve` — POST
- **Stav:** ✅ Funkční, admin-only
- Schválení → FUNDING, zamítnutí → CANCELLED s rejectionReason

### `/api/marketplace/opportunities/[id]/payout` — POST
- **Stav:** ✅ Funkční, admin-only, dobře navržený
- 40/40/20 profit split (investor/dealer/CarMakléř)
- Při ztrátě vrací vklad investorům
- Poměrné dělení mezi investory
- $transaction pro atomicitu
- **Potenciální problém:** Při ztrátě vrací investorům celý vklad — business rule check nutný (může být záměr jako garance)

### `/api/marketplace/investments` — POST + GET
- **Stav:** ✅ Funkční
- POST: INVESTOR role check, ověření FUNDING stavu, kontrola max. investice vs. remaining
- GET: Investor vidí jen svoje, admin vše, pagination, sort
- **Min. investice:** Zod schema říká 1000 Kč, ale UI říká 10000 Kč — **NESOULAD**

### `/api/marketplace/investments/[id]/confirm-payment` — PUT
- **Stav:** ✅ Funkční, admin-only
- Auto-přechod: FUNDING → FUNDED při plném financování
- Recalculates fundedAmount z DB
- **Bug:** PaymentConfirmation component posílá `{ rejected: true }` ale API toto pole nepodporuje (confirmPaymentSchema expects `paymentReference: string`)

### `/api/marketplace/stats` — GET
- **Stav:** ✅ Funkční, role-based
- Admin: celkové stats + carmaklerRevenue
- Dealer: vlastní stats + earnings (40%)
- Investor: vlastní investice + ROI

---

## 3. WEB PAGES

### `/marketplace` — Landing page
- **Stav:** ✅ Kompletní, kvalitní
- Hero, How it works, ROI examples, Guarantees, FAQ, Apply CTA
- JSON-LD FAQ schema
- Dynamic stats z DB (`getMarketplaceStats`)
- `reason=not_authorized` alert
- SEO metadata + OG tags + canonical

### `/marketplace/apply` — Žádost o přístup
- **Stav:** ✅ Kompletní
- Dedikovaná stránka s `ApplyForm` komponentou
- Role selection (VERIFIED_DEALER/INVESTOR), conditional fields
- `reason` query param handling (auth_required, not_authorized)
- SEO metadata

### `/marketplace/dealer` — Dealer Dashboard
- **Stav:** ⚠️ Funkční ale s problémy
- Zobrazuje VŠECHNY non-CANCELLED flipy bez filtrování na aktuálního dealera
- `getDealerData()` nemá session check — načítá vše z DB
- **BUG:** Měl by zobrazovat jen flipy aktuálního dealera (middleware pouští jen VERIFIED_DEALER/ADMIN/BACKOFFICE, ale dealer vidí cizí flipy)

### `/marketplace/dealer/nova` — Nová příležitost wizard
- **Stav:** ⚠️ Funkční se slabinami
- 4-step wizard (Auto → Oprava → Prodej → Shrnutí)
- **Chybí:** Upload fotek — drag-and-drop placeholder bez funkčnosti (jen prázdný div)
- **Chybí:** Client-side step validace (wizard jede Pokračovat bez validace aktuálního kroku)
- `marketAnalysis` field se nikam neukládá (není v API create schema)

### `/marketplace/dealer/[id]` — Redirect
- **Stav:** ✅ OK — redirect na `/marketplace/deals/[id]`

### `/marketplace/investor` — Investor Dashboard
- **Stav:** ⚠️ Funkční ale s problémy
- Portfolio stats počítá z CELKOVÝCH dat, ne z investic aktuálního investora
- `getOpportunities()` načítá vše — ne jen příležitosti kde investor investoval
- **BUG:** `totalInvested` = suma `fundedAmount` všech opp (ne investice aktuálního uživatele)

### `/marketplace/investor/[id]` — Redirect
- **Stav:** ✅ OK — redirect na `/marketplace/deals/[id]`

### `/marketplace/deals/[id]` — Sjednocený deal detail
- **Stav:** ✅ Kvalitní implementace
- Server-side session check + role-based access
- Dealer jen svoje, investor ne PENDING_APPROVAL
- Role-based investment filtering
- Rich client component `DealDetailClient` s:
  - FlipTimeline, ProfitCalculator, DealPhotoGallery
  - InvestModal pro investory
  - DealAdminPanel pro adminy
  - Status update (IN_REPAIR → FOR_SALE) pro dealery

---

## 4. ADMIN PAGES

### `/admin/marketplace` — Dashboard
- **Stav:** ✅ Funkční
- Stats (celkem, aktivní, ke schválení, objem)
- Pending payments tabulka s PaymentConfirmation
- Pending approvals s FlipManagement
- Všechny flipy s FlipManagement

### `/admin/marketplace/[id]` — Detail flipu
- **Stav:** ⚠️ Client-side fetch (ne Server Component)
- Načítá data přes API `/api/marketplace/opportunities/[id]` a `/api/marketplace/investments`
- Approve/Reject/Payout akce
- FlipTimeline, ProfitCalculator, PaymentConfirmation
- **Problém:** `dealerEmail` není v API response (`dealer.select` nemá `email`)

### `/admin/marketplace/applications` — NEEXISTUJE
- **Stav:** ❌ Chybí kompletně
- Apply route posílá adminům notifikaci s linkem `/admin/marketplace/applications/{id}` → 404
- Žádný způsob jak spravovat žádosti v admin panelu
- **KRITICKÉ:** Admini nemají UI pro review/approve/reject žádostí

---

## 5. KOMPONENTY

### `components/web/marketplace/` (12 souborů)

| Komponenta | Stav | Poznámka |
|-----------|------|----------|
| `ApplyForm` | ✅ | Honeypot, role switch, conditional fields, GDPR, async submit |
| `OpportunityWizard` | ⚠️ | Chybí foto upload, step validace, marketAnalysis se neukládá |
| `OpportunityCard` | ✅ | Memoized, responsive, funding progress, ROI badge |
| `DealDetailClient` | ✅ | Plný deal detail, role-aware, invest CTA, admin panel |
| `DealPhotoGallery` | ✅ | Tabs (auto/repair), thumbnails, upload pro dealera |
| `DealAdminPanel` | ✅ | Status change, notes, approve/reject, payout |
| `InvestModal` | ✅ | Amount input, ROI calc, payment instructions, terms checkbox |
| `FlipTimeline` | ✅ | Desktop + mobile, 7 kroků, step highlighting |
| `ProfitCalculator` | ✅ | Interactive/readOnly, 40/40/20 split visualization |
| `DealerStats` | ✅ | 4 stat cards |
| `InvestorPortfolio` | ✅ | 4 stat cards |

### `components/admin/marketplace/` (2 soubory)

| Komponenta | Stav | Poznámka |
|-----------|------|----------|
| `FlipManagement` | ✅ | Tabulka flipů, status badge, link na detail |
| `PaymentConfirmation` | ⚠️ | Confirm OK, Reject posílá `{rejected:true}` — API to nepodporuje |

### `components/marketplace/` (2 soubory)

| Komponenta | Stav | Poznámka |
|-----------|------|----------|
| `MarketplaceNavbar` | ✅ | Dark theme, subdomain navbar, mobile menu, PlatformSwitcher |
| `MarketplaceFooter` | ✅ | Subdomain footer, marketplace-specific links |

---

## 6. MIDDLEWARE / ROUTE PROTECTION

### middleware.ts — Marketplace routes
- **Stav:** ✅ Správně implementováno

| Route pattern | Neauth uživatel | Špatná role | Správná role |
|---|---|---|---|
| `/marketplace/deals/*` | → `/marketplace/apply?reason=auth_required` | → `/marketplace?reason=not_authorized` | ✅ Povoleno (VD/INV/ADMIN/BO) |
| `/marketplace/dealer/*` | → `/marketplace/apply?reason=auth_required&role=dealer` | → `/marketplace?reason=not_authorized` | ✅ Povoleno (VD/ADMIN/BO) |
| `/marketplace/investor/*` | → `/marketplace/apply?reason=auth_required&role=investor` | → `/marketplace?reason=not_authorized` | ✅ Povoleno (INV/ADMIN/BO) |
| `/marketplace` | ✅ Public | ✅ Public | ✅ Public |
| `/marketplace/apply` | ✅ Public | ✅ Public | ✅ Public |

- Subdomain rewrite: `marketplace.carmakler.cz/*` → `/marketplace/*`

---

## 7. VALIDÁTORY (Zod)

**Soubor:** `lib/validators/marketplace.ts`

| Schema | Stav | Poznámka |
|--------|------|----------|
| `createOpportunitySchema` | ✅ | |
| `updateOpportunitySchema` | ✅ | |
| `opportunityFilterSchema` | ✅ | coerce, defaults |
| `approveOpportunitySchema` | ✅ | |
| `payoutSchema` | ✅ | |
| `createInvestmentSchema` | ⚠️ | Min 1000 Kč, ale UI říká 10000 Kč |
| `confirmPaymentSchema` | ✅ | |
| `investmentFilterSchema` | ✅ | |
| `applySchema` | ✅ | Refine pro dealer IČO/firma |

---

## 8. EMAIL TEMPLATES

| Template | Stav |
|---------|------|
| `marketplace-application-admin.ts` | ✅ Existuje |
| `marketplace-application-confirmation.ts` | ✅ Existuje |

---

## 9. HELPER/LIB

| Soubor | Funkce | Stav |
|--------|--------|------|
| `lib/stats.ts` | `getMarketplaceStats()` | ✅ completedFlips, avgROI, avgFlipDays |

---

## 10. SUMMARY BUGŮ A PROBLÉMŮ

### KRITICKÉ (P0)

1. **❌ Admin Marketplace Applications UI chybí**
   - `/admin/marketplace/applications` neexistuje
   - Apply API posílá notifikace s linkem na 404
   - Admini nemají žádný způsob jak spravovat žádosti
   - **Potřeba:** API route GET/PUT + admin page + admin detail page

2. **🔴 PaymentConfirmation Reject nefunguje**
   - `PaymentConfirmation.tsx:44` posílá `{ rejected: true }` na confirm-payment API
   - `confirmPaymentSchema` expects `{ paymentReference: string }` → Zod validation fail
   - **Fix:** Buď rozšířit API o reject flow, nebo přidat reject-payment endpoint

### STŘEDNÍ (P1)

3. **⚠️ Dealer Dashboard zobrazuje cizí flipy**
   - `app/(web)/marketplace/dealer/page.tsx:16` — `findMany` bez `where: { dealerId }` filtru
   - Middleware omezuje přístup na roli, ale dealer vidí data ostatních dealerů
   - **Fix:** Přidat session check + filtr na `dealerId: session.user.id`

4. **⚠️ Investor Dashboard počítá z globálních dat**
   - `app/(web)/marketplace/investor/page.tsx:15` — načítá vše, portfolio stats = globální
   - Investor vidí `totalInvested` jako sumu všech fundedAmount, ne svých investic
   - **Fix:** Načítat investice aktuálního investora přes session

5. **⚠️ Min. investice nesoulad Zod vs UI**
   - `createInvestmentSchema` allows min 1000 Kč
   - `InvestModal.tsx:47` a `:111` říká min 10000 Kč
   - **Fix:** Sjednotit na jednu hodnotu (pravděpodobně 10000 Kč)

### NÍZKÉ (P2)

6. **OpportunityWizard — foto upload nefunkční**
   - Step 1 + 2: drag-and-drop placeholder bez implementace (prázdný div)
   - Nová příležitost se vytvoří bez fotek

7. **OpportunityWizard — marketAnalysis se zahazuje**
   - Step 3 sbírá `marketAnalysis` ale POST request ho neposílá
   - Ani DB model nemá pole pro marketAnalysis

8. **OpportunityWizard — chybí step validace**
   - Tlačítko "Pokračovat" funguje bez validace aktuálního kroku
   - Uživatel může přeskočit na Shrnutí s prázdnými poli

9. **Admin detail — dealerEmail chybí v API response**
   - `admin/marketplace/[id]/page.tsx:104-105` čte `opp.dealer?.email`
   - API `GET /api/marketplace/opportunities/[id]` nevrací email v `dealer.select`

10. **Admin detail je Client Component, ne Server Component**
    - Celá stránka je `"use client"` + `useEffect` fetch
    - Měl by být Server Component (konzistentní s rest of admin panel)

11. **Status transition APPROVED → FUNDING**
    - Po schválení příležitost přejde na FUNDING
    - Není jasný přechod z APPROVED stavu (approve = FUNDING rovnou, APPROVED status se efektivně nepoužívá)

---

## 11. CHYBĚJÍCÍ TESTY

**Žádné testy pro marketplace neexistují:**
- ❌ API route testy (Vitest)
- ❌ Component testy
- ❌ E2E testy (Playwright)
- ❌ Zod schema testy

### Prioritní testy k napsání:
1. Apply flow (POST + duplicate detection + rate limit + honeypot)
2. Opportunity CRUD (create, list s role filtering, detail access)
3. Investment flow (create, over-invest check, confirm-payment → FUNDED auto-transition)
4. Payout calculation (profit + loss scenarios, 40/40/20 split)
5. Middleware protection (all 5 route patterns)
6. E2E: Landing → Apply → Dealer creates opp → Admin approves → Investor invests → Admin confirms → Dealer FOR_SALE → Admin payout

---

## 12. CHYBĚJÍCÍ FUNKCE

1. **Admin Applications Management** (P0)
   - GET /api/admin/marketplace/applications (list, filter by status)
   - PUT /api/admin/marketplace/applications/[id] (approve/reject, create user)
   - Admin UI page + detail

2. **Investment Rejection/Refund** (P1)
   - Reject pending investment
   - Refund confirmed investment

3. **Notifikace do emailu** (P2)
   - Dealer: příležitost schválena/zamítnuta
   - Investor: platba potvrzena, výplata provedena
   - Dealer: příležitost plně financována

4. **Real-time updates** (P2)
   - Pusher pro live funding progress
   - Pusher pro admin notifikace

5. **Stripe integrace** (Phase 2)
   - Automatické zpracování plateb místo manuálního confirm-payment

---

## 13. CELKOVÉ HODNOCENÍ

| Oblast | Hodnocení | Poznámka |
|--------|-----------|----------|
| DB modely | ⭐⭐⭐⭐⭐ | Kompletní, indexované, dobře navržené |
| API routes | ⭐⭐⭐⭐ | Solidní, auth/authz, Zod validace, 2 bugy |
| Landing page | ⭐⭐⭐⭐⭐ | SEO, JSON-LD, live stats, CTA flow |
| Apply flow | ⭐⭐⭐⭐⭐ | Anti-spam, emails, notifications, GDPR |
| Deal detail | ⭐⭐⭐⭐ | Role-aware, rich UI, invest modal |
| Dealer dashboard | ⭐⭐⭐ | Funkční ale zobrazuje cizí data |
| Investor dashboard | ⭐⭐⭐ | Funkční ale s globálními stats |
| Admin panel | ⭐⭐⭐ | Flipy OK, applications management chybí |
| Middleware | ⭐⭐⭐⭐⭐ | Správné role gating všech routes |
| Komponenty | ⭐⭐⭐⭐ | Kvalitní UI, 12 specializovaných komponent |
| Testy | ⭐ | Žádné testy |
| Validátory | ⭐⭐⭐⭐ | Kompletní, 1 nesoulad |

**Celkové hodnocení: 75/100** — Solidní základ s funkčním end-to-end flow, ale 3 kritické bugy (admin applications, payment reject, data leaky dashboards) a nulové testy.
