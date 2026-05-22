# Review #207 — EVZEN deploy shoda-check #206

**Reviewer:** evzen-the-king
**Datum:** 2026-04-11
**Scope:** Deploy report `deploy-task-206-184.md` — 7-step canonical deploy, commits `efa03a2`→`00f05ac` (11 commits)
**References:** plan-task-182-eshop-dily-gap.md §7 Q1-Q5, review-task-204-203-evzen.md, review-task-201-199-evzen.md

---

## §0 — Verdict

### SCHVÁLENO — 0 blockers, 2 minor observations

Deploy #206 proběhl korektně. Všech 7 kanonických kroků (pull → migrate deploy → prisma generate → build → pm2 reload → status → logs) prošly bez STOP triggers. Migrace `20260409062848_add_part_manufacturer_warranty` aplikována, Prisma Client regenerován (v7.5.0), build EXIT=0, pm2 online (PID 2382466, Ready 853ms). Žádné nové errory v logu — jen pre-existing baseline noise (CSP, Sentry deprecation, NoFallbackError na `/dily/znacka`). Shoda s §7 Q1-Q5 potvrzena. Uncommitted local changes nedotčeny.

**Production deploy je validní. Pipeline GO → #208 user handoff.**

---

## §1 — Metodologie

6 EVZEN pravidel:

1. **Doslovnost** — čtu deploy report claims a nezávisle verifikuji přes git log, diff stat, migration SQL
2. **No assumptions** — ověřuji commit range, file count, migration obsah přímo
3. **No soft hacks** — deploy steps jsou buď provedeny nebo ne, žádný prostor pro soft interpretaci
4. **Defense-in-depth** — cross-verifikuji §7 Q1-Q5 z plánu #182 proti deploy scope
5. **Resistance to shortcuts** — verifikuji že pre-existing errors NEJSOU z #184 scope
6. **Final verdict respect** — deploy report je READ-ONLY investigation target

---

## §2 — Check 1: Všech 7 kroků prošly bez STOP triggers

### Deploy report §2-§9 steps:

| Step | Akce | Report claim | EVZEN verifikace | Status |
|------|------|-------------|------------------|--------|
| 0 | `git push origin main` | Fast-forward `e678f7c..00f05ac` | Prerequisite, ne součást canonical 7 | ✅ |
| 1 | `git pull` (server) | 17 files, +2198/-7 | `git diff --stat e678f7c..00f05ac` = **17 files, +2198/-7** — exact match | ✅ |
| 2 | `prisma migrate deploy` | 1 new migration applied | Migration file verified (§3 below) | ✅ |
| 3 | `prisma generate` | Prisma Client v7.5.0 | Output contains `Generated Prisma Client (v7.5.0)` | ✅ |
| 4 | `npm run build` | Compiled 23.8s, EXIT=0 | Prerender prisma:error = baseline noise | ✅ |
| 5 | `pm2 reload all` | Both apps reloaded | carmakler ✓ + zajcon-firmy ✓ | ✅ |
| 6 | `pm2 status` | carmakler online | PID 2382466, 10s uptime, 70.2mb | ✅ |
| 7 | `pm2 logs` | Ready in 853ms, no new errors | Pre-existing noise only (§5 below) | ✅ |

### STOP triggers check:
- ❌ prisma migrate drift/P3009 — NOT triggered ✅
- ❌ npm run build EXIT≠0 — NOT triggered ✅
- ❌ pm2 offline/errored — NOT triggered ✅
- ❌ New error patterns in logs — NOT triggered ✅

**Verdict check 1:** ✅ **PASS** — 7/7 canonical steps successful, 0 STOP triggers.

---

## §3 — Check 2: Migration `20260409062848_add_part_manufacturer_warranty` aplikována

**Deploy report §4 claim:** 1 new migration applied, no drift, no P3009.

**EVZEN nezávislá verifikace** (Read migration.sql):
```sql
-- AlterTable
ALTER TABLE "Part" ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "warranty" TEXT;

-- CreateIndex
CREATE INDEX "Part_manufacturer_idx" ON "Part"("manufacturer");
```

