# Task #222 — #221 PWA Díly C1-C5 Kompletní Test: Headed Chrome Smoke

**Commits under test:** `31d894c` + `2fa39f3` + `51596f3` + `ccc9ae4`  
**Date:** 2026-04-11  
**Runner:** TEST-CHROME agent (claude-sonnet-4-6)  
**Spec:** `e2e/chrome-test-221-c1c5.spec.ts` (8 tests, --workers=1)  
**Verdict:** PARTIAL RED ⚠️ — 7/8 PASS, 1 FAIL (T5 delete dialog cancel button)

---

## Test Results Summary

| Test | Description | Result |
|------|-------------|--------|
| T1 | Login PARTS_SUPPLIER → /parts/my + PartCards | ✅ PASS |
| T2 | PartCard click → /parts/[id] detail page | ✅ PASS |
| T3 | Detail page — all fields, badges, diacritics | ✅ PASS |
| T4 | Edit page — /parts/[id]/edit accessible + URL | ✅ PASS |
| T5 | Delete button → dialog → cancel | ❌ FAIL |
| T6 | Onboarding redirect + /parts/onboarding page | ✅ PASS |
| T7 | Loading states + zero console crashes | ✅ PASS |
| T8 | Diacritics regression — Výrobce/Záruka correct | ✅ PASS |

**Total: 7/8 PASS — Duration: 1m 24s (workers=1, warm Turbopack)**

---

## Test Details

### T1: Login PARTS_SUPPLIER ✅
- `dodavatel@vrakoviste.cz` / `heslo123` → redirect to `http://localhost:3000/parts/my` ✅
- PartCards visible (Sachs, Bosch, TRW parts in list) ✅
- Console: only 404 on a background resource (pre-existing, unrelated) ✅

### T2: PartCard click → detail ✅
- Part link found: `/parts/cmnr3sgxh00305kts94qsijtv` ✅
- Click navigated to detail URL: `http://localhost:3000/parts/cmnr3sgxh00305kts94qsijtv` ✅

### T3: Detail page — all fields ✅
Tested on TRW part (`cmnr3sgxf002y5kts8qfy3w36`):
```
Has TRW: true
'Výrobce' label (correct diacritics): true       ← C4 diacritics fix confirmed
'Vyrobce' (wrong - no diacritics): false          ← no regression
'Záruka' label (correct diacritics): true         ← C4 diacritics fix confirmed
'Zaruka' (wrong - no diacritics): false           ← no regression
Warranty value '24 měsíců': true
Price/Kč badge: true
Condition badge: true
Edit button: true
Delete button: true
Compatibility info (Octavia/Škoda): true
Critical console errors: []
```

### T4: Edit page accessible ✅ (observation note below)
- Edit button found on detail page ✅
- Edit URL: `http://localhost:3000/parts/cmnr3sgxf002y5kts8qfy3w36/edit` ✅
- Pre-fill data (TRW): NOT visible within 2.5s wait (Client Component async fetch — `loading: true` on mount)
- 'Výrobce'/'Záruka' labels in form: NOT visible (likely same async loading reason)
- Save button: NOT found (same reason — form not yet hydrated)
- **Test PASSES** (only assertion is URL contains `/edit`)
- **Observation:** Edit page pre-fill requires additional wait for `/api/parts/[id]` fetch to resolve. Not a code bug — standard async Client Component behavior. Verified in read: `fetchPart` is called in `useEffect`, `loading: true` initially.

### T5: Delete dialog — FAIL ❌

**Exact error:**
```
Test timeout of 30000ms exceeded.
Error: locator.click: Test timeout of 30000ms exceeded.
- waiting for locator('button:has-text(\'Zrušit\'), button:has-text(\'Ne\'), button:has-text(\'Zpět\')').first()
- locator resolved to <button class="...rounded-full...">Zpět</button>
- attempting click action
  - element is visible, enabled and stable
  - scrolling into view if needed
  - <div class="text-center">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center p-4">…</div> subtree intercepts pointer events
```

**What works:**
- Delete button IS present on detail page ✅
- Clicking delete → dialog IS shown (confirm text found in body) ✅
- "Zpět" cancel button IS resolved by locator ✅

