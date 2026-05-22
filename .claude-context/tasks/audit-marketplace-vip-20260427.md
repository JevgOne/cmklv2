# Audit: Marketplace VIP — Aktualni stav webu + admin

**Datum:** 2026-04-27
**Autor:** Planovac (agent team)
**Stav:** KOMPLETNI

---

## 1. WEB ROUTES — /marketplace/*

### 1.1 Existujici stranky

| Route | Typ | Stav | Popis |
|-------|-----|------|-------|
| `/marketplace` | Landing page (SSR) | **PLNE FUNKCNI** | Hero, Jak to funguje, ROI priklady, FAQ (7 otazek), bezpecnostni zaruky, CTA. Statistiky z DB (getMarketplaceStats). Schema.org FAQPage JSON-LD. |
| `/marketplace/apply` | Apply form (SSR) | **PLNE FUNKCNI** | Formular zadosti (ApplyForm component). Podporuje `?role=investor\|dealer` pre-fill + `?reason=auth_required\|not_authorized` alerty. |
| `/marketplace/dealer` | Dealer dashboard (SSR) | **PLNE FUNKCNI** | Dashboard realizatora — statistiky (DealerStats), grid prilezitosti (OpportunityCard), tlacitko "Nova prilezitost". Prisma query: vlastni flipy (admin vidi vse). |
| `/marketplace/dealer/nova` | Novy flip wizard (SSR) | **PLNE FUNKCNI** | OpportunityWizard — multi-krokovy formular pro vytvoreni nove prilezitosti. |
| `/marketplace/dealer/[id]` | Redirect | **PLNE FUNKCNI** | Redirect na `/marketplace/deals/[id]` (sjednoceny deal detail). |
| `/marketplace/investor` | Investor dashboard (SSR) | **PLNE FUNKCNI** | Portfolio stats (InvestorPortfolio), dostupne prilezitosti (FUNDING/APPROVED), moje investice. Prisma query. |
| `/marketplace/investor/[id]` | Redirect | **PLNE FUNKCNI** | Redirect na `/marketplace/deals/[id]` (sjednoceny deal detail). |
| `/marketplace/deals/[id]` | Deal detail (SSR) | **PLNE FUNKCNI** | Sjednoceny detail flipu (DealDetailClient). Role-based gating: VERIFIED_DEALER/INVESTOR/ADMIN/BACKOFFICE. Dealer vidi jen sve, investor nevidi PENDING_APPROVAL. Fotogalerie, investice, admin panel. |

### 1.2 Podpurne soubory

Kazda route ma:
- `loading.tsx` — spinner/skeleton
- `error.tsx` — error boundary
- `layout.tsx` (dealer, investor) — robots noindex/nofollow

### 1.3 Komponenty webu (components/web/marketplace/)

| Komponenta | Stav | Popis |
|------------|------|-------|
| `ApplyForm.tsx` | FUNKCNI | Formular zadosti — validace, role-specific fieldy (ICO pro dealery, investicni rozsah pro investory) |
| `DealDetailClient.tsx` | FUNKCNI | Client-side deal detail s fotogalerií, investicnim modalem, timeline |
| `DealPhotoGallery.tsx` | FUNKCNI | Galerie fotek flipu |
| `DealerFlipDetail.tsx` | FUNKCNI | Dealer-specific flip detail view |
| `DealerStats.tsx` | FUNKCNI | Stat cards: celkem flipu, aktivnich, prodanych, prumerny ROI |
| `DealAdminPanel.tsx` | FUNKCNI | Admin ovladaci panel v deal detailu |
| `FlipTimeline.tsx` | FUNKCNI | Vizualni timeline: APPROVED → FUNDING → IN_REPAIR → FOR_SALE → SOLD |
| `InvestModal.tsx` | FUNKCNI | Modal pro investovani — castka, potvrzeni |
| `InvestorPortfolio.tsx` | FUNKCNI | Stat cards: investovano, aktivni investice, vynosy, prumerny ROI |
| `OpportunityCard.tsx` | FUNKCNI | Karta prilezitosti s fotkou, cenou, progress barem financovani |
| `OpportunityWizard.tsx` | FUNKCNI | Multi-step formular: auto info → finance → fotky → odeslani |
| `ProfitCalculator.tsx` | FUNKCNI | Kalkulacka zisku se split 40/40/20 |

### 1.4 Marketplace-specific Navbar & Footer

| Komponenta | Stav |
|------------|------|
| `components/marketplace/Navbar.tsx` | FUNKCNI — Tmava theme, logo s "Marketplace" badge, linky "Pro dealery" + "Pro investory", PlatformSwitcher, Prihlasit se CTA |
| `components/marketplace/Footer.tsx` | FUNKCNI — Wrappuje FooterBase s platformKey="marketplace" |

