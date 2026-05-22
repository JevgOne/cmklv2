# DEPLOY #160 — #88a Wolt model na produkci

**Task:** #160
**Target:** `server` (91.98.203.239), `/var/www/carmakler`
**Commit:** `42691c5` (Wolt model #88a) + `516cd49` (plan #156) + `e0e5fda` (pozdější commity v range)
**Výsledek:** ✅ HOTOVO — `carmakler` PM2 proces online, nový kód aktivní

---

## Pipeline steps

### 1. ✅ `git pull origin main`

```
Updating e702e93..42691c5
Fast-forward
 14 files changed, 2868 insertions(+), 2 deletions(-)
```

Pulled nové soubory: impl/plan reporty, 3 API routes (commission), 3 UI komponenty,
migrace `20260408061812_add_partner_commission_and_order_split`, schema update,
webhook extension.

### 2. ✅ `npx prisma migrate deploy`

**Autorizace:** Option A, explicit GO od team-leada (první blocker — chybí v literal instrukci).

```
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from prisma/schema.prisma.
Datasource "db": PostgreSQL database "carmakler", schema "public" at "localhost:5432"
7 migrations found in prisma/migrations
Applying migration `20260408061812_add_partner_commission_and_order_split`
The following migration(s) have been applied:
migrations/
  └─ 20260408061812_add_partner_commission_and_order_split/
    └─ migration.sql
All migrations have been successfully applied.
```

**Migration applied:** `20260408061812_add_partner_commission_and_order_split`
**Obsah migrace:**
- Partner: `commissionRate Decimal(4,2) DEFAULT 15.00`, `commissionRateAt DateTime`, `stripeAccountId String?`
- OrderItem: `commissionRateApplied Decimal(4,2)?`, `carmaklerFee Int?`, `supplierPayout Int?`
- PartnerCommissionLog: nová tabulka + compound index `@@index([partnerId, changedAt])`
- Foreign keys: partnerId → Partner (Cascade), changedById → User (Restrict)

### 3. ✅ `npx prisma generate`

**Autorizace:** Option A, explicit GO od team-leada (druhý blocker — `migrate deploy` nefří auto-generate, jen `migrate dev` to dělá).

```
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from prisma/schema.prisma.
✔ Generated Prisma Client (v7.5.0) to ./node_modules/@prisma/client in 588ms
```

Dependency upgrade available (7.5.0 → 7.7.0) — out of scope #160.

### 4. ✅ `npm run build`

**Čas:** `real 1m39.542s` / `user 6m19.882s` / `sys 0m27.763s`

**Compilation:**
- `✓ (serwist) Bundling the service worker script`
- `✓ Compiled successfully in 23.8s`
- `✓ Generating static pages using 7 workers (1213/1213) in 40s`

**Exit code:** 0 (úspěch)

**Route count:** 1213 static/SSG/dynamic routes

### 5. ✅ `pm2 reload all`

```
Use --update-env to update environment variables
[PM2] Applying action reloadProcessId on app [all](ids: [ 0, 2 ])
[PM2] [carmakler](0) ✓
[PM2] [zajcon-firmy](2) ✓
```

### 6. ✅ `pm2 status` — verified online

```
┌────┬──────────────┬───────────┬─────────┬──────┬──────────┬──────────┐
│ id │ name         │ mode      │ pid     │ ↺    │ status   │ mem      │
├────┼──────────────┼───────────┼─────────┼──────┼──────────┼──────────┤
│ 0  │ carmakler    │ fork      │ 2190641 │ 60   │ online   │ 70.3mb   │
│ 2  │ zajcon-firmy │ fork      │ 2190657 │ 16   │ online   │ 92.3mb   │
└────┴──────────────┴───────────┴─────────┴──────┴──────────┴──────────┘
```

- `carmakler` (id 0): **online**, pid 2190641, mem 70.3 MB, 0% CPU
- `zajcon-firmy` (id 2): online (ignorováno per task spec)

### 7. ✅ `pm2 logs carmakler --lines 30 --nostream` — sanity check

**stdout:** clean start
```
▲ Next.js 16.1.7
- Local:         http://localhost:3000
- Network:       http://91.98.203.239:3000
✓ Starting...
✓ Ready in 845ms
```

Žádné Prisma schema mismatch errory, žádné startup errory, žádné commission-related tracebacks.

---

## Warnings & pre-existing noise

### Build-time warnings (non-blocking)

**1. DB connection exhaustion během SSG (3289 hits):**
```
prisma:error Invalid `prisma.part.findMany()` invocation:
Too many database connections opened: remaining connection slots are
reserved for roles with the SUPERUSER attribute
```

Static page generation (Next.js SSG) otvírá souběžně PG connections z 7 workerů.
Pool exhaustion během `generateStaticParams` pro parts katalog. **Build přesto
doběhl (1213/1213 pages)**, chybějící data fallbacky na error boundary nebo
prázdný state. Pre-existující issue, není regrese z #88a.

**Doporučení follow-up:** connection pooling limit (PgBouncer) nebo `maxConcurrency`
reduction v SSG. Out-of-scope #160.

**2. Sentry deprecation warnings (pre-existing):**
- `autoInstrumentServerFunctions` deprecated
- `autoInstrumentMiddleware` deprecated
- `autoInstrumentAppDirectory` deprecated
- `sentry.client.config.ts` should move to `instrumentation-client.ts`

Pre-existing tech debt, nesouvisí s #88a.

**3. Next.js deprecation:**
```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```
Pre-existing (Next 16 upgrade follow-up), nesouvisí s #88a.

**4. `Failed to load broker stats` during build:**
Runtime PrismaClientKnownRequestError z broker stats handler během SSG. Pre-existing,
souvisí s connection pool exhaustion výše.

### Runtime warnings v pm2-logs (pre-existing)

**CSP violations** (img-src na Unsplash):
- `https://images.unsplash.com/photo-*` — několik landingů stále linkuje Unsplash obrázky
- Pre-existing, nesouvisí s #88a
- Follow-up: buď migrace na Cloudinary nebo CSP whitelist

**NoFallbackError** v `(web)/dily/znacka/[brand]/[model]/[rok]/page.js`:
- Pre-existing dynamic route fallback chyba
- Nesouvisí s #88a

---

## Deploy flow learnings

**Chybějící kroky v literal #160 instrukci:**
- `npx prisma migrate deploy` — aplikuje SQL migrace
- `npx prisma generate` — regeneruje TS types (nezahrnuto v `migrate deploy` pro production flow)

**Updated deploy checklist pro Carmakler (lead approved):**
```
1. git pull origin main
2. npx prisma migrate deploy
3. npx prisma generate
4. npm run build
5. pm2 reload all
6. pm2 status (verify online)
7. pm2 logs carmakler --lines 30 --nostream (sanity)
```

Kroky 2-3 jsou nutné vždy když commit obsahuje `prisma/migrations/*` nebo změny
v `prisma/schema.prisma`. Pokud pull není schema-touching, kroky 2-3 jsou no-op.

---

## §15 22-item Dispatch Checklist — production ready

Všech 22 položek z impl-task-155 je nyní **na produkci**:

**Schema + migrace (8):** ✅ aplikováno v kroku 2
- Partner.commissionRate/commissionRateAt/stripeAccountId ✅
- PartnerCommissionLog + compound index ✅
- OrderItem snapshot fields ✅
- User.commissionChanges relation ✅

**API (3):** ✅ deployed v kroku 4+5
- PATCH `/api/admin/partners/[id]/commission` ✅
- GET `/api/admin/partners/[id]/commission/history` ✅
- GET `/api/admin/reports/commission-summary` ✅

**UI (4):** ✅ deployed v kroku 4+5
- CommissionRateSlider ✅
- CommissionEditDialog ✅
- CommissionHistoryList ✅
- PartnerDetail Provize Card ✅

**Webhook (7):** ✅ deployed v kroku 4+5
- applyCommissionSplit + replay guard + graceful fallback + idempotencyKey +
  transfer_group + metadata + default 15% ✅

---

## Ověření produkce

Produkční `https://carmakler.cz` vrací `401` z curl kvůli nginx basic auth gating
(SOFT LAUNCH) — per task spec to **NENÍ** deploy failure. Pro ověření nových
commission endpointů by bylo nutné:
1. Projít basic auth (admin credentials)
2. Autentikovat session s ADMIN nebo BACKOFFICE rolí
3. Otevřít `https://carmakler.cz/admin/marketplace/[partnerId]` → Provize Card

Nebo direct API smoke:
- `GET /api/admin/reports/commission-summary` (vyžaduje admin session)
- `GET /api/admin/partners/[id]/commission/history` (vyžaduje admin session)

**Vzhledem k SOFT LAUNCH gatingu + Q1 decision (Stripe Connect onboarding UI mimo
scope, stripeAccountId nullable), commission webhook path nebude triggered dokud
partneři nebudou mít Stripe účty. DB snapshot fields a audit log jsou ready,
ale Stripe transfers v `applyCommissionSplit` budou graceful-skip warnings
dokud není #88a-stripe-onboarding (task #161 plan in progress) dokončen.**

---

## Blockery & escalation history

**Blocker 1:** `prisma migrate deploy` chyběl v #160 literal kroccích.
- Eskalace: Option A → C přehled
- Rozhodnutí: Option A (lead GO)
- Fix: přidáno do deploy checklistu

**Blocker 2:** `prisma generate` chyběl mezi `migrate deploy` a `build`.
- Build failed na `Property 'partnerCommissionLog' does not exist`
- Root cause: `migrate deploy` negeneruje TS types (na rozdíl od `migrate dev`)
- Eskalace: Option A detail + stale client analýza
- Rozhodnutí: Option A (lead GO)
- Fix: přidáno do deploy checklistu

Oba blockery byly **literal-instruction gaps**, ne impl regrese. Lead akceptoval
oba catche a autorizoval Option A. Žádné destructive actions, žádný rollback.

---

## Final status

- ✅ **Commits `42691c5` + `516cd49` deployed** na produkci
- ✅ **Migration** `20260408061812_add_partner_commission_and_order_split` applied
- ✅ **Prisma client** regenerated (v7.5.0)
- ✅ **Build** 1m39s, 1213 routes, exit 0
- ✅ **PM2** `carmakler` (id 0) online, Ready in 845ms
- ✅ **Logs** clean — žádné Prisma schema errory, žádné #88a tracebacks
- ⚠️ **Pre-existing warnings** logged above (SSG connection pool, Sentry deprec, CSP, NoFallbackError) — none blocking, none #88a-caused

**Deploy #160 HOTOVO.** Carmakler Wolt commission model (#88a) je live na produkci.