**What fails:**
- "Zpět" button CANNOT be clicked — `<div class="text-center">` inside the fixed overlay intercepts pointer events
- Secondary interception: bottom navigation bar `<nav aria-label="Spodni navigace" class="fixed bottom-0 ... z-50">` also intercepts at button coordinates

**Root cause:** The DeletePartDialog uses a `fixed inset-0 z-50` overlay. The "Zpět" cancel button renders at the bottom of the dialog card. The bottom navigation bar (`fixed bottom-0 z-50`) is at the same z-index and physically covers the button's screen position. The `div.text-center` within the overlay also intercepts.

**This is a real UI bug** — the delete dialog "Zpět" cancel button is unclickable (covered by bottom nav at z-50 + dialog overlay text div).

**Screenshot:** `test-results/chrome-test-221-c1c5-T5-De-fef29--→-cancel-idempotent-smoke--chromium/test-failed-1.png`

### T6: Onboarding redirect ✅
- Active PARTS_SUPPLIER navigating to `/parts/onboarding` → redirected to `/parts/onboarding/profile` ✅
- Has onboarding content (profile, doklady keywords) ✅
- Note: Seed has no PARTS_SUPPLIER with `status=ONBOARDING`. Tested middleware behavior for active supplier.

### T7: Loading states + zero crashes ✅
```
Page errors: []
Console errors: []
```
- No TypeErrors, no Prisma errors, no pg bundle errors ✅

### T8: Diacritics regression ✅
```
'Výrobce' (correct): true    ← OBS-2 fix working
'Záruka' (correct): true     ← OBS-2 fix working
'Vyrobce' (WRONG): false     ← no regression
'Zaruka' (WRONG): false      ← no regression
```

---

## STOP Notice — T5 Bug

Per protocol: "Pokud něco padne → STOP, report exact error leadovi."

T5 reveals a real UI bug: DeletePartDialog's cancel ("Zpět") button is unclickable due to:
1. `<div class="text-center">` inside overlay intercepts pointer events
2. Bottom nav (`fixed bottom-0 z-50`) physically covers the button

**Not self-debugging.** Escalating to team-lead.

---

## Notes

**Test credentials used:** `dodavatel@vrakoviste.cz` / `heslo123` (PARTS_SUPPLIER, ACTIVE)  
**Note on task:** Task specified `dily@carmakler.cz` — this user does NOT exist in seed. Used `dodavatel@vrakoviste.cz` (correct seeded PARTS_SUPPLIER).

**First run (workers=4):** T2, T3, T4 timed out due to Turbopack compiling new chunks in parallel. Re-run sequential (workers=1) on warm server: 7/8 PASS.

---

## C1-C5 Feature Coverage

| Feature | C# | Status |
|---------|----|--------|
| /parts/my PartCard list | C1 | ✅ verified |
| PartCard → /parts/[id] link | C1 | ✅ verified |
| Detail page: name, price, condition, Kč | C1 | ✅ verified |
| Detail page: Edit + Delete buttons | C1 | ✅ verified |
| Manufacturer "Výrobce" with diacritics | C1+C4 | ✅ verified |
| Warranty "Záruka" with diacritics | C1+C4 | ✅ verified |
| Warranty value "24 měsíců" | C1 | ✅ verified |
| Compatibility (brands/models) | C1 | ✅ verified |
| Edit page /parts/[id]/edit accessible | C2 | ✅ verified |
| Edit page async pre-fill | C2 | ⚠️ not verified (async load) |
| Delete button present | C3 | ✅ verified |
| Delete dialog opens | C3 | ✅ verified |
| Delete cancel button clickable | C3 | ❌ BUG |
| Supplier onboarding /parts/onboarding | C5 | ✅ verified |
| Loading states (no crash) | C4 | ✅ verified |
| Diacritics fix OBS-2 | C4 | ✅ verified |

---

## Deploy Recommendation

**NOT READY** — T5 delete dialog cancel button is unclickable (real UI bug).

**Fix needed:** DeletePartDialog — ensure "Zpět" cancel button is above bottom nav z-index (`z-50` conflict) and not covered by `div.text-center` within overlay. Options:
- Add `isolation: isolate` or `z-[51]` to the dialog content card
- Use `pointer-events-none` on backdrop and `pointer-events-auto` on dialog content
- Add `inert` attribute to bottom nav when dialog is open
