# Plan: Marketplace VIP Deal Detail Page (`/marketplace/deals/[id]`)

**Datum:** 2026-04-26
**Status:** PLAN READY
**Kontext:** Sjednocená detail stránka pro investory i dealery s role-based zobrazením

---

## Analýza aktuálního stavu

### Existující implementace — DVĚ oddělené detail stránky

| Stránka | Soubor | Typ | Gating |
|---------|--------|-----|--------|
| Investor detail | `app/(web)/marketplace/investor/[id]/page.tsx` | Client Component | middleware: INVESTOR, ADMIN, BACKOFFICE |
| Dealer detail | `app/(web)/marketplace/dealer/[id]/page.tsx` | Server Component | middleware: VERIFIED_DEALER, ADMIN, BACKOFFICE |

**Problém:** Dvě stránky zobrazují STEJNÝ FlipOpportunity záznam, ale s různým UI a různými akcemi. ADMIN musí přepínat mezi dvěma URL pro jeden deal. Není jednotný pohled.

### Existující komponenty k reuse

| Komponenta | Soubor | Funkce | Stav |
|------------|--------|--------|------|
| `FlipTimeline` | `components/web/marketplace/FlipTimeline.tsx` | 7-krokový timeline (APPROVED→COMPLETED) | ✅ Kompletní, desktop+mobile |
| `ProfitCalculator` | `components/web/marketplace/ProfitCalculator.tsx` | Kalkulace + profit split (40/40/20) | ✅ Kompletní, readOnly mode |
| `InvestModal` | `components/web/marketplace/InvestModal.tsx` | Investiční modal + platební instrukce | ✅ Kompletní |
| `OpportunityCard` | `components/web/marketplace/OpportunityCard.tsx` | Karta v listingu | ✅ Kompletní |
| `DealerFlipDetail` | `components/web/marketplace/DealerFlipDetail.tsx` | Dealer pohled (foto upload, status update) | ✅ Kompletní |
| `ProgressBar` | `components/ui/ProgressBar.tsx` | Funding progress | ✅ Existuje |
| `Badge` | `components/ui/Badge.tsx` | Status badge | ✅ Existuje |

### Existující API

| Endpoint | Metoda | Auth | Funkce |
|----------|--------|------|--------|
| `/api/marketplace/opportunities/[id]` | GET | VERIFIED_DEALER, INVESTOR, ADMIN, BACKOFFICE | Detail + investments (filtrováno dle role) |
| `/api/marketplace/opportunities/[id]` | PUT | Dealer (vlastní) + ADMIN | Update dat, status transitions |
| `/api/marketplace/opportunities/[id]/approve` | POST | ADMIN, BACKOFFICE | Schválení/zamítnutí |
| `/api/marketplace/opportunities/[id]/payout` | POST | ADMIN, BACKOFFICE | Výplata po prodeji |
| `/api/marketplace/investments` | POST | INVESTOR, ADMIN, BACKOFFICE | Nová investice |
| `/api/marketplace/investments/[id]/confirm-payment` | PUT | ADMIN, BACKOFFICE | Potvrzení platby |

### Prisma modely

**FlipOpportunity** (`schema.prisma:1295-1338`):
- `id, dealerId, brand, model, year, mileage, vin, condition`
- `photos` (JSON string), `purchasePrice, repairCost, estimatedSalePrice`
- `repairDescription, repairPhotos` (JSON string), `actualSalePrice, soldAt`
- `status` (PENDING_APPROVAL → APPROVED → FUNDING → FUNDED → IN_REPAIR → FOR_SALE → SOLD → PAYOUT_PENDING → COMPLETED)
- `fundedAmount` (default 0), `adminNotes, rejectionReason`
- `investments Investment[]`

**Investment** (`schema.prisma:1340-1362`):
- `id, investorId, opportunityId, amount`
- `paymentStatus` (PENDING, CONFIRMED, REFUNDED)
- `paymentReference, returnAmount, paidOutAt`

### Middleware gating (middleware.ts:17-18)

```typescript
const MARKETPLACE_DEALER_ROLES = ["VERIFIED_DEALER", "ADMIN", "BACKOFFICE"];
const MARKETPLACE_INVESTOR_ROLES = ["INVESTOR", "ADMIN", "BACKOFFICE"];
```

Middleware chrání `/marketplace/dealer/*` a `/marketplace/investor/*` odděleně. Neautorizovaní → redirect na `/marketplace?reason=not_authorized`.

### API gating (opportunities/[id]/route.ts:25-26)

```typescript
const MARKETPLACE_ALLOWED_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"];
```

