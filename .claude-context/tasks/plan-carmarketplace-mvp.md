# Implementacni plan: CarMarketplace MVP (v1)

**Datum:** 2026-04-27
**Autor:** Planovac (agent team)
**Zdroje:** audit-marketplace-vip-20260427.md, brainstorm-carmarketplace-features.md
**Stav:** PLAN — ceka na schvaleni leadem

---

## PREHLED

CarMarketplace je rebrand stavajiciho "Marketplace VIP". Momentalni stav: **8 web routes + 4 admin routes + 8 API endpointu** — vse funkcni, ale s **40/40/20 proviznim modelem** ktery se meni na **5% + offer/counter-offer**.

Plan je rozdelen do **8 implementacnich fazi** s jasnym poradim a zavislostmi.

---

## FAZE 0: DB SCHEMA ZMENY (zaklad pro vse ostatni)

**Zavislosti:** zadne — MUSI jit prvni
**Soubor:** `prisma/schema.prisma`

### 0.1 Novy model: DealNegotiation

```prisma
model DealNegotiation {
  id            String          @id @default(cuid())
  opportunityId String
  opportunity   FlipOpportunity @relation(fields: [opportunityId], references: [id])

  // Kdo nabidku poslal
  fromUserId    String
  fromUser      User            @relation("NegotiationFrom", fields: [fromUserId], references: [id])
  fromRole      String          // "VERIFIED_DEALER" | "INVESTOR"

  // Komu
  toUserId      String
  toUser        User            @relation("NegotiationTo", fields: [toUserId], references: [id])

  // Nabidka
  dealerSharePct Int            // Procenta pro dealera (0-100)
  investorSharePct Int          // = 100 - dealerSharePct (computed, ale ulozene pro jasnost)
  message       String?         @db.Text

  // Status
  status        String          @default("PENDING") // PENDING, ACCEPTED, REJECTED, EXPIRED, SUPERSEDED
  respondedAt   DateTime?

  // Poradi (1 = prvni nabidka, 2 = protinabidka, ...)
  round         Int             @default(1)

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([opportunityId])
  @@index([fromUserId])
  @@index([toUserId])
  @@index([status])
}
```

### 0.2 Uprava FlipOpportunity — pridani poli

```prisma
// PRIDAT do existujiciho modelu FlipOpportunity:
  // Dohodnuty split (vyplneno po ACCEPTED negotiation)
  agreedDealerSharePct  Int?    // null = jeste nedohodnuto
  agreedInvestorSharePct Int?
  carmaklerFeePct       Int     @default(5) // 5% z prodejni ceny

  // AI Deal Score
  dealScore             Int?    // 1-100, AI-generated
  dealScoreUpdatedAt    DateTime?

  // Dealer reputation (cached)
  dealerRating          Float?  // 1.0-5.0

  // Progress tracker
  repairProgress        Int     @default(0) // 0-100%
  repairMilestones      String? // JSON: [{date, label, photos}]

  // Relace
  negotiations DealNegotiation[]
```

### 0.3 Novy model: DealComment (pro budouci Deal Discussion — v1.1, ale schema ted)

```prisma
model DealComment {
  id            String          @id @default(cuid())
  opportunityId String
  opportunity   FlipOpportunity @relation(fields: [opportunityId], references: [id])
  userId        String
  user          User            @relation(fields: [userId], references: [id])
  content       String          @db.Text
  parentId      String?
  parent        DealComment?    @relation("DealCommentReplies", fields: [parentId], references: [id])
  replies       DealComment[]   @relation("DealCommentReplies")

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([opportunityId])
  @@index([userId])
  @@index([parentId])
}
```

### 0.4 Uprava User modelu — pridani relaci

```prisma
// PRIDAT do existujiciho modelu User:
  negotiationsFrom DealNegotiation[] @relation("NegotiationFrom")
  negotiationsTo   DealNegotiation[] @relation("NegotiationTo")
  dealComments     DealComment[]
```

### 0.5 Uprava NotificationPreference — nove event typy

Nove eventType hodnoty pro marketplace:
- `MARKETPLACE_NEW_DEAL` — nova prilezitost v segmentu investora
- `MARKETPLACE_NEGOTIATION` — nova nabidka/protinabidka
- `MARKETPLACE_STATUS_CHANGE` — zmena stavu flipu
- `MARKETPLACE_PAYOUT` — vyplata zisku
- `MARKETPLACE_REPAIR_UPDATE` — novy milnik opravy

### 0.6 Migrace

```bash
npx prisma migrate dev --name carmarketplace-mvp-schema
```

**POZOR:** Vsechna nova pole maji default hodnoty nebo jsou nullable → migrace je bezpecna pro existujici data.

---

## FAZE 1: PROVIZNI MODEL 5% + OFFER/COUNTER-OFFER

