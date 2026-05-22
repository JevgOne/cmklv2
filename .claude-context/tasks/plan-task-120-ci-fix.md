---
task_id: 120
type: PLAN
agent: planovac
status: draft
created: 2026-04-07
estimate: XS (~5 min Developer)
related_commits:
  - "16367b4 — fix: prod hardening — DATABASE_URL required (#114, root cause)"
  - "9936263 — fix: přidat prisma generate do lint jobu v CI"
  - "79e8755 — feat: production readiness Batch 2 — CI/CD setup"
related_tasks:
  - "#119 (kontrolor diagnostika — root cause analysis)"
  - "#118 (#120 PLAN — tento task)"
---

# #120 PLAN — Fix CI failures (prisma.config.ts throw blocks `prisma generate`)

## 1 — Root cause (verified)

**Konkrétně co se stalo:**

`prisma.config.ts:5-7` (added in commit `16367b4`):
```typescript
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set. Check your .env file.");
}
```

`prisma/config` package načítá `prisma.config.ts` při KAŽDÉM volání Prisma CLI (včetně `prisma generate`).

CI workflow `.github/workflows/ci.yml` má 4 joby (lint, typecheck, test, build). 3 z nich (lint/typecheck/test) volají `npx prisma generate` jako step PŘED hlavním command, ALE bez DATABASE_URL env block:

```yaml
# .github/workflows/ci.yml:37-38 (lint job — chybí DATABASE_URL env)
- name: Generate Prisma Client
  run: npx prisma generate
```

GitHub Actions runner nemá `DATABASE_URL` v env (žádný secret, žádná job-level env block) → `prisma.config.ts:5-7` throwne → `npx prisma generate` exit code ≠ 0 → step fails → entire job fails.

**Důsledek:** 3 z 4 CI jobů červené (lint, typecheck, test). Pouze `build` job by prošel, protože **už má** DATABASE_URL dummy env nastavený na řádcích 118-123:

```yaml
# .github/workflows/ci.yml:117-123 (build job — JIŽ funguje)
- name: Build
  run: npm run build
  env:
    DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy"
    NEXTAUTH_SECRET: "ci-build-secret-not-real"
    NEXTAUTH_URL: "http://localhost:3000"
    NEXT_PUBLIC_APP_URL: "http://localhost:3000"
```

**Klíčový insight:** Build job má dummy env pro `npm run build` step, ALE jeho předchozí `Generate Prisma Client` step (řádek 113-114) také běží **bez** DATABASE_URL. Takže build job by **také měl být červený**, pokud kontrolor diagnostika je správná. Pokud build job běžel zelený, znamená to že buď:
- (a) `prisma generate` v build job sub-jobu prošlo magickým způsobem (nepravděpodobné)
- (b) `prisma generate` skutečně failnul, ale následující kroky se přesto provedly (nemožné, GitHub Actions zastaví step on non-zero exit)
- (c) **build job NIKDY nedoběhl** protože `needs: [lint, typecheck, test]` (řádek 99) — když ty 3 selžou, build je skipped a nikdo nezjistil že má stejný bug

**Pravděpodobně (c).** Po fix lint/typecheck/test → build job poběží poprvé od `16367b4` → odhalí stejný bug → musíme fixnout 4 joby najednou, ne 3.

## 2 — Vybraná option + zdůvodnění

### Option A — Step-level `env:` block na `Generate Prisma Client` step (vybráno) ✅

**Konkrétně:** Přidat `env:` block na `Generate Prisma Client` step v 4 jobech (lint, typecheck, test, build). Hodnota: stejná dummy URL jako už build job používá (`postgresql://dummy:dummy@localhost:5432/dummy`).