API GET endpoint **už podporuje všechny marketplace role** — filtruje investments podle role (investor vidí jen své, admin/dealer vidí vše).

---

## Plán implementace

### Architektonické rozhodnutí: Nová sjednocená stránka

**Přístup:** Vytvořit novou `/marketplace/deals/[id]` stránku jako **jednotný vstupní bod** pro všechny role. Staré stránky (`/investor/[id]`, `/dealer/[id]`) zachovat jako redirecty pro zpětnou kompatibilitu.

**Důvody:**
1. ADMIN potřebuje vidět vše na jednom místě (dealer akce + investor přehled + admin akce)
2. Investor a dealer mají různé akce, ale kontext (auto, kalkulace, timeline) je identický
3. API endpoint `GET /api/marketplace/opportunities/[id]` už filtruje data podle role
4. Eliminuje duplicitní kód mezi investor/dealer detail

### Krok 1: Nová stránka `/marketplace/deals/[id]`

**Nový soubor:** `app/(web)/marketplace/deals/[id]/page.tsx`

Server Component — fetchne data z DB (jako dealer page), předá do klientské komponenty.

```tsx
// Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DealDetailClient } from "@/components/web/marketplace/DealDetailClient";

const ALLOWED_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"];

export default async function DealDetailPage({ params }) {
  const session = await getServerSession(authOptions);
  
  // Auth + role check
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/marketplace?reason=not_authorized");
  }
  
  const { id } = await params;
  const opp = await prisma.flipOpportunity.findUnique({
    where: { id },
    include: {
      dealer: { select: { id, firstName, lastName, companyName, avatar } },
      investments: {
        include: { investor: { select: { id, firstName, lastName } } },
      },
    },
  });
  
  if (!opp) notFound();
  
  // Role-based data filtering
  const userRole = session.user.role;
  const userId = session.user.id;
  
  // Investor nevidí investice ostatních
  const investments = userRole === "INVESTOR"
    ? opp.investments.filter(inv => inv.investorId === userId)
    : opp.investments;
  
  // Dealer nevidí PENDING_APPROVAL jiného dealera
  if (userRole === "VERIFIED_DEALER" && opp.dealerId !== userId) {
    redirect("/marketplace?reason=not_authorized");
  }
  
  // Investor nevidí PENDING_APPROVAL
  if (userRole === "INVESTOR" && opp.status === "PENDING_APPROVAL") {
    redirect("/marketplace?reason=not_authorized");
  }
  
  return <DealDetailClient opportunity={...} investments={...} userRole={userRole} userId={userId} />;
}
```

**Metadata:** `robots: { index: false, follow: false }` — VIP obsah, ne-indexovatelný.

### Krok 2: DealDetailClient — hlavní klientská komponenta

**Nový soubor:** `components/web/marketplace/DealDetailClient.tsx`

"use client" komponenta, **role-aware** — zobrazuje různé sekce podle `userRole`:

#### Layout (všechny role):

```
+--------------------------------------------------+
| Breadcrumb: Marketplace / Deals / BMW 320d        |
+--------------------------------------------------+
| H1: BMW 320d F30                                  |
| 2015 · 145 000 km · Stav: Dobrý       [ROI +36%] |
|                                    [Badge: status] |
+--------------------------------------------------+
| FlipTimeline (APPROVED → ... → COMPLETED)         |
+--------------------------------------------------+
|                                                    |
| MAIN (2/3)                    | SIDEBAR (1/3)     |
| ┌─────────────────────┐      | ┌───────────────┐  |
| │ Photo gallery       │      | │ ProfitCalc    │  |
| │ (swipeable)         │      | │ (readOnly)    │  |
| └─────────────────────┘      | │ + profit split│  |
| ┌─────────────────────┐      | └───────────────┘  |
| │ Funding progress    │      | ┌───────────────┐  |
| │ (if FUNDING)        │      | │ Dealer info   │  |
| └─────────────────────┘      | │ avatar, jméno │  |
| ┌─────────────────────┐      | │ počet flipů   │  |
| │ Vehicle info        │      | └───────────────┘  |
| │ brand, model, year  │      | ┌───────────────┐  |
| │ mileage, VIN, stav  │      | │ AKCE (role)   │  |
| └─────────────────────┘      | │ [Investovat]  │  |
| ┌─────────────────────┐      | │ [Upload foto] │  |
| │ Repair plan         │      | │ [Schválit]    │  |
| │ (pokud existuje)    │      | └───────────────┘  |
| └─────────────────────┘      |                     |
| ┌─────────────────────┐      |                     |
| │ ROLE-SPECIFIC       │      |                     |
| │ (viz níže)          │      |                     |
| └─────────────────────┘      |                     |
+--------------------------------------------------+
```