**Zavislosti:** Faze 0 (DB schema)
**Priorita:** KRITICKE — meni business logiku

### 1.1 Validacni schema

**UPRAVIT:** `lib/validators/marketplace.ts`

```typescript
// PRIDAT:
export const createNegotiationSchema = z.object({
  opportunityId: z.string().min(1),
  dealerSharePct: z.number().int().min(10).max(80),
  message: z.string().max(500).optional(),
});

export const respondNegotiationSchema = z.object({
  negotiationId: z.string().min(1),
  action: z.enum(["ACCEPT", "REJECT", "COUNTER"]),
  counterDealerSharePct: z.number().int().min(10).max(80).optional(),
  message: z.string().max(500).optional(),
});

// UPRAVIT payoutSchema — pridat optional override split:
export const payoutSchema = z.object({
  actualSalePrice: z.number().int().min(1, "Prodejní cena je povinná"),
});
```

### 1.2 API Routes — vyjednavani

**VYTVORIT:** `app/api/marketplace/negotiations/route.ts`
- **POST** — **JEN VERIFIED_DEALER** vytvori pocatecni nabidku (round 1)
  - Validace: `session.user.role === "VERIFIED_DEALER"` — investor NESMI iniciovat
  - Validace: dealer je owner dane FlipOpportunity
  - Dealer navrhl svuj podil (dealerSharePct), investorSharePct = 100 - dealerSharePct
  - Predchozi PENDING nabidky se oznaci jako SUPERSEDED
  - Vytvorit DB notifikaci pro investory v danem dealu
  - **POZOR:** Investor odpovida VYHRADNE pres `/negotiations/[id]/respond` endpoint
- **GET** — Seznam nabidek pro dany deal (`?opportunityId=xxx`)

**VYTVORIT:** `app/api/marketplace/negotiations/[id]/respond/route.ts`
- **POST** — Accept/Reject/Counter
  - ACCEPT: ulozi agreedDealerSharePct + agreedInvestorSharePct do FlipOpportunity
  - REJECT: oznaci jako REJECTED
  - COUNTER: vytvori novou DealNegotiation s novym splitem (round+1)
  - Vytvorit notifikaci

### 1.3 Uprava existujicich API

**UPRAVIT:** `app/api/marketplace/opportunities/[id]/payout/route.ts`
- **ZMENA:** Misto hardcoded 0.4/0.4/0.2 cist `agreedDealerSharePct`/`agreedInvestorSharePct` z FlipOpportunity
- **LOGIKA:**
  ```
  carmaklerFee = Math.floor(actualSalePrice * 0.05)
  profit = actualSalePrice - purchasePrice - repairCost - carmaklerFee
  dealerShare = Math.floor(profit * (agreedDealerSharePct / 100))
  investorShare = profit - dealerShare
  ```
- **VALIDACE:** Pokud `agreedDealerSharePct` je null (neni dohodnuto) → error 400

**UPRAVIT:** `app/api/marketplace/stats/route.ts`
- Radek 58: `Math.floor(totalProfit * 0.2)` → `Math.floor(actualSalePrice * 0.05)` pro carmaklerRevenue
- Radek 104: `Math.floor(Math.max(0, profit) * 0.4)` → cist skutecny split z DB

**UPRAVIT:** `app/api/marketplace/opportunities/route.ts` (GET)
- Pridat `agreedDealerSharePct`, `agreedInvestorSharePct`, `dealScore` do response

### 1.4 Frontend — ProfitCalculator

**UPRAVIT:** `components/web/marketplace/ProfitCalculator.tsx`

Uplna prepracovani:
- **Props:** pridat `dealerSharePct`, `investorSharePct`, `editable` (pro vyjednavani)
- **Logika:**
  ```
  carmaklerFee = salePrice * 0.05
  profit = salePrice - totalCost - carmaklerFee
  investorShare = profit * (investorSharePct / 100)
  dealerShare = profit * (dealerSharePct / 100)
  ```
- **UI:** Slider pro nastaveni splitu (kdyz editable=true), labels "Carmakler (5% z ceny)" + "Dealer (X%)" + "Investor (Y%)"
- Odebrat hardcoded `0.4 / 0.4 / 0.2`

### 1.5 Frontend — Vyjednavaci komponenta

**VYTVORIT:** `components/web/marketplace/NegotiationPanel.tsx`
- History nabidek (timeline: kdo nabidl co, kdy)
- Aktualni nabidka s Accept/Reject/Counter tlacitky
- Counter-offer formular: slider pro % + volitelna zprava
- Status badge (ceka na vasi odpoved / ceka na druhou stranu / dohodnuto)

### 1.6 Uprava landing page textu

