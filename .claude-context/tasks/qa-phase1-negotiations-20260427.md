# QA Report — Fáze 1: Provize + Vyjednávání (Task #17)

**Datum:** 2026-04-27  
**Autor:** Kontrolor  
**Soubory:** validators/marketplace.ts, api/marketplace/negotiations/route.ts, negotiations/[id]/respond/route.ts, opportunities/[id]/payout/route.ts, api/marketplace/stats/route.ts, components/web/marketplace/ProfitCalculator.tsx, NegotiationPanel.tsx, app/(web)/marketplace/page.tsx  
**Status: ✅ SCHVÁLENO — 2 minor issues, bez blokerů**

---

## VERDICT

Implementace splňuje všechna kritéria. Round 1 je správně omezen na VERIFIED_DEALER, respond jen adresát, accept zapisuje split do DB, payout počítá 5% z prodejní ceny + dohodnutý split, fallback 50/50, Zod na všech routes, build prošel, žádný 40/40/20. Migration existuje.

---

## 1. SIMPLIFY KONTROLA

- **negotiations/route.ts:** Čistá struktura POST + GET. Zrušení PENDING nabídek před novou (`updateMany → SUPERSEDED`) — správný přístup. ✅
- **respond/route.ts:** `prisma.$transaction` pro atomický ACCEPT (DealNegotiation + FlipOpportunity). COUNTER správně flipuje from/to a inkrementuje round. ✅
- **payout/route.ts:** Dvě větve (profit ≤ 0 a profit > 0). Investorský podíl rozpočítán poměrně podle výše investice. ✅
- **ProfitCalculator.tsx:** Dynamický, slider pro split, `isLocked` při dohodnutém splitu. ✅
- **NegotiationPanel.tsx:** Oddělená UI pro create (dealer) a respond (adresát). ✅

Žádné zbytečné abstrakce, žádná duplicita.

---

## 2. DEBUG KONTROLA

### Build
```
✓ Compiled successfully in 29.0s
✓ Generating static pages using 7 workers (1296/1296)
```
**Build: ✅ PASS** — bez chyb.

### Migration
```
20260427070000_carmarketplace_mvp_schema/migration.sql:
ALTER TABLE "FlipOpportunity" ADD COLUMN "agreedDealerSharePct" INTEGER;
ALTER TABLE "FlipOpportunity" ADD COLUMN "agreedInvestorSharePct" INTEGER;
ALTER TABLE "FlipOpportunity" ADD COLUMN "carmaklerFeePct" INTEGER NOT NULL DEFAULT 5;
+ CREATE TABLE "DealNegotiation" (...)
+ 4 indexy na DealNegotiation
```
✅ Migration existuje a odpovídá schema.prisma.

---

## 3. REVERZNÍ KONTROLA — BODOVÁ

### Kritérium 1: Round 1 = JEN VERIFIED_DEALER

**Soubor:** `api/marketplace/negotiations/route.ts:21-26`

```typescript
if (session.user.role !== "VERIFIED_DEALER" && session.user.role !== "ADMIN") {
  return NextResponse.json(
    { error: "Pouze dealer může vytvořit první nabídku" },
    { status: 403 }
  );
}
```

✅ INVESTOR nemůže volat POST — dostane 403.  
✅ `fromRole: "VERIFIED_DEALER"` je hardcoded v create.  
✅ Extra check: `opportunity.dealerId !== session.user.id → 403` (dealer nemůže vytvořit offer za jiného dealera).

---

### Kritérium 2: Respond = jen adresát (toUser)

**Soubor:** `negotiations/[id]/respond/route.ts:47`

```typescript
if (negotiation.toUserId !== session.user.id && session.user.role !== "ADMIN") {
  return NextResponse.json({ error: "Nemáte oprávnění odpovědět" }, { status: 403 });
}
```

✅ Pouze `toUserId` může odpovědět. ADMIN bypass pro moderaci.  
✅ Kontrola `negotiation.status !== "PENDING" → 400` zabrání dvojí odpovědi.

---

### Kritérium 3: Accept zapíše agreed split do FlipOpportunity

**Soubor:** `negotiations/[id]/respond/route.ts:59-74`

```typescript
await prisma.$transaction([
  prisma.dealNegotiation.update({ id, data: { status: "ACCEPTED", respondedAt: new Date() } }),
  prisma.flipOpportunity.update({
    id: negotiation.opportunityId,
    data: {
      agreedDealerSharePct: negotiation.dealerSharePct,
      agreedInvestorSharePct: negotiation.investorSharePct,
    },
  }),
]);
```

✅ Atomická operace. ✅ Zapisuje hodnoty z právě přijaté nabídky (ne klientský vstup).

---

### Kritérium 4: Payout = 5% z prodejní ceny + dohodnutý split

**Soubor:** `opportunities/[id]/payout/route.ts:107-120`

