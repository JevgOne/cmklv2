# TASK-044: Implementace — hvězdičkový kariérní systém

**Stav:** HOTOVO
**Commit:** cc17ef7
**Datum:** 2026-04-25

## Co bylo implementováno

### Fáze 1: Core lib refaktor
- `lib/broker-points.ts` — kompletní přepis: STAR_LEVELS (5 úrovní), REGION_THRESHOLDS (4 regiony), calculateStarLevel(), calculateStarProgress(), addBrokerRevenue()
- `lib/gamification-levels.ts` — client-safe verze: STAR_LEVELS, calculateStarLevel(), calculateStarProgress()
- `lib/commission-calculator.ts` — 5 úrovní (30/40/50/55/60%), bez TIP bonusu

### Fáze 2: Prisma schema + migrace
- `prisma/schema.prisma` — Region.tier, User.level (STAR_1 default), User.totalRevenue (Int), BrokerPointTransaction.amount + revenueAtTime
- `prisma/migrations/20260425080000_star_career_system/migration.sql` — data konverze TIPAR→STAR_1, JUNIOR→STAR_2, SENIOR→STAR_3, EXPERT→STAR_4, přepočet totalRevenue
- `prisma/seed.ts` — region tier values (PRAHA/BRNO/OSTRAVA_PLZEN)

### Fáze 3: UI komponenty
- `components/pwa/gamification/LevelBadge.tsx` — 5 úrovní s ⭐ ikonami + barevné schéma
- `components/ui/LevelProgressBar.tsx` — obrat + region místo bodů, formátování v Kč

### Fáze 4: Aktualizace stránek
- `app/api/vehicles/[id]/handover/route.ts` — addBrokerRevenue (obrat = prodejní cena), star level notifikace
- `app/(pwa)/makler/stats/page.tsx` — totalRevenue, regionTier, prahy pro region, obratové transakce
- `app/(pwa)/makler/dashboard/page.tsx` — totalRevenue místo totalPoints
- `components/web/BrokerBox.tsx` — totalRevenue + regionTier props
- `app/(web)/profil/[slug]/ProfileClient.tsx` — STAR_* levels, milníky s hvězdičkami
- `app/(web)/profil/[slug]/page.tsx` — totalRevenue + region.tier query
- `lib/role-labels.ts` — LEVEL_LABELS: STAR_1→"⭐", STAR_2→"⭐⭐", ...
- `lib/gamification.ts` — re-exporty z nového systému
- `lib/badges.ts` — checkAndUpdateLevel s regionTier
- Plus: BrokerCard, BrokerGrid, makleri page, leaderboard, QuickModeToggle, SettingsContent, quick-mode API

### Fáze 5: Admin panel
- `app/(admin)/admin/career/page.tsx` — admin career page
- `components/admin/CareerOverviewContent.tsx` — tabulka prahů × regionů, přehled makléřů, filtry, CSV export
- `app/api/admin/career/route.ts` — GET brokers career data
- `app/api/admin/career/[id]/level/route.ts` — PUT level override (ADMIN/MANAGER only, jen snížení)
- `components/admin/AdminSidebar.tsx` — přidána sekce "Kariéra"

### Fáze 6: Testy
- `__tests__/lib/commission-calculator.test.ts` — 11 testů pro 5 úrovní
- `__tests__/lib/gamification.test.ts` — 15 testů pro hvězdičky + regiony
- `__tests__/lib/broker-points.test.ts` — 13 testů (nový soubor)
- **Celkem: 39 testů, všechny PASS**

## Celkem dotčených souborů: 34

## STOP pravidla
- STOP-1 (interpretace prahů): Potvrzeno leadem — STAR_1 od 0 Kč
- STOP-2 (tsvector drift): Migrate reset potřeba pro dev, migrace vytvořena manuálně
- STOP-5 (snížení úrovně): REGIONAL_DIRECTOR NEMÁ přístup k PUT /api/admin/career/[id]/level
