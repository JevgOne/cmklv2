---
task_id: 154
title: "#88a — Wolt model dispatch (Partner commissions + Stripe split + audit log)"
status: ready_for_implementation
scope: focused_implementation_dispatch
parent_plan: plan-task-76.md §0 (Wolt 1:1 marketplace model)
extracted_by: planovac
extracted_at: 2026-04-07
blocks: none
blocked_by: none
related_tasks:
  - "#76 (superseded, split into #88a/#88b/#88c)"
  - "#88b (Vision OCR scanner — out of scope here)"
  - "#88c (PWA dispatch flow — out of scope here)"
  - "#80/#90 (Legal terms — completed, unblocks commission)"
---

# #88a — Wolt Model Implementation Dispatch

**Source:** Extracted from `plan-task-76.md` §0.1–§0.8 (Wolt 1:1 marketplace model)
**Purpose:** Focused implementační dispatch pro implementator — obsahuje VŠECHNO potřebné pro #88a BEZ závislostí na #88b (Vision OCR) nebo #88c (PWA dispatch).

---

## 1. Executive Summary

Implementuj **commission-based payment split** pro Wolt 1:1 marketplace model v eshopu autodílů:

- **Admin UI** pro nastavení komise per Partner (12–20%, default 15%, audit log)
- **Prisma schema** rozšíření: `Partner.commissionRate` + nový `PartnerCommissionLog` + `OrderItem` 3 nová pole
- **Stripe Connect dynamic split** v existujícím webhooku — po zaplacení objednávky se částka rozdělí mezi vrakoviště (supplier payout) a Carmakler (fee) podle `Partner.commissionRate`
- **Reporting endpoint** pro admin — přehled průměrné komise, distribuce, Y2D fees

### V SCOPE (#88a)
- ✅ Prisma migrace (Partner + PartnerCommissionLog + OrderItem fields)
- ✅ Admin UI extension (PartnerDetail.tsx + 3 net-new komponenty)
- ✅ API endpoints: PATCH commission, GET history, GET summary
- ✅ Stripe webhook rozšíření (handleOrderPayment)
- ✅ Audit log pattern (oldRate → newRate s reason + changedBy)