**UPRAVIT:** `app/(web)/marketplace/page.tsx`
- Radek 46 (howItWorks krok 4): zmenit text z "40/40/20" na novy model
- Radek 88 (FAQ "Jak se deli zisk?"): zmenit odpoved
- Radky 268-272 (ROI priklady): zmenit kalkulaci — pouzit 5% + flexibilni split
- FAQ pridat novou otazku o vyjednavani splitu

---

## FAZE 2: NAVIGACE + REBRAND "Marketplace" → "CarMarketplace"

**Zavislosti:** zadne (paralelne s Fazi 1)
**Priorita:** VYSOKA — uzivatel se NEDOSTANE na marketplace z webu + branding musi byt konzistentni

### 2.1 REBRAND — systematicky prejmenovani

Vsude kde se zobrazuje uzivatelsky viditelny text "Marketplace", "Marketplace VIP" nebo "Marketplace |" se meni na **"CarMarketplace"**.

**POZOR:** URL paths (`/marketplace/*`) a technicke identifikatory (`id: "marketplace"`, `platformKey: "marketplace"`) se NEMENI — jen user-facing texty (title, label, breadcrumb, meta, h1, badge).

#### 2.1.1 Web pages — metadata + UI texty (9 souboru)

| Soubor | Radek | Puvodni | Nove |
|--------|-------|---------|------|
| `app/(web)/marketplace/page.tsx` | 11 | `"Marketplace \| Investiční platforma..."` | `"CarMarketplace \| Investiční platforma..."` |
| `app/(web)/marketplace/page.tsx` | 15 | `"Marketplace — investice do aut \| CarMakléř"` | `"CarMarketplace — investice do aut \| CarMakléř"` |
| `app/(web)/marketplace/page.tsx` | 142 | `{ label: "Marketplace" }` | `{ label: "CarMarketplace" }` |
| `app/(web)/marketplace/page.tsx` | 363 | `"Marketplace je VIP platforma..."` | `"CarMarketplace je exkluzivní platforma..."` |
| `app/(web)/marketplace/apply/page.tsx` | 8 | `"Žádost o přístup \| Marketplace"` | `"Žádost o přístup \| CarMarketplace"` |
| `app/(web)/marketplace/apply/page.tsx` | 13 | `"Žádost o přístup k Marketplace \| CarMakléř"` | `"Žádost o přístup k CarMarketplace \| CarMakléř"` |
| `app/(web)/marketplace/apply/page.tsx` | 42 | `{ label: "Marketplace", href: "/marketplace" }` | `{ label: "CarMarketplace", href: "/marketplace" }` |
| `app/(web)/marketplace/apply/page.tsx` | 53 | `"Marketplace je VIP platforma..."` | `"CarMarketplace je exkluzivní platforma..."` |
| `app/(web)/marketplace/dealer/page.tsx` | 12 | `"Realizátor Dashboard \| Marketplace"` | `"Realizátor Dashboard \| CarMarketplace"` |
| `app/(web)/marketplace/dealer/page.tsx` | 98 | `Marketplace` (breadcrumb) | `CarMarketplace` |
| `app/(web)/marketplace/dealer/nova/page.tsx` | 7 | `"Nová příležitost \| Realizátor \| Marketplace"` | `"Nová příležitost \| Realizátor \| CarMarketplace"` |
| `app/(web)/marketplace/dealer/nova/page.tsx` | 9 | `"...na CarMakléř Marketplace..."` | `"...na CarMarketplace..."` |
| `app/(web)/marketplace/dealer/nova/page.tsx` | 21 | `Marketplace` (breadcrumb) | `CarMarketplace` |
| `app/(web)/marketplace/investor/page.tsx` | 11 | `"Investor Dashboard \| Marketplace"` | `"Investor Dashboard \| CarMarketplace"` |
| `app/(web)/marketplace/investor/page.tsx` | 127 | `Marketplace` (breadcrumb) | `CarMarketplace` |
| `app/(web)/marketplace/investor/[id]/layout.tsx` | 4 | `"Detail příležitosti \| Marketplace"` | `"Detail příležitosti \| CarMarketplace"` |
| `app/(web)/marketplace/investor/[id]/layout.tsx` | 6 | `"...na CarMakléř Marketplace..."` | `"...na CarMarketplace..."` |
| `app/(web)/marketplace/deals/[id]/page.tsx` | 9 | `"Detail flipu \| Marketplace VIP"` | `"Detail flipu \| CarMarketplace"` |
| `app/(web)/marketplace/deals/[id]/not-found.tsx` | 16 | `"Zpět na Marketplace"` | `"Zpět na CarMarketplace"` |

#### 2.1.2 Admin panel (4 soubory)