**Zdůvodnění proti ostatním options:**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A1 (workflow-level top env)** | Single place, DRY | Affects ALL jobs incl. future ones, méně explicit | ❌ příliš široký scope |
| **A2 (job-level env block)** | Explicit per job, mirrors build job pattern | Duplikace ve 4 jobech, dummy URL v env i u steps co ji nepotřebují | OK ale širší než třeba |
| **A3 (step-level env block)** ✅ | Nejscoped, jen prisma generate dostane env, žádný leak do downstream steps, **explicit intent** | Duplikace ve 4 jobech (akceptovatelné — yml je deklarativní) | **VYBRANÁ — nejpřesnější** |
| B (soften throw) | Triviální | **ZTRÁCÍ HARDENING** z #114 (silent fallback bug, kterým komitm #114 fixoval) | ❌ regressuje #114 |
| C (smart detect via process.argv) | Cleanest config | Fragile — `npx prisma generate` může mít aliasy, build hooks, atd. Magic conditional. | ❌ křehké |
| D (CI env detection in prisma.config.ts) | Simple, hardening preserved local/prod | Modifikuje prisma.config.ts (broader blast radius), bypass v CI | OK ale modifikuje config soubor zbytečně |

**Klíčové důvody pro A3 (step-level):**

1. **Mirrors existing pattern** — Build job už používá identický dummy URL (`postgresql://dummy:dummy@localhost:5432/dummy`) na řádcích 118-123. Konzistentní s existujícím kódem.
2. **Preserves #114 hardening** — `prisma.config.ts` zůstává unchanged. Pokud někdo lokálně zapomene `.env`, throw stále funguje. Pokud někdo deployuje na server bez DATABASE_URL, throw stále funguje.
3. **Žádná modifikace produkčního kódu** — fix je čistě CI concern, ne change v `prisma.config.ts`. Single yml diff.
4. **Step-scoped** — dummy URL existuje pouze pro `Generate Prisma Client` step, nepronikne do dalších steps (`Run ESLint`, `Run TypeScript check`, atd.). Žádný side-effect na následující commands.
5. **Explicit intent** — yml čtenář vidí "tento step potřebuje DATABASE_URL", což je pravda. Nemusí pátrat po workflow-level env.

**Trade-off accepted:** 4× duplikace 1 řádku env. Lze v budoucnu refactorovat do composite action / reusable workflow, ale to je out of scope #120.

## 3 — Konkrétní změny (file → diff)

### File 1: `.github/workflows/ci.yml`

**Změna A — `lint` job (řádek 37-38):**
```diff
       - name: Generate Prisma Client
         run: npx prisma generate
+        env:
+          DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy"

       - name: Run ESLint
```

**Změna B — `typecheck` job (řádek 62-63):**
```diff
       - name: Generate Prisma Client
         run: npx prisma generate
+        env:
+          DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy"

       - name: Run TypeScript check
```

**Změna C — `test` job (řádek 87-88):**
```diff
       - name: Generate Prisma Client
         run: npx prisma generate
+        env:
+          DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy"

       - name: Run unit tests
```

**Změna D — `build` job (řádek 113-114) — POZOR, viz §1 insight:**
```diff
       - name: Generate Prisma Client
         run: npx prisma generate
+        env:
+          DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy"

       - name: Build
         run: npm run build
         env:
           DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy"
           NEXTAUTH_SECRET: "ci-build-secret-not-real"
           NEXTAUTH_URL: "http://localhost:3000"
           NEXT_PUBLIC_APP_URL: "http://localhost:3000"
```

> **Build job poznámka:** Build job má `needs: [lint, typecheck, test]` na řádku 99. Před commitm `16367b4` build job běžel zelený protože jeho dependencies byly zelené. Po `16367b4` selhaly dependencies → build job byl skipped → nikdo neověřil že má stejný bug. Bez fix Změny D by build job po fix Změn A-C jako první spadl. Změna D je proto **prevenční fix** — bez ní bychom potřebovali #121 hned po nasazení #120.

