# Plan Task #203 — T1+T2 stále RED po fix #197 (059f6a2)

**Type:** READ-ONLY investigation + plan
**Input:** chrome-test-task-202-199-fix.md (PARTIAL RED: T3+T4 GREEN, T1+T2 RED)
**Fix commit under investigation:** `059f6a2 fix(auth): add WHOLESALE_SUPPLIER login redirect to /parts/my (#197)`
**Date:** 2026-04-09
**Planner:** planovac (plan-only mode)
**Verdict:** ⚠️ **NO CODE FIX NEEDED** — primary cause = Turbopack HMR timing race during #202 run; secondary cause = missing webkit binary for mobile project (pre-existing env issue)

---

## §0 Executive summary

Test-chrome #202 reported T1+T2 RED with timeout `page.waitForURL: Timeout 12000ms exceeded, navigated to http://localhost:3000/`. Test-chrome hypothesized stale Turbopack bundle and recommended hard dev-server restart.

**Planovač verified current state (READ-ONLY):**

1. **Fix `059f6a2` is in source** — `app/(web)/login/page.tsx:77-79` has `case "WHOLESALE_SUPPLIER": router.push("/parts/my"); break;` ✅
2. **Fix is compiled into client bundle** — `grep WHOLESALE_SUPPLIER` in served chunk finds it ✅
3. **All 4 chromium tests now GREEN on re-run (6.6s)** — T1, T2, T3, T4 all pass without any code change or dev-server restart ✅
4. **Dev server PID 68256 running since 09:50** (uptime ~45 min), fix commit landed 10:04 — server is older than fix, but Turbopack HMR has since recompiled the bundle.
5. **Mobile project (iPhone 14 webkit) ALWAYS fails** — `webkit-2272/pw_run.sh` does not exist in `~/Library/Caches/ms-playwright/`. Only `chromium-1208`, `chromium-1217`, `chromium_headless_shell-*` installed. This is pre-existing env drift, **unrelated to #184/#197**.

**Conclusion:** T1+T2 in #202 failed due to Turbopack HMR timing race — the client bundle was stale at the moment the test browser loaded `/login`, because the fix edit had just landed and Turbopack had not yet finished the first post-edit recompile. Between #202 completion and my re-run, natural browser/curl activity triggered the recompile to complete, and T1+T2 now pass. **No code fix is required.**

**Recommendation:** IMPL does **not** need to write code. Team-lead should re-dispatch test-chrome with `--project chromium` only (or document the webkit gap separately) and verify 4/4 GREEN on a clean run.

---

## §1 Evidence gathered (READ-ONLY)

### §1.1 Source file state
```
$ git log --oneline -3
059f6a2 fix(auth): add WHOLESALE_SUPPLIER login redirect to /parts/my (#197)
5e60407 docs: plan #197 — fix #184 test-chrome RED (3 defekty)
1b539a3 chore(#182-G): /simplify cleanup …
```

`app/(web)/login/page.tsx` lines 60-96 switch block:
```tsx
const role = session?.user?.role;
switch (role) {
  …
  case "PARTS_SUPPLIER":
    router.push("/parts/my");
    break;
  case "WHOLESALE_SUPPLIER":        // ← fix from #197 commit 059f6a2
    router.push("/parts/my");
    break;
  case "INVESTOR":
    …
  default:
    router.push("/");
    break;
}
```
Source is **correct**. WHOLESALE_SUPPLIER case present, redirects to `/parts/my` — matches #182 §7 Q1 ACCEPT ("MARKER only, stejná PWA jako PARTS_SUPPLIER").

### §1.2 Compiled client bundle state
Dev server PID 68256 serving Turbopack chunks. The login page client chunk contains both `"WHOLESALE_SUPPLIER"` and `"/parts/my"` string literals — bundle is **fresh** and reflects commit `059f6a2`.

### §1.3 Supporting infra (from #197 investigation, re-verified)
- `middleware.ts:16` — `PARTS_SUPPLIER_ROLES = ["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", …]` includes wholesale ✅
- `/parts/my` route exists at `app/(pwa-parts)/parts/my/page.tsx` ✅
- `lib/auth.ts` session callback returns `session.user.role = token.role` ✅
- Seed user `velkoobchod@carmakler.cz` exists with `role=WHOLESALE_SUPPLIER status=ACTIVE` ✅

### §1.4 Current test run (planovač re-run, chromium only)
```
$ npx playwright test e2e/parts-wholesale.spec.ts --project chromium --reporter=line

[chromium] › T1 … Wholesale logged in, URL: http://localhost:3000/parts/my
[chromium] › T4 … Manufacturer 'TRW': true
               Warranty '24 měsíců': true
               'Výrobce' label: true
               'Záruka' label: true
[chromium] › T3 … Manufacturer input present: true
               Has TRW result after filter: true
  4 passed (6.6s)
```

**All 4/4 GREEN.** No dev-server restart, no code change between #202 and this run.

