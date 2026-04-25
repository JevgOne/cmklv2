-- AlterTable: User — add totalPoints, change level default
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalPoints" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ALTER COLUMN "level" SET DEFAULT 'TIPAR';

-- CreateTable: BrokerPointTransaction
CREATE TABLE IF NOT EXISTS "BrokerPointTransaction" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "vehicleId" TEXT,
    "commissionId" TEXT,
    "description" TEXT,
    "sourceAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrokerPointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BrokerPointTransaction_brokerId_idx" ON "BrokerPointTransaction"("brokerId");
CREATE INDEX IF NOT EXISTS "BrokerPointTransaction_type_idx" ON "BrokerPointTransaction"("type");
CREATE INDEX IF NOT EXISTS "BrokerPointTransaction_createdAt_idx" ON "BrokerPointTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "BrokerPointTransaction" ADD CONSTRAINT "BrokerPointTransaction_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate existing levels to new system
UPDATE "User" SET level = 'TIPAR' WHERE level = 'JUNIOR' AND "totalSales" < 5;
UPDATE "User" SET level = 'JUNIOR' WHERE level = 'BROKER';
UPDATE "User" SET level = 'EXPERT' WHERE level = 'TOP';
