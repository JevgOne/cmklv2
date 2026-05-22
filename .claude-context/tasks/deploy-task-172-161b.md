# DEPLOY #172 — #161-b Admin UI Stripe Connect onboarding

**Task:** #172 DEPLOY #161-b na produkci
**Navazuje na:** #168 IMPL (commit `63bf026`) → #169 kontrolor ✅ → #170 evžen ✅ → #171 test-chrome ✅ → #172 DEPLOY
**Datum:** 2026-04-08
**Branch:** main
**Commit deployed:** `63bf026 feat(#161-b): admin Stripe Connect onboarding UI`

---

## §1 — Canonical 7-step flow

| # | Krok | Command | Výsledek |
|---|---|---|---|
| 1 | Push | `git push origin main` | ✅ `2bf0657..63bf026 main -> main` |
| 2 | Pull | `ssh server "cd /var/www/carmakler && git pull origin main"` | ✅ Fast-forward, 7 files changed, 433 insertions(+), 103 deletions(-) |
| 3 | Migrate deploy | `npx prisma migrate deploy` | ✅ `No pending migrations to apply` (žádné schema změny v #161-b) |
| 4 | Prisma generate | `npx prisma generate` | ✅ `Generated Prisma Client (v7.5.0) in 628ms` |
| 5 | Build | `npm run build` | ✅ `Compiled successfully`, `EXIT_CODE=0` |
| 6 | PM2 reload | `pm2 reload all` | ✅ `[carmakler](0) ✓` + `[zajcon-firmy](2) ✓` |
| 7a | PM2 status | `pm2 status` | ✅ `carmakler` online, pid 2234979, mem 69.6mb, 0% CPU |
| 7b | PM2 logs | `pm2 logs carmakler --lines 30 --nostream` | ✅ `Next.js 16.1.7`, `Ready in 814ms` |

**Žádné STOP triggery.** Build exit code 0, pm2 reload clean, aplikace zdravě naběhla.

---

## §2 — Verification

### §2.1 — Git state

- Lokální commit `63bf026` pushed to `origin/main`
- Production `/var/www/carmakler` na stejném commitu po fast-forward pullu
- Žádné merge conflicts, žádné stash needed

### §2.2 — Build output

- `Compiled successfully in 23.8s`
- Service worker bundled: `(serwist) Bundling the service worker script with the URL '/sw.js'`
- Static generation: 1216 SSG pages
- 3 Connect routes (`/api/stripe/connect/onboard-link`, `/status`, `/dashboard-link`) pre-existing z #161-a, unchanged
- Nové admin komponenty jsou client-side, netěží na SSG

### §2.3 — PM2 post-reload stav

```
id │ name       │ status │ uptime │ cpu │ mem    │ pid
 0 │ carmakler  │ online │ 10s    │ 0%  │ 69.6mb │ 2234979
 2 │ zajcon     │ online │ 9s     │ 0%  │ 92.1mb │ 2235000
```

Oba procesy naběhly čistě, bez restart loopů. Restart counter u carmakler: 62 (postupně narůstá při každém deployi, stabilní).

### §2.4 — App start logs

```
carmakler@0.1.0 start
> next start
▲ Next.js 16.1.7
- Local:   http://localhost:3000
- Network: http://91.98.203.239:3000
✓ Starting...
✓ Ready in 814ms
```

Start time 814ms — v normálním rozsahu (pre-existing baseline ~800-900ms).

---

## §3 — Pre-existing noise (not blockers)

Pre-existing log noise z `pm2 logs` — **nesouvisí s #161-b**, dokumentováno v dřívějších deploy reportech:

1. **`prisma:error` SSG noise** — "Too many database connections" během `npm run build` static generation. Pre-existing, dokumentováno v `impl-task-160-deploy-88a.md`. Non-blocking — build finishes with exit 0.

2. **CSP violations `img-src`** — `https://images.unsplash.com/*` z `inzerce.carmakler.cz`. Pre-existing CSP tightening z #167, production telemetry only.

3. **Sentry deprecation warnings** — `autoInstrumentServerFunctions`, `autoInstrumentMiddleware`, `autoInstrumentAppDirectory` deprecated, move to `webpack.*`. Pre-existing, follow-up Sentry upgrade task.

4. **`Error: Internal: NoFallbackError` v `/dily/znacka/[brand]/[model]/[rok]`** — pre-existing runtime fallback error z #88a dynamic routes, dokumentováno v `impl-task-160-deploy-88a.md`. Non-blocking (routes vrátí 500 při missing fallback, SEO-only cesta).

**Žádné nové errory po deployi #161-b.**

---

## §4 — Scope sanity check

Per task brief:

| Check | Výsledek |
|---|---|
| Schema changes? | ✅ None (`migrate deploy` = no pending migrations) |
| Nové Stripe webhook events? | ✅ None (`account.updated` už v Dashboardu z #161-a) |
| Manual deploy steps? | ✅ None (čistě UI change) |
| PWA changes? | ✅ None (PWA self-service je #161-c, separátní task) |
| Backend refactoring? | ✅ None (#161-a v produkci, nezasahováno) |
| Test infrastructure? | ✅ None |

Deploy byl čistě standardní 7-step flow, žádné scope creep.

---

## §5 — Rollback plán (pokud by bylo potřeba)

Nepotřeba — deploy proběhl bez errorů. Pro referenci, rollback by byl:

```bash
ssh server "cd /var/www/carmakler && git reset --hard 2bf0657 && npx prisma generate && npm run build && pm2 reload all"
```

Protože #161-b nemění schema, reset na předchozí commit je bezpečný (žádné data migration undoing needed).

---

## §6 — Post-deploy ověření

**UI flow ověření (manual smoke test):** Admin otevře `/admin/partners/[id]` → vidí novou `StripeOnboardingCard` sekci s 5-state badge → buttons "Zkopírovat onboarding link" / "Sync ze Stripe" podle state.

**E2E verification:** Už proběhl v #171 test-chrome fázi před deployem. Tento deploy je code rollout — funkční verification byla na test-chrome.

**Monitoring:** `pm2 logs carmakler --lines 100` čistý po 10s uptime. Žádné crashes, žádné nové error patterns.

---

## §7 — Deploy metriky

| Metrika | Hodnota |
|---|---|
| Build time | 23.8s |
| App start time | 814ms |
| Files changed | 7 |
| Lines added/removed | +433 / -103 |
| Downtime | ~0s (pm2 graceful reload) |
| Total deploy duration | ~2 min (pull + generate + build + reload) |

---

## §8 — Pipeline status

- ✅ #168 IMPL — commit `63bf026`
- ✅ #169 kontrolor — PASS
- ✅ #170 evžen — PASS
- ✅ #171 test-chrome — PASS
- ✅ #172 DEPLOY — **PRODUCTION LIVE** (tento task)

#161-b je live na produkci. Admin UI Stripe Connect onboarding je dostupný v `/admin/partners/[id]` pro všechny partnery.

---

**HOTOVO** — Task #172 complete. Commit `63bf026` na produkci, všechny health checks ✅.
