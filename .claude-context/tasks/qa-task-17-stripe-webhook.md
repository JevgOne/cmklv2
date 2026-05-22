# QA Report — Task #17: Stripe webhook

**Datum:** 2026-04-06  
**Agent:** KONTROLOR  
**Zkontrolováno:** `app/api/stripe/webhook/route.ts` (401 řádků)  
**Scope:** Dle checklistu od team-leada (zjednodušený vs. plán v2)

---

## 1. SIMPLIFY KONTROLA

### Pozitiva
- `handleOrderPayment()` správně obalena try/catch — shipment/email chyby neshodí webhook ✅
- `Map<supplierId, items[]>` pro grouping — elegantní přístup bez duplicit ✅
- `dryRunPrefix` jako jednoduchý string flag — DRY-RUN signaling bez složité logiky ✅
- Fallback `partnerAccount?.email ?? supplier.email` — bezpečný optional chain ✅

### Drobnosti (neblokující)
- Email HTML šablony jsou inline v route.ts (2× buildXxxEmailHtml, každá ~70 řádků). Plán říkal separátní `lib/email/order-emails.ts`, ale inline je funkčně OK pro placeholder. Task #19 to refaktoruje.
- `sendOrderNotificationEmails()` načítá order z DB znovu (daleko za `handleOrderPayment` která update volala bez full load) — 2 DB requesty místo 1. Přijatelné pro MVP.

---

## 2. DEBUG KONTROLA

### Build
```
npm run build
✓ Compiled successfully in 21.0s
✓ Generating static pages (309/309)
```
**✅ BUILD PASSED**

### Lint
```
npm run lint 2>&1 | grep -i "stripe/webhook"
(no output)
```
**✅ 0 lint errors/warnings v webhook route**

### Importy + volání (grep)
```
4:  import { sendEmail } from "@/lib/resend";
5:  import { createShipmentForOrder } from "@/lib/shipping/dispatcher";
6:  import type { CreateShipmentResult } from "@/lib/shipping/types";
150: const shipment = await createShipmentForOrder(orderId);
220: await sendEmail({ to: order.deliveryEmail, ... });
244: await sendEmail({ to: recipientEmail, ... });
```
**✅ Všechny 3 importy přítomny, obě funkce volány**

### try/catch — webhook musí vracet 200
```typescript
// handleOrderPayment() — line 149-163
try {
  const shipment = await createShipmentForOrder(orderId);
  if (!shipment) { ... return; }
  await sendOrderNotificationEmails(orderId, shipment);
} catch (err) {
  console.error(`[webhook] Shipment/email pipeline failed for order ${orderId}:`, err);
}
```
**✅ Chyby v pipeline spolknuty — webhook vrátí 200 i při selhání**

---

## 3. REVERZNÍ KONTROLA

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 1 | Import `sendEmail` | ✅ | route.ts:4 |
| 2 | Import `createShipmentForOrder` | ✅ | route.ts:5 |
| 3 | Import `CreateShipmentResult` | ✅ | route.ts:6 |
| 4 | `handleOrderPayment` → UPDATE PAID | ✅ | route.ts:142-145 |
| 5 | → `createShipmentForOrder(orderId)` | ✅ | route.ts:150 |
| 6 | → `sendOrderNotificationEmails(orderId, shipment)` | ✅ | route.ts:159 |
| 7 | PICKUP: dispatcher vrací null → skip emaily | ✅ | route.ts:152-156 |
| 8 | Errors spolknuty, webhook vrací 200 | ✅ | try/catch route.ts:149-163 |
| 9 | Idempotence přes dispatcher (trackingNumber check z #16) — route nepřepisuje trackingNumber | ✅ | route.ts:110-118 neobsahuje trackingNumber override |
| 10 | `sendOrderNotificationEmails` načítá items.part | ✅ | route.ts:194-196 include part |
| 11 | načítá items.supplier.partnerAccount | ✅ | route.ts:196-208 include supplier.partnerAccount |
| 12 | Customer mail na `order.deliveryEmail` s trackingNumber + carrier | ✅ | route.ts:221-224 |
| 13 | Supplier mail per unikátní `supplierId` přes Map grouping | ✅ | route.ts:228-249 |
| 14 | Fallback `supplier.email` když chybí `partnerAccount.email` | ✅ | route.ts:237 `?? supplier.email` |
| 15 | Multi-supplier warning banner při `itemsBySupplier.size > 1` | ✅ | route.ts:247, 334-339 |
| 16 | DRY-RUN prefix v subjectu (`[DRY-RUN] ...`) | ✅ | route.ts:217, 222, 244 |
| 17 | DRY-RUN banner v HTML těle | ✅ | route.ts:261-265 (customer), 328-331 (supplier) |
| 18 | Žádné nové soubory | ✅ | `lib/email/` neexistuje |
| 19 | Žádné nové DB migrace | ✅ | Poslední migrace: `20260406070000_add_shipping_fields` (task #16) |
| 20 | Žádné nové ENV proměnné | ✅ | Žádné nové `process.env.*` v souboru |

**Celkem: 20/20 ✅**

---

## SOUHRN

| Check | Výsledek |
|-------|---------|
| Simplify | ✅ Čisté, 2 drobnosti (neblokující) |
| Build | ✅ PASSED |
| Lint | ✅ 0 errors v webhook route |
| Reverzní kontrola | ✅ 20/20 |

**Celkové hodnocení: ✅ QA #17 PASS**

---

## POZNÁMKA PRO BUDOUCNOST (task #19)

Email idempotence není řešena — při Stripe retry (rare, ale možné) zákazník/vrakoviště dostane 2× email. Dispatcher zabrání duplicitní zásilce (trackingNumber check), ale email guard chybí. Task #19 (real email templates) by měl přidat `customerNotifiedAt`/`supplierNotifiedAt` do Order modelu a guardy před odesláním.
