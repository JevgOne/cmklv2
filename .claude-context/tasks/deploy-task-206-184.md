# DEPLOY #206 — #184 Eshop autodíly gap-fix production rollout

**Task:** #206 DEPLOY — 7-step canonical flow po #184 fix
**Datum:** 2026-04-09
**Deployer:** implementator
**Target:** `ssh server` (91.98.203.239 — `/var/www/carmakler`)
**Commits deployed:** 11 (`efa03a2` → `00f05ac`)

---

## §1 — Commits pushed to origin/main

```
00f05ac docs: plan #203 — T1+T2 stale RED (Turbopack HMR race, no code fix)
059f6a2 fix(auth): add WHOLESALE_SUPPLIER login redirect to /parts/my (#197)
5e60407 docs: plan #197 — fix #184 test-chrome RED (3 defekty)
1b539a3 chore(#182-G): /simplify cleanup
335886d test(#182-F): E2E parts-wholesale.spec.ts
ab58f27 feat(#182-E): seed WHOLESALE_SUPPLIER user
776ff72 feat(#182-D): web detail render block + katalog filter
04ce6ae feat(#182-C): PWA wizard manufacturer + warranty
5c13bbd feat(#182-B): API + validators + middleware
9dfadde feat(#182-A): schema + migration manufacturer/warranty
efa03a2 docs(plan-182): TASK-020 eshop díly gap-fix plan
```

---

## §2 — Step 0: git push origin main

```
$ git push origin main
To github.com:JevgOne/cmklv2.git
   e678f7c..00f05ac  main -> main
```

**✅ Fast-forward push OK.**

---

## §3 — Step 1: git pull origin main (server)

```
$ ssh server "cd /var/www/carmakler && git pull origin main"
From github.com:JevgOne/cmklv2
 * branch            main       -> FETCH_HEAD
   e678f7c..00f05ac  main       -> origin/main
Updating e678f7c..00f05ac
Fast-forward
 .../plan-task-182-eshop-dily-gap.md     | 1190 ++++++++++++++++++++
 .../plan-task-197-184-fix.md            |  443 ++++++++
 .../plan-task-203-t1t2-red.md           |  263 +++++
 app/(pwa-parts)/parts/new/page.tsx      |    4 +
 app/(web)/dily/[slug]/page.tsx          |   21 +
 app/(web)/dily/katalog/page.tsx         |   12 +-
 app/(web)/login/page.tsx                |    3 +
 app/api/parts/import/route.ts           |    8 +-
 app/api/parts/route.ts                  |   10 +-
 components/pwa-parts/parts/DetailsStep.tsx    |  9 +
 components/pwa-parts/parts/PricingStep.tsx    |  9 +
 e2e/parts-wholesale.spec.ts             |  123 ++
 lib/validators/parts.ts                 |    3 +
 middleware.ts                           |    2 +-
 .../20260409062848_add_part_manufacturer_warranty/migration.sql  | 6 +
 prisma/schema.prisma                    |    7 +-
 prisma/seed.ts                          |   92 ++
 17 files changed, 2198 insertions(+), 7 deletions(-)
 create mode 100644 e2e/parts-wholesale.spec.ts
 create mode 100644 prisma/migrations/20260409062848_add_part_manufacturer_warranty/migration.sql
```

**✅ Fast-forward, 17 files changed (+2198/-7), migration file created.**

---

## §4 — Step 2: prisma migrate deploy

```
$ ssh server "cd /var/www/carmakler && npx prisma migrate deploy"
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma/schema.prisma.
Datasource "db": PostgreSQL database "carmakler", schema "public" at "localhost:5432"

9 migrations found in prisma/migrations

Applying migration `20260409062848_add_part_manufacturer_warranty`

The following migration(s) have been applied:

migrations/
  └─ 20260409062848_add_part_manufacturer_warranty/
    └─ migration.sql

All migrations have been successfully applied.
```

**✅ 1 new migration applied, žádný drift, žádný P3009 error.**

---

## §5 — Step 3: prisma generate

```
$ ssh server "cd /var/www/carmakler && npx prisma generate"
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma/schema.prisma.

✔ Generated Prisma Client (v7.5.0) to ./node_modules/@prisma/client in 596ms
```

**✅ Prisma Client regenerated s novými `manufacturer`/`warranty` types.**

Update note: dostupný update 7.5.0 → 7.7.0 (jen info, žádný upgrade v tomto deployi).

---

## §6 — Step 4: npm run build

```
$ ssh server "cd /var/www/carmakler && npm run build"
✓ Compiled successfully in 23.8s
(prerender phase: prisma:error noise × 9 — pre-existing baseline, same pattern as local build)
EXIT=0
```

**✅ Build success, 23.8s compile, žádné nové errory.**

Prerender `prisma:error` lines jsou pre-existing baseline noise z SSG prerender fází kde některé dynamické pages touchnou DB během build — nejsou blocker, matched local build.

---

## §7 — Step 5: pm2 reload all

