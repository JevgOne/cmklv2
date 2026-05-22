# DEPLOY #226 — PWA Díly C1-C5 + z-index fix

**Datum:** 2026-04-11
**Commits deployed:** 31d894c, 2fa39f3, 51596f3, ccc9ae4, 279f8fc + plan docs
**Range:** 00f05ac..279f8fc (17 files, +2691/-1)

---

## Deploy steps

| # | Step | Status |
|---|------|--------|
| 1 | `git push origin main` | ✅ 00f05ac..279f8fc |
| 2 | `ssh server` + `git pull` | ✅ Fast-forward, 17 files |
| 3 | `npx prisma migrate deploy` | SKIPPED (no schema changes) |
| 4 | `npx prisma generate` | ✅ Generated Prisma Client v7.5.0 (661ms) |
| 5 | `npm run build` | ✅ EXIT=0 |
| 6 | `pm2 reload carmakler` | ✅ PID 2674097 |
| 7 | `pm2 status` | ✅ online, 69.9mb |
| 8 | `pm2 logs` | ✅ Ready in 800ms |

---

## Verification

- PM2 status: **online** ✅
- Startup: **Ready in 800ms** ✅
- No errors in logs (only Sentry deprecation warnings — pre-existing)
- No DB migration needed (no schema changes in C1-C5)

---

## Deployed features

1. **Part detail page** — `/parts/[id]` with image carousel, badges, compatibility
2. **Part edit page** — `/parts/[id]/edit` with wizard reuse
3. **Delete dialog** — with z-[60] fix above BottomNav
4. **PartCard link fix** — navigates to detail instead of /parts/my
5. **Supplier onboarding** — 3-step flow with middleware redirect + API
6. **Loading/error states** — skeletons + error boundary for part routes
7. **Diacritics fix** — all Czech UI texts corrected
