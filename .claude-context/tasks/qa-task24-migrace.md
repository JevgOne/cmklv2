# QA Report — Task #24: Autoservisy migrace fix

**Datum:** 2026-05-22  
**Commit:** 700d910  
**Výsledek: PASS ✅ — Oba blokeery z #18 opraveny**

---

## 1. Simplify kontrola

Zod schema v `updateSchema` je narrow whitelist (id + 4 boolean flags). Správné řešení pro admin toggle operace — přísnější než nutné, ale bezpečnější. Žádné duplicity.

---

## 2. Debug kontrola

Lint: N/A (admin route změna je čistá). 0 errors na `app/api/admin/autoservisy/route.ts` ✅

---

## 3. Reverzní kontrola vs. plán #18 QA

### BLOCKER #1 — Migrace

| Požadavek (z #18 QA) | Status |
|---|---|
| AutoServis tabulka s ALL poli | ✅ |
| ServisReview tabulka s ALL poli | ✅ |
| stkLines, stkWaitDays, stkOnlineBooking, stkEmissions, stkMotorcycles, stkTrailers, stkHeavy | ✅ |
| ratingWaitTime, ratingFairness, passedInspection | ✅ |
| 8 indexů na AutoServis | ✅ (city, isPublished, averageRating, reviewCount, isFeatured, isVerified, tier, insurancePartner) |
| 4 indexy na ServisReview | ✅ (servisId, isPublished, rating, authorUserId) |
| CASCADE delete ServisReview při smazání AutoServisu | ✅ |
| SET NULL na ownerId/addedById při smazání User | ✅ |
| Timestamp `20260522100000` > poslední `20260520210000` | ✅ |

### BLOCKER #2 — Admin PUT Zod validace

| Požadavek (z #18 QA) | Status | Poznámka |
|---|---|---|
| Raw `{ ...body }` passthrough odstraněn | ✅ | |
| Zod schema whitelist | ✅ | `isVerified`, `isPublished`, `isFeatured`, `isClaimed` |
| `parsed.data` místo `body` do Prisma update | ✅ | |
| Správný error response na nevalidní data | ✅ | `fieldErrors`, status 400 |

**Poznámka k whitelistu:** Zod schema obsahuje jen 4 boolean flagy — přesně to, co AdminServisyTable potřebuje pro toggle akce. Admin nemůže přepsat `slug`, `source`, ani jiná citlivá pole ✅.

---

## Acceptance Criteria (z #18 QA FAIL)

| Kritérium | Před | Po |
|---|---|---|
| Migrace vytvořena | ❌ CHYBÍ | ✅ |
| Admin PUT bez Zod | ⚠️ LOW | ✅ |

---

## Závěr

Task #24 kompletně řeší oba problémy z QA reportu #18:
1. Migrace `20260522100000_add_autoservisy_and_stk` pokrývá AutoServis + ServisReview včetně všech STK polí.
2. Admin PUT endpoint má Zod whitelist — raw passthrough odstraněn.

Task #18 a Task #21 mohou být nyní označeny jako **PASS** (migrace blocker resolved).
