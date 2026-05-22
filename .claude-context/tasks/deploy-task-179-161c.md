# DEPLOY #179 — #161-c Partner PWA Stripe Connect self-service UI

**Task:** #179 DEPLOY #161-c na produkci
**Navazuje na:** #175 IMPL (`64d7478` + `e678f7c`) → #176 kontrolor ✅ → #177 evžen ✅ (0 findings) → #178 test-chrome ✅ (GREEN 11/11) → #179 DEPLOY
**Datum:** 2026-04-08
**Branch:** main
**Commity deployed:**
- `64d7478 feat(#161-c): partner PWA Stripe Connect self-service UI`
- `e678f7c refactor(#161-c): simplify per /simplify review`

---

## §1 — Canonical 7-step flow

| # | Krok | Command | Výsledek |
|---|---|---|---|
| 1 | Push | `git push origin main` | ✅ `63bf026..e678f7c main -> main` |
| 2 | Pull | `ssh server "cd /var/www/carmakler && git pull origin main"` | ✅ Fast-forward `63bf026..e678f7c`, 5 files changed, +328/-23 |
| 3 | Migrate deploy | `npx prisma migrate deploy` | ✅ `8 migrations found`, `No pending migrations to apply` (idempotent no-op jak očekáváno) |
| 4 | Prisma generate | `npx prisma generate` | ✅ `Generated Prisma Client (v7.5.0) to ./node_modules/@prisma/client in 590ms` |
| 5 | Build | `npm run build` | ✅ `Compiled successfully in 24.4s`, **EXIT_CODE=0** |
| 6 | PM2 reload | `pm2 reload all` | ✅ `[carmakler](0) ✓` + `[zajcon-firmy](2) ✓` |
| 7a | PM2 status | `pm2 status` | ✅ carmakler online, pid 2251729, uptime 10s, 0% CPU, 69.9mb, restart 63 |
| 7b | PM2 logs | `pm2 logs carmakler --lines 30 --nostream` | ✅ `Next.js 16.1.7`, `Ready in 868ms` |

**Žádné STOP triggery.** Build exit 0, pm2 graceful reload, aplikace naběhla v 868ms.

---

## §2 — Verification

### §2.1 — Git state

- Lokální commits `64d7478` + `e678f7c` pushed to `origin/main` (from `63bf026`)
- Production `/var/www/carmakler` fast-forward pull → HEAD na `e678f7c`
- 5 files changed, +328/-23 lines
- Žádné merge conflicts

### §2.2 — Pull stats (detail)

```
app/(pwa-parts)/parts/profile/page.tsx             |   4 +
components/admin/partners/StripeOnboardingCard.tsx |  28 +-
components/pwa-parts/profile/SupplierStripeCard.tsx| 283 +++++++++++++++++++++
components/{admin/partners => ui}/StripeStatusBadge.tsx |   0
lib/stripe-connect-shared.ts                       |  36 +++
```

- `StripeStatusBadge.tsx` rename 100% (admin/partners → ui) → `git pull` korektně resolved rename
- `SupplierStripeCard.tsx` (nový, 283 řádků v commit form, 265 LOC po simplify)

### §2.3 — Build output