| Soubor | Radek | Puvodni | Nove |
|--------|-------|---------|------|
| `app/(admin)/admin/marketplace/page.tsx` | 89 | `Marketplace` (breadcrumb) | `CarMarketplace` |
| `app/(admin)/admin/marketplace/page.tsx` | 92 | `Marketplace` (h1) | `CarMarketplace` |
| `app/(admin)/admin/marketplace/[id]/page.tsx` | 182 | `Marketplace` (breadcrumb link) | `CarMarketplace` |
| `app/(admin)/admin/marketplace/applications/page.tsx` | 70 | `Admin / Marketplace` | `Admin / CarMarketplace` |
| `app/(admin)/admin/marketplace/applications/[id]/page.tsx` | 103 | `Admin / Marketplace` | `Admin / CarMarketplace` |

#### 2.1.3 Komponenty (5 souboru)

| Soubor | Radek | Puvodni | Nove |
|--------|-------|---------|------|
| `components/marketplace/Navbar.tsx` | 23 | `Marketplace` (badge text) | `CarMarketplace` |
| `components/marketplace/Footer.tsx` | 9 | `title: "Marketplace"` | `title: "CarMarketplace"` |
| `components/common/FooterBase.tsx` | 49 | `marketplace: "Marketplace"` | `marketplace: "CarMarketplace"` |
| `components/admin/AdminSidebar.tsx` | 84 | `label: "Marketplace"` | `label: "CarMarketplace"` |
| `components/web/marketplace/DealDetailClient.tsx` | 133 | `{ label: "Marketplace", href: "/marketplace" }` | `{ label: "CarMarketplace", href: "/marketplace" }` |
| `components/web/marketplace/DealerFlipDetail.tsx` | 149 | `Marketplace` (breadcrumb) | `CarMarketplace` |

#### 2.1.4 Email sablony (2 soubory)

| Soubor | Zmena |
|--------|-------|
| `lib/email-templates/marketplace-application-confirmation.ts` | Vsechny "marketplace" v textech → "CarMarketplace" (radky 15, 25, 48, 61, 62, 77, 83, 88, 89) |
| `lib/email-templates/marketplace-application-admin.ts` | "marketplace" v textech → "CarMarketplace" |

#### 2.1.5 Middleware — jen komentare (1 soubor)

| Soubor | Radek | Zmena |
|--------|-------|-------|
| `middleware.ts` | 83 | Komentar: "marketplace" → "carmarketplace" |
| `middleware.ts` | 289, 310, 333 | Komentare: "marketplace" → "CarMarketplace" |

**CELKEM REBRAND: 21 souboru, ~40 textu k zmene**

**CO SE NEMENI (technicke identifikatory — ZACHOVAT):**
- URL paths: `/marketplace/*` (route structure)
- Subdomena: `marketplace.carmakler.cz` (DNS + middleware rewrite)
- DB tabulky: `FlipOpportunity`, `Investment`, `MarketplaceApplication`
- API routes: `/api/marketplace/*`
- PlatformKey type: `"marketplace"`
- CSS class names, component file names
- Funkce a typy v kodu (MarketplaceNavbar, MarketplaceFooter, etc.)

### 2.2 PlatformSwitcher

**UPRAVIT:** `components/ui/PlatformSwitcher.tsx`
- Radky 31-35: ODKOMENTOVAT/PRIDAT marketplace entry zpet do PLATFORMS pole
- Pridat: `{ key: "marketplace", label: "CarMarketplace", mobileLabel: "CarMarketplace — investice do aut", href: urls.marketplace("/") }`
- Overit ze `lib/urls.ts` ma `marketplace()` helper

### 2.3 Hlavni Navbar

Marketplace Navbar (`components/marketplace/Navbar.tsx`) uz existuje a je FUNKCNI.
Hlavni web Navbar nepotrebuje marketplace — PlatformSwitcher to resi.

### 2.4 Admin panel — link na marketplace web

**UPRAVIT:** `app/(admin)/admin/marketplace/page.tsx`
- Pridat link "Otevrit CarMarketplace web" vedle nadpisu (external link icon)
- URL: `/marketplace` nebo `marketplace.carmakler.cz`

---

## FAZE 3: SJEDNOCENY DEAL DETAIL S TABS

**Zavislosti:** Faze 0 (schema), Faze 1 (NegotiationPanel)
**Priorita:** VYSOKA

### 3.1 Prepracovani DealDetailClient

**UPRAVIT:** `components/web/marketplace/DealDetailClient.tsx`

Zmena z flat page na tabbed layout:

```
Tabs:
[Prehled] [Finance] [Oprava] [Vyjednavani] [Investori]
```

| Tab | Obsah | Role visibility |
|-----|-------|-----------------|
| **Prehled** | Fotogalerie, zakladni info (znacka, model, rok, km, VIN, stav), dealer info, AI Deal Score badge | Vsichni |
| **Finance** | ProfitCalculator (novy dynamicky), funding progress bar, InvestModal (pro investory) | Vsichni |
| **Oprava** | FlipProgressTracker (novy), milniky, fotky z opravy | Vsichni |
| **Vyjednavani** | NegotiationPanel — nabidky/protinabidky | Dealer + Investor v danem dealu |
| **Investori** | Seznam investoru s castkami | Admin + Dealer (investor vidi jen sebe) |

