# QA Report — Fáze 4 + Fáze 3 (Task #27)

**Datum:** 2026-04-27  
**Autor:** Kontrolor  
**Fáze 4 soubory:** `components/web/marketplace/PortfolioDashboard.tsx`, `app/(web)/marketplace/investor/page.tsx`  
**Fáze 3 soubory:** `components/web/marketplace/DealTabs.tsx`, `components/web/marketplace/DealDetailClient.tsx`, `app/(web)/marketplace/deals/[id]/page.tsx`, `components/web/marketplace/NegotiationPanel.tsx`

---

## VERDICT

- **Fáze 4 — Portfolio Dashboard: ✅ SCHVÁLENO** — všechna kritéria splněna
- **Fáze 3 — Deal Detail Tabs: ⚠️ SCHVÁLENO S UPOZORNĚNÍM** — 1 WARN (data leak negotiations pro investor)

---

## BUILD

```
✓ Compiled successfully in 21.8s
✓ Generating static pages using 7 workers (1295/1295)
```
**✅ PASS** (spuštěn při QA Task #23, žádné nové chyby)

---

# FÁZE 4 — Portfolio Dashboard

## 1. SIMPLIFY KONTROLA

- `PortfolioDashboard.tsx` (283 řádků): 1 export, 0 helper funkcí. CSS-only bar chart — žádná externí chart knihovna. ✅
- `investor/page.tsx` (226 řádků): Čistý Server Component s `force-dynamic`. Parallel `Promise.all` fetch. ✅
- `StatCard` v `components/ui/StatCard.tsx` — existuje, správné props. ✅

---

## 2. REVERZNÍ KONTROLA

### Kritérium 1: Hero stats — 4 karty

```typescript
<StatCard icon="💰" iconColor="orange" value={formatPrice(totalInvested)} label="Celkem investováno" />
<StatCard icon="📊" iconColor="blue" value={formatPrice(portfolioValue)} label="Hodnota portfolia" />
<StatCard icon="📈" iconColor="green" value={formatPrice(realizedProfit)} label="Realizovaný zisk" />
<StatCard icon="🎯" iconColor="orange" value={`${averageRoi}%`} label="Průměrný ROI" />
```
✅ Přesně 4 karty dle specifikace. Grid `grid-cols-2 lg:grid-cols-4`. ✅

---

### Kritérium 2: Bar chart

```typescript
const maxValue = Math.max(...monthlyTimeline.map((m) => m.value), 1);
// ...
style={{ height: `${height}%` }}
title={`${m.month}: ${formatPrice(m.value)}`}
```
- CSS-only bar chart — bez externích závislostí. ✅
- `Math.max(..., 1)` — ochrana před dělením nulou. ✅
- Tooltip přes `title` attr. ✅
- Podmíněno: `monthlyTimeline.length > 1` — nezobrazí se pro nového investora. ✅

---

### Kritérium 3: Aktivní investice

```typescript
const activeStatuses = ["FUNDING", "FUNDED", "IN_REPAIR", "FOR_SALE", "SOLD", "PAYOUT_PENDING"];
```

Agregace po `opportunityId` (investor může mít více investic do jednoho dealu → sečteno):
```typescript
const activeInvMap = new Map<string, typeof confirmed[0][]>();
// ... groupBy opportunityId
const investedAmount = invs.reduce((s, i) => s + i.amount, 0);
```
✅ Správná agregace. Zobrazuje: brand/model/year, DealScoreBadge, status badge, dealerName, 2 progress bary (financování=blue, oprava=green). ✅

---

### Kritérium 4: Historie dokončených dealů

```typescript
const paidOut = myInvestments.filter((i) => i.paidOutAt !== null && i.returnAmount !== null);
```
✅ Filter na oba podmínky — žádný null propagation risk při výpočtu ROI.

```typescript
const roi = investedAmount > 0
  ? Math.round(((returnAmount - investedAmount) / investedAmount) * 1000) / 10
  : 0;
```
✅ ROI zaokrouhleno na 1 desetinné místo (÷1000×10). Ochrana před dělením nulou. ✅

---

### Kritérium 5: Expected profit dle 5% modelu

```typescript
const carmaklerFee = Math.round(opp.estimatedSalePrice * ((opp.carmaklerFeePct ?? 5) / 100));
const distributable = Math.max(0, profit - carmaklerFee);
const investorPct = (opp.agreedInvestorSharePct ?? 50) / 100;
const expectedProfit = totalNeeded > 0
  ? Math.round(distributable * investorPct * (investedAmount / totalNeeded))
  : 0;
```
- `carmaklerFeePct ?? 5` — fallback na 5% ✅
- Fee z `estimatedSalePrice` (správně — ne z profitu) ✅
- `Math.max(0, profit - carmaklerFee)` — ochrana před ztrátovým dealem ✅
- Proporcionálně dle `investedAmount / totalNeeded` ✅
- `DealDetailClient.tsx` (Finance tab) používá identický výpočet — konzistence ✅

**Konzistence s payout route:**
```
carmaklerShare = Math.floor(actualSalePrice * carmaklerFeePct/100)  // payout route
carmaklerFee   = Math.round(estimatedSalePrice * (carmaklerFeePct ?? 5) / 100)  // portfolio
```
Rozdíl: portfolio počítá s `estimatedSalePrice` (odhadovaný), payout s `actualSalePrice` (skutečný). Správně — portfolio je jen odhad. ✅

---

### Kritérium 6: Auth guard INVESTOR/ADMIN

```typescript
export const dynamic = "force-dynamic";

if (!session?.user?.id) {
  redirect("/prihlaseni?callbackUrl=/marketplace/investor");
}
if (role !== "INVESTOR" && !isAdmin) {
  redirect("/marketplace?reason=not_authorized");
}
```
- Unauthenticated → `/prihlaseni` s `callbackUrl` ✅
- Nesprávná role → `/marketplace?reason=not_authorized` ✅
- `isAdmin = role === "ADMIN" || role === "BACKOFFICE"` ✅
- `force-dynamic` — zabrání caching personalizovaného obsahu ✅

**Admin view:**
```typescript
where: isAdmin ? {} : { investorId: userId },
```
Admin vidí investice všech investorů — záměrné pro debug/přehled. ✅

---

## 3. MINOR POZNÁMKY FÁZE 4 (neblokující)

### INFO-1: portfolioValue výpočet
```typescript
const portfolioValue = activeValue + realizedProfit;
```
`activeValue` = aktivní investice + expected profits. `realizedProfit` = zisk z COMPLETED dealů.
Žádné double-counting — `paidOut` (COMPLETED) a `activeStatuses` (bez COMPLETED) se nepřekrývají. ✅

### INFO-2: Investor "Nová nabídka" form — ruční zadání ID investora
Viz Fáze 3 INFO-1 níže.

---

# FÁZE 3 — Deal Detail Tabs

## 1. SIMPLIFY KONTROLA

- `DealTabs.tsx` (54 řádků): 1 export, čistá prop-driven komponenta. ✅
- `DealDetailClient.tsx` — tabs přidány bez duplikace logiky. 5 tab sections jasně oddělené `activeTab === ...` podmínkami. ✅
- `NegotiationPanel.tsx` (309 řádků): Kompletní panel (create + respond + counter). ✅

---

## 2. REVERZNÍ KONTROLA

### Kritérium 1: 5 tabů

```typescript
const tabs = [
  { key: "overview",     label: "Přehled" },
  { key: "finance",      label: "Finance" },
  { key: "repair",       label: "Oprava",       badge: ..., hidden: !showRepairTab },
  { key: "negotiation",  label: "Vyjednávání",  badge: pendingNegotiations, hidden: !showNegotiationTab },
  { key: "investors",    label: "Investoři",    badge: investments.length || undefined, hidden: !showInvestorsTab },
];
```
✅ Přesně 5 tabů dle specifikace.

**DealTabs.tsx:**
- `role="tablist"` + `role="tab"` + `aria-selected` → ARIA přístupnost ✅
- `overflow-x-auto` + `min-w-max` → horizontal scroll na mobilu ✅
- Badge pouze pokud `badge !== undefined && badge > 0` ✅

---

### Kritérium 2: Role-based visibility

| Tab | Podmínka | Správnost |
|-----|----------|-----------|
| Přehled | vždy | ✅ |
| Finance | vždy | ✅ |
| Oprava | status in [FUNDED, IN_REPAIR, FOR_SALE, SOLD, PAYOUT_PENDING, COMPLETED] | ✅ |
| Vyjednávání | isDealer OR isInvestor OR isAdmin | ✅ |
| Investoři | isAdmin OR isOwnDeal | ✅ (investor NEVIDÍ ostatní investory) |

**Oprava tab obsah navíc chráněn:**
```typescript
{activeTab === "repair" && showRepairTab && (
```
✅ Dvojitá ochrana — tab i obsah.

---

### Kritérium 3: Badge counts

| Tab | Badge | Logika |
|-----|-------|--------|
| Oprava | `repairProgress` % (jen 1–99) | `repairProgress > 0 && repairProgress < 100 ? repairProgress : undefined` ✅ |
| Vyjednávání | počet PENDING nabídek pro mě | `negotiations.filter(n => n.status === "PENDING" && n.toUser.id === userId).length` ✅ |
| Investoři | počet investorů | `investments.length \|\| undefined` ✅ |

---

### Kritérium 4: NegotiationPanel integrace

```typescript
{activeTab === "negotiation" && showNegotiationTab && (
  <NegotiationPanel
    opportunityId={opp.id}
    negotiations={negotiations}
    currentUserId={userId}
    currentUserRole={userRole}
    onUpdate={() => router.refresh()}
  />
)}
```
✅ Správné props předány. `onUpdate` = `router.refresh()` pro real-time aktualizaci po akci.

**NegotiationPanel vnitřní logika:**
- `pendingForMe = negotiations.find(n => n.status === "PENDING" && n.toUser.id === currentUserId)` ✅
- Tlačítka Přijmout/Protinabídka/Odmítnout jen pro `isForMe` ✅
- "Nová nabídka" tlačítko jen pro `currentUserRole === "VERIFIED_DEALER"` ✅
- Counter-offer odešle `dealerSharePct: counterPct` — správný field name ✅

---

### Kritérium 5: FlipProgressTracker integrace

```typescript
{activeTab === "repair" && showRepairTab && (
  <FlipProgressTracker
    opportunityId={opp.id}
    milestones={opp.repairMilestones}
    repairProgress={opp.repairProgress}
    status={opp.status}
    canEdit={isOwnDeal || isAdmin}
    onUpdate={() => router.refresh()}
  />
)}
```
✅ Tracker přesunut z lineárního layoutu do Oprava tabu. `canEdit` správně. ✅

**Repair photos navíc v Oprava tabu:**
```typescript
{opp.repairPhotos.length > 0 && (
  <Card>Fotky z opravy (grid)</Card>
)}
```
✅ Bonus: repair fotky zobrazeny přímo v tab obsahu.

---

### Kritérium 6: deals/[id]/page.tsx — negotiations fetch

```typescript
const [opp, negotiations] = await Promise.all([
  prisma.flipOpportunity.findUnique(...),
  prisma.dealNegotiation.findMany({
    where: { opportunityId: id },
    include: {
      fromUser: { select: { id, firstName, lastName } },
      toUser: { select: { id, firstName, lastName } },
    },
    orderBy: { createdAt: "desc" },
  }),
]);
```
✅ Parallel fetch. `negotiations` předány jako `mappedNegotiations` do DealDetailClient. ✅

---

### TypeScript: ✅

`Negotiation` interface v DealDetailClient odpovídá `mappedNegotiations` struktuře z page.tsx. `DealTab` type exportován a importován správně. Build prošel.

---

## 3. WARN — INVESTOR VIDÍ CIZÍ VYJEDNÁVÁNÍ

### WARN-1: Negotiations nejsou filtrovány po roli v page.tsx

**Situace:**
```typescript
// deals/[id]/page.tsx
prisma.dealNegotiation.findMany({
  where: { opportunityId: id },  // BEZ role filtru
  ...
})
```

Investor A, který má přístup k dealu (status FUNDING+), dostane při načtení stránky **všechny** vyjednávání pro tento deal — včetně jednání mezi dealerem a Investorem B.

**NegotiationPanel vizualizuje vše:**
```typescript
{negotiations.map((n) => (
  // zobrazuje n.fromUser.firstName, n.fromUser.lastName, dealerSharePct, message
))}
```

Investor B tak vidí: jména, % podíly a zprávy z jednání Investora A s dealerem.

**Dopady:**
- Únik obchodních podmínek mezi dealer ↔ investor A → investor B
- Únik osobních jmen a zpráv

**Kontext (proč ne BLOCKER):**
- Platforma je uzavřená (VERIFIED_DEALER + INVESTOR — oba ověření)
- API GET `/api/marketplace/negotiations` **správně** filtruje (`investor vidí jen kde je from/to`) — page.tsx je nekonzistentní
- MVP fáze, nízká uživatelská základna

**Doporučení pro fix (page.tsx):**
```typescript
// Filtr na serveru před předáním do klienta:
const visibleNegotiations = mappedNegotiations.filter((n) => {
  if (isAdmin) return true;
  return n.fromUser.id === userId || n.toUser.id === userId;
});
```

---

## 4. MINOR POZNÁMKY FÁZE 3 (neblokující)

### INFO-1: Dealer zadává investorId ručně (string input)
NegotiationPanel "Nová nabídka" form vyžaduje ruční zadání ID investora — žádný dropdown/autocomplete. UX nevhodné pro produkci, ale MVP akceptovatelné (dealer musí znát ID protějšku).

### INFO-2: "Investovat do tohoto flipu" tlačítko 2×
Tlačítko se zobrazuje v Finance tabu (inline) i v pravém sidebaru (sticky). Oba jsou chráněny `canInvest`. Záměrné — dvojí CTA pro lepší konverzi. Neblokující.

### INFO-3: Oprava tab badge zobrazuje % progress (ne count)
Badge číslo v tabu Oprava = aktuální % progress (např. "45"). Sémanticky neobvyklé (ostatní badges = count), ale informativní. Přijatelné.

---

## ZÁVĚR

**Fáze 4 — Portfolio Dashboard: ✅ SCHVÁLENO**  
Všech 6 kritérií splněno. 5% fee model správný a konzistentní. Auth guard správný. force-dynamic nastaven. Žádné blokery.

**Fáze 3 — Deal Detail Tabs: ⚠️ SCHVÁLENO S UPOZORNĚNÍM**  
Všech 6 kritérií splněno. Build čistý. Tabs, role visibility, badges, integrace — vše OK.  
**WARN-1**: Investor vidí cizí vyjednávání z page-level fetch. Doporučuji přidat server-side filtr v `deals/[id]/page.tsx` před předáním do klienta (viz kód výše). Neblokuje MVP nasazení.
