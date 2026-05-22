# DEPLOY #166 — #161-a Stripe Connect Express backend na produkci

**Task:** #166 DEPLOY #161-a na produkci
**Commit deployed:** `2bf0657 feat(#161-a): Stripe Connect Express backend — schema, helpers, API routes, webhook`
**Datum:** 2026-04-08
**Host:** `server` (91.98.203.239), `/var/www/carmakler`
**Pipeline context:** kontrolor PASS (#163) → evžen PASS (#164) → test-chrome GREEN 6/6 (#165) → DEPLOY (#166)

---

## §1 — Deploy pipeline (7 kroků, all green)

| # | Krok | Command | Status | Čas |
|---|---|---|---|---|
| 1 | Push origin | `git push origin main` | ✅ OK | instant (fast-forward 42691c5..2bf0657) |
| 2 | Pull produkce | `ssh server "cd /var/www/carmakler && git pull origin main"` | ✅ OK | ~1s (fast-forward, 9 files) |
| 3 | Migrate deploy | `ssh server "cd /var/www/carmakler && npx prisma migrate deploy"` | ✅ OK | ~2s |
| 4 | Prisma generate | `ssh server "cd /var/www/carmakler && npx prisma generate"` | ✅ OK | 596ms |
| 5 | Build | `ssh server "cd /var/www/carmakler && npm run build"` | ✅ OK | **1m49.502s** real (compile in 24.4s) |
| 6 | PM2 reload | `ssh server "pm2 reload all"` | ✅ OK | ~2s |
| 7 | Sanity check | `pm2 status` + `pm2 logs carmakler --lines 30 --nostream` | ✅ OK | Ready in 837ms |

---

## §2 — Step-by-step command outputs

### §2.1 — Step 1: `git push origin main`

```
To github.com:JevgOne/cmklv2.git
   42691c5..2bf0657  main -> main
```

Fast-forward pushed 3 commits (plan-161 chain + deploy commit).

### §2.2 — Step 2: `git pull origin main` (produkce)

```
From github.com:JevgOne/cmklv2
 * branch            main       -> FETCH_HEAD
   42691c5..2bf0657  main       -> origin/main
Updating 42691c5..2bf0657
Fast-forward
 .claude-context/tasks/impl-task-162-161a.md        |  240 +++
 .claude-context/tasks/plan-task-161-stripe-onboarding.md | 1643 ++++++++++++
 app/api/stripe/connect/dashboard-link/route.ts     |   54 +
 app/api/stripe/connect/onboard-link/route.ts       |   78 +
 app/api/stripe/connect/status/route.ts             |   78 +
 app/api/stripe/webhook/route.ts                    |   41 +
 lib/stripe-connect.ts                              |  261 ++++
 .../migration.sql                                  |   15 +
 prisma/schema.prisma                               |   12 +
 9 files changed, 2422 insertions(+)
```

Všech 9 souborů z commitu `2bf0657` přítomných na produkci. Migration file (`20260408093456_add_partner_stripe_onboarding_state/migration.sql`) staged k aplikaci.

### §2.3 — Step 3: `npx prisma migrate deploy`

```
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from prisma/schema.prisma.
Datasource "db": PostgreSQL database "carmakler", schema "public" at "localhost:5432"

8 migrations found in prisma/migrations

Applying migration `20260408093456_add_partner_stripe_onboarding_state`

The following migration(s) have been applied:

migrations/
  └─ 20260408093456_add_partner_stripe_onboarding_state/
    └─ migration.sql

All migrations have been successfully applied.
```

Partner +8 sloupců + 2 indexy (`Partner_stripeAccountId_idx`, `Partner_stripePayoutsEnabled_idx`) aplikovány na produkční `carmakler` DB. Žádný drift, žádná data loss (ADD COLUMN DEFAULT, CREATE INDEX — non-destructive).

### §2.4 — Step 4: `npx prisma generate`

```
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from prisma/schema.prisma.

✔ Generated Prisma Client (v7.5.0) to ./node_modules/@prisma/client in 596ms
```

Prisma Client regenerovaný — TS typy teď znají 8 nových Partner polí. Kritický krok (jinak build selže na `Property 'stripeOnboardingStartedAt' does not exist on type 'Partner'` — precedent: #160 blocker 2).

### §2.5 — Step 5: `npm run build`

```
✓ Compiled successfully in 24.4s
✓ Generating static pages (1216/1216)

Route (app)                                                   Revalidate  Expire
├ ƒ /api/stripe/connect/dashboard-link
├ ƒ /api/stripe/connect/onboard-link
├ ƒ /api/stripe/connect/status
├ ƒ /api/stripe/webhook
...

real    1m49.502s
user    6m52.622s
sys     0m30.502s
```

**Nové routes registrované:**
- `ƒ /api/stripe/connect/dashboard-link` (POST, dynamic)
- `ƒ /api/stripe/connect/onboard-link` (POST, dynamic)
- `ƒ /api/stripe/connect/status` (GET, dynamic)
- `ƒ /api/stripe/webhook` (POST, existing, rozšířen o `account.updated` case)

**Build statistika:**
- Celkem 1216 stránek vygenerováno (bez regrese oproti #160 kde bylo 1213 — nárůst o 3 díky 3 novým Connect routes)
- Compile čas: 24.4s
- Total čas: 1m49.502s (včetně SSG)

**Pre-existing noise (non-blocking):**
- `Failed to load broker stats: Error [PrismaClientKnownRequestError]` během SSG — DB connection pool exhaustion při paralelním generování static pages. Dokumentovaný v `impl-task-160-deploy-88a.md` jako pre-existing follow-up. Build exit 0, pipeline pokračuje.

### §2.6 — Step 6: `pm2 reload all`

```
Use --update-env to update environment variables
[PM2] Applying action reloadProcessId on app [all](ids: [ 0, 2 ])
[PM2] [carmakler](0) ✓
[PM2] [zajcon-firmy](2) ✓
```

Oba procesy rolling-reloadnuty (zero-downtime). `zajcon-firmy` (id 2) je jiná aplikace na stejném serveru — ignorujeme per instrukce #160.

### §2.7 — Step 7: Sanity check

#### `pm2 status`:

```
┌────┬─────────────────┬────────┬──────────┬────────┬──────┬─────────┬──────┬────────┐
│ id │ name            │ mode   │ pid      │ uptime │ ↺    │ status  │ cpu  │ mem    │
├────┼─────────────────┼────────┼──────────┼────────┼──────┼─────────┼──────┼────────┤
│ 0  │ carmakler       │ fork   │ 2209419  │ 11s    │ 61   │ online  │ 0%   │ 69.8mb │
│ 2  │ zajcon-firmy    │ fork   │ 2209440  │ 10s    │ 17   │ online  │ 0%   │ 92.0mb │
└────┴─────────────────┴────────┴──────────┴────────┴──────┴─────────┴──────┴────────┘
```

carmakler (id 0): **online**, pid `2209419`, uptime 11s (po reloadu), 69.8mb mem, status `online`, restart count 61 (cumulative od last pm2 start).

#### `pm2 logs carmakler --lines 30`:

**carmakler-out.log (positive startup):**
```
> carmakler@0.1.0 start
> next start

▲ Next.js 16.1.7
- Local:         http://localhost:3000
- Network:       http://91.98.203.239:3000

✓ Starting...
✓ Ready in 837ms
```

Next.js 16.1.7 startuje čistě, **Ready in 837ms** (srovnatelné s #160 deployem: 845ms). Žádné Stripe Connect errory při startu, žádné schema errors, žádné Prisma client errors.

**carmakler-error.log — pre-existing noise (non-blocking):**
1. `[CSP Violation] img-src | https://images.unsplash.com/...` — pre-existing, unrelated k #161-a (Unsplash obrázky v nabídkách)
2. `[@sentry/nextjs] DEPRECATION WARNING: autoInstrumentServerFunctions/autoInstrumentMiddleware/autoInstrumentAppDirectory` — pre-existing Sentry upgrade warnings, neblokující
3. `Error: Internal: NoFallbackError at .next/server/app/(web)/dily/znacka/[brand]/[model]/[rok]/page.js` — pre-existing runtime error na unrelated route (`/dily/znacka/[brand]/[model]/[rok]`), nezasaženo #161-a

**Žádné error logy spojené s:**
- `/api/stripe/connect/onboard-link`
- `/api/stripe/connect/status`
- `/api/stripe/connect/dashboard-link`
- `/api/stripe/webhook`
- `lib/stripe-connect.ts`
- Partner schema loading / Prisma generate
- `account.updated` webhook handling

---

## §3 — Co bylo deployováno

### §3.1 — Database schema změny (migrace `20260408093456`)

Partner table **+8 nových sloupců + 2 nové indexy**:

```sql
-- AlterTable
ALTER TABLE "Partner" ADD COLUMN "stripeAccountUpdatedAt" TIMESTAMP(3),
ADD COLUMN "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripeDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripeDisabledReason" TEXT,
ADD COLUMN "stripeOnboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN "stripeOnboardingStartedAt" TIMESTAMP(3),
ADD COLUMN "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripeRequirementsCurrentlyDue" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Partner_stripeAccountId_idx" ON "Partner"("stripeAccountId");
CREATE INDEX "Partner_stripePayoutsEnabled_idx" ON "Partner"("stripePayoutsEnabled");
```

**Non-destructive** — žádné DROP, žádné data migration. Existující Partner records získají defaulty (`false` pro booleans, `[]` pro array, `NULL` pro timestamps).

### §3.2 — Application code změny

**Nové soubory:**
- `lib/stripe-connect.ts` (261 lines) — helper surface: `createOrGetConnectAccount`, `createOnboardingLink`, `createDashboardLink`, `getAccountStatus`, `syncAccountToDb`, `deriveOnboardingState`, `STRIPE_REQUIREMENTS_CZ` i18n map, `translateRequirementsList`, `resolvePartnerForConnect` (shared auth helper), `isAdminOrBackoffice`
- `app/api/stripe/connect/onboard-link/route.ts` (78 lines) — POST handler
- `app/api/stripe/connect/status/route.ts` (78 lines) — GET handler s `?refresh=1` rate-limited 60s
- `app/api/stripe/connect/dashboard-link/route.ts` (54 lines) — POST handler
- `prisma/migrations/20260408093456_add_partner_stripe_onboarding_state/migration.sql` (15 lines clean SQL)

**Modifikované soubory:**
- `app/api/stripe/webhook/route.ts` (+41 lines) — nový case `account.updated` + `handleStripeAccountUpdate` handler (never throws)
- `prisma/schema.prisma` (+12 lines) — 8 fields + 2 indexes

### §3.3 — Co se NEzměnilo (explicit)

- `applyCommissionSplit()` v `app/api/stripe/webhook/route.ts` **nedotčen** — graceful fallback na manual bankovní převod zachován, per plan §12.1 out-of-scope pro #161-a (follow-up FU1)
- Žádné nové environment variables
- Žádné nové Stripe API verze (stále `2026-02-25.clover`)
- Žádné UI (admin #161-b, PWA #161-c jsou separátní tasky)
- Žádná email/banner/push komunikace s partnery (per §20 Q7)

---

## §4 — ⚠ MANUÁLNÍ KROK POTŘEBNÝ PRO FUNGOVÁNÍ WEBHOOKU

**Tato deploy pipeline pokrývá jen code deployment. Aby produkce dostávala `account.updated` eventy, je potřeba manuální registrace eventu ve Stripe Dashboardu:**

### §4.1 — Kroky pro admin/lead:

1. Přihlaš se do **Stripe Dashboard** → **Developers** → **Webhooks**
2. Vyber existující webhook endpoint pro `https://carmakler.cz/api/stripe/webhook`
3. Klikni **Add event** / **Edit events**
4. Přidej do listening events: **`account.updated`**
5. **Save**

### §4.2 — Proč je to manuální krok:

Plán §6.4 explicit: *"Manuální step (deploy): V Stripe Dashboard → Developers → Webhooks → upravit existující webhook endpoint → přidat event `account.updated` do listening events. Tohle je provozní krok, ne code change."*

Programmatic alternative (`stripe.webhookEndpoints.update()` v migration scriptu) byl označen jako křehký (vyžaduje `STRIPE_WEBHOOK_ENDPOINT_ID` v env) → ponecháno manuálně.

### §4.3 — Verifikace že manuální krok proběhl:

Po registraci eventu v Dashboardu lze otestovat přes Stripe CLI:
```
stripe trigger account.updated --connect --add account:id=<test_account_id>
```
Nebo real onboarding flow přes PWA (#161-c) až ta fáze dojede.

**Current impact:** Dokud není `account.updated` event registrován, produkční webhook případné test onboardingy **nedostanou**. Partner může přes API endpointy `/onboard-link` a `/status` onboardingovat a manual `?refresh=1` stále funguje (pull model). Push model přes webhook nefunguje dokud není event aktivovaný.

---

## §5 — Build statistika srovnání (#160 vs #166)

| Metric | #160 deploy (#88a Wolt) | #166 deploy (#161-a) | Δ |
|---|---|---|---|
| Build čas (real) | 1m39.542s | 1m49.502s | +10s |
| Compile čas | ~18s | 24.4s | +6.4s |
| Total routes | 1213 | 1216 | +3 (Connect routes) |
| PM2 Ready | 845ms | 837ms | -8ms (stejné pásmo) |
| Migration | `20260408061812_add_partner_commission_and_order_split` | `20260408093456_add_partner_stripe_onboarding_state` | +1 migration |
| Pre-existing "Too many DB connections" SSG noise | ANO | ANO | stejné |

Build rostl úměrně scope — 3 nové API routes, 1 nová migration, žádná performance regrese v runtime.

---

## §6 — Blocker resolution (žádné během tohoto deployu)

Tento deploy proběhl **čistě bez blockerů**. Nejsou potřeba escalation prompty:
- `git push` — fast-forward OK
- `migrate deploy` — non-destructive migration applied
- `prisma generate` — regenerate OK
- `build` — Compiled successfully bez type errors
- `pm2 reload` — both procs ✓

**Pre-existing issues které NEBYLY blockery ale jsou zde pro historický kontext:**
1. SSG "Too many database connections" během build — dokumentováno v #160 report, follow-up task nevytvořený (pre-existing).
2. Runtime `NoFallbackError` na `/dily/znacka/[brand]/[model]/[rok]` — pre-existing, nesouvisí s #161-a.
3. Sentry deprecation warnings — `autoInstrumentServerFunctions`, `autoInstrumentMiddleware`, `autoInstrumentAppDirectory` budou odstraněny v budoucí Sentry verzi. Pre-existing.

---

## §7 — Post-deploy TODO (pro lead / admin)

### §7.1 — IMMEDIATE (před #161-b dispatchem):

- [ ] **Manuální Stripe Dashboard step** (§4) — registrovat `account.updated` event ve webhook endpoint
- [ ] (volitelné) Smoke test: `curl -X POST https://carmakler.cz/api/stripe/connect/onboard-link` (bez auth → 401 unauthorized, potvrdí že route existuje a funguje)
- [ ] (volitelné) Stripe CLI trigger test: `stripe trigger account.updated` po registraci eventu

### §7.2 — FUTURE phases (separate tasks):

- **#167 #161-b** (next up per task description): Admin UI — `StripeOnboardingCard` v `PartnerDetail.tsx`, `StripeStatusBadge` sdílená komponenta. Plán §7.
- **#161-c** (later): Partner PWA self-service UI — `/parts/profile` Stripe card. Plán §8.
- **FU1** (follow-up): `applyCommissionSplit` upgrade — check `stripePayoutsEnabled` před commission transferem, graceful fallback na manual. Plán §11.x.
- **Pre-existing DB pool SSG fix**: optimize Prisma connection pooling nebo SSG parallelism, aby `npm run build` nehlásil "Too many database connections" warnings. Out of scope pro #166.

---

## §8 — Files deployed (git diff summary)

| File | Lines | Status |
|---|---|---|
| `prisma/schema.prisma` | +12 | M (Partner model) |
| `prisma/migrations/20260408093456_add_partner_stripe_onboarding_state/migration.sql` | +15 | A (new) |
| `lib/stripe-connect.ts` | +261 | A (new) |
| `app/api/stripe/connect/onboard-link/route.ts` | +78 | A (new) |
| `app/api/stripe/connect/status/route.ts` | +78 | A (new) |
| `app/api/stripe/connect/dashboard-link/route.ts` | +54 | A (new) |
| `app/api/stripe/webhook/route.ts` | +41 | M (add `account.updated` case + handler) |
| `.claude-context/tasks/impl-task-162-161a.md` | +240 | A (impl report) |
| `.claude-context/tasks/plan-task-161-stripe-onboarding.md` | +1643 | A (plan doc, deployed v rámci pull) |
| **TOTAL** | **+2422 insertions** | 9 files |

---

**HOTOVO** — Task #166 ready for lead review.
**Waiting for:** Lead confirmation manuálního Stripe Dashboard kroku → pak dispatch #167 IMPL #161-b.