**VYTVORIT:** `components/web/marketplace/DealTabs.tsx`
- Tab navigace (responsive — horizontalni scroll na mobilu)
- Active tab stav
- Badge s poctem na tabu (napr. "Vyjednavani (1)" kdyz ceka nabidka)

### 3.2 Uprava deal detail page

**UPRAVIT:** `app/(web)/marketplace/deals/[id]/page.tsx`
- Pridat fetch negotiations a repair milestones
- Predat nove props do DealDetailClient

---

## FAZE 4: PORTFOLIO DASHBOARD PRO INVESTORY

**Zavislosti:** Faze 0 (schema), Faze 1 (provizni model)
**Priorita:** VYSOKA

### 4.1 Prepracovani investor page

**UPRAVIT:** `app/(web)/marketplace/investor/page.tsx`

Zmena z jednoducheho seznamu na plnohodnotny dashboard:

### 4.2 Novy Portfolio Dashboard komponent

**VYTVORIT:** `components/web/marketplace/PortfolioDashboard.tsx`

Sekce:
1. **Hero stats** (4 karty):
   - Celkem investovano (Kc)
   - Aktualni hodnota portfolia (Kc) — investice + ocekavany zisk
   - Realizovany zisk (Kc)
   - Prumerny ROI (%)

2. **Portfolio graf** (line chart):
   - X: cas, Y: hodnota portfolia
   - Zobrazit trend za poslednich 6/12 mesicu
   - Pouzit lehky chart lib (napr. recharts — uz v projektu? Pokud ne, CSS-only progress bars)

3. **Aktivni investice** (tabulka/grid):
   - Nazev auta, status, investovano, ocekavany zisk, progress bar opravy, deal score
   - Kliknutelne → deal detail

4. **Historie** (tabulka):
   - Dokoncene flipy s realnym ROI, datum, castka

### 4.3 API uprava

**UPRAVIT:** `app/api/marketplace/stats/route.ts`
- Pro INVESTOR roli pridat: portfolioValue (investice + proporcionalni zisk dle aktualniho stavu), timeline data

**NEBO VYTVORIT:** `app/api/marketplace/portfolio/route.ts`
- Dedicny endpoint pro investor portfolio data
- Vraci: active investments s deal score, repair progress, expected profit

---

## FAZE 5: AI DEAL SCORE (1-100)

**Zavislosti:** Faze 0 (schema — dealScore pole)
**Priorita:** VYSOKA

### 5.1 Scoring engine

**VYTVORIT:** `lib/marketplace/deal-score.ts`

Skore 1-100 na zaklade:
- **Margin of Safety (40%)**: (estimatedSalePrice - purchasePrice - repairCost) / (purchasePrice + repairCost) — cim vyssi margin, tim lepsi
- **Dealer Track Record (30%)**: historicky uspech dealera (pocet flipu, prumerny ROI, % v case)
- **Market Demand (20%)**: jak rychle se podobna auta prodavaji (z vlastnich dat — prumerny cas prodeje pro danou znacku/model/rok)
- **Data Completeness (10%)**: VIN zadano, fotky nahrane, popis opravy detailni

```typescript
export async function calculateDealScore(opportunityId: string): Promise<number> {
  // 1. Nacist opportunity z DB
  // 2. Spocitat margin of safety
  // 3. Nacist dealer history (prisma query)
  // 4. Nacist trzni data (z vlastnich FlipOpportunity — jak rychle se prodavala podobna auta)
  // 5. Overit data completeness
  // 6. Vazeny prumer → score 1-100
  // 7. Ulozit do FlipOpportunity.dealScore + dealScoreUpdatedAt
  return score;
}
```

### 5.2 Auto-update

**UPRAVIT:** `app/api/marketplace/opportunities/route.ts` (POST)
- Po vytvoreni opportunity volat `calculateDealScore()` async (fire-and-forget)

**UPRAVIT:** `app/api/marketplace/opportunities/[id]/route.ts` (PUT)
- Po updatu recalculovat score pokud se zmenila klicova pole (price, condition)

### 5.3 Frontend — Deal Score Badge

**VYTVORIT:** `components/web/marketplace/DealScoreBadge.tsx`
- Kruhovy indikator s cislem (1-100)
- Barvy: 0-40 cervena, 41-70 zluta, 71-100 zelena
- Tooltip s rozpadem (co prispiva ke skore)
- Zobrazit na OpportunityCard + Deal Detail

### 5.4 Uprava OpportunityCard

**UPRAVIT:** `components/web/marketplace/OpportunityCard.tsx`
- Pridat DealScoreBadge do praveho horniho rohu karty

