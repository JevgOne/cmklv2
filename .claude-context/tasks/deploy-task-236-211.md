# Deploy Report — Task #236 PWA Partner C1-C7 + fix

## Datum: 2026-04-11

## Commits deployed (279f8fc → 17d87b5)
8 commits — PWA Partner complete feature set:
- C1: PartnerBottomNav + mobile layout
- C2: Vehicle detail/edit with image carousel
- C3: Part detail/edit with DeletePartDialog
- C4: Order detail with status actions
- C5: PhotoUpload component + integrations
- C6: Partner onboarding (3 steps + middleware)
- C7: OfflineBanner + OnlineStatusProvider
- Fix: upload_preset in PhotoUpload + onboarding docs

## Deploy flow
| Step | Výsledek |
|------|----------|
| `git push origin main` | ✅ 279f8fc..17d87b5 |
| `git pull origin main` (server) | ✅ Fast-forward, 27 files, +2667/-15 |
| `prisma migrate deploy` | ⏭️ Skipped (no schema changes) |
| `prisma generate` | ⏭️ Skipped (no schema changes) |
| `npm run build` | ✅ All routes compiled |
| `pm2 reload all` | ✅ carmakler(0) ✓ |
| `pm2 status` | ✅ online, pid 2685988 |
| `pm2 logs` | ✅ Next.js 16.1.7 Ready in 865ms |

## Poznámky
- Žádné DB schema změny → prisma kroky přeskočeny
- Pouze Sentry deprecation warnings v error logu (pre-existing, non-blocking)
- Production behind nginx basic auth (soft launch) — 401 z curl je očekávaný
