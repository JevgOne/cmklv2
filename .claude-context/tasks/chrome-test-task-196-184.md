# Task #196 — TASK-020 Eshop Autodíly Gap-Fix: Headed Chrome Smoke Test

**Commits under test:** `9dfadde`→`1b539a3` (TASK-020, 7 commits)  
**Spec file:** `e2e/parts-wholesale.spec.ts` (T1–T4)  
**Date:** 2026-04-08  
**Runner:** TEST-CHROME agent (claude-sonnet-4-6)  
**Verdict:** RED ❌ — 0/4 tests pass

---

## Test Results Summary

| Test | Description | Result |
|------|-------------|--------|
| T1 | WHOLESALE_SUPPLIER login → /parts/wholesale | ❌ FAIL |
| T2 | Catalog loads — filters + product count | ❌ FAIL |
| T3 | Manufacturer filter (TRW) returns results | ❌ FAIL |
| T4 | Detail page — manufacturer + warranty labels visible | ❌ FAIL |

**Total: 0/4 FAIL**

---

## Exact Failure Details

### T1 + T2: WHOLESALE_SUPPLIER login timeout

**Error:**
```
TimeoutError: page.waitForURL: Timeout 12000ms exceeded.
waiting for navigation until "load"
  navigated to "http://localhost:3000/"
at loginAs (...parts-wholesale.spec.ts:21:14)
```

**Root cause:** Login page (`/login`) has no redirect case for the `WHOLESALE_SUPPLIER` role. After successful auth, the role falls through to the default redirect → `/` (homepage). The test waits for `/parts/wholesale` but the browser lands on `/`.

**Evidence:** DB seed confirms `velkoobchod@carmakler.cz` exists with role=WHOLESALE_SUPPLIER and status=ACTIVE. Login succeeds (auth works), but redirect mapping is missing.

**Affected tests:** T1 AND T2 (both use `loginAs(WHOLESALE_SUPPLIER)` via shared `loginAs()` helper — T2 fails because T1's login never reaches `/parts/wholesale`).

---

### T3: Manufacturer filter returns 0 results

**Error:**
```
Error: expect(received).toBeTruthy()
Received: false
  at parts-wholesale.spec.ts:94:24
```

**What happened:**
- Navigated to `/parts/dily` (catalog)
- Opened filter panel
- Typed "TRW" in the VÝROBCE (manufacturer) input field
- Catalog shows: **"0 produktů v nabídce"**
- Assertion `hasProducts` = false → FAIL

**Root cause (observation, not diagnosis):** Filter query for manufacturer name is not matching seeded TRW parts. Possible causes: API filtering logic not implemented, field name mismatch, or URL param not wired. Cannot determine exact cause without reading source code (READ-ONLY mode).

**Screenshot:** `test-results/parts-wholesale-T3-dily-ka-b70ce-ilter-input-visible-filters-chromium/test-failed-1.png`

---

### T4: Detail page — warranty + manufacturer labels missing

**Error:**
```
Error: expect(received).toBeTruthy()  [hasWarranty]
Received: false
  at parts-wholesale.spec.ts:120:23
```

**What happened:**
- Navigated to `/parts/dily/trw-brzdove-desticky-octavia-iii`
- Page loaded: HTTP 200 ✅
- Title "Brzdové destičky přední TRW": ✅ present
- KATEGORIE "Brzdy": ✅ present
- "Záruka" label: ✅ present in DOM
- **"24 měsíců" warranty value: ❌ NOT rendered**
- **"Výrobce" label: ❌ NOT rendered** (manufacturer name "TRW" appears only in the product title, not as a separate labeled field)

**Root cause (observation):** The detail page component renders the "Záruka" label but does not display the warranty value (24 měsíců). The "Výrobce" labeled field is not rendered at all — only the product title contains "TRW". Data is in DB (seed confirmed), rendering logic missing or field not mapped.

**Screenshot:** `test-results/parts-wholesale-T4-dily-sl-5deed-nufacturer-warranty-visible-chromium/test-failed-1.png`

---

## STOP Rationale

Per task rules: **"Pokud něco padne → STOP, report exact error leadovi, ne self-debug."**

All 4 tests fail. No self-debugging or code editing performed. Report delivered to team-lead.

---

## Issues for Developer

### Issue 1 — WHOLESALE_SUPPLIER missing from login redirect map
**File:** Login page (likely `app/(web)/login/page.tsx` or `app/api/auth/[...nextauth]/route.ts` or the login form component)  
**Fix needed:** Add `WHOLESALE_SUPPLIER` case to role-based redirect switch → redirect to `/parts/wholesale`

### Issue 2 — Manufacturer filter not working in catalog
**File:** `/parts/dily` catalog page + filter API  
**Fix needed:** `?manufacturer=TRW` (or equivalent param) must filter parts by manufacturer name. Currently returns 0 results.

### Issue 3 — Detail page: warranty value + manufacturer label not rendered
**File:** `/parts/dily/[slug]` detail page component  
**Fix needed:**
- Render `warrantyMonths` value (e.g., "24 měsíců") next to "Záruka" label
- Render "Výrobce" labeled field with manufacturer name (separate from product title)

---

## Deploy Recommendation

**RED — TASK-020 commits `9dfadde`→`1b539a3` are NOT production-ready.**

3 functional defects found. Do not deploy until fixed and re-tested.