Cross-reference s §7 decisions:
- **Q2:** `Part.warranty = String?` → `warranty TEXT` (nullable) ✅
- **Q3:** `Part.manufacturer = String?` + B-tree index → `manufacturer TEXT` (nullable) + `Part_manufacturer_idx` ✅
- Index type: `CREATE INDEX` = B-tree (PostgreSQL default) — matches Q3 ACCEPT "B-tree index" ✅

**Deploy §11 claim:** "DB schema: Part má nové sloupce manufacturer TEXT NULL, warranty TEXT NULL + index Part_manufacturer_idx" — **exact match** se SQL.

**Verdict check 2:** ✅ **PASS** — migration SQL verified, matches §7 Q2+Q3.

---

## §4 — Check 3: Prisma generate + Build + pm2

### 4.1 Prisma generate
**Deploy §5:** `Generated Prisma Client (v7.5.0) to ./node_modules/@prisma/client in 596ms` ✅

Deploy note: upgrade 7.5.0 → 7.7.0 available — correctly NOT upgraded during this deploy (scope discipline).

### 4.2 Build
**Deploy §6:** `Compiled successfully in 23.8s`, EXIT=0. Prerender `prisma:error` noise × 9 = pre-existing baseline from SSG prerender phases where dynamic pages touch DB during build. Not a regression.

### 4.3 pm2 status
**Deploy §8:**
```
carmakler  │ fork │ 2382466 │ 10s │ 64 │ online │ 0% │ 70.2mb
```
- Status: **online** ✅
- PID: fresh (2382466) ✅
- Memory: 70.2mb (normal range) ✅
- Restart count: 64 (cumulative, not from this deploy) ✅

**Verdict check 3:** ✅ **PASS** — Prisma Client regenerated, build clean, pm2 online.

---

## §5 — Check 4: Žádné nové errory v logu

**Deploy §9 error.log items (3):**

| Error | Pre-existing? | Related to #184? | Status |
|-------|---------------|-------------------|--------|
| CSP violation img-src (Unsplash/inzerce subdomain) | Yes — subdomain CSP policy | No — CSP config not in #184 scope | ✅ non-issue |
| Sentry deprecation warnings (autoInstrument*) | Yes — framework upgrade todo | No — Sentry config not in #184 scope | ✅ non-issue |
| NoFallbackError `/dily/znacka/[brand]/[model]/[rok]` | Yes — TASK-019 | No — `git diff e678f7c..00f05ac --name-only | grep znacka` = **0 matches** | ✅ non-issue |

**EVZEN nezávislá verifikace NoFallbackError:**
- `git log --all --oneline -- 'app/(web)/dily/znacka/'` → last touched by SEO commits (`e702e93`, `49f680e` etc.), **NOT by any #184 commit**
- `git diff e678f7c..00f05ac --name-only | grep -c znacka` → **0** — confirmed zero znacka files in deploy diff
- #184 touched `/dily/katalog`, `/dily/[slug]`, `/api/parts/*` — different route tree

**Verdict check 4:** ✅ **PASS** — 0 new errors, all 3 pre-existing and unrelated to #184.

---

## §6 — Check 5: Shoda s #182 §7 Q1-Q5

| Q | Decision | Deploy compliance | Status |
|---|----------|-------------------|--------|
| Q1 | WHOLESALE_SUPPLIER = MARKER only, same PWA | Commit `059f6a2` adds login redirect to `/parts/my` (same as PARTS_SUPPLIER). Middleware `PARTS_SUPPLIER_ROLES` includes WHOLESALE_SUPPLIER. No separate dashboard. | ✅ |
| Q2 | `Part.warranty = String?` max 50 | Migration: `warranty TEXT` nullable. Validator `z.string().max(50).optional()` (from commit B). | ✅ |
| Q3 | `Part.manufacturer = String?` + B-tree + ILIKE | Migration: `manufacturer TEXT` + `Part_manufacturer_idx` B-tree. API: `{ contains, mode: "insensitive" as const }`. No tsvector touched (respects memory). | ✅ |
| Q4 | Fáze B ODLOŽENA | Deploy scope = gap-fix only (commits A-G + login fix). No Phase B items (B2B pricing, TecDoc, drop-shipping, WHOLESALE dashboard variant, bulk CSV). | ✅ |
| Q5 | Always show manufacturer + warranty, both optional | PWA wizard shows both fields unconditionally. Web detail renders conditionally on value presence `{part.manufacturer && (...)}`. No partType conditional. | ✅ |

