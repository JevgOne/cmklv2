# QA Report — Task #25: Stripe + Shipping scope audit

**Datum:** 2026-04-06  
**Agent:** KONTROLOR  
**Scope:** Ověřit, že `lib/shipping/*` a `lib/stripe` se používají POUZE v kontextu eshopu

---

## METODA

```bash
grep -r "lib/shipping" app/ --include="*.ts" -l
grep -r "lib/stripe" app/ --include="*.ts" -l
grep -r "ZASILKOVNA\|CESKA_POSTA\|PICKUP\|DPD\|PPL\|GLS" app/ --include="*.ts" -l
```

---

## 1. lib/shipping — VÝSLEDEK: ✅ PASS

### Import výskyty:

| Soubor | Kontext | Hodnocení |
|--------|---------|-----------|
| `app/api/stripe/webhook/route.ts` | Eshop webhook — handleOrderPayment → createShipmentForOrder | ✅ ESHOP |
| `scripts/test-shipping.ts` | Dev test script (není v app/) | ✅ DEV ONLY |

**Závěr:** `lib/shipping/*` se importuje POUZE z eshop webhook route a dev test scriptu.  
Žádné importy v: makléři PWA, marketplace, inzerce, admin, cebia.

---

## 2. DeliveryMethod enum výskyty

| Soubor | Řádky | Kontext | Hodnocení |
|--------|-------|---------|-----------|
| `app/(web)/dily/objednavka/page.tsx` | 23, 25, 74 | Eshop objednávka — výběr dopravy zákazníkem | ✅ ESHOP (dily = parts = shop) |

**Závěr:** ZASILKOVNA/CESKA_POSTA/PICKUP/DPD/PPL/GLS enum hodnoty se vyskytují POUZE v eshop UI.

---

## 3. lib/stripe — VÝSLEDEK: ⚠️ ROZŠÍŘENÉ POUŽITÍ (pre-existing)

### Import výskyty:

| Soubor | Kontext | Hodnocení |
|--------|---------|-----------|
| `app/api/orders/route.ts` | Eshop — vytvoření Stripe checkout pro objednávku dílů | ✅ ESHOP |
| `app/api/stripe/webhook/route.ts` | Eshop — zpracování webhook eventů (orderId, promoType, reservationId, cebiaReportId) | ⚠️ ESHOP + OSTATNÍ |
| `app/api/listings/[id]/promote/route.ts` | Inzerce — platba za TOP/EXTEND/BUNDLE promo | ⚠️ INZERCE |
| `app/api/listings/[id]/extend/route.ts` | Inzerce — prodloužení platnosti inzerátu | ⚠️ INZERCE |
| `app/api/listings/[id]/reserve/route.ts` | Inzerce — rezervace vozidla (kauce) | ⚠️ INZERCE |
| `app/api/reservations/[id]/cancel/route.ts` | Inzerce — zrušení rezervace + refund | ⚠️ INZERCE |
| `app/api/cebia/check/route.ts` | CEBIA report — platba za prověrku vozidla | ⚠️ CEBIA |
| `app/api/payments/create-checkout/route.ts` | Marketplace — platba investice do flippingu | ⚠️ MARKETPLACE |
| `app/api/payments/webhook/route.ts` | Marketplace — webhook pro marketplace platby | ⚠️ MARKETPLACE |
| `app/api/payments/[id]/confirm/route.ts` | Marketplace — potvrzení marketplace platby | ⚠️ MARKETPLACE |

### Přehled po oblasti:

| Oblast | Počet souborů | Status |
|--------|--------------|--------|
| Eshop (`/orders`, `/stripe/webhook`) | 2 | ✅ |
| Inzerce (`/listings`, `/reservations`) | 4 | ⚠️ pre-existing |
| CEBIA (`/cebia`) | 1 | ⚠️ pre-existing |
| Marketplace (`/payments`) | 3 | ⚠️ pre-existing |

---

## SOUHRN

| Komponenta | Výsledek | Poznámka |
|------------|---------|----------|
| `lib/shipping/*` | ✅ ČISTÁ — pouze eshop | Splňuje požadavek |
| `lib/stripe` | ⚠️ SDÍLENÁ — eshop + inzerce + cebia + marketplace | Pre-existing design |

### Klíčové zjištění

`lib/stripe` je **sdílená infrastruktura** pro všechny placené funkce platformy:
- Eshop objednávky dílů (task #16/#17)
- Inzerce promo a rezervace (starší feature)
- CEBIA prověrky (starší feature)
- Marketplace investice (starší feature)

`app/api/stripe/webhook/route.ts` zpracovává všechny Stripe eventy najednou (`metadata.orderId` vs. `metadata.promoType` vs. `metadata.reservationId` vs. `metadata.cebiaReportId`) — tato architektura je záměrná, ne bug.

### Doporučení

Pokud je požadavek "lib/stripe ONLY eshop" nový požadavek → vyžaduje refaktoring (separovat stripe infrastrukturu per-feature). To je ale velký zásah do fungujícího kódu.

Pokud byl záměr ověřit **nové** shipping/webhook kódy (task #16/#17) → ty jsou čistě eshop-only. ✅

---

**Celkové hodnocení:**
- `lib/shipping` scope: ✅ PASS
- `lib/stripe` scope: ⚠️ SDÍLENÁ — čeká na rozhodnutí team-leada (refaktoring vs. akceptace)