#### Role-specific sekce:

| Sekce | INVESTOR | VERIFIED_DEALER | ADMIN |
|-------|----------|-----------------|-------|
| Photo gallery | ✅ View only | ✅ View + upload | ✅ View only |
| Funding progress | ✅ + tlačítko "Investovat" | ✅ View only | ✅ View only |
| Vehicle info | ✅ | ✅ | ✅ |
| Repair plan + photos | ✅ View only | ✅ + upload repair photos | ✅ View only |
| Investor list | ❌ (jen vlastní investice) | ✅ Všichni investoři | ✅ Všichni investoři |
| "Investovat" CTA | ✅ (pokud FUNDING) | ❌ | ❌ |
| "Označit jako dokončené" | ❌ | ✅ (pokud IN_REPAIR) | ❌ |
| "Upload repair photos" | ❌ | ✅ (pokud IN_REPAIR/FOR_SALE) | ❌ |
| Admin panel | ❌ | ❌ | ✅ (schválení, zamítnutí, notes, payout) |
| Admin notes | ❌ | ❌ | ✅ |

#### Investovat flow (investor):

1. Klik "Investovat" → `InvestModal` (existuje, plně funkční)
2. Zadá částku (min 10 000 Kč, max zbývající)
3. Souhlas s podmínkami
4. POST `/api/marketplace/investments`
5. Zobrazí platební instrukce (číslo účtu, VS)

#### Dealer akce:

1. **Upload repair photos** — existuje v `DealerFlipDetail.tsx` (lines 55-99), reuse logiku
2. **Označit jako dokončené** — PUT status IN_REPAIR → FOR_SALE (existuje, lines 101-125)

#### Admin panel (NOVÉ):

```
+--------------------------------------------------+
| ADMIN PANEL                                       |
+--------------------------------------------------+
| Status: [FUNDING ▾]  ← dropdown pro přímou změnu |
|                                                    |
| Admin poznámky:                                    |
| [________________________________]                 |
| [________________________________]                 |
|                                                    |
| Akce:                                              |
| [Schválit] [Zamítnout] ← PENDING_APPROVAL only   |
| [Vyplatit investory]    ← SOLD only               |
|                                                    |
| Skutečná prodejní cena: [________] Kč             |
| (zobrazí se při payoutu)                           |
+--------------------------------------------------+
```

**Admin může:**
1. Měnit status přímo (dropdown) — PUT `/api/marketplace/opportunities/[id]`
2. Psát admin notes
3. Schválit/zamítnout (PENDING_APPROVAL) — POST `.../approve`
4. Provést payout (SOLD) — POST `.../payout` s actualSalePrice
5. Vidět všechny investice + jejich paymentStatus

### Krok 3: Finanční kalkulátor — vylepšení

Existující `ProfitCalculator` počítá:
- `totalCost = purchasePrice + repairCost`
- `totalProfit = estimatedSalePrice - totalCost`
- `ROI = (profit / totalCost) * 100`
- Split: 40% investor, 40% dealer, 20% platform

**Přidat do kalkulátoru:**

1. **Investor-specific výpočet** (pokud je role INVESTOR):
   ```
   Vaše investice:        50 000 Kč
   Váš podíl:             22.2% (z totalNeeded)
   Váš podíl na zisku:    40% × 22.2% = 8.9% z celkového zisku
   Odhadovaný výnos:      6 580 Kč
   Celkem vráceno:        56 580 Kč
   Váš ROI:               +13.2%
   ```

2. **Actual vs Estimated** (pokud status >= SOLD a actualSalePrice existuje):
   ```
   Odhadovaná prodejní cena:  389 000 Kč
   Skutečná prodejní cena:    395 000 Kč  ← zelená (vyšší)
   Rozdíl:                    +6 000 Kč (+1.5%)
   ```

**Edit:** `components/web/marketplace/ProfitCalculator.tsx`
- Přidat props: `actualSalePrice?: number`, `investorAmount?: number`, `totalNeeded?: number`
- Přidat sekci "Vaše investice" pokud investorAmount > 0
- Přidat sekci "Skutečný výsledek" pokud actualSalePrice > 0

### Krok 4: Photo gallery

Aktuálně: investor detail zobrazuje jen 1 fotku (`photos[0]`). Dealer detail také jen 1 fotku.

**Nová komponenta:** `components/web/marketplace/DealPhotoGallery.tsx`

```tsx
interface DealPhotoGalleryProps {
  photos: string[];          // Fotky auta
  repairPhotos: string[];    // Fotky z opravy
  canUpload?: boolean;       // Dealer v IN_REPAIR/FOR_SALE
  onUpload?: (files: FileList) => void;
}
```

