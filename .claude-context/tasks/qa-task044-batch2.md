# QA Report — Task #49: Reservation + Shipping + Autocomplete

**Commits:** bf68f89 (reservation), 1f8e749 (shipping calculate + BUG fixes), a8759d4 (autocomplete + smart search)  
**Reviewer:** KONTROLOR  
**Date:** 2026-04-14

---

## CONFIRMED FIXES

| Bug | File | Verdict |
|-----|------|---------|
| BUG-3: checkout clearCart on error | `app/(web)/dily/objednavka/page.tsx:333-337` | ✅ FIXED |
| BUG-4: admin totalAmount vs totalPrice | `app/(admin)/admin/orders/page.tsx:29,224` | ✅ FIXED |

BUG-3: error path now calls `setSubmitError(...)`, no `clearCart()`, no fake redirect.  
BUG-4: interface and JSX both updated to `totalPrice`.

---

## BUGS

### BUG-1 (Medium) — OEM dot normalization missing on column side in autocomplete

**File:** `app/api/parts/autocomplete/route.ts` lines 69–70

```sql
UPPER(REPLACE(REPLACE("oemNumber", ' ', ''), '-', ''))
ILIKE ${`%${q.replace(/[\s\-.]/g, "").toUpperCase()}%`}
```

Query side strips spaces, dashes **and dots** (`/[\s\-.]/g`).  
Column side strips only spaces and dashes — **dots remain**.

Result: a part stored with OEM "06B.103.925" produces column value "06B.103.925" (dots kept), but user query "06B103925" is correctly normalized. The ILIKE fails to match.

Inconsistency with d3c7aaa (OEM lookup) which uses the 3-REPLACE chain:  
`REPLACE(REPLACE(REPLACE(col,' ',''),'-',''),'.','')`.

**Fix:**
```sql
UPPER(REPLACE(REPLACE(REPLACE("oemNumber", ' ', ''), '-', ''), '.', ''))
```

---

### BUG-2 (Minor) — Double DB query for part weights in shipping/calculate

**File:** `app/api/shipping/calculate/route.ts` lines 45–50

Route fetches `{ id, weight, dimensions }` for all parts (line 45), then calls  
`calculateShipmentWeight(data.items)` which issues a second `findMany` for the same parts (only `{ id, weight }`).

Two identical DB queries per shipping calculate request. Not a correctness issue — `weight.ts` has correct null fallback (`DEFAULT_WEIGHT_KG = 1.0 kg`) — but an unnecessary round-trip.

---

## PASS ✅

### bf68f89 — PartReservation system

- **Schema:** `@@unique([partId, sessionId])`, `@@index([expiresAt])`, `@@index([partId])` ✅
- **POST /api/parts/reserve:** Zod validation ✅, transactional stock check ✅, counts active reservations excluding own sessionId ✅, upsert (extend timer on re-reserve) ✅, PART_NOT_FOUND → 404, PART_RESERVED → 409 ✅
- **DELETE /api/parts/reserve:** only deletes `orderId: null` (won't release orders already placed) ✅
- **Cron `/api/cron/reservation-part-expiry`:** CRON_SECRET guard `!cronSecret ||` pattern ✅, deletes `expiresAt < now AND orderId=null` ✅
- **vercel.json:** `*/5 * * * *` (every 5 min) ✅
- **Order linking:** `updateMany` with sessionId filter, sets `orderId: created.id` ✅

### 1f8e749 — Shipping calculate + Checkout reservation UI

- **POST /api/shipping/calculate:** Zod ✅, CARRIER_LIMITS per method ✅, PICKUP has Infinity limits (always available) ✅, parseDimensions handles "x", "×", JSON {l,w,h} ✅, correct unavailableReason message ✅
- **GET /api/shipping/zasilkovna-points:** dry-run mock when no API key ✅, `next: { revalidate: 86400 }` 24h cache ✅, query ≥ 2 chars guard ✅, filters name/city/zip ✅
- **Checkout reservation UI:** `getSessionId()` via sessionStorage + crypto.randomUUID() ✅, `reserveItems` called on cart change ✅, `beforeunload` cleanup with `keepalive: true` ✅, countdown timer → redirect to `/dily/kosik?expired=1` at 0 ✅, 409 conflict shown per-item ✅
- **Checkout shipping availability:** fetches `/api/shipping/calculate` on items load, disables unavailable methods ✅

### a8759d4 — Autocomplete + Smart Search

- **GET /api/parts/autocomplete:** parallel Promise.all for 4 sections ✅, BigInt serialization via `Number(v)` ✅, OEM section only triggered when query matches OEM pattern ✅, fallback empty response on error ✅
- **GET /api/parts/smart-search:** NLP parser applied, Prisma where built from parsed intent ✅, year range filter via AND/OR ✅, `limit` capped at 50 ✅, returns parsed intent in response (useful for UI highlighting) ✅
- **lib/search-parser.ts:** year 1990–2099 regex ✅, MODEL_NAMES set for Skoda/VW models ✅, OEM pattern `[A-Z0-9][A-Z0-9.\-]{4,}` and non-pure-digit guard ✅
- **lib/search-synonyms.ts:** 30+ part synonyms, 40+ brand synonyms, 12 category keyword mappings ✅

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| FIXED | 2 | BUG-3 (checkout error), BUG-4 (admin totalAmount) |
| MEDIUM | 1 | OEM dot normalization in autocomplete |
| MINOR | 1 | Double DB query in shipping/calculate |

**Core functionality is solid.** BUG-1 (OEM dot normalization) should be patched before enabling OEM search suggestions — inconsistency with the existing OEM lookup fix. BUG-2 is cosmetic/performance only.