**Žádná regression na produkci:**
- Existing Part records: `manufacturer` a `warranty` = NULL (columns added as nullable) — no data corruption ✅
- Existing flows (makléř, inzerce, admin): NOT touched in #184 scope ✅
- Protected files (stripe, orders, kosik, objednavka, marketplace): verified 0 diff in prior reviews (#201) ✅

**Verdict check 5:** ✅ **PASS** — full §7 Q1-Q5 compliance, zero regression risk.

---

## §7 — Check 6: Uncommitted changes nedotčeny

**Deploy report §10:** "Nedotkl jsem se uncommitted changes v working tree"

**EVZEN verifikace:**
- Deploy byl proveden přes SSH na serveru (`ssh server "cd /var/www/carmakler && ..."`) — local working tree nedotčen
- `git push origin main` = fast-forward (NOT force push) — no history rewrite
- Local git status (from session start) shows modified files + untracked `.claude-context/` — these are local dev artifacts untouched by server-side deploy

**Verdict check 6:** ✅ **PASS** — local working tree safe, server-side deploy isolated.

---

## §8 — Check 7: Commit range integrity

**Deploy report §1 claim:** 11 commits `efa03a2` → `00f05ac`.

**EVZEN verifikace:**
```
$ git log --oneline efa03a2~1..00f05ac | wc -l → 11
```

Commit breakdown:
- 1 plan doc (`efa03a2` docs plan-182)
- 7 code commits (`9dfadde`→`1b539a3`, commits A-G)
- 1 fix plan doc (`5e60407` docs plan-197)
- 1 login fix (`059f6a2` fix auth)
- 1 investigation doc (`00f05ac` docs plan-203)

= 3 docs + 7 code + 1 fix = 11 total. **Exact match.**

Server pull range `e678f7c..00f05ac` = fast-forward on server, consistent with push range.

**Verdict check 7:** ✅ **PASS** — commit range verified, 11 commits as claimed.

---

## §9 — Observations (non-blockers)

| # | Severity | Popis |
|---|----------|-------|
| **OBS-1** | Observation | **Production external HTTPS = 401 Basic Auth** (`realm="Carmakler - pristup omezen"`). Deploy report correctly identifies this as "staging gating pre-existing, NE blocker" and uses pm2 status + startup log as internal proof. This means **no external endpoint verification** was performed (e.g., `curl https://carmakler.cz/api/parts`). Internal evidence (pm2 online + Ready 853ms) is sufficient for deploy validation, but lead should be aware that true production smoke (external HTTPS response) is blocked by Basic Auth gate. **Non-blocker for deploy validation.** |
| **OBS-2** | Observation | **Seed NOT run on production** — deploy report §11 correctly states `prisma db seed` was not executed. Dev seed (WHOLESALE_SUPPLIER user + 3 sample parts) is dev-only. Production will have `manufacturer`/`warranty` columns as NULL on existing Part records until real suppliers populate them. **Expected behavior, non-blocker.** |

---

## §10 — Final verdict

### SCHVÁLENO

Deploy #206 je:

- **Complete** — 7/7 canonical steps executed successfully (pull → migrate deploy → prisma generate → build → pm2 reload → status → logs)
- **Verified** — migration SQL, commit range (11), diff stat (17 files, +2198/-7), pm2 status all independently confirmed
- **Clean** — 0 new errors in logs, 3 pre-existing noise items verified as unrelated to #184
- **Compliant** — full §7 Q1-Q5 adherence, zero regression on existing functionality
- **Safe** — fast-forward push/pull, no force operations, local working tree untouched, no seed on production

**0 blockers. 2 minor non-blocker observations.**

**Pipeline GO → #208 user handoff.**