```
$ ssh server "pm2 reload all"
Use --update-env to update environment variables
[PM2] Applying action reloadProcessId on app [all](ids: [ 0, 2 ])
[PM2] [carmakler](0) ✓
[PM2] [zajcon-firmy](2) ✓
```

**✅ Both apps reloaded (carmakler + zajcon-firmy), graceful reload ✓.**

---

## §8 — Step 6: pm2 status

```
$ ssh server "pm2 status"
┌────┬─────────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────┬────────┐
│ id │ name            │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu  │ mem    │
├────┼─────────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────┼────────┤
│ 0  │ carmakler       │ N/A     │ fork    │ 2382466  │ 10s    │ 64   │ online    │ 0%   │ 70.2mb │
│ 2  │ zajcon-firmy    │ N/A     │ fork    │ 2382488  │ 10s    │ 20   │ online    │ 0%   │ 92.2mb │
└────┴─────────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────┴────────┘
```

**✅ Carmakler online, PID `2382466`, 10s uptime, restart count 64, memory 70.2 MB.**

---

## §9 — Step 7: pm2 logs carmakler --lines 30 --nostream

**out.log (last 30 lines — aplikace startup):**
```
> carmakler@0.1.0 start
> next start

▲ Next.js 16.1.7
- Local:         http://localhost:3000
- Network:       http://91.98.203.239:3000

✓ Starting...
✓ Ready in 853ms
```

**✅ App successfully started, Ready in 853ms.**

**error.log (last 30 lines — jen pre-existing noise, žádný nový incident):**
```
[CSP Violation] img-src | https://images.unsplash.com/... | https://inzerce.carmakler.cz/     (pre-existing, subdomain CSP)
[@sentry/nextjs] DEPRECATION WARNING: autoInstrumentServerFunctions/Middleware/AppDirectory
Error: Internal: NoFallbackError at .next/server/app/(web)/dily/znacka/[brand]/[model]/[rok]/page.js
```

**Analysis of pre-existing errors (NE regression z #184):**
- **CSP violations** — subdomain `inzerce.carmakler.cz` má jiný CSP policy pro Unsplash imgs, unrelated.
- **Sentry deprecation warnings** — framework upgrade todos, unrelated.
- **`NoFallbackError` na `/dily/znacka/[brand]/[model]/[rok]`** — pre-existing známý bug z TASK-019 (dynamicParams fallback), NE dotčeno #184 scope (#184 touchnul `/dily/katalog`, `/dily/[slug]` a `/api/parts/*`, ne `znacka/...`). Uloženo pro pozdější fix, out-of-scope.

**✅ Žádné nové chyby z #184 commits.**

---

## §10 — Acceptance summary

| Step | Check | Status |
|---|---|---|
| 0 | `git push origin main` (fast-forward) | ✅ |
| 1 | `git pull` na serveru (17 files, +2198/-7) | ✅ |
| 2 | `prisma migrate deploy` (1 new migration) | ✅ |
| 3 | `prisma generate` (client regen) | ✅ |
| 4 | `npm run build` (Compiled successfully 23.8s, EXIT=0) | ✅ |
| 5 | `pm2 reload all` (graceful) | ✅ |
| 6 | `pm2 status` (carmakler online, PID 2382466) | ✅ |
| 7 | `pm2 logs` (`Ready in 853ms`, žádný nový error) | ✅ |

**STOP rules check:**
- ✅ `migrate deploy` — žádný drift, žádný P3009
- ✅ `npm run build` — EXIT=0
- ✅ `pm2 reload` — both apps online
- ✅ Žádné warnings eskalovány (jen deprecation notices)
- ✅ Nedotkl jsem se uncommitted changes v working tree (plan-182, TASK-QUEUE, public/sw.js, untracked .claude-context files)

**Production smoke:** External HTTPS probe zachycen HTTP 401 Basic Auth (`realm="Carmakler - pristup omezen"`) — staging gating pre-existing, NE blocker. Interní pm2 status + `Ready in 853ms` log jsou primární proof že app běží s novým kódem + Prisma Client + migrací.

---

## §11 — Production state after deploy

- **HEAD:** `00f05ac` (synced s `origin/main`)
- **Migrations:** 9 total applied, latest `20260409062848_add_part_manufacturer_warranty`
- **DB schema:** `Part` má nové sloupce `manufacturer TEXT NULL`, `warranty TEXT NULL` + index `Part_manufacturer_idx`
- **Role handling:** `WHOLESALE_SUPPLIER` marker akceptována v middleware `PARTS_SUPPLIER_ROLES` + login page redirect
- **User seed:** **NE** — deploy byl schema-only, manual `prisma db seed` na produkci se NESPOUŠTĚL (sample aftermarket parts jsou dev-only, produkce má vlastní populated data)

---

## §12 — Pipeline next

- **#207 evžen deploy review** — smart code + deploy review
- **#208 user handoff** — product owner / user ověření

**Deploy complete.** Commit `00f05ac` live na `main` + production.

---

**HOTOVO #206** — Deploy successful 7/7 steps, žádný rollback nutný.