---

## 2. ADMIN PANEL — /admin/marketplace/*

### 2.1 Existujici stranky

| Route | Typ | Stav | Popis |
|-------|-----|------|-------|
| `/admin/marketplace` | Dashboard (SSR) | **PLNE FUNKCNI** | StatCards (celkem flipu, aktivnich, ke schvaleni, celkovy objem). Link na zadosti. Cekajici platby (PaymentConfirmation). Ke schvaleni (FlipManagement). Vsechny flipy (FlipManagement). Vsechno z Prisma DB. |
| `/admin/marketplace/[id]` | Flip detail (CSR) | **PLNE FUNKCNI** | Client-side detail: timeline (FlipTimeline), fotky, detaily vozu, plan opravy, investori, ProfitCalculator (readOnly). Admin akce: Schvalit/Zamitnout (PENDING_APPROVAL), Spustit vyplatu (SOLD). Kontaktovat realizatora (mailto). |
| `/admin/marketplace/applications` | Seznam zadosti (SSR) | **PLNE FUNKCNI** | Tabulka zadosti s filtry (status tabs: Vse/Nove/Kontaktovane/Schvalene/Zamitnute/Spam). Hledani. Paginace. Badge s poctem novych. |
| `/admin/marketplace/applications/[id]` | Detail zadosti (CSR) | **PLNE FUNKCNI** | Kontaktni udaje, firemni udaje (dealer), investicni profil (investor), zprava. Admin akce: Oznacit jako kontaktovany, Schvalit (vytvori ucet), Zamitnout (s duvodem), Oznacit jako spam. Admin poznamky. |

### 2.2 Admin komponenty (components/admin/marketplace/)

| Komponenta | Stav |
|------------|------|
| `FlipManagement.tsx` | FUNKCNI — Tabulka flipu s akce tlacitky |
| `PaymentConfirmation.tsx` | FUNKCNI — Tabulka cekajicich plateb s potvrzovacim workflow |

### 2.3 Navigace v admin panelu

Admin Sidebar (`components/admin/AdminSidebar.tsx`, radek 84):
```
{ id: "marketplace", href: "/admin/marketplace", icon: "📈", label: "Marketplace" }
```
**Stav:** FUNKCNI — Admin se dostane do marketplace spravy pres sidebar.

---

## 3. API ROUTES — /api/marketplace/*

| Route | Metody | Stav | Popis |
|-------|--------|------|-------|
| `/api/marketplace/apply` | POST | **FUNKCNI** | Verejna zadost (neautent.). Rate limit (5/15min IP), honeypot, anti-duplicate 24h, DB ukladani, admin email notifikace (Resend), DB notifikace, confirmation email zadateli. |
| `/api/marketplace/opportunities` | POST, GET | **FUNKCNI** | POST: dealer vytvori prilezitost. GET: seznam s filtry (status, brand, dealerId, price range, sort, pagination). Role-based viditelnost. |
| `/api/marketplace/opportunities/[id]` | GET, PUT | **FUNKCNI** | GET: detail s role-based filteringem (dealer jen sve, investor nema PENDING). PUT: dealer muze menit jen v PENDING_APPROVAL / IN_REPAIR → FOR_SALE; admin muze vse. |
| `/api/marketplace/opportunities/[id]/approve` | POST | **FUNKCNI** | Admin schvali/zamitne prilezitost. |
| `/api/marketplace/opportunities/[id]/payout` | POST | **FUNKCNI** | Admin spusti vyplatu — logika 40/40/20 ze zisku. Ztrátový flip = investorum vrácen vklad. |
| `/api/marketplace/investments` | POST, GET | **FUNKCNI** | POST: investor investuje (validace stavu FUNDING, check max castky). GET: moje investice s filtry. |
| `/api/marketplace/investments/[id]/confirm-payment` | POST | **FUNKCNI** | Admin potvrzuje prijem platby. |
| `/api/marketplace/stats` | GET | **FUNKCNI** | Role-based statistiky: admin (celkove), dealer (vlastni), investor (vlastni portfolio). |

---

## 4. NAVIGACE A PRISTUPNOST

### 4.1 Jak se tam dostane ADMIN

| Cesta | Funguje? |
|-------|----------|
| Admin sidebar → "Marketplace" | **ANO** — odkaz `/admin/marketplace` |
| Admin → deal detail → schvalit/zamitnout | **ANO** — `/admin/marketplace/[id]` |
| Admin → zadosti → schvalit ucet | **ANO** — `/admin/marketplace/applications/[id]` |
| Admin na **WEBU** `/marketplace` | **CHYBI LINK** — Admin nema v hlavni navigaci odkaz na marketplace web |

### 4.2 Jak se tam dostane INVESTOR

