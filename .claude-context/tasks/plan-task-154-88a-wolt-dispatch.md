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

### OUT OF SCOPE (#88a)
- ❌ Vision OCR scanner (#88b — samostatný task)
- ❌ PWA dispatch wizard pro vrakoviště (#88c — samostatný task)
- ❌ 5-tier scan workflow, Part model scanLog fields
- ❌ Stripe Connect onboarding UI pro vrakoviště (viz §7 Open Questions — pravděpodobně samostatný task pokud ještě neexistuje)

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

**STATUS:** Ready for implementator dispatch (#88a)
**BLOCKING:** Q1 (Stripe Connect onboarding) — plánovač recommends graceful fallback, eskalovat onboarding jako separátní task pokud chybí