**Žádné jiné soubory neměnit.** `prisma.config.ts` zůstává unchanged (preserves #114 hardening).

## 4 — Verifikační kroky (lokálně před pushem)

CI environment lze simulovat lokálně pomocí dočasného unset DATABASE_URL:

### 4.1 Reprodukovat current bug (potvrdí root cause)
```bash
# V samostatném terminálu (NEPOUŽÍVAT current shell, .env.local by mohl override)
cd /Users/zen/Projects/cmklv2/cmklv2
env -i PATH=$PATH HOME=$HOME npx prisma generate
# Expected: Error: DATABASE_URL environment variable is not set. Check your .env file.
# Exit code: 1
```

### 4.2 Verifikovat fix lokálně (před commit/push)
```bash
# Stejný terminal trick, ale s dummy DATABASE_URL
env -i PATH=$PATH HOME=$HOME DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npx prisma generate
# Expected: ✔ Generated Prisma Client (v6.x.x) to ./node_modules/@prisma/client
# Exit code: 0
```

### 4.3 Verifikovat ESLint funguje s dummy DATABASE_URL
```bash
env -i PATH=$PATH HOME=$HOME DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm run lint
# Expected: žádný error (warnings OK)
# Exit code: 0
```

### 4.4 Verifikovat TypeScript funguje
```bash
env -i PATH=$PATH HOME=$HOME DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm run typecheck
# Expected: žádný error
# Exit code: 0
```

### 4.5 Verifikovat Vitest funguje (DB tests by měly skipovat / mockovat)
```bash
env -i PATH=$PATH HOME=$HOME DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm run test:run
# Expected: 141/141 passed
# Exit code: 0
```

> **Pozn:** Pokud Vitest selže s "Cannot connect to database" — to znamená že nějaký test reálně volá DB místo aby ji mockoval. To by byl separate bug (ne #120 scope). #120 fix by ale měl odhalit (pokud existuje), takže lokální verify je důležité.

### 4.6 yml syntax check
```bash
# Pokud máme `actionlint` lokálně:
actionlint .github/workflows/ci.yml
# Else: yamllint nebo Python yaml validator
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"
# Expected: bez output (success)
```

### 4.7 Acceptance pre-push checklist
- [ ] 4 step-level `env:` bloky přidány na všech 4 jobech
- [ ] `prisma.config.ts` UNCHANGED (žádný throw modification)
- [ ] Žádný jiný soubor modifikován
- [ ] yml syntax valid
- [ ] Lokální §4.2-4.5 testy zelené s dummy DATABASE_URL

## 5 — Po pushi: jak monitorovat CI

**Bohužel `gh` CLI není dostupný.** Manual check workflow:

### 5.1 GitHub web UI
- URL: `https://github.com/JevgOne/cmklv2/actions` (nebo `cmklv2/cmklv2`, podle remote)
- Po `git push origin main` se objeví nový run pro commit
- Status: yellow (running) → green (success) nebo red (failure)
- Klikni na run → 4 joby (lint, typecheck, test, build) → každý by měl být green

### 5.2 GitHub email notifikace
- Pokud je nastaveno v repo settings → email po každém run failu
- Subject: `[JevgOne/cmklv2] Run failed: CI - main`
- Email obsahuje link na konkrétní failed step

### 5.3 Co dělat pokud CI po fix stále failuje
1. **Lint failure** — pokud lint failuje na něčem jiném než prisma generate, je to nesouvisející bug → separate task
2. **Test failure** — pokud Vitest failuje s "DB connection refused", separate task #122 — fix mocking
3. **Build failure** — pokud build job failuje na něčem jiném než prisma generate, separate task #123 — fix build

### 5.4 Smoke test po deployu fix do main
```bash
# Po push of fix:
git log --oneline -1
# Note commit SHA, ideally kontrast s 16367b4 baseline

# Open https://github.com/JevgOne/cmklv2/actions ručně
# Wait ~3-5 min for CI to complete
# Verify all 4 jobs zelené pro commit SHA
```

## 6 — Acceptance criteria

| AC | Test | Expected |
|----|------|----------|
| AC1 | `env -i ... npx prisma generate` lokálně s dummy DB URL | Exit 0, žádný throw |
| AC2 | `actionlint .github/workflows/ci.yml` (or python yaml load) | Valid yml syntax |
| AC3 | `prisma.config.ts` git diff vs main | **Žádná změna** (preservation #114 hardening) |
| AC4 | `git diff .github/workflows/ci.yml` | Pouze 4× added `env:` block (4 steps) |
| AC5 | Po push: GitHub Actions web UI pro nový commit | 4/4 joby zelené (lint, typecheck, test, build) |
| AC6 | `prisma.config.ts:5-7 throw` test (lokálně bez .env) | **Stále** throwuje (hardening preserved) |

## 7 — Risks & rollback

### 7.1 Rizika

| Risk | P | I | Mitigace |
|------|---|---|---------|
| Vitest test importuje skutečnou DB query | Med | Med | Lokálně §4.5 odhalí; pokud failuje, separate task |
| Build job fix odhalí jiný bug v `npm run build` | Low | Med | Lokálně `npm run build` před push (pokud máme čas) |
| Někdo přidá nový job do ci.yml a zapomene env block | Med | Low | Add comment v ci.yml u prvního env bloku jako vzor |
| `postgresql://dummy:dummy@localhost:5432/dummy` URL format invalid pro Prisma | Low | High | URL je validní Postgres URI format, build job ho už používá ✅ |

### 7.2 Rollback plán

Single commit, single file (`ci.yml`). Rollback = `git revert <sha>` nebo direct edit removing 4 env blocks. Žádné side effects na produkční kód.

## 8 — Estimate

| Step | Estimate |
|------|----------|
| Implementace (4 yml edits) | 2 min |
| Lokální verify §4.2-4.5 | 5-10 min (záleží na test runtime) |
| yml syntax check | 1 min |
| Commit + push | 1 min |
| GitHub Actions monitor | 3-5 min wait |
| **CELKEM** | **~15 min** (XS) |

## 9 — Akční kroky pro Developera

1. ✅ Schválit tento plán (team-lead)
2. → Edit `.github/workflows/ci.yml` — přidat 4 step-level `env:` bloky (Změny A-D z §3)
3. → Lokální verify §4.2-4.5 (s `env -i ...` trickem)
4. → yml syntax check §4.6
5. → `git add .github/workflows/ci.yml && git commit -m "fix: add dummy DATABASE_URL to prisma generate steps in CI"`
6. → `git push origin main` (NE force push)
7. → Manual GitHub Actions monitor §5.4 (3-5 min wait)
8. → Pokud 4/4 zelené → TaskUpdate #120 → completed → SendMessage team-lead

**SCOPE WARNING:** POUZE fix CI. ŽÁDNÉ další refaktorace, ŽÁDNÉ úpravy `useOnlineStatus.ts` ani jiných souborů. Pokud Developer narazí během lokálního verify na další bug — vytvořit separate task, NEFIXOVAT ho v rámci #120.

## 10 — Open questions

### Q1 — Build job needs: dependency
Build job má `needs: [lint, typecheck, test]`. Po fix Změn A-C bude build job poprvé od `16367b4` reálně běžet. Změna D je preventivní fix pro stejný bug v build jobu. **Doporučení:** zahrnout Změnu D **DO #120** — pokud čekáme až build poprvé selže a pak děláme #121, ztratíme čas.

### Q2 — Prevence regresí
Měli bychom přidat composite action / reusable workflow pro `Generate Prisma Client` step? **Doporučení:** ne v #120 (out of scope). Dokumentovat jako follow-up #122 pokud team-lead chce.

### Q3 — Dummy URL secret rotation
Hodnota `postgresql://dummy:dummy@localhost:5432/dummy` je hardcoded v yml. Není to citlivé (žádný real DB), ale je to magic string opakovaný 5×. **Doporučení:** Použít workflow-level env var:
```yaml
env:
  NODE_VERSION: "20"
  PRISMA_DUMMY_DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy"
```
A pak referencovat `env: { DATABASE_URL: ${{ env.PRISMA_DUMMY_DATABASE_URL }} }` v každém step. Lepší DRY. **Out of scope #120, ale doporučení pro #120 implementaci pokud je čas.**

---

**Status:** draft — připraven pro Developer dispatch
**File:** `.claude-context/tasks/plan-task-120-ci-fix.md`