| Cesta | Funguje? |
|-------|----------|
| Primy URL `/marketplace` | **ANO** — landing page |
| Primy URL `/marketplace/investor` | **ANO** — s auth (middleware gate) |
| Primy URL `/marketplace/deals/[id]` | **ANO** — s auth + role check |
| Odkaz z hlavniho webu | **CHYBI** — PlatformSwitcher NEOBSAHUJE marketplace (#101) |
| Odkaz z marketplace Navbar | **ANO** — "Pro investory" link |

### 4.3 Jak se tam dostane DEALER (realizator)

| Cesta | Funguje? |
|-------|----------|
| Primy URL `/marketplace` | **ANO** — landing page |
| Primy URL `/marketplace/dealer` | **ANO** — s auth (middleware gate) |
| Primy URL `/marketplace/dealer/nova` | **ANO** — nova prilezitost |
| Odkaz z hlavniho webu | **CHYBI** — PlatformSwitcher NEOBSAHUJE marketplace (#101) |
| Odkaz z marketplace Navbar | **ANO** — "Pro dealery" link |

### 4.4 Verejny pristup (neprihlaseny)

| Cesta | Funguje? |
|-------|----------|
| `/marketplace` | **ANO** — landing page, statistiky, CTA |
| `/marketplace/apply` | **ANO** — formular zadosti (public) |
| `/marketplace/dealer` | Redirect → `/marketplace/apply?reason=auth_required&role=dealer` |
| `/marketplace/investor` | Redirect → `/marketplace/apply?reason=auth_required&role=investor` |
| `/marketplace/deals/[id]` | Redirect → `/marketplace/apply?reason=auth_required` |

---

## 5. MIDDLEWARE OCHRANA

```
/marketplace/deals/*   → VERIFIED_DEALER, INVESTOR, ADMIN, BACKOFFICE
/marketplace/dealer/*  → VERIFIED_DEALER, ADMIN, BACKOFFICE
/marketplace/investor/* → INVESTOR, ADMIN, BACKOFFICE
```

Neauth → redirect na `/marketplace/apply?reason=auth_required`
Spatna role → redirect na `/marketplace?reason=not_authorized`

**Subdomena:** `marketplace.*` → rewrite `/marketplace` prefix (middleware.ts:111-114)

---

## 6. PROVIZNI MODEL — KRITICKE ZJISTENI

### 6.1 Aktualní stav v kodu: **40/40/20 ze ZISKU**

Provize je implementovana jako deleni ZISKU (profit split):
- **Investor: 40% ze zisku**
- **Realizator: 40% ze zisku**
- **CarMakler: 20% ze zisku**

### 6.2 Kde je to hardcoded:

| Misto | Soubor | Radek | Hodnota |
|-------|--------|-------|---------|
| ProfitCalculator | `components/web/marketplace/ProfitCalculator.tsx` | 30-32 | `0.4 / 0.4 / 0.2` |
| Payout API | `app/api/marketplace/opportunities/[id]/payout/route.ts` | 103-106 | `0.4 / 0.4 / carmaklerShare = rest` |
| Stats API | `app/api/marketplace/stats/route.ts` | 58 | `Math.floor(totalProfit * 0.2)` — carmaklerRevenue |
| Stats API | `app/api/marketplace/stats/route.ts` | 104 | `Math.floor(Math.max(0, profit) * 0.4)` — dealer earnings |
| Landing page text | `app/(web)/marketplace/page.tsx` | 46 | "40 % investor, 40 % realizator, 20 % CarMakler" |
| FAQ text | `app/(web)/marketplace/page.tsx` | 88 | "40 % investor, 40 % realizator, 20 % CarMakler" |
| ROI priklad | `app/(web)/marketplace/page.tsx` | 272 | `Math.round(profit * 0.4)` — investorProfit |

### 6.3 NOVY MODEL (POTVRZENO 2026-04-27)

1. **Carmakler = 5% z PRODEJNI CENY vozu** (fixni, nepodleha vyjednavani)
2. **Zbytek zisku = VYJEDNAVANI dealer ↔ investor** (offer/counter-offer system)
3. Kazdy deal muze mit JINY split — neni zadny fixni pomer

**Priklad:** Auto prodano za 450,000 Kc → Carmakler: 22,500 Kc → Zisk 77,500 Kc → Dealer navrhl 50/50, investor nabidl 40/60, dealer souhlasil → Dealer: 31,000 Kc, Investor: 46,500 Kc

### 6.4 Dopad zmeny

**KRITICKE — je treba zmenit/pridat:**
1. `ProfitCalculator.tsx` — dynamicky kalkulator s nastavitelnym splitem (ne hardcoded)
2. `payout/route.ts` — cist dohodnuty split z DB (ne hardcoded 0.4/0.4/0.2)
3. `stats/route.ts` — carmaklerRevenue = 5% z prodejni ceny; dealer/investor dle skutecnych splitu
4. `page.tsx` (landing) — texty: novy vyjednavaci model misto "40/40/20"
5. FAQ — aktualizovat "Jak se deli zisk?" — popis vyjednavani
6. **NOVY: DB model `DealNegotiation`** — offers, counter-offers, history, status
7. **NOVY: API endpointy** — POST offer, POST counter-offer, POST accept/reject
8. **NOVY: Deal detail sekce "Vyjednavani"** — UI pro offer/counter-offer flow
9. **NOVY: Notifikace** — push/email pri kazde nabidce/protinabidce

**OTEVŘENÉ OTÁZKY:**
- Timeout — co kdyz se nedohodnou? Fallback split nebo zruseni dealu?
- Min/Max limity — muze dealer navrhnout 90/10?
- Kdy se vyjednava — pred investici nebo az po prodeji?
- Vice investoru — vyjednava kazdy zvlast?
- Co kdyz zisk < 5% z ceny vozu? (Provize Carmakler prevysi cely zisk)

---

## 7. DB SCHEMA (Prisma)

### 7.1 FlipOpportunity
Kompletni — vsechna pole pouzita v kodu. Statusy: PENDING_APPROVAL → APPROVED → FUNDING → FUNDED → IN_REPAIR → FOR_SALE → SOLD → PAYOUT_PENDING → COMPLETED / CANCELLED.

### 7.2 Investment
Kompletni — amount, paymentStatus (PENDING/CONFIRMED/REFUNDED), returnAmount, paidOutAt. paymentReference pro VS.

### 7.3 MarketplaceApplication
Kompletni — kontaktni udaje, role-specific fieldy, admin workflow (NEW → CONTACTED → APPROVED / REJECTED / SPAM), admin poznamky, reviewed by/at, converted user, IP/user agent.

---

## 8. SOUHRNNE HODNOCENI

### Co funguje DOBRE (zelenà):
- Kompletni landing page s SEO (metadata, JSON-LD, canonical)
- Apply flow — public formular, email notifikace, honeypot, rate limit, anti-duplicate
- Dealer dashboard + wizard pro novou prilezitost
- Investor dashboard + portfolio
- Sjednoceny deal detail `/marketplace/deals/[id]` s role-based gating
- Admin panel — dashboard, flip detail, zadosti, platby
- Middleware ochrana vsech chranenych rout
- Subdomena `marketplace.carmakler.cz` rewrite
- Responsive design, loading/error states

### Co CHYBI nebo je SPATNE (cervena):

| # | Problem | Zavaznost | Detail |
|---|---------|-----------|--------|
| **P1** | **Provizni model 40/40/20 vs 5%** | KRITICKE | Cely provizni model je spatne — musi byt 5% z ceny vozu, ne 20% ze zisku. Hardcoded na 7 mistech. |
| **P2** | **Marketplace nedostupny z hlavniho webu** | STREDNI | PlatformSwitcher zamerne NEOBSAHUJE marketplace odkaz (#101). Admin ani nikdo jiny se nedostane z hlavniho webu na marketplace. |
| **P3** | **Hlavni Navbar nemá marketplace** | STREDNI | components/web/Navbar nemá zadny odkaz na marketplace. Uzivatel musi vedet primy URL. |
| **P4** | **Admin nema link na marketplace WEB** | NIZKA | Admin se dostane na admin panel (sidebar), ale ne na verejny marketplace web. Chybi odkaz v admin sidebar nebo dashboardu. |
| **P5** | **Chybi notifikace investorum** | STREDNI | Kdyz se zmeni stav flipu (schvalen, prodan, vyplata), investor nedostane email/push notifikaci. |
| **P6** | **Chybi Stripe integrace** | NIZKA (faze 2) | Platby jsou "manualni potvrzeni adminem" — bankovy prevod. Stripe neni napojen. |

---

## 9. DOPORUCENI PRO IMPLEMENTACI

### Faze 1 — KRITICKE (provize + pristupnost)
1. **Zmena provizniho modelu** na 5% z prodejni ceny vozu (7 souboru)
2. **Pridani marketplace do navigace** — hlavni Navbar + PlatformSwitcher (konzultace s PO ohledne VIP gating vs discoverability)
3. **Link z admin panelu na marketplace web** (nejmensi effort)

### Faze 2 — STREDNI
4. **Notifikace investorum** pri zmene stavu (email + in-app)
5. **Dashboard realtime** (Pusher for live funding progress)

### Faze 3 — BUDOUCI
6. Stripe integrace pro automaticke platby
7. Smlouvy/dokumenty generovani (PDF)
