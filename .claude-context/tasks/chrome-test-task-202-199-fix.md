# Task #202 — Re-run parts-wholesale po fix #199: Headed Chrome Smoke Test

**Fix commit under test:** `059f6a2 fix(auth): add WHOLESALE_SUPPLIER login redirect to /parts/my (#197)`  
**Date:** 2026-04-09  
**Runner:** TEST-CHROME agent (claude-sonnet-4-6)  
**Verdict:** PARTIAL RED ⚠️ — 2/4 PASS (T3+T4 GREEN, T1+T2 still RED)

---

## Test Results Summary

| Test | Description | #196 | #202 | Δ |
|------|-------------|------|------|---|
| T1 | WHOLESALE_SUPPLIER login + middleware /parts gating | ❌ FAIL | ❌ FAIL | — |
| T2 | WHOLESALE_SUPPLIER → /parts/new wizard accessible | ❌ FAIL | ❌ FAIL | — |
| T3 | /dily/katalog manufacturer filter — TRW returns results | ❌ FAIL | ✅ PASS | ✅ fixed |
| T4 | /dily/[slug] detail render — manufacturer + warranty visible | ❌ FAIL | ✅ PASS | ✅ fixed |

**Total: 2/4 PASS — Duration: 20.1s**

---

## What Was Fixed (T3 + T4)

### T3 — Manufacturer filter: NOW PASS ✅
- Catalog `/dily/katalog`: filter input visible
- Typing "TRW" → TRW results appear
- `hasProducts` = true ✅

### T4 — Detail page: NOW PASS ✅
```
Manufacturer 'TRW': true
Warranty '24 měsíců': true
'Výrobce' label: true
'Záruka' label: true
```
- `/dily/trw-brzdove-desticky-octavia-iii` renders all 4 fields correctly ✅

---

## Still Failing: T1 + T2

**Exact error (identical to #196):**
```
TimeoutError: page.waitForURL: Timeout 12000ms exceeded.
waiting for navigation until "load"
  navigated to "http://localhost:3000/"
at loginAs (...parts-wholesale.spec.ts:21:14)
```

**Screenshots:**
- T1: `test-results/parts-wholesale-T1-WHOLESA-0a397-gin-middleware-parts-gating-chromium/test-failed-1.png`
- T2: `test-results/parts-wholesale-T2-WHOLESA-4b64f-parts-new-wizard-accessible-chromium/test-failed-1.png`

---

## Investigation (READ-ONLY, STOP per protocol)

**Confirmed facts:**
1. Fix IS in source code — `app/(web)/login/page.tsx` line 77-79:
   ```typescript
   case "WHOLESALE_SUPPLIER":
     router.push("/parts/my");
     break;
   ```
2. Commit `059f6a2` is the current HEAD (`git log --oneline -5` confirmed)
3. Dev server is running and healthy — `curl /api/parts` returns data with `manufacturer` + `warranty` fields ✅
4. DB is seeded — API returns Sachs/TRW/Bosch parts ✅

**Root cause hypothesis (cannot confirm without self-debugging):**

The Next.js dev server Turbopack compiled the login page client bundle **before** commit `059f6a2` was applied. The source file on disk is updated, but the compiled JS chunk served to the browser may be stale. When the browser runs `loginForm.tsx`, it executes the OLD bundle (without the WHOLESALE_SUPPLIER case) and falls to default → `router.push("/")`.

**Likely fix:** Hard restart of dev server (clears Turbopack's in-memory compilation cache):
```bash
pkill -f "next dev"  # or Ctrl+C the dev terminal
npm run dev
# wait for "Ready" then re-run tests
```

**Alternative hypothesis:** DB `velkoobchod@carmakler.cz` user has wrong role (not WHOLESALE_SUPPLIER) — but this is less likely since seed was confirmed in #196 and no `prisma migrate dev` reset happened since.

---

## STOP Notice

Per protocol: T1+T2 still fail → STOP. Not self-debugging. Escalating to team-lead.

The fix commit exists in code but the compiled client bundle may not reflect it. Developer should hard-restart dev server before re-test.

---

## Manual Smoke

**NOT PERFORMED** — skipping manual smoke because T1+T2 (login) still fail. Cannot proceed with manual login steps while automated login test fails.

---

## Diff vs #196

| Metric | #196 | #202 |
|--------|------|------|
| Login T1+T2 | ❌ | ❌ (same) |
| Manufacturer filter T3 | ❌ | ✅ |
| Detail page T4 | ❌ | ✅ |
| Total PASS | 0/4 | 2/4 |

T3 + T4 defects from #197 fix plan are resolved. Login redirect (#197 Issue #1) appears to be in code but not yet compiled into the dev bundle.

---

## Deploy Recommendation

**NOT READY** — T1+T2 login still fails. Recommend:
1. Developer hard-restarts dev server
2. TEST-CHROME re-runs T1+T2 on fresh server
3. If GREEN → proceed with manual smoke → deploy
