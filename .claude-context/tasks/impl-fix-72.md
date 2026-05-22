# Task #72: AdminSidebar logout + E2E locator verification

## Status: COMPLETED (already implemented)

## Date: 2025-04-05

## Summary

Both items in this task were already implemented by a previous agent/watcher. Verification confirmed everything is correct.

## Item 1: AdminSidebar logout button

**File:** `components/admin/AdminSidebar.tsx`

Already contains:
- `import { signOut } from "next-auth/react"` (line 5)
- Logout button in footer section (lines 177-186)
- `onClick={() => signOut({ callbackUrl: "/login" })}` handler
- Logout SVG icon + "Odhlasit" label
- Proper styling with hover states

## Item 2: E2E locator verification

All 8 e2e spec files already use `page.locator("#main-content")`:

| File | Status |
|------|--------|
| `e2e/admin-dashboard.spec.ts` | OK - uses `#main-content` |
| `e2e/admin.spec.ts` | OK - uses `#main-content` |
| `e2e/auth.spec.ts` | OK - uses `#main-content` |
| `e2e/broker-pwa.spec.ts` | OK - uses `#main-content` |
| `e2e/eshop.spec.ts` | OK - uses `#main-content` |
| `e2e/inzerce.spec.ts` | OK - uses `#main-content` |
| `e2e/marketplace.spec.ts` | OK - uses `#main-content` |
| `e2e/navigation.spec.ts` | OK - uses `#main-content` |

Zero instances of bare `locator("main")` found across the codebase.

## Verification

- TypeScript check: 0 errors
- No code changes needed