```typescript
const carmaklerFeePct = opportunity.carmaklerFeePct ?? 5;
const carmaklerShare = Math.floor(actualSalePrice * (carmaklerFeePct / 100)); // ← % ze SALE price ✅
const distributableProfit = actualProfit - carmaklerShare;

const dealerPct = opportunity.agreedDealerSharePct ?? 50;   // ← dohodnutý split
const investorPct = opportunity.agreedInvestorSharePct ?? 50;
```

✅ CarMakléř fee ze SALE price (ne ze zisku) — odpovídá novému modelu.  
✅ Dohodnutý split z DB (agreedDealerSharePct / agreedInvestorSharePct).  
✅ Stats route (`api/marketplace/stats/route.ts`) počítá carmaklerRevenue stejným vzorcem — konzistentní.  
✅ ProfitCalculator.tsx uses stejný vzorec (`salePrice * carmaklerFeePct / 100`).

---

### Kritérium 5: Fallback 50/50 pro staré dealy

```typescript
const dealerPct = opportunity.agreedDealerSharePct ?? 50;
const investorPct = opportunity.agreedInvestorSharePct ?? 50;
```

✅ Null → 50/50 fallback. Staré dealy (bez negotiation) payoutují jako 50/50.

---

### Kritérium 6: Zod validace na všech routes

| Route | Schema | Status |
|-------|--------|--------|
| `POST /api/marketplace/negotiations` | `createNegotiationSchema` | ✅ |
| `POST /api/marketplace/negotiations/[id]/respond` | `respondNegotiationSchema` | ✅ |
| `POST /api/marketplace/opportunities/[id]/payout` | `payoutSchema` | ✅ |
| `GET /api/marketplace/stats` | Bez body (params z session) | ✅ |

`respondNegotiationSchema` má `.refine()` pro COUNTER: vyžaduje `dealerSharePct` ✅

---

### Kritérium 7: npm run build

✅ `Compiled successfully in 29.0s` — 1296 stránek bez chyb.

---

### Kritérium 8: Landing page — žádné 40/40/20

Grep po `40/40/20`, `40.*%.*dealer`, `40.*%.*investor` v `app/(web)/marketplace/` → **prázdný výsledek** ✅

Landing page FAQ (line 88):
> "CarMakléř si účtuje **5 % z prodejní ceny** jako provizi. Zbytek čistého zisku se dělí mezi investora a realizátora v poměru, na kterém se dohodnou před zahájením flipu." ✅

---

## 4. MINOR ISSUES

### MINOR-1: NegotiationPanel — investorId je raw text input

**Soubor:** `NegotiationPanel.tsx:159-165`

```tsx
<input type="text" value={newInvestorId} placeholder="ID investora" />
```

Dealer musí vědět interní cuid investora (např. `clxxx123...`). UX issue — v produkci bude dealer potřebovat seznam investorů k výběru.  
**Závažnost:** Minor UX — logika API je správná, frontend je MVP placeholder.  
**Navrhované řešení:** Dropdown s investory nebo search (Fáze 2 feature).

---

### MINOR-2: Payout edge case — carmaklerFee > actualProfit

Pokud `actualProfit > 0` ale `carmaklerFee > actualProfit` (prodej s malým ziskem):
- `distributableProfit < 0`
- Dealer i investor dostanou 0 zisku navíc
- Investor dostane zpět původní investici ✅
- CarMakléř dostane 5% ze sale price (více než celkový zisk)
- Dealer de facto prodělá (ztráta = carmaklerFee - actualProfit)

Příklad: Koupeno 100k, oprava 10k, prodáno 112k. Zisk 2k. CarMakléř fee = 5.6k > 2k → distributableProfit = -3.6k. Dealer nese tuto ztrátu.

Kód to technicky zvládne správně (shares = 0), ale bez varování. Doporučení: v response přidat `warning: "CarMakléř fee překračuje zisk"` (non-blocking, informativní).

---

## 5. BEZPEČNOSTNÍ CHECK

| Oblast | Status |
|--------|--------|
| Auth check na všech endpoints | ✅ `session?.user?.id` + 401 |
| Role validace (VERIFIED_DEALER/INVESTOR/ADMIN) | ✅ granulární |
| Ownership check (dealer = dealerId) | ✅ |
| Payout jen ADMIN/BACKOFFICE | ✅ `ADMIN_ROLES.includes(role)` |
| Zod parsing před DB operacemi | ✅ všechny POST |
| `prisma.$transaction` pro atomické operace | ✅ ACCEPT + COUNTER |
| Nelze odpovědět dvakrát (status check) | ✅ `status !== "PENDING" → 400` |

---

## ZÁVĚR

**✅ SCHVÁLENO pro produkci**

Všechna kritéria splněna. Implementace je správná, bezpečná a konzistentní. Migration existuje. Build prošel. 2 minor issues (NegotiationPanel UX + payout edge case) jsou přijatelné pro MVP a neblokují nasazení.