- `Compiled successfully in 24.4s` — v normálním rozsahu (pre-existing baseline 20-25s)
- `/parts/profile` v build outputu jako `○ /parts/profile` (Static) → card self-fetch happens client-side, page šablona prerenderovaná
- Admin `/admin/partners/[id]` pre-existing (#161-b) unchanged, reimport StripeStatusBadge z nového path funguje
- Žádné nové build warnings související s #161-c

### §2.4 — PM2 post-reload stav

```
id │ name       │ status │ uptime │ cpu │ mem    │ pid     │ restarts
 0 │ carmakler  │ online │ 10s    │ 0%  │ 69.9mb │ 2251729 │ 63
 2 │ zajcon     │ online │ 10s    │ 0%  │ 92.2mb │ 2251750 │ 19
```

Oba procesy naběhly čistě, bez restart loopů. Restart counter carmakler: 63 (postupně narůstá při každém deployi, baseline 62 po #172, +1 pro tento deploy).

### §2.5 — App start logs

```
> carmakler@0.1.0 start
> next start
▲ Next.js 16.1.7
- Local:   http://localhost:3000
- Network: http://91.98.203.239:3000
✓ Starting...
✓ Ready in 868ms
```

Start time 868ms — v normálním rozsahu (baseline 800-900ms, #172 byl 814ms). Mírně vyšší start může být kvůli dodatečnému bundle size z `SupplierStripeCard` (+~8KB minified), non-signifikantní.

---

## §3 — Pre-existing noise (not blockers)

Pre-existing log noise z `pm2 logs` — **nesouvisí s #161-c**, identické s #172 deploy report §3:

1. **CSP violations `img-src`** — `https://images.unsplash.com/*` z `inzerce.carmakler.cz`. Pre-existing CSP tightening z #167, telemetry only.
2. **Sentry deprecation warnings** — `autoInstrumentServerFunctions`, `autoInstrumentMiddleware`, `autoInstrumentAppDirectory` deprecated → move to `webpack.*`. Pre-existing FU task.
3. **`Error: Internal: NoFallbackError`** v `.next/server/app/(web)/dily/znacka/[brand]/[model]/[rok]/page.js` — pre-existing z #88a dynamic routes. Non-blocking, SEO-only cesta.
4. **`prisma:error`** SSG noise z build fáze — "Too many database connections" documented in `impl-task-160-deploy-88a.md`. Non-blocking, exit 0.

**Žádné nové errory po deployi #161-c.** Zkontroloval jsem error log podrobně — žádný `SupplierStripeCard`, `stripe-connect-shared`, `/parts/profile`, nebo `/api/stripe/connect/*` entry.

---

## §4 — Scope sanity check

Per task brief:

| Check | Výsledek |
|---|---|
| Schema changes? | ✅ None — `migrate deploy` idempotent no-op |
| Prisma client regen? | ✅ Runs jako safety, žádné schema diffy |
| Nové Stripe webhook events? | ✅ None — webhook nedotčen (STOP-5) |
| `/api/partner/profile` změny? | ✅ None — endpoint nedotčen (STOP-7) |
| Manual Stripe Dashboard steps? | ✅ None — pure UI change |
| Email notifikace? | ✅ None (Q7 NO) |
| Nové API routes? | ✅ None — backend #161-a reused |

Deploy byl čistý standardní 7-step flow, žádný scope creep.

---

## §5 — Rollback plán (pokud by bylo potřeba)

Nepotřeba — deploy proběhl bez errorů. Pro referenci:

```bash
ssh server "cd /var/www/carmakler && git reset --hard 63bf026 && npx prisma generate && npm run build && pm2 reload all"
```

Protože #161-c nemění schema ani backend, reset na předchozí commit je bezpečný. Partner PWA by ztratil self-service Stripe card, ale admin UI #161-b i backend #161-a zůstanou funkční. Žádná data loss.

---

## §6 — Post-deploy ověření

### §6.1 — UI flow ověření

**Manual smoke test:** Partner (PARTS_SUPPLIER role) otevře `https://carmakler.cz/parts/profile` → vidí novou `SupplierStripeCard` sekci s 5-state badge a primary CTA podle aktuálního state.

**E2E verification:** Už proběhl v #178 test-chrome fázi (GREEN 11/11, 33.8s headed Chromium). Tento deploy je code rollout — funkční verification byla na test-chrome.

### §6.2 — Query param handling ověření

`?stripe=return` a `?stripe=refresh` handling je kryt unit + e2e testy v #178. Manuální live verification by potřebovala reálný Stripe Test mode flow — out of scope pro deploy task.

### §6.3 — Monitoring

`pm2 logs carmakler --lines 100` čistý po 10s uptime. Žádné crashes, žádné nové error patterns po deployi.

### §6.4 — Production gating reminder

Per task brief + memory `project_marketplace_gating`: `https://carmakler.cz` má SOFT LAUNCH nginx basic auth (401 přes curl). Sanity check přes `pm2 logs` + `pm2 status`, ne curl.

---

## §7 — Deploy metriky

| Metrika | Hodnota | Baseline |
|---|---|---|
| Build time | 24.4s | 20-25s (normal) |
| App start time | 868ms | 800-900ms (normal) |
| Files changed | 5 | — |
| Lines added/removed | +328 / -23 | — |
| Downtime | ~0s | pm2 graceful reload |
| Bundle delta | ~+8KB min | SupplierStripeCard |
| Total deploy duration | ~3 min | pull → generate → build → reload |

---

## §8 — Pipeline status — #161 pipeline **KOMPLETNĚ UZAVŘEN**

### Backend (#161-a):
- ✅ #162 IMPL — commit `2bf0657`
- ✅ #163 kontrolor
- ✅ #164 evžen
- ✅ #165 test-chrome
- ✅ #166 deploy (+ manual Stripe Dashboard `account.updated` event registration pending user action — documented in #161-a deploy report, nesouvisí s #161-c)

### Admin UI (#161-b):
- ✅ #168 IMPL — commit `63bf026`
- ✅ #169 kontrolor
- ✅ #170 evžen
- ✅ #171 test-chrome
- ✅ #172 DEPLOY

### Partner PWA UI (#161-c):
- ✅ #175 IMPL — commity `64d7478` + `e678f7c`
- ✅ #176 kontrolor
- ✅ #177 evžen (0 findings)
- ✅ #178 test-chrome (GREEN 11/11)
- ✅ **#179 DEPLOY (tento task)**

**Pipeline #161 je KOMPLETNÍ.** Stripe Connect Express onboarding je plně funkční across celá platforma (backend + admin self-service + partner self-service UI).

---

## §9 — Post-pipeline state — co zůstává otevřené

**Jedna manuální akce zůstává z #161-a (nesouvisí s #161-c):**
- Stripe Dashboard webhook event `account.updated` registration
- Dokud uživatel neprovede, push-model webhook sync zůstává OFF
- Pull-model (`?stripe=return` → force refresh) funguje plně, takže #161-c PWA UI nezávisí na tomto

Karta nezměnila tento stav — je z #161-a, dokumentováno v tamním deploy reportu.

---

**HOTOVO** — Task #179 complete. Commity `64d7478` + `e678f7c` na produkci, všechny health checks ✅. Pipeline #161 uzavřena.
