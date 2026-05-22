# Implementation Report: Task #70 — Seed Fixes (buyer role + orders)

## Status: COMPLETED

## Bug 1: kupujici@email.cz redirect na /makler/dashboard

**Root cause:** `prisma/seed.ts` line 1234 had `role: "BROKER"` for the buyer user.
With role BROKER, the login page switch statement (line 68-69) redirected to `/makler/dashboard`.

**Fix:** Changed `role: "BROKER"` to `role: "BUYER"` and removed incorrect `accountType: "BUYER"`.
With role BUYER, the login switch falls through to default -> `router.push("/")` (homepage).

The middleware and login redirect logic were both correct; the issue was purely in seed data.

## Bug 2: Seed objednavky

**Finding:** Orders already existed in the seed (added by a previous agent). Three orders were present:
- order1: DELIVERED, BANK_TRANSFER, PAID (for return/reklamace testing)
- order2: CONFIRMED, COD, PENDING (active order)
- order3: PENDING, guest checkout (no buyerId)

**Fixes applied:**
- Added `deliveryMethod` to all 3 orders (ZASILKOVNA, PPL, CESKA_POSTA)
- Added `zasilkovnaPointId` and `zasilkovnaPointName` to order1 (Zasilkovna order)
- Fixed `shippingPrice` to match delivery method prices (79/168/99)
- Fixed `totalPrice` to include shipping (969/16668/477)
- Added `shippedAt` to order1 (DELIVERED status should have ship date)
- Fixed delivery names to match buyer ("Petr Kupující" not "Jan Kupující")

## Additional Fix: Seed cleanup order

**Root cause:** `prisma.user.deleteMany()` failed with FK constraint violation because
`PartnerActivity`, `PartnerLead`, `Partner`, `ReturnRequest`, `Reservation`,
`CebiaReport`, `PartsFeedConfig`, `EmailVerificationToken`, `PasswordResetToken`
were not cleaned up before User deletion.

**Fix:** Added all missing deleteMany() calls in correct dependency order at the start
of the seed function.

## Verification
- TypeScript type check: PASSED
- `npx prisma db seed`: PASSED (3 orders, 4 order items, 19 users)
- kupujici@email.cz role confirmed as BUYER