---

## FAZE 6: FLIP PROGRESS TRACKER

**Zavislosti:** Faze 0 (schema — repairProgress, repairMilestones)
**Priorita:** VYSOKA

### 6.1 Novy komponent

**VYTVORIT:** `components/web/marketplace/FlipProgressTracker.tsx`

Vizualni timeline s milniky:
```
[Nakup] ──── [Preprava] ──── [Oprava 45%] ──── [Foceni] ──── [Inzerce] ──── [Prodej]
  ✅           ✅              🔄 aktivni         ⏳             ⏳              ⏳
```

Kazdy milnik:
- Datum dokonceni (nebo "ceka")
- Fotky (kliknutelne pro galerii)
- Poznamka od dealera

### 6.2 API pro milniky

**VYTVORIT:** `app/api/marketplace/opportunities/[id]/milestones/route.ts`
- **POST** — Dealer prida milnik (label, progress %, fotky, poznamka)
  - Validace: jen owner dealer nebo admin
  - Update repairProgress na FlipOpportunity
  - Parse/ulozit repairMilestones (JSON)
  - Vytvorit notifikaci pro vsechny investory v tomto dealu
- **GET** — Nacist milniky

### 6.3 Validace

**PRIDAT do** `lib/validators/marketplace.ts`:
```typescript
export const createMilestoneSchema = z.object({
  label: z.string().min(1).max(100),
  progressPct: z.number().int().min(0).max(100),
  photos: z.array(z.string().url()).max(10).optional(),
  note: z.string().max(500).optional(),
});
```

### 6.4 Integrace do Deal Detail

FlipProgressTracker se zobrazi v tabu "Oprava" v DealDetailClient (viz Faze 3).

---

## FAZE 7: SMART NOTIFICATIONS

**Zavislosti:** Faze 0 (schema), Faze 1 (vyjednavani), Faze 6 (milniky)
**Priorita:** VYSOKA

### 7.1 Marketplace notification helper

**VYTVORIT:** `lib/marketplace/notifications.ts`

```typescript
export async function notifyMarketplace(params: {
  type: 'NEW_DEAL' | 'NEGOTIATION' | 'STATUS_CHANGE' | 'PAYOUT' | 'REPAIR_UPDATE';
  opportunityId: string;
  recipientIds: string[];
  title: string;
  body: string;
  link: string;
}) {
  // 1. Zkontrolovat NotificationPreference pro kazdeho recipienta
  // 2. Vytvorit DB Notification (in-app)
  // 3. Poslat email pres Resend (pokud emailEnabled)
  // 4. (Budouci) Push notifikace pres service worker
}
```

### 7.2 Email templates

**VYTVORIT:**
- `lib/email-templates/marketplace-negotiation.ts` — nova nabidka / protinabidka
- `lib/email-templates/marketplace-status-change.ts` — zmena stavu flipu
- `lib/email-templates/marketplace-payout.ts` — vyplata zisku
- `lib/email-templates/marketplace-repair-update.ts` — novy milnik opravy

### 7.3 Integrace do existujicich API

Pridat `notifyMarketplace()` volani do:
- `app/api/marketplace/negotiations/route.ts` (POST) — pri nove nabidce
- `app/api/marketplace/negotiations/[id]/respond/route.ts` (POST) — pri odpovedi
- `app/api/marketplace/opportunities/[id]/approve/route.ts` — pri schvaleni/zamitnuti
- `app/api/marketplace/opportunities/[id]/payout/route.ts` — pri vyplate
- `app/api/marketplace/opportunities/[id]/milestones/route.ts` — pri novem milniku
- `app/api/marketplace/opportunities/[id]/route.ts` (PUT) — pri zmene statusu

---

## FAZE 8: DEALER REPUTATION SYSTEM

**Zavislosti:** Faze 0 (schema — dealerRating)
**Priorita:** STREDNI

### 8.1 Rating engine

**VYTVORIT:** `lib/marketplace/dealer-rating.ts`

```typescript
export async function calculateDealerRating(dealerId: string): Promise<number> {
  // 1-5 hvezd na zaklade:
  // - Uspesnost flipu (% completed vs cancelled) — vaha 30%
  // - Prumerny ROI pro investory — vaha 25%
  // - Dodrzeni casoveho planu (estimatedDays vs actualDays) — vaha 25%
  // - Pocet flipu (vice = vetsi duveryhodnost) — vaha 20%
  return rating; // 1.0 - 5.0
}
```

### 8.2 Frontend — Dealer profil

**VYTVORIT:** `components/web/marketplace/DealerReputationBadge.tsx`
- Hvezdicky (1-5)
- Pocet flipu
- Prumerny ROI pro investory
- "Top Dealer" badge (rating >= 4.5)

### 8.3 Zobrazeni

