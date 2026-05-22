# QA Report — Task #42 commits d91bf8a + 6792e0e

**Scope:** Checkout UI (per-supplier delivery), Guest tracking, Supplier PWA SubOrder views, Admin expandable SubOrder rows  
**Commits:** d91bf8a (checkout + PWA + tracking), 6792e0e (admin)  
**Reviewer:** KONTROLOR  
**Date:** 2026-04-13

---

## BUGS

### BUG-CRITICAL: Checkout destroys cart + shows fake confirmation on API error

**File:** `app/(web)/dily/objednavka/page.tsx` lines 206–212  
**Severity:** CRITICAL — data loss for customer

```ts
} else {
  clearCart();
  router.push("/dily/objednavka/potvrzeni?id=demo-" + Date.now());
}
// catch block (lines 210-213):
} catch {
  clearCart();
  router.push("/dily/objednavka/potvrzeni?id=demo-" + Date.now());
}
```

When POST /api/orders returns any error (4xx stock conflict, 5xx server error, network exception), the code:
1. Destroys the customer's cart (`clearCart()`)
2. Redirects to confirmation page with a fake ID (`demo-1734567890123`)

Customer sees a "confirmation" for an order that was never placed, their cart is gone, and there is no way to retry. The `demo-` prefix is clearly a dev placeholder that must NOT ship to production.

**Fix required:**
```ts
} else {
  const errData = await res.json().catch(() => ({}));
  setErrors({ submit: errData.error ?? "Chyba při vytvoření objednávky. Zkuste znovu." });
}
// catch:
} catch {
  setErrors({ submit: "Síťová chyba. Zkontrolujte připojení a zkuste znovu." });
}
```
Do NOT clearCart on error. Do NOT redirect. Show inline error message.

---

### BUG-MEDIUM: supplierId="unknown" sent to API in multi-supplier checkout

**File:** `app/(web)/dily/objednavka/page.tsx` — `groupBySupplier()` function  
**File:** `app/(web)/shop/produkt/[slug]/AddToCartButton.tsx` line 14 (`supplierId?: string` — optional)

When a cart item has no `supplierId` (e.g. added from a page that doesn't pass supplierId to AddToCartButton), `groupBySupplier()` buckets it under key `"unknown"`. This `"unknown"` string is then sent in `deliveries[].supplierId` to POST /api/orders.

The API will attempt to use `"unknown"` as a DB foreign key → FK violation or silent SubOrder creation with invalid supplierId.

**Fix required:** Either (a) filter out items with no supplierId and show error, or (b) treat no-supplierId items as single-supplier and skip multi-supplier flow for them.

Also: ensure all product detail pages pass `supplierId` to `<AddToCartButton>`. The component itself is correct (it forwards supplierId to addToCart), but the caller must provide it.

---

### BUG-MINOR: supplierName renders "null null" in guest tracking

**File:** `app/api/orders/track/[token]/route.ts` line 91

```ts
supplierName: so.supplier.companyName ?? `${so.supplier.firstName} ${so.supplier.lastName}`
```

If `companyName` is null AND either `firstName` or `lastName` is null (business-only accounts), JavaScript template literal produces `"null null"` or `"John null"`. Prisma returns JS `null` for nullable DB fields, not undefined.

**Fix:**
```ts
supplierName: so.supplier.companyName
  ?? [so.supplier.firstName, so.supplier.lastName].filter(Boolean).join(" ")
  || "Dodavatel"
```

---

## GAPS

### GAP-1: Delivery method display missing DPD and GLS in guest tracking UI

**File:** `app/(web)/shop/objednavky/sledovani/[token]/page.tsx` lines 240–245

```ts
order.deliveryMethod === "ZASILKOVNA" ? `Zásilkovna...`
: order.deliveryMethod === "PPL" ? "PPL"
: order.deliveryMethod === "CESKA_POSTA" ? "Česká pošta"
: order.deliveryMethod === "PICKUP" ? "Osobní odběr"
: order.deliveryMethod   // ← raw fallback
```

DPD shows raw "DPD", GLS shows raw "GLS". Minor cosmetic issue for future carriers.

---

## PASS ✅

- `app/api/suborders/[id]/route.ts` — 3-way auth (supplier/admin/buyer) ✅
- `app/api/orders/track/[token]/route.ts` — no auth required, token ≥32 check ✅
- `app/(pwa-parts)/parts/orders/page.tsx` — tabs (all/PENDING/to-ship/active/done), `data.subOrders` read ✅
- `app/(pwa-parts)/parts/orders/[id]/page.tsx` — fetches `/api/suborders/[id]`, mapStatus PENDING→NEW ✅
- `app/(web)/shop/objednavky/sledovani/[token]/page.tsx` — error state ✅, multi-supplier per-SubOrder cards ✅
- `app/(web)/shop/produkt/[slug]/AddToCartButton.tsx` — passes supplierId+supplierName to addToCart ✅
- `app/(admin)/admin/orders/page.tsx` — hasSubOrders = length > 1, single-supplier no expand (intentional) ✅
- Checkout: `isSingleSupplier` logic + per-supplier delivery validation ✅
- Checkout: backward-compat single-supplier sends root `deliveryMethod` ✅
- Checkout: multi-supplier sends `deliveries[]` array with supplierId per group ✅

---

## Summary

| Severity | Count | IDs |
|----------|-------|-----|
| CRITICAL | 1 | checkout cart-clear on error |
| MEDIUM | 1 | unknown supplierId in multi-supplier |
| MINOR | 1 | null null supplierName |
| GAP | 1 | DPD/GLS display names |

**BUG-CRITICAL (checkout) must be fixed before any production traffic.** The other two bugs are lower risk but should be addressed in the next fix cycle.
