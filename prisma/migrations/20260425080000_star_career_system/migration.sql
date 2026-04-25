-- Star Career System Migration
-- Converts the old point-based 4-level system (TIPAR/JUNIOR/SENIOR/EXPERT)
-- to a new star-based 5-level system (STAR_1..STAR_5) with regional thresholds.

-- 1. Add tier to Region
ALTER TABLE "Region" ADD COLUMN IF NOT EXISTS "tier" TEXT NOT NULL DEFAULT 'SMALL';

-- 2. Set region tiers
UPDATE "Region" SET "tier" = 'PRAHA' WHERE "name" = 'Praha';
UPDATE "Region" SET "tier" = 'BRNO' WHERE "name" = 'Jihomoravský';
UPDATE "Region" SET "tier" = 'OSTRAVA_PLZEN' WHERE "name" = 'Moravskoslezský';

-- 3. Add totalRevenue to User (Int, default 0)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalRevenue" INTEGER NOT NULL DEFAULT 0;

-- 4. Convert level values (TIPAR→STAR_1, JUNIOR→STAR_2, SENIOR→STAR_3, EXPERT→STAR_4)
UPDATE "User" SET "level" = 'STAR_1' WHERE "level" = 'TIPAR';
UPDATE "User" SET "level" = 'STAR_2' WHERE "level" = 'JUNIOR';
UPDATE "User" SET "level" = 'STAR_3' WHERE "level" = 'SENIOR';
UPDATE "User" SET "level" = 'STAR_4' WHERE "level" = 'EXPERT';

-- 5. Set default for new users
ALTER TABLE "User" ALTER COLUMN "level" SET DEFAULT 'STAR_1';

-- 6. Recalculate totalRevenue from Commission.salePrice
UPDATE "User" u SET "totalRevenue" = COALESCE((
  SELECT SUM(c."salePrice") FROM "Commission" c WHERE c."brokerId" = u."id"
), 0) WHERE u."role" = 'BROKER';

-- 7. Remove old totalPoints column (if exists)
ALTER TABLE "User" DROP COLUMN IF EXISTS "totalPoints";

-- 8. BrokerPointTransaction: add amount + revenueAtTime, migrate data
ALTER TABLE "BrokerPointTransaction" ADD COLUMN IF NOT EXISTS "amount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BrokerPointTransaction" ADD COLUMN IF NOT EXISTS "revenueAtTime" INTEGER;

-- Migrate old points data: amount = sourceAmount (actual sale amount)
UPDATE "BrokerPointTransaction" SET "amount" = COALESCE("sourceAmount", 0) WHERE "amount" = 0;

-- 9. Drop old columns from BrokerPointTransaction
ALTER TABLE "BrokerPointTransaction" DROP COLUMN IF EXISTS "points";
ALTER TABLE "BrokerPointTransaction" DROP COLUMN IF EXISTS "sourceAmount";