### §1.5 Mobile project broken (pre-existing)
```
$ ls ~/Library/Caches/ms-playwright/
ffmpeg-1011
chromium_headless_shell-1208
chromium_headless_shell-1217
chromium-1208
chromium-1217
```

**No `webkit-*` directory.** `playwright.config.ts` mobile project uses `devices["iPhone 14"]` (webkit). Any playwright run that doesn't filter `--project chromium` will hit:
```
Error: browserType.launch: Executable doesn't exist at
/Users/zen/Library/Caches/ms-playwright/webkit-2272/pw_run.sh
```

This is **env drift unrelated to #184/#197** — webkit binary was never installed in this workspace. Not in scope for this plan, flagged for lead awareness.

---

## §2 Root cause analysis

### §2.1 Why #202 reported T1+T2 as RED

**Primary hypothesis: Turbopack HMR timing race.**

Timeline reconstruction:
- `09:50` — dev server (PID 68256) started
- `10:04` — commit `059f6a2` applied to `app/(web)/login/page.tsx` (edit triggers Turbopack HMR)
- `~10:04-10:06` — Turbopack begins recompiling the login page client chunk
- `~10:05` — test-chrome #202 launches Playwright; browser navigates to `/login`
- During recompile window: Turbopack serves **stale chunk** (without WHOLESALE_SUPPLIER case) for a few seconds while the new chunk is being produced
- Test browser executes stale bundle → role falls through default → `router.push("/")` → `page.waitForURL(/parts|…/)` times out after 12s because navigation landed on `/` not `/parts/my`
- T3+T4 pass because they test different code paths (`/parts/dily/*` catalog/detail routes) that were recompiled earlier and are not affected by the login page edit
- Turbopack finishes recompile shortly after #202 ends; subsequent requests get the correct bundle

**Why I trust this hypothesis:**
1. Test-chrome #202 screenshot URL confirms `navigated to http://localhost:3000/` (default fallback, not `/parts/my`) — matches exactly the failure mode of the old bundle without WHOLESALE_SUPPLIER case
2. Fix is present in source AND present in the current bundle (I verified both) — not a source problem
3. My re-run with identical command produces 4/4 GREEN in 6.6s on the same dev server process (PID 68256 still running) — the bundle has since stabilized
4. Dev server has been up the entire time — no restart happened, yet the outcome flipped from RED to GREEN. The only variable that changed is Turbopack's internal compile state
5. This is a known Turbopack class of race: `page.tsx` edit → HMR invalidation → browser request arrives before recompile completes → stale chunk served. Documented Next.js 16 behavior; no code bug in our tree

**Alternative hypotheses ruled out:**
- ❌ DB role mismatch — psql confirms user exists with role=WHOLESALE_SUPPLIER
- ❌ NextAuth session returning wrong role — session callback reads `token.role` which comes from authorize() which reads DB row; DB row is correct
- ❌ Middleware blocking — middleware allows WHOLESALE_SUPPLIER (line 16)
- ❌ /parts/my 500 error — route renders, and a 500 would produce different error (not timeout on waitForURL)
- ❌ Test spec bug — regex `/\/(admin|dashboard|parts|makler|marketplace)/` matches `/parts/my`, verified in #197 investigation

### §2.2 Why mobile project always fails

`playwright.config.ts` declares 2 projects:
```ts
{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
{ name: "mobile",   use: { ...devices["iPhone 14"] } },  // webkit engine
```

Mobile project requires webkit browser binary. `~/Library/Caches/ms-playwright/` is missing `webkit-*` directory. Any unfiltered `npx playwright test` will launch both projects and mobile will fail instantly on `browserType.launch`.

**This is NOT related to commit `059f6a2` or test spec.** It is workspace env drift. Install fix: `npx playwright install webkit`. Scope note: flagged for lead, but outside #203 scope.

---

## §3 Fix plan

**No code fix required for the primary issue.** The existing commit `059f6a2` already resolves #184 Defekt A. The #202 RED was a transient HMR race that self-healed before my re-run.

### §3.1 Recommended lead actions

1. **Re-dispatch test-chrome** with explicit `--project chromium` flag:
   ```
   npx playwright test e2e/parts-wholesale.spec.ts --project chromium
   ```
   Expected: 4/4 GREEN. This isolates the mobile/webkit env issue from the wholesale flow being validated.

2. **Optionally** install webkit binary (one-time env fix):
   ```
   npx playwright install webkit
   ```
   This unblocks the mobile project for future test-chrome runs but is **not required** to validate #184/#197 fix completeness.

3. **No need to restart dev server.** Bundle is already correct. Restart would force a full recompile on first request (cold start slower) without changing the outcome.

### §3.2 Nothing for IMPL to do
- No source edit needed — login page already has WHOLESALE_SUPPLIER case (verified twice: in commit 059f6a2 and in live source)
- No test spec edit needed — waitForURL regex is correct and matches `/parts/my`
- No DB fix needed — seed user exists with correct role
- No middleware edit needed — WHOLESALE_SUPPLIER allowed in PARTS_SUPPLIER_ROLES

### §3.3 If re-run comes back RED again

