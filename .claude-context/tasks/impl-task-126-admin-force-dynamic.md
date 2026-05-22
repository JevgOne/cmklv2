---
task: 126
title: Fix CI build job — admin pages force-dynamic (no prerender)
type: IMPL
owner: implementator
status: PUSHED
size: S
risk: LOW
priority: URGENT
created: 2026-04-07
commit: f2d80bf
---

# #126 IMPL — admin force-dynamic fix CI build

## §0 Scope provedeno

Fix CI Build job failure na commit `56614b7`. Root cause: admin server components volaly Prisma top-level → prerender errror s dummy DATABASE_URL → build exit 1.

**Fix:** `export const dynamic = "force-dynamic"` na všech 12 admin pages s prisma importem.

| File | Edit |
|---|---|
| `app/(admin)/admin/dashboard/page.tsx` | +4 lines |
| `app/(admin)/admin/leads/page.tsx` | +4 lines |
| `app/(admin)/admin/leads/[id]/page.tsx` | +4 lines |
| `app/(admin)/admin/marketplace/page.tsx` | +4 lines |
| `app/(admin)/admin/partners/page.tsx` | +4 lines |
| `app/(admin)/admin/manager/page.tsx` | +4 lines |
| `app/(admin)/admin/manager/approvals/page.tsx` | +4 lines |
| `app/(admin)/admin/manager/bonuses/page.tsx` | +4 lines |
| `app/(admin)/admin/manager/brokers/page.tsx` | +4 lines |
| `app/(admin)/admin/manager/brokers/[id]/page.tsx` | +4 lines |
| `app/(admin)/admin/manager/brokers/[id]/transfer/page.tsx` | +4 lines |
| `app/(admin)/admin/manager/vehicles/[id]/edit/page.tsx` | +4 lines |

**Total: 12 files, +48/-0 lines**

---

## §1 Root cause

