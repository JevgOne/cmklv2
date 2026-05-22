---
task: 121
title: CI fix — dummy DATABASE_URL pro `npx prisma generate` ve 4 jobech
type: IMPL
owner: implementator
status: PUSHED
size: XS
risk: LOW
priority: URGENT
created: 2026-04-07
plan_ref: plan-task-120-ci-fix.md
commit: ea4386c
---

# #121 IMPL — CI fix: step-level env DATABASE_URL pro `prisma generate`

## §0 Scope provedeno

Implementoval jsem **Option A3** z plan-task-120-ci-fix.md §3 přesně dle specifikace:
- 1 soubor: `.github/workflows/ci.yml`
- 4 step-level `env:` bloky (lint + typecheck + test + build job)
- 8 insertions, 0 deletions
- `prisma.config.ts` **NESÁHL** — #114 hardening preserved

---

## §1 Diff

```diff
   - name: Generate Prisma Client
     run: npx prisma generate
+    env:
+      DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy"
```

Aplikováno **identicky 4×** v jobech `lint`, `typecheck`, `test`, `build`
před respective `Run ESLint` / `Run TypeScript check` / `Run unit tests` / `Build` kroky.

Build job má navíc už existující `env:` na `Build` stepu — netýká se ho (Změna D
v plánu specifikovala přidání **také** na `Generate Prisma Client` step build jobu,
protože throw fires v té step-action, ne až v `npm run build`).

---

## §2 Důvod

`prisma.config.ts` (commit `16367b4`, task #114) přidává:
```typescript
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set. Check your .env file.");
}
```

Tento throw fires při **každé** invokaci `prisma` CLI, včetně `npx prisma generate`.
Před #114 byl v `prisma.config.ts` silent fallback `|| "postgresql://zen@localhost:5432/carmakler"`
který CI maskoval. Po #114 4 CI joby selhávají s tímto throw.

**Fix:** přidat dummy `DATABASE_URL` pouze na step-level pro `Generate Prisma Client`
kroky. Stejný pattern už build job používal pro `Build` step (`npm run build`).

---

## §3 Acceptance Criteria — local verification

| AC | Status | Verifikace |
|---|---|---|
| **AC1** `npx prisma generate` projde s dummy DATABASE_URL | ✅ | `env -i PATH=$PATH HOME=$HOME DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npx prisma generate` → exit 0, "✔ Generated Prisma Client (v7.5.0) to ./node_modules/@prisma/client in 301ms" |
| **AC2** YAML syntax valid | ✅ | `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` → no error |
| **AC3** `prisma.config.ts` nezměněn | ✅ | `git diff HEAD~1 prisma.config.ts` → empty (#114 hardening preserved) |
| **AC4** Diff = exactly 4× added env block | ✅ | `git show ea4386c --stat` → `1 file changed, 8 insertions(+)` (4 jobs × 2 řádky) |
| **AC5** CI 4/4 jobs green na origin/main | ⏳ | **PENDING manual verification** — `gh` CLI nedostupný v environment, monitor přes https://github.com/JevgOne/cmklv2/actions |
| **AC6** Throw still fires lokálně bez DATABASE_URL | ✅ | `env -i PATH=$PATH HOME=$HOME npx prisma generate` → "Error: DATABASE_URL environment variable is not set. Check your .env file." |

---

## §4 Bonus local verifications (s dummy env)

```bash
env DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm run lint
# → 0 errors, 542 warnings (pre-existing)

env DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm run typecheck
# → 0 errors

env DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm run test:run
# → Test Files 15 passed (15), Tests 141 passed (141)
```

Všechny downstream commands fungují s dummy URL — zajištěno, že fix neopraví
jen `prisma generate` ale i navazující kroky v CI.

---

## §5 Git

```
commit ea4386c6705ff11b0b79d20731140c07444b1df2
Author: JevgOne <jevgone@github.com>
Date:   Tue Apr 7 10:54:22 2026 +0200

    fix(ci): #120 add dummy DATABASE_URL to prisma generate steps (4 jobs)

    prisma.config.ts (#114) throws when DATABASE_URL is unset, blocking
    `npx prisma generate` in 4 CI jobs (lint, typecheck, test, build).
    Add step-level env block on each Generate Prisma Client step with
    the same dummy URL the build job already uses for npm run build.

    Preserves #114 hardening — prisma.config.ts unchanged. Throw still
    fires locally when .env is missing, only CI provides dummy override.

    Refs: #120

 .github/workflows/ci.yml | 8 ++++++++
 1 file changed, 8 insertions(+)
```

**Push:** `16367b4..ea4386c  main -> main` ✅ pushed na `origin/main` v 2026-04-07 10:54

---

## §6 Out of scope (per plan §5)

- `prisma.config.ts` — hardening #114 preserved
- Žádné Option B (env-driven config) nebo Option C (job-level env) — Option A3 only
- Žádné jiné CI joby (e2e, deploy)
- `.env.example` — dev template

---

## §7 Next steps

1. ✅ Push na origin/main
2. ⏳ AC5 — manual CI monitor přes https://github.com/JevgOne/cmklv2/actions
3. ⏳ TaskUpdate #119 → completed (po PASS CI)
4. ⏳ SendMessage team-lead s acceptance check + CI URL

---

**Implementace dokončena. Plán plně dodržen, 0 deviation, prisma.config.ts hardening preserved.**