- Hlavní fotka velká (aspect-video)
- Thumbnails pod ní (grid 4-6 fotek)
- Klik na thumbnail → změní hlavní fotku
- Tabs: "Auto" / "Oprava" (pokud repairPhotos.length > 0)
- Pokud `canUpload` → drag&drop zóna + tlačítko "Přidat fotky"

**Složitost:** MALÁ (jednoduchý state management, žádné swipe knihovny nutné)

### Krok 5: Middleware — přidat `/marketplace/deals` gating

**Edit:** `middleware.ts`

Přidat nový blok pro `/marketplace/deals`:

```typescript
// Chráněné marketplace deal detail routy
if (pathname.startsWith("/marketplace/deals")) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    const applyUrl = new URL("/marketplace/apply", request.url);
    applyUrl.searchParams.set("reason", "auth_required");
    return NextResponse.redirect(applyUrl);
  }
  
  const MARKETPLACE_ALL_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"];
  if (!MARKETPLACE_ALL_ROLES.includes(token.role as string)) {
    const landingUrl = new URL("/marketplace", request.url);
    landingUrl.searchParams.set("reason", "not_authorized");
    return NextResponse.redirect(landingUrl);
  }
}
```

### Krok 6: Redirecty ze starých URL

**Edit:** `next.config.ts` — přidat redirecty:

```typescript
// Marketplace deal detail redirecty (sjednocení)
// POZNÁMKA: Redirecty nelze použít protože [id] je dynamický segment.
// Místo toho: redirect v samotných stránkách.
```

**Lepší řešení — redirect přímo v page components:**

**Edit:** `app/(web)/marketplace/investor/[id]/page.tsx`
```tsx
import { redirect } from "next/navigation";
export default function InvestorDetailPage({ params }) {
  const { id } = await params;
  redirect(`/marketplace/deals/${id}`);
}
```

**Edit:** `app/(web)/marketplace/dealer/[id]/page.tsx`
```tsx
import { redirect } from "next/navigation";
export default async function DealerDetailPage({ params }) {
  const { id } = await params;
  redirect(`/marketplace/deals/${id}`);
}
```

### Krok 7: Aktualizovat OpportunityCard link

**Edit:** `components/web/marketplace/OpportunityCard.tsx`

```diff
- <Link href={`${linkPrefix}/${id}`} className="no-underline block">
+ <Link href={`/marketplace/deals/${id}`} className="no-underline block">
```

Prop `linkPrefix` se stane deprecated (ale zachovat pro zpětnou kompatibilitu).

### Krok 8: Aktualizovat investor + dealer dashboard linky

**Edit:** `app/(web)/marketplace/investor/page.tsx`
- OpportunityCard již odkazuje na `/marketplace/deals/[id]` po kroku 7

**Edit:** `app/(web)/marketplace/dealer/page.tsx` (pokud používá vlastní linky)
- Aktualizovat linky na `/marketplace/deals/[id]`

---

## Souhrn změn

| Soubor | Akce | Složitost |
|--------|------|-----------|
| `app/(web)/marketplace/deals/[id]/page.tsx` | NOVÝ | STŘEDNÍ (server component, role check, data fetch) |
| `app/(web)/marketplace/deals/[id]/loading.tsx` | NOVÝ | TRIVIÁLNÍ (skeleton) |
| `app/(web)/marketplace/deals/[id]/not-found.tsx` | NOVÝ | TRIVIÁLNÍ |
| `components/web/marketplace/DealDetailClient.tsx` | NOVÝ | VELKÁ (hlavní komponenta, role-based sections) |
| `components/web/marketplace/DealPhotoGallery.tsx` | NOVÝ | MALÁ (gallery + tabs) |
| `components/web/marketplace/DealAdminPanel.tsx` | NOVÝ | STŘEDNÍ (status dropdown, approve/reject, payout) |
| `components/web/marketplace/ProfitCalculator.tsx` | EDIT | MALÁ (investor-specific calc, actual vs estimated) |
| `middleware.ts` | EDIT | TRIVIÁLNÍ (přidat /marketplace/deals gating) |
| `app/(web)/marketplace/investor/[id]/page.tsx` | EDIT | TRIVIÁLNÍ (redirect) |
| `app/(web)/marketplace/dealer/[id]/page.tsx` | EDIT | TRIVIÁLNÍ (redirect) |
| `components/web/marketplace/OpportunityCard.tsx` | EDIT | TRIVIÁLNÍ (link prefix) |

**Celkem: 6 nových souborů, 4 edity. Žádné Prisma změny. Žádné nové API endpointy.**

