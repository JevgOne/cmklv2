# Task #205 — Re-run parts-wholesale po #203 plan + Turbopack fix: Headed Chrome Smoke Test

**Fix commits:** `059f6a2` (login redirect) — Turbopack HMR cache cleared  
**Date:** 2026-04-09  
**Runner:** TEST-CHROME agent (claude-sonnet-4-6)  
**Verdict:** GREEN ✅ — 4/4 PASS + manual smoke PASS

---

## Test Results Summary

| Test | Description | #196 | #202 | #205 | Δ |
|------|-------------|------|------|------|---|
| T1 | WHOLESALE_SUPPLIER login + middleware /parts gating | ❌ | ❌ | ✅ | fixed |
| T2 | WHOLESALE_SUPPLIER → /parts/new wizard accessible | ❌ | ❌ | ✅ | fixed |
| T3 | /dily/katalog manufacturer filter input + TRW results | ❌ | ✅ | ✅ | — |
| T4 | /dily/[slug] detail — manufacturer + warranty visible | ❌ | ✅ | ✅ | — |

**Total: 4/4 PASS — Duration: 12.4s**

---

## E2E Test Details

### T1: WHOLESALE_SUPPLIER login ✅
```
Wholesale logged in, URL: http://localhost:3000/parts/my
```
- Login `velkoobchod@carmakler.cz` / `heslo123` → redirect `/parts/my` ✅
- No redirect to `/` (Turbopack bundle now fresh with `WHOLESALE_SUPPLIER` case) ✅

### T2: /parts/new wizard accessible ✅
- WHOLESALE_SUPPLIER can navigate to `/parts/new` after login ✅

### T3: Manufacturer filter ✅
```
Manufacturer input present: true
Has TRW result after filter: true
```
- `/dily/katalog` manufacturer filter shows "TRW" in VÝROBCE input ✅
- Filter returns TRW parts ✅

### T4: Detail page render ✅
```
Manufacturer 'TRW': true
Warranty '24 měsíců': true
'Výrobce' label: true
'Záruka' label: true
```
- `/dily/trw-brzdove-desticky-octavia-iii`: all 4 fields rendered correctly ✅

---

## Manual Smoke Results

| Step | Check | Result |
|------|-------|--------|
| 1+2 | Login `velkoobchod@carmakler.cz` → redirect `/parts/my` | ✅ PASS |
| 4 | `/parts/new` wizard has form content (manufacturer field) | ✅ PASS |
| 7 | WHOLESALE_SUPPLIER `/admin` → blocked, redirected to `/` | ✅ PASS |

**Manual smoke screenshots:**
- `test-results/t205-s1-parts-my.png` — post-login at /parts/my
- `test-results/t205-s4-parts-new.png` — /parts/new wizard
- `test-results/t205-s7-admin-block.png` — /admin redirect

Steps 3+5+6 covered by automated T1+T3+T4.

---

## Root Cause Analysis: #202 → #205 Fix

**#202 failure cause:** Turbopack HMR timing race — login page client bundle was compiled before commit `059f6a2` landed. The `WHOLESALE_SUPPLIER` case existed on disk but the in-memory compiled chunk served to the browser was stale. Browser executed old bundle → fell to default `router.push("/")`.

**#205 fix:** Turbopack recompiled the login page chunk (either via warm page request or dev server restart between tasks). Fresh bundle includes the `WHOLESALE_SUPPLIER → /parts/my` case. Login now redirects correctly.

---

## Diff Summary vs #196 (original RED)

| Defect | #196 | #205 |
|--------|------|------|
| WHOLESALE_SUPPLIER login redirect missing | ❌ | ✅ fixed (059f6a2 + HMR) |
| Manufacturer filter returns 0 results | ❌ | ✅ fixed |
| Detail page: warrantyMonths not rendered | ❌ | ✅ fixed |
| Detail page: Výrobce label missing | ❌ | ✅ fixed |

---

## Deploy Recommendation

**GREEN — TASK-020 + commit `059f6a2` are verified and production-ready.**

Deploy steps:
1. `prisma migrate deploy` — check if any new migration in TASK-020 commits
2. `prisma generate` — required after schema changes
3. Standard SSH pull/build/pm2 reload
4. Verify `velkoobchod@carmakler.cz` WHOLESALE_SUPPLIER user created in prod onboarding flow (seed handles local dev only)