`prisma.config.ts` (#114) throws když `DATABASE_URL` chybí → fix #121 přidal dummy DATABASE_URL na CI step level → `prisma generate` projde ale `next build` selhal v prerender fázi:

```
prisma:error
Invalid `prisma.vehicle.count()` invocation:
User was denied access on the database `(not available)`

Error occurred prerendering page "/admin/dashboard"
Export encountered an error on /(admin)/admin/dashboard/page: /admin/dashboard, exiting the build.
⨯ Next.js build worker exited with code: 1
```

Admin pages volaly `prisma.vehicle.count()`, `prisma.user.findMany()` atd. v top-level server components → Next.js se snažil prerender → dummy DB throws P1010 → fatal.

---

## §2 Identification (Step 1 dispatch)

```bash
Grep "from \"@/lib/prisma\"" app/(admin) → 12 files
Grep "export const dynamic" app/(admin) → 0 files (žádný neměl)
```

**Cross-check s build error log:** První fatal byl `/admin/dashboard`. Build exitne na první error, ale ostatní admin pages se stejnou prisma top-level patternou by failnuly taky → preventivně přidáno na všech 12.

---

## §3 Fix pattern

Insert pattern (před `export default async function`):

```typescript
// Admin pages call Prisma at top of server component — force dynamic
// rendering aby Next.js neskoušel prerender v build time bez DB.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
```

---

## §4 Acceptance Criteria

| AC | Status | Verifikace |
|---|---|---|
| **AC1** lokálně `npm run build` projde s dummy DATABASE_URL | ✅ | `DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm run build` → **EXIT 0**, "✓ Compiled successfully in 21.1s" |
| **AC2** CI 4/4 jobs green (lint, typecheck, test, build) | ⏳ **PENDING** — `gh` CLI nedostupný, monitor manually via https://github.com/JevgOne/cmklv2/actions |
| **AC3** žádný admin source code logic refactoring | ✅ | jen `export const dynamic = "force-dynamic"` přidán, žádné prisma queries / layout changes |
| **AC4** real DB build stále funguje | ✅ | `DATABASE_URL=postgresql://zen@localhost:5432/carmakler npm run build` → **EXIT 0** |
| **AC5** production server stále renderuje admin pages OK | ⏳ **PENDING DEPLOY** — bude verifikováno post-deploy |

**Bonus:**
- ESLint: 0 errors, 542 warnings (baseline preserved) ✅
- TypeScript: 0 errors ✅

---

## §5 Build output verify

**Before fix (dummy DB):**
```
Generating static pages (235/314)
prisma:error Invalid `prisma.vehicle.count()` invocation
Error occurred prerendering page "/admin/dashboard"
⨯ Next.js build worker exited with code: 1
EXIT=1
```

**After fix (dummy DB):**
```
✓ Compiled successfully in 21.1s
EXIT=0
```

**Admin routes status v build manifestu:**
```
├ ƒ /admin/dashboard               ← was prerender fail, now Dynamic
├ ƒ /admin/leads
├ ƒ /admin/leads/[id]
├ ƒ /admin/manager
├ ƒ /admin/manager/approvals
├ ƒ /admin/manager/bonuses
├ ƒ /admin/manager/brokers
├ ƒ /admin/manager/brokers/[id]
├ ƒ /admin/manager/brokers/[id]/transfer
├ ƒ /admin/manager/vehicles/[id]/edit
├ ƒ /admin/marketplace
├ ƒ /admin/partners
```

(Pozn.: `/admin/brokers`, `/admin/feeds`, `/admin/inzerce`, `/admin/feeds/new` zůstávají ○ Static — nemají prisma import, jsou client/static pages.)

**Non-fatal residue:**
- `prisma:error` lines pro `chci-prodat`, `nabidka` etc. — tyto pages mají try/catch wrapping kolem prisma queries, takže jen logují warning a render fallback content. Build NEselhává. Pre-existing chování, nedotčeno tímto fixem.

---

## §6 Out of scope

- ❌ **NEMĚNIT** prisma queries (zachovat funkčnost s real DB)
- ❌ **NEMĚNIT** admin layout (`app/(admin)/layout.tsx`) — neimportuje prisma
- ❌ **(web)/(pwa)** pages — fix jen na ty které build skutečně failovaly v admin routě

**Layout check:** `Grep "from @/lib/prisma" app/(admin)/**/layout.tsx` → 0 files. Layout je čistý, jen page-level fixy potřeba.

---

## §7 Git

```
commit f2d80bf
Author: JevgOne <jevgone@github.com>
Date:   Tue Apr 7

    fix(admin): #126 force-dynamic admin pages — fix CI build with dummy DATABASE_URL

    Admin server components call Prisma at top-level, so Next.js was attempting
    to prerender them at build time. With dummy DATABASE_URL in CI (per #114
    hardening + #121 step-level env), the prisma queries throw P1010 "User was
    denied access on db (not available)" → /admin/dashboard prerender error →
    build worker exit 1 → CI build job fails.

    Architecturally correct fix: admin pages should never be statically
    prerendered — they're auth-gated and data is constantly changing.

    Verified locally:
    - dummy DATABASE_URL build → EXIT 0
    - real DB build → EXIT 0
    - All 12 admin routes now ƒ (Dynamic)
    - ESLint baseline preserved (542 warnings, 0 errors)
    - TypeScript clean

    Refs: #126

 12 files changed, 48 insertions(+)
```

**Push:** `56614b7..f2d80bf  main -> main` ✅

---

## §8 Next steps

1. ✅ Push na origin/main
2. ⏳ AC2 — manual CI monitor via https://github.com/JevgOne/cmklv2/actions
3. ⏳ AC5 — post-deploy verify admin pages renderují OK na produkci
4. ⏳ TaskUpdate #124 → completed (po PASS CI)
5. ⏳ SendMessage team-lead s acceptance check + CI status

---

**Implementace dokončena. 12 admin pages dynamically rendered, build EXIT=0 s dummy i real DB, 0 deviation, 0 logic refactoring.**