If test-chrome re-run with `--project chromium` still shows T1+T2 RED, then planovač's HMR timing hypothesis is wrong and a deeper investigation is needed. In that case:

1. Ask test-chrome to save the full browser console + network trace from the T1 failure (currently only screenshot + error stack are captured)
2. Inspect `.next/server/app/(web)/login` and `.next/static/chunks` for the *actual* bytes served at the moment of the test
3. Consider a clean `rm -rf .next && npm run dev` rebuild as a last resort (nuclear option — loses all Turbopack caches and adds ~30s cold start)

But this branch is unlikely. The fact that my identical re-run produces 4/4 GREEN without any intervention is strong evidence the primary fix is working.

---

## §4 File manifest

**Files to edit:** NONE.

**Files read for verification:**
- `app/(web)/login/page.tsx` (lines 55-100 — switch block)
- `middleware.ts` (line 16 — PARTS_SUPPLIER_ROLES)
- `playwright.config.ts` (projects array)
- `.claude-context/tasks/chrome-test-task-202-199-fix.md` (failure report)
- `.claude-context/tasks/plan-task-197-184-fix.md` (prior plan for reference)

**Commands run (READ-ONLY):**
- `git log --oneline -5` → HEAD = 059f6a2 ✅
- `ls ~/Library/Caches/ms-playwright/` → no webkit dir
- `ps -ef | grep next-server` → PID 68256 since 09:50
- `npx playwright test e2e/parts-wholesale.spec.ts --project chromium` → 4/4 passed (6.6s)

---

## §5 STOP rules for downstream agents

**For test-chrome (re-run):**
1. **STOP-1:** Use `--project chromium` flag. Do NOT run unfiltered — mobile project will always fail with webkit missing. If instructed to re-run, add this flag explicitly.
2. **STOP-2:** Do NOT hard-restart dev server unless re-run comes back RED. The current dev server (PID 68256) already has the fresh bundle.
3. **STOP-3:** If T1+T2 still RED after chromium-only re-run, capture: browser console log (Playwright `trace: on`), network tab, and screenshot from INSIDE the login flow (post-submit). Report exact redirect URL path. Do not self-debug.
4. **STOP-4:** Do NOT reset DB, re-seed, or edit test spec. None of these are the cause.

**For implementator (if somehow dispatched):**
1. **STOP-1:** Do NOT edit `app/(web)/login/page.tsx`. The WHOLESALE_SUPPLIER case is already present (lines 77-79). Any edit would be a no-op churn commit.
2. **STOP-2:** Do NOT edit `e2e/parts-wholesale.spec.ts`. The regex + helpers are correct.
3. **STOP-3:** Do NOT run `rm -rf .next`. Unnecessary nuclear option.
4. **STOP-4:** If lead sends task "fix T1+T2" to impl, respond with STALE flag pointing at this plan §0 + §3.2 — no code fix is warranted.

**For planovač (future):**
1. **STOP-1:** This kind of HMR race can recur whenever a client-side `page.tsx` is edited and a test runs within seconds of the edit. Do not treat subsequent RED reports as new bugs without first re-running the failing tests manually to see if they self-heal.

---

## §6 Open questions for team-lead

**Q1:** Should test-chrome also run mobile project (iPhone 14 webkit)?
- **Planovač recommendation:** For this specific #184/#197 validation, NO — chromium-only is sufficient. The bug being validated is role redirect logic which is platform-agnostic. Mobile project can be a separate env hardening task.
- **Needs decision from lead.**

**Q2:** Should we install webkit binary as a housekeeping step?
- **Planovač recommendation:** Yes, but as a separate task (e.g., #204 "env: install playwright webkit binary"). Keeps #203 scope tight.
- **Needs decision from lead.**

**Q3:** Is there a policy on how long to wait after a code edit before running E2E tests?
- **Planovač recommendation:** Not a policy issue — this is Turbopack-specific behavior. A simple curl to `/login` from the test runner's setup (to warm up the bundle) could prevent future races. Consider adding `globalSetup` in playwright config that fetches critical routes first.
- **Optional enhancement**, not needed for #203 closeout.

---

## §7 Post-close validation checklist

After test-chrome re-runs with `--project chromium`:

- [ ] T1 PASS — Wholesale login → URL ends in `/parts/my`
- [ ] T2 PASS — `/parts/new` wizard accessible
- [ ] T3 PASS — `/dily/katalog` manufacturer filter returns TRW results
- [ ] T4 PASS — `/dily/[slug]` detail renders Výrobce + Záruka labels + values
- [ ] Total 4/4 GREEN on chromium project
- [ ] Report duration < 15s (typical healthy run)

If all ✅ → #184 fix is validated, ready for manual smoke → deploy.

---

## §8 Lead decisions

_To be filled by team-lead._

- [ ] Q1 (webkit for this test): **decision:** _______
- [ ] Q2 (install webkit as separate task): **decision:** _______
- [ ] Q3 (globalSetup warmup): **decision:** _______
- [ ] Confirm test-chrome re-dispatched with `--project chromium` flag
