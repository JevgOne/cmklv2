-- Rename User.totalPoints → User.totalSalesVolume
ALTER TABLE "User" RENAME COLUMN "totalPoints" TO "totalSalesVolume";

-- Change default level from TIPAR to MAKLER
ALTER TABLE "User" ALTER COLUMN "level" SET DEFAULT 'MAKLER';

-- Migrate TIPAR → MAKLER in existing data
UPDATE "User" SET level = 'MAKLER' WHERE level = 'TIPAR';

-- Rename BrokerPointTransaction → BrokerSalesRecord
ALTER TABLE "BrokerPointTransaction" RENAME TO "BrokerSalesRecord";

-- Rename points → amount column
ALTER TABLE "BrokerSalesRecord" RENAME COLUMN "points" TO "amount";

-- Rename constraints and indexes
ALTER TABLE "BrokerSalesRecord" RENAME CONSTRAINT "BrokerPointTransaction_pkey" TO "BrokerSalesRecord_pkey";
ALTER TABLE "BrokerSalesRecord" RENAME CONSTRAINT "BrokerPointTransaction_brokerId_fkey" TO "BrokerSalesRecord_brokerId_fkey";
ALTER INDEX "BrokerPointTransaction_brokerId_idx" RENAME TO "BrokerSalesRecord_brokerId_idx";
ALTER INDEX "BrokerPointTransaction_type_idx" RENAME TO "BrokerSalesRecord_type_idx";
ALTER INDEX "BrokerPointTransaction_createdAt_idx" RENAME TO "BrokerSalesRecord_createdAt_idx";