---

## Prisma změny

**ŽÁDNÉ.** Všechny modely a relace existují. Všechny API endpointy existují a jsou funkční. Stačí nové UI.

---

## Bezpečnost

1. **Server-side auth:** Session check + role check v page.tsx (SSR)
2. **Middleware gating:** `/marketplace/deals/*` chráněno middleware → neauth → redirect
3. **Data filtering:** Investor vidí jen vlastní investice (stejná logika jako v existujícím API)
4. **Dealer isolation:** Dealer vidí jen vlastní dealy
5. **Admin panel:** Jen pro ADMIN/BACKOFFICE role, schované pro ostatní
6. **CSRF:** NextAuth session

---

## Pořadí implementace

1. **Middleware gating** (triviální, okamžitá ochrana)
2. **DealDetailClient** + **DealPhotoGallery** (hlavní UI)
3. **DealAdminPanel** (admin funkce)
4. **ProfitCalculator vylepšení** (investor-specific calc)
5. **Server page** + loading/not-found
6. **Redirecty** ze starých URL
7. **OpportunityCard link update**

---

## Wireframe — kompletní stránka

```
+================================================================+
| Marketplace / Deals / BMW 320d F30                              |
+================================================================+
|                                                                  |
| BMW 320d F30                              [ROI +36%]            |
| 2015 · 145 000 km                   [Badge: V opravě]          |
|                                                                  |
+------------------------------------------------------------------+
| ✓ Schváleno → ✓ Financování → ✓ Financováno → 🔧 Oprava → ...  |
+------------------------------------------------------------------+
|                                                                  |
| +---------------------------+  +-----------------------------+   |
| |                           |  | KALKULACE ZISKU             |   |
| |   [Hlavní fotka auta]     |  | Nákup:    220 000 Kč       |   |
| |                           |  | Oprava:    65 000 Kč       |   |
| |                           |  | Prodej:   389 000 Kč       |   |
| +---------------------------+  | ─────────────────────       |   |
| [thumb] [thumb] [thumb]       | Celkové náklady: 285 000    |   |
| [Auto] [Oprava]               | Celkový zisk:    104 000    |   |
|                                | ROI: +36.5%                 |   |
| +---------------------------+  | ─────────────────────       |   |
| | STAV FINANCOVÁNÍ          |  | Investor (40%): 41 600     |   |
| | ████████████░░░ 82%       |  | Realizátor (40%): 41 600   |   |
| | 233 700 / 285 000 Kč     |  | CarMakléř (20%): 20 800    |   |
| | Zbývá: 51 300 Kč         |  +-----------------------------+   |
| +---------------------------+                                    |
|                                +-----------------------------+   |
| +---------------------------+  | REALIZÁTOR                  |   |
| | INFORMACE O VOZIDLE       |  | [avatar] Jan Novák          |   |
| | Značka:  BMW              |  | Ověřený realizátor          |   |
| | Model:   320d F30         |  | 12 dokončených flipů       |   |
| | Rok:     2015             |  +-----------------------------+   |
| | Najeto:  145 000 km       |                                   |
| | VIN:     WBAXXXXXXX       |  +-----------------------------+   |
| | Stav:    Dobrý            |  | [Investovat do tohoto flipu]|   |
| +---------------------------+  +-----------------------------+   |
|                                                                  |
| +---------------------------+  +-----------------------------+   |
| | PLÁN OPRAVY               |  | ADMIN PANEL ← jen ADMIN    |   |
| | Výměna turbodmychadla,    |  | Status: [IN_REPAIR ▾]      |   |
| | oprava klimatizace,       |  | Admin notes: [________]    |   |
| | nový lak...               |  | [Schválit] [Zamítnout]     |   |
| +---------------------------+  | [Vyplatit investory]        |   |
|                                +-----------------------------+   |
| +---------------------------+                                    |
| | INVESTOŘI (3)             |  ← jen dealer/admin vidí          |
| | [avatar] Investor 1: 100k|                                    |
| | [avatar] Investor 2:  80k|                                    |
| | [avatar] Investor 3:  53k|                                    |
| +---------------------------+                                    |
+================================================================+
```

---

## Poznámky

1. **Žádné nové API endpointy** — všechny operace (invest, approve, payout, update) mají existující endpointy
2. **DealerFlipDetail.tsx** se stane deprecated po migraci — logika upload/status change se přesune do `DealDetailClient`
3. **InvestModal** se reuse beze změn — props interface je kompatibilní
4. **FlipTimeline** se reuse beze změn
5. **PENDING_APPROVAL** stav se nezobrazuje investorům — redirect v server component