### OUT OF SCOPE (#88a) — summary, detailní seznam v §13
- ❌ Vision OCR scanner + ZXing barcode (#88b)
- ❌ Voice input (#88b)
- ❌ PWA scan UI + offline queue + 5-tier flow (#88c)
- ❌ Touch target audit (#88c)
- ❌ Pilot rollout (#88c+)
- ❌ Legacy `(partner)/partner/parts/new` cleanup (post-#88c)
- ❌ Stripe Connect onboarding UI pro vrakoviště (→ §7 Q1, samostatný task)

---

## 2. Pre-flight Verification (implementator musí ověřit PŘED kódováním)

### V1. Stripe Connect onboarding status
**Otázka:** Má Partner (nebo User.partnerAccount) už pole `stripeAccountId`?
**Zjištění plánovače:** `grep stripeAccountId prisma/schema.prisma` → **NO MATCHES**. Partner model nemá `stripeAccountId`.

**Akce implementátora:**
1. Potvrdit grepom `stripeAccountId` v celém repo
2. Pokud pole neexistuje → přidat do Partner modelu v rámci tohoto dispatch
3. Pokud existuje onboarding flow jinde → propojit

**Rozhodnutí v plánu:** Přidat `Partner.stripeAccountId String?` jako součást migrace — onboarding UI (Stripe Connect Express) je OUT OF SCOPE #88a (escalate pokud chybí), ale **sloupec musí existovat**, aby webhook extension fungoval.

### V2. OrderItem → Partner resolution path
**Zjištění plánovače:** `OrderItem.supplierId → User.id`. Partner má `Partner.userId → User.id`. Inverzní relace `User.partnerAccount: Partner?` už **existuje** (confirmed v `app/api/stripe/webhook/route.ts:214` — `partnerAccount: { select: {...} }`).

**Resolution path pro webhook:**
```
OrderItem → supplier (User) → partnerAccount (Partner) → commissionRate
```

**Akce implementátora:** Potvrdit existenci `User.partnerAccount` inverzní relace čtením User modelu (schema.prisma:13+). Pokud neexistuje → přidat.

### V3. Legal gate status (#80/#90)
**Zjištění:** Per memory `MEMORY.md` — #80 Legal T&C je completed (via #90). Commission billing má právní podklad (§0.6 plan-task-76.md).
**Akce:** Žádná — pokud lead nepovie jinak.

---

## 3. Prisma Schema Migration

### 3.1 Partner model — nová pole
**Umístění:** `prisma/schema.prisma:1645` (stávající Partner model)

```prisma
model Partner {
  // ... existující pole (name, type, ico, address, ...)

  // === NEW: Commission ===
  commissionRate    Decimal  @default(15.00) @db.Decimal(4, 2)
  commissionRateAt  DateTime @default(now())
  stripeAccountId   String?  // Stripe Connect Express account (onboarding out of scope #88a)
  commissionLog     PartnerCommissionLog[]

  // ... zbytek (managerId, userId, activities, leads, ...)
}
```

**Poznámka k rozsahu:** `Decimal(4,2)` umožňuje 00.00 až 99.99 — dostatečné pro business range 12.00–20.00.

### 3.2 PartnerCommissionLog — nový model
**Umístění:** `prisma/schema.prisma` — přidat za Partner model (~line 1694, před PartnerActivity)

```prisma
model PartnerCommissionLog {
  id           String   @id @default(cuid())
  partnerId    String
  partner      Partner  @relation(fields: [partnerId], references: [id], onDelete: Cascade)
  oldRate      Decimal  @db.Decimal(4, 2)
  newRate      Decimal  @db.Decimal(4, 2)
  reason       String?  // Důvod změny (povinný per Evžen recommendation — viz §7 Q2)
  changedById  String
  changedBy    User     @relation("PartnerCommissionChanger", fields: [changedById], references: [id])
  changedAt    DateTime @default(now())

  @@index([partnerId, changedAt])
}
```

**User inverse relation:** Přidat do User modelu (schema.prisma:13+) nový field:
```prisma
commissionChanges PartnerCommissionLog[] @relation("PartnerCommissionChanger")
```

### 3.3 OrderItem — nová pole pro split snapshot
**Umístění:** `prisma/schema.prisma:1060` (stávající OrderItem)

```prisma
model OrderItem {
  // ... existující (orderId, partId, supplierId, quantity, unitPrice, totalPrice, status)

  // === NEW: Commission split (snapshot at payment time) ===
  commissionRateApplied Decimal? @db.Decimal(4, 2)  // Rate použitá v době platby
  carmaklerFee          Int?                        // Carmakler provize (haléře)
  supplierPayout        Int?                        // Vyplaceno vrakovišti (haléře)
}
```

**Důvod snapshot:** Partner může v budoucnu změnit `commissionRate`, ale stará objednávka musí zůstat s původní sazbou. `OrderItem.commissionRateApplied` = immutable audit.

### 3.4 Migrace
```bash
npx prisma migrate dev --name add_partner_commission_and_order_split
```

**Data migration:** Všichni existující Partner dostanou default `commissionRate = 15.00` automaticky. Všichni existující OrderItem zůstanou s `commissionRateApplied = null` (legacy pre-commission orders — OK).

---

## 4. Backend — API Endpoints

### 4.1 PATCH `/api/admin/partners/[id]/commission`
**Účel:** Admin (ADMIN/BACKOFFICE) mění komisi — zapíše log + aktualizuje Partner.

**Umístění:** `app/api/admin/partners/[id]/commission/route.ts` (net new)

**Auth:** `session?.user?.role === "ADMIN" || session?.user?.role === "BACKOFFICE"`
(NE REGIONAL_DIRECTOR — viz §7 Q3)

**Zod schema:**
```ts
const bodySchema = z.object({
  newRate: z.number().min(12).max(20).multipleOf(0.5),  // 0.5 granularita per Evžen
  reason: z.string().min(10).max(500),                  // Mandatory reason
});
```

**Logic:**
1. Načíst Partner (`prisma.partner.findUnique`)
2. Pokud `newRate === oldRate` → 400 "Žádná změna"
3. Transakce:
   - `PartnerCommissionLog.create` (oldRate, newRate, reason, changedById)
   - `Partner.update` (commissionRate, commissionRateAt)
4. Return 200 `{ commissionRate, updatedAt }`

**Error cases:**
- 400 invalid rate (< 12 nebo > 20 nebo nenásobek 0.5)
- 400 reason < 10 znaků
- 403 non-admin/non-backoffice
- 404 partner not found

### 4.2 GET `/api/admin/partners/[id]/commission/history`
**Účel:** Audit log pro konkrétního partnera.

**Umístění:** `app/api/admin/partners/[id]/commission/history/route.ts`

**Auth:** ADMIN/BACKOFFICE only.

**Logic:**
```ts
const history = await prisma.partnerCommissionLog.findMany({
  where: { partnerId },
  include: { changedBy: { select: { firstName: true, lastName: true, email: true } } },
  orderBy: { changedAt: "desc" },
  take: 50,
});
```

Return: `{ history: [{ id, oldRate, newRate, reason, changedBy: {...}, changedAt }] }`

### 4.3 GET `/api/admin/reports/commission-summary`
**Účel:** Dashboard summary pro admina — průměrná komise, distribuce, Y2D fees.

**Umístění:** `app/api/admin/reports/commission-summary/route.ts` (net new)

**Auth:** ADMIN/BACKOFFICE only.

**Response shape:**
```ts
{
  totalPartners: number;           // COUNT Partner WHERE status = 'AKTIVNI_PARTNER'
  avgCommissionRate: number;       // AVG(Partner.commissionRate) WHERE AKTIVNI
  rateDistribution: {              // Buckets pro histogram
    "12.00-14.99": number;
    "15.00-15.99": number;
    "16.00-17.99": number;
    "18.00-20.00": number;
  };
  totalRevenueY2D: number;         // SUM(OrderItem.totalPrice) WHERE paid & year-to-date
  carmaklerFeesY2D: number;        // SUM(OrderItem.carmaklerFee) WHERE paid & year-to-date
}
```

**Note:** Ponechat na implementátorovi zda použít raw SQL (rychlejší, groupBy) nebo Prisma aggregate (čistší).

---

## 5. Frontend — Admin UI Extension

### 5.1 Rozšíření `components/admin/partners/PartnerDetail.tsx`
**Cíl soubor:** `components/admin/partners/PartnerDetail.tsx` (existující, 698 řádků)

**Kroky:**

**A) Partner interface extension** (~line 15–40):
```ts
interface Partner {
  // ... existující
  commissionRate: number;          // Decimal se deserializuje jako number
  commissionRateAt: string;        // ISO datetime
  stripeAccountId: string | null;
}
```

**B) Insert new Card "Provize"** mezi existující Card "Údaje partnera" (ends line 428) a Card "Stav a přiřazení" (starts line 431).

**Struktura nového Cardu:**
```tsx
{/* === Commission (nové #88a) === */}
<Card className="p-6">
  <h3 className="text-lg font-bold text-gray-900 mb-4">Provize</h3>
  <CommissionRateDisplay rate={partner.commissionRate} updatedAt={partner.commissionRateAt} />
  {canEditCommission && (
    <div className="mt-4">
      <Button variant="secondary" size="sm" onClick={() => setCommissionDialogOpen(true)}>
        Upravit sazbu
      </Button>
    </div>
  )}
  <CommissionHistoryList partnerId={partner.id} />
</Card>

<CommissionEditDialog
  open={commissionDialogOpen}
  currentRate={partner.commissionRate}
  partnerId={partner.id}
  onClose={() => setCommissionDialogOpen(false)}
  onSaved={(newRate) => {
    setPartner({ ...partner, commissionRate: newRate, commissionRateAt: new Date().toISOString() });
    setCommissionDialogOpen(false);
  }}
/>
```

**C) Auth gating** (~line 82, vedle existujícího `canActivate`):
```ts
const canEditCommission =
  session?.user?.role === "ADMIN" || session?.user?.role === "BACKOFFICE";
```

### 5.2 Net-new komponenty

#### `components/admin/partners/CommissionRateSlider.tsx`
**Účel:** Slider + numeric input pro výběr sazby 12–20 s granularitou 0.5.

**Props:**
```ts
{
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}
```

**Implementation hint:** HTML5 `<input type="range" min="12" max="20" step="0.5">` + vedle `<input type="number">`. Vizuálně zobraz aktuální hodnotu jako badge "15.5%".

#### `components/admin/partners/CommissionEditDialog.tsx`
**Účel:** Modal s CommissionRateSlider + mandatory reason textarea + Save/Cancel.

**Props:**
```ts
{
  open: boolean;
  currentRate: number;
  partnerId: string;
  onClose: () => void;
  onSaved: (newRate: number) => void;
}
```

**Logic:**
1. State: `newRate` (init = currentRate), `reason` (init = "")
2. Client-side validace: `newRate !== currentRate`, `reason.length >= 10`
3. Na Save → PATCH `/api/admin/partners/${partnerId}/commission` body `{ newRate, reason }`
4. Úspěch → `onSaved(newRate)` + close
5. Error → toast "Nepodařilo se uložit"

**Use existing components:** `Modal`, `Button`, `Textarea` (už importované v PartnerDetail.tsx).

#### `components/admin/partners/CommissionHistoryList.tsx`
**Účel:** Zobrazit poslední 10 změn komise (oldRate → newRate + reason + kdo + kdy).

**Props:** `{ partnerId: string }`

**Logic:**
1. `useEffect` → fetch `/api/admin/partners/${partnerId}/commission/history`
2. Loading state → "Načítám historii..."
3. Empty state → "Žádné změny sazby"
4. List: `{oldRate}% → {newRate}% · {reason} · {changedBy.firstName} · {relativeTime(changedAt)}`
5. Collapsible — default zobrazit 3, expand "Zobrazit všech {n}"

---

## 6. Stripe Webhook Extension (Dynamic Split)

### 6.1 Rozšíření `app/api/stripe/webhook/route.ts`
**Cíl soubor:** `app/api/stripe/webhook/route.ts` (existující, 324 řádků)

**Target function:** `handleOrderPayment(orderId)` (řádek 152–176)

**Extension sekvence (PO `prisma.order.update({ paymentStatus: "PAID" })`, PŘED `createShipmentForOrder`):**

```ts
async function handleOrderPayment(orderId: string) {
  // 1) Marky jako zaplaceno
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: "PAID" },
  });

  // === NEW: Commission split snapshot ===
  await applyCommissionSplit(orderId);

  // 2) Shipment + emaily (existing)
  try {
    const shipment = await createShipmentForOrder(orderId);
    // ... existing
  } catch (err) {
    // ... existing
  }
}

// === NEW function ===
async function applyCommissionSplit(orderId: string) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: {
      supplier: {
        include: {
          partnerAccount: {
            select: { id: true, commissionRate: true, stripeAccountId: true, name: true },
          },
        },
      },
    },
  });

  const stripe = getStripe();

  for (const item of items) {
    const partner = item.supplier.partnerAccount;
    const commissionRate = Number(partner?.commissionRate ?? 15);
    const gross = item.totalPrice;  // haléře
    const carmaklerFee = Math.round(gross * (commissionRate / 100));
    const supplierPayout = gross - carmaklerFee;

    // Snapshot do OrderItem
    await prisma.orderItem.update({
      where: { id: item.id },
      data: {
        commissionRateApplied: commissionRate,
        carmaklerFee,
        supplierPayout,
      },
    });

    // Stripe Connect transfer (pokud partner má stripeAccountId)
    if (partner?.stripeAccountId) {
      try {
        await stripe.transfers.create({
          amount: supplierPayout,
          currency: "czk",
          destination: partner.stripeAccountId,
          transfer_group: `order_${orderId}`,
          metadata: {
            orderId,
            orderItemId: item.id,
            partnerId: partner.id,
            commissionRate: String(commissionRate),
          },
        });
      } catch (err) {
        console.error(`[webhook] Stripe transfer failed for item ${item.id}:`, err);
        // Nerestartuj webhook — snapshot v DB je, transfer lze retrynout manuálně
      }
    } else {
      console.warn(`[webhook] Partner ${partner?.id} bez stripeAccountId — transfer skipped, manuální platba`);
    }
  }
}
```

**Důležité:**
- **Transfer errors NESHODÍ webhook** (Stripe retryuje, což by zduplikovalo paid+emaily)
- **Snapshot v OrderItem je autoritativní** — transfer lze retrynout z admin UI (out of scope #88a, ale snapshot existuje)
- **Metadata v transferu** → pro manuální reconciliation

### 6.2 Import
```ts
// Na začátek route.ts přidat:
import { getStripe } from "@/lib/stripe";  // Již importováno (line 3)
```

---

## 7. Open Questions pro team-lead

### Q1. Stripe Connect Express onboarding
**Otázka:** Existuje už flow pro onboarding vrakoviště do Stripe Connect Express (aby získali `stripeAccountId`)? Nebo #88a zanechá `stripeAccountId = null` a vyplaty se zatím dělají manuálně bank transferem?

**Plánovač recommendation:** `stripeAccountId` pole přidáme (#88a scope), **onboarding UI NENÍ v #88a scope**. Pokud neexistuje, eskalovat na nový task #88x. Webhook má graceful fallback (`console.warn + skip transfer`).

### Q2. Reason povinný nebo optional?
**Kontext:** Baseline audit — Evžen recommendation: "mandatory reason textarea".
**Plánovač recommendation:** **POVINNÝ** (min 10 znaků) — audit log musí mít důvod pro compliance.

### Q3. Kdo smí editovat komisi?
**Varianty:**
- (a) ADMIN only
- (b) ADMIN + BACKOFFICE (recommended, konzistentní s `canActivate`)
- (c) ADMIN + BACKOFFICE + REGIONAL_DIRECTOR

**Plánovač recommendation:** **(b)** — business decisions, audit log sleduje kdo, REGIONAL_DIRECTOR by neměl měnit finanční conditions.

### Q4. Slider granularita
**Varianty:** 0.01 (zbytečně jemné) · **0.5** (doporučuje Evžen) · 1.0 (hrubé)
**Plánovač recommendation:** **0.5** — business-friendly, nedovoluje absurdní hodnoty jako 15.37%.

### Q5. Commission summary Y2D timezone
**Otázka:** `totalRevenueY2D` počítat od `new Date(new Date().getFullYear(), 0, 1)` v UTC nebo CET?
**Plánovač recommendation:** **CET** (Europe/Prague) — business-facing dashboard, Carmakler je CZ firma.

---

## 8. Acceptance Criteria

- **AC1.** `npx prisma migrate dev` úspěšná — Partner má `commissionRate` (default 15.00), `stripeAccountId`; `PartnerCommissionLog` existuje; `OrderItem` má 3 nová pole (null pro existing rows).
- **AC2.** Admin (ADMIN/BACKOFFICE) otevře `/admin/partners/[id]`, vidí nový Card "Provize" s aktuální sazbou a buttonem "Upravit sazbu". REGIONAL_DIRECTOR nevidí button.
- **AC3.** Admin změní sazbu z 15 na 16.5 s reasonem "Zvýšená kvalita dodávek Q2" → PATCH vrací 200, Partner má `commissionRate = 16.50`, `PartnerCommissionLog` má nový záznam, CommissionHistoryList ho zobrazí bez reloadu stránky.
- **AC4.** Validace: rate < 12 → 400, rate > 20 → 400, rate = 15.37 → 400 (nenásobek 0.5), reason < 10 znaků → 400.
- **AC5.** Stripe webhook: zaplaceným order s OrderItem totalPrice = 10000 Kč a Partner.commissionRate = 15 → OrderItem dostane `commissionRateApplied = 15`, `carmaklerFee = 1500`, `supplierPayout = 8500`.
- **AC6.** Pokud Partner.stripeAccountId = null → webhook logne warning, nezhoupne se (order status = PAID, email odejde), snapshot v OrderItem je.
- **AC7.** `GET /api/admin/reports/commission-summary` vrátí 200 s `totalPartners`, `avgCommissionRate`, `rateDistribution`, `totalRevenueY2D`, `carmaklerFeesY2D`.
- **AC8.** Audit log je immutable — žádný DELETE/UPDATE endpoint na `PartnerCommissionLog`.
- **AC9.** Build success — `npm run lint` 0 errors, `npx tsc --noEmit` 0 errors, `npm run build` úspěšný bez warnings na Partner/OrderItem typech.

---

## 9. Risks & Mitigations

| Riziko | Impact | Mitigace |
|--------|--------|----------|
| Partner.stripeAccountId chybí (no onboarding) | Payment split nejde exec | Graceful fallback v webhooku (warn + snapshot) + Q1 escalation |
| Stripe transfer fail během webhooku | Webhook shodí → retry loop | Try-catch + log, snapshot v DB = zdroj pravdy pro manuální retry |
| Partner změní commission DURING pending order | Order dostane novou sazbu místo staré | Snapshot `commissionRateApplied` zamrzne sazbu v době platby |
| Decimal type v JS/Prisma | Precision issues | `Number(partner.commissionRate)` + `Math.round()` pro haléře |
| Legal gate (#80) znovu otevřený | Blocker | Memory confirmed #80 completed via #90 — žádná akce |

---

## 10. Effort & Phasing

**Doporučená sekvence pro implementátora:**

1. **Phase A — Schema** (~20 min): Prisma migrace + regenerace client.
2. **Phase B — API** (~45 min): 3 endpoints (PATCH commission, GET history, GET summary).
3. **Phase C — UI** (~1.5 h): 3 net-new komponenty + PartnerDetail.tsx integration.
4. **Phase D — Webhook** (~40 min): applyCommissionSplit() + test s test-mode order.
5. **Phase E — E2E smoke** (~30 min): happy path commission change + mocked paid order split.

**Blocking gates:** Žádné — #88a je samostatný, nezávisí na #88b ani #88c.

---

## 11. Files Touched (expected)

**New files (7):**
- `app/api/admin/partners/[id]/commission/route.ts`
- `app/api/admin/partners/[id]/commission/history/route.ts`
- `app/api/admin/reports/commission-summary/route.ts`
- `components/admin/partners/CommissionRateSlider.tsx`
- `components/admin/partners/CommissionEditDialog.tsx`
- `components/admin/partners/CommissionHistoryList.tsx`
- `prisma/migrations/XXXX_add_partner_commission_and_order_split/migration.sql`

**Modified files (3):**
- `prisma/schema.prisma` (Partner + PartnerCommissionLog + OrderItem + User inverse)
- `components/admin/partners/PartnerDetail.tsx` (interface + new Card + canEditCommission)
- `app/api/stripe/webhook/route.ts` (applyCommissionSplit extension)

---

## 12. Source References

- **plan-task-76.md §0.1–§0.8** — originál Wolt 1:1 model spec
- **baseline-audit-76-parts-wizard.md Part 2** — PartnerDetail.tsx audit (698 ř., existing auth pattern, Card insertion point)
- **prisma/schema.prisma:1645** — Partner model
- **prisma/schema.prisma:1060** — OrderItem model
- **app/api/stripe/webhook/route.ts:152** — handleOrderPayment target
- **components/admin/partners/PartnerDetail.tsx:82** — canActivate auth pattern
- **components/admin/partners/PartnerDetail.tsx:428–431** — Card insertion point between "Údaje partnera" a "Stav a přiřazení"
- **MEMORY.md** — Wolt model platform-wide, vrakoviště business model (free tool + commission)

---

**STATUS:** Ready for implementator dispatch (#88a) — all open questions resolved (viz §13)

---

## 13. LEAD DECISIONS (verbatim user authorization 2026-04-08)

Všech 5 otevřených otázek z §7 bylo rozhodnuto team-leadem. Implementator se musí řídit těmito rozhodnutími **doslovně** — žádné odchylky, žádné self-interpretation.

### Q1: Stripe Connect onboarding status
**Decision:** ACCEPT planovac recommendation (a).
**Rationale:**
- Migrace **přidá `Partner.stripeAccountId String?` sloupec** (nullable) — schema gate pro budoucnost
- Webhook extension používá **graceful fallback**: pokud `partner.stripeAccountId === null`, snapshot fields se zapíšou normálně (audit/reporting funguje), ale **NE Stripe Transfer call** (jen log warning "stripeAccountId missing — fee accumulated, no payout")
- **Onboarding UI je samostatný task #88a-stripe-onboarding** (Stripe Connect Express flow pro vrakoviště) — POZDĚJI, NE blocker pro #88a
- #88a může jít do production bez onboarding — Carmakler manuálně vyplácí přes bank transfer + vede `OrderItem.supplierPayout` jako neuhrazený debt → po onboardingu auto-flow

**How to apply:** Implementator přidá `stripeAccountId String?` do Partner model + null-guard v `applyCommissionSplit()` před `stripe.transfers.create()`. Žádný onboarding UI v #88a.

---

### Q2: Reason mandatory pro commission change?
**Decision:** ACCEPT recommendation YES, min 10 znaků.
**Rationale:** Audit log bez důvodu je k ničemu. Forced reason donutí admin přemýšlet nad změnou (volume discount? strategic partnership? penalty?) a slouží pro reporting, B2B vztahy a případné spory s vrakovišti. 10 znaků je minimum (vyloučí "ok", "test").

**How to apply:** Zod schema na PATCH `/api/admin/partners/[id]/commission` → `reason: z.string().min(10).max(500)`. UI dialog má required textarea s placeholder ("Důvod změny — např. Volume discount, strategic partnership, post-pilot adjustment...") a disable Save dokud není ≥10 znaků.

---

### Q3: Kdo může editovat commission?
**Decision:** ACCEPT recommendation **ADMIN + BACKOFFICE only**, NE REGIONAL_DIRECTOR/MANAGER/BROKER.
**Rationale:**
- Commission je obchodní rozhodnutí s direct revenue impact → centrální control
- REGIONAL_DIRECTOR může mít konflikt zájmů (chtěli by snížit pro své vrakoviště → boost trust skóre)
- BACKOFFICE zahrnuto protože dělají daily ops + accounting reconciliation — potřebují schopnost adjust komise (např. po LEGAL change)
- V budoucí fázi 2 můžeme přidat REGIONAL_DIRECTOR s narrower range (např. 14-16% capped) — separate task

**How to apply:** Helper `canEditCommission(session)` v API route + UI gate v PartnerDetail (slider visible jen pro povolené role). 403 pro neautorizované role na PATCH endpointu.

---

### Q4: Slider granularity
**Decision:** ACCEPT recommendation **0.5% step** (12.0 → 12.5 → ... → 20.0 = 17 hodnot).
**Rationale:** Per Evžen #84 review point §1.Q1 (verbatim). 0.5% step je dost granular pro business deals (např. 14.5% volume discount) ale ne tak fine že admin se zasekne na rozhodování (např. 14.37%). Také čistá UI — slider má 17 distinct positions, vizuálně srozumitelné.

**How to apply:** `<input type="range" min="12" max="20" step="0.5">` + Decimal(4,2) v Prisma. Žádný free-form numeric input.

---

### Q5: Y2D timezone pro fee reporting
**Decision:** ACCEPT recommendation **CET (Europe/Prague)**.
**Rationale:** Carmakler je 100% CZ market produkt (žádný cross-border ambitions v MVP). Všichni vrakoviště + admins jsou v CZ. Reporting v CET = no surprises s cutoff times. Také matchuje českou účetní praxi (DPH závěrka, výroční hlášení atd.).

**How to apply:** GET `/api/admin/partners/commissions/summary` používá `Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague' })` pro Y2D bucketing. Database queries používají `created_at BETWEEN '2026-01-01 00:00:00 CET' AND NOW()` ekvivalent (TZ-aware).

---

**IMPLEMENTATOR ACTIONS (consolidated):**
1. Partner model: add `stripeAccountId String?` (nullable) — Q1
2. Webhook `applyCommissionSplit()`: null-guard před `stripe.transfers.create()` — Q1
3. Zod PATCH schema: `reason: z.string().min(10).max(500)` — Q2
4. UI CommissionEditDialog: required textarea, disable Save pokud reason.length < 10 — Q2
5. Helper `canEditCommission(session)` v API + UI gate: ADMIN + BACKOFFICE only — Q3
6. 403 response pro ne-authorized roles na PATCH endpointu — Q3
7. Slider HTML: `<input type="range" min="12" max="20" step="0.5">` — Q4
8. Prisma: `Decimal(4,2)` pro commissionRate — Q4 (už v §3.1)
9. Summary endpoint: `Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague' })` — Q5
10. Y2D query: TZ-aware cutoff `'2026-01-01 00:00:00 CET'` ekvivalent — Q5

**NO onboarding UI in #88a.** Pokud STOP-1 trigger (Stripe env chybí) → ponechat jen snapshot fields, žádné `stripe.transfers.create()` call, samostatný task #88a-stripe-onboarding.

---

## 14. OUT OF SCOPE (#88a) — detailní literal seznam

Každá položka patří do #88b nebo #88c nebo jiného separátního tasku. Implementator #88a NESMÍ se jich dotknout, i kdyby v kódu zahlédl místo. Změna vyžaduje nový task od team-leada.

**→ Patří do #88b (Vision + Voice):**
- ❌ Vision OCR scanner (Anthropic Claude Vision API call pro rozpoznání štítků / VIN / part number z fotky)
- ❌ ZXing barcode scanner (JS library pro EAN-13 / QR z kamery)
- ❌ Voice input (Web Speech API / Whisper pro hlasové zadání popisu dílu)
- ❌ 5-tier scan flow logic (Tier 1 barcode → Tier 2 vision → Tier 3 voice → Tier 4 manual → Tier 5 AI suggest)

**→ Patří do #88c (PWA dispatch flow):**
- ❌ PWA scan UI pro vrakoviště (kamera button, scan wizard, result confirmation)
- ❌ Offline queue (IndexedDB background sync pro scans pokud offline)
- ❌ 5-tier flow UI integration do `app/(pwa-parts)/...` routes
- ❌ Touch target audit (44×44pt min pro mobile UI)
- ❌ Skeleton loading states pro slow 3G PWA testing

**→ Patří do #88c+ nebo post-MVP:**
- ❌ Pilot phase rollout (3 vrakoviště beta, telemetrie, feedback loop)
- ❌ Cleanup legacy `(partner)/partner/parts/new` duplicate page (post-#88c migrace)
- ❌ AI price suggestions (Claude API call pro odhad ceny dílu)
- ❌ Similar parts matching (ML model na deduplikaci napříč vrakovišti)

**→ Separátní task (TBD):**
- ❌ Stripe Connect Express onboarding flow pro vrakoviště (získání `stripeAccountId`) — viz §7 Q1, **pokud chybí env setup → blocker pro production commission split, ale #88a scope přidává jen sloupec + graceful webhook fallback**

**Rationale:** Evžen review (#84) rozdělil #76 na fáze #88a/b/c právě proto, aby #88a mohl být malý, čistě Wolt business model (schema + admin UI + payment split) bez komplexity Vision/Voice/PWA. Scope creep = automatický STOP & ESCALATE (viz §15).

---

## 15. STOP & ESCALATE Rules (literal — honor narrow thresholds)

Implementator MUSÍ zastavit práci a escalate team-leadu v těchto případech. Žádné workarounds, žádné self-resolution:

### STOP-1. Stripe Connect env setup chybí
**Trigger:** `grep STRIPE_SECRET_KEY .env.example` nebo `.env` nevrátí nic pro `STRIPE_CONNECT_*` / platform account proměnné.
**Action:** STOP před webhook extension (§6). Napiš team-leadu:
> "STOP-1: Stripe Connect platform account setup chybí v env. Q1 z §7 není rozhodnuto. Varianty: (a) defer `applyCommissionSplit()` transfer call do #88a-followup, ponechat pouze snapshot v OrderItem, (b) blok #88a do env setup, (c) jiné. Čekám rozhodnutí."

**NESPOUŠTĚJ** webhook extension bez rozhodnutí — snapshot fields (§3.3) lze vytvořit nezávisle, ale `stripe.transfers.create()` call ne.

### STOP-2. PartnerDetail.tsx chybí nebo má jinou strukturu
**Trigger:** `components/admin/partners/PartnerDetail.tsx` neexistuje, nebo řádky 428/431 neobsahují očekávané Cardy ("Údaje partnera" / "Stav a přiřazení").
**Action:** STOP před §5.1 integration. Napiš team-leadu:
> "STOP-2: PartnerDetail.tsx má jinou strukturu než plán předpokládal. Očekávané Cards na řádkách 428/431 nenalezeny. Potřebuji nový insertion point nebo audit že plán je stále aktuální."

### STOP-3. Prisma migration drift
**Trigger:** `npx prisma migrate dev --name add_partner_commission_and_order_split` detekuje drift proti production schéma nebo failuje s `P3006` / `P3018`.
**Action:** STOP, **NEDĚLEJ** `prisma migrate reset` ani `--create-only` workaround. Napiš team-leadu:
> "STOP-3: Prisma migration drift. Exit: {code}. Schema diff: {diff}. Čekám rozhodnutí — reset DB nebo manuální migration merge?"

**Rationale:** Per memory `feedback_stop_escalate_literal.md` + historický incident #45a (searchVector drift) — drift se NIKDY neřeší lokálně bez lead decision.

### STOP-4. User.partnerAccount inverse relace neexistuje
**Trigger:** Čtení `prisma/schema.prisma` User modelu (line 13+) neodhalí `partnerAccount Partner? @relation(...)` field.
**Action:** STOP před §6 webhook extension (resolution path by nefungoval). Napiš:
> "STOP-4: User.partnerAccount inverse neexistuje. Plánovač V2 zjištění bylo chybné. Potřebuji plán aktualizovat — buď přidat inverse relaci (in-scope) nebo refaktorovat webhook query."

### STOP-5. Existing OrderItem rows dostaly NULL commission fields — OK
**Not a STOP — just awareness:** Existující OrderItem rows před migrací budou mít `commissionRateApplied = NULL`, `carmaklerFee = NULL`, `supplierPayout = NULL`. Reporting §4.3 `carmaklerFeesY2D` používá `SUM(carmaklerFee)` — SQL `SUM` ignoruje NULL, takže summary bude podhodnocený pro pre-commission orders. **To je zamýšlené** (pre-commission legacy = 0 fee k reportování). Nepředělávej.

### STOP-6. Scope creep pokušení
**Trigger:** Implementator vidí v kódu něco z §13 OUT OF SCOPE a chce to "quickly opravit" (např. PWA parts page, legacy `parts/new`, Vision OCR placeholder).
**Action:** **NE**. STOP. Commit pouze #88a scope. Pokud je bug v legacy kódu blokující → napiš lead a nechť rozhodne o samostatném task.

---

## 16. Dispatch Checklist pro implementátora

Před commit + HOTOVO ověř (zaškrtni všechny):

- [ ] **Pre-flight:** Přečteny V1/V2/V3 v §2, ověřeno `grep stripeAccountId prisma/schema.prisma` (očekáváno 0 matches pro Partner — pokud jsou → zjisti kde a neduplicuj)
- [ ] **Pre-flight:** Ověřena existence `User.partnerAccount` inverse relace v `prisma/schema.prisma` User modelu (pokud chybí → STOP-4)
- [ ] **Schema:** Migration pojmenovaná `add_partner_commission_and_order_split`, migrate dev clean (žádný drift — pokud je → STOP-3)
- [ ] **Schema:** `Partner.commissionRate` default `15.00`, ověř `SELECT COUNT(*) FROM "Partner" WHERE "commissionRate" != 15;` po migraci = 0
- [ ] **Schema:** `PartnerCommissionLog` compound index `(partnerId, changedAt)` exists
- [ ] **Schema:** User model má novou inverse relaci `commissionChanges PartnerCommissionLog[] @relation("PartnerCommissionChanger")`
- [ ] **API:** PATCH endpoint používá Zod `.multipleOf(0.5)` + `.min(12).max(20)` + reason `.min(10).max(500)`
- [ ] **API:** PATCH vrací 403 pro BROKER role (AC6 z §8 — ověř manual curl s BROKER session)
- [ ] **API:** Transakce PATCH je atomic (`prisma.$transaction([...])` — log insert + Partner update buď oba nebo žádný)
- [ ] **UI:** `canEditCommission` gating nesahá REGIONAL_DIRECTOR (Q3 recommendation)
- [ ] **UI:** CommissionEditDialog client validace nepustí submit pokud `newRate === currentRate`
- [ ] **UI:** CommissionHistoryList default zobrazí 3, collapse "Zobrazit všech {n}"
- [ ] **UI:** Nový Card "Provize" je vložen mezi `</Card>` (řádek 428) a `<Card>` "Stav a přiřazení" (řádek 431) — NEpřesouvat existující Cardy
- [ ] **Webhook:** `applyCommissionSplit()` je volán PO `prisma.order.update({ paymentStatus: "PAID" })` a PŘED `createShipmentForOrder()`
- [ ] **Webhook:** Try-catch kolem `stripe.transfers.create()` — webhook NESMÍ shodit pokud transfer failne (Stripe retry loop = duplicate emaily)
- [ ] **Webhook:** Pokud `partner?.stripeAccountId == null` → `console.warn` + skip transfer, ALE stále zapiš snapshot (AC6)
- [ ] **Webhook:** Manuální smoke test s Stripe test mode — vytvoř paid order, ověř že OrderItem dostane 3 nová pole
- [ ] **Audit log:** Žádný DELETE nebo UPDATE endpoint na PartnerCommissionLog — pouze POST/GET (AC8)
- [ ] **OUT OF SCOPE:** NENÍ v commit žádný kód z §13 (Vision, Voice, PWA, 5-tier, legacy cleanup, Stripe Connect onboarding UI)
- [ ] **Lint/TSC/Build:** `npm run lint` 0 errors, `npx tsc --noEmit` 0 errors, `npm run build` úspěšný (AC9)
- [ ] **Commit message:** conventional commit `feat(admin): #88a Wolt commission model (Partner + audit log + split webhook)`

**Pokud KTERÝKOLI checkbox selže → STOP & ESCALATE, NE commit.**

---