- Na OpportunityCard (male — hvezdicky + pocet flipu)
- V Deal Detail (vetsi — kompletni profil dealera s historiou)
- V Investor Dashboard (u kazde investice)

### 8.4 Auto-update

- Recalkulovat po kazdem COMPLETED flipu
- Ulozit do FlipOpportunity.dealerRating (cached) pri vytvoreni

---

## SOUBORY — KOMPLETNI PREHLED

### NOVE SOUBORY (vytvorit):

| Soubor | Faze | Popis |
|--------|------|-------|
| `app/api/marketplace/negotiations/route.ts` | 1 | POST/GET nabidky |
| `app/api/marketplace/negotiations/[id]/respond/route.ts` | 1 | POST accept/reject/counter |
| `app/api/marketplace/opportunities/[id]/milestones/route.ts` | 6 | POST/GET milniky opravy |
| `app/api/marketplace/portfolio/route.ts` | 4 | GET investor portfolio data |
| `components/web/marketplace/NegotiationPanel.tsx` | 1 | Vyjednavaci UI |
| `components/web/marketplace/DealTabs.tsx` | 3 | Tab navigace deal detailu |
| `components/web/marketplace/PortfolioDashboard.tsx` | 4 | Investor dashboard |
| `components/web/marketplace/DealScoreBadge.tsx` | 5 | AI score vizualizace |
| `components/web/marketplace/FlipProgressTracker.tsx` | 6 | Milniky opravy |
| `components/web/marketplace/DealerReputationBadge.tsx` | 8 | Hvezdicky dealera |
| `lib/marketplace/deal-score.ts` | 5 | AI scoring logika |
| `lib/marketplace/dealer-rating.ts` | 8 | Rating logika |
| `lib/marketplace/notifications.ts` | 7 | Notifikacni helper |
| `lib/email-templates/marketplace-negotiation.ts` | 7 | Email sablona |
| `lib/email-templates/marketplace-status-change.ts` | 7 | Email sablona |
| `lib/email-templates/marketplace-payout.ts` | 7 | Email sablona |
| `lib/email-templates/marketplace-repair-update.ts` | 7 | Email sablona |

### EXISTUJICI SOUBORY (upravit):

#### Funkcni zmeny (logika, API, komponenty):

| Soubor | Faze | Zmena |
|--------|------|-------|
| `prisma/schema.prisma` | 0 | +DealNegotiation, +DealComment, upravy FlipOpportunity, User |
| `lib/validators/marketplace.ts` | 1 | +createNegotiationSchema, +respondNegotiationSchema, +createMilestoneSchema |
| `app/api/marketplace/opportunities/[id]/payout/route.ts` | 1 | Zmena 40/40/20 → 5% + dynamic split |
| `app/api/marketplace/stats/route.ts` | 1 | Zmena carmaklerRevenue a dealer earnings kalkulace |
| `app/api/marketplace/opportunities/route.ts` | 1,5 | Pridat dealScore, split do response; trigger score calc |
| `app/api/marketplace/opportunities/[id]/route.ts` | 1,5 | Pridat negotiations, milestones, recalc score |
| `app/api/marketplace/opportunities/[id]/approve/route.ts` | 7 | Pridat notifikace |
| `components/web/marketplace/ProfitCalculator.tsx` | 1 | Dynamicky split, 5% Carmakler fee, slider |
| `components/web/marketplace/DealDetailClient.tsx` | 2,3 | Rebrand + prepracovat na tabbed layout |
| `components/web/marketplace/OpportunityCard.tsx` | 5,8 | Pridat DealScoreBadge + DealerRating |
| `components/web/marketplace/InvestorPortfolio.tsx` | 4 | Rozsirenena stats (nebo nahradit PortfolioDashboard) |
| `components/ui/PlatformSwitcher.tsx` | 2 | Pridat marketplace entry s labelem "CarMarketplace" |
| `app/(admin)/admin/marketplace/page.tsx` | 2 | Rebrand + link na CarMarketplace web |
| `app/(web)/marketplace/page.tsx` | 1,2 | Rebrand + aktualizace textu (provize, FAQ, ROI) |
| `app/(web)/marketplace/investor/page.tsx` | 2,4 | Rebrand + integrace PortfolioDashboard |
| `app/(web)/marketplace/deals/[id]/page.tsx` | 2,3 | Rebrand + fetch negotiations/milestones |
| `lib/stats.ts` | 1 | getMarketplaceStats — pridat carmakler revenue dle 5% modelu |

#### Rebrand textu "Marketplace" → "CarMarketplace" (Faze 2) — 21 souboru:

| Soubor | Pocet zmen |
|--------|-----------|
| `app/(web)/marketplace/page.tsx` | 4 (title, OG title, breadcrumb, CTA text) |
| `app/(web)/marketplace/apply/page.tsx` | 4 (title, OG title, breadcrumb, alert text) |
| `app/(web)/marketplace/dealer/page.tsx` | 2 (title, breadcrumb) |
| `app/(web)/marketplace/dealer/nova/page.tsx` | 3 (title, description, breadcrumb) |
| `app/(web)/marketplace/investor/page.tsx` | 2 (title, breadcrumb) |
| `app/(web)/marketplace/investor/[id]/layout.tsx` | 2 (title, description) |
| `app/(web)/marketplace/deals/[id]/page.tsx` | 1 (title) |
| `app/(web)/marketplace/deals/[id]/not-found.tsx` | 1 (link text) |
| `app/(admin)/admin/marketplace/page.tsx` | 2 (breadcrumb, h1) |
| `app/(admin)/admin/marketplace/[id]/page.tsx` | 1 (breadcrumb) |
| `app/(admin)/admin/marketplace/applications/page.tsx` | 1 (breadcrumb) |
| `app/(admin)/admin/marketplace/applications/[id]/page.tsx` | 1 (breadcrumb) |
| `components/marketplace/Navbar.tsx` | 1 (badge text) |
| `components/marketplace/Footer.tsx` | 1 (title) |
| `components/common/FooterBase.tsx` | 1 (platform label) |
| `components/admin/AdminSidebar.tsx` | 1 (sidebar label) |
| `components/web/marketplace/DealDetailClient.tsx` | 1 (breadcrumb) |
| `components/web/marketplace/DealerFlipDetail.tsx` | 1 (breadcrumb) |
| `lib/email-templates/marketplace-application-confirmation.ts` | ~9 (vsechny "marketplace" texty) |
| `lib/email-templates/marketplace-application-admin.ts` | ~3 (texty v emailech) |
| `middleware.ts` | 4 (pouze komentare, NE logika) |

---

## PORADI IMPLEMENTACE A ZAVISLOSTI

```
FAZE 0: DB Schema ─────────────────────┐
                                        ├──→ FAZE 1: Provizni model + Vyjednavani
FAZE 2: Navigace (PARALELNE) ──────────┤
                                        ├──→ FAZE 3: Deal Detail Tabs (ceka na 1)
                                        ├──→ FAZE 4: Portfolio Dashboard (ceka na 1)
                                        ├──→ FAZE 5: AI Deal Score (ceka na 0)
                                        ├──→ FAZE 6: Flip Progress Tracker (ceka na 0)
                                        ├──→ FAZE 7: Smart Notifications (ceka na 1, 6)
                                        └──→ FAZE 8: Dealer Reputation (ceka na 0)
```

**Doporuceny postup pro implementatora:**
1. Faze 0 (schema) — PRVNI
2. Faze 1 (provize) + Faze 2 (navigace) — PARALELNE
3. Faze 5 (deal score) + Faze 6 (progress) + Faze 8 (reputation) — PARALELNE (po fazi 0)
4. Faze 3 (tabs) — po fazi 1 (potrebuje NegotiationPanel)
5. Faze 4 (portfolio) — po fazi 1 (potrebuje novy provizni model)
6. Faze 7 (notifikace) — POSLEDNI (integruje se do vsech predchozich)

---

## STOP PRAVIDLA PRO IMPLEMENTATORA

1. **STOP pred migraci** — overit ze vsechna nova pole maji default/nullable
2. **STOP pred zmenou payout logiky** — stara 40/40/20 data musi fungovat (backward compatible — pokud agreedDealerSharePct je null, pouzit 40/40 jako fallback)
3. **STOP pred deploy** — overit ze vsechny hardcoded 0.4/0.4/0.2 reference jsou odstranene (7 mist z auditu)
4. **STOP** — nepouzivat external AI API pro deal score (pouzit jen vlastni Prisma data)
5. **STOP** — nescrapeovat extereni data pro trzni analyzu (jen vlastni FlipOpportunity history)

---

## ODHAD ROZSAHU

| Faze | Novych souboru | Upravenych souboru | Slozitost |
|------|---------------|-------------------|-----------|
| 0 — Schema | 0 (schema.prisma) | 1 | Nizka |
| 1 — Provize | 2 API + 1 komponenta | 5 | Vysoka |
| 2 — Navigace | 0 | 2 | Nizka |
| 3 — Tabs | 1 | 2 | Stredni |
| 4 — Portfolio | 1 API + 1 komponenta | 2 | Stredni |
| 5 — Deal Score | 1 lib + 1 komponenta | 3 | Stredni |
| 6 — Progress | 1 API + 1 komponenta | 1 | Stredni |
| 7 — Notifikace | 1 lib + 4 email templates | 4+ | Vysoka |
| 8 — Reputation | 1 lib + 1 komponenta | 2 | Nizka |
| **CELKEM** | **17 novych** | **~20 upravenych** | — |
